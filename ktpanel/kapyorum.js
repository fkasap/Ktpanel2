// /api/kapyorum — KAP bildirimlerini çekip yorumlu analist notuna çevirir
// Katman 1: ham akış (api/kap.js ile aynı uç) → portföy + Top-40 süzgeci
// Katman 2: yorum. ANTHROPIC_API_KEY varsa Claude ile üretilir; yoksa kural bazlı şablon.
// Cache 30 dk (LLM maliyeti + KAP temposu için yeterli).
const https = require('node:https');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');

  const kucult = s => String(s||'').replace(/İ/g,'i').replace(/I/g,'ı').toLocaleLowerCase('tr');
  const UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

  // ---- 1) KAP ham akışı ----
  async function kapCek(gun){
    let cerez='';
    try{
      const w = await fetch('https://www.kap.org.tr/tr/bildirim-sorgu',{headers:{'user-agent':UA},signal:AbortSignal.timeout(8000)});
      const sc = w.headers.getSetCookie ? w.headers.getSetCookie() : [];
      cerez = sc.map(c=>c.split(';')[0]).join('; ');
    }catch(e){}
    const g=86400000, simdi=new Date(), t=d=>d.toISOString().slice(0,10);
    const r = await fetch('https://www.kap.org.tr/tr/api/disclosure/members/byCriteria',{
      method:'POST',
      headers:{'content-type':'application/json','accept':'application/json',
        'referer':'https://www.kap.org.tr/tr/bildirim-sorgu','user-agent':UA,
        ...(cerez?{'cookie':cerez}:{})},
      body: JSON.stringify({fromDate:t(new Date(simdi-(gun||4)*g)), toDate:t(simdi), mkkMemberOidList:[], subjectList:[]}),
      signal: AbortSignal.timeout(12000)});
    if(!r.ok) throw new Error('KAP HTTP '+r.status);
    const j = await r.json();
    return Array.isArray(j) ? j : (j.items||j.data||[]);
  }

  // ---- 2) Kural bazlı sınıflandırma (yorum yoksa da anlamlı satır üretir) ----
  // Sıra önemli: özel kalıplar genelden ÖNCE gelmeli (ilk eşleşen kazanır)
  const SABLON = [
    [/endeks(ler)?ine dahil|endeks kapsamına|endekslerine dahil/, 'Endekse dahil edilme — endeks takipli fonlardan mekanik talep.', 2, 1],
    [/paylar[ıi]n geri al[ıi]n|geri al[ıi]m program|geri al[ıi]nmas/, 'Geri alım programı işliyor — zayıf günlerde hisseyi destekleyen düzenli alıcı.', 1, 1],
    [/devre kesici/, 'Pay bazında devre kesici — sert fiyat hareketi sonrası; volatilite arttı, pozisyon boyutuna dikkat.', 2, 0],
    [/kâr pay[ıi] da[ğg][ıi]t[ıi]m|kar pay[ıi] da[ğg][ıi]t[ıi]m|temettü ödem|nakit kâr pay[ıi]|nakit kar pay[ıi]/, 'Kâr payı işlemi — nakit dağıtımı; temettü profiline uygun.', 1, 1],
    [/yeni iş ilişkisi|sözleşme imza|ihale sonuc|ihale kazan|sipariş al/, 'Yeni iş/sözleşme bildirimi — sipariş defterine katkı; tutar ve vade önemli.', 2, 1],
    [/birleşme|devral|bölünme/, 'Yapısal işlem (birleşme/devir) — grup yapısı sadeleşiyor; maliyet ve şeffaflık etkisi.', 2, 1],
    [/finansal takvim|finansal rapor|bilanço/, 'Bilanço takvimi/raporu — sezon geri sayımı; beklenti-gerçekleşme farkı izlenmeli.', 2, 0],
    [/sermaye art[ıi]r|bedelsiz/, 'Sermaye artırımı — pay sayısı ve seyrelme etkisi hesaba katılmalı.', 2, 0],
    [/hasar|yangın|kaza|deprem|sel /, 'Operasyonel hasar bildirimi — finansal etki ve sigorta kapsamı sorgulanmalı.', 2, -1],
    [/dava|ceza|idari para|tedbir karar/, 'Hukuki/idari süreç — tutar sınırlıysa gürültü, tekrarlıysa yapısal risk.', 2, -1],
    [/fesih|fesh|iptal|sona erme/, 'Sözleşme feshi/iptali — gelir beklentisinden düşülmeli.', 2, -1],
    [/yatırım karar|kapasite art|üretime başla|teşvik belge/, 'Yatırım/kapasite kararı — büyüme tarafına katkı, nakit çıkışı gerektirir.', 2, 1],
    [/maddi duran varlık (al[ıi]m|sat)/, 'Maddi duran varlık işlemi — bilanço yapısını değiştirir; tutar önemli.', 1, 0],
    [/pay al[ıi]m sat[ıi]m bildirimi/, 'Ortak/yönetici pay işlemi — içeriden alım-satım sinyali; tutar ve taraf önemli.', 1, 0],
    [/genel kurul|denetim kuruluşu|belge al|tse |yönetim kurulu komite/, 'Rutin kurumsal takvim — operasyonel gelişme.', 0, 0],
    [/genel bilgi formu|bilgilendirme politika|faaliyet raporu/, 'Rutin bildirim.', 0, 0]
  ];
  function sablonla(baslik){
    const b=kucult(baslik);
    for(const [re,yorum,onem,yon] of SABLON) if(re.test(b)) return {yorum, onem, yon};
    return {yorum:null, onem:1, yon:0};
  }

  // ---- 3) Claude ile yorum (anahtar varsa) ----
  async function claudeYorum(kayitlar){
    const key = process.env.ANTHROPIC_API_KEY;
    if(!key || !kayitlar.length) return null;
    const liste = kayitlar.map((x,i)=>`${i+1}. [${x.kod}] ${x.baslik}`).join('\n');
    const istem = `Aşağıda BIST şirketlerinin KAP bildirim başlıkları var. Her biri için bir portföy yöneticisine hitap eden TEK CÜMLE Türkçe yorum yaz.
Kurallar: yatırım tavsiyesi verme; ne olduğunu ve portföy açısından ne anlama geldiğini söyle; abartma; rutin bildirimlere "rutin" de; 25 kelimeyi geçme.
Yanıtı SADECE JSON dizisi olarak ver: [{"i":1,"yorum":"..."},...]

${liste}`;
    const govde = JSON.stringify({ model:'claude-sonnet-4-6', max_tokens:2000,
      messages:[{role:'user', content:istem}] });
    const yanit = await new Promise((coz,red)=>{
      const r = https.request({host:'api.anthropic.com', path:'/v1/messages', method:'POST',
        headers:{'content-type':'application/json','x-api-key':key,'anthropic-version':'2023-06-01',
                 'content-length':Buffer.byteLength(govde)}, timeout:30000},
        s=>{ let d=''; s.setEncoding('utf8'); s.on('data',x=>d+=x); s.on('end',()=>coz(d)); });
      r.on('error',red); r.on('timeout',()=>r.destroy(new Error('zaman aşımı')));
      r.write(govde); r.end();
    });
    try{
      const j=JSON.parse(yanit);
      const metin=(j.content||[]).filter(x=>x.type==='text').map(x=>x.text).join('');
      const m=metin.match(/\[[\s\S]*\]/);
      return m ? JSON.parse(m[0]) : null;
    }catch(e){ return null; }
  }

  try{
    const evren = String(req.query.kodlar||'').toUpperCase().split(',').map(s=>s.trim()).filter(s=>/^[A-Z]{3,6}$/.test(s));
    const portfoy = new Set(String(req.query.portfoy||'').toUpperCase().split(',').map(s=>s.trim()).filter(Boolean));
    const gun = Math.min(parseInt(req.query.gun)||4, 10);
    const ham = await kapCek(gun);

    // Normalize + süz
    const trTar=s=>{const m=String(s||'').match(/(\d{2})\.(\d{2})\.(\d{4})[ T]?(\d{2}):(\d{2})/);
      return m?{iso:`${m[3]}-${m[2]}-${m[1]}T${m[4]}:${m[5]}:00+03:00`, gosterim:`${+m[1]} ${['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'][+m[2]-1]}`}:null;};
    const AY_TIP = {'ODA':'ODA','DUY':'DUY','FR':'FR','CA':'CA','DG':'DG'};
    const kayitlar=[];
    const gorulen=new Set();
    for(const b of ham){
      const kodlar=String(b.stockCodes||b.relatedStocks||'').split(/[,;\s]+/).map(s=>s.trim().toUpperCase()).filter(s=>/^[A-Z]{3,6}$/.test(s));
      const kod=kodlar.find(k=>portfoy.has(k)) || kodlar.find(k=>evren.includes(k));
      if(!kod)continue;
      const baslik=String(b.subject||b.summary||'').trim(); if(!baslik)continue;
      const t=trTar(b.publishDate); if(!t)continue;
      const anahtar=kod+'|'+baslik+'|'+t.gosterim;
      if(gorulen.has(anahtar))continue; gorulen.add(anahtar);
      const tipRaw=String(b.disclosureType||b.disclosureCategory||'').toUpperCase();
      const tip=Object.keys(AY_TIP).find(x=>tipRaw.includes(x))||'DG';
      const s=sablonla(baslik);
      kayitlar.push({ d:t.gosterim, iso:t.iso, k:kod, t:tip, s:s.onem, yon:s.yon,
        baslik, ozet:s.yorum||baslik, sablon:!!s.yorum, p:portfoy.has(kod),
        url:b.disclosureIndex?('https://www.kap.org.tr/tr/Bildirim/'+b.disclosureIndex):'https://www.kap.org.tr' });
    }
    kayitlar.sort((a,b)=>b.iso.localeCompare(a.iso));
    const secili=kayitlar.slice(0, Math.min(parseInt(req.query.limit)||18, 30));

    // Yorum katmanı
    let yorumlu=false;
    if(req.query.yorum!=='0'){
      const y = await claudeYorum(secili.map(x=>({kod:x.k, baslik:x.baslik}))).catch(()=>null);
      if(y && y.length){
        y.forEach(o=>{ const i=(+o.i)-1; if(secili[i]&&o.yorum){ secili[i].ozet=String(o.yorum).trim(); secili[i].sablon=false; } });
        yorumlu=true;
      }
    }
    return res.status(200).json({ ok:secili.length>0, kaynak:'KAP', yorumKatmani: yorumlu?'claude':'şablon',
      alinma:new Date().toISOString(), gun, toplam:kayitlar.length, items:secili });
  }catch(e){
    return res.status(200).json({ ok:false, err:'KAP yorum akışı: '+String(e.message||e).slice(0,140), items:[] });
  }
};
module.exports.config = { maxDuration: 60 };
