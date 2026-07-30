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
    if(sd&&sd.err&&sd.err!=='sunucu-anahtari-yok'){ kayit('Sunucu AI: '+sd.err); window.AJAN_SUNUCU_HATA=sd.err; }
    else window.AJAN_SUNUCU_HATA=null;
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
const SEKME_DISLA = ['t3','t4','t5','t6','t8','t9','t10','t11','t14','t20','t21'];   // §154: t22 kalktı — Endeksten Ayrışma Portföy (t3) içine taşındı, t3 zaten listede
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
  return liste;
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
const nobGun = (d) => d ? Math.floor((Date.now()-d.getTime())/86400000) : null;
/* GÜN ANAHTARI: kart tarihi saatsizdir (00:00), KAP bildirimi saatlidir (19:08).
   Damga-zamanı karşılaştırılırsa kart AYNI GÜN yazılmış olsa bile "eski" sayanır ve
   nöbetçi kalıcı yanlış alarm üretir. Karşılaştırma GÜN bazında yapılır (§118 testi yakaladı). */
const nobGunAnahtar = (d) => d ? (d.getFullYear()*10000 + (d.getMonth()+1)*100 + d.getDate()) : 0;

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
  try{
    const r = await fetch('/guncelleme-plani.json', {cache:'no-store'});
    if(!r.ok) return null;
    const plan = await r.json();
    const sg = plan.siklik_gun || {};
    const sezonAylar = plan.bilanco_sezonu_aylar || [];
    const sezonLimit = plan.sezon_limit_gun || 10;
    const sezonda = sezonAylar.indexOf(new Date().getMonth()+1) >= 0;
    const bayat = [];
    /* §198 TEK KAYNAK: dosyanın KENDİ tarihi, plandakinden ÖNCELİKLİ.
       Sorun: plan `son` alanı ELLE tutuluyordu. inceleme-ai.json 30 Tem'de
       tazelendi ama plan 21 Tem'de kaldı ve Ebu "10 gün bayat" dedi — dosya
       taze, damga eski. §157.2'de yazdığım kuralın ("veri tazelenince damga
       da tazelenir") ihlali; kural yazmak yetmiyor, MEKANİZMA gerekiyor.
       ÇÖZÜM: JSON katmanlarında dosyanın içindeki `guncelleme`/`tarih` alanı
       okunur ve plandakinden YENİYSE o kullanılır. Plan artık yalnız YEDEK.
       Böylece elle senkron tutma zorunluluğu kalkar (§112 tek kaynak). */
    const dosyaTarihleri = {};
    await Promise.all((plan.katmanlar||[]).map(async k=>{
      const f = String(k.dosya||'');
      if(!f.endsWith('.json') || f.indexOf('/')>=0) return;
      try{
        const r = await fetch('/'+f, {cache:'no-store'});
        if(!r.ok) return;
        const j = await r.json();
        const t = j.guncelleme || j.tarih || j.fiyat_tarihi || null;
        if(t) dosyaTarihleri[f] = t;
      }catch(e){}
    }));
    (plan.katmanlar||[]).forEach(k=>{
      if(k.siklik==='canli' || k.son==='otomatik') return;
      const dosyaT = dosyaTarihleri[String(k.dosya||'')];
      const planD = nobTarih(k.son), dosyaD = nobTarih(dosyaT);
      /* Hangisi YENİYSE o geçerli — plan geride kalmış olabilir (elle tutuluyor),
         dosya geride kalmış olabilir (guncelleme alanı yazılmamış olabilir). */
      const d = (dosyaD && (!planD || dosyaD > planD)) ? dosyaD : planD;
      if(!d) return;
      const gun = nobGun(d);
      let limit = sg[k.siklik] || 7, sez = false;
      if(k.sezon && sezonda && limit > sezonLimit){ limit = sezonLimit; sez = true; }
      if(gun > limit) bayat.push({ad:k.ad, dosya:k.dosya, gun, limit, sez, asim:gun-limit});
    });
    bayat.sort((a,b)=>b.asim-a.asim);
    return {bayat, sezonda, toplam:(plan.katmanlar||[]).length};
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
    const [kr, ir] = await Promise.all([
      fetch('/api/kap', {cache:'no-store'}),
      fetch('/inceleme-ai.json', {cache:'no-store'})
    ]);
    if(!kr.ok || !ir.ok) return null;
    const kap = await kr.json(), inc = await ir.json();
    const kartlar = {};
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

    const bekleyen = {};
    (kap.items||[]).forEach(it=>{
      if(String(it.t||'').toUpperCase()!=='FR') return;
      const ts = it.ts ? new Date(it.ts) : null; if(!ts || isNaN(ts)) return;
      (it.k||[]).forEach(k=>{
        const kod = String(k).toUpperCase();
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
        const TOLERANS_GUN = 14;
        if(kartT){
          /* DİKKAT: nobGunAnahtar YYYYMMDD sayısı döndürür (20260729), zaman
             damgası değil — fark almak için Date nesnelerinin kendisi kullanılır. */
          const fark = (ts.getTime() - kartT.getTime()) / 86400000;
          if(fark <= TOLERANS_GUN) return;    // aynı dönem — kart güncel sayılır
        }
        const v = bekleyen[kod];
        if(!v || ts > v.ts) bekleyen[kod] = {kod, ts, baslik:String(it.b||'').slice(0,90),
          url:it.url||null, portfoyde:!!(typeof poz!=='undefined' && poz.some(p=>p.kod && String(p.kod).toUpperCase()===kod)),
          kartVar:!!kartT};
      });
    });
    const liste = Object.keys(bekleyen).map(k=>bekleyen[k])
      .sort((a,b)=> (b.portfoyde?1:0)-(a.portfoyde?1:0) || b.ts-a.ts);
    return {liste, taranan:(kap.items||[]).length, evren:evren.size};
  }catch(e){ return null; }
}

/* ── SUNUM ────────────────────────────────────────────────────────────────────
   İki yer: ajan çekmecesi (özet) ve Earnings AI sekmesi (bilanço şeridi).
   Sabah gündem notunun bağlamına da girer — cron notu bunları görsün diye. */
let NOBET_SON = {tazelik:null, bilanco:null, saat:null};

function nobetCiz(){
  const T = NOBET_SON.tazelik, B = NOBET_SON.bilanco;
  const el = $('nobetPano');
  if(el){
    let h = '';
    if(B && B.liste.length){
      h += '<div style="margin-bottom:7px"><span class="lbl" style="color:var(--down)">\u26a0 KART BEKLEYEN B\u0130LAN\u00c7O \u00b7 '+B.liste.length+'</span>'+
        B.liste.slice(0,6).map(x=>'<div style="font-size:11px;margin-top:3px">'+
          (x.portfoyde?'<b style="color:var(--mm2)">\u25cf</b> ':'') + '<b>'+esc(x.kod)+'</b> '+
          '<span class="sub" style="font-size:9px">'+x.ts.toLocaleDateString('tr-TR',{day:'numeric',month:'short'})+
          (x.kartVar?' \u00b7 yeni d\u00f6nem':'')+'</span></div>').join('')+'</div>';
    } else if(B){
      h += '<div class="sub" style="font-size:11px;margin-bottom:7px">\u2713 Bekleyen bilan\u00e7o kart\u0131 yok ('+B.evren+' kod izleniyor)</div>';
    }
    if(T && T.bayat.length){
      h += '<div><span class="lbl" style="color:#E8933B">\u23f0 TAZELENMEL\u0130 \u00b7 '+T.bayat.length+'</span>'+
        T.bayat.slice(0,6).map(x=>'<div style="font-size:11px;margin-top:3px"><b>'+esc(x.dosya)+'</b> '+
          '<span class="sub" style="font-size:9px">'+x.gun+' g\u00fcn'+(x.sez?' \u00b7 \u26a1sezon':'')+'</span></div>').join('')+'</div>';
    } else if(T){
      h += '<div class="sub" style="font-size:11px">\u2713 T\u00fcm damgal\u0131 katmanlar vadesinde ('+T.toplam+' katman)</div>';
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
          (x.url?'</a>':'')+'</span>').join('')+'</div>'+
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
let NOBET_ZAMAN=null;
function notNobetci(){
  const uygula=()=>{
    try{
      const k=JSON.parse(localStorage.getItem('ajan_notlar')||'{}');
      let geri=0;
      kartKesfet(false).forEach(K=>{
        if(!k[K.ad]||!k[K.ad].html) return;
        if(K.nt.dataset.ebu==='1') return;              // Ebu'nunki duruyor
        K.nt.innerHTML=k[K.ad].html; K.nt.dataset.ebu='1'; geri++;
      });
      if(geri) kayit('Nöbetçi: '+geri+' not yeniden çizimden sonra geri kondu 🤖');
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
    kartKesfet(false).forEach(K=>{ if(k[K.ad]&&k[K.ad].html){ K.nt.innerHTML=k[K.ad].html; K.nt.dataset.ebu='1'; n++; } });
    const ym=$('yorumMetin');
    if(ym&&k.__HAFTALIK__&&k.__HAFTALIK__.html){ ym.innerHTML=k.__HAFTALIK__.html; n++; }
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
    kartKesfet(false).forEach(K=>{ if(k[K.ad]&&k[K.ad].html){ K.nt.innerHTML=k[K.ad].html; K.nt.dataset.ebu='1'; n++; } });
    const ym=$('yorumMetin');
    if(ym&&k.__HAFTALIK__&&k.__HAFTALIK__.html){ ym.innerHTML=k.__HAFTALIK__.html; n++; }
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

async function aiCagir(prompt, maxTok){
  try{
    const sr=await fetch('/api/market?mod=ai',{ method:'POST',
      headers:{'content-type':'application/json'},
      body:JSON.stringify({prompt, max_tokens:maxTok||500}) });
    const sd=sr.ok?await sr.json():null;
    if(sd&&sd.ok&&sd.metin){ window.AJAN_SON_STOP=sd.stop||''; return sd.metin; }
    if(sd&&sd.err&&sd.err!=='sunucu-anahtari-yok'){ window.AJAN_SUNUCU_HATA=sd.err; kayit('Sunucu AI: '+sd.err); }
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
    return (d&&d.content&&d.content[0]&&d.content[0].text)?d.content[0].text:null;
  }catch(e){ return null; }
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
    parti.map((x,i)=>'### '+(i+1)+' ('+x.ad+')'+(x.canli?' [CANLI]':' [damgalı]')+'\nGÜNCEL VERİ: '+x.veri.slice(0,420)+'\nMEVCUT NOT: '+
      notMetni(x.nt).slice(0,650)).join('\n\n');   // imza SOYULMUS (§110)
  const metin=await aiCagir(prompt, Math.min(2400, 200+parti.length*500));
  if(!metin){ kayit('Not motoru: AI erişilemedi — sonraki tura bekletildi'); return; }
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
  let g=0; const rakamUyari=[];
  parti.forEach((x,i)=>{
    const yeni=j[String(i+1)]!==undefined ? j[String(i+1)] : j[x.ad];
    if(yeni&&typeof yeni==='string'&&yeni.length>40){
      x.nt.innerHTML=imzaEkle(yeni);   // §110: önce eski imza kalıntıları silinir
      // §111 denetimi: canlı kartta oran kaldıysa RAPORLA. Kesmiyoruz — "%20 eşiğinin
      // altında" gibi meşru kullanımlar var; ama sessiz bırakmak da yok (§106 dersi).
      if(x.canli && /%\s*[-−+]?\d|[-−+]?\d+[.,]\d+\s*%/.test(yeni)) rakamUyari.push(x.ad);
      x.nt.dataset.ebu='1';
      kayitli[x.ad]={ html:x.nt.innerHTML, hash:x.hash, ts:simdi, saat:saat() };
      g++;
    }
  });
  notKaydet(kayitli);
  if(g<parti.length) kayit('⚠ eşleşmeyen yanıt anahtarları: '+Object.keys(j).slice(0,6).join(','));
  if(rakamUyari.length) kayit('⚠ CANLI kartta rakam yazıldı (§111 — tabloyla çelişebilir): '+rakamUyari.slice(0,4).join(' / '));
  kayit('Not motoru: '+g+'/'+parti.length+' not güncellendi 🤖'+(kirli.length>parti.length?' · '+(kirli.length-parti.length)+' sırada':''));
  if(g>0 && kirli.length>parti.length){
    kayit('⚡ hız modu: kuyruk sürüyor — 20 sn sonra sonraki parti');
    setTimeout(notMotoru, 20000);
  }
}

/* ═══ HAFTALIK YORUM GÖREVİ — mk-yorum sayfasını panel verileriyle yazar ═══ */
async function haftalikYorumYaz(zorla){
  const ym=$('yorumMetin'); if(!ym) return;
  let kayitli={}; try{ kayitli=JSON.parse(localStorage.getItem('ajan_notlar')||'{}'); }catch(e){}
  const son=kayitli.__HAFTALIK__;
  if(!zorla){
    const pazartesi=(new Date()).getDay()===1;
    const bayat=!son||!son.ts||(Date.now()-son.ts)>5*86400000;
    if(!(pazartesi&&bayat)) return;
  }
  kayit('Haftalık yorum yazılıyor (panel verilerinden)…');
  const ozet=kartKesfet().slice(0,26).map(K=>'• '+K.ad+': '+K.veri.slice(0,150)).join('\n');
  const mevcut=(ym.textContent||'').replace(/\s+/g,' ').trim().slice(0,2200);
  const prompt='Sen KTPanel\u0027in baş stratejistisin. Görevin: paneldeki CANLI verilerden haftalık portföy-yönetimi yorumu yazmak. '+
    'Aşağıda (A) panelin şu anki canlı kart özetleri, (B) örnek yapı olarak mevcut haftalık yorum var. '+
    'Yeni yorumu yaz: 5-7 numaralı bölüm (0\u0027dan başlayan başlıklar), her bölüm <div style="background:#F0F7F4;border-left:3px solid #177245;border-radius:0 6px 6px 0;padding:11px 13px;margin:0 0 14px"><b style="color:#177245;font-size:12px">N · BAŞLIK</b><br>metin</div> kalıbında; '+
    'her bölümün sonunda <b>Portföy çevirisi:</b> cümlesi; rakamları SADECE canlı verilerden al, uydurma; multi-asset fon yöneticisi tonu; Türkçe; toplam 350-500 kelime — SON BÖLÜMÜ MUTLAKA TAMAMLA. YALNIZCA HTML döndür, başka hiçbir şey yazma.\n\n(A) CANLI VERİLER:\n'+ozet+'\n\n(B) MEVCUT YORUM (yapı örneği):\n'+mevcut;
  const metin=await aiCagir(prompt, 2300);
  if(!metin){ kayit('Haftalık yorum: AI erişilemedi'); return; }
  if(window.AJAN_SON_STOP==='max_tokens'){ kayit('Haftalık yorum: yanıt kesildi — basılmadı'); return; }
  const html=metin.replace(/^\s*```html?/i,'').replace(/```\s*$/,'').trim();
  if(html.length<300){ kayit('Haftalık yorum: yanıt kısa, uygulanmadı'); return; }
  ym.innerHTML=html+'<div class="sub" style="font-size:9px;margin-top:6px">🤖 ajan tarafından panel verilerinden yazıldı · '+saat()+' · ⌫ ile fabrika yorumuna dönülür</div>';
  kayitli.__HAFTALIK__={ html:ym.innerHTML, ts:Date.now(), saat:saat() };
  notKaydet(kayitli);
  kayit('Haftalık yorum panel verilerinden yeniden yazıldı 🤖');
}


/* ═══ ÖZEL GÖREVLER — komşu-veriye dayalı yorum bölümleri (Takvim→Görüş vb.) ═══
   Yapı: veri başka kartta, yorum başka kartta. Veri kartının metni değişince
   (olay işlenince / pencere kayınca) hedef yorum yeniden yazılır. Yeni çift
   eklemek = OZEL_GOREVLER dizisine bir satır. */
const OZEL_GOREVLER=[
  { ad:'TakvimGorus', veriLbl:'TAKVİM', hedefLbl:'GÖRÜŞ',
    tarif:'1 aylık kritik olay takvimine istinaden GÖRÜŞ yaz: gerçekleşen olayları (✓ işaretli) sonuçlarıyla değerlendir, yaklaşan olayların portföy anlamını kur, olaylar arası bağlantıları göster.' }
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
    if(eski&&eski.ts&&(simdi-eski.ts)<SOGUMA_MS) continue;           // soğumada
    kayit('Özel görev '+G.ad+': kaynak veri değişti → yorum yazılıyor…');
    const baglam=kartKesfet().slice(0,10).map(K=>'• '+K.ad+': '+K.veri.slice(0,120)).join('\n');
    const mevcut=notMetni(nt).slice(0,1800);   // imza SOYULMUS (§110)
    const prompt='Sen KTPanel\u0027in baş stratejistisin. Görev: '+G.tarif+'\n'+
      'Kurallar: 4-6 paragraf; her paragraf <b style="color:#0E5A3A">Kısa Başlık:</b> ile başlasın, paragraflar <br><br> ile ayrılsın; '+
      'rakam ve olayları SADECE aşağıdaki içerikten al, uydurma; son paragraf pencerenin kritik günleri + risk yönetimi cümlesi olsun; '+
      'multi-asset fon yöneticisi tonu; Türkçe; KISA TUT: toplam 180-280 kelime, 4-5 paragraf — SON PARAGRAFI MUTLAKA TAMAMLA, yarım cümle bırakma; mevcut metnin uslubunu koru; YALNIZCA HTML döndür.\n\n'+
      '(A) KAYNAK VERİ ('+G.veriLbl+'):\n'+veri.slice(0,1600)+'\n\n(B) PANEL CANLI ÖZETLERİ:\n'+baglam+'\n\n(C) MEVCUT METİN (üslup örneği):\n'+mevcut;
    const metin=await aiCagir(prompt, 2000);
    if(!metin){ kayit('Özel görev '+G.ad+': AI erişilemedi'); continue; }
    if(window.AJAN_SON_STOP==='max_tokens'){ kayit('Özel görev '+G.ad+': yanıt kesildi — basılmadı, sonraki turda kısaltılmış denenir'); continue; }
    const html=metin.replace(/^\s*```html?/i,'').replace(/```\s*$/,'').trim();
    if(html.length<200){ kayit('Özel görev '+G.ad+': yanıt kısa, uygulanmadı'); continue; }
    nt.innerHTML=imzaEkle(html);   // §110
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
          satirlar[hd.idx].outerHTML=y.trim(); g++;
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
  const b4=$('ajanHaftalikBtn'); if(b4) b4.addEventListener('click',()=>haftalikYorumYaz(true));
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
