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
/* §252w COKLU KATMAN. Onceden tek deger kabul ediliyordu (hepsi|fiyat|endeks|risk|fon),
   dolayisiyla "risk HARIC her sey" demenin yolu yoktu ve hafta ici aksam kosusu
   mecburen 'hepsi' cagiriyordu -> RISK KATMANI HER GUN kosuyordu (141 gereksiz
   Yahoo istegi/gun; vol ve beta 1 YILLIK pencereden hesaplanir, gunluk oynamasi
   anlamsiz). Artik virgullu liste kabul edilir: --katman=endeks,fiyat,fon
   GERIYE UYUM: tek deger ve 'hepsi' aynen calisir. */
const KSET = new Set(String(KATMAN).split(',').map(x => x.trim()).filter(Boolean));
const ister = k => KSET.has('hepsi') || KSET.has(k);

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
  /* §250c: BIST RESMÎ ARŞİVİ ÖNCE — endeks-arsiv.json'da XKTUM birikiyor
     (Yahoo'da yok, BIST CSV'sinden geliyor). Yeterli gün varsa beta GERÇEK
     katılım çıpasıyla ölçülür; XU100 (%25 banka) yanlış çıpaydı. Arşiv
     doldukça (60+ gün) devreye girer, o zamana dek Yahoo zinciri sürer. */
  try {
    if (await varMi('endeks-arsiv.json')) {
      const ar = await oku('endeks-arsiv.json');
      const gunler = Object.keys(ar.gunler || {}).sort();
      const seri = new Map();
      gunler.forEach(g => { const v = ar.gunler[g] && ar.gunler[g].XKTUM; if (v > 0) seri.set(g, v); });
      /* §250i: aylık tohum arşive girdiği için PUAN SAYISI yanıltıcı olabilir;
         beta GÜNLÜK seri ister → son 120 takvim gününde en az 60 nokta şartı. */
      const sinir = new Date(Date.now() - 120 * 86400000).toISOString().slice(0, 10);
      const sonYogunluk = [...seri.keys()].filter(g => g >= sinir).length;
      denemeler.push('arşiv XKTUM: ' + seri.size + ' nokta (son 120g: ' + sonYogunluk + ')');
      if (sonYogunluk >= 60) { eSeri = seri; eKod = 'XKTUM (BIST resmî arşiv)'; }
    }
  } catch (e0) {}
  if (!eSeri) for (const a of ENDEKS_ADAY) {
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
  /* §252z TARIH SUREKLILIGI SARTI — 10 Agu'da OLCULEREK eklendi.
     BULGU: endeks-arsiv.json'a XKTUM gunluk serisi tohumlandiginda (§252y)
     "kurumsal islem suzgecine takilan gun" 5'ten 234'e ZIPLADI. Sebep:
     arsiv artik KARMA — Sub-Agu 2026 GUNLUK (117 nokta) + 2021-2026 AYLIK
     tohum (61 nokta). Hisse serisi (Yahoo) ardisik gunluk oldugundan
     kesisimin eski bolumunde noktalar AY ARALIKLI kaliyor ve betik ardisik
     iki noktayi "gunluk getiri" sayiyordu.
     ASIL TEHLIKE ATILANLAR DEGIL ATILMAYANLARDI: %20'nin ALTINDA kalan aylik
     getiriler gunluk getiri gibi seriye giriyor, vol sqrt(252) ile
     yillliklandirilinca SISIYOR ve beta bozuluyordu.
     COZUM: ardisik iki gozlem arasi 5 TAKVIM GUNUNDEN uzunsa getiri
     HESAPLANMAZ (egri.js:250'deki ayni kalip: `fark>0 && fark<=5`).
     Iki sayac AYRI tutulur — "bosluk" ile "kurumsal islem" farkli seylerdir
     ve tek sayacta toplanirsa teshis yalan soyler. */
  const MAKS_BOSLUK = 5;          // takvim gunu; hafta sonu + 1 tatil paylar
  let atlananGun = 0, atlananBosluk = 0;
  const gunFark = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);
  const getiriler = (seri, gunler) => {
    const g = [];
    for (let i = 1; i < gunler.length; i++) {
      const a = seri.get(gunler[i - 1]), b = seri.get(gunler[i]);
      if (!(a > 0 && b > 0)) continue;
      const df = gunFark(gunler[i - 1], gunler[i]);
      if (!(df > 0 && df <= MAKS_BOSLUK)) { atlananBosluk++; g.push(null); continue; }
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
    (atlananGun ? `\n- ℹ ${atlananGun} gözlem kurumsal işlem süzgecine takıldı (±%20 üstü hareket — bölünme/bedelsiz)` : '') +
    (atlananBosluk ? `\n- ℹ ${atlananBosluk} gözlem TARİH BOŞLUĞU nedeniyle atlandı (>${MAKS_BOSLUK} gün ara — aylık tohum noktaları; §252z)` : '') +
    (hamKalan.length ? `\n- ⚠ düzeltilmiş seri yok, HAM kapanış kullanıldı: ${hamKalan.slice(0, 8).join(', ')}${hamKalan.length > 8 ? ' +' + (hamKalan.length - 8) : ''} — bölünme varsa vol şişer` : '') +
    (eKod.indexOf('XKTUM') < 0 ? ' — ⚠ XKTUM bulunamadı, YEDEK endeks kullanıldı; sicil karşılaştırmasıyla taban FARKLI olabilir' : (eKod.indexOf('arşiv') >= 0 ? ' — ✓ GERÇEK katılım çıpası (BIST resmî)' : '')) +
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
    /* §249e: goto v4 bloğunun içinde — yeni site */
    /* Çerez/challenge geçildikten SONRA sayfa bağlamından API çağrısı yapılır —
       tarayıcının kendi çerezleriyle gider, bot koruması takılmaz. */
    /* §249e (v4): AĞ DİNLEME — TEFAS yeni siteye geçti (/tr/fon-getirileri),
       eski .aspx API'leri "ERR-006 Method not found" (ölçüldü, WAF de doğrudan
       fetch'i kesiyor). Uç adı TAHMİN EDİLMEZ: gerçek tarayıcı yeni sayfayı
       açar, sayfanın KENDİ çağırdığı JSON yanıtları dinlenir (DevTools'un
       otomatik hali). Yakalanan uç + alan adları RAPORA basılır — TEFAS yine
       taşınsa bile bu yöntem bulur. */
    const meta = {};
    /* §249g BİRİNCİL AŞAMA: VERCEL KÖPRÜSÜ — Actions, TEFAS'a doğrudan değil
       kendi ucumuza gider (WAF'tan Vercel geçiyor; HAR ölçümüyle yeni uçlar +
       statik bearer api/tefas.js'te). Getiriler TEFAS'ın RESMİ yüzdeleri —
       çapa hesabının yerine doğrudan yazılır. Köprü boş/hatalıysa Playwright
       ağ-dinleme yedeği devam eder. */
    /* §253i AUM + YATIRIMCI SAYISI KÖPRÜDEN. Önceki yol Playwright ağ-dinleme
       idi ve F5 güvenlik duvarına takılıyordu ("Request Rejected" — her koşuda
       raporda görünüyordu). Doğru uç kullanıcının 10 Ağu HAR ölçümüyle bulundu:
       fonGnlBlgSiraliGetir → portfoyBuyukluk + kisiSayisi + tedPaySayisi.
       Köprüden çalışıyor; Playwright'e GEREK KALMADAN meta doluyor.
       TAHMİN EDİLEN ÜÇ UÇ YANLIŞTI (fonProfilDtyGetir kıyaslama getirisi
       döndürüyor, fonDetayGetir boş, fonToplamDegerGetir ERR-006) — uç adı
       TAHMİN EDİLMEZ, ÖLÇÜLÜR (§249e'nin aynı dersi). */
    try {
      const rgn = await fetch('https://ktpanel.vercel.app/api/tefas?mod=gnl&tip=YAT&bas=1&bit=1000',
        { signal: AbortSignal.timeout(30000) });
      const gn = await rgn.json().catch(() => null);
      const dizi = (gn && Array.isArray(gn.veri)) ? gn.veri : [];
      let nA = 0;
      for (const x of dizi) {
        const kod = String(x.fonKodu || '').toUpperCase().trim();
        const p = parseFloat(x.fiyat);
        if (!kod || !isFinite(p) || p <= 0) continue;
        const aum = parseFloat(x.portfoyBuyukluk);
        const pay = parseFloat(x.tedPaySayisi);
        meta[kod] = { p,
          aum: (isFinite(aum) && aum > 0) ? aum : null,
          ys: parseInt(x.kisiSayisi) || null,
          pay: (isFinite(pay) && pay > 0) ? pay : ((isFinite(aum) && aum > 0) ? aum / p : null) };
        nA++;
      }
      if (nA) raporlar.push('### TEFAS genel bilgi (§253i) — ✓ ' + nA + ' fon · AUM + yatırımcı sayısı köprüden'
        + (gn && gn.n ? ' (uç ' + gn.n + ' kayıt döndürdü)' : ''));
      else raporlar.push('### TEFAS genel bilgi (§253i) — ⏭ boş döndü'
        + (gn && gn.error ? ' · ' + String(gn.error).slice(0, 60) : '') + '\n- Playwright yedeği devrede.');
    } catch (e) {
      raporlar.push('### TEFAS genel bilgi (§253i) — ⏭ ' + String(e && e.message || e).slice(0, 70));
    }
    let g2 = null, l2 = null;
    try {
      const rg = await fetch('https://ktpanel.vercel.app/api/tefas?mod=getiri&tip=YAT', { signal: AbortSignal.timeout(25000) });
      g2 = await rg.json().catch(() => ({ error: 'HTTP_' + rg.status + '_govdesiz' }));   /* §249i: hata gövdesi de okunur — v alanı köprü sürümünü söyler */
      const rl = await fetch('https://ktpanel.vercel.app/api/tefas?mod=liste', { signal: AbortSignal.timeout(25000) });
      l2 = rl.ok ? await rl.json() : { error: 'HTTP_' + rl.status };
    } catch (e) { g2 = g2 || { error: String(e.message || e).slice(0, 80) }; }
    const getiriler = {};
    if (g2 && Array.isArray(g2.veri)) {
      g2.veri.forEach(x => {
        const k = String(x.fonKodu || '').toUpperCase();
        if (k) getiriler[k] = x;
      });
      raporlar.push('### TEFAS köprü (bilgi)\n- getiri: ' + g2.n + ' fon ✓ · liste: ' + (l2 && l2.n != null ? l2.n + ' kayıt · alanlar: ' + (l2.ornek || []).join(', ').slice(0, 250) : JSON.stringify(l2).slice(0, 160)));
      if (l2 && Array.isArray(l2.veri)) {
        const P_ADAY = ['fiyat','birimPayDegeri','sonFiyat','FIYAT','price'];
        const AUM_ADAY = ['fonBuyuklugu','portfoyBuyuklugu','portfolioSize','PORTFOYBUYUKLUK'];
        const YS_ADAY = ['yatirimciSayisi','kisiSayisi','KISISAYISI'];
        const bulV = (x, L2) => { const a = L2.find(k2 => x[k2] != null && x[k2] !== ''); return a ? x[a] : null; };
        l2.veri.forEach(x => {
          const k = String(x.fonKodu || x.FONKODU || '').toUpperCase();
          const p = parseFloat(String(bulV(x, P_ADAY)).replace(',', '.'));
          if (!k || !isFinite(p) || p <= 0) return;
          const aum = parseFloat(bulV(x, AUM_ADAY)) || null;
          meta[k] = { p, aum: (isFinite(aum) && aum > 0) ? aum : null,
            ys: parseInt(bulV(x, YS_ADAY)) || null,
            pay: (isFinite(aum) && aum > 0) ? aum / p : null };
        });
      }
      globalThis.__tefasGetiri = getiriler;
    } else {
      raporlar.push('### TEFAS köprü (bilgi)\n- getiri ucu: ' + JSON.stringify(g2).slice(0, 200) + (g2 && g2.tokenSuphesi ? ' → TOKEN YENİLE (yeni HAR gerekir)' : ''));
    }
    const yakalanan = [];
    sayfa.on('response', async (r) => {
      try {
        const url = r.url();
        if (!/tefas\.gov\.tr/.test(url)) return;
        const ct = String(r.headers()['content-type'] || '');
        if (!ct.includes('json')) return;
        const j2 = await r.json().catch(() => null);
        if (!j2) return;
        const dizi = Array.isArray(j2) ? j2 : (j2.data || j2.result || j2.items || j2.list || null);
        if (Array.isArray(dizi) && dizi.length > 20) {
          yakalanan.push({ url: url.slice(0, 200), n: dizi.length, ornek: dizi[0], dizi });
        }
      } catch (e) {}
    });
    let tumYanit = 0;
    sayfa.on('response', () => { tumYanit++; });
    await sayfa.goto('https://www.tefas.gov.tr/tr/fon-getirileri?fundType=YAT', { waitUntil: 'networkidle', timeout: 45000 });
    await sayfa.waitForTimeout(4000);
    /* §249f (v4.1): WAF mı SPA mı — sayfanın kimliği rapora */
    const kimlik = await sayfa.evaluate(() => ({
      baslik: document.title || '',
      govde: (document.body ? document.body.innerText : '').slice(0, 180).replace(/\s+/g, ' ')
    })).catch(() => ({ baslik: '?', govde: '?' }));
    let yol = 'yok', hamNot = 'yakalanan JSON: ' + yakalanan.length + ' / toplam yanıt: ' + tumYanit +
      ' · sayfa: "' + kimlik.baslik.slice(0, 60) + '" · gövde: `' + kimlik.govde + '`';
    if (yakalanan.length) {
      hamNot += ' · uçlar: ' + yakalanan.map(y2 => y2.url.replace('https://www.tefas.gov.tr','') + ' (' + y2.n + ')').join(' | ').slice(0, 400);
      const buyuk = yakalanan.sort((a, b) => b.n - a.n)[0];
      raporlar.push('### TEFAS alan keşfi (bilgi)\n- uç: `' + buyuk.url.replace('https://www.tefas.gov.tr','') + '`\n- alanlar: ' + Object.keys(buyuk.ornek || {}).join(', ').slice(0, 350));
      const KOD_ADAY = ['FONKODU','fonKodu','fundCode','code','kod'];
      const P_ADAY   = ['FIYAT','SONFIYAT','fiyat','price','birimPayDegeri','unitPrice','sonFiyat'];
      const AUM_ADAY = ['PORTFOYBUYUKLUK','PORTBUYUKLUK','fonBuyuklugu','portfolioSize','fonToplamDeger','portfoyBuyuklugu'];
      const YS_ADAY  = ['KISISAYISI','yatirimciSayisi','investorCount','kisiSayisi'];
      const bul = (x, L) => { const a = L.find(k => x[k] != null && x[k] !== ''); return a ? x[a] : null; };
      buyuk.dizi.forEach(x => {
        const kod = String(bul(x, KOD_ADAY) || '').toUpperCase().trim();
        const p = parseFloat(String(bul(x, P_ADAY)).replace(',', '.'));
        if (!kod || !/^[A-Z0-9]{2,4}$/.test(kod) || !isFinite(p) || p <= 0) return;
        const aum = parseFloat(String(bul(x, AUM_ADAY)).replace(/\./g, '').replace(',', '.')) || parseFloat(bul(x, AUM_ADAY)) || null;
        meta[kod] = { p,
          aum: (isFinite(aum) && aum > 0) ? aum : null,
          ys: parseInt(bul(x, YS_ADAY)) || null,
          pay: (isFinite(aum) && aum > 0) ? aum / p : null };
      });
      const n2 = Object.keys(meta).length;
      if (n2) yol = 'ağ-dinleme (yeni site, ' + n2 + ' fon)';
    }
    if (Object.keys(meta).length && globalThis.__tefasGetiri) yol = 'vercel-köprüsü (' + Object.keys(meta).length + ' fon fiyat + ' + Object.keys(globalThis.__tefasGetiri).length + ' getiri)';
    raporlar.push('### TEFAS çekim tanısı (bilgi)\n- yol: ' + yol + '\n- ' + hamNot);
    Object.keys(meta).forEach(k => fiyat[k] = meta[k].p);
    globalThis.__tefasMeta = meta;
  } catch (e) {
    raporlar.push(`### Katılım fonları — ✗ TEFAS erişimi düştü\n- ${String(e.message || e).slice(0, 140)}`);
    denetimDustu = true;
  } finally { await browser.close(); }

  const kapsanan = kodlar.filter(k => fiyat[k]);
  /* §249k GETİRİ-MODU: yeni liste ucu fiyat değil KİMLİK verdi (ölçüldü) —
     fiyat yokken 1047 resmi getiriyi çöpe atmak israf. Getiri kapsamı
     yeterliyse yalnız g[1..5] TEFAS resmi değerleriyle yazılır; fiyat/AUM/
     akış önceki (Fintables) değerlerinde damgalı kalır — hibrit ama dürüst. */
  {
    const G0 = globalThis.__tefasGetiri || {};
    const gKapsam = kodlar.filter(k => G0[k]).length;
    if (!kapsanan.length && gKapsam >= Math.floor(kodlar.length * 0.8)) {
      let n0 = 0;
      fonlar.forEach(f => {
        const gx = G0[f.k]; if (!gx) return;
        const eskiG = f.g || [null,null,null,null,null,null];
        f.g = [eskiG[0], gx.getiri1a ?? null, gx.getiri3a ?? null, gx.getiriyb ?? null, gx.getiri1y ?? null, gx.getiri3y ?? null];
        n0++;
      });
      /* §249l: FİYAT + 1G — fonFiyatBilgiGetir (KPR HAR keşfi), fon başına seri */
      let fN = 0;
      for (const f of fonlar) {
        try {
          const gVar = !!G0[f.k];   /* §249m: getiri listesinde yoksa 36 aylık seri iste, dönemler seriden hesaplanır */
          const rf = await fetch('https://ktpanel.vercel.app/api/tefas?mod=fiyat&kod=' + f.k + (gVar ? '' : '&p=36'), { signal: AbortSignal.timeout(15000) });
          if (!rf.ok) continue;
          const fj = await rf.json();
          const seri = (fj.veri || []).filter(x => isFinite(parseFloat(x.fiyat)));
          if (seri.length < 2) continue;
          seri.sort((a, b) => String(a.tarih) < String(b.tarih) ? -1 : 1);
          const son = seri[seri.length - 1], onc = seri[seri.length - 2];
          f.yu = parseFloat(son.fiyat);
          const eskiG2 = f.g || [null,null,null,null,null,null];
          eskiG2[0] = Math.round((parseFloat(son.fiyat) / parseFloat(onc.fiyat) - 1) * 1e6) / 1e4;
          if (!gVar && seri.length > 30) {   /* §249m: 5 dönem seriden — <= hedef tarihe en yakın kapanış */
            const ms = 86400000, simdi = new Date(String(son.tarih));
            const ref = (gun) => {
              const hedef = new Date(simdi - gun * ms).toISOString().slice(0, 10);
              let a = null;
              for (const x of seri) { if (String(x.tarih) <= hedef) a = x; else break; }
              return a ? parseFloat(a.fiyat) : null;
            };
            const yilbasi = (() => { const h = simdi.getFullYear() + '-01-01'; let a = null;
              for (const x of seri) { if (String(x.tarih) < h) a = x; else break; } return a ? parseFloat(a.fiyat) : null; })();
            const pct = (r) => r ? Math.round((f.yu / r - 1) * 1e6) / 1e4 : null;
            eskiG2[1] = pct(ref(30)); eskiG2[2] = pct(ref(91)); eskiG2[3] = pct(yilbasi);
            eskiG2[4] = pct(ref(365)); eskiG2[5] = pct(ref(1095));
          }
          f.g = eskiG2;
          fN++;
        } catch (e2) {}
      }
      d.fiyat_tarihi = bugun;
      d.guncelleme = `${bugun} — getiriler + fiyat/1G otomatik (TEFAS resmî · köprü · ${fN} fon fiyatlı); AUM/akış önceki turdan`;
      await yaz(dosya, d);
      raporlar.push('### Katılım fonları — ✓ GETİRİ-MODU: ' + n0 + '/' + kodlar.length + ' fonun 5 dönem getirisi + fiyat/1G yazıldı (AUM/akış önceki turdan)');
      degisenler.push('katılım fonları (getiri-modu ' + n0 + ')');
      return n0;
    }
  }
  if (!kapsanan.length) {
    raporlar.push('### Katılım fonları — ✗ TEFAS eşleşme SIFIR (v4)\n- Ağ dinleme JSON yakalayamadı ya da alanlar eşleşmedi — üstteki tanı satırı uç listesini söylüyor; katman yazılmadı.');
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
  const G = globalThis.__tefasGetiri || {};
  fonlar.forEach(f => {
    const gx = G[f.k];
    if (gx) {   /* §249g: TEFAS resmi dönem getirileri doğrudan — [1G,1A,3A,YTD,1Y,3Y] */
      const eskiG = f.g || [null,null,null,null,null,null];
      f.g = [eskiG[0], gx.getiri1a ?? null, gx.getiri3a ?? null, gx.getiriyb ?? null, gx.getiri1y ?? null, gx.getiri3y ?? null];
    }
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


/* ── ENDEKS ÜYELİKLERİ (BIST resmî CSV) — §250 ───────────────────────────
   Kaynak: borsaistanbul.com/datum/hisse_endeks_katilim_ds.csv — KAMU, auth yok
   (kullanıcının BIST veri dizini haritasından keşfedildi). Katılım endeksleri
   XKTUM/XKTMT/XK100/XK050/XK030/XSRDK/XK030EA üyeleri GÜNLÜK tazelenir.
   ISO-8859-9 (Türkçe) kodlama; ';' ayraç; ilk 2 satır başlık.
   Ayrıca kapsam denetimi: panelin xktum.json üye sayısı resmîden AZ ise uyarır
   (denetim şimdiye dek kendi listesine %100 diyordu — kör nokta kapandı). */
async function endeksUyeTazele() {
  const dosya = 'endeks-uyeler.json';
  try {
    const r = await fetch('https://borsaistanbul.com/datum/hisse_endeks_katilim_ds.csv', {
      headers: { 'User-Agent': 'Mozilla/5.0 (KtPanel/1.0)' }, signal: AbortSignal.timeout(20000) });
    if (!r.ok) { raporlar.push('### Endeks üyelikleri — ✗ HTTP ' + r.status); return null; }
    const buf = Buffer.from(await r.arrayBuffer());
    const metin = new TextDecoder('iso-8859-9').decode(buf);
    const satirlar = metin.split(/\r?\n/).slice(2).filter(x => x.trim());
    const uyeler = {}; let damga = '';
    satirlar.forEach(sat => {
      const p = sat.split(';');
      if (p.length < 6) return;
      const kod = String(p[0]).split('.')[0].trim().toUpperCase();
      const endeks = String(p[2]).trim().toUpperCase();
      if (!kod || !endeks) return;
      (uyeler[endeks] = uyeler[endeks] || []).push(kod);
      damga = damga || String(p[5]).trim();
    });
    const sayim = Object.fromEntries(Object.entries(uyeler).map(([k, v]) => [k, v.length]));
    if (!Object.keys(uyeler).length) { raporlar.push('### Endeks üyelikleri — ✗ satır ayrıştırılamadı'); return null; }
    await yaz(dosya, { guncelleme: bugun, kaynak: 'BIST resmî (hisse_endeks_katilim_ds.csv)', bist_damga: damga, sayim, uyeler });
    /* kapsam kıyası: panelin xktum.json'ı resmîden az mı? */
    /* §250e: ÖNCEKİ UYARI YANLIŞTI — xktum.json 242 üyeyi BİLİYOR, ilk 150'yi
       kasten taşıyor (ağırlıklar normalize DEĞİL, toplam %96,5 doğru). Doğru
       kontrol kapsam sayısı değil ÜYELİK REVİZYONU: panelde olup resmî listede
       OLMAYAN (endeksten çıkmış → ölü ağırlık) ve resmî listede olup panelde
       olmayan BÜYÜK isimler. BIST üç ayda bir revize eder; kaçarsa atıf bozulur. */
    /* §252o KONTROL UC DOSYAYA GENISLETILDI. Onceki hali YALNIZ xktum.json'a
       bakiyordu; 9 Agu'da xktmt.json'in resmi 39 uye yerine 34 tasidigi
       (JANTS FAZLA, 6 isim EKSIK) bu yuzden aylarca gorulmedi — dogrulayacak
       veri (endeks-uyeler.json) 5 Agu'dan beri ayni dizinde duruyordu.
       IKI FARKLI TASARIM, IKI FARKLI KONTROL:
         xktum.json  -> KASTEN ilk 150 / 242. Yalniz "panelde var resmide yok"
                        (olu agirlik) anlamlidir; eksik olmasi NORMAL.
         xk100/xktmt -> TAM kapsam. HER IKI YON de hatadir. */
    const UYELIK_KONTROL = {
      'xktum.json': { endeks: 'XKTUM', tam: false },
      'xk100.json': { endeks: 'XK100', tam: true },
      'xktmt.json': { endeks: 'XKTMT', tam: true }
    };
    let uyari = '';
    for (const [df, k] of Object.entries(UYELIK_KONTROL)) {
      try {
        if (!(await varMi(df))) continue;
        const d = await oku(df);
        /* uyelik kaynagi pay_adedi'dir (agirliklar ondan turetilir), uyeler yedek */
        const bizim = Object.keys(d.pay_adedi || d.uyeler || {});
        const resmi = new Set(uyeler[k.endeks] || []);
        if (!resmi.size) { uyari += '\n- ℹ ' + k.endeks + ': resmî listede bulunamadı, kontrol atlandı'; continue; }
        if (!bizim.length) { uyari += '\n- ⚠ ' + k.endeks + ': ' + df + ' üye taşımıyor'; continue; }
        const cikan = bizim.filter(x => !resmi.has(x));
        const eksik = k.tam ? [...resmi].filter(x => !bizim.includes(x)) : [];
        const oluAgirlik = cikan.reduce((a, x) => a + ((d.uyeler || {})[x] || 0), 0);
        const sorun = [];
        if (cikan.length) sorun.push('FAZLA ' + cikan.length + ' (' + cikan.slice(0, 6).join(', ') +
          ') · ölü ağırlık %' + oluAgirlik.toFixed(2));
        if (eksik.length) sorun.push('EKSİK ' + eksik.length + ' (' + eksik.slice(0, 6).join(', ') + ')');
        if (sorun.length) uyari += '\n- ⚠ REVİZYON ' + k.endeks + ': ' + sorun.join(' · ') + ' — ' + df + ' revize edilmeli';
        else uyari += '\n- ✓ üyelik uyumu ' + k.endeks + ': ' + bizim.length + '/' + resmi.size +
          (k.tam ? ' (tam kapsam)' : ' (tasarım gereği ilk ' + bizim.length + ')');
      } catch (e) { uyari += '\n- ℹ ' + k.endeks + ' kontrolü atlandı: ' + String(e.message || e).slice(0, 60); }
    }
    raporlar.push('### Endeks üyelikleri — ✓ ' + Object.entries(sayim).map(([k, v]) => k + ':' + v).join(' · ') + uyari);
    degisenler.push('endeks üyelikleri');
    return Object.keys(uyeler).length;
  } catch (e) {
    raporlar.push('### Endeks üyelikleri — ✗ ' + String(e.message || e).slice(0, 120));
    return null;
  }
}


/* ── ENDEKS KAPANIŞLARI + TLREFK (BIST resmî) — §250a ────────────────────
   Kullanıcının indirdiği üç dosya keşfedildi: Fiyat/Getiri endeksleri ve
   BIST TLREFK. KRİTİK: XKTUM kapanışı BURADA (Yahoo'da boştu) — beta çıpası
   ve ayrışma dönemleri için resmî kaynak. Dosyalar PayEndeksleri.zip içinde
   gelir; zip yoksa doğrudan CSV denenir. Arşiv birikimli (günlük seri kurar).
   ISO-8859-9 · ';' · ilk 2 satır başlık · KAPANIS = 7. kolon. */
async function endeksKapanisTazele() {
  const dosya = 'endeks-arsiv.json';
  const cekNot = [];       /* §250f: indirme başarısızlığı SESSİZ kalmaz */
  const beklenenNot = [];  /* §253g: BEKLENEN başarısızlıklar — gürültü yapmasın */
  /* §253g GÜRÜLTÜLÜ BAŞARI SORUNU. §250b ZATEN ölçmüştü: fiyat/getiri CSV'leri
     /datum/ altında YOK, PayEndeksleri.zip içindeler. Kod doğru davranıyor —
     tekil URL'yi dener, 404 alır, zip'e düşer ve ÇALIŞIR (84 endeks).
     Ama rapor bunu her koşuda "⚠ inmeyenler" diye basıyordu. Beklenen bir
     düşüş, GERÇEK arıza gibi görünüyordu; gerçek bir arıza çıktığında
     aralarında KAYBOLURDU. Artık ayrı satırda, ℹ ile. */
  const BEKLENEN_404 = ['FiyatEndeksleri_PriceIndices.csv', 'GetiriEndeksleri_ReturnIndices.csv'];
  const cek = async (u) => {
    const ad = u.split('/').pop();
    try {
      const r = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0 (KtPanel/1.0)', 'Accept': '*/*' }, signal: AbortSignal.timeout(30000) });
      if (!r.ok) {
        (BEKLENEN_404.includes(ad) && r.status === 404 ? beklenenNot : cekNot).push(ad + ':HTTP' + r.status);
        return null;
      }
      const b = Buffer.from(await r.arrayBuffer());
      if (b.length < 200) { cekNot.push(ad + ':boş(' + b.length + 'b)'); return null; }
      return b;
    } catch (e) { cekNot.push(ad + ':' + String(e.message || e).slice(0, 40)); return null; }
  };
  const ayristir = (buf) => {
    const metin = new TextDecoder('iso-8859-9').decode(buf);
    const out = {};
    metin.split(/\r?\n/).slice(2).forEach(sat => {
      const p = sat.split(';');
      if (p.length < 7) return;
      const kod = String(p[1]).trim().toUpperCase();
      const kap = parseFloat(String(p[6]).replace(',', '.'));
      const tar = String(p[5]).trim();
      if (kod && isFinite(kap) && kap > 0 && !kod.includes('_')) out[kod] = { k: kap, t: tar };
    });
    return out;
  };
  try {
    const kaynaklar = [
      'https://borsaistanbul.com/datum/FiyatEndeksleri_PriceIndices.csv',
      'https://borsaistanbul.com/datum/GetiriEndeksleri_ReturnIndices.csv',
      'https://borsaistanbul.com/datum/bisttlrefkendeksi.csv'
    ];
    let birlesik = {}, basarili = [];
    for (const u of kaynaklar) {
      const b = await cek(u);
      if (!b) continue;
      const o = ayristir(b);
      if (Object.keys(o).length) { Object.assign(birlesik, o); basarili.push(u.split('/').pop() + '(' + Object.keys(o).length + ')'); }
    }
    /* §250b: fiyat/getiri CSV'leri /datum/ altında YOK (ilk koşu kanıtı) —
       PayEndeksleri.zip içindeler. Zip indirilir, unzip ile açılır, içindeki
       tüm CSV'ler ayrıştırılır. Dosya adları rapora basılır (alan keşfi deseni). */
    if (!birlesik.XKTUM) {
      try {
        const zb = await cek('https://borsaistanbul.com/datum/PayEndeksleri.zip');
        if (zb) {
          const os = await import('node:os'), fsp = await import('node:fs/promises');
          const cp = await import('node:child_process');
          const dizin = path.join(os.tmpdir(), 'bistzip');
          await fsp.rm(dizin, { recursive: true, force: true });
          await fsp.mkdir(dizin, { recursive: true });
          const zp = path.join(dizin, 'p.zip');
          await fsp.writeFile(zp, zb);
          cp.execSync('unzip -o -q "' + zp + '" -d "' + dizin + '"', { stdio: 'ignore' });
          const icerik = await fsp.readdir(dizin);
          basarili.push('zip:[' + icerik.filter(x => !x.endsWith('.zip')).join(', ').slice(0, 120) + ']');
          for (const ad of icerik) {
            if (!/\.csv$/i.test(ad)) continue;
            const o2 = ayristir(await fsp.readFile(path.join(dizin, ad)));
            if (Object.keys(o2).length) { Object.assign(birlesik, o2); basarili.push(ad + '(' + Object.keys(o2).length + ')'); }
          }
        }
        else basarili.push('PayEndeksleri.zip İNMEDİ');
      } catch (e3) { basarili.push('zip hatası: ' + String(e3.message || e3).slice(0, 60)); }
    }
    if (!Object.keys(birlesik).length) {
      raporlar.push('### Endeks kapanışları — ✗ üç CSV de boş/erişilemedi (adresler PayEndeksleri.zip içinde olabilir)');
      return null;
    }
    let arsiv = (await varMi(dosya)) ? await oku(dosya) : { gunler: {} };
    arsiv.gunler = arsiv.gunler || {};
    /* §250e: TLREFK TARİHSEL TOHUM — arşiv yeni, YTD/1Y hesaplanamıyor.
       BISTTLREFKENDEKSI_D.zip geçmiş seriyi verir; bir kez tohumlanır
       (arşivde 30'dan az TLREFK günü varsa). Katılım fonlarının benchmark'ı. */
    const tlrefkGun = Object.values(arsiv.gunler).filter(g => g && g.BISTTLREFK).length;
    if (tlrefkGun < 30 && !arsiv.tlrefk_tohum) {
      try {
        const zb2 = await cek('https://borsaistanbul.com/datum/BISTTLREFKENDEKSI_D.zip');
        if (zb2) {
          const os2 = await import('node:os'), fsp2 = await import('node:fs/promises'), cp2 = await import('node:child_process');
          const dz = path.join(os2.tmpdir(), 'tlrefk'); await fsp2.rm(dz, { recursive: true, force: true }); await fsp2.mkdir(dz, { recursive: true });
          const zp2 = path.join(dz, 't.zip'); await fsp2.writeFile(zp2, zb2);
          cp2.execSync('unzip -o -q "' + zp2 + '" -d "' + dz + '"', { stdio: 'ignore' });
          let n2 = 0;
          const icerik2 = await fsp2.readdir(dz);
          let ornek = '';
          for (const ad of icerik2) {
            if (!/\.csv$/i.test(ad)) continue;
            /* §250h: KODLAMA + KOLON OTOMATİK — tarihsel dosya UTF-16LE ve
               tarih İLK kolonda (günlük dosya ISO-8859-9, tarih 6. kolonda).
               BOM'a bakıp decode edilir, başlık satırından kolon indeksleri
               ÖĞRENİLİR (ad tahmini değil, başlıktan okuma). */
            const ham2 = await fsp2.readFile(path.join(dz, ad));
            const bom = ham2.length > 1 && ((ham2[0] === 0xFF && ham2[1] === 0xFE) || (ham2[0] === 0xFE && ham2[1] === 0xFF));
            const metin2 = new TextDecoder(bom ? 'utf-16le' : 'iso-8859-9').decode(ham2);
            const bas2 = (metin2.split(/\r?\n/)[0] || '').split(';').map(x => x.toLocaleUpperCase('tr').trim());
            const iT = bas2.findIndex(x => x.includes('TARIH') || x.includes('DATE'));
            const iK = bas2.findIndex(x => x.includes('KAPANIS') || x.includes('CLOSING'));
            /* §250g: ayrıştırılamazsa NEDEN görünsün — dosya adı + ilk 2 satır rapora */
            if (!ornek) ornek = ad + ' → ' + metin2.split(/\r?\n/).slice(0, 3).join(' ¶ ').slice(0, 260);
            metin2.split(/\r?\n/).forEach(sat => {   /* başlık atlamak yerine desen filtresi: her satır denenir */
              const p = sat.split(';');
              if (p.length < 3) return;
              const kap = parseFloat(String(p[iK >= 0 ? iK : 6] || '').replace(',', '.'));
              const t = String(p[iT >= 0 ? iT : 5] || '').trim();
              let iso = null;
              let m = t.match(/^(\d{1,2})[\/.](\d{1,2})[\/.](\d{4})$/);
              if (m) iso = m[3] + '-' + String(m[2]).padStart(2,'0') + '-' + String(m[1]).padStart(2,'0');
              else { m = t.match(/^(\d{4})-(\d{2})-(\d{2})/); if (m) iso = m[0].slice(0,10); }
              if (!iso || !isFinite(kap) || kap <= 0) return;
              arsiv.gunler[iso] = Object.assign(arsiv.gunler[iso] || {}, { BISTTLREFK: kap });
              n2++;
            });
          }
          if (n2) { arsiv.tlrefk_tohum = bugun; raporlar.push('### TLREFK tarihsel tohum — ✓ ' + n2 + ' gün eklendi (benchmark serisi hazır)'); }
          else raporlar.push('### TLREFK tohum — ⚠ zip açıldı ama CSV ayrıştırılamadı\n- içerik: ' + icerik2.join(', ').slice(0,120) + '\n- örnek: `' + ornek.replace(/`/g,'') + '`');
        } else raporlar.push('### TLREFK tohum — ⚠ BISTTLREFKENDEKSI_D.zip inmedi');
      } catch (e4) { raporlar.push('### TLREFK tohum — ✗ ' + String(e4.message || e4).slice(0, 80)); }
    }
    /* §250i AYLIK TARİHSEL TOHUM (BIST format dokümanı §2.1.7/2.1.8):
       TR_PayEndeksleri{Fiyat,Getiri}.zip → endeksin BAŞLANGICINDAN İTİBAREN
       AY SONU kapanışları. Ayrışma 1A/3A/YTD/1Y için altın; GÜNLÜK BETA için
       KULLANILAMAZ (aylık nokta) — beta tarafında yoğunluk koruması var.
       Dosyalar .xlsx: satır bazlı basit XML okuma yerine, zip içi sharedStrings
       olmadan sayı/tarih çıkarımı riskli olduğundan yalnız CSV varyantı denenir;
       yoksa rapor içerik listesini basar (alan keşfi). */
    /* §250q: önceki tohum KAYIK kodlarla yazıldı (seyrek hücre hatası) —
       bayrak sürümlü: eski 'aylik_tohum' yok sayılır, kirli kayıtlar
       temizlenir (endeks kodu deseni: 2-8 harf/rakam, '_' yok). */
    if (arsiv.aylik_tohum && !arsiv.aylik_tohum_v2) {
      let atilan = 0;
      for (const g of Object.keys(arsiv.gunler)) {
        for (const k of Object.keys(arsiv.gunler[g])) {
          if (!/^[A-Z0-9]{2,8}$/.test(k)) { delete arsiv.gunler[g][k]; atilan++; }
        }
        if (!Object.keys(arsiv.gunler[g]).length) delete arsiv.gunler[g];
      }
      delete arsiv.aylik_tohum;
      if (atilan) raporlar.push('### Arşiv temizliği — ' + atilan + ' kayık anahtar silindi (§250q)');
    }
    if (!arsiv.aylik_tohum) {
      try {
        const os3 = await import('node:os'), fsp3 = await import('node:fs/promises'), cp3 = await import('node:child_process');
        let eklenen = 0, notlar = [];
        for (const ad of ['TR_PayEndeksleriFiyat.zip', 'TR_PayEndeksleriGetiri.zip']) {
          const zb3 = await cek('https://borsaistanbul.com/datum/' + ad);
          if (!zb3) continue;
          const dz3 = path.join(os3.tmpdir(), 'aylik_' + ad.replace(/\W/g, ''));
          await fsp3.rm(dz3, { recursive: true, force: true }); await fsp3.mkdir(dz3, { recursive: true });
          const zp3 = path.join(dz3, 'a.zip'); await fsp3.writeFile(zp3, zb3);
          try { cp3.execSync('unzip -o -q "' + zp3 + '" -d "' + dz3 + '"', { stdio: 'ignore' }); } catch (e6) {}
          const ic3 = (await fsp3.readdir(dz3)).filter(x => !/\.zip$/i.test(x));
          notlar.push(ad + '→[' + ic3.join(', ').slice(0, 80) + ']');
          /* §250j: dosyalar .xlsx çıktı (rapor söyledi) — kütüphanesiz okuyucu:
             xlsx bir zip'tir; xl/sharedStrings.xml (metinler) + xl/worksheets/
             sheet1.xml (hücreler). t="s" olan hücre paylaşılan metin indeksidir,
             diğerleri ham sayı. Excel seri tarihi de (sayı) ISO'ya çevrilir. */
          for (const fx of ic3) {
            if (!/\.xlsx$/i.test(fx)) continue;
            try {
              const dx = path.join(dz3, 'x_' + fx.replace(/\W/g, ''));
              await fsp3.mkdir(dx, { recursive: true });
              cp3.execSync('unzip -o -q "' + path.join(dz3, fx) + '" -d "' + dx + '"', { stdio: 'ignore' });
              let paylasilan = [];
              try {
                const ss = await fsp3.readFile(path.join(dx, 'xl', 'sharedStrings.xml'), 'utf8');
                paylasilan = [...ss.matchAll(/<si>([\s\S]*?)<\/si>/g)].map(m =>
                  [...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map(t => t[1]).join('')
                    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'));
              } catch (e7) {}
              /* §250l: sheet adı sabit DEĞİL (ENOENT kanıtı) — worksheets
                 dizinindeki İLK xml bulunur; dizin yoksa xl altı taranır. */
              let shYol = null;
              try {
                const wd = path.join(dx, 'xl', 'worksheets');
                const wl = (await fsp3.readdir(wd)).filter(x => /\.xml$/i.test(x)).sort();
                if (wl.length) shYol = path.join(wd, wl[0]);
              } catch (e9) {}
              if (!shYol) {
                const xl = path.join(dx, 'xl');
                const alt = await fsp3.readdir(xl).catch(() => []);
                notlar.push(fx + ':xl=[' + alt.join(',').slice(0, 60) + ']');
                continue;
              }
              const sh = await fsp3.readFile(shYol, 'utf8');
              const seriTarih = (n) => new Date(Date.UTC(1899, 11, 30) + n * 86400000).toISOString().slice(0, 10);
              for (const rm of sh.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
                /* §250q: xlsx'te BOŞ hücre XML'de HİÇ YAZILMAZ (seyrek satır) —
                   sırayla okumak kolonları kaydırıyordu (kod yerine ad/kur okundu,
                   arşive yanlış anahtarla yazıldı). Artık hücre ADRESİ (r="B2")
                   kolon indeksine çevrilir; boşluklar korunur. */
                const hucreler = [];
                for (const c of rm[1].matchAll(/<c\s([^>]*)>(?:<v>([\s\S]*?)<\/v>)?/g)) {
                  const nit = c[1] || '';
                  const rr = (nit.match(/r="([A-Z]+)\d+"/) || [])[1] || '';
                  const t = (nit.match(/t="(\w+)"/) || [])[1];
                  let idx = 0;
                  for (let i = 0; i < rr.length; i++) idx = idx * 26 + (rr.charCodeAt(i) - 64);
                  idx = idx ? idx - 1 : hucreler.length;
                  hucreler[idx] = (c[2] == null ? '' : (t === 's' ? (paylasilan[+c[2]] || '') : c[2]));
                }
                for (let i = 0; i < hucreler.length; i++) if (hucreler[i] == null) hucreler[i] = '';
                if (hucreler.length < 4) continue;
                const kod = String(hucreler[1] || '').trim().toUpperCase();
                const sonDolu = hucreler.filter(x => String(x).trim() !== '').pop();
                const kap = parseFloat(String(hucreler[4] !== '' && hucreler[4] != null ? hucreler[4] : sonDolu).replace(',', '.'));
                let t0 = String(hucreler[0] || '').trim(), iso = null;
                const mm = t0.match(/^(\d{1,2})[.\/](\d{1,2})[.\/](\d{4})/);
                if (mm) iso = mm[3] + '-' + String(mm[2]).padStart(2, '0') + '-' + String(mm[1]).padStart(2, '0');
                else if (/^\d{5}(\.\d+)?$/.test(t0)) iso = seriTarih(parseFloat(t0));
                else if (/^\d{4}-\d{2}-\d{2}/.test(t0)) iso = t0.slice(0, 10);
                if (!iso || !kod || kod.includes('_') || !isFinite(kap) || kap <= 0) continue;
                if (eklenen === 0) notlar.push('ilk satır: [' + hucreler.slice(0, 6).join('|').slice(0, 90) + ']');
                arsiv.gunler[iso] = Object.assign(arsiv.gunler[iso] || {}, { [kod]: kap });
                eklenen++;
              }
            } catch (e8) { notlar.push(fx + ':xlsx hata ' + String(e8.message || e8).slice(0, 40)); }
          }
          for (const f3 of ic3) {
            if (!/\.csv$/i.test(f3)) continue;
            const ham3 = await fsp3.readFile(path.join(dz3, f3));
            const bom3 = ham3.length > 1 && ((ham3[0] === 0xFF && ham3[1] === 0xFE) || (ham3[0] === 0xFE && ham3[1] === 0xFF));
            const mt3 = new TextDecoder(bom3 ? 'utf-16le' : 'iso-8859-9').decode(ham3);
            mt3.split(/\r?\n/).forEach(sat => {
              const p = sat.split(';');
              if (p.length < 5) return;
              const t = String(p[0]).trim(), kod = String(p[1]).trim().toUpperCase();
              const kap = parseFloat(String(p[p.length - 1]).replace(',', '.'));
              const m = t.match(/^(\d{1,2})[.\/](\d{1,2})[.\/](\d{4})$/);
              if (!m || !kod || kod.includes('_') || !isFinite(kap) || kap <= 0) return;
              const iso = m[3] + '-' + String(m[2]).padStart(2, '0') + '-' + String(m[1]).padStart(2, '0');
              arsiv.gunler[iso] = Object.assign(arsiv.gunler[iso] || {}, { [kod]: kap });
              eklenen++;
            });
          }
        }
        if (eklenen) { arsiv.aylik_tohum = bugun; arsiv.aylik_tohum_v2 = 1; raporlar.push('### Aylık endeks tohumu — ✓ ' + eklenen + ' kayıt (ay sonu serileri; ayrışma 1A/3A/YTD için)'); }
        else raporlar.push('### Aylık endeks tohumu — ⚠ CSV bulunamadı · ' + notlar.join(' · '));
      } catch (e5) { raporlar.push('### Aylık endeks tohumu — ✗ ' + String(e5.message || e5).slice(0, 90)); }
    }
    /* §250p: veri günü GG/AA/YYYY geliyordu ve arşive ÖYLE yazılıyordu —
       ISO anahtarlarla karışınca sıralama/karşılaştırma bozuluyor (panelde
       dönemler açılmadı). Anahtar HER ZAMAN ISO. */
    const isoCevir = (t) => {
      const m = String(t || '').match(/^(\d{1,2})[.\/](\d{1,2})[.\/](\d{4})/);
      if (m) return m[3] + '-' + String(m[2]).padStart(2, '0') + '-' + String(m[1]).padStart(2, '0');
      const m2 = String(t || '').match(/^\d{4}-\d{2}-\d{2}/);
      return m2 ? m2[0] : bugun;
    };
    const veriGunu = isoCevir((birlesik.XU100 && birlesik.XU100.t) || bugun);
    /* eski GG/AA/YYYY anahtarları varsa ISO'ya taşı (tek seferlik onarım) */
    for (const k of Object.keys(arsiv.gunler)) {
      if (/^\d{1,2}[.\/]\d{1,2}[.\/]\d{4}/.test(k)) {
        const yeni = isoCevir(k);
        arsiv.gunler[yeni] = Object.assign(arsiv.gunler[yeni] || {}, arsiv.gunler[k]);
        delete arsiv.gunler[k];
      }
    }
    arsiv.gunler[veriGunu] = Object.fromEntries(Object.entries(birlesik).map(([k, v]) => [k, v.k]));
    const g = Object.keys(arsiv.gunler).sort();
    while (g.length > 1500) delete arsiv.gunler[g.shift()];   // §250e: ~6 yıl (TLREFK tohum + endeks serisi)
    arsiv.guncelleme = bugun;
    arsiv.kaynak = 'BIST resmî endeks CSV (fiyat+getiri+TLREFK)';
    await yaz(dosya, arsiv);
    const one = ['XKTUM', 'XKTMT', 'XK100', 'XU100', 'BISTTLREFK'].filter(k => birlesik[k])
      .map(k => k + ' ' + birlesik[k].k).join(' · ');
    raporlar.push('### Endeks kapanışları — ✓ ' + Object.keys(birlesik).length + ' endeks · veri günü ' + veriGunu +
      '\n- ' + one + '\n- arşiv: ' + Object.keys(arsiv.gunler).length + ' gün · dosyalar: ' + basarili.join(', ') + (cekNot.length ? '\n- ⚠ inmeyenler: ' + cekNot.join(' · ') : '') +
      (beklenenNot.length ? '\n- ℹ beklenen 404 (§250b: bu dosyalar zip içinde, tekil URL yok): ' + beklenenNot.join(' · ') : ''));
    degisenler.push('endeks arşivi');
    return Object.keys(birlesik).length;
  } catch (e) {
    raporlar.push('### Endeks kapanışları — ✗ ' + String(e.message || e).slice(0, 120));
    return null;
  }
}


/* ── GÜNLÜK BÜLTEN KEŞFİ (§250k) ─────────────────────────────────────────
   Soru: XKTUM'un GÜNLÜK geçmişi çekilebilir mi? /datum/ kataloğunda yok
   (yalnız son gün + ay sonu tarihsel). Ama BIST günlük BÜLTEN yayımlıyor:
   /data/thb/YYYY/AA/thbYYYYAAGGS.zip — içinde endeks kapanışları olabilir.
   Bu fonksiyon TEK GÜN çeker ve içeriği RAPORA basar (tahmin yok, ölçüm).
   Tuttuğu doğrulanırsa 60-90 günlük tohum döngüsüne genişletilir. */
/* §253f CDS — worldgovernmentbonds.com.
   investing.com HER IKI sunucu yolundan da 403 verdi (Vercel VE Actions,
   Cloudflare datacenter engeli — 10 Agu'da IKISI DE OLCULDU) ve tarayici yolu
   CORS'ta kapali (`Access-Control-Allow-Origin: https://tr.investing.com`).
   Bu kaynak FARKLI: sayfasi ham fetch ile ACILIYOR, bot engeli YOK — asil
   fark bu. Deger investing ile BIREBIR ayni; site zaten kunyesinde
   Investing.com'u kaynak gosteriyor.
   Uc: POST /wp-json/common/v1/historical · govdede FUNCTION:"CDS",
   COUNTRY1.SYMBOL:"13" (Turkiye), DURATA:60 (5 yil). Kullanicinin 10 Agu HAR
   olcumunden alindi. Cerez GEREKMIYOR (giden cerezler analitik/reklam).
   TARIH UYARISI: kaynak hafta sonlarini ve tatilleri son degeri TASIYARAK
   dolduruyor, ustune ~2 gun ileri kayma var (duz kosu 08-08'de basliyor,
   investing ayni degeri 08-06'ya yaziyor). DEGER dogru, TARIH ~2 gun iyimser.
   Duz kosu geriye taranip gozlem gunu bulunur; ham etiket de yazilir. */
async function cdsTazele() {
  const dosya = 'cds.json';
  try {
    const r = await fetch('https://www.worldgovernmentbonds.com/wp-json/common/v1/historical', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'Accept': 'application/json',
        'Origin': 'https://www.worldgovernmentbonds.com',
        'Referer': 'https://www.worldgovernmentbonds.com/cds-historical-data/turkey/5-years/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
      },
      body: '{"GLOBALVAR":{"JS_VARIABLE":"jsGlobalVars","FUNCTION":"CDS","DOMESTIC":true,"ENDPOINT":"https://www.worldgovernmentbonds.com/wp-json/common/v1/historical","DATE_RIF":"2099-12-31","DEBUG":false,"OBJ":{"UNIT":"","DECIMAL":2,"UNIT_DELTA":"%","DECIMAL_DELTA":2},"COUNTRY1":{"SYMBOL":"13","PAESE":"Turkey","PAESE_UPPERCASE":"TURKEY","BANDIERA":"tr","URL_PAGE":"turkey"},"COUNTRY2":null,"OBJ1":{"DURATA_STRING":"5 Years","DURATA":60},"OBJ2":null}}',
      signal: AbortSignal.timeout(25000)
    });
    if (!r.ok) {
      raporlar.push('### TR 5Y CDS — ⏭ ATLANDI\n- HTTP ' + r.status + '\n- cds.json YAZILMADI, panel damgalı yedekle çalışır.');
      return;
    }
    const d = await r.json();
    const q = (d && d.result && d.result.quote) || {};
    const seri = Object.keys(q).map(k => q[k])
      .filter(v => v && isFinite(v.CLOSE_VAL) && v.CLOSE_VAL > 0 && v.DATA_VAL)
      .map(v => [v.DATA_VAL, +(+v.CLOSE_VAL).toFixed(2)])
      .sort((a, b) => a[0] < b[0] ? -1 : 1);
    if (!seri.length) { raporlar.push('### TR 5Y CDS — ✗ boş seri'); return; }
    let i = seri.length - 1;
    while (i > 0 && seri[i - 1][1] === seri[i][1]) i--;
    const gercekGun = seri[i][0], son = seri[seri.length - 1];
    const oncFar = seri.slice(0, i).reverse().find(x => x[1] !== son[1]) || null;
    if (!(son[1] >= 100 && son[1] <= 1500)) {
      raporlar.push('### TR 5Y CDS — ✗ DENETİM: makul aralık dışı (' + son[1] + ' bp) — YAZILMADI.');
      return;
    }
    const dgs = oncFar ? +(son[1] - oncFar[1]).toFixed(2) : null;
    await yaz(dosya, {
      guncelleme: bugun, deger: son[1], tarih: gercekGun, etiketTarih: son[0],
      onceki: oncFar ? oncFar[1] : null, degisim: dgs,
      adet: seri.length, seri: seri.slice(-120),
      kaynak: 'worldgovernmentbonds.com · TR 5Y CDS (5 Years, SYMBOL 13)',
      _not: 'investing.com her iki sunucu yolundan da 403 veriyor (Cloudflare). Ayni veri; tarih etiketi ~2 gun ileri kaymis olabilir. §253f'
    });
    degisenler.push('TR 5Y CDS (' + son[1] + ' bp)');
    raporlar.push('### TR 5Y CDS — ✓ ' + son[1] + ' bp · ' + gercekGun +
      (dgs != null ? ' · ' + (dgs >= 0 ? '+' : '') + dgs : '') +
      '\n- ✓ ' + seri.length + ' günlük seri · kaynak etiketi ' + son[0] + ' (hafta sonu doldurmalı)');
  } catch (e) {
    raporlar.push('### TR 5Y CDS — ⏭ ATLANDI\n- ' + String(e && e.message || e).slice(0, 90) + '\n- cds.json YAZILMADI.');
  }
}
async function bultenKesif() {
  if (globalThis.__bultenBakildi) return; globalThis.__bultenBakildi = 1;
  try {
    const os4 = await import('node:os'), fsp4 = await import('node:fs/promises'), cp4 = await import('node:child_process');
    /* §253h SON İŞ GÜNÜ — "dün" YETMİYORDU. Kod düz `Date.now()-86400000`
       kullanıyordu; PAZARTESİ koşusunda bu PAZAR'a denk geliyor, borsa kapalı,
       bülten YOK -> her hafta başı dört 404 ve "⚠ indirilemedi" satırı.
       Rapor bir arıza bildiriyordu ama arıza yoktu. (§253g ile aynı sınıf:
       beklenen düşüş, gerçek arıza gibi görünüyor.)
       Artık hafta sonu ATLANIYOR ve gerekirse 4 iş gününe kadar geriye
       bakılıyor (resmî tatiller için). İlk inen kabul edilir. */
    const isGunu = (x) => x.getDay() !== 0 && x.getDay() !== 6;
    const adaylar = [];
    for (let geri = 1; geri <= 6 && adaylar.length < 4; geri++) {
      const x = new Date(Date.now() - geri * 86400000);
      if (isGunu(x)) adaylar.push(x);
    }
    const denenen = [];
    for (const d of adaylar) {
      const Y = d.getFullYear(), A = String(d.getMonth() + 1).padStart(2, '0'), G = String(d.getDate()).padStart(2, '0');
      for (const sonek of ['1', '2', '3', '']) {
      const ad = 'thb' + Y + A + G + sonek + '.zip';
      const u = 'https://borsaistanbul.com/data/thb/' + Y + '/' + A + '/' + ad;
      let b = null;
      try {
        const r = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0 (KtPanel/1.0)' }, signal: AbortSignal.timeout(20000) });
        if (r.ok) { const bb = Buffer.from(await r.arrayBuffer()); if (bb.length > 500) b = bb; else denenen.push(ad + ':boş'); }
        else denenen.push(ad + ':HTTP' + r.status);
      } catch (e) { denenen.push(ad + ':' + String(e.message || e).slice(0, 30)); }
      if (!b) continue;
      const dz = path.join(os4.tmpdir(), 'bulten'); await fsp4.rm(dz, { recursive: true, force: true }); await fsp4.mkdir(dz, { recursive: true });
      const zp = path.join(dz, 'b.zip'); await fsp4.writeFile(zp, b);
      try { cp4.execSync('unzip -o -q "' + zp + '" -d "' + dz + '"', { stdio: 'ignore' }); } catch (e) {}
      const ic = (await fsp4.readdir(dz)).filter(x => !/\.zip$/i.test(x));
      /* endeks geçen dosyayı ara: ilk 400 karakterde XKTUM/XU100 var mı */
      let ipucu = '';
      for (const f of ic.slice(0, 12)) {
        try {
          const ham = await fsp4.readFile(path.join(dz, f));
          const bom = ham.length > 1 && ham[0] === 0xFF && ham[1] === 0xFE;
          const mt = new TextDecoder(bom ? 'utf-16le' : 'iso-8859-9').decode(ham.subarray(0, 4000));
          if (/XKTUM|XU100|ENDEKS/i.test(mt)) { ipucu = f + ' → ' + mt.split(/\r?\n/).slice(0, 2).join(' ¶ ').slice(0, 200); break; }
        } catch (e) {}
      }
      raporlar.push('### Bülten keşfi (§250k) — ✓ ' + ad + ' indi · ' + (b.length / 1024).toFixed(0) + 'KB' +
        '\n- içerik: ' + ic.join(', ').slice(0, 200) + (ipucu ? '\n- endeks izi: `' + ipucu.replace(/`/g, '') + '`' : '\n- endeks izi: ilk 12 dosyada bulunamadı'));
      return;
      }
    }
    /* Hiçbir aday inmedi. Bu ARIZA OLMAYABİLİR: resmî tatil haftası ya da
       BIST'in yayın gecikmesi. Denenen günler raporda görünsün ki ayırt
       edilebilsin — dört ardışık iş günü boşsa GERÇEK sorun vardır. */
    raporlar.push('### Bülten keşfi (§250k) — ℹ inmedi · denenen ' + adaylar.length +
      ' iş günü: ' + adaylar.map(x => x.toISOString().slice(0, 10)).join(', ') +
      '\n- ' + denenen.join(' · '));
  } catch (e) { raporlar.push('### Bülten keşfi — ✗ ' + String(e.message || e).slice(0, 90)); }
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
    await cdsTazele();
  }
  if (ister('risk')) {
    await riskTazele();
  }
  if (ister('fon')) {
    await fonTazele();
  }
  if (ister('hepsi') || ister('fiyat')) {
    await bilancoTetik();   /* §249a: hafta içi her koşuda */
    await endeksUyeTazele();   /* §250 */
    await endeksKapanisTazele();   /* §250a */
    await bultenKesif();   /* §250k: günlük tarihsel için keşif */
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
