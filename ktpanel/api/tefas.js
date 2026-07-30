// TEFAS fon verisi — BindHistoryInfo tek istekte ~3 aylik aralikla sinirlidir;
// bu yuzden 400 gunluk pencere ~80 gunluk parcalara bolunur, paralel cekilir, birlestirilir.
// Yatirim fonunda (YAT) veri yoksa emeklilik fonu (EMK) tipi de denenir.
const HEADERS = {
  'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
  'Origin': 'https://www.tefas.gov.tr',
  'Referer': 'https://www.tefas.gov.tr/TarihselVeriler.aspx',
  'X-Requested-With': 'XMLHttpRequest',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
};
const fmt = (d) => String(d.getDate()).padStart(2, '0') + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.' + d.getFullYear();

async function fetchChunk(fontip, fon, start, end) {
  const body = new URLSearchParams({ fontip, fonkod: fon, bastarih: fmt(start), bittarih: fmt(end) });
  const r = await fetch('https://www.tefas.gov.tr/api/DB/BindHistoryInfo', { method: 'POST', headers: HEADERS, body: body.toString() });
  if (!r.ok) throw new Error('TEFAS yanit kodu: ' + r.status);
  const j = await r.json();
  return (j && j.data) || [];
}

async function fetchAll(fontip, fon) {
  const end = new Date();
  const start = new Date(); start.setDate(start.getDate() - 400);
  const chunks = [];
  let s = new Date(start);
  while (s < end) {
    const e = new Date(s); e.setDate(e.getDate() + 80);
    chunks.push([new Date(s), e < end ? e : new Date(end)]);
    s = new Date(e); s.setDate(s.getDate() + 1);
  }
  const results = await Promise.all(chunks.map(([a, b]) => fetchChunk(fontip, fon, a, b).catch(() => [])));
  return results.flat();
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200');
  try {
    const fon = String((req.query && req.query.fon) || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    if (!fon) return res.status(400).json({ error: 'fon parametresi gerekli, orn: /api/tefas?fon=AFT' });

    let rows = await fetchAll('YAT', fon);
    let tip = 'YAT';
    if (!rows.length) { rows = await fetchAll('EMK', fon); tip = 'EMK'; }
    if (!rows.length) return res.status(404).json({ error: fon + ' icin veri bulunamadi (yatirim + emeklilik tipi denendi) — fon kodunu kontrol et' });

    const map = new Map();
    for (const x of rows) {
      const t = Number(x.TARIH), p = Number(x.FIYAT);
      if (isFinite(t) && isFinite(p) && p > 0) map.set(t, { t, p, u: x.FONUNVAN });
    }
    const seri = [...map.values()].sort((a, b) => a.t - b.t);
    if (seri.length < 2) return res.status(404).json({ error: 'Yetersiz fiyat verisi' });

    const son = seri[seri.length - 1];
    const priceAt = (targetMs) => {
      let best = null;
      for (const s2 of seri) { if (s2.t <= targetMs) best = s2; else break; }
      return best;
    };
    const gun = 24 * 3600 * 1000;
    const ret = (eski) => (eski && eski.p > 0) ? +(((son.p / eski.p) - 1) * 100).toFixed(2) : null;
    const yilbasi = new Date(new Date(son.t).getFullYear(), 0, 1).getTime();

    const step = Math.max(1, Math.ceil(seri.length / 120));
    const grafik = seri.filter((_, i) => i % step === 0);
    if (grafik[grafik.length - 1].t !== son.t) grafik.push(son);

    res.status(200).json({
      kaynak: 'TEFAS', fon, fontip: tip,
      unvan: son.u || seri[0].u || null,
      sonFiyat: son.p,
      sonTarih: new Date(son.t).toISOString().slice(0, 10),
      getiri: {
        a1: ret(priceAt(son.t - 30 * gun)),
        a3: ret(priceAt(son.t - 91 * gun)),
        ytd: ret(priceAt(yilbasi)),
        y1: ret(priceAt(son.t - 365 * gun))
      },
      seri: grafik.map((x) => ({ t: new Date(x.t).toISOString().slice(0, 10), p: x.p }))
    });
  } catch (e) {
    res.status(502).json({ error: 'TEFAS verisine ulasilamadi', detay: String(e.message || e) });
  }
};
