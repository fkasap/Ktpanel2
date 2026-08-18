// /api/bddk — BDDK Aylık Bülten (banka grubu bazlı bilanço / gelir tablosu)
// Uç: POST https://www.bddk.org.tr/BultenAylik/tr/Home/BasitRaporGetir
// Gövde (form): tabloNo, yil, ay, paraBirimi (TL|USD), taraf (grup kodu)
// Yanıt: { success, Json:{ data:{ rows:[ {cell:[...]}, ... ] } } }
// Kaynak: bddkR (R paketi) ve bddkdata (Python) aynı ucu kullanıyor — tarayıcı otomasyonu gerekmiyor.
// Kullanım: /api/bddk?grup=10003&tablo=1&ay=6&yil=2026   ·  ?ozet=1 → katılım + tüm bankalar özeti
const https = require('node:https');
// BDDK sunucusu ara sertifikayı göndermiyor (UNABLE_TO_VERIFY_LEAF_SIGNATURE).
// Zincir doğrulamasını atlıyoruz AMA sunucunun sunduğu sertifikanın gerçekten bddk.org.tr'ye
// ait olduğunu elle doğruluyoruz — böylece "herkese açık" bir TLS'e düşmüyoruz.
function bddkIstek(yol, govde, ekBaslik){
  if(global.__BDDK_TEST_ISTEK) return global.__BDDK_TEST_ISTEK(yol, govde, ekBaslik);
  return new Promise((coz, red)=>{
    const opt = { host:'www.bddk.org.tr', path:yol, method: govde?'POST':'GET',
      servername:'www.bddk.org.tr', rejectUnauthorized:false, timeout:20000,
      headers: Object.assign({ 'User-Agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36' }, ekBaslik||{}) };
    if(govde) opt.headers['Content-Length'] = Buffer.byteLength(govde);
    const r = https.request(opt, (s)=>{
      try{
        const c = s.socket && s.socket.getPeerCertificate ? s.socket.getPeerCertificate(true) : null;
        const ad = ((c&&c.subject&&c.subject.CN)||'') + ' ' + ((c&&c.subjectaltname)||'');
        if(!/bddk\.org\.tr/i.test(ad)){ s.destroy(); return red(new Error('Sertifika alan adı eşleşmedi: '+ad.slice(0,80))); }
        /* §309 TLS SERTLEŞTİRME — üç katman:
           1) KENDİNDEN İMZALI RED: subject==issuer olan sertifikada alan adını
              saldırgan yazar; eski kontrol bunu GEÇİRİYORDU. Artık geçmez.
           2) GEÇERLİLİK PENCERESİ: süresi dolmuş/başlamamış sertifika red.
           3) PARMAK İZİ: BDDK_PIN doluysa sha256 eşleşmeyen bağlantı red.
              Pin ŞU AN BOŞ çünkü gerçek parmak izi buradan ölçülemedi ve
              TAHMİNLE PİN YAZILMAZ — her yanıt _tls alanında parmak izini
              taşır; canlıdan bir kez okunup aşağıya yazıldığında pin devreye
              girer (ölç → pinle, §252n). Sertifika yenilenirse pin bilerek
              kırılır: sessiz devam etmektense gürültülü durmak yeğdir. */
        const BDDK_PIN = '';   /* örn 'AB:CD:...' — canlı ölçümden sonra doldurulacak */
        const issCN = (c&&c.issuer&&c.issuer.CN)||'';
        const subCN = (c&&c.subject&&c.subject.CN)||'';
        if(issCN && subCN && issCN===subCN && !(c&&c.issuerCertificate&&c.issuerCertificate!==c)){
          s.destroy(); return red(new Error('Kendinden imzalı sertifika: '+subCN.slice(0,60)));
        }
        const simdi = Date.now();
        if(c&&c.valid_from&&c.valid_to){
          const v1=Date.parse(c.valid_from), v2=Date.parse(c.valid_to);
          if(isFinite(v1)&&isFinite(v2)&&(simdi<v1||simdi>v2)){
            s.destroy(); return red(new Error('Sertifika geçerlilik dışı: '+c.valid_from+' → '+c.valid_to));
          }
        }
        const fp = (c&&(c.fingerprint256||c.fingerprint))||'';
        if(BDDK_PIN && fp && fp.toUpperCase()!==BDDK_PIN.toUpperCase()){
          s.destroy(); return red(new Error('TLS PIN UYUŞMADI — beklenen '+BDDK_PIN.slice(0,20)+'… gelen '+fp.slice(0,20)+'…'));
        }
        SON_TESHIS = Object.assign(SON_TESHIS||{}, { tls:{ fp, cn:subCN, veren:issCN, bitis:(c&&c.valid_to)||null, pin: BDDK_PIN?'AKTİF':'ölçüm modu' } });
      }catch(e){ return red(new Error('Sertifika okunamadı: '+e.message)); }
      let veri=''; s.setEncoding('utf8');
      s.on('data', d=>veri+=d);
      s.on('end', ()=>coz({ durum:s.statusCode, ctype:s.headers['content-type']||'', metin:veri, cerez:s.headers['set-cookie']||[] }));
    });
    r.on('error', red);
    r.on('timeout', ()=>r.destroy(new Error('zaman aşımı')));
    if(govde) r.write(govde);
    r.end();
  });
}
let SON_TESHIS=null;
module.exports = async (req, res) => {
  SON_TESHIS=null;
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=43200, stale-while-revalidate=86400');  // aylık veri → 12 saat

  // Grup kodları ÖLÇÜLEREK doğrulandı (2026-05): 10002+10003+10004 = 10001 (sektör toplamı).
  // R paketinin README'sindeki eşleme bir kayıktı.
  // Sahiplik kırılımı da ÖLÇÜLEREK doğrulandı (2026-05):
  // 10005 + 10006 + 10007 = 51.760.765 = 10001 (sektör toplamı, mn TL). Kimlik tuttuğu için eşleme kesin.
  const GRUP = { '10001':'Tüm Bankalar','10002':'Mevduat Bankaları','10003':'Katılım Bankaları',
    '10004':'Kalkınma ve Yatırım Bankaları',
    '10005':'Kamu Sermayeli','10006':'Yerli Özel','10007':'Yabancı Sermayeli' };
  const SAHIPLIK = ['10005','10006','10007'];
  const SEKTOR = '10001';
  // Gerçek yapı: [0]=grup, [1]=sıra, [2..]=kalem adı (metin), son üç sayı = TP · YP · Toplam
  const metinMi = v => { const s=String(v==null?'':v).replace(/<[^>]*>/g,'').trim();
    return s!=='' && !/^-?[\d.,\s]+$/.test(s); };
  const UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

  const sayi = v => { if(v==null)return null;
    const s=String(v).replace(/<[^>]*>/g,'').replace(/\u00a0/g,'').trim().replace(/\./g,'').replace(',','.');
    const n=parseFloat(s); return isFinite(n)?n:null; };

  async function cek(tablo, yil, ay, grup, para){
    const govde = new URLSearchParams({ tabloNo:String(tablo), yil:String(yil), ay:String(ay),
      paraBirimi:para||'TL', taraf:String(grup) }).toString();
    const y = await bddkIstek('/BultenAylik/tr/Home/BasitRaporGetir', govde, {
      'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8',
      'Accept':'application/json, text/javascript, */*; q=0.01',
      'Referer':'https://www.bddk.org.tr/BultenAylik/tr/', 'Origin':'https://www.bddk.org.tr' });
    SON_TESHIS = Object.assign(SON_TESHIS||{}, { durum:y.durum, ctype:y.ctype, uzunluk:(y.metin||'').length, ilk300:(y.metin||'').slice(0,300) });   /* §309: tls alanını EZME, birleştir */
    if(y.durum!==200) throw new Error('BDDK HTTP '+y.durum);
    let j=null; try{ j=JSON.parse(y.metin); }catch(e){ throw new Error('JSON değil (ilk 80: '+String(y.metin).slice(0,80).replace(/\s+/g,' ')+')'); }
    const rows = j && j.Json && j.Json.data && j.Json.data.rows;
    if(!rows || !rows.length) return null;
    return rows.map(x=>x.cell).filter(Boolean).map((c,i)=>{
      const temiz = c.map(v=>String(v==null?'':v).replace(/<[^>]*>/g,'').replace(/\u00a0/g,' ').trim());
      // Kalem adı: metin hücreler (BDDK biçim etiketlerini at)
      const kalem = temiz.slice(2).filter(metinMi).join(' ')
        .replace(/\s*(bold|italic)\s*/gi,' ').replace(/\s+/g,' ').trim();
      const say = temiz.map(sayi);
      // TP · YP · Toplam: a+b=c eşitliğini sağlayan ardışık üçlü (fazladan sütun olsa da doğru bulur)
      let tp=null, yp=null, toplam=null;
      for(let k=0;k<say.length-2;k++){
        const x=say[k], y=say[k+1], z=say[k+2];
        if(x==null||y==null||z==null)continue;
        const olcek=Math.max(Math.abs(z),1);
        if(Math.abs(x+y-z)/olcek < 0.005){ tp=x; yp=y; toplam=z; break; }
      }
      if(toplam==null){ const s=say.filter(v=>v!=null); toplam=s.length?s[s.length-1]:null; }
      return { sira: temiz[1]||String(i+1), kalem, tp, yp, toplam };
    });
  }
  // Toplam satırı: banka adı boş/"Toplam" olan ya da aktifi en büyük kayıt
  const kalemBul = (satirlar, desen) => {
    if(!satirlar)return null;
    const kk=s=>String(s||'').replace(/İ/g,'i').replace(/I/g,'ı').toLocaleLowerCase('tr');
    return satirlar.find(x=>desen.test(kk(x.kalem))) || null;
  };
  const toplamAl = (satirlar) => kalemBul(satirlar, /^toplam aktifler/) ||
    (satirlar&&satirlar.length?satirlar.reduce((a,b)=>((b.toplam||0)>(a.toplam||0)?b:a),satirlar[0]):null);

  const q = req.query||{};
  // Panel modu: Bankacılık sekmesinin ihtiyacı olan her şey tek çağrıda
  if(q.panel==='1'){
    const KODLAR=['10001','10002','10003','10004'];
    // Son yayımlanmış dönemi katılımdan bul
    const kat=await (async()=>{ const b=new Date();
      for(let g=1;g<=4;g++){ const d=new Date(b.getFullYear(), b.getMonth()-g, 1);
        try{ const s=await cek(1,d.getFullYear(),d.getMonth()+1,'10003','TL');
             if(s&&s.length) return {yil:d.getFullYear(), ay:d.getMonth()+1, satirlar:s}; }catch(e){} }
      return null; })();
    if(!kat) return res.status(200).json({ ok:false, err:'BDDK bülteninden veri alınamadı' });
    const oy=kat.ay===1?kat.yil-1:kat.yil, oa=kat.ay===1?12:kat.ay-1;
    const al=(s,d)=>{const x=kalemBul(s,d);return x?x.toplam:null;};
    const alTP=(s,d)=>{const x=kalemBul(s,d);return x?{tp:x.tp,yp:x.yp,toplam:x.toplam}:null;};
    const A=/^toplam aktifler/, K=/^krediler/, M=/^mevduat/, O=/^toplam özkaynaklar/,
          T=/^takipteki alacaklar/, KAR=/^dönem karı/, YK=/^toplam yabancı kaynaklar/,
          GN=/^gayrinakdi kredi/, ZK=/^beklenen zarar karşılıkları/;
    const gruplar={};
    for(const kod of KODLAR){
      try{
        const s=await cek(1,kat.yil,kat.ay,kod,'TL'); if(!s)continue;
        const o=await cek(1,oy,oa,kod,'TL').catch(()=>null);
        const g={ ad:GRUP[kod]||kod, aktif:al(s,A), krediler:al(s,K), mevduat:al(s,M), ozkaynak:al(s,O),
                  takip:al(s,T), donemKari:al(s,KAR), yabanciKaynak:al(s,YK), gayrinakdi:al(s,GN),
                  karsilik:al(s,ZK), tpyp:{ aktif:alTP(s,A), krediler:alTP(s,K), mevduat:alTP(s,M) } };
        if(o){ const oa2={aktif:al(o,A),krediler:al(o,K),mevduat:al(o,M),ozkaynak:al(o,O),donemKari:al(o,KAR)};
               g.onceki=oa2;
               const d=(x,y)=>(x!=null&&y)?+((x/y-1)*100).toFixed(2):null;
               g.aylik={ aktif:d(g.aktif,oa2.aktif), krediler:d(g.krediler,oa2.krediler),
                         mevduat:d(g.mevduat,oa2.mevduat), ozkaynak:d(g.ozkaynak,oa2.ozkaynak) }; }
        // Türetilmiş oranlar
        g.oran={ krediMevduat:(g.krediler!=null&&g.mevduat)?+(g.krediler/g.mevduat*100).toFixed(1):null,
                 takipOrani:(g.takip!=null&&g.krediler)?+(g.takip/(g.krediler+g.takip)*100).toFixed(2):null,
                 kaldirac:(g.aktif!=null&&g.ozkaynak)?+(g.aktif/g.ozkaynak).toFixed(1):null,
                 ypPayi:(g.tpyp.aktif&&g.tpyp.aktif.toplam)?+(g.tpyp.aktif.yp/g.tpyp.aktif.toplam*100).toFixed(1):null,
                 ozkaynakKarlilik:(g.donemKari!=null&&g.ozkaynak)?+(g.donemKari/g.ozkaynak*100).toFixed(1):null };
        gruplar[kod]=g;
      }catch(e){}
    }
    const kt=gruplar['10003'], tum=gruplar['10001'];
    const pay=(x,y)=>(x!=null&&y)?+(x/y*100).toFixed(2):null;
    return res.status(200).json({ ok:!!kt, kaynak:'BDDK Aylık Bülten', birim:'milyon TL',
      donem:kat.yil+'-'+String(kat.ay).padStart(2,'0'),
      oncekiDonem:oy+'-'+String(oa).padStart(2,'0'),
      gruplar,
      pay: (kt&&tum)?{ aktif:pay(kt.aktif,tum.aktif), krediler:pay(kt.krediler,tum.krediler),
                       mevduat:pay(kt.mevduat,tum.mevduat), ozkaynak:pay(kt.ozkaynak,tum.ozkaynak),
                       gayrinakdi:pay(kt.gayrinakdi,tum.gayrinakdi) }:null,
      katilimKalemleri: kat.satirlar });
  }
  // Sahiplik kırılımı: kamu / yerli özel / yabancı. panel=1'den AYRI tutuldu —
  // 3 grup x 2 dönem = 6 istek; panel=1'e eklenseydi 14 ardışık isteğe çıkıp maxDuration'ı zorlardı.
  // Bağımsız olduğu için biri başarısız olsa da Grup Karşılaştırması kartı ayakta kalır.
  if(q.sahiplik==='1'){
    const A=/^toplam aktifler/, K=/^krediler/, M=/^mevduat/, O=/^toplam özkaynaklar/,
          T=/^takipteki alacaklar/, KAR=/^dönem karı/, GN=/^gayrinakdi kredi/,
          TUR=/^a\) türev finansal araçlar/;
    const al=(s,d)=>{const x=kalemBul(s,d);return x?x.toplam:null;};
    const alTP=(s,d)=>{const x=kalemBul(s,d);return x?{tp:x.tp,yp:x.yp,toplam:x.toplam}:null;};
    // Son yayımlanmış dönemi kamu grubundan bul (panel=1 ile aynı desen)
    const ilk=await (async()=>{ const b=new Date();
      for(let g=1;g<=4;g++){ const d=new Date(b.getFullYear(), b.getMonth()-g, 1);
        try{ const s=await cek(1,d.getFullYear(),d.getMonth()+1,'10005','TL');
             if(s&&s.length) return {yil:d.getFullYear(), ay:d.getMonth()+1, satirlar:s}; }catch(e){} }
      return null; })();
    if(!ilk) return res.status(200).json({ ok:false, err:'BDDK bülteninden sahiplik verisi alınamadı' });
    const oy=ilk.ay===1?ilk.yil-1:ilk.yil, oa=ilk.ay===1?12:ilk.ay-1;
    const gruplar={};
    for(const kod of SAHIPLIK){
      try{
        const s = (kod==='10005') ? ilk.satirlar : await cek(1,ilk.yil,ilk.ay,kod,'TL');
        if(!s) continue;
        const o = await cek(1,oy,oa,kod,'TL').catch(()=>null);
        const g={ ad:GRUP[kod]||kod, aktif:al(s,A), krediler:al(s,K), mevduat:al(s,M),
                  ozkaynak:al(s,O), takip:al(s,T), donemKari:al(s,KAR), gayrinakdi:al(s,GN),
                  turev:al(s,TUR), tpyp:{ aktif:alTP(s,A) } };
        if(o){ const p={aktif:al(o,A),krediler:al(o,K),mevduat:al(o,M)};
               g.onceki=p;
               const d=(x,y)=>(x!=null&&y)?+((x/y-1)*100).toFixed(2):null;
               g.aylik={ aktif:d(g.aktif,p.aktif), krediler:d(g.krediler,p.krediler), mevduat:d(g.mevduat,p.mevduat) }; }
        // Dönem kârı yılbaşından bugüne kümülatif → ay sayısıyla yıllıklandır (ocak=1 … aralık=12)
        const yilKat = 12/ilk.ay;
        g.oran={ krediMevduat:(g.krediler!=null&&g.mevduat)?+(g.krediler/g.mevduat*100).toFixed(1):null,
                 takipOrani:(g.takip!=null&&g.krediler)?+(g.takip/(g.krediler+g.takip)*100).toFixed(2):null,
                 kaldirac:(g.aktif!=null&&g.ozkaynak)?+(g.aktif/g.ozkaynak).toFixed(1):null,
                 ypPayi:(g.tpyp.aktif&&g.tpyp.aktif.toplam)?+(g.tpyp.aktif.yp/g.tpyp.aktif.toplam*100).toFixed(1):null,
                 ozkaynakKarlilikYil:(g.donemKari!=null&&g.ozkaynak)?+(g.donemKari*yilKat/g.ozkaynak*100).toFixed(1):null,
                 aktifKarlilikYil:(g.donemKari!=null&&g.aktif)?+(g.donemKari*yilKat/g.aktif*100).toFixed(2):null,
                 turevAktif:(g.turev!=null&&g.aktif)?+(g.turev/g.aktif*100).toFixed(0):null };
        gruplar[kod]=g;
      }catch(e){}
    }
    // Kimlik testi: üç sahiplik grubu sektör toplamını vermeli. Vermiyorsa eşleme kaymıştır → uyar.
    const kodlar=Object.keys(gruplar);
    const top=kodlar.reduce((a,k)=>a+(gruplar[k].aktif||0),0);
    const payla=(x)=>(x!=null&&top)?+(x/top*100).toFixed(1):null;
    kodlar.forEach(k=>{ gruplar[k].sektorPayi=payla(gruplar[k].aktif); });
    return res.status(200).json({ ok:kodlar.length===3, kaynak:'BDDK Aylık Bülten', birim:'milyon TL',
      donem:ilk.yil+'-'+String(ilk.ay).padStart(2,'0'),
      oncekiDonem:oy+'-'+String(oa).padStart(2,'0'),
      ay:ilk.ay, toplamAktif:top, gruplar,
      not:'Dönem kârı yılbaşından kümülatiftir; ÖZK ve aktif kârlılık '+ilk.ay+' aylık veriden yıllıklandırılmıştır.' });
  }
  // Ham hücre çekici — tablo 5 gibi TP/YP/Toplam düzeninde OLMAYAN tablolar için.
  // cek() a+b=c sezgisiyle çalışır; tablo 5'te bu Kısa+Orta=Nakdi'yi bulup Takipteki sütununu kaybeder.
  async function cekHucre(tablo, yil, ay, grup){
    const govde = new URLSearchParams({ tabloNo:String(tablo), yil:String(yil), ay:String(ay),
      paraBirimi:'TL', taraf:String(grup) }).toString();
    const y = await bddkIstek('/BultenAylik/tr/Home/BasitRaporGetir', govde, {
      'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8',
      'Accept':'application/json, text/javascript, */*; q=0.01',
      'Referer':'https://www.bddk.org.tr/BultenAylik/tr/', 'Origin':'https://www.bddk.org.tr' });
    if(y.durum!==200) throw new Error('BDDK HTTP '+y.durum);
    const j=JSON.parse(y.metin);
    const rows=(j&&j.Json&&j.Json.data&&j.Json.data.rows)||[];
    const bas=(j&&j.Json&&(j.Json.colNames||j.Json.columns))||null;
    return { basliklar:bas, satirlar:rows.map(r=>r.cell).filter(Boolean) };
  }

  // Sektörel kredi stresi — BDDK Tablo 5 (ekonomik faaliyet kolu × kredi × takip)
  // Hücre düzeni ?ham=1 ile ÖLÇÜLDÜ (2026-05):
  //   [0]=grup [1]=sıra [2]=kalem [3]=font('bold'=üst düzey) [4]=kısa [5]=ortaUzun
  //   [6]=nakdi [7]=takipteki [8]=toplamNakdi [9]=gayriNakdi
  // DİKKAT: Tablo 5 BİN TL'dir (Tablo 1 milyon TL). Panelin geri kalanıyla aynı dile
  // getirmek için 1000'e bölüp milyon TL'ye çeviriyoruz.
  if(q.sektor==='1'){
    const grup=String(q.grup||'10001');
    const ilk=await (async()=>{ const b=new Date();
      for(let g=1;g<=4;g++){ const d=new Date(b.getFullYear(), b.getMonth()-g, 1);
        try{ const s=await cekHucre(5,d.getFullYear(),d.getMonth()+1,grup);
             if(s.satirlar.length) return {yil:d.getFullYear(), ay:d.getMonth()+1, veri:s}; }catch(e){} }
      return null; })();
    if(!ilk) return res.status(200).json({ ok:false, err:'BDDK Tablo 5 alınamadı' });
    const oy=ilk.ay===1?ilk.yil-1:ilk.yil, oa=ilk.ay===1?12:ilk.ay-1;
    const onc=await cekHucre(5,oy,oa,grup).catch(()=>null);

    const n = v => { const x=sayi(v); return x==null?null:+(x/1000).toFixed(0); };  // bin TL → milyon TL
    const ad = c => String(c[2]==null?'':c[2]).replace(/<[^>]*>/g,'')
                      .replace(/\s*\([\d+\s]+\)\s*$/,'').replace(/\s+/g,' ').trim();  // "(2+3+4)" ekini at
    const ustDuzey = c => /bold/i.test(String(c[3]||''));
    const cevir = (satirlar) => satirlar.filter(c=>c && c.length>=10).map(c=>({
      sira:+c[1]||null, kalem:ad(c), ust:ustDuzey(c),
      kisa:n(c[4]), ortaUzun:n(c[5]), nakdi:n(c[6]), takip:n(c[7]),
      toplamNakdi:n(c[8]), gayriNakdi:n(c[9]) }));

    const simdi=cevir(ilk.veri.satirlar);
    const once = onc ? cevir(onc.satirlar) : [];
    const oncMap={}; once.forEach(x=>{ oncMap[x.sira]=x; });

    const toplamSatir = simdi.find(x=>/^toplam$/i.test(x.kalem)) || null;
    const toplamNakdi = toplamSatir ? toplamSatir.nakdi : null;

    const zengin = simdi.map(x=>{
      const o=oncMap[x.sira];
      const takipOrani = (x.takip!=null && x.nakdi) ? +(x.takip/(x.nakdi+x.takip)*100).toFixed(2) : null;
      const oncTakip = (o && o.takip!=null && o.nakdi) ? (o.takip/(o.nakdi+o.takip)*100) : null;
      return Object.assign({}, x, {
        pay: (x.nakdi!=null && toplamNakdi) ? +(x.nakdi/toplamNakdi*100).toFixed(2) : null,
        takipOrani,
        // Takip oranındaki AYLIK DEĞİŞİM (baz puan) — stresin yönü, seviyesinden daha bilgilendirici
        takipDeltaBp: (takipOrani!=null && oncTakip!=null) ? +((takipOrani-oncTakip)*100).toFixed(0) : null,
        aylikKredi: (o && o.nakdi!=null && x.nakdi!=null && o.nakdi) ? +((x.nakdi/o.nakdi-1)*100).toFixed(2) : null,
        uzunVadePayi: (x.ortaUzun!=null && x.nakdi) ? +(x.ortaUzun/x.nakdi*100).toFixed(0) : null
      });
    });

    // Panel için: yalnız üst düzey sektörler (bold), TOPLAM hariç, büyüklüğe göre
    const sektorler = zengin.filter(x=>x.ust && !/^toplam$/i.test(x.kalem))
                            .sort((a,b)=>(b.nakdi||0)-(a.nakdi||0));
    return res.status(200).json({ ok:sektorler.length>0, kaynak:'BDDK Aylık Bülten · Tablo 5',
      birim:'milyon TL (kaynak bin TL, 1000e bölündü)',
      donem:ilk.yil+'-'+String(ilk.ay).padStart(2,'0'),
      oncekiDonem:oy+'-'+String(oa).padStart(2,'0'),
      grup, grupAd:GRUP[grup]||grup, toplam:toplamSatir, sektorler,
      tumSatirlar: q.tum==='1' ? zengin : undefined });
  }

  // Tablo keşfi: ?tablolar=1&bas=1&bit=8 → her tablonun adı, satır sayısı, kolon başlıkları.
  // Aralıklı çalışır çünkü 17 tablonun tamamı tek çağrıda maxDuration'ı aşar.
  if(q.tablolar==='1'){
    const yil=parseInt(q.yil)||2026, ay=parseInt(q.ay)||5, grup=String(q.grup||'10001');
    const bas=Math.max(1,parseInt(q.bas)||1), bit=Math.min(20,parseInt(q.bit)||bas+7);
    const cikti=[];
    for(let t=bas;t<=bit;t++){
      try{
        const s=await cekHucre(t,yil,ay,grup);
        const ilkKalem=(s.satirlar[0]||[])[2]||null;
        const sonKalem=(s.satirlar[s.satirlar.length-1]||[])[2]||null;
        cikti.push({ tablo:t, satir:s.satirlar.length, kolonlar:s.basliklar,
          ilkKalem:String(ilkKalem||'').slice(0,60), sonKalem:String(sonKalem||'').slice(0,60) });
      }catch(e){ cikti.push({ tablo:t, hata:String(e.message||e).slice(0,60) }); }
    }
    res.setHeader('Cache-Control','no-store');
    return res.status(200).json({ donem:yil+'-'+ay, grup, aralik:[bas,bit], tablolar:cikti });
  }

  // Grup kimliklendirme: kod → (aktif, mevduat) profili. Mevduatı 0 olan = kalkınma/yatırım,
  // aktifi en büyük olan = tüm bankalar. README'deki eşleme yanlış olabiliyor, ölçerek buluyoruz.
  if(q.gruplar==='1'){
    const yil=parseInt(q.yil)||2026, ay=parseInt(q.ay)||5;
    const kodlar=(q.kodlar||'10001,10002,10003,10004,10005,20001,20002,20003,30001,30002,30003').split(',');
    const cikti={};
    for(const kod of kodlar){
      try{
        const s=await cek(1,yil,ay,kod.trim(),'TL');
        if(!s){cikti[kod]={durum:'veri yok'};continue;}
        const bul=(d)=>{const x=kalemBul(s,d);return x?x.toplam:null;};
        cikti[kod]={ satir:s.length, aktif:bul(/^toplam aktifler/), krediler:bul(/^krediler/),
                     mevduat:bul(/^mevduat/), ozkaynak:bul(/^toplam özkaynaklar/) };
      }catch(e){ cikti[kod]={hata:String(e.message||e).slice(0,60)}; }
    }
    const enBuyuk=Object.entries(cikti).filter(([,v])=>v&&v.aktif).sort((x,y)=>y[1].aktif-x[1].aktif)[0];
    res.setHeader('Cache-Control','no-store');
    return res.status(200).json({ donem:yil+'-'+ay, gruplar:cikti,
      tahmin:{ tumBankalar: enBuyuk?enBuyuk[0]:null,
               mevduatsiz: Object.entries(cikti).filter(([,v])=>v&&v.mevduat===0&&v.aktif).map(([k])=>k) } });
  }
  // Ham mod: satırların gerçek hücre yapısını göster (kolon eşlemesini kurmak için)
  if(q.ham==='1'){
    const yil=parseInt(q.yil)||2026, ay=parseInt(q.ay)||5, grup=String(q.grup||'10003'), tablo=parseInt(q.tablo)||1;
    try{
      const govde=new URLSearchParams({tabloNo:String(tablo),yil:String(yil),ay:String(ay),paraBirimi:'TL',taraf:grup}).toString();
      const y=await bddkIstek('/BultenAylik/tr/Home/BasitRaporGetir', govde, {
        'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8','Accept':'application/json, text/javascript, */*; q=0.01',
        'Referer':'https://www.bddk.org.tr/BultenAylik/tr/','Origin':'https://www.bddk.org.tr'});
      const j=JSON.parse(y.metin);
      const d=j&&j.Json&&j.Json.data, rows=(d&&d.rows)||[];
      res.setHeader('Cache-Control','no-store');
      return res.status(200).json({ donem:yil+'-'+ay, tablo, grup, satirSayisi:rows.length,
        ustBilgi: d?Object.keys(d).filter(k=>k!=='rows'):null,
        kolonBasliklari: (j&&j.Json&&(j.Json.colNames||j.Json.columns||j.Json.colModel))||null,
        ilkSatirlar: rows.slice(0,8).map(r=>r.cell),
        sonSatir: rows.length?rows[rows.length-1].cell:null });
    }catch(e){ return res.status(200).json({ ok:false, err:String(e.message||e) }); }
  }
  // Teşhis: ?teshis=1 → tek çağrının ham yanıtını göster (WAF/HTML/oturum sorununu ayırt etmek için)
  if(q.teshis==='1'){
    const yil=parseInt(q.yil)||2026, ay=parseInt(q.ay)||5, grup=String(q.grup||'10003');
    let cerez='';
    try{ const w=await bddkIstek('/BultenAylik/tr/', null, {'Accept':'text/html'});
         cerez=(w.cerez||[]).map(c=>c.split(';')[0]).join('; ');
    }catch(e){}
    let sonuc=null, hata=null;
    let sebep=null;
    try{ sonuc=await cek(1,yil,ay,grup,'TL'); }catch(e){ hata=String(e.message||e);
      if(e&&e.cause)sebep={kod:e.cause.code, mesaj:String(e.cause.message||'').slice(0,200)}; }
    res.setHeader('Cache-Control','no-store');
    // Ek sonda: yalın GET ile ana sayfaya erişim var mı (bağlantı mı, uç mu sorunlu)
    let anasayfa=null;
    try{ const t=await bddkIstek('/', null, {'Accept':'text/html'});
         anasayfa={durum:t.durum, ctype:t.ctype};
    }catch(e){ anasayfa={hata:String(e.message||e), sebep:e&&e.cause?{kod:e.cause.code, mesaj:String(e.cause.message||'').slice(0,160)}:null}; }
    return res.status(200).json({ denenen:{yil,ay,grup}, cerezAlindi:!!cerez, satir:sonuc?sonuc.length:0,
      ornek:sonuc?sonuc.slice(0,2):null, hata, sebep, anasayfa, teshis:SON_TESHIS });
  }
  try{
    // Son yayımlanmış ayı bul: bugünden geriye doğru en fazla 4 ay dene
    async function sonAy(tablo, grup, para){
      const b=new Date();
      let sonHata=null;
      for(let g=1; g<=4; g++){
        const d=new Date(b.getFullYear(), b.getMonth()-g, 1);
        try{ const s=await cek(tablo, d.getFullYear(), d.getMonth()+1, grup, para);
             if(s&&s.length) return {yil:d.getFullYear(), ay:d.getMonth()+1, satirlar:s}; }catch(e){ sonHata=e; }
      }
      if(sonHata) throw sonHata;      // bağlantı hatasını yut ma — yukarı taşı ki sebebi görelim
      return null;
    }
    if(q.ozet==='1'){
      const kat = await sonAy(1,'10003','TL');
      if(!kat) return res.status(200).json({ ok:false, err:'BDDK bülteninden veri alınamadı (son 4 ay denendi)' });
      const tum = await cek(1, kat.yil, kat.ay, SEKTOR, 'TL').catch(()=>null);
      // Bir önceki ay (aylık değişim için)
      const oy = kat.ay===1?kat.yil-1:kat.yil, oa = kat.ay===1?12:kat.ay-1;
      const katOnce = await cek(1, oy, oa, '10003','TL').catch(()=>null);
      const al=(s,d)=>{const x=kalemBul(s,d); return x?x.toplam:null;};
      const AKTIF=/^toplam aktifler/, KREDI=/^krediler/, FON=/^mevduat/, OZK=/^toplam özkaynaklar/,
            TAKIP=/^takipteki alacaklar/, KAR=/^dönem karı/;
      const k={ aktif:al(kat.satirlar,AKTIF), krediler:al(kat.satirlar,KREDI),
                mevduat:al(kat.satirlar,FON), ozkaynak:al(kat.satirlar,OZK),
                takip:al(kat.satirlar,TAKIP), donemKari:al(kat.satirlar,KAR) };
      const t=tum?{ aktif:al(tum,AKTIF), krediler:al(tum,KREDI), mevduat:al(tum,FON) }:null;
      const ko=katOnce?{ aktif:al(katOnce,AKTIF), krediler:al(katOnce,KREDI), mevduat:al(katOnce,FON) }:null;
      const pay=(x,y)=>(x!=null&&y)?+(x/y*100).toFixed(2):null;
      const deg=(x,y)=>(x!=null&&y)?+((x/y-1)*100).toFixed(2):null;
      return res.status(200).json({ ok:k.aktif!=null, kaynak:'BDDK Aylık Bülten', donem:kat.yil+'-'+String(kat.ay).padStart(2,'0'),
        birim:'milyon TL',
        katilim:k, sektor:t,
        pay: t?{ aktif:pay(k.aktif,t.aktif), krediler:pay(k.krediler,t.krediler), mevduat:pay(k.mevduat,t.mevduat) }:null,
        aylikDegisim: ko?{ aktif:deg(k.aktif,ko.aktif), krediler:deg(k.krediler,ko.krediler), mevduat:deg(k.mevduat,ko.mevduat) }:null,
        kalemler: q.detay==='1'?kat.satirlar:undefined,
        kalemAdlari: (k.aktif==null)?kat.satirlar.map(x=>x.kalem).filter(Boolean).slice(0,40):undefined });

    }
    const tablo=parseInt(q.tablo)||1, grup=String(q.grup||'10003'), para=(q.para||'TL').toUpperCase();
    let yil=parseInt(q.yil), ay=parseInt(q.ay), satirlar=null;
    if(yil&&ay){ satirlar=await cek(tablo,yil,ay,grup,para); }
    else { const s=await sonAy(tablo,grup,para); if(s){yil=s.yil;ay=s.ay;satirlar=s.satirlar;} }
    if(!satirlar) return res.status(200).json({ ok:false, err:'Veri bulunamadı', tablo, grup, yil, ay });
    return res.status(200).json({ ok:true, kaynak:'BDDK Aylık Bülten', grupAd:GRUP[grup]||grup,
      tablo, donem:yil+'-'+String(ay).padStart(2,'0'), para, adet:satirlar.length,
      toplam:toplamAl(satirlar), satirlar });
  }catch(e){
    return res.status(200).json({ ok:false, err:'BDDK ucuna ulaşılamadı: '+String(e.message||e).slice(0,140),
      sebep: e&&e.cause?{ kod:e.cause.code, mesaj:String(e.cause.message||'').slice(0,160) }:null,
      teshis: SON_TESHIS });
  }
};
module.exports.config = { maxDuration: 45 };
