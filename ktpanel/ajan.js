/* ═══════════════════════════════════════════════════════════════════
   KTPANEL YAŞAYAN AJAN v1 — tarayıcı-içi otonom katman
   - Panel açıkken yaşar: 10 dk'da bir canlı fonksiyonları tazeler
   - Değişim izler (önceki tur ile kıyas), olay günlüğü tutar
   - 30 dk'da bir (ya da butonla) Claude API'den GÜNDEM NOTU üretir
   - Ürettiği her şey runtime'da basılır → DEPLOY GEREKMEZ
   - API anahtarı yoksa: kural-tabanlı yorum (AI katmanı opsiyonel)
   ═══════════════════════════════════════════════════════════════════ */
(function(){
const AJAN = {
  ARALIK_VERI: 10*60*1000,     // veri tazeleme turu
  ARALIK_YORUM: 30*60*1000,    // AI yorum turu
  MODEL: 'claude-haiku-4-5-20251001',
  tur: 0, log: [], sonYorumSaat: null, calisiyor: false
};

// Panelde zaten var olan canlı fonksiyonlar — ajan bunları periyodik çağırır
const GOREVLER = ['pozFiyatOto','katfonCanli','tlFaizKart','yabCanli','kkoKart','fmKarne','atifRender'];

// Yorum bağlamı için okunacak panel bölgeleri (id → etiket)
const BAGLAM = [
  ['riskBaroSkor','Risk iştahı barometresi'],
  ['tlMakasBody','Faiz makası'],
  ['kkoBody','Kapasite kullanımı'],
  ['dvzPozBody','Reel sektör döviz pozisyonu'],
  ['rotSeri','YP mevduat 4 hafta'],
  ['fmKarneBody','Faktör model karnesi'],
  ['yabHaftaVal','Yabancı haftalık akış']
];

function $(id){ return document.getElementById(id); }
function saat(){ return new Date().toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'}); }
function kayit(msg){
  AJAN.log.unshift('['+saat()+'] '+msg);
  if(AJAN.log.length>12) AJAN.log.pop();
  const el=$('ajanPano'); if(el) el.innerHTML=AJAN.log.map(x=>'<div class="sub" style="font-size:10px">'+x+'</div>').join('');
}
function durum(t){ const el=$('ajanDurum'); if(el) el.textContent=t; }

/* ── VERİ TURU: mevcut canlı fonksiyonları tazele ── */
async function veriTuru(el){
  if(AJAN.calisiyor) return; AJAN.calisiyor=true;
  AJAN.tur++;
  let n=0;
  for(const ad of GOREVLER){
    try{ if(typeof window[ad]==='function'){ await window[ad](); n++; } }catch(e){}
  }
  AJAN.calisiyor=false;
  kayit('Veri turu #'+AJAN.tur+' — '+n+' kaynak tazelendi');
  try{ await nobetTuru(); }catch(e){}   // §118: deterministik nöbet
  durum('🤖 canlı · son tur '+saat()+' · '+n+' kaynak');
  if(window.EBU_NOBET_UYGULA) setTimeout(window.EBU_NOBET_UYGULA, 1500);  // render bitti → Ebu notları geri
  setTimeout(notMotoru, 4000);   // kartlar boyansın, sonra değişim kontrolü
  setTimeout(ozelGorevler, 12000);
  setTimeout(gunlukBakim, 18000);
  setTimeout(()=>{                          // cron için bağlam fotoğrafı
    try{
      const b=kartKesfet().slice(0,30).map(K=>'• '+K.ad+': '+K.veri.slice(0,140)).join('\n');
      if(!b) return;
      let k={}; try{ k=JSON.parse(localStorage.getItem('ajan_notlar')||'{}'); }catch(e){}
      k.__BAGLAM__={ metin:b, ts:Date.now() };
      notKaydet(k);
    }catch(e){}
  }, 15000);
}

/* ── BAĞLAM: panelin o anki durumunu metne dök ── */
function baglamTopla(){
  const parcalar=[];
  BAGLAM.forEach(([id,ad])=>{
    const el=$(id);
    if(el){ const t=(el.textContent||'').replace(/\s+/g,' ').trim().slice(0,220); if(t) parcalar.push(ad+': '+t); }
  });
  return parcalar.join('\n') + nobetBaglam();   // §118
}

/* ── KURAL-TABANLI YORUM (anahtar yoksa) ── */
function kuralYorum(b){
  const c=[];
  if(/ÇALIŞIYOR/i.test(b)) c.push('Faktör modeli gerçekleşen getirilerle kendini doğruluyor.');
  if(/TERS/i.test(b)) c.push('Faktör makası ters — rejim sorgusu açık.');
  if(/dolarizasyon/i.test(b)) c.push('YP mevduatta dolarizasyon baskısı izleniyor — TL\u0027leşme kanıtı bu hafta zayıf.');
  if(/TL\u0027leşme/i.test(b)) c.push('Yerleşik davranışı TL lehine.');
  if(/pahalı/i.test(b)) c.push('Bankaların fonlama maliyeti politika faizinin üstünde — marj baskısı teması sürüyor.');
  if(/GÜÇLÜ/i.test(b)) c.push('Kapasite kullanımı güçlü bantta.');
  if(/SOĞUMA/i.test(b)) c.push('KKO soğuma sinyali veriyor — büyüme momentumu zayıflıyor.');
  return c.length? c.join(' ') : 'Veriler nominal bantta — belirgin rejim değişikliği sinyali yok.';
}

/* ── AI YORUM TURU ── */
async function yorumTuru(zorla){
  const el=$('ajanNot'); if(!el) return;
  const b=baglamTopla();
  if(!b){ el.innerHTML='<div class="sub">Panel verileri henüz dolmadı — bir sonraki turda.</div>'; return; }
  const promptMetni='Sen KTPanel adlı katılım-finans portföy panelinin yerleşik ajanısın. Aşağıda panelin şu anki CANLI verileri var. '+
    'Multi-asset fon yöneticisi tonunda, Türkçe, 4-6 cümlelik bir GÜNDEM NOTU yaz: en önemli 2-3 sinyali seç, aralarındaki bağlantıyı kur, '+
    'yatırım duruşuna etkisini söyle. Rakamları verilerden aynen kullan, uydurma. Selamlama/başlık yazma, doğrudan nota başla.\n\n'+b;
  // 1) SUNUCU anahtarı dene (Vercel env — cihaz bağımsız)
  try{
    durum('🤖 yorum yazılıyor…');
    const sr=await fetch('/api/market?mod=ai',{ method:'POST',
      headers:{'content-type':'application/json'}, body:JSON.stringify({prompt:promptMetni}) });
    const sd=sr.ok?await sr.json():null;
    if(sd&&sd.ok&&sd.metin){
      AJAN.sonYorumSaat=saat();
      el.innerHTML='<div style="font-size:12px;line-height:1.6">'+sd.metin.trim().replace(/</g,'&lt;').replace(/\n/g,'<br>')+'</div>'+
        '<div class="sub" style="font-size:9px;margin-top:4px">🤖 Claude Haiku · sunucu anahtarı · '+AJAN.sonYorumSaat+'</div>';
      kayit('AI gündem notu (sunucu anahtarı)');
      try{ let k=JSON.parse(localStorage.getItem('ajan_notlar')||'{}');
        k.__GUNDEM__={ html:sd.metin.trim(), ts:Date.now(), kaynak:'panel' }; notKaydet(k); }catch(e){}
      durum('🤖 canlı · son tur '+saat());
      return;
    }
    if(sd&&sd.err&&sd.err!=='sunucu-anahtari-yok'){ kayit('Sunucu AI: '+sd.err); window.AJAN_SUNUCU_HATA=ajanHataOzet(sd.err,sd.err,0); ajanDurumSeridi(); }   /* §254 */
    else { window.AJAN_SUNUCU_HATA=null; ajanDurumSeridi(); }   /* §254 hata gecince serit KALKAR */
  }catch(e){}
  // 2) Yerel anahtar (tarayıcı)
  const key=localStorage.getItem('ajan_api_key')||'';
  if(!key){
    el.innerHTML='<div style="font-size:12px;line-height:1.55">'+kuralYorum(b)+'</div>'+
      '<div class="sub" style="font-size:9px;margin-top:4px">kural-tabanlı özet · '+saat()+' · '+
      (window.AJAN_SUNUCU_HATA?('sunucu AI hatası: '+String(window.AJAN_SUNUCU_HATA).slice(0,90)):'AI yorumu için Vercel\u0027e ANTHROPIC_API_KEY ekle ya da aşağıya yerel anahtar gir')+'</div>';
    kayit('Kural-tabanlı yorum üretildi (anahtar yok)');
    return;
  }
  try{
    durum('🤖 yorum yazılıyor…');
    const r=await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',
      headers:{ 'x-api-key':key, 'anthropic-version':'2023-06-01',
        'anthropic-dangerous-direct-browser-access':'true', 'content-type':'application/json' },
      body:JSON.stringify({ model:AJAN.MODEL, max_tokens:500, messages:[{role:'user',content:promptMetni}]})
    });
    const d=await r.json();
    const metin=(d&&d.content&&d.content[0]&&d.content[0].text)?d.content[0].text.trim():null;
    if(metin){
      AJAN.sonYorumSaat=saat();
      el.innerHTML='<div style="font-size:12px;line-height:1.6">'+metin.replace(/</g,'&lt;').replace(/\n/g,'<br>')+'</div>'+
        '<div class="sub" style="font-size:9px;margin-top:4px">🤖 Claude Haiku · '+AJAN.sonYorumSaat+' · deploy\u0027suz canlı yorum</div>';
      kayit('AI gündem notu üretildi');
    } else {
      const hata=(d&&d.error&&d.error.message)?d.error.message.slice(0,80):'yanıt boş';
      el.innerHTML='<div class="sub">AI yanıtı alınamadı: '+hata+'</div><div style="font-size:12px;margin-top:6px">'+kuralYorum(b)+'</div>';
      kayit('AI hatası → kural-tabanlı yedek');
    }
  }catch(e){
    el.innerHTML='<div class="sub">AI erişim hatası — kural-tabanlı yedek:</div><div style="font-size:12px;margin-top:6px">'+kuralYorum(b)+'</div>';
    kayit('AI erişim hatası → yedek yorum');
  }
  durum('🤖 canlı · son tur '+saat());
}


/* ═══ NOT MOTORU v3 — OTOMATİK KEŞİF: notu olan TÜM kartlar izlenir ═══
   Frekans doğal: hash yalnız veri değişince değişir (günlükse günlük,
   haftalıksa haftalık, aylıksa aylık). Soğuma: kart başına min 20 saat
   (canlı fiyat kartları gürültüyle her tur yazılmasın). Parti: tur başına
   en fazla 6 not (ilk senkron birkaç turda doğal tamamlanır). */
// §121: Portföy Yönetimi grubunun TAMAMI + Sukuk — Ebu bakmaz.
// t21 (Teknik) eklendi: kartlarının .note'u SABİT KILAVUZ metnidir, veriye bağlı
// değildir — Ebu yeniden yazarsa çizim/gösterge açıklamaları kaybolur. Ayrıca grafik
// canvas'tir, kart verisi hash'i her fiyat değişiminde değişirdi ve not motoru
// boşuna tetiklenip token yakardı.
/* SS327 (19 Agu denetim turu): t23 Finansal Tablolar EVRENDEN CIKARILDI.
   OLCULEN ARIZA: kart TEMBEL - tablo ancak kullanici sirket secip 'getir'
   dedikten sonra dolar. Ebu bos karti yorumladi ve genel finans bilgisiyle
   DOLDURMA yapti: 'nakit pozisyonundaki gerileme ile ticari alacaklardaki
   ARTIS...' - ayni anda getirilen TOASO 2026/2C tablosunda ticari alacaklar
   %2,3 AZALMISTI. Yorum akiciydi, dogru degildi.
   Kart ayrica KULLANICIYA OZEL bir sorgu ekrani: her kullanici baska sirkete
   bakar, tek bir 'not' kimin verisini anlattigini bilemez.
   DERS (SS111'in kardesi): BOS/TEMBEL KARTA YORUM YAZILMAZ - veri gelmeden
   uretilen cumle bilgi degil DOLDURMADIR. */
const SEKME_DISLA = ['t3','t4','t5','t6','t8','t9','t10','t11','t14','t20','t21','t23','t26','t27'];
/* §154: t22 kalktı — Endeksten Ayrışma Portföy (t3) içine taşındı, t3 zaten listede
   §365c (21 Ağu, kullanıcı): t27 SEKTÖREL VERİLER ve t26 GYO NAV dışlandı.
     t27 — Katılım Fonları + PYŞ Sektör buraya TAŞINDI (§365). Eskiden ikisi de
       t10 (Sukuk) altındaydı ve t10 zaten dışlanmıştı; taşıma dışlamayı da
       taşımalıydı, yoksa Ebu bir gecede kapsamına giren iki karta yorum
       yazmaya başlardı. TAŞIMA = KAPSAMIN DA TAŞINMASI.
     t26 — GYO NAV: TSPB'nin resmî NAD tablosu; yorum değil VERİ kartı, üstelik
       45 satırlık tablo (not motoru satır kartları için değil).
   ÜÇ-YER KURALI'nın ajan ayağı (§121): yeni sekme eklerken düğme + panel +
   üyelik yetmez; kart yorumlanacak mı sorusunun cevabı da BURAYA yazılır. */
const SOGUMA_MS = 6*3600*1000;   // 6 saat: veri değişince aynı gün içinde tazelenebilir (20h fazla katıydı)
const PARTI = 4;   // token güvenliği: 4 not × ~450 token

function lblAdi(lblEl){
  const klon=lblEl.cloneNode(true);
  klon.querySelectorAll('.tag,.thin,.ldot,.sub').forEach(x=>x.remove());
  return (klon.textContent||'').replace(/\s+/g,' ').trim().slice(0,42);
}
function kartKesfet(veriSart){
  if(veriSart===undefined) veriSart=true;   // yazım/hash için veri şart; GERİ YÜKLEME için değil
  const liste=[]; const gorulen={}; let sonH2=''; let sonH3=''; let bolumKartlari=[];
  let sonH2Canli=false, sonH3Canli=false;   // §111: canlı kart tespiti
  const kartAd=new Map(), kartVeri=new Map(), kartNotIdx=new Map(), kartCanli=new Map();
  // CANLI İŞARETİ: canliIsiklari() canlı kartlara .ldot (yeşil nabız) basar.
  // Kartın kendisinde ya da bağlı olduğu başlıkta varsa o kart canlı sayılır.
  const isikVar=el=>!!(el&&el.querySelector&&el.querySelector('.ldot'));
  const kartMetni=(c)=>{ let t=(c.textContent||'');
    c.querySelectorAll('.note').forEach(n=>{ t=t.replace(n.textContent||'',''); });
    return t.replace(/\s+/g,' ').trim(); };
  document.querySelectorAll('h2, h3, .card, .note').forEach(el=>{
    // ── bölüm başlığı
    if(el.tagName==='H2'||el.tagName==='H3'){
      const k=el.cloneNode(true); k.querySelectorAll('.thin,.tag').forEach(x=>x.remove());
      const baslik=(k.textContent||'').replace(/\s+/g,' ').trim().slice(0,42);
      if(el.tagName==='H2'){ sonH2=baslik; sonH3=''; bolumKartlari=[]; sonH2Canli=isikVar(el); sonH3Canli=false; }
      else { sonH3=baslik; sonH3Canli=isikVar(el); }                                  // alt başlık (KART HARCAMALARI, GRUP KARŞILAŞTIRMASI...)
      return;
    }
    // ── kart: kimliğini ve verisini şimdi hesapla
    if(el.classList&&el.classList.contains('card')){
      bolumKartlari.push(el);
      const lblEl=el.querySelector('.lbl');
      let ad=lblEl?lblAdi(lblEl):(sonH3||sonH2||'');
      if(!ad){ kartAd.set(el,''); return; }
      if(gorulen[ad]){ gorulen[ad]++; ad=ad+' #'+gorulen[ad]; } else gorulen[ad]=1;
      kartAd.set(el, ad); kartVeri.set(el, kartMetni(el)); kartNotIdx.set(el, 0);
      kartCanli.set(el, isikVar(el)||sonH3Canli||sonH2Canli);
      return;
    }
    // ── not: kart içinde mi, bölüm seviyesinde mi?
    const nt=el;
    if(nt.id==='yorumMetin') return;                       // haftalık yorum: özel görev
    const sekme=nt.closest?nt.closest('.tab'):null;
    if(sekme&&SEKME_DISLA.includes(sekme.id)) return;      // dışlanan sekmeler
    // §124 KART DÜZEYİNDE DIŞLAMA — sekme düzeyi yetmiyor.
    // Tahminler, Makro Veriler'in İÇİNE alt sekme olarak taşınınca (t22 kalktı)
    // §122'deki sekme dışlaması geçersizleşti: t2 Ebu'nun çalıştığı bir sekme.
    // Genel çözüm: herhangi bir kart ya da panel data-ebu="hayir" ile muaf olur.
    // Yeni sabit-metinli bölüm eklendiğinde tek nitelik yeter, liste güncellemek gerekmez.
    // §136 DÜZELTME: burada `k` TANIMLI DEĞİL. `const k` yukarıda H2/H3 bloğunun
    // içinde tanımlanıp orada return ediliyor; blok kapsamlı olduğu için bu
    // satırda görünmüyor → ReferenceError → forEach çöküyor → kartKesfet çöküyor
    // → onu çağıran YEDİ tüketicinin hepsi ölüyor. Ebu tamamen sustu.
    // Doğru değişken `nt` (not öğesi, hemen yukarıda tanımlı).
    if(nt.closest && nt.closest('[data-ebu="hayir"]')) return;
    const kart=nt.closest('.card');
    let ad='', veri='';
    if(kart&&kartAd.has(kart)){                            // KART İÇİ NOT (eski davranış — anahtarlar korunur)
      const base=kartAd.get(kart); if(!base) return;
      const idx=kartNotIdx.get(kart)||0; kartNotIdx.set(kart, idx+1);
      ad = idx===0 ? base : base+' ·n'+(idx+1);
      veri = kartVeri.get(kart)||'';
      /* §322 KOMSU VERI KOPRUSU — bir notun girdisi bugune kadar YALNIZ kendi
         kartinin metniydi. Kritik Takvim/GORUS ikilisi bunu kirdi: GORUS ayri
         bir kart oldugu icin Ebu'ya giden paket bos kaliyordu ve yorum, yanindaki
         takvimi GORMEDEN yaziliyordu (24 Tem penceresini anlatmaya devam etmesinin
         sebebi buydu). Cozum genel: not, data-ebu-veri="<CSS secici>" ile BASKA
         kaplarin metnini de girdi olarak ister. Secici HTML'de durur — yeni kart
         eklenince ajan.js'e dokunmak gerekmez (§245 ruhu).
         SS319 ile birlikte anlami buyuk: takvim kartinin icinde artik otomatik
         KURESEL MAKRO bolumu de var, yani Ebu yaklasan FOMC/PMI/istihdam
         satirlarini dogrudan okur. */
      const ekSec=nt.dataset?nt.dataset.ebuVeri:null;
      if(ekSec){
        const parcalar=[];
        ekSec.split(',').forEach(sc=>{
          sc=sc.trim(); if(!sc) return;
          document.querySelectorAll(sc).forEach(kap=>{
            if(kap===nt||kap.contains(nt)) { /* kendi notunu girdi sayma */ }
            const kop=kap.cloneNode(true);
            kop.querySelectorAll('[data-ebu-veri],.note').forEach(x=>x.remove());
            const m=(kop.textContent||'').replace(/\s+/g,' ').trim();
            if(m) parcalar.push(m);
          });
        });
        if(parcalar.length) veri=(veri?veri+' || ':'')+'[EK VERI] '+parcalar.join(' || ').slice(0,1600);
      }
    } else {                                               // BÖLÜM NOTU (kart dışında)
      const base=(sonH3||sonH2||''); if(!base) return;
      const anahtarBase=base+' ·not';
      if(gorulen[anahtarBase]){ gorulen[anahtarBase]++; ad=anahtarBase+gorulen[anahtarBase]; }
      else { gorulen[anahtarBase]=1; ad=anahtarBase; }
      // VERİ: notun HEMEN ÖNÜNDEKİ kardeş bloklar (başlığa ya da başka nota gelince dur)
      const parca=[]; let sy=0, kardes=nt.previousElementSibling;
      while(kardes&&sy<2){
        if(kardes.tagName==='H2'||kardes.tagName==='H3') break;
        if(kardes.classList&&kardes.classList.contains('note')) break;
        const t=(kardes.textContent||'').replace(/\s+/g,' ').trim();
        if(t){ parca.unshift(t); sy++; }
        kardes=kardes.previousElementSibling;
      }
      veri = parca.join(' ').slice(0,700);
      if(!veri&&bolumKartlari.length) veri=kartMetni(bolumKartlari[bolumKartlari.length-1]).slice(0,700);
    }
    if(/AJAN|EBU/i.test(ad)) return;                       // Ebu'nun kendi kartı
    if(/^GÖRÜŞ/i.test(ad)) return;                         // özel görev (Takvim→Görüş)
    if(veriSart&&(veri.length<15||/yükleniyor|hesaplanıyor|uyanıyor/i.test(veri.slice(0,80)))) return;
    // Veri akışı kesikse NOTA DOKUNMA (eğitici içerik korunur; veri dönünce yeniden yazılır)
    if(veriSart&&/alınamadı|alinamadi|veri yok|erişilemedi|hata/i.test(veri)) return;
    const canli = kart ? !!kartCanli.get(kart) : (sonH3Canli||sonH2Canli);
    liste.push({ad, nt, veri, canli});
  });
  /* §274 AYNI KART ADI İKİ KEZ EŞLEŞMESİN. 12 Ağu Avrupa sekmesi: "AVRO
     BÖLGESİ ENFLASYON — KIRILIM" notu ekranda İKİ KEZ basıldı — aynı metin,
     aynı damga, alt alta. Sebep: kart içinde BİRDEN FAZLA .note elemanı var
     ve ikisi de aynı başlığa çözüldü; notNobetci/notlariGeriYukle her ikisine
     de yazdı. innerHTML ile yazıldığı için çoğaltma değil, AYNI NOTUN İKİ
     YERDE görünmesiydi.
     Ad başına İLK not tutulur — sonrakiler atılır. İlk olan kartın kendi not
     alanıdır (DOM sırası), sonrakiler açıklama/dipnot bloklarıdır. */
  const _gorulen = new Set();
  const _tekil = liste.filter(x => {
    const a = String(x && x.ad || '');
    if (!a || _gorulen.has(a)) return false;
    _gorulen.add(a); return true;
  });
  return _tekil;
}

function h32(t){ let h=0; for(let i=0;i<t.length;i++){ h=(h*31+t.charCodeAt(i))|0; } return String(h); }



/* ═══ NÖBETÇİ — app.js'in yeniden çizdiği notları geri koyar ═══
   Bazı kartların notunu app.js üretir (bnkNot, kartOzet vb.) ve her render'da
   üzerine yazar. Ebu'nun yazdığı notlar data-ebu ile işaretlenir; işaret
   kaybolduğunda (= üzerine yazıldı) bu nöbetçi Ebu'nun sürümünü geri koyar. */
/* ═══════════════════════════════════════════════════════════════════════════
   NÖBETÇİLER (§118) — Ebu'nun DETERMİNİSTİK tarafı
   Bugüne kadar Ebu esas olarak YORUM YAZIYORDU ve hataların hepsi oradan çıktı
   (§87 halüsinasyon · §110 çift imza · §111 tabloyla çelişen rakam).
   Nöbetçiler üretmez, ÖLÇER ve SÖYLER: veri hesaplanır, AI'ya sorulmaz.
   Halüsinasyon riski sıfır — yanlış olabilecek tek şey eşik ayarıdır, o da görünür.
   ═══════════════════════════════════════════════════════════════════════════ */

/* Türkçe kısa tarih: "28 Tem 2026" → Date */
const NOB_AY = {oca:0,'şub':1,sub:1,mar:2,nis:3,may:4,haz:5,tem:6,'ağu':7,agu:7,eyl:8,eki:9,kas:10,ara:11};
function nobTarih(s){
  const t = String(s||'').trim();
  let m = t.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if(m) return new Date(+m[1], +m[2]-1, +m[3]);
  m = t.match(/(\d{1,2})\s+([A-Za-zÇĞİÖŞÜçğıöşü]{3})[a-zçğıöşü]*\s+(\d{4})/);
  if(!m) return null;
  const a = NOB_AY[m[2].toLowerCase()];
  return (a==null) ? null : new Date(+m[3], a, +m[1]);
}
/* §261 OLU YARDIMCI KALDIRILDI: nobGun. tazelikNobeti hesabi TZ.durum()'a
   devredilince gun farki orada hesaplaniyor; tanim 1, cagri 0 kalmisti. */
/* GÜN ANAHTARI: kart tarihi saatsizdir (00:00), KAP bildirimi saatlidir (19:08).
   Damga-zamanı karşılaştırılırsa kart AYNI GÜN yazılmış olsa bile "eski" sayanır ve
   nöbetçi kalıcı yanlış alarm üretir. Karşılaştırma GÜN bazında yapılır (§118 testi yakaladı). */
/* §261 nobGunAnahtar DA OLU (cagri 0) — bu OTURUMDAN ONCE de oyleydi,
   benim degisikligimle ilgisi yok. Ayni turda temizlendi. */

/* ── NÖBET 1: TAZELİK ─────────────────────────────────────────────────────────
   guncelleme-plani.json'daki her katmanın yaşını ölçer, vadesi geçenleri toplar.
   SEZON KURALI: BIST çeyreklik raporları Şub-Mar / Nis-May / Tem-Ağu / Eki-Kas
   aylarında yayımlanır. O aylarda şirketler guidance revize eder, çarpanlar ve
   faktör tabanı değişir — 'sezon:true' katmanlarda limit sezon_limit_gun'e DÜŞER.
   Neden gerekli: guidance.json nominal olarak ÇEYREKLİK (90 gün limit) ama sezon
   ortasında 11 günlük guidance bile bayattır; saf gün sayısı bunu kaçırırdı.
   KÖR NOKTA NOTU: bu nöbet ancak kayıttaki katmanları görür. Panele veri besleyen
   HER dosya guncelleme-plani.json'da olmalı — 28 Tem'e kadar altısı yoktu. */
async function tazelikNobeti(){
  /* §261 HESAP TEK SAHİBE DEVREDİLDİ — window.tazelikHesap.
     §245p bunu YAPTIĞINI SÖYLÜYORDU ("ajan.js de bunu kullanır") ama ÖLÇÜLDÜ:
     ajan.js tazelikHesap'ı HİÇ ÇAĞIRMIYORDU; kendi sikCoz/dosyaTarihleri/
     döngüsünü çalıştırıyordu. Birleştirme YARIM KALMIŞTI ve fark BÜYÜMÜŞTÜ.
     11 Ağu ÖLÇÜMÜ — 33 katmanda ÜÇ GERÇEK FARK:
       1) `limit_gun` ALANI: planda "Yabancı para akışı" ve "Swap stoku" için
          limit_gun:13 yazılı. app.js okuyor, ajan.js HİÇ BAKMIYORDU ve
          sözlükten 7 alıyordu — plana yazılmış kural Ebu'ya ULAŞMIYORDU.
       2) `olay` TİPİ: Ülke kredi notu / Halka arzlar / İnceleme AI / Köprü
          testi olay bazlı, takvimi yok. app.js muaf tutuyor; ajan.js'te bu
          dal YOKTU, 999 limitine düşüp KAZARA "taze" diyordu.
       3) `yaklasti` KADEMESİ: app.js taze/yaklasti/bayat (3), ajan.js
          taze/bayat (2). Yedi katmanda Ebu BAYAT derken çekmece "yaklaştı".
     KORUNAN — Ebu'nun RAPOR katmanı kendisine ait: `tanimsiz` yaptırım
     listesi (§245), `asim` sıralaması, pano sözleşmesi {dosya, gun, sez}.
     Tek hesap, iki rapor.
     BİLİNÇLİ FARK: Ebu 'yaklasti'yı DA bayat sayar (tip!=='taze'), çünkü
     nöbetin işi UYARMAK, çekmecenin işi DURUM GÖSTERMEK. Aynı hesap, farklı
     eşik — ve bu fark artık kaza değil, yazılı. */
  try{
    const TZ = window.tazelikHesap;
    if(!TZ) return null;                    /* app.js yüklenmediyse sessiz çık */
    const r = await fetch('/guncelleme-plani.json', {cache:'no-store'});
    if(!r.ok) return null;
    const plan = await r.json();
    const sg = plan.siklik_gun || {};
    const bugun = new Date();
    const SEZ = TZ.sezonBaglam(plan, bugun);
    const dosyaT = await TZ.dosyaTarihleri(plan.katmanlar || []);
    const bayat = [], tanimsiz = [];
    (plan.katmanlar || []).forEach(k => {
      const D = TZ.durum(k, sg, dosyaT, bugun, SEZ);
      if(D.tip === 'canli' || D.tip === 'olay' || D.tip === 'taze') return;
      if(D.tip === 'tanimsiz'){ tanimsiz.push({ad:k.ad, dosya:k.dosya, siklik:k.siklik}); return; }
      bayat.push({ad:k.ad, dosya:k.dosya, gun:D.gun, limit:D.limit, sez:!!D.sez,
                  asim:D.gun - D.limit, tip:D.tip});
    });
    bayat.sort((a,b) => b.asim - a.asim);
    return {bayat, tanimsiz, sezonda:SEZ.sezonda, toplam:(plan.katmanlar||[]).length};
  }catch(e){ return null; }
}

/* ── NÖBET 2: BİLANÇO ─────────────────────────────────────────────────────────
   KAP akışındaki FR (finansal rapor) bildirimlerini izler ve inceleme-ai.json'daki
   kartlarla karşılaştırır. Kartı olmayan ya da kartı BİLDİRİMDEN ESKİ olan kodlar
   "kart bekliyor" listesine düşer.
   NEDEN TARİH KARŞILAŞTIRMASI: yalnız koda bakmak yetmez — ANHYT'nin 2Ç26 kartı
   var ama 3Ç geldiğinde yenisi gerekir. Bildirim tarihi kart tarihinden yeniyse
   yeni dönem raporu demektir.
   EVREN: portföy + Top-40 sepeti + hâlihazırda kartı olanlar. Bütün BIST'i
   izlemek gürültü olurdu; izlenen şey PORTFÖYÜ İLGİLENDİRENDİR.
   28 Tem dersi: o gün beş bilanço geldi (ANHYT·PASEU·AKBNK·TAVHL·BMSTL), hepsini
   kullanıcı fark etti, sistem değil. Bu nöbet tam o boşluğu kapatır. */
async function bilancoNobeti(){
  try{
    /* §202b DÖNEM BİLGİSİYLE NÖBET. Artık /api/kap?mod=fr kullanılıyor:
       KAP'ın kendi disclosureClass='FR' süzgeci + year/period alanları geliyor.
       ÖNCEKİ SORUN: bildirim tarihiyle kart tarihi karşılaştırılıyordu ve aynı
       dönemin ikinci bildirimi (TR/EN sürüm, ek belge) yeni dönem sanılıyordu.
       §197'de 14 günlük tolerans hilesiyle örtülmüştü — artık gereksiz, çünkü
       aynı dönemin her bildirimi AYNI year/period taşır.
       Eski uca düşer (mod=fr yoksa) — geriye uyum. */
    const [kr, ir] = await Promise.all([
      fetch('/api/kap?mod=fr&gun=10', {cache:'no-store'}),
      fetch('/inceleme-ai.json', {cache:'no-store'})
    ]);
    if(!kr.ok || !ir.ok) return null;
    const kap = await kr.json(), inc = await ir.json();
    const kartlar = {};
    /* §237c ONAYLANAN TASLAKLAR DA SAYILSIN.
       Nöbet kartları YALNIZ inceleme-ai.json'dan okuyordu. Onaylanan taslak
       buluta/yerele yazılıyor ve Earnings AI'da görünüyor AMA nöbet onu
       görmediği için "kart bekliyor" demeye devam ediyordu.
       Kullanıcı kartı onaylıyor, iş bitiyor, nöbet hâlâ uyarıyor — en can
       sıkıcı yanlış pozitif türü.
       app.js aynı birleştirmeyi yapıyor (§222b); nöbet de yapmalı. */
    try{
      (JSON.parse(localStorage.getItem('ktp_taslak_kart_v1')||'[]')||[]).forEach(t=>{
        if(!t || !t.kod) return;
        const kod = String(t.kod).toUpperCase();
        const d = nobTarih(t.tarih_iso || t.tarih);
        if(d && (!kartlar[kod] || d > kartlar[kod])) kartlar[kod] = d;
      });
    }catch(e){}
    (inc.kartlar||[]).forEach(k=>{
      const kod = String(k.kod||'').toUpperCase();
      const d = nobTarih(k.tarih);
      if(kod && (!kartlar[kod] || (d && kartlar[kod] < d))) kartlar[kod] = d || new Date(0);
    });
    // İzleme evreni: portföy + Top-40 + kartı olanlar
    const evren = new Set(Object.keys(kartlar));
    try{ (JSON.parse(localStorage.getItem('poz_v1')||'[]')||[])
      .forEach(p=>{ if(p && p.kod && p.tip!=='nakit') evren.add(String(p.kod).toUpperCase()); }); }catch(e){}
    if(typeof TOP40!=='undefined' && Array.isArray(TOP40)) TOP40.forEach(k=>evren.add(String(k).toUpperCase()));
    /* §219 KATILIM ENDEKSLERİ EVRENE GİRDİ.
       Önce evren yalnız kartlar + portföy + Top-40 idi = 73 kod. Panelin ASIL
       ilgi alanı KATILIM EVRENİ olduğu halde XKTUM üyeleri izlenmiyordu —
       portföyde olmayan bir katılım hissesi bilanço açıklasa nöbet susuyordu.
       XKTUM en geniş katılım endeksi; XK100 ve XKTMT onun alt kümesi ama
       ikisi de eklendi (üyelik listeleri tam örtüşmüyor, §159'da ölçüldü:
       XKTMT'de XKTUM'da olmayan dört isim var).
       KAYNAK: app.js'in yüklediği ENDAG. Aynı sayfada çalıştığımız için
       erişilebilir; ayrı fetch gereksiz olurdu. */
    try{
      if(typeof ENDAG!=='undefined' && ENDAG){
        Object.keys(ENDAG).forEach(e=>{
          const u = ENDAG[e] && ENDAG[e].uyeler;
          if(u) Object.keys(u).forEach(kk=>evren.add(String(kk).toUpperCase()));
        });
      }
    }catch(e){ console.warn('[Ebu] endeks evreni okunamadı:', e); }

    const bekleyen = {};
    /* mod=fr `fr` dizisi döndürür (kod/tarih/yil/donem/gec); eski uç `items`.
       İkisi de desteklenir — deploy sırası fark etmesin. */
    const kayitlar = Array.isArray(kap.fr) ? kap.fr
      : (kap.items||[]).filter(it=>String(it.t||'').toUpperCase()==='FR')
          .flatMap(it=>(it.k||[]).map(k=>({kod:String(k).toUpperCase(),
            tarih: it.ts ? new Date(it.ts).toISOString().slice(0,10) : null,
            yil:null, donem:null, gec:false, url:it.url||null, unvan:null})));
    kayitlar.forEach(it=>{
      {
        const kod = String(it.kod||'').toUpperCase();
        const ts = it.tarih ? new Date(it.tarih) : null; if(!ts || isNaN(ts)) return;
        if(!evren.has(kod)) return;
        const kartT = kartlar[kod];
        /* §197 AYNI DÖNEM TOLERANSI. Gün bazında karşılaştırma yanlış pozitif
           üretiyordu: TOASO 29 Tem'de açıkladı, kartı 29 Tem yazıldı, ama KAP'ta
           30 Tem'de İKİNCİ bir FR bildirimi var (şirketler aynı raporu birden
           fazla kez bildirir — TR/EN sürüm, düzeltme, ek belge). Kart bir gün
           eski göründü ve "yeni dönem" sanıldı.
           ÖLÇEK FARKI KURALI VERİYOR: çeyrekler arası ~90 gün, aynı dönemin
           tekrar bildirimi birkaç gün içinde. 14 günlük tolerans ikisini
           kesin ayırır — ne yanlış pozitif üretir ne gerçek yeni dönemi kaçırır.
           (14 gün seçildi: bilanço + faaliyet raporu + bağımsız denetim
           bildirimleri bazen iki haftaya yayılır.) */
        /* §202b: dönem bilgisi VARSA onunla karşılaştır — kesin.
           Yoksa (eski uç) 14 günlük toleransa düş. */
        if(kartT){
          const fark = (ts.getTime() - kartT.getTime()) / 86400000;
          if(fark <= 14) return;              // yedek: aynı dönem sayılır
        }
        const v = bekleyen[kod];
        if(!v || ts > v.ts) bekleyen[kod] = {kod, ts,
          /* §203b: gecikme artık HESAPLANIYOR (dönem sonundan kaç gün).
             KAP'ın isLate alanı güvenilmez — ARENA 120 gün geç açıkladı ama
             false geliyordu. Rozet gerçek gün sayısını gösterir. */
          id: it.id, idler: it.idler || (it.id?[it.id]:[]),
          yil: it.yil, donem: it.donem,
          baslik: (it.yil ? it.yil+'/'+it.donem+(it.tur?' · '+it.tur:'') : 'Finansal Rapor')
                  + (it.gec ? ' · ⚠ '+it.gecikmeGun+' GÜN GECİKMİŞ' : '')
                  + (it.tekrar>1 ? ' · '+it.tekrar+' bildirim' : ''),
          /* §237 donem BURADA biçimlendiriliyor; düğme TEKRAR biçimlendirmemeli.
             Önce düğme yil+'/'+donem yapıyordu ve donem zaten "2026/1" olduğu
             için "2026/2026/1" çıkıyordu. Aynı değerin iki yerde
             biçimlendirilmesi — bir yerde yap, diğeri kullansın. */
          donem: it.yil ? it.yil+'/'+it.donem : null, gec:!!it.gec,
          tsIso: it.tarih || null,          // BİLDİRİM tarihi — kart sıralaması buna göre
          url:it.url||null, portfoyde:!!(typeof poz!=='undefined' && poz.some(p=>p.kod && String(p.kod).toUpperCase()===kod)),
          kartVar:!!kartT};
      }
    });
    /* §265 YOKSAYILANLAR SÜZÜLÜR — kod+dönem kapsamında. Yeni çeyrek gelince
       anahtar değişir ve şirket LİSTEYE GERİ DÖNER; yoksayma tek bir dönem
       için verilmiş karardır, kalıcı sessizleştirme değil. */
    const _yok = (typeof yoksayOku==='function') ? yoksayOku() : {};
    const _yokSay = Object.keys(_yok).length;
    const liste = Object.keys(bekleyen).map(k=>bekleyen[k])
      .filter(x => !_yok[x.kod+'|'+(x.donem||'')])
      .sort((a,b)=> (b.portfoyde?1:0)-(a.portfoyde?1:0) || b.ts-a.ts);
    /* Evren kırılımı görünür olsun — "kaç kod izleniyor" sorusunun cevabı
       tek sayı değil, NEREDEN GELDİĞİ de bilinmeli (§141). */
    let endeksAdet = 0;
    try{ if(typeof ENDAG!=='undefined' && ENDAG){
      const s = new Set();
      Object.keys(ENDAG).forEach(e=>{ const u=ENDAG[e]&&ENDAG[e].uyeler; if(u) Object.keys(u).forEach(x=>s.add(x)); });
      endeksAdet = s.size;
    } }catch(e){}
    return {liste, taranan:(kap.items||[]).length, evren:evren.size, yoksayilan:_yokSay, yoksay:_yok,
      kirilim:{ kart:Object.keys(kartlar).length, endeks:endeksAdet }};
  }catch(e){ return null; }
}

/* ── SUNUM ────────────────────────────────────────────────────────────────────
   İki yer: ajan çekmecesi (özet) ve Earnings AI sekmesi (bilanço şeridi).
   Sabah gündem notunun bağlamına da girer — cron notu bunları görsün diye. */
let NOBET_SON = {tazelik:null, bilanco:null, saat:null};

/* §265 "İLGİLENMİYORUM" LİSTESİ. Kart bekleyen bilanço listesi KAP'tan
   TÜRETİLİR — statik değildir; bir kaydı silmek işe yaramaz, sonraki nöbette
   geri gelir. Kullanıcının gerçek ihtiyacı 29 şirketin hepsinin kartını
   yazmamak: ilgilenmediğini KALICI olarak işaretlemek.
   Kapsam kod+dönem: ZERGY 2026/2'yi yoksaymak 2026/3'ü gizlemez — yeni çeyrek
   yeni karardır. Buluta da yazılır (CLOUD_KEYS'te), cihazlar arası taşınır.
   Geri almak için panonun altındaki "gizlenenler" satırından tek tık. */
const YOKSAY_ANAHTAR = 'ktp_bilanco_yoksay_v1';
function yoksayOku(){
  try{ const o=JSON.parse(localStorage.getItem(YOKSAY_ANAHTAR)||'{}'); return (o&&typeof o==='object')?o:{}; }
  catch(e){ return {}; }
}
function yoksayYaz(o){
  try{ localStorage.setItem(YOKSAY_ANAHTAR, JSON.stringify(o)); }catch(e){}
  /* §264 dersi: debounce DEĞİL — kullanıcı hemen yenilerse kayıt kaybolur */
  try{ if(typeof cloudSave==='function') cloudSave(); }catch(e){}
}
function yoksayEkle(kod, donem){
  const o=yoksayOku(); o[String(kod).toUpperCase()+'|'+(donem||'')]={ts:Date.now(), kod:String(kod).toUpperCase(), donem:donem||''};
  yoksayYaz(o); kayit('Yoksayıldı: '+kod+(donem?' '+donem:''));
  nobetTuru();
}
function yoksayKaldir(anahtar){
  const o=yoksayOku(); delete o[anahtar]; yoksayYaz(o);
  kayit('Yoksayma kaldırıldı: '+anahtar.split('|')[0]);
  nobetTuru();
}
window.yoksayEkle = yoksayEkle;      /* onclick'ten çağrılıyor */
window.yoksayKaldir = yoksayKaldir;
function nobetCiz(){
  const T = NOBET_SON.tazelik, B = NOBET_SON.bilanco;
  const el = $('nobetPano');
  if(el){
    let h = '';
    if(B && B.liste.length){
      h += '<div style="margin-bottom:7px"><span class="lbl" style="color:var(--down)">\u26a0 KART BEKLEYEN B\u0130LAN\u00c7O \u00b7 '+B.liste.length+'</span>'+
        B.liste.slice(0,6).map(x=>'<div style="font-size:11px;margin-top:3px">'+
          (x.portfoyde?'<b style="color:var(--mm2)">\u25cf</b> ':'') + '<b>'+esc(x.kod)+'</b> '+
          /* §265 GİZLE — kartını yazmak istemediğin şirket için. Liste KAP'tan
             türetildiği için "silme" işe yaramaz (sonraki nöbette geri gelir);
             bu düğme kod+dönem kapsamında KALICI yoksayma yazar. */
          '<button class="mini" title="Bu dönem için gizle — kartını yazmayacağım" '+
          'style="font-size:9px;padding:1px 5px;margin-right:4px;opacity:.65" '+
          'onclick="yoksayEkle(&quot;'+esc(x.kod)+'&quot;,&quot;'+esc(x.donem||'')+'&quot;)">\u2715</button>'+
          /* §215b TASLAK DÜĞMESİ. Metrikler /api/kap?mod=kart'tan, yorum
             /api/ajanktp?mod=bilanco'dan. Tarayıcı ikisini sırayla çağırır —
             sunucudan sunucuya istek YOK (§208 dersi). */
          ((x.idler&&x.idler.length)
            ? '<button class="mini" style="font-size:9px;padding:1px 6px;margin-right:5px" onclick="bilancoTaslak(this,&quot;'+esc(x.kod)+'&quot;,&quot;'+x.idler.join(',')+'&quot;,&quot;'+esc(x.donem||'')+'&quot;,&quot;'+esc(x.tsIso||'')+'&quot;)">taslak</button>' : '')+
          '<span class="sub" style="font-size:9px">'+x.ts.toLocaleDateString('tr-TR',{day:'numeric',month:'short'})+
          (x.kartVar?' \u00b7 yeni d\u00f6nem':'')+'</span></div>').join('')+'</div>';
      /* §265 GİZLENENLER — geri alma yolu görünür olmalı, yoksa kullanıcı
         neyi sakladığını unutur ve liste sessizce eksik kalır. */
      if(B.yoksayilan){
        h += '<div class="sub" style="font-size:10px;margin:4px 0 7px;opacity:.7">gizlenen '+B.yoksayilan+': '+
          Object.keys(B.yoksay||{}).slice(0,8).map(a=>'<span style="cursor:pointer;text-decoration:underline dotted" '+
            'title="geri getir" onclick="yoksayKaldir(&quot;'+esc(a)+'&quot;)">'+esc(a.split('|')[0])+'</span>').join(' · ')+'</div>';
      }
    } else if(B){
      h += '<div class="sub" style="font-size:11px;margin-bottom:7px">\u2713 Bekleyen bilan\u00e7o kart\u0131 yok <span class="thin">('+B.evren+' kod: katılım endeksleri '+
        ((B.kirilim&&B.kirilim.endeks)||0)+' + portföy + kartlı '+((B.kirilim&&B.kirilim.kart)||0)+')</span></div>';
    }
    if(T && T.bayat.length){
      h += '<div><span class="lbl" style="color:#E8933B">\u23f0 TAZELENMEL\u0130 \u00b7 '+T.bayat.length+'</span>'+
        T.bayat.slice(0,6).map(x=>'<div style="font-size:11px;margin-top:3px"><b>'+esc(x.dosya)+'</b> '+
          '<span class="sub" style="font-size:9px">'+x.gun+' g\u00fcn'+(x.sez?' \u00b7 \u26a1sezon':'')+'</span></div>').join('')+'</div>';
    } else if(T){
      h += '<div class="sub" style="font-size:11px">\u2713 T\u00fcm damgal\u0131 katmanlar vadesinde ('+T.toplam+' katman)</div>';
    }
    /* §245: TANIMSIZ SIKLIK — sessiz varsayım yerine görünür uyarı.
       Bu satır çıkıyorsa guncelleme-plani.json'daki `siklik` değeri
       siklik_gun sözlüğüyle eşleşmiyor demektir. O katman İZLENMİYOR;
       "vadesinde" raporuna da girmez, bayat listesine de. Yani sessizce
       kör noktaya düşer — bu uyarı tam olarak onu görünür kılmak için var. */
    if(T && T.tanimsiz && T.tanimsiz.length){
      h += '<div style="margin-top:7px"><span class="lbl" style="color:var(--down)">\u2717 SIKLIK TANIMSIZ \u00b7 '+T.tanimsiz.length+'</span>'+
        T.tanimsiz.slice(0,6).map(x=>'<div style="font-size:11px;margin-top:3px"><b>'+esc(x.dosya||x.ad)+'</b> '+
          '<span class="sub" style="font-size:9px">siklik=\u201c'+esc(String(x.siklik))+'\u201d \u2014 s\u00f6zl\u00fckte yok, İZLENMİYOR</span></div>').join('')+'</div>';
    }
    el.innerHTML = h || '<div class="sub" style="font-size:11px">n\u00f6bet hen\u00fcz \u00e7al\u0131\u015fmad\u0131</div>';
  }
  // Earnings AI sekmesindeki şerit
  const es = $('nobetBilanco');
  if(es && B){
    es.innerHTML = B.liste.length
      ? '<div class="card" style="padding:8px 12px;margin-bottom:10px;border-left:3px solid var(--down)">'+
        '<div class="lbl" style="color:var(--down)">KART BEKLEYEN B\u0130LAN\u00c7O \u00b7 '+B.liste.length+
        ' <span class="thin" style="font-weight:400">(KAP FR bildirimi var, kart yok ya da eski)</span></div>'+
        '<div style="margin-top:5px;display:flex;flex-wrap:wrap;gap:5px">'+
        B.liste.map(x=>'<span style="font-size:11px;padding:3px 8px;border:1px solid var(--line2);border-radius:99px;'+
          (x.portfoyde?'border-color:var(--mm2);font-weight:700':'')+'">'+
          (x.url?'<a href="'+esc(x.url)+'" target="_blank" rel="noopener" style="color:inherit;text-decoration:none">':'')+
          esc(x.kod)+' <span class="sub" style="font-size:9px">'+x.ts.toLocaleDateString('tr-TR',{day:'numeric',month:'short'})+'</span>'+
          (x.url?'</a>':'')+
          /* §265 rozetin icinde gizle — 29 sirketin hepsinin karti istenmez.
             event.stopPropagation: rozet <a> icerdiginde tiklamayi yutmali. */
          ' <span title="bu donem icin gizle" style="cursor:pointer;opacity:.45;font-size:10px" '+
          'onclick="event.preventDefault();event.stopPropagation();yoksayEkle(&quot;'+esc(x.kod)+'&quot;,&quot;'+esc(x.donem||'')+'&quot;)">\u2715</span>'+
          '</span>').join('')+'</div>'+
        '<div class="sub" style="font-size:10px;margin-top:6px">Ye\u015fil \u00e7er\u00e7eve = portf\u00f6y\u00fcnde. Claude\u2019a "<b>'+
        esc(B.liste[0].kod)+' bilan\u00e7osunu incele</b>" diyerek kart\u0131 yazd\u0131rabilirsin.</div></div>'
      : '';
  }
}

async function nobetTuru(){
  const [t, b] = await Promise.all([tazelikNobeti(), bilancoNobeti()]);
  NOBET_SON = {tazelik:t, bilanco:b, saat:saat()};
  nobetCiz();
  const n1 = (b && b.liste.length) || 0, n2 = (t && t.bayat.length) || 0;
  if(n1 || n2) kayit('N\u00f6bet: '+(n1?n1+' bilan\u00e7o kart\u0131 bekliyor':'')+(n1&&n2?' \u00b7 ':'')+(n2?n2+' dosya tazelenmeli':''));
  return NOBET_SON;
}

/* Sabah gündem notunun bağlamına nöbet çıktısını ekler — cron bunları görsün */
function nobetBaglam(){
  const T = NOBET_SON.tazelik, B = NOBET_SON.bilanco;
  let s = '';
  if(B && B.liste.length) s += '\nKART BEKLEYEN B\u0130LAN\u00c7OLAR: ' +
    B.liste.map(x=>x.kod+(x.portfoyde?'(portf\u00f6yde)':'')).join(', ');
  if(T && T.bayat.length) s += '\nTAZELENMEL\u0130 DOSYALAR: ' +
    T.bayat.map(x=>x.dosya+' ('+x.gun+'g'+(x.sez?', sezon':'')+')').join(', ');
  return s;
}

/* ═══ IMZA YONETIMI (§110) ═══ ÇİFT ROBOT SİMGESİ VAKASI
   KOK NEDEN — geri besleme döngüsü: imza notun İÇİNE <span> olarak basılıyordu.
   Sonraki turda motor notu textContent ile okuyup AI'ya "MEVCUT NOT" diye
   gönderiyordu — imza da dahil. AI'ya "yapıyı koru" dendiği için imzayı
   sadakatle geri yazıyor, sonra kod BİR İMZA DAHA ekliyordu.
   Her turda birikebilirdi: "...etkiliyor. \ud83e\udd16 \ud83e\udd16Ebu 15:54"
   ÇİFT TARAFLI SAVUNMA:
     okuma  → notMetni()  imzayı soyar, AI onu hiç görmez
     yazma  → imzaEkle()  önce eski imza kalıntılarını siler, sonra TEK imza basar
   Biri atlansa bile diğeri tutar. İmza artık .ebuImza sınıfı taşır — emoji
   aramaya gerek kalmadan güvenilir şekilde bulunur. */
/* §292 AI CIKTISI SUZULUR. localStorage'da iki anahtar (ktp_wkey + ajan_api_key)
   varken modele yazdirilan HTML'i suzmeden innerHTML'e basmak, istem
   enjeksiyonunu XSS'e cevirir — kart metinleri isteme giriyor, yani saldiri
   yuzeyi DIS VERIDIR (KAP basligi, haber metni...).
   DAR mod (not motoru): yalniz b/em/br kalir — istem zaten fazlasina izin vermiyor.
   GENIS mod (haftalik / ozel gorev / gunluk bakim): yapi korunur, yalniz
   YURUTULEBILIR parcalar soyulur: script/style govdesi, on*= isleyiciler,
   javascript: adresler. */
function temizle(html, genis){
  let s=String(html||'');
  s=s.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<style[\s\S]*?<\/style>/gi,'');
  s=s.replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi,'');
  s=s.replace(/(href|src)\s*=\s*("javascript:[^"]*"|'javascript:[^']*')/gi,'');
  if(!genis) s=s.replace(/<(?!\/?(b|em|br)\b)[^>]*>/gi,'');
  return s;
}
function imzaSil(html){
  let s=String(html||''), onceki=null, tur=0;
  while(s!==onceki && tur++<5){
    onceki=s;
    s=s.replace(/<span[^>]*class="[^"]*ebuImza[^"]*"[^>]*>[\s\S]*?<\/span>/gi,'');
    s=s.replace(/<span[^>]*>\s*\ud83e\udd16[\s\S]{0,48}?<\/span>\s*$/i,'');
    s=s.replace(/\s*\ud83e\udd16\s*(?:Ebu)?\s*\d{1,2}[:.]\d{2}\s*$/i,'');
    s=s.replace(/\s*\ud83e\udd16\s*$/,'');
  }
  return s.trim();
}
function imzaEkle(html){
  return imzaSil(html)+' <span class="sub ebuImza" style="font-size:8px;opacity:.7">\ud83e\udd16Ebu '+saat()+'</span>';
}
/* AI istemine giden metin: imza SOYULMUS hali. Döngüyü kaynakta keser. */
function notMetni(el){
  if(!el) return '';
  let t='';
  try{ const c=el.cloneNode(true);
       c.querySelectorAll('.ebuImza').forEach(n=>n.parentNode.removeChild(n));
       t=c.textContent||''; }
  catch(e){ t=el.textContent||''; }
  return imzaSil(t).replace(/\s+/g,' ').trim();
}
/* TEK SEFERLIK ONARIM: depoda birikmis çift imzaları temizler. Nöbetçi
   depodan geri yazdığı için, depo temizlenmeden ekran temizlenmez. */
function imzaOnar(){
  try{
    const k=JSON.parse(localStorage.getItem('ajan_notlar')||'{}');
    let n=0;
    Object.keys(k).forEach(a=>{
      if(!k[a]||!k[a].html) return;
      const temiz=imzaSil(k[a].html);
      const yeni=temiz+' <span class="sub ebuImza" style="font-size:8px;opacity:.7">\ud83e\udd16Ebu '+(k[a].saat||'')+'</span>';
      if(yeni!==k[a].html){ k[a].html=yeni; n++; }
    });
    if(n){ localStorage.setItem('ajan_notlar',JSON.stringify(k)); kayit('İmza onarımı: '+n+' notta fazla simge temizlendi'); }
  }catch(e){}
}
/* §274b AYNI METNİ TAŞIYAN İKİNCİ NOT GİZLENİR — METİN BAZLI.
   13 Ağu Avrupa sekmesi: "AVRO BÖLGESİ ENFLASYON — KIRILIM" notu ekranda İKİ
   KEZ göründü, aynı metin aynı damga. ÖLÇÜLDÜ: iki AYRI .note elemanı aynı
   içeriği taşıyor (DOM sayımı = 2).
   §274'te ad bazlı tekilleştirme yapmıştım — YAKALAMADI, çünkü bu iki eleman
   FARKLI adlara çözülüyor. Ad hangisi olursa olsun, aynı metin iki kez
   basılmışsa ikincisi gereksizdir.
   Not SİLİNMEZ, GİZLENİR: bir sonraki tur adları doğru çözerse eleman yerinde
   durur ve yeniden görünür. Silmek geri dönüşsüz olurdu. */
function notCiftTemizle(){
  try{
    const gorulen = new Map();
    document.querySelectorAll('.note').forEach(n => {
      if(n.dataset.ebu !== '1') return;                 // yalnız Ebu notları
      const imza = (n.textContent||'').replace(/\s+/g,' ').trim().slice(0,140);
      if(imza.length < 40) return;                      // kısa notlar tesadüfen eşleşebilir
      if(gorulen.has(imza)){ n.dataset.ciftGizli='1'; n.style.display='none'; }
      else { gorulen.set(imza, n); if(n.dataset.ciftGizli){ delete n.dataset.ciftGizli; n.style.display=''; } }
    });
  }catch(e){}
}
let NOBET_ZAMAN=null;
function notNobetci(){
  const uygula=()=>{
    try{
      const k=JSON.parse(localStorage.getItem('ajan_notlar')||'{}');
      let geri=0;
      kartKesfet(false).forEach(K=>{
        if(!k[K.ad]||!k[K.ad].html) return;
        if(K.nt.dataset.ebu==='1') return;              // Ebu'nunki duruyor
        K.nt.innerHTML=k[K.ad].html; K.nt.dataset.ebu='1'; notYasEtiketi(K.nt,k[K.ad]); geri++;
      });
      if(geri) kayit('Nöbetçi: '+geri+' not yeniden çizimden sonra geri kondu 🤖');
      notCiftTemizle();
    }catch(e){}
  };
  const obs=new MutationObserver(()=>{
    clearTimeout(NOBET_ZAMAN);
    NOBET_ZAMAN=setTimeout(uygula, 900);               // sarsıntı bitince tek seferde
  });
  obs.observe(document.body, { childList:true, subtree:true });
  window.EBU_NOBET_UYGULA=uygula;
}

/* ── BULUT HAFIZA (api/ajan — KV): localStorage'ın cihazlar-arası ikizi ── */
/* §254 NOT YASI GORUNUR. Bir not 3 gunden eskiyse okuyucu BILMELI — ozellikle
   motor duruksa. 10 Agu olcumu: 123 notun 74'u 7 GUNDEN eskiydi, ortanca
   11 GUN, ve panelde bunu soyleyen HICBIR isaret yoktu. Rotasyon kartinda not
   "her iki enstruman da artis gosteriyor" diyordu; uc kalem de NEGATIFTI.
   Yargi eskir ve SESSIZCE eskir — sayi eskiyince goze carpar, yargi carpmaz.
   3 GUN esigi: taze notlar etiketlenmez (gurultu olmasin).
   Etiket her basimda TEKILLENIR — not UC AYRI yerde boyaniyor (hizliGeriYukle,
   notlariGeriYukle x2) ve ustuste eklenmemeli. */
function notYasEtiketi(nt, kayit){
  try{
    if(!nt||!kayit||!kayit.ts) return;
    const eski=nt.querySelector('.ebu-yas'); if(eski) eski.remove();
    const saat=(Date.now()-kayit.ts)/3600000;
    if(saat<72) return;
    const gun=Math.floor(saat/24);
    const sp=document.createElement('span');
    sp.className='ebu-yas thin';
    sp.style.cssText='font-size:9px;opacity:.75;margin-left:6px;white-space:nowrap';
    sp.textContent='· '+gun+'g önce yazıldı';
    const H=window.AJAN_SUNUCU_HATA;
    if(H && !(typeof H==='object' && H.g)){ sp.style.color='var(--down)'; sp.textContent+=' ⚠'; }   /* §254b yalnız KALICI hatada */
    nt.appendChild(sp);
  }catch(e){}
}
function notKaydet(kayitli){
  try{ localStorage.setItem('ajan_notlar', JSON.stringify(kayitli)); }catch(e){}
  try{ fetch('/api/ajanktp?mod=yaz',{ method:'POST', headers:{'content-type':'application/json'},
    body: JSON.stringify({ blob: kayitli }) })
    .then(r=>r.json()).then(d=>{
      if(d&&d.ok){ if(!window.EBU_BULUT_OK){ window.EBU_BULUT_OK=1; kayit('☁ hafıza buluta yazıldı — cihazlar senkron'); } }
      else kayit('☁ bulut yazım sorunu: '+((d&&d.err)||'?'));
    }).catch(()=>{}); }catch(e){}
}
async function bulutOku(){
  try{
    const r=await fetch('/api/ajanktp?mod=oku');
    const d=r.ok?await r.json():null;
    return (d&&d.ok&&d.blob)?d.blob:null;
  }catch(e){ return null; }
}


/* Açılışta senkron hızlı basım — eski (fabrika) notlar hiç görünmesin */
function hizliGeriYukle(){
  try{
    const k=JSON.parse(localStorage.getItem('ajan_notlar')||'{}');
    let n=0;
    kartKesfet(false).forEach(K=>{ if(k[K.ad]&&k[K.ad].html){ K.nt.innerHTML=k[K.ad].html; K.nt.dataset.ebu='1'; notYasEtiketi(K.nt,k[K.ad]); n++; } });
    try{ notCiftTemizle(); }catch(e){}   /* §274b */
    const ym=$('yorumMetin');
    /* §423d EN YENİ KAYIT KAZANIR: haftalık ve aylık AYRI anahtarlarda tutulur;
       geri yüklemede hangisi daha yeniyse o basılır (ikisi de ⌫ ile korunur). */
    const HK=k.__HAFTALIK__, AK=k.__AYLIK__;
    const secili = (AK&&HK) ? ((AK.ts||0)>(HK.ts||0)?AK:HK) : (AK||HK);
    if(ym&&secili&&secili.html){ ym.innerHTML=secili.html;
      if(secili.etiket&&$('yorumHafta')) $('yorumHafta').textContent=secili.etiket;   /* §422c */
      n++; }
    if(k.__GUNDEM__&&k.__GUNDEM__.html&&$('ajanNot')){
      $('ajanNot').innerHTML='<div style="font-size:12px;line-height:1.6">'+k.__GUNDEM__.html.replace(/</g,'&lt;').replace(/\n/g,'<br>')+'</div>'+
        '<div class="sub" style="font-size:9px;margin-top:4px">🤖Ebu · son üretim</div>';
    }
    return n;
  }catch(e){ return 0; }
}

async function notlariGeriYukle(){
  try{
    let k=JSON.parse(localStorage.getItem('ajan_notlar')||'{}');
    const bulut=await bulutOku();
    if(bulut&&Object.keys(bulut).length>=Object.keys(k).length){
      k=bulut;
      try{ localStorage.setItem('ajan_notlar', JSON.stringify(k)); }catch(e){}
      kayit('Hafıza buluttan yüklendi ☁ ('+Object.keys(k).length+' kayıt — tüm cihazlar senkron)');
    }
    // Sabah cron'unun gündem notu varsa bas
    if(k.__GUNDEM__&&k.__GUNDEM__.html&&$('ajanNot')){
      $('ajanNot').innerHTML='<div style="font-size:12px;line-height:1.6">'+k.__GUNDEM__.html.replace(/</g,'&lt;').replace(/\n/g,'<br>')+'</div>'+
        '<div class="sub" style="font-size:9px;margin-top:4px">🤖 '+(k.__GUNDEM__.kaynak==='cron'?'sabah cron\u0027u — sen uyurken yazıldı':'Claude Haiku')+' · yükleme: '+saat()+'</div>';
    }
    let n=0;
    kartKesfet(false).forEach(K=>{ if(k[K.ad]&&k[K.ad].html){ K.nt.innerHTML=k[K.ad].html; K.nt.dataset.ebu='1'; notYasEtiketi(K.nt,k[K.ad]); n++; } });
    try{ notCiftTemizle(); }catch(e){}   /* §274b */
    const ym=$('yorumMetin');
    /* §423d EN YENİ KAYIT KAZANIR: haftalık ve aylık AYRI anahtarlarda tutulur;
       geri yüklemede hangisi daha yeniyse o basılır (ikisi de ⌫ ile korunur). */
    const HK=k.__HAFTALIK__, AK=k.__AYLIK__;
    const secili = (AK&&HK) ? ((AK.ts||0)>(HK.ts||0)?AK:HK) : (AK||HK);
    if(ym&&secili&&secili.html){ ym.innerHTML=secili.html;
      if(secili.etiket&&$('yorumHafta')) $('yorumHafta').textContent=secili.etiket;   /* §422c */
      n++; }
    const bugun=bugunStr();
    Object.keys(k).forEach(anah=>{
      if(!anah.startsWith('__GUN2_')) return;
      const kayd=k[anah];
      // ÇELİK FİLTRE: bugünün kaydı + gerçek bir tablo html'i şart — aksi ASLA basılmaz
      if(!kayd||kayd.gun!==bugun||kayd.bos) return;
      if(typeof kayd.html!=='string'||!/^<table/i.test(kayd.html.trim())||(kayd.html.match(/<tr/gi)||[]).length<2){
        return;   // bozuk/eksik kayıt — statik tablo korunur
      }
      GUNLUK_BOLUMLER.forEach(b=>{
        bolumTablolari(b).forEach(T=>{
          const beklenen='__GUN2_'+b.replace(/\s/g,'')+'_'+T.ad.replace(/\s/g,'').slice(0,16)+'__';
          if(beklenen===anah){ T.table.outerHTML=kayd.html; n++; }
        });
      });
    });
    OZEL_GOREVLER.forEach(G=>{
      const kayd=k['__GOREV_'+G.ad+'__'];
      if(!kayd||!kayd.html) return;
      const hk=kartByLbl(G.hedefLbl); const nt=hk?hk.querySelector('.note'):null;
      if(nt){ nt.innerHTML=kayd.html; n++; }
    });
    if(n) kayit(n+' not geri yüklendi — Ebu hatırlıyor');
  }catch(e){}
}

/* §254 HATA -> OKUNABILIR TURKCE. Kullanici "credit_balance_too_low" degil
   "API bakiyesi tukendi" gormeli; eylem de belli olmali. */
function ajanHataOzet(tip, mesaj, durum){
  /* §254b ÇİFTLENMİŞ METİN TEKİLLENİR. Sunucu iki deneme yapıp hataları
     " · " ile birleştiriyor; aynı cümle iki kez görünüyordu. */
  const tek = (x) => {
    const p = String(x||'').split(' · ').map(z=>z.trim()).filter(Boolean);
    return [...new Set(p)].join(' · ');
  };
  const t=tek(tip).toLowerCase(), m=tek(mesaj).toLowerCase();
  /* KALICI — insan müdahalesi gerekir */
  if(t.includes('credit')||m.includes('credit balance')) return {m:'API bakiyesi tükendi — Plans & Billing', g:false};
  if(t.includes('authentication')||durum===401)          return {m:'API anahtarı geçersiz', g:false};
  if(t.includes('permission')||durum===403)              return {m:'API anahtarı bu modele yetkisiz', g:false};
  if(t.includes('not_found')||durum===404)               return {m:'model adı bulunamadı: '+(window.AJAN&&AJAN.MODEL||'?'), g:false};
  /* GEÇİCİ — kendiliğinden düzelir, "duraklatıldı" DEMEK YANILTIR.
     §254b: 10 Ağu'da kota geldi, Ebu 41 not yazdı, ama bir turda zaman aşımı
     oldu ve şerit "duraklatıldı" dedi — oysa motor ÇALIŞIYORDU. Geçici hata
     kalıcı gibi gösterilirse kullanıcı gereksiz müdahale eder. */
  if(t.includes('rate_limit')||durum===429)              return {m:'hız sınırı — sonraki tur', g:true};
  if(t.includes('overloaded')||durum===529)              return {m:'servis yoğun — sonraki tur', g:true};
  if(t.includes('timeout')||t.includes('abort')||m.includes('timeout')||m.includes('abort'))
                                                         return {m:'zaman aşımı — sonraki tur', g:true};
  return {m:(tek(tip)||'bilinmeyen hata')+(mesaj?' · '+tek(mesaj).slice(0,70):''), g:true};
}
/* §254 DURUM SERIDI — hata GUNLUKTE vardi ama KARTTA yoktu.
   11 gun boyunca kota bitikti, gunluk her turda soyluyordu, panelde HICBIR
   isaret yoktu. Rotasyon kartini okuyan biri kendinden emin bir yorum
   goruyor; notun 11 gunluk oldugunu ve motorun durdugunu bilmiyordu.
   Tespit edildigi yer ile gosterildigi yer AYRIYDI. */
function ajanDurumSeridi(){
  try{
    const el=$('ajanDurum'); if(!el) return;
    const h=window.AJAN_SUNUCU_HATA;
    let eski=el.querySelector('.ebu-uyari'); if(eski) eski.remove();
    if(!h) return;
    let k={}; try{ k=JSON.parse(localStorage.getItem('ajan_notlar')||'{}'); }catch(e){}
    const tsler=Object.values(k).map(v=>v&&v.ts).filter(Boolean);
    const enYeni=tsler.length?Math.max(...tsler):0;
    const gun=enYeni?Math.floor((Date.now()-enYeni)/86400000):null;
    /* §254b GEÇİCİ / KALICI AYRIMI. h artık {m,g} — g:true ise motor çalışmaya
       devam ediyor, "duraklatıldı" demek yanıltır. */
    const mesaj = (h && typeof h === 'object') ? h.m : String(h);
    const gecici = !!(h && typeof h === 'object' && h.g);
    const d=document.createElement('div');
    d.className='ebu-uyari';
    d.style.cssText='margin-top:4px;font-size:10px;line-height:1.5;color:'+(gecici?'var(--muted)':'var(--down)');
    d.innerHTML=(gecici?'ℹ son tur atlandı — ':'⚠ Ebu duraklatıldı — ')+String(mesaj).slice(0,70)+
      (!gecici&&gun!=null?('<br><span class="thin">notlar '+(gun===0?'bugün yazıldı':gun+' gündür güncellenmiyor')+'</span>'):'');
    el.appendChild(d);
  }catch(e){}
}
async function aiCagir(prompt, maxTok){
  /* §424 SUNUCU ZAMAN AŞIMI ÖLÇÜLDÜ (27 Agu): /api/market?mod=ai proxy'si
     ~25 sn'de "The operation was aborted due to timeout" döndürüyor.
     ÖLÇÜM: 1400 tok → 5,8 sn ✓ · 2300 tok → 25 sn ✗ (zaman aşımı).
     Haftalık yorum 2300 token istiyordu → HER SEFERİNDE düşüyordu ve
     hata SESSİZDİ: kullanıcı "buton çalışmıyor" görüyordu, sebebi değil.
     Artık istemci tarafında da 30 sn sınır var ve hata KONUŞUYOR. */
  const ZAMAN_ASIMI=30000;
  try{
    const kesici=new AbortController();
    const zt=setTimeout(()=>kesici.abort(), ZAMAN_ASIMI);
    const sr=await fetch('/api/market?mod=ai',{ method:'POST',
      headers:{'content-type':'application/json'},
      body:JSON.stringify({prompt, max_tokens:maxTok||500}), signal:kesici.signal });
    clearTimeout(zt);
    const sd=sr.ok?await sr.json():null;
    if(sd&&sd.ok===false&&/timeout|aborted/i.test(String(sd.err||''))){
      kayit('AI zaman aşımı — istek çok uzun (max_tokens '+(maxTok||500)+'). Küçült.');
      window.AJAN_SON_STOP='timeout'; return null; }
    if(sd&&sd.ok&&sd.metin){ window.AJAN_SON_STOP=sd.stop||''; return sd.metin; }
    if(sd&&sd.err&&sd.err!=='sunucu-anahtari-yok'){ window.AJAN_SUNUCU_HATA=ajanHataOzet(sd.err,sd.err,0); kayit('Sunucu AI: '+sd.err); ajanDurumSeridi(); }   /* §254 */
  }catch(e){}
  const key=localStorage.getItem('ajan_api_key')||'';
  if(!key) return null;
  try{
    const r=await fetch('https://api.anthropic.com/v1/messages',{ method:'POST',
      headers:{ 'x-api-key':key, 'anthropic-version':'2023-06-01',
        'anthropic-dangerous-direct-browser-access':'true', 'content-type':'application/json' },
      body:JSON.stringify({ model:AJAN.MODEL, max_tokens:maxTok||500,
        messages:[{role:'user',content:prompt}] }) });
    const d=await r.json();
    window.AJAN_SON_STOP=d.stop_reason||'';
    /* §254 HATA SINIFLANDIRMASI. Onceden yalnizca `content` var mi diye
       bakiliyordu; r.ok HIC KONTROL EDILMIYORDU. Anthropic hata durumunda
       200 DEGIL 4xx doner ve govdede {type:'error',error:{type,message}}
       gelir — `content` olmadigi icin null donuyordu ve NEDEN null oldugu
       KAYBOLUYORDU. Cagiran taraf yalnizca "AI erisilemedi" yaziyordu:
       kota mi, anahtar mi, ag mi, model adi mi — ayirt edilemiyordu.
       NOT: SUNUCU yolu (satir 753) hatayi ZATEN dogru yakaliyor ve gunluge
       yaziyor. Bu duzeltme TARAYICI-DOGRUDAN yedegi icin. */
    if(!r.ok || (d && d.type==='error')){
      const et=(d&&d.error&&d.error.type)||('HTTP_'+r.status);
      const em=(d&&d.error&&d.error.message)||'';
      window.AJAN_SUNUCU_HATA = ajanHataOzet(et, em, r.status);
      return null;
    }
    return (d&&d.content&&d.content[0]&&d.content[0].text)?d.content[0].text:null;
  }catch(e){
    window.AJAN_SUNUCU_HATA = 'ağ hatası: '+String(e&&e.message||e).slice(0,60);
    return null;
  }
}

async function notMotoru(){
  if(AJAN.notKilit) return;               // aynı anda iki parti çalışmasın
  AJAN.notKilit=true;
  try{ await _notMotoru(); } finally{ AJAN.notKilit=false; }
}
async function _notMotoru(){
  let kayitli={}; try{ kayitli=JSON.parse(localStorage.getItem('ajan_notlar')||'{}'); }catch(e){}
  const simdi=Date.now();
  const hepsi=kartKesfet();
  let sogumada=0;
  const kirli=hepsi.filter(K=>{
    const hh=h32(K.veri); K.hash=hh;
    const eski=kayitli[K.ad];
    if(eski&&eski.hash===hh) return false;                       // veri değişmedi
    // Kesinti sırasında yazılmış notlar soğumayı BEKLEMEZ — veri dönünce hemen düzeltilir
    const kesintiNotu = eski && eski.html && /kesinti|alınamadı|mevcut değildir|erişilemedi/i.test(eski.html);
    /* §169 SOĞUMA DELMESİ — "olay kartları" beklemez.
       Soğuma, canlı FİYAT kartlarının gürültüyle her tur yazılmasını önlemek
       için var. Ama bazı kartların verisi yalnız GERÇEK BİR OLAY olunca değişir
       (yeni bilanço açıklandı, yeni ihraç geldi). Orada değişim gürültü değil
       HABERDİR ve beklemek zarar verir: 29 Tem'de bilanço takvimi canlıya
       geçti, üç şirket "BUGÜN" rozetiyle listeye düştü, ama Ebu'nun notu
       soğumada olduğu için hâlâ "bu hafta bilanço sakin" diyordu — tablo ile
       not YAN YANA ÇELİŞTİ (§111'in tekrarı).
       data-ebu-oncelik="yuksek" taşıyan kartlar soğumayı BEKLEMEZ. */
    const oncelikli = K.nt && K.nt.closest && K.nt.closest('[data-ebu-oncelik="yuksek"]');
    if(eski&&eski.ts&&(simdi-eski.ts)<SOGUMA_MS&&!kesintiNotu&&!oncelikli){ sogumada++; return false; }
    return true;
  });
  if(!kirli.length){
    kayit('Not motoru: '+hepsi.length+' kart tarandı — '+(sogumada?sogumada+' değişim soğumada (6h), ':'')+'yazım gerekmedi ✓');
    return;
  }
  const parti=kirli.slice(0, PARTI);
  kayit('Not motoru: '+kirli.length+' değişim ('+hepsi.length+' tarandı) → yazılıyor: '+parti.map(x=>x.ad.slice(0,22)).join(' / '));
  const prompt='Sen KTPanel adlı katılım-finans portföy panelinin not editörüsün. Aşağıda kartlar var; her birinde '+
    'GÜNCEL VERİ (kartın şu anki canlı değerleri) ve MEVCUT NOT (eskimiş olabilir) veriliyor. Görevin: her kartın notunu '+
    'GÜNCEL VERİYE göre yeniden yazmak. Kurallar: mevcut notun uzunluğunu, eğitici fon-yöneticisi tonunu ve yapısını koru; '+
    'kavramsal/öğretici açıklamaları aynen tut, yalnız rakam/durum/yorum kısımlarını güncel veriye uyarla; rakamları SADECE '+
    'güncel veriden al, asla uydurma; tarih/olay referansı eskimişse çıkar ya da güncelle; her yeni not MEVCUT NOTTAN UZUN OLMASIN; <b> ve <em> kullanabilirsin; '+
    'Türkçe. \n'+
    '⚠ [CANLI] İŞARETLİ KARTLARDA RAKAM YAZMA (§111): o kartın sayıları dakikada bir değişir, senin notun ise saatlerce '+
    'durur — tabloda %-0,49 yazarken notta %-0,34 kalması paneli kendisiyle çelişkiye düşürür ve okuyucuyu yanıltır. '+
    'Bu kartlarda YÖN (yükseliş/gerileme/yatay), KOMPOZİSYON (hangi kalem hangi yönde ayrışıyor) ve NE ANLAMA GELDİĞİNİ yaz; '+
    'rakamı tabloya bırak. Endeks/hisse KODU yazabilirsin, oranını YAZMA. İşaretsiz (damgalı) kartlarda rakam serbesttir. \n'+
    'ÇIKTI BİÇİMİ (JSON DEĞİL): her not için önce ### ve numara, altına notun kendisi. Örnek:\n'+
    '###1\n(1 numaralı kartın yeni notu)\n###2\n(2 numaralı kartın yeni notu)\n'+
    'Başka hiçbir açıklama yazma.\n\n'+
    parti.map((x,i)=>{
      /* §245n ADRESLİ UYARI. Genel kural istemde zaten vardı ama model bazı
         kartlarda ısrarla rakam yazıyordu; ret sessiz kalınca aynı kart tur
         tur reddedilip notu hiç güncellenmiyordu. Kaçıncı kez reddedildiğini
         karta İLİŞTİRİYORUZ — ikinci retten sonra dil sertleşiyor. */
      const red=(AJAN.__redSayac&&AJAN.__redSayac[x.ad])||0;
      const redNot = red ? ('\n⛔ BU KARTTA ÖNCEKİ DENEMEN REDDEDİLDİ ('+red+' kez): not RAKAM içeriyordu. '+
        (red>=2 ? 'BU SEFER HİÇ SAYI YAZMA — yüzde işareti, ondalık, oran hiç geçmesin. Yalnız yön ve anlam.'
                : 'Yüzde/oran yazma; yön ve kompozisyon yeter.')) : '';
      return '### '+(i+1)+' ('+x.ad+')'+(x.canli?' [CANLI]':' [damgalı]')+redNot+
        /* SS322b KIRPMA (19 Agu, olculdu): SS322 komsu veri koprusu calisiyordu
           — GORUS notuna 1685 karakterlik paket ulasiyordu — ama prompt onu
           420 KARAKTERE kirpiyordu. Kirpilan kisim tam olarak SS319'un
           otomatik KURESEL MAKRO satirlariydi; Ebu bu yuzden hala Temmuz
           olaylarini yaziyordu. Kopru kurmak yetmiyor, PAKETIN prompta
           VARDIGINI da olcmek gerekiyormus.
           Cozum hedefli: yalnizca [EK VERI] tasiyan kartlar 1500'e kadar
           gonderilir (o kartlar bilerek zenginlestirildi); digerleri 420'de
           kalir — token maliyeti bosuna buyumez. */
        '\nGÜNCEL VERİ: '+x.veri.slice(0, /\[EK VERI\]/.test(x.veri) ? 1500 : 420)+'\nMEVCUT NOT: '+
        notMetni(x.nt).slice(0,650);
    }).join('\n\n');   // imza SOYULMUS (§110)
  const metin=await aiCagir(prompt, Math.min(2400, 200+parti.length*500));
  if(!metin){ kayit('Not motoru: AI erişilemedi ('+(window.AJAN_SUNUCU_HATA||'sebep bilinmiyor')+') — sonraki tura bekletildi'); ajanDurumSeridi(); return; }   /* §254 */
  // Dayanıklı ayrıştırma: (1) çitleri soy, (2) ilk { ile son } arası, (3) olmadıysa regex ile kısmi kurtarma
  let j={};
  // ── Bloklu biçim: ###1 / ###2 ... (HTML içeriğe dayanıklı) ──
  const parcalar=metin.split(/^\s*#{2,4}\s*(\d+)\s*$/m);
  for(let i=1;i<parcalar.length;i+=2){
    const no=parcalar[i], govde=(parcalar[i+1]||'').trim();
    if(no&&govde) j[no]=govde;
  }
  if(!Object.keys(j).length){                      // yedek: eski JSON biçimi
    try{ j=JSON.parse(metin.replace(/^[\s\S]*?(\{)/,'$1').replace(/\}[^}]*$/,'}')); }
    catch(e){
      const rx=/"([^"]{1,50})"\s*:\s*"((?:[^"\\]|\\.)*)"/g; let m;
      while((m=rx.exec(metin))!==null){ j[m[1]]=m[2].replace(/\\"/g,'"'); }
    }
  }
  if(!Object.keys(j).length){
    kayit('Not motoru: yanıt çözülemedi — ilk 60 kr: '+String(metin).slice(0,60).replace(/\n/g,' '));
    return;
  }
  let g=0; const rakamUyari=[], bulunamadi=[];
  parti.forEach((x,i)=>{
    const yeni=j[String(i+1)]!==undefined ? j[String(i+1)] : j[x.ad];
    if(yeni&&typeof yeni==='string'&&yeni.length>40){
      /* §243 KURAL VARDI, YAPTIRIM YOKTU.
         §111 canlı kartta rakam yasağını koydu ve istem bunu AÇIKÇA söylüyor.
         Ama denetim yalnız RAPORLUYORDU: ihlal eden not yine de yayınlanıyor,
         günlüğe uyarı düşüyor, panel kendisiyle çelişmeye devam ediyordu.
         Uyarı her turda tekrarlanınca gürültüye dönüştü — okunmaz oldu.
         ARTIK REDDEDİLİR: eski not korunur, kart bir sonraki turda yeniden denenir.
         NEDEN ESKİ NOT DAHA İYİ: birkaç saat eski bir not tolere edilir; tabloyla
         ÇELİŞEN bir not okuyucuya hangisinin doğru olduğunu sordurur ve panelin
         TAMAMINI şüpheli kılar. Eskilik görünür bir kusur, çelişki gizli bir yalan.
         İSTİSNA: eşik/hedef ifadeleri meşru ("%2 hedefi", "%20 eşiği") — sabittir,
         tabloyla çelişmez. Onlar geçer. */
      const _oranVar = /%\s*[-−+]?\d|[-−+]?\d+[.,]\d+\s*%/.test(yeni);
      /* §245n MUAFİYET KALIBI DAR GELİYORDU. Eski desen sayı ile anahtar
         kelimenin BİTİŞİK olmasını istiyordu (%\s*[\d.,]+\s*(hedef|eşik…)).
         Ölçüldü: "Fed %2 enflasyon hedefine odaklı" REDDEDİLİYORDU — araya
         "enflasyon" girdiği için. Oysa bu tam da meşru kullanım: politika
         hedefi SABİTTİR, tabloyla çelişmez. Model doğru not yazıyor, yaptırım
         yanlış yere vuruyor, kart hiç güncellenmiyordu.
         Artık sayı ile anahtar kelime arasında en fazla 3 kelime olabilir.
         Kapsam da genişledi: hedefi/bandı çağrıştıran kelimeler eklendi. */
      const _esikMi  = /%\s*[\d.,]+(?:\s+\S+){0,3}\s*(hedef\w*|eşi[kğ]\w*|sınır\w*|band\w*|bant\w*|üzeri\w*|altı\w*|üstü\w*|üzerinde|altında|taban\w*|tavan\w*)/i.test(yeni);
      if(x.canli && _oranVar && !_esikMi){
        rakamUyari.push(x.ad);
        /* §245n GERİ BESLEME. Ret tek başına çıkmazı çözmüyordu: model her
           turda aynı kartlara yine rakam yazıyor, yaptırım yine reddediyor,
           o kartların notu HİÇ güncellenmiyordu (kullanıcının gördüğü
           "0/4 not güncellendi" tam buydu — dört tur üst üste aynı dört kart).
           Ret sayısı kartta biriktirilir; istem bir sonraki turda o karta
           ÖZEL uyarı taşır. Kural istemde geneldi, artık ADRESLİ. */
        AJAN.__redSayac = AJAN.__redSayac || {};
        AJAN.__redSayac[x.ad] = (AJAN.__redSayac[x.ad]||0) + 1;
        return;
      }
      if(AJAN.__redSayac) delete AJAN.__redSayac[x.ad];   // temiz yazdı → sayaç sıfırlanır
      x.nt.innerHTML=imzaEkle(temizle(yeni));   // §110: önce eski imza kalıntıları silinir
      x.nt.dataset.ebu='1';
      kayitli[x.ad]={ html:x.nt.innerHTML, hash:x.hash, ts:simdi, saat:saat() };
      g++;
    } else {
      /* §245n: not YOK ya da çok kısa — bu GERÇEK anahtar/biçim sorunudur.
         §111 reddiyle karıştırılmamalı (aşağıdaki uyarı ayrımı buna dayanır). */
      bulunamadi.push(x.ad);
    }
  });
  notKaydet(kayitli);
  /* §245n YANLIŞ TEŞHİS DÜZELTİLDİ. Eski satır: `if(g<parti.length)` —
     g yalnız YAZILAN notu sayar, §111 reddi de g'yi artırmaz. Sonuç: dört not
     reddedildiğinde günlük "⚠ eşleşmeyen yanıt anahtarları: 1,2,3,4" yazıyordu.
     Oysa 1,2,3,4 anahtarları TAM EŞLEŞMİŞTİ; notlar bulundu, rakam yüzünden
     reddedildi. İki farklı arıza tek mesaja binmişti ve mesaj YANLIŞ olanı
     söylüyordu — kullanıcı haklı olarak "neden reddedildi" diye sordu.
     §245h'nin dersi: ayırt etmeyen teşhis, teşhis değildir. */
  if(bulunamadi.length) kayit('⚠ yanıtta karşılığı olmayan kart: '+bulunamadi.slice(0,4).join(' / ')+
    ' — gelen anahtarlar: '+Object.keys(j).slice(0,6).join(','));
  /* §243b GÜNLÜK GÜRÜLTÜSÜ. Aynı uyarı her turda tekrarlanınca okunmaz olur —
     kullanıcı bugün tam bunu sordu. Yalnız ihlal eden kart KÜMESİ DEĞİŞTİYSE yaz. */
  if(rakamUyari.length){
    const imza = rakamUyari.slice().sort().join('|');
    if(imza !== AJAN.__sonRakamIhlal){
      AJAN.__sonRakamIhlal = imza;
      kayit('§111 yaptırım: '+rakamUyari.length+' not REDDEDİLDİ (canlı kartta rakam) — eski not korundu: '+
        rakamUyari.slice(0,4).join(' / '));
    }
  } else if(AJAN.__sonRakamIhlal){
    AJAN.__sonRakamIhlal = null;
    kayit('§111: canlı kartlarda rakam ihlali kalmadı ✓');
  }
  kayit('Not motoru: '+g+'/'+parti.length+' not güncellendi 🤖'+(kirli.length>parti.length?' · '+(kirli.length-parti.length)+' sırada':''));
    try{ notCiftTemizle(); }catch(e){}   /* §274b yeni yazımdan sonra da */
  if(g>0 && kirli.length>parti.length){
    kayit('⚡ hız modu: kuyruk sürüyor — 20 sn sonra sonraki parti');
    setTimeout(notMotoru, 20000);
  }
}

/* ═══ HAFTALIK YORUM GÖREVİ — mk-yorum sayfasını panel verileriyle yazar ═══ */
async function haftalikYorumYaz(zorla, kip){
  /* §423b KİP: 'hafta' (varsayılan) | 'ay'. Aylık kip 4 haftalık pencereyi
     okur, bölüm başlıklarını AY odaklı ister ve etiketi "AĞUSTOS 2026 ·
     AYLIK" yazar. İkisi AYNI kayıt anahtarını kullanmaz: __HAFTALIK__ ve
     __AYLIK__ ayrı — biri diğerini ezmez, ikisi de ⌫ ile geri alınabilir. */
  const AYLIK = (kip==='ay');
  const ym=$('yorumMetin'); if(!ym) return;
  let kayitli={}; try{ kayitli=JSON.parse(localStorage.getItem('ajan_notlar')||'{}'); }catch(e){}
  const ANAH = AYLIK ? '__AYLIK__' : '__HAFTALIK__';
  const son=kayitli[ANAH];
  if(!zorla){
    /* §246b PAZARTESİ TETİĞİ DÜZELTİLDİ. Eski şart: 'son yazımdan 5+ gün
       geçtiyse'. FOMC/olay sonrası hafta İÇİ elle tazeleme yapılınca (Çar/Per)
       Pazartesi'ye 3-4 gün kalıyor → bayat sayılmıyor → YENİ HAFTA YAZILMIYOR.
       3 Ağu sabahı tam bu oldu: kullanıcı Pazartesi paneli açtı, yorum
       '27 Tem-2 Ağu'da kaldı. Doğru ölçü gün sayısı değil HAFTA KİMLİĞİ:
       Pazartesi + son yazım BU haftanın pazartesisinden önceyse → yaz.
       Hafta içi elle tazeleme artık Pazartesi yenilemesini İPTAL EDEMEZ. */
    const pazartesi=(new Date()).getDay()===1;
    const haftaBasi=(t)=>{const d=new Date(t); d.setHours(0,0,0,0); d.setDate(d.getDate()-((d.getDay()+6)%7)); return d.getTime();};
    const yeniHafta=!son||!son.ts||son.ts<haftaBasi(Date.now());
    if(!(pazartesi&&yeniHafta)) return;
  }
  kayit('Haftalık yorum yazılıyor (panel verilerinden)…');
  const ozet=kartKesfet().slice(0,26).map(K=>'• '+K.ad+': '+K.veri.slice(0,150)).join('\n');
  /* §424c CEKIRDEK TANIMI GERI KONDU. §422b'de eklenmisti ama son turda repo
     geri alinirken KAYBOLDU; kullanimi (taktik prompt'u) kaldi → calisma
     zamaninda "cekirdek is not defined" ile REDDEDILEN PROMISE, hata SESSIZ
     kaldi (pano yalnizca "yaziliyor..." gosterdi). Tarayicidan
     unhandledrejection dinleyerek yakalandi.
     DERS: TANIM ILE KULLANIM AYRI YAMALARDA GELIYORSA IKISI DE DOGRULANIR —
     "sozdizimi temiz" tanimin VAR oldugunu gostermez. */
  const cekEl=(id)=>{ const e=$(id); return e?(e.textContent||'').replace(/\s+/g,' ').trim():null; };
  const cekirdek=[
    ['Politika faizi / AOFM', cekEl('aofmLive')],
    ['TLREF (politika faizine makas)', cekEl('tlrefLive')],
    ['Gosterge tahvil 2Y', cekEl('gosterge2y')],
    ['ABD 10Y', cekEl('us10y')], ['ABD 30Y (egim)', cekEl('us30y')],
    ['TR 5Y CDS', cekEl('glbCds')], ['VIX', cekEl('vixV')],
    ['DXY', cekEl('dxyV')], ['Brent', cekEl('brentV')]
  ].filter(x=>x[1]&&x[1].length>1).map(x=>'• '+x[0]+': '+x[1]).join('\n');
  const mevcut=(ym.textContent||'').replace(/\s+/g,' ').trim().slice(0,2200);
  const prompt='Sen KTPanel\u0027in baş stratejistisin. Görevin: paneldeki CANLI verilerden haftalık portföy-yönetimi yorumu yazmak. '+
    'Aşağıda (A) panelin şu anki canlı kart özetleri, (B) örnek yapı olarak mevcut haftalık yorum var. '+
    'Yeni yorumu yaz: 5-7 numaralı bölüm (0\u0027dan başlayan başlıklar), her bölüm <div style="background:#F0F7F4;border-left:3px solid #177245;border-radius:0 6px 6px 0;padding:11px 13px;margin:0 0 14px"><b style="color:#177245;font-size:12px">N · BAŞLIK</b><br>metin</div> kalıbında; '+
    'her bölümün sonunda <b>Portföy çevirisi:</b> cümlesi; rakamları SADECE canlı verilerden al, uydurma; multi-asset fon yöneticisi tonu; Türkçe; toplam 350-500 kelime — SON BÖLÜMÜ MUTLAKA TAMAMLA. YALNIZCA HTML döndür, başka hiçbir şey yazma.\n\n(A) ÇEKİRDEK GÖSTERGELER — haftanın omurgası; TEK TEK SAYMA, aralarındaki BAĞI kur:\n'+cekirdek+'\n\n(A2) PANEL KART ÖZETLERİ:\n'+ozet+'\n\n(B) MEVCUT YORUM (yapı örneği):\n'+mevcut;
  /* §424b İKİ PARÇALI ÜRETİM. Tek çağrıda 5 bölüm × 400 kelime = 2300 token
     isteniyordu ve sunucu 25 sn'de kesiyordu. Artık bölüm 1-3 ve 4-5 AYRI
     çağrılarla üretilip birleştiriliyor: her biri ~1300 token / ~6 sn.
     Toplam süre benzer, ama HİÇBİRİ zaman aşımına girmiyor.
     İkinci parça düşerse birinci yine basılır — yarım ama TAZE, ve bunu
     rapor eder (sessiz yarım kalma yok). */
  const kelimeAyar=(s,hedef)=>s.replace('toplam 350-500 kelime','toplam '+hedef+' kelime');
  const p1=kelimeAyar(prompt,'220-280').replace('YALNIZCA HTML döndür','YALNIZCA 1., 2. ve 3. BÖLÜMLERİ yaz, HTML döndür');
  const m1=await aiCagir(p1, 1400);
  if(!m1){ kayit('Haftalık yorum: AI erişilemedi (1. parça)'); return; }
  const p2=kelimeAyar(prompt,'160-220').replace('YALNIZCA HTML döndür','YALNIZCA 4. ve 5. BÖLÜMLERİ yaz, HTML döndür')
                 +'\n\n(ZATEN YAZILAN 1-3. BÖLÜMLER — TEKRARLAMA):\n'+m1.slice(0,1200);
  const m2=await aiCagir(p2, 1300);
  if(!m2) kayit('Haftalık yorum: 2. parça alınamadı — 1-3. bölümler basıldı');
  const metin=m1+(m2||'');
  if(window.AJAN_SON_STOP==='max_tokens'){ kayit('Haftalık yorum: yanıt kesildi — basılmadı'); return; }
  const html=metin.replace(/^\s*```html?/i,'').replace(/```\s*$/,'').trim();
  if(html.length<300){ kayit('Haftalık yorum: yanıt kısa, uygulanmadı'); return; }
  ym.innerHTML=temizle(html,true)+'<div class="sub" style="font-size:9px;margin-top:6px">🤖 ajan tarafından panel verilerinden yazıldı · '+saat()+' · ⌫ ile fabrika yorumuna dönülür</div>';
  /* §422c ETİKET DE YAZILIR. §397'nin dersi: "etiket statik kaldığı için yeni,
     gövde eski görünüyordu" — o çelişki teşhisi kolaylaştırmıştı ama kalıcı
     hâli yanıltıcıdır. Artık hafta aralığı KODDAN hesaplanıyor (Pzt-Paz) ve
     gövdeyle BİRLİKTE yenileniyor; ikisi ayrışamaz. Başlık, yorumun 1. bölüm
     başlığından türetilir — yani etiket gövdenin ÖZETİ olur, bağımsız değil. */
  const AY422=['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
  const bug422=new Date(), pzt422=new Date(bug422);
  pzt422.setDate(bug422.getDate()-((bug422.getDay()+6)%7));
  const paz422=new Date(pzt422); paz422.setDate(pzt422.getDate()+6);
  const ayniAy=pzt422.getMonth()===paz422.getMonth();
  const arali=pzt422.getDate()+(ayniAy?'':' '+AY422[pzt422.getMonth()])+'–'+paz422.getDate()+' '+AY422[paz422.getMonth()].toUpperCase();
  const AYADI=['OCAK','ŞUBAT','MART','NİSAN','MAYIS','HAZİRAN','TEMMUZ','AĞUSTOS','EYLÜL','EKİM','KASIM','ARALIK'];
  const bandi = AYLIK ? (AYADI[bug422.getMonth()]+' '+bug422.getFullYear()+' · AYLIK') : arali;
  const yh=$('yorumHafta');
  if(yh){ const bas=(html.match(/<b[^>]*>\s*1\s*·\s*([^<]{4,60})/i)||[])[1];
    yh.textContent=bandi+(bas?' · '+bas.trim().toUpperCase().slice(0,34):''); }
  kayitli[ANAH]={ html:ym.innerHTML, etiket:(yh?yh.textContent:''), kip:(AYLIK?'ay':'hafta'), ts:Date.now(), saat:saat() };

  /* ══ §423c TAKTİK DURUŞ TÜRETİMİ ══ Yorum yazıldıktan SONRA, AYNI verilerle
     dört varlık sınıfının duruşu istenir. Ayrı çağrı çünkü: (1) çıktı JSON
     olmalı (kart yapısal), (2) yorum uzun — tek çağrıda ikisi de istenirse
     biri kısalır, (3) taktik başarısız olsa bile yorum DURUR.
     ÇIKTI SÖZLEŞMESİ: {poz1..poz4:{durus,teze,dayanak[],risk[],tetik}}
     Panel bunu fabrika dizisinin ÜSTÜNE bindirir (§423). */
  try{
    const tp='Sen bir çok varlıklı fon yöneticisisin. Aşağıdaki haftalık/aylık sentez ve canlı '+
      'göstergelerden hareketle DÖRT varlık sınıfının TAKTİKSEL DURUŞUNU belirle.\n\n'+
      'SENTEZ:\n'+(ym.textContent||'').slice(0,2600)+'\n\nÇEKİRDEK GÖSTERGELER:\n'+cekirdek+'\n\n'+
      'SINIFLAR: poz1=Yerli Hisse (BIST, vs XKTUM/XK100) · poz2=Yabancı Hisse (vs S&P500/MSCI) · '+
      'poz3=Altın · poz4=TL/Sabit Getirili\n\n'+
      'KURALLAR: durus yalnız şunlardan biri: "AŞIRI ÜSTÜ","ÜSTÜ","NÖTR","ALTI","AŞIRI ALTI". '+
      'teze 2-4 cümle, DEĞİŞTİYSE "X→Y" diye başla ve SEBEBİNİ yaz. dayanak ve risk 3-4 madde, '+
      'her madde SOMUT (rakam/kart adı içersin), 90 karakteri geçme. tetik: duruşu değiştirecek '+
      'GÖZLENEBİLİR olay, tek cümle. Kanıtın yoksa duruşu DEĞİŞTİRME — süreklilik değerlidir.\n'+
      'YALNIZCA JSON döndür, başka hiçbir şey yazma:\n'+
      '{"poz1":{"durus":"","teze":"","dayanak":[],"risk":[],"tetik":""},"poz2":{...},"poz3":{...},"poz4":{...}}';
    const tm=await aiCagir(tp, 1200);   /* §424: 25 sn sınırı — 1600 riskli */
    if(tm){
      const jm=tm.match(/\{[\s\S]*\}/);
      if(jm){
        const v=JSON.parse(jm[0]);
        const gecerli=['AŞIRI ÜSTÜ','ÜSTÜ','NÖTR','ALTI','AŞIRI ALTI'];
        let n=0;
        Object.keys(v).forEach(k=>{ const o=v[k];
          if(!o||!gecerli.includes(String(o.durus||'').trim())){ delete v[k]; return; }  /* sözlük dışı duruş ATILIR */
          o.durus=String(o.durus).trim(); n++; });
        if(n){
          localStorage.setItem('ajan_taktik', JSON.stringify({v, etiket:(yh?yh.textContent:bandi), ts:Date.now()}));
          if(typeof taktikRender==='function') taktikRender();
          kayit('Taktiksel duruş güncellendi ('+n+'/4 sınıf · 🤖 ajan)');
        } else kayit('Taktik: geçerli duruş dönmedi — fabrika duruşu korundu');
      }
    }
  }catch(e){ kayit('Taktik türetimi atlandı: '+String(e.message||e).slice(0,50)); }
  notKaydet(kayitli);
  kayit('Haftalık yorum panel verilerinden yeniden yazıldı 🤖');
}


/* ═══ ÖZEL GÖREVLER — komşu-veriye dayalı yorum bölümleri (Takvim→Görüş vb.) ═══
   Yapı: veri başka kartta, yorum başka kartta. Veri kartının metni değişince
   (olay işlenince / pencere kayınca) hedef yorum yeniden yazılır. Yeni çift
   eklemek = OZEL_GOREVLER dizisine bir satır. */
const OZEL_GOREVLER=[
  { ad:'TakvimGorus', veriLbl:'TAKVİM', hedefLbl:'GÖRÜŞ',
    tarif:'Kritik olay takvimine istinaden GÖRÜŞ yaz. AGIRLIK YAKLASAN OLAYLARDA: '+
      'once onumuzdeki 72 saatin olaylarini (tarih+saat vererek) ve portfoy anlamini yaz, '+
      'sonra haftanin geri kalanini; gecmis olaylara EN FAZLA bir paragraf ayir ve yalniz '+
      'yaklasan olaylarla baglantisi varsa deginin. Takvimde saat bilgisi olan satirlar '+
      'kuresel veri akisidir (ForexFactory) — bunlari mutlaka degerlendir.' }
];
function kartByLbl(prefix){
  let bulunan=null;
  document.querySelectorAll('.card').forEach(k=>{
    if(bulunan) return;
    const l=k.querySelector('.lbl');
    if(l&&lblAdi(l).toUpperCase().startsWith(prefix)) bulunan=k;
  });
  return bulunan;
}
async function ozelGorevler(){
  let kayitli={}; try{ kayitli=JSON.parse(localStorage.getItem('ajan_notlar')||'{}'); }catch(e){}
  const simdi=Date.now();
  for(const G of OZEL_GOREVLER){
    const vk=kartByLbl(G.veriLbl), hk=kartByLbl(G.hedefLbl);
    if(!vk||!hk) continue;
    const nt=hk.querySelector('.note'); if(!nt) continue;
    const veri=(vk.textContent||'').replace(/\s+/g,' ').trim();
    if(veri.length<40) continue;
    const hh=h32(veri), anah='__GOREV_'+G.ad+'__';
    const eski=kayitli[anah];
    if(eski&&eski.hash===hh) continue;                               // veri değişmedi
    /* SS337 SOGUMA AYRIMI: genel notlar icin 6 saat dogru (kart verileri gun
       icinde az degisir) ama TAKVIM yorumu icin fazla katiydi — kullanici
       takvimi birlestirdikten sonra yorum saatlerce eski olaylarda kaldi.
       Ozel gorevlerde veri hash'i DEGISMISSE 90 dk yeter: takvim degistiyse
       yorum bayattir; degismediyse zaten yukaridaki satir zaten geciyor. */
    if(eski&&eski.ts&&(simdi-eski.ts)<90*60*1000) continue;          // soğumada (SS337: 90 dk)
    kayit('Özel görev '+G.ad+': kaynak veri değişti → yorum yazılıyor…');
    const baglam=kartKesfet().slice(0,10).map(K=>'• '+K.ad+': '+K.veri.slice(0,120)).join('\n');
    const mevcut=notMetni(nt).slice(0,1800);   // imza SOYULMUS (§110)
    const prompt='Sen KTPanel\u0027in baş stratejistisin. Görev: '+G.tarif+'\n'+
      'Kurallar: 4-6 paragraf; her paragraf <b style="color:#0E5A3A">Kısa Başlık:</b> ile başlasın, paragraflar <br><br> ile ayrılsın; '+
      'rakam ve olayları SADECE aşağıdaki içerikten al, uydurma; son paragraf pencerenin kritik günleri + risk yönetimi cümlesi olsun; '+
      /* SS337b KELIME SINIRI (kullanici: "yine kelime siniri var mi"): 180-280
       kelime, SS321'de takvimle esit yukseklige getirilen kartin ancak yarisini
       dolduruyordu. Takvim birlesince (SS336) kaynak da zenginlesti — yorum
       artik 5-7 paragrafa yayilabilir. Ust sinir yine VAR: sinirsiz metin
       token maliyetini ve okunabilirligi bozar; SON PARAGRAFI TAMAMLA kurali
       aynen korunur (yarim cumle en kotu ciktidir). */
      'multi-asset fon yöneticisi tonu; Türkçe; UZUNLUK: toplam 380-520 kelime, 5-7 paragraf — SON PARAGRAFI MUTLAKA TAMAMLA, yarım cümle bırakma; mevcut metnin uslubunu koru; YALNIZCA HTML döndür.\n\n'+
      /* SS337: birlesik takvim (SS336) ile kaynak metin ~1700 karakteri asti;
       1600'lik kirpma tam olarak YAKLASAN satirlari kesiyordu (once elle
       gecmis olaylar geldigi icin). 2600'e cikarildi. */
      '(A) KAYNAK VERİ ('+G.veriLbl+'):\n'+veri.slice(0,2600)+'\n\n(B) PANEL CANLI ÖZETLERİ:\n'+baglam+'\n\n(C) MEVCUT METİN (üslup örneği):\n'+mevcut;
    const metin=await aiCagir(prompt, 3000);   /* SS337b: 520 kelimelik HTML icin tavan yukseltildi */
    if(!metin){ kayit('Özel görev '+G.ad+': AI erişilemedi'); continue; }
    if(window.AJAN_SON_STOP==='max_tokens'){ kayit('Özel görev '+G.ad+': yanıt kesildi — basılmadı, sonraki turda kısaltılmış denenir'); continue; }
    const html=metin.replace(/^\s*```html?/i,'').replace(/```\s*$/,'').trim();
    if(html.length<200){ kayit('Özel görev '+G.ad+': yanıt kısa, uygulanmadı'); continue; }
    nt.innerHTML=imzaEkle(temizle(html,true));   // §110
    nt.dataset.ebu='1';
    kayitli[anah]={ html:nt.innerHTML, hash:hh, ts:simdi, saat:saat() };
    notKaydet(kayitli);
    kayit('Özel görev '+G.ad+': yorum güncellendi 🤖');
  }
}


/* ═══ GÜNLÜK BAKIM — takvim tablolarını günde 1 kez zaman-durum açısından günceller ═══
   Dar ve güvenli: yeni satır/tarih/şirket EKLEYEMEZ-DEĞİŞTİREMEZ; yalnız geçmiş
   satırları "AÇIKLANDI/✓" işler, göreli zaman ifadelerini ("bu gece") temizler.
   Satır sayısı doğrulaması: dönen tablo tr sayısı tutmazsa BASILMAZ. */
const GUNLUK_BOLUMLER=['07 K','08 B'];   // Kritik Takvim + Bilanço Takvimi

function bolumTablolari(prefix){
  const sonuc=[]; let aktif=false;
  document.querySelectorAll('h2, .card').forEach(el=>{
    if(el.tagName==='H2'){
      const t=(el.textContent||'').replace(/\s+/g,' ').trim();
      aktif=t.toUpperCase().startsWith(prefix.toUpperCase());
      return;
    }
    if(!aktif) return;
    const tb=el.querySelector('table');
    const lblEl=el.querySelector('.lbl');
    if(tb) sonuc.push({ kart:el, table:tb, ad:(lblEl?lblAdi(lblEl):prefix) });
  });
  return sonuc;
}
function bugunStr(){ const d=new Date();
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }

async function gunlukBakim(){
  let kayitli={}; try{ kayitli=JSON.parse(localStorage.getItem('ajan_notlar')||'{}'); }catch(e){}
  // Eski (v1) bozuk GUN kayıtlarını temizle — halüsinasyon vakası sonrası sürüm yükseltildi
  let temizlendi=false;
  Object.keys(kayitli).forEach(a=>{ if(a.startsWith('__GUN_')&&!a.startsWith('__GUN2_')){ delete kayitli[a]; temizlendi=true; } });
  if(temizlendi){ notKaydet(kayitli); kayit('Eski günlük-bakım kayıtları temizlendi (v2 geçişi)'); }
  const bugun=bugunStr();
  const AYLAR={OCA:0,ŞUB:1,SUB:1,MAR:2,NİS:3,NIS:3,MAY:4,HAZ:5,TEM:6,AĞU:7,AGU:7,EYL:8,EKİ:9,EKI:9,KAS:10,ARA:11};
  const simdi=new Date(); const buYil=simdi.getFullYear();
  const bugunBas=new Date(buYil, simdi.getMonth(), simdi.getDate());
  function satirGecmisMi(tr){
    const ilk=(tr.querySelector('td')||{}).textContent||'';
    const m=ilk.match(/(\d{1,2})(?:\s*[–\-]\s*(\d{1,2}))?\s*(Oca|Şub|Sub|Mar|Nis|May|Haz|Tem|Ağu|Agu|Eyl|Eki|Kas|Ara)/i);
    if(!m) return false;                                    // tarih çözülemedi → dokunma
    const bitisGun=parseInt(m[2]||m[1],10);
    const ay=AYLAR[m[3].toUpperCase()];
    if(ay==null) return false;
    return new Date(buYil, ay, bitisGun) < bugunBas;        // bitişi bugünden önceyse geçmiş
  }
  for(const bolum of GUNLUK_BOLUMLER){
    const tablolar=bolumTablolari(bolum);
    for(const T of tablolar){
      const anah='__GUN2_'+bolum.replace(/\s/g,'')+'_'+T.ad.replace(/\s/g,'').slice(0,16)+'__';
      const kayd=kayitli[anah];
      if(kayd&&kayd.gun===bugun) continue;
      const satirlar=[...T.table.querySelectorAll('tr')];
      // JS karar verir: geçmiş VE henüz işlenmemiş (✓'siz) satırlar
      const hedefler=[];
      satirlar.forEach((tr,idx)=>{
        if(satirGecmisMi(tr) && !/[✓]/.test(tr.textContent||'')) hedefler.push({idx, html:tr.outerHTML});
      });
      if(!hedefler.length){
        kayitli[anah]={ gun:bugun, bos:true }; notKaydet(kayitli);
        kayit('Günlük bakım '+T.ad+': işlenecek geçmiş satır yok ✓'); continue;
      }
      kayit('Günlük bakım '+T.ad+': '+hedefler.length+' geçmiş satır işleniyor…');
      const prompt='Aşağıdaki tablo satırları GEÇMİŞTE KALMIŞ olaylardır. Her birinde olay adının yanına ✓ ekle ve '+
        'açıklamayı kısa geçmiş-zaman ifadesine çevir (sonuç metinde varsa koru; bilmiyorsan sadece "gerçekleşti" de — '+
        'SONUÇ UYDURMA). Tarih, şirket, olay adı, tr/td yapısı ve class\u0027ları AYNEN kalsın. '+
        'YALNIZCA şu JSON\u0027u döndür: {"IDX":"<tr ...>...</tr>", ...}\n\n'+
        hedefler.map(h=>'### '+h.idx+'\n'+h.html).join('\n\n');
      const metin=await aiCagir(prompt, Math.min(2400, 200+hedefler.length*300));
      if(!metin||window.AJAN_SON_STOP==='max_tokens'){ kayit('Günlük bakım '+T.ad+': AI sorunu, atlandı'); continue; }
      let jj=null;
      try{ jj=JSON.parse(metin.replace(/^[\s\S]*?\{/,'{').replace(/\}[^}]*$/,'}')); }catch(e){ kayit('Günlük bakım '+T.ad+': JSON çözülemedi'); continue; }
      let g=0;
      hedefler.forEach(hd=>{
        const y=jj[String(hd.idx)];
        if(y&&/^<tr[\s>]/i.test(y.trim())&&/<\/tr>$/i.test(y.trim())){
          satirlar[hd.idx].outerHTML=temizle(y.trim(),true); g++;   /* §292 */
        }
      });
      kayitli[anah]={ gun:bugun, html:T.table.outerHTML, saat:saat() };
      notKaydet(kayitli);
      kayit('Günlük bakım '+T.ad+': '+g+'/'+hedefler.length+' geçmiş satır işlendi 🤖 (gelecek satırlar JS korumasında)');
    }
  }
  // Bölüm başlıklarındaki bayat parantezler (AI'sız)
  document.querySelectorAll('h2').forEach(h2=>{
    const t=(h2.textContent||'');
    if(!GUNLUK_BOLUMLER.some(b=>t.toUpperCase().trim().startsWith(b.toUpperCase()))) return;
    const thin=h2.querySelector('.thin');
    if(thin&&/bu gece|bugün|itibarıyla/i.test(thin.textContent||'')){
      thin.textContent='('+new Date().toLocaleDateString('tr-TR',{day:'numeric',month:'short'})+' · Ebu günlük bakımında)';
    }
  });
}

function notlariSifirla(){
  localStorage.removeItem('ajan_notlar');
  try{ fetch('/api/ajanktp?mod=yaz',{ method:'POST', headers:{'content-type':'application/json'},
    body: JSON.stringify({ blob:{} }) }); }catch(e){}
  kayit('Ebu notları sıfırlandı (bulut dahil ☁) — sayfayı yenileyince fabrika notları döner');
}

/* ── ANAHTAR YÖNETİMİ ── */
function anahtarKur(){
  const inp=$('ajanKey'), btn=$('ajanKeyBtn');
  if(!inp||!btn) return;
  const mevcut=localStorage.getItem('ajan_api_key');
  if(mevcut) inp.placeholder='●●●● kayıtlı ('+mevcut.slice(0,10)+'…) — değiştirmek için yaz';
  btn.addEventListener('click',()=>{
    const v=inp.value.trim();
    if(v){ localStorage.setItem('ajan_api_key',v); inp.value=''; inp.placeholder='●●●● kaydedildi'; kayit('API anahtarı kaydedildi (yalnız bu tarayıcıda)'); yorumTuru(true); }
    else { localStorage.removeItem('ajan_api_key'); inp.placeholder='anahtar silindi'; kayit('API anahtarı silindi'); }
  });
}

/* ── BAŞLAT ── */
function basla(){
  if(!$('ajanNot')) return;               // ajan kartı yoksa sessiz çık
  anahtarKur();
  const b1=$('ajanTurBtn'); if(b1) b1.addEventListener('click',()=>veriTuru());
  const b2=$('ajanYorumBtn'); if(b2) b2.addEventListener('click',()=>yorumTuru(true));
  const b3=$('ajanSifirlaBtn'); if(b3) b3.addEventListener('click',notlariSifirla);
  const b4=$('ajanHaftalikBtn'); if(b4) b4.addEventListener('click',()=>haftalikYorumYaz(true,'hafta'));
  /* §423 aylık kip + taktik sıfırlama */
  const b5=$('ajanAylikBtn'); if(b5) b5.addEventListener('click',()=>haftalikYorumYaz(true,'ay'));
  const b6=$('ajanTaktikSifirla'); if(b6) b6.addEventListener('click',()=>{
    try{ localStorage.removeItem('ajan_taktik'); }catch(e){}
    if(typeof taktikRender==='function') taktikRender();
    kayit('Taktiksel duruş FABRİKA hâline döndürüldü (ajan bindirmesi silindi)');
  });
  setTimeout(()=>haftalikYorumYaz(false), 40000);
  setTimeout(notlariGeriYukle, 400);
  setTimeout(hizliGeriYukle, 9000);   // canlılar dolduktan sonra ikinci geçiş — geç kalan hiçbir kart kalmasın
  notNobetci();                        // app.js yeniden çizimlerine karşı nöbet
  const hn=hizliGeriYukle();                 // Ebu'nun notları ANINDA — fabrika metinleri görünmeden
  imzaOnar();   // §110: depoda birikmiş çift simgeleri temizle
  setTimeout(()=>{ nobetTuru().catch(()=>{}); }, 6000);   // §118: açılışta nöbet
  kayit('Ebu uyandı 🤖 — veri turu her 10 dk, yorum her 30 dk'+(hn?' · '+hn+' not anında basıldı':''));
  setTimeout(veriTuru, 8000);             // panel ilk yüklemesini bitirsin
  setTimeout(()=>yorumTuru(false), 20000);
  setInterval(veriTuru, AJAN.ARALIK_VERI);
  setInterval(()=>yorumTuru(false), AJAN.ARALIK_YORUM);
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', basla);
else basla();
})();


/* ── §215c BİLANÇO TASLAĞI ────────────────────────────────────────────────────
   İki adım, tarayıcıdan:
     1) /api/kap?mod=kart&id=<ilk ayrışan>   → metrikler + işaretler
     2) /api/ajanktp?mod=bilanco (POST)      → Claude taslak yazar
   KİMLİK DENEMESİ: aynı dönemin birden fazla bildirimi olur ve hangisinin
   finansal tablo olduğu belli değildir (§211 — en erken çoğu zaman faaliyet
   raporudur). Sırayla denenir, ilk ayrışan kullanılır.
   TASLAK YAYINLANMAZ: ekranda gösterilir, kopyalanır. Skor ve karar insanda. */
async function bilancoTaslak(btn, kod, idler, donem, tarihIso){
  const eski = btn.textContent; btn.disabled = true; btn.textContent = 'metrik…';
  /* §255 TTM ciro referansı (milyon TL) — multiple.json'dan DOĞRUDAN okunur.
     İLK YAZIMDA `window.MULT` kullanmıştım: İKİ HATA birden. (1) değişkenin
     adı MULTIPLE, MULT değil. (2) app.js'te `let MULTIPLE` ile tanımlı ve
     `let` WINDOW'A BAĞLANMAZ — window.MULTIPLE de olmazdı.
     (§252m'de aynı sınıf hataya düşmüştüm; bu sefer dosyayı doğrudan okuyup
     betikler arası bağımlılığı TAMAMEN kaldırıyorum. Dosya zaten önbellekte.) */
  let ttmEk = '';
  try{
    const K = String(kod).toUpperCase();
    const mj = await (await fetch('/multiple.json', {cache:'force-cache'})).json();
    const rec = ((mj && mj.hisseler) || []).find(x => x && String(x.k).toUpperCase() === K);
    if(rec && isFinite(rec.ciro) && rec.ciro > 0) ttmEk += '&ttm=' + rec.ciro;
    /* §257b PD/DD ekseni — multiple.json 141 hisse taşıyor; kapsam dışı isimde
       (KTLEV gibi) ciro referansı YOK. Piyasa değeri endeks dosyalarındaki
       pay_adedi × fiyat ile kurulur. multiple.json'da varsa oradan (fiyat×adet,
       adet zaten MİLYON adet), yoksa xktum/xk100/xktmt'den. */
    let pdMn = null;
    if(rec && isFinite(rec.fiyat) && isFinite(rec.adet)) pdMn = rec.fiyat * rec.adet;
    if(pdMn == null){
      for(const dosya of ['/xktum.json','/xk100.json','/xktmt.json']){
        try{
          const d = await (await fetch(dosya, {cache:'force-cache'})).json();
          const pay = d && d.pay_adedi && d.pay_adedi[K];
          /* §283c FIYAT CANLI_FIYAT'tan DEGIL UCTAN. CANLI_FIYAT yalniz acik
             sekmede yuklenen hisseleri tasir; bilanco karti Ebu panosundan
             uretilir ve orada cogu hisse YOK. 13 Agu ATATP: pay_adedi vardi,
             fiyat gelmedi -> pd gonderilmedi -> §255 birim kaniti calismadi ->
             kart "birim belirsiz" kaldi. Zincirin ilk halkasi buydu. */
          let fy = (typeof CANLI_FIYAT !== 'undefined' && CANLI_FIYAT) ? CANLI_FIYAT[K] : null;
          if(!(isFinite(fy) && fy > 0)){
            try{
              /* Uc: ?mod=fiyat&kodlar=XXX -> {"XXX": 12.34} (parametre `kodlar`; yanit duz sozluk) */
              const fr = await (await fetch('/api/market?mod=fiyat&kodlar=' + K, {cache:'no-store'})).json();
              const v = fr && (fr[K] != null ? fr[K] : (fr.veri && fr.veri[K]));
              if(isFinite(v) && v > 0) fy = +v;
            }catch(e){}
          }
          if(isFinite(pay) && pay > 0 && isFinite(fy) && fy > 0){ pdMn = (pay * fy) / 1e6; break; }
        }catch(e){}
      }
    }
    if(isFinite(pdMn) && pdMn > 0) ttmEk += '&pd=' + Math.round(pdMn);
  }catch(e){}
  /* §347 ÇEYREKLİK SERİ EKİ (20 Agu, kullanici: "Ebu'yu son ceyrege baglayamaz
     miyiz, bu tabloyu okusun"): app.js'teki csSeriOzet 8 ceyreklik ENFLASYON
     ENDEKSLI seriyi (ciro/FAVOK/marj/net kar + net borc) metin olarak verir.
     Kart prompt'una eklenir -> Ebu tek donem yerine TRENDI gorur.
     Guvenlik: fonksiyon yoksa ya da bos donerse eski davranis aynen surer. */
  let seriEk = '';
  try{
    if(typeof window.csSeriOzet === 'function'){
      btn.textContent = 'seri…';
      seriEk = (await window.csSeriOzet(kod, 8)) || '';
    }
  }catch(e){}
  const kutu = document.createElement('div');
  kutu.style.cssText = 'margin:6px 0 10px;padding:9px 11px;border-left:3px solid var(--mm2);background:var(--bg2);border-radius:0 6px 6px 0;font-size:11px;line-height:1.6;white-space:pre-wrap';
  btn.parentNode.appendChild(kutu);
  kutu.textContent = 'metrikler alınıyor…';
  try{
    let met = null, kullanilan = null; const denemeKaydi = [];
    for(const id of String(idler).split(',').filter(Boolean).slice(0,6)){
      try{
        /* §255 TTM ciro referansı gönderilir — kap.js birim belirsizse ölçeği
           bununla KANITLAR (çeyreklik ciro ×4, TTM'e oranlanır). multiple.json
           zaten panelde yüklü; yeni veri kaynağı YOK. Bulunamazsa parametre
           gitmez ve davranış eskisi gibi kalır. */
        const r = await fetch('/api/kap?mod=kart&id='+id+ttmEk, {cache:'no-store'});
        const j = await r.json();
        denemeKaydi.push({ id, bulunan:(j&&j.bulunan)||0, toplam:(j&&j.toplam)||8, hata:(j&&!j.ok)?(j.err||null):null });
        if(j && j.ok && j.metrikler){ met = j; kullanilan = id; break; }
      }catch(e){ denemeKaydi.push({ id, hata:String((e&&e.message)||e).slice(0,60) }); }
    }
    /* §220b BAŞARISIZLIK SEBEBİ AYRINTILI. Önce tek cümle diyordu: "KAP sayfası
       yapısı değişmiş olabilir" — bu bir tahmindi ve çoğu zaman YANLIŞTI.
       Gerçek sebep genelde ŞABLON UYUMSUZLUĞU: solo (konsolide olmayan) rapor,
       farklı sektör şablonu, ya da bildirimin finansal tablo değil ek belge
       olması. Artık her kimliğin kaç kalem verdiği YAZILIYOR. */
    if(!met){
      kutu.innerHTML = '<b>Bilanço ayrıştırılamadı.</b><br>'+
        denemeKaydi.map(d=>'· KAP '+esc(d.id)+' → '+(d.hata?esc(d.hata):(d.bulunan+'/'+d.toplam+' kalem'))).join('<br>')+
        '<br><span class="thin">Muhtemel sebepler: bildirim finansal tablo değil (faaliyet/denetim raporu) · '+
        'solo rapor şablonu · sektöre özel tablo (GYO, sigorta, holding). '+
        'KAP sayfasını açıp tablo başlıklarını gönderirsen şablona eklenebilir.</span>';
      btn.disabled=false; btn.textContent=eski; return;
    }

    btn.textContent = 'yorum…';
    kutu.textContent = 'metrikler alındı ('+met.bulunan+'/'+met.toplam+' kalem, '+met.temel+'). Yorum yazılıyor…';
    const r2 = await fetch('/api/ajanktp?mod=bilanco', {
      method:'POST', headers:{'content-type':'application/json'},
      body: JSON.stringify({ kod, donem, tarihIso, temel:met.temel, sablon:met.sablon,
        metrikler:met.metrikler, isaretler:met.isaretler, birim:met.birim,
        seri: seriEk || undefined })   /* §347: 8 çeyreklik endeksli seri */
    });
    const j2 = await r2.json();
    if(!j2 || !j2.ok){ kutu.textContent = 'Yorum üretilemedi: '+((j2&&j2.err)||'bilinmeyen hata')+'\n\nMetrikler yine de alındı:\n'+JSON.stringify(met.metrikler,null,1); btn.disabled=false; btn.textContent=eski; return; }

    /* §222c KART ÖNİZLEME + ONAY. Artık serbest metin değil KART YAPISI
       geliyor; panelin kartıyla aynı biçimde gösterilir ki onaylamadan önce
       nasıl görüneceği belli olsun.
       SKOR ONAYDA GİRİLİR — model vermiyor, kullanıcı veriyor. */
    const K = j2.kart;
    window.__taslakSon = { kod, donem, kart:K, kapId:kullanilan };
    kutu.innerHTML =
      '<div style="font-size:9px;color:var(--muted);margin-bottom:6px">'+
        '⚠ TASLAK · KAP '+esc(kullanilan)+' · '+met.bulunan+'/'+met.toplam+' kalem · '+esc(met.temel)+
        ' · birim '+esc((met.birim&&met.birim.ad)||'belirsiz')+'</div>'+
      '<div style="font-size:12px;font-weight:700;margin-bottom:3px">'+esc(K.kod)+' '+esc(K.ad||'')+' · '+esc(K.donem||donem)+'</div>'+
      '<div style="margin-bottom:7px">'+esc(K.ozet||'')+'</div>'+
      ((K.metrikler||[]).length ? '<table style="font-size:10px;margin-bottom:7px"><tbody>'+
        K.metrikler.map(m=>'<tr><td>'+esc(m.ad||'')+'</td><td><b>'+esc(m.deger||'')+'</b></td>'+
        '<td class="thin">'+esc(m.cc||'')+'</td><td class="thin">'+esc(m.yoy||'')+'</td></tr>').join('')+
        '</tbody></table>' : '')+
      ((K.onemli||[]).map(x=>'<div style="margin-bottom:4px">• '+esc(x)+'</div>').join(''))+
      (K.guidance ? '<div style="margin-top:6px"><b>Guidance / izlenecek:</b> '+esc(K.guidance)+'</div>' : '')+
      (K.tez ? '<div style="margin-top:5px"><b>Tez:</b> '+esc(K.tez)+'</div>' : '')+
      '<div style="margin-top:9px;padding-top:8px;border-top:1px solid var(--line);display:flex;gap:7px;align-items:center;flex-wrap:wrap">'+
        '<span class="sub" style="font-size:10px">Skor:</span>'+
        '<input id="tsSkor" type="number" step="0.5" min="0" max="10" placeholder="5,5" style="width:62px;font-size:11px;padding:2px 5px">'+
        '<button class="mini" style="font-size:10px" onclick="taslakOnayla(this)">onayla → Earnings AI</button>'+
        '<span class="sub" id="tsDurum" style="font-size:10px"></span>'+
      '</div>'+
      (met.isaretler&&met.isaretler.length ? '<div style="font-size:9px;color:var(--muted);margin-top:6px">otomatik işaretler: '+met.isaretler.map(x=>esc(x.tip)).join(' · ')+'</div>' : '');
    btn.textContent = 'yeniden';
  }catch(e){
    kutu.textContent = 'Hata: '+String((e&&e.message)||e).slice(0,150);
    btn.textContent = eski;
  }
  btn.disabled = false;
}


/* ── §222d TASLAK ONAYI ───────────────────────────────────────────────────────
   Onaylanan kart `ktp_taslak_kart_v1`e yazılır; app.js bunu inceleme-ai.json
   ile BİRLEŞTİRİR ve Earnings AI'da gösterir. Deploy beklemez.
   NEDEN DOSYAYA YAZMIYORUZ: inceleme-ai.json repo'da, tarayıcıdan yazılamaz.
   Kart kalıcılaşınca dosyaya işlenir ve buluttan düşer (aynı kod+dönem varsa
   dosya kazanır — §222b).
   SKOR ZORUNLU: skorsuz kart yayınlanmaz. Model skor vermiyor (§204); yargı
   burada, tek satırda, insandan geliyor. */
async function taslakOnayla(btn){
  const d = document.getElementById('tsDurum');
  const s = document.getElementById('tsSkor');
  const T = window.__taslakSon;
  if(!T || !T.kart){ if(d) d.textContent = 'taslak bulunamadı'; return; }
  const skor = parseFloat(String((s&&s.value)||'').replace(',','.'));
  if(!isFinite(skor) || skor<0 || skor>10){ if(d) d.textContent = 'skor gir (0–10)'; if(s) s.focus(); return; }
  btn.disabled = true; if(d) d.textContent = 'kaydediliyor…';
  try{
    const kart = Object.assign({}, T.kart, { skor,
      _kap: T.kapId, _onay: new Date().toISOString() });
    delete kart._taslak;                       // onaylandı, artık taslak değil
    kart._onaylanmis = true;
    let liste = [];
    try{ liste = JSON.parse(localStorage.getItem('ktp_taslak_kart_v1')||'[]')||[]; }catch(e){}
    liste = liste.filter(x => !(String(x.kod)===String(kart.kod) && String(x.donem)===String(kart.donem)));
    liste.unshift(kart);
    localStorage.setItem('ktp_taslak_kart_v1', JSON.stringify(liste.slice(0,60)));
    /* §264 BULUTA HEMEN YAZ — debounce DEĞİL.
       cloudSaveDebounced 900 ms bekler; kullanıcı o süre dolmadan sayfayı
       yenilerse kayıt buluta HİÇ GİTMEZ ve cloudLoad eski listeyi geri yazar.
       12 Ağu'da ZERGY tam böyle kayboldu: localStorage'a yazıldı, "✓ eklendi"
       dendi, yenilemede yok oldu. app.js tarafına birleştirme korumasını da
       ekledim (§264) ama asıl çözüm gecikmeyi kaldırmak — onay ANLIK bir
       eylemdir, biriktirilecek bir şey yok. */
    try{ if(typeof cloudSave==='function') await cloudSave();
         else if(typeof cloudSaveDebounced==='function') cloudSaveDebounced(); }catch(e){}
    /* Kart listesini yeniden kur ki Earnings AI'da GÖRÜNSÜN */
    /* Kart listesini yeniden kur ki Earnings AI'da GÖRÜNSÜN.
       Fonksiyon adı `incelemeInit` — app.js'te tanımlı, inceleme-ai.json'u
       çekip taslaklarla birleştiriyor (§222b). */
    try{ if(typeof incelemeInit==='function') await incelemeInit(); }catch(e){ console.warn('[Ebu] kart tazeleme:', e); }
    if(d) d.innerHTML = '<b style="color:var(--up)">✓ Earnings AI\'a eklendi</b> — sekmeye geçip gönderebilirsin';
    btn.textContent = 'eklendi';
  }catch(e){
    if(d) d.textContent = 'hata: '+String((e&&e.message)||e).slice(0,80);
    btn.disabled = false;
  }
}

/* ══ §385 SOHBET KATMANI — panel verisine soru-cevap (22 Ağu) ══════════════
   NEDEN ÖZET: panelde onlarca JSON var; hepsini modele göndermek pahalı ve
   yavaş olurdu. Her kaynaktan birkaç yüz karakterlik özet çıkarılır ve
   HEPSİ birden gönderilir — model neyin nerede olduğunu görür, çapraz
   sorulara da cevap verebilir (tek turda, iki aşamalı çağrı olmadan).
   VERİ TARAYICIDA ZATEN YÜKLÜ: panel açıldığında MULTIPLE, GYONAV, VAPFON
   gibi küresel değişkenler doluyor. Sunucunun JSON'ları yeniden okuması
   gereksiz olurdu; özet burada üretilip API'ye gönderilir.
   DÜRÜSTLÜK: özet sayıları YUVARLIDIR ve bu modele söylenir — kesin rakam
   isteyeni ilgili karta yönlendirir. */
/* §388 SEÇİCİ ÖZET — KONTÖR TASARRUFU (22 Ağu, kullanıcı: "her soruda
   kontörümü yiyor"). §386'da 141 hissenin TAMAMI + §387'de tüm makro
   kartları her soruya ekleniyordu ≈ 12K token/soru.
   ÇÖZÜM: soruya göre seç.
   · Soruda hisse kodu geçiyorsa YALNIZ o hisselerin tam satırı + evren
     istatistiği (medyan/uç değerler). Geçmiyorsa yalnız istatistik.
   · Makro kartları yalnız soruda makro sözcüğü varsa.
   · Fon/GYO katmanları yalnız ilgili sözcük varsa.
   · Sekme haritası HER ZAMAN (kısa) — model neyin nerede olduğunu bilsin,
     gerekirse kartı açsın ya da kullanıcıdan istesin.
   Tipik soru ~1,5-3K token'a iner (%75-85 tasarruf).
   DERS: "HEPSİNİ GÖNDER" KOLAY AMA PAHALI — soruyu okuyup seçmek beş kat ucuz. */
function sohbetOzet(soru){
  const P=[]; const n=(v,h)=>Number.isFinite(v)?Number(v).toLocaleString('tr-TR',{maximumFractionDigits:h==null?1:h}):'—';
  const dene=(f)=>{ try{ f(); }catch(e){} };

  /* §386 GERÇEK SAYILAR GÖNDERİLİR (canlı: "ASELS'in EV/EBITDA'sı kaç"
     sorusuna cevap verilemedi çünkü özette YALNIZ KOD LİSTESİ vardı).
     141 hisse × ~70 karakter ≈ 10 KB — kabul edilebilir maliyet, ve model
     artık ÇARPANI KENDİSİ HESAPLAYABİLİR. EV/FAVÖK önceden hesaplanıp da
     konur ki model aritmetik hatası yapmasın. */
  const S=String(soru||'').toLocaleUpperCase('tr');
  const gecer=(...k)=>k.some(x=>S.includes(x.toLocaleUpperCase('tr')));
  /* soruda geçen hisse kodları */
  let hedefKod=[];
  try{ if(typeof MULTIPLE!=='undefined'&&MULTIPLE&&MULTIPLE.hisseler)
    hedefKod=MULTIPLE.hisseler.map(h=>h.k).filter(k=>new RegExp('\\b'+k+'\\b').test(S)); }catch(e){}
  try{ if(typeof FEK_SON!=='undefined'&&FEK_SON&&FEK_SON.kod&&!hedefKod.includes(FEK_SON.kod)) hedefKod.push(FEK_SON.kod); }catch(e){}

  dene(()=>{ if(typeof MULTIPLE!=='undefined'&&MULTIPLE&&MULTIPLE.hisseler){
    const tumu=MULTIPLE.hisseler.map(h=>{
      const f=(typeof CANLI_FIYAT!=='undefined'&&CANLI_FIYAT&&Number.isFinite(CANLI_FIYAT[h.k]))?CANLI_FIYAT[h.k]:h.fiyat;
      const pd=(Number.isFinite(f)&&Number.isFinite(h.adet))?f*h.adet:null;          /* mn ₺ */
      const ev=(Number.isFinite(pd)&&Number.isFinite(h.netBorc))?pd+h.netBorc:null;
      const ee=(Number.isFinite(ev)&&Number.isFinite(h.ebitda)&&h.ebitda>0)?ev/h.ebitda:null;
      const mj=(Number.isFinite(h.ebitda)&&Number.isFinite(h.ciro)&&h.ciro>0)?h.ebitda/h.ciro*100:null;
      return { k:h.k, ee, sat:h.k+' fiyat '+n(f,2)+' PD '+n(pd,0)+' netB '+n(h.netBorc,0)+' ciro '+n(h.ciro,0)+
        ' FAVÖK '+n(h.ebitda,0)+' marj%'+n(mj)+' EV/FAVÖK '+(ee!=null?n(ee,1)+'x':'—') };
    });
    const ev=tumu.map(x=>x.ee).filter(Number.isFinite).sort((a,b)=>a-b);
    const med=ev.length?ev[Math.floor(ev.length/2)]:null;
    const ist='## ÇARPAN EVRENİ (multiple.json · fiyat '+(MULTIPLE.fiyat_tarihi||'')+' · MİLYON ₺)\n'+
      tumu.length+' hisse · EV/FAVÖK medyan '+(med!=null?n(med,1)+'x':'—')+
      ' · en ucuz: '+tumu.filter(x=>Number.isFinite(x.ee)).sort((a,b)=>a.ee-b.ee).slice(0,5).map(x=>x.k+' '+n(x.ee,1)+'x').join(', ')+
      ' · en pahalı: '+tumu.filter(x=>Number.isFinite(x.ee)).sort((a,b)=>b.ee-a.ee).slice(0,3).map(x=>x.k+' '+n(x.ee,1)+'x').join(', ');
    if(hedefKod.length){
      const sec=tumu.filter(x=>hedefKod.includes(x.k));
      P.push(ist+'\n\nSORULAN HİSSELER (tam satır · EV/FAVÖK önceden hesaplandı):\n'+sec.map(x=>x.sat).join('\n'));
    } else if(gecer('EN UCUZ','EN PAHALI','ÇARPAN','SIRALA','TARA','EV/FAVÖK','EV/EBITDA','LİSTE')){
      P.push(ist+'\n\nTÜM EVREN:\n'+tumu.map(x=>x.sat).join('\n'));
    } else {
      P.push(ist+'\n(Belirli hisse sorulursa tam satırı gelir; kod yazması yeterli.)');
    } } });

  dene(()=>{ if(gecer('GYO','NAV','İSKONTO','GAYRIMENKUL','GAYRİMENKUL')&&typeof GYONAV!=='undefined'&&GYONAV&&GYONAV.sirketler){
    const S=GYONAV.sirketler, ks=Object.keys(S);
    const d=ks.map(k=>({k,i:Number.isFinite(S[k].guncelIskonto)?S[k].guncelIskonto:S[k].iskonto,b:S[k].borcluluk}))
      .filter(x=>Number.isFinite(x.i)).sort((a,b)=>a.i-b.i);
    P.push('## GYO NAV (TSPB resmî · dönem '+(GYONAV.donem_etiket||'')+')\n'+
      ks.length+' GYO. Sektör iskontosu %'+n((GYONAV.sektor||{}).iskonto)+', borçluluk %'+n((GYONAV.sektor||{}).borcluluk)+'.\n'+
      'En iskontolu: '+d.slice(0,6).map(x=>x.k+' %'+n(x.i)).join(' · ')+'\n'+
      'En primli: '+d.slice(-3).map(x=>x.k+' %'+n(x.i)).join(' · ')); } });

  dene(()=>{ if(gecer('FON','MKK','VAP','SEKTÖR','BÜYÜKLÜK','SERBEST','PARA PİYASASI')&&typeof VAPFON!=='undefined'&&VAPFON&&(VAPFON.tur_seri||[]).length){
    const O=VAPFON.olculer||[], kS=O.find(x=>/Dönem Sonu Fon Tutar/i.test(x));
    const sonAy=[...new Set(VAPFON.tur_seri.map(x=>x.ay))].sort().reverse()[0];
    const o=VAPFON.tur_seri.filter(x=>x.ay===sonAy&&Number.isFinite(x[kS])).sort((a,b)=>b[kS]-a[kS]);
    const top=o.reduce((a,x)=>a+x[kS],0);
    P.push('## MKK FON BÜYÜKLÜĞÜ (resmî saklama · '+sonAy+')\n'+
      'Toplam '+n(top/1e9,0)+' mlr ₺, '+o.length+' fon türü.\n'+
      o.slice(0,6).map(x=>x.tur.replace(/ ŞEMSİYE FON[U]?$/i,'')+' '+n(x[kS]/1e9,0)+' mlr (%'+n(x[kS]/top*100)+')').join(' · ')); } });

  dene(()=>{ if(gecer('AKIŞ','PYŞ','PYS','GİRİŞ','ÇIKIŞ','PORTFÖY YÖNETİM','KURUCU')&&typeof FONAKIS!=='undefined'&&FONAKIS){
    const p=(FONAKIS.pencereler||{}); const par=[];
    ['1G','1H','1A'].forEach(w=>{ const x=p[w]; if(x&&(x.pys||[]).length){
      const s=x.pys.slice().sort((a,b)=>b.net-a.net);
      par.push(w+' ('+(x.taban||'')+'→'+(x.gun||'')+'): giren '+s.slice(0,3).map(y=>y.kurucu+' +'+n(y.net/1e9)).join(', ')+
        ' · çıkan '+s.slice(-2).map(y=>y.kurucu+' '+n(y.net/1e9)).join(', ')); } });
    if(par.length) P.push('## PYŞ FON AKIŞI (TEFAS türevi · mlr ₺)\n'+par.join('\n')); } });

  dene(()=>{ if(typeof FEK_SON!=='undefined'&&FEK_SON&&FEK_SON.t){
    P.push('## SON FEK HESABI\n'+FEK_SON.kod+' · TTM '+(FEK_SON.t.donem||'')+
      ' · çekirdek FAVÖK '+n((FEK_SON.t.ebitdaCekirdek||FEK_SON.t.ebitda)/1e6,0)+' mn'+
      ' · ödenen faiz '+n(Math.abs(FEK_SON.t.odFaiz||0)/1e6,0)+' mn'+
      ' · KV finansal borç '+n((FEK_SON.t.kvFinBorc||0)/1e6,0)+' mn'); } });

  dene(()=>{ if(gecer('KATILIM','FAİZSİZ','KATFON','FON')&&typeof KATFON!=='undefined'&&KATFON&&KATFON.kategoriler){
    const t=[]; let top=0,ad=0;
    KATFON.kategoriler.forEach(k=>{ const b=k.fonlar.reduce((a,f)=>a+(f.b||0),0);
      t.push(k.ad+' '+n(b/1e9,0)+' mlr ('+k.fonlar.length+')'); top+=b; ad+=k.fonlar.length; });
    P.push('## KATILIM FONLARI (TEFAS · '+(KATFON.fiyat_tarihi||'')+')\n'+
      ad+' fon, toplam '+n(top/1e9,0)+' mlr ₺.\n'+t.join(' · ')); } });

  dene(()=>{ const el=document.getElementById('cdsDeger'); if(el&&el.textContent.trim())
    P.push('## TR 5Y CDS\n'+el.textContent.trim()); });

  /* §387 MAKRO KARTLARI ÖZETE GİRER (canlı: "ABD'de TÜFE kaç" sorusuna panel
     yerine WEB'e bakıldı — oysa ABD sekmesinde TÜFE, GSYH, Fed olasılıkları,
     JOLTS, petrol stoku hepsi VAR).
     Sebep: özet yalnız hisse/fon katmanlarını topluyordu. Makro kartları
     DOM'da duruyor; metin olarak okunup özete konur.
     SEKME AÇILMAMIŞSA kart boş olabilir — o durumda "sekme henüz
     yüklenmedi" denir, model yine de kartın VARLIĞINI bilir ve kullanıcıyı
     oraya yönlendirebilir ya da açtırabilir.
     DERS: ÖZET KATMANI EKSİKSE MODEL PANELİ YOK SAYAR — kapsamı veri
     kaynaklarıyla eşitle. */
  const kartOku = (baslik, idler) => {
    const par = [];
    idler.forEach(id => {
      const e = document.getElementById(id);
      if (!e) return;
      const t = (e.innerText || '').replace(/\s*\n\s*/g, ' · ').replace(/\s{2,}/g, ' ').trim();
      if (t && t.length > 8 && !/yükleniyor/i.test(t)) par.push(t.slice(0, 900));
    });
    if (par.length) P.push('## ' + baslik + '\n' + par.join('\n'));
    else P.push('## ' + baslik + '\n(sekme henüz açılmadı — veri panelde VAR, kullanıcıyı yönlendir ya da kartı aç)');
  };
  const makroSoz=gecer('TÜFE','ENFLASYON','FAİZ','FED','FOMC','GSYH','BÜYÜME','İŞSİZ','JOLTS','PETROL','MAKRO','TAHVİL','CDS','KUR','DOLAR','EURO','PPK','TCMB','ABD','AMERİKA','AVRUPA','ASYA','ÇİN','TAKVİM','VERİ');
  if(makroSoz) dene(()=>kartOku('ABD MAKRO (t17 · FRED/BLS canlı)',
    ['usEnfBody','usGsyhBody','usFredBody','usRiskBody','usBuyumeBody','usEndeksBody','fedTufeVal','fomcSonraki','usBilancoBody']));
  if(makroSoz) dene(()=>kartOku('AVRUPA (t18)', ['euEndeksBody','euMakroBody','euTahvilBody','ecbBody']));
  if(makroSoz) dene(()=>kartOku('ASYA-PASİFİK (t16)', ['asyaEndeksBody','asyaMakroBody','cinBody']));
  if(makroSoz) dene(()=>kartOku('TÜRKİYE MAKRO (t12/t2)', ['trEnfBody','trMakroBody','tcmbBody','egriBody','tlrefBody','makroKart']));
  if(makroSoz) dene(()=>kartOku('KRİTİK TAKVİM', ['takvimTablo','makroTakvimBody']));
  if(makroSoz) dene(()=>kartOku('EMTİA (t15)', ['emtiaOzet','emtiaBody']));
  if(makroSoz) dene(()=>kartOku('SUKUK (t10)', ['skDegerlemeBody','skEgriBody','skIhracBody']));

  dene(()=>{ if(typeof CS_SON!=='undefined'&&CS_SON&&CS_SON.kod)
    P.push('## AÇIK ÇEYREKLİK SERİ\n'+CS_SON.kod+' · '+((CS_SON.donemler||[]).length)+' çeyrek yüklü (enflasyon endeksli)'); });

  P.push('## PANELDE AYRICA VAR (detay için kullanıcıyı yönlendir)\n'+
    'Faktör Model (t6) · Portföy (t3) · Değerleme + FEK/KOPMA-σ (t9) · Teknik (t21) · Journal (t4) · '+
    'Guidance (t8) · Earnings AI (t14) · Halka Arzlar (t20) · Yabancı Hisse (t25) · Finansal Tablolar/Çeyreklik Seri (t23) · '+
    'GYO NAV (t26) · Sektörel Veriler: Katılım Fonları + PYŞ + MKK Fon (t27) · Sukuk (t10) · Commodity (t15) · '+
    'ABD/Avrupa/Asya makro · Haberler (t7)');
  return P.join('\n\n');
}
function sohbetBaglam(){
  try{
    const akt=document.querySelector('.tab.act');
    const ad=akt?(akt.querySelector('h2')?akt.querySelector('h2').childNodes[0].textContent.trim():akt.id):'?';
    const t=(document.getElementById('mulTicker')||{}).value||(document.getElementById('csKod')||{}).value||'';
    return ad+(t?(' · seçili hisse: '+t):'');
  }catch(e){ return ''; }
}
let SOHBET_GECMIS=[];
async function sohbetGonder(){
  const gir=document.getElementById('sbGiris'), akis=document.getElementById('sbAkis');
  if(!gir||!akis) return;
  const soru=String(gir.value||'').trim();
  if(!soru) return;
  gir.value='';
  const esc2=(x)=>String(x).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  akis.insertAdjacentHTML('beforeend','<div class="sb-ben">'+esc2(soru)+'</div>');
  akis.insertAdjacentHTML('beforeend','<div class="sb-ebu" id="sbBekle"><span class="thin">düşünüyor…</span></div>');
  akis.scrollTop=akis.scrollHeight;
  try{
    const r=await fetch('/api/ajanktp?mod=sohbet',{ method:'POST', headers:{'content-type':'application/json'},
      body: JSON.stringify({ soru, ozet: sohbetOzet(soru), baglam: sohbetBaglam(), gecmis: SOHBET_GECMIS.slice(-6) }) });
    const j=await r.json();
    const b=document.getElementById('sbBekle'); if(b) b.remove();
    if(!j.ok){ akis.insertAdjacentHTML('beforeend','<div class="sb-ebu" style="color:var(--down)">✗ '+esc2(j.err||'hata')+'</div>'); }
    else{
      /* §386c KART AÇMA: model cevabın sonuna [KART:t9:ASELS] bırakır; işaret
         metinden ayıklanır, sekme açılır ve ticker doldurulur. Kullanıcıyı
         "şu karta bak" diye yollamak yerine KARTI AÇMAK doğru davranış —
         sohbetin panele gömülü olmasının asıl faydası bu. */
      let metin=String(j.metin||''), kartIsaret=null;
      metin=metin.replace(/\[KART:(t\d+):([A-Z0-9]*)\]/gi,(m,sek,tk)=>{ kartIsaret={sekme:sek.toLowerCase(),tk:(tk||'').toUpperCase()}; return ''; }).trim();
      const md=(x)=>esc2(x).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/\n/g,'<br>');
      akis.insertAdjacentHTML('beforeend','<div class="sb-ebu">'+md(metin)+
        (kartIsaret?('<div style="margin-top:8px"><button class="mini sbKartAc" data-sek="'+kartIsaret.sekme+'" data-tk="'+kartIsaret.tk+'" style="font-size:11px;padding:4px 10px">→ '+(kartIsaret.tk?kartIsaret.tk+' · ':'')+'kartı aç</button></div>'):'')+
        ((j.aramalar||[]).length?('<div class="thin" style="font-size:10px;margin-top:6px">🔎 web: '+esc2(j.aramalar.join(' · '))+'</div>'):'')+
        (j.kesildi?'<div class="thin" style="font-size:10px;color:#E8933B">⚠ yanıt uzunluk sınırında kesildi</div>':'')+'</div>');
      SOHBET_GECMIS.push({rol:'ben',metin:soru},{rol:'ebu',metin:metin});
      /* düğmeyi bağla + tek kart varsa hemen aç */
      akis.querySelectorAll('.sbKartAc:not([data-bagli])').forEach(b=>{
        b.setAttribute('data-bagli','1');
        b.onclick=()=>sohbetKartAc(b.dataset.sek, b.dataset.tk);
      });
      if(kartIsaret) setTimeout(()=>sohbetKartAc(kartIsaret.sekme, kartIsaret.tk), 400);
      if(SOHBET_GECMIS.length>12) SOHBET_GECMIS=SOHBET_GECMIS.slice(-12);
    }
  }catch(e){
    const b=document.getElementById('sbBekle'); if(b) b.remove();
    akis.insertAdjacentHTML('beforeend','<div class="sb-ebu" style="color:var(--down)">✗ '+esc2(String(e.message||e))+'</div>');
  }
  akis.scrollTop=akis.scrollHeight;
}
/* §386c sekmeyi aç + tickerı doldur + ilgili getirme düğmesini tetikle */
function sohbetKartAc(sekme, tk){
  try{
    const b=document.querySelector('nav.tabs button[data-tab="'+sekme+'"]')||document.querySelector('#pySubnav button[data-tab="'+sekme+'"]');
    if(b) b.click();
    if(tk){
      const alanlar={ t9:['fekKod','mulTicker'], t23:['csKod'], t21:['tkKod'], t3:['pfKod'] };
      (alanlar[sekme]||['fekKod','csKod','mulTicker']).forEach(id=>{
        const e=document.getElementById(id);
        if(e){ if(e.tagName==='SELECT'){ e.value=tk; e.dispatchEvent(new Event('change')); } else { e.value=tk; } }
      });
    }
    const p=document.getElementById('sbPanel');
    if(p && window.innerWidth<=520) p.style.display='none';   /* mobilde paneli kapat ki kart görünsün */
    setTimeout(()=>{ const h=document.querySelector('.tab.act'); if(h) h.scrollIntoView({behavior:'smooth',block:'start'}); },200);
  }catch(e){ console.warn('[KTPanel] §386c kart:', e&&e.message); }
}
function sohbetAc(){
  const p=document.getElementById('sbPanel'); if(!p) return;
  const acik=p.style.display!=='none';
  p.style.display=acik?'none':'flex';
  if(!acik){ const g=document.getElementById('sbGiris'); if(g) g.focus(); }
}
document.addEventListener('DOMContentLoaded',()=>{
  try{
    const d=document.getElementById('sbDugme'); if(d) d.onclick=sohbetAc;
    const k=document.getElementById('sbKapat'); if(k) k.onclick=sohbetAc;
    const b=document.getElementById('sbGonder'); if(b) b.onclick=sohbetGonder;
    const g=document.getElementById('sbGiris');
    if(g) g.addEventListener('keydown',e=>{ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); sohbetGonder(); } });
  }catch(e){}
});
