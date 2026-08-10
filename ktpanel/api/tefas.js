// §249g TEFAS YENİ NESİL KÖPRÜSÜ (5 Ağu 2026) — eski .aspx uçları öldü
// (ERR-006). Yeni uçlar kullanıcının HAR ölçümünden; Bearer token sayfanın
// JS paketinde HARD-CODED (statik uygulama anahtarı) — bundle yenilenirse
// token değişebilir: 401/403'te panel/rapor "token yenile" der, yeni HAR
// ile 1 dakikada güncellenir. Vercel IP'leri WAF'tan geçiyor (kanıt:
// eski uç Rejected değil ERR-006 almıştı).
const SURUM = 'h4-profil';
const TB = 'Bearer ST-tefaswebwse3irfmSBj4iRAzGPbAlS94Se';
/* §249h: 401 tanısı sonrası başlıklar HAR'daki gerçek istekle BİREBİR —
   kritik eksik x-request-id idi (istek başına UUID; token'la zorunlu ikili). */
const BAS = () => ({
  'Content-Type': 'application/json',
  'Accept': '*/*',
  'Accept-Language': 'tr-TR,tr;q=0.9',
  'Authorization': TB,
  'Origin': 'https://www.tefas.gov.tr',
  'Referer': 'https://www.tefas.gov.tr/tr/fon-getirileri?fundType=YAT',
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5.2 Safari/605.1.15',
  'Pragma': 'no-cache',
  'Cache-Control': 'no-cache',
  'Sec-Fetch-Site': 'same-origin',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Dest': 'empty',
  'Cookie': 'wid451d009d027=08ce165641ab20003d69a7e941b8b852ef8d78d5d7b',   /* §249i: F5 kimlik çerezi (HAR'dan) — son koz */
  'x-request-id': (globalThis.crypto && crypto.randomUUID) ? crypto.randomUUID() :
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random()*16|0; return (c==='x'?r:(r&0x3|0x8)).toString(16); })
});
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const mod = req.query.mod || 'getiri';
  const tip = (req.query.tip || 'YAT').toUpperCase();
  try {
    let url, body;
    /* §253i AUM + YATIRIMCI SAYISI — DOĞRU UÇ BULUNDU.
       Önceki `profil` (fonProfilDtyGetir) AUM DEĞİL, fonun ALTIN/BIST100/USD
       karşısındaki KIYASLAMA GETİRİSİNİ döndürüyordu. `fonDetayGetir` boş
       dizi, `fonToplamDegerGetir`/`fonPortfoyDagilimGetir` ERR-006
       "Method not found". ÜÇÜ DE TAHMİNDİ ve üçü de yanlıştı.
       Kullanıcının 10 Ağu HAR ölçümü doğrusunu verdi: fonGnlBlgSiraliGetir
       → resultList[] · fonKodu, fiyat, tedPaySayisi, kisiSayisi,
       portfoyBuyukluk. Hepsi TEK çağrıda, sayfalamalı (toplamSayi 2030).
       TOKEN: HAR'daki Authorization, tefas.js'te ZATEN gömülü olanla BİREBİR
       AYNI — yeni sır eklenmedi, mevcut köprü altyapısı taşıyor.
       NOT: Playwright yolu (tazele.mjs ağ dinleme) F5 güvenlik duvarına
       takılıyordu ("Request Rejected"); bu uç KÖPRÜDEN çalışıyor. */
    if (mod === 'gnl') {
      url = 'https://www.tefas.gov.tr/api/funds/fonGnlBlgSiraliGetir';
      const g = String(req.query.gun || '').replace(/\D/g, '') ||
        new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const bas = Math.max(1, parseInt(req.query.bas) || 1);
      const bit = Math.min(bas + 999, Math.max(bas, parseInt(req.query.bit) || (bas + 499)));
      body = { fonTipi: tip, fonKodu: req.query.kod ? String(req.query.kod).toUpperCase() : null,
        aramaMetni: null, fonTurKod: null, fonGrubu: null, sfonTurKod: null,
        basTarih: g, bitTarih: g, basSira: bas, bitSira: bit,
        fonTurAciklama: null, dil: 'TR', kurucuKod: null };
    } else if (mod === 'profil') {   /* §253: fon KIYASLAMA getirisi (AUM DEĞİL) */
      url = 'https://www.tefas.gov.tr/api/funds/fonProfilDtyGetir';
      body = { dil:'TR', fonKodu: String(req.query.kod || '').toUpperCase(), periyod: '12' };
    } else if (mod === 'detay') {
      url = 'https://www.tefas.gov.tr/api/funds/' + String(req.query.uc || 'fonDetayGetir');
      body = { dil:'TR', fonKodu: String(req.query.kod || '').toUpperCase() };
    } else if (mod === 'fiyat') {   /* §249l: KPR HAR'ından — günlük fiyat serisi */
      url = 'https://www.tefas.gov.tr/api/funds/fonFiyatBilgiGetir';
      body = { fonKodu: String(req.query.kod || '').toUpperCase(), dil: 'TR', periyod: parseInt(req.query.p) || 1 };   /* §249m: p=36 → 3 yıllık seri */
    } else if (mod === 'liste') {
      url = 'https://www.tefas.gov.tr/api/statistics/tefas/getFplFonList';
      body = {};
    } else {
      url = 'https://www.tefas.gov.tr/api/funds/fonGetiriBazliBilgiGetir';
      body = { dil:'TR', fonTipi:tip, kurucuKodu:null, sfonTurKod:null, fonTurAciklama:null,
        islem:1, fonTurKod:null, fonGrubu:null, donemGetiri1a:'1', donemGetiri3a:'1',
        donemGetiri6a:'1', donemGetiri1y:'1', donemGetiriyb:'1', donemGetiri3y:'1',
        donemGetiri5y:'1', basTarih:null, bitTarih:null, calismaTipi:2, getiriOrani:'1' };
    }
    const r = await fetch(url, { method:'POST', headers:BAS(), body:JSON.stringify(body) });
    const txt = await r.text();
    if (!r.ok) {
      res.setHeader('Cache-Control','no-store');
      return res.status(502).json({ v:SURUM, error:'TEFAS_HTTP_'+r.status, tokenSuphesi:(r.status===401||r.status===403), ilk:txt.slice(0,180) });
    }
    let j; try { j = JSON.parse(txt); } catch { 
      res.setHeader('Cache-Control','no-store');
      return res.status(502).json({ error:'TEFAS_JSON_DEGIL', ilk:txt.slice(0,180) });
    }
    const L = j.resultList || j.data || (Array.isArray(j)?j:[]);
    res.setHeader('Cache-Control','s-maxage=1800, stale-while-revalidate=7200');
    return res.status(200).json({ v:SURUM, mod, tip, n:(L||[]).length, ornek:(L&&L[0])?Object.keys(L[0]):[], veri:L });
  } catch (e) {
    res.setHeader('Cache-Control','no-store');
    return res.status(500).json({ error:String(e && e.message || e) });
  }
};
