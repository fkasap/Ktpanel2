// /api/katfon — TEFAS YENİ API (2026 Next.js altyapısı): fonGnlBlgSiraliGetir
// Eski BindComparisonFundReturns EMEKLİ (404) — bu uç tarih aralığında TÜM fonların
// fiyat/AUM/yatırımcı verisini döndürür. Son ~7 günden 1G getiri CANLI hesaplanır.
// §142: Dönem getirileri (1A/3A/YTD/1Y/3Y) yeni API'de HAZIR GELMİYOR — ama fiyat
// serisinden HESAPLANABİLİR. Tüm geçmişi çekmek gerekmez (3 yıl × ~1000 fon = devasa);
// yalnız ÇAPA TARİHLERİNİN etrafında dar pencereler çekilir ve her fon için hedefe
// en yakın (hedef tarihte ya da ÖNCESİNDE) kapanış seçilir. Altı küçük istek, paralel.
// Bir pencere düşerse o dönem null döner ve panel damgalı değeri korur — kısmi başarı.
// Kaynak ölçümü: pytefas client.py (27 Tem 2026). Hafta sonu: "out of bounds" = boş gün, normal.
const URL_INFO = 'https://www.tefas.gov.tr/api/funds/fonGnlBlgSiraliGetir';
const HEADERS = {
  'Accept': '*/*',
  'Content-Type': 'application/json',
  'Origin': 'https://www.tefas.gov.tr',
  'Referer': 'https://www.tefas.gov.tr/tr/fon-verileri',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36'
};
const fmt = d => d.getFullYear() + String(d.getMonth()+1).padStart(2,'0') + String(d.getDate()).padStart(2,'0');

/* §146 ÇEREZ ISINDIRMA — TEŞHİSİN SONUCU
   ?debug=1 çıktısı (29 Tem 10:07): altı pencerenin HEPSİ 8000ms'de düştü;
   dördü zaman aşımı, İKİSİ "HTML dönmüş olabilir". JSON bekleyip HTML almak,
   üstelik 8 saniye bekletildikten sonra — bir bot koruma / WAF sayfasının imzası.
   Vercel'in veri merkezi IP'si tarpit'leniyor.
   HİPOTEZ (test edilebilir): TEFAS önce sayfa ziyareti + oturum çerezi bekliyor.
   Çoğu .NET/Next.js sitesi böyle çalışır: doğrudan API POST'u reddedilir, ama
   sayfayı GET edip dönen çerezle POST kabul edilir.
   Bu ISPATLANMIŞ DEĞİL — denenecek. Tutmazsa ?debug=1 yine söyleyecek ve
   mimari değişikliğe (cron+KV) geçeriz. */
let CEREZ = null, CEREZ_ZAMAN = 0;
async function cerezIsit(){
  if (CEREZ && Date.now()-CEREZ_ZAMAN < 600000) return CEREZ;   // 10 dk taze tut
  try{
    const r = await fetch('https://www.tefas.gov.tr/tr/fon-verileri', {
      headers: { 'User-Agent': HEADERS['User-Agent'],
                 'Accept': 'text/html,application/xhtml+xml',
                 'Accept-Language': 'tr-TR,tr;q=0.9' },
      signal: AbortSignal.timeout(5000), redirect:'follow' });
    const ham = r.headers.getSetCookie ? r.headers.getSetCookie()
              : (r.headers.get('set-cookie') ? [r.headers.get('set-cookie')] : []);
    const c = ham.map(x=>String(x).split(';')[0]).filter(Boolean).join('; ');
    if(c){ CEREZ = c; CEREZ_ZAMAN = Date.now(); }
    return CEREZ;
  }catch(e){ return CEREZ; }
}
/* §141 TARİH AYRIŞTIRMA — metin sıralaması AY GEÇİŞİNDE bozuluyordu.
   TEFAS tarihi üç biçimde gelebilir: epoch(ms) · ISO(YYYY-MM-DD) · TR(DD.MM.YYYY).
   Eski kod sayı değilse METİN olarak karşılaştırıyordu; DD.MM.YYYY'de
   "02.08.2026" metin sırasında "29.07.2026"dan ÖNCE gelir — yani ay başı
   en eski sanılır ve SON GÖZLEM YANLIŞ SEÇİLİR. Ay içinde sorun görünmez,
   ay dönümünde sessizce yanlış getiri üretir. Hepsi epoch'a çevriliyor. */
const tarihMs = (t)=>{
  if(t==null) return 0;
  const n=Number(t); if(isFinite(n)&&n>1e11) return n;  // epoch ms
  const s=String(t).trim();
  let m=s.match(/^(\d{4})-(\d{2})-(\d{2})/);// ISO
  if(m) return Date.UTC(+m[1],+m[2]-1,+m[3]);
  m=s.match(/^(\d{1,2})[.\/](\d{1,2})[.\/](\d{4})/);// DD.MM.YYYY
  if(m) return Date.UTC(+m[3],+m[2]-1,+m[1]);
  const d=Date.parse(s); return isFinite(d)?d:0;
};


/* §147 İKİ VARYANT — eneshenderson/Tefas-API deposundan öğrenildi.
   O kütüphane ÇALIŞIYOR ama PLAYWRIGHT ile: gerçek Chromium açıp
   tefas.gov.tr/TarihselVeriler.aspx sayfasına gidiyor, sonra fetch'i SAYFANIN
   İÇİNDEN çalıştırıyor. Böylece hem bot koruması geçiliyor hem same-origin
   olduğu için CORS yok. Vercel'de Chromium çalıştıramayız (bundle sınırı),
   AMA kütüphane bize BAŞKA BİR UÇ NOKTA gösterdi:
     ESKİ: POST /api/DB/BindHistoryInfo · form-urlencoded · tarih DD.MM.YYYY
     YENİ: POST /api/funds/fonGnlBlgSiraliGetir · JSON · tarih YYYYMMDD
   Bizim kod yalnız YENİ'yi deniyordu ve o WAF'a takılıyor. Eski uç nokta farklı
   bir yolda; aynı korumanın arkasında OLMAYABİLİR. İkisi de denenir, tutan
   raporlanır (§115 varyant zinciri deseni). Tutmazsa ?debug=1 yine söyler. */
const URL_ESKI = 'https://www.tefas.gov.tr/api/DB/BindHistoryInfo';

/* §148 DEVRE KESİCİ — ölçüm kapandı, artık boşuna beklemeyelim.
   TEŞHİS SONUCU (29 Tem 10:15): TEFAS sunucu tarafından ERİŞİLEMEZ.
     · ana sayfa GET  → ÇALIŞIYOR, 4 çerez döndü (widcbb509a2029=… bot yönetimi)
     · /api/DB/…      → HTTP 404, uç nokta kapatılmış (kütüphane güncel değil)
     · /api/funds/…   → zaman aşımı; sayfa cevap veriyor ama API askıda bırakıyor
   Aldığımız çerez bir ÖN-ÇEREZ: gerçek erişim, sayfadaki JavaScript koşunca
   veriliyor. Vercel'de JS çalıştıracak tarayıcı yok (Chromium ~300MB, bundle
   sınırının çok üstünde). Bu yüzden eneshenderson/Tefas-API Playwright kullanıyor.
   KARAR: denemeyi SÜRDÜRMEK zararlı — her sekme açılışında 8+ saniye asılı
   kalıyor, kullanıcı bekliyor, sonuç değişmiyor. Devre kesici:
     · varsayılan KAPALI. Açmak için ortam değişkeni KATFON_CANLI=1.
     · ?zorla=1 ile tek seferlik denenebilir (yeni bir yol bulunursa sınamak için).
     · kapalıyken uç nokta ANINDA yanıt verir ve NEDEN kapalı olduğunu söyler.
   Veri yolu artık köprü ritüeli: Fintables'tan çekilip katfon.json'a damgalanır.
   O yol ÖLÇÜLDÜ ve doğru çalışıyor (§142: 4 fonda Fintables ile birebir). */
const CANLI_ACIK = process.env.KATFON_CANLI === '1';
const fmtTR = d => String(d.getDate()).padStart(2,'0')+'.'+String(d.getMonth()+1).padStart(2,'0')+'.'+d.getFullYear();

async function pencereEski(basD, bitD, timeoutMs){
  const t0=Date.now(), sure=()=>Date.now()-t0;
  const gv = new URLSearchParams({ fontip:'YAT', sfontur:'', fonkod:'', fongrup:'',
    bastarih:fmtTR(basD), bittarih:fmtTR(bitD), fonturkod:'', fonunvantip:'', kurucukod:'' });
  try{
    const c = await cerezIsit();
    const bas = { 'Accept':'application/json, text/javascript, */*; q=0.01',
      'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8',
      'X-Requested-With':'XMLHttpRequest',
      'Origin':'https://www.tefas.gov.tr',
      'Referer':'https://www.tefas.gov.tr/TarihselVeriler.aspx',
      'Accept-Language':'tr-TR,tr;q=0.9',
      'User-Agent':HEADERS['User-Agent'] };
    if(c) bas.Cookie = c;
    const r = await fetch(URL_ESKI, { method:'POST', headers:bas, body:gv.toString(),
      signal:AbortSignal.timeout(timeoutMs||7000) });
    if(!r.ok){ let g=''; try{ g=(await r.text()).slice(0,180); }catch(e){}
      return {ok:false, sebep:'eski uç HTTP '+r.status, ms:sure(), govde:g}; }
    let j; try{ j = await r.json(); }
    catch(e){ return {ok:false, sebep:'eski uç: JSON çözülemedi (HTML)', ms:sure()}; }
    const d = j.data || j.resultList || [];
    /* Alan adları eski uçta FARKLI: FONKODU/TARIH/FIYAT (büyük harf, .NET biçimi).
       Ortak biçime çevriliyor ki çağıran taraf hangi varyantın tuttuğunu bilmesin. */
    const dizi = d.map(x=>({
      fonKodu: x.FONKODU || x.fonKodu,
      tarih:   x.TARIH   != null ? x.TARIH   : x.tarih,
      fiyat:   x.FIYAT   != null ? x.FIYAT   : x.fiyat,
      portfoyBuyukluk: x.PORTFOYBUYUKLUK != null ? x.PORTFOYBUYUKLUK : x.portfoyBuyukluk,
      kisiSayisi:      x.KISISAYISI      != null ? x.KISISAYISI      : x.kisiSayisi
    })).filter(x=>x.fonKodu);
    return {ok:true, dizi, ms:sure(), varyant:'eski'};
  }catch(e){
    const ad=(e&&e.name)||'';
    return {ok:false, ms:sure(), sebep:'eski uç: '+(/abort|timeout/i.test(ad+String(e&&e.message))
      ? 'zaman aşımı ('+(timeoutMs||7000)+'ms)' : String((e&&e.message)||e).slice(0,90))};
  }
}

/* §145 TANI: hata yutulmaz, sebep taşınır. §147: önce ESKİ uç denenir. */
async function pencere(basD, bitD, timeoutMs){
  const yari = Math.max(2500, Math.floor((timeoutMs||7000)/2));
  const a = await pencereEski(basD, bitD, yari);
  if(a.ok) return a;
  const t0 = Date.now(), sure = ()=>Date.now()-t0;
  const body = {
    fonTipi:'YAT', fonKodu:null, aramaMetni:null, fonTurKod:null, fonGrubu:null,
    sfonTurKod:null, fonTurAciklama:null, kurucuKod:null,
    basTarih:fmt(basD), bitTarih:fmt(bitD), basSira:1, bitSira:100000,
    dil:'TR', sFonTurKod:'', fonKod:'', fonGrup:'', fonUnvanTip:''
  };
  try{
    const c = await cerezIsit();
    const bas = c ? Object.assign({}, HEADERS, {Cookie:c}) : HEADERS;
    const r = await fetch(URL_INFO, { method:'POST', headers:bas,
      body:JSON.stringify(body), signal:AbortSignal.timeout(yari) });
    if(!r.ok){
      let govde=''; try{ govde=(await r.text()).slice(0,180); }catch(e){}
      return {ok:false, sebep:'yeni uç HTTP '+r.status+' · '+a.sebep, ms:sure(), govde};
    }
    let j; try{ j = await r.json(); }
    catch(e){ return {ok:false, sebep:'yeni uç: JSON çözülemedi (HTML) · '+a.sebep, ms:sure()}; }
    const bos = j.errorMessage && /out of bounds|veri bulunamad/i.test(j.errorMessage);
    if((j.errorCode||j.errorMessage) && !bos)
      return {ok:false, sebep:'TEFAS: '+(j.errorMessage||j.errorCode)+' · '+a.sebep, ms:sure()};
    return {ok:true, dizi:j.resultList||[], ms:sure(), varyant:'yeni'};
  }catch(e){
    const ad=(e&&e.name)||'';
    return {ok:false, ms:sure(),
      sebep:'yeni uç: '+(/abort|timeout/i.test(ad+String(e&&e.message)) ? 'zaman aşımı'
             : String((e&&e.message)||e).slice(0,90))+' · '+a.sebep};
  }
}

/* Bir pencereden, her fon için HEDEF TARİHTE YA DA ÖNCESİNDE en yakın kapanışı seçer.
   Çapa mantığı budur: hedef tatile denk gelirse bir önceki işlem günü kullanılır.
   Hiç uygun gözlem yoksa (fon o tarihte yoktu) o fon atlanır — null döner, damgalı kalır. */
function capaSec(dizi, hedefMs, istenen){
  const en = {};
  for(const f of dizi||[]){
    const kod = String(f.fonKodu||'').toUpperCase();
    if(!kod || (istenen.size && !istenen.has(kod))) continue;
    if(f.fiyat==null) continue;
    const t = tarihMs(f.tarih);
    if(!t || t > hedefMs) continue;                 // hedeften SONRAKİ gözlem çapa olamaz
    if(!en[kod] || t > en[kod].t) en[kod] = {t, fiyat:+f.fiyat};
  }
  return en;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  // §142: fon fiyatı günde bir kez yayımlanır — 30 dk yerine 6 saat önbellek.
  // Altı pencere çekildiği için istek pahalı; sık tazelemenin faydası yok.
  res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=43200');
  const istenen = new Set(String(req.query.k||'').toUpperCase().split(',').filter(Boolean));
  if(!CANLI_ACIK && !req.query.zorla && !req.query.debug){
    return res.status(200).json({ ok:false, kapali:true,
      err:'canlı çekim kapalı — TEFAS sunucu tarafından erişilemiyor (bot koruması, '+
          'JavaScript gerektiriyor). Veriler köprü ritüeliyle tazeleniyor.',
      nasil:'Yeniden denemek için ?zorla=1 · kalıcı açmak için KATFON_CANLI=1 ortam değişkeni',
      teshis:'/api/katfon?debug=1' });
  }
  try{
    const bugun = new Date();
    const gunEkle = (n)=> new Date(bugun.getTime() + n*86400000);
    /* §142 ÇAPA PENCERELERİ — her dönem için hedef tarih ve etrafında dar bir aralık.
       Aralık geriye doğru geniş tutulur (tatil/hafta sonu için), ileriye dar:
       çapa hedefin ÖNCESİNDE olmalı, sonrasında değil.
       YTD çapası: bir önceki yılın SON işlem günü (31 Aralık tatile denk gelebilir). */
    const yilBasi = new Date(bugun.getFullYear()-1, 11, 31);
    const PENCERE = [
      {ad:'son', bas:gunEkle(-8),   bit:bugun,          hedef:bugun},
      {ad:'1A',  bas:gunEkle(-36),  bit:gunEkle(-28),   hedef:gunEkle(-30)},
      {ad:'3A',  bas:gunEkle(-98),  bit:gunEkle(-89),   hedef:gunEkle(-91)},
      {ad:'YTD', bas:new Date(bugun.getFullYear()-1,11,22), bit:yilBasi, hedef:yilBasi},
      {ad:'1Y',  bas:gunEkle(-372), bit:gunEkle(-363),  hedef:gunEkle(-365)},
      {ad:'3Y',  bas:gunEkle(-1103),bit:gunEkle(-1092), hedef:gunEkle(-1095)}
    ];
    /* §144 KADEMELİ ÇEKİM — altı paralel istek TEFAS'ı ya da Vercel'in 10 sn
       bütçesini zorluyordu ve HEPSİ birden düşüyordu (ekranda "son pencere
       alınamadı"). Yeni sıra:
         1) ÖNCE "son" penceresi TEK BAŞINA, cömert zaman aşımıyla. Bu tutmazsa
            zaten hiçbir şey yapılamaz — 1G bile gelmez.
         2) SONRA beş çapa penceresi paralel, KALAN bütçeyle. Bunlar düşerse
            dönemler damgalı kalır ama 1G CANLI olur — yani eski davranışa
            zarif iniş. Hepsi ya hep ya hiç değil.
       Böylece kısmi başarı gerçekten kısmi: en kötü ihtimalle eski sürüm kadar iyi. */
    const t0 = Date.now();
    /* §145 TEŞHİS MODU ÖNCE ÇALIŞIR. Eskiden debug bloğu, "son pencere alınamadı"
       fırlatmasından SONRA geliyordu — yani tam ihtiyaç duyulan anda susuyordu.
       Artık ?debug=1 hiçbir şey fırlatmadan HER pencerenin sonucunu raporlar:
       HTTP kodu, TEFAS mesajı, süre, gövde örneği. Teşhis aracı, teşhis edeceği
       arızadan etkilenmemeli. */
    if(req.query.debug){
      const hepsi = await Promise.all(PENCERE.map(w=>pencere(w.bas, w.bit, 8000)));
      return res.status(200).json({ ok:true, debug:true, tarih:new Date().toISOString(),
        uc: URL_INFO,
        pencereler: PENCERE.map((w,ix)=>({
          ad:w.ad, bas:fmt(w.bas), bit:fmt(w.bit), hedef:fmt(w.hedef),
          sonuc: hepsi[ix].ok ? 'OK' : 'HATA',
          sebep: hepsi[ix].sebep || null,
          ms: hepsi[ix].ms,
          kayit: hepsi[ix].ok ? hepsi[ix].dizi.length : null,
          varyant: hepsi[ix].varyant || null,
          govde: hepsi[ix].govde || undefined
        })),
        cerez: CEREZ ? (CEREZ.split(';').length+' çerez alındı: '+CEREZ.slice(0,80)) : 'ÇEREZ ALINAMADI',
        ornek: (hepsi[0].ok && hepsi[0].dizi[0]) ? hepsi[0].dizi[0] : null,
        alanlar: (hepsi[0].ok && hepsi[0].dizi[0]) ? Object.keys(hepsi[0].dizi[0]) : null });
    }
    const sonP = await pencere(PENCERE[0].bas, PENCERE[0].bit, 8000);
    if(!sonP.ok) throw new Error('son pencere: '+sonP.sebep+' ('+sonP.ms+'ms)');
    const sonDizi = sonP.dizi;
    const kalanMs = Math.max(1500, 9000-(Date.now()-t0));   // fonksiyon bütçesinden arta kalan
    const capaSonuc = await Promise.all(
      PENCERE.slice(1).map(w=>pencere(w.bas, w.bit, kalanMs)));
    const sonuclar = [sonDizi].concat(capaSonuc.map(x=>x.ok?x.dizi:null));
    /* Çapa tabloları: dönem adı → {fonKodu: {t, fiyat}} */
    const capa = {};
    PENCERE.forEach((w,ix)=>{ if(ix===0) return;
      capa[w.ad] = sonuclar[ix] ? capaSec(sonuclar[ix], w.hedef.getTime(), istenen) : null; });
    const dizi = sonDizi;
    // Fon bazında grupla, tarihe göre sırala (tarih formatı savunmalı: sayı ya da string)
    const grup = {};
    for (const f of dizi){
      const kod = String(f.fonKodu||'').toUpperCase();
      if (!kod || (istenen.size && !istenen.has(kod))) continue;
      (grup[kod] = grup[kod] || []).push(f);
    }
    const tSirala = (a,b)=> tarihMs(a.tarih) - tarihMs(b.tarih);
    const items = {};
    for (const kod in grup){
      const seri = grup[kod].filter(x=>x.fiyat!=null).sort(tSirala);
      if (!seri.length) continue;
      const son = seri[seri.length-1], once = seri.length>1?seri[seri.length-2]:null;
      const g1 = once && once.fiyat ? +(((son.fiyat/once.fiyat)-1)*100).toFixed(4) : null;
      /* §142 DÖNEM GETİRİLERİ artık BURADA hesaplanıyor — damgalıya bağımlılık bitti.
         getiri = (son fiyat / çapa fiyat − 1) × 100. Çapası bulunamayan dönem null
         kalır ve panel damgalı değeri korur (mevcut `c.g[i]!=null?c.g[i]:v` mantığı).
         Fon çapa tarihinde henüz kurulmamışsa (yeni fon) o dönem doğal olarak boş. */
      const don = (ad)=>{
        const t = capa[ad] && capa[ad][kod];
        return (t && t.fiyat>0) ? +(((son.fiyat/t.fiyat)-1)*100).toFixed(4) : null;
      };
      items[kod] = {
        fiyat:+son.fiyat, tarih:String(son.tarih),
        g:[g1, don('1A'), don('3A'), don('YTD'), don('1Y'), don('3Y')],
        b: son.portfoyBuyukluk!=null ? +son.portfoyBuyukluk : null,
        ys: son.kisiSayisi!=null ? +son.kisiSayisi : null
      };
    }
    const say = Object.keys(items).length;
    /* §141: yanıt artık VERİNİN tarihini de taşıyor. Panel damgası şimdiye kadar
       ÇEKİM SAATİNİ gösteriyordu ("canlı · 09:15") — kullanıcı bugünün verisi
       sanıyordu, oysa TEFAS fon fiyatını BİR GÜN GECİKMELİ yayınlar. Artık
       verinin kendi tarihi ve kaç gün geride olduğu ekranda görünür. */
    const tarihler = Object.values(items).map(x=>tarihMs(x.tarih)).filter(x=>x>0);
    const enYeni = tarihler.length ? Math.max.apply(null, tarihler) : 0;
    const gunFark = enYeni ? Math.round((Date.now()-enYeni)/86400000) : null;
    return res.status(200).json({ ok: say>0, alinma:new Date().toISOString(), adet:say,
      veriTarihi: enYeni ? new Date(enYeni).toISOString().slice(0,10) : null,
      veriYasiGun: gunFark,
      /* §142: hangi dönemlerin CANLI hesaplandığı. Bir pencere düşerse o dönem
         listede olmaz ve panel damgalıyı gösterdiğini bilir — sessiz karışım olmaz. */
      canliDonem: ['1G'].concat(PENCERE.slice(1).filter(w=>capa[w.ad]).map(w=>w.ad)),
      kaynak:'TEFAS fonGnlBlgSiraliGetir (yeni API)', items,
      /* §142: `bosMesaj` eski TEK-İSTEK kodunda tanımlıydı; çok pencereli akışa
         geçerken o blok silindi ama BURADAKİ KULLANIMI KALDI → ReferenceError.
         node --check geçiyordu çünkü sözdizimi geçerli (§136'nın aynı sınıfı).
         Artık pencere sonuçlarından türetiliyor. */
      ...(say?{}:{err:'fon çözülemedi (TEFAS boş dönem / tatil olabilir)'}) });
  }catch(e){
    return res.status(200).json({ ok:false, err:'TEFAS: '+String(e.message||e).slice(0,120), items:{} });
  }
};
