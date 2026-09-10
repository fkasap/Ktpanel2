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
const sayiUS = s => { if (s == null) return null; const v = parseFloat(String(s).trim().replace(/,/g, '')); return isFinite(v) ? v : null; };   /* §429k şablon B: 1,055,848.95 */

const AYLAR = { ocak: 1, subat: 2, mart: 3, nisan: 4, mayis: 5, haziran: 6, temmuz: 7, agustos: 8, eylul: 9, ekim: 10, kasim: 11, aralik: 12 };   /* §429m: yalnız ASCII anahtar, girdi katlanır */

export function basligiOku(metin) {
  const bas = metin.slice(0, 6000);
  const ad = (bas.match(/A-\)Fonun Adı\s*:\s*([^\n]+)/) || [])[1];
  const kod = (bas.match(/^\s*([A-Z0-9]{2,5})-/m) || [])[1];
  let donemM = bas.match(/^\s*([A-Za-zÇĞİÖŞÜçğıöşü]+)-(\d{4})\s*$/m);
  if (!donemM) donemM = bas.match(/([A-ZÇĞİÖŞÜ]{3,8})\s+(\d{4})\s+PORTF[ÖO]Y\s+DA[ĞG]ILIM/);
  if (!donemM) donemM = bas.match(/\b([A-ZÇĞİÖŞÜ]{4,8})\s+(20\d\d)\s+(?:PORTF|1-|I-)/);   /* §429n ELZ: 'NİSAN 2026 1- FONU' */
  if (!donemM) { const yx = bas.match(/\b(20\d\d)\s+([A-ZÇĞİÖŞÜ]{4,8})\s+PORTF/); if (yx) donemM = [yx[0], yx[2], yx[1]]; }   /* §429o TLZ: 'FON 2026 AĞUSTOS PORTFÖY' (yıl önde) */   /* §429k şablon B: 'TLZ TEMMUZ 2025 PORTFÖY DAĞILIM RAPORU' */
  let donem = null;
  /* §429m: 'EKİM'.toLowerCase() JS'te 'eki̇m' (i + birleşik nokta) verir, sözlükle eşleşmez —
     TEMMUZ geçip EKİM/NİSAN düşüyordu (canlı #212). ASCII katlama. */
  const kat = t => String(t).replace(/İ/g, 'I').replace(/I/g, 'i').replace(/Ç/g, 'c').replace(/Ğ/g, 'g').replace(/Ö/g, 'o').replace(/Ş/g, 's').replace(/Ü/g, 'u').toLowerCase().replace(/[çğıöşü]/g, c => ({ç:'c',ğ:'g',ı:'i',ö:'o',ş:'s',ü:'u'}[c]));
  if (donemM) { const a = AYLAR[kat(donemM[1])]; if (a) donem = donemM[2] + '-' + String(a).padStart(2, '0'); }
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
  /* §429g: başlık esnetildi (roman rakamı/boşluk türevleri) ve HATA MESAJI
     artık belgenin ilk satırlarını taşır — 116 PDF'lik sessiz düşüşün
     (canlı #205) kimliği bir sonraki koşuda kendiliğinden görünsün. */
  const ornek = () => metin.replace(/\s+/g, ' ').trim().slice(0, 120);
  if (metin.replace(/\s+/g, '').length < 200) throw new Error('PDF metin katmanı yok (görüntü tabanlı olabilir) — bu belge ayrıştırılamaz');
  let m0 = metin.match(/(?:[IVX]+\s*[-–.]\s*)?FON\s*PORTF[ÖO]Y\s*DE[ĞG]ER[İI]\s*TABLOSU/);
  /* §429u ŞABLON F (YHK — Yapı Kredi 'AYLIK RAPOR'): tablo başlığı 'Isin Kodu Vade
     İhraçcı Nominal Değeri Rayiç Değeri %' + 'A) HİSSE SENETLERİ :' → satır
     'AAGYO TREAGVR00014 Ağaoğlu … nominal rayiç %'. */
  if (!m0) { const mf = metin.match(/Isin\s*Kodu[\s\S]{0,200}?A\)\s*HİSSE SENETLERİ/); if (mf) m0 = { index: mf.index }; }
  if (!m0) {
    /* §429r: şablon E (Yapı Kredi 'AYLIK RAPOR' vb.) — bir sonraki koşu kalıbı göstersin */
    const hi = metin.search(/H[İI]SSE\s*SENE/i);
    const ni = metin.search(/Nominal|NOM[İI]NAL/);
    const cevre = ni >= 0 ? metin.slice(Math.max(0, ni - 120), ni + 220).replace(/\s+/g, ' ') : (hi >= 0 ? metin.slice(hi, hi + 260).replace(/\s+/g, ' ') : '(ne HİSSE ne Nominal geçiyor)');
    throw new Error('portföy tablosu başlığı yok · belge başı: "' + ornek() + '" · HİSSE çevresi: "' + cevre + '"');
  }
  const i0 = m0.index;
  /* §429s: önce TAM 'HİSSE SENETLERİ' (MAC'ta gevşek kalıp 'HİSSE SENEDİ ALIMI' bölümüne takılıyordu), sonra gevşek */
  const m1 = metin.slice(i0).match(/HİSSE SENETLERİ/) || metin.slice(i0).match(/H[İI]SSE\s*SENE[TD][Lİİ]?[EİI]?R?[İI]?/);
  if (!m1) throw new Error('HİSSE SENETLERİ bölümü yok · belge başı: "' + ornek() + '"');
  const i1 = i0 + m1.index;
  /* §429i: eski nesil şablonda GRUP TOPLAMI satırı yok (ELZ/TLZ canlı vakası).
     Bölüm sonu: GRUP TOPLAMI ya da bir sonraki bölüm başlığı; toplam satırı
     yoksa mutabakat grup %'lerin kendi içinden yapılır (denetle'de). */
  /* §429u (KCV canlı: grup % 57-72, okunamayan satır yok): hisseler alt gruplara
     bölünüp her birine ayrı GRUP TOPLAMI yazılabiliyor; blok ilk toplamda kesilince
     ikinci grup kayboluyordu. Blok artık bir sonraki ANA bölüme kadar; GRUP TOPLAMI
     satırları toplanır. */
  /* Bölüm başlığı = satırın TAMAMI başlık olan çizgi (KPU'da 'DÖVİZ İHRAÇCI VADE' sütun
     başlığı yanlışlıkla bölüm sonu sayılmıştı — §429u regresyon dersi). */
  const BASLIK = /^[ \t]*(YATIRIM FON[A-ZİI]*|BORSA YATIRIM FON[A-ZİI]*|KAMU [A-ZİĞÜŞÖÇ ]+|ÖZEL SEKTÖR[A-ZİĞÜŞÖÇ ]*|KİRA SERTİFİKA[A-ZİĞÜŞÖÇ ]*|VADELİ [A-ZİĞÜŞÖÇ ]+|TERS REPO[A-ZİĞÜŞÖÇ ]*|PARA PİYASASI[A-ZİĞÜŞÖÇ ]*|[IVX]+[ \t]*[-–.][ \t]*[A-ZĞÜŞİÖÇ][A-ZĞÜŞİÖÇ ]+)[ \t]*$/m;
  const sonrasi = metin.slice(i1 + 20, i1 + 80000);
  const mb = sonrasi.match(BASLIK);
  const anaSon = mb ? i1 + 20 + mb.index : Math.min(metin.length, i1 + 20000);
  /* GRUP TOPLAMI zinciri: ana bölüm sonuna kadar olan tüm grup toplamlarını kapsa */
  /* Zincir kuralı: g_k'dan g_{k+1}'e YALNIZ aradaki büyük-harf başlık satırları hisseyle
     ilgiliyse (HİSSE/HISSE/PAY içeriyorsa, ya da hiç başlık yoksa) geçilir; başka
     varlık sınıfı başlığı (YATIRIM FONU, KİRA SERTİFİKASI...) görülürse durulur. */
  let i2 = anaSon;
  const gPoz = []; { let g = metin.indexOf('GRUP TOPLAMI', i1); while (g >= 0 && g < anaSon) { gPoz.push(g); g = metin.indexOf('GRUP TOPLAMI', g + 12); } }
  const satirSonuOf = pos => { const e = metin.indexOf('\n', pos + 12); return e > 0 ? e + 1 : pos + 12; };
  const kolonSoz = /İHRAÇ|NOM[İI]NAL|F[İI]YAT|TAR[İI]H|DE[ĞG]ER|VADE|DÖV[İI]Z|ORAN|TOPLAM|KIYMET|KOD|GRUP/;
  const baskaSinif = ara => ara.split('\n').some(l => { const t = l.trim(); if (t.length < 6 || /\d/.test(t) || kolonSoz.test(t)) return false; const harf = t.replace(/[^A-ZĞÜŞİÖÇ]/g, ''); if (harf.length < 6 || harf !== t.replace(/[^A-ZĞÜŞİÖÇ]/g, '') || t !== t.toUpperCase()) return false; return !/H[İI]SSE|PAY/.test(t); });
  if (gPoz.length) {
    let k = 0;
    while (k + 1 < gPoz.length && !baskaSinif(metin.slice(satirSonuOf(gPoz[k]), gPoz[k + 1]))) k++;
    i2 = Math.min(satirSonuOf(gPoz[k]), anaSon);
  }
  const blok = metin.slice(i1, i2);
  /* Satır: kod TL ... nominal alışF alışT [no] borsaF toplam grup fpd ftd */
  /* §429g: IVF/PUK canlı vakası — dövizli hisse satırları (USD/EUR) 'TL'
     sabitine takılıp atlanıyor, toplam %93-95'te kalıp denetimden düşüyordu.
     Para birimi artık grup; kod bazında kayda para birimi de yazılır. */
  /* §429j: alış fiyatı NEGATİF ve çok haneli olabilir (IVF canlı: ASELS -0,055199 — temettü düzeltmeli maliyet) */
  /* §429t: 'KUL ' öneki (KCV) isteğe bağlı · taahhüt no alt çizgili olabilir (MPS '80_100_5') */
  const re = /^\s*(?:KUL\s+)?([A-Z0-9]{3,6})\s+(TL|USD|EUR|GBP|CHF|JPY)\s+.*?(-?[\d.]+,\d{2})\s+(-?[\d.]+,\d+)\s+(\d\d\/\d\d\/\d\d)\s+(?:[\d_]+\s+)?([\d.]+,\d+)\s+(-?[\d.]+,\d{2})\s+(-?\d+,\d{2})\s+(-?\d+,\d{2})\s+(-?\d+,\d{2})\s*$/gm;
  const kod = {};
  let m, satir = 0;
  while ((m = re.exec(blok))) {
    satir++;
    const k = m[1];
    const r = kod[k] || (kod[k] = { kod: k, pb: m[2], nominal: 0, deger: 0, grup: 0, fpd: 0, ftd: 0, borsaFiyat: null, satir: 0 });
    if (m[2] !== 'TL') r.pb = m[2];
    /* §429g grup haritası (pb eklenince kaydı): 1 kod · 2 pb · 3 nominal ·
       4 alışF · 5 alışT · 6 borsaF · 7 toplamDeğer · 8 grup% · 9 fpd% · 10 ftd% */
    r.nominal += sayi(m[3]); r.deger += sayi(m[7]);
    r.grup += sayi(m[8]); r.fpd += sayi(m[9]); r.ftd += sayi(m[10]);
    r.borsaFiyat = sayi(m[6]); r.satir++;
  }
  /* §429k ŞABLON B (canlı: TLZ/KLH — ATA/eski nesil üretici): satır biçimi
     'KOD İHRAÇÇI 116,155.00 1,055,848.95 4.55%' — ABD sayı biçimi, para birimi
     ve tarih sütunu yok, TEK yüzde (fon toplam değerine göre okunur). Birincil
     kalıp 0 satır verdiyse denenir; toplam satırı yoksa ağırlık aklıyla geçer. */
  if (satir === 0) {
    const reB = /^\s*([A-Z0-9]{3,6})\s+.+?\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s+([\d.]+)\s*%\s*$/gm;
    let mb; while ((mb = reB.exec(blok))) {
      satir++;
      const k = mb[1];
      const r = kod[k] || (kod[k] = { kod: k, pb: 'TL', nominal: 0, deger: 0, grup: 0, fpd: 0, ftd: 0, borsaFiyat: null, satir: 0, sablon: 'B' });
      r.nominal += sayiUS(mb[2]); r.deger += sayiUS(mb[3]); r.ftd += sayiUS(mb[4]); r.grup += sayiUS(mb[4]); r.satir++;
    }
  }
  /* §429m ŞABLON C (canlı ELZ): 'KOD AD 5.000,00 1.116.000,00 %0,22' — Türk sayı
     biçimi, yüzde ÖNEKLİ, tek yüzde. B gibi ağırlık aklıyla geçer. */
  if (satir === 0) {
    const reC = /^\s*([A-Z0-9]{3,6})\s+.+?\s+([\d.]+,\d{2})\s+([\d.]+,\d{2})\s+%\s*([\d.]+,\d+)\s*$/gm;
    let mc; while ((mc = reC.exec(blok))) {
      satir++;
      const k = mc[1];
      const r = kod[k] || (kod[k] = { kod: k, pb: 'TL', nominal: 0, deger: 0, grup: 0, fpd: 0, ftd: 0, borsaFiyat: null, satir: 0, sablon: 'C' });
      r.nominal += sayi(mc[2]); r.deger += sayi(mc[3]); r.ftd += sayi(mc[4]); r.grup += sayi(mc[4]); r.satir++;
    }
  }
  /* §429n ŞABLON D (canlı KHJ/KLH): 'KOD AD 45.000,00 692.100,00 4,75%' — Türk sayı, yüzde SONEKLİ */
  if (satir === 0) {
    const reD = /^\s*([A-Z0-9]{3,6})\s+.+?\s+([\d.]+,\d{2})\s+([\d.]+,\d{2})\s+([\d.]+,\d+)\s*%\s*$/gm;
    let md; while ((md = reD.exec(blok))) {
      satir++;
      const k = md[1];
      const r = kod[k] || (kod[k] = { kod: k, pb: 'TL', nominal: 0, deger: 0, grup: 0, fpd: 0, ftd: 0, borsaFiyat: null, satir: 0, sablon: 'D' });
      r.nominal += sayi(md[2]); r.deger += sayi(md[3]); r.ftd += sayi(md[4]); r.grup += sayi(md[4]); r.satir++;
    }
  }
  /* §429s ŞABLON E (canlı TZD/ZPE/ZPJ — Ziraat ailesi): '1 AEFES.E ANADOLU EFES 875.000,000
     16.607.500,00 1,730564 17,692' — sıra no · KOD.E · ad · nominal(3 ond.) · rayiç değer ·
     oran % (6 ond., fon toplamına göre) · birim alış fiyatı. */
  if (satir === 0) {
    const reE = /^\s*\d+\s+([A-Z0-9]{3,6})\.E\s+.+?\s+([\d.]+,\d{3})\s+([\d.]+,\d{2})\s+([\d.]+,\d{3,})\s+([\d.]+,\d+)\s*$/gm;
    let me; while ((me = reE.exec(blok))) {
      satir++;
      const k = me[1];
      const r = kod[k] || (kod[k] = { kod: k, pb: 'TL', nominal: 0, deger: 0, grup: 0, fpd: 0, ftd: 0, borsaFiyat: null, satir: 0, sablon: 'E' });
      r.nominal += sayi(me[2]); r.deger += sayi(me[3]); r.ftd += sayi(me[4]); r.grup += sayi(me[4]); r.borsaFiyat = sayi(me[5]); r.satir++;
    }
  }
  if (satir === 0) {
    const reF = /^\s*([A-Z0-9]{3,6})\s+TR[A-Z0-9]{10}\s+.+?\s+([\d.]+,\d{2})\s+([\d.]+,\d{2})\s+([\d.]+,\d+)\s*%?\s*$/gm;
    let mf2; while ((mf2 = reF.exec(blok))) {
      satir++;
      const k = mf2[1];
      const r = kod[k] || (kod[k] = { kod: k, pb: 'TL', nominal: 0, deger: 0, grup: 0, fpd: 0, ftd: 0, borsaFiyat: null, satir: 0, sablon: 'F' });
      r.nominal += sayi(mf2[2]); r.deger += sayi(mf2[3]); r.ftd += sayi(mf2[4]); r.grup += sayi(mf2[4]); r.satir++;
    }
  }
  /* GRUP TOPLAMI satırı: nominal_toplam  deger_toplam  100,00  fpd  ftd */
  /* §429i teşhis: HİSSE bloğunda kod gibi başlayıp regex'e OTURMAYAN satırlar
     (IVF/PUK %93-95 vakasının kimliği bir sonraki koşuda görünsün) */
  const tuketilen = new Set(); let mm; const re2 = new RegExp(re.source, 'gm');
  while ((mm = re2.exec(blok))) tuketilen.add(mm.index);
  const kacak = [];
  for (const sm of blok.matchAll(/^\s*[A-Z0-9]{3,6}\s+[^\n]{20,}$/gm)) {
    const say = (sm[0].match(/-?[\d.]+,\d/g) || []).length;
    if (say >= 3 && !tuketilen.has(sm.index) && kacak.length < 3) kacak.push(sm[0].replace(/\s+/g, ' ').trim().slice(0, 150));
  }
  let toplam = null; const gorulenGT = new Set();
  for (const gt of blok.matchAll(/GRUP TOPLAMI\s+([\d.]+,\d{2})\s+([\d.]+,\d{2})\s+([\d.]+,\d{2})\s+([\d.]+,\d{2})\s+([\d.]+,\d{2})/g)) {
    const imza = gt.slice(1).join('|'); if (gorulenGT.has(imza)) continue; gorulenGT.add(imza);   /* KPU: aynı toplam satırı sayfa geçişinde tekrarlanıyor */
    toplam = toplam || { deger: 0, grup: 0, fpd: 0, ftd: 0, adet: 0 };
    toplam.deger += sayi(gt[2]); toplam.grup += sayi(gt[3]); toplam.fpd += sayi(gt[4]); toplam.ftd += sayi(gt[5]); toplam.adet++;
  }
  const liste = Object.values(kod).map(r => ({ kod: r.kod, pb: r.pb, sablon: r.sablon, nominal: +r.nominal.toFixed(2), deger: +r.deger.toFixed(2),
    agirlik: +r.ftd.toFixed(2), portfoyIci: +r.grup.toFixed(2), borsaFiyat: r.borsaFiyat, satir: r.satir }))
    .filter(r => Math.abs(r.deger) > 0.5)
    .sort((a, b) => b.agirlik - a.agirlik);
  return { liste, toplam, satirSayisi: satir, kacak, blokBasi: blok.replace(/\s+/g, ' ').slice(0, 260) };
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


/* ── §434 VARLIK DAĞILIMI + DİĞER KIYMETLER ────────────────────────────────
   III. tablo gruplar hâlinde: HİSSE SENETLERİ · DİĞER/YATIRIM FONLARI · BYF · KİRA
   SERTİFİKALARI · KATILMA HESABI … her grubun GRUP TOPLAMI (FTD %) var. IV. tabloda
   fon seviyesi: FON PORTFÖY DEĞERİ % ve HAZIR DEĞERLER % (nakit).
   KPU ölçümü: hisse 87,81 + diğer(fon) 10,05 = portföy 97,85 · hazır değerler ~2.
   Fon kodları '-TL' ekli olabilir (KKG-TL); taahhüt no olmayabilir. */
const GRUP_BASLIK = /^[ \t]*(HİSSE SENETLERİ|YATIRIM FON[A-ZİI ]*|BORSA YATIRIM[A-ZİI ]*|KİRA SERTİFİKA[A-ZİĞÜŞÖÇ ]*|KATILMA HESA[A-ZİĞÜŞÖÇ ]*|VADELİ MEVDUAT|TERS REPO[A-ZİĞÜŞÖÇ ]*|DİĞER|KAMU [A-ZİĞÜŞÖÇ ]+|ÖZEL SEKTÖR[A-ZİĞÜŞÖÇ ]*|ALTIN[A-ZİĞÜŞÖÇ ]*|DÖVİZ[A-ZİĞÜŞÖÇ ]*|YABANCI [A-ZİĞÜŞÖÇ ]+)[ \t]*$/gm;
const kategoriBul = (baslik, altBaslik) => {
  const t = (baslik + ' ' + (altBaslik || '')).toUpperCase().replace(/İ/g, 'I');
  if (/HISSE/.test(t)) return 'hisse';
  if (/BORSA YATIRIM|BYF|ETF/.test(t)) return 'byf';
  if (/YATIRIM FON|Y\.FONU|FONU/.test(t)) return 'fon';
  if (/KIRA SERT|SUKUK/.test(t)) return 'sukuk';
  if (/KATILMA HESA|VADELI|MEVDUAT/.test(t)) return 'nakit';
  if (/TERS REPO|REPO/.test(t)) return 'repo';
  if (/ALTIN|KIYMETLI/.test(t)) return 'altin';
  if (/DOVIZ/.test(t)) return 'doviz';
  return 'diger';
};
export function gruplariOku(metin) {
  const m0 = metin.match(/(?:[IVX]+\s*[-–.]\s*)?FON\s*PORTF[ÖO]Y\s*DE[ĞG]ER[İI]\s*TABLOSU/);
  if (!m0) return { varlik: null, gruplar: [], diger: [] };
  const a = m0.index;
  const b = metin.slice(a).search(/\n\s*IV\s*[-–.]\s*FON\s*TOPLAM/);
  const sec = metin.slice(a, b > 0 ? a + b : a + 60000);
  const kolon = /İHRAÇ|NOM[İI]NAL|F[İI]YAT|TAR[İI]H|VADE|ORAN|TOPLAM|KIYMET|GRUP|TEM[İI]NAT|BR[İI]M|GÜNLÜK/;
  const bas = [...sec.matchAll(GRUP_BASLIK)].map(m => ({ ad: m[1].trim(), i: m.index })).filter(x => x.ad.length <= 40 && !kolon.test(x.ad));   /* sütun başlığı satırları ('DÖVİZ İHRAÇCI VADE…') grup değildir */
  const gruplar = [], diger = [];
  const satirRe = /^\s*(?:KUL\s+)?([A-Z0-9]{2,6}(?:-[A-Z]{2})?)\s+(TL|USD|EUR|GBP|CHF|JPY)\s+.*?(-?[\d.]+,\d{2})\s+(-?[\d.]+,\d+)\s+(\d\d\/\d\d\/\d\d)\s+(?:[\d_]+\s+)?([\d.]+,\d+)\s+(-?[\d.]+,\d{2})\s+(-?\d+,\d{2})\s+(-?\d+,\d{2})\s+(-?\d+,\d{2})\s*$/gm;
  for (let g = 0; g < bas.length; g++) {
    const blok = sec.slice(bas[g].i, g + 1 < bas.length ? bas[g + 1].i : sec.length);
    const altM = blok.match(/\n\s*(Y\.?Fonu[^\n]{0,20}|B\.?Y\.?F[^\n]{0,20}|[A-ZÇĞİÖŞÜ][a-zçğıöşü.]+ [A-ZÇĞİÖŞÜ][a-zçğıöşü]+)\s*\n/);
    const kategori = kategoriBul(bas[g].ad, altM && altM[1]);
    let ftd = 0, fpd = 0, deger = 0, adet = 0; const gorulen = new Set();
    for (const gt of blok.matchAll(/GRUP TOPLAMI\s+([\d.]+,\d{2})\s+([\d.]+,\d{2})\s+([\d.]+,\d{2})\s+([\d.]+,\d{2})\s+([\d.]+,\d{2})/g)) {
      const imza = gt.slice(1).join('|'); if (gorulen.has(imza)) continue; gorulen.add(imza);
      deger += sayi(gt[2]); fpd += sayi(gt[4]); ftd += sayi(gt[5]); adet++;
    }
    gruplar.push({ ad: bas[g].ad, kategori, ftd: +ftd.toFixed(2), fpd: +fpd.toFixed(2), deger: Math.round(deger), toplamSatiri: adet });
    if (kategori !== 'hisse') {
      const kod = {}; let m;
      while ((m = satirRe.exec(blok))) { const k = m[1]; const r = kod[k] || (kod[k] = { kod: k, kategori, agirlik: 0, deger: 0 }); r.agirlik += sayi(m[10]); r.deger += sayi(m[7]); }
      Object.values(kod).forEach(r => { if (Math.abs(r.deger) > 0.5) diger.push({ kod: r.kod, kategori: r.kategori, agirlik: +r.agirlik.toFixed(2), deger: Math.round(r.deger) }); });
    }
  }
  /* IV. tablo: FON PORTFÖY DEĞERİ % · HAZIR DEĞERLER % */
  const iv = b > 0 ? metin.slice(a + b, a + b + 3000) : '';
  const pd = iv.match(/FON PORTF[ÖO]Y DE[ĞG]ER[İI]\s+([\d.]+,\d{2})\s+([\d.]+,\d{2})\s*%/);
  const hd = iv.match(/HAZIR DE[ĞG]ERLER\s+(-?[\d.]+,\d{2})\s+(-?[\d.]+,\d{2})\s*%/);
  const al = iv.match(/ALACAKLAR\s+(-?[\d.]+,\d{2})\s+(-?[\d.]+,\d{2})\s*%/);
  const bo = iv.match(/BORÇLAR\s+(-?[\d.]+,\d{2})\s+(-?[\d.]+,\d{2})\s*%/);
  const varlik = {};
  gruplar.forEach(g => { if (g.ftd) varlik[g.kategori] = +((varlik[g.kategori] || 0) + g.ftd).toFixed(2); });
  /* nakit = fon toplam değerinin portföy dışında kalan kısmı (hazır değer + alacak − borç); kırılım ayrıca */
  if (pd) { varlik.nakit = +((varlik.nakit || 0) + (100 - sayi(pd[2]))).toFixed(2); varlik._portfoyDegeriYuzde = sayi(pd[2]); }
  if (hd) varlik._hazirDeger = sayi(hd[2]);
  if (al) varlik._alacak = sayi(al[2]);
  if (bo) varlik._borc = sayi(bo[2]);
  return { varlik: Object.keys(varlik).length ? varlik : null, gruplar, diger: diger.sort((x, y) => y.agirlik - x.agirlik) };
}

export function denetle(hisse) {
  const sorun = [];
  /* §429l: KLH canlı vakası — tek hisseli fon (FZLGY %99) meşru; taban 1 */
  if (hisse.liste.length < 1) sorun.push('kod sayısı 0' + (hisse.kacak && hisse.kacak.length ? ' · SATIR ÖRNEĞİ: "' + hisse.kacak.slice(0, 2).join('" | "') + '"' : ' · bölümde aday satır da yok · BLOK BAŞI: "' + String(hisse.blokBasi || '').slice(0, 220) + '"'));   /* §429i: PKD gerçekten 3 hisse tutuyor — 5 tabanı yanlış alarmdı */
  const sablonB = hisse.liste.some(r => r.sablon && r.sablon !== 'A');
  const grupT = hisse.liste.reduce((a, r) => a + r.portfoyIci, 0);
  const grupHedef = (hisse.toplam && hisse.toplam.adet > 1) ? hisse.toplam.grup : 100;   /* §429u: çok gruplu fonda hedef = grup toplamlarının toplamı */
  if (!sablonB && Math.abs(grupT - grupHedef) > 0.5) sorun.push('grup % toplamı ' + grupT.toFixed(2) + ' (' + grupHedef + '±0,5 bekleniyordu)' +
    (hisse.kacak && hisse.kacak.length ? ' · OKUNAMAYAN SATIRLAR: "' + hisse.kacak.slice(0, 3).join('" | "') + '"' : ''));
  const cokParali = hisse.liste.some(r => r.pb && r.pb !== 'TL');
  if (hisse.toplam && !cokParali) {
    const degT = hisse.liste.reduce((a, r) => a + r.deger, 0);
    const fark = Math.abs(degT - hisse.toplam.deger) / hisse.toplam.deger;
    if (fark > 0.001) sorun.push('değer toplamı ' + degT.toFixed(0) + ' ≠ GRUP TOPLAMI ' + hisse.toplam.deger.toFixed(0));
  } else if (!sablonB && !hisse.toplam && Math.abs(grupT - 100) > 0.5) sorun.push('GRUP TOPLAMI yok ve grup % ' + grupT.toFixed(1) + ' — çifte belirsizlik');   /* §429i: toplam satırı yoksa grup%≈100 mutabakat sayılır */
  /* §429g çok paralı fonda değer kıyası anlamsız (GRUP TOPLAMI TL bazlı yazılabiliyor);
     onun yerine ağırlık aklı: FTD toplamı (0, 105] aralığında olmalı. */
  if (cokParali) { const ftdT = hisse.liste.reduce((a, r) => a + r.ftd*0 + r.portfoyIci*0, 0); }
  const ftdT = hisse.liste.reduce((a, r) => a + (r.agirlik || 0), 0);
  if (!(ftdT > 0 && ftdT <= 105)) sorun.push('FTD ağırlık toplamı ' + ftdT.toFixed(1) + ' (0-105 dışı)');
  return { gecti: sorun.length === 0, sorun };
}

export function raporuAyristir(metin) {
  const baslik = basligiOku(metin);
  const hisse = hisseleriOku(metin);
  const islem = islemleriOku(metin);
  const d = denetle(hisse);
  let gr = { varlik: null, gruplar: [], diger: [] }; try { gr = gruplariOku(metin); } catch (e) {}   /* §434: varlık dağılımı isteğe bağlı, hisse denetimini etkilemez */
  return { baslik, hisse: hisse.liste, hisseToplam: hisse.toplam, islem, denetim: d, varlik: gr.varlik, gruplar: gr.gruplar, diger: gr.diger };
}
