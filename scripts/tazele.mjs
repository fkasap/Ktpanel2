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
/* §497 (23 Eki) SIRA DEĞİŞTİ: alt klasör ÖNCE. 22 Eki 12:52'de app.js + index.html yanlışlıkla repo KÖKÜNE yüklendi
   (31 Tem'de de aynısı olmuştu); kök listede ilk olduğu için veri dizini '.' seçildi, iki koşu veriyi köke yazdı,
   ktpanel/ (Vercel'in yayınladığı klasör) tazelenmedi. Vercel Root Directory = ktpanel olduğundan doğru aday odur. */
const ADAYLAR = [path.join(process.cwd(), 'ktpanel'), process.cwd(),
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
/* ── §300 GERI GITME KORUMASI (monotonluk) ─────────────────────────────────
   OLCULDU (18 Agu): ayni kosuda Yahoo'dan beslenen BES dosya (track, multiple,
   xk100, xktum, xktmt) 17 Agu'dan 14 Agu'ya GERILEDI; Yahoo kullanmayan uc
   dosya (risk=BIST arsivi, katfon=Fintables, cds=wgb) ayni kosuda ILERLEDI.
   Yani ariza kaynak tarafindaydi — kod tarih hesaplamiyor, Yahoo'nun son
   gecerli barinin damgasini yaziyor. Sonuc: 40 hissenin 39'unun TAZE fiyati
   dort gun ESKI fiyatla uzerine yazildi (ARASE 124 -> 114,6) ve panel bunu
   'bugunun fiyati' diye gosterdi.
   §179.3'un harfi harfine ihlali: ESKI VERI, EKSIK VERIDEN TEHLIKELIDIR.
   Eksik olsa panel 'veri yok' derdi; eski oldugu icin hicbir sey demedi.
   KORUMA: gelen fiyat tarihi dosyadakinden ESKIYSE yazma, atla, RAPORDA SOYLE.
   §266 (ayni-gun korumasi) ile ayni aile: taze veri, kaynak hickirdi diye
   ezilemez. Kaynak toparlayinca normal yazim kendiliginden surer — elle
   mudahale gerekmez. */
/* ── §307 BIST BÜLTEN FİYAT YEDEĞİ ────────────────────────────────────────────
   GEREKÇE: 18 Ağu Yahoo donması — beş katman 14 Ağu'da kaldı, §300 koruması
   gerilemeyi durdurur ama İLERLETEMEZ. Resmî kaynak (bülten) zaten her gün
   indiriliyordu; §305 tek koşuluk ölçümü kolonları kanıtladı:
   57 kolon · KAPANIS FIYATI mevcut · tarih ISO · 11.161 satır.
   ÖLÇÜMÜN UYARISI: her kod için birden çok satır var (THYAO yanında THYAO.AOF
   gibi türevler — örnek satır tamamı sıfırdı). Bu yüzden seçim kuralı:
   TAM kod eşleşmesi (nokta soneki yok) + KAPANIS FIYATI > 0.
   SIRA POLİTİKASI (tek sahip, §112): Yahoo BİRİNCİL kalır. Bülten yalnız
   Yahoo'nun tarihi son iş gününden ESKİYSE devreye girer — iki kaynağın
   karışması yasak (§114 karışık taban): yedek kullanılırsa O KATMANIN TÜM
   fiyatları bültenden gelir, tek tarihle. Kapsam %80'in altındaysa yedek
   REDDEDİLİR (yarım bülten, yarım Yahoo olmaz).
   İndirme keşifle ORTAK ve önbellekli — zip bir koşuda bir kez iner. */
const isGunuMu = (x) => x.getDay() !== 0 && x.getDay() !== 6;
function sonIsGunu(ref) {
  const x = new Date(ref); 
  do { x.setDate(x.getDate() - 1); } while (!isGunuMu(x));
  return x.toISOString().slice(0, 10);
}
async function bultenZipGetir() {
  if (globalThis.__bultenPaket !== undefined) return globalThis.__bultenPaket;
  globalThis.__bultenPaket = null;
  try {
    const os7 = await import('node:os'), fsp7 = await import('node:fs/promises'), cp7 = await import('node:child_process');
    const adaylar = [];
    for (let geri = 1; geri <= 6 && adaylar.length < 4; geri++) {
      const x = new Date(Date.now() - geri * 86400000);
      if (isGunuMu(x)) adaylar.push(x);
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
        const dz = path.join(os7.tmpdir(), 'bulten'); await fsp7.rm(dz, { recursive: true, force: true }); await fsp7.mkdir(dz, { recursive: true });
        const zp = path.join(dz, 'b.zip'); await fsp7.writeFile(zp, b);
        try { cp7.execSync('unzip -o -q "' + zp + '" -d "' + dz + '"', { stdio: 'ignore' }); } catch (e) {}
        const ic = (await fsp7.readdir(dz)).filter(x => !/\.zip$/i.test(x));
        globalThis.__bultenPaket = { ad, dz, ic, boyut: b.length, denenen };
        return globalThis.__bultenPaket;
      }
    }
    globalThis.__bultenPaket = { inmedi: true, adaylar: adaylar.map(x => x.toISOString().slice(0, 10)), denenen };
  } catch (e) { globalThis.__bultenPaket = { inmedi: true, hata: String(e.message || e).slice(0, 60) }; }
  return globalThis.__bultenPaket;
}
async function bultenFiyat(kodlar) {
  try {
    const B = await bultenZipGetir();
    if (!B || B.inmedi) return null;
    const fsp7 = await import('node:fs/promises');
    for (const f of B.ic) {
      if (!/\.csv$/i.test(f)) continue;
      const ham = await fsp7.readFile(path.join(B.dz, f));
      const bom = ham.length > 1 && ham[0] === 0xFF && ham[1] === 0xFE;
      const metin = new TextDecoder(bom ? 'utf-16le' : 'iso-8859-9').decode(ham);
      const satirlar = metin.split(/\r?\n/).filter(x => x.trim());
      if (satirlar.length < 10) continue;
      const norm = (k) => k.trim().toUpperCase().replace(/\s+/g, ' ');
      const kolon = satirlar[0].split(';').map(norm);
      const iKod = kolon.indexOf('ISLEM KODU'), iKap = kolon.indexOf('KAPANIS FIYATI'), iTar = kolon.indexOf('TARIH');
      if (iKod < 0 || iKap < 0) continue;
      const iste = new Set(kodlar.map(k => k.toUpperCase()));
      const out = {}; let tarih = null; const sonekSayaci = {};
      for (let i = 1; i < satirlar.length; i++) {
        const a = satirlar[i].split(';');
        const kod = (a[iKod] || '').trim().toUpperCase();
        /* §308: 19 Ağu koşusu kanıtladı — bültende ÇIPLAK kod satırı YOK
           (saf 'THYAO' deseni 11.161 satırda sıfır eşleşme). Pay satırı BIST
           konvansiyonunda KOD.E olarak gezer. Kabul edilen biçimler yalnız
           'KOD' ve 'KOD.E' — .AOF/.TE/temerrüt türevleri yine dışarıda. */
        let temel = null;
        if (iste.has(kod)) temel = kod;
        else if (kod.endsWith('.E') && iste.has(kod.slice(0, -2))) temel = kod.slice(0, -2);
        if (!temel) continue;
        sonekSayaci[kod === temel ? '(çıplak)' : '.E'] = (sonekSayaci[kod === temel ? '(çıplak)' : '.E'] || 0) + 1;
        const kod0 = kod; /* iz */
        /* Türk sayı biçimi güvenliği: '1.234,56' → 1234.56 · '305,25' → 305.25 · '305.25' → 305.25 */
        let vs = String(a[iKap] || '').trim();
        if (vs.includes('.') && vs.includes(',')) vs = vs.replace(/\./g, '').replace(',', '.');
        else vs = vs.replace(',', '.');
        const v = parseFloat(vs);
        if (!isFinite(v) || v <= 0) continue;            /* sıfır satır (askı/türev) atla */
        if (out[temel]) continue;                        /* ilk geçerli satır kazanır */
        out[temel] = { fiyat: v, tarih: (a[iTar] || '').trim().slice(0, 10) || null };
        if (!tarih && out[temel].tarih) tarih = out[temel].tarih;
      }
      const n = Object.keys(out).length;
      if (!n) return null;
      return { fiyatlar: out, tarih, kapsam: n, istenen: kodlar.length, dosya: f, sonek: sonekSayaci };
    }
    return null;
  } catch (e) { return null; }
}
async function fiyatYedek(ad, f, kodlar) {
  /* Yahoo tarihine bak; son iş gününden eskiyse bülteni dene. */
  try {
    const tarihler = Object.values(f || {}).map(x => x && x.tarih).filter(Boolean).sort();
    const yahooTarih = tarihler[tarihler.length - 1] || null;
    const hedef = sonIsGunu(bugun + 'T12:00:00Z');
    if (yahooTarih && yahooTarih >= hedef) return f;      /* Yahoo güncel — yedek gereksiz */
    const B = await bultenFiyat(kodlar);
    if (!B) { raporlar.push('- ℹ §307: Yahoo ' + (yahooTarih || '?') + ' (hedef ' + hedef + ') ama bülten yedeği alınamadı'); return f; }
    if (B.kapsam < kodlar.length * 0.8) {
      raporlar.push('- ⚠ §307: bülten kapsamı yetersiz (' + B.kapsam + '/' + kodlar.length + ' — eşik %80) — yedek REDDEDİLDİ, Yahoo verisiyle devam (karışık taban yasak §114)');
      return f;
    }
    if (!B.tarih || !(B.tarih > (yahooTarih || ''))) {
      raporlar.push('- ℹ §307: bülten tarihi (' + B.tarih + ') Yahoo\'dan taze değil — yedek kullanılmadı');
      return f;
    }
    const yeniF = {};
    kodlar.forEach(k => { const K = k.toUpperCase(); if (B.fiyatlar[K]) yeniF[k] = { fiyat: B.fiyatlar[K].fiyat, tarih: B.tarih }; });
    raporlar.push('### ' + ad + ' — §307 YEDEK DEVREDE: BIST bülteni ' + B.tarih +
      '\n- Yahoo ' + (yahooTarih || 'veri yok') + ' gün döndürdü (hedef ' + hedef + ') → resmî bülten kullanıldı' +
      '\n- kapsam ' + B.kapsam + '/' + kodlar.length + ' · dosya ' + B.dosya + ' · satır biçimi ' + JSON.stringify(B.sonek || {}) + ' · TÜM fiyatlar tek kaynaktan (§114)');
    return yeniF;
  } catch (e) { return f; }
}

function tarihGeriledi(ad, eskiTarih, yeniTarih) {
  if (!eskiTarih || !yeniTarih || yeniTarih >= eskiTarih) return false;
  const g = Math.round((new Date(eskiTarih) - new Date(yeniTarih)) / 864e5);
  raporlar.push('### ' + ad + ' — ⏭ ATLANDI (§300 geri gitme korumasi)' +
    '\n- kaynak ' + yeniTarih + ' dondurdu, dosyada ' + eskiTarih + ' var — ' + g + ' gun ESKI' +
    '\n- dosya KORUNDU: taze fiyatlar eski fiyatla ezilmedi. Kaynak toparlayinca yazim kendiliginden surer.');
  return true;
}

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
/* ── §451 ÜYELİK GÖÇÜ (5 Eki 2026) ──────────────────────────────────────────
   BIST katılım endeksleri çeyreklik revize olur; endeks-uyeler.json (resmî CSV) yeni
   listeyi getirir ama xk*.json'daki pay_adedi (serbest dolaşım pay sayısı) ELLE idi —
   Ekim revizyonunda XK100 35 çıkan/35 giren, ağırlığın %8,7'si endekste olmayan hisselere
   dağıtılmış durumdaydı (canlı rapor). Burada: çıkanlar pay_adedi'nden düşer (_cikan'a
   tarihli taşınır, silinmez), girenler için Yahoo quoteSummary floatShares çekilir
   (yoksa sharesOutstanding × KAP fiili dolaşım oranı yerine EKLENMEZ ve raporda yazar —
   uydurma yok). Ağırlık hesabı (endeksTazele) hemen ardından yeni evrenle koşar.
   Denetim: giren sayısının ≥%80'i bulunmalı; yoksa dosya YAZILMAZ (eski ağırlık kalır,
   rapor söyler). */
async function yahooFloat(kod) {
  const url = 'https://query2.finance.yahoo.com/v10/finance/quoteSummary/' + encodeURIComponent(kod + '.IS') + '?modules=defaultKeyStatistics';
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(12000) });
    if (!r.ok) return null;
    const j = await r.json(); const k = j?.quoteSummary?.result?.[0]?.defaultKeyStatistics || {};
    const fl = k.floatShares?.raw, so = k.sharesOutstanding?.raw;
    if (fl && fl > 0 && (!so || fl <= so * 1.01)) return { pay: Math.round(fl), kaynak: 'yahoo floatShares', so: so || null };
    return null;
  } catch { return null; }
}
async function uyelikGoc() {
  const uyku = (ms) => new Promise(r => setTimeout(r, ms));
  if (!(await varMi('endeks-uyeler.json'))) return;
  const eu = await oku('endeks-uyeler.json'); const U = eu.uyeler || {};
  const HARITA = { 'xk100.json': 'XK100', 'xktum.json': 'XKTUM', 'xktmt.json': 'XKTMT' };
  for (const [dosya, endeks] of Object.entries(HARITA)) {
    if (!(await varMi(dosya)) || !(U[endeks] || []).length) continue;
    const d = await oku(dosya); const pa = d.pay_adedi || {}; const resmi = new Set(U[endeks]);
    const fazla = Object.keys(pa).filter(k => !resmi.has(k)); const eksik = [...resmi].filter(k => !pa[k]);
    if (!fazla.length && !eksik.length) continue;
    const bulunan = {}, bulunamayan = [];
    for (const k of eksik) { const f = await yahooFloat(k); if (f) bulunan[k] = f; else bulunamayan.push(k); await uyku(250); }
    const oran = eksik.length ? Object.keys(bulunan).length / eksik.length : 1;
    if (oran < 0.8) { raporlar.push('### ' + endeks + ' üyelik göçü (§451) — ✗ girenlerin ' + Object.keys(bulunan).length + '/' + eksik.length + ' pay adedi bulundu (eşik %80) — dosya YAZILMADI · bulunamayan: ' + bulunamayan.slice(0, 12).join(',')); denetimDustu = true; continue; }
    d._cikan = d._cikan || {}; fazla.forEach(k => { d._cikan[k] = { pay: pa[k], tarih: bugun }; delete pa[k]; });
    Object.entries(bulunan).forEach(([k, f]) => { pa[k] = f.pay; });
    d.pay_adedi = pa; d.toplam_uye = resmi.size; d.donem = 'Ekim 2026 revizyonu (resmî üyelik ' + (eu.tarih || bugun) + ') — çeyreklik';
    d._goc = { tarih: bugun, cikan: fazla, giren: Object.keys(bulunan), girenKaynak: 'Yahoo quoteSummary floatShares', bulunamayan };
    await yaz(dosya, d);
    raporlar.push('### ' + endeks + ' üyelik göçü (§451) — ✓ çıkan ' + fazla.length + ' · giren ' + Object.keys(bulunan).length + '/' + eksik.length + (bulunamayan.length ? ' · pay adedi bulunamayan (eklenmedi): ' + bulunamayan.join(',') : '') + '\n- örnek: ' + Object.entries(bulunan).slice(0, 3).map(([k, f]) => k + ' ' + (f.pay / 1e6).toFixed(1) + ' mn' + (f.so ? ' (çıkarılmış ' + (f.so / 1e6).toFixed(0) + ' mn)' : '')).join(' · '));
    degisenler.push(endeks + ' üyelik');
  }
}

async function endeksTazele(dosya, ad) {
  if (!(await varMi(dosya))) return null;
  const d = await oku(dosya);
  const pa = d.pay_adedi;
  if (!pa || !Object.keys(pa).length) {
    raporlar.push(`### ${ad} — ⏭ ATLANDI\n- \`pay_adedi\` alanı yok (eski biçim). Göç gerekli: ağırlık yerine serbest dolaşım pay adedi saklanmalı.`);
    return null;
  }
  const kodlar = Object.keys(pa);
  let f = await yahooFiyat(kodlar);
  f = await fiyatYedek(ad, f, kodlar);   /* §307: Yahoo eskiyse resmî bülten */
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
    KURALLAR.fiyatYasi(f[kapsanan[0]].tarih, bugun, ad),   /* §301: birlikte eskime gorunur olsun */
    KURALLAR.toplam(toplamAgirlik, d.kapsanan_agirlik_hedef ?? 100, 3)
  ];
  const s = denetle(ad, kontrol);
  raporlar.push(s.rapor());
  if (!s.gecti) { denetimDustu = true; return null; }

  if (tarihGeriledi(ad, d.fiyat_tarihi, f[kapsanan[0]].tarih)) return null;   /* §300 */

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
  let f = await yahooFiyat(kodlar);
  f = await fiyatYedek(ad, f, kodlar);   /* §307: Yahoo eskiyse resmî bülten */
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
  /* §455d: Yahoo HİÇ dönmezse f[kapsanan[0]] tanımsız → TÜM koşu çöküyordu (sandbox testinde yakalandı);
     sonraki katmanlar (faktör evreni, fon portföy…) da çalışmıyordu. Boş kapsam = katman düşer, koşu sürer. */
  if (!kapsanan.length) { raporlar.push('### ' + ad + ' — ✗ fiyat kaynağı hiç yanıt vermedi (0/' + kodlar.length + ') · katman yazılmadı'); denetimDustu = true; return null; }
  const kontrol = [
    KURALLAR.kapsam(kapsanan.length, kodlar.length, 0.95),
    KURALLAR.tarihBirligi(kapsanan.map(k => f[k]), 'tarih'),
    KURALLAR.fiyatYasi(f[kapsanan[0]].tarih, bugun, ad)    /* §301 */
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
  /* §300: fiyat YAZILMADAN once kontrol — forEach bellekteki nesneyi degistirir,
     sonra kontrol etmek gec kalmis olurdu. */
  if (tarihGeriledi(ad, d.fiyat_tarihi, f[kapsanan[0]].tarih)) return null;

  let n = 0;
  liste.forEach(x => {
    const k = x[kodAlan];
    if (karantina.has(k)) return;                      /* karantinadaki fiyata DOKUNMA */
    if (f[k] && x[fiyatAlan] !== f[k].fiyat) { x[fiyatAlan] = f[k].fiyat; n++; }
  });
  /* ── SS328 KURUMSAL ISLEM: OTOMATIK YENIDEN OLCEKLEME (19 Agu) ────────────
     ARIZA (kullanici sicilde yakaladi): ORGE 5:1 bolundu (13 Agu 110,70 →
     16 Agu 22,80 — Fintables ham seriyle dogrulandi). Karantina fiyati
     dondurdu ama SICIL p0'i 108,80'de kaldi; panelin canli katmani karantinayi
     bilmedigi icin 22,64 / 108,80 = -%79 SAHTE dusus yazdi ve %2,5 agirlikla
     modelden ~2 puan goturdu. Ekranda "model -1,08%" gorundu; gercek +3,08%.
     KULLANICI KURALI: "hicbir sey elle guncellenmeyecek."
     COZUM: bolunme/bedelsiz tespit edilince p0 (ve varsa referans fiyat)
     OTOMATIK yeniden olceklenir — oran = yeni_fiyat / eski_referans.
     Getiri bu sayede DEGISMEZ: hisse 5'e bolundugunde hem fiyat hem taban
     5'e bolunur, oran korunur. Yuvarlama yok, tahmin yok: oranin kendisi
     kullanilir (bedelsizde 1/1,5 gibi tam sayi olmayan oranlar da dogru calisir).
     Emniyet: oran yalnizca [0,05 – 0,95] veya [1,05 – 20] araliginda uygulanir
     (gunluk normal hareket ±%25'i asamaz zaten; asiri degerler kaynak arizasidir).
     Karantina KALKMADI ama anlami degisti: artik "elle bak" degil,
     "olceklendi, bir sonraki kosuda normal akar" demek. */
  const olcekli = [], piyasaHareketi = [];
  if (karantina.size) {
    liste.forEach(x => {
      const k = x[kodAlan];
      if (!karantina.has(k) || !f[k] || !x[fiyatAlan]) return;
      const oran = f[k].fiyat / x[fiyatAlan];
      if (!(oran > 0.05 && oran < 0.95) && !(oran > 1.05 && oran < 20)) return;
      /* §495 (23 Eki) TABAN SERİSİ BÖLÜNME SANILDI: 21 Eyl'de BSOKE/EDATA/GENIL/GRTHO/HATSN/IZFAS/MAGEN/ONCSM aynı gün
         ×0,729–0,736 "bölündü" — gerçekte fon krizinde ÜÇ GÜN TABAN (0,9³ = 0,729). multiple.json'da adet ÷0,73 ile şişti,
         EV/EBITDA %35–55 yanlış çıktı (kullanıcı yakaladı). Ölçüt artık BIST fiyat marjı: iki fiyat tarihi arasında n iş günü
         varsa doğal hareket en çok 0,9ⁿ…1,1ⁿ. Oran bu bandın İÇİNDEYSE bu bir piyasa hareketidir → yalnız fiyat güncellenir,
         p0/adet ÖLÇEKLENMEZ. Bölünme/bedelsiz ancak bant DIŞINDA kalırsa kabul edilir (ORGE 5:1 = 0,20 → yine yakalanır). */
      { const t0 = Date.parse(d.fiyat_tarihi || ''), t1 = Date.parse(f[k].tarih || '');
        let ig = 1; if (isFinite(t0) && isFinite(t1) && t1 > t0) { ig = 0; for (let t = t0 + 864e5; t <= t1; t += 864e5) { const g = new Date(t).getUTCDay(); if (g !== 0 && g !== 6) ig++; } ig = Math.max(1, ig); }
        if (oran >= Math.pow(0.9, ig) * 0.99 && oran <= Math.pow(1.1, ig) * 1.01) { x[fiyatAlan] = f[k].fiyat; piyasaHareketi.push(k + ' ' + ((oran - 1) * 100).toFixed(1) + '% / ' + ig + ' iş günü'); return; } }
      /* SS328b YAN ETKI DUZELTMESI (ayni oturumda yakalandi): ilk yazim yalniz
         p0'i olcekliyordu. AMA bu fonksiyon multiple.json'da da kosuyor ve
         orada `adet` (pay adedi) var — carpanlar fiyat×adet ile hesaplanir.
         Fiyati 1/5'e cekip adedi birakmak piyasa degerini 1/5'e dusururdu:
         141 hissenin EV/EBITDA'si bozulurdu. Eski karantina, fiyata HIC
         dokunmayarak bunu farkinda olmadan engelliyordu — yani "duzeltme"
         calisan bir korumayi kaldirip yerine sessiz bir hata koyacakti.
         DOGRUSU: bolunmede fiyat ×oran ise ADET ÷oran olur (piyasa degeri
         SABIT kalir; muhasebe kimligi budur).
         DERS: BIR FONKSIYONU DEGISTIRMEDEN ONCE ONU KIM CAGIRIYOR DIYE BAK. */
      ['p0', 'ref_fiyat', 'kurulus_fiyat'].forEach(alan => {
        if (typeof x[alan] === 'number' && x[alan] > 0) x[alan] = +(x[alan] * oran).toFixed(4);
      });
      ['adet', 'pay_adedi', 'lot'].forEach(alan => {
        if (typeof x[alan] === 'number' && x[alan] > 0) x[alan] = Math.round(x[alan] / oran);
      });
      x[fiyatAlan] = f[k].fiyat;               /* fiyat da artik guncellenir */
      x._kurumsal = { tarih: bugun, oran: +oran.toFixed(4) };
      olcekli.push(k + ' ×' + oran.toFixed(3));
    });
  }
  if (olcekli.length) {
    d._kurumsal_islem = { tarih: bugun, kayitlar: olcekli,
      not: 'Bolunme/bedelsiz tespit edildi; kurulus fiyati (p0) ayni oranla otomatik olceklendi — getiri serisi bozulmaz, elle mudahale gerekmez (SS328).' };
    aykiriSonuc.mesaj = (aykiriSonuc.mesaj || '') + ' → OTOMATIK ÖLÇEKLENDİ: ' + olcekli.join(' · ');
  }
  if (piyasaHareketi.length) aykiriSonuc.mesaj = (aykiriSonuc.mesaj || '') + ' → PİYASA HAREKETİ (fiyat marjı içinde, ölçeklenmedi): ' + piyasaHareketi.join(' · ');
  const kalanKarantina = [...karantina].filter(k => !olcekli.some(o => o.startsWith(k + ' ')) && !piyasaHareketi.some(o => o.startsWith(k + ' ')));
  if (kalanKarantina.length) d._karantina = { kodlar: kalanKarantina, tarih: bugun,
    not: 'Fiyat referansla ±%25 üstü ayrıştı ama ölçekleme aralığı dışında — kaynak arızası olabilir, fiyat tazelenmedi.' };
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
  d.kaynak = 'Yahoo Finance 1y günlük kapanış (Actions §540: eski "Fintables" etiketi kaldırıldı — hesap zaten Yahoo serisinden)';
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
      /* §253i-DUZELTME SAYFALAMA. Ilk yazimda tek cagri (bas=1&bit=1000) vardi
         ve REGRESYONA yol acti: TEFAS'ta 2030 fon var, ilk 1000'e 46 katilim
         fonunun YALNIZ 10'u dusuyordu -> "Katilim fonlari ✗ KALDI 10/46".
         Onceki hal 36/46 yaziyordu (Playwright bloke oldugu icin meta BOS
         kaliyor, kod GETIRI-MODU'na dusuyordu). Yani yeni veri EKSIK oldugu
         icin eskisinden KOTU sonuc verdi.
         DENETIM YAKALADI ve veriyi YAZMADI (%95 esigi) — §104'un tam isi.
         Artik tum sayfalar cekilir. */
      const dizi = [];
      let gn = null;
      for (let sayfa = 0; sayfa < 4; sayfa++) {
        const bas = sayfa * 1000 + 1;
        const rgn = await fetch('https://ktpanel.vercel.app/api/tefas?mod=gnl&tip=YAT&bas=' + bas + '&bit=' + (bas + 999),
          { signal: AbortSignal.timeout(30000) });
        const j = await rgn.json().catch(() => null);
        if (sayfa === 0) gn = j;
        const d = (j && Array.isArray(j.veri)) ? j.veri : [];
        dizi.push(...d);
        if (d.length < 1000) break;   /* son sayfa */
      }
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
          pay: (isFinite(pay) && pay > 0) ? pay : ((isFinite(aum) && aum > 0) ? aum / p : null),
          unvan: String(x.fonUnvan || '').trim() };   /* §279: kurucu türetmesi için */
        nA++;
      }
      if (nA) { globalThis.__akisMeta = meta; }   /* §263: liste (kurucuAd) çekildikten SONRA yazılır */
      if (nA) { const U = {}; Object.keys(meta).forEach(k => { if (meta[k].unvan) U[k] = meta[k].unvan; }); globalThis.__fonUnvan = U; }   /* §429c: __akisMeta 946'da null'lanıyor; unvan ayrı yaşar */
      if (nA) raporlar.push('### TEFAS genel bilgi (§253i) — ✓ ' + nA + ' fon · AUM + yatırımcı sayısı köprüden'
        + ' (ham ' + dizi.length + ' kayıt, sayfalamalı)');
      else raporlar.push('### TEFAS genel bilgi (§253i) — ⏭ boş döndü'
        + (gn && gn.error ? ' · ' + String(gn.error).slice(0, 60) : '') + '\n- Playwright yedeği devrede.');
    } catch (e) {
      raporlar.push('### TEFAS genel bilgi (§253i) — ⏭ ' + String(e && e.message || e).slice(0, 70));
    }
    /* §401b KAPSAM DÜZELTMESİ (canlı: "tfDogrudan is not defined"): yardımcı
       try bloğunun İÇİNDE tanımlanmıştı, kullanıldığı yer dışında kalıyordu.
       Artık try'dan ÖNCE, aynı fonksiyon kapsamında.
       DERS: BİR YARDIMCIYI KULLANACAĞIN HER DALIN GÖREBİLECEĞİ YERDE TANIMLA —
       try/catch bloğu da bir kapsamdır.
       §401 DOĞRUDAN TEFAS YEDEĞİ (23 Ağu, üç koşudur "Request Rejected"):
       TEFAS'ın F5 güvenlik duvarı VERCEL IP BLOĞUNU engelledi — köprü hem
       Actions'tan hem tarayıcıdan "fetch failed" veriyor, yani kaynak bazlı
       blok, hız sınırı değil.
       ÇÖZÜM: GitHub runner'dan DOĞRUDAN denemek. Bu bir dolanma DEĞİL —
       proxy zinciri kurmuyoruz, IP döndürmüyoruz; sadece farklı bir meşru
       istemciden aynı kamuya açık ucu çağırıyoruz. TEFAS runner IP'lerini de
       engellerse orada dururuz.
       SIRA: önce Vercel köprüsü (çalışıyorsa tercih — başlıklar orada
       doğrulanmış), düşerse doğrudan.
       DERS: KÖPRÜ TEK NOKTA ARIZASIDIR — kamuya açık kaynağa ikinci bir
       meşru yol bırak. */
    const TF_BAS = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
      'Accept': 'application/json, text/javascript, */*; q=0.01',
      'Content-Type': 'application/json; charset=UTF-8',
      'Origin': 'https://www.tefas.gov.tr',
      'Referer': 'https://www.tefas.gov.tr/tr/fon-getirileri?fundType=YAT',
      'X-Requested-With': 'XMLHttpRequest'
    };
    const tfDogrudan = async (uc, govde, ekBas) => {
      try {
        const r = await fetch('https://www.tefas.gov.tr/api/funds/' + uc, {
          method: 'POST', headers: Object.assign({}, TF_BAS, ekBas || {}), body: JSON.stringify(govde || {}),
          signal: AbortSignal.timeout(25000) });
        if (!r.ok) return null;
        const t = await r.text();
        if (!t || t.trim()[0] !== '{' && t.trim()[0] !== '[') return null;   /* "Request Rejected" HTML döner */
        return JSON.parse(t);
      } catch (e) { return null; }
    };
    let g2 = null, l2 = null;
    try {
      const rg = await fetch('https://ktpanel.vercel.app/api/tefas?mod=getiri&tip=YAT', { signal: AbortSignal.timeout(25000) });
      g2 = await rg.json().catch(() => ({ error: 'HTTP_' + rg.status + '_govdesiz' }));   /* §249i: hata gövdesi de okunur — v alanı köprü sürümünü söyler */
      const rl = await fetch('https://ktpanel.vercel.app/api/tefas?mod=liste', { signal: AbortSignal.timeout(25000) });
      l2 = rl.ok ? await rl.json() : { error: 'HTTP_' + rl.status };
    } catch (e) { g2 = g2 || { error: String(e.message || e).slice(0, 80) }; }

    /* §408 DOĞRUDAN ÇEKİM v2 (24 Ağu, HAR ölçümüyle): TEFAS erişim mimarisi
       değişti — (1) her API çağrısı Authorization: Bearer istiyor ve jeton
       sitenin KENDİ ön-yüz paketine gömülü (common-*.js chunk, herkese aynı
       statik değer → kullanmak oturum taklidi DEĞİL, istemci sözleşmesinin
       parçası; build'de değişebilir → koda GÖMÜLMEZ, her koşuda sökülür),
       (2) getiri ucu yenilendi: api/funds/fonGetiriBazliBilgiGetir.
       Bot-koruma çerezleri (wid/zid/xid) taklit EDİLMEZ — sayfa/chunk bile
       reddedilirse ORADA DURULUR (§401 etik çizgisi aynen). Son basamak:
       kullanıcı HAR'ı (§409) — yalnız AYNI GÜN taze ise, bayat sessiz kullanılmaz. */
    if (!g2 || !Array.isArray(g2.veri) || !g2.veri.length) {
      let jeton = null;
      try {
        /* §408b TANI TURU: "0 aday" ölçüldü — HAR'da sayfada 6 chunk VAR ve jeton
           common-*.js'te. Runner'a farklı HTML gelmiş olmalı. Bu tur ne gördüğünü
           RAPORA yazdırıyoruz + üç kurtarma: (1) jeton doğrudan HTML'de mi (inline),
           (2) chunk regex GENİŞ (yol ayıracı dahil), (3) tam-URL de dene.
           Tarayıcı başlıkları da eklendi — WAF UA-only isteği yumuşak sayfayla
           geçiştiriyor olabilir. */
        const sayfa = await fetch('https://www.tefas.gov.tr/tr/fon-getirileri?fundType=YAT',
          { headers: { 'User-Agent': TF_BAS['User-Agent'], 'Accept': 'text/html,application/xhtml+xml',
            'Accept-Language': 'tr-TR,tr;q=0.9', 'Referer': 'https://www.tefas.gov.tr/' },
            signal: AbortSignal.timeout(25000) });
        const html = await sayfa.text();
        const dogrudanTok = html.match(/ST-tefasweb[A-Za-z0-9]{10,}/);
        const chunkYollari = [...html.matchAll(/\/_next\/static\/chunks\/[A-Za-z0-9._\/-]+?\.js/g)].map(m => m[0]);
        /* TANI: durum + boy + Rejected? + chunk sayısı + inline jeton + HTML başı */
        raporlar.push('- §408b TANI: HTTP ' + sayfa.status + ' · boy ' + html.length +
          ' · Rejected:' + (html.includes('Request Rejected') ? 'EVET' : 'hayır') +
          ' · chunk:' + chunkYollari.length + ' · inlineJeton:' + (dogrudanTok ? 'VAR' : 'yok') +
          ' · baş120: ' + html.slice(0, 120).replace(/\s+/g, ' '));
        if (dogrudanTok) {
          jeton = dogrudanTok[0];
          raporlar.push('- §408 TEFAS: jeton doğrudan HTML içinde bulundu (inline)');
        } else if (!html.includes('Request Rejected') && chunkYollari.length) {
          const uniq = [...new Set(chunkYollari)].slice(0, 30);
          for (const cy of uniq) {
            try {
              const jr = await fetch('https://www.tefas.gov.tr' + cy, { headers: { 'User-Agent': TF_BAS['User-Agent'] }, signal: AbortSignal.timeout(25000) });
              const m = (await jr.text()).match(/ST-tefasweb[A-Za-z0-9]{10,}/);
              if (m) { jeton = m[0]; raporlar.push('- §408 TEFAS: jeton ' + cy.split('/').pop() + ' chunk\'ında bulundu'); break; }
            } catch (e) {}
          }
          if (!jeton) raporlar.push('- §408 TEFAS: ' + uniq.length + ' chunk tarandı, jeton yok — TANI satırındaki HTML başına bak');
        } else if (html.includes('Request Rejected')) {
          raporlar.push('- §408 TEFAS: sayfa WAF tarafından reddedildi (runner IP) — burada duruldu');
        } else {
          raporlar.push('- §408 TEFAS: sayfada chunk yok (' + chunkYollari.length + ') ve inline jeton yok — runner farklı HTML görüyor (TANI satırına bak)');
        }
      } catch (e) { raporlar.push('- §408 TEFAS: sayfa/jeton aşaması hata — ' + String(e && e.message || e).slice(0, 60)); }
      /* §412 HENÜZ DENENMEMİŞ YOL: API'yi DOĞRUDAN, bilinen jetonla çağır.
         §408 zinciri "önce sayfadan jeton sök, sonra API" kuruluydu; sayfa hep
         kabuk geldiği için API'ye HİÇ İSTEK ATILMADI — kör nokta.
         Jeton STATİK bir uygulama anahtarı: sitenin herkese açık ön-yüz
         paketine gömülü, her ziyaretçide aynı (HAR ile iki kez doğrulandı).
         Kullanmak sahtecilik değil, istemci sözleşmesi. Çerez TAKLİDİ YOK.
         SORU: API ucu TSPD çerezini mi istiyor, yoksa Bearer yetiyor mu?
         Yetiyorsa TEFAS bulut Actions'ta TAM OTOMATİĞE döner. */
      if (!jeton) {
        const YEDEK_JETON = 'ST-tefaswebwse3irfmSBj4iRAzGPbAlS94Se';   /* HAR 24 Ağu; rotasyona tabi */
        try {
          const r = await fetch('https://www.tefas.gov.tr/api/funds/fonGnlBlgSiraliGetir', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json',
                       'Authorization': 'Bearer ' + YEDEK_JETON,
                       'Accept': 'application/json, text/javascript, */*; q=0.01',
                       'User-Agent': TF_BAS['User-Agent'],
                       'Origin': 'https://www.tefas.gov.tr',
                       'Referer': 'https://www.tefas.gov.tr/tr/fon-getirileri?fundType=YAT' },
            body: JSON.stringify({ fonTipi: 'YAT', fonKodu: null, aramaMetni: null, fonTurKod: null,
              fonGrubu: null, sfonTurKod: null,
              basTarih: bugun.replace(/-/g, ''), bitTarih: bugun.replace(/-/g, ''),
              basSira: 1, bitSira: 50, fonTurAciklama: null, dil: 'TR', kurucuKod: null }),
            signal: AbortSignal.timeout(25000)
          });
          const gv = await r.text();
          raporlar.push('- §412 API DOĞRUDAN TEST: HTTP ' + r.status + ' · boy ' + gv.length +
            ' · ilk80: ' + gv.slice(0, 80).replace(/\s+/g, ' '));
          if (r.ok && gv.trim()[0] === '{') {
            const d = JSON.parse(gv);
            if (Array.isArray(d.resultList) && d.resultList.length) {
              jeton = YEDEK_JETON;
              raporlar.push('- §412 ✓ API ÇEREZSİZ ÇALIŞIYOR — ' + d.resultList.length + '/' + (d.toplamSayi || '?') +
                ' fon geldi. TEFAS bulut Actions\'ta TAM OTOMATİĞE dönebilir!');
            }
          }
        } catch (e) {
          raporlar.push('- §412 API doğrudan test: ' + String((e && e.message) || e).slice(0, 70));
        }
      }
      if (jeton) {
        const G408 = JSON.parse("{\"dil\":\"TR\",\"fonTipi\":\"YAT\",\"kurucuKodu\":null,\"sfonTurKod\":null,\"fonTurAciklama\":null,\"islem\":1,\"fonTurKod\":null,\"fonGrubu\":null,\"donemGetiri1a\":\"1\",\"donemGetiri3a\":\"1\",\"donemGetiri6a\":\"1\",\"donemGetiri1y\":\"1\",\"donemGetiriyb\":\"1\",\"donemGetiri3y\":\"1\",\"donemGetiri5y\":\"1\",\"basTarih\":null,\"bitTarih\":null,\"calismaTipi\":2,\"getiriOrani\":\"1\"}");
        const d = await tfDogrudan('fonGetiriBazliBilgiGetir', G408, { 'Authorization': 'Bearer ' + jeton });
        const dz = d && (d.resultList || d.data || null);
        if (Array.isArray(dz) && dz.length) {
          g2 = { veri: dz.map(x => ({ fonKodu: x.fonKodu || x.FONKODU, ...x })), n: dz.length, _yol: 'doğrudan v2 (Bearer, Actions runner)' };
          raporlar.push('- §408 TEFAS getiri: yeni uç + canlı jetonla DOĞRUDAN çekim başarılı (' + dz.length + ' fon)');
        } else {
          raporlar.push('- §408 TEFAS getiri: jeton bulundu ama uç reddetti — bot-koruma çerez katmanı; burada duruldu');
        }
      }
      /* §409: son basamak — kullanıcı HAR'ı */
      if (!g2 || !Array.isArray(g2.veri) || !g2.veri.length) {
        try {
          const hv = await oku('ktpanel/tefas-har-veri.json');
          const bugun = new Date().toISOString().slice(0, 10);
          if (hv && hv.tarih === bugun && Array.isArray(hv.getiri) && hv.getiri.length) {
            g2 = { veri: hv.getiri.map(x => ({ fonKodu: x.fonKodu, ...x })), n: hv.getiri.length, _yol: 'HAR (elle · §409)' };
            raporlar.push('- §409 TEFAS getiri: HAR içe-aktarımı kullanıldı (' + hv.getiri.length + ' fon · ' + hv.tarih + ') — elle katman, damgalı');
          } else if (hv && hv.tarih) {
            raporlar.push('- §409 TEFAS: HAR dosyası BAYAT (' + hv.tarih + ') — sessizce kullanılmadı; taze al: node ktpanel/arac/tefas-har-isle.mjs <dosya.har>');
          }
        } catch (e) {}
      }
      if (!g2 || !Array.isArray(g2.veri) || !g2.veri.length)
        raporlar.push('- §408 TEFAS getiri: köprü + doğrudan v2 + HAR — üçü de yok; katman yazılmayacak');
    }

    if (!l2 || !Array.isArray(l2.veri || l2.data)) {
      const d2 = await tfDogrudan('fonProfilDtyGetir', { fontip: 'YAT', kurucukod: '', fongrup: '', islemdurum: '1' });
      const dz2 = d2 && (d2.data || d2.veri || (Array.isArray(d2) ? d2 : null));
      if (Array.isArray(dz2) && dz2.length) {
        l2 = { veri: dz2, n: dz2.length, _yol: 'doğrudan' };
        raporlar.push('- §401 TEFAS liste: doğrudan çekim başarılı (' + dz2.length + ' kayıt)');
      }
    }
    const getiriler = {};
    if (g2 && Array.isArray(g2.veri)) {
      g2.veri.forEach(x => {
        const k = String(x.fonKodu || '').toUpperCase();
        if (k) getiriler[k] = x;
      });
      raporlar.push('### TEFAS köprü (bilgi)\n- getiri: ' + g2.n + ' fon ✓ · liste: ' + (l2 && l2.n != null ? l2.n + ' kayıt · alanlar: ' + (l2.ornek || []).join(', ').slice(0, 250) : JSON.stringify(l2).slice(0, 160)));
      /* §263 FON AKIŞI — kurucu eşlemesi mod=liste'den gelir, o yüzden burada.
         meta yukarıda (mod=gnl) dolduruldu ve globalThis'te bekletildi. */
      if (globalThis.__akisMeta) {
        const kurucu = {};
        if (l2 && Array.isArray(l2.veri)) {
          l2.veri.forEach(x => {
            const k = String(x.fonKod || x.fonKodu || '').toUpperCase().trim();
            const u = String(x.kurucuAd || x.kurucuKod || '').trim();
            if (k && u) kurucu[k] = u;
          });
        }
        /* §279 EKSİK KURUCU FON ADINDAN TÜRETİLİR.
           ÖLÇÜLDÜ (13 Ağu): mod=liste 1039 kayıt döndürüyor ama evren 2015
           fon — 976 fonun kurucusu YOK ve hepsi "(kurucu bilinmiyor)"
           grubunda toplanıyor: +21,78 mlr ₺ tek satırda. Kurum toplamları bu
           yüzden yanlış (Pusula panelde -2,51, gerçekte +1,85).
           FON BAZINDA HESAP DOĞRU — dokuz fon Fintables ile birebir doğrulandı
           (KLU/KTV/KTT/PBR/PRY/PNU/TLY/THF/TP2). Hata YALNIZCA dağılımda.
           TEFAS fon adları kurumla başlar: "GARANTİ PORTFÖY İKİNCİ PARA
           PİYASASI (TL) FONU". "PORTFÖY" kelimesine kadar olan kısım kurum
           adıdır. Türetme YALNIZ eşleme yoksa devreye girer — mevcut
           kurucuAd'a DOKUNMAZ, yani en kötü ihtimalde bugünkü durum kalır. */
        const _listeKapsam = Object.keys(kurucu).length;   /* türetmeden ÖNCEKİ kapsam */
        let _turetildi = 0;
        try{
          for(const k of Object.keys(globalThis.__akisMeta)){
            if(kurucu[k]) continue;
            const u = String(globalThis.__akisMeta[k].unvan || '').toUpperCase();
            const m = u.match(/^(.{2,40}?)\s+PORTF[ÖO]Y\b/);
            if(m && m[1]){ kurucu[k] = m[1].trim() + ' PORTFÖY'; _turetildi++; }
          }
        }catch(e){}
        /* §279c RAPOR SAYISI DÜZELTİLDİ. Önce Object.keys(kurucu).length
           yazıyordu ama o TÜRETME SONRASI boyut (2015) — mesaj "mod=liste 2015
           kayıt kapsıyor" diyordu, oysa liste 1041 döndürmüştü. Teşhis mesajı
           yanlış sayı gösterirse bir sonraki okuyucuyu yanıltır. */
        if(_turetildi) raporlar.push('### Fon akışı — ℹ ' + _turetildi
          + ' fonun kurucusu fon adından türetildi (§279; mod=liste ' + _listeKapsam
          + ' kayıt kapsıyordu, evren ' + Object.keys(globalThis.__akisMeta).length + ')');
        await fonAkisArsiv(globalThis.__akisMeta, kurucu);
        globalThis.__akisMeta = null;
      }
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
    globalThis.__tefasYol = yol;   /* §410b: damgada GERÇEK kanal adı yazsın */
    raporlar.push('### TEFAS çekim tanısı (bilgi)\n- yol: ' + yol + '\n- ' + hamNot);
    Object.keys(meta).forEach(k => fiyat[k] = meta[k].p);
    globalThis.__tefasMeta = meta;

    /* ══ §410 KONSOL TOPLAYICI DOSYASI — son basamak, KAPSAM KORUMALI ══
       TEFAS erişim tablosu (24 Ağu ölçümleri): Vercel IP bağlantı düzeyinde
       engelli · Actions runner TSPD JS meydan okumasında eleniyor · otomasyonla
       sürülen tarayıcı davranış düzeyinde reddediliyor · BindHistoryInfo 404
       (yeni sitede kaldırılmış) · sayfalı uç pencere başına ~600 kayıtta 429.
       Geriye TEK meşru yol kalıyor: kullanıcının KENDİ elle gezdiği oturumu
       (arac/tefas-konsol.js → tefas-tam-<tarih>.json → arac/gelen/).
       Bu, otomasyon kuralının ÖLÇÜLMÜŞ istisnasıdır (swap stoku emsali).

       İKİ KAPI — ikisi de geçilmeden veri kullanılmaz:
       1) TAZELİK: dosya bugünün tarihini taşımalı. Bayat dosya sessizce
          kullanılmaz, raporda söylenir (§301 ruhu).
       2) KAPSAM: konsol dosyası, arşivde BUGÜN için zaten yazılı kayıttan
          DAHA AZ fon taşıyorsa KULLANILMAZ. 24 Ağu'da tam bu oldu: sabah
          koşusu 2030 fon yazmıştı, konsol 429 yüzünden 1900'de kalmıştı —
          iyi veriyi eksikle ezmek en sinsi kayıptır (§112 tek sahip +
          §300 "veri kaybı olmayan arızada kırmızı yanmaz" ikizi).
       ÇAPRAZ DENETİM (24 Ağu): 1893 ortak fonda fiyat farkı 0, pay farkı 0 —
       konsol yolu bağımsız kaynakla bit bit mutabık. */
    if (!Object.keys(meta).length || !globalThis.__tefasGetiri) {
      try {
        /* §410c YOL DÜZELTMESİ (canlı ölçüm): KOK zaten 'ktpanel' — içeride
           tekrar 'ktpanel/' yazınca yol 'ktpanel/ktpanel/arac/gelen' oldu;
           readdir hata verdi, catch yuttu, blok TEK KELİME ETMEDEN geçti
           (raporda §410 satırı hiç çıkmadı — en sinsi tür).
           DERS: KOK'E GÖRE YOL YAZ — oku('fon-arsiv.json') deseni. */
        const gelenDizin = 'arac/gelen';
        /* §410c SESSİZ CATCH YASAK: arama yapan blok BULAMADIĞINI da söyler.
           Eski halde catch yutuyordu ve tüm mesajlar if(dosyalar.length)
           içindeydi → arıza görünmezdi (§179.3 sınıfı). */
        let dosyalar = [], dizinNot = '';
        try {
          dosyalar = (await fs.readdir(path.join(KOK, gelenDizin)))
            .filter(f => /^tefas-tam-.*\.json$/i.test(f)).sort();
        } catch (e) { dizinNot = 'okunamadı (' + String((e && e.code) || e).slice(0, 30) + ')'; }
        if (!dosyalar.length) {
          raporlar.push('- §410 konsol dosyası YOK: ' + gelenDizin + '/tefas-tam-*.json ' +
            (dizinNot || 'bulunamadı') + ' — üretmek için: ktpanel/arac/tefas-konsol.js');
        } else {
          const kv = await oku(path.join(gelenDizin, dosyalar[dosyalar.length - 1]));
          const bugunISO = new Date().toISOString().slice(0, 10);
          const aum = Array.isArray(kv && kv.aum) ? kv.aum.filter(x => x && x.fonKodu && x.tedPaySayisi != null) : [];
          /* tekilleştir: iki betik üst üste koşarsa mükerrer gelir (24 Ağu: 2100 kayıt → 1900 tekil) */
          const tek = {}; aum.forEach(x => { tek[x.fonKodu] = x; });
          const nTek = Object.keys(tek).length;
          if (kv.tarih !== bugunISO) {
            raporlar.push('- §410 konsol dosyası BAYAT (' + kv.tarih + ') — kullanılmadı; taze al: ktpanel/arac/tefas-konsol.js');
          } else if (!nTek) {
            raporlar.push('- §410 konsol dosyası boş/eksik alanlı — kullanılmadı');
          } else {
            /* kapsam kapısı: arşivde bugün için yazılı kayıt sayısı */
            let mevcutBugun = 0;
            try {
              const ar = await oku('fon-arsiv.json');
              mevcutBugun = Object.keys((ar.gunler && ar.gunler[bugunISO]) || {}).length;
            } catch (e) {}
            if (mevcutBugun > nTek) {
              raporlar.push('- §410 konsol dosyası KISMİ (' + nTek + ' fon) — arşivde bugün zaten ' + mevcutBugun +
                ' fon var, iyi veri eksikle EZİLMEDİ (kapsam kapısı)');
            } else {
              Object.keys(tek).forEach(k => {
                const x = tek[k], p = Number(x.fiyat);
                if (!isFinite(p) || p <= 0) return;
                const a = Number(x.portfoyBuyukluk);
                meta[k] = { p, aum: isFinite(a) && a > 0 ? a : null,
                            ys: Number(x.kisiSayisi) || null, pay: Number(x.tedPaySayisi) || null };
                fiyat[k] = p;
              });
              if (Array.isArray(kv.getiri) && kv.getiri.length) {
                const G = globalThis.__tefasGetiri || {};
                kv.getiri.forEach(x => { if (x && x.fonKodu) G[x.fonKodu] = x; });
                globalThis.__tefasGetiri = G;
              }
              globalThis.__tefasMeta = meta;
              globalThis.__tefasYol = 'konsol toplayıcı (elle · §410)';
              raporlar.push('- §410 KONSOL DOSYASI KULLANILDI: ' + nTek + ' fon (fiyat+AUM+pay+yatırımcı) · ' +
                ((kv.getiri || []).length) + ' getiri · ' + kv.tarih + ' — elle toplanmış, damgalı katman');
            }
          }
        }
      } catch (e) { raporlar.push('- §410 konsol dosyası okunamadı: ' + String(e && e.message || e).slice(0, 70)); }
    }
  } catch (e) {
    raporlar.push(`### Katılım fonları — ✗ TEFAS erişimi düştü\n- ${String(e.message || e).slice(0, 140)}`);
    if (await tefasKayipMi()) denetimDustu = true;   /* §413 */
  } finally { await browser.close(); }

  /* ── §413 KIRMIZI/SARI AYRIMI ── §300'ün kendi kuralı: VERİ KAYBI OLMAYAN
     ARIZADA İŞ KIRMIZI YAKILMAZ. TEFAS düştüğünde iki AYRI durum var:
       (a) arşivde BUGÜNÜN verisi YOK  → gerçek kayıp, KIRMIZI (bildirim gelsin)
       (b) arşivde BUGÜNÜN verisi VAR  → tazeleyemedik ama panel eksik değil,
           SARI (uyarı satırı; iş yeşil biter, alarm enflasyonu olmaz)
     24-25 Ağu'da (b) üst üste yaşandı: köprü akşam düştü, sabah koşusunun
     yazdığı veri yerindeydi, yine de iş kırmızı yandı ve bildirim geldi. */
  const tefasKayipMi = async () => {
    try {
      const ar = await oku('fon-arsiv.json');
      const n = Object.keys((ar.gunler && ar.gunler[bugun]) || {}).length;
      if (n) { raporlar.push('- §413 not: arşivde bugün (' + bugun + ') zaten ' + n +
        ' fon yazılı — TEFAS tazelenemedi ama VERİ KAYBI YOK, iş sarı (kırmızı değil)'); return false; }
    } catch (e) {}
    return true;
  };

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
    if (await tefasKayipMi()) denetimDustu = true;   /* §413 */
    return null;
  }

  /* Günlük getiri ve dağıtım tuzağı kontrolü — §149'da MPE'nin kâr payı
     dağıtımı tek günde −%3,57 ile yakalanmıştı. Para piyasası fonunda
     ±%2'yi aşan günlük hareket dağıtım demektir, düzeltilmeden yazılmaz. */
  const gunluk = kapsanan.map(k => {
    const f = fonlar.find(x => x.k === k);
    return { kod: k, d: (fiyat[k] / f.yu - 1) * 100 };
  });
  /* §541b (26 Eki, Veri Tazele #407 KALDI): HPH (Hedef Portföy, SPK 17 Eyl tasfiye listesinde) tek günde −%72,7 — bu bir veri hatası
     değil, TASFİYE ARA ÖDEMESİ (nakde çevrilen varlık pay sahiplerine dağıtılınca birim pay değeri düşer). ±%2 dağıtım tuzağı kuralı
     işleyen fonlar içindir; tasfiyedeki fonlar (fon-portfoy.json tasfiye.kodlar — tek kaynak) kuraldan muaf tutulur ve rapora bilgi
     olarak yazılır. Bütün katmanın düşmesi (45 fonun fiyatı yazılmadı) bu tek fona bağlı kalmasın. */
  let _tasf = new Set(); try { _tasf = new Set(Object.keys((((await oku('fon-portfoy.json')) || {}).tasfiye || {}).kodlar || {})); } catch (e) {}
  const _tasfHareket = gunluk.filter(x => _tasf.has(x.kod) && Math.abs(x.d) > 2);
  const kontrol = [
    KURALLAR.kapsam(kapsanan.length, kodlar.length, 0.95),
    KURALLAR.aykiri(gunluk.filter(x => !_tasf.has(x.kod)), 'd', 2),
    KURALLAR.donemArtan(fonlar.filter(f => !_tasf.has(f.k)), [1, 2, 3], 0.5)
  ];
  const s = denetle('Katılım fonları', kontrol);
  raporlar.push(s.rapor() + (_tasfHareket.length ? '\n- ℹ tasfiyedeki fon(lar)da büyük günlük hareket (ara ödeme, kural dışı): ' + _tasfHareket.map(x => x.kod + ' ' + x.d.toFixed(2) + '%').join(' · ') : ''));
  if (!s.gecti) { denetimDustu = true; return null; }

  /* Çapa yöntemi: dönem getirisi eski fiyattan geri hesaplanır, yeni fiyata
     göre yeniden ölçülür. Çapalar sabit kaldığı için tutarlı kayar (§180.1). */
  /* §266 AYNI GÜN İKİNCİ KOŞU 1G'Yİ SIFIRLIYORDU.
     ÖLÇÜLDÜ (12 Ağu): katfon.json'da 46 fonun HEPSİNDE g[0]=0 ve a=0.
     SEBEP: 1G = (yeni/f.yu − 1) hesaplanıyor, hemen ardından f.yu = yeni
     yazılıyor. İlk koşu DOĞRU. Aynı gün ikinci koşuda f.yu ARTIK BUGÜNÜN
     fiyatı → yeni/eski = 1 → 1G TAM SIFIR. Akış da aynı sebeple sıfırlanıyor
     (fon-arsiv.json'daki pay adedi güncellenmiş, Δpay = 0).
     Bugün Actions üç kez `hepsi` koştu ve gerçek 1G değerleri (0,1101 · 0,0998)
     silindi. Panel "+0" gösterdi.
     ÇÖZÜM: dosyanın fiyat_tarihi BUGÜN ise bu bir TEKRAR koşudur — seviyeler
     (fiyat/AUM) tazelenir ama 1G ve akış KORUNUR. İlk koşunun hesabı doğrudur,
     ikincisinin yapacak işi yoktur.
     NOT: bu, §252z'nin (tarih sürekliliği) aynı ailesi — iki ölçüm arasındaki
     GERÇEK zaman farkı sıfırsa, getiri de tanımsızdır. */
  /* §427 (28 Ağu) TEKRAR KOŞU ARTIK VERİDEN ÖLÇÜLÜYOR, TAKVİMDEN DEĞİL.
     CANLI: GitHub 27 Ağu akşam cron'unu 9 saat geciktirdi -> koşu 28 Ağu
     03:22'de (TZ=Europe/Istanbul) çalıştı ve fiyat_tarihi=28 yazdı; TEFAS o
     saatte hâlâ 27'nin fiyatını veriyordu. Öğlen 13:52'deki gerçek 28 koşusu
     "aynı gün" sayıldı, 1G HESAPLANMADI, fiyat 28'e ilerledi -> panelde bir
     gün boyunca 28'in fiyatı + 27'nin getirisi. Koşu tarihi ile veri tarihi
     ayrışınca eski koşul kırılıyordu.
     ÖLÇÜT: gelen fiyat vektörü dosyadakiyle aynıysa (fonların >%90'ında birebir)
     tekrar koşudur; değiştiyse yeni fiyat günüdür — saat kaç olursa olsun.
     Eşleşme ölçülemezse (ilk koşu / boş) eski takvim koşuluna düşülür. */
  const _ayniGun = (() => {
    let ayni = 0, farkli = 0;
    fonlar.forEach(f => { const y = fiyat[f.k]; if (!y || !f.yu) return; (Math.abs(y / f.yu - 1) < 1e-9 ? ayni++ : farkli++); });
    const n = ayni + farkli;
    globalThis.__katfonAyniGun = { ayni, farkli, n };
    if (!n) return String(d.fiyat_tarihi || '') === String(bugun);
    return farkli === 0 || ayni / n > 0.9;
  })();
  let n = 0;
  fonlar.forEach(f => {
    const yeni = fiyat[f.k]; if (!yeni) return;
    const eski = f.yu;
    if (_ayniGun) { f.yu = yeni; n++; return; }   /* tekrar koşu: 1G'ye DOKUNMA */
    for (let i = 1; i < f.g.length; i++) {
      if (f.g[i] == null) continue;
      const capa = eski / (1 + f.g[i] / 100);
      f.g[i] = +((yeni / capa - 1) * 100).toFixed(4);
    }
    f.g[0] = +((yeni / eski - 1) * 100).toFixed(4);
    f.yu = yeni; n++;
  });
  { const k = globalThis.__katfonAyniGun || {};
    if (_ayniGun) raporlar.push('### Katılım fonları — ℹ tekrar koşu (fiyat vektörü değişmedi: ' + (k.ayni||0) + '/' + (k.n||0) + ' aynı): fiyat/AUM tazelendi, 1G ve akış KORUNDU (§266/§427)');
    else if (k.n) raporlar.push('- §427 yeni fiyat günü: ' + k.farkli + '/' + k.n + ' fonda fiyat değişti — 1G ve akış hesaplandı'); }
  /* §249: AUM + yatırımcı canlı; AKIŞ = Δpay × fiyat (dünkü pay arşivden).
     Arşiv yoksa ilk koşu akışı null bırakır ve temeli atar — uydurma yok. */
  const meta = globalThis.__tefasMeta || {};
  const arsivDosya = 'fon-arsiv.json';
  let arsiv = (await varMi(arsivDosya)) ? await oku(arsivDosya) : { gunler: {} };
  /* §266b DÜN = BUGÜN DEĞİL. Önceki hal arşivin SON gününü alıyordu; aynı gün
     ikinci koşuda o gün ZATEN BUGÜNDÜ (ilk koşu yazmıştı) → Δpay = 0 → akış
     46 fonda birden SIFIR. 1G ile aynı kök (§266): iki ölçüm arasındaki gerçek
     zaman farkı sıfırsa değişim de tanımsızdır.
     Artık bugün AÇIKÇA dışlanıyor; hafta sonu/tatil boşluğu kendiliğinden
     atlanır çünkü sıralı son ÖNCEKİ kayıt alınır. */
  const dunKayit = (() => {
    const g = Object.keys(arsiv.gunler || {}).sort().filter(x => x !== bugun);
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
  /* §410b: 'BindHistoryInfo' ölü uç (24 Ağu: HTTP 404, yeni sitede kaldırılmış).
     Damga artık GERÇEK yolu yazar — hangi kanaldan geldiği okunabilir olmalı. */
  const _yolAd = globalThis.__tefasYol || 'TEFAS';
  d.guncelleme = `${bugun} — otomatik (GitHub Actions · ${_yolAd}: fiyat+AUM+yatırımcı${dunKayit ? '+akış' : '; akış arşiv doldukça'})`;
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

/* ── §459 BIST BİLANÇO TAKVİMİ — KAP'TAN OTOMATİK (12 Eki) ─────────────────────
   Taramada yakalandı: bist-takvim.json 18 Ağu'da (2Ç26) kalmıştı; kart Ekim'in
   ortasında hâlâ "JANTS GECİKTİ · SPK sınırı 14–29 Ağu" basıyordu ve Ebu o ölü
   tabloya taze yorum yazıyordu (§166'daki hastalığın aynısı, bu kez veri
   katmanında). Sebep: takvim Fintables'tan ELLE üretiliyordu, sezon dönünce kimse
   yenilemedi.
   KAYNAK DEĞİŞTİ: Fintables yerine KAP'ın kendi sorgusu — bilanço tetiğinin zaten
   kullandığı POST /tr/api/disclosure/members/byCriteria. Kayıtlar {disclosureClass
   'FR', subject 'Finansal Rapor', year, period, publishDate 'GG.AA.YYYY', stockCodes}
   taşıyor (12 Eki tarayıcıdan ölçüldü; yanıt 2000 kayıtta KESİLİYOR → pencere
   2 gün). Üç iş:
     (1) SEZON BAŞI: dosyanın donem'i bugünün sezonundan farklıysa geçen yılın aynı
         dönem penceresi taranır, şirket başına EN ERKEN yayın +364 gün (aynı hafta
         günü) → beklenen. Hafta sonuna düşen tahmin Pazartesi'ye alınır.
     (2) HER KOŞU: tetik sorgusunun getirdiği FR kayıtlarından bu sezonun
         "Finansal Rapor"ları gerçekleşen'e yazılır, beklenen'den düşer. Ek istek yok.
     (3) SPK sınırı sezona göre hesaplanır (3/9 ay 30-40 gün · 6 ay 40-50 · yıllık
         60-70); kart bunu DOSYADAN okur, kodda gömülü "14–29 Ağu" kalktı (app §459b).
   Evren: XKTUM + XK100 + endeks-uyeler. DERS: SEZONLUK BİR VERİYİ ELLE ÜRETİYORSAN
   SEZON DÖNDÜĞÜNDE BAYATLAR — ritmi olan her katmanın üreticisi de o ritimde koşmalı. */
function sezonBul(tarih) {
  const d = new Date(tarih + 'T12:00:00Z'); const y = d.getUTCFullYear(), m = d.getUTCMonth() + 1, g = d.getUTCDate();
  const iso = (dt) => dt.toISOString().slice(0, 10);
  const ekle = (isoT, n) => { const x = new Date(isoT + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return iso(x); };
  const AYK = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
  const kisa = (isoT) => { const p = isoT.split('-'); return (+p[2]) + ' ' + AYK[+p[1] - 1]; };
  let per, yil, donemSon, gunSolo, gunKons, pBas, pSon;
  if (m <= 3 || (m === 4 && g <= 12)) { per = 4; yil = y - 1; donemSon = (y - 1) + '-12-31'; gunSolo = 60; gunKons = 70; pBas = (y - 1) + '-01-25'; pSon = (y - 1) + '-04-15'; }
  else if (m <= 6) { per = 1; yil = y; donemSon = y + '-03-31'; gunSolo = 30; gunKons = 40; pBas = (y - 1) + '-04-15'; pSon = (y - 1) + '-06-10'; }
  else if (m <= 9) { per = 2; yil = y; donemSon = y + '-06-30'; gunSolo = 40; gunKons = 50; pBas = (y - 1) + '-07-15'; pSon = (y - 1) + '-09-10'; }
  else { per = 3; yil = y; donemSon = y + '-09-30'; gunSolo = 30; gunKons = 40; pBas = (y - 1) + '-10-14'; pSon = (y - 1) + '-12-01'; }
  const spkSolo = ekle(donemSon, gunSolo), spkKons = ekle(donemSon, gunKons);
  const etiket = (per === 4 ? 'Yıllık ' + yil : per + 'Ç' + String(yil).slice(2));
  return { per, yil, donem: etiket, donemSon, sezonBas: ekle(donemSon, 1), spkSolo, spkKons, spkKisa: kisa(spkSolo) + ' (solo) · ' + kisa(spkKons) + ' (konsolide)', pBas, pSon,
    spkMetin: etiket + ': konsolide olmayan ' + gunSolo + ' gün (' + kisa(spkSolo) + ' ' + spkSolo.slice(0, 4) + ') · konsolide ' + gunKons + ' gün (' + kisa(spkKons) + ' ' + spkKons.slice(0, 4) + '). Bu tarihi aşan tahmin, mali yılı takvim yılıyla uyuşmayan ya da geçen yıl gecikmiş şirket demektir — ayrı tutulur.' };
}
async function kapFrPencere(bas, son) {
  /* 2 günlük dilimler — yanıt 2000 kayıtta kesiliyor (12 Eki ölçümü: 3 günlük dilimde 1708 görüldü) */
  const uyku = ms => new Promise(r => setTimeout(r, ms));
  const BAS = { 'content-type': 'application/json', 'accept': 'application/json', 'referer': 'https://www.kap.org.tr/tr/bildirim-sorgu',
    'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36' };
  const out = []; let d = new Date(bas + 'T12:00:00Z'); const sonD = new Date(son + 'T12:00:00Z'); let hata = 0, dilim = 0;
  while (d <= sonD) {
    const a = d.toISOString().slice(0, 10); const b = new Date(d); b.setUTCDate(b.getUTCDate() + 1); const bI = (b <= sonD ? b : sonD).toISOString().slice(0, 10);
    try {
      const r = await fetch('https://www.kap.org.tr/tr/api/disclosure/members/byCriteria', { method: 'POST', headers: BAS,
        body: JSON.stringify({ fromDate: a, toDate: bI, mkkMemberOidList: [], subjectList: [] }), signal: AbortSignal.timeout(20000) });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const j = await r.json(); const items = Array.isArray(j) ? j : (j.items || j.data || []);
      if (items.length >= 2000) raporlar.push('- ⚠ §459 KAP yanıtı ' + a + ' diliminde 2000 kayıtta kesildi — dilim daraltılmalı');
      out.push(...items); dilim++;
    } catch (e) { hata++; if (hata >= 3) throw new Error('KAP byCriteria 3 hata: ' + String(e.message || e).slice(0, 40)); }
    d = new Date(b); d.setUTCDate(d.getUTCDate() + 1); await uyku(400);
  }
  return { items: out, dilim };
}
function frKayitlari(items, yil, per) {
  const m = {};
  (items || []).forEach(b => {
    if (String(b.disclosureClass || b.disclosureType || '').toUpperCase() !== 'FR') return;
    if (!/^Finansal Rapor/i.test(String(b.subject || ''))) return;
    if (+b.year !== yil || +b.period !== per) return;
    const k = String(b.stockCodes || b.stockCode || '').split(/[,;\s]+/)[0].trim().toUpperCase(); if (!/^[A-Z]{4,6}$/.test(k)) return;
    const t = /^(\d{2})\.(\d{2})\.(\d{4})/.exec(String(b.publishDate || '')); if (!t) return; const iso = t[3] + '-' + t[2] + '-' + t[1];
    if (!m[k] || iso < m[k]) m[k] = iso;
  });
  return m;
}
/* §549c: aynı FR kayıtlarından bildirim kimliği (disclosureIndex) — KAP arşivi dönem listesi alamazsa (ASELS/BETAE "fetch failed",
   28 Eki) yeni çeyreği doğrudan bu kimlikle çeker. Şirket başına en büyük kimlik (düzeltme bildirimi yeniyi ezer). */
function frIdler(items, yil, per) {
  const m = {};
  (items || []).forEach(b => {
    if (String(b.disclosureClass || b.disclosureType || '').toUpperCase() !== 'FR') return;
    if (!/^Finansal Rapor/i.test(String(b.subject || ''))) return;
    if (+b.year !== yil || +b.period !== per) return;
    const k = String(b.stockCodes || b.stockCode || '').split(/[,;\s]+/)[0].trim().toUpperCase(); if (!/^[A-Z]{4,6}$/.test(k)) return;
    const id = b.disclosureIndex || b.id; if (!id) return;
    if (!m[k] || +id > +m[k]) m[k] = String(id);
  });
  return m;
}
async function bilancoTakvimIsle(tetikItems) {
  const dosya = 'bist-takvim.json';
  const S = sezonBul(bugun);
  let d = {}; try { if (await varMi(dosya)) d = await oku(dosya); } catch (e) { d = {}; }
  let degisti = false;
  /* evren */
  let evren = new Set();
  try { const x = await oku('xktum.json'); Object.keys(x.uyeler || {}).forEach(k => evren.add(k)); } catch (e) {}
  try { const x = await oku('xk100.json'); Object.keys(x.uyeler || x.agirliklar || {}).forEach(k => evren.add(k)); } catch (e) {}
  try { const x = await oku('endeks-uyeler.json'); Object.values(x.uyeler || {}).forEach(v => { if (Array.isArray(v)) v.forEach(k => evren.add(k)); }); } catch (e) {}
  if (!evren.size) { raporlar.push('### BIST bilanço takvimi (§459) — ⏭ evren listesi yok'); return; }
  /* (1) sezon başı: tahmin listesi */
  if (d.donem !== S.donem) {
    const { items, dilim } = await kapFrPencere(S.pBas, S.pSon);
    const gecen = frKayitlari(items, S.per === 4 ? S.yil - 1 : S.yil - 1, S.per);
    const bek = {}, yok = [];
    const sabit = {}; if (gecen.KRDMA) { sabit.KRDMB = gecen.KRDMA; sabit.KRDMD = gecen.KRDMA; }   /* aynı şirket, üç kod */
    for (const k of [...evren].sort()) {
      const g = gecen[k] || sabit[k]; if (!g) { yok.push(k); continue; }
      const x = new Date(g + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + 364);
      const wd = x.getUTCDay(); if (wd === 6) x.setUTCDate(x.getUTCDate() + 2); else if (wd === 0) x.setUTCDate(x.getUTCDate() + 1);   /* hafta sonu → Pazartesi */
      bek[k] = x.toISOString().slice(0, 10);
    }
    const farkli = {}; Object.keys(bek).forEach(k => { if (bek[k] > S.spkKons) { farkli[k] = { tahmin: bek[k], gecenYil: gecen[k] || sabit[k] }; delete bek[k]; } });
    const eski = d.donem ? { donem: d.donem, gerceklesen: d.gerceklesen || {} } : null;
    d = { _aciklama: 'BIST ' + S.donem + ' BEKLENEN bilanço açıklama tarihleri (dönem sonu ' + S.donemSon + ').',
      _yontem: 'TAHMİN — geçen yılın aynı dönem KAP "Finansal Rapor" bildirimi yayın tarihi (publishDate) +364 gün, AYNI HAFTA GÜNÜNE hizalı; hafta sonuna düşen Pazartesi\'ye alınır. BAĞLAYICI DEĞİLDİR (10 Ağu 2026 ölçümü: ortalama mutlak sapma 2,7 gün). GECİKTİ rozeti 3 gün toleranslı (app §459b).',
      _neden_tahmin: 'BIST/KAP makine-okunur "beklenen bilanço tarihi" tablosu yayımlamıyor; şirketlerin Finansal Takvim bildirimi serbest metin. Geçen yıl deseni en sağlam ÖLÇÜLEBİLİR yaklaşım.',
      _spk_siniri: S.spkMetin, _spk_kisa: S.spkKisa, _spk_son: S.spkKons, _sezon_bas: S.sezonBas,
      _kaynak: 'KAP /tr/api/disclosure/members/byCriteria · pencere ' + S.pBas + ' → ' + S.pSon + ' (' + dilim + ' dilim) · disclosureClass=FR · subject "Finansal Rapor" · year/period eşleşmeli · şirket başına en erken yayın (Actions §459, ' + bugun + ')',
      tarih: bugun, donem: S.donem, adet: Object.keys(bek).length, beklenen: Object.fromEntries(Object.entries(bek).sort((a, b) => a[1].localeCompare(b[1]) || a[0].localeCompare(b[0]))),
      farkli_mali_yil: farkli, gerceklesen: {},
      _tahmin_yok: { kodlar: yok, neden: 'Geçen yıl aynı dönemde KAP\'ta Finansal Rapor yok: yeni halka arz, farklı mali yıl ya da farklı bildirim başlığı. Açıklayınca gerçek tarihiyle takvime girer.' },
      _onceki_sezon: eski };
    degisti = true;
    raporlar.push('### BIST bilanço takvimi (§459) — ✓ ' + S.donem + ' tahmini üretildi: ' + Object.keys(bek).length + ' şirket · tahmin yok ' + yok.length + ' · mali yılı farklı ' + Object.keys(farkli).length + ' · SPK ' + S.spkKisa);
  }
  /* (2) gerçekleşen: tetik sorgusu (dün→bugün) + sezon içinde 3 günlük geriye bakış
     (hafta sonu/tatil atlanan koşuda Cuma akşamı yayınları kaçmasın; 2 istek) */
  let kaynakItems = tetikItems || [];
  try {
    const ekle2 = (isoT, n) => { const x = new Date(isoT + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
    if (bugun >= ekle2(S.sezonBas, 10) && bugun <= ekle2(S.spkKons, 20)) { const geri = await kapFrPencere(ekle2(bugun, -3), bugun); kaynakItems = kaynakItems.concat(geri.items); }
  } catch (e) { raporlar.push('- ⚠ §459 geriye bakış sorgusu düştü: ' + String(e.message || e).slice(0, 60)); }
  const bu = frKayitlari(kaynakItems, S.yil, S.per); let yeni = 0;
  d.gerceklesen = d.gerceklesen || {}; d.beklenen = d.beklenen || {};
  Object.keys(bu).forEach(k => { if (!evren.has(k)) return; if (!d.gerceklesen[k]) { d.gerceklesen[k] = bu[k]; yeni++; } if (d.beklenen[k]) delete d.beklenen[k]; if (d.farkli_mali_yil && d.farkli_mali_yil[k]) delete d.farkli_mali_yil[k]; });
  /* §549c bildirim kimlikleri: gerçekleşen her kod için {tarih, id} — arşivin "yeni dönem" yolu bunu okur */
  try { const ids = frIdler(kaynakItems, S.yil, S.per); d.bildirim = d.bildirim || {}; let yeniId = 0;
    Object.keys(ids).forEach(k => { if (!evren.has(k)) return; if (!d.bildirim[k] || d.bildirim[k].id !== ids[k]) { d.bildirim[k] = { tarih: bu[k] || d.gerceklesen[k] || bugun, id: ids[k] }; yeniId++; } });
    if (yeniId) degisti = true; } catch (e) {}
  if (yeni) { d.adet = Object.keys(d.beklenen).length; d.tarih = bugun; degisti = true;
    raporlar.push('### BIST bilanço takvimi (§459) — ✓ ' + yeni + ' şirket açıkladı (' + Object.keys(bu).filter(k => evren.has(k)).slice(0, 12).join(', ') + ') · beklenen ' + d.adet + ' · gerçekleşen ' + Object.keys(d.gerceklesen).length); }
  else if (d.donem === S.donem) raporlar.push('### BIST bilanço takvimi (§459) — ✓ ' + S.donem + ' · beklenen ' + Object.keys(d.beklenen).length + ' · gerçekleşen ' + Object.keys(d.gerceklesen).length + ' · bugün yeni açıklama yok');
  if (degisti) { await yaz(dosya, d); degisenler.push('bilanço takvimi (' + S.donem + ')'); }
}

async function bilancoTetik() {
  const dosya = 'bilanco-tetik.json';
  try {
    /* §299 PENCERE → KÜMÜLATİF BORÇ DEFTERİ.
       ESKİ DAVRANIŞ (hatalıydı): her koşuda KAP'ın son 1 günlük FR listesi
       dosyanın ÜZERİNE yazılıyordu. Dosya "son günlerde bilanço açıklayanlar"
       fotoğrafıydı; oysa panel şeridi onu "kartı yazılmayı bekleyenler" diye
       okuyor. İki farklı soru, tek dosya.
       ÖLÇÜLDÜ: 15 Ağu 128 → 16 Ağu 43 → 17 Ağu 52. Sayı düşmesi kart yazıldığı
       için değil, PENCERE KAYDIĞI içindi — 85 şirket bir gecede sessizce
       listeden düştü ve borç görünmez oldu (§245k: sessiz düşüş yasak).
       YENİ DAVRANIŞ: dosya bir BORÇ DEFTERİdir. Bir kod listeye girdiğinde
       ancak kartı yazılınca çıkar. Ödenmemiş borç, pencere kaysa da defterde
       durur — muhasebenin en eski kuralı.
       DÜŞÜŞ TEK SEBEPLE OLUR: inceleme-ai.json'da o koda kart yazılmış olması.
       ilk_gorulme: her kodun deftere ilk girdiği gün. Borcun YAŞI görünür olur;
       bir bilanço 20 gündür kartsız bekliyorsa bu, sayının kendisinden daha
       çok şey söyler.
       YOKSAY: kullanıcının "bu bilançoyu atla" işareti (ktp_bilanco_yoksay_v1)
       tarayıcı/bulut tarafındadır, sunucu göremez — kabul edilen sınır. Panel
       şeridi yoksayılanları istemci tarafında süzmeye devam eder; defter yalnız
       "kart yazıldı mı" sorusunu bilir. */
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
    try { await bilancoTakvimIsle(items); } catch (e) { raporlar.push('### BIST bilanço takvimi (§459) — ✗ ' + String(e && e.message || e).slice(0, 80)); }   /* §459 */
    const pencere = [...new Set(items
      .filter(b => String(b.disclosureType || b.disclosureCategory || '').toUpperCase().includes('FR'))
      .map(b => String(b.stockCodes || b.stockCode || '').split(/[,;\s]+/)[0].trim().toUpperCase())
      .filter(k => /^[A-Z]{4,6}$/.test(k)))].sort();

    /* 1) Mevcut defteri oku. Dosya yoksa/bozuksa boş defterle başla —
          KAP çekimi başarılıyken eski dosya yüzünden katman düşmemeli. */
    let eskiKodlar = [], ilkGorulme = {};
    try {
      if (await varMi(dosya)) {
        const d = await oku(dosya);
        eskiKodlar = [...(Array.isArray(d.kodlar) ? d.kodlar : []), ...(Array.isArray(d.evren_disi) ? d.evren_disi : [])]   /* §428: saklı liste de defterin parçası */
          .filter(k => /^[A-Z]{4,6}$/.test(String(k)));
        ilkGorulme = (d.ilk_gorulme && typeof d.ilk_gorulme === 'object') ? { ...d.ilk_gorulme } : {};
      }
    } catch (e) { raporlar.push('- ⚠ eski tetik dosyası okunamadı, defter sıfırdan kuruluyor: ' + String(e.message || e).slice(0, 60)); }

    /* 2) Kartı yazılmış kodlar — borcun ÖDENDİĞİ tek kanıt. Dosya okunamazsa
          BOŞ KÜME değil, DÜŞÜŞ YOK sayılır: kart listesi gelmedi diye 52 borcu
          birden "ödenmiş" göstermek, sessiz veri kaybının ta kendisi olurdu. */
    let kartli = null;
    try {
      const inc = await oku('inceleme-ai.json');
      const dizi = Array.isArray(inc.kartlar) ? inc.kartlar : [];
      kartli = new Set(dizi.map(k => String(k.kod || '').trim().toUpperCase()).filter(Boolean));
    } catch (e) { raporlar.push('- ⚠ inceleme-ai.json okunamadı; bu koşuda düşüm YAPILMADI (defter korundu)'); }

    /* 3) Birleştir: (eski ∪ yeni) − kartlılar */
    const birlesikSet = new Set([...eskiKodlar, ...pencere]);
    const yeniGelenler = pencere.filter(k => !eskiKodlar.includes(k));
    const dusenler = kartli ? [...birlesikSet].filter(k => kartli.has(k)).sort() : [];
    dusenler.forEach(k => { birlesikSet.delete(k); delete ilkGorulme[k]; });
    /* §428 (28 Ağu) DEFTER EVRENE SÜZÜLDÜ. ÖLÇÜLDÜ: 226 borcun yalnız 67'si
       katılım evreninde (XKTUM ∪ XK100 ∪ XKTMT). Sunucu defteri KAP'taki HER FR
       bildirimini topluyordu; tarayıcıdaki nöbet (§219) ise evrene süzüyor —
       iki sayaç farklı şeyi sayıyordu, "226 kart bekliyor" panelin gerçek
       borcu değildi. Evren dışı kodlar SİLİNMEZ (§245k): ayrı listede durur,
       ilk_gorulme korunur; evrene sonradan girerse borç yaşıyla birlikte
       ana deftere döner. Kartı olan kodlar (inceleme-ai.json) evrene dahildir.
       Üyelik dosyası okunamazsa süzme YAPILMAZ (eski davranış) — eksik evren
       yüzünden borç görünmez olmasın. */
    let evren = null;
    try {
      const E = new Set();
      for (const f of ['xktum.json', 'xk100.json', 'xktmt.json']) {
        const u = (await oku(f)).uyeler || {};
        Object.keys(u).forEach(k => E.add(String(k).toUpperCase()));
      }
      if (kartli) kartli.forEach(k => E.add(k));
      if (E.size > 50) evren = E;
    } catch (e) { raporlar.push('- ⚠ §428 üyelik dosyası okunamadı, evren süzgeci uygulanmadı: ' + String(e.message || e).slice(0, 60)); }
    const hepsiKod = [...birlesikSet].sort();
    hepsiKod.forEach(k => { if (!ilkGorulme[k]) ilkGorulme[k] = bugun; });
    const kodlar = evren ? hepsiKod.filter(k => evren.has(k)) : hepsiKod;
    const evrenDisi = evren ? hepsiKod.filter(k => !evren.has(k)) : [];

    /* 4) Borcun yaşı — en eski bekleyen kaç gündür defterde */
    const yas = k => Math.round((new Date(bugun) - new Date(ilkGorulme[k])) / GUN);
    const enEski = kodlar.length ? kodlar.slice().sort((a, b) => yas(b) - yas(a))[0] : null;

    await yaz(dosya, { tarih: bugun, kodlar, sayi: kodlar.length, ilk_gorulme: ilkGorulme,
      evren_disi: evrenDisi, evren_disi_sayi: evrenDisi.length,   /* §428: saklanır, sayılmaz */
      pencere_sayi: pencere.length, dusen_son: dusenler,
      guncelleme: new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC — otomatik (KAP FR · kümülatif §299)' });

    /* §299 NÖBETÇİ: defter yaşı denetime bağlanır. Kural UYARI üretir, işi
       kırmızı yakmaz — kart yazmak insan işi, otomasyon onu zorlayamaz; ama
       "20 gündür kartsız" bilgisi her koşuda rapora düşer. */
    try {
      const d = denetle('Bilanço borç defteri', [KURALLAR.borcYasi(kodlar, ilkGorulme, bugun)]);
      raporlar.push(d.rapor());
    } catch (e) { raporlar.push('- ⚠ borç defteri denetimi koşmadı: ' + String(e.message || e).slice(0, 60)); }

    raporlar.push('### Bilanço tetiği (§299 kümülatif) — ✓ ' + kodlar.length + ' şirket kart bekliyor' +
      (evren ? ' (katılım evreni · evren dışı ' + evrenDisi.length + ' saklı, §428)' : '') +
      '\n- pencere: ' + pencere.length + ' FR · yeni deftere giren: ' + yeniGelenler.length +
      (yeniGelenler.length ? ' (' + yeniGelenler.slice(0, 10).join(', ') + (yeniGelenler.length > 10 ? ' …' : '') + ')' : '') +
      '\n- ' + (kartli ? ('kart yazılıp düşen: ' + dusenler.length +
        (dusenler.length ? ' (' + dusenler.slice(0, 10).join(', ') + (dusenler.length > 10 ? ' …' : '') + ')' : '')) :
        '⚠ kart listesi okunamadı — bu koşuda düşüm yapılmadı') +
      (enEski ? '\n- en eski borç: ' + enEski + ' · ' + yas(enEski) + ' gündür bekliyor' +
        (yas(enEski) >= 14 ? ' ⚠' : '') : '') +
      (kodlar.length ? '\n- ' + kodlar.slice(0, 20).join(', ') + (kodlar.length > 20 ? ' …' : '') : ''));
    degisenler.push('bilanço tetiği (' + kodlar.length + ' bekliyor)');
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
/* §263 FON AKIŞI — PAY ADEDİ YÖNTEMİ.
   ÖLÇÜLDÜ (12 Ağu, 25 gözlem): ham ΔAUM net akışa EŞİT DEĞİLDİR — ortalama
   %48 sapar, çünkü AUM hem akıştan hem GETİRİDEN değişir. T3B'de akış tam
   sıfırken AUM 6 günde +%9 arttı (tamamı getiri).
   DOĞRU FORMÜL:  akış = (pay_t − pay_t−1) × fiyat_t
   Pay adedi getiriden ETKİLENMEZ; yalnız alım/satımla değişir. Aynı 25
   gözlemde Fintables'ın kendi gunluk_nakit_giris_cikisi alanıyla BİREBİR
   tuttu (medyan hata %0, 25/25 gözlemde <%10).
   VERİ ZATEN ELDE: mod=gnl yanıtı tedPaySayisi + fiyat veriyor, bölmeye bile
   gerek yok. Tek eksik DÜNÜN pay adediydi — bu arşiv onu tutar.
   FINTABLES GEREKMİYOR: hesap tamamen TEFAS köprüsünden. */
async function fonAkisArsiv(meta, kurucu) {
  const dosya = 'fon-akis.json';
  try {
    let a = { gunler: {}, _yontem: '' };
    if (await varMi(dosya)) { try { a = await oku(dosya) || a; } catch (e) {} }
    a.gunler = a.gunler || {};
    /* Bugünün pay+fiyat anlık görüntüsü — yalnız pay adedi bilinen fonlar */
    const bugunKayit = {};
    for (const k of Object.keys(meta)) {
      const m = meta[k];
      if (m && isFinite(m.pay) && m.pay > 0 && isFinite(m.p) && m.p > 0) {
        bugunKayit[k] = [ +m.pay.toFixed(2), +m.p.toFixed(6) ];   /* [pay, fiyat] */
      }
    }
    if (!Object.keys(bugunKayit).length) return;
    a.gunler[bugun] = bugunKayit;
    /* §359 PENCERE 15 -> 26 GÜN (20 Ağu, kullanıcı: "haftalık da eklesek
       bozulur mu"). Bozmaz — tam tersi, hesap için gereken zaten burada.
       1G iki gün ister, 1H beş iş günü, 1A yirmi iki iş günü.
       ÖLÇÜM: gün başına ~0,108 MB (1971 fon); 26 gün ≈ 2,8 MB. Kabul edilebilir
       (repo dosyası, panel yalnız özetleri okuyor — ham günleri değil). */
    const gunler = Object.keys(a.gunler).sort();
    while (gunler.length > 26) { delete a.gunler[gunler.shift()]; }
    /* AKIŞ HESABI: bir önceki KAYITLI günle karşılaştır (hafta sonu boşluğu
       kendiliğinden atlanır — ardışık kayıt yoksa hesap yapılmaz). */
    const sonIki = Object.keys(a.gunler).sort().slice(-2);
    a.akis = null;
    if (sonIki.length === 2) {
      const [g0, g1] = sonIki, e0 = a.gunler[g0], e1 = a.gunler[g1];
      const fon = {};
      let n = 0;
      for (const k of Object.keys(e1)) {
        if (!e0[k]) continue;
        const dPay = e1[k][0] - e0[k][0];
        const akis = dPay * e1[k][1];
        /* AKLI BAŞINDA SINIR: tek fonda tek günde 50 mlr TL akış olmaz —
           pay adedi düzeltmesi ya da bölünme olabilir, sessizce kabul etme. */
        if (!isFinite(akis) || Math.abs(akis) > 5e10) continue;
        fon[k] = Math.round(akis);
        n++;
      }
      a.akis = { onceki: g0, gun: g1, adet: n, fon };

      /* ── §358 PYŞ BAZINDA AKIŞ (20 Agu, kullanici: "PYS kartinda veri 13 gun
         eski, TEFAS koprusu Actions'ta calisiyor, oradan turetelim") ────────
         OLCULDU: fon-akis.json zaten (a) gunluk fon akisini (pay x fiyat farki)
         ve (b) `kurucu` eslemesini tasiyor — 1966 fonun 1957'si esleniyor.
         Eksik olan tek sey KURUM BAZINDA TOPLAM. Elle beslenen pyssektor.json
         (10 Agu damgali) yerine bu blok her kosuda tazelenir.
         AD NORMALIZASYONU SART: ayni kurum iki isimle geciyor —
           "AK PORTFÖY YÖNETİMİ A.Ş." ve "AK PORTFÖY" ayri toplaniyordu
           (+10,31 ve +1,60 mlr diye BOLUNMUS gorunuyordu; dogrusu +11,91).
         Kural: "PORTFÖY/YÖNETİMİ/A.Ş." ekleri atilir, kalan ad kurumdur. */
      const kurucuAd = (h) => String(h || '')
        .toLocaleUpperCase('tr')
        .replace(/\s*PORTF[ÖO]Y\s*Y[ÖO]NET[İI]M[İI]?\s*/g, ' ')
        .replace(/\s*PORTF[ÖO]Y\s*/g, ' ')
        .replace(/\s*A\.?\s*[ŞS]\.?\s*/g, ' ')
        .replace(/\s+/g, ' ').trim();
      const kurucuHar = a.kurucu || {};
      const pysTop = {}, pysAdet = {};
      let eslesmeyen = 0;
      for (const kod of Object.keys(fon)) {
        const ad = kurucuAd(kurucuHar[kod]);
        if (!ad) { eslesmeyen++; continue; }
        pysTop[ad] = (pysTop[ad] || 0) + fon[kod];
        pysAdet[ad] = (pysAdet[ad] || 0) + 1;
      }
      const pysListe = Object.keys(pysTop)
        .map(ad => ({ ad, net: Math.round(pysTop[ad]), fon: pysAdet[ad] }))
        .sort((x, y) => y.net - x.net);
      a.pys = { gun: g1, onceki: g0, adet: pysListe.length, eslesmeyen, liste: pysListe };

      /* ── §359 HAFTALIK + AYLIK PENCERELER ────────────────────────────────
         Aynı yöntem, farklı taban gün: akış = (pay_son − pay_taban) × fiyat_son.
         1H = 5 iş günü geriye, 1A = 22 iş günü geriye (yoksa en eski kayıt).
         Taban gün YETERSİZSE pencere ÜRETİLMEZ — kısa seriyle "aylık" demek
         yanıltıcı olurdu; panel o sekmeyi göstermez.
         Fon ve tür kırılımları da aynı pencerelerde üretilir ki kart üç blokta
         da Günlük/Haftalık/Aylık gösterebilsin. */
      const tumGun = Object.keys(a.gunler).sort();
      const pencere = (geriIsGunu) => {
        const sonIdx = tumGun.length - 1;
        const tabanIdx = sonIdx - geriIsGunu;
        if (tabanIdx < 0) return null;
        const gT = tumGun[tabanIdx], gS = tumGun[sonIdx];
        const eT = a.gunler[gT], eS = a.gunler[gS];
        const f = {}; let say = 0;
        for (const k of Object.keys(eS)) {
          if (!eT[k]) continue;
          const v = (eS[k][0] - eT[k][0]) * eS[k][1];
          if (!isFinite(v) || Math.abs(v) > 5e11) continue;
          f[k] = Math.round(v); say++;
        }
        if (say < 100) return null;
        const kur = {}, kurAdet = {};
        for (const k of Object.keys(f)) {
          const ad = kurucuAd(kurucuHar[k]); if (!ad) continue;
          kur[ad] = (kur[ad] || 0) + f[k]; kurAdet[ad] = (kurAdet[ad] || 0) + 1;
        }
        return { taban: gT, gun: gS, adet: say,
          pys: Object.keys(kur).map(ad => ({ ad, net: Math.round(kur[ad]), fon: kurAdet[ad] })).sort((x, y) => y.net - x.net),
          fon: Object.keys(f).map(k => ({ k, net: f[k] })).sort((x, y) => y.net - x.net).slice(0, 40) };
      };
      a.pencereler = { '1H': pencere(5), '1A': pencere(22) };
      const pAd = Object.keys(a.pencereler).filter(k => a.pencereler[k]);
      raporlar.push('### Akış pencereleri (§359) — ' + (pAd.length ? ('✓ ' + pAd.join(', ') + ' hazır') : '⏭ henüz yeterli gün yok') +
        ' · arşiv ' + tumGun.length + ' gün' +
        (a.pencereler['1H'] ? ('\n- 1H giriş: ' + a.pencereler['1H'].pys.slice(0,3).map(x=>x.ad+' '+(x.net/1e9).toFixed(1)+' mlr').join(' · ')) : '') +
        (a.pencereler['1A'] ? ('\n- 1A giriş: ' + a.pencereler['1A'].pys.slice(0,3).map(x=>x.ad+' '+(x.net/1e9).toFixed(1)+' mlr').join(' · ')) : ''));
      raporlar.push('### PYŞ bazında akış (§358) — ✓ ' + pysListe.length + ' kurum · ' + g1 +
        (eslesmeyen ? (' · ' + eslesmeyen + ' fon eşleşmedi') : '') +
        '\n- giriş: ' + pysListe.slice(0, 3).map(x => x.ad + ' ' + (x.net / 1e9).toFixed(2) + ' mlr').join(' · ') +
        '\n- çıkış: ' + pysListe.slice(-3).map(x => x.ad + ' ' + (x.net / 1e9).toFixed(2) + ' mlr').join(' · '));
    }
    /* Kurucu eşlemesi arşivde tutulur — panel PYŞ bazında gruplayabilsin.
       Yalnız DOLU gelirse yazılır; liste ucu düşerse eski eşleme korunur. */
    if (kurucu && Object.keys(kurucu).length > 50) a.kurucu = kurucu;
    a.guncelleme = bugun;
    a._yontem = 'akis = (pay_t - pay_t-1) x fiyat_t. Pay adedi GETIRIDEN etkilenmez; ham dAUM %48 sapar (§263). '
      + 'Kaynak: TEFAS kopru mod=gnl (tedPaySayisi + fiyat). Fintables GEREKMEZ.';
    await yaz(dosya, a);
    const n = (a.akis && a.akis.adet) || 0;
    if (n) {
      const v = Object.values(a.akis.fon);
      const giris = v.filter(x => x > 0).reduce((s, x) => s + x, 0);
      const cikis = v.filter(x => x < 0).reduce((s, x) => s + x, 0);
      degisenler.push('fon akışı (' + n + ')');
      raporlar.push('### Fon akışı (§263) — ✓ ' + n + ' fon · ' + a.akis.onceki + ' → ' + a.akis.gun
        + '\n- giriş ' + (giris / 1e9).toFixed(2) + ' mlr ₺ · çıkış ' + (cikis / 1e9).toFixed(2)
        + ' mlr ₺ · net ' + ((giris + cikis) / 1e9).toFixed(2) + ' mlr ₺');
    } else {
      raporlar.push('### Fon akışı (§263) — ℹ ilk gün kaydedildi, akış için ikinci gün gerekli ('
        + Object.keys(a.gunler).length + ' gün arşivde)');
    }
  } catch (e) {
    raporlar.push('### Fon akışı (§263) — ⏭ ' + String(e && e.message || e).slice(0, 80));
  }
}
/* §291 SICIL SERISI GUNLUK EKLENIR — fon-akis (§263) deseninin sicil ikizi.
   OLCULDU (17 Agu): holdings fiyatlari tazeleniyordu ama series'e 28 Tem'den
   beri satir eklenmiyordu — dosya damgasi "taze", sicil OLUYDU; model karnesi
   20 gunluk donuk seriden anlatiliyordu ve plan katmani "canli" etiketiyle
   nobetten kaciyordu.
   KURALLAR: endeks degeri AYNI GUNUN arsiv kaydindan — yoksa satir YAZILMAZ
   (uydurma yok). Bosluk geriye DOLDURULMAZ; gorunur not dusulur (§252z:
   iki olcum arasindaki gercek zaman farki etikette gorunmeli). */
async function sicilSeriEkle() {
  const dosya = 'track.json';
  try {
    if (!(await varMi(dosya))) return;
    const t = await oku(dosya);
    if (!t || !Array.isArray(t.holdings) || !Array.isArray(t.series)) return;
    const gun = String(t.fiyat_tarihi || '');            /* fiyatTazele az once yazdi */
    if (!/^\d{4}-\d{2}-\d{2}$/.test(gun)) return;
    let xk = null;
    try { const ea = await oku('endeks-arsiv.json');
      xk = ea && ea.gunler && ea.gunler[gun] && +ea.gunler[gun].XKTUM; } catch (e) {}
    if (!isFinite(xk) || xk <= 0) {
      raporlar.push('### Model sicili serisi (§291) — ⏭ ' + gun + ' icin XKTUM arsivde yok; satir yazilmadi (uydurma yok)');
      return; }
    const cift = t.holdings.filter(h => isFinite(h.p0) && h.p0 > 0 && isFinite(h.p) && h.p > 0);
    if (cift.length < t.holdings.length * 0.9) {
      raporlar.push('### Model sicili serisi (§291) — ⏭ fiyat kapsami ' + cift.length + '/' + t.holdings.length + ' — eksikle sicil yazilmaz');
      return; }
    const model  = +(cift.reduce((s, h) => s + (h.p / h.p0 - 1), 0) / cift.length * 100).toFixed(3);
    const endeks = +((xk / t.endeks_kapanis - 1) * 100).toFixed(3);
    const kayit = { d: gun, model, endeks };
    const i = t.series.findIndex(x => x && x.d === gun);
    if (i >= 0) t.series[i] = kayit; else t.series.push(kayit);
    t.series.sort((a, b) => a.d < b.d ? -1 : 1);
    await yaz(dosya, t);
    degisenler.push('sicil serisi');
    const onceki = t.series[t.series.length - 2];
    raporlar.push('### Model sicili serisi (§291) — ✓ ' + gun + ' · model %' + model + ' / endeks %' + endeks);
    if (onceki) {
      const fark = Math.round((new Date(gun) - new Date(onceki.d)) / 864e5);
      if (fark > 5) raporlar.push('- ⚠ ' + onceki.d + ' → ' + gun + ' arasi ' + fark + ' gunluk BOSLUK — geriye doldurulmadi, grafik kesikli okunmali');
    }
  } catch (e) { raporlar.push('### Model sicili serisi (§291) — ⏭ ' + String(e && e.message || e).slice(0, 80)); }
}

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
/* ── §314 HMB İHALE SONUÇLARI KATMANI — hazine-sonuc.json (KÜMÜLATİF) ────────
   KEŞİF TAMAMLANDI (18 Ağu, tarayıcı üzerinden canlı ölçüm — sonda emekli):
   1) hmb.gov.tr bir SPA ama arka ucu WORDPRESS: /portal/v2/* = WP REST proxy
      (kanıt: guid "api.hmb.gov.tr/?page_id="). /duyurular rotası 404 bile olsa
      API sağlam: GET /portal/v2/posts?search=ihale+sonuç → 200, 18 Ağu duyurusu
      listede doğrulandı.
   2) Duyuru gövdesi tek cümle; GERÇEK içerik ekli PDF'te:
      ms.hmb.gov.tr/uploads/YYYY/MM/KAF_YYYYMMDD_ihale_sonucu_<enstrümanlar>.pdf
      — dosya adı bile yapısal (4TUFE_9s = 4Y TÜFE + 9Y sabit).
   3) PDF metni pdf-parse ile çıkarılır (package.json'a eklendi, npm ci kurar).
   V1 SÖZLEŞMESİ (ölç→incelt): faiz regex'leri standart duyuru diline göre;
   İLK koşularda her kayda ham_ozet (ilk 600 karakter) da yazılır ki ayrıştırma
   gerçek metinle DOĞRULANSIN (§252n) — düzen farklıysa regex bir sonraki turda
   gerçeğe göre inceltilir, kör kalınmaz. Kayıt anahtarı slug: duyuru bir kez
   işlenir, defter KÜMÜLATİF büyür (§299 ailesi), pencere kayması yok. */
/* ── SS319 KURESEL MAKRO TAKVIM — makro-takvim.json (haftalik pencere) ──────
   Kullanici istegi (19 Agu): Piyasa'daki kritik takvimin KURESEL ayagi
   otomatiklessin. KESIF OLCULDU: ForexFactory/FairEconomy kamuya acik
   haftalik JSON yayinliyor (nfs.faireconomy.media/ff_calendar_thisweek.json)
   — title/country/date(ET ofsetli ISO)/impact/forecast/previous. Gercek
   cekimle sema dogrulandi (FOMC Tutanaklari, GBP CPI, AUD istihdam listede).
   ISLETME KISITI (kaynagin kendi kurali): 5 dk'da 2 istek; asilirsa JSON
   yerine "Request Denied" HTML doner → parse hatasi DOSYAYI KORUR (SS300
   ruhu: bozuk cekim veri ezmez). Bizim ritim koşu basina 1 — guvenli.
   FILTRE: High → tum ulkeler; Medium → yalniz USD/EUR/GBP/CNY/JPY/TRY;
   Low → alinmaz (gurultu). Saatler UTC'ye cevrilip yazilir; TSI'ye ceviri
   panelin isi (render). Dosya haftalik penceredir, arsiv tutmaz — takvim
   ileriye bakar. */
/* ── SS326 SURE BUTCESI (19 Agu aksami: is 15 dk tavanina carpip IPTAL oldu) ──
   ARIZA: GitHub Actions "The job has exceeded the maximum execution time of
   15m0s" -> "The operation was canceled". Rapor yazilmisti ama is KIRMIZI.
   TESHIS SORUNU: hangi katmanin sundugu GORULEMIYOR - Node tarafinda katman
   basi sure logu YOKTU (tarayicida SS312 vardi, burada karsiligi yoktu).
   Bu sarmalayici her katmani olcer, 60 sn'yi asani rapora YAZAR ve toplam
   butce (11 dk) asilirsa KALAN KATMANLARI ATLAR - is yesil biter, eksikler
   raporda acikca listelenir. Yarim veri > iptal edilmis kosu: iptal hicbir sey
   yazmaz, atlama neyin eksik oldugunu SOYLER (SS179.3 ruhu). */
const SURE_BASLA = Date.now();
const SURE_BUTCE_MS = 11 * 60 * 1000;
const sureRapor = [];
let butceAsildi = false;
/* SS326b KATMAN ICI TAVAN (19 Agu, ayni aksam ikinci ders): SS326'nin butcesi
   katmanlar ARASINDA olcuyordu — TEK BIR katman 13 dk surunce zincir onu
   KESEMEDI. Artik her katmanin kendi tavani var (varsayilan 4 dk, Playwright'li
   fon katmani 6 dk): tavan dolunca BEKLEME birakilir, rapora yazilir ve sonraki
   katman baslar. Arka planda asili kalan is process'i tutmasin diye betik
   sonunda process.exit(0) cagrilir (asagida).
   DERS: BUTCE KATMANLAR ARASINDA DEGIL, HER KATMANIN ICINDE DE OLMALI. */
const KATMAN_TAVAN_MS = { 'Katılım fonları': 6*60*1000 };
async function olcKos(ad, fn) {
  if (butceAsildi) { sureRapor.push('- ⏭ ' + ad + ' — süre bütçesi aşıldı, ATLANDI'); return; }
  const t0 = Date.now();
  const tavan = KATMAN_TAVAN_MS[ad] || 4*60*1000;
  let zamanlayici;
  try {
    await Promise.race([
      fn(),
      new Promise((_, red) => { zamanlayici = setTimeout(() => red(new Error('KATMAN TAVANI ' + Math.round(tavan/60000) + ' dk aşıldı — bırakıldı')), tavan); })
    ]);
  }
  catch (e) { raporlar.push('### ' + ad + ' — ✗ ' + String(e && e.message || e).slice(0, 110)); }
  finally {
    clearTimeout(zamanlayici);
    const sn = Math.round((Date.now() - t0) / 1000);
    if (sn >= 60) sureRapor.push('- ⏱ ' + ad + ' — ' + sn + ' sn');
    if (Date.now() - SURE_BASLA > SURE_BUTCE_MS) butceAsildi = true;
  }
}

/* ── §462 SEKTÖR SÜRÜCÜLERİ (sektor-surucu.json) — Neste crack & Brent ─────
   Karar Motoru'nun (Journal · kararInit) hammaddesi. Neste Oyj yatırımcı
   sayfası üç fiyat monitörünü ir-service.appspot.com üzerinden yayınlar;
   veri sayfanın İÇİNDEDİR (Google DataTable satırları olarak gömülü), ayrı bir
   JSON/CSV ucu YOK (19 Eki: Chrome ağ sekmesiyle ölçüldü — sayfa yüklenince
   tek veri isteği yok; Excel ucu gerçek BIFF .xls, ayrıştırmaya değmez).
   O yüzden HTML çekilir, satırlar regex ile okunur:
     {c: [{v: new Date(2026, 9, 19)}, {v : 21.93}, {v: null},{v: null}, {v : 74.444}]}
   JS Date ayı 0 tabanlıdır (9 = Ekim) → +1. Hangi hücrenin hangi seri olduğu
   cols listesinden bulunur (type 'number' olanlar; 'Annotation' sütunları
   string, atlanır) — sütun sırası değişirse kod bozulmaz.
   Sayfa her çağrıda TÜM tarihçeyi verir (2021-10'dan beri ~470 satır:
   2025-10'a kadar haftalık, sonra günlük) → birleştirme yok, seri komple
   yeniden yazılır (kendi kendini onaran katman). USDTRY: Yahoo TRY=X günlük
   (2y) → çeyrek ortalaması + ay sonu kapanış; alınamazsa tohumdaki değerler
   korunur.
   DENETİM (§300 ruhu): crack −40..150 ve Brent 20..250 aralığı, ≥300 satır,
   son tarih mevcut dosyadan GERİ gitmez. Aksi halde dosya KORUNUR, rapora
   yazılır. */
async function sektorSurucu() {
  const dosya = 'sektor-surucu.json';
  const URLS = {
    crack: 'https://ir-service.appspot.com/share/nesteoil/English/price_monitor3_dg.html?name=ProductMargins&r=13032',
    brent: 'https://ir-service.appspot.com/share/nesteoil/English/price_monitor3_dg.html?name=CrudeOils&r=13032'
  };
  const eski = (await varMi(dosya)) ? await oku(dosya) : {};
  const cek = async u => {
    const r = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0 (KtPanel/1.0)', 'Accept': 'text/html' }, signal: AbortSignal.timeout(25000) });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.text();
  };
  const ayristir = html => {
    const colsM = html.match(/cols:\s*\[([\s\S]*?)\]\s*,\s*rows:/);
    if (!colsM) throw new Error('cols bulunamadı (sayfa düzeni değişti?)');
    const cols = [...colsM[1].matchAll(/\{label:\s*'([^']*)',\s*type:\s*'(\w+)'\}/g)].map(m => ({ label: m[1], type: m[2] }));
    const sayisal = cols.map((c, i) => c.type === 'number' ? i : -1).filter(i => i > 0);
    if (!sayisal.length) throw new Error('sayısal sütun yok');
    const satirlar = [];
    const re = /\{c:\s*\[([\s\S]*?)\]\s*\}/g; let m;
    while ((m = re.exec(html))) {
      const h = [...m[1].matchAll(/\{v\s*:\s*(new Date\((\d{4}),\s*(\d{1,2}),\s*(\d{1,2})\)|-?\d+(?:\.\d+)?|null)\s*\}/g)];
      if (!h.length || !h[0][2]) continue;
      const tarih = h[0][2] + '-' + String(+h[0][3] + 1).padStart(2, '0') + '-' + String(+h[0][4]).padStart(2, '0');
      const degerler = sayisal.map(i => { const c = h[i]; return (c && !c[2] && c[1] !== 'null') ? +c[1] : null; });
      satirlar.push([tarih, ...degerler]);
    }
    return { etiketler: sayisal.map(i => cols[i].label), satirlar };
  };
  try {
    const [hC, hB] = await Promise.all([cek(URLS.crack), cek(URLS.brent)]);
    const C = ayristir(hC), B = ayristir(hB);
    const iB = C.etiketler.findIndex(e => /gasoline/i.test(e)), iD = C.etiketler.findIndex(e => /diesel/i.test(e)), iBr = B.etiketler.findIndex(e => /brent/i.test(e));
    if (iB < 0 || iD < 0 || iBr < 0) throw new Error('seri etiketleri eşleşmedi: ' + C.etiketler.join(' | ') + ' / ' + B.etiketler.join(' | '));
    const brent = new Map(B.satirlar.map(r => [r[0], r[1 + iBr]]));
    const brentTarih = [...brent.keys()].sort();
    const brentEnYakin = t => { if (brent.has(t)) return brent.get(t); let v = null; for (const k of brentTarih) { if (k <= t) v = brent.get(k); else break; } return v; };
    const gunluk = C.satirlar
      .filter(r => r[1 + iB] != null && r[1 + iD] != null)
      .map(r => [r[0], r[1 + iB], r[1 + iD], brentEnYakin(r[0])])
      .filter(r => r[3] != null)
      .sort((a, b) => a[0] < b[0] ? -1 : 1);
    /* denetim */
    const aralikDisi = gunluk.filter(r => r[1] < -40 || r[1] > 150 || r[2] < -40 || r[2] > 150 || r[3] < 20 || r[3] > 250);
    if (gunluk.length < 300) throw new Error('DENETİM: ' + gunluk.length + ' satır (<300) — dosya korundu');
    if (aralikDisi.length) throw new Error('DENETİM: ' + aralikDisi.length + ' satır makul aralık dışı (ör. ' + JSON.stringify(aralikDisi[0]) + ') — dosya korundu');
    const son = gunluk[gunluk.length - 1];
    if (eski.son && eski.son.tarih && son[0] < eski.son.tarih) throw new Error('DENETİM: son tarih geriledi ' + eski.son.tarih + ' → ' + son[0] + ' — dosya korundu');
    /* USDTRY (Yahoo TRY=X) → çeyrek ortalaması + ay sonu */
    let fxGun = null;
    try { const h = await yahooSeri(['TRY=X'], '', '2y'); fxGun = h['TRY=X'] || null; } catch { fxGun = null; }
    const aySonu = Object.assign({}, eski.usdtry_ay_sonu || {});
    if (fxGun) { for (const [t, v] of fxGun) { if (v > 5 && v < 200) aySonu[t.slice(0, 7)] = +v.toFixed(4); } }   /* Map tarih sıralı → ay içi son değer kalır */
    const qk = t => { const y = +t.slice(0, 4), m = +t.slice(5, 7); return y + 'Q' + (Math.floor((m - 1) / 3) + 1); };
    const qAylar = q => { const y = +q.slice(0, 4), n = +q.slice(-1); return [1, 2, 3].map(i => y + '-' + String(3 * (n - 1) + i).padStart(2, '0')); };
    const oncekiAy = ym => { let y = +ym.slice(0, 4), m = +ym.slice(5, 7) - 1; if (m === 0) { y--; m = 12; } return y + '-' + String(m).padStart(2, '0'); };
    const Q = {};
    for (const r of gunluk) { (Q[qk(r[0])] = Q[qk(r[0])] || []).push(r); }
    const fxQ = {};
    if (fxGun) { for (const [t, v] of fxGun) { if (v > 5 && v < 200) (fxQ[qk(t)] = fxQ[qk(t)] || []).push(v); } }
    const ceyrek = {};
    for (const q of Object.keys(Q).sort()) {
      const L = Q[q], n = L.length;
      const ort = i => +(L.reduce((s, r) => s + r[i], 0) / n).toFixed(2);
      const ay = qAylar(q);
      let fxOrt = null, fxSon = null;
      if (fxQ[q] && fxQ[q].length >= 15) fxOrt = +(fxQ[q].reduce((s, v) => s + v, 0) / fxQ[q].length).toFixed(3);
      else { const l = [aySonu[oncekiAy(ay[0])], ...ay.map(m => aySonu[m])].filter(v => v > 0); if (l.length) fxOrt = +(l.reduce((s, v) => s + v, 0) / l.length).toFixed(3); }
      for (const m of [...ay].reverse()) { if (aySonu[m] > 0) { fxSon = aySonu[m]; break; } }
      const y = +q.slice(0, 4), qn = +q.slice(-1);
      const tam = !(q === qk(son[0]) && son[0] < y + '-' + String(3 * qn).padStart(2, '0') + '-28');
      ceyrek[q] = { benzin: ort(1), dizel: ort(2), brent: ort(3), brent_bas: L[0][3], brent_son: L[n - 1][3], dBrent: +(L[n - 1][3] - L[0][3]).toFixed(2), n, ilk: L[0][0], son: L[n - 1][0], usdtry_ort: fxOrt, usdtry_son: fxSon, tam };
    }
    /* §470 (20 Eki 10:19 koşusu dersi): bu nesne SIFIRDAN kuruluyordu → diğer katmanların yazdığı seriler/wb/evds/epias/
       kap_yeni_is anahtarları HER KOŞUDA SİLİNİYORDU. Sonuç: LME "biriken nokta" hiç birikmedi (hep 1 nokta), AOFM/TLREF/PTF/
       KAP artımlı katmanlar her koşu sıfırdan çekti; PTF'de son parça düşünce seri 13 Haz'da KESİLDİ (eski veri yoktu).
       Artık eski dosyanın üstüne yazılır: Neste alanları yenilenir, diğer katmanların anahtarları korunur. */
    const D = Object.assign({}, eski, {
      guncelleme: new Date().toISOString().slice(0, 19) + 'Z',
      _surum: '§462 Actions sektorSurucu()' + (fxGun ? ' · USDTRY Yahoo günlük' : ' · USDTRY tohum (Yahoo alınamadı)'),
      kaynak: eski.kaynak || { crack: 'Neste Oyj · Market data · Oil products → ProductMargins monitörü (ir-service.appspot.com) · LSEG · 5 günlük hareketli ortalama · Brent’e fark (USD/bbl)', brent: 'Neste Oyj · CrudeOils monitörü · Brent dated (USD/bbl)', usdtry: 'Yahoo TRY=X günlük (Actions)' },
      url: Object.assign({ sayfa: 'https://www.neste.com/investors/market-data/oil-products' }, URLS),
      kolonlar: ['tarih', 'benzin_ara', 'dizel_nwe', 'brent'],
      _not: eski._not || '2021-10 → 2025-10 haftalık (Salı), 21 Eki 2025 sonrası günlük (iş günü). Crack = ürün fiyatı − Brent; NWE dizel ve ARA benzin Akdeniz için vekil.',
      etiketler: { benzin: C.etiketler[iB], dizel: C.etiketler[iD], brent: B.etiketler[iBr] },
      son: { tarih: son[0], benzin: son[1], dizel: son[2], brent: son[3] },
      ceyrek, gunluk, usdtry_ay_sonu: aySonu
    });
    const degisti = !eski.son || eski.son.tarih !== son[0] || eski.son.dizel !== son[2] || eski.son.benzin !== son[1] || eski.son.brent !== son[3];
    await yaz(dosya, D);
    if (degisti) degisenler.push('sektör sürücüleri (' + son[0] + ')');
    raporlar.push('### Sektör sürücüleri (§462) — ✓ ' + son[0] + ' · dizel ' + son[2] + ' · benzin ' + son[1] + ' · Brent ' + son[3] + ' $/v\n- ' + gunluk.length + ' satır · ' + Object.keys(ceyrek).length + ' çeyrek · USDTRY ' + (fxGun ? 'Yahoo günlük' : 'tohum') + (degisti ? '' : ' · değişiklik yok'));
  } catch (e) {
    raporlar.push('### Sektör sürücüleri (§462) — ✗ ' + String(e && e.message || e).slice(0, 140) + '\n- sektor-surucu.json KORUNDU; panel son dosyayla çalışır (tarih damgası görünür).');
  }
}

/* ── §462b/§463 KARAR MODELİ GERÇEKLERİ — bilanço gelince otomatik düşer ──
   karar-model.json içindeki HER model (XK030) için: sektor-surucu çeyreği TAM
   ama favok{} içinde yoksa ve kap-arsiv/<KOD>.json o dönemi taşıyorsa çeyreklik
   FAVÖK hesaplanır ve favok[q] yazılır; 'regresyon' tipinde ayrıca örnekleme
   eklenir; katalogdaki konsensüs o çeyrekse sicile (konsensus_gecmis) düşer.
   Böylece pano/sicil (ne denildi · gerçek ne oldu) elle beklemez. kap-arsiv'de
   olmayan 9 XK030 kodu kap-arsiv-oncelik.json'a eklendi (§463) → yavaş yolda
   koşu başına 2 şirket dolar.
   FAVÖK tanımı Fintables ile uyumlu (tohum örneklemi oradan): EFK − diğer
   faaliyet gelirleri − diğer faaliyet giderleri + amortisman (2Ç26: 46,83 −
   6,05 + 9,11 + 4,73 ≈ 54,6 vs Fintables 54,34; fark amortisman kapsamı).
   Çeyreklik türetme: 1Ç = rapor sütunu [0]; 2Ç/3Ç = 4 sütunlu gelir
   tablosunda [2] (çeyrek sütunu), yoksa YTD farkı; 4Ç = yıllık − 9A (TMS-29
   yeniden ölçüm farkı GÖZ ARDI edilir → 'yaklasik' işareti). Amortisman nakit
   akışı YTD farkından. USD = TL / çeyrek ort. USDTRY (sektor-surucu).
   Fintables kaynaklı tohum satırlarıyla ufak tanım farkı olabilir (amortisman
   kapsamı); satır '_kaynak: KAP' ile işaretlenir, panel ayrım yapmaz. */
async function kararOrneklem() {
  const dosya = 'karar-model.json';
  if (!(await varMi(dosya)) || !(await varMi('sektor-surucu.json'))) return;
  try {
    const M = await oku(dosya), S = await oku('sektor-surucu.json');
    let eklenen = [];
    for (const mdl of (M.modeller || [])) {
      if (!mdl.kod || mdl.tip === 'konsensus_banka') continue;   /* banka şablonu farklı (FAVÖK yok) — sonraki tur */
      const kapDosya = 'kap-arsiv/' + mdl.kod + '.json';
      if (!(await varMi(kapDosya))) continue;
      const K = await oku(kapDosya);
      mdl.favok = mdl.favok || {};
      const var_ = new Set([...(mdl.orneklem || []).map(r => r.q), ...Object.keys(mdl.favok).filter(q => mdl.favok[q] && (mdl.favok[q].tl != null || mdl.favok[q].usd != null))]);
      const C = S.ceyrek || {};
      for (const q of Object.keys(C).sort()) {
        if (!C[q].tam || var_.has(q)) continue;
        if (q < '2024Q1') continue;   /* TMS-29 geçiş yılı (2023): 9A nominal, yıllık yeniden ölçülmüş → 4Ç türetmesi bozuk (BIMAS 4Ç23 −0,4 görüldü); 2024'ten itibaren */
        const y = +q.slice(0, 4), n = +q.slice(-1);
        const dn = K.donemler && K.donemler[y + '/' + n]; if (!dn) continue;
        /* Tablo adı şirkete göre değişir (BIMAS: "Tablo 310003" — fonksiyon esaslı gelir tablosu etiketsiz) → xbrl TÜM tablolarda aranır */
        const satir = (tabloAd, xbrl) => { for (const t of (dn.tablolar || [])) { const s = (t.satirlar || []).find(s => s.xbrl === xbrl); if (s) return s.degerler; } return null; };
        const carpan = (dn.birim && dn.birim.carpan) || 1000;
        const efkYtd = satir('Gelir Tablosu', 'ifrs-full_ProfitLossFromOperatingActivities');
        const dgYtd = satir('Gelir Tablosu', 'ifrs-full_OtherIncome') || [], dyYtd = satir('Gelir Tablosu', 'ifrs-full_OtherExpenseByFunction') || [];   /* Fintables FAVÖK tanımı: EFK − diğer faaliyet gelir − diğer faaliyet gider (gider negatif) + amortisman */
        const hasYtd = satir('Gelir Tablosu', 'ifrs-full_Revenue');
        const netYtd = satir('Gelir Tablosu', 'ifrs-full_ProfitLossAttributableToOwnersOfParent');
        const amYtd = satir('Nakit Akış', 'ifrs-full_AdjustmentsForDepreciationAndAmortisationExpense');
        if (!efkYtd || !amYtd) continue;
        let efk, has, net, am, yaklasik = false;
        const once = (n > 1) ? (K.donemler[y + '/' + (n - 1)]) : null;
        const onceSatir = (tabloAd, xbrl) => { if (!once) return null; for (const t of (once.tablolar || [])) { const s = (t.satirlar || []).find(s => s.xbrl === xbrl); if (s) return s.degerler; } return null; };
        const duz = (e, dg, dy) => e - (dg || 0) - (dy || 0);   /* diğer faaliyet kalemlerini düş (gider zaten negatif → eklenir) */
        if (n === 1) { efk = duz(efkYtd[0], dgYtd[0], dyYtd[0]); has = hasYtd && hasYtd[0]; net = netYtd && netYtd[0]; am = amYtd[0]; }
        else if (efkYtd.length >= 4 && n !== 4) { efk = duz(efkYtd[2], dgYtd[2], dyYtd[2]); has = hasYtd && hasYtd[2]; net = netYtd && netYtd[2]; const amO = onceSatir('Nakit Akış', 'ifrs-full_AdjustmentsForDepreciationAndAmortisationExpense'); am = amO ? amYtd[0] - amO[0] : null; }
        else { const eO = onceSatir('Gelir Tablosu', 'ifrs-full_ProfitLossFromOperatingActivities'), dgO = onceSatir('Gelir Tablosu', 'ifrs-full_OtherIncome') || [], dyO = onceSatir('Gelir Tablosu', 'ifrs-full_OtherExpenseByFunction') || [], hO = onceSatir('Gelir Tablosu', 'ifrs-full_Revenue'), nO = onceSatir('Gelir Tablosu', 'ifrs-full_ProfitLossAttributableToOwnersOfParent'), amO = onceSatir('Nakit Akış', 'ifrs-full_AdjustmentsForDepreciationAndAmortisationExpense');
          if (!eO || !amO) continue; efk = duz(efkYtd[0], dgYtd[0], dyYtd[0]) - duz(eO[0], dgO[0], dyO[0]); has = (hasYtd && hO) ? hasYtd[0] - hO[0] : null; net = (netYtd && nO) ? netYtd[0] - nO[0] : null; am = amYtd[0] - amO[0]; yaklasik = (n === 4); }
        if (!(typeof efk === 'number') || !isFinite(efk) || !(typeof am === 'number') || !isFinite(am)) continue;
        const fx = C[q].usdtry_ort || C[q].usdtry_son; if (!fx) continue;
        const favokTl = (efk + am) * carpan / 1e9;   /* mlr TL */
        const r = { q, favok_usd: +(favokTl * 1000 / fx).toFixed(1), favok_tl: +favokTl.toFixed(3),
          satis_usd: has != null ? +(has * carpan / 1e6 / fx).toFixed(1) : null, net_usd: net != null ? +(net * carpan / 1e6 / fx).toFixed(1) : null, net_tl: net != null ? +(net * carpan / 1e9).toFixed(3) : null,
          dizel: C[q].dizel, benzin: C[q].benzin, brent: C[q].brent, dBrent: C[q].dBrent, usdtry_ort: fx, _kaynak: 'KAP arşivi (Actions §462b)' + (yaklasik ? ' · 4Ç yaklaşık (yıllık − 9A)' : '') };
        mdl.favok[q] = { tl: r.favok_tl, usd: r.favok_usd, _kaynak: 'KAP' };   /* §463: her modelde gerçek FAVÖK — pano/sicil/band buradan okur */
        if (mdl.tip === 'regresyon' && Array.isArray(mdl.orneklem)) { mdl.orneklem.push(r); mdl.orneklem.sort((a, b) => a.q < b.q ? -1 : 1); }
        /* konsensüs sicili: açıklanan çeyreğin kurum ortalaması katalogda ise gerçekle eşle */
        if (mdl.konsensus && mdl.konsensus.donem === q && mdl.konsensus.favok_tl_mlr > 0) { mdl.konsensus_gecmis = mdl.konsensus_gecmis || []; if (!mdl.konsensus_gecmis.some(x => x.q === q)) mdl.konsensus_gecmis.push({ q, n: mdl.konsensus.kurum || null, ort_favok_tl: mdl.konsensus.favok_tl_mlr, ort_net_tl: mdl.konsensus.net_tl_mlr || null, gercek_favok_tl: r.favok_tl, _kaynak: 'Actions §463' }); }
        eklenen.push(mdl.kod + ' ' + q + ' FAVÖK ' + favokTl.toFixed(1) + ' mlr ₺');
      }
    }
    if (eklenen.length) { M.surum = bugun; await yaz(dosya, M); degisenler.push('karar modeli örneklemi (' + eklenen.length + ')'); raporlar.push('### Karar modeli örneklemi (§462b) — ✓ ' + eklenen.join(' · ')); }
  } catch (e) { raporlar.push('### Karar modeli örneklemi (§462b) — ✗ ' + String(e && e.message || e).slice(0, 120)); }
}

/* ── §550 NET BORÇ + SERBEST NAKİT AKIŞI — karar-model.json'a (28 Eki, kullanıcı: "FCF de önemli · PD/FAVÖK mü EV/FAVÖK mü?") ──
   Her model (banka hariç) için kap-arsiv/<KOD>.json'un HER çeyreğinden:
   • netborc[q] = {nb, borc, nakit} mlr ₺ (dönem sonu stok): finansal borç = KV borçlanmalar (kap-fr_CurrentBorowings) + UV borçların KV
     kısmı (kap-fr_CurrentPortionOfNoncurrentBorrowings) + UV borçlanmalar (ifrs-full_LongtermBorrowings) — TFRS 16 kira yükümlülüğü KAP
     şablonunda bu satırların içinde; nakit = nakit ve benzerleri + KV finansal yatırımlar. Panel EV = PD + net borç kurar.
   • nakit[q] = YTD (aynı raporun cari sütunu → tek satın alma gücü, TMS 29 karışmaz): cfo · capex (MDV+MODV alımı − satışı) · kira (kira
     yükümlülüğü ödemeleri) · fcf = cfo − net capex − kira · favok (EFK − diğer faal. gelir/gider + amortisman, §462b tanımı) ·
     donusum = fcf / favok · capex_am = brüt capex / amortisman (>2: büyüme yatırımı ağırlıklı).
     TTM: 4Ç'de yıllık sütun; diğer çeyreklerde cari YTD + geçen yıl yıllık − geçen yıl aynı YTD (önceki dönem karşılaştırma sütunu) →
     iki farklı satın alma gücü karışır, 'yaklasik' işaretlenir.
   FCF = firmaya serbest nakit (faiz ödemeleri finansmanda kaldığı için düşülmez) → EV ile eşleşir: FCF verimi = TTM FCF / EV. */
async function kararNakit() {
  const dosya = 'karar-model.json';
  if (!(await varMi(dosya))) return;
  try {
    const M = await oku(dosya); let n = 0, deg = 0; const ornek = [];
    for (const mdl of (M.modeller || [])) {
      if (!mdl.kod || mdl.tip === 'konsensus_banka') continue;
      const kd = 'kap-arsiv/' + mdl.kod + '.json'; if (!(await varMi(kd))) continue;
      const K = await oku(kd); const D = K.donemler || {};
      const sat = (dn, x) => { for (const t of ((dn && dn.tablolar) || [])) { const r = (t.satirlar || []).find(s => s.xbrl === x); if (r) return r.degerler; } return null; };
      const v0 = (dn, x, i) => { const r = sat(dn, x); return (r && r[i || 0] != null && isFinite(r[i || 0])) ? +r[i || 0] : null; };
      const nb = {}, nk = {};
      for (const key of Object.keys(D).filter(k => /^\d{4}\/[1-4]$/.test(k)).sort()) {
        const [y, c] = key.split('/').map(Number); const q = y + 'Q' + c; if (q < '2024Q1') continue;
        const dn = D[key]; const cr = ((dn.birim && dn.birim.carpan) || 1000) / 1e9;   /* → mlr ₺ */
        const kv = v0(dn, 'kap-fr_CurrentBorowings') || 0, kvk = v0(dn, 'kap-fr_CurrentPortionOfNoncurrentBorrowings') || 0, uv = v0(dn, 'ifrs-full_LongtermBorrowings') || 0;
        const cash = v0(dn, 'ifrs-full_CashAndCashEquivalents'), fy = v0(dn, 'kap-fr_CurrentFinancialInvestments') || 0;
        if (cash != null) { const borc = (kv + kvk + uv) * cr, nakit = (cash + fy) * cr; nb[q] = { nb: +(borc - nakit).toFixed(3), borc: +borc.toFixed(3), nakit: +nakit.toFixed(3) }; }
        const ytd = (i) => { const cfo = v0(dn, 'ifrs-full_CashFlowsFromUsedInOperatingActivities', i); if (cfo == null) return null;
          const cx = v0(dn, 'kap-fr_PurchaseOfPropertyPlantEquipmentAndIntangibleAssetsClassifiedAsInvestingActivities', i) ?? ((v0(dn, 'ifrs-full_PurchaseOfPropertyPlantAndEquipmentClassifiedAsInvestingActivities', i) || 0) + (v0(dn, 'ifrs-full_PurchaseOfIntangibleAssetsClassifiedAsInvestingActivities', i) || 0));
          const sx = v0(dn, 'kap-fr_ProceedsFromSalesOfPropertyPlantEquipmentAndIntangibleAssetsClassifiedAsInvestingActivities', i) || 0;
          const ki = v0(dn, 'kap-fr_PaymentsOfLeaseLiabilitiesClassifiedAsFinancingActivities', i) || 0;
          const efk = v0(dn, 'ifrs-full_ProfitLossFromOperatingActivities', i), dg = v0(dn, 'ifrs-full_OtherIncome', i) || 0, dy = v0(dn, 'ifrs-full_OtherExpenseByFunction', i) || 0, am = v0(dn, 'ifrs-full_AdjustmentsForDepreciationAndAmortisationExpense', i);
          const capexBrut = -Math.abs(cx || 0), kira = -Math.abs(ki);
          const fcf = cfo + capexBrut + Math.abs(sx) + kira; const favok = (efk != null && am != null) ? (efk - dg - dy + Math.abs(am)) : null;
          return { cfo: cfo * cr, capex: capexBrut * cr, satis: Math.abs(sx) * cr, kira: kira * cr, fcf: fcf * cr, favok: favok != null ? favok * cr : null, am: am != null ? Math.abs(am) * cr : null }; };
        const a = ytd(0); if (!a) continue;
        const r = { cfo: +a.cfo.toFixed(3), capex: +a.capex.toFixed(3), kira: +a.kira.toFixed(3), fcf: +a.fcf.toFixed(3), favok: a.favok != null ? +a.favok.toFixed(3) : null,
          donusum: (a.favok && a.favok > 0) ? +(a.fcf / a.favok * 100).toFixed(1) : null, capex_am: (a.am && a.am > 0) ? +(Math.abs(a.capex) / a.am).toFixed(2) : null, ay: c * 3 };
        if (c === 4) { r.fcf_ttm = r.fcf; r.favok_ttm = r.favok; }
        else { const fyR = D[(y - 1) + '/4']; const b = ytd(1); const fyY = fyR ? (() => { const cr2 = ((fyR.birim && fyR.birim.carpan) || 1000) / 1e9; const cfo = v0(fyR, 'ifrs-full_CashFlowsFromUsedInOperatingActivities'); if (cfo == null) return null;
              const cx = v0(fyR, 'kap-fr_PurchaseOfPropertyPlantEquipmentAndIntangibleAssetsClassifiedAsInvestingActivities') ?? ((v0(fyR, 'ifrs-full_PurchaseOfPropertyPlantAndEquipmentClassifiedAsInvestingActivities') || 0) + (v0(fyR, 'ifrs-full_PurchaseOfIntangibleAssetsClassifiedAsInvestingActivities') || 0));
              const sx = v0(fyR, 'kap-fr_ProceedsFromSalesOfPropertyPlantEquipmentAndIntangibleAssetsClassifiedAsInvestingActivities') || 0, ki = v0(fyR, 'kap-fr_PaymentsOfLeaseLiabilitiesClassifiedAsFinancingActivities') || 0;
              return (cfo - Math.abs(cx || 0) + Math.abs(sx) - Math.abs(ki)) * cr2; })() : null;
          if (b && fyY != null) { r.fcf_ttm = +(a.fcf + fyY - b.fcf).toFixed(3); r.yaklasik = true; } }
        nk[q] = r;
      }
      const eskiJ = JSON.stringify([mdl.netborc || null, mdl.nakit || null]);
      if (Object.keys(nb).length) mdl.netborc = nb; if (Object.keys(nk).length) mdl.nakit = nk;
      if (JSON.stringify([mdl.netborc || null, mdl.nakit || null]) !== eskiJ) deg++;
      n++; const ks = Object.keys(nk).sort(); const sq = ks[ks.length - 1];
      if (sq && ornek.length < 6) ornek.push(mdl.kod + ' ' + sq + ': FCF YTD ' + nk[sq].fcf.toFixed(1) + ' · dönüşüm ' + (nk[sq].donusum != null ? '%' + nk[sq].donusum : '—') + ' · net borç ' + (nb[sq] ? nb[sq].nb.toFixed(1) : '—') + ' mlr ₺');
    }
    if (deg) { await yaz(dosya, M); degisenler.push('karar modeli nakit/net borç (' + deg + ')'); }
    raporlar.push('### Karar modeli nakit akışı + net borç (§550) — ✓ ' + n + ' model · ' + deg + ' değişti' + (ornek.length ? '\n- ' + ornek.join('\n- ') : ''));
  } catch (e) { raporlar.push('### Karar modeli nakit akışı + net borç (§550) — ✗ ' + String(e && e.message || e).slice(0, 140)); }
}

/* ── §464b XLSX OKUYUCU (bağımlılıksız) ──────────────────────────────────────
   .xlsx = zip (merkezi dizin + deflate-raw girdiler) + XML. Node'un zlib'i
   inflateRawSync verir; SheetJS kurmadan okunur. Yalnız gerekeni çözer:
   workbook.xml (sayfa adı → rId), workbook.xml.rels (rId → dosya),
   sharedStrings.xml (t="s" hücreler), hedef sayfa (satır/hücre regex).
   Sınır: 4 GB altı, şifresiz, standart xlsx. Pink Sheet 586 KB → sorunsuz. */
function zipGirdiler(buf) {
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 70000); i--) { if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; } }
  if (eocd < 0) throw new Error('zip EOCD yok');
  const n = buf.readUInt16LE(eocd + 10), off = buf.readUInt32LE(eocd + 16);
  const out = {}; let p = off;
  for (let k = 0; k < n; k++) {
    const nlen = buf.readUInt16LE(p + 28), elen = buf.readUInt16LE(p + 30), clen = buf.readUInt16LE(p + 32);
    const method = buf.readUInt16LE(p + 10), csize = buf.readUInt32LE(p + 20), loff = buf.readUInt32LE(p + 42);
    const name = buf.toString('utf8', p + 46, p + 46 + nlen);
    out[name] = { method, csize, loff };
    p += 46 + nlen + elen + clen;
  }
  return out;
}
function zipOku(buf, girdiler, ad, zlib) {
  const e = girdiler[ad]; if (!e) throw new Error('zip girdisi yok: ' + ad);
  const nlen = buf.readUInt16LE(e.loff + 26), elen = buf.readUInt16LE(e.loff + 28);
  const bas = e.loff + 30 + nlen + elen; const ham = buf.subarray(bas, bas + e.csize);
  return (e.method === 0 ? ham : zlib.inflateRawSync(ham)).toString('utf8');
}
const xmlCoz = s => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'");
async function xlsxSayfa(buf, sayfaAdi) {
  const zlib = await import('node:zlib');
  const G = zipGirdiler(buf);
  const wb = zipOku(buf, G, 'xl/workbook.xml', zlib);
  /* öznitelik sırası yazara göre değişir (Excel: name…r:id; openpyxl: Target…Id) → etiket içinden ayrı ayrı okunur */
  const oz = (etiket, ad) => { const m = etiket.match(new RegExp('(?:^|\\s)' + ad.replace(':', '\\:') + '="([^"]*)"')); return m ? m[1] : null; };
  const sheets = [...wb.matchAll(/<sheet\s[^>]*>/g)].map(m => ({ name: xmlCoz(oz(m[0], 'name') || ''), rid: oz(m[0], 'r:id') }));
  const sheet = sheets.find(s => s.name === sayfaAdi);
  if (!sheet) throw new Error('sayfa yok: ' + sayfaAdi + ' (var: ' + sheets.map(s => s.name).join(', ') + ')');
  const rels = zipOku(buf, G, 'xl/_rels/workbook.xml.rels', zlib);
  const rel = [...rels.matchAll(/<Relationship\s[^>]*>/g)].map(m => ({ id: oz(m[0], 'Id'), target: oz(m[0], 'Target') })).find(r => r.id === sheet.rid);
  if (!rel || !rel.target) throw new Error('sayfa ilişkisi yok (' + sheet.rid + ')');
  const t = rel.target.replace(/^\//, '');
  const hedef = t.startsWith('xl/') ? t : 'xl/' + t;
  let strs = [];
  if (G['xl/sharedStrings.xml']) { const ss = zipOku(buf, G, 'xl/sharedStrings.xml', zlib); strs = [...ss.matchAll(/<si>([\s\S]*?)<\/si>/g)].map(m => xmlCoz([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map(x => x[1]).join(''))); }
  const xml = zipOku(buf, G, hedef, zlib);
  const rows = {};
  for (const rm of xml.matchAll(/<row [^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g)) {
    const cells = {};
    for (const cm of rm[2].matchAll(/<c r="([A-Z]+)\d+"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const col = cm[1], attrs = cm[2] || '', inner = cm[3] || '';
      const vm = inner.match(/<v>([\s\S]*?)<\/v>/); let v = null;
      if (vm) { v = vm[1]; if (/t="s"/.test(attrs)) v = strs[+v]; else if (/t="(str|inlineStr|b|e)"/.test(attrs)) v = xmlCoz(v); else v = +v; }
      else { const im = inner.match(/<is>[\s\S]*?<t[^>]*>([\s\S]*?)<\/t>/); if (im) v = xmlCoz(im[1]); }
      if (v !== null && v !== '') cells[col] = v;
    }
    rows[+rm[1]] = cells;
  }
  return rows;
}

/* ── §464 SÜRÜCÜ SERİLERİ KAYDI (sektor-surucu.json → seriler{}) ─────────────
   Karar Motoru'nun XK030'a genişlemesi için tier A/B sürücüleri TEK kayıt
   defterinden çekilir. Her serinin kaynağı, sembolü, birimi ve sıklığı kodda
   açık; model kurulana kadar veri BİRİKİR (özellikle LME hurda: tarihçe
   ücretli, kendi serimizi günlük noktadan kurarız).
   KAYNAKLAR (19 Eki ölçüldü):
   - yahoo  : /v8/finance/chart (crumb yok; tazele zaten kullanır). Vadeli
              sembolleri "=F" ile: GC=F altın, SI=F gümüş, HG=F bakır, ALI=F
              alüminyum, HRC=F ABD Midwest HRC, TTF=F Hollanda TTF gaz, NG=F
              Henry Hub, ZW=F CBOT buğday, BZ=F Brent (Neste çaprazı), EURUSD=X,
              TRY=X. 2 yıllık günlük tarihçe ilk koşuda gelir.
   - lme    : lme.com ferrous sayfaları statik HTML'de tek değer taşır
              (<span class="hero-metal-data__number"> 393.00 </span> … "Month 2
              Closing Price (day-delayed)"): hurda CFR TR 393,00 · inşaat demiri
              FOB TR 587,50 $/t (16 Eki). Tarihçe LMElive üyeliği ister → günlük
              nokta biriktirilir; ikisinden TR metal marjı türetilir. ENGEL:
              Cloudflare "Just a moment" (runner IP) → zincir: düz fetch (2 başlık
              seti) → Playwright (25 sn doğrulama beklemesi) → Vercel köprüsü
              (§464e api/market.js?mod=lme). Rapor hangi yoldan geldiğini yazar.
   - investing.com: kullanıcı "yassı çelik investing'de var" dedi — doğru;
              oradaki "ABD Çelik Rulo (HRC)" AYNI CME kontratıdır (Yahoo HRC=F
              ile birebir), ayrıca SHFE inşaat demiri ve SGX demir cevheri var.
              Ama investing Vercel'den de GitHub'dan da 403 veriyor (Cloudflare,
              §253f) → otomasyonda kullanılmaz; Yahoo HRC=F düşerse plan B
              Playwright ile investing (TEFAS deseni).
   - wb     : Dünya Bankası Pink Sheet — AYLIK XLSX (CMO-Historical-Data-Monthly,
              1960'tan beri; ayın ~2. iş günü, sonraki 3 Kas 2026). Sayfa:
              worldbank.org/en/research/commodity-markets → xlsx linki regex ile →
              bağımlılıksız zip/XML okuyucu (xlsxSayfa). §464b: ilk koşuda PDF
              yolu denendi, pdf-parse hücreleri boşluksuz birleştirdi (0 satır) →
              xlsx'e geçildi; yapı 19 Eki Chrome'da ölçüldü, 23:32 koşusunda
              CANLI DOĞRULANDI (15 seri · 2026M09). Çeyreklik = 3 tam ay ortalaması.
   DENETİM: değer makul aralıkta değilse ya da seri bir önceki koşudan GERİ
   gittiyse o seri atlanır (dosya diğer serilerle yazılır); hiçbir kaynak
   gelmezse seriler{} korunur. Sorun raporda seri adıyla görünür. */
const SURUCU_KAYIT = {
  altin:    { ad: 'Altın (COMEX GC=F)',                    birim: '$/toz', kaynak: 'yahoo', sembol: 'GC=F',    aralik: [500, 20000],  hisse: ['CVKMD'] },
  gumus:    { ad: 'Gümüş (COMEX SI=F)',                    birim: '$/toz', kaynak: 'yahoo', sembol: 'SI=F',    aralik: [5, 500],      hisse: ['CVKMD'] },
  bakir:    { ad: 'Bakır (COMEX HG=F)',                    birim: '$/lb',  kaynak: 'yahoo', sembol: 'HG=F',    aralik: [1, 20],       hisse: ['CVKMD'] },
  aluminyum:{ ad: 'Alüminyum (CME ALI=F)',                 birim: '$/t',   kaynak: 'yahoo', sembol: 'ALI=F',   aralik: [800, 10000],  hisse: [] },
  hrc_abd:  { ad: 'ABD Midwest HRC (CME HRC=F) — TR HRC vekili', birim: '$/t', kaynak: 'yahoo', sembol: 'HRC=F', aralik: [300, 3000], hisse: ['EREGL', 'KRDMD', 'KCAER'] },
  ttf:      { ad: 'TTF doğalgaz (TTF=F)',                  birim: '€/MWh', kaynak: 'yahoo', sembol: 'TTF=F',   aralik: [5, 500],      hisse: ['GUBRF', 'TKFEN', 'AKCNS', 'CIMSA'] },
  henryhub: { ad: 'Henry Hub doğalgaz (NG=F)',             birim: '$/mmbtu', kaynak: 'yahoo', sembol: 'NG=F', aralik: [0.5, 50],     hisse: [] },
  bugday:   { ad: 'Buğday CBOT (ZW=F)',                    birim: '¢/bu',  kaynak: 'yahoo', sembol: 'ZW=F',    aralik: [200, 2500],   hisse: ['OBAMS'] },
  pamuk:    { ad: 'Pamuk ICE (CT=F) — giyim girdisi (§485)', birim: '¢/lb',  kaynak: 'yahoo', sembol: 'CT=F',    aralik: [30, 300],     hisse: ['MAVI'] },
  brent_yh: { ad: 'Brent (ICE BZ=F) — Neste çaprazı',      birim: '$/v',   kaynak: 'yahoo', sembol: 'BZ=F',    aralik: [20, 300],     hisse: ['TUPRS'] },
  eurusd:   { ad: 'EUR/USD',                               birim: '',      kaynak: 'yahoo', sembol: 'EURUSD=X', aralik: [0.6, 2],     hisse: ['KCAER', 'CIMSA', 'MAVI', 'OBAMS'] },
  usdtry:   { ad: 'USD/TRY',                               birim: '',      kaynak: 'yahoo', sembol: 'TRY=X',   aralik: [5, 200],      hisse: ['*'] },
  hurda_lme:{ ad: 'LME Steel Scrap CFR Turkey (Platts) · Month-2 kapanış (1 gün gecikmeli)', birim: '$/t', kaynak: 'lme', url: 'https://www.lme.com/en/metals/ferrous/lme-steel-scrap-cfr-turkey-platts', aralik: [150, 1200], hisse: ['EREGL', 'KRDMD', 'KCAER'] },
  demir_lme:{ ad: 'LME Steel Rebar FOB Turkey (Platts) · Month-2 kapanış (1 gün gecikmeli) — TR inşaat demiri', birim: '$/t', kaynak: 'lme', url: 'https://www.lme.com/en/metals/ferrous/lme-steel-rebar-fob-turkey-platts', aralik: [250, 2000], hisse: ['KRDMD', 'KCAER'] },
};
/* Dünya Bankası Pink Sheet satır eşlemesi: anahtar → satır başlangıcı (regex, büyük/küçük duyarsız), birim */
const WB_SATIR = {
  ure:        { ad: 'Üre, Karadeniz (WB)',           re: /^Urea/i,        birim: '$/t',     hisse: ['GUBRF', 'TKFEN'] },
  dap:        { ad: 'DAP (WB)',                      re: /^DAP\b/i,                       birim: '$/t',     hisse: ['GUBRF', 'TKFEN'] },
  demir_cevheri:{ ad: 'Demir cevheri cfr (WB)',      re: /^Iron ore\b/i,                  birim: '$/dmt',   hisse: ['EREGL', 'KRDMD'] },
  komur_termal:{ ad: 'Kömür, Avustralya termal (WB)', re: /^Coal,\s*Australia/i,          birim: '$/t',     hisse: ['AKCNS', 'CIMSA', 'EREGL'] },
  gaz_avrupa: { ad: 'Doğalgaz Avrupa TTF (WB)',      re: /^Natural gas,\s*Europe/i,       birim: '$/mmbtu', hisse: ['GUBRF', 'TKFEN', 'AKCNS', 'CIMSA'] },
  altin_wb:   { ad: 'Altın (WB)',                    re: /^Gold\b/i,                      birim: '$/toz',   hisse: ['CVKMD'] },
  gumus_wb:   { ad: 'Gümüş (WB)',                    re: /^Silver\b/i,                    birim: '$/toz',   hisse: ['CVKMD'] },
  cinko:      { ad: 'Çinko LME (WB)',                re: /^Zinc\b/i,                      birim: '$/t',     hisse: ['CVKMD'] },
  kursun:     { ad: 'Kurşun LME (WB)',               re: /^Lead\b/i,                      birim: '$/t',     hisse: ['CVKMD'] },
  bakir_wb:   { ad: 'Bakır LME (WB)',                re: /^Copper\b/i,                    birim: '$/t',     hisse: ['CVKMD'] },
  aluminyum_wb:{ ad: 'Alüminyum LME (WB)',           re: /^Aluminum\b/i,                  birim: '$/t',     hisse: [] },
  bugday_wb:  { ad: 'Buğday ABD HRW (WB)',           re: /^Wheat,\s*U\.?S\.?,?\s*HRW/i,   birim: '$/t',     hisse: ['OBAMS'] },
  kakao:      { ad: 'Kakao (WB)',                    re: /^Cocoa\b/i,                     birim: '$/kg',    hisse: [] },
  seker_dunya:{ ad: 'Şeker dünya (WB)',              re: /^Sugar,\s*World/i,              birim: '$/kg',    hisse: [] },
  brent_wb:   { ad: 'Brent (WB)',                    re: /^Crude oil,\s*Brent/i,          birim: '$/v',     hisse: ['TUPRS'] },
};
const WB_AY = { january: '01', february: '02', march: '03', april: '04', may: '05', june: '06', july: '07', august: '08', september: '09', october: '10', november: '11', december: '12' };
const WB_CEYREK = { 'Jan-Mar': 'Q1', 'Apr-Jun': 'Q2', 'Jul-Sep': 'Q3', 'Oct-Dec': 'Q4' };
/* Pink Sheet metnini ayrıştır: dönem başlıkları (iki satır) + hedef satırlar → {yillik, ceyreklik, aylik} */
function wbAyristir(metin) {
  const satirlar = metin.split(/\r?\n/).map(s => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const out = {}; let donemler = null;
  for (let i = 0; i < satirlar.length; i++) {
    const s = satirlar[i];
    if (/Jan-Dec/.test(s) && /(January|February|March|April|May|June|July|August|September|October|November|December)/.test(s)) {
      const etiket = s.match(/Jan-Dec|Jan-Mar|Apr-Jun|Jul-Sep|Oct-Dec|January|February|March|April|May|June|July|August|September|October|November|December/g) || [];
      const yilSatir = satirlar[i + 1] || '';
      const yillar = (yilSatir.match(/\b(19|20)\d{2}\b/g) || []);
      if (etiket.length && yillar.length === etiket.length) donemler = etiket.map((e, k) => ({ e, y: yillar[k] }));
      continue;
    }
    if (!donemler) continue;
    for (const [k, t] of Object.entries(WB_SATIR)) {
      if (!t.re.test(s)) continue;
      const sayilar = (s.match(/-?\d{1,3}(?:,\d{3})*(?:\.\d+)?/g) || []).map(x => +x.replace(/,/g, ''));
      /* satır başındaki dipnot (a/ b/) ve "**" sayısal değil; sondan donemler.length sayı alınır */
      if (sayilar.length < donemler.length) continue;
      const v = sayilar.slice(-donemler.length);
      const r = { yillik: {}, ceyreklik: {}, aylik: {} };
      donemler.forEach((d, j) => {
        if (d.e === 'Jan-Dec') r.yillik[d.y] = v[j];
        else if (WB_CEYREK[d.e]) r.ceyreklik[d.y + WB_CEYREK[d.e]] = v[j];
        else if (WB_AY[d.e.toLowerCase()]) r.aylik[d.y + '-' + WB_AY[d.e.toLowerCase()]] = v[j];
      });
      if (!out[k]) out[k] = r;   /* ilk eşleşme (Sugar World tek satır; Gold vb. bir kez) */
    }
  }
  return { out, donemler };
}
async function surucuSeriler() {
  const dosya = 'sektor-surucu.json';
  if (!(await varMi(dosya))) { raporlar.push('### Sürücü serileri (§464) — ⏭ sektor-surucu.json yok (önce §462 koşmalı)'); return; }
  const D = await oku(dosya);
  D.seriler = D.seriler || {};
  const notlar = [], uyari = [];
  const bugunT = bugun;
  /* 1) Yahoo günlük (2 yıl; sonraki koşularda son 400 gün üstüne birleştirilir) */
  const yahooKod = Object.entries(SURUCU_KAYIT).filter(([, t]) => t.kaynak === 'yahoo');
  try {
    const h = await yahooSeri(yahooKod.map(([, t]) => t.sembol), '', '2y');
    for (const [k, t] of yahooKod) {
      const m = h[t.sembol]; if (!m || !m.size) { uyari.push(k + ' (Yahoo ' + t.sembol + ' boş)'); continue; }
      const eski = (D.seriler[k] && D.seriler[k].gunluk) || [];
      const harita = new Map(eski.map(x => [x[0], x[1]]));
      let aralikDisi = 0;
      for (const [tarih, v] of m) { if (v >= t.aralik[0] && v <= t.aralik[1]) harita.set(tarih, +(+v).toFixed(4)); else aralikDisi++; }
      const gunluk = [...harita.entries()].sort((a, b) => a[0] < b[0] ? -1 : 1);
      if (!gunluk.length) { uyari.push(k + ' (Yahoo ' + t.sembol + ': ' + aralikDisi + ' değer, hepsi aralık dışı — birim/sembol kontrol)'); continue; }
      const son = gunluk[gunluk.length - 1];
      if (D.seriler[k] && D.seriler[k].son && son[0] < D.seriler[k].son.tarih) { uyari.push(k + ' (tarih geriledi, atlandı)'); continue; }
      D.seriler[k] = Object.assign({}, D.seriler[k] || {}, { ad: t.ad, birim: t.birim, kaynak: 'Yahoo ' + t.sembol, siklik: 'gunluk', hisse: t.hisse, gunluk, son: { tarih: son[0], deger: son[1] }, guncelleme: bugunT });
      notlar.push(k + ' ' + son[1] + ' (' + son[0] + ', ' + gunluk.length + ' gün' + (aralikDisi ? ', ' + aralikDisi + ' aralık dışı atıldı' : '') + ')');
    }
  } catch (e) { uyari.push('Yahoo katmanı: ' + String(e && e.message || e).slice(0, 80)); }
  /* 2) LME ferrous (hurda CFR TR · inşaat demiri FOB TR) — günlük tek nokta (statik HTML; tarihçe üyelik ister).
        İkisi birlikte Türkiye uzun çelik METAL MARJI'nı verir: demir − hurda ($/t). 19 Eki: hurda 393,00 · demir 587,50 → marj ~195 $/t. */
  const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
  const duvar = h => !h || /Just a moment|Attention Required|Access Denied|Pardon Our Interruption|captcha/i.test(h.slice(0, 4000));
  /* §464g (20 Eki 00:59 koşusu: hurda Playwright ile GEÇTİ, demir aynı koşuda Cloudflare'a takıldı): her seri için yeni
     tarayıcı açılıyordu, ilk sayfada kazanılan cf_clearance çerezi ikinciye taşınmıyordu. Tek bağlam, iki deneme. */
  let pwBrowser = null, pwCtx = null, pwDurum = null;
  const pwSayfa = async (url) => {
    if (pwDurum === 'yok') return null;
    if (!pwCtx) {
      let chromium = null; try { ({ chromium } = await import('playwright')); } catch (e) { pwDurum = 'yok'; return null; }
      try { pwBrowser = await chromium.launch({ args: ['--disable-blink-features=AutomationControlled'] }); pwCtx = await pwBrowser.newContext({ userAgent: UA, viewport: { width: 1366, height: 850 }, locale: 'en-GB' }); }
      catch (e) { pwDurum = 'yok'; return null; }   /* chromium kurulu değil / launch düştü → köprüye geç */
    }
    const pg = await pwCtx.newPage();
    try {
      for (let deneme = 0; deneme < 2; deneme++) {
        await pg.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
        await pg.waitForFunction(() => !/just a moment|attention required/i.test(document.title) && !!document.querySelector('.hero-metal-data__number'), null, { timeout: 25000 }).catch(() => {});
        const h = await pg.content(); if (!duvar(h) && /hero-metal-data__number/.test(h)) return h;
        await pg.waitForTimeout(3000);
      }
      return null;
    } catch (e) { return null; } finally { await pg.close().catch(() => {}); }
  };
  /* §464h (20 Eki 01:50 koşusu: demir Playwright'tan GEÇTİ, ondan ÖNCE denenen hurda geçememişti): Cloudflare izni
     ikinci sayfada kazanıldı ama ilk sayfa çoktan pes etmişti. İKİ TUR: 1. tur fetch→Playwright→köprü; bir sayfa
     Playwright'tan geçtiyse (çerez artık bağlamda) kalanlar 2. turda yalnız Playwright ile yeniden denenir. */
  const lmeListe = Object.entries(SURUCU_KAYIT).filter(([, t]) => t.kaynak === 'lme');
  const lmeKalan = new Set(lmeListe.map(([k]) => k)), lmeHata = {}; let pwGecti = false;
  for (const tur of [1, 2]) {
    if (tur === 2 && !(pwGecti && lmeKalan.size)) break;
    for (const [k, t] of lmeListe) {
    if (!lmeKalan.has(k)) continue;
    try {
      let html = null, yol = 'fetch';
      /* Yol 1-2: düz fetch, iki başlık seti (Cloudflare bazen geçiriyor — 19 Eki 23:32 geçti, 00:00 geçmedi) */
      if (tur === 1) for (const H of [
        { 'User-Agent': UA, 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8', 'Accept-Language': 'en-GB,en;q=0.9', 'Upgrade-Insecure-Requests': '1' },
        { 'User-Agent': UA, 'Accept': 'text/html,application/xhtml+xml', 'Accept-Language': 'en-US,en;q=0.9', 'Referer': 'https://www.lme.com/en/metals/ferrous', 'Sec-Fetch-Dest': 'document', 'Sec-Fetch-Mode': 'navigate', 'Sec-Fetch-Site': 'same-origin', 'Cache-Control': 'no-cache' }
      ]) {
        try { const r = await fetch(t.url, { headers: H, signal: AbortSignal.timeout(25000) }); const h = await r.text(); if (r.ok && !duvar(h)) { html = h; break; } } catch (e) {}
      }
      /* Yol 3: Playwright — Cloudflare JS doğrulaması için 25 sn'ye kadar bekle; bağlam seriler arasında ORTAK (§464g) */
      if (!html) { const h = await pwSayfa(t.url); if (h) { html = h; yol = tur === 2 ? 'playwright·2.tur' : 'playwright'; } }
      if (!html && tur === 2) throw new Error('Playwright 2. turda da Cloudflare duvarı');
      /* Yol 4: Vercel köprüsü (§464e api/market.js?mod=lme) — farklı çıkış IP'si; Cloudflare orada da duvar örerse ok:false */
      if (!html) {
        try {
          const kodV = k === 'hurda_lme' ? 'hurda' : 'demir';
          /* §464f (20 Eki 00:10 koşusu: "köprü: giriş gerekli"): panelin giriş kapısı (middleware.js) çerezsiz Actions'ı
             kesiyordu. İki anahtar: (1) CRON_SECRET varsa Vercel cron'un kullandığı Bearer başlığı (middleware muaf tutar),
             (2) middleware.js'e /api/market?mod=lme muafiyeti (§249j/§361c sınıfı: kamu verisi, iki sabit sayfa). */
          const hV = { 'User-Agent': 'KtPanel/Actions', 'Accept': 'application/json' };
          if (process.env.CRON_SECRET) hV['Authorization'] = 'Bearer ' + process.env.CRON_SECRET;
          const rv = await fetch('https://ktpanel.vercel.app/api/market?mod=lme&kod=' + kodV, { headers: hV, signal: AbortSignal.timeout(30000) });
          const jv = await rv.json();
          if (jv && jv.err === 'giriş gerekli') throw new Error('köprü: giriş kapısı (middleware) kesti — ' + (process.env.CRON_SECRET ? 'CRON_SECRET Vercel ile aynı mı?' : 'Actions env\'e CRON_SECRET ekle ya da middleware.js §464f muafiyetini yükle'));
          if (jv && jv.ok && jv.deger > 0) { html = '<span class="hero-metal-data__number"> ' + jv.deger + ' </span> Month 2 Closing Price (day-delayed) Data valid for ' + (jv.etiket || '') + ' '; yol = 'vercel'; }
          else throw new Error('köprü: ' + ((jv && jv.err) || 'yanıt yok') + (jv && jv.ornek ? ' · ' + jv.ornek.slice(0, 60) : ''));
        } catch (e) { throw new Error('fetch/Playwright Cloudflare duvarı · ' + String(e && e.message || e).slice(0, 200)); }
      }
      /* §464d (19 Eki 23:38 ölçümü): değer ETİKETTEN ÖNCE gelir ve kendi sınıfında durur:
           <span class="hero-metal-data__number"> 393.00 </span> <span class="hero-metal-data__change"> 0.38% </span>
           <div class="hero-metal-data__text"> Month 2 Closing Price (day-delayed) </div>
         Önce ham HTML'de sınıf eşlenir; düşerse metin deseni (sayı → yüzde → etiket). İlk sürüm sayıyı etiketten SONRA aradı → "fiyat deseni bulunamadı". */
      let m = html.match(/hero-metal-data__number[^>]*>\s*([\d,]+(?:\.\d{1,2})?)\s*</i);
      const metin = html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/\s+/g, ' ');
      if (!m) m = metin.match(/([\d,]{2,6}(?:\.\d{1,2})?)\s+-?\d+(?:\.\d+)?%\s+Month\s*2\s*Closing\s*Price/i);
      if (!m) { const ci = metin.search(/Closing Price/i); throw new Error('fiyat deseni bulunamadı (' + yol + '): ' + metin.slice(Math.max(0, ci - 120), ci + 80)); }
      const v = +String(m[1]).replace(/,/g, '');
      if (!(v >= t.aralik[0] && v <= t.aralik[1])) throw new Error('aralık dışı ' + v);
      const tarihM = metin.match(/Data valid for\s+(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+20\d{2})/i) || metin.match(/(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+20\d{2})/i);
      const eski = (D.seriler[k] && D.seriler[k].gunluk) || [];
      const son = eski[eski.length - 1];
      if (!son || son[0] !== bugunT) eski.push([bugunT, v, tarihM ? tarihM[1] : null]); else eski[eski.length - 1] = [bugunT, v, tarihM ? tarihM[1] : null];
      D.seriler[k] = Object.assign({}, D.seriler[k] || {}, { ad: t.ad, birim: t.birim, kaynak: 'lme.com (statik sayfa, gün gecikmeli)', siklik: 'gunluk', hisse: t.hisse, gunluk: eski, son: { tarih: bugunT, deger: v, etiket: tarihM ? tarihM[1] : null }, guncelleme: bugunT, _not: 'Tarihçe LMElive üyeliği ister; seri bu koşularla birikir (ilk nokta ' + eski[0][0] + '). Değer Month-2 kontrat kapanışı, spot Platts değil — seviye değil DEĞİŞİM okunur.' });
      notlar.push(k + ' ' + v + ' $/t (' + (tarihM ? tarihM[1] : bugunT) + ', ' + eski.length + ' nokta, ' + yol + ')');
      lmeKalan.delete(k); if (yol.startsWith('playwright')) pwGecti = true;
    } catch (e) { lmeHata[k] = String(e && e.message || e).slice(0, 200); }
    }
  }
  for (const k of lmeKalan) uyari.push(k + ': ' + (lmeHata[k] || 'bilinmeyen'));
  /* türetilmiş: TR uzun çelik metal marjı (demir − hurda), ikisi de bugün geldiyse */
  try {
    const d = D.seriler.demir_lme, h = D.seriler.hurda_lme;
    if (d && h && d.son && h.son && d.son.tarih === bugunT && h.son.tarih === bugunT) {
      const marj = +(d.son.deger - h.son.deger).toFixed(2);
      const eski = (D.seriler.metal_marji_tr && D.seriler.metal_marji_tr.gunluk) || [];
      const son = eski[eski.length - 1];
      if (!son || son[0] !== bugunT) eski.push([bugunT, marj]); else eski[eski.length - 1] = [bugunT, marj];
      D.seriler.metal_marji_tr = { ad: 'TR uzun çelik metal marjı (LME inşaat demiri FOB TR − hurda CFR TR)', birim: '$/t', kaynak: 'türetilmiş (lme)', siklik: 'gunluk', hisse: ['KRDMD', 'KCAER'], gunluk: eski, son: { tarih: bugunT, deger: marj }, guncelleme: bugunT, _not: 'KRDMD/KCAER için birincil sürücü: kütük maliyeti hurda+enerji, satış inşaat demiri. Yassı (EREGL) için HRC=F − hurda/demir cevheri ayrı okunur.' };
      notlar.push('metal_marji_tr ' + marj + ' $/t');
    }
  } catch (e) { uyari.push('metal_marji_tr: ' + String(e && e.message || e).slice(0, 60)); }
  if (pwBrowser) await pwBrowser.close().catch(() => {});   /* §464g: ortak tarayıcı LME turu bitince kapanır */
  /* 3) Dünya Bankası Pink Sheet — AYLIK XLSX (CMO-Historical-Data-Monthly.xlsx, 1960'tan beri).
        §464b: ilk koşuda PDF metni (pdf-parse) hücreleri boşluksuz birleştirdi, 0 satır eşleşti → xlsx'e geçildi.
        Yapı 19 Eki Chrome'da ÖLÇÜLDÜ: sayfa "Monthly Prices", satır 5 adlar, 6 birimler, 7+ veri (A: 2026M09), eksik "…".
        Sayfa linki landing page'den regex ile; dosya ~586 KB; ayda bir değişir (A4 "Updated on …"). */
  try {
    const sayfa = await (await fetch('https://www.worldbank.org/en/research/commodity-markets', { headers: { 'User-Agent': 'Mozilla/5.0 (KtPanel/1.0)' }, signal: AbortSignal.timeout(25000) })).text();
    const xm = sayfa.match(/https:\/\/thedocs\.worldbank\.org\/[^"' ]*CMO-Historical-Data-Monthly\.xlsx/);
    if (!xm) throw new Error('aylık xlsx linki sayfada bulunamadı');
    const xlsxUrl = xm[0];
    const buf = Buffer.from(await (await fetch(xlsxUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (KtPanel/1.0)' }, signal: AbortSignal.timeout(60000) })).arrayBuffer());
    if (buf.length < 15000) throw new Error('xlsx küçük/boş (' + buf.length + ' B)');
    const rows = await xlsxSayfa(buf, 'Monthly Prices');
    const rn = Object.keys(rows).map(Number).sort((a, b) => a - b);
    const adSatir = rn.find(r => Object.values(rows[r]).some(v => typeof v === 'string' && /Crude oil,\s*Brent/i.test(v)));
    if (!adSatir) throw new Error('ad satırı bulunamadı (Crude oil, Brent yok)');
    const adlar = rows[adSatir], birimler = rows[adSatir + 1] || {};
    const guncel = (rows[4] && rows[4].A) || '';
    const veri = rn.filter(r => typeof rows[r].A === 'string' && /^\d{4}M\d{2}$/.test(rows[r].A));
    if (veri.length < 100) throw new Error('veri satırı az: ' + veri.length);
    const kolon = {};
    for (const [k, t] of Object.entries(WB_SATIR)) { const e = Object.entries(adlar).find(([c, v]) => typeof v === 'string' && t.re.test(v.trim())); if (e) kolon[k] = e[0]; }
    const bulunan = Object.keys(kolon);
    if (bulunan.length < 8) throw new Error('yalnız ' + bulunan.length + ' sütun eşleşti (' + bulunan.join(',') + '); adlar: ' + Object.values(adlar).slice(0, 12).join(' | '));
    const eskiSayi = D.wb && D.wb.guncel;
    for (const k of bulunan) {
      const t = WB_SATIR[k]; const e = D.seriler[k] || {};
      const aylik = {}; for (const r of veri) { const ay = rows[r].A; if (ay < '2015M01') continue; const v = rows[r][kolon[k]]; if (typeof v === 'number' && isFinite(v)) aylik[ay.slice(0, 4) + '-' + ay.slice(5)] = +v.toFixed(3); }
      const ceyreklik = {}, grup = {};
      for (const [ym, v] of Object.entries(aylik)) { const q = ym.slice(0, 4) + 'Q' + (Math.floor((+ym.slice(5) - 1) / 3) + 1); (grup[q] = grup[q] || []).push(v); }
      for (const [q, l] of Object.entries(grup)) if (l.length === 3) ceyreklik[q] = +(l.reduce((a, b) => a + b, 0) / 3).toFixed(3);
      const yillik = {}, gy = {}; for (const [ym, v] of Object.entries(aylik)) (gy[ym.slice(0, 4)] = gy[ym.slice(0, 4)] || []).push(v); for (const [y, l] of Object.entries(gy)) if (l.length === 12) yillik[y] = +(l.reduce((a, b) => a + b, 0) / 12).toFixed(3);
      const aylar = Object.keys(aylik).sort(); const sonAy = aylar[aylar.length - 1];
      D.seriler[k] = Object.assign({}, e, { ad: t.ad, birim: String(birimler[kolon[k]] || t.birim).replace(/[()]/g, ''), kaynak: 'Dünya Bankası Pink Sheet (aylık xlsx)', siklik: 'aylik', hisse: t.hisse, aylik, ceyreklik, yillik, son: { tarih: sonAy, deger: aylik[sonAy] }, guncelleme: bugunT });
    }
    D.wb = { url: xlsxUrl, guncel, guncelleme: bugunT, sutun: bulunan.length, satir: veri.length, ilk: rows[veri[0]].A, son: rows[veri[veri.length - 1]].A, _not: 'Monthly Prices sayfası: satır 5 adlar, 6 birimler, 7+ aylık veri; eksik "…". 2015-01 sonrası saklanır; çeyreklik = 3 tam ayın ortalaması, yıllık = 12 ay.' };
    notlar.push('wb ' + bulunan.length + ' seri · ' + D.wb.son + ' · "' + guncel + '"' + (eskiSayi === guncel ? ' (aynı sayı)' : ''));
  } catch (e) { uyari.push('wb: ' + String(e && e.message || e).slice(0, 160)); }
  if (!notlar.length) { raporlar.push('### Sürücü serileri (§464) — ✗ hiçbir kaynak gelmedi\n- ' + uyari.join('\n- ')); return; }
  D.seriler_guncelleme = bugunT;
  await yaz(dosya, D);
  degisenler.push('sürücü serileri (' + notlar.length + ')');
  raporlar.push('### Sürücü serileri (§464) — ✓ ' + notlar.length + ' seri\n- ' + notlar.join('\n- ') + (uyari.length ? '\n- ⚠ ' + uyari.join('\n- ⚠ ') : ''));
}

/* ── §466 KAMU VERİ KATMANLARI: TCMB EVDS + EPİAŞ ŞEFFAFLIK → sektor-surucu.json/seriler ──
   Karar Motoru'nun (§462–465) "kaynak bekliyor" dediği yerli sürücüler burada dolar.
   İki katman, iki anahtar; ikisi de repo Settings → Secrets → Actions'tan okunur:

   A) EVDS (evds3.tcmb.gov.tr/igmevdsms-dis) — başlık `key` = EVDS_KEY
      Seri kodları 20 Eki 2026'da EVDS portalının kendi arama ucuyla doğrulandı
      (searchResults, anahtarsız; veri ucu anahtar ister):
        TP.TUKFIY2025.GENEL / .01 (gıda) / .03 (giyim)   TÜFE 2025=100 (COICOP 2018 — 2026-1'den itibaren resmî)
        TP.FG.J0 / J01 / J03                              TÜFE 2003=100 (Arşiv; 2026-1'de biter) → 2025 öncesi ZİNCİR
        TP.TUFE1YI.T1 / T69 / T74 / T120 / T53            Yİ-ÜFE genel · çimento-kireç-alçı · ana demir-çelik · elektrik · temel kimyasal-gübre
        TP.KFE.TR                                         Konut Fiyat Endeksi (TCMB)
        TP.APIFON4                                        TCMB ağırlıklı ortalama fonlama maliyeti (iş günü, %)
        TP.BISTTLREF.ORAN                                 BIST TLREF gecelik referans faiz (iş günü, %)
      ZİNCİR: TÜİK 2026'da TÜFE bazını 2025=100'e taşıdı; yeni seri 2025-1'den başlar, eski seri
      2026-1'de biter. Örtüşen İLK ayın oranıyla eski seri yeni baza taşınır (app.js §444f ile aynı
      yöntem) → tek kesintisiz aylık endeks. Yüzde değişimler (ΔÇeyrek, ΔYıl) bazdan bağımsızdır;
      panelde seviye değil değişim okunur.

   B) EPİAŞ Şeffaflık (seffaflik.epias.com.tr/electricity-service) — iki adım:
      1) POST https://giris.epias.com.tr/cas/v1/tickets  (form: username, password; Accept: text/plain)
         → HTTP 201 + gövdede "TGT-…" (2 saat geçerli; dokümantasyon §2)
      2) POST /v1/markets/dam/data/mcp  başlık TGT, gövde {startDate, endDate} (ISO-8601 +03:00)
         → items[{date, hour, price, priceUsd, priceEur}]  — SAATLİK PTF; aralık en fazla 1 YIL (SEF1117)
         Uç ve gövde biçimi 20 Eki 2026'da tarayıcıdan doğrulandı (2026-04-01..09-30 → 4392 saat).
      Günlük ortalama alınır (≥20 saat olan günler), TL/MWh (ptf) ve $/MWh (ptf_usd) iki seri.
      Kimlik secret adları: EPIAS_ID+EPIAS_KEY · EPIAS_USER+EPIAS_PASS · EPIAS_USERNAME+EPIAS_PASSWORD ·
      EPIAS_EMAIL+EPIAS_SIFRE — ilk dolu çift kullanılır; rapor hangi AD'ın bulunduğunu yazar, değeri asla.

   DENETİM (§300 ailesi): değer aralık dışıysa atılır; seri bir önceki koşudan GERİ gittiyse yazılmaz;
   anahtar yoksa katman ⏭ ile atlanır (hata değil); hiçbir seri gelmezse dosya dokunulmaz. */
const EVDS_KAYIT = {
  tufe:         { kod: 'TP.TUKFIY2025.GENEL', eski: 'TP.FG.J0',  ad: 'TÜFE genel (2025=100; 2025 öncesi 2003 bazından zincirli)',           birim: 'endeks', siklik: 'aylik',  aralik: [20, 50000], hisse: ['ENJSA', 'ENERY', 'AHGAZ', 'BIMAS', 'MAVI', 'MPARK', 'ALBRK'] },
  tufe_gida:    { kod: 'TP.TUKFIY2025.01',    eski: 'TP.FG.J01', ad: 'TÜFE 01 gıda ve alkolsüz içecekler (2025=100; zincirli)',             birim: 'endeks', siklik: 'aylik',  aralik: [20, 50000], hisse: ['BIMAS'] },
  tufe_giyim:   { kod: 'TP.TUKFIY2025.03',    eski: 'TP.FG.J03', ad: 'TÜFE 03 giyim ve ayakkabı (2025=100; zincirli)',                     birim: 'endeks', siklik: 'aylik',  aralik: [20, 50000], hisse: ['MAVI'] },
  yiufe:        { kod: 'TP.TUFE1YI.T1',                           ad: 'Yİ-ÜFE genel (2003=100)',                                             birim: 'endeks', siklik: 'aylik',  aralik: [50, 200000], hisse: [] },
  cimento_ufe:  { kod: 'TP.TUFE1YI.T69',                          ad: 'Yİ-ÜFE 3.14.5 çimento, kireç ve alçı (2003=100)',                     birim: 'endeks', siklik: 'aylik',  aralik: [50, 200000], hisse: ['AKCNS', 'CIMSA'] },
  celik_ufe:    { kod: 'TP.TUFE1YI.T74',                          ad: 'Yİ-ÜFE 3.15.1 ana demir-çelik ve ferro alaşımlar (2003=100)',         birim: 'endeks', siklik: 'aylik',  aralik: [50, 200000], hisse: ['EREGL', 'KRDMD', 'KCAER'] },
  elektrik_ufe: { kod: 'TP.TUFE1YI.T120',                         ad: 'Yİ-ÜFE 4.1.1 elektrik üretim-iletim-dağıtım (2003=100)',             birim: 'endeks', siklik: 'aylik',  aralik: [50, 200000], hisse: ['AKFYE', 'ENJSA', 'ENERY', 'AHGAZ'] },
  gubre_ufe:    { kod: 'TP.TUFE1YI.T53',                          ad: 'Yİ-ÜFE 3.11.1 temel kimyasallar, gübre ve azot bileşikleri (2003=100)', birim: 'endeks', siklik: 'aylik', aralik: [50, 200000], hisse: ['GUBRF', 'TKFEN'] },
  plastik_uretim: { kod: 'TP.TSANAYTKVM2021.C2016',                ad: 'Sanayi üretim endeksi — C20.16 birincil formda plastik hammadde (2021=100, takvim etkisinden arındırılmış) §485', birim: 'endeks', siklik: 'aylik', aralik: [5, 1000], hisse: ['PETKM'] },
  konut_ilk_el: { kod: 'TP.AKONUTSAT3.KTRTOPLAM',                   ad: 'Konut satışı — ilk el, Türkiye (TÜİK, adet/ay) §485',              birim: 'adet', siklik: 'aylik', aralik: [1000, 1000000], hisse: ['EKGYO'] },
  konut_toplam: { kod: 'TP.AKONUTSAT1.KTRTOPLAM',                   ad: 'Konut satışı — toplam, Türkiye (TÜİK, adet/ay) §485',              birim: 'adet', siklik: 'aylik', aralik: [5000, 2000000], hisse: ['EKGYO'] },
  konut_ipotekli: { kod: 'TP.AKONUTSAT2.KTRTOPLAM',                 ad: 'Konut satışı — ipotekli (krediyle), Türkiye (TÜİK, adet/ay) §485', birim: 'adet', siklik: 'aylik', aralik: [100, 1000000], hisse: ['EKGYO'] },
  kfe:          { kod: 'TP.KFE.TR',                               ad: 'Konut Fiyat Endeksi — TCMB KFE (aylık)',                              birim: 'endeks', siklik: 'aylik',  aralik: [10, 100000], hisse: ['EKGYO'] },
  aofm:         { kod: 'TP.APIFON4',                              ad: 'TCMB ağırlıklı ortalama fonlama maliyeti (AOFM, %)',                  birim: '%',      siklik: 'gunluk', aralik: [0, 100],    hisse: ['ALBRK'], bas: '01-01-2021' },
  tlref:        { kod: 'TP.BISTTLREF.ORAN',                       ad: 'BIST TLREF gecelik referans faiz (%)',                                birim: '%',      siklik: 'gunluk', aralik: [0, 100],    hisse: ['ALBRK'], bas: '01-01-2021' },
  /* §545 (26 Eki sürücü denetimi): ALBRK makası (dar tanımlı ticari kredi − 3A mevduat; §541) · güven endeksleri perakende/giyim talebi için */
  ticari_kredi_faiz: { kod: 'TP.KTF18',                         ad: 'Ticari kredi faizi — TL, akım, KMH ve kurumsal kart HARİÇ (%, haftalık) §545', birim: '%', siklik: 'gunluk', aralik: [0, 100], hisse: ['ALBRK'], bas: '01-01-2021' },
  mevduat_3ay:  { kod: 'TP.TRY.MT02',                           ad: 'TL mevduat faizi — 3 aya kadar vadeli, akım (%, haftalık) §545', birim: '%', siklik: 'gunluk', aralik: [0, 100], hisse: ['ALBRK'], bas: '01-01-2021' },
  tuketici_guveni: { kod: 'TP.TG2.Y01',                         ad: 'Tüketici güven endeksi (TÜİK-TCMB, aylık) §545', birim: 'endeks', siklik: 'aylik', aralik: [30, 150], hisse: ['MAVI', 'VAKKO', 'BIMAS', 'MOPAS'] },
  reel_kesim_guveni: { kod: 'TP.GY1.N2',                        ad: 'Reel kesim güven endeksi (TCMB İYA, aylık) §545', birim: 'endeks', siklik: 'aylik', aralik: [30, 150], hisse: ['PARSN', 'BETAE', 'KARSN'] },
  katilim_kar_payi: { kod: 'TP.KBH.TRY.30',                        ad: 'TL katılma hesapları kâr payı oranı — toplam, akım (%, haftalık Cuma) §485', birim: '%', siklik: 'gunluk', aralik: [0, 100], hisse: ['ALBRK'], bas: '01-01-2021' },
};
const EVDS_BAS_AYLIK = '01-01-2015';
/* EVDS tarih normalizasyonu: aylık "2025-1"/"2025-01" → "2025-01"; günlük "20-10-2026" → "2026-10-20" */
function evdsTarih(t) {
  const s = String(t || '').trim();
  let m = s.match(/^(\d{4})-(\d{1,2})$/); if (m) return m[1] + '-' + m[2].padStart(2, '0');
  m = s.match(/^(\d{2})-(\d{2})-(\d{4})$/); if (m) return m[3] + '-' + m[2] + '-' + m[1];
  m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/); if (m) return m[1] + '-' + m[2].padStart(2, '0') + '-' + m[3].padStart(2, '0');
  return s;
}
/* Tek EVDS çağrısı: kodlar '-' ile birleşir; dönüş kod→Map(tarih→değer). İki deneme (12 s, 25 s). */
async function evdsCek(key, kodlar, bas, bitis) {
  const url = 'https://evds3.tcmb.gov.tr/igmevdsms-dis/series=' + kodlar.join('-') + '&startDate=' + bas + '&endDate=' + bitis + '&type=json';
  let sonHata = null;
  for (const ms of [12000, 25000]) {
    try {
      const r = await fetch(url, { headers: { 'key': key, 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0 KTPanel-Actions' }, signal: AbortSignal.timeout(ms) });
      const t = await r.text();
      if (!r.ok) { sonHata = new Error('HTTP ' + r.status + ' · ' + t.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 100)); if (r.status === 403 || r.status === 401) break; continue; }
      if (!(t.trim().startsWith('{') || t.trim().startsWith('['))) { sonHata = new Error('JSON değil: ' + t.slice(0, 80)); continue; }
      const j = JSON.parse(t); const items = Array.isArray(j) ? j : (j.items || []);
      const out = {}; for (const k of kodlar) out[k] = new Map();
      for (const it of items) {
        const tarih = evdsTarih(it.Tarih);
        for (const k of kodlar) { const v = it[k.replace(/\./g, '_')]; if (v == null || v === '') continue; const n = parseFloat(String(v).replace(',', '.')); if (isFinite(n)) out[k].set(tarih, n); }
      }
      return out;
    } catch (e) { sonHata = e; }
  }
  throw sonHata || new Error('EVDS yanıt vermedi');
}
/* Aylık Map'ten {aylik, ceyreklik(tam 3 ay), yillik(tam 12 ay)} */
function aylikTuret(m) {
  const aylik = {}; [...m.keys()].sort().forEach(a => { aylik[a] = +m.get(a).toFixed(4); });
  const grup = (anah) => { const g = {}; for (const a of Object.keys(aylik)) { const k = anah(a); (g[k] = g[k] || []).push(aylik[a]); } return g; };
  const c = grup(a => a.slice(0, 4) + 'Q' + (Math.floor((+a.slice(5, 7) - 1) / 3) + 1)), y = grup(a => a.slice(0, 4));
  const ceyreklik = {}, yillik = {};
  for (const [k, v] of Object.entries(c)) if (v.length === 3) ceyreklik[k] = +(v.reduce((s, x) => s + x, 0) / 3).toFixed(4);
  for (const [k, v] of Object.entries(y)) if (v.length === 12) yillik[k] = +(v.reduce((s, x) => s + x, 0) / 12).toFixed(4);
  return { aylik, ceyreklik, yillik };
}
async function evdsSeriler() {
  const dosya = 'sektor-surucu.json';
  if (!(await varMi(dosya))) { raporlar.push('### EVDS serileri (§466) — ⏭ sektor-surucu.json yok (önce §462 koşmalı)'); return; }
  const key = process.env.EVDS_KEY || process.env.EVDS_API_KEY || '';
  if (!key) { raporlar.push('### EVDS serileri (§466) — ⏭ EVDS_KEY secret yok\n- Repo Settings → Secrets → Actions → `EVDS_KEY` (evds3.tcmb.gov.tr → profil → API anahtarı). Tanımlanınca TÜFE gıda/giyim, çimento ÜFE, AOFM/TLREF, KFE serileri bu katmanla dolar.'); return; }
  const D = await oku(dosya); D.seriler = D.seriler || {};
  const notlar = [], uyari = [];
  const bitis = bugun.slice(8, 10) + '-' + bugun.slice(5, 7) + '-' + bugun.slice(0, 4);
  /* 1) Aylık blok: yeni baz + eski baz + ÜFE + KFE tek çağrıda */
  const aylikK = Object.entries(EVDS_KAYIT).filter(([, t]) => t.siklik === 'aylik');
  const kodlarA = [...new Set(aylikK.flatMap(([, t]) => [t.kod].concat(t.eski ? [t.eski] : [])))];
  /* 4'erli parçalar: bir parça düşerse diğerleri yaşar (URL de kısa kalır) */
  let H = null;
  for (let i = 0; i < kodlarA.length; i += 4) {
    const parca = kodlarA.slice(i, i + 4);
    try { const P = await evdsCek(key, parca, EVDS_BAS_AYLIK, bitis); H = Object.assign(H || {}, P); }
    catch (e) { uyari.push('aylık parça ' + parca.join(',') + ': ' + String(e && e.message || e).slice(0, 140)); }
  }
  if (H) for (const [k, t] of aylikK) {
    try {
      const yeni = H[t.kod] || new Map();
      if (!yeni.size) { uyari.push(k + ' (' + t.kod + ' boş — kod/yetki kontrol)'); continue; }
      const m = new Map(); let zincir = null;
      for (const [a, v] of yeni) if (v >= t.aralik[0] && v <= t.aralik[1]) m.set(a, v);
      if (t.eski && H[t.eski] && H[t.eski].size) {
        const ilkYeni = [...m.keys()].sort()[0]; const e = H[t.eski];
        if (ilkYeni && e.has(ilkYeni) && e.get(ilkYeni) > 0) {
          const kat = m.get(ilkYeni) / e.get(ilkYeni);
          for (const [a, v] of e) if (a < ilkYeni && v > 0) m.set(a, v * kat);
          zincir = 'yeni baz ' + t.kod + ' ' + ilkYeni + "'den; öncesi " + t.eski + ' × ' + kat.toFixed(6);
        } else uyari.push(k + ' (zincir kurulamadı: eski seride ' + ilkYeni + ' yok — yalnız yeni baz yazıldı)');
      }
      const T = aylikTuret(m); const aylar = Object.keys(T.aylik); const sonAy = aylar[aylar.length - 1];
      const onceki = D.seriler[k];
      if (onceki && onceki.son && onceki.son.tarih && sonAy < onceki.son.tarih) { uyari.push(k + ' (tarih geriledi ' + onceki.son.tarih + '→' + sonAy + ', atlandı)'); continue; }
      D.seriler[k] = Object.assign({}, onceki || {}, { ad: t.ad, birim: t.birim, kaynak: 'TCMB EVDS ' + t.kod + (t.eski ? ' (+' + t.eski + ' zincir)' : ''), kod: t.kod, siklik: 'aylik', hisse: t.hisse, aylik: T.aylik, ceyreklik: T.ceyreklik, yillik: T.yillik, son: { tarih: sonAy, deger: T.aylik[sonAy] }, guncelleme: bugun, _zincir: zincir || undefined });
      if (!zincir) delete D.seriler[k]._zincir;
      const oncekiAy = aylar[aylar.length - 2]; const gecenYil = T.aylik[sonAy.slice(0, 4) - 1 + sonAy.slice(4)];
      notlar.push(k + ' ' + T.aylik[sonAy] + ' (' + sonAy + ', ' + aylar.length + ' ay' + (oncekiAy ? ', aylık ' + ((T.aylik[sonAy] / T.aylik[oncekiAy] - 1) * 100).toFixed(2) + '%' : '') + (gecenYil ? ', yıllık ' + ((T.aylik[sonAy] / gecenYil - 1) * 100).toFixed(1) + '%' : '') + (zincir ? ', zincirli' : '') + ')');
    } catch (e) { uyari.push(k + ': ' + String(e && e.message || e).slice(0, 80)); }
  }
  /* 2) Günlük blok (iş günü): AOFM + TLREF — ayrı çağrı (aylıkla karışınca satırlar boş gelir) */
  const gunlukK = Object.entries(EVDS_KAYIT).filter(([, t]) => t.siklik === 'gunluk');
  for (const [k, t] of gunlukK) {
    try {
      const onceki = D.seriler[k]; const eskiG = (onceki && onceki.gunluk) || [];
      /* artımlı: dosyada seri varsa son tarihten 45 gün geriden; yoksa t.bas'tan */
      let bas = t.bas || '01-01-2021';
      if (eskiG.length) { const d = new Date(eskiG[eskiG.length - 1][0] + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() - 45); const s = d.toISOString().slice(0, 10); bas = s.slice(8, 10) + '-' + s.slice(5, 7) + '-' + s.slice(0, 4); }
      const G = await evdsCek(key, [t.kod], bas, bitis); const m = G[t.kod] || new Map();
      if (!m.size) { uyari.push(k + ' (' + t.kod + ' boş)'); continue; }
      const harita = new Map(eskiG.map(x => [x[0], x[1]])); let disi = 0;
      for (const [d, v] of m) { if (v >= t.aralik[0] && v <= t.aralik[1]) harita.set(d, +v.toFixed(4)); else disi++; }
      const gunluk = [...harita.entries()].sort((a, b) => a[0] < b[0] ? -1 : 1); const son = gunluk[gunluk.length - 1];
      if (onceki && onceki.son && son[0] < onceki.son.tarih) { uyari.push(k + ' (tarih geriledi, atlandı)'); continue; }
      D.seriler[k] = Object.assign({}, onceki || {}, { ad: t.ad, birim: t.birim, kaynak: 'TCMB EVDS ' + t.kod, kod: t.kod, siklik: 'gunluk', hisse: t.hisse, gunluk, son: { tarih: son[0], deger: son[1] }, guncelleme: bugun });
      notlar.push(k + ' %' + son[1] + ' (' + son[0] + ', ' + gunluk.length + ' gün' + (disi ? ', ' + disi + ' aralık dışı' : '') + ')');
    } catch (e) { uyari.push(k + ': ' + String(e && e.message || e).slice(0, 120)); }
  }
  /* 3) §468 TÜRETİLMİŞ: EPDK doğal gaz dağıtım tarifesi endeksi (ENERY/AHGAZ). Kaynak kural: "Doğal Gaz Dağıtım Şirketleri İçin
        Tarife Hesaplama Usul ve Esasları" (EPDK, RG 2017/30111 K.7139) md. 26 — sistem kullanım bedeli HER AY, "z-2 ayında TÜFE'de
        meydana gelen ve z-1 ayında açıklanan değişim oranı" ile güncellenir (Eşitlik 22). Yani ay z bedeli = ay z-1 bedeli × (1 +
        TÜFE aylık değişimi z-2) → endeks düzeyi TÜFE(z−2)'ye eşdeğer. Tarife dönemi başında (2022-01, 2027-01) EPDK seviyeyi
        yeniden kurar (gelir tavanı); dönem içinde kural budur. Bu yüzden seri TÜFE'den türetilir, 2022-01 = 100 (3. dönem başı).
        İki ay önceden BİLİNİR: 4Ç tarifesi Ağu–Eyl TÜFE'siyle çoktan belli. Şirket bazlı TL/Sm3 seviyesi (bölge, kademe) burada
        yok — Karar Motoru seviye değil değişim okur. */
  try {
    const tf = D.seriler.tufe && D.seriler.tufe.aylik;
    if (tf) {
      const aylar = Object.keys(tf).sort(); const onceki2 = a => { let y = +a.slice(0, 4), m = +a.slice(5, 7) - 2; if (m < 1) { m += 12; y--; } return y + '-' + String(m).padStart(2, '0'); };
      const baz = tf[onceki2('2022-01')];
      if (baz) {
        const m = new Map();
        for (const a of aylar) { if (a < '2017-01') continue; const k = onceki2(a); if (tf[k] != null) m.set(a, 100 * tf[k] / baz); }
        /* z-2 TÜFE'si bilinen ama henüz gelmemiş 2 ay: ileri taşı (tarife zaten belli) */
        const sonTufe = aylar[aylar.length - 1]; for (let i = 1; i <= 2; i++) { let y = +sonTufe.slice(0, 4), mo = +sonTufe.slice(5, 7) + i; if (mo > 12) { mo -= 12; y++; } const a = y + '-' + String(mo).padStart(2, '0'); const k = onceki2(a); if (tf[k] != null) m.set(a, 100 * tf[k] / baz); }
        const T = aylikTuret(m); const ks = Object.keys(T.aylik); const sonAy = ks[ks.length - 1];
        D.seriler.epdk_tarife = Object.assign({}, D.seriler.epdk_tarife || {}, { ad: 'EPDK doğal gaz dağıtım tarifesi endeksi — SKB aylık TÜFE(z−2) güncellemesi, 2022-01=100 (türetilmiş)', birim: 'endeks', siklik: 'aylik', hisse: ['ENERY', 'AHGAZ'], kaynak: 'türetilmiş: TCMB EVDS TÜFE (z−2) · EPDK Metodoloji md. 26 (RG 2017/30111 K.7139)', aylik: T.aylik, ceyreklik: T.ceyreklik, yillik: T.yillik, son: { tarih: sonAy, deger: T.aylik[sonAy] }, guncelleme: bugun, _not: 'Dönem içi kural: bedel(z) = bedel(z−1) × (1 + TÜFE aylık(z−2)). Son iki ay ileri taşındı (TÜFE açıklandı, tarife belli). 2027-01 dördüncü dönem başında EPDK seviyeyi yeniden kurar — kırılma notu o zaman eklenir. Şirket/bölge/kademe TL/Sm3 düzeyi değil, değişim okunur.' });
        notlar.push('epdk_tarife ' + T.aylik[sonAy].toFixed(2) + ' (' + sonAy + ', TÜFE z−2 türevi, ' + ks.length + ' ay)');
      }
    }
  } catch (e) { uyari.push('epdk_tarife: ' + String(e && e.message || e).slice(0, 80)); }
  if (!notlar.length) { raporlar.push('### EVDS serileri (§466) — ✗ hiçbir seri gelmedi\n- ' + uyari.join('\n- ')); return; }
  D.evds = { guncelleme: bugun, seriler: notlar.length, kaynak: 'evds3.tcmb.gov.tr/igmevdsms-dis', kodlar: Object.fromEntries(Object.entries(EVDS_KAYIT).map(([k, t]) => [k, t.kod])) };
  D.seriler_guncelleme = bugun;
  await yaz(dosya, D);
  degisenler.push('EVDS serileri (' + notlar.length + ')');
  raporlar.push('### EVDS serileri (§466) — ✓ ' + notlar.length + ' seri (' + Object.keys(EVDS_KAYIT).length + ' EVDS + türetilmiş)\n- ' + notlar.join('\n- ') + (uyari.length ? '\n- ⚠ ' + uyari.join('\n- ⚠ ') : ''));
}

/* ── EPİAŞ PTF ─────────────────────────────────────────────────────────────── */
const EPIAS_KIMLIK_ADAYLARI = [['EPIAS_ID', 'EPIAS_KEY'], ['EPIAS_USER', 'EPIAS_PASS'], ['EPIAS_USERNAME', 'EPIAS_PASSWORD'], ['EPIAS_EMAIL', 'EPIAS_SIFRE'], ['EPIAS_MAIL', 'EPIAS_SIFRE'], ['EPIAS_KULLANICI', 'EPIAS_SIFRE'], ['EPIAS_KULLANICI_ADI', 'EPIAS_SIFRE']];
/* §466d: TEK secret içinde "id=… / pass=…" (satır satır, virgüllü ya da JSON) — kullanıcı 20 Eki'de böyle girdi.
   Anahtar sözcükler: id|user|username|email|kullanici|login  ve  pass|password|key|sifre|parola|secret. Değerler kırpılır
   (yapıştırmadan gelen boşluk şifreyi bozmasın). Hiçbir değer loglanmaz. */
function epiasCoz(metin) {
  const t = String(metin || '').trim(); if (!t || !/[=:\n\r]/.test(t)) return null;
  try { const j = JSON.parse(t); const u = j.id || j.user || j.username || j.email || j.kullanici, p = j.key || j.pass || j.password || j.sifre || j.parola; if (u && p) return { user: String(u).trim(), pass: String(p).trim() }; } catch (e) {}
  const al = re => { const m = t.match(re); return m ? m[1].trim() : null; };
  const u = al(/(?:^|[\s,;])(?:id|user(?:name)?|e-?mail|mail|kullanici(?:_adi)?|login)\s*[=:]\s*([^\s,;]+)/im);
  const p = al(/(?:^|[\s,;])(?:pass(?:word)?|pw|key|sifre|şifre|parola|secret)\s*[=:]\s*([^\n\r,;]+?)\s*(?:[\n\r,;]|$)/im);
  if (u && p) return { user: u, pass: p };
  /* etiketsiz iki satır: biri e-posta (kullanıcı), diğeri şifre */
  const satir = t.split(/[\r\n]+/).map(x => x.trim()).filter(Boolean);
  if (satir.length === 2) { const i = satir.findIndex(x => /@/.test(x) && !/\s/.test(x)); if (i >= 0) return { user: satir[i], pass: satir[1 - i] }; }
  return null;
}
function epiasKimlik() {
  for (const [u, p] of EPIAS_KIMLIK_ADAYLARI) { const U = process.env[u], P = process.env[p]; if (U && P) { const c = epiasCoz(P); return c ? { user: c.user, pass: c.pass, adlar: p + ' (tek secret, id/pass ayrıştırıldı; ' + u + ' yok sayıldı)' } : { user: U, pass: P, adlar: u + '+' + p }; } }
  /* §466d: tek secret (ör. EPIAS_KEY = "id=…\npass=…") — önce env, sonra KTP_SECRETS içinde EPIAS adlı değerler */
  {
    const tekler = Object.entries(process.env).filter(([k, v]) => /EPIAS/i.test(k) && v);
    try { for (const [k, v] of Object.entries(JSON.parse(process.env.KTP_SECRETS || '{}'))) if (/EPIAS/i.test(k) && v && !process.env[k]) tekler.push([k, String(v)]); } catch (e) {}
    for (const [k, v] of tekler) { const c = epiasCoz(v); if (c) return { user: c.user, pass: c.pass, adlar: k + ' (tek secret, id/pass ayrıştırıldı)' }; }
  }
  /* §466b (20 Eki 00:59 koşusu: "kimlik bulunamadı" — kullanıcının verdiği secret adı listede yok): workflow
     KTP_SECRETS = toJSON(secrets) geçirir; burada YALNIZ adında EPIAS geçen anahtarlar okunur, gerisi hemen atılır,
     hiçbir değer loglanmaz. Kullanıcı adı = '@' içeren değer (e-posta) ya da ID/USER/KULLANICI/MAIL/LOGIN adlı anahtar;
     şifre = diğeri (KEY/PASS/SIFRE/SECRET/PAROLA/PWD). Ayrıca process.env'de EPIAS geçen tanımsız adlar da taranır. */
  let havuz = {};
  try { const j = JSON.parse(process.env.KTP_SECRETS || '{}'); for (const [k, v] of Object.entries(j)) if (/EPIAS/i.test(k) && v) havuz[k] = String(v); } catch (e) {}
  for (const [k, v] of Object.entries(process.env)) if (/EPIAS/i.test(k) && v && !havuz[k]) havuz[k] = String(v);
  const adlar = Object.keys(havuz); if (adlar.length < 2) return null;
  const kullaniciRe = /ID|USER|KULLANICI|MAIL|LOGIN|HESAP/i, sifreRe = /KEY|PASS|SIFRE|SECRET|PAROLA|PWD|ANAHTAR/i;
  let uAd = adlar.find(k => /@/.test(havuz[k])) || adlar.find(k => kullaniciRe.test(k) && !sifreRe.test(k)) || adlar.find(k => kullaniciRe.test(k));
  let pAd = adlar.find(k => k !== uAd && sifreRe.test(k)) || adlar.find(k => k !== uAd);
  if (!uAd || !pAd) return null;
  return { user: havuz[uAd], pass: havuz[pAd], adlar: uAd + '+' + pAd + ' (KTP_SECRETS taraması)' };
}
/* §466f (20 Eki 01:50 koşusu: HTTP 401 "authentication_exceptions"): CAS hata gövdesindeki istisna sınıfı NEDENİ söyler —
   AccountNotFound = e-posta yanlış · FailedLogin = şifre yanlış · AccountLocked/Disabled · CredentialExpired = şifre yenilenmeli.
   Kimlik önce KIRPILMIŞ (baş/son boşluk — yapıştırma artığı) denenir; 401 alırsa ve ham değer farklıysa bir kez ham denenir. */
const EPIAS_CAS_NEDEN = { AccountNotFoundException: 'kullanıcı adı (e-posta) CAS\'ta bulunamadı — kayit.epias.com.tr e-postası mı?', FailedLoginException: 'şifre yanlış (ya da secret\'a eski şifre yazılı)', AccountLockedException: 'hesap kilitli — çok deneme; giris.epias.com.tr\'den aç', AccountDisabledException: 'hesap pasif', CredentialExpiredException: 'şifre süresi dolmuş — giris.epias.com.tr\'de yenile', AccountExpiredException: 'hesap süresi dolmuş', AccountPasswordMustChangeException: 'şifre değiştirilmeli (ilk giriş) — giris.epias.com.tr\'de bir kez elle gir', UnauthorizedServiceException: 'bu kullanıcı Şeffaflık servisine yetkili değil' };
function epiasCasNeden(govde) {
  const sinif = [...String(govde || '').matchAll(/([A-Z][A-Za-z]+Exception)/g)].map(m => m[1]).filter((x, i, a) => a.indexOf(x) === i);
  return sinif.length ? sinif.map(x => EPIAS_CAS_NEDEN[x] ? x + ' → ' + EPIAS_CAS_NEDEN[x] : x).join(' · ') : null;
}
async function epiasTgt(kimlik) {
  const denemeler = [{ u: String(kimlik.user).trim(), p: String(kimlik.pass).trim(), ad: 'kırpılmış' }];
  if (denemeler[0].u !== kimlik.user || denemeler[0].p !== kimlik.pass) denemeler.push({ u: kimlik.user, p: kimlik.pass, ad: 'ham (boşluklu)' });
  let son = null;
  for (const d of denemeler) {
    const r = await fetch('https://giris.epias.com.tr/cas/v1/tickets', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'text/plain' }, body: new URLSearchParams({ username: d.u, password: d.p }).toString(), signal: AbortSignal.timeout(25000) });
    const t = (await r.text()).trim();
    if ((r.status === 201 || r.ok) && /^TGT-/.test(t)) return t;
    const neden = epiasCasNeden(t);
    son = 'TGT alınamadı HTTP ' + r.status + ' (' + d.ad + ' kimlik) · ' + (neden || t.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 90));
    if (r.status !== 401 && r.status !== 400) break;   /* 5xx/ağ: ham denemenin anlamı yok */
  }
  throw new Error(son || 'TGT alınamadı');
}
const EPIAS_BAS = '2023-01-01';   /* 2024Q1'den itibaren katalogdaki gerçek FAVÖK çeyrekleriyle yıllık karşılaştırma için bir yıl pay */
async function epiasPtf() {
  const dosya = 'sektor-surucu.json';
  if (!(await varMi(dosya))) { raporlar.push('### EPİAŞ PTF (§466) — ⏭ sektor-surucu.json yok (önce §462 koşmalı)'); return; }
  const kimlik = epiasKimlik();
  if (!kimlik) { raporlar.push('### EPİAŞ PTF (§466) — ⏭ EPİAŞ kimliği (secret) bulunamadı\n- Beklenen ad çiftleri: ' + EPIAS_KIMLIK_ADAYLARI.map(x => '`' + x[0] + '`+`' + x[1] + '`').join(' · ') + '\n- Ya da TEK secret (ör. EPIAS_KEY) içinde iki satır: `id=<e-posta>` ve `pass=<şifre>` (§466d). Bu koşuda dolu gelen EPIAS adlı env sayısı: ' + Object.keys(process.env).filter(k => /EPIAS/i.test(k) && process.env[k]).length + (Object.keys(process.env).filter(k => /EPIAS/i.test(k) && process.env[k]).length === 1 ? ' — tek değer var ama id=/pass= deseni çözülemedi (satır başlarını kontrol et)' : '') +
    '\n- Değer: Şeffaflık Platformu kullanıcı e-postası + şifresi (kayit.epias.com.tr). Secret adı workflow env listesindeki adlardan biri olmalı (EPIAS_ID/EPIAS_KEY en sadesi).'); return; }
  const D = await oku(dosya); D.seriler = D.seriler || {};
  const eskiTL = (D.seriler.ptf && D.seriler.ptf.gunluk) || [];
  const eskiUSD = (D.seriler.ptf_usd && D.seriler.ptf_usd.gunluk) || [];
  /* artımlı: son günden 10 gün geriden; ilk koşuda EPIAS_BAS'tan. Bitiş: yarın (GÖP yarının fiyatını ~14:00'te açıklar) */
  let bas = EPIAS_BAS;
  if (eskiTL.length) { const d = new Date(eskiTL[eskiTL.length - 1][0] + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() - 10); bas = d.toISOString().slice(0, 10); }
  /* §466g (20 Eki 10:19 koşusu: son parça HTTP 400 "2026-10-21 tarihli veri saat 14 öncesinde mevcut değil" → parça düştü,
     seri 13 Haz'da kesildi): GÖP yarının fiyatını ~14:00 TR açıklar; bitiş tarihi TR saatine göre seçilir — 15:00'ten önce
     bugün, sonra yarın. Yine de 400 gelirse son parça bitişi bir gün geri alınarak BİR KEZ yeniden denenir. */
  const trSimdi = new Date(Date.now() + 3 * 3600 * 1000); const bugunTR = trSimdi.toISOString().slice(0, 10);
  const yarin = (() => { if (trSimdi.getUTCHours() < 15) return bugunTR; const d = new Date(bugunTR + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10); })();
  let tgt;
  try { tgt = await epiasTgt(kimlik); }
  catch (e) { raporlar.push('### EPİAŞ PTF (§466) — ✗ ' + String(e && e.message || e).slice(0, 160) + '\n- Kimlik secret adları bulundu (' + kimlik.adlar + ') ama giriş reddedildi: e-posta/şifre ya da Şeffaflık üyeliği (kayit.epias.com.tr) kontrol.'); return; }
  /* parçalar: ≤180 gün (sunucu sınırı 1 yıl; yanıt ~700 KB/9 ay — küçük tutuluyor) */
  const parcalar = []; { let p = new Date(bas + 'T00:00:00Z'); const son = new Date(yarin + 'T00:00:00Z'); while (p <= son) { const q = new Date(p); q.setUTCDate(q.getUTCDate() + 179); const e = q > son ? son : q; parcalar.push([p.toISOString().slice(0, 10), e.toISOString().slice(0, 10)]); p = new Date(e); p.setUTCDate(p.getUTCDate() + 1); } }
  const saat = new Map();   /* gün → {tl:[], usd:[]} */
  let saatToplam = 0, hata = null;
  const mcpCek = async (s, e) => {
    const r = await fetch('https://seffaflik.epias.com.tr/electricity-service/v1/markets/dam/data/mcp', { method: 'POST', headers: { 'TGT': tgt, 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify({ startDate: s + 'T00:00:00+03:00', endDate: e + 'T00:00:00+03:00' }), signal: AbortSignal.timeout(60000) });
    const t = await r.text();
    if (!r.ok) { let m = ''; try { const j = JSON.parse(t); m = (j.errors || []).map(x => x.errorMessage || x.errorCode).join('; ') || ''; } catch (_) {} const err = new Error('HTTP ' + r.status + (m ? ' · ' + m.slice(0, 100) : '')); err.mesaj = m; throw err; }
    return JSON.parse(t);
  };
  for (const [s, e0] of parcalar) {
    let e = e0;
    try {
      let j;
      try { j = await mcpCek(s, e); }
      catch (err) { if (/mevcut değil|saat 14|not available/i.test(String(err.mesaj || err.message)) && e > s) { const d = new Date(e + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() - 1); e = d.toISOString().slice(0, 10); j = await mcpCek(s, e); } else throw err; }
      for (const it of (j.items || [])) {
        const g = String(it.date || '').slice(0, 10); if (!/^\d{4}-\d{2}-\d{2}$/.test(g)) continue;
        const tl = +it.price, usd = +it.priceUsd; if (!isFinite(tl)) continue;
        const b = saat.get(g) || { tl: [], usd: [] }; b.tl.push(tl); if (isFinite(usd)) b.usd.push(usd); saat.set(g, b); saatToplam++;
      }
    } catch (err) { hata = (hata ? hata + ' | ' : '') + s + '..' + e + ': ' + String(err && err.message || err).slice(0, 100); }
  }
  if (!saat.size) { raporlar.push('### EPİAŞ PTF (§466) — ✗ veri gelmedi' + (hata ? '\n- ' + hata : '') + '\n- sektor-surucu.json KORUNDU.'); return; }
  const ort = a => a.reduce((x, y) => x + y, 0) / a.length;
  const hTL = new Map(eskiTL.map(x => [x[0], x[1]])), hUSD = new Map(eskiUSD.map(x => [x[0], x[1]]));
  let eksikGun = 0;
  for (const [g, b] of saat) { if (b.tl.length < 20) { eksikGun++; continue; } hTL.set(g, +ort(b.tl).toFixed(2)); if (b.usd.length >= 20) hUSD.set(g, +ort(b.usd).toFixed(2)); }
  const gTL = [...hTL.entries()].sort((a, b) => a[0] < b[0] ? -1 : 1), gUSD = [...hUSD.entries()].sort((a, b) => a[0] < b[0] ? -1 : 1);
  const sonTL = gTL[gTL.length - 1], sonUSD = gUSD[gUSD.length - 1];
  if (D.seriler.ptf && D.seriler.ptf.son && sonTL[0] < D.seriler.ptf.son.tarih) { raporlar.push('### EPİAŞ PTF (§466) — ⚠ tarih geriledi (' + D.seriler.ptf.son.tarih + '→' + sonTL[0] + '), yazılmadı'); return; }
  const ortak = { kaynak: 'EPİAŞ Şeffaflık · GÖP PTF saatlik → günlük ortalama (TGT)', siklik: 'gunluk', guncelleme: bugun, _not: 'Saatlik piyasa takas fiyatının gün ortalaması (≥20 saat). Gün Öncesi Piyasası yarının fiyatını ~14:00 TR açıklar; akşam koşusu yarını da alır.' };
  D.seriler.ptf = Object.assign({}, D.seriler.ptf || {}, ortak, { ad: 'PTF — gün öncesi piyasa takas fiyatı, günlük ort.', birim: 'TL/MWh', hisse: ['AKFYE', 'AHGAZ', 'ENJSA', 'ENERY'], gunluk: gTL, son: { tarih: sonTL[0], deger: sonTL[1] } });
  if (sonUSD) D.seriler.ptf_usd = Object.assign({}, D.seriler.ptf_usd || {}, ortak, { ad: 'PTF — günlük ort., ABD doları (TCMB alış kuruyla, EPİAŞ)', birim: '$/MWh', hisse: ['AKFYE'], gunluk: gUSD, son: { tarih: sonUSD[0], deger: sonUSD[1] } });
  /* bilgi: son 30 gün ortalaması ve geçen yılın aynı 30 günü */
  const son30 = gTL.slice(-30).map(x => x[1]); const yilOnce = sonTL[0].slice(0, 4) - 1 + sonTL[0].slice(4); const gecen30 = gTL.filter(x => x[0] <= yilOnce).slice(-30).map(x => x[1]);
  const yoy = (son30.length === 30 && gecen30.length === 30) ? ((ort(son30) / ort(gecen30) - 1) * 100).toFixed(1) + '%' : null;
  D.epias = { guncelleme: bugun, gun: gTL.length, ilk: gTL[0][0], son: sonTL[0], kimlik_adlari: kimlik.adlar, kaynak: 'seffaflik.epias.com.tr/electricity-service/v1/markets/dam/data/mcp' };
  D.seriler_guncelleme = bugun;
  await yaz(dosya, D);
  degisenler.push('EPİAŞ PTF (' + gTL.length + ' gün)');
  raporlar.push('### EPİAŞ PTF (§466) — ✓ ' + sonTL[1] + ' TL/MWh' + (sonUSD ? ' · ' + sonUSD[1] + ' $/MWh' : '') + ' (' + sonTL[0] + ')\n- ' + gTL.length + ' gün (' + gTL[0][0] + '→) · bu koşuda ' + saat.size + ' gün/' + saatToplam + ' saat · ' + parcalar.length + ' parça' + (eksikGun ? ' · ' + eksikGun + ' eksik gün atlandı' : '') + '\n- son 30 gün ort. ' + (son30.length ? ort(son30).toFixed(0) : '—') + ' TL/MWh' + (yoy ? ' · yıllık ' + yoy : '') + ' · kimlik: ' + kimlik.adlar + (hata ? '\n- ⚠ ' + hata : ''));
}

/* ── §467 ASELSAN SÖZLEŞME AKIŞI (KAP açıklamaları → sektor-surucu.json/seriler.asels_kap_siparis) ──
   Kullanıcı (20 Eki 02:18): "aselsanın backloglarını buradan toplayabilir misin?" → aselsan.com/investor-relations/kap-disclosures
   ÖLÇÜM (Chrome): sayfa Next.js, veri tek JSON uçtan gelir ve TAM METİN taşır (TR+EN):
     GET https://webapi.aselsan.com/investor-relations/kap-disclosures?locale=tr  → 283 açıklama (2017-01→), her biri
     {announcementDate, translations:[{locale:'tr', title, description(html), slug}, {locale:'en', …}]}
   Başlıklar: "SÖZLEŞME İMZALANMASI" 181 · "SÖZLEŞME DEĞİŞİKLİĞİ" 22 · diğer (atama, sigorta…) 80. Tutar TR metinde çeşitli
   biçimlerde: "125 milyon ABD Doları" · "1,2 milyar Avro" · "195.000.000,- ABD Doları" · "40.801.680- ABD Doları ve
   352.221.840-TL" · "29.135.362,99- Avro" · "ABD Dolar'ı". Çok para birimli sözleşmeler var; bazı metinler bileşenleri VE
   toplamı birlikte verir ("… 2,6 mlr TL ve 132 mn $ … toplam bedeli 20,7 mlr TL ve 1,2 mlr $") → "toplam" sözcüğünden
   SONRAKİ tutarlar alınır (yoksa tümü; aynı tutar+para birimi tekrarları sayılmaz). Chrome'da 212/212 sözleşme çözüldü.
   NE DEĞİL: Bu seri KAP eşiği üstü AÇIKLANAN sözleşmelerdir, resmî "yeni iş alımı" değildir. Kıyas: 2024 açıklanan ≈4,4 mlr $
   / resmî 6,5 · 2025 ≈6,4 / 9,6 · 1Y26 ≈2,05 / 4,9 → kapsam ~%45-70. Resmî bakiye sipariş (backlog) çeyrek sunumundan:
   2024 sonu 14,0 · 2025 sonu 20,4 · 2Ç26 23,2 mlr $ (asels_backlog tohumu; elle güncellenir).
   KUR: Yahoo TRY=X ve EURUSD=X 10 yıllık günlük (yahooSeri) — açıklama gününün (ya da önceki iş gününün) kuru. Yahoo
   gelmezse dosyadaki usdtry/eurusd (2 yıl) + eski tarihler için çeyrek ortalama tablosu (Fintables, 20 Eki ölçümü).
   DENETİM: ≥150 sözleşme çözülmeli ve çözülemeyen ≤%5; aksi halde dosya dokunulmaz, rapor çözülemeyen örnekleri yazar. */
const ASELS_URL = 'https://webapi.aselsan.com/investor-relations/kap-disclosures?locale=tr';
/* Yedek kur tablosu (çeyrek ortalamaları, Fintables mumlar_gunluk_gh 20 Eki 2026): Yahoo 10y gelmezse */
const ASELS_KUR_YEDEK = {
  usdtry: { '2017Q1': 3.6954, '2017Q2': 3.5774, '2017Q3': 3.5128, '2017Q4': 3.8021, '2018Q1': 3.8172, '2018Q2': 4.3734, '2018Q3': 5.6619, '2018Q4': 5.4903, '2019Q1': 5.368, '2019Q2': 5.6503, '2019Q3': 5.6761, '2019Q4': 5.8033, '2020Q1': 6.1227, '2020Q2': 6.8688, '2020Q3': 7.2459, '2020Q4': 7.8636, '2021Q1': 7.4184, '2021Q2': 8.4052, '2021Q3': 8.5492, '2021Q4': 11.2346, '2022Q1': 13.9609, '2022Q2': 15.8148, '2022Q3': 17.9591, '2022Q4': 18.6136, '2023Q1': 18.8816, '2023Q2': 21.0007, '2023Q3': 26.8012, '2023Q4': 28.5501, '2024Q1': 30.986, '2024Q2': 32.3857, '2024Q3': 33.5486, '2024Q4': 34.5736, '2025Q1': 36.3035, '2025Q2': 38.8136, '2025Q3': 40.8185, '2025Q4': 42.2931, '2026Q1': 43.7561, '2026Q2': 45.5532, '2026Q3': 47.898, '2026Q4': 49.3142 },
  eurusd: { '2017Q1': 1.0655, '2017Q2': 1.1013, '2017Q3': 1.1754, '2017Q4': 1.1781, '2018Q1': 1.2293, '2018Q2': 1.1917, '2018Q3': 1.1628, '2018Q4': 1.1408, '2019Q1': 1.1355, '2019Q2': 1.1236, '2019Q3': 1.1113, '2019Q4': 1.1078, '2020Q1': 1.1026, '2020Q2': 1.1018, '2020Q3': 1.1699, '2020Q4': 1.1936, '2021Q1': 1.2044, '2021Q2': 1.2054, '2021Q3': 1.1782, '2021Q4': 1.1432, '2022Q1': 1.1215, '2022Q2': 1.0638, '2022Q3': 1.0063, '2022Q4': 1.0221, '2023Q1': 1.0732, '2023Q2': 1.089, '2023Q3': 1.088, '2023Q4': 1.0768, '2024Q1': 1.0854, '2024Q2': 1.0767, '2024Q3': 1.0993, '2024Q4': 1.0655, '2025Q1': 1.0533, '2025Q2': 1.1357, '2025Q3': 1.1685, '2025Q4': 1.1641, '2026Q1': 1.1709, '2026Q2': 1.1622, '2026Q3': 1.1502, '2026Q4': 1.1211 },
};
/* Resmî bakiye sipariş (mlr $) ve yeni iş alımı — şirket çeyrek sonuçları (AA/Bloomberg HT haberleri, 20 Eki 2026 ölçümü). ELLE güncellenir. */
const ASELS_RESMI = {
  backlog: { '2024Q4': 14.0, '2025Q4': 20.4, '2026Q2': 23.2 },
  yeni_is: { '2024': 6.5, '2025': 9.6, '2026H1': 4.9 },
  kaynak: 'Şirket çeyrek sonuçları (AA/Bloomberg HT: 24 Şub 2026 · 5 Ağu 2026) — elle',
  not: '24 Şub 2026: 2025 sonu bakiye 20,4 · yeni iş 9,6 · 2024 sonu 14,0 mlr $. 5 Ağu 2026: 1Y26 bakiye 23,2 (+%45) · yeni iş 4,9 (+%72) mlr $.',
};
const aselsTemiz = h => String(h || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const aselsSayi = s => { s = s.trim(); if (/,\d{1,2}$/.test(s)) return parseFloat(s.replace(/\./g, '').replace(',', '.')); if (/^\d{1,3}(\.\d{3})+$/.test(s)) return parseFloat(s.replace(/\./g, '')); return parseFloat(s.replace(',', '.')); };
const aselsPB = s => { s = s.toLowerCase(); if (/abd|usd|dolar|\$/.test(s)) return 'USD'; if (/avro|euro|eur|€/.test(s)) return 'EUR'; if (/sterlin|gbp|£/.test(s)) return 'GBP'; if (/zlot|pln|zł/.test(s)) return 'PLN'; return 'TL'; };
/* §469d (KATMR canlı metinleri): sembol ÖNDE "$ 8.392.800 (SekizMilyon…)", "€ 2.990.000", "$7.684.639"; sembol arkada "4.150.000 $";
   rakamın yazıyla tekrarı parantez içinde; HTML varlıkları (&#x27;). Ön-normalizasyon: rakamsız parantezler atılır, sembol biçimleri
   "SAYI PARA" biçimine çevrilir; GBP/PLN eklendi (kur yaklaşık: GBP 1,27 $ · PLN = EUR/4,3). */
const ASELS_PB_YAKLASIK = { GBP: 1.27, PLN_EUR: 4.3 };
const ASELS_RE = /(\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+(?:,\d+)?)[\s,.\-]*(milyon|milyar|bin)?[\s,.\-]*(ABD\s*Dolar['’]?[ıi]?|Amerikan\s*Dolar['’]?[ıi]?|USD|Dolar|Avro|Euro|EURO|EUR|İngiliz\s*Sterlini|Sterlin|GBP|Polonya\s*Zlotisi|Zloti|PLN|Türk\s*Liras[ıi]|TL|TRY)(?![A-Za-zıİşŞğĞüÜöÖçÇ])/giu;
function aselsNormalize(m) {
  let t = String(m || '').replace(/&#x27;|&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#(\d+);/g, (_, c) => String.fromCharCode(+c));
  t = t.replace(/\([^)\d]*\)/g, ' ');                                                        /* (üçmilyondokuzyüzbin), (KDV Hariç) */
  t = t.replace(/\([^)]*(?:yaklaşık|karşılığ|TCMB|kuru|kur\b|döviz)[^)]*\)/giu, ' ');            /* (yaklaşık 260 mn TL, TCMB kuru…) */
  t = t.replace(/([$€£])\s*(\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+(?:,\d+)?)(\s*(?:milyon|milyar|bin))?/giu, (_, pb, sayi, carpan) => sayi + (carpan || '') + ' ' + ({ '$': 'USD', '€': 'EUR', '£': 'GBP' })[pb]);
  t = t.replace(/(\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+(?:,\d+)?)(\s*(?:milyon|milyar|bin))?\s*([$€£])(?![\w])/giu, (_, sayi, carpan, pb) => sayi + (carpan || '') + ' ' + ({ '$': 'USD', '€': 'EUR', '£': 'GBP' })[pb]);
  t = t.replace(/\bzł\b/g, ' PLN');
  return t.replace(/\s+/g, ' ');
}
/* Metinden tutarları çöz: "toplam" varsa ondan sonrası; aynı (para birimi, tutar) tekrarı sayılmaz; <1000 birim (yıl, adet) atlanır */
function aselsCozum(m) {
  /* §469c/d: ön-normalizasyon — parantez içi kur karşılıkları ve yazıyla sayılar atılır, sembol biçimleri sözcüğe çevrilir */
  m = aselsNormalize(m);
  /* §469b: konsorsiyum/iş ortaklığı metninde "Şirketimizin/ASELSAN payı … Avro" varsa ŞİRKET PAYI esastır (toplam değil) */
  const payM = m.match(/pay\s*tutar[ıi]\s*(?:ise|olan|olarak)?\s*(?=\d)/iu) || m.match(/(?:şirketimizin|ortaklığımızın|aselsan|grubumuzun|[A-ZÇĞİÖŞÜ][\wçğıöşü]+)\s+pay[ıi]\s*(?:ise|olan|olarak)?\s*(?=\d)/u);
  if (payM) { const r = aselsCozumParca(m.slice(payM.index)); if (r.adet) return r; }
  const sonToplam = Math.max(m.lastIndexOf('toplam'), m.lastIndexOf('Toplam'));
  const parca = sonToplam >= 0 ? m.slice(sonToplam) : m;
  const tutar = { USD: 0, EUR: 0, TL: 0, GBP: 0, PLN: 0 }; const gorulen = new Set(); let adet = 0;
  for (const h of parca.matchAll(ASELS_RE)) {
    let v = aselsSayi(h[1]); const c = (h[2] || '').toLowerCase();
    if (c === 'milyar') v *= 1e9; else if (c === 'milyon') v *= 1e6; else if (c === 'bin') v *= 1e3;
    if (!(v > 1000)) continue;
    const pb = aselsPB(h[3]); const anahtar = pb + ':' + v; if (gorulen.has(anahtar)) continue;
    gorulen.add(anahtar); tutar[pb] += v; adet++;
  }
  if (!adet && sonToplam >= 0) return aselsCozum(m.slice(0, sonToplam));   /* "toplam" sonrası tutarsızsa öncesine bak */
  return { tutar, adet };
}
function aselsCozumParca(parca) {
  const tutar = { USD: 0, EUR: 0, TL: 0, GBP: 0, PLN: 0 }; const gorulen = new Set(); let adet = 0;
  for (const h of parca.matchAll(ASELS_RE)) {
    let v = aselsSayi(h[1]); const c = (h[2] || '').toLowerCase();
    if (c === 'milyar') v *= 1e9; else if (c === 'milyon') v *= 1e6; else if (c === 'bin') v *= 1e3;
    if (!(v > 1000)) continue;
    const pb = aselsPB(h[3]); const anahtar = pb + ':' + v; if (gorulen.has(anahtar)) continue;
    gorulen.add(anahtar); tutar[pb] += v; adet++;
    break;   /* pay tutarı: ilk tutar (ve varsa aynı cümledeki ikinci para birimi aşağıda) */
  }
  /* "payı 20 mn $ ve 45 mn €" gibi iki para birimli pay: ilk tutardan sonra ' ve ' ile bağlı ikinci tutar */
  const ikinci = parca.match(new RegExp('^[^.;]*?' + ASELS_RE.source.replace(/^\(/, '(?:') , 'iu'));
  if (ikinci) { const kalan = parca.slice(ikinci[0].length); const m2 = kalan.match(/^\s*(?:ve|,)\s*/); if (m2) { const h2 = kalan.slice(m2[0].length).match(new RegExp('^' + ASELS_RE.source, 'iu')); if (h2) { let v = aselsSayi(h2[1]); const c = (h2[2] || '').toLowerCase(); if (c === 'milyar') v *= 1e9; else if (c === 'milyon') v *= 1e6; else if (c === 'bin') v *= 1e3; if (v > 1000) { const pb = aselsPB(h2[3]); tutar[pb] += v; adet++; } } } }
  return { tutar, adet };
}
/* §471 (kullanıcı 20 Eki 10:56: "backloglar toplam gözükse daha iyi olur, her yıl yeni bir başlangıç olsun; liste dağınık"):
   akış serileri için YILLIK KÜMÜLATİF özet — yıl toplamı, adet, bugünün ay-gününe kadar olan kısım (geçen yılla aynı tarih
   kıyası) ve son sözleşme. Panel uzun liste yerine bu tabloyu gösterir. */
function akisYillik(items, bugunStr) {
  const mmdd = bugunStr.slice(5, 10); const out = {};
  for (const it of items) {
    const y = it.t.slice(0, 4); const o = out[y] = out[y] || { toplam: 0, adet: 0, tutarsiz: 0, ayni_tarih: 0, ayni_tarih_adet: 0, son: null };
    o.adet++; if (it.tutarsiz) o.tutarsiz++; if (it.konsorsiyum) o.konsorsiyum = (o.konsorsiyum || 0) + 1; o.toplam = +(o.toplam + (it.usd_mn || 0)).toFixed(1);
    if (it.t.slice(5, 10) <= mmdd) { o.ayni_tarih = +(o.ayni_tarih + (it.usd_mn || 0)).toFixed(1); o.ayni_tarih_adet++; }
    if (!o.son || it.t > o.son.t) o.son = { t: it.t, usd_mn: it.usd_mn, ozet: String(it.ozet || '').slice(0, 120) };
  }
  const yillar = Object.keys(out).sort();
  for (let i = 0; i < yillar.length; i++) { const y = yillar[i], g = out[String(+y - 1)]; out[y].yy_ayni_tarih = (g && g.ayni_tarih > 0) ? +((out[y].ayni_tarih / g.ayni_tarih - 1) * 100).toFixed(1) : null; out[y].yy_toplam = (g && g.toplam > 0 && y !== bugunStr.slice(0, 4)) ? +((out[y].toplam / g.toplam - 1) * 100).toFixed(1) : null; }
  return { yillar: out, bugun: bugunStr, mmdd };
}
async function aselsSiparis() {
  const dosya = 'sektor-surucu.json';
  if (!(await varMi(dosya))) { raporlar.push('### ASELSAN sözleşme akışı (§467) — ⏭ sektor-surucu.json yok'); return; }
  let liste;
  try {
    const r = await fetch(ASELS_URL, { headers: { 'Accept': 'application/json', 'Origin': 'https://www.aselsan.com', 'Referer': 'https://www.aselsan.com/investor-relations/kap-disclosures', 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36' }, signal: AbortSignal.timeout(30000) });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    liste = await r.json(); if (!Array.isArray(liste)) liste = liste.data || liste.items || [];
  } catch (e) { raporlar.push('### ASELSAN sözleşme akışı (§467) — ✗ webapi.aselsan.com: ' + String(e && e.message || e).slice(0, 120) + '\n- seri KORUNDU (varsa).'); return; }
  const D = await oku(dosya); D.seriler = D.seriler || {};
  /* kur: Yahoo 10y günlük; düşerse dosyadaki 2y + çeyrek yedeği */
  let fxUsd = new Map(), fxEur = new Map();
  try { const h = await yahooSeri(['TRY=X', 'EURUSD=X'], '', '10y'); fxUsd = h['TRY=X'] || new Map(); fxEur = h['EURUSD=X'] || new Map(); } catch (e) {}
  if (!fxUsd.size && D.seriler.usdtry) fxUsd = new Map(D.seriler.usdtry.gunluk);
  if (!fxEur.size && D.seriler.eurusd) fxEur = new Map(D.seriler.eurusd.gunluk);
  const fxUsdK = [...fxUsd.keys()].sort(), fxEurK = [...fxEur.keys()].sort();
  const kur = (harita, anahtarlar, tarih, yedek) => {
    if (harita.size) { let son = null; for (const k of anahtarlar) { if (k <= tarih) son = k; else break; } if (son && (new Date(tarih) - new Date(son)) < 20 * 86400000) return harita.get(son); }
    const q = tarih.slice(0, 4) + 'Q' + (Math.floor((+tarih.slice(5, 7) - 1) / 3) + 1); return yedek[q] || yedek[Object.keys(yedek).sort().pop()];
  };
  const q = d => d.slice(0, 4) + 'Q' + (Math.floor((+d.slice(5, 7) - 1) / 3) + 1);
  const items = [], cozulemeyen = [], gorulenKayit = new Set(); let sozlesmeSayisi = 0, kurYolu = fxUsd.size > 600 ? 'Yahoo 10y' : (fxUsd.size ? 'dosya 2y + çeyrek yedeği' : 'çeyrek yedeği');
  for (const x of liste) {
    const T = (x.translations || []).find(t => t.locale === 'tr') || {}; const baslik = String(T.title || '').trim();
    if (!/SÖZLEŞME/i.test(baslik) || /DERECELENDİRME/i.test(baslik)) continue;
    const tarih = String(x.announcementDate || '').slice(0, 10); if (!/^\d{4}-\d{2}-\d{2}$/.test(tarih)) continue;
    sozlesmeSayisi++;
    const metin = aselsTemiz(T.description); const { tutar, adet } = aselsCozum(metin);
    if (!adet) { cozulemeyen.push(tarih + ': ' + metin.slice(0, 110)); continue; }
    const imza = tarih + '|' + baslik + '|' + tutar.USD + '|' + tutar.EUR + '|' + tutar.TL; if (gorulenKayit.has(imza)) continue; gorulenKayit.add(imza);   /* listede aynı açıklama iki kez (2017-06-06, 2018-12-25) */
    const u = kur(fxUsd, fxUsdK, tarih, ASELS_KUR_YEDEK.usdtry), e = kur(fxEur, fxEurK, tarih, ASELS_KUR_YEDEK.eurusd);
    const usdMn = +((tutar.USD + tutar.EUR * e + tutar.TL / u + (tutar.GBP || 0) * ASELS_PB_YAKLASIK.GBP + (tutar.PLN || 0) / ASELS_PB_YAKLASIK.PLN_EUR * e) / 1e6).toFixed(1);
    items.push({ t: tarih, tur: /DEĞİŞİKLİĞİ/i.test(baslik) ? 'değişiklik' : 'yeni', usd_mn: usdMn, usd: +(tutar.USD / 1e6).toFixed(2), eur: +(tutar.EUR / 1e6).toFixed(2), tl: +(tutar.TL / 1e6).toFixed(1), ozet: metin.slice(0, 160), slug: T.slug || null });
  }
  if (items.length < 150 || cozulemeyen.length > Math.max(5, sozlesmeSayisi * 0.05)) { raporlar.push('### ASELSAN sözleşme akışı (§467) — ✗ denetim: ' + items.length + ' çözüldü, ' + cozulemeyen.length + '/' + sozlesmeSayisi + ' çözülemedi — şablon değişmiş olabilir; seri KORUNDU\n- ' + cozulemeyen.slice(0, 4).join('\n- ')); return; }
  items.sort((a, b) => a.t < b.t ? -1 : 1);
  /* aylık/çeyreklik/yıllık TOPLAM (akış); boş aylar 0 */
  const aylik = {}; { const ilk = items[0].t.slice(0, 7); let y = +ilk.slice(0, 4), m = +ilk.slice(5, 7); const son = bugun.slice(0, 7); while (true) { const k = y + '-' + String(m).padStart(2, '0'); aylik[k] = 0; if (k >= son) break; m++; if (m > 12) { m = 1; y++; } } }
  for (const it of items) aylik[it.t.slice(0, 7)] = +((aylik[it.t.slice(0, 7)] || 0) + it.usd_mn).toFixed(1);
  const ceyreklik = {}, yillik = {}, adetQ = {};
  for (const [k, v] of Object.entries(aylik)) { const Q = q(k + '-01'); ceyreklik[Q] = +((ceyreklik[Q] || 0) + v).toFixed(1); yillik[k.slice(0, 4)] = +((yillik[k.slice(0, 4)] || 0) + v).toFixed(1); }
  for (const it of items) adetQ[q(it.t)] = (adetQ[q(it.t)] || 0) + 1;
  const sonAy = Object.keys(aylik).sort().pop(); const sonIt = items[items.length - 1];
  const onceki = D.seriler.asels_kap_siparis;
  if (onceki && onceki.son && onceki.son.tarih > sonIt.t) { raporlar.push('### ASELSAN sözleşme akışı (§467) — ⚠ liste geriledi (' + onceki.son.tarih + '→' + sonIt.t + '), yazılmadı'); return; }
  D.seriler.asels_kap_siparis = Object.assign({}, onceki || {}, {
    ad: 'ASELSAN açıklanan sözleşmeler — KAP, çeyrek TOPLAMI (mn $)', birim: 'mn $', siklik: 'aylik', akis: true, hisse: ['ASELS'],
    kaynak: 'aselsan.com KAP açıklamaları (webapi) · kur ' + kurYolu, aylik, ceyreklik, yillik, adet_ceyrek: adetQ,
    son: { tarih: sonIt.t, deger: sonIt.usd_mn, ay: sonAy, ay_toplam: aylik[sonAy] }, guncelleme: bugun, n: items.length,   /* son = son açıklanan sözleşme (mn $); ay_toplam = içinde bulunulan ayın toplamı */
    sozlesmeler: items.slice(-12).reverse(), yillik_kum: akisYillik(items, bugun),
    _kapsam: 'KAP eşiği üstü açıklanan sözleşmeler; resmî "yeni iş alımı"nın yaklaşık %45-70\'i (2024: 4,4/6,5 · 2025: 6,4/9,6 · 1Y26: 2,05/4,9 mlr $). Büyük sözleşme akışının öncü göstergesi; seviye değil yön ve y/y okunur.',
  });
  /* resmî bakiye sipariş — tohum (yoksa yaz; varsa elle girilmiş değerleri koru, yenileri ekle) */
  const rb = D.seriler.asels_backlog || { ad: 'ASELSAN resmî bakiye sipariş — backlog (mlr $, çeyrek sonu; elle)', birim: 'mlr $', siklik: 'aylik', hisse: ['ASELS'], aylik: {}, ceyreklik: {} };
  rb.kaynak = ASELS_RESMI.kaynak; rb._not = ASELS_RESMI.not;
  rb.ceyreklik = Object.assign({}, ASELS_RESMI.backlog, rb.ceyreklik || {}); rb.yeni_is = Object.assign({}, ASELS_RESMI.yeni_is, rb.yeni_is || {});
  const rbQ = Object.keys(rb.ceyreklik).sort(); const rbSon = rbQ[rbQ.length - 1]; rb.son = { tarih: rbSon, deger: rb.ceyreklik[rbSon] }; rb.guncelleme = rb.guncelleme || bugun; rb.elle = true;
  D.seriler.asels_backlog = rb;
  D.seriler_guncelleme = bugun;
  await yaz(dosya, D);
  degisenler.push('ASELSAN sözleşme akışı (' + items.length + ')');
  const Qs = Object.keys(ceyreklik).sort(); const sonQ = Qs[Qs.length - 1], oncQ = Qs[Qs.length - 2], gecenQ = Qs[Qs.length - 5];
  const ttm = Qs.slice(-4).reduce((s, k) => s + ceyreklik[k], 0);
  raporlar.push('### ASELSAN sözleşme akışı (§467) — ✓ ' + items.length + ' sözleşme (' + items[0].t + '→' + sonIt.t + ') · kur ' + kurYolu +
    '\n- ' + sonQ + ' (koşu): ' + (ceyreklik[sonQ] / 1000).toFixed(2) + ' mlr $ / ' + (adetQ[sonQ] || 0) + ' sözleşme · ' + oncQ + ': ' + (ceyreklik[oncQ] / 1000).toFixed(2) + ' mlr $' + (gecenQ ? ' · ' + gecenQ + ': ' + (ceyreklik[gecenQ] / 1000).toFixed(2) + ' mlr $' : '') + ' · son 4 çeyrek ' + (ttm / 1000).toFixed(1) + ' mlr $' +
    '\n- son: ' + sonIt.t + ' ' + sonIt.usd_mn + ' mn $ — ' + sonIt.ozet.slice(0, 90) +
    '\n- resmî backlog (elle): ' + Object.entries(rb.ceyreklik).map(([k, v]) => k + ' ' + v).join(' · ') + ' mlr $' +
    (cozulemeyen.length ? '\n- ⚠ çözülemeyen ' + cozulemeyen.length + ': ' + cozulemeyen.slice(0, 2).join(' | ') : ''));
}

/* ── §469 KAP "YENİ İŞ İLİŞKİSİ" AKIŞI — çok şirket (KATMR · ALTNY · GLRMK · ASELS çapraz) ──────────────────────
   Kullanıcı (20 Eki 09:55): "KAP'ta 'Yeni İş İlişkisi' adı altında duyuru geliyordu; biz KAP'ı çözebiliyorduk."
   DOĞRU. ÖLÇÜM (Chrome, kap.org.tr): byCriteria listesi ASELS için 1 Eyl–20 Eki 2026'da 27 kayıt; sözleşmeler
   disclosureClass 'ODA' + subject 'Yeni İş İlişkisi' + summary 'Sözleşme İmzalanması'. Bildirim sayfası (160 KB HTML)
   ÖDA şablonunun yapısal alanlarını taşır: karşı tarafın niteliği, unvanı, satışlardaki payı, başlangıç tarihi, önemli
   koşullar, etki — ama TUTAR yapısal alanda DEĞİL, yalnız "Açıklamalar" (oda_ExplanationTextBlock) serbest metninde.
   Dolayısıyla ayrıştırıcı aynı (aselsCozum, §467); kazanç GENELLİK: aynı yol her şirkete işler.
   NEDEN ASELS için webapi birincil kalıyor: tek JSON'da 2017→ tam metin (283 kayıt, 1 istek); KAP'ta her sözleşme için
   160 KB sayfa çekmek gerekir. KAP burada ÇAPRAZ KONTROL (2025→) ve webapi düşerse yedek.
   ARTIMLI: çözülen bildirimler kimliğiyle (disclosureIndex) dosyada saklanır; her koşu yalnız yeni kimlikleri çeker.
   İlk doldurma koşu başına şirket başına ≤40 sayfa (400 ms ara) → birkaç koşuda tamamlanır; rapor "bekleyen N" yazar.
   DENETİM: liste gelmezse ya da sayfa çözülemezse seri korunur; çözülemeyen bildirim kimliği rapora düşer (şablon değişimi). */
const KAP_YENI_IS = {
  KATMR: { seri: 'kap_yeni_is_katmr', hisse: ['KATMR'], bas: '2023-01-01', ad: 'Katmerciler açıklanan sözleşme/siparişler — KAP Yeni İş İlişkisi, çeyrek toplamı (mn $)' },
  ALTNY: { seri: 'kap_yeni_is_altny', hisse: ['ALTNY'], bas: '2023-01-01', ad: 'Altınay açıklanan sözleşme/siparişler — KAP Yeni İş İlişkisi, çeyrek toplamı (mn $)' },
  GLRMK: { seri: 'kap_yeni_is_glrmk', hisse: ['GLRMK'], bas: '2023-01-01', ad: 'Gülermak açıklanan sözleşmeler — KAP Yeni İş İlişkisi, çeyrek toplamı (mn $)' },
  ASELS: { seri: 'kap_yeni_is_asels', hisse: [], bas: '2025-01-01', ad: 'ASELSAN — KAP Yeni İş İlişkisi (çapraz kontrol; birincil seri asels_kap_siparis)', capraz: 'asels_kap_siparis' },
  /* §545 (26 Eki sürücü denetimi): sipariş/ihale akışı işin yarısı olan şirketler — aynı tarayıcı, ek şirket */
  KARSN: { seri: 'kap_yeni_is_karsn', hisse: ['KARSN'], bas: '2024-01-01', ad: 'Karsan açıklanan sipariş/ihaleler (elektrikli otobüs) — KAP Yeni İş İlişkisi, çeyrek toplamı (mn $)' },
  KBORU: { seri: 'kap_yeni_is_kboru', hisse: ['KBORU'], bas: '2024-01-01', ad: 'Kuzey Boru açıklanan sözleşmeler (DSİ/altyapı) — KAP Yeni İş İlişkisi, çeyrek toplamı (mn $)' },
  TCKRC: { seri: 'kap_yeni_is_tckrc', hisse: ['TCKRC'], bas: '2024-01-01', ad: 'Kıraç Galvaniz açıklanan sözleşmeler (otokorkuluk/GES) — KAP Yeni İş İlişkisi, çeyrek toplamı (mn $)' },
  GESAN: { seri: 'kap_yeni_is_gesan', hisse: ['GESAN'], bas: '2024-01-01', ad: 'Girişim Elektrik açıklanan sözleşmeler — KAP Yeni İş İlişkisi, çeyrek toplamı (mn $)' },
  EUPWR: { seri: 'kap_yeni_is_eupwr', hisse: ['EUPWR'], bas: '2024-01-01', ad: 'Europower açıklanan sözleşmeler — KAP Yeni İş İlişkisi, çeyrek toplamı (mn $)' },
  CWENE: { seri: 'kap_yeni_is_cwene', hisse: ['CWENE'], bas: '2024-01-01', ad: 'CW Enerji açıklanan sözleşmeler (GES) — KAP Yeni İş İlişkisi, çeyrek toplamı (mn $)' },
  NETCD: { seri: 'kap_yeni_is_netcd', hisse: ['NETCD'], bas: '2024-01-01', ad: 'Netcad açıklanan sözleşmeler (kamu/belediye) — KAP Yeni İş İlişkisi, çeyrek toplamı (mn $)' },
};
const KAP_YI_SAYFA_TAVAN = 40, KAP_YI_UYKU = 400;
function kapYiMetin(html) {
  const t = String(html || '').replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/\s+/g, ' ');
  const al = (etiket) => { const i = t.indexOf(etiket); if (i < 0) return ''; const kalan = t.slice(i + etiket.length); const j = kalan.search(/oda_[A-Za-z]+\|/); return (j >= 0 ? kalan.slice(0, j) : kalan.slice(0, 2500)).trim(); };
  const aciklama = al('oda_ExplanationTextBlock|'), kosul = al('oda_IfExistSignificantProvisionsOfTheContractTextBlock|');
  return { aciklama, kosul: /^-*$/.test(kosul) ? '' : kosul, bulundu: !!aciklama };
}
async function kapYeniIs() {
  const dosya = 'sektor-surucu.json';
  if (!(await varMi(dosya))) { raporlar.push('### KAP Yeni İş İlişkisi (§469) — ⏭ sektor-surucu.json yok'); return; }
  const D = await oku(dosya); D.seriler = D.seriler || {};
  const K = D.kap_yeni_is = D.kap_yeni_is || { oid: {}, kayit: {}, cozulemeyen: {} };
  K.oid = K.oid || {}; K.kayit = K.kayit || {}; K.cozulemeyen = K.cozulemeyen || {};
  /* ayrıştırıcı sürümü değişince kayıtlar bir kez yeniden çözülür (eski yanlış tutarlar dosyada kalmasın) */
  const tasinan = [];   /* §473 */
  const KAP_YI_SURUM = '473';   /* §473: atıf+imza alanları için kayıtlar yeniden çözülür (≤40 sayfa/şirket/koşu) */ if (K.surum !== KAP_YI_SURUM) { K.kayit = {}; K.cozulemeyen = {}; K.surum = KAP_YI_SURUM; }
  const H = { 'content-type': 'application/json', 'accept': 'application/json', 'referer': 'https://www.kap.org.tr/tr/bildirim-sorgu', 'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36' };
  const uykuYi = ms => new Promise(r => setTimeout(r, ms));
  /* kur (ASELS katmanıyla aynı yol) */
  let fxUsd = new Map(), fxEur = new Map();
  try { const h = await yahooSeri(['TRY=X', 'EURUSD=X'], '', '10y'); fxUsd = h['TRY=X'] || new Map(); fxEur = h['EURUSD=X'] || new Map(); } catch (e) {}
  if (!fxUsd.size && D.seriler.usdtry) fxUsd = new Map(D.seriler.usdtry.gunluk);
  if (!fxEur.size && D.seriler.eurusd) fxEur = new Map(D.seriler.eurusd.gunluk);
  const fxUsdK = [...fxUsd.keys()].sort(), fxEurK = [...fxEur.keys()].sort();
  const kur = (harita, anahtarlar, tarih, yedek) => { if (harita.size) { let son = null; for (const k of anahtarlar) { if (k <= tarih) son = k; else break; } if (son && (new Date(tarih) - new Date(son)) < 20 * 86400000) return harita.get(son); } const q = tarih.slice(0, 4) + 'Q' + (Math.floor((+tarih.slice(5, 7) - 1) / 3) + 1); return yedek[q] || yedek[Object.keys(yedek).sort().pop()]; };
  const q = d => d.slice(0, 4) + 'Q' + (Math.floor((+d.slice(5, 7) - 1) / 3) + 1);
  const trTarih = s => { const m = String(s || '').match(/^(\d{2})\.(\d{2})\.(\d{4})/); return m ? m[3] + '-' + m[2] + '-' + m[1] : String(s || '').slice(0, 10); };
  const notlar = [], uyari = []; let sayfaSayisi = 0, yeniKayit = 0, bekleyen = 0;
  for (const [kod, t] of Object.entries(KAP_YENI_IS)) {
    try {
      /* 1) üye kimliği */
      if (!K.oid[kod]) {
        const mr = await fetch('https://www.kap.org.tr/tr/api/member/filter/' + encodeURIComponent(kod), { headers: { 'user-agent': H['user-agent'], 'accept': 'application/json', 'referer': H.referer }, signal: AbortSignal.timeout(15000) });
        const mj = await mr.json(); const arr = Array.isArray(mj) ? mj : (mj.items || mj.data || []);
        const uye = arr.find(x => String(x.stockCode || x.code || '').toUpperCase() === kod) || arr[0];
        if (!uye || !uye.mkkMemberOid) { uyari.push(kod + ': KAP üye kimliği bulunamadı'); continue; }
        K.oid[kod] = uye.mkkMemberOid;
      }
      /* 2) liste — artımlı pencere */
      const mevcut = Object.values(K.kayit).filter(x => x.kod === kod);
      let bas = t.bas; if (mevcut.length) { const sonT = mevcut.map(x => x.t).sort().pop(); const d = new Date(sonT + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() - 10); bas = d.toISOString().slice(0, 10); }
      const liste = []; { let p = new Date(bas + 'T00:00:00Z'); const son = new Date(bugun + 'T00:00:00Z');
        while (p <= son) { const e = new Date(p); e.setUTCDate(e.getUTCDate() + 179); const bit = e > son ? son : e;
          const r = await fetch('https://www.kap.org.tr/tr/api/disclosure/members/byCriteria', { method: 'POST', headers: H, body: JSON.stringify({ fromDate: p.toISOString().slice(0, 10), toDate: bit.toISOString().slice(0, 10), mkkMemberOidList: [K.oid[kod]], subjectList: [] }), signal: AbortSignal.timeout(30000) });
          if (!r.ok) throw new Error('byCriteria HTTP ' + r.status);
          const j = await r.json(); const items = (Array.isArray(j) ? j : (j.items || j.data || [])).map(b => b.disclosureBasic || b);
          liste.push(...items); p = new Date(bit); p.setUTCDate(p.getUTCDate() + 1); } }
      /* Türkçe büyük İ: JS /i bayrağı 'İ'≠'i' sayar ("Yeni İş İlişkisi" /yeni iş/i ile EŞLEŞMEZ) → önce TR küçültme */
      const trK = x => String(x || '').replace(/İ/g, 'i').replace(/I/g, 'ı').toLowerCase();
      const sozlesme = liste.filter(b => String(b.disclosureClass || '').toUpperCase() === 'ODA' && (trK(b.subject).includes('yeni iş ilişkisi') || trK(b.subject).includes('ihale süreci') || /sözleşme imzalan|sipariş al|ihale/.test(trK(b.summary))));   /* §473: 'İhale Süreci / Sonucu' konusu da (GLRMK kesinleşme+imza bildirimleri bu konuda; özet 'ihale' demeyebilir) */
      /* 3) yeni kimlikler → sayfa çek, metni çöz (koşu başına tavan) */
      const yeni = sozlesme.filter(b => b.disclosureIndex && !K.kayit[b.disclosureIndex] && !(K.cozulemeyen[b.disclosureIndex] >= 3)).sort((a, b) => trTarih(b.publishDate) < trTarih(a.publishDate) ? -1 : 1);
      let cekilen = 0;
      for (const b of yeni) {
        if (cekilen >= KAP_YI_SAYFA_TAVAN) { bekleyen += 1; continue; }
        cekilen++; sayfaSayisi++;
        try {
          const rh = await fetch('https://www.kap.org.tr/tr/Bildirim/' + b.disclosureIndex, { headers: { 'user-agent': H['user-agent'], 'accept': 'text/html', 'referer': H.referer }, signal: AbortSignal.timeout(20000) });
          const html = await rh.text(); const M = kapYiMetin(html);
          if (!rh.ok || !M.bulundu) { K.cozulemeyen[b.disclosureIndex] = (K.cozulemeyen[b.disclosureIndex] || 0) + 1; uyari.push(kod + ' #' + b.disclosureIndex + ': açıklama alanı yok (HTTP ' + rh.status + ')'); await uykuYi(KAP_YI_UYKU); continue; }
          const metin = (M.aciklama + ' ' + M.kosul).trim().replace(/Yukarıdaki açıklamalarımızın[\s\S]*$/, '').trim();   /* standart beyan paragrafı atılır */
          const tarih = trTarih(b.publishDate);
          /* §469c: (1) "backlog/bakiye sipariş … USD" SEVİYE bildirimidir, sözleşme toplamına girmez — ayrı yakalanır
             (ALTNY 20 Tem 2026: 134,1 mn $ sözleşme + "güncel backlog 334 mn $" → 468 sayılmıştı). (2) "teklif verilmiştir /
             iptal / fesih" metinleri sözleşme DEĞİL (GLRMK ihale teklifleri 14,1 mlr TL booking sayılmıştı) → tutarsız, nedeniyle. */
          const trMetin = trK(metin); const blI = trMetin.search(/backlog|bakiye sipariş|bakiye iş|sipariş bakiyesi/);
          const sozMetin = blI >= 0 ? metin.slice(0, blI) : metin, blMetin = blI >= 0 ? metin.slice(blI) : '';
          const imza = /imzalan|imzaladı|imzalam|sipariş al|uhdesinde|sözleşmeye bağlan|kesinleş|sipariş onay|anlaşma sağlan|sözleşme yapıl/.test(trK(sozMetin));
          const olumsuz = /teklif ver|teklif sun|iptal|fesih|fesh|ihale süreci|değerlendirme aşaması|askıya/.test(trK(sozMetin));
          let { tutar, adet } = aselsCozum(sozMetin); let neden = null;
          if (olumsuz && !imza) { neden = 'teklif/iptal — sözleşme değil'; adet = 0; }
          const u = kur(fxUsd, fxUsdK, tarih, ASELS_KUR_YEDEK.usdtry), e = kur(fxEur, fxEurK, tarih, ASELS_KUR_YEDEK.eurusd);
          let backlogMn = null; if (blMetin) { const rb = aselsCozum(blMetin); if (rb.adet) backlogMn = +((rb.tutar.USD + rb.tutar.EUR * e + rb.tutar.TL / u + (rb.tutar.GBP || 0) * ASELS_PB_YAKLASIK.GBP + (rb.tutar.PLN || 0) / ASELS_PB_YAKLASIK.PLN_EUR * e) / 1e6).toFixed(1); }
          const kayit = { kod, t: tarih, ozet: metin.slice(0, 160), baslik: String(b.summary || '').trim().slice(0, 60) };
          /* §473: "DD.MM.YYYY tarihli (özel durum) açıklamamıza istinaden … sözleşme imzalanmıştır" — önceki bildirime atıf; imza bildirimi
             çoğu kez tutar yazmaz (GLRMK 12 Mar 2026 → 31 Eki 2025). Atıf tarihi ve imza bayrağı saklanır, seri kurulmadan önce tutar taşınır. */
          const atifM = trMetin.match(/(\d{2})[.\/](\d{2})[.\/](\d{4})\s*(?:ve\s*\d{2}[.\/]\d{2}[.\/]\d{4}\s*)?tarihli\s*(?:özel\s*durum\s*)?açıklama/);
          if (atifM) { kayit.atif = atifM[3] + '-' + atifM[2] + '-' + atifM[1]; kayit.imza = imza && !olumsuz; }
          if (!adet) Object.assign(kayit, { usd_mn: 0, usd: 0, eur: 0, tl: 0, tutarsiz: true, neden: neden || 'tutar açıklanmadı' });
          else Object.assign(kayit, { usd_mn: +((tutar.USD + tutar.EUR * e + tutar.TL / u + (tutar.GBP || 0) * ASELS_PB_YAKLASIK.GBP + (tutar.PLN || 0) / ASELS_PB_YAKLASIK.PLN_EUR * e) / 1e6).toFixed(1), kur_yaklasik: !!(tutar.GBP || tutar.PLN) || undefined, usd: +(tutar.USD / 1e6).toFixed(2), eur: +(tutar.EUR / 1e6).toFixed(2), tl: +(tutar.TL / 1e6).toFixed(1) });
          if (backlogMn != null) kayit.backlog_usd_mn = backlogMn;
          /* §469e (GLRMK 10 Tem 2025: "Budimex–Budimex Kolejnictwo–Gülermak konsorsiyumu … 2,08 mlr PLN … kesinleşen ihale sonucu"):
             konsorsiyum/iş ortaklığı toplamı, şirket payı belirtilmemişse TAM sayılır ama işaretlenir — panelde görünür */
          if (adet && /konsorsiyum|iş ortaklığı|ortak girişim|joint venture|ortaklığı altında/.test(trK(sozMetin)) && !/pay[ıi]\s*(?:ise|olan|olarak|%|\d)/.test(trK(sozMetin))) kayit.konsorsiyum = true;
          K.kayit[b.disclosureIndex] = kayit;
          yeniKayit++;
        } catch (e) { K.cozulemeyen[b.disclosureIndex] = (K.cozulemeyen[b.disclosureIndex] || 0) + 1; uyari.push(kod + ' #' + b.disclosureIndex + ': ' + String(e && e.message || e).slice(0, 60)); }
        await uykuYi(KAP_YI_UYKU);
      }
      /* §473: ihale kesinleşmesi (tutarlı, önceki) + atıflı imza bildirimi (tutarsız, sonraki) → tutar İMZA tarihine taşınır. Sözleşme akışı
         backlog'a imzada girer (ASELS ile aynı olay tanımı); taşınmazsa kesinleşme yılı şişer, imza yılı "−100%" görünür (GLRMK 2025/2026).
         Taşıma idempotent: hedef `tasindi_kaynak`, kaynak `tasindi_hedef` ile işaretlenir; tutarı olan imza bildirimi (ek sipariş) dokunulmaz. */
      for (const x of Object.values(K.kayit).filter(x => x.kod === kod && x.atif && x.imza && x.tutarsiz && !x.tasindi_kaynak)) {
        const ref = Object.values(K.kayit).find(r => r.kod === kod && r.t === x.atif && r.usd_mn > 0 && !r.tasindi_hedef && r.t < x.t);
        if (!ref) continue;
        Object.assign(x, { usd_mn: ref.usd_mn, usd: ref.usd, eur: ref.eur, tl: ref.tl, tutarsiz: false, neden: undefined, konsorsiyum: ref.konsorsiyum, kur_yaklasik: ref.kur_yaklasik, tasindi_kaynak: ref.t });
        Object.assign(ref, { usd_mn: 0, usd: 0, eur: 0, tl: 0, tutarsiz: true, neden: 'ihale kesinleşmesi — tutar imza bildirimine taşındı (' + x.t + ')', tasindi_hedef: x.t });
        tasinan.push(kod + ' ' + ref.t + ' → ' + x.t + ' (' + x.usd_mn + ' mn $)');
      }
      /* 4) seri: aylık/çeyreklik/yıllık toplam (tutarsız bildirimler 0 — sayı ayrı tutulur) */
      const kayitlar = Object.values(K.kayit).filter(x => x.kod === kod).sort((a, b) => a.t < b.t ? -1 : 1);
      if (!kayitlar.length) { notlar.push(kod + ': bildirim yok (' + sozlesme.length + ' listede' + (yeni.length ? ', ' + yeni.length + ' bekliyor' : '') + ')'); continue; }
      const aylik = {}; { let y = +t.bas.slice(0, 4), m = +t.bas.slice(5, 7); const son = bugun.slice(0, 7); while (true) { const k = y + '-' + String(m).padStart(2, '0'); aylik[k] = 0; if (k >= son) break; m++; if (m > 12) { m = 1; y++; } } }
      for (const x of kayitlar) aylik[x.t.slice(0, 7)] = +((aylik[x.t.slice(0, 7)] || 0) + x.usd_mn).toFixed(1);
      const ceyreklik = {}, yillik = {}, adetQ = {}, tutarsizQ = {};
      for (const [k, v] of Object.entries(aylik)) { const Q = q(k + '-01'); ceyreklik[Q] = +((ceyreklik[Q] || 0) + v).toFixed(1); yillik[k.slice(0, 4)] = +((yillik[k.slice(0, 4)] || 0) + v).toFixed(1); }
      for (const x of kayitlar) { adetQ[q(x.t)] = (adetQ[q(x.t)] || 0) + 1; if (x.tutarsiz) tutarsizQ[q(x.t)] = (tutarsizQ[q(x.t)] || 0) + 1; }
      const sonX = kayitlar[kayitlar.length - 1];
      /* §469c: açıklamalarda beyan edilen backlog seviyesi (ALTNY) → ayrı seviye serisi (seyrek aylık nokta) */
      const blNokta = kayitlar.filter(x => x.backlog_usd_mn != null);
      if (blNokta.length && t.hisse.length) { const ba = {}; for (const x of blNokta) ba[x.t.slice(0, 7)] = x.backlog_usd_mn; const bk = Object.keys(ba).sort(); const bs = bk[bk.length - 1]; D.seriler['kap_backlog_' + kod.toLowerCase()] = Object.assign({}, D.seriler['kap_backlog_' + kod.toLowerCase()] || {}, { ad: kod + ' beyan edilen backlog — KAP açıklamalarından (mn $)', birim: 'mn $', siklik: 'aylik', hisse: t.hisse, kaynak: 'KAP ÖDA metni ("güncel backlog … USD") · kur Yahoo', aylik: ba, ceyreklik: {}, son: { tarih: bs, deger: ba[bs] }, guncelleme: bugun, n: blNokta.length, _not: 'Şirketin açıklama metninde beyan ettiği bakiye sipariş; seyrek (yalnız bahsedilen aylar).' }); }
      if (t.hisse.length || !t.capraz) {
        D.seriler[t.seri] = Object.assign({}, D.seriler[t.seri] || {}, { ad: t.ad, birim: 'mn $', siklik: 'aylik', akis: true, hisse: t.hisse, kaynak: 'KAP ÖDA "Yeni İş İlişkisi" (kap.org.tr) · kur Yahoo', aylik, ceyreklik, yillik, adet_ceyrek: adetQ, tutarsiz_ceyrek: tutarsizQ, son: { tarih: sonX.t, deger: sonX.usd_mn, ay: sonX.t.slice(0, 7) }, guncelleme: bugun, n: kayitlar.length, sozlesmeler: kayitlar.slice(-12).reverse().map(x => ({ t: x.t, tur: 'yeni', usd_mn: x.usd_mn, usd: x.usd, eur: x.eur, tl: x.tl, ozet: x.ozet + (x.tutarsiz ? ' [' + (x.neden || 'tutar açıklanmadı') + ']' : '') + (x.konsorsiyum ? ' [konsorsiyum toplamı — şirket payı belirtilmedi]' : '') + (x.tasindi_kaynak ? ' [tutar ' + x.tasindi_kaynak + ' ihale kesinleşmesinden taşındı]' : '') + (x.kur_yaklasik ? ' [kur yaklaşık]' : '') + (x.backlog_usd_mn != null ? ' [backlog ' + x.backlog_usd_mn + ' mn $]' : '') })), yillik_kum: akisYillik(kayitlar, bugun), _kapsam: 'KAP ÖDA "Yeni İş İlişkisi" bildirimleri; tutarı açıklanmayan ya da teklif/iptal niteliğindeki bildirimler 0 sayılır (adet ayrı). Konsorsiyum toplamları şirket payı belirtilmemişse TAM sayılır ve işaretlenir. PLN/GBP kur yaklaşık. Metinde beyan edilen backlog ayrı seviye serisidir. Öncü gösterge; seviye değil yön/y/y okunur.' });
      } else { D.seriler[t.seri] = Object.assign({}, D.seriler[t.seri] || {}, { ad: t.ad, birim: 'mn $', siklik: 'aylik', akis: true, hisse: [], kaynak: 'KAP ÖDA Yeni İş İlişkisi (çapraz)', aylik, ceyreklik, yillik, son: { tarih: sonX.t, deger: sonX.usd_mn }, guncelleme: bugun, n: kayitlar.length, gizli: true }); }
      const Qs = Object.keys(ceyreklik).sort(); const sonQ = Qs[Qs.length - 1], oncQ = Qs[Qs.length - 2];
      let capraz = '';
      if (t.capraz && D.seriler[t.capraz] && D.seriler[t.capraz].ceyreklik) { const Qt = oncQ; const a = ceyreklik[Qt], b = D.seriler[t.capraz].ceyreklik[Qt]; if (a != null && b != null) capraz = ' · çapraz ' + Qt + ': KAP ' + (a / 1000).toFixed(2) + ' / webapi ' + (b / 1000).toFixed(2) + ' mlr $' + (Math.abs(a - b) <= Math.max(50, b * 0.05) ? ' ✓' : ' ⚠ fark'); }
      notlar.push(kod + ': ' + kayitlar.length + ' bildirim · ' + sonQ + ' ' + (ceyreklik[sonQ] / 1000).toFixed(2) + ' mlr $ (' + (adetQ[sonQ] || 0) + ')' + (oncQ ? ' · ' + oncQ + ' ' + (ceyreklik[oncQ] / 1000).toFixed(2) : '') + (yeni.length > cekilen ? ' · bekleyen ' + (yeni.length - cekilen) : '') + capraz);
    } catch (e) { uyari.push(kod + ': ' + String(e && e.message || e).slice(0, 100)); }
  }
  if (!notlar.length) { raporlar.push('### KAP Yeni İş İlişkisi (§469) — ✗ hiçbir şirket gelmedi\n- ' + uyari.join('\n- ')); return; }
  D.seriler_guncelleme = bugun;
  await yaz(dosya, D);
  if (yeniKayit) degisenler.push('KAP yeni iş (' + yeniKayit + ' bildirim)');
  raporlar.push('### KAP Yeni İş İlişkisi (§469) — ✓ ' + Object.keys(K.kayit).length + ' bildirim kayıtlı · bu koşu ' + sayfaSayisi + ' sayfa, ' + yeniKayit + ' yeni' + (bekleyen ? ' · tavan: ' + bekleyen + ' bekliyor (sonraki koşu)' : '') + '\n- ' + notlar.join('\n- ') + (tasinan.length ? '\n- §473 imzaya taşınan tutar: ' + tasinan.join(' · ') : '') + (uyari.length ? '\n- ⚠ ' + uyari.slice(0, 6).join('\n- ⚠ ') : ''));
}

/* ── §472 KARDEMİR LİSTE FİYATLARI + HURDA ALIM FİYATLARI (kardemir.com açık API) ─────────────────────────────────────
   Çıkış noktası (20 Eki 11:39): kullanıcı SteelOrbis'i sordu. Türkiye hurda/kütük/inşaat demiri serileri orada var ama
   SEVİYE ücretli ("xxx"), ücretsiz üyelikte yalnız % değişim; sayfa girişli + bot engelli → Actions için uygun değil.
   Aranırken bulundu: Kardemir KENDİ liste fiyatlarını ve hurda alım fiyatlarını açık JSON uçlarıyla, 2014'ten beri
   TARİHÇELİ yayımlıyor (Chrome'da 20 Eki ölçüldü; çerez gerekmiyor, `Dil: 1` başlığı ŞART — yoksa HTTP 500):
     GET /api/SatisPazarlamaapi/getpriceremarkdatelist          → ["13/10/2026","16/09/2026",…] 482 liste tarihi (07/01/2014→)
     GET /api/SatisPazarlamaapi/getpricelist?date=dd/mm/yyyy      → [[{date, isLiveUpdateDate, allproduct:[{product, productdata:[{name, price, currency}]}]}]]
         Ürünler: KÜTÜK · NERVÜRLÜ · KANGAL · PROFİL · DÜZ YUVARLAK · PLATİNA · KÖŞEBENT · MADEN DİREĞİ · PİK …
         O gün SATIŞA AÇILMAYAN ürünün productdata[] boş gelir → her liste tarihi yalnız açılan ürünleri taşır.
         Para birimi yıllara göre değişir: kütük 2014–15 " US$", 2015/06–2021/06 "TL", 2021/09→ "USD"; nervürlü hep TL; profil 2014–15 EUR,
         2016–21 TL, sonra USD (Chrome'da 482 tarihin tamamı tarandı: çözücü hiçbir dolu ürünü kaçırmadı).
         Ürün adları da değişti: kütük "130X130X6-12 M. (S235JR)" (2014–20) → "150X150 S235JR" (2021→); nervürlü
         "Ø 18-20-22-25-28-32 mm." (2014) → "Ø 12-32 mm." (2018→); profil "IPE - NPI - NPU (180 - 200) (Std.)".
     GET /api/TedarikciIliskileriapi/getscrappricemarkdatelist   → 347 tarih (11/02/2014→)
     GET /api/TedarikciIliskileriapi/getscrapprice?date=…        → {date, content:HTML} "Özel Ekstra: 20 .120 TL/Ton · DKP Hurda: 20.100 ·
         Ekstra: 19.850 · 1. Sınıf: 19.300 · 2. Sınıf: 19.000 · Büyük Parça İskontosu: 1.250" — 2014 metni HTML varlıklı
         (&Ouml;zel), sayı içinde boşluk olabilir ("20 .120"), "Ekstra" sınıfı yalnız 2026-09'dan beri var → başlık
         sınıfı ÖZEL EKSTRA (2014'ten beri kesintisiz).
   Bu KRDMD için vekil değil, şirketin kendi gerçekleşen liste fiyatı ve kendi hurda maliyeti. Kardemir YÜKSEK FIRIN
   (BOF) üreticisidir: ana ham madde cevher + kok, hurda şarjın küçük kısmı → "kütük − hurda" yurt içi metal marjının
   gerçek ölçüsü ama Kardemir'in asıl makası "kütük − cevher(1,6 t) − kok(0,7 t)"; kok serisi yok → kısmi spread.
   KCAER kütük alıp profil haddeler → Kardemir profil − kütük = haddeleme spread'i (ikisi de aynı listeden, tutarlı).
   YÖNTEM: liste fiyatı bir sonraki listeye kadar geçerli sayılır (adım fonksiyonu, takvim günü ileri taşıma); TL fiyat
   günün kuruyla $'a çevrilir (TL sabitken kur yükseldikçe $ değeri erir — gerçek davranış); günlük adımların AY
   ORTALAMASI saklanır (siklik 'aylik', ~150 nokta/seri; dosya şişmez), `son` = son liste adımı, `adimlar` son 12 adım.
   ARTIMLI: çözülen tarihler D.kardemir.liste / .hurda içinde (kısa anahtar); koşu başına ≤100 liste + ≤100 hurda
   sayfası (250 ms ara, yeniden eskiye) → 2014'e kadar ~5 koşu. Hatalı sayfa 3 denemeden sonra bırakılır.
   KARDEMIR_SURUM değişirse kayıt sıfırlanır (çözücü değişince yeniden çekilir). Tarih listesi gelmezse dosya dokunulmaz.
   DENETİM: aralık dışı fiyat atlanır (kütük 200–2.000 $, nervürlü/profil 200–2.000 $, hurda 50–1.500 $); seri `son`
   tarihi geriye gidemez (gerileme korunur, uyarı yazılır). */
const KARDEMIR_API = 'https://www.kardemir.com/api/';
const KARDEMIR_H = { 'Dil': '1', 'Accept': 'application/json, text/plain, */*', 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36', 'Referer': 'https://www.kardemir.com/fiyat_listesi', 'Accept-Language': 'tr-TR,tr;q=0.9' };
const KARDEMIR_SURUM = '472', KARDEMIR_TAVAN = 100, KARDEMIR_UYKU = 250, KARDEMIR_DENEME = 3;
const KARDEMIR_KUR_ESKI = { '2013': 1.90, '2014': 2.19, '2015': 2.72, '2016': 3.02 };   /* yıllık ort. USD/TRY — Yahoo da yedek tablo da yoksa */
const KARDEMIR_EURUSD_ESKI = { '2013': 1.33, '2014': 1.33, '2015': 1.11, '2016': 1.11 };   /* yıllık ort. EUR/USD — 2014–15 profil listesi EUR fiyatlıydı */
const KARDEMIR_ENT = { Ouml: 'Ö', ouml: 'ö', Ccedil: 'Ç', ccedil: 'ç', Uuml: 'Ü', uuml: 'ü', Iuml: 'Ï', nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
const kardemirHtml = s => String(s || '').replace(/&#x([0-9a-f]+);/gi, (m, h) => String.fromCharCode(parseInt(h, 16))).replace(/&#(\d+);/g, (m, n) => String.fromCharCode(+n)).replace(/&([a-zA-Z]+);/g, (m, n) => KARDEMIR_ENT[n] || m);
const kardemirIso = d => { const m = String(d || '').match(/(\d{2})[./](\d{2})[./](\d{4})/); return m ? m[3] + '-' + m[2] + '-' + m[1] : null; };
const kardemirGun = t => t.slice(8, 10) + '/' + t.slice(5, 7) + '/' + t.slice(0, 4);   /* ISO → dd/mm/yyyy (API biçimi) */
const kardemirSayi = s => { s = String(s || '').replace(/\s/g, ''); if (/,\d{1,2}$/.test(s)) s = s.replace(/\./g, '').replace(',', '.'); else s = s.replace(/[.,](?=\d{3}(\D|$))/g, ''); const v = parseFloat(s); return isFinite(v) ? v : null; };
const kardemirPB = s => { s = String(s || '').toUpperCase().replace(/\s/g, ''); if (/US\$|USD|\$/.test(s)) return 'USD'; if (/EUR|€/.test(s)) return 'EUR'; if (/TL|TRY|₺/.test(s)) return 'TL'; return s || '?'; };
function kardemirListeCoz(j) {
  const L = Array.isArray(j) ? (Array.isArray(j[0]) ? j[0][0] : j[0]) : j;
  if (!L || !Array.isArray(L.allproduct)) return null;
  const bul = (urunRe, secici) => { const p = L.allproduct.find(x => urunRe.test(String(x.product || '').trim())); if (!p || !Array.isArray(p.productdata)) return null; const it = p.productdata.find(x => secici(String(x.name || '').replace(/\s+/g, ' ').trim())); return it && +it.price > 0 ? { f: +it.price, pb: kardemirPB(it.currency) } : null; };
  const o = {};
  const k = bul(/^KÜTÜK/i, n => /S235/i.test(n)); if (k) o.k = k;                                   /* kütük 150×150 (eski 130×130) S235JR */
  const kb = bul(/^KÜTÜK/i, n => /B420/i.test(n)); if (kb) o.kb = kb;                               /* kütük B420 (inşaat demiri kalitesi) */
  const n = bul(/^NERVÜRLÜ/i, x => /^Ø/.test(x) && /-\s*32\b/.test(x) && !/muh/i.test(x)) || bul(/^NERVÜRLÜ/i, x => /-\s*32\b/.test(x) && !/muh/i.test(x)); if (n) o.n = n;   /* Ø12-32 (2014: Ø18-…-32); "Muhtelif boy" hariç */
  const p = bul(/^PROF/i, x => /IPE/i.test(x) && /180\s*-\s*200/.test(x)) || bul(/^PROF/i, x => /IPE/i.test(x)); if (p) o.p = p;   /* IPE/NPI/NPU 180-200 Std */
  const f = bul(/^KANGAL|^F[İI]LMA/i, x => /5[.,]5/.test(x) && /SAE[^)]*1008/i.test(x)) || bul(/^KANGAL|^F[İI]LMA/i, x => /SAE[^)]*1008/i.test(x)); if (f) o.f = f;   /* filmaşin Ø5.5 SAE1008 (2016: "SAE 1006-1008-1010") */
  return Object.keys(o).length ? o : { bos: 1 };
}
function kardemirHurdaCoz(j) {
  const t = kardemirHtml(String((j && j.content) || '')).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const re = /(Özel Ekstra|Özel Extra|DKP Hurda|DKP|Ekstra|Extra|1\. ?S[ıi]n[ıi]f|2\. ?S[ıi]n[ıi]f|Büyük Parça İskontosu)\s*:\s*([\d][\d .,]*\d|\d)/g;
  const ad = { 'Özel Ekstra': 'oe', 'Özel Extra': 'oe', 'DKP Hurda': 'dkp', 'DKP': 'dkp', 'Ekstra': 'ek', 'Extra': 'ek', 'Büyük Parça İskontosu': 'bp' };   /* 2015 metinlerinde "Extra" yazımı */
  const o = {}; let m;
  while ((m = re.exec(t))) { const key = ad[m[1]] || (/^1/.test(m[1]) ? 's1' : 's2'); const v = kardemirSayi(m[2]); if (v != null && o[key] == null) o[key] = v; }
  return Object.keys(o).length ? o : { bos: 1 };
}
async function kardemirFiyat() {
  const dosya = 'sektor-surucu.json';
  if (!(await varMi(dosya))) { raporlar.push('### Kardemir fiyatları (§472) — ⏭ sektor-surucu.json yok'); return; }
  const D = await oku(dosya); D.seriler = D.seriler || {};
  let K = D.kardemir;
  if (!K || K.surum !== KARDEMIR_SURUM) K = D.kardemir = { surum: KARDEMIR_SURUM, liste: {}, hurda: {}, _not: 'kardemir.com açık API kayıtları — liste: k kütük S235JR, kb kütük B420, n nervürlü Ø12-32, p profil IPE 180-200, f filmaşin Ø5.5 ({f fiyat, pb para birimi}); hurda: oe Özel Ekstra, dkp, ek Ekstra, s1/s2 sınıf, bp büyük parça iskontosu (TL/t). bos: o gün ilgili ürün yok; hata: deneme sayısı' };
  const uyku = ms => new Promise(r => setTimeout(r, ms));
  const getJ = async yol => { const r = await fetch(KARDEMIR_API + yol, { headers: KARDEMIR_H, signal: AbortSignal.timeout(20000) }); if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + yol.split('?')[0] + (r.status === 403 ? ' (erişim engeli — Actions IP?)' : r.status === 500 ? ' (Dil başlığı reddedildi?)' : '')); return r.json(); };
  const notlar = [], uyari = []; let sayfa = 0, yeni = 0, bekleyen = 0;
  const cek = async (listeYolu, sayfaYolu, kayit, cozucu, etiket) => {
    try {
      const ham = await getJ(listeYolu);
      const tarihler = (Array.isArray(ham) ? ham : []).map(kardemirIso).filter(Boolean).sort().reverse();
      if (!tarihler.length) throw new Error('tarih listesi boş');
      const eksik = tarihler.filter(t => !kayit[t] || (kayit[t].hata && kayit[t].hata < KARDEMIR_DENEME)); let n = 0;
      for (const t of eksik) {
        if (n >= KARDEMIR_TAVAN) { bekleyen++; continue; }
        try { const c = cozucu(await getJ(sayfaYolu + encodeURIComponent(kardemirGun(t)))); kayit[t] = c || { bos: 1 }; yeni++; }
        catch (e) { kayit[t] = { hata: ((kayit[t] && kayit[t].hata) || 0) + 1 }; uyari.push(etiket + ' ' + t + ': ' + String(e && e.message || e).slice(0, 70)); }
        n++; sayfa++; await uyku(KARDEMIR_UYKU);
      }
      notlar.push(etiket + ' ' + tarihler.length + ' tarih (' + tarihler[tarihler.length - 1] + '→' + tarihler[0] + ') · dosyada ' + Object.keys(kayit).length);
      return true;
    } catch (e) { uyari.push(etiket + ': ' + String(e && e.message || e).slice(0, 120)); return false; }
  };
  const l1 = await cek('SatisPazarlamaapi/getpriceremarkdatelist', 'SatisPazarlamaapi/getpricelist?date=', K.liste, kardemirListeCoz, 'liste');
  const l2 = await cek('TedarikciIliskileriapi/getscrappricemarkdatelist', 'TedarikciIliskileriapi/getscrapprice?date=', K.hurda, kardemirHurdaCoz, 'hurda');
  const dolu = o => Object.values(o).filter(v => v && !v.bos && !v.hata).length;
  if (!dolu(K.liste) && !dolu(K.hurda)) { raporlar.push('### Kardemir fiyatları (§472) — ✗ veri yok' + (l1 || l2 ? ' (tarih listesi geldi, sayfalar çözülemedi)' : ' (kardemir.com\'a ulaşılamadı)') + '\n- ' + uyari.slice(0, 6).join('\n- ')); if (l1 || l2) await yaz(dosya, D); return; }
  /* kur: Yahoo TRY=X / EURUSD=X — '10y' GÜNLÜK (2016-10→) + 'max' (Yahoo max'ı sessizce 1mo granülerliğe indirir: ay başı tek nokta,
     2005→; §472b — ilk canlı koşuda "kur noktası 764" bunu açığa çıkardı) → dosyadaki usdtry/eurusd günlük → çeyrek yedek tablo → yıllık eski tablo.
     Sıra: günlük nokta (≤15 gün) → aynı ayın ay başı noktası → çeyrek ortalaması → yıllık ortalama. */
  let fx = new Map(), fxE = new Map(), fxAy = new Map(), fxEAy = new Map();
  try { const h = await yahooSeri(['TRY=X', 'EURUSD=X'], '', '10y'); fx = h['TRY=X'] || new Map(); fxE = h['EURUSD=X'] || new Map(); } catch (e) {}
  try { const h = await yahooSeri(['TRY=X', 'EURUSD=X'], '', 'max'); fxAy = h['TRY=X'] || new Map(); fxEAy = h['EURUSD=X'] || new Map(); } catch (e) {}
  if (D.seriler.usdtry && Array.isArray(D.seriler.usdtry.gunluk)) for (const [t, v] of D.seriler.usdtry.gunluk) if (typeof v === 'number' && !fx.has(t)) fx.set(t, v);
  if (D.seriler.eurusd && Array.isArray(D.seriler.eurusd.gunluk)) for (const [t, v] of D.seriler.eurusd.gunluk) if (typeof v === 'number' && !fxE.has(t)) fxE.set(t, v);
  const sonNokta = (ks, vs, t) => { let lo = 0, hi = ks.length - 1, r = -1; while (lo <= hi) { const m = (lo + hi) >> 1; if (ks[m] <= t) { r = m; lo = m + 1; } else hi = m - 1; } return r; };
  const kurYap = (gunluk, aylik, yedekQ, yedekYil) => { const gk = [...gunluk.keys()].sort(), gv = gk.map(k => gunluk.get(k)), ak = [...aylik.keys()].sort(), av = ak.map(k => aylik.get(k)); return t => {
    const r = sonNokta(gk, gv, t); if (r >= 0 && (new Date(t) - new Date(gk[r])) < 15 * 864e5) return gv[r];
    const ra = sonNokta(ak, av, t); if (ra >= 0 && ak[ra].slice(0, 7) === t.slice(0, 7)) return av[ra];
    const q = t.slice(0, 4) + 'Q' + (Math.floor((+t.slice(5, 7) - 1) / 3) + 1); return (yedekQ[q] || yedekYil[t.slice(0, 4)] || null); }; };
  const kur = kurYap(fx, fxAy, ASELS_KUR_YEDEK.usdtry, KARDEMIR_KUR_ESKI), kurE = kurYap(fxE, fxEAy, ASELS_KUR_YEDEK.eurusd, KARDEMIR_EURUSD_ESKI);
  const kurNot = 'kur: günlük ' + fx.size + ' · ay başı ' + fxAy.size + (fx.size < 2000 ? ' ⚠ Yahoo 10y günlük gelmedi (2016–2023 dönüşümleri ay başı/çeyrek kuruyla)' : '');
  const cevir = (f, pb, hedef, t) => { if (pb === hedef) return f; if (pb === 'EUR') { const e = kurE(t); if (!e) return null; f = f * e; pb = 'USD'; if (pb === hedef) return f; } const k = kur(t); if (!k) return null; if (pb === 'TL' && hedef === 'USD') return f / k; if (pb === 'USD' && hedef === 'TL') return f * k; return null; };
  /* adım noktaları → günlük ileri taşıma → ay ortalaması */
  const noktalar = (kayit, alan) => Object.entries(kayit).filter(([t, v]) => v && v[alan] && typeof v[alan].f === 'number').map(([t, v]) => [t, v[alan].f, v[alan].pb]).sort((a, b) => a[0] < b[0] ? -1 : 1);
  const gunlukAdim = (nokta, hedefPB, aralik) => { const out = new Map(); if (!nokta.length) return out; let i = 0, cur = null;
    for (let d = new Date(nokta[0][0] + 'T00:00:00Z'), son = new Date(bugun + 'T00:00:00Z'); d <= son; d.setUTCDate(d.getUTCDate() + 1)) { const t = d.toISOString().slice(0, 10); while (i < nokta.length && nokta[i][0] <= t) { cur = nokta[i]; i++; } if (!cur) continue; const v = cevir(cur[1], cur[2], hedefPB, t); if (v == null || !(v >= aralik[0] && v <= aralik[1])) continue; out.set(t, v); }
    return out; };
  const aylikOrt = g => { const top = {}, say = {}; for (const [t, v] of g) { const a = t.slice(0, 7); top[a] = (top[a] || 0) + v; say[a] = (say[a] || 0) + 1; } const o = {}; for (const a of Object.keys(top).sort()) o[a] = +(top[a] / say[a]).toFixed(2); return o; };
  const seriYaz = (anahtar, meta, nokta, hedefPB, aralik) => {
    const g = gunlukAdim(nokta, hedefPB, aralik); if (!g.size) return null;
    const aylik = aylikOrt(g); const sonN = nokta[nokta.length - 1]; let sonV = cevir(sonN[1], sonN[2], hedefPB, sonN[0]); if (sonV == null) sonV = [...g.values()].pop();
    const onceki = D.seriler[anahtar];
    if (onceki && onceki.son && onceki.son.tarih > sonN[0]) { uyari.push(anahtar + ': gerileme korundu (dosya ' + onceki.son.tarih + ' > yeni ' + sonN[0] + ')'); return onceki.son; }
    D.seriler[anahtar] = Object.assign({}, onceki || {}, meta, { siklik: 'aylik', aylik, son: { tarih: sonN[0], deger: +sonV.toFixed(2), orijinal: sonN[1] + ' ' + sonN[2] }, adimlar: nokta.slice(-12).reverse(), ilk: nokta[0][0], guncelleme: bugun });
    return D.seriler[anahtar].son;
  };
  const KAYNAK = 'kardemir.com açık API (Actions §472) · liste bir sonraki listeye kadar geçerli (adım) · ay ortalaması';
  const kutukN = noktalar(K.liste, 'k'), nervN = noktalar(K.liste, 'n'), profN = noktalar(K.liste, 'p'), filmN = noktalar(K.liste, 'f'), hurdaN = Object.entries(K.hurda).filter(([t, v]) => v && typeof v.oe === 'number' && v.oe >= 0.9 * (v.dkp || 0) && v.oe >= (v.s1 || 0)).map(([t, v]) => [t, v.oe, 'TL']).sort((a, b) => a[0] < b[0] ? -1 : 1);   /* kaynak yazım hatası (25.03.2015 "80 TL" — 800 olmalı): Özel Ekstra DKP'nin ve 1. sınıfın altında kalamaz → nokta atlanır, önceki adım sürer */
  const sK = seriYaz('kardemir_kutuk_usd', { ad: 'Kardemir kütük liste fiyatı — 150×150 S235JR ($/t, KDV hariç)', birim: '$/t', hisse: ['KRDMD', 'KCAER'], kaynak: KAYNAK + ' · 2016–2021 TL liste günün kuruyla', _not: 'Şirketin kendi liste fiyatı; satışa açılan günlerde yayımlanır (yılda 3–12 kez), bir sonraki listeye kadar geçerli sayılır. 2014–2020 ürün adı 130X130 S235JR.' }, kutukN, 'USD', [200, 2000]);
  const sN = seriYaz('kardemir_nervurlu_tl', { ad: 'Kardemir inşaat demiri liste fiyatı — Ø12-32 (TL/t, KDV hariç)', birim: 'TL/t', hisse: ['KRDMD'], kaynak: KAYNAK }, nervN, 'TL', [500, 500000]);
  const sNu = seriYaz('kardemir_nervurlu_usd', { ad: 'Kardemir inşaat demiri liste fiyatı — Ø12-32 ($/t, günün kuruyla)', birim: '$/t', hisse: ['KRDMD'], kaynak: KAYNAK + ' · TL liste ÷ USD/TRY (Yahoo)', _not: 'TL liste sabitken kur yükseldikçe $ karşılığı erir; LME "inşaat demiri FOB Türkiye" ile aynı birimde kıyaslanır (yurt içi liste ≠ ihracat FOB).' }, nervN, 'USD', [200, 2000]);
  const sP = seriYaz('kardemir_profil_usd', { ad: 'Kardemir profil liste fiyatı — IPE/NPI/NPU 180-200 Std ($/t)', birim: '$/t', hisse: ['KCAER'], kaynak: KAYNAK, _not: 'Orta boy profil; Kocaer\'in ürün grubuyla örtüşür (yurt içi liste; Kocaer satışı ağırlıkla ihracat).' }, profN, 'USD', [200, 2000]);
  const sF = seriYaz('kardemir_filmasin_usd', { ad: 'Kardemir filmaşin liste fiyatı — Ø5.5 SAE1008 ($/t)', birim: '$/t', hisse: [], kaynak: KAYNAK }, filmN, 'USD', [200, 2000]);
  const sH = seriYaz('kardemir_hurda_tl', { ad: 'Kardemir hurda alım fiyatı — Özel Ekstra (TL/t)', birim: 'TL/t', hisse: ['KRDMD'], kaynak: 'kardemir.com açık API (Actions §472) · ilan tarihinden bir sonrakine kadar geçerli · ay ortalaması', _not: 'Şirketin kendi ilan ettiği hurda alım fiyatı; Özel Ekstra 2014\'ten beri kesintisiz sınıf. DKP/Ekstra/1.-2. sınıf ve büyük parça iskontosu dosyada (kardemir.hurda). Kardemir yüksek fırın üreticisi: hurda şarjın küçük kısmı, asıl maliyet cevher + kok.' }, hurdaN, 'TL', [100, 500000]);
  const sHu = seriYaz('kardemir_hurda_usd', { ad: 'Kardemir hurda alım fiyatı — Özel Ekstra ($/t, günün kuruyla)', birim: '$/t', hisse: ['KRDMD'], kaynak: 'kardemir.com açık API (Actions §472) · TL ilan ÷ USD/TRY (Yahoo) · ay ortalaması', _not: 'Yurt içi hurda piyasasının açık, tarihli ölçüsü; LME "HMS 80:20 CFR Türkiye" ile aynı birimde kıyaslanır (yurt içi premium sınıf, CFR değil).' }, hurdaN, 'USD', [50, 1500]);
  /* türetilmiş spread'ler — ay ortalamalarından (iki girdi de adım serisi; günlük fark ortalaması = ortalamaların farkı) */
  const fark = (anahtar, meta, aK, bK, carpan) => { const A = D.seriler[aK], B = D.seriler[bK]; if (!A || !B || !A.aylik || !B.aylik || !A.son || !B.son) return null; const c = carpan || 1; const aylik = {}; for (const m of Object.keys(A.aylik).sort()) if (B.aylik[m] != null) aylik[m] = +(A.aylik[m] - c * B.aylik[m]).toFixed(2); const ks = Object.keys(aylik); if (!ks.length) return null;
    const bSonDeger = typeof B.son.deger === 'number' ? B.son.deger : B.aylik[Object.keys(B.aylik).sort().pop()];
    const sonDeger = +(A.son.deger - c * bSonDeger).toFixed(2), sonTarih = A.son.tarih > String(B.son.tarih || '') ? A.son.tarih : B.son.tarih;
    const onceki = D.seriler[anahtar]; D.seriler[anahtar] = Object.assign({}, onceki || {}, meta, { siklik: 'aylik', aylik, son: { tarih: sonTarih, deger: sonDeger, bilesen: A.son.deger + ' − ' + (carpan ? carpan + '×' : '') + bSonDeger }, guncelleme: bugun }); return D.seriler[anahtar].son; };
  const sM = fark('kardemir_marj_hurda_usd', { ad: 'Kardemir yurt içi metal marjı — kütük liste − hurda Özel Ekstra ($/t)', birim: '$/t', hisse: ['KRDMD'], kaynak: 'türetilmiş: kardemir.com kütük ($) − hurda alım (TL→$) · ay ortalaması', _not: 'Şirketin kendi satış ve kendi alım fiyatı arasındaki fark; LME metal marjının yerli, gerçekleşen karşılığı. Kardemir BOF üreticisi olduğundan kâr makası için cevher+kok spread\'i daha belirleyici; bu seri yurt içi uzun çelik piyasasının sağlığını ölçer.' }, 'kardemir_kutuk_usd', 'kardemir_hurda_usd');
  const sC = fark('kardemir_spread_cevher_usd', { ad: 'Kardemir kütük − demir cevheri (1,6 t) — kok hariç kısmi spread ($/t)', birim: '$/t', hisse: ['KRDMD'], kaynak: 'türetilmiş: kardemir.com kütük ($) − 1,6 × WB demir cevheri 62% CFR Çin ($/t, aylık) · ay ortalaması', _not: 'Yüksek fırın girdisi ≈1,6 t cevher + ≈0,7 t kok kömürü/t sıvı çelik; kok serisi yok → mutlak seviye değil YÖN okunur (2021–22 kok şoku burada görünmez). WB cevher serisi bir ay geriden gelir.' }, 'kardemir_kutuk_usd', 'demir_cevheri', 1.6);
  const sS = fark('kcaer_hadde_spread_usd', { ad: 'Haddeleme spread\'i — Kardemir profil − kütük ($/t)', birim: '$/t', hisse: ['KCAER'], kaynak: 'türetilmiş: kardemir.com IPE/NPI/NPU 180-200 − kütük S235JR · ay ortalaması', _not: 'Kocaer kütük alıp profil haddeler: kâr/ton ≈ profil fiyatı − kütük − dönüşüm maliyeti (enerji, işçilik). İki fiyat da Kardemir\'in yurt içi listesi (Kocaer satışı ağırlıkla ihracat) → seviye değil yön; profil listesi seyrek güncellenir (yılda 2–4 kez).' }, 'kardemir_profil_usd', 'kardemir_kutuk_usd');
  D.seriler_guncelleme = bugun;
  await yaz(dosya, D);
  if (yeni) degisenler.push('Kardemir fiyatları (' + yeni + ' tarih)');
  const g = s => s ? s.deger + ' (' + s.tarih + ')' : '—';
  raporlar.push('### Kardemir fiyatları (§472) — ' + (sK || sH ? '✓' : '⚠') + ' kütük ' + g(sK) + ' $/t · hurda Özel Ekstra ' + (sH ? sH.deger + ' TL/t' + (sHu ? ' ≈ ' + sHu.deger + ' $/t' : '') + ' (' + sH.tarih + ')' : '—') + (sM ? ' · metal marjı ' + sM.deger + ' $/t' : '') +
    '\n- ' + notlar.join(' · ') + ' · bu koşu ' + sayfa + ' sayfa, ' + yeni + ' yeni' + (bekleyen ? ' · tavan: ' + bekleyen + ' tarih sonraki koşulara (geriye doldurma sürüyor)' : ' · geriye doldurma TAMAM') +
    '\n- nervürlü Ø12-32 ' + (sN ? sN.deger + ' TL/t' + (sNu ? ' ≈ ' + sNu.deger + ' $/t' : '') + ' (' + sN.tarih + ')' : '—') + ' · profil IPE 180-200 ' + g(sP) + ' $/t · filmaşin ' + g(sF) + ' $/t' +
    (sC ? '\n- kütük − 1,6×cevher ' + sC.deger + ' $/t (kok hariç)' : '') + (sS ? ' · KCAER hadde spread\'i (profil − kütük) ' + sS.deger + ' $/t' : '') + ' · ' + kurNot +
    (uyari.length ? '\n- ⚠ ' + uyari.slice(0, 6).join('\n- ⚠ ') + (uyari.length > 6 ? '\n- ⚠ … +' + (uyari.length - 6) : '') : ''));
}

/* ── §474 SUT FİYAT ENDEKSİ (SGK Sağlık Uygulama Tebliği) + TTB ÖHU KATSAYISI + RESMÎ GAZETE İZLEYİCİ → MPARK ─────────
   Soru (20 Eki 14:51): "SUT tarifelerini nasıl bulacağız ki?" — SUT, SGK'nın özel/kamu hastanelere ödediği fiyat listesidir
   (EK-2/A vaka başı/muayene · EK-2/B hizmet başı işlem puanı · EK-2/C tanıya dayalı paket); fiyatları Sağlık Hizmetleri
   Fiyatlandırma Komisyonu (SGK+SB+Hazine) belirler, Resmî Gazete'de "SUT Değişiklik Tebliği" + "SHFK Kararı" olarak çıkar
   (yılda 5–10 kez; çoğu KALEM bazlı düzeltme). GENEL artışlar liste yenilenerek yapılır, metinde ORAN YAZMAZ — oranı
   şirketler (MLP Care bilgilendirme notu/faaliyet raporu: "SUT fiyat listesine yaklaşık %30 artış") ve basın hesaplar.
   Bu yüzden kaynak zinciri: (1) ADIM TABLOSU elle — her genel artış için yürürlük tarihi + oran; dayanak MLP Care KAP
   notları (31.12.2023 / 31.12.2024 / 31.12.2025 bilgilendirme notu, 2026/03 faaliyet raporu) ve RG (2021-04-28 M1,
   2022-02-08 M1, 2023-08-24 M1, 2024-05-09 M1, 2025-12-10). (2) RG İZLEYİCİ otomatik — son 14 günün günlük fihristleri
   (eskiler/YYYY/MM/YYYYMMDD.htm + M1/M2 mükerrer; sayfa windows-1254) taranır, SUT/SHFK başlıkları kaydedilir ve raporda
   "yeni RG değişikliği — oran MLP notuyla tabloya işlenecek" uyarısı verilir. (3) Türetilmiş seriler: sut_endeks (adım,
   2020-12=100, ay ortalaması), sut_reel = SUT/TÜFE (SGK fiyatının satın alma gücü), ttb_endeks (TTB Özel Hekimlik
   Uygulamaları katsayısı — özel sigorta/cepten fiyatlamanın çapası; 2022-12=100), ttb_reel.
   ÖĞRETİCİ: SUT 2008–2021 arası donuktu; 2021'den beri 6 genel artış ama birikimli artış TÜFE'nin altında kaldı → SGK
   hastası özel hastane için reel olarak ucuzladı; TTB katsayısı ise TÜFE'nin üstünde → MLP'nin "ödeme tipi miksi" (özel
   sigortaya kayış) FAVÖK marjının asıl sürücüsü. İlave ücret tavanı SUT'un %200'ü olduğundan SUT artışı hem SGK ödemesini
   hem hastadan alınabilecek farkı aynı anda yükseltir → SGK hastasında geçişkenlik tam.
   ELLE GÜNCELLEME: yeni genel artışta SUT_ADIMLAR'a satır ekle (yürürlük tarihi, %, kaynak); TTB için TTB_ADIMLAR. Seriler
   her koşuda tablodan yeniden kurulur. KAP'tan otomatik oran çekimi yapılmaz (oran PDF içinde, yılda 1–2 kez — elle güvenli). */
const SUT_ADIMLAR = [   /* [yürürlük tarihi, artış %, dayanak] — GENEL fiyat artışları (kalem bazlı SHFK düzeltmeleri alınmaz) */
  ['2021-04-28', 15, 'RG 28 Nis 2021 (31468 mük.): vaka başı +15 · radyoloji +10 · kan +20 · malzeme +10 · diğer +15 — 2008 sonrası ilk genel artış (basın: Cumhuriyet 6 May 2021)'],
  ['2022-02-13', 40, 'RG 8 Şub 2022 (31744 M1): muayene +35 · paket +45 · diğer işlemler +40 · diyaliz +50 · malzeme +75; işlemler yayımdan 5 gün sonra (Diken 9 Şub 2022). Ağırlıklı ≈%40'],
  ['2023-03-24', 31, 'MLP Care 31.12.2023 bilgilendirme notu: "24 Mart 2023 itibariyle SUT fiyat listesine %31 artış"'],
  ['2023-09-01', 51, 'RG 24 Ağu 2023 (32289 M1): EK-2/A-B-C +50 (BirGün) · MLP notu: %51, 1 Eyl 2023 itibariyle etkili'],
  ['2024-05-11', 50, 'RG 9 May 2024 (32541 M1) · MLP Care 31.12.2024 notu: "11 Mayıs 2024 itibariyle yaklaşık %50"'],
  ['2025-12-10', 30, 'RG 10 Ara 2025 · MLP Care 31.12.2025 notu / 2026-03 faaliyet raporu: "10 Aralık 2025 itibariyle yaklaşık %30"'],
];
const TTB_ADIMLAR = [   /* TTB Özel Hekimlik Uygulamaları (ÖHU) katsayısı — özel sigorta/cepten fiyatlamanın çapası (MLP Care notları) */
  ['2023-01-01', 41, 'TTB 26 Ara 2022 kararı (MLP 2023 notu)'], ['2023-07-01', 31, 'TTB 22 Haz 2023 kararı'],
  ['2024-01-01', 41, 'TTB Oca 2024'], ['2024-07-01', 25, 'TTB Haz 2024 kararı (1 Tem)'],
  ['2025-01-01', 20, 'TTB Oca 2025'], ['2025-07-01', 20.5, 'TTB Tem 2025'],
  ['2026-01-01', 16.5, 'TTB Ara 2025 kararı (MLP 2025 notu)'],
];
const SUT_SURUM = '474', SUT_BAS = '2020-12', TTB_BAS = '2022-12', RG_GUN = 14;
const RG_KOK = 'https://www.resmigazete.gov.tr/eskiler/';
const RG_BASLIK = /Sa.{1,2}l.{1,2}k Uygulama Tebli|Fiyatland.{1,2}rma Komisyonu/i;   /* Türkçe harfler bozuk gelse de yakalar */
function sutAdimSeri(adimlar, basAy, bugunStr) {
  /* adım tablosu → günlük seviye (ileri taşıma) → ay ortalaması; seviye basAy'da 100 */
  const sirali = adimlar.slice().sort((a, b) => a[0] < b[0] ? -1 : 1);
  const aylik = {}, top = {}, say = {}; let i = 0, seviye = 100;
  const bas = new Date(basAy + '-01T00:00:00Z'), son = new Date(bugunStr + 'T00:00:00Z');
  for (let d = new Date(bas); d <= son; d.setUTCDate(d.getUTCDate() + 1)) { const t = d.toISOString().slice(0, 10); while (i < sirali.length && sirali[i][0] <= t) { seviye = seviye * (1 + sirali[i][1] / 100); i++; } const a = t.slice(0, 7); top[a] = (top[a] || 0) + seviye; say[a] = (say[a] || 0) + 1; }
  for (const a of Object.keys(top).sort()) aylik[a] = +(top[a] / say[a]).toFixed(2);
  const seviyeler = []; let s = 100; for (const x of sirali) { s = s * (1 + x[1] / 100); seviyeler.push({ t: x[0], artis: x[1], seviye: +s.toFixed(1), kaynak: x[2], ileri: x[0] > bugunStr || undefined }); }
  const gecmis = seviyeler.filter(x => !x.ileri), gelecek = seviyeler.filter(x => x.ileri);   /* yürürlük ileri tarihli olabilir (10 Ara 2025 yayım → 1 Oca 2026 yürürlük) */
  return { aylik, seviyeler, son: gecmis[gecmis.length - 1] || { t: basAy + '-01', artis: 0, seviye: 100 }, gelecek, seviye: +seviye.toFixed(2) };
}
function sutReel(aylikEndeks, tufe, basAy) {
  /* reel = endeks / TÜFE, basAy'da 100; TÜFE'nin olmadığı aylar atlanır (TÜFE bir ay geriden gelir) */
  if (!tufe || !tufe[basAy] || !aylikEndeks[basAy]) return null;
  const o = {}; for (const a of Object.keys(aylikEndeks).sort()) if (tufe[a] != null) o[a] = +(100 * (aylikEndeks[a] / aylikEndeks[basAy]) / (tufe[a] / tufe[basAy])).toFixed(2);
  return Object.keys(o).length ? o : null;
}
async function sutRgTara(K, bugunStr, uyari) {
  /* son RG_GUN günün fihristleri (ana + M1 + M2) — başlık yakala, {t, baslik, url} biriktir (tekrarsız) */
  K.rg_olaylar = Array.isArray(K.rg_olaylar) ? K.rg_olaylar : [];
  const var_ = new Set(K.rg_olaylar.map(x => x.url)); let sayfa = 0, yeni = 0, erisim = 0, artArda = 0;
  const oku = async yol => { const r = await fetch(RG_KOK + yol, { headers: { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) KtPanel/1.0', 'Accept': 'text/html' }, signal: AbortSignal.timeout(15000) }); sayfa++; if (r.status === 404) return null; if (!r.ok) throw new Error('HTTP ' + r.status); erisim++; const buf = Buffer.from(await r.arrayBuffer()); const h8 = buf.toString('utf8'); const m = /charset=([\w-]+)/i.exec(h8.slice(0, 3000)); let h = h8; if (m && /1254|8859-9/i.test(m[1])) { try { h = new TextDecoder('windows-1254').decode(buf); } catch (e) { h = buf.toString('latin1'); } } return h; };
  for (let g = 0; g < RG_GUN; g++) {
    if (artArda >= 3) { uyari.push('RG: art arda 3 ağ hatası — tarama bırakıldı (resmigazete.gov.tr erişilemiyor?)'); break; }
    const d = new Date(bugunStr + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() - g); const t = d.toISOString().slice(0, 10); const kok = t.slice(0, 4) + '/' + t.slice(5, 7) + '/' + t.replace(/-/g, '');
    for (const ek of ['', 'M1', 'M2']) {
      let h; try { h = await oku(kok + ek + '.htm'); artArda = 0; } catch (e) { artArda++; uyari.push('RG ' + t + ek + ': ' + String(e && e.message || e).slice(0, 50)); break; }
      if (h == null) { if (ek) break; else continue; }
      artArda = 0;   /* ana sayı yoksa (hafta sonu/tatil) mükerrer de aranmaz… ama RG hafta sonu da çıkar → sadece M'ler atlanır */
      const re = /<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi; let m;
      while ((m = re.exec(h))) { const baslik = m[2].replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/\s+/g, ' ').replace(/^[–—-\s]+/, '').trim(); if (!RG_BASLIK.test(baslik)) continue; const url = /^https?:/.test(m[1]) ? m[1] : RG_KOK + t.slice(0, 4) + '/' + t.slice(5, 7) + '/' + m[1]; if (var_.has(url)) continue; var_.add(url); K.rg_olaylar.push({ t, mukerrer: ek || undefined, baslik: baslik.slice(0, 140), url }); yeni++; }
    }
  }
  K.rg_olaylar.sort((a, b) => a.t < b.t ? 1 : -1); K.rg_olaylar = K.rg_olaylar.slice(0, 60); K.son_tarama = bugunStr;
  return { sayfa, yeni, erisim };
}
async function sutEndeks() {
  const dosya = 'sektor-surucu.json';
  if (!(await varMi(dosya))) { raporlar.push('### SUT endeksi (§474) — ⏭ sektor-surucu.json yok'); return; }
  const D = await oku(dosya); D.seriler = D.seriler || {};
  const K = D.sut = Object.assign({ surum: SUT_SURUM, rg_olaylar: [] }, D.sut || {}, { surum: SUT_SURUM });
  const uyari = [], notlar = [];
  /* 0) §475: SGK "İşlenmiş Güncel SUT" ZIP → EK-2B/EK-2C sepet kıyası → otomatik adımlar (ağ hatası dosyayı bozmaz) */
  try { await sutSepet(D, K, uyari, notlar); } catch (e) { uyari.push('SUT sepeti: ' + String(e && e.message || e).slice(0, 100)); }
  /* 1) adım serileri — elle tablo + otomatik adımlar (§475 sutAdimlarBirlesik) */
  const ADIMLAR = sutAdimlarBirlesik(K);
  const S = sutAdimSeri(ADIMLAR, SUT_BAS, bugun), T = sutAdimSeri(TTB_ADIMLAR, TTB_BAS, bugun);
  const tufe = D.seriler.tufe && D.seriler.tufe.aylik; const tufeSon = tufe ? Object.keys(tufe).sort().pop() : null;
  const sutR = sutReel(S.aylik, tufe, SUT_BAS), ttbR = sutReel(T.aylik, tufe, TTB_BAS);
  /* son adımdan bu yana TÜFE (erozyon): SUT'un son artıştan beri kaybettiği satın alma gücü */
  const erozyon = (sonT) => { if (!tufe) return null; const a0 = sonT.slice(0, 7); const once = Object.keys(tufe).filter(a => a < a0).sort().pop(); if (!once || !tufeSon || tufeSon <= once) return null; return { ay: tufeSon, tufe_degisim: +((tufe[tufeSon] / tufe[once] - 1) * 100).toFixed(1), reel_kayip: +((1 / (tufe[tufeSon] / tufe[once]) - 1) * 100).toFixed(1) }; };
  const eS = erozyon(S.son.t), eT = erozyon(T.son.t);
  const otoN = ((K.sepet && K.sepet.otomatik_adimlar) || []).length;
  const KAYNAK = 'Adım tablosu: elle (MLP Care KAP notları + Resmî Gazete)' + (otoN ? ' + SGK EK-2B/EK-2C sepet kıyası (otomatik, ' + otoN + ' adım)' : '') + ' · ay ortalaması';
  D.seriler.sut_endeks = Object.assign({}, D.seriler.sut_endeks || {}, { ad: 'SUT fiyat endeksi — SGK Sağlık Uygulama Tebliği genel fiyat artışları (2020-12=100)', birim: 'endeks', siklik: 'aylik', hisse: ['MPARK'], kaynak: KAYNAK, aylik: S.aylik, son: { tarih: S.son.t, deger: S.seviye, artis: S.son.artis }, adimlar: S.seviyeler, guncelleme: bugun,
    _not: 'SGK\'nın özel hastanelere ödediği fiyat listesinin (EK-2/A muayene · EK-2/B hizmet başı · EK-2/C paket) GENEL artışlarından kurulan basamak endeksi; kalem bazlı SHFK düzeltmeleri alınmaz. Oran RG metninde yazmaz → 2026\'dan itibaren SGK\'nın yayımladığı EK-2B/EK-2C listeleri sürüm sürüm kıyaslanır (medyan değişim, §475); öncesi MLP Care\'in açıkladığı etkin oran. İlave ücret tavanı SUT\'un %200\'ü → SUT artışı SGK ödemesini ve hastadan alınabilecek farkı birlikte yükseltir.' + (eS ? ' Son artıştan (' + S.son.t + ', +%' + S.son.artis + ') bu yana TÜFE +%' + eS.tufe_degisim + ' (' + eS.ay + ') → SUT reel %' + eS.reel_kayip + '.' : ''), erozyon: eS || undefined });
  if (sutR) D.seriler.sut_reel = Object.assign({}, D.seriler.sut_reel || {}, { ad: 'SUT reel fiyat — SUT endeksi / TÜFE (2020-12=100)', birim: 'endeks', siklik: 'aylik', hisse: ['MPARK'], kaynak: 'türetilmiş: sut_endeks ÷ TÜFE (EVDS, 2025=100 zincirli) · TÜFE bir ay geriden', aylik: sutR, son: { tarih: Object.keys(sutR).sort().pop(), deger: sutR[Object.keys(sutR).sort().pop()] }, guncelleme: bugun, _not: 'SGK hastasının özel hastane için reel fiyatı: 100\'ün altı = SUT, 2020 sonuna göre enflasyonun gerisinde. Artış ayında sıçrar, aylar geçtikçe erir (testere dişi) — çeyrek ortalaması okunur. MLP\'de SGK payı hasılatın küçük kısmı; asıl marj sürücüsü ödeme tipi miksi (özel sigortaya kayış).' });
  D.seriler.ttb_endeks = Object.assign({}, D.seriler.ttb_endeks || {}, { ad: 'TTB ÖHU katsayısı endeksi — özel hekimlik ücret tarifesi (2022-12=100)', birim: 'endeks', siklik: 'aylik', hisse: ['MPARK'], kaynak: 'Adım tablosu (TTB_ADIMLAR): MLP Care KAP notları · yılda 2 güncelleme (Oca/Tem)', aylik: T.aylik, son: { tarih: T.son.t, deger: T.seviye, artis: T.son.artis }, adimlar: T.seviyeler, guncelleme: bugun, _not: 'Türk Tabipleri Birliği Özel Hekimlik Uygulamaları katsayısı: özel sağlık sigortası ve cepten ödemelerde hekim ücretinin çapası → MLP yurt içi özel fiyatlamasının vekili. TÜFE\'nin üstünde arttı (2023–26).' + (eT ? ' Son artıştan (' + T.son.t + ') bu yana TÜFE +%' + eT.tufe_degisim + '.' : '') });
  if (ttbR) D.seriler.ttb_reel = Object.assign({}, D.seriler.ttb_reel || {}, { ad: 'TTB katsayısı reel — TTB endeksi / TÜFE (2022-12=100)', birim: 'endeks', siklik: 'aylik', hisse: ['MPARK'], kaynak: 'türetilmiş: ttb_endeks ÷ TÜFE', aylik: ttbR, son: { tarih: Object.keys(ttbR).sort().pop(), deger: ttbR[Object.keys(ttbR).sort().pop()] }, guncelleme: bugun, _not: 'Özel fiyatlamanın reel seyri; 100\'ün üstü = TTB tarifesi enflasyonun önünde.' });
  K.adimlar = S.seviyeler; K.ttb_adimlar = T.seviyeler;
  /* 2) RG izleyici (ağ hatası dosyayı bozmaz) */
  let rg = null; try { rg = await sutRgTara(K, bugun, uyari); } catch (e) { uyari.push('RG tarama: ' + String(e && e.message || e).slice(0, 80)); }
  const sonAdim = ADIMLAR.map(x => x[0]).sort().pop();
  const yeniRg = (K.rg_olaylar || []).filter(x => x.t > sonAdim && /Uygulama Tebli/i.test(x.baslik));
  D.seriler_guncelleme = bugun;
  await yaz(dosya, D);
  const sutSonAy = Object.keys(S.aylik).sort().pop(), reelSon = sutR ? sutR[Object.keys(sutR).sort().pop()] : null;
  raporlar.push('### SUT endeksi (§474) — ✓ SUT ' + S.seviye + ' (son artış ' + S.son.t + ' +%' + S.son.artis + ')' + (S.gelecek.length ? ' · İLERİ TARİHLİ: ' + S.gelecek.map(x => x.t + ' +%' + x.artis).join(', ') : '') + (reelSon != null ? ' · reel ' + reelSon + ' (2020-12=100, ' + tufeSon + ')' : '') + ' · TTB ' + T.seviye + ' (son ' + T.son.t + ' +%' + T.son.artis + ')' + (ttbR ? ' · TTB reel ' + ttbR[Object.keys(ttbR).sort().pop()] : '') +
    '\n- ' + ADIMLAR.length + ' SUT adımı (' + ADIMLAR[0][0] + '→' + sonAdim + (otoN ? ', ' + otoN + ' otomatik' : '') + ') · ' + TTB_ADIMLAR.length + ' TTB adımı' + (eS ? ' · son SUT artışından bu yana TÜFE +%' + eS.tufe_degisim + ' → reel %' + eS.reel_kayip : '') +
    (notlar.length ? '\n- ' + notlar.join('\n- ') : '') +
    (rg ? '\n- RG fihrist taraması: ' + rg.sayfa + ' sayfa (' + rg.erisim + ' erişildi) · ' + rg.yeni + ' yeni başlık · kayıtlı ' + K.rg_olaylar.length : '\n- RG taraması yapılamadı') +
    (yeniRg.length ? '\n- ⚠ Son SUT adımından (' + sonAdim + ') sonra RG\'de ' + yeniRg.length + ' SUT değişikliği: ' + yeniRg.slice(0, 4).map(x => x.t + (x.mukerrer ? ' ' + x.mukerrer : '')).join(' · ') + ' — çoğu kalem bazlıdır; GENEL artışsa MLP notu/basın oranıyla SUT_ADIMLAR\'a eklenir' : '') +
    (uyari.length ? '\n- ⚠ ' + uyari.slice(0, 4).join('\n- ⚠ ') : ''));
}

/* ── §475 SUT SEPET ENDEKSİ — SGK "Değişiklik Tebliği İşlenmiş Güncel SUT" ZIP → EK-2B/EK-2C xlsx → ORAN OTOMATİK ──────────
   Soru (20 Eki 15:31): "SUT zammını nereden görecek? … bu JSON'lar işe yarayacak mı?" — §474 yalnız RG BAŞLIĞINI görüyordu, oranı
   elden alıyordu. Kaynak bulundu: SGK her SUT değişikliğinde sgk.gov.tr/Arama/Index/sut listesine "DD/MM/YYYY SUT Değişiklik
   Tebliği İşlenmiş Güncel 2013 SUT" duyurusu ekler; duyuru sayfasında tek bir /Download/DownloadFile?f=…zip bağlantısı (≈33 MB,
   358 dosya) vardır ve içinde EK-2 LİSTELERİ/ klasöründe FİYAT LİSTELERİNİN KENDİSİ xlsx olarak durur:
     "EK-2A AYAKTAN BAŞVURULARDA ÖDEME LİSTESİ (Yür.07.07.2026).xlsx" · "EK-2B HİZMET BAŞI İŞLEM PUAN LİSTESİ (Yür.07.07.2026).xlsx"
     (sayfa1: A İŞLEM KODU · B İŞLEM ADI · C AÇIKLAMA · D İŞLEM PUANI; ~7.600 satır; kodlar 510010 gibi 6 hane ya da L100060 gibi
     harf+6 hane) · "EK-2C TANIYA DAYALI İŞLEM PUAN LİSTESİ (Yür.…).xlsx" (P-kodlu paketler). Dosya adındaki "Yür." = o listenin
     yürürlük tarihi. Arşiv 2011'e kadar gider (75 duyuru).
   ÖLÇÜM (Chrome'da doğrulandı, 20 Eki): 25.11.2025 duyurusunun EK-2B'si "Yür.11.05.2024" (May 2024 artışından beri değişmemiş),
   10.12.2025 duyurusununki "Yür.01.01.2026": ortak 1.483 kodun TAMAMI değişmiş, medyan ×1,20 (1.234 kod +%20 · 222 kod +%10 ·
   26 kod +%96) → MLP'nin "yaklaşık %30" dediği Aralık artışı hizmet başı listede %20'dir (paket/ayaktan listeleri farklı olabilir).
   Ders: zam tek sayı değil, listeye göre değişir — ölçmek şart.
   YÖNTEM: her koşuda arama sayfası (1 istek) → en yeni duyuru değişmediyse bitti. Değiştiyse ZIP indir → EK-2B ve EK-2C xlsx →
   kod→puan haritası → ktpanel/sut-ek2b.json'daki önceki sürümle KIYAS: ortak kodlarda oran medyanı, değişen kod payı. Medyan
   ≥ %3 VE değişen pay ≥ %50 ise GENEL ARTIŞ → D.sut.otomatik_adimlar'a {t: yürürlük (dosya adından), artis} eklenir; sut_endeks
   (§474) bu adımları elle tablonun ÜSTÜNE yazar (±45 gün içindeki elle adım düşer). Kalem bazlı düzeltmeler (az kod, küçük
   medyan) adım olmaz ama sürüm özeti kaydedilir. İLK KOŞU: SUT_SGK_TOHUM ile 25.11.2025 ve 10.12.2025 duyuruları sırayla işlenir
   → Aralık/Ocak adımı otomatik doğar ve doğrulanır; sonra güncel duyuru. Snapshot yalnız SON sürümün tam haritası (~1.500+ kod ×
   2 liste, ayrı dosya) — sektor-surucu.json şişmez.
   SINIRLAR: puan→TL katsayısı sabit varsayılır (SUT md. 4.4: işlem puanı × katsayı; artışlar bugüne dek puan üzerinden yapıldı);
   EK-2A (ayaktan vaka başı, branş×sınıf matrisi) ayrı yapıda — Faz 2. sgk.gov.tr Actions IP'sini engellerse ⏭ ve elle tablo sürer. */
const SUT_SGK_KOK = 'https://www.sgk.gov.tr', SUT_SGK_ARAMA = 'https://www.sgk.gov.tr/Arama/Index/sut';
const SUT_SGK_TOHUM = ['25112025', '10122025'];   /* ilk koşuda sırayla işlenecek duyuru öncekleri (slug başı ddmmyyyy) — Aralık 2025 adımını doğrular */
const SUT_SEPET_SURUM = '475', SUT_SEPET_ESIK = 3, SUT_SEPET_PAY = 0.5, SUT_SEPET_DOSYA = 'sut-ek2b.json';
const SUT_SGK_H = { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36', 'Accept': 'text/html,application/xhtml+xml,*/*;q=0.8', 'Accept-Language': 'tr-TR,tr;q=0.9' };
const sutAsciiAd = s => String(s || '').replace(/[^\x20-\x7E]/g, '?');
function sutYururluk(ad) { const m = /Y.{1,3}r\.?\s*(\d{2})\.(\d{2})\.(\d{4})/.exec(String(ad)); return m ? m[3] + '-' + m[2] + '-' + m[1] : null; }   /* "Yür.07.07.2026" — eski ZIP'lerde ad 1254 kodlu gelir, ü bozulur */
function sutZipHam(buf, G, ad, zlib) { const e = G[ad]; const nlen = buf.readUInt16LE(e.loff + 26), elen = buf.readUInt16LE(e.loff + 28); const bas = e.loff + 30 + nlen + elen; const ham = buf.subarray(bas, bas + e.csize); return e.method === 0 ? Buffer.from(ham) : zlib.inflateRawSync(ham); }
async function sutXlsxSatirlar(xbuf) {
  const zlib = await import('node:zlib'); const G = zipGirdiler(xbuf);
  const ss = G['xl/sharedStrings.xml'] ? zipOku(xbuf, G, 'xl/sharedStrings.xml', zlib) : '';
  const strs = [...ss.matchAll(/<si>([\s\S]*?)<\/si>/g)].map(m => xmlCoz([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map(x => x[1]).join('')));
  const sayfa = Object.keys(G).filter(k => /^xl\/worksheets\/sheet\d+\.xml$/.test(k)).sort((a, b) => (+a.match(/\d+/)[0]) - (+b.match(/\d+/)[0]))[0];
  if (!sayfa) throw new Error('xlsx sayfa yok');
  const xml = zipOku(xbuf, G, sayfa, zlib); const rows = [];
  for (const rm of xml.matchAll(/<row [^>]*>([\s\S]*?)<\/row>/g)) { const cells = {}; for (const cm of rm[1].matchAll(/<c r="([A-Z]+)\d+"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) { const col = cm[1], attrs = cm[2] || '', inner = cm[3] || ''; const vm = inner.match(/<v>([\s\S]*?)<\/v>/); let v = null; if (vm) { v = vm[1]; if (/t="s"/.test(attrs)) v = strs[+v]; else if (/t="(str|inlineStr|b|e)"/.test(attrs)) v = xmlCoz(v); else v = +v; } else { const im = inner.match(/<is>[\s\S]*?<t[^>]*>([\s\S]*?)<\/t>/); if (im) v = xmlCoz(im[1]); } if (v !== null && v !== '') cells[col] = v; } rows.push(cells); }
  return rows;
}
function sutKodHarita(rows) {
  /* başlık satırından kod/puan sütununu bul (yoksa A/D); kod: 6 hane ya da harf+6 hane; puan: sayı ya da virgüllü metin */
  let kodCol = 'A', puanCol = 'D';
  for (const r of rows.slice(0, 8)) { const ent = Object.entries(r); const k = ent.find(([c, v]) => /KODU/i.test(String(v))), p = ent.find(([c, v]) => /PUAN/i.test(String(v))); if (k && p) { kodCol = k[0]; puanCol = p[0]; break; } }
  const m = {}; for (const r of rows) { const kod = String(r[kodCol] || '').trim(); let p = r[puanCol]; if (typeof p === 'string') p = parseFloat(p.replace(/\./g, '').replace(',', '.')); if (/^[A-Z]?\d{6}$/.test(kod) && typeof p === 'number' && isFinite(p) && p > 0) m[kod] = +p.toFixed(2); }
  return { kodlar: m, n: Object.keys(m).length, kodCol, puanCol };
}
function sutKiyas(eski, yeni) {
  const ortak = Object.keys(eski).filter(k => yeni[k] != null); if (!ortak.length) return null;
  const oran = ortak.map(k => yeni[k] / eski[k]).sort((a, b) => a - b); const q = p => oran[Math.min(oran.length - 1, Math.floor(oran.length * p))];
  const degisen = oran.filter(r => Math.abs(r - 1) > 0.001).length; const hist = {}; for (const r of oran) { const key = Math.round((r - 1) * 100); hist[key] = (hist[key] || 0) + 1; }
  return { ortak: ortak.length, degisen, degisen_pay: +(degisen / ortak.length).toFixed(3), medyan: +((q(0.5) - 1) * 100).toFixed(2), p25: +((q(0.25) - 1) * 100).toFixed(2), p75: +((q(0.75) - 1) * 100).toFixed(2), yeni_kod: Object.keys(yeni).length - ortak.length, silinen_kod: Object.keys(eski).length - ortak.length, hist: Object.entries(hist).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => k + '%:' + v).join(' ') };
}
async function sutSgkGetir(url, tip) { const r = await fetch(url, { headers: SUT_SGK_H, signal: AbortSignal.timeout(tip === 'zip' ? 180000 : 30000), redirect: 'follow' }); if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + url.replace(SUT_SGK_KOK, '').slice(0, 60)); return tip === 'zip' ? Buffer.from(await r.arrayBuffer()) : await r.text(); }
async function sutDuyuruListesi() {
  const h = await sutSgkGetir(SUT_SGK_ARAMA, 'html'); const out = []; const seen = new Set();
  for (const m of h.matchAll(/href="(\/Duyuru\/Detay\/([^"]*Islenmis-Guncel[^"]*))"/gi)) { if (seen.has(m[1])) continue; seen.add(m[1]); const t = /^(\d{2})(\d{2})(\d{4})-/.exec(m[2]); out.push({ href: m[1], slug: m[2], tarih: t ? t[3] + '-' + t[2] + '-' + t[1] : null }); }
  return out;   /* sayfa sırası: en yeni önce */
}
async function sutDuyuruIsle(duyuru, onceki, zlib) {
  /* duyuru sayfası → zip → EK-2B/EK-2C haritaları (+ önceki ile kıyas) */
  const ph = await sutSgkGetir(SUT_SGK_KOK + duyuru.href, 'html'); const zm = /href="([^"]*DownloadFile[^"]*)"/i.exec(ph); if (!zm) throw new Error('duyuruda zip yok: ' + duyuru.slug.slice(0, 20));
  const zipUrl = (zm[1].startsWith('http') ? zm[1] : SUT_SGK_KOK + zm[1]).replace(/&amp;/g, '&');
  const buf = await sutSgkGetir(zipUrl, 'zip'); const G = zipGirdiler(buf); const adlar = Object.keys(G);
  const bul = re => adlar.find(k => !/\/$/.test(k) && /\.xlsx?$/i.test(k) && re.test(sutAsciiAd(k)));
  const sonuc = { duyuru: duyuru.slug, tarih: duyuru.tarih, zip: zipUrl.replace(SUT_SGK_KOK, ''), zip_mb: +(buf.length / 1048576).toFixed(1), girdi: adlar.length, listeler: {} };
  for (const [ad, re] of [['ek2b', /EK-2B/], ['ek2c', /EK-2C T/]]) {
    const k = bul(re); if (!k) { sonuc.listeler[ad] = { hata: 'dosya yok' }; continue; }
    if (/\.xls$/i.test(k)) { sonuc.listeler[ad] = { hata: 'eski .xls biçimi', dosya: sutAsciiAd(k.split('/').pop()) }; continue; }
    const xbuf = sutZipHam(buf, G, k, zlib); const rows = await sutXlsxSatirlar(xbuf); const H = sutKodHarita(rows);
    const L = { dosya: k.split('/').pop(), yururluk: sutYururluk(k), n: H.n, satir: rows.length, sutun: H.kodCol + '/' + H.puanCol, kodlar: H.kodlar };
    if (onceki && onceki.listeler && onceki.listeler[ad] && onceki.listeler[ad].kodlar) L.kiyas = sutKiyas(onceki.listeler[ad].kodlar, H.kodlar);
    sonuc.listeler[ad] = L;
  }
  return sonuc;
}
function sutGenelArtis(sonuc) {
  /* iki listeden ≥ eşik ve değişen pay ≥ %50 olanların medyan ortalaması; hiçbiri yoksa null */
  const adim = []; for (const ad of ['ek2b', 'ek2c']) { const L = sonuc.listeler[ad]; if (L && L.kiyas && L.kiyas.medyan >= SUT_SEPET_ESIK && L.kiyas.degisen_pay >= SUT_SEPET_PAY) adim.push({ ad, medyan: L.kiyas.medyan, yururluk: L.yururluk }); }
  if (!adim.length) return null;
  const artis = +(adim.reduce((s, x) => s + x.medyan, 0) / adim.length).toFixed(1); const t = adim.map(x => x.yururluk).filter(Boolean).sort()[0] || sonuc.tarih;
  return { t, artis, listeler: Object.fromEntries(adim.map(x => [x.ad, x.medyan])), kaynak: 'SGK İşlenmiş Güncel SUT ' + sonuc.tarih + ' — ' + adim.map(x => x.ad.toUpperCase() + ' medyan +%' + x.medyan).join(' · ') };
}
async function sutSepet(D, K, uyari, notlar) {
  /* D.sut.sepet: {son_duyuru, surumler[], otomatik_adimlar[]}; tam harita ayrı dosyada */
  const zlib = await import('node:zlib');
  const P = K.sepet = Object.assign({ surum: SUT_SEPET_SURUM, surumler: [], otomatik_adimlar: [] }, K.sepet || {});
  let snap = (await varMi(SUT_SEPET_DOSYA)) ? await oku(SUT_SEPET_DOSYA) : null; if (snap && snap.surum !== SUT_SEPET_SURUM) snap = null;
  let liste; try { liste = await sutDuyuruListesi(); } catch (e) { uyari.push('SGK duyuru listesi: ' + String(e && e.message || e).slice(0, 80)); return; }
  if (!liste.length) { uyari.push('SGK: "İşlenmiş Güncel SUT" duyurusu bulunamadı (sayfa yapısı değişti?)'); return; }
  const enYeni = liste[0]; const kuyruk = [];
  if (!snap) { for (const s of SUT_SGK_TOHUM) { const d = liste.find(x => x.slug.startsWith(s)); if (d) kuyruk.push(d); } }
  if (!kuyruk.some(x => x.slug === enYeni.slug) && (!snap || snap.duyuru !== enYeni.slug)) kuyruk.push(enYeni);
  if (!kuyruk.length) { notlar.push('SGK güncel SUT: değişiklik yok (son duyuru ' + (snap && snap.tarih) + ')'); return; }
  let onceki = snap, islenen = 0;
  for (const d of kuyruk) {
    let sonuc; try { sonuc = await sutDuyuruIsle(d, onceki, zlib); } catch (e) { uyari.push('SGK ' + d.slug.slice(0, 8) + ': ' + String(e && e.message || e).slice(0, 90)); break; }
    islenen++;
    const ozet = { duyuru: sonuc.duyuru.slice(0, 8), tarih: sonuc.tarih, zip_mb: sonuc.zip_mb, girdi: sonuc.girdi }; for (const ad of ['ek2b', 'ek2c']) { const L = sonuc.listeler[ad]; ozet[ad] = L.hata ? { hata: L.hata } : { yururluk: L.yururluk, n: L.n, kiyas: L.kiyas || null }; }
    const genel = sutGenelArtis(sonuc); if (genel) { ozet.genel_artis = genel; if (!P.otomatik_adimlar.some(x => x.t === genel.t)) P.otomatik_adimlar.push(genel); }
    P.surumler = P.surumler.filter(x => x.duyuru !== ozet.duyuru).concat([ozet]).sort((a, b) => a.tarih < b.tarih ? -1 : 1).slice(-24);
    const kayit = { surum: SUT_SEPET_SURUM, duyuru: sonuc.duyuru, tarih: sonuc.tarih, zip: sonuc.zip, guncelleme: bugun, listeler: {} }; for (const ad of ['ek2b', 'ek2c']) { const L = sonuc.listeler[ad]; kayit.listeler[ad] = L.hata ? { hata: L.hata } : { dosya: L.dosya, yururluk: L.yururluk, n: L.n, kodlar: L.kodlar }; }
    await yaz(SUT_SEPET_DOSYA, kayit); onceki = kayit; P.son_duyuru = sonuc.duyuru; P.son_tarih = sonuc.tarih;
    notlar.push('SGK ' + sonuc.tarih + ' (' + sonuc.zip_mb + ' MB): ' + ['ek2b', 'ek2c'].map(ad => { const L = sonuc.listeler[ad]; if (L.hata) return ad.toUpperCase() + ' ' + L.hata; return ad.toUpperCase() + ' yür.' + L.yururluk + ' ' + L.n + ' kod' + (L.kiyas ? ' · medyan ' + (L.kiyas.medyan >= 0 ? '+' : '') + L.kiyas.medyan + '% (değişen %' + Math.round(L.kiyas.degisen_pay * 100) + ', ' + L.kiyas.hist + ')' : ' · ilk sürüm'); }).join(' · ') + (genel ? ' → GENEL ARTIŞ ' + genel.t + ' +%' + genel.artis : ''));
  }
  P.otomatik_adimlar.sort((a, b) => a.t < b.t ? -1 : 1);
  if (islenen) degisenler.push('SUT sepeti (' + islenen + ' sürüm)');
}
function sutAdimlarBirlesik(K) {
  /* elle tablo + otomatik adımlar: otomatik adımın ±45 günü içindeki elle adım düşer (aynı artışın iki kaydı olmasın) */
  const oto = ((K.sepet && K.sepet.otomatik_adimlar) || []).map(x => [x.t, x.artis, 'OTOMATİK: ' + x.kaynak]);
  const elle = SUT_ADIMLAR.filter(e => !oto.some(o => Math.abs(new Date(o[0]) - new Date(e[0])) <= 45 * 864e5));
  return elle.concat(oto).sort((a, b) => a[0] < b[0] ? -1 : 1);
}

/* ── §483 GES ZİNCİRİ FİYATLARI — InfoLink haftalık spot (polisilikon → wafer → hücre → modül) ───────────────────────────
   Çıkış noktası (20 Eki): kullanıcı pvinsights.com'u istedi. Site 20 Eki'de hem bu ortamdan hem kullanıcının Chrome'undan
   AÇILMADI (http → https yönlendirme döngüsü / bağlantı hatası) → Actions için güvenilir değil. Aynı veriyi (PV zincir spot
   fiyatı) yayımlayan sektör standardı InfoLink Consulting'in açık sayfası kullanıldı:
     GET https://www.infolink-group.com/spot-price/   → sunucu tarafında üretilmiş HTML <table> (JS gerekmez), her Çarşamba
         güncellenir ("Thursday of the previous week to this Wednesday"); satır: Kalem | Yüksek | Düşük | ORTALAMA | Δ% | Δ$ | tahmin.
         Bazı bölgesel satırlar 🔒 (ücretli) → sayı yok, atlanır. Sayfa başlığında yayın tarihi "October 14, 2026".
   TARİHÇE: InfoLink sayfası yalnız son haftayı gösterir. Geçmiş için Internet Archive (Wayback) anlık görüntüleri:
     GET https://web.archive.org/cdx/search/cdx?url=infolink-group.com/spot-price/&output=json&fl=timestamp&filter=statuscode:200&collapse=timestamp:8
     GET https://web.archive.org/web/{ts}id_/https://www.infolink-group.com/spot-price/   (id_ = arşivin ham HTML'i, aynı tablo)
     20 Eki ölçümü: 183 görüntü 2022-07→2026-10 (2023 ~aylık, 2024–25 ~haftalık, 2026 seyrek). Sayfa tarihi görüntü tarihinden
     değil SAYFANIN KENDİ yayın tarihinden alınır (aynı haftanın birden çok görüntüsü tek kayıt). Koşu başına ≤40 görüntü ya da 120 sn (hangisi önce), 2,5 sn ara; §483c: HTTP 429 (archive.org hız sınırı) hata sayılmaz, 10 sn beklenir, 3 ardışık 429da koşu durur → 183 görüntü ~5–6 koşuda.
   Hindistan satırları seçilmedi: "Mono TOPCon - India" (2024–25, Çin→Hindistan) ile "India assembled" (2025→, yerli montaj)
     farklı ürün — zincirlenemez; TR hisseleri için de ilgisiz.
   Solar cam (3,2 mm) InfoLink'in açık tablosundan 2025-01'de kalktı → seri yok.
   ETİKET KAYMASI (ürün teknolojisi değiştikçe InfoLink satır adlarını değiştirdi): polisilikon "Prime for Mono" (2022–23) →
     "Chunk polysilicon" (2024–25) → "Mono-grade polysilicon" (2026); hücre/modül PERC (p-tipi) → TOPCon (n-tipi, 2024→);
     verim eşiği 22,8% → 23,1% → 24,5% → 25,4% (aynı ürün, eşik yükseliyor). ZİNCİRLEME: her seri için öncelikli etiket
     kalıpları; yeni teknolojinin olmadığı eski haftalar eski teknoloji fiyatı × (yeni/eski) ÖRTÜŞME MEDYAN ORANIYLA bağlanır
     (ürün geçişi seviye sıçraması yaratmasın; oran rapora yazılır). Örtüşme yoksa bağlanmaz (seri yeni etiketle başlar).
   Neden önemli: CWENE (modül üreticisi + EPC) için satış fiyatı ≈ modül, girdi ≈ hücre (ithal) → modül − hücre = montaj
     makası. GESAN (GES kurulum/EPC, panel imalatına başlıyor) için modül fiyatı proje maliyetinin ~%35–45'i → düşüş talebi
     artırır. EUPWR (trafo/YG merkezi) için modül fiyatı yalnız dolaylı (GES yatırım hızı); doğrudan maliyet sürücüsü bakır.
   Türkiye notu: Çin menşeli modüle ek gümrük/anti-damping var → yurt içi fiyat Çin ihraç FOB'unun üstünde; seviye değil YÖN
     ve makas okunur. Avrupa projeleri FOB Çin satırı TR ihracatçısının rakip fiyatıdır.
   Birim: polisilikon RMB/kg ve $/kg · wafer RMB/adet · hücre ve modül $/W ve RMB/W. RMB → $ Yahoo CNY=X (ay ortalaması).
   Saklama: D.ges = {surum, hafta:{tarih:{etiket:ortalama}}, wb:{ts:1}}; seriler{} 'aylik' (hafta ortalamalarının ay ort.) +
   'haftalik' son 104 nokta + son. GES_SURUM değişirse kayıt sıfırlanır. */
const GES_SURUM = '483', GES_WB_TAVAN = 40, GES_WB_UYKU = 2500, GES_SURE_MS = 120 * 1000, PV_SURE_MS = 200 * 1000;
/* §483b PVINSIGHTS (21 Eki, kullanıcı: "pvinsights'a tekrar bak"): http://pvinsights.com/ ana sayfası ÜCRETSİZ haftalık spot tablosu
   taşır (Çarşamba güncellenir, "Last Update: 2026-09-30"; satır = Kalem | High | Low | Average | AvgChg | AvgChg% | AvgCNY, $ fiyat KDV
   hariç). Açık satırlar: PV Grade polisilikon 9N ($/kg) · 182 mm mono + 182,2×183,75 N-mono wafer ($/adet) · 182 mm N-Mono/PERC hücre ·
   182 mm 580/625Wp N-Mono ve PERC modül ($/W); diğerleri "Visit here" (üyelik). Site https isteğini http'ye, Chrome'un HTTPS-önce
   modu da http'yi https'e çevirdiğinden tarayıcıda DÖNGÜ hatası verir (20–21 Eki gözlemi) — sunucu ayakta: Internet Archive 2026-10-05
   görüntüsü 200. Actions düz http ile dener; olmazsa arşivin en son görüntüsü kullanılır. Geçmiş: Wayback 81 görüntü (2022-01→), 67
   yayın haftası (Chrome'da çekildi, hata 0). İKİNCİ KAYNAK: InfoLink ile aynı zincir; seviyeler farklı tanımlı (PVinsights modül ≈ Çin
   spot KDV hariç 0,090 $/W; InfoLink Çin dışı 0,114) → panelde yan yana YÖN teyidi, makas ayrı hesaplanır. */
const PV_URL = 'http://pvinsights.com/';
const PV_SERI = [
  { k: 'ges_pvi_polisilikon_usd', ad: 'Polisilikon PV grade 9N — PVinsights ($/kg)', birim: '$/kg', ar: [1, 100], d: [/^PV Grade PolySilicon \(9N/i] },
  { k: 'ges_pvi_wafer_usd', ad: 'Wafer N-mono 182,2×183,75 mm — PVinsights ($/adet)', birim: '$/adet', ar: [0.03, 3], d: [/^182\.2 ?mm x 183\.75 ?mm N[- ]?Mono Wafer/i, /^182 ?mm Mono Solar Wafer/i] },
  { k: 'ges_pvi_hucre_usd', ad: 'Hücre N-mono 182 mm — PVinsights ($/W)', birim: '$/W', ar: [0.01, 0.4], d: [/^182 ?mm N-?Mono Cell/i, /^182 ?mm Mono PERC Cell/i] },
  { k: 'ges_pvi_modul_usd', ad: 'Modül N-mono 182 mm 580/625Wp — PVinsights ($/W)', birim: '$/W', ar: [0.04, 0.6], d: [/^182 ?mm [\d\/]+ ?Wp N-?Mono Module/i, /^182 ?mm [\d\/]+ ?Wp PERC Module/i] },
];
function pvCoz(h) {
  const c = gesCoz(h);   /* aynı tablo yapısı (td[0] kalem, td[3] ortalama); tarih biçimi farklı */
  const t = String(h || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');
  const m = t.match(/Last Update:\s*(\d{4}-\d{2}-\d{2})/);   /* ilk "Last Update: 2026-Oct- 05" haber saatidir, atlanır */
  c.tarih = m ? m[1] : null; return c;
}
const GES_URL = 'https://www.infolink-group.com/spot-price/';
const GES_H = { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36', 'Accept': 'text/html,application/xhtml+xml', 'Accept-Language': 'en-US,en;q=0.9' };
const GES_AY = { January: '01', February: '02', March: '03', April: '04', May: '05', June: '06', July: '07', August: '08', September: '09', October: '10', November: '11', December: '12' };
function gesCoz(h) {
  h = String(h || '');
  const m = h.match(/(January|February|March|April|May|June|July|August|September|October|November|December) (\d{1,2}), (20\d\d)/);
  const tarih = m ? m[3] + '-' + GES_AY[m[1]] + '-' + m[2].padStart(2, '0') : null;
  const sat = {};
  for (const r of h.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
    const td = [...r[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(x => x[1].replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&#181;|&micro;|µ/g, 'u').replace(/\s+/g, ' ').trim());
    if (td.length < 4 || !td[0]) continue;
    const v = parseFloat(td[3].replace(/,/g, ''));
    if (isFinite(v) && v > 0) sat[td[0]] = v;
  }
  return { tarih, sat, n: Object.keys(sat).length };
}
/* seri tanımları: k anahtar · desen[] öncelik sırası (ilk eşleşen etiket; yoksa sonraki desen oranla bağlanır) · aralık denetimi */
const GES_SERI = [
  { k: 'ges_polisilikon_rmb', ad: 'Polisilikon — Çin mono-grade/chunk (RMB/kg)', birim: 'RMB/kg', ar: [10, 400],
    d: [/^Polysilicon Price - Mono-grade polysilicon \(RMB\)$/i, /^Polysilicon Price - Chunk polysilicon \(RMB\)$/i, /^Polysilicon Price - Prime for Mono \(RMB\)$/i] },
  { k: 'ges_polisilikon_usd', ad: 'Polisilikon — Çin dışı menşe ($/kg)', birim: '$/kg', ar: [3, 60],
    d: [/^Polysilicon Price - Mono-grade polysilicon \(USD\)$/i, /^Polysilicon Price - Chunk polysilicon \(USD\)$/i] },
  { k: 'ges_wafer_rmb', ad: 'Wafer — n-tipi 182 mm (RMB/adet)', birim: 'RMB/adet', ar: [0.3, 15],
    d: [/^Mono N Type Wafer - 182(-183\.75)?mm \/.*\(RMB\)$/i, /^Mono P Type Wafer - 182(-183\.75)?mm \/.*\(RMB\)$/i, /^Mono Wafer - 182mm \/.*\(RMB\)$/i] },
  { k: 'ges_hucre_usd', ad: 'Hücre — TOPCon 182 mm, Çin ihraç ($/W)', birim: '$/W', ar: [0.015, 0.4],
    d: [/^TOPCon Cell - China export - 182/i, /^TOPCon Cell - 182[^(]*\(USD\)$/i, /^Mono PERC Cell - 182[^(]*\(USD\)$/i] },
  { k: 'ges_hucre_rmb', ad: 'Hücre — TOPCon 182 mm, Çin iç piyasa (RMB/W)', birim: 'RMB/W', ar: [0.1, 3],
    d: [/^TOPCon Cell - 182[^(]*\(RMB\)$/i, /^Mono PERC Cell - 182[^(]*\(RMB\)$/i] },
  { k: 'ges_modul_usd', ad: 'Modül — TOPCon çift yüzlü, Çin dışı piyasalar ($/W)', birim: '$/W', ar: [0.05, 0.6],
    d: [/^(182\*182-210mm\/210mm |182\*182-210mm |182mm )Mono TOPCon Module \(USD\)$/i, /^(182\*182-210mm |182mm )Mono PERC Module \(USD\)$/i] },
  { k: 'ges_modul_rmb', ad: 'Modül — TOPCon çift yüzlü, Çin iç piyasa (RMB/W)', birim: 'RMB/W', ar: [0.4, 4],
    d: [/^(182\*182-210mm\/210mm |182\*182-210mm |182mm )Mono TOPCon Module \(RMB\)$/i, /^(182\*182-210mm |182mm )Mono PERC Module \(RMB\)$/i] },
  { k: 'ges_modul_avrupa_usd', ad: 'Modül — TOPCon, Avrupa projeleri, Çin üretimi ($/W)', birim: '$/W', ar: [0.05, 0.6],
    d: [/^TOPCon Module - Europe projects - China made/i, /Mono TOPCon - EU \(USD\)$/i, /Mono PERC ?- ?EU ?\(USD\)$/i] },
  { k: 'ges_modul_abd_usd', ad: 'Modül — TOPCon, ABD projeleri ($/W)', birim: '$/W', ar: [0.1, 1.2],
    d: [/^TOPCon Module - US projects - SEA made/i, /Mono TOPCon - US \(USD\)$/i, /Mono PERC ?- ?US ?\(USD\)$/i] },
];
function gesZincir(H, tanim) {
  const tarihler = Object.keys(H).sort();
  const bul = (sat, re) => { for (const e of Object.keys(sat)) if (re.test(e)) return sat[e]; return null; };
  /* her desen için tarih → değer */
  const kat = tanim.d.map(re => { const o = {}; for (const t of tarihler) { const v = bul(H[t], re); if (v != null) o[t] = v; } return o; });
  const out = {}, oranlar = [];
  for (const t of Object.keys(kat[0])) out[t] = kat[0][t];
  for (let i = 1; i < kat.length; i++) {
    /* bir önceki katmanla (zincirin şimdiye kadarki hâli) örtüşme medyan oranı */
    const ort = Object.keys(kat[i]).filter(t => out[t] != null).map(t => out[t] / kat[i][t]).sort((a, b) => a - b);
    const ilkOut = Object.keys(out).sort()[0];
    if (!ilkOut) { for (const t of Object.keys(kat[i])) out[t] = kat[i][t]; if (Object.keys(kat[i]).length) oranlar.push('k' + i + ':başlangıç'); continue; }
    let med;
    if (ort.length) med = ort[Math.floor(ort.length / 2)];
    else med = 1;   /* InfoLink aynı ürünün satır adını değiştirdi ("TOPCon Cell - 182" → "…China export - 182", "Chunk" → "Mono-grade"); teknoloji geçişlerinde (PERC→TOPCon) tabloda daima örtüşme var → medyan oran */
    let eklenen = 0;
    for (const t of Object.keys(kat[i])) if (out[t] == null && t < ilkOut) { out[t] = kat[i][t] * med; eklenen++; }
    if (eklenen) oranlar.push(ort.length ? 'k' + i + ' ×' + med.toFixed(3) + ' (' + ort.length + ' örtüşme, ' + eklenen + ' hafta)' : 'k' + i + ' ad değişimi, oran 1 (' + eklenen + ' hafta)');
  }
  const hafta = Object.entries(out).filter(([t, v]) => v >= tanim.ar[0] && v <= tanim.ar[1]).sort((a, b) => a[0] < b[0] ? -1 : 1);
  return { hafta, oranlar, ilkEtiket: kat.findIndex(o => Object.keys(o).length) };
}
async function gesFiyat() {
  const dosya = 'sektor-surucu.json';
  if (!(await varMi(dosya))) { raporlar.push('### GES zinciri fiyatları (§483) — ⏭ sektor-surucu.json yok'); return; }
  const D = await oku(dosya); D.seriler = D.seriler || {};
  let G = D.ges;
  if (!G || G.surum !== GES_SURUM) G = D.ges = { surum: GES_SURUM, hafta: {}, wb: {}, _not: 'InfoLink spot fiyat tablosu (ortalama sütunu) — hafta: yayın tarihi → {InfoLink satır adı: ortalama}; wb: işlenmiş Wayback görüntü zaman damgaları' };
  const uyku = ms => new Promise(r => setTimeout(r, ms));
  const uyari = [], notlar = []; let yeni = 0;
  const al = async (u, ms) => { const r = await fetch(u, { headers: GES_H, signal: AbortSignal.timeout(ms || 30000) }); if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); };
  const isle = (c, kaynak) => { if (!c.tarih || c.n < 5) return false; if (!G.hafta[c.tarih]) yeni++; G.hafta[c.tarih] = Object.assign({}, G.hafta[c.tarih] || {}, c.sat); return true; };
  /* 1) canlı sayfa */
  let canli = null;
  try { const c = gesCoz(await al(GES_URL)); if (isle(c, 'canlı')) canli = c; else uyari.push('canlı sayfa çözülemedi (tarih ' + c.tarih + ', ' + c.n + ' satır) — tablo yapısı değişmiş olabilir'); }
  catch (e) { uyari.push('infolink-group.com: ' + String(e && e.message || e).slice(0, 90)); }
  /* 2) Wayback geriye doldurma (artımlı) */
  const t0 = Date.now();   /* InfoLink arşivi ≤120 sn, PVinsights arşivi toplam ≤200 sn (olcKos tavanı 4 dk) */
  let wbToplam = 0, wbBu = 0, wbBekleyen = 0, wbHata = false, sinir429 = 0, n429 = 0;   /* §483c: archive.org hız sınırı (429) — görüntü 'hatalı' sayılmaz, 10 sn bekle; 3 ardışık 429'da bu koşu arşiv durur */
  try {
    const cdx = JSON.parse(await al('https://web.archive.org/cdx/search/cdx?url=infolink-group.com/spot-price/&output=json&fl=timestamp&filter=statuscode:200&collapse=timestamp:8', 60000));
    const ts = (Array.isArray(cdx) ? cdx.slice(1) : []).map(x => x[0]).filter(Boolean).sort().reverse();
    wbToplam = ts.length;
    try { for (const t of ts) {
      if (G.wb[t] === 1 || (G.wb[t] || 0) <= -3) continue;
      if (wbBu >= GES_WB_TAVAN || Date.now() - t0 > GES_SURE_MS) { wbBekleyen++; continue; }   /* olcKos katman tavanı 4 dk: aşılırsa iş yarıda bırakılır ve DOSYA YAZILMAZ → kendi süre sınırı */
      if (sinir429 >= 3) { wbBekleyen++; continue; }
      try { const c = gesCoz(await al('https://web.archive.org/web/' + t + 'id_/' + GES_URL, 25000)); isle(c, 'wb'); G.wb[t] = 1; sinir429 = 0; }
      catch (e) { const m = String(e && e.message || e); if (/HTTP 429/.test(m)) { sinir429++; n429++; await uyku(10000); } else { G.wb[t] = (typeof G.wb[t] === 'number' && G.wb[t] < 0 ? G.wb[t] : 0) - 1; if (uyari.length < 12) uyari.push('wayback ' + t + ': ' + m.slice(0, 60)); } }
      wbBu++; await uyku(GES_WB_UYKU);
    } } finally { wbBekleyen = ts.filter(t => !(G.wb[t] === 1 || (G.wb[t] || 0) <= -3)).length; }
  } catch (e) { wbHata = true; uyari.push('wayback CDX: ' + String(e && e.message || e).slice(0, 90)); }
  /* 3) §483b PVinsights: canlı (düz http) → olmazsa arşivin son görüntüsü; geçmiş Wayback artımlı (aynı süre bütçesi, InfoLink'ten sonra) */
  G.pv = G.pv || { hafta: {}, wb: {} };
  sinir429 = Math.min(sinir429, 2);
  let pvCanli = null, pvToplam = 0, pvBu = 0, pvBekleyen = 0, pvHata = false, pvYeni = 0;
  const pvIsle = c => { if (!c.tarih || c.n < 5) return false; if (!G.pv.hafta[c.tarih]) pvYeni++; G.pv.hafta[c.tarih] = Object.assign({}, G.pv.hafta[c.tarih] || {}, c.sat); return true; };
  try { const c = pvCoz(await al(PV_URL, 20000)); if (pvIsle(c)) pvCanli = c; else uyari.push('pvinsights canlı sayfa çözülemedi (tarih ' + c.tarih + ', ' + c.n + ' satır)'); }
  catch (e) { uyari.push('pvinsights.com: ' + String(e && e.message || e).slice(0, 80) + ' → arşiv'); }
  try {
    const cdx = JSON.parse(await al('https://web.archive.org/cdx/search/cdx?url=pvinsights.com/&output=json&fl=timestamp&filter=statuscode:200&collapse=timestamp:8&from=2022', 60000));
    const ts = (Array.isArray(cdx) ? cdx.slice(1) : []).map(x => x[0]).filter(Boolean).sort().reverse();
    pvToplam = ts.length;
    try { for (const t of ts) {
      if (G.pv.wb[t] === 1 || (G.pv.wb[t] || 0) <= -3) continue;
      if (pvBu >= GES_WB_TAVAN || Date.now() - t0 > PV_SURE_MS) { pvBekleyen++; continue; }
      if (sinir429 >= 3) { pvBekleyen++; continue; }
      try { pvIsle(pvCoz(await al('https://web.archive.org/web/' + t + 'id_/' + PV_URL, 25000))); G.pv.wb[t] = 1; sinir429 = 0; }
      catch (e) { const m = String(e && e.message || e); if (/HTTP 429/.test(m)) { sinir429++; n429++; await uyku(10000); } else { G.pv.wb[t] = (typeof G.pv.wb[t] === 'number' && G.pv.wb[t] < 0 ? G.pv.wb[t] : 0) - 1; if (uyari.length < 12) uyari.push('pvinsights arşiv ' + t + ': ' + m.slice(0, 60)); } }
      pvBu++; await uyku(GES_WB_UYKU);
    } } finally { pvBekleyen = ts.filter(t => !(G.pv.wb[t] === 1 || (G.pv.wb[t] || 0) <= -3)).length; }
  } catch (e) { pvHata = true; uyari.push('pvinsights CDX: ' + String(e && e.message || e).slice(0, 80)); }
  yeni += pvYeni;
  const H = G.hafta, ht = Object.keys(H).sort();
  if (!ht.length && !Object.keys(G.pv.hafta).length) { raporlar.push('### GES zinciri fiyatları (§483) — ✗ veri yok\n- ' + uyari.slice(0, 6).join('\n- ')); return; }
  /* RMB → $ (Yahoo CNY=X, USD başına CNY) — ay ortalaması */
  let cny = new Map(); try { const h = await yahooSeri(['CNY=X'], '', '10y'); cny = h['CNY=X'] || new Map(); } catch (e) {}
  const cnyAy = {}; { const top = {}, say = {}; for (const [t, v] of cny) { if (!(v > 5 && v < 9)) continue; const a = t.slice(0, 7); top[a] = (top[a] || 0) + v; say[a] = (say[a] || 0) + 1; } for (const a in top) cnyAy[a] = top[a] / say[a]; }
  const cnyAl = a => cnyAy[a] || cnyAy[Object.keys(cnyAy).filter(x => x <= a).sort().pop()] || 7.1;
  const KAYNAK = 'InfoLink Consulting haftalık spot (infolink-group.com/spot-price, ortalama sütunu) · geçmiş: Internet Archive görüntüleri (Actions §483) · ay ortalaması';
  const ozet = {};
  const yazSeri = (tanim, hafta, oranlar, ekMeta) => {
    if (!hafta.length) return null;
    const top = {}, say = {}; for (const [t, v] of hafta) { const a = t.slice(0, 7); top[a] = (top[a] || 0) + v; say[a] = (say[a] || 0) + 1; }
    const hassas = tanim.birim.includes('/W') ? 4 : (tanim.birim.includes('adet') ? 3 : 2);
    const aylik = {}; for (const a of Object.keys(top).sort()) aylik[a] = +(top[a] / say[a]).toFixed(hassas);
    const son = hafta[hafta.length - 1], onceki = D.seriler[tanim.k];
    if (onceki && onceki.son && onceki.son.tarih > son[0]) { uyari.push(tanim.k + ': gerileme korundu'); return onceki.son; }
    const gun = t => new Date(t + 'T00:00:00Z').getTime() / 864e5, hedefG = gun(son[0]) - 365;
    const yil = hafta.filter(([t]) => Math.abs(gun(t) - hedefG) <= 45).sort((a, b) => Math.abs(gun(a[0]) - hedefG) - Math.abs(gun(b[0]) - hedefG))[0];   /* ±45 gün içinde en yakın hafta; arşiv seyrekse y/y yok */
    D.seriler[tanim.k] = Object.assign({}, onceki || {}, { ad: tanim.ad, birim: tanim.birim, hisse: tanim.hisse || ['CWENE', 'GESAN'], kaynak: tanim.kaynak || KAYNAK, zincir: oranlar }, ekMeta || {}, {
      siklik: 'aylik', aylik, haftalik: hafta.slice(-104).map(([t, v]) => [t, +v.toFixed(hassas)]), son: { tarih: son[0], deger: +son[1].toFixed(hassas), yillik_degisim: yil ? +((son[1] / yil[1] - 1) * 100).toFixed(1) : null }, ilk: hafta[0][0], guncelleme: bugun });
    ozet[tanim.k] = D.seriler[tanim.k].son; return D.seriler[tanim.k].son;
  };
  for (const tn of GES_SERI) {
    const z = gesZincir(H, tn);
    const meta = {};
    if (tn.k === 'ges_modul_avrupa_usd') { meta.hisse = ['CWENE', 'GESAN']; meta._not = 'TR üreticisinin Avrupa\'daki rakip fiyatı (Çin malı FOB). Türkiye\'de Çin modülüne ek gümrük vergisi/anti-damping uygulanır → yurt içi fiyat bunun üstünde; makas korunma ölçüsüdür.'; }
    if (tn.k === 'ges_modul_abd_usd') { meta.hisse = ['CWENE']; meta._not = 'ABD pazarı tarife duvarı arkasında (AD/CVD, Section 201/301) → Çin\'in 2–3 katı. CW Enerji\'nin ABD yatırımı bu fiyat bandına bakar.'; }
    if (tn.k === 'ges_hucre_usd') meta._not = 'Modül üreticisinin ana girdisi (modül maliyetinin ~%50–60\'ı). Türkiye\'de hücre üretimi sınırlı → ithal hücre fiyatı ≈ maliyet.';
    if (tn.k === 'ges_polisilikon_rmb') meta._not = 'Zincirin en üstü; Çin aşırı kapasitesinin termometresi. Polisilikon → wafer → hücre → modül fiyat geçişi 1–3 ay gecikmeli.';
    yazSeri(tn, z.hafta, z.oranlar, meta);
    notlar.push(tn.k.replace('ges_', '') + ' ' + z.hafta.length + ' hafta' + (z.oranlar.length ? ' [' + z.oranlar.join(', ') + ']' : ''));
  }
  /* RMB modül → $ (iç piyasa fiyatını ihraçla aynı birimde görmek için) */
  const mR = D.seriler.ges_modul_rmb;
  if (mR && Array.isArray(mR.haftalik)) {
    const hR = gesZincir(H, GES_SERI.find(x => x.k === 'ges_modul_rmb')).hafta.map(([t, v]) => [t, v / cnyAl(t.slice(0, 7))]);
    yazSeri({ k: 'ges_modul_cin_usd', ad: 'Modül — TOPCon, Çin iç piyasa ($/W, RMB ÷ USD/CNY)', birim: '$/W', ar: [0.05, 0.6] }, hR, ['RMB ÷ Yahoo CNY=X ay ort.'], { _not: 'Çin iç piyasa fiyatı (KDV dahil teslim) $ cinsinden; ihraç FOB ile fark = Çin iç talebi/ihracat iadesi etkisi.' });
  }
  /* türetilmiş: montaj makası = modül − hücre ($/W), haftalık eşleşen tarihlerden */
  const A = D.seriler.ges_modul_usd, B = D.seriler.ges_hucre_usd;
  if (A && B) {
    const zA = gesZincir(H, GES_SERI.find(x => x.k === 'ges_modul_usd')).hafta, zB = new Map(gesZincir(H, GES_SERI.find(x => x.k === 'ges_hucre_usd')).hafta);
    const tum = zA.filter(([t]) => zB.has(t)).map(([t, v]) => [t, v - zB.get(t)]);
    yazSeri({ k: 'ges_montaj_makasi_usd', ad: 'GES montaj makası — modül − hücre ($/W)', birim: '$/W', ar: [-0.2, 0.4], hisse: ['CWENE'] }, tum, ['türetilmiş: ges_modul_usd − ges_hucre_usd (aynı hafta)'],
      { _not: 'Hücre alıp modül birleştiren üreticinin brüt kazancı/W (cam, çerçeve, EVA, işçilik bu makastan karşılanır). Daralma = Çin fiyat baskısı montajcıya geçiyor.' });
  }
  const PVK = 'PVinsights haftalık spot (pvinsights.com ana sayfa, ortalama sütunu, $ KDV hariç) · geçmiş: Internet Archive görüntüleri (Actions §483b) · ay ortalaması';
  const pvNot = [];
  for (const tn of PV_SERI) { const z = gesZincir(G.pv.hafta, tn); yazSeri(Object.assign({ kaynak: PVK }, tn), z.hafta, z.oranlar, { _not: 'İkinci kaynak (InfoLink ile yön teyidi). PVinsights fiyatı Çin spot ağırlıklı, KDV hariç; InfoLink Çin dışı satırlarından düşük olması tanım farkıdır.' }); pvNot.push(tn.k.replace('ges_pvi_', '') + ' ' + z.hafta.length + (z.oranlar.length ? ' [' + z.oranlar.join(', ') + ']' : '')); }
  { const zA = gesZincir(G.pv.hafta, PV_SERI[3]).hafta, zB = new Map(gesZincir(G.pv.hafta, PV_SERI[2]).hafta); const tum = zA.filter(([t]) => zB.has(t)).map(([t, v]) => [t, v - zB.get(t)]);
    yazSeri({ k: 'ges_pvi_montaj_makasi_usd', ad: 'GES montaj makası — modül − hücre, PVinsights ($/W)', birim: '$/W', ar: [-0.2, 0.4], hisse: ['CWENE'], kaynak: PVK }, tum, ['türetilmiş: ges_pvi_modul_usd − ges_pvi_hucre_usd (aynı hafta)'], { _not: 'InfoLink makasının ikinci kaynaktan teyidi; iki makas aynı yöne gidiyorsa sinyal güçlü.' }); }
  const pt = Object.keys(G.pv.hafta).sort();
  D.seriler_guncelleme = bugun;
  await yaz(dosya, D);
  if (yeni) degisenler.push('GES zinciri fiyatları (' + yeni + ' hafta)');
  const g = (k, b) => ozet[k] ? ozet[k].deger + (b || '') + (ozet[k].yillik_degisim != null ? ' (y/y ' + (ozet[k].yillik_degisim > 0 ? '+' : '') + ozet[k].yillik_degisim + '%)' : '') : '—';
  raporlar.push('### GES zinciri fiyatları (§483) — ' + (canli ? '✓ ' + canli.tarih : '⚠ canlı sayfa yok') + ' · modül ' + g('ges_modul_usd', ' $/W') + ' · hücre ' + g('ges_hucre_usd', ' $/W') + ' · polisilikon ' + g('ges_polisilikon_rmb', ' RMB/kg') + ' · montaj makası ' + g('ges_montaj_makasi_usd', ' $/W') +
    '\n- arşiv: ' + ht.length + ' hafta (' + ht[0] + '→' + ht[ht.length - 1] + ') · Wayback ' + wbToplam + ' görüntü, bu koşu ' + wbBu + (wbHata ? ' · ⚠ arşive ulaşılamadı (sonraki koşu dener)' : wbBekleyen ? ' · ' + wbBekleyen + ' görüntü sonraki koşulara' : ' · geriye doldurma TAMAM') +
    '\n- ' + notlar.join(' · ') + ' · CNY kuru ' + cny.size + ' gün' +
    (n429 ? '\n- archive.org hız sınırı (HTTP 429) ×' + n429 + ' — görüntüler sonraki koşulara (hata sayılmadı)' : '') +
    '\n- PVinsights (§483b): ' + (pvCanli ? '✓ canlı ' + pvCanli.tarih : '⚠ canlı sayfa yok (arşivle)') + ' · modül ' + g('ges_pvi_modul_usd', ' $/W') + ' · hücre ' + g('ges_pvi_hucre_usd', ' $/W') + ' · polisilikon ' + g('ges_pvi_polisilikon_usd', ' $/kg') + ' · makas ' + g('ges_pvi_montaj_makasi_usd', ' $/W') +
    ' · arşiv ' + pt.length + ' hafta' + (pt.length ? ' (' + pt[0] + '→' + pt[pt.length - 1] + ')' : '') + ' · Wayback ' + pvToplam + ' görüntü, bu koşu ' + pvBu + (pvHata ? ' · ⚠ arşive ulaşılamadı' : pvBekleyen ? ' · ' + pvBekleyen + ' sonraki koşulara' : ' · geriye doldurma TAMAM') + ' · ' + pvNot.join(' · ') +
    (uyari.length ? '\n- ⚠ ' + uyari.slice(0, 6).join('\n- ⚠ ') : ''));
}

/* ── §484 ELLE ÇEYREK SERİLERİ — şirket beyanı, otomatik kaynağı olmayan sürücüler ─────────────────────────────────────
   Çıkış (21 Eki): TKFEN taahhüt tarafı için sipariş akışı arandı. Tekfen KAP'a "Yeni İş İlişkisi" bildirimi YAPMIYOR (2023→ ÖDA
   taraması: yalnız Finansal Duran Varlık Edinimi / Özel Durum (Genel) / Rusya projesi) → §469 KAP akışı boş kalırdı. Bunun yerine
   çeyrek faaliyet raporundaki cümle kullanılır: "Mühendislik ve Taahhüt Grubu'nun [tarih] itibarıyla devam eden projelerinde kalan
   işlerin parasal toplamı yaklaşık X milyon ABD doları" (Fintables faaliyet raporu araması, 21 Eki):
     2025Q1 732 (s.8) · 2025Q2 640 (s.9) · 2025Q3 686 (s.7) · 2026Q2 413 (s.8; %62 Hazar, %34 Orta Doğu · %66 endüstri, %32 boru hattı).
     2025Q4 ve 2026Q1 raporlarında aynı cümle Fintables'ta bulunamadı → BOŞ bırakıldı (uydurulmaz). Yıllık yeni iş: 2024 446 mn $.
   RİTÜEL: her bilanço haftası TKFEN faaliyet raporu → ELLE_CEYREK.tkfen_backlog.ceyreklik'e satır. Kod tablosu dosyadakini EZER
   (düzeltme koddan yapılır). Seri 'ceyreklik' taşır → panel çeyrek değerini doğrudan okur (kararSeriStat). */
const ELLE_CEYREK = {
  tkfen_backlog: { ad: 'Tekfen taahhüt bakiye iş (backlog) — kalan işlerin parasal toplamı (mn $, çeyrek sonu; elle)', birim: 'mn $', hisse: ['TKFEN'],
    ceyreklik: { '2025Q1': 732, '2025Q2': 640, '2025Q3': 686, '2026Q2': 413 },
    yillik_yeni_is: { '2024': 446 },
    kaynak: 'TKFEN çeyrek faaliyet raporları ("kalan işlerin parasal toplamı") — elle (§484)',
    _not: 'Taahhüt gelirinin öncü göstergesi: bakiye eriyip yeni iş gelmezse 2–4 çeyrek sonra taahhüt hasılatı düşer. 2025Q1 732 → 2026Q2 413 mn $ (−%44) = yeni iş girişi tamamlanan işin gerisinde. 2025Q4/2026Q1 değeri raporda bulunamadı (boş).' },
};
/* §485 ASGARİ ÜCRET ADIM SERİSİ (GRSEL/TUREX/BIMAS/MAVI işçilik maliyeti). Brüt aylık TL, yürürlük tarihi (Asgari Ücret Tespit Komisyonu
   kararı, Resmî Gazete). Kaynak 21 Eki 2026 web: muhasebetr.com asgari ücret tablosu + KPMG 2026 bülteni (brüt 33.030, net 28.075,50; işveren
   maliyeti teşviksiz 40.874,63) · gzt.com 15 Tem 2026: "Temmuz 2026'da ara zam kararı yok". Yeni karar → ASGARI_UCRET'e satır (yıl sonu ritüeli).
   Seri: aylık adım (her ay yürürlükteki tutar) + asgari_ucret_reel = brüt ÷ TÜFE (2025=100 zincirli) × 100 — reel işçilik maliyeti. */
const ASGARI_UCRET = [['2021-01-01', 3577.50], ['2022-01-01', 5004.00], ['2022-07-01', 6471.00], ['2023-01-01', 10008.00], ['2023-07-01', 13414.50], ['2024-01-01', 20002.50], ['2025-01-01', 26005.50], ['2026-01-01', 33030.00]];
function asgariUcretYaz(D) {
  const ad = []; const bitis = bugun.slice(0, 7);
  for (let y = 2021, m = 1; (y + '-' + String(m).padStart(2, '0')) <= bitis; m === 12 ? (y++, m = 1) : m++) { const a = y + '-' + String(m).padStart(2, '0'); const st = ASGARI_UCRET.filter(([t]) => t.slice(0, 7) <= a).pop(); if (st) ad.push([a, st[1]]); }
  const T = aylikTuret(new Map(ad)); const sonAy = ad[ad.length - 1][0];
  const adimlar = ASGARI_UCRET.map(([t, v], i) => ({ t, brut: v, artis: i ? +((v / ASGARI_UCRET[i - 1][1] - 1) * 100).toFixed(1) : null })).reverse();
  D.seriler.asgari_ucret = Object.assign({}, D.seriler.asgari_ucret || {}, { ad: 'Asgari ücret — brüt aylık (TL, yürürlükteki tutar; adım)', birim: 'TL', siklik: 'aylik', hisse: ['GRSEL', 'TUREX', 'BIMAS', 'MAVI'],
    kaynak: 'Asgari Ücret Tespit Komisyonu / Resmî Gazete — elle adım tablosu (tazele.mjs ASGARI_UCRET, §485)', aylik: T.aylik, ceyreklik: T.ceyreklik, yillik: T.yillik, adimlar, son: { tarih: sonAy, deger: ad[ad.length - 1][1] }, elle: true, guncelleme: bugun,
    _not: 'İşveren maliyeti ≈ brüt × 1,2375 (SGK işveren payı + işsizlik, teşviksiz). Yıl içinde sabit → çeyrek değişimi yalnız Ocak/Temmuz adımında; reel seri (÷TÜFE) yıl içi erimeyi gösterir.' });
  const tf = D.seriler.tufe && D.seriler.tufe.aylik; let reel = null;
  if (tf) { const m = new Map(); for (const [a, v] of ad) if (tf[a]) m.set(a, v / tf[a] * 100); if (m.size) { const R = aylikTuret(m); const ks = Object.keys(R.aylik); reel = ks[ks.length - 1];
    D.seriler.asgari_ucret_reel = Object.assign({}, D.seriler.asgari_ucret_reel || {}, { ad: 'Asgari ücret reel — brüt ÷ TÜFE (2025=100 fiyatlarıyla TL)', birim: 'TL (2025 fiyatı)', siklik: 'aylik', hisse: ['GRSEL', 'TUREX', 'BIMAS', 'MAVI'],
      kaynak: 'türetilmiş: asgari_ucret ÷ TCMB EVDS TÜFE (2025=100 zincirli) × 100 (§485)', aylik: R.aylik, ceyreklik: R.ceyreklik, yillik: R.yillik, son: { tarih: reel, deger: R.aylik[reel] }, guncelleme: bugun,
      _not: 'Ocak/Temmuz adımında sıçrar, ay ay TÜFE kadar erir. Maliyet tarafında okunur: reel ücret yükseliyorsa emek yoğun şirketin (servis, perakende) marjı sıkışır — fiyat eskalasyonu TÜFE ise.' }); } }
  return 'asgari_ucret ' + ad[ad.length - 1][1] + ' TL (' + sonAy + ', son adım ' + ASGARI_UCRET[ASGARI_UCRET.length - 1][0] + ')' + (reel ? ' · reel ' + D.seriler.asgari_ucret_reel.son.deger.toFixed(0) + ' (' + reel + ')' : ' · reel: TÜFE yok');
}
function elleCeyrekYaz(D) {
  const yazilan = [];
  for (const [k, t] of Object.entries(ELLE_CEYREK)) {
    const s = D.seriler[k] || {};
    const ceyreklik = Object.assign({}, s.ceyreklik || {}, t.ceyreklik);
    const qs = Object.keys(ceyreklik).sort(); if (!qs.length) continue;
    const sonQ = qs[qs.length - 1];
    D.seriler[k] = Object.assign(s, { ad: t.ad, birim: t.birim, hisse: t.hisse, kaynak: t.kaynak, _not: t._not, siklik: 'aylik', aylik: s.aylik || {}, ceyreklik,
      yillik_yeni_is: t.yillik_yeni_is, son: { tarih: sonQ, deger: ceyreklik[sonQ] }, elle: true, guncelleme: s.guncelleme || bugun });
    yazilan.push(k + ' ' + sonQ + ' = ' + ceyreklik[sonQ] + ' ' + t.birim + ' (' + qs.length + ' çeyrek)');
  }
  return yazilan;
}
async function elleSeriler() {
  const dosya = 'sektor-surucu.json';
  if (!(await varMi(dosya))) { raporlar.push('### Elle çeyrek serileri (§484) — ⏭ sektor-surucu.json yok'); return; }
  const D = await oku(dosya); D.seriler = D.seriler || {};
  const once = JSON.stringify([Object.keys(ELLE_CEYREK).map(k => D.seriler[k] && D.seriler[k].ceyreklik), D.seriler.asgari_ucret && D.seriler.asgari_ucret.aylik, D.seriler.asgari_ucret_reel && D.seriler.asgari_ucret_reel.aylik]);
  const y = elleCeyrekYaz(D);
  try { y.push(asgariUcretYaz(D)); } catch (e) { y.push('asgari_ucret ✗ ' + String(e && e.message || e).slice(0, 80)); }
  const sonra = JSON.stringify([Object.keys(ELLE_CEYREK).map(k => D.seriler[k] && D.seriler[k].ceyreklik), D.seriler.asgari_ucret && D.seriler.asgari_ucret.aylik, D.seriler.asgari_ucret_reel && D.seriler.asgari_ucret_reel.aylik]);
  if (once !== sonra) { await yaz(dosya, D); degisenler.push('elle çeyrek serileri (' + y.length + ')'); }
  raporlar.push('### Elle seriler (§484 backlog · §485 asgari ücret) — ✓ ' + y.join(' · ') + (once === sonra ? ' · değişiklik yok' : ''));
}

/* ── §486 TÜİK İNŞAAT MALİYET ENDEKSİ (veri portalı SDMX → JSON-stat) ─────────────────────────────────────────────
   Çıkış (21 Eki): kullanıcı TÜİK Veri Portalı İME bültenini gösterdi (Ağu 2026: yıllık %29,59, malzeme %28,72, işçilik %31,20).
   EVDS'de İME YOK (§485 araması). Bülten API'si /api/tr/press/58205 'statisticalTables' alanında dataflow verir:
   TR,DF_UFE_INSAAT_V1,1.0 (databrowser2.tuik.gov.tr). Veri ucu (Chrome'da ölçüldü, anahtar/çerez gerekmez):
     POST https://databrowser2.tuik.gov.tr/api/core/nodes/1/datasets/TR,DF_UFE_INSAAT_V1,1.0/data   gövde '[]'  → JSON-stat 2.0
     (~1 MB; boyutlar REF_AREA · INDICATOR · DEGISIM[1 endeks, 2 aylık %, 3 aralığa %, 4 yıllık %, 5 12 ay ort. %] · BASE_PER 2015 ·
     FREQ M · MALIYET_GRUP[_T, 1 malzeme, 2 işçilik] · FAALIYET_CPA_2_1[F, F41, F41001 ikamet, F41002, F42, F421, F422, F429] ·
     FAAL_GRUP[_T,4,5,7 hiyerarşi düzeyi — her CPA tek düzeyde dolu] · TIME_PERIOD 2015-01→).
   Doğrulama: F toplam 2026-08 2.501,40 / 2025-08 1.930,24 = +%29,59 = bülten ✓ (malzeme +28,72 ✓ · işçilik +31,20 ✓).
   Yalnız DEGISIM=1 (endeks) alınır, değişimler panelde hesaplanır. Seriler: ime_konut (F41001 toplam), ime_konut_malzeme,
   ime_konut_iscilik, ime_insaat (F toplam) + TÜRETİLMİŞ ekgyo_kfe_ime = KFE ÷ İME konut (2021-01=100): konut FİYATI / konut MALİYETİ
   → geliştiricinin reel makası (EKGYO). Yayın: ayın ~9'u, 2 ay gecikmeli. Erişim: TÜİK yurt dışı IP'yi kısıtlarsa rapor ✗ yazar, dosya korunur. */
const TUIK_IME_URL = 'https://databrowser2.tuik.gov.tr/api/core/nodes/1/datasets/TR,DF_UFE_INSAAT_V1,1.0/data';
function jsonStatSeri(j, secim) {
  const ids = j.id, S = j.size, st = []; let m = 1; for (let i = S.length - 1; i >= 0; i--) { st[i] = m; m *= S[i]; }
  const pos = d => { const ix = j.dimension[d].category.index; return Array.isArray(ix) ? Object.fromEntries(ix.map((k, i) => [k, i])) : ix; };
  const P = Object.fromEntries(ids.map(d => [d, pos(d)]));
  const zaman = Object.entries(P.TIME_PERIOD).sort((a, b) => a[1] - b[1]).map(x => x[0]);
  const deg = (o, d) => { const ix = ids.indexOf(d); return ix; };
  const sabit = ids.map(d => d === 'TIME_PERIOD' ? null : (secim[d] != null ? P[d][secim[d]] : 0));
  if (sabit.some((v, i) => ids[i] !== 'TIME_PERIOD' && ids[i] !== 'FAAL_GRUP' && v == null)) return null;
  const tIx = ids.indexOf('TIME_PERIOD'), fIx = ids.indexOf('FAAL_GRUP');
  const deger = (p) => j.value[String(p.reduce((s, x, i) => s + x * st[i], 0))];
  /* FAAL_GRUP: CPA'nın dolu olduğu düzeyi bul (son dönemde değer veren ilk) */
  let fg = 0; if (fIx >= 0) { for (let f = 0; f < S[fIx]; f++) { const p = sabit.slice(); p[fIx] = f; p[tIx] = zaman.length - 1; if (deger(p) != null) { fg = f; break; } } }
  const out = new Map();
  zaman.forEach((t, k) => { const p = sabit.slice(); if (fIx >= 0) p[fIx] = fg; p[tIx] = k; const v = parseFloat(deger(p)); if (isFinite(v) && v > 0) out.set(t.slice(0, 7), v); });
  return out;
}
async function tuikIme() {
  const dosya = 'sektor-surucu.json';
  if (!(await varMi(dosya))) { raporlar.push('### TÜİK inşaat maliyet endeksi (§486) — ⏭ sektor-surucu.json yok'); return; }
  let j;
  try {
    const r = await fetch(TUIK_IME_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0 (KtPanel/1.0)', 'Origin': 'https://databrowser2.tuik.gov.tr', 'Referer': 'https://databrowser2.tuik.gov.tr/' }, body: '[]', signal: AbortSignal.timeout(60000) });
    if (!r.ok) throw new Error('HTTP ' + r.status + (r.status === 403 ? ' (TÜİK erişim engeli — yurt dışı IP?)' : ''));
    j = await r.json();
    if (!j || !Array.isArray(j.id) || !j.value) throw new Error('JSON-stat değil');
  } catch (e) { raporlar.push('### TÜİK inşaat maliyet endeksi (§486) — ✗ ' + String(e && e.message || e).slice(0, 140) + ' · dosya korundu'); return; }
  const D = await oku(dosya); D.seriler = D.seriler || {};
  const KAY = 'TÜİK İnşaat Maliyet Endeksi (2015=100) — databrowser2 SDMX TR,DF_UFE_INSAAT_V1 (Actions §486)';
  const TAN = [
    ['ime_konut', { FAALIYET_CPA_2_1: 'F41001', MALIYET_GRUP: '_T' }, 'İnşaat maliyet endeksi — ikamet amaçlı binalar, toplam (2015=100)', ['EKGYO'], 'Konut geliştiricinin birim maliyeti: malzeme (çimento, demir, beton, tesisat) + işçilik. Ağırlık ~%60–65 malzeme.'],
    ['ime_konut_malzeme', { FAALIYET_CPA_2_1: 'F41001', MALIYET_GRUP: '1' }, 'İnşaat maliyet endeksi — ikamet amaçlı binalar, malzeme (2015=100)', ['EKGYO'], 'Yİ-ÜFE alt kalemlerinden (çimento, demir-çelik, seramik, boya…) türetilir; çimento/çelik ÜFE ile birlikte okunur.'],
    ['ime_konut_iscilik', { FAALIYET_CPA_2_1: 'F41001', MALIYET_GRUP: '2' }, 'İnşaat maliyet endeksi — ikamet amaçlı binalar, işçilik (2015=100)', ['EKGYO'], 'SGK ücret verisinden; asgari ücret adımlarıyla (Ocak/Temmuz) sıçrar.'],
    ['ime_insaat', { FAALIYET_CPA_2_1: 'F', MALIYET_GRUP: '_T' }, 'İnşaat maliyet endeksi — inşaat toplam (bina + bina dışı, 2015=100)', ['EKGYO', 'AKCNS', 'CIMSA'], 'Genel inşaat maliyeti; bina dışı (yol, altyapı) dahil.'],
  ];
  const notlar = [], uyari = [];
  for (const [k, sec, ad, hisse, not] of TAN) {
    const m = jsonStatSeri(j, Object.assign({ DEGISIM: '1' }, sec));
    if (!m || m.size < 24) { uyari.push(k + ': seri çözülemedi (' + (m ? m.size : 0) + ' ay) — boyut kodu değişmiş olabilir'); continue; }
    const T = aylikTuret(m); const ks = Object.keys(T.aylik); const son = ks[ks.length - 1];
    const onceki = D.seriler[k]; if (onceki && onceki.son && onceki.son.tarih > son) { uyari.push(k + ': tarih geriledi, korundu'); continue; }
    D.seriler[k] = Object.assign({}, onceki || {}, { ad, birim: 'endeks', siklik: 'aylik', hisse, kaynak: KAY, _not: not, aylik: T.aylik, ceyreklik: T.ceyreklik, yillik: T.yillik, son: { tarih: son, deger: T.aylik[son] }, guncelleme: bugun });
    const gy = T.aylik[(+son.slice(0, 4) - 1) + son.slice(4)];
    notlar.push(k + ' ' + T.aylik[son].toFixed(1) + ' (' + son + (gy ? ', y/y ' + ((T.aylik[son] / gy - 1) * 100).toFixed(2) + '%' : '') + ')');
  }
  /* türetilmiş: KFE ÷ İME konut — geliştirici reel makası */
  try {
    const kfe = D.seriler.kfe && D.seriler.kfe.aylik, ime = D.seriler.ime_konut && D.seriler.ime_konut.aylik;
    if (kfe && ime) { const ortak = Object.keys(ime).filter(a => kfe[a] != null && a >= '2021-01').sort();
      if (ortak.length > 12) { const b = kfe[ortak[0]] / ime[ortak[0]]; const m = new Map(ortak.map(a => [a, 100 * (kfe[a] / ime[a]) / b])); const T = aylikTuret(m); const ks = Object.keys(T.aylik); const son = ks[ks.length - 1];
        D.seriler.ekgyo_kfe_ime = Object.assign({}, D.seriler.ekgyo_kfe_ime || {}, { ad: 'Konut fiyatı ÷ konut inşaat maliyeti (KFE ÷ İME ikamet, ' + ortak[0] + '=100)', birim: 'endeks', siklik: 'aylik', hisse: ['EKGYO'],
          kaynak: 'türetilmiş: TCMB KFE ÷ TÜİK İME F41001 (Actions §486)', _not: 'Geliştiricinin reel makası: >100 → konut fiyatı maliyetten hızlı artıyor (satılan projede marj genişler). Arsa maliyeti dahil değil; EKGYO arsa sahibi (gelir paylaşımı modeli) olduğu için yüklenici maliyeti dolaylı etkiler.',
          aylik: T.aylik, ceyreklik: T.ceyreklik, yillik: T.yillik, son: { tarih: son, deger: T.aylik[son] }, guncelleme: bugun });
        notlar.push('ekgyo_kfe_ime ' + T.aylik[son].toFixed(1) + ' (' + son + ')'); } }
    else uyari.push('ekgyo_kfe_ime: KFE (EVDS) ya da İME yok');
  } catch (e) { uyari.push('ekgyo_kfe_ime: ' + String(e && e.message || e).slice(0, 80)); }
  if (!notlar.length) { raporlar.push('### TÜİK inşaat maliyet endeksi (§486) — ✗ seri yazılamadı\n- ' + uyari.join('\n- ')); return; }
  D.seriler_guncelleme = bugun;
  await yaz(dosya, D);
  degisenler.push('TÜİK İME (' + notlar.length + ')');
  raporlar.push('### TÜİK inşaat maliyet endeksi (§486) — ✓ ' + notlar.join(' · ') + (uyari.length ? '\n- ⚠ ' + uyari.join('\n- ⚠ ') : ''));
}

/* ── §487 TÜİK GENİŞ TABLOLAR (databrowser2 JSON-stat, filtreli POST) + §488 PLASTICPORTAL PE/PP ──────────────────────
   §487 (21 Eki, kullanıcı "TÜİK'ten başka ne çekebiliriz → başla"): §486'daki uç (POST /api/core/nodes/1/datasets/TR,<DF>,1.0/data)
   gövdeye FİLTRE alır: [{"id":"URUN_UFE_NACE_CPA","filterValues":["C2016","C2351"]},{"id":"DEGISIM","filterValues":["1"]}] →
   31 MB'lık Yİ-ÜFE yerine ~40 KB (Chrome'da ölçüldü). 510 dataflow kataloğu /api/core/nodes/1/catalog. Seçilenler ve Eylül 2026 y/y
   (Chrome, canlı): Yİ-ÜFE 4 hane (EVDS'de yalnız 3 hane) C2016 plastik +45,6 · C2351 çimento +29,0 · C1073 makarna +18,4 · C2410
   demir-çelik +27,0 · C1320 dokuma kumaş +20,0 | YD-ÜFE (ihracat fiyatı) C2016 +33,5 · C2351 +21,6 · C1073 +18,7 · C2410 +26,8 |
   tarım ÜFE madde fiyatı buğday 15,82 TL/kg +18,8 | tarımsal girdi fiyat endeksi 20_3 gübre +28,8 | perakende satış hacmi
   (G47_FOOD gıda, G47_NF_CLTH giyim) | inşaat üretim endeksi | hizmet üretim endeksi (kara taşımacılığı).
   BOYUT SEÇİMİ: tanımda verilen kod; yoksa etiket/kod regex tercih listesi; 'son' = son kategori (yayım dönemi/vintage); hiçbiri
   yoksa '_T'/Toplam, o da yoksa ilk kategori. FAAL_GRUP (hiyerarşi düzeyi) otomatik: son dönemde değer veren ilk düzey.
   Bir tablo çözülemezse rapor boyut kodlarını ve etiketlerini yazar (uzaktan düzeltme için). TÜİK yurt dışı IP'yi keserse ✗, dosya korunur.
   TÜRETİLMİŞ: obams_makas = Yİ-ÜFE makarna ÷ buğday TL/kg (ilk ortak ay=100) · petkm_ufe_makas = Yİ-ÜFE plastik ÷ Brent TL.
   §488 PLASTICPORTAL (kullanıcı linki): plasticportal.eu/polymer-prices/<malzeme>/<id> sayfası HTML içinde
   `PlasticPricesChart.init({"2006-02-01":1.05,…})` ile 2006'dan beri AYLIK Orta Avrupa ortalama reçine fiyatını (€/kg, kaynak
   Plastech.pl) taşır (Chrome'da HDPE film 265 nokta, 2026-10 = 1,43 ölçüldü). Ekim 2026: HDPE film 1,43 · LDPE film 1,63 · LLDPE 1,48 ·
   PP homo 1,61 €/kg. Cloudflare "Just a moment" ön kontrolü var → yol: fetch → Playwright (tek bağlam, 2 deneme) → Wayback son
   görüntüsü (sayfa tüm geçmişi taşıdığı için eski görüntü bile geçmişi verir; son ayları eksik olabilir). Ay içinde birden çok kayıt
   (gün 01/02/03) → ay ortalaması. Seri pe_pp ($/t, PE+PP ortalaması × EURUSD) PETKM "PE/PP bekliyor" satırını doldurur;
   petkm_polimer_makas_usd = pe_pp − 7,5 × Brent ($/t ham petrol eşdeğeri; nafta vekili, seviye değil yön). */
const TUIK_DB = 'https://databrowser2.tuik.gov.tr/api/core/nodes/1/datasets/TR,';
const TUIK_TABLO = [
  { df: 'DF_YIUFE_EDO_V1', filtre: { URUN_UFE_NACE_CPA: ['C2016', 'C2351', 'C1073', 'C2410', 'C1320', 'C2015'], DEGISIM: ['1'] }, seriler: [
    ['ufe_plastik', { URUN_UFE_NACE_CPA: 'C2016', DEGISIM: '1' }, 'Yİ-ÜFE 20.16 birincil formda plastik (TÜİK, 2003=100)', ['PETKM'], 'Petkim\'in ürün grubunun YURT İÇİ satış fiyatı (PE/PP/PVC/PET…); TL endeks.'],
    ['ufe_cimento', { URUN_UFE_NACE_CPA: 'C2351', DEGISIM: '1' }, 'Yİ-ÜFE 23.51 çimento (TÜİK)', ['AKCNS', 'CIMSA'], 'Yalnız çimento (EVDS 3.14.5 kireç ve alçıyı da içerir).'],
    ['ufe_makarna', { URUN_UFE_NACE_CPA: 'C1073', DEGISIM: '1' }, 'Yİ-ÜFE 10.73 makarna, şehriye, kuskus (TÜİK)', ['OBAMS'], 'Yurt içi makarna üretici fiyatı.'],
    ['ufe_celik_2410', { URUN_UFE_NACE_CPA: 'C2410', DEGISIM: '1' }, 'Yİ-ÜFE 24.10 ana demir-çelik ürünleri (TÜİK)', ['EREGL', 'KRDMD', 'KCAER'], '4 hane; EVDS celik_ufe 3 hane (ferro alaşımlar dahil).'],
    ['ufe_kumas', { URUN_UFE_NACE_CPA: 'C1320', DEGISIM: '1' }, 'Yİ-ÜFE 13.20 dokuma kumaş (TÜİK)', ['MAVI'], 'Denim/kumaş girdisi.'],
    ['ufe_gubre_2015', { URUN_UFE_NACE_CPA: 'C2015', DEGISIM: '1' }, 'Yİ-ÜFE 20.15 kimyasal gübre ve azot bileşikleri (TÜİK)', ['GUBRF', 'TKFEN'], 'Yalnız gübre (EVDS 20.1 plastik + temel kimyasalı da içerir).'],
  ] },
  { df: 'DF_YDUFE_EDO_V1', filtre: { URUN_UFE_NACE_CPA: ['C2016', 'C2351', 'C1073', 'C2410'], DEGISIM: ['1'] }, seriler: [
    ['ydufe_plastik', { URUN_UFE_NACE_CPA: 'C2016', DEGISIM: '1' }, 'YD-ÜFE 20.16 plastik — ihracat fiyatı (TÜİK)', ['PETKM'], 'Yurt dışı satış fiyat endeksi (TL bazlı).'],
    ['ydufe_cimento', { URUN_UFE_NACE_CPA: 'C2351', DEGISIM: '1' }, 'YD-ÜFE 23.51 çimento — ihracat fiyatı (TÜİK)', ['AKCNS', 'CIMSA'], 'Yurt içi − ihracat fiyat farkı iç pazarın göreli kârlılığını gösterir.'],
    ['ydufe_makarna', { URUN_UFE_NACE_CPA: 'C1073', DEGISIM: '1' }, 'YD-ÜFE 10.73 makarna — ihracat fiyatı (TÜİK)', ['OBAMS'], 'Oba ihracat ağırlıklı.'],
    ['ydufe_celik', { URUN_UFE_NACE_CPA: 'C2410', DEGISIM: '1' }, 'YD-ÜFE 24.10 demir-çelik — ihracat fiyatı (TÜİK)', ['KCAER', 'EREGL', 'KRDMD'], 'Kocaer satışı ağırlıkla ihracat.'],
  ] },
  { df: 'DF_TARIM_URUNLERI_UFE_MADDE_FIYAT_V2', filtre: { TAORBA_2008_2_678: ['01_11_1', '01_13_5'] }, seriler: [
    ['bugday_tl', { TAORBA_2008_2_678: '01_11_1', UNIT_MEASURE: 'TRY_KG' }, 'Buğday — çiftçi satış fiyatı (TÜİK tarım ÜFE madde fiyatı, TL/kg)', ['OBAMS'], 'Yurt içi buğday fiyatı (TMO alım fiyatı ve piyasa). 2024-01\'den.', 'TL/kg'],
    /* §545: ATAKP ham madde — CPA 01.13.5 patates (kod ilk koşuda doğrulanır; gelmezse uyarı satırı, veri uydurulmaz) */
    ['patates_tl', { TAORBA_2008_2_678: '01_13_5', UNIT_MEASURE: 'TRY_KG' }, 'Patates — çiftçi satış fiyatı (TÜİK tarım ÜFE madde fiyatı, TL/kg) §545', ['ATAKP'], 'Atakey\'in ana ham maddesi; sözleşmeli tarım olsa da piyasa fiyatı maliyet çıpasıdır.', 'TL/kg'],
  ] },
  { df: 'DF_TARIMSAL_GIRDI_FIYAT_ENDEKSI_DEGISIM_V2', filtre: { TARIMSAL_FIYAT_1437: ['20_3'] }, seriler: [
    ['gubre_girdi', { TARIMSAL_FIYAT_1437: '20_3', DEGISIM: '1' }, 'Tarımsal girdi fiyat endeksi — gübre ve toprak geliştiriciler (TÜİK, 2020=100)', ['GUBRF', 'TKFEN'], 'Çiftçinin ödediği gübre fiyatı = gübre üreticisinin yurt içi satış fiyatının resmî ölçüsü.'],
  ] },
  { df: 'DF_TICARET_SATIS_HACIM_ENDEKS_O', filtre: { ACTIVITY: ['G47_FOOD', 'G47_NF_CLTH'] }, secim: { DEGISIM_TUR: [/^index|^endeks/i], SEASONAL_ADJUST: [/^calendar|^takvim/i, /^C$|^CA$/, /unadjusted|arındırılmamış|^N$/i], YAYIM_DONEMI: 'son' }, seriler: [
    ['perakende_gida_hacim', { ACTIVITY: 'G47_FOOD' }, 'Perakende satış hacim endeksi — gıda, içecek, tütün (TÜİK, takvim arındırılmış)', ['BIMAS'], 'Sabit fiyatlı hacim: enflasyondan arındırılmış sepet büyümesi.'],
    ['perakende_giyim_hacim', { ACTIVITY: 'G47_NF_CLTH' }, 'Perakende satış hacim endeksi — tekstil, giyim, ayakkabı (TÜİK, takvim arındırılmış)', ['MAVI'], 'Giyim perakendesinin reel hacmi.'],
  ] },
  { df: 'DF_INSAAT_URETIM_ENDEKS_V1_O', filtre: {}, secim: { SEASONAL_ADJUST: [/^calendar|^takvim/i, /^C$|^CA$/, /unadjusted|arındırılmamış|^N$/i], DEGISIM: [/^index|^endeks/i], DEGISIM_TUR: [/^index|^endeks/i], YAYIM_DONEMI: 'son' }, seriler: [
    ['insaat_uretim_bina', { ACTIVITY_NACE_REV2: [/^F41$/, /bina|building/i] }, 'İnşaat üretim endeksi — binalar (TÜİK, takvim arındırılmış)', ['AKCNS', 'CIMSA', 'EKGYO'], 'Çimento iç talebinin hacim ölçüsü.'],
    ['insaat_uretim_toplam', { ACTIVITY_NACE_REV2: [/^F$/, /toplam|total|inşaat$/i] }, 'İnşaat üretim endeksi — toplam (TÜİK)', ['AKCNS', 'CIMSA'], 'Bina + bina dışı.'],
  ] },
  { df: 'DF_HIZMET_URETIM_ENDEKS_O', filtre: {}, secim: { SEASONAL_ADJUST: [/^calendar|^takvim/i, /^C$|^CA$/, /unadjusted|arındırılmamış|^N$/i], DEGISIM: [/^index|^endeks/i], DEGISIM_TUR: [/^index|^endeks/i], YAYIM_DONEMI: 'son' }, seriler: [
    ['kara_tasima_hacim', { '*': [/^H49$/, /kara taşıma|land transport/i] }, 'Hizmet üretim endeksi — kara taşımacılığı H49 (TÜİK)', ['GRSEL', 'TUREX'], 'Servis/turizm taşımacılığının sektör hacmi.'],
  ] },
];
function tuikKatman(j) {
  const ids = j.id, S = j.size; const st = []; let m = 1; for (let i = S.length - 1; i >= 0; i--) { st[i] = m; m *= S[i]; }
  const kat = d => { const c = j.dimension[d].category; const ix = Array.isArray(c.index) ? c.index : Object.entries(c.index).sort((a, b) => a[1] - b[1]).map(x => x[0]); return ix.map((k, i) => ({ k, i, l: String((c.label || {})[k] || '') })); };
  return { ids, S, st, kat, deger: p => j.value[String(p.reduce((s, x, i) => s + x * st[i], 0))] };
}
function tuikSec(j, sabitSecim, ortak) {
  const K = tuikKatman(j); const { ids, S } = K; const tIx = ids.indexOf('TIME_PERIOD'), fIx = ids.indexOf('FAAL_GRUP');
  const zaman = K.kat('TIME_PERIOD').map(x => x.k);
  const tercih = (d, spec) => { const L = K.kat(d); if (spec === 'son') return L[L.length - 1].i; const sp = Array.isArray(spec) ? spec : [spec];
    for (const s of sp) { const x = L.find(c => s instanceof RegExp ? (s.test(c.k) || s.test(c.l)) : c.k === s); if (x) return x.i; } return null; };
  const p = ids.map(() => 0); const eksik = [];
  /* joker '*': hangi boyutta eşleşirse */
  const joker = sabitSecim['*'];
  ids.forEach((d, i) => {
    if (d === 'TIME_PERIOD' || d === 'FAAL_GRUP') return;
    let v = null;
    if (sabitSecim[d] != null) { v = tercih(d, sabitSecim[d]); if (v == null) eksik.push(d + '=' + String(sabitSecim[d])); }
    else if (joker && K.kat(d).some(c => joker.some(r => r.test(c.k) || r.test(c.l)))) v = tercih(d, joker);
    else if (ortak && ortak[d] != null) v = tercih(d, ortak[d]);
    if (v == null) { const L = K.kat(d); const t = L.find(c => c.k === '_T' || /^toplam$|^total$/i.test(c.l)); v = t ? t.i : 0; }
    p[i] = v;
  });
  if (eksik.length) return { hata: 'kod yok: ' + eksik.join(', ') };
  if (fIx >= 0) { for (let f = 0; f < S[fIx]; f++) { const q = p.slice(); q[fIx] = f; let n = 0; for (let t = Math.max(0, zaman.length - 6); t < zaman.length; t++) { q[tIx] = t; if (K.deger(q) != null) n++; } if (n) { p[fIx] = f; break; } } }
  const out = new Map();
  zaman.forEach((t, k) => { const q = p.slice(); q[tIx] = k; const v = parseFloat(K.deger(q)); if (isFinite(v) && v > 0) out.set(String(t).slice(0, 7), v); });
  return { m: out, secilen: ids.filter(d => d !== 'TIME_PERIOD').map((d, i) => d + ':' + (K.kat(d)[p[ids.indexOf(d)]] || {}).k).join(' ') };
}
const tuikBoyutOzet = j => { const K = tuikKatman(j); return K.ids.filter(d => d !== 'TIME_PERIOD').map(d => d + '[' + K.kat(d).slice(0, 8).map(c => c.k + (c.l ? '=' + c.l.slice(0, 18) : '')).join(',') + ']').join(' '); };
async function tuikGenis() {
  const dosya = 'sektor-surucu.json';
  if (!(await varMi(dosya))) { raporlar.push('### TÜİK geniş tablolar (§487) — ⏭ sektor-surucu.json yok'); return; }
  const D = await oku(dosya); D.seriler = D.seriler || {};
  const notlar = [], uyari = []; let erisim = 0;
  for (const T of TUIK_TABLO) {
    const govde = Object.entries(T.filtre || {}).map(([id, v]) => ({ id, filterValues: v }));
    let j;
    try {
      const r = await fetch(TUIK_DB + T.df + ',1.0/data', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0 (KtPanel/1.0)', 'Origin': 'https://databrowser2.tuik.gov.tr', 'Referer': 'https://databrowser2.tuik.gov.tr/' }, body: JSON.stringify(govde), signal: AbortSignal.timeout(60000) });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      j = await r.json(); if (!j || !Array.isArray(j.id)) throw new Error('JSON-stat değil'); erisim++;
    } catch (e) { uyari.push(T.df + ': ' + String(e && e.message || e).slice(0, 80)); continue; }
    for (const [k, sec, ad, hisse, not, birim] of T.seriler) {
      try {
        const R = tuikSec(j, sec, T.secim);
        if (R.hata || !R.m || R.m.size < 12) { uyari.push(k + ': ' + (R.hata || ((R.m ? R.m.size : 0) + ' ay')) + ' · boyutlar ' + tuikBoyutOzet(j).slice(0, 300)); continue; }
        const A = aylikTuret(R.m); const ks = Object.keys(A.aylik); const son = ks[ks.length - 1];
        const onceki = D.seriler[k]; if (onceki && onceki.son && onceki.son.tarih > son) { uyari.push(k + ': tarih geriledi, korundu'); continue; }
        D.seriler[k] = Object.assign({}, onceki || {}, { ad, birim: birim || 'endeks', siklik: 'aylik', hisse, kaynak: 'TÜİK databrowser2 SDMX TR,' + T.df + ' (' + R.secilen + ') — Actions §487', _not: not, aylik: A.aylik, ceyreklik: A.ceyreklik, yillik: A.yillik, son: { tarih: son, deger: A.aylik[son] }, guncelleme: bugun });
        const gy = A.aylik[(+son.slice(0, 4) - 1) + son.slice(4)];
        notlar.push(k + ' ' + (+A.aylik[son]).toFixed(2) + ' (' + son + (gy ? ', y/y ' + ((A.aylik[son] / gy - 1) * 100).toFixed(1) + '%' : '') + ')');
      } catch (e) { uyari.push(k + ': ' + String(e && e.message || e).slice(0, 80)); }
    }
  }
  /* türetilmiş makaslar */
  const oran = (k, aK, bK, ad, hisse, not, bDon) => { const A = D.seriler[aK] && D.seriler[aK].aylik, B0 = D.seriler[bK] && D.seriler[bK].aylik; const B = bDon ? bDon(B0) : B0; if (!A || !B) return;
    const ortak = Object.keys(A).filter(a => B[a] != null && B[a] > 0).sort(); if (ortak.length < 6) return;
    const b = A[ortak[0]] / B[ortak[0]]; const A2 = aylikTuret(new Map(ortak.map(a => [a, 100 * (A[a] / B[a]) / b]))); const ks = Object.keys(A2.aylik); const son = ks[ks.length - 1];
    D.seriler[k] = Object.assign({}, D.seriler[k] || {}, { ad: ad + ' (' + ortak[0] + '=100)', birim: 'endeks', siklik: 'aylik', hisse, kaynak: 'türetilmiş (Actions §487)', _not: not, aylik: A2.aylik, ceyreklik: A2.ceyreklik, yillik: A2.yillik, son: { tarih: son, deger: A2.aylik[son] }, guncelleme: bugun });
    notlar.push(k + ' ' + A2.aylik[son].toFixed(1) + ' (' + son + ')'); };
  try { oran('obams_makas', 'ufe_makarna', 'bugday_tl', 'Makarna fiyatı ÷ buğday fiyatı — Yİ-ÜFE 10.73 ÷ buğday TL/kg', ['OBAMS'], 'Makarnacının yurt içi brüt makası: >100 ve yükseliyorsa satış fiyatı girdiden hızlı artıyor. İhracat makası için YD-ÜFE makarna ÷ CBOT buğday da okunur.'); } catch (e) { uyari.push('obams_makas: ' + e.message); }
  try { oran('petkm_ufe_makas', 'ufe_plastik', 'brent_wb', 'Plastik yurt içi fiyatı ÷ Brent (TL) — Yİ-ÜFE 20.16 ÷ (Brent $ × USDTRY)', ['PETKM'], 'Nafta→polimer makasının TL vekili; yurt içi fiyat gücü. USDTRY ay sonu kuruyla.', B => { const fx = D.usdtry_ay_sonu || {}; const u = D.seriler.usdtry && D.seriler.usdtry.gunluk; const ay = {}; if (u) for (const [t, v] of u) { const a = t.slice(0, 7); (ay[a] = ay[a] || []).push(v); } const o = {}; for (const a of Object.keys(B || {})) { const k = ay[a] ? ay[a].reduce((s, x) => s + x, 0) / ay[a].length : (fx[a] || null); if (k) o[a] = B[a] * k; } return o; }); } catch (e) { uyari.push('petkm_ufe_makas: ' + e.message); }
  if (!erisim) { raporlar.push('### TÜİK geniş tablolar (§487) — ✗ hiçbir tablo gelmedi · dosya korundu\n- ' + uyari.slice(0, 6).join('\n- ')); return; }
  D.seriler_guncelleme = bugun; await yaz(dosya, D);
  degisenler.push('TÜİK tablolar (' + notlar.length + ')');
  raporlar.push('### TÜİK geniş tablolar (§487) — ✓ ' + erisim + '/' + TUIK_TABLO.length + ' tablo · ' + notlar.join(' · ') + (uyari.length ? '\n- ⚠ ' + uyari.slice(0, 8).join('\n- ⚠ ') : ''));
}
/* ── §488 PLASTICPORTAL ── */
const PP_MALZEME = [['hdpe-film/3', 'HDPE film'], ['ldpe-film/5', 'LDPE film'], ['lldpe-standard/6', 'LLDPE standart'], ['pp-homo/7', 'PP homo']];   /* §488b: 9 → 4 (bileşik pe_pp için gereken; ilk canlı koşuda 9 sayfa × 3 yol 4 dk tavanını aştı) */
const PP_SURE_MS = 150 * 1000;
/* §488d TOHUM (21 Eki 15:40): Actions'tan üç yol da kapalı çıktı (fetch 403 Cloudflare · Playwright geçemedi · Wayback Tem 2026 görüntüleri
   "init yok" = arşiv Cloudflare sayfasını kaydetmiş · Save Page Now 520). Seriler Chrome'da (gerçek tarayıcı, doğrulama geçti) okunup buraya
   gömüldü: aylık ortalama ×100 (€ sent/kg), bas = ilk ay, eksik = sitede veri olmayan aylar. Doğrulama: Eki 2026 HDPE film 1,43 · LDPE film
   1,63 · LLDPE 1,48 · PP homo 1,61 = site tablosu ✓. RİTÜEL: her ayın ~16'sı (site güncellemesi) Chrome'dan yeni ay → v dizisinin sonuna. Kod
   önce fetch/Playwright/Wayback dener; gelen aylar tohumu EZER. */
const PP_TOHUM = {"pp_hdpe_film_eur":{"bas":"2006-02","eksik":["2011-09","2015-11","2016-04","2016-08","2023-03","2025-12","2026-07"],"v":[105,105,109,112,114,114,119,123,123,119,117,117,118,119,122,126,126,127,126,126,128,124,126,124,128,124,120,122,125,142,142,134,119,83,69,70,74,84,83,82,83,97,98,105,95,94,94,100,107,106,107,105,105,104,106,106,105,108,111,121,125,132,134,132,122,115,120,117,114,114,120,131,140,140,132,125,123,140,150,144,136,140,139,140,137,135,126,127,128,131,137,132,132,135,137,133,132,132,134,135,138,138,136,137,134,131,118,117,133,152,160,167,163,152,146,138,145,141,135,138,138,138,132,132,130,129,126,130,136,135,134,133,128,120,120,122,122,119,120,120,122,119,120,120,125,125,126,126,130,128,124,122,123,125,128,127,127,121,119,115,118,114,112,114,115,105,95,87,95,100,102,99,97,102,107,126,145,164,198,193,194,173,160,157,155,165,164,168,165,180,215,214,202,182,163,154,150,157,148,140,144,137,131,117,106,113,126,132,125,123,125,135,140,131,123,121,124,130,131,125,119,118,126,129,130,123,122,120,115,111,120,117,112,113,118,154,208,216,175,145,144,143]},"pp_ldpe_film_eur":{"bas":"2006-02","eksik":["2011-09","2015-11","2016-04","2016-08","2023-03","2025-12","2026-07"],"v":[111,113,113,115,111,116,122,124,125,120,118,120,120,121,124,125,126,128,127,130,128,125,127,127,129,127,127,122,131,148,148,136,118,75,66,68,73,81,80,79,83,95,99,101,96,93,93,104,114,119,123,124,125,126,121,121,118,119,127,142,146,149,150,144,127,120,121,118,114,113,122,137,147,148,136,125,125,144,150,145,134,136,140,139,137,131,127,133,133,140,147,138,136,140,142,135,134,134,136,138,142,143,137,138,131,128,116,113,129,153,158,167,162,151,143,136,147,139,132,133,139,136,132,135,135,134,131,134,140,140,141,139,134,128,128,130,132,128,127,127,129,126,122,122,121,122,122,122,121,122,119,113,114,113,119,118,119,113,109,108,111,104,103,106,104,98,91,84,91,95,98,97,96,100,118,143,154,181,214,218,216,196,185,187,187,196,198,197,194,203,235,229,203,190,175,165,157,162,153,147,152,139,133,119,110,117,127,134,129,124,127,147,155,140,130,129,129,138,140,135,130,129,137,146,148,138,138,134,130,124,131,127,124,130,135,173,247,247,196,160,156,163]},"pp_lldpe_eur":{"bas":"2006-02","eksik":["2011-09","2015-11","2016-04","2016-08","2023-03","2025-12","2026-07"],"v":[113,111,110,111,110,112,120,118,121,116,116,116,118,118,120,119,120,123,120,124,124,119,122,122,124,126,128,123,130,149,145,140,125,90,71,72,75,84,86,84,85,98,103,107,99,96,96,103,117,120,123,126,126,125,124,125,119,118,118,128,139,137,143,145,132,127,123,113,118,117,124,136,145,145,135,122,124,139,142,145,139,139,142,140,140,133,128,132,134,142,144,138,132,137,139,136,134,133,134,135,139,142,136,132,131,127,115,112,129,152,160,167,163,157,138,134,145,135,129,130,135,135,127,129,127,126,123,130,133,134,134,130,130,120,123,125,129,122,121,123,129,120,117,119,117,118,116,117,117,117,115,114,117,117,121,121,120,115,111,109,113,107,107,108,107,101,96,93,99,102,105,101,101,104,105,131,144,179,199,211,218,201,184,188,191,197,195,198,198,203,235,230,193,170,158,150,145,166,160,147,156,140,132,118,102,115,126,132,127,123,127,137,144,136,129,123,121,133,134,128,121,121,130,134,135,127,129,128,123,121,130,124,119,123,127,159,215,217,186,148,147,148]},"pp_pp_homo_eur":{"bas":"2006-02","eksik":["2011-09","2015-11","2016-04","2016-08","2023-03","2025-12","2026-07"],"v":[106,104,106,110,107,108,114,115,116,112,114,111,112,113,116,119,119,125,122,123,124,122,123,122,122,120,118,113,118,129,129,122,110,86,68,66,67,72,71,71,76,89,93,100,94,89,89,98,106,113,119,124,128,127,123,123,123,123,124,136,138,143,146,141,134,126,123,119,117,116,123,132,140,143,135,127,126,133,144,134,128,130,131,130,131,126,125,126,129,131,137,130,129,133,135,131,132,135,137,138,140,140,139,138,134,127,116,111,124,142,149,150,147,136,130,122,125,117,113,117,118,118,115,119,118,119,118,119,127,129,129,128,125,119,119,122,128,126,127,129,132,130,128,129,132,132,133,133,134,134,132,130,130,133,137,137,136,129,125,120,121,116,113,116,115,108,99,93,99,104,107,106,104,108,115,131,145,181,202,207,213,189,185,189,189,199,203,200,196,201,245,239,205,187,161,151,145,153,145,138,146,143,140,125,121,119,133,137,138,133,135,145,154,143,140,145,140,144,150,140,139,139,142,146,147,142,141,134,135,128,134,131,128,127,129,172,230,240,198,161,158,161]}};
function ppTohumMap(t) { const m = new Map(); if (!t) return m; const eks = new Set(t.eksik || []); let [y, a] = t.bas.split('-').map(Number); let i = 0;
  while (i < t.v.length) { const k = y + '-' + String(a).padStart(2, '0'); if (!eks.has(k)) { m.set(k, t.v[i] / 100); i++; } a++; if (a > 12) { a = 1; y++; } if (y > 2100) break; }
  return m; }
const PP_KISA = { 'hdpe-film/3': 'pp_hdpe_film_eur', 'ldpe-film/5': 'pp_ldpe_film_eur', 'lldpe-standard/6': 'pp_lldpe_eur', 'pp-homo/7': 'pp_pp_homo_eur', 'hdpe-blow-moulding/2': 'pp_hdpe_sisirme_eur', 'pp-block/8': 'pp_pp_blok_eur' };
function ppCoz(h) {
  h = String(h || ''); const i = h.indexOf('PlasticPricesChart.init('); if (i < 0) return null;
  const b = h.indexOf('{', i); if (b < 0) return null; let d = 0, e = -1;   /* init({…}, "etiket") — süslü parantez eşleme */
  for (let k = b; k < h.length && k < b + 200000; k++) { const c = h[k]; if (c === '{') d++; else if (c === '}') { d--; if (!d) { e = k; break; } } }
  if (e < 0) return null;
  let o; try { o = JSON.parse(h.slice(b, e + 1)); } catch (err) { return null; }
  const ay = {}; for (const [t, v] of Object.entries(o)) { const a = String(t).slice(0, 7); if (!/^\d{4}-\d{2}$/.test(a) || !(v > 0.2 && v < 10)) continue; (ay[a] = ay[a] || []).push(+v); }
  const m = new Map(Object.keys(ay).sort().map(a => [a, +(ay[a].reduce((s, x) => s + x, 0) / ay[a].length).toFixed(4)]));
  return m.size ? m : null;
}
async function plasticPortal() {
  const dosya = 'sektor-surucu.json';
  if (!(await varMi(dosya))) { raporlar.push('### PlasticPortal PE/PP (§488) — ⏭ sektor-surucu.json yok'); return; }
  const D = await oku(dosya); D.seriler = D.seriler || {};
  const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
  const duvar = h => !h || /Just a moment|Attention Required|cf-chl|challenge-platform/i.test(String(h).slice(0, 6000));
  let pwB = null, pwC = null, pwYok = false;
  const pw = async url => { if (pwYok) return null; try { if (!pwC) { const { chromium } = await import('playwright'); pwB = await chromium.launch({ args: ['--disable-blink-features=AutomationControlled'] }); pwC = await pwB.newContext({ userAgent: UA, locale: 'en-GB', viewport: { width: 1366, height: 850 } }); } } catch (e) { pwYok = true; return null; }
    const pg = await pwC.newPage(); try { for (let d = 0; d < 1; d++) { await pg.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 }); await pg.waitForFunction(() => !/just a moment/i.test(document.title) && document.documentElement.outerHTML.includes('PlasticPricesChart.init('), null, { timeout: 20000 }).catch(() => {}); const h = await pg.content(); if (!duvar(h) && h.includes('PlasticPricesChart.init(')) return h; await pg.waitForTimeout(3000); } return null; } catch (e) { return null; } finally { await pg.close().catch(() => {}); } };
  /* §488c (21 Eki 2. koşu: "wayback görüntü yok" ×4 — Chrome'da aynı CDX sorgusu 2 görüntü döndürüyordu): URL encodeURIComponent ile
     kodlanıyordu ('/' → %2F), CDX eşleşmedi. Ham yol + http/https/www'siz varyant; hata nedeni tanıya yazılır. Ayrıca okunamayan sayfa için
     Wayback "Save Page Now" tetiklenir (web.archive.org/save/<url>) → archive.org kendi IP'sinden çeker; ertesi gün taze görüntü. */
  const wb = async url => { const yalin = url.replace(/^https?:\/\//, ''); const neden = [];
    for (const q of [yalin, yalin.replace(/^www\./, '')]) {
      try { const r0 = await fetch('https://web.archive.org/cdx/search/cdx?url=' + q + '&output=json&fl=timestamp&filter=statuscode:200&limit=-5', { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30000) }); if (!r0.ok) { neden.push('CDX HTTP ' + r0.status); continue; }
        const c = await r0.json(); const ts = (c || []).slice(1).map(x => x[0]).sort().pop(); if (!ts) { neden.push('CDX boş'); continue; }
        const r = await fetch('https://web.archive.org/web/' + ts + 'id_/' + url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30000) }); if (!r.ok) { neden.push('görüntü HTTP ' + r.status); continue; }
        return { h: await r.text(), ts };
      } catch (e) { neden.push(String(e && e.message || e).slice(0, 40)); }
    }
    return { hata: neden.join('/') }; };
  const spn = async url => { try { const r = await fetch('https://web.archive.org/save/' + url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(45000) }); return 'SPN ' + r.status; } catch (e) { return 'SPN ' + String(e.message || e).slice(0, 30); } };
  D.plastik = D.plastik || {};
  const sonAy = D.seriler.pe_pp && D.seriler.pe_pp.son && D.seriler.pe_pp.son.tarih;
  if (D.plastik.son_deneme === bugun && D.plastik.surum === '488d') { raporlar.push('### PlasticPortal PE/PP (§488) — ⏭ bugün zaten denendi (günde 1; veri aylık) · son ay ' + (sonAy || '—') + ' · yol ' + JSON.stringify(D.plastik.yollar || {})); return; }
  const t0 = Date.now(); let fetchOlmadi = 0, pwOlmadi = 0, spnSay = 0; const tani = [];
  const sonuc = {}, yollar = {}, uyari = [];
  for (const [yol, ad] of PP_MALZEME) {
    if (Date.now() - t0 > PP_SURE_MS) { uyari.push(ad + ': süre bütçesi (150 sn) doldu → sonraki koşu'); continue; }
    const url = 'https://www.plasticportal.eu/polymer-prices/' + yol; let m = null, ne = '';
    if (fetchOlmadi < 2) { try { const r = await fetch(url, { headers: { 'User-Agent': UA, 'Accept': 'text/html', 'Accept-Language': 'en-GB,en;q=0.9' }, signal: AbortSignal.timeout(20000) }); const h = await r.text(); if (!duvar(h)) { m = ppCoz(h); if (m) ne = 'fetch'; } if (!m) { fetchOlmadi++; tani.push(ad + ' fetch HTTP ' + r.status + (duvar(h) ? ' Cloudflare' : ' init yok')); } } catch (e) { fetchOlmadi++; tani.push(ad + ' fetch ' + String(e.message || e).slice(0, 40)); } }
    if (!m && pwOlmadi < 1 && Date.now() - t0 < PP_SURE_MS) { const h = await pw(url); if (h) { m = ppCoz(h); if (m) ne = 'playwright'; } if (!m) { pwOlmadi++; tani.push(ad + ' playwright ' + (pwYok ? 'kurulu değil' : 'geçemedi')); } }   /* bir kez geçemezse diğer sayfalarda denenmez (süre) */
    if (!m && Date.now() - t0 < PP_SURE_MS) { const w = await wb(url); if (w && w.h) { m = ppCoz(w.h); if (m) ne = 'wayback ' + w.ts.slice(0, 8); } if (!m) tani.push(ad + ' wayback ' + (w && w.h ? 'init yok' : (w && w.hata || 'görüntü yok'))); }
    if ((!m || /^wayback/.test(ne)) && spnSay < 1 && Date.now() - t0 < PP_SURE_MS) { spnSay++; tani.push(ad + ' ' + await spn(url)); }   /* koşu başına 1 SPN (520'de 45 sn yiyor) */   /* taze görüntü iste (ertesi koşu için) */
    const kT = PP_KISA[yol]; const tm = ppTohumMap(PP_TOHUM[kT]);
    if (!m && tm.size) { m = tm; ne = 'tohum'; }
    else if (m && tm.size) { const b = new Map(tm); for (const [a, v] of m) b.set(a, v); m = new Map([...b.entries()].sort()); }   /* arşiv/fetch + tohum birleşik */
    if (!m) { uyari.push(ad + ': erişilemedi (Cloudflare + arşiv yok, tohum yok)'); continue; }
    sonuc[yol] = m; yollar[ne.split(' ')[0]] = (yollar[ne.split(' ')[0]] || 0) + 1;
    /* geçmiş + yeni birleştir (wayback eski görüntüden gelirse dosyadaki yeni ayları kaybetme) */
    const k = PP_KISA[yol]; if (!k) continue;
    const eski = (D.seriler[k] && D.seriler[k].aylik) || {}; const bir = new Map(Object.entries(eski)); for (const [a, v] of m) bir.set(a, v);
    const A = aylikTuret(new Map([...bir.entries()].sort())); const ks = Object.keys(A.aylik); const son = ks[ks.length - 1];
    D.seriler[k] = Object.assign({}, D.seriler[k] || {}, { ad: ad + ' — Orta Avrupa ortalama reçine fiyatı (€/kg, aylık)', birim: '€/kg', siklik: 'aylik', hisse: ['PETKM'], kaynak: 'plasticportal.eu (Plastech.pl) — ' + (ne === 'tohum' ? 'elle tohum (Chrome 21 Eki; ayın ~16\'sı güncellenir)' : ne) + ' (Actions §488)', aylik: A.aylik, ceyreklik: A.ceyreklik, yillik: A.yillik, son: { tarih: son, deger: A.aylik[son] }, guncelleme: bugun });
  }
  /* bileşik pe_pp ($/t): HDPE film + LDPE film + LLDPE + PP homo ortalaması × EURUSD */
  let eu = new Map(); try { const h = await yahooSeri(['EURUSD=X'], '', 'max'); eu = h['EURUSD=X'] || new Map(); } catch (e) {}
  const euAy = {}; for (const [t, v] of eu) if (v > 0.8 && v < 1.8) (euAy[t.slice(0, 7)] = euAy[t.slice(0, 7)] || []).push(v);
  if (D.seriler.eurusd && D.seriler.eurusd.gunluk) { const g = {}; for (const [t, v] of D.seriler.eurusd.gunluk) (g[t.slice(0, 7)] = g[t.slice(0, 7)] || []).push(v); Object.assign(euAy, g); }
  const kur = a => { const v = euAy[a] || euAy[Object.keys(euAy).filter(x => x <= a).sort().pop()]; return v ? v.reduce((s, x) => s + x, 0) / v.length : null; };
  const bil = ['pp_hdpe_film_eur', 'pp_ldpe_film_eur', 'pp_lldpe_eur', 'pp_pp_homo_eur'].map(k => D.seriler[k] && D.seriler[k].aylik).filter(Boolean);
  const notlar = [];
  if (bil.length >= 2) {
    const aylar = Object.keys(bil[0]).filter(a => bil.every(b => b[a] != null)).sort(); const m = new Map();
    for (const a of aylar) { const k = kur(a); if (k) m.set(a, bil.reduce((s, b) => s + b[a], 0) / bil.length * k * 1000); }
    if (m.size) { const A = aylikTuret(m); const ks = Object.keys(A.aylik); const son = ks[ks.length - 1];
      D.seriler.pe_pp = Object.assign({}, D.seriler.pe_pp || {}, { ad: 'PE/PP Avrupa reçine fiyatı — HDPE film, LDPE film, LLDPE, PP homo ortalaması ($/t)', birim: '$/t', siklik: 'aylik', hisse: ['PETKM'], kaynak: 'plasticportal.eu (Plastech.pl, Orta Avrupa) × EURUSD (Yahoo) — Actions §488', _not: 'Petkim\'in ana ürünleri (AYPE/YYPE/AYPE-T/PP) için Avrupa referans fiyatı; Türkiye ithalat fiyatı Avrupa ve Orta Doğu arasında oluşur. Nafta maliyeti için Brent ile okunur.', aylik: A.aylik, ceyreklik: A.ceyreklik, yillik: A.yillik, son: { tarih: son, deger: A.aylik[son] }, guncelleme: bugun });
      notlar.push('pe_pp ' + A.aylik[son].toFixed(0) + ' $/t (' + son + ', ' + ks.length + ' ay)');
      /* polimer − 7,5 × Brent */
      const br = Object.assign({}, (D.seriler.brent_wb && D.seriler.brent_wb.aylik) || {}); if (D.seriler.brent_yh && D.seriler.brent_yh.gunluk) { const g = {}; for (const [t, v] of D.seriler.brent_yh.gunluk) (g[t.slice(0, 7)] = g[t.slice(0, 7)] || []).push(v); for (const a in g) if (br[a] == null) br[a] = g[a].reduce((s, x) => s + x, 0) / g[a].length; }
      const mk = new Map(); for (const [a, v] of Object.entries(A.aylik)) if (br[a]) mk.set(a, v - 7.5 * br[a]);
      if (mk.size) { const B = aylikTuret(mk); const kb = Object.keys(B.aylik); const sb = kb[kb.length - 1];
        D.seriler.petkm_polimer_makas_usd = Object.assign({}, D.seriler.petkm_polimer_makas_usd || {}, { ad: 'Polimer − ham petrol makası — PE/PP Avrupa − 7,5 × Brent ($/t)', birim: '$/t', siklik: 'aylik', hisse: ['PETKM'], kaynak: 'türetilmiş: pe_pp − 7,5 × Brent (WB aylık + Yahoo) — Actions §488', _not: '7,5 varil ≈ 1 ton ham petrol; nafta Brent\'e yakın fiyatlanır (nafta crack ±). Petkim\'in brüt makasının YÖN göstergesi; etilen/propilen verimi ve enerji maliyeti dahil değil.', aylik: B.aylik, ceyreklik: B.ceyreklik, yillik: B.yillik, son: { tarih: sb, deger: B.aylik[sb] }, guncelleme: bugun });
        notlar.push('polimer makası ' + B.aylik[sb].toFixed(0) + ' $/t (' + sb + ')'); }
    }
  }
  if (pwB) await pwB.close().catch(() => {});
  if (!Object.keys(sonuc).length) { D.plastik.son_deneme = bugun; D.plastik.surum = '488d'; D.plastik.yollar = { hata: 1 }; await yaz(dosya, D); raporlar.push('### PlasticPortal PE/PP (§488) — ✗ hiçbir sayfa okunamadı · bugün tekrar denenmez\n- tanı: ' + tani.join(' · ') + (uyari.length ? '\n- ' + uyari.slice(0, 4).join('\n- ') : '')); return; }
  D.plastik.son_deneme = bugun; D.plastik.surum = '488d'; D.plastik.yollar = yollar;
  D.seriler_guncelleme = bugun; await yaz(dosya, D);
  degisenler.push('PlasticPortal PE/PP (' + Object.keys(sonuc).length + ' malzeme)');
  const g = k => D.seriler[k] && D.seriler[k].son ? D.seriler[k].son.deger.toFixed(2) : '—';
  raporlar.push('### PlasticPortal PE/PP (§488) — ✓ ' + Object.keys(sonuc).length + '/' + PP_MALZEME.length + ' malzeme · yol ' + JSON.stringify(yollar) + ' · HDPE film ' + g('pp_hdpe_film_eur') + ' · LDPE film ' + g('pp_ldpe_film_eur') + ' · LLDPE ' + g('pp_lldpe_eur') + ' · PP homo ' + g('pp_pp_homo_eur') + ' €/kg' + (notlar.length ? '\n- ' + notlar.join(' · ') : '') + (tani.length ? '\n- tanı: ' + tani.join(' · ') : '') + (uyari.length ? '\n- ⚠ ' + uyari.join(' · ') : '') + ' · ' + Math.round((Date.now() - t0) / 1000) + ' sn');
}
/* ── §489 DCE POLİMER VADELİLERİ (Sina Finance açık API) — Asya PE/PP/PVC referansı ─────────────────────────────────────
   PlasticPortal Cloudflare'den geçmediği için ikinci, OTOMATİK kaynak (21 Eki): Dalian Ticaret Borsası (DCE) sürekli kontratları —
   L0 = LLDPE, PP0 = polipropilen, V0 = PVC (Petkim'in üç ana ürün grubu). Uç (WebFetch ile ölçüldü, anahtar yok):
     GET https://stock2.finance.sina.com.cn/futures/api/json.php/IndexService.getInnerFuturesDailyKLine?symbol=PP0
     → [["2014-02-28","10680.000","10720.000","10604.000","10657.000","97582"], …] (tarih, açılış, yüksek, düşük, KAPANIŞ, hacim; CNY/t, KDV dahil)
   Günlük kapanış → ay ortalaması; $ = CNY ÷ USD/CNY (Yahoo CNY=X). Çin iç piyasa fiyatı (KDV %13 dahil) — Türkiye ithalatı Orta Doğu/Asya
   kaynaklı olduğundan Petkim fiyatlamasının ASYA tarafı; Avrupa tarafı PlasticPortal. Seviye değil yön/makas. */
const DCE_SERI = [['L0', 'dce_lldpe', 'LLDPE'], ['PP0', 'dce_pp', 'PP'], ['V0', 'dce_pvc', 'PVC']];
async function dceFiyat() {
  const dosya = 'sektor-surucu.json';
  if (!(await varMi(dosya))) { raporlar.push('### DCE polimer vadelileri (§489) — ⏭ sektor-surucu.json yok'); return; }
  const D = await oku(dosya); D.seriler = D.seriler || {};
  let cny = new Map(); try { const h = await yahooSeri(['CNY=X'], '', 'max'); cny = h['CNY=X'] || new Map(); } catch (e) {}
  const cAy = {}; for (const [t, v] of cny) if (v > 5 && v < 9) (cAy[t.slice(0, 7)] = cAy[t.slice(0, 7)] || []).push(v);
  const kur = a => { const v = cAy[a] || cAy[Object.keys(cAy).filter(x => x <= a).sort().pop()]; return v ? v.reduce((s, x) => s + x, 0) / v.length : 7.1; };
  const notlar = [], uyari = [];
  for (const [sem, k, ad] of DCE_SERI) {
    try {
      /* §489b (22 Eki): eski IndexService.getInnerFuturesDailyKLine 17 Tem 2024'te DONMUŞ (hata vermeden eski veri döner →
         panelde 2024-07 "son" görünüyordu). Yeni uç InnerFuturesNewService.getDailyKLine (JSONP, nesne dizisi {d,o,h,l,c,v,p,s});
         kullanıcının bilgisayarından 22 Eki'ye kadar canlı doğrulandı. Ayrıştırıcı iki biçimi de okur; tazelik bekçisi aşağıda. */
      const r = await fetch('https://stock2.finance.sina.com.cn/futures/api/jsonp.php/var%20_' + sem + '=/InnerFuturesNewService.getDailyKLine?symbol=' + sem, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0', 'Referer': 'https://finance.sina.com.cn/' }, signal: AbortSignal.timeout(30000) });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const t = await r.text(); const ham = JSON.parse(t.slice(t.indexOf('['), t.lastIndexOf(']') + 1));
      const j = ham.map(x => Array.isArray(x) ? x : [x.d, x.o, x.h, x.l, x.c, x.v]);
      const ay = {}; for (const x of j) { const d = String(x[0]), v = parseFloat(x[4]); if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || !(v > 1000 && v < 50000)) continue; (ay[d.slice(0, 7)] = ay[d.slice(0, 7)] || []).push(v); }
      const ks = Object.keys(ay).sort(); if (ks.length < 24) throw new Error(ks.length + ' ay');
      const mC = new Map(ks.map(a => [a, ay[a].reduce((s, x) => s + x, 0) / ay[a].length])), mU = new Map(ks.map(a => [a, mC.get(a) / kur(a)]));
      const sonGun = j.filter(x => /^\d{4}-\d{2}-\d{2}$/.test(String(x[0]))).pop();
      /* §489b tazelik bekçisi: son işlem günü 21 günden eskiyse uç donmuş demektir — yazma, hata ver (eski veri sessizce "güncel" sayılmasın) */
      if (!sonGun || (Date.parse(bugun) - Date.parse(sonGun[0])) / 864e5 > 21) throw new Error('bayat uç: son işlem günü ' + (sonGun ? sonGun[0] : '—'));
      for (const [kk, m, br] of [[k + '_cny', mC, 'CNY/t'], [k + '_usd', mU, '$/t']]) {
        const A = aylikTuret(m); const kz = Object.keys(A.aylik); const son = kz[kz.length - 1];
        D.seriler[kk] = Object.assign({}, D.seriler[kk] || {}, { ad: 'DCE ' + ad + ' sürekli vadeli — Çin iç piyasa (' + br + ', ay ort.)', birim: br, siklik: 'aylik', hisse: ['PETKM'], kaynak: 'Sina Finance DCE ' + sem + ' günlük kapanış' + (br === '$/t' ? ' ÷ Yahoo CNY=X' : '') + ' (Actions §489)', _not: 'Asya polimer fiyatı (KDV %13 dahil). Petkim satış fiyatının Asya/Orta Doğu ayağı; Avrupa ayağı PlasticPortal.', aylik: A.aylik, ceyreklik: A.ceyreklik, yillik: A.yillik, son: { tarih: son, deger: +A.aylik[son].toFixed(br === '$/t' ? 0 : 0), gun: sonGun ? sonGun[0] : null, kapanis: sonGun ? +sonGun[4] : null }, guncelleme: bugun });
      }
      const gy = mU.get((+ks[ks.length - 1].slice(0, 4) - 1) + ks[ks.length - 1].slice(4));
      notlar.push(ad + ' ' + Math.round(mC.get(ks[ks.length - 1])) + ' CNY/t ≈ ' + Math.round(mU.get(ks[ks.length - 1])) + ' $/t (' + (sonGun ? sonGun[0] : ks[ks.length - 1]) + (gy ? ', $ y/y ' + ((mU.get(ks[ks.length - 1]) / gy - 1) * 100).toFixed(1) + '%' : '') + ', ' + ks.length + ' ay)');
    } catch (e) { uyari.push(sem + ': ' + String(e && e.message || e).slice(0, 80)); }
  }
  /* Asya polimer − 7,5×Brent makası (PE+PP ortalaması) */
  try { const A = D.seriler.dce_lldpe_usd && D.seriler.dce_lldpe_usd.aylik, B = D.seriler.dce_pp_usd && D.seriler.dce_pp_usd.aylik;
    const br = Object.assign({}, (D.seriler.brent_wb && D.seriler.brent_wb.aylik) || {}); if (D.seriler.brent_yh && D.seriler.brent_yh.gunluk) { const g = {}; for (const [t, v] of D.seriler.brent_yh.gunluk) (g[t.slice(0, 7)] = g[t.slice(0, 7)] || []).push(v); for (const a in g) if (br[a] == null) br[a] = g[a].reduce((s, x) => s + x, 0) / g[a].length; }
    if (A && B) { const m = new Map(); for (const a of Object.keys(A).sort()) if (B[a] != null && br[a]) m.set(a, (A[a] + B[a]) / 2 / 1.13 - 7.5 * br[a]);   /* KDV %13 düşülür */
      if (m.size) { const M = aylikTuret(m); const kz = Object.keys(M.aylik); const son = kz[kz.length - 1];
        D.seriler.petkm_asya_makas_usd = Object.assign({}, D.seriler.petkm_asya_makas_usd || {}, { ad: 'Asya polimer − ham petrol makası — DCE (LLDPE+PP)/2 KDV hariç − 7,5×Brent ($/t)', birim: '$/t', siklik: 'aylik', hisse: ['PETKM'], kaynak: 'türetilmiş: Sina DCE L0/PP0 ÷ CNY=X ÷ 1,13 − 7,5 × Brent (Actions §489)', _not: 'PlasticPortal Avrupa makasının Asya karşılığı; ikisi aynı yöne gidiyorsa sinyal güçlü.', aylik: M.aylik, ceyreklik: M.ceyreklik, yillik: M.yillik, son: { tarih: son, deger: +M.aylik[son].toFixed(0) }, guncelleme: bugun });
        notlar.push('Asya makası ' + M.aylik[son].toFixed(0) + ' $/t (' + son + ')'); } } } catch (e) { uyari.push('asya makası: ' + e.message); }
  if (!notlar.length) { raporlar.push('### DCE polimer vadelileri (§489) — ✗ ' + uyari.join(' · ') + ' · dosya korundu'); return; }
  D.seriler_guncelleme = bugun; await yaz(dosya, D); degisenler.push('DCE polimer (' + notlar.length + ')');
  raporlar.push('### DCE polimer vadelileri (§489) — ✓ ' + notlar.join(' · ') + (uyari.length ? '\n- ⚠ ' + uyari.join(' · ') : ''));
}

/* ── §496 MULTIPLE KENDİ VERİMİZDEN (23 Eki) — Değerleme › EV/EBITDA ─────────────────────────────────────────────────
   Kullanıcı: "Fintables'a bağlı olmak istemiyorum; 2Ç bilançolarını çektik, neden kendimiz hesaplamıyoruz?"
   Haklı: faktorEvren() (§361d) KAP finansal tablolarından her XKTUM şirketi için TTM ciro/FAVÖK, son bilanço net borç ve
   ödenmiş sermayeyi ZATEN hesaplıyor (faktor-evren.json). multiple.json ise 1Ç26 elle kopyasında kalmıştı ve pay adedi
   §328 ölçeklemesiyle bozulmuştu (fon krizi tabanı bölünme sanıldı; BIMAS/CEMZY/GOODY/OZYSR/BMSTL bedelsizleri kaçtı).
   ÇÖZÜM — her koşuda multiple.json'un bilanço kalemleri faktor-evren.json'dan yeniden kurulur:
     ciro = TTM satış · ebitda = TTM FAVÖK (faaliyet kârı + amortisman) · netBorc = finansal borç − nakit (dönem sonu)
     adet = bilançodaki ödenmiş sermaye (nominal 1₺) × DÖNEM SONUNDAN SONRAKİ kurumsal işlemler:
       (a) Yahoo split olayları (BIST bedelsizlerini kaydediyor — BIMAS 2:1 · CEMZY 5,72 · GOODY 5,63 · OZYSR 4,1 · BMSTL 2:1 ölçüldü)
       (b) Yahoo'nun KAÇIRDIĞI bedelsiz: ham kapanışta BIST fiyat marjını (±%10) aşan tek günlük boşluk (CVKMD 3 Ağu
           37,82 → 14,42; Yahoo split kaydı YOK). Oran boşluktan alınır → yaklaşık (o günün ±%10 hareketi kadar), işaretlenir.
     Bir sonraki bilançoda sermaye kalemi gerçeği gösterir ve yaklaşık düzeltme kendiliğinden düşer.
   Kapsam dışı (faktör evreninde olmayan, katılım dışı) hisseler ESKİ değerle kalır ve `kaynak:'eski'` ile işaretlenir —
   kart bunu açıkça yazar. Fintables'a dönüş YOK. */
async function multipleKendi() {
  const dosya = 'multiple.json';
  if (!(await varMi(dosya)) || !(await varMi('faktor-evren.json'))) { raporlar.push('### Multiple kendi verimizden (§496) — ⏭ dosya yok'); return; }
  const M = await oku(dosya), FE = await oku('faktor-evren.json'); const S = FE.sirketler || {};
  const t0 = Date.now(), SURE = 120000;
  const uyku = ms => new Promise(r => setTimeout(r, ms));
  const donemSonu = (d) => { const m = String(d || '').match(/^(\d{4})\/([1-4])$/); if (!m) return null; const ay = +m[2] * 3; return new Date(Date.UTC(+m[1], ay, 0)); };
  const kurumsal = async (kod, bas) => {
    const r = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(kod + '.IS') + '?interval=1d&range=1y&events=split', { headers: { 'User-Agent': 'Mozilla/5.0 (KtPanel/1.0)' }, signal: AbortSignal.timeout(15000) });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const R = (await r.json())?.chart?.result?.[0]; if (!R) throw new Error('boş');
    let carpan = 1; const not = []; const basT = bas.getTime() / 1000;
    const sp = Object.values((R.events && R.events.splits) || {}).filter(x => x.date > basT && x.numerator > 0 && x.denominator > 0);
    sp.forEach(x => { carpan *= x.numerator / x.denominator; not.push(new Date(x.date * 1000).toISOString().slice(0, 10) + ' ×' + (x.numerator / x.denominator).toFixed(3) + ' (Yahoo)'); });
    /* Yahoo'nun bilmediği işlem: ham kapanışta marj dışı boşluk. Bilinen split günleri hariç (Yahoo onları zaten düzeltmiştir). */
    const ts = R.timestamp || [], c = (R.indicators && R.indicators.quote && R.indicators.quote[0] && R.indicators.quote[0].close) || [];
    const spGun = new Set(sp.map(x => new Date(x.date * 1000).toISOString().slice(0, 10)));
    let onceki = null, oncekiT = null;
    /* §496c (ilk canlı koşu): GUBRF/IZFAS/MAGEN'de BUGÜNKÜ çubuk −%16 göründü — seans içi eksik/hatalı veri, bedelsiz değil.
       Kural: (1) bugünün çubuğu kullanılmaz, (2) boşluk KALICI olmalı — sonraki iki kapanış da yeni seviyenin ±%12'sinde. */
    const bugunG = new Date().toISOString().slice(0, 10);
    const I = []; for (let i = 0; i < ts.length; i++) if (c[i] > 0 && new Date(ts[i] * 1000).toISOString().slice(0, 10) < bugunG) I.push(i);
    for (let j = 1; j < I.length; j++) { const i = I[j], p = I[j - 1]; if (ts[i] <= basT) continue;
      const v = c[i], onceki = c[p], o = v / onceki, gun = new Date(ts[i] * 1000).toISOString().slice(0, 10);
      if (spGun.has(gun) || !(o < 0.85 || o > 1.25) || (ts[i] - ts[p]) >= 6 * 864e2) continue;
      const sonraki = I.slice(j + 1, j + 3).map(q => c[q]); if (sonraki.length < 2 || !sonraki.every(x => Math.abs(x / v - 1) < 0.12)) continue;
      carpan *= onceki / v; not.push(gun + ' ×' + (onceki / v).toFixed(3) + ' (fiyat boşluğu, yaklaşık)'); }
    return { carpan, not, son: c.filter(x => x > 0).pop() || null };
  };
  let kendi = 0, eski = 0, duzeltme = 0; const hata = [], notlar = [];
  for (const h of (M.hisseler || [])) {
    const s = S[h.k];
    /* §496b: çarpan ÇEKİRDEK FAVÖK ile (panel KAP kartı §351b ile aynı tanım); yoksa geniş tanıma düşülür ve işaretlenir */
    const fv = s && Number.isFinite(s.favokCek) && s.favokCek !== 0 ? s.favokCek : (s ? s.favok : null);
    const gecerli = s && !s.eksik && s.ciro > 0 && Number.isFinite(fv) && Number.isFinite(s.netBorc) && s.adet > 0 && donemSonu(s.donem);
    if (!gecerli) {
      h.kaynak = 'eski'; eski++;
      /* §328 hatasının geri alınması: `_kurumsal` ölçeklemesi Yahoo'da karşılığı olan bir split DEĞİLSE (fon krizi tabanı)
         adet eski haline döner (adet × oran). Gerçek split ise dokunulmaz. */
      if (h._kurumsal && h._kurumsal.oran > 0 && Date.now() - t0 < SURE) {
        try { const g = new Date(Date.parse(h._kurumsal.tarih) - 10 * 864e5); const k = await kurumsal(h.k, g);
          const yahooSplit = k.not.some(x => /Yahoo/.test(x));
          if (!yahooSplit) { h.adet = +(h.adet * h._kurumsal.oran).toFixed(3); notlar.push(h.k + ' §328 geri alındı (adet ×' + h._kurumsal.oran + ', split değil)'); delete h._kurumsal; duzeltme++; }
        } catch (e) { hata.push(h.k + ':' + String(e.message || e).slice(0, 20)); }
        await uyku(250); }
      continue; }
    let carpan = 1, kn = [];
    if (Date.now() - t0 < SURE) { try { const k = await kurumsal(h.k, donemSonu(s.donem)); carpan = k.carpan; kn = k.not; } catch (e) { hata.push(h.k + ':' + String(e.message || e).slice(0, 20)); } await uyku(250); }
    h.ciro = Math.round(s.ciro / 1e6); h.ebitda = Math.round(fv / 1e6); h.netBorc = Math.round(s.netBorc / 1e6);
    h.favok_tanim = (Number.isFinite(s.favokCek) && s.favokCek !== 0) ? 'çekirdek' : 'geniş'; if (Number.isFinite(s.favok)) h.ebitda_genis = Math.round(s.favok / 1e6);
    h.adet = +((s.adet / 1e6) * carpan).toFixed(3);
    h.donem = s.donem; h.kaynak = 'kap'; h.adet_not = kn.length ? 'bilanço sermayesi ' + Math.round(s.adet / 1e6) + ' mn × ' + kn.join(' × ') : 'bilanço sermayesi (' + s.donem + ')';
    delete h._kurumsal;
    if (kn.length) { duzeltme++; notlar.push(h.k + ' ' + kn.join(' · ')); }
    kendi++;
  }
  M.kaynak = 'KAP finansal tabloları (faktor-evren.json §361d) + Yahoo kurumsal işlem — §496';
  M.bilanco_guncelleme = bugun; M.guncelleme = bugun;
  M.not = 'Bilanço kalemleri kendi KAP verimizden (TTM ciro/FAVÖK, dönem sonu net borç) · adet = ödenmiş sermaye × dönem sonrası bedelsiz/bölünme · tutarlar milyon TL · kaynak:"eski" olanlar faktör evreni dışında (katılım dışı), bilanço kalemleri güncellenmiyor.';
  await yaz(dosya, M); degisenler.push('multiple bilanço (' + kendi + ' kendi · ' + eski + ' eski)');
  raporlar.push('### Multiple kendi verimizden (§496) — ✓ ' + kendi + ' hisse KAP · ' + eski + ' eski (evren dışı)' + (duzeltme ? '\n- kurumsal işlem düzeltmesi: ' + notlar.join(' | ') : '') + (hata.length ? '\n- ⚠ Yahoo: ' + hata.join(' · ') : '') + ' · ' + Math.round((Date.now() - t0) / 1000) + ' sn');
}

/* ── §499 TON BAŞINA FAVÖK (23 Eki) — EREGL · KRDMD ───────────────────────────────────────────────────────────────────
   Kullanıcı: "EREGL/Kardemir gibi şirketlerde ton başına FAVÖK sürücüsü önemli; kendi verilerimizle hesaplayabilir miyiz?"
   Pay: çeyreklik ÇEKİRDEK FAVÖK (brüt − pazarlama − GYG − Ar-Ge + amortisman) kendi KAP arşivimizden (kap-arsiv/<KOD>.json):
     · çeyrek kalemi: rapordaki 3 aylık sütun (yoksa kümülatif farkı); amortisman yalnız nakit akışında kümülatif → fark.
     · KRDMD TL fonksiyonel + TMS 29: ara dönem rakamları dönem sonu satın alma gücünde → önceki kümülatif TÜFE oranıyla
       taşınır, dolara DÖNEM SONU kuruyla çevrilir. EREGL'de çeyrekler toplamı kümülatife birebir eşit (TMS 29 etkisi yok,
       USD fonksiyonel) → ÇEYREK ORTALAMA kuru.
     Doğrulama (yalnız kıyas, kaynak değil): Fintables usd_ceyreklik ile 10 çeyrekte ±3 mn $ içinde.
   Payda: SATIŞ TONAJI — şirket faaliyet raporu (KAP), kümülatif; elle (ritüel: her bilanço haftası, şirket başına 1 sayı):
     EREGL "Yassı Mamul Satışları + Uzun Mamul Satışları" (bin ton; pelet/cevher hariç — çoğu grup içi)
     KRDMD "Tablo: Satış Miktar ve Tutarları — Esas Ürünler" (ton; ham çelik + haddelenmiş çelik)
   Çıktı (sektor-surucu.json, çeyreklik): <kod>_favok_ton_usd · _ciro_ton_usd (gerçekleşen ort. satış fiyatı) ·
   _maliyet_ton_usd (= ciro/t − FAVÖK/t: nakit maliyet + giderler) · _satis_ton (bin ton). */
const TON_KUM = {
  EREGL: { birim: 'bin ton', tanim: 'yassı + uzun mamul satışı (pelet/cevher hariç)', ias29: false,
    k: { '2024Q1': 1979, '2024Q2': 3935, '2024Q3': 5859, '2024Q4': 8051, '2025Q1': 1902, '2025Q2': 3671, '2025Q3': 5602, '2025Q4': 7830, '2026Q1': 2123, '2026Q2': 4240, '2026Q3': 6384 },
    kaynak: 'EREGL faaliyet raporları (KAP) — "Yassı/Uzun Mamul Satışları" tablosu, kümülatif' },
  KRDMD: { birim: 'bin ton', tanim: 'esas ürünler (ham çelik + haddelenmiş çelik)', ias29: true,
    k: { '2024Q1': 563.384, '2024Q2': 1056.235, '2024Q3': 1713.706, '2024Q4': 2260.093, '2025Q1': 635.578, '2025Q2': 1236.371, '2025Q3': 1878.819, '2025Q4': 2500.324, '2026Q1': 561.682, '2026Q2': 1261.131 },
    kaynak: 'KRDMD faaliyet raporları (KAP) — "Satış Miktar ve Tutarları · Esas Ürünler", kümülatif' }
};
async function tonBasina() {
  const dosya = 'sektor-surucu.json';
  if (!(await varMi(dosya))) { raporlar.push('### Ton başına FAVÖK (§499) — ⏭ sektor-surucu.json yok'); return; }
  const D = await oku(dosya); D.seriler = D.seriler || {};
  const AYS = D.usdtry_ay_sonu || {}; const TF = (D.seriler.tufe && D.seriler.tufe.aylik) || {};
  const G = (D.seriler.usdtry && D.seriler.usdtry.gunluk) || [];
  const ayK = (y, m) => String(y) + '-' + String(m).padStart(2, '0');
  const kurOrt = (y, q) => { /* günlük varsa çeyrek ortalaması; yoksa ay sonlarından yamuk ortalama */
    const a = ayK(y, 3 * q - 2), b = ayK(y, 3 * q); const g = G.filter(x => x && x[0] >= a && x[0].slice(0, 7) <= b && x[1] > 0).map(x => x[1]);
    if (g.length > 40) return g.reduce((s, x) => s + x, 0) / g.length;
    const p = [ayK(q === 1 ? y - 1 : y, q === 1 ? 12 : 3 * q - 3), ayK(y, 3 * q - 2), ayK(y, 3 * q - 1), ayK(y, 3 * q)].map(k => AYS[k]);
    return p.every(x => x > 0) ? (p[0] / 2 + p[1] + p[2] + p[3] / 2) / 3 : null; };
  const kurSon = (y, q) => AYS[ayK(y, 3 * q)] || null;
  const cpiOran = (y, q) => { const a = TF[ayK(y, 3 * q)], b = TF[ayK(y, 3 * q - 3)]; return (a > 0 && b > 0) ? a / b : null; };
  const TAG = { R: 'ifrs-full_Revenue', B: 'ifrs-full_GrossProfit', P: 'kap-fr_MarketingExpense', Y: 'ifrs-full_AdministrativeExpense', A: 'ifrs-full_ResearchAndDevelopmentExpense', AM: 'ifrs-full_AdjustmentsForDepreciationAndAmortisationExpense' };
  const sonuc = [], uyari = [];
  for (const [kod, T] of Object.entries(TON_KUM)) {
    let A; try { A = await oku('kap-arsiv/' + kod + '.json'); } catch (e) { uyari.push(kod + ': arşiv yok'); continue; }
    const K = {};
    for (const [key, d] of Object.entries(A.donemler || {})) { const c = (d.birim && d.birim.carpan) || 1; const k = {};
      (d.tablolar || []).forEach(t => (t.satirlar || []).forEach(s => { if (s.xbrl && !k[s.xbrl] && s.degerler && s.degerler.length) k[s.xbrl] = s.degerler.map(v => Number.isFinite(v) ? v * c : null); }));
      K[key] = k; }
    const seri = { favok: {}, ciro: {}, maliyet: {}, ton: {} };
    for (const key of Object.keys(K).sort()) {
      const [y, q] = key.split('/').map(Number); if (y < 2024) continue;
      const qq = y + 'Q' + q; const Dk = K[key], Pk = q > 1 ? K[y + '/' + (q - 1)] : null;
      const f = (q > 1 && T.ias29) ? cpiOran(y, q) : 1; if (q > 1 && T.ias29 && !f) continue;
      const qv = (tag) => { const v = Dk[tag]; if (!v) return 0; if (q === 1) return v[0];
        if (v.length >= 4 && Number.isFinite(v[2])) return v[2]; const p = Pk && Pk[tag]; return (p && Number.isFinite(p[0])) ? v[0] - p[0] * f : null; };
      const ciro = qv(TAG.R); const brut = qv(TAG.B); if (!Number.isFinite(ciro) || !Number.isFinite(brut)) continue;
      const am = Dk[TAG.AM]; const pam = Pk && Pk[TAG.AM];
      const amq = !am ? null : (q === 1 ? am[0] : (pam ? am[0] - pam[0] * f : null)); if (!Number.isFinite(amq)) continue;
      const favok = brut + (qv(TAG.P) || 0) + (qv(TAG.Y) || 0) + (qv(TAG.A) || 0) + amq;
      const kur = T.ias29 ? kurSon(y, q) : kurOrt(y, q); if (!(kur > 0)) continue;
      const tc = T.k[qq], tp = q > 1 ? T.k[y + 'Q' + (q - 1)] : 0; if (!Number.isFinite(tc) || !Number.isFinite(tp)) continue;
      const ton = (tc - tp) * 1000; if (!(ton > 0)) continue;
      seri.favok[qq] = +(favok / kur / ton).toFixed(1); seri.ciro[qq] = +(ciro / kur / ton).toFixed(1);
      seri.maliyet[qq] = +((ciro - favok) / kur / ton).toFixed(1); seri.ton[qq] = +(ton / 1000).toFixed(1);
    }
    const qs = Object.keys(seri.favok).sort(); if (!qs.length) { uyari.push(kod + ': hesaplanacak çeyrek yok'); continue; }
    const sonQ = qs[qs.length - 1]; const kk = kod.toLowerCase();
    const yaz1 = (ek, ad, birim, map, notu) => { D.seriler[kk + ek] = Object.assign({}, D.seriler[kk + ek] || {}, { ad, birim, siklik: 'aylik', aylik: {}, ceyreklik: map, hisse: [kod],
      son: { tarih: sonQ, deger: map[sonQ] }, kaynak: 'türetilmiş: KAP finansal tablo arşivi (çekirdek FAVÖK, ' + (T.ias29 ? 'TMS 29 · dönem sonu kuru' : 'çeyrek ort. kuru') + ') ÷ ' + T.kaynak + ' (§499)', _not: notu, guncelleme: bugun }); };
    yaz1('_favok_ton_usd', kod + ' FAVÖK / ton ($/t) — çekirdek FAVÖK ÷ satış tonajı (' + T.tanim + ')', '$/t', seri.favok, 'Hacimden arındırılmış kârlılık: bu çeyrek iyi mi sorusunun ton başına cevabı. Tek çeyrek stok/hedge etkisiyle oynar — eğilime bak.');
    yaz1('_ciro_ton_usd', kod + ' gerçekleşen ort. satış fiyatı ($/t) — ciro ÷ ton', '$/t', seri.ciro, 'Liste fiyatı değil GERÇEKLEŞEN: ürün karması + iskonto + ihracat payı dahil. Vekil fiyat serilerinden (HRC, kütük listesi) sapması karma/iskonto bilgisidir.');
    yaz1('_maliyet_ton_usd', kod + ' ton başına maliyet+gider ($/t) — (ciro − FAVÖK) ÷ ton', '$/t', seri.maliyet, 'Hammadde (cevher, kok, hurda) + enerji + işçilik + genel giderler (amortisman hariç). Sabit gider payı hacim artınca düşer.');
    yaz1('_satis_ton', kod + ' satış tonajı (bin ton, çeyreklik) — ' + T.tanim, 'bin ton', seri.ton, 'Faaliyet raporundaki kümülatif tonajın çeyrek farkı. ELLE: tazele.mjs TON_KUM (her bilanço haftası).');
    sonuc.push(kod + ' ' + sonQ + ': FAVÖK/t ' + seri.favok[sonQ] + ' $ · fiyat/t ' + seri.ciro[sonQ] + ' · maliyet/t ' + seri.maliyet[sonQ] + ' · ' + seri.ton[sonQ] + ' bin t (' + qs.length + ' çeyrek)');
    const bekleyen = Object.keys(T.k).filter(q => !seri.favok[q]); if (bekleyen.length) uyari.push(kod + ' tonaj var, bilanço arşivde yok: ' + bekleyen.join(','));
  }
  if (!sonuc.length) { raporlar.push('### Ton başına FAVÖK (§499) — ✗ ' + uyari.join(' · ')); return; }
  D.seriler_guncelleme = bugun; await yaz(dosya, D); degisenler.push('ton başına FAVÖK (' + sonuc.length + ')');
  raporlar.push('### Ton başına FAVÖK (§499) — ✓ ' + sonuc.join(' | ') + (uyari.length ? '\n- ⚠ ' + uyari.join(' · ') : ''));
}

/* ── §515 ÜLKE KREDİ NOTU — HMB RESMÎ TABLOSU (24 Eki) ─────────────────────────────────────────────────────────────────
   Kullanıcı: kart "S&P 16 Eki takvimde" diyordu, tarih geçmişti; tüm kart index.html'e elle yazılmıştı. Kaynak: Hazine ve Maliye
   Bakanlığı'nın kendi tablosu — en.hmb.gov.tr/credit-ratings bir React sayfası, içeriği WordPress JSON ucundan gelir:
     https://en.hmb.gov.tr/portal/v2/pages?slug=credit-ratings  →  [0].content.rendered (HTML tablo) · [0].modified (son düzenleme)
   24 Eki ölçüldü: Fitch BB- Stable · Moody's Ba3 Stable · S&P BB- Stable · modified 2026-04-14.
   HMB karar duyurusu YAYIMLAMIYOR (son ilgili yazı 2018) → tarih kendimiz tutulur: not/görünüm değişikliği İLK GÖRÜLDÜĞÜ gün
   `gecmis`e yazılır. Takvimdeki değerlendirme günü geçtikten 3 gün sonra tabloda değişiklik yoksa sonuç "değişiklik yok" olarak
   kendiliğinden işaretlenir. Denetim: üç ajansın üçü de geçerli not ölçeğinde olmalı — yoksa dosya YAZILMAZ (eski kalır). */
const KN_TOHUM_GECMIS = [   /* yalnız dosya YOKKEN kullanılır — panelin önceki kartından devralınan 2026 kayıtları */
  { tarih: '2026-01-23', ajans: 'Fitch', eski: { not: 'BB-', gorunum: 'Durağan' }, yeni: { not: 'BB-', gorunum: 'Pozitif' }, kaynak: 'panel arşivi' },
  { tarih: '2026-04-10', ajans: 'Fitch', eski: { not: 'BB-', gorunum: 'Pozitif' }, yeni: { not: 'BB-', gorunum: 'Durağan' }, kaynak: 'panel arşivi' },
  { tarih: '2026-07-17', ajans: 'Fitch', teyit: true, yeni: { not: 'BB-', gorunum: 'Durağan' }, kaynak: 'panel arşivi' },
  { tarih: '2026-07-24', ajans: "Moody's", teyit: true, yeni: { not: 'Ba3', gorunum: 'Durağan' }, kaynak: 'panel arşivi' }
];
const KN_TOHUM_TAKVIM = [ { ajans: 'S&P', tarih: '2026-10-16' } ];
async function krediNotu() {
  const dosya = 'kredi-notu.json';
  const U = 'https://en.hmb.gov.tr/portal/v2/pages?slug=credit-ratings';
  let j;
  try { const r = await fetch(U, { headers: { 'User-Agent': 'Mozilla/5.0 (KtPanel/1.0)', accept: 'application/json' }, signal: AbortSignal.timeout(20000) });
    if (!r.ok) { raporlar.push('### Ülke kredi notu (§515) — ⏭ HMB HTTP ' + r.status); return; } j = await r.json(); }
  catch (e) { raporlar.push('### Ülke kredi notu (§515) — ⏭ HMB erişilemedi: ' + String(e.message || e).slice(0, 60)); return; }
  const P = Array.isArray(j) ? j[0] : null; const html = P && P.content && P.content.rendered;
  if (!html) { raporlar.push('### Ülke kredi notu (§515) — ✗ HMB yanıtında içerik yok'); return; }
  const coz = s => String(s).replace(/<[^>]+>/g, ' ').replace(/&#8217;|&rsquo;/g, "'").replace(/&amp;/g, '&').replace(/&#8211;|&ndash;/g, '-').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  const GOR = { stable: 'Durağan', positive: 'Pozitif', negative: 'Negatif', developing: 'Gelişen' };
  const ajansAd = s => /fitch/i.test(s) ? 'Fitch' : /moody/i.test(s) ? "Moody's" : /s\s*&\s*p|standard/i.test(s) ? 'S&P' : /jcr/i.test(s) ? 'JCR' : /dbrs/i.test(s) ? 'DBRS' : null;
  const OLCEK = /^(AAA|AA|A|BBB|BB|B|CCC|CC|C|D|RD|SD)[+-]?$|^(Aaa|Aa[1-3]|A[1-3]|Baa[1-3]|Ba[1-3]|B[1-3]|Caa[1-3]|Ca|C)$/;
  const yeni = {};
  for (const tr of html.match(/<tr[\s\S]*?<\/tr>/gi) || []) {
    const td = (tr.match(/<td[\s\S]*?<\/td>/gi) || []).map(coz); if (td.length < 3) continue;
    const a = ajansAd(td[0]); if (!a) continue;
    const not = td[1].replace(/[–−]/g, '-').replace(/\s/g, ''); const gk = td[2].toLowerCase();
    const gorunum = Object.keys(GOR).find(k => gk.includes(k));
    yeni[a] = { not, gorunum: gorunum ? GOR[gorunum] : td[2], izleme: /watch|izleme/i.test(td[2]) || undefined };
  }
  const eksik = ['Fitch', "Moody's", 'S&P'].filter(a => !(yeni[a] && OLCEK.test(yeni[a].not)));
  if (eksik.length) { raporlar.push('### Ülke kredi notu (§515) — ✗ DENETİM: ' + eksik.join(', ') + ' okunamadı/ölçek dışı (' + JSON.stringify(yeni).slice(0, 160) + ') — dosya yazılmadı'); denetimDustu = true; return; }
  const D = (await varMi(dosya)) ? await oku(dosya) : { gecmis: KN_TOHUM_GECMIS.slice(), takvim: KN_TOHUM_TAKVIM.slice() };
  D.gecmis = D.gecmis || []; D.takvim = D.takvim || [];
  const eski = D.notlar || null; const degisen = [];
  if (eski) for (const [a, v] of Object.entries(yeni)) { const e = eski[a];
    if (e && (e.not !== v.not || e.gorunum !== v.gorunum)) { D.gecmis.push({ tarih: bugun, ajans: a, eski: { not: e.not, gorunum: e.gorunum }, yeni: { not: v.not, gorunum: v.gorunum }, kaynak: 'HMB tablosu (değişikliğin ilk görüldüğü gün)' }); degisen.push(a + ' ' + e.not + '/' + e.gorunum + ' → ' + v.not + '/' + v.gorunum); } }
  /* takvim: günü 3+ gün geçen değerlendirme kendiliğinden sonuçlanır */
  const gun = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);
  for (const t of D.takvim) { if (t.sonuc || gun(t.tarih, bugun) < 3) continue;
    const d = D.gecmis.find(g => g.ajans === t.ajans && g.tarih >= t.tarih && !g.teyit);
    t.sonuc = d ? ('değişti: ' + d.eski.not + '/' + d.eski.gorunum + ' → ' + d.yeni.not + '/' + d.yeni.gorunum) : 'değişiklik yok (HMB tablosu ' + bugun + ')';
    if (!d) D.gecmis.push({ tarih: t.tarih, ajans: t.ajans, teyit: true, yeni: { not: yeni[t.ajans].not, gorunum: yeni[t.ajans].gorunum }, kaynak: 'takvim + HMB tablosu (değişiklik yok)' }); }
  D.gecmis.sort((a, b) => a.tarih < b.tarih ? -1 : 1);
  for (const [a, v] of Object.entries(yeni)) { const s = D.gecmis.filter(g => g.ajans === a).pop(); if (s) v.son = { tarih: s.tarih, tip: s.teyit ? 'teyit' : (s.eski && s.eski.not !== s.yeni.not ? 'not' : 'görünüm') }; }
  D.notlar = yeni; D.hmb_modified = P.modified || null; D.kaynak = 'T.C. Hazine ve Maliye Bakanlığı · en.hmb.gov.tr/credit-ratings (portal/v2 JSON)';
  D.guncelleme = bugun;
  await yaz(dosya, D);
  if (degisen.length || !eski) degisenler.push('kredi notu' + (degisen.length ? ' (' + degisen.join('; ') + ')' : ''));
  raporlar.push('### Ülke kredi notu (§515) — ✓ ' + Object.entries(yeni).map(([a, v]) => a + ' ' + v.not + '/' + v.gorunum).join(' · ') + ' · HMB tablo düzenleme ' + String(P.modified || '?').slice(0, 10) + (degisen.length ? ' · ⚠ DEĞİŞİKLİK: ' + degisen.join('; ') : '') + (D.takvim.filter(t => !t.sonuc).length ? ' · bekleyen takvim: ' + D.takvim.filter(t => !t.sonuc).map(t => t.ajans + ' ' + t.tarih).join(', ') : ''));
}

/* ── §516 HKMA YEDEĞİ (24 Eki) ───────────────────────────────────────────────────────────────────────────────────────────
   Sağlık bekçisi üç tur üst üste (ABD çıkışından) /api/market?mod=hkma'da "HKMA HTTP 405/502" gördü; TR'den aynı uç sağlamdı →
   HKMA, Vercel'in çıkış IP'sini ARALIKLI reddediyor. Bülten aylık olduğundan Actions aynı veriyi KENDİ sunucusundan çeker ve
   ktpanel/hkma.json'a yazar; köprü canlı yol düşünce bu dosyayı döner (yedek:true). İki bağımsız çıkış yolu = tek noktadan kırılma yok.
   Hesap market.js hkmaModu ile BİREBİR aynı (alan adları dahil) — iki yol aynı şekli döndürür. Okunamazsa dosya korunur. */
async function hkmaYedek() {
  const dosya = 'hkma.json';
  const u = 'https://api.hkma.gov.hk/public/market-data-and-statistics/monthly-statistical-bulletin/financial/monetary-statistics';
  let j = null, durum = '';
  for (const bekle of [0, 1500, 4000]) {
    if (bekle) await new Promise(x => setTimeout(x, bekle));
    try { const r = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0 (KtPanel/1.0)', Accept: 'application/json' }, signal: AbortSignal.timeout(20000) });
      durum = 'HTTP ' + r.status; if (r.ok) { j = await r.json(); break; } } catch (e) { durum = String(e.message || e).slice(0, 50); }
  }
  if (!(j && j.header && j.header.success && j.result && j.result.records)) { raporlar.push('### HKMA yedeği (§516) — ⏭ ' + durum + ' · mevcut hkma.json korunuyor'); return; }
  const aylik = j.result.records.filter(x => x.end_of_month && !/-00$/.test(x.end_of_month));
  if (aylik.length < 2) { raporlar.push('### HKMA yedeği (§516) — ✗ yeterli aylık kayıt yok'); return; }
  const son = aylik[0], once = aylik[1];
  const f = (a, b) => a != null && b != null ? +(a - b).toFixed(3) : null;
  const veri = {
    ay: son.end_of_month,
    hkdUsd: { deger: son.exrate_hkd_usd, fark: f(son.exrate_hkd_usd, once.exrate_hkd_usd), bandKonum: son.exrate_hkd_usd != null ? +(((son.exrate_hkd_usd - 7.75) / 0.10) * 100).toFixed(0) : null },
    aggrBalance: { deger: son.aggr_balance, fark: f(son.aggr_balance, once.aggr_balance) },
    hiborON: { deger: son.hibor_fixing_overnight, fark: f(son.hibor_fixing_overnight, once.hibor_fixing_overnight) },
    hibor3M: { deger: son.hibor_fixing_3m, fark: f(son.hibor_fixing_3m, once.hibor_fixing_3m) },
    y10: { deger: son.yield_govbond_10y, fark: f(son.yield_govbond_10y, once.yield_govbond_10y) },
    bazFaiz: { deger: son.discount_window_base_rate }
  };
  const eski = (await varMi(dosya)) ? await oku(dosya) : null;
  await yaz(dosya, { guncelleme: bugun, alinma: new Date().toISOString(), kaynak: 'HKMA Monthly Statistical Bulletin (Actions yedeği · §516)', veri });
  if (!eski || !eski.veri || eski.veri.ay !== veri.ay) degisenler.push('HKMA yedeği (' + veri.ay + ')');
  raporlar.push('### HKMA yedeği (§516) — ✓ ' + veri.ay + ' · USD/HKD ' + veri.hkdUsd.deger + ' · HIBOR 3A ' + veri.hibor3M.deger);
}

/* ── §529 FAKTÖR KARNESİ + SİCİL AYRIŞTIRMASI (25 Eki) ──────────────────────────────────────────────────────────────────
   Kullanıcı: "faktör modelim var ama zaten panelde?" — var; ama iki şeyi ölçemiyordu:
   (1) MODEL KARNESİ bozuktu: "ilk 10 / son 10" getirisini fm.json'un BUGÜNKÜ skorlarıyla multiple.json'un BUGÜNKÜ fiyatı arasında
       ölçüyordu. İkisi de §455/§496 ile her gün tazelendiği için ölçülen ufuk ~0 gündü → "+0,0% (7 hisse)". Skoru ölçmek için
       NOKTA-ZAMAN (point-in-time) skor gerekir: o gün bilinen skor → sonraki getiri.
   (2) Sicil (Top-40 eşit ağırlık, 14 Tem) XKTUM'un 6,3 puan gerisindeydi ve NEDENİ görünmüyordu.
   YENİ: fm-arsiv.json — skor fotoğrafları (Koyfin dönemi 14 Tem · 24 Ağu git geçmişinden, sonra her hafta ilk fotoğraf).
   fm-karne.json — her fotoğraf × ufuk (1A=21 iş günü · 3A=63 · bugüne) için faktör başına SIRA IC'si (Spearman), sektör-nötr IC,
   kompozit beşli dilim getirileri; ve sicil penceresi (kuruluştan · 3A · 1A) için ayrıştırma:
     fark (model − XKTUM) = AĞIRLIK ETKİSİ (eşit ağırlıklı evren − XKTUM) + SEÇİM ETKİSİ (model − eşit ağırlıklı evren);
     seçim etkisi = sektör dağılımı + sektör içi seçim (Brinson-Fachler, eşit ağırlıklı evrene karşı)
                  = Σ aktif faktör maruziyeti × faktör getirisi (yatay kesit EKK) + hisseye özgü kalan.
   Fiyat: fmHesapla'nın zaten çektiği Yahoo adjclose (bölünme/bedelsiz/temettü düzeltilmiş); evrenden çıkan hisseler ayrıca çekilir.
   Endeks: endeks-arsiv.json XKTUM (resmî). Bu blok VERİ ÜRETMEZ, ÖLÇER — fm.json'a dokunmaz. */
const FMK_FAK = ['VALUE', 'GROWTH', 'QUALITY', 'MOMENTUM', 'LOW_RISK'];
const FMK_DEFW = { QUALITY: 0.30, VALUE: 0.25, MOMENTUM: 0.20, LOW_RISK: 0.15, GROWTH: 0.10 };
/* Git geçmişindeki değişmez fotoğraflar (commit SHA). Arşiv ilk kez kurulurken raw.githubusercontent'tan okunur. */
const FMK_TOHUM = [
  { sha: 'eb7b967e8af4cece853b9b26469b8de60aa27869', kaynak: 'Koyfin CSV (elle, 14 Tem)' },
  { sha: '519718280bdf4d1fb7f2bab4ce42212f0e2a463e', kaynak: 'Koyfin CSV (elle, 24 Ağu)' },
  { sha: '96fd92561b5fd1f52d3102e98142c994fbee30e3', kaynak: '§455 KAP+Yahoo' },
  { sha: '69cd71151517cfc26158a1e4a584abc6c57cc892', kaynak: '§455 KAP+Yahoo' }
];
let FM_PX_SON = null;   /* fmHesapla'nın çektiği fiyatlar — karne aynı koşuda yeniden çekmesin */

function fmkSpearman(x, y) {
  const n = x.length; if (n < 8 || y.length !== n) return null;
  const sira = a => { const ix = a.map((v, i) => [v, i]).sort((p, q) => p[0] - q[0]); const r = new Array(n); let i = 0;
    while (i < n) { let j = i; while (j + 1 < n && ix[j + 1][0] === ix[i][0]) j++; const o = (i + j) / 2 + 1; for (let k = i; k <= j; k++) r[ix[k][1]] = o; i = j + 1; } return r; };
  const rx = sira(x), ry = sira(y), m = (n + 1) / 2; let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) { const a = rx[i] - m, b = ry[i] - m; sxy += a * b; sxx += a * a; syy += b * b; }
  return (sxx > 0 && syy > 0) ? sxy / Math.sqrt(sxx * syy) : null;
}
function fmkEkk(X, y) {   /* sabitli EKK, normal denklemler + kısmi pivotlu Gauss; sabit dışı köşegene çok küçük sırt (tekillik emniyeti) */
  const n = X.length; if (!n) return null; const p = X[0].length + 1; if (n < p + 10) return null;
  const A = Array.from({ length: p }, () => new Array(p).fill(0)), b = new Array(p).fill(0);
  for (let i = 0; i < n; i++) { const r = [1, ...X[i]]; for (let a = 0; a < p; a++) { b[a] += r[a] * y[i]; for (let c = 0; c < p; c++) A[a][c] += r[a] * r[c]; } }
  for (let a = 1; a < p; a++) A[a][a] += 1e-8 * n;
  for (let c = 0; c < p; c++) { let pv = c; for (let r = c + 1; r < p; r++) if (Math.abs(A[r][c]) > Math.abs(A[pv][c])) pv = r;
    [A[c], A[pv]] = [A[pv], A[c]]; [b[c], b[pv]] = [b[pv], b[c]]; if (Math.abs(A[c][c]) < 1e-12) return null;
    for (let r = 0; r < p; r++) if (r !== c) { const f = A[r][c] / A[c][c]; if (!f) continue; for (let k = c; k < p; k++) A[r][k] -= f * A[c][k]; b[r] -= f * b[c]; } }
  const beta = b.map((v, i) => v / A[i][i]);
  const yh = X.map(r => beta[0] + r.reduce((s, v, k) => s + v * beta[k + 1], 0)); const my = y.reduce((s, v) => s + v, 0) / n;
  const sst = y.reduce((s, v) => s + (v - my) ** 2, 0), sse = y.reduce((s, v, i) => s + (v - yh[i]) ** 2, 0);
  return { beta, r2: sst > 0 ? 1 - sse / sst : null };
}
/* SAF ÇEKİRDEK (Node + tarayıcı): G = { anliklar:[{tarih,kaynak,defw,h:{KOD:{s,f:[5]}}}], takvim:[iş günleri, artan], son,
   kapanis:(kod,tarih)=>fiyat|null, endeks:(tarih)=>XKTUM|null, xkW:{KOD:ağırlık%}|null, xkTarih, track:{inception,holdings:[{t,w}]} } */
function fmKarneCekirdek(G) {
  const T = G.takvim, son = G.son;
  const idx = d => { let lo = 0, hi = T.length - 1, a = -1; while (lo <= hi) { const m = (lo + hi) >> 1; if (T[m] <= d) { a = m; lo = m + 1; } else hi = m - 1; } return a; };
  const kaydir = (d, n) => { const i = idx(d); if (i < 0) return null; const k = i + n; return (k >= 0 && k < T.length && T[k] <= son) ? T[k] : null; };
  const getiri = (k, a, b) => { const p0 = G.kapanis(k, a), p1 = G.kapanis(k, b); return (p0 > 0 && p1 > 0) ? p1 / p0 - 1 : null; };
  const ort = a => a.length ? a.reduce((s, v) => s + v, 0) / a.length : null;
  const yv = (v, d = 2) => (v == null || !isFinite(v)) ? null : +(+v).toFixed(d);
  const sayi = v => typeof v === 'number' && isFinite(v);
  const kompozit = (f, w) => { let s = 0, ws = 0; FMK_FAK.forEach((k, i) => { const v = f && f[i]; if (sayi(v) && (w[k] || 0) > 0) { s += w[k] * v; ws += w[k]; } }); return ws > 0 ? s / ws : null; };
  const sekNotr = R => { const g = {}; R.forEach(x => { (g[x.s] = g[x.s] || []).push(x.r); }); const gm = ort(R.map(x => x.r)); const m = {};
    Object.entries(g).forEach(([s, a]) => { m[s] = a.length >= 3 ? ort(a) : gm; }); return R.map(x => x.r - m[x.s]); };
  const tIst = (v, n) => (v == null || n <= 2) ? null : v * Math.sqrt((n - 2) / Math.max(1e-9, 1 - v * v));
  const winsor = (a, p) => { const s = [...a].sort((x, y) => x - y); const lo = s[Math.floor(p * (s.length - 1))], hi = s[Math.ceil((1 - p) * (s.length - 1))]; return a.map(v => Math.min(hi, Math.max(lo, v))); };
  const ANL = [...G.anliklar].sort((a, b) => a.tarih < b.tarih ? -1 : 1);

  /* 1) KARNE — fotoğraf × ufuk */
  const UFUK = [{ ad: '1A', n: 21 }, { ad: '3A', n: 63 }, { ad: 'bugune', n: null }];
  const karne = [];
  for (const S of ANL) {
    if (idx(S.tarih) < 0) continue;
    const w = S.defw || FMK_DEFW;
    const satir = Object.entries(S.h).map(([k, v]) => ({ k, s: (v && v.s) || 'Bilinmiyor', f: (v && v.f) || [], c: kompozit(v && v.f, w) })).filter(x => x.c != null);
    const bitisler = new Set();
    for (const U of UFUK) {
      const bitis = U.n ? kaydir(S.tarih, U.n) : son; if (!bitis || bitisler.has(bitis)) continue;
      const isg = idx(bitis) - idx(S.tarih); if (isg < 5) continue; bitisler.add(bitis);
      const R = satir.map(x => ({ ...x, r: getiri(x.k, S.tarih, bitis) })).filter(x => x.r != null);
      if (R.length < 30) continue;
      const rs = sekNotr(R); const ic = {}, icSn = {}, t = {};
      FMK_FAK.forEach((f, i) => { const P = R.map((x, j) => [x.f[i], x.r, rs[j]]).filter(p => sayi(p[0]));
        const v = fmkSpearman(P.map(p => p[0]), P.map(p => p[1])), vs = fmkSpearman(P.map(p => p[0]), P.map(p => p[2]));
        ic[f] = yv(v, 3); icSn[f] = yv(vs, 3); t[f] = yv(tIst(v, P.length), 2); });
      const vK = fmkSpearman(R.map(x => x.c), R.map(x => x.r));
      ic.KOMPOZIT = yv(vK, 3); icSn.KOMPOZIT = yv(fmkSpearman(R.map(x => x.c), rs), 3); t.KOMPOZIT = yv(tIst(vK, R.length), 2);
      const sr = [...R].sort((a, b) => b.c - a.c); const q = [];
      for (let g = 0; g < 5; g++) q.push(yv(ort(sr.slice(Math.floor(g * sr.length / 5), Math.floor((g + 1) * sr.length / 5)).map(x => x.r)) * 100, 2));
      const i10 = ort(sr.slice(0, 10).map(x => x.r)), s10 = ort(sr.slice(-10).map(x => x.r));
      karne.push({ tarih: S.tarih, kaynak: S.kaynak, ufuk: U.ad, bitis, isgunu: isg, n: R.length, evren: satir.length,
        ic, ic_sn: icSn, t, anlam_esik: yv(2 / Math.sqrt(R.length), 3), kuintil: q, makas: (q[0] != null && q[4] != null) ? yv(q[0] - q[4], 2) : null,
        ilk10: yv(i10 * 100, 2), son10: yv(s10 * 100, 2), makas10: yv((i10 - s10) * 100, 2), evren_ort: yv(ort(R.map(x => x.r)) * 100, 2) });
    }
  }
  /* 2) BİRİKEN KANIT — sabit ufuklarda faktör başına ortalama IC */
  const kanit = {};
  for (const u of ['1A', '3A']) { const L = karne.filter(x => x.ufuk === u); if (!L.length) continue; kanit[u] = {};
    [...FMK_FAK, 'KOMPOZIT'].forEach(f => { const v = L.map(x => x.ic[f]).filter(sayi); if (v.length) kanit[u][f] = { ort: yv(ort(v), 3), n: v.length, pozitif: v.filter(x => x > 0).length }; }); }

  /* 3) SİCİL AYRIŞTIRMASI */
  const ayr = []; const H0 = (G.track && G.track.holdings) || []; const ink = G.track && G.track.inception;
  const pen = []; if (ink && idx(ink) >= 0) pen.push({ ad: 'kurulus', bas: T[idx(ink)] });
  const b3 = kaydir(son, -63), b1 = kaydir(son, -21);
  if (b3 && (!ink || b3 > ink)) pen.push({ ad: '3A', bas: b3 }); if (b1 && (!ink || b1 > ink)) pen.push({ ad: '1A', bas: b1 });
  const Hs = new Set(H0.map(h => h.t)); const Hw = new Map(H0.map(h => [h.t, sayi(h.w) && h.w > 0 ? h.w : 1]));
  for (const W of pen) {
    const S = ANL.filter(a => a.tarih <= W.bas).pop(); if (!S) { ayr.push({ pencere: W.ad, bas: W.bas, hata: 'pencere başından önce skor fotoğrafı yok' }); continue; }
    const evr = new Map(); Object.entries(S.h).forEach(([k, v]) => evr.set(k, { k, s: (v && v.s) || 'Bilinmiyor', f: (v && v.f) || [] }));
    H0.forEach(h => { if (!evr.has(h.t)) { const x = ANL.map(a => a.h[h.t]).find(Boolean); evr.set(h.t, { k: h.t, s: (x && x.s) || 'Bilinmiyor', f: [], ek: true }); } });
    const U = [...evr.values()].map(x => ({ ...x, r: getiri(x.k, W.bas, son) })).filter(x => x.r != null);
    const HP = U.filter(x => Hs.has(x.k));
    if (HP.length < H0.length * 0.8 || U.length < 40) { ayr.push({ pencere: W.ad, bas: W.bas, hata: 'kapsam yetersiz: sepet ' + HP.length + '/' + H0.length + ' · evren ' + U.length }); continue; }
    const wT = HP.reduce((s, x) => s + Hw.get(x.k), 0); const wp = new Map(HP.map(x => [x.k, Hw.get(x.k) / wT]));
    const Rp = HP.reduce((s, x) => s + wp.get(x.k) * x.r, 0), Rew = ort(U.map(x => x.r));
    const e0 = G.endeks(W.bas), e1 = G.endeks(son); const Rb = (e0 > 0 && e1 > 0) ? e1 / e0 - 1 : null;
    /* piyasa değeri ağırlıklı yeniden kurulum: başlangıç ağırlığı = bugünkü ağırlık ÷ (1 + bas→xkTarih getirisi) */
    let Rcw = null, konst = null, xkKap = null; const w0m = new Map();
    if (G.xkW) { const K = [];
      for (const [k, w] of Object.entries(G.xkW)) { if (!(w > 0)) continue; const rx = getiri(k, W.bas, G.xkTarih || son), r = getiri(k, W.bas, son); if (rx == null || r == null) continue; K.push({ k, w0: w / (1 + rx), r }); }
      const t0 = K.reduce((s, x) => s + x.w0, 0);
      if (K.length >= 30 && t0 > 0) { K.forEach(x => { x.w0 /= t0; w0m.set(x.k, x.w0); }); K.sort((p, q) => q.w0 - p.w0); xkKap = K.length;
        Rcw = K.reduce((s, x) => s + x.w0 * x.r, 0);
        const ilk = K.slice(0, 3), iw = ilk.reduce((s, x) => s + x.w0, 0), ik = ilk.reduce((s, x) => s + x.w0 * x.r, 0);
        konst = { ilk3: ilk.map(x => ({ k: x.k, w0: yv(x.w0 * 100, 1), r: yv(x.r * 100, 1), modelde: Hs.has(x.k), model_w: Hs.has(x.k) ? yv(wp.get(x.k) * 100, 1) : 0 })),
          ilk3_agirlik: yv(iw * 100, 1), ilk3_katki: yv(ik * 100, 2), kalan_getiri: yv((Rcw - ik) / Math.max(1e-9, 1 - iw) * 100, 2) }; } }
    /* Brinson-Fachler — kıyas: AYNI evrenin eşit ağırlıklısı (Σ dağılım + Σ seçim = Rp − Rew, tam) */
    const sek = {}; U.forEach(x => { const o = sek[x.s] = sek[x.s] || { s: x.s, nU: 0, rU: 0, wP: 0, rP: 0, nP: 0 }; o.nU++; o.rU += x.r; if (wp.has(x.k)) { o.wP += wp.get(x.k); o.rP += wp.get(x.k) * x.r; o.nP++; } });
    let dT = 0, sT = 0;
    const B = Object.values(sek).map(o => { const wu = o.nU / U.length, ru = o.rU / o.nU, rp = o.wP > 0 ? o.rP / o.wP : null;
      const d = (o.wP - wu) * (ru - Rew), s = o.wP > 0 ? o.wP * (rp - ru) : 0; dT += d; sT += s;
      return { s: o.s, n_evren: o.nU, n_model: o.nP, wp: yv(o.wP * 100, 1), wu: yv(wu * 100, 1), rp: rp == null ? null : yv(rp * 100, 1), ru: yv(ru * 100, 1), dagilim: yv(d * 100, 2), secim: yv(s * 100, 2) }; })
      .sort((a, b) => (Math.abs(b.dagilim) + Math.abs(b.secim)) - (Math.abs(a.dagilim) + Math.abs(a.secim)));
    /* Faktör: yatay kesit EKK  r_i = a + Σ b_k z_ik (+ büyüklük) — eksik z = 0 (evren ortalaması), z ±3'te kırpılır, getiri %2/%98 winsor */
    const FX = U.map(x => FMK_FAK.map((f, i) => sayi(x.f[i]) ? Math.max(-3, Math.min(3, x.f[i])) : 0));
    let boy = false;
    if (w0m.size) { const lw = U.map(x => w0m.has(x.k) ? Math.log(w0m.get(x.k)) : null); const v = lw.filter(sayi).sort((a, b) => a - b);
      if (v.length >= U.length * 0.8) { const p10 = v[Math.floor(0.1 * (v.length - 1))]; const L2 = lw.map(z => sayi(z) ? z : p10); const m = ort(L2), sd = Math.sqrt(ort(L2.map(z => (z - m) ** 2))) || 1;
        L2.forEach((z, i) => FX[i].push((z - m) / sd)); boy = true; } }
    const AD = boy ? [...FMK_FAK, 'BUYUKLUK'] : FMK_FAK.slice();
    const O = fmkEkk(FX, winsor(U.map(x => x.r), 0.02)); let faktor = null;
    if (O) { const ix = new Map(U.map((x, i) => [x.k, i])); let kT = 0;
      const L = AD.map((f, j) => { const hm = HP.reduce((s, x) => s + wp.get(x.k) * FX[ix.get(x.k)][j], 0), um = ort(FX.map(r => r[j])); const k = (hm - um) * O.beta[j + 1]; kT += k;
        return { f, model: yv(hm, 2), evren: yv(um, 2), aktif: yv(hm - um, 2), getiri_1s: yv(O.beta[j + 1] * 100, 2), katki: yv(k * 100, 2) }; });
      faktor = { r2: yv(O.r2, 3), n: U.length, boyut: boy, satirlar: L, toplam: yv(kT * 100, 2), kalan: yv(((Rp - Rew) - kT) * 100, 2) }; }
    /* kuruluş penceresi: eşit ağırlıklı evrenin GÜNLÜK serisi — sicil grafiğinde üçüncü çizgi (faktörün asıl kıyası) */
    let seri = null;
    if (W.ad === 'kurulus') { seri = []; const p0 = new Map(U.map(x => [x.k, G.kapanis(x.k, W.bas)]));
      for (let i = idx(W.bas); i <= idx(son); i++) { const d = T[i]; const v = [];
        for (const x of U) { const a = p0.get(x.k), b = G.kapanis(x.k, d); if (a > 0 && b > 0) v.push(b / a - 1); }
        if (v.length >= U.length * 0.8) seri.push({ d, ew: yv(ort(v) * 100, 2) }); } }
    const kat = HP.map(x => ({ k: x.k, s: x.s, r: x.r, katki: wp.get(x.k) * (x.r - Rew) })).sort((a, b) => b.katki - a.katki);
    const fk = x => ({ k: x.k, s: x.s, r: yv(x.r * 100, 1), katki: yv(x.katki * 100, 2) });
    ayr.push({ pencere: W.ad, bas: W.bas, bitis: son, anlik: S.tarih, anlik_kaynak: S.kaynak, anlik_yas_isgunu: idx(W.bas) - idx(S.tarih),
      n_sepet: HP.length, n_sepet_toplam: H0.length, n_evren: U.length,
      Rp: yv(Rp * 100, 2), Rew: yv(Rew * 100, 2), Rb: Rb == null ? null : yv(Rb * 100, 2), Rcw: Rcw == null ? null : yv(Rcw * 100, 2), xk_kapsam: xkKap,
      fark: Rb == null ? null : yv((Rp - Rb) * 100, 2), agirlik_etkisi: Rb == null ? null : yv((Rew - Rb) * 100, 2), secim_etkisi: yv((Rp - Rew) * 100, 2),
      konsantrasyon: konst, sektor: { satirlar: B, dagilim: yv(dT * 100, 2), secim: yv(sT * 100, 2) }, faktor,
      en_iyi: kat.slice(0, 5).map(fk), en_kotu: kat.slice(-5).reverse().map(fk), ...(seri ? { seri } : {}) });
  }
  return { karne, kanit, ayristirma: ayr };
}

/* Yahoo adjclose — fmHesapla'daki 'tek' ile aynı kural (seans bitmeden günün barı kullanılmaz) */
async function fmkFiyatCek(kodlar) {
  const PX = {}; let i = 0;
  const bugunTR = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Istanbul' }); const saatTR = +new Date().toLocaleTimeString('en-GB', { timeZone: 'Europe/Istanbul', hour: '2-digit', hour12: false });
  const tek = async kod => { try {
    const r = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(kod + '.IS') + '?interval=1d&range=1y', { headers: { 'User-Agent': 'Mozilla/5.0 (KtPanel/1.0)' }, signal: AbortSignal.timeout(15000) });
    if (!r.ok) return; const d = (await r.json())?.chart?.result?.[0]; if (!d) return;
    const adj = d.indicators?.adjclose?.[0]?.adjclose, ham = d.indicators?.quote?.[0]?.close, vol = d.indicators?.quote?.[0]?.volume, ts = d.timestamp || [];
    const cc = (Array.isArray(adj) && adj.some(x => typeof x === 'number')) ? adj : (ham || []);
    let sonIdx = ts.length - 1; while (sonIdx >= 0 && new Date(ts[sonIdx] * 1000).toLocaleDateString('sv-SE', { timeZone: 'Europe/Istanbul' }) === bugunTR && saatTR < 19) sonIdx--;
    const o = { t: [], c: [], v: [] }; for (let j = 0; j <= sonIdx; j++) if (typeof cc[j] === 'number' && cc[j] > 0) { o.t.push(new Date(ts[j] * 1000).toISOString().slice(0, 10)); o.c.push(cc[j]); o.v.push(typeof (vol || [])[j] === 'number' ? vol[j] : 0); }
    if (o.c.length >= 20) PX[kod] = o;
  } catch (e) {} };
  const isci = async () => { while (i < kodlar.length) { const k = kodlar[i++]; await tek(k); } };
  await Promise.all(Array.from({ length: 6 }, isci));
  return PX;
}
async function fmArsivGuncelle() {
  const dosya = 'fm-arsiv.json';
  let A = null; try { if (await varMi(dosya)) A = await oku(dosya); } catch (e) {}
  if (!A || !Array.isArray(A.anliklar)) A = { anliklar: [] };
  A._not = '§529 faktör skoru NOKTA-ZAMAN arşivi: o gün bilinen skor (fm.json data) — karne bunlardan sonraki getiriyi ölçer. Koyfin dönemi (14 Tem · 24 Ağu) git geçmişinden; sonra her ISO haftanın ilk fotoğrafı. 26 haftadan eskiler ayda bire seyreltilir; Koyfin tohumları kalıcı.';
  const ekle = (F, kaynak) => { const m = (F && F.meta) || {}; const tarih = m.tarih; if (!tarih || !Array.isArray(F.data) || F.data.length < 30) return false;
    if (A.anliklar.some(a => a.tarih === tarih)) return false;
    const h = {}; F.data.forEach(r => { if (r && r.t && Array.isArray(r.f)) h[r.t] = { s: r.s || 'Bilinmiyor', f: r.f.map(v => (typeof v === 'number' && isFinite(v)) ? +v.toFixed(3) : null) }; });
    A.anliklar.push({ tarih, kaynak, defw: m.defw || FMK_DEFW, n: Object.keys(h).length, h }); return true; };
  let tohum = 0;
  if (!A.tohum_tamam) { const repo = process.env.GITHUB_REPOSITORY || 'fkasap/Ktpanel2'; const yol = path.relative(process.cwd(), path.join(KOK, 'fm.json')).split(path.sep).join('/');
    let hepsi = true;
    for (const t of FMK_TOHUM) { try { const r = await fetch('https://raw.githubusercontent.com/' + repo + '/' + t.sha + '/' + yol, { signal: AbortSignal.timeout(20000) });
        if (!r.ok) { hepsi = false; continue; } if (ekle(await r.json(), t.kaynak)) tohum++; } catch (e) { hepsi = false; } }
    if (hepsi) A.tohum_tamam = bugun; }
  /* bugünkü fotoğraf: aynı ISO haftada §455 fotoğrafı yoksa eklenir */
  let yeni = false;
  try { const F = await oku('fm.json'); const tarih = F.meta && F.meta.tarih;
    const hafta = d => { const x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7)); return x.toISOString().slice(0, 10); };   /* haftanın pazartesisi */
    if (tarih && !A.anliklar.some(a => hafta(a.tarih) === hafta(tarih))) yeni = ekle(F, String((F.meta && F.meta._kaynak) || '').indexOf('§455') >= 0 ? '§455 KAP+Yahoo' : 'fm.json'); } catch (e) {}
  /* seyreltme: Koyfin tohumu kalıcı; 26 haftadan eski §455 fotoğrafları ayda bire */
  A.anliklar.sort((a, b) => a.tarih < b.tarih ? -1 : 1);
  const sinir = new Date(Date.now() - 182 * 864e5).toISOString().slice(0, 10); const ayG = new Set();
  A.anliklar = A.anliklar.filter(a => { if (/Koyfin/.test(a.kaynak) || a.tarih >= sinir) return true; const ay = a.tarih.slice(0, 7); if (ayG.has(ay)) return false; ayG.add(ay); return true; });
  A.guncelleme = bugun;
  await fs.writeFile(path.join(KOK, dosya), JSON.stringify(A), 'utf8');   /* tek satır: girintili yazım 4 kat şişirir */
  if (tohum || yeni) degisenler.push('fm-arsiv' + (tohum ? ' (tohum ' + tohum + ')' : ' (+1 fotoğraf)'));
  return { A, tohum, yeni };
}
async function fmKarneUret(PXgelen) {
  const { A, tohum, yeni } = await fmArsivGuncelle();
  if (A.anliklar.length < 1) { raporlar.push('### Faktör karnesi (§529) — ⏭ arşivde skor fotoğrafı yok'); return; }
  let ar = {}; try { ar = (await oku('endeks-arsiv.json')).gunler || {}; } catch (e) {}
  const sinir = new Date(Date.now() - 400 * 864e5).toISOString().slice(0, 10);
  const takvim = Object.keys(ar).filter(g => g >= sinir && ar[g] && ar[g].XKTUM > 0).sort();
  if (takvim.length < 30) { raporlar.push('### Faktör karnesi (§529) — ⏭ endeks arşivinde XKTUM takvimi yok'); return; }
  let track = null; try { track = await oku('track.json'); } catch (e) {}
  let xk = null; try { xk = await oku('xktum.json'); } catch (e) {}
  const gerek = new Set(); A.anliklar.forEach(a => Object.keys(a.h).forEach(k => gerek.add(k))); ((track && track.holdings) || []).forEach(h => gerek.add(h.t)); Object.keys((xk && xk.uyeler) || {}).forEach(k => gerek.add(k));
  const PX = Object.assign({}, PXgelen || {}); const eksik = [...gerek].filter(k => !PX[k]).slice(0, 320);
  if (eksik.length) Object.assign(PX, await fmkFiyatCek(eksik));
  const kapanis = (k, d) => { const o = PX[k]; if (!o || !o.t.length) return null; let lo = 0, hi = o.t.length - 1, a = -1; while (lo <= hi) { const m = (lo + hi) >> 1; if (o.t[m] <= d) { a = m; lo = m + 1; } else hi = m - 1; }
    if (a < 0) return null; return ((Date.parse(d) - Date.parse(o.t[a])) / 864e5 <= 7) ? o.c[a] : null; };
  /* son = fiyat kapsamı ≥%70 olan en yeni iş günü (Yahoo bir gün geride kalabilir) */
  const kodL = Object.keys(PX); let son = null;
  for (let i = takvim.length - 1; i >= Math.max(0, takvim.length - 6); i--) { const d = takvim[i]; const v = kodL.filter(k => PX[k].t[PX[k].t.length - 1] >= d).length; if (v >= kodL.length * 0.7) { son = d; break; } }
  if (!son) { raporlar.push('### Faktör karnesi (§529) — ✗ fiyat kapsamı yetersiz (' + kodL.length + ' seri)'); return; }
  const endeks = d => { let a = null; for (const g of takvim) { if (g <= d) a = g; else break; } return a ? ar[a].XKTUM : null; };
  const C = fmKarneCekirdek({ anliklar: A.anliklar, takvim, son, kapanis, endeks, xkW: (xk && xk.uyeler) || null, xkTarih: (xk && xk.fiyat_tarihi) || son,
    track: track ? { inception: track.inception, holdings: track.holdings } : null });
  if (!C.karne.length && !C.ayristirma.length) { raporlar.push('### Faktör karnesi (§529) — ✗ karne de ayrıştırma da boş (fotoğraf ' + A.anliklar.length + ', fiyat ' + kodL.length + ') — dosya yazılmadı'); return; }
  const ts = track && Array.isArray(track.series) && track.series.length ? track.series[track.series.length - 1] : null;
  const out = { guncelleme: bugun, son, kaynak: 'fm-arsiv.json (nokta-zaman skor) · Yahoo adjclose · endeks-arsiv.json XKTUM · track.json · xktum.json',
    _yontem: '§529 IC = Spearman sıra korelasyonu (skor ↔ sonraki getiri). Sektör-nötr IC: getiriden sektör ortalaması çıkarılır. |IC| > 2/√n ≈ %95 anlamlılık (tek kesit). Örtüşen pencereler bağımsız değildir. Ayrıştırma: eşit ağırlıklı evren kıyası; faktör katkısı = aktif maruziyet × EKK faktör getirisi, kalan = hisseye özgü.',
    fotograflar: A.anliklar.map(a => ({ tarih: a.tarih, kaynak: a.kaynak, n: a.n })), track_resmi: ts ? { tarih: ts.d, model: ts.model, endeks: ts.endeks, inception: track.inception } : null, ...C };
  await yaz('fm-karne.json', out); degisenler.push('fm-karne');
  const ana = C.ayristirma.find(x => x.pencere === 'kurulus' && !x.hata);
  const ic0 = C.karne.find(x => track && x.tarih === track.inception && x.ufuk === 'bugune');
  raporlar.push('### Faktör karnesi (§529) — ✓ ' + A.anliklar.length + ' fotoğraf' + (tohum ? ' (tohum +' + tohum + ')' : '') + (yeni ? ' · bu hafta +1' : '') + ' · ' + C.karne.length + ' karne satırı · son ' + son +
    (ana ? ' · sicil: model ' + ana.Rp + '% / eşit ağ. evren ' + ana.Rew + '% / XKTUM ' + ana.Rb + '% → ağırlık etkisi ' + ana.agirlik_etkisi + ' · seçim ' + ana.secim_etkisi : '') +
    (ic0 ? ' · kuruluş fotoğrafı kompozit IC ' + ic0.ic.KOMPOZIT + ' (n ' + ic0.n + ')' : '') + (eksik.length ? ' · ek fiyat ' + eksik.length : ''));
}

/* ── §530 TOPARLANMA MONİTÖRÜ (25 Eki) ──────────────────────────────────────────────────────────────────────────────────
   Kullanıcı: "Türk piyasası momentumdan çıktı ve sert düştü; toparlanmayı yakalamak istiyorum." Panelde düşüşü ölçen çok şey vardı
   (risk barometresi, taktik model, sektör ısısı) ama "dönüş BAŞLADI MI" sorusunu soran bir şey yoktu. Dibi günü gününe yakalamak
   güvenilir değildir; yakalanabilen, dönüşün KANIT biriktirdiği andır. Üç aşama + bir sepet:
     1 BASKI TÜKENİYOR MU — kapitülasyon günü (hisselerin ≥%90'ı düşer, eşit ağırlıklı gün ≤ −%3, ciro ≥ 1,5× 20g ort.) ya da
       "dip daralması" (6 aylık dip yapan hisse oranının 5g ortalaması, son 30g tepesinin yarısının altına iner); fon tasfiye
       listesindeki hisseler (§452 baskı) son 10 günde evrenin gerisinde kalmayı bırakır.
     2 OYNAKLIK SAKİNLEŞİYOR MU — eşit ağırlıklı evrenin RV20'si son 60g tepesinin %75'inin altına iner · TR CDS 10g'de daralır.
     3 KATILIM GELDİ Mİ (teyit) — genişlik itkisi (Zweig 1986: yükselen/(yükselen+düşen) 10g ÜHO'su 10 iş günü içinde <0,40'tan
       >0,615'e) ya da 50 günlük ortalamasının üstündeki hisse oranı son 30g'de ≤%20'den ≥%50'ye çıkar.
   SEPET: XKTUM ağırlığı ≥%0,05 (likidite) · son 3 ayda en çok düşen + betası yüksek · KALİTE z ≥ −0,25 (ilk dalga çöpü de kaldırır,
   ikinci dalga geri bırakır — Daniel & Moskowitz 2016 "Momentum Crashes": dönüşte kaybedenler önden koşar).
   MOMENTUM RİSKİ: eşit ağırlıklı evren 6 ayda eksideyse VE RV20 yıllık medyanın üstündeyse "yüksek" — savunmacı faktör eğiminin
   (değer + düşük risk) sert toparlanmada geride kalma riski.
   Fiyat: fmHesapla'nın Yahoo adjclose + hacim (aynı koşu, yeniden çekilmez). Endeks: endeks-arsiv.json XKTUM. CDS: cds.json. */
function toparlanmaCekirdek(G) {
  const sayi = v => typeof v === 'number' && isFinite(v);
  const yv = (v, d = 2) => sayi(v) ? +v.toFixed(d) : null;
  const ort = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : null;
  const T = G.takvim; const N = T.length; if (N < 80) return null;
  const kodlar = Object.keys(G.PX).filter(k => G.PX[k] && G.PX[k].c && G.PX[k].c.length >= 60);
  /* her hisse için takvim günü → seri indeksi */
  const IX = {}; kodlar.forEach(k => { const o = G.PX[k]; const m = new Map(); o.t.forEach((d, j) => m.set(d, j)); IX[k] = m; });
  const bas = Math.max(1, N - 130);
  const gun = [];
  let ewSev = 100;
  for (let i = bas; i < N; i++) {
    const d = T[i]; let art = 0, eks = 0, ab50 = 0, n50 = 0, ab200 = 0, n200 = 0, dip = 0, nDip = 0, ciro = 0; const rs = [];
    for (const k of kodlar) { const j = IX[k].get(d); if (j == null || j < 1) continue; const c = G.PX[k].c, v = G.PX[k].v || [];
      const r = c[j] / c[j - 1] - 1; if (Math.abs(r) > 0.5) continue; rs.push(r); if (r > 0) art++; else if (r < 0) eks++;
      if (j >= 49) { let s = 0; for (let q = j - 49; q <= j; q++) s += c[q]; n50++; if (c[j] > s / 50) ab50++; }
      if (j >= 199) { let s = 0; for (let q = j - 199; q <= j; q++) s += c[q]; n200++; if (c[j] > s / 200) ab200++; }
      if (j >= 120) { let mn = Infinity; for (let q = j - 120; q < j; q++) if (c[q] < mn) mn = c[q]; nDip++; if (c[j] <= mn) dip++; }
      if (sayi(v[j])) ciro += v[j] * c[j]; }
    if (rs.length < kodlar.length * 0.5) continue;
    const ewR = ort(rs); ewSev *= (1 + ewR);
    gun.push({ d, ewR, ew: ewSev, art, eks, oran: (art + eks) ? art / (art + eks) : null, ab50: n50 ? ab50 / n50 : null, ab200: n200 >= kodlar.length * 0.5 ? ab200 / n200 : null,
      dip: nDip ? dip / nDip : null, dusenPay: rs.length ? eks / rs.length : null, ciro, n: rs.length });
  }
  if (gun.length < 60) return null;
  /* türetilmiş seriler: Zweig ÜHO(10), RV20, ciro oranı, 5g dip ortalaması */
  let ema = null; const a = 2 / 11;
  gun.forEach((g, i) => { if (sayi(g.oran)) ema = ema == null ? g.oran : a * g.oran + (1 - a) * ema; g.zweig = ema;
    if (i >= 19) { const w = gun.slice(i - 19, i + 1).map(x => x.ewR); const m = ort(w); g.rv20 = Math.sqrt(ort(w.map(x => (x - m) ** 2))) * Math.sqrt(252); const cw = gun.slice(i - 20, i).map(x => x.ciro).filter(x => x > 0); g.ciroOran = cw.length >= 10 ? g.ciro / ort(cw) : null; }
    const dw = gun.slice(Math.max(0, i - 4), i + 1).map(x => x.dip).filter(sayi); g.dip5 = dw.length ? ort(dw) : null; });
  const S = gun[gun.length - 1], L = gun.length;
  const son = (n) => gun.slice(Math.max(0, L - n));
  /* 1 — BASKI */
  const kapit = son(20).filter(g => g.dusenPay >= 0.9 && g.ewR <= -0.03 && (g.ciroOran == null || g.ciroOran >= 1.5));
  const dipTepe30 = Math.max(...son(30).map(g => g.dip || 0));
  const daralma = dipTepe30 >= 0.10 && sayi(S.dip5) && S.dip5 <= dipTepe30 * 0.5;
  let tasfiye = null;
  if (G.baski && G.baski.length) { const B = G.baski.filter(k => IX[k]); const i10 = L - 11;
    if (B.length >= 5 && i10 >= 0) { const d0 = gun[i10].d, d1 = S.d; const rr = B.map(k => { const j0 = IX[k].get(d0), j1 = IX[k].get(d1); return (j0 != null && j1 != null) ? G.PX[k].c[j1] / G.PX[k].c[j0] - 1 : null; }).filter(sayi);
      const ew10 = S.ew / gun[i10].ew - 1; if (rr.length >= 5) tasfiye = { n: rr.length, r10: ort(rr), ew10, goreli: ort(rr) - ew10 }; } }
  const a1 = (kapit.length > 0 || daralma) && (!tasfiye || tasfiye.goreli >= 0);
  /* 2 — OYNAKLIK */
  const rvTepe60 = Math.max(...son(60).map(g => g.rv20 || 0));
  const rvSakin = sayi(S.rv20) && rvTepe60 > 0 && S.rv20 <= rvTepe60 * 0.75;
  let cds10 = null, cds30 = null;
  if (Array.isArray(G.cds) && G.cds.length > 12) { const c = G.cds.filter(x => x && sayi(x[1])); const sonC = c[c.length - 1];
    const geri = n => { const t = new Date(Date.parse(sonC[0]) - n * 864e5).toISOString().slice(0, 10); let v = null; for (const x of c) { if (x[0] <= t) v = x[1]; else break; } return v; };
    const v10 = geri(14), v30 = geri(30); if (sayi(v10)) cds10 = sonC[1] - v10; if (sayi(v30)) cds30 = sonC[1] - v30; }
  const a2 = rvSakin && (cds10 == null || cds10 <= 0);
  /* 3 — KATILIM */
  let itki = null;
  for (let i = Math.max(10, L - 20); i < L; i++) { const g = gun[i]; if (!(sayi(g.zweig) && g.zweig > 0.615)) continue;
    const once = gun.slice(i - 10, i).map(x => x.zweig).filter(sayi); if (once.length && Math.min(...once) < 0.40) { itki = g.d; break; } }
  /* itki KURULUMU: Zweig'in ilk yarısı (ÜHO10 < 0,40) son 10 günde görüldüyse, sonraki 10 iş günü içinde 0,615 üstü itki sayılır */
  const kurIdx = (() => { for (let i = L - 1; i >= Math.max(0, L - 10); i--) if (sayi(gun[i].zweig) && gun[i].zweig < 0.40) return i; return -1; })();
  const kurulum = !itki && kurIdx >= 0 ? { gun: gun[kurIdx].d, kalan: 10 - (L - 1 - kurIdx) } : null;
  const ab50Dip30 = Math.min(...son(30).map(g => sayi(g.ab50) ? g.ab50 : 1));
  const genislikDonus = sayi(S.ab50) && S.ab50 >= 0.5 && ab50Dip30 <= 0.2;
  const a3 = !!itki || genislikDonus;
  const asama = a3 ? 3 : (a2 ? 2 : (a1 ? 1 : 0));
  /* momentum riski (Daniel-Moskowitz koşulu: ayı piyasası + yüksek oynaklık) */
  const i6 = Math.max(0, L - 126); const ew6 = S.ew / gun[i6].ew - 1;
  const rvL = gun.map(g => g.rv20).filter(sayi).sort((x, y) => x - y); const rvMed = rvL.length ? rvL[Math.floor(rvL.length / 2)] : null;
  const momRisk = ew6 < 0 && sayi(S.rv20) && rvMed != null && S.rv20 > rvMed;
  /* SEPET */
  const sepet = [];
  if (G.xkW) {
    const eT = T.slice(Math.max(0, N - 121)); const eR = new Map(); for (let i = 1; i < eT.length; i++) { const a0 = G.endeks(eT[i - 1]), a1x = G.endeks(eT[i]); if (a0 > 0 && a1x > 0) eR.set(eT[i], a1x / a0 - 1); }
    const aday = [];
    for (const k of kodlar) { const w = G.xkW[k]; if (!(w >= 0.05)) continue; const o = G.PX[k], c = o.c, n = c.length; if (n < 70) continue;
      const r3 = c[n - 1] / c[n - 64] - 1; let mx = 0; for (let q = Math.max(0, n - 120); q < n; q++) if (c[q] > mx) mx = c[q]; const dd = c[n - 1] / mx - 1;
      let mn20 = Infinity; for (let q = n - 20; q < n; q++) if (c[q] < mn20) mn20 = c[q]; const dipten = c[n - 1] / mn20 - 1;
      const P = []; for (let q = Math.max(1, n - 120); q < n; q++) { const re = eR.get(o.t[q]); const rr = c[q] / c[q - 1] - 1; if (sayi(re) && Math.abs(rr) < 0.25) P.push([rr, re]); }
      let beta = null; if (P.length >= 60) { const mx2 = ort(P.map(p => p[0])), my = ort(P.map(p => p[1])); const cv = P.reduce((s, p) => s + (p[0] - mx2) * (p[1] - my), 0), vr = P.reduce((s, p) => s + (p[1] - my) ** 2, 0); if (vr > 0) beta = cv / vr; }
      const f = G.fm && G.fm[k]; const kal = f && sayi(f.f && f.f[2]) ? f.f[2] : null;
      if (beta == null || kal == null) continue;
      aday.push({ k, s: (f && f.s) || '', w, r3, dd, dipten, beta, kal, baski: !!(G.baski && G.baski.includes(k)) }); }
    const z = (L2, f) => { const v = L2.map(f); const m = ort(v), sd = Math.sqrt(ort(v.map(x => (x - m) ** 2))) || 1; return x => (f(x) - m) / sd; };
    /* yalnız GERÇEKTEN dövülmüşler: 3 aylık getirisi evren medyanının altında olanlar (yüksek betalı ama düşmemiş büyükler girmesin) */
    const r3Med = [...aday].map(x => x.r3).sort((p, q) => p - q)[Math.floor(aday.length / 2)];
    if (aday.length >= 20) { const zr = z(aday, x => -x.r3), zb = z(aday, x => x.beta);
      aday.forEach(x => { x.skor = zr(x) + zb(x); });
      aday.filter(x => x.kal >= -0.25 && x.r3 <= r3Med).sort((p, q) => q.skor - p.skor).slice(0, 12)
        .forEach(x => sepet.push({ k: x.k, s: x.s, w: yv(x.w, 2), r3: yv(x.r3 * 100, 1), dd: yv(x.dd * 100, 1), dipten: yv(x.dipten * 100, 1), beta: yv(x.beta, 2), kalite: yv(x.kal, 2), skor: yv(x.skor, 2), baski: x.baski })); }
  }
  const P = v => yv(sayi(v) ? v * 100 : null, 1);
  const tr = v => v == null ? '—' : String(v).replace('.', ',');
  return {
    son: S.d, evren: kodlar.length, asama,
    asamalar: [
      { no: 1, ad: 'Baskı tükeniyor mu', tamam: a1, sinyaller: [
        { ad: 'Kapitülasyon günü (son 20 gün)', deger: kapit.length ? kapit.map(g => g.d).join(', ') : 'yok', esik: 'düşen ≥%90 · gün ≤ −%3 · ciro ≥1,5×', tamam: kapit.length > 0 },
        { ad: '6 aylık dip yapan hisse oranı (5g ort.)', deger: P(S.dip5), tepe: P(dipTepe30), esik: 'son 30g tepesinin yarısı altı (tepe ≥%10)', tamam: daralma, birim: '%' },
        { ad: 'Tasfiye baskısı listesi − evren (10g)', deger: tasfiye ? P(tasfiye.goreli) : null, esik: '≥ 0 (zorunlu satış yoruldu)', tamam: tasfiye ? tasfiye.goreli >= 0 : null, birim: 'puan', not: tasfiye ? tasfiye.n + ' hisse · liste ' + tr(P(tasfiye.r10)) + '% / evren ' + tr(P(tasfiye.ew10)) + '%' : 'liste yok' } ] },
      { no: 2, ad: 'Oynaklık sakinleşiyor mu', tamam: a2, sinyaller: [
        { ad: 'RV20 (eşit ağırlıklı evren, yıllık)', deger: P(S.rv20), tepe: P(rvTepe60), esik: 'son 60g tepesinin %75\'i altı', tamam: rvSakin, birim: '%' },
        { ad: 'TR CDS 2 hafta değişim', deger: yv(cds10, 0), esik: '≤ 0 bp (daralma)', tamam: cds10 == null ? null : cds10 <= 0, birim: 'bp', not: cds30 != null ? '1 ay ' + (cds30 > 0 ? '+' : '') + yv(cds30, 0) + ' bp' : '' } ] },
      { no: 3, ad: 'Katılım geldi mi (teyit)', tamam: a3, sinyaller: [
        { ad: 'Genişlik itkisi (Zweig ÜHO10)', deger: yv(S.zweig, 3), esik: '10 iş günü içinde <0,40 → >0,615', tamam: !!itki, not: itki ? 'itki günü ' + itki : (kurulum ? 'KURULUM HAZIR: ' + kurulum.gun + ' <0,40 görüldü · ' + kurulum.kalan + ' iş günü içinde >0,615 itkidir' : 'son 20 günde yok') },
        { ad: '50g ortalaması üstündeki hisseler', deger: P(S.ab50), tepe: P(ab50Dip30), esik: 'son 30g dibi ≤%20 iken ≥%50', tamam: genislikDonus, birim: '%' },
        { ad: '200g ortalaması üstündeki hisseler', deger: P(S.ab200), esik: 'bağlam (eşik yok)', tamam: null, birim: '%' } ] } ],
    itki_kurulum: kurulum,
    momentum_riski: { yuksek: momRisk, ew6a: P(ew6), rv20: P(S.rv20), rv_medyan: P(rvMed) },
    seri: gun.slice(-120).map(g => ({ d: g.d, ew: yv(g.ew, 2), ab50: P(g.ab50), dip: P(g.dip), zw: yv(g.zweig, 3), rv: P(g.rv20), dus: P(g.dusenPay) })),
    sepet
  };
}
async function toparlanmaUret(PXgelen) {
  let ar = {}; try { ar = (await oku('endeks-arsiv.json')).gunler || {}; } catch (e) {}
  const sinir = new Date(Date.now() - 400 * 864e5).toISOString().slice(0, 10);
  /* takvim: GÜNLÜK arşiv kısmı (ay sonu tarihli eski kayıtlar ritmi bozar — iki ardışık kayıt arası ≤5 gün olan son kesintisiz dilim) */
  let takvim = Object.keys(ar).filter(g => g >= sinir && ar[g] && ar[g].XKTUM > 0).sort();
  for (let i = takvim.length - 1; i > 0; i--) if ((Date.parse(takvim[i]) - Date.parse(takvim[i - 1])) / 864e5 > 20) { takvim = takvim.slice(i); break; }
  let PX = PXgelen;
  if (!PX || Object.keys(PX).length < 100) { let uy = []; try { uy = ((await oku('endeks-uyeler.json')).uyeler || {}).XKTUM || []; } catch (e) {}
    PX = Object.assign({}, PX || {}, await fmkFiyatCek(uy.filter(k => !(PX && PX[k])))); }
  const kodL = Object.keys(PX); let son = null;
  for (let i = takvim.length - 1; i >= Math.max(0, takvim.length - 6); i--) { const d = takvim[i]; if (kodL.filter(k => PX[k].t[PX[k].t.length - 1] >= d).length >= kodL.length * 0.7) { son = d; break; } }
  if (!son) { raporlar.push('### Toparlanma monitörü (§530) — ✗ fiyat kapsamı yetersiz (' + kodL.length + ' seri)'); return; }
  takvim = takvim.filter(d => d <= son);
  let cds = null; try { cds = (await oku('cds.json')).seri || null; } catch (e) {}
  let baski = []; try { baski = (((await oku('fon-portfoy.json')).tasfiye || {}).baski || {}).liste || []; baski = baski.map(x => x.kod).filter(Boolean); } catch (e) {}
  let xkW = null; try { xkW = (await oku('xktum.json')).uyeler || null; } catch (e) {}
  let fm = {}; try { (await oku('fm.json')).data.forEach(r => { fm[r.t] = { s: r.s, f: r.f }; }); } catch (e) {}
  const endeks = d => (ar[d] && ar[d].XKTUM > 0) ? ar[d].XKTUM : null;
  const C = toparlanmaCekirdek({ PX, takvim, endeks, cds, baski, xkW, fm });
  if (!C) { raporlar.push('### Toparlanma monitörü (§530) — ✗ seri kısa (takvim ' + takvim.length + ', fiyat ' + kodL.length + ') — dosya yazılmadı'); return; }
  const dosya = 'toparlanma.json'; let eski = null; try { if (await varMi(dosya)) eski = await oku(dosya); } catch (e) {}
  const gecmis = ((eski && eski.gecmis) || []).filter(g => g.d !== C.son);
  const sG = C.asamalar[2].sinyaller; gecmis.push({ d: C.son, asama: C.asama, ab50: sG[1].deger, dip: C.asamalar[0].sinyaller[1].deger, zw: sG[0].deger, rv: C.asamalar[1].sinyaller[0].deger });
  gecmis.sort((x, y) => x.d < y.d ? -1 : 1);
  const degisti = eski && eski.asama !== C.asama;
  const out = { guncelleme: bugun, kaynak: 'Yahoo adjclose + hacim (XKTUM üyeleri) · endeks-arsiv.json XKTUM · cds.json · fon-portfoy.json tasfiye · fm.json kalite · xktum.json ağırlık',
    _yontem: '§530 aşamalar: 1 baskı (kapitülasyon | dip daralması, tasfiye listesi göreli ≥0) · 2 oynaklık (RV20 ≤ 60g tepe ×0,75, CDS 2h ≤0) · 3 katılım (Zweig itkisi | %>50g ≤%20 → ≥%50). Sepet: likidite ≥%0,05 XKTUM, z(−3A)+z(beta), kalite z ≥ −0,25.',
    ...C, onceki_asama: eski ? eski.asama : null, asama_degisim: degisti ? (eski.son + ' → ' + C.son) : (eski && eski.asama_degisim) || null, gecmis: gecmis.slice(-260) };
  await yaz(dosya, out); degisenler.push('toparlanma' + (degisti ? ' (AŞAMA ' + eski.asama + '→' + C.asama + ')' : ''));
  const ad = ['düşüş sürüyor', 'baskı tükeniyor', 'oynaklık sakinleşiyor', 'dönüş teyitli'];
  raporlar.push('### Toparlanma monitörü (§530) — ✓ aşama ' + C.asama + ' (' + ad[C.asama] + ')' + (degisti ? ' · ⚑ DEĞİŞTİ (' + eski.asama + '→' + C.asama + ')' : '') + ' · son ' + C.son + ' · evren ' + C.evren +
    ' · %>50g ' + sG[1].deger + ' · 6a dip ' + C.asamalar[0].sinyaller[1].deger + '% · RV20 ' + C.asamalar[1].sinyaller[0].deger + '% · Zweig ' + sG[0].deger + ' · momentum riski ' + (C.momentum_riski.yuksek ? 'YÜKSEK' : 'normal') + ' · sepet ' + C.sepet.length);
}

/* ── §531 ÇEYREK KARAR MOTORU XK050'YE GENİŞLEDİ (25 Eki) ───────────────────────────────────────────────────────────────
   Kullanıcı: "çeyrek karar panosunu XK030 için yapmıştık, XK050'ye genişletebilir miyiz?" Katalog (karar-model.json) elle kurulmuştu:
   30 XK030 + 2 izleme. Genişleme ELLE değil Actions'ta yapılır ve kendini sürdürür:
     1 EVREN — endeks-uyeler.json XK050 üyesi olup katalogda olmayan her hisseye kayıt açılır (tohum varsa sektör notu + sürücü
       eşlemesi, yoksa iskelet). Üyelikten çıkan "cikti" etiketi alır, silinmez (sicil korunur). BIST çeyreklik revizyonu kendiliğinden yansır.
     2 VERİ — her modelde eksik olan doldurulur, elle girilmiş olana DOKUNULMAZ:
       fiyat_son (Yahoo ham kapanış, her koşu) · fiyat_ceyrek_sonu (yeni kayıtta Yahoo DÜZELTİLMİŞ kapanış, tüm çeyrekler — bölünme
       düzeltmesi gerekmez; eski kayıtta yalnız eksik SON iki çeyrek, HAM kapanışla — Fintables ham + bolunme düzeninden sapmasın) ·
       sermaye_mn (faktor-evren adet → yoksa KAP arşivi Ödenmiş Sermaye, 1 ₺ nominal) · bilanco.beklenen (bist-takvim.json).
     3 FAVÖK — KAP arşivinde olmayan yeni kodlar kap-arsiv-oncelik.json'un başına yazılır; §381 arşivi çekince §462b kararOrneklem
       gerçek FAVÖK'ü kendisi doldurur (PD/FAVÖK bandı 4 çeyrekten sonra çizilir).
   Konsensüs yeni hisselerde YOK (Fintables'a bağlanmıyoruz) → puan kartı fiyat mercekleriyle (göreli getiri · PD/FAVÖK bandı · hedef) çalışır. */
const KARAR_TOHUM_050 = {
  ARASE: { ad: 'Doğu Aras Enerji Yatırımları', sektor: 'Elektrik Dağıtım ve Perakende', tier: 'B', birincil: 'tufe',
    surucu_plani: 'Dağıtım: RAB × reel getiri, TÜFE endeksli (EPDK) · perakende: son kaynak tedarik tarifesi − PTF maliyeti',
    sektor_not: 'Doğu Anadolu\'da elektrik dağıtım bölgesi (düzenlenmiş: düzenlemeye esas varlık tabanı üzerinden reel getiri, TÜFE ile endeksli) + aynı bölgede görevli perakende satış. Dağıtım geliri enflasyonla taşınır; perakende marjı tarife ile PTF arasındaki farka duyarlıdır. Kayıp-kaçak oranı bölge için kritik bir operasyonel değişkendir.',
    sur: [['tufe', 'gelir'], ['elektrik_ufe', 'gelir'], ['ptf', 'maliyet'], ['aofm', 'maliyet'], ['usdtry', 'kur']] },
  ATAKP: { ad: 'Atakey Patates Gıda', sektor: 'Gıda (Dondurulmuş Ürün)', tier: 'C', birincil: 'usdtry',
    surucu_plani: 'Dondurulmuş patates ürünleri · ihracat kuru · gıda fiyatları; ham patates fiyatı için serbest seri yok',
    sektor_not: 'Dondurulmuş patates ürünleri üreticisi; yurt içi kanal (restoran zincirleri, perakende) ve ihracat. Ana girdi ham patatesin hasat dönemi fiyatı ve enerji maliyetidir; ihracat payı kur geçişini belirler.',
    sur: [['tufe_gida', 'gelir'], ['ptf', 'maliyet'], ['eurusd', 'kur'], ['usdtry', 'kur']] },
  AVPGY: { ad: 'Avrupakent GYO', sektor: 'GYO (Konut Projesi)', tier: 'B', birincil: 'kfe',
    surucu_plani: 'Konut fiyatı (KFE) · konut satışı · inşaat maliyeti (İME konut) — proje teslimi geliri dalgalandırır',
    sektor_not: 'İstanbul odaklı konut projesi geliştirici GYO. Gelir proje teslim takvimine bağlı olduğu için çeyrekten çeyreğe çok oynaktır; ön satış ve konut fiyatı ivmesi öncü göstergedir. Maliyet tarafı inşaat maliyet endeksi ve finansman faizidir.',
    sur: [['kfe', 'gelir'], ['konut_toplam', 'gelir'], ['konut_ilk_el', 'gelir'], ['ime_konut', 'maliyet'], ['aofm', 'maliyet'], ['usdtry', 'kur']] },
  AYDEM: { ad: 'Aydem Yenilenebilir Enerji', sektor: 'Elektrik Üretimi (Yenilenebilir)', tier: 'A', birincil: 'ptf',
    surucu_plani: 'PTF (EPİAŞ) · $ cinsinden PTF · hidroloji/rüzgâr üretim hacmi (serbest seri yok)',
    sektor_not: 'Hidroelektrik ağırlıklı, rüzgâr/güneş/jeotermal ile çeşitlenmiş yenilenebilir üretici. Gelir = üretim hacmi × satış fiyatı; YEKDEM dışındaki santraller doğrudan PTF\'ye maruzdur. Hidroloji (yağış) hacmi, PTF fiyatı belirler; borç yapısı döviz ağırlıklı olduğundan kur finansman giderini büyütür.',
    sur: [['ptf', 'gelir'], ['ptf_usd', 'gelir'], ['elektrik_ufe', 'gelir'], ['usdtry', 'kur']] },
  BASGZ: { ad: 'Başkent Doğalgaz Dağıtım', sektor: 'Doğalgaz Dağıtım', tier: 'B', birincil: 'epdk_tarife',
    surucu_plani: 'EPDK dağıtım tarifesi (sistem kullanım bedeli, TÜFE z−2) · abone/tüketim (kış ağır)',
    sektor_not: 'Ankara doğalgaz dağıtım lisansı (düzenlenmiş). Birim sistem kullanım bedeli EPDK metodolojisiyle TÜFE\'ye bağlı güncellenir; hacim mevsimseldir (1Ç ve 4Ç güçlü). Gaz alım fiyatı büyük ölçüde geçişlidir, marjı tarife belirler.',
    sur: [['epdk_tarife', 'gelir'], ['tufe', 'gelir'], ['gaz_avrupa', 'maliyet'], ['usdtry', 'kur']] },
  BETAE: { ad: 'Beta Enerji ve Teknoloji', sektor: 'Enerji Teknolojileri (Transformatör)', tier: 'C', birincil: 'bakir',
    surucu_plani: 'Bakır · alüminyum (sargı/gövde) · ihracat kuru (80+ ülke) — elektrik çeliği için serbest seri yok',
    sektor_not: 'Güç ve dağıtım transformatörleri ile anahtarlama ürünleri üreticisi (Adana), servis-bakım hizmeti; 80\'den fazla ülkeye ihracat. Marjı metal girdi (bakır, alüminyum, elektrik çeliği) fiyatları ile sözleşme fiyatı arasındaki zamanlama belirler; şebeke yatırımları ve ihracat talebi siparişi taşır.',
    sur: [['bakir', 'maliyet'], ['aluminyum', 'maliyet'], ['eurusd', 'kur'], ['usdtry', 'kur']] },
  BUCIM: { ad: 'Bursa Çimento', sektor: 'Çimento', tier: 'B', birincil: 'komur_termal',
    surucu_plani: 'Çimento ÜFE (fiyat) · kömür/petkok ve elektrik (maliyet) · inşaat üretimi (hacim)',
    sektor_not: 'Marmara bölgesinde çimento ve klinker üreticisi. Enerji (kömür/petkok, elektrik) maliyetin en büyük kalemidir; yurt içi fiyat ÜFE çimento ile izlenir, hacim konut ve altyapı inşaatına bağlıdır.',
    sur: [['komur_termal', 'maliyet'], ['ptf_usd', 'maliyet'], ['cimento_ufe', 'gelir'], ['ufe_cimento', 'gelir'], ['ydufe_cimento', 'gelir'], ['insaat_uretim_bina', 'gelir'], ['usdtry', 'kur']] },
  EGGUB: { ad: 'Ege Gübre', sektor: 'Gübre', tier: 'A', birincil: 'ure',
    surucu_plani: 'Üre · DAP (gelir) · doğalgaz/TTF (maliyet) · gübre ÜFE',
    sektor_not: 'Kimyevi gübre üretim ve ticareti, ayrıca liman işletmeciliği (Aliağa). Gübre fiyatları küresel üre/DAP ile, maliyet doğalgaz ile hareket eder; tarım sezonu 1Ç ve 3Ç talebini belirler. Liman geliri dövizlidir ve dengeleyicidir.',
    sur: [['ure', 'gelir'], ['dap', 'gelir'], ['gubre_ufe', 'gelir'], ['ttf', 'maliyet'], ['gaz_avrupa', 'maliyet'], ['usdtry', 'kur']] },
  EGPRO: { ad: 'Ege Profil', sektor: 'PVC Profil (Yapı)', tier: 'B', birincil: 'dce_pvc_usd',
    surucu_plani: 'PVC reçine (maliyet) · plastik ÜFE (fiyat) · inşaat üretimi (hacim) · ihracat kuru',
    sektor_not: 'PVC pencere ve kapı profili üreticisi; yurt içi yapı sektörü ve ihracat. Ana girdi PVC reçinesidir; marj reçine fiyatı ile profil fiyat ayarlaması arasındaki gecikmeye duyarlıdır. Hacim konut ve renovasyon talebine bağlıdır.',
    sur: [['dce_pvc_usd', 'maliyet'], ['ufe_plastik', 'gelir'], ['insaat_uretim_bina', 'gelir'], ['eurusd', 'kur'], ['usdtry', 'kur']] },
  ISDMR: { ad: 'İskenderun Demir ve Çelik', sektor: 'Demir Çelik (Entegre)', tier: 'A', birincil: 'hrc_abd',
    surucu_plani: 'Çelik makası: yassı/uzun ürün fiyatı − demir cevheri, koklaşabilir kömür, hurda',
    sektor_not: 'Entegre demir-çelik üreticisi (Erdemir grubu); yassı ve uzun ürün. FAVÖK büyük ölçüde çelik fiyatı ile cevher + kömür maliyeti arasındaki makastan gelir; ürün fiyatları dolar bazlıdır, maliyetin önemli kısmı ithal girdidir.',
    sur: [['hrc_abd', 'gelir'], ['celik_ufe', 'gelir'], ['ufe_celik_2410', 'gelir'], ['ydufe_celik', 'gelir'], ['demir_cevheri', 'maliyet'], ['komur_termal', 'maliyet'], ['hurda_lme', 'maliyet'], ['usdtry', 'kur']] },
  KARSN: { ad: 'Karsan Otomotiv', sektor: 'Otomotiv (Ticari Araç)', tier: 'C', birincil: 'eurusd',
    surucu_plani: 'Avrupa toplu taşıma ihaleleri (elektrikli otobüs) · EUR/USD · sipariş akışı (KAP)',
    sektor_not: 'Ticari araç ve otobüs üreticisi; elektrikli küçük/orta otobüslerde Avrupa ihracatı ağırlıklı. Gelir euro bazlı ihaleler ve teslim takvimine bağlıdır; batarya ve bileşen maliyeti marjı belirler.',
    sur: [['eurusd', 'kur'], ['aluminyum', 'maliyet'], ['bakir', 'maliyet'], ['usdtry', 'kur']] },
  KBORU: { ad: 'Kuzey Boru', sektor: 'Altyapı Boruları (Plastik/CTP)', tier: 'B', birincil: 'pe_pp',
    surucu_plani: 'Polietilen reçine (maliyet) · plastik ÜFE · kamu altyapı (DSİ) ihaleleri',
    sektor_not: 'HDPE, koruge, CTP ve PPR/PE-RT boru üreticisi (Aksaray, Balıkesir, Malatya, Gaziantep). Satışların büyük kısmı kamuya (DSİ sulama ve altyapı) ve kamu projelerindeki müteahhitlere; hammadde polimer reçinedir. Kamu yatırım bütçesi ve tahsilat hızı belirleyicidir; kaldıraç yüksektir.',
    sur: [['pe_pp', 'maliyet'], ['dce_lldpe_usd', 'maliyet'], ['ufe_plastik', 'gelir'], ['insaat_uretim_bina', 'gelir'], ['usdtry', 'kur']] },
  LMKDC: { ad: 'Limak Doğu Anadolu Çimento', sektor: 'Çimento', tier: 'B', birincil: 'komur_termal',
    surucu_plani: 'Çimento ÜFE (fiyat) · kömür/petkok ve elektrik (maliyet) · bölgesel inşaat hacmi',
    sektor_not: 'Doğu Anadolu\'da çimento ve klinker üreticisi. Bölgesel pazar (kamu altyapı, deprem bölgesi yeniden yapılanması) hacmi belirler; enerji maliyeti marjın ana sürücüsüdür.',
    sur: [['komur_termal', 'maliyet'], ['ptf_usd', 'maliyet'], ['cimento_ufe', 'gelir'], ['ufe_cimento', 'gelir'], ['insaat_uretim_bina', 'gelir'], ['usdtry', 'kur']] },
  MOPAS: { ad: 'Mopaş Marketçilik', sektor: 'Gıda Perakende', tier: 'B', birincil: 'tufe_gida',
    surucu_plani: 'Gıda TÜFE (sepet fiyatı) · perakende gıda hacmi · asgari ücret (personel) · elektrik',
    sektor_not: 'Süpermarket zinciri (Marmara ağırlıklı). Ciro gıda enflasyonu ve mağaza sayısıyla büyür; marjı personel (asgari ücret), kira ve enerji maliyetleri sıkıştırır. TMS-29 parasal kazanç/kayıp net kârı belirgin etkiler.',
    sur: [['tufe_gida', 'gelir'], ['perakende_gida_hacim', 'gelir'], ['asgari_ucret_reel', 'maliyet'], ['ptf', 'maliyet'], ['usdtry', 'kur']] },
  NETCD: { ad: 'Netcad Yazılım', sektor: 'Yazılım (CBS)', tier: 'C', birincil: 'usdtry',
    surucu_plani: 'Kamu/belediye projeleri · lisans + hizmet · ihracat; dış sürücü yok',
    sektor_not: 'Coğrafi bilgi sistemleri (CBS), mühendislik ve kent bilgi sistemi yazılımları; müşteri tabanı ağırlıkla kamu ve belediyeler, yurt dışı projeler de var. Gelir proje teslimine bağlı dalgalanır; maliyetin çoğu personeldir.',
    sur: [['tufe', 'gelir'], ['asgari_ucret_reel', 'maliyet'], ['usdtry', 'kur']] },
  NTGAZ: { ad: 'Naturelgaz', sektor: 'Doğalgaz (CNG/LNG Dağıtım)', tier: 'B', birincil: 'ttf',
    surucu_plani: 'Doğalgaz alım fiyatı (BOTAŞ, TTF dolaylı) · satış fiyatı ayarlaması · hacim (sanayi)',
    sektor_not: 'Boru hattı ulaşmayan sanayi ve konut müşterilerine sıkıştırılmış (CNG) ve sıvılaştırılmış (LNG) doğalgaz tedarik/dağıtım. Marj alım fiyatı ile satış fiyatı arasındaki farkla belirlenir; hacim sanayi üretimine bağlıdır.',
    sur: [['ttf', 'maliyet'], ['gaz_avrupa', 'maliyet'], ['tufe', 'gelir'], ['usdtry', 'kur']] },
  PARSN: { ad: 'Parsan Makina Parçaları', sektor: 'Makine Parçaları (Transmisyon)', tier: 'C', birincil: 'celik_ufe',
    surucu_plani: 'Çelik girdi (maliyet) · ihracat kuru · ağır vasıta/iş makinesi talebi',
    sektor_not: 'Ulaşım araçları, tarım ve iş makineleri için dişli kutusu, transmisyon aksamı ve makine-motor parçaları üreticisi (dövme + işleme). Ana girdi özel çeliktir; talep ağır vasıta ve iş makinesi döngüsüne bağlıdır.',
    sur: [['celik_ufe', 'maliyet'], ['hurda_lme', 'maliyet'], ['eurusd', 'kur'], ['usdtry', 'kur']] },
  POLHO: { ad: 'Polisan Holding', sektor: 'Kimya / Boya (Holding)', tier: 'C', birincil: 'brent_yh',
    surucu_plani: 'Petrokimya girdi (boya/kimya) · inşaat ve sanayi talebi · liman gelirleri',
    sektor_not: 'Boya (iştirak), yapı kimyasalları ve kimya ile liman işletmeciliği faaliyetleri olan holding. Boya ve kimya marjı petrokimya türevi girdilerin fiyatına, hacim inşaat ve sanayi talebine bağlıdır; konsolide sonuçta iştirak gelirleri belirgin yer tutar.',
    sur: [['brent_yh', 'maliyet'], ['ufe_plastik', 'maliyet'], ['insaat_uretim_bina', 'gelir'], ['usdtry', 'kur']] },
  SNGYO: { ad: 'Sinpaş GYO', sektor: 'GYO (Konut Projesi)', tier: 'B', birincil: 'kfe',
    surucu_plani: 'Konut fiyatı (KFE) · konut satışı · inşaat maliyeti (İME konut) — teslim takvimi',
    sektor_not: 'Konut ve karma proje geliştirici GYO (İstanbul ve Ankara ağırlıklı). Gelir teslimle tanındığı için çeyrekler arası dalgalanma büyüktür; ön satış hızı ve konut fiyat ivmesi öncüdür, finansman maliyeti marjı belirler.',
    sur: [['kfe', 'gelir'], ['konut_toplam', 'gelir'], ['konut_ilk_el', 'gelir'], ['ime_konut', 'maliyet'], ['aofm', 'maliyet'], ['usdtry', 'kur']] },
  VAKKO: { ad: 'Vakko Tekstil', sektor: 'Hazır Giyim Perakende (Lüks)', tier: 'B', birincil: 'tufe_giyim',
    surucu_plani: 'Giyim TÜFE (fiyat) · perakende giyim hacmi · asgari ücret · kur (ithal ürün/turist)',
    sektor_not: 'Üst segment hazır giyim, aksesuar ve perakende (mağaza + online). Ciro giyim fiyatları ve yüksek gelirli tüketici talebiyle hareket eder; sezon geçişleri (2Ç/4Ç) ve stok yönetimi marjı belirler.',
    sur: [['tufe_giyim', 'gelir'], ['perakende_giyim_hacim', 'gelir'], ['asgari_ucret_reel', 'maliyet'], ['eurusd', 'kur'], ['usdtry', 'kur']] }
};
/* §533 ELLE DÜZELTME TOHUMU — mevcut kayıtların yanlış/boş kalan alanları (Actions uygular; `_duzeltme` damgası değişince bir kez yazar).
   TCKRC (25 Eki, kullanıcı: "kıraç galvanizin sürücüleri neler"): ad "Tekirdağ Çıkrıkçılar?" ve sürücü yalnız kurdu. Kaynak: Ziraat Yatırım
   toplantı notu (Matriks, 2026): 2025 ciro dağılımı otokorkuluk %65 · GES konstrüksiyonu %20 · sıcak daldırma galvaniz %15; ihracat %42;
   Bozüyük tesisi Tem 2025 (220 bin t galvaniz · 180 bin t metal imalat); 2026 hedefi ciro 8 mlr ₺, FAVÖK 2,5–3 mlr ₺. */
const KARAR_DUZELT = {
  TCKRC: { _duzeltme: '533a', ad: 'Kıraç Galvaniz Telekomünikasyon Metal Makine İnşaat Elektrik', sektor: 'Metal (Otokorkuluk · GES Konstrüksiyonu · Galvaniz)', tier: 'B', birincil: 'cinko',
    surucu_plani: 'Çinko (galvaniz sarfı) · çelik saç/profil · doğalgaz (banyo ısıtma) · kamu yol yatırımı (otokorkuluk) · GES kurulumu · EUR/USD (ihracat %42)',
    kaynak_notu: 'Ciro dağılımı ve 2026 hedefi: Ziraat Yatırım toplantı notu (Matriks/TradingView). Kamu yatırım nabzı §533 (HMB/SBB bütçe gerçekleşmesi).',
    sektor_not: 'Ciro 2025: otokorkuluk (yol güvenlik bariyeri, alıcı ağırlıkla kamu/KGM ihaleleri) %65 · güneş santrali taşıyıcı konstrüksiyonu %20 · sıcak daldırma galvaniz hizmeti %15; savunma (shelter, konteyner, gözetleme kulesi) yeni alan, ilk yıllarda cironun %10–15\'i hedefleniyor. İhracat %42 (Romanya şirketi, Gürcistan). Bozüyük entegre tesisi Temmuz 2025\'te devreye girdi: kapasite ~5 kat (220 bin t galvaniz, 180 bin t metal imalat). Marjı çinko ve çelik girdi fiyatı ile ihale fiyatı arasındaki zamanlama, hacmi kamu yol bütçesi ve GES kurulum hızı belirler.',
    sur: [['cinko', 'maliyet'], ['hrc_abd', 'maliyet'], ['celik_ufe', 'maliyet'], ['ttf', 'maliyet'], ['ges_modul_usd', 'gelir'], ['eurusd', 'kur'], ['usdtry', 'kur']],
    guidance: { yil: 2026, favok_tl_mlr: [2.5, 3.0], ciro_tl_mlr: 8, marj: '%35–40', kko: '%80', kaynak: 'Ziraat Yatırım toplantı notu (Matriks/TradingView)', tarih: '2026' },
    kamu_duyarli: true }
};
/* §545 SÜRÜCÜ EKLEME TOHUMU (26 Eki, kullanıcı: "şirketleri tek tek gez, eksik sürücü var mı"): mevcut listeye EKLENİR (var olana
   dokunulmaz, sıra korunur); `_sur_ek` damgası değişince bir kez uygulanır. Eşleşmeyen seri adı (henüz üretilmemiş) sessizce atlanır,
   ilgili üretici koşunca sonraki koşuda girer. */
const KARAR_SUR_EK_SURUM = '546a';
const KARAR_SUR_EK = {
  ALBRK: [['ticari_kredi_faiz', 'gelir'], ['mevduat_3ay', 'maliyet']],
  KCAER: [['demir_lme', 'gelir'], ['metal_marji_tr', 'gelir'], ['usdtry', 'kur']],
  ISDMR: [['demir_lme', 'gelir'], ['metal_marji_tr', 'gelir'], ['ydufe_celik', 'gelir']],
  EREGL: [['ydufe_celik', 'gelir'], ['demir_lme', 'gelir']],
  EGGUB: [['gubre_girdi', 'gelir'], ['ufe_gubre_2015', 'gelir'], ['bugday_tl', 'gelir']],
  GUBRF: [['bugday_tl', 'gelir']], TKFEN: [['bugday_tl', 'gelir'], ['usdtry', 'kur']],
  MAVI: [['tuketici_guveni', 'gelir']], VAKKO: [['tuketici_guveni', 'gelir'], ['ufe_kumas', 'maliyet'], ['pamuk', 'maliyet']],
  BIMAS: [['tuketici_guveni', 'gelir'], ['asgari_ucret', 'maliyet']], MOPAS: [['tuketici_guveni', 'gelir'], ['asgari_ucret', 'maliyet']],
  MPARK: [['asgari_ucret_reel', 'maliyet']],
  ATAKP: [['patates_tl', 'maliyet'], ['gaz_avrupa', 'maliyet'], ['ydufe_makarna', 'gelir']],
  KARSN: [['kap_yeni_is_karsn', 'gelir'], ['reel_kesim_guveni', 'gelir']],
  KBORU: [['kap_yeni_is_kboru', 'gelir'], ['pp_hdpe_film_eur', 'maliyet']],
  TCKRC: [['kap_yeni_is_tckrc', 'gelir'], ['demir_lme', 'maliyet']],
  GESAN: [['kap_yeni_is_gesan', 'gelir']], EUPWR: [['kap_yeni_is_eupwr', 'gelir']], CWENE: [['kap_yeni_is_cwene', 'gelir']],
  NETCD: [['kap_yeni_is_netcd', 'gelir']],
  PARSN: [['reel_kesim_guveni', 'gelir'], ['kara_tasima_hacim', 'gelir']], BETAE: [['reel_kesim_guveni', 'gelir'], ['celik_ufe', 'maliyet']],
  AVPGY: [['konut_ipotekli', 'gelir'], ['ekgyo_kfe_ime', 'gelir'], ['tufe', 'gelir']], SNGYO: [['konut_ipotekli', 'gelir'], ['ekgyo_kfe_ime', 'gelir'], ['tufe', 'gelir']],
  AKCNS: [['ime_insaat', 'gelir'], ['insaat_uretim_toplam', 'gelir']], CIMSA: [['ime_insaat', 'gelir'], ['insaat_uretim_toplam', 'gelir']],
  BUCIM: [['ime_insaat', 'gelir'], ['insaat_uretim_toplam', 'gelir']], LMKDC: [['ime_insaat', 'gelir'], ['insaat_uretim_toplam', 'gelir'], ['ydufe_cimento', 'gelir']],
  POLHO: [['insaat_uretim_toplam', 'gelir'], ['pe_pp', 'maliyet'], ['eurusd', 'kur']],
  AYDEM: [['hidro_uretim_gwh', 'gelir'], ['ruzgar_uretim_gwh', 'gelir'], ['yenilenebilir_pay', 'maliyet'], ['gaz_avrupa', 'gelir'], ['henryhub', 'gelir']], AKFYE: [['hidro_uretim_gwh', 'gelir'], ['ruzgar_uretim_gwh', 'gelir'], ['yenilenebilir_pay', 'maliyet'], ['henryhub', 'gelir']],
  AHGAZ: [['henryhub', 'maliyet']], ENERY: [['henryhub', 'maliyet']], BASGZ: [['henryhub', 'maliyet']], NTGAZ: [['henryhub', 'maliyet']],
  GRSEL: [['reel_kesim_guveni', 'gelir']], TUREX: [['reel_kesim_guveni', 'gelir']],
  BERA: [['tufe_gida', 'gelir'], ['seker_dunya', 'gelir'], ['ufe_plastik', 'maliyet'], ['insaat_uretim_bina', 'gelir']],
  BINHO: [['tufe', 'gelir'], ['reel_kesim_guveni', 'gelir']],
  ENJSA: [['tlref', 'maliyet']], ARASE: [['tlref', 'maliyet']],
  OBAMS: [['tuketici_guveni', 'gelir']], GLRMK: [['ime_insaat', 'maliyet']], KATMR: [['celik_ufe', 'maliyet']],
};
/* kamu altyapı harcamasına duyarlı hisseler — §533 kamu yatırım merceği puan kartına girer */
const KARAR_KAMU = ['TCKRC', 'KBORU', 'AKCNS', 'CIMSA', 'BUCIM', 'LMKDC', 'GLRMK', 'KATMR', 'TKFEN', 'NETCD', 'KARSN'];   /* §545: NETCD (belediye/kamu CBS), KARSN (belediye otobüs ihaleleri) */
async function kararYahoo(kodlar, aralik) {
  const PX = {}; let i = 0;
  const tek = async kod => { try {
    const r = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(kod + '.IS') + '?interval=1d&range=' + aralik, { headers: { 'User-Agent': 'Mozilla/5.0 (KtPanel/1.0)' }, signal: AbortSignal.timeout(15000) });
    if (!r.ok) return; const d = (await r.json())?.chart?.result?.[0]; if (!d) return;
    const adj = d.indicators?.adjclose?.[0]?.adjclose || [], ham = d.indicators?.quote?.[0]?.close || [], ts = d.timestamp || [];
    const o = { t: [], adj: [], ham: [] }; for (let j = 0; j < ts.length; j++) if (typeof ham[j] === 'number' && ham[j] > 0) { o.t.push(new Date(ts[j] * 1000).toISOString().slice(0, 10)); o.ham.push(ham[j]); o.adj.push(typeof adj[j] === 'number' && adj[j] > 0 ? adj[j] : ham[j]); }
    if (o.t.length >= 20) PX[kod] = o; } catch (e) {} };
  const isci = async () => { while (i < kodlar.length) { const k = kodlar[i++]; await tek(k); } };
  await Promise.all(Array.from({ length: 6 }, isci)); return PX;
}
async function kararEvren() {
  const dosya = 'karar-model.json'; if (!(await varMi(dosya))) return;
  const M = await oku(dosya); const L = M.modeller || []; const byK = new Map(L.map(m => [m.kod, m]));
  let uy = {}; try { uy = (await oku('endeks-uyeler.json')).uyeler || {}; } catch (e) {}
  const X30 = new Set(uy.XK030 || []), X50 = new Set(uy.XK050 || []);
  if (X50.size < 40 || X30.size < 25) { raporlar.push('### Karar evreni XK050 (§531) — ⏭ endeks üyeliği okunamadı (XK050 ' + X50.size + ')'); return; }
  let SS = {}; try { SS = (await oku('sektor-surucu.json')).seriler || {}; } catch (e) {}
  const surNesne = (k, rol) => { for (const m of L) for (const s of (m.surucu_seriler || [])) if (s.k === k) return Object.assign({}, s, { rol }); const v = SS[k]; return { k, rol, ad: (v && v.ad) || k }; };
  const eklenen = [], cikan = [], donen = [];
  for (const kod of X50) { if (byK.has(kod)) continue; const T = KARAR_TOHUM_050[kod];
    const m = { kod, ad: T ? T.ad : kod, sektor: T ? T.sektor : '—', tier: T ? T.tier : 'C', tip: 'konsensus', evren: 'XK050',
      surucu_plani: T ? T.surucu_plani : 'sürücü eşlemesi bekliyor', kaynak_notu: '§531 Actions — XK050 genişlemesi: FAVÖK KAP arşivinden (§462b), fiyat Yahoo, konsensüs yok (fiyat mercekleri)',
      sektor_not: T ? T.sektor_not : 'XK050\'ye sonradan giren hisse — tohum notu ve sürücü eşlemesi yok; ortak iskelet (göreli getiri · PD/FAVÖK bandı) çalışır.',
      surucu_seriler: (T ? T.sur : [['usdtry', 'kur']]).filter(([k]) => SS[k] || k === 'usdtry').map(([k, r]) => surNesne(k, r)), birincil: T ? T.birincil : 'usdtry',
      sermaye_mn: null, favok: {}, fiyat_ceyrek_sonu: {}, fiyat_son: null, bolunme: null, konsensus: null, konsensus_gecmis: [], hedef_fiyat: null, bilanco: null, guidance: null, _eklendi: bugun };
    L.push(m); byK.set(kod, m); eklenen.push(kod); }
  /* §533 elle düzeltme tohumu + kamu duyarlılık bayrağı */
  const duzelen = [];
  for (const [kod, D] of Object.entries(KARAR_DUZELT)) { const m = byK.get(kod); if (!m || m._duzeltme === D._duzeltme) continue;
    for (const [k, v] of Object.entries(D)) { if (k === 'sur') m.surucu_seriler = v.filter(([kk]) => SS[kk] || kk === 'usdtry').map(([kk, r]) => surNesne(kk, r)); else m[k] = v; }
    duzelen.push(kod); }
  /* §545 sürücü ekleme: var olana dokunma, eksikleri sona ekle */
  for (const [kod, ekler] of Object.entries(KARAR_SUR_EK)) { const m = byK.get(kod); if (!m || m._sur_ek === KARAR_SUR_EK_SURUM) continue;
    m.surucu_seriler = m.surucu_seriler || []; const var_ = new Set(m.surucu_seriler.map(x => x.k)); let n = 0, bekleyen = 0;
    for (const [kk, r] of ekler) { if (var_.has(kk)) continue; if (!(SS[kk] || kk === 'usdtry')) { bekleyen++; continue; } m.surucu_seriler.push(surNesne(kk, r)); var_.add(kk); n++; }
    if (n) duzelen.push(kod + '+' + n + (bekleyen ? '(' + bekleyen + ' seri bekliyor)' : ''));
    if (!bekleyen) m._sur_ek = KARAR_SUR_EK_SURUM; }   /* damga yalnız liste TAMAMEN uygulanınca — üretici koşunca kalan seri sonraki turda girer */
  for (const m of L) { const olmali = KARAR_KAMU.includes(m.kod); if (!!m.kamu_duyarli !== olmali) { if (olmali) m.kamu_duyarli = true; else delete m.kamu_duyarli; } }
  /* üyelik etiketi: XK030 → (boş) · yalnız XK050 → 'XK050' · ikisinde de yok → 'cikti' (izleme kayıtlarına dokunulmaz) */
  for (const m of L) { if (m.evren === 'izleme') continue;
    const yeniE = X30.has(m.kod) ? null : (X50.has(m.kod) ? 'XK050' : 'cikti');
    if ((m.evren || null) !== yeniE) { if (yeniE === 'cikti') cikan.push(m.kod); else if (m.evren === 'cikti') donen.push(m.kod);
      if (yeniE) m.evren = yeniE; else delete m.evren; if (yeniE === 'cikti') m.cikti_tarih = bugun; else delete m.cikti_tarih; } }
  /* veri doldurma */
  let FE = {}; try { FE = (await oku('faktor-evren.json')).sirketler || {}; } catch (e) {}
  let BT = {}; try { BT = (await oku('bist-takvim.json')).beklenen || {}; } catch (e) {}
  let C = {}; try { C = (await oku('sektor-surucu.json')).ceyrek || {}; } catch (e) {}
  const qs = Object.keys(C).filter(q => q >= '2024Q1' && C[q] && C[q].tam).sort(); const son2 = qs.slice(-2);
  const qSon = q => { const y = +q.slice(0, 4), n = +q.slice(-1); return new Date(Date.UTC(y, n * 3, 0)).toISOString().slice(0, 10); };
  const gerekYeni = L.filter(m => m.evren !== 'izleme' && (!m.fiyat_ceyrek_sonu || !Object.keys(m.fiyat_ceyrek_sonu).length)).map(m => m.kod);
  const gerekHepsi = L.map(m => m.kod);
  const PX3 = gerekYeni.length ? await kararYahoo(gerekYeni, '3y') : {};
  const PX1 = await kararYahoo(gerekHepsi.filter(k => !PX3[k]), '6mo'); const PXa = Object.assign({}, PX1, PX3);
  const kapanis = (o, d, alan) => { let a = -1; for (let j = 0; j < o.t.length; j++) { if (o.t[j] <= d) a = j; else break; } if (a < 0 || (Date.parse(d) - Date.parse(o.t[a])) / 864e5 > 7) return null; return o[alan][a]; };
  let fSon = 0, fQ = 0, fSer = 0, fBil = 0; const oncelik = [];
  for (const m of L) { const o = PXa[m.kod];
    if (o) { const n = o.t.length - 1; m.fiyat_son = { tarih: o.t[n], fiyat: +o.ham[n].toFixed(4), kaynak: 'Yahoo (Actions §531)' }; fSon++;
      m.fiyat_ceyrek_sonu = m.fiyat_ceyrek_sonu || {};
      const yeni = !Object.keys(m.fiyat_ceyrek_sonu).length;
      for (const q of (yeni ? qs : son2)) { if (m.fiyat_ceyrek_sonu[q] != null) continue; const v = kapanis(o, qSon(q), yeni ? 'adj' : 'ham'); if (v > 0) { m.fiyat_ceyrek_sonu[q] = +v.toFixed(4); fQ++; } }
      if (yeni && Object.keys(m.fiyat_ceyrek_sonu).length) m._fiyat_notu = 'çeyrek sonu fiyatlar Yahoo DÜZELTİLMİŞ kapanış (bölünme/bedelsiz işlenmiş) — bolunme düzeltmesi gerekmez'; }
    if (!(m.sermaye_mn > 0)) { const F = FE[m.kod]; let adet = F && F.adet > 0 ? F.adet : null;
      if (!adet) { try { const K = await oku('kap-arsiv/' + m.kod + '.json'); const dk = Object.keys(K.donemler || {}).sort().pop(); const dn = dk && K.donemler[dk];
        for (const t of ((dn && dn.tablolar) || [])) { const s = (t.satirlar || []).find(s => s.xbrl === 'ifrs-full_IssuedCapital'); if (s && s.degerler && s.degerler[0] > 0) { adet = s.degerler[0] * ((dn.birim && dn.birim.carpan) || 1000); break; } } } catch (e) {} }
      if (adet) { m.sermaye_mn = +(adet / 1e6).toFixed(1); fSer++; } }
    const bt = BT[m.kod]; if (bt && (!m.bilanco || m.bilanco.beklenen !== bt)) { m.bilanco = { beklenen: bt, kaynak: 'bist-takvim.json' }; fBil++; }
    if (m.tip !== 'konsensus_banka' && !(await varMi('kap-arsiv/' + m.kod + '.json'))) oncelik.push(m.kod); }
  /* KAP arşivi önceliği: arşivde olmayan katalog kodları listenin BAŞINA */
  let oncelikYaz = 0;
  if (oncelik.length) { try { const eo = await oku('kap-arsiv-oncelik.json'); const liste = Array.isArray(eo) ? eo : (eo.kodlar || []); const yeniL = [...oncelik.filter(k => !liste.includes(k)), ...liste];
    if (yeniL.length !== liste.length) { oncelikYaz = yeniL.length - liste.length; if (Array.isArray(eo)) await yaz('kap-arsiv-oncelik.json', yeniL); else { eo.kodlar = yeniL; eo._531 = bugun + ': karar kataloğundaki (XK050) arşivde olmayan ' + oncelikYaz + ' kod başa alındı — §462b gerçek FAVÖK bunlardan okunur.'; await yaz('kap-arsiv-oncelik.json', eo); } } } catch (e) {} }
  M._aciklama = 'Çeyrek Karar Motoru kataloğu — XK050 (resmî üyelik endeks-uyeler.json; XK030 çekirdek + §531 genişleme, Actions sürdürür). Her hissede ortak iskelet: konsensüs · konsensüs sicili · fiyatlanma (göreli getiri · PD/FAVÖK bandı · hedef) · puan kartı · sinyal. Sürücü modeli yalnız tier A/B’de ve kalibre edildikçe (bugün: TUPRS). tip: regresyon (sürücü→FAVÖK EKK) · konsensus (sürücü modeli yok) · konsensus_banka (hedef metrik net kâr). evren: (boş)=XK030 · XK050 · izleme · cikti.';
  M._531 = { guncelleme: bugun, xk050: X50.size, katalog: L.length, eklenen_toplam: L.filter(m => m._eklendi).length };
  M.modeller = L;
  await yaz(dosya, M); if (eklenen.length || cikan.length || fQ || fSer || duzelen.length) degisenler.push('karar evreni (' + [eklenen.length ? '+' + eklenen.length + ' XK050' : '', cikan.length ? cikan.length + ' çıktı' : '', fQ ? fQ + ' çeyrek fiyatı' : ''].filter(Boolean).join(' · ') + ')');
  raporlar.push('### Karar evreni XK050 (§531) — ✓ katalog ' + L.length + ' (XK050 ' + X50.size + ')' + (eklenen.length ? ' · eklendi: ' + eklenen.join(', ') : '') + (cikan.length ? ' · üyelikten çıktı: ' + cikan.join(', ') : '') + (donen.length ? ' · geri döndü: ' + donen.join(', ') : '') + (duzelen.length ? ' · düzeltildi: ' + duzelen.join(', ') : '') +
    ' · fiyat_son ' + fSon + ' · çeyrek fiyatı +' + fQ + ' · sermaye +' + fSer + ' · bilanço tarihi ' + fBil + (oncelik.length ? ' · KAP arşivi bekleyen ' + oncelik.length + ' (' + oncelik.slice(0, 12).join(', ') + (oncelik.length > 12 ? '…' : '') + ')' + (oncelikYaz ? ', öncelik listesine +' + oncelikYaz : '') : ''));
}

/* ── §533 KAMU YATIRIM NABZI (25 Eki) ─────────────────────────────────────────────────────────────────────────────────
   Kullanıcı: SBB 2027 Bütçe Gerekçesi + "Türkiye Ekonomisinde Haftalık Gelişmeler" — "harcamalar var, bir incele". Otokorkuluk (TCKRC),
   DSİ boruları (KBORU), çimento ve müteahhitlik hisseleri için asıl hacim sürücüsü kamu sermaye harcamasıdır; panelde yoktu.
   (1) AYLIK GERÇEKLEŞME: SBB haftalık raporu her hafta HMB'nin son "Merkezi Yönetim Bütçe Dengesi (Ocak–Ay)" tablosunu taşır
       (yıl içi kümülatif: geçen yıl · bu yıl · bütçe hedefi · artış % · gerçekleşme %). Liste sayfasından son PDF bulunur, pdftotext ile
       o sayfa okunur (poppler yalnız Cumartesi/hepsi koşusunda kurulu → haftada bir; ay verisi ayda bir değişir). Dönem anahtarı YYYY-AA.
   (2) BÜTÇE ÇERÇEVESİ (2027 Bütçe Gerekçesi, SBB Ekim 2026 — elle tohum, yılda bir): 2026 yıl sonu tahmini ve 2027–29 ödenekleri,
       KGM yol ve DSİ sulama hedefleri, savunma/GSYH patikası. Sayılar PDF'ten aynen (milyon ₺ / km / milyon ha / %).
   Panel: karar puan kartında kamu_duyarli hisselere "Kamu yatırım harcaması (reel y/y)" merceği; yıl sonu tahmininin ima ettiği kalan
   çeyrek harcaması bilgi olarak yazılır. */
const KAMU_BUTCE = {
  kaynak: 'SBB 2027 Yılı Bütçe Gerekçesi (Ekim 2026) — https://www.sbb.gov.tr/wp-content/uploads/2026/10/2027-Butce-Gerekcesi.pdf',
  sermaye_gideri: { '2026_ys': 1782322, '2027': 1854783, '2028': 2346587, '2029': 2923361, _birim: 'milyon ₺', _not: '2026 yıl sonu gerçekleşme tahmini (s.13); 2027–29 ödenek (s.135)' },
  sermaye_transferi: { '2026_ys': 325055, '2027': 750372, '2028': 408318, '2029': 446941, _birim: 'milyon ₺' },
  yatirim_hizlandirma_2027: 246700, yatirim_toplam_2027: 2851800,
  kgm: { bolunmus_yol_km: { '2026_ys': 30395, '2027': 30675, '2028': 31250, '2029': 31600 }, otoyol_km: { '2026_ys': 3848, '2027': 3893, '2028': 4297, '2029': 4297 }, bsk_km: { '2026_ys': 33617, '2027': 34400, '2028': 35500, '2029': 36150 }, _kaynak: 'Program performans bilgisi s.260 (KGM)' },
  dsi: { sulama_mn_ha: { '2026_ys': 7.34, '2027': 7.40, '2028': 7.46, '2029': 7.53 }, _kaynak: 's.248 (DSİ)' },
  savunma_gsyh: { '2026_ys': 2.33, '2027': 2.85, '2028': 3.41, '2029': 3.50, _kaynak: 's.230 (MSB, NATO DPCS tanımı)' }
};
const KAMU_TOHUM_DONEM = { '2026-09': { yil: 2026, ay: 9, sermaye: { onceki: 762669, bu: 883019, hedef: 1312319, artis: 15.8, oran: 67.3 }, transfer: { onceki: 83562, bu: 222668, hedef: 525369, artis: 166.5, oran: 42.4 }, harcama: { onceki: 10222202, bu: 13948130, hedef: 18978815, artis: 36.4, oran: 73.5 }, kaynak: 'SBB haftalık 23 Eki 2026 s.78 (HMB) — tohum' } };
async function kamuYatirim() {
  const dosya = 'kamu-yatirim.json';
  let D = null; try { if (await varMi(dosya)) D = await oku(dosya); } catch (e) {}
  if (!D || typeof D !== 'object') D = { donemler: {} };
  D.donemler = D.donemler || {}; for (const [k, v] of Object.entries(KAMU_TOHUM_DONEM)) if (!D.donemler[k]) D.donemler[k] = v;
  D.butce = KAMU_BUTCE;
  D._not = '§533 kamu yatırım nabzı: merkezi yönetim sermaye giderleri (yıl içi kümülatif, milyon ₺) · kaynak HMB, SBB haftalık raporu üzerinden; bütçe çerçevesi 2027 Bütçe Gerekçesi.';
  let durum = '';
  try {
    /* §533b (25 Eki canlı koşu): pdftotext -raw sayfa başlığını tabloyla aynı sayfaya koymadı → "sayfa bulunamadı". Tarayıcıda doğrulanan
       metin pdf.js'ten geliyordu; Actions da AYNI kütüphaneyi kullanır (pdfjs-dist 3.11.174, koşu anında geçici klasöre kurulur — repo
       package.json'una dokunmaz). Günde en çok bir indirme. */
    const cp = await import('node:child_process'); const os = await import('node:os'); const { createRequire } = await import('node:module');
    if (D.kontrol === bugun && !KSET.has('kamuyatirim')) durum = '⏭ bugün kontrol edildi';
    else {
      const lst = await fetch('https://www.sbb.gov.tr/turkiye-ekonomisinde-haftalik-gelismeler/', { headers: { 'User-Agent': 'Mozilla/5.0 (KtPanel/1.0)' }, signal: AbortSignal.timeout(20000) });
      const html = lst.ok ? await lst.text() : ''; const m = html.match(/https?:\/\/www\.sbb\.gov\.tr\/wp-content\/uploads\/[^"']+Haftalik-Gelismeler[^"']+\.pdf/i);
      if (!m) durum = '✗ SBB liste sayfasında rapor bağlantısı yok (HTTP ' + lst.status + ')';
      else { const r = await fetch(m[0], { headers: { 'User-Agent': 'Mozilla/5.0 (KtPanel/1.0)' }, signal: AbortSignal.timeout(60000) });
        const buf = new Uint8Array(await r.arrayBuffer());
        const kok = path.join(os.tmpdir(), 'ktp-pdfjs');
        if (!existsSync(path.join(kok, 'node_modules', 'pdfjs-dist', 'package.json'))) cp.execSync('npm i --prefix "' + kok + '" --no-audit --no-fund --silent pdfjs-dist@3.11.174', { stdio: 'ignore', timeout: 120000 });
        const pdfjs = createRequire(path.join(kok, 'x.js'))('pdfjs-dist/legacy/build/pdf.js');
        const doc = await pdfjs.getDocument({ data: buf, useSystemFonts: true, isEvalSupported: false }).promise;
        let sayfa = null;
        for (let i = doc.numPages; i >= 1 && !sayfa; i--) { const t = (await (await doc.getPage(i)).getTextContent()).items.map(x => x.str).join(' ').replace(/\s+/g, ' ');
          if (/Merkezi Yönetim Bütçe Dengesi \(Milyon TL\)/.test(t) && /Bütçe Hedefi/.test(t) && /Sermaye Giderleri/.test(t)) sayfa = t; }
        D.kontrol = bugun;
        if (!sayfa) durum = '✗ raporda bütçe dengesi sayfası bulunamadı (' + doc.numPages + ' sayfa)';
        else { const AY = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
          const pm = sayfa.match(/Ocak\s*[-–]\s*(Ocak|Şubat|Mart|Nisan|Mayıs|Haziran|Temmuz|Ağustos|Eylül|Ekim|Kasım|Aralık)\s+(\d{4})/);
          const sayi = s => parseFloat(String(s).replace(/\./g, '').replace(',', '.'));
          const satir = ad => { const R = new RegExp(ad + '\\s+([\\d.]+)\\s+([\\d.]+)\\s+([\\d.]+)\\s+(-?[\\d,]+)\\s+(-?[\\d,]+)'); const x = sayfa.match(R); return x ? { onceki: sayi(x[1]), bu: sayi(x[2]), hedef: sayi(x[3]), artis: sayi(x[4]), oran: sayi(x[5]) } : null; };
          const sg = satir('Sermaye Giderleri'), st = satir('Sermaye Transferleri'), hr = satir('HARCAMALAR');
          if (!pm || !sg) durum = '✗ dönem/satır ayrıştırılamadı';
          else if (!(sg.bu > sg.onceki * 0.5 && sg.bu < sg.hedef * 1.6)) { durum = '✗ DENETİM: sermaye gideri tutarsız (' + JSON.stringify(sg) + ') — yazılmadı'; denetimDustu = true; }
          else { const ay = AY.indexOf(pm[1]) + 1, yil = +pm[2]; const k = yil + '-' + String(ay).padStart(2, '0');
            const yeni = !D.donemler[k] || String(D.donemler[k].kaynak || '').includes('tohum');
            D.donemler[k] = { yil, ay, sermaye: sg, transfer: st, harcama: hr, kaynak: 'SBB haftalık (HMB) ' + m[0].split('/').pop() };
            durum = '✓ ' + k + ' sermaye gideri ' + Math.round(sg.bu / 1000) + ' mlr ₺ (y/y %' + sg.artis + ', bütçenin %' + sg.oran + "'i)" + (yeni ? ' · YENİ dönem' : ' · değişmedi'); } } }
    }
  } catch (e) { durum = '✗ ' + String(e.message || e).slice(0, 90); }
  /* reel y/y: aynı ayın TÜFE yıllığıyla (sektor-surucu.json tufe) */
  try { const T = ((await oku('sektor-surucu.json')).seriler || {}).tufe; const A = (T && T.aylik) || {};
    for (const [k, v] of Object.entries(D.donemler)) { const y0 = (v.yil - 1) + k.slice(4); if (A[k] && A[y0] && v.sermaye) { v.tufe_yy = +((A[k] / A[y0] - 1) * 100).toFixed(1); v.sermaye.reel_yy = +(((1 + v.sermaye.artis / 100) / (1 + v.tufe_yy / 100) - 1) * 100).toFixed(1); } } } catch (e) {}
  const son = Object.keys(D.donemler).sort().pop(); D.son = son; D.guncelleme = bugun;
  /* yıl sonu tahmininin ima ettiği kalan harcama (yalnız bütçe yılı = son dönem yılı) */
  try { const v = D.donemler[son]; const ys = D.butce.sermaye_gideri[v.yil + '_ys']; if (ys && v.sermaye) D.ima = { yil: v.yil, kalan_ay: 12 - v.ay, kalan: ys - v.sermaye.bu, aylik_kalan: (ys - v.sermaye.bu) / Math.max(1, 12 - v.ay), aylik_gerceklesen: v.sermaye.bu / v.ay }; } catch (e) {}
  await yaz(dosya, D); if (/YENİ/.test(durum)) degisenler.push('kamu yatırım (' + son + ')');
  raporlar.push('### Kamu yatırım nabzı (§533) — ' + (durum || '✓ arşiv') + ' · son dönem ' + son + (D.donemler[son] && D.donemler[son].sermaye && D.donemler[son].sermaye.reel_yy != null ? ' · reel y/y %' + D.donemler[son].sermaye.reel_yy : ''));
}

/* ── §536 DE/JP GETİRİ EĞRİSİ CANLI (25 Eki) ─────────────────────────────────────────────────────────────────────────────
   Getiri Eğrisi Görseli'nde Almanya ve Japonya eğrisinin ŞEKLİ 27 Tem'den beri statik SVG idi (yalnız 3A/10Y uçları FRED aylık ile canlıydı).
   Birincil kaynaklar: JP — Japonya Maliye Bakanlığı (MOF) günlük JGB getiri CSV'si (1Y…40Y; doğrulandı 25 Eki: 2026/10/22 2Y 1,914 ·
   10Y 2,914 · 30Y 3,952). DE — ECB Veri Portalı avro bölgesi AAA devlet tahvili spot eğrisi (SDMX CSV; AAA grubu fiilen Bund ağırlıklı —
   etiket "Avro AAA (≈Bund)"). Çıktı: egri-dis.json {de:{tarih,vadeler}, jp:{tarih,vadeler}}; tutarsız (monoton olmayan sıra dışı,
   aralık dışı) veri YAZILMAZ, eski kalır. Panel egriGorselRender bu dosyadan çizer. */
async function egriDisUlke() {
  const dosya = 'egri-dis.json'; let D = {}; try { if (await varMi(dosya)) D = await oku(dosya); } catch (e) {}
  const notlar = []; let degisti = false;
  const ok = v => typeof v === 'number' && isFinite(v) && v > -2 && v < 15;
  /* JP — MOF */
  try { const r = await fetch('https://www.mof.go.jp/english/policy/jgbs/reference/interest_rate/jgbcme.csv', { headers: { 'User-Agent': 'Mozilla/5.0 (KtPanel/1.0)' }, signal: AbortSignal.timeout(30000) });
    if (!r.ok) notlar.push('JP MOF HTTP ' + r.status);
    else { const L = (await r.text()).split(/\r?\n/).map(x => x.trim()).filter(Boolean); const hi = L.findIndex(x => /^Date,/.test(x));
      if (hi < 0) notlar.push('JP MOF başlık yok');
      else { const H = L[hi].split(','); const satir = L.slice(hi + 1).filter(x => /^\d{4}\/\d{1,2}\/\d{1,2},/.test(x)).pop();
        if (!satir) notlar.push('JP MOF veri satırı yok');
        else { const c = satir.split(','); const v = {}; H.forEach((h, i) => { if (/^\d+Y$/.test(h)) { const x = parseFloat(c[i]); if (ok(x)) v[h] = x; } });
          const [y, m, g] = c[0].split('/'); const tarih = y + '-' + String(m).padStart(2, '0') + '-' + String(g).padStart(2, '0');
          if (['2Y', '5Y', '10Y', '30Y'].every(k => ok(v[k])) && Object.keys(v).length >= 6) { if (!D.jp || D.jp.tarih !== tarih) degisti = true; D.jp = { tarih, vadeler: v, kaynak: 'MOF Japan — jgbcme.csv (günlük JGB getirileri)' }; notlar.push('JP ' + tarih + ' 2Y ' + v['2Y'] + ' · 10Y ' + v['10Y'] + ' · 30Y ' + v['30Y']); }
          else notlar.push('JP MOF DENETİM: vade eksik/aralık dışı'); } } } }
  catch (e) { notlar.push('JP ' + String(e.message || e).slice(0, 60)); }
  /* DE — ECB SDMX (avro bölgesi AAA spot) */
  try { const V = ['1Y', '2Y', '3Y', '5Y', '7Y', '10Y', '15Y', '20Y', '30Y']; const key = V.map(x => 'SR_' + x).join('+');
    const r = await fetch('https://data-api.ecb.europa.eu/service/data/YC/B.U2.EUR.4F.G_N_A.SV_C_YM.' + key + '?lastNObservations=1&format=csvdata', { headers: { 'User-Agent': 'Mozilla/5.0 (KtPanel/1.0)', 'Accept': 'text/csv' }, signal: AbortSignal.timeout(30000) });
    if (!r.ok) notlar.push('DE ECB HTTP ' + r.status);
    else { const L = (await r.text()).split(/\r?\n/).filter(Boolean); const H = L[0].split(','); const iK = H.indexOf('KEY'), iT = H.indexOf('TIME_PERIOD'), iV = H.indexOf('OBS_VALUE');
      if (iK < 0 || iT < 0 || iV < 0) notlar.push('DE ECB sütun yok');
      else { const v = {}; let tarih = null;
        for (const s of L.slice(1)) { const c = s.split(','); const mk = String(c[iK]).match(/SR_(\d+Y)$/); const x = parseFloat(c[iV]); if (mk && ok(x)) { v[mk[1]] = x; tarih = c[iT]; } }
        if (['2Y', '5Y', '10Y', '30Y'].every(k => ok(v[k])) && Object.keys(v).length >= 6) { if (!D.de || D.de.tarih !== tarih) degisti = true; D.de = { tarih, vadeler: v, kaynak: 'ECB Veri Portalı — avro bölgesi AAA devlet tahvili spot eğrisi (YC.B.U2.EUR.4F.G_N_A.SV_C_YM)' }; notlar.push('DE ' + tarih + ' 2Y ' + v['2Y'] + ' · 10Y ' + v['10Y'] + ' · 30Y ' + v['30Y']); }
        else notlar.push('DE ECB DENETİM: vade eksik (' + Object.keys(v).join(',') + ')'); } } }
  catch (e) { notlar.push('DE ' + String(e.message || e).slice(0, 60)); }
  if (D.de || D.jp) { D.guncelleme = bugun; D._not = '§536 dış ülke getiri eğrileri — günlük, birincil kaynak; panel Getiri Eğrisi Görseli çizer.'; await yaz(dosya, D); if (degisti) degisenler.push('dış eğri (DE/JP)'); }
  raporlar.push('### Dış getiri eğrileri (§536) — ' + ((D.de && D.jp) ? '✓ ' : '⚠ ') + notlar.join(' · '));
}

/* ── §539 PD/DD BANDI KENDİ VERİMİZDEN (25 Eki) ──────────────────────────────────────────────────────────────────────────
   degerleme.json 31 Tem'de Fintables bilançosuyla elle üretilmişti (otomasyon borcu, 86 gün) ve panelde hiçbir yer okumuyordu. Aynı yöntem,
   kendi kaynaklarımızla, her koşuda: ana ortak özkaynağı KAP arşivinden (ifrs-full_EquityAttributableToOwnersOfParent, dönem sonu), fiyat
   Yahoo DÜZELTİLMİŞ çeyrek sonu kapanışı, pay adedi GÜNCEL (faktor-evren adet → KAP ödenmiş sermaye) — dosyanın kendi notu: fiyat serisi
   geriye düzeltilmiş olduğu için eski sermayeyle çarpmak PD'yi bozar (ALKA vakası). Bant 2023Ç1 sonrası (TMS-29 dönemi), ≥6 çeyrek.
   Evren: karar kataloğu ∪ XK050. Çıktı aynı şema (hisseler[]: k, ozk, srm, n, ort, sapma, dip, zirve, cv, guven + canlı z). Panel: karar
   puan kartı "PD/DD z" merceği — FAVÖK çarpanı olmayan (banka/holding/GYO) hisselerde puanlanır, diğerlerinde bilgi (çift sayım olmasın). */
async function degerlemeKendi() {
  let kat = []; try { kat = (await oku('karar-model.json')).modeller.map(m => m.kod); } catch (e) {}
  let uy = []; try { uy = ((await oku('endeks-uyeler.json')).uyeler || {}).XK050 || []; } catch (e) {}
  const evren = [...new Set([...kat, ...uy])]; if (!evren.length) { raporlar.push('### PD/DD bandı (§539) — ⏭ evren yok'); return; }
  let FE = {}; try { FE = (await oku('faktor-evren.json')).sirketler || {}; } catch (e) {}
  let SEK = {}; try { SEK = (await oku('fm-sektor.json')).sektor || {}; } catch (e) {}
  const PX = await kararYahoo(evren, '5y');
  const kapanis = (o, d) => { let a = -1; for (let j = 0; j < o.t.length; j++) { if (o.t[j] <= d) a = j; else break; } if (a < 0 || (Date.parse(d) - Date.parse(o.t[a])) / 864e5 > 10) return null; return o.adj[a]; };
  const qSon = (y, n) => new Date(Date.UTC(y, n * 3, 0)).toISOString().slice(0, 10);
  const H = []; let eksikKap = 0, eksikPx = 0, kisa = 0;
  for (const kod of evren) {
    let K = null; try { K = await oku('kap-arsiv/' + kod + '.json'); } catch (e) { eksikKap++; continue; }
    const o = PX[kod]; if (!o) { eksikPx++; continue; }
    let adet = FE[kod] && FE[kod].adet > 0 ? FE[kod].adet : null; let ozkSon = null, donemSon = null;
    const seri = [];
    for (const dk of Object.keys(K.donemler || {}).sort((a, b) => { const [a1, a2] = a.split('/').map(Number), [b1, b2] = b.split('/').map(Number); return (a1 - b1) || (a2 - b2); })) {
      const [y, n] = dk.split('/').map(Number); if (y < 2023) continue; const dn = K.donemler[dk]; const carpan = (dn.birim && dn.birim.carpan) || 1000;
      let ozk = null, srm = null;
      /* sanayi/holding/GYO şablonu: Bilanço tablosunda ana ortaklık özkaynağı. BANKA şablonu (ALBRK: tek 'Tablo ?'): ana ortaklık satırı yok,
         'ÖZKAYNAKLAR' etiketli ifrs-full_Equity (bilanço) alınır — özkaynak değişim tablosundaki aynı xbrl'li 'Dönem Başı/Sonu' satırları DEĞİL. */
      for (const t of (dn.tablolar || [])) { const bil = t.ad === 'Bilanço' || /^Tablo \?/.test(String(t.ad || ''));
        for (const s of (t.satirlar || [])) { if (!s.degerler || !(s.degerler[0] > 0)) continue;
          if (bil && s.xbrl === 'ifrs-full_EquityAttributableToOwnersOfParent') ozk = s.degerler[0] * carpan;
          else if (bil && !ozk && s.xbrl === 'ifrs-full_Equity' && /^(TOPLAM )?ÖZKAYNAKLAR$/i.test(String(s.etiket || '').trim())) ozk = s.degerler[0] * carpan;
          if (bil && s.xbrl === 'ifrs-full_IssuedCapital') srm = s.degerler[0] * carpan; } }
      if (!ozk) continue; if (!adet && srm) adet = srm;
      const px = kapanis(o, qSon(y, n)); if (!(px > 0)) continue;
      seri.push({ q: y + 'Q' + n, pddd: null, px, ozk }); ozkSon = ozk; donemSon = y + '/' + n;
    }
    if (!adet) continue;
    seri.forEach(s => { s.pddd = s.px * adet / s.ozk; });
    if (seri.length < 5) { kisa++; continue; }   /* ≥5 çeyrek (BINHO 2025/2'den beri 5 dönem) */
    const v = seri.map(s => s.pddd); const ort = v.reduce((a, b) => a + b, 0) / v.length; const sd = Math.sqrt(v.reduce((a, b) => a + (b - ort) ** 2, 0) / v.length);
    /* §540b (25 Eki, Veri Tazele #403): BERA z −5,32 · BINHO −4,84 — 5 çeyreklik bantta sapma çok küçük (BERA σ 0,034, ort 0,374) ve
       z şişiyor; fiyat düşüşü gerçek (PD/DD 0,19) ama "5 sigma" istatistik değil kısa örneklem. σ tabanı ortalamanın %15'i; n<8 → güven düşük. */
    const cv = ort > 0 ? sd / ort : null; const guven = (cv == null || v.length < 8) ? 'düşük' : cv <= 0.35 ? 'yüksek' : cv <= 0.6 ? 'orta' : 'düşük';
    const sdEff = Math.max(sd, 0.15 * Math.abs(ort));
    const sonPx = o.adj[o.adj.length - 1]; const canli = sonPx * adet / ozkSon; const z = sdEff > 0 ? (canli - ort) / sdEff : null;
    H.push({ k: kod, sektor: SEK[kod] || '', donem: donemSon, ozk: Math.round(ozkSon), srm: Math.round(adet), n: v.length, ort: +ort.toFixed(3), sapma: +sd.toFixed(3), dip: +Math.min(...v).toFixed(3), zirve: +Math.max(...v).toFixed(3), cv: cv == null ? null : +cv.toFixed(2), guven,
      canli: { tarih: o.t[o.t.length - 1], fiyat: +sonPx.toFixed(4), pddd: +canli.toFixed(3), z: z == null ? null : +z.toFixed(2) }, seri: seri.map(s => ({ q: s.q, pddd: +s.pddd.toFixed(3) })) });
  }
  if (H.length < 20) { raporlar.push('### PD/DD bandı (§539) — ✗ yalnız ' + H.length + ' hisse (KAP eksik ' + eksikKap + ' · fiyat eksik ' + eksikPx + ' · kısa ' + kisa + ') — dosya yazılmadı'); return; }
  H.sort((a, b) => a.k.localeCompare(b.k));
  const out = { surum: 'degerleme-' + bugun, guncelleme: bugun,
    yontem: 'PD/DD z-skoru. Tarihsel bant 2023Ç1 sonrası çeyreklik kapanışlardan (TMS-29 dönemi). Bedelsiz düzeltmesi: tüm dönemlerde GÜNCEL pay adedi kullanılır — fiyat serisi geriye doğru düzeltilmiş olduğu için eski sermayeyle çarpmak PD\'yi bozardı. §539: KAP arşivi (ana ortak özkaynağı) + Yahoo düzeltilmiş kapanış + faktor-evren pay adedi; Actions her fiyat koşusunda yeniden üretir.',
    neden_pddd: 'Enflasyon muhasebesinde F/K yanıltır — nominal kâr şişer, çarpan yapay ucuz görünür. Özkaynak da TMS-29 düzeltmesi gördüğü için PD/DD en az sapan çarpandır.',
    bant: { cok_ucuz: -1.5, ucuz: -0.5, adil_ust: 0.5, pahali_ust: 1.5 }, guven_esik: { yuksek: 0.35, orta: 0.6 },
    kaynak: 'KAP arşivi (Actions §381) · Yahoo adjclose · faktor-evren.json — §539', evren: 'karar kataloğu ∪ XK050', hisseler: H };
  await yaz('degerleme.json', out); degisenler.push('degerleme (' + H.length + ')');
  const ucuz = H.filter(h => h.canli.z != null && h.canli.z <= -1).map(h => h.k + ' ' + h.canli.z), pahali = H.filter(h => h.canli.z != null && h.canli.z >= 1).map(h => h.k + ' ' + h.canli.z);
  raporlar.push('### PD/DD bandı (§539) — ✓ ' + H.length + '/' + evren.length + ' hisse (KAP eksik ' + eksikKap + ' · kısa ' + kisa + ')' + (ucuz.length ? ' · z≤−1: ' + ucuz.slice(0, 8).join(', ') : '') + (pahali.length ? ' · z≥+1: ' + pahali.slice(0, 6).join(', ') : ''));
}

/* ── §546 EPİAŞ GERÇEK ZAMANLI ÜRETİM — HİDRO / RÜZGÂR HACMİ (26 Eki) ─────────────────────────────────────────────
   Kullanıcı: "AYDEM ve AKFYE'yi hallet". İki şirketin FAVÖK'ü PTF × ÜRETİM; PTF §466'da vardı, üretim hacmi (hidroloji, rüzgâr) için
   serbest seri yoktu. EPİAŞ Şeffaflık aynı TGT kimliğiyle ülke geneli saatlik gerçekleşen üretimi kaynak bazında verir
   (POST /electricity-service/v1/generation/data/realtime-generation · {startDate,endDate} · items[]: date, total, dammedHydro,
   river, wind, sun, geothermal, naturalGas, importCoal, lignite …). Santral bazlı seri (UEVÇB) ayrı yetki ister; ülke toplamı
   hidrolojik rejimin ve rüzgâr yılının vekilidir — aynı havzadaki santraller birlikte dolar/boşalır.
   Üretilen günlük seriler (GWh): hidro_uretim_gwh (barajlı + akarsu) · ruzgar_uretim_gwh · yenilenebilir_pay (% — hidro+rüzgâr+
   güneş+jeotermal ÷ toplam; pay yüksekken PTF düşer: hacim lehte, fiyat aleyhte — karar kartı ikisini birlikte okur).
   Alan adları ilk koşuda doğrulanır: beklenen alanlar yoksa rapor gelen anahtarları yazar, seri YAZILMAZ. */
const EPIAS_URETIM_BAS = '2024-01-01';
async function epiasUretim() {
  const dosya = 'sektor-surucu.json';
  if (!(await varMi(dosya))) { raporlar.push('### EPİAŞ üretim (§546) — ⏭ sektor-surucu.json yok'); return; }
  const kimlik = epiasKimlik(); if (!kimlik) { raporlar.push('### EPİAŞ üretim (§546) — ⏭ EPİAŞ kimliği yok (bkz. §466)'); return; }
  const D = await oku(dosya); D.seriler = D.seriler || {};
  const eski = (D.seriler.hidro_uretim_gwh && D.seriler.hidro_uretim_gwh.gunluk) || [];
  let bas = EPIAS_URETIM_BAS;
  if (eski.length) { const d = new Date(eski[eski.length - 1][0] + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() - 7); bas = d.toISOString().slice(0, 10); }
  const trSimdi = new Date(Date.now() + 3 * 3600 * 1000); const dun = (() => { const d = new Date(trSimdi.toISOString().slice(0, 10) + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() - 1); return d.toISOString().slice(0, 10); })();
  if (bas > dun) { raporlar.push('### EPİAŞ üretim (§546) — ⏭ güncel'); return; }
  let tgt; try { tgt = await epiasTgt(kimlik); } catch (e) { raporlar.push('### EPİAŞ üretim (§546) — ✗ giriş: ' + String(e && e.message || e).slice(0, 120)); return; }
  const parcalar = []; { let p = new Date(bas + 'T00:00:00Z'); const son = new Date(dun + 'T00:00:00Z'); while (p <= son) { const q = new Date(p); q.setUTCDate(q.getUTCDate() + 89); const e = q > son ? son : q; parcalar.push([p.toISOString().slice(0, 10), e.toISOString().slice(0, 10)]); p = new Date(e); p.setUTCDate(p.getUTCDate() + 1); } }
  const gun = new Map(); let hata = null, anahtarlar = null, alanEksik = false, satir = 0;
  const num = v => { const x = +v; return isFinite(x) ? x : 0; };
  for (const [s, e] of parcalar) {
    try {
      const r = await fetch('https://seffaflik.epias.com.tr/electricity-service/v1/generation/data/realtime-generation', { method: 'POST', headers: { 'TGT': tgt, 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify({ startDate: s + 'T00:00:00+03:00', endDate: e + 'T23:00:00+03:00' }), signal: AbortSignal.timeout(90000) });
      const t = await r.text(); if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + t.slice(0, 120).replace(/\s+/g, ' '));
      const j = JSON.parse(t); const items = j.items || [];
      if (items.length && !anahtarlar) { anahtarlar = Object.keys(items[0]); if (!('dammedHydro' in items[0]) || !('wind' in items[0]) || !('total' in items[0])) alanEksik = true; }
      if (alanEksik) break;
      for (const it of items) { const g = String(it.date || '').slice(0, 10); if (!/^\d{4}-\d{2}-\d{2}$/.test(g)) continue;
        const b = gun.get(g) || { n: 0, toplam: 0, hidro: 0, ruzgar: 0, yen: 0 };
        b.n++; b.toplam += num(it.total); b.hidro += num(it.dammedHydro) + num(it.river); b.ruzgar += num(it.wind);
        b.yen += num(it.dammedHydro) + num(it.river) + num(it.wind) + num(it.sun) + num(it.geothermal); gun.set(g, b); satir++; }
    } catch (err) { hata = (hata ? hata + ' | ' : '') + s + '..' + e + ': ' + String(err && err.message || err).slice(0, 100); }
  }
  if (alanEksik) { raporlar.push('### EPİAŞ üretim (§546) — ✗ beklenen alanlar yok (dammedHydro/wind/total) — gelen anahtarlar: ' + (anahtarlar || []).join(', ') + ' · seri YAZILMADI'); return; }
  if (!gun.size) { raporlar.push('### EPİAŞ üretim (§546) — ✗ veri gelmedi' + (hata ? '\n- ' + hata : '')); return; }
  const H = new Map(eski.map(x => [x[0], x[1]])), R = new Map(((D.seriler.ruzgar_uretim_gwh || {}).gunluk || []).map(x => [x[0], x[1]])), P = new Map(((D.seriler.yenilenebilir_pay || {}).gunluk || []).map(x => [x[0], x[1]]));
  let eksikGun = 0;
  for (const [g, b] of gun) { if (b.n < 20 || !(b.toplam > 0)) { eksikGun++; continue; } H.set(g, +(b.hidro / 1000).toFixed(1)); R.set(g, +(b.ruzgar / 1000).toFixed(1)); P.set(g, +(b.yen / b.toplam * 100).toFixed(1)); }
  const sirala = m => [...m.entries()].sort((a, b) => a[0] < b[0] ? -1 : 1);
  const gH = sirala(H), gR = sirala(R), gP = sirala(P); if (!gH.length) { raporlar.push('### EPİAŞ üretim (§546) — ✗ tam gün yok'); return; }
  const ortak = { kaynak: 'EPİAŞ Şeffaflık · gerçek zamanlı üretim, saatlik → günlük toplam (TGT) — §546', siklik: 'gunluk', guncelleme: bugun };
  const son = a => ({ tarih: a[a.length - 1][0], deger: a[a.length - 1][1] });
  D.seriler.hidro_uretim_gwh = Object.assign({}, D.seriler.hidro_uretim_gwh || {}, ortak, { ad: 'Hidroelektrik üretim — barajlı + akarsu, Türkiye günlük (GWh) §546', birim: 'GWh/gün', hisse: ['AYDEM', 'AKFYE'], gunluk: gH, son: son(gH), _not: 'Ülke toplamı; hidrolojik rejimin (kar erimesi, yağış, baraj doluluğu) vekili. Yıllık karşılaştırma: aynı takvim penceresi.' });
  D.seriler.ruzgar_uretim_gwh = Object.assign({}, D.seriler.ruzgar_uretim_gwh || {}, ortak, { ad: 'Rüzgâr üretimi — Türkiye günlük (GWh) §546', birim: 'GWh/gün', hisse: ['AYDEM', 'AKFYE'], gunluk: gR, son: son(gR) });
  D.seriler.yenilenebilir_pay = Object.assign({}, D.seriler.yenilenebilir_pay || {}, ortak, { ad: 'Yenilenebilir payı — hidro+rüzgâr+güneş+jeotermal ÷ toplam üretim (%) §546', birim: '%', hisse: ['AYDEM', 'AKFYE', 'ENJSA'], gunluk: gP, son: son(gP), _not: 'Pay yükselince PTF düşer (merit order): üretici için hacim lehte, fiyat aleyhte.' });
  D.seriler_guncelleme = bugun; await yaz(dosya, D); degisenler.push('EPİAŞ üretim (' + gH.length + ' gün)');
  const son30 = a => a.slice(-30).map(x => x[1]); const ort = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
  const yo = (a) => { const t = a[a.length - 1][0]; const y = (t.slice(0, 4) - 1) + t.slice(4); const g = a.filter(x => x[0] <= y).slice(-30).map(x => x[1]); const s = son30(a); return (g.length === 30 && s.length === 30) ? ((ort(s) / ort(g) - 1) * 100).toFixed(0) + '%' : null; };
  raporlar.push('### EPİAŞ üretim (§546) — ✓ hidro ' + gH[gH.length - 1][1] + ' GWh · rüzgâr ' + gR[gR.length - 1][1] + ' GWh · yenilenebilir %' + gP[gP.length - 1][1] + ' (' + gH[gH.length - 1][0] + ')\n- ' + gH.length + ' gün (' + gH[0][0] + '→) · bu koşu ' + gun.size + ' gün/' + satir + ' saat · ' + parcalar.length + ' parça' + (eksikGun ? ' · ' + eksikGun + ' eksik gün atlandı' : '') + '\n- son 30 gün ort.: hidro ' + (ort(son30(gH)) || 0).toFixed(0) + ' GWh (y/y ' + (yo(gH) || '—') + ') · rüzgâr ' + (ort(son30(gR)) || 0).toFixed(0) + ' GWh (y/y ' + (yo(gR) || '—') + ')' + (hata ? '\n- ⚠ ' + hata : ''));
}

/* ── SS333 SEKTOR ISI + ROTASYON OTOMATIK (sektor.json) ─────────────────────
   ELLE RITUELDI: haftalik Fintables koprusuyle Claude uretiyordu. OLCULDU
   (19 Agu): 15 sektor endeksinin TAMAMI zaten endeks-arsiv.json'da — kaynak
   evde, kopruye gerek yok. Dogrulama: XKMYA 3A arsivden %13,98, Fintables
   koprusuyle %13,86 (ayni pencerede degil, yakin) — arsiv yeterli.
   CAPA KURALI: hedef gun (bugun-7/-30/-90) arsivde yoksa EN YAKIN ONCEKI gun
   kullanilir ve SAPMA RAPORA yazilir (sektor satirlari arsive her gun degil,
   BIST zip'i sektor tasidiginda dusuyor: son 70 gunun 14'u).
   §114 TABAN BIRLIGI: benchmark (XU100) ve sektorler AYNI capa gunlerinden
   okunur — karisik taban yasak. Bir sektor capa gununde yoksa O SEKTOR atlanir,
   digerleri yazilir (kismi veri > hic veri, eksik gorunur kalir). */
/* ── SS334 HAZINE IHRAC TAKVIMI OTOMATIK (hazine-takvim.json) ───────────────
   ELLE RITUELDI: ayin ~25'inde HMB uc aylik ic borclanma stratejisini
   yayimliyor, Claude PDF'i okuyup takvimi yaziyordu. SS314 zaten yolu acti:
   ayni WP-API (portal/v2/posts) + pdf-parse.
   ARAMA: "ic borclanma stratejisi" — duyuru basligi standarttir.
   AYRISTIRMA: strateji PDF'inde ihale takvimi TABLO halinde durur; satirlar
   "GG.AA.YYYY" ihale tarihi + senet tanimi + vade iceriyor. Regex tarih-oncelikli
   calisir: once GG.AA.YYYY yakalanir, ayni satirdaki metinden enstruman ve
   vade cikarilir. TAHMIN YOK: eslesme bulunamazsa dosya KORUNUR ve ham metnin
   ilk 600 karakteri rapora dusulur (SS314 V1 deseni — sonraki tur gercek
   duzene gore inceltilir).
   KATILIM AYRIMI: "kira sertifikasi" gecen satirlar katilim=true isaretlenir —
   panelin sukuk tarafi bunu okur. */
async function hazineTakvimOto() {
  const dosya = 'hazine-takvim.json';
  try {
    if (!(await varMi(dosya))) return;
    const UA = { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36', 'accept': 'application/json' };
    const r = await fetch('https://www.hmb.gov.tr/portal/v2/posts?search=' + encodeURIComponent('iç borçlanma stratejisi') + '&per_page=5',
      { headers: UA, signal: AbortSignal.timeout(20000) });
    if (!r.ok) { raporlar.push('### Hazine ihraç takvimi (§334) — ⏭ posts HTTP ' + r.status); return; }
    const posts = await r.json();
    if (!Array.isArray(posts) || !posts.length) { raporlar.push('### Hazine ihraç takvimi (§334) — ⏭ duyuru bulunamadı'); return; }

    const d = await oku(dosya);
    const enYeni = posts.map(p => ({ slug: String(p.slug || ''), tarih: String(p.date || '').slice(0, 10),
      baslik: String((p.title || {}).rendered || '').replace(/&#[0-9]+;/g, "'"),
      pdf: ((p.content && p.content.rendered) || '').match(/href="([^"]+\.pdf[^"]*)"/i) }))
      .filter(x => x.slug && x.pdf).sort((a, b) => b.tarih.localeCompare(a.tarih))[0];
    if (!enYeni) { raporlar.push('### Hazine ihraç takvimi (§334) — ⏭ PDF ekli duyuru yok'); return; }
    /* SS334e SURUM DAMGASI: slug kilidi tek basina yeterli DEGIL — ayristirici
       duzeldiginde ayni duyuru YENIDEN islenmeli, yoksa bozuk cikti dosyada
       kalir (bu tam olarak yasandi). Kilit artik slug + ayristirici surumu. */
    const AYR_SURUM = 'v5';   /* SS334g: bitisik metin destegi */
    if (d._kaynak_slug === enYeni.slug && d._ayristirici === AYR_SURUM) {
      raporlar.push('### Hazine ihraç takvimi (§334) — ⏭ yeni strateji yok (mevcut: ' + enYeni.tarih + ' · ' + (d.donem || '?') + ')'); return; }

    let pdfParse = null;
    try { pdfParse = (await import('pdf-parse')).default; }
    catch (e) { raporlar.push('### Hazine ihraç takvimi (§334) — ✗ pdf-parse yok'); return; }
    const pr = await fetch(enYeni.pdf[1], { headers: { 'User-Agent': UA['User-Agent'] }, signal: AbortSignal.timeout(25000) });
    if (!pr.ok) { raporlar.push('### Hazine ihraç takvimi (§334) — ✗ PDF HTTP ' + pr.status); return; }
    const pd = await pdfParse(Buffer.from(await pr.arrayBuffer()));
    const metin = String(pd.text || '').replace(/\s+/g, ' ');

    /* ── SS334f GERCEK BELGEYE GORE YENIDEN YAZILDI (kullanici PDF'i verdi) ──
       ONCEKI SURUM DOSYAYI BOZDU: tarih-bazli bolme kullaniyordu, oysa her
       ihrac satiri UC ARDISIK TARIH tasir:
         "8.06.2026 10.06.2026 9.06.2027 ABD Dolari Cinsi Devlet Tahvili
          1 Yil / 364 Gun Dogrudan Satis"
          ^ihale     ^valor     ^itfa    ^senet turu    ^vade      ^yontem
       Bolme bunlari uc AYRI kayda dagitiyor, itfa tarihleri sahte ihrac
       oluyordu (15+ satirlik takvim 3'e dusmustu).
       OLCULEN INCELIKLER: (a) gunler TEK HANELI olabiliyor (8.06.2026),
       (b) "8 A y / 238 Gun" — PDF "Ay"i BOSLUKLU cikariyor, (c) yontem
       "Ihale / Yeniden ihrac", "Ihale / Ilk ihrac" veya "Dogrudan Satis".
       Artik TEK REGEX tum satiri yakalar; parca kaymasi imkansiz. */
    const T = '(\\d{1,2}\\.\\d{1,2}\\.\\d{4})';
    /* SS334g BITISIK METIN (canli kosu olcumu): pdf-parse bu belgede sutunlari
       BITISTIRIYOR — ham metinde "5.08.20264.47154.476" gibi. Onceki regex
       tarihler arasinda BOSLUK sart kosuyordu ve yalniz bosluklu kalan (Ekim)
       satirlarini yakalayabildi: 7/19. Artik tum ayiraclar \s* (sifir veya
       daha fazla) — hem bosluklu hem bitisik bicim calisir.
       Tarih deseni \d{1,2}.\d{1,2}.\d{4} oldugu icin bitisik sayi dizileri
       ("20264.4715") yanlislikla tarih olarak okunamaz: yil 4 hane alinir,
       kalan parca ikinci tarih desenine uymadigi icin eslesme duser. */
    const satirRx = new RegExp(T + '\\s*' + T + '\\s*' + T + '\\s*(.+?)\\s*(\\d+)\\s*(Y[\u0131i]l|A\\s*y)\\s*/\\s*\\d+\\s*G[\u00fcu]n\\s*(\u0130hale[^0-9]{0,24}|Do[\u011fg]rudan Sat[\u0131i][\u015fs])', 'gi');
    const isoCevir = (t) => { const p = t.split('.'); return p[2] + '-' + p[1].padStart(2, '0') + '-' + p[0].padStart(2, '0'); };
    const ihraclar = [];
    let mm;
    while ((mm = satirRx.exec(metin))) {
      const ad = mm[4].replace(/\s+/g, ' ').trim();
      if (ad.length < 6 || ad.length > 60) continue;              /* baslik/gurultu suzgeci */
      ihraclar.push({
        t: isoCevir(mm[1]), valor: isoCevir(mm[2]), itfa: isoCevir(mm[3]),
        ad, vade: mm[5] + ' ' + (/a\s*y/i.test(mm[6]) ? 'Ay' : 'Y\u0131l'),
        yontem: mm[7].replace(/\s+/g, ' ').trim(),
        katilim: /kira sertifikas/i.test(ad)
      });
    }
    if (ihraclar.length < 8) {
      raporlar.push('### Hazine ihraç takvimi (§334) — ⏭ PDF ayrıştırılamadı (' + ihraclar.length + ' satır), dosya KORUNDU' +
        '\n- kaynak: ' + enYeni.tarih + ' · ' + enYeni.baslik.slice(0, 70) +
        '\n- yakalanan: ' + ihraclar.map(x => x.t + ' ' + x.ad).join(' · ') +
        '\n- ham (1200): ' + metin.slice(0, 1200));
      return;
    }
    d.ihraclar = ihraclar.sort((a, b) => a.t.localeCompare(b.t));

    /* ── SS334d PANELIN OKUDUGU HER ALAN YAZILMALI ──────────────────────────
       Kullanici sordu: "strateji cikinca panelde ilgili yer guncellenecek mi?"
       OLCULDU: hazineRender uc alan okuyor — donem (rozet), sonraki_aciklama
       (bir sonraki yayin notu) ve finansman (aylik itfa/borclanma tablosu).
       Ilk yazim yalniz ihraclar+donem yaziyordu: yeni strateji gelse bile rozet
       altindaki "~25 Agustos (Eyl-Kas stratejisi)" notu ve HAZIRAN-AGUSTOS
       finansman tablosu EKRANDA KALACAKTI — yeni takvimin yaninda eski donemin
       rakamlari, en tehlikeli bayatlik turu (SS179.3).
       DERS: BIR DOSYAYI OTOMATIKLESTIRIRKEN, ONU OKUYAN RENDER'IN TUKETTIGI
       ALANLARIN TAMAMI YAZILIR — yarim yazilan dosya, yazilmamis dosyadan kotudur. */
    const AYLAR = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
    /* donem: baslikta "EYLÜL-KASIM" gibi gecer; iki ay adi + yil yakalanir */
    const bas = enYeni.baslik.toLocaleUpperCase('tr');
    const bulunanAylar = AYLAR.filter(a => bas.includes(a.toLocaleUpperCase('tr')));
    const yilM = bas.match(/20\d{2}/);
    if (bulunanAylar.length >= 2 && yilM) {
      d.donem = bulunanAylar[0] + '–' + bulunanAylar[bulunanAylar.length - 1] + ' ' + yilM[0];
      /* §459g (12 Eki, taramada yakalandı): HMB stratejisi ÇEYREKLİK DEĞİL AYLIK KAYAN — 31 Ağu "Eyl–Kas",
         30 Eyl "Eki–Ara" yayımlandı (bu katmanın kendi geçmişi). Eski kural "dönemin son ayından sonraki
         ay" diyordu → "~25 Ocak" basıyordu; oysa sıradaki yayın Ekim sonunda (Kas–Oca). Yayın, dönemin
         İLK ayının son iş günü civarıdır. DERS: BİR YAYININ RİTMİNİ KENDİ ARŞİVİNDEN ÖLÇ — varsaymak değil. */
      const ilkAyIdx = AYLAR.indexOf(bulunanAylar[0]);
      const s1 = AYLAR[(ilkAyIdx + 1) % 12], s3 = AYLAR[(ilkAyIdx + 3) % 12];
      d.sonraki_aciklama = AYLAR[ilkAyIdx] + ' sonu (' + s1.slice(0, 3) + '–' + s3.slice(0, 3) + ' stratejisi · aylık kayan)';
    } else {
      d.donem = enYeni.baslik.replace(/[^0-9A-Za-zÇĞİÖŞÜçğıöşü \-]/g, '').slice(0, 60);
      d.sonraki_aciklama = '—';   /* uydurma yok: baslik cozulemedi */
    }

    /* SS334f FINANSMAN — gercek tablo: baslik satirinda aylar, altinda
       "Ic Borc Servisi" (itfa) ve "Ic Borclanma" (borclanma) ucer sayi.
       Onceki genel regex ("ay adi + iki sayi") yanlis eslesmeye acikti;
       artik tablonun KENDI satir adlari kullanilir. */
    const fin = [];
    try {
      const basM = metin.match(/\(Milyar[^)]*\)\s*((?:[A-Z\u00c7\u011e\u0130\u00d6\u015e\u00dca-z\u00e7\u011f\u0131\u00f6\u015f\u00fc]+\s+20\d{2}\s*(?:\(\d\))?\s*){2,4})/);
      const aylarBul = basM ? basM[1].split(/20\d{2}\s*(?:\(\d\))?\s*/).map(x => x.trim()).filter(x => AYLAR.includes(x)) : [];
      /* SS334g: bitisik sayilar — "554,9616,3595,8". Turkce bicimde ondalik
         TEK hanedir (milyar TL, virgulden sonra 1 basamak), bu yuzden
         (\d{1,4},\d) deseni uc sayiyi bitisikken bile dogru ayirir. */
      const S3 = '\\s*(\\d{1,4},\\d)\\s*(\\d{1,4},\\d)\\s*(\\d{1,4},\\d)';
      const servisM = metin.match(new RegExp('\u0130\u00e7 Bor\u00e7 Servisi' + S3));
      const borcM = metin.match(new RegExp('\u0130\u00e7 Bor\u00e7lanma' + S3));
      const sy = (t) => { const v = parseFloat(String(t).replace(/\./g, '').replace(',', '.')); return isFinite(v) ? v : null; };
      if (aylarBul.length === 3 && servisM && borcM) {
        aylarBul.forEach((a, k) => {
          const it = sy(servisM[k + 1]), bo = sy(borcM[k + 1]);
          if (it != null && bo != null) fin.push({ ay: a, itfa: it, borclanma: bo });
        });
      }
    } catch (e) {}
    if (fin.length >= 2) d.finansman = fin; else { delete d.finansman; }

    d.guncelleme = bugun; d._kaynak_slug = enYeni.slug; d._ayristirici = AYR_SURUM; d._kaynak_pdf = enYeni.pdf[1];
    await yaz(dosya, d);
    degisenler.push('hazine ihraç takvimi (' + ihraclar.length + ')');
    const ks = ihraclar.filter(x => x.katilim).length;
    raporlar.push('### Hazine ihraç takvimi (§334) — ✓ ' + ihraclar.length + ' ihraç · ' + ks + ' kira sertifikası' +
      '\n- dönem: ' + d.donem + ' · sonraki yayın: ' + d.sonraki_aciklama +
      '\n- finansman tablosu: ' + (d.finansman ? (d.finansman.length + ' ay') : '⚠ ayrıştırılamadı, alan KALDIRILDI (panel — gösterir)') +
      '\n- kaynak: ' + enYeni.tarih + ' · ' + enYeni.baslik.slice(0, 70) +
      '\n' + ihraclar.slice(0, 6).map(x => '- ' + x.t + ' · ' + x.ad + (x.vade ? ' · ' + x.vade : '') + (x.katilim ? ' · KATILIM' : '')).join('\n'));
  } catch (e) { raporlar.push('### Hazine ihraç takvimi (§334) — ✗ ' + String(e && e.message || e).slice(0, 90)); }
}

async function sektorTazele() {
  const dosya = 'sektor.json';
  try {
    if (!(await varMi(dosya))) return;
    if (!(await varMi('endeks-arsiv.json'))) { raporlar.push('### Sektör ısı (§333) — ⏭ endeks arşivi yok'); return; }
    const d = await oku(dosya);
    const ar = await oku('endeks-arsiv.json');
    const G = (ar && ar.gunler) || {};
    const gunler = Object.keys(G).sort();
    if (!gunler.length) { raporlar.push('### Sektör ısı (§333) — ⏭ arşiv boş'); return; }

    const kodlar = [d.benchmark.k].concat(d.sektorler.map(x => x.k));
    /* capa: hedef tarihten geriye dogru, ISTENEN KODUN bulundugu ilk gun */
    const capa = (hedefISO, kod) => {
      for (let i = gunler.length - 1; i >= 0; i--) {
        const g = gunler[i];
        if (g <= hedefISO && G[g] && isFinite(+G[g][kod]) && +G[g][kod] > 0) return g;
      }
      return null;
    };
    const sonGun = capa('9999-12-31', d.benchmark.k);
    if (!sonGun) { raporlar.push('### Sektör ısı (§333) — ⏭ benchmark arşivde yok'); return; }
    const gunEkle = (iso, n) => { const t = new Date(iso + 'T00:00:00Z'); t.setUTCDate(t.getUTCDate() - n); return t.toISOString().slice(0, 10); };
    const UFUK = [['1G', 1], ['1H', 7], ['1A', 30], ['3A', 90]];

    /* TABAN BIRLIGI: capa gunleri BENCHMARK uzerinden bir kez secilir, tum
       sektorler AYNI gunlerden okunur (§114). */
    const capalar = {}; const sapma = [];
    for (const [ad, gun] of UFUK) {
      const hedef = gunEkle(sonGun, gun);
      const c = capa(hedef, d.benchmark.k);
      if (!c) { raporlar.push('### Sektör ısı (§333) — ⏭ ' + ad + ' çapası bulunamadı'); return; }
      const farkGun = Math.round((new Date(hedef) - new Date(c)) / 864e5);
      /* SS333b DURUSTLUK ESIGI (ilk testte yakalandi): sektor satirlari arsive
         4 Agu'dan BERI gunluk dusuyor; oncesinde yalniz ay sonu tohumlari var
         (30 Nis · 26 May · 30 Haz · 31 Tem). Bu yuzden "1A" capasi 20 gun
         geriye kayiyor ve etiket 1 AY derken 50 GUNLUK getiri gosteriyordu.
         KURAL: capa hedeften 7 gunden fazla saparsa O UFUK HESAPLANMAZ —
         dosyadaki damgali eski deger KORUNUR ve rapor sapmayi yazar.
         Yanlis etiketli dogru sayi, yanlis sayidan daha tehlikelidir (§179.3).
         Arsiv doldukca (Eyl'de 1A, Kas'ta 3A) ufuklar kendiliginden acilir. */
      if (farkGun > 7) { sapma.push(ad + ' hedef ' + hedef + ' → ' + c + ' (' + farkGun + ' gün geride) — ufuk ATLANDI, damgalı değer korundu'); capalar[ad] = null; continue; }
      capalar[ad] = c;
    }
    const getiri = (kod) => UFUK.map(([ad]) => {
      const c = capalar[ad];
      if (!c) return null;                                   /* SS333b: atlanan ufuk */
      const p0 = G[c] && +G[c][kod], p1 = G[sonGun] && +G[sonGun][kod];
      return (isFinite(p0) && p0 > 0 && isFinite(p1) && p1 > 0) ? +((p1 / p0 - 1) * 100).toFixed(2) : null;
    });

    /* SS333b: ufuk bazinda birlestirme — yeni deger varsa o, yoksa DAMGALI eski.
       Ufuk icinde taban birligi korunur (ayni ufkun tum kodlari ayni capadan);
       ufuklar arasi zaten farkli tarihlerdir, karisiklik degildir. */
    const birlestir = (yeni, eskiG) => yeni.map((v, i) => v == null ? (eskiG && eskiG[i] != null ? eskiG[i] : null) : v);
    const bG = birlestir(getiri(d.benchmark.k), d.benchmark.g);
    if (bG.every(x => x == null)) { raporlar.push('### Sektör ısı (§333) — ⏭ benchmark hiçbir ufukta hesaplanamadı'); return; }
    let yazilan = 0; const eksik = [];
    const yeniSektorler = d.sektorler.map(s => {
      const ham = getiri(s.k);
      if (ham.every(x => x == null)) { eksik.push(s.k); return s; }
      if (ham[0] != null) yazilan++;                          /* 1G tazelendiyse sayilir */
      return { k: s.k, ad: s.ad, g: birlestir(ham, s.g) };
    });
    if (yazilan < d.sektorler.length * 0.7) {
      raporlar.push('### Sektör ısı (§333) — ⏭ yalnız ' + yazilan + '/' + d.sektorler.length + ' sektör hesaplanabildi, dosya KORUNDU (eksik: ' + eksik.join(', ') + ')');
      return;
    }
    d.tarih = sonGun; d.guncelleme = bugun;
    d.benchmark = { k: d.benchmark.k, ad: d.benchmark.ad, g: bG };
    d.sektorler = yeniSektorler;
    d.capalar = { son: sonGun, '1G': capalar['1G'], '1H': capalar['1H'], '1A': capalar['1A'], '3A': capalar['3A'] };
    d.kaynak = 'BIST resmi kapanislari (endeks-arsiv.json) — §333 otomatik';
    await yaz(dosya, d);
    degisenler.push('sektör ısı (' + yazilan + ' sektör)');
    const enIyi = yeniSektorler.filter(s => s.g && s.g[3] != null).sort((a, b) => b.g[3] - a.g[3])[0];
    raporlar.push('### Sektör ısı + rotasyon (§333) — ✓ ' + sonGun + ' · ' + yazilan + '/' + d.sektorler.length + ' sektör' +
      '\n- çapalar: 1G ' + capalar['1G'] + ' · 1H ' + capalar['1H'] + ' · 1A ' + capalar['1A'] + ' · 3A ' + capalar['3A'] +
      '\n- XU100 (1G/1H/1A/3A): ' + bG.join(' · ') +
      (enIyi ? '\n- 3A lideri: ' + enIyi.k + ' %' + enIyi.g[3] : '') +
      (eksik.length ? '\n- ⚠ eski satırı korunanlar: ' + eksik.join(', ') : '') +
      (sapma.length ? '\n- ⚠ çapa sapması: ' + sapma.join(' · ') : ''));
  } catch (e) { raporlar.push('### Sektör ısı (§333) — ✗ ' + String(e && e.message || e).slice(0, 90)); }
}

/* ── §361 FAKTÖR EVRENİ — KAP'TAN KADEMELİ TAZELEME (20 Ağu) ────────────────
   SORUN (ölçüldü): faktör modeli "XKTUM evreni" diyor ama multiple.json ELLE
   besleniyor ve 141 hisse taşıyor. XKTUM ise 245 üye (endeks-uyeler.json,
   BIST resmî, her koşuda taze). Yani:
     · 113 XKTUM üyesi modelde HİÇ YOK (evrenin %46'sı)
     · KCHOL/THYAO/SISE/SAHOL gibi 9 hisse modelde VAR ama XKTUM üyesi DEĞİL
   §340 ile artık her şirketin tam finansalları KAP'tan çekilebiliyor; evren
   otomatik tazelenebilir.

   TASARIM KARARLARI (hepsi bilinçli, çekinceler kullanıcıya söylendi):
   1) KADEMELİ: KAP hız sınırı gerçek (bugün TUPRS/BIMAS'ta yaşandı). Her
      koşuda EN ESKİ güncellenen PARTI_BOY şirket çekilir; bilanço tetiğinde
      görünenler (taze bildirim) SIRAYA ÖNE alınır. Evren birkaç günde döner.
   2) AYRI DOSYA: multiple.json'a DOKUNULMAZ. Panel bağlantısı veri
      sağlamlaşınca yapılır — çalışan kart bozulmaz.
   3) TTM HAM TOPLAM: son 4 çeyreğin çeyrek sütunları toplanır, enflasyon
      endekslemesi UYGULANMAZ. Faktör modeli için önemli olan şirketler arası
      GÖRELİ sıralama ve hepsi aynı yöntemle hesaplandığı için sıralama
      bozulmaz. Dosyada `_yontem` ile yazılı.
   4) ŞABLON FARKI: banka (ALBRK) ve GYO (AAGYO/AHSGY) XBRL kodları farklıdır;
      kalemler boş gelirse şirket `eksik:true` işaretlenir — UYDURMA YOK.
   5) PAY ADEDİ: ödenmiş sermaye (ifrs-full_IssuedCapital) nominal 1 TL
      varsayımıyla pay adedini verir. Nominal farklıysa değer sapar; bu yüzden
      `adet_kaynak:'sermaye'` diye işaretlenir, kesin sayılmaz. */
/* ── §364 GYO NAV — TSPB RESMİ NAD SERVİSİ (20 Ağu, kullanıcı HAR'ından) ────
   NEDEN: GYO'da ciro/FAVÖK anlamsızdır; değer ölçüsü NAV İSKONTOSUDUR. §361
   faktör evreninde GYO'lar "eksik kalem" diye düşecekti — oysa kendi ölçüleri
   var ve resmî kaynağı da bu servis.
   KAYNAK (HAR'da ölçüldü): tspbnad.matriksdata.com
     /api/base/getmembers/all            → 57 GYO (member_uid ↔ member_symbol)
     /api/base/getperiods/all            → dönemler + isPublished bayrağı
     /api/reports/getmemReport/{uid}/{dönem} → şirket bazlı NAD tablosu
   ÇIKAN ALANLAR (Toplam Veriler bloğu):
     t1 portföy · t4 borçlar · t5 NET AKTİF DEĞER · t6 ödenmiş sermaye
     t7 PAY BAŞINA NAD · t8 İSKONTO/PRİM % · t9 borçluluk %
   TSPB'nin kendi tanımı (raporun notunda): İskonto = (piyasa değeri / NAD) − 1
   DİKKAT — GECİKME: son YAYIMLANMIŞ dönem 2025/12; 2026/06 hazır ama
   isPublished=false. Yani t8 iskontosu O DÖNEMİN piyasa değerine göredir.
   Panelde pay başına NAD ile CANLI fiyat kullanılıp bugünün iskontosu ayrıca
   hesaplanır; TSPB'nin resmî oranı referans olarak yanında durur.
   Bildirim göndermemiş şirket sıfır döner (AHSGY'de görüldü) — o kayıt ATLANIR,
   sıfır iskonto diye yazılmaz. */

/* ── §429 FON PORTFÖY DAĞILIMI (28 Ağu, kullanıcı isteği + iki HAR + örnek PDF) ──
   NE: katılım hisse yoğun + katılım serbest hisse fonlarının AY SONU hisse
   portföyü ve AY İÇİ alış/satışları. Kaynak KAP "Portföy Dağılım Raporu"
   (aylık, ayın ~10'unda yayımlanır, tek ek: PDF, 120 sayfa).
   ZİNCİR (HAR'dan ölçüldü): POST /tr/api/disclosure/funds/byCriteria (pencere)
     → stockCode/disclosureIndex → GET /tr/Bildirim/<index> (HTML; içinde
     api/file/download/<objId>) → GET PDF → `pdftotext -layout` → ayrıştırıcı
     (fonportfoy-pdf.mjs; KPU 2026/07 ile birebir mutabakat: 33 hisse, FTD
     toplamı 87,81 = GRUP TOPLAMI, alış 164,1 mn / satış 197,1 mn = rapor).
   EVREN: fon-portfoy.json.evren_elle (kullanıcı sabitler) ∪ otomatik
     (TEFAS köprüsünün unvanından: KATILIM ∧ (HİSSE SENEDİ ∨ SERBEST)); otomatik
     evren dosyaya CACHE'lenir ki fon katmanı koşmayan turda da çalışsın.
   RİTİM: Cumartesi `hepsi` + elle. İlk koşu 400 gün geriye bakar (13 rapor/fon);
     sonraki koşular 45 gün. Tur başına en fazla 40 PDF (süre bütçesi §326).
   DENETİM (uydurma yasağı): grup % toplamı 100±0,5 · değer = GRUP TOPLAMI ±%0,1
     · ≥5 kod. Düşen rapor YAZILMAZ, sebebi rapora düşer.
   pdftotext yoksa katman ATLANIR ve söyler (workflow poppler-utils kurar). */
async function fonPortfoy() {
  const dosya = 'fon-portfoy.json';
  const cp = await import('node:child_process'), os = await import('node:os');
  const uyku = (ms) => new Promise(r => setTimeout(r, ms));
  let pdftotext = true; try { cp.execSync('pdftotext -v', { stdio: 'ignore' }); } catch (e) { pdftotext = false; }
  if (!pdftotext) { raporlar.push('### Fon portföy dağılımı (§429) — ⏭ pdftotext yok (poppler-utils kurulmamış); katman atlandı'); return; }
  let P; try { P = await import('./fonportfoy-pdf.mjs'); } catch (e) { raporlar.push('### Fon portföy dağılımı (§429) — ✗ ayrıştırıcı modülü yüklenemedi: ' + String(e.message || e).slice(0, 80)); return; }
  let d = (await varMi(dosya)) ? await oku(dosya) : { evren: {}, evren_elle: [], fonlar: {} };
  d.evren = d.evren || {}; d.fonlar = d.fonlar || {}; d.evren_elle = Array.isArray(d.evren_elle) ? d.evren_elle : [];
  /* §429b KULLANICI KODU: Actions formundaki --fonkod (virgüllü) evren_elle'ye
     KALICI eklenir; o fon bu turda çekilir (ilk kez görülüyorsa 400 gün geriye). */
  const elleYeni = String(arg('fonkod') || '').toUpperCase().split(/[,\s;]+/).map(x => x.trim()).filter(x => /^[A-Z0-9]{2,5}$/.test(x));
  elleYeni.forEach(k => { if (!d.evren_elle.includes(k)) d.evren_elle.push(k); });
  if (elleYeni.length) raporlar.push('- §429b elle eklenen fon: ' + elleYeni.join(', '));
  /* 1) EVREN */
  /* §429c CANLI: __akisMeta fon katmanının sonunda null'lanıyor (satır ~946) -> evren hep 0 çıktı. Unvan sözlüğü ayrı (__fonUnvan). */
  const UNV = globalThis.__fonUnvan || {};
  const meta = {}; Object.keys(UNV).forEach(k => meta[k] = { unvan: UNV[k] });
  let otoN = 0;
  Object.keys(meta).forEach(k => {
    const u = String(meta[k].unvan || '').toUpperCase().replace(/İ/g, 'I');
    /* §429h (bu tabana 2. kez — ilk uygulama yanlış kopyaya gitmişti, canlı #211
       kanıtı: hepsi koşusu geniş regex'le 86 fonu geri ekledi, KKC sınıfı 40
       slotu yaktı, 0 rapor işlendi): SERBEST ancak adında HISSE varsa girer. */
    if (/KATILIM/.test(u) && (/HISSE SENEDI/.test(u) || (/SERBEST/.test(u) && /HISSE/.test(u))) && !/BORCLANMA|KIRA SERT|PARA PIYASASI|ALTIN|KIYMETLI|DOVIZ|EUROBOND/.test(u)) {
      if (!d.evren[k]) otoN++;
      d.evren[k] = { ad: String(meta[k].unvan).trim(), kaynak: 'tefas-oto', tur: /SERBEST/.test(u) ? 'serbest' : 'hisse-yogun' };
    }
  });
  d.evren_elle.forEach(k => { k = String(k).toUpperCase(); if (!d.evren[k]) d.evren[k] = { ad: k, kaynak: 'elle', tur: '?' }; });
  /* §429h temizlik: geniş kuralla girmiş otomatik kayıtlar pasife taşınır (silinmez); elle olanlar korunur */
  d.evren_pasif = d.evren_pasif || {};
  Object.keys(d.evren).forEach(k => {
    const v = d.evren[k]; if (v.kaynak !== 'tefas-oto' || d.evren_elle.includes(k)) return;
    const u2 = String(v.ad || '').toUpperCase().replace(/İ/g, 'I');
    if (!(/KATILIM/.test(u2) && (/HISSE SENEDI/.test(u2) || (/SERBEST/.test(u2) && /HISSE/.test(u2))) && !/BORCLANMA|KIRA SERT|PARA PIYASASI|ALTIN|KIYMETLI|DOVIZ|EUROBOND/.test(u2))) { d.evren_pasif[k] = v; delete d.evren[k]; }
  });
  const evrenKod = Object.keys(d.evren).sort();
  if (!evrenKod.length) { raporlar.push('### Fon portföy dağılımı (§429) — ⏭ evren boş (TEFAS unvanı gelmedi, evren_elle de yok)'); await yaz(dosya, d); return; }
  /* 2) KAP LİSTESİ — pencere: ilk koşu 400 gün, sonra 45 */
  const ilkKosu = !Object.keys(d.fonlar).length;
  const GUN = 86400000, simdi = Date.now();
  const iso = t => new Date(t).toISOString().slice(0, 10);
  const H = { 'content-type': 'application/json', 'accept': 'application/json', 'referer': 'https://www.kap.org.tr/tr/bildirim-sorgu',
    'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36' };
  /* §429k KALICI İSTİSNA: görüntü-PDF'li fonlar hiç işlenemez; işaretsiz kalınca
     geriye-bakışı sürekli tam pencereye kilitliyordu (canlı #209). */
  d.basarisiz = d.basarisiz || {};
  /* §429o TEK SEFERLİK AF: 14 istisna, çoklu-ek (§429j) ÖNCESİNDE 'metin katmanı yok'
     damgası yemişti — çoğu ilk eki boş olan parçalı rapordu. Bir kez sıfırlanır,
     yeniden denenir; gerçekten görüntü olanlar yeniden damgalanır. */
  if (!d._af429o) { const n0 = Object.keys(d.basarisiz).length; d.basarisiz = {}; d._af429o = bugun; if (n0) raporlar.push('- §429o af: ' + n0 + ' kalıcı istisna sıfırlandı, çoklu-ek ile yeniden denenecek'); }
  const yeniFonVar = evrenKod.some(k => !d.fonlar[k] && !d.basarisiz[k]);
  const pencereGun = (ilkKosu || yeniFonVar) ? 150 : 45;   /* §431 (bu tabana 2. kez): 150 gün ≈ 5 rapor/fon; 400 taşıyordu */
  /* §429c KAP ŞEMASI (canlı #178): funds/byCriteria kaydı {publishDate, fundCode,
     kapTitle, disclosureClass, disclosureType:'FON', summary, ...} — stockCode YOK,
     fundCode VAR. 400 günlük tek pencere 2000 kayıtta KESİLDİ (tavan). Artık 30
     günlük pencereler; hâlâ 2000 gelirse pencere yarılanır (7 güne kadar).
     Konu süzgeci: HAR'daki FILTERYFBF yolunun ikinci kimliği (Portföy Dağılım
     Raporu konusu) subjectList'e verilir; uç reddederse süzgeçsiz denenir. */
  const SUBJ = '8aca490d502e34b801502e380044002b';
  const kodAl = b => String(b.fundCode || b.stockCode || b.fonKodu || '').toUpperCase().trim();
  const idxAl = b => b.disclosureIndex || b.index || b.disclosureId || null;
  const oidAl = b => b.mkkMemberOid || b.memberOid || b.fundOid || (b.disclosureDetail && b.disclosureDetail.fundOid) || null;
  /* §429q (canlı #216): 32 fon 'subject=Portföy Dağılım Raporu' ile REDDEDİLİYORDU —
     aynı görünen metin farklı Unicode biçimindeydi (ö/ğ/ı ayrıştırılmış: harf +
     birleşik aksan). Süzgeç artık NFKD-normalize + aksan soyma + İ/ı katlama sonrası
     ASCII kalıpla bakar. Kurucular arası tek fark yazım biçimiydi. */
  const ascii = s => String(s || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/İ/g, 'I').replace(/ı/g, 'i').replace(/[ĞğŞşÇçÖöÜü]/g, c => ({Ğ:'G',ğ:'g',Ş:'S',ş:'s',Ç:'C',ç:'c',Ö:'O',ö:'o',Ü:'U',ü:'u'}[c])).toUpperCase();
  const pdMi = b => /PORTFOY\s*DAGILIM/.test(ascii(String(b.subject || '') + ' ' + String(b.summary || '') + ' ' + String(b.title || '')));
  /* §429e (canlı #182): konu süzgeçli tarama 15.886 kayıt gördü, evrenin 9 fonunu
     YAKALAYAMADI — raporlar ayın ilk 10 gününde yığılıyor, 7 günlük pencere bile
     2000 tavanına çarpıyor, kesilen dilimde kalıyorlar. Tüm piyasayı taramak yanlış
     yol. İKİ AŞAMA: (A) KAP üye kimliği (mkkMemberOid) bilinen fon → fon bazında TEK
     istek, 400 gün, mkkMemberOidList=[oid] (ilk HAR'daki FILTERYFBF yolu da bu
     kimlikle çalışıyordu). (B) Kimliği bilinmeyen fon → pencereli tarama, pencere
     1 güne kadar daralır, yol boyunca evren fonlarının kimliği HASAT edilir ve
     dosyaya yazılır; sonraki koşu A'dan gider. Toplam istek tavanı 140. */
  let liste = [], yol = '', ornek = null, hamToplam = 0, istekSay = 0, kesik = 0, hasat = 0;
  const cek = async (uc, from, to, subj, oids) => {
    const r = await fetch('https://www.kap.org.tr/tr/api/disclosure/' + uc + '/byCriteria', { method: 'POST', headers: H,
      body: JSON.stringify({ fromDate: iso(from), toDate: iso(to), mkkMemberOidList: oids || [], subjectList: subj ? [SUBJ] : [] }), signal: AbortSignal.timeout(30000) });
    istekSay++;
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const j = await r.json(); const items = Array.isArray(j) ? j : (j.items || j.data || []);
    const out = items.map(b => b.disclosureBasic || b);
    if (!ornek && out[0]) ornek = JSON.stringify(out[0]).slice(0, 600);
    /* kimlik hasadı: evren fonuna ait her kayıt */
    out.forEach(b => { const k = kodAl(b), o = oidAl(b); if (k && o && d.evren[k] && !d.evren[k].oid) { d.evren[k].oid = o; hasat++; } });
    return out;
  };
  /* §429f (bu tabana taşındı — kopya ayrışmasında kaybolmuştu): unvan eşlemesi
     (KAP fundCode ≠ TEFAS kodu olan fonlar için) + kapKod öğrenme + teşhis. */
  const norm = tt => ascii(tt).replace(/[^A-Z0-9]+/g, ' ').replace(/\b(A S|AS|TL|FONU|FON|HISSE SENEDI YOGUN)\b/g, ' ').replace(/\s+/g, ' ').trim();
  const evrenUnvan = {}; evrenKod.forEach(k => { const u = (UNV[k] || (d.evren[k] && d.evren[k].kaynak !== 'elle' && d.evren[k].ad) || ''); if (u) evrenUnvan[norm(u)] = k; });
  const gorulenKod = new Set(), ilginc = [], redOrnek = {}, kabulSay = {};
  const kabul = b => {
    const k = kodAl(b); if (k) gorulenKod.add(k);
    /* §429p TEŞHİS (canlı #215: 40 görülen, 9 kuyrukta): evren fonunun kaydı
       neden reddedildi? İlk örnek fon başına saklanır, rapora basılır. */
    if (k && evrenKod.includes(k) && !pdMi(b) && !redOrnek[k]) redOrnek[k] = 'subject=' + String(b.subject || '').slice(0, 30) + ' · summary=' + String(b.summary || '').slice(0, 30) + ' · class=' + String(b.disclosureClass || '') + ' · idx=' + (idxAl(b) || '?');
    if (pdMi(b) && !evrenKod.includes(k) && ilginc.length < 12 && /KATILIM/.test(ascii(b.kapTitle)) && /HISSE/.test(ascii(b.kapTitle)) && !ilginc.some(x => x.startsWith(k + '='))) ilginc.push(k + '=' + String(b.kapTitle || '').slice(0, 55));
    if (!pdMi(b)) return false;
    if (evrenKod.includes(k)) { kabulSay[k] = (kabulSay[k] || 0) + 1; return true; }
    const kk = evrenKod.find(e => d.evren[e].kapKod === k); if (kk) { b.__evrenKod = kk; return true; }
    const eş = evrenUnvan[norm(b.kapTitle)]; if (eş) { b.__evrenKod = eş; return true; }
    return false;
  };
  const bas = simdi - pencereGun * GUN;
  /* (A) kimliği bilinen fonlar — fon başına tek istek */
  const oidli = evrenKod.filter(k => d.evren[k].oid);
  for (const k of oidli) {
    try { const items = await cek('funds', bas, simdi, true, [d.evren[k].oid]); hamToplam += items.length; items.filter(kabul).forEach(b => liste.push(b)); }
    catch (e) { raporlar.push('- §429 ' + k + ' (oid) : ' + String(e.message || e).slice(0, 60)); }
    await uyku(250);
  }
  if (oidli.length) yol = 'funds+oid(' + oidli.length + ')';
  /* (B) kimliksizler — pencereli tarama, 1 güne kadar daralır */
  const oidsiz = evrenKod.filter(k => !d.evren[k].oid);
  if (oidsiz.length) {
    let to = simdi, adim = 30 * GUN, ham = 0;
    try {
      while (to > bas && istekSay < 140) {
        const from = Math.max(to - adim, bas);
        const items = await cek('funds', from, to, true);
        ham += items.length; hamToplam += items.length;
        if (items.length >= 2000 && adim > 1 * GUN) { adim = Math.max(GUN, Math.floor(adim / 2)); kesik++; continue; }
        items.filter(kabul).forEach(b => liste.push(b));
        to = from;
        if (items.length < 400 && adim < 30 * GUN) adim = Math.min(30 * GUN, adim * 2);   /* seyrek bölgede pencereyi geri büyüt */
        await uyku(250);
      }
    } catch (e) { raporlar.push('- §429 tarama: ' + String(e.message || e).slice(0, 60)); }
    yol += (yol ? ' + ' : '') + 'tarama(' + oidsiz.length + ' fon, ' + ham + ' kayıt' + (to > bas ? ', ' + Math.round((to - bas) / GUN) + ' gün TARANAMADI' : '') + ')';
    /* hasat edilen kimlikler için hemen A yolu — tarama kaçırdıysa bu yakalar */
    for (const k of oidsiz) {
      if (!d.evren[k].oid || istekSay >= 150) continue;
      try { const items = await cek('funds', bas, simdi, true, [d.evren[k].oid]); hamToplam += items.length; items.filter(kabul).forEach(b => liste.push(b)); } catch (e) {}
      await uyku(250);
    }
  }
  if (hasat) raporlar.push('- §429e KAP üye kimliği hasat edildi: ' + hasat + ' fon (dosyaya yazıldı; sonraki koşu fon bazında sorgular)');
  await yaz(dosya, d);   /* kimlikler kalıcı olsun — rapor listesi boş dönse bile */
  { const gorulmeyen = evrenKod.filter(k => !gorulenKod.has(k) && !d.basarisiz[k] && !(d.evren[k].kapKod && gorulenKod.has(d.evren[k].kapKod)));
    const kabulSiz = evrenKod.filter(k => gorulenKod.has(k) && !kabulSay[k]);
    raporlar.push('- §429p kabul dağılımı: ' + Object.keys(kabulSay).length + ' fon kabul (' + Object.entries(kabulSay).map(([k, v]) => k + ':' + v).join(' ') + ')' +
      (kabulSiz.length ? '\n- §429p GÖRÜLDÜ AMA KABUL 0 (' + kabulSiz.length + '): ' + kabulSiz.slice(0, 6).map(k => k + ' [' + (redOrnek[k] || 'kayıt pdMi geçti?') + ']').join(' | ') + (kabulSiz.length > 6 ? ' …+' + (kabulSiz.length - 6) : '') : ''));
    raporlar.push('- §429f teşhis: listede ' + gorulenKod.size + ' farklı fon kodu · evrenden görülen: ' + (evrenKod.length - gorulmeyen.length) + '/' + evrenKod.length +
      (gorulmeyen.length ? '\n- §429n GÖRÜLMEYEN (' + gorulmeyen.length + ', ' + pencereGun + ' günde KAP listesinde yok): ' + gorulmeyen.map(k => k + '=' + String((d.evren[k] && d.evren[k].ad) || '').slice(0, 28)).join(' · ') : '') +
      (ilginc.length ? '\n- §429n kod uyuşmazlığı adayları (KAP başlığı katılım-hisse, kod evren dışı): ' + ilginc.join(' | ') : '')); }
  if (!liste.length) { raporlar.push('### Fon portföy dağılımı (§429) — ⏭ KAP listesinden evren raporu gelmedi (evren ' + evrenKod.length + ' fon · kimlikli ' + evrenKod.filter(k => d.evren[k].oid).length + ' · ' + istekSay + ' istek · ' + hamToplam + ' ham kayıt · yol: ' + yol + ')' + (ornek ? '\n- ilk kayıt örneği: `' + ornek.replace(/`/g, '') + '`' : '')); return; }
  /* 3) EKSİK (kod, dönem) çiftleri */
  const isler = [];
  /* §434 GEÇİŞ: varlık alanı olmayan (eski) dönemler 'işlenmiş' sayılmaz → KAP'tan yeniden okunur (kaynak kalıcı, bedava) */
  const islenmisIdx = new Set(); Object.values(d.fonlar).forEach(f => Object.values(f.donemler || {}).forEach(x => { if (x.kaynak && x.kaynak.index && ('varlik' in x) && !(x.varlik && (x.varlik._tutarsiz || (x.varlik.hisse || 0) > 100.5)) && !(x.kaynak && !x.kaynak.islemIz && x.islem && !Object.keys(x.islem.alis || {}).length && !Object.keys(x.islem.satis || {}).length)) islenmisIdx.add(String(x.kaynak.index)); }));   /* §434g: işlemi boş ve izsiz dönem bir kez yeniden okunur */   /* §434f: tutarsız dağılım yeniden okunur */
  liste.forEach(b => {
    const kod = b.__evrenKod || kodAl(b), index = idxAl(b); if (!kod || !index) return;
    if (b.__evrenKod && kodAl(b) && d.evren[kod] && !d.evren[kod].kapKod) d.evren[kod].kapKod = kodAl(b);   /* §429f: KAP kodu farklıysa öğren */
    if (islenmisIdx.has(String(index))) return;   /* aynı bildirim iki kez işlenmez */
    let donem = null;
    if (b.year && b.donem) donem = b.year + '-' + String(b.donem).padStart(2, '0');
    else { const m = String(b.summary || '').match(/(\d{4})\s*\/\s*(\d{1,2})\s*\.?\s*Ay/i); if (m) donem = m[1] + '-' + m[2].padStart(2, '0'); }
    if (d.basarisiz[kod]) return;   /* §429k kalıcı istisna */
    isler.push({ kod, donem, index, yayin: b.publishDate });   /* donem null ise PDF başlığından alınır */
  });
  raporlar.push('- §429p kuyruk: liste ' + liste.length + ' kayıt · daha önce işlenmiş ' + islenmisIdx.size + ' idx · iş ' + isler.length);
  /* aynı (kod,dönem) için en son yayın kazanır; dönemi bilinmeyenler ayrı tutulur */
  const tekil = {}; isler.forEach(i => { const k = i.kod + '|' + (i.donem || ('idx' + i.index)); if (!tekil[k] || String(tekil[k].index) < String(i.index)) tekil[k] = i; });
  /* §429b: deposu boş (yeni eklenen) fonlar ÖNCE, sonra yeni dönemden eskiye */
  /* §434b: yeniden okuma (varlık geçişi) yükü KAP/pdftotext'i kesiyordu (#223: 73 terminated/fetch failed) —
     hiç işlenmemiş dönem ÖNCE, yeniden okuma sonra; tur tavanı 80 */
  const yenidenMi = i => Object.values(d.fonlar[i.kod] ? d.fonlar[i.kod].donemler : {}).some(x => x.kaynak && String(x.kaynak.index) === String(i.index));
  const sira = Object.values(tekil).sort((a, b) => ((yenidenMi(a) ? 1 : 0) - (yenidenMi(b) ? 1 : 0)) || (((d.fonlar[a.kod] ? 1 : 0) - (d.fonlar[b.kod] ? 1 : 0)) || ((String(b.donem || '') > String(a.donem || '')) ? 1 : -1))).slice(0, 80);
  let yazildi = 0, dusen = [], hata = [];
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'fonpd-'));
  for (const is of sira) {
    try {
      const rh = await fetch('https://www.kap.org.tr/tr/Bildirim/' + is.index, { headers: { 'user-agent': H['user-agent'], 'accept': 'text/html' }, signal: AbortSignal.timeout(20000) });
      const html = await rh.text();
      /* §429j ÇOKLU EK (IVF canlı vakası: belge başı 'VII-PORTFÖYDEN SATIŞLAR' —
         rapor parçalara bölünmüş, ilk ek işlem parçası olabiliyor). Sayfadaki
         TÜM ekler (en fazla 4) indirilir, metinleri sayfa sırasıyla birleştirilir. */
      const objler = [...new Set([...html.matchAll(/api\/file\/download\/([0-9a-f]{20,40})/g)].map(m => m[1]))].slice(0, 8);   /* §429o: IVF tablo parçası 4. ekten sonra olabilir */
      if (!objler.length) { hata.push(is.kod + ' ' + is.donem + ': ek bulunamadı (HTTP ' + rh.status + ')'); await uyku(400); continue; }
      let txt = '', toplamB = 0, obj = objler[0];
      for (const o of objler) {
        const rp = await fetch('https://www.kap.org.tr/tr/api/file/download/' + o, { headers: { 'user-agent': H['user-agent'] }, signal: AbortSignal.timeout(40000) });
        if (!rp.ok) continue;
        const buf = Buffer.from(await rp.arrayBuffer()); toplamB += buf.length;
        const pf = path.join(tmp, is.kod + '-' + is.donem + '-' + o.slice(-6) + '.pdf'); await fs.writeFile(pf, buf);
        try { txt += '\n' + cp.execSync('pdftotext -layout "' + pf + '" -', { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'], timeout: 90000 }); } catch (e2) { hata.push(is.kod + ' ' + (is.donem||'') + ': pdftotext ' + String(e2.signal || e2.code || e2.message).slice(0, 40)); }
        if (objler.length > 1) await uyku(250);
      }
      const buf = { length: toplamB };
      if (txt.replace(/\s+/g, '').length < 200) { d.basarisiz[is.kod] = { sebep: 'PDF metin katmanı yok', tarih: bugun }; hata.push(is.kod + ' ' + is.donem + ': PDF metin katmanı yok — KALICI istisna işaretlendi'); await uyku(300); continue; }
      const r = P.raporuAyristir(txt);
      if (!r.denetim.gecti) {
        dusen.push(is.kod + ' ' + is.donem + ': ' + r.denetim.sorun.join('; '));
        /* §429l: aynı fon bir koşuda 2. kez 'aday satır da yok' ile düşerse hisse
           tablosu görüntü gömülüdür (RBH) — kalıcı istisna, kuyruk meşgul edilmez */
        if (/aday satır da yok/.test(r.denetim.sorun.join(' '))) {
          globalThis.__fpSayac = globalThis.__fpSayac || {};
          globalThis.__fpSayac[is.kod] = (globalThis.__fpSayac[is.kod] || 0) + 1;
          if (globalThis.__fpSayac[is.kod] >= 2 && !(d.fonlar[is.kod] && Object.keys(d.fonlar[is.kod].donemler || {}).length)) d.basarisiz[is.kod] = { sebep: 'hisse tablosu ayrıştırılamıyor (görüntü gömülü olabilir)', tarih: bugun };   /* §429n */
        }
        await uyku(400); continue;
      }
      const donemPdf = r.baslik.donem;   /* PDF 'Temmuz-2026' başlığı — asıl kaynak */
      if (donemPdf && is.donem && donemPdf !== is.donem) hata.push(is.kod + ': liste dönemi ' + is.donem + ' ≠ PDF ' + donemPdf + ' (PDF alındı)');
      const donemK = donemPdf || is.donem;
      if (!donemK) { hata.push(is.kod + ' idx' + is.index + ': dönem çözülemedi · belge başı: "' + txt.replace(/\s+/g, ' ').trim().slice(0, 100) + '"'); await uyku(400); continue; }
      if (r.baslik.kod && !/^[IVX]+$/.test(r.baslik.kod) && r.baslik.kod !== is.kod && !(d.evren[is.kod] && d.evren[is.kod].kapKod === r.baslik.kod)) { hata.push(is.kod + ': PDF başlığı ' + r.baslik.kod + ' — atlandı'); await uyku(400); continue; }   /* §429r: Roma rakamı ('II-PERFORMANS') fon kodu değildir */
      const kirp = o => { const out = {}; Object.keys(o || {}).forEach(k => { out[k] = { deger: Math.round(o[k].deger) }; }); return out; };
      const F = d.fonlar[is.kod] || (d.fonlar[is.kod] = { ad: d.evren[is.kod] ? d.evren[is.kod].ad : is.kod, donemler: {} });
      F.ad = r.baslik.ad || F.ad;
      F.donemler[donemK] = {
        baslik: r.baslik,
        hisse: r.hisse.map(h => ({ kod: h.kod, agirlik: h.agirlik, deger: h.deger, nominal: h.nominal })),
        hisseToplam: r.hisseToplam,
        islem: { alis: kirp(r.islem.alis), satis: kirp(r.islem.satis) },   /* §431 sıkılaştırma (bu tabana): işlem sayacı/nominal atılır */
        varlik: r.varlik || null,   /* §434: kategori bazlı FTD % + _portfoyDegeriYuzde/_hazirDeger/_alacak/_borc */
        diger: (r.diger || []).map(x => ({ kod: x.kod, kategori: x.kategori, agirlik: x.agirlik, deger: x.deger })),
        kaynak: { index: is.index, objId: obj, yayin: is.yayin, islendi: bugun, ek: objler.length, metinUz: txt.length, islemIz: r.islem && r.islem._iz }   /* §434g teşhis izi */
      };
      { const F2 = d.fonlar[is.kod]; const dk = Object.keys(F2.donemler).sort(); dk.slice(0, Math.max(0, dk.length - 6)).forEach(x => delete F2.donemler[x]); }   /* §431 budama: son 6 dönem */
      yazildi++; await uyku(500);
    } catch (e) { hata.push(is.kod + ' ' + is.donem + ': ' + String(e.message || e).slice(0, 460)); await uyku(400); }   /* §429g: tanılı mesaj (belge başı örneği) kesilmesin */
  }
  try { await fs.rm(tmp, { recursive: true, force: true }); } catch (e) {}
  d.guncelleme = bugun; d.yol = yol; d.pencereGun = pencereGun;
  d._yontem = 'KAP Portföy Dağılım Raporu (aylık PDF) → pdftotext -layout → fonportfoy-pdf.mjs. Ağırlık = FTD% (fon toplam değerine göre), kod bazında netlenmiş (T+2 negatif satırlar dahil). islem = ay içi alış/satış toplamları (₺, nominal). Denetimden geçmeyen rapor yazılmaz.';
  await yaz(dosya, d);
  const fonSay = Object.keys(d.fonlar).length, donemSay = Object.values(d.fonlar).reduce((a, f) => a + Object.keys(f.donemler || {}).length, 0);
  raporlar.push('### Fon portföy dağılımı (§429) — ' + (yazildi ? '✓ ' : '⏭ ') + yazildi + ' rapor işlendi · evren ' + evrenKod.length + ' fon (oto +' + otoN + ') · depo ' + fonSay + ' fon / ' + donemSay + ' dönem · KAP yolu: ' + yol + ' · pencere ' + pencereGun + ' gün' + (Object.keys(d.basarisiz||{}).length ? ' · kalıcı istisna ' + Object.keys(d.basarisiz).length + ' fon' : '') +
    (sira.length > yazildi ? '\n- bu turda hedef ' + sira.length + ' (tur tavanı 80; kalan sonraki koşuda)' : '') +
    (dusen.length ? '\n- ⚠ denetimden düşen (yazılmadı): ' + dusen.slice(0, 5).join(' · ') : '') +
    (hata.length ? '\n- ⚠ hata (ilk 3, tanılı): ' + hata.slice(0, 3).join('\n  · ') + (hata.length > 3 ? '\n  …+' + (hata.length - 3) : '') : ''));
  if (yazildi) degisenler.push('fon portföy (' + yazildi + ' rapor)');
}

/* ── §366 MKK VAP — FON NAKIT AKIS (21 Agu, kullanicinin HAR'indan) ─────────
   NE: MKK'nin Veri Analiz Platformu (VAP) resmi SAKLAMA verisi. Bizim §358-360
   TEFAS turevi gunluk/haftalik akisin AYLIK ve RESMI ikizi; ayrica Kiymet Tipi
   kirilimi ve 103 aylik tarihsel derinlik tasiyor.
   MicroStrategy Library API — UC ADIM, SIFRESIZ (anonim "public" kullanicisi):
     1) POST /api/auth/login {"loginMode":1,"username":"public","password":""}
        -> X-MSTR-AuthToken yanit BASLIGINDA (govdede degil)
     2) POST /api/dossiers/{DOSSIER}/instances {"filters":null,"persistViewState":true}
        -> mid
     3) GET  /api/dossiers/{DOSSIER}/instances/{mid}
             ?includeTOC=true&includeShortcutInfo=true&resultFlag=3&checkPrompted=true
   IKI TUZAK (canli olculdu, ikisi de sessiz):
     · X-MSTR-ProjectID BASLIGI olmadan adim 2 -> HTTP 400
     · resultFlag=3 olmadan adim 3 -> HTTP 200 ama `data` BOS gelir
   VERININ YERI (ilk HAR'da bulunamamisti, ikinci HAR cozdu): hucreler
   gvs.items[0].items[] icinde `rv` alanlarinda, SATIR SIRASIYLA duz dizi.
   Ay etiketleri gts.col[0].es[].n icinde ("2025-08" bicimi).
   Hucre sayisi = ay × olcu; DOGRULAMA olarak bu esitlik kontrol edilir.
   DERS: BUYUK JSON'DA VERI YOKSA ANAHTAR ADINI DEGIL DEGER KALIBINI ARA
   (uzun sayi dizisi yerine {"rv":...} tekrari aranarak bulundu). */
async function vapFonAkis() {
  const dosya = 'vap-fon-akis.json';
  const T = 'https://mobil.vap.org.tr/MicroStrategyLibrary/api';
  const PROJE = '0DDECAD844A1A9163420D5A4A08847F1';
  const DOSSIER = '858A455540835F6D2FA8A48B4B836FB6';
  try {
    /* 1) anonim giris */
    const L = await fetch(T + '/auth/login', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ loginMode: 1, username: 'public', password: '' }),
      signal: AbortSignal.timeout(20000) });
    const tok = L.headers.get('x-mstr-authtoken');
    if (!tok) { raporlar.push('### VAP fon akışı (§366) — ⏭ giriş jetonu alınamadı (HTTP ' + L.status + ')'); return; }
    /* §366b ÇEREZ DE GEREKLİ (canlı: Actions'tan HTTP 401, tarayıcıdan 201).
       HAR'da görüldü: Cookie iSession=<değer> ve X-MSTR-AuthToken <değer> AYNI.
       Tarayıcı çerezi kendiliğinden taşır, Node fetch TAŞIMAZ — sunucu hem
       başlığı hem çerezi istiyor. Set-Cookie varsa ondan alınır, yoksa jeton
       iSession olarak kullanılır (ikisi aynı değer).
       DERS: TARAYICIDA ÇALIŞIP SUNUCUDA 401 VERİYORSA İLK BAKILACAK YER ÇEREZ. */
    const sc = (L.headers.getSetCookie ? L.headers.getSetCookie() : [L.headers.get('set-cookie')].filter(Boolean));
    const cerez = (sc && sc.length)
      ? sc.map(c => String(c).split(';')[0]).join('; ')
      : ('iSession=' + tok);
    const H = { 'content-type': 'application/json', 'accept': 'application/json',
      'x-mstr-authtoken': tok, 'x-mstr-projectid': PROJE, 'x-requested-with': 'XMLHttpRequest',
      'cookie': cerez };

    /* 2) ornek olustur */
    const I = await fetch(T + '/dossiers/' + DOSSIER + '/instances', {
      method: 'POST', headers: H, body: JSON.stringify({ filters: null, persistViewState: true }),
      signal: AbortSignal.timeout(25000) });
    if (!I.ok) { raporlar.push('### VAP fon akışı (§366) — ⏭ örnek HTTP ' + I.status); return; }
    const ij = await I.json();
    if (!ij || !ij.mid) { raporlar.push('### VAP fon akışı (§366) — ⏭ mid yok'); return; }

    /* 3) veriyi cek — resultFlag=3 SART */
    const R = await fetch(T + '/dossiers/' + DOSSIER + '/instances/' + ij.mid +
      '?includeTOC=true&includeShortcutInfo=true&resultFlag=3&checkPrompted=true',
      { headers: H, signal: AbortSignal.timeout(30000) });
    if (!R.ok) { raporlar.push('### VAP fon akışı (§366) — ⏭ veri HTTP ' + R.status); return; }
    const j = await R.json();

    /* §366c FON TURU KIRILIMI (21 Agu, kullanici: "fon turu bazinda degisim
       istiyorum"). Dosyada IKI grid var:
         W6DCDACFE1… -> Ay × 3 olcu (TOPLAM, ilk surumun aldigi)
         EA1D66EEC2… -> satirlar Ay × FON TURU, 7 olcu (ISTENEN)
       Ikincisi 14 tur × 12 ay = 168 satir tasiyor ve hucrelerde `pi` KONUM
       bilgisi var (pi.left.ri satir, pi.top.ci sutun) — eslesme TAHMINE degil
       KAYNAGIN KENDI INDEKSINE dayanir.
       Not: gvs.items sayfali gelir (100 satir/blok); tc satir sayisini soyler.
       DERS: BIR SAYFADA TEK GRID VARSAYMA — gsi tasiyan TUM dugumleri tara. */
    const gridler = [];
    const tara = (o) => {
      if (o && typeof o === 'object') {
        if (o.gsi && o.gvs) gridler.push(o);
        for (const v of Object.values(o)) tara(v);
      }
    };
    tara(j.data);
    if (!gridler.length) { raporlar.push('### VAP fon akışı (§366) — ⏭ grid düğümü bulunamadı (yapı değişmiş olabilir)'); return; }
    /* satirlarinda "Fon Türü" olan gridi sec; yoksa ilkine dus */
    const turluGrid = gridler.find(x => (((x.gsi || {}).rows) || []).some(r => /Fon T[üu]r/i.test(r.n || '')));
    const g = turluGrid || gridler[0];
    const turluMu = !!turluGrid;

    const olculer = ((g.gsi || {}).mx || []).map(m => m.n);
    const satirBoyut = ((g.gsi || {}).rows || []).map(r => r.n);
    const sutBoyut = ((g.gsi || {}).cols || []).map(c => c.n);
    const gts = g.gts || {};
    const esAl = (yon, ad) => {
      const b = (gts[yon] || []).find(x => new RegExp(ad, 'i').test(x.n || ''));
      return b ? (b.es || []).map(e => e.n) : [];
    };
    const ayAd = turluMu ? esAl('row', 'Ay') : ((((gts.col || [])[0] || {}).es || []).map(e => e.n));
    const turAd = turluMu ? esAl('row', 'Fon T[üu]r') : [];
    if (!olculer.length || !ayAd.length) {
      raporlar.push('### VAP fon akışı (§366) — ⏭ boyut boş (ölçü ' + olculer.length + ' · ay ' + ayAd.length + ')'); return;
    }

    let seri = [], turSeri = [], D_kismi = false, D_beklenen = 0;
    if (turluMu) {
      /* HUCRE ESLEME `pi` ILE — tahmin yok: pi.left.ri satir indeksi,
         pi.top.ci sutun (olcu) indeksi. Satir indeksi ay×tur duzeninde. */
      const bloklar = ((g.gvs || {}).items || []);
      const kutu = {};
      let esli = 0, esssiz = 0;
      bloklar.forEach(bl => (bl.items || []).forEach(z => {
        const pi = z && z.pi;
        if (!pi || !pi.left || !pi.top) { esssiz++; return; }
        const ri = pi.left.ri, ci = pi.top.ci;
        if (!Number.isFinite(ri) || !Number.isFinite(ci)) { esssiz++; return; }
        /* metin degeri "331,939 M" gibi gelir; rv varsa onu, yoksa metni coz */
        let v = Number.isFinite(z.rv) ? z.rv : null;
        if (v === null && typeof z.v === 'string') {
          /* §366d BİÇİM DÜZELTMESİ (canlı: Katılım fonu 0,4 mlr çıktı, gerçekte
             ~400 mlr — BİN KAT küçük). VAP metni İNGİLİZ biçimi kullanıyor:
             "331,939 M" → virgül BİNLİK ayracı, nokta ondalık. Ben Türkçe
             sanıp virgülü ondalığa çevirmiştim.
             DERS: SAYI BİÇİMİNİ DİLE GÖRE VARSAYMA — büyüklük testiyle doğrula
             (bir fon türü milyar mertebesinde olmalı, milyon değil). */
          const ham = z.v.replace(/\s/g, '');
          const m = ham.match(/^(-?[\d,]+(?:\.\d+)?)([MKB])?$/i);
          if (m) {
            const n = parseFloat(m[1].replace(/,/g, ''));   /* virgül = binlik, at */
            const carp = { 'K': 1e3, 'M': 1e6, 'B': 1e9 }[(m[2] || '').toUpperCase()] || 1;
            if (isFinite(n)) v = n * carp;
          }
        }
        kutu[ri + '|' + ci] = v;
        esli++;
      }));
      const nTur = turAd.length || 1;
      ayAd.forEach((ay, ai) => turAd.forEach((tur, ti) => {
        const ri = ai * nTur + ti;
        const k = { ay, tur };
        let dolu = 0;
        olculer.forEach((ad, ci) => { const v = kutu[ri + '|' + ci]; k[ad] = v; if (Number.isFinite(v)) dolu++; });
        if (dolu) turSeri.push(k);
      }));
      /* §366d KISMİ VERİ UYARISI: gvs.items SAYFALI gelir (blok başına ~100
         satır) ve rw.row.tc gerçek satır sayısını söyler. Eksikse dosyaya
         `kismi:true` yazılır ve rapor bunu SÖYLER — tam sanılıp üzerine
         yorum kurulmasın. */
      const beklenenSatir = ((g.rw || {}).row || {}).tc || (ayAd.length * turAd.length);
      const kismi = turSeri.length < beklenenSatir;
      D_kismi = kismi; D_beklenen = beklenenSatir;
      raporlar.push('- §366c tür kırılımı: ' + turAd.length + ' tür × ' + ayAd.length + ' ay · ' +
        turSeri.length + '/' + beklenenSatir + ' satır · ' + esli + ' hücre eşlendi' +
        (esssiz ? (' · ' + esssiz + ' konumsuz') : '') +
        (kismi ? ' · ⚠ KISMİ (yanıt sayfalı; ilk blok alındı)' : ''));
    } else {
      const hucre = ((((g.gvs || {}).items || [])[0] || {}).items || []).map(z => (z && Number.isFinite(z.rv)) ? z.rv : null);
      if (hucre.length !== ayAd.length * olculer.length) {
        raporlar.push('### VAP fon akışı (§366) — ✗ hücre sayısı tutmadı: ' + hucre.length +
          ' ≠ ' + ayAd.length + '×' + olculer.length + ' — sıralama varsayımı bozuldu, YAZILMADI');
        denetimDustu = true; return;
      }
      seri = ayAd.map((ay, i) => {
        const k = { ay };
        olculer.forEach((ad, m) => { k[ad] = hucre[i * olculer.length + m]; });
        return k;
      });
    }
    if (turluMu && !turSeri.length) {
      raporlar.push('### VAP fon akışı (§366) — ✗ tür kırılımında hiç hücre eşlenmedi, YAZILMADI');
      denetimDustu = true; return;
    }
    /* §366e RAPOR SATIRI TÜR KIRILIMINDA BOZULMUŞTU (22 Ağu, canlı):
       tür grid'ine geçince `son` = turSeri[0] oluyordu, yani TEK BİR TÜRÜN
       kaydı. Rapor "toplam fon tutarı 181,1 mlr" yazdı — gerçek 10.052 mlr.
       Tür kırılımında son ayın TÜM TÜRLERİ toplanmalı.
       DERS: BİR VERİ YAPISI DEĞİŞİNCE ONU ÖZETLEYEN SATIRI DA GÖZDEN GEÇİR. */
    let son = (seri.length ? seri[seri.length - 1] : {});
    if (turluMu && turSeri.length) {
      const sonAy = ayAd[0];
      const oAy = turSeri.filter(x => x.ay === sonAy);
      son = { ay: sonAy };
      olculer.forEach(o => {
        const t = oAy.reduce((a, x) => a + (Number.isFinite(x[o]) ? x[o] : 0), 0);
        if (t) son[o] = t;
      });
      /* net değişim: dönem sonu − dönem başı (aynı satırdan, aynı para) */
      const kS = olculer.find(o => /Dönem Sonu Fon Tutar/i.test(o));
      const kB = olculer.find(o => /Dönem Başı Fon Tutar/i.test(o));
      if (kS && kB && Number.isFinite(son[kS]) && Number.isFinite(son[kB])) son._net = son[kS] - son[kB];
    }
    const D = {
      guncelleme: new Date().toISOString().slice(0, 19) + 'Z',
      kaynak: 'MKK VAP · mobil.vap.org.tr (MicroStrategy Library, anonim erişim)',
      dosya_adi: j.n || 'Fon Nakit Akış',
      _yontem: 'Hücreler gvs.items[0].items[].rv içinde satır sırasıyla düz dizi; ay etiketleri gts.col[0].es[].n. Hücre sayısı = ay × ölçü eşitliği DOĞRULANIR, tutmazsa yazılmaz. Anonim erişim: loginMode 1, kullanıcı "public". X-MSTR-ProjectID başlığı ve resultFlag=3 ŞART.',
      ay_sayisi: ayAd.length, olculer, son_ay: (turluMu ? ayAd[0] : (son.ay || null)),
      satir_boyut: satirBoyut, sutun_boyut: sutBoyut,
      turler: turAd, tur_seri: turSeri,
      tur_kismi: D_kismi, tur_beklenen_satir: D_beklenen,
      seri
    };
    await yaz(dosya, D);
    degisenler.push('VAP fon akışı (' + ayAd.length + ' ay)');
    const mlr = (v) => Number.isFinite(v) ? (v / 1e9).toFixed(1) : '—';
    const degisim = olculer.find(o => /Değişim/i.test(o));
    const tutar = olculer.find(o => /Dönem Sonu Fon Tutar/i.test(o));
    if (turluMu && tutar) {
      const sonAy = ayAd[0];
      const enler = turSeri.filter(x => x.ay === sonAy && Number.isFinite(x[tutar]))
        .sort((a, b) => b[tutar] - a[tutar]).slice(0, 3);
      if (enler.length) raporlar.push('- en büyük türler (' + sonAy + '): ' +
        enler.map(x => x.tur.replace(/ ŞEMSİYE FON[U]?/i, '') + ' ' + (x[tutar] / 1e9).toFixed(0) + ' mlr').join(' · '));
    }
    raporlar.push('### VAP fon akışı (§366) — ✓ ' + ayAd.length + ' ay · son ' + (son.ay || '?') +
      (tutar ? ('\n- toplam fon tutarı: ' + mlr(son[tutar]) + ' mlr ₺') : '') +
      (Number.isFinite(son._net) ? ('\n- son ay net değişimi: ' + mlr(son._net) + ' mlr ₺ (dönem sonu − dönem başı, tüm türler)')
        : (degisim ? ('\n- son ay değişimi: ' + mlr(son[degisim]) + ' mlr ₺') : '')) +
      '\n- ölçüler: ' + olculer.join(' · '));
  } catch (e) {
    raporlar.push('### VAP fon akışı (§366) — ✗ ' + String(e && e.message || e).slice(0, 90));
  }
}

async function gyoNav() {
  const dosya = 'gyo-nav.json';
  const T = 'https://tspbnad.matriksdata.com/api';
  const uyku = (ms) => new Promise(r => setTimeout(r, ms));
  try {
    /* 1) Dönemler — en yeni YAYIMLANMIŞ olan */
    const rp = await fetch(T + '/base/getperiods/all', { signal: AbortSignal.timeout(20000) });
    if (!rp.ok) { raporlar.push('### GYO NAV (§364) — ⏭ dönem listesi HTTP ' + rp.status); return; }
    const donemler = await rp.json();
    const yayin = (Array.isArray(donemler) ? donemler : [])
      .filter(d => d && d.period_isPublished && d.period_code === 'NAD')
      .sort((a, b) => (b.period_orderNo || 0) - (a.period_orderNo || 0));
    if (!yayin.length) { raporlar.push('### GYO NAV (§364) — ⏭ yayımlanmış dönem yok'); return; }
    /* §512 (24 Eki): TSPB 2026/06 dönemini YAYIMLADI ama içi BOŞ (sektör NAD 0, üyelerde rapor yok) → katman
       "hiçbir şirket için veri alınamadı" deyip ERKEN DÖNÜYORDU: güncel fiyat/iskonto da tazelenmiyordu.
       Kural: yayımlanmış dönemler yeniden eskiye denenir; sektör toplamı ("all") DOLU olan ilk dönem kullanılır.
       TSPB yeni dönemi doldurduğu gün katman kendiliğinden ona geçer — kimsenin bir şey yapması gerekmez. */
    let donem = null; const bosDonemler = [];
    for (const p of yayin.slice(0, 4)) {
      try {
        const ra = await fetch(T + '/reports/getmemReport/all/' + p.period_value, { signal: AbortSignal.timeout(20000) });
        const ja = ra.ok ? await ra.json() : null; const a0 = Array.isArray(ja) ? ja[0] : null;
        const ta = a0 && (a0.report_segments || []).find(s => s && s.name === 'Toplam Veriler');
        if (ta && ta.t5 && Number(ta.t5.valueTl) > 0) { donem = String(p.period_value); break; }
        bosDonemler.push(String(p.period_value));
      } catch (e) { bosDonemler.push(String(p.period_value) + '?'); }
      await uyku(300);
    }
    if (!donem) { raporlar.push('### GYO NAV (§364) — ⏭ son ' + bosDonemler.length + ' yayımlanmış dönemin hepsi boş (' + bosDonemler.join(', ') + ')'); return; }
    if (bosDonemler.length) raporlar.push('- §512 GYO NAV: en yeni yayımlanmış dönem(ler) henüz boş (' + bosDonemler.join(', ') + ') → dolu olan ' + donem + ' kullanıldı; TSPB doldurunca kendiliğinden geçilir');

    /* 2) Üyeler */
    const rm = await fetch(T + '/base/getmembers/all', { signal: AbortSignal.timeout(20000) });
    if (!rm.ok) { raporlar.push('### GYO NAV (§364) — ⏭ üye listesi HTTP ' + rm.status); return; }
    const uyeler = (await rm.json() || []).filter(m => m && m.member_uid && m.member_symbol);

    /* 3) Şirket bazlı NAD — seri, TSPB'yi zorlamadan */
    const kayitlar = {};
    let bosBildirim = 0, dusen = 0;
    for (const m of uyeler) {
      try {
        const rr = await fetch(T + '/reports/getmemReport/' + m.member_uid + '/' + donem, { signal: AbortSignal.timeout(20000) });
        if (!rr.ok) { dusen++; await uyku(250); continue; }
        const j = await rr.json();
        const r0 = Array.isArray(j) ? j[0] : null;
        const tot = r0 && (r0.report_segments || []).find(s => s && s.name === 'Toplam Veriler');
        if (!tot) { dusen++; await uyku(250); continue; }
        const say = (o) => (o && Number.isFinite(o.valueTl)) ? o.valueTl : null;
        const nad = say(tot.t5), payNad = say(tot.t7);
        /* Bildirim göndermemiş şirket her alanı 0 döndürür — kayıt YAZILMAZ */
        if (!Number.isFinite(nad) || nad === 0 || !Number.isFinite(payNad) || payNad === 0) { bosBildirim++; await uyku(250); continue; }
        kayitlar[m.member_symbol] = {
          ad: m.member_name || null, uid: m.member_uid,
          portfoy: say(tot.t1), finBorc: say(tot.t2), borc: say(tot.t4),
          nad, sermaye: say(tot.t6), payNad,
          iskonto: say(tot.t8), borcluluk: say(tot.t9)
        };
        await uyku(250);
      } catch (e) { dusen++; await uyku(400); }
    }
    const n = Object.keys(kayitlar).length;
    if (!n) { raporlar.push('### GYO NAV (§364) — ⏭ hiçbir şirket için veri alınamadı (dönem ' + donem + ')'); return; }

    /* ── §364b FİYAT DA BURADA ÇEKİLİR (kullanıcı: "fiyat yok diyor") ────────
       Panel `CANLI_FIYAT`i yalnız multiple.json evreninden (141 hisse)
       dolduruyor ve GYO'ların çoğu orada YOK — 45 GYO'dan sadece 5'i vardı
       (AVPGY, EKGYO, KZBGY, RGYAS, SNGYO). Bu yüzden "güncel iskonto" sütunu
       boş kalıyordu.
       Fiyatı NAD ile AYNI YERDE çekmek doğrusu: veri ve fiyatı aynı damgayla
       eşleşir, panel ayrı kaynak aramaz. Yahoo toplu uç zaten var (§176).
       DERS: TÜRETİLMİŞ BİR ORAN GÖSTERECEKSEN İKİ BACAĞINI DA SEN GETİR. */
    try {
      const kodlar = Object.keys(kayitlar);
      const fh = await yahooFiyat(kodlar, '.IS');
      let fiyatli = 0;
      for (const k of kodlar) {
        const f = fh && fh[k];
        if (f && Number.isFinite(f.fiyat) && f.fiyat > 0) {
          kayitlar[k].fiyat = f.fiyat;
          kayitlar[k].fiyat_tarih = f.tarih || null;
          const pn = kayitlar[k].payNad;
          if (Number.isFinite(pn) && pn > 0) kayitlar[k].guncelIskonto = +(((f.fiyat / pn) - 1) * 100).toFixed(1);
          fiyatli++;
        }
      }
      raporlar.push('- §364b fiyat: ' + fiyatli + '/' + kodlar.length + ' GYO için canlı fiyat eklendi (güncel iskonto hesaplandı)');
    } catch (e) {
      raporlar.push('- §364b fiyat alınamadı: ' + String(e && e.message || e).slice(0, 50) + ' — TSPB oranı tek başına gösterilir');
    }

    /* Sektör toplamı (TSPB'nin kendi "Tümü" kaydı) */
    let sektor = null;
    try {
      const rt = await fetch(T + '/reports/getmemReport/all/' + donem, { signal: AbortSignal.timeout(20000) });
      const jt = await rt.json();
      const t0 = (Array.isArray(jt) ? jt[0] : null);
      const tt = t0 && (t0.report_segments || []).find(s => s && s.name === 'Toplam Veriler');
      if (tt) sektor = { nad: tt.t5 && tt.t5.valueTl, payNad: tt.t7 && tt.t7.valueTl,
        iskonto: tt.t8 && tt.t8.valueTl, borcluluk: tt.t9 && tt.t9.valueTl };
    } catch (e) {}

    /* §540b: özet satırı TSPB dönem sonu oranından ve NAD ≤ 0 şirketlerden kuruluyordu ("en iskontolu %-1678" DZGYO, NAD negatif;
       "en primli %1032"). Artık canlı fiyatlı güncel iskonto, yalnız NAD > 0. */
    const isk = Object.values(kayitlar).filter(x => x.nad > 0).map(x => Number.isFinite(x.guncelIskonto) ? x.guncelIskonto : x.iskonto).filter(Number.isFinite).sort((a, b) => a - b);
    const D = {
      guncelleme: new Date().toISOString().slice(0, 19) + 'Z',
      donem, donem_etiket: donem.slice(0, 4) + '/' + donem.slice(4),
      kaynak: 'TSPB · tspbnad.matriksdata.com (resmî NAD tablosu)',
      _yontem: 'İskonto = (piyasa değeri / NAD) − 1, TSPB tanımı; DÖNEM SONU piyasa değerine göre. Panel canlı fiyatla `fiyat/payNad − 1` ile GÜNCEL iskontoyu ayrıca hesaplar. Bildirim göndermemiş şirket kaydı YAZILMAZ (sıfır iskonto gibi görünmesin).',
      sirket_sayisi: n, bos_bildirim: bosBildirim, sektor,
      fiyatli: Object.values(kayitlar).filter(x => Number.isFinite(x.fiyat)).length,
      sirketler: kayitlar
    };
    await yaz(dosya, D);
    degisenler.push('GYO NAV (' + n + ' şirket)');
    raporlar.push('### GYO NAV (§364) — ✓ ' + n + ' şirket · dönem ' + D.donem_etiket +
      (sektor && Number.isFinite(sektor.iskonto) ? ('\n- sektör iskontosu: %' + sektor.iskonto.toFixed(1) + ' · borçluluk %' + (sektor.borcluluk || 0).toFixed(1)) : '') +
      (isk.length ? ('\n- en iskontolu: %' + isk[0].toFixed(1) + ' · medyan %' + isk[Math.floor(isk.length / 2)].toFixed(1) + ' · en primli %' + isk[isk.length - 1].toFixed(1)) : '') +
      (bosBildirim ? ('\n- ' + bosBildirim + ' şirket o dönem bildirim göndermemiş (kayıt yazılmadı)') : '') +
      (dusen ? ('\n- ' + dusen + ' istek düştü') : ''));
  } catch (e) {
    raporlar.push('### GYO NAV (§364) — ✗ ' + String(e && e.message || e).slice(0, 90));
  }
}

/* ── §382 KOŞU-İÇİ DÖNEM LİSTESİ ÖNBELLEĞİ (22 Ağu, canlı fail) ────────────
   İlk arşiv koşusunda 3/3 "dönem yok" çıktı — AMA aynı koşuda faktör evreni
   (§361) 43/245 ile sorunsuz çalışıyordu. Yani uç sağlamdı; sorun İKİ MODÜLÜN
   AYNI LİSTEYİ AYRI AYRI ÇEKMESİYDİ. Faktör önce koşup KAP'ı yoruyor, arşiv
   sınıra takılıyordu.
   Bu Map, tek koşu boyunca paylaşılır: aynı şirketin dönem listesi ikinci kez
   istendiğinde KAP'a GİDİLMEZ. Ayrıca yil parametresi normalize edilir —
   arşiv yil=5 istiyordu, 15 çeyrek için yil=4 fazlasıyla yeter (4×4=16).
   DERS: AYNI KOŞUDA İKİ MODÜL AYNI UCU ÇAĞIRIYORSA ARALARINDA ÖNBELLEK OLMALI. */
const _DONEM_BELLEK = new Map();
async function kapDonemler(kod, yil) {
  const y = Math.min(4, Math.max(1, yil || 4));
  const ank = kod + '|' + y;
  if (_DONEM_BELLEK.has(ank)) return _DONEM_BELLEK.get(ank);
  let sonuc = { ok: false, donemler: [] };
  /* §446 (17 Eyl canlı): köprü (Vercel → KAP) günlerdir "fetch failed" — KAP Vercel'i
     reddediyor (§338b), arşiv +0 çeyrekte kaldı, ceza sayacı öncelikli ASELS'i sona attı.
     Önce köprü (önbellekli, hafif), düşerse DOĞRUDAN KAP: member/filter → mkkMemberOid →
     listCompanyExcelMembers/<oid>/<yıl>/T (kap.js donemler mantığının birebir taşınmışı;
     yıllar SIRAYLA, 250 ms aralık — §338b dersi). */
  try {
    const r = await fetch('https://ktpanel.vercel.app/api/kap?mod=donemler&kod=' + kod + '&yil=' + y, { signal: AbortSignal.timeout(25000) });
    const j = await r.json();
    if (j && j.ok && (j.donemler || []).length) sonuc = j;
  } catch (e) { sonuc = { ok: false, donemler: [], err: 'köprü: ' + String(e && e.message || e).slice(0, 30) }; }
  if (!sonuc.ok) {
    const UA2 = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36';
    const BAS = { 'user-agent': UA2, 'accept': 'application/json', 'referer': 'https://www.kap.org.tr/tr/bildirim-sorgu' };
    const uyku2 = ms => new Promise(r => setTimeout(r, ms));
    try {
      const mr = await fetch('https://www.kap.org.tr/tr/api/member/filter/' + encodeURIComponent(kod), { headers: BAS, signal: AbortSignal.timeout(15000) });
      const mj = mr.ok ? await mr.json() : null; const uye = Array.isArray(mj) ? mj[0] : null;
      if (uye && uye.mkkMemberOid) {
        const buYil = new Date().getFullYear(); const donemler = [];
        for (let i = 0; i < y; i++) {
          const yy = buYil - i; const u = 'https://www.kap.org.tr/tr/api/financialTable/listCompanyExcelMembers/' + uye.mkkMemberOid + '/' + yy + '/T';
          for (let deneme = 0; deneme < 2; deneme++) {
            try { const r = await fetch(u, { headers: Object.assign({}, BAS, { referer: 'https://www.kap.org.tr/tr/sirket-finansal-bilgileri/' + uye.mkkMemberOid }), signal: AbortSignal.timeout(15000) });
              if (!r.ok) throw new Error('HTTP ' + r.status); const arr = await r.json();
              (Array.isArray(arr) ? arr : []).forEach(x => { if (x && x.disclosureIndex) donemler.push({ yil: +x.year, donem: +x.period, id: String(x.disclosureIndex), kod: x.stockCode || kod }); }); break; }
            catch (e) { if (deneme === 1) throw e; await uyku2(600); }
          }
          await uyku2(250);
        }
        const enIyi = new Map(); donemler.forEach(d => { const k = d.yil + '|' + d.donem; const v = enIyi.get(k); if (!v || +d.id > +v.id) enIyi.set(k, d); });
        const liste = [...enIyi.values()].sort((a, b) => (b.yil - a.yil) || (b.donem - a.donem));
        if (liste.length) sonuc = { ok: true, kod, oid: uye.mkkMemberOid, unvan: uye.title || null, donemler: liste, yol: 'doğrudan' };
        else sonuc = { ok: false, donemler: [], err: 'doğrudan: liste boş' };
      } else sonuc = { ok: false, donemler: [], err: 'doğrudan: member/filter boş' };
    } catch (e) { sonuc = { ok: false, donemler: [], err: 'doğrudan: ' + String(e && e.message || e).slice(0, 40) }; }
    /* §549c: "fetch failed" ağ kopması (KAP kısa süreli kesiyor) — 6 sn sonra tek tekrar; yine düşerse arşiv takvim kimliğine döner */
    if (!sonuc.ok && /fetch failed|timeout|aborted/i.test(sonuc.err || '') && !kapDonemler._tekrar) {
      kapDonemler._tekrar = true; await new Promise(r => setTimeout(r, 6000)); _DONEM_BELLEK.delete(ank);
      try { const s2 = await kapDonemler(kod, yil); if (s2 && s2.ok) sonuc = s2; } catch (e) {} kapDonemler._tekrar = false; }
  }
  _DONEM_BELLEK.set(ank, sonuc);
  return sonuc;
}

/* ── §381 KAP HAM ARŞİVİ — 15 ÇEYREK, ŞİRKET BAŞINA TEK DOSYA (22 Ağu) ─────
   KULLANICI KARARI: ham tablo saklansın (ileride tüm kalemler lazım olacak),
   şirket başına EN FAZLA 15 ÇEYREK.
   NEDEN ŞİRKET BAŞINA TEK DOSYA: panel şu an bir şirketin 15 çeyreği için
   KAP'a 15 AYRI İSTEK atıyor. Arşivle bu TEK istek olur ve KAP'a değil
   GitHub'a gider — hız sınırı tamamen konu dışı kalır.
   BOYUT (ölçüldü): bildirim başına ~23 KB → 245 şirket × 15 çeyrek ≈ 86 MB
   düz, ~3-20 MB gzip. GitHub sınırlarının (repo 1 GB, dosya 100 MB) rahat
   altında. Git geçmişi şişmez çünkü YAYIMLANMIŞ BİLDİRİM DEĞİŞMEZ — dosyaya
   yalnız yeni çeyrek eklenir, eskiler dokunulmaz.
   KADEMELİ: her koşuda az sayıda şirket; arşivde zaten olan dönem ATLANIR.
   Bu yüzden ilk turlar yavaş, sonra neredeyse bedava. */
/* ── §437 KAP HAM TABLO AYRIŞTIRICISI (tazele içinde, ayrı dosya yok) ─────────────────────
   ktpanel/api/kap.js mod=ham'ın §340d-e yönteminin birebir taşınmışı:
   KAP bildirimi GWT ile üretilir; tablolar tbl_general_role_XXXXXX sınıfıyla,
   veri satırları data-input-row konumlarıyla dilimlenir; XBRL kodu
   taxonomy-field-name, Türkçe etiket content-tr, sayılar Türk biçimi.
   İç içe tablo sorunu KONUM dilimlemesiyle aşılır (§340d dersi).
   Çıktı /api/kap?mod=ham ile AYNI şema: { ok, birim:{ad,carpan}, tablolar:[{ad,satir,satirlar:[{xbrl,etiket,degerler}]}] }.
   NEDEN BURADA: §381 arşivi Vercel köprüsü üzerinden 2 şirket/koşu dolduruyordu
   (hız sınırı köprüde); fon zinciri Actions'ın KAP'a doğrudan 300+ istek/koşu
   atabildiğini kanıtladı. Aynı sayfa, aynı ayrıştırma — sadece yol değişti. */
const BIN_KALIP = /^-?\(?\d{1,3}(\.\d{3})*\)?$/;
const sayiCoz = (t) => {
  const ham = String(t).trim();
  if (!BIN_KALIP.test(ham)) return null;
  const eksi = /^\(/.test(ham) || /^-/.test(ham);
  const n = parseFloat(ham.replace(/[()\-]/g, '').replace(/\./g, ''));
  if (!isFinite(n)) return null;
  if (ham.indexOf('.') < 0 && n < 1000) return null;
  return eksi ? -n : n;
};
function birimBul(h) {
  const bas = h.slice(0, 400000);
  if (/Bin\s*T[Ll]|BinTL|\(Bin\s*TL\)|bin\s*Türk\s*Lirası/i.test(bas)) return { ad: 'bin TL', carpan: 1000 };
  if (/Milyon\s*T[Ll]|\(Milyon\s*TL\)/i.test(bas)) return { ad: 'milyon TL', carpan: 1e6 };
  if (/Tam\s*T[Ll]|tutarlar\s+Türk\s+Lirası|TL\s*olarak\s+gösteril/i.test(bas)) return { ad: 'TL', carpan: 1 };
  return { ad: 'belirsiz', carpan: null };
}
const ROL_AD = { '210015': 'Bilanço', '210000': 'Bilanço', '310000': 'Gelir Tablosu', '320000': 'Gelir Tablosu',
  '410000': 'Diğer Kapsamlı Gelir', '420000': 'Diğer Kapsamlı Gelir', '520003': 'Nakit Akış', '520000': 'Nakit Akış',
  '510000': 'Nakit Akış', '610000': 'Özkaynak Değişim', '620000': 'Özkaynak Değişim' };
function kapHamAyristir(htmlHam) {
  const KACIS = { '\\u003c': '<', '\\u003e': '>', '\\"': '"', '\\n': ' ' };
  const h = String(htmlHam || '').replace(/\\u003[ce]|\\"|\\n/g, m => KACIS[m] || m);
  const birim = birimBul(h);
  const tabloBas = [...h.matchAll(/tbl_general_role_(\d+)/g)].map(m => ({ rol: m[1], poz: m.index }));
  const satirBas = [...h.matchAll(/<tr[^>]*class="[^"]*data-input-row[^"]*"/g)].map(m => ({ poz: m.index }));
  const metinCoz = (parca, rx) => { const m = parca.match(rx); return m ? m[1].replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim() : null; };
  const gruplar = new Map();
  for (let k = 0; k < satirBas.length; k++) {
    const bas = satirBas[k].poz;
    const son = (k + 1 < satirBas.length) ? satirBas[k + 1].poz : Math.min(h.length, bas + 20000);
    const parca = h.slice(bas, son);
    let rol = null;
    for (let t = tabloBas.length - 1; t >= 0; t--) { if (tabloBas[t].poz < bas) { rol = tabloBas[t].rol; break; } }
    const ad = ROL_AD[rol] || ('Tablo ' + (rol || '?'));
    const xbrlHam = metinCoz(parca, /taxonomy-field-name"[^>]*>([^<]{4,200})</);
    const xbrl = xbrlHam ? xbrlHam.split('|')[0].trim() : null;
    const etiket = metinCoz(parca, /content-tr"[^>]*>([^<]{1,160})</);
    const sayilar = [];
    for (const sm of parca.matchAll(/>\s*(\(?-?[\d]{1,3}(?:\.\d{3})*(?:,\d+)?\)?)\s*</g)) { const v = sayiCoz(sm[1]); if (v !== null) sayilar.push(v); }
    if (!xbrl && !etiket) continue;
    if (!gruplar.has(ad)) gruplar.set(ad, []);
    gruplar.get(ad).push({ xbrl, etiket, degerler: sayilar.slice(0, 6) });
  }
  const tablolar = [...gruplar.entries()].map(([ad, satirlar]) => {
    const gorulen = new Set(); const temiz = [];
    for (const r of satirlar) {
      if (!r.degerler || !r.degerler.length) continue;
      const imza = (r.xbrl || r.etiket) + '|' + (r.degerler || []).join(',');
      if (gorulen.has(imza)) continue; gorulen.add(imza); temiz.push(r);
    }
    return { ad, satir: temiz.length, satirlar: temiz };
  }).filter(t => t.satir >= 3);
  let birim2 = birim;
  const bm = h.match(/Sunum Para Birimi<\/td>\s*<td[^>]*>([^<]{2,30})</);
  if (bm) { const bt = bm[1].replace(/\s+/g, ' ').trim(); const carpan = /1\.?000\.?000|milyon/i.test(bt) ? 1e6 : (/1\.?000|bin/i.test(bt) ? 1000 : 1); birim2 = { ad: bt, carpan }; }
  return { ok: tablolar.length > 0, birim: birim2, tabloSayisi: tablolar.length, tablolar };
}

async function kapArsiv() {
  const KLASOR = 'kap-arsiv';
  /* §383b PARTİ 2 + UZUN BEKLEME: faktör evreni (§361) aynı koşuda KAP'ı
     zaten kullanıyor; arşiv arkasından gelince "fetch failed" alıyordu.
     Artık faktör ham tabloları arşive KENDİSİ yazıyor (§383), bu modül
     yalnız ESKİ çeyrekleri tamamlıyor — az sayıda, yavaş, sabırlı. */
  /* §437 HIZLI MOD (--katman=kaparsiv ya da hepsi): ham sayfa DOĞRUDAN KAP'tan
     çekilir ve scripts/kap-ham.mjs ile Actions içinde ayrıştırılır — Vercel köprüsü
     (hız sınırının asıl yeri) devre dışı. Parti 2 -> 25, şirket başına 15 çeyrek,
     600 ms aralık. Fon zinciri aynı yoldan 300+ istek/koşu attı, kesinti görülmedi.
     Dönem LİSTESİ hâlâ köprüden (hafif, 12 saat önbellekli). */
  const HIZLI = KSET.has('kaparsiv');   /* §437b: parti/tempo yalnız açık istekle büyür */
  const DOGRUDAN = true;   /* §446: ham sayfa HER ZAMAN doğrudan KAP'tan (köprü KAP tarafından reddediliyor); tempo yavaş kalır */
  const hamAyristir = kapHamAyristir;   /* §437: ayrıştırıcı bu dosyanın içinde (kullanıcı: ayrı .mjs yok) */
  const PARTI = (HIZLI && hamAyristir) ? 25 : 2;
  const CEYREK_TAVAN = 15;
  const TABAN = 'https://ktpanel.vercel.app/api/kap';
  const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36';
  const uyku = (ms) => new Promise(r => setTimeout(r, ms));
  let uyeler = [];
  try { const eu = await oku('endeks-uyeler.json'); uyeler = ((eu.uyeler || {}).XKTUM || []).slice(); } catch (e) {}
  if (!uyeler.length) { raporlar.push('### KAP arşivi (§381) — ⏭ XKTUM listesi yok'); return; }

  try { await fs.mkdir(path.join(KOK, KLASOR), { recursive: true }); } catch (e) {}
  /* hangi şirketler eksik: dosyası yok ya da 15'ten az çeyrek içeriyor */
  const durum = [];
  for (const kod of uyeler) {
    let n = 0;
    try { const d = JSON.parse(await fs.readFile(path.join(KOK, KLASOR, kod + '.json'), 'utf8'));
      n = Object.keys(d.donemler || {}).length; } catch (e) { n = 0; }
    durum.push({ kod, n, enYeni: null });
  }
  /* §500 (23 Eki) YENİ DÖNEM ÖNCELİĞİ: EREGL 3Ç26'yı 22 Eki'de açıkladı ama arşiv yavaş yolda GLRMK/EFOR'u (eski çeyrek
     tamamlama) işledi; 15 çeyreği dolmuş bir şirkete ise YENİ çeyrek HİÇ eklenmiyordu (n < 15 süzgeci). bist-takvim.json
     `gerceklesen` (bu sezon açıklayanlar) + `donem` (3Ç26 → 2026/3): arşivin en yeni dönemi bundan eskiyse şirket EN ÖNE
     alınır ve tavanı aşsa da işlenir (en eski çeyrek düşülür). */
  let takvimDonem = null, takvimGercek = {}, takvimBildirim = {};
  try { const bt = await oku('bist-takvim.json'); const m = String(bt.donem || '').match(/^([1-4])Ç(\d{2})$/); if (m) takvimDonem = { y: 2000 + +m[2], q: +m[1] }; takvimGercek = bt.gerceklesen || {}; takvimBildirim = bt.bildirim || {}; } catch (e) {}   /* §549c: bildirim kimlikleri */
  for (const x of durum) { try { const d = JSON.parse(await fs.readFile(path.join(KOK, KLASOR, x.kod + '.json'), 'utf8'));
    const ks = Object.keys(d.donemler || {}).filter(k => /^\d{4}\/[1-4]$/.test(k)).sort((a, b) => { const [a1, a2] = a.split('/').map(Number), [b1, b2] = b.split('/').map(Number); return (b1 - a1) || (b2 - a2); });
    if (ks.length) { const [y, q] = ks[0].split('/').map(Number); x.enYeni = { y, q }; } } catch (e) {} }
  const yeniBekliyor = (x) => !!(takvimDonem && takvimGercek[x.kod] && (!x.enYeni || x.enYeni.y * 10 + x.enYeni.q < takvimDonem.y * 10 + takvimDonem.q));
  /* §381b ÖNCELİK SIRASI: tüm evren ~69 koşu-günü sürüyor. Alfabetik ya da
     salt "en eksik" sırası, en çok bakılan şirketleri en sona atabilir.
     Öncelik: (1) bilanço tetiğindekiler — yeni bildirim geldi, taze veri
     değerli; (2) XK030 (en büyük 30, en çok bakılan); (3) XK100; (4) kalanlar.
     Her grup içinde en eksik olan önce. Böylece arşiv "işe yarar" sırayla
     dolar; tam tur bitmeden de kullanılabilir hale gelir. */
  const yeniSet = new Set(durum.filter(yeniBekliyor).map(x => x.kod));
  let tetik = [], xk030 = [], xk100 = [];
  try { const bt = await oku('bilanco-tetik.json'); tetik = bt.kodlar || []; } catch (e) {}
  try { const eu = await oku('endeks-uyeler.json'); xk030 = (eu.uyeler || {}).XK030 || []; xk100 = (eu.uyeler || {}).XK100 || []; } catch (e) {}
  /* §444c KULLANICI ÖNCELİĞİ: ktpanel/kap-arsiv-oncelik.json = ["ASELS", ...] — bu kodlar her
     şeyin önünde (0), yavaş yolda bile ilk 2 slotu alır. Kullanıcı "ASELS arşivde yok" dedi;
     dosyaya yazar, sıradaki koşu getirir. Dosya yoksa/bozuksa sessizce boş. */
  let elleOncelik = []; try { const eo = await oku('kap-arsiv-oncelik.json'); elleOncelik = (Array.isArray(eo) ? eo : (eo.kodlar || [])).map(x => String(x).toUpperCase()); } catch (e) {}
  const oncelik = (k) => (yeniSet.has(k) ? -2 : (elleOncelik.includes(k) ? -1 : (tetik.includes(k) ? 0 : (xk030.includes(k) ? 1 : (xk100.includes(k) ? 2 : 3)))));
  /* §382b BELLEKTE OLANI TERCİH ET: faktör evreni (§361) bu koşuda zaten
     bazı şirketlerin dönem listesini çekti. Arşiv onları seçerse liste
     BEDAVA gelir — yeni KAP isteği yok. Aynı öncelik grubunda, listesi
     bellekte olan şirket öne alınır. */
  const bellekte = (k) => (_DONEM_BELLEK.has(k+'|4') || _DONEM_BELLEK.has(k+'|2')) ? 0 : 1;
  /* §384 BAŞARISIZLIK SAYACI (22 Ağu, canlı): CITAS ve DENGE her koşuda
     öncelik listesinin başına çıkıp düşüyor ve SIRAYI TIKIYOR — arşiv üç
     koşudur ilerleyemedi. Üst üste düşen şirket sıranın SONUNA atılır;
     3 başarısızlıktan sonra bir süre hiç denenmez.
     Sayaç dosyada tutulur (kap-arsiv/_durum.json) — koşular arası hafıza.
     DERS: SÜREKLİ DÜŞEN BİR KAYIT KUYRUĞU KİLİTLER — geri çekilme şart. */
  let SAY = {};
  try { SAY = JSON.parse(await fs.readFile(path.join(KOK, KLASOR, '_durum.json'), 'utf8')) || {}; } catch (e) {}
  const simdi = Date.now();
  const cezali = (k) => {
    const r = SAY[k];
    if (!r) return 0;
    if (r.n >= 3 && r.son && (simdi - r.son) < 6 * 3600 * 1000) return 2;   /* 6 saat dinlendir */
    if (elleOncelik.includes(k)) return 0;   /* §446: elle öncelikli kod iki başarısızlıkla sona atılmaz */
    return r.n >= 2 ? 1 : 0;
  };
  const siraTum = durum.filter(x => x.n < CEYREK_TAVAN || yeniBekliyor(x))
    .sort((a, b) => (cezali(a.kod) - cezali(b.kod)) || (oncelik(a.kod) - oncelik(b.kod)) || (bellekte(a.kod) - bellekte(b.kod)) || (a.n - b.n));
  /* §500b: yeni dönem bekleyenler PARTİ sınırına takılmaz (sezonda günde birkaç şirket — EREGL 2'li partide EBEBK/ISDMR'nin
     arkasında kaldı); her biri en fazla birkaç istek. Kalan slotlar eski düzenle. Süre bütçesi yine geçerli. */
  const sira = siraTum.filter(x => yeniSet.has(x.kod)).slice(0, 12).concat(siraTum.filter(x => !yeniSet.has(x.kod)).slice(0, PARTI));
  if (!sira.length) {
    raporlar.push('### KAP arşivi (§381) — ✓ TAM: ' + uyeler.length + ' şirket × ' + CEYREK_TAVAN + ' çeyrek');
    return;
  }
  if (!HIZLI) await new Promise(r => setTimeout(r, 30000));   /* §383b: KAP dinlensin (köprü yolunda) */
  let eklenen = 0, yeniSirket = 0, dusen = 0;
  const notlar = [];
  const t0 = Date.now(), BUTCE = 200000;   /* §500: olcKos 4 dk tavanından ÖNCE dur — yarım koşu da yazılsın, rapor kaybolmasın */
  let butceDoldu = 0;
  for (const { kod, n: mevcut } of sira) {
    if (Date.now() - t0 > BUTCE) { butceDoldu++; continue; }
    try {
      const jd = await kapDonemler(kod, 4);            /* §382: koşu-içi önbellek */
      let donemler = (jd && jd.ok && jd.donemler) ? jd.donemler.slice(0, CEYREK_TAVAN) : [];
      /* §549c: dönem listesi gelmediyse ama bu şirket yeni çeyrek bekliyorsa ve takvim bildirim kimliğini biliyorsa, tek dönemle devam —
         liste için KAP'a gitmeden (ASELS 3Ç26: iki koşu "doğrudan: fetch failed" ile düşmüştü, panelde 2026/2'de kaldı) */
      if (!donemler.length && yeniSet.has(kod) && takvimDonem && takvimBildirim[kod] && takvimBildirim[kod].id) {
        donemler = [{ yil: takvimDonem.y, donem: takvimDonem.q, id: String(takvimBildirim[kod].id), kod }]; notlar.push(kod + ': dönem listesi yok → takvim bildirim kimliği ' + takvimBildirim[kod].id); }
      if (!donemler.length) {
        dusen++;
        SAY[kod] = { n: ((SAY[kod] || {}).n || 0) + 1, son: simdi };
        notlar.push(kod + ':' + ((jd && (jd.err || (jd.hatalar||[])[0])) || 'dönem yok') + ' (' + SAY[kod].n + '. kez)');
        await uyku(2500); continue;
      }
      let D = { kod, unvan: jd.unvan || null, guncelleme: null, donemler: {} };
      try { D = Object.assign(D, JSON.parse(await fs.readFile(path.join(KOK, KLASOR, kod + '.json'), 'utf8'))); } catch (e) { yeniSirket++; }
      D.donemler = D.donemler || {};
      let buTur = 0;
      for (const dn of donemler) {
        const anahtar = dn.yil + '/' + dn.donem;
        if (D.donemler[anahtar]) continue;                 /* zaten arşivde — istek YOK */
        const bid = dn.id || dn.disclosureIndex;
        if (!bid) continue;
        try {
          let jh;
          if ((HIZLI || DOGRUDAN) && hamAyristir) {
            const rh = await fetch('https://www.kap.org.tr/tr/Bildirim/' + bid, { headers: { 'user-agent': UA, 'accept': 'text/html', 'referer': 'https://www.kap.org.tr/tr/bildirim-sorgu' }, signal: AbortSignal.timeout(30000) });
            jh = rh.ok ? hamAyristir(await rh.text()) : { ok: false };
          } else {
            const rh = await fetch(TABAN + '?mod=ham&id=' + bid, { signal: AbortSignal.timeout(30000) });
            jh = await rh.json();
          }
          if (jh && jh.ok && (jh.tablolar || []).length) {
            D.donemler[anahtar] = { id: String(bid), birim: jh.birim || null, tablolar: jh.tablolar };
            eklenen++; buTur++;
          }
        } catch (e) {}
        await uyku(HIZLI ? 600 : 2500);
        if (buTur >= (HIZLI ? 15 : 4)) break;                             /* koşu başına şirket sınırı */
      }
      { const ks = Object.keys(D.donemler).filter(k => /^\d{4}\/[1-4]$/.test(k)).sort((a, b) => { const [a1, a2] = a.split('/').map(Number), [b1, b2] = b.split('/').map(Number); return (a1 - b1) || (a2 - b2); });
        while (ks.length > CEYREK_TAVAN) delete D.donemler[ks.shift()]; }   /* §500: yeni çeyrek eklenince en eski düşer */
      D.guncelleme = new Date().toISOString().slice(0, 19) + 'Z';
      D.ceyrek = Object.keys(D.donemler).length;
      await fs.writeFile(path.join(KOK, KLASOR, kod + '.json'), JSON.stringify(D), 'utf8');
      delete SAY[kod];                                  /* §384: başarı sayacı sıfırlar */
      notlar.push(kod + ':' + mevcut + '→' + D.ceyrek);
      await uyku(2500);
    } catch (e) { dusen++; notlar.push(kod + ':' + String(e && e.message || e).slice(0, 20)); await uyku(2500); }
  }
  try { await fs.writeFile(path.join(KOK, KLASOR, '_durum.json'), JSON.stringify(SAY), 'utf8'); } catch (e) {}
  const bekleyen = Object.keys(SAY).filter(k => (SAY[k].n || 0) >= 3).length;
  const tamam = durum.filter(x => x.n >= CEYREK_TAVAN).length;
  degisenler.push('KAP arşivi (+' + eklenen + ' çeyrek)');
  raporlar.push('### KAP arşivi (§381) — ✓ +' + eklenen + ' çeyrek · ' + tamam + '/' + uyeler.length + ' şirket tam' +
    (yeniSirket ? (' · ' + yeniSirket + ' yeni dosya') : '') +
    (notlar.length ? ('\n- ' + notlar.slice(0, 6).join(' · ')) : '') +
    '\n- öncelik: bilanço tetiği → XK030 → XK100 → kalanlar (en çok bakılan önce dolar)' +
    (dusen ? ('\n- ' + dusen + ' düştü') : '') + (yeniSet.size ? ('\n- §500 yeni dönem önceliği: ' + [...yeniSet].join(', ')) : '') + (butceDoldu ? ('\n- ⏱ süre bütçesi doldu, ' + butceDoldu + ' şirket sonraki koşuya') : '') +
    (bekleyen ? ('\n- ' + bekleyen + ' şirket 3+ kez düştü, 6 saat dinlendiriliyor (sırayı tıkamasın)') : '') +
    '\n- ⓘ Ham tablolar `' + KLASOR + '/<KOD>.json` içinde, şirket başına en fazla ' + CEYREK_TAVAN +
    ' çeyrek. Yayımlanmış bildirim değişmediği için bir kez yazılır; panel KAP yerine buradan okuyabilir (15 istek → 1).');
}

/* ── §455 FAKTÖR SKORLARI — KOYFIN'SİZ fm.json (6 Eki 2026) ─────────────────
   Kullanıcı: "bilançoları zaten Actions'ta çekiyoruz." Doğru: §361 faktor-evren.json
   KAP'tan TTM temelleri biriktiriyor; fiyat/hacim Yahoo'dan, beta çıpası XKTUM arşivi.
   Bu katman ikisini birleştirip Koyfin'in SÜTUN ADLARIYLA fm-girdi.csv yazar ve
   doğrulanmış fm-isle.py'yi çağırır — YÖNTEM DEĞİŞMEZ, yalnız veri kaynağı değişir.
   Evren = resmî XKTUM (endeks-uyeler.json); revizyonlar kendiliğinden yansır.
   TERFİ: çıktı fm-oto.json; sıralanan ≥ evrenin %60'ı olunca fm.json'un yerine geçer
   (o güne dek panel eski dosyayla çalışır, rapor ilerlemeyi söyler).
   Metrik eşlemesi (TTM, §361 alanları): P/E=PD/netKar · EV=PD+netBorç · EV/EBITDA,
   EV/Sales · P/FCF=PD/SNA · P/OCF=PD/işletmeNA · NetBorç/FAVÖK · Borç/(FAVÖK+capex)
   [capex negatif] · EV/(FVÖK+capex) · büyüme=kümülatif y/y · capex/ciro · NOPAT=FVÖK×
   (1−t), t=−vergi/vergiÖncesi [0..%50, yoksa %25] · ROE/ROA/ROIC · marjlar · Altman Z
   (1,2 İS/A + 1,4 GYK/A + 3,3 FVÖK/A + 0,6 PD/Y + 1,0 ciro/A). Momentum: RSI10 (Wilder),
   6A getiri, göreli hacim (son gün / 63 gün ort.), SMA10/50 ve EMA20 sapması.
   Risk: yıllık vol, beta (XKTUM, ±%20 kurumsal işlem ve >5 gün boşluk süzgeci).
   Negatif paydalı çarpanlar BOŞ bırakılır (Koyfin'in NM'i). 3Y capex büyümesi yok.
   PD = pay adedi (sermaye, nominal 1₺ varsayımı — §361) × son ham kapanış. */
const FM_KOLON = ['P/E (LTM)','EV/EBITDA (LTM)','EV/Sales (LTM)','P/FCF (LTM)','P/OCF (LTM)','Net Debt / EBITDA (LTM)','Total Debt / (EBITDA - Capex) (LTM)','EV/(EBIT-Capex)','Total Revenues/CAGR (1Y TTM)','Capex as % of Revenues (LTM)','CAPEX/CAGR (3Y TTM)','Nopat margin','Return On Equity % (LTM)','Return on Assets (ROA) % (LTM)','ROIC (LTM)','EBIT Margin % (LTM)','EBITDA Margin % (LTM)','Gross Profit Margin % (LTM)','FCF Margin % (LTM)','Altman Z-Score (LTM)','NOPAT / ASSETS','RSI 10D','Price Chg. % (6M)','Rel. Volume','SMA % (10D)','SMA % (50D)','EMA % (20D)','Volatility (1Y)','Beta (1Y)'];
const FM_YAHOO_SEKTOR = { 'Basic Materials': 'Materials', 'Consumer Cyclical': 'Consumer Discretionary', 'Consumer Defensive': 'Consumer Staples', 'Financial Services': 'Financials', 'Healthcare': 'Health Care', 'Technology': 'Information Technology' };
function fmSatir(F, px, eSeri) {
  const ok = v => typeof v === 'number' && isFinite(v);
  const bol = (a, b, pozitifPayda = true) => (ok(a) && ok(b) && (pozitifPayda ? b > 0 : b !== 0)) ? a / b : null;
  const M = {};
  /* ── piyasa verisi */
  if (px && px.c && px.c.length >= 60) {
    const c = px.c, n = c.length, v = px.v || [];
    const ort = (a) => a.reduce((s, x) => s + x, 0) / a.length;
    let ag = 0, al = 0; const P = 10, bas = Math.max(1, n - 120);
    for (let i = bas; i < bas + P && i < n; i++) { const d = c[i] - c[i - 1]; if (d > 0) ag += d; else al -= d; }
    ag /= P; al /= P;
    for (let i = bas + P; i < n; i++) { const d = c[i] - c[i - 1]; ag = (ag * (P - 1) + Math.max(d, 0)) / P; al = (al * (P - 1) + Math.max(-d, 0)) / P; }
    M['RSI 10D'] = al === 0 ? 100 : 100 - 100 / (1 + ag / al);
    if (n > 126) M['Price Chg. % (6M)'] = (c[n - 1] / c[n - 127] - 1) * 100;
    const vs = v.slice(Math.max(0, n - 64), n - 1).filter(x => x > 0);
    if (vs.length >= 20 && v[n - 1] > 0) M['Rel. Volume'] = v[n - 1] / ort(vs);
    M['SMA % (10D)'] = (c[n - 1] / ort(c.slice(n - 10)) - 1) * 100;
    M['SMA % (50D)'] = (c[n - 1] / ort(c.slice(n - 50)) - 1) * 100;
    let e = c[Math.max(0, n - 100)]; const k = 2 / 21; for (let i = Math.max(1, n - 99); i < n; i++) e = c[i] * k + e * (1 - k);
    M['EMA % (20D)'] = (c[n - 1] / e - 1) * 100;
    const getiri = []; const tar = px.t;
    for (let i = 1; i < n; i++) { const gun = (Date.parse(tar[i]) - Date.parse(tar[i - 1])) / 864e5; const r = c[i] / c[i - 1] - 1; if (gun <= 5 && Math.abs(r) <= 0.20) getiri.push({ t: tar[i], r }); }
    if (getiri.length >= 60) {
      const m = ort(getiri.map(x => x.r)); const sd = Math.sqrt(getiri.reduce((s, x) => s + (x.r - m) ** 2, 0) / getiri.length);
      M['Volatility (1Y)'] = sd * Math.sqrt(252) * 100;
      if (eSeri) {
        const E = []; const eT = [...eSeri.keys()].sort(); const eIdx = new Map(eT.map((d, i) => [d, i]));
        getiri.forEach(x => { const i = eIdx.get(x.t); if (i > 0) { const g = (Date.parse(eT[i]) - Date.parse(eT[i - 1])) / 864e5; const re = eSeri.get(eT[i]) / eSeri.get(eT[i - 1]) - 1; if (g <= 5 && Math.abs(re) <= 0.20) E.push([x.r, re]); } });
        if (E.length >= 60) { const mx = ort(E.map(p => p[0])), my = ort(E.map(p => p[1])); const cov = E.reduce((s, p) => s + (p[0] - mx) * (p[1] - my), 0), vr = E.reduce((s, p) => s + (p[1] - my) ** 2, 0); if (vr > 0) M['Beta (1Y)'] = cov / vr; }
      }
    }
  }
  /* ── temeller (§361 TTM) */
  if (F && !F.eksik) {
    const pd = (ok(F.adet) && px && ok(px.sonHam)) ? F.adet * px.sonHam : null;
    const ev = (ok(pd) && ok(F.netBorc)) ? pd + F.netBorc : null;
    /* §458 NM eşikleri: sıfıra yakın payda çarpanı 2.000x yapıyordu (P/E 2325, EV/EBITDA 7859, NetDebt/EBITDA 1432);
       z-skoru kırpılsa da sektör ortalama/std'yi bozuyor. Koyfin'in "NM"i gibi anlamsız uç BOŞ bırakılır. */
    const nm = (v, tavan) => (v == null || v > tavan) ? null : v;
    M['P/E (LTM)'] = nm(bol(pd, F.netKar), 150); M['EV/EBITDA (LTM)'] = nm(bol(ev, F.favok), 150); M['EV/Sales (LTM)'] = nm(bol(ev, F.ciro), 60);
    M['P/FCF (LTM)'] = nm(bol(pd, F.sna), 150); M['P/OCF (LTM)'] = nm(bol(pd, F.isletmeNA), 150);
    M['Net Debt / EBITDA (LTM)'] = nm(bol(F.netBorc, F.favok), 20);
    M['Total Debt / (EBITDA - Capex) (LTM)'] = (ok(F.favok) && ok(F.capex)) ? nm(bol(F.finBorc, F.favok + F.capex), 50) : null;
    M['EV/(EBIT-Capex)'] = (ok(F.faal) && ok(F.capex)) ? nm(bol(ev, F.faal + F.capex), 150) : null;
    M['Total Revenues/CAGR (1Y TTM)'] = (F.buyume && ok(F.buyume.ciro) && Math.abs(F.buyume.ciro) <= 300) ? F.buyume.ciro : null;
    M['Capex as % of Revenues (LTM)'] = (ok(F.capex) && ok(F.ciro) && F.ciro > 0) ? -F.capex / F.ciro * 100 : null;
    let t = 0.25; if (ok(F.vergi) && ok(F.vergiOncesi) && F.vergiOncesi > 0) t = Math.min(0.5, Math.max(0, -F.vergi / F.vergiOncesi));
    const nopat = ok(F.faal) ? F.faal * (1 - t) : null;
    const yuz = (a, b) => { const x = bol(a, b); return x == null ? null : x * 100; };
    M['Nopat margin'] = yuz(nopat, F.ciro);
    M['Return On Equity % (LTM)'] = yuz(F.netKar, F.ozk); M['Return on Assets (ROA) % (LTM)'] = yuz(F.netKar, F.aktif);
    M['ROIC (LTM)'] = (ok(F.ozk) && ok(F.netBorc)) ? yuz(nopat, F.ozk + F.netBorc) : null;
    M['EBIT Margin % (LTM)'] = yuz(F.faal, F.ciro); M['EBITDA Margin % (LTM)'] = yuz(F.favok, F.ciro);
    M['Gross Profit Margin % (LTM)'] = yuz(F.brut, F.ciro); M['FCF Margin % (LTM)'] = yuz(F.sna, F.ciro);
    if ([F.donen, F.kvY, F.gecmisKar, F.faal, F.aktif, F.ozk, F.ciro, pd].every(ok) && F.aktif > 0 && F.aktif - F.ozk > 0)
      M['Altman Z-Score (LTM)'] = 1.2 * (F.donen - F.kvY) / F.aktif + 1.4 * F.gecmisKar / F.aktif + 3.3 * F.faal / F.aktif + 0.6 * pd / (F.aktif - F.ozk) + 1.0 * F.ciro / F.aktif;
    M['NOPAT / ASSETS'] = yuz(nopat, F.aktif);
  }
  return M;
}
async function fmHesapla() {
  const uyku = (ms) => new Promise(r => setTimeout(r, ms));
  let uyeler = []; try { uyeler = ((await oku('endeks-uyeler.json')).uyeler || {}).XKTUM || []; } catch (e) {}
  if (!uyeler.length) { raporlar.push('### Faktör skorları (§455) — ⏭ XKTUM üye listesi yok'); return; }
  let FE = {}; try { FE = (await oku('faktor-evren.json')).sirketler || {}; } catch (e) {}
  /* sektör: kalıcı harita (fm-sektor.json) ← mevcut fm.json (Koyfin GICS) ← Yahoo assetProfile (yalnız eksikler) */
  let SEK = {}; try { SEK = (await oku('fm-sektor.json')).sektor || {}; } catch (e) {}
  try { (await oku('fm.json')).data.forEach(r => { if (r.s && r.s !== 'Bilinmiyor' && !SEK[r.t]) SEK[r.t] = r.s; }); } catch (e) {}
  let yahooSek = 0;
  for (const k of uyeler.filter(k => !SEK[k]).slice(0, 40)) {
    try { const r = await fetch('https://query2.finance.yahoo.com/v10/finance/quoteSummary/' + k + '.IS?modules=assetProfile', { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(10000) });
      if (r.ok) { const s = (await r.json())?.quoteSummary?.result?.[0]?.assetProfile?.sector; if (s) { SEK[k] = FM_YAHOO_SEKTOR[s] || s; yahooSek++; } } } catch (e) {}
    await uyku(200);
  }
  /* fiyat + hacim (1 yıl, günlük) */
  const PX = {};
  const tek = async kod => { try {
    const r = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(kod + '.IS') + '?interval=1d&range=1y', { headers: { 'User-Agent': 'Mozilla/5.0 (KtPanel/1.0)' }, signal: AbortSignal.timeout(15000) });
    if (!r.ok) return; const d = (await r.json())?.chart?.result?.[0]; if (!d) return;
    const adj = d.indicators?.adjclose?.[0]?.adjclose, ham = d.indicators?.quote?.[0]?.close, vol = d.indicators?.quote?.[0]?.volume, ts = d.timestamp || [];
    const cc = (Array.isArray(adj) && adj.some(x => typeof x === 'number')) ? adj : (ham || []);
    const o = { t: [], c: [], v: [], sonHam: null };
    /* §458: seans sürerken (TR saati < 19) günün barı KISMİDİR — Rel. Volume medyanı 0,11 çıktı (hacim yarım),
       RSI/SMA/EMA da yarım fiyatla hesaplanıyordu. Bugünün barı seans bitmeden kullanılmaz; son TAMAMLANMIŞ seans. */
    const bugunTR = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Istanbul' }); const saatTR = +new Date().toLocaleTimeString('en-GB', { timeZone: 'Europe/Istanbul', hour: '2-digit', hour12: false });
    let sonIdx = ts.length - 1; while (sonIdx >= 0 && new Date(ts[sonIdx] * 1000).toLocaleDateString('sv-SE', { timeZone: 'Europe/Istanbul' }) === bugunTR && saatTR < 19) sonIdx--;
    for (let i = 0; i <= sonIdx; i++) if (typeof cc[i] === 'number' && cc[i] > 0) { o.t.push(new Date(ts[i] * 1000).toISOString().slice(0, 10)); o.c.push(cc[i]); o.v.push(typeof (vol || [])[i] === 'number' ? vol[i] : 0); }
    for (let i = Math.min(sonIdx, (ham || []).length - 1); i >= 0; i--) if (typeof ham[i] === 'number' && ham[i] > 0) { o.sonHam = ham[i]; break; }
    if (o.c.length >= 60) PX[kod] = o;
  } catch (e) {} };
  { let i = 0; const isci = async () => { while (i < uyeler.length) { const k = uyeler[i++]; await tek(k); } }; await Promise.all(Array.from({ length: 8 }, isci)); }
  FM_PX_SON = PX;   /* §529: karne aynı fiyatları kullanır (yeniden çekmez) */
  /* §457 FONZİ GERÇEKLEŞEN (7 Eki): fon krizi penceresi 15 Eyl → 30 Eyl (dip) hisse bazında gerçekleşen
     getiri — Yahoo adjclose (bölünme/bedelsiz düzeltilmiş; Fintables ham kapanışında HRKET 80→8 gibi
     bölünmeler çöküş gibi görünür). Stres testi "o kriz tekrar olsa" sorusunu bununla cevaplar. */
  try {
    const BAS = '2026-09-15', DIP = '2026-09-30'; const H = {}; let sayac = 0;
    for (const kod of Object.keys(PX)) { const o = PX[kod]; const iB = o.t.findIndex(d => d >= BAS); const iD = o.t.findIndex(d => d >= DIP);
      if (iB < 0 || iD < 0 || iD <= iB || o.t[iB] > '2026-09-17') continue;
      const cB = o.c[iB]; let enDusuk = cB; for (let i = iB + 1; i <= iD; i++) if (o.c[i] < enDusuk) enDusuk = o.c[i];
      H[kod] = { k30: +(((o.c[iD] / cB) - 1) * 100).toFixed(2), dip: +(((enDusuk / cB) - 1) * 100).toFixed(2) }; sayac++; }
    let endeks = {}; try { const ar = (await oku('endeks-arsiv.json')).gunler || {}; const g = Object.keys(ar).sort(); const ilk = g.find(d => d >= BAS), son = g.filter(d => d <= DIP).pop();
      for (const e of ['XKTUM', 'XK100', 'XK030', 'XU100']) { const a = ar[ilk] && ar[ilk][e], b = ar[son] && ar[son][e]; if (a > 0 && b > 0) endeks[e] = +(((b / a) - 1) * 100).toFixed(1); } } catch (e) {}
    /* §457b: ayrı dosya DEĞİL — fon-portfoy.json tasfiye bloğunun içine (kodlar, baskı listesiyle aynı yer) */
    if (sayac >= 150) { const fpj = await oku('fon-portfoy.json'); fpj.tasfiye = fpj.tasfiye || {}; fpj.tasfiye.gerceklesen = { _not: '§457 Fon krizi penceresinde hisse bazında GERÇEKLEŞEN getiri: k30 = 15 Eyl kapanış → 30 Eyl kapanış (dip günü), dip = pencere içi en düşük kapanış. Kaynak Yahoo adjclose (bölünme düzeltilmiş), her koşuda yeniden yazılır. Stres testi "Fonzi" hisse başına uygular.', pencere: { bas: BAS, dip: DIP }, guncelleme: bugun, kaynak: 'Yahoo adjclose (Actions §457)', endeks, hisseler: H }; await yaz('fon-portfoy.json', fpj); degisenler.push('fonzi gerçekleşen'); raporlar.push('### Fonzi gerçekleşen (§457) — ✓ ' + sayac + ' hisse · endeks ' + Object.entries(endeks).map(([k, v]) => k + ' ' + v).join(' · ') + ' · fon-portfoy.json/tasfiye.gerceklesen'); }
    else raporlar.push('### Fonzi gerçekleşen (§457) — ⏭ yalnız ' + sayac + ' hissede pencere verisi (eşik 150)');
  } catch (e) { raporlar.push('### Fonzi gerçekleşen (§457) — ✗ ' + String(e.message || e).slice(0, 80)); }
  /* beta çıpası: XKTUM resmî arşiv (riskTazele ile aynı kural: son 120 günde ≥60 nokta) */
  let eSeri = null; try { const ar = await oku('endeks-arsiv.json'); const m = new Map(); Object.keys(ar.gunler || {}).sort().forEach(g => { const v = ar.gunler[g] && ar.gunler[g].XKTUM; if (v > 0) m.set(g, v); });
    const sinir = new Date(Date.now() - 120 * 864e5).toISOString().slice(0, 10); if ([...m.keys()].filter(g => g >= sinir).length >= 60) eSeri = m; } catch (e) {}
  /* CSV (Koyfin sütun adlarıyla) */
  const esc = s => /[",]/.test(String(s)) ? '"' + String(s).replace(/"/g, '""') + '"' : String(s);
  const satirlar = [['Ticker', 'Sector', ...FM_KOLON].map(esc).join(',')];
  let temel = 0, piyasa = 0;
  for (const kod of uyeler) {
    const F = FE[kod], px = PX[kod]; const M = fmSatir(F, px, eSeri);
    if (F && !F.eksik) temel++; if (px) piyasa++;
    satirlar.push([kod, SEK[kod] || '', ...FM_KOLON.map(k => (typeof M[k] === 'number' && isFinite(M[k])) ? +M[k].toFixed(4) : '')].map(esc).join(','));
  }
  await fs.writeFile(path.join(KOK, 'fm-girdi.csv'), satirlar.join('\n') + '\n', 'utf8');
  await yaz('fm-sektor.json', { _not: '§455 faktör modeli sektör haritası (GICS adları). Kaynak sırası: elle > Koyfin fm.json > Yahoo assetProfile. Eksikler "Bilinmiyor" → tüm evrene karşı normalize (fm-isle.py §455).', guncelleme: bugun, sektor: SEK });
  /* fm-isle.py (doğrulanmış yöntem) */
  const cp = await import('node:child_process');
  let cikti = '';
  try { cikti = cp.execFileSync('python3', [path.join(KOK, 'arac', 'fm-isle.py'), path.join(KOK, 'fm-girdi.csv'), path.join(KOK, 'fm-oto.json')], { encoding: 'utf8', timeout: 120000 }); }
  catch (e) { raporlar.push('### Faktör skorları (§455) — ✗ fm-isle.py: ' + String(e.stderr || e.message || e).slice(0, 160)); return; }
  const oto = await oku('fm-oto.json'); const ranked = (oto.meta || {}).ranked || 0;
  /* §459f TERFİ ÖLÇÜTÜ ADET DEĞİL AĞIRLIK (12 Eki): "143 şirket" eşiği (üyelerin %60'ı) ADET sayıyordu —
     oysa modelin yatırım yapılabilir evreni ağırlıkla ölçülür: sıralanan 112 isim XKTUM ağırlığının
     ~%78'iydi ve ASELS/BIMAS/TUPRS içerideydi; dışarıda kalan 126 ismin ağırlığı %22 ve çoğu %0,1'in
     altı. Adet eşiği, 12 Ağu'dan beri Koyfin'in 24 Ağu fotoğrafını ekranda tutuyordu (7 hafta bayat).
     YENİ: sıralanan AĞIRLIK ≥ %70 VE adet ≥ 100 VE fiyat kapsamı ≥ %80 → terfi. Adet tabanı küçük
     evrende tek sektörün modeli ele geçirmesini önler; ağırlık tabanı asıl ölçüt.
     DERS: EŞİĞİ, MODELİN KULLANILDIĞI BÜYÜKLÜKLE AYNI BİRİMDE KOY — adet sayıp ağırlık varsaymak
     kuyruğun başı rehin almasıdır. */
  let XWm = {}; try { XWm = (await oku('xktum.json')).uyeler || {}; } catch (e) {}
  const rankedKod = new Set((oto.data || []).filter(r => r && r.t && r.f && r.f.some(v => typeof v === 'number')).map(r => r.t));
  const topW = uyeler.reduce((a, k) => a + (XWm[k] || 0), 0);
  const rankedW = uyeler.filter(k => rankedKod.has(k)).reduce((a, k) => a + (XWm[k] || 0), 0);
  const agirlikPay = topW > 0 ? rankedW / topW : 0;
  const esikAdet = 100, esikAgirlik = 0.70;
  oto.meta._kaynak = '§455 kendi verimiz: KAP TTM (faktor-evren.json) + Yahoo fiyat/hacim + XKTUM arşivi · evren resmî XKTUM ' + uyeler.length;
  oto.meta.agirlik_kapsami = +(agirlikPay * 100).toFixed(1);
  let terfi = false;
  /* §455d: fiyat kaynağı düşmüşse (momentum/risk boş) terfi YOK — eksik faktörle sıralama yanıltır */
  const piyasaYeter = piyasa >= Math.ceil(uyeler.length * 0.8);
  const esik = esikAdet;
  if (ranked >= esikAdet && agirlikPay >= esikAgirlik && piyasaYeter) { await yaz('fm.json', oto); terfi = true; degisenler.push('fm.json (§455 kendi hesap · ağırlık %' + (agirlikPay * 100).toFixed(0) + ')'); }
  await yaz('fm-oto.json', oto); degisenler.push('fm-oto');
  const imza = (cikti.match(/YAPISAL IMZA[\s\S]*?(?=\n\n)/) || [''])[0].split('\n').slice(2, 7).map(s => s.trim().replace(/\s+/g, ' ')).join(' · ');
  let rvMed = null; try { const rv = satirlar.slice(1).map(s => parseFloat(s.split(',')[2 + FM_KOLON.indexOf('Rel. Volume')])).filter(x => isFinite(x)).sort((a, b) => a - b); if (rv.length) rvMed = rv[Math.floor(rv.length / 2)]; } catch (e) {}
  raporlar.push('### Faktör skorları (§455) — ✓ sıralanan ' + ranked + '/' + uyeler.length + ' · temel veri ' + temel + ' · fiyat ' + piyasa + ' · beta çıpası ' + (eSeri ? 'XKTUM arşivi' : 'YOK') + (yahooSek ? ' · Yahoo sektör +' + yahooSek : '') + (rvMed != null ? ' · Rel.Vol medyan ' + rvMed.toFixed(2) + (rvMed < 0.5 ? ' ⚠ (kısmi gün?)' : ' ✓') : '') +
    (terfi ? '\n- ✓ fm.json TERFİ ETTİ (adet ' + ranked + ' ≥ ' + esikAdet + ' · XKTUM ağırlık kapsamı %' + (agirlikPay * 100).toFixed(1) + ' ≥ %70) — panel kendi hesabımızla çalışıyor' : ('\n- ⏳ fm.json korunuyor: ' + (!piyasaYeter ? 'fiyat kapsamı ' + piyasa + '/' + uyeler.length + ' (%80 şart)' : 'adet ' + ranked + '/' + esikAdet + ' · ağırlık kapsamı %' + (agirlikPay * 100).toFixed(1) + '/70 (§459f)'))) +
    '\n- imza: ' + imza.slice(0, 300));
}

async function faktorEvren() {
  const dosya = 'faktor-evren.json';
  /* §361b HIZ SINIRI (canlı ölçüm: 12/12 "dönem yok"; aynı uç tarayıcıdan tek
     istekte ÇALIŞIYOR → sorun ardışık yük). Parti 12→6, bekleme 0,7→3 sn,
     başarısız dönem listesi 1 kez tekrar denenir. Yavaş ama sağlam: 6 şirket
     ~3 dk, evren 245/6 ≈ 41 koşuda döner (günde 3-4 koşuyla ~2 hafta).
     Hız sınırı görülmezse parti kademeli büyütülür. */
  /* §363b PARTİ 12 → 6 GERİ ALINDI (ölçüm konuştu): 12'de 7/12 "fetch failed"
     (parti 6'da 1/6 idi). Hız sınırı GERÇEK ve eşik 6 ile 12 arasında.
     Büyütme denemesi bilinçliydi ve ölçümle geri alındı — tahminle değil.
     DEVRE KESİCİ eklendi: üst üste 3 başarısızlıkta tur ERKEN BİTER. Boşuna
     istek atmak hem süre yakar hem KAP'ı daha da kapatır; kalanlar zaten
     sıradaki turda en önde. */
  const PARTI_BOY = 6;
  const ARDISIK_TAVAN = 3;
  const TABAN = 'https://ktpanel.vercel.app/api/kap';
  const uyku = (ms) => new Promise(r => setTimeout(r, ms));
  let uyeler = [];
  try {
    const eu = await oku('endeks-uyeler.json');
    uyeler = ((eu.uyeler || {}).XKTUM || []).slice();
  } catch (e) {}
  if (!uyeler.length) { raporlar.push('### Faktör evreni (§361) — ⏭ XKTUM üye listesi okunamadı'); return; }

  let D = { guncelleme: null, evren: 'XKTUM', _yontem: '', sirketler: {} };
  if (await varMi(dosya)) { try { D = await oku(dosya) || D; } catch (e) {} }
  D.sirketler = D.sirketler || {};

  /* Sıra: önce hiç çekilmemişler, sonra en eski çekilenler.
     Bilanço tetiğindekiler (yeni bildirim) EN ÖNE. */
  let tetikKodlar = [];
  try { const bt = await oku('bilanco-tetik.json'); tetikKodlar = bt.kodlar || []; } catch (e) {}
  /* §361e YÖNTEM SÜRÜMÜ (20 Ağu): §361d ile TTM hesabı değişti ama ESKİ
     yöntemle yazılmış kayıtlar dosyada duruyordu ve yaş sıralaması onları EN
     SONA atıyordu — 41 tur boyunca yanlış kalacaklardı (AKHAN 3,81; doğrusu
     11,22). Artık her kayıt hangi yöntemle yazıldığını taşır; sürümü eski
     olanlar HİÇ ÇEKİLMEMİŞ gibi en öne alınır.
     DERS: HESAP YÖNTEMİ DEĞİŞTİYSE ESKİ KAYITLAR DAMGALANIP ÖNE ALINMALI —
     yoksa doğru kodla yanlış veri bir arada yaşar. */
  /* §361f isFinite TUZAĞI (20 Ağu, BINHO'da yakalandı): global isFinite(null)
     TRUE döner — null sayıya çevrilince 0 oluyor. BINHO'nun BOŞ cirosu "dolu"
     sayıldı (eksik:false yazıldı) ve aritmetikte null sessizce 0 gibi davranıp
     TTM hesabını da bozabilirdi (y.k + a.k − a.onceki'de bir bacak null ise
     sonuç sessizce yanlış çıkar). Number.isFinite tip dönüşümü YAPMAZ.
     Bu blokta tüm kontroller Number.isFinite'e çevrildi.
     DERS: null KONTROLÜNDE isFinite DEĞİL Number.isFinite. */
  const YONTEM = '496';    /* §362: faktör değişkenleri · §496b: ÇEKİRDEK FAVÖK eklendi — eski kayıtlar arşivden (ağsız) yeniden kurulur */
  const yas = (k) => {
    const r = D.sirketler[k];
    /* §361g NULL KONTROLÜ GERİ (canlı çöküş: "Cannot read properties of
       undefined (reading 'y')"). §361f'de sıralamayı düzeltirken `!r`
       kontrolünü düşürmüşüm; hiç çekilmemiş şirkette r undefined ve r.y
       patlıyordu — MODÜLÜN TAMAMI düştü, o koşuda hiçbir kayıt yazılmadı.
       DERS: BİR KOŞULU YENİDEN SIRALARKEN İÇİNDEKİ SAVUNMAYI TAŞI. */
    if (!r) return 0;                               /* hiç çekilmemiş */
    if (r.y !== YONTEM) return -1;                  /* yanlış/eski veri → EN ÖNCE düzeltilir */
    if (!r.ts) return 0;
    return new Date(r.ts).getTime();
  };
  /* §455c (6 Eki canlı ölçüm): hiç çekilmemişler ALFABETİK sırayla geliyordu — en büyük 40 hissenin 26'sı
     (ASELS, TUPRS, EREGL…) hâlâ yoktu, temel kapsam XKTUM ağırlığının yalnız %28'i. Eşit yaşta BÜYÜK önce. */
  let XW = {}; try { XW = (await oku('xktum.json')).uyeler || {}; } catch (e) {}
  const sira = uyeler.slice().sort((a, b) => {
    const ta = tetikKodlar.includes(a) ? 0 : 1, tb = tetikKodlar.includes(b) ? 0 : 1;
    if (ta !== tb) return ta - tb;
    return (yas(a) - yas(b)) || ((XW[b] || 0) - (XW[a] || 0));
  }).slice(0, PARTI_BOY);
  /* §455c ARŞİVDEN DOLDUR (sıfır KAP isteği): §383 "aynı veriyi iki modül çekiyorsa biri çeksin, diğeri
     okusun" kuralının TERS yönü — arşivde (kap-arsiv/<KOD>.json) TTM'e yetecek dönem (son yıllık, ya da
     ara dönem + yıllık) varsa ve faktör kaydı yok/eksik/eski yöntem/daha eski dönem ise, kayıt ARŞİVDEN
     kurulur. Sınırsız (ağ yok). Ölçüm: 15 şirket anında, içinde ASELS/TUPRS/EREGL/KRDMD/EKGYO/PETKM/CIMSA. */
  const arsivKalemleri = async (kod) => {
    try {
      const A = JSON.parse(await fs.readFile(path.join(KOK, 'kap-arsiv', kod + '.json'), 'utf8'));
      const ks = Object.keys(A.donemler || {}).filter(x => /^\d{4}\/\d$/.test(x)).sort((x, y) => { const [a1, a2] = x.split('/').map(Number), [b1, b2] = y.split('/').map(Number); return (b1 - a1) || (b2 - a2); }).slice(0, 5);
      if (!ks.length) return null;
      const kl = ks.map(key => { const D0 = A.donemler[key]; const carpan = (D0.birim && D0.birim.carpan) || 1; const K = {};
        (D0.tablolar || []).forEach(tb => (tb.satirlar || []).forEach(sr => { if (!sr.xbrl || !sr.degerler || !sr.degerler.length || K[sr.xbrl]) return;
          K[sr.xbrl] = { k: sr.degerler[0] * carpan, onceki: Number.isFinite(sr.degerler[1]) ? sr.degerler[1] * carpan : null, c: (sr.degerler.length >= 4 && Number.isFinite(sr.degerler[2])) ? sr.degerler[2] * carpan : null }; }));
        const [yy, dd] = key.split('/').map(Number); return Object.keys(K).length ? { yil: yy, donem: dd, K } : null; });
      const son0 = kl.find(x => x); if (!son0) return null;
      if (son0.donem !== 4 && !kl.some(x => x && x.donem === 4)) return null;   /* TTM için yıllık bacak şart */
      return kl;
    } catch (e) { return null; }
  };
  const arsivKodlar = [];
  for (const k of uyeler) {
    const r = D.sirketler[k];
    if (r && !r.eksik && r.y === YONTEM) {
      /* kayıt sağlam: arşivde DAHA YENİ dönem varsa yine arşivden tazele */
      try { const A = JSON.parse(await fs.readFile(path.join(KOK, 'kap-arsiv', k + '.json'), 'utf8')); const enYeni = Object.keys(A.donemler || {}).sort((x, y) => { const [a1, a2] = x.split('/').map(Number), [b1, b2] = y.split('/').map(Number); return (b1 - a1) || (b2 - a2); })[0];
        const [e1, e2] = String(enYeni || '0/0').split('/').map(Number), [r1, r2] = String(r.donem || '0/0').split('/').map(Number); if (e1 * 10 + e2 > r1 * 10 + r2) arsivKodlar.push(k); } catch (e) {}
      continue;
    }
    if (await varMi(path.join('kap-arsiv', k + '.json'))) arsivKodlar.push(k);
  }
  const arsivSet = new Set(arsivKodlar);
  let arsivden = 0;

  const AL = {
    ciro: 'ifrs-full_Revenue', brut: 'ifrs-full_GrossProfit',
    faal: 'ifrs-full_ProfitLossFromOperatingActivities',
    amort: 'ifrs-full_AdjustmentsForDepreciationAndAmortisationExpense',
    netKar: 'ifrs-full_ProfitLossAttributableToOwnersOfParent',
    nakit: 'ifrs-full_CashAndCashEquivalents', finYat: 'kap-fr_CurrentFinancialInvestments',
    kvB: 'kap-fr_CurrentBorowings', kvUV: 'kap-fr_CurrentPortionOfNoncurrentBorrowings',
    uvB: 'ifrs-full_LongtermBorrowings', ozk: 'ifrs-full_Equity',
    aktif: 'ifrs-full_Assets', sermaye: 'ifrs-full_IssuedCapital',
    donen: 'ifrs-full_CurrentAssets', kvY: 'ifrs-full_CurrentLiabilities',
    /* §362 FAKTÖR DEĞİŞKENLERİ (kullanıcı: "amaç faktör metriklerini hesaplayan
       değişkenlere ulaşma değil mi") — aynı ham çıktıdan okunur, EK İSTEK YOK:
         isletmeNA + capex → serbest nakit akışı (değer: F/SNA · kalite: nakit üretimi)
         isletmeNA + netKar → TAHAKKUK ORANI (Sloan): kâğıt kârı nakde dönüyor mu
         odenenFaiz → faiz karşılama (güvenlik faktörü)
         odenenTemettu → temettü verimi
         stok/ticariAlacak → devir hızları, Beneish kanalları */
    isletmeNA: 'ifrs-full_CashFlowsFromUsedInOperatingActivities',
    capex: 'kap-fr_PurchaseOfPropertyPlantEquipmentAndIntangibleAssetsClassifiedAsInvestingActivities',
    odenenFaiz: 'ifrs-full_InterestPaidClassifiedAsFinancingActivities',
    odenenTemettu: 'ifrs-full_DividendsPaidClassifiedAsFinancingActivities',
    amortNA: 'ifrs-full_AdjustmentsForDepreciationAndAmortisationExpense',
    stok: 'ifrs-full_Inventories', ticariAlacak: 'ifrs-full_CurrentTradeReceivables',
    ticariBorc: 'kap-fr_CurrentTradePayables',
    /* §455: faktör skorlarının eksik metrikleri için (FVÖK marjı, NOPAT, ROIC, Altman Z) */
    vergiOncesi: 'ifrs-full_ProfitLossBeforeTax', vergi: 'ifrs-full_IncomeTaxExpenseContinuingOperations',
    /* §496b ÇEKİRDEK FAVÖK bileşenleri — panelin KAP kartındaki §351b tanımıyla AYNI (brüt − pazarlama − GYG − Ar-Ge + amortisman).
       Geniş tanım (faaliyet kârı + amortisman) "diğer faaliyet gelir/giderlerini" (kur farkı, vade farkı, reeskont) içerir:
       ULUSE/MNDTR/CELHA'da bu kalem faaliyet kârını eksiye çevirip FAVÖK'ü ~0'a indirdi → EV/EBITDA 150–400x çıktı. */
    pazarlama: 'kap-fr_MarketingExpense', gyg: 'ifrs-full_AdministrativeExpense', arge: 'ifrs-full_ResearchAndDevelopmentExpense',
    gecmisKar: 'kap-fr_PriorYearsProfitsOrLosses'   /* §458: KAP bilançoda 'Geçmiş Yıllar Kâr/Zararları' bu kodla (ifrs-full_RetainedEarnings yok — ASELS arşivinde ölçüldü) */
  };
  let basarili = 0, eksikli = 0, dusen = 0, arsivYazilan = 0;
  const notlar = [];

  let ardisikHata = 0;
  for (const kod of [...arsivKodlar, ...sira.filter(k => !arsivSet.has(k))]) {
    if (ardisikHata >= ARDISIK_TAVAN) {
      notlar.push('⏹ devre kesici: ' + ARDISIK_TAVAN + ' ardışık hata, tur erken bitti');
      break;
    }
    try {
      let kalemler = arsivSet.has(kod) ? await arsivKalemleri(kod) : null;
      const arsivKaynak = !!kalemler;
      if (arsivSet.has(kod) && !kalemler) continue;     /* arşiv yetersiz: ağ partisine bırak (bu tur değil) */
      if (!kalemler) {
      const jd = await kapDonemler(kod, 2);            /* §382: ortak koşu-içi önbellek */
      const donemler = (jd && jd.ok && jd.donemler) ? jd.donemler.slice(0, 5) : [];   /* §361d: son yıllık (4Ç) mutlaka kapsansın */
      if (donemler.length < 2) {
        dusen++;
        const sbp = (jd && (jd.err || (jd.hatalar && jd.hatalar[0]))) || 'liste boş';
        notlar.push(kod + ':' + String(sbp).slice(0, 26));
        /* §458 (7 Eki canlı): CITAS/TKNKA/KPEKS her koşu "liste boş" → yaş 0 → hep önde → 3 ardışık hata → devre
           kesici → O KOŞUDA HİÇ YENİ ŞİRKET ÇEKİLMİYORDU. Veri yokluğu ağ hatası değildir: 'eksik' kaydı yazılır
           (30 gün sonra yeniden denenir), devre kesici SAYMAZ. */
        if (/liste boş|boş/.test(String(sbp))) { D.sirketler[kod] = { eksik: true, neden: String(sbp).slice(0, 40), t: bugun, y: YONTEM, kaynak: 'KAP' }; }
        else ardisikHata++;
        await uyku(3000); continue;
      }

      kalemler = [];
      for (const dn of donemler) {
        /* §361b ALAN ADI HATASI (canlı ölçüm): mod=donemler çıktısı
           {yil, donem, id, kod} döndürüyor — `disclosureIndex` DEĞİL. Kodum o
           adı arıyordu, id=undefined ile istek atıyordu. Dönem listesi gelse
           bile ham çekim patlardı. DERS: UCUN GERÇEK ÇIKTISINI GÖR, ALAN ADI
           TAHMİN ETME. */
        const bid = dn.id || dn.disclosureIndex;
        if (!bid) { kalemler.push(null); continue; }
        /* §455b: ham sayfa ÖNCE doğrudan KAP (§446: köprüyü KAP reddediyor), düşerse köprü */
        let jh = null;
        try { const rd = await fetch('https://www.kap.org.tr/tr/Bildirim/' + bid, { headers: { 'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36', 'accept': 'text/html', 'referer': 'https://www.kap.org.tr/tr/bildirim-sorgu' }, signal: AbortSignal.timeout(30000) });
          if (rd.ok) jh = kapHamAyristir(await rd.text()); } catch (e0) {}
        if (!jh || !jh.ok) { try { const rh = await fetch(TABAN + '?mod=ham&id=' + bid, { signal: AbortSignal.timeout(30000) }); jh = await rh.json(); } catch (e1) { jh = null; } }
        if (!jh || !jh.ok) { kalemler.push(null); await uyku(1200); continue; }
        const carpan = (jh.birim && jh.birim.carpan) || 1;
        const K = {};
        (jh.tablolar || []).forEach(t => (t.satirlar || []).forEach(sr => {
          if (!sr.xbrl || !sr.degerler || !sr.degerler.length || K[sr.xbrl]) return;
          K[sr.xbrl] = { k: sr.degerler[0] * carpan,
            onceki: Number.isFinite(sr.degerler[1]) ? sr.degerler[1] * carpan : null,   /* §361d: TTM farkı için ŞART */
            c: (sr.degerler.length >= 4 && Number.isFinite(sr.degerler[2])) ? sr.degerler[2] * carpan : null };
        }));
        kalemler.push({ yil: dn.yil || dn.year, donem: dn.donem || dn.period, K });
        /* §383 FAKTÖR ÇEKTİĞİNİ ARŞİVE DE YAZSIN (22 Ağu, canlı fail):
           arşiv modülü ayrı ayrı çekmeye çalışıyor ve KAP'ı iki kez yoruyor —
           "fetch failed" bundan. Oysa faktör evreni HAM TABLOYU ZATEN eline
           alıyor; onu diske yazmak SIFIR ek istek demek.
           Arşiv modülü artık yalnız EKSİK KALAN çeyrekleri tamamlar.
           DERS: AYNI VERİYİ İKİ MODÜL ÇEKİYORSA BİRİ ÇEKSİN, DİĞERİ OKUSUN. */
        try {
          const ay = path.join(KOK, 'kap-arsiv');
          await fs.mkdir(ay, { recursive: true });
          const dosya = path.join(ay, kod + '.json');
          let A = { kod, guncelleme: null, donemler: {} };
          try { A = Object.assign(A, JSON.parse(await fs.readFile(dosya, 'utf8'))); } catch (e) {}
          A.donemler = A.donemler || {};
          const ank = (dn.yil || dn.year) + '/' + (dn.donem || dn.period);
          if (!A.donemler[ank] && (jh.tablolar || []).length) {
            A.donemler[ank] = { id: String(bid), birim: jh.birim || null, tablolar: jh.tablolar };
            A.guncelleme = new Date().toISOString().slice(0, 19) + 'Z';
            A.ceyrek = Object.keys(A.donemler).length;
            await fs.writeFile(dosya, JSON.stringify(A), 'utf8');
            arsivYazilan++;
          }
        } catch (e) {}
        await uyku(1200);
      }

      }   /* §455c: ağdan çekim bloğu sonu */
      const son = kalemler.find(x => x);
      if (!son) { dusen++; notlar.push(kod + ':tablo yok'); await uyku(700); continue; }
      /* §361d TTM YÖNTEMİ DEĞİŞTİ — ÇEYREK TOPLAMI YERİNE KÜMÜLATİF FARKI
         (20 Ağu, Fintables ile çapraz doğrulamada yakalandı).
         ÖNCEKİ YÖNTEM ÇÖKTÜ: "çeyrek sütununu topla" varsayımı, o sütunu
         vermeyen şirketlerde kısmi toplam üretiyordu. ALKIM'ın gelir tablosu
         (rol 310003) yalnız KÜMÜLATİF veriyor; sonuç TTM değil 6 aylık çıktı
         (AKHAN dosyada 3,81 mlr; gerçek TTM 11,22 mlr — bağımsız kaynak).
         YENİ YÖNTEM (klasik ve sağlam, HER şablonda çalışır):
           TTM = son_yıllık + cari_kümülatif − geçen_yıl_aynı_kümülatif
         Üç değerin ikisi TEK RAPORDAN gelir: ara dönem raporunun `k` (cari
         kümülatif) ve `onceki` (geçen yılın aynı dönemi) sütunları. Üçüncüsü
         son yıllık rapor (donem=4).
         Ara dönem 4Ç ise (yıllık rapor son rapor) TTM = yıllık, fark gerekmez.
         ENFLASYON: yıllık rapor kendi parasıyla, ara dönem bugünkü parayla —
         aradaki fark kalıyor. Göreli sıralama için kabul edilebilir; dosyada
         `_yontem` ile yazılı. Eksik bacak varsa SONUÇ NULL — kısmi toplam yok. */
      const yillikKl = kalemler.find(x => x && x.donem === 4);
      const araKl = kalemler.find(x => x && x.donem !== 4) || null;
      const akis = (kad) => {
        const xb = AL[kad];
        /* son rapor YILLIK ise TTM doğrudan odur */
        if (son.donem === 4) {
          const v = son.K[xb];
          return (v && Number.isFinite(v.k)) ? v.k : null;
        }
        if (!araKl || !yillikKl) return null;
        const a = araKl.K[xb], y = yillikKl.K[xb];
        if (!a || !y) return null;
        if (!Number.isFinite(a.k) || !Number.isFinite(a.onceki) || !Number.isFinite(y.k)) return null;
        return y.k + a.k - a.onceki;
      };
      const stok = (kad) => { const v = son.K[AL[kad]]; return v && Number.isFinite(v.k) ? v.k : null; };
      const S = (...a) => { let t = 0, v = false; a.forEach(z => { if (Number.isFinite(z)) { t += z; v = true; } }); return v ? t : null; };

      const ciro = akis('ciro'), faal = akis('faal'), am = akis('amort'), netKar = akis('netKar'), brut = akis('brut');
      /* §362 GEÇEN YIL — büyüme faktörü. Değer ZATEN elimizde: TTM formülünde
         kullandığımız `onceki` sütunu geçen yılın aynı kümülatifi. Bir önceki
         TTM = geçen_yıl_yıllık + onceki − (ondan önceki) hesaplanamaz (üçüncü
         bacak yok), o yüzden KÜMÜLATİF y/y kullanılır: cari kümülatif vs
         geçen yıl aynı kümülatif — dönem eşleşmesi birebir, mevsimsellik yok. */
      const yyOran = (kad) => {
        const xb = AL[kad], a2 = araKl ? araKl.K[xb] : null;
        if (!a2 || !Number.isFinite(a2.k) || !Number.isFinite(a2.onceki) || a2.onceki === 0) return null;
        return +((a2.k / a2.onceki - 1) * 100).toFixed(1);
      };
      const isletmeNA = akis('isletmeNA'), capex = akis('capex');
      const odFaiz = akis('odenenFaiz'), odTemettu = akis('odenenTemettu');
      const favok = (Number.isFinite(faal) && Number.isFinite(am)) ? faal + am : null;
      /* §496b: çekirdek — gider kalemleri KAP'ta EKSİ işaretli gelir; olmayan kalem 0 sayılır (Ar-Ge çoğu şirkette yok) */
      const favokCek = (Number.isFinite(brut) && Number.isFinite(am)) ? brut + (akis('pazarlama') || 0) + (akis('gyg') || 0) + (akis('arge') || 0) + am : null;
      const finBorc = S(stok('kvB'), stok('kvUV'), stok('uvB'));
      const likit = S(stok('nakit'), stok('finYat'));
      const kayit = {
        ts: new Date().toISOString().slice(0, 19) + 'Z', y: YONTEM,
        donem: son.yil + '/' + son.donem, ceyrek: kalemler.filter(x => x).length,
        ciro, brut, favok, favokCek, netKar,
        ozk: stok('ozk'), aktif: stok('aktif'), donen: stok('donen'), kvY: stok('kvY'),
        finBorc, likit,
        netBorc: (Number.isFinite(finBorc) && Number.isFinite(likit)) ? finBorc - likit : null,
        /* §362 türev faktör girdileri */
        isletmeNA, capex,
        sna: (Number.isFinite(isletmeNA) && Number.isFinite(capex)) ? isletmeNA + capex : null,
        tahakkuk: (Number.isFinite(netKar) && Number.isFinite(isletmeNA) && Number.isFinite(stok('aktif')) && stok('aktif'))
          ? +(((netKar - isletmeNA) / stok('aktif')) * 100).toFixed(2) : null,
        odFaiz, odTemettu,
        stoklar: stok('stok'), ticariAlacak: stok('ticariAlacak'), ticariBorc: stok('ticariBorc'),
        buyume: { ciro: yyOran('ciro'), netKar: yyOran('netKar'), brut: yyOran('brut') },
        adet: Number.isFinite(stok('sermaye')) ? Math.round(stok('sermaye')) : null,
        adet_kaynak: 'sermaye(nominal 1₺ varsayımı)',
        /* §455 */ faal, amort: am, vergiOncesi: akis('vergiOncesi'), vergi: akis('vergi'), gecmisKar: stok('gecmisKar')
      };
      const bosSay = ['ciro', 'favok', 'ozk', 'aktif'].filter(x => !Number.isFinite(kayit[x])).length;
      kayit.eksik = bosSay > 0;
      if (kayit.eksik) { eksikli++; notlar.push(kod + ':' + bosSay + ' ana kalem boş'); } else basarili++;
      ardisikHata = 0;                              /* §363b: başarı zinciri sıfırlar */
      if (arsivKaynak) { kayit.kaynak = 'arşiv'; arsivden++; } else kayit.kaynak = 'KAP';
      D.sirketler[kod] = kayit;
      if (!arsivKaynak) await uyku(3000);
    } catch (e) {
      dusen++; ardisikHata++; notlar.push(kod + ':' + String(e && e.message || e).slice(0, 24));
      await uyku(3000);
    }
  }

  D.guncelleme = new Date().toISOString().slice(0, 19) + 'Z';
  D.evren = 'XKTUM';
  D.uye_sayisi = uyeler.length;
  D.kapsam = Object.keys(D.sirketler).length;
  D._yontem = '§361d TTM = son_yıllık + cari_kümülatif − geçen_yıl_aynı_kümülatif. (Önceki "çeyrek sütunlarını topla" yöntemi, o sütunu vermeyen şablonlarda KISMİ TOPLAM üretiyordu — ALKIM/AKHAN\'da yakalandı, terk edildi.) Enflasyon: yıllık rapor kendi parasıyla, ara dönem bugünkü parayla — fark kalır, göreli sıralama için kabul edilebilir. Eksik bacak varsa değer NULL, kısmi toplam YOK. Stok kalemler son dönem sonu. Pay adedi ödenmiş sermayeden (nominal 1₺ varsayımı) — kesin değil. Banka/GYO şablonlarında kalemler boş kalabilir, o kayıtlar eksik:true.';
  await yaz(dosya, D);
  degisenler.push('faktör evreni (' + D.kapsam + '/' + uyeler.length + ')');
  const eskiYontem = Object.values(D.sirketler).filter(x => x.y !== YONTEM).length;
  if (arsivYazilan) raporlar.push('- §383 arşive yazıldı: +' + arsivYazilan + ' çeyrek (ek istek YOK — faktörün zaten çektiği tablolar)');
  { const tamW = uyeler.reduce((s, k) => s + ((D.sirketler[k] && !D.sirketler[k].eksik) ? (XW[k] || 0) : 0), 0); notlar.unshift('§455c arşivden ' + arsivden + ' şirket (ağ yok) · temel kapsamın XKTUM ağırlığı %' + tamW.toFixed(1)); }
  raporlar.push('### Faktör evreni (§361) — ✓ parti ' + sira.length + ' · kapsam ' + D.kapsam + '/' + uyeler.length +
    (eskiYontem ? (' · ⚠ ' + eskiYontem + ' kayıt eski yöntemle (sıraya öne alındı)') : '') +
    '\n- bu turda: ' + basarili + ' tam · ' + eksikli + ' eksik kalemli · ' + dusen + ' alınamadı' +
    (notlar.length ? ('\n- not: ' + notlar.slice(0, 8).join(' · ')) : '') +
    '\n- ⚠ ÖLÇÜM TURU: parti ' + PARTI_BOY + ' şirketle sınırlı; KAP hız sınırı ve şablon uyumu görülünce büyütülecek. Panel HENÜZ bağlı değil (multiple.json korunuyor).');
}

async function makroTakvim() {
  const dosya = 'makro-takvim.json';
  try {
    const r = await fetch('https://nfs.faireconomy.media/ff_calendar_thisweek.json', {
      headers: { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36', 'accept': 'application/json' },
      signal: AbortSignal.timeout(20000)
    });
    const ham = await r.text();
    let liste;
    try { liste = JSON.parse(ham); } catch (e) {
      raporlar.push('### Küresel makro takvim (§319) — ⏭ kaynak JSON dönmedi (limit/HTML?): "' + ham.slice(0, 60).replace(/\s+/g, ' ') + '…" — DOSYA KORUNDU');
      return;
    }
    if (!Array.isArray(liste) || !liste.length) { raporlar.push('### Küresel makro takvim (§319) — ⏭ boş liste, dosya korundu'); return; }
    const MAJOR = new Set(['USD', 'EUR', 'GBP', 'CNY', 'JPY', 'TRY']);
    const olaylar = liste.filter(x => x && x.impact === 'High' || (x.impact === 'Medium' && MAJOR.has(x.country)))
      .map(x => {
        const t = new Date(x.date);
        return { t: isNaN(t) ? null : t.toISOString(), ulke: x.country, olay: String(x.title || '').slice(0, 80), etki: x.impact, beklenti: String(x.forecast || ''), onceki: String(x.previous || '') };
      }).filter(x => x.t).sort((a, b) => a.t.localeCompare(b.t));
    if (!olaylar.length) { raporlar.push('### Küresel makro takvim (§319) — ⏭ filtre sonrası 0 olay, dosya korundu'); return; }
    await yaz(dosya, { guncelleme: new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC — otomatik (§319)', kaynak: 'ForexFactory/FairEconomy haftalık takvim JSON', olaylar });
    degisenler.push('küresel makro takvim (' + olaylar.length + ' olay)');
    const yuksek = olaylar.filter(x => x.etki === 'High');
    raporlar.push('### Küresel makro takvim (§319) — ✓ ' + olaylar.length + ' olay (' + yuksek.length + ' yüksek etki)\n' +
      yuksek.slice(0, 6).map(x => '- ' + x.t.slice(0, 16).replace('T', ' ') + 'Z · ' + x.ulke + ' · ' + x.olay).join('\n'));
  } catch (e) { raporlar.push('### Küresel makro takvim (§319) — ✗ ' + String(e.message || e).slice(0, 80) + ' — dosya korundu'); }
}

async function hmbIhale() {
  const dosya = 'hazine-sonuc.json';
  try {
    const UA = { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36', 'accept': 'application/json' };
    const r = await fetch('https://www.hmb.gov.tr/portal/v2/posts?search=' + encodeURIComponent('ihale sonuç') + '&per_page=10', { headers: UA, signal: AbortSignal.timeout(20000) });
    if (!r.ok) { raporlar.push('### Hazine ihale sonuçları (§314) — ✗ posts HTTP ' + r.status); return; }
    const posts = await r.json();
    if (!Array.isArray(posts) || !posts.length) { raporlar.push('### Hazine ihale sonuçları (§314) — ⏭ duyuru listesi boş'); return; }

    let defter = { kayitlar: {} };
    try { if (await varMi(dosya)) { const d = await oku(dosya); if (d && d.kayitlar) defter = d; } } catch (e) {}

    let pdfParse = null;
    try { pdfParse = (await import('pdf-parse')).default; }
    catch (e) { raporlar.push('### Hazine ihale sonuçları (§314) — ✗ pdf-parse yüklü değil (npm ci koştu mu?): ' + String(e.message).slice(0, 60)); return; }

    /* SS314-V2 AYRISTIRICI (SS252n: ilk kosunun ham_ozet olcumunden):
       PDF tablo hucreleri duzlesince iki kolon BITISIK geliyor -
       "Ortalama Donem:3,012,87" = teklif 3,01 | gerceklesme 2,87.
       Faiz bicimi sabit iki ondalik oldugundan ayrim deterministik.
       Gercek defter kayitlariyla test edildi. */
    const ciftAl = (m, etiket) => {
      const r = new RegExp(etiket + '[^:]{0,12}:\\s*(\\d{1,2},\\d{2})(\\d{1,3},\\d{2})');
      const x = m.match(r);
      const f = (t) => parseFloat(t.replace(',', '.'));
      return x ? { teklif: f(x[1]), gerceklesme: f(x[2]) } : null;
    };
    const tekAl = (m, rx) => { const x = m.match(rx); return x ? x[1].trim().slice(0, 60) : null; };
    const tekIhale = (m) => ({
      ihaleNo: tekAl(m, new RegExp('\u0130hale No:\\s*(\\d+)')),
      isin: tekAl(m, /ISIN Kodu:\s*([A-Z0-9]{12})/),   /* ISIN sabit 12 hane - acgozlu +, 'Ortalama'nin O'sunu yutuyordu */
      senet: tekAl(m, new RegExp('Senet Tan\u0131m\u0131:\\s*([^:]*?)(?:Ortalama|En |\u0130hra\u00e7|Vade)')),
      donemsel: ciftAl(m, 'Ortalama D\u00f6nem'),
      basit: ciftAl(m, 'Ortalama Y\u0131ll\u0131k Basit'),
      bilesik: ciftAl(m, 'Ortalama Y\u0131ll\u0131k Bile\u015fik'),
      kira: (() => { const x = m.match(/[Kk]ira[^%]{0,80}%\s*(\d{1,2},\d{2})/); return x ? parseFloat(x[1].replace(',', '.')) : null; })()
    });
    /* V2.1: bir duyuru BIRDEN COK ihale icerebilir (18 Agu = TUFE 4Y + sabit 9Y).
       Metin 'Ihale No:' sinirlariyla bloklara bolunur, her blok ayri ayristirilir.
       'Ihale No' hic yoksa (kira/dogrudan satis govdesi) tum metin tek blok. */
    /* V2.2 DUZYAZI AYRISTIRICI - kira/dogrudan satis duyurulari TABLOSUZ
       duz metin (olculdu: 4 gercek kayit). Icerde ORAN YOK - dogrudan satista
       aciklanmiyor; uydurma yok kurali geregi olani yapilandiririz:
       tutar, valor, itfa, ISIN, senet turu. */
    const duzYazi = (m) => {
      const para = (t) => { const x = m.match(t); return x ? Math.round(parseFloat(x[1].replace(/\./g, '').replace(',', '.'))) : null; };
      const doviz = /ABD [Dd]olar/.test(m) ? 'USD' : 'TL';
      const satis = para(/kar\u015f\u0131lanarak\s+([\d.]+,\d{2})/) || para(/([\d.]+,\d{2})\s*(?:TL|ABD [Dd]olar\u0131) tutar\u0131nda/);
      const tar = (rx) => { const x = m.match(rx); return x ? x[1] : null; };
      return {
        tip: 'dogrudan_satis',
        senet: tar(/(TLREFK[^ ]{0,4}ye endeksli kira sertifikas\u0131|sabit kira getirili kira sertifikas\u0131|alt\u0131na dayal\u0131 kira sertifikas\u0131|kira sertifikas\u0131|ABD dolar\u0131 cinsi Devlet tahvili)/),
        isin: tar(/([A-Z]{2}[A-Z0-9]{10})\s+ISIN kodlu/),
        tutar: satis, doviz,
        valor: tar(/(\d{1,2}\s+\S+\s+\d{4})\s+val\u00f6rl\u00fc/),
        itfa: tar(/(\d{1,2}\s+\S+\s+\d{4})\s+itfa/)
      };
    };
    const hmbAyristir = (m) => {
      const parcalar = m.split(new RegExp('(?=\u0130hale No:)')).filter(x => x.trim().length > 40);
      const bloklar = (parcalar.length ? parcalar : [m]).map(tekIhale)
        .filter(b => b.bilesik || b.donemsel || b.kira != null || b.isin);
      if (bloklar.length) return bloklar;
      const d = duzYazi(m);                       /* tablo yoksa duzyazi dene */
      return (d.isin || d.tutar) ? [d] : [];
    };
    const yeniler = [];
    for (const p of posts) {
      const slug = String(p.slug || '').slice(0, 80);
      if (!slug) continue;
      const eskiK = defter.kayitlar[slug];
      if (eskiK && eskiK.ihaleler && eskiK.ihaleler.length) continue;   /* V2: V1'in bos biraktiklari yeniden islenir */
      const html = (p.content && p.content.rendered) || '';
      const href = (html.match(/href="([^"]+\.pdf[^"]*)"/i) || [])[1] || null;
      const kayit = { tarih: String(p.date || '').slice(0, 10), baslik: String((p.title || {}).rendered || '').replace(/&#[0-9]+;/g, "'").slice(0, 140), ek: href };
      if (href) {
        try {
          const pr = await fetch(href, { headers: { 'User-Agent': UA['User-Agent'] }, signal: AbortSignal.timeout(25000) });
          if (pr.ok) {
            const buf = Buffer.from(await pr.arrayBuffer());
            kayit.dosyaAdi = href.split('/').pop().split('?')[0];
            const pd = await pdfParse(buf);
            const m = String(pd.text || '').replace(/\s+/g, ' ');
            kayit.ihaleler = hmbAyristir(m);
            /* SS314 MUHUR (18 Agu): ham_ozet penceresi kapatildi. Gorevini yapti -
               V1 bos donusunu, tablo bitisikligini, cok-ihale yapisini ve duzyazi
               sablonunu O gosterdi (uc surum onun olcumunden dogdu). Defter tam
               (10 duyuru / 15 blok / bos YOK) oldugu kosuda muhurlendi. Yeni bir
               sablon turerse ayristirma bos doner ve rapor soyler - o gun pencere
               GECICI olarak yeniden acilir. */
          } else kayit.pdf_hata = 'HTTP ' + pr.status;
        } catch (e) { kayit.pdf_hata = String(e.message || e).slice(0, 60); }
      } else {
        /* V2: PDF'siz duyuru (kira sertifikasi / dogrudan satis) - icerik govdede */
        const govde = html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
        if (govde.length > 60) { kayit.ihaleler = hmbAyristir(govde); }
        else kayit.pdf_hata = 'ek yok, govde kisa (' + govde.length + ')';
      }
      defter.kayitlar[slug] = kayit;
      yeniler.push(kayit);
    }
    /* muhur temizligi (tek seferlik calisir, sonra 0): dolu kayitlardaki eski
       ham_ozet'ler silinir - dogrulama bitti, defter kucultulur */
    let temiz = 0;
    for (const k of Object.values(defter.kayitlar)) {
      if (k.ham_ozet && k.ihaleler && k.ihaleler.length) { delete k.ham_ozet; temiz++; }
    }
    if (temiz) degisenler.push('hazine defteri muhurlendi (' + temiz + ' ham temizlendi)');
    defter.guncelleme = new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC — otomatik (§314 HMB WP-API + PDF · mühürlü)';
    defter.sayi = Object.keys(defter.kayitlar).length;
    await yaz(dosya, defter);
    if (yeniler.length) degisenler.push('hazine ihale sonuçları (+' + yeniler.length + ')');
    const oz = yeniler.map(k => {
      const cf = (x) => x ? (x.gerceklesme + ' (teklif ' + x.teklif + ')') : '-';
      const sat = (k.ihaleler || []).map(A =>
        A.tip === 'dogrudan_satis'
          ? ('\n  - ' + (A.senet || 'dogrudan satis') + ' → ' + (A.tutar != null ? (A.tutar / 1e9).toFixed(2).replace('.', ',') + ' mlr ' + A.doviz : 'tutar ?') + (A.itfa ? ' · itfa ' + A.itfa : '') + (A.isin ? ' · ' + A.isin : ''))
          : ('\n  - ' + (A.senet || '?') + ' → bilesik %' + cf(A.bilesik) + ' · donemsel %' + cf(A.donemsel) +
             (A.kira != null ? ' · kira %' + A.kira : '') + (A.isin ? ' · ' + A.isin : ''))).join('');
      return '- ' + k.tarih + ' · ' + k.baslik.slice(0, 60) + (sat || (k.pdf_hata ? '\n  - ! ' + k.pdf_hata : ''));
    }).join('\n');
    raporlar.push('### Hazine ihale sonuçları (§314) — ✓ defter ' + defter.sayi + ' duyuru · yeni ' + yeniler.length + (oz ? '\n' + oz : '\n- yeni duyuru yok'));
  } catch (e) { raporlar.push('### Hazine ihale sonuçları (§314) — ✗ ' + String(e.message || e).slice(0, 100)); }
}

async function bultenKesif() {
  if (globalThis.__bultenBakildi) return; globalThis.__bultenBakildi = 1;
  try {
    const fsp4 = await import('node:fs/promises');
    /* §253h SON İŞ GÜNÜ kuralı ve aday/sonek mantığı bultenZipGetir()'e taşındı
       (§307 ortak indirici — fiyat yedeğiyle keşif AYNI zip'i kullanır, bir
       koşuda bir indirme). Kural özü korunur: hafta sonu atlanır, 4 iş gününe
       kadar geriye bakılır, ilk inen kabul edilir. */
    const B = await bultenZipGetir();
    if (!B || B.inmedi) {
      /* Hiçbir aday inmedi. Bu ARIZA OLMAYABİLİR: resmî tatil ya da yayın
         gecikmesi. Denenen günler raporda görünsün ki ayırt edilebilsin —
         dört ardışık iş günü boşsa GERÇEK sorun vardır. */
      raporlar.push('### Bülten keşfi (§250k) — ℹ inmedi · denenen ' + (((B || {}).adaylar) || []).length +
        ' iş günü: ' + (((B || {}).adaylar) || []).join(', ') +
        '\n- ' + ((((B || {}).denenen) || []).join(' · ') || ((B || {}).hata || 'sebep yok')));
      return;
    }
    const ad = B.ad, dz = B.dz, ic = B.ic;
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
    raporlar.push('### Bülten keşfi (§250k) — ✓ ' + ad + ' indi · ' + (B.boyut / 1024).toFixed(0) + 'KB' +
      '\n- içerik: ' + ic.join(', ').slice(0, 200) + (ipucu ? '\n- endeks izi: `' + ipucu.replace(/`/g, '') + '`' : '\n- endeks izi: ilk 12 dosyada bulunamadı'));

    /* §305 FİYAT KEŞFİ — TEK KOŞULUK ÖLÇÜM, DOSYA YAZMAZ.
       18 Ağu ölçümü SONUÇLANDI: 57 kolon, KAPANIS FIYATI mevcut, tarih ISO,
       11.161 satır; THYAO örneği .AOF türev satırına denk geldi (tamamı sıfır)
       → §307 seçim kuralı bu ölçümden doğdu (tam kod + kapanış>0).
       Blok, yedek canlıda bir kez doğrulanana kadar raporda kalır. */
    try {
      for (const f of ic.slice(0, 12)) {
        if (!/\.csv$/i.test(f)) continue;
        const ham2 = await fsp4.readFile(path.join(dz, f));
        const bom2 = ham2.length > 1 && ham2[0] === 0xFF && ham2[1] === 0xFE;
        const metin = new TextDecoder(bom2 ? 'utf-16le' : 'iso-8859-9').decode(ham2);
        const satirlar = metin.split(/\r?\n/).filter(x => x.trim());
        if (satirlar.length < 2) continue;
        const baslik = satirlar[0];
        const kolonlar = baslik.split(';').map(x => x.trim());
        const fiyatAday = kolonlar.filter(k => /KAPAN|CLOS|AOF|AGIRLIKLI|ORTALAMA|FIYAT|PRICE|DUSUK|YUKSEK/i.test(k));
        /* §308 sonda: THYAO'nun TÜM varyantları + kapanışları — sonek kanıtı */
        const iKodS = kolonlar.findIndex(k => /ISLEM\s+KODU/i.test(k));
        const iKapS = kolonlar.findIndex(k => k.trim().toUpperCase() === 'KAPANIS FIYATI');
        const varyantlar = satirlar.slice(1).map(x => x.split(';'))
          .filter(a2 => /THYAO/i.test(a2[iKodS] || ''))
          .map(a2 => (a2[iKodS] || '').trim() + '=' + (a2[iKapS] || '').trim()).slice(0, 8);
        const ornek = satirlar.find(x => /^[^;]*;THYAO;/i.test(x)) || satirlar.find(x => /THYAO/i.test(x)) || null;
        raporlar.push('### Bülten fiyat keşfi (§305 · tek koşuluk ölçüm) — ' + f +
          '\n- satır: ' + satirlar.length + ' · kolon: ' + kolonlar.length +
          '\n- fiyat kolon adayları: ' + (fiyatAday.length ? fiyatAday.slice(0, 8).join(' · ') + (fiyatAday.length > 8 ? ' …' : '') : 'BULUNAMADI') +
          '\n- THYAO varyantları (kod=kapanış): ' + (varyantlar.length ? varyantlar.join(' · ') : 'yok') +
          (ornek ? '\n- örnek satır: `' + ornek.replace(/`/g, '').slice(0, 300) + '`' : ''));
        break;
      }
    } catch (e) { raporlar.push('- ⚠ §305 fiyat keşfi koşamadı: ' + String(e.message || e).slice(0, 60)); }
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
    await uyelikGoc();   /* §451: dönemsel değişimde pay_adedi'ni resmî üyeliğe hizala (Yahoo floatShares) */
    await endeksTazele('xk100.json', 'XK100 ağırlıkları');
    await endeksTazele('xktum.json', 'XKTUM ağırlıkları');
    await endeksTazele('xktmt.json', 'XKTMT ağırlıkları');
  }
  if (ister('fiyat')) {
    await fiyatTazele('multiple.json', 'Multiple fiyatları', 'k', 'fiyat', 'hisseler');
    await fiyatTazele('track.json', 'Model sicili', 't', 'p', 'holdings');
    /* SS330: sicilSeriEkle BURADAN ALINDI — endeks arsivinden SONRAYA tasindi.
       OLCULEN ARIZA (19 Agu kosusu): "Model sicili serisi (SS291) — ⏭ 2026-08-19
       icin XKTUM arsivde yok; satir yazilmadi". Sebep SIRA: sicil, XKTUM'u
       endeks-arsiv.json'dan okuyor ama o dosyayi dolduran endeksKapanisTazele
       ZINCIRDE 30 SATIR SONRA kosuyordu. Yani her kosuda sicil, O GUNUN
       endeksini goremiyor; nokta ancak ERTESI gun yazilabiliyordu — kullanicinin
       "her gun sonu hesaplansin" istegi tam burada tikaniyordu.
       DERS: BIR KATMAN BASKA KATMANIN CIKTISINI OKUYORSA, ZINCIRDE ONDAN
       SONRA GELMELI. Bagimlilik sirasi tesadufe birakilmaz (SS310'un Node ikizi). */
    await cdsTazele();
    await olcKos('Ülke kredi notu (§515)', ()=>krediNotu());   /* §515: HMB resmî tablosu — akşam + cumartesi */
    await olcKos('HKMA yedeği (§516)', ()=>hkmaYedek());   /* §516: köprünün ikinci yolu */
  }
  if (ister('risk')) {
    await riskTazele();
  }
  if (ister('fon')) {
    await olcKos('Katılım fonları', ()=>fonTazele());   /* SS326 */
  }
  if (ister('hepsi') || ister('fiyat')) {
    /* §297 DEPO HIJYENI + KALEM TAZELIGI — dosya damgasi degil KALEM olculur.
       Gerekce: track.json "taze"ydi, series 20 gun kesikti; ayrica kazara
       kopya (kok app.js · api/ajan.js) UC KEZ yasandi ve hicbiri denetime
       takilmadi. */
    try {
      const kontrol = [KURALLAR.ikizDosya()];
      try { const t = await oku('track.json');
        if (t && Array.isArray(t.series) && t.series.length && t.fiyat_tarihi)
          kontrol.push(KURALLAR.seriGuncel(t.series[t.series.length - 1].d, t.fiyat_tarihi, 4, 'track.series'));
      } catch (e) {}
      try { const fa = await oku('fon-akis.json');
        if (fa && fa.guncelleme) kontrol.push(KURALLAR.seriGuncel(fa.guncelleme, bugun, 4, 'fon-akis'));
      } catch (e) {}
      const s = denetle('Depo hijyeni + kalem tazeligi (§297)', kontrol);
      raporlar.push(s.rapor());
      if (!s.gecti) denetimDustu = true;
    } catch (e) { raporlar.push('### Depo hijyeni (§297) — ⏭ ' + String(e && e.message || e).slice(0, 60)); }
    await bilancoTetik();   /* §249a: hafta içi her koşuda */
    await endeksUyeTazele();   /* §250 */
    await endeksKapanisTazele();   /* §250a */
    /* SS330: sicil noktasi ARTIK BURADA — arsiv az once bugunun XKTUM'unu yazdi,
       yani ayni kosuda gun sonu getirisi hesaplanabilir. */
    if (ister('fiyat')) await sicilSeriEkle();   /* §291 · §330 sirasi */
    /* SS333: sektor de arsivden okur — ayni sira kurali (SS330). */
    if (ister('endeks') || ister('hepsi')) await olcKos('Sektör ısı (§333)', ()=>sektorTazele());
    await olcKos('Hazine ihale (§314)', ()=>hmbIhale());   /* SS326 */
    await olcKos('Hazine ihraç takvimi (§334)', ()=>hazineTakvimOto());
    await olcKos('Küresel makro (§319)', ()=>makroTakvim());   /* SS326 */
    await olcKos('Sektör sürücüleri (§462)', ()=>sektorSurucu());   /* §462: Neste crack + Brent → Karar Motoru hammaddesi (hepsi/fiyat → hafta içi akşam) */
    await olcKos('Sürücü serileri (§464)', ()=>surucuSeriler());   /* §464: Yahoo emtia/kur · LME (fetch→Playwright→Vercel köprüsü) · Dünya Bankası aylık xlsx → sektor-surucu.json/seriler */
    await olcKos('EVDS serileri (§466)', ()=>evdsSeriler());   /* §466: TÜFE gıda/giyim (2025=100 zincirli) · Yİ-ÜFE çimento/çelik/elektrik/gübre · KFE · AOFM/TLREF — EVDS_KEY secret; yoksa ⏭ */
    await olcKos('EPİAŞ PTF (§466)', ()=>epiasPtf()); await olcKos('EPİAŞ üretim (§546)', ()=>epiasUretim());   /* §466: GÖP saatlik PTF → günlük ort. (TL ve $) — EPIAS_* secret; yoksa ⏭. Akşam koşusu yarının fiyatını da alır (GÖP ~14:00) */
    await olcKos('ASELSAN sözleşme akışı (§467)', ()=>aselsSiparis());   /* §467: aselsan.com KAP açıklamaları → açıklanan sözleşmeler (USD, çeyrek toplamı) + resmî backlog tohumu */
    await olcKos('KAP Yeni İş İlişkisi (§469)', ()=>kapYeniIs());   /* §469: KATMR/ALTNY/GLRMK (+ASELS çapraz) ÖDA 'Yeni İş İlişkisi' → sözleşme akışı; artımlı, koşu başına ≤40 sayfa/şirket */
    await olcKos('Kardemir fiyatları (§472)', ()=>kardemirFiyat());   /* §472: kardemir.com açık API — kütük/nervürlü/profil/filmaşin liste ($,TL) + hurda alım (Özel Ekstra) 2014→; artımlı ≤100+100 sayfa/koşu; türetilmiş marj/spread */
    await olcKos('GES zinciri fiyatları (§483)', ()=>gesFiyat()); await olcKos('Elle çeyrek serileri (§484)', ()=>elleSeriler()); await olcKos('TÜİK İME (§486)', ()=>tuikIme()); await olcKos('TÜİK tablolar (§487)', ()=>tuikGenis()); await olcKos('PlasticPortal PE/PP (§488)', ()=>plasticPortal()); await olcKos('DCE polimer (§489)', ()=>dceFiyat());   /* §483: InfoLink haftalık spot (polisilikon/wafer/hücre/modül) + Wayback geriye doldurma ≤40 görüntü/koşu → CWENE/GESAN */
    await olcKos('SUT endeksi (§474)', ()=>sutEndeks());   /* §474: SUT/TTB adım tabloları → endeks + reel (÷TÜFE) · Resmî Gazete fihrist izleyici (son 14 gün) → MPARK */
    await olcKos('Faktör evreni (§361)', ()=>faktorEvren());
    await olcKos('Multiple kendi verimizden (§496)', ()=>multipleKendi());   /* §496: faktör evreninin KAP TTM'i → multiple.json (Fintables yok) */   /* SS361: kademeli KAP çekimi */
    await olcKos('Faktör skorları (§455)', ()=>fmHesapla());   /* §455: Koyfin'siz fm.json — kendi bilanço + fiyatımızdan */
    await olcKos('Faktör karnesi (§529)', ()=>fmKarneUret(FM_PX_SON));   /* §529: nokta-zaman skor → sonraki getiri · sicil ayrıştırması */
    await olcKos('Toparlanma monitörü (§530)', ()=>toparlanmaUret(FM_PX_SON));   /* §530: genişlik · Zweig itkisi · kapitülasyon · RV20 · CDS · dönüş sepeti */
    await olcKos('Dış getiri eğrileri (§536)', ()=>egriDisUlke());   /* §536: MOF JGB + ECB AAA spot → egri-dis.json */
    await olcKos('Kamu yatırım nabzı (§533)', ()=>kamuYatirim());   /* §533: HMB bütçe gerçekleşmesi (SBB haftalık) + 2027 bütçe çerçevesi */
    await olcKos('Karar evreni XK050 (§531)', ()=>kararEvren());   /* §531: XK050 üyeliği → katalog · fiyat/sermaye/bilanço tarihi · KAP arşiv önceliği (arşivden ÖNCE) */
    await olcKos('KAP arşivi (§381)', ()=>kapArsiv());   /* SS381: 15 ceyrek ham arsiv */
    await olcKos('PD/DD bandı (§539)', ()=>degerlemeKendi());   /* §539: degerleme.json kendi verimizden (KAP özkaynak + Yahoo) — arşivden SONRA */
    await olcKos('Karar modeli gerçekleri (§462b/§463)', ()=>kararOrneklem()); await olcKos('Karar modeli nakit akışı + net borç (§550)', ()=>kararNakit());
    await olcKos('Ton başına FAVÖK (§499)', ()=>tonBasina());   /* §499: KAP arşivi çekirdek FAVÖK ÷ faaliyet raporu tonajı (EREGL/KRDMD) */   /* KAP arşivinden SONRA — bilanço düşünce gerçek FAVÖK kataloğa girer (SS310 sıra kuralı) */
    await olcKos('GYO NAV (§364)', ()=>gyoNav());   /* SS364: TSPB resmi NAD */
    await olcKos('VAP fon akışı (§366)', ()=>vapFonAkis());   /* SS366: MKK resmi saklama verisi */
    await olcKos('Bülten keşfi', ()=>bultenKesif());   /* SS326 */   /* §250k: günlük tarihsel için keşif */
  }
  /* §429d: hepsi/fiyat bloğunun DIŞINDA — tek başına --katman=fonportfoy da koşsun (canlı #181: blok içindeydi, 'değişiklik yok' bitti) */
  if (ister('fonportfoy')) await olcKos('Fon portföy dağılımı (§429)', ()=>fonPortfoy());
  if (KSET.has('egri')) await olcKos('Dış getiri eğrileri (§536)', ()=>egriDisUlke());   /* elle: --katman=egri */
  if (KSET.has('karar') || KSET.has('kamuyatirim')) await olcKos('Kamu yatırım nabzı (§533)', ()=>kamuYatirim());   /* elle: --katman=kamuyatirim */
  if (KSET.has('karar') || KSET.has('kaparsiv')) await olcKos('Karar evreni XK050 (§531)', ()=>kararEvren());   /* elle: --katman=karar (kaparsiv ile birlikte: önce öncelik, sonra arşiv) */
  if (KSET.has('kaparsiv')) await olcKos('KAP arşivi (§381 · hızlı §437)', ()=>kapArsiv());
  if (KSET.has('kaparsiv')) await olcKos('Karar modeli gerçekleri (§462b/§463)', ()=>kararOrneklem()); await olcKos('Karar modeli nakit akışı + net borç (§550)', ()=>kararNakit());
  if (KSET.has('kaparsiv') || KSET.has('degerleme')) await olcKos('PD/DD bandı (§539)', ()=>degerlemeKendi());   /* elle: --katman=degerleme */
  if (KSET.has('kaparsiv') || KSET.has('multiple')) await olcKos('Ton başına FAVÖK (§499)', ()=>tonBasina());
  if (KSET.has('surucu')) { await olcKos('Sektör sürücüleri (§462)', ()=>sektorSurucu()); await olcKos('Sürücü serileri (§464)', ()=>surucuSeriler()); await olcKos('EVDS serileri (§466)', ()=>evdsSeriler()); await olcKos('EPİAŞ PTF (§466)', ()=>epiasPtf()); await olcKos('EPİAŞ üretim (§546)', ()=>epiasUretim()); await olcKos('ASELSAN sözleşme akışı (§467)', ()=>aselsSiparis()); await olcKos('KAP Yeni İş İlişkisi (§469)', ()=>kapYeniIs()); await olcKos('Kardemir fiyatları (§472)', ()=>kardemirFiyat()); await olcKos('SUT endeksi (§474)', ()=>sutEndeks()); await olcKos('GES zinciri fiyatları (§483)', ()=>gesFiyat()); await olcKos('Elle çeyrek serileri (§484)', ()=>elleSeriler()); await olcKos('TÜİK İME (§486)', ()=>tuikIme()); await olcKos('TÜİK tablolar (§487)', ()=>tuikGenis()); await olcKos('PlasticPortal PE/PP (§488)', ()=>plasticPortal()); await olcKos('DCE polimer (§489)', ()=>dceFiyat()); await olcKos('Karar modeli gerçekleri (§462b/§463)', ()=>kararOrneklem()); await olcKos('Karar modeli nakit akışı + net borç (§550)', ()=>kararNakit()); }   /* elle: --katman=surucu */
  if (KSET.has('kamu')) { await olcKos('EVDS serileri (§466)', ()=>evdsSeriler()); await olcKos('EPİAŞ PTF (§466)', ()=>epiasPtf()); await olcKos('EPİAŞ üretim (§546)', ()=>epiasUretim()); await olcKos('ASELSAN sözleşme akışı (§467)', ()=>aselsSiparis()); await olcKos('KAP Yeni İş İlişkisi (§469)', ()=>kapYeniIs()); await olcKos('Kardemir fiyatları (§472)', ()=>kardemirFiyat()); await olcKos('SUT endeksi (§474)', ()=>sutEndeks()); await olcKos('GES zinciri fiyatları (§483)', ()=>gesFiyat()); await olcKos('Elle çeyrek serileri (§484)', ()=>elleSeriler()); await olcKos('TÜİK İME (§486)', ()=>tuikIme()); await olcKos('TÜİK tablolar (§487)', ()=>tuikGenis()); await olcKos('PlasticPortal PE/PP (§488)', ()=>plasticPortal()); await olcKos('DCE polimer (§489)', ()=>dceFiyat()); }   /* elle: --katman=kamu — TCMB EVDS + EPİAŞ + ASELSAN + KAP yeni iş + Kardemir + SUT (ilk koşu birkaç dk) */
  if (KSET.has('tuik')) { await olcKos('TÜİK İME (§486)', ()=>tuikIme()); await olcKos('TÜİK tablolar (§487)', ()=>tuikGenis()); await olcKos('PlasticPortal PE/PP (§488)', ()=>plasticPortal()); await olcKos('DCE polimer (§489)', ()=>dceFiyat()); }   /* elle: --katman=tuik — TÜİK İME + geniş tablolar + PlasticPortal (Playwright yalnız hepsi/fon koşusunda kurulu) */
  if (KSET.has('kredinotu') && !ister('fiyat')) await olcKos('Ülke kredi notu (§515)', ()=>krediNotu());   /* elle: --katman=kredinotu */
  if (KSET.has('ges')) await olcKos('GES zinciri fiyatları (§483)', ()=>gesFiyat());   /* elle: --katman=ges — yalnız InfoLink + Wayback (geriye doldurma ~1,5 dk/koşu, 5 koşuda tamam) */
  if (KSET.has('kardemir')) await olcKos('Kardemir fiyatları (§472)', ()=>kardemirFiyat());   /* elle: --katman=kardemir — yalnız Kardemir açık API (geriye doldurma ~2 dk/koşu) */
  if (KSET.has('fm')) await olcKos('Faktör skorları (§455)', ()=>fmHesapla());
  if (KSET.has('fm') || KSET.has('fmkarne')) await olcKos('Faktör karnesi (§529)', ()=>fmKarneUret(KSET.has('fm') ? FM_PX_SON : null));   /* elle: --katman=fmkarne (fiyatları kendisi çeker) */
  if (KSET.has('fm') || KSET.has('toparlanma')) await olcKos('Toparlanma monitörü (§530)', ()=>toparlanmaUret(KSET.has('fm') ? FM_PX_SON : null));   /* elle: --katman=toparlanma */
  if (KSET.has('fm') || KSET.has('multiple')) await olcKos('Multiple kendi verimizden (§496)', ()=>multipleKendi());   /* elle: --katman=multiple */   /* elle: --katman=fm */
  /* §448 SEC ticker yedeği: Cumartesi (hepsi) SEC'den company_tickers.json'u alıp repoya yazar; Vercel'in
     SEC'e erişimi engellenirse edgar.js bu yedeği okur. GitHub runner'ı SEC engelliyorsa rapor söyler. */
  if (ister('hepsi')) await olcKos('SEC ticker yedeği (§448)', async () => {
    try { const r = await fetch('https://www.sec.gov/files/company_tickers.json', { headers: { 'User-Agent': process.env.EDGAR_UA || 'KTPanel/1.0 (kisisel arastirma; github actions)', 'Accept': 'application/json' }, signal: AbortSignal.timeout(30000) });
      if (!r.ok) { const g = (await r.text()).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 120); raporlar.push('### SEC ticker yedeği (§448) — ✗ HTTP ' + r.status + (g ? ' · "' + g + '"' : '')); return; }
      const j = await r.json(); const n = Object.keys(j || {}).length; if (n < 1000) { raporlar.push('### SEC ticker yedeği (§448) — ✗ ' + n + ' kayıt (eşik 1000)'); return; }
      await yaz('sec-tickers.json', j); raporlar.push('### SEC ticker yedeği (§448) — ✓ ' + n + ' kayıt'); degisenler.push('sec-tickers');
    } catch (e) { raporlar.push('### SEC ticker yedeği (§448) — ✗ ' + String(e.message || e).slice(0, 60)); }
  });

  raporlar.push(
    `\n---\n**Sonuç:** ${degisenler.length ? degisenler.join(' · ') : 'değişiklik yok'}` +
    (denetimDustu ? '\n\n⚠ **Bir ya da daha fazla katman denetimden geçemedi — o katmanlar YAZILMADI.**' : '')
  );

  /* Rapor REPO kökünde — iş akışı onu okuyup özete basıyor. Veri dizini
     alt klasörde olsa bile rapor yeri değişmez. */
  await fs.mkdir(path.join(process.cwd(), 'rapor'), { recursive: true });
  if (sureRapor.length || butceAsildi) {
    raporlar.push('### Süre bütçesi (§326)\n' + (sureRapor.join('\n') || '- tüm katmanlar 60 sn altında') +
      (butceAsildi ? '\n- ⚠ TOPLAM BÜTÇE AŞILDI (11 dk) — kalan katmanlar ATLANDI. İş yeşil bitti; eksikler yukarıda listeli. Sonraki koşu kaldığı yerden tamamlar.' : '') +
      '\n- toplam: ' + Math.round((Date.now() - SURE_BASLA) / 1000) + ' sn');
  }
  await fs.writeFile(path.join(process.cwd(), 'rapor/son-tazeleme.md'), raporlar.join('\n\n'), 'utf8');

  const cikti = process.env.GITHUB_OUTPUT;
  if (cikti) {
    await fs.appendFile(cikti,
      `degisti=${degisenler.length ? 1 : 0}\n` +
      `ozet=${degisenler.join(', ').slice(0, 100) || 'değişiklik yok'}\n` +
      `denetim=${denetimDustu ? 'basarisiz' : 'basarili'}\n`);
  }
  console.log(raporlar.join('\n\n'));
  /* SS326b: rapor yazildi ve konsola basildi. Playwright/asili fetch gibi arka
     plan isleri event loop'u tutup Actions'i bekletmesin diye betik BURADA
     kesin biter. Kod 0 — veri yazildi, is yesil. */
  setTimeout(() => process.exit(0), 250);
})();
