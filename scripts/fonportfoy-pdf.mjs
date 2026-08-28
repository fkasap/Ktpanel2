/* ── §429 KAP "Portföy Dağılım Raporu" PDF ayrıştırıcısı ──────────────────────
   GİRDİ: `pdftotext -layout` çıktısı (metin). PDF'in kendisi değil — düzen
   korunmuş metin. pdfjs/pdf-parse sütun hizasını bozduğu için poppler kullanılır.
   ÖLÇÜLDÜ (KPU_2026.07.pdf, 120 sayfa, Infleks/iText şablonu):
     III-FON PORTFÖY DEĞERİ TABLOSU → HİSSE SENETLERİ → satırlar → GRUP TOPLAMI
     Satır: KOD  TL  ihraççı(çok satıra sarar)  NOMİNAL  ALIŞ_F  ALIŞ_T  [taahhüt no]
            BORSA_F  TOPLAM_DEĞER  GRUP%  FPD%  FTD%
     Aynı kod birden çok satır olabilir (lot; NEGATİF satır = T+2 bekleyen satış).
     Kod bazında NETLENİR. Ağırlık = FTD% (fon toplam değerine göre) toplamı.
   Ayrıca V/VI bölümleri: A) HİSSE SENETLERİ(SATIŞLAR) / (ALIŞLAR) — ay içi işlemler.
     Satır: KOD  ihraççı  dd/mm/yy  FİYAT  İŞLEM_DEĞERİ  NOMİNAL
   DENETİM: grup % toplamı 100±0,5 · değer toplamı GRUP TOPLAMI ±%0,1 · en az 5 kod.
   Şablon değişirse ayrıştırıcı SESSİZCE değil GÜRÜLTÜLÜ düşer (denetim). */

const sayi = s => { if (s == null) return null; const t = String(s).trim().replace(/\./g, '').replace(',', '.'); const v = parseFloat(t); return isFinite(v) ? v : null; };

const AYLAR = { ocak: 1, şubat: 2, subat: 2, mart: 3, nisan: 4, mayıs: 5, mayis: 5, haziran: 6, temmuz: 7, ağustos: 8, agustos: 8, eylül: 9, eylul: 9, ekim: 10, kasım: 11, kasim: 11, aralık: 12, aralik: 12 };

export function basligiOku(metin) {
  const bas = metin.slice(0, 6000);
  const ad = (bas.match(/A-\)Fonun Adı\s*:\s*([^\n]+)/) || [])[1];
  const kod = (bas.match(/^\s*([A-Z0-9]{2,5})-/m) || [])[1];
  const donemM = bas.match(/^\s*([A-Za-zÇĞİÖŞÜçğıöşü]+)-(\d{4})\s*$/m);
  let donem = null;
  if (donemM) { const a = AYLAR[donemM[1].toLowerCase()]; if (a) donem = donemM[2] + '-' + String(a).padStart(2, '0'); }
  const al = (re) => sayi((bas.match(re) || [])[1]);
  return {
    kod: kod || null, ad: ad ? ad.trim() : null, donem,
    fonToplamDegeri: al(/Toplam Değer\/Net Varlık Değeri\s*:\s*\n?\s*([\d.,]+)/),
    paySayisi: al(/Katılma Payı Sayısı\s*:\s*\n?\s*([\d.,]+)/),
    payFiyati: al(/Ay Sonu Pay Fiyatı \(TL\)\s*:\s*([\d.,]+)/),
    aylikGetiri: al(/Aylık Pay Fiyatı Artış Oranı \(TL\)\s*:\s*(-?[\d.,]+)/),
    hisseOrtYuzde: al(/a-\)Hisse Senedi\s*:\s*([\d.,]+)/),
    hisseDevirHizi: al(/G-\)Aylık Ortalama Portföy Devir Hızı[\s\S]*?a-\)Hisse Senedi\s*:\s*([\d.,]+)/),
  };
}

/* Ay sonu hisse portföyü */
export function hisseleriOku(metin) {
  const i0 = metin.indexOf('III-FON PORTFÖY DEĞERİ TABLOSU');
  if (i0 < 0) throw new Error('III-FON PORTFÖY DEĞERİ TABLOSU başlığı yok');
  const i1 = metin.indexOf('HİSSE SENETLERİ', i0);
  if (i1 < 0) throw new Error('HİSSE SENETLERİ bölümü yok');
  const i2 = metin.indexOf('GRUP TOPLAMI', i1);
  if (i2 < 0) throw new Error('GRUP TOPLAMI satırı yok');
  const blok = metin.slice(i1, i2);
  /* Satır: kod TL ... nominal alışF alışT [no] borsaF toplam grup fpd ftd */
  const re = /^\s*([A-Z0-9]{3,6})\s+TL\s+.*?(-?[\d.]+,\d{2})\s+([\d.]+,\d+)\s+(\d\d\/\d\d\/\d\d)\s+(?:\d{6,}\s+)?([\d.]+,\d+)\s+(-?[\d.]+,\d{2})\s+(-?\d+,\d{2})\s+(-?\d+,\d{2})\s+(-?\d+,\d{2})\s*$/gm;
  const kod = {};
  let m, satir = 0;
  while ((m = re.exec(blok))) {
    satir++;
    const k = m[1];
    const r = kod[k] || (kod[k] = { kod: k, nominal: 0, deger: 0, grup: 0, fpd: 0, ftd: 0, borsaFiyat: null, satir: 0 });
    r.nominal += sayi(m[2]); r.deger += sayi(m[6]);
    r.grup += sayi(m[7]); r.fpd += sayi(m[8]); r.ftd += sayi(m[9]);
    r.borsaFiyat = sayi(m[5]); r.satir++;
  }
  /* GRUP TOPLAMI satırı: nominal_toplam  deger_toplam  100,00  fpd  ftd */
  const gt = metin.slice(i2, i2 + 400).match(/GRUP TOPLAMI\s+([\d.]+,\d{2})\s+([\d.]+,\d{2})\s+([\d.]+,\d{2})\s+([\d.]+,\d{2})\s+([\d.]+,\d{2})/);
  const toplam = gt ? { deger: sayi(gt[2]), grup: sayi(gt[3]), fpd: sayi(gt[4]), ftd: sayi(gt[5]) } : null;
  const liste = Object.values(kod).map(r => ({ kod: r.kod, nominal: +r.nominal.toFixed(2), deger: +r.deger.toFixed(2),
    agirlik: +r.ftd.toFixed(2), portfoyIci: +r.grup.toFixed(2), borsaFiyat: r.borsaFiyat, satir: r.satir }))
    .filter(r => Math.abs(r.deger) > 0.5)
    .sort((a, b) => b.agirlik - a.agirlik);
  return { liste, toplam, satirSayisi: satir };
}

/* Ay içi işlemler: satışlar ve alışlar, kod bazında toplam */
export function islemleriOku(metin) {
  const bolum = (baslik) => {
    const i = metin.indexOf(baslik); if (i < 0) return null;
    const j = metin.indexOf('Toplamı:', i); if (j < 0) return null;
    return metin.slice(i, j);
  };
  const oku = (blok) => {
    const out = {}; if (!blok) return out;
    const re = /^\s*([A-Z0-9]{3,6})\s+.*?(\d\d\/\d\d\/\d\d)\s+([\d.]+,\d+)\s+([\d.]+,\d{2})\s+([\d.]+,\d{2})\s*$/gm;
    let m; while ((m = re.exec(blok))) { const k = m[1]; const r = out[k] || (out[k] = { deger: 0, nominal: 0, islem: 0 }); r.deger += sayi(m[4]); r.nominal += sayi(m[5]); r.islem++; }
    Object.values(out).forEach(r => { r.deger = +r.deger.toFixed(2); r.nominal = +r.nominal.toFixed(2); });
    return out;
  };
  return { satis: oku(bolum('A) HİSSE SENETLERİ(SATIŞLAR)')), alis: oku(bolum('A) HİSSE SENETLERİ(ALIŞLAR)')) };
}

export function denetle(hisse) {
  const sorun = [];
  if (hisse.liste.length < 5) sorun.push('kod sayısı ' + hisse.liste.length + ' < 5');
  const grupT = hisse.liste.reduce((a, r) => a + r.portfoyIci, 0);
  if (Math.abs(grupT - 100) > 0.5) sorun.push('grup % toplamı ' + grupT.toFixed(2) + ' (100±0,5 bekleniyordu)');
  if (hisse.toplam) {
    const degT = hisse.liste.reduce((a, r) => a + r.deger, 0);
    const fark = Math.abs(degT - hisse.toplam.deger) / hisse.toplam.deger;
    if (fark > 0.001) sorun.push('değer toplamı ' + degT.toFixed(0) + ' ≠ GRUP TOPLAMI ' + hisse.toplam.deger.toFixed(0));
  } else sorun.push('GRUP TOPLAMI satırı okunamadı');
  return { gecti: sorun.length === 0, sorun };
}

export function raporuAyristir(metin) {
  const baslik = basligiOku(metin);
  const hisse = hisseleriOku(metin);
  const islem = islemleriOku(metin);
  const d = denetle(hisse);
  return { baslik, hisse: hisse.liste, hisseToplam: hisse.toplam, islem, denetim: d };
}
