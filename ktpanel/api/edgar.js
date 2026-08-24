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
  brut:      ['GrossProfit'],
  faalKar:   ['OperatingIncomeLoss'],
  netKar:    ['NetIncomeLoss', 'ProfitLoss'],
  amort:     ['DepreciationDepletionAndAmortization', 'DepreciationAndAmortization',
              'DepreciationAmortizationAndAccretionNet'],
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

const AKIS = new Set(['ciro','brut','faalKar','netKar','amort','satisGid','arge',
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
function kalemCek(facts, adlar, akisMi) {
  const us = (facts && facts.facts && facts.facts['us-gaap']) || {};
  for (const ad of adlar) {
    const blok = us[ad];
    if (!blok || !blok.units) continue;
    const birim = blok.units.USD || blok.units.shares || Object.values(blok.units)[0];
    if (!Array.isArray(birim) || !birim.length) continue;
    const kayitlar = birim.filter(x => {
      if (!x || !Number.isFinite(x.val) || !x.end) return false;
      if (!akisMi) return true;
      if (!x.start) return false;
      const gun = (new Date(x.end) - new Date(x.start)) / 864e5;
      return gun >= 80 && gun <= 100;      /* çeyrek penceresi */
    });
    if (kayitlar.length) return { etiket: ad, kayitlar };
  }
  return null;
}

/* dönem anahtarı: bitiş tarihinden mali çeyrek etiketi üret */
function donemAnahtar(k) {
  return (k.fy && k.fp && k.fp !== 'FY') ? (k.fy + '/' + k.fp) : (k.end || '');
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
  ['ciro', 'brut', 'faalKar', 'netKar', 'amort', 'isletmeNA', 'capex', 'odFaiz', 'faizGid', 'favokGenis', 'favokCekirdek', 'sna'].forEach(kad => {
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
    _not: 'Değerler USD. Çeyreklik kayıtlar start-end farkı 80-100 gün olanlardan seçilir; kümülatif satırlar ELENİR. Enflasyon düzeltmesi GEREKMEZ (US-GAAP tarihî maliyet). TTM = son 4 çeyreğin ham toplamı.',
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
