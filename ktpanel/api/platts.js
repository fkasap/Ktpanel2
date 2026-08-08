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
  /* §251c TOPLU TARAMA: ?tara=1 → dataset adaylarının /v1/metadata uçları
     sırayla denenir; hangisi 200 dönerse abonelik kapsamı ORADA görünür.
     Tek tek link açmak yerine tek çağrıda envanter (ölçüm ekonomisi). */
  if (req.query.tara) {
    const adaylar = String(req.query.ds || 'market-data,price-assessments,refinery-data,forward-curves,futures,commodity-insights,oil,shipping,freight,news,research,reference-data,esg,agriculture,metals,petrochemicals,lng,power')
      .split(',').map(x => x.trim()).filter(Boolean);
    const bulgu = [];
    for (const ds of adaylar) {
      /* §251d: yol sürümlü — v1'de 404 alan dataset v3'te yaşıyor olabilir
         (market-data kanıtı). ?ver= ile değiştirilebilir; varsayılan v3. */
      const u = 'https://api.ci.spglobal.com/' + ds + '/' + String(req.query.ver || 'v3') + '/' + String(req.query.uc || 'metadata');
      try {
        const rr = await fetch(u, { headers: { 'Authorization': 'Bearer ' + anahtar, 'Accept': 'application/json', 'appkey': anahtar },
          signal: AbortSignal.timeout(12000) });
        const tt = await rr.text();
        let jj = null; try { jj = JSON.parse(tt); } catch (e) {}
        const dz = Array.isArray(jj) ? jj : (jj && (jj.results || jj.data || jj.metadata || jj.items)) || null;
        bulgu.push({ ds, durum: rr.status,
          ...(rr.ok ? { alanlar: (Array.isArray(dz) && dz[0]) ? Object.keys(dz[0]).slice(0,12) : (jj ? Object.keys(jj).slice(0,12) : null),
                        n: Array.isArray(dz) ? dz.length : null,
                        ornek: Array.isArray(dz) ? dz.slice(0,3) : String(tt).slice(0,300) }
                    : { ipucu: String(tt).slice(0,140) }) });
      } catch (e) { bulgu.push({ ds, durum: 'hata', ipucu: String(e.message || e).slice(0,60) }); }
    }
    res.setHeader('Cache-Control','no-store');
    return res.status(200).json({ v:'platts-tara',
      acik: bulgu.filter(b => b.durum === 200).map(b => b.ds),
      ozet: bulgu.map(b => b.ds + ':' + b.durum).join(' · '),
      detay: bulgu.filter(b => b.durum === 200 || b.durum === 400) });
  }

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
