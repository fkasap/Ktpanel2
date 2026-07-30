// /api/egri — Türkiye getiri eğrisi (TCMB EVDS · bie_pydibs)
// İKİ EĞRİ: ?tur=dibs (varsayılan, konvansiyonel) · ?tur=sukuk (Hazine kira sertifikası)
// ÖLÇÜLDÜ (2026-07-24): bie_pydibs grubu (4.140 seri) İKİSİNİ BİRDEN taşıyor.
//   ISIN öneki  TRT → konvansiyonel      TRD → kira sertifikası
//   Tip kodu    24T2 → konvansiyonel     24D2 → kira sertifikası
// Ayrı bir sukuk grubu YOK (?gruplar=1&q=kira yalnız kira endekslerini buluyor).
// Nakit akışı matematiği aynı: dönemsel ödeme + vadede anapara; adı kupon değil kira payı.
// EVDS vade bazlı hazır eğri vermiyor; kıymet bazında GÜNLÜK FİYAT veriyor.
// Zincir: seri listesi → sabit kuponlu TL tahvilleri süz → her vadeye gösterge seç
//         → fiyat + kupon oranı çek → kupon takvimi üret → IRR ile bileşik getiri.
// Fiyatın temiz mi kirli mi olduğu, referans eğriye kalibrasyonla otomatik seçilir.
// Teşhis: ?gruplar=1&q=  ?seriler=KOD  ?veri=TP.X,TP.Y  ?debug=1
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=10800, stale-while-revalidate=21600');
  const key = process.env.EVDS_KEY || req.query.key;
  if (!key) return res.status(200).json({ ok:false, err:'EVDS_KEY tanımlı değil.' });
  const H = { 'key': key, 'Accept':'application/json',
    'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36' };
  const B = 'https://evds3.tcmb.gov.tr/igmevdsms-dis/';
  const debug = req.query.debug === '1';

  const jget = async (u, sure) => {
    const sureler = sure ? [sure] : [12000, 20000, 28000];
    let sonHata = null;
    for (const ms of sureler){
      try{
        const r = await fetch(u, { headers: H, signal: AbortSignal.timeout(ms) });
        const t = await r.text();
        if (!(t.trim().startsWith('{')||t.trim().startsWith('['))) throw new Error('JSON değil ('+r.status+')');
        return JSON.parse(t);
      }catch(e){ sonHata = e; }
    }
    throw sonHata || new Error('bilinmeyen hata');
  };
  const fmt = d => String(d.getDate()).padStart(2,'0')+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+d.getFullYear();
  const gunEkle=(d,n)=>new Date(d.getFullYear(),d.getMonth(),d.getDate()+n);
  const gun=(a,b)=>Math.round((b-a)/86400000);

  // ---- Teşhis uçları ----
  if (req.query.gruplar === '1'){
    try{
      const g = await jget(B+'datagroups/mode=0&type=json');
      const gl = Array.isArray(g)?g:(g.items||[]);
      const q = (req.query.q||'').toLocaleLowerCase('tr');
      const bul = gl.map(x=>({kod:x.DATAGROUP_CODE, ad:x.DATAGROUP_NAME}))
                    .filter(x=> !q || String(x.ad).toLocaleLowerCase('tr').includes(q));
      res.setHeader('Cache-Control','no-store');
      return res.status(200).json({ toplam:gl.length, bulunan:bul.length, gruplar:bul.slice(0,120) });
    }catch(e){ return res.status(200).json({ ok:false, err:'grup listesi: '+String(e.message||e) }); }
  }
  if (req.query.seriler){
    try{
      const d = await jget(B+'serieList/code='+encodeURIComponent(req.query.seriler)+'&type=json');
      const l = Array.isArray(d)?d:(d.items||[]);
      res.setHeader('Cache-Control','no-store');
      return res.status(200).json({ grup:req.query.seriler, adet:l.length, seriler:l.slice(0,400).map(x=>({kod:x.SERIE_CODE, ad:x.SERIE_NAME||x.SERIE_NAME_TR})) });
    }catch(e){ return res.status(200).json({ ok:false, err:'seri listesi: '+String(e.message||e) }); }
  }
  if (req.query.veri){
    try{
      const kod = String(req.query.veri).split(',').map(s=>s.trim()).filter(Boolean);
      const d = await jget(B+'series='+kod.join('-')+'&startDate='+fmt(new Date(Date.now()-15*86400000))+'&endDate='+fmt(new Date())+'&type=json');
      const items=(d&&d.items)?d.items:[]; const son={};
      kod.forEach(k=>{ const alan=k.replace(/\./g,'_');
        for(let i=items.length-1;i>=0;i--){ const v=items[i][alan];
          if(v!==null&&v!==undefined&&v!==''){ son[k]={deger:parseFloat(String(v).replace(',','.')), tarih:items[i].Tarih}; break; } } });
      res.setHeader('Cache-Control','no-store');
      return res.status(200).json({ son, satir:items.length });
    }catch(e){ return res.status(200).json({ ok:false, err:'veri: '+String(e.message||e) }); }
  }

  // ---- Çekirdek: ayrıştırma / takvim / IRR ----
  const trTar=s=>{const m=String(s).match(/(\d{2})\.(\d{2})\.(\d{4})/);return m?new Date(+m[3],+m[2]-1,+m[1]):null;};
  const isoTar=s=>{const m=String(s).match(/(\d{4})-(\d{2})-(\d{2})/);return m?new Date(+m[1],+m[2]-1,+m[3]):null;};
  function seriAyristir(kod, ad, harf){
    if(!/Değer|Deger/i.test(ad))return null;
    const isin=(String(ad).match(/^([A-Z]{2}[A-Z0-9]{9,10})/)||[])[1]; if(!isin)return null;
    let ih=null,it=null,m;
    if((m=String(ad).match(/\(\s*(\d{2}\.\d{2}\.\d{4})\s+(\d{2}\.\d{2}\.\d{4})\s*\)/))){ih=trTar(m[1]);it=trTar(m[2]);}
    else if((m=String(ad).match(/\((\d{4}-\d{2}-\d{2})\/(\d{4}-\d{2}-\d{2})\)/))){ih=isoTar(m[1]);it=isoTar(m[2]);}
    else if((m=String(ad).match(/\((\d{2}-\d{2}-\d{4})\/(\d{2}-\d{2}-\d{4})\)/))){
      const p=x=>{const q=x.split('-');return new Date(+q[2],+q[1]-1,+q[0]);};ih=p(m[1]);it=p(m[2]);}
    if(!ih||!it)return null;
    const tip=(String(ad).match(/\(([^)]+)\)\s*$/)||[])[1]||'';
    // harf 'T' → konvansiyonel tahvil, 'D' → kira sertifikası. Strip (K) ve A serileri hariç.
    const t=tip.match(new RegExp('^(\\d+)'+harf+'(\\d)$'));
    if(!t)return null;
    if(isin.slice(0,3)!=='TR'+harf)return null;   // ISIN öneki tip koduyla tutarlı olmalı
    return {kod, isin, ihrac:ih, itfa:it, sik:+t[2], tip};
  }
  function takvim(ihrac, itfa, sik){
    const ar = sik===4?91 : sik===1?365 : 182;
    const out=[]; let d=ihrac, g=0;
    while(g++<200){ d=gunEkle(d,ar); if(gun(d,itfa)>0) out.push(d); else { out.push(itfa); break; } }
    return out;
  }
  const pv=(akis,y,baz)=>{let t=0;akis.forEach(a=>{t+=a.odeme/Math.pow(1+y,a.vkg/baz);});return t;};
  const irr=(akis,hedef,baz)=>{let lo=-0.5,hi=5;for(let i=0;i<200;i++){const m=(lo+hi)/2;if(pv(akis,m,baz)>hedef)lo=m;else hi=m;}return (lo+hi)/2;};
  function getiriHesapla(k, valor, fiyat, oran, kirliMi, baz, kuponDonemsel){
    const hepsi=takvim(k.ihrac,k.itfa,k.sik);
    const gelecek=hepsi.filter(t=>gun(valor,t)>0);
    if(!gelecek.length||oran==null)return null;
    const donKupon = kuponDonemsel ? oran : oran/k.sik;      // EVDS oranı dönemsel mi yıllık mı
    const akis=gelecek.map(t=>({vkg:gun(valor,t), odeme:donKupon}));
    akis.push({vkg:gun(valor,k.itfa), odeme:100});
    let onceki=k.ihrac; hepsi.forEach(t=>{ if(gun(t,valor)>=0) onceki=t; });
    const donem=gun(onceki,gelecek[0]), gecen=gun(onceki,valor);
    const birikmis=(donem>0&&gecen>0&&gecen<donem)?donKupon*gecen/donem:0;
    const kirli = kirliMi ? fiyat : fiyat+birikmis;
    if(kirli<=0)return null;
    const y=irr(akis,kirli,baz);
    return { getiri:y*100, birikmis, kirli };
  }

  // TÜR SEÇİMİ
  const tur = /sukuk|kira/i.test(String(req.query.tur||'')) ? 'sukuk' : 'dibs';
  const HARF = (tur==='sukuk') ? 'D' : 'T';
  // Kalibrasyon çapası: fiyatın temiz mi kirli mi olduğunu seçmek için seviye referansı.
  // Günlük oynama bu çapanın çok altında olduğundan yaklaşık değer yeterli.
  const REF = (tur==='sukuk')
    // ÖLÇÜLDÜ (2026-07-24): Hazine kira sertifikası ile DİBS aynı vadede aynı getiriyi veriyor.
    // TRD190728T24 %42,13 ↔ TRT190728T18 %42,17 (ikisi de 19.07.2028 itfalı)
    // TRD100227T11 %40,80 ↔ TRT100227T13 %40,80 (ikisi de 10.02.2027 itfalı)
    // Aynı ihraççı, aynı kredi riski → parite beklenir. Çapa buna göre kuruldu.
    // (İlk sürümde çapa 5 puan düşük konmuştu; sapma 5,83'e çıkıyor ve konvansiyon
    //  seçimini güvenilmez kılıyordu. DİBS'te sapma 1,46.)
    ? { '1Y':41.6, '2Y':42.2, '3Y':41.2, '5Y':39.4 }
    : { '2Y':41.26, '3Y':39.53, '5Y':37.98, '10Y':33.43 };
  // Vade hedefleri GENİŞLETİLDİ: 4 nokta Nelson-Siegel'in 4 parametresi için yetersizdi
  // (tam belirlenmiş sistem, serbestlik derecesi yok). Daha çok gösterge → gerçek nokta bulutu.
  const HEDEF = (tur==='sukuk')
    ? [['3A',0.25],['6A',0.5],['9A',0.75],['1Y',1],['18A',1.5],['2Y',2],['3Y',3],['4Y',4],['5Y',5]]
    : [['3A',0.25],['6A',0.5],['9A',0.75],['1Y',1],['2Y',2],['3Y',3],['5Y',5],['7Y',7],['10Y',10]];
  const baz = parseInt(req.query.baz)||365;

  // ═══ PARİTE MODU ═══ ?tur=parite → aynı itfa tarihli TRD/TRT çiftlerini eşleştir
  // Model tahmini DEĞİL, ham gerçek: aynı gün itfa olan iki kâğıdın getiri farkı.
  // İkisi de Hazine olduğundan fark ~0 beklenir; sapma anlamlı sinyaldir.
  if (/parite/i.test(String(req.query.tur||''))){
    try{
      const ls = await jget(B+'serieList/code=bie_pydibs&type=json');
      const liste = Array.isArray(ls)?ls:(ls.items||[]);
      const bugun = new Date();
      const trd = liste.map(x=>seriAyristir(x.SERIE_CODE, x.SERIE_NAME||x.SERIE_NAME_TR||'', 'D')).filter(Boolean).filter(k=>gun(bugun,k.itfa)>60);
      const trt = liste.map(x=>seriAyristir(x.SERIE_CODE, x.SERIE_NAME||x.SERIE_NAME_TR||'', 'T')).filter(Boolean).filter(k=>gun(bugun,k.itfa)>60);
      // Aynı itfa tarihinde (±3 gün) eşleş; birden çok eşleşirse kalan vadesi en yakın olanı seç
      const ciftler=[];
      trd.forEach(d=>{
        let en=null,enF=4;
        trt.forEach(t=>{ const f=Math.abs(gun(t.itfa,d.itfa)); if(f<=3&&f<enF){enF=f;en=t;} });
        if(en) ciftler.push({ itfa:fmt(d.itfa), kalanYil:+(gun(bugun,d.itfa)/365).toFixed(2), sukuk:d, dibs:en });
      });
      if(!ciftler.length) return res.status(200).json({ ok:false, tur:'parite', err:'Eşleşen itfa tarihli çift yok', trd:trd.length, trt:trt.length });
      ciftler.sort((a,b)=>a.kalanYil-b.kalanYil);
      // Getiri hesabı için fiyat+oran serilerini topla (her iki bacak)
      const kodlar=[]; ciftler.slice(0,12).forEach(c=>{ [c.sukuk,c.dibs].forEach(k=>{ kodlar.push(k.kod); kodlar.push(k.kod+'.ORAN'); }); });
      const veri = await jget(B+'series='+kodlar.join('-')+'&startDate='+fmt(new Date(Date.now()-15*86400000))+'&endDate='+fmt(bugun)+'&type=json');
      const items=(veri&&veri.items)?veri.items:[];
      const son=(kod)=>{ const alan=kod.replace(/\./g,'_'); let v=null; items.forEach(it=>{ const x=it[alan]; if(x!==null&&x!==undefined&&x!=='') { const n=parseFloat(String(x).replace(',','.')); if(isFinite(n))v=n; } }); return v; };
      const getiriBul=(k)=>{ const fiyat=son(k.kod), oran=son(k.kod+'.ORAN'); if(fiyat==null||oran==null)return null;
        // dönemsel+kirli konvansiyonu (ölçülen doğru kombinasyon)
        const r=getiriHesapla(k,bugun,fiyat,oran,true,baz,true); return r?+r.getiri.toFixed(3):null; };
      const sonuc=[];
      ciftler.slice(0,12).forEach(c=>{
        const ys=getiriBul(c.sukuk), yd=getiriBul(c.dibs);
        if(ys==null||yd==null)return;
        sonuc.push({ itfa:c.itfa, kalanYil:c.kalanYil, sukukIsin:c.sukuk.isin, dibsIsin:c.dibs.isin,
          sukukGetiri:ys, dibsGetiri:yd, fark:+(yd-ys).toFixed(3) });  // + ise sukuk ucuz (DİBS yüksek)
      });
      if(!sonuc.length) return res.status(200).json({ ok:false, tur:'parite', err:'Çiftlerde fiyat verisi yok', aday:ciftler.length });
      const farklar=sonuc.map(x=>x.fark);
      const ort=+(farklar.reduce((a,b)=>a+b,0)/farklar.length).toFixed(3);
      const medyan=farklar.slice().sort((a,b)=>a-b)[Math.floor(farklar.length/2)];
      res.setHeader('Cache-Control','s-maxage=10800, stale-while-revalidate=21600');
      return res.status(200).json({ ok:true, tur:'parite', kaynak:'TCMB EVDS · bie_pydibs · aynı itfa tarihli TRD/TRT çiftleri',
        tarih:fmt(bugun), adet:sonuc.length, ortalamaFark:ort, medyanFark:+medyan.toFixed(3),
        durum: Math.abs(ort)<0.15?'PARİTE':(ort>0?'SUKUK UCUZ':'SUKUK PAHALI'),
        ciftler:sonuc });
    }catch(e){ return res.status(200).json({ ok:false, tur:'parite', err:'Parite hesabı: '+String(e.message||e).slice(0,120) }); }
  }

  try{
    // 1) Seri listesi → sabit kuponlu, vadesi gelecekte olan tahviller
    const ls = await jget(B+'serieList/code=bie_pydibs&type=json');
    const liste = Array.isArray(ls)?ls:(ls.items||[]);
    const bugun = new Date();
    const adaylar = liste.map(x=>seriAyristir(x.SERIE_CODE, x.SERIE_NAME||x.SERIE_NAME_TR||'', HARF))
      .filter(Boolean).filter(k=>gun(bugun,k.itfa)>60);
    if(!adaylar.length) return res.status(200).json({ ok:false, tur, err:'Uygun '+(tur==='sukuk'?'kira sertifikası':'sabit kuponlu tahvil')+' bulunamadı', toplamSeri:liste.length });

    // 2) Her hedef vadeye en yakın kalan vadeli gösterge
    const secim={}; const kullanilan=new Set();
    HEDEF.forEach(([ad,yil])=>{
      let en=null,enFark=1e9;
      adaylar.forEach(k=>{
        if(kullanilan.has(k.isin))return;
        const kalan=gun(bugun,k.itfa)/365, fark=Math.abs(kalan-yil);
        if(fark<enFark){enFark=fark;en=k;}
      });
      if(en&&enFark<yil*0.45){ secim[ad]=en; kullanilan.add(en.isin); }
    });
    const secilen=Object.entries(secim);
    if(!secilen.length) return res.status(200).json({ ok:false, err:'Vadelere gösterge eşleşmedi', aday:adaylar.length });

    // 3) Fiyat + kupon oranı serileri (tek istekte)
    const kodlar=[]; secilen.forEach(([,k])=>{kodlar.push(k.kod); kodlar.push(k.kod+'.ORAN');});
    const veri = await jget(B+'series='+kodlar.join('-')+'&startDate='+fmt(new Date(Date.now()-20*86400000))+'&endDate='+fmt(bugun)+'&type=json');
    const items=(veri&&veri.items)?veri.items:[];
    const sonIki=(kod)=>{ const alan=kod.replace(/\./g,'_'); const dizi=[];
      items.forEach(it=>{ const v=it[alan]; if(v!==null&&v!==undefined&&v!==''){ const n=parseFloat(String(v).replace(',','.')); if(isFinite(n))dizi.push({t:it.Tarih,v:n}); } });
      return dizi.slice(-2); };

    // 4) Dört kombinasyon (kupon dönemsel/yıllık × fiyat temiz/kirli) → referansa en yakın olan
    const KOMBO = [
      {ad:'dönemsel+temiz', don:true,  kirli:false},
      {ad:'dönemsel+kirli', don:true,  kirli:true },
      {ad:'yıllık+temiz',   don:false, kirli:false},
      {ad:'yıllık+kirli',   don:false, kirli:true }
    ];
    const ham={};
    secilen.forEach(([ad,k])=>{
      const f=sonIki(k.kod), o=sonIki(k.kod+'.ORAN');
      if(!f.length||!o.length)return;
      const oran=o[o.length-1].v, son=f[f.length-1], onc=f.length>1?f[f.length-2]:null;
      const valor=trTar(son.t)||bugun, valorO=onc?(trTar(onc.t)||valor):null;
      const hesap={}, hesapOnc={};
      KOMBO.forEach(c=>{
        hesap[c.ad]=getiriHesapla(k,valor,son.v,oran,c.kirli,baz,c.don);
        hesapOnc[c.ad]=onc?getiriHesapla(k,valorO,onc.v,oran,c.kirli,baz,c.don):null;
      });
      ham[ad]={ isin:k.isin, kod:k.kod, itfa:fmt(k.itfa), oran, tarih:son.t, oncekiTarih:onc?onc.t:null, fiyat:son.v,
                kalanYil:+(gun(bugun,k.itfa)/365).toFixed(2), sik:k.sik, hesap, hesapOnc };
    });
    const skor={};
    KOMBO.forEach(c=>{
      let s=0,n=0;
      Object.entries(ham).forEach(([ad,x])=>{
        const y=x.hesap[c.ad]&&x.hesap[c.ad].getiri;
        if(y!=null&&isFinite(y)&&REF[ad]!=null){ s+=Math.abs(y-REF[ad]); n++; }
      });
      skor[c.ad]= n? +(s/n).toFixed(2) : 9999;   // vade başına ortalama sapma
    });
    const konv = Object.entries(skor).sort((a,b)=>a[1]-b[1])[0][0];

    const vadeler={};
    Object.entries(ham).forEach(([ad,x])=>{
      const c=x.hesap[konv], p=x.hesapOnc[konv];
      if(!c||!isFinite(c.getiri))return;
      // Günlük Δ yalnızca önceki gözlem gerçekten bir önceki iş gününe aitse (≤5 gün) ve makulse
      let delta=null;
      if(p&&isFinite(p.getiri)&&x.oncekiTarih){
        const t1=trTar(x.oncekiTarih), t2=trTar(x.tarih);
        const fark=(t1&&t2)?gun(t1,t2):99;
        const d=c.getiri-p.getiri;
        if(fark>0&&fark<=5&&Math.abs(d)<=5) delta=+d.toFixed(2);
      }
      vadeler[ad]={ getiri:+c.getiri.toFixed(3), delta:delta,
        tarih:x.tarih, isin:x.isin, itfa:x.itfa, kupon:x.oran, kalanYil:x.kalanYil, fiyat:x.fiyat };
    });
    return res.status(200).json({ ok:Object.keys(vadeler).length>0, tur,
      kaynak:'TCMB EVDS · bie_pydibs · '+(tur==='sukuk'?'kira sertifikası (TRD)':'konvansiyonel DİBS (TRT)')+' (fiyat→IRR)',
      konvansiyon:konv, sapma:skor,
      adet:Object.keys(vadeler).length, aday:adaylar.length, baz, vadeler,
      ham: debug?ham:undefined });
  }catch(e){
    return res.status(200).json({ ok:false, err:'EVDS eğri verisi alınamadı: '+String(e.message||e).slice(0,140) });
  }
};
module.exports.config = { maxDuration: 60 };
