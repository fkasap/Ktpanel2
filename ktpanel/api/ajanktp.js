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
