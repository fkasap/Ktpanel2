// §513 HATA YANITI ÖNBELLEĞE GİRMEZ (24 Eki 2026)
// Handler'lar Cache-Control'ü (s-maxage=saatler) EN BAŞTA koyuyor ve hata halinde de 200 + {ok:false} dönüyor
// (UI ayakta kalsın diye — doğru tasarım). Ama Vercel CDN o HATAYI da saatlerce saklıyordu: 24 Eki'de HKMA tek bir
// 405 verdi, panel ve sağlık bekçisi bir sonraki deploy'a kadar herkese "HKMA HTTP 405" gösterdi; kaynak dakikalar
// sonra sağlamdı. Kural: gövde hata ise (ok:false · ok yokken err · son:{} boş seri) önbellek 60 sn'ye iner.
// Kullanım (CommonJS handler'ın İLK satırı): require('./_lib/onbellek.js')(res);
module.exports = function hataOnbellegi(res, sn) {
  if (!res || res.__hob) return; res.__hob = true;
  const kisa = 'public, s-maxage=' + (sn || 60) + ', stale-while-revalidate=' + (sn || 60);
  const hataMi = b => !!b && typeof b === 'object' && !Array.isArray(b) &&
    (b.ok === false || (b.ok == null && b.err) || (b.son && typeof b.son === 'object' && !Array.isArray(b.son) && !Object.keys(b.son).length));
  const j = res.json && res.json.bind(res);
  if (j) res.json = b => { try { if (hataMi(b)) res.setHeader('Cache-Control', kisa); } catch (e) {} return j(b); };
};
