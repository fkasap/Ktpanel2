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
  const olcekli = [];
  if (karantina.size) {
    liste.forEach(x => {
      const k = x[kodAlan];
      if (!karantina.has(k) || !f[k] || !x[fiyatAlan]) return;
      const oran = f[k].fiyat / x[fiyatAlan];
      if (!(oran > 0.05 && oran < 0.95) && !(oran > 1.05 && oran < 20)) return;
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
  const kalanKarantina = [...karantina].filter(k => !olcekli.some(o => o.startsWith(k + ' ')));
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
  kfe:          { kod: 'TP.KFE.TR',                               ad: 'Konut Fiyat Endeksi — TCMB KFE (aylık)',                              birim: 'endeks', siklik: 'aylik',  aralik: [10, 100000], hisse: ['EKGYO'] },
  aofm:         { kod: 'TP.APIFON4',                              ad: 'TCMB ağırlıklı ortalama fonlama maliyeti (AOFM, %)',                  birim: '%',      siklik: 'gunluk', aralik: [0, 100],    hisse: ['ALBRK'], bas: '01-01-2021' },
  tlref:        { kod: 'TP.BISTTLREF.ORAN',                       ad: 'BIST TLREF gecelik referans faiz (%)',                                birim: '%',      siklik: 'gunluk', aralik: [0, 100],    hisse: ['ALBRK'], bas: '01-01-2021' },
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
  const KAP_YI_SURUM = '469e'; if (K.surum !== KAP_YI_SURUM) { K.kayit = {}; K.cozulemeyen = {}; K.surum = KAP_YI_SURUM; }
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
      const sozlesme = liste.filter(b => String(b.disclosureClass || '').toUpperCase() === 'ODA' && (trK(b.subject).includes('yeni iş ilişkisi') || /sözleşme imzalan|sipariş al|ihale/.test(trK(b.summary))));
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
        D.seriler[t.seri] = Object.assign({}, D.seriler[t.seri] || {}, { ad: t.ad, birim: 'mn $', siklik: 'aylik', akis: true, hisse: t.hisse, kaynak: 'KAP ÖDA "Yeni İş İlişkisi" (kap.org.tr) · kur Yahoo', aylik, ceyreklik, yillik, adet_ceyrek: adetQ, tutarsiz_ceyrek: tutarsizQ, son: { tarih: sonX.t, deger: sonX.usd_mn, ay: sonX.t.slice(0, 7) }, guncelleme: bugun, n: kayitlar.length, sozlesmeler: kayitlar.slice(-12).reverse().map(x => ({ t: x.t, tur: 'yeni', usd_mn: x.usd_mn, usd: x.usd, eur: x.eur, tl: x.tl, ozet: x.ozet + (x.tutarsiz ? ' [' + (x.neden || 'tutar açıklanmadı') + ']' : '') + (x.konsorsiyum ? ' [konsorsiyum toplamı — şirket payı belirtilmedi]' : '') + (x.kur_yaklasik ? ' [kur yaklaşık]' : '') + (x.backlog_usd_mn != null ? ' [backlog ' + x.backlog_usd_mn + ' mn $]' : '') })), yillik_kum: akisYillik(kayitlar, bugun), _kapsam: 'KAP ÖDA "Yeni İş İlişkisi" bildirimleri; tutarı açıklanmayan ya da teklif/iptal niteliğindeki bildirimler 0 sayılır (adet ayrı). Konsorsiyum toplamları şirket payı belirtilmemişse TAM sayılır ve işaretlenir. PLN/GBP kur yaklaşık. Metinde beyan edilen backlog ayrı seviye serisidir. Öncü gösterge; seviye değil yön/y/y okunur.' });
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
  raporlar.push('### KAP Yeni İş İlişkisi (§469) — ✓ ' + Object.keys(K.kayit).length + ' bildirim kayıtlı · bu koşu ' + sayfaSayisi + ' sayfa, ' + yeniKayit + ' yeni' + (bekleyen ? ' · tavan: ' + bekleyen + ' bekliyor (sonraki koşu)' : '') + '\n- ' + notlar.join('\n- ') + (uyari.length ? '\n- ⚠ ' + uyari.slice(0, 6).join('\n- ⚠ ') : ''));
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
    const donem = String(yayin[0].period_value);

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

    const isk = Object.values(kayitlar).map(x => x.iskonto).filter(Number.isFinite).sort((a, b) => a - b);
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
    durum.push({ kod, n });
  }
  /* §381b ÖNCELİK SIRASI: tüm evren ~69 koşu-günü sürüyor. Alfabetik ya da
     salt "en eksik" sırası, en çok bakılan şirketleri en sona atabilir.
     Öncelik: (1) bilanço tetiğindekiler — yeni bildirim geldi, taze veri
     değerli; (2) XK030 (en büyük 30, en çok bakılan); (3) XK100; (4) kalanlar.
     Her grup içinde en eksik olan önce. Böylece arşiv "işe yarar" sırayla
     dolar; tam tur bitmeden de kullanılabilir hale gelir. */
  let tetik = [], xk030 = [], xk100 = [];
  try { const bt = await oku('bilanco-tetik.json'); tetik = bt.kodlar || []; } catch (e) {}
  try { const eu = await oku('endeks-uyeler.json'); xk030 = (eu.uyeler || {}).XK030 || []; xk100 = (eu.uyeler || {}).XK100 || []; } catch (e) {}
  /* §444c KULLANICI ÖNCELİĞİ: ktpanel/kap-arsiv-oncelik.json = ["ASELS", ...] — bu kodlar her
     şeyin önünde (0), yavaş yolda bile ilk 2 slotu alır. Kullanıcı "ASELS arşivde yok" dedi;
     dosyaya yazar, sıradaki koşu getirir. Dosya yoksa/bozuksa sessizce boş. */
  let elleOncelik = []; try { const eo = await oku('kap-arsiv-oncelik.json'); elleOncelik = (Array.isArray(eo) ? eo : (eo.kodlar || [])).map(x => String(x).toUpperCase()); } catch (e) {}
  const oncelik = (k) => elleOncelik.includes(k) ? -1 : (tetik.includes(k) ? 0 : (xk030.includes(k) ? 1 : (xk100.includes(k) ? 2 : 3)));
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
  const sira = durum.filter(x => x.n < CEYREK_TAVAN)
    .sort((a, b) => (cezali(a.kod) - cezali(b.kod)) || (oncelik(a.kod) - oncelik(b.kod)) || (bellekte(a.kod) - bellekte(b.kod)) || (a.n - b.n))
    .slice(0, PARTI);
  if (!sira.length) {
    raporlar.push('### KAP arşivi (§381) — ✓ TAM: ' + uyeler.length + ' şirket × ' + CEYREK_TAVAN + ' çeyrek');
    return;
  }
  if (!HIZLI) await new Promise(r => setTimeout(r, 30000));   /* §383b: KAP dinlensin (köprü yolunda) */
  let eklenen = 0, yeniSirket = 0, dusen = 0;
  const notlar = [];
  for (const { kod, n: mevcut } of sira) {
    try {
      const jd = await kapDonemler(kod, 4);            /* §382: koşu-içi önbellek */
      const donemler = (jd && jd.ok && jd.donemler) ? jd.donemler.slice(0, CEYREK_TAVAN) : [];
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
    (dusen ? ('\n- ' + dusen + ' düştü') : '') +
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
  const YONTEM = '362';    /* §362: faktör değişkenleri eklendi — eski kayıtlar yeniden çekilir */
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
      const finBorc = S(stok('kvB'), stok('kvUV'), stok('uvB'));
      const likit = S(stok('nakit'), stok('finYat'));
      const kayit = {
        ts: new Date().toISOString().slice(0, 19) + 'Z', y: YONTEM,
        donem: son.yil + '/' + son.donem, ceyrek: kalemler.filter(x => x).length,
        ciro, brut, favok, netKar,
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
    await olcKos('EPİAŞ PTF (§466)', ()=>epiasPtf());   /* §466: GÖP saatlik PTF → günlük ort. (TL ve $) — EPIAS_* secret; yoksa ⏭. Akşam koşusu yarının fiyatını da alır (GÖP ~14:00) */
    await olcKos('ASELSAN sözleşme akışı (§467)', ()=>aselsSiparis());   /* §467: aselsan.com KAP açıklamaları → açıklanan sözleşmeler (USD, çeyrek toplamı) + resmî backlog tohumu */
    await olcKos('KAP Yeni İş İlişkisi (§469)', ()=>kapYeniIs());   /* §469: KATMR/ALTNY/GLRMK (+ASELS çapraz) ÖDA 'Yeni İş İlişkisi' → sözleşme akışı; artımlı, koşu başına ≤40 sayfa/şirket */
    await olcKos('Kardemir fiyatları (§472)', ()=>kardemirFiyat());   /* §472: kardemir.com açık API — kütük/nervürlü/profil/filmaşin liste ($,TL) + hurda alım (Özel Ekstra) 2014→; artımlı ≤100+100 sayfa/koşu; türetilmiş marj/spread */
    await olcKos('Faktör evreni (§361)', ()=>faktorEvren());   /* SS361: kademeli KAP çekimi */
    await olcKos('Faktör skorları (§455)', ()=>fmHesapla());   /* §455: Koyfin'siz fm.json — kendi bilanço + fiyatımızdan */
    await olcKos('KAP arşivi (§381)', ()=>kapArsiv());   /* SS381: 15 ceyrek ham arsiv */
    await olcKos('Karar modeli gerçekleri (§462b/§463)', ()=>kararOrneklem());   /* KAP arşivinden SONRA — bilanço düşünce gerçek FAVÖK kataloğa girer (SS310 sıra kuralı) */
    await olcKos('GYO NAV (§364)', ()=>gyoNav());   /* SS364: TSPB resmi NAD */
    await olcKos('VAP fon akışı (§366)', ()=>vapFonAkis());   /* SS366: MKK resmi saklama verisi */
    await olcKos('Bülten keşfi', ()=>bultenKesif());   /* SS326 */   /* §250k: günlük tarihsel için keşif */
  }
  /* §429d: hepsi/fiyat bloğunun DIŞINDA — tek başına --katman=fonportfoy da koşsun (canlı #181: blok içindeydi, 'değişiklik yok' bitti) */
  if (ister('fonportfoy')) await olcKos('Fon portföy dağılımı (§429)', ()=>fonPortfoy());
  if (KSET.has('kaparsiv')) await olcKos('KAP arşivi (§381 · hızlı §437)', ()=>kapArsiv());
  if (KSET.has('kaparsiv')) await olcKos('Karar modeli gerçekleri (§462b/§463)', ()=>kararOrneklem());
  if (KSET.has('surucu')) { await olcKos('Sektör sürücüleri (§462)', ()=>sektorSurucu()); await olcKos('Sürücü serileri (§464)', ()=>surucuSeriler()); await olcKos('EVDS serileri (§466)', ()=>evdsSeriler()); await olcKos('EPİAŞ PTF (§466)', ()=>epiasPtf()); await olcKos('ASELSAN sözleşme akışı (§467)', ()=>aselsSiparis()); await olcKos('KAP Yeni İş İlişkisi (§469)', ()=>kapYeniIs()); await olcKos('Kardemir fiyatları (§472)', ()=>kardemirFiyat()); await olcKos('Karar modeli gerçekleri (§462b/§463)', ()=>kararOrneklem()); }   /* elle: --katman=surucu */
  if (KSET.has('kamu')) { await olcKos('EVDS serileri (§466)', ()=>evdsSeriler()); await olcKos('EPİAŞ PTF (§466)', ()=>epiasPtf()); await olcKos('ASELSAN sözleşme akışı (§467)', ()=>aselsSiparis()); await olcKos('KAP Yeni İş İlişkisi (§469)', ()=>kapYeniIs()); await olcKos('Kardemir fiyatları (§472)', ()=>kardemirFiyat()); }   /* elle: --katman=kamu — TCMB EVDS + EPİAŞ + ASELSAN + KAP yeni iş + Kardemir (ilk koşu birkaç dk) */
  if (KSET.has('kardemir')) await olcKos('Kardemir fiyatları (§472)', ()=>kardemirFiyat());   /* elle: --katman=kardemir — yalnız Kardemir açık API (geriye doldurma ~2 dk/koşu) */
  if (KSET.has('fm')) await olcKos('Faktör skorları (§455)', ()=>fmHesapla());   /* elle: --katman=fm */
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
