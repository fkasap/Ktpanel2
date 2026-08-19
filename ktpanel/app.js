const FONDATA={AFT:[0.966479,2.04,18.03,12.43,52.35],BGP:[6.264353,3.39,10.1,22.35,47.76],DAS:[53.71027,1.96,5.8,11.31,21.45],DCB:[4.573968,3.45,10.31,22.59,47.7],DFI:[5.006,22.19,36.72,87.25,1118.35],DIP:[1.513592,3.52,10.48,23.13,48.9],DLY:[5.828714,3.3,9.94,22.04,47.0],DOV:[58.267216,0.93,3.25,7.61,17.32],EUZ:[60.400437,0.9,3.15,7.34,17.07],FKE:[57.105034,0.87,3.12,7.22,16.76],FPZ:[67.3556,1.91,5.76,11.23,21.29],GPL:[51.843743,1.89,5.71,11.03,20.76],GRO:[52.820427,1.92,5.78,11.19,21.38],HSL:[395.946124,3.35,10.03,22.19,47.03],IDO:[56.046983,0.92,3.18,7.35,17.03],KDL:[51.323618,1.78,5.37,10.31,19.21],KLU:[4.647471,3.34,9.95,21.6,44.28],KSV:[5.521858,3.1,9.43,20.27,42.63],KTR:[10.199934,2.94,9.29,20.73,44.16],KTV:[7.396603,3.1,9.17,20.23,43.11],KVS:[3.650473,3.56,10.62,23.5,49.87],KZL:[25.843693,1.52,-9.01,0.74,44.76],OJB:[51.973424,1.9,5.73,11.13,21.01],OJK:[12.362814,1.7,-8.26,2.26,44.31],ONK:[57.973341,0.9,3.16,7.37,17.06],ONS:[52.747229,1.93,5.77,11.21,21.32],PAL:[55.578651,1.92,5.77,11.2,21.44],PBR:[5.37041,16.41,45.67,143.09,190.47],PHE:[3.863468,16.03,39.43,167.99,218.84],PIP:[1.615071,3.37,10.11,22.49,47.56],PPJ:[1.774398,3.48,10.41,22.97,48.48],PRY:[3.012682,4.07,12.24,28.12,59.36],PSE:[1.785564,4.05,12.16,28.33,58.55],PTE:[1.630155,3.39,10.14,22.49,47.56],PVK:[5.549589,3.17,9.45,20.97,44.28],TLY:[7360.43742,18.97,48.24,151.18,1074.31],TP2:[2.063546,4.02,12.2,28.2,59.74],TTA:[0.578083,1.61,-9.05,-5.67,33.78],YJY:[56.412573,1.95,5.86,11.35,21.46],YKT:[0.813216,1.25,-9.45,0.3,38.0],YOZ:[48.276833,2.0,6.03,11.86,null],YP4:[53.078831,1.92,5.74,11.1,21.02],YTY:[56.976602,0.92,3.21,7.44,17.27],ZBJ:[4.963299,3.41,10.31,22.75,48.13],ZP8:[3.912407,3.4,10.14,22.21,47.04],ZPR:[1.479097,3.46,10.27,22.54,null]};const FONDATA_TARIH="2026-07-13";
/* ---- Haber akışı verisi (KAP · 16 Tem itibarıyla) ---- */
let kazancYuklendi=false;
let tahminLoaded=false;
let ihracLoaded=false;
const TOP40=["MAVI", "ORGE", "ARASE", "LMKDC", "TUPRS", "NTGAZ", "KTLEV", "KRONT", "GRSEL", "ELITE", "PLTUR", "MPARK", "GUBRF", "GOKNR", "KOTON", "BIMAS", "BAHKM", "SEKUR", "RGYAS", "FONET", "EUPWR", "DAPGM", "EGGUB", "BASGZ", "SAFKR", "ARDYZ", "EBEBK", "GOLTS", "ISDMR", "CIMSA", "ENJSA", "YUNSA", "KRDMD", "GRTHO", "AVPGY", "KONYA", "CEMTS", "ASELS", "KARSN", "SUNTK"];
/* tip: FR=bilanço, ODA=özel durum, DUY=duyuru, DG=diğer, CA=kurumsal aksiyon · sinyal: 2=yüksek,1=orta,0=düşük */
const HABERLER=[
  {"d": "22 Tem", "k": "EUPWR", "t": "DUY", "s": 2, "ozet": "Sert yükseliş sonrası pay bazında devre kesici — hisse dün +%10 ile sepetin haftalık şampiyonu (14 Tem'den beri +%16,6); momentum güçlü ama volatilite arttı.", "url": "https://www.kap.org.tr/tr/Bildirim/1635581"},
  {"d": "21 Tem", "k": "BIMAS", "t": "CA", "s": 1, "ozet": "Geri alım programı işliyor: 21 Tem seansında pay alımı bildirildi — zayıf günlerde hisseyi destekleyen düzenli el.", "url": "https://www.kap.org.tr/tr/Bildirim/1635533"},
  {"d": "21 Tem", "k": "SUNTK", "t": "DUY", "s": 2, "ozet": "Çift devre kesici: 16→20 Tem arası +%33 ralli yapan hisse 21 Tem'de −%10 düzeltti — sepetin en oynak ismi, pozisyon boyutu uyarısı.", "url": "https://www.kap.org.tr/tr/Bildirim/1635257"},
  {"d": "21 Tem", "k": "ASELS", "t": "DG", "s": 2, "ozet": "Finansal takvim bildirimi — 2Ç26 bilanço tarihi açıklandı; sepetin en büyük sanayi ağırlığında sezon geri sayımı başladı (detay KAP'ta).", "url": "https://www.kap.org.tr/tr/Bildirim/1635301"},
  {"d": "21 Tem", "k": "ARDYZ", "t": "ODA", "s": 1, "ozet": "Kamu kurumuyla 21,0 mn TL (KDV dahil) siber güvenlik yazılımı tedarik sözleşmesi — tutar küçük ama kamu referansı birikimi değerli.", "url": "https://www.kap.org.tr/tr/Bildirim/1635234"},
  {"d": "21 Tem", "k": "RGYAS", "t": "CA", "s": 1, "ozet": "%100 bağlı ortaklıkla birleşme bildirimi — holding yapısı sadeleşiyor; maliyet ve şeffaflık açısından olumlu kurumsal adım.", "url": "https://www.kap.org.tr/tr/Bildirim/1635523"},
  {"d": "21 Tem", "k": "GOLTS", "t": "CA", "s": 1, "ozet": "Nakit kâr payı hak kullanımı işlemi — temettü ödemesi gerçekleşiyor; BIST Temettü endeks profiline uygun.", "url": "https://www.kap.org.tr/tr/Bildirim/1635430"},
  {"d": "20 Tem", "k": "KOTON", "t": "ODA", "s": 2, "ozet": "Rusya'da İHA saldırısında Wildberries'in iki deposu hasar gördü; etkilenen stok toplam varlıkların ~%0,4'ü, sigorta süreci işliyor — finansal etki sınırlı ama jeopolitik risk hatırlatması.", "url": "https://www.kap.org.tr/tr/Bildirim/1635216"},
  {"d": "20 Tem", "k": "KTLEV", "t": "ODA", "s": 1, "ozet": "Bağlı ortaklık Bainbridge Gayrimenkul satışı + Bolu şube açılışı — haber akışı yoğun; hisse buna rağmen haftanın en zayıfı (−%10,8), PPK öncesi katılım bankacılığında kâr realizasyonu.", "url": "https://www.kap.org.tr/tr/Bildirim/1635128"},
  {"d": "20 Tem", "k": "DAPGM", "t": "ODA", "s": 1, "ozet": "2Ç26 satış rakamları: Nişantaşı Koru'da Emlak Konut paylaşımı tamamlandı, Validebağ'da 12 bölümün 10'u teslim, Ataşehir Doğu 3. Etap'ta 173 bölüm satışta — proje çarkı dönüyor.", "url": "https://www.kap.org.tr/tr/Bildirim/1635123"},
  {"d": "20 Tem", "k": "ISDMR", "t": "DUY", "s": 1, "ozet": "BIST Temettü ve Temettü-25 endekslerine dahil edildi — endeks takipli fonlardan mekanik talep desteği.", "url": "https://www.kap.org.tr/tr/Bildirim/1635166"},
  {"d": "20 Tem", "k": "AVPGY", "t": "ODA", "s": 1, "ozet": "BIST Temettü endeksine dahil edildi + maddi duran varlık alımı bildirimi — portföy büyümesi ve endeks talebi aynı günde.", "url": "https://www.kap.org.tr/tr/Bildirim/1635174"},
  {"d": "20 Tem", "k": "ORGE", "t": "ODA", "s": 0, "ozet": "TSE belge alımı bildirimi — rutin operasyonel gelişme.", "url": "https://www.kap.org.tr/tr/Bildirim/1635175"},
  {"d": "20 Tem", "k": "SEKUR", "t": "ODA", "s": 0, "ozet": "Bağımsız denetim kuruluşu tescili + 2025 olağan genel kurul işlemleri — rutin kurumsal takvim.", "url": "https://www.kap.org.tr/tr/Bildirim/1635080"}
];
const HABER_TARIH="2026-07-14";
/* ---- Sekmeler ---- */
/* PY_GRUP — Portföy Yönetimi alt sekmeleri. Bu listede OLMAYAN bir sekme
   açıldığında alt gezinme çubuğu GİZLENİYOR.
   §219b: t23 (Finansal Tablolar) eklendi. index.html'e düğmeyi koyup buraya
   eklemeyi unutmuştum; sekme açılıyordu ama alt çubuk kayboluyordu.
   İKİ YERDE TANIMLI BİR ŞEY — düğme HTML'de, üyelik burada. Biri değişince
   diğeri de değişmeli. Bu oturumun en sık hatası (§211c) yine burada. */
/* §231 Panel sürüm damgası — deploy durumunu tek bakışta görmek için. */
let YAB_CANLI=null;   /* §259c canlı yabancı haftalık akış (/api/evds2?mod=yab) */
let CDS_CANLI=null;   /* §253b canlı CDS · {deger,tarih,degisim}
   TDZ ONLEMI: `let` HOISTED DEGILDIR. Bu degisken renderRiskBaro() icinde
   okunuyor ve o fonksiyon satir 1307'de (dosyanin cok yukarisinda) cagriliyor.
   Su an guvenli — o cagri `await`ten sonraki async govdede, yani betik tam
   ayristiktan sonra kosuyor. Ama TESADUFI bir guvenlik: biri o cagriyi
   senkron bir yere tasirsa TDZ hatasi verir ve TUM barometre coker.
   Tanim en uste alindi, risk tamamen kalkti. (§247c ve §252m ayni sinif.) */
const KTP_SURUM = '20260819e';   // SS320 egri gorseli TR+ABD canli · SS319-D

/* §311 KÜRESEL FETCH ZAMAN AŞIMI — ölçülerek bulundu:
   Asya forex "yükleniyor…" yazısı bir oturumda sonsuza dek asılı kaldı.
   Kod suçsuzdu: catch/else dalları yer tutucuyu güncelliyordu — ama fetch
   ZAMAN AŞIMSIZ beklediği için istek askıda kalınca HİÇBİR dal koşmadı.
   ENVANTER: app.js'te 102 await fetch, SIFIR AbortSignal — aynı asılı kalma
   her kartın başına gelebilirdi; Asya yalnız görünen ucuydu.
   ÇÖZÜM (tek sahip, §112): 102 noktayı elle düzeltmek yerine fetch bir kez
   sarılır. Kendi signal'ını getiren istek AYNEN geçer; getirmeyene 25 sn
   üst sınır takılır. Süre dolunca TimeoutError fırlar → mevcut catch'ler
   "alınamadı" basar. 25 sn bilinçli geniş: Vercel fonksiyon tavanlarının
   üstü — normalde hiç devreye girmez, yalnız gerçek askıda tetiklenir.
   ajan.js de kapsamda: bu dosya ondan ÖNCE yüklendiği için sarım sayfadaki
   tüm fetch'lere (Ebu'nun 20 çağrısı dahil) uygulanır.
   Tarayıcı AbortSignal.timeout desteklemiyorsa sarım sessizce devre dışı
   kalır — davranış bugünküyle aynı olur, asla daha kötü olmaz. */
(function(){
  try{
    if(typeof AbortSignal==='undefined' || !AbortSignal.timeout) return;
    const ozgun = window.fetch.bind(window);
    window.fetch = function(kaynak, secenek){
      secenek = secenek || {};
      if(!secenek.signal){ try{ secenek.signal = AbortSignal.timeout(25000); }catch(e){} }
      return ozgun(kaynak, secenek);
    };
  }catch(e){}
})();   // §252d/e/g/h/j/k/l/m/p — birim hatalari, bulutUyari, egri sapma, XKTMT etiketi, SERIT

const PY_GRUP=['t11','t3','t9','t21','t4','t6','t8','t14','t20','t25','t23'];  /* §298: PYŞ Sektör Fix Income (t10) altına taşındı (sk-pys paneli) — üç-yer kuralı (§121): düğme t10 alt-navında, üyelik BURADAN çıktı, ajan SEKME_DISLA t10'u zaten kapsıyor */  /* §248: t5 Sukuk'a taşındı (sk-katfon), t26 PYŞ Sektör eklendi */ /* §247b: t25 Yabancı Hisse eklendi — listede olmayınca alt çubuk sekmede GİZLENİYORDU */ // Portföy Yönetimi alt-nav grubu (t5 Katılım Fonları dahil)
document.querySelectorAll('nav.tabs button').forEach(b=>b.addEventListener('click',()=>{
  const hedef=document.getElementById(b.dataset.tab);
  if(!hedef)return; // sekme paneli yoksa sessizce çık — nav'ı kilitleme
  document.querySelectorAll('nav.tabs button').forEach(x=>x.classList.remove('act'));
  document.querySelectorAll('.tab').forEach(x=>x.classList.remove('act'));
  hedef.classList.add('act');
  const grupta=PY_GRUP.includes(b.dataset.tab);
  const subnav=document.getElementById('pySubnav');
  if(subnav)subnav.style.display=grupta?'':'none';
  if(grupta){
    // Ana nav'da Equity'yi (t11), alt-nav'da tıklanan sekmeyi işaretle
    const anaBtn=document.querySelector('nav.tabs:not(#pySubnav) button[data-tab="t11"]');
    if(anaBtn)anaBtn.classList.add('act');
    const altBtn=document.querySelector('#pySubnav button[data-tab="'+b.dataset.tab+'"]');
    if(altBtn)altBtn.classList.add('act');
  }else{
    b.classList.add('act');
  }
  try{
    if(b.dataset.tab==='t6'&&!fmLoaded){fmLoaded=true;fmInit();}
    if(b.dataset.tab==='t7'&&!haberLoaded){haberLoaded=true;haberInit();}
    if(b.dataset.tab==='t10'&&!ihracLoaded){ihracLoaded=true;ihracRender();}
    if(b.dataset.tab==='t15'){emtiaRender();}
    if(b.dataset.tab==='t16'){asyaRender();}
    if(b.dataset.tab==='t17'){abdSekme();}
    if(b.dataset.tab==='t10'){sinyalRender();}   /* SS315: Fix Income acilinca tazele */
    if(b.dataset.tab==='t18'){avrupaSekme();}
    /* §163: kazancTakvimCanli §162'de #kazancCanli'ye yonlendirildi ama
       CAGIRANI KALMADI (eskiden takvimRender icinden cagriliyordu, o silindi).
       Kutu Piyasa sekmesinde olduguna gore tetikleyicisi de orada olmali.
       Tembel: sekme acilinca bir kez. */
    /* §218b t23 KURULUMU — sekme açılınca BİR KEZ. Yıl seçenekleri ve düğme
       bağlantısı burada kurulur. §163 dersi: varsayılan açık olmayan sekmede
       tembel kurulum sorunsuz, ama bir kereliğine yapıldığından emin ol. */
    if(b.dataset.tab==='t23' && !window.__ftKuruldu){
      window.__ftKuruldu = true;
      try{
        const y = $('ftYil'), bu = new Date().getFullYear();
        for(let k=bu; k>=bu-5; k--) y.innerHTML += '<option value="'+k+'">'+k+'</option>';
        const g = $('ftGetir'); if(g) g.onclick = ftGetir;
        /* §231 Rozete PANEL sürümü — API sürümü ilk çağrıda eklenir.
           İkisi ayrı deploy edilebiliyor ve tutarsız kalabiliyorlar. */
        try{ const tg=$('ftTag'); if(tg) tg.textContent = 'panel '+KTP_SURUM; }catch(e){}
        const kd = $('ftKod'); if(kd) kd.addEventListener('keydown', ev=>{ if(ev.key==='Enter') ftGetir(); });
      }catch(e){ console.warn('[KTPanel] t23 kurulum:', e); }
    }
    if(b.dataset.tab==='t1'&&!kazancYuklendi){kazancYuklendi=true;
      if(typeof kazancTakvimCanli==='function')kazancTakvimCanli();}
    if(b.dataset.tab==='t1'){ try{ if(typeof bistTakvimRender==='function')bistTakvimRender();
      if(typeof globalTakvimRender==='function')globalTakvimRender(); }catch(e){} }
    if(b.dataset.tab==='t3'){pozFiyatOto();
      /* §154: Endeksten Ayrışma artık Portföy sekmesinin İÇİNDE — ayrı sekme değil.
         Pozisyonlarla aynı ekranda olması doğru: aktif ağırlık, tablodaki
         ağırlık sütununun endeksle karşılaştırılmış halidir. */
      if(typeof ayrismaInit==='function')ayrismaInit(); }

    if(b.dataset.tab==='t20'){ if(typeof halkaarzRender==='function')halkaarzRender(); if(!HALKAARZ&&typeof halkaarzInit==='function')halkaarzInit(); }
  }catch(e){console.error('[KTPanel] sekme init hatası:',(e&&e.message)||e);}
}));
/* ---- Sukuk alt-sekmeleri ---- */
document.addEventListener('click',(e)=>{
  const b=e.target.closest('.subtab-btn');
  if(!b)return;
  const kap=b.closest('.tab')||document; // yalnız kendi sekmesinin butonlarını/panellerini yönet
  kap.querySelectorAll('.subtab-btn').forEach(x=>{x.classList.remove('act');x.style.borderBottomColor='transparent';x.style.color='var(--muted)';x.style.fontWeight='600';});
  kap.querySelectorAll('.subtab-panel').forEach(x=>x.style.display='none');
  b.classList.add('act');b.style.borderBottomColor='var(--mm2)';b.style.color='var(--mm2)';b.style.fontWeight='700';
  const p=document.getElementById(b.dataset.subtab);if(p)p.style.display='';
  // İhraç Takvimi'ne ilk geçişte veriyi yükle
  if(b.dataset.subtab==='sk-ihrac'&&!ihracLoaded){ihracLoaded=true;if(typeof ihracRender==='function')ihracRender();}
  // §124: Tahminler alt sekmesi — açılınca bir kez yüklenir (EVDS'e boşuna istek gitmesin)
  if(b.dataset.subtab==='mk-tahmin'&&!tahminLoaded){tahminLoaded=true;if(typeof tahminInit==='function')tahminInit();}
});
(function(){const yb=document.getElementById('yardimTrigger');if(yb)yb.addEventListener('click',()=>{
  document.querySelectorAll('nav.tabs button').forEach(x=>x.classList.remove('act'));
  document.querySelectorAll('.tab').forEach(x=>x.classList.remove('act'));
  const t=document.getElementById('t12');if(t)t.classList.add('act');
  window.scrollTo(0,0);
});})();

const trN=(v,d=2)=>Number(v).toLocaleString('tr-TR',{minimumFractionDigits:d,maximumFractionDigits:d});
const trG=(v)=>Number(v).toLocaleString('tr-TR',{minimumFractionDigits:0,maximumFractionDigits:4});
const pct=(v)=>v==null?'<td class="num">—</td>':'<td class="num '+(v>=0?'up':'down')+'">'+(v>=0?'+':'')+trN(v)+'</td>';
const $=(id)=>document.getElementById(id);
const esc=(s)=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function spark(id,data,color){
  const el=$(id);if(!el||!data||data.length<2)return;
  const min=Math.min(...data),max=Math.max(...data),rng=(max-min)||1;
  const pts=data.map((v,i)=>[(i/(data.length-1))*100,28-((v-min)/rng)*24+1]);
  const line=pts.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ');
  el.innerHTML='<polyline points="'+line+'" fill="none" stroke="'+color+'" stroke-width="2"/><circle cx="'+pts[pts.length-1][0]+'" cy="'+pts[pts.length-1][1]+'" r="2.5" fill="'+color+'"/>';
}
/* ---- BIST endeksleri ---- */
const ENDEKSLER=[["XU100", "BIST 100", 13974.14, -0.69], ["XU030", "BIST 30", 15914.21, -1.02], ["XU050", "BIST 50", 12413.81, -0.8], ["XUTUM", "BIST TÜM", 18127.35, -0.45], ["XTUMY", "BIST TÜM-100", 76466.27, 0.15], ["XUMAL", "BIST MALİ", 19065.66, -1.33], ["XUSIN", "BIST SINAİ", 19177.54, 0.06], ["XUSRD", "BIST SÜRDÜRÜLEBİLİRLİK", 18082.42, -0.51], ["XKURY", "BIST KURUMSAL YÖN.", 13136.54, 0.07], ["XTMTU", "BIST TEMETTÜ", 16125.29, -0.07], ["XK100", "BIST KATILIM 100", 17716.04, -0.31], ["XKTUM", "BIST KATILIM TÜM", 18909.44, -0.12], ["XKTMT", "BIST KATILIM TEMETTÜ", 17736.6, -0.48], ["XHARZ", "BIST HALKA ARZ", 378866.66, -0.48], ["XUGRA", "BIST GERİ ALIM", 14818.26, 0.25]];
function endeksRender(){
  const tb=$('endeksBody');if(!tb)return;
  const m=window.__market, canli=(m&&m.end)?m.end:null;
  let say=0;let html='';
  const sat=(e)=>{
    if(!e)return null;
    const c=canli?canli[e[0]]:null;
    const p=(c&&c.p!=null)?c.p:e[2], g=(c&&c.chg!=null)?c.chg:e[3], tz=!!(c&&c.p!=null);
    if(tz)say++;
    return [e[0],e[1],p,g,tz];
  };
  for(let i=0;i<ENDEKSLER.length;i+=2){
    const a=sat(ENDEKSLER[i]),b=sat(ENDEKSLER[i+1]);
    const cell=(e)=>e?'<td><b>'+e[0]+'</b>'+(e[4]?'<span title="canlı" style="color:var(--mm2);font-size:8px"> ●</span>':'')+'</td><td style="color:var(--muted);font-family:var(--sans);font-size:10px">'+e[1]+'</td><td class="num">'+trN(e[2])+'</td><td class="num '+(e[3]>=0?'up':'down')+'">'+(e[3]>=0?'▲':'▼')+' %'+trN(Math.abs(e[3]))+'</td>':'<td colspan="4"></td>';
    html+='<tr>'+cell(a)+'<td></td>'+cell(b)+'</tr>';
  }
  tb.innerHTML=html;
  const d=$('endDamga');
  if(d)d.textContent=say?('canlı · '+new Date().toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'})+' · '+say+'/'+ENDEKSLER.length+' endeks'):'damgalı kapanış';
}
endeksRender();
/* ---- Ticker ---- */
/* §252p SERIT DONMUSTU. BIST 100/30 degerleri BURADA SABIT yaziliydi ve
   HICBIR YAZAR yoktu — sayfanin en tepesindeki akan serit, panel ne kadar
   canli olursa olsun hep 14.080/16.175 gosteriyordu. Diger kalemler
   (USD/TRY, altin, BTC) 1223-1233'te tazeleniyordu; bu ikisi unutulmus.
   Veri ZATEN ELDEYDI: m.end.XU100 ve m.end.XU030 (market.js END dizisi).
   Yazar tapeEndeksTazele() ile eklendi, canliEnjekte yanina baglandi. */
const tapeItems={'BIST 100':'14.080 ▼%0,09 (damgalı)','BIST 30':'16.175 ▼%0,49 (damgalı)'};
function updTape(){
  const order=['BIST 100','BIST 30','USD/TRY','EUR/TRY','GRAM ALTIN','BTC','EUR/USD','GBP/USD','USD/JPY'];
  const html=order.filter(k=>tapeItems[k]).map(k=>'<span>'+k+' <b>'+tapeItems[k]+'</b></span>').join('');
  if(html)$('tape').innerHTML=html+html;
}
/* §252p canlı endeksleri şeride yazar. m.end.XU100/XU030 zaten çekiliyor;
   burada yalnız biçimlendirilip tapeItems'a konuyor. Veri yoksa DOKUNMAZ —
   damgalı yedek yerinde kalır ve '(damgalı)' etiketiyle kendini söyler. */
function tapeEndeksTazele(){
  try{
    const e=(window.__market||{}).end||{};
    const yaz=(ad,kod)=>{
      const d=e[kod];
      if(!d||d.p==null||!isFinite(d.p))return false;
      const g=isFinite(d.chg)?d.chg:null;
      const ok=(g==null)?'':(g>=0?' ▲%':' ▼%')+trN(Math.abs(g),2);
      tapeItems[ad]=trN(d.p,0)+ok;
      return true;
    };
    const a=yaz('BIST 100','XU100'), b=yaz('BIST 30','XU030');
    if(a||b) updTape();
  }catch(e){}
}
updTape();
/* ---- Canlı ---- */
/* ---- Küresel endeksler (canlı, /api/market) ---- */
const KURESEL_A=[["sp500","S&P 500","ABD",1],["nasdaq","Nasdaq","ABD",1],["dow","Dow Jones","ABD",1],["russell","Russell 2000","ABD",0],["dax","DAX","DE",1],["eustoxx","Euro Stoxx 50","EU",0],["ftse","FTSE 100","UK",0],["cac","CAC 40","FR",0],["ftsemib","FTSE MIB","IT",0],["ibex","IBEX 35","ES",0]];
const KURESEL_B=[["nikkei","Nikkei 225","JP",1],["kospi","KOSPI","KR",1],["hangseng","Hang Seng","HK",0],["shanghai","Shanghai","CN",0],["asx","ASX 200","AU",0],["taiwan","Taiwan","TW",0],["nifty","Nifty 50","IN",0],["kosdaq","KOSDAQ","KR",0],["xu100","BIST 100","TR",1]];
function renderKuresel(){
  const m=window.__market; if(!m)return;
  const satir=(arr)=>arr.map(([k,ad,b,bold])=>{
    const nm=(bold?"<b>"+ad+"</b>":ad)+' <span style="color:var(--muted);font-size:9px">'+b+"</span>";
    const d=m[k];
    if(!d||d.p==null)return "<tr><td>"+nm+'</td><td class="num">—</td><td class="num">—</td></tr>';
    const s=d.chg>=0?"+":"",cls=d.chg>=0?"up":"down";
    return "<tr><td>"+nm+'</td><td class="num">'+trN(d.p,2)+'</td><td class="num '+cls+'">'+s+trN(d.chg,2)+"</td></tr>";
  }).join("");
  if($("kuresel1"))$("kuresel1").innerHTML=satir(KURESEL_A);
  if($("kuresel2"))$("kuresel2").innerHTML=satir(KURESEL_B);
}
/* ---- Emtia sekmesi (canlı, /api/market · Yahoo =F vadeli sözleşmeler) ---- */
const EMTIA=[
  ['brent','Brent Petrol','$/varil','Enerji','Türkiye net enerji ithalatçısı — yükseliş cari açığı ve TL baskısını artırır, TÜFE\'ye geçer'],
  ['wti','WTI Petrol','$/varil','Enerji','ABD referans ham petrol; Brent ile makası küresel arz-talep sinyali'],
  ['dogalgaz','Doğalgaz','$/MMBtu','Enerji','Henry Hub; ısınma/elektrik girdisi, BOTAŞ maliyeti ve enflasyon kanalı'],
  ['benzin','Benzin','$/galon','Enerji','Rafineri marjı (crack spread) — TUPRS kârlılığının göstergesi'],
  ['isilyag','Isıtma Yağı','$/galon','Enerji','Distilat talebi; sanayi ve ulaşım aktivite sinyali'],
  ['altin','Altın','$/ons','Değerli Metal','Güvenli liman + kuyumcu/perakende (kart harcamasında korunma kalemi); reel faize ters'],
  ['gumus','Gümüş','$/ons','Değerli Metal','Hem değerli metal hem sanayi girdisi (panel, elektronik); altından oynak'],
  ['platin','Platin','$/ons','Değerli Metal','Otomotiv katalizör; sanayi talebi göstergesi'],
  ['paladyum','Paladyum','$/ons','Değerli Metal','Benzinli motor katalizörü; arz Rusya yoğunluklu, jeopolitik duyarlı'],
  ['bakir','Bakır','$/lb','Sanayi Metali','"Dr. Copper" — küresel büyüme barometresi; inşaat ve sanayi talebi'],
  ['bugday','Buğday','$/kile','Tahıl','Gıda enflasyonu; un/ekmek zinciri, Türkiye önemli ithalatçı'],
  ['misir','Mısır','$/kile','Tahıl','Yem girdisi → kanatlı/kırmızı et fiyatları; gıda TÜFE kanalı'],
  ['soya','Soya','$/kile','Tahıl','Yem ve yağ girdisi; küresel tarım fiyat trendi'],
  ['pamuk','Pamuk','$/lb','Yumuşak Emtia','Tekstil girdisi — Türkiye ihracatçısı; KOTON/YUNSA gibi hisselere etki'],
  ['seker','Şeker','$/lb','Yumuşak Emtia','Gıda/içecek girdisi; şeker fiyat rejimi'],
  ['kahve','Kahve','$/lb','Yumuşak Emtia','Küresel talep + iklim; perakende gıda maliyeti'],
  ['kakao','Kakao','$/mt','Yumuşak Emtia','Çikolata/gıda girdisi; arz Batı Afrika yoğunluklu, iklim şoklarına açık']
];
const EMTIA_GRUP=['Enerji','Değerli Metal','Sanayi Metali','Tahıl','Yumuşak Emtia'];

/* ---- Asya-Pasifik: Yahoo endeksleri + Twelve Data forex ---- */
let ASYA_FOREX=null;

/* ---- ABD sekmesi: canlı endeksler (Yahoo) + FRED tahvil ---- */
let US_YUKLENDI=false;

/* ---- Avrupa sekmesi: canlı endeksler (Yahoo) ---- */

/* ---- ECB doğrudan tarayıcıdan (sunucu ağı ECB'ye ulaşamadığında yedek) ---- */
async function ecbTarayiciCek(){
  const cek = async (flow, key, n)=>{
    try{
      const bol=(satir)=>{                       // tırnak-duyarlı CSV bölücü
        const c=[]; let g='', tirnak=false;
        for(let i=0;i<satir.length;i++){ const ch=satir[i];
          if(ch==='"'){ tirnak=!tirnak; continue; }
          if(ch===','&&!tirnak){ c.push(g); g=''; continue; }
          g+=ch; }
        c.push(g); return c; };
      const dene=async(ek)=>{
        const u='https://data-api.ecb.europa.eu/service/data/'+flow+'/'+key+'?lastNObservations='+n+'&format=csvdata'+ek;
        let r=await fetch(u,{headers:{'Accept':'text/csv'}});
        /* §246a HIZ SINIRI SAVUNMASI. Kullanıcı testi kanıtladı: SERV00/FOOD00
           tarayıcıdan TEK istekle DOLU dönüyor — anahtarlar doğruydu. Panelin
           boş göstermesinin sebebi anahtar değil EŞZAMANLILIK: sekme açılışta
           ECB'ye 15+ isteği aynı anda atıyordu; ilk gelenler doluyor, kalanlar
           429'a takılıp buradaki `if(!r.ok) return null` ile SESSİZCE yutuluyordu.
           Sessiz catch dersinin HTTP hali. İki önlem: 429/5xx'te ~1sn bekleyip
           BİR kez daha dene; yine olmazsa durumu EBU_ECB_TANI'ya yaz — kartın
           tanı satırı artık 'boş' yerine 'HTTP 429' gösterir. */
        if(r.status===429||r.status>=500){
          await new Promise(z=>setTimeout(z,900+Math.random()*700));
          r=await fetch(u,{headers:{'Accept':'text/csv'}});
        }
        if(flow==='IRS'&&!r.ok){ window.EBU_IRS_TANI=(window.EBU_IRS_TANI||'')+key.split('.')[1]+':HTTP'+r.status+' '; }
        if(!r.ok){ window.EBU_ECB_TANI=window.EBU_ECB_TANI||{};
                   window.EBU_ECB_TANI[flow+'.'+key.split('.')[3]]='HTTP '+r.status; return null; }
        const t=await r.text();
        const sat=t.split(/\r?\n/).filter(x=>x.trim());
        if(sat.length<2) return null;
        const h=bol(sat[0]), it=h.indexOf('TIME_PERIOD'), iv=h.indexOf('OBS_VALUE');
        if(it<0||iv<0){ if(flow==='IRS') window.EBU_IRS_TANI=(window.EBU_IRS_TANI||'')+'kolon-yok '; return null; }
        const seri=[];
        for(let i=1;i<sat.length;i++){ const p=bol(sat[i]);
          if(p.length>iv){ const v=parseFloat(p[iv]); if(!isNaN(v)&&p[it]) seri.push([p[it],v]); } }
        return seri.length?seri:null; };
      const deneTarih=async(ek)=>{
        const u='https://data-api.ecb.europa.eu/service/data/'+flow+'/'+key+'?format=csvdata'+ek;
        const r=await fetch(u,{headers:{'Accept':'text/csv'}});
        if(!r.ok) return null;
        const t=await r.text();
        const sat=t.split(/\r?\n/).filter(x=>x.trim());
        if(sat.length<2) return null;
        const h=bol(sat[0]), it=h.indexOf('TIME_PERIOD'), iv=h.indexOf('OBS_VALUE');
        if(it<0||iv<0) return null;
        const seri=[];
        for(let i=1;i<sat.length;i++){ const p=bol(sat[i]);
          if(p.length>iv){ const v=parseFloat(p[iv]); if(!isNaN(v)&&p[it]) seri.push([p[it],v]); } }
        seri.sort((x,y)=>x[0]<y[0]?-1:1);
        return seri.length?seri.slice(-3):null; };
      const yil=new Date().getFullYear()-1;
      const a1=await dene('&detail=dataonly'); if(a1) return a1;
      const a2=await dene(''); if(a2) return a2;
      const a3=await deneTarih('&startPeriod='+yil+'-01');
      if(!a3&&flow==='IRS'){ window.EBU_IRS_TANI=(window.EBU_IRS_TANI||'')+key.split('.')[1]+':boş '; }
      return a3;
    }catch(e){ return null; }
  };
  const sonFark=(seri)=>{ if(!seri||!seri.length)return null;
    const s=seri[seri.length-1], o=seri.length>1?seri[seri.length-2]:null;
    return { deger:s[1], tarih:s[0], fark:o?+(s[1]-o[1]).toFixed(2):null }; };
  const hicp = async (item)=>{
    /* §245u AKIŞ İKİNCİ KEZ TAŞINDI — bu sefer TERS YÖNE.
       Tarihçe: §104'te 'HICP' 404 veriyordu, doğru akış 'ICP' çıktı (o gün
       için DOĞRUYDU). Sonra ECB 4 Şubat 2026'da Eurostat metodoloji değişimiyle
       ICP setini KALDIRDI ve yerine YENİ HICP setini koydu (DSD ECB_ICP3).
       Ölü ICP akışı tarihsel veriyi dondurulmuş döndürmeye devam etti —
       bu yüzden manşet/çekirdek/enerji '2025-12' ile 7 AY bayat görünüyordu
       ve hata da yoktu: akış ölmemişti, DONMUŞTU. Donan akış, ölen akıştan
       sinsi: 404 vermez, sadece eskir.
       YENİ ANAHTAR: sağlayıcı boyutu '4' → '4D0' (Eurostat'ın yeni kodu).
       Doğrulama: HICP.M.U2.N.000000.4D0.ANR ve NRGY00.4D0.ANR portalda canlı
       (son güncelleme 17 Haz 2026). Kalem kodları AYNI (000000/XEF000/NRGY00/
       FOOD00/SERV00/IGXE00) — yalnız akış adı ve sağlayıcı değişti.
       DERS: 'doğru akış' tespitleri TARİHLİDİR; kaynak kurumlar akış adını
       değiştirir. Donmuş seri şüphesinde ilk soru: 'bu dataset hâlâ yaşıyor mu?' */
    const y=await cek('HICP','M.U2.N.'+item+'.4D0.ANR',3);
    if(y) return {...sonFark(y), akis:'HICP'};
    const eski=await cek('ICP','M.U2.N.'+item+'.4.ANR',3);   // yedek: dondurulmuş arşiv
    return eski?{...sonFark(eski), akis:'ICP-arşiv'}:null; };
  /* §245v KIRILIM İÇİN ÇOK-ANAHTARLI ÇEKİM + TANI.
     Hizmet/Gıda/Sanayi §242'de eklendiğinden beri HİÇ dolmadı — eski ICP'de
     bu kalemler yokmuş; akış taşınınca da (245u) kendiliğinden dolmadılar.
     İki taşıma da 'anahtar tahmini' ile yapıldı ve ikisinde de kırılım
     kör kaldı. Bu kez iki ilke: (1) kalem başına ALTERNATİF kod listesi —
     portal kanıtı: gıda yeni sette FOODPR (işlenmiş+alkol+tütün) ve FOODUN
     (işlenmemiş) olarak bölünmüş, toplam FOOD00 görünmüyor; SERV00/IGXE00
     tanımları duruyor. (2) TAHMİNİ BIRAK, ÖLÇTÜR: her deneme sonucu
     window.EBU_HICP_TANI'ya yazılır ve kırılım boşsa kart tanıyı GÖSTERİR —
     bir sonraki ekran görüntüsü tahmin değil kanıt taşır. */
  window.EBU_HICP_TANI = {};
  /* §246d KÖKTEN ÇÖZÜM: TEK İSTEKTE ÇOK SERİ. Kırılım iki turdur boş ve
     tanı bile ekrana düşmeden kayboluyordu — istek sayısını azaltmak yerine
     SIFIRA yakına indiriyoruz. SDMX anahtar sözdizimi '+' ile OR destekler:
     M.U2.N.000000+XEF000+NRGY00+FOOD00+SERV00+IGXE00.4D0.ANR = 6 seri,
     TEK istek. Hız sınırına çarpacak kalabalık kalmıyor. CSV zaten her
     satırda ICP_ITEM/REF_AREA taşıyor — grupla, dağıt. */
  const cokluCek = async (flow, key, n, grupKolon)=>{
    try{
      const u='https://data-api.ecb.europa.eu/service/data/'+flow+'/'+key+'?lastNObservations='+n+'&format=csvdata';
      let r=await fetch(u,{headers:{'Accept':'text/csv'}});
      if(r.status===429||r.status>=500){ await new Promise(z=>setTimeout(z,900)); r=await fetch(u,{headers:{'Accept':'text/csv'}}); }
      if(!r.ok){ window.EBU_ECB_TANI=window.EBU_ECB_TANI||{}; window.EBU_ECB_TANI[flow+'(çoklu)']='HTTP '+r.status; return {}; }
      const t=await r.text();
      const sat=t.split(/\r?\n/).filter(x=>x.trim());
      if(sat.length<2) return {};
      const bol=(l)=>{const c=[];let g='',q=false;for(const ch of l){if(ch==='"'){q=!q;continue;}if(ch===','&&!q){c.push(g);g='';continue;}g+=ch;}c.push(g);return c;};
      const h=bol(sat[0]), it=h.indexOf('TIME_PERIOD'), iv=h.indexOf('OBS_VALUE'), ig=h.indexOf(grupKolon);
      if(it<0||iv<0||ig<0) return {};
      const G={};
      for(let i=1;i<sat.length;i++){ const p=bol(sat[i]);
        if(p.length>Math.max(it,iv,ig)){ const v=parseFloat(p[iv]);
          if(!isNaN(v)&&p[it]){ (G[p[ig]]=G[p[ig]]||[]).push([p[it],v]); } } }
      Object.keys(G).forEach(k=>G[k].sort((a,b)=>a[0]<b[0]?-1:1));
      return G;
    }catch(e){ window.EBU_ECB_TANI=window.EBU_ECB_TANI||{}; window.EBU_ECB_TANI[flow+'(çoklu)']='ağ: '+String(e).slice(0,60); return {}; }
  };
  const hicpCoklu = async (adaylar, etiketler)=>{
    for(let i=0;i<adaylar.length;i++){
      const kod=adaylar[i];
      const y=await cek('HICP','M.U2.N.'+kod+'.4D0.ANR',3);
      if(y){ window.EBU_HICP_TANI[kod]='✓';
             const r={...sonFark(y), akis:'HICP'};
             if(etiketler&&etiketler[i]) r.altEtiket=etiketler[i];
             return r; }
      window.EBU_HICP_TANI[kod]='boş';
    }
    return null; };
  /* §242 ENFLASYON KIRILIMI. Önce üç seri vardı (manşet·çekirdek·enerji) ve
     ECB faiz kartının İÇİNE sıkıştırılmıştı. Enflasyon ECB'nin tek görevi;
     kendi kartını hak ediyor ve kırılım olmadan okunmuyor.
     EKLENENLER:
       · GIDA + HİZMET + SANAYİ MALI — ECB'nin baktığı asıl ayrım
         Hizmet ücretlere bağlı, EN YAPIŞKAN kalem: manşet hedefe inse bile
         hizmet %3'ün üstündeyse indirim gecikir.
       · DÖRT ÜLKE (DE·FR·IT·ES) — parçalanma riski
         Tek para politikası, enflasyonlar ayrıştıkça herkese aynı gelmez.
     ICP akışında ülke kodu U2 yerine ISO2 ile değişiyor: M.<ülke>.N.<kalem>.4.ANR */
  const ulke = async (k)=>{ /* §245u: ülke serileri de yeni HICP+4D0 akışında */
    const y=await cek('HICP','M.'+k+'.N.000000.4D0.ANR',3);
    if(y) return sonFark(y);
    const e=await cek('ICP','M.'+k+'.N.000000.4.ANR',3); return e?sonFark(e):null; };
  /* §246a İKİ DALGA: 15+ eşzamanlı istek ECB hız sınırına çarpıyordu.
     Dalga 1 = kart omurgası (8 istek), kısa nefes, Dalga 2 = kırılım+ülkeler.
     hicpCoklu kendi içinde zaten sıralı; anlık istek sayısı ≤8 kalır. */
  const [dfr,bilanco,manset,cekirdek,enerji,bund,btp,oat]=await Promise.all([
    cek('FM','B.U2.EUR.4F.KR.DFR.LEV',3), cek('ILM','W.U2.C.T000000.Z5.Z01',6),
    hicp('000000'), hicp('XEF000'), hicp('NRGY00'),
    cek('IRS','M.DE.L.L40.CI.0000.EUR.N.Z',3), cek('IRS','M.IT.L.L40.CI.0000.EUR.N.Z',3), cek('IRS','M.FR.L.L40.CI.0000.EUR.N.Z',3)
  ]);
  await new Promise(z=>setTimeout(z,300));
  /* §246d: kırılım 3 + ülke 4 = eskiden 7-13 istek; şimdi 2. */
  const kal=(G,kod)=>{ const s=G[kod];
    window.EBU_HICP_TANI[kod]=s&&s.length?'✓':'boş';
    if(!s||!s.length) return null;
    const x=sonFark(s); return x?{...x, akis:'HICP'}:null; };
  const [KIR, ULK]=await Promise.all([
    cokluCek('HICP','M.U2.N.FOOD00+SERV00+IGXE00.4D0.ANR',3,'ICP_ITEM'),
    cokluCek('HICP','M.DE+FR+IT+ES.N.000000.4D0.ANR',3,'REF_AREA')
  ]);
  const gida=kal(KIR,'FOOD00'), hizmet=kal(KIR,'SERV00'), sanayi=kal(KIR,'IGXE00');
  const uK=(k)=>{ const x=ULK[k]&&ULK[k].length?sonFark(ULK[k]):null; return x||null; };
  const de=uK('DE'), fr=uK('FR'), it=uK('IT'), es=uK('ES');
  const S={};
  if(dfr){ const x=sonFark(dfr); if(x) S.dfr=x; }
  if(bilanco){ const x=sonFark(bilanco);
    if(x){ x.zirveMlr=8836; x.mlr=+(x.deger/1000).toFixed(0); x.qtMlr=+(8836-x.deger/1000).toFixed(0); S.bilanco=x; } }
  if(manset) S.hicpManset=manset;
  if(cekirdek) S.hicpCekirdek=cekirdek;
  if(enerji) S.hicpEnerji=enerji;
  if(gida)   S.hicpGida=gida;
  if(hizmet) S.hicpHizmet=hizmet;
  if(sanayi) S.hicpSanayi=sanayi;
  S.ulkeler={};
  if(de) S.ulkeler.DE=de; if(fr) S.ulkeler.FR=fr;
  if(it) S.ulkeler.IT=it; if(es) S.ulkeler.ES=es;
  const t10=(seri)=>{ const x=sonFark(seri); return x||null; };
  if(bund) S.bund10=t10(bund);
  if(btp)  S.btp10 =t10(btp);
  if(oat)  S.oat10 =t10(oat);
  if(S.bund10&&S.btp10) S.btpSpread=+((S.btp10.deger-S.bund10.deger)*100).toFixed(0);
  if(S.bund10&&S.oat10) S.oatSpread=+((S.oat10.deger-S.bund10.deger)*100).toFixed(0);
  return Object.keys(S).length?S:null;
}

async function avrupaSekme(){
  const el=$('avEndeksBody'); if(!el)return;
  try{
    /* §240 VERİ DOSYALARINDA ÖNBELLEK KAPALI.
       "Dosyayı yükledim ama panel eskiyi gösteriyor" bugün DEFALARCA yaşandı.
       Sebep: JSON veri dosyaları ?v= etiketi taşımıyor (js/css gibi) ve
       tarayıcı eskisini saklıyordu. 22 çekimden YALNIZ BİRİNDE no-store vardı.
       Bir veri dosyası TAZELENMEK için var; önbelleğe alınması amacına aykırı.
       Vercel CDN'i zaten s-maxage ile yönetiyor, istemci önbelleği gereksiz.
       ARTIK HEPSİNDE {cache:'no-store'} — deploy eder etmez görünür. */
    const r=await fetch('/api/market');
    if(!r.ok){el.innerHTML='<div class="sub">Endeks verisi alınamadı.</div>';return;}
    const j=await r.json();
    const d=(j&&j.data)||{};
    const LISTE=[['dax','DAX','Almanya · sanayi/ihracat'],['eustoxx','Euro Stoxx 50','bölge geneli'],['ftse','FTSE 100','UK · emtia+finans'],['cac','CAC 40','Fransa · lüks/tüketim'],['ftsemib','FTSE MIB','İtalya · spread duyarlı'],['ibex','IBEX 35','İspanya']];
    let hh='<table class="tbl"><thead><tr><th>Endeks</th><th class="num">Puan</th><th class="num">Gün %</th></tr></thead><tbody>';
    let var_mi=false;
    LISTE.forEach(([k,ad,not_])=>{
      const v=d[k];
      if(v&&v.p!=null){
        var_mi=true;
        const dg=v.chg!=null?+v.chg:null;
        const cls=dg==null?'':(dg>=0?'up':'down'), sgn=dg!=null&&dg>=0?'+':'';
        hh+='<tr><td><b>'+ad+'</b> <span style="color:var(--muted);font-size:9px">'+not_+'</span></td>'+
          '<td class="num" style="font-weight:600">'+trN(v.p,0)+'</td>'+
          '<td class="num '+cls+'">'+(dg!=null?(sgn+trN(dg,2)+'%'):'—')+'</td></tr>';
      }
    });
    hh+='</tbody></table>';
    el.innerHTML = var_mi?hh:'<div class="sub">Endeks verisi alınamadı.</div>';
  }catch(e){ el.innerHTML='<div class="sub">Endeks hatası.</div>'; }
  // ---- ECB canlı: faiz + enflasyon + bilanço ----
  try{
    const r2=await fetch('/api/market?mod=ecb');
    const d2=r2.ok?await r2.json():null;
    let S=(d2&&d2.ok&&d2.seriler)||null;
    if(!S||!Object.keys(S).length){ S=await ecbTarayiciCek(); }   // sunucu ulaşamadıysa doğrudan ECB
    // Tahvil bacağı: ECB'den gelmediyse SUNUCU üzerinden FRED (OECD 10Y serileri) ile doldur
    if(!S || !S.bund10){
      if(!S) S={};
      try{
        const rf=await fetch('/api/market?mod=fred');
        const df=rf.ok?await rf.json():null;
        const F=(df&&df.seriler)||{};
        const al=(id)=>{ const x=F[id]; return (x&&x.deger!=null)?{ deger:+x.deger, tarih:x.tarih||'', fark:(x.fark!=null?+x.fark:null) }:null; };
        const de=al('IRLTLT01DEM156N'), it=al('IRLTLT01ITM156N'), fr=al('IRLTLT01FRM156N');
        if(de){ S.bund10=de; S.kaynakTahvil='FRED · OECD 10Y (aylık)'; }
        if(it) S.btp10=it;
        if(fr) S.oat10=fr;
        if(S.bund10&&S.btp10) S.btpSpread=+((S.btp10.deger-S.bund10.deger)*100).toFixed(0);
        if(S.bund10&&S.oat10) S.oatSpread=+((S.oat10.deger-S.bund10.deger)*100).toFixed(0);
      }catch(e){}
    }
    if($('avEcbBody')){
      if(!S){ $('avEcbBody').innerHTML='<div class="sub">ECB: '+(d2&&d2.err?d2.err:'veri alınamadı')+'</div>'; }
      else{
        let hh='';
        if(S.dfr){
          hh+='<div class="kv"><span class="k">Mevduat faizi (DFR) — politika çıpası</span><span style="font-weight:600">%'+trN(S.dfr.deger,2)+
            (S.dfr.fark!=null?' <span class="'+(S.dfr.fark>0?'down':'up')+'" style="font-size:10px">(son adım '+(S.dfr.fark>0?'+':'')+trN(S.dfr.fark,2)+')</span>':'')+
            ' <span style="color:var(--muted);font-size:9px">'+S.dfr.tarih+'</span></span></div>';
        }
        const enfSatir=(v,ad,vurgu)=>{
          if(!v)return '';
          const f=v.fark, cls=f==null?'':(f>0?'down':'up');
          return '<div class="kv"><span class="k">'+ad+'</span><span'+(vurgu?' style="font-weight:600"':'')+'>%'+trN(v.deger,1)+
            (f!=null?' <span class="'+cls+'" style="font-size:10px">(ivme '+(f>=0?'+':'')+trN(f,2)+')</span>':'')+
            ' <span style="color:var(--muted);font-size:9px">'+v.tarih+(v.akis&&v.akis.indexOf('eski')>=0?' ⚠eski seri':'')+'</span></span></div>';
        };
        hh+=enfSatir(S.hicpManset,'HICP manşet (yıllık)',true);
        hh+=enfSatir(S.hicpCekirdek,'HICP çekirdek (enerji+gıda hariç)',false);
        hh+=enfSatir(S.hicpEnerji,'HICP enerji — Brent geçişkenliği',true);
        $('avEcbBody').innerHTML=hh||'<div class="sub">ECB serileri boş.</div>';
      }
    }
    if($('avBilancoBody')){
      if(!(S&&S.bilanco)){ $('avBilancoBody').innerHTML='<div class="sub">Bilanço verisi alınamadı.</div>'; }
      else{
        const b=S.bilanco; let bh='';
        bh+='<div class="kv"><span class="k">Toplam varlıklar</span><span style="font-weight:600">'+trN(b.mlr,0)+' mlr € <span class="'+(b.fark<0?'up':'down')+'" style="font-size:10px">('+(b.fark>0?'+':'')+trN(b.fark/1000,0)+' hf)</span> <span style="color:var(--muted);font-size:9px">'+b.tarih+'</span></span></div>';
        bh+='<div class="kv"><span class="k">Zirveden bugüne (toplam QT)</span><span class="up" style="font-weight:600">−'+trN(b.qtMlr,0)+' mlr € <span style="color:var(--muted);font-size:9px">zirve ≈8.836 · Haz 2022</span></span></div>';
        bh+='<div class="kv"><span class="k">Küçülme oranı</span><span>%'+trN(b.qtMlr/8836*100,0)+' — zirvenin üçte biri eridi</span></div>';
        $('avBilancoBody').innerHTML=bh;
      }
    }
    /* §242b ENFLASYON KARTI — kendi kutusunda, kırılımlı.
       ECB'nin tek yasal görevi fiyat istikrarı; enflasyon üç satırla faiz
       kartının içine sıkışamaz.
       SIRA ÖNEMLİ: manşet → çekirdek → hizmet. ECB toplantı metinlerinde
       bu sırayla okur; hizmet en yapışkan olduğu için son sözü o söyler. */
    if($('avEnfBody')){
      /* §246e SUNUCU TAMAMLAMASI: client'ın ECB çekimi hangi sebeple boş
         kalırsa kalsın (CORS, engelleyici, hız sınırı), sunucunun (d2)
         çektiği seriler eksik alanları doldurur. Kırılımın güvenilir yolu
         artık Vercel; client çekimi yedeğe düştü. */
      if(d2&&d2.seriler){ ['hicpManset','hicpCekirdek','hicpEnerji','hicpGida','hicpHizmet','hicpSanayi']
        .forEach(k=>{ if(!S[k]&&d2.seriler[k]) S[k]=d2.seriler[k]; }); }
      if(!S || !S.hicpManset){
        $('avEnfBody').innerHTML='<div class="sub">HICP serisi alınamadı'+
          (d2&&d2.err?' — '+esc(String(d2.err)):'')+'. ECB Data Portal yanıt vermiyor olabilir.</div>';
      } else {
        const HEDEF=2.0;
        const sat=(v,ad,not_,vurgu)=>{
          if(!v) return '<div class="kv"><span class="k">'+ad+'</span><span class="thin">—</span></div>';
          const f=v.fark, ivmeCls=f==null?'':(f>0?'down':'up');
          const uzak=v.deger-HEDEF;
          const dCls=uzak>1?'down':(uzak<-0.5?'up':'');
          const notF=v.altEtiket?(v.altEtiket+(not_?' · '+not_:'')):not_;   /* §245v: alternatif kodla dolduysa söyle */
          return '<div class="kv"><span class="k">'+ad+
            (notF?' <span class="thin" style="font-size:9px">'+notF+'</span>':'')+'</span>'+
            '<span'+(vurgu?' style="font-weight:600"':'')+'>%'+trN(v.deger,1)+
            ' <span class="'+dCls+'" style="font-size:10px">('+(uzak>=0?'+':'')+trN(uzak,1)+' hedefe)</span>'+
            (f!=null?' <span class="'+ivmeCls+'" style="font-size:10px">ivme '+(f>=0?'+':'')+trN(f,2)+'</span>':'')+
            ' <span style="color:var(--muted);font-size:9px">'+esc(v.tarih||'')+'</span></span></div>';
        };
        let eh='';
        eh+=sat(S.hicpManset,'<b>Manşet</b>','ECB hedefi %2',true);
        eh+=sat(S.hicpCekirdek,'<b>Çekirdek</b>','enerji+gıda hariç · ECB\'nin kontrol alanı',true);
        eh+=sat(S.hicpHizmet,'<b>Hizmet</b>','ücretlere bağlı · EN YAPIŞKAN',true);
        eh+='<div style="height:6px"></div>';
        eh+=sat(S.hicpEnerji,'Enerji','Brent geçişkenliği',false);
        eh+=sat(S.hicpGida,'Gıda','işlenmiş+işlenmemiş',false);
        eh+=sat(S.hicpSanayi,'Sanayi malı','enerji dışı · küresel arz zinciri',false);
        /* §245v TANI GÖRÜNÜR: kırılımdan biri boşsa hangi anahtarların denenip
           boş döndüğünü kartın kendisi söyler — bir sonraki hata bildirimi
           tahmin değil kanıt taşısın. Doluysa satır hiç görünmez. */
        if(!S.hicpHizmet||!S.hicpGida||!S.hicpSanayi){
          const T=window.EBU_HICP_TANI||{};
          const H=window.EBU_ECB_TANI||{};
          const boslar=Object.keys(T).filter(k=>T[k]!=='✓')
            .map(k=>k+(H['HICP.'+k]?' ('+H['HICP.'+k]+')':''));   /* §246a: sebep de görünsün */
          if(boslar.length) eh+='<div class="thin" style="font-size:8px;margin-top:3px;color:var(--muted)">kırılım tanısı — boş dönen anahtarlar: '+boslar.join(' · ')+' <span style="opacity:.7">(4D0.ANR)</span></div>';
        }
        /* ÜLKE KIRILIMI — parçalanma termometresi */
        const U=S.ulkeler||{};
        const varOlan=Object.keys(U);
        if(varOlan.length>=2){
          const AD={DE:'Almanya',FR:'Fransa',IT:'İtalya',ES:'İspanya'};
          const degerler=varOlan.map(k=>U[k].deger);
          const makas=Math.max.apply(null,degerler)-Math.min.apply(null,degerler);
          eh+='<div style="height:8px"></div><div class="lbl" style="font-size:9px;margin-bottom:3px">ÜLKE KIRILIMI</div>';
          eh+=varOlan.sort((a,b)=>U[b].deger-U[a].deger).map(k=>{
            const v=U[k], uzak=v.deger-HEDEF;
            return '<div class="kv"><span class="k">'+AD[k]+'</span><span>%'+trN(v.deger,1)+
              ' <span class="'+(uzak>1?'down':(uzak<-0.5?'up':''))+'" style="font-size:10px">('+(uzak>=0?'+':'')+trN(uzak,1)+')</span></span></div>';
          }).join('');
          eh+='<div class="kv"><span class="k"><b>Ülkeler arası makas</b></span><span class="'+
            (makas>1.5?'down':'')+'" style="font-weight:600">'+trN(makas,1)+' puan '+
            '<span class="thin" style="font-size:9px">'+(makas>1.5?'· ayrışma belirgin':'· dengeli')+'</span></span></div>';
        }
        /* OKUMA — kural tabanlı, tek cümle */
        const M=S.hicpManset, C=S.hicpCekirdek, H=S.hicpHizmet;
        const oku=[];
        if(M&&C&&M.deger<C.deger)
          oku.push('Manşet çekirdeğin ALTINDA — düşüşü enerji/gıda taşıyor, <b>kalıcı değil</b>. Baz etkisi tersine dönerse manşet geri yükselir.');
        if(H&&H.deger>3)
          oku.push('Hizmet %'+trN(H.deger,1)+' ile hâlâ yüksek — ücret baskısı sürüyor, <b>indirim alanı dar</b>.');
        if(C&&Math.abs(C.deger-HEDEF)<0.4)
          oku.push('Çekirdek hedefe yapışmış — ECB için <b>rahatlama sinyali</b>.');
        if(oku.length) eh+='<div class="note" style="margin-top:8px;font-size:10.5px">'+oku.join(' ')+'</div>';
        $('avEnfBody').innerHTML=eh;
      }
    }
    if($('avTahvilBody')){
      if(!(S&&(S.bund10||S.btp10))){ $('avTahvilBody').innerHTML='<div class="sub">Tahvil verisi alınamadı'+(window.EBU_IRS_TANI?' — tanı: '+window.EBU_IRS_TANI:'')+'</div>'; }
      else{
        let th='';
        const tSatir=(v,ad,vurgu)=>{
          if(!v)return '';
          return '<div class="kv"><span class="k">'+ad+'</span><span'+(vurgu?' style="font-weight:600"':'')+'>%'+trN(v.deger,2)+
            (v.fark!=null?' <span class="'+(v.fark>0?'down':'up')+'" style="font-size:10px">('+(v.fark>=0?'+':'')+trN(v.fark,2)+' ay)</span>':'')+
            ' <span style="color:var(--muted);font-size:9px">'+v.tarih+'</span></span></div>';
        };
        th+=tSatir(S.bund10,'Bund 10Y — Avrupa risksiz çıpası',true);
        th+=tSatir(S.btp10,'İtalya (BTP) 10Y',false);
        th+=tSatir(S.oat10,'Fransa (OAT) 10Y',false);
        if(S.btpSpread!=null){
          const sp=S.btpSpread, cls=sp>250?'down':(sp>150?'down':'up');
          const yorum=sp>250?'STRES (2011: 500+)':(sp>150?'gergin':'sakin');
          th+='<div class="kv"><span class="k">BTP–Bund spread — parçalanma termometresi</span><span class="'+cls+'" style="font-weight:600">'+sp+'bp <span style="font-size:10px">'+yorum+'</span></span></div>';
        }
        if(S.oatSpread!=null)
          th+='<div class="kv"><span class="k">OAT–Bund spread — Fransa risk primi</span><span'+(S.oatSpread>80?' class="down"':'')+'>'+S.oatSpread+'bp</span></div>';
        $('avTahvilBody').innerHTML=th||'<div class="sub">Tahvil serileri boş.</div>';
      }
    }
  }catch(e){ if($('avEcbBody'))$('avEcbBody').innerHTML='<div class="sub">ECB hatası: '+String(e).slice(0,60)+'</div>'; }
}

async function abdSekme(){
  console.log('[KTPanel] abdSekme ('+KTP_SURUM+')');   /* fosil v=20260726b imzasi temizlendi */
  if(!$('usEndeksBody')){console.log('[KTPanel] usEndeksBody bulunamadı');return;}
  // ENDEKSLER — Yahoo (mevcut market API'sinden, ABD anahtarları)
  try{
    const r=await fetch('/api/market');
    if(r.ok){
      const j=await r.json();
      const d=(j&&j.data)||{};
      const LISTE=[['sp500','S&P 500','genel iştah'],['nasdaq','Nasdaq','AI/teknoloji'],['dow','Dow Jones','sanayi'],['russell','Russell 2000','küçük şirket · faiz duyarlı']];
      let hh='<table class="tbl"><thead><tr><th>Endeks</th><th class="num">Puan</th><th class="num">Gün %</th></tr></thead><tbody>';
      let var_mi=false;
      LISTE.forEach(([k,ad,not_])=>{
        const v=d[k];
        if(v&&v.p!=null){
          var_mi=true;
          const dg=v.chg!=null?+v.chg:null;
          const cls=dg==null?'':(dg>=0?'up':'down'), sgn=dg!=null&&dg>=0?'+':'';
          hh+='<tr><td><b>'+ad+'</b> <span style="color:var(--muted);font-size:9px">'+not_+'</span></td>'+
            '<td class="num" style="font-weight:600">'+trN(v.p,0)+'</td>'+
            '<td class="num '+cls+'">'+(dg!=null?(sgn+trN(dg,2)+'%'):'—')+'</td></tr>';
        }
      });
      hh+='</tbody></table>';
      $('usEndeksBody').innerHTML = var_mi?hh:'<div class="sub">Endeks verisi alınamadı.</div>';
    }
  }catch(e){$('usEndeksBody').innerHTML='<div class="sub">Endeks hatası.</div>';}
  // FRED — tahvil + enflasyon beklentisi
  try{
    const r=await fetch('/api/market?mod=fred');
    const d=r.ok?await r.json():null;
    if(d&&d.ok&&d.seriler&&Object.values(d.seriler).some(v=>v)&&$('usFredBody')){
        const S=d.seriler;
        window.US_FRED=S;   /* SS320: egri gorseli ayni veriyi OKUR - DOM kazimaz (SS304) */
        const satir=(id,ad,vurgu)=>{
          const v=S[id];
          if(!v)return '';
          const f=v.fark, cls=f==null?'':(f>0?'down':'up'), sgn=f!=null&&f>0?'+':'';
          // tahvil getirisinde yükseliş = hisse için negatif → down rengi (kırmızı) bilinçli
          return '<div class="kv"><span class="k">'+ad+'</span><span'+(vurgu?' style="font-weight:600"':'')+'>%'+trN(v.deger,2)+
            (f!=null?' <span class="'+cls+'" style="font-size:10px">('+sgn+trN(f,2)+')</span>':'')+
            ' <span style="color:var(--muted);font-size:9px">'+v.tarih+'</span></span></div>';
        };
        let fh='';
        fh+=satir('DGS2','2 yıllık — Fed beklentisi',false);
        fh+=satir('DGS5','5 yıllık',false);
        fh+=satir('DGS10','10 yıllık — küresel iskonto oranı',true);
        fh+=satir('DGS30','30 yıllık — maliye disiplini',false);
        // Eğim 10Y-2Y
        if(S.DGS10&&S.DGS2){
          const egim=((S.DGS10.deger-S.DGS2.deger)*100).toFixed(0);
          fh+='<div class="kv"><span class="k">Eğim (10Y − 2Y)</span><span>'+(egim>=0?'+':'')+egim+'bp '+(egim>=0?'· pozitif':'· TERS')+'</span></div>';
        }
        fh+=satir('T5YIE','5Y enflasyon beklentisi (breakeven)',true);
        fh+=satir('T10YIE','10Y enflasyon beklentisi',false);
        /* §174: POLİTİKA FAİZİ ÖNCE — Fed'in ilan ettiği hedef aralık.
           DFF (efektif) onun altında, farkıyla birlikte. TCMB tarafındaki
           "politika faizi vs AOFM" ayrımının ABD karşılığı. */
        if(S.DFEDTARL&&S.DFEDTARU){
          const alt=S.DFEDTARL.deger, ust=S.DFEDTARU.deger;
          const ef=S.DFF?S.DFF.deger:null;
          const orta=(alt+ust)/2;
          fh+='<div class="kv"><span class="k"><b>Politika faizi — hedef aralık</b> <span class="thin">(FOMC kararı)</span></span>'+
            '<span style="font-weight:700;color:var(--mm2)">%'+trN(alt,2)+' – %'+trN(ust,2)+
            ' <span style="color:var(--muted);font-size:9px">'+esc(S.DFEDTARU.tarih||'')+'</span></span></div>';
          if(ef!=null) fh+='<div class="kv"><span class="k">· efektif (DFF) — aralığın neresinde</span><span>%'+trN(ef,2)+
            ' <span class="thin" style="font-size:10px">('+(ef>orta?'orta üstü':ef<orta?'orta altı':'tam orta')+
            ' · '+((ef-alt)/(ust-alt)*100).toFixed(0)+'% konum)</span></span></div>';
        } else {
          fh+=satir('DFF','Fed funds (efektif, günlük)',false);
        }
        $('usFredBody').innerHTML = fh||'<div class="sub">FRED verisi boş.</div>';
        // ---- Risk & Finansal Koşullar kartı (aynı FRED yanıtından) ----
        if($('usRiskBody')){
          const rSatir=(id,ad,birim,ters,vurgu)=>{
            const v=S[id]; if(!v)return '';
            const f=v.fark;
            // ters=true: yükseliş kötü (kırmızı) — reel getiri, HY spread, dolar, işsizlik
            const cls=f==null?'':((f>0)===ters?'down':'up'); const sgn=f!=null&&f>0?'+':'';
            const deger = birim==='bp' ? trN(v.deger*100,0)+'bp'
                        : birim==='bin' ? trN(v.deger/1000,0)+' bin'
                        : birim==='%' ? '%'+trN(v.deger,2)
                        : trN(v.deger,birim==='puan1'?1:2);
            const farkStr = f!=null ? ' <span class="'+cls+'" style="font-size:10px">('+sgn+trN(birim==='bp'?f*100:(birim==='bin'?f/1000:f),birim==='bp'||birim==='bin'?0:2)+')</span>' : '';
            return '<div class="kv"><span class="k">'+ad+'</span><span'+(vurgu?' style="font-weight:600"':'')+'>'+deger+farkStr+' <span style="color:var(--muted);font-size:9px">'+v.tarih+'</span></span></div>';
          };
          let rh='';
          rh+=rSatir('DFII10','Reel getiri (10Y TIPS) — sermayenin gerçek fiyatı','%',true,true);
          rh+=rSatir('BAMLH0A0HYM2','HY kredi spread\'i — stres öncüsü','bp',true,true);
          rh+=rSatir('DTWEXBGS','Dolar endeksi (geniş) — EM fonlama','puan1',true,false);
          rh+=rSatir('VIXCLS','VIX — risk iştahı','puan1',true,false);
          rh+=rSatir('ICSA','Haftalık işsizlik başvurusu','bin',true,false);
          rh+=rSatir('UNRATE','İşsizlik oranı (aylık)','%',true,false);
          $('usRiskBody').innerHTML = rh||'<div class="sub">Risk serileri boş.</div>';
        }
        // ---- Enflasyon kırılımı (yıllık %, ivmeli) ----
        if($('usEnfBody')){
          const eSatir=(id,ad,vurgu)=>{
            const v=S[id]; if(!v)return '';
            const f=v.fark; // ivme: pozitif = hızlanıyor = kötü = kırmızı
            const cls=f==null?'':(f>0?'down':'up'); const sgn=f!=null&&f>0?'+':'';
            return '<div class="kv"><span class="k">'+ad+'</span><span'+(vurgu?' style="font-weight:600"':'')+'>%'+trN(v.deger,1)+
              (f!=null?' <span class="'+cls+'" style="font-size:10px">(ivme '+sgn+trN(f,2)+')</span>':'')+
              ' <span style="color:var(--muted);font-size:9px">'+v.tarih.slice(0,7)+'</span></span></div>';
          };
          let eh='';
          eh+=eSatir('CPIAUCNS','Manşet TÜFE',true);
          eh+=eSatir('CPILFENS','Çekirdek TÜFE (gıda+enerji hariç)',false);
          eh+=eSatir('CPIENGSL','Enerji kalemi — Brent geçişkenliği',true);
          eh+=eSatir('CUSR0000SAH1','Barınma/kira — yapışkanlık',false);
          eh+=eSatir('CUSR0000SASLE','Hizmet (enerji hariç)',false);
          eh+=eSatir('PCEPILFE','Çekirdek PCE — Fed\'in resmi pusulası',true);
          $('usEnfBody').innerHTML = eh||'<div class="sub">Enflasyon serileri boş.</div>';
          /* §280 GSYH KARTLARI. ABD manşeti çeyreklik YILLIKLANDIRILMIŞ (SAAR),
             Avrupa'nınki YILLIK — ikisi aynı şey DEĞİL ve etiketleri öyle yazılı.
             Aynı karta koyup "büyüme" demek, iki farklı ölçüyü karıştırmak olurdu. */
          try{
            const ceyrekEt=(t)=>{ const p=String(t||'').slice(0,7).split('-');
              if(p.length!==2) return String(t||'');
              const c=Math.floor((+p[1]-1)/3)+1; return 'Ç'+c+"'"+p[0].slice(2); };
            const kutu=(id,seri,ek)=>{
              const el=$(id); if(!el) return;
              if(!seri||!isFinite(seri.deger)){ el.innerHTML='<div class="sub">seri gelmedi</div>'; return; }
              const v=seri.deger, sn=v>=0?'up':'down';
              el.innerHTML='<div class="kv"><span class="k">'+ek.ad+' <span class="tag snap">'+ceyrekEt(seri.tarih)+'</span></span>'
                +'<span class="'+sn+'" style="font-weight:700;font-size:15px">'+(v>=0?'+':'')+'%'+trN(v,1)+'</span></div>'
                +(isFinite(seri.fark)?('<div class="kv"><span class="k thin">önceki döneme göre</span><span class="'
                  +(seri.fark>=0?'up':'down')+'">'+(seri.fark>=0?'+':'')+trN(seri.fark,1)+' puan</span></div>'):'')
                +'<div class="kv"><span class="k thin">'+ek.not_+'</span><span class="thin">'+ek.kaynak+'</span></div>';
            };
            kutu('usGsyhBody', S['A191RL1Q225SBEA'],
              {ad:'Reel GSYH', not_:'çeyreklik · yıllıklandırılmış (SAAR)', kaynak:'BEA · FRED'});
            /* §281 Avrupa GSYH artık ECB'den (bkz. evds2 mod=ecb). FRED'in
               EA19 serisi 19 ÜLKELİK bileşim — ECB tarafında o seri 2024-Q1'de
               DURMUŞ. Burada FRED yedek olarak kalır; ECB gelirse ecbGsyhYaz()
               üstüne yazar. */
            kutu('avGsyhBody', S['CLVMNACSCAB1GQEA19'],
              {ad:'Reel GSYH', not_:'yıllık değişim (y/y)', kaynak:'Eurostat · FRED'});
            /* §281b ECB karşılaştırması için FRED'in tarihini bırak. FRED serileri
               `S` nesnesinde ve o yerel — ecbGsyhCek oraya erişemez. */
            try{ window.__avGsyhFred = S['CLVMNACSCAB1GQEA19'] || null; }catch(e){}
            /* GDPNow ABD kartına ek satır — cari çeyreğin canlı tahmini */
            const gn=S['GDPNOW'], ug=$('usGsyhBody');
            if(gn&&isFinite(gn.deger)&&ug) ug.innerHTML+=
              '<div class="kv" style="border-top:1px dotted var(--line);margin-top:4px;padding-top:4px">'
              +'<span class="k">GDPNow <span class="thin">bu çeyrek tahmini</span></span>'
              +'<span class="'+(gn.deger>=0?'up':'down')+'">'+(gn.deger>=0?'+':'')+'%'+trN(gn.deger,1)+' <span class="thin" style="font-size:9px">Atlanta Fed</span></span></div>';
          }catch(e){}
          /* §270 FED KARTINDAKİ TÜFE DE BURADAN. İki kart aynı ekranda farklı
             sayı söylüyordu: sol "çekirdek %2,6 (Haz)" sabit, sağ "%2,8 (Tem)"
             canlı. Tek kaynak — ay etiketi de veriden geliyor, elle yazılmıyor. */
          try{
            const mn=S['CPIAUCNS'], ck=S['CPILFENS'];   /* §271 NSA — BLS manşetiyle aynı */
            if(mn && $('fedTufeVal')){
              $('fedTufeVal').innerHTML='yıllık %'+trN(mn.deger,1)+(ck?' · çekirdek %'+trN(ck.deger,1):'');
              const AYK=['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
              const p=String(mn.tarih||'').slice(0,7).split('-');
              if($('fedTufeTag')) $('fedTufeTag').textContent =
                (p.length===2 ? '('+AYK[+p[1]-1]+' · canlı)' : '(canlı)');
            }
          }catch(e){}
          /* §270c FED OLASILIK ÖLÇÜMÜNÜN YAŞI. "27 Tem'de ≈%82" damgalı bir
             ölçüm; kaldırmıyoruz (geçmiş veri değerli) ama KAÇ GÜNLÜK olduğunu
             söylüyoruz. 10 günü geçince kırmızı. Alttaki not "yüksek olasılıkla
             fiyatlanıyor" diye KESİN konuşuyordu — oysa aynı satır fiyatlamanın
             OYNAK olduğunu yazıyordu. */
          try{
            const _g=Math.floor((Date.now()-new Date('2026-07-27').getTime())/86400000);
            /* §270c aynı ölçüm İKİ kartta geçiyor (Fed & Politika + ECB Koro) —
               ikisine de yaş etiketi. Tek yerde işaretlemek diğerini yalancı bırakır. */
            for(const _id of ['fedOlasilikYas','ecbFedYas']){
              const _fo=$(_id); if(!_fo) continue;
              _fo.textContent='('+_g+'g önce)';
              _fo.style.color=_g>10?'var(--down)':'var(--muted)';
            }
            /* §284d AYNI ÖLÇÜM DÖRT KARTTA GEÇİYOR. İkisinde yaş etiketi vardı,
               ikisinde yoktu — tek yerde işaretlemek diğerlerini YALANCI bırakır.
               Sınıf bazlı seçim: yeni bir kart eklendiğinde de otomatik kapsar. */
            document.querySelectorAll('.fedYas82').forEach(el=>{
              el.textContent='('+_g+'g önce)';
              el.style.color=_g>10?'var(--down)':'var(--muted)';
              el.style.fontSize='9px';
            });
          }catch(e){}
        }
        // ---- Fed bilançosu (QT) ----
        if($('usBilancoBody')){
          const ZIRVE=8965; // mlr$, Nisan 2022 (tarihsel sabit)
          let bh='';
          const w=S.WALCL, rrp=S.RRPONTSYD, rez=S.WRESBAL;
          if(w){
            const mlr=w.deger/1000; // WALCL milyon$ gelir → mlr$
            const qt=ZIRVE-mlr;
            bh+='<div class="kv"><span class="k">Toplam varlıklar</span><span style="font-weight:600">'+trN(mlr,0)+' mlr$ <span class="'+(w.fark>0?'down':'up')+'" style="font-size:10px">('+(w.fark>0?'+':'')+trN(w.fark/1000,0)+' hf)</span> <span style="color:var(--muted);font-size:9px">'+w.tarih+'</span></span></div>';
            bh+='<div class="kv"><span class="k">Zirveden bugüne (toplam QT)</span><span class="up" style="font-weight:600">−'+trN(qt,0)+' mlr$ <span style="color:var(--muted);font-size:9px">zirve 8.965 · Nis 2022</span></span></div>';
          }
          if(rrp){
            /* §273 BİRİM: RRPONTSYD FRED'den MİLYAR $ gelir, WALCL/WRESBAL MİLYON $.
               Kod üçünü de 1000'e bölüyordu -> 0,725 / 1000 = 0,000725 -> trN(,0)
               ile "0" göründü ve kart bunun üzerine "tampon BİTTİ" yargısını
               kurdu. Gerçek değer 0,725 mlr = 725 MİLYON $ — tükenme sınırında
               ama SIFIR DEĞİL. Yuvarlama bir yargıya dönüşmüştü.
               (§252l ailesi: birim SERİYE GÖRE değişir, kopyalamadan doğrula.) */
            const rmlr=rrp.deger;
            /* §273 Eşikler mlr$ · 'BİTTİ' yerine 'tükendi sınırında' — 0,7 mlr
               pratikte sıfırdır ama metin veriyi değil YUVARLAMAYI yansıtmasın. */
            const durum=rmlr>400?'tampon dolu — QT etkisi hafif':(rmlr>100?'tampon eriyor — dikkat':
              (rmlr>=1?'tampon tükendi — QT rezervleri emiyor':'tampon tükendi (<1 mlr) — QT doğrudan rezervlerden'));
            bh+='<div class="kv"><span class="k">Ters repo (RRP) — likidite tamponu</span><span'+(rmlr<100?' class="down"':'')+'>'+trN(rmlr, rmlr<10?2:0)+' mlr$ <span style="color:var(--muted);font-size:9px">'+durum+'</span></span></div>';
          }
          if(rez){
            bh+='<div class="kv"><span class="k">Banka rezervleri</span><span>'+trN(rez.deger/1000,0)+' mlr$ <span class="'+(rez.fark<0?'down':'up')+'" style="font-size:10px">('+(rez.fark>0?'+':'')+trN(rez.fark/1000,0)+' hf)</span></span></div>';
          }
          $('usBilancoBody').innerHTML = bh||'<div class="sub">Bilanço serileri boş.</div>';
        }
        // ---- Konjonktür & Resesyon Radarı ----
        if($('usRadarBody')){
          let dh='';
          const kv=(ad,deger,yorum,kirmizi,vurgu)=>'<div class="kv"><span class="k">'+ad+'</span><span'+(vurgu?' style="font-weight:600"':'')+(kirmizi?' class="down"':'')+'>'+deger+(yorum?' <span style="color:var(--muted);font-size:9px">'+yorum+'</span>':'')+'</span></div>';
          const t3=S.T10Y3M;
          if(t3) dh+=kv('10Y − 3M spread — resesyon öncüsü #1',
            (t3.deger>=0?'+':'')+trN(t3.deger*100,0)+'bp',
            t3.deger<0?'TERS EĞRİ — tarihsel resesyon sinyali':'pozitif — sinyal yok · '+t3.tarih,
            t3.deger<0, true);
          const sahm=S.SAHMREALTIME;
          if(sahm) dh+=kv('Sahm kuralı — işsizlik sinyali',
            trN(sahm.deger,2)+' puan',
            sahm.deger>=0.5?'TETİKLENDİ (≥0,50) — resesyon başlamış olabilir':(sahm.deger>=0.3?'yaklaşıyor (eşik 0,50)':'sakin (eşik 0,50) · '+sahm.tarih.slice(0,7)),
            sahm.deger>=0.5, true);
          const gn=S.GDPNOW;
          if(gn) dh+=kv('GDPNow — bu çeyrek büyüme tahmini',
            '%'+trN(gn.deger,1),
            gn.deger<1?'zayıf büyüme':(gn.deger<0?'DARALMA':'sağlıklı')+' · Atlanta Fed',
            gn.deger<1, true);
          const nf=S.NFCI;
          if(nf) dh+=kv('Finansal koşullar (NFCI)',
            (nf.deger>=0?'+':'')+trN(nf.deger,2),
            nf.deger>0?'ortalamadan SIKI':'ortalamadan gevşek · 0=tarihsel ort.',
            nf.deger>0, false);
          const pay=S.PAYEMS;
          if(pay&&pay.fark!=null) dh+=kv('Tarım dışı istihdam (aylık değişim)',
            (pay.fark>=0?'+':'')+trN(pay.fark,0)+' bin',
            pay.fark<100?'zayıf (trend ~150-200 bin)':'sağlıklı · '+pay.tarih.slice(0,7),
            pay.fark<100, false);
          const rs=S.RSAFS;
          if(rs) dh+=kv('Perakende satışlar (yıllık)',
            '%'+trN(rs.deger,1),
            'tüketici ≈ GSYH\'nin %70\'i · ivme '+(rs.fark>=0?'+':'')+trN(rs.fark,1),
            rs.deger<2, false);
          const um=S.UMCSENT;
          if(um) dh+=kv('Tüketici güveni (Michigan)',
            trN(um.deger,1),
            'tarihsel ort. ~85 · '+um.tarih.slice(0,7),
            um.deger<70, false);
          $('usRadarBody').innerHTML = dh||'<div class="sub">Radar serileri boş.</div>';
        }
    }else if($('usFredBody')){
      $('usFredBody').innerHTML='<div class="sub">FRED: '+(d&&d.err?d.err:(d&&d.ok===false?'yanıt hatalı':'veri alınamadı — env FRED_KEY deploy sonrası kontrol'))+'</div>';
    }
  }catch(e){if($('usFredBody'))$('usFredBody').innerHTML='<div class="sub">FRED hatası: '+String(e).slice(0,80)+'</div>';}
}

async function asyaRender(){
  const m=window.__market;
  if(!$('asyaBody'))return;
  // Yahoo'daki Asya endeksleri (market.js'te mevcut)
  const ENDEKS=[
    ['nikkei','Nikkei 225','Japonya'],['hangseng','Hang Seng','Hong Kong'],
    ['shanghai','Shanghai','Çin'],['kospi','KOSPI','G. Kore'],
    ['kosdaq','KOSDAQ','G. Kore'],['taiwan','Taiwan','Tayvan'],
    ['nifty','Nifty 50','Hindistan'],['asx','ASX 200','Avustralya'],
  ];
  /* §245j KARTLAR TABLONUN KOPYASIYDI — ALANI HAK ETSİN.
     Eski hali Nikkei · Hang Seng · Shanghai · KOSPI'yi büyük punto ile
     gösteriyordu. Bunlar tablonun İLK DÖRT SATIRIYDI, aynı sırada, aynı
     kaynaktan (window.__market), üstelik EKSİK: tabloda hafta ve ay da var.
     Yani kartlar dikey alanı harcayıp hiçbir şey eklemiyordu.
     YENİ ÖLÇÜT: bir kart, tablonun SÖYLEYEMEDİĞİNİ söylemeli. Tablo tek tek
     endeksleri verir; kartlar artık BÜTÜNÜ okur — 8 satıra bakıp kafadan
     hesaplaman gereken dört şey:
       1 GECE YÖNÜ  ortalama + genişlik → dalga mı, tek hikâye mi
       2 DAĞILIM    en iyi−en kötü aralık → makro mu, ülkeye özgü mü
       3 TEKNO·İHRC Nikkei+KOSPI+KOSDAQ+Taiwan → küresel teknoloji/ihracat iştahı
       4 ÇİN TALEBİ Hang Seng+Shanghai → emtia ve ihracatçı kanalı
     3 ve 4'ün gruplaması panelin KENDİ çerçevesinden geliyor (t16 alt notu:
     "Nikkei ve KOSPI teknoloji/ihracat öncüsü · Hang Seng ve Shanghai Çin
     talep sinyali"). Not zaten bunu söylüyordu, panel hesaplamıyordu.
     GÜN + AY BİRLİKTE gösteriliyor: gün yönü ayla ZITSA bu bir sıçramadır,
     trend değil. 31 Tem verisi tam bu: tekno gün +%5,9 · ay −%15,1. */
  if(m&&$('asyaEndeksOzet')){
    const TUM=ENDEKS.map(x=>x[0]);
    const AD={}; ENDEKS.forEach(([k,ad])=>AD[k]=ad.replace(/\s*\d+$/,''));
    const gv=(k,alan)=>{ const d=m[k]; return (d&&d[alan]!=null&&isFinite(d[alan]))?d[alan]:null; };
    const ort=(ks,alan)=>{ const v=ks.map(k=>gv(k,alan)).filter(x=>x!=null);
      return v.length ? v.reduce((a,b)=>a+b,0)/v.length : null; };
    const varOlan=TUM.filter(k=>gv(k,'chg')!=null);

    const kart=(etiket,deger,cls,alt)=>
      '<div class="card" style="padding:10px 12px">'+
      '<div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.4px">'+etiket+'</div>'+
      '<div class="'+(cls||'')+'" style="font-size:20px;font-weight:700;margin:2px 0;font-family:var(--mono)">'+deger+'</div>'+
      '<div class="sub" style="font-size:10px">'+alt+'</div></div>';
    const yz=(v,b)=>v==null?'—':((v>=0?'+':'')+trN(v,b==null?2:b)+'%');
    const sn=v=>v==null?'':(v>=0?'up':'down');

    let h='';
    if(!varOlan.length){
      h=kart('GECE YÖNÜ','—','','veri yok');
    } else {
      /* 1) GECE YÖNÜ — ağırlıksız ortalama + genişlik.
         Ağırlıksız BİLEREK: burada aranan piyasa büyüklüğü değil, kaç ayrı
         piyasanın aynı yöne baktığı. Genişlik yönü, ortalama şiddeti verir. */
      const o=ort(varOlan,'chg'), arti=varOlan.filter(k=>gv(k,'chg')>0).length;
      h+=kart('GECE YÖNÜ',yz(o),sn(o),arti+'/'+varOlan.length+' endeks artıda');

      /* 2) DAĞILIM — en iyi ile en kötü arasındaki puan farkı.
         DAR dağılım = ortak bir makro itki (risk açıldı/kapandı) — BIST'e
         taşınma olasılığı yüksek. GENİŞ dağılım = ülkeye özgü hikâyeler,
         gecenin ortalaması yanıltıcıdır. Tabloda 8 satır var ama bu farkı
         gözle çıkarmak zor; asıl sinyal burada. */
      const sirali=varOlan.slice().sort((a,b)=>gv(b,'chg')-gv(a,'chg'));
      const ust=sirali[0], alt=sirali[sirali.length-1];
      const aralik=gv(ust,'chg')-gv(alt,'chg');
      h+=kart('DAĞILIM',trN(aralik,1)+' <span style="font-size:11px">puan</span>','',
        AD[ust]+' ↔ '+AD[alt]+(aralik>=6?' · hikâye bazlı':' · ortak itki'));

      /* 3-4) İKİ KANAL — panelin kendi çerçevesi.
         Gün ile AY birlikte: zıt işaretliyse sıçrama, aynı işaretliyse trend. */
      const kanal=(etiket,ks,aciklama)=>{
        const v=ks.filter(k=>gv(k,'chg')!=null);
        if(!v.length) return kart(etiket,'—','',aciklama);
        const g=ort(v,'chg'), a=ort(v,'a1');
        const zit=(g!=null&&a!=null&&g*a<0);
        return kart(etiket,yz(g),sn(g),
          'ay '+yz(a,1)+(zit?' · <b>sıçrama</b>':(a!=null?' · trendle uyumlu':''))
          +' <span style="opacity:.65">'+aciklama+'</span>');
      };
      h+=kanal('TEKNO · İHRACAT',['nikkei','kospi','kosdaq','taiwan'],'');
      h+=kanal('ÇİN TALEBİ',['hangseng','shanghai'],'');
    }
    $('asyaEndeksOzet').innerHTML=h;
    const nt=$('asyaOzetNot');
    if(nt) nt.innerHTML='Kartlar tabloyu <b>özetlemez</b>, tablonun söylemediğini söyler: '+
      'genişlik gecenin ortak mı tek hikâye mi olduğunu, dağılım BIST\u0027e taşınma olasılığını, '+
      'iki kanal ise sıçrama ile trendi ayırır. Tek tek endeksler aşağıdaki tabloda.';
  }
  // Endeks tablosu (Yahoo)
  let html='<table class="tbl"><thead><tr><th>Endeks</th><th class="num">Değer</th><th class="num">Gün</th><th class="num">Hafta</th><th class="num">Ay</th></tr></thead><tbody>';
  ENDEKS.forEach(([k,ad,ul])=>{
    const d=m&&m[k];
    const h=(v)=>v==null?'—':((v>=0?'+':'')+trN(v,1)+'%');
    const hcls=(v)=>v==null?'':(v>=0?'up':'down');
    if(!d||d.p==null){html+='<tr><td><b>'+ad+'</b></td><td class="num">—</td><td class="num">—</td><td class="num">—</td><td class="num">—</td></tr>';return;}
    const sgn=d.chg>=0?'+':'',cls=d.chg>=0?'up':'down';
    html+='<tr><td><b>'+ad+'</b> <span style="color:var(--muted);font-size:9px">'+ul+'</span></td>'+
      '<td class="num" style="font-weight:600">'+trN(d.p,0)+'</td>'+
      '<td class="num '+cls+'">'+sgn+trN(d.chg,2)+'%</td>'+
      '<td class="num '+hcls(d.h1)+'">'+h(d.h1)+'</td>'+
      '<td class="num '+hcls(d.a1)+'">'+h(d.a1)+'</td></tr>';
  });
  html+='</tbody></table>';
  // Forex tablosu (Twelve Data) — ayrı fetch, ilk açılışta çek
  html+='<h2 style="margin-top:18px">Asya Forex <span class="thin">(Twelve Data · USD paritesi)</span></h2>';
  html+='<div id="asyaForexBody"><div class="sub">forex yükleniyor…</div></div>';
  $('asyaBody').innerHTML=html;
  // Forex verisini çek (bir kez, cache)
  try{
    if(!ASYA_FOREX){
      const r=await fetch('/api/market?mod=asya');
      if(r.ok){const d=await r.json();if(d&&d.ok&&d.veri)ASYA_FOREX=d.veri;}
    }
    if(ASYA_FOREX&&$('asyaForexBody')){
      let fx='<table class="tbl"><thead><tr><th>Parite</th><th class="num">Kur</th><th class="num">Gün</th></tr></thead><tbody>';
      ASYA_FOREX.filter(x=>x.grup==='forex').forEach(x=>{
        const sgn=x.degisim>=0?'+':'',cls=x.degisim>=0?'up':'down';
        fx+='<tr><td><b>'+x.ad+'</b> <span style="color:var(--muted);font-size:9px">'+x.ulke+'</span></td>'+
          '<td class="num" style="font-weight:600">'+trN(x.fiyat,4)+'</td>'+
          '<td class="num '+cls+'">'+(x.degisim!=null?(sgn+trN(x.degisim,2)+'%'):'—')+'</td></tr>';
      });
      fx+='</tbody></table>';
      $('asyaForexBody').innerHTML=fx;
    }else if($('asyaForexBody')){
      $('asyaForexBody').innerHTML='<div class="sub">Forex verisi alınamadı (Twelve Data).</div>';
    }
  }catch(e){if($('asyaForexBody'))$('asyaForexBody').innerHTML='<div class="sub">Forex hatası.</div>';}
  jpMakro();
  hkMakro();
}

/* ---- Kripto (Finnhub) — Piyasa sekmesi, küresel endekslerin altı ---- */
async function kriptoRender(){
  const el=$('kriptoBody'); if(!el)return;
  try{
    const rk=await fetch('/api/usnews?mod=kripto');
    const dk=rk.ok?await rk.json():null;
    if(dk&&dk.ok&&dk.veri&&dk.veri.length){
      let kh='<table class="tbl"><thead><tr><th>Coin</th><th class="num">Fiyat $</th><th class="num">Gün</th></tr></thead><tbody>';
      dk.veri.forEach(c=>{
        const sgn=c.degisim>=0?'+':'',cls=c.degisim>=0?'up':'down';
        kh+='<tr><td><b>'+c.ad+'</b> <span style="color:var(--muted);font-size:9px">'+c.sembol+'</span></td>'+
          '<td class="num" style="font-weight:600">'+trN(c.fiyat,c.fiyat<10?4:0)+'</td>'+
          '<td class="num '+cls+'">'+(c.degisim!=null?(sgn+trN(c.degisim,2)+'%'):'—')+'</td></tr>';
      });
      kh+='</tbody></table>';
      el.innerHTML=kh;
    }else{ el.innerHTML='<div class="sub">Kripto verisi alınamadı.</div>'; }
  }catch(e){ el.innerHTML='<div class="sub">Kripto hatası.</div>'; }
}

/* ---- Japonya Makro (BoJ canlı) ---- */
async function jpMakro(){
  const el=$('jpMakroBody'); if(!el)return;
  try{
    const r=await fetch('/api/market?mod=boj');
    const d=r.ok?await r.json():null;
    if(!(d&&d.ok&&d.seriler)){ el.innerHTML='<div class="sub">BoJ: '+(d&&d.err?d.err:'veri alınamadı')+'</div>'; return; }
    const S=d.seriler; let hh='';
    if(S.callRate){
      const f=S.callRate.fark, t=String(S.callRate.tarih);
      hh+='<div class="kv"><span class="k">Gecelik çağrı faizi (fiili)</span><span style="font-weight:600">%'+trN(S.callRate.deger,3)+
        (f!=null?' <span style="font-size:10px;color:var(--muted)">('+(f>=0?'+':'')+trN(f,3)+')</span>':'')+
        ' <span style="color:var(--muted);font-size:9px">'+t.slice(0,4)+'-'+t.slice(4,6)+'-'+t.slice(6,8)+'</span></span></div>';
    }
    if(S.cgpi){
      const f=S.cgpi.fark, t=String(S.cgpi.tarih);
      hh+='<div class="kv"><span class="k">ÜFE (CGPI) yıllık — Brent geçişkenliği</span><span class="'+(f>0?'down':'up')+'" style="font-weight:600">%'+trN(S.cgpi.deger,1)+
        ' <span style="font-size:10px">(ivme '+(f>=0?'+':'')+trN(f,2)+')</span>'+
        ' <span style="color:var(--muted);font-size:9px">'+t.slice(0,4)+'-'+t.slice(4,6)+'</span></span></div>';
    }
    if(S.tankan){
      const f=S.tankan.fark, t=String(S.tankan.tarih);
      hh+='<div class="kv"><span class="k">TANKAN büyük imalat DI (çeyreklik)</span><span class="'+(S.tankan.deger>0?'up':'down')+'" style="font-weight:600">'+trN(S.tankan.deger,0)+' puan'+
        ' <span style="font-size:10px">('+(f>=0?'+':'')+trN(f,0)+' çyr)</span>'+
        ' <span style="color:var(--muted);font-size:9px">'+t.slice(0,4)+' Ç'+t.slice(5,6)+'</span></span></div>';
    }
    el.innerHTML=hh||'<div class="sub">BoJ serileri boş.</div>';
  }catch(e){ el.innerHTML='<div class="sub">BoJ hatası: '+String(e).slice(0,60)+'</div>'; }
}


/* ---- TL Kredi/Mevduat Faizleri + Makas (EVDS canlı) ---- */
async function tlFaizKart(){
  const el=$('tlFaizBody'); if(!el)return;
  try{
    const r=await fetch('/api/evds2?series=TP.KTF10,TP.KTF11,TP.KTF12,TP.KTF17,TP.TRY.MT01,TP.TRY.MT02,TP.TRY.MT03&gun=45&full=1');
    if(!r.ok){el.innerHTML='<div class="sub">EVDS yanıt vermedi.</div>';return;}
    const d=await r.json(); const ham=d.ham||[];
    const s2=(k)=>{const al=k.replace(/\./g,'_');const it=ham.filter(x=>x[al]!=null&&x[al]!=='');
      if(!it.length)return null;const s=it[it.length-1],o=it.length>1?it[it.length-2]:null;
      return {s:parseFloat(s[al]),o:o?parseFloat(o[al]):null,t:s.Tarih||''};};
    const L=[['TP.KTF17','Ticari kredi <span class="sub">(KMH dahil geniş kapsam)</span>',1],['TP.KTF10','İhtiyaç kredisi',0],['TP.KTF11','Taşıt',0],['TP.KTF12','Konut',0],
             ['TP.TRY.MT01','Mevduat — 1 aya kadar',0],['TP.TRY.MT02','Mevduat — 3 aya kadar',1],['TP.TRY.MT03','Mevduat — 6 aya kadar',0]];
    let hh='',var_mi=false,tic=null,m3=null,tarih='';
    L.forEach(([k,ad,vurgu])=>{const v=s2(k);if(!v)return;var_mi=true;tarih=v.t||tarih;
      if(k==='TP.KTF17')tic=v.s; if(k==='TP.TRY.MT02')m3=v.s;
      const f=v.o!=null?v.s-v.o:null;
      hh+='<div class="kv"><span class="k">'+ad+'</span><span'+(vurgu?' style="font-weight:600"':'')+'>%'+trN(v.s,1)+
        (f!=null?' <span class="'+(f>0.05?'down':(f<-0.05?'up':''))+'" style="font-size:10px">('+(f>=0?'+':'')+trN(f,1)+' hf)</span>':'')+'</span></div>';});
    if(tarih)hh+='<div class="sub" style="font-size:9px;margin-top:2px">son hafta: '+tarih+'</div>';
    el.innerHTML=var_mi?hh:'<div class="sub">Faiz serileri boş döndü (seri kodları deploy sonrası doğrulanır).</div>';
    const mk=$('tlMakasBody');
    if(mk){
      if(tic!=null&&m3!=null){
        const makas=tic-m3, cls=makas<2?'down':(makas<5?'':'up');
        const yorum=makas<0?'NEGATİF — mevduat krediden pahalı, sert marj baskısı':(makas<2?'çok dar — NFM baskısı sürüyor':(makas<5?'dar-normal — toparlanma sınırlı':'sağlıklı — marj alanı var'));
        mk.innerHTML='<div class="kv"><span class="k">Ticari kredi − 3 aya kadar mevduat</span><span class="'+cls+'" style="font-weight:700;font-size:15px">'+(makas>=0?'+':'')+trN(makas,1)+' puan</span></div>'+
          '<div class="kv"><span class="k">Okuma</span><span>'+yorum+'</span></div>'+
          '<div class="kv"><span class="k">Politika faizine göre mevduat</span><span>'+(m3>=37?'+':'')+trN(m3-37,1)+' puan '+(m3>37?'(fonlama politika ÜSTÜnde — pahalı)':'')+'</span></div>';
      } else mk.innerHTML='<div class="sub">Makas için iki seri de gerekli.</div>';
    }
  }catch(e){ el.innerHTML='<div class="sub">Faiz kartı hatası.</div>'; }
}

/* ---- Reel Sektör Döviz Pozisyonu (mod=dvz, kendini çözen) ---- */
async function dvzPozKart(){
  const el=$('dvzPozBody'); if(!el)return;
  try{
    const r=await fetch('/api/evds2?mod=dvz');
    const d=r.ok?await r.json():null;
    if(!(d&&d.ok&&d.veri)){el.innerHTML='<div class="sub">Reel sektör verisi: '+(d&&d.err?d.err:'alınamadı')+'</div>';return;}
    const V=d.veri; let hh='';
    const sat=(v,ad,tersRenk)=>{ if(!v||v.deger==null)return '';
      const mlr=v.deger/1000, f=v.fark!=null?v.fark/1000:null;
      const iyi= tersRenk ? (f!=null&&f>0) : (f!=null&&f<0); // net açık küçülmesi iyi; kısa vadeli artışı iyi
      return '<div class="kv"><span class="k">'+ad+'</span><span style="font-weight:600">'+trN(mlr,1)+' mlr $'+
        (f!=null?' <span class="'+(iyi?'up':'down')+'" style="font-size:10px">('+(f>=0?'+':'')+trN(f,1)+' ay)</span>':'')+
        ' <span style="color:var(--muted);font-size:9px">'+(v.tarih||'')+'</span></span></div>'; };
    hh+=sat(V.net,'Net döviz pozisyonu',false);
    hh+=sat(V.kisaVadeli,'Kısa vadeli net pozisyon',true);
    hh+=sat(V.varlik,'Toplam YP varlık',true);
    hh+=sat(V.yukumluluk,'Toplam YP yükümlülük',false);
    el.innerHTML=hh||'<div class="sub">Seriler çözülemedi.</div>';
  }catch(e){ el.innerHTML='<div class="sub">Döviz pozisyonu hatası.</div>'; }
}


/* ---- KKO kartı (mod=kko, kendini çözen) ---- */
async function kkoKart(){
  const el=$('kkoBody'); if(!el)return;
  try{
    const r=await fetch('/api/evds2?mod=kko');
    const d=r.ok?await r.json():null;
    if(!(d&&d.ok&&d.veri)){el.innerHTML='<div class="sub">KKO: '+(d&&d.err?d.err:'veri alınamadı')+'</div>';return;}
    const V=d.veri;
    const sat=(v,ad,vurgu)=>{ if(!v)return '';
      const f=v.fark, cls=f==null?'':(f>0?'up':'down');
      return '<div class="kv"><span class="k">'+ad+'</span><span'+(vurgu?' style="font-weight:600"':'')+'>%'+trN(v.deger,1)+
        (f!=null?' <span class="'+cls+'" style="font-size:10px">('+(f>=0?'+':'')+trN(f,1)+' ay)</span>':'')+
        (vurgu&&v.tarih?' <span style="color:var(--muted);font-size:9px">'+v.tarih+'</span>':'')+'</span></div>'; };
    let hh='';
    hh+=sat(V.genel,'Genel — imalat sanayi',1);
    hh+=sat(V.yatirim,'Yatırım malları — capex iştahı',1);
    hh+=sat(V.ara,'Ara malları — sanayi zinciri',0);
    hh+=sat(V.tuketim,'Tüketim malları',0);
    hh+=sat(V.dayanikli,'· dayanıklı tüketim — faiz duyarlı',0);
    hh+=sat(V.gida,'· gıda',0);
    if(V.genel&&V.genel.deger!=null){
      const g=V.genel.deger;
      const yorum=g>=76?'GÜÇLÜ — kapasite dolu, yatırım baskısı':(g>=72?'ılımlı — normal bant':'SOĞUMA — talep zayıflıyor');
      hh+='<div class="kv"><span class="k">Rejim</span><span>'+yorum+'</span></div>';
    }
    el.innerHTML=hh||'<div class="sub">KKO serileri çözülemedi.</div>';
  }catch(e){ el.innerHTML='<div class="sub">KKO hatası.</div>'; }
}

/* ---- Yabancı kartı canlı katman (mod=yab): stok + son hafta EVDS'den ---- */
async function yabCanli(){
  /* §245k: sessiz düşüş görünür yapıldı. Bu fonksiyon damgalı yabanci.json
     verisinin ÜZERİNE canlıyı yazar — düşerse damgalı görünmeye devam eder,
     bu tasarım gereği doğru (kart tarihli damga taşıyor, yalan yok). Ama
     NEDEN canlıya geçemediği artık konsola düşüyor; yoksa "hâlâ damgalı"
     ile "EVDS bozuk" ayırt edilemiyordu. */
  try{
    const r=await fetch('/api/evds2?mod=yab');
    if(!r.ok){ console.warn('[KTPanel] yabancı canlı katman HTTP',r.status,'— damgalı gösterimde'); return; }
    const d=await r.json();
    if(!(d&&d.ok&&d.veri)){ console.warn('[KTPanel] yabancı canlı katman:', (d&&d.err)||'veri yok','— damgalı gösterimde'); return; }
    const V=d.veri;
    // Stok satırı: hafta satırının hemen üstüne enjekte
    const hedef=$('yabHaftaTag');
    if(hedef&&(V.hisseStok||V.dibsStok)&&!$('yabStokSatir')){
      const kv=hedef.closest('.kv');
      if(kv){
        const div=document.createElement('div'); div.className='kv'; div.id='yabStokSatir';
        let ic='<span class="k">Stok (canlı EVDS)</span><span>';
        if(V.hisseStok)ic+='hisse <b>'+trN(V.hisseStok.deger/1000,1)+' mlr $</b>';
        if(V.dibsStok)ic+=(V.hisseStok?' · ':'')+'DİBS <b>'+trN(V.dibsStok.deger/1000,1)+' mlr $</b>';
        ic+=(V.hisseStok&&V.hisseStok.tarih?' <span style="color:var(--muted);font-size:9px">'+V.hisseStok.tarih+'</span>':'')+'</span>';
        div.innerHTML=ic;
        kv.parentNode.insertBefore(div, kv);
      }
    }
    // Son hafta canlı ise damgalıyı EZ (yeni yayın otomatik yansır)
    if(V.hisseNet&&V.dibsNet&&$('yabHaftaVal')){
      $('yabHaftaVal').innerHTML='hisse '+(V.hisseNet.deger>=0?'+':'')+trN(V.hisseNet.deger,1)+'mn · DİBS '+(V.dibsNet.deger>=0?'+':'')+trN(V.dibsNet.deger,1)+'mn <span class="sub" style="display:inline">EVDS canlı</span>';
      if($('yabHaftaTag')&&V.hisseNet.tarih)$('yabHaftaTag').textContent='('+V.hisseNet.tarih+' · canlı)';
    }
    /* §245r SERİ DE ARTIK CANLI — otomasyon kuralının ilk uygulaması.
       "5 haftalık seri" satırı yabanci.json'daki ELLE tutulan hafta_seri'den
       basılıyordu (Perşembe ritüeli: her yayın elle eklenirdi). Oysa cozCek
       90 günlük ham seriyi ZATEN çekiyordu, yalnız son gözlemi verip gerisini
       atıyordu. Uç artık seriyi de döndürüyor; burada son 5 hafta canlıdan
       kurulup damgalı satır EZİLİYOR. Elle iş: haftada bir JSON düzenleme →
       SIFIR. yabanci.json'da elle kalan tek şey aylık ödemeler dengesi
       (o gerçekten EVDS haftalıklarında yok). */
    if(V.hisseNet&&V.hisseNet.seri&&V.dibsNet&&V.dibsNet.seri){
      const H=V.hisseNet.seri.slice(-5), D=V.dibsNet.seri.slice(-5);
      if(H.length>=3){
        const kisa=(t)=>{let p=String(t).split(/[-.\/]/); const ay=['','Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
          if(p.length>=3 && p[0].length===4) p=[p[2],p[1],p[0]];   /* ISO (yıl önde) → çevir */
          return p.length>=3 ? (+p[0])+'\u00A0'+(ay[+p[1]]||p[1]) : String(t); };
        const satir=H.map((h,i)=>{
          const t=D[i]?D[i].v:null, rekor=(t!=null&&t>2000);
          return kisa(h.t)+' <b>'+Math.round(h.v)+'</b>/<b'+(rekor?' class="up"':'')+'>'+(t==null?'—':Math.round(t))+(rekor?'★':'')+'</b>';
        }).join(' → ');
        const kap=$('yabHaftaVal') && $('yabHaftaVal').closest('div');
        /* seri satırını id ile bul: render'da üretiliyor, id yok — metinden yakala */
        document.querySelectorAll('#yabanciBody .kv').forEach(el=>{
          const k=el.querySelector('.k');
          if(k && /5 haftal[ıi]k seri/i.test(k.textContent)){
            const v=el.querySelector('span[style]:last-child')||el.children[1];
            if(v){ v.innerHTML=satir+' <span class="sub" style="display:inline">EVDS canlı</span>'; }
          }
        });
      }
    }
  }catch(e){ console.warn('[KTPanel] yabancı canlı katman düştü:',(e&&e.message)||e,'— damgalı gösterimde'); }
}

/* ---- Hong Kong Makro (HKMA canlı) ---- */
async function hkMakro(){
  const el=$('hkMakroBody'); if(!el)return;
  try{
    const r=await fetch('/api/market?mod=hkma');
    const d=r.ok?await r.json():null;
    if(!(d&&d.ok&&d.veri)){ el.innerHTML='<div class="sub">HKMA: '+(d&&d.err?d.err:'veri alınamadı')+'</div>'; return; }
    const V=d.veri; let hh='';
    if(V.hkdUsd&&V.hkdUsd.deger!=null){
      const bk=V.hkdUsd.bandKonum;
      const bandCls=bk>=85?'down':(bk<=15?'down':'');
      const bandYorum=bk>=85?'zayıf uca yapışık — çıkış baskısı':(bk<=15?'güçlü uçta — giriş baskısı':'band ortası — dengede');
      hh+='<div class="kv"><span class="k">USD/HKD <span class="sub">(peg 7,75–7,85)</span></span><span style="font-weight:600">'+trN(V.hkdUsd.deger,4)+
        ' <span class="'+bandCls+'" style="font-size:10px">band %'+bk+' · '+bandYorum+'</span></span></div>';
    }
    if(V.aggrBalance&&V.aggrBalance.deger!=null){
      const f=V.aggrBalance.fark;
      hh+='<div class="kv"><span class="k">Aggregate Balance — likidite havuzu</span><span>'+trN(V.aggrBalance.deger/1000,1)+' mlr HKD'+
        (f!=null?' <span class="'+(f<0?'down':'up')+'" style="font-size:10px">('+(f>=0?'+':'')+trN(f/1000,1)+')</span>':'')+'</span></div>';
    }
    if(V.hiborON&&V.hiborON.deger!=null){
      const f=V.hiborON.fark;
      hh+='<div class="kv"><span class="k">HIBOR gecelik — likiditenin fiyatı</span><span class="'+(f>0.2?'down':'')+'" style="font-weight:600">%'+trN(V.hiborON.deger,2)+
        (f!=null?' <span style="font-size:10px">('+(f>=0?'+':'')+trN(f,2)+' ay)</span>':'')+'</span></div>';
    }
    if(V.hibor3M&&V.hibor3M.deger!=null)
      hh+='<div class="kv"><span class="k">HIBOR 3 aylık</span><span>%'+trN(V.hibor3M.deger,2)+'</span></div>';
    if(V.y10&&V.y10.deger!=null)
      hh+='<div class="kv"><span class="k">HK devlet tahvili 10Y</span><span>%'+trN(V.y10.deger,2)+'</span></div>';
    if(V.bazFaiz&&V.bazFaiz.deger!=null)
      hh+='<div class="kv"><span class="k">Baz faiz (Fed takipçisi)</span><span>%'+trN(V.bazFaiz.deger,2)+' <span style="color:var(--muted);font-size:9px">'+(V.ay||'')+'</span></span></div>';
    el.innerHTML=hh||'<div class="sub">HKMA verisi boş.</div>';
  }catch(e){ el.innerHTML='<div class="sub">HKMA hatası: '+String(e).slice(0,60)+'</div>'; }
}

function emtiaRender(){
  const m=window.__market; if(!m)return;
  if(!$('emtiaBody'))return;
  /* §245j EMTİA KARTLARI DA TABLONUN KOPYASIYDI.
     Eski hali Brent · Altın · Bakır · Doğalgaz'ı büyük punto ile tekrar
     ediyordu — dördü de tabloda, üstelik hafta/ay sütunlarıyla birlikte.
     AMA Emtia'da Asya'dan FARKLI bir çözüm gerekti: tablo ZATEN gruplu
     (Enerji · Değerli Metal · Sanayi Metali · Tahıl · Yumuşak). Yani grup
     ortalaması göstermek yeni bilgi olmazdı.
     Eksik olan GRUPLAR ARASI okuma — ve bir Türkiye fonu için asıl soru bu:
       1 MALİYET BASKISI  Brent+doğalgaz+buğday → cari açık ve TÜFE kanalı.
                          Türkiye net enerji ithalatçısı; bu üçü panelin kendi
                          notunda "TL baskısı ve TÜFE'ye geçer" diye tanımlı.
       2 BAKIR/ALTIN      klasik büyüme-korku oranı. Bakır sanayi talebini,
                          altın korunma talebini temsil eder. Oran YÜKSELİYORSA
                          döngü, DÜŞÜYORSA korunma öndedir. Tabloda iki ayrı
                          satır var ama ORAN yok — asıl sinyal orada.
       3 REEL FAİZ        altın gün+ay. Altın reel faize ters çalışır.
       4 GENİŞLİK         kaç emtia artıda + dağılım → ortak itki mi, tek
                          kalemin hikâyesi mi.
     Ölçüt Asya ile aynı: kart, tablonun SÖYLEYEMEDİĞİNİ söylemeli. */
  const eg=(k,al)=>{ const d=m[k]; return (d&&d[al]!=null&&isFinite(d[al]))?d[al]:null; };
  const eort=(ks,al)=>{ const v=ks.map(k=>eg(k,al)).filter(x=>x!=null);
    return v.length ? v.reduce((a,b)=>a+b,0)/v.length : null; };
  const ekart=(etiket,deger,cls,alt)=>
    '<div class="card" style="padding:10px 12px">'+
    '<div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.4px">'+etiket+'</div>'+
    '<div class="'+(cls||'')+'" style="font-size:20px;font-weight:700;margin:2px 0;font-family:var(--mono)">'+deger+'</div>'+
    '<div class="sub" style="font-size:10px">'+alt+'</div></div>';
  const eyz=(v,b)=>v==null?'—':((v>=0?'+':'')+trN(v,b==null?2:b)+'%');
  const esn=v=>v==null?'':(v>=0?'up':'down');

  let oz='';
  /* 1) MALİYET BASKISI — Türkiye'nin ithalat faturası kalemleri */
  const MAL=['brent','dogalgaz','bugday'].filter(k=>eg(k,'chg')!=null);
  if(MAL.length){
    const g=eort(MAL,'chg'), a=eort(MAL,'a1');
    oz+=ekart('MALİYET BASKISI',eyz(g),esn(g),
      'ay '+eyz(a,1)+' <span style="opacity:.65">· cari açık + TÜFE kanalı</span>');
  } else oz+=ekart('MALİYET BASKISI','—','','veri yok');

  /* 2) BAKIR / ALTIN — büyüme mi korku mu. Oran seviyesi tek başına anlamsız
     (birimler farklı), o yüzden GÜNLÜK GÖRELİ hareket gösteriliyor: bakırın
     altına karşı kaç puan ayrıştığı. Artı = döngü öne geçti. */
  const bg=eg('bakir','chg'), ag=eg('altin','chg');
  if(bg!=null&&ag!=null){
    const fark=bg-ag;
    oz+=ekart('BAKIR − ALTIN',(fark>=0?'+':'')+trN(fark,1)+' <span style="font-size:11px">puan</span>',esn(fark),
      (fark>=0?'<b>büyüme</b> önde':'<b>korunma</b> önde')+' <span style="opacity:.65">· döngü sinyali</span>');
  } else oz+=ekart('BAKIR − ALTIN','—','','veri yok');

  /* 3) ALTIN — reel faiz ve güvenli liman */
  const alg=eg('altin','chg'), ala=eg('altin','a1');
  oz+=ekart('ALTIN',eyz(alg),esn(alg),
    (ala==null?'':'ay '+eyz(ala,1))+' <span style="opacity:.65">· reel faize ters</span>');

  /* 4) GENİŞLİK — kaç kalem artıda + dağılım */
  const TUME=EMTIA.map(x=>x[0]).filter(k=>eg(k,'chg')!=null);
  if(TUME.length){
    const arti=TUME.filter(k=>eg(k,'chg')>0).length;
    const sr=TUME.slice().sort((x,y)=>eg(y,'chg')-eg(x,'chg'));
    const ar=eg(sr[0],'chg')-eg(sr[sr.length-1],'chg');
    oz+=ekart('GENİŞLİK',arti+'<span style="font-size:13px">/'+TUME.length+'</span>','',
      'artıda · dağılım '+trN(ar,1)+' puan'+(ar>=8?' <b>· tek kalem hikâyesi</b>':''));
  } else oz+=ekart('GENİŞLİK','—','','veri yok');

  $('emtiaOzet').innerHTML=oz;
  const ent=$('emtiaOzetNot');
  if(ent) ent.innerHTML='Kartlar tabloyu özetlemez — tablo kalemleri gruplu zaten verir. '+
    'Buradakiler <b>gruplar arası</b> okuma: ithalat faturası baskısı, büyüme-korunma dengesi ve genişlik. '+
    'Tek tek kalemler ve bağlam notları aşağıda.';
  // Gruplu tablo
  let html='';
  EMTIA_GRUP.forEach(grup=>{
    const uyeler=EMTIA.filter(e=>e[3]===grup);
    const satir=uyeler.map(([k,ad,br,g,ctx])=>{
      const d=m[k];
      if(!d||d.p==null)return '<tr><td>'+ad+'</td><td class="num">—</td><td class="num">—</td><td class="num">—</td><td class="num">—</td></tr>';
      const s=d.chg>=0?'+':'',cls=d.chg>=0?'up':'down';
      const h=(v)=>v==null?'—':((v>=0?'+':'')+trN(v,1)+'%');
      const hcls=(v)=>v==null?'':(v>=0?'up':'down');
      return '<tr><td title="'+ctx.replace(/"/g,"'")+'"><b>'+ad+'</b> <span style="color:var(--muted);font-size:9px">'+br+'</span></td>'+
        '<td class="num" style="font-weight:600">'+trN(d.p,2)+'</td>'+
        '<td class="num '+cls+'">'+s+trN(d.chg,2)+'%</td>'+
        '<td class="num '+hcls(d.h1)+'">'+h(d.h1)+'</td>'+
        '<td class="num '+hcls(d.a1)+'">'+h(d.a1)+'</td></tr>';
    }).join('');
    html+='<div class="lbl" style="margin-top:14px">'+grup+'</div>'+
      '<table style="margin-top:4px"><thead><tr><th>Emtia</th><th class="num">Fiyat</th><th class="num">Gün</th><th class="num">Hafta</th><th class="num">Ay</th></tr></thead><tbody>'+satir+'</tbody></table>';
  });
  $('emtiaBody').innerHTML=html;
}

async function loadLive(){
  try{
    const j=await (await fetch('https://open.er-api.com/v6/latest/USD')).json();const R=j.rates;
    $('usdtry').textContent=trN(R.TRY,4);$('eurtry').textContent=trN(R.TRY/R.EUR,4);
    $('eurusd').textContent=trN(1/R.EUR,4);$('gbpusd').textContent=trN(1/R.GBP,4);$('usdjpy').textContent=trN(R.JPY,2);
    window.__usdtry=R.TRY;
    $('dvzse').textContent=trN(Math.sqrt(R.TRY*(R.TRY/R.EUR)),4);
    tapeItems['USD/TRY']=trN(R.TRY,2);tapeItems['EUR/TRY']=trN(R.TRY/R.EUR,2);
    tapeItems['EUR/USD']=trN(1/R.EUR,4);tapeItems['GBP/USD']=trN(1/R.GBP,4);tapeItems['USD/JPY']=trN(R.JPY,1);updTape();
  }catch(e){}
  try{
    const j2=await (await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,pax-gold&vs_currencies=usd,try&include_24hr_change=true')).json();
    const btc=j2.bitcoin,pax=j2['pax-gold'];
    $('btc').textContent='$'+trN(btc.usd,0);
    if(pax&&pax.usd)$('xau').textContent='$'+trN(pax.usd,2);
    const gramTry=(pax.try||pax.usd*(window.__usdtry||0))/31.1035;
    if(gramTry>0){$('gau').textContent=trN(gramTry,0)+'₺';tapeItems['GRAM ALTIN']=trN(gramTry,0)+'₺';}
    tapeItems['BTC']='$'+trN(btc.usd,0);updTape();
  }catch(e){}
  try{
    const d=new Date(),d0=new Date();d0.setDate(d0.getDate()-30);const iso=x=>x.toISOString().slice(0,10);
    const fx=await (await fetch('https://api.frankfurter.dev/v1/'+iso(d0)+'..'+iso(d)+'?from=USD&to=TRY')).json();
    spark('spUsd',Object.keys(fx.rates).sort().map(k=>fx.rates[k].TRY),'#128A66');
    const fx2=await (await fetch('https://api.frankfurter.dev/v1/'+iso(d0)+'..'+iso(d)+'?from=EUR&to=TRY')).json();
    spark('spEur',Object.keys(fx2.rates).sort().map(k=>fx2.rates[k].TRY),'#3D7BD9');
  }catch(e){}
  try{
    const b30=await (await fetch('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=30')).json();
    spark('spBtc',b30.prices.filter((_,i)=>i%6===0).map(p=>p[1]),'#128A66');
  }catch(e){}
  try{
    const g30=await (await fetch('https://api.coingecko.com/api/v3/coins/pax-gold/market_chart?vs_currency=usd&days=30')).json();
    spark('spGau',g30.prices.filter((_,i)=>i%6===0).map(p=>p[1]),'#30BA8F');
  }catch(e){}
  try{
    const s=await (await fetch('https://api.gold-api.com/price/XAG')).json();
    $('xag').textContent=(s&&s.price)?'$'+trN(s.price,2):'$56,20';
  }catch(e){$('xag').textContent='$56,20';}
  await marketCek();
  setInterval(marketCek, 300000);
  baslikTarih();
  canliIsiklari(); setInterval(canliIsiklari, 5000);  // canlı veri geldikçe yeşil ışıkları tazele
  egriCek(); setInterval(egriCek, 3600000);
  makroKartlar();
  oktCek();
  bnkInit();   // 5 dakikada bir tazele
}
async function marketCek(){
  try{
    /* §165 DOĞRU YER. §155'te bu bloğu YANLIŞ fonksiyona koymuşum — küresel
       endeksleri (DAX/FTSE) çizen çağrıya. Oysa m.his'i dolduran TEK yer burası.
       Sonuç: ?his= hiç gönderilmiyordu, kullanıcının kendi hisseleri bile
       "fiyat akışında yok" çıkıyordu.
       İKİNCİ HATA: ENDAG tembel yükleniyordu (Ayrışma bölümü açılınca), yani
       market çağrısı sırasında HENÜZ BOŞTU. Artık burada AWAIT ediliyor —
       endeks üyeleri ilk çağrıda listeye giriyor. */
    try{ if(typeof endeksAgirlikYukle==='function') await endeksAgirlikYukle(); }catch(e){}
    const ekKod = (()=>{ const s=new Set();
      try{ (JSON.parse(_origGet('poz_v1')||'[]')||[]).forEach(x=>{
        if(x&&x.tip==='hisse'&&x.kod) s.add(String(x.kod).toUpperCase()); }); }catch(e){}
      try{ if(ENDAG) Object.keys(ENDAG).forEach(e=>{ const u=ENDAG[e]&&ENDAG[e].uyeler;
        if(u) Object.keys(u).forEach(k=>s.add(k)); }); }catch(e){}
      return Array.from(s); })();
    const mk=await(await fetch('/api/market'+(ekKod.length?'?his='+encodeURIComponent(ekKod.join(',')):''))).json();
    if(mk) window.__marketKapsam={istenen:ekKod.length, donen:mk.hisAdet||null, kirpilan:mk.hisKirpildi||0};
    if(mk&&mk.data){window.__market=mk.data;renderKuresel();emtiaRender();
      const rb=(id,k,dec)=>{const d=mk.data[k];if(d&&d.p!=null&&$(id)){const s=d.chg>=0?'+':'';$(id).innerHTML=trN(d.p,dec)+' <span class="sub'+(d.chg>=0?'':' down')+'" style="display:inline">'+s+'%'+trN(d.chg,2)+'</span>';}};
      rb('vixV','vix',2);rb('dxyV','dxy',2);rb('brentV','brent',2);renderRiskBaro();
    /* §270b Fed kartındaki enerji satırına CANLI Brent eklenir — sabit "102$"
       yerine güncel seviye. Veri yoksa etiket boş kalır, iddia edilmez. */
    /* §282 AVRUPA MEGA-CAP CANLI FİYAT. Kart 27 Tem'den beri elle ve donmuş;
       araştırma notları kalıyor (çeyrek rakamları hâlâ geçerli) ama fiyatlar
       canlı. Para birimi SEMBOLDEN belli: .AS/.PA/.DE = €, .CO = kr.
       Yahoo düşerse satır BOŞ kalır — yanlış fiyat göstermez. */
    try{
      const AV=[['ASML.AS','ASML','€'],['MC.PA','LVMH','€'],['SAP.DE','SAP','€'],['NOVO-B.CO','Novo','kr']];
      const par=[];
      for(const [sem,ad,pb] of AV){
        const d=mk.data[sem]; if(!d||d.p==null) continue;
        const sn=(d.chg>=0?'up':'down');
        par.push('<b>'+ad+'</b> '+pb+trN(d.p,d.p<100?2:0)
          +' <span class="'+sn+'">'+(d.chg>=0?'+':'')+trN(d.chg,1)+'%</span>');
      }
      if(par.length&&$('avMegaFiyat')) $('avMegaFiyat').innerHTML=par.join(' · ')+' <span class="thin">· canlı</span>';
    }catch(e){}
    try{ const br=mk.data.brent;
      if(br && br.p!=null){
        const _bt='· Brent '+trN(br.p,1)+'$';
        if($('fedBrentTag')) $('fedBrentTag').textContent=_bt;
        if($('ecbBrentTag')) $('ecbBrentTag').textContent=_bt;   /* §270b Avrupa kartı */
      }
    }catch(e){}canliEnjekte();endeksRender();tapeEndeksTazele();   /* §252p */
      glbCdsYaz(); cdsCek(); ecbGsyhCek(); exAnteAcilis(); haneTercihCek();   /* §281 · §289 · §290 */   /* §253b/d — önce damgalıyı bas, canlı gelince üstüne yaz */
      const d=$('sekDamga');
      if(d){
        const s=(mk.data.xu100&&mk.data.xu100.gun)?mk.data.xu100.gun:'';
        const saat=new Date().toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'});
        // DÜRÜST DAMGA: Yahoo bazı BIST sektör endekslerinde yeterli bar döndürmüyor;
        // o sektörler sektor.json'daki damgalı değerde kalıyor. "canlı" yazıp eski veri
        // göstermek yerine kaçının canlı olduğunu söyle.
        const say=(typeof SEKTOR!=='undefined'&&SEKTOR&&SEKTOR.canli)?SEKTOR.canli:0;
        const top=(typeof SEKTOR!=='undefined'&&SEKTOR&&SEKTOR.sektorler)?SEKTOR.sektorler.length:0;
        d.textContent=(top&&say<top)
          ? say+'/'+top+' canlı · '+saat+' · diğerleri damgalı'+(SEKTOR.tarih?' '+SEKTOR.tarih:'')
          : 'canlı · '+saat+(s?' · veri '+s:'');
      }
    }
  }catch(e){}
}
async function loadTcmb(){
  try{
    const j=await (await fetch('/api/tcmb')).json();
    if(j.usd)$('tcmbkur').textContent=trN(j.usd.satis,4);
  }catch(e){}
}
loadLive();loadTcmb();
/* ---- Faktör Model ---- */
let fmLoaded=false,FM=null,TRK=null;
const FMF=['VALUE','GROWTH','QUALITY','MOMENTUM','LOW_RISK'];
const FMW_DEF={QUALITY:.30,VALUE:.25,MOMENTUM:.20,LOW_RISK:.15,GROWTH:.10};
/* ── Faktör ağırlıkları kalıcı (§108) ── her açılışta yeniden girme derdi biter.
   Bulut anahtarına eklendi: kişisel ayar, diğer cihazında da aynı gelir.
   "Varsayılana dön" kaydı SİLER — yoksa varsayılan bir daha hiç gelmezdi. */
const FMW_KEY='fm_agirlik_v1';
function fmwYaz(){ const o={}; FMF.forEach(k=>{const e=$('fmw'+k); if(e)o[k]=+e.value||0;});
  try{ localStorage.setItem(FMW_KEY, JSON.stringify(o)); }catch(e){} }
function fmwGeriYukle(){
  let s=null; try{ s=JSON.parse(localStorage.getItem(FMW_KEY)||'null'); }catch(e){}
  if(!s||typeof s!=='object') return false;
  let n=0; FMF.forEach(k=>{ const e=$('fmw'+k); if(e&&s[k]!=null&&isFinite(s[k])){ e.value=s[k]; n++; } });
  return n>0;
}
async function fmInit(){
  try{FM=await (await fetch('/fm.json',{cache:'no-store'})).json();}
  catch(e){$('fmBody').innerHTML='<tr><td colspan="10" style="color:var(--down)">fm.json yüklenemedi.</td></tr>';return;}
  $('fmUni').textContent=FM.meta.uni;$('fmRanked').textContent=FM.meta.ranked;$('fmTopN').textContent='Top '+FM.meta.topn;
  fmwGeriYukle();   // kayıtlı ağırlıklar — ilk çizimden ÖNCE (§108)
  FMF.forEach(k=>$('fmw'+k).addEventListener('input',()=>{fmwYaz();fmRender();}));
  $('fmReset').addEventListener('click',()=>{FMF.forEach(k=>$('fmw'+k).value=FMW_DEF[k]);
    try{localStorage.removeItem(FMW_KEY);}catch(e){}   // kaydı sil, yoksa varsayılan geri gelmez
    fmRender();});
  fmRender();
  setTimeout(fmKarne,1200);
  try{TRK=await (await fetch('/track.json',{cache:'no-store'})).json();trkBazUygula();trackRender();const sb=$('trkSifirla');if(sb&&!sb.dataset.bagli){sb.dataset.bagli='1';sb.addEventListener('click',trkSifirla);}if(window.__market)canliEnjekte();}
  catch(e){$('trkNote').textContent='track.json yüklenemedi.';}
}
/* ── SİCİL TABANI ── sicili istenen tarihten yeniden başlatma (§108) ──
   track.json'daki kuruluş fiyatları (p0) ve endeks referansı SABİT dosyada duruyor.
   Sicili sıfırlamak = bugünün canlı fiyatlarını yeni p0 yapmak. Dosyaya dokunmadan,
   bir ÖRTÜ (trk_baz_v1) ile yapılır — track.json bozulmaz, geçmiş geri getirilebilir.
   Bulut anahtarına eklendiği için diğer cihaz da aynı tabandan ölçer.
   AY BAŞI KULLANIMI: her ay 1'inde SIFIRLA → o ayın getirisi temiz ölçülür. */
const TRK_BAZ='trk_baz_v1';
function trkBazOku(){try{const b=JSON.parse(localStorage.getItem(TRK_BAZ)||'null');
  return (b&&b.tarih&&b.p0)?b:null;}catch(e){return null;}}
function trkBazUygula(){
  const b=trkBazOku(); if(!b||!TRK||!TRK.holdings) return false;
  TRK.inception=b.tarih; TRK.endeks_kapanis=b.endeks0; TRK.fiyat_tarihi=b.tarih;
  TRK.holdings.forEach(h=>{ if(b.p0[h.t]!=null) h.p0=b.p0[h.t]; });
  TRK.__statik=(TRK.series||[]).filter(p=>p&&p.d>=b.tarih);
  TRK.series=TRK.__statik.length?TRK.__statik.slice():[{d:b.tarih,model:0,endeks:0}];
  const el=$('trkKurulus');
  if(el){ const [y,m,g]=b.tarih.split('-');
    const AY=['','OCA','ŞUB','MAR','NİS','MAY','HAZ','TEM','AĞU','EYL','EKİ','KAS','ARA'];
    el.textContent='KURULUŞ: '+(+g)+' '+AY[+m]+' '+y; }
  return true;
}
function trkSifirla(){
  const m=window.__market;
  if(!m||!m.his){ alert('Canlı fiyatlar henüz yüklenmedi — birkaç saniye sonra tekrar dene.'); return; }
  /* §245t: taban GERÇEK XKTUM ile kurulur (m.end.XKTUM). m.xktum §191'de
     XU100'e yönlendirilmişti; onunla kurulan taban elma/armut hatasını
     KALICI yapar. Gerçek XKTUM yoksa sıfırlama durur — yanlış tabanla
     kurulmaktansa hiç kurulmasın. */
  const xkSfr=(m.end&&m.end.XKTUM&&m.end.XKTUM.p)?m.end.XKTUM.p:null;
  if(!xkSfr){ alert('XKTUM canlı değeri alınamadı — sıfırlama yapılmadı.\n(XU100 ile kurulamaz: farklı endeks, taban kayar.)'); return; }
  if(!TRK||!TRK.holdings||!TRK.holdings.length){ alert('Sicil verisi (track.json) yüklenmedi.'); return; }
  const bugun=new Date().toISOString().slice(0,10);
  const p0={}, eksik=[];
  TRK.holdings.forEach(h=>{ const c=m.his[h.t];
    if(c&&c.p>0) p0[h.t]=c.p; else { eksik.push(h.t); p0[h.t]=h.p||h.p0; } });
  const kapsam=TRK.holdings.length-eksik.length;
  // EMNİYET: eksik fiyatla kurulan taban hayali getiri üretir. %80 altında durdur.
  if(kapsam < TRK.holdings.length*0.8){
    alert('Canlı fiyat kapsamı yetersiz: '+kapsam+'/'+TRK.holdings.length+'\n\nEksik: '+
      eksik.slice(0,10).join(', ')+(eksik.length>10?'…':'')+
      '\n\nSıfırlama YAPILMADI — eksik fiyatla kurulan taban getiriyi bozar. Fiyatlar yüklendikten sonra tekrar dene.');
    return; }
  if(!confirm('SİCİL SIFIRLANACAK\n\n'+
    '· Yeni kuruluş tarihi: '+bugun+'\n'+
    '· '+kapsam+'/'+TRK.holdings.length+' hissenin BUGÜNKÜ canlı fiyatı yeni kuruluş fiyatı olur\n'+
    '· XKTUM referansı: '+trN(xkSfr,2)+'\n'+
    (eksik.length?'· Fiyatı çözülemeyen '+eksik.length+' hisse son bilinen fiyatını kullanır\n':'')+
    '· ÖNCEKİ SERİ SİLİNİR (geri alınamaz)\n\nDevam edilsin mi?')) return;
  const baz={tarih:bugun, endeks0:xkSfr, p0:p0, kuruldu:new Date().toISOString()};
  try{ localStorage.setItem(TRK_BAZ, JSON.stringify(baz));
       localStorage.setItem('trk_seri_v1','[]'); }catch(e){}
  TRK.__statik=null; TRK.series=[{d:bugun,model:0,endeks:0}];
  trkBazUygula(); if(typeof canliEnjekte==='function') canliEnjekte();
  if(typeof trackRender==='function') trackRender();
}
function trackRender(){
  /* §245t NULL SAVUNMASI: endeks noktası artık null olabilir (gerçek XKTUM
     alınamazsa asla XU100'le doldurulmaz). Render bunu çökmeden taşımalı:
     null'lu noktalar endeks çizgisinden atlanır, etikette 'veri yok' yazar,
     alfa hesaplanamıyorsa '—'. */
  const s=TRK.series,son=s[s.length-1];
  const eSon=(son.endeks!=null&&isFinite(son.endeks))?son.endeks:null;
  const fark=(eSon==null)?null:(son.model-eSon);
  const fmtP=v=>(v==null||!isFinite(v))?'veri yok':((v>=0?'+':'')+v.toFixed(2).replace('.',',')+'%');
  $('trkSum').innerHTML=
    '<div class="card"><div class="lbl">Model (kuruluştan)</div><div class="val '+(son.model>=0?'up':'down')+'">'+fmtP(son.model)+'</div><div class="sub">'+(TRK.sepet||(TRK.holdings.length+' hisse'))+'</div></div>'+
    '<div class="card"><div class="lbl">'+TRK.endeks+' (kuruluştan)</div><div class="val '+(eSon==null?'':(eSon>=0?'up':'down'))+'">'+fmtP(son.endeks)+'</div><div class="sub">referans: '+trN(TRK.endeks_kapanis)+' ('+TRK.fiyat_tarihi+')</div></div>'+
    '<div class="card"><div class="lbl">Fark (alfa)</div><div class="val '+(fark==null?'':(fark>=0?'up':'down'))+'">'+fmtP(fark)+'</div><div class="sub">model − endeks</div></div>'+
    '<div class="card"><div class="lbl">Veri noktası</div><div class="val">'+s.length+'</div><div class="sub">son: '+son.d+'</div></div>';
  if(s.length>=2){
    $('trkChartBox').style.display='block';
    const all=s.flatMap(p=>[p.model,p.endeks]).filter(v=>v!=null&&isFinite(v));
    const mn=Math.min.apply(null,all),mx=Math.max.apply(null,all),rng=(mx-mn)||1;
    const X=i=>(i/(s.length-1))*690+5, Y=v=>140-((v-mn)/rng)*130+5-0;
    const line=key=>s.map((p,i)=>(p[key]==null||!isFinite(p[key]))?null:(X(i).toFixed(1)+','+Y(p[key]).toFixed(1))).filter(Boolean).join(' ');
    const zY=Y(0),lx=X(s.length-1);
    $('trkChart').innerHTML=
      ((mn<0&&mx>0)?'<line x1="5" y1="'+zY.toFixed(1)+'" x2="695" y2="'+zY.toFixed(1)+'" stroke="#E2EBE6" stroke-width="1" stroke-dasharray="4 3"/>':'')+
      '<polyline points="'+line('endeks')+'" fill="none" stroke="#B9C9C1" stroke-width="2"/>'+
      '<polyline points="'+line('model')+'" fill="none" stroke="#128A66" stroke-width="2.5"/>'+
      (eSon==null?'':'<circle cx="'+lx.toFixed(1)+'" cy="'+Y(eSon).toFixed(1)+'" r="3.2" fill="#B9C9C1"/>')+
      '<circle cx="'+lx.toFixed(1)+'" cy="'+Y(son.model).toFixed(1)+'" r="3.2" fill="#128A66"/>'+
      '<text x="8" y="14" font-family="IBM Plex Mono" font-size="10" font-weight="600" fill="#128A66">Model '+fmtP(son.model)+'</text>'+
      '<text x="120" y="14" font-family="IBM Plex Mono" font-size="10" fill="#8FA098">'+TRK.endeks+' '+fmtP(eSon)+'</text>';
    $('trkNote').textContent='İzlenen portföy: kuruluş günü varsayılan ağırlıklarla damgalanan resmi Top-25. Getiriler Fintables kapanışlarıyla her damgalı güncellemede hesaplanır; temettü ve işlem maliyeti hariçtir.';
  }else{
    $('trkNote').innerHTML='Sicil <em>bugün</em> kuruldu — ilk performans noktası bir sonraki damgalı güncellemede ("güncelle" komutuyla) eklenecek. İzlenen portföy tabloda görünen seçim değil, kuruluşta damgalanan resmi Top-25\u0027tir: ağırlık kutucuklarıyla oynaman sicili etkilemez. Bu disiplin önemli: sicil ancak <em>önceden ilan edilmiş</em> kurallarla tutulursa anlamlıdır — sonradan ağırlık değiştirip "aslında şöyle yapsaydık" demek sicil değil, hikâye olur.';
  }
}
function fmWeightsCalc(scores,secs){
  const MINW=FM.meta.minw,MAXW=FM.meta.maxw,CAP=FM.meta.seccap;
  const minv=Math.min.apply(null,scores);
  let w=scores.map(s=>Math.pow(s-minv+1e-6,FM.meta.walpha));
  let t=w.reduce((a,b)=>a+b,0);w=w.map(x=>x/t);
  function indClip(){
    for(let it=0;it<200;it++){
      const hi=w.map(x=>x>MAXW+1e-12),lo=w.map(x=>x<MINW-1e-12);
      if(!hi.some(Boolean)&&!lo.some(Boolean))break;
      w=w.map((x,i)=>hi[i]?MAXW:(lo[i]?MINW:x));
      const free=w.map((x,i)=>!hi[i]&&!lo[i]);
      const sumFixed=w.reduce((a,x,i)=>a+(free[i]?0:x),0);
      const sumFree=w.reduce((a,x,i)=>a+(free[i]?x:0),0);
      const resid=1-sumFixed;
      if(free.some(Boolean)&&resid>0){w=w.map((x,i)=>free[i]?resid*x/sumFree:x);}else break;
    }
  }
  function secCap(){
    const sw={};w.forEach((x,i)=>sw[secs[i]]=(sw[secs[i]]||0)+x);
    const over=Object.keys(sw).filter(s=>sw[s]>CAP+1e-9);
    if(!over.length)return true;
    let excess=0;const os=new Set(over);
    over.forEach(s=>{const v=sw[s];w=w.map((x,i)=>secs[i]===s?x*(CAP/v):x);excess+=v-CAP;});
    const us=w.reduce((a,x,i)=>a+(os.has(secs[i])?0:x),0);
    if(us>0)w=w.map((x,i)=>os.has(secs[i])?x:x+excess*x/us);
    return false;
  }
  for(let r=0;r<25;r++){indClip();const ok=secCap();
    const iok=w.every(x=>x<=MAXW+1e-9&&x>=MINW-1e-9);
    if(ok&&iok)break;}
  const tt=w.reduce((a,b)=>a+b,0);return w.map(x=>x/tt);
}
function fmRender(){
  if(!FM)return;
  const fmw={};let tot=0;
  FMF.forEach(k=>{const v=Math.max(0,+($('fmw'+k).value)||0);fmw[k]=v;tot+=v;});
  if(tot<=0){$('fmEff').textContent='en az bir ağırlık > 0 olmalı';return;}
  $('fmEff').textContent='etkin: '+FMF.map(k=>k.slice(0,3)+' %'+(fmw[k]/tot*100).toFixed(0)).join(' · ');
  const wArr=FMF.map(k=>fmw[k]);
  const rows=FM.data.map(r=>{
    const tw=wArr.reduce((a,b)=>a+b,0);
    if(tw<=0)return null;
    // Eksik faktör = nötr (0 z-skoru, yani sektör ortalaması): ne ödül ne ceza, ağırlık kaymaz.
    let sc=0,nn=0;r.f.forEach((v,i)=>{if(v!=null)nn++;sc+=(v!=null?v:0)*(wArr[i]/tw);});
    if(nn<(FM.meta.minfac||3))return null;
    return {t:r.t,s:r.s,f:r.f,n:r.n,score:sc};
  }).filter(Boolean);
  rows.sort((a,b)=>b.score-a.score);
  const sel=[],cnt={};
  for(const r of rows){
    if(sel.length>=FM.meta.topn)break;
    if((cnt[r.s]||0)>=FM.meta.maxnames)continue;
    sel.push(r);cnt[r.s]=(cnt[r.s]||0)+1;
  }
  const wts=fmWeightsCalc(sel.map(r=>r.score),sel.map(r=>r.s));
  const zf=v=>v==null?'<td class="num" style="color:var(--muted)">—</td>':'<td class="num '+(v>=0?'up':'down')+'">'+(v>=0?'+':'')+v.toFixed(2)+'</td>';
  $('fmBody').innerHTML=sel.map((r,i)=>'<tr data-t="'+r.t+'" style="cursor:pointer"><td class="num" style="color:var(--muted)">'+(i+1)+'</td><td><b>'+r.t+'</b></td><td style="font-family:var(--sans);font-size:10px;color:var(--muted)">'+r.s+'</td>'+zf(r.f[0])+zf(r.f[1])+zf(r.f[2])+zf(r.f[3])+zf(r.f[4])+'<td class="num" style="font-weight:600">'+r.score.toFixed(3)+'</td><td class="num" style="color:var(--mm2);font-weight:600">%'+(wts[i]*100).toFixed(1)+'</td></tr>').join('');
  document.querySelectorAll('#fmBody tr[data-t]').forEach(tr=>tr.addEventListener('click',()=>fmShowDetail(tr.dataset.t)));
  const inSel=new Set(sel.map(r=>r.t));
  const buf=rows.filter(r=>!inSel.has(r.t)).slice(0,15).map(r=>r.t);
  $('fmBuffer').textContent='Tampon bölge / izleme listesi (26–40 bandı — EXIT_RANK disiplini damgalı güncellemelerde uygulanır): '+buf.join(', ');
  const sw={};sel.forEach((r,i)=>sw[r.s]=(sw[r.s]||0)+wts[i]);
  const mx=Math.max.apply(null,Object.values(sw));
  $('fmSec').innerHTML=Object.entries(sw).sort((a,b)=>b[1]-a[1]).map(([s,v])=>'<div class="bar" style="grid-template-columns:150px 1fr 56px"><span class="bn">'+s+'</span><span class="bt"><span class="bf" style="width:'+(v/mx*100).toFixed(0)+'%"></span></span><span class="bv">%'+(v*100).toFixed(1)+'</span></div>').join('');
}
function fmShowDetail(t){
  const r=FM.data.find(x=>x.t===t);
  if(!r)return;
  const fMeta={VALUE:["VALUE","ucuzluk — düşük değerleme çarpanları (sektör içi)"],GROWTH:["GROWTH","büyüme — gelir/kazanç artış hızı (sektör içi)"],QUALITY:["QUALITY","kalite — kârlılık, düşük borç, verimlilik (sektör içi)"],MOMENTUM:["MOMENTUM","momentum — son dönem fiyat gücü (tüm evren)"],LOW_RISK:["LOW_RISK","düşük risk — düşük fiyat oynaklığı (tüm evren)"]};
  const fIdx={VALUE:0,GROWTH:1,QUALITY:2,MOMENTUM:3,LOW_RISK:4};
  const yorum=z=>z==null?"veri yok":z>=1?"çok güçlü":z>=0.3?"güçlü":z>-0.3?"nötr":z>-1?"zayıf":"çok zayıf";
  $("fmDetTitle").innerHTML='HİSSE DETAYI — <span style="color:var(--mm2)">'+r.t+'</span> <span style="font-weight:500;letter-spacing:0;text-transform:none;color:var(--muted)">'+r.s+' · '+r.n+' faktör</span>';
  if(r.m){
    const fLbl={VALUE:"VALUE (sektör içi)",GROWTH:"GROWTH (sektör içi)",QUALITY:"QUALITY (sektör içi)",MOMENTUM:"MOMENTUM (global)",LOW_RISK:"LOW_RISK (global)"};
    const groups={};
    FM.meta.metrics.forEach((mt,i)=>{(groups[mt.f]=groups[mt.f]||[]).push([mt,r.m[i]]);});
    const fmtX=x=>x==null?"—":Number(x).toLocaleString("tr-TR",{maximumFractionDigits:Math.abs(x)>=100?1:(Math.abs(x)>=1?2:4)});
    let html="";
    FMF.forEach(f=>{const g=groups[f]||[];if(!g.length)return;const fz=r.f[fIdx[f]];
      let rows2=g.map(([mt,mv])=>{const z=mv?mv[1]:null,x=mv?mv[0]:null;const zs=z==null?'<span style="color:var(--muted)">—</span>':'<span class="'+(z>=0?"up":"down")+'" style="font-weight:600">'+(z>=0?"+":"")+z.toFixed(2)+'</span>';return '<div class="kv"><span class="k">'+mt.n+(mt.hib?" ↑":" ↓")+'</span><span>'+fmtX(x)+' · z '+zs+'</span></div>';}).join("");
      html+='<div class="card" style="padding:8px 12px"><div class="lbl">'+fLbl[f]+' <span class="tag'+(fz==null?" snap":"")+'">'+(fz==null?"VERİ YOK":("z "+(fz>=0?"+":"")+fz.toFixed(2)))+'</span></div>'+rows2+'</div>';});
    $("fmDetBody").innerHTML=html;
  }else{
    let html='<div class="sub" style="margin-bottom:10px">Faktör z-skoru profili — z>0 kıyas grubundan iyi, z<0 kötü. (Metrik-metrik kırılım bu sürümde gömülü değil; faktör skorları aşağıda.)</div>';
    FMF.forEach((f,i)=>{const z=r.f[i];const ad=fMeta[f][0],acik=fMeta[f][1];
      const barW=Math.max(2,Math.min(98,50+(z==null?0:z)*22));
      const cls=z==null?"":(z>=0?"up":"down"),col=z==null?"var(--line2)":(z>=0?"var(--up)":"var(--down)");
      html+='<div style="margin-bottom:9px"><div style="display:flex;justify-content:space-between;align-items:baseline"><span style="font-weight:700;font-size:11px">'+ad+'</span><span class="num '+cls+'" style="font-weight:600">'+(z==null?"—":(z>=0?"+":"")+z.toFixed(2))+' <span style="color:var(--muted);font-weight:400;font-size:10px">'+yorum(z)+'</span></span></div><div class="bt" style="margin:3px 0"><span class="bf" style="width:'+barW+'%;background:'+col+'"></span></div><div class="sub">'+acik+'</div></div>';});
    const guclu=FMF.filter((f,i)=>r.f[i]!=null&&r.f[i]>=0.5).map(f=>fMeta[f][0]);
    const zayif=FMF.filter((f,i)=>r.f[i]!=null&&r.f[i]<=-0.5).map(f=>fMeta[f][0]);
    const eksik=FMF.filter((f,i)=>r.f[i]==null).map(f=>fMeta[f][0]);
    let ozet='<b>Profil özeti:</b> ';
    if(guclu.length)ozet+="güçlü tarafı "+guclu.join(", ")+". ";
    if(zayif.length)ozet+="zayıf tarafı "+zayif.join(", ")+". ";
    if(!guclu.length&&!zayif.length)ozet+="belirgin uç yok, dengeli profil. ";
    if(eksik.length)ozet+='<span style="color:var(--muted)">Veri yok: '+eksik.join(", ")+'.</span>';
    html+='<div class="note" style="margin-top:8px">'+ozet+'</div>';
    $("fmDetBody").innerHTML=html;
  }
  $("fmDetCard").style.display="block";
  $("fmDetCard").scrollIntoView({behavior:"smooth",block:"nearest"});
}
/* ---- COMMAND CENTER: pozisyonlar ---- */
let poz=JSON.parse(localStorage.getItem('poz_v1')||'[]');

/* ---- Portföy kayıt/geri çağırma (çoklu portföy) ---- */
const PF_KEY='ktp_portfoyler_v1';
function pozHisseSay(){ try{ return (poz||[]).filter(x=>x.tip==='hisse').length; }catch(e){ return 0; } }
function pfOku(){ try{ return JSON.parse(localStorage.getItem(PF_KEY)||'[]'); }catch(e){ return []; } }
function pfYaz(l){ try{ localStorage.setItem(PF_KEY,JSON.stringify(l)); }catch(e){ alert('Kayıt yapılamadı (tarayıcı deposu dolu olabilir).'); } }
function pfOzet(p){
  const d=(p||[]).reduce((s,x)=>s+(x.tip==='nakit'?(+x.adet||0):((+x.adet||0)*(+x.fiyat||0))),0);
  return { adet:(p||[]).length, deger:d,
           hisse:(p||[]).filter(x=>x.tip==='hisse').length,
           fon:(p||[]).filter(x=>x.tip==='fon').length,
           nakit:(p||[]).filter(x=>x.tip==='nakit').reduce((s,x)=>s+(+x.adet||0),0) };
}
function pfKaydet(){
  if(!poz||!poz.length){ alert('Kaydedilecek pozisyon yok.'); return; }
  const varsayilan='Portföy '+new Date().toLocaleDateString('tr-TR');
  const ad=(prompt('Portföy adı:', varsayilan)||'').trim();
  if(!ad)return;
  const l=pfOku();
  const eski=l.findIndex(x=>x.ad.toLocaleLowerCase('tr')===ad.toLocaleLowerCase('tr'));
  if(eski>=0 && !confirm('"'+ad+'" zaten var. Üzerine yazılsın mı?'))return;
  const kayit={ id:Date.now(), ad:ad, zaman:new Date().toISOString(),
                ozet:pfOzet(poz), poz:JSON.parse(JSON.stringify(poz)) };
  if(eski>=0)l[eski]=kayit; else l.unshift(kayit);
  pfYaz(l.slice(0,40)); pfRender();
  const m=$('pozmsg');
  if(m){ const bulut=(_origGet('ktpanel_wkey')||'').trim();
    m.textContent='"'+ad+'" kaydedildi'+(bulut?' · buluta senkronlanıyor…':' (yalnız bu tarayıcıda — yazma anahtarı yok)');
    setTimeout(()=>{m.textContent='';},3500); }
}
function pfYukle(id){
  const k=pfOku().find(x=>String(x.id)===String(id)); if(!k)return;
  if(poz&&poz.length&&!confirm('Mevcut portföyün ("'+pozHisseSay()+' hisse) yerine "'+k.ad+'" yüklenecek. Devam?'))return;
  poz=JSON.parse(JSON.stringify(k.poz)); savePoz(); pozTazele();
  if(typeof lensRender==='function')try{lensRender();}catch(e){}
  const m=$('pozmsg'); if(m){m.textContent='"'+k.ad+'" yüklendi.'; setTimeout(()=>{m.textContent='';},2500);}
  pfRender();
}
function pfSil(id){ const k=pfOku().find(x=>String(x.id)===String(id));
  if(k&&confirm('"'+k.ad+'" silinsin mi?')){ pfYaz(pfOku().filter(x=>String(x.id)!==String(id))); pfRender(); } }
function pfDisaAktar(id){
  const k=pfOku().find(x=>String(x.id)===String(id)); if(!k)return;
  const b=new Blob([JSON.stringify(k,null,1)],{type:'application/json'});
  const u=URL.createObjectURL(b), a2=document.createElement('a');
  a2.href=u; a2.download='ktpanel-portfoy-'+k.ad.replace(/[^\w\-]+/g,'_')+'.json'; a2.click();
  setTimeout(()=>URL.revokeObjectURL(u),1000);
}
function pfRender(){
  const el=$('pfListe'); if(!el)return;
  const l=pfOku();
  if(!l.length){ el.innerHTML='<div class="sub" style="font-size:11px">Kayıtlı portföy yok. Pozisyonları girdikten sonra <b>Portföyü Kaydet</b> ile saklayabilir, sonra buradan geri çağırabilirsin.</div>'; return; }
  el.innerHTML='<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:11px"><thead><tr style="border-bottom:1px solid var(--line2)">'+
    ['PORTFÖY','KAYIT','POZİSYON','DEĞER ₺',''].map((h,i)=>'<th style="text-align:'+(i<2?'left':'right')+';padding:5px 6px;font-size:9px;letter-spacing:.4px;color:var(--muted)">'+h+'</th>').join('')+
    '</tr></thead><tbody>'+l.map(k=>{
      const o=k.ozet||{};
      return '<tr style="border-bottom:1px solid var(--line)">'+
      '<td style="padding:5px 6px;font-weight:600">'+esc(k.ad)+'</td>'+
      '<td style="padding:5px 6px;font-family:var(--mono);color:var(--muted)">'+new Date(k.zaman).toLocaleDateString('tr-TR')+'</td>'+
      '<td style="padding:5px 6px;text-align:right;font-family:var(--mono)">'+(o.hisse||0)+'h'+(o.fon?' · '+o.fon+'f':'')+'</td>'+
      '<td style="padding:5px 6px;text-align:right;font-family:var(--mono);font-weight:700;color:var(--mm2)">'+trN(o.deger||0,0)+'</td>'+
      '<td style="padding:5px 6px;text-align:right;white-space:nowrap">'+
        '<button class="btn" data-pfy="'+k.id+'" style="font-size:10px;padding:2px 7px">Yükle</button> '+
        '<button class="btn" data-pfd="'+k.id+'" style="font-size:10px;padding:2px 6px;opacity:.7">↓</button> '+
        '<button class="btn" data-pfs="'+k.id+'" style="font-size:10px;padding:2px 6px;opacity:.6">Sil</button></td></tr>';
    }).join('')+'</tbody></table></div>';
}
function pfInit(){
  const b=$('pfKaydet'); if(b)b.addEventListener('click',pfKaydet);
  const el=$('pfListe');
  if(el)el.addEventListener('click',e=>{
    const t=e.target; if(!t.getAttribute)return;
    const y=t.getAttribute('data-pfy'), s=t.getAttribute('data-pfs'), d=t.getAttribute('data-pfd');
    if(y)pfYukle(y); else if(s)pfSil(s); else if(d)pfDisaAktar(d);
  });
  pfRender();
}
/* ── pozCiz / pozTazele ── pozisyon degisince bagli TUM kartlari yenile (§106, §107)
   §106 KOK: mutasyon noktalari yalniz renderPoz() cagiriyordu; Portfoy Yonetimi
   kartlari acilista BIR KEZ ciziliyordu -> portfoy degisince eski kaliyorlardi.
   §107 IKINCI KOK: kartlar tazelendi ama TAZE FIYAT YOKTU. pozFiyatOto() portfoy
   hisselerinin canli fiyatini cekip CANLI_FIYAT'a yazar, AMA yalniz acilista
   (boot listesi, 5 sn gecikmeli) kosuyordu. Portfoy sonradan yuklenince kimse
   onu cagirmiyordu -> kart, kaydedilmis portfoydeki ESKI fiyatla ciziliyordu.
   Bu yuzden tazeleme IKI ADIMLIDIR: once ciz (arayuz aninda tepki versin),
   sonra canli fiyati cek ve YENIDEN ciz.
   OZYINELEME TUZAGI: pozFiyatOto sonunda tazeleme cagirir; oradan pozCiz()
   cagrilir (pozTazele DEGIL), yoksa sonsuz dongu olur.
   §106 DERSININ KENDIME UYGULANMASI: `typeof f==='function'` kalkani savunma
   degil SESSIZLESTIRICIDIR. Ilk surumde bunu tekrarlamisim. Artik bulunamayan
   gorev console.error ile RAPORLANIR — sessizce atlanmaz. */
const POZ_GOREV=['renderPoz','anaRender','atifRender','riskMetRender',
                 'likiditeRender','reelAtifRender','riskButceRender'];
function pozCiz(){
  const eksik=[];
  POZ_GOREV.forEach(ad=>{
    const f=window[ad];
    if(typeof f!=='function'){ eksik.push(ad); return; }
    try{ f(); }catch(e){ console.error('[KTPanel] pozCiz → '+ad+' hata verdi:', (e&&e.message)||e); }
  });
  if(eksik.length) console.error('[KTPanel] pozCiz: TANIMSIZ FONKSIYON — '+eksik.join(', ')+
    ' (isim degismis olabilir; §106 usRender/pozRender vakalari)');
  pozDamga();
}
/* Atif kartinin altina fiyat tazeligi damgasi — "bu kart guncel mi" sorusu
   goz kararina birakilmasin. atifRender'a DOKUNULMAZ, damga disaridan eklenir. */
function pozDamga(){
  const el=document.getElementById('atifBody'); if(!el||!el.firstChild) return;
  let d=document.getElementById('atifDamga');
  if(!d){ d=document.createElement('div'); d.id='atifDamga'; d.className='sub';
          d.style.cssText='font-size:10px;margin-top:6px'; el.appendChild(d); }
  const s=(typeof POZ_FIYAT_SAAT!=='undefined'&&POZ_FIYAT_SAAT)?POZ_FIYAT_SAAT:null;
  d.innerHTML = s
    ? 'Fiyatlar canlı · son çekim <b>'+s+'</b>'
    : '<span style="color:var(--down)">⚠ Canlı fiyat henüz çekilmedi</span> — getiriler kayıtlı/anlık girilen fiyata göre. Command Center’da fiyat tazelenince otomatik düzelir.';
}
async function pozTazele(fiyatCek){
  pozCiz();                                   // 1) hemen ciz
  if(fiyatCek===false) return;
  try{ if(typeof pozFiyatOto==='function') await pozFiyatOto(); }   // 2) canli fiyat
  catch(e){ console.warn('[KTPanel] pozTazele: canli fiyat cekilemedi:', (e&&e.message)||e); }
}
function savePoz(){localStorage.setItem('poz_v1',JSON.stringify(poz));}


/* ---- Faktör Model Karnesi: skor vs gerçekleşen getiri (canlı doğrulama) ---- */
let FM_KARNE_FIYAT=null;
async function fmKarne(){
  const el=$('fmKarneBody'); if(!el||!FM||!FM.data)return;
  try{
    // Kompozit skor (eşit ağırlık — slider'dan bağımsız sabit referans)
    const skorlu=FM.data.map(h=>({t:h.t, skor:h.f.reduce((a,b)=>a+b,0)/h.f.length}))
      .sort((a,b)=>b.skor-a.skor);
    const ilk=skorlu.slice(0,10), son=skorlu.slice(-10);
    const kodlar=[...ilk,...son].map(x=>x.t);
    if(!FM_KARNE_FIYAT){
      const r=await fetch('/api/market?mod=fiyat&kodlar='+encodeURIComponent(kodlar.join(',')));
      const d=r.ok?await r.json():null;
      FM_KARNE_FIYAT=(d&&d.ok&&d.fiyat)?d.fiyat:{};
    }
    const getiri=(x)=>{
      const snap=MFIYAT[x.t], canli=FM_KARNE_FIYAT[x.t];
      return (snap&&canli&&isFinite(snap)&&isFinite(canli))?((canli/snap-1)*100):null;
    };
    const ort=(dizi)=>{const g=dizi.map(getiri).filter(v=>v!=null);return g.length?{o:g.reduce((a,b)=>a+b,0)/g.length,n:g.length}:null;};
    const gI=ort(ilk), gS=ort(son);
    if(!gI||!gS){el.innerHTML='<div class="sub">Karne için snapshot/canlı fiyat kesişimi yetersiz (kapsam: multiple.json).</div>';return;}
    const makas=gI.o-gS.o;
    const cls=makas>0?'up':'down';
    const yorum=makas>1?'model ÇALIŞIYOR — yüksek skor kazandırıyor':(makas>-1?'nötr — ayrışma henüz zayıf':'TERS — düşük skor önde (rejim/model sorgusu)');
    el.innerHTML=
      '<div class="kv"><span class="k">İlk 10 (yüksek kompozit) ort. getiri</span><span class="'+(gI.o>=0?'up':'down')+'" style="font-weight:600">'+(gI.o>=0?'+':'')+trN(gI.o,1)+'% <span class="sub" style="display:inline">('+gI.n+' hisse)</span></span></div>'+
      '<div class="kv"><span class="k">Son 10 (düşük kompozit) ort. getiri</span><span class="'+(gS.o>=0?'up':'down')+'">'+(gS.o>=0?'+':'')+trN(gS.o,1)+'% <span class="sub" style="display:inline">('+gS.n+' hisse)</span></span></div>'+
      '<div class="kv"><span class="k">Skor makası (ilk − son)</span><span class="'+cls+'" style="font-weight:700;font-size:15px">'+(makas>=0?'+':'')+trN(makas,1)+' puan</span></div>'+
      '<div class="kv"><span class="k">Okuma</span><span>'+yorum+'</span></div>';
  }catch(e){ el.innerHTML='<div class="sub">Karne hesaplanamadı.</div>'; }
}

/* ---- Hisse fiyatları otomatik tazeleme (panel açılışı + Portföy sekmesi) ---- */
let POZ_FIYAT_SAAT=null;
async function pozFiyatOto(){
  try{
    const hisseler=(poz||[]).filter(p=>p.tip==='hisse'&&p.kod);
    if(!hisseler.length)return;
    const kodlar=[...new Set(hisseler.map(p=>String(p.kod).toUpperCase()))].join(',');
    const r=await fetch('/api/market?mod=fiyat&kodlar='+encodeURIComponent(kodlar));
    if(!r.ok)return;
    const d=await r.json();
    if(!(d&&d.ok&&d.fiyat))return;
    let n=0;
    poz.forEach(p=>{
      if(p.tip!=='hisse')return;
      const f=d.fiyat[String(p.kod).toUpperCase()];
      if(f!=null&&isFinite(f)&&f>0){p.fiyat=f;n++;
        if(typeof CANLI_FIYAT!=='undefined')CANLI_FIYAT[String(p.kod).toUpperCase()]=f;}
    });
    if(n>0){
      POZ_FIYAT_SAAT=new Date().toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'});
      savePoz();
      pozCiz();   // pozTazele DEGIL — ozyineleme olurdu (§107). ÖNCE: pozRender() (tanimsizdi, §106)
    }
  }catch(e){}
}
async function tefasFiyat(kod){
  if(FONDATA[kod])return FONDATA[kod][0];
  const r=await fetch('/api/tefas?fon='+encodeURIComponent(kod));const j=await r.json();
  if(!r.ok||j.error)throw new Error(j.error||'Hata');return j.sonFiyat;
}
/* ---- Risk Lensi & Stres Testi ---- */
const SEKTOR_BETA={'Energy':[0.30,-0.10,0.45],'Materials':[0.40,-0.20,-0.10],'Industrials':[0.30,-0.30,-0.15],'Financials':[-0.10,-0.40,0.00],'Consumer Discretionary':[-0.30,-0.40,-0.10],'Consumer Staples':[-0.20,-0.15,-0.05],'Utilities':[-0.05,-0.30,-0.15],'Information Technology':[-0.15,-0.35,0.00],'Health Care':[-0.20,-0.20,0.00],'Real Estate':[-0.10,-0.50,0.00]};
const SEKTOR_TR={'Energy':'Enerji','Materials':'Malzeme','Industrials':'Sanayi','Financials':'Finans','Consumer Discretionary':'İsteğe Bağlı Tük.','Consumer Staples':'Temel Tüketim','Utilities':'Kamu Hizmetleri','Information Technology':'Teknoloji','Health Care':'Sağlık','Real Estate':'Gayrimenkul'};
function pozHisse(){
  const kapsanan=[],disi=[];
  poz.filter(p=>p.tip!=='nakit').forEach(p=>{const d=FM?FM.data.find(x=>x.t===p.kod):null;const deg=p.adet*p.fiyat;if(d&&SEKTOR_BETA[d.s])kapsanan.push({kod:p.kod,deger:deg,s:d.s,f:d.f});else disi.push(p.kod);});
  const kapT=kapsanan.reduce((s,x)=>s+x.deger,0);
  kapsanan.forEach(x=>x.w=kapT?x.deger/kapT:0);
  return {kapsanan,disi,kapT};
}
async function riskStresGuncelle(){
  if(!FM){try{FM=await (await fetch('/fm.json',{cache:'no-store'})).json();}catch(e){return;}}
  riskLens();korLens();stresTest();
}
function riskLens(){
  const {kapsanan,disi}=pozHisse();
  const sEl=$('rlSektor'),fEl=$('rlFaktor');
  if(!kapsanan.length){sEl.innerHTML='<div class="sub">Faktör modeli evreninde hisse pozisyonu yok.</div>';fEl.innerHTML='<div class="sub">—</div>';$('rlHHI').textContent='—';$('rlSektorNote').textContent='';$('rlFaktorNote').textContent='';return;}
  const sekW={};kapsanan.forEach(x=>sekW[x.s]=(sekW[x.s]||0)+x.w);
  const sekArr=Object.entries(sekW).sort((a,b)=>b[1]-a[1]);
  const hhi=sekArr.reduce((s,a)=>s+a[1]*a[1],0);
  const top3=sekArr.slice(0,3).reduce((s,a)=>s+a[1],0);
  sEl.innerHTML=sekArr.map(a=>'<div class="bar"><span class="bn">'+(SEKTOR_TR[a[0]]||a[0])+'</span><span class="bt"><span class="bf" style="width:'+(a[1]*100).toFixed(0)+'%"></span></span><span class="bv">%'+(a[1]*100).toFixed(1)+'</span><span class="bk"></span></div>').join('');
  $('rlHHI').textContent='HHI '+(hhi*100).toFixed(0);
  const hhiYorum=hhi>0.30?'çok yoğun':hhi>0.18?'yoğun':'dengeli';
  $('rlSektorNote').innerHTML='En büyük 3 sektör portföyün <em>%'+(top3*100).toFixed(0)+'</em>&#39;i. Yoğunlaşma (HHI) <em>'+hhiYorum+'</em>: '+(hhi>0.25?'tek bir makro temaya fazla bağlısın — çeşitlendirme faydalı olabilir.':'sektör dağılımı makul.')+(disi.length?' Kapsam dışı: '+disi.join(', ')+'.':'');
  const fAvg=[0,0,0,0,0];kapsanan.forEach(x=>x.f.forEach((v,i)=>{if(v!=null)fAvg[i]+=x.w*v;}));
  const flbl=['Değer','Büyüme','Kalite','Momentum','Düşük Risk'];
  fEl.innerHTML=fAvg.map((v,i)=>'<div class="kv"><span class="k">'+flbl[i]+'</span><span class="'+(v>=0?'up':'down')+'" style="font-family:var(--mono);font-weight:600">'+(v>=0?'+':'')+v.toFixed(2)+'σ</span></div>').join('');
  let mI=0;fAvg.forEach((v,i)=>{if(Math.abs(v)>Math.abs(fAvg[mI]))mI=i;});
  $('rlFaktorNote').innerHTML='En belirgin eğilim <em>'+flbl[mI]+'</em> ('+(fAvg[mI]>=0?'+':'')+fAvg[mI].toFixed(2)+'σ). Bu, seçimlerinin ortak DNA&#39;sı — pozitif değer o faktörde evren ortalamasının üstünde demek. Faktör kimliği "neden hep birlikte hareket ediyorlar" sorusunu yanıtlar.';
}
function korLens(){
  if(!$('korOzet'))return;
  const {kapsanan}=pozHisse();
  if(kapsanan.length<2){$('korOzet').innerHTML='<div class="sub">Çeşitlendirme analizi için faktör evreninde en az 2 hisse pozisyonu gerekir.</div>';$('korCift').innerHTML='';$('korNote').textContent='';return;}
  const tw=kapsanan.reduce((s,x)=>s+x.w,0)||1, ws=kapsanan.map(x=>x.w/tw);
  const hhi=ws.reduce((s,w)=>s+w*w,0), eff=1/hhi, n=kapsanan.length, cesit=eff/n*100;
  const cos=(a,b)=>{let d=0,na=0,nb=0;for(let i=0;i<5;i++){const av=a[i]||0,bv=b[i]||0;d+=av*bv;na+=av*av;nb+=bv*bv;}return (na&&nb)?d/Math.sqrt(na*nb):0;};
  const cift=[];
  for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)cift.push({a:kapsanan[i].kod,b:kapsanan[j].kod,c:cos(kapsanan[i].f,kapsanan[j].f)});
  cift.sort((x,y)=>y.c-x.c);
  const ortKor=cift.reduce((s,c)=>s+c.c,0)/cift.length;
  const effYorum=cesit>=80?'iyi dağılmış':cesit>=60?'makul':'konsantre';
  $('korOzet').innerHTML=
    '<div class="kv"><span class="k">Gerçek pozisyon</span><span><b>'+(typeof pozHisseSay==='function'?pozHisseSay():n)+' hisse</b>'+
      ((typeof pozHisseSay==='function'&&pozHisseSay()>n)?'<span class="sub" style="font-size:9px"> · '+n+'\'i modelde</span>':'')+'</span></div>'+
    '<div class="kv"><span class="k">Efektif hisse (1/Σw²)</span><span><b>'+eff.toFixed(1)+'</b></span></div>'+
    '<div class="kv"><span class="k">Ağırlık dağılımı</span><span class="'+(cesit>=60?'up':'down')+'" style="font-weight:600">%'+cesit.toFixed(0)+' · '+effYorum+'</span></div>'+
    '<div class="kv"><span class="k">Ort. faktör benzerliği</span><span class="'+(ortKor<=0.3?'up':ortKor<=0.5?'':'down')+'" style="font-family:var(--mono);font-weight:600">'+ortKor.toFixed(2)+'</span></div>';
  $('korCift').innerHTML=cift.slice(0,4).map(c=>'<div class="kv"><span class="k">'+c.a+' ↔ '+c.b+'</span><span class="'+(c.c>=0.6?'down':c.c>=0.3?'':'up')+'" style="font-family:var(--mono);font-weight:600">'+c.c.toFixed(2)+'</span></div>').join('');
  const eb=cift[0];
  $('korNote').innerHTML='<b>Efektif hisse ('+eff.toFixed(1)+' / '+n+' modeldeki hisse)</b>: ağırlık ne kadar dengeli dağılmış — gerçek sayıya yakınsa iyi. <b>Faktör benzerliği</b>: 1\u0027e yakın çiftler farklı hisseler olsa da <em>aynı DNA</em>yı taşır ('+eb.a+' ↔ '+eb.b+': '+eb.c.toFixed(2)+'). Kâğıtta çeşitli görünüp kriz anında birlikte düşen pozisyonları yakalar — gerçek çeşitlendirme, <em>düşük</em> faktör-benzerliğidir.';
}
function stresTest(){
  const kur=+$('stresKur').value,faiz=+$('stresFaiz').value,pet=+$('stresPet').value;
  $('stresKurV').textContent=(kur>=0?'+':'')+kur+'%';$('stresFaizV').textContent=(faiz>=0?'+':'')+faiz+'bp';$('stresPetV').textContent=(pet>=0?'+':'')+pet+'%';
  const {kapsanan,disi}=pozHisse(),el=$('stresSonuc');
  if(!kapsanan.length){el.innerHTML='<div class="sub">Faktör modeli evreninde hisse pozisyonu yok.</div>';return;}
  let portEtki=0;const detay=[];
  kapsanan.forEach(x=>{const b=SEKTOR_BETA[x.s],e=(kur/10)*b[0]+(faiz/100)*b[1]+(pet/10)*b[2];portEtki+=x.w*e;detay.push({kod:x.kod,e});});
  detay.sort((a,b)=>a.e-b.e);
  const cls=portEtki>=0?'up':'down',enKotu=detay.slice(0,2),enIyi=detay.slice(-2).reverse();
  el.innerHTML='<div style="display:flex;align-items:baseline;gap:10px;margin-bottom:8px"><span class="lbl" style="margin:0">TAHMİNİ PORTFÖY ETKİSİ</span><span class="val '+cls+'" style="font-size:22px">'+(portEtki>=0?'+':'')+portEtki.toFixed(2)+'%</span></div><div class="kv"><span class="k">En olumsuz</span><span>'+enKotu.map(d=>d.kod+' ('+(d.e>=0?'+':'')+d.e.toFixed(1)+'%)').join(' · ')+'</span></div><div class="kv"><span class="k">En olumlu</span><span>'+enIyi.map(d=>d.kod+' ('+(d.e>=0?'+':'')+d.e.toFixed(1)+'%)').join(' · ')+'</span></div>'+(disi.length?'<div class="kv"><span class="k">Kapsam dışı</span><span>'+disi.join(', ')+'</span></div>':'');
}
/* ---- Yield Curve Laboratuvarı ---- */



function renderPoz(){
  const tb=document.querySelector('#ptab tbody');
  const toplam=poz.reduce((s,p)=>s+p.adet*p.fiyat,0);
  if(!poz.length){tb.innerHTML='<tr><td colspan="9" style="color:var(--muted)">Henüz pozisyon yok.</td></tr>';}
  else{
    tb.innerHTML=poz.map((p,i)=>{
      const deger=p.adet*p.fiyat,w=toplam?deger/toplam*100:0;
      const gz=p.tip==='nakit'?null:(p.maliyet>0?((p.fiyat/p.maliyet-1)*100):null);
      return '<tr><td>'+p.tip+'</td><td><b>'+esc(p.kod)+'</b></td><td class="num">'+trN(p.adet,p.tip==='nakit'?0:2)+'</td><td class="num">'+(p.tip==='nakit'?'—':trN(p.maliyet,4))+'</td><td class="num">'+(p.tip==='nakit'?'—':trN(p.fiyat,4))+'</td><td class="num">'+trN(deger,0)+'</td><td class="num">%'+trN(w,1)+'</td>'+(gz==null?'<td class="num">—</td>':pct(+gz.toFixed(2)))+'<td>'+(p.tip==='fon'?'<button class="btn mini3" data-r="'+i+'">↻</button> ':'')+'<button class="btn mini2" data-i="'+i+'">sil</button></td></tr>';
    }).join('');
    tb.querySelectorAll('button[data-i]').forEach(b=>b.addEventListener('click',e=>{poz.splice(+e.target.dataset.i,1);savePoz();pozTazele();}));
    tb.querySelectorAll('button[data-r]').forEach(b=>b.addEventListener('click',async e=>{
      const i=+e.target.dataset.r;e.target.disabled=true;
      try{poz[i].fiyat=await tefasFiyat(poz[i].kod);savePoz();pozTazele();}catch(err){$('pozmsg').textContent='Hata: '+err.message;e.target.disabled=false;}
    }));
  }
  /* şerit */
  const maliyetT=poz.reduce((s,p)=>s+p.adet*(p.tip==='nakit'?1:p.maliyet),0);
  const nakit=poz.filter(p=>p.tip==='nakit').reduce((s,p)=>s+p.adet*p.fiyat,0);
  $('ccVal').textContent=poz.length?trN(toplam,0)+' ₺':'—';
  const ret=maliyetT>0?((toplam/maliyetT-1)*100):null;
  const rEl=$('ccRet');
  if(ret==null||!poz.length){rEl.textContent='—';rEl.className='val';}
  else{rEl.textContent=(ret>=0?'+':'')+trN(ret)+'%';rEl.className='val '+(ret>=0?'up':'down');}
  let top=null;poz.forEach(p=>{const d=p.adet*p.fiyat;if(p.tip!=='nakit'&&(!top||d>top.d))top={kod:p.kod,d};});
  const topW=top&&toplam?top.d/toplam*100:0;
  $('ccTop').textContent=top?top.kod+' %'+trN(topW,1):'—';
  $('ccCash').textContent=poz.length?'%'+trN(toplam?nakit/toplam*100:0,1):'—';
  $('ccN').textContent=poz.length||'—';
  /* uyarılar */
  const w=$('ccWarn');
  if(!poz.length){w.className='note';w.innerHTML='Pozisyon ekleyerek başla. Fon seçersen fiyat TEFAS\u0027tan otomatik çekilir; hisse fiyatı girişte yazdığın değerle başlar, sonrasında panel açılışlarında Yahoo\u0027dan otomatik tazelenir. Getiriler maliyete göredir.';}
  else if(topW>35){w.className='note warn';w.innerHTML='<em>Konsantrasyon uyarısı:</em> '+esc(top.kod)+' portföyün %'+trN(topW,1)+'\u0027i. Tek pozisyonun %35\u0027i aşması, portföy getirisini tek hikayeye bağlar — Journal\u0027daki tezinin bu ağırlığı hak edip etmediğini sorgula.'}
  else if(toplam>0&&nakit/toplam<0.02){w.className='note warn';w.innerHTML='<em>Likidite notu:</em> nakit %2\u0027nin altında. 17–29 Temmuz olay penceresinde fırsat alımı için kuru barut kalmamış.';}
  else{w.className='note';w.innerHTML='Dağılım dengeli görünüyor. Hisse fiyatları panel her açılışında ve bu sekmeye her girişte Yahoo\u0027dan otomatik tazelenir'+(POZ_FIYAT_SAAT?' (son: '+POZ_FIYAT_SAAT+')':'')+'; fonlarda ↻ TEFAS\u0027tan çeker.';}
  riskStresGuncelle();
}



['stresKur','stresFaiz','stresPet'].forEach(id=>$(id).addEventListener('input',stresTest));
document.querySelectorAll('button[data-preset]').forEach(b=>b.addEventListener('click',()=>{const P={iran:[15,300,25],dezenf:[-3,-500,-10],yumusak:[5,-200,0],sifir:[0,0,0]}[b.dataset.preset];$('stresKur').value=P[0];$('stresFaiz').value=P[1];$('stresPet').value=P[2];stresTest();}));
$('pozEkle').addEventListener('click',async()=>{
  const tip=$('pTip').value,kod=($('pKod').value||'').trim().toUpperCase();
  const adet=+$('pAdet').value,maliyet=+$('pMaliyet').value;let fiyat=+$('pFiyat').value;
  const msg=$('pozmsg');
  if(tip==='nakit'){if(!adet){msg.textContent='Tutar gir.';return;}poz.push({tip,kod:kod||'NAKİT',adet,maliyet:1,fiyat:1});}
  else{
    if(!kod||!adet){msg.textContent='Kod ve adet gerekli.';return;}
    if(tip==='fon'&&!fiyat){
      msg.textContent='TEFAS\u0027tan fiyat çekiliyor…';
      try{fiyat=await tefasFiyat(kod);}catch(e){msg.textContent='Hata: '+e.message;return;}
    }
    if(!fiyat){msg.textContent='Güncel fiyat gir (hisse için elle).';return;}
    poz.push({tip,kod,adet,maliyet:maliyet||fiyat,fiyat,tar:(($('pTar')&&$('pTar').value)||'').trim()||undefined});
  }
  savePoz();pozTazele();msg.textContent='Eklendi.';
  ['pKod','pAdet','pMaliyet','pFiyat','pTar'].forEach(id=>{if($(id))$(id).value='';});
});
renderPoz();
/* ---- INVESTMENT JOURNAL ---- */
let jrnl=JSON.parse(localStorage.getItem('journal_v1')||'[]');
function saveJ(){localStorage.setItem('journal_v1',JSON.stringify(jrnl));}
function renderJ(){
  const el=$('jList');
  if(!jrnl.length){el.innerHTML='<div class="sub">Henüz tez yok — ilk pozisyonunun hikayesini yaz.</div>';return;}
  el.innerHTML=jrnl.map((j,i)=>'<div class="card jcard"><div class="jhead"><b>'+esc(j.kod)+'</b><span>Hedef: '+esc(j.hedef||'—')+'</span><span class="jdate">'+esc(j.tarih)+'</span><button class="btn mini2" data-i="'+i+'">sil</button></div>'
    +'<div class="jfield"><span class="jl">Tez</span>'+esc(j.tez)+'</div>'
    +(j.kat?'<div class="jfield"><span class="jl">Katalizörler</span>'+esc(j.kat)+'</div>':'')
    +(j.boz?'<div class="jfield"><span class="jl">Tezi Bozacaklar</span>'+esc(j.boz)+'</div>':'')
    +'</div>').join('');
  el.querySelectorAll('button').forEach(b=>b.addEventListener('click',e=>{jrnl.splice(+e.target.dataset.i,1);saveJ();renderJ();}));
}
$('jEkle').addEventListener('click',()=>{
  const kod=($('jKod').value||'').trim().toUpperCase(),tez=($('jTez').value||'').trim();
  if(!kod||!tez)return;
  jrnl.unshift({kod,tez,hedef:($('jHedef').value||'').trim(),kat:($('jKat').value||'').trim(),boz:($('jBoz').value||'').trim(),tarih:new Date().toLocaleDateString('tr-TR')});
  saveJ();renderJ();
  ['jKod','jHedef','jTez','jKat','jBoz'].forEach(id=>$(id).value='');
});
renderJ();
/* ---- HABER AKIŞI ---- */
let haberLoaded=false,haberFiltre='portfoy';
const TIP_ETIKET={FR:'BİLANÇO',ODA:'ÖZEL DURUM',DUY:'DUYURU',DG:'DİĞER',CA:'KURUMSAL',HBR:'HABER'};
const TIP_RENK={FR:'var(--mm2)',ODA:'var(--text)',DUY:'var(--muted)',DG:'var(--muted)',CA:'var(--blue)'};
let KAP=null,kapFiltre='evren',kapEvren=null;
function kapSaat(ts){const d=new Date(ts);return isNaN(d)?'':d.toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'});}
function kapRender(){
  const el=$('kapAkis');if(!el)return;
  if(!KAP||!KAP.items||!KAP.items.length){el.innerHTML='<div class="note">'+(KAP&&KAP.err?esc(KAP.err):'Veri bekleniyor…')+'</div>';return;}
  const ev=kapEvren||new Set(), t40=new Set(TOP40);
  let liste=KAP.items.filter(h=>h.k.some(k=>ev.size?ev.has(k):true));
  if(kapFiltre==='top40')liste=liste.filter(h=>h.k.some(k=>t40.has(k)));
  if(kapFiltre==='onemli')liste=liste.filter(h=>h.o>=2);
  if(!liste.length){el.innerHTML='<div class="note">Bu filtrede güncel bildirim yok.</div>';return;}
  el.innerHTML=liste.slice(0,60).map(h=>{
    const yon=h.y>0?'<span style="color:var(--up);font-weight:700">▲</span>':h.y<0?'<span style="color:var(--down);font-weight:700">▼</span>':'<span style="color:var(--muted)">•</span>';
    const kod=h.k.map(k=>'<b style="color:'+(t40.has(k)?'var(--mm2)':'var(--text)')+'">'+esc(k)+'</b>').join(' ');
    const tip='<span style="font-size:8px;letter-spacing:.5px;color:'+(TIP_RENK[h.t]||'var(--muted)')+'">'+esc(TIP_ETIKET[h.t]||h.t)+'</span>';
    const vur=h.o>=2?'border-left:2px solid var(--mm2);padding-left:6px;':'padding-left:8px;';
    return '<div style="'+vur+'margin:3px 0;display:flex;gap:6px;align-items:baseline"><span class="thin" style="min-width:34px">'+kapSaat(h.ts)+'</span>'+yon+'<span style="min-width:52px">'+kod+'</span>'+tip+'<span style="flex:1">'+esc(h.b)+'</span><a href="'+esc(h.url)+'" target="_blank" rel="noopener" style="color:var(--blue)">KAP↗</a></div>';
  }).join('');
}
async function kapCek(){
  try{
    const r=await fetch('/api/kap');KAP=await r.json();
    $('kapDurum').textContent=(KAP.ok?'canlı · ':'kaynak yanıt vermiyor · ')+new Date().toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'});
  }catch(e){$('kapDurum').textContent='bağlantı hatası';KAP=KAP||{items:[]};}
  kapRender();
}
let USN=null;
function usRender(){
  const el=$('usAkis');if(!el)return;
  if(!USN||!USN.items||!USN.items.length){el.innerHTML='<div class="note">'+(USN&&USN.err?esc(USN.err):'Veri bekleniyor…')+'</div>';return;}
  el.innerHTML=USN.items.slice(0,40).map(h=>{
    const yon=h.y>0?'<span style="color:var(--up);font-weight:700">▲</span>':h.y<0?'<span style="color:var(--down);font-weight:700">▼</span>':'<span style="color:var(--muted)">•</span>';
    const kod=h.k.map(k=>'<b>'+esc(k)+'</b>').join(' ');
    const tip='<span style="font-size:8px;letter-spacing:.5px;color:'+(TIP_RENK[h.t]||'var(--muted)')+'">'+esc(TIP_ETIKET[h.t]||h.t)+'</span>';
    const vur=h.o>=2?'border-left:2px solid var(--mm2);padding-left:6px;':'padding-left:8px;';
    return '<div style="'+vur+'margin:3px 0;display:flex;gap:6px;align-items:baseline"><span class="thin" style="min-width:34px">'+kapSaat(h.ts)+'</span>'+yon+'<span style="min-width:70px">'+kod+'</span>'+tip+'<span style="flex:1">'+esc(h.b)+' <span class="thin">('+esc(h.src||'')+')</span></span><a href="'+esc(h.url)+'" target="_blank" rel="noopener" style="color:var(--blue)">↗</a></div>';
  }).join('');
}
async function usCek(){
  try{
    const r=await fetch('/api/usnews');USN=await r.json();
    $('usDurum').textContent=(USN.ok?'canlı · ':'kaynak sorunu · ')+new Date().toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'});
  }catch(e){$('usDurum').textContent='bağlantı hatası';USN=USN||{items:[]};}
  usRender();
}
function usInit(){ if(!$('usAkis'))return; usCek(); setInterval(usCek,1800000); }
async function kapInit(){
  if(!$('kapAkis'))return;
  try{const f=FM||await (await fetch('/fm.json',{cache:'no-store'})).json();kapEvren=new Set(f.data.map(r=>r.t));}catch(e){kapEvren=new Set();}
  document.querySelectorAll('.kfilt').forEach(b=>b.addEventListener('click',()=>{
    document.querySelectorAll('.kfilt').forEach(x=>x.classList.remove('act'));b.classList.add('act');
    kapFiltre=b.dataset.f;kapRender();
  }));
  kapCek();setInterval(kapCek,600000);usInit();
  haberCanliCek(); setInterval(haberCanliCek,1800000);
}
function haberInit(){
  kapInit();
  document.querySelectorAll('.hfilt').forEach(b=>b.addEventListener('click',()=>{
    document.querySelectorAll('.hfilt').forEach(x=>x.classList.remove('act'));
    b.classList.add('act');haberFiltre=b.dataset.f;haberRender();
  }));
  haberRender();
}

/* ---- Analist notları: KAP'tan otomatik (yorumlu) ---- */
let HABER_CANLI=null;
async function haberCanliCek(){
  /* §245d SESSİZ YEDEĞE DÜŞME. Eski hali: `catch(e){}` — hiçbir şey. Ve
     `if(j&&j.ok&&...)` koşulu ok:false gelince de sessizce geçiyordu.
     Sonuç: /api/kap?mod=yorum 500 dönerken panel statik HABERLER dizisini
     gösteriyor, damga eski haliyle duruyor, kullanıcı canlı akışın ÖLDÜĞÜNÜ
     bilmiyor. 31 Tem konsolunda 500 vardı, ekranda hiçbir iz yoktu.
     §60'ın TEFAS vakası birebir: damga "canlı" der, akan veri yoktur.
     Artık düşüş GÖRÜNÜR — damgaya "DAMGALI YEDEK" düşer ve sebebi yazar.
     Yedeğe düşmek kusur değil; SESSİZCE düşmek kusurdur. */
  const damgaUyar=(neden)=>{ const d=$('haberDamga'); if(!d) return;
    d.innerHTML='<span style="color:var(--down);font-weight:600">\u26a0 DAMGALI YEDEK</span>'+
      ' <span class="thin">\u00b7 KAP canlı akışı alınamadı ('+esc(String(neden).slice(0,60))+')</span>'; };
  try{
    const kodlar=(typeof TOP40!=='undefined'?TOP40:[]).join(',');
    const port=(()=>{ try{ return (poz||[]).filter(x=>x.tip==='hisse').map(x=>x.kod).join(','); }catch(e){ return ''; } })();
    const r=await fetch('/api/kap?mod=yorum&kodlar='+encodeURIComponent(kodlar)+'&portfoy='+encodeURIComponent(port)+'&gun=4&limit=18');
    if(!r.ok){
      /* §245h SUNUCUYU KONUŞTURUP İSTEMCİYİ SAĞIR BIRAKMIŞIM.
         İlk halim `if(!r.ok){ damgaUyar('HTTP '+r.status); return; }` idi —
         gövdeyi OKUMADAN çıkıyordu. Oysa §245c'de sunucuya tam da bu durum için
         teşhis gövdesi eklemiştim: {mod, asama, hata, mesaj, ipucu}.
         Sonuç: 31 Tem konsolunda "HTTP 502" göründü, SEBEBİ görünmedi — teşhis
         üretildi ve çöpe atıldı. Bir teşhis, okunmuyorsa yok demektir.
         Artık hata gövdesi de ayrıştırılıp konsola basılıyor. */
      let tani=null;
      try{ tani = await r.json(); }catch(_){}
      const ozet = tani && (tani.mesaj || tani.err) ? (tani.mod||'?')+'/'+(tani.asama||'?')+': '+(tani.mesaj||tani.err) : '';
      damgaUyar('HTTP '+r.status+(ozet?' · '+ozet:''));
      console.warn('[KTPanel] KAP yorum akışı HTTP',r.status,'— statik yedek gösteriliyor', tani||'(gövde okunamadı)');
      return;
    }
    const j=await r.json();
    if(j&&j.ok&&j.items&&j.items.length){
      HABER_CANLI=j;
      haberRender();
      const d=$('haberDamga');
      if(d)d.textContent='KAP canlı · '+j.items.length+' bildirim · yorum: '+(j.yorumKatmani==='claude'?'AI':'kural')+
        ' · '+new Date().toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'});
    } else {
      damgaUyar((j&&(j.err||j.mesaj))||'bildirim gelmedi');
      console.warn('[KTPanel] KAP yorum akışı boş/hatalı:', (j&&(j.err||j.mesaj))||j);
    }
  }catch(e){ damgaUyar((e&&e.message)||'ağ hatası'); console.warn('[KTPanel] KAP yorum akışı düştü:',(e&&e.message)||e); }
}
function haberRender(){
  const port=new Set(TOP40);
  try{JSON.parse(localStorage.getItem('poz_v1')||'[]').forEach(p=>{if(p.tip==='hisse'&&p.kod)port.add(p.kod.toUpperCase());});}catch(e){}
  let liste=(HABER_CANLI&&HABER_CANLI.items&&HABER_CANLI.items.length)?HABER_CANLI.items.slice():HABERLER.slice();
  if(haberFiltre==='portfoy')liste=liste.filter(h=>Array.isArray(h.k)?h.k.some(k=>port.has(k)):port.has(h.k));   /* §294: canli akista k DIZI */
  else if(haberFiltre==='onemli')liste=liste.filter(h=>h.s>=2);
  $('haberSay').textContent=liste.length+' bildirim';
  const tb=$('haberBody');
  if(!liste.length){tb.innerHTML='<tr><td colspan="5" style="color:var(--muted)">Bu filtrede bildirim yok.</td></tr>';return;}
  tb.innerHTML=liste.map(h=>{
    const inport=port.has(h.k);
    const kodCell='<b style="color:'+(inport?'var(--mm2)':'var(--text)')+'">'+esc(h.k)+'</b>'+(inport?' <span class="tag" style="font-size:7px;padding:0 4px">P</span>':'');
    const tipCell='<span style="font-size:8px;font-weight:700;letter-spacing:.5px;color:'+(TIP_RENK[h.t]||'var(--muted)')+'">'+(TIP_ETIKET[h.t]||h.t)+'</span>';
    const sinyal=h.s>=2?'<span style="color:var(--mm2)">● </span>':(h.s===1?'<span style="color:#E8B93B">● </span>':'<span style="color:var(--line2)">○ </span>');
    return '<tr'+(h.s>=2?' style="background:var(--mmL)"':'')+'><td style="white-space:nowrap;color:var(--muted)">'+h.d+'</td><td style="white-space:nowrap">'+kodCell+'</td><td>'+tipCell+'</td><td style="font-family:var(--sans);font-size:11px">'+sinyal+esc(h.ozet)+'</td><td><a href="'+h.url+'" target="_blank" rel="noopener" style="font-size:9px;font-family:var(--mono)">KAP↗</a></td></tr>';
  }).join('');
}
/* ---- Katılım Fon Dünyası ---- */
let KATFON=null,katfonSort='ytd';
async function katfonInit(){
  await tlrefkYukle();   /* §250e */
  try{KATFON=await (await fetch('/katfon.json',{cache:'no-store'})).json();}catch(e){$('katfonBody').innerHTML='<div class="note">katfon.json yüklenemedi.</div>';return;}
  const sel=$('katfonSort');if(sel)sel.addEventListener('change',()=>{katfonSort=sel.value;katfonRender();});
  katfonRender();
  katfonCanli();
  fonAkisRender();   /* §263 günlük fon akışı — ayrı dosya, katfon'u bekletmez */
}
async function katfonCanli(){
  /* §143 SESSİZ HATA KAPATILDI. Önceki sürüm iki yerde sessizce çıkıyordu:
       if(!j.ok||!j.items) return;   ·   catch(e){}
     Sonuç: API düşse de, hiç deploy edilmemiş olsa da ekran AYNI görünüyordu
     ("fiyat: 2026-07-24" damgalı yedek). Kullanıcı hangisi olduğunu anlayamıyordu.
     Artık her hata yolu damgaya YAZIYOR — ekran kendi kendini teşhis ediyor. */
  /* §241 BAŞLIĞI DA app.js YAZSIN — iki dosya bağımlılığı kalksın.
     Katılım Fonları başlığı index.html'de STATİKTİ. Metin değişince HEM
     index.html HEM app.js yüklenmesi gerekiyordu ve üç turdur biri eksik
     kaldı: sürüm etiketi index.html'de, düzeltme app.js'te.
     ARTIK: başlık açılışta app.js tarafından yazılır. index.html'de ne
     yazdığı önemsiz — tek dosya yüklemek yeter.
     DERS: aynı metnin iki dosyada olması, iki dosyayı da yüklemeye zorlar.
     Tek kaynak (§112) yalnız veri için değil, ARAYÜZ METNİ için de geçerli. */
  const damgala=(m)=>{ KATFON.canli=m; try{ katfonRender(); }catch(e){} };
  try{
    const kodlar=[];KATFON.kategoriler.forEach(k=>k.fonlar.forEach(f=>kodlar.push(f.k)));
    const r=await fetch('/api/katfon?k='+kodlar.join(','));
    if(!r.ok){ damgala('<span style="color:var(--down)">⚠ /api/katfon HTTP '+r.status+
      '</span> — damgalı veri gösteriliyor'); return; }
    const j=await r.json();
    if(!j.ok||!j.items){
      /* §240c TEFAS UYARISI KALDIRILDI. §147-148'de TEFAS bot koruması yüzünden
       canlı çekim kapatılmış ve bu bir uyarı olarak gösteriliyordu. ARTIK
       GEREKSİZ: veri Fintables MCP'den tek sorguda geliyor, TEFAS'a hiç
       gidilmiyor. Kapanmış bir kapının önünde nöbet tutmaya devam etmek,
       panelin diğer uyarılarının da ciddiyetini azaltır. */
      if(j && j.kapali){
        /* §150: damga İKİ TARİHİ de söylüyor. Getiriler ve AUM farklı kaynaklardan
           gelir (fiyat serisi vs günlük fon değerleri) ve aynı gün tazelenmeyebilir.
           Tek tarih göstermek, okuyucuya hepsi aynı gündenmiş izlenimi verir. */
        /* §240b "köprü ritüeli" ARTIK YOK. Getiri, AUM ve akış tek Fintables
       sorgusuyla ve TEK TARİHTE geliyor; elle toplama adımı kalktı.
       Eski metin kaldırılan bir süreci anlatmaya devam ediyordu — kullanıcıya
       var olmayan bir kısıt hatırlatmak, gerçek kısıtları da inandırıcılıktan
       düşürür. */
    damgala('getiriler '+esc(KATFON.fiyat_tarihi||'?')+
          ' · AUM/akış '+esc(KATFON.akis_tarihi||'?')+
          ((KATFON.fiyat_tarihi===KATFON.akis_tarihi)
            ? ' <span class="thin">· tek tarih, tümü Fintables</span>'
            : ' <span class="thin" style="color:var(--down)">· TARİHLER AYRIŞIK — hangi rakamın hangi güne ait olduğuna dikkat</span>'));
        return; }
      /* §144: önek tekrarı kesildi. Sunucu zaten "TEFAS: ..." diye gönderiyordu. */
      const ham=String(j&&j.err||'boş yanıt').replace(/^(TEFAS:\s*)+/i,'');
      damgala('<span style="color:var(--down)">⚠ TEFAS: '+esc(ham)+
        '</span> — damgalı veri gösteriliyor'); return; }
    let n=0;
    KATFON.kategoriler.forEach(k=>k.fonlar.forEach(f=>{
      const c=j.items[f.k];if(!c)return;
      f.g=f.g.map((v,i)=>c.g[i]!=null?c.g[i]:v);
      if(c.fiyat!=null)f.yu=c.fiyat;
      if(c.b!=null)f.b=c.b;      // AUM canlı (akış oku damgalı kalır)
      if(c.ys!=null)f.ys=c.ys;
      n++;
    }));
    if(!n){ damgala('<span style="color:var(--down)">⚠ TEFAS yanıt verdi ama hiçbir fon eşleşmedi</span>'+
      ' <span class="thin">('+(j.adet||0)+' kayıt döndü, kodlar uyuşmadı)</span>'); return; }
    const vt=j.veriTarihi, yas=j.veriYasiGun;
    const yasNot = (yas==null) ? '' : (yas<=1 ? ' · güncel' : ' · '+yas+' gün geride');
    /* §142: hangi dönemlerin CANLI hesaplandığı API'den geliyor. Altısı da gelirse
       "tüm dönemler canlı"; eksik varsa HANGİLERİNİN damgalı kaldığı yazılır. */
    const cd = j.canliDonem || ['1G'];
    const TUM = ['1G','1A','3A','YTD','1Y','3Y'];
    const eksik = TUM.filter(x=>cd.indexOf(x)<0);
    const donemNot = eksik.length
      ? ' · <b style="color:var(--down)">'+eksik.join('/')+' damgalı</b>'
      : ' · tüm dönemler canlı';
    damgala('TEFAS · veri '+(vt||'?')+yasNot+donemNot+' · '+n+'/'+kodlar.length+' fon'+
      ' <span class="thin">(çekim '+new Date().toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'})+')</span>');
  }catch(e){
    damgala('<span style="color:var(--down)">⚠ bağlantı hatası: '+esc(String((e&&e.message)||e).slice(0,60))+
      '</span> — damgalı veri gösteriliyor');
    console.error('[KTPanel] katfonCanli:', e);
  }
}
/* §250e: TLREFK ALFA — katılım fonlarının doğal benchmark'ı (BIST TLREFK
   endeksi, endeks-arsiv.json'da birikiyor + tarihsel tohum). YTD getirisi
   hesaplanır, fon YTD'sinden düşülerek ALFA sütunu basılır: "TLV, TLREFK'i
   +X puan geçti" — nominal getiriden çok daha anlamlı ölçü. */
let TLREFK_YTD=null;
async function tlrefkYukle(){
  try{
    const r=await fetch('/endeks-arsiv.json',{cache:'no-store'}); if(!r.ok)return;
    const a=await r.json(), G=a.gunler||{};
    const gunler=Object.keys(G).filter(g=>G[g]&&G[g].BISTTLREFK>0).sort();
    if(gunler.length<20) return;
    const son=G[gunler[gunler.length-1]].BISTTLREFK;
    const yil=gunler[gunler.length-1].slice(0,4);
    let baz=null;
    for(const g of gunler){ if(g < yil+'-01-01') baz=G[g].BISTTLREFK; else break; }
    if(baz>0) TLREFK_YTD=(son/baz-1)*100;
  }catch(e){}
}
function katfonRender(){
  /* §241 BAŞLIĞI app.js YAZAR — index.html bağımlılığı kalktı.
     Metin index.html'de STATİKTİ; değişince HEM index.html HEM app.js
     yüklenmesi gerekiyordu ve üç turdur biri eksik kaldı (sürüm etiketi
     birinde, düzeltme diğerinde).
     Burada, katfonRender başında: sekme her çizildiğinde çalışır, canlı
     çekim denensin denenmesin. index.html'de ne yazdığı ARTIK ÖNEMSİZ.
     DERS: aynı metnin iki dosyada olması, iki dosyayı da yüklemeye zorlar.
     Tek kaynak kuralı (§112) veri için olduğu kadar ARAYÜZ METNİ için de
     geçerli — ve deploy yükünü yarıya indiriyor. */
  try{
    const _b = document.querySelector('#t5 h2 .thin');
    if(_b) _b.textContent = '(46 fon · 6 kategori · Fintables)';
  }catch(e){}

  if(!KATFON)return;
  const sIdx={'1g':0,'1a':1,'3a':2,'ytd':3,'1y':4,'3y':5}[katfonSort];
  const donemLbl=['1G','1A','3A','YTD','1Y','3Y'];
  let tum=[];KATFON.kategoriler.forEach(k=>k.fonlar.forEach(f=>tum.push(f)));
  const gec=tum.filter(f=>f.g[3]!=null);
  const enIyi=gec.reduce((a,b)=>b.g[3]>a.g[3]?b:a),enKotu=gec.reduce((a,b)=>b.g[3]<a.g[3]?b:a);
  const ort=gec.reduce((s,f)=>s+f.g[3],0)/gec.length;
  // AUM + günlük akış toplamları (Fintables damgalı)
  const aumlu=tum.filter(f=>f.b!=null);
  const topAum=aumlu.reduce((s,f)=>s+f.b,0), netAkis=aumlu.reduce((s,f)=>s+(f.a||0),0);
  const aumFmt=v=>v>=1e9?trN(v/1e9,1)+' mlr':(v>=1e6?trN(v/1e6,0)+' mn':trN(v/1e3,0)+' bin');
  const enGiris=aumlu.slice().sort((a,b)=>(b.a||0)-(a.a||0))[0];
  const enCikis=aumlu.slice().sort((a,b)=>(a.a||0)-(b.a||0))[0];
  $('katfonOzet').innerHTML=
    '<div class="card" style="padding:8px 12px"><div class="lbl">TOPLAM FON</div><div class="val">'+tum.length+'</div><div class="sub">6 kategori · '+(KATFON.canli||('fiyat: '+(KATFON.fiyat_tarihi||'')))+'</div></div>'+
    '<div class="card" style="padding:8px 12px"><div class="lbl">EN YÜKSEK YTD</div><div class="val up">'+enIyi.k+'</div><div class="sub">%'+trN(enIyi.g[3],2)+' · '+esc(enIyi.u)+'</div></div>'+
    '<div class="card" style="padding:8px 12px"><div class="lbl">ORT. YTD</div><div class="val">%'+trN(ort,2)+'</div><div class="sub">'+gec.length+' fon (YTD verisi olan)</div></div>'+
    '<div class="card" style="padding:8px 12px"><div class="lbl">EN DÜŞÜK YTD</div><div class="val down">'+enKotu.k+'</div><div class="sub">%'+trN(enKotu.g[3],2)+' · '+esc(enKotu.u)+'</div></div>'+
    (aumlu.length?
    '<div class="card" style="padding:8px 12px"><div class="lbl">TOPLAM BÜYÜKLÜK</div><div class="val">'+aumFmt(topAum)+'</div><div class="sub">₺ · '+(KATFON.akis_tarihi||'')+' · Fintables</div></div>'+
    '<div class="card" style="padding:8px 12px"><div class="lbl">GÜNLÜK NET AKIŞ</div><div class="val '+(netAkis>=0?'up':'down')+'">'+(netAkis>=0?'+':'−')+aumFmt(Math.abs(netAkis))+'</div><div class="sub">₺ · 46 fon toplamı</div></div>'+
    '<div class="card" style="padding:8px 12px"><div class="lbl">EN ÇOK GİREN</div><div class="val up">'+enGiris.k+'</div><div class="sub">+'+aumFmt(enGiris.a)+' ₺ · '+esc(enGiris.u)+'</div></div>'+
    '<div class="card" style="padding:8px 12px"><div class="lbl">EN ÇOK ÇIKAN</div><div class="val down">'+enCikis.k+'</div><div class="sub">−'+aumFmt(Math.abs(enCikis.a))+' ₺ · '+esc(enCikis.u)+'</div></div>'
    :'');
  const renkler=['#128A66','#3D7BD9','#8B6FD8','#E8933B','#0FA26B','#DE4B5E'];
  let html='';
  KATFON.kategoriler.forEach((kat,ki)=>{
    const fs=kat.fonlar.slice().sort((a,b)=>{const av=a.g[sIdx],bv=b.g[sIdx];if(av==null)return 1;if(bv==null)return -1;return bv-av;});
    const renk=renkler[ki%6];
    html+='<div style="margin-top:'+(ki?18:4)+'px"><div style="display:flex;align-items:baseline;gap:8px;border-left:3px solid '+renk+';padding-left:8px;margin-bottom:6px"><span style="font-weight:700;font-size:13px">'+esc(kat.ad)+'</span><span class="sub">'+kat.fonlar.length+' fon · '+esc(kat.aciklama)+'</span></div>';
    html+='<div style="overflow-x:auto"><table><thead><tr><th>Kod</th><th>Fon</th><th>Tip</th><th class="num">YÜ%</th><th class="num">AUM · günlük akış</th>'+donemLbl.map((d,i)=>'<th class="num"'+(i===sIdx?' style="color:var(--mm2)"':'')+'>'+d+'</th>').join('')+(TLREFK_YTD!=null?'<th class="num" title="YTD getiri − TLREFK YTD (katılım referans)">α vs TLREFK</th>':'')+'</tr></thead><tbody>';
    fs.forEach((f,i)=>{
      const top=i===0;
      const aumH=f.b!=null?('<td class="num" style="font-size:9px">'+ (f.b>=1e9?trN(f.b/1e9,1)+'mlr':trN(f.b/1e6,0)+'mn') + (f.a?(' <span class="'+(f.a>=0?'up':'down')+'">'+(f.a>=0?'▲':'▼')+(Math.abs(f.a)>=1e9?trN(Math.abs(f.a)/1e9,1)+'mlr':trN(Math.abs(f.a)/1e6,0)+'mn')+'</span>'):'')+'</td>'):'<td class="num" style="color:var(--line2)">\u2014</td>';
      html+='<tr'+(top?' style="background:var(--mmL)"':'')+'><td><b'+(top?' style="color:var(--mm2)"':'')+'>'+f.k+'</b></td><td style="font-size:10px;color:var(--muted);font-family:var(--sans)">'+esc(f.u)+'</td><td><span style="font-size:8px;font-weight:700;letter-spacing:.5px;color:'+(f.t==='K'?'var(--mm2)':'var(--blue)')+'">'+(f.t==='K'?'KATILIM':'SERBEST')+'</span></td><td class="num" style="color:var(--muted)">'+trN(f.yu,4)+'</td>'+aumH;
      f.g.forEach((v,gi)=>{html+='<td class="num"'+(gi===sIdx?' style="font-weight:700"':'')+'>'+(v==null?'<span style="color:var(--line2)">\u2014</span>':'<span class="'+(v>=0?'up':'down')+'">'+(v>=0?'+':'')+trG(v)+'</span>')+'</td>';});
      /* §250e: alfa hücresi — YTD (g[3]) − TLREFK YTD */
      if(TLREFK_YTD!=null){
        const ytd=(f.g&&f.g[3]!=null)?f.g[3]:null;
        const al=(ytd!=null)?(ytd-TLREFK_YTD):null;
        html+='<td class="num" style="font-weight:700">'+(al==null?'<span style="color:var(--line2)">\u2014</span>':
          '<span class="'+(al>=0?'up':'down')+'">'+(al>=0?'+':'\u2212')+trN(Math.abs(al),1)+'</span>')+'</td>';
      }
      html+='</tr>';
    });
    html+='</tbody></table></div></div>';
  });
  $('katfonBody').innerHTML=html;
}
/* ---- Yabancı Para Akışı (portföy + carry) ---- */
let YABANCI=null;
async function yabanciInit(){
  try{YABANCI=await (await fetch('/yabanci.json',{cache:'no-store'})).json();}catch(e){return;}
  yabanciRender();
}
function yabanciRender(){
  if(!YABANCI||!$('yabanciBody'))return;
  const d=YABANCI, cl=x=>Math.max(0,Math.min(100,x));
  const son3=d.aylik.slice(-3).reduce((s,a)=>s+a.portfoy,0)/3;
  // §129 NaN DÜZELTMESİ: önceki sürüm yedek olarak d.carry.reel_faiz'e düşüyordu;
  // o alan §128'de yabanci.json'dan KALDIRILINCA undefined*5 = NaN oldu ve
  // skor "NaN SERT ÇIKIŞ" diye çıktı. Bir alanı silerken TÜM tüketicileri aramak
  // gerekiyordu — §128'de app.js'in iki tüketicisini aradım, bu ÜÇÜNCÜSÜYDÜ.
  // YENİ KURAL: skor bileşeni asla NaN olamaz. Değer yoksa NÖTR (50) alınır ve
  // skorun eksik bileşenle hesaplandığı damgada YAZILIR.
  const RF = reelFaizler();                       // {exante, expost, kaynak}
  const carryRef = Number.isFinite(RF.exante) ? RF.exante
                 : (Number.isFinite(RF.expost) ? RF.expost : null);
  const akisS=cl(50+son3*12), rezervS=d.rezerv.trend==='toparlanıyor'?65:(d.rezerv.trend==='eriyor'?30:50),
        carryS=(carryRef!=null)?cl(50+carryRef*5):50;
  const skor=Math.round(akisS*0.5+rezervS*0.25+carryS*0.25);
  // §138: carry bileşeni veri yokluğundan nötr alındıysa BUNU SÖYLE. Sessiz nötr,
  // okuyucuya "ölçtüm, nötr çıktı" izlenimi verir — oysa "ölçemedim" demektir.
  const carryEksik = (carryRef==null);
  const e=skor>=65?['GÜÇLÜ GİRİŞ','var(--up)']:skor>=55?['ILIMLI GİRİŞ','var(--up)']:skor>=45?['NÖTR / KARARSIZ','#E8933B']:skor>=35?['ILIMLI ÇIKIŞ','var(--down)']:['SERT ÇIKIŞ','var(--down)'];
  const mx=Math.max.apply(null,d.aylik.map(a=>Math.abs(a.portfoy)))||1;
  const bars=d.aylik.map(a=>{
    const h=Math.abs(a.portfoy)/mx*50, up=a.portfoy>=0, col=up?'var(--up)':'var(--down)', op=a.kesin?'1':'0.4';
    return '<div style="flex:1;display:flex;flex-direction:column;align-items:center">'+
      '<div style="height:52px;width:100%;display:flex;flex-direction:column;justify-content:flex-end">'+(up?'':'<div style="flex:1"></div>')+
      '<div style="height:'+h.toFixed(0)+'px;background:'+col+';opacity:'+op+';border-radius:2px;min-height:2px"></div>'+(up?'<div style="flex:1"></div>':'')+'</div>'+
      '<span class="num '+(up?'up':'down')+'" style="font-size:8px;font-weight:600;margin-top:2px">'+(up?'+':'')+a.portfoy.toFixed(1)+'</span>'+
      '<span class="sub" style="font-size:8px">'+a.ay+(a.kismi?'*':'')+'</span></div>';
  }).join('');
  const kum=d.aylik.reduce((s,a)=>s+a.portfoy,0);
  $('yabanciBody').innerHTML=
    '<div style="margin-bottom:8px"><span style="font-family:var(--mono);font-size:32px;font-weight:700;color:'+e[1]+'">'+skor+'</span> <span style="font-weight:700;font-size:13px;letter-spacing:.5px;color:'+e[1]+'">'+e[0]+'</span> <span class="sub" style="display:inline">/100 · yabancı para yön skoru <span class="thin">(aylık ödemeler dengesi)</span>'+(carryEksik?' · <b style="color:var(--down)">⚠ carry ölçülemedi, nötr alındı</b>':'')+'</span></div>'+
    '<div class="lbl">AYLIK NET PORTFÖY AKIŞI <span class="thin" style="font-weight:400">(mlr $ · yeşil giriş / kırmızı çıkış · soluk = tahmini)</span></div>'+
    '<div style="display:flex;align-items:stretch;gap:3px;margin:6px 0 10px">'+bars+'</div>'+
    '<div class="kv"><span class="k">2026 kümülatif</span><span class="'+(kum>=0?'up':'down')+'" style="font-weight:600">'+(kum>=0?'+':'')+kum.toFixed(1)+' mlr $</span></div>'+
    '<div class="kv"><span class="k">Son hafta <span id="yabHaftaTag">('+d.hafta_son.etiket+')</span></span><span id="yabHaftaVal">hisse '+(d.hafta_son.hisse>=0?'+':'')+d.hafta_son.hisse+'mn · DİBS +'+d.hafta_son.tahvil+'mn'+(d.hafta_son.ost!=null?' · ÖST +'+d.hafta_son.ost+'mn':'')+' <span class="sub" style="display:inline">'+(d.hafta_son.not||'')+'</span></span></div>'+
    (d.hafta_seri?('<div class="kv"><span class="k">5 haftalık seri <span class="sub" style="display:inline">(hisse/tahvil mn$)</span></span><span id="yabSeriVal" style="font-size:10px">'+
      d.hafta_seri.map(w=>{const t=w.tahvil+(w.ost||0);const rekor=t>2000;return w.h.replace(' ','\u00A0')+' <b>'+Math.round(w.hisse)+'</b>/<b'+(rekor?' class="up"':'')+'>'+Math.round(t)+(rekor?'★':'')+'</b>';}).join(' → ')+'</span></div>'):'')+
    (d.hafta_not?('<div class="note" style="font-size:10px;margin:4px 0 6px;padding:6px 10px">'+d.hafta_not+'</div>'):'')+
    '<div class="kv"><span class="k">Swap hariç net rezerv</span><span id="yabRezervVal" class="'+(d.rezerv.trend==='toparlanıyor'?'up':'down')+'">~'+d.rezerv.guncel+' mlr $ · '+d.rezerv.trend+'</span></div>'+
    // §129: İKİ REEL FAİZ AYRI AYRI gösterilir. Kullanıcı haklı olarak sordu:
    // "%10,5 diyorsun ama burada %7,9". İkisi de doğruydu ama AYNI ADI taşıyordu.
    //   EX-ANTE = politika vs BEKLENEN enflasyon → TCMB'nin çıpası, ileriye bakar
    //   EX-POST = AOFM vs GERÇEKLEŞEN TÜFE (Fisher) → fiilen kazanılan, geriye bakar
    // Aradaki açıklık kendi başına bilgi: piyasanın fiyatladığı dezenflasyondur.
    '<div class="kv"><span class="k">Carry getirisi <span class="thin">(reel faiz · iki bakış)</span></span><span id="yabCarryVal">'+
      reelFaizSatiri(RF)+'</span></div>'+
    '<div class="note">Skor üç bileşenden: <em>aylık portföy akışı</em> (hisse+tahvil net; Nis +4,05 / May −3,07 kesin ödemeler dengesi, diğer aylar eğilim), <em>swap hariç net rezerv trendi</em> (dar carry parası girince şişer, çıkınca erir — Oca zirvesi 85,7→Haz dibi 28 mlr sert carry çıkışıydı) ve <em>carry getirisi</em>. Bugünkü okuma: para tümüyle çıkmadı ama <em>oynak ve seçici</em> — hisseden tahvile kaydı, dar carry rezerv toparlanmasıyla ılımlı dönüyor. Kesin rakam değil, <em>yön işareti</em>; ödemeler dengesi ayda bir, menkul kıymet haftalık tazelenir.</div>';
  /* §259c YENİDEN ÇİZİMDEN SONRA CANLI DEĞERİ GERİ BAS. Bu fonksiyon kartı
     JSON'dan komple kuruyor; exAnteHesapla → yabCarryTazele → yabanciRender
     zinciri kullanıcı Tahminler sekmesini açınca tetikleniyor ve canlı akış
     yazımını SİLERDİ — panel sessizce 17 Tem'e ("+278 giriş") dönerdi. */
  try{ if(YAB_CANLI) yabHaftaCanliYaz(); }catch(e){}
}

/* ---- Yurt İçi Yatırımcı Rotasyonu (EVDS · haftalık) ---- */
async function loadRotasyon(){
  if(!$('rotSinyal'))return;
  const son2=(ham,alan)=>{const it=(ham||[]).filter(x=>x[alan]!=null&&x[alan]!=='');if(it.length<2)return null;return {s:parseFloat(it[it.length-1][alan]),o:parseFloat(it[it.length-2][alan]),t:it[it.length-1].Tarih};};
  let tlD=null, ypG=null;
  // 1) TL mevduat (yerleşik) — stok + haftalık fark (milyon TL varsayımı → trl ₺)
  try{
    const r=await fetch('/api/evds2?series=TP.HPBITABLO3.2&gun=40&full=1');
    if(r.ok){const d=await r.json();const v=son2(d.ham,'TP_HPBITABLO3_2');
      /* §252j BIRIM HATASI (§229 ailesi, ucuncu vaka). TP.HPBITABLO3.2 BIN TL
         biriminde gelir. Ham son deger 17821006486 = 17,82 TRILYON TL.
         Panel /1e6 yapip "17.821,01 trl" basiyordu — BIN KAT sisik; Turkiye'nin
         GSYH'sinin ~350 kati bir mevduat stoku. Dogru bolen 1e9.
         Degisim satirinda da fazladan *1000 vardi: gercek -95,5 mlr TL,
         ekranda "-95.468 mlr" yaziyordu. Olcum: 9 Agu tarayici konsolu. */
      if(v){tlD=v.s-v.o;const stokTrl=v.s/1e9, dTrl=tlD/1e6;
        $('rotTL').innerHTML=trN(stokTrl,2)+' trl ₺ <span class="'+(tlD>=0?'up':'down')+'">('+(tlD>=0?'+':'')+trN(dTrl,1)+' mlr)</span>';
        if($('rotTLTag'))$('rotTLTag').textContent='('+(v.t||'')+')';}}
  }catch(e){}
  // 2) YP gerçek değişim + parite etkisi + altın (aynı grup, tek istek)
  try{
    const r=await fetch('/api/evds2?series=TP.HPBITABLO5.1,TP.HPBITABLO5.12,TP.HPBITABLO5.6,TP.HPBITABLO5.11&gun=60&full=1');
    if(r.ok){const d=await r.json();const ham=d.ham||[];
      const sonV=(k)=>{const al=k.replace(/\./g,'_');const it=ham.filter(x=>x[al]!=null&&x[al]!=='');return it.length?parseFloat(it[it.length-1][al]):null;};
      ypG=sonV('TP.HPBITABLO5.1');
      const parite=sonV('TP.HPBITABLO5.12');
      const altin=(sonV('TP.HPBITABLO5.6')||0)+(sonV('TP.HPBITABLO5.11')||0);
      if(ypG!=null){$('rotYP').innerHTML='<span class="'+(ypG<=0?'up':'down')+'">'+(ypG>=0?'+':'')+trN(ypG,0)+' mn $</span>';}
      if(parite!=null&&$('rotParite'))$('rotParite').textContent=(parite>=0?'+':'')+trN(parite,0)+' mn $';
      if($('rotAltin'))$('rotAltin').innerHTML='<span class="'+(altin<=0?'up':'down')+'">'+(altin>=0?'+':'')+trN(altin,0)+' mn $</span>';
      // 4 haftalık YP gerçek serisi + kümülatif yorum
      const gSeri=ham.filter(x=>x['TP_HPBITABLO5_1']!=null&&x['TP_HPBITABLO5_1']!=='').map(x=>parseFloat(x['TP_HPBITABLO5_1']));
      /* §246f: 'Son 4 hafta' satırı boşalıyordu — gun=30 penceresi Pazartesi
         günleri 4. yayını dışarı düşürüyor (TCMB Perşembe yayınlar, son veri
         24 Tem). Pencere-kenarı hatası: önceden dolu görünmesi takvim şansıydı.
         Pencere 60 güne çıktı + 4'ten az hafta varsa eldeki kadarı gösterilir
         (etiketiyle) — hepsi-ya-hiç yerine dürüst kısmi görünüm. */
      if(gSeri.length>=2&&$('rotSeri')){
        const s4=gSeri.slice(-4), top=s4.reduce((t,v)=>t+v,0);
        $('rotSeri').innerHTML=s4.map(v=>'<b class="'+(v<=0?'up':'down')+'">'+(v>=0?'+':'')+trN(v,0)+'</b>').join(' → ')+
          ' mn $ ('+s4.length+' hafta) · kümülatif <b class="'+(top<=0?'up':'down')+'">'+(top>=0?'+':'')+trN(top,0)+'</b> '+(top<=0?'(TL\u0027leşme)':'(dolarizasyon baskısı)');
      }}
  }catch(e){}
  // 3) YP mevduat stoku — §252k: SATIR KALDIRILDI (gerekce index.html'de).
  // 4) Yön sinyali: TL↑ + YP gerçek↓ = TL'leşme
  const el=$('rotSinyal');
  if(el){
    if(tlD!=null&&ypG!=null){
      if(tlD>0&&ypG<0){el.innerHTML='<span class="up">TL\'LEŞME SÜRÜYOR</span> <span class="thin" style="font-size:9px">TL↑ · YP gerçek↓</span>';}
      else if(tlD>0&&ypG>0){el.innerHTML='<span style="color:var(--muted)">KARIŞIK</span> <span class="thin" style="font-size:9px">ikisi de artıyor</span>';}
      else if(ypG>0){el.innerHTML='<span class="down">DOLARİZASYON BASKISI</span> <span class="thin" style="font-size:9px">YP gerçek↑</span>';}
      else{el.innerHTML='<span style="color:var(--muted)">ZAYIF</span> <span class="thin" style="font-size:9px">ikisi de geriliyor</span>';}
    }else el.textContent='veri bekleniyor';
  }
}

/* ---- Enflasyon: Gerçekleşen vs Beklenti (son 12 ay) ---- */
async function loadEnflasyonBeklenti(){
  const el=$('enfBekGrafik'); if(!el)return;
  const ayAd=['','Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
  try{
    // 3 beklenti serisi (aynı grup, aylık) + TÜFE endeksi (gerçekleşen yıllık için)
    const [rB, rT]=await Promise.all([
      fetch('/api/evds2?series=TP.ENFBEK.HBA12ENF,TP.ENFBEK.IYA12ENF,TP.ENFBEK.PKA12ENF&gun=830&full=1'),
      fetch('/api/evds2?grup=bie_tukfiy2025&adFiltre=Genel&gun=800&full=1')
    ]);
    if(!rB.ok){el.innerHTML='<div class="sub">Beklenti verisi alınamadı.</div>';return;}
    const dB=await rB.json();
    const itB=(dB.ham||[]);
    // TÜFE endeksinden yıllık gerçekleşen hesapla (ay -> yoy)
    let tufeMap={};
    if(rT.ok){
      const dT=await rT.json(), alan=(dT.cozulen||'').replace(/\./g,'_');
      const itT=(dT.ham||[]).filter(x=>x[alan]!=null&&x[alan]!=='');
      const idx={}; itT.forEach(x=>idx[x.Tarih]=parseFloat(x[alan]));
      itT.forEach(x=>{const [y,m]=String(x.Tarih).split('-').map(Number);const onceki=idx[(y-1)+'-'+m];if(onceki)tufeMap[x.Tarih]=(parseFloat(x[alan])/onceki-1)*100;});
    }
    // Beklenti serilerini ay bazında topla; son 13 ay
    const g=(kod)=>{const al=kod.replace(/\./g,'_');return itB.filter(x=>x[al]!=null&&x[al]!=='').map(x=>({t:x.Tarih,v:parseFloat(x[al])}));};
    const hane=g('TP.ENFBEK.HBA12ENF'), reel=g('TP.ENFBEK.IYA12ENF'), piya=g('TP.ENFBEK.PKA12ENF');
    // Ortak ay ekseni: beklenti serisinin son 13 tarihini al
    const ayNo=(t)=>{const p=String(t).split('-').map(Number);return p[0]*12+(p[1]||0);};
    const tarihler=[...new Set([...hane,...reel,...piya].map(x=>x.t))].sort((a,b)=>ayNo(a)-ayNo(b)).slice(-13);
    if(tarihler.length<2){el.innerHTML='<div class="sub">Yetersiz veri.</div>';return;}
    const val=(arr,t)=>{const f=arr.find(x=>x.t===t);return f?f.v:null;};
    const seriler=[
      {ad:'Gerçekleşen TÜFE',renk:'#0FA26B',kal:2.5,d:tarihler.map(t=>tufeMap[t]!=null?tufeMap[t]:null)},
      {ad:'Hane halkı bek.',renk:'#D64545',kal:1.5,d:tarihler.map(t=>val(hane,t))},
      {ad:'Reel sektör bek.',renk:'#E8933B',kal:1.5,d:tarihler.map(t=>val(reel,t))},
      {ad:'Piyasa bek.',renk:'#5B8DEF',kal:1.5,d:tarihler.map(t=>val(piya,t))}
    ];
    // Eksen 12 ay ileri uzar: beklentiler HEDEF tarihinde de gösterilir (anketin kapsadığı dönem görünür)
    const sonrakiAy=(t,n)=>{const p=String(t).split('-').map(Number);let top=p[0]*12+(p[1]-1)+n;return Math.floor(top/12)+'-'+(top%12+1);};
    const gelecek=[];for(let k=1;k<=12;k++)gelecek.push(sonrakiAy(tarihler[tarihler.length-1],k));
    const eksen=tarihler.concat(gelecek);
    // Ölçek
    let tumV=[]; seriler.forEach(s=>s.d.forEach(v=>{if(v!=null)tumV.push(v);}));
    if(!tumV.length){el.innerHTML='<div class="sub">Veri yok.</div>';return;}
    const vMin=Math.floor(Math.min(...tumV)/5)*5, vMax=Math.ceil(Math.max(...tumV)/5)*5;
    const W=680,H=220,padL=38,padR=16,padT=12,padB=26;
    const x=(i)=>padL+(W-padL-padR)*i/(eksen.length-1);
    const y=(v)=>padT+(H-padT-padB)*(1-(v-vMin)/(vMax-vMin));
    // Y ızgara
    let grid='';
    for(let gv=vMin;gv<=vMax;gv+=Math.max(5,Math.round((vMax-vMin)/5/5)*5)){
      grid+='<line x1="'+padL+'" y1="'+y(gv)+'" x2="'+(W-padR)+'" y2="'+y(gv)+'" stroke="var(--line)" stroke-width="0.5"/>';
      grid+='<text x="'+(padL-4)+'" y="'+(y(gv)+3)+'" text-anchor="end" font-size="9" fill="var(--muted)">'+gv+'</text>';
    }
    // X etiketleri (her 2 ayda bir)
    let xlab='';
    eksen.forEach((t,i)=>{if(i%3===0){const [yy,mm]=t.split('-').map(Number);xlab+='<text x="'+x(i)+'" y="'+(H-8)+'" text-anchor="middle" font-size="8.5" fill="var(--muted)">'+ayAd[mm]+' '+String(yy).slice(2)+'</text>';}});
    // Bugün ayracı: gerçekleşenin bittiği yer
    const bugunX=x(tarihler.length-1);
    xlab+='<line x1="'+bugunX+'" y1="'+padT+'" x2="'+bugunX+'" y2="'+(H-padB)+'" stroke="var(--muted)" stroke-width="0.7" stroke-dasharray="2,3" opacity="0.6"/>';
    xlab+='<text x="'+(bugunX+3)+'" y="'+(padT+8)+'" font-size="8" fill="var(--muted)">bugün → beklenti ufku</text>';
    // Çizgiler
    let paths='';
    seriler.forEach(s=>{
      let dstr='',ilk=true;
      s.d.forEach((v,i)=>{if(v!=null){dstr+=(ilk?'M':'L')+x(i)+' '+y(v);ilk=false;}});
      if(dstr)paths+='<path d="'+dstr+'" fill="none" stroke="'+s.renk+'" stroke-width="'+s.kal+'"'+(s.dash?' stroke-dasharray="'+s.dash+'" opacity="0.75"':'')+'/>';
      // son nokta işareti + (beklenti serilerinde) hedef tarihe projeksiyon
      for(let i=s.d.length-1;i>=0;i--){if(s.d[i]!=null){
        paths+='<circle cx="'+x(i)+'" cy="'+y(s.d[i])+'" r="2.5" fill="'+s.renk+'"/>';
        if(s.kal<2){ // beklenti serisi: son anket değeri, 12 ay sonrasını hedefler
          const hx=x(Math.min(i+12,eksen.length-1)), hy=y(s.d[i]);
          paths+='<line x1="'+x(i)+'" y1="'+hy+'" x2="'+hx+'" y2="'+hy+'" stroke="'+s.renk+'" stroke-width="1" stroke-dasharray="4,4" opacity="0.55"/>';
          paths+='<circle cx="'+hx+'" cy="'+hy+'" r="3.2" fill="none" stroke="'+s.renk+'" stroke-width="1.4"/>';
        }
        break;}}
    });
    el.innerHTML='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto">'+grid+xlab+paths+'</svg>';
    // Legend + son değerler
    const leg=$('enfBekLegend');
    if(leg)leg.innerHTML=seriler.map(s=>{let son=null;for(let i=s.d.length-1;i>=0;i--){if(s.d[i]!=null){son=s.d[i];break;}}return '<span style="display:inline-flex;align-items:center;gap:4px"><span style="width:14px;height:'+(s.kal>2?3:2)+'px;display:inline-block;'+(s.dash?'background:repeating-linear-gradient(90deg,'+s.renk+' 0 4px,transparent 4px 7px)':'background:'+s.renk)+'"></span>'+s.ad+(son!=null?' <b>%'+trN(son,1)+'</b>':'')+'</span>';}).join('');
    // Merkez Bankaları kartındaki canlı beklenti-gerçekleşen satırları
    const sonDeg=(arr)=>{for(let i=arr.length-1;i>=0;i--){if(arr[i]!=null)return arr[i];}return null;};
    const gGercek=sonDeg(seriler[0].d), gPiya=sonDeg(seriler[3].d), gHane=sonDeg(seriler[1].d);
    const sonTarih=tarihler[tarihler.length-1], [ty,tm]=sonTarih.split('-').map(Number);
    if($('ppkGercek')&&gGercek!=null)$('ppkGercek').innerHTML='fiili %'+trN(gGercek,1)+' <span class="thin" style="font-size:9px">· '+ayAd[tm]+' '+String(ty).slice(2)+' · canlı</span>';
    if($('ppkPiya')&&gPiya!=null){$('ppkPiya').innerHTML='%'+trN(gPiya,1)+' <span class="thin" style="font-size:9px">· canlı</span>';
      if($('ppkPiyaTag')&&gGercek!=null){const makas=gPiya-gGercek;$('ppkPiyaTag').textContent='(makas '+(makas>=0?'+':'')+trN(makas,1)+'pp)';}}
    if($('ppkHane')&&gHane!=null)$('ppkHane').innerHTML='%'+trN(gHane,1)+' <span class="thin" style="font-size:9px">· canlı</span>';
  }catch(e){el.innerHTML='<div class="sub">Grafik yüklenemedi.</div>';}
}


/* ---- Makro kartları EVDS'ten otomatik besleme (grup kodu bilinmiyorsa arama moduyla çözülür) ---- */
const MK_AY=['','Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
const MK_ONBELLEK={};
async function mkGrupBul(ara, tercih){
  const anahtar='ara:'+ara;
  if(MK_ONBELLEK[anahtar]!==undefined)return MK_ONBELLEK[anahtar];
  try{
    const r=await fetch('/api/evds2?ara='+encodeURIComponent(ara));
    const j=await r.json(); const g=(j.gruplar||[]);
    const kk=s=>String(s||'').replace(/İ/g,'i').replace(/I/g,'ı').toLocaleLowerCase('tr');
    // Arşiv / eski baz yıllı gruplar elenir; hepsi arşivse mecburen listeye geri dönülür
    const canli=g.filter(x=>!/arşiv|arsiv|\(200\d=100\)|\(199\d=100\)/.test(kk(x.ad)));
    const havuz=canli.length?canli:g;
    const hit=(tercih?havuz.find(x=>tercih.test(kk(x.ad))):null)||havuz[0]||null;
    MK_ONBELLEK[anahtar]=hit?hit.kod:null;
  }catch(e){MK_ONBELLEK[anahtar]=null;}
  return MK_ONBELLEK[anahtar];
}
// Seri seçimi deterministik: grup listesini çek, adı desene UYAN seriyi seç; uymuyorsa VAZGEÇ (sessiz yedeğe düşme yok)
const mkKK=s=>String(s||'').replace(/İ/g,'i').replace(/I/g,'ı').toLocaleLowerCase('tr');
async function mkListe(grup){
  const anahtar='list:'+grup;
  if(MK_ONBELLEK[anahtar]!==undefined)return MK_ONBELLEK[anahtar];
  try{
    const r=await fetch('/api/evds2?list='+encodeURIComponent(grup));
    const j=await r.json(); MK_ONBELLEK[anahtar]=j.seriler||[];
  }catch(e){MK_ONBELLEK[anahtar]=[];}
  return MK_ONBELLEK[anahtar];
}
/* §247h: seri kodu bir kez ÖLÇÜLDÜYSE arama bitti — doğrudan çekim. */
async function mkSeriKod(kod, gun){
  try{
    const r=await fetch('/api/evds2?series='+encodeURIComponent(kod)+'&gun='+(gun||800)+'&full=1');
    if(!r.ok)return null;
    const d=await r.json(), alan=String(kod).replace(/\./g,'_');
    const items=(d.ham||[]).filter(x=>x[alan]!=null&&x[alan]!=='')
      .map(x=>({t:String(x.Tarih), v:parseFloat(String(x[alan]).replace(',','.'))})).filter(x=>isFinite(x.v));
    return items.length?{items, kod}:null;
  }catch(e){return null;}
}
async function mkSeri(grup, seriDeseni, gun, eleme){
  try{
    const liste=await mkListe(grup); if(!liste.length)return null;
    const uygun=liste.filter(x=>seriDeseni.test(mkKK(x.ad)) && !(eleme&&eleme.test(mkKK(x.ad))));
    if(!uygun.length)return null;                       // eşleşme yoksa kart damgalı kalır
    const sec=uygun[0];
    const r=await fetch('/api/evds2?series='+encodeURIComponent(sec.kod)+'&gun='+(gun||800)+'&full=1');
    if(!r.ok)return null;
    const d=await r.json(), alan=String(sec.kod).replace(/\./g,'_');
    const items=(d.ham||[]).filter(x=>x[alan]!=null&&x[alan]!=='')
      .map(x=>({t:String(x.Tarih), v:parseFloat(String(x[alan]).replace(',','.'))})).filter(x=>isFinite(x.v));
    return items.length?{items, ad:sec.ad, kod:sec.kod}:null;
  }catch(e){return null;}
}
// Dolar serilerinde ölçek: EVDS bin/milyon $ karışık verir → milyar dolara indir
function mkMlr(v){
  const m=Math.abs(v);
  const b = m>=1e6 ? 1e6 : m>=1e3 ? 1e3 : 1;
  return v/b;
}
const mkCanli=' <span class="thin" style="font-size:9px">· canlı</span>';
function mkDonem(t){                       // "2026-6" ya da "2026-Q1"
  const m=String(t).match(/^(\d{4})-(?:Q)?(\d{1,2})$/);
  if(!m)return {etiket:String(t)};
  const y=+m[1], p=+m[2];
  const ay=MK_AY[p];
  return {yil:y, per:p, ceyrek:String(t).includes('Q'), etiket:String(t).includes('Q')?('Ç'+p+"'"+String(y).slice(2)):(ay||String(t))};
}
async function makroKartlar(){
  // 1) Büyüme (GSYH, zincirlenmiş hacim · çeyreklik YoY)
  try{
    const g=await mkGrupBul('gayrisafi yurt içi hasıla', /zincirlenmiş hacim/);
    const s=g?await mkSeri(g,/gayrisafi yurt içi hasıla|gsyh|toplam/,2000,/kişi başı|per capita/):null;
    if(s&&s.items.length>=5){
      const son=s.items[s.items.length-1], onceki=s.items[s.items.length-5];
      const yoy=(son.v/onceki.v-1)*100, d=mkDonem(son.t);
      if($('buyumeVal')){$('buyumeVal').textContent=(yoy>=0?'+':'−')+'%'+trN(Math.abs(yoy),1);$('buyumeVal').className='val '+(yoy>=0?'up':'down');}
      if($('buyumeSub'))$('buyumeSub').innerHTML='zincirlenmiş hacim · yıllık'+mkCanli;
      if($('buyumeTag')&&d.etiket)$('buyumeTag').textContent=d.etiket;
    }
  }catch(e){}
  // 2) TÜFE (yıllık + aylık) — grup zaten biliniyor
  try{
    const s=await mkSeri('bie_tukfiy2025',/genel/,700,/özel kapsamlı|mevsim/);
    if(s&&s.items.length>=13){
      const son=s.items[s.items.length-1], onc=s.items[s.items.length-2], yil=s.items[s.items.length-13];
      const yoy=(son.v/yil.v-1)*100, mom=(son.v/onc.v-1)*100, d=mkDonem(son.t);
      if($('tufeVal')){$('tufeVal').textContent='%'+trN(yoy,2);$('tufeVal').className='val '+(yoy>30?'down':'');}
      if($('tufeSub'))$('tufeSub').innerHTML='aylık %'+trN(mom,2)+mkCanli;
      if($('tufeTag')&&d.etiket)$('tufeTag').textContent=d.etiket;
    }
  }catch(e){}
  // 3) Yİ-ÜFE
  try{
    /* §247k: /genel/ deseni 124 serinin HİÇBİRİNDE geçmiyor (ölçüldü) —
       ana seri 'T1: 1.Yurt İçi Üretici Fiyat Endeksi'. Kod doğrudan. */
    const s=await mkSeriKod('TP.TUFE1YI.T1',700);
    if(s&&s.items.length>=13){
      const son=s.items[s.items.length-1], onc=s.items[s.items.length-2], yil=s.items[s.items.length-13];
      const yoy=(son.v/yil.v-1)*100, mom=(son.v/onc.v-1)*100, d=mkDonem(son.t);
      if($('ufeVal'))$('ufeVal').textContent='%'+trN(yoy,2);
      if($('ufeSub'))$('ufeSub').innerHTML='aylık %'+trN(mom,2)+mkCanli;
      if($('ufeTag')&&d.etiket)$('ufeTag').textContent=d.etiket;
    }
  }catch(e){}
  // 4) Dış ticaret dengesi (aylık + 12 ay toplam)
  try{
    const g=await mkGrupBul('dış ticaret', /dış ticaret/);
    const s=g?await mkSeri(g,/denge|açık/,900,/hizmet|endeks|oran|yüzde/):null;
    if(s&&s.items.length>=12){
      const son=s.items[s.items.length-1], d=mkDonem(son.t);
      const yillik=s.items.slice(-12).reduce((t,x)=>t+x.v,0);
      if($('disticVal'))$('disticVal').textContent=trN(Math.abs(mkMlr(son.v)),2)+' mlr $';
      if($('disticSub'))$('disticSub').innerHTML='yıllık '+trN(Math.abs(mkMlr(yillik)),1)+' mlr'+mkCanli;
      if($('disticTag')&&d.etiket)$('disticTag').textContent=d.etiket;
    }
  }catch(e){}
  // 5) Rezervler (TCMB brüt)
  try{
    const g=await mkGrupBul('rezerv', /toplam uluslararası rezerv|merkez bankası rezerv/);
    const s=g?await mkSeri(g,/toplam rezerv|brüt|toplam/,400,/altın hariç|net/):null;
    if(s&&s.items.length){
      const son=s.items[s.items.length-1], d=mkDonem(son.t);
      if($('rezervVal'))$('rezervVal').textContent=trN(mkMlr(son.v),1)+' mlr $';
      if($('rezervSub'))$('rezervSub').innerHTML='TCMB brüt rezerv'+mkCanli;
      if($('rezervTag')&&d.etiket)$('rezervTag').textContent=d.etiket;
    }
  }catch(e){}
}


/* ---- Bankacılık sekmesi (BDDK Aylık Bülten) ---- */
let BNK=null;
function bnkSay(v,d){ return (v==null||!isFinite(v))?'—':trN(v,d===undefined?0:d); }
function bnkMlr(v){ return (v==null||!isFinite(v))?'—':trN(v/1e6,2); }   // milyon TL → trilyon TL
function bnkRender(){
  if(!$('bnkOzet'))return;
  if(!BNK||!BNK.ok){
    $('bnkOzet').innerHTML='<div class="sub" style="font-size:11px">BDDK verisi alınamadı — bülten yayımlanmamış ya da kaynak yanıt vermiyor olabilir.</div>';
    if($('bnkDamga'))$('bnkDamga').textContent='veri yok';
    return;
  }
  const k=BNK.gruplar['10003']||{}, t=BNK.gruplar['10001']||{}, p=BNK.pay||{};
  const ok=(x)=>x==null?'':(x>=0?'up':'down'), im=(x)=>x==null?'—':((x>=0?'+':'')+trN(x,2)+'%');
  const kart=(baslik,deger,alt,sinif)=>'<div class="card" style="padding:8px 10px">'+
    '<div class="lbl" style="margin-bottom:2px">'+baslik+'</div>'+
    '<div class="val '+(sinif||'')+'" style="font-size:16px">'+deger+'</div>'+
    '<div class="sub" style="font-size:10px">'+alt+'</div></div>';
  $('bnkOzet').innerHTML=
    kart('Katılım Aktif', bnkMlr(k.aktif)+' trn ₺', 'sektör payı %'+bnkSay(p.aktif,2)+' · aylık <span class="'+ok(k.aylik&&k.aylik.aktif)+'">'+im(k.aylik&&k.aylik.aktif)+'</span>')+
    kart('Kullandırılan Fon', bnkMlr(k.krediler)+' trn ₺', 'sektör payı %'+bnkSay(p.krediler,2)+' · aylık <span class="'+ok(k.aylik&&k.aylik.krediler)+'">'+im(k.aylik&&k.aylik.krediler)+'</span>')+
    kart('Toplanan Fon', bnkMlr(k.mevduat)+' trn ₺', 'sektör payı %'+bnkSay(p.mevduat,2)+' · aylık <span class="'+ok(k.aylik&&k.aylik.mevduat)+'">'+im(k.aylik&&k.aylik.mevduat)+'</span>')+
    kart('Özkaynak', bnkMlr(k.ozkaynak)+' trn ₺', 'sektör payı %'+bnkSay(p.ozkaynak,2)+' · kaldıraç '+bnkSay(k.oran&&k.oran.kaldirac,1)+'x')+
    kart('Dönem Kârı', bnkMlr(k.donemKari)+' trn ₺', 'özkaynak kârlılığı %'+bnkSay(k.oran&&k.oran.ozkaynakKarlilik,1))+
    kart('Fon Kullandırma', '%'+bnkSay(k.oran&&k.oran.krediMevduat,1), 'sektör %'+bnkSay(t.oran&&t.oran.krediMevduat,1)+' · takip %'+bnkSay(k.oran&&k.oran.takipOrani,2));
  // Grup tablosu
  const sira=['10001','10002','10003','10004'];
  $('bnkGrupBody').innerHTML=sira.map(kod2=>{
    const g=BNK.gruplar[kod2]; if(!g)return '';
    const vur=kod2==='10003'?' style="color:var(--mm2);font-weight:700"':'';
    return '<tr'+(kod2==='10003'?' style="background:rgba(15,162,107,0.06)"':'')+'>'+
      '<td'+vur+'>'+esc(g.ad)+'</td>'+
      '<td class="num">'+bnkSay(g.aktif)+'</td><td class="num">'+bnkSay(g.krediler)+'</td>'+
      '<td class="num">'+bnkSay(g.mevduat)+'</td><td class="num">'+bnkSay(g.ozkaynak)+'</td>'+
      '<td class="num">'+bnkSay(g.oran&&g.oran.krediMevduat,1)+'</td>'+
      '<td class="num">'+bnkSay(g.oran&&g.oran.takipOrani,2)+'</td>'+
      '<td class="num">'+bnkSay(g.oran&&g.oran.kaldirac,1)+'</td>'+
      '<td class="num">'+bnkSay(g.oran&&g.oran.ypPayi,1)+'</td>'+
      '<td class="num">'+bnkSay(g.oran&&g.oran.ozkaynakKarlilik,1)+'</td></tr>';
  }).join('');
  // Okuma notu
  if($('bnkNot')&&p.mevduat!=null&&p.krediler!=null){
    const fark=trN(p.mevduat-p.krediler,2);
    $('bnkNot').innerHTML='Katılım bankaları fon <b>toplamada</b> (%'+bnkSay(p.mevduat,2)+') fon <b>kullandırmaktan</b> (%'+
      bnkSay(p.krediler,2)+') güçlü — aradaki '+fark+' puanlık fark, sisteme akan katılım tasarrufunun bir kısmının '+
      'krediye değil <b>kira sertifikası ve TCMB</b> tarafına gittiğini gösterir; sukuk talebinin yapısal kaynağı budur. '+
      'Fon kullandırma oranı %'+bnkSay(k.oran&&k.oran.krediMevduat,1)+' ile sektörün (%'+bnkSay(t.oran&&t.oran.krediMevduat,1)+
      ') altında kalıyor.';
  }
  // Kalem tablosu
  const kl=BNK.katilimKalemleri||[];
  $('bnkKalemBody').innerHTML=kl.map(x=>{
    const kalin=/^toplam /i.test(x.kalem||'');
    const ypP=(x.yp!=null&&x.toplam)?(x.yp/x.toplam*100):null;
    return '<tr'+(kalin?' style="background:rgba(15,162,107,0.05)"':'')+'>'+
      '<td class="sub" style="font-size:9px">'+esc(x.sira||'')+'</td>'+
      '<td style="font-family:var(--sans);font-size:10.5px'+(kalin?';font-weight:700':'')+'">'+esc(x.kalem||'')+'</td>'+
      '<td class="num">'+bnkSay(x.tp)+'</td><td class="num">'+bnkSay(x.yp)+'</td>'+
      '<td class="num"'+(kalin?' style="font-weight:700"':'')+'>'+bnkSay(x.toplam)+'</td>'+
      '<td class="num sub">'+(ypP==null?'—':trN(ypP,0))+'</td></tr>';
  }).join('');
  if($('bnkDamga'))$('bnkDamga').textContent='BDDK · '+BNK.donem+' · '+kl.length+' kalem';
}
/* Sahiplik kırılımı — BDDK'nın yasal olarak izin verdiği en ince granülerlik.
   Banka bazında veri yayımlanmaz (Bankacılık Kanunu gizlilik hükmü: veriler kuruluşun
   tespitini engelleyecek şekilde toplulaştırılır), bu yüzden kamu/yerli özel/yabancı
   ayrımı banka seçimine en yakın kamusal sinyaldir. */
let BNKS=null;
function bnkShpRender(){
  const tb=$('bnkShpBody'); if(!tb)return;
  if(!BNKS||!BNKS.ok||!BNKS.gruplar){
    tb.innerHTML='<tr><td colspan="11" class="sub" style="font-size:11px">Sahiplik verisi alınamadı.</td></tr>';
    if($('bnkShpDamga'))$('bnkShpDamga').textContent='veri yok';
    return;
  }
  const G=BNKS.gruplar, sira=['10005','10006','10007'];
  const ok=(x)=>x==null?'':(x>=0?'up':'down'), im=(x)=>x==null?'—':((x>=0?'+':'')+trN(x,2));
  tb.innerHTML=sira.map(kod=>{
    const g=G[kod]; if(!g)return '';
    const o=g.oran||{};
    return '<tr><td style="font-family:var(--sans);font-size:10.5px;font-weight:600">'+esc(g.ad)+'</td>'+
      '<td class="num">'+bnkSay(g.sektorPayi,1)+'</td>'+
      '<td class="num">'+bnkSay(g.aktif)+'</td>'+
      '<td class="num">'+bnkSay(g.krediler)+'</td>'+
      '<td class="num '+ok(g.aylik&&g.aylik.krediler)+'">'+im(g.aylik&&g.aylik.krediler)+'</td>'+
      '<td class="num">'+bnkSay(o.krediMevduat,1)+'</td>'+
      '<td class="num">'+bnkSay(o.takipOrani,2)+'</td>'+
      '<td class="num">'+bnkSay(o.kaldirac,1)+'</td>'+
      '<td class="num">'+bnkSay(o.ypPayi,1)+'</td>'+
      '<td class="num">'+bnkSay(o.aktifKarlilikYil,2)+'</td>'+
      '<td class="num">'+bnkSay(o.ozkaynakKarlilikYil,1)+'</td></tr>';
  }).join('');
  if($('bnkShpDamga'))$('bnkShpDamga').textContent='BDDK · '+BNKS.donem+' · yıllıklandırılmış';
  // Okuma notu — makas kendiliğinden hesaplanır, elle güncelleme gerekmez
  const nt=$('bnkShpNot');
  if(nt){
    const kamu=G['10005']||{}, ozel=G['10006']||{}, yab=G['10007']||{};
    const ko=kamu.oran||{}, oo=ozel.oran||{}, yo=yab.oran||{};
    const makas=(yo.aktifKarlilikYil!=null&&ko.aktifKarlilikYil)?(yo.aktifKarlilikYil/ko.aktifKarlilikYil):null;
    nt.innerHTML='Sektör aynı makro ortamda çalışıyor, ama kârlılık farkı sahiplikle keskinleşiyor: '+
      'yabancı sermayeli bankaların aktif kârlılığı <b>%'+bnkSay(yo.aktifKarlilikYil,2)+'</b>, kamununki '+
      '<b>%'+bnkSay(ko.aktifKarlilikYil,2)+'</b>'+(makas?(' — yaklaşık <b>'+trN(makas,1)+' kat</b>'):'')+'. '+
      'Kamu grubu en yüksek fon kullandırma oranıyla (%'+bnkSay(ko.krediMevduat,1)+') çalışıp en düşük kârlılığı alıyor; '+
      'bu, kredi genişlemesinin bir kısmının fiyatlama disiplininden değil <b>politika işlevinden</b> geldiğinin bilanço tarafındaki izidir. '+
      'Yerli özel grup en temiz aktif kalitesine sahip (takip %'+bnkSay(oo.takipOrani,2)+'), buna karşılık en yüksek kaldıraçla '+
      '('+bnkSay(oo.kaldirac,1)+'x) çalışıyor. Aylık kredi büyümesinde kamunun özelden ayrışması, TCMB duruşunun '+
      '<b>fiilen</b> ne kadar sıkı olduğunu politika faizinden daha dürüst gösterir — bu satırı her ay izlemeye değer.';
  }
}
/* Sektörel kredi stresi — BDDK Tablo 5.
   Neden değerli: takip oranının SEVİYESİ değil YÖNÜ (Δ bp) öncü göstergedir.
   Bir sektörün kredi stresi, o sektörün hisselerine yansımadan önce burada görünür. */
let BNKSEK=null;
function bnkSekRender(){
  const tb=$('bnkSekBody'); if(!tb)return;
  if(!BNKSEK||!BNKSEK.ok||!BNKSEK.sektorler){
    tb.innerHTML='<tr><td colspan="8" class="sub" style="font-size:11px">Sektörel kredi verisi alınamadı.</td></tr>';
    if($('bnkSekDamga'))$('bnkSekDamga').textContent='veri yok';
    return;
  }
  const S=BNKSEK.sektorler;
  // Δ takip: ARTIŞ kötüdür → kırmızı; düşüş iyidir → yeşil (getiri renklerinin tersi)
  const dSinif=(x)=>x==null?'':(x>0?'down':(x<0?'up':''));
  const dYaz=(x)=>x==null?'—':((x>0?'+':'')+trN(x,0));
  tb.innerHTML=S.map(s=>{
    const vurgu = (s.takipDeltaBp!=null && s.takipDeltaBp>=25) ? ' style="background:rgba(224,96,112,0.07)"' : '';
    return '<tr'+vurgu+'>'+
      '<td style="font-family:var(--sans);font-size:10.5px">'+esc(s.kalem)+'</td>'+
      '<td class="num">'+bnkSay(s.nakdi)+'</td>'+
      '<td class="num">'+bnkSay(s.pay,2)+'</td>'+
      '<td class="num">'+bnkSay(s.takipOrani,2)+'</td>'+
      '<td class="num '+dSinif(s.takipDeltaBp)+'">'+dYaz(s.takipDeltaBp)+'</td>'+
      '<td class="num">'+bnkSay(s.aylikKredi,2)+'</td>'+
      '<td class="num sub">'+bnkSay(s.uzunVadePayi,0)+'</td>'+
      '<td class="num sub">'+bnkSay(s.gayriNakdi)+'</td></tr>';
  }).join('');
  if($('bnkSekDamga'))$('bnkSekDamga').textContent='BDDK T5 · '+BNKSEK.donem+' · '+S.length+' sektör';
  const nt=$('bnkSekNot'); if(!nt)return;
  // MADDİYAT FİLTRESİ: küçük defterlerde takip oranı gürültülüdür — 1,5 mlr TL'lik bir
  // defterde tek kredinin takibe düşmesi oranı uçurur. Öne çıkarmadan önce payı ≥%1 olmalı.
  const ESIK=1.0;
  const maddi=S.filter(x=>x.pay!=null && x.pay>=ESIK);
  const dVar=maddi.filter(x=>x.takipDeltaBp!=null);
  const kotu=dVar.slice().sort((a,b)=>b.takipDeltaBp-a.takipDeltaBp)[0];
  const iyi =dVar.slice().sort((a,b)=>a.takipDeltaBp-b.takipDeltaBp)[0];
  const yuksek=maddi.slice().sort((a,b)=>(b.takipOrani||0)-(a.takipOrani||0))[0];
  const hizli =maddi.filter(x=>x.aylikKredi!=null).sort((a,b)=>b.aylikKredi-a.aylikKredi)[0];
  // Hane halkı defteri: kredi kartı + ferdi krediler. Kurumsalla kalite farkı sistemik bilgidir.
  const haneMi=x=>/^(kredi kartlar|ferdi kredi)/i.test(x.kalem);
  const tkTut=x=>(x.takip!=null?x.takip:0);
  const hN=S.filter(haneMi).reduce((a,b)=>a+(b.nakdi||0),0), hT=S.filter(haneMi).reduce((a,b)=>a+tkTut(b),0);
  const tN=S.reduce((a,b)=>a+(b.nakdi||0),0),            tT=S.reduce((a,b)=>a+tkTut(b),0);
  const kN=tN-hN, kT=tT-hT;
  let m='<b>Δ Takip</b> sütunu bu tablonun asıl bilgisidir: takip oranının <i>seviyesi</i> geçmişi, '+
        '<i>yönü</i> ise geleceği anlatır. Bankaların kredi defterindeki bozulma, o sektörün hisselerine '+
        'yansımadan önce burada görünür — sektör ısı haritasını bu sütunla birlikte oku.';
  if(hN&&kN){
    m+=' <b>Hane halkı vs kurumsal:</b> hane defteri (kredi kartı + ferdi krediler) toplam kredinin '+
      '<b>%'+trN(hN/tN*100,1)+'</b>\'i ama takipteki alacakların <b>%'+trN(hT/tT*100,1)+'</b>\'i — '+
      'takip oranı %'+trN(hT/(hN+hT)*100,2)+' ile kurumsalın (%'+trN(kT/(kN+kT)*100,2)+') belirgin üstünde. '+
      'Hane kredisi hızlı büyürken bu makas açılıyorsa, para politikasının sıkılığı hanehalkına ulaşmıyor demektir.';
  }
  if(kotu&&kotu.takipDeltaBp>0) m+=' Maddi büyüklükteki defterler arasında bu ay en çok bozulan: <b>'+
    esc(kotu.kalem)+'</b> (+'+trN(kotu.takipDeltaBp,0)+' bp → takip %'+trN(kotu.takipOrani,2)+
    (kotu.aylikKredi!=null&&kotu.aylikKredi<1.5?', üstelik defteri yavaş büyürken — bozulma seyrelme etkisiyle açıklanamaz':'')+').';
  if(iyi&&iyi.takipDeltaBp<0) m+=' En çok iyileşen: <b>'+esc(iyi.kalem)+'</b> ('+trN(iyi.takipDeltaBp,0)+' bp).';
  if(yuksek) m+=' Seviye olarak en riskli büyük defter <b>'+esc(yuksek.kalem)+'</b> (%'+trN(yuksek.takipOrani,2)+').';
  if(hizli) m+=' Kredinin en hızlı aktığı yer <b>'+esc(hizli.kalem)+'</b> (aylık +%'+trN(hizli.aylikKredi,2)+
    '); hızlı büyüyen bir defterde takip oranı mekanik olarak seyrelir, o yüzden bu ikisini birlikte değerlendir.';
  m+=' <span class="thin">Öne çıkarmalar defter payı ≥%'+trN(ESIK,0)+' olan sektörlerle sınırlıdır — '+
     'küçük defterlerde takip oranı gürültülüdür. Kaynak bin TL yayımlanır, tabloda milyon TL\'ye çevrildi.</span>';
  nt.innerHTML=m;
}
/* Kart harcamaları — TCMB EVDS bie_kkhartut (haftalık akım → aylık, reel)
   Neden reel: %30 enflasyonda nominal artış bilgi taşımaz. Sıralama REEL yıllık değişime göre;
   nominal sütun sadece karşılaştırma için duruyor. */
let KART=null;
function kartRender(){
  const tb=$('kartBody'); if(!tb)return;
  if(!KART||!KART.ok){
    tb.innerHTML='<tr><td colspan="6" class="sub" style="font-size:11px">Kart harcama verisi alınamadı.</td></tr>';
    if($('kartDamga'))$('kartDamga').textContent='veri yok'; return;
  }
  const mlr=v=>v==null?'—':trN(v/1e6,1);           // bin TL → milyar TL
  const im=(v,d)=>v==null?'—':((v>=0?'+':'')+trN(v,d==null?1:d));
  const sn=v=>v==null?'':(v>=0?'up':'down');
  tb.innerHTML=KART.sektorler.map(s=>
    '<tr><td style="font-family:var(--sans);font-size:10.5px">'+esc(s.ad)+'</td>'+
    '<td class="num">'+mlr(s.tutar)+'</td>'+
    '<td class="num">'+(s.pay==null?'—':trN(s.pay,2))+'</td>'+
    '<td class="num sub">'+im(s.yoy)+'</td>'+
    '<td class="num '+sn(s.reelYoy)+'" style="font-weight:600">'+im(s.reelYoy)+'</td>'+
    '<td class="num '+sn(s.mom)+'">'+im(s.mom)+'</td></tr>').join('');
  const t=KART.toplam||{}, X=KART.exKamu, K=KART.kumeler||{};
  const kutu=(b,d,alt,cls)=>'<div class="card"><div class="k">'+b+'</div><div class="v'+(cls?' '+cls:'')+'">'+d+'</div><div class="sub">'+alt+'</div></div>';
  if($('kartOzet'))$('kartOzet').innerHTML=
    kutu('AYLIK TOPLAM', mlr(t.tutar)+' mlr ₺', KART.donem+' · '+(t.hafta||'—')+' hafta · TÜFE %'+(KART.tufe?trN(KART.tufe.yoy,1):'—'))+
    kutu('REEL YILLIK', im(t.reelYoy)+'%', 'nominal '+im(t.yoy)+'% · manşet', sn(t.reelYoy))+
    kutu('REEL — VERGİ HARİÇ', X?im(X.reelYoy)+'%':'—', 'asıl tüketim okuması', X?sn(X.reelYoy):'')+
    kutu('TEMEL', K.temel?im(K.temel.reelYoy)+'%':'—', K.temel?('reel · payı %'+trN(K.temel.pay,1)):'—', K.temel?sn(K.temel.reelYoy):'')+
    kutu('KEYFİ', K.keyfi?im(K.keyfi.reelYoy)+'%':'—', K.keyfi?('reel · payı %'+trN(K.keyfi.pay,1)):'—', K.keyfi?sn(K.keyfi.reelYoy):'')+
    kutu('MAKAS', KART.makas!=null?im(KART.makas)+' puan':'—', 'temel − keyfi · sıkışma ölçüsü', KART.makas!=null?(KART.makas>0?'down':'up'):'');
  if($('kartDamga'))$('kartDamga').textContent='EVDS · '+KART.donem+' · '+KART.sektorler.length+' sektör';
  const nt=$('kartNot'); if(!nt)return;
  const R=KART.sektorler.filter(x=>x.reelYoy!=null);
  // Maddiyat eşiği %3. Kamu/Vergi ve Kuyumcular TÜKETİM DEĞİL — "en güçlü sektör"
  // seçiminden çıkarılır, yoksa tablo vergi ödemesini tüketim canlılığı sanır.
  const disi=new Set(['Kamu / Vergi Ödemeleri','Kuyumcular']);
  const buyuk=R.filter(x=>x.pay!=null&&x.pay>=3&&!disi.has(x.ad));
  const iyi=buyuk[0], kotu=buyuk[buyuk.length-1];
  const daralan=R.filter(x=>x.reelYoy<0).length;
  let m='<b>REEL sütunu bu tablonun asıl bilgisidir.</b> Nominal harcama artışı %'+
    (KART.tufe?trN(KART.tufe.yoy,1):'—')+' enflasyonda kendiliğinden yüksek çıkar; '+
    'tüketimin gerçekten arttığı yer, TÜFE\'den <i>hızlı</i> büyüyen sektördür. ';
  if(X&&t.reelYoy!=null) m+='<b>Manşet yanıltıcıdır:</b> toplam reel '+im(t.reelYoy)+
    '% görünüyor ama bunun içinde kartla yapılan <b>vergi ödemeleri</b> var — harcama değil yükümlülük. '+
    'Çıkarıldığında gerçek tüketim reel <b class="'+sn(X.reelYoy)+'">'+im(X.reelYoy)+'%</b>. ';
  if(K.temel&&K.keyfi&&KART.makas!=null) m+='<b>Asıl sinyal kompozisyonda:</b> temel harcama reel '+
    im(K.temel.reelYoy)+'% büyürken keyfi harcama '+im(K.keyfi.reelYoy)+'% — aradaki <b>'+
    im(KART.makas)+' puanlık makas</b> hanehalkının zorunlu tüketimi koruyup isteğe bağlıyı kestiğini gösterir. '+
    'Makas açıldıkça sıkışma derinleşiyor demektir; bu tek sayıyı her ay izle. ';
  if(K.korunma&&K.korunma.reelYoy!=null&&K.korunma.reelYoy>0&&K.keyfi&&K.keyfi.reelYoy<0)
    m+='Kuyumcu harcaması reel '+im(K.korunma.reelYoy)+'% ile artıyor — Türkiye\'de altın alımı tüketim değil '+
       '<b>enflasyondan korunma</b>dır; keyfi harcama daralırken bunun artması tasarruf güdüsünün güçlendiğine işaret eder. ';
  if(iyi) m+='Tüketim tarafında reel en güçlü büyük kalem <b>'+esc(iyi.ad)+'</b> ('+im(iyi.reelYoy)+'%, payı %'+trN(iyi.pay,1)+'), ';
  if(kotu&&kotu!==iyi) m+='en zayıfı <b>'+esc(kotu.ad)+'</b> ('+im(kotu.reelYoy)+'%'+
    (kotu.mom!=null&&kotu.mom<0?', üstelik aylık '+im(kotu.mom)+'% ile ivmelenerek':'')+'). ';
  m+='Toplam <b>'+daralan+'</b> sektörde harcama reel olarak daralıyor. ';
  m+='<span class="thin">Kartlı ödemenin payı nakitten karta geçişle yapısal olarak artıyor; bu tüm kalemlere '+
     'yapay bir rüzgâr verir, dolayısıyla mutlak reel büyüme gerçek tüketim artışını abartır. Güvenilir sinyal '+
     'seviye değil <b>sektörler arası sıralama ve makas</b>tır. Haftalık akım aylığa toplanarak çevrildi, '+
     'karşılaştırmalar haftalık ortalama üzerinden. Tutarlar bin TL yayımlanır, tabloda milyar TL. '+
     'Kaynak: '+esc(KART.kaynak||'')+'.</span>';
  nt.innerHTML=m;
}
async function kartInit(){
  if(!$('kartBody'))return;
  try{ KART=await (await fetch('/api/evds2?mod=kart')).json(); }catch(e){ KART=null; }
  kartRender();
}
kartInit();

async function bnkInit(){
  if(!$('bnkOzet'))return;
  // Üç uç nokta bağımsız: biri düşerse diğerleri render olur
  const [a,b,c]=await Promise.allSettled([
    fetch('/api/bddk?panel=1').then(r=>r.json()),
    fetch('/api/bddk?sahiplik=1').then(r=>r.json()),
    fetch('/api/bddk?sektor=1').then(r=>r.json())
  ]);
  BNK    = a.status==='fulfilled' ? a.value : null;
  BNKS   = b.status==='fulfilled' ? b.value : null;
  BNKSEK = c.status==='fulfilled' ? c.value : null;
  bnkRender();
  bnkShpRender();
  bnkSekRender();
}
/* ---- Özel Kapsamlı TÜFE (A–F) · EVDS otomatik ---- */
const OKT_STATIK=[
 ['A','Mevsimlik ürünler hariç',1.48,33.51],
 ['B','İşlenmemiş gıda, enerji, alkol-tütün, altın hariç',1.66,31.18],
 ['C','Enerji, gıda, alkol-tütün, altın hariç (çekirdek)',1.46,29.84],
 ['D','İşlenmemiş gıda, alkol-tütün hariç',1.41,31.88],
 ['E','Alkol ve tütün hariç',0.92,32.01],
 ['F','Yönetilen-yönlendirilen fiyatlar hariç',0.79,30.45]];
let OKT_CANLI=null, OKT_DONEM='';
function oktRender(){
  const tb=$('oktBody'); if(!tb)return;
  let say=0;
  tb.innerHTML=OKT_STATIK.map(r=>{
    const c=OKT_CANLI?OKT_CANLI[r[0]]:null;
    const ay=(c&&c.aylik!=null)?c.aylik:r[2], yil=(c&&c.yillik!=null)?c.yillik:r[3], tz=!!(c&&c.yillik!=null);
    if(tz)say++;
    const vur=(k)=>k==='C'?' style="color:var(--mm2);font-weight:600"':'';
    return '<tr><td><b>'+r[0]+'</b>'+(tz?'<span style="color:var(--mm2);font-size:8px"> ●</span>':'')+'</td>'+
      '<td style="font-family:var(--sans);font-size:10px;color:var(--muted)">'+esc(r[1])+'</td>'+
      '<td class="num"'+(r[0]==='F'?' style="color:var(--mm2);font-weight:600"':'')+'>'+trN(ay,2)+'</td>'+
      '<td class="num"'+vur(r[0])+'>'+trN(yil,2)+'</td></tr>';
  }).join('');
  const d=$('oktDamga');
  if(d)d.textContent=say?('EVDS · '+say+'/6 gösterge'+(OKT_DONEM?' · '+OKT_DONEM:'')):'damgalı (Haz 2026)';
}
async function oktCek(){
  try{
    let g='bie_oktug2025';
    if(!(await mkListe(g)).length) g=await mkGrupBul('özel kapsamlı', /özel kapsamlı tüfe/)||g;
    const liste=await mkListe(g);
    const bul={};
    // Seri adlarında gösterge harfi: "... (A)" / "A-Mevsimlik" / "TÜFE-A" gibi biçimlerin hepsini yakala
    ['A','B','C','D','E','F'].forEach(h=>{
      const dsn=new RegExp('(^|[^a-zçğıöşü])'+h.toLowerCase()+'([^a-zçğıöşü]|$)');
      const hit=liste.find(x=>{const ad=mkKK(x.ad); return dsn.test(ad);});
      if(hit)bul[h]=hit;
    });
    const kodlar=Object.values(bul).map(x=>x.kod);
    if(!kodlar.length){oktRender();return;}
    const r=await fetch('/api/evds2?series='+encodeURIComponent(kodlar.join(','))+'&gun=700&full=1');
    if(!r.ok){oktRender();return;}
    const d=await r.json(), ham=d.ham||[];
    const sonuc={};
    Object.entries(bul).forEach(([h,s])=>{
      const alan=String(s.kod).replace(/\./g,'_');
      const dizi=ham.filter(x=>x[alan]!=null&&x[alan]!=='').map(x=>({t:String(x.Tarih),v:parseFloat(String(x[alan]).replace(',','.'))})).filter(x=>isFinite(x.v));
      if(dizi.length>=13){
        const son=dizi[dizi.length-1], onc=dizi[dizi.length-2], yil=dizi[dizi.length-13];
        // Bayat/ileri tarihli seri elenir: son gözlem son 4 ay içinde olmalı
        const d0=mkDonem(son.t), simdi=new Date();
        const ayFark=(d0&&d0.yil&&d0.per&&!d0.ceyrek)?((simdi.getFullYear()-d0.yil)*12+(simdi.getMonth()+1-d0.per)):0;
        if(ayFark>=0&&ayFark<=4){
          sonuc[h]={aylik:(son.v/onc.v-1)*100, yillik:(son.v/yil.v-1)*100, tarih:son.t};
          OKT_DONEM=(d0||{}).etiket||son.t;
        }
      }
    });
    if(Object.keys(sonuc).length)OKT_CANLI=sonuc;
  }catch(e){}
  oktRender();
}

/* §247d TÜFE HARCAMA GRUPLARI + Yİ-ÜFE → EVDS CANLI (OKT deseni).
   Statik dizi = damgalı yedek; mkGrupBul/mkSeri meta katalogdan bulur —
   SERİ KODU TAHMİN EDİLMEZ, ad desenine uymayan satır damgalı kalır.
   Katkı pp yalnız damgalı dönemden bilinir: canlı ayda ağırlık serisi
   bağlanana dek '—' basılır (yaklaşık katkı UYDURULMAZ). */
const HRC_STATIK=[   /* §247h: konut/ulaştırma ÖLÇÜLEN kodla (desen aramaları o iki satırda tutmuyordu) */
  ['Konut, su, elektrik, gaz', /konut/, 45.14, '5,92', 1, 'TP.TUKFIY2025.04'],
  ['Gıda ve alkolsüz içecekler', /gıda.*alkolsüz/, 35.45, '8,61', 0, null],
  ['TÜFE — Genel', /genel/, 32.11, '—', 2, null],
  ['Ulaştırma', /ulaştırma/, 31.15, '5,19', 0, 'TP.TUKFIY2025.07']];
let HRC_CANLI=null, HRC_DONEM='';
function hrcRender(){
  const el=$('hrcBody'); if(!el)return;
  const veriler=HRC_STATIK.map(r=>{
    const c=HRC_CANLI?HRC_CANLI[r[0]]:null;
    return {ad:r[0], yil:(c&&c.yillik!=null)?c.yillik:r[2], katki:c?'—':r[3], tz:!!c, tip:r[4]};
  });
  const max=Math.max(...veriler.map(v=>v.yil));
  el.innerHTML='<div class="bar" style="font-weight:700;color:var(--muted)"><span class="bn">GRUP</span><span></span><span class="bv" style="font-family:var(--sans);font-size:9px">YILLIK %</span><span class="bk" style="font-family:var(--sans);font-size:9px">KATKI pp</span></div>'+
   veriler.map(v=>'<div class="bar"><span class="bn">'+(v.tip===2?'<b>':'')+esc(v.ad)+(v.tip===2?'</b>':'')+(v.tz?'<span style="color:var(--mm2);font-size:8px"> ●</span>':'')+'</span>'+
     '<span class="bt"><span class="bf" style="width:'+(v.yil/max*100).toFixed(1)+'%'+(v.tip===2?';background:#152720':'')+'"></span></span>'+
     '<span class="bv'+(v.tip===1?' down':'')+'">'+(v.tip===2?'<b>':'')+trN(v.yil,2)+(v.tip===2?'</b>':'')+'</span>'+
     '<span class="bk">'+v.katki+'</span></div>').join('');
  const d=$('hrcDamga');
  if(d){ const eks=HRC_CANLI?HRC_STATIK.filter(r=>!HRC_CANLI[r[0]]).map(r=>r[0].split(',')[0]):[];
    d.textContent=HRC_CANLI?('EVDS · '+HRC_DONEM+(eks.length?' · eşleşmeyen: '+eks.join(', '):'')):'damgalı (Haz 2026)'; }
}
async function hrcCek(){
  try{
    const g='bie_tukfiy2025';  /* §247f: kullanıcı ölçümüyle SABİT — 'Tüketici Fiyat Endeksi (2025=100)', güncel baz */
    if(g){
      const sonuc={};
      for(const r of HRC_STATIK){
        const s=r[5]?await mkSeriKod(r[5],800):await mkSeri(g, r[1], 800, /arşiv/);  /* §247h: kod varsa aramasız */
        if(s&&s.items.length>=13){
          const A=s.items, son=A[A.length-1], onceYil=A[A.length-13];
          const yillik=(son.v/onceYil.v-1)*100;
          if(isFinite(yillik)){ sonuc[r[0]]={yillik, tarih:son.t}; HRC_DONEM=son.t; }
        }
      }
      if(Object.keys(sonuc).length>=2)HRC_CANLI=sonuc;   // en az 2 satır eşleşmeden canlıya geçme
    }
  }catch(e){}
  hrcRender();
}
const UFE_STATIK_SOL=[
  ['Yİ-ÜFE — aylık / yıllık', /yurt içi üretici/, '%1,80 / %28,09', 9],   /* §247g: ölçülen ad T1 '1.Yurt İçi Üretici Fiyat Endeksi' */
  ['Madencilik ve taş ocakçılığı (aylık)', /madencilik/, 8.30, 1],
  ['Elektrik, gaz üretimi ve dağıtımı (aylık)', /elektrik.*gaz/, 7.10, 1, 'TP.TUFE1YI.T118'],   /* §247i: ölçülen '4. Elektrik Gaz Buhar...' */
  ['Su temini (aylık)', /su temini/, 1.97, 0, 'TP.TUFE1YI.T123'],   /* §247i: ölçülen '5. Su Temini Kanalizasyon...' */
  ['İmalat (aylık)', /imalat/, 1.01, 0]];   /* §247f: seri adı '3. İmalat' — önekli, ilk eşleşme ana sektör */
/* §247j: MIGS beşlisi EVDS'de YOK (6 ölçümle kesin) — sağ blok, grupta
   YAŞAYAN imalat alt sektörlerine çevrildi (kullanıcı B kararı; kodlar
   ölçüldü). Portföy dili: ana metal=çelik girdisi, kok-rafine=petrokimya. */
const UFE_STATIK_SAG=[
  ['Gıda ürünleri (imalat, aylık)', /gıda ürünleri/, null, 0, 'TP.TUFE1YI.T16'],
  ['Kok ve rafine petrol (aylık)', /kok/, null, 1, 'TP.TUFE1YI.T49'],
  ['Kimyasallar (aylık)', /kimyasal/, null, 0, 'TP.TUFE1YI.T52'],
  ['Ana metaller (aylık)', /ana metal/, null, 0, 'TP.TUFE1YI.T73'],
  ['Motorlu kara taşıtları (aylık)', /motorlu/, null, 0, 'TP.TUFE1YI.T105']];
let UFE_CANLI=null, UFE_DONEM='';
function ufeSatir(r){
  const c=UFE_CANLI?UFE_CANLI[r[0]]:null;
  if(r[3]===9){  // genel satır: aylık/yıllık çifti
    const m=c?trN(c.aylik,2):null;
    const metin=c?('%'+m+' / %'+trN(c.yillik,2)):r[2];
    return '<div class="kv"><span class="k">'+esc(r[0])+(c?'<span style="color:var(--mm2);font-size:8px"> ●</span>':'')+'</span><span><b>'+metin+'</b></span></div>';
  }
  const v=(c&&c.aylik!=null)?c.aylik:r[2];
  if(v==null) return '<div class="kv"><span class="k">'+esc(r[0])+'</span><span class="thin">—</span></div>';   /* §247j: yeni satırların Haziran yedeği yok */
  const cls=v>=3?'down':(v<=0.5?'up':'');
  const isr=(v>=0?'+':'−');
  return '<div class="kv"><span class="k">'+esc(r[0])+(c?'<span style="color:var(--mm2);font-size:8px"> ●</span>':'')+'</span><span class="num '+cls+'">'+isr+'%'+trN(Math.abs(v),2)+'</span></div>';
}
function ufeRender(){
  const L=$('ufeSol'), R=$('ufeSag'); if(!L||!R)return;
  L.innerHTML=UFE_STATIK_SOL.map(ufeSatir).join('');
  R.innerHTML=UFE_STATIK_SAG.map(ufeSatir).join('');
  const d=$('ufeDamga');
  if(d){ const tum=[...UFE_STATIK_SOL,...UFE_STATIK_SAG];
    const eks=UFE_CANLI?tum.filter(r=>!UFE_CANLI[r[0]]).map(r=>r[0].replace(/ \(aylık.*$/,'')):[];
    d.textContent=UFE_CANLI?('EVDS · '+UFE_DONEM+(eks.length?' · eşleşmeyen: '+eks.slice(0,4).join(', '):'')):'damgalı (Haz 2026)'; }
}
async function ufeCek(){
  try{
    /* §247e: grup kodu kullanıcı ölçümüyle SABİTLENDİ — ?ara=üretici çıktısı:
       bie_tufe1yi = 'Yurt İçi Üretici Fiyat Endeksi' (arşiv değil).
       Eski arama 'üfe' hiç grup bulamıyordu: grup ADLARINDA kısaltma yok. */
    const g='bie_tufe1yi';
    {
      const sonuc={};
      for(const r of [...UFE_STATIK_SOL,...UFE_STATIK_SAG]){
        const s=r[4]&&typeof r[4]==='string'?await mkSeriKod(r[4],500):await mkSeri(g, r[1], 500, /arşiv|yıllık değişim/);  /* §247i */
        if(s&&s.items.length>=13){
          const A=s.items, son=A[A.length-1], onc=A[A.length-2], oy=A[A.length-13];
          const aylik=(son.v/onc.v-1)*100, yillik=(son.v/oy.v-1)*100;
          if(isFinite(aylik)){ sonuc[r[0]]={aylik, yillik, tarih:son.t}; UFE_DONEM=son.t; }
        }
      }
      if(Object.keys(sonuc).length>=3)UFE_CANLI=sonuc;
    }
  }catch(e){}
  ufeRender();
}

/* ---- Getiri Eğrisi (EVDS canlı · damgalı yedek) ---- */
const EGRI_STATIK=[['3A','3 Ay',34.50,0],['6A','6 Ay',41.36,0],['9A','9 Ay',42.40,0],
 ['2Y','2 Yıl (gösterge)',42.16,0],['3Y','3 Yıl',41.19,0],['5Y','5 Yıl',39.31,0],['10Y','10 Yıl',35.46,0]]; // 27 Tem canlıdan damgalandı
let EGRI_CANLI=null, EGRI_KONV='', EGRI_SUKUK=null, EGRI_PARITE=null;
function egriRender(){
  const tb=$('egriBody');if(!tb)return;
  let say=0;
  tb.innerHTML=EGRI_STATIK.map(r=>{
    const c=EGRI_CANLI?EGRI_CANLI[r[0]]:null;
    const tz=!!(c&&c.getiri!=null);
    const g=tz?c.getiri:r[2];
    const d=tz?(c.delta!=null?c.delta:null):r[3];   // canlı satırda Δ güvenilir değilse damgalıya düşme
    if(tz)say++;
    const vurgu=r[0]==='2Y'?' style="color:var(--mm2);font-weight:600"':'';
    const dcls=d>0?'up':d<0?'down':'';
    const dtxt=(d==null)?'—':((d>0?'+':'')+trN(d,2));
    const ipucu=tz&&c.isin?(' title="gösterge '+c.isin+' · itfa '+c.itfa+' · kupon %'+trN(c.kupon,2)+' · fiyat '+trN(c.fiyat,3)+'"'):'';
    return '<tr'+ipucu+'><td'+vurgu+'>'+r[1]+(tz?'<span style="color:var(--mm2);font-size:8px"> ●</span>':'')+'</td>'+
      '<td class="num"'+vurgu+'>%'+trN(g,2)+'</td>'+
      '<td class="num '+dcls+'">'+dtxt+'</td></tr>';
  }).join('');
  // Eğri eğimini canlı değerlerden tazele
  const eg=$('egriEgim');
  if(eg&&EGRI_CANLI&&EGRI_CANLI['2Y']&&EGRI_CANLI['10Y']){
    const bp=(EGRI_CANLI['2Y'].getiri-EGRI_CANLI['10Y'].getiri)*100;
    eg.textContent=(bp>=0?'−':'+')+trN(Math.abs(bp),0)+'bp ('+(bp>=0?'ters':'normal')+')';
    eg.className=bp>=0?'down':'up';
  }
  // Okuma kartı — canlı hesap (damgalı sabitler: politika %37, cari TÜFE %32,11, 12a beklenti %23,81)
  /* §252d (9 Agu): TUFE 32,11 (Haz) -> 31,75 (Tem, TUIK 3 Agu · yillik 0,35 puan geriledi).
     BEK 23,81 (Haz anketi) -> 23,95 (Tem anketi, 13-16 Tem uygulandi, 20 Tem yayin).
     POLITIKA 37 DEGISMEDI — 23 Tem PPK sabit tuttu, dogrulandi.
     Panel kendi icinde celisiyordu: bilanco tezi metni ve index.html:707 zaten %31,75 diyordu,
     bu sabit ise %32,11'de kalmisti -> 2Y/10Y REEL GETIRI 0,36 puan yanlis hesaplaniyordu. */
  const OKU_POLITIKA=37, OKU_TUFE=31.75, OKU_BEK=23.95;
  /* §258 ETİKETLER DE BU SABİTTEN. index.html'de "cari TÜFE %32,11" ve
     "12a beklenti %23,81" SABİT YAZILIYDI; §252d hesabı düzeltti ama etiketi
     düzeltmedi ve aynı satırda doğru değer + yanlış gerekçe yan yana kaldı.
     Artık tek kaynak. */
  try{
    const et1=$('okuTufeEt'); if(et1) et1.textContent='(cari TÜFE %'+trN(OKU_TUFE,2)+"'e göre)";
    const et2=$('okuBekEt');  if(et2) et2.textContent='(12a beklenti %'+trN(OKU_BEK,2)+')';
  }catch(e){}
  const y2=EGRI_CANLI&&EGRI_CANLI['2Y']?EGRI_CANLI['2Y'].getiri:null;
  const y10=EGRI_CANLI&&EGRI_CANLI['10Y']?EGRI_CANLI['10Y'].getiri:null;
  if(y2!=null){
    if($('okuFark'))$('okuFark').textContent='+'+trN((y2-OKU_POLITIKA)*100,0)+'bp (piyasa TCMB\u0027nin üstünde)';
    if($('oku2yReel'))$('oku2yReel').textContent='≈ +'+trN(y2-OKU_TUFE,1)+' puan';
    if($('oku2yIleri'))$('oku2yIleri').textContent='≈ +'+trN(y2-OKU_BEK,1)+' puan';
  }
  if(y10!=null&&$('oku10yReel'))$('oku10yReel').textContent='≈ +'+trN(y10-OKU_TUFE,1)+' puan';
  const el=$('egriDamga');
  if(el){
    const ilk=EGRI_CANLI?Object.values(EGRI_CANLI)[0]:null;
    el.textContent=say?('EVDS · '+say+' vade canlı'+(ilk&&ilk.tarih?' · '+ilk.tarih:'')+(EGRI_KONV?' · '+EGRI_KONV:'')):'damgalı (27 Tem)';
  }
}
/* ---- Getiri Eğrisi GRAFİĞİ (Nelson-Siegel uyumlu) ----
   Veri zaten var: /api/evds2?mod=egri her vade için getiri + kalanYil + isin döndürüyor.
   Eksik olan görselleştirmeydi. Eğri rastgele bir spline ile değil, tahvil piyasasının
   standardı olan NELSON-SIEGEL modeliyle uyduruluyor:
     y(t) = β0 + β1·f1 + β2·f2 ,  f1=(1-e^(-t/τ))/(t/τ) ,  f2=f1-e^(-t/τ)
   τ ızgarada taranır, her τ için β'lar en küçük kareler (3x3 normal denklem) ile çözülür.
   Yorum: y(0)=β0+β1 · y(∞)=β0 → β1>0 ise kısa uç uzun ucun ÜSTÜNDE, yani eğri TERS.
   β2>0 orta vadede kambur (şişkinlik) demektir. */
function nsUydur(pts){
  const f=(t,T)=>{const u=t/T,e=Math.exp(-u);const a=u<1e-8?1:(1-e)/u;return [1,a,a-e];};
  const coz=(A,b)=>{const M=A.map((r,i)=>r.concat([b[i]]));
    for(let i=0;i<3;i++){let p=i;for(let k=i+1;k<3;k++)if(Math.abs(M[k][i])>Math.abs(M[p][i]))p=k;
      if(Math.abs(M[p][i])<1e-12)return null;const t=M[i];M[i]=M[p];M[p]=t;
      for(let k=i+1;k<3;k++){const c=M[k][i]/M[i][i];for(let j=i;j<4;j++)M[k][j]-=c*M[i][j];}}
    const x=[0,0,0];
    for(let i=2;i>=0;i--){let s=M[i][3];for(let j=i+1;j<3;j++)s-=M[i][j]*x[j];x[i]=s/M[i][i];}
    return x;};
  // τ üst sınırı 8: daha büyük τ'da f1 ve f2 neredeyse aynı fonksiyona dönüşür, sistem
  // tekilleşir ve birbirini götüren dev katsayılar üretir (ölçüldü: τ=12'de β0=-196, β1=232).
  // Ayrıca RIDGE (Tikhonov) cezası: iyi koşullu uyumu neredeyse hiç bozmaz, tekil olanı kırar.
  // Son olarak MAKULLÜK KONTROLÜ: parametreler bandın dışındaysa o τ reddedilir.
  const RIDGE=1e-3*pts.length, SINIR=150;
  let en=null;
  for(let T=0.3;T<=8;T+=0.1){
    const A=[[0,0,0],[0,0,0],[0,0,0]],b=[0,0,0];
    pts.forEach(p=>{const g=f(p.x,T);for(let i=0;i<3;i++){b[i]+=g[i]*p.y;for(let j=0;j<3;j++)A[i][j]+=g[i]*g[j];}});
    A[1][1]+=RIDGE; A[2][2]+=RIDGE;                 // yalnız eğim ve kambura ceza, seviyeye değil
    const B=coz(A,b); if(!B)continue;
    if(!B.every(v=>isFinite(v)&&Math.abs(v)<SINIR))continue;   // makullük kontrolü
    let ss=0; pts.forEach(p=>{const g=f(p.x,T);ss+=Math.pow(p.y-(g[0]*B[0]+g[1]*B[1]+g[2]*B[2]),2);});
    const r=Math.sqrt(ss/pts.length);
    if(!en||r<en.r)en={T:T,B:B,r:r};
  }
  if(!en)return null;
  return {tau:+en.T.toFixed(1),b:en.B,rmse:en.r,
          y:t=>{const g=f(t,en.T);return g[0]*en.B[0]+g[1]*en.B[1]+g[2]*en.B[2];}};
}
const EGRI_YIL={'1A':1/12,'3A':0.25,'6A':0.5,'9A':0.75,'1Y':1,'18A':1.5,'2Y':2,'3Y':3,'4Y':4,'5Y':5,'7Y':7,'10Y':10};
function egriGrafik(){
  const el=$('egriGrafik'); if(!el)return;
  const topla=(K)=>{const p=[]; if(!K)return p;
    Object.keys(K).forEach(ad=>{const v=K[ad];
      const x=(v&&isFinite(v.kalanYil))?+v.kalanYil:EGRI_YIL[ad];
      if(v&&isFinite(v.getiri)&&isFinite(x)&&x>0)p.push({x:x,y:+v.getiri,ad:ad,isin:v.isin||null});});
    return p.sort((a,b)=>a.x-b.x);};
  let S=topla(EGRI_SUKUK), D=topla(EGRI_CANLI), yedek=false;
  if(!S.length&&!D.length){                       // damgalı yedek (yalnız konvansiyonel elimizde)
    D=EGRI_STATIK.filter(r=>EGRI_YIL[r[0]]).map(r=>({x:EGRI_YIL[r[0]],y:r[2],ad:r[0],isin:null}));
    yedek=true;
  }
  const mS=S.length>=4?nsUydur(S):null, mD=D.length>=4?nsUydur(D):null;
  const hepsi=S.concat(D); if(!hepsi.length){el.innerHTML='<div class="sub">Eğri verisi yok.</div>';return;}
  const W=560,H=310,L=48,R=14,T=14,B=36;
  const x1=Math.max.apply(null,hepsi.map(p=>p.x))*1.06;
  let y0=Math.min.apply(null,hepsi.map(p=>p.y)), y1=Math.max.apply(null,hepsi.map(p=>p.y));
  [mS,mD].forEach(m=>{if(!m)return;for(let t=0.05;t<=x1;t+=x1/60){const v=m.y(t);if(v<y0)y0=v;if(v>y1)y1=v;}});
  const pad=(y1-y0)*0.14||1; y0-=pad; y1+=pad;
  const px=v=>L+v/x1*(W-L-R), py=v=>H-B-(v-y0)/(y1-y0)*(H-T-B);
  let g='';
  for(let i=0;i<=4;i++){const yv=y0+(y1-y0)*i/4,Y=py(yv);
    g+='<line x1="'+L+'" y1="'+Y+'" x2="'+(W-R)+'" y2="'+Y+'" stroke="var(--line)" stroke-width="0.7"/>'+
       '<text x="'+(L-6)+'" y="'+(Y+3.5)+'" text-anchor="end" font-size="9" fill="var(--muted)" font-family="var(--mono)">%'+yv.toFixed(1)+'</text>';}
  const adim=x1>8?2:(x1>4?1:0.5);
  for(let t=0;t<=x1+0.001;t+=adim){const X=px(t);
    g+='<line x1="'+X+'" y1="'+(H-B)+'" x2="'+X+'" y2="'+(H-B+4)+'" stroke="var(--muted)" stroke-width="0.7"/>'+
       '<text x="'+X+'" y="'+(H-B+15)+'" text-anchor="middle" font-size="9" fill="var(--muted)" font-family="var(--mono)">'+(t%1?t.toFixed(1):t)+'</text>';}
  g+='<text x="'+((L+W-R)/2)+'" y="'+(H-3)+'" text-anchor="middle" font-size="9" fill="var(--muted)">Vade (yıl)</text>';
  const cizgi=(m,renk,kalin,kesik)=>{if(!m)return'';let d='';
    for(let i=0;i<=160;i++){const t=0.03+(x1-0.03)*i/160;d+=(i?'L':'M')+px(t).toFixed(1)+' '+py(m.y(t)).toFixed(1);}
    return '<path d="'+d+'" fill="none" stroke="'+renk+'" stroke-width="'+kalin+'"'+(kesik?' stroke-dasharray="4 3"':'')+'/>';};
  g+=cizgi(mD,'#8896A5',1.3,true);                 // konvansiyonel: soluk, kesik — referans
  g+=cizgi(mS,'var(--mm2)',2.1,false);             // sukuk: kalın, ana eğri
  D.forEach(p=>{g+='<g><title>DİBS '+esc(p.ad)+(p.isin?(' · '+esc(p.isin)):'')+' · kalan '+p.x.toFixed(2)+' yıl · %'+p.y.toFixed(2)+'</title>'+
    '<circle cx="'+px(p.x).toFixed(1)+'" cy="'+py(p.y).toFixed(1)+'" r="2.6" fill="none" stroke="#8896A5" stroke-width="1.1"/></g>';});
  S.forEach(p=>{g+='<g><title>Kira sertifikası '+esc(p.ad)+(p.isin?(' · '+esc(p.isin)):'')+' · kalan '+p.x.toFixed(2)+' yıl · %'+p.y.toFixed(2)+'</title>'+
    '<circle cx="'+px(p.x).toFixed(1)+'" cy="'+py(p.y).toFixed(1)+'" r="3.3" fill="var(--mm2)"/></g>';});
  (S.length?S:D).filter((p,i,a)=>i===0||i===a.length-1||['2Y','5Y'].indexOf(p.ad)>=0)
    .forEach(p=>{g+='<text x="'+(px(p.x)+5).toFixed(1)+'" y="'+(py(p.y)-6).toFixed(1)+'" font-size="8.5" fill="var(--mm2)" font-family="var(--mono)" font-weight="700">'+esc(p.ad)+'</text>';});
  // Lejant SAĞ ÜSTTE, sağa yaslı (sol-üstteki 3A etiketiyle çakışmayı önler)
  const lejX=W-R-4;
  g+='<g font-size="8.5" font-family="var(--mono)" text-anchor="end">'+
     '<circle cx="'+(lejX-128)+'" cy="'+(T+8)+'" r="3.3" fill="var(--mm2)"/><text x="'+lejX+'" y="'+(T+11)+'" fill="var(--ink)">Kira sertifikası (TRD)</text>'+
     '<circle cx="'+(lejX-128)+'" cy="'+(T+21)+'" r="2.6" fill="none" stroke="#8896A5" stroke-width="1.1"/><text x="'+lejX+'" y="'+(T+24)+'" fill="var(--muted)">Konvansiyonel DİBS (TRT)</text></g>';
  el.innerHTML='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto;display:block" role="img" aria-label="Getiri eğrileri">'+g+'</svg>';
  const dm=$('egriGrafikTag');
  if(dm)dm.textContent=yedek?'damgalı yedek':((S.length?S.length+' sukuk':'')+(S.length&&D.length?' · ':'')+(D.length?D.length+' DİBS':'')+' · EVDS canlı');
  const nt=$('egriGrafikNot'); if(!nt)return;
  let m='';
  if(mS&&mD){
    const mk=t=>mD.y(t)-mS.y(t);
    const ort=[0.5,1,2,3,5].map(mk).reduce((a,b)=>a+b,0)/5;
    const parite=Math.abs(ort)<1.0;
    m+='<b>Asıl bilgi iki eğri arasındaki makas.</b> Ortalama fark <b>'+trN(ort,2)+' puan</b> '+
      '(DİBS eksi sukuk). Vade bazında: 6 ay '+trN(mk(0.5),2)+' · 1 yıl '+trN(mk(1),2)+
      ' · 2 yıl '+trN(mk(2),2)+' · 3 yıl '+trN(mk(3),2)+' · 5 yıl '+trN(mk(5),2)+' puan.<br><br>';
    if(parite){
      m+='<b>Şu an fiilen PARİTE var</b> — kira sertifikası ile konvansiyonel DİBS aynı vadede '+
        'neredeyse aynı getiriyi veriyor. Bu, ölçümle doğrulandı: aynı itfa tarihli çiftlerde '+
        '(19.07.2028 ve 10.02.2027 vadeleri) getiriler yüzde birkaç baz puan farkla eşleşiyor. '+
        '<b>Ekonomik olarak da beklenen budur:</b> ikisi de Hazine yükümlülüğü, aynı kredi riski, '+
        'aynı likidite kademesi — kalıcı bir fark arbitraj olurdu. '+
        'Yatırımcı açısından sonucu şu: <b>katılım ilkesine uymak için getiri feda etmiyorsun.</b> '+
        'Kira sertifikası, DİBS ile aynı getiriyi faizsiz yapıda sunuyor.<br><br>';
    } else {
      m+=(ort>0?'<b>Sukuk konvansiyonelin altında</b> — katılım tarafında yapısal alıcı talebi '+
             'getirileri bastırıyor; kira sertifikası tutmanın maliyeti bu fark kadar.'
           :'<b>Sukuk konvansiyonelin üstünde</b> — katılım tarafında görece değer var.')+'<br><br>';
    }
    m+='<b>İzlenecek sayı makasın kendisi değil, YÖNÜ.</b> Paritenin bozulup sukukun DİBS altına '+
      'inmesi, katılım fonlarından gelen talebin arzı aşmaya başladığını gösterir (BDDK verisinde '+
      'katılım bankalarının fon kullandırma oranı %65,9 ile sektörün %87,9\'unun çok altında — '+
      'toplanan fonun bir kısmı krediye değil kira sertifikasına gidiyor). '+
      'Makasın açılması ise katılım tarafında görece değer doğduğu anlamına gelir.<br><br>';
  }
  const ana=mS||mD;
  if(!ana){nt.innerHTML=m+'Model uydurmak için en az 4 gösterge gerekiyor.';return;}
  const et=mS?'Kira sertifikası':'DİBS';
  const b0=ana.b[0],b1=ana.b[1],b2=ana.b[2],ters=b1>0;
  m+='<b>Nelson-Siegel</b> uyumu ('+et+') — tahvil piyasasının standart eğri modeli. '+
    'Uyum hatası (RMSE) <b>'+trN(ana.rmse,2)+' puan</b>; büyümesi bazı kıymetlerin piyasadan koptuğunu gösterir. '+
    'Parametreler: uzun vade seviyesi β₀=<b>'+trN(b0,1)+'</b> · eğim β₁=<b>'+trN(b1,1)+'</b> · kambur β₂=<b>'+trN(b2,1)+'</b>. '+
    'β₁ pozitifse kısa uç uzun ucun üstündedir — eğri <b class="'+(ters?'down':'up')+'">'+(ters?'TERS':'NORMAL')+'</b>'+
    (ters?(', kısa vade uzun vadeden '+trN(Math.abs(b1),1)+' puan yukarıda; piyasa dezenflasyon ve faiz indirimi fiyatlıyor'):'')+'. '+
    (b2>0?'β₂ pozitif: orta vadede <b>kambur</b> var. ':'')+
    '<br><span class="thin">Kaynak: TCMB EVDS · bie_pydibs. Sukuk TRD, konvansiyonel TRT ISIN önekiyle süzülür. '+
    'Noktaların üzerine gelince ISIN ve kalan vade görünür.</span>';
  nt.innerHTML=m;
}
/* ---- Parite izleme: aynı itfa tarihli TRD/TRT çiftleri + tarihsel yön ----
   Model tahmini değil ham gerçek: aynı gün itfa olan iki Hazine kâğıdının getiri farkı.
   Günlük snapshot localStorage'da tutulur (poz/journal ile aynı desen), yön grafiği çizilir. */
const PARITE_KEY='parite_gecmis_v1';
function pariteOku(){ try{ return JSON.parse(localStorage.getItem(PARITE_KEY)||'[]'); }catch(e){ return []; } }
function pariteKaydet(j){
  if(!j||!isFinite(j.ortalamaFark))return;
  let g=pariteOku();
  const bugun=j.tarih||new Date().toLocaleDateString('tr-TR');
  g=g.filter(x=>x.t!==bugun);                       // aynı günü bir kez tut (son değer geçerli)
  g.push({t:bugun, ort:j.ortalamaFark, med:j.medyanFark, n:j.adet});
  g=g.slice(-120);                                  // ~4 ay
  try{ localStorage.setItem(PARITE_KEY,JSON.stringify(g)); }catch(e){}
}
async function pariteTestAlarm(btn){
  const d=$('pariteTestDurum'); if(d)d.textContent='gönderiliyor…'; if(btn)btn.disabled=true;
  try{
    // esik=0 → mevcut en büyük makas ne olursa olsun mail atar (test amaçlı)
    const r=await fetch('/api/data?mod=mail&cron=1&tip=parite&esik=0'+(localStorage.getItem('ktp_cron_k')?('&k='+localStorage.getItem('ktp_cron_k')):''));
    const j=await r.json();
    if(d)d.textContent=j.ok?(j.gonderildi===false?'eşik aşan yok (mail atılmadı)':'✓ mail gönderildi'):('✗ '+(j.err||'hata'));
  }catch(e){ if(d)d.textContent='✗ '+e.message; }
  if(btn)btn.disabled=false;
}
function pariteKart(){
  const el=$('pariteKart'); if(!el)return;
  const j=EGRI_PARITE;
  if(!j||!j.ok||!j.ciftler||!j.ciftler.length){
    el.innerHTML='<div class="sub">Aynı itfa tarihli çift verisi henüz yüklenmedi.</div>'; return;
  }
  const durumRenk = j.durum==='PARİTE'?'var(--mm2)':(j.durum==='SUKUK UCUZ'?'var(--up,#1a9e75)':'var(--down,#d9534f)');
  const satir = j.ciftler.map(c=>{
    const isaret = c.fark>0.02?'up':(c.fark<-0.02?'down':'');
    return '<tr><td class="num">'+trN(c.kalanYil,2)+'</td>'+
      '<td style="font-family:var(--mono);font-size:10px">'+esc(c.sukukIsin)+'</td>'+
      '<td class="num">%'+trN(c.sukukGetiri,2)+'</td>'+
      '<td style="font-family:var(--mono);font-size:10px">'+esc(c.dibsIsin)+'</td>'+
      '<td class="num">%'+trN(c.dibsGetiri,2)+'</td>'+
      '<td class="num '+isaret+'" style="font-weight:600">'+(c.fark>0?'+':'')+trN(c.fark,2)+'</td></tr>';
  }).join('');
  // Tarihsel yön mini-grafiği
  const g=pariteOku();
  let yon='';
  if(g.length>=2){
    const W=520,H=70,P=6, xs=g.map((_,i)=>i), ys=g.map(x=>x.ort);
    const y0=Math.min(-0.3,Math.min.apply(null,ys)), y1=Math.max(0.3,Math.max.apply(null,ys));
    const px=i=>P+i/(g.length-1)*(W-2*P), py=v=>H-P-(v-y0)/(y1-y0)*(H-2*P);
    const sifir=py(0);
    let d=''; g.forEach((x,i)=>{d+=(i?'L':'M')+px(i).toFixed(1)+' '+py(x.ort).toFixed(1);});
    const ilk=g[0].ort, sonD=g[g.length-1].ort, delta=sonD-ilk;
    yon='<div class="lbl" style="margin-top:12px">MAKASIN YÖNÜ <span class="thin">('+g.length+' gün · localStorage)</span></div>'+
      '<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto;display:block;margin-top:4px" role="img" aria-label="Parite makasının zaman içindeki yönü">'+
      '<line x1="'+P+'" y1="'+sifir.toFixed(1)+'" x2="'+(W-P)+'" y2="'+sifir.toFixed(1)+'" stroke="var(--line)" stroke-width="0.7" stroke-dasharray="3 3"/>'+
      '<text x="'+(P+2)+'" y="'+(sifir-3).toFixed(1)+'" font-size="8" fill="var(--muted)" font-family="var(--mono)">parite (0)</text>'+
      '<path d="'+d+'" fill="none" stroke="var(--mm2)" stroke-width="1.6"/>'+
      '<circle cx="'+px(g.length-1).toFixed(1)+'" cy="'+py(sonD).toFixed(1)+'" r="3" fill="var(--mm2)"/></svg>'+
      '<div class="sub" style="font-size:10px">'+(Math.abs(delta)<0.05?'Yön yatay — parite istikrarlı.':
        (delta>0?'Makas <b>açılıyor</b> (+'+trN(delta,2)+' puan) — sukuk görece ucuzluyor.':
                 'Makas <b>daralıyor</b> ('+trN(delta,2)+' puan) — sukuk görece pahalılaşıyor, katılım talebi artıyor.'))+'</div>';
  } else {
    yon='<div class="sub" style="font-size:10px;margin-top:10px">Yön grafiği için en az 2 günlük kayıt gerekir; panel her açıldığında bugünün değeri saklanır.</div>';
  }
  // En büyük mutlak fark → alarm eşiğine ne kadar yakın
  const enBuyuk=j.ciftler.reduce((m,c)=>Math.abs(c.fark)>Math.abs(m)?c.fark:m,0);
  const esikBp=25;
  el.innerHTML=
    '<div style="display:flex;align-items:baseline;gap:10px;margin-bottom:8px;flex-wrap:wrap">'+
      '<span style="font-size:22px;font-weight:700;color:'+durumRenk+'">'+j.durum+'</span>'+
      '<span class="sub">ort. fark '+(j.ortalamaFark>0?'+':'')+trN(j.ortalamaFark,2)+' puan · medyan '+(j.medyanFark>0?'+':'')+trN(j.medyanFark,2)+' · '+j.adet+' çift</span>'+
      '<span style="margin-left:auto;font-size:10px;color:var(--muted)">en büyük makas <b class="'+(Math.abs(enBuyuk)*100>=esikBp?'down':'')+'">'+Math.round(Math.abs(enBuyuk)*100)+' bp</b> / alarm '+esikBp+' bp</span>'+
    '</div>'+
    '<table style="font-size:11px"><thead><tr><th class="num">Vade</th><th>Sukuk (TRD)</th><th class="num">Getiri</th><th>DİBS (TRT)</th><th class="num">Getiri</th><th class="num">Fark</th></tr></thead><tbody>'+satir+'</tbody></table>'+
    yon+
    '<div class="note" style="margin-top:10px">Bu tablo <b>model tahmini değil</b>: aynı gün itfa olan iki gerçek Hazine kâğıdının getiri farkı. İkisi de aynı borçlu, aynı kredi riski olduğu için fark ~0 (parite) beklenir. <b>Fark pozitifse</b> (DİBS yüksek) sukuk görece ucuz; <b>negatifse</b> sukuk pahalı — katılım talebi arzı aşıyor demektir. İzlenecek olan farkın seviyesi değil <b>yönü</b>: sürekli daralması, BDDK\'da gördüğümüz yapısal katılım talebinin (fon kullandırma %65,9 vs sektör %87,9) fiyata yansımaya başladığını gösterir.<br><br><b>⚡ Otomatik alarm:</b> Herhangi bir çiftte makas <b>25 baz puanı</b> aşarsa her sabah (hafta içi 08:15) mailine düşer — ucuz bacağı al, pahalı bacağı sat sinyaliyle. İkisi de Hazine olduğundan kredi riski nötr; yalnız fiyat farkına oynanır. Kaynak: TCMB EVDS · bie_pydibs.</div>'+
    '<div style="margin-top:8px"><button onclick="pariteTestAlarm(this)" style="font-size:10px;padding:4px 10px;border:1px solid var(--line2);border-radius:5px;background:none;cursor:pointer;font-family:inherit;color:var(--muted)">⚡ Test alarmı gönder</button> <span id="pariteTestDurum" class="sub" style="font-size:10px"></span></div>';
}
async function egriCek(){
  // İki eğri paralel: konvansiyonel DİBS (TRT) ve Hazine kira sertifikası (TRD).
  // Aynı EVDS grubundan (bie_pydibs) ISIN önekine göre süzülür — ölçüldü 2026-07-24.
  const [a,b,c]=await Promise.allSettled([
    fetch('/api/evds2?mod=egri').then(r=>r.json()),
    fetch('/api/evds2?mod=egri&tur=sukuk').then(r=>r.json()),
    fetch('/api/evds2?mod=egri&tur=parite').then(r=>r.json())
  ]);
  try{ const j=a.status==='fulfilled'?a.value:null;
    /* §252h SAPMA GORUNUR OLDU. egri.js fiyat konvansiyonunu (temiz/kirli x
       donemsel/yillik) 24 Tem'de olculmus REF capalariyla SECIYOR ve secimin
       ne kadar tuttugunu sapma puaniyla RAPORLUYOR. Panel bugune kadar yalniz
       j.konvansiyon'u basiyordu — oz-denetim vardi, ekrana cikmiyordu. Capa
       eskidikce sapma buyur; artik damgada gorulur. */
    if(j&&j.ok&&j.vadeler){EGRI_CANLI=j.vadeler;
      /* §252h-DUZELTME (10 Agu): ilk yazimda j.sapma.skor yazmistim — OYLE BIR ALAN YOK.
         egri.js:263 `sapma:skor` dondurur ve skor bir NESNEDIR: {konvansiyon_adi: puan}.
         Secilen konvansiyonun puani j.sapma[j.konvansiyon]. Ilk halde sp hep '' kaliyordu,
         yani eklenen kod OLU DOGMUSTU (§247c ile ayni sinif). Canli ekran dokumunde
         egriDamga'da sapma gorunmemesiyle yakalandi. */
      const spD=(j.sapma&&j.konvansiyon!=null)?j.sapma[j.konvansiyon]:null;
      const sp=(spD!=null&&isFinite(spD))?(' · sapma '+trN(spD,2)):'';
      EGRI_KONV=j.konvansiyon?('fiyat: '+j.konvansiyon+sp):'';}
  }catch(e){}
  try{ const j=b.status==='fulfilled'?b.value:null;
    if(j&&j.ok&&j.vadeler)EGRI_SUKUK=j.vadeler;
  }catch(e){}
  try{ const j=c.status==='fulfilled'?c.value:null;
    if(j&&j.ok){ EGRI_PARITE=j; pariteKaydet(j); }
  }catch(e){}
  egriRender();
  egriGrafik();
  pariteKart();
}
/* ---- Sektör Isı Haritası + Rotasyon ---- */
/* ---- Canlı enjeksiyon: Yahoo verisi ısı haritası + sicile ---- */
function canliEnjekte(){
  const m=window.__market; if(!m)return;
  // A) Sektör ısı haritası: 1G/1H/1A/3A canlı
  if(typeof SEKTOR!=='undefined'&&SEKTOR&&m.sec){
    let say=0;
    // §114: damgalı orijinali SAKLA (ilk enjeksiyondan önce) ve hangi ufkun canlı
    // geldiğini ufuk bazinda işaretle. RS hesabı iki tarafı AYNI TABANDAN almak zorunda.
    SEKTOR.sektorler.forEach(s=>{const c=m.sec[s.k];
      if(!s.__damga) s.__damga=s.g.slice();
      if(c&&c.chg!=null){
        s.__canli=[true, c.h1!=null, c.a1!=null, c.q3!=null];
        s.g=[c.chg, c.h1!=null?c.h1:s.__damga[1], c.a1!=null?c.a1:s.__damga[2], c.q3!=null?c.q3:s.__damga[3]]; say++;
      } else if(!s.__canli) s.__canli=[false,false,false,false];
    });
    const bx=m.xu100;
    if(!SEKTOR.benchmark.__damga) SEKTOR.benchmark.__damga=SEKTOR.benchmark.g.slice();
    if(bx&&bx.chg!=null){
      SEKTOR.benchmark.__canli=[true, bx.h1!=null, bx.a1!=null, bx.q3!=null];
      SEKTOR.benchmark.g=[bx.chg, bx.h1!=null?bx.h1:SEKTOR.benchmark.__damga[1], bx.a1!=null?bx.a1:SEKTOR.benchmark.__damga[2], bx.q3!=null?bx.q3:SEKTOR.benchmark.__damga[3]];
    } else if(!SEKTOR.benchmark.__canli) SEKTOR.benchmark.__canli=[false,false,false,false];
    if(say>0){SEKTOR.canli=say; if(typeof renderHeatmap==='function')renderHeatmap(); if(typeof renderRotasyon==='function')renderRotasyon();}
  }
  // B) Model portföy sicili: bugünün canlı noktası
  if(typeof TRK!=='undefined'&&TRK&&TRK.holdings&&m.his){
    let mg=0,eksik=0;
    TRK.holdings.forEach(h=>{const c=m.his[h.t];const p=(c&&c.p)?c.p:h.p;if(!(c&&c.p))eksik++;mg+=h.w*(p/h.p0-1);});
    /* §245t ELMA BÖLÜ ARMUT — sicil -%27,59 gösteriyordu.
       Matematik parmak izi: 13.458 (XU100 canlı) / 18.587 (XKTUM referansı)
       = -%27,59. m.xktum §191'de BİLEREK XU100'e yönlendirilmişti (Actions
       koşusunda XKTUM.IS boş dönmüştü) — ama Vercel/market yolunda XKTUM.IS
       ÇALIŞIYOR: BIST endeks tablosundaki canlı 18.254 zaten m.end.XKTUM'dan
       geliyor. Yani gerçek XKTUM eldeydi, sicil yanlış alanı okuyordu.
       §114'ün tekrarı: pay ve payda AYNI endeks olmak zorunda. Gerçek XKTUM
       yoksa endeks noktası NULL olur — asla XU100'le bölünmez; model çizgisi
       yine çizilir, endeks 'veri yok' der. Yanlış sayıdan iyidir. */
    const xkC = (m.end && m.end.XKTUM && m.end.XKTUM.p) ? m.end.XKTUM.p : null;
    const eg = (xkC && TRK.endeks_kapanis) ? (xkC/TRK.endeks_kapanis-1)*100 : null;
    const bugun=new Date().toISOString().slice(0,10);
    const nokta={d:bugun,model:+(mg*100).toFixed(2),endeks:eg==null?null:+eg.toFixed(2),canli:true};
    // ── Günlük birikim: noktayı buluta yaz (her açılışta günceller, gün değişince yeni satır) ──
    let bulutSeri=[]; try{ bulutSeri=JSON.parse(localStorage.getItem('trk_seri_v1')||'[]'); }catch(e){}
    const _bz=trkBazOku(); if(_bz) bulutSeri=bulutSeri.filter(x=>x&&x.d>=_bz.tarih);   // sıfırlama öncesi noktalar düşer (§108)
    const kayit={d:bugun,model:nokta.model,endeks:nokta.endeks};
    const bi=bulutSeri.findIndex(x=>x&&x.d===bugun);
    if(bi>=0) bulutSeri[bi]=kayit; else bulutSeri.push(kayit);
    bulutSeri=bulutSeri.filter(x=>x&&x.d).sort((x,y)=>x.d<y.d?-1:1).slice(-400);
    try{ localStorage.setItem('trk_seri_v1', JSON.stringify(bulutSeri)); }catch(e){}   // → bulut senkronu tetikler
    // ── Birleşim: statik damgalı kapanışlar öncelikli, bulut birikimi boşlukları doldurur ──
    if(!TRK.__statik) TRK.__statik = TRK.series.slice();
    const harita={};
    bulutSeri.forEach(p=>{ harita[p.d]=p; });
    TRK.__statik.forEach(p=>{ if(p&&p.d) harita[p.d]=p; });
    harita[bugun]=nokta;
    TRK.series=Object.keys(harita).sort().map(k=>harita[k]);
    if(typeof trackRender==='function')trackRender();
    /* §151: kullanicinin KENDI portfoyunun gunluk ayrismasi da biriktirilir.
       canliEnjekte icinde cunku burasi market verisinin geldigi TEK nokta —
       sekme acik olmasa bile kayit dusuyor. "Her gun otomatik" sarti bu. */
    try{ if(typeof ayrGunKaydet==='function'){ ayrGunKaydet('XK100'); ayrGunKaydet('XKTUM'); } }catch(e){}
    /* §193: canlı veri işlendi — bekleme durumu kalkar, damgalar normale döner.
       Buraya konuldu çünkü canliEnjekte market verisinin işlendiği TEK nokta.
       Daha erkene konsa "geldi" demeden kalkardı; daha geçe konsa bir hata
       durumunda hiç kalkmazdı. */
    try{ document.body.classList.remove('veri-bekliyor'); }catch(e){}
    const n=$('trkNote');
    if(n)n.innerHTML='Son nokta <b class="up">CANLI</b> (Yahoo · '+bugun+'): model = Σ ağırlık × (canlı fiyat / kuruluş fiyatı), endeks = canlı XKTUM / '+trN(TRK.endeks_kapanis,0)+'. Önceki noktalar: damgalı kapanışlar + panelin her gün otomatik biriktirdiği noktalar (bulutta saklanır, cihazlar ortak); sicil disiplini (kuruluşta ilan edilen '+(TRK.sepet||'sepet')+', sabit ağırlık) aynen geçerli.'+(eksik?' <span class="thin">('+eksik+' hisse canlı gelmedi → damgalı fiyat)</span>':'');
  }
}

/* ---- İnceleme AI: bilanço kartları ---- */


/* ---- Haftalık yorumu mail / kopyala ---- */
function hyToplaVeri(){
  const oku=id=>{const e=$(id);return e?(e.textContent||'').trim():'';};
  const pano=[['XU100 haftalık','yXU100'],['XKTUM haftalık','yXKTUM'],['Lider sektör','yLider'],
    ['Geride kalan','yGeride'],['AOFM · efektif faiz','yAOFM'],['TÜFE yıllık','yTUFE'],
    ['REK (2025=100)','yREK'],['Net fonlama','yNet'],['Reel carry','yCarry'],
    ['Piyasa 12-ay bek.','yPiyaBek'],['Hane 12-ay bek.','yHaneBek'],['Yabancı (hafta)','yYabanci'],
    ['Tüketici güveni','yGuven']].map(([ad,id])=>({ad, deger:oku(id)})).filter(x=>x.deger&&x.deger!=='—');
  const metinEl=$('yorumMetin');
  const notHtml = metinEl ? metinEl.innerHTML : '';
  const notMetin = metinEl ? (metinEl.innerText||metinEl.textContent||'').replace(/\n{3,}/g,'\n\n').trim() : '';
  const takEl=$('taktikBody2')||$('taktikBody');
  return { hafta:oku('yorumHafta')||oku('yorumTarih'), pano, notHtml, notMetin,
           takHtml: takEl?takEl.innerHTML:'', takMetin: takEl?(takEl.innerText||takEl.textContent||'').trim():'' };
}
function hyMetin(){
  const v=hyToplaVeri(), L=[];
  L.push('KTPANEL · HAFTALIK PİYASA YORUMU');
  if(v.hafta)L.push(v.hafta);
  L.push('');
  if(v.pano.length){ L.push('HAFTANIN PANOSU');
    v.pano.forEach(x=>L.push('  '+String(x.ad).padEnd(24)+x.deger)); L.push(''); }
  if(v.notMetin){ L.push('ARAŞTIRMA NOTU'); L.push(v.notMetin); L.push(''); }
  if(v.takMetin){ L.push('TAKTİKSEL DAĞILIM'); L.push(v.takMetin); L.push(''); }
  L.push('— KTPanel · bilgilendirme amaçlıdır, yatırım tavsiyesi değildir.');
  return L.join('\n');
}
function hyHtml(){
  const v=hyToplaVeri();
  const YES='#0FA26B',INK='#1B2733',MUT='#6B7B8C',LIN='#E8EDF1',ZEM='#F6F8F9';
  const MONO="ui-monospace,SFMono-Regular,Menlo,monospace";
  const SANS="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
  const pano=v.pano.map((x,i)=>'<tr style="background:'+(i%2?ZEM:'#fff')+'">'+
    '<td style="padding:6px 10px;font:400 11px '+SANS+';color:'+MUT+';border-bottom:1px solid '+LIN+'">'+esc(x.ad)+'</td>'+
    '<td style="padding:6px 10px;font:700 12px '+MONO+';color:'+INK+';text-align:right;border-bottom:1px solid '+LIN+'">'+esc(x.deger)+'</td></tr>').join('');
  const blok=(baslik,ic)=>ic?('<table role="presentation" width="100%" style="background:#fff;border:1px solid '+LIN+';border-radius:10px;margin-bottom:14px">'+
    '<tr><td style="padding:14px 16px"><div style="font:700 10px '+SANS+';letter-spacing:.8px;color:'+YES+';margin-bottom:8px">'+baslik+'</div>'+
    '<div style="font:400 12.5px '+SANS+';line-height:1.75;color:'+INK+'">'+ic+'</div></td></tr></table>'):'';
  return '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;background:'+ZEM+'">'+
    '<table role="presentation" width="100%" style="background:'+ZEM+'"><tr><td align="center" style="padding:22px 12px">'+
    '<table role="presentation" width="100%" style="max-width:660px">'+
    '<tr><td style="padding-bottom:14px"><span style="font:700 11px '+SANS+';letter-spacing:1.4px;color:'+YES+'">KTPANEL · HAFTALIK PİYASA YORUMU</span>'+
    '<span style="font:400 11px '+SANS+';color:'+MUT+';float:right">'+esc(v.hafta)+'</span></td></tr><tr><td>'+
    (pano?'<table role="presentation" width="100%" style="background:#fff;border:1px solid '+LIN+';border-radius:10px;margin-bottom:14px;border-collapse:separate">'+
      '<tr><td colspan="2" style="padding:12px 16px 6px;font:700 10px '+SANS+';letter-spacing:.8px;color:'+YES+'">HAFTANIN PANOSU</td></tr>'+pano+
      '<tr><td colspan="2" style="height:8px"></td></tr></table>':'')+
    blok('ARAŞTIRMA NOTU', v.notHtml)+
    blok('TAKTİKSEL DAĞILIM', v.takHtml)+
    '</td></tr><tr><td style="font:400 10.5px '+SANS+';line-height:1.6;color:#8896A5;padding-top:6px;border-top:1px solid '+LIN+'">'+
    'KTPanel · '+new Date().toLocaleString('tr-TR')+' · Bilgilendirme amaçlıdır, yatırım tavsiyesi değildir.</td></tr>'+
    '</table></td></tr></table></body></html>';
}
async function hyMail(){
  const d=$('hyDurum'), alici=(localStorage.getItem('ktp_mail_to')||'').trim();
  const v=hyToplaVeri();
  const konu='KTPanel · Haftalık Piyasa Yorumu'+(v.hafta?(' — '+v.hafta):'');
  if(alici){
    if(d)d.textContent='gönderiliyor…';
    try{
      const r=await fetch('/api/data?mod=mail',{method:'POST',headers:{'content-type':'application/json'},
        body:JSON.stringify({to:alici, subject:konu, html:hyHtml(), text:hyMetin()})});
      const j=await r.json();
      if(j.ok){ if(d)d.textContent='✓ '+alici+' adresine gönderildi'; setTimeout(()=>{if(d)d.textContent='';},4000); return; }
      const ham=String(j.err||'');
      let mesaj=ham;
      if(/only send testing emails|verify a domain|own email address/i.test(ham)){
        const kendi=(ham.match(/\(([^)]+@[^)]+)\)/)||[])[1]||'hesap adresin';
        mesaj='Resend doğrulaması yok — sadece '+kendi+' adresine gönderilebiliyor. Alıcıyı değiştir ya da alan adını doğrula.';
      }
      if(d){ d.textContent=mesaj; setTimeout(()=>{ if(d&&d.textContent===mesaj)d.textContent=''; },14000); }
      return;
    }catch(e){ if(d)d.textContent='bağlantı hatası'; return; }
  }
  window.location.href='mailto:?subject='+encodeURIComponent(konu)+'&body='+encodeURIComponent(hyMetin().slice(0,1800));
}
async function hyKopyala(){
  const d=$('hyDurum');
  try{ await navigator.clipboard.writeText(hyMetin()); if(d){d.textContent='✓ panoya kopyalandı'; setTimeout(()=>{d.textContent='';},2500);} }
  catch(e){ if(d)d.textContent='kopyalanamadı'; }
}
function hyPaylasInit(){
  const b1=$('hyMail'); if(b1)b1.addEventListener('click',hyMail);
  const b2=$('hyKopya'); if(b2)b2.addEventListener('click',hyKopyala);
  const b3=$('hyYazdir'); if(b3)b3.addEventListener('click',()=>{
    const w=window.open('','_blank'); if(!w)return;
    w.document.write('<title>KTPanel · Haftalık Yorum</title>'+hyHtml()); w.document.close();
    setTimeout(()=>w.print(),400);
  });
}
/* ---- Earnings AI kartlarını e-posta / pano / yazdırma ile paylaş ---- */
let INC_KARTLAR=[];
function incMetin(k){
  const L=[];
  L.push(k.kod+' — '+k.ad+' · '+k.donem+' · '+k.tarih+'  ['+k.skor+']');
  L.push('');
  L.push(k.ozet||'');
  L.push('');
  L.push('METRİKLER');
  (k.metrikler||[]).forEach(x=>L.push('  '+String(x.ad).padEnd(26)+String(x.deger).padStart(16)+'   ÇÇ '+(x.cc||'—')+'   YoY '+(x.yoy||'—')));
  if((k.onemli||[]).length){ L.push(''); L.push('ÖNEMLİ'); (k.onemli||[]).forEach(o=>L.push('  • '+o)); }
  if(k.guidance){ L.push(''); L.push('GUIDANCE: '+k.guidance); }
  if(k.tez){ L.push(''); L.push('PORTFÖY TEZİ: '+k.tez); }
  L.push(''); L.push('— KTPanel · Earnings AI · bilgilendirme amaçlıdır, yatırım tavsiyesi değildir.');
  return L.join('\n');
}
function incHtml(kartlar){
  // Panel görünümünün e-posta uyumlu karşılığı (tablo tabanlı, inline stil — Gmail/Outlook uyumu)
  const YES='#0FA26B', KIR='#DE4B5E', GRI='#8896A5', INK='#1B2733', MUT='#6B7B8C', LIN='#E8EDF1', ZEM='#F6F8F9';
  const MONO="ui-monospace,SFMono-Regular,'SF Mono',Menlo,monospace";
  const SANS="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
  /* §252g GÜÇLÜ skoru griye dusuyordu. inceleme-ai.json'da metin skorlar:
     POZİTİF(7) KARIŞIK(4) NEGATİF(3) NÖTR(1) GÜÇLÜ(1). GÜÇLÜ hicbir dala
     uymuyordu -> GRI, yani NÖTR ile ayni. Sezonun en guclu bilancosu notr gorunuyordu. */
  const skorRenk=s=>(s==='POZİTİF'||s==='GÜÇLÜ')?YES:s==='NEGATİF'?KIR:GRI;
  const yon=v=>{const s=String(v||'');return s.startsWith('+')?YES:(s.startsWith('−')||s.startsWith('-'))?KIR:MUT;};
  const kart=(k)=>{
    /* §245z TEK KART SEKMEYİ ÖLDÜREMEZ. 2 Ağu: bir kartta metrikler dizi
       yerine OBJE yazılmıştı, .map fırlattı, 30 kartın 30'u birden kayboldu.
       §245s YEOTK dersinin render hali: kayıt-seviyesi arıza, katman-seviyesi
       ceza almaz. Tip zorlaması: dizi değilse Object.values ile kurtar,
       o da olmazsa boş dizi — kart metriksiz ama GÖRÜNÜR kalır. */
    const hamMet=k.metrikler;
    const metListe=Array.isArray(hamMet)?hamMet
      :(hamMet&&typeof hamMet==='object'?Object.values(hamMet).filter(x=>x&&typeof x==='object'):[]);
    const met=metListe.map((x,ix)=>
      '<tr style="background:'+(ix%2?ZEM:'#fff')+'">'+
      '<td style="padding:6px 10px;font:400 11px '+SANS+';color:'+MUT+';border-bottom:1px solid '+LIN+'">'+esc(x.ad)+'</td>'+
      '<td style="padding:6px 10px;font:700 12px '+MONO+';color:'+INK+';text-align:right;white-space:nowrap;border-bottom:1px solid '+LIN+'">'+esc(x.deger)+'</td>'+
      '<td style="padding:6px 10px;font:400 11px '+MONO+';color:'+yon(x.cc)+';text-align:right;white-space:nowrap;border-bottom:1px solid '+LIN+'">'+esc(x.cc||'—')+'</td>'+
      '<td style="padding:6px 10px;font:400 11px '+MONO+';color:'+yon(x.yoy)+';text-align:right;white-space:nowrap;border-bottom:1px solid '+LIN+'">'+esc(x.yoy||'—')+'</td></tr>').join('');
    const onem=(Array.isArray(k.onemli)?k.onemli:(k.onemli?[k.onemli]:[])).map(o=>
      '<tr><td style="padding:3px 0 3px 14px;font:400 12px '+SANS+';line-height:1.6;color:'+INK+';position:relative">'+
      '<span style="color:'+YES+'">▪</span> '+esc(o)+'</td></tr>').join('');
    return ''+
    '<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#fff;border:1px solid '+LIN+';border-radius:10px;margin-bottom:14px">'+
    '<tr><td style="padding:14px 16px 10px">'+
      '<table role="presentation" width="100%"><tr>'+
      '<td style="font:700 16px '+SANS+';color:'+INK+'">'+esc(k.kod)+
        ' <span style="font:400 11px '+SANS+';color:'+MUT+'">'+esc(k.ad)+' · '+esc(k.donem)+' · '+esc(k.tarih)+'</span></td>'+
      '<td align="right"><span style="display:inline-block;font:700 9px '+SANS+';letter-spacing:.5px;color:#fff;background:'+skorRenk(k.skor)+';padding:4px 10px;border-radius:10px">'+esc(k.skor)+'</span></td>'+
      '</tr></table>'+
      '<div style="font:400 12.5px '+SANS+';line-height:1.7;color:'+INK+';margin:10px 0 4px;padding:10px 12px;background:'+ZEM+';border-left:3px solid '+YES+';border-radius:0 6px 6px 0">'+esc(k.ozet||'')+'</div>'+
    '</td></tr>'+
    '<tr><td style="padding:0 16px">'+
      '<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;margin:6px 0 10px">'+
      '<tr><td colspan="2" style="font:700 9px '+SANS+';letter-spacing:.6px;color:'+MUT+';padding:0 10px 4px">METRİK</td>'+
      '<td style="font:700 9px '+SANS+';letter-spacing:.6px;color:'+MUT+';text-align:right;padding:0 10px 4px">ÇEYREK</td>'+
      '<td style="font:700 9px '+SANS+';letter-spacing:.6px;color:'+MUT+';text-align:right;padding:0 10px 4px">YILLIK</td></tr>'+
      met+'</table>'+
      (onem?'<table role="presentation" width="100%" style="margin:8px 0 10px">'+
        '<tr><td style="font:700 9px '+SANS+';letter-spacing:.6px;color:'+MUT+';padding-bottom:4px">ÖNEMLİ</td></tr>'+onem+'</table>':'')+
      (k.guidance?'<table role="presentation" width="100%" style="border-top:1px dashed '+LIN+';margin-top:6px"><tr>'+
        '<td style="font:400 11px '+SANS+';color:'+MUT+';padding:8px 0 0;width:80px;vertical-align:top">Guidance</td>'+
        '<td style="font:400 11.5px '+SANS+';line-height:1.6;color:'+INK+';padding:8px 0 0;text-align:right">'+esc(k.guidance)+'</td></tr></table>':'')+
      (k.tez?'<div style="font:400 12.5px '+SANS+';line-height:1.7;color:'+INK+';margin:12px 0 14px;padding:11px 13px;background:#F0F7F4;border-left:3px solid '+YES+';border-radius:0 6px 6px 0">'+
        '<b style="color:'+YES+'">Portföy tezi:</b> '+esc(k.tez)+'</div>':'')+
    '</td></tr></table>';
  };
  return '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>'+
  '<body style="margin:0;padding:0;background:'+ZEM+'">'+
  '<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:'+ZEM+'"><tr><td align="center" style="padding:22px 12px">'+
  '<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:660px">'+
  '<tr><td style="padding-bottom:14px">'+
    '<span style="font:700 11px '+SANS+';letter-spacing:1.4px;color:'+YES+'">KTPANEL · EARNINGS AI</span>'+
    '<span style="font:400 11px '+SANS+';color:'+MUT+';float:right">'+new Date().toLocaleDateString('tr-TR',{day:'numeric',month:'long',year:'numeric'})+'</span>'+
  '</td></tr>'+
  '<tr><td>'+kartlar.map(kart).join('')+'</td></tr>'+
  '<tr><td style="font:400 10.5px '+SANS+';line-height:1.6;color:'+GRI+';padding-top:6px;border-top:1px solid '+LIN+'">'+
    'KTPanel tarafından üretildi · '+new Date().toLocaleString('tr-TR')+'<br>'+
    'Veriler Alpha Vantage ve şirket bildirimlerinden derlenmiştir. Bilgilendirme amaçlıdır, yatırım tavsiyesi değildir.'+
  '</td></tr></table></td></tr></table></body></html>';
}
async function incMail(kod){
  // kod: null → tüm kartlar · 'XXXX' → tek kart · ['A','B'] → seçilenler
  let secili;
  if(Array.isArray(kod))   secili = INC_KARTLAR.filter(k=>kod.indexOf(k.kod)>=0);
  else if(kod)             secili = INC_KARTLAR.filter(k=>k.kod===kod);
  else                     secili = INC_KARTLAR;
  if(!secili.length){ const d0=$('incMailDurum'); if(d0)d0.textContent='kart seçilmedi'; return; }
  const tekKart = secili.length===1;
  const konu = tekKart ? ('KTPanel · '+secili[0].kod+' '+secili[0].donem+' bilanço incelemesi')
                       : ('KTPanel · Earnings AI ('+secili.length+' kart)');
  const html = incHtml(secili), metin = secili.map(incMetin).join('\n\n' + '─'.repeat(50) + '\n\n');
  const d=$('incMailDurum');
  // 1) Sunucudan gerçek gönderim (RESEND_API_KEY varsa)
  const alici=(localStorage.getItem('ktp_mail_to')||'').trim();
  // Alıcı tanımlıysa SUNUCUDAN gönder; hata olursa mail uygulamasına DÜŞME, hatayı göster.
  if(alici){
    if(d)d.textContent='gönderiliyor…';
    try{
      const r=await fetch('/api/data?mod=mail',{method:'POST',headers:{'content-type':'application/json'},
        body:JSON.stringify({to:alici, subject:konu, html:html, text:metin})});
      const j=await r.json();
      if(j.ok){ if(d)d.textContent='✓ '+alici+' adresine gönderildi'; setTimeout(()=>{if(d)d.textContent='';},4000); return; }
      // Anlaşılır hata + çözüm
      const ham=String(j.err||'');
      let mesaj=ham;
      if(/only send testing emails|verify a domain|own email address/i.test(ham)){
        const kendi=(ham.match(/\(([^)]+@[^)]+)\)/)||[])[1]||'hesap adresin';
        mesaj='Resend hesabın henüz alan adı doğrulaması yapılmadığı için SADECE '+kendi+' adresine gönderebiliyor. '+
              'Çözüm: ya alıcıyı o adres yap (✎ Alıcı), ya da resend.com/domains üzerinden ktportfoy.com.tr alan adını doğrula.';
      } else if(j.kurulum){
        mesaj='Sunucu gönderimi kapalı (RESEND_API_KEY yok). "✎ Alıcı"yı boşaltırsan mail uygulaman açılır.';
      }
      if(d){ d.textContent=mesaj; setTimeout(()=>{ if(d&&d.textContent===mesaj) d.textContent=''; },14000); }
      return;                      // ← mailto'ya düşme
    }catch(e){ if(d)d.textContent='bağlantı hatası — panel sunucusuna ulaşılamadı'; return; }
  }
  // Alıcı HİÇ tanımlı değilse: mail uygulamasını aç (kurulumsuz yol)
  const govde=encodeURIComponent(metin.slice(0,1800));
  window.location.href='mailto:?subject='+encodeURIComponent(konu)+'&body='+govde;
}
async function incKopyala(kod){
  const secili = kod ? INC_KARTLAR.filter(k=>k.kod===kod) : INC_KARTLAR;
  const metin = secili.map(incMetin).join('\n\n'+'─'.repeat(50)+'\n\n');
  const d=$('incMailDurum');
  try{ await navigator.clipboard.writeText(metin); if(d){d.textContent='✓ panoya kopyalandı'; setTimeout(()=>{d.textContent='';},2500);} }
  catch(e){ if(d)d.textContent='kopyalanamadı (tarayıcı izni)'; }
}
function incAliciAyarla(){
  const mevcut=localStorage.getItem('ktp_mail_to')||'';
  const y=prompt('Rapor gönderilecek e-posta adresi (birden fazlaysa virgülle):\n\nBoş bırakırsan mail uygulaman açılır.', mevcut);
  if(y===null)return;
  localStorage.setItem('ktp_mail_to', y.trim());
  const d=$('incMailDurum'); if(d){d.textContent=y.trim()?('alıcı: '+y.trim()):'alıcı temizlendi'; setTimeout(()=>{d.textContent='';},3000);}
  incAliciGoster();
}
function incAliciGoster(){
  const e=$('incAlici'); if(!e)return;
  const a=localStorage.getItem('ktp_mail_to')||'';
  e.textContent=a?a:'alıcı ayarlanmadı';
}
/* §256 ONAYLI TASLAĞI KALDIR — taslakOnayla'nın (ajan.js) SİMETRİĞİ.
   Onay tek yönlüydü: kart localStorage + buluta yazılıyor, geri alma yolu YOK.
   10 Ağu'da LMKDC kartı bin kat şişik birimle onaylandı ve tek çare konsola
   JSON yazmaktı. Yanlış kart, eksik karttan kötüdür (§243).
   ÜÇ ADIM, onayın tersi sırayla:
     1) ktp_taslak_kart_v1'den çıkar
     2) BULUTA YAZ — yoksa başka cihazda geri gelir (§200'ün sessiz kaybı)
     3) listeyi yeniden kur ki ekrandan da düşsün
   İKİ TIK: ilk tık onay ister. Silme geri alınamaz; tek tıkla kazara
   silinmemeli. 4 saniye içinde ikinci tık gelmezse düğme eski haline döner. */
async function taslakKartSil(btn, kod, donem){
  if(btn.dataset.onay !== '1'){
    btn.dataset.onay = '1';
    const eskiHtml = btn.innerHTML, eskiT = btn.title;
    btn.innerHTML = 'sil?'; btn.title = 'silmek için tekrar tıkla';
    btn.style.fontWeight = '700';
    setTimeout(()=>{ if(btn.dataset.onay==='1'){ btn.dataset.onay=''; btn.innerHTML=eskiHtml; btn.title=eskiT; btn.style.fontWeight=''; } }, 4000);
    return;
  }
  btn.dataset.onay = ''; btn.disabled = true; btn.innerHTML = '…';
  try{
    let L=[]; try{ L=JSON.parse(localStorage.getItem('ktp_taslak_kart_v1')||'[]')||[]; }catch(e){}
    const once=L.length;
    L = L.filter(x => !(String(x.kod)===String(kod) && (!donem || String(x.donem)===String(donem))));
    localStorage.setItem('ktp_taslak_kart_v1', JSON.stringify(L));
    /* §264 BULUTA HEMEN YAZ — debounce DEĞİL. Silme için bu KRİTİK: 900 ms
       gecikmede kullanıcı yenilerse silinen kart bulutta durur ve birleştirme
       (§264) onu GERİ GETİRİR. Silme anlık ve kesin olmalı. */
    try{ if(typeof cloudSave==='function') await cloudSave();
         else if(typeof cloudSaveDebounced==='function') cloudSaveDebounced(); }catch(e){}
    if(once===L.length){ btn.innerHTML='?'; btn.title='kayıt bulunamadı (dosyadaki kart olabilir)'; btn.disabled=false; return; }
    if(typeof incelemeInit==='function') await incelemeInit();   /* kart ekrandan düşer */
  }catch(e){
    btn.disabled=false; btn.innerHTML='🗑'; btn.title='silinemedi: '+String(e&&e.message||e).slice(0,60);
  }
}
/* §287 DİNLEYİCİ ÇİFTLENMESİ — TEK MAIL İSTEĞİ İKİ MAIL GÖNDERİYORDU.
   ÖLÇÜLDÜ (14 Ağu): kullanıcı bir kez tıklıyor, Resend İKİ mail gönderiyor.
   KÖK NEDEN: incPaylasInit() her kart listesi çiziminde çağrılıyor (satır ~4060)
   ve her çağrıda addEventListener YENİ bir dinleyici EKLİYOR — eskisi duruyor.
   incelemeInit iki yerden koşuyor: açılışta VE kart silindiğinde (§256 sil
   düğmesi). Sil-üret döngüsü ne kadar tekrarlarsa o kadar dinleyici birikiyor.
   Yani Resend suçsuz: tarayıcı gerçekten iki POST atıyor.
   ÇÖZÜM: bir kez bağla, damgala. `bagla()` yardımcısı dataset ile işaretliyor;
   ikinci çağrıda atlanıyor. Bu, incPaylasInit'in TÜM dinleyicilerini kapsıyor
   (mail, kopyala, yazdır, alıcı, seçim kutuları) — hepsi aynı hastalıktaydı,
   yalnız maili fark ettik çünkü tek görünür belirtisi oydu. */
function incPaylasInit(){
  const bagla=(el, olay, isle, ad)=>{
    if(!el) return;
    const im='b_'+(ad||olay);
    if(el.dataset[im]==='1') return;      /* zaten bağlı — ikinci kez ekleme */
    el.addEventListener(olay, isle);
    el.dataset[im]='1';
  };
  const b1=$('incMailHepsi'); bagla(b1,'click',()=>incMail(null));
  // --- Kart seçimi: kaç kart gönderileceğini kullanıcı belirler ---
  const kutular=()=>Array.prototype.slice.call(document.querySelectorAll('#incelemeBody input.incSec'));
  const secilenKodlar=()=>kutular().filter(c=>c.checked).map(c=>c.getAttribute('data-kod'));
  window.incSecSay=function(){
    const n=secilenKodlar().length, b=$('incMailSecili');
    if(b){ b.textContent='✉ Seçilenleri Mail At ('+n+')'; b.style.opacity = n?1:0.55; }
    return n;
  };
  const el0=$('incelemeBody');
  bagla(el0,'change',e=>{ if(e.target&&e.target.classList&&e.target.classList.contains('incSec')) window.incSecSay(); });
  const bSec=$('incMailSecili');
  bagla(bSec,'click',()=>{
    const k=secilenKodlar();
    if(!k.length){ const d=$('incMailDurum'); if(d)d.textContent='önce kart seç (kartların solundaki kutucuk)'; return; }
    incMail(k);
  });
  const hzSec=$('incHizli');
  bagla(hzSec,'change',()=>{
    const v=hzSec.value, ks=kutular();               // kartlar en yeniden eskiye sıralı
    if(v==='none')      ks.forEach(c=>c.checked=false);
    else if(v==='all')  ks.forEach(c=>c.checked=true);
    else if(v)          { const n=parseInt(v)||0; ks.forEach((c,i)=>c.checked = i<n); }
    hzSec.value=''; window.incSecSay();
  });
  const b2=$('incKopyaHepsi'); bagla(b2,'click',()=>incKopyala(null));
  const b3=$('incAliciBtn'); bagla(b3,'click',incAliciAyarla);
  const b4=$('incYazdir'); bagla(b4,'click',()=>{
    const w=window.open('','_blank'); if(!w)return;
    w.document.write('<title>KTPanel · Earnings AI</title>'+incHtml(INC_KARTLAR));
    w.document.close(); setTimeout(()=>w.print(),400);
  });
  /* §287 EN KRİTİK DİNLEYİCİ: kart içi ✉/⧉/🗑 düğmelerini yakalayan delege.
     Çiftlenirse tek tıkta İKİ MAIL ve İKİ SİLME olur — kullanıcının gördüğü
     çift mail büyük ihtimalle buradan geliyordu (kart içi ✉ düğmesi). */
  const el=$('incelemeBody');
  bagla(el,'click',e=>{
    const t=e.target; if(!t.getAttribute)return;
    const m=t.getAttribute('data-mail'), k=t.getAttribute('data-kopya'), sl=t.getAttribute('data-sil');
    if(m)incMail(m); else if(k)incKopyala(k);
    else if(sl)taslakKartSil(t, sl, t.getAttribute('data-sildonem')||'');
  });
  incAliciGoster();
}



/* §248b SPK Seryet AUM — uç kullanıcı DevTools ölçümüyle bulundu; api/spk proxy.
   Doluluk < 25 şirketse bir önceki aya düşer (bildirimler ay ortasına dek damlar). */
const SPK_KATILIM=/KATILIM|ALBARAKA|KUVEYT|GOLDEN GLOBAL|EMLAK/;
async function spkCek(){
  const el=$('spkB'); if(!el) return;
  const simdi=new Date(); let yil=simdi.getFullYear(), ay=simdi.getMonth(); // önceki ay
  if(ay===0){ay=12;yil--;}
  for(let dene=0; dene<3; dene++){
    try{
      const r=await fetch('/api/tcmb?spk=1&yil='+yil+'&ay='+ay);   /* §248c: ayrı uç yerine bindirme — fonksiyon limiti korundu */
      if(!r.ok) throw new Error('HTTP_'+r.status);
      const d=await r.json();
      if((d.dolu||0)>=25){
        /* §249o: bir önceki dolu ay da çekilir → aylık AUM DEĞİŞİMİ (Δ) kolonu.
           SPK akış yayımlamaz; Δ = büyüklük değişimi (piyasa etkisi dahil) —
           etiket dürüst: 'AUM Δ', para girişi DEĞİL. */
        let onceki=null;
        try{
          let oy=ay-1, oyil=yil; if(oy===0){oy=12;oyil--;}
          for(let d2=0; d2<2; d2++){
            const r2=await fetch('/api/tcmb?spk=1&yil='+oyil+'&ay='+oy);
            if(r2.ok){ const j2=await r2.json(); if((j2.dolu||0)>=25){ onceki=j2; break; } }
            oy--; if(oy===0){oy=12;oyil--;}
          }
        }catch(e2){}
        spkBas(d, onceki); return;
      }
    }catch(e){}
    ay--; if(ay===0){ay=12;yil--;}
  }
  el.innerHTML='<div class="sub">SPK verisi alınamadı (üç ay denendi)</div>';
  if($('spkDamga'))$('spkDamga').textContent='ERİŞİLEMEDİ';
}
function spkBas(d, onceki){
  const el=$('spkB'); if(!el) return;
  const L=(d.veri||[]).filter(x=>(x.yonetilenToplamPortfoyBuyuklugu||0)>0)
    .sort((a,b)=>b.yonetilenToplamPortfoyBuyuklugu-a.yonetilenToplamPortfoyBuyuklugu).slice(0,14);
  const max=L.length?L[0].yonetilenToplamPortfoyBuyuklugu:1;
  el.innerHTML=L.map(x=>{
    const ad=x.sirketAdi.replace(/ PORTFÖY YÖNETİMİ ANONİM ŞİRKETİ\s*$/,'').replace(/ GAYRİMENKUL VE GİRİŞİM SERMAYESİ$/,' GYO-GSYF');
    const kat=SPK_KATILIM.test(x.sirketAdi);
    const v=x.yonetilenToplamPortfoyBuyuklugu;
    const m=v>=1e12?trN(v/1e12,2)+' tr':trN(v/1e9,0)+' mlr';
    let dTxt='';
    if(onceki){
      const o=(onceki.veri||[]).find(x2=>x2.sirketAdi===x.sirketAdi);
      const ov=o&&o.yonetilenToplamPortfoyBuyuklugu;
      if(ov>0){ const pct=(v/ov-1)*100; dTxt='<span class="'+(pct>=0?'up':'down')+'" style="font-size:9px">'+(pct>=0?'+':'−')+'%'+trN(Math.abs(pct),1)+'</span>'; }
    }
    return '<div class="bar"><span class="bn" style="font-size:10px">'+esc(ad)+(kat?'<span style="color:var(--mm2)"> ●</span>':'')+'</span>'+
      '<span class="bt"><span class="bf" style="width:'+(v/max*100).toFixed(1)+'%'+(kat?';background:var(--mm2)':'')+'"></span></span>'+
      '<span class="bv">'+m+'</span><span class="bk" style="font-size:9px">'+(dTxt||'<span class="thin">₺</span>')+'</span></div>';
  }).join('');
  if($('spkDonem'))$('spkDonem').textContent='· '+d.yil+'/'+String(d.ay).padStart(2,'0');
  if($('spkDamga'))$('spkDamga').textContent='CANLI · '+d.dolu+' şirket'+(onceki?' · Δ: '+onceki.yil+'/'+String(onceki.ay).padStart(2,'0')+"'e göre aylık":'');
}

/* §248 PYŞ SEKTÖRÜ — net para girişleri (PDF/TEFAS türevi, damgalı).
   Panel temalı yatay barlar (.bar ailesi); üç blok × dönem düğmeleri.
   Otomasyon adayı: tazele.mjs TEFAS tüm-fon katmanı (bekleyen işler). */
let PYS=null, pysSec={b1:'1G', b2:'1G', b3:'1G'};
async function pysInit(){
  if(!$('pysB1')) return;
  try{ const r=await fetch('/pyssektor.json',{cache:'no-store'});
    if(!r.ok) throw new Error('HTTP_'+r.status);
    PYS=await r.json();
  }catch(e){ $('pysB1').innerHTML='<div class="sub">pyssektor.json yüklenemedi: '+esc(String(e.message||e))+'</div>'; return; }
  if($('pysDamga')) $('pysDamga').textContent=((PYS.kaynak||'').indexOf('Fintables')>=0?'FİNTABLES · ':'DAMGALI · ')+(PYS.guncelleme||'');   /* §248d */
  if($('pysNot')) $('pysNot').innerHTML='Kaynak: '+esc(PYS.kaynak||'')+'. Pozitif net giriş = para o kanala akıyor; PYŞ sıralaması dağıtım gücünün, tür sıralaması yatırımcı tercihinin fotoğrafı. Döviz serbest fonların yıllık 269 mlr ₺ ile açık ara lider olması dolarizasyon talebinin kurumsal kanıtı.';
  pysCiz();
  spkCek();   /* §248b: AUM bloğu */
}
function pysBar(hedefId, liste, birim){
  const el=$(hedefId); if(!el) return;
  if(!liste||!liste.length){ el.innerHTML='<div class="sub">bu dönem için veri yok</div>'; return; }
  const max=Math.max(...liste.map(x=>Math.abs(x[1])));
  el.innerHTML=liste.map(x=>'<div class="bar"><span class="bn" style="font-size:10px">'+esc(x[0])+'</span>'+
    '<span class="bt"><span class="bf" style="width:'+(Math.abs(x[1])/max*100).toFixed(1)+'%'+(x[1]<0?';background:#B23A48':'')+'"></span></span>'+
    '<span class="bv'+(x[1]<0?' down':'')+'">'+(x[1]<0?'−':'')+trN(Math.abs(x[1]),x[1]<10?2:0)+'</span>'+
    '<span class="bk thin" style="font-size:9px">mlr ₺</span></div>').join('');
}
function pysDugme(id, blok, secili){
  const el=$(id); if(!el||!PYS) return;
  const D={'1G':'Günlük','1H':'Haftalık','1A':'Aylık','1Y':'Yıllık'};
  const var_=Object.keys(PYS[blok]||{});
  el.innerHTML=var_.map(d=>'<button class="pysd" data-b="'+blok+'" data-d="'+d+'" style="background:'+(d===secili?'var(--mm2)':'none')+';color:'+(d===secili?'#fff':'var(--muted)')+';border:1px solid var(--line);border-radius:4px;font-size:10px;padding:3px 10px;margin-right:4px;cursor:pointer;font-family:inherit">'+D[d]+'</button>').join('');
}
function pysCiz(){
  if(!PYS) return;
  pysDugme('pysBtn1','pys',pysSec.b1); pysDugme('pysBtn2','fon',pysSec.b2); pysDugme('pysBtn3','tur',pysSec.b3);
  pysBar('pysB1',(PYS.pys||{})[pysSec.b1]); pysBar('pysB2',(PYS.fon||{})[pysSec.b2]); pysBar('pysB3',(PYS.tur||{})[pysSec.b3]);
  const D={'1G':'günlük','1H':'haftalık','1A':'aylık','1Y':'yıllık'};
  if($('pysD1'))$('pysD1').textContent='· '+D[pysSec.b1]; if($('pysD2'))$('pysD2').textContent='· '+D[pysSec.b2]; if($('pysD3'))$('pysD3').textContent='· '+D[pysSec.b3];
  document.querySelectorAll('.pysd').forEach(b=>b.onclick=()=>{
    const bl=b.dataset.b, d=b.dataset.d;
    if(bl==='pys')pysSec.b1=d; else if(bl==='fon')pysSec.b2=d; else pysSec.b3=d;
    pysCiz();
  });
}

/* §247 YABANCI HİSSE — SHARIAH EVRENİ. Koyfin CSV'den türetilen yevren.json'u
   filtre (arama · ülke · PD eşiği) + tıkla-sırala tablosuyla basar.
   3 Ağu CSV'si BOŞ geldi (yalnız başlık) — panel dürüst "veri bekleniyor"
   durumuyla açılır; dolu CSV işlenince kendiliğinden tabloya döner.
   Fiyat kolonu ileride Yahoo'dan canlı bindirilecek (his2 deseni). */
/* §247c: KOL_TUM/yevGor tanımları init'ten ÖNCEYE taşındı — TDZ:
   const tanımı kullanımdan SONRA geliyordu, "Sütunlar" seçicisi hiç doğmadan
   init o satırda ölüyordu. Sıralama: tanım → init → çizim. */
  const KOL_TUM=[['t','Ticker',0],['u','Ülke',0],['mc','PD mlr$',1],['pe1','F/K FY1',1],['pe2','F/K FY2',1],
    ['ee','EV/EBITDA',1],['ee1','EV/EB FY1',1],['ee2','EV/EB FY2',1],['es1','EV/Satış FY1',1],
    ['nde','NB/EBITDA',1],['pf','P/FCF',1],['fcf','FCF mlr$',1],['cfo','CFO mlr$',1],
    ['dy','Tem %',1],['peg','PEG',1],['z','Altman Z',1],['nb','#Al',1],['ar','Analist',0],
    ['c6','6A %',1],['rv','Rel.Hacim',1]];
  const YEV_VARS=['t','u','mc','pe1','ee','ee1','nde','fcf','dy','z','ar','c6'];
  let yevGor;
  try{ yevGor=JSON.parse(localStorage.getItem('yev_kolon_v1'))||YEV_VARS; }catch(e){ yevGor=YEV_VARS; }
  window.__yevKol=()=>KOL_TUM.filter(k=>yevGor.includes(k[0]));
let YEV=null, yevSira={k:'mc', yon:-1};
async function yevrenInit(){
  const tb=$('yevBody'); if(!tb) return;
  try{
    const r=await fetch('/yevren.json',{cache:'no-store'});
    if(!r.ok) throw new Error('HTTP_'+r.status);
    YEV=await r.json();
  }catch(e){ tb.innerHTML='<tr><td colspan="12" class="sub">yevren.json yüklenemedi: '+esc(String(e.message||e))+'</td></tr>'; return; }
  const H=YEV.hisseler||[];
  if($('yevDamga')) $('yevDamga').textContent = H.length ? (H.length+' HİSSE · '+(YEV.guncelleme||'')) : 'VERİ BEKLENİYOR';
  /* §247a: veri geldiyse 'boş' açıklaması yerine kullanım notu */
  if(H.length && $('yevNot')) $('yevNot').innerHTML='Kaynak: Koyfin Shariah evreni ('+(YEV.guncelleme||'')+' · mnTL→mlr$ kur '+(YEV.kur||'')+'). Parasal kolonlar mlr $; oranlar birimden bağımsız. Kolon başlığına tık = sırala, ikinci tık yön çevirir. Haftalık tazeleme: yeni CSV + "koyfin işle".';
  // ülke seçici
  const us=$('yevUlke');
  if(us && H.length){
    const ulkeler=[...new Set(H.map(x=>x.u).filter(Boolean))].sort();
    us.innerHTML='<option value="">Tüm ülkeler ('+ulkeler.length+')</option>'+ulkeler.map(u=>'<option>'+esc(u)+'</option>').join('');
  }
  ['yevAra','yevUlke','yevMc'].forEach(id=>{ const el=$(id); if(el&&!el.__b){ el.__b=1; el.addEventListener('input',yevrenCiz); el.addEventListener('change',yevrenCiz);} });
  /* §247b: sütun seçici — details içinde onay kutuları; seçim localStorage'a */
  const ks=$('yevKolSec');
  if(ks && !ks.__b){ ks.__b=1;
    ks.innerHTML=KOL_TUM.map(k=>'<label style="display:inline-flex;align-items:center;gap:3px;margin:2px 8px 2px 0;font-size:11px;white-space:nowrap"><input type="checkbox" data-yk="'+k[0]+'"'+(yevGor.includes(k[0])?' checked':'')+(k[0]==='t'?' disabled':'')+'> '+esc(k[1])+'</label>').join('');
    ks.querySelectorAll('input').forEach(cb=>cb.addEventListener('change',()=>{
      yevGor=[...ks.querySelectorAll('input:checked')].map(c=>c.dataset.yk);
      if(!yevGor.includes('t')) yevGor.unshift('t');
      try{ localStorage.setItem('yev_kolon_v1',JSON.stringify(yevGor)); }catch(e){}
      yevrenCiz();
    }));
  }

  yevrenCiz();
}
function yevrenCiz(){
  const tb=$('yevBody'), bas=$('yevBas'); if(!tb||!YEV) return;
  const KOL=(window.__yevKol&&window.__yevKol())||[];
  const H=YEV.hisseler||[];
  if(!H.length){
    bas.innerHTML=''; tb.innerHTML='<tr><td class="sub" style="padding:14px">Evren dosyası boş — dolu Koyfin CSV\'si yüklenip "koyfin işle" denince tablo burada doğar.</td></tr>';
    if($('yevSay')) $('yevSay').textContent='';
    return;
  }
  /* §247b SÜTUN SEÇİCİ: tüm aday kolonlar tanımlı; görünürlük kullanıcının
     seçimi (localStorage'da saklanır — kişisel görünüm tercihi, buluta gitmez).
     Varsayılan: ilk 12'lik klasik set. */
  window.__yevGorSet=(g)=>{yevGor=g;};
  bas.innerHTML='<tr>'+KOL.map(k=>'<th data-yk="'+k[0]+'" style="cursor:pointer;white-space:nowrap">'+k[1]+(yevSira.k===k[0]?(yevSira.yon<0?' ▼':' ▲'):'')+'</th>').join('')+'</tr>';
  bas.querySelectorAll('th').forEach(th=>th.onclick=()=>{
    const k=th.dataset.yk;
    if(yevSira.k===k) yevSira.yon*=-1; else { yevSira.k=k; yevSira.yon=-1; }
    yevrenCiz();
  });
  const ara=(($('yevAra')||{}).value||'').trim().toUpperCase();
  const ulk=(($('yevUlke')||{}).value||'');
  const mcE=parseFloat((($('yevMc')||{}).value||'0'));
  let L=H.filter(x=> (!ara || String(x.t||'').toUpperCase().indexOf(ara)>=0)
                  && (!ulk || x.u===ulk)
                  && (!mcE || (x.mc!=null && x.mc>=mcE)) );
  const k=yevSira.k, yon=yevSira.yon;
  L.sort((a,b)=>{
    const va=a[k], vb=b[k];
    if(va==null&&vb==null) return 0; if(va==null) return 1; if(vb==null) return -1;   // boşlar hep sona
    if(typeof va==='string') return String(va).localeCompare(String(vb))*yon;
    return (va-vb)*yon;
  });
  if($('yevSay')) $('yevSay').textContent=L.length+' / '+H.length+' hisse';
  const f=(v,d)=>v==null?'<span class="thin">—</span>':(typeof v==='number'?trN(v,d):esc(String(v)));
  const ONDALIK={mc:1,pe1:1,pe2:1,ee:1,ee1:1,ee2:1,es1:1,nde:2,pf:1,fcf:0,cfo:0,dy:2,peg:2,z:2,nb:0,c6:1,rv:1};
  tb.innerHTML=L.slice(0,200).map(x=>'<tr>'+KOL.map(k=>{
    const kod=k[0], v=x[kod];
    if(kod==='t') return '<td><b>'+esc(String(v||''))+'</b></td>';
    if(kod==='c6') return '<td class="num '+((v||0)>=0?'up':'down')+'">'+f(v,1)+'</td>';
    return '<td'+(k[2]?' class="num"':'')+'>'+f(v,ONDALIK[kod])+'</td>';
  }).join('')+'</tr>').join('') + (L.length>200?'<tr><td colspan="'+KOL.length+'" class="sub">ilk 200 gösteriliyor — filtreyle daralt</td></tr>':'');
}

async function incelemeInit(){
  const el=$('incelemeBody'); if(!el)return;
  /* §249a: bilanço tetiği şeridi — Actions her koşuda KAP FR listesini
     bilanco-tetik.json'a yazar; burada kartı OLMAYAN yeni açıklananlar
     duyurulur. Kart üretimi bilinçli olarak elde: analiz otomatikleşmez. */
  try{
    const tr=await fetch('/bilanco-tetik.json',{cache:'no-store'});
    if(tr.ok){
      const T=await tr.json();
      const varOlan=new Set((INC_KARTLAR||[]).map(k=>k.kod));
      const yeni=(T.kodlar||[]).filter(k=>!varOlan.has(k));
      if(yeni.length && !$('bilTetik')){
        const div=document.createElement('div'); div.id='bilTetik'; div.className='note';
        div.style.borderColor='var(--mm2)';
        div.innerHTML='<b>Bilanço tetiği ('+esc(T.tarih||'')+'):</b> '+yeni.length+' şirket FR yayımladı, kartı yok — '+
          yeni.slice(0,12).map(esc).join(', ')+(yeni.length>12?' …':'')+
          '. <span class="thin">Kart istemek için: "X Y kartlarını yaz".</span>';
        el.parentNode.insertBefore(div, el);
      }
    }
  }catch(e){}
  try{
    /* §245y AYIRT EDEN TEŞHİS. Eski catch 404'ü, parse hatasını ve ağ
       kopmasını AYNI mesaja bindiriyordu ("yüklenemedi — klasörde mi?").
       2 Ağu'da kartlar kaybolunca dosyanın mı, yüklemenin mi, kodun mu
       suçlu olduğu ekrandan ANLAŞILAMADI — §245h dersinin dördüncü tekrarı:
       ayırt etmeyen teşhis, teşhis değildir. Artık üç arıza üç ayrı mesaj. */
    const r=await fetch('/inceleme-ai.json',{cache:'no-store'});
    if(!r.ok) throw new Error('HTTP_'+r.status);
    const ham=await r.text();
    let d;
    try{ d=JSON.parse(ham); }
    catch(pe){ throw new Error('PARSE:'+String(pe.message).slice(0,120)+' · boyut '+(ham.length/1024).toFixed(0)+' KB'); }
    /* §161: panel DOSYA SIRASIYLA basıyordu, sıralama yapmıyordu. Yeni kart
       dosyanın SONUNA eklenince listenin DİBİNE düşüyor ve kullanıcı görmüyor
       (29 Tem'de tam bu oldu — üç kart yazıldı, 18-20. sıradaydı).
       Artık panel kendi sıralıyor: en yeni üstte. Dosya sırası ARTIK ÖNEMSİZ,
       gelecekte kim nereye eklerse eklesin doğru görünür.
       tarih_iso yoksa görünen tarihten çözülür (eski kartlar için geri uyum). */
    const AY_={'oca':1,'şub':2,'sub':2,'mar':3,'nis':4,'may':5,'haz':6,'tem':7,'ağu':8,'agu':8,'eyl':9,'eki':10,'kas':11,'ara':12};
    const isoCoz=(k)=>{
      if(k.tarih_iso) return k.tarih_iso;
      const t=String(k.tarih||'').trim();
      let m=t.match(/^(\d{4})-(\d{2})-(\d{2})/); if(m) return m[0];
      m=t.match(/^(\d{1,2})\s+(\S+)\s+(\d{4})/);
      if(m){ const a=AY_[m[2].toLowerCase().slice(0,3)];
        if(a) return m[3]+'-'+String(a).padStart(2,'0')+'-'+String(+m[1]).padStart(2,'0'); }
      return '0000-00-00';
    };
    const kartlar=(d.kartlar||[]).slice().sort((a,b)=>{
      const x=isoCoz(a), y=isoCoz(b);
      return x===y ? String(a.kod).localeCompare(String(b.kod)) : (x<y?1:-1);
    });
    /* §222b BİRLEŞTİRME: dosya + onaylanan taslaklar.
     Aynı (kod, dönem) varsa DOSYA kazanır — dosyaya işlenmiş kart, taslağın
     kalıcılaşmış hâlidir; taslak artık gereksizdir.
     Taslaklar `_taslak:true` taşır ve kartta rozetle görünür. */
  let birlesik = kartlar;
  try{
    const ts = JSON.parse(localStorage.getItem('ktp_taslak_kart_v1')||'[]')||[];
    if(ts.length){
      const varOlan = new Set(kartlar.map(k=>String(k.kod).toUpperCase()+'|'+String(k.donem||'')));
      const ek = ts.filter(t=>!varOlan.has(String(t.kod).toUpperCase()+'|'+String(t.donem||'')));
      birlesik = ek.concat(kartlar).sort((a,b)=>{
        const x=isoCoz(a), y=isoCoz(b);
        return x===y ? String(a.kod).localeCompare(String(b.kod)) : (x<y?1:-1);
      });
    }
  }catch(e){ console.warn('[KTPanel] taslak birleştirme:', e); }
  INC_KARTLAR=birlesik;
    /* §166: kart listesi yüklendiğinde BIST takvimi de tazelenir — takvim
       kartlardan türediği için ikisi TEK kaynaktan beslenir, ayrışamazlar. */
    try{ if(typeof bistTakvimYukle==='function') bistTakvimYukle().then(()=>bistTakvimRender()); }catch(e){}
    /* Tek çağrı yeter — iki kez yazılmıştı, ikincisi boşuna iş. */
    try{ if(typeof globalTakvimRender==='function') globalTakvimRender(); }catch(e){}
    if(!birlesik.length){el.innerHTML='<div class="sub">Henüz kart yok — ilk bilanço incelemesini iste.</div>';return;}
    const skorRenk=(s)=>(s==='POZİTİF'||s==='GÜÇLÜ')?'var(--mm2)':s==='NEGATİF'?'#DE4B5E':'#8896A5';   // §252g
    /* §224 ÇİZİM ARTIK BİRLEŞİK LİSTEDEN. Önce INC_KARTLAR birleştiriliyor ama
   ÇİZİM hâlâ `kartlar`ı (yalnız dosyayı) kullanıyordu — onaylanan taslak
   listeye giriyor, EKRANA GELMİYORDU. "Eklendi" diyip göstermemek, en
   kafa karıştırıcı hata türü.
   Ayrıca onaylanan kart ROZETLE ayrılıyor: dosyaya işlenmiş kartla
   buluttan gelen kart görsel olarak ayırt edilebilmeli. */
el.innerHTML=birlesik.map(k=>{
      const met=(k.metrikler||[]).map(x=>
        '<div style="display:grid;grid-template-columns:1fr auto 64px 64px;gap:8px;align-items:baseline;padding:4px 0;border-bottom:1px dashed var(--line)">'+
        '<span style="font-size:10px;color:var(--muted)">'+x.ad+'</span>'+
        '<span style="font-family:var(--mono);font-size:11px;font-weight:600">'+x.deger+'</span>'+
        '<span class="'+(String(x.cc).startsWith('+')?'up':String(x.cc).startsWith('−')||String(x.cc).startsWith('-')?'down':'')+'" style="font-size:10px;text-align:right">ÇÇ '+(x.cc||'—')+'</span>'+
        '<span class="'+(String(x.yoy).startsWith('+')?'up':'down')+'" style="font-size:10px;text-align:right">YoY '+(x.yoy||'—')+'</span></div>').join('');
      const onem=(k.onemli||[]).map(o=>'<div style="font-size:10px;color:var(--ink);padding:2px 0">• '+o+'</div>').join('');
      return '<div class="card" style="margin-bottom:12px">'+
        '<div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:6px">'+
        '<div style="display:flex;gap:7px;align-items:baseline"><input type="checkbox" class="incSec" data-kod="'+k.kod+'" title="Mail seçimine ekle" style="cursor:pointer;accent-color:var(--mm2);position:relative;top:2px">'+
        /* §224b ONAY ROZETİ. Buluttan gelen (onaylanmış taslak) kart, dosyaya
           işlenmiş kartla görsel olarak AYIRT EDİLEBİLMELİ — biri kalıcı, biri
           henüz repoya girmemiş. Karıştırılırsa hangisinin deploy gerektirdiği
           bilinmez. */
        '<div><b style="font-size:14px">'+k.kod+'</b>'+
        (k._onaylanmis?' <span class="tag" style="background:var(--mm2);font-size:8px">ONAYLI TASLAK</span>':'')+
        ' <span class="thin">'+k.ad+' · '+k.donem+' · '+k.tarih+'</span></div></div>'+
        '<div style="display:flex;gap:5px;align-items:center">'+
        '<button class="btn" data-mail="'+k.kod+'" title="Bu kartı mail at" style="font-size:9px;padding:2px 7px">✉</button>'+
        '<button class="btn" data-kopya="'+k.kod+'" title="Panoya kopyala" style="font-size:9px;padding:2px 7px">⧉</button>'+
        /* §256 SİL — YALNIZ ONAYLI TASLAKTA. Dosyadan (inceleme-ai.json) gelen
           kart repoda yaşar, tarayıcıdan silinemez; düğme çıkarsa yanıltır.
           NEDEN GEREKLİ: onay TEK YÖNLÜYDÜ. 10 Ağu'da LMKDC kartı BİN KAT şişik
           birimle onaylandı (birim 'belirsiz' kalınca model uydurdu) ve geri
           alma yolu YOKTU — tek çare konsola JSON yazmaktı.
           Yanlış kart, eksik karttan kötüdür (§243). */
        (k._onaylanmis
          ? '<button class="btn" data-sil="'+k.kod+'" data-sildonem="'+(k.donem||'')+'" title="Bu onaylı taslağı kaldır" style="font-size:9px;padding:2px 7px;color:var(--down)">🗑</button>'
          : '')+
        '<span style="font-size:9px;font-weight:700;color:#fff;background:'+skorRenk(k.skor)+';padding:2px 8px;border-radius:10px">'+k.skor+'</span></div></div>'+
        '<div class="note" style="margin:8px 0">'+k.ozet+'</div>'+
        met+
        '<div style="margin-top:8px">'+onem+'</div>'+
        '<div class="kv" style="margin-top:6px"><span class="k">Guidance</span><span style="font-size:10px;max-width:70%;text-align:right">'+(k.guidance||'—')+'</span></div>'+
        '<div class="note" style="margin-top:6px"><b>Portföy tezi:</b> '+(k.tez||'')+'</div>'+
        '</div>';
    }).join('');
    incPaylasInit();
    if(window.incSecSay)window.incSecSay();
  }catch(e){
    /* §245y: arıza tipine göre mesaj — bir sonraki ekran görüntüsü kanıt taşır */
    const m=String(e&&e.message||e);
    let msg;
    if(m.indexOf('HTTP_404')===0) msg='inceleme-ai.json sunucuda YOK (404) — dosya ktpanel/ klasörüne yüklenmemiş ya da deploy tamamlanmamış.';
    else if(m.indexOf('HTTP_')===0) msg='inceleme-ai.json sunucudan '+m.replace('HTTP_','HTTP ')+' döndü — deploy/yetki sorunu olabilir.';
    else if(m.indexOf('PARSE:')===0) msg='inceleme-ai.json indirildi ama JSON BOZUK — yükleme sırasında dosya kesilmiş/bozulmuş olabilir. Detay: '+esc(m.slice(6));
    else msg='İnceleme kartları yüklenemedi (ağ hatası): '+esc(m.slice(0,120));
    el.innerHTML='<div class="sub">'+msg+'</div>';}
}

let SEKTOR=null;
async function sektorInit(){
  try{SEKTOR=await (await fetch('/sektor.json',{cache:'no-store'})).json();}catch(e){return;}
  renderHeatmap();renderRotasyon();
  if(window.__market)canliEnjekte();
}
function heatColor(v){
  const c=Math.max(-4,Math.min(4,v))/4;
  if(c>=0)return 'rgba(15,162,107,'+(0.10+c*0.60).toFixed(2)+')';
  return 'rgba(222,75,94,'+(0.10+(-c)*0.60).toFixed(2)+')';
}
function renderHeatmap(){
  if(!SEKTOR||!$('heatBody'))return;
  const arr=SEKTOR.sektorler.slice().sort((a,b)=>b.g[0]-a.g[0]);
  $('heatBody').innerHTML=arr.map(s=>{
    const v=s.g[0],cls=v>=0?'up':'down';
    return '<div style="background:'+heatColor(v)+';border-radius:7px;padding:7px 9px;display:flex;flex-direction:column;gap:1px"><span style="font-weight:700;font-size:10px;line-height:1.2">'+esc(s.ad)+'</span><span class="num '+cls+'" style="font-size:14px;font-weight:700">'+(v>=0?'+':'')+trN(v,2)+'</span><span class="sub" style="font-size:8px">'+s.k+'</span></div>';
  }).join('');
}
function renderRotasyon(){
  if(!SEKTOR||!$('rotBody'))return;
  /* §114 TABAN EŞLEŞTİRME — ÖLÇÜLDÜ, tahmin değil:
     Yahoo XU100'e canlı 1H/1A/3A veriyor ama 13 BIST sektör endeksine VERMİYOR
     (§11'de tespit edilen aynı kök neden; orada yalnız 1G düzeltilmişti).
     Sonuç: RS = DAMGALI sektör (15 Tem) − CANLI XU100 (bugün) hesaplanıyordu, yani
     iki FARKLI zaman tabanının farkı. 28 Tem ölçümü: 13/15 sektör bu hipotezle
     BİREBİR tuttu; sapan iki isim (XUSIN, XBANK) tam da Yahoo'nun beslediği ikisiydi.
     Çarpıtma SİSTEMATİKTİ: her sektöre RS1H +2,05 · RS1A +4,11 · RS3A +4,48 puan
     ekleniyordu — hepsi endekse göre olduklarından İYİ görünüyor, kadranlar da bozuk.
     KURAL: bir ufukta sektör VE benchmark ikisi de canlıysa canlı taban; aksi halde
     İKİSİ DE damgalı taban. Karışık taban asla kullanılmaz. */
  const bmC=SEKTOR.benchmark.g, bmD=SEKTOR.benchmark.__damga||bmC;
  const bmU=SEKTOR.benchmark.__canli||[true,true,true,true];
  let damgaliUfuk=0, canliUfuk=0;
  const kadran=(rs,mom)=>rs>=0&&mom>=0?['LİDER','var(--up)']:rs>=0&&mom<0?['ZAYIFLIYOR','#E8933B']:rs<0&&mom>=0?['GÜÇLENİYOR','var(--blue)']:['GERİDE','var(--down)'];
  const arr=SEKTOR.sektorler.map(s=>{
    const sU=s.__canli||[true,true,true,true], sD=s.__damga||s.g;
    const RS=(i)=>{ const canli=sU[i]&&bmU[i];
      if(canli) canliUfuk++; else damgaliUfuk++;
      return canli ? (s.g[i]-bmC[i]) : (sD[i]-bmD[i]); };
    const rs1h=RS(1),rs1a=RS(2),rs3a=RS(3),mom=rs1h-rs1a;
    return {ad:s.ad,k:s.k,rs1h,rs1a,rs3a,kad:kadran(rs1a,mom)};
  }).sort((a,b)=>b.rs1a-a.rs1a);
  const rc=v=>'<td class="num '+(v>=0?'up':'down')+'">'+(v>=0?'+':'')+trN(v,1)+'</td>';
  $('rotBody').innerHTML=arr.map(s=>'<tr><td><b>'+esc(s.ad)+'</b> <span class="sub" style="font-size:8px">'+s.k+'</span></td>'+rc(s.rs1h)+rc(s.rs1a)+rc(s.rs3a)+'<td><span style="font-size:8px;font-weight:700;letter-spacing:.4px;color:'+s.kad[1]+'">'+s.kad[0]+'</span></td></tr>').join('');
  // ŞEFFAFLIK (§11 dersi): damga kaç kaydın GERÇEKTEN tazelendiğini söylemeli.
  const rn=$('rotNot');
  if(rn){ const top=canliUfuk+damgaliUfuk;
    rn.innerHTML = damgaliUfuk===0
      ? '<span class="sub" style="font-size:10px">RS ufuklarının tamamı canlı veriden.</span>'
      : '<span class="sub" style="font-size:10px;color:var(--down)">⚠ '+damgaliUfuk+'/'+top+
        ' RS ufku DAMGALI tabandan ('+(SEKTOR.tarih||'')+') — Yahoo bu sektör endekslerine 1H/1A/3A serisi vermiyor. '+
        'Sektör ve endeks AYNI tabandan alınır, karıştırılmaz (§114).</span>'; }
}

/* ---- Risk İştahı Barometresi (canlı) ---- */
/* §253 CDS DAMGASI GORUNUR OLDU — deger degil, ETIKET duzeltildi.
   10 Agu'da SEKIZ kaynak denendi, sekizi de kapali cikti:
     EVDS (yalniz bankacilik kredi riski) · Fintables · Alpha Vantage ·
     Massive (ABD Fed verisi) · TradingEconomics (sunucu tarafi basiyor AMA
     CDS sayfasi yok) · worldgovernmentbonds (degerler JS ile basiliyor) ·
     Yahoo TRGV5YUSAC=R (Refinitiv RIC, 'symbol may be delisted') ·
     Yahoo CDS (o ticker 'Evolve One Inc.', son islem 2019).
   SEBEP: CDS tezgahustu bir turev — borsada islem gormez, halka acik fiyat
   akisi YOKTUR. Markit dealer kotasyonlarindan derler ve SATAR. Ucretsiz
   olanlar bile en fazla HAFTALIK (MacroMicro) ya da YILLIK (EODHD/Damodaran).
   DEGER DEGISTIRILMEDI: kaynaklar celisiyor — panel 206 (27 Tem), TRT Haber
   Haz'da 225 (3,5 ayin dibi), Investing 30 Tem'de 239,57 (52h aralik
   203,98-311,12). Ayni seri olmadiklari acik. Bilinmeyen kaynagi bilinmeyen
   sayiyla degistirmek, bayat birakmaktan KOTUDUR.
   YAPILAN: damga tarihi EKRANA yazildi. Asil sorun degerin 206 olmasi degil,
   13 GUN ESKI OLDUGUNUN GORUNMEMESIYDI (§245k: gizli damga, acik damgadan
   kotudur). Guncellerken ASAGIDAKI IKI SATIRI DA guncelle. */
const RISK_CDS=221.62;                 /* §253g: yedek wgb ile hizalandi (eski: investing 227,65 / 6 Agu) */
const RISK_CDS_DAMGA='2026-08-15';
const RISK_CDS_KAYNAK='worldgovernmentbonds.com · TR 5Y CDS (SYMBOL 13)';
/* §253c DAMGALI YEDEK DUZELTILDI — 206 BAYAT DEGIL YANLISTI.
   10 Agu'da kullanicinin DevTools HAR olcumuyle gercek seri elde edildi:
     24 Tem 244,00 · 27 Tem 239,96 · 30 Tem 239,57 · 6 Agu 227,65
   Panel 27 Tem icin 206 diyordu — 34 PUAN sapma. Serinin 160 gunluk
   tamaminda 206'ya yakin TEK GUN YOK; en dusuk 203,98 ve o Aralik 2025.
   Yani 206 muhtemelen 52-HAFTALIK DIP kutusundan okunmustu.
   ETKISI: cdsS=(330-cds)/140*100 · 206 -> 88,6 puan · 227,65 -> 73,1 puan.
   Barometre skoru 76 -> 72, yani "ASIRI ACGOZLULUK" -> "ACGOZLULUK".
   Panel BIR ESIK YUKARIDA duruyordu.
   Bu deger artik YALNIZ YEDEK — canli /api/tcmb?cds=1 duserse kullanilir. */
/* §253b CDS ÇEKİCİSİ. Ayrı uç (/api/tcmb?cds=1) — market yanıtına bağlanmaz,
   çünkü investing.com yavaş ya da kapalı olursa TÜM barometreyi bekletmemeli.
   Başarısızlıkta CDS_CANLI null kalır, renderRiskBaro damgalı yedeğe düşer ve
   etikete "damgalı" basar. Sessiz düşüş YOK (§245k). */
/* §281 AVRO BÖLGESİ GSYH — ECB'DEN. FRED yedeği çizildikten SONRA üstüne
   yazar; ECB düşerse yedek görünür ve kaynağını söyler. */
/* §289 EX-ANTE REEL FAİZ AÇILIŞTA HESAPLANIR.
   ÖLÇÜLDÜ (14 Ağu): exAnteHesapla yalnız tahminCiz() içinden çağrılıyor,
   o da TAHMİNLER ALT SEKMESİ AÇILINCA koşuyor (satır 114, tembel yükleme).
   Sonuç: kullanıcı o sekmeye girmeden Merkez Bankaları kartındaki
   "İleriye dönük reel faiz" satırı BOŞ (—) kalıyordu.
   Politika faizi ve 12 ay beklentisi iki UCA bağlı; ikisini burada
   çekip window.EXANTE'yi dolduruyoruz. Tahminler sekmesi açılınca
   tahminCiz() aynı değerle ÜSTÜNE YAZAR — çelişki olmaz, §127 tek sahip
   kuralı korunur.
   NOT: TP.ENFBEK.PKA12ENF = Piyasa Katılımcıları Anketi 12 ay TÜFE
   beklentisi. Bugün EVDS'de "anket" diye ararken bulamamıştık; meğer
   PANELDE ZATEN VARMIŞ (§288 aramasının cevabı buradaydı). */
/* §290 HANE HALKI YATIRIM TERCİHİ (TP.HANEBEK.HAN20*).
   TCMB Hanehalkı Beklenti Anketi SORU_20: "yatırım yapabileceğin nakit
   varlığın olsa hangisini yaparsın?" — on seçenekli dağılım.
   NEDEN DEĞERLİ: panelin günlük fon akışı (§263) GERÇEKLEŞEN davranışı
   ölçüyor; bu seri NİYETİ veriyor. İkisi ayrışırsa sinyal.
   Tek istekte çekiliyor: ?grup=bie_hanebek&adFiltre=SORU_20 */
const HANE20 = [
  ['HAN20A','Vadeli mevduat'], ['HAN20E','Döviz'], ['HAN20F','Altın'],
  ['HAN20D','Borsa'], ['HAN20H','TL fonu'], ['HAN20I','Döviz fonu'],
  ['HAN20G','Gayrimenkul'], ['HAN20B','Araba'], ['HAN20C','Dayanıklı tüketim']
];
async function haneTercihCek(){
  const el=document.getElementById('haneTercihBody'); if(!el) return;
  try{
    /* §290b HER SERİ AYRI ÇEKİLİR. ÖLÇÜLDÜ (17 Ağu): ?adFiltre=SORU_20
       eşleşen İLK seriyi seçiyor, hepsini değil — yanıtta cozulen tek kod
       (HAN20A) ve ham'da tek sütun var. Diğer dördü hiç gelmiyordu.
       Beş ayrı istek atıyoruz; uç önbellekli, maliyet düşük. */
    const cek=async(k)=>{
      try{
        const r=await (await fetch('/api/evds2?series=TP.HANEBEK.'+k+'&gun=120&full=1',
          {cache:'no-store'})).json();
        const h=(r&&r.ham)||[]; const a='TP_HANEBEK_'+k;
        const d=h.filter(x=>x[a]!=null&&x[a]!=='');
        if(!d.length) return null;
        const sonD=parseFloat(d[d.length-1][a]);
        const oncD=d.length>1?parseFloat(d[d.length-2][a]):null;
        return { v:sonD, o:oncD, tarih:d[d.length-1].Tarih };
      }catch(e){ return null; }
    };
    const cevap=await Promise.all(HANE20.map(([k])=>cek(k)));
    /* §290b DİKKAT: isFinite(null) JS'te TRUE döner (Number(null)=0).
       İlk yazımda süzgeç bu yüzden boş değerleri geçirdi ve kartta
       "%0,0" göründü. Number.isFinite kullanılır — null'ı eler. */
    const sat=HANE20.map(([k,ad],i)=>({ad, ...(cevap[i]||{})}))
      .filter(x=>Number.isFinite(x.v)).sort((a,b)=>b.v-a.v);
    const son={Tarih:(cevap.find(x=>x&&x.tarih)||{}).tarih};
    if(!sat.length){ el.innerHTML='<div class="sub" style="font-size:10px">değer yok</div>'; return; }
    /* En yüksek beş tercih — tamamı ekranı doldurur, kalanlar gürültü. */
    const enUst=sat.slice(0,5);
    const mak=enUst[0].v||1;
    el.innerHTML=enUst.map(x=>{
      const d=Number.isFinite(x.o)?(x.v-x.o):null;
      const bar=Math.max(2,Math.round(x.v/mak*100));
      return '<div class="kv" style="align-items:center"><span class="k" style="font-size:10px">'+esc(x.ad)
        +'</span><span style="display:flex;align-items:center;gap:6px">'
        +'<span style="display:inline-block;height:4px;width:'+bar+'px;background:var(--mm2);opacity:.45;border-radius:2px"></span>'
        +'<b style="font-size:11px">%'+trN(x.v,1)+'</b>'
        +(d!=null?'<span class="'+(d>=0?'up':'down')+'" style="font-size:9px">'+(d>=0?'+':'')+trN(d,1)+'</span>':'')
        +'</span></div>';
    }).join('');
    const y=document.getElementById('haneTercihYas');
    if(y && son.Tarih) y.textContent=String(son.Tarih);
  }catch(e){ try{ el.innerHTML='<div class="sub" style="font-size:10px">EVDS yanıt vermedi</div>'; }catch(_){} }
}
async function exAnteAcilis(){
  if(!document.getElementById('mbExAnte')) return;
  try{
    /* Politika faizi UÇTAN DEĞİL tahminPolitikaFaizi()'nden — o zaten
       BIS/EVDS sıralamasını ve damgalı yedeği yönetiyor (§125). Kendi
       çağrımı yazsaydım ikinci bir sahip yaratırdım. */
    if(typeof tahminPolitikaFaizi!=='function') return;
    const [pf, br] = await Promise.all([
      tahminPolitikaFaizi().catch(()=>null),
      fetch('/api/evds2?series=TP.ENFBEK.PKA12ENF&gun=200&full=1',{cache:'no-store'}).then(r=>r.json()).catch(()=>null)
    ]);
    const pol = pf && isFinite(pf.deger) ? pf.deger : null;
    let bek = null;
    if(br){ const a='TP_ENFBEK_PKA12ENF';
      const it=(br.ham||[]).filter(x=>x[a]!=null&&x[a]!=='');
      if(it.length) bek = parseFloat(it[it.length-1][a]); }
    if(isFinite(pol) && isFinite(bek)) exAnteHesapla(pol, bek);   /* §127: tek sahip yazar */
  }catch(e){}
}
async function ecbGsyhCek(){
  const el=$('avGsyhBody'); if(!el) return;
  try{
    const j=await (await fetch('/api/evds2?mod=ecb&n=5',{cache:'no-store'})).json();
    const g=j&&j.ok&&j.veri&&j.veri.gsyh;
    if(!g||!isFinite(g.deger)) return;
    /* §281b HANGİSİ YENİYSE O KAZANIR. 13 Ağu ölçümü BEKLENTİMİ TERSİNE
       ÇEVİRDİ: ECB (MNA/I9) Ç1'26'da, FRED (Eurostat) Ç2'26'da. Eurostat hızlı
       tahminini çeyrek bitiminden ~30 gün sonra yayınlıyor; ECB'nin MNA akışı
       geriden geliyor.
       ECB'yi seçme gerekçem "20 ülke kapsamı doğru" idi ve o hâlâ geçerli —
       ama BİR ÇEYREK ESKİ veriyle üstüne yazmak KAZANÇ DEĞİL KAYIP olurdu.
       Artık tarih karşılaştırılıyor: ECB yalnız DAHA YENİYSE yazar. */
    try{
      const fr=window.__avGsyhFred||null;
      if(fr&&fr.tarih){
        const ay=(t)=>{ const m=String(t).match(/^(\d{4})-Q?(\d{1,2})/);
          if(!m) return 0; const q=+m[2];
          return +m[1]*12 + (String(t).includes('Q') ? (q-1)*3 : q-1); };
        if(ay(g.tarih) <= ay(fr.tarih)) return;   /* FRED aynı ya da daha yeni — dokunma */
      }
    }catch(e){}
    const ce=(t)=>{ const m=String(t||'').match(/^(\d{4})-Q?(\d)/);
      return m ? ('Ç'+m[2]+"'"+m[1].slice(2)) : String(t||''); };
    const v=g.deger, sn=v>=0?'up':'down';
    el.innerHTML='<div class="kv"><span class="k">Reel GSYH <span class="tag snap">'+ce(g.tarih)+'</span></span>'
      +'<span class="'+sn+'" style="font-weight:700;font-size:15px">'+(v>=0?'+':'')+'%'+trN(v,1)+'</span></div>'
      +(isFinite(g.fark)?('<div class="kv"><span class="k thin">önceki çeyreğe göre</span><span class="'
        +(g.fark>=0?'up':'down')+'">'+(g.fark>=0?'+':'')+trN(g.fark,1)+' puan</span></div>'):'')
      +'<div class="kv"><span class="k thin">yıllık değişim · 20 ülke</span><span class="thin">ECB · canlı</span></div>'
      +(g.bayat?'<div class="kv"><span class="k thin" style="color:var(--down)">⚠ seri '+g.yasGun+' gün eski</span><span></span></div>':'');
  }catch(e){}
}
async function cdsCek(){
  /* §253e ÜÇ KADEMELİ DÜŞÜŞ — her kademe ÖLÇÜLEREK sıralandı:
       1) /api/tcmb?cds=1  — Vercel'den investing.com. ŞU AN 403 (Cloudflare
          datacenter IP engeli, 10 Ağu ölçümü). Yine de ilk sırada: engel
          kalkarsa en taze veri buradan gelir, kod değişikliği gerekmez.
       2) /cds.json        — GitHub Actions koşusunun yazdığı dosya (§253e).
          Actions IP havuzu farklı; TEFAS'ta TERSİ yaşandı (Actions geçiyor,
          Vercel geçmiyor), o yüzden bu kademe gerçekçi.
       3) damgalı yedek    — RISK_CDS. Etikete "damgalı" basılır.
     TARAYICI YOLU DENENMEDİ ÇÜNKÜ ÖLÇÜLDÜ: yanıt
     `Access-Control-Allow-Origin: https://tr.investing.com` döndürüyor,
     ktpanel.vercel.app'ten CORS engeli kesin. */
  const uygula=(deger,tarih,degisim,kaynak)=>{
    if(!isFinite(deger)) return false;
    CDS_CANLI={deger:+deger, tarih, degisim:isFinite(degisim)?+degisim:null, kaynak};
    renderRiskBaro(); glbCdsYaz();
    return true;
  };
  try{
    const r=await fetch('/api/tcmb?cds=1&gun=30',{cache:'no-store'});
    if(r.ok){ const j=await r.json();
      if(j&&j.ok&&uygula(j.deger,j.tarih,j.degisim,'vercel')) return; }
  }catch(e){}
  try{
    const r=await fetch('/cds.json',{cache:'no-store'});
    if(r.ok){ const j=await r.json();
      if(j&&uygula(j.deger,j.tarih,j.degisim,'actions')) return; }
  }catch(e){}
  /* ikisi de düştü — damgalı yedek zaten çizili, dokunma */
}
/* §253d GLOBAL RİSK BAROMETRESİ'ndeki CDS. index.html:303'te STATİK yazılıydı
   ve id'si yoktu — risk barometresi düzeltilirken bu kopya 206'da kaldı, aynı
   ekranda İKİ FARKLI CDS göründü. Tek kaynak, iki gösterim. */
function glbCdsYaz(){
  const el=$('glbCds'); if(!el) return;
  const c=(CDS_CANLI&&isFinite(CDS_CANLI.deger))?CDS_CANLI:null;
  const v=c?c.deger:RISK_CDS, gun=c?c.tarih:RISK_CDS_DAMGA;
  let tar=gun; try{ const d=new Date(gun);
    tar=d.getDate()+' '+['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'][d.getMonth()];
  }catch(e){}
  /* Yön etiketi ARTIK ÖLÇÜLÜYOR — "iyileşiyor" sabit yazılıydı ve CDS yükselse
     bile öyle kalırdı. Canlı değişim yoksa yön İDDİA EDİLMEZ. */
  let yon='', sinif='val';
  if(c&&isFinite(c.degisim)&&c.degisim!==0){ yon=c.degisim<0?' · iyileşiyor':' · kötüleşiyor'; sinif=c.degisim<0?'val up':'val down'; }
  el.className=sinif;
  el.innerHTML=trN(v,0)+' <span class="sub" style="display:inline">bp · '+tar+(c?' · canlı':' · damgalı')+yon+'</span>';
}
/* §263 GÜNLÜK FON AKIŞI — PYŞ bazında. fon-akis.json'u okur (Actions sabah
   koşusunda TEFAS köprüsünden üretilir). Formül dosyada değil BURADA da
   yazılı olsun diye tekrar: akış = (pay_t − pay_t−1) × fiyat_t.
   HAM ΔAUM KULLANILMAZ — 12 Ağu ölçümünde ortalama %48 sapıyordu çünkü AUM
   hem akıştan hem GETİRİDEN değişir. Pay adedi getiriden etkilenmez.
   Doğrulama: 25 gözlemde Fintables'ın kendi akış alanıyla medyan %0 fark. */
async function fonAkisRender(){
  const el=$('fonAkisBody'); if(!el) return;
  let d=null;
  try{ d=await (await fetch('/fon-akis.json',{cache:'no-store'})).json(); }catch(e){}
  if(!d || !d.akis || !d.akis.fon || !Object.keys(d.akis.fon).length){
    el.innerHTML='<div class="note">Akış verisi henüz yok — ilk hesap için iki ardışık iş günü kaydı gerekir.</div>';
    if($('fonAkisTag')) $('fonAkisTag').textContent='(veri bekleniyor)';
    return;
  }
  const F=d.akis.fon, K=d.kurucu||{};
  const kisa=t=>{ const m=String(t).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return m? (+m[3])+' '+['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'][+m[2]-1] : t; };
  if($('fonAkisTag')){ const _f=Math.round((new Date(d.akis.gun)-new Date(d.akis.onceki))/864e5);
    $('fonAkisTag').textContent='('+kisa(d.akis.onceki)+'\u2192'+kisa(d.akis.gun)+(_f>1?' \u00b7 '+_f+' g\u00fcn':'')+' \u00b7 '+d.akis.adet+' fon)'; }   /* §295: Pzt akisi 3 gunluk birikim — pencere gorunur */
  /* PYŞ bazında topla — kurucu bilinmiyorsa fon kodu altında kalır */
  /* §279b KURUM ADI NORMALLEŞTİRİLİR. İki kaynak var: TEFAS kurucuAd
     ("TERA PORTFÖY YÖNETİMİ A.Ş.") ve fon adından türetilen ("TERA PORTFÖY").
     Normalleştirmezsek AYNI KURUM İKİ SATIR olur ve toplamlar bölünür.
     "PORTFÖY"e kadar olan kısım kimliktir; gerisi (YÖNETİMİ A.Ş.) tekrar. */
  const _norm=(a)=>{
    const u=String(a||'').toUpperCase().replace(/\s+/g,' ').trim();
    const m=u.match(/^(.{2,40}?)\s+PORTF[ÖO]Y\b/);
    return m ? (m[1].trim()+' PORTFÖY') : (u||'(kurucu bilinmiyor)');
  };
  const pys={};
  for(const k of Object.keys(F)){
    const ad=_norm(K[k]||'(kurucu bilinmiyor)');
    (pys[ad]=pys[ad]||{net:0,fon:[]});
    pys[ad].net+=F[k];
    pys[ad].fon.push([k,F[k]]);
  }
  const sirali=Object.entries(pys).sort((a,b)=>b[1].net-a[1].net);
  const tum=Object.values(F);
  const giris=tum.filter(x=>x>0).reduce((s,x)=>s+x,0);
  const cikis=tum.filter(x=>x<0).reduce((s,x)=>s+x,0);
  const mlr=v=>(v>=0?'+':'')+trN(v/1e9,2);
  if($('fonAkisOzet')) $('fonAkisOzet').innerHTML=
    '<div class="card"><div class="lbl">GİRİŞ</div><div class="val up">'+mlr(giris)+' mlr ₺</div></div>'+
    '<div class="card"><div class="lbl">ÇIKIŞ</div><div class="val down">'+mlr(cikis)+' mlr ₺</div></div>'+
    '<div class="card"><div class="lbl">NET</div><div class="val '+((giris+cikis)>=0?'up':'down')+'">'+mlr(giris+cikis)+' mlr ₺</div></div>';
  /* İLK 8 GİREN + İLK 5 ÇIKAN — tamamı 200+ satır olurdu, uçlar bilgi taşır */
  const ust=sirali.slice(0,8), alt=sirali.slice(-5).reverse().filter(x=>x[1].net<0);
  const satir=(ad,o)=>{
    const enB=o.fon.sort((a,b)=>Math.abs(b[1])-Math.abs(a[1])).slice(0,3)
      .map(f=>f[0]+' '+(f[1]>=0?'+':'')+trN(f[1]/1e6,0)).join(' · ');
    return '<div class="kv"><span class="k">'+ad.slice(0,34)+' <span class="thin" style="font-size:9px">'+enB+'</span></span>'+
           '<span class="'+(o.net>=0?'up':'down')+'" style="font-weight:600">'+mlr(o.net)+' mlr ₺</span></div>';
  };
  el.innerHTML='<div style="font-size:10px;color:var(--muted);margin:6px 0 2px;letter-spacing:.4px">EN ÇOK GİREN</div>'+
    ust.map(([a,o])=>satir(a,o)).join('')+
    (alt.length?('<div style="font-size:10px;color:var(--muted);margin:10px 0 2px;letter-spacing:.4px">EN ÇOK ÇIKAN</div>'+
      alt.map(([a,o])=>satir(a,o)).join('')):'');
}
/* §259c CANLI AKIŞI DOM'A YAZAR — ve YENİDEN ÇİZİMDEN SONRA TEKRAR ÇAĞRILIR.
   yabanciRender() kartı JSON'dan komple yeniden kuruyor ve exAnteHesapla →
   yabCarryTazele → yabanciRender zinciri KULLANICI TAHMİNLER SEKMESİNİ AÇINCA
   tetikleniyor. Tek seferlik yazım o an SİLİNİRDİ ve panel sessizce eski
   (17 Tem, "+278 giriş") değerlere dönerdi. Değer YAB_CANLI'da saklanıyor,
   render sonunda yeniden basılıyor. (§252m'nin zamanlama dersi.) */
function yabHaftaCanliYaz(){
  const ry = YAB_CANLI; if(!ry || !ry.ok) return;
  try{
    const ay=['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
    const kisa = t => { const m=String(t).match(/^(\d{2})-(\d{2})-/); return m ? (+m[1])+' '+ay[+m[2]-1] : t; };
    const im = v => (v>=0?'+':'')+trN(v,1);
    if($('yabHaftaTag')) $('yabHaftaTag').textContent = '('+kisa(ry.sonHafta)+' · haftalık menkul kıymet · EVDS canlı)';
    /* §259d SIKLIK AYRIMI. Skor AYLIK ödemeler dengesinden, bu satır HAFTALIK
       menkul kıymet istatistiğinden geliyor. İkisi de "ılımlı giriş/çıkış"
       diyor ve 10 Ağu'da ZIT yöne işaret ettiler (skor giriş, hafta çıkış) —
       okuyan çelişki sanır. Ölçüler farklı, kelimeler aynıydı. */
    if($('yabHaftaVal')) $('yabHaftaVal').innerHTML =
        'hisse <b class="'+(ry.hisse>=0?'up':'down')+'">'+im(ry.hisse)+'</b>mn · '+
        'DİBS <b class="'+(ry.dibs>=0?'up':'down')+'">'+im(ry.dibs)+'</b>mn · '+
        'ÖST <b class="'+(ry.ost>=0?'up':'down')+'">'+im(ry.ost)+'</b>mn '+
        '<span class="thin">· toplam '+im(ry.toplam)+' mn $ — '+ry.yon+'</span>';
    if($('yabSeriVal') && Array.isArray(ry.seri)) $('yabSeriVal').innerHTML =
        ry.seri.slice(-5).map(w=>{
          const t=(w.dibs||0)+(w.ost||0), rekor=t>2000;
          return kisa(w.tarih).replace(' ','\u00A0')+' <b class="'+((w.hisse||0)>=0?'up':'down')+'">'+Math.round(w.hisse||0)+
                 '</b>/<b'+(rekor?' class="up"':'')+'>'+Math.round(t)+(rekor?'★':'')+'</b>';
        }).join(' → ');
  }catch(e){}
}
function renderRiskBaro(){
  if(!$('riskBaroSkor'))return;
  const m=window.__market;
  /* §253b CANLI CDS. Gelmezse damgali yedege duser ve BUNU SOYLER. */
  const cdsCanli=!!(CDS_CANLI&&isFinite(CDS_CANLI.deger));
  const vix=(m&&m.vix)?m.vix.p:17, bist=(m&&m.xu100)?m.xu100.chg:0,
        cds=cdsCanli?CDS_CANLI.deger:RISK_CDS;
  const cl=x=>Math.max(0,Math.min(100,x));
  const vixS=cl((28-vix)/(28-13)*100), cdsS=cl((330-cds)/(330-190)*100), bistS=cl((bist+3)/6*100);
  const skor=Math.round(vixS*0.35+cdsS*0.25+bistS*0.40);
  const e=skor>=75?['AŞIRI AÇGÖZLÜLÜK','var(--up)']:skor>=58?['AÇGÖZLÜLÜK','var(--up)']:skor>=43?['NÖTR','#E8933B']:skor>=25?['KORKU','var(--down)']:['AŞIRI KORKU','var(--down)'];
  $('riskBaroSkor').innerHTML='<span style="font-family:var(--mono);font-size:34px;font-weight:700;color:'+e[1]+'">'+skor+'</span> <span style="font-weight:700;font-size:13px;letter-spacing:.5px;color:'+e[1]+'">'+e[0]+'</span> <span class="sub" style="display:inline">/100</span>';
  $('riskBaroIbre').style.left='calc('+skor+'% - 2px)';
  const bl=(ad,v,det)=>'<div class="kv"><span class="k">'+ad+'</span><span><b>'+Math.round(v)+'</b>/100 <span class="sub" style="display:inline">'+det+'</span></span></div>';
  /* §253 CDS satiri artik YASINI SOYLUYOR. VIX ve BIST canli; CDS elle.
     Yas 10 gunu gecerse etiket kirmizilasir — barometrenin %25'inin bayat
     oldugu SESSIZ kalmaz. */
  const cdsGun=cdsCanli?CDS_CANLI.tarih:RISK_CDS_DAMGA;
  let cdsYas=null;
  try{ cdsYas=Math.floor((new Date()-new Date(cdsGun))/86400000); }catch(e){}
  const cdsTar=(()=>{ try{ const d=new Date(cdsGun);
      return d.getDate()+' '+['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'][d.getMonth()];
    }catch(e){ return cdsGun; } })();
  const cdsEski=(cdsYas!=null&&cdsYas>10);
  const cdsDgs=(cdsCanli&&isFinite(CDS_CANLI.degisim)&&CDS_CANLI.degisim!==0)
    ? ' <span class="'+(CDS_CANLI.degisim<0?'up':'down')+'">'+(CDS_CANLI.degisim>0?'+':'')+trN(CDS_CANLI.degisim,1)+'</span>' : '';
  const cdsDet=trN(cds,0)+' bp'+cdsDgs+' <span class="thin" style="font-size:9px;color:'+(cdsEski?'var(--down)':'var(--muted)')+'">· '
    +cdsTar+(cdsYas!=null?' ('+cdsYas+'g)':'')+(cdsCanli?' · canlı':' · damgalı')+(cdsEski?' ⚠':'')+'</span>';
  $('riskBaroBilesen').innerHTML=bl('VIX (küresel korku)',vixS,'%'+trN(vix,2))+bl('TR CDS (ülke riski)',cdsS,cdsDet)+bl('BIST momentum (günlük)',bistS,(bist>=0?'+':'')+trN(bist,2)+'%');
}

/* ---- Tek tus canli yenileme ---- */
$('btnYenile').addEventListener('click',async()=>{
  const b=$('btnYenile');b.disabled=true;b.textContent='yenileniyor\u2026';
  try{await Promise.all([loadLive(),loadTcmb()]);}catch(e){}
  $('sonYenile').textContent='son: '+new Date().toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'});
  b.textContent='\u21bb Canl\u0131lar\u0131 yenile';b.disabled=false;
});

/* ---- Veri Durumu Drawer ---- */
(function(){
  const dr=$('drawer'),bk=$('drawerBack');
  const op=()=>{dr.classList.add('open');bk.classList.add('open');};
  const cl=()=>{dr.classList.remove('open');bk.classList.remove('open');};
  const t=$('drawerTrigger'),c=$('drawerClose');
  if(t)t.addEventListener('click',op);
  if(c)c.addEventListener('click',cl);
  if(bk)bk.addEventListener('click',cl);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')cl();});
})();
/* ---- Ajan Drawer ---- */
(function(){
  const dr=$('ajanDrawer'),bk=$('ajanBack');
  if(!dr)return;
  const op=()=>{dr.classList.add('open');bk.classList.add('open');};
  const cl=()=>{dr.classList.remove('open');bk.classList.remove('open');};
  const t=$('ajanTrigger'),c=$('ajanClose');
  if(t)t.addEventListener('click',op);
  if(c)c.addEventListener('click',cl);
  if(bk)bk.addEventListener('click',cl);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')cl();});
})();

/* ---- Halka Arzlar ---- */
let HALKAARZ=null;
async function halkaarzInit(){try{HALKAARZ=await (await fetch('/halkaarz.json',{cache:'no-store'})).json();}catch(e){return;}halkaarzRender();}
function halkaarzRender(){
  if(!HALKAARZ||!$('halkaarzBody'))return;
  const arr=HALKAARZ.arzlar, gec=arr.filter(a=>a.getiri!=null);
  const ort=gec.reduce((s,a)=>s+a.getiri,0)/gec.length, katUygun=arr.filter(a=>a.katilim).length;
  const eIyi=gec.reduce((a,b)=>b.getiri>a.getiri?b:a), eKotu=gec.reduce((a,b)=>b.getiri<a.getiri?b:a);
  if($('halkaarzOzet'))$('halkaarzOzet').innerHTML=
    '<div class="card" style="padding:8px 12px"><div class="lbl">2026 ARZ</div><div class="val">'+arr.length+'</div><div class="sub">'+katUygun+' katılım-uygun</div></div>'+
    '<div class="card" style="padding:8px 12px"><div class="lbl">ORT. GETİRİ</div><div class="val '+(ort>=0?'up':'down')+'">'+(ort>=0?'+':'')+trN(ort,0)+'%</div><div class="sub">arz→bugün</div></div>'+
    '<div class="card" style="padding:8px 12px"><div class="lbl">EN İYİ</div><div class="val up">'+eIyi.k+'</div><div class="sub">+'+trN(eIyi.getiri,0)+'%</div></div>'+
    '<div class="card" style="padding:8px 12px"><div class="lbl">EN KÖTÜ</div><div class="val down">'+eKotu.k+'</div><div class="sub">'+trN(eKotu.getiri,0)+'%</div></div>';
  $('halkaarzBody').innerHTML=arr.map(a=>{
    const g=a.getiri, yaklasan=a.durum==='yaklasan'||a.durum==='hazirlaniyor';
    const gtd=g==null?'<td class="num"><span class="sub" style="color:var(--mm2);font-weight:600">'+(a.durum==='hazirlaniyor'?'hazırlanıyor':a.durum==='yaklasan'?'yaklaşan':'yeni')+'</span></td>':'<td class="num '+(g>=0?'up':'down')+'" style="font-weight:600">'+(g>=0?'+':'')+trN(g,0)+'%'+((!a.duzeltildi&&Math.abs(g)>150)?' *':'')+'</td>';
    const kat=a.katilim?'<span style="font-size:8px;font-weight:700;color:var(--mm2)">KATILIM</span>':(a.katilim===false?'<span style="font-size:8px;color:var(--line2)">\u2014</span>':'<span style="font-size:8px;color:var(--line2)">?</span>');
    const tarih=a.ilk?a.ilk.slice(5):(a.talep||'\u2014');
    return '<tr'+(yaklasan?' style="background:rgba(48,186,143,.06)"':'')+'><td><b>'+a.k+'</b> <span class="sub" style="font-size:9px">'+esc(a.ad)+'</span></td><td class="num" style="font-size:10px">'+tarih+'</td><td class="num">'+(a.arz?trN(a.arz,2):'\u2014')+'</td><td class="num">'+(a.guncel?trN(a.guncel,2):'\u2014')+'</td>'+gtd+'<td class="num" style="font-size:10px">'+(a.buyukluk?trN(a.buyukluk,1):'\u2014')+'</td><td>'+kat+'</td></tr>';
  }).join('');
}

/* ---- Guidance ---- */
let GUIDANCE=null, guidanceManuel=JSON.parse(localStorage.getItem('guidance_v1')||'[]');
async function guidanceInit(){
  try{GUIDANCE=await (await fetch('/guidance.json',{cache:'no-store'})).json();}catch(e){}
  const ara=$('guidanceAra'); if(ara)ara.addEventListener('input',guidanceRender);
  const ek=$('gmEkle'); if(ek)ek.addEventListener('click',guidanceEkle);
  guidanceRender();
}
function gTablo(txt){
  const sat=String(txt).split(/\r?\n/).filter(s=>s.trim());
  let html='<table>',ilk=true;
  sat.forEach(s=>{
    if(!s.replace(/[|:\-\s]/g,''))return;
    if(s.indexOf('|')<0){html+='<tr><td colspan="9" style="border:none">'+esc(s)+'</td></tr>';return;}
    let parts=s.split('|'); if(parts[0].trim()==='')parts.shift(); if(parts.length&&parts[parts.length-1].trim()==='')parts.pop();
    const tag=ilk?'th':'td'; ilk=false;
    html+='<tr>'+parts.map(p=>'<'+tag+'>'+esc(p.trim())+'</'+tag+'>').join('')+'</tr>';
  });
  return html+'</table>';
}
function guidanceRender(){
  if(!$('guidanceListe'))return;
  const ara=($('guidanceAra')?$('guidanceAra').value:'').toLowerCase().trim();
  const fin=(GUIDANCE?GUIDANCE.sirketler:[]).map(s=>({k:s.k,ad:s.ad,g:s.g,yil:GUIDANCE.yil,kaynak:'Fintables'}));
  const man=guidanceManuel.map((s,i)=>({k:s.k,ad:s.ad,g:s.g,yil:s.yil,kaynak:'Manuel',mi:i}));
  let tum=man.concat(fin);
  if(ara)tum=tum.filter(s=>(s.k||'').toLowerCase().includes(ara)||(s.ad||'').toLowerCase().includes(ara));
  $('guidanceListe').innerHTML=tum.length?tum.map(s=>
    '<div class="card" style="margin-bottom:8px;padding:8px 12px"><div class="lbl" style="display:flex;align-items:center;gap:6px">'+s.k+' <span style="font-weight:500;text-transform:none;letter-spacing:0;color:var(--muted)">'+esc(s.ad||'')+'</span> <span class="tag'+(s.kaynak==='Fintables'?' snap':'')+'">'+s.kaynak+(s.yil?' \u00b7 '+s.yil:'')+'</span>'+(s.kaynak==='Manuel'?' <button data-gsil="'+s.mi+'" style="margin-left:auto;background:none;border:none;color:var(--down);cursor:pointer;font-size:13px">\u2715</button>':'')+'</div><div style="overflow-x:auto;margin-top:4px">'+gTablo(s.g)+'</div></div>'
  ).join(''):'<div class="sub">Eşleşen şirket bulunamadı.</div>';
  $('guidanceListe').querySelectorAll('button[data-gsil]').forEach(b=>b.addEventListener('click',()=>{
    /* §245m MEZAR TAŞI: silinen kaydın kimliği (kod|yıl) damgayla saklanır.
       Yoksa birleştirme sunucuda kaydı "yalnız diğer tarafta var" sanıp
       GERİ DİRİLTİR — birinin sildiği, diğerinin bayat kopyasından döner. */
    const sil=guidanceManuel[+b.dataset.gsil];
    if(sil){
      try{
        const m=JSON.parse(_origGet('__sil_guidance_v1')||'[]');
        m.push({id:String(sil.k||'').toUpperCase()+'|'+String(sil.yil||''), ts:Date.now()});
        localStorage.setItem('__sil_guidance_v1',JSON.stringify(m.slice(-200)));
      }catch(e){}
    }
    guidanceManuel.splice(+b.dataset.gsil,1);localStorage.setItem('guidance_v1',JSON.stringify(guidanceManuel));guidanceRender();
  }));
}
function guidanceEkle(){
  const k=$('gmKod').value.trim().toUpperCase(), ad=$('gmAd').value.trim(), yil=$('gmYil').value.trim(), g=$('gmMetin').value.trim();
  if(!k||!g){$('gmMsg').textContent='Kod ve metin gerekli.';return;}
  guidanceManuel.unshift({k,ad,yil,g,ts:Date.now()}); /* §245m: birleşim hakemi */
  localStorage.setItem('guidance_v1',JSON.stringify(guidanceManuel));
  $('gmKod').value='';$('gmAd').value='';$('gmMetin').value='';$('gmMsg').textContent=k+' eklendi \u2713';
  guidanceRender();
}

/* ---- Halka Arz Değerleme Kartı (manuel girdi · kayıtlı) ----------------------
   Aracı kurum arz modelinin panel karşılığı. Girdi = sarı hücreler, gerisi türetilir.
   HİÇBİR RAKAM GÖMÜLÜ DEĞİL — tüm alanlar boş açılır, kullanıcı girer, kaydeder.

   ÜÇ METODOLOJİ KARARI (Excel modeliyle birebir doğrulandı):
   1) NAKİT GİRİŞİ yalnız SERMAYE ARTIRIMINDAN gelir. Ortak satışı ve ek satış
      mevcut hissedarın cebine gider; şirkete girmez, net borcu düşürmez.
      Doğrulama: 24,0 mn payın 19,2 mn'i sermaye artırımı → arz büyüklüğünün %80'i
      nakit girişi (48.591.568 × 0,80 = 38.873.254 ✓).
   2) FİRMA DEĞERİ = piyasa değeri + ARZ SONRASI net borç. Arz öncesi net borçla
      kurulan EV, halka arzın bilançoya etkisini yok sayar ve EV/EBITDA'yı şişirir.
      Doğrulama: 42.855.000 − 38.873.254 = 3.981.746 ✓ → 233.239.525 + 3.981.746
      = 237.221.271 ✓
   3) P/E ve EV çarpanları POST-MONEY pay adediyle kurulur (mevcut + artan).
      Arz öncesi adetle kurulan çarpan, yatırımcının aldığı hisseyi temsil etmez.

   FARK: Excel sıfıra bölmede #SAYI/0! döker; burada "—" gösterilir ve hesap
   kırılmaz. Ayrıca opsiyonel İHRAÇ MALİYETİ alanı var (Excel'de yok) — aracılık
   komisyonu nakit girişini azaltır, EV'yi yükseltir.
------------------------------------------------------------------------------ */
const ARZ_KEY='ktp_arz_kayit_v1';
const ARZ_YILN=6;
let ARZ_SON=null;

/* Türkçe sayı okuyucu: "96.000.000" · "20,83" · "1234.56" hepsini çözer */
function arzS(id){
  const e=$(id); if(!e) return null;
  let v=String(e.value||'').trim().replace(/\s/g,''); if(!v) return null;
  if(v.indexOf(',')>=0) v=v.replace(/\./g,'').replace(',','.');
  else if(/^-?\d{1,3}(\.\d{3})+$/.test(v)) v=v.replace(/\./g,'');
  const n=parseFloat(v); return isFinite(n)?n:null;
}
function arzT(id){const e=$(id);return e?String(e.value||'').trim():'';}
const arzF=(v,d)=>(v==null||!isFinite(v))?'—':trN(v,d==null?0:d);
const arzP=(v,d)=>(v==null||!isFinite(v))?'—':(v>=0?'':'−')+trN(Math.abs(v),d==null?1:d)+'%';
const arzX=(v)=>(v==null||!isFinite(v))?'—':trN(v,1)+'x';

/* Yıl kolonlarının alan kimlikleri — HTML'de elle yazılmaz, burada üretilir */
function arzYilAlan(){
  const a=[];
  for(let i=1;i<=ARZ_YILN;i++) ['arzY','arzSt','arzFv','arzFm','arzNk','arzNm','arzIs'].forEach(p=>a.push(p+i));
  return a;
}
const ARZ_ALAN=['arzKod','arzAd','arzAraci','arzFiyat','arzDoviz','arzKur','arzMevcut','arzArtan',
  'arzOrtak','arzEk','arzNetBorc','arzMaliyet','arzBirim','arzTahYY','arzTahYK','arzTahDK'].concat(arzYilAlan());

/* Tahmin ızgarasını kur (6 yıl × 7 satır) */
function arzIzgaraKur(){
  const w=$('arzTahminWrap'); if(!w||w.dataset.kuruldu) return;
  const sat=[['arzY','Yıl etiketi','ör. 2026'],['arzSt','Satışlar',''],['arzFv','FAVÖK',''],
    ['arzFm','FAVÖK Marj %','ops.'],['arzNk','Net Kâr',''],['arzNm','Net Kâr Marj %','ops.'],
    ['arzIs','Net İşl. Sermayesi','ops.']];
  let h='<div style="overflow-x:auto"><table class="arzTbl" style="min-width:620px"><thead><tr><th style="width:150px">GİRDİ</th>';
  for(let i=1;i<=ARZ_YILN;i++) h+='<th>'+i+'. YIL</th>';
  h+='</tr></thead><tbody>';
  sat.forEach(([p,ad,ph])=>{
    h+='<tr><td style="font-size:10px;color:var(--muted)">'+ad+'</td>';
    for(let i=1;i<=ARZ_YILN;i++)
      h+='<td style="padding:3px 4px"><input class="arzIn" id="'+p+i+'" type="text" inputmode="decimal" placeholder="'+ph+'" style="min-width:74px;text-align:right;padding:5px 6px"></td>';
    h+='</tr>';
  });
  w.innerHTML=h+'</tbody></table></div>';
  w.dataset.kuruldu='1';
}

/* ── ÇEKİRDEK HESAP ── */
function arzHesapla(){
  if(!$('arzSonuc')) return;
  const fiyat=arzS('arzFiyat'), mevcut=arzS('arzMevcut'), artan=arzS('arzArtan')||0,
        ortak=arzS('arzOrtak')||0, ek=arzS('arzEk')||0,
        netBorc=arzS('arzNetBorc'), maliyet=arzS('arzMaliyet')||0,
        kur=arzS('arzKur');
  /* §276 TAHMİN BİRİMİ ₺ YA DA $ OLABİLİR. Değer "usd:1000" gibi geldiğinde
     tahminler önce ölçeklenir, sonra KUR ile ₺'ye çevrilir — çünkü PD/EV
     hesabı ₺ tabanlıdır ve çarpanlar aynı para biriminde olmalı.
     13 Ağu KPEKS: "₺ (tam)" seçiliydi ama veriler BİN ₺ idi; EV/Satışlar
     108,5x göründü, gerçeği 0,1085x — TAM 1000 KAT. Birim seçimi bir
     ayrıntı değil, çarpanların TAMAMINI belirliyor. */
  const _bh = String(($('arzBirim')&&$('arzBirim').value) || '1');
  const _bUsd = _bh.indexOf('usd:') === 0;
  const birim = parseFloat(_bh.replace('usd:','')) || 1;
  /* §276 TAHMİN $ İSE ÇARPAN TABANI DA $ OLUR — tahmini ₺'ye ÇEVİRMEK yanlış.
     İlk yazımda tahminleri kur ile ₺'ye çeviriyordum; kullanıcı haklı olarak
     düzeltti: USD EV ZATEN HESAPLANIYOR (sağ sütun). Doğrusu tahmini olduğu
     gibi bırakıp PAYDAYI değiştirmek — $ tahmin, $ EV'ye bölünür.
     Çevirmek yuvarlama hatası da ekler; bölmek temizdir. */
  const dv=arzT('arzDoviz');
  /* §276 USD seçiliyken kur yoksa çarpım SIFIRLANIR — sessizce sıfır tahmin
     üretmek yerine kullanıcıyı uyar. */
  if(_bUsd && !kur){ const _d=$('arzDurum'); if(_d) _d.textContent='⚠ Tahmin birimi $ seçili ama KUR boş — çarpanlar hesaplanamaz'; }

  const sonrasi   = (mevcut!=null) ? mevcut+artan : null;                 // post-money adet
  const arzEdilen = (artan+ortak)||null;                                  // halka arz edilen
  const ekDahil   = arzEdilen!=null ? arzEdilen+ek : null;
  const ff   = (sonrasi&&arzEdilen) ? arzEdilen/sonrasi*100 : null;
  const ffEk = (sonrasi&&ekDahil)   ? ekDahil/sonrasi*100   : null;

  const buyukluk   = (fiyat!=null&&arzEdilen!=null) ? arzEdilen*fiyat : null;
  const buyuklukEk = (fiyat!=null&&ekDahil!=null)   ? ekDahil*fiyat   : null;
  const pd         = (fiyat!=null&&sonrasi)         ? sonrasi*fiyat   : null;
  const nakitBrut  = (fiyat!=null&&artan)           ? artan*fiyat     : null;   // YALNIZ sermaye artırımı
  const nakit      = nakitBrut!=null ? nakitBrut*(1-maliyet/100) : null;
  const netBorcSon = (netBorc!=null) ? netBorc-(nakit||0) : null;
  const ev         = (pd!=null&&netBorcSon!=null) ? pd+netBorcSon : null;

  const D=(v)=>(v!=null&&kur)?v/kur:null;                                  // döviz karşılığı
  const dvBas = dv?('<th>'+esc(dv)+'</th>'):'';
  const dvHc  = (v,d)=>dv?('<td style="color:var(--muted)">'+arzF(D(v),d==null?0:d)+'</td>'):'';

  /* KÖPRÜ TABLOSU */
  let kop='<div style="overflow-x:auto"><table class="arzTbl"><thead><tr><th style="width:230px">DEĞERLEME KÖPRÜSÜ</th><th>₺ / ADET</th>'+dvBas+'</tr></thead><tbody>';
  const sat=(ad,v,d,vurgu,notu)=>{kop+='<tr><td'+(vurgu?' style="font-weight:700"':'')+'>'+ad+
    (notu?' <span class="sub" style="font-size:9px">'+notu+'</span>':'')+'</td><td'+
    (vurgu?' style="font-weight:700;color:var(--mm2)"':'')+'>'+arzF(v,d)+'</td>'+dvHc(v,d)+'</tr>';};
  const satP=(ad,v)=>{kop+='<tr><td>'+ad+'</td><td style="font-weight:600">'+arzP(v,2)+'</td>'+(dv?'<td></td>':'')+'</tr>';};

  sat('Mevcut pay adedi',mevcut,0);
  sat('Sermaye artırımı (yeni pay)',artan||null,0);
  sat('Ortak satışı',ortak||null,0);
  sat('Arz sonrası pay adedi',sonrasi,0,true,'post-money');
  sat('Halka arz edilen',arzEdilen,0);
  sat('Ek satış dahil',ekDahil,0);
  satP('Fiili dolaşım (FF)',ff);
  satP('Fiili dolaşım — ek satış dahil',ffEk);
  kop+='<tr><td colspan="'+(dv?3:2)+'" style="height:6px;border:none"></td></tr>';
  sat('Halka arz büyüklüğü',buyukluk,0);
  sat('Halka arz büyüklüğü — ek satış dahil',buyuklukEk,0);
  sat('Piyasa değeri',pd,0,true,'arz fiyatı × post-money adet');
  sat('Şirkete nakit girişi (brüt)',nakitBrut,0,false,'yalnız sermaye artırımı');
  if(maliyet) sat('İhraç maliyeti (−)',nakitBrut!=null?-(nakitBrut*maliyet/100):null,0);
  sat('Şirkete net nakit girişi',nakit,0);
  sat('Net borç — arz öncesi',netBorc,0);
  sat('Net borç — arz sonrası',netBorcSon,0,false,'nakit girişi düşülmüş');
  sat('Firma değeri (EV)',ev,0,true,'PD + arz sonrası net borç');
  kop+='</tbody></table></div>';

  /* TAHSİSAT */
  const ty=arzS('arzTahYY'), tk=arzS('arzTahYK'), td=arzS('arzTahDK');
  let tah='';
  if(ty!=null||tk!=null||td!=null){
    const top=(ty||0)+(tk||0)+(td||0);
    const grup=[['Yurtiçi Yerleşik',ty],['Yurtiçi Kurumsal',tk],['Yurtdışı Kurumsal',td]];
    tah='<div style="overflow-x:auto;margin-top:12px"><table class="arzTbl"><thead><tr><th style="width:230px">TAHSİSAT'+
      ' <span class="sub" style="font-size:9px">(ek satış dahil arz üzerinden)</span></th><th>PAY %</th><th>ADET</th><th>TUTAR ₺</th>'+dvBas+'</tr></thead><tbody>'+
      grup.map(([ad,p])=>{
        const ad_=(p!=null&&ekDahil!=null)?ekDahil*p/100:null, tu=(p!=null&&buyuklukEk!=null)?buyuklukEk*p/100:null;
        return '<tr><td>'+ad+'</td><td>'+arzP(p,1)+'</td><td>'+arzF(ad_,0)+'</td><td>'+arzF(tu,0)+'</td>'+dvHc(tu,0)+'</tr>';
      }).join('')+
      '<tr><td style="font-weight:700">TOPLAM</td><td style="font-weight:700;color:'+
      (Math.abs(top-100)<0.01?'var(--mm2)':'var(--down)')+'">'+arzP(top,1)+
      (Math.abs(top-100)<0.01?'':' ⚠')+'</td><td style="font-weight:700">'+arzF(ekDahil,0)+
      '</td><td style="font-weight:700">'+arzF(buyuklukEk,0)+'</td>'+dvHc(buyuklukEk,0)+'</tr>'+
      '</tbody></table></div>'+
      (Math.abs(top-100)<0.01?'':'<div class="sub" style="color:var(--down);font-size:10px;margin-top:4px">Tahsisat yüzdeleri %100 etmiyor — dağıtım adetleri arz büyüklüğüyle uyuşmaz.</div>');
  }

  /* TAHMİNLER & ÇARPANLAR */
  const Y=[];
  for(let i=1;i<=ARZ_YILN;i++){
    const et=arzT('arzY'+i);
    const st=arzS('arzSt'+i)!=null?arzS('arzSt'+i)*birim:null;
    const fmG=arzS('arzFm'+i), nmG=arzS('arzNm'+i);
    let fv=arzS('arzFv'+i)!=null?arzS('arzFv'+i)*birim:null;
    let nk=arzS('arzNk'+i)!=null?arzS('arzNk'+i)*birim:null;
    if(fv==null&&st!=null&&fmG!=null) fv=st*fmG/100;      // marj girildiyse FAVÖK türet
    if(nk==null&&st!=null&&nmG!=null) nk=st*nmG/100;
    const is_=arzS('arzIs'+i)!=null?arzS('arzIs'+i)*birim:null;
    Y.push({et,st,fv,nk,is_,
      fm:(fv!=null&&st)?fv/st*100:fmG, nm:(nk!=null&&st)?nk/st*100:nmG});
  }
  Y.forEach((y,i)=>{const o=i>0?Y[i-1]:null; y.by=(o&&o.st&&y.st!=null)?(y.st/o.st-1)*100:null;});
  const dolu=Y.some(y=>y.et||y.st!=null||y.fv!=null||y.nk!=null);
  let tab='';
  if(dolu){
    const _pb = _bUsd ? (dv||'$') : '₺';
    const bir = (birim===1000000?'mn ':birim===1000?'bin ':'') + _pb;
    /* §276 ÇARPAN TABANI TAHMİNİN PARA BİRİMİYLE AYNI OLMALI.
       Tahmin $ ise TL EV'ye bölmek anlamsız — USD EV zaten hesaplanıyor
       (D(ev), köprü tablosunun sağ sütunu). Kullanıcı bunu yakaladı:
       "TL EV ile dolar FAVÖK'ü bölüyor, halbuki USD EV'yi de hesaplıyor".
       İlk düzeltmemde tahmini kur ile ₺'ye çeviriyordum — o da yanlıştı,
       çünkü çevirme yuvarlama hatası ekler. Doğrusu PAYDAYI değiştirmek. */
    const _pdT = _bUsd ? D(pd) : pd;
    const _evT = _bUsd ? D(ev) : ev;
    const satir=(ad,fn,cls)=>'<tr><td'+(cls?' style="'+cls+'"':'')+'>'+ad+'</td>'+Y.map(y=>'<td'+(cls?' style="'+cls+'"':'')+'>'+fn(y)+'</td>').join('')+'</tr>';
    tab='<div style="overflow-x:auto;margin-top:12px"><table class="arzTbl" style="min-width:620px"><thead><tr><th style="width:150px">TAHMİNLER <span class="sub" style="font-size:9px">('+bir+')</span></th>'+
      Y.map(y=>'<th>'+(y.et?esc(y.et):'—')+'</th>').join('')+'</tr></thead><tbody>'+
      satir('Satışlar <span class="thin" style="font-size:9px">('+bir+')</span>',y=>arzF(y.st!=null?y.st/birim:null,0))+
      satir('Büyüme',y=>arzP(y.by,0),'color:var(--blue);font-size:10px')+
      satir('FAVÖK',y=>arzF(y.fv!=null?y.fv/birim:null,0))+
      satir('FAVÖK Marjı',y=>arzP(y.fm,1),'color:var(--blue);font-size:10px')+
      satir('Net Kâr',y=>arzF(y.nk!=null?y.nk/birim:null,0))+
      satir('Net Kâr Marjı',y=>arzP(y.nm,1),'color:var(--blue);font-size:10px')+
      '<tr><td colspan="'+(ARZ_YILN+1)+'" style="height:6px;border:none"></td></tr>'+
      satir('P/E',y=>arzX((_pdT!=null&&y.nk>0)?_pdT/y.nk:null),'font-weight:700;color:var(--mm2)')+
      satir('EV/FAVÖK',y=>arzX((_evT!=null&&y.fv>0)?_evT/y.fv:null),'font-weight:700;color:var(--mm2)')+
      satir('EV/Satışlar',y=>arzX((_evT!=null&&y.st>0)?_evT/y.st:null),'color:var(--muted)')+
      satir('Net İşl. Serm.',y=>arzF(y.is_!=null?y.is_/birim:null,0),'font-size:10px')+
      satir('NİS / Ciro',y=>arzP((y.is_!=null&&y.st)?y.is_/y.st*100:null,1),'color:var(--muted);font-size:10px')+
      '</tbody></table></div>';
  }

  /* ÖZET ŞERİDİ */
  const oz='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(112px,1fr));gap:8px;margin-bottom:10px">'+
    '<div class="card" style="padding:7px 11px"><div class="lbl">PİYASA DEĞERİ</div><div class="val" style="font-size:15px">'+arzF(pd,0)+'</div><div class="sub">₺ · post-money</div></div>'+
    '<div class="card" style="padding:7px 11px"><div class="lbl">FİRMA DEĞERİ</div><div class="val" style="font-size:15px">'+arzF(ev,0)+'</div><div class="sub">₺ · EV</div></div>'+
    '<div class="card" style="padding:7px 11px"><div class="lbl">ARZ BÜYÜKLÜĞÜ</div><div class="val" style="font-size:15px">'+arzF(buyuklukEk||buyukluk,0)+'</div><div class="sub">₺ · ek satış dahil</div></div>'+
    '<div class="card" style="padding:7px 11px"><div class="lbl">FİİLİ DOLAŞIM</div><div class="val" style="font-size:15px">'+arzP(ffEk||ff,2)+'</div><div class="sub">ek satış dahil</div></div>'+
    '<div class="card" style="padding:7px 11px"><div class="lbl">NAKİT GİRİŞİ</div><div class="val" style="font-size:15px">'+arzF(nakit,0)+'</div><div class="sub">₺ · şirkete</div></div>'+
    '</div>';

  $('arzSonuc').innerHTML=oz+kop+tah+tab;

  ARZ_SON={kod:arzT('arzKod'),ad:arzT('arzAd'),araci:arzT('arzAraci'),fiyat,pd,ev,ff:ffEk||ff,
           buyukluk:buyuklukEk||buyukluk,nakit,sonrasi};
}

/* ── KAYIT / YÜKLE / SİL (sukuk kartıyla aynı desen · CLOUD_KEYS ile buluta senkron) ── */
function arzKayitOku(){try{return JSON.parse(localStorage.getItem(ARZ_KEY)||'[]');}catch(e){return[];}}
function arzKayitYaz(l){try{localStorage.setItem(ARZ_KEY,JSON.stringify(l));}catch(e){}}
function arzKaydet(){
  const kod=arzT('arzKod');
  if(!kod){const m=$('arzMsg');if(m)m.textContent='Kaydetmek için önce KOD alanını doldur.';return;}
  arzHesapla();
  const girdi={}; ARZ_ALAN.forEach(id=>{const e=$(id);if(e)girdi[id]=e.value;});
  const l=arzKayitOku();
  const i=l.findIndex(x=>x.kod===kod);
  const kayit={id:Date.now(),kod:kod,ozet:ARZ_SON||{},girdi:girdi,zaman:new Date().toISOString(),ts:Date.now()};
  if(i>=0)l[i]=kayit;else l.unshift(kayit);
  arzKayitYaz(l.slice(0,60)); arzKayitRender();
  const m=$('arzMsg');if(m)m.textContent=kod+(i>=0?' güncellendi ✓':' kaydedildi ✓');
}
function arzYukle(id){
  const k=arzKayitOku().find(x=>String(x.id)===String(id)); if(!k)return;
  arzIzgaraKur();
  ARZ_ALAN.forEach(f=>{const e=$(f);if(e)e.value=(k.girdi&&k.girdi[f]!=null)?k.girdi[f]:'';});
  arzHesapla();
  const el=$('arzSonuc'); if(el&&el.scrollIntoView)el.scrollIntoView({behavior:'smooth',block:'center'});
  const m=$('arzMsg');if(m)m.textContent=k.kod+' yüklendi';
}
function arzSil(id){arzKayitYaz(arzKayitOku().filter(x=>String(x.id)!==String(id)));arzKayitRender();}
function arzTemizle(){
  ARZ_ALAN.forEach(f=>{const e=$(f);if(e&&e.tagName!=='SELECT')e.value='';});
  ARZ_SON=null; arzHesapla();
  const m=$('arzMsg');if(m)m.textContent='form temizlendi';
}
function arzKayitRender(){
  const el=$('arzKayitlar'); if(!el)return;
  const l=arzKayitOku();
  if(!l.length){el.innerHTML='<div class="sub" style="font-size:11px">Kayıt yok. Bir arzı doldurup <b>Kaydet</b> dediğinde buraya düşer — aynı kodu tekrar kaydedersen üzerine yazar. Kayıtlar bulut anahtarın varsa cihazlar arası senkronlanır.</div>';return;}
  el.innerHTML='<div style="overflow-x:auto"><table class="arzTbl"><thead><tr>'+
    ['KOD','ŞİRKET','ARACI','ARZ ₺','PİYASA DEĞ.','FİRMA DEĞ.','FF %','KAYIT',''].map((h,i)=>'<th style="text-align:'+(i<3?'left':'right')+'">'+h+'</th>').join('')+
    '</tr></thead><tbody>'+l.map(k=>{const o=k.ozet||{};
      return '<tr><td style="font-weight:700">'+esc(k.kod)+'</td>'+
      '<td style="font-size:10px;color:var(--muted)">'+esc(o.ad||'')+'</td>'+
      '<td style="font-size:10px;color:var(--muted)">'+esc(o.araci||'')+'</td>'+
      '<td>'+arzF(o.fiyat,2)+'</td><td>'+arzF(o.pd,0)+'</td><td>'+arzF(o.ev,0)+'</td>'+
      '<td>'+arzP(o.ff,2)+'</td>'+
      '<td style="font-size:9px;color:var(--muted)">'+(k.zaman?k.zaman.slice(0,10):'')+'</td>'+
      '<td style="white-space:nowrap"><button class="btn" data-ayukle="'+k.id+'" style="font-size:10px;padding:2px 7px">Yükle</button> '+
      '<button class="btn" data-asil="'+k.id+'" style="font-size:10px;padding:2px 6px;opacity:.6">Sil</button></td></tr>';
    }).join('')+'</tbody></table></div>';
}
/* §278 MARJDAN FAVOK/NET KAR TURETME — KUTUYA YAZ.
   Hesapta zaten vardi (fv==null && st && fm -> st*fm/100) ama SONUC
   KULLANILIYOR, KUTUYA YAZILMIYORDU; kullanici marji girip FAVOK kutusunu bos
   goruyordu ve "hesaplanmadi" saniyordu.
   Artik kutuya yazilir — ama YALNIZ kutu BOSSA. Elle girilmis bir degeri
   marjdan turetilenle EZMEK, kullanicinin verisini silmek olurdu.
   Yazilan deger placeholder degil GERCEK deger: kaydedilir, disari aktarilir. */
function arzMarjTuret(){
  try{
    for(let i=1;i<=ARZ_YILN;i++){
      const st=arzS('arzSt'+i);
      if(st==null||!st) continue;
      for(const [hedef,marj] of [['arzFv','arzFm'],['arzNk','arzNm']]){
        const kh=$(hedef+i), km=$(marj+i);
        if(!kh||!km) continue;
        const m=arzS(marj+i);
        const bos = String(kh.value||'').trim()==='';
        const bizimki = kh.dataset.turetildi==='1';
        /* §278c KENDİ YAZDIĞIMIZI DA TAZELE.
           İlk yazımda kural "yalnız kutu BOŞSA doldur" idi ve TERS TEPTİ:
           kullanıcı "15" yazarken önce "1" tuşuna basıyor -> o anda FAVÖK
           1.000.000×1/100 = 10.000 yazılıyor, sonra "5" gelince marj 15
           oluyor AMA kutu artık DOLU olduğu için güncellenmiyordu.
           Sonuç: satış 1.000.000, marj %15 girili, FAVÖK 10.000 (=%1).
           Koruma doğruydu ama KENDİ YAZDIĞINI da "elle girilmiş" sayıyordu.
           Artık: boşsa doldur, TÜRETİLMİŞSE yeniden hesapla, ELLE girilmişse
           dokunma. Üç durum ayrı. */
        if(m!=null && (bos || bizimki)){
          const yeni=String(Math.round(st*m/100));
          if(kh.value!==yeni) kh.value=yeni;
          kh.dataset.turetildi='1';
          kh.title='marjdan türetildi — elle değiştirebilirsin';
        }
        else if(m==null && bizimki){
          kh.value=''; delete kh.dataset.turetildi; kh.title='';
        }
      }
    }
  }catch(e){}
}
/* §278b YIL ETİKETLERİ OTOMATİK. 1. yıl girilince sonrakiler +1, +2...
   YALNIZ BOŞ olanlar doldurulur — kullanıcı 3. yıla farklı bir etiket
   yazdıysa (örn. "2027T") o korunur. */
function arzYilOtoDoldur(){
  try{
    const ilk=$('arzY1'); if(!ilk) return;
    const t=String(ilk.value||'').trim();
    const y0=parseInt(t,10);
    if(!isFinite(y0)||t.length!==4) return;          // yalnız 4 haneli yıl
    for(let i=2;i<=ARZ_YILN;i++){
      const el=$('arzY'+i); if(!el) continue;
      if(String(el.value||'').trim()==='' || el.dataset.otoYil==='1'){
        el.value=String(y0+i-1); el.dataset.otoYil='1';
      }
    }
  }catch(e){}
}
function arzInit(){
  if(!$('arzSonuc'))return;
  arzIzgaraKur();
  ARZ_ALAN.forEach(id=>{const e=$(id);if(e)e.addEventListener('input',arzHesapla);});
  /* §278: marj/satış değişince türet, sonra hesapla. Sıra önemli —
     türetme kutuya yazar, arzHesapla o kutuyu okur. */
  for(let i=1;i<=ARZ_YILN;i++){
    for(const p of ['arzSt','arzFm','arzNm']){
      const e=$(p+i); if(e) e.addEventListener('input',()=>{ arzMarjTuret(); arzHesapla(); });
    }
    /* Kullanıcı FAVÖK/net kâr kutusuna ELLE yazarsa türetme damgası kalkar */
    for(const p of ['arzFv','arzNk']){
      const e=$(p+i); if(e) e.addEventListener('input',()=>{ delete e.dataset.turetildi; e.title=''; });
    }
  }
  const y1=$('arzY1'); if(y1) y1.addEventListener('input',()=>{ arzYilOtoDoldur(); arzHesapla(); });
  for(let i=2;i<=ARZ_YILN;i++){
    const e=$('arzY'+i); if(e) e.addEventListener('input',()=>{ delete e.dataset.otoYil; });
  }
  const s=$('arzDoviz'); if(s)s.addEventListener('change',arzHesapla);
  const b=$('arzBirim'); if(b)b.addEventListener('change',arzHesapla);
  const k=$('arzKaydet'); if(k)k.addEventListener('click',arzKaydet);
  const t=$('arzTemizle'); if(t)t.addEventListener('click',arzTemizle);
  const kl=$('arzKayitlar');
  if(kl)kl.addEventListener('click',e=>{
    const y=e.target.getAttribute&&e.target.getAttribute('data-ayukle');
    const s2=e.target.getAttribute&&e.target.getAttribute('data-asil');
    if(y)arzYukle(y); else if(s2){if(confirm('Kayıt silinsin mi?'))arzSil(s2);}
  });
  arzKayitRender(); arzHesapla();
}

/* ═══════════════════════════════════════════════════════════════════════════
   OMURGA MODÜLLERİ — reel getiri · tez kapanışı · risk bütçesi
   Panelin geri kalanı "durum nedir" der; bu üç modül "ne yapmalı" tarafıdır.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── MODÜL 1: REEL GETİRİ ────────────────────────────────────────────────────
   Panel her yerde reel düşünüyor (kart harcaması TÜFE ile deflate, carry reel
   faizle okunuyor) ama portföyün KENDİ getirisi nominaldi. Bu tutarsızlık kapandı.
   Yöntem: reel = (1+nominal)/(1+tüfe) − 1. Basit çıkarma DEĞİL — %45 nominal ve
   %32 TÜFE'de fark 13 puan değil %9,8'dir; yüksek enflasyonda bu sapma büyür.
   TÜFE aylık endeks serisidir; ay içi günler için doğrusal ara değer kullanılır. */
let TUFE_ENDEKS = null;                    // {'2026-7': 3421.5, ...}
let TUFE_SON_AY = null;

async function tufeYukle(){
  if(TUFE_ENDEKS) return TUFE_ENDEKS;
  try{
    const r = await fetch('/api/evds2?grup=bie_tukfiy2025&adFiltre=Genel&gun=1200&full=1');
    if(!r.ok) return null;
    const d = await r.json(), alan = (d.cozulen||d.seri||'').replace(/\./g,'_');
    const m = {};
    (d.ham||[]).forEach(x=>{
      const v = x[alan]; if(v==null||v==='') return;
      const t = String(x.Tarih).split('-');
      if(t.length<2) return;
      m[(+t[0])+'-'+(+t[1])] = parseFloat(v);
    });
    const anahtarlar = Object.keys(m);
    if(!anahtarlar.length) return null;
    TUFE_ENDEKS = m;
    TUFE_SON_AY = anahtarlar.sort((a,b)=>{const [ay,am]=a.split('-').map(Number),[by,bm]=b.split('-').map(Number);return ay!==by?ay-by:am-bm;}).pop();
    return m;
  }catch(e){ return null; }
}
/* Bir tarihe karşılık gelen TÜFE endeks seviyesi (ay içi doğrusal ara değer).
   Son yayımlanan aydan sonrası için son değer kullanılır — TÜFE ~1 ay gecikmeli
   yayımlanır, bu yüzden en yeni günlerin reel getirisi bir miktar EKSİK ölçülür
   (yani gerçek reel getiri gösterilenden biraz daha düşüktür). Bu, gösterilenden
   iyimser değil karamsar tarafta hata demektir; kabul edilebilir yön.  */
function tufeSeviye(tarih){
  if(!TUFE_ENDEKS) return null;
  const d = (tarih instanceof Date) ? tarih : new Date(tarih);
  if(isNaN(d)) return null;
  const y = d.getFullYear(), m = d.getMonth()+1, gun = d.getDate();
  const gunSayisi = new Date(y, m, 0).getDate();
  const bu = TUFE_ENDEKS[y+'-'+m];
  const sonrakiY = m===12?y+1:y, sonrakiM = m===12?1:m+1;
  const sonraki = TUFE_ENDEKS[sonrakiY+'-'+sonrakiM];
  if(bu!=null && sonraki!=null) return bu + (sonraki-bu)*((gun-1)/gunSayisi);
  if(bu!=null) return bu;
  // İstenen ay yoksa en yakın ÖNCEKİ ayı bul (seri başı/sonu korumalı)
  let en=null, enF=null;
  Object.keys(TUFE_ENDEKS).forEach(k=>{
    const [ky,km]=k.split('-').map(Number);
    const f=ky*12+km;
    if(f<=y*12+m && (en==null||f>en)){ en=f; enF=TUFE_ENDEKS[k]; }
  });
  return enF;
}
/* nominal (%) + başlangıç tarihi → reel (%) */
function reelHesap(nominalYuzde, basTarih, bitTarih){
  if(nominalYuzde==null || !isFinite(nominalYuzde)) return null;
  const i0 = tufeSeviye(basTarih), i1 = tufeSeviye(bitTarih||new Date());
  if(!i0 || !i1 || i0<=0) return null;
  const enf = i1/i0 - 1;
  return ((1+nominalYuzde/100)/(1+enf) - 1)*100;
}
function enfDonem(basTarih, bitTarih){
  const i0 = tufeSeviye(basTarih), i1 = tufeSeviye(bitTarih||new Date());
  return (i0&&i1&&i0>0) ? (i1/i0-1)*100 : null;
}
const reelRozet = (v)=> v==null ? '<span class="sub">—</span>'
  : '<span class="'+(v>=0?'up':'down')+'" style="font-weight:600">'+(v>=0?'+':'−')+trN(Math.abs(v),1)+'%</span>';

/* ── MODÜL 3: RİSK BÜTÇESİ (tek-faktör ayrıştırma) ───────────────────────────
   MEVCUT HATA DÜZELTİLDİ: riskMetBody portföy volatilitesini AĞIRLIKLI ORTALAMA
   olarak hesaplıyordu. Bu matematiksel olarak yanlıştır — korelasyonu yok sayar
   ve çeşitlendirmenin faydasını görmez; portföy volü daima olduğundan YÜKSEK çıkar.
   Doğrusu tek-faktör (piyasa modeli) ayrıştırmasıdır:
       σ_i² = β_i²·σ_m² + σ_ε,i²           (sistematik + idiyosinkratik)
       σ_p² = β_p²·σ_m² + Σ w_i²·σ_ε,i²    (idiyosinkratik kısım çeşitlenir)
   Riske katkı (CTR), toplamı σ_p'ye eşit olan tek doğru "kim ne kadar risk
   taşıyor" ölçüsüdür — ağırlık değil, RİSK payıdır:
       Cov(r_i,r_p) = β_i·β_p·σ_m² + w_i·σ_ε,i²
       CTR_i = w_i·Cov(r_i,r_p)/σ_p ,  Σ CTR_i = σ_p
   σ_m (piyasa volü) elle girilir. ÜST SINIR VERİ İLE BAĞLI: risk.json'da
   min(σ_i/β_i) = %30,5 (ASELS) — bunun üstünde bir σ_m bazı hisselerde negatif
   idiyosinkratik varyans üretir; kart bunu yakalar ve uyarır. Varsayılan %26. */
const RB_VAR = {sigmaM:26, maxAgirlik:8, maxCtrPay:15, maxVol:35};
function rbOku(){
  try{ const s=JSON.parse(localStorage.getItem('rb_ayar_v1')||'null'); if(s) return Object.assign({},RB_VAR,s); }catch(e){}
  return Object.assign({},RB_VAR);
}
function rbYaz(a){ try{ localStorage.setItem('rb_ayar_v1', JSON.stringify(a)); }catch(e){} }

function riskButceHesap(){
  const A = rbOku();
  const hisseler = (typeof poz!=='undefined'?poz:[]).filter(p=>p.tip!=='nakit'&&p.kod);
  const nakit = (typeof poz!=='undefined'?poz:[]).filter(p=>p.tip==='nakit')
                 .reduce((s,p)=>s+(p.adet*p.fiyat||0),0);
  const canliF = (kod)=>(typeof CANLI_FIYAT!=='undefined'&&CANLI_FIYAT[kod])?CANLI_FIYAT[kod]
                 :((typeof MFIYAT!=='undefined'&&MFIYAT[kod])?MFIYAT[kod]:null);
  const kapsam = hisseler.filter(p=>typeof MRISK!=='undefined'&&MRISK[p.kod.toUpperCase()]);
  const disi   = hisseler.filter(p=>!(typeof MRISK!=='undefined'&&MRISK[p.kod.toUpperCase()])).map(p=>p.kod.toUpperCase());
  if(!kapsam.length) return {bos:true, disi, A};

  const sm = A.sigmaM/100;
  const deger = p=>p.adet*(canliF(p.kod.toUpperCase())||p.fiyat||0);
  const riskliToplam = kapsam.reduce((s,p)=>s+deger(p),0);
  const toplamVarlik = hisseler.reduce((s,p)=>s+deger(p),0) + nakit;
  if(!riskliToplam) return {bos:true, disi, A};

  let negatif = [];
  const kal = kapsam.map(p=>{
    const kod=p.kod.toUpperCase(), r=MRISK[kod];
    const w = deger(p)/riskliToplam;                 // risk sepeti içi ağırlık
    const wT = toplamVarlik ? deger(p)/toplamVarlik : 0;  // toplam varlık içi ağırlık
    const si = r.vol/100, be = r.beta;
    let idio2 = si*si - be*be*sm*sm;
    if(idio2 < 0){ negatif.push(kod); idio2 = 0; }   // σ_m fazla yüksek → kırp + uyar
    return {kod, w, wT, vol:r.vol, beta:be, idio2, deger:deger(p)};
  });

  const betaP = kal.reduce((s,x)=>s+x.w*x.beta, 0);
  const idioP2 = kal.reduce((s,x)=>s+x.w*x.w*x.idio2, 0);
  const sistematik2 = betaP*betaP*sm*sm;
  const volP = Math.sqrt(sistematik2 + idioP2)*100;              // yıllık %
  const volNaif = kal.reduce((s,x)=>s+x.w*x.vol, 0);             // eski (yanlış) yöntem
  const cesitKazanc = volNaif - volP;                            // çeşitlendirmenin ölçülen faydası

  // Riske katkı — toplamı volP'ye eşittir (kimlik testi aşağıda)
  const sp = volP/100;
  kal.forEach(x=>{
    const cov = x.beta*betaP*sm*sm + x.w*x.idio2;
    x.mctr = sp>0 ? cov/sp : 0;
    x.ctr  = x.w*x.mctr*100;                                     // yıllık puan
    x.ctrPay = volP>0 ? x.ctr/volP*100 : 0;                      // riskin yüzde kaçı
    x.sistPay = (x.beta*x.beta*sm*sm)/(x.vol/100*x.vol/100)*100; // hissenin kendi riskinin ne kadarı piyasa
  });
  kal.sort((a,b)=>b.ctr-a.ctr);

  // Ex-ante izleme hatası (XKTUM'a göre): β_p−1 sapması + idiyosinkratik
  const te = Math.sqrt((betaP-1)*(betaP-1)*sm*sm + idioP2)*100;

  // Bütçe ihlalleri
  const ihlal = [];
  kal.forEach(x=>{
    if(x.wT*100 > A.maxAgirlik)
      ihlal.push({kod:x.kod, tip:'ağırlık', deger:x.wT*100, tavan:A.maxAgirlik,
        not:'toplam varlığın %'+trN(x.wT*100,1)+'\u0027i — tavan %'+A.maxAgirlik});
    if(x.ctrPay > A.maxCtrPay)
      ihlal.push({kod:x.kod, tip:'risk katkısı', deger:x.ctrPay, tavan:A.maxCtrPay,
        not:'portföy riskinin %'+trN(x.ctrPay,1)+'\u0027ini tek başına taşıyor — tavan %'+A.maxCtrPay});
  });
  if(volP > A.maxVol)
    ihlal.push({kod:'PORTFÖY', tip:'volatilite', deger:volP, tavan:A.maxVol,
      not:'yıllık vol %'+trN(volP,1)+' — tavan %'+A.maxVol});

  return {bos:false, A, kal, betaP, volP, volNaif, cesitKazanc, te, ihlal, negatif, disi,
          riskliToplam, toplamVarlik, nakitOran: toplamVarlik?nakit/toplamVarlik*100:0,
          ctrToplam: kal.reduce((s,x)=>s+x.ctr,0)};
}

function riskButceRender(){
  const el=$('rbBody'); if(!el) return;
  const R = riskButceHesap();
  const A = R.A;
  const ayar='<div class="card" style="padding:8px 12px;margin-bottom:8px">'+
    '<div class="lbl">BÜTÇE PARAMETRELERİ</div>'+
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(126px,1fr));gap:8px;margin-top:6px">'+
    [['rbSigmaM','Piyasa volü σm (%)',A.sigmaM,'XKTUM yıllık · üst sınır 30,5'],
     ['rbMaxW','Max ağırlık (%)',A.maxAgirlik,'tek isim / toplam varlık'],
     ['rbMaxCtr','Max risk payı (%)',A.maxCtrPay,'tek ismin risk katkısı'],
     ['rbMaxVol','Max portföy volü (%)',A.maxVol,'yıllık']].map(([id,ad,v,ipucu])=>
      '<div><label class="arzLb" for="'+id+'" title="'+ipucu+'">'+ad+'</label>'+
      '<input class="arzIn" id="'+id+'" type="text" inputmode="decimal" value="'+v+'" style="text-align:right"></div>').join('')+
    '</div></div>';

  if(R.bos){ el.innerHTML=ayar+'<div class="sub">Risk bütçesi için risk.json kapsamında en az bir hisse pozisyonu gerekir.'+
    (R.disi&&R.disi.length?' Kapsam dışı: '+R.disi.join(', ')+'.':'')+'</div>'; rbBagla(); return; }

  const ihlalKutu = R.ihlal.length
   ? '<div class="card" style="padding:9px 12px;margin-bottom:8px;border-left:3px solid var(--down)">'+
     '<div class="lbl" style="color:var(--down)">BÜTÇE İHLALİ · '+R.ihlal.length+'</div>'+
     R.ihlal.map(i=>'<div style="font-size:11.5px;margin-top:4px"><b>'+i.kod+'</b> — '+i.not+'</div>').join('')+
     '</div>'
   : '<div class="card" style="padding:9px 12px;margin-bottom:8px;border-left:3px solid var(--mm2)">'+
     '<div class="lbl" style="color:var(--mm2)">BÜTÇE İÇİNDE</div>'+
     '<div class="sub" style="font-size:11px;margin-top:3px">Ağırlık, risk katkısı ve volatilite tavanlarının hepsi sağlanıyor.</div></div>';

  const ozet='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(118px,1fr));gap:8px;margin-bottom:10px">'+
    '<div class="card" style="padding:7px 11px"><div class="lbl">PORTFÖY VOLÜ</div><div class="val" style="font-size:16px">%'+trN(R.volP,1)+'</div><div class="sub">yıllık · tek-faktör</div></div>'+
    '<div class="card" style="padding:7px 11px"><div class="lbl">ÇEŞİTLENDİRME</div><div class="val up" style="font-size:16px">−'+trN(R.cesitKazanc,1)+' p</div><div class="sub">naif %'+trN(R.volNaif,1)+'\u0027ten</div></div>'+
    '<div class="card" style="padding:7px 11px"><div class="lbl">BETA (XKTUM)</div><div class="val" style="font-size:16px">'+trN(R.betaP,2)+'</div><div class="sub">'+(R.betaP>1.05?'agresif':R.betaP<0.9?'defansif':'nötr')+'</div></div>'+
    '<div class="card" style="padding:7px 11px"><div class="lbl">İZLEME HATASI</div><div class="val" style="font-size:16px">%'+trN(R.te,1)+'</div><div class="sub">ex-ante · yıllık</div></div>'+
    '<div class="card" style="padding:7px 11px"><div class="lbl">NAKİT</div><div class="val" style="font-size:16px">%'+trN(R.nakitOran,1)+'</div><div class="sub">toplam varlıkta</div></div>'+
    '</div>';

  const tablo='<div style="overflow-x:auto"><table class="arzTbl"><thead><tr>'+
    '<th style="width:78px">HİSSE</th><th>AĞIRLIK</th><th>VOL</th><th>BETA</th>'+
    '<th>RİSK KATKISI</th><th>RİSK PAYI</th><th>AĞ. vs RİSK</th><th>PİYASA RİSKİ</th></tr></thead><tbody>'+
    R.kal.map(x=>{
      const fark = x.ctrPay - x.w*100;      // riskin ağırlığından ne kadar sapması
      const asiri = x.ctrPay > A.maxCtrPay, agirAsiri = x.wT*100 > A.maxAgirlik;
      return '<tr>'+
      '<td style="font-weight:700'+(asiri||agirAsiri?';color:var(--down)':'')+'">'+x.kod+(asiri||agirAsiri?' ⚠':'')+'</td>'+
      '<td>'+trN(x.wT*100,1)+'%</td>'+
      '<td style="color:var(--muted)">'+trN(x.vol,1)+'%</td>'+
      '<td style="color:var(--muted)">'+trN(x.beta,2)+'</td>'+
      '<td style="font-weight:600">'+trN(x.ctr,2)+' p</td>'+
      '<td style="font-weight:700;color:'+(asiri?'var(--down)':'var(--mm2)')+'">'+trN(x.ctrPay,1)+'%</td>'+
      '<td style="color:'+(fark>3?'var(--down)':fark<-3?'var(--up)':'var(--muted)')+'">'+(fark>=0?'+':'−')+trN(Math.abs(fark),1)+' p</td>'+
      '<td style="color:var(--muted)">'+trN(Math.min(100,x.sistPay),0)+'%</td></tr>';
    }).join('')+
    '<tr style="border-top:2px solid var(--line2)"><td style="font-weight:700">TOPLAM</td><td></td><td></td>'+
    '<td style="font-weight:700">'+trN(R.betaP,2)+'</td>'+
    '<td style="font-weight:700">'+trN(R.ctrToplam,2)+' p</td>'+
    '<td style="font-weight:700">100,0%</td><td></td><td></td></tr>'+
    '</tbody></table></div>';

  const uyari = (R.negatif.length? '<div class="sub" style="color:var(--down);font-size:10.5px;margin-top:6px">σm=%'+A.sigmaM+
      ' şu hisselerde negatif idiyosinkratik varyans üretti ve sıfıra kırpıldı: '+R.negatif.join(', ')+
      '. Piyasa volü fazla yüksek girilmiş — %30,5 altına indir.</div>':'')+
    (R.disi.length? '<div class="sub" style="font-size:10.5px;margin-top:4px">Kapsam dışı (risk.json\u0027da yok, hesaba girmedi): '+R.disi.join(', ')+'</div>':'');

  el.innerHTML = ayar + ihlalKutu + ozet + tablo + uyari;
  rbBagla();
}
function rbBagla(){
  const m={rbSigmaM:'sigmaM',rbMaxW:'maxAgirlik',rbMaxCtr:'maxCtrPay',rbMaxVol:'maxVol'};
  Object.keys(m).forEach(id=>{const e=$(id); if(e&&!e.dataset.bagli){ e.dataset.bagli='1';
    e.addEventListener('change',()=>{ const A=rbOku(); const v=parseFloat(String(e.value).replace(',','.'));
      if(isFinite(v)&&v>0){ A[m[id]]=v; rbYaz(A); riskButceRender(); } });
  }});
}

/* ── MODÜL 2: TEZ KAPANIŞI ───────────────────────────────────────────────────
   Journal'ın yapısı iyiydi (tez · hedef · katalizör · TEZİ BOZACAKLAR) ama
   döngü kapanmıyordu: yazılan tezin tutup tutmadığı hiçbir yerde ölçülmüyordu.
   Bir yatırım günlüğünün tüm değeri geri dönüp bakmaktadır.
   Eklenen alanlar geriye dönük uyumludur: eski kayıtlarda yoklar → 'açık' sayılır. */
function jGuncelle(i, alan, deger){
  if(!jrnl[i]) return;
  jrnl[i][alan]=deger; saveJ(); jKarneRender(); if(typeof renderJ==='function') renderJ();
}
function jCanliFiyat(kod){
  const k=String(kod||'').toUpperCase();
  if(typeof CANLI_FIYAT!=='undefined'&&CANLI_FIYAT[k]) return CANLI_FIYAT[k];
  if(typeof MFIYAT!=='undefined'&&MFIYAT[k]) return MFIYAT[k];
  return null;
}
const jTarParse=(s)=>{ if(!s) return null;
  const m=String(s).match(/^(\d{1,2})[.\/](\d{1,2})[.\/](\d{4})$/); if(m) return new Date(+m[3],+m[2]-1,+m[1]);
  const d=new Date(s); return isNaN(d)?null:d; };

function jKarneRender(){
  const el=$('jKarne'); if(!el) return;
  if(!jrnl.length){ el.innerHTML='<div class="sub" style="font-size:11px">Tez yazıp kapattıkça isabet karnen burada birikir.</div>'; return; }
  const kapali = jrnl.filter(j=>j.durum==='kapali' && j.giris>0 && j.cikis>0);
  const acik   = jrnl.filter(j=>j.durum!=='kapali');
  let kart='';

  if(kapali.length){
    const get = kapali.map(j=>{
      const g=(j.cikis/j.giris-1)*100;
      const b=jTarParse(j.tarih), s=jTarParse(j.kapanisTarih);
      const omur=(b&&s)?Math.max(1,Math.round((s-b)/86400000)):null;
      const reel = (b&&s)? reelHesap(g, b, s) : null;
      return {kod:j.kod, g, omur, reel, bozan:!!j.bozan};
    });
    const isabet = get.filter(x=>x.g>0).length/get.length*100;
    const ortG   = get.reduce((s,x)=>s+x.g,0)/get.length;
    const ortR   = get.filter(x=>x.reel!=null);
    const ortReel= ortR.length? ortR.reduce((s,x)=>s+x.reel,0)/ortR.length : null;
    const omurler= get.filter(x=>x.omur!=null);
    const ortOmur= omurler.length? omurler.reduce((s,x)=>s+x.omur,0)/omurler.length : null;
    const kazanan= get.filter(x=>x.g>0), kaybeden= get.filter(x=>x.g<=0);
    const ortKaz = kazanan.length? kazanan.reduce((s,x)=>s+x.g,0)/kazanan.length : null;
    const ortKay = kaybeden.length? kaybeden.reduce((s,x)=>s+x.g,0)/kaybeden.length : null;
    const bozanOran = get.filter(x=>x.bozan).length/get.length*100;
    kart='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(112px,1fr));gap:8px">'+
      '<div class="card" style="padding:7px 11px"><div class="lbl">İSABET</div><div class="val '+(isabet>=50?'up':'down')+'" style="font-size:16px">%'+trN(isabet,0)+'</div><div class="sub">'+kapali.length+' kapalı tez</div></div>'+
      '<div class="card" style="padding:7px 11px"><div class="lbl">ORT. NOMİNAL</div><div class="val '+(ortG>=0?'up':'down')+'" style="font-size:16px">'+(ortG>=0?'+':'−')+trN(Math.abs(ortG),1)+'%</div><div class="sub">tez başına</div></div>'+
      '<div class="card" style="padding:7px 11px"><div class="lbl">ORT. REEL</div><div class="val" style="font-size:16px">'+(ortReel==null?'—':reelRozet(ortReel))+'</div><div class="sub">TÜFE arındırılmış</div></div>'+
      '<div class="card" style="padding:7px 11px"><div class="lbl">KAZANAN / KAYBEDEN</div><div class="val" style="font-size:14px"><span class="up">'+(ortKaz==null?'—':'+'+trN(ortKaz,0)+'%')+'</span> <span class="sub">/</span> <span class="down">'+(ortKay==null?'—':trN(ortKay,0)+'%')+'</span></div><div class="sub">ortalama büyüklük</div></div>'+
      '<div class="card" style="padding:7px 11px"><div class="lbl">ORT. ÖMÜR</div><div class="val" style="font-size:16px">'+(ortOmur==null?'—':trN(ortOmur,0)+' g')+'</div><div class="sub">açılış→kapanış</div></div>'+
      '<div class="card" style="padding:7px 11px"><div class="lbl">BOZAN GERÇEKLEŞTİ</div><div class="val" style="font-size:16px">%'+trN(bozanOran,0)+'</div><div class="sub">kapananların</div></div>'+
      '</div>'+
      '<div class="note" style="margin-top:8px;font-size:11px">Asıl soru isabet oranı değil, <em>kazananın kaybedene oranı</em>. %40 isabetle ortalama +%30 kazanıp −%10 kaybeden bir süreç, %70 isabetle +%5 kazanıp −%20 kaybedenden iyidir. "Bozan gerçekleşti" sütunu ise disiplini ölçer: tezini bozacağını önceden yazdığın şey olduğunda gerçekten sattın mı?</div>';
  } else {
    kart='<div class="sub" style="font-size:11px">Henüz kapatılmış tez yok. Bir tezi kapattığında isabet oranı, kazanan/kaybeden büyüklüğü ve reel getiri burada birikmeye başlar.</div>';
  }

  // Açık tezlerin canlı takibi
  let ac='';
  if(acik.length){
    ac='<div class="lbl" style="margin-top:12px">AÇIK TEZLER · CANLI</div><div style="overflow-x:auto;margin-top:5px"><table class="arzTbl"><thead><tr>'+
      '<th style="width:70px">KOD</th><th>GİRİŞ</th><th>GÜNCEL</th><th>NOMİNAL</th><th>REEL</th><th>HEDEF</th><th>MESAFE</th><th>YAŞ</th><th></th></tr></thead><tbody>'+
      acik.map((j)=>{
        const i=jrnl.indexOf(j);
        const gun=jCanliFiyat(j.kod), gir=+j.giris||null;
        const hed=parseFloat(String(j.hedef||'').replace(/[^\d,.-]/g,'').replace(',','.'))||null;
        const nom=(gun&&gir)?(gun/gir-1)*100:null;
        const b=jTarParse(j.tarih);
        const reel=(nom!=null&&b)?reelHesap(nom,b):null;
        const mes=(gun&&hed)?(hed/gun-1)*100:null;
        const yas=b?Math.max(0,Math.round((new Date()-b)/86400000)):null;
        return '<tr><td style="font-weight:700">'+esc(j.kod)+'</td>'+
        '<td>'+(gir?trN(gir,2):'<span class="sub">gir</span>')+'</td>'+
        '<td>'+(gun?trN(gun,2):'—')+'</td>'+
        '<td class="'+(nom==null?'':nom>=0?'up':'down')+'" style="font-weight:600">'+(nom==null?'—':(nom>=0?'+':'−')+trN(Math.abs(nom),1)+'%')+'</td>'+
        '<td>'+reelRozet(reel)+'</td>'+
        '<td style="color:var(--muted)">'+(hed?trN(hed,2):'—')+'</td>'+
        '<td style="color:var(--muted)">'+(mes==null?'—':(mes>=0?'+':'−')+trN(Math.abs(mes),1)+'%')+'</td>'+
        '<td style="color:var(--muted)">'+(yas==null?'—':yas+' g')+'</td>'+
        '<td style="white-space:nowrap"><button class="btn" data-jkapat="'+i+'" style="font-size:10px;padding:2px 7px">Kapat</button></td></tr>';
      }).join('')+'</tbody></table></div>'+
      '<div class="sub" style="font-size:10.5px;margin-top:4px">Giriş fiyatı boşsa tezi kapatırken sorulur. Güncel fiyat canlı akıştan gelir; kapsamda olmayan kodlarda boş kalır.</div>';
  }
  el.innerHTML=kart+ac;
  el.querySelectorAll('button[data-jkapat]').forEach(b=>b.addEventListener('click',()=>jKapat(+b.dataset.jkapat)));
}
function jKapat(i){
  const j=jrnl[i]; if(!j) return;
  let gir=+j.giris||null;
  if(!gir){ const v=prompt(j.kod+' — tezi açtığındaki GİRİŞ fiyatı (₺):',''); gir=parseFloat(String(v||'').replace(',','.')); if(!isFinite(gir)||gir<=0) return; }
  const oner=jCanliFiyat(j.kod);
  const cv=prompt(j.kod+' — ÇIKIŞ fiyatı (₺):', oner?String(oner):'');
  const cikis=parseFloat(String(cv||'').replace(',','.'));
  if(!isFinite(cikis)||cikis<=0) return;
  const bozan=confirm('Tezi bozacağını yazdığın gelişme GERÇEKLEŞTİ mi?\n\n"'+(j.boz||'(yazılmamış)')+'"\n\nTamam = evet gerçekleşti · İptal = hayır');
  const sonuc=prompt('Kapanış notu — ne öğrendin? (ops.)','')||'';
  j.durum='kapali'; j.giris=gir; j.cikis=cikis;
  j.kapanisTarih=new Date().toLocaleDateString('tr-TR'); j.bozan=bozan; j.sonuc=sonuc;
  saveJ(); jKarneRender(); if(typeof renderJ==='function') renderJ();
}
function jAc(i){ const j=jrnl[i]; if(!j) return; j.durum='acik'; delete j.cikis; delete j.kapanisTarih; saveJ(); jKarneRender(); if(typeof renderJ==='function') renderJ(); }

/* ── Reel getiri: atıf kartına ek satır ── */
function reelAtifRender(){
  const el=$('reelAtifBody'); if(!el) return;
  const hisseler=(typeof poz!=='undefined'?poz:[]).filter(p=>p.tip!=='nakit'&&p.kod);
  if(!TUFE_ENDEKS){ el.innerHTML='<div class="sub">TÜFE serisi yüklenemedi — reel getiri hesaplanamıyor.</div>'; return; }
  if(!hisseler.length){ el.innerHTML='<div class="sub">Pozisyon ekleyince nominal ve reel getiri yan yana görünür.</div>'; return; }
  const canliF=(kod)=>(typeof CANLI_FIYAT!=='undefined'&&CANLI_FIYAT[kod])?CANLI_FIYAT[kod]
                 :((typeof MFIYAT!=='undefined'&&MFIYAT[kod])?MFIYAT[kod]:null);
  const secim=($('reelPencere')&&$('reelPencere').value)||'ytd';
  const bugun=new Date();
  const varsayilanBas = secim==='ytd' ? new Date(bugun.getFullYear(),0,1)
    : secim==='1y' ? new Date(bugun.getFullYear()-1,bugun.getMonth(),bugun.getDate())
    : new Date(bugun.getFullYear(),bugun.getMonth()-3,bugun.getDate());
  let toplamMaliyet=0, toplamDeger=0, satir='';
  hisseler.forEach(p=>{
    const kod=p.kod.toUpperCase(), mal=p.maliyet||p.fiyat, gun=canliF(kod)||p.fiyat;
    if(!mal||!gun) return;
    const bas=jTarParse(p.tar)||varsayilanBas;
    const nom=(gun/mal-1)*100, reel=reelHesap(nom,bas), enf=enfDonem(bas);
    toplamMaliyet+=p.adet*mal; toplamDeger+=p.adet*gun;
    satir+='<tr><td style="font-weight:700">'+kod+'</td>'+
      '<td style="color:var(--muted);font-size:10px">'+(p.tar?esc(p.tar):'<span class="sub">tarihsiz</span>')+'</td>'+
      '<td class="'+(nom>=0?'up':'down')+'" style="font-weight:600">'+(nom>=0?'+':'−')+trN(Math.abs(nom),1)+'%</td>'+
      '<td style="color:var(--muted)">'+(enf==null?'—':trN(enf,1)+'%')+'</td>'+
      '<td>'+reelRozet(reel)+'</td></tr>';
  });
  const nomP=toplamMaliyet?(toplamDeger/toplamMaliyet-1)*100:null;
  const reelP=nomP!=null?reelHesap(nomP,varsayilanBas):null;
  const enfP=enfDonem(varsayilanBas);
  const pencereAd={ytd:'yılbaşından',1:'1 yıl',_3a:'3 ay'};
  el.innerHTML=
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(118px,1fr));gap:8px;margin-bottom:9px">'+
    '<div class="card" style="padding:7px 11px"><div class="lbl">NOMİNAL</div><div class="val '+(nomP>=0?'up':'down')+'" style="font-size:17px">'+(nomP==null?'—':(nomP>=0?'+':'−')+trN(Math.abs(nomP),1)+'%')+'</div><div class="sub">maliyete göre</div></div>'+
    '<div class="card" style="padding:7px 11px"><div class="lbl">TÜFE</div><div class="val" style="font-size:17px;color:var(--muted)">'+(enfP==null?'—':trN(enfP,1)+'%')+'</div><div class="sub">aynı pencerede</div></div>'+
    '<div class="card" style="padding:7px 11px"><div class="lbl">REEL</div><div class="val" style="font-size:17px">'+(reelP==null?'—':reelRozet(reelP))+'</div><div class="sub">satın alma gücü</div></div>'+
    '</div>'+
    '<div style="overflow-x:auto"><table class="arzTbl"><thead><tr><th style="width:76px">HİSSE</th><th style="text-align:left">ALIM TARİHİ</th><th>NOMİNAL</th><th>TÜFE</th><th>REEL</th></tr></thead><tbody>'+
    (satir||'<tr><td colspan="5" class="sub">Fiyatı çözülebilen pozisyon yok.</td></tr>')+'</tbody></table></div>'+
    '<div class="note" style="margin-top:8px;font-size:11px">Reel = (1+nominal)/(1+TÜFE) − 1 — çıkarma <em>değil</em>. %45 nominal ile %32 TÜFE arasındaki fark 13 puan değil <b>%9,8</b>\u0027dir; enflasyon yükseldikçe bu sapma büyür. Pozisyona alım tarihi girersen her hisse kendi penceresiyle deflate edilir; girmezsen yukarıdaki ortak pencere kullanılır. TÜFE ~1 ay gecikmeli yayımlandığı için son günler bir miktar <em>eksik</em> deflate olur — yani gerçek reel getirin gösterilenden biraz daha düşüktür.</div>';
}

function omurgaInit(){
  tufeYukle().then(()=>{ reelAtifRender(); jKarneRender(); });
  const s=$('reelPencere'); if(s) s.addEventListener('change',reelAtifRender);
  riskButceRender();
  jKarneRender();
}

/* ═══════════════════════════════════════════════════════════════════════════
   TEKNİK ANALİZ (§119) — TradingView Lightweight Charts (Apache 2.0) + kendi verimiz
   NEDEN WIDGET DEĞİL: TradingView'ın gömülü widget'ları BIST'i KAPSAMIYOR — resmî
   "available markets" listesinde Borsa İstanbul yok (Avrupa 25 borsa, MEA 5 borsa
   tarandı, 28 Tem). Lightweight Charts ise yalnız ÇİZİCİ; veriyi biz veriyoruz,
   dolayısıyla BIST sorunu ortadan kalkıyor. Ayrıca dışa bağımlılık kalmıyor:
   TradingView bir gün politikasını değiştirse gömülü widget ölürdü, bu ölmez.
   BEDELİ: göstergeleri biz hesaplıyoruz (aşağıda) ve çizim araçları yok.
   KAZANCI: göstergeler bizim olduğu için RİSK BÜTÇESİNE bağlanabiliyorlar —
   ATR'den pozisyon boyutu çıkarmak gömülü bir widget'ta imkânsızdı.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── GÖSTERGE MATEMATİĞİ ── saf fonksiyonlar, dışa bağımlılık yok, test edilebilir.
   Hepsi girdiyle aynı uzunlukta dizi döndürür; hesaplanamayan baş kısım null. */
function tkSMA(v, n){
  const o = new Array(v.length).fill(null); let s = 0;
  for(let i=0;i<v.length;i++){ s += v[i]; if(i>=n) s -= v[i-n]; if(i>=n-1) o[i] = s/n; }
  return o;
}
function tkEMA(v, n){
  const o = new Array(v.length).fill(null), k = 2/(n+1);
  let s = 0;
  for(let i=0;i<v.length;i++){
    if(i<n-1){ s += v[i]; continue; }
    if(i===n-1){ s += v[i]; o[i] = s/n; continue; }
    o[i] = v[i]*k + o[i-1]*(1-k);
  }
  return o;
}
/* RSI — WILDER yumuşatması (klasik tanım). Basit ortalamayla hesaplayan sürümler
   aynı seride 3-5 puan farklı sonuç verir; TradingView Wilder kullanır, biz de. */
function tkRSI(v, n){
  n = n || 14;
  const o = new Array(v.length).fill(null);
  if(v.length <= n) return o;
  let kaz = 0, kay = 0;
  for(let i=1;i<=n;i++){ const d = v[i]-v[i-1]; if(d>0) kaz += d; else kay -= d; }
  kaz /= n; kay /= n;
  o[n] = kay === 0 ? 100 : 100 - 100/(1 + kaz/kay);
  for(let i=n+1;i<v.length;i++){
    const d = v[i]-v[i-1];
    kaz = (kaz*(n-1) + (d>0? d:0))/n;
    kay = (kay*(n-1) + (d<0?-d:0))/n;
    o[i] = kay === 0 ? 100 : 100 - 100/(1 + kaz/kay);
  }
  return o;
}
function tkMACD(v, hf, yf, sg){
  hf=hf||12; yf=yf||26; sg=sg||9;
  const eh = tkEMA(v,hf), ey = tkEMA(v,yf);
  const macd = v.map((_,i)=> (eh[i]!=null && ey[i]!=null) ? eh[i]-ey[i] : null);
  const dolu = macd.filter(x=>x!=null);
  const sinyalDolu = tkEMA(dolu, sg);
  const bas = macd.findIndex(x=>x!=null);
  const sinyal = new Array(v.length).fill(null);
  if(bas>=0) sinyalDolu.forEach((x,i)=>{ if(x!=null) sinyal[bas+i] = x; });
  const hist = macd.map((m,i)=> (m!=null && sinyal[i]!=null) ? m-sinyal[i] : null);
  return {macd, sinyal, hist};
}
function tkBB(v, n, k){
  n=n||20; k=k||2;
  const orta = tkSMA(v,n), ust = new Array(v.length).fill(null), alt = new Array(v.length).fill(null);
  for(let i=n-1;i<v.length;i++){
    let s2 = 0; for(let j=i-n+1;j<=i;j++) s2 += Math.pow(v[j]-orta[i],2);
    const sd = Math.sqrt(s2/n);
    ust[i] = orta[i]+k*sd; alt[i] = orta[i]-k*sd;
  }
  return {orta, ust, alt};
}
/* ATR — Wilder. Gerçek aralık boşlukları (gap) hesaba katar; basit yüksek−düşük
   ortalaması gap'li günlerde oynaklığı olduğundan DÜŞÜK gösterir. */
function tkATR(bar, n){
  n = n || 14;
  const o = new Array(bar.length).fill(null);
  if(bar.length <= n) return o;
  const tr = bar.map((b,i)=> i===0 ? b.h-b.l
    : Math.max(b.h-b.l, Math.abs(b.h-bar[i-1].c), Math.abs(b.l-bar[i-1].c)));
  let a = 0; for(let i=1;i<=n;i++) a += tr[i];
  a /= n; o[n] = a;
  for(let i=n+1;i<bar.length;i++){ a = (a*(n-1)+tr[i])/n; o[i] = a; }
  return o;
}

/* ── ÇİZİM KATMANI (§120) ─────────────────────────────────────────────────────
   Lightweight Charts yalnız ÇİZİCİDİR; çizim araçları (trend çizgisi, Fibonacci)
   ücretli Advanced Charts kütüphanesinde. Elle trend çizgisini kendimiz ekliyoruz.
   YÖNTEM: iki tıklama iki çapa noktası verir; çizgi BAR İNDEKSİ uzayında doğrusal
   kurulur ve serinin SONUNA KADAR uzatılır (trend çizgisinin işi zaten geleceğe
   uzanmaktır). Zaman uzayında değil indeks uzayında kurulur — tatil/hafta sonu
   boşlukları çizgiyi eğmesin diye.
   KALICILIK: çizgiler hisse bazında localStorage'da; CLOUD_KEYS'e eklendiği için
   diğer cihazında da aynı çizgileri görürsün.

   AYRICA İKİ OTOMATİK KATMAN — elle çizimin öznelliğine karşı denge:
   · PİVOT SEVİYELERİ: k-bar salınım tepesi/dibi, yakın olanlar kümelenir. Yatay
     destek/direnç. Objektif; "ben oraya çizgi çekmek istedim" yanlılığı yok.
   · REGRESYON KANALI: son N barın en küçük kareler doğrusu ±2σ. Trendin
     matematiksel orta çizgisi — elle çizilen çizgi bundan çok saparsa, sapan
     muhtemelen çizgidir. */

const TK_CIZGI_KEY = 'tk_cizgi_v1';
function tkCizgiOku(){ try{ return JSON.parse(localStorage.getItem(TK_CIZGI_KEY)||'{}')||{}; }catch(e){ return {}; } }
function tkCizgiYaz(o){ try{ localStorage.setItem(TK_CIZGI_KEY, JSON.stringify(o)); }catch(e){} }
function tkCizgiler(kod){ const o=tkCizgiOku(); return o[kod]||[]; }

/* Bar indeksi uzayında iki çapadan çizgi üretir, sona kadar uzatır. */
function tkCizgiSerisi(bar, c){
  const i1 = bar.findIndex(b=>b.t===c.t1), i2 = bar.findIndex(b=>b.t===c.t2);
  if(i1<0 || i2<0 || i1===i2) return null;
  const [a,b2] = i1<i2 ? [i1,i2] : [i2,i1];
  const [pa,pb] = i1<i2 ? [c.p1,c.p2] : [c.p2,c.p1];
  const egim = (pb-pa)/(b2-a);
  const out = [];
  for(let i=a;i<bar.length;i++) out.push({time:bar[i].t, value:+(pa+egim*(i-a)).toFixed(4)});
  return out;
}

/* PİVOT: i barı, i±k penceresinin tepesi/dibi mi? Sonra yakın seviyeler kümelenir. */
function tkPivot(bar, k, tolYuzde){
  k = k||5; tolYuzde = tolYuzde||1.2;
  const tepe = [], dip = [];
  for(let i=k;i<bar.length-k;i++){
    let yT=true, yD=true;
    for(let j=i-k;j<=i+k;j++){
      if(j===i) continue;
      if(bar[j].h >= bar[i].h) yT=false;
      if(bar[j].l <= bar[i].l) yD=false;
    }
    if(yT) tepe.push(bar[i].h);
    if(yD) dip.push(bar[i].l);
  }
  const kumele = (arr)=>{
    const s = arr.slice().sort((x,y)=>x-y), grup=[];
    s.forEach(v=>{
      const g = grup[grup.length-1];
      if(g && Math.abs(v-g.ort)/g.ort*100 <= tolYuzde){ g.n++; g.top+=v; g.ort=g.top/g.n; }
      else grup.push({n:1, top:v, ort:v});
    });
    return grup.filter(g=>g.n>=2).sort((a,b)=>b.n-a.n).slice(0,3).map(g=>({seviye:g.ort, dokunus:g.n}));
  };
  return { direnc:kumele(tepe), destek:kumele(dip) };
}

/* REGRESYON KANALI: son n barın en küçük kareler doğrusu + ±k·σ */
function tkRegresyon(bar, n, k){
  n = Math.min(n||90, bar.length); k = k||2;
  const dil = bar.slice(-n), y = dil.map(b=>b.c);
  const N = y.length; if(N<10) return null;
  let sx=0, sy=0, sxy=0, sxx=0;
  for(let i=0;i<N;i++){ sx+=i; sy+=y[i]; sxy+=i*y[i]; sxx+=i*i; }
  const egim = (N*sxy - sx*sy)/(N*sxx - sx*sx);
  const kesim = (sy - egim*sx)/N;
  let s2=0; for(let i=0;i<N;i++) s2 += Math.pow(y[i]-(kesim+egim*i),2);
  const sd = Math.sqrt(s2/N);
  const bas = bar.length-N;
  const yap = (off)=>dil.map((b,i)=>({time:b.t, value:+(kesim+egim*i+off*sd).toFixed(4)}));
  return { orta:yap(0), ust:yap(k), alt:yap(-k), egim, sd, yillikEgim: egim*252/y[N-1]*100, bas };
}

/* ── ÇİZİM ETKİLEŞİMİ ── */
function tkCizimKur(chart, mumSeri){
  if(!chart.subscribeClick) return;
  chart.subscribeClick(param=>{
    if(!TK.cizim || !param || !param.time || !param.point) return;
    let fiyat = null;
    try{ fiyat = mumSeri.coordinateToPrice(param.point.y); }catch(e){}
    if(fiyat==null || !isFinite(fiyat)) return;
    const t = typeof param.time==='string' ? param.time
      : (param.time && param.time.year ? [param.time.year,String(param.time.month).padStart(2,'0'),String(param.time.day).padStart(2,'0')].join('-') : null);
    if(!t) return;
    if(!TK.capa){ TK.capa = {t, p:+fiyat.toFixed(4)}; tkCizimDurum('İkinci noktaya tıkla…'); return; }
    const o = tkCizgiOku(); const liste = o[TK.kod] || (o[TK.kod]=[]);
    liste.push({id:Date.now(), t1:TK.capa.t, p1:TK.capa.p, t2:t, p2:+fiyat.toFixed(4)});
    tkCizgiYaz(o); TK.capa=null; TK.cizim=false;
    tkCizimDurum(''); tkCiz();
  });
}
function tkCizimDurum(m){
  const b=$('tkCizimBtn'); if(b){ b.textContent = TK.cizim ? (m||'İlk noktaya tıkla…') : '✎ Trend çizgisi'; b.style.background = TK.cizim ? 'var(--down)' : ''; }
  const k=$('tkChart'); if(k) k.style.cursor = TK.cizim ? 'crosshair' : '';
}
function tkCizgiListe(){
  const el=$('tkCizgiListe'); if(!el) return;
  const l = tkCizgiler(TK.kod);
  el.innerHTML = l.length
    ? '<span class="sub" style="font-size:10px">Çizgiler: </span>'+l.map(c=>
        '<span style="font-size:10px;padding:2px 7px;border:1px solid var(--line2);border-radius:99px;margin-right:4px">'+
        c.t1.slice(5)+'→'+c.t2.slice(5)+' <b data-tksil="'+c.id+'" style="cursor:pointer;color:var(--down)">✕</b></span>').join('')
    : '';
  el.querySelectorAll('b[data-tksil]').forEach(b=>b.addEventListener('click',()=>{
    const o=tkCizgiOku(); o[TK.kod]=(o[TK.kod]||[]).filter(x=>String(x.id)!==b.dataset.tksil);
    tkCizgiYaz(o); tkCiz();
  }));
}

/* ── DURUM ── */
let TK = {bar:null, kod:null, chart:null, seri:{}, altGosterge:'rsi', kutuphane:false};

/* Lightweight Charts'ı CDN'den yükle. SÜRÜM SABİTLENDİ (5.2.0): sabitlenmemiş
   CDN sessiz kırılma kaynağıdır — kütüphane majör sürüm atlayınca API değişir
   ve ekran bir sabah boş açılır. §115'in dersi burada da geçerli. */
function tkKutuphane(){
  if(window.LightweightCharts) return Promise.resolve(true);
  if(TK.yukleniyor) return TK.yukleniyor;
  TK.yukleniyor = new Promise(coz=>{
    const s = document.createElement('script');
    /* §313: kütüphane unpkg CDN'inden EVE alındı (/lib/). Gerekçe: üçüncü taraf
       CDN tek hata noktasıydı (Yahoo dersinin kardeşi) ve Edge Tracking
       Prevention her açılışta 4 uyarı basıyordu. Dosya npm'den birebir indirildi
       (lightweight-charts@5.2.0, 196KB), kendi alan adından sunulur. */
    s.src = '/lib/lightweight-charts.standalone.production.js?v=520';
    /* SS313b SIGORTA (18 Agu aksami olculdu): lib/ dosyasi repoya girmeden
       app.js f yayina cikti -> yerel yol 404 -> LightweightCharts undefined
       -> Getiri Egrisi dahil tum chart kartlari sessizce bos kaldi.
       Yerel BIRINCIL kalir; yalniz yerel yuklenemezse unpkg yedegine dusulur
       ve konsola yazilir - deploy sirasi sigortasi. */
    s.onerror = function(){
      console.warn('[KTPanel] SS313b: /lib/ yerel kutuphane yuklenemedi - unpkg yedegine dusuluyor');
      const y = document.createElement('script');
      y.src = 'https://unpkg.com/lightweight-charts@5.2.0/dist/lightweight-charts.standalone.production.js';
      y.onload = s.onload;
      y.onerror = function(){ console.error('[KTPanel] SS313b: yedek de yuklenemedi - chart kartlari bos kalacak'); };
      document.head.appendChild(y);
    };
    s.onload = ()=>coz(true);
    s.onerror = ()=>coz(false);
    document.head.appendChild(s);
  });
  return TK.yukleniyor;
}

/* v5 API: chart.addSeries(SeriesType, opts, paneIndex). v4: chart.addXxxSeries(opts).
   Sürüm sabitli ama yine de iki yolu da destekliyoruz — CDN'den beklenmedik bir
   sürüm gelirse ekran boş kalmasın, çalışsın. */
function tkSeriEkle(chart, tip, opt, pane){
  const LC = window.LightweightCharts;
  if(typeof chart.addSeries === 'function' && LC[tip]) return chart.addSeries(LC[tip], opt, pane);
  const eski = {CandlestickSeries:'addCandlestickSeries', LineSeries:'addLineSeries',
                HistogramSeries:'addHistogramSeries', AreaSeries:'addAreaSeries'}[tip];
  return chart[eski](opt);
}

async function tkVeriGetir(kod){
  const r = await fetch('/api/market?mod=seri&kod='+encodeURIComponent(kod)+'&gun=400', {cache:'no-store'});
  const d = await r.json();
  if(!d.ok) throw new Error(d.err || 'veri alınamadı');
  return d;
}

function tkCiz(){
  const kut = $('tkChart'); if(!kut || !TK.bar) return;
  const LC = window.LightweightCharts; if(!LC) return;
  kut.innerHTML = '';
  const koyu = false;
  const chart = LC.createChart(kut, {
    layout:{ background:{color:'transparent'}, textColor:'#63756C',
             attributionLogo:true,          // ← Apache 2.0 atıf koşulu bununla karşılanır
             fontFamily:"'IBM Plex Mono',monospace", fontSize:10 },
    grid:{ vertLines:{color:'#E2EBE6'}, horzLines:{color:'#E2EBE6'} },
    rightPriceScale:{ borderColor:'#C8D8D0' },
    timeScale:{ borderColor:'#C8D8D0', timeVisible:false },
    crosshair:{ mode:0 },
    height: 420
  });
  TK.chart = chart;
  const bar = TK.bar, kap = bar.map(b=>b.c);

  const mum = tkSeriEkle(chart,'CandlestickSeries',{
    upColor:'#0FA26B', downColor:'#DE4B5E', borderUpColor:'#0FA26B',
    borderDownColor:'#DE4B5E', wickUpColor:'#0FA26B', wickDownColor:'#DE4B5E'},0);
  mum.setData(bar.map(b=>({time:b.t, open:b.o, high:b.h, low:b.l, close:b.c})));

  const cizgi=(dizi,renk,kalin)=>{
    const s = tkSeriEkle(chart,'LineSeries',{color:renk, lineWidth:kalin||1,
      priceLineVisible:false, lastValueVisible:false, crosshairMarkerVisible:false},0);
    s.setData(bar.map((b,i)=>({time:b.t, value:dizi[i]})).filter(x=>x.value!=null));
    return s;
  };
  const s20=tkSMA(kap,20), s50=tkSMA(kap,50), s200=tkSMA(kap,200), bb=tkBB(kap,20,2);
  if($('tkBB') && $('tkBB').checked){ cizgi(bb.ust,'#C8D8D0'); cizgi(bb.alt,'#C8D8D0'); }
  if($('tkMA') && $('tkMA').checked){ cizgi(s20,'#3D7BD9'); cizgi(s50,'#E8933B'); cizgi(s200,'#8B6FD8',2); }

  // Alt panel: RSI ya da MACD (v5 pane desteği; yoksa atlanır)
  const altVar = typeof chart.addPane === 'function' || typeof chart.addSeries === 'function';
  if(altVar){
    try{
      if(TK.altGosterge==='rsi'){
        const r = tkRSI(kap,14);
        const s = tkSeriEkle(chart,'LineSeries',{color:'#128A66', lineWidth:1, priceLineVisible:false},1);
        s.setData(bar.map((b,i)=>({time:b.t, value:r[i]})).filter(x=>x.value!=null));
        [30,70].forEach(y=>{ const l=tkSeriEkle(chart,'LineSeries',
          {color:'#C8D8D0', lineWidth:1, lineStyle:2, priceLineVisible:false, lastValueVisible:false},1);
          l.setData(bar.map(b=>({time:b.t, value:y}))); });
      } else {
        const m = tkMACD(kap);
        const h = tkSeriEkle(chart,'HistogramSeries',{priceLineVisible:false},1);
        h.setData(bar.map((b,i)=>({time:b.t, value:m.hist[i],
          color:(m.hist[i]>=0?'rgba(15,162,107,.55)':'rgba(222,75,94,.55)')})).filter(x=>x.value!=null));
        const l1=tkSeriEkle(chart,'LineSeries',{color:'#128A66',lineWidth:1,priceLineVisible:false},1);
        l1.setData(bar.map((b,i)=>({time:b.t, value:m.macd[i]})).filter(x=>x.value!=null));
        const l2=tkSeriEkle(chart,'LineSeries',{color:'#E8933B',lineWidth:1,priceLineVisible:false},1);
        l2.setData(bar.map((b,i)=>({time:b.t, value:m.sinyal[i]})).filter(x=>x.value!=null));
      }
      if(chart.panes && chart.panes()[1]) chart.panes()[1].setHeight(110);
    }catch(e){ console.warn('[KTPanel] teknik alt panel çizilemedi:', (e&&e.message)||e); }
  }
  // §120 ÇİZİM KATMANI
  try{
    // Elle trend çizgileri
    tkCizgiler(TK.kod).forEach(c=>{
      const d = tkCizgiSerisi(bar, c); if(!d) return;
      const s = tkSeriEkle(chart,'LineSeries',{color:'#8B6FD8', lineWidth:2,
        priceLineVisible:false, lastValueVisible:false, crosshairMarkerVisible:false},0);
      s.setData(d);
    });
    // Pivot destek/direnç — yatay çizgiler (createPriceLine yerleşik)
    if($('tkPivot') && $('tkPivot').checked){
      const pv = tkPivot(bar, 5, 1.2);
      pv.direnc.forEach(x=>mum.createPriceLine({price:x.seviye, color:'#DE4B5E', lineWidth:1,
        lineStyle:2, axisLabelVisible:true, title:'D'+x.dokunus}));
      pv.destek.forEach(x=>mum.createPriceLine({price:x.seviye, color:'#0FA26B', lineWidth:1,
        lineStyle:2, axisLabelVisible:true, title:'S'+x.dokunus}));
    }
    // Regresyon kanalı
    if($('tkKanal') && $('tkKanal').checked){
      const rg = tkRegresyon(bar, 90, 2);
      if(rg){
        [[rg.orta,'#128A66',1],[rg.ust,'#C8D8D0',1],[rg.alt,'#C8D8D0',1]].forEach(([d,renk,w])=>{
          const s = tkSeriEkle(chart,'LineSeries',{color:renk, lineWidth:w, lineStyle:d===rg.orta?0:2,
            priceLineVisible:false, lastValueVisible:false, crosshairMarkerVisible:false},0);
          s.setData(d);
        });
        TK.kanal = rg;
      }
    } else TK.kanal = null;
    tkCizimKur(chart, mum);
    tkCizgiListe();
  }catch(e){ console.warn('[KTPanel] çizim katmanı:', (e&&e.message)||e); }
  chart.timeScale().fitContent();
  new ResizeObserver(()=>{ try{ chart.applyOptions({width:kut.clientWidth}); }catch(e){} }).observe(kut);
  tkOzet();
}

/* ── OKUMA KARTI ── rakamı gösterip bırakmıyor, NE ANLAMA GELDİĞİNİ yazıyor.
   ATR → POZİSYON BOYUTU: bu ekranın panel için asıl değeri burada. Gömülü bir
   widget'ta bu bağ kurulamazdı; gösterge bizim olduğu için risk bütçesine bağlanır. */
function tkOzet(){
  const el = $('tkOzet'); if(!el || !TK.bar) return;
  const bar = TK.bar, kap = bar.map(b=>b.c), n = bar.length-1;
  const son = kap[n];
  const rsi = tkRSI(kap,14)[n], atr = tkATR(bar,14)[n];
  const s20=tkSMA(kap,20)[n], s50=tkSMA(kap,50)[n], s200=tkSMA(kap,200)[n];
  const bb = tkBB(kap,20,2), mac = tkMACD(kap);
  const y52 = Math.max.apply(null, bar.slice(-252).map(b=>b.h));
  const d52 = Math.min.apply(null, bar.slice(-252).map(b=>b.l));
  const konum = (y52>d52) ? (son-d52)/(y52-d52)*100 : null;
  const atrY = atr!=null ? atr/son*100 : null;

  // Risk bütçesindeki tek-isim tavanına göre ATR-uyumlu azami ağırlık
  let A = {maxAgirlik:8}; try{ A = Object.assign(A, JSON.parse(localStorage.getItem('rb_ayar_v1')||'{}')); }catch(e){}
  const rej = (s50!=null && s200!=null) ? (s50>s200 ? 'YUKARI' : 'AŞAĞI') : null;
  const F=(v,d)=>v==null?'—':trN(v,d==null?2:d);
  const kut=(lbl,val,alt,renk)=>'<div class="card" style="padding:7px 11px"><div class="lbl">'+lbl+
    '</div><div class="val" style="font-size:15px'+(renk?';color:'+renk:'')+'">'+val+'</div><div class="sub">'+alt+'</div></div>';

  el.innerHTML = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(116px,1fr));gap:8px;margin-bottom:9px">'+
    kut('SON', F(son), TK.kod, null)+
    kut('RSI (14)', F(rsi,1), rsi>70?'aşırı alım':rsi<30?'aşırı satım':'nötr bant',
        rsi>70?'var(--down)':rsi<30?'var(--up)':null)+
    kut('REJİM', rej||'—', s50!=null&&s200!=null?'50g '+(s50>s200?'>':'<')+' 200g':'yetersiz veri',
        rej==='YUKARI'?'var(--up)':rej==='AŞAĞI'?'var(--down)':null)+
    kut('52H BANDI', konum==null?'—':'%'+F(konum,0), 'dip '+F(d52)+' · zirve '+F(y52), null)+
    kut('ATR (14)', F(atr), atrY==null?'':'günlük %'+F(atrY,1)+' oynaklık', null)+
    '</div>'+
    '<div class="note" style="margin-top:2px">'+
    (rej ? '<b>Rejim:</b> 50 günlük ortalama 200 günlüğün '+(rej==='YUKARI'?'ÜSTÜNDE':'ALTINDA')+
      ' — trend '+(rej==='YUKARI'?'yukarı':'aşağı')+'. ' : '')+
    (rsi!=null ? '<b>RSI '+F(rsi,1)+':</b> '+(rsi>70?'aşırı alım bölgesi; yeni alım için kötü bir an olabilir, mevcut pozisyon için satış sinyali değil. '
      : rsi<30?'aşırı satım; düşen bıçak riski var, rejimle birlikte okunmalı. ' : 'nötr banttaysa RSI tek başına bilgi taşımaz. ') : '')+
    (TK.kanal ? '<b>Regresyon kanalı (90g):</b> orta çizgi yıllık %'+F(TK.kanal.yillikEgim,0)+
      ' eğimle '+(TK.kanal.egim>0?'yukarı':'aşağı')+'; fiyat kanalın '+
      (son>TK.kanal.ust[TK.kanal.ust.length-1].value?'<em>ÜSTÜNDE</em> (2σ aşılmış)':
       son<TK.kanal.alt[TK.kanal.alt.length-1].value?'<em>ALTINDA</em> (2σ aşılmış)':'içinde')+'. ' : '')+
    (atrY!=null ? '<b>ATR → pozisyon boyutu:</b> günlük ortalama hareket %'+F(atrY,1)+
      '. Risk bütçendeki tek-isim ağırlık tavanı %'+A.maxAgirlik+'; bu oynaklıkta '+
      (atrY>4 ? 'tavanın <em>altında</em> kalmak gerekir — yüksek ATR aynı ağırlıkta daha çok risk taşır.'
              : atrY<2 ? 'tavana kadar çıkmak makul; oynaklık düşük.'
              : 'tavana yakın ağırlık taşınabilir.') : '')+
    '</div>'+
    '<div class="sub" style="font-size:10px;margin-top:6px">'+TK.bar.length+' işlem günü · '+
    bar[0].t+' → '+bar[n].t+(TK.atlanan?' · '+TK.atlanan+' tatil barı süzüldü':'')+
    ' · göstergeler panelde hesaplanır (Wilder yumuşatması) · grafik: TradingView Lightweight Charts™</div>';
}

async function tkYukle(kod){
  const durum = $('tkDurum'); if(durum) durum.textContent = kod+' yükleniyor…';
  try{
    const ok = await tkKutuphane();
    if(!ok) throw new Error('grafik kütüphanesi yüklenemedi (CDN engelli olabilir)');
    const d = await tkVeriGetir(kod);
    TK.bar = d.bar; TK.kod = d.kod; TK.atlanan = d.atlananTatilBari;
    if(durum) durum.textContent = '';
    tkCiz();
  }catch(e){
    if(durum) durum.innerHTML = '<span style="color:var(--down)">'+esc(String(e.message||e))+'</span>';
    const k=$('tkChart'); if(k) k.innerHTML='';
    const o=$('tkOzet'); if(o) o.innerHTML='';
  }
}

function teknikInit(){
  if(!$('tkChart')) return;
  const sec = $('tkKod');
  if(sec && !sec.dataset.dolu){
    sec.dataset.dolu = '1';
    // Evren: portföy + Top-40 (tekrarsız, portföy önce)
    const p = []; try{ (JSON.parse(localStorage.getItem('poz_v1')||'[]')||[])
      .forEach(x=>{ if(x&&x.kod&&x.tip==='hisse') p.push(String(x.kod).toUpperCase()); }); }catch(e){}
    const t = (typeof TOP40!=='undefined'?TOP40:[]).map(x=>String(x).toUpperCase());
    const hepsi = [...new Set(p.concat(t))];
    sec.innerHTML = hepsi.map(k=>'<option value="'+k+'"'+(p.includes(k)?' data-p="1"':'')+'>'+k+
      (p.includes(k)?' ●':'')+'</option>').join('');
    sec.addEventListener('change', ()=>tkYukle(sec.value));
  }
  ['tkMA','tkBB','tkPivot','tkKanal'].forEach(id=>{ const e=$(id); if(e&&!e.dataset.b){ e.dataset.b='1';
    e.addEventListener('change', ()=>{ if(TK.bar) tkCiz(); }); } });
  const g=$('tkAlt'); if(g&&!g.dataset.b){ g.dataset.b='1';
    g.addEventListener('change', ()=>{ TK.altGosterge=g.value; if(TK.bar) tkCiz(); }); }
  const cb=$('tkCizimBtn'); if(cb&&!cb.dataset.b){ cb.dataset.b='1';
    cb.addEventListener('click', ()=>{ TK.cizim=!TK.cizim; TK.capa=null; tkCizimDurum(''); }); }
  const tb=$('tkTemizle'); if(tb&&!tb.dataset.b){ tb.dataset.b='1';
    tb.addEventListener('click', ()=>{ if(!TK.kod) return;
      if(!confirm(TK.kod+' üzerindeki tüm trend çizgileri silinsin mi?')) return;
      const o=tkCizgiOku(); delete o[TK.kod]; tkCizgiYaz(o); tkCiz(); }); }
  const el=$('tkEl'), eb=$('tkElBtn');
  if(eb&&!eb.dataset.b){ eb.dataset.b='1';
    eb.addEventListener('click', ()=>{ const v=(el&&el.value||'').trim().toUpperCase();
      if(v) tkYukle(v); }); }
  if(sec && sec.options.length && !TK.bar) tkYukle(sec.value);
}

/* ═══════════════════════════════════════════════════════════════════════════
   TAHMİNLER (§122) — panelin ilk İLERİYE BAKAN katmanı
   Bugüne kadar her şey gerçekleşmiş veriydi. Tahmin ise tanımı gereği varsayım.
   TEK KURAL: ARİTMETİĞİ VARSAYIMDAN AYIR. Ekranda hangi sayının KİMLİK hangisinin
   VARSAYIM olduğu görünür, varsayım kullanıcı tarafından değiştirilebilir, ve
   tahmin asla veri gibi sunulmaz. Bu, panelin "ölçtüm, tahmin etmedim" ilkesini
   bozmadan ileriye bakmanın tek dürüst yolu.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── EX-ANTE REEL FAİZ — TEK SAHİP (§127) ────────────────────────────────────
   BULGU: panelde İKİ farklı "reel faiz" vardı ve birbirini tutmuyordu.
     · Tahminler 01 : (1+politika)/(1+PKA 12A beklenti) − 1 = %10,5  → CANLI, formül kayıtlı
     · Carry kartı  : yabanci.json → carry.reel_faiz = 7,9           → DAMGALI, formül YOK
   İkincisi ELLE YAZILMIŞ. Yeniden üretilemiyor: %7,9 için ya %27,0 (Fisher) ya
   %29,1 (basit çıkarma) enflasyon gerekir; ikisi de panelde akan hiçbir seriye
   denk gelmiyor (PKA %24,0, gerçekleşen TÜFE ~%32).
   §112 KURALI: aynı büyüklüğün iki sahibi olmaz — biri SAHİP, diğeri hizalanır.
   SAHİP burasıdır. Carry kartı bu değeri OKUR, kendi sayısını taşımaz.
   Canlı hesap kurulamazsa damgalıya düşer ve kartta "damgalı" yazar. */
window.EXANTE = {deger:null, canli:false, politika:null, beklenti:null};
/* ── REEL FAİZ: TEK KAYNAK (§129) ─────────────────────────────────────────────
   Panelde reel faiz ÜÇ ayrı yerde hesaplanıyordu ve ikisi farklı formül
   kullanıyordu (§128). Artık tek fonksiyon; her tüketici buradan okur.
   İKİ AYRI BÜYÜKLÜK, karıştırılmamalı:
     EX-ANTE = (1+politika)/(1+BEKLENEN enflasyon)−1  → TCMB'nin çıpası
     EX-POST = (1+AOFM)/(1+GERÇEKLEŞEN TÜFE)−1        → fiilen kazanılan
   İkisi de FISHER ile hesaplanır; basit çıkarma %32 enflasyonda 1,9 puan şişirir.
   HİÇBİR YOLDA NaN DÖNMEZ — hesaplanamayan alan null kalır, çağıran taraf
   Number.isFinite ile kontrol eder. (isFinite(null)===true olduğu için
   Number.isFinite kullanılır; §127'de yakalanan tuzak.) */
/* §304 TEK SAHİP DEĞİŞKENLER: canlı makro değerlerin sahibi EVDS çekimidir;
   çekim hem DOM'a yazar hem bu değişkenlere koyar. TÜKETİCİLER (reelFaizler,
   taktikRender) eskiden DOM metnini regex'le GERİ KAZIYORDU — render biçimi
   değişse hesap sessizce bozulurdu (§89 "undefined tablo" vakasının kuzeni).
   Artık değişkenden okurlar; kabul testi: DOM metni elle bozulsa da hesaplar
   DEĞİŞMEZ. Tanım bilinçli olarak ilk tüketiciden ÖNCE (let+TDZ güvenliği). */
let TUFE_YILLIK=null, AOFM_SON=null, REK_SON=null;

function reelFaizler(){
  /* §304: DOM kazıma kaldırıldı — değerler tek sahipten (EVDS çekimi → değişken) */
  const fisher=(nom,enf)=> (Number.isFinite(nom)&&Number.isFinite(enf))
    ? +(((1+nom/100)/(1+enf/100)-1)*100).toFixed(2) : null;

  const X = (typeof window!=='undefined') ? window.EXANTE : null;
  const exante = (X && X.canli && Number.isFinite(X.deger)) ? X.deger : null;
  const aofm = Number.isFinite(AOFM_SON)?AOFM_SON:null, tufe = Number.isFinite(TUFE_YILLIK)?TUFE_YILLIK:null;
  const expost = fisher(aofm, tufe);
  return {exante, expost, aofm, tufe,
          politika: X?X.politika:null, beklenti: X?X.beklenti:null,
          kaynak: exante!=null ? 'canlı' : (expost!=null ? 'kısmi' : 'yok')};
}

/* Kart satırını üretir. İkisini de gösterir; biri yoksa diğeri tek başına çıkar
   ve eksik olan "—" olarak İŞARETLENİR (sessizce gizlenmez). */
function reelFaizSatiri(RF){
  const R = RF || reelFaizler();
  const p = (v,renk)=> Number.isFinite(v)
    ? '<b class="'+(v>0?'up':'down')+'">'+(v>0?'+':'')+'%'+trN(v,1)+'</b>'
    : '<span class="thin">—</span>';
  const ipucu = Number.isFinite(R.exante)&&Number.isFinite(R.expost)
    ? ' <span class="thin" style="font-size:9px">· açıklık '+trN(R.exante-R.expost,1)+'p = fiyatlanan dezenflasyon</span>'
    : (R.exante==null ? ' <span class="thin" style="font-size:9px;color:var(--down)">· ex-ante için Tahminler sekmesini aç</span>' : '');
  return '<span style="font-size:11px">ex-ante '+p(R.exante)+
         ' <span class="thin">·</span> ex-post '+p(R.expost)+ipucu+'</span>';
}

function exAnteHesapla(politika, beklenti){
  // §127 KORUMA: isFinite(null) JavaScript'te TRUE döner (Number(null)===0), yani
  // null korumaı geçer ve çöp üretir — (null,24) → %−19,35 gibi. Number.isFinite
  // tip dönüşümü YAPMAZ; null, undefined ve string'i reddeder. Testte yakalandı.
  if(!Number.isFinite(politika)||!Number.isFinite(beklenti)) return null;
  const r = ((1+politika/100)/(1+beklenti/100)-1)*100;
  window.EXANTE = {deger:+r.toFixed(2), canli:true, politika, beklenti};
  /* §284 MERKEZ BANKALARI kartındaki satır da BU kaynaktan. Orada "≈ %13"
     SABİT yazılıydı ve bu hesapla çelişiyordu — aynı ekranda iki farklı
     reel faiz. §129'un tek-kaynak kuralı oraya uygulanmamıştı. */
  try{
    const el=document.getElementById('mbExAnte');
    if(el) el.textContent='≈ %'+trN(window.EXANTE.deger,1);
    /* §284c 12 ay beklentisi de aynı sabitten — iki yerde yaşamasın. */
    const b12=document.getElementById('mbBek12');
    if(b12 && isFinite(beklenti)) b12.textContent='%'+trN(beklenti,2);
  }catch(e){}
  // carry kartı zaten çizildiyse tazele — sıra bağımlılığı olmasın
  try{ if(typeof yabCarryTazele==='function') yabCarryTazele(); }catch(e){}
  return window.EXANTE.deger;
}
/* Carry kartındaki satırı SAHİP değerle günceller. Ayrı bir fonksiyon çünkü
   yabancı kartı ile Tahminler farklı zamanlarda yükleniyor (biri boot, diğeri
   alt sekme açılınca) — hangisi önce biterse bitsin sonuç aynı olmalı. */
function yabCarryTazele(){
  // §138 REGRESYON DÜZELTMESİ: bu fonksiyon yalnız SATIRI güncelliyordu, SKORU değil.
  // Boot sırası: yabanciInit (skoru hesaplar) ... loadAOFM (aofmLive/tufeLive'ı DOM'a yazar).
  // Skor hesaplanırken ex-ante de ex-post da HENÜZ YOKTU → carry bileşeni nötr (50)
  // alınıyor ve bir daha güncellenmiyordu. Skor kalıcı olarak eksik veriyle donuyordu.
  // ÖLÇÜM: damgalı 7,9 ile skor 56 · nötr bileşenle 46 — 10 puanlık sessiz kayma.
  // ÇÖZÜM: satırı değil TÜM KARTI yeniden çiz. yabanciRender() zaten satırı da üretir.
  // DÖNGÜ YOK: yabanciRender bu fonksiyonu çağırmaz, tek yönlü.
  if(typeof YABANCI!=='undefined' && YABANCI && $('yabanciBody')){
    try{ yabanciRender(); return; }catch(e){}
  }
  const e=$('yabCarryVal'); if(!e) return;              // kart henüz çizilmediyse yalnız satır
  e.innerHTML=reelFaizSatiri(reelFaizler());
  e.title='EX-ANTE: (1+politika)/(1+PKA 12A beklenti)−1 · EX-POST: (1+AOFM)/(1+TÜFE)−1 · ikisi de Fisher (§128)';
}

/* ── POLİTİKA FAİZİ: CANLI ────────────────────────────────────────────────────
   ÖNCE: app.js'te OKU_POLITIKA=37 diye GÖMÜLÜ SABİT vardı. DAMGA altın kural 3
   ihlali: canlı kartın içinde elle yazılmış rakam. Bir sonraki PPK'da bayatlar
   ve tüm faiz patikası yanlış tabandan başlar.
   EVDS seri kodu doğrulanamadığı için ADAY ZİNCİRİ (§115 deseni): birkaç yol
   sırayla denenir, MAKUL değer döneni kazanır, hangisinin tuttuğu RAPORLANIR.
   Hiçbiri tutmazsa damgalıya düşer ve bunu EKRANDA YAZAR — sessizce eski değeri
   göstermez.
   KEŞİF: kod bulunamıyorsa tarayıcıda /api/evds2?ara=politika faizi çalıştırıp
   dönen seri kodunu TAHMIN_ADAY listesinin BAŞINA sabitle. */
// §123 KEŞFİN SONUCU — artık tahmin değil, ÖLÇÜLDÜ:
//   ?ara=politika faizi → 0 sonuç. Sebep: 'ara' yalnız VERİ GRUBU ADLARINI tarar,
//   seri adlarını taramaz. "Politika faizi" bir grup adı değil, grup İÇİNDEKİ seri.
//   ?ara=faiz → 19 grup → 'bie_bispolfaiz' = "Merkez Bankaları Politika Faiz Oranı"
//   ?list=bie_bispolfaiz → 49 ülke, desen TP.BISPOLFAIZ.<ISO3>
// UYARI: bu bir BIS DERLEMESİDİR. TCMB'nin kendi duyurusundan gecikmeli gelebilir;
// PPK günü akşamı henüz eski değeri gösterebilir. Kart tarihi yazıyor, ona bak.
const TAHMIN_ADAY = [
  {tip:'seri', kod:'TP.BISPOLFAIZ.TUR'},
  {tip:'grup', grup:'bie_bispolfaiz', ad:'Türkiye'},
  {tip:'grup', grup:'bie_bispolfaiz', ad:'TUR'}
];
// §123 FONLAMA ZİNCİRİ — dokümanın işaret ettiği dört halka.
// "PPK'yı doğru tahmin edip fonun getirisini yine de yanlış hesaplayabilirsiniz":
// politika faizi ile fonun fiilen kazandığı oran aynı şey değil. Sapmanın ölçülebilmesi
// için dördünün de AYNI EKRANDA olması gerekiyordu — şimdi var.
const ZINCIR = [
  {ad:'POLİTİKA', not:'PPK kararı', seri:'TP.BISPOLFAIZ.TUR'},
  {ad:'AOFM', not:'TCMB efektif fonlama', seri:'TP.APIFON4'},
  {ad:'TLREF', not:'gecelik referans', grup:'bie_bisttlref'},
  {ad:'PİYASA REPO', not:'BİST O/N — fonun fiilen kazandığı', grup:'bie_onrepofbap'}
];
// Likidite pozisyonu: sapmanın ANA KAYNAĞI. Sterilizasyon fonlamayı aşıyorsa
// sistemde TL fazlası var → gecelik oranlar koridorun ALT bandına kayar.
// Panel şimdiye kadar yalnız NET'i (APIFON3) çekiyordu; brüt bileşenler daha çok
// şey söyler — net sıfıra yakınken ikisi birden büyükse kompozisyon değişiyor demektir.
const LIKIDITE = {fonlama:'TP.APIFON1.TOP', steril:'TP.APIFON2.TOP'};
const POLITIKA_DAMGA = {deger:37, tarih:'23 Tem 2026 PPK'};   // yedek — damgalı, açıkça yazılır
let TAHMIN = {politika:null, politikaKaynak:null, tufe:null, bek:null, egri:null};

async function tahminPolitikaFaizi(){
  for(const a of TAHMIN_ADAY){
    try{
      const u = a.tip==='grup'
        ? '/api/evds2?grup='+a.grup+'&adFiltre='+encodeURIComponent(a.ad)+'&gun=400'
        : '/api/evds2?series='+a.kod+'&gun=400';
      const r = await fetch(u); if(!r.ok) continue;
      const d = await r.json();
      const kod = d.cozulen || d.seri || a.kod;
      const v = (d.son||{})[kod];
      const x = v && parseFloat(v.deger);
      if(isFinite(x) && x>5 && x<100){          // makullük: politika faizi bu bantta
        return {deger:x, kaynak:(a.tip==='grup'?a.grup+'/'+a.ad:a.kod), canli:true, tarih:v.tarih||null};
      }
    }catch(e){}
  }
  return {deger:POLITIKA_DAMGA.deger, kaynak:'damgalı ('+POLITIKA_DAMGA.tarih+')', canli:false};
}

/* ── ENFLASYON PATİKASI ───────────────────────────────────────────────────────
   KATMAN 1 — BAZ ETKİSİ: model riski SIFIR. Önümüzdeki 12 ayın yıllık enflasyonu,
   geçen yılın aynı aylarının seriden DÜŞMESİYLE mekanik belirlenir. Aylık varsayım
   verildiğinde patika TAM OLARAK çıkar. Bu bir tahmin değil KİMLİKTİR:
     y/y(t+k) = I(t+k) / I(t+k−12) − 1   ·   I(t+k) = I(t)·Π(1+r_j)
   Payda TARİHTİR, bilinir. Belirsizlik yalnız paydadadır.
   ASIL DEĞERİ TERSİNDEN: hedefe ulaşmak için aylık kaç gerektiğini gösterir.
   KATMAN 2 — MEVSİMSELLİK: TÜFE'nin ay deseni güçlü (Ocak zam, yaz gıda, Eylül
   eğitim). Son N yılın ay-bazlı ortalaması. Sabit aylık varsayım Ocak'ı da
   Temmuz'u da aynı sayar; mevsimsel profil bunu düzeltir. */
function tufeAylikDegisim(seri){         // [{ay:'2026-06', endeks:123.4}, ...] → aylık %
  const o = [];
  for(let i=1;i<seri.length;i++) o.push({ay:seri[i].ay, d:(seri[i].endeks/seri[i-1].endeks-1)*100});
  return o;
}
function tufeMevsimsel(aylik, yil){      // ay-bazlı ortalama (son `yil` yıl)
  const kes = aylik.slice(-(yil*12));
  const grup = {};
  kes.forEach(x=>{ const m=+x.ay.split('-')[1]; (grup[m]=grup[m]||[]).push(x.d); });
  const o = {};
  for(let m=1;m<=12;m++) o[m] = grup[m] && grup[m].length
    ? grup[m].reduce((a,b)=>a+b,0)/grup[m].length : null;
  return o;
}
/* 12 aylık patika. mod='sabit' → her ay r; mod='mevsim' → mevsimsel profil × olcek */
function tufePatika(seri, mod, r, mevsim, olcek){
  const n = seri.length; if(n<13) return null;
  const son = seri[n-1];
  const [y0,m0] = son.ay.split('-').map(Number);
  const gec = {}; seri.forEach(x=>gec[x.ay]=x.endeks);
  const out = []; let I = son.endeks;
  for(let k=1;k<=12;k++){
    const mm = ((m0-1+k)%12)+1, yy = y0 + Math.floor((m0-1+k)/12);
    const ay = yy+'-'+String(mm).padStart(2,'0');
    const aylik = mod==='mevsim'
      ? ((mevsim[mm]!=null?mevsim[mm]:r) * (olcek||1))
      : r;
    I = I*(1+aylik/100);
    const gecenAy = (yy-1)+'-'+String(mm).padStart(2,'0');
    const taban = gec[gecenAy];
    out.push({ay, aylik:+aylik.toFixed(2), endeks:+I.toFixed(2),
      taban: taban||null, yillik: taban? +((I/taban-1)*100).toFixed(2) : null});
  }
  return out;
}
/* TERSİNE ÇÖZÜM: 12 ay sonra hedef y/y için gereken sabit aylık oran.
   y/y(t+12) = I(t)·(1+r)^12 / I(t) − 1 = (1+r)^12 − 1  →  r = (1+hedef)^(1/12) − 1 */
const tufeGerekenAylik = (hedef)=> (Math.pow(1+hedef/100, 1/12)-1)*100;

/* ── PPK OLASILIK AĞACI ───────────────────────────────────────────────────────
   NOKTA TAHMİNİ DEĞİL DAĞILIM. Her toplantı bir düğüm; hareketlere olasılık
   verilir, beklenen değer bileşiklenir. Nokta tahmini "haklı/haksız" ikilemine
   düşürür; dağılım pozisyon boyutlandırmaya çevrilebilir.
   Beklenen hareket = Σ p_i · hareket_i  (bp)
   ÇAPA — EX-ANTE REEL FAİZ: TCMB'nin tepki fonksiyonu geçmiş enflasyona değil
   12 ay SONRASI beklentiye bakar:
     reel = (1+politika)/(1+beklenti) − 1
   Ex-post (geçmiş enflasyonla) hesaplamak en sık yapılan hatadır. */
const PPK_VARSAYILAN = [
  {tarih:'2026-09-10', p:{'-250':10,'-150':35,'-100':35,'0':20,'+100':0,'+250':0}},
  {tarih:'2026-10-22', p:{'-250':15,'-150':35,'-100':30,'0':20,'+100':0,'+250':0}},
  {tarih:'2026-12-10', p:{'-250':15,'-150':30,'-100':30,'0':25,'+100':0,'+250':0}}
];
/* §303 ARTIRIM KOLU: dağılım eskiden yalnız indirim/sabit kollarını içeriyordu —
   KESİK dağılım. Kuyruk senaryosu (şok, jeopolitik, kur atağı → artırım)
   fiyatlanamıyordu; 2023 Haziran'ı yaşamış bir masa için artırım kolu süs değil
   disiplindir. Ex-ante reel faiz çıpası ve alfa bandı, kuyruk olmadan eksikti.
   VARSAYILAN OLASILIK 0: kuyruğa kaç puan verileceği TAKDİRDİR ve takdir
   kullanıcınındır — panel olasılık UYDURMAZ, yalnız kolonu açar. Matematik
   (ppkPatika) anahtar-bağımsızdır: Number('+100')=100; beklenen değer ve sapma
   kendiliğinden doğru çıkar (üç senaryoyla test edildi).
   PPK_KOLLAR = kolon listesinin TEK SAHİBİ (§112) — eskiden başlık ve gövde
   satırında ayrı ayrı gömülüydü; biri değişip öteki unutulunca tablo kayardı. */
const PPK_KOLLAR = ['-250','-150','-100','0','+100','+250'];
function ppkOku(){ try{ const s=JSON.parse(localStorage.getItem('ppk_olasilik_v1')||'null');
  return (Array.isArray(s)&&s.length)?s:JSON.parse(JSON.stringify(PPK_VARSAYILAN)); }
  catch(e){ return JSON.parse(JSON.stringify(PPK_VARSAYILAN)); } }
function ppkYaz(l){ try{ localStorage.setItem('ppk_olasilik_v1', JSON.stringify(l)); }catch(e){} }
function ppkPatika(baslangic, liste){
  let faiz = baslangic; const out = [];
  liste.forEach(t=>{
    const top = Object.values(t.p).reduce((a,b)=>a+(+b||0),0);
    let bek = 0;
    Object.keys(t.p).forEach(k=>{ bek += (+t.p[k]||0)/(top||1) * (+k); });
    // dağılımın std sapması — belirsizliğin ölçüsü
    let v = 0;
    Object.keys(t.p).forEach(k=>{ v += (+t.p[k]||0)/(top||1) * Math.pow((+k)-bek,2); });
    faiz = faiz + bek/100;
    out.push({tarih:t.tarih, beklenenBp:+bek.toFixed(1), sapmaBp:+Math.sqrt(v).toFixed(1),
              faiz:+faiz.toFixed(2), toplam:top});
  });
  return out;
}
/* PİYASANIN İMA ETTİĞİ PATİKA — getiri eğrisinden forward oran.
   f(t1→t2) = [(1+z2)^t2 / (1+z1)^t1]^(1/(t2−t1)) − 1
   Kendi tahminin tek başına işe yaramaz; ALFA konsensüsten SAPMADADIR.
   Bu satır "sıfır alfa senaryosu"dur: piyasayla aynıysan pozisyonun anlamı yok. */
function egriForward(vadeler){
  // §126 HATA DÜZELTMESİ: önceki sürüm vade etiketini parseFloat ile ayrıştırıyordu.
  // egri.js etiketleri '3A','6A','9A','1Y','2Y','5Y' biçiminde üretiyor →
  // parseFloat('3A')=3, parseFloat('6A')=6. Yani 3 AY, 3 YIL sanılıyordu ve
  // eğri baştan sona karışıyordu; forward oranlar anlamsızdı.
  // DOĞRUSU: egri.js her vade için ölçülen kalanYil'ı zaten döndürüyor. Onu kullan;
  // yoksa etiketi DOĞRU ayrıştır (A=ay/12, Y=yıl).
  const etiketYil = (k)=>{
    const m = String(k).trim().toUpperCase().match(/^(\d+(?:[.,]\d+)?)\s*([AYM]?)/);
    if(!m) return null;
    const s = parseFloat(m[1].replace(',','.'));
    if(!isFinite(s)) return null;
    return (m[2]==='A'||m[2]==='M') ? s/12 : s;      // A=ay, Y/boş=yıl
  };
  const nok = Object.keys(vadeler||{}).map(k=>{
    const v = vadeler[k] || {};
    const y = (isFinite(v.kalanYil) && v.kalanYil>0) ? v.kalanYil : etiketYil(k);
    const g = parseFloat(v.getiri);
    return (isFinite(y)&&y>0&&isFinite(g)) ? {ad:k, yil:y, z:g} : null;
  }).filter(Boolean).sort((a,b)=>a.yil-b.yil);
  if(nok.length<2) return null;
  const f = [];
  for(let i=1;i<nok.length;i++){
    const a=nok[i-1], b=nok[i];
    if(b.yil-a.yil < 0.02) continue;                  // çok yakın vadeler → gürültü
    const r = (Math.pow(Math.pow(1+b.z/100,b.yil)/Math.pow(1+a.z/100,a.yil), 1/(b.yil-a.yil))-1)*100;
    f.push({bas:+a.yil.toFixed(2), bit:+b.yil.toFixed(2), oran:+r.toFixed(2)});
  }
  return {spot:nok, forward:f, interp:(yil)=>egriInterp(nok, yil)};
}

/* Spot eğride doğrusal ara değer. Bir para piyasası fonu için ANLAMLI SORU şudur:
   "N gün boyunca gecelikte dönmek mi, bugünden N günlük oranı kilitlemek mi?"
   Kilitlenebilecek oran = eğrinin o vadedeki spot getirisi. Eğri o noktayı
   içermiyorsa komşu iki vadeden ara değer alınır; aralık dışındaysa uç değer
   kullanılır ama BUNU RAPORLAR (eğri dışına taşan çıkarım güvenilmez). */
function egriInterp(nok, yil){
  if(!nok || nok.length<1 || !isFinite(yil)) return null;
  if(yil <= nok[0].yil) return {z:nok[0].z, disari:yil < nok[0].yil*0.95, uc:nok[0].ad};
  const son = nok[nok.length-1];
  if(yil >= son.yil) return {z:son.z, disari:yil > son.yil*1.05, uc:son.ad};
  for(let i=1;i<nok.length;i++){
    const a=nok[i-1], b=nok[i];
    if(yil<=b.yil){
      const w=(yil-a.yil)/(b.yil-a.yil);
      return {z:+(a.z+(b.z-a.z)*w).toFixed(3), disari:false, uc:a.ad+'\u2013'+b.ad};
    }
  }
  return null;
}


/* Zincir halkalarını tek tek çeker — biri düşerse diğerleri etkilenmez. */
async function zincirGetir(){
  const tek = async (h)=>{
    try{
      const u = h.seri ? '/api/evds2?series='+h.seri+'&gun=120'
                       : '/api/evds2?grup='+h.grup+'&adFiltre=&gun=120';
      const r = await fetch(u); if(!r.ok) return null;
      const d = await r.json(); const kod=d.cozulen||d.seri||h.seri;
      const v=(d.son||{})[kod]; const x=v&&parseFloat(v.deger);
      return (isFinite(x)&&x>0&&x<200) ? {ad:h.ad, not:h.not, deger:x, tarih:v.tarih||null, kod} : null;
    }catch(e){ return null; }
  };
  // §125 DÜZELTME: önceki sürüm TEK GÜNÜN değerini alıyordu ve o gün fonlama 0,0
  // döndüğü için "net −1.191 mlr" gibi yanıltıcı bir tablo çıktı. Bu seriler
  // günlük oynak; tek gün fotoğrafı rejimi temsil etmez. Son 5 GEÇERLİ gözlemin
  // ortalaması alınır ve kaç gözlem kullanıldığı raporlanır.
  const lik = async (k)=>{ try{
      const r=await fetch('/api/evds2?series='+k+'&gun=120&full=1'); if(!r.ok) return null;
      const d=await r.json(); const alan=(d.cozulen||d.seri||k).replace(/\./g,'_');
      const sat=(d.ham||[]).filter(x=>{const y=parseFloat(x[alan]); return isFinite(y);});
      if(!sat.length) return null;
      const son=sat.slice(-5);
      const v=son.map(x=>parseFloat(x[alan]));
      return {ort:v.reduce((a,b)=>a+b,0)/v.length, n:v.length,
              sonuncu:v[v.length-1], tarih:son[son.length-1].Tarih||null};
    }catch(e){ return null; } };
  const [halkalar, f, s] = await Promise.all([
    Promise.all(ZINCIR.map(tek)), lik(LIKIDITE.fonlama), lik(LIKIDITE.steril)
  ]);
  return {halkalar, fonlama:f, steril:s};
}

function zincirCiz(z){
  const el=$('thZincir'); if(!el||!z) return;
  const F=(v,d)=>v==null||!isFinite(v)?'—':trN(v,d==null?2:d);
  const h=z.halkalar, ilk=h[0]&&h[0].deger;
  el.innerHTML='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(132px,1fr));gap:8px">'+
    h.map((x,i)=>{
      if(!x) return '<div class="card" style="padding:7px 11px;opacity:.5"><div class="lbl">'+esc(ZINCIR[i].ad)+
        '</div><div class="val" style="font-size:15px">—</div><div class="sub">alınamadı</div></div>';
      const fark = (ilk!=null&&i>0) ? (x.deger-ilk)*100 : null;
      return '<div class="card" style="padding:7px 11px"><div class="lbl">'+esc(x.ad)+'</div>'+
        '<div class="val" style="font-size:15px">%'+F(x.deger,2)+'</div>'+
        '<div class="sub">'+esc(x.not)+(fark!=null?' · <b style="color:'+(fark<0?'var(--down)':'var(--up)')+'">'+
          (fark>0?'+':'')+F(fark,0)+'bp</b>':'')+'</div></div>';
    }).join('')+'</div>'+
    (()=>{
      // §125 DÜZELTME: önceki metin "TL fazlası → oranlar ALT banda kayar, AOFM
      // politika faizinin ALTINDA kalır" diyordu; oysa rozetler +300bp yani ÜSTÜNDE
      // gösteriyordu. NOT TABLOYLA ÇELİŞİYORDU (§111'in aynısı, bu sefer ben yaptım).
      // KÖK NEDEN: kural fazla genelleştirilmişti. "Sterilizasyon > fonlama ⇒ taban"
      // bağıntısı ancak HAFTALIK REPO KANALI AÇIKKEN geçerli. TCMB Mart'tan beri
      // haftalık repo ihalelerini askıya almış; fonlama gecelik pencereden yapılıyor
      // ve oran koridorun TAVANINA yapışıyor.
      // YENİ KURAL: anlatı varsayılan değil ÖLÇÜLEN farka dayanır. Önce farkın
      // İŞARETİNE bakılır, sonra sebep yorumlanır. Ölçüm anlatıyı belirler, tersi değil.
      const hh=z.halkalar, pol=hh[0]&&hh[0].deger, aofm=hh[1]&&hh[1].deger;
      const fark = (pol!=null&&aofm!=null) ? (aofm-pol)*100 : null;
      let s = '<div class="note" style="margin-top:9px">';
      if(z.fonlama&&z.steril){
        const net=z.fonlama.ort-z.steril.ort;
        // §137: BİRİM SEÇİMİ. Önceki sürüm her şeyi /1000 yapıp "mlr" yazıyordu;
        // fonlama 40 milyon TL olsa 0,04 çıkıp "0,0" olarak YUVARLANIYORDU ve
        // "fonlama sıfır" izlenimi veriyordu. Sıfır ile küçük ÇOK FARKLI şeyler:
        // sıfırsa TCMB hiç fonlama yapmıyor, küçükse marjinal fonlama var ve
        // AOFM onun maliyeti demektir. Artık büyüklüğe göre birim seçiliyor.
        const bir=(v)=>{const a=Math.abs(v);
          return a>=1000 ? F(v/1000,1)+' mlr' : (a>=1 ? F(v,0)+' mn' : F(v,3)+' mn');};
        s += '<b>TL likidite pozisyonu</b> <span class="thin">(son '+z.fonlama.n+' gözlem ort.'+
          (z.fonlama.tarih?' · '+esc(String(z.fonlama.tarih)):'')+')</span>: fonlama '+
          bir(z.fonlama.ort)+' · sterilizasyon '+bir(z.steril.ort)+' · <b>net '+
          (net>0?'+':'')+bir(net)+'</b>. ';
      }
      if(fark!=null){
        s += fark>50
          ? '<b>AOFM politika faizinin '+F(fark,0)+'bp ÜSTÜNDE.</b> Bu, fonlamanın politika faizinden yapılMADIĞI anlamına gelir — haftalık repo ihaleleri askıda, fonlama gecelik pencereden ve oran koridorun <b>TAVANINA</b> yapışık. <b>Sonuç: politika faizi şu an fiilen BAĞLAYICI DEĞİL.</b> PPK indirim yapsa bile AOFM, koridor tavanı birlikte inmedikçe değişmez — repo tahmininin çıpası politika faizi değil KORİDOR olmalıdır.'
          : fark<-50
          ? '<b>AOFM politika faizinin '+F(-fark,0)+'bp ALTINDA.</b> Sistemde TL fazlası var ve gecelik oranlar koridorun alt bandına kaymış.'
          : '<b>AOFM politika faizine yapışık</b> ('+F(fark,0)+'bp) — fonlama ağırlıklı olarak politika faizinden yapılıyor, klasik rejim.';
      }
      /* §137 ÇELİŞKİ DENETÇİSİ — kart kendi kendini denetler.
         Teori: TL FAZLASI (sterilizasyon > fonlama) varsa gecelik oranlar
         koridorun ALT bandına kayar. Buna rağmen oranlar TAVANDAysa iki okuma
         çelişiyor demektir ve sebebi ölçüm tarafında olabilir (bayat seri,
         farklı yayın tarihi, birim hatası) ya da rejim gerçekten alışılmadıktır.
         Panel hangisi olduğunu bilemez — ama ÇELİŞTİĞİNİ SÖYLEYEBİLİR.
         Sessiz kalmak, okuyucunun iki satırı kendi kafasında uzlaştırmaya
         çalışmasına yol açar; §111'in dersi tam buydu. */
      if(z.fonlama&&z.steril&&fark!=null){
        const fazla=(z.steril.ort-z.fonlama.ort)>0, tavanda=fark>250;
        if(fazla&&tavanda) s+='<br><b style="color:var(--down)">⚠ İki okuma çelişiyor:</b> '+
          'sterilizasyon fonlamayı aşıyor (TL fazlası) <em>ama</em> oranlar koridorun tavanına yapışık. '+
          'Fazla likidite normalde oranları ALT banda çeker. Olası sebepler: (a) fonlama ile AOFM serilerinin '+
          'yayın tarihleri farklı, (b) fonlama küçük ama sıfır değil ve marjinal maliyet tavanda oluşuyor, '+
          '(c) rejim gerçekten alışılmadık. <b>Kart bunu çözemez</b> — TCMB\'nin güncel gecelik borç verme '+
          'faizi kontrol edilmeli; %40 ise teşhis doğru, değilse rejim okuması baştan kurulmalı.';
      }
      return s+'</div>'; })();
}


/* ── REPO TAHMİNİ (§125) ──────────────────────────────────────────────────────
   ZİNCİRİN İLERİYE UZATILMASI. Önceki sürüm politika faizini tahmin edip AOFM/
   TLREF/piyasa reposunu BUGÜNKÜ halleriyle gösteriyordu — yani zincir kuruluydu
   ama ileriye uzanmıyordu. Fon yöneticisinin ihtiyacı olan şey politika faizi
   değil, FONUN FİİLEN KAZANACAĞI orandır.

   BUGÜNKÜ ÖLÇÜM NE SÖYLÜYOR: politika %37, AOFM %40,00, TLREF %39,91, piyasa
   repo %39,89. Koridor tavanı politika+300bp = %40. AOFM TAM TAVANDA.
   Yani fonlama politika faizinden DEĞİL, gecelik pencereden yapılıyor
   (haftalık repo ihaleleri Mart'tan beri askıda). Bunun sonucu kritik:
   POLİTİKA FAİZİ ŞU AN FİİLEN BAĞLAYICI DEĞİL.

   DOĞRU ÇIPA KORİDORDUR, politika faizi değil:
     piyasa repo ≈ koridor tavanı − (küçük ve ölçülebilir bir marj)
   TCMB koridoru tarihsel olarak politika faiziyle BİRLİKTE oynatır (sabit ±spread).
   O yüzden zincir şöyle kurulur:
     PPK patikası → koridor tavanı (politika + ölçülen spread) → AOFM → TLREF/piyasa
   Her halkadaki marj VARSAYILMAZ, BUGÜNKÜ VERİDEN ÖLÇÜLÜR. Rejim değişirse
   marj da değişir — o yüzden kart rejim uyarısını ayrıca gösterir. */

function repoMarjlar(z){
  const h = z && z.halkalar; if(!h) return null;
  const pol=h[0]&&h[0].deger, aofm=h[1]&&h[1].deger, tlref=h[2]&&h[2].deger, piy=h[3]&&h[3].deger;
  if(pol==null) return null;
  return {
    pol,
    // kayan nokta artığını kes: 290.99999999999966 → 291
    aofmBp:  aofm!=null ? +((aofm-pol)*100).toFixed(1)  : null,
    tlrefBp: tlref!=null? +((tlref-pol)*100).toFixed(1) : null,
    piyBp:   piy!=null  ? +((piy-pol)*100).toFixed(1)   : null,
    tavanda: aofm!=null && (aofm-pol)*100 > 250   // koridor tavanına yapışık mı
  };
}

/* PPK patikasını FON GETİRİSİNE çevirir.
   Gün sayısı ACT/365, GÜNLÜK BİLEŞİK — dökümanın belirttiği konvansiyon.
   Basit yıllık ortalama almak dönem uzadıkça sapar; bileşiklemek şart. */
function repoPatika(marj, ppkPat, bugun){
  if(!marj) return null;
  const d0 = bugun ? new Date(bugun) : new Date();
  const sat = [];
  let onceki = d0, faiz = marj.pol, bilesik = 1, toplamGun = 0;
  const piyOran = (p)=> marj.piyBp!=null ? p + marj.piyBp/100 : (marj.tlrefBp!=null ? p + marj.tlrefBp/100 : p);
  ppkPat.forEach(t=>{
    const dt = new Date(t.tarih);
    const gun = Math.max(0, Math.round((dt-onceki)/86400000));
    const oran = piyOran(faiz);                       // bu dönem boyunca geçerli piyasa oranı
    if(gun>0){ bilesik *= Math.pow(1+oran/100/365, gun); toplamGun += gun; }
    sat.push({tarih:t.tarih, gun, politika:faiz, piyasa:+oran.toFixed(2),
              beklenenBp:t.beklenenBp, sapmaBp:t.sapmaBp, kumulatif:+((bilesik-1)*100).toFixed(2)});
    faiz = t.faiz; onceki = dt;
  });
  // son toplantıdan sonra 90 gün daha taşı (dönem sonu getirisi için)
  const kuyruk = 90, oranSon = piyOran(faiz);
  bilesik *= Math.pow(1+oranSon/100/365, kuyruk); toplamGun += kuyruk;
  return {sat, sonPiyasa:+oranSon.toFixed(2), toplamGun,
          kumulatif:+((bilesik-1)*100).toFixed(2),
          yillik:+((Math.pow(bilesik,365/toplamGun)-1)*100).toFixed(2)};
}

function repoCiz(){
  const el=$('thRepo'); if(!el) return;
  const marj = repoMarjlar(TAHMIN.zincir), P = TAHMIN.politika;
  if(!marj || !P){ el.innerHTML='<div class="sub">Zincir verisi bekleniyor…</div>'; return; }
  const F=(v,d)=>v==null||!isFinite(v)?'—':trN(v,d==null?2:d);
  const ppkPat = ppkPatika(P.deger, ppkOku());
  const R = repoPatika(marj, ppkPat);
  const yon = $('thYonetim') ? tahminOku('thYonetim',1.5) : 1.5;

  el.innerHTML =
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(126px,1fr));gap:8px;margin-bottom:9px">'+
    '<div class="card" style="padding:7px 11px"><div class="lbl">REJİM</div><div class="val" style="font-size:14px;color:'+(marj.tavanda?'var(--down)':'var(--up)')+'">'+
      (marj.tavanda?'TAVANDA':'POLİTİKA')+'</div><div class="sub">'+(marj.tavanda?'gecelik pencere':'haftalık repo')+'</div></div>'+
    '<div class="card" style="padding:7px 11px"><div class="lbl">ÖLÇÜLEN MARJ</div><div class="val" style="font-size:14px">+'+F(marj.piyBp!=null?marj.piyBp:marj.tlrefBp,0)+'bp</div><div class="sub">piyasa − politika</div></div>'+
    '<div class="card" style="padding:7px 11px"><div class="lbl">SON PPK SONRASI</div><div class="val" style="font-size:14px">%'+F(R.sonPiyasa,2)+'</div><div class="sub">piyasa repo oranı</div></div>'+
    '<div class="card" style="padding:7px 11px"><div class="lbl">FON GETİRİSİ</div><div class="val up" style="font-size:14px">%'+F(R.kumulatif-yon*R.toplamGun/365,2)+'</div><div class="sub">'+R.toplamGun+' gün · ücret sonrası</div></div>'+
    '</div>'+
    '<div style="overflow-x:auto"><table class="arzTbl"><thead><tr><th style="width:118px">DÖNEM</th><th>GÜN</th><th>POLİTİKA</th><th>PİYASA REPO</th><th>PPK</th><th>KÜMÜLATİF</th></tr></thead><tbody>'+
    R.sat.map((x,i)=>'<tr><td style="font-weight:700;font-size:10px">'+
      (i===0?'bugün':R.sat[i-1].tarih.slice(5))+' → <span style="color:var(--mm2)">'+x.tarih.slice(5)+'</span></td>'+
      '<td style="color:var(--muted)">'+x.gun+'</td>'+
      '<td>%'+F(x.politika,2)+'</td><td style="font-weight:700;color:var(--mm2)">%'+F(x.piyasa,2)+'</td>'+
      '<td style="color:var(--muted);font-size:10px">'+F(x.beklenenBp,0)+'±'+F(x.sapmaBp,0)+'bp</td>'+
      '<td>%'+F(x.kumulatif,2)+'</td></tr>').join('')+
    '</tbody></table></div>'+
    '<div class="note" style="margin-top:9px">'+
    (marj.tavanda
      ? '<b style="color:var(--down)">Kritik:</b> AOFM koridor tavanına yapışık, yani <b>politika faizi şu an fiilen bağlayıcı değil</b>. Bu tablo, TCMB’nin koridoru politika faiziyle <em>birlikte</em> indireceği varsayımına dayanır — tarihsel davranış budur ama garanti değildir. <b>Rejim riski:</b> haftalık repo ihaleleri yeniden açılırsa fonlama politika faizine kayar ve AOFM <b>bir anda ~'+F(marj.aofmBp,0)+'bp düşer</b>; PPK hiç indirim yapmasa bile fonun getirisi o kadar geriler. Bu, faiz tahmininden bağımsız ve daha büyük bir risktir.'
      : '<b>Rejim:</b> fonlama ağırlıklı olarak politika faizinden yapılıyor; marj dar, geçişkenlik yüksek. PPK kararı fon getirisine neredeyse birebir yansır.')+
    ' <b>Marjlar ölçülmüştür, varsayılmamıştır:</b> AOFM +'+F(marj.aofmBp,0)+'bp · TLREF +'+F(marj.tlrefBp,0)+'bp · piyasa +'+F(marj.piyBp,0)+'bp (politika faizine göre, bugünkü veriden). Rejim değişirse bu marjlar da değişir.</div>';
}


/* ── ALFA: SENİN PATİKAN vs PİYASANIN FİYATLADIĞI (§126) ──────────────────────
   Bir para piyasası fonu yöneticisinin fiilen verdiği karar iki seçenek arasındadır:
     (A) GECELİKTE DÖN — her gün yeniden yatır, patikayı takip et
     (B) VADEYİ KİLİTLE — bugünden N günlük oranı sabitle
   Hangisinin kazanacağı, senin faiz görüşünün piyasanınkinden FARKLI olup
   olmadığına bağlıdır. Aynıysa iki seçenek de aynı getiriyi verir ve pozisyon
   almanın anlamı yoktur. ALFA TAM OLARAK BU FARKTIR.

   ÖLÇÜM:
     Dönme getirisi  = Π(1 + piyasa_repo_i/365)^gün_i   ← senin PPK patikandan
     Kilitleme getirisi = (1 + z_N)^(N/365) − 1          ← eğrinin N vadeli spot'u
   İkisi AYNI ufukta hesaplanır, aksi halde karşılaştırma anlamsızdır.

   DÜRÜSTLÜK NOTLARI — ikisi de kartta yazılı:
   1) Eğri DİBS eğrisidir, OIS değil. İçinde vade primi ve likidite primi var;
      saf faiz beklentisi değildir. Fark küçükse gürültü olabilir.
   2) Para piyasası fonunun ağırlıklı ortalama vadesi 91 GÜNLE sınırlıdır.
      Uzun ufukta hesaplanan "kilitleme" tam olarak uygulanabilir değildir;
      pratik kaldıraç 1–91 gün arasındaki tercihtir. Yön doğru, büyüklük üst sınır. */
function alfaHesap(marj, ppkPat, egri, gunSayisi){
  if(!marj || !egri || !egri.interp) return null;
  const R = repoPatika(marj, ppkPat);
  if(!R) return null;
  const N = gunSayisi || R.toplamGun;
  const yil = N/365;
  const kil = egri.interp(yil);
  if(!kil) return null;

  /* §132 EŞİK ARTIK KEYFİ DEĞİL — SENİN BELİRSİZLİĞİNDEN TÜRÜYOR.
     Önceki sürüm sabit 0,5 puanlık bir eşik kullanıyordu; bu sayının hiçbir
     dayanağı yoktu. Doğrusu: farkı, TAHMİNİN KENDİ BELİRSİZLİĞİYLE kıyaslamak.
     PPK ağacındaki her toplantının bir std sapması var (dağılımdan hesaplanır).
     Toplantılar bağımsız varsayılırsa k. toplantıdan sonraki kümülatif belirsizlik
     σ_k = √(Σ σ_i²). Faiz patikasını ±σ kaydırıp dönme getirisini yeniden
     hesaplayınca bir BANT çıkar. Kilitleme o bandın içindeyse fark, kendi
     varsayımının gürültüsünden küçüktür — SİNYAL DEĞİLDİR.
     Bu eşik kendini ayarlar: olasılıkları dağıtırsan bant genişler, eşik yükselir. */
  const bantli = (yon)=>{
    let kum2 = 0;
    const kaydirilmis = ppkPat.map(t=>{
      kum2 += Math.pow(t.sapmaBp||0, 2);
      return Object.assign({}, t, {faiz: t.faiz + yon*Math.sqrt(kum2)/100});
    });
    const r = repoPatika(marj, kaydirilmis);
    return r ? r.kumulatif : null;
  };
  const donKum = R.kumulatif;
  const ust = bantli(+1), alt = bantli(-1);      // +1σ: indirim beklenenden AZ
  const kilKum = (Math.pow(1+kil.z/100, yil)-1)*100;
  const olcek = (x)=> x==null?null:+((Math.pow(1+x/100, N/R.toplamGun)-1)*100).toFixed(2);

  /* §133 PRİM GÖSTERGESİ — OIS yoksa primi ölçemeyiz ama GÖRÜNÜR kılabiliriz.
     EVDS'de TLREF OIS eğrisi YOK (arandı: tek swap grubu TCMB'nin işlem hacmi).
     Dolayısıyla DİBS eğrisi kalıcı zemin. Ama şu tanı yapılabilir:
     eğrinin EN KISA ucu ile BUGÜNKÜ gecelik oran arasındaki fark.
     Mantık: 3 aylık nokta, kabaca "önümüzdeki 3 ayın ortalama gecelik oranı
     + prim"dir. İndirim beklenen bir ortamda ortalama gecelik oranın BUGÜNKÜNDEN
     DÜŞÜK olması gerekir. Kısa uç yine de bugünkünün ÜSTÜNDEyse, aradaki fark
     ya primdir ya da piyasa gerçekten indirim fiyatlamıyordur — ikisi de
     kullanıcının bilmesi gereken şey. Yorumu okuyucuya bırakıyoruz; panel
     ölçtüğünü söyler, ölçmediğini iddia etmez. */
  const kisa = egri.spot && egri.spot.length ? egri.spot[0] : null;
  const gecelikBugun = marj.pol + (marj.piyBp!=null?marj.piyBp/100:0);
  const primBp = kisa ? +((kisa.z - gecelikBugun)*100).toFixed(0) : null;

  const d = olcek(donKum), a = olcek(alt), u = olcek(ust);
  const icinde = (a!=null && u!=null) ? (kilKum >= Math.min(a,u) && kilKum <= Math.max(a,u)) : null;
  return {
    gun:N, yil:+yil.toFixed(3),
    donme:d, alt:a, ust:u, bant:(a!=null&&u!=null)?+Math.abs(u-a).toFixed(2):null,
    kilitleme:+kilKum.toFixed(2), fark:+(d-kilKum).toFixed(2),
    icinde, kilitOran:kil.z, disari:kil.disari, uc:kil.uc,
    kisaUc:kisa?kisa.ad:null, kisaZ:kisa?kisa.z:null, kisaYil:kisa?+kisa.yil.toFixed(2):null,
    gecelikBugun:+gecelikBugun.toFixed(2), primBp,
    ortDonme:+((Math.pow(1+d/100,365/N)-1)*100).toFixed(2)
  };
}

function alfaCiz(){
  const el=$('thAlfa'); if(!el) return;
  const marj = repoMarjlar(TAHMIN.zincir), P = TAHMIN.politika, eg = TAHMIN.egri;
  if(!marj||!P){ el.innerHTML='<div class="sub">Zincir verisi bekleniyor…</div>'; return; }
  if(!eg||!eg.interp){ el.innerHTML='<div class="sub">Getiri eğrisi alınamadı — piyasa karşılaştırması yapılamıyor.</div>'; return; }
  const A = alfaHesap(marj, ppkPatika(P.deger, ppkOku()), eg);
  if(!A){ el.innerHTML='<div class="sub">Karşılaştırma hesaplanamadı.</div>'; return; }
  const F=(v,d)=>v==null||!isFinite(v)?'—':trN(v,d==null?2:d);
  const lehte = A.fark > 0;
  const sinyal = (A.icinde===false);          // kilitleme bandın DIŞINDA → anlamlı
  const karar = !sinyal ? 'NÖTR' : (lehte ? 'KISA KAL' : 'VADE UZAT');
  const renk  = !sinyal ? 'var(--muted)' : (lehte ? 'var(--up)' : 'var(--down)');

  el.innerHTML=
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(132px,1fr));gap:8px;margin-bottom:9px">'+
    '<div class="card" style="padding:7px 11px"><div class="lbl">SENİN PATİKAN</div><div class="val" style="font-size:16px">%'+F(A.donme,2)+
      '</div><div class="sub">±1σ: %'+F(Math.min(A.alt,A.ust),2)+'–%'+F(Math.max(A.alt,A.ust),2)+'</div></div>'+
    '<div class="card" style="padding:7px 11px"><div class="lbl">PİYASA FİYATLIYOR</div><div class="val" style="font-size:16px">%'+F(A.kilitleme,2)+
      '</div><div class="sub">kilitle · eğri %'+F(A.kilitOran,2)+'</div></div>'+
    '<div class="card" style="padding:7px 11px"><div class="lbl">FARK</div><div class="val '+(lehte?'up':'down')+'" style="font-size:16px">'+(A.fark>0?'+':'')+F(A.fark,2)+
      '</div><div class="sub">puan · bant ±'+F(A.bant/2,2)+'</div></div>'+
    '<div class="card" style="padding:7px 11px;border:1px solid '+(sinyal?renk:'var(--line2)')+'">'+
      '<div class="lbl">KARAR</div><div class="val" style="font-size:14px;color:'+renk+'">'+karar+
      '</div><div class="sub">'+(sinyal?(lehte?'gecelikte dön':'seviyeyi kilitle'):'belirsizlik içinde')+'</div></div>'+
    '</div>'+
    '<div class="note"><b>Eşik keyfi değil — senin belirsizliğinden türüyor.</b> PPK ağacındaki her toplantının bir standart sapması var; toplantılar bağımsız varsayılıp σ<sub>k</sub>=√(Σσ<sub>i</sub>²) ile birikince faiz patikası bir <b>bant</b> oluşturuyor: dönme getirisi <b>%'+F(Math.min(A.alt,A.ust),2)+'–%'+F(Math.max(A.alt,A.ust),2)+'</b> ('+F(A.bant,2)+' puan genişlik). '+
    (A.icinde===false
      ? 'Kilitleme (%'+F(A.kilitleme,2)+') bu bandın <b>DIŞINDA</b> — fark, kendi varsayımının gürültüsünden büyük, dolayısıyla anlamlı bir sinyal.'
      : 'Kilitleme (%'+F(A.kilitleme,2)+') bu bandın <b>İÇİNDE</b> — fark, kendi varsayımının gürültüsünden küçük. <b>Sinyal değil.</b> Bu bir başarısızlık değil, korunma: belirsizliğin kadar bile ayrışmıyorsan pozisyon almanın beklenen değeri işlem maliyetini karşılamaz.')+
    ' Olasılıkları dağıtırsan bant genişler ve eşik <em>kendiliğinden</em> yükselir.</div>'+
    '<div class="note" style="margin-top:7px">'+
    (sinyal
      ? (lehte
        ? '<b>Senin patikan kilitlemeyi '+F(A.fark,2)+' puan yeniyor.</b> Piyasa senin beklediğinden <em>daha hızlı</em> indirim fiyatlıyor; vadeli oran bu yüzden düşük. Haklıysan <b>gecelikte kalmak</b> kazandırır — vadeyi uzatmak, henüz gerçekleşmemiş bir indirimi bugünden satın almak olur.'
        : '<b>Kilitleme senin patikanı '+F(-A.fark,2)+' puan yeniyor.</b> Piyasa senin beklediğinden <em>daha yavaş</em> indirim fiyatlıyor. Haklıysan <b>vadeyi uzatıp bugünkü seviyeyi kilitlemek</b> kazandırır.')
      : 'İki seçenek arasındaki fark ölçüm belirsizliğinin içinde kaldığı için yön tavsiyesi verilmiyor.')+
    '</div>'+
    '<div class="note" style="margin-top:7px"><b>Karşılaştırma zemini.</b> İki taraf da aynı soruyu cevaplıyor: <em>1 TL, '+A.gun+' gün sonra kaç TL?</em> Dönme tarafı Π(1+r/365)<sup>gün</sup> — gecelik oranlar basit yıllık kotedilir ve fiilen günlük bileşiklenir. Kilitleme tarafı (1+z)<sup>'+A.gun+'/365</sup> — eğri getirisi IRR\'den gelir, yani zaten yıllık bileşiktir. İkisi de terminal değer, aynı tabanda. '+
    '<b>Kalan iki sınırlama yönü değil büyüklüğü etkiler:</b> <b>(1)</b> eğri <b>DİBS</b> eğrisidir, OIS değil — vade ve likidite primi içerir. <b>TLREF OIS eğrisi EVDS\'de YOK</b> (arandı: tek swap grubu TCMB\'nin işlem hacmi); bu yüzden DİBS kalıcı zemindir. '+
    (A.primBp!=null
      ? '<b>Tanı:</b> eğrinin en kısa ucu ('+esc(A.kisaUc)+', '+F(A.kisaYil,2)+'y) %'+F(A.kisaZ,2)+', bugünkü gecelik ise %'+F(A.gecelikBugun,2)+' → fark <b>'+(A.primBp>0?'+':'')+A.primBp+'bp</b>. '+
        (A.primBp>50
          ? 'Kısa uç bugünkü geceliğin <em>üstünde</em>. İndirim beklenen bir ortamda 3 aylık ortalama geceliğin bugünkünden <em>düşük</em> olması beklenirdi; üstünde olması ya <b>prim</b>dir ya da <b>piyasa gerçekten indirim fiyatlamıyor</b>. Panel hangisi olduğunu ölçemez — ama farkın büyüklüğü, kilitleme oranının ne kadarının saf beklenti olmadığına dair üst sınır verir.'
          : A.primBp<-50
          ? 'Kısa uç bugünkü geceliğin <em>altında</em> — piyasa yakın vadede indirim fiyatlıyor, primden çok beklenti hâkim.'
          : 'Kısa uç bugünkü geceliğe yapışık; prim ihmal edilebilir görünüyor.')
      : '')+'  <b>(2)</b> fonun ağırlıklı ortalama vadesi <b>91 günle sınırlı</b>, '+A.gun+' günlük kilitleme tam uygulanamaz; pratik kaldıraç 1–91 gün tercihidir, fark <b>üst sınırdır</b>.'+
    (A.disari?' <b style="color:var(--down)">⚠ '+A.gun+' gün eğrinin gözlenen aralığı dışında ('+esc(A.uc)+'); uç değer kullanıldı.</b>':' <span class="thin">Kilitleme oranı eğrinin '+esc(A.uc)+' aralığından ara değerle alındı.</span>')+
    '</div>';
}

/* ── ÇİZİM ── */
function tahminOku(id,v){ const e=$(id); if(!e) return v; const x=parseFloat(String(e.value).replace(',','.')); return isFinite(x)?x:v; }

async function tahminYukle(){
  const [pf, tr, br, er] = await Promise.all([
    tahminPolitikaFaizi(),
    fetch('/api/evds2?grup=bie_tukfiy2025&adFiltre=Genel&gun=1200&full=1').then(r=>r.json()).catch(()=>null),
    fetch('/api/evds2?series=TP.ENFBEK.PKA12ENF&gun=400&full=1').then(r=>r.json()).catch(()=>null),
    fetch('/api/evds2?mod=egri').then(r=>r.json()).catch(()=>null)
  ]);
  TAHMIN.politika = pf;
  if(tr){ const alan=(tr.cozulen||tr.seri||'').replace(/\./g,'_');
    TAHMIN.tufe=(tr.ham||[]).filter(x=>x[alan]!=null&&x[alan]!=='')
      .map(x=>{const t=String(x.Tarih).split('-'); return {ay:(+t[0])+'-'+String(+t[1]).padStart(2,'0'), endeks:parseFloat(x[alan])};})
      .filter(x=>isFinite(x.endeks)); }
  if(br){ const a='TP_ENFBEK_PKA12ENF'; const it=(br.ham||[]).filter(x=>x[a]!=null&&x[a]!=='');
    TAHMIN.bek = it.length? parseFloat(it[it.length-1][a]) : null; }
  if(er && er.ok) TAHMIN.egri = egriForward(er.vadeler);
  tahminCiz();
  try{ TAHMIN.zincir = await zincirGetir(); zincirCiz(TAHMIN.zincir); repoCiz(); alfaCiz(); }
  catch(e){ console.warn('[KTPanel] zincir/repo:',(e&&e.message)||e); }
}

function tahminCiz(){
  if(!$('thPolitika')) return;
  const P=TAHMIN.politika, bek=TAHMIN.bek, seri=TAHMIN.tufe;
  const F=(v,d)=>v==null||!isFinite(v)?'—':trN(v,d==null?2:d);

  // 1) POLİTİKA FAİZİ + EX-ANTE REEL
  const reel = (P&&bek!=null) ? exAnteHesapla(P.deger, bek) : null;   // §127: tek sahip
  $('thPolitika').innerHTML='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px">'+
    '<div class="card" style="padding:7px 11px"><div class="lbl">POL\u0130T\u0130KA FA\u0130Z\u0130</div><div class="val" style="font-size:17px">%'+F(P&&P.deger,2)+
      '</div><div class="sub">'+(P&&P.canli?'canl\u0131 \u00b7 '+esc(P.kaynak):'<span style="color:var(--down)">\u26a0 '+esc(P&&P.kaynak||'')+'</span>')+'</div></div>'+
    '<div class="card" style="padding:7px 11px"><div class="lbl">12A BEKLENT\u0130 (PKA)</div><div class="val" style="font-size:17px">%'+F(bek,1)+
      '</div><div class="sub">piyasa kat\u0131l\u0131mc\u0131lar\u0131</div></div>'+
    '<div class="card" style="padding:7px 11px"><div class="lbl">EX-ANTE REEL</div><div class="val '+(reel>0?'up':'down')+'" style="font-size:17px">%'+F(reel,1)+
      '</div><div class="sub">TCMB\u2019nin \u00e7\u0131pas\u0131</div></div>'+
    '</div>'+
    (P&&!P.canli ? '<div class="note" style="margin-top:8px;border-left:3px solid var(--down)">Politika faizi CANLI \u00c7EK\u0130LEMED\u0130, damgal\u0131 de\u011fer kullan\u0131l\u0131yor. Taray\u0131c\u0131da <b>/api/evds2?ara=politika faizi</b> \u00e7al\u0131\u015ft\u0131r\u0131p d\u00f6nen seri kodunu bildir; TAHMIN_ADAY listesinin ba\u015f\u0131na sabitleyeyim.</div>' : '')+
    '<div class="note" style="margin-top:8px">Ex-ante reel faiz = (1+politika)/(1+<b>12 ay sonras\u0131</b> beklenti) \u2212 1. Ge\u00e7mi\u015f enflasyonla (ex-post) hesaplamak en s\u0131k yap\u0131lan hatad\u0131r \u2014 TCMB ileriye bakar. Bu oran TCMB\u2019nin fiili \u00e7\u0131pas\u0131d\u0131r: belirli bir band\u0131n alt\u0131na d\u00fc\u015f\u00fcrmeme davran\u0131\u015f\u0131 gözlenirse, beklenti patikan faiz patikas\u0131n\u0131 kendili\u011finden verir.</div>';

  // 2) ENFLASYON PATİKASI
  const el=$('thEnf');
  if(el && seri && seri.length>=13){
    const aylik=tufeAylikDegisim(seri), mevsim=tufeMevsimsel(aylik,5);
    const mod=($('thMod')&&$('thMod').value)||'sabit';
    const r=tahminOku('thAylik',2.0), olcek=tahminOku('thOlcek',1.0);
    const pat=tufePatika(seri,mod,r,mevsim,olcek);
    const son=seri[seri.length-1], sonY=(()=>{const [y,m]=son.ay.split('-').map(Number);
      const g=seri.find(x=>x.ay===(y-1)+'-'+String(m).padStart(2,'0'));
      return g? (son.endeks/g.endeks-1)*100 : null;})();
    const hedef=tahminOku('thHedef',24);
    const ger=tufeGerekenAylik(hedef);
    const AY=['','Oca','\u015eub','Mar','Nis','May','Haz','Tem','A\u011fu','Eyl','Eki','Kas','Ara'];
    el.innerHTML=
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin-bottom:9px">'+
      '<div class="card" style="padding:7px 11px"><div class="lbl">SON GER\u00c7EKLE\u015eEN</div><div class="val" style="font-size:16px">%'+F(sonY,2)+
        '</div><div class="sub">'+AY[+son.ay.split('-')[1]]+' '+son.ay.split('-')[0]+' \u00b7 y/y</div></div>'+
      '<div class="card" style="padding:7px 11px"><div class="lbl">12 AY SONRA</div><div class="val" style="font-size:16px">%'+F(pat[11].yillik,2)+
        '</div><div class="sub">varsay\u0131m\u0131n sonucu</div></div>'+
      '<div class="card" style="padding:7px 11px"><div class="lbl">HEDEF \u0130\u00c7\u0130N GEREKEN</div><div class="val" style="font-size:16px">%'+F(ger,2)+
        '</div><div class="sub">ayl\u0131k \u00b7 hedef %'+F(hedef,0)+'</div></div>'+
      '</div>'+
      '<div style="overflow-x:auto"><table class="arzTbl"><thead><tr><th style="width:86px">AY</th><th>AYLIK %</th><th>ENDEKS</th><th>GE\u00c7EN YIL TABANI</th><th>YILLIK %</th></tr></thead><tbody>'+
      pat.map(x=>{const [y,m]=x.ay.split('-');
        return '<tr><td>'+AY[+m]+' '+y.slice(2)+'</td><td>'+F(x.aylik,2)+'</td><td style="color:var(--muted)">'+F(x.endeks,1)+
        '</td><td style="color:var(--muted);font-size:10px">'+(x.taban?F(x.taban,1):'\u2014')+'</td>'+
        '<td style="font-weight:700;color:'+(x.yillik<sonY?'var(--up)':'var(--down)')+'">'+F(x.yillik,2)+'</td></tr>';}).join('')+
      '</tbody></table></div>'+
      '<div class="sub" style="font-size:10px;margin-top:5px">Mevsimsel profil (son 5 y\u0131l ay ortalamas\u0131): '+
        [1,2,3,4,5,6,7,8,9,10,11,12].map(m=>AY[m]+' '+(mevsim[m]!=null?F(mevsim[m],1):'\u2014')).join(' \u00b7 ')+'</div>';
  } else if(el) el.innerHTML='<div class="sub">T\u00dcFE endeks serisi al\u0131namad\u0131.</div>';

  // 3) PPK OLASILIK AĞACI
  const pe=$('thPPK');
  if(pe && P){
    const liste=ppkOku(), pat=ppkPatika(P.deger, liste);
    const fw=TAHMIN.egri;
    /* SS316b: piyasa imasi degiskeni - AYNI fw hesabindan, gorunen notla AYNI
       ay-formatinda yazilir (SS131: yil-ondalik okunmuyordu). Sinyal karti (SS315)
       yalniz OKUR. Ilk deneme atamayi ternary icine virgul-operatoruyle gommustu;
       parantez cok satirli zincirde acik kaldi ve sozdizimi kirildi - atama
       ifade DISINA alindi (basit olan dogruydu). */
    if(fw&&fw.forward&&fw.forward.length){
      window.PIYASA_IMA=fw.forward.slice(0,3).map(x=>Math.round(x.bas*12)+'\u2192'+Math.round(x.bit*12)+' ay %'+F(x.oran,2)).join(' \u00b7 ');
    }
    pe.innerHTML='<div style="overflow-x:auto"><table class="arzTbl"><thead><tr><th style="width:96px">TOPLANTI</th>'+
      PPK_KOLLAR.map(k=>'<th>'+k+'bp</th>').join('')+
      '<th>BEKLENEN</th><th>BEL\u0130RS\u0130ZL\u0130K</th><th>FA\u0130Z</th></tr></thead><tbody>'+
      liste.map((t,i)=>'<tr><td style="font-weight:700">'+t.tarih.slice(5)+'</td>'+
        PPK_KOLLAR.map(k=>'<td style="padding:3px 4px"><input class="arzIn" data-ppk="'+i+'" data-mv="'+k+'" type="text" inputmode="decimal" value="'+(t.p[k]||0)+'" style="width:52px;text-align:right;padding:4px"></td>').join('')+
        '<td style="font-weight:700">'+F(pat[i].beklenenBp,0)+'bp</td>'+
        '<td style="color:var(--muted)">\u00b1'+F(pat[i].sapmaBp,0)+'bp</td>'+
        '<td style="font-weight:700;color:var(--mm2)">%'+F(pat[i].faiz,2)+'</td></tr>'+
        (pat[i].toplam!==100?'<tr><td colspan="'+(PPK_KOLLAR.length+4)+'" class="sub" style="color:var(--down);font-size:10px">\u26a0 '+t.tarih.slice(5)+' olas\u0131l\u0131klar\u0131 topla %'+F(pat[i].toplam,0)+' \u2014 100 olmal\u0131</td></tr>':'')
      ).join('')+'</tbody></table></div>'+
      (fw&&fw.forward.length ? '<div class="note" style="margin-top:9px"><b>Piyasan\u0131n ima etti\u011fi patika (s\u0131f\u0131r alfa senaryosu):</b> getiri e\u011frisinden t\u00fcretilen forward oranlar \u2014 '+
        // §131: '0.54y0.2y' okunmuyordu. Forward oranın ANLAMI "şu tarihten şu tarihe
        // kadarki dönem için bugünden fiyatlanan oran"dır; ay cinsinden yazılınca
        // doğrudan PPK takvimiyle karşılaştırılabilir hale geliyor.
        fw.forward.slice(0,3).map(x=>{
          const ay=(y)=>Math.round(y*12);
          return ay(x.bas)+'\u2192'+ay(x.bit)+' ay <b>%'+F(x.oran,2)+'</b>';
        }).join(' \u00b7 ')+
        '. Kendi tahminin bunlarla AYNIYSA pozisyon almak anlams\u0131zd\u0131r; alfa konsens\u00fcsten SAPMADADIR. Piyasadan h\u0131zl\u0131 indirim bekliyorsan vadeyi uzat (seviyeyi kilitle); yava\u015f bekliyorsan gecelikte/TLREF\u2019e endekside kal.</div>'
        : '<div class="sub" style="margin-top:8px">Getiri e\u011frisi al\u0131namad\u0131 \u2014 piyasa ima patikas\u0131 hesaplanamad\u0131.</div>');
    pe.querySelectorAll('input[data-ppk]').forEach(inp=>inp.addEventListener('change',()=>{
      const l=ppkOku(); const i=+inp.dataset.ppk, k=inp.dataset.mv;
      l[i].p[k]=parseFloat(String(inp.value).replace(',','.'))||0; ppkYaz(l); tahminCiz(); repoCiz(); alfaCiz(); }));
  }
}

function tahminInit(){
  if(!$('thPolitika')) return;
  {const y=$('thYonetim'); if(y&&!y.dataset.b){y.dataset.b='1'; y.addEventListener('input',repoCiz);}}
  ['thAylik','thOlcek','thHedef'].forEach(id=>{const e=$(id); if(e&&!e.dataset.b){e.dataset.b='1';
    e.addEventListener('input',tahminCiz);}});
  const m=$('thMod'); if(m&&!m.dataset.b){m.dataset.b='1'; m.addEventListener('change',()=>{
    const o=$('thOlcekKutu'); if(o)o.style.display = m.value==='mevsim'?'':'none'; tahminCiz(); });}
  tahminYukle();
}


/* ═══════════════════════════════════════════════════════════════════════════
   ENDEKSTEN AYRIŞMA (§151) — performans atıfı
   Soru: "portföyüm endeksten ne kadar ayrıştı, hangi kağıt beni dövdü?"

   ÇEKİRDEK KİMLİK — endeks AĞIRLIKLARI olmadan da tam çalışır:
     r_p − r_b = Σ wᵢ·rᵢ − r_b = Σ wᵢ·(rᵢ − r_b)        [Σwᵢ = 1 olduğunda]
   Yani her hissenin AKTİF GETİRİYE KATKISI = kendi ağırlığı × (kendi getirisi −
   endeks getirisi). Katkıların toplamı aktif getiriye BİREBİR eşittir — yaklaşık
   değil, kimlik. Endeks üye listesi ya da ağırlığı GEREKMEZ.
   Yorumu şudur: "bu hisseyi tutmak yerine endeksi tutsaydım ne olurdu."

   NEDEN AYNI KAYNAK ÖNEMLİ: hem hisse hem endeks getirisi aynı akıştan
   (Yahoo, /api/market) okunur. Farklı kaynaklardan alınsa taban kayması
   aktif getiriyi kirletirdi — §114'te sektör rotasyonunda tam bu yaşandı
   (damgalı sektör vs canlı endeks, her sektöre sistematik +2 puan eklemişti).

   ENDEKS AĞIRLIĞI GEREKTİREN İKİ ŞEY (xk100.json varsa gösterilir):
     · aktif ağırlık = benim ağırlığım − endeks ağırlığı
     · aktif pay (active share) = ½·Σ|wᵢ − wbᵢ|
   Dosya yoksa bu iki satır gizlenir; geri kalan her şey çalışmaya devam eder.
   ═══════════════════════════════════════════════════════════════════════════ */

const AYR_DONEM = [
  {ad:'1G',  alan:'chg', etiket:'Bugün'},
  {ad:'1H',  alan:'h1',  etiket:'Hafta'},
  {ad:'1A',  alan:'a1',  etiket:'Ay'},
  {ad:'3A',  alan:'q3',  etiket:'3 Ay'}
];
/* §164: XU100 çıkarıldı (katılım evreni değil, ağırlığı da yok), yerine üç
   KATILIM endeksi kondu. Kullanıcı "XK050" istedi ama BIST'te öyle bir endeks
   YOK — veri setindeki katılım endeksleri XK100 (100 üye) · XKTUM (242) ·
   XKTMT (34) · XTMTU (90). En dar olanı XKTMT, tepesi XK100 ile aynı. */
const AYR_ENDEKS = [
  {kod:'XKTUM', ad:'BIST Katılım Tüm', dosya:'/xktum.json'},
  {kod:'XK100', ad:'BIST Katılım 100', dosya:'/xk100.json'},
  /* §252m ETIKET SABIT KALMISTI. Uye sayisi 34 diye YAZILIYDI; 9 Agu'da dosya
     resmi listeye gore 39 uyeye cikarildi (JANTS cikti — o XKTUM/XK100 uyesi —,
     AVPGY GENTS KBORU NETCD SDTTR TEZOL girdi) ama etiket 34'te kaldi.
     Artik sayi DOSYADAN okunuyor (uyeSayi), bir daha elle guncellenmesi gerekmez. */
  {kod:'XKTMT', ad:'BIST Katılım (dar)', dosya:'/xktmt.json', uyeSayi:true}
];
let AYR_SIRA = {alan:'katki', yon:-1};   // tablo sıralaması (§164)
/* §159: endeks ağırlıkları artık İKİ endeks için. XK100 (100 üye, dar) ve
   XKTUM (242 üye, geniş — ilk 150'si endeksin %96,5'i).
   ENDAG tek sözlük: {XK100:{...}, XKTUM:{...}}. Ayrışma motoru hangisi
   seçilirse onun ağırlıklarını kullanır; eskiden XK100'e SABİTLENMİŞTİ. */
let ENDAG = null;
async function endeksAgirlikYukle(){
  if(ENDAG !== null) return ENDAG;
  const cek = async (yol)=>{ try{ const r=await fetch(yol,{cache:'no-store'});
    return r.ok ? await r.json() : null; }catch(e){ return null; } };
  const liste = await Promise.all(AYR_ENDEKS.map(e=>cek(e.dosya)));
  ENDAG = {};
  AYR_ENDEKS.forEach((e,i)=>{ ENDAG[e.kod] = liste[i]; });
  return ENDAG;
}
/* Geriye uyum: eski kod window.XK100'e bakıyordu (market akışı kod listesi) */
Object.defineProperty(window,'XK100',{get:()=>ENDAG&&ENDAG.XK100,configurable:true});

/* §152 AKTİF AĞIRLIK ATIFI — doğru kurgu.
   İlk sürüm Σ wᵢ(rᵢ−r_b) kullanıyordu; matematiksel olarak doğruydu ama YANLIŞ
   SORUYU cevaplıyordu. Kullanıcı haklı olarak düzeltti: mesele portföy düzeyi
   değil, HİSSE BAZINDA ENDEKSE GÖRE KONUMLANMA.
     "TUPRS'ın endeks ağırlığı %13, ben %10 tutuyorum → endeks bana bu hisseden
      300 bps fark atıyor"
   DOĞRU KİMLİK:
     r_p − r_b = Σ (wᵢ − wbᵢ)·(rᵢ − r_b)          [Σwᵢ = Σwbᵢ = 1 iken]
   İKİ ÜSTÜNLÜĞÜ:
   1) Endeks ağırlığında tuttuğun hisse SIFIR katkı yapar — doğru, çünkü orada
      aktif bir karar yok. Eski kurgu ona da katkı atfediyordu.
   2) HİÇ TUTMADIĞIN endeks üyeleri de hesaba girer (wᵢ=0, aktif ağırlık = −wbᵢ).
      Eksik ağırlık da bir karardır ve bedeli/getirisi vardır. Eski kurgu bunları
      tamamen görmüyordu.
   EVREN = portföyüm ∪ endeks üyeleri. */
/* §250m: ENDEKS ARŞİVİ — BIST resmî kapanışları (endeks-arsiv.json; günlük
   birikim + 2015'e uzanan ay sonu tohumu). Canlı akış bir dönemi vermiyorsa
   (XKTMT'de 1H/1A/3A boştu) arşivden hesaplanır: son değer / referans tarihe
   en yakın önceki kapanış. Aylık tohum sayesinde 1A/3A/YTD/1Y açılır;
   1H (hafta) günlük veri ister — arşiv doldukça o da gelir. */
let ENDARS=null;
async function endArsivYukle(){
  if(ENDARS!==null) return;
  try{ const r=await fetch('/endeks-arsiv.json',{cache:'no-store'}); ENDARS=r.ok?await r.json():false; }
  catch(e){ ENDARS=false; }
}
const __endArsivBellek={};
function endArsivGetiri(kod, donemAlan){
  if(!ENDARS||!ENDARS.gunler) return null;
  const G=ENDARS.gunler;
  /* §250n: 1.473 günlük arşivi her çağrıda filtreleyip sıralamak sekmeyi
     yavaşlatıyordu (dönem seçici × render). Kod başına bir kez hesaplanır. */
  let gunler=__endArsivBellek[kod];
  if(!gunler){
    /* §250p: arşivde GG/AA/YYYY anahtarlar da olabilir (eski koşular) —
       okurken ISO'ya çevirip öyle sıralanır; panel Actions'ı beklemez. */
    const norm=(t)=>{ const m=String(t).match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})/);
      return m? m[3]+'-'+String(m[2]).padStart(2,'0')+'-'+String(m[1]).padStart(2,'0') : t; };
    const harita={};
    Object.keys(G).forEach(g=>{ if(G[g]&&G[g][kod]>0) harita[norm(g)]=G[g][kod]; });
    gunler=Object.keys(harita).sort();
    __endArsivBellek[kod]=gunler; __endArsivBellek['_v_'+kod]=harita;
  }
  const VAL=__endArsivBellek['_v_'+kod]||{};
  if(gunler.length<2) return null;
  const sonG=gunler[gunler.length-1], son=VAL[sonG];
  const GUN={h1:7,a1:31,q3:92,y1:366};
  let hedef;
  if(donemAlan==='ytd') hedef=sonG.slice(0,4)+'-01-01';
  else { const n=GUN[donemAlan]; if(!n) return null;
    hedef=new Date(new Date(sonG).getTime()-n*86400000).toISOString().slice(0,10); }
  let baz=null;
  for(const g of gunler){ if(g<=hedef) baz=VAL[g]; else break; }
  if(!(baz>0)) return null;
  return (son/baz-1)*100;
}
function ayrismaHesap(donemAlan, endeksKod){
  const m = window.__market;
  if(!m || !m.his || !m.end) return {hata:'canlı fiyat akışı yok'};
  const eEnd = m.end[endeksKod];
  let rB = eEnd ? eEnd[donemAlan] : null;
  let rBKaynak = 'canlı';
  if(rB == null){   /* §250m: canlı yoksa BIST resmî arşiv */
    const a = endArsivGetiri(endeksKod, donemAlan);
    if(a != null){ rB = a; rBKaynak = 'BIST arşiv'; }
  }
  if(rB == null) return {hata:endeksKod+' için bu dönemin getirisi gelmedi (canlı akış ve BIST arşivi boş)'};

  /* §159: eskiden endeksKod==='XK100' diye SABİTLENMİŞTİ; XKTUM seçilse bile
     XK100 ağırlıkları kullanılır ya da hata verirdi. Artık seçilen endeksin
     kendi ağırlık tablosu okunur. */
  const E_ = ENDAG && ENDAG[endeksKod];
  const wbHam = (E_ && E_.uyeler && Object.keys(E_.uyeler).length) ? E_.uyeler : null;
  if(!wbHam) return {hata:'endeks ağırlıkları yok', agirliksiz:true, endeksKod};

  /* Portföy ağırlıkları — HİSSE tarafı üzerinden (nakit/fon hariç).
     Nakit dahil edilseydi Σw < 1 olur ve kimlik bozulurdu; nakit ayrı raporlanır. */
  const canliF = (k)=>(typeof CANLI_FIYAT!=='undefined'&&CANLI_FIYAT[k])?CANLI_FIYAT[k]
                 :((typeof MFIYAT!=='undefined'&&MFIYAT[k])?MFIYAT[k]:null);
  const hisse = {};
  let hisseT = 0;
  (typeof poz!=='undefined'?poz:[]).forEach(p=>{
    if(p.tip!=='hisse' || !p.kod) return;
    const k = String(p.kod).toUpperCase();
    const d = p.adet * (canliF(k) || p.fiyat || 0);
    if(d>0){ hisse[k] = (hisse[k]||0) + d; hisseT += d; }
  });
  if(!hisseT) return {hata:'hisse pozisyonu yok'};

  /* EVREN: portföyüm ∪ endeks üyeleri */
  const evren = new Set(Object.keys(hisse).concat(Object.keys(wbHam)));
  const satir = [], kapsamDisi = [];
  let kapsananAktifW = 0;
  /* §164 TÜM ÜYELER LİSTELENİR. Önceki sürüm iki satırı gizliyordu:
     (a) aktif ağırlığı sıfır olanlar (tam endeks ağırlığında tutulanlar)
     (b) getirisi gelmeyenler — bunlar ayrı bir "kapsam dışı" satırına düşüyordu
     Sonuç: 242 üyeli XKTUM'da ekranda 20-30 satır görünüyordu ve kullanıcı
     "çok azı listeleniyor" dedi. HAKLI: bir endeks tablosunun işi endeksi
     GÖSTERMEKTİR; sıfır katkılı satır da bilgidir ("burada karar vermemişim").
     Artık evrenin TAMAMI basılır; getirisi olmayanlar r=null ile işaretlenir
     ve katkı hesabına GİRMEZ (kimlik bozulmasın). */
  evren.forEach(k=>{
    const w  = (hisse[k]||0)/hisseT;
    const wb = (wbHam[k]||0)/100;
    const aktifW = w - wb;
    if(w===0 && wb===0) return;                      // ne bende ne endekste — hiç ilgisiz
    const c = m.his[k];
    const r = c ? c[donemAlan] : null;
    const tip = (Math.abs(aktifW)<1e-9) ? 'nötr'
              : (w>0 && wb>0) ? (aktifW>0?'fazla':'eksik')
              : (w>0 ? 'endeks dışı' : 'hiç yok');
    if(r == null){
      kapsamDisi.push({kod:k, w, wb, aktifW});
      satir.push({kod:k, w, wb, aktifW, r:null, fark:null, katki:null, tip, veriYok:true});
      return;
    }
    satir.push({kod:k, w, wb, aktifW, r:+r, fark:(+r)-rB, katki:aktifW*((+r)-rB), tip});
    kapsananAktifW += Math.abs(aktifW);
  });
  /* Sıralama kullanıcı seçimine göre; veri olmayanlar HER ZAMAN sona. */
  const S = (typeof AYR_SIRA!=='undefined') ? AYR_SIRA : {alan:'katki', yon:-1};
  satir.sort((a,b)=>{
    if(a.veriYok !== b.veriYok) return a.veriYok ? 1 : -1;
    const x=a[S.alan], y=b[S.alan];
    if(x==null && y==null) return 0;
    if(x==null) return 1; if(y==null) return -1;
    if(typeof x==='string') return S.yon*x.localeCompare(y);
    return S.yon*(x-y);
  });

  const katkiTop = satir.reduce((s,x)=>s+(x.katki||0), 0);
  /* Portföyün kendi getirisi — kapsam bağımsız, doğrudan ağırlıklardan */
  let rP = null, rpW = 0, rpS = 0;
  Object.keys(hisse).forEach(k=>{ const c=m.his[k]; const r=c?c[donemAlan]:null;
    if(r!=null){ const w=hisse[k]/hisseT; rpS += w*(+r); rpW += w; } });
  if(rpW>0) rP = rpS/rpW;

  /* Aktif pay: ½Σ|w−wb| — TÜM evren üzerinden (tutmadıklarım dahil) */
  let aktifPay = 0;
  evren.forEach(k=>{ aktifPay += Math.abs((hisse[k]||0)/hisseT - (wbHam[k]||0)/100); });
  aktifPay = aktifPay/2*100;

  let beta = null, betaKapsam = 0;
  if(typeof MRISK !== 'undefined'){
    let bw=0, wT=0;
    Object.keys(hisse).forEach(k=>{ const rr=MRISK[k];
      if(rr&&isFinite(rr.beta)){ const w=hisse[k]/hisseT; bw+=w*rr.beta; wT+=w; } });
    if(wT>0){ beta=bw/wT; betaKapsam=wT*100; }
  }
  const eksikAktifW = kapsamDisi.reduce((s,x)=>s+Math.abs(x.aktifW), 0);
  return {rP, rB, aktif:(rP!=null?rP-rB:null), satir, kapsamDisi, katkiTop,
          beta, betaKapsam, aktifPay, uyeVar:true, hisseT,
          kapsamOran: (kapsananAktifW+eksikAktifW)>0 ? kapsananAktifW/(kapsananAktifW+eksikAktifW)*100 : 100};
}

function ayrismaCiz(){
  /* §250n SONSUZ DÖNGÜ DÜZELTMESİ: eski hali her çizimde kendini yeniden
     çağırıyordu (ayrismaCiz → then → ayrismaCiz → …) ve sekme kilitleniyordu.
     Artık TEK KEZ tetiklenir; yükleme bitince yalnız bir kez yeniden çizer. */
  if(!window.__endArsivTetik){
    window.__endArsivTetik = 1;
    endArsivYukle().then(()=>{ if(ENDARS) ayrismaCiz(); });
  }
  const el = $('ayrBody'); if(!el) return;
  const endeksKod = ($('ayrEndeks') && $('ayrEndeks').value) || 'XK100';
  let donemAd   = ($('ayrDonem')  && $('ayrDonem').value)  || 'chg';
  /* §247m: XKTMT gibi endekslerde Yahoo tarihsel bar vermiyor — h1/a1/q3
     hesaplanamıyor (günlük meta'dan gelir). 'Gelmedi' hatası göstermek
     yerine dönem seçici, SEÇİLİ ENDEKSİN veri-dolu dönemlerine daraltılır;
     verisiz dönem devre dışı '(veri yok)' etiketiyle. Kalıcı çözüm (endeks
     kapanış arşivi, tazele.mjs) bekleyen işlerde. */
  const mE=(window.__market||{}).end||{}; const eV=mE[($('ayrEndeks')||{}).value]||mE.XK100||{};
  const ds0=$('ayrDonem');
  if(ds0){
    ds0.querySelectorAll('option').forEach(o=>{
      const dolu=(o.value==='chg')||(eV[o.value]!=null)||(endArsivGetiri(($('ayrEndeks')||{}).value||'XKTUM', o.value)!=null);   /* §250m */
      o.disabled=!dolu;
      const temiz=o.textContent.replace(' · veri yok','');
      o.textContent=dolu?temiz:temiz+' · veri yok';
    });
    if(ds0.selectedOptions[0]&&ds0.selectedOptions[0].disabled){ ds0.value='chg'; donemAd='chg'; }
    /* §250o GÖRÜNÜR TANI: dönemler açılmadıysa sebebi ekranda yazsın —
       arşiv yüklendi mi, seçili endeks arşivde var mı, kaç nokta? */
    let tn=document.getElementById('ayrTani');
    if(!tn){ tn=document.createElement('span'); tn.id='ayrTani';
      tn.className='thin'; tn.style.cssText='font-size:9px;margin-left:8px';
      ds0.parentNode.appendChild(tn); }
    const kodT=($('ayrEndeks')||{}).value||'XKTUM';
    if(ENDARS===null) tn.textContent='arşiv yükleniyor…';
    else if(!ENDARS) tn.textContent='arşiv yok (endeks-arsiv.json okunamadı)';
    else { const n=(__endArsivBellek[kodT]||Object.keys(ENDARS.gunler||{}).filter(g=>ENDARS.gunler[g]&&ENDARS.gunler[g][kodT]>0)).length;
      tn.textContent='arşiv: '+kodT+' '+n+' nokta'+(n?'':' — bu endeks arşivde yok'); }
  }
  const D = AYR_DONEM.find(x=>x.alan===donemAd) || AYR_DONEM[0];
  const E = AYR_ENDEKS.find(x=>x.kod===endeksKod) || AYR_ENDEKS[0];
  const R = ayrismaHesap(donemAd, endeksKod);
  const F = (v,d)=>v==null||!isFinite(v)?'—':trN(v, d==null?2:d);
  const bp = (v)=>(v>=0?'+':'')+Math.round(v*10000)+' bps';

  if(R.hata){
    el.innerHTML = '<div class="note">'+esc(R.hata)+
      (R.agirliksiz?' — <b>'+esc(R.endeksKod)+'</b> için üye ağırlıkları yüklü değil. '+
       'Aktif ağırlık atıfı endeks ağırlığı olmadan yapılamaz; şu an yalnız XK100 için ağırlık var.':'')+'</div>';
    return;
  }
  const iyi = R.aktif >= 0;
  el.innerHTML =
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(122px,1fr));gap:8px;margin-bottom:10px">'+
    '<div class="card" style="padding:7px 11px"><div class="lbl">PORTFÖY</div><div class="val '+(R.rP>=0?'up':'down')+'" style="font-size:16px">'+
      (R.rP>=0?'+':'')+F(R.rP)+'%</div><div class="sub">'+D.etiket.toLowerCase()+'</div></div>'+
    '<div class="card" style="padding:7px 11px"><div class="lbl">'+esc(E.kod)+'</div><div class="val '+(R.rB>=0?'up':'down')+'" style="font-size:16px">'+
      (R.rB>=0?'+':'')+F(R.rB)+'%</div><div class="sub">'+esc(E.ad)+'</div></div>'+
    '<div class="card" style="padding:7px 11px;border:1px solid '+(iyi?'var(--up)':'var(--down)')+'">'+
      '<div class="lbl">AYRIŞMA</div><div class="val '+(iyi?'up':'down')+'" style="font-size:16px">'+
      (iyi?'+':'')+F(R.aktif)+'</div><div class="sub">puan · '+(iyi?'endeksi geçtin':'endeksin altında')+'</div></div>'+
    '<div class="card" style="padding:7px 11px"><div class="lbl">AKTİF PAY</div><div class="val" style="font-size:16px">%'+F(R.aktifPay,0)+
      '</div><div class="sub">endeksten sapma</div></div>'+
    /* §153 AĞIRLIK YAŞI. Endeks ağırlıkları serbest dolaşım piyasa değerinden
       türer, dolayısıyla FİYATLARLA BİRLİKTE HER GÜN KAYAR. Üyelik üç ayda bir
       değişir ama ağırlık sürekli. Bayat ağırlıkla hesaplanan aktif ağırlık
       yanıltır — özellikle sert hareket eden bir hisse varsa. Kart yaşı söyler. */
    (()=>{ const t = ENDAG && ENDAG[endeksKod] && ENDAG[endeksKod].tarih;
      if(!t) return '';
      const yas = Math.round((Date.now()-new Date(t+'T00:00:00').getTime())/86400000);
      const uyari = yas>14;
      return '<div class="card" style="padding:7px 11px'+(uyari?';border:1px solid var(--down)':'')+'">'+
        '<div class="lbl">AĞIRLIK YAŞI</div><div class="val" style="font-size:16px;color:'+
        (uyari?'var(--down)':'var(--muted)')+'">'+yas+'g</div>'+
        '<div class="sub">'+esc(t)+(uyari?' · <b>tazele</b>':'')+'</div></div>'; })()+
    '<div class="card" style="padding:7px 11px"><div class="lbl">GROSS BETA</div><div class="val" style="font-size:16px">'+F(R.beta)+
      '</div><div class="sub">'+(R.beta==null?'risk.json yok':'kapsam %'+F(R.betaKapsam,0))+'</div></div>'+
    '</div>'+

    /* §164: sütun başlıkları TIKLANABİLİR. Aynı sütuna ikinci tık yönü çevirir.
       Aktif ok işareti hangi sütunda sıralandığını gösterir. */
    (()=>{ const S=AYR_SIRA;
      const th=(alan,ad,gen)=>'<th'+(gen?' style="width:'+gen+'"':'')+
        ' data-ayrsort="'+alan+'" style="cursor:pointer;user-select:none'+(gen?';width:'+gen:'')+'">'+ad+
        (S.alan===alan?' <span style="color:var(--mm2)">'+(S.yon<0?'▼':'▲')+'</span>':'')+'</th>';
      return '<div style="overflow-x:auto"><table class="arzTbl"><thead><tr>'+
        th('kod','HİSSE','70px')+th('w','BENİM')+th('wb','ENDEKS')+th('aktifW','AKTİF AĞ.')+
        th('r','GETİRİ')+th('fark','ENDEKSE FARK')+th('katki','KATKI')+
        '<th style="width:78px">KONUM</th></tr></thead><tbody>'; })()+
    R.satir.map(x=>{
      const renk = {'fazla':'var(--up)','eksik':'var(--down)','endeks dışı':'var(--mm2)',
                    'hiç yok':'var(--muted)','nötr':'var(--muted)'}[x.tip];
      const yok = x.veriYok;
      const tire = '<span class="thin">—</span>';
      return '<tr'+(yok?' style="opacity:.5"':(x.tip==='nötr'?' style="opacity:.72"':''))+'>'+
      '<td style="font-weight:700">'+esc(x.kod)+'</td>'+
      '<td>'+(x.w>0?F(x.w*100,2)+'%':tire)+'</td>'+
      '<td style="color:var(--muted)">'+(x.wb>0?F(x.wb*100,2)+'%':tire)+'</td>'+
      '<td style="font-weight:700;color:'+(Math.abs(x.aktifW)<1e-9?'var(--muted)':(x.aktifW>0?'var(--up)':'var(--down)'))+'">'+bp(x.aktifW)+'</td>'+
      (yok
        ? '<td colspan="3" style="color:var(--muted);font-size:10px">fiyat akışında yok — katkı hesaplanamadı</td>'
        : '<td class="'+(x.r>=0?'up':'down')+'">'+(x.r>=0?'+':'')+F(x.r)+'%</td>'+
          '<td class="'+(x.fark>=0?'up':'down')+'">'+(x.fark>=0?'+':'')+F(x.fark)+'</td>'+
          '<td style="font-weight:700;color:'+(x.katki>=0?'var(--up)':'var(--down)')+'">'+(x.katki>=0?'+':'')+F(x.katki,3)+'</td>')+
      '<td style="font-size:10px;color:'+renk+'">'+x.tip+'</td></tr>';
    }).join('')+
    '<tr style="border-top:2px solid var(--line2)"><td colspan="6" style="font-weight:700">KAPSANAN TOPLAM</td>'+
    '<td style="font-weight:700">'+(R.katkiTop>=0?'+':'')+F(R.katkiTop,3)+'</td><td></td></tr>'+
    '</tbody></table></div>'+

    '<div class="note" style="margin-top:9px"><b>Her satır bir POZİSYON KARARIDIR.</b> '+
    'Kimlik: r<sub>p</sub> − r<sub>b</sub> = Σ (w<sub>i</sub> − wb<sub>i</sub>)·(r<sub>i</sub> − r<sub>b</sub>). '+
    'Endeks ağırlığında tuttuğun hisse <b>sıfır katkı</b> yapar — orada aktif bir karar yoktur. '+
    'Katkı iki şeyin çarpımıdır: <em>ne kadar saptığın</em> (aktif ağırlık) × <em>hissenin endeksi ne kadar dövdüğü</em>. '+
    'Dolayısıyla dört durum var: fazla tutup kazandıran ✓ · fazla tutup kaybettiren ✗ · '+
    '<b>eksik tutup kazandıran</b> (hisse düştü, sen az tuttun → ✓) · <b>eksik tutup kaybettiren</b> '+
    '(hisse uçtu, sen az tuttun → ✗). Son ikisi <em>hiç tutmadığın</em> endeks üyelerini de kapsar; '+
    'almamak da bir karardır.</div>'+

    '<div class="sub" style="font-size:10.5px;margin-top:6px">'+R.satir.length+' satır — endeks üyelerinin TAMAMI + portföydeki endeks dışı isimler. '+
      'Aktif ağırlığı sıfır olanlar (<b>nötr</b>) soluk gösterilir: orada karar vermemişsin, katkı da sıfır. '+
      '<b>Sütun başlığına tıklayarak sıralayabilirsin</b> (tekrar tıklama yönü çevirir).</div>'+
    /* §165 TEŞHİS: kaç sembol istendi, kaç tanesi geldi. Eksiklik iki sebepten
       olabilir ve ikisi TAMAMEN FARKLI müdahale ister:
         (a) ?his= gönderilmiyor / eski api/market.js deploy edilmiş → sunucu
             sabit 40 kodla dönüyor, istenen sayı 0 görünür
         (b) gönderiliyor ama Yahoo o sembolü bulamıyor → istenen yüksek,
             dönen düşük
       Bunu ekranda söylemezsek her seferinde koda bakmak gerekir. */
    (()=>{ const K=window.__marketKapsam;
      if(!K) return '';
      const eski = !K.istenen || K.donen===40;
      return '<div class="note" style="margin-top:7px'+(eski?';border-left:3px solid var(--down)':'')+'">'+
        '<b>Fiyat akışı:</b> '+K.istenen+' sembol istendi, sunucu '+(K.donen==null?'? ':K.donen)+' döndürdü'+
        (K.kirpilan?' ('+K.kirpilan+' kırpıldı — sınır aşıldı)':'')+'. '+
        (eski?'<b style="color:var(--down)">⚠ Sunucu sabit listeyle dönüyor — api/market.js\'in yeni sürümü deploy edilmemiş olabilir '+
              '(?his= parametresi §155\'te eklendi).</b>'
             :'İstenen ile dönen arasındaki fark, Yahoo\'da karşılığı bulunamayan sembollerdir.')+
        '</div>'; })()+
    (R.kapsamDisi.length?'<div class="note" style="margin-top:7px"><b>Kapsam %'+F(R.kapsamOran,0)+'.</b> '+
      R.kapsamDisi.length+' endeks üyesinin bu dönem getirisi akışta yok, katkıları hesaplanamadı: '+
      R.kapsamDisi.slice(0,14).map(x=>esc(x.kod)+' ('+bp(x.aktifW)+')').join(' · ')+
      (R.kapsamDisi.length>14?' … +'+(R.kapsamDisi.length-14):'')+
      '. <b>Bu yüzden "kapsanan toplam" ayrışmaya birebir eşit değildir</b> — eksik olan bu isimlerin katkısıdır. '+
      'Market akışı §155\'te genişletildi; kapsam hâlâ düşükse eksik isimler Yahoo\'da işlem görmüyor olabilir.</div>':'');
  /* §156: grafik ÇAĞRILMIYORDU — tanımlıydı ama hiçbir yerden tetiklenmiyordu,
     kutu boş kalıyordu. node --check bunu görmez (fonksiyon geçerli, sadece ölü).
     Ders §136'nın kardeşi: "tanımlı" ile "çalışıyor" ayrı şeyler. */
  /* §164: sütun başlığına tıklayınca sırala. Aynı sütuna tekrar tıklamak yönü çevirir. */
  el.querySelectorAll('th[data-ayrsort]').forEach(th=>th.addEventListener('click',()=>{
    const a=th.dataset.ayrsort;
    if(AYR_SIRA.alan===a) AYR_SIRA.yon = -AYR_SIRA.yon;
    else AYR_SIRA = {alan:a, yon: a==='kod' ? 1 : -1};   // kod alfabetik artan, sayılar azalan
    ayrismaCiz();
  }));
  try{ ayrGrafik(endeksKod); }catch(e){ console.warn('[KTPanel] ayrGrafik:',(e&&e.message)||e); }
}

function ayrismaInit(){
  if(!$('ayrBody')) return;
  const es = $('ayrEndeks');
  if(es && !es.dataset.dolu){ es.dataset.dolu='1';
    /* §252m uyeSayi bayragi: etiketteki uye sayisi DOSYADAN okunur, sabit yazilmaz.
       ENDAG o an yuklu degilse sayisiz ada duser — yanlis sayi yerine sayisiz etiket. */
    es.innerHTML = AYR_ENDEKS.map(x=>'<option value="'+x.kod+'">'+x.kod+' — '+x.ad+'</option>').join('');   // sayi ayrEtiketTazele'de eklenir
    es.addEventListener('change', ayrismaCiz); }
  const ds = $('ayrDonem');
  if(ds && !ds.dataset.dolu){ ds.dataset.dolu='1';
    ds.innerHTML = AYR_DONEM.map(x=>'<option value="'+x.alan+'">'+x.etiket+' ('+x.ad+')</option>').join('');
    ds.addEventListener('change', ayrismaCiz); }
  /* §252m-DUZELTME (10 Agu): uyeSayi etiketi ILK YAZIMDA CALISMIYORDU.
     Sebep SIRALAMA: es.innerHTML yukarida kuruluyor ama ENDAG asagidaki
     endeksAgirlikYukle() ile SONRA doluyor — o an null. Ustune dataset.dolu
     bayragi ikinci doldurmayi engelledigi icin etiket sonsuza kadar sayisiz
     kalirdi. (§247c ile ayni sinif: kod dogru, ZAMANLAMA yanlis.)
     Cozum: ENDAG geldikten SONRA yalniz option METNINI tazele. */
  endeksAgirlikYukle().then(()=>{ ayrEtiketTazele(); ayrismaCiz(); });
}
function ayrEtiketTazele(){
  const es=$('ayrEndeks'); if(!es||!ENDAG) return;
  AYR_ENDEKS.forEach(x=>{
    if(!x.uyeSayi) return;
    const d=ENDAG[x.kod];
    const n=d&&(d.toplam_uye||(d.uyeler&&Object.keys(d.uyeler).length));
    if(!n) return;
    const o=es.querySelector('option[value="'+x.kod+'"]');
    if(o) o.textContent=x.kod+' — '+x.ad.replace(/\)$/,' · '+n+')');
  });
}

/* ── GÜNLÜK BİRİKİM (§151) ────────────────────────────────────────────────────
   "Her gün sonunda otomatik getiri karşılaştırması güncellensin."
   Panel her açılışta o günün portföy ve endeks getirisini kaydeder; gün
   değişince yeni satır açılır, aynı gün içinde üstüne yazar. Bulut anahtarına
   eklendiği için diğer cihazda da aynı seri görünür.
   NEDEN GÜNLÜK GETİRİ SAKLANIYOR, KÜMÜLATİF DEĞİL: kümülatif saklamak, bir gün
   panel açılmazsa kalıcı boşluk bırakır. Günlükler saklanıp kümülatif ÇİZİM
   ANINDA bileşiklenir — eksik gün yalnız o günü kaçırır, seriyi bozmaz.
   BİLEŞİK, TOPLAMA DEĞİL: Π(1+r) − 1. Günlük getirileri toplamak 3 ayda
   yarım puana varan sapma verir. */
const AYR_SERI_KEY = 'ayr_seri_v1';
function ayrSeriOku(){ try{ const s=JSON.parse(localStorage.getItem(AYR_SERI_KEY)||'[]');
  return Array.isArray(s)?s:[]; }catch(e){ return []; } }
function ayrSeriYaz(l){ try{ localStorage.setItem(AYR_SERI_KEY, JSON.stringify(l.slice(-400))); }catch(e){} }

function ayrGunKaydet(endeksKod){
  const R = ayrismaHesap('chg', endeksKod||'XK100');
  if(R.hata) return null;
  const bugun = new Date().toISOString().slice(0,10);
  let s = ayrSeriOku();
  const kayit = {d:bugun, p:+R.rP.toFixed(4), b:+R.rB.toFixed(4), e:endeksKod||'XK100', n:R.satir.length};
  const i = s.findIndex(x=>x && x.d===bugun && x.e===kayit.e);
  if(i>=0) s[i]=kayit; else s.push(kayit);
  s = s.filter(x=>x&&x.d).sort((a,b)=>a.d<b.d?-1:1);
  ayrSeriYaz(s);
  return s;
}
/* Kümülatif bileşik seri: [{d, kp, kb, fark}] */
function ayrKumulatif(endeksKod){
  const s = ayrSeriOku().filter(x=>x.e===endeksKod);
  let cp=1, cb=1;
  return s.map(x=>{ cp*=(1+x.p/100); cb*=(1+x.b/100);
    return {d:x.d, kp:(cp-1)*100, kb:(cb-1)*100, fark:(cp-cb)*100}; });
}
function ayrGrafik(endeksKod){
  const el = $('ayrGrafik'); if(!el) return;
  const K = ayrKumulatif(endeksKod);
  if(K.length < 2){
    el.innerHTML = '<div class="sub" style="font-size:11px">Kümülatif ayrışma eğrisi için en az 2 günlük kayıt gerekir. '+
      'Panel her açılışta o günün getirisini biriktirir'+(K.length?' (şu an 1 gün var)':'')+'.</div>';
    return;
  }
  const W=680,H=150,L=44,R=12,T=10,B=24;
  const hepsi = K.flatMap(x=>[x.kp,x.kb]);
  let y0=Math.min.apply(null,hepsi), y1=Math.max.apply(null,hepsi);
  const pad=(y1-y0)*0.15||1; y0-=pad; y1+=pad;
  const px=i=>L+(K.length<2?0:i/(K.length-1))*(W-L-R), py=v=>H-B-(v-y0)/(y1-y0)*(H-T-B);
  let g='';
  for(let i=0;i<=3;i++){ const yv=y0+(y1-y0)*i/3, Y=py(yv);
    g+='<line x1="'+L+'" y1="'+Y.toFixed(1)+'" x2="'+(W-R)+'" y2="'+Y.toFixed(1)+'" stroke="var(--line)" stroke-width="0.6"/>'+
       '<text x="'+(L-5)+'" y="'+(Y+3.5).toFixed(1)+'" text-anchor="end" font-size="9" fill="var(--muted)" font-family="var(--mono)">'+trN(yv,1)+'</text>'; }
  const cizgi=(alan,renk,kalin)=>{ let d='';
    K.forEach((x,i)=>{ d+=(i?'L':'M')+px(i).toFixed(1)+' '+py(x[alan]).toFixed(1); });
    return '<path d="'+d+'" fill="none" stroke="'+renk+'" stroke-width="'+kalin+'"/>'; };
  g+=cizgi('kb','#8896A5',1.3)+cizgi('kp','var(--mm2)',2.1);
  const son=K[K.length-1];
  g+='<circle cx="'+px(K.length-1).toFixed(1)+'" cy="'+py(son.kp).toFixed(1)+'" r="3" fill="var(--mm2)"/>';
  g+='<text x="'+(L+2)+'" y="'+(T+9)+'" font-size="9" font-family="var(--mono)" fill="var(--mm2)" font-weight="700">portföy '+
     (son.kp>=0?'+':'')+trN(son.kp,2)+'%</text>';
  g+='<text x="'+(L+150)+'" y="'+(T+9)+'" font-size="9" font-family="var(--mono)" fill="#8896A5">'+esc(endeksKod)+' '+
     (son.kb>=0?'+':'')+trN(son.kb,2)+'%</text>';
  el.innerHTML='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto;display:block">'+g+'</svg>'+
    '<div class="sub" style="font-size:10.5px;margin-top:4px">'+K.length+' işlem günü · '+K[0].d+' → '+son.d+
    ' · kümülatif ayrışma <b class="'+(son.fark>=0?'up':'down')+'">'+(son.fark>=0?'+':'')+trN(son.fark,2)+' puan</b>'+
    ' <span class="thin">· günlük getiriler bileşiklenir (toplanmaz)</span></div>';
}

/* §193b CANLI HİÇ GELMEZSE. Bekleme durumu yalnız canliEnjekte içinde
   kalkıyor; market çağrısı tamamen düşerse sayfa sonsuza kadar nabızlı kalır
   ve kullanıcı ne olduğunu anlamaz. 20 saniye sonra durum kaldırılır AMA
   damgalara KALICI bir uyarı basılır — "canlı veri gelmedi, ekrandakiler
   damgalı yedek". Sessizce normale dönmek en kötüsü olurdu: eski rakam
   güncel görünürdü (§143). */
setTimeout(()=>{
  if(!document.body.classList.contains('veri-bekliyor')) return;
  document.body.classList.remove('veri-bekliyor');
  document.body.classList.add('canli-yok');
  document.querySelectorAll('.tag').forEach(t=>{
    if(t.textContent.indexOf('DAMGALI')>=0) return;
    t.style.background='var(--down)';
    t.textContent='DAMGALI YEDEK · '+t.textContent;
  });
  console.warn('[KTPanel] canlı veri 20 sn içinde gelmedi — damgalı yedek gösteriliyor');
}, 20000);

/* ==== KTPanel BOOT — tek merkezi başlatma (TDZ-güvenli, hata-izole, sağlık kontrollü) ==== */
/* ==== Bulut senkron (paylaşımlı ortak depo) ==== */
const CLOUD_KEYS=['__sil_guidance_v1','poz_v1','journal_v1','guidance_v1','ktp_sukuk_kayit_v1','trk_seri_v1','ktp_arz_kayit_v1','rb_ayar_v1','trk_baz_v1','fm_agirlik_v1','tk_cizgi_v1','ppk_olasilik_v1','ktp_portfoyler_v1','ayr_seri_v1',
  /* §200: parite geçmişi buluta bağlandı. Günlük snapshot biriktiriyor ve
     120 kayıtla sınırlı (~4 ay); tarayıcı değişince SIFIRLANIYORDU ve o
     geçmiş bir daha kurulamıyordu — geriye dönük hesaplanamaz, yalnız
     günü gününe birikir. Yük: kayıt başına ~45 B, 120 kayıt ≈ 5 KB;
     900 KB sınırının binde biri.
     ktp_mail_to da eklendi (tercih, gizli değil).
     ktp_cron_k EKLENMEDİ: o bir ANAHTAR. Sırlar cihazdan cihaza dolaşmaz;
     kaybolursa yeniden üretilir, sızarsa geri alınamaz. */
  'parite_gecmis_v1','ktp_mail_to',
  /* §222: ONAYLANAN kart taslakları. inceleme-ai.json repo'da ve tarayıcıdan
     yazılamaz; onaylanan kartlar buluta gider ve dosyayla BİRLEŞTİRİLİR.
     Böylece deploy beklemeden Earnings AI'da görünür. Kalıcı hâle gelince
     dosyaya işlenir ve buluttan silinir. */
  'ktp_taslak_kart_v1',
  /* §265 BILANCO YOKSAYMA LISTESI. Kart bekleyen liste KAP'tan turetilir;
     kullanici 29 sirketin hepsinin kartini yazmak istemez. Gizlenenler
     kod+donem kapsaminda burada tutulur. Cihazlar arasi tasinmali — yoksa
     her cihazda ayni sirketleri tek tek gizlemek gerekir. */
  'ktp_bilanco_yoksay_v1'];   // sukuk + model sicili de buluta
const _origSet=localStorage.setItem.bind(localStorage);
const _origGet=localStorage.getItem.bind(localStorage);
let _cloudTimer;
/* Hangi profilin verisi ŞU AN yerel depoda duruyor. Buluta GİTMEZ (CLOUD_KEYS'te
   yok) — tarayıcıya ait bir iz, veri değil. §140'ın çekirdeği bu tek satır. */
const PROFIL_IZ='ktp_aktif_profil';
async function cloudLoad(){
  try{
    const r=await fetch('/api/data',{cache:'no-store'});
    const d=await r.json();
    /* §200b BULUT KAPALIYSA SÖYLE.
       api/data.js, Upstash/KV env'i yoksa 503 + açık mesaj dönüyor:
       "Depo yapılandırılmamış — KV_REST_API_URL/TOKEN eksik".
       Panel bunu yutuyordu: kayıtlar yalnız tarayıcıda kalıyor, kullanıcı
       senkron sanıyor. Cihaz değiştirince veri "kayboluyor" gibi görünür —
       oysa hiç gitmemiştir.
       Artık pencere üstünde kalıcı uyarı çıkar. Sessiz kalmak, veri kaybının
       fark edilmediği tek durumdur. */
    if(d && d.error){
      window.__bulutDurum={acik:false, sebep:String(d.error).slice(0,120)};
      try{ const u=$('bulutUyari');
        if(u){ u.style.display='block';
          u.innerHTML='<b>⚠ Bulut deposu kapalı.</b> Kayıtların YALNIZ bu tarayıcıda tutuluyor — '+
            'cihaz değiştirirsen gitmiş görünür. <span class="thin">'+esc(String(d.error).slice(0,110))+'</span>'; }
      }catch(e){}
      return;
    }
    window.__bulutDurum={acik:true};
    if(d&&typeof d==='object'&&!d.error){
      /* §140 KULLANICI SIZINTISI DÜZELTMESİ.
         localStorage ORIGIN başınadır, OTURUM başına değil. Aynı tarayıcıda
         furkan çıkıp emre girdiğinde depo hâlâ furkan'ın verisiyle doludur.
         Aşağıdaki iki koruma ("bulutta yoksa dokunma", "bulut boş + yerel dolu
         → yereli koru") geçici bulut arızasına karşı doğrudur — AMA profil
         değişiminde ters teper: emre'nin kutusu boşsa furkan'ın verisi yerelde
         KALIR, emre onu görür, ve emre bir şey değiştirdiğinde cloudSave TÜM
         anahtarları yazdığı için furkan'ın verisi EMRE'NİN KUTUSUNA KOPYALANIR.
         ÇÖZÜM: profil değiştiyse yerel CLOUD_KEYS'i ÖNCE SİL, sonra bulutu
         KOŞULSUZ uygula. Aynı profilde eski korumalar aynen geçerli kalır. */
      const yeniProfil = d.__profil || '';
      const eskiProfil = _origGet(PROFIL_IZ);
      const profilDegisti = (eskiProfil!==null && eskiProfil!==yeniProfil);
      if(profilDegisti){
        CLOUD_KEYS.forEach(k=>{ try{ localStorage.removeItem(k); }catch(e){} });
        console.warn('[KTPanel] profil değişti ('+(eskiProfil||'—')+' → '+(yeniProfil||'—')+
          ') — yerel depo temizlendi, veri buluttan yeniden yüklenecek.');
      }
      let yazilan=0;
      CLOUD_KEYS.forEach(k=>{
        const bulut=d[k];
        if(bulut==null) return;                     // bulutta yok → (profil değiştiyse zaten silindi)
        if(!profilDegisti){                          // AYNI profil → eski korumalar geçerli
          let yerel=null; try{ yerel=JSON.parse(_origGet(k)||'null'); }catch(e){}
          const bSay=Array.isArray(bulut)?bulut.length:0, ySay=Array.isArray(yerel)?yerel.length:0;
          if(bSay===0&&ySay>0) return;               // bulut boş, yerel dolu → YERELİ KORU
          /* §264 TASLAK KARTLAR BİRLEŞTİRİLİR, EZİLMEZ.
             ÖLÇÜLDÜ (12 Ağu): ZERGY kartı onaylandı, localStorage'a YAZILDI
             ("✓ Earnings AI'a eklendi" mesajı çıktı, kayıt doğrulandı) ama
             SAYFA YENİLENİNCE KAYBOLDU.
             SEBEP: cloudSaveDebounced 900 ms bekler. O süre dolmadan yenileme
             yapılırsa kayıt buluta HİÇ GİTMEZ; cloudLoad bulutdaki ESKİ listeyi
             (8 kart) yerelin ÜSTÜNE yazar (9 kart) ve yeni kart silinir.
             Üstteki koruma bunu yakalamıyordu: yalnız bulut TAMAMEN BOŞken
             devreye giriyor (bSay===0). Burada bSay=8, ySay=9 → koşul tutmadı.
             ÇÖZÜM: taslak kartlar İÇERİK ANAHTARIYLA (kod+dönem) birleştirilir;
             her iki taraftaki kayıt korunur, çakışmada YENİ olan (_onay damgası)
             kazanır. Bu anahtar EKLEMELİ bir liste — silme zaten 🗑 ile açıkça
             yapılıyor ve o anda buluta yazılıyor (§256). */
          if(k==='ktp_taslak_kart_v1' && Array.isArray(bulut) && Array.isArray(yerel) && ySay){
            const anahtar=x=>String(x&&x.kod||'')+'|'+String(x&&x.donem||'');
            const harita=new Map();
            for(const x of bulut) if(x&&x.kod) harita.set(anahtar(x),x);
            for(const x of yerel){
              if(!x||!x.kod) continue;
              const a=anahtar(x), v=harita.get(a);
              /* Çakışma: _onay damgası YENİ olan kazanır; damgasız olan kaybeder */
              if(!v || String(x._onay||'') > String(v._onay||'')) harita.set(a,x);
            }
            const birlesik=[...harita.values()]
              .sort((a,b)=>String(b._onay||'').localeCompare(String(a._onay||'')))
              .slice(0,60);
            _origSet(k,JSON.stringify(birlesik)); yazilan++;
            if(birlesik.length!==bSay) console.info('[KTPanel] §264 taslak kartlar birleştirildi: bulut '+bSay+' + yerel '+ySay+' → '+birlesik.length);
            return;
          }
        }
        _origSet(k,JSON.stringify(bulut)); yazilan++;
      });
      _origSet(PROFIL_IZ, yeniProfil);              // iz güncellenir (senkronlanmaz)
      window.KTP_PROFIL=d.__profil||null;
      window.KTP_AD=d.__ad||null; kullaniciAdGoster();
      window.KTP_BULUT_DURUM='\u2601 '+yazilan+' kayıt kümesi buluttan yüklendi'+
        (d.__profil?' \u00b7 profil: '+d.__profil:'')+(profilDegisti?' \u00b7 profil değişti, depo tazelendi':'');
      profilGoster();
      return true;
    }
  }catch(e){}
  return false;
}
async function cloudSave(){
  const wkey=_origGet('ktpanel_wkey')||'';
  if(!wkey)return;
  const payload={};CLOUD_KEYS.forEach(k=>{try{payload[k]=JSON.parse(_origGet(k)||'null');}catch(e){payload[k]=null;}});
  /* §139 YÜK BOYUTU DENETİMİ — sessiz senkron kaybına karşı.
     Kaydedilmiş portföyler (ktp_portfoyler_v1) TAM POZİSYON DİZİSİNİ saklar;
     40 kayıt birikince yük hızla büyür. KV değer sınırı aşılırsa POST reddedilir
     ve kullanıcı BUNU FARK ETMEZ — ekranda hâlâ eski "senkron" damgası durur.
     Artık gönderimden ÖNCE ölçülüyor: eşiğe yaklaşınca uyarır, aşarsa GÖNDERMEZ
     ve hangi anahtarın şiştiğini söyler. Sessizce başarısız olmaktansa açıkça durmak. */
  try{
    const boy=new Blob([JSON.stringify(payload)]).size, LIMIT=900000;   // KV değer sınırına pay bırak
    if(boy>LIMIT){
      const enBuyuk=CLOUD_KEYS.map(k=>({k,b:new Blob([JSON.stringify(payload[k]||null)]).size}))
        .sort((x,y)=>y.b-x.b)[0];
      const m='⚠ Bulut yükü '+Math.round(boy/1024)+' KB — sınır aşıldı, GÖNDERİLMEDİ. '+
        'En büyük: '+enBuyuk.k+' ('+Math.round(enBuyuk.b/1024)+' KB). Eski kayıtları sil.';
      if($('wkeyMsg'))$('wkeyMsg').textContent=m;
      window.KTP_BULUT_DURUM='⚠ yük sınırı aşıldı — senkron durdu';
      console.error('[KTPanel] cloudSave: '+m); return;
    }
    if(boy>LIMIT*0.7&&$('wkeyMsg'))
      $('wkeyMsg').textContent='☁ yük '+Math.round(boy/1024)+' KB — sınıra yaklaşıyor';
  }catch(e){}
  try{const r=await fetch('/api/data',{method:'POST',headers:{'Content-Type':'application/json','X-Write-Key':wkey},body:JSON.stringify(payload)});
    let j=null; try{ j=await r.json(); }catch(e){}
    if($('wkeyMsg'))$('wkeyMsg').textContent = r.ok ? ('buluta kaydedildi \u2713'+(j&&j.kayit!=null?' ('+j.kayit+' kayıt)':''))
      : ((j&&j.error)? j.error.slice(0,60) : 'kayıt reddedildi (anahtar?)');
    window.KTP_BULUT_DURUM = r.ok ? '☁ senkron '+new Date().toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'}) : '⚠ bulut yazılamadı';
  }catch(e){}
}
function cloudSaveDebounced(){clearTimeout(_cloudTimer);_cloudTimer=setTimeout(cloudSave,900);}
localStorage.setItem=function(k,v){_origSet(k,v);if(CLOUD_KEYS.indexOf(k)>=0)cloudSaveDebounced();};
/* ── Profil göstergesi + yedekten geri yükleme (çok kullanıcılı depo) ──
   Profil middleware'in doğruladığı oturum çerezinden gelir; istemci belirleyemez.
   Profil yoksa (koruma kapalı) depo eski ORTAK moddadır — o zaman iki kişi yine
   birbirini ezer, uyarı bunu görünür kılar. */
/* ── Başlıktaki kullanıcı adı (§109) ── eskiden sabit yazılıydı.
   İki kaynak, şu sırayla: (1) ktp_ad çerezi — anında, ağ gerekmez, KV kapalıysa
   da çalışır; (2) /api/data yanıtındaki __ad — çerez silinmişse yedek.
   Çerez yetki TAŞIMAZ, sadece etikettir; yetkiyi imzalı oturum çerezi taşır. */
function cerezOku(ad){
  const p=document.cookie.split(/;\s*/).find(x=>x.indexOf(ad+'=')===0);
  if(!p) return null;
  try{ return decodeURIComponent(p.slice(ad.length+1)) || null; }catch(e){ return null; }
}
function kullaniciAdGoster(){
  const el=$('kullaniciAd'); if(!el) return;
  const ad = cerezOku('ktp_ad') || window.KTP_AD || window.KTP_PROFIL || null;
  el.textContent = ad ? String(ad).toLocaleUpperCase('tr') : '·';
  el.title = ad ? 'Oturum: '+ad : 'Giriş koruması kapalı';
}
function profilGoster(){
  const el=$('profilSatir'); if(!el)return;
  const p=window.KTP_PROFIL;
  el.innerHTML = p
    ? 'Profil: <b style="color:var(--mm2)">'+esc(p)+'</b> \u00b7 kişisel kayıtların ayrı tutuluyor'
    : '<span style="color:var(--down)">\u26a0 Profil yok \u2014 ORTAK moddasın.</span> Kayıtlar tek kutuda; iki cihazdan yazarsanız son yazan diğerini ezer. Vercel env\u0027e <b>PANEL_USERS</b> ekle.';
}
async function yedekGetir(url, etiket){
  const el=$('yedekMsg'); if(el)el.textContent='alınıyor…';
  try{
    const r=await fetch(url,{cache:'no-store'});
    const d=await r.json();
    if(!d||d.error){ if(el)el.textContent=(d&&d.error)||'okunamadı'; return; }
    const ozet=CLOUD_KEYS.map(k=>{const v=d[k];const n=Array.isArray(v)?v.length:(v?1:0);return n?k+': '+n:null;}).filter(Boolean);
    if(!ozet.length){ if(el)el.textContent=etiket+' \u2014 içinde kayıt yok.'; return; }
    if(!confirm(etiket+'\n\n'+ozet.join('\n')+'\n\nBu kayıtlar cihazına yazılacak ve buluta senkronlanacak.\nMEVCUT kayıtlarının üzerine yazılır. Devam edilsin mi?')){ if(el)el.textContent='iptal edildi'; return; }
    let n=0; CLOUD_KEYS.forEach(k=>{ if(d[k]!=null){ localStorage.setItem(k,JSON.stringify(d[k])); n++; } });
    if(el)el.textContent=n+' kayıt kümesi geri yüklendi — sayfa yenileniyor…';
    setTimeout(()=>location.reload(),1400);
  }catch(e){ if(el)el.textContent='hata: '+((e&&e.message)||e); }
}
function wkeyKaydet(){
  const v=($('wkeyInput')?$('wkeyInput').value:'').trim();
  _origSet('ktpanel_wkey',v);
  if($('wkeyMsg'))$('wkeyMsg').textContent = v ? 'anahtar kaydedildi — buluta yazılıyor…' : 'anahtar silindi (okuyucu modu)';
  if(v) cloudSave();          // anahtar girilince HEMEN yaz (test için beklemeye gerek yok)
}

async function boot(){
  await cloudLoad();
  try{if(typeof poz!=='undefined')poz=JSON.parse(_origGet('poz_v1')||'[]');}catch(e){}
  try{if(typeof jrnl!=='undefined')jrnl=JSON.parse(_origGet('journal_v1')||'[]');}catch(e){}
  try{if(typeof guidanceManuel!=='undefined')guidanceManuel=JSON.parse(_origGet('guidance_v1')||'[]');}catch(e){}
  try{if(typeof renderPoz==='function')renderPoz();}catch(e){}
  try{if(typeof renderJ==='function')renderJ();}catch(e){}
  const wi=$('wkeyInput'); if(wi){wi.value=_origGet('ktpanel_wkey')||'';const wb=$('wkeyKaydet');if(wb)wb.addEventListener('click',wkeyKaydet);}
  profilGoster(); kullaniciAdGoster();
  const yb=$('yedekYukle'); if(yb)yb.addEventListener('click',()=>{
    const g=($('yedekGun')&&$('yedekGun').value)||'';
    if(!g){ if($('yedekMsg'))$('yedekMsg').textContent='önce bir gün seç'; return; }
    yedekGetir('/api/data?yedek='+encodeURIComponent(g), g+' yedeği'); });
  const eb=$('eskiKutu'); if(eb)eb.addEventListener('click',()=>
    yedekGetir('/api/data?eski=1','Eski ortak kutu (profil ayrımından önceki tek kutu)'));
  const moduller=[
    ['Katılım Fon', katfonInit],
    ['Sektör', sektorInit],
    ['Yabancı Akış', yabanciInit],
    ['Halka Arz', halkaarzInit],
    ['Halka Arz Değerleme', arzInit],
    /* §171: ABD kazanç takvimi BOOT'ta çağrılır. §163'te "t1 açılınca tembel
       yükle" yapmıştım — ama t1 VARSAYILAN AÇIK SEKME (class="tab act").
       Kullanıcı ona hiç TIKLAMIYOR, dolayısıyla tetikleyici hiç ateşlenmiyordu
       ve kart tamamen kayboldu. Tembel yükleme, varsayılan sekmede ANLAMSIZDIR.
       Sekme tıklamasındaki tetikleyici duruyor (başka sekmeden dönünce), ama
       asıl yükleme burada — bayrak ikisini de tek çağrıya indiriyor. */
    ['ABD Kazanç Takvimi', ()=>{ if(!kazancYuklendi){ kazancYuklendi=true;
      if(typeof kazancTakvimCanli==='function') return kazancTakvimCanli(); } }],
    ['Teknik', teknikInit],
    ['Omurga (reel·tez·risk)', omurgaInit],
    ['Guidance', guidanceInit],
    ['DCF', dcfInit],
    ['Multiple', multipleInit],
    ['Sukuk', sukukInit],
    ['Veri Tazeliği', planInit],
    ['Takvim satırları (§245)', takvimSatirlari],
    ['Equity', pyInit],
    ['Sukuk Sinyali', sinyalRender],   /* SS315 */
    ['Makro Takvim', makroTakvimRender],   /* SS319 */
    ['Eğri Görseli', egriGorselRender],   /* SS320 */
    ['Haberler', ()=>{if(!haberLoaded){haberLoaded=true;haberInit();}}],
    ['Earnings AI', incelemeInit],
    ['Yabancı Hisse evreni', yevrenInit],
    ['PYŞ Sektör', pysInit],
    ['TÜFE harcama grupları', ()=>setTimeout(hrcCek,5200)],
    ['Yİ-ÜFE detayı', ()=>setTimeout(ufeCek,5500)],
    /* §245: ['İnceleme AI', aiInit] KALDIRILDI — fonksiyon ölüydü, silindi. */
    ['Canlı AOFM', aofmHizli],   /* SS318 */
    ['Haftalık yorum panosu', ()=>setTimeout(yorumPano,2500)],
    ['Taktiksel duruş', ()=>setTimeout(taktikRender,2800)],
    ['ABD sekmesi', ()=>setTimeout(abdSekme,3000)],
    ['Japonya makro', ()=>setTimeout(jpMakro,3200)],
    ['Hong Kong makro', ()=>setTimeout(hkMakro,3400)],
    ['Avrupa sekmesi', ()=>setTimeout(avrupaSekme,3600)],
    ['TL faizleri', ()=>setTimeout(tlFaizKart,4000)],
    ['Reel sektör dvz', ()=>setTimeout(dvzPozKart,4400)],
    ['KKO', ()=>setTimeout(kkoKart,4600)],
    ['Yabancı canlı', ()=>setTimeout(yabCanli,4800)],
    ['Pozisyon fiyatları', ()=>setTimeout(pozFiyatOto,5000)],
    ['Kripto', ()=>setTimeout(kriptoRender,1500)]
  ];
  /* §310 PARALEL BOOT — ölçülerek tasarlandı:
     17 fetch'li modül seri await'le koşuyordu; toplam gecikme = SÜRELERİN
     TOPLAMI. Bağımlılık haritası çıkarıldı (grep MFIYAT/MRISK/CANLI_FIYAT):
     yalnız pyInit ve planInit, multipleInit'in doldurduğu MFIYAT/MRISK'i
     tüketiyor — geri kalan herkes kendi verisini çekip kendi DOM'una yazıyor.
     TASARIM: iki aşama. 1. aşama (bağımsızlar) paralel; 2. aşama (Equity,
     Veri Tazeliği) 1. aşama bitince paralel. Hata izolasyonu aynen korunur:
     allSettled + modül başına log — bir modülün düşmesi diğerini durdurmaz
     (eski davranışla birebir).
     GERİ DÖNÜŞ ANAHTARI: localStorage 'ktp_boot_seri_v1'='1' → eski seri yol.
     Paralellik bir gariplik doğurursa tarayıcı konsolundan
     localStorage.setItem('ktp_boot_seri_v1','1') deyip yenilemek yeter —
     deploy'suz teşhis (§136.4: kalkan değil, ANAHTAR). */
  const IKINCI_ASAMA = new Set(['Equity','Veri Tazeliği']);
  const bootT0 = (typeof performance!=='undefined'&&performance.now)?performance.now():Date.now();
  const seriBoot = (()=>{ try{ return localStorage.getItem('ktp_boot_seri_v1')==='1'; }catch(e){ return false; } })();
  /* §312: modül başına süre — 18 Ağu'da boot bir açılışta 12,5 sn sürdü ve
     HANGİ modülün süründüğü görülemedi. 2,5 sn'yi aşan modüller artık konsola
     yazılır; toplam satırıyla birlikte yavaşlık teşhisi tek bakışta yapılır. */
  const kos = async ([ad,fn])=>{ const t0=(typeof performance!=='undefined'&&performance.now)?performance.now():Date.now();
    try{ await fn(); }
    catch(e){ console.error('[KTPanel] '+ad+' başlatılamadı:', (e&&e.message)||e); }
    finally{ const ms=Math.round(((typeof performance!=='undefined'&&performance.now)?performance.now():Date.now())-t0);
      if(ms>2500) console.warn('[KTPanel] §312 yavaş modül: '+ad+' '+ms+' ms'); } };
  if(seriBoot){
    console.warn('[KTPanel] §310: seri boot anahtarı AÇIK — paralellik devre dışı');
    for(const m of moduller) await kos(m);
  }else{
    await Promise.allSettled(moduller.filter(m=>!IKINCI_ASAMA.has(m[0])).map(kos));
    await Promise.allSettled(moduller.filter(m=> IKINCI_ASAMA.has(m[0])).map(kos));
  }
  const bootT1 = (typeof performance!=='undefined'&&performance.now)?performance.now():Date.now();
  console.log('[KTPanel] boot '+Math.round(bootT1-bootT0)+' ms ('+(seriBoot?'seri':'paralel §310')+')');
  /* Sağlık kontrolü: hangi bölüm boş kaldı?
     §245 İKİ AYRI ARIZA, İKİ AYRI RAPOR. Eski kod `if(!el) return false` diyordu:
     kap HİÇ YOKSA "sorun yok" sayılıyordu. Oysa kabın SİLİNMESİ, kabın boş
     kalmasından daha ağır bir arıza — §244'te temettü kartı ve #temettuBody
     kaldırıldı; yarım silme olsaydı bu kontrol hiçbir şey demezdi.
     Sessizce sağlıklı raporlamak, sağlık kontrolünü §60'taki TEFAS vakasına
     çevirir: damga "canlı" der, akan veri yoktur.
     KAPSAM da dardı: boot 30 modül koşarken 8 kap izleniyordu (%27). Karar
     omurgasının gövdeleri eklendi → 15 kap. Tamamı değil ama atıf · risk ·
     ayrışma · sicil artık izlemede.
     §245b TEMBEL KAP (3. eleman = true). İlk sürümde kapsamı genişletirken
     DOLMA ZAMANINA bakmamıştım: #ayrBody'yi dolduran ayrismaInit() boot'ta
     DEĞİL, t3 sekmesi tıklanınca çağrılıyor (§154'te portföy sekmesinin içine
     taşınmıştı). Sonuç: ilk deploy'da "Boş/eksik bölümler: Endeksten ayrışma"
     yanlış alarmı — kap boştu ama boş OLMASI GEREKİYORDU.
     Tembel kapta VARLIK denetlenir, DOLULUK denetlenmez. Varlık denetimi asıl
     kazanımdı zaten (silinen kabı yakalamak); doluluğu boot anında ölçmek
     kategori hatası. Ders: bir denetime kap eklerken "bu ne zaman dolar"
     sorusu, "bu var mı" sorusundan önce gelir. */
  const kontrol=[
    ['Küresel endeksler','kuresel1'],['Sektör ısı haritası','heatBody'],['Sektör rotasyon','rotBody'],
    ['Yabancı akış','yabanciBody'],['Risk iştahı','riskBaroSkor'],['Halka arz','halkaarzBody'],
    ['Guidance','guidanceListe'],['Katılım fon','katfonBody'],
    ['Risk bütçesi','rbBody'],['Reel getiri','reelAtifBody'],
    ['Getiri atfı','atifBody'],['Risk metrikleri','riskMetBody'],['Likidite','likiditeBody'],
    ['Model karnesi','fmKarneBody'],
    ['Endeksten ayrışma','ayrBody', true]        /* ← TEMBEL: t3 açılınca dolar */
  ];
  const kayip=[], bos=[], tembel=[];
  kontrol.forEach(([ad,id,gec])=>{
    const el=document.getElementById(id);
    if(!el){ kayip.push(ad+' (#'+id+')'); return; }   /* ← KAP YOK: artık raporlanır */
    if(gec){ tembel.push(ad); return; }               /* ← kap VAR; doluluk sekmede ölçülür */
    const h=el.innerHTML.trim();
    if(!h || h.indexOf('yükleniyor')>=0) bos.push(ad);
  });
  if(kayip.length) console.error('[KTPanel] \u2717 KAYIP KAP:', kayip.join(', '),
    '\u2014 HTML\u0027den silinmiş ya da adı değişmiş. Modül çalışıyor sanılır, hiçbir şey yazmaz.');
  if(bos.length) console.warn('[KTPanel] \u26a0 Boş/eksik bölümler:', bos.join(', '), '\u2014 ilgili .json dosyası klasörde mi kontrol et.');
  if(!kayip.length && !bos.length) console.log('[KTPanel] \u2713 Tüm veri modülleri yüklendi.'+
    (tembel.length ? ' (tembel, sekme açılınca dolar: '+tembel.join(', ')+')' : ''));
}
boot();

/* ---- Sukuk İhraç Takvimi ---- */
/* SS315 SUKUK TAKTIK SINYALI - otonomi paketinin son halkasi (onay 18 Agu).
   KARAR DEGIL OKUMA: dort eksende ortam rozetleri, her satirin kaynagi yaninda.
   Girdilerin TUMU panelin kendi tek-sahip degiskenleri/dosyalari:
   PPK agaci (kullanici TAKDIRI, ppkOku) · HMB ihale defteri (SS314 otomatik) ·
   AOFM_SON / EXANTE / REK_SON (SS304 tek-sahip) · PIYASA_IMA (SS316b, Tahminler
   acilinca ayni forward hesabindan dolar - format ikinci sahibi yok). */
async function sinyalRender(){
  const el=$('sukukSinyal'); if(!el)return;
  try{
    let SON={}; try{SON=await(await fetch('/hazine-sonuc.json',{cache:'no-store'})).json();}catch(e){}
    const bloklar=[]; Object.values((SON&&SON.kayitlar)||{}).forEach(k=>(k.ihaleler||[]).forEach(A=>bloklar.push(Object.assign({t:k.tarih},A))));
    bloklar.sort((a,b)=>(b.t||'').localeCompare(a.t||''));
    const tufe=bloklar.find(b=>/T\u00dcFE/i.test(b.senet||'')&&b.bilesik);
    const sabitler=bloklar.filter(b=>/Sabit/i.test(b.senet||'')&&b.bilesik);
    const uzun=sabitler.length?sabitler.reduce((a,b)=>a.bilesik.gerceklesme<b.bilesik.gerceklesme?a:b):null;
    const kisaAday=bloklar.filter(b=>b.bilesik&&!/T\u00dcFE/i.test(b.senet||''));
    const kisa=kisaAday.length?kisaAday.reduce((a,b)=>a.bilesik.gerceklesme>b.bilesik.gerceklesme?a:b):null;
    let topBp=null,kuyruk=0;
    try{const L=ppkOku(); const pat=ppkPatika(0,L); topBp=Math.round(pat.reduce((x,y)=>x+y.beklenenBp,0));
        L.forEach(t=>{kuyruk+=(+(t.p&&t.p['+100']||0))+(+(t.p&&t.p['+250']||0));});}catch(e){}
    const aofm=Number.isFinite(AOFM_SON)?AOFM_SON:null;
    const ex=(window.EXANTE&&isFinite(window.EXANTE.deger))?window.EXANTE.deger:null;
    const rek=Number.isFinite(REK_SON)?REK_SON:null;
    const terslik=(kisa&&uzun&&kisa!==uzun)?Math.round((kisa.bilesik.gerceklesme-uzun.bilesik.gerceklesme)*100):null;
    const makas=(ex!=null&&tufe)?+(ex-tufe.bilesik.gerceklesme).toFixed(1):null;
    const R=[];
    if(topBp!=null) R.push({r:topBp<=-200?'up':'',t:'PAT\u0130KA',
      m:'Takdiriniz \u03a3'+topBp+'bp \u2014 '+(topBp<=-200?'yumu\u015fama g\u00fc\u00e7l\u00fc: sabit kira kilidi lehine':'temkinli patika')+
        (kuyruk>0?' \u00b7 art\u0131r\u0131m kuyru\u011fu %'+kuyruk+': sabit vade \u00f6l\u00e7\u00fcl\u00fc tutulur':'')});
    if(terslik!=null) R.push({r:terslik>=300?'down':'',t:'E\u011eR\u0130',
      m:'Ters '+terslik+'bp (%'+trN(kisa.bilesik.gerceklesme,1)+'\u2192%'+trN(uzun.bilesik.gerceklesme,1)+' \u00b7 '+(uzun.senet||'')+') \u2014 dezenflasyon '+
        (terslik>=300?'DER\u0130N fiyatlanm\u0131\u015f: uzun sabit primli; patikaniz piyasadan g\u00fcvercin de\u011filse kilit pahal\u0131':'k\u0131smen fiyatl\u0131')});
    if(makas!=null) R.push({r:makas>=2?'down':'up',t:'REEL',
      m:'Ex-ante %'+trN(ex,1)+' \u2212 T\u00dcFE-endeksli ihra\u00e7 reeli %'+trN(tufe.bilesik.gerceklesme,2)+' = '+trN(makas,1)+' pt \u2192 enflasyon korumas\u0131 '+
        (makas>=2?'PAHALI (nominal g\u00f6rece cazip)':'makul fiyatl\u0131')});
    if(rek!=null&&ex!=null) R.push({r:'',t:'TL',
      m:'REK '+trN(rek,1)+' \u00b7 ex-ante reel %'+trN(ex,1)+' \u2014 TL ta\u015f\u0131ma \u00e7\u0131palar\u0131 '+
        (ex>=3&&rek<115?'destekleyici (USD KS getiri de\u011fil SEPET karar\u0131d\u0131r)':'zay\u0131fl\u0131yor')});
    if(window.PIYASA_IMA) R.push({r:'',t:'\u0130MA',m:'Piyasa forward dilimleri: '+window.PIYASA_IMA+' \u2014 patikanizla kiyaslayin (SS316b)'});
    const dm=(SON.guncelleme||'').slice(0,16);
    el.innerHTML=R.length?('<div class="card" style="margin-bottom:14px"><div class="lbl">SUKUK TAKT\u0130K S\u0130NYAL\u0130 <span class="thin" style="font-weight:400">(okuma \u2014 karar de\u011fil \u00b7 girdiler otomatik \u00b7 SS315)</span></div>'+
      R.map(x=>'<div class="kv"><span class="k" style="font-weight:700;'+(x.r==='up'?'color:var(--up)':x.r==='down'?'color:var(--down)':'')+'">'+x.t+'</span><span style="font-size:10.5px;text-align:right;max-width:78%">'+x.m+'</span></div>').join('')+
      '<div class="sub" style="font-size:9px;margin-top:6px">Kaynak: PPK a\u011fac\u0131 (takdiriniz) \u00b7 HMB ihale defteri'+(dm?(' \u00b7 '+dm):'')+' \u00b7 EVDS. Rozet ortam okumas\u0131d\u0131r; pozisyon karar\u0131 risk b\u00fct\u00e7esiyle verilir.</div></div>'):'';
  }catch(e){}
}

async function hazineRender(){
  const el=$('hazBody'); if(!el)return;
  try{
    const d=await (await fetch('/hazine-takvim.json',{cache:'no-store'})).json();
    /* SS317 IHRAC SONUCLARI — kullanici istegi (19 Agu): SS314 defteri gorunur olsun.
       Ayri sekme ACILMADI: takvim PLANI, defter GERCEKLESMEYI tutar — ikisi ayni
       sorunun iki yarisi, ayni ekranda yasarlar (SS121: yeni dugme/panel/init yok).
       Iki katman: (1) takvim satirina yesil rozet — tarih + enstruman-kelimesi
       eslesirse gerceklesme yazilir; eslesme YOKSA rozet YOK (uydurma eslesme
       yasak — ayni gun iki ihale olabilir, kelime kesisimi sart). (2) altta
       kronolojik GERCEKLESEN IHALELER blogu (son 8 duyuru). */
    let SON={};
    try{ SON=await (await fetch('/hazine-sonuc.json',{cache:'no-store'})).json(); }catch(e){}
    const sonKayit=Object.values((SON&&SON.kayitlar)||{}).sort((x,y)=>(y.tarih||'').localeCompare(x.tarih||''));
    const ANAHTAR=['tüfe','tlref','sabit','değişken','kira','bono','kuponsuz','dolar','usd','altın'];
    const kelime=(t)=>{t=(t||'').toLowerCase();return ANAHTAR.filter(k=>t.includes(k));};
    const kullanilan=new Set();
    const rozetBul=(tarih,ad)=>{
      const adK=kelime(ad);
      for(const k of sonKayit){
        if(k.tarih!==tarih||!k.ihaleler)continue;
        for(let i=0;i<k.ihaleler.length;i++){
          const id=k.tarih+'#'+i; if(kullanilan.has(id))continue;
          const A=k.ihaleler[i]; const sK=kelime(A.senet||'');
          if(!adK.some(x=>sK.includes(x)))continue;
          kullanilan.add(id);
          if(A.bilesik) return '✓ bileşik %'+trN(A.bilesik.gerceklesme,2);
          if(A.kira!=null) return '✓ kira %'+trN(A.kira,2);
          if(A.tutar!=null) return '✓ '+trN(A.tutar/1e9,2)+' mlr '+(A.doviz||'');
          return null;
        }
      }
      return null;
    };
    const ay=['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
    const trh=(s)=>{const p=s.split('-');return p[2]+' '+ay[parseInt(p[1])-1]+' '+p[0].slice(2);};
    const bugun=new Date().toISOString().slice(0,10);
    if($('hazTag'))$('hazTag').textContent=d.donem||'HMB';
    if($('hazSonraki'))$('hazSonraki').textContent=d.sonraki_aciklama||'—';
    // Finansman özeti + çevirme oranı
    if($('hazFin')&&d.finansman)$('hazFin').innerHTML=d.finansman.map(f=>{
      const oran=Math.round(f.borclanma/f.itfa*100);
      return '<span><b>'+f.ay+':</b> itfa '+trN(f.itfa,1)+' / borçlanma '+trN(f.borclanma,1)+' mlr ₺ · çevirme <b class="'+(oran>105?'down':'up')+'">%'+oran+'</b></span>';
    }).join('');
    const rows=(d.ihraclar||[]).map(x=>{
      const gecmis=x.t<bugun, bugunMu=x.t===bugun;
      const stil=gecmis?'opacity:.45':bugunMu?'background:rgba(15,162,107,.07);border-radius:6px':'';
      return '<div style="display:grid;grid-template-columns:72px 1fr auto;gap:10px;align-items:baseline;padding:6px 4px;border-bottom:1px solid var(--line);'+stil+'">'+
        '<span style="font-family:var(--mono);font-size:10px;'+(bugunMu?'color:var(--mm2);font-weight:700':'')+'">'+trh(x.t)+(bugunMu?' ●':'')+'</span>'+
        '<span style="font-size:11px">'+x.ad+(x.katilim?' <span style="font-size:8px;background:var(--mm2);color:#fff;padding:1px 5px;border-radius:4px;vertical-align:1px">KATILIM</span>':'')+
        (/İLK/.test(x.yontem)?' <span style="font-size:8px;border:1px solid var(--mm2);color:var(--mm2);padding:0 4px;border-radius:4px">İLK</span>':'')+
        ' <span class="thin" style="font-size:9px">· '+x.vade+' · itfa '+trh(x.itfa)+'</span>'+
        (function(){const r=rozetBul(x.t,x.ad);return r?' <span style="font-size:9px;font-weight:700;color:var(--up,#0FA26B)">'+r+'</span>':'';})()+'</span>'+
        '<span class="thin" style="font-size:9px;text-align:right">'+x.yontem.replace(' / Yeniden','·Y').replace('İhale / İLK ihraç','İhale·İLK')+'</span></div>';
    }).join('');
    /* SS317: gerceklesen ihaleler blogu */
    const cf=(x)=>x?('%'+trN(x.gerceklesme,2)+' <span class="thin" style="font-size:8.5px">(teklif %'+trN(x.teklif,2)+')</span>'):null;
    const sonuclar=sonKayit.slice(0,8).map(k=>{
      const satirlar=(k.ihaleler||[]).map(A=>{
        const par=[];
        if(A.bilesik)par.push('bileşik '+cf(A.bilesik));
        if(A.donemsel)par.push('dönemsel '+cf(A.donemsel));
        if(A.kira!=null)par.push('kira %'+trN(A.kira,2));
        if(A.tutar!=null)par.push(trN(A.tutar/1e9,2)+' mlr '+(A.doviz||'')+(A.itfa?' · itfa '+A.itfa:''));
        return '<div style="padding:3px 0 3px 10px;font-size:10.5px"><b>'+(A.senet||'?')+'</b>'+
          (A.isin?' <span class="thin" style="font-family:var(--mono);font-size:9px">'+A.isin+'</span>':'')+
          '<br><span style="font-size:10px">'+(par.join(' · ')||'—')+'</span></div>';
      }).join('');
      return '<div style="padding:6px 0;border-bottom:1px solid var(--line)">'+
        '<span style="font-family:var(--mono);font-size:10px;color:var(--mm2);font-weight:700">'+trh(k.tarih)+'</span>'+satirlar+'</div>';
    }).join('');
    const sonucBlok=sonuclar?('<div style="margin-top:14px"><div class="lbl" style="font-size:10px">GERÇEKLEŞEN İHALELER <span class="thin" style="font-weight:400">(HMB duyuruları · otomatik §314 · '+(SON.sayi||sonKayit.length)+' kayıt)</span></div>'+sonuclar+'</div>'):'';
    el.innerHTML=(rows||'<div class="sub">Takvim boş.</div>')+sonucBlok;
  }catch(e){el.innerHTML='<div class="sub">Hazine takvimi yüklenemedi.</div>';}
}
async function ihracRender(){
  hazineRender();
  const el=$('ihracBody'); if(!el)return;
  try{
    // ÖNCE CANLI: /api/kap?mod=sukuk — KAP akışından "(Faizsiz)" bildirimleri süzer,
    // VKŞ ünvan haritasıyla zenginleştirir ve statik arşivle birleştirir.
    // Düşerse statik dosyaya döner (damgalı yedek deseni). Hazine bloğu bundan bağımsızdır.
    let d=null;
    /* §245h: sebep artık yutulmuyor. Satır bazında "CANLI" rozeti zaten var,
       yani yedeğe düşüş görsel olarak sezilebiliyordu — ama NEDEN düştüğü
       hiçbir yerde yoktu. mod=sukuk, mod=yorum ile AYNI hatanın kurbanıydı
       (§245g: değişkenli import paketlenmiyordu) ve boş catch yüzünden üç
       turdur görünmemişti. Rozet "canlı değil" der; konsol "niye değil" der. */
    try{
      const r=await fetch('/api/kap?mod=sukuk');
      const j=await r.json();
      if(j&&j.ok) d=j;
      else console.warn('[KTPanel] sukuk canlı akışı düştü → statik arşiv:', (j&&(j.mesaj||j.err))||('HTTP '+r.status), j||'');
    }catch(e){ console.warn('[KTPanel] sukuk canlı akışı düştü → statik arşiv:', (e&&e.message)||e); }
    if(!d) d=await (await fetch('/sukuk-ihrac.json',{cache:'no-store'})).json();
    const ay=['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
    const trh=(s)=>{const p=s.split('-');return p[2]+' '+ay[parseInt(p[1])-1]+' '+p[0].slice(2);};
    const tipRenk=(t)=>/Yeşil|Sürdürülebilir/.test(t)?'#0FA26B':/Dönemsel|Ödeme/.test(t)?'#5B8DEF':'#8896A5';
    const rows=(d.ihraclar||[]).map(x=>
      '<div style="display:grid;grid-template-columns:auto 70px 1fr;gap:10px;align-items:baseline;padding:8px 0;border-bottom:1px solid var(--line)">'+
      '<span class="sub" style="font-family:var(--mono);font-size:10px;white-space:nowrap">'+trh(x.tarih)+'</span>'+
      '<span style="font-family:var(--mono);font-weight:700;font-size:12px">'+x.kod+'</span>'+
      '<span><div style="font-size:11px;font-weight:600">'+(x.url?('<a href="'+x.url+'" target="_blank" rel="noopener" style="color:inherit;text-decoration:none;border-bottom:1px dotted var(--line)">'+x.ihracci+'</a>'):x.ihracci)+
      (x.kaynak==='canlı'?' <span style="font-size:8px;font-weight:700;color:var(--mm2)">CANLI</span>':'')+'</div>'+
      '<div style="display:inline-block;font-size:8.5px;font-weight:700;color:'+tipRenk(x.tip)+';border:1px solid '+tipRenk(x.tip)+'55;border-radius:3px;padding:1px 5px;margin:2px 0">'+x.tip+'</div>'+
      '<div class="sub" style="font-size:9.5px">'+x.not+'</div></span></div>'
    ).join('');
    const kirilim=(d.canliAdet!=null)?(' · '+d.canliAdet+' canlı, '+d.arsivAdet+' arşiv'):'';
    const uyari=(d.bilinmeyenKodlar&&d.bilinmeyenKodlar.length)
      ? '<div class="sub" style="font-size:9px;color:var(--mm2)">Ünvanı haritada olmayan kod: '+d.bilinmeyenKodlar.join(', ')+' — bakım notuna ekle.</div>' : '';
    /* §185 CANLI/YEDEK AYRIMI GÖRÜNÜR OLSUN.
       Kod zaten dürüsttü — canliAdet=0 ise damgaya "canlı" yazmıyordu. AMA ayrım
       ÇOK İNCEYDİ: kullanıcı yeşil nokta + "KAP" görüp canlı sanıyordu, oysa
       ekrandaki altı kayıt 10 gün önceki ARŞİVDİ. Ayrıca `kapHata` alanı API'den
       geliyordu ama HİÇBİR YERDE gösterilmiyordu — düştüğünü biliyorduk,
       NEDEN düştüğünü söylemiyorduk (§143).
       Artık: canlı yoksa damga KIRMIZI "ARŞİV" der, gövdede sebep yazar. */
    /* §245i UYARI METNİ YANLIŞ SONUCA YÖNLENDİRİYORDU. Eski hali "pencerede
       (30 gün) bulunamadı … 10 günü aşıyorsa akış kopmuştur" diyordu. Oysa
       kaynak 30 günü hiç taramıyordu (parametresiz /api/kap = 2 gün + en yeni
       150 kayıt ≈ yarım gün). Yani metin, gerçekleşmemiş bir taramaya dayanarak
       "akış koptu" teşhisi öneriyordu. Doğru sayı artık sunucudan geliyor;
       metin de HAM SAYIYI gösterip ayrımı okuyucuya bırakıyor:
         hamAdet 0      → kaynak sustu
         hamAdet yüksek → kaynak akıyor, süzgeç eliyor */
    const canliYok = !d.canliAdet;
    const yas = (()=>{ try{ return Math.round((Date.now()-new Date(d.guncelleme+'T00:00:00').getTime())/86400000); }catch(e){ return null; } })();
    const pen = d.pencereGun || '?';
    const ham = (d.hamAdet!=null) ? d.hamAdet : null;
    const hamNot = ham==null ? ''
      : (ham===0
          ? 'KAP köprüsü <b>hiç kayıt döndürmedi</b> (ham 0) — sorun kaynakta, süzgeçte değil. '
          : 'KAP köprüsü <b>'+ham+' ham kayıt</b> döndürdü ama hiçbiri sukuk ölçütünü geçmedi — sorun SÜZGEÇTE. '
            + (d.tavanaDayandi ? '<b>Pencere tavana dayandı</b>, gerçek sayı daha yüksek olabilir. ' : ''));
    const durum = canliYok
      ? '<div class="note" style="border-left:3px solid var(--down);margin-top:8px"><b>⚠ CANLI AKIŞ BOŞ DÖNDÜ — ekrandaki kayıtlar ARŞİVDEN.</b> '+
        'Son kayıt '+trh(d.guncelleme)+(yas!=null?' ('+yas+' gün önce)':'')+'. '+
        (d.kapHata?'KAP hatası: <b>'+esc(String(d.kapHata))+'</b>. '
                  :'Taranan pencere <b>'+pen+' gün</b>'+
                   (d.istenenPencereGun && d.ustPencereGun && d.istenenPencereGun>d.ustPencereGun
                     ? ' (süzgeç '+d.istenenPencereGun+' gün istedi, kaynak '+d.ustPencereGun+' gün verdi)' : '')+'. '+hamNot)+
        '</div>'
      : '';
    el.innerHTML=rows+uyari+durum+'<div class="sub" style="font-size:9px;margin-top:8px">Son güncelleme: '+trh(d.guncelleme)+' · '+(d.ihraclar||[]).length+' bildirim'+kirilim+' · Kaynak: '+d.kaynak+
      ' · <b>canlı '+(d.canliAdet||0)+' / arşiv '+(d.arsivAdet||0)+'</b></div>';
    if($('ihracTag')){ const t=$('ihracTag');
      t.textContent=(d.canliAdet?'KAP canlı · ':'ARŞİV · ')+trh(d.guncelleme);
      t.style.background = d.canliAdet ? '' : 'var(--down)'; }
  }catch(e){el.innerHTML='<div class="sub">İhraç verisi yüklenemedi (sukuk-ihrac.json).</div>';}
}

/* ---- Varlık Sınıfı Taktiksel Duruş ---- */
function taktikRender(){
  const el=$('taktikBody'), el2=$('taktikBody2');
  if(!el&&!el2)return;
  /* §246b: etiket statik '27 TEM'de kalıyordu — tablo CANLI verilerden
     türediği için damga da CANLI olmalı. Haftanın aralığı hesaplanır. */
  const tg=$('taktikTag2');
  if(tg){ const b=new Date(); b.setHours(0,0,0,0); b.setDate(b.getDate()-((b.getDay()+6)%7));
    const e=new Date(b); e.setDate(e.getDate()+6);
    const AY=['OCA','ŞUB','MAR','NİS','MAY','HAZ','TEM','AĞU','EYL','EKİ','KAS','ARA'];
    tg.textContent=b.getDate()+' '+AY[b.getMonth()]+'–'+e.getDate()+' '+AY[e.getMonth()]+' · CANLI TÜRETİM'; }
  // §304: canlı sinyaller DOM'dan kazınmaz, tek sahibin değişkeninden okunur
  const aofm=Number.isFinite(AOFM_SON)?AOFM_SON:null, tufe=Number.isFinite(TUFE_YILLIK)?TUFE_YILLIK:null, rek=Number.isFinite(REK_SON)?REK_SON:null;
  // §128 DÜZELTME: basit çıkarma → FISHER. §127 carry KARTINI tek sahibe bağladı
  // ama bu AYRI tüketici (duruş mantığı + tez metni) geride kalmıştı.
  // ÖLÇÜM: AOFM 40 · TÜFE 32,11 → basit 7,89 · Fisher 5,97 — 1,92 puan ŞİŞKİNLİK.
  // Düşük enflasyonda basit fark iyi bir yaklaşımdır; %32'de DEĞİL.
  // Panelin reelHesap() fonksiyonu zaten Fisher kullanıyordu; bu satır ondan önce
  // yazılmış ve geride kalmıştı. Aynı hatanın panelde ÜÇÜNCÜ bulunduğu yer.
  const carry=(aofm!=null&&tufe!=null)?(((1+aofm/100)/(1+tufe/100)-1)*100):null;
  // Model portföy sicili (benchmark'a göre)
  let alfa=null; try{const s=TRK&&TRK.series;if(s&&s.length){const son=s[s.length-1];alfa=son.model-son.endeks;}}catch(e){}

  // Pozisyon rozeti üretici
  const rozet=(p)=>{
    const map={'AŞIRI ÜSTÜ':['#0FA26B','↑↑'],'ÜSTÜ':['#0FA26B','↑'],'NÖTR':['#8896A5','='],'ALTI':['#D64545','↓'],'AŞIRI ALTI':['#D64545','↓↓']};
    const [renk,ok]=map[p]||['#8896A5','='];
    return '<span style="display:inline-flex;align-items:center;gap:5px;font-weight:700;font-size:12px;color:'+renk+'"><span style="font-family:var(--mono);font-size:14px">'+ok+'</span>'+p+'</span>';
  };

  // Dinamik duruş mantığı — canlı carry'ye göre TL tarafı ayarlanır
  const carryCazip = carry==null || carry>0;   // pozitif reel carry = indirim-öncesi rejimde ÜSTÜ (kör %5 eşiği kaldırıldı — 20 Tem itirazı)
  const varliklar=[
    {
      ad:'Yerli Hisse (BIST)', kod:'poz1',
      durus: 'ÜSTÜ', renk:'#0FA26B',
      benchmark:'XKTUM / XK100',
      teze:'NÖTR→ÜSTÜ. Tez artık beklenti değil KANIT: 2Ç bilançoları emtia-sanayi hattında marj dönüşünü teyit etti (TUPRS 4×, EREGL 6,5×, ISDMR 3,8×, PETKM zarardan çıkış, BRISA +6,6 puan marj). Katılım bankacılığı ayağı da döndü (ALBRK y/y +%69). Manşet TÜFE %31,75\'e indi, üretici tarafı daha hızlı soğuyor (Yİ-ÜFE %27,83, madencilik −%4,22). İndirim döngüsü başladığında iskonto oranı düşer + kazanç tabanı zaten toparlanmış olur — ikisi çakışırsa çarpan genişlemesi çift motorlu olur.',
      dayanak:['2Ç kâr dönüşü GERÇEKLEŞTİ (emtia zinciri + banka) — tez teyitli','Üretici enflasyonu tüketiciden hızlı soğuyor → marj görünürlüğü','XK100 aylık +%6,6 ile momentum endekste','Katılım fonlarına akan 211 mlr₺/ay parkta bekliyor — rotasyon yakıtı'],
      risk:['ŞOK MARJI UYARISI: rafineri/petrokimya kârları geçici olabilir; 3Ç normalleşmesi kâr revizyonu getirir','Gıda enflasyonu %37,5\'e çıktı → manşetteki iniş sürdürülemezse indirim ertelenir','Reel faiz (ex-post) '+(carry!=null?'+%'+trN(carry,1):'pozitif')+' → mevduat/PP rekabeti sürüyor','Model portföy aylık 3,03 puan geride — seçicilik endeksi yenemiyor'],
      tetik:'3Ç bilançolarında emtia marjları korunursa ÜSTÜ pekişir; crack\'ler sertçe daralır + gıda enflasyonu yapışırsa NÖTR\'e dön. TCMB indirim adımı → çarpan genişlemesi tezinin ateşleyicisi.'
    },
    {
      ad:'Yabancı Hisse (Global)', kod:'poz2',
      durus:'ALTI', renk:'#D64545',
      benchmark:'S&P 500 / MSCI',
      teze:'ALTI korunuyor. Yerli tarafta somut kâr dönüşü varken küresel hisse hâlâ yüksek reel faiz ve zengin çarpanlarla fiyatlanıyor; göreli cazibe yurt içi lehine. Yabancı evren panelde 738 hisseyle canlı izleniyor (forward çarpanlar, analist notu, Altman Z) — ağırlık artırmak için tekil fırsat gerekir, sınıf bazında değil.',
      dayanak:['Coğrafi/kur çeşitlendirmesi (TL riskine karşı doğal denge)','AI/teknoloji kâr büyümesi sürüyor','Katılım evreni dar → yurt dışı derinlik sunuyor'],
      risk:['Yüksek reel faiz zengin çarpanları eziyor','Yurt içinde kanıtlanmış kâr dönüşü varken göreli cazibe düşük','Kur kazancı TL bazlı getiriyi şişirip gerçek performansı maskeliyor'],
      tetik:'Küresel indirim döngüsü netleşir ya da yabancı evrende forward F/K + FCF verimi birlikte cazipleşirse NÖTR\'e çık.'
    },
    {
      ad:'Altın', kod:'poz3',
      durus:'NÖTR', renk:'#8896A5',
      benchmark:'Stratejik %10-15',
      teze:'NÖTR — ama TEZ ÇÜRÜDÜ, dürüstçe kaydedelim. Panelin duruşu "yüksek küresel reel faiz tavan koyar" varsayımına dayanıyordu; ons 4.400$\'a (haftada +%8,7), gümüş +%10,3 ile fiyat bu tezi reddetti. Bu büyüklükte hareket ya MB alımları/dedolarizasyonun reel faiz baskısını yendiğini ya da piyasanın indirim döngüsünü öne çektiğini gösterir. Stratejik ağırlık korunur; ralliye geç katılmak için ÜSTÜ demek yerine tezin yenilenmesi beklenir.',
      dayanak:['MB alımları + dedolarizasyon → yapısal talep tabanı','Kuyumcu kart harcaması reel +%29,6 → hane korunma refleksi canlı','TL bazlı çift koruma (kur + ons)','Gümüşün +%10,3\'ü ile birlikte hareket = geniş tabanlı değerli metal talebi'],
      risk:['ÇÜRÜYEN TEZ: reel faiz tavanı işlemedi — modelin varsayımı yenilenmeli','Rekor bölgede alım = geç katılım riski; düzeltme sert olabilir','Panik kaynaklı hareketse risk iştahı bozulduğunda hisse tarafına da vurur'],
      tetik:'Ons 4.400 üstünde tutunma + Fed indirim sinyali → NÖTR\'den ÜSTÜ\'ye tartış. Sert düzeltme (%10+) → stratejik tabana çek ve tezi yeniden kur.'
    },
    {
      ad:'TL / Sabit Getirili', kod:'poz4',
      durus: carryCazip?'ÜSTÜ':'NÖTR', renk: carryCazip?'#0FA26B':'#8896A5',
      benchmark:'Para piyasası + sukuk · TLREFK',
      teze:'ÜSTÜ sürüyor ama zirveye yakın. Kılçıksız getiri devam ediyor ve akış bunu teyit ediyor: para piyasası fonlarına günlük 39 mlr₺, aylık 211,5 mlr₺ net giriş. Artık ölçü de net — panel her fonun TLREFK\'e göre ALFA\'sını hesaplıyor (TLV +1,8 puan). Ama dezenflasyon sürer ve indirim başlarsa bu sınıf en hızlı aşınan taraf olur; süre uzatma (sukuk) kararı için pencere daralıyor.',
      dayanak:['Nominal '+(aofm!=null?'%'+trN(aofm,0):'~%40')+' + pozitif reel carry','Akış teyidi: PP fonlarına aylık 211,5 mlr₺','TLREFK benchmark\'ı panelde canlı → alfa ölçülebilir','Kira sertifikası ailesine aylık 17,1 mlr₺ giriş — katılım tarafı derinleşiyor'],
      risk:['İndirim başlarsa PP getirisi en hızlı aşınan kalem','Gıda enflasyonu yapışkan → reel getiri beklenenden düşük kalabilir','Fırsat maliyeti: hisse tarafında kâr dönüşü kanıtlandı, rotasyon gecikirse getiri kaçar'],
      tetik:'İlk indirim adımı → süreyi UZAT (sukuk/uzun vade), PP ağırlığını azalt. Gıda kaynaklı enflasyon sürprizi → mevcut kısa duruşu koru.'
    }
  ];
;

  const html=varliklar.map(v=>
    '<div style="border:1px solid var(--line);border-radius:9px;padding:11px 13px;margin-bottom:10px;border-left:3px solid '+v.renk+'">'+
    '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;margin-bottom:6px">'+
      '<span style="font-weight:700;font-size:13px">'+v.ad+' <span class="sub" style="font-weight:400;font-size:9px">vs '+v.benchmark+'</span></span>'+
      rozet(v.durus)+
    '</div>'+
    '<div class="sub" style="font-size:10.5px;line-height:1.55;margin-bottom:7px">'+v.teze+'</div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:9.5px">'+
      '<div><div style="font-weight:700;color:var(--up);margin-bottom:2px">DAYANAK</div>'+v.dayanak.map(d=>'<div style="color:var(--muted);margin-bottom:1px">+ '+d+'</div>').join('')+'</div>'+
      '<div><div style="font-weight:700;color:var(--down);margin-bottom:2px">RİSK / ÇÜRÜTEN</div>'+v.risk.map(r=>'<div style="color:var(--muted);margin-bottom:1px">− '+r+'</div>').join('')+'</div>'+
    '</div>'+
    '<div style="margin-top:7px;font-size:9.5px;padding-top:6px;border-top:1px dashed var(--line)"><b style="color:var(--mm2)">TETİK:</b> <span class="sub">'+v.tetik+'</span></div>'+
    '</div>'
  ).join('')+
  '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px;font-size:9px;color:var(--muted)"><span>Canlı girdi:</span>'+
   '<span>AOFM '+(aofm!=null?'%'+trN(aofm,0):'—')+'</span>·<span>TÜFE '+(tufe!=null?'%'+trN(tufe,1):'—')+'</span>·<span>reel carry (ex-post) '+(carry!=null?'+%'+trN(carry,1):'—')+'</span>·<span>REK '+(rek!=null?rek:'—')+'</span>'+
   (alfa!=null?'·<span>model α '+(alfa>=0?'+':'')+trN(alfa,1)+'pp</span>':'')+'</div>';
  if(el)el.innerHTML=html;
  if(el2)el2.innerHTML=html;
}

/* ---- DCF Değerleme (manuel) ---- */
function dcfOku(){
  const n=id=>{const el=$(id);return el?parseFloat(el.value)||0:0;};
  return {ad:($('dcfAd')&&$('dcfAd').value)||'Şirket',fiyat:n('dcfFiyat'),hisse:n('dcfHisse'),borc:n('dcfBorc'),fcf0:n('dcfFcf'),buyume:n('dcfBuyume'),yil:Math.max(1,Math.min(15,n('dcfYil')||5)),wacc:n('dcfWacc'),terminal:n('dcfTerminal')};
}
function dcfHesapla(g){
  const w=g.wacc/100, gr=g.buyume/100, tg=g.terminal/100;
  if(w<=tg)return {hata:'WACC (%'+trN(g.wacc,1)+') terminal büyümeden (%'+trN(g.terminal,1)+') büyük olmalı — yoksa değer sonsuza gider.'};
  if(g.hisse<=0)return {hata:'Hisse sayısı gerekli.'};
  let pvTop=0, proj=[], fcf=g.fcf0;
  for(let t=1;t<=g.yil;t++){fcf*=(1+gr);const df=Math.pow(1+w,t),pv=fcf/df;pvTop+=pv;proj.push({t,fcf,df,pv});}
  const tv=fcf*(1+tg)/(w-tg), pvTv=tv/Math.pow(1+w,g.yil), ev=pvTop+pvTv, ozk=ev-g.borc, hb=ozk/g.hisse;
  const pot=g.fiyat?(hb/g.fiyat-1)*100:0;
  return {proj,tv,pvTv,pvTop,ev,ozk,hb,pot,tvPay:ev?pvTv/ev*100:0};
}
function dcfDuyarlilik(g){
  const ws=[-4,-2,0,2,4].map(d=>g.wacc+d), ts=[-2,-1,0,1,2].map(d=>g.terminal+d);
  return {ws,ts,matris:ws.map(w=>ts.map(t=>{const r=dcfHesapla(Object.assign({},g,{wacc:w,terminal:t}));return r.hata?null:r.hb;}))};
}
function dcfRender(){
  if(!$('dcfOzet'))return;
  const g=dcfOku(), r=dcfHesapla(g);
  if(r.hata){$('dcfOzet').innerHTML='<div class="card" style="margin-top:10px"><div class="sub" style="color:var(--down)">⚠ '+r.hata+'</div></div>';if($('dcfDetay'))$('dcfDetay').innerHTML='';return;}
  const baz=$('dcfBaz')?$('dcfBaz').value:'tl', kur=parseFloat(($('dcfKur')||{}).value)||40, birim=baz==='usd'?'$':'₺';
  const hbTL=baz==='usd'?r.hb*kur:r.hb, pot=g.fiyat?(hbTL/g.fiyat-1)*100:0, potCl=pot>=0?'up':'down';
  const yorum=pot>=25?'BELİRGİN İSKONTOLU':pot>=10?'İSKONTOLU':pot>=-10?'ADİL DEĞERLİ':pot>=-25?'PRİMLİ':'BELİRGİN PRİMLİ';
  $('dcfOzet').innerHTML=
    '<div class="card" style="margin-top:10px"><div class="lbl">HIZLI ÖZET · '+esc(g.ad)+'</div>'+
    '<div style="display:flex;align-items:baseline;gap:16px;flex-wrap:wrap;margin-top:8px">'+
      '<div><span class="sub">İçsel değer</span><br><span style="font-family:var(--mono);font-size:28px;font-weight:700;color:var(--mm2)">'+trN(hbTL,2)+' ₺</span>'+(baz==='usd'?' <span class="sub">('+trN(r.hb,2)+' $)</span>':'')+'</div>'+
      '<div><span class="sub">Güncel</span><br><span style="font-family:var(--mono);font-size:19px">'+trN(g.fiyat,2)+' ₺</span></div>'+
      '<div><span class="sub">Potansiyel</span><br><span class="'+potCl+'" style="font-family:var(--mono);font-size:23px;font-weight:700">'+(pot>=0?'+':'')+trN(pot,0)+'%</span></div>'+
      '<div><span class="tag'+(pot>=0?'':' snap')+'" style="font-size:11px">'+yorum+'</span></div>'+
    '</div></div>';
  if(!$('dcfDetay'))return;
  const projRows=r.proj.map(p=>'<tr><td>Yıl '+p.t+'</td><td class="num">'+trN(p.fcf,0)+'</td><td class="num">'+p.df.toFixed(2)+'</td><td class="num">'+trN(p.pv,0)+'</td></tr>').join('');
  const d=dcfDuyarlilik(g);
  const dMatris='<table><tr><th style="font-size:9px">WACC↓ / Term→</th>'+d.ts.map(t=>'<th class="num" style="font-size:10px">%'+trN(t,0)+'</th>').join('')+'</tr>'+
    d.ws.map((w,i)=>'<tr><td style="font-size:10px">%'+trN(w,0)+'</td>'+d.matris[i].map(hb=>{
      if(hb==null)return '<td class="num sub">—</td>';
      const hbt=baz==='usd'?hb*kur:hb, p=g.fiyat?(hbt/g.fiyat-1)*100:0, bg=p>=25?'rgba(15,162,107,.22)':p>=0?'rgba(15,162,107,.10)':p>=-25?'rgba(222,75,94,.10)':'rgba(222,75,94,.22)';
      return '<td class="num" style="background:'+bg+';font-family:var(--mono);font-size:10px">'+trN(hbt,1)+'</td>';
    }).join('')+'</tr>').join('')+'</table>';
  $('dcfDetay').innerHTML=
    '<div class="lbl" style="margin-top:12px">YIL-YIL PROJEKSİYON <span class="thin">(mn '+birim+')</span></div>'+
    '<table style="margin-top:4px"><tr><th>Dönem</th><th class="num">FCF</th><th class="num">İsk. Faktörü</th><th class="num">Bugünkü Değer</th></tr>'+projRows+'</table>'+
    '<div class="lbl" style="margin-top:12px">DEĞER KÖPRÜSÜ <span class="thin">(mn '+birim+')</span></div>'+
    '<div class="kv"><span class="k">Projeksiyon PV toplamı</span><span class="num">'+trN(r.pvTop,0)+'</span></div>'+
    '<div class="kv"><span class="k">+ Terminal değer (PV)</span><span class="num">'+trN(r.pvTv,0)+' <span class="sub">(değerin %'+trN(r.tvPay,0)+"'i)</span></span></div>"+
    '<div class="kv"><span class="k">= Firma değeri (EV)</span><span class="num">'+trN(r.ev,0)+'</span></div>'+
    '<div class="kv"><span class="k">− Net borç</span><span class="num">'+trN(g.borc,0)+'</span></div>'+
    '<div class="kv"><span class="k"><b>= Özkaynak değeri</b></span><span class="num"><b>'+trN(r.ozk,0)+'</b></span></div>'+
    '<div class="lbl" style="margin-top:12px">DUYARLILIK: İÇSEL DEĞER (₺/hisse'+(baz==='usd'?' · USD×kur':'')+') <span class="thin">(WACC × terminal · renk=potansiyel)</span></div>'+
    '<div style="overflow-x:auto">'+dMatris+'</div>'+
    '<div class="note">Terminal değer, sonucun %'+trN(r.tvPay,0)+"'ini oluşturuyor"+(r.tvPay>75?' — bu %75\u0027i aştığı için değerin çoğu "uzak gelecek" tahminine dayanıyor, temkinli ol':'')+'. Matristeki yayılım, DCF\u0027nin varsayımlara ne kadar duyarlı (kırılgan) olduğunu gösterir — dar aralık güven, geniş aralık belirsizlik demektir. Bu bir tahmin aracıdır, kesin fiyat değil.</div>';
}
function dcfBazGoster(){
  const baz=$('dcfBaz')?$('dcfBaz').value:'tl';
  if($('dcfKurWrap'))$('dcfKurWrap').style.display=baz==='usd'?'':'none';
  if($('dcfBazNot')){
    const notlar={tl:'TL nominal: FCF/borç TL, WACC ~%42-48, büyüme ~%25-40, terminal ~%18-20 (enflasyon dahil).',usd:'USD: FCF/borç dolar, WACC ~%11-13, büyüme reel ~%10-15, terminal ~%3-4. Sonuç kurla TL\'ye çevrilir.',reel:'Reel TL: enflasyondan arındırılmış. FCF reel TL, WACC ~%8-11, büyüme reel ~%5-15, terminal ~%3-5. Sonuç bugünkü TL.'};
    $('dcfBazNot').textContent=notlar[baz]||'';
  }
  dcfRender();
}
function dcfInit(){
  ['dcfAd','dcfFiyat','dcfHisse','dcfBorc','dcfFcf','dcfBuyume','dcfYil','dcfWacc','dcfTerminal','dcfKur'].forEach(id=>{const el=$(id);if(el)el.addEventListener('input',dcfRender);});
  const bz=$('dcfBaz');if(bz)bz.addEventListener('change',dcfBazGoster);
  dcfBazGoster();
  dcfRender();
}

/* ---- EV/EBITDA Multiple ---- */
let MULTIPLE=null, CANLI_FIYAT={};
async function multipleInit(){
  try{MULTIPLE=await (await fetch('/multiple.json',{cache:'no-store'})).json();}catch(e){return;}
  // canlı fiyat daha önce geldiyse uygula
  if(MULTIPLE.hisseler)MULTIPLE.hisseler.forEach(h=>{ if(CANLI_FIYAT[h.k]!=null)h.fiyat=CANLI_FIYAT[h.k]; });
  const sel=$('mulTicker');
  if(sel){sel.innerHTML=MULTIPLE.hisseler.map(h=>'<option value="'+h.k+'">'+h.k+(h.ad?' — '+h.ad:'')+'</option>').join('');sel.addEventListener('change',multipleRender);}
  ['mulBuyume','mulMarj','mulCarpan'].forEach(id=>{const el=$(id);if(el)el.addEventListener('input',multipleRender);});
  multipleRender();
}
function multipleRender(){
  if(!MULTIPLE||!$('mulSnapshot'))return;
  const kod=$('mulTicker')?$('mulTicker').value:MULTIPLE.hisseler[0].k;
  const h=MULTIPLE.hisseler.find(x=>x.k===kod)||MULTIPLE.hisseler[0];
  const mcap=h.fiyat*h.adet, ev=mcap+h.netBorc, carpan=ev/h.ebitda, marj=h.ebitda/h.ciro*100;
  $('mulSnapshot').innerHTML=
    '<div class="kv"><span class="k">Güncel fiyat</span><span class="num">'+trN(h.fiyat,2)+' ₺</span></div>'+
    '<div class="kv"><span class="k">Piyasa değeri</span><span class="num">'+trN(mcap/1000,1)+' mlr ₺</span></div>'+
    '<div class="kv"><span class="k">+ Net borç</span><span class="num">'+trN(h.netBorc/1000,1)+' mlr ₺</span></div>'+
    '<div class="kv"><span class="k">= Firma değeri (EV)</span><span class="num"><b>'+trN(ev/1000,1)+' mlr ₺</b></span></div>'+
    '<div class="kv"><span class="k">EBITDA (TTM)</span><span class="num">'+trN(h.ebitda/1000,1)+' mlr ₺</span></div>'+
    '<div class="kv"><span class="k">EBITDA marjı</span><span class="num">%'+trN(marj,1)+'</span></div>'+
    '<div class="kv"><span class="k"><b>Mevcut EV/EBITDA</b></span><span class="num" style="color:var(--mm2);font-weight:700">'+trN(carpan,1)+'x</span></div>';
  const g=parseFloat(($('mulBuyume')||{}).value)||0, dm=parseFloat(($('mulMarj')||{}).value)||0;
  const ref=parseFloat(($('mulCarpan')||{}).value)||null;
  let ciro=h.ciro, mm=marj, proj=[{t:0,ciro:h.ciro,m:marj,ebitda:h.ebitda,carpan:carpan}];
  for(let t=1;t<=5;t++){ciro*=(1+g/100);mm+=dm;const eb=ciro*mm/100;proj.push({t,ciro,m:mm,ebitda:eb,carpan:eb>0?ev/eb:null});}
  let refYil=null;
  const rows=proj.map(p=>{
    const altinda=ref&&p.carpan!=null&&p.carpan<=ref;
    if(altinda&&refYil===null&&p.t>0)refYil=p.t;
    const bg=altinda?'background:rgba(15,162,107,.12)':'';
    const cStr=p.carpan!=null?trN(p.carpan,1)+'x':'\u2014';
    return '<tr style="'+bg+'"><td>'+(p.t===0?'Bugün':'Yıl '+p.t)+'</td><td class="num">'+trN(p.ciro/1000,0)+'</td><td class="num">%'+trN(p.m,1)+'</td><td class="num">'+trN(p.ebitda/1000,1)+'</td><td class="num" style="font-weight:600;color:var(--mm2)">'+cStr+'</td></tr>';
  }).join('');
  const bugun=proj[0].carpan, son5=proj[5].carpan;
  if($('mulSonuc'))$('mulSonuc').innerHTML=
    '<div class="lbl" style="margin-top:12px">EV SABİT · ÇARPAN ERİMESİ <span class="thin">(bugünkü EV korunur, EBITDA büyür)</span></div>'+
    '<table style="margin-top:4px"><tr><th>Dönem</th><th class="num">Ciro</th><th class="num">Marj</th><th class="num">EBITDA</th><th class="num">EV/EBITDA</th></tr>'+rows+'</table>'+
    '<div class="card" style="margin-top:10px"><div style="display:flex;align-items:baseline;gap:18px;flex-wrap:wrap">'+
      '<div><span class="sub">Bugün</span><br><span style="font-family:var(--mono);font-size:22px;font-weight:700;color:var(--mm2)">'+trN(bugun,1)+'x</span></div>'+
      '<div><span class="sub">5 yıl sonra</span><br><span style="font-family:var(--mono);font-size:22px;font-weight:700;color:'+(son5!=null&&son5<bugun?'var(--up)':'var(--down)')+'">'+(son5!=null?trN(son5,1)+'x':'\u2014')+'</span></div>'+
      (ref?'<div><span class="sub">'+trN(ref,1)+'x\'e iniş</span><br><span style="font-family:var(--mono);font-size:18px;font-weight:600">'+(refYil?refYil+'. yıl':'5+ yıl')+'</span></div>':'')+
    '</div></div>'+
    '<div class="note">Mantık: bugünkü <b>firma değeri (EV) sabit</b> tutulur — piyasanın bugün biçtiği fiyat. EBITDA senin büyüme+marj varsayımınla ilerler, EV/EBITDA çarpanı buna göre <em>erir</em>. Soru "hedef fiyat" değil: <em>bugün pahalı görünen çarpan, büyümeyle kaç yılda makullüğe iner?</em> '+(ref?('Referans '+trN(ref,1)+'x\'e '+(refYil?refYil+'. yılda iniyor.':'5 yılda inmiyor — büyüme yetersiz ya da çarpan fazla yüksek.')):'Referans çarpan girersen hangi yıl altına indiğini yeşille vurgularım.')+' Snapshot '+MULTIPLE.fiyat_tarihi+'; büyüme/marj tahminleri senin. Basitleştirme: EV sabit varsayılır — gerçekte güçlü nakit üretimi net borcu azaltıp EV\u0027yi de bir miktar düşürür.</div>';
}

/* ---- Sukuk / Tahvil Değerleme ---- */
function skParseTar(s){const m=String(s).trim().match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})$/);if(!m)return null;const d=new Date(+m[3],+m[2]-1,+m[1]);return isNaN(d)?null:d;}
function skFmtTar(d){return ('0'+d.getDate()).slice(-2)+'.'+('0'+(d.getMonth()+1)).slice(-2)+'.'+d.getFullYear();}
function skGun(d1,d2){return Math.round((d2-d1)/86400000);}
function skBazAl(){return parseInt(($('skBaz')||{}).value)||365;}
function skPV(akis,y){const B=skBazAl();let top=0;const sat=akis.map(a=>{const yk=a.vkg/B,isk=1/Math.pow(1+y,yk),pv=a.odeme*isk;top+=pv;return Object.assign({},a,{yk,isk,pv});});return{fiyat:top,sat};}
// Bloomberg-vari üç panel: Fiyatlama | Ek Getiri | Risk
function skPanel(cfg){
  const M=(v,d)=>v==null||!isFinite(v)?'—':trN(v,d);
  const satir=(l,v,vurgu)=>'<div style="display:flex;justify-content:space-between;gap:10px;padding:2px 0"><span class="sub" style="font-size:10.5px">'+l+'</span><span style="font-family:var(--mono);font-size:12px;'+(vurgu?'font-weight:700;color:var(--mm2)':'')+'">'+v+'</span></div>';
  const bolum=(b)=>'<div style="font-size:10px;font-weight:700;letter-spacing:.5px;color:var(--muted);margin:8px 0 3px;text-transform:uppercase">'+b+'</div>';
  const baslik=(t)=>'<div style="background:var(--line);border-radius:5px 5px 0 0;padding:5px 10px;font-size:11px;font-weight:700;letter-spacing:.4px">'+t+'</div>';
  let f=baslik('Fiyatlama')+'<div style="padding:7px 10px">';
  f+=bolum('Getiri')+satir('Basit Faiz',M(cfg.basit,3))+satir('Bileşik Faiz',M(cfg.bilesik,3),1);
  f+=bolum('Fiyat')+satir('Temiz Fiyat',M(cfg.temiz,3),1)+satir('Birikmiş '+(cfg.kira?'Kira':'Kupon'),M(cfg.birikmis,3))+satir('Kirli Fiyat',M(cfg.kirli,3))+satir('Takas Fiyatı',M(cfg.kirli,3));
  f+=bolum('Notional')+satir('Nominal',M(cfg.nominal,1))+satir('Net',M(cfg.nominal*cfg.kirli/100,1))+'</div>';
  let e=baslik('Ek Getiri')+'<div style="padding:7px 10px">';
  const ekS=(l,kiyas,not_)=>{if(kiyas==null||!isFinite(kiyas))return '';const bps=(cfg.bilesik-kiyas)*100;
    return '<div style="display:flex;justify-content:space-between;gap:8px;padding:3px 0;border-bottom:1px dashed var(--line)"><span class="sub" style="font-size:10.5px">'+l+'</span><span style="font-family:var(--mono);font-size:12px;white-space:nowrap"><b style="color:'+(bps>=0?'var(--up)':'var(--down)')+'">'+M(bps,1)+' bps</b> <span class="sub">· %'+M(kiyas,2)+(not_?' · '+not_:'')+'</span></span></div>';};
  const ekler=(cfg.ek||[]).map(x=>ekS(x[0],x[1],x[2])).join('');
  e+=(ekler||'<div class="sub" style="font-size:10px">Kıyas getirisi girilmedi — soldaki kıyas alanlarını doldurun.</div>')+'</div>';
  let r=baslik('Risk')+'<div style="padding:7px 10px">';
  r+=bolum('Durasyon')+satir('Macaulay',M(cfg.mac,2))+satir('Modife',M(cfg.mod,2))+satir('Efektif',M(cfg.efk,2));
  r+=satir('<b>Konveksite</b>',M(cfg.konv,3))+satir('<b>PVBP</b>',M(cfg.pvbp,3))+'</div>';
  const kutu=(ic)=>'<div style="border:1px solid var(--line2);border-radius:6px;overflow:hidden;flex:1;min-width:230px">'+ic+'</div>';
  return '<div class="card"><div class="lbl">'+esc(cfg.ad||'Kıymet')+' <span class="thin" style="font-weight:400">'+(cfg.alt||'')+'</span></div>'+
    '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:8px">'+kutu(f)+kutu(e)+kutu(r)+'</div></div>';
}
function skIRR(akis,hedef){let lo=-0.9,hi=10;for(let i=0;i<200;i++){const m=(lo+hi)/2,f=skPV(akis,m).fiyat;if(f>hedef)lo=m;else hi=m;}return (lo+hi)/2;}
let SK_SON=null, TRE_SON=null;
const SK_KEY='ktp_sukuk_kayit_v1';
const SK_ALAN=['skAd','skValor','skVade','skNominal','skKupon','skOranTipi','skSiklik','skTip','skMod','skKirli','skFiyat','skGetiri','skSonKupon','skIhrac','skAralik','skBaz','skTarihler','skKD','skKV','skKG'];
const TRE_ALAN=['treAd','treValor','treSonKupon','treSonrakiKupon','treVadeTar','treBaz','treMod','treSeri','treTemizG','treTlrefk','treE0','treEt','treGercek','treBirikmisG','treMarj','treKirli','treNominal','treKD','treKV','treKG'];
function skKayitOku(){try{return JSON.parse(localStorage.getItem(SK_KEY)||'[]');}catch(e){return[];}}
function skKayitYaz(l){try{localStorage.setItem(SK_KEY,JSON.stringify(l));}catch(e){}}
function skKaydet(tip){
  const ozet=tip==='tlrefk'?TRE_SON:SK_SON;
  if(!ozet){alert('Önce değerleme yapılmalı.');return;}
  const alanlar=tip==='tlrefk'?TRE_ALAN:SK_ALAN, girdi={};
  alanlar.forEach(id=>{const e=$(id);if(e)girdi[id]=e.value;});
  const l=skKayitOku();
  const eski=l.findIndex(x=>x.tip===tip&&x.ozet&&x.ozet.ad===ozet.ad&&x.ozet.valor===ozet.valor);
  const kayit={id:Date.now(),tip:tip,ozet:ozet,girdi:girdi,zaman:new Date().toISOString()};
  if(eski>=0)l[eski]=kayit;else l.unshift(kayit);
  skKayitYaz(l.slice(0,60));skKayitRender();
}
function skYukle(id){
  const k=skKayitOku().find(x=>String(x.id)===String(id));if(!k)return;
  Object.keys(k.girdi).forEach(f=>{const e=$(f);if(e)e.value=k.girdi[f];});
  if(k.tip==='tlrefk'){treDegerle();const el=$('treSonuc');if(el&&el.scrollIntoView)el.scrollIntoView({behavior:'smooth',block:'center'});}
  else{if(typeof sukukModGoster==='function')sukukModGoster();else sukukHesapla();const el=$('skSonuc');if(el&&el.scrollIntoView)el.scrollIntoView({behavior:'smooth',block:'center'});}
}
function skSil(id){const l=skKayitOku().filter(x=>String(x.id)!==String(id));skKayitYaz(l);skKayitRender();}
function skKayitRender(){
  const el=$('skKayitlar');if(!el)return;
  const l=skKayitOku();
  if(!l.length){el.innerHTML='<div class="sub" style="font-size:11px">Kayıt yok. Bir kıymeti değerledikten sonra <b>Kaydet</b> ile buraya ekle — bir dahaki bakışta temiz fiyatı ve getiriyi doğrudan görürsün.</div>';return;}
  const F=(v,d)=>v==null||!isFinite(v)?'—':trN(v,d);
  el.innerHTML='<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:11px"><thead><tr style="border-bottom:1px solid var(--line2)">'+
    ['KIYMET','TİP','VALÖR','TEMİZ','KİRLİ','BİRİKMİŞ','GETİRİ %','DURASYON',''].map((h,i)=>'<th style="text-align:'+(i<3?'left':(i===8?'right':'right'))+';padding:5px 6px;font-size:9px;letter-spacing:.4px;color:var(--muted)">'+h+'</th>').join('')+
    '</tr></thead><tbody>'+l.map(k=>{const o=k.ozet||{};
      return '<tr style="border-bottom:1px solid var(--line)">'+
      '<td style="padding:5px 6px;font-weight:600">'+esc(o.ad||'')+'</td>'+
      '<td style="padding:5px 6px"><span style="font-size:9px;letter-spacing:.4px;color:'+(k.tip==='tlrefk'?'var(--blue)':'var(--mm2)')+'">'+(k.tip==='tlrefk'?'TLREFK':'SABİT')+'</span></td>'+
      '<td style="padding:5px 6px;font-family:var(--mono)">'+esc(o.valor||'')+'</td>'+
      '<td style="padding:5px 6px;text-align:right;font-family:var(--mono);font-weight:700;color:var(--mm2)">'+F(o.temiz,3)+'</td>'+
      '<td style="padding:5px 6px;text-align:right;font-family:var(--mono)">'+F(o.kirli,3)+'</td>'+
      '<td style="padding:5px 6px;text-align:right;font-family:var(--mono);color:var(--muted)">'+F(o.birikmis,3)+'</td>'+
      '<td style="padding:5px 6px;text-align:right;font-family:var(--mono)">'+F(o.getiri,3)+'</td>'+
      '<td style="padding:5px 6px;text-align:right;font-family:var(--mono)">'+F(o.mac,2)+'</td>'+
      '<td style="padding:5px 6px;text-align:right;white-space:nowrap"><button class="btn" data-yukle="'+k.id+'" style="font-size:10px;padding:2px 7px">Yükle</button> <button class="btn" data-sil="'+k.id+'" style="font-size:10px;padding:2px 6px;opacity:.6">Sil</button></td></tr>';
    }).join('')+'</tbody></table></div>';
}
function skKayitInit(){
  const el=$('skKayitlar');
  if(el)el.addEventListener('click',e=>{const y=e.target.getAttribute&&e.target.getAttribute('data-yukle'),s=e.target.getAttribute&&e.target.getAttribute('data-sil');
    if(y)skYukle(y);else if(s){if(confirm('Kayıt silinsin mi?'))skSil(s);}});
  const b1=$('skKaydet');if(b1)b1.addEventListener('click',()=>skKaydet('sabit'));
  const b2=$('treKaydet');if(b2)b2.addEventListener('click',()=>skKaydet('tlrefk'));
  skKayitRender();
}
function skGunEkle(d,n){return new Date(d.getFullYear(),d.getMonth(),d.getDate()+n);}
function skDonemBasi(v){
  const ih=skParseTar(($('skIhrac')||{}).value), ar=parseInt(($('skAralik')||{}).value)||0;
  if(!ih||!ar)return null;
  let p=ih,g=0;
  while(g++<400){const nx=skGunEkle(p,ar);if(skGun(nx,v)<0)break;p=nx;}
  return p;
}
function sukukUret(){
  const ih=skParseTar(($('skIhrac')||{}).value), vd=skParseTar(($('skVade')||{}).value);
  const sik=parseInt(($('skSiklik')||{}).value)||2;
  let ar=parseInt(($('skAralik')||{}).value)||0;
  const out=[];
  if(ih&&vd&&ar>0){
    let d=ih,g=0;
    while(g++<400){d=skGunEkle(d,ar);const kalan=skGun(d,vd);if(kalan>0){out.push(skFmtTar(d));}else{out.push(skFmtTar(vd));break;}}
  }else if(vd){
    const ay=Math.round(12/sik);let d=vd,g=0;
    while(g++<400){out.unshift(skFmtTar(d));const p=new Date(d.getFullYear(),d.getMonth()-ay,d.getDate());const v=skParseTar(($('skValor')||{}).value);if(v&&skGun(v,p)<=0)break;d=p;}
  }
  if($('skTarihler'))$('skTarihler').value=out.join('\n');
  sukukHesapla();
}
function sukukModGoster(){
  const mod=$('skMod')?$('skMod').value:'fy';
  if($('skFiyatWrap'))$('skFiyatWrap').style.display=mod==='fy'?'':'none';
  if($('skGetiriWrap'))$('skGetiriWrap').style.display=mod==='gf'?'':'none';
  if($('skKirliWrap'))$('skKirliWrap').style.display=mod==='ky'?'':'none';
  sukukHesapla();
}
function sukukHesapla(){
  if(!$('skSonuc'))return;
  const v=skParseTar(($('skValor')||{}).value),nominal=parseFloat(($('skNominal')||{}).value)||100;
  const kuponHam=(parseFloat(($('skKupon')||{}).value)||0)/100, oranTipi=$('skOranTipi')?$('skOranTipi').value:'donemsel';
  let kupon=kuponHam;
  const sik=parseInt(($('skSiklik')||{}).value)||2, tip=$('skTip')?$('skTip').value:'yeni';
  const tumTarih=(($('skTarihler')||{}).value||'').split('\n').map(s=>skParseTar(s)).filter(Boolean).sort((x,y)=>x-y);
  // Geçmiş kuponlar (valör ve öncesi) hesaba girmez — ödenmiştir; listede kalabilir.
  const tarihler=v?tumTarih.filter(t=>skGun(v,t)>0):tumTarih;
  const gecmisAdet=tumTarih.length-tarihler.length;
  if(!v||!tarihler.length){$('skSonuc').innerHTML='<div class="sub">Valör tarihi ve en az bir kupon tarihi gerekli.</div>';if($('skTablo'))$('skTablo').innerHTML='';return;}
  let accrued=0;
  let skUyari='';
  // Gerçek dönem uzunluğu (gün): dönem başı→ilk kupon, yoksa ilk iki kupon arası, yoksa aralık/sıklık
  let PdonemBasi=skParseTar(($('skSonKupon')||{}).value)||skDonemBasi(v);
  let donemGun=0;
  if(PdonemBasi&&tarihler.length)donemGun=skGun(PdonemBasi,tarihler[0]);
  if(donemGun<=0&&tarihler.length>1)donemGun=skGun(tarihler[0],tarihler[1]);
  if(donemGun<=0)donemGun=parseInt(($('skAralik')||{}).value)||Math.round(skBazAl()/sik);
  if(oranTipi==='yillik'&&donemGun>0)kupon=kuponHam*donemGun/skBazAl();
  if(tip==='ikincil'){
    const N=tarihler[0], ay=Math.round(12/sik);
    let Pgir=PdonemBasi;
    if(Pgir&&(skGun(Pgir,N)<=0||skGun(Pgir,v)<0)){
      skUyari='Dönem başı alanına '+skFmtTar(Pgir)+' girildi — bu, gelecek kupon tarihi ya da valörden sonra. Bu alana içinde bulunduğun dönemin BAŞI girilir (son ödenen kupon; ilk dönemde ihraç valörü). Ay-geri tahminiyle devam edildi — gün-hassas birikmiş için düzelt.';
      Pgir=null;
    }
    const P=Pgir||new Date(N.getFullYear(),N.getMonth()-ay,N.getDate());
    const donem=skGun(P,N), gecen=skGun(P,v);
    if(donem>0&&gecen>0&&gecen<donem)accrued=100*kupon*gecen/donem;
    if(!skUyari&&accrued===0&&skGun(v,N)>0&&skGun(P,v)===0&&!Pgir)skUyari='';
  }
  const akis=[];
  tarihler.forEach(t=>akis.push({tar:t,vkg:skGun(v,t),odeme:100*kupon,tip:'Kupon'}));
  const sonT=tarihler[tarihler.length-1];
  akis.push({tar:sonT,vkg:skGun(v,sonT),odeme:100,tip:'Anapara'});
  const mod=$('skMod')?$('skMod').value:'fy';
  let y,kirli,temiz;
  if(mod==='gf'){y=(parseFloat(($('skGetiri')||{}).value)||0)/100;kirli=skPV(akis,y).fiyat;temiz=kirli-accrued;}
  else if(mod==='ky'){kirli=parseFloat(($('skKirli')||{}).value)||100;temiz=kirli-accrued;y=skIRR(akis,kirli);}
  else{temiz=parseFloat(($('skFiyat')||{}).value)||100;kirli=temiz+accrued;y=skIRR(akis,kirli);}
  const {sat}=skPV(akis,y);
  // Risk seti (DCF tablosundan) + görüntü-şablonu konvansiyonları
  const mac=sat.reduce((s,x)=>s+x.yk*x.pv,0)/kirli;
  const yPer=Math.pow(1+y,1/sik)-1;   // dönemsel getiri
  const modD=mac/(1+yPer);            // piyasa ekranı konvansiyonu: Mac / (1 + dönemsel)
  const efk=modD;                     // opsiyonsuz kâğıtta efektif ≈ modife
  const konv=sat.reduce((s,x)=>s+x.yk*(x.yk+1)*x.pv,0)/(kirli*Math.pow(1+y,2))/100;
  const pvbp=modD*kirli/10000;
  // Basit faiz: son kupon dönemine girmiş (tek akış) kâğıtta para-piyasası basiti; çok kuponluda bond-equivalent (m × dönemsel)
  let basit;
  if(sat.length<=2&&akis.length<=2){const cfT=akis.reduce((s,x)=>s+x.odeme,0),g=akis[0].vkg;basit=g>0?((cfT/kirli-1)*skBazAl()/g)*100:y*100;}
  else{const mm=donemGun>0?skBazAl()/donemGun:sik;basit=mm*(Math.pow(1+y,1/mm)-1)*100;}
  const kk=(id)=>{const x=parseFloat(($(id)||{}).value);return isFinite(x)?x:null;};
  if(!skUyari&&(y*100>250||y*100<-90))skUyari='Getiri %'+trN(y*100,0)+' çıktı — kupon oranı büyük ihtimalle YILLIK girildi ama DÖNEMSEL bekleniyor. Oran tipini "Yıllık (basit)" yap ya da dönemsele çevir: yıllık × dönem günü / gün bazı.';
  SK_SON={ad:(($('skAd')||{}).value)||'Sukuk',valor:(($('skValor')||{}).value)||'',temiz:temiz,kirli:kirli,birikmis:accrued,getiri:y*100,mac:mac,mod:modD};
  $('skSonuc').innerHTML=skPanel({ad:(($('skAd')||{}).value)||'Sukuk',
    alt:(tip==='ikincil'?'· ikincil piyasa':'· yeni ihraç')+' · gün bazı '+skBazAl()+(mod==='ky'?' · kirli fiyat girişi':'')+(gecmisAdet?' · '+gecmisAdet+' geçmiş kupon hesaba katılmadı':''),
    basit:basit,bilesik:y*100,temiz:temiz,birikmis:accrued,kirli:kirli,
    nominal:parseFloat(($('skNominal')||{}).value)||100,
    mac:mac,mod:modD,efk:efk,konv:konv,pvbp:pvbp,
    ek:[['Durasyona göre Ek Getiri',kk('skKD')],['Vadeye göre Ek Getiri',kk('skKV')],['Gösterge getirisine göre ek getiri',kk('skKG')]]})+(skUyari?'<div class="note" style="margin-top:6px;border-left:3px solid var(--warn,#d97706);padding-left:8px">⚠ '+esc(skUyari)+'</div>':'');
  const rows=sat.map(a=>'<tr><td>'+skFmtTar(a.tar)+'</td><td class="sub" style="font-size:10px">'+a.tip+'</td><td class="num">'+trN(a.odeme,2)+'</td><td class="num">'+a.vkg+'</td><td class="num">'+a.yk.toFixed(4)+'</td><td class="num">'+a.isk.toFixed(4)+'</td><td class="num">'+trN(a.pv,3)+'</td></tr>').join('');
  let tabAlt='<tr style="font-weight:700;border-top:2px solid var(--line2)"><td colspan="6">TOPLAM (PV) = '+(tip==='ikincil'?'Kirli Fiyat':'Değerleme Fiyatı')+'</td><td class="num">'+trN(kirli,3)+'</td></tr>';
  if(tip==='ikincil')tabAlt+='<tr><td colspan="6" class="sub">− Birikmiş Kupon</td><td class="num" style="color:#E8933B">'+trN(accrued,3)+'</td></tr><tr style="font-weight:700"><td colspan="6">= Temiz Fiyat</td><td class="num">'+trN(temiz,3)+'</td></tr>';
  if($('skTablo'))$('skTablo').innerHTML='<div style="overflow-x:auto"><table><tr><th>Kupon Tarihi</th><th></th><th class="num">Ödeme</th><th class="num">VKG</th><th class="num">VKG/365</th><th class="num">İsk. Faktörü</th><th class="num">PV (Cari)</th></tr>'+rows+tabAlt+'</table></div>';
}
function sukukInit(){
  ['skValor','skVade','skSiklik'].forEach(id=>{const e=$(id);if(e)e.addEventListener('input',sukukUret);});
  ['skAd','skNominal','skKupon','skFiyat','skGetiri','skTarihler','skKirli','skSonKupon','skIhrac','skAralik','skOranTipi','skBaz','skKD','skKV','skKG'].forEach(id=>{const e=$(id);if(e)e.addEventListener('input',sukukHesapla);});
  const md=$('skMod');if(md)md.addEventListener('change',sukukModGoster);
  const tp=$('skTip');if(tp)tp.addEventListener('change',sukukUret);
  pfInit();
  hyPaylasInit();
  const u=$('skUret');if(u)u.addEventListener('click',sukukUret);
  skKayitInit();
  sukukModGoster();
  sukukUret();
  treInit();
}
/* ---- TLREFK'e Endeksli Sukuk Değerleme (kanıtlanmış konvansiyonlar: 364 baz · doğrusal birikim · floater durasyon) ---- */
function treDegerle(){
  const el=$('treSonuc'); if(!el)return;
  const T=(id)=>skParseTar(($(id)||{}).value);
  const N=(id,vs)=>{const x=parseFloat(($(id)||{}).value);return isFinite(x)?x:vs;};
  const valor=T('treValor'), sonK=T('treSonKupon'), sonrK=T('treSonrakiKupon');
  const baz=N('treBaz',364), kirli=N('treKirli',null), nominal=N('treNominal',10000);
  const mod=$('treMod')?$('treMod').value:'endeks';
  const marj=N('treMarj',0);
  if(!valor||!sonK||!sonrK){el.innerHTML='<div class="sub">Valör, dönem başı ve sonraki kupon (reset) tarihleri gerekli.</div>';return;}
  if(kirli==null){el.innerHTML='<div class="sub">Kirli fiyat gerekli.</div>';return;}
  const donem=skGun(sonK,sonrK), gecen=skGun(sonK,valor), resete=skGun(valor,sonrK);
  if(donem<=0||gecen<0||resete<0){el.innerHTML='<div class="sub">Tarih sırası hatalı: dönem başı ≤ valör ≤ sonraki kupon.</div>';return;}
  // ---- Birikmiş kira: TLREFK endeksinin dönem başından bugüne bileşik birikimi ----
  let birikmis=null, kaynak='';
  if(mod==='seri'){
    const ham=(($('treSeri')||{}).value||'').split(/[\n,;\s]+/).map(x=>parseFloat(String(x).replace(',','.'))).filter(x=>isFinite(x)&&x>0);
    if(!ham.length){el.innerHTML='<div class="sub">Günlük TLREFK oranlarını yapıştır (her satır bir gün, yıllık % — eskiden yeniye).</div>';return;}
    let f=1; ham.forEach(r=>{f*=(1+r/100/baz);});
    birikmis=(f-1)*100; kaynak=ham.length+' günlük seri · bileşik';
    if(ham.length!==gecen)kaynak+=' (⚠ '+gecen+' gün bekleniyordu)';
  }else if(mod==='temiz'){
    const t=N('treTemizG',null);
    if(t==null){el.innerHTML='<div class="sub">Bilinen temiz fiyatı gir.</div>';return;}
    birikmis=kirli-t; kaynak='temizden geri hesap';
  }else if(mod==='basit'){
    const r=N('treTlrefk',null);
    if(r==null){el.innerHTML='<div class="sub">TLREFK oranı (yıllık basit %) gerekli.</div>';return;}
    birikmis=r*gecen/baz; kaynak='TLREFK %'+trN(r,3)+' · basit';
  }else if(mod==='endeks'){
    const E0=N('treE0',null), Et=N('treEt',null);
    if(E0==null||Et==null||E0<=0){el.innerHTML='<div class="sub">TLREFK endeks değerleri gerekli: dönem başı (E₀) ve valör günü (Eₜ).</div>';return;}
    birikmis=(Et/E0-1)*100; kaynak='endeks: '+trN(Et,6)+' / '+trN(E0,6);
    if(TRE_ENDEKS_TAR&&(TRE_ENDEKS_TAR.bas!==($('treSonKupon')||{}).value||TRE_ENDEKS_TAR.bit!==($('treValor')||{}).value))
      kaynak+=' ⚠ endeks '+TRE_ENDEKS_TAR.bas+'→'+TRE_ENDEKS_TAR.bit+' tarihlerine ait, yeniden çek';
  }else if(mod==='oran'){
    const r=N('treGercek',null);
    if(r==null){el.innerHTML='<div class="sub">Gerçekleşen bileşik TLREFK oranı (yıllık %) gerekli.</div>';return;}
    birikmis=(Math.pow(1+r/100/baz,gecen)-1)*100; kaynak='gerçekleşen bileşik %'+trN(r,3);
  }else{
    birikmis=N('treBirikmisG',null);
    if(birikmis==null){el.innerHTML='<div class="sub">Birikmiş kira (%) gerekli.</div>';return;}
    kaynak='elle girilen birikmiş';
  }
  if(marj)birikmis+=marj/10000*gecen/baz*100;   // ihraç marjı (bps), basit işler
  const temiz=kirli-birikmis;
  // ---- Gerçekleşen getirinin yıllıklaştırılması ----
  const basit=gecen>0?birikmis*baz/gecen:0;
  const m=donem>0?baz/donem:2;   // dönem sayısı (182g → 2)
  const bilesik=(Math.pow(1+basit/100/m,m)-1)*100;   // ekran konvansiyonu: (1+basit/m)^m−1
  const y=bilesik/100;
  const mac=resete/baz, modD=mac/(1+birikmis/100), efk=mac/(1+y);
  const konv=mac*mac/(2*Math.pow(1+y,2)), pvbp=modD*kirli/10000;
  const kk=(id)=>{const x=parseFloat(($(id)||{}).value);return isFinite(x)?x:null;};
  TRE_SON={ad:(($('treAd')||{}).value)||'TLREFK Sukuk',valor:(($('treValor')||{}).value)||'',temiz:temiz,kirli:kirli,birikmis:birikmis,getiri:bilesik,mac:mac,mod:modD};
  el.innerHTML=skPanel({ad:(($('treAd')||{}).value)||'TLREFK Sukuk',
    alt:'· gün bazı '+baz+' · dönem '+donem+'g · geçen '+gecen+'g · resete '+resete+'g · '+esc(kaynak),kira:1,
    basit:basit,bilesik:bilesik,temiz:temiz,birikmis:birikmis,kirli:kirli,nominal:nominal,
    mac:mac,mod:modD,efk:efk,konv:konv,pvbp:pvbp,
    ek:[['Durasyona göre Ek Getiri',kk('treKD')],['Vadeye göre Ek Getiri',kk('treKV')],['Gösterge getirisine göre ek getiri',kk('treKG')]]})+
    '<div class="note" style="margin-top:8px">TLREFK\'ye endeksli kâğıtta kira <b>dönem başında fixlenmez</b>; endeks her gün bileşik birikir ve kupon dönem sonunda belli olur. Birikmiş kira = (Eₜ / E₀ − 1); E₀ dönem başı, Eₜ valör günü TLREFK endeks değeri. Alternatif girişler: gerçekleşen bileşik oran (yıllık %, günlük bileşikle birikime çevrilir) veya doğrudan birikmiş kira. İhraç marjı varsa bps olarak eklenir. Basit/bileşik satırları <b>dönem başından bugüne gerçekleşen</b> birikimin yıllıklaştırılmasıdır. Durasyon resete kalan süredir.</div>';
}
let TRE_ENDEKS_TAR=null;
async function treCek(){
  const d=$('treCekDurum');
  const bas=($('treSonKupon')||{}).value, bit=($('treValor')||{}).value, baz=($('treBaz')||{}).value||364;
  if(!bas||!bit){if(d)d.textContent='dönem başı ve valör gerekli';return;}
  if(d)d.textContent='çekiliyor…';
  try{
    const r=await fetch('/api/evds2?mod=tlref&bas='+encodeURIComponent(bas)+'&bit='+encodeURIComponent(bit)+'&baz='+baz);
    const j=await r.json();
    if(!j.ok){if(d)d.textContent=j.err||'çekilemedi';return;}
    const m=$('treMod');
    if(j.tip==='endeks'){
      if($('treE0'))$('treE0').value=j.E0;
      if($('treEt'))$('treEt').value=j.Et;
      TRE_ENDEKS_TAR={bas:bas,bit:bit};
      if(m){m.value='endeks';treModGoster();}
      if(d)d.textContent='TLREF endeksi '+j.E0Tarih+' → '+j.EtTarih+' · birikim %'+trN(j.birikim,3)+' (basit eşd. %'+trN(j.basitEsdeger,2)+') · ⚠ TLREFK değil';
    }else{
      if($('treSeri'))$('treSeri').value=(j.oranlar||[]).join('\n');
      if(m){m.value='seri';treModGoster();}
      if(d)d.textContent='TLREF oranları · '+j.gozlem+' gözlem · birikim %'+trN(j.birikim,3)+' · ⚠ TLREFK değil';
    }
    treDegerle();
  }catch(e){if(d)d.textContent='bağlantı hatası';}
}
function treModGoster(){
  const m=$('treMod')?$('treMod').value:'endeks';
  const g=(id,s)=>{const e=$(id);if(e)e.style.display=s?'':'none';};
  g('treSeriWrap',m==='seri');g('treTemizWrap',m==='temiz');g('treBasitWrap',m==='basit');g('treEndeksWrap',m==='endeks');g('treOranWrap',m==='oran');g('treBirikmisWrap',m==='birikmis');
  treDegerle();
}
function treInit(){
  ['treAd','treValor','treSonKupon','treSonrakiKupon','treVadeTar','treBaz','treMod','treSeri','treTemizG','treTlrefk','treE0','treEt','treGercek','treBirikmisG','treMarj','treKirli','treNominal','treKD','treKV','treKG'].forEach(id=>{const e=$(id);if(e)e.addEventListener('input',treDegerle);});
  const b=$('treHesapla');if(b)b.addEventListener('click',treDegerle);
  const m=$('treMod');if(m)m.addEventListener('change',treModGoster);
  const c=$('treCek');if(c)c.addEventListener('click',treCek);
  ['treSonKupon','treValor'].forEach(id=>{const e=$(id);if(e)e.addEventListener('change',()=>{
    if(($('treMod')||{}).value==='endeks'&&TRE_ENDEKS_TAR)treCek();});});
  treModGoster();
  treDegerle();
}

/* §245: aiInit() SİLİNDİ — ölü koddu. Hedef kabı #aiKartlar panelde YOKTU;
   ilk satırı `if(!el) return` olduğu için her açılışta sessizce dönüyordu.
   Canlı halefi incelemeInit() → #incelemeBody, aynı inceleme-ai.json'ı okur.
   Ölü kod zararsız değildir: hata atmadığı için boot onu BAŞARI sayıyor ve
   "✓ tüm modüller yüklendi" raporunu yalancı yapıyordu (§60 deseni).
   Yarım silme yapılmadı — boot kaydı da kaldırıldı, başka çağrısı yoktu. */

/* ── §245 KENDİ KENDİNE TARİHLENEN TAKVİM SATIRLARI ──────────────────────────
   SORUN: iki satır elle yazılmış tarih taşıyordu ve ikisi de bayatlamıştı —
   "Sıradaki FOMC: 28–29 Tem" (toplantı 29 Tem'de YAPILDI, faiz sabit kaldı)
   ve "Sıradaki haftalık veri: 23 Tem Per" (8 gün geride).
   Bu, damga çizelgesinin 1. ALTIN KURALININ ihlali değil — mutlak tarih
   yazılmıştı — ama daha sinsi bir kusur: tarih DOĞRU biçimde yazılmış ama
   OLAY GEÇMİŞ. §56'nın "rakam içeren statik metin ya canlıya bağlanır ya
   rakamsızlaştırılır" kuralının tarih karşılığı.
   Yeni bir sabit tarih yazmak yalnız saati sıfırlardı; iki hafta sonra aynı
   yerde olurduk. İkisi de HESAPLANABİLİR olduğu için hesaplanıyor:
     · FOMC  — takvim yıl önceden yayımlanır, listede tutulur, sıradaki seçilir
     · TCMB  — haftalık yayın Perşembe; sıradaki Perşembe takvimden türer
   §215 dersi (kural varsa yaptırım da olmalı) burada mekanizmaya dönüşüyor:
   bu iki satır artık ELLE tazelenemez, dolayısıyla bayatlayamaz. */
const FOMC_2026 = [   /* Fed'in yayımladığı resmî takvim · karar 2. gün 21:00 TSİ */
  ['2026-01-27','2026-01-28',false],['2026-03-17','2026-03-18',true],
  ['2026-04-28','2026-04-29',false],['2026-06-16','2026-06-17',true],
  ['2026-07-28','2026-07-29',false],['2026-09-15','2026-09-16',true],
  ['2026-10-27','2026-10-28',false],['2026-12-08','2026-12-09',true],
  /* 2027 Fed'in ÖN takvimi — bir önceki toplantıda kesinleşir */
  ['2027-01-26','2027-01-27',false],['2027-03-16','2027-03-17',true]
];
function takvimSatirlari(){
  const AY=['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
  const bugun=new Date(); bugun.setHours(0,0,0,0);
  const trh=(s)=>{const p=s.split('-');return (+p[2])+' '+AY[+p[1]-1];};

  const f=$('fomcSonraki');
  if(f){
    /* Karar günü GEÇMİŞSE sıradakine bak — toplantının ilk günü değil, İKİNCİ
       günü belirleyicidir (karar o gün açıklanır). 28-29 Tem'de kart 29'una
       kadar "sıradaki" kalır, 30'unda Eylül'e döner. */
    const s=FOMC_2026.find(x=>new Date(x[1]+'T23:59:59')>=bugun);
    f.textContent = s
      ? trh(s[0])+'–'+trh(s[1])+(s[2]?' · SEP + nokta grafiği':'')
      : 'takvim güncellenmeli';
    if(!s) f.style.color='var(--down)';
  }

  const t=$('tcmbHaftalik');
  if(t){
    /* TCMB haftalık yayınları PERŞEMBE. Bugün Perşembeyse bugünü gösterir
       (yayın gün içinde çıkar), değilse sıradaki Perşembeyi. */
    const d=new Date(bugun); const fark=(4-d.getDay()+7)%7;
    d.setDate(d.getDate()+fark);
    t.textContent = (d.getDate())+' '+AY[d.getMonth()]+' Per';
  }
}

/* ---- Veri Tazeliği (guncelleme-plani.json) ---- */
/* §245p TAZELİK HESABI TEK SAHİPTE (§112).
   İKİ AYRI OKUYUCU VARDI ve panel kendisiyle çelişiyordu:
     ajan.js tazelikNobeti()  dosya tarihi okur ✓ · sıklık normalize ✓ · yaptırım ✓
     app.js  planInit()       yalnız plan.son okur ✗ · birebir 'canli' ✗ · sessiz 7 ✗
   Sonuç 2 Ağu'da görüldü: "Yabancı para akışı + carry — 17 Tem · GÜNCELLE"
   kırmızı yanıyordu, oysa yabanci.json kendi içinde 28 Tem yazıyor (5 gün, TAZE).
   Nöbet panosu doğruyu, çekmece yanlışı söylüyordu. §112 tam bu yüzden var:
   AYNI BÜYÜKLÜĞÜN İKİ SAHİBİ OLMAZ — biri düzeltilir, öteki eskir.
   §198 ve §245 düzeltmelerini ajan.js'e üç kez uyguladım ama "bu işi başka
   kim yapıyor" diye sormadım. Ders: bir düzeltmeyi uygularken önce AYNI İŞİ
   YAPAN başka kod var mı diye aranır.
   Artık hesap BURADA, window.tazelikHesap olarak; ajan.js de bunu kullanır
   (app.js index.html'de ajan.js'ten ÖNCE yükleniyor — sıra güvenli). */
window.tazelikHesap = (function(){
  const norm = (s) => String(s||'').toLowerCase()
    .replace(/\(.*?\)/g,'')
    .replace(/[ıİ]/g,'i').replace(/[şŞ]/g,'s').replace(/[çÇ]/g,'c')
    .replace(/[ğĞ]/g,'g').replace(/[üÜ]/g,'u').replace(/[öÖ]/g,'o')
    .replace(/[^a-z]/g,'');
  /* Dosyaların KENDİ tarih damgası — plan `son` alanı elle tutulduğu için
     geride kalabilir; hangisi YENİYSE o geçerlidir. */
  async function dosyaTarihleri(katmanlar){
    const t = {};
    await Promise.all((katmanlar||[]).map(async k=>{
      const f = String(k.dosya||'');
      if(!f.endsWith('.json') || f.indexOf('/')>=0) return;
      try{
        const r = await fetch('/'+f, {cache:'no-store'});
        if(!r.ok) return;
        const j = await r.json();
        const d = j.guncelleme || j.tarih || j.fiyat_tarihi || null;
        if(d) t[f] = d;
      }catch(e){}
    }));
    return t;
  }
  function limitCoz(ham, sg, k){
    /* §245p KATMANA ÖZEL LİMİT. Bazı kaynakların YAPISAL yayın gecikmesi var:
       TCMB haftalık rezerv Perşembe yayınlanır ama veri bir önceki CUMA'ya
       aittir — yani bu katman doğası gereği 6–12 gün arasında salınır.
       Genel 7 günlük haftalık limit, haftanın çoğunda boşuna turuncu yakar
       ve uyarı gürültüye dönüşür (§243'ün tam olarak uyardığı şey).
       Alarm, veri "eski" olduğunda değil YAYIN KAÇTIĞINDA çalmalı.
       Katman kaydına limit_gun konursa sözlüğün önüne geçer. */
    if(k && k.limit_gun != null && isFinite(k.limit_gun))
      return {limit:+k.limit_gun, anahtar:norm(ham), ozel:true};
    const n = norm(ham), anahtarlar = Object.keys(sg||{});
    if(sg && sg[n] != null) return {limit:sg[n], anahtar:n};
    const p = anahtarlar.find(a => n.indexOf(a) === 0);
    if(p) return {limit:sg[p], anahtar:p};
    return {limit:null, anahtar:null};   /* TANIMSIZ — sessizce varsayma */
  }
  /* §252q SEZON KURALI TEK SAHIBE TASINDI.
     §245p bu hesabi window.tazelikHesap'ta birlestirdigini SOYLUYORDU ("ajan.js
     de bunu kullanir") ama OLCULDU: ajan.js tazelikHesap'i HIC CAGIRMIYOR —
     kendi sikCoz/dosyaTarihleri/dongusunu calistiriyor. Birlestirme YARIM
     KALMIS; app.js tarafi yazilmis, ajan.js tarafi tasinmamis.
     GORUNEN BELIRTI: sezon kurali (bilanco sezonunda 'sezon:true' katmanlarin
     limiti sezon_limit_gun'e DUSER) yalniz ajan.js:445'te vardi. 10 Agu
     olcumu: BES katman ayrisiyor — Faktor modeli 27g ve Guidance 24g Ebu'ya
     gore BAYAT, cekmeceye gore TAZE(90). Sezon ortasinda faktor tabani 27
     gunluk; cekmeceye bakan "her sey yolunda" goruyor.
     §112'nin kurali: AYNI BUYUKLUGUN IKI SAHIBI OLMAZ. Kural artik BURADA;
     ajan.js'in kendi dongusu de ayni sonucu uretir (limit hesabi ozdes). */
  /* Tek katmanın durumu: {tip, gun, limit, tarih} · tip: canli|olay|taze|yaklasti|bayat|tanimsiz */
  function durum(k, sg, dosyaT, bugun, sezonCtx){
    const S = limitCoz(k.siklik, sg, k);
    if(S.anahtar === 'canli' || k.son === 'otomatik') return {tip:'canli'};
    if(S.anahtar === 'olay') return {tip:'olay', tarih:k.son};
    if(S.limit == null) return {tip:'tanimsiz', siklik:k.siklik};
    const df = dosyaT[String(k.dosya||'')] || null;
    const pd = (k.son && /^\d{4}/.test(k.son)) ? new Date(k.son) : null;
    const dd = df ? new Date(df) : null;
    const d = (dd && (!pd || dd > pd)) ? dd : pd;      /* YENİ olan geçerli */
    if(!d || isNaN(d)) return {tip:'olay', tarih:k.son};
    const gun = Math.floor((bugun - d) / 86400000);
    /* Sezon indirimi: yalnizca k.sezon isaretli katmanlarda ve YALNIZCA limiti
       DUSURUR (asla yukseltmez). sezonCtx verilmezse davranis eskisi gibi. */
    let limit = S.limit, sez = false;
    const sc = sezonCtx || {};
    if(k.sezon && sc.sezonda && sc.sezonLimit != null && limit > sc.sezonLimit){
      limit = sc.sezonLimit; sez = true;
    }
    const tip = gun <= limit ? 'taze' : (gun <= limit*2 ? 'yaklasti' : 'bayat');
    return {tip, gun, limit, sez, limitNormal:S.limit, tarih:d.toISOString().slice(0,10),
            kaynak:(dd && (!pd || dd > pd)) ? 'dosya' : 'plan'};
  }
  /* Sezon baglamini plandan uretir — cagiranlarin ay hesabi kopyalamasina gerek yok */
  function sezonBaglam(plan, bugun){
    const aylar = (plan && plan.bilanco_sezonu_aylar) || [];
    const lim = (plan && plan.sezon_limit_gun) || 10;
    const d = bugun || new Date();
    return {sezonda: aylar.indexOf(d.getMonth()+1) >= 0, sezonLimit: lim};
  }
  return {norm, dosyaTarihleri, limitCoz, durum, sezonBaglam};
})();

async function planInit(){
  let plan;
  try{plan=await (await fetch('/guncelleme-plani.json',{cache:'no-store'})).json();}catch(e){return;}
  if(!$('planBody'))return;
  const bugun=new Date(), sg=plan.siklik_gun;
  const ayKisa=['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
  const fmtKisa=s=>{const d=new Date(s);return isNaN(d)?String(s||'—'):(d.getDate()+' '+ayKisa[d.getMonth()]);};
  const TZ=window.tazelikHesap;
  const SEZ=TZ.sezonBaglam(plan, bugun);   /* §252q */
  const dosyaT=await TZ.dosyaTarihleri(plan.katmanlar);
  let bayat=0;
  const html=plan.katmanlar.map(k=>{
    const D=TZ.durum(k, sg, dosyaT, bugun, SEZ);   /* §252q sezon indirimi */
    let renk,durum;
    if(D.tip==='canli'){renk='#0FA26B';durum='CANLI';}
    else if(D.tip==='olay'){renk='#8FA098';durum=fmtKisa(D.tarih)+' · olay';}
    else if(D.tip==='tanimsiz'){renk='#DE4B5E';durum='SIKLIK TANIMSIZ';bayat++;}
    else{
      const et=fmtKisa(D.tarih);
      /* §245p: tarih DOSYADAN geldiyse minik iz — plan geride kaldığında
         "neden farklı" sorusunu kod sordurmasın diye. */
      const iz=(D.kaynak==='dosya')?'<span class="thin" style="font-size:8px"> ·dosya</span>':'';
      /* §252q sezon indirimi uygulandiysa SOYLENIR. Aksi halde kullanici
         "90 gunluk katman neden 24 gunde kirmizi" diye sorar ve cevabi kodda
         arar. Gizli siki limit, gizli gevsek limit kadar kafa karistirir. */
      const sz=D.sez?'<span class="thin" style="font-size:8px"> ·sezon '+D.limit+'g</span>':'';
      if(D.tip==='taze'){renk='#0FA26B';durum=et+' · taze'+iz+sz;}
      else if(D.tip==='yaklasti'){renk='#E8933B';durum=et+' · vade yaklaştı'+iz+sz;}
      else{renk='#DE4B5E';durum=et+' · GÜNCELLE'+iz+sz;bayat++;}
    }
    return '<span class="fitem"><span class="fdot" style="background:'+renk+'"></span>'+k.ad+' — <span style="color:'+renk+';font-weight:600">'+durum+'</span></span>';
  }).join('');
  $('planBody').innerHTML=html;
  const trig=$('drawerTrigger');
  if(trig){
    const eski=trig.querySelector('.bayatRozet'); if(eski)eski.remove();
    if(bayat>0){const r=document.createElement('span');r.className='bayatRozet';r.textContent=bayat;r.style.cssText='background:#DE4B5E;color:#fff;border-radius:8px;padding:0 5px;margin-left:5px;font-size:9px;font-weight:700';trig.appendChild(r);}
  }
}

/* ---- Portföy Yönetimi ---- */
let ANALIST=null, MFIYAT={}, MHACIM={}, MADET={}, MULTIPLE_TARIH='', MRISK={};
async function pyInit(){
  try{ANALIST=await (await fetch('/analist.json',{cache:'no-store'})).json();}catch(e){}
  let MJSON=null;
  try{MJSON=await (await fetch('/multiple.json',{cache:'no-store'})).json();MULTIPLE_TARIH=MJSON.fiyat_tarihi;MJSON.hisseler.forEach(h=>{MFIYAT[h.k]=h.fiyat;MHACIM[h.k]=h.hacim;MADET[h.k]=h.adet;});}catch(e){}
  /* §244 TEMETTÜ KARTI KALDIRILDI — veri çekimi de kalktı.
     Kart iki bilgi veriyordu: portföyün ağırlıklı temettü verimi ve en yüksek
     verimli 19 hisse. İkisi de panelin karar akışına girmiyordu:
     katılım evreninde temettü bir seçim ölçütü değil, sonuç.
     Kullanılmayan bir kartı beslemek için her açılışta bir dosya çekmek,
     hem gereksiz istek hem de bakım yükü (§240'ta 22 çekimi tek tek elden
     geçirmiştik — biri buydu). */
  try{const rr=await (await fetch('/risk.json',{cache:'no-store'})).json();rr.hisseler.forEach(h=>MRISK[h.k]={vol:h.vol,beta:h.beta});}catch(e){}
  const ara=$('anaAra');if(ara)ara.addEventListener('input',anaRender);
  anaRender();atifRender();riskMetRender();likiditeRender();
  try{ if(typeof omurgaInit==='function') omurgaInit(); }catch(e){}
  // Canlı fiyat: 141 hisseyi Yahoo'dan toplu çek, snapshot fiyatlarının üzerine yaz
  try{
    if(MJSON&&MJSON.hisseler&&MJSON.hisseler.length){
      const kodlar=MJSON.hisseler.map(h=>h.k).join(',');
      const r=await fetch('/api/market?mod=fiyat&kodlar='+encodeURIComponent(kodlar));
      if(r.ok){
        const d=await r.json();
        if(d&&d.ok&&d.fiyat){
          let sayac=0;
          Object.keys(d.fiyat).forEach(k=>{ MFIYAT[k]=d.fiyat[k]; CANLI_FIYAT[k]=d.fiyat[k]; sayac++; });
          // MULTIPLE (değerleme kartı) fiyatlarını da güncelle (yüklüyse)
          if(MULTIPLE&&MULTIPLE.hisseler){MULTIPLE.hisseler.forEach(h=>{ if(d.fiyat[h.k]!=null)h.fiyat=d.fiyat[h.k]; });if(typeof multipleRender==='function')multipleRender();}
          if(sayac>0){
            MULTIPLE_TARIH=d.tarih+' · canlı';   // artık snapshot değil canlı
            // kartları canlı fiyatla yeniden çiz
            atifRender();riskMetRender();likiditeRender();
            if(typeof multipleRender==='function')multipleRender();
          }
        }
      }
    }
  }catch(e){}
}
function anaRender(){
  if(!$('anaKart'))return;
  const q=($('anaAra')?$('anaAra').value:'').toUpperCase().trim();
  if(!q){$('anaKart').innerHTML='<div class="sub">Ticker yazın — analist konsensüsü açılır (55 hisse kapsamda: THYAO, ASELS, TUPRS, BIMAS, MGROS...).</div>';return;}
  const h=ANALIST?ANALIST.hisseler.find(x=>x.k===q):null;
  if(!h){$('anaKart').innerHTML='<div class="card"><div class="sub">'+esc(q)+' için analist takibi bulunamadı — küçük ya da kurumların kapsamadığı bir hisse.</div></div>';return;}
  const fiyat=MFIYAT[q], pot=fiyat?(h.hedef/fiyat-1)*100:null, potCl=pot==null?'':pot>=0?'up':'down';
  $('anaKart').innerHTML='<div class="card"><div class="lbl">'+h.k+' · ANALİST KONSENSÜSÜ</div>'+
    '<div style="display:flex;gap:24px;flex-wrap:wrap;align-items:baseline;margin-top:8px">'+
    '<div><span class="sub">Takip eden kurum</span><br><span style="font-family:var(--mono);font-size:26px;font-weight:700;color:var(--mm2)">'+h.kurum+'</span></div>'+
    '<div><span class="sub">Ort. hedef fiyat</span><br><span style="font-family:var(--mono);font-size:22px">'+trN(h.hedef,2)+' ₺</span></div>'+
    (fiyat?'<div><span class="sub">Güncel</span><br><span style="font-family:var(--mono);font-size:18px">'+trN(fiyat,2)+' ₺</span></div>':'')+
    (pot!=null?'<div><span class="sub">Yukarı potansiyel</span><br><span class="'+potCl+'" style="font-family:var(--mono);font-size:20px;font-weight:700">'+(pot>=0?'+':'')+trN(pot,0)+'%</span></div>':'')+
    '</div>'+
    /* §179: BAYAT ve TEK KURUM uyarıları. analist.json'da son 6 ayda rapor
       bulunmayan hisseler "bayat":true taşır; hedefleri ESKİ, güncel fiyatla
       kıyaslanınca sahte potansiyel üretirler (SNGYO'da +%238 çıkıyordu, gerçek
       değil — eski hedefin artefaktı). Ayrıca tek kurumlu isimde "konsensüs"
       kelimesi yanıltıcıdır: 21 hissede kurum sayısı 1. İkisi de kartta yazılır. */
    (h.bayat?'<div class="note" style="border-left:3px solid var(--down)"><b>⚠ BAYAT HEDEF.</b> '+
      esc(h.k)+' için son 6 ayda aracı kurum raporu YOK. Aşağıdaki hedef eski bir rapordan; '+
      'güncel fiyatla kıyaslanınca çıkan potansiyel GERÇEK DEĞİLDİR.</div>':'')+
    (h.kurum===1?'<div class="note"><b>Tek kurum.</b> Bu bir konsensüs değil, tek bir aracı kurumun görüşü. '+
      'Sapma riski yüksek.</div>':'')+
    '<div class="note">'+h.kurum+' aracı kurum '+h.k+' için ortalama '+trN(h.hedef,2)+' ₺ hedef fiyat veriyor'+(pot!=null?' — bugünkü fiyattan %'+trN(Math.abs(pot),0)+' '+(pot>=0?'yukarı':'aşağı'):'')+'. (Son 1 yıl, kurum başına en güncel rapor.) Bunu kendi DCF/multiple değerlemenle kıyasla: <em>senin modelin ile piyasa konsensüsü ayrışıyorsa, alfa orada saklıdır.</em></div>'+
    '</div>';
}
function atifRender(){
  if(!$('atifBody'))return;
  const hisseler=poz.filter(p=>p.tip!=='nakit'&&p.kod);
  if(!hisseler.length){$('atifBody').innerHTML='<div class="sub">Command Center\'da hisse pozisyonu ekleyince getiri atfı burada görünür.</div>';return;}
  const toplam=hisseler.reduce((s,p)=>s+p.adet*(p.maliyet||p.fiyat),0);
  let rows=hisseler.map(p=>{
    const kod=p.kod.toUpperCase();
    const maliyet=p.maliyet||p.fiyat;                       // gerçek maliyet (p.fiyat artık canlı güncelleniyor!)
    const canli=(typeof CANLI_FIYAT!=='undefined'&&CANLI_FIYAT[kod])?CANLI_FIYAT[kod]:null;
    const guncel=canli||((p.fiyat&&p.fiyat!==maliyet)?p.fiyat:null)||MFIYAT[kod]||null;  // canlı > pozFiyatOto > snapshot
    const deger=p.adet*maliyet,w=toplam?deger/toplam:0,getiri=(guncel&&maliyet)?(guncel/maliyet-1)*100:null;
    return {kod,maliyet,guncel,w,getiri,katki:getiri!=null?w*getiri:null};});
  const gecerli=rows.filter(r=>r.katki!=null), yok=rows.filter(r=>r.katki==null).map(r=>r.kod);
  if(!gecerli.length){$('atifBody').innerHTML='<div class="note">Pozisyonlarının güncel fiyatı snapshot\'ta yok ('+yok.join(', ')+'). Atıf için multiple.json kapsamındaki hisseler gerekir.</div>';return;}
  const portGetiri=gecerli.reduce((s,r)=>s+r.katki,0);
  gecerli.sort((a,b)=>b.katki-a.katki);
  const enIyi=gecerli[0], enKotu=gecerli[gecerli.length-1];
  const satirlar=gecerli.map(r=>'<tr><td><b>'+r.kod+'</b></td><td class="num">'+trN(r.maliyet,2)+'</td><td class="num">'+trN(r.guncel,2)+'</td><td class="num '+(r.getiri>=0?'up':'down')+'">'+(r.getiri>=0?'+':'')+trN(r.getiri,1)+'%</td><td class="num">%'+trN(r.w*100,1)+'</td><td class="num '+(r.katki>=0?'up':'down')+'" style="font-weight:600">'+(r.katki>=0?'+':'')+trN(r.katki,2)+'</td></tr>').join('');
  $('atifBody').innerHTML=
    '<div class="card"><div style="display:flex;gap:22px;flex-wrap:wrap;align-items:baseline">'+
    '<div><span class="sub">Portföy getirisi (maliyete göre)</span><br><span class="'+(portGetiri>=0?'up':'down')+'" style="font-family:var(--mono);font-size:26px;font-weight:700">'+(portGetiri>=0?'+':'')+trN(portGetiri,2)+'%</span></div>'+
    (enIyi?'<div><span class="sub">En çok katkı</span><br><span class="up" style="font-family:var(--mono);font-size:14px">'+enIyi.kod+' +'+trN(enIyi.katki,2)+' p</span></div>':'')+
    (enKotu&&enKotu!==enIyi?'<div><span class="sub">En çok götüren</span><br><span class="down" style="font-family:var(--mono);font-size:14px">'+enKotu.kod+' '+trN(enKotu.katki,2)+' p</span></div>':'')+
    '</div></div>'+
    '<table style="margin-top:8px"><tr><th>Hisse</th><th class="num">Maliyet</th><th class="num">Güncel</th><th class="num">Getiri</th><th class="num">Ağırlık</th><th class="num">Katkı (p)</th></tr>'+satirlar+'</table>'+
    (yok.length?'<div class="note">Snapshot dışı (atıfa dahil değil): '+yok.join(', ')+'.</div>':'')+
    '<div class="note">Katkı = ağırlık × getiri; portföy getirisi bunların toplamı. Maliyet = Command Center\'da girdiğin maliyet · Güncel = canlı fiyat (Yahoo, panel açılışında tazelenir; canlı yoksa snapshot yedeği: '+MULTIPLE_TARIH+'). Tek hissenin mi taşıdığını yoksa dengeli mi olduğunu buradan görürsün.</div>';
}
function riskMetRender(){
  if(!$('riskMetBody'))return;
  const hisseler=poz.filter(p=>p.tip!=='nakit'&&p.kod);
  const nakit=poz.filter(p=>p.tip==='nakit').reduce((s,p)=>s+(p.adet*p.fiyat||0),0);
  if(!hisseler.length){$('riskMetBody').innerHTML='<div class="sub">Pozisyon ekleyince risk metrikleri hesaplanır.</div>';return;}
  const {kapsanan,disi}=pozHisse();
  const hisseToplam=hisseler.reduce((s,p)=>s+p.adet*p.fiyat,0), toplamVarlik=hisseToplam+nakit;
  const ws=hisseler.map(p=>p.adet*p.fiyat/hisseToplam), hhi=ws.reduce((s,w)=>s+w*w,0), eff=1/hhi, enBuyuk=Math.max.apply(null,ws)*100;
  const sekAg={};kapsanan.forEach(x=>{sekAg[x.s]=(sekAg[x.s]||0)+x.w;});
  const sekHHI=Object.values(sekAg).reduce((s,w)=>s+w*w,0);
  const sekSort=Object.entries(sekAg).sort((a,b)=>b[1]-a[1]), enBuyukSek=sekSort[0];
  const nakitOran=toplamVarlik?nakit/toplamVarlik*100:0;
  /* §302 TEK SAHİP (§112): Bu kart eskiden vol/VaR'ı KENDİ hesaplıyordu —
     pVol = Σw·vol (korelasyonsuz toplam). riskButceHesap() aynı büyüklüğü tek
     faktör modeliyle hesaplar ve o kodun İÇİNDE bu yönteme zaten "eski (yanlış)
     yöntem" yazılmıştı: volNaif yalnız kıyas için tutuluyor. Aynı portföy iki
     kartta iki farklı risk gösteriyordu; naif motor emekli edildi, iki kart
     artık TEK motordan okur. Fark ölçüldü: naif yöntem çeşitlendirme faydasını
     yok sayar, vol'u sistematik+idiyosinkratik ayrışımına göre 5-10 puan şişkin
     gösterir — VaR da o şişkin voldan türediği için aynı oranda abartılıydı.
     Bonus: motor canlı fiyat kullanır (CANLI_FIYAT→MFIYAT), eski kart pozisyon
     giriş fiyatında (p.fiyat) kalıyordu.
     "Sharpe (varsayımsal)" satırı kaldırıldı: (β·10)/vol — prim varsayımı
     uydurmaydı, yerine motorun ÖLÇTÜĞÜ çeşitlendirme kazancı kondu. */
  const h=(typeof riskButceHesap==='function')?riskButceHesap():{bos:true};
  let piyasaBolum='';
  if(!h.bos){
    const gVol=h.volP/Math.sqrt(252)/100, var95g=h.riskliToplam*gVol*1.645, var95a=var95g*Math.sqrt(21);
    piyasaBolum='<div class="grid g2" style="margin-top:8px">'+
      '<div class="card"><div class="lbl">PİYASA RİSKİ <span class="thin" style="font-weight:400">(risk bütçesi motoru · tek sahip §302)</span></div>'+
      '<div class="kv"><span class="k">Portföy betası (XKTUM)</span><span class="'+(h.betaP>1.1?'down':h.betaP<0.9?'up':'')+'" style="font-weight:600">'+trN(h.betaP,2)+'</span></div>'+
      '<div class="kv"><span class="k">Yıllık volatilite (çeşitlendirilmiş)</span><span>%'+trN(h.volP,1)+'</span></div>'+
      '<div class="kv"><span class="k">Çeşitlendirme kazancı</span><span class="up" title="naif toplam %'+trN(h.volNaif,1)+' − model %'+trN(h.volP,1)+'">−'+trN(h.cesitKazanc,1)+' puan</span></div></div>'+
      '<div class="card"><div class="lbl">RİSKTEKİ DEĞER (VaR %95)</div>'+
      '<div class="kv"><span class="k">Günlük VaR</span><span class="down" style="font-weight:600">'+trN(var95g,0)+' ₺</span></div>'+
      '<div class="kv"><span class="k">Aylık VaR (~21g)</span><span class="down">'+trN(var95a,0)+' ₺</span></div>'+
      '<div class="kv"><span class="k">Kapsanan pozisyon değeri</span><span>'+trN(h.riskliToplam,0)+' ₺</span></div></div>'+
      '</div>';
  }
  $('riskMetBody').innerHTML=
    '<div class="grid g2">'+
    '<div class="card"><div class="lbl">KONSANTRASYON</div>'+
    '<div class="kv"><span class="k">Pozisyon sayısı</span><span><b>'+hisseler.length+'</b></span></div>'+
    '<div class="kv"><span class="k">Efektif hisse (1/Σw²)</span><span><b>'+trN(eff,1)+'</b></span></div>'+
    '<div class="kv"><span class="k">En büyük pozisyon</span><span class="'+(enBuyuk>25?'down':'')+'">%'+trN(enBuyuk,1)+'</span></div>'+
    '<div class="kv"><span class="k">Nakit oranı</span><span>%'+trN(nakitOran,1)+'</span></div></div>'+
    '<div class="card"><div class="lbl">SEKTÖR RİSKİ</div>'+
    '<div class="kv"><span class="k">Sektör HHI</span><span class="'+(sekHHI>0.3?'down':'')+'">'+trN(sekHHI,2)+'</span></div>'+
    (enBuyukSek?'<div class="kv"><span class="k">En yoğun sektör</span><span>'+(SEKTOR_TR[enBuyukSek[0]]||enBuyukSek[0])+' %'+trN(enBuyukSek[1]*100,0)+'</span></div>':'')+
    '<div class="kv"><span class="k">Faktör evreni dışı</span><span>'+disi.length+' hisse</span></div></div>'+
    '</div>'+piyasaBolum+
    '<div class="note">Konsantrasyon: efektif hisse gerçek sayıya yakınsa dengeli; sektör HHI >0,30 veya en büyük pozisyon >%25 uyarı. <b>Beta</b> portföyün XKTUM\'a duyarlılığı (>1 agresif, <1 defansif); <b>volatilite</b> yıllık oynaklık; <b>VaR %95</b> normal bir gün/ayda %95 ihtimalle aşılmayan kayıp (mutlak ₺). <b>Sharpe</b> varsayımsal (beklenen getiri = risksiz + beta×%10 prim). Portföy vol basit ağırlıklı toplam (korelasyon=1 üst sınır — gerçek çeşitlendirmeyle daha düşüktür). Beta/vol 2026 YTD günlük getirilerden.</div>';
}
function likiditeRender(){
  if(!$('likiditeBody'))return;
  const hisseler=poz.filter(p=>p.tip!=='nakit'&&p.kod);
  if(!hisseler.length){$('likiditeBody').innerHTML='<div class="sub">Pozisyon ekleyince likidite analizi görünür.</div>';return;}
  let rows=hisseler.map(p=>{const kod=p.kod.toUpperCase(),deger=p.adet*p.fiyat,hac=MHACIM[kod];return {kod,deger,hac,gun:hac?(deger/1e6)/(hac*0.20):null};}).filter(r=>r.hac!=null&&r.hac>0);
  const yok=hisseler.filter(p=>!MHACIM[p.kod.toUpperCase()]).map(p=>p.kod.toUpperCase());
  if(!rows.length){$('likiditeBody').innerHTML='<div class="note">Pozisyonlarının hacim verisi snapshot\'ta yok.</div>';return;}
  rows.sort((a,b)=>b.gun-a.gun);
  const satirlar=rows.map(r=>{const risk=r.gun>5?'down':r.gun>2?'':'up',et=r.gun>5?'yavaş':r.gun>2?'orta':'hızlı';return '<tr><td><b>'+r.kod+'</b></td><td class="num">'+trN(r.deger,0)+'</td><td class="num">'+trN(r.hac,0)+'</td><td class="num '+risk+'" style="font-weight:600">'+(r.gun<0.1?'<0,1':trN(r.gun,1))+' gün</td><td class="'+risk+'" style="font-size:10px">'+et+'</td></tr>';}).join('');
  const enYavas=rows[0];
  $('likiditeBody').innerHTML=
    '<table><tr><th>Hisse</th><th class="num">Pozisyon mn₺</th><th class="num">Hacim mn₺</th><th class="num">Çıkış Süresi</th><th></th></tr>'+satirlar+'</table>'+
    (yok.length?'<div class="note">Hacim verisi yok: '+yok.join(', ')+'.</div>':'')+
    '<div class="note">Çıkış süresi = pozisyon / (günlük hacim × %20) — günde hacmin en fazla %20\'sini satabildiğin varsayımıyla. '+(enYavas&&enYavas.gun>5?'<b>'+enYavas.kod+'</b> en yavaş ('+trN(enYavas.gun,1)+' gün); kriz anında kapana kısılma riski. ':'')+'>5 gün yavaş (kırmızı), 2-5 orta, <2 hızlı. Pozisyon = adet × maliyet.</div>';
}

/* §170 GLOBAL BİLANÇO TAKVİMİ — CANLI.
   Kullanıcı sordu: "global kartı finnhub'dan mı çekiyor artık?" HAYIR — §166'da
   yalnız BİST tarafını canlıya çevirmiştim, GLOBAL kartı elle yazılmış HTML
   olarak kalmıştı (22-30 Tem satırları sabit).
   ÜSTELİK ona data-ebu-oncelik="yuksek" koymuştum ve bu ANLAMSIZDI: içeriği hiç
   değişmediği için hash de değişmez, dolayısıyla o nitelik hiçbir işe yaramıyordu.
   Statik bir kartı "olay kartı" diye işaretlemek, işaretin kendisini anlamsız kılar.
   ARTIK İKİ KAYNAKTAN BİRLEŞİK:
     · AÇIKLANANLAR → inceleme-ai.json (ABD kartları; skorları METİN:
       POZİTİF/KARIŞIK/NÖTR — BIST'teki sayısal skordan farklı, ikisi de desteklenir)
     · BEKLENENLER  → Finnhub (§168'de pencere bölününce mega-cap'ler gelmeye başladı)
   İkisi tek listede, tarihe göre; hangisinin ne olduğu rozetle ayrılır. */
/* SS319 KURESEL MAKRO TAKVIM RENDER - makro-takvim.json'dan (Actions haftalik
   yazar). Elle yazilmis TR-yerel makro satirlarina DOKUNULMAZ (PPK/TUIK oradaki
   el emegi); bu bolum onlarin ALTINA kendi kabinda cizilir. SS173 dersi:
   kap bir kez yaratilir, icerik innerHTML= ile DEGISTIRILIR (idempotent).
   Saatler dosyada UTC — burada TSI'ye cevrilir. Gecmis olaylar (2 saatten
   eski) dusurulur; takvim ileriye bakar. */
/* SS320 GETIRI EGRISI GORSELI - OTOMATIK (19 Agu, kullanici istegi: "eski
   kalmis"). 27 Tem'de elle kodlanan 4 statik SVG'nin TR ve ABD panelleri
   artik CANLI veriden ayni gorsel dille yeniden cizilir:
   TR ← /api/evds2?mod=egri (sk-egri ile ayni uc; EGRI_CANLI ezilmez, yerel)
   ABD ← window.US_FRED (abdSekme'nin fetch'i yazar) yoksa /api/market?mod=fred
   DE/JP: canli kaynak YOK (Bundesbank/MoF kesfi = V2) - statikler durur,
   rozet durumu DURUST soyler: "TR·ABD CANLI · DE·JP 27 TEM".
   Statik SVG'ler kaplarin icinde YEDEK: veri gelmezse eski gorunum kalir ve
   rozet guncellenmez - bayatlik gizlenmez, gorunur. */
function egriSvgUret(noktalar, renk, tepeEtiket){
  /* noktalar: [{x:etiket, v:getiri}] soldan saga - orijinal statik dille birebir:
     viewBox 320x135, taban cizgi y=110, tavan y=20, esit araliklı x. */
  if(!noktalar||noktalar.length<3) return null;
  const vs=noktalar.map(n=>n.v);
  const min=Math.min(...vs), max=Math.max(...vs), ar=(max-min)||1;
  const X=(i)=>20+ i*(280/(noktalar.length-1));
  const Y=(v)=>110-((v-min)/ar)*90;
  const pts=noktalar.map((n,i)=>X(i).toFixed(1)+','+Y(n.v).toFixed(1)).join(' ');
  const tepeI=vs.indexOf(max), sonI=noktalar.length-1;
  return '<svg viewBox="0 0 320 135" style="width:100%;height:auto">'+
    '<line x1="18" y1="110" x2="302" y2="110" stroke="#E2EBE6" stroke-width="1"/>'+
    '<polyline points="'+pts+'" fill="none" stroke="'+renk+'" stroke-width="2.5" stroke-linejoin="round"/>'+
    '<circle cx="'+X(tepeI).toFixed(1)+'" cy="'+Y(max).toFixed(1)+'" r="3.2" fill="'+renk+'"/>'+
    '<circle cx="'+X(sonI).toFixed(1)+'" cy="'+Y(vs[sonI]).toFixed(1)+'" r="3.2" fill="'+renk+'"/>'+
    '<text x="'+X(tepeI).toFixed(1)+'" y="'+(Y(max)-6).toFixed(1)+'" font-family="IBM Plex Mono" font-size="9" fill="'+renk+'" text-anchor="middle">%'+trN(max,1)+(tepeEtiket?' ('+noktalar[tepeI].x+')':'')+'</text>'+
    '<text x="'+(X(sonI)-2).toFixed(1)+'" y="'+(Y(vs[sonI])+(vs[sonI]===max?14:-5)).toFixed(1)+'" font-family="IBM Plex Mono" font-size="9" fill="#63756C" text-anchor="end">%'+trN(vs[sonI],1)+'</text>'+
    '<text x="20" y="132" font-family="IBM Plex Mono" font-size="8" fill="#63756C">'+noktalar[0].x+'</text>'+
    '<text x="160" y="132" font-family="IBM Plex Mono" font-size="8" fill="#63756C" text-anchor="middle">'+noktalar[Math.floor(noktalar.length/2)].x+'</text>'+
    '<text x="300" y="132" font-family="IBM Plex Mono" font-size="8" fill="#63756C" text-anchor="end">'+noktalar[sonI].x+'</text></svg>';
}
async function egriGorselRender(){
  const trKap=document.getElementById('egriTRKap'), usKap=document.getElementById('egriUSKap');
  if(!trKap&&!usKap) return;
  let trOk=false, usOk=false, damga='';
  try{
    const r=await fetch('/api/evds2?mod=egri',{cache:'no-store'});
    const j=r.ok?await r.json():null;
    if(j&&j.ok&&j.vadeler){
      const eY=(k)=>{const m=String(k).toUpperCase().match(/^(\d+)\s*([AY])/);return m?(m[2]==='A'?+m[1]/12:+m[1]):99;};
      const nok=Object.entries(j.vadeler).map(([k,v])=>({x:k,v:parseFloat(v.getiri),yil:(isFinite(v.kalanYil)&&v.kalanYil>0)?v.kalanYil:eY(k)}))
        .filter(n=>isFinite(n.v)).sort((a,b)=>a.yil-b.yil);
      const svg=egriSvgUret(nok,'#128A66',true);
      if(svg&&trKap){trKap.innerHTML=svg;trOk=true;damga=(j.tarih||'').slice(0,10);}
    }
  }catch(e){}
  try{
    let S=window.US_FRED;
    if(!S){const r=await fetch('/api/market?mod=fred');const d=r.ok?await r.json():null;if(d&&d.ok)S=d.seriler;}
    if(S){
      const sec=[['DGS3MO','3A'],['DGS2','2Y'],['DGS5','5Y'],['DGS10','10Y'],['DGS30','30Y']];
      const nok=sec.map(([id,x])=>S[id]&&isFinite(S[id].deger)?{x,v:S[id].deger}:null).filter(Boolean);
      const svg=egriSvgUret(nok,'#3D7BD9',false);
      if(svg&&usKap){usKap.innerHTML=svg;usOk=true;}
    }
  }catch(e){}
  const tag=document.getElementById('egriGorselTag');
  if(tag&&(trOk||usOk)){
    tag.textContent=(trOk&&usOk?'TR·ABD CANLI':trOk?'TR CANLI':'ABD CANLI')+(damga?' '+damga:'')+' · DE·JP 27 TEM';
  }
}

async function makroTakvimRender(){
  /* SS319-D DUZELTME (19 Agu aksami, canli olcum): ilk surum $('takvimBody')
     hedefliyordu - O ID SAYFADA YOK (koddaki ESKI bir yorumdan okumustum;
     gercek kaplar bistTakvim/globalTakvim/kazancCanli cikti). Render sessizce
     donuyor, bolum HICBIR YERE cizilmiyordu. DERS: YORUM DEGIL, DOM KANITTIR.
     Kap artik index'te statik: kritik takvim kartinda, elle tablonun ve "~"
     dipnotunun ALTINDA - elle satirlara dokunulmaz. */
  const kap=document.getElementById('makroOto'); if(!kap) return;
  try{
    const r=await fetch('/makro-takvim.json',{cache:'no-store'});
    if(!r.ok) return;
    const d=await r.json();
    const simdi=Date.now()-2*3600e3;
    const gel=(d.olaylar||[]).filter(x=>Date.parse(x.t)>=simdi).slice(0,12);
    if(!gel.length) return;
    const ayK=['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
    const gunK=['Paz','Pzt','Sal','Çar','Per','Cum','Cmt'];
    const fmt=(iso)=>{const t=new Date(new Date(iso).toLocaleString('en-US',{timeZone:'Europe/Istanbul'}));
      return t.getDate()+' '+ayK[t.getMonth()]+' '+gunK[t.getDay()]+' '+String(t.getHours()).padStart(2,'0')+':'+String(t.getMinutes()).padStart(2,'0');};
    kap.innerHTML='<div style="border-top:1px dashed var(--line2);margin-top:8px;padding-top:6px">'+
      '<div class="lbl" style="margin-bottom:4px">KÜRESEL MAKRO <span class="thin" style="font-weight:400">(ForexFactory · otomatik §319 · saatler TSİ)</span></div>'+
      gel.map(x=>'<div class="kv"><span class="k"><b>'+fmt(x.t)+'</b> · '+x.ulke+
        (x.etki==='High'?' <span class="tag" style="background:var(--down)">YÜKSEK</span>':'')+
        '</span><span class="sub" style="font-size:10px;text-align:right">'+x.olay+
        ((x.beklenti||x.onceki)?(' <span class="thin">· bek '+(x.beklenti||'—')+' / önc '+(x.onceki||'—')+'</span>'):'')+
        '</span></div>').join('')+'</div>';
  }catch(e){}
}

function globalTakvimRender(){
  const el=$('globalTakvim'); if(!el) return;
  const ABD=new Set(['GOOGL','TSLA','INTC','TXN','TSM','NFLX','JPM','MSFT','META','AAPL','AMZN',
    'NVDA','AMD','CSCO','HD','IBM','NOW','ORCL','CRM','ADBE','QCOM','MU','AVGO','ASML','PLTR',
    'DIS','GS','MS','BAC','C','WFC','V','MA','AXP','BLK','UNH','JNJ']);
  const K=(typeof INC_KARTLAR!=='undefined'&&INC_KARTLAR)?INC_KARTLAR:[];
  const aciklanan=K.filter(k=>ABD.has(k.kod)).map(k=>({
    kod:k.kod, iso:k.tarih_iso||'', tarih:k.tarih||'', skor:k.skor, durum:'açıklandı'}));
  const bekleyen=(window.KAZANC_ITEMS||[]).map(x=>({
    kod:x.sembol, iso:x.tarih||'', tarih:x.tarih||'', epsBek:x.epsBek, zaman:x.zaman, durum:'bekleniyor'}));
  /* Aynı sembol her iki listede olabilir (açıklandı ama Finnhub hâlâ listeliyor).
     Açıklanan KAZANIR — kart verisi Finnhub tahmininden üstündür. */
  const varOlan=new Set(aciklanan.map(x=>x.kod));
  const hepsi=aciklanan.concat(bekleyen.filter(x=>!varOlan.has(x.kod)))
    .sort((a,b)=>a.iso<b.iso?1:a.iso>b.iso?-1:0);
  if(!hepsi.length){ el.innerHTML='<div class="sub">Kart ya da Finnhub verisi bekleniyor.</div>'; return; }
  const bugun=new Date().toISOString().slice(0,10);
  const skorRenk=(s)=>{
    if(s==null) return 'var(--muted)';
    if(typeof s==='number') return s>=6?'var(--up)':s>=4.5?'var(--mm2)':'var(--down)';
    const t=String(s).toUpperCase();
    return t.indexOf('POZ')>=0?'var(--up)':t.indexOf('NEG')>=0?'var(--down)':'var(--mm2)';
  };
  const ayK=['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
  const trT=(iso)=>{ const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
    return m? (+m[3])+' '+ayK[+m[2]-1]+' '+m[1] : iso; };
  el.innerHTML='<table><tbody>'+hepsi.slice(0,10).map(x=>{
    const bugunMu=(x.iso===bugun);
    const acik=x.durum==='açıklandı';
    return '<tr'+(bugunMu?' style="background:var(--bg2)"':'')+'>'+
      '<td style="white-space:nowrap'+(bugunMu?';color:var(--mm2);font-weight:700':'')+'">'+esc(trT(x.iso)||x.tarih)+'</td>'+
      '<td><b>'+esc(x.kod)+'</b></td>'+
      '<td style="font-family:var(--sans);font-size:10px;color:var(--muted)">'+
        (acik
          ? '<b style="color:'+skorRenk(x.skor)+'">'+(typeof x.skor==='number'?'skor '+trN(x.skor,1):esc(String(x.skor||'—')))+'</b>'+
            ' <span class="thin">· kart var</span>'
          : (x.epsBek!=null?'EPS bek '+trN(x.epsBek,2):'')+(x.zaman?' · '+esc(x.zaman):'')+
            ' <span class="tag" style="background:var(--muted)">BEKLENİYOR</span>')+
        (bugunMu?' <span class="tag">BUGÜN</span>':'')+'</td></tr>';
  }).join('')+'</tbody></table>'+
  '<div class="sub" style="font-size:10px;margin-top:5px">'+
    aciklanan.length+' açıklanan (inceleme-ai.json · kart var) + '+
    bekleyen.filter(x=>!varOlan.has(x.kod)).length+' beklenen (Finnhub · izleme listesi). '+
    'Aynı sembol ikisinde de varsa <b>kart kazanır</b> — gerçekleşen veri, tahmini eder.</div>';
}

/* §172 BIST BİLANÇO TAKVİMİ — AÇIKLANAN + BEKLENEN.
   Kullanıcı: "sekmenin ismi bilanço takvimi ama BIST yerelde hiç beklenen
   bilanço gözükmüyor, o kartı işlevine uygun yap." HAKLI — §166'da yalnız
   AÇIKLANANLARI koymuştum, o bir KÜTÜK'tü, takvim değil.
   BEKLENEN TARİH NEREDEN: BIST/KAP makine-okunur bir "beklenen bilanço tarihi"
   tablosu yayınlamıyor. En sağlam ölçülebilir yaklaşım GEÇEN YILIN AYNI DÖNEM
   açıklama tarihi — aynı hafta gününe hizalanarak taşınır (şirketler genelde
   ayın aynı haftasında, aynı iş gününde açıklar). bist-takvim.json'da.
   TAHMİN OLDUĞU EKRANDA YAZAR — bağlayıcı değil. */
let BISTTAK=null;
async function bistTakvimYukle(){
  if(BISTTAK!==null) return BISTTAK;
  try{ const r=await fetch('/bist-takvim.json',{cache:'no-store'});
    BISTTAK = r.ok ? await r.json() : false; }catch(e){ BISTTAK=false; }
  return BISTTAK;
}
function bistTakvimRender(){
  const el=$('bistTakvim'); if(!el) return;
  const K=(typeof INC_KARTLAR!=='undefined'&&INC_KARTLAR)?INC_KARTLAR:[];
  const ABD=new Set(['GOOGL','TSLA','INTC','TXN','TSM','NFLX','JPM','MSFT','META','AAPL','AMZN',
    'NVDA','AMD','CSCO','HD','IBM','NOW','ORCL','CRM','ADBE','QCOM','MU','AVGO','ASML','PLTR',
    'DIS','GS','MS','BAC','C','WFC','V','MA','AXP','BLK','UNH','JNJ','MCD','MRK','PFE','LLY','ABBV','CVX']);
  const bugun=new Date().toISOString().slice(0,10);
  const aciklanan=K.filter(k=>k.kod&&/^[A-Z]{4,5}$/.test(k.kod)&&!ABD.has(k.kod))
    .map(k=>({kod:k.kod, iso:k.tarih_iso||'', skor:k.skor, durum:'açıklandı'}));
  const varOlan=new Set(aciklanan.map(x=>x.kod));
  const B=(typeof BISTTAK!=='undefined'&&BISTTAK&&BISTTAK.beklenen)?BISTTAK.beklenen:{};
  const bekleyen=Object.keys(B).filter(k=>!varOlan.has(k))
    .map(k=>({kod:k, iso:B[k], durum:(B[k]<bugun?'gecikti':'bekleniyor')}));
  /* §252r GERCEKLESEN BLOGU. Takvimde artik iki blok var: `beklenen` (tahmin)
     ve `gerceklesen` (KAP'ta yayinlanmis GERCEK tarih). Render onceden yalniz
     `beklenen`i okuyordu ve aciklananlari INC_KARTLAR'dan aliyordu — yani
     ACIKLAMIS AMA KARTI HENUZ YAZILMAMIS sirket LISTEDEN TAMAMEN KAYBOLUYORDU.
     10 Agu olcumu: 15 aciklamanin 14'unun karti vardi, KTLEV'inki YOKTU —
     tam da gorunmesi gereken isim (o gun acikladi, bedelsiz sonrasi ilk tablo).
     Simdi gerceklesen blogu da listeye giriyor; karti olan zaten aciklanan'dan
     gelir, olmayan buradan gelir ve 'yayinlandi' etiketiyle gorunur. */
  const G=(typeof BISTTAK!=='undefined'&&BISTTAK&&BISTTAK.gerceklesen)?BISTTAK.gerceklesen:{};
  const yayinlanan=Object.keys(G).filter(k=>!varOlan.has(k))
    .map(k=>({kod:k, iso:G[k], durum:'yayınlandı'}));
  const hepsi=aciklanan.concat(bekleyen).concat(yayinlanan).sort((a,b)=>a.iso<b.iso?1:a.iso>b.iso?-1:0);
  if(!hepsi.length){ el.innerHTML='<div class="sub">Veri bekleniyor.</div>'; return; }
  const ayK=['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
  const trT=(iso)=>{ const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(iso); return m?(+m[3])+' '+ayK[+m[2]-1]:iso; };
  const skorRenk=(s)=>{ if(s==null) return 'var(--muted)';
    if(typeof s==='number') return s>=6?'var(--up)':s>=4.5?'var(--mm2)':'var(--down)';
    const t=String(s).toUpperCase();
    return t.indexOf('POZ')>=0?'var(--up)':t.indexOf('NEG')>=0?'var(--down)':'var(--mm2)'; };
  const bek=hepsi.filter(x=>x.durum!=='açıklandı').sort((a,b)=>a.iso<b.iso?-1:1);
  const acik=hepsi.filter(x=>x.durum==='açıklandı');
  const satir=(x)=>{
    const bugunMu=(x.iso===bugun), a=(x.durum==='açıklandı');
    /* §252r 'yayınlandı' = KAP'ta tablo VAR ama AI kartı henüz YOK. Bu dalı
       eklemezsem else'e duser ve BEKLENIYOR yazardi — aciklamis sirkete
       "bekleniyor" demek, gecikmemis sirkete "GECIKTI" demek kadar yanlis. */
    const rozet = a ? (bugunMu?'<span class="tag">BUGÜN</span>':'')
      : (x.durum==='yayınlandı'
          ? '<span class="tag" style="background:var(--mm2)">YAYINLANDI · kart bekliyor</span>'
      : (x.durum==='gecikti'
          ? '<span class="tag" style="background:var(--down)">GECİKTİ</span>'
          : '<span class="tag" style="background:var(--muted)">BEKLENİYOR</span>'));
    return '<tr'+(bugunMu?' style="background:var(--bg2)"':(a?'':' style="opacity:.82"'))+'>'+
      '<td style="white-space:nowrap'+(bugunMu?';color:var(--mm2);font-weight:700':'')+'">'+esc(trT(x.iso))+'</td>'+
      '<td><b>'+esc(x.kod)+'</b></td>'+
      '<td style="font-family:var(--sans);font-size:10px;color:var(--muted)">'+
        (a?'<b style="color:'+skorRenk(x.skor)+'">'+(typeof x.skor==='number'?'skor '+trN(x.skor,1):esc(String(x.skor||'—')))+'</b> <span class="thin">· kart var</span>':'<span class="thin">tahmini tarih</span>')+
        ' '+rozet+'</td></tr>';
  };
  el.innerHTML='<table><tbody>'+bek.slice(0,7).map(satir).join('')+
    (bek.length&&acik.length?'<tr><td colspan="3" style="padding:3px 0"><div style="border-top:1px dashed var(--line2)"></div></td></tr>':'')+
    acik.slice(0,7).map(satir).join('')+'</tbody></table>'+
    '<div class="sub" style="font-size:10px;margin-top:5px">'+
    bek.length+' beklenen (tahmini · geçen yılın aynı dönem tarihinden) + '+acik.length+' açıklanan (kart var). '+
    'Şirket açıklayınca beklenen listesinden <b>düşer</b>, açıklananlara geçer. '+
    ((typeof BISTTAK!=='undefined'&&BISTTAK&&BISTTAK.farkli_mali_yil)?'<span class="thin">Mali yılı farklı: '+Object.keys(BISTTAK.farkli_mali_yil).join(', ')+'.</span> ':'')+
    '<span class="thin">Tahmin bağlayıcı değildir; SPK sınırı 14–29 Ağu.</span></div>';
}
/* §166 BIST BİLANÇO TAKVİMİ — CANLI.
   TEŞHİS: "08 Bilanço Takvimi" başlığı "Ebu günlük bakımında" diyordu ve Ebu'nun
   notları gerçekten tazeydi (15:06 damgalı). Ama yorumladığı TABLO index.html'de
   ELLE YAZILMIŞ sabit HTML'di. Sonuç:
     · 7 satırın 5'i geçmişti ("AÇIKLANDI ✓") — takvim değil, kütük
     · bugün açıklayan CWENE/TSKB/ARCLK takvimde YOKTU
     · Ebu'nun notu "bu hafta bilanço sakin" diyordu, oysa üç şirket açıklamıştı
   Yani ajan ÖLÜ İÇERİĞE taze yorum yazıyordu — en yanıltıcı hâli, çünkü taze
   damga içeriğin de taze olduğunu düşündürüyor.
   ÇÖZÜM: liste artık inceleme-ai.json'dan türer — o dosya bilanço kartlarıyla
   birlikte güncellenir, dolayısıyla takvim kendiliğinden tazedir. AÇIKLANANLAR
   gerçek veriden gelir; BEKLENENLER damgalı kalır (henüz açıklanmamış olanın
   tarihi tahmindir, veriden türetilemez). */
/* §168 GLOBAL TAKVİM DE KART VERİSİNDEN.
   Finnhub 29 Tem'de yalnız HD (18 Ağu) ve CSCO (19 Ağu) döndürüyordu; MSFT/META
   (29 Tem) ve AAPL/AMZN (30 Tem) yoktu. Sebep henüz ölçülmedi (?debug=1 ile
   bakılacak) ama SEBEP NE OLURSA OLSUN tek kaynağa bağımlı kalmak yanlış:
   Finnhub düşerse takvim boşalıyor, geç kalırsa takvim geriden geliyor.
   ÇÖZÜM: BIST tarafında (§166) yaptığımızın aynısı — AÇIKLANANLAR kart
   verisinden gelir (kesin, çünkü kartı yazarken bilanço elimizdeydi),
   BEKLENENLER damgalı kalır, Finnhub varsa ÜSTÜNE ekler.
   Böylece üç katman: kesin geçmiş · damgalı yakın gelecek · varsa canlı ek. */


/* §162: takvimRender KALDIRILDI. Portföy Yönetimi > Yönetim'deki "Ekonomik
   Takvim & Sürprizler" kartı, Piyasa sekmesindeki "07 Kritik Takvim" ile AYNI
   dönemi (24 Tem – 24 Ağu) ve aynı olayları listeliyordu — kopyaydı.
   Kart kaldırıldı; içindeki CANLI ABD kazanç beslemesi (Finnhub) kaybolmasın
   diye Piyasa'daki "08 Bilanço Takvimi" altına taşındı (#kazancCanli).
   O kart tamamen damgalıydı ("22 Tem itibarıyla"), şimdi altında canlı bir
   şerit var — kopyayı silerken canlı veriyi de silmemek için. */


/* ---- Canlı ABD kazanç takvimi (Finnhub, izleme listesi filtreli) ---- */
async function kazancTakvimCanli(){
  if(!$('kazancCanli'))return;
  try{
    const r=await fetch('/api/usnews?mod=kazanc');
    if(!r.ok)return;
    const j=await r.json();
    if(!j.ok||!j.items||!j.items.length)return;
    const ayKisa=['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
    const fmtT=s=>{const d=new Date(s);return d.getDate()+' '+ayKisa[d.getMonth()];};
    const satir=j.items.slice(0,20).map(x=>{
      const eps=x.epsBek!=null?('EPS bek '+trN(x.epsBek,2)):'';
      const gelir=x.gelirBek!=null?(' · '+trN(x.gelirBek/1e9,1)+' mlr$'):'';
      const z=x.zaman?(' <span style="color:var(--muted)">'+x.zaman+'</span>'):'';
      return '<div class="kv"><span class="k"><b>'+fmtT(x.tarih)+'</b> · '+x.sembol+z+'</span><span class="sub" style="font-size:10px">'+eps+gelir+'</span></div>';
    }).join('');
    /* §172: bu liste artık GLOBAL kartının İÇİNDE. Ayrı bölüm başlığı yerine
       küçük bir ayraç; 20 satır kart içinde çok uzun kaçtığı için KAYDIRILABİLİR
       kutuya alındı (max 260px). Kart yüksekliği sabit kalır, iki kart eşit
       görünür — kullanıcının istediği hizalama ancak böyle korunur. */
    const blok='<div style="border-top:1px dashed var(--line2);margin-top:8px;padding-top:6px">'+
      '<div class="lbl" style="margin-bottom:4px">TÜM İZLEME LİSTESİ <span class="thin" style="font-weight:400">(Finnhub · '+
      (j.items||[]).length+' bilanço)</span></div>'+
      '<div style="max-height:260px;overflow-y:auto;padding-right:4px">'+satir+'</div></div>'+
      '<div class="note" style="font-size:10px">İzleme listendeki ABD hisselerinin yaklaşan bilanço tarihleri. EPS/gelir beklentisi analistlerin konsensüsü; açıklama sonrası sürpriz (gerçekleşen vs beklenti) fiyatı oynatır. Mega-cap bilançoları AI capex rejimini test eder.</div>';
    // takvimBody'nin sonuna ekle (elle makro olayların altına)
    /* §173: insertAdjacentHTML('beforeend') EKLER — fonksiyon iki kez koşarsa
       (boot + sekme tıklaması, ya da globalTakvimRender'dan tetiklenirse) içerik
       ÇİFTLENİR. Ekranda notun iki kez görünmesinin sebebi buydu.
       innerHTML= YERİNE YAZAR: kaç kez koşarsa koşsun sonuç aynı — idempotent.
       Kural: bir kutuya yazan fonksiyon, birden fazla kez çağrılabiliyorsa
       EKLEMEZ, DEĞİŞTİRİR. */
    $('kazancCanli').innerHTML = blok;
    /* §170: ham kayıtlar saklanır — GLOBAL kartı bunları "beklenenler" olarak
       kullanır. İki yerde ayrı ayrı çekmemek için tek fetch, iki tüketici. */
    window.KAZANC_ITEMS = j.items || [];
    try{ if(typeof globalTakvimRender==='function') globalTakvimRender(); }catch(e){}
  }catch(e){}
}

/* ---- TCMB EVDS3 canlı makro ---- */
/* SS318 AOFM ONBELLEGI - SS312 ilk avini vermisti: "yavas modul: Canli AOFM
   12699 ms". Yavaslik EVDS API tarafinda; cozum beklemeyi kaldirmak:
   (1) acilista SON BILINEN degerler localStorage'dan ANINDA basilir
       ("· canli" rozeti "· son bilinen"e cevrilir - yaniltma yok),
   (2) canli cekim ARKA PLANDA surer, gelince hucreleri VE onbellegi tazeler,
   (3) boot artik AOFM'u beklemez - sure konsola ayri satirla yazilir. */
function aofmOnbellekBas(){
  try{
    const c=JSON.parse(localStorage.getItem('ktp_aofm_cache_v1')||'null'); if(!c)return;
    Object.entries(c).forEach(([id,v])=>{const e=$(id);
      if(e&&v&&v.html){e.innerHTML=v.html.replace('\u00b7 canl\u0131','\u00b7 son bilinen');if(v.title)e.title=v.title+' \u00b7 \u00f6nbellek';}});
  }catch(e){}
}
async function aofmHizli(){
  aofmOnbellekBas();
  const t0=Date.now();
  loadAOFM().then(()=>{
    try{
      const c={};
      document.querySelectorAll('[id$="Live"]').forEach(e=>{if(/\u00b7 canl\u0131/.test(e.innerHTML))c[e.id]={html:e.innerHTML,title:e.title||''};});
      if(Object.keys(c).length)localStorage.setItem('ktp_aofm_cache_v1',JSON.stringify(c));
      console.log('[KTPanel] SS318 AOFM canli '+(Date.now()-t0)+' ms (arka plan) \u00b7 '+Object.keys(c).length+' hucre onbellege alindi');
    }catch(e){}
  });
}
async function loadAOFM(){
  // 1) Anlık değerler — her seri BAĞIMSIZ istek (biri geçersizse diğerleri etkilenmez)
  const koyGrup=async(id,grup,adF,fmt)=>{
    try{
      const r=await fetch('/api/evds2?grup='+grup+'&adFiltre='+encodeURIComponent(adF)+'&gun=90');
      if(!r.ok)return;
      const d=await r.json(), kod=d.cozulen||d.seri, v=(d.son||{})[kod];
      if(v&&isFinite(v.deger)&&$(id)){$(id).innerHTML=fmt(v.deger)+' <span class="thin" style="font-size:9px">· canlı</span>';$(id).title='EVDS3 · '+kod+' · '+(v.tarih||'');}
    }catch(e){}
  };
  const koy=async(id,kod,fmt)=>{
    try{
      const r=await fetch('/api/evds2?series='+kod+'&gun=90');
      if(!r.ok)return;
      const d=await r.json(), v=(d.son||{})[kod];
      if(v&&isFinite(v.deger)&&$(id)){$(id).innerHTML=fmt(v.deger)+' <span class="thin" style="font-size:9px">· canlı</span>';$(id).title='EVDS3 · '+(v.tarih||'');}
    }catch(e){}
  };
  await Promise.all([
    koy('aofmLive','TP.APIFON4',x=>{AOFM_SON=x;return '%'+trN(x,2);}),
    koy('fonMiktar','TP.APIFON3',x=>trN(x/1000,1)+(x<0?' <span class="thin" style="font-size:9px">(net çekiş)</span>':'')),
    koyGrup('rekLive','bie_rktufey','',x=>{REK_SON=x;return trN(x,1);}),
    koyGrup('rezervLive','bie_abres2','Toplam',x=>trN(x/1000,1))
  ]);
  karneRezervCanli();
  // 2) TÜFE  // 2) TÜFE: endeks serisinden yıllık + aylık değişim (ay-eşleştirmeli, veri gecikmesine dayanıklı)
  try{
    const r=await fetch('/api/evds2?grup=bie_tukfiy2025&adFiltre=Genel&gun=600&full=1');
    if(r.ok){
      const d=await r.json(), alan=(d.cozulen||d.seri||'').replace(/\./g,'_');
      const items=(d.ham||[]).filter(x=>x[alan]!=null&&x[alan]!=='');
      if(items.length>=2){
        const sonIt=items[items.length-1], son=parseFloat(sonIt[alan]);
        const [sy,sm]=String(sonIt.Tarih).split('-').map(Number);
        const bul=(y,m)=>{const t=y+'-'+m;const f=items.find(x=>String(x.Tarih)===t);return f?parseFloat(f[alan]):null;};
        const onceki=bul(sm===1?sy-1:sy, sm===1?12:sm-1);
        const yil=bul(sy-1, sm);
        const ayAd=['','Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'][sm]||sm;
        const etiket=' <span class="thin" style="font-size:9px">· '+ayAd+' '+String(sy).slice(2)+' · canlı</span>';
        if($('tufeLive')&&isFinite(son)&&yil){TUFE_YILLIK=(son/yil-1)*100;$('tufeLive').innerHTML='<b>%'+trN(TUFE_YILLIK,1)+'</b>'+etiket;$('tufeLive').title='EVDS3 TÜFE endeksi (2025=100) · '+alan;}
        if($('tufeAylik')&&isFinite(son)&&onceki){$('tufeAylik').innerHTML='%'+trN((son/onceki-1)*100,2)+etiket;}
      }
    }
  }catch(e){}
  // 3) Sanayi üretimi (TÜİK, mevsim+takvim arındırılmış) — yıllık + aylık
  try{
    const r=await fetch('/api/evds2?grup=bie_tsanaymt2021&adFiltre=&gun=800&full=1');
    if(r.ok){
      const d=await r.json(), alan=(d.cozulen||d.seri||'').replace(/\./g,'_');
      const items=(d.ham||[]).filter(x=>x[alan]!=null&&x[alan]!=='');
      if(items.length>=13){
        const sonIt=items[items.length-1], son=parseFloat(sonIt[alan]);
        const [sy,sm]=String(sonIt.Tarih).split('-').map(Number);
        const bul=(y,m)=>{const f=items.find(x=>String(x.Tarih)===(y+'-'+m));return f?parseFloat(f[alan]):null;};
        const onceki=bul(sm===1?sy-1:sy, sm===1?12:sm-1), yil=bul(sy-1,sm);
        const ayAd=['','Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'][sm]||sm;
        if(yil&&$('sanayiVal')){const yoy=(son/yil-1)*100;$('sanayiVal').innerHTML='%'+trN(yoy,1)+' <span class="sub" style="display:inline">'+(yoy>1?'büyüme':yoy<-1?'daralma':'yatay')+'</span>';$('sanayiVal').className='val '+(yoy>1?'up':yoy<-1?'down':'');}
        if(onceki&&$('sanayiSub')){$('sanayiSub').innerHTML='yıllık · aylık %'+trN((son/onceki-1)*100,1)+' <span class="thin" style="font-size:9px">· canlı</span>';}
        if($('sanayiTag'))$('sanayiTag').textContent=ayAd;
      }
    }
  }catch(e){}
  // 4) Cari denge (Analitik Sunum) — aylık + 12 ay toplam
  try{
    const r=await fetch('/api/evds2?grup=bie_odana6&adFiltre='+encodeURIComponent('Cari İşlemler')+'&gun=800&full=1');
    if(r.ok){
      const d=await r.json(), alan=(d.cozulen||d.seri||'').replace(/\./g,'_');
      const items=(d.ham||[]).filter(x=>x[alan]!=null&&x[alan]!=='');
      if(items.length>=12){
        const sonIt=items[items.length-1], son=parseFloat(sonIt[alan]);
        const [sy,sm]=String(sonIt.Tarih).split('-').map(Number);
        const yillik=items.slice(-12).reduce((s,x)=>s+parseFloat(x[alan]),0);
        const ayAd=['','Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'][sm]||sm;
        if($('cariVal')){const mlr=son/1000;$('cariVal').textContent=(mlr>=0?'+':'−')+trN(Math.abs(mlr),2)+' mlr $';$('cariVal').className='val '+(mlr>=0?'up':'down');}
        if($('cariSub')){const ym=yillik/1000;$('cariSub').innerHTML='yıllık '+(ym>=0?'+':'−')+trN(Math.abs(ym),1)+' mlr <span class="thin" style="font-size:9px">· canlı</span>';}
        if($('cariTag'))$('cariTag').textContent=ayAd;
      }
    }
  }catch(e){}
  // 5) İşsizlik oranı (TÜİK, mevsimsellikten arındırılmış)
  try{
    const r=await fetch('/api/evds2?grup=bie_tisguc&adFiltre='+encodeURIComponent('İşsizlik Oran')+'&gun=200&full=1');
    if(r.ok){
      const d=await r.json(), alan=(d.cozulen||d.seri||'').replace(/\./g,'_');
      const items=(d.ham||[]).filter(x=>x[alan]!=null&&x[alan]!=='');
      if(items.length){
        const sonIt=items[items.length-1], son=parseFloat(sonIt[alan]);
        const [sy,sm]=String(sonIt.Tarih).split('-').map(Number);
        const ayAd=['','Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'][sm]||sm;
        if($('issizlikVal')&&isFinite(son)){$('issizlikVal').textContent='%'+trN(son,1);}
        if($('issizlikSub')){$('issizlikSub').innerHTML='mevsimsellikten arındırılmış <span class="thin" style="font-size:9px">· canlı</span>';}
        if($('issizlikTag'))$('issizlikTag').textContent=ayAd;
      }
    }
  }catch(e){}
  // 6) KKM stok bakiyesi (kur korumalı mevduat) — son değer + trend
  await koyGrupSon('kkmVal','kkmTag','bie_kkm','Toplam',x=>trN(x/1000,0)+' mlr ₺');
  // 7) Güven endeksleri (tüketici + reel kesim)
  await koyGrupSon('tukGuvenVal','tukGuvenTag','bie_mbgven2','Tüketici Güven',x=>trN(x,1));
  await koyGrupSon('reelGuvenVal','reelGuvenTag','bie_rkgey2','Reel Kesim Güven',x=>trN(x,1));
  // 8) Toplam YP mevduat (milyon $ -> mlr $) — dolarizasyon göstergesi
  await koyGrupSon('ypmevVal','ypmevTag','bie_hpbitablo4','TOPLAM YP MEVDUAT',x=>trN(x/1000,1)+' mlr $');
  /* 9) Bankacılık kredi hacmi.
     §252l BIRIM HATASI — §252j (rotTL) ile BIREBIR AYNI, dorduncu vaka.
     bie_hpbitablo6 BIN TL biriminde gelir. /1e6 ile "26.609,54 trl ₺" basiliyordu;
     bu Turkiye GSYH'sinin ~530 kati. Dogrusu /1e9 -> 26,61 trl ₺.
     NOT: birim GRUBA GORE DEGISIR, kopyalamadan once dogrula —
     bie_hpbitablo4 MILYON $ (/1000 dogru, 260,1 mlr $), bu tablo BIN TL. */
  await koyGrupSon('krediVal','krediTag','bie_hpbitablo6','',x=>trN(x/1e9,2)+' trl ₺');
  // 10) Yabancı Para Akışı kartı — haftalık hisse+tahvil, rezerv, carry (canlı)
  await loadYabanciCanli();
  // 11) Enflasyon beklenti grafiği (gerçekleşen vs 3 beklenti serisi)
  await loadEnflasyonBeklenti();
  // 12) Yurt içi yatırımcı rotasyonu
  await loadRotasyon();
}
/* ---- Yabancı Para Akışı canlı (EVDS) ---- */
/* §304: tanım 8582'den buraya değil — aşağıya bak; bu satır taşındı */
async function loadYabanciCanli(){
  // Haftalık net değişim: hisse (M7) + DİBS/tahvil (M8), milyon $
  try{
    const r=await fetch('/api/evds2?series=TP.MKNETHAR.M7,TP.MKNETHAR.M8&gun=30&full=1');
    if(r.ok){
      const d=await r.json();
      const pick=(kod)=>{const al=kod.replace(/\./g,'_');const it=(d.ham||[]).filter(x=>x[al]!=null&&x[al]!=='');return it.length?{v:parseFloat(it[it.length-1][al]),t:it[it.length-1].Tarih}:null;};
      const hisse=pick('TP.MKNETHAR.M7'), tahvil=pick('TP.MKNETHAR.M8');
      if(hisse&&tahvil&&$('yabHaftaVal')){
        const toplam=hisse.v+tahvil.v;
        const kompozisyon = tahvil.v>hisse.v*2 ? ' · tahvil ağırlıklı (carry)' : hisse.v>tahvil.v*2 ? ' · hisse ağırlıklı' : ' · dengeli';
        $('yabHaftaVal').innerHTML='hisse '+(hisse.v>=0?'+':'')+trN(hisse.v,0)+'mn · tahvil '+(tahvil.v>=0?'+':'')+trN(tahvil.v,0)+'mn<span class="thin" style="font-size:9px">'+kompozisyon+' · canlı</span>';
        $('yabHaftaVal').className=(hisse.v+tahvil.v>=0?'up':'down');
        if($('yabHaftaTag'))$('yabHaftaTag').textContent='('+(hisse.t||'')+' · canlı)';
      }
    }
  }catch(e){}
  // §130: yabCarryVal'e yazan DÖRDÜNCÜ tüketici. Tek kalan BASİT ÇIKARMA idi
  // (AOFM_SON − TUFE_YILLIK = 40 − 32,11 = 7,89). Kart §129'da iki-bakışlı satıra
  // çevrilmişti ama bu blok loadAOFM sonunda ÜSTÜNE YAZIYORDU — etiket yeni,
  // değer eski görünüyordu. Ekran görüntüsüyle yakalandı.
  // Artık kendi hesabı yok; tek kaynağa (reelFaizler/reelFaizSatiri) devrediyor.
  // Sıra güvenli: AOFM_SON ve TUFE_YILLIK bu turda tazelendi, dolayısıyla
  // reelFaizler'in DOM'dan okuduğu değerler de güncel.
  try{ if(typeof yabCarryTazele==='function') yabCarryTazele(); }catch(e){}
  /* §259c YABANCI HAFTALIK AKIŞ — CANLI. yabanci.json elle giriliyordu ve
     10 Ağu'da 24 GÜN eskiydi: panel 17 Tem haftasını (+278 mn GİRİŞ) gösterirken
     EVDS'de 24 Tem ve 31 Tem de vardı — 31 Tem NET ÇIKIŞ (-152 mn, hisse -186 /
     ÖST -130). Anlatı yalnız eski değil TERS olmuştu ("ılımlı giriş" diyordu).
     Ayrıca etiket "sıradaki 30 Tem" yazıyordu — kendi vadesini 11 gün geçmiş.
     Uç /api/evds2?mod=yab (§259). Düşerse dosyadaki değer KALIR ve etikete
     dokunulmaz — sessiz düşüş yok, ama panel de boşalmaz. */
  try{
    const ry = await fetch('/api/evds2?mod=yab&hafta=6',{cache:'no-store'}).then(r=>r.json());
    if(ry && ry.ok && ry.sonHafta && isFinite(ry.toplam)){ YAB_CANLI = ry; yabHaftaCanliYaz(); }
  }catch(e){}
  // Swap hariç net rezerv — karneyle aynı canlı kaynak (net − rezerv.json swap stoku)
  try{
    if($('yabRezervVal')){
      const [rr,rj]=await Promise.all([
        fetch('/api/evds2?mod=rezerv').then(r=>r.json()),
        fetch('/rezerv.json',{cache:'no-store'}).then(r=>r.json())
      ]);
      if(rr&&rr.ok&&rr.net&&rr.net.degerUSD!=null&&rj&&rj.swapStoku!=null){
        const shNet=+(rr.net.degerUSD-rj.swapStoku).toFixed(1);
        const trend=shNet>=40?'güçlü':shNet>=35?'toparlanıyor':'zayıf';
        /* §245k: "· canlı" damgası yarım doğruydu — net canlı ama swap stoku
           elle. Stok 10 günü aştıysa yaş damgada görünür (karne ile aynı kural). */
        let sy=null; try{ sy=Math.round((Date.now()-new Date((rj.guncelleme||'')+'T00:00:00').getTime())/86400000); }catch(e){}
        const ek=(sy!=null&&sy>10)?' <span style="color:#E8933B;font-size:9px">stok '+sy+'g</span>':'';
        $('yabRezervVal').innerHTML='~'+trN(shNet,1)+' mlr $ · '+trend+' <span class="thin" style="font-size:9px">· canlı</span>'+ek;
        $('yabRezervVal').className=shNet>=35?'up':'down';
      }
    }
  }catch(e){}
}

/* ---- Rezerv Karnesi canlı: brüt (haftalık) + net (aylık, kur çevirimli) ---- */
async function karneRezervCanli(){
  if(!$('karneBrut'))return;
  /* §245k SESSİZ DÜŞÜŞ GÖRÜNÜR YAPILDI. Eski halde üç çıkış yolu vardı ve
     üçü de sessizdi: if(!r.ok)return · if(!j.ok)return · catch(e){}.
     HTML'de sabit yedekler dururken bu sessizlik ÖLÜMCÜLDÜ: EVDS düşünce
     16 Tem'in sayıları bugünmüş gibi kalıyordu. Sabit yedekler kaldırıldı
     (§245k index.html) — şimdi düşüş "—" olarak görünür VE damga sebebini
     söyler. haberCanliCek (§245d) ile aynı desen: yedeğe düşmek kusur değil,
     SESSİZCE düşmek kusurdur. */
  const dusum=(neden)=>{ const t=$('karneTag'); if(!t) return;
    t.innerHTML='<span style="color:var(--down)">\u26a0 EVDS alınamadı</span> <span class="thin">· '+esc(String(neden).slice(0,50))+'</span>';
    console.warn('[KTPanel] rezerv karnesi EVDS düşüşü:', neden); };
  try{
    const r=await fetch('/api/evds2?mod=rezerv');
    if(!r.ok){ dusum('HTTP '+r.status); return; }
    const j=await r.json();
    if(!j.ok){ dusum(j.err||'ok:false'); return; }
    // Brüt (haftalık, USD milyar hazır geliyor)
    if(j.brut && $('karneBrut')){
      const b=j.brut;
      const deg = b.degisim!=null ? ' ('+(b.degisim>=0?'+':'')+trN(b.degisim,1)+' haftalık)' : '';
      $('karneBrut').innerHTML=trN(b.deger,1)+deg+' <span class="thin" style="font-size:8px">· canlı</span>';
      $('karneBrut').className = (b.degisim==null||b.degisim>=0)?'up':'down';
      if($('karneTag')&&b.tarih)$('karneTag').textContent='mlr $ · '+b.tarih;
    }
    // Net (aylık TL bilanço, EVDS günlük kuruyla server'da çevrildi)
    if(j.net && j.net.degerUSD!=null && $('karneNet')){
      const n=j.net;
      $('karneNet').innerHTML=trN(n.degerUSD,1)+' <span class="thin" style="font-size:8px">· '+(n.tarih||'')+' · canlı (EVDS kur '+trN(n.kur,1)+')</span>';
      $('karneNet').className='up';
    }
    // Swap hariç net = canlı net − swap stoku (rezerv.json'dan, web güncellemeli).
    // Swap stoku EVDS'de yok (yurtdışı ikili swap gizli); yavaş değişir, json'da saklanır.
    // Net canlı olduğu için swap hariç net de her gün canlı hareket eder.
    if(j.net && j.net.degerUSD!=null && $('karneSwapHaric')){
      try{
        const rj=await (await fetch('/rezerv.json',{cache:'no-store'})).json();
        const swapStoku=rj.swapStoku||0;
        const shNet=+(j.net.degerUSD - swapStoku).toFixed(1);
        const gun=rj.guncelleme||'';
        /* §245k SWAP STOKU YAŞI HÜCREDE. Bu hesabın tek elle girdisi swapStoku
           (EVDS'de yok — yurt dışı ikili swap, TCMB haftalık basın açıklaması).
           Net CANLI olduğu için sonuç canlı GÖRÜNÜYOR; ama stok bayatsa sonuç
           da o kadar bayat. TCMB Perşembe yayınlar: stok 10 günü aştıysa en az
           bir yayın kaçmış demektir → sarı yaş uyarısı hücrede belirir.
           Nöbet panosu zaten alarm veriyor; bu satır uyarıyı SAYININ YANINA
           taşır — sayıyı okuyan kişi panoya bakmamış olabilir. */
        let stokYas=null; try{ stokYas=Math.round((Date.now()-new Date(gun+'T00:00:00').getTime())/86400000); }catch(e){}
        const bayat = (stokYas!=null && stokYas>10);
        $('karneSwapHaric').innerHTML=trN(shNet,1)+' <span class="thin" style="font-size:8px">· net − swap '+trN(swapStoku,1)+' · canlı (stok '+gun+')</span>'+
          (bayat?' <span style="color:#E8933B;font-size:9px;font-weight:600">\u26a0 stok '+stokYas+' günlük — "rezervleri güncelle"</span>':'');
        $('karneSwapHaric').className='up';
      }catch(e){
        /* §245k: rezerv.json okunamazsa swap hariç hesaplanamaz — ama net
           elimizde. Boş bırakmak yerine NEDENİ hücreye yaz. */
        $('karneSwapHaric').innerHTML='<span class="thin">hesaplanamadı · rezerv.json okunamadı</span>';
        console.warn('[KTPanel] swap hariç net:', (e&&e.message)||e);
      }
    }
  }catch(e){ dusum((e&&e.message)||'ağ hatası'); }
}

// Grup son değer + ay etiketi yardımcısı (aylık seriler için)
async function koyGrupSon(valId,tagId,grup,adF,fmt){
  try{
    const r=await fetch('/api/evds2?grup='+grup+'&adFiltre='+encodeURIComponent(adF)+'&gun=800&full=1');
    if(!r.ok)return;
    const d=await r.json(), alan=(d.cozulen||d.seri||'').replace(/\./g,'_');
    const items=(d.ham||[]).filter(x=>x[alan]!=null&&x[alan]!=='');
    if(!items.length)return;
    const sonIt=items[items.length-1], son=parseFloat(sonIt[alan]);
    const parts=String(sonIt.Tarih).split('-').map(Number), sm=parts[1]||0, sy=parts[0];
    const ayAd=['','Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'][sm]||'';
    if($(valId)&&isFinite(son)){$(valId).innerHTML=fmt(son)+' <span class="thin" style="font-size:9px">· canlı</span>';$(valId).title='EVDS3 · '+(d.cozulen||'')+' · '+(sonIt.Tarih||'');}
    if($(tagId)&&ayAd)$(tagId).textContent='('+ayAd+' '+String(sy).slice(2)+')';
  }catch(e){}
}

/* ---- Haftalık Yorum: canlı pano (yarı-otomatik) ---- */


/* ---- Başlık tarihi: GÜNCEL = bugün, SON KAPANIŞ = son işgünü (otomatik) ---- */
function baslikTarih(){
  const el=$('baslikTarih'); if(!el) return;
  const AY=['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
  const fmt=(d,yil)=>{const g=d.getDate(); const a=AY[d.getMonth()]; return g+' '+a.toUpperCase()+(yil?(' '+d.getFullYear()):'');};
  const bugun=new Date();
  // Son işgünü: bugün hafta içiyse dünden geriye ilk hafta içi; hafta sonuysa önceki cuma
  const sonKapanis=new Date(bugun);
  do { sonKapanis.setDate(sonKapanis.getDate()-1); } while(sonKapanis.getDay()===0 || sonKapanis.getDay()===6);
  // Eğer bugün de hafta sonuysa, son kapanış zaten cumaya gelir (döngü hallediyor)
  el.textContent='SON KAPANIŞ: '+fmt(sonKapanis,false)+' · GÜNCEL: '+fmt(bugun,true);
}

/* ---- Canlı gösterge ışığı: "canlı" kelimesini siler, yerine yeşil yanıp sönen nokta ---- */
function canliIsiklari(){
  try{
    document.querySelectorAll('span.thin, .stamp, .tag').forEach(el=>{
      if(el.querySelector('.ldot')) return;           // zaten ışık var
      let h=el.innerHTML;
      if(!/canl[ıi]/i.test(h)) return;                // canlı yoksa dokunma (ışık da eklenmez)
      // "canlı" kelimesini ve komşu ayraçları temizle, yerine yeşil ışık:
      h=h.replace(/\s*·\s*(EVDS\s+)?canl[ıiİI]\b/gi,'')  // "· canlı", "· EVDS canlı"
         .replace(/canl[ıiİI]\s*·\s*/gi,'')               // "canlı · "
         .replace(/canl[ıiİI]\s*/gi,'')                    // yalın "canlı"
         .replace(/·\s*·/g,'·')                            // çift ayraç "· ·"
         .replace(/·\s*\(/g,'(')                           // "· (" → "("
         .replace(/·\s*\)/g,')')                           // "· )" → ")"
         .replace(/\(\s*·\s*/g,'(')
         .replace(/\(\s*\)/g,'')                          // boş parantez
         .replace(/^\s*[·)]\s*/,'')                        // başta kalan · veya )
         .replace(/\s{2,}/g,' ')
         .replace(/\s+·/g,' ·').replace(/·\s+/g,'· ')
         .replace(/\s+\)/g,')').replace(/\(\s+/g,'(')
         .trim().replace(/·$/,'').trim();
      el.innerHTML='<span class="ldot"></span>'+(h?h:'');
    });
  }catch(e){}
}

function yorumPano(){
  if(!$('yXU100'))return;
  // 1) Endeks haftalık (ENDEKSLER dizisindeki 4. eleman = değişim %)
  const eBul=k=>{const e=ENDEKSLER.find(x=>x[0]===k);return e?e[3]:null;};
  const xu=eBul('XU100'), xk=eBul('XKTUM');
  if(xu!=null)$('yXU100').innerHTML='<span class="'+(xu>=0?'up':'down')+'">'+(xu>=0?'+':'')+trN(xu,1)+'%</span>';
  if(xk!=null)$('yXKTUM').innerHTML='<span class="'+(xk>=0?'up':'down')+'">'+(xk>=0?'+':'')+trN(xk,1)+'%</span>';
  // 2) Sektör lider/geride (SEKTOR.sektorler, g[1]=haftalık)
  try{
    const arr=(SEKTOR&&(SEKTOR.sektorler||SEKTOR.data))||[];
    if(arr.length){
      const sr=arr.filter(x=>x.g&&x.g[1]!=null).map(x=>({ad:x.ad,h:x.g[1]})).sort((p,q)=>q.h-p.h);
      const L=sr[0], G=sr[sr.length-1];
      if(L&&$('yLider'))$('yLider').innerHTML='<span class="up">'+esc(L.ad)+' +'+trN(L.h,1)+'%</span>';
      if(G&&$('yGeride'))$('yGeride').innerHTML='<span class="'+(G.h>=0?'':'down')+'">'+esc(G.ad)+' '+(G.h>=0?'+':'')+trN(G.h,1)+'%</span>';
    }
  }catch(e){}
  // 3) Makro değerleri — sahibin ÜRETTİĞİ metni aynala. §304 BİLİNÇLİ KARAR:
  //    burada hesap YAPILMIYOR, biçimlenmiş metin kopyalanıyor; değişkenden
  //    yeniden biçimlemek formatın İKİNCİ sahibini yaratırdı (§112'nin tersi).
  //    Kazıma riski (regex ile sayı ayrıştırma) yalnız HESAP tüketicilerindeydi
  //    ve §304 ile kaldırıldı — ayna kopya kalır.
  const kopyala=(src,dst)=>{const s=$(src);if(s&&$(dst)){const t=s.textContent.replace(/·\s*canlı/,'').trim();if(t&&t!=='—')$(dst).textContent=t;}};
  kopyala('aofmLive','yAOFM');
  kopyala('tufeLive','yTUFE');
  kopyala('rekLive','yREK');
  kopyala('fonMiktar','yNet');
  kopyala('yabCarryVal','yCarry');
  kopyala('ppkPiya','yPiyaBek');
  kopyala('ppkHane','yHaneBek');
  kopyala('yabHaftaVal','yYabanci');
  kopyala('tukGuvenVal','yGuven');
}

/* ABD sekmesi: sayfa açılışında da bir kez dene (sekme açıksa/yenilendiyse) */
setTimeout(function(){ try{ if(document.getElementById('usEndeksBody')) abdSekme(); }catch(e){console.error('[KTPanel] usRender başlangıç:',e);} }, 2500);


/* ── §218 FİNANSAL TABLOLAR (t23) ─────────────────────────────────────────────
   Ticker + dönem gir, KAP'tan tam bilanço ve gelir tablosu gelsin.
   BİLANÇO → YATAY: iki tarihin karşılaştırması. Bilanço STOK'tur; "ne
     birikmiş" değil "ne DEĞİŞMİŞ" sorusu anlamlıdır.
   GELİR TABLOSU → DİKEY: her kalem hasılatın yüzdesi. Dönemin İÇ YAPISINI
     gösterir: maliyet ne kadar yiyor, faaliyet gideri nerede.
   Tersini yapmak bilgi vermez değil ama SORUYU KAÇIRIR.
   İKİ ADIM: mod=fr ile bildirimi bul (dönem penceresi daraltılmış),
   sonra mod=tablo ile tabloyu çıkar. Aynı dönemin birden fazla bildirimi
   olduğu için `idler` sırayla denenir (§211). */
const FT_PENCERE = { 1:['-04-15','-06-15'], 2:['-07-15','-09-15'], 3:['-10-15','-12-15'], 4:['-02-15','-04-30'] };

function ftSayi(n){ return (n==null) ? '—' : trN(n, 0); }
function ftYuzde(n, basamak){ return (n==null) ? '—' : trN(n, basamak==null?1:basamak)+'%'; }
function ftRenk(n, tersMi){
  if(n==null) return 'var(--muted)';
  const p = tersMi ? -n : n;
  return p > 0.05 ? 'var(--up)' : p < -0.05 ? 'var(--down)' : 'var(--ink)';
}

async function ftGetir(){
  const kod = ($('ftKod').value||'').toUpperCase().replace(/[^A-Z]/g,'').slice(0,6);
  const yil = parseInt($('ftYil').value)||new Date().getFullYear();
  const don = parseInt($('ftDonem').value)||2;
  const d = $('ftDurum'), B = $('ftBilanco'), G = $('ftGelir'), N = $('ftNot');
  if(!kod){ d.textContent='ticker gir'; return; }
  B.innerHTML=''; G.innerHTML=''; N.innerHTML='';
  d.textContent = 'bildirim aranıyor…';
  try{
    /* 4. dönem (yıllık) ERTESİ yıl açıklanır — pencere ona göre kayar */
    const py = (don===4) ? yil+1 : yil;
    const [b1, b2] = FT_PENCERE[don];
    const u = '/api/kap?mod=fr&kod='+kod+'&bas='+py+b1+'&son='+py+b2+'&dilim=3';
    const r = await fetch(u, {cache:'no-store'});
    const j = await r.json();
    /* API sürümünü rozete yaz — panel ve API AYRI deploy edilebiliyor,
       hangisinin eski kaldığı tek bakışta görünmeli (§228). */
    try{ const tg=$('ftTag'); if(tg) tg.textContent='panel '+KTP_SURUM+' · api '+((j&&j.surum)||'?'); }catch(e){}
    const aday = (j.fr||[]).filter(x => x.yil===yil && x.donem===don);
    /* §223c HANGİ DÖNEMLER VAR — sorulan yoksa bulunanları göster.
       BORSK vakası: kullanıcı 2Ç26 aradı, şirket 1Ç26 açıklamıştı (121 gün
       gecikmeli). Panel "bulunamadı" deyip susuyordu; oysa aynı pencerede
       BAŞKA bir dönem vardı ve bunu söylemek tek satırlık iş. */
    const varOlanlar = [...new Set((j.fr||[]).filter(x=>x.kod===kod && x.yil)
      .map(x=>x.yil+'/'+x.donem+(x.tur?' ('+x.tur+')':'')))];
    if(!aday.length){
      d.textContent = 'bulunamadı';
      N.innerHTML = '<div class="note" style="border-left:3px solid var(--down)"><b>Bildirim bulunamadı.</b> '+
        esc(kod)+' için '+yil+'/'+don+' dönemi, '+esc(py+b1)+' – '+esc(py+b2)+' penceresinde yok. '+
        (varOlanlar.length
          ? 'Ama bu pencerede <b>'+varOlanlar.map(esc).join(', ')+'</b> bulundu — dönem seçimini kontrol et. '
          : 'Şirket geç açıklamış olabilir (bazıları 120+ gün gecikiyor) ya da o dönem finansal rapor vermemiş olabilir. ')+
        (j.uyari ? '<br><span class="thin">'+esc(String(j.uyari))+'</span>' : '')+'</div>';
      return;
    }
    const kayit = aday[0];
    const idler = (kayit.idler && kayit.idler.length) ? kayit.idler : [kayit.id];

    d.textContent = 'tablo çıkarılıyor… ('+idler.length+' bildirim)';
    let enIyi = null, enIyiId = null, enIyiSkor = 0; const denemeler = [];
    for(const id of idler.slice(0,6)){
      const rr = await fetch('/api/kap?mod=tablo&id='+id, {cache:'no-store'});
      const jj = await rr.json();
      /* §233 KISMİ TABLO DA GÖSTERİLİR. Eşik ">3 kalem" idi; genişletilmiş
         şablonun (15+18 kalem) etiketleri hiç doğrulanmamıştı, az kalem
         bulunca TAMAMEN başarısız sayılıyordu.
         Kısmi tablo hiç tablodan iyidir — eksik kalemler zaten SOLUK ve
         "bulunamadı" notuyla görünüyor (§218.3), yani yanıltmıyor.
         En çok kalem bulan kimlik seçilir, ilk yeterli olan değil. */
      const skor = (jj && jj.ok) ? (jj.bilanco.bulunan + jj.gelir.bulunan) : 0;
      denemeler.push({ id, kalem:skor });
      if(skor > enIyiSkor){ enIyi = jj; enIyiId = id; enIyiSkor = skor; }
      if(skor >= 12) break;                    // yeterince dolu, aramayı bitir
    }
    const t = enIyi, kullanilan = enIyiId;
    if(!t || enIyiSkor === 0){
      d.textContent = 'ayrıştırılamadı';
      /* Hangi kimlik kaç kalem verdi — tahmin ettirme, göster (§145) */
      N.innerHTML = '<div class="note" style="border-left:3px solid var(--down)"><b>Tablo çıkarılamadı.</b><br>'+
        denemeler.map(x=>'· KAP '+esc(String(x.id))+' → '+x.kalem+' kalem').join('<br>')+
        '<br><span class="thin">Teşhis için: <code>/api/kap?mod=teshis&kod='+esc(kod)+'&gun=20</code> — hangi etiketin ne bulduğunu, birimi ve kısıt sebeplerini döndürür.</span></div>';
      return;
    }
    d.textContent = '';
    ftCiz(t, kod, yil, don, kullanilan, kayit);
  }catch(e){ d.textContent = 'hata'; N.innerHTML = '<div class="note">'+esc(String((e&&e.message)||e).slice(0,160))+'</div>'; }
}

function ftCiz(t, kod, yil, don, id, kayit){
  const DON = {1:'1Ç (3 Aylık)',2:'2Ç (6 Aylık)',3:'3Ç (9 Aylık)',4:'4Ç (Yıllık)'};
  /* ── BİLANÇO · YATAY ── */
  const bl = t.bilanco.kalemler.map(x=>{
    if(x.yok) return '<tr style="opacity:.42"><td colspan="5" style="font-size:10px;padding-left:'+(x.girinti*14)+'px">'+esc(x.etiket)+' <span class="thin">— bulunamadı</span></td></tr>';
    const kalin = x.girinti===0;
    return '<tr'+(kalin?' style="font-weight:700;background:var(--bg2)"':'')+'>'+
      '<td style="padding-left:'+(x.girinti*14)+'px">'+esc(x.etiket)+'</td>'+
      '<td class="num">'+ftSayi(x.cari)+'</td>'+
      '<td class="num">'+ftSayi(x.onceki)+'</td>'+
      '<td class="num" style="color:'+ftRenk(x.fark)+'">'+ftSayi(x.fark)+'</td>'+
      '<td class="num" style="color:'+ftRenk(x.degisim)+'">'+ftYuzde(x.degisim)+'</td></tr>';
  }).join('');
  $('ftBilanco').innerHTML =
    '<div class="kart-bas"><span class="lbl">BİLANÇO · YATAY ANALİZ</span>'+
    '<span class="tag">'+esc(kod)+' '+yil+'/'+don+'</span></div>'+
    '<table><thead><tr><th>Kalem</th><th class="num">Cari</th><th class="num">Önceki</th>'+
    '<th class="num">Fark</th><th class="num">Değişim</th></tr></thead><tbody>'+bl+'</tbody></table>'+
    '<div class="sub" style="font-size:10px;margin-top:4px">'+t.bilanco.bulunan+'/'+t.bilanco.toplam+' kalem · '+
    'Yatay analiz iki TARİHİ karşılaştırır: bilanço stok kalemidir, "ne değişmiş" sorusu anlamlıdır. '+
    /* §229c BİRİM RAPORDAN. Sabit "bin TL" yazmak, TL cinsinden rapor veren
       şirketleri BİN KAT büyük gösteriyordu (BORSK vakası). */
    '<b>Birim: '+esc((t.birim&&t.birim.ad)||'belirsiz')+'</b>'+
    ((t.birim&&t.birim.ad==='belirsiz') ? ' <span style="color:var(--down)">— raporda bulunamadı, ölçek DOĞRULANMALI</span>' : ' (raporun beyanı)')+'</div>';

  /* ── GELİR TABLOSU · DİKEY ── */
  const paydaAd = t.sablon==='banka' ? 'faiz gelirleri' : 'hasılat';
  const gl = t.gelir.kalemler.map(x=>{
    if(x.yok) return '<tr style="opacity:.42"><td colspan="5" style="font-size:10px;padding-left:'+(x.girinti*14)+'px">'+esc(x.etiket)+' <span class="thin">— bulunamadı</span></td></tr>';
    const kalin = x.girinti===0;
    return '<tr'+(kalin?' style="font-weight:700;background:var(--bg2)"':'')+'>'+
      '<td style="padding-left:'+(x.girinti*14)+'px">'+esc(x.etiket)+'</td>'+
      '<td class="num">'+ftSayi(x.cari)+'</td>'+
      '<td class="num"><b>'+ftYuzde(x.pay,2)+'</b></td>'+
      '<td class="num" style="color:var(--muted)">'+ftYuzde(x.oncekiPay,2)+'</td>'+
      '<td class="num" style="color:'+ftRenk(x.puanFark)+'">'+(x.puanFark==null?'—':(x.puanFark>0?'+':'')+trN(x.puanFark,2)+' p')+'</td></tr>';
  }).join('');
  $('ftGelir').innerHTML =
    '<div class="kart-bas"><span class="lbl">GELİR TABLOSU · DİKEY ANALİZ</span>'+
    '<span class="tag">'+esc(t.temel)+'</span></div>'+
    '<table><thead><tr><th>Kalem</th><th class="num">Tutar</th><th class="num">Pay</th>'+
    '<th class="num">Önceki pay</th><th class="num">Puan farkı</th></tr></thead><tbody>'+gl+'</tbody></table>'+
    '<div class="sub" style="font-size:10px;margin-top:4px">'+t.gelir.bulunan+'/'+t.gelir.toplam+' kalem · '+
    'Dikey analiz her kalemi '+paydaAd+'ın yüzdesi olarak gösterir — dönemin İÇ YAPISI. '+
    'Puan farkı, geçen yılın aynı dönemine göre yapının nasıl kaydığını söyler.</div>';

  /* ── OKUMA NOTU ── */
  const bul = a => (t.gelir.kalemler.find(x=>x.ad===a)||{});
  const brut = bul('brutKar'), faal = bul('faaliyetKar'), net = bul('netKar');
  const notlar = [];
  if(brut.puanFark!=null && faal.puanFark!=null && Math.abs(faal.puanFark) > Math.abs(brut.puanFark)*1.5)
    notlar.push('Faaliyet marjı ('+(faal.puanFark>0?'+':'')+trN(faal.puanFark,2)+' p) brüt marjdan ('+(brut.puanFark>0?'+':'')+trN(brut.puanFark,2)+' p) daha çok oynadı — hareket üretim maliyetinde değil <b>faaliyet giderlerinde</b>.');
  if(faal.puanFark!=null && net.puanFark!=null && faal.puanFark<0 && net.puanFark>0)
    notlar.push('Faaliyet marjı düşerken net marj arttı — farkı <b>finansman gideri ve/veya parasal pozisyon</b> taşıyor. Operasyonel iyileşme değil.');
  const oz = t.bilanco.kalemler.find(x=>x.ad==='ozkaynak');
  if(oz && oz.degisim!=null && oz.degisim < -5)
    notlar.push('Özkaynak %'+trN(Math.abs(oz.degisim),1)+' geriledi — temettü, zarar ya da enflasyon muhasebesi düzeltmesi olabilir; dipnota bakılmalı.');
  $('ftNot').innerHTML =
    (notlar.length ? '<div class="note"><b>Okuma notu.</b> '+notlar.join(' ')+'</div>' : '')+
    '<div class="sub" style="font-size:10px;margin-top:5px">Kaynak: <a href="https://www.kap.org.tr/tr/Bildirim/'+esc(id)+'" target="_blank" rel="noopener">KAP '+esc(id)+'</a> · '+
    esc(kayit.tarih)+' · dönem sonundan '+(kayit.gecikmeGun!=null?kayit.gecikmeGun+' gün sonra':'—')+
    (kayit.gec?' <b style="color:var(--down)">(GECİKMİŞ)</b>':'')+
    ' · şablon: '+esc(t.sablon)+' · '+esc(DON[don])+'</div>';
}
