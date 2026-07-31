// /api/ajan — Ajanın SUNUCU organları: bulut hafıza (KV) + sabah cron'u
// mod=oku  : KV'deki ajan hafızasını döndürür (tüm cihazlar aynı notları görür)
// mod=yaz  : client'ın hafıza blob'unu KV'ye yazar (localStorage'ın bulut ikizi)
// mod=cron : Vercel Cron (günde 1, sabah) — son bilinen panel bağlamından
//            GÜNDEM NOTU üretir; kullanıcı paneli açmadan not hazırdır.
// KV: Upstash Redis REST (env: UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN)
// KV env yoksa zarif düşüş: {ok:false,'kv-yok'} → client localStorage ile devam eder.
const KV_ANAHTAR = 'ktpanel_ajan_v1';

async function kvKomut(dizi){
  const URL = process.env.UPSTASH_REDIS_REST_URL, TOK = process.env.UPSTASH_REDIS_REST_TOKEN;
  if(!URL||!TOK) return { yok:true };
  try{
    const r = await fetch(URL, { method:'POST',
      headers:{ 'Authorization':'Bearer '+TOK, 'Content-Type':'application/json' },
      body: JSON.stringify(dizi), signal: AbortSignal.timeout(8000) });
    const j = await r.json();
    if (j && j.error) return { err: String(j.error).slice(0,120) };   // Upstash hatası
    if (!r.ok) return { err: 'HTTP '+r.status };
    return j;
  }catch(e){ return { err:String(e.message||e).slice(0,80) }; }
}

async function aiUret(prompt, maxTok){
  const KEY = process.env.ANTHROPIC_API_KEY;
  if(!KEY) return null;
  try{
    const r = await fetch('https://api.anthropic.com/v1/messages', { method:'POST',
      headers:{ 'x-api-key':KEY, 'anthropic-version':'2023-06-01', 'content-type':'application/json' },
      body: JSON.stringify({ model:'claude-haiku-4-5-20251001',
        max_tokens: Math.min(2500, maxTok||900),
        messages:[{ role:'user', content: prompt }] }),
      signal: AbortSignal.timeout(30000) });
    const d = await r.json();
    return (d&&d.content&&d.content[0]&&d.content[0].text) ? d.content[0].text : null;
  }catch(e){ return null; }
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  const mod = req.query.mod;

  // ── OKU: bulut hafıza → client ──
  if(mod === 'oku'){
    const r = await kvKomut(['GET', KV_ANAHTAR]);
    if(r.yok) return res.status(200).json({ ok:false, err:'kv-yok' });
    if(r.err) return res.status(200).json({ ok:false, err:r.err });
    let blob = null;
    try{ blob = r.result ? JSON.parse(r.result) : null; }catch(e){}
    return res.status(200).json({ ok:!!blob, blob });
  }

  // ── YAZ: client hafızası → bulut ──
  if(mod === 'yaz'){
    if(req.method !== 'POST') return res.status(200).json({ ok:false, err:'POST gerekli' });
    let body = req.body;
    if(!body||typeof body==='string'){ try{ body=JSON.parse(body||'{}'); }catch(e){ body={}; } }
    if(!body.blob) return res.status(200).json({ ok:false, err:'blob yok' });
    const veri = JSON.stringify(body.blob);
    if(veri.length > 900000) return res.status(200).json({ ok:false, err:'blob çok büyük' });
    const r = await kvKomut(['SET', KV_ANAHTAR, veri]);
    if(r.yok) return res.status(200).json({ ok:false, err:'kv-yok' });
    if(r.err) return res.status(200).json({ ok:false, err:r.err });
    if(r.result!=='OK') return res.status(200).json({ ok:false, err:'SET beklenmedik yanıt: '+JSON.stringify(r).slice(0,100) });
    return res.status(200).json({ ok:true, boyut:veri.length });
  }

  // ── CRON: sabah üretimi (Vercel Cron çağırır) ──
  if(mod === 'cron'){
    // Güvenlik: Vercel cron isteği CRON_SECRET taşır (middleware muafiyeti de buna bağlı)
    const beklenen = process.env.CRON_SECRET;
    const gelen = (req.headers['authorization']||'');
    if(beklenen && gelen !== 'Bearer '+beklenen)
      return res.status(401).json({ ok:false, err:'cron yetkisiz' });
    const r = await kvKomut(['GET', KV_ANAHTAR]);
    if(r.yok||r.err||!r.result) return res.status(200).json({ ok:false, err:'hafıza yok — panel en az bir kez açılmalı' });
    let blob = {};
    try{ blob = JSON.parse(r.result); }catch(e){}
    const baglam = blob.__BAGLAM__ && blob.__BAGLAM__.metin;
    if(!baglam) return res.status(200).json({ ok:false, err:'bağlam yok' });
    const bugunTR = new Date().toLocaleDateString('tr-TR',{ day:'numeric', month:'long', weekday:'long' });
    const metin = await aiUret(
      'Sen KTPanel adlı katılım-finans portföy panelinin yerleşik ajanısın. Bugün '+bugunTR+', sabah brifingi yazıyorsun. '+
      'Aşağıda panelin SON BİLİNEN canlı verileri var (dünden). Multi-asset fon yöneticisi tonunda, Türkçe, 5-7 cümlelik '+
      'SABAH GÜNDEM NOTU yaz: günün en kritik 2-3 teması, veriler arası bağ, izlenecek olaylar, duruş cümlesi. '+
      'Rakamları verilerden al, uydurma; verilerin dünkü olduğunu bil, "dün itibarıyla" de. Doğrudan nota başla.\n\n'+baglam, 900);
    if(!metin) return res.status(200).json({ ok:false, err:'AI üretemedi' });
    blob.__GUNDEM__ = { html: metin.trim(), saat: 'sabah cron', ts: Date.now(), kaynak:'cron' };
    await kvKomut(['SET', KV_ANAHTAR, JSON.stringify(blob)]);
    return res.status(200).json({ ok:true, uretildi:true });
  }

  // ── TEST: KV sağlık kontrolü (küçük SET+GET, ham yanıtlar) ──
  /* §215 ?mod=bilanco — METRİKTEN KART TASLAĞI.
     Panel önce /api/kap?mod=kart ile metrikleri alır, sonra buraya POST eder.
     NEDEN SUNUCU SUNUCUYA ÇAĞIRMIYOR: §208'de ölçüldü — kendi sitesine HTTP
     isteği middleware'e takılıyor ve gecikme ekliyor. Tarayıcı iki ucu da
     çağırabiliyor, orkestrasyon orada.
     TASLAK ÜRETİR, KART YAYINLAMAZ. Skor vermez. Kullanıcı okur, düzeltir,
     onaylar. §204'te kararlaştırıldı: yazma emeği kalkar, yargı insanda kalır. */
  if (mod === 'bilanco') {
    if (req.method !== 'POST') return res.status(405).json({ ok:false, err:'POST gerekli' });
    let g = req.body;
    if (typeof g === 'string') { try{ g = JSON.parse(g); }catch(e){ g = null; } }
    if (!g || !g.metrikler) return res.status(400).json({ ok:false, err:'metrikler gerekli — /api/kap?mod=kart çıktısını gönder' });

    const kod   = String(g.kod || '?').toUpperCase().slice(0,8);
    const unvan = String(g.unvan || '').slice(0,80);
    const donem = String(g.donem || '').slice(0,20);
    const temel = String(g.temel || '').slice(0,40);

    /* İSTEM — bugün elle yazılan kartlardan türedi. Her kural bir VAKAYA
       dayanıyor; soyut "iyi analiz yap" demiyor, NEYE BAKILACAĞINI söylüyor. */
    const istem =
`Sen bir katılım finans fon yöneticisinin analistisin. Aşağıdaki bilanço metriklerinden bir TASLAK kart yaz.

ŞİRKET: ${kod}${unvan ? ' — '+unvan : ''}
DÖNEM: ${donem}
TEMEL: ${temel}
Birim: BİN TL. Marjlar yüzde. y/y = geçen yılın aynı çeyreği.

METRİKLER:
${JSON.stringify(g.metrikler, null, 1)}

OTOMATİK İŞARETLER (bakılacak yerler, yorum değil):
${(g.isaretler||[]).map(x=>'- '+x.tip+': '+x.not).join('\n') || '- yok'}

NASIL YAZACAKSIN:

1) MANŞETE DEĞİL ALTINA BAK. En sık tuzak: bir kalem iyi görünürken altındaki bozuk olması.
   - Net kâr artarken faaliyet kârı düşüyorsa, farkı finansman gideri ya da parasal pozisyon taşıyordur. Bu operasyonel iyileşme DEĞİLDİR ve açıkça söylenmelidir.
   - Faaliyet kârı artarken FAVÖK düşüyorsa sebep amortisman değişimidir; muhasebesel, operasyonel değil.
   - Bankada karşılık çeyreklik sıçrarken yıllık bazda azalmış olabilir. İkisini AYRI söyle; yalnız birine bakan yanılır.

2) BÜYÜK YÜZDELERE DİKKAT. %200 artış çoğu zaman düşük bazdan gelir. Mutlak tutarı da yaz ki okuyan ölçeği görsün.

3) MARJ KATMANLARINI YAN YANA OKU: brüt → faaliyet → net. Hangi katmanda kayıp olduğu, sorunun NEREDE olduğunu söyler. Brüt marj korunup faaliyet marjı düşüyorsa sorun üretimde değil faaliyet giderlerinde.

4) SKOR VERME. Yatırım tavsiyesi verme. "Al", "sat", "cazip" gibi kelimeler kullanma.

5) EMİN OLMADIĞINI SÖYLE. Bir kalem eksikse ya da çelişkili görünüyorsa bunu yaz, doldurma.

BİÇİM (sade metin, başlık yok):
ÖZET: 2-3 cümle. Manşet ne diyor, altında ne var.
DİKKAT: 2-3 madde. Her madde bir tespit ve NEDEN önemli olduğu.
İZLENECEK: 1-2 madde. Gelecek çeyrekte hangi eşiğe bakılmalı.

Türkçe yaz. Kısa cümle kur. Rakamları binlik ayraçla yaz (100.016.179).`;

    const metin = await aiUret(istem, 900);
    if (!metin) return res.status(200).json({ ok:false, kod,
      err:'AI yanıt vermedi — ANTHROPIC_API_KEY tanımlı mı?' });

    return res.status(200).json({ ok:true, kod, donem, taslak:metin,
      uyari:'TASLAK. Skor ve yayın kararı insana aittir; okunmadan karta işlenmemelidir.',
      uretim:new Date().toISOString() });
  }

  if(mod === 'test'){
    const urlVar = !!process.env.UPSTASH_REDIS_REST_URL, tokVar = !!process.env.UPSTASH_REDIS_REST_TOKEN;
    const setR = await kvKomut(['SET','ktpanel_ping','pong-'+Date.now()]);
    const getR = await kvKomut(['GET','ktpanel_ping']);
    const anaR = await kvKomut(['STRLEN', KV_ANAHTAR]);
    return res.status(200).json({ ok:!(setR.err||getR.err),
      env:{ url:urlVar, token:tokVar }, set:setR, get:getR, anaBlobUzunluk:anaR });
  }
  return res.status(200).json({ ok:false, err:'mod gerekli: oku|yaz|cron|test' });
};
