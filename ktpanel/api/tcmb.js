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
/* §253f CDS — worldgovernmentbonds.com. investing.com HER İKİ sunucu yolundan
   da 403 verdi (Vercel VE Actions, Cloudflare datacenter engeli) ve tarayıcı
   yolu CORS'ta kapalı. Bu kaynak FARKLI: sayfası ham fetch ile AÇILIYOR,
   Cloudflare bot engeli YOK — asıl fark bu.
   Uç: POST /wp-json/common/v1/historical · gövdede FUNCTION:"CDS",
   COUNTRY1.SYMBOL:"13" (Türkiye), DURATA:60 (5 yıl). Kullanıcının 10 Ağu HAR
   ölçümünden alındı, TAHMİN DEĞİL.
   ÇEREZ GEREKMİYOR: istekte giden çerezlerin hepsi analitik/reklam
   (_ga, __gads, FCCDCF) — kimlik doğrulama yok.
   DEĞER DOĞRULANDI: investing.com ile BİREBİR aynı (site zaten künyesinde
   Investing.com'u kaynak gösteriyor).
   ⚠ TARİH KAYMASI: bu kaynak HAFTA SONLARINI ve tatilleri son değeri
   TAŞIYARAK dolduruyor — 08-08/09/10 hepsi 227.65. Yani DEĞER doğru, TARİH
   etiketi iyimser. O yüzden aşağıda "düz koşu" (aynı değerin tekrarı) geriye
   doğru taranıp GERÇEK gözlem günü bulunuyor. */
  if (req.query.cds) {
    try {
      const r = await fetch('https://www.worldgovernmentbonds.com/wp-json/common/v1/historical', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          'Accept': 'application/json',
          'Origin': 'https://www.worldgovernmentbonds.com',
          'Referer': 'https://www.worldgovernmentbonds.com/cds-historical-data/turkey/5-years/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
        },
        body: '{"GLOBALVAR":{"JS_VARIABLE":"jsGlobalVars","FUNCTION":"CDS","DOMESTIC":true,"ENDPOINT":"https://www.worldgovernmentbonds.com/wp-json/common/v1/historical","DATE_RIF":"2099-12-31","DEBUG":false,"OBJ":{"UNIT":"","DECIMAL":2,"UNIT_DELTA":"%","DECIMAL_DELTA":2},"COUNTRY1":{"SYMBOL":"13","PAESE":"Turkey","PAESE_UPPERCASE":"TURKEY","BANDIERA":"tr","URL_PAGE":"turkey"},"COUNTRY2":null,"OBJ1":{"DURATA_STRING":"5 Years","DURATA":60},"OBJ2":null}}'
      });
      if (!r.ok) { res.setHeader('Cache-Control','no-store'); return res.status(502).json({ ok:false, err:'CDS_HTTP_'+r.status }); }
      const d = await r.json();
    const q = (d && d.result && d.result.quote) || {};
    const seri = Object.keys(q)
      .map(k => q[k]).filter(v => v && isFinite(v.CLOSE_VAL) && v.CLOSE_VAL > 0 && v.DATA_VAL)
      .map(v => [v.DATA_VAL, +(+v.CLOSE_VAL).toFixed(2)])
      .sort((a, b) => a[0] < b[0] ? -1 : 1);
      if (!seri.length) { res.setHeader('Cache-Control','no-store'); return res.status(502).json({ ok:false, err:'CDS boş seri' }); }
    /* GERÇEK GÖZLEM GÜNÜ: kaynak hafta sonunu son değeri taşıyarak doldurur.
       Sondan geriye aynı değerin tekrarını tara, dizinin BAŞI gerçek gündür. */
    let i = seri.length - 1;
    while (i > 0 && seri[i - 1][1] === seri[i][1]) i--;
    const gercekGun = seri[i][0], son = seri[seri.length - 1];
    const oncFar = seri.slice(0, i).reverse().find(x => x[1] !== son[1]) || null;
      if (!(son[1] >= 100 && son[1] <= 1500)) {
        res.setHeader('Cache-Control','no-store');
        return res.status(502).json({ ok:false, err:'CDS makul aralık dışı: '+son[1], not:'alan kayması olabilir' });
      }
      res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=21600');
      return res.status(200).json({
        ok: true, kaynak: 'worldgovernmentbonds.com · TR 5Y CDS',
        deger: son[1], tarih: gercekGun, etiketTarih: son[0],
        onceki: oncFar ? oncFar[1] : null,
        degisim: oncFar ? +(son[1] - oncFar[1]).toFixed(2) : null,
        adet: seri.length, seri: seri.slice(-90)
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
