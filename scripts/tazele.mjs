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

  const kontrol = [
    KURALLAR.kapsam(kapsanan.length, kodlar.length, 0.95),
    KURALLAR.tarihBirligi(kapsanan.map(k => f[k]), 'tarih'),
    KURALLAR.aykiri(
      liste.filter(x => f[x[kodAlan]] && x[fiyatAlan])
        .map(x => ({ kod: x[kodAlan], d: (f[x[kodAlan]].fiyat / x[fiyatAlan] - 1) * 100 })),
      'd', 25)
  ];
  const s = denetle(ad, kontrol);
  raporlar.push(s.rapor());
  if (!s.gecti) { denetimDustu = true; return null; }

  let n = 0;
  liste.forEach(x => { const k = x[kodAlan]; if (f[k] && x[fiyatAlan] !== f[k].fiyat) { x[fiyatAlan] = f[k].fiyat; n++; } });
  if (n) {
    d.fiyat_tarihi = f[kapsanan[0]].tarih;
    d.guncelleme = bugun;
    await yaz(dosya, d);
    degisenler.push(`${ad} (${n} fiyat)`);
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
      const c = d?.indicators?.quote?.[0]?.close || [];
      const t = d?.timestamp || [];
      const seri = new Map();
      for (let i = 0; i < c.length; i++) {
        if (typeof c[i] === 'number' && isFinite(c[i]) && c[i] > 0) {
          seri.set(new Date(t[i] * 1000).toISOString().slice(0, 10), c[i]);
        }
      }
      return seri.size > 30 ? { kod, seri } : null;
    } catch { return null; }
  };
  const sonuc = await havuz(kodlar, tek, 10);
  const harita = {};
  sonuc.filter(Boolean).forEach(x => { harita[x.kod] = x.seri; });
  return harita;
}

async function riskTazele() {
  const dosya = 'risk.json';
  if (!(await varMi(dosya))) return null;
  const d = await oku(dosya);
  const liste = d.hisseler || [];
  if (!liste.length) return null;
  const kodlar = liste.map(x => x.k).filter(Boolean);

  /* Endeks serisi önce — hisse hesapları buna dayanacak */
  const endeksHarita = await yahooSeri(['XKTUM'], '.IS');
  const eSeri = endeksHarita['XKTUM'];
  if (!eSeri) {
    raporlar.push('### Risk metrikleri — ✗ XKTUM serisi alınamadı\n- Beta hesaplanamaz, katman atlandı.');
    denetimDustu = true; return null;
  }
  const hSerileri = await yahooSeri(kodlar);
  const kapsanan = kodlar.filter(k => hSerileri[k]);

  const getiriler = (seri, gunler) => {
    const g = [];
    for (let i = 1; i < gunler.length; i++) {
      const a = seri.get(gunler[i - 1]), b = seri.get(gunler[i]);
      if (a > 0 && b > 0) g.push(b / a - 1);
    }
    return g;
  };
  const ortalama = a => a.reduce((s, x) => s + x, 0) / a.length;
  const hesapla = (hSeri) => {
    /* ORTAK GÜNLER — iki serinin kesişimi, tarih sırasına göre */
    const ortak = [...hSeri.keys()].filter(g => eSeri.has(g)).sort();
    if (ortak.length < 60) return null;                 // en az ~3 ay
    const gh = getiriler(hSeri, ortak), ge = getiriler(eSeri, ortak);
    if (gh.length < 50 || gh.length !== ge.length) return null;
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
      gun:  ortak.length
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
  d.yontem = `vol = günlük getiri std × √252 · beta = kov(hisse, XKTUM) / var(XKTUM) · ortalama ${ortGun} ortak işlem günü · kaynak Yahoo 1y`;
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
    const veri = await sayfa.evaluate(async () => {
      const r = await fetch('/api/DB/BindComparisonFundReturns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
        body: 'calismatipi=2&fontip=YAT&sfontur=&kurucukod=&fongrup=&bastarih=&bittarih=&fonturkod=&fonunvantip='
      });
      return r.ok ? r.json() : null;
    });
    (veri?.data || []).forEach(x => {
      const kod = String(x.FONKODU || '').toUpperCase();
      const p = parseFloat(x.FIYAT ?? x.SONFIYAT);
      if (kod && isFinite(p) && p > 0) fiyat[kod] = p;
    });
  } catch (e) {
    raporlar.push(`### Katılım fonları — ✗ TEFAS erişimi düştü\n- ${String(e.message || e).slice(0, 140)}`);
    denetimDustu = true;
  } finally { await browser.close(); }

  const kapsanan = kodlar.filter(k => fiyat[k]);
  if (!kapsanan.length) return null;

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
  d.fiyat_tarihi = bugun;
  d.guncelleme = `${bugun} — otomatik (GitHub Actions · TEFAS)`;
  await yaz(dosya, d);
  degisenler.push(`katılım fonları (${n})`);
  return n;
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
