// TCMB resmi kurlar — sunucu tarafında today.xml'den çekilir (CORS engeli yok)
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  /* §248c SPK MODU (?spk=1&yil&ay): fonksiyon limitini korumak için ayrı uç
     açmak yerine kamu-veri kardeşine bindirildi (api/spk.js İPTAL, hiç deploy
     edilmedi). Kaynak: ws.spk.gov.tr Seryet — kullanıcı DevTools ölçümü. */
  if (req.query.spk) {
    const yil = parseInt(req.query.yil) || new Date().getFullYear();
    const ay  = parseInt(req.query.ay)  || new Date().getMonth();
    try {
      const r = await fetch('https://ws.spk.gov.tr/SeryetPortfoyDegerleri/api/GetPortfoyDegerleri?yil='+yil+'&ay='+ay, {
        headers: { 'Accept': 'application/json', 'Origin': 'https://spk.gov.tr', 'Referer': 'https://spk.gov.tr/' }
      });
      if (!r.ok) { res.setHeader('Cache-Control','no-store'); return res.status(502).json({ error: 'SPK_HTTP_'+r.status }); }
      const d = await r.json();
      const dolu = Array.isArray(d) ? d.filter(x => (x.yonetilenToplamPortfoyBuyuklugu||0) > 0).length : 0;
      res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=86400');
      return res.status(200).json({ yil, ay, dolu, toplam: Array.isArray(d)?d.length:0, veri: d });
    } catch (e2) {
      res.setHeader('Cache-Control','no-store');
      return res.status(500).json({ error: String(e2 && e2.message || e2) });
    }
  }
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
