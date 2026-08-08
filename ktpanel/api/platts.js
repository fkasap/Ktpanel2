// §251b S&P GLOBAL COMMODITY INSIGHTS (Platts) KÖPRÜSÜ — ayrı fonksiyon.
// Kur ucuna bindirmek yerine kendi dosyası (kullanıcı tercihi): farklı
// kimlik modeli, farklı hata dili, farklı kota — karıştırmak bakımı zorlaştırır.
// Anahtar Vercel env SPG_KEY'de; koda yazılmaz, yanıtta yer almaz.
// KEŞİF MODU: ?yol=<endpoint>[&p=<querystring>] — uç ve alan adları
// TAHMİN EDİLMEZ, ÖLÇÜLÜR (EVDS/TEFAS dersi); yanıt alan adlarını basar.
// KORUMALI: middleware muafiyeti YOK — panel oturumuyla çağrılır, böylece
// üçüncü kişiler abonelik kotasını tüketemez.
module.exports = async (req, res) => {
  const anahtar = process.env.SPG_KEY;
  if (!anahtar) { res.setHeader('Cache-Control','no-store'); return res.status(500).json({ error:'SPG_KEY tanımsız (Vercel env)' }); }
  const yol = String(req.query.yol || '/market-data/reference-data/v3/search');
  const ek  = req.query.p ? ('?' + String(req.query.p)) : '';
  const url = 'https://api.ci.spglobal.com' + (yol.startsWith('/') ? yol : '/' + yol) + ek;
  try {
    const r = await fetch(url, { headers: {
      'Authorization': 'Bearer ' + anahtar,
      'Accept': 'application/json',
      'appkey': anahtar,
      'User-Agent': 'KtPanel/1.0'
    }, signal: AbortSignal.timeout(20000) });
    const txt = await r.text();
    let j = null; try { j = JSON.parse(txt); } catch (e) {}
    if (!r.ok) {
      res.setHeader('Cache-Control','no-store');
      return res.status(502).json({ v:'platts-1', hata:'HTTP_'+r.status,
        tani: (r.status===401||r.status===403)
          ? 'SPG_KEY doğrudan Bearer kabul edilmedi — token akışı (client credentials) gerekebilir'
          : (r.status===404 ? 'uç yolu farklı — portaldaki tam path gerekir' : 'parametre/kapsam'),
        url, ilk: txt.slice(0,400) });
    }
    const dizi = Array.isArray(j) ? j : (j && (j.results || j.data || j.items || j.records)) || null;
    res.setHeader('Cache-Control','s-maxage=900, stale-while-revalidate=3600');
    return res.status(200).json({ v:'platts-1', url,
      ustAnahtarlar: (j && !Array.isArray(j)) ? Object.keys(j).slice(0,15) : null,
      n: Array.isArray(dizi) ? dizi.length : null,
      alanlar: (Array.isArray(dizi) && dizi[0]) ? Object.keys(dizi[0]) : null,
      ornek: Array.isArray(dizi) ? dizi.slice(0,2) : (j ? JSON.stringify(j).slice(0,600) : txt.slice(0,600)) });
  } catch (e) {
    res.setHeader('Cache-Control','no-store');
    return res.status(500).json({ v:'platts-1', error:String(e && e.message || e) });
  }
};
