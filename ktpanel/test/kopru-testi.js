#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   KTPanel — KÖPRÜ TESTİ
   Deploy ÖNCESİ / sonrası çalıştırılır. Serverless uçların HEPSİNİ çağırır ve
   yanıt ŞEMASINI doğrular. Amaç "200 döndü mü" değil — o yetmiyor, çünkü tüm
   köprüler hata halinde bilerek 200 + {ok:false} döndürüyor (UI ayakta kalsın diye).
   Bu tasarım doğru ama SESSİZ KIRILMA üretiyor: BAKIM §60 (TEFAS API emekli oldu),
   §92 (üç kart birden boşaldı), §95-97 (ECB kesintisi), §101 (alan adı uyuşmazlığı)
   — dördü de kullanıcı gözüyle yakalandı, sistemle değil. Bu dosya o boşluğu kapatır.

   §417 GÜNCELLEME (25 Agu 2026): edgar ucu eklendi ve
     katfon SINIFLANDIRMASI düzeltildi.
     · katfon kritik:true idi ve ok:false görünce KIRMIZI yakıyordu — oysa
       ok:false BEKLENEN durum (canlı çekim §147-148'de bilerek kapatıldı,
       panel katfon.json'dan besleniyor). ARTIK kapali:true → bilgi sayılıyor.
     · platts CANLI TARAMADA BOZUK BULUNDU (HTTP 502, S&P kimlik akışı
       değişmiş) ve §419'da UÇ TAMAMEN KALDIRILDI — panelde 0 referansı vardı
       ve amacı olan BDI'yı zaten veremezdi (BDI Baltic Exchange'in).
     · edgar (ABD bilanço, §398) da testin dışındaydı.
     DERS: YENİ UÇ AÇILDIĞINDA TESTE DE EKLENİR — eklenmeyen uç, izlenmeyen uçtur.

   §286 GÜNCELLEME (13 Agu 2026): test 29 Tem'den beri güncellenmemişti ve
   aradan geçen sürede altı yeni uç kuruldu, bir doğrulayıcı da yanlıştı.
     · mod=fiyat DOĞRULAYICISI KIRIKTI — d.fiyat/d.fiyatlar arıyordu ama uç
       {KOD: deger} düz sözlük döndürüyor. Sağlam uçta ASILSIZ ALARM veriyordu.
       (§116'nın aynısı: şema kaynaktan okunmalı, hatırlanmamalı.)
     · EKLENEN: evds2 mod=yab · mod=ecb · tefas mod=gnl · tcmb cds=1 ·
       kap mod=kart · fon-akis.json
   Yeni uçlar KRİTİK DEĞİL: hepsinin damgalı yedeği var, düşerse panel boşalmaz
   ama SESSİZCE eskir — uyarı olarak görünmeleri yeterli.

   KULLANIM
     node test/kopru-testi.js                          # varsayılan: prod
     KTP_URL=http://localhost:3000 node test/kopru-testi.js
     CRON_SECRET=xxx node test/kopru-testi.js          # giriş korumasını atlar
       ↑ Vercel'deki CRON_SECRET'in DEĞERİ. KTP_CRON_SECRET adi da kabul edilir.
       .env.local çektiysen:  export $(grep CRON_SECRET .env.local | xargs) && node test/kopru-testi.js
     node test/kopru-testi.js --hizli                  # yalnız kritik uçlar

   ÇIKIŞ KODU: 0 = hepsi geçti · 1 = en az bir KRİTİK uç bozuk (deploy'u durdur)
   Uyarılar (kota/tatil gibi geçici sebepler) çıkış kodunu bozmaz.
   ═══════════════════════════════════════════════════════════════════════════ */
const KOK = (process.env.KTP_URL || 'https://ktpanel.vercel.app').replace(/\/$/, '');
// Cron sırrı: Vercel'de değişkenin adı CRON_SECRET'tir. Terminalde hangi adla
// verirsen ver kabul edilir — isim farkı yüzünden 401 yemeyesin diye üçü de okunur.
const SIR = process.env.KTP_CRON_SECRET || process.env.CRON_SECRET || process.env.VERCEL_CRON_SECRET || '';
const HIZLI = process.argv.includes('--hizli');
const ZAMAN = 30000;

const R = { yesil:'\x1b[32m', kirmizi:'\x1b[31m', sari:'\x1b[33m', gri:'\x1b[90m', kalin:'\x1b[1m', sifir:'\x1b[0m' };
const dizi = (o, yol) => yol.split('.').reduce((a, k) => (a == null ? a : a[k]), o);

/* Bir uç için: yol · kritik mi · doğrulayıcı(veri) → true | 'hata metni' */
const UCLAR = [
  // ŞEKİL KAYNAKTAN OKUNDU (§116): market.js → { t, tarih, data:{ <kur/endeks anahtarları>, sec, end, his } }
  // İlk sürüm 'veri/endeksler/items' arıyordu — hiçbiri yok, sağlam uç için ASILSIZ ALARM üretiyordu.
  { ad:'market · küresel endeksler', yol:'/api/market', kritik:true, dogrula:d=>{
      const D = d.data;
      if(!D || typeof D!=='object') return 'data objesi yok: '+Object.keys(d||{}).slice(0,6).join(',');
      const ana = Object.keys(D).filter(k=>!['sec','end','his'].includes(k));
      const dolu = ana.filter(k=>D[k] && D[k].p!=null);
      if(dolu.length < 3) return 'yalnız '+dolu.length+'/'+ana.length+' ana sembol çözüldü';
      const e = D.end || {};
      const eDolu = Object.keys(e).filter(k=>e[k] && e[k].p!=null).length;
      if(eDolu < 8) return 'BIST endeksleri eksik: '+eDolu+'/'+Object.keys(e).length;
      return true; } },

  /* §286a DOĞRULAYICI DÜZELTİLDİ. Önceki hal `d.fiyat || d.fiyatlar` arıyordu;
     ÖLÇÜLDÜ (13 Agu): fiyatModu {KOD: deger} DÜZ SÖZLÜK döndürüyor, sarmalayıcı
     alan YOK. Yani uç sağlamken test HATA veriyordu — asılsız alarm, §116'nın
     tekrarı. Şema yine kaynaktan okundu, hatırlanmadı. */
  { ad:'market · toplu fiyat', yol:'/api/market?mod=fiyat&kodlar=ASELS,TUPRS,BIMAS', kritik:true, dogrula:d=>{
      if(d && d.ok === false) return 'ok:false — '+(d.err||'');
      const f = (d && (d.fiyat || d.fiyatlar || d.veri)) || d;   /* sarmalayıcı varsa da çalışsın */
      if(!f || typeof f!=='object') return 'yanıt objesi değil';
      const kod = ['ASELS','TUPRS','BIMAS'].filter(k => f[k] != null);
      if(kod.length < 2) return 'yalnız '+kod.length+'/3 kod çözüldü — anahtarlar: '+Object.keys(f).slice(0,6).join(',');
      const v = f[kod[0]];
      if(!(Number(v) > 0)) return kod[0]+' fiyatı pozitif sayı değil: '+v;
      return true; } },

  // §115: sektör endekslerinin 1H/1A/3A serisi GERÇEKTEN geliyor mu?
  // "200 döndü" yetmez — h1/a1/q3 null ise rotasyon damgalı tabanda kalır (§114)
  // ve panel bunu sessizce yapar. Hangi varyantın tuttuğu da raporlanır.
  { ad:'market · SEKTÖR serisi (RS tabanı)', yol:'/api/market', kritik:false, dogrula:d=>{
      const sec = (d.data && d.data.sec) || d.sec;
      if(!sec) return 'sec objesi yok';
      const kod = Object.keys(sec);
      if(!kod.length) return 'sektör listesi boş';
      const eksik = kod.filter(k => !sec[k] || sec[k].a1 == null);
      const varyant = {};
      kod.forEach(k => { const v = sec[k] && sec[k].varyant; if(v) varyant[v] = (varyant[v]||0)+1; });
      const ozet = Object.keys(varyant).map(v => v+'×'+varyant[v]).join(' · ');
      if(eksik.length){
        const bar = kod.map(k=>k+':'+((sec[k]&&sec[k].n)!=null?sec[k].n:'?')).join(' ');
        return eksik.length+'/'+kod.length+' sektörde 1A serisi YOK — RS damgalı tabandan (§114). '+
               'BAR SAYILARI: '+bar+' | varyant: '+(ozet||'yok');
      }
      return true; } },

  /* §286b AVRUPA MEGA-CAP. 13 Agu'da Yahoo'dan canlıya bağlandı (§282);
     sembolleri `tum` listesine eklendi ama SONUÇLARI data'ya YAZILMAMIŞTI —
     çekiliyor, atılıyordu. Panelde "ASML.AS: YOK" göründü. Test bunu yakalar. */
  { ad:'market · Avrupa mega-cap', yol:'/api/market', kritik:false, dogrula:d=>{
      const D = d.data || {};
      const S = ['ASML.AS','MC.PA','SAP.DE','NOVO-B.CO'];
      const dolu = S.filter(k => D[k] && D[k].p != null);
      if(!dolu.length) return 'dördü de yok — §282b dağıtım satırı düşmüş olabilir';
      if(dolu.length < 3) return 'yalnız '+dolu.length+'/4 sembol: '+dolu.join(',');
      return true; } },

  // fredModu → { ok, kaynak, alinma, seriler:{...} }  ('seri' DEĞİL 'seriler')
  { ad:'market · FRED (ABD tahvil)', yol:'/api/market?mod=fred', kritik:false, dogrula:d=>{
      if(d.ok===false) return 'ok:false — '+(d.err||'sebep yok');
      const s = d.seriler || {};
      const n = Object.keys(s).length;
      if(!n) return 'seriler boş';
      /* §272: TÜFE tarihe göre eşlenmeli. Manşet gelmiyor ya da 90 günden
         eskiyse enflasyon kartı sessizce bayatlar. */
      const c = s.CPIAUCNS;
      if(!c || !isFinite(c.deger)) return 'CPIAUCNS yok — ABD TÜFE kartı boşalır (§271/272)';
      return true; } },

  // §97: ECB sunucu tarafı düşerse panel TARAYICIDAN doğrudan çekiyor — bu BEKLENEN
  // bir durum, kart boş kalmaz. Bilgi amacıyla raporlanır, alarm değildir.
  { ad:'market · ECB (sunucu bacagı)', yol:'/api/market?mod=ecb', kritik:false, dogrula:d=>
      d.ok===false ? ('sunucu bacagı düştü — panel tarayıcı yedeğini kullanır (§97): '+(d.err||'')) : true },

  { ad:'market · BoJ', yol:'/api/market?mod=boj', kritik:false, dogrula:d=>
      d.ok===false ? ('ok:false — '+(d.err||'')) : true },

  { ad:'market · HKMA', yol:'/api/market?mod=hkma', kritik:false, dogrula:d=>
      d.ok===false ? ('ok:false — '+(d.err||'')) : true },

  { ad:'evds2 · TÜFE endeksi', yol:'/api/evds2?grup=bie_tukfiy2025&adFiltre=Genel&gun=400&full=1', kritik:true, dogrula:d=>{
      const alan = String(d.cozulen || d.seri || '').replace(/\./g,'_');
      if(!alan) return 'cozulen/seri alanı yok — REEL GETİRİ MODÜLÜ BUNA BAĞLI';
      const ham = d.ham || [];
      if(!Array.isArray(ham) || ham.length < 6) return 'ham seri kısa: '+ham.length+' gözlem';
      const dolu = ham.filter(x=>x[alan]!=null && x[alan]!=='');
      if(dolu.length < 6) return alan+' alanı çoğunlukla boş ('+dolu.length+'/'+ham.length+')';
      if(!/^\d{4}-\d{1,2}$/.test(String(dolu[0].Tarih))) return 'Tarih biçimi beklenenden farklı: '+dolu[0].Tarih;
      return true; } },

  // egri.js → { ok, tur, kaynak, konvansiyon, sapma, adet, aday, baz, vadeler:{...} }
  { ad:'evds2 · getiri eğrisi (DİBS)', yol:'/api/evds2?mod=egri', kritik:true, dogrula:d=>{
      if(d.ok===false) return 'ok:false — '+(d.err||'');
      const n = d.adet!=null ? d.adet : Object.keys(d.vadeler||{}).length;
      if(n < 3) return 'vade noktası yetersiz: '+n+' (aday '+(d.aday||0)+')';
      return true; } },

  { ad:'evds2 · getiri eğrisi (sukuk)', yol:'/api/evds2?mod=egri&tur=sukuk', kritik:false, dogrula:d=>{
      if(d.ok===false) return 'ok:false — '+(d.err||'');
      const n = d.adet!=null ? d.adet : Object.keys(d.vadeler||{}).length;
      return n>=3 ? true : 'vade noktası yetersiz: '+n; } },

  { ad:'evds2 · TLREF', yol:'/api/evds2?mod=tlref&bas=01.01.2026', kritik:false, dogrula:d=>
      d.ok===false ? ('ok:false — '+(d.err||'')) :
      (d.birikim!=null ? true : 'birikim alanı yok') },

  { ad:'evds2 · kart harcamaları', yol:'/api/evds2?mod=kart', kritik:false, dogrula:d=>{
      if(d.ok===false) return 'ok:false — '+(d.err||'');
      const p = d.paylarToplami;
      if(p!=null && Math.abs(p-100) > 3) return 'TUTARLILIK: sektör payları toplamı %'+p+' (≈100 olmalı) — seri seti eksik';
      /* §260: tamamlanmış ay seçimi. Dönem 70 günden eskiyse ay seçimi
         kaymış demektir (kod bir ay geride kalıyordu). */
      if(d.donem && /^\d{4}-\d{2}$/.test(d.donem)){
        const [y,m] = d.donem.split('-').map(Number);
        const gun = Math.floor((Date.now() - new Date(y, m-1, 1).getTime())/86400000);
        if(gun > 100) return 'DÖNEM ESKİ: '+d.donem+' ('+gun+' gün) — §260 ay seçimi kaymış olabilir';
      }
      return true; } },

  { ad:'evds2 · rezerv', yol:'/api/evds2?mod=rezerv', kritik:false, dogrula:d=>
      d.ok===false ? ('ok:false — '+(d.err||'')) : true },

  /* §286c YABANCI HAFTALIK AKIŞ (§259). Bu uç 12 Agu'da kuruldu ve o güne
     kadar BİR İYELİK EKİ yüzünden hiç çalışmıyordu: grup deseni
     "yerleşiklerin" arıyordu, gerçek ad "Yerleşikler". ok:true dönüp BOŞ
     veri veriyordu — testin yakalaması gereken tam bu durum. */
  { ad:'evds2 · yabancı akış', yol:'/api/evds2?mod=yab&hafta=4', kritik:false, dogrula:d=>{
      if(d.ok===false) return 'ok:false — '+(d.err||'');
      if(!isFinite(d.toplam)) return 'toplam yok — ok:true ama BOŞ (§259 vakası)';
      if(!Array.isArray(d.seri) || d.seri.length < 2) return 'seri kısa: '+((d.seri||[]).length);
      if(!d.sonHafta) return 'sonHafta yok';
      return true; } },

  /* §286d ECB DOĞRUDAN (§275/281). ICP akışı 4 Şub 2026'da emekli edildi,
     yerine HICP geldi ve 5. boyut '4' yerine '4D0' oldu. Uç bayat seriyi
     ok:true ile döndürebiliyor — o yüzden bayat bayrağı da kontrol edilir. */
  { ad:'evds2 · ECB (HICP + GSYH)', yol:'/api/evds2?mod=ecb&n=3', kritik:false, dogrula:d=>{
      if(d.ok===false) return 'ok:false — '+(d.err||'');
      const v = d.veri || {};
      const n = Object.keys(v).length;
      if(!n) return 'veri boş';
      if(d.bayatSeri && d.bayatSeri.length)
        return 'BAYAT SERİ: '+d.bayatSeri.join(', ')+' — akış emekli olmuş olabilir (§275)';
      if(!v.dfr) return 'dfr yok — politika faizi kartı boşalır';
      return true; } },

  { ad:'kap · bildirim akışı', yol:'/api/kap', kritik:true, dogrula:d=>{
      if(!Array.isArray(d.items)) return 'items dizisi yok';
      if(!d.items.length) return 'akış boş — WAF/şema değişmiş olabilir ('+(d.err||'hata yok')+')';
      const i = d.items[0];
      if(!Array.isArray(i.k) || !i.b) return 'kayıt şeması bozuk: '+Object.keys(i).join(',');
      return true; } },

  { ad:'kap · sukuk akışı', yol:'/api/kap?mod=sukuk', kritik:false, dogrula:d=>{
      if(!Array.isArray(d.ihraclar)) return 'ihraclar dizisi yok';
      if(d.bilinmeyenKodlar && d.bilinmeyenKodlar.length)
        return 'HARİTA EKSİĞİ: tanınmayan VKŞ kodu — '+d.bilinmeyenKodlar.join(', ');
      return true; } },

  /* §417 SINIFLANDIRMA DÜZELTMESİ (25 Agu, canlı ölçüm): bu uç kritik:true idi
     ve ok:false görünce testi KIRMIZI yakıyordu. Ama ok:false BEKLENEN durum:
     §147-148'de TEFAS bot koruması yüzünden canlı çekim BİLEREK kapatıldı;
     panel veriyi katfon.json'dan okuyor ve kart sağlam çalışıyor. Uç kendi
     durumunu {kapali:true} ile dürüstçe söylüyor — bu iyi tasarımdır, arıza
     değil. Kapalı kapıyı hata saymak, gerçek arızaların da ciddiyetini düşürür
     (app.js'teki aynı gerekçe: "kapanmış bir kapının önünde nöbet tutmak").
     ARTIK: kapali:true → BİLGİ · ok:false ama kapali değil → gerçek arıza. */
  { ad:'katfon · TEFAS', yol:'/api/katfon?k=KLU,KTV,AIS', kritik:false, dogrula:d=>{
      if(d.kapali) return true;   /* bilinçli kapalı — panel katfon.json'dan besleniyor */
      if(d.ok===false) return 'ok:false ve kapali DEĞİL — beklenmedik: '+(d.err||'');
      const it = d.items||{};
      const n = Object.keys(it).length;
      if(n===0) return 'hiç fon çözülemedi';
      const bir = it[Object.keys(it)[0]];
      if(!(bir.fiyat>0)) return 'fiyat pozitif değil';
      return true; } },

  /* §286e TEFAS AUM KÖPRÜSÜ (§253i). Günlük fon akışı (§263) buna dayanıyor:
     tedPaySayisi gelmezse akış hesaplanamaz. İlk kurulumda SAYFALAMA
     UNUTULMUŞTU ve 2000 fonun yalnız 1000'i geliyordu — denetim yakalamıştı. */
  { ad:'tefas · AUM/pay (mod=gnl)', yol:'/api/tefas?mod=gnl&bas=1&bit=5', kritik:false, dogrula:d=>{
      if(d.ok===false) return 'ok:false — '+(d.err||'');
      const L = d.resultList || d.veri || d.items;
      if(!Array.isArray(L)) return 'resultList dizisi yok — anahtarlar: '+Object.keys(d||{}).slice(0,6).join(',');
      if(!L.length) return 'liste boş';
      const x = L[0];
      if(x.tedPaySayisi == null) return 'tedPaySayisi YOK — günlük fon akışı (§263) hesaplanamaz';
      if(!(Number(x.fiyat) > 0)) return 'fiyat pozitif değil';
      return true; } },

  /* §417 EKLENEN UÇLAR — test 13 Agu'dan beri güncellenmemişti; aradan geçen
     sürede İKİ yeni uç kuruldu ve ikisi de testin DIŞINDAydı. platts 25 Agu'da
     canlı taramada HTTP 502 / "SPG_KEY doğrudan Bearer kabul edilmedi" ile
     bozuk bulundu — SESSİZCE bozulmuştu, ne kadardır bilinmiyor. Testin
     varlık sebebi tam bu (§60/§92/§95-101 sınıfı). */
  { ad:'edgar · ABD bilanço (§398)', yol:'/api/edgar?ticker=AAPL', kritik:false, dogrula:d=>{
      if(d.ok===false) return 'ok:false — '+(d.err||'');
      const K = Object.keys(d||{});
      if(!K.length) return 'boş yanıt';
      /* şema kaynaktan okunur, hatırlanmaz (§116): ciro/donem/veri hangi adla
         gelirse gelsin, en az bir dolu alan bekliyoruz */
      const dolu = K.filter(k=>d[k]!=null && !['surum','ok'].includes(k));
      if(!dolu.length) return 'yalnız surum/ok döndü — veri alanı yok';
      return true; } },

  /* §286f TR 5Y CDS (§253). Dokuz kaynak denendikten sonra worldgovernmentbonds
     ucuyla çözüldü. Panelin barometresinin dörtte biri buna bağlı ve eski
     damgalı değer (206) 34 PUAN YANLIŞTI — sessiz bayatlık pahalı. */
  { ad:'tcmb · TR 5Y CDS', yol:'/api/tcmb?cds=1', kritik:false, dogrula:d=>{
      if(d.ok===false) return 'ok:false — '+(d.err||'')+' (damgalı yedeğe düşer, barometre eskir)';
      if(!isFinite(d.deger)) return 'deger yok';
      if(d.deger < 50 || d.deger > 2000) return 'AKIL DIŞI DEĞER: '+d.deger+' bp';
      if(d.tarih){
        const g = Math.floor((Date.now() - new Date(d.tarih).getTime())/86400000);
        if(g > 10) return 'CDS '+g+' gün eski — kaynak durmuş olabilir';
      }
      return true; } },

  { ad:'tcmb · kurlar', yol:'/api/tcmb', kritik:true, dogrula:d=>
      (d.usd && d.usd.satis>0) ? true : 'USD kuru çözülemedi' },

  { ad:'data · bulut depo (KV)', yol:'/api/data', kritik:false, dogrula:d=>
      d.error ? ('depo yapılandırılmamış: '+String(d.error).slice(0,60)) : true },

  { ad:'ajanktp · KV sağlık', yol:'/api/ajanktp?mod=test', kritik:false, dogrula:d=>{
      if(!d.env) return 'env raporu yok';
      if(!d.env.url || !d.env.token) return 'Upstash env eksik (url:'+d.env.url+' token:'+d.env.token+')';
      return d.ok ? true : 'KV yazma/okuma başarısız'; } },

  { ad:'usnews · AV haber akışı', yol:'/api/usnews', kritik:false, dogrula:d=>
      d.ok===false ? ('ok:false — '+(d.err||'')) :
      (Array.isArray(d.items)&&d.items.length ? true : 'haber çözülemedi') },

  { ad:'usnews · Finnhub kazanç', yol:'/api/usnews?mod=kazanc', kritik:false, dogrula:d=>
      d.ok===false ? ('ok:false — '+(d.err||'')) : true },

  { ad:'usnews · kripto', yol:'/api/usnews?mod=kripto', kritik:false, dogrula:d=>
      d.ok===false ? ('ok:false — '+(d.err||'')) : true },

  { ad:'bddk · panel', yol:'/api/bddk?panel=1', kritik:false, dogrula:d=>
      d.ok===false ? ('ok:false — '+(d.err||'')) : true },

  { ad:'bddk · sahiplik', yol:'/api/bddk?sahiplik=1', kritik:false, dogrula:d=>
      d.ok===false ? ('ok:false — '+(d.err||'')) : true },

  /* §286g GÜNLÜK FON AKIŞI DOSYASI (§263). Uç değil, Actions'ın yazdığı dosya
     — ama panelin Sukuk sekmesi buna bağlı. İki gün arşiv yoksa akış
     hesaplanamaz; kurucu eşlemesi yoksa toplamlar "(kurucu bilinmiyor)"
     satırında toplanır (§279 vakası: 21,78 mlr tek satırda). */
  { ad:'dosya · fon-akis.json', yol:'/fon-akis.json', kritik:false, dogrula:d=>{
      const g = Object.keys(d.gunler||{});
      if(g.length < 2) return 'arşivde '+g.length+' gün — akış için iki ardışık iş günü gerekli';
      if(!d.akis || !d.akis.fon) return 'akis bloğu yok';
      const n = Object.keys(d.akis.fon).length;
      if(n < 500) return 'yalnız '+n+' fon — evren daralmış olabilir';
      const K = d.kurucu || {};
      const eslesen = Object.keys(d.akis.fon).filter(k => K[k]).length;
      const oran = n ? Math.round(eslesen/n*100) : 0;
      if(oran < 90) return 'KURUCU EŞLEŞMESİ %'+oran+' ('+eslesen+'/'+n+') — kurum toplamları bozulur (§279)';
      if(d.akis.gun){
        const gun = Math.floor((Date.now() - new Date(d.akis.gun).getTime())/86400000);
        if(gun > 5) return 'akış '+gun+' gün eski — Actions koşmuyor olabilir';
      }
      return true; } },
];

const KRITIK_HIZLI = new Set(['market · toplu fiyat','evds2 · TÜFE endeksi','kap · bildirim akışı','katfon · TEFAS','tcmb · kurlar']);

async function calistir(u){
  const bas = Date.now();
  try{
    const r = await fetch(KOK + u.yol, {
      headers: SIR ? { 'Authorization': 'Bearer ' + SIR } : {},
      signal: AbortSignal.timeout(ZAMAN)
    });
    const ms = Date.now() - bas;
    if(r.status === 401) return { sonuc:'KIMLIK', ms, not:'401 — giriş koruması. CRON_SECRET=<deger> ile çalıştır.' };
    if(!r.ok) return { sonuc:'HATA', ms, not:'HTTP ' + r.status };
    const metin = await r.text();
    let d; try{ d = JSON.parse(metin); }
    catch(e){ return { sonuc:'HATA', ms, not:'JSON değil: ' + metin.slice(0,60).replace(/\s+/g,' ') }; }
    const s = u.dogrula(d);
    return s === true ? { sonuc:'GECTI', ms } : { sonuc: u.kritik ? 'HATA' : 'UYARI', ms, not:String(s) };
  }catch(e){
    return { sonuc:'HATA', ms: Date.now()-bas, not:String(e.message||e).slice(0,70) };
  }
}

(async () => {
  const liste = HIZLI ? UCLAR.filter(u => KRITIK_HIZLI.has(u.ad)) : UCLAR;
  console.log(`\n${R.kalin}KTPanel köprü testi${R.sifir} ${R.gri}· ${KOK} · ${liste.length} uç · ${new Date().toLocaleString('tr-TR')}${R.sifir}`);
  if(!SIR) console.log(`${R.sari}⚠ cron sırrı verilmedi — panel giriş korumalıysa HEPSİ 401/403 döner.${R.sifir}\n`+
    `${R.gri}  Vercel > Settings > Environment Variables > CRON_SECRET değerini şöyle ver:${R.sifir}\n`+
    `${R.gri}  CRON_SECRET=<deger> node test/kopru-testi.js${R.sifir}`);
  console.log('');

  const sonuclar = [];
  for(const u of liste){
    const s = await calistir(u);
    sonuclar.push({ u, s });
    const renk = s.sonuc==='GECTI' ? R.yesil : s.sonuc==='UYARI' ? R.sari : R.kirmizi;
    const isaret = s.sonuc==='GECTI' ? '✓' : s.sonuc==='UYARI' ? '!' : '✗';
    console.log(`${renk}${isaret}${R.sifir} ${u.ad.padEnd(34)} ${R.gri}${String(s.ms).padStart(5)}ms${R.sifir}` +
      (s.not ? `  ${renk}${s.not}${R.sifir}` : ''));
  }

  const gecti = sonuclar.filter(x=>x.s.sonuc==='GECTI').length;
  const uyari = sonuclar.filter(x=>x.s.sonuc==='UYARI');
  const hata  = sonuclar.filter(x=>x.s.sonuc==='HATA' || x.s.sonuc==='KIMLIK');
  console.log(`\n${R.kalin}${gecti} geçti${R.sifir} · ${R.sari}${uyari.length} uyarı${R.sifir} · ${R.kirmizi}${hata.length} hata${R.sifir}`);

  if(hata.length){
    console.log(`\n${R.kirmizi}${R.kalin}DEPLOY ETME — kritik köprüler bozuk:${R.sifir}`);
    hata.forEach(x=>console.log(`  · ${x.u.ad}: ${x.s.not}`));
    console.log(`${R.gri}Bozuk köprünün kartı panelde SESSİZCE boş görünür; damga hâlâ "canlı" der (§60 dersi).${R.sifir}`);
  } else if(uyari.length){
    console.log(`${R.gri}Uyarılar deploy'u engellemez — kota, tatil veya opsiyonel env eksikliği olabilir.${R.sifir}`);
  } else {
    console.log(`${R.yesil}Tüm köprüler sağlam.${R.sifir}`);
  }
  process.exit(hata.length ? 1 : 0);
})();
