// /api/usnews — ABD izleme listesi haber akışı (Alpha Vantage NEWS_SENTIMENT)
// Anahtar: Vercel env AV_KEY. Kota: ücretsiz ~25 istek/gün → cache 90 dk (≈16 origin isteği/gün).
// Yön etiketi AV'nin kendi sentiment skorundan: >=0.15 ▲, <=-0.15 ▼ (AV eşikleri).

const IZLEME = ['AAPL','MSFT','GOOGL','AMZN','NVDA','META','TSLA','AVGO','AMD','TSM','ASML','MU','INTC','QCOM','TXN','ORCL','CRM','ADBE','IBM','NOW','PLTR','CSCO','NFLX','DIS','JPM','GS','MS','BAC','C','WFC','V','MA','AXP','BLK','BRK-B','UNH','JNJ','PFE','MRK','ABBV','LLY','WMT','COST','HD','MCD','KO','PEP','XOM','CVX','BA'];

// "20260722T113000" (UTC) → ISO
function avTarih(s){
  const m = String(s||'').match(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?/);
  if (!m) return '';
  return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]||'00'}Z`;
}

function normalize(h){
  const izle = new Set(IZLEME);
  // Bu habere gerçekten konu olan izleme-listesi sembolleri (alaka eşiği 0.35)
  const ts = (h.ticker_sentiment||[]).filter(t=>izle.has(t.ticker) && parseFloat(t.relevance_score||0) >= 0.35);
  if (!ts.length) return null;
  const kodlar = ts.map(t=>t.ticker).slice(0,4);
  // Yön: ilgili ticker'ların skor ortalaması (habere özgü, genel skordan daha isabetli)
  const ort = ts.reduce((a,t)=>a+parseFloat(t.ticker_sentiment_score||0),0)/ts.length;
  const y = ort >= 0.15 ? 1 : ort <= -0.15 ? -1 : 0;
  const topics = (h.topics||[]).map(t=>t.topic);
  const o = (topics.includes('earnings') || Math.abs(ort) >= 0.35 || ts.some(t=>parseFloat(t.relevance_score)>=0.7)) ? 2 : 1;
  return { k: kodlar, b: String(h.title||'').slice(0,170), src: String(h.source||'').slice(0,30),
           t: topics.includes('earnings') ? 'FR' : 'HBR', o, y, ts: avTarih(h.time_published), url: h.url || '#' };
}

// ═══ FINNHUB modları (kazanç takvimi + kripto) — key: env FINNHUB_KEY ═══
// Ücretsiz tier: earnings calendar ✓, crypto quote ✓ (economic calendar + sentiment premium).
async function finnhubKazanc(req, res){
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200');
  res.setHeader('Access-Control-Allow-Origin', '*');
  const KEY = process.env.FINNHUB_KEY;
  if(!KEY) return res.status(200).json({ ok:false, err:'FINNHUB_KEY tanımlı değil (Vercel env var)', items:[] });
  /* §168 PENCERE BÖLÜNDÜ — TEŞHİSİN SONUCU.
     ?debug=1 (29 Tem 17:41) kesin cevabı verdi:
       hamKayit 1500 · tarihDagilimi 2026-08-07'den BAŞLIYOR (pencere 29 Tem'den)
       tarih dağılımı toplamı TAM 1500 · ilk semboller AARD@19-08, ACRV@19-08…
     Yani Finnhub yanıtı 1500 KAYITTA KESİYOR ve EN YENİ TARİHTEN GERİYE
     sıralıyor. 21 günlük pencere istediğimizde ilk ON GÜN taşıp düşüyordu —
     MSFT/META (29 Tem), AAPL/AMZN (30 Tem) tam o aralıktaydı.
     "Finnhub çekemiyor" DEĞİL: biz fazla geniş isteyip yanıtı taşırıyorduk.
     ÇÖZÜM: pencereyi 5 günlük dilimlere böl, paralel çek, birleştir.
     En yoğun 5 günlük dilim ölçüldü (8-12 Ağu) = 998 kayıt, sınırın altında.
     TAŞMA DENETİMİ: bir dilim 1500'e dayanırsa RAPORLANIR (sessiz kayıp yok). */
  const bugun = new Date();
  const f = d=>d.toISOString().slice(0,10);
  const GUN = 5, TOPLAM = 21, SINIR = 1500;
  const dilimler = [];
  for(let g=0; g<TOPLAM; g+=GUN){
    dilimler.push({bas:new Date(bugun.getTime()+g*86400000),
                   bit:new Date(bugun.getTime()+Math.min(g+GUN-1, TOPLAM)*86400000)});
  }
  const cek = async (d)=>{
    try{
      const url = 'https://finnhub.io/api/v1/calendar/earnings?from='+f(d.bas)+'&to='+f(d.bit)+'&token='+KEY;
      const r = await fetch(url, { signal: AbortSignal.timeout(9000) });
      if(!r.ok) return {ok:false, sebep:'HTTP '+r.status, ham:[]};
      const j = await r.json();
      const ham = j.earningsCalendar || [];
      return {ok:true, ham, tasti: ham.length >= SINIR};
    }catch(e){ return {ok:false, sebep:String(e.message||e).slice(0,60), ham:[]}; }
  };
  try{
    const sonuc = await Promise.all(dilimler.map(cek));
    const ham = [];
    const gorulen = new Set();
    sonuc.forEach(x=>x.ham.forEach(e=>{
      const anahtar = e.symbol+'|'+e.date;
      if(!gorulen.has(anahtar)){ gorulen.add(anahtar); ham.push(e); }
    }));
    const tasan = dilimler.map((d,ix)=>sonuc[ix].tasti?f(d.bas)+'→'+f(d.bit):null).filter(Boolean);
    const dusen = dilimler.map((d,ix)=>!sonuc[ix].ok?f(d.bas)+' ('+sonuc[ix].sebep+')':null).filter(Boolean);
    const izle = new Set(IZLEME);

    if(req.query && req.query.debug){
      const bak = ['MSFT','META','AAPL','AMZN','NVDA','GOOGL','TSLA','HD','CSCO'];
      const hamSet = new Set(ham.map(e=>e.symbol));
      const tarihler = {};
      ham.forEach(e=>{ tarihler[e.date] = (tarihler[e.date]||0)+1; });
      return res.status(200).json({ ok:true, debug:true,
        dilim: dilimler.map((d,ix)=>({bas:f(d.bas), bit:f(d.bit),
          kayit: sonuc[ix].ham.length, tasti: !!sonuc[ix].tasti, hata: sonuc[ix].ok?null:sonuc[ix].sebep})),
        hamKayit: ham.length, izlemeEslesen: ham.filter(e=>izle.has(e.symbol)).length,
        tasanDilim: tasan, dusenDilim: dusen,
        arananlar: bak.map(k=>({sembol:k, izlemede:izle.has(k), hamYanitta:hamSet.has(k),
          kayit: ham.filter(e=>e.symbol===k).map(e=>({tarih:e.date, saat:e.hour, epsBek:e.epsEstimate})) })),
        tarihDagilimi: Object.keys(tarihler).sort().map(t=>t+': '+tarihler[t]) });
    }

    const items = ham
      .filter(e=>izle.has(e.symbol))
      .map(e=>({
        sembol:e.symbol, tarih:e.date,
        zaman: e.hour==='bmo'?'açılış öncesi':(e.hour==='amc'?'kapanış sonrası':''),
        epsBek: e.epsEstimate, epsGercek: e.epsActual,
        gelirBek: e.revenueEstimate, gelirGercek: e.revenueActual, ceyrek:e.quarter, yil:e.year
      }))
      .sort((a,b)=>a.tarih<b.tarih?-1:1);
    return res.status(200).json({ ok:true, kaynak:'Finnhub', alinma:new Date().toISOString(),
      pencere:{bas:f(dilimler[0].bas), bit:f(dilimler[dilimler.length-1].bit), dilim:dilimler.length},
      ...(tasan.length?{uyari:'taşan dilim: '+tasan.join(', ')+' — bu aralıkta kayıt düşmüş olabilir'}:{}),
      ...(dusen.length?{dusenDilim:dusen}:{}),
      items });
  }catch(e){
    return res.status(200).json({ ok:false, err:'Finnhub: '+String(e.message||e).slice(0,100), items:[] });
  }
}

async function finnhubKripto(req, res){
  res.setHeader('Cache-Control', 's-maxage=180, stale-while-revalidate=600');
  res.setHeader('Access-Control-Allow-Origin', '*');
  const KEY = process.env.FINNHUB_KEY;
  if(!KEY) return res.status(200).json({ ok:false, err:'FINNHUB_KEY tanımlı değil', veri:[] });
  const COIN = [
    {s:'BINANCE:BTCUSDT', ad:'Bitcoin',  sembol:'BTC'},
    {s:'BINANCE:ETHUSDT', ad:'Ethereum', sembol:'ETH'},
    {s:'BINANCE:BNBUSDT', ad:'BNB',      sembol:'BNB'},
    {s:'BINANCE:SOLUSDT', ad:'Solana',   sembol:'SOL'},
    {s:'BINANCE:XRPUSDT', ad:'XRP',      sembol:'XRP'},
  ];
  const bir = async (c)=>{
    try{
      const r = await fetch('https://finnhub.io/api/v1/quote?symbol='+encodeURIComponent(c.s)+'&token='+KEY, { signal: AbortSignal.timeout(7000) });
      if(!r.ok) return null;
      const j = await r.json();
      if(j.c==null || j.c===0) return null;
      return { sembol:c.sembol, ad:c.ad, fiyat:+j.c, degisim: j.dp!=null?+(+j.dp).toFixed(2):null };
    }catch(e){ return null; }
  };
  try{
    const sonuc = (await Promise.all(COIN.map(bir))).filter(Boolean);
    return res.status(200).json({ ok:true, kaynak:'Finnhub', alinma:new Date().toISOString(), veri:sonuc });
  }catch(e){
    return res.status(200).json({ ok:false, err:'Finnhub kripto: '+String(e.message||e).slice(0,100), veri:[] });
  }
}

export default async function handler(req, res){
  if(req.query.mod==='kazanc') return finnhubKazanc(req, res);
  if(req.query.mod==='kripto') return finnhubKripto(req, res);
  res.setHeader('Cache-Control', 's-maxage=5400, stale-while-revalidate=1800');
  res.setHeader('Access-Control-Allow-Origin', '*');
  const KEY = process.env.AV_KEY;
  if (!KEY) return res.status(200).json({ ok:false, err:'AV_KEY tanımlı değil — Vercel > Settings > Environment Variables bölümüne Alpha Vantage anahtarınızı AV_KEY adıyla ekleyin', items:[] });
  try{
    // AV tuzağı: çoklu "tickers" parametresi VE mantığı işletir (hepsini birden anan haber arar).
    // Bu yüzden sembol filtresi AV'ye verilmez; geniş akış çekilir, izleme süzgecini normalize() uygular.
    // Sıralı deneme: (1) parametresiz son 300 haber, (2) yedek: financial_markets teması.
    const denemeler = [
      'https://www.alphavantage.co/query?function=NEWS_SENTIMENT&sort=LATEST&limit=300&apikey='+KEY,
      'https://www.alphavantage.co/query?function=NEWS_SENTIMENT&topics=financial_markets&sort=LATEST&limit=300&apikey='+KEY
    ];
    for (const u of denemeler){
      const r = await fetch(u, { signal: AbortSignal.timeout(9000) });
      if (!r.ok) continue;
      const j = await r.json();
      if (j.Note || j.Information) return res.status(200).json({ ok:false, err:'Alpha Vantage kota/limit mesajı döndü — birkaç saat sonra normale döner', items:[] });
      const items = (j.feed||[]).map(normalize).filter(Boolean).slice(0,60);
      if (items.length) return res.status(200).json({ ok:true, alinma:new Date().toISOString(), items });
    }
    return res.status(200).json({ ok:false, err:'Kaynak yanıt verdi ama izleme listesine uyan haber çözülemedi', items:[] });
  }catch(e){
    return res.status(200).json({ ok:false, err:'AV kaynağına ulaşılamadı: '+String(e.message||e).slice(0,100), items:[] });
  }
}
