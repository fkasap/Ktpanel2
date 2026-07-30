// TCMB resmi kurlar — sunucu tarafında today.xml'den çekilir (CORS engeli yok)
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');
  try {
    const r = await fetch('https://www.tcmb.gov.tr/kurlar/today.xml', {
      headers: { 'User-Agent': 'Mozilla/5.0 (KtPanel/1.0)' }
    });
    if (!r.ok) throw new Error('TCMB yanıt kodu: ' + r.status);
    const xml = await r.text();
    const tarih = (xml.match(/Tarih="([^"]+)"/) || [])[1] || null;
    const pick = (kod) => {
      const block = (xml.match(new RegExp('<Currency[^>]*Kod="' + kod + '"[\\s\\S]*?<\\/Currency>')) || [])[0] || '';
      const alis = parseFloat((block.match(/<ForexBuying>([\d.]+)<\/ForexBuying>/) || [])[1]);
      const satis = parseFloat((block.match(/<ForexSelling>([\d.]+)<\/ForexSelling>/) || [])[1]);
      return isFinite(alis) && isFinite(satis) ? { alis, satis } : null;
    };
    res.status(200).json({ kaynak: 'TCMB', tarih, usd: pick('USD'), eur: pick('EUR'), gbp: pick('GBP') });
  } catch (e) {
    res.status(502).json({ error: 'TCMB verisine ulaşılamadı', detay: String(e.message || e) });
  }
};
