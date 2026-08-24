/* ══════════════════════════════════════════════════════════════════════════
   §398 SEC EDGAR — YABANCI HİSSE FİNANSAL TABLOLARI (23 Ağu 2026)
   ══════════════════════════════════════════════════════════════════════════
   NEDEN: KAP yalnız BIST şirketlerini taşır. ABD'de kamu bildirim sisteminin
   karşılığı EDGAR ve aynı teknolojiyi kullanıyor — XBRL. Yani §340-§345'te
   kurduğumuz mantığın büyük kısmı taşınabilir.

   KAP'A GÖRE ÜÇ AVANTAJ (canlı ölçüldü, tahmin değil):
   1) ENFLASYON MUHASEBESİ YOK. TMS-29 sancısı, kümülatif farkı sorunu (§342b),
      endeksleme zinciri (§345) — hiçbiri gerekmiyor.
   2) ÇEYREK/KÜMÜLATİF KENDİLİĞİNDEN AYRIK. Her kayıt `start` ve `end` taşır:
      WMT FY26Q2 → 2025-05-01→2025-07-31 = 177,4 mlr (ÇEYREK)
                 → 2025-02-01→2025-07-31 = 343,0 mlr (KÜMÜLATİF)
      İkisi AYRI KAYIT. KAP'ta sütun konumundan çıkarmak zorundaydık.
   3) HIZ SINIRI RAHAT: saniyede 10 istek. Tek şart User-Agent'ta iletişim.

   TEK DEZAVANTAJ: US-GAAP taksonomisi IFRS'ten farklı. Kalem haritasının
   ikinci sürümü gerekiyor (aşağıda). Mantık aynı: KODA göre eşleştir, metne
   göre değil (§341'in dersi).

   UÇLAR:
     ?mod=ara&q=WMT        → ticker/isim arama (company_tickers.json)
     ?mod=tablo&t=WMT      → çeyreklik seri + türev metrikler
     ?mod=ham&t=WMT&n=12   → ham XBRL kalemleri (n çeyrek)
   ══════════════════════════════════════════════════════════════════════════ */

const _SURUM = 'edgar-2026-08-23-a';

/* SEC User-Agent ZORUNLU — iletişim bilgisi içermeli, yoksa 403 döner.
   Bu bir nezaket kuralı değil, teknik şart. */
const UA = 'KTPanel/1.0 (kisisel arastirma; iletisim: ktpanel@ornek.com)';
const BAS = { 'User-Agent': UA, 'Accept': 'application/json', 'Accept-Encoding': 'gzip, deflate' };

/* ── US-GAAP KALEM HARİTASI ────────────────────────────────────────────────
   Her kalem için ALTERNATİF etiket listesi: şirketler aynı kavramı farklı
   etiketle raporlar. Örn. hasılat: Revenues · RevenueFromContractWith
   CustomerExcludingAssessedTax · SalesRevenueNet — ilki bulunan kullanılır.
   DERS (§341): tek etikete güvenme, düşüş zinciri kur. */
const HARITA = {
  ciro:      ['Revenues', 'RevenueFromContractWithCustomerExcludingAssessedTax',
              'RevenueFromContractWithCustomerIncludingAssessedTax', 'SalesRevenueNet'],
  /* §398d: WMT gibi perakendeciler GrossProfit ETİKETİ KULLANMAZ — satılan
     malın maliyetini ayrı verir. brüt = ciro − CostOfRevenue ile türetilir. */
  brut:      ['GrossProfit'],
  satisMal:  ['CostOfGoodsAndServicesSold', 'CostOfRevenue', 'CostOfGoodsSold'],
  faalKar:   ['OperatingIncomeLoss'],
  netKar:    ['NetIncomeLoss', 'ProfitLoss'],
  /* §398f AMORTİSMAN — bazı şirketler ETİKET DEĞİŞTİRİR ya da 10-Q'da HİÇ
     VERMEZ (WMT: DepreciationDepletionAndAmortization 2019'da, DepreciationAnd
     Amortization da 2019'da kesiliyor; sonrası yalnız 10-K'da). Zincir uzun
     tutuldu; bulunamazsa FAVÖK null kalır ve `_uyari` alanında SÖYLENİR —
     sessizce faaliyet kârını FAVÖK sanmak yerine. */
  amort:     ['DepreciationDepletionAndAmortization', 'DepreciationAndAmortization',
              'DepreciationAmortizationAndAccretionNet', 'DepreciationNonproduction',
              'Depreciation', 'AmortizationOfIntangibleAssets',
              'DepreciationAmortizationAndAccretionNetExcludingAmortizationOfDebtIssuanceCosts'],
  satisGid:  ['SellingGeneralAndAdministrativeExpense', 'GeneralAndAdministrativeExpense'],
  arge:      ['ResearchAndDevelopmentExpense'],
  isletmeNA: ['NetCashProvidedByUsedInOperatingActivities',
              'NetCashProvidedByUsedInOperatingActivitiesContinuingOperations'],
  capex:     ['PaymentsToAcquirePropertyPlantAndEquipment',
              'PaymentsToAcquireProductiveAssets'],
  odFaiz:    ['InterestPaidNet', 'InterestPaid', 'InterestPaidCapitalized'],
  faizGid:   ['InterestExpense', 'InterestIncomeExpenseNet', 'InterestExpenseDebt'],
  temettu:   ['PaymentsOfDividendsCommonStock', 'PaymentsOfDividends'],
  /* stok kalemler (bilanço — anlık, `end` taşır) */
  nakit:     ['CashAndCashEquivalentsAtCarryingValue', 'CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents'],
  kvYatirim: ['ShortTermInvestments', 'MarketableSecuritiesCurrent'],
  kvBorc:    ['ShortTermBorrowings', 'LongTermDebtCurrent', 'CommercialPaper',
              'DebtCurrent'],
  uvBorc:    ['LongTermDebtNoncurrent', 'LongTermDebt'],
  ozkaynak:  ['StockholdersEquity', 'StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest'],
  aktif:     ['Assets'],
  donen:     ['AssetsCurrent'],
  kvYuk:     ['LiabilitiesCurrent'],
  stok:      ['InventoryNet'],
  alacak:    ['AccountsReceivableNetCurrent', 'ReceivablesNetCurrent'],
  payAdedi:  ['CommonStockSharesOutstanding', 'WeightedAverageNumberOfDilutedSharesOutstanding']
};

const AKIS = new Set(['ciro','brut','satisMal','faalKar','netKar','amort','satisGid','arge',
  'isletmeNA','capex','odFaiz','faizGid','temettu']);

async function getJ(url) {
  try {
    const r = await fetch(url, { headers: BAS, signal: AbortSignal.timeout(25000) });
    if (!r.ok) return { _http: r.status };
    return await r.json();
  } catch (e) { return { _hata: String(e && e.message || e).slice(0, 80) }; }
}

/* ticker → CIK. Liste 10.403 kayıt, ~1 MB; edge cache 24 saat tutar. */
let _TICKER_BELLEK = null, _TICKER_TS = 0;
async function tickerCik(t) {
  const simdi = Date.now();
  if (!_TICKER_BELLEK || (simdi - _TICKER_TS) > 6 * 3600 * 1000) {
    const j = await getJ('https://www.sec.gov/files/company_tickers.json');
    if (!j || j._http || j._hata) return { hata: 'ticker listesi alınamadı' + (j._http ? (' HTTP ' + j._http) : '') };
    _TICKER_BELLEK = j; _TICKER_TS = simdi;
  }
  const ara = String(t || '').toUpperCase().trim();
  for (const k of Object.keys(_TICKER_BELLEK)) {
    const x = _TICKER_BELLEK[k];
    if (x && String(x.ticker).toUpperCase() === ara)
      return { cik: String(x.cik_str).padStart(10, '0'), unvan: x.title, ticker: x.ticker };
  }
  return { hata: ara + ' EDGAR ticker listesinde yok (ABD\'de işlem görmüyor olabilir)' };
}

/* companyfacts: şirketin TÜM XBRL kalemleri tek dosyada (birkaç MB olabilir) */
async function gercekler(cik) {
  const j = await getJ('https://data.sec.gov/api/xbrl/companyfacts/CIK' + cik + '.json');
  if (!j || j._http || j._hata) return { hata: 'companyfacts alınamadı' + (j._http ? (' HTTP ' + j._http) : (' · ' + j._hata)) };
  return j;
}

/* Bir kalemin kayıtlarını çıkar. AKIŞ kalemlerinde ÇEYREKLİK olanı seç:
   start-end farkı 80-100 gün arasındaysa çeyrek, değilse kümülatif/yıllık.
   STOK kalemlerinde `end` yeterli. */
/* §398c NAKİT AKIŞ TABLOSU YTD GELİR (canlı: isletmeNA/capex/odFaiz çoğu
   çeyrekte null çıktı). ABD'de nakit akış tablosu YIL BAŞINDAN İTİBAREN
   birikimli raporlanır: Q1'de 3 aylık, Q2'de 6 aylık, Q3'te 9 aylık, 10-K'da
   12 aylık. Yani 80-100 günlük çeyrek süzgeci bunları ELİYOR.
   ÇÖZÜM: YTD kayıtlarından ARDIŞIK FARK ile çeyreklik üret. Mali yıl başlangıcı
   `start` alanından bilinir; aynı `start` değerini paylaşan kayıtlar aynı yılın
   YTD serisidir.
   NOT: Bu, KAP'ta §345'te yaptığımız kümülatif farkının ABD karşılığı — ama
   ORADA enflasyon düzeltmesi gerekiyordu, BURADA gerekmiyor. Fark doğrudan
   alınabilir. */
function ytdCeyreklik(kayitlar) {
  const yilGrup = {};
  kayitlar.forEach(x => {
    if (!x.start || !x.end || !Number.isFinite(x.val)) return;
    (yilGrup[x.start] = yilGrup[x.start] || []).push(x);
  });
  const cikti = [];
  Object.values(yilGrup).forEach(g => {
    g.sort((a, b) => (a.end < b.end ? -1 : 1));
    let oncekiDeger = 0, oncekiBitis = null;
    g.forEach(x => {
      const gun = (new Date(x.end) - new Date(x.start)) / 864e5;
      cikti.push({
        start: oncekiBitis || x.start, end: x.end,
        val: x.val - oncekiDeger,
        form: x.form, filed: x.filed, _ytdTuretilmis: !!oncekiBitis, _ytdGun: Math.round(gun)
      });
      oncekiDeger = x.val; oncekiBitis = x.end;
    });
  });
  return cikti;
}

/* §398g EN GÜNCEL ETİKETİ SEÇ, İLK BULUNANI DEĞİL (AAPL'de yakalandı: son
   dönem 2018/09 çıktı — SEKİZ YIL eski, üstelik uyarısız).
   Sebep: Apple `Revenues` etiketini 2018'de bıraktı, sonrasında
   `RevenueFromContractWithCustomerExcludingAssessedTax` kullanıyor. Benim
   zincirim ilk bulduğunu alıyordu ve `Revenues` listede önce olduğu için
   eski seri dönüyordu.
   US-GAAP taksonomisi zaman içinde DEĞİŞİR; şirketler etiket göç ettirir.
   ÇÖZÜM: tüm alternatifleri dene, EN YENİ `end` tarihine sahip olanı seç.
   DERS: BİR DÜŞÜŞ ZİNCİRİNDE "İLK BULUNAN" DEĞİL "EN GÜNCEL OLAN" DOĞRUDUR —
   taksonomi göçü sessizce eski veri döndürür. */
function kalemCek(facts, adlar, akisMi) {
  const us = (facts && facts.facts && facts.facts['us-gaap']) || {};
  const adaylar = [];
  for (const ad of adlar) {
    const blok = us[ad];
    if (!blok || !blok.units) continue;
    const birim = blok.units.USD || blok.units.shares || Object.values(blok.units)[0];
    if (!Array.isArray(birim) || !birim.length) continue;
    if (!akisMi) {
      const k = birim.filter(x => x && Number.isFinite(x.val) && x.end);
      if (k.length) adaylar.push({ etiket: ad, kayitlar: k, kaynak: 'stok' });
      continue;
    }
    /* 1) doğrudan çeyreklik kayıt var mı (gelir tablosu genelde böyle) */
    const dogrudan = birim.filter(x => {
      if (!x || !Number.isFinite(x.val) || !x.end || !x.start) return false;
      const gun = (new Date(x.end) - new Date(x.start)) / 864e5;
      return gun >= 80 && gun <= 100;
    });
    /* §398e DOĞRUDAN + YTD BİRLEŞTİRİLİR (canlı: nakit akış kalemleri hâlâ
       null çıktı). Sebep: mali yılın İLK çeyreğinde YTD penceresi = çeyrek
       penceresi (WMT'de 2026-02-01→2026-04-30, 89 gün). Yani her yılın Q1'i
       "doğrudan çeyreklik" görünüyor, sayı >= 4 oluyor ve YTD dalına HİÇ
       girilmiyordu — Q2/Q3/Q4 sonsuza kadar boş kalıyordu.
       ÇÖZÜM: ikisini birleştir, aynı `end` için doğrudan olanı tercih et.
       DERS: BİR DALIN "YETERLİ VERİ VAR" KONTROLÜ, DİĞER DALIN GEREKTİĞİ
       DURUMU MASKELEYEBİLİR — kapsamı dönem bazında ölç, sayı bazında değil. */
    const ytdHam = birim.filter(x => {
      if (!x || !Number.isFinite(x.val) || !x.end || !x.start) return false;
      const gun = (new Date(x.end) - new Date(x.start)) / 864e5;
      return gun >= 80 && gun <= 380;
    });
    const turetilmis = ytdHam.length
      ? ytdCeyreklik(ytdHam).filter(x => { const g = (new Date(x.end) - new Date(x.start)) / 864e5; return g >= 60 && g <= 110; })
      : [];
    const havuz = {};
    turetilmis.forEach(x => { havuz[x.end] = x; });            /* önce türetilmiş */
    dogrudan.forEach(x => { havuz[x.end] = x; });              /* doğrudan ÜSTÜNE yazar */
    const birlesik = Object.values(havuz);
    if (birlesik.length) adaylar.push({ etiket: ad, kayitlar: birlesik,
      kaynak: (turetilmis.length && dogrudan.length) ? 'çeyreklik + YTD farkı' : (turetilmis.length ? 'YTD farkı' : 'çeyreklik') });
  }
  if (!adaylar.length) return null;
  /* §398g: en yeni bitiş tarihine sahip aday kazanır */
  adaylar.forEach(a => { a._sonBitis = a.kayitlar.reduce((m, x) => (x.end > m ? x.end : m), ''); });
  adaylar.sort((a, b) => (a._sonBitis < b._sonBitis ? 1 : -1));
  const kazanan = adaylar[0];
  /* eski etiketin kayıtları da eklenir (tarihsel derinlik) — çakışmada yeni kazanır */
  if (adaylar.length > 1) {
    const havuz2 = {};
    adaylar.slice(1).forEach(a => a.kayitlar.forEach(x => { havuz2[x.end] = x; }));
    kazanan.kayitlar.forEach(x => { havuz2[x.end] = x; });
    kazanan.kayitlar = Object.values(havuz2);
    kazanan.etiket += ' (+' + (adaylar.length - 1) + ' eski etiket birleşti)';
  }
  return kazanan;
}

/* §398b DÖNEM ETİKETİ BİTİŞ TARİHİNDEN (canlı: "2027/Q1" İKİ KEZ çıktı —
   2026-04-30 ve 2025-04-30 için). Sebep: companyfacts'teki `fy`/`fp` alanları
   DOSYALAMA bağlamına göre gelir, DÖNEM bağlamına göre değil. Aynı 10-Q'da
   cari çeyrek ve geçen yılın aynı çeyreği bulunur; ikisi de dosyanın fy/fp'sini
   taşır. fy/fp'ye GÜVENİLEMEZ.
   DERS: BİR ALAN "DOSYA" BAĞLAMINI Mİ "DÖNEM" BAĞLAMINI MI TAŞIYOR, ÖLÇ. */
function donemAnahtar(k) {
  const d = new Date(k.end);
  if (isNaN(d)) return k.end || '';
  const ay = d.getUTCMonth() + 1, yil = d.getUTCFullYear();
  return yil + '/' + String(ay).padStart(2, '0');    /* takvim bazlı, tekrarsız */
}

async function tabloModu(req, res) {
  const t = String((req.query && req.query.t) || '').toUpperCase().replace(/[^A-Z.-]/g, '').slice(0, 8);
  if (!t) return res.status(400).json({ surum: _SURUM, ok: false, err: 'ticker gerekli' });
  const n = Math.min(24, Math.max(2, parseInt((req.query && req.query.n) || '12', 10) || 12));

  const tc = await tickerCik(t);
  if (tc.hata) return res.status(200).json({ surum: _SURUM, ok: false, err: tc.hata });
  const F = await gercekler(tc.cik);
  if (F.hata) return res.status(200).json({ surum: _SURUM, ok: false, err: F.hata, ticker: t, cik: tc.cik });

  /* dönem iskeleti: hasılatın çeyreklik kayıtlarından */
  const ciroB = kalemCek(F, HARITA.ciro, true);
  if (!ciroB) return res.status(200).json({ surum: _SURUM, ok: false,
    err: 'çeyreklik hasılat bulunamadı — şirket 10-Q vermiyor olabilir (yabancı ihraççılar 20-F/6-K kullanır)', ticker: t, cik: tc.cik });

  /* en yeni n çeyrek */
  const donemler = ciroB.kayitlar.slice().sort((a, b) => (a.end < b.end ? 1 : -1))
    .filter((x, i, arr) => arr.findIndex(y => y.end === x.end) === i)   /* tekilleştir */
    .slice(0, n);

  const bul = (kad, bitis, akisMi) => {
    const b = kalemCek(F, HARITA[kad], akisMi);
    if (!b) return null;
    const k = b.kayitlar.filter(x => x.end === bitis)
      .sort((a, b2) => (a.filed < b2.filed ? 1 : -1))[0];   /* en son dosyalanan */
    return k ? { v: k.val, etiket: b.etiket } : null;
  };

  const seri = donemler.map(d => {
    const satir = { donem: donemAnahtar(d), bitis: d.end, baslangic: d.start, form: d.form, dosya: d.filed };
    Object.keys(HARITA).forEach(kad => {
      const r = bul(kad, d.end, AKIS.has(kad));
      satir[kad] = r ? r.v : null;
    });
    /* türev metrikler — KAP tarafındakiyle AYNI tanımlar (§342, §351) */
    const S = (...a) => { let x = 0, v = false; a.forEach(z => { if (Number.isFinite(z)) { x += z; v = true; } }); return v ? x : null; };
    /* §398d brüt kâr türetme: etiket yoksa ciro − satılan malın maliyeti */
    if (!Number.isFinite(satir.brut) && Number.isFinite(satir.ciro) && Number.isFinite(satir.satisMal))
      satir.brut = satir.ciro - satir.satisMal;
    satir.favokGenis = (Number.isFinite(satir.faalKar) && Number.isFinite(satir.amort)) ? satir.faalKar + satir.amort : null;
    satir.favokCekirdek = (Number.isFinite(satir.brut) && Number.isFinite(satir.amort))
      ? satir.brut - (Number.isFinite(satir.satisGid) ? satir.satisGid : 0) - (Number.isFinite(satir.arge) ? satir.arge : 0) + satir.amort : null;
    satir.finBorc = S(satir.kvBorc, satir.uvBorc);
    satir.likit = S(satir.nakit, satir.kvYatirim);
    satir.netBorc = (Number.isFinite(satir.finBorc) && Number.isFinite(satir.likit)) ? satir.finBorc - satir.likit : null;
    satir.sna = (Number.isFinite(satir.isletmeNA) && Number.isFinite(satir.capex)) ? satir.isletmeNA - Math.abs(satir.capex) : null;
    satir.brutMarj = (Number.isFinite(satir.brut) && satir.ciro) ? +(satir.brut / satir.ciro * 100).toFixed(2) : null;
    satir.favokMarj = (Number.isFinite(satir.favokGenis) && satir.ciro) ? +(satir.favokGenis / satir.ciro * 100).toFixed(2) : null;
    satir.netMarj = (Number.isFinite(satir.netKar) && satir.ciro) ? +(satir.netKar / satir.ciro * 100).toFixed(2) : null;
    return satir;
  });

  /* TTM: son 4 çeyreğin toplamı — ENFLASYON DÜZELTMESİ GEREKMEZ (EDGAR'ın
     KAP'a göre asıl avantajı; §345'in tüm zinciri burada gereksiz) */
  const ttm = {};
  ['ciro', 'brut', 'satisMal', 'faalKar', 'netKar', 'amort', 'isletmeNA', 'capex', 'odFaiz', 'faizGid', 'favokGenis', 'favokCekirdek', 'sna'].forEach(kad => {
    const d = seri.slice(0, 4).map(x => x[kad]).filter(Number.isFinite);
    ttm[kad] = d.length >= 3 ? d.reduce((a, b) => a + b, 0) : null;
  });
  const son = seri[0] || {};
  ['finBorc', 'likit', 'netBorc', 'ozkaynak', 'aktif', 'donen', 'kvYuk', 'kvBorc', 'payAdedi'].forEach(k => { ttm[k] = son[k]; });

  res.setHeader('Access-Control-Allow-Origin', '*');
  /* 10-Q/10-K yayımlandıktan sonra DEĞİŞMEZ → uzun edge cache (§380 dersi) */
  res.setHeader('Cache-Control', 'public, s-maxage=21600, stale-while-revalidate=86400');
  return res.status(200).json({
    surum: _SURUM, ok: true, ticker: tc.ticker, cik: tc.cik, unvan: tc.unvan,
    kaynak: 'SEC EDGAR · XBRL companyfacts',
    ceyrek: seri.length, son_donem: son.donem || null, son_bitis: son.bitis || null,
    _not: 'Değerler USD. Dönem etiketi BİTİŞ TARİHİNDEN üretilir (fy/fp alanları dosya bağlamını taşır, dönem bağlamını değil — §398b). Gelir tablosu doğrudan çeyreklik gelir; NAKİT AKIŞ tablosu YTD gelir ve ardışık farkla çeyrekliğe çevrilir (§398c). Brüt kâr etiketi yoksa ciro − satılan malın maliyeti ile türetilir (§398d). Enflasyon düzeltmesi GEREKMEZ. TTM = son 4 çeyreğin ham toplamı. UYARI: mali yılın SON çeyreği (Q4) ayrı 10-Q ile gelmez, 10-K içindedir; o çeyrek seride EKSİK görünebilir.',
    _uyari: (function(){
      const u = [];
      if (!Number.isFinite(ttm.amort)) u.push('AMORTİSMAN bulunamadı — bu şirket 10-Q\'da ayrı XBRL etiketiyle vermiyor olabilir (WMT gibi). FAVÖK hesaplanamadı; faaliyet kârı FAVÖK YERİNE KULLANILMADI. Yıllık değer için 10-K dönemine bakın.');
      if (!Number.isFinite(ttm.odFaiz) && !Number.isFinite(ttm.faizGid)) u.push('ÖDENEN FAİZ bulunamadı — FEK hesabı için gerekli.');
      if (!Number.isFinite(ttm.brut)) u.push('BRÜT KÂR bulunamadı (GrossProfit etiketi yok ve satılan mal maliyeti de okunamadı).');
      return u.length ? u : null;
    })(),
    ttm, seri
  });
}

async function araModu(req, res) {
  const q = String((req.query && req.query.q) || '').toUpperCase().trim().slice(0, 40);
  if (!q) return res.status(400).json({ surum: _SURUM, ok: false, err: 'q gerekli' });
  const j = await getJ('https://www.sec.gov/files/company_tickers.json');
  if (!j || j._http || j._hata) return res.status(200).json({ surum: _SURUM, ok: false, err: 'liste alınamadı' });
  const bul = [];
  for (const k of Object.keys(j)) {
    const x = j[k];
    if (!x) continue;
    const tk = String(x.ticker || '').toUpperCase(), ad = String(x.title || '').toUpperCase();
    if (tk === q) { bul.unshift({ ticker: x.ticker, cik: String(x.cik_str).padStart(10, '0'), unvan: x.title }); continue; }
    if (tk.startsWith(q) || ad.includes(q)) bul.push({ ticker: x.ticker, cik: String(x.cik_str).padStart(10, '0'), unvan: x.title });
    if (bul.length > 60) break;
  }
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, s-maxage=86400');
  return res.status(200).json({ surum: _SURUM, ok: true, q, adet: bul.length, sonuclar: bul.slice(0, 25) });
}

module.exports = async (req, res) => {
  const mod = String((req.query && req.query.mod) || 'tablo').toLowerCase();
  if (mod === 'ara') return araModu(req, res);
  return tabloModu(req, res);
};

module.exports.config = { maxDuration: 60 };
