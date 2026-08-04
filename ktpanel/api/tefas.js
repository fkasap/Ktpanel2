// §249g TEFAS YENİ NESİL KÖPRÜSÜ (5 Ağu 2026) — eski .aspx uçları öldü
// (ERR-006). Yeni uçlar kullanıcının HAR ölçümünden; Bearer token sayfanın
// JS paketinde HARD-CODED (statik uygulama anahtarı) — bundle yenilenirse
// token değişebilir: 401/403'te panel/rapor "token yenile" der, yeni HAR
// ile 1 dakikada güncellenir. Vercel IP'leri WAF'tan geçiyor (kanıt:
// eski uç Rejected değil ERR-006 almıştı).
const TB = 'Bearer ST-tefaswebwse3irfmSBj4iRAzGPbAlS94Se';
const BAS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': TB,
  'Origin': 'https://www.tefas.gov.tr',
  'Referer': 'https://www.tefas.gov.tr/tr/fon-getirileri?fundType=YAT',
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15'
};
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const mod = req.query.mod || 'getiri';
  const tip = (req.query.tip || 'YAT').toUpperCase();
  try {
    let url, body;
    if (mod === 'liste') {
      url = 'https://www.tefas.gov.tr/api/statistics/tefas/getFplFonList';
      body = {};
    } else {
      url = 'https://www.tefas.gov.tr/api/funds/fonGetiriBazliBilgiGetir';
      body = { dil:'TR', fonTipi:tip, kurucuKodu:null, sfonTurKod:null, fonTurAciklama:null,
        islem:1, fonTurKod:null, fonGrubu:null, donemGetiri1a:'1', donemGetiri3a:'1',
        donemGetiri6a:'1', donemGetiri1y:'1', donemGetiriyb:'1', donemGetiri3y:'1',
        donemGetiri5y:'1', basTarih:null, bitTarih:null, calismaTipi:2, getiriOrani:'1' };
    }
    const r = await fetch(url, { method:'POST', headers:BAS, body:JSON.stringify(body) });
    const txt = await r.text();
    if (!r.ok) {
      res.setHeader('Cache-Control','no-store');
      return res.status(502).json({ error:'TEFAS_HTTP_'+r.status, tokenSuphesi:(r.status===401||r.status===403), ilk:txt.slice(0,180) });
    }
    let j; try { j = JSON.parse(txt); } catch { 
      res.setHeader('Cache-Control','no-store');
      return res.status(502).json({ error:'TEFAS_JSON_DEGIL', ilk:txt.slice(0,180) });
    }
    const L = j.resultList || j.data || (Array.isArray(j)?j:[]);
    res.setHeader('Cache-Control','s-maxage=1800, stale-while-revalidate=7200');
    return res.status(200).json({ mod, tip, n:(L||[]).length, ornek:(L&&L[0])?Object.keys(L[0]):[], veri:L });
  } catch (e) {
    res.setHeader('Cache-Control','no-store');
    return res.status(500).json({ error:String(e && e.message || e) });
  }
};
