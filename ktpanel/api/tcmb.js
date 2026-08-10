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
  /* §253b CDS MODU (?cds=1) — §248c ile AYNI GEREKÇE: yeni uç açmak yerine
     kamu-veri kardeşine bindirildi (fonksiyon kotası 10/12, dar).
     KAYNAK: api.investing.com financialdata/1096486 (Türkiye 5Y CDS, USD).
     Enstrüman kimliği 1096486, kullanıcının 10 Ağu tarihli DevTools HAR
     ölçümünden alındı — TAHMİN DEĞİL, gözlem.
     ÇEREZ/TOKEN GEREKTİRMİYOR: yalnız Origin/Referer/User-Agent/domain-id
     sabit başlıkları. Bu, api/tefas.js'teki gömülü Bearer+F5 çerezinden
     (§249i, bugün "Request Rejected" veriyor) YAPISAL OLARAK daha sağlam —
     kişiye/oturuma bağlı bir sır taşımıyor.
     YİNE DE KIRILGAN: Cloudflare arkasında, bir gün kapanabilir. O yüzden
     app.js tarafı BAŞARISIZLIĞI GÖRÜNÜR kılar — canlı gelmezse damgalı
     yedeğe düşer ve "damgalı" etiketini BASAR (§245k). Sessizce eski sayı
     göstermez.
     YANIT: {ok, deger, tarih, onceki, degisim, seri:[[ms,c]...]} */
  if (req.query.cds) {
    try {
      const say = Math.min(400, Math.max(5, parseInt(req.query.gun) || 160));
      const r = await fetch('https://api.investing.com/api/financialdata/1096486/historical/chart/?interval=P1D&pointscount=' + say, {
        headers: {
          'Accept': 'application/json',
          'Origin': 'https://tr.investing.com',
          'Referer': 'https://tr.investing.com/rates-bonds/turkey-cds-5-year-usd',
          'domain-id': 'tr',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
        }
      });
      if (!r.ok) { res.setHeader('Cache-Control','no-store'); return res.status(502).json({ ok:false, err:'CDS_HTTP_'+r.status }); }
      const d = await r.json();
      const ham = Array.isArray(d && d.data) ? d.data : [];
      /* biçim: [zaman_ms, o, h, l, c, ...] — kapanış 5. alan (indeks 4) */
      const seri = ham
        .filter(x => Array.isArray(x) && x.length > 4 && isFinite(x[0]) && isFinite(x[4]) && x[4] > 0)
        .map(x => [x[0], +x[4]]);
      if (!seri.length) { res.setHeader('Cache-Control','no-store'); return res.status(502).json({ ok:false, err:'CDS boş seri', hamAdet: ham.length }); }
      const son = seri[seri.length - 1], onc = seri.length > 1 ? seri[seri.length - 2] : null;
      /* AKLI BAŞINDA ARALIK: Türkiye CDS'i 2016'dan beri 150-950 bandında.
         Dışına çıkan değer alan kayması ya da biçim değişikliğidir — sessizce
         kabul edilmez (§245s: kayıt-seviyesi arıza, katman-seviyesi ceza almaz). */
      if (!(son[1] >= 100 && son[1] <= 1500)) {
        res.setHeader('Cache-Control','no-store');
        return res.status(502).json({ ok:false, err:'CDS makul aralık dışı: '+son[1], not:'alan kayması olabilir' });
      }
      res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=21600');
      return res.status(200).json({
        ok: true, kaynak: 'investing.com · TR 5Y CDS (id 1096486)',
        deger: +son[1].toFixed(2),
        tarih: new Date(son[0]).toISOString().slice(0, 10),
        onceki: onc ? +onc[1].toFixed(2) : null,
        degisim: onc ? +(son[1] - onc[1]).toFixed(2) : null,
        adet: seri.length, seri
      });
    } catch (e3) {
      res.setHeader('Cache-Control','no-store');
      return res.status(500).json({ ok:false, err: String(e3 && e3.message || e3) });
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
