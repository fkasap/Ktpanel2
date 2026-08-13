// Küresel + BIST piyasa köprüsü — Yahoo Finance (CORS'suz, sunucu tarafı).
// 3 aylık günlük seriden 1G/1H/1A/3A değişimleri hesaplar; sektör ısı haritası
// ve model portföy sicili bu endpoint'ten CANLI beslenir.

// Asya-Pasifik piyasa modu: Twelve Data'dan endeks+forex+tahvil (batch, tek istek).
// API key process.env.TWELVEDATA_KEY (Vercel env var, koda gömülü DEĞİL).
// Ucretsiz tier: 800/gun, 8/dk. Batch endpoint 1 istek = limite rahat.
// Sembol formatlari degisebilir; donmeyeni atlar. Veri ~gecikmeli (ucretsiz tier).
async function asyaModu(req, res){
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=900');
  const key = process.env.TWELVEDATA_KEY;
  if(!key) return res.status(200).json({ ok:false, err:'TWELVEDATA_KEY tanımlı değil (Vercel env var)' });
  // Sembol seti (geniş kapsam). ad = gösterim adı.
  // SADECE Yahoo'da OLMAYAN eksikler (endekslerin çoğu market.js Yahoo'dan geliyor).
  // Bu, Twelve Data 8/dk limitini korur ve mükerrer çekimi önler.
  // Twelve Data ucretsiz tier: endeksler (STI/SENSEX) ve tahvil YOK — sadece forex geliyor.
  // Asya endeksleri zaten market.js Yahoo'dan cekiliyor (Nikkei/KOSPI/HangSeng/...).
  // Bu mod Yahoo'nun vermedigi Asya FOREX'i ekler (4 pariteler, dogrulandi).
  const SEMBOL = [
    {s:'USD/JPY',ad:'USD/JPY',grup:'forex', ulke:'Japon Yeni'},
    {s:'USD/CNH',ad:'USD/CNH',grup:'forex', ulke:'Çin Yuanı (offshore)'},
    {s:'USD/KRW',ad:'USD/KRW',grup:'forex', ulke:'Kore Wonu'},
    {s:'USD/INR',ad:'USD/INR',grup:'forex', ulke:'Hint Rupisi'},
  ];
  const semboller = SEMBOL.map(x=>x.s).join(',');
  try{
    const url = 'https://api.twelvedata.com/quote?symbol='+encodeURIComponent(semboller)+'&apikey='+key;
    const bas={'User-Agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36','Accept':'application/json,*/*'};
    let r = null;
    try{ r = await fetch(url, { headers:bas, signal: AbortSignal.timeout(20000) }); }
    catch(e1){ await new Promise(x=>setTimeout(x,800));
      try{ r = await fetch(url, { headers:bas, signal: AbortSignal.timeout(20000) }); }catch(e2){ r=null; } }
    if(!r) throw new Error('HKMA yanıt vermedi (iki deneme)');
    const j = await r.json();
    // Batch yanıtı: { "N225": {...}, "HSI": {...} } ya da tek sembolse düz obje
    const out = [];
    SEMBOL.forEach(meta=>{
      const d = j[meta.s] || (j.symbol===meta.s ? j : null);
      if(d && !d.code && (d.close!=null || d.price!=null)){
        const fiyat = parseFloat(d.close!=null?d.close:d.price);
        const chg = d.percent_change!=null ? parseFloat(d.percent_change) : null;
        if(isFinite(fiyat)){
          out.push({ sembol:meta.s, ad:meta.ad, grup:meta.grup, ulke:meta.ulke,
            fiyat:+fiyat.toFixed(meta.grup==='forex'?4:2),
            degisim: chg!=null&&isFinite(chg) ? +chg.toFixed(2) : null });
        }
      }
    });
    return res.status(200).json({ ok:true, kaynak:'Twelve Data', gecikmeli:true,
      tarih:new Date().toISOString().slice(0,16).replace('T',' '),
      veri:out, istenenSayi:SEMBOL.length, gelenSayi:out.length,
      ham: out.length===0 ? j : undefined });   // hiç veri yoksa ham yanıtı debug için döndür
  }catch(e){
    return res.status(200).json({ ok:false, err:'Twelve Data: '+String(e.message||e).slice(0,120) });
  }
}

// §119 HAM SERİ — teknik analiz ekranının veri kaynağı.
// Diğer modlar ÖZET döndürür (p, chg, h1, a1, q3); teknik göstergeler HAM seriye
// ihtiyaç duyar. TATİL BARI SÜZGECİ: Yahoo kapalı günleri düz barla doldurur
// (açılış=yüksek=düşük=kapanış, hacim 0). İKİSİ BİRDEN olmalı — yalnız hacim 0
// yetmez (likit olmayan isimde gerçek olabilir), yalnız düz OHLC de yetmez
// (limitli gün gerçektir).
async function seriModu(req, res){
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=3600');
  const kod = String((req.query && req.query.kod) || '').toUpperCase().replace(/[^A-Z0-9.]/g, '').slice(0, 12);
  if (!kod) return res.status(200).json({ ok:false, err:'kod gerekli' });
  const gun = Math.min(Math.max(parseInt(req.query && req.query.gun) || 365, 60), 1825);
  const aralik = gun <= 95 ? '3mo' : gun <= 200 ? '6mo' : gun <= 400 ? '1y' : gun <= 800 ? '2y' : '5y';
  const sembol = /\./.test(kod) ? kod : (kod + '.IS');
  try{
    const url = 'https://query1.finance.yahoo.com/v8/finance/chart/' +
      encodeURIComponent(sembol) + '?interval=1d&range=' + aralik;
    const r = await fetch(url, { headers:{ 'User-Agent':'Mozilla/5.0 (KtPanel/1.0)' },
      signal: AbortSignal.timeout(12000) });
    if(!r.ok) return res.status(200).json({ ok:false, err:'Yahoo HTTP '+r.status, bar:[] });
    const j = await r.json();
    const d = j && j.chart && j.chart.result && j.chart.result[0];
    if(!d) return res.status(200).json({ ok:false, err:'sembol \u00e7\u00f6z\u00fclemedi: '+sembol, bar:[] });
    const q = ((d.indicators||{}).quote||[])[0] || {};
    const T = d.timestamp || [];
    const bar = [], atlanan = [];
    for(let i=0;i<T.length;i++){
      const o=q.open&&q.open[i], h=q.high&&q.high[i], l=q.low&&q.low[i], c=q.close&&q.close[i];
      const v=(q.volume&&q.volume[i])||0;
      if(![o,h,l,c].every(x=>typeof x==='number'&&isFinite(x)&&x>0)) continue;
      if((o===h && h===l && l===c) && v===0){ atlanan.push(1); continue; }
      bar.push({ t:new Date(T[i]*1000).toISOString().slice(0,10),
                 o:+o.toFixed(4), h:+h.toFixed(4), l:+l.toFixed(4), c:+c.toFixed(4), v:v });
    }
    const meta = d.meta || {};
    return res.status(200).json({ ok: bar.length>20, kod, sembol, aralik,
      adet: bar.length, atlananTatilBari: atlanan.length,
      sonFiyat: (typeof meta.regularMarketPrice==='number') ? meta.regularMarketPrice : (bar.length?bar[bar.length-1].c:null),
      paraBirimi: meta.currency || null, bar,
      ...(bar.length>20 ? {} : { err:'seri k\u0131sa: '+bar.length+' bar' }) });
  }catch(e){
    return res.status(200).json({ ok:false, err:'Yahoo seri: '+String(e.message||e).slice(0,110), bar:[] });
  }
}

// Hafif toplu fiyat modu: portföy + değerleme için 141 hisse SON fiyatı (seri yok).
// ?mod=fiyat&kodlar=AAA,BBB,... → { fiyat:{AAA:12.3,...}, tarih }
async function fiyatModu(req, res){
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=180, stale-while-revalidate=600');
  const kodlar = String(req.query.kodlar||'').split(',').map(x=>x.trim().toUpperCase()).filter(Boolean).slice(0,200);
  if(!kodlar.length) return res.status(400).json({ ok:false, err:'kodlar boş' });
  const sonFiyat = async (kod) => {
    try{
      const url='https://query1.finance.yahoo.com/v8/finance/chart/'+encodeURIComponent(kod+'.IS')+'?interval=1d&range=1d';
      const r=await fetch(url,{headers:{'User-Agent':'Mozilla/5.0 (KtPanel/1.0)'},signal:AbortSignal.timeout(8000)});
      if(!r.ok) return null;
      const j=await r.json();
      const res0=j&&j.chart&&j.chart.result&&j.chart.result[0];
      if(!res0) return null;
      const m=res0.meta||{};
      if(typeof m.regularMarketPrice==='number') return m.regularMarketPrice;
      const c=(((res0.indicators||{}).quote||[])[0]||{}).close||[];
      for(let i=c.length-1;i>=0;i--) if(typeof c[i]==='number'&&isFinite(c[i])) return c[i];
      return null;
    }catch(e){ return null; }
  };
  // 10'lu havuz (Yahoo'ya nazik, Vercel süresine sığar)
  const out={}; let i=0;
  const isci=async()=>{ while(i<kodlar.length){ const k=i++; const v=await sonFiyat(kodlar[k]); if(v!=null) out[kodlar[k]]=+v.toFixed(2); } };
  await Promise.all(Array.from({length:Math.min(10,kodlar.length)}, isci));
  return res.status(200).json({ ok:true, fiyat:out, tarih:new Date().toISOString().slice(0,10), adet:Object.keys(out).length });
}


// ═══ FRED modu — ABD tahvil getirileri + enflasyon beklentisi (canlı) ═══
// Key: env FRED_KEY (https://fred.stlouisfed.org). Seriler: DGS2/5/10/30 (tahvil),
// T5YIE/T10YIE (breakeven enflasyon bekl.), DFF (efektif fed funds).
async function fredModu(req, res){
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200');
  res.setHeader('Access-Control-Allow-Origin', '*');
  const KEY = process.env.FRED_KEY;
  if(!KEY) return res.status(200).json({ ok:false, err:'FRED_KEY tanımlı değil (Vercel env var)', seriler:{} });
  // tip: 'seviye' = son değer + fark · 'yillik' = endeksten yıllık % hesabı (12 ay geriye)
  const SERILER = [
    ['DGS2','seviye'],['DGS5','seviye'],['DGS10','seviye'],['DGS30','seviye'],
    ['T5YIE','seviye'],['T10YIE','seviye'],['DFF','seviye'],
    /* §174: POLİTİKA FAİZİ. Panelde yalnız DFF (EFEKTİF fed funds) vardı — o,
       aralığın içinde yüzen piyasa oranıdır. Fed'in AÇIKLADIĞI şey HEDEF ARALIK:
       DFEDTARL (alt) – DFEDTARU (üst). 29 Tem 2026 kararı %3,50–3,75.
       İkisini karıştırmak TCMB tarafındaki AOFM/politika faizi ayrımının aynısı
       (§125): biri kurulun ilan ettiği, diğeri piyasada oluşan. Panel ikisini de
       gösterir ve aradaki farkı yazar. */
    ['DFEDTARL','seviye'],['DFEDTARU','seviye'],
    ['DFII10','seviye'],['BAMLH0A0HYM2','seviye'],['DTWEXBGS','seviye'],
    ['VIXCLS','seviye'],['ICSA','seviye'],['UNRATE','seviye'],
    /* Enflasyon kırılımı (endeks → yıllık %)
       §271 SA -> NSA. Manşet ve çekirdek TÜFE için MEVSİMSELLİKTEN ARINDIRILMAMIŞ
       (NS) seriler kullanılır. ÖLÇÜM (12 Ağu, BLS Temmuz yayını):
         BLS manşet %3,4 · çekirdek %2,5   (NSA, 12 aylık değişim — dünyanın
                                            konuştuğu ve haberlere giren rakam)
         panel   %3,54 · %2,79             (CPIAUCSL/CPILFESL = SA serilerinden
                                            hesaplanmış y/y)
       Hesap DOĞRUYDU, SERİ YANLIŞTI. BLS 12 aylık değişimi HER ZAMAN NSA
       yayınlar; SA seri aylık değişim içindir. İkisinden y/y çıkarınca
       manşette 0,14, çekirdekte 0,29 puan sapma oluşuyordu.
       CPIAUCNS = manşet NSA · CPILFENS = çekirdek NSA.
       DİĞERLERİ SA KALDI: enerji/barınma/hizmet kalemleri kırılım içindir ve
       panelde ivme (fark) ile okunur; orada SA daha stabil. PCEPILFE zaten
       Fed'in kendi pusulası ve SA yayınlanır. */
    ['CPIAUCNS','yillik'],['CPILFENS','yillik'],['CPIENGSL','yillik'],
    ['CUSR0000SAH1','yillik'],['CUSR0000SASLE','yillik'],['PCEPILFE','yillik'],
    // Fed bilançosu (seviye, mlr$)
    ['WALCL','seviye'],['RRPONTSYD','seviye'],['WRESBAL','seviye'],
    /* §280 GSYH — ABD ve EURO BÖLGESİ, ikisi de FRED'den.
       ECB'nin MNA akışı da var ama anahtar yapısı §275'te gördüğümüz gibi
       degisken; FRED Eurostat verisini zaten tasiyor ve bu uc CALISIYOR.
       Tek kaynak, tek bicim, tahmin yok.
       A191RL1Q225SBEA : ABD reel GSYH, ceyreklik YILLIKLANDIRILMIS % —
                         "ekonomi %X buyudu" dendiginde kastedilen MANSET rakam.
                         Zaten yuzde, o yuzden 'seviye'.
       CLVMNACSCAB1GQEA19 : Euro bolgesi reel GSYH SEVIYESI (zincirlenmis).
                         'yillik' ile y/y buyumeye cevrilir — §272'deki tarih
                         eslemesi ceyreklik seride de calisir (12 ay geri =
                         ayni ceyrek, gecen yil). */
    ['A191RL1Q225SBEA','seviye'],['CLVMNACSCAB1GQEA19','yillik'],
    // Konjonktür & resesyon radarı
    ['T10Y3M','seviye'],['SAHMREALTIME','seviye'],['GDPNOW','seviye'],
    ['NFCI','seviye'],['PAYEMS','seviye'],['RSAFS','yillik'],['UMCSENT','seviye'],
    // Euro bölgesi 10Y tahvil getirileri (OECD serisi — ECB ağı kapalıyken sunucu yolu)
    ['IRLTLT01DEM156N','seviye'],['IRLTLT01ITM156N','seviye'],['IRLTLT01FRM156N','seviye']
  ];
  const bir = async ([id, tip])=>{
    try{
      const limit = tip==='yillik' ? 26 : 10; // yıllık hesap için 13+ ay gözlem
      const u='https://api.stlouisfed.org/fred/series/observations?series_id='+id+
        '&api_key='+KEY+'&file_type=json&sort_order=desc&limit='+limit;
      const r = await fetch(u, { signal: AbortSignal.timeout(8000) });
      if(!r.ok) return [id, null];
      const j = await r.json();
      const gozlemler = (j.observations || []).filter(o=>o.value && o.value!=='.');
      if(!gozlemler.length) return [id, null];
      if(tip==='yillik'){
        /* §272 HAM GÖZLEM TEŞHİSİ. 12 Ağu: panel CPIAUCNS için %3,52 hesapladı,
           BLS manşeti %3,4. Hesap yöntemi doğru görünüyor (0 ÷ 12) ama
           doğrulamak için HAM SEVİYELERİ görmek gerekti; tarayıcıdan FRED'e
           CORS yüzünden gidilemiyor. ?hamSeri=CPIAUCNS ile ilk 14 gözlem
           döndürülür — tahmin etmek yerine ÖLÇMEK için. */
        if(String((req.query && req.query.hamSeri) || '').toUpperCase() === id){
          globalThis.__hamGozlem = { id, gozlemler: gozlemler.slice(0,14).map(o=>[o.date,o.value]) };
        }
        // Yıllık %: son gözlem vs 12 ay öncesi (aylık seri → index 12); bir önceki ayın yıllığı da (trend farkı)
        if(gozlemler.length < 14) return [id, null];
        /* §272 TARİHE GÖRE EŞLE — İNDEKS SAYMA.
           BULGU (12 Ağu): panel CPIAUCNS için %3,52 hesapladı, BLS %3,4.
           SEBEP: gozlemler[0] ÷ gozlemler[12] yapılıyordu. Ama FRED listesinde
           2025-10 GÖZLEMİ YOKTU (boş/'.'	 değer süzülmüş) ve indeks 12,
           Temmuz 2025 yerine HAZİRAN 2025'e denk geldi:
             333.918 / 322.561 (Haz'25) - 1 = 3,52%   ← panel, YANLIŞ ay
             333.918 / 323.048 (Tem'25) - 1 = 3,37%   ← BLS ile aynı
           İndeks sayarak geriye gitmek, seride TEK BİR boşluk olsa bile hesabı
           SESSİZCE kaydırır. Artık tarih hesaplanıp o tarihli gözlem ARANIYOR;
           bulunamazsa hesap YAPILMAZ (yanlış ay yerine değer yok).
           §252z'nin aynı ailesi: iki ucun hangi zamana ait olduğunu ne
           garanti ediyor? */
        const _ayGeri = (tarih, n) => {
          const [y,m] = String(tarih).split('-').map(Number);
          const t = m - n; const yy = y + Math.floor((t-1)/12); const mm = ((t-1)%12+12)%12 + 1;
          return yy + '-' + String(mm).padStart(2,'0');
        };
        const _bul = (yyyymm) => gozlemler.find(o => String(o.date).slice(0,7) === yyyymm);
        const yil = (birinci, geriAy) => {
          const a = gozlemler[birinci]; if(!a) return null;
          const b = _bul(_ayGeri(a.date, geriAy)); if(!b) return null;
          const va = parseFloat(a.value), vb = parseFloat(b.value);
          if(!isFinite(va) || !isFinite(vb) || vb === 0) return null;
          return +(((va/vb)-1)*100).toFixed(2);
        };
        const simdiki = yil(0,12), onceki = yil(1,12);
        if(simdiki == null) return [id, null];
        return [id, { deger:simdiki, tarih:gozlemler[0].date,
                      fark: (onceki==null ? null : +(simdiki - onceki).toFixed(2)), tip:'yillik' }];
      }
      const obs = gozlemler[0];
      const onceki = gozlemler[1];
      return [id, { deger:+obs.value, tarih:obs.date,
                    fark: onceki ? +(+obs.value - +onceki.value).toFixed(2) : null }];
    }catch(e){ return [id, null]; }
  };
  try{
    const ciftler = await Promise.all(SERILER.map(bir));
    const sonuc = {};
    ciftler.forEach(([k,v])=>{ sonuc[k]=v; });
    /* §272: ?hamSeri=<ID> verilirse o serinin ham gözlemleri de döner */
  const _ham = globalThis.__hamGozlem; globalThis.__hamGozlem = null;
  return res.status(200).json({ ok:true, kaynak:'FRED (St. Louis Fed)', alinma:new Date().toISOString(),
    hamGozlem: (_ham && req.query && req.query.hamSeri) ? _ham : undefined, seriler:sonuc });
  }catch(e){
    return res.status(200).json({ ok:false, err:'FRED: '+String((e&&e.message)||e).slice(0,100), seriler:{} });
  }
}


// ═══ BoJ modu — Japonya makro (key GEREKMEZ, herkese açık API) ═══
// Kaynak: stat-search.boj.or.jp/api/v1. Yanıt ASC sıralı, null=tatil.
// Seriler kılavuz örneklerinden doğrulandı (26 Tem test edildi).
async function bojModu(req, res){
  res.setHeader('Cache-Control', 's-maxage=7200, stale-while-revalidate=14400');
  res.setHeader('Access-Control-Allow-Origin', '*');
  const simdi=new Date();
  const ay=(geriAy)=>{const d=new Date(simdi.getFullYear(),simdi.getMonth()-geriAy,1);
    return d.getFullYear()+String(d.getMonth()+1).padStart(2,'0');};
  // Çeyreklik seriler YYYYQQ ister (QQ: 01-04) — YYYYMM GEÇERSİZ olur (TANKAN bug'ı)
  const ceyrek=(geriCeyrek)=>{const q=Math.floor(simdi.getMonth()/3)+1; let y=simdi.getFullYear(), c=q-geriCeyrek;
    while(c<1){c+=4;y--;} return y+String(c).padStart(2,'0');};
  const cek = async (db, code, startDate)=>{
    try{
      const u='https://www.stat-search.boj.or.jp/api/v1/getDataCode?format=json&lang=en&db='+db+'&code='+code+'&startDate='+startDate;
      const r=await fetch(u,{signal:AbortSignal.timeout(9000)});
      if(!r.ok) return null;
      const j=await r.json();
      if(j.STATUS!==200 || !j.RESULTSET || !j.RESULTSET[0]) return null;
      const v=j.RESULTSET[0].VALUES;
      // ASC sıralı, null'ları ayıkla → [tarih, değer] çiftleri
      const seri=[];
      for(let i=0;i<v.VALUES.length;i++)
        if(v.VALUES[i]!=null) seri.push([String(v.SURVEY_DATES[i]), +v.VALUES[i]]);
      return seri.length?seri:null;
    }catch(e){ return null; }
  };
  try{
    const [call, tankan, cgpi] = await Promise.all([
      cek('FM01','STRDCLUCON', ay(2)),                 // günlük call rate, son ~2 ay (YYYYMM)
      cek('CO','TK99F1000601GCQ01000', ceyrek(7)), // çeyreklik: YYYYQQ formatı (7 çeyrek geri)
      cek('PR01','PRCG20_2200000000', ay(16))          // aylık CGPI, yıllık hesap için 14+ ay
    ]);
    const seriler={};
    if(call && call.length>=2){
      const son=call[call.length-1], once=call[call.length-2];
      seriler.callRate={ deger:son[1], tarih:son[0], fark:+(son[1]-once[1]).toFixed(3) };
    }
    if(tankan && tankan.length>=2){
      const son=tankan[tankan.length-1], once=tankan[tankan.length-2];
      seriler.tankan={ deger:son[1], tarih:son[0], fark:+(son[1]-once[1]).toFixed(0) };
    }
    if(cgpi && cgpi.length>=14){
      const n=cgpi.length;
      const yillik=(i)=>+(((cgpi[i][1]/cgpi[i-12][1])-1)*100).toFixed(2);
      const simdiki=yillik(n-1), onceki=yillik(n-2);
      seriler.cgpi={ deger:simdiki, tarih:cgpi[n-1][0], fark:+(simdiki-onceki).toFixed(2), tip:'yillik' };
    }
    const ok=Object.keys(seriler).length>0;
    return res.status(200).json({ ok, kaynak:'BoJ Time-Series', alinma:new Date().toISOString(), seriler,
      err: ok?undefined:'BoJ serileri alınamadı' });
  }catch(e){
    return res.status(200).json({ ok:false, err:'BoJ: '+String((e&&e.message)||e).slice(0,100), seriler:{} });
  }
}


// ═══ HKMA modu — Hong Kong makro (key GEREKMEZ, açık API) ═══
// Yanıt DESC sıralı (en yeni ilk); 'YYYY-00' kayıtları YILLIK özet → atlanır.
async function hkmaModu(req, res){
  res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=43200');
  res.setHeader('Access-Control-Allow-Origin', '*');
  try{
    const u='https://api.hkma.gov.hk/public/market-data-and-statistics/monthly-statistical-bulletin/financial/monetary-statistics';
    let r=null;
    try{ r=await fetch(u,{headers:{'User-Agent':'Mozilla/5.0 (KTPanel)'},signal:AbortSignal.timeout(14000)}); }
    catch(e1){ await new Promise(x=>setTimeout(x,800));
      try{ r=await fetch(u,{headers:{'User-Agent':'Mozilla/5.0 (KTPanel)'},signal:AbortSignal.timeout(12000)}); }catch(e2){ r=null; } }
    if(!r) return res.status(200).json({ok:false,err:'HKMA: bağlantı kurulamadı (iki deneme)',veri:null});
    if(!r.ok) return res.status(200).json({ok:false,err:'HKMA HTTP '+r.status,veri:null});
    const j=await r.json();
    if(!(j.header&&j.header.success&&j.result&&j.result.records)) 
      return res.status(200).json({ok:false,err:'HKMA yanıt yapısı beklenmedik',veri:null});
    // Aylık kayıtlar (YYYY-MM), yıllık '-00' özetleri atla
    const aylik=j.result.records.filter(x=>x.end_of_month && !/-00$/.test(x.end_of_month));
    if(aylik.length<2) return res.status(200).json({ok:false,err:'yeterli aylık kayıt yok',veri:null});
    const son=aylik[0], once=aylik[1];
    const f=(a,b)=>a!=null&&b!=null?+(a-b).toFixed(3):null;
    const veri={
      ay: son.end_of_month,
      hkdUsd:{ deger:son.exrate_hkd_usd, fark:f(son.exrate_hkd_usd,once.exrate_hkd_usd),
        bandKonum: son.exrate_hkd_usd!=null?+(((son.exrate_hkd_usd-7.75)/0.10)*100).toFixed(0):null },
      aggrBalance:{ deger:son.aggr_balance, fark:f(son.aggr_balance,once.aggr_balance) }, // mn HKD
      hiborON:{ deger:son.hibor_fixing_overnight, fark:f(son.hibor_fixing_overnight,once.hibor_fixing_overnight) },
      hibor3M:{ deger:son.hibor_fixing_3m, fark:f(son.hibor_fixing_3m,once.hibor_fixing_3m) },
      y10:{ deger:son.yield_govbond_10y, fark:f(son.yield_govbond_10y,once.yield_govbond_10y) },
      bazFaiz:{ deger:son.discount_window_base_rate }
    };
    return res.status(200).json({ok:true,kaynak:'HKMA Monthly Bulletin',alinma:new Date().toISOString(),veri});
  }catch(e){
    return res.status(200).json({ok:false,err:'HKMA: '+String((e&&e.message)||e).slice(0,100),veri:null});
  }
}


// ═══ ECB modu — Euro bölgesi makro (key GEREKMEZ, SDMX csvdata) ═══
// Yanıt ASC sıralı CSV; TIME_PERIOD/OBS_VALUE kolon indeksi dataflow'a göre DEĞİŞİR
// → header'dan dinamik bulunur (FM:8/9, ICP:7/8, ILM:7/8 — ölçüldü, 27 Tem test).
// HICP: Eurostat 4 Şub 2026 metodoloji değişimi → eski ICP dataset'i durdu (son 2025-12),
// yeni 'HICP' dataflow'u denenir, boşsa ICP'ye düşülür.
async function ecbModu(req, res){
  res.setHeader('Cache-Control', 's-maxage=10800, stale-while-revalidate=21600');
  res.setHeader('Access-Control-Allow-Origin', '*');
  const TANI=[];
  const cekCsv = async (flow, key, n)=>{
    try{
      const u='https://data-api.ecb.europa.eu/service/data/'+flow+'/'+key+'?lastNObservations='+n+'&format=csvdata';
      const bas={ 'User-Agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
                  'Accept':'text/csv,application/vnd.sdmx.data+csv,*/*' };
      const yedekU='https://sdw-wsrest.ecb.europa.eu/service/data/'+flow+'/'+key+'?lastNObservations='+n+'&format=csvdata';
      let r=null;
      try{ r=await fetch(u,{headers:bas, signal:AbortSignal.timeout(8000)}); }
      catch(e1){ TANI.push({flow, asama:'ana', hata:String(e1.name||'')+': '+String(e1.message||e1).slice(0,70)}); }
      if(!r||!r.ok){                                // YEDEK UÇ (legacy SDW host)
        try{ r=await fetch(yedekU,{headers:bas, signal:AbortSignal.timeout(8000)}); TANI.push({flow, asama:'yedek', durum:r.status}); }
        catch(e2){ TANI.push({flow, asama:'yedek', hata:String(e2.name||'')+': '+String(e2.message||e2).slice(0,70)}); return null; }
      }
      if(!r) return null;
      if(!r.ok){ TANI.push({flow, key, durum:r.status, not:(await r.text().catch(()=>'')).slice(0,120)}); return null; }
      const metin=await r.text();
      const satirlar=metin.split(/\r?\n/).filter(x=>x.trim());
      TANI.push({flow, key, durum:r.status, satir:satirlar.length});
      if(satirlar.length<2) return null;
      const h=satirlar[0].split(',');
      const it=h.indexOf('TIME_PERIOD'), iv=h.indexOf('OBS_VALUE');
      if(it<0||iv<0) return null;
      const seri=[];
      for(let i=1;i<satirlar.length;i++){
        const p=satirlar[i].split(','); // tırnaklı virgüller iv'den SONRA → ilk kolonlar güvenli
        if(p.length>iv){ const v=parseFloat(p[iv]); if(!isNaN(v)) seri.push([p[it], v]); }
      }
      return seri.length?seri:null;
    }catch(e){ TANI.push({flow, asama:'islem', hata:String(e.name||'')+': '+String(e.message||e).slice(0,90)}); return null; }
  };
  const sonFark = (seri)=>{
    if(!seri||!seri.length) return null;
    const son=seri[seri.length-1], once=seri.length>1?seri[seri.length-2]:null;
    return { deger:son[1], tarih:son[0], fark: once?+(son[1]-once[1]).toFixed(2):null };
  };
  try{
    /* §245u YARIM KALMIŞ DÜZELTME TAMAMLANDI. Önceki hali yorumunda "yeni
       dataflow denenir" diyordu ama İKİ DAL DA aynı eski 'ICP'yi çekiyordu —
       ve ilk dal 'akis:HICP' etiketi basıyordu: YALAN ETİKET. Kod çalışıyor
       görünüyor, etiket taze akış söylüyor, veri 2025-12'de donmuş duruyordu.
       Yeni anahtar doğrulandı: dataflow 'HICP', sağlayıcı '4D0'
       (HICP.M.U2.N.000000.4D0.ANR — portalda 17 Haz 2026 canlı). */
    const hicpCek = async (item)=>{
      const yeni=await cekCsv('HICP','M.U2.N.'+item+'.4D0.ANR',3);
      if(yeni) return { ...sonFark(yeni), akis:'HICP' };
      const eski=await cekCsv('ICP','M.U2.N.'+item+'.4.ANR',3);
      return eski? { ...sonFark(eski), akis:'ICP-arşiv (2025-12 son)' } : null;
    };
    /* §246e: kırılım SUNUCUDAN. Client'ın ECB fetch'i tarayıcı ortamına
       bağımlı (CORS/engelleyici) ve sahada iki gündür doğrulanamadı; Vercel
       çıkışı bu bağımlılıkların hiçbirine takılmaz. */
    const [dfr, bilanco, manset, cekirdek, enerji, gida, hizmet, sanayi, bund, btp, oat] = await Promise.all([
      cekCsv('FM','B.U2.EUR.4F.KR.DFR.LEV',3),
      cekCsv('ILM','W.U2.C.T000000.Z5.Z01',6),
      hicpCek('000000'), hicpCek('XEF000'), hicpCek('NRGY00'),
      hicpCek('FOOD00'), hicpCek('SERV00'), hicpCek('IGXE00'),
      cekCsv('IRS','M.DE.L.L40.CI.0000.EUR.N.Z',3),  // Almanya 10Y (Maastricht, aylık)
      cekCsv('IRS','M.IT.L.L40.CI.0000.EUR.N.Z',3),  // İtalya 10Y
      cekCsv('IRS','M.FR.L.L40.CI.0000.EUR.N.Z',3)   // Fransa 10Y
    ]);
    if(req.query.debug) return res.status(200).json({ tani:TANI, ozet:{dfr:!!dfr, bilanco:!!bilanco, manset:!!manset, bund:!!bund, btp:!!btp, oat:!!oat} });
    const seriler={};
    if(dfr){ const s0=sonFark(dfr); if(s0) seriler.dfr=s0; } // değişim-tarihleri serisi: son=güncel faiz, fark=son adım
    if(bilanco){
      const s0=sonFark(bilanco);
      if(s0){ s0.zirveMlr=8836; s0.mlr=+(s0.deger/1000).toFixed(0); s0.qtMlr=+(8836-s0.deger/1000).toFixed(0); seriler.bilanco=s0; }
    }
    if(manset) seriler.hicpManset=manset;
    if(cekirdek) seriler.hicpCekirdek=cekirdek;
    if(gida) seriler.hicpGida=gida;
    if(hizmet) seriler.hicpHizmet=hizmet;
    if(sanayi) seriler.hicpSanayi=sanayi;
    if(enerji) seriler.hicpEnerji=enerji;
    if(bund){ const b=sonFark(bund); if(b) seriler.bund10=b; }
    if(btp){ const b=sonFark(btp); if(b) seriler.btp10=b; }
    if(oat){ const b=sonFark(oat); if(b) seriler.oat10=b; }
    // BTP-Bund + OAT-Bund spread'leri (bp) — Euro bölgesi iç stres göstergeleri
    if(seriler.bund10&&seriler.btp10)
      seriler.btpSpread=+((seriler.btp10.deger-seriler.bund10.deger)*100).toFixed(0);
    if(seriler.bund10&&seriler.oat10)
      seriler.oatSpread=+((seriler.oat10.deger-seriler.bund10.deger)*100).toFixed(0);
    const ok=Object.keys(seriler).length>0;
    return res.status(200).json({ ok, kaynak:'ECB Data Portal (SDMX)', alinma:new Date().toISOString(), seriler,
      err: ok?undefined:'ECB serileri alınamadı' });
  }catch(e){
    return res.status(200).json({ ok:false, err:'ECB: '+String((e&&e.message)||e).slice(0,100), seriler:{} });
  }
}


// ═══ ai modu — Ajan yorum köprüsü (anahtar SUNUCUDA: ANTHROPIC_API_KEY env) ═══
// Güvenlik: giriş koruması (PANEL_USER) kurulu değilse çalışmaz — anahtar
// public uca açılmasın. Middleware zaten şifresiz istekleri 401'ler.
async function aiModu(req, res){
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  const KEY = process.env.ANTHROPIC_API_KEY;
  if(!KEY) return res.status(200).json({ ok:false, err:'sunucu-anahtari-yok' });
  if(!process.env.PANEL_USER) return res.status(200).json({ ok:false,
    err:'guvenlik: once giris korumasi kurulmali (PANEL_USER env)' });
  if(req.method!=='POST') return res.status(200).json({ ok:false, err:'POST gerekli' });
  try{
    let body=req.body;
    if(!body||typeof body==='string'){ try{ body=JSON.parse(body||'{}'); }catch(e){ body={}; } }
    const prompt=String(body.prompt||'').slice(0, 8000);
    if(!prompt) return res.status(200).json({ ok:false, err:'prompt bos' });
    const r=await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',
      headers:{ 'x-api-key':KEY, 'anthropic-version':'2023-06-01', 'content-type':'application/json' },
      body:JSON.stringify({ model:'claude-haiku-4-5-20251001', max_tokens:Math.min(2500, parseInt(body.max_tokens)||500),
        messages:[{ role:'user', content:prompt }] }),
      signal:AbortSignal.timeout(25000)
    });
    const d=await r.json();
    const metin=(d&&d.content&&d.content[0]&&d.content[0].text)?d.content[0].text:null;
    if(metin) return res.status(200).json({ ok:true, metin, stop:(d.stop_reason||'') });
    return res.status(200).json({ ok:false, err:(d&&d.error&&d.error.message?String(d.error.message).slice(0,100):'yanit bos') });
  }catch(e){
    return res.status(200).json({ ok:false, err:String(e.message||e).slice(0,100) });
  }
}

module.exports = async (req, res) => {
  if(req.query.mod==='ai') return aiModu(req, res);
  if(req.query.mod==='seri') return seriModu(req, res);
  if(req.query.mod==='fiyat') return fiyatModu(req, res);
  if(req.query.mod==='asya') return asyaModu(req, res);
  if(req.query.mod==='fred') return fredModu(req, res);
  if(req.query.mod==='boj') return bojModu(req, res);
  if(req.query.mod==='hkma') return hkmaModu(req, res);
  if(req.query.mod==='ecb') return ecbModu(req, res);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  const syms = {
    sp500: '^GSPC', nasdaq: '^IXIC', dow: '^DJI', russell: '^RUT',
    dax: '^GDAXI', ftse: '^FTSE', cac: '^FCHI', eustoxx: '^STOXX50E',
    ibex: '^IBEX', ftsemib: 'FTSEMIB.MI',
    nikkei: '^N225', kospi: '^KS11', hangseng: '^HSI', shanghai: '000001.SS',
    asx: '^AXJO', taiwan: '^TWII', nifty: '^NSEI', kosdaq: '^KQ11',
    vix: '^VIX', dxy: 'DX-Y.NYB', brent: 'BZ=F', wti: 'CL=F',
    // ── Emtialar (Yahoo vadeli sözleşme sembolleri, =F) ──
    dogalgaz: 'NG=F', benzin: 'RB=F', isilyag: 'HO=F',           // enerji
    altin: 'GC=F', gumus: 'SI=F', platin: 'PL=F', paladyum: 'PA=F', // değerli metal
    bakir: 'HG=F',                                                // sanayi metali
    bugday: 'ZW=F', misir: 'ZC=F', soya: 'ZS=F',                  // tahıl
    pamuk: 'CT=F', seker: 'SB=F', kahve: 'KC=F', kakao: 'CC=F',   // yumuşak emtia
    /* §191: XKTUM.IS Yahoo'da YOK — GitHub Actions koşusunda kanıtlandı
       (XKTUM.IS boş · ^XKTUM boş · XU100.IS 250 gün). Bu, sicil
       karşılaştırmasının canlı tarafta SESSİZCE çalışmadığı anlamına
       geliyordu: m.xktum.p null oluyor, trackRender koruma koşuluna takılıp
       hiç güncellenmiyordu. Hata değil, sessiz atlama — en tehlikelisi.
       XKTUM alanı XU100'e yönlendirildi; ayrı `xktumGercek` bayrağı ile
       panelin bunu SÖYLEMESİ sağlanır. */
    xu100: 'XU100.IS', xktum: 'XU100.IS'
  };
  const SEC = ['XKMYA','XGIDA','XMANA','XUSIN','XHOLD','XELKT','XUHIZ','XILTM','XINSA','XUTEK','XSGRT','XTRZM','XGMYO','XUMAL','XBANK'];
  /* §282 AVRUPA MEGA-CAP — Yahoo sembolleri. Kart 27 Tem'den beri elle.
     ASML.AS Amsterdam · MC.PA Paris · SAP.DE Xetra · NOVO-B.CO Kopenhag.
     Hepsi kendi borsasında ve kendi para biriminde; ADR yerine YEREL kotasyon
     seçildi ki araştırma notlarındaki €/DKK rakamlarıyla aynı zeminde olsun. */
  const AVMEGA = ['ASML.AS','MC.PA','SAP.DE','NOVO-B.CO'];
  const END = ['XU100','XU030','XU050','XUTUM','XTUMY','XUMAL','XUSIN','XUSRD','XKURY','XTMTU','XK100','XKTUM','XKTMT','XHARZ','XUGRA'];
  const HIS = ['MAVI','ORGE','ARASE','LMKDC','TUPRS','NTGAZ','KTLEV','KRONT','GRSEL','ELITE','PLTUR','MPARK','GUBRF','GOKNR','KOTON','BIMAS','BAHKM','SEKUR','RGYAS','FONET','EUPWR','DAPGM','EGGUB','BASGZ','SAFKR','ARDYZ','EBEBK','GOLTS','ISDMR','CIMSA','ENJSA','YUNSA','KRDMD','GRTHO','AVPGY','KONYA','CEMTS','ASELS','KARSN','SUNTK'];

  const one = async (s) => {
    try {
      const url = 'https://query1.finance.yahoo.com/v8/finance/chart/' +
        encodeURIComponent(s) + '?interval=1d&range=3mo';
      const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (KtPanel/1.0)' } });
      if (!r.ok) return null;
      const j = await r.json();
      const res0 = j && j.chart && j.chart.result && j.chart.result[0];
      if (!res0) return null;
      const m = res0.meta || {};
      const rawC = (((res0.indicators || {}).quote || [])[0] || {}).close || [];
      const rawT = res0.timestamp || [];
      // Zaman damgası ile kapanışı BİRLİKTE süz — ayrı süzmek hizalamayı bozar
      const bar = [];
      for (let i = 0; i < rawC.length; i++) {
        if (typeof rawC[i] === 'number' && isFinite(rawC[i])) bar.push({ t: rawT[i] || null, c: rawC[i] });
      }
      const L = bar.length;
      if (!L) return null;
      const p = (typeof m.regularMarketPrice === 'number') ? m.regularMarketPrice : bar[L - 1].c;
      if (typeof p !== 'number') return null;

      // p hangi seansa ait? ÖNCE zaman damgasına sorulur, tahmin edilmez.
      // Eski sürüm |p - son kapanış| < 1e-9 karşılaştırması yapıyordu; Yahoo
      // regularMarketPrice'ı YUVARLANMIŞ (7408.3), grafik kapanışını TAM ondalıklı
      // (7408.29998) döndürdüğü için bu test piyasa kapalıyken hep false dönüyor,
      // aynı seans yeni seans sanılıyor ve 1G değişimi kendi kendine bölünüp %0,00
      // çıkıyordu. (IBEX gibi tam sayı değerli endeksler tesadüfen doğru çalışıyordu.)
      const gunIst = (ts) => ts ? new Date(ts * 1000).toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' }) : null;
      const sonBarGun = gunIst(bar[L - 1].t);
      const pGun = (typeof m.regularMarketTime === 'number') ? gunIst(m.regularMarketTime) : null;
      let yeniSeans;
      if (pGun && sonBarGun) {
        yeniSeans = pGun > sonBarGun;            // 'YYYY-MM-DD' sözlük sırası = tarih sırası
      } else {
        // Yedek: zaman damgası yoksa GÖRELİ tolerans (mutlak 1e-9 değil)
        yeniSeans = Math.abs(p - bar[L - 1].c) > Math.abs(bar[L - 1].c) * 1e-6;
      }
      const pIdx = yeniSeans ? L : (L - 1);   // p'nin sanal seans indeksi
      const ref = (n) => (pIdx - n >= 0 && pIdx - n < L ? bar[pIdx - n].c : null);
      const pct = (base) => (base ? ((p / base - 1) * 100) : null);

      // 1G referansı seriden gelir. SIRA ÖNEMLİ:
      //   previousClose      = bir önceki SEANS kapanışı → günlük değişim için DOĞRU referans
      //   chartPreviousClose = grafik aralığından ÖNCEKİ kapanış → 3 aylık aralıkta 3 ay öncesi
      // Eski kod chartPreviousClose'u önceliyordu; günlük karşılaştırma için yanlış referans.
      const gunPrev = (typeof m.previousClose === 'number') ? m.previousClose
                    : ((typeof m.chartPreviousClose === 'number') ? m.chartPreviousClose : null);
      let chg = pct(ref(1));
      let kaynak = (chg != null) ? 'seri' : null;
      // Yahoo bazı BIST sektör endekslerinde (XKMYA, XGIDA, XMANA, XHOLD…) 3 aylık aralıkta
      // TEK bar döndürüyor → seri referansı oluşmuyor, chg null kalıyor ve ısı haritası
      // 15 sektörün 13'ünde damgalı yedekte takılıp kalıyordu. Meta'daki önceki seans
      // kapanışı varsa ona düş; en azından günlük değişim canlı olsun.
      if (chg == null && gunPrev) { chg = (p / gunPrev - 1) * 100; kaynak = 'meta'; }
      let supheli = null;
      if (chg != null && Math.abs(chg) > 12) {
        const alt = gunPrev ? ((p / gunPrev - 1) * 100) : null;
        if (alt != null && Math.abs(alt) < Math.abs(chg)) { supheli = 'seri-meta farki'; chg = alt; kaynak = 'meta'; }
        else supheli = 'olagandisi hareket';
      }
      return {
        p: p,
        chg: chg,                       // 1G
        h1: pct(ref(5)),                // 1H (5 seans)
        a1: pct(ref(21)),               // 1A (21 seans)
        q3: (L > 10 ? ((p / bar[0].c - 1) * 100) : null), // ~3A
        gun: pGun || sonBarGun,          // fiyatın ait olduğu seans (bar değil)
        barGun: sonBarGun,              // serideki son bar (teşhis için)
        n: L,                           // geçerli bar sayısı — 1 ise seri referansı kurulamaz
        kaynak: kaynak || undefined,    // 1G nereden geldi: 'seri' | 'meta'
        supheli: supheli || undefined
      };
    } catch (e) { return null; }
  };

  // 8'li eşzamanlılık havuzu (Yahoo'ya nazik, Vercel süresine sığar)
  const havuz = async (items, fn, n) => {
    const out = new Array(items.length); let i = 0;
    const isci = async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k]); } };
    await Promise.all(Array.from({ length: Math.min(n, items.length) }, isci));
    return out;
  };

  try {
    const keys = Object.keys(syms);
    /* §155 DİNAMİK HİSSE LİSTESİ. HIS sabit 40 koddu; kullanıcının portföyü ve
       XK100 üyeleri buna dahil değildi. Sonuç: endeksten ayrışma kapsamı %58'de
       kaldı ve kullanıcının KENDİ hisselerinin (ALCTL/EKGYO/LOGO/MERCN/ALTNY)
       getirisi bile gelmiyordu. Artık ?his=KOD1,KOD2 ile genişletilebiliyor.
       SINIR 160: havuz(...,8) sekizli paralel çekiyor; 160 sembol ~20 tur eder,
       Yahoo'yu zorlamadan biter. Fazlası kırpılır ve kırpıldığı RAPORLANIR. */
    const ekHam = String((req.query && req.query.his) || '').toUpperCase()
      .split(',').map(s=>s.replace(/[^A-Z0-9]/g,'')).filter(Boolean);
    const HIS_TUM = Array.from(new Set(HIS.concat(ekHam)));
    /* §159: XKTUM 242 uyeli, ilk 150'si endeksin %96,5'i. XK100 + XKTUM + portfoy
       birlesik evreni ~180 sembol. Sinir 220'ye cikarildi ve eszamanlilik 8->12.
       OLCUM: 180 sembol / 12 es zamanli = 15 tur; Yahoo cagrisi ~150-300ms
       oldugundan 2-5 saniye eder, Vercel'in 10sn butcesine sigar. 8'li kalsaydi
       23 tur = 3,5-7 sn, sinira fazla yakin. */
    const SINIR = 220;
    const kirpildi = Math.max(0, HIS_TUM.length - SINIR);
    const HIS2 = HIS_TUM.slice(0, SINIR);
    const tum = keys.map((k) => syms[k]).concat(SEC.map((k) => k + '.IS'), END.map((k) => k + '.IS'), HIS2.map((k) => k + '.IS'), AVMEGA);
    const vals = await havuz(tum, one, 12);
    const data = {};
    keys.forEach((k, i) => { data[k] = vals[i]; });
    const sec = {}; SEC.forEach((k, i) => { sec[k] = vals[keys.length + i]; });
    const end = {}; END.forEach((k, i) => { end[k] = vals[keys.length + SEC.length + i]; });
    const his = {}; HIS2.forEach((k, i) => { his[k] = vals[keys.length + SEC.length + END.length + i]; });
    /* §282b AVMEGA SONUÇLARI DA DAĞITILIR. İlk yazımda sembolleri `tum`
       listesine EKLEDİM ama `data`ya hiç YAZMADIM — her grup tek tek
       dağıtılıyor (keys/SEC/END/HIS2) ve AVMEGA için o satır yoktu.
       Çekiliyordu, sonuç ATILIYORDU: panel `ASML.AS: YOK` gösterdi.
       "Kod var, teslim yok" — bu oturumda yedinci vaka. */
    AVMEGA.forEach((k, i) => { data[k] = vals[keys.length + SEC.length + END.length + HIS2.length + i]; });
    data.sec = sec; data.end = end; data.his = his;
    res.status(200).json({ t: Date.now(), tarih: new Date().toISOString().slice(0, 10),
      hisAdet: HIS2.length, hisKirpildi: kirpildi || undefined, data });
  } catch (e) {
    res.setHeader('Cache-Control', 'no-store');
    res.status(502).json({ error: String((e && e.message) || e) });
  }
};
