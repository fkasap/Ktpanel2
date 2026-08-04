/* KTPanel — OTOMATİK TAZELEME
 *
 * Akış:  çek → hesapla → DENETLE → değiştiyse yaz → rapor
 *
 * TEMEL FİKİR — ÇARPAN/FİYAT AYRIŞMASI:
 * Damgalanan şey FİYAT değil, ÇARPAN olmalı. Örnek: xk100.json ağırlık
 * (%20,23) tutarsa her gün bayatlar; serbest dolaşım PAY ADEDİ tutarsa
 * çeyrekte bir değişir ve ağırlık her gün Yahoo fiyatıyla YENİDEN HESAPLANIR.
 * Aynı desen multiple.json (bilanço kalemleri sabit, fiyat canlı) ve
 * track.json (holdings sabit, fiyat canlı) için de geçerli.
 * Sonuç: elle tazeleme 438/yıl → ~32/yıl.
 *
 * Çalıştırma:  node scripts/tazele.mjs --katman=hepsi|fiyat|endeks|fon
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { KURALLAR, denetle } from './denetim.mjs';

/* VERİ DİZİNİ — otomatik bulunur.
   Repo yapısı iki türlü olabilir:
     Ktpanel2/index.html              → veri kökte
     Ktpanel2/ktpanel/index.html      → veri alt klasörde (Vercel Root Directory
                                        ayarı bu duruma göre yapılmış)
   İş akışı HER ZAMAN repo kökünden koşar (.github/workflows orada olmak
   zorunda), o yüzden veri dizini aranarak bulunur. Ayar dosyası tutmak yerine
   arama yapmak daha sağlam: klasör adı değişirse de çalışır. */
import { existsSync } from 'node:fs';
const ADAYLAR = [process.cwd(), path.join(process.cwd(), 'ktpanel'),
                 path.join(process.cwd(), 'panel'), path.join(process.cwd(), 'public')];
const KOK = ADAYLAR.find(d => existsSync(path.join(d, 'index.html'))) || process.cwd();
const bugun = new Date().toISOString().slice(0, 10);
const arg = k => (process.argv.find(a => a.startsWith(`--${k}=`)) || '').split('=')[1] || '';
const KATMAN = arg('katman') || 'hepsi';
const ister = k => KATMAN === 'hepsi' || KATMAN === k;

const raporlar = [];
const degisenler = [];
let denetimDustu = false;

const oku = async p => JSON.parse(await fs.readFile(path.join(KOK, p), 'utf8'));
const yaz = async (p, d) => fs.writeFile(path.join(KOK, p), JSON.stringify(d, null, 1), 'utf8');
const varMi = async p => fs.access(path.join(KOK, p)).then(() => true, () => false);

/* ── YAHOO: toplu kapanış fiyatı ────────────────────────────────────────────
   /v8/finance/chart uç noktası — crumb GEREKTİRMEZ (§176'da ölçüldü;
   /v10/quoteSummary gerektirir, o yüzden kullanılmıyor).
   Eşzamanlılık 12: 160 sembol ~14 tur, Actions'ın süre bütçesine rahat sığar. */
async function yahooFiyat(kodlar, ekle = '.IS') {
  const havuz = async (items, fn, n) => {
    const out = new Array(items.length); let i = 0;
    const isci = async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k]); } };
    await Promise.all(Array.from({ length: Math.min(n, items.length) }, isci));
    return out;
  };
  const tek = async kod => {
    try {
      const u = 'https://query1.finance.yahoo.com/v8/finance/chart/' +
        encodeURIComponent(kod + ekle) + '?interval=1d&range=5d';
      const r = await fetch(u, {
        headers: { 'User-Agent': 'Mozilla/5.0 (KtPanel/1.0)' },
        signal: AbortSignal.timeout(12000)
      });
      if (!r.ok) return null;
      const j = await r.json();
      const d = j?.chart?.result?.[0];
      const c = d?.indicators?.quote?.[0]?.close || [];
      const t = d?.timestamp || [];
      for (let i = c.length - 1; i >= 0; i--) {
        if (typeof c[i] === 'number' && isFinite(c[i]) && c[i] > 0) {
          return { kod, fiyat: +c[i].toFixed(4), tarih: new Date(t[i] * 1000).toISOString().slice(0, 10) };
        }
      }
      return null;
    } catch { return null; }
  };
  const sonuc = await havuz(kodlar, tek, 12);
  const harita = {};
  sonuc.filter(Boolean).forEach(x => { harita[x.kod] = x; });
  return harita;
}

/* ── ENDEKS AĞIRLIKLARI ─────────────────────────────────────────────────────
   Dosya `pay_adedi` tutar (serbest dolaşım, çeyreklik değişir).
   Ağırlık = pay_adedi × fiyat / toplam — HER GÜN yeniden hesaplanır.
   GERİYE UYUM: dosyada `pay_adedi` yoksa (eski biçim) katman ATLANIR ve
   raporda göç gerektiği yazılır. Sessizce eski ağırlıkla devam ETMEZ. */
async function endeksTazele(dosya, ad) {
  if (!(await varMi(dosya))) return null;
  const d = await oku(dosya);
  const pa = d.pay_adedi;
  if (!pa || !Object.keys(pa).length) {
    raporlar.push(`### ${ad} — ⏭ ATLANDI\n- \`pay_adedi\` alanı yok (eski biçim). Göç gerekli: ağırlık yerine serbest dolaşım pay adedi saklanmalı.`);
    return null;
  }
  const kodlar = Object.keys(pa);
  const f = await yahooFiyat(kodlar);
  const kapsanan = kodlar.filter(k => f[k]);

  const sd = {};
  let toplamSD = 0;
  kapsanan.forEach(k => { const v = pa[k] * f[k].fiyat; sd[k] = v; toplamSD += v; });

  /* PAYDA — tüm üyelerin serbest dolaşım PD'si olmalı, yalnız kapsananların
     değil. Aksi halde ağırlıklar 100'e normalize olur ve gerçek endeks ağırlığı
     kaybolur (XKTUM'da 242 üyenin 150'si yazılı, toplam ~96,5 olmalı).

     İLK DENEME YANLIŞTI: payda = (toplamSD / kapsanan) × toplam_uye
     Bu, "eksik üyelerin ortalama büyüklüğü kapsananlarınkine eşit" varsayar.
     DEĞİL — kapsananlar EN BÜYÜKLER, eksikler ince kuyruk. XKTUM'da payda
     1,61 kat şişti ve toplam 96,5 yerine 61,98 çıktı. Denetim yakaladı.

     DOĞRUSU: kapsama oranı zaten biliniyor (kapsanan_agirlik_hedef = 96,5).
     payda = toplamSD / (hedef/100). Kendi kendine tutarlı, varsayım yok. */
  const hedefOran = (d.kapsanan_agirlik_hedef ?? 100) / 100;
  const payda = toplamSD / hedefOran;
  const uyeler = {};
  kapsanan.forEach(k => { uyeler[k] = +(sd[k] / payda * 100).toFixed(4); });
  const toplamAgirlik = Object.values(uyeler).reduce((a, b) => a + b, 0);

  const kontrol = [
    KURALLAR.kapsam(kapsanan.length, kodlar.length, 0.95),
    KURALLAR.tarihBirligi(kapsanan.map(k => f[k]), 'tarih'),
    KURALLAR.toplam(toplamAgirlik, d.kapsanan_agirlik_hedef ?? 100, 3)
  ];
  const s = denetle(ad, kontrol);
  raporlar.push(s.rapor());
  if (!s.gecti) { denetimDustu = true; return null; }

  const eskiler = JSON.stringify(d.uyeler || {});
  d.uyeler = uyeler;
  d.tarih = bugun;
  d.fiyat_tarihi = f[kapsanan[0]].tarih;
  d.kapsanan_agirlik = +toplamAgirlik.toFixed(2);
  d._hesap = 'Ağırlık = pay_adedi × Yahoo kapanış / toplam. pay_adedi çeyreklik elle tazelenir.';
  if (JSON.stringify(uyeler) !== eskiler) { await yaz(dosya, d); degisenler.push(ad); }
  return uyeler;
}

/* ── ÇARPAN DOSYALARI (multiple / track) ────────────────────────────────────
   Bunlar ZATEN doğru yapıda: bileşenler (adet, ciro, ebitda, netBorç /
   holdings, p0) sabit; yalnız `fiyat` / `p` tazelenir. Göç gerekmiyor. */
async function fiyatTazele(dosya, ad, kodAlan, fiyatAlan, listeYolu) {
  if (!(await varMi(dosya))) return null;
  const d = await oku(dosya);
  const liste = listeYolu.split('.').reduce((o, k) => o?.[k], d);
  if (!Array.isArray(liste) || !liste.length) return null;

  const kodlar = liste.map(x => x[kodAlan]).filter(Boolean);
  const f = await yahooFiyat(kodlar);
  const kapsanan = kodlar.filter(k => f[k]);

  /* §245s AYKIRI ARTIK KATMANI DÜŞÜRMÜYOR — KARANTİNAYA ALIYOR.
     1 Ağu: YEOTK %133,8 bedelsiz sermaye artırımı (hak kullanımı 31 Tem) →
     fiyat o gün bölündü, referansa göre −%59. Süzgeç GÖREVİNİ YAPTI: bu
     fiyat eski sermaye yapısındaki referansla karşılaştırılamaz, çarpan
     hesabına girmemeli. AMA eski akış `if(!s.gecti) return null` diyordu:
     BİR hissenin meşru kurumsal işlemi 141 hissenin TAMAMININ güncellenmesini
     engelliyordu. Bilanço sezonunda bedelsiz yağmuru olur — her seferinde
     bütün katman donar, fiyatlar günlerce bayatlar. Orantısız.
     YENİ: aykırı hisseler KARANTİNAYA alınır — fiyatları GÜNCELLENMEZ
     (referans eski yapıda, yeni fiyat yazmak çarpanı bozar), kodları dosyaya
     `_karantina` olarak yazılır, rapor "elle bak: pay adedi + referans fiyat
     birlikte güncellenmeli" der. Kalan hisseler NORMAL güncellenir.
     Kapsam ve tarih birliği düşürmeye devam eder — onlar kaynak arızasıdır,
     kurumsal işlem değil. */
  const kontrol = [
    KURALLAR.kapsam(kapsanan.length, kodlar.length, 0.95),
    KURALLAR.tarihBirligi(kapsanan.map(k => f[k]), 'tarih')
  ];
  const aykiriSonuc = KURALLAR.aykiri(
    liste.filter(x => f[x[kodAlan]] && x[fiyatAlan])
      .map(x => ({ kod: x[kodAlan], d: (f[x[kodAlan]].fiyat / x[fiyatAlan] - 1) * 100 })),
    'd', 25);
  const karantina = new Set(
    (aykiriSonuc.gecti ? [] : (aykiriSonuc.detay || '').split(' · '))
      .map(t => String(t).split(':')[0]).filter(Boolean));
  /* aykırı sonucu rapora bilgi olarak girer ama geçti/kaldı hesabına girmez */
  aykiriSonuc.gecti = true;
  aykiriSonuc.mesaj = karantina.size
    ? `${karantina.size} hisse KARANTİNADA (±%25 aşımı — kurumsal işlem olası): ${[...karantina].join(', ')} → pay adedi + referans fiyat ELLE güncellenmeli`
    : aykiriSonuc.mesaj;
  kontrol.push(aykiriSonuc);

  const s = denetle(ad, kontrol);
  raporlar.push(s.rapor());
  if (!s.gecti) { denetimDustu = true; return null; }

  let n = 0;
  liste.forEach(x => {
    const k = x[kodAlan];
    if (karantina.has(k)) return;                      /* karantinadaki fiyata DOKUNMA */
    if (f[k] && x[fiyatAlan] !== f[k].fiyat) { x[fiyatAlan] = f[k].fiyat; n++; }
  });
  if (karantina.size) d._karantina = { kodlar: [...karantina], tarih: bugun,
    not: 'Fiyat referansla ±%25 üstü ayrıştı — kurumsal işlem (bedelsiz/bölünme) olası. Pay adedi ve referans fiyat birlikte elle güncellenene dek fiyat tazelenmez.' };
  else delete d._karantina;
  if (n || karantina.size) {
    d.fiyat_tarihi = f[kapsanan[0]].tarih;
    d.guncelleme = bugun;
    await yaz(dosya, d);
    degisenler.push(`${ad} (${n} fiyat${karantina.size ? ` · ${karantina.size} karantina` : ''})`);
  }
  return n;
}

/* ── RİSK METRİKLERİ (vol · beta) ────────────────────────────────────────────
   Saf hesap — dış kaynak GEREKMEZ, yalnız fiyat serisi.
     vol  = günlük getirilerin std sapması × √252   (yıllıklandırılmış, %)
     beta = kov(hisse, endeks) / var(endeks)
   Endeks olarak XKTUM kullanılıyor: panelin sicil karşılaştırması da onu
   kullanıyor (track.json endeks_kapanis), böylece beta ile sicil AYNI TABANDAN
   ölçülüyor. XU100 kullanılsaydı iki metrik farklı evrene bakardı (§114 dersi).

   ORTAK GÜN ŞARTI: hisse ve endeks serisi AYNI GÜNLERDE hizalanır. Yahoo bazı
   günleri atlayabilir (tatil, işlem yok); hizalamadan hesaplanan beta yanlış
   çıkar ve bu SESSİZ bir hatadır — sayı makul görünür. */
async function yahooSeri(kodlar, ekle = '.IS', aralik = '1y') {
  const havuz = async (items, fn, n) => {
    const out = new Array(items.length); let i = 0;
    const isci = async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k]); } };
    await Promise.all(Array.from({ length: Math.min(n, items.length) }, isci));
    return out;
  };
  const tek = async kod => {
    try {
      const u = 'https://query1.finance.yahoo.com/v8/finance/chart/' +
        encodeURIComponent(kod + ekle) + '?interval=1d&range=' + aralik;
      const r = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0 (KtPanel/1.0)' },
        signal: AbortSignal.timeout(15000) });
      if (!r.ok) return null;
      const j = await r.json();
      const d = j?.chart?.result?.[0];
      /* DÜZELTİLMİŞ SERİ ŞART. `quote[0].close` HAM kapanıştır — bölünme ve
         bedelsiz için düzeltilmez, seride sıçrama bırakır ve oynaklığı
         patlatır. İlk koşuda POLHO %325,40 vol verdi; gerçek değil, bölünme
         artığı. `adjclose` düzeltilmiş olanıdır.
         §149'daki "dağıtım tuzağı"nın hisse serisi versiyonu: orada fon
         fiyatı kâr payı için düzeltilmemişti, burada hisse fiyatı bölünme
         için. Aynı hata, farklı varlık. */
      const adj = d?.indicators?.adjclose?.[0]?.adjclose;
      const ham = d?.indicators?.quote?.[0]?.close;
      const c = (Array.isArray(adj) && adj.some(x => typeof x === 'number')) ? adj : (ham || []);
      const duzeltilmis = c === adj;
      const t = d?.timestamp || [];
      const seri = new Map();
      for (let i = 0; i < c.length; i++) {
        if (typeof c[i] === 'number' && isFinite(c[i]) && c[i] > 0) {
          seri.set(new Date(t[i] * 1000).toISOString().slice(0, 10), c[i]);
        }
      }
      return seri.size > 30 ? { kod, seri, duzeltilmis } : null;
    } catch { return null; }
  };
  const sonuc = await havuz(kodlar, tek, 10);
  const harita = {};
  const hamKalan = [];
  sonuc.filter(Boolean).forEach(x => { harita[x.kod] = x.seri; if (!x.duzeltilmis) hamKalan.push(x.kod); });
  harita.__hamKalan = hamKalan;      // düzeltilmiş seri bulunamayanlar — raporlanır
  return harita;
}

async function riskTazele() {
  const dosya = 'risk.json';
  if (!(await varMi(dosya))) return null;
  const d = await oku(dosya);
  const liste = d.hisseler || [];
  if (!liste.length) return null;
  const kodlar = liste.map(x => x.k).filter(Boolean);

  /* ENDEKS SERİSİ — YEDEKLİ ZİNCİR.
     İlk denemede XKTUM.IS boş döndü. Yahoo'nun BIST endeks sembolleri
     tutarsız: bazıları `.IS` ekiyle, bazıları `^` önekiyle, bazıları hiç yok.
     Hisse serileri sorunsuz geldiğine göre sorun Yahoo erişiminde değil,
     SEMBOLDE. Sırayla denenir ve HANGİSİNİN tuttuğu raporlanır.
     XKTUM tercih edilir (panelin sicili de onu kullanıyor, aynı taban);
     bulunamazsa XU100'e düşülür ve bu kartta AÇIKÇA yazılır — beta hangi
     endekse göre ölçüldüğü bilinmeden okunamaz. */
  const ENDEKS_ADAY = [
    { kod: 'XKTUM', ekle: '.IS' }, { kod: '^XKTUM', ekle: '' },
    { kod: 'XU100', ekle: '.IS' }, { kod: '^XU100', ekle: '' }
  ];
  let eSeri = null, eKod = null, denemeler = [];
  for (const a of ENDEKS_ADAY) {
    const h = await yahooSeri([a.kod], a.ekle);
    const boy = h[a.kod] ? h[a.kod].size : 0;
    denemeler.push(`${a.kod}${a.ekle}: ${boy || 'boş'}`);
    if (h[a.kod]) { eSeri = h[a.kod]; eKod = a.kod + a.ekle; break; }
  }
  if (!eSeri) {
    raporlar.push('### Risk metrikleri — ✗ ENDEKS SERİSİ ALINAMADI\n' +
      '- Denenen semboller: ' + denemeler.join(' · ') + '\n' +
      '- Beta hesaplanamaz, katman atlandı. Hisse serileri çalışıyorsa sorun SEMBOLDEDİR.');
    denetimDustu = true; return null;
  }
  const hSerileri = await yahooSeri(kodlar);
  const hamKalan = hSerileri.__hamKalan || [];
  const kapsanan = kodlar.filter(k => hSerileri[k]);

  /* KURUMSAL İŞLEM SÜZGECİ — BIST fiyat limiti ±%10.
     Bunu aşan tek günlük hareket FİYAT HAREKETİ OLAMAZ; bölünme, bedelsiz ya
     da sermaye artırımıdır. Yahoo'nun adjclose'u BIST'te bunları tam
     düzeltmiyor — POLHO %325,40 vol verdi ve adjclose'a geçmek DEĞİŞTİRMEDİ.
     Sınır %20 tutuldu (limitin iki katı): tavan-taban serisi ya da seans
     kesintisi gibi meşru uç durumlara alan bırakır, kurumsal işlemi yakalar.
     Atılan gün SAYILIR ve raporlanır — sessizce yutulmaz.
     §149'un aynı mantığı: orada fon dağıtımı, burada hisse bölünmesi. */
  const LIMIT = 0.20;
  let atlananGun = 0;
  const getiriler = (seri, gunler) => {
    const g = [];
    for (let i = 1; i < gunler.length; i++) {
      const a = seri.get(gunler[i - 1]), b = seri.get(gunler[i]);
      if (!(a > 0 && b > 0)) continue;
      const r = b / a - 1;
      if (Math.abs(r) > LIMIT) { atlananGun++; g.push(null); continue; }  // yer korunur
      g.push(r);
    }
    return g;
  };
  const ortalama = a => a.reduce((s, x) => s + x, 0) / a.length;
  const hesapla = (hSeri) => {
    /* ORTAK GÜNLER — iki serinin kesişimi, tarih sırasına göre */
    const ortak = [...hSeri.keys()].filter(g => eSeri.has(g)).sort();
    if (ortak.length < 60) return null;                 // en az ~3 ay
    const ghH = getiriler(hSeri, ortak), geH = getiriler(eSeri, ortak);
    if (ghH.length !== geH.length) return null;
    /* Süzgeçten geçen gün her İKİ seride de geçerliyse kullanılır — beta
       hesabı eşleşmiş çift ister, tek taraflı atma korelasyonu bozar. */
    const gh = [], ge = [];
    for (let i = 0; i < ghH.length; i++) {
      if (ghH[i] == null || geH[i] == null) continue;
      gh.push(ghH[i]); ge.push(geH[i]);
    }
    if (gh.length < 50) return null;
    const mh = ortalama(gh), me = ortalama(ge);
    let kov = 0, varE = 0, varH = 0;
    for (let i = 0; i < gh.length; i++) {
      kov  += (gh[i] - mh) * (ge[i] - me);
      varE += (ge[i] - me) ** 2;
      varH += (gh[i] - mh) ** 2;
    }
    const n = gh.length - 1;
    return {
      vol:  +(Math.sqrt(varH / n) * Math.sqrt(252) * 100).toFixed(1),
      beta: varE > 0 ? +((kov / n) / (varE / n)).toFixed(2) : null,
      gun:  gh.length
    };
  };

  const yeni = {}, hesaplanamayan = [];
  kapsanan.forEach(k => { const r = hesapla(hSerileri[k]); if (r) yeni[k] = r; else hesaplanamayan.push(k); });
  const basarili = Object.keys(yeni);

  /* DENETİM. Beta sınırı ±3: BIST'te 3'ü aşan beta neredeyse her zaman
     hizalama hatası ya da bölünme artığıdır, gerçek değil.
     Vol sınırı %150: onu aşan hisse ya işlem görmüyor ya da veri bozuk. */
  const kontrol = [
    KURALLAR.kapsam(basarili.length, kodlar.length, 0.90),
    KURALLAR.aykiri(basarili.map(k => ({ kod: k, b: yeni[k].beta })), 'b', 3),
    KURALLAR.aykiri(basarili.map(k => ({ kod: k, v: yeni[k].vol })), 'v', 150)
  ];
  const s = denetle('Risk metrikleri', kontrol);
  raporlar.push(s.rapor() +
    `\n- ℹ **beta referansı: ${eKod}** (${eSeri.size} gün)` +
    (atlananGun ? `\n- ℹ ${atlananGun} gün kurumsal işlem süzgecine takıldı (±%20 üstü hareket — bölünme/bedelsiz)` : '') +
    (hamKalan.length ? `\n- ⚠ düzeltilmiş seri yok, HAM kapanış kullanıldı: ${hamKalan.slice(0, 8).join(', ')}${hamKalan.length > 8 ? ' +' + (hamKalan.length - 8) : ''} — bölünme varsa vol şişer` : '') +
    (eKod.indexOf('XKTUM') < 0 ? ' — ⚠ XKTUM bulunamadı, YEDEK endeks kullanıldı; sicil karşılaştırmasıyla taban FARKLI olabilir' : '') +
    (denemeler.length > 1 ? `\n- denenen: ${denemeler.join(' · ')}` : '') +
    (hesaplanamayan.length ? `\n- ⚠ seri kısa, hesaplanamadı: ${hesaplanamayan.slice(0, 10).join(', ')}` : ''));
  if (!s.gecti) { denetimDustu = true; return null; }

  let n = 0;
  liste.forEach(x => {
    const r = yeni[x.k]; if (!r) return;
    if (x.vol !== r.vol || x.beta !== r.beta) n++;
    x.vol = r.vol; x.beta = r.beta;
  });
  const ortGun = Math.round(ortalama(basarili.map(k => yeni[k].gun)));
  d.guncelleme = bugun;
  d.yontem = `vol = günlük getiri std × √252 · beta = kov(hisse, ${eKod}) / var(${eKod}) · ortalama ${ortGun} ortak işlem günü · kaynak Yahoo 1y`;
  await yaz(dosya, d);
  if (n) degisenler.push(`risk metrikleri (${n})`);
  return n;
}

/* ── KATILIM FONLARI (TEFAS · Playwright) ───────────────────────────────────
   TEFAS bot koruması sunucudan düz fetch'e izin vermiyor (§145-148'de ölçüldü:
   BindHistoryInfo 404, fonGnlBlgSiraliGetir zaman aşımı, JS challenge).
   Playwright ile gerçek tarayıcı açılır — Vercel'de koşmaz, Actions'ta koşar.
   Bu yüzden bu katman Vercel Cron'a DEĞİL, GitHub Actions'a bağlıdır. */
async function fonTazele() {
  const dosya = 'katfon.json';
  if (!(await varMi(dosya))) return null;
  let chromium;
  try { ({ chromium } = await import('playwright')); }
  catch {
    raporlar.push('### Katılım fonları — ⏭ ATLANDI\n- Playwright kurulu değil (yalnız `katman=fon|hepsi` koşularında kurulur).');
    return null;
  }
  const d = await oku(dosya);
  const fonlar = d.kategoriler.flatMap(k => k.fonlar);
  const kodlar = fonlar.map(f => f.k);

  const browser = await chromium.launch();
  const sayfa = await browser.newPage({ userAgent: 'Mozilla/5.0 (X11; Linux x86_64) KtPanel/1.0' });
  const fiyat = {};
  try {
    await sayfa.goto('https://www.tefas.gov.tr/FonKarsilastirma.aspx', { waitUntil: 'networkidle', timeout: 30000 });
    /* Çerez/challenge geçildikten SONRA sayfa bağlamından API çağrısı yapılır —
       tarayıcının kendi çerezleriyle gider, bot koruması takılmaz. */
    /* §249c (v3): İKİ AŞAMALI ÇEKİM + VERSİYONLU TANI.
       Aşama 1: BindComparisonFundReturns (tek istek, tüm fonlar) — çalışırsa
                pyssektor'a da zemin.
       Aşama 2 (düşüş): Aşama 1 boşsa KANITLI tek-fon modu — panel
                api/tefas.js'in fiilen çalıştırdığı çağrı, katfonun 46 kodu
                için döngüyle (≈10 sn). Uç değişse de bu yol en dayanıklı.
       Rapor hangi yolun çalıştığını + ham durumu HER KOŞUDA yazar. */
    const KATFON_KODLARI = (d.kategoriler || []).flatMap(k => (k.fonlar || []).map(f => f.k));
    const fmtT = (dt) => String(dt.getDate()).padStart(2,'0')+'.'+String(dt.getMonth()+1).padStart(2,'0')+'.'+dt.getFullYear();
    const bit = new Date(), bas = new Date(); bas.setDate(bas.getDate()-6);
    let yol = 'yok', hamNot = '';
    let kayitlar = [];
    try {
      const c = await sayfa.evaluate(async () => {
        const r = await fetch('/api/DB/BindComparisonFundReturns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
          body: 'calismatipi=2&fontip=YAT&sfontur=&kurucukod=&fongrup=&bastarih=&bittarih=&fonturkod=&fonunvantip='
        });
        const t = await r.text();
        return { status: r.status, ilk: t.slice(0, 160), json: (() => { try { return JSON.parse(t); } catch { return null; } })() };
      });
      hamNot = 'comparison HTTP ' + c.status + ' · ilk: `' + String(c.ilk).replace(/`/g, '') + '`';
      kayitlar = c.json?.data || [];
      if (kayitlar.length) yol = 'comparison (tek istek, ' + kayitlar.length + ' fon)';
    } catch (e) { hamNot = 'comparison istisna: ' + String(e.message || e).slice(0, 100); }
    const meta = {};
    if (kayitlar.length) {
      raporlar.push('### TEFAS alan keşfi (bilgi)\n- ' + Object.keys(kayitlar[0]).join(', ').slice(0, 300));
      const AUM_ADAY = ['PORTBUYUKLUK','PORTFOYBUYUKLUK','PORTFOYBUYUKLUGU','FONTOPLAMDEGER'];
      const YS_ADAY  = ['KISISAYISI','YATIRIMCISAYISI','KISISAYI'];
      kayitlar.forEach(x => {
        const kod = String(x.FONKODU || '').toUpperCase();
        const p = parseFloat(x.FIYAT ?? x.SONFIYAT);
        if (!kod || !isFinite(p) || p <= 0) return;
        const aumAlan = AUM_ADAY.find(a => x[a] != null);
        const aum = aumAlan ? parseFloat(x[aumAlan]) : null;
        meta[kod] = { p, aum: (isFinite(aum) && aum > 0) ? aum : null,
          ys: (() => { const a = YS_ADAY.find(a2 => x[a2] != null); return a ? (parseInt(x[a]) || null) : null; })(),
          pay: (isFinite(aum) && aum > 0) ? aum / p : null };
      });
    } else {
      /* Aşama 2 — kanıtlı tek-fon modu, yalnız katfon kodları */
      let ok = 0;
      for (const kod of KATFON_KODLARI) {
        try {
          const h = await sayfa.evaluate(async (arg) => {
            const r = await fetch('/api/DB/BindHistoryInfo', {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
              body: new URLSearchParams({ fontip: 'YAT', fonkod: arg.kod, bastarih: arg.bas, bittarih: arg.bit }).toString()
            });
            return r.ok ? r.json() : null;
          }, { kod, bas: fmtT(bas), bit: fmtT(bit) });
          const L = (h?.data || []).filter(x => isFinite(parseFloat(x.FIYAT)));
          if (!L.length) continue;
          L.sort((a, b) => String(a.TARIH) < String(b.TARIH) ? 1 : -1);
          const x = L[0], p = parseFloat(x.FIYAT);
          const aum = parseFloat(x.PORTFOYBUYUKLUK ?? x.PORTBUYUKLUK) || null;
          meta[kod] = { p, aum, ys: parseInt(x.KISISAYISI ?? x.YATIRIMCISAYISI) || null,
            pay: parseFloat(x.TEDPAYSAYISI) || (aum ? aum / p : null) };
          ok++;
        } catch (e) {}
      }
      if (ok) yol = 'tek-fon×' + ok + ' (BindHistoryInfo, kanıtlı mod)';
    }
    raporlar.push('### TEFAS çekim tanısı (bilgi)\n- yol: ' + yol + '\n- ' + hamNot);
    Object.keys(meta).forEach(k => fiyat[k] = meta[k].p);
    globalThis.__tefasMeta = meta;
  } catch (e) {
    raporlar.push(`### Katılım fonları — ✗ TEFAS erişimi düştü\n- ${String(e.message || e).slice(0, 140)}`);
    denetimDustu = true;
  } finally { await browser.close(); }

  const kapsanan = kodlar.filter(k => fiyat[k]);
  if (!kapsanan.length) {
    raporlar.push('### Katılım fonları — ✗ TEFAS eşleşme SIFIR (v3)\n- İki aşama da boş döndü — üstteki çekim tanısı satırı ham durumu söylüyor; katman yazılmadı.');
    denetimDustu = true;
    return null;
  }

  /* Günlük getiri ve dağıtım tuzağı kontrolü — §149'da MPE'nin kâr payı
     dağıtımı tek günde −%3,57 ile yakalanmıştı. Para piyasası fonunda
     ±%2'yi aşan günlük hareket dağıtım demektir, düzeltilmeden yazılmaz. */
  const gunluk = kapsanan.map(k => {
    const f = fonlar.find(x => x.k === k);
    return { kod: k, d: (fiyat[k] / f.yu - 1) * 100 };
  });
  const kontrol = [
    KURALLAR.kapsam(kapsanan.length, kodlar.length, 0.95),
    KURALLAR.aykiri(gunluk, 'd', 2),
    KURALLAR.donemArtan(fonlar, [1, 2, 3], 0.5)
  ];
  const s = denetle('Katılım fonları', kontrol);
  raporlar.push(s.rapor());
  if (!s.gecti) { denetimDustu = true; return null; }

  /* Çapa yöntemi: dönem getirisi eski fiyattan geri hesaplanır, yeni fiyata
     göre yeniden ölçülür. Çapalar sabit kaldığı için tutarlı kayar (§180.1). */
  let n = 0;
  fonlar.forEach(f => {
    const yeni = fiyat[f.k]; if (!yeni) return;
    const eski = f.yu;
    for (let i = 1; i < f.g.length; i++) {
      if (f.g[i] == null) continue;
      const capa = eski / (1 + f.g[i] / 100);
      f.g[i] = +((yeni / capa - 1) * 100).toFixed(4);
    }
    f.g[0] = +((yeni / eski - 1) * 100).toFixed(4);
    f.yu = yeni; n++;
  });
  /* §249: AUM + yatırımcı canlı; AKIŞ = Δpay × fiyat (dünkü pay arşivden).
     Arşiv yoksa ilk koşu akışı null bırakır ve temeli atar — uydurma yok. */
  const meta = globalThis.__tefasMeta || {};
  const arsivDosya = 'fon-arsiv.json';
  let arsiv = (await varMi(arsivDosya)) ? await oku(arsivDosya) : { gunler: {} };
  const dunKayit = (() => {
    const g = Object.keys(arsiv.gunler || {}).sort();
    return g.length ? arsiv.gunler[g[g.length - 1]] : null;
  })();
  fonlar.forEach(f => {
    const m = meta[f.k]; if (!m) return;
    if (m.aum) f.b = Math.round(m.aum);
    if (m.ys)  f.ys = m.ys;
    if (m.pay && dunKayit && dunKayit[f.k] && dunKayit[f.k].pay) {
      f.a = Math.round((m.pay - dunKayit[f.k].pay) * m.p);
    } else if (!dunKayit) { f.a = null; }
  });
  const bugunKayit = {};
  Object.keys(meta).forEach(k => { bugunKayit[k] = { p: meta[k].p, pay: meta[k].pay, aum: meta[k].aum }; });
  arsiv.gunler = arsiv.gunler || {};
  arsiv.gunler[bugun] = bugunKayit;
  const gunlerS = Object.keys(arsiv.gunler).sort();
  while (gunlerS.length > 40) delete arsiv.gunler[gunlerS.shift()];   // 40 iş günü yeter (1A akışlar)
  arsiv.guncelleme = bugun;
  await yaz(arsivDosya, arsiv);

  d.fiyat_tarihi = bugun;
  d.akis_tarihi = bugun;
  d.guncelleme = `${bugun} — otomatik (GitHub Actions · TEFAS BindHistoryInfo: fiyat+AUM+yatırımcı${dunKayit ? '+akış' : '; akış arşiv doldukça'})`;
  await yaz(dosya, d);
  degisenler.push(`katılım fonları (${n}${dunKayit ? '+akış' : ''})`);
  return n;
}


/* ── BİLANÇO TETİĞİ (KAP FR bildirimleri) — §249a ─────────────────────────
   Amaç: inceleme-ai kartlarının TETİĞİNİ otomatikleştirmek. Her koşuda son
   24 saatin Finansal Rapor bildirimleri çekilir; BIST kodları
   bilanco-tetik.json'a yazılır. Panel Earnings AI sekmesinde "bugün
   açıklananlar" şeridi basar; kullanıcı tek komutla kart ister.
   Uç formatı panel api/kap.js'ten (kanıtlı: Referer zorunlu, JSON body). */
async function bilancoTetik() {
  const dosya = 'bilanco-tetik.json';
  try {
    const simdi = Date.now(), GUN = 86400000;
    const iso = (t) => new Date(t).toISOString().slice(0, 10);
    const r = await fetch('https://www.kap.org.tr/tr/api/disclosure/members/byCriteria', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'accept': 'application/json',
                 'referer': 'https://www.kap.org.tr/tr/bildirim-sorgu',
                 'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36' },
      body: JSON.stringify({ fromDate: iso(simdi - GUN), toDate: iso(simdi), mkkMemberOidList: [], subjectList: [] }),
      signal: AbortSignal.timeout(15000)
    });
    if (!r.ok) { raporlar.push('### Bilanço tetiği — ✗ KAP HTTP ' + r.status); return null; }
    const j = await r.json();
    const items = Array.isArray(j) ? j : (j.items || j.data || []);
    const kodlar = [...new Set(items
      .filter(b => String(b.disclosureType || b.disclosureCategory || '').toUpperCase().includes('FR'))
      .map(b => String(b.stockCodes || b.stockCode || '').split(/[,;\s]+/)[0].trim().toUpperCase())
      .filter(k => /^[A-Z]{4,6}$/.test(k)))].sort();
    await yaz(dosya, { tarih: bugun, kodlar, sayi: kodlar.length,
      guncelleme: new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC — otomatik (KAP FR)' });
    raporlar.push('### Bilanço tetiği — ✓ ' + kodlar.length + ' şirket FR yayımladı' +
      (kodlar.length ? '\n- ' + kodlar.slice(0, 20).join(', ') + (kodlar.length > 20 ? ' …' : '') : ''));
    degisenler.push('bilanço tetiği (' + kodlar.length + ')');
    return kodlar.length;
  } catch (e) {
    raporlar.push('### Bilanço tetiği — ✗ ' + String(e.message || e).slice(0, 120));
    return null;
  }
}

/* ── ANA AKIŞ ───────────────────────────────────────────────────────────── */
(async () => {
  const goreliDizin = path.relative(process.cwd(), KOK) || '.';
  raporlar.push(`# Tazeleme — ${bugun}\n\nKatman: \`${KATMAN}\` · Veri dizini: \`${goreliDizin}\`\n`);
  if (!existsSync(path.join(KOK, 'index.html'))) {
    raporlar.push('⚠ **index.html hiçbir aday dizinde bulunamadı.** Veri dosyaları okunamayabilir.');
  }

  if (ister('endeks')) {
    await endeksTazele('xk100.json', 'XK100 ağırlıkları');
    await endeksTazele('xktum.json', 'XKTUM ağırlıkları');
    await endeksTazele('xktmt.json', 'XKTMT ağırlıkları');
  }
  if (ister('fiyat')) {
    await fiyatTazele('multiple.json', 'Multiple fiyatları', 'k', 'fiyat', 'hisseler');
    await fiyatTazele('track.json', 'Model sicili', 't', 'p', 'holdings');
  }
  if (ister('risk')) {
    await riskTazele();
  }
  if (ister('fon')) {
    await fonTazele();
  }
  if (ister('hepsi') || ister('fiyat')) {
    await bilancoTetik();   /* §249a: hafta içi her koşuda */
  }

  raporlar.push(
    `\n---\n**Sonuç:** ${degisenler.length ? degisenler.join(' · ') : 'değişiklik yok'}` +
    (denetimDustu ? '\n\n⚠ **Bir ya da daha fazla katman denetimden geçemedi — o katmanlar YAZILMADI.**' : '')
  );

  /* Rapor REPO kökünde — iş akışı onu okuyup özete basıyor. Veri dizini
     alt klasörde olsa bile rapor yeri değişmez. */
  await fs.mkdir(path.join(process.cwd(), 'rapor'), { recursive: true });
  await fs.writeFile(path.join(process.cwd(), 'rapor/son-tazeleme.md'), raporlar.join('\n\n'), 'utf8');

  const cikti = process.env.GITHUB_OUTPUT;
  if (cikti) {
    await fs.appendFile(cikti,
      `degisti=${degisenler.length ? 1 : 0}\n` +
      `ozet=${degisenler.join(', ').slice(0, 100) || 'değişiklik yok'}\n` +
      `denetim=${denetimDustu ? 'basarisiz' : 'basarili'}\n`);
  }
  console.log(raporlar.join('\n\n'));
})();
