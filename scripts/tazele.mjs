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
      if (nA) raporlar.push('### TEFAS genel bilgi (§253i) — ✓ ' + nA + ' fon · AUM + yatırımcı sayısı köprüden'
        + ' (ham ' + dizi.length + ' kayıt, sayfalamalı)');
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
  const _ayniGun = String(d.fiyat_tarihi || '') === String(bugun);
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
  if (_ayniGun) raporlar.push('### Katılım fonları — ℹ aynı gün tekrar koşu: fiyat/AUM tazelendi, 1G ve akış KORUNDU (§266)');
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
        eskiKodlar = Array.isArray(d.kodlar) ? d.kodlar.filter(k => /^[A-Z]{4,6}$/.test(String(k))) : [];
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
    const kodlar = [...birlesikSet].sort();
    kodlar.forEach(k => { if (!ilkGorulme[k]) ilkGorulme[k] = bugun; });

    /* 4) Borcun yaşı — en eski bekleyen kaç gündür defterde */
    const yas = k => Math.round((new Date(bugun) - new Date(ilkGorulme[k])) / GUN);
    const enEski = kodlar.length ? kodlar.slice().sort((a, b) => yas(b) - yas(a))[0] : null;

    await yaz(dosya, { tarih: bugun, kodlar, sayi: kodlar.length, ilk_gorulme: ilkGorulme,
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
      /* sonraki yayin: donemin SON ayindan bir sonraki ayin ~25'i */
      const sonAyIdx = AYLAR.indexOf(bulunanAylar[bulunanAylar.length - 1]);
      const sonrakiAy = AYLAR[(sonAyIdx + 1) % 12];
      const s1 = AYLAR[(sonAyIdx + 1) % 12], s3 = AYLAR[(sonAyIdx + 3) % 12];
      d.sonraki_aciklama = '~25 ' + sonrakiAy + ' (' + s1.slice(0, 3) + '–' + s3.slice(0, 3) + ' stratejisi)';
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
  for (let deneme = 0; deneme < 2; deneme++) {
    try {
      const r = await fetch('https://ktpanel.vercel.app/api/kap?mod=donemler&kod=' + kod + '&yil=' + y,
        { signal: AbortSignal.timeout(25000) });
      const j = await r.json();
      if (j && j.ok && (j.donemler || []).length) { sonuc = j; break; }
      sonuc = j || sonuc;
    } catch (e) { sonuc = { ok: false, donemler: [], err: String(e && e.message || e).slice(0, 40) }; }
    if (deneme === 0) await new Promise(r => setTimeout(r, 2500));
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
async function kapArsiv() {
  const KLASOR = 'kap-arsiv';
  /* §383b PARTİ 2 + UZUN BEKLEME: faktör evreni (§361) aynı koşuda KAP'ı
     zaten kullanıyor; arşiv arkasından gelince "fetch failed" alıyordu.
     Artık faktör ham tabloları arşive KENDİSİ yazıyor (§383), bu modül
     yalnız ESKİ çeyrekleri tamamlıyor — az sayıda, yavaş, sabırlı. */
  const PARTI = 2;
  const CEYREK_TAVAN = 15;
  const TABAN = 'https://ktpanel.vercel.app/api/kap';
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
  const oncelik = (k) => tetik.includes(k) ? 0 : (xk030.includes(k) ? 1 : (xk100.includes(k) ? 2 : 3));
  /* §382b BELLEKTE OLANI TERCİH ET: faktör evreni (§361) bu koşuda zaten
     bazı şirketlerin dönem listesini çekti. Arşiv onları seçerse liste
     BEDAVA gelir — yeni KAP isteği yok. Aynı öncelik grubunda, listesi
     bellekte olan şirket öne alınır. */
  const bellekte = (k) => (_DONEM_BELLEK.has(k+'|4') || _DONEM_BELLEK.has(k+'|2')) ? 0 : 1;
  const sira = durum.filter(x => x.n < CEYREK_TAVAN)
    .sort((a, b) => (oncelik(a.kod) - oncelik(b.kod)) || (bellekte(a.kod) - bellekte(b.kod)) || (a.n - b.n))
    .slice(0, PARTI);
  if (!sira.length) {
    raporlar.push('### KAP arşivi (§381) — ✓ TAM: ' + uyeler.length + ' şirket × ' + CEYREK_TAVAN + ' çeyrek');
    return;
  }
  await new Promise(r => setTimeout(r, 30000));   /* §383b: KAP dinlensin */
  let eklenen = 0, yeniSirket = 0, dusen = 0;
  const notlar = [];
  for (const { kod, n: mevcut } of sira) {
    try {
      const jd = await kapDonemler(kod, 4);            /* §382: koşu-içi önbellek */
      const donemler = (jd && jd.ok && jd.donemler) ? jd.donemler.slice(0, CEYREK_TAVAN) : [];
      if (!donemler.length) { dusen++; notlar.push(kod + ':' + ((jd && (jd.err || (jd.hatalar||[])[0])) || 'dönem yok')); await uyku(2500); continue; }
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
          const rh = await fetch(TABAN + '?mod=ham&id=' + bid, { signal: AbortSignal.timeout(30000) });
          const jh = await rh.json();
          if (jh && jh.ok && (jh.tablolar || []).length) {
            D.donemler[anahtar] = { id: String(bid), birim: jh.birim || null, tablolar: jh.tablolar };
            eklenen++; buTur++;
          }
        } catch (e) {}
        await uyku(2500);
        if (buTur >= 4) break;                             /* koşu başına şirket sınırı */
      }
      D.guncelleme = new Date().toISOString().slice(0, 19) + 'Z';
      D.ceyrek = Object.keys(D.donemler).length;
      await fs.writeFile(path.join(KOK, KLASOR, kod + '.json'), JSON.stringify(D), 'utf8');
      notlar.push(kod + ':' + mevcut + '→' + D.ceyrek);
      await uyku(2500);
    } catch (e) { dusen++; notlar.push(kod + ':' + String(e && e.message || e).slice(0, 20)); await uyku(2500); }
  }
  const tamam = durum.filter(x => x.n >= CEYREK_TAVAN).length;
  degisenler.push('KAP arşivi (+' + eklenen + ' çeyrek)');
  raporlar.push('### KAP arşivi (§381) — ✓ +' + eklenen + ' çeyrek · ' + tamam + '/' + uyeler.length + ' şirket tam' +
    (yeniSirket ? (' · ' + yeniSirket + ' yeni dosya') : '') +
    (notlar.length ? ('\n- ' + notlar.slice(0, 6).join(' · ')) : '') +
    '\n- öncelik: bilanço tetiği → XK030 → XK100 → kalanlar (en çok bakılan önce dolar)' +
    (dusen ? ('\n- ' + dusen + ' düştü') : '') +
    '\n- ⓘ Ham tablolar `' + KLASOR + '/<KOD>.json` içinde, şirket başına en fazla ' + CEYREK_TAVAN +
    ' çeyrek. Yayımlanmış bildirim değişmediği için bir kez yazılır; panel KAP yerine buradan okuyabilir (15 istek → 1).');
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
  const sira = uyeler.slice().sort((a, b) => {
    const ta = tetikKodlar.includes(a) ? 0 : 1, tb = tetikKodlar.includes(b) ? 0 : 1;
    if (ta !== tb) return ta - tb;
    return yas(a) - yas(b);
  }).slice(0, PARTI_BOY);

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
    ticariBorc: 'kap-fr_CurrentTradePayables'
  };
  let basarili = 0, eksikli = 0, dusen = 0, arsivYazilan = 0;
  const notlar = [];

  let ardisikHata = 0;
  for (const kod of sira) {
    if (ardisikHata >= ARDISIK_TAVAN) {
      notlar.push('⏹ devre kesici: ' + ARDISIK_TAVAN + ' ardışık hata, tur erken bitti');
      break;
    }
    try {
      const jd = await kapDonemler(kod, 2);            /* §382: ortak koşu-içi önbellek */
      const donemler = (jd && jd.ok && jd.donemler) ? jd.donemler.slice(0, 5) : [];   /* §361d: son yıllık (4Ç) mutlaka kapsansın */
      if (donemler.length < 2) {
        dusen++;
        const sbp = (jd && (jd.err || (jd.hatalar && jd.hatalar[0]))) || 'liste boş';
        notlar.push(kod + ':' + String(sbp).slice(0, 26));
        ardisikHata++;
        await uyku(3000); continue;
      }

      const kalemler = [];
      for (const dn of donemler) {
        /* §361b ALAN ADI HATASI (canlı ölçüm): mod=donemler çıktısı
           {yil, donem, id, kod} döndürüyor — `disclosureIndex` DEĞİL. Kodum o
           adı arıyordu, id=undefined ile istek atıyordu. Dönem listesi gelse
           bile ham çekim patlardı. DERS: UCUN GERÇEK ÇIKTISINI GÖR, ALAN ADI
           TAHMİN ETME. */
        const bid = dn.id || dn.disclosureIndex;
        if (!bid) { kalemler.push(null); continue; }
        const rh = await fetch(TABAN + '?mod=ham&id=' + bid, { signal: AbortSignal.timeout(30000) });
        const jh = await rh.json();
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
        adet_kaynak: 'sermaye(nominal 1₺ varsayımı)'
      };
      const bosSay = ['ciro', 'favok', 'ozk', 'aktif'].filter(x => !Number.isFinite(kayit[x])).length;
      kayit.eksik = bosSay > 0;
      if (kayit.eksik) { eksikli++; notlar.push(kod + ':' + bosSay + ' ana kalem boş'); } else basarili++;
      ardisikHata = 0;                              /* §363b: başarı zinciri sıfırlar */
      D.sirketler[kod] = kayit;
      await uyku(3000);
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
    await olcKos('Faktör evreni (§361)', ()=>faktorEvren());   /* SS361: kademeli KAP çekimi */
    await olcKos('KAP arşivi (§381)', ()=>kapArsiv());   /* SS381: 15 ceyrek ham arsiv */
    await olcKos('GYO NAV (§364)', ()=>gyoNav());   /* SS364: TSPB resmi NAD */
    await olcKos('VAP fon akışı (§366)', ()=>vapFonAkis());   /* SS366: MKK resmi saklama verisi */
    await olcKos('Bülten keşfi', ()=>bultenKesif());   /* SS326 */   /* §250k: günlük tarihsel için keşif */
  }

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
