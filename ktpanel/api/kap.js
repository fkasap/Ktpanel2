// /api/kap — KAP canlı bildirim akışı
// Uç: POST /tr/api/disclosure/members/byCriteria (topluluk keşfi, doğrulama: 2026-05-28)
// WAF notları: Referer zorunlu; session warmup (GET /tr/bildirim-sorgu) çerezleri yardımcı olur.
// Cache: 9 dk. Kırılırsa {ok:false, items:[]} — UI ayakta kalır.

// Türkçe güvenli küçültme: İ→i, I→ı (JS i-bayrağı Türkçe İ'yi eşleştirmez)
const kucult = s => String(s||'').replace(/İ/g,'i').replace(/I/g,'ı').toLowerCase();
const POZ = /(yeni iş ilişkisi|sözleşme imza|ihale|sipariş|iş al[ıi]m|teşvik|geri al[ıi]m|geri alınmas|temettü|kâr payı|kar payı|üretime başla|kapasite art|yatırım karar|not art[ıi]r|endeks(ler)?ine dahil)/;
const NEG = /(fesih|fesh|sona erme|iptal|dava|ceza|idari para|zarar|hasar|yangın|iflas|konkordato|not indirim|tedbir|durdurma karar)/;
const ONEMLI = /(yeni iş ilişkisi|sözleşme|ihale|sipariş|birleşme|devral|bölünme|pay geri al|temettü|kâr payı|kar payı|sermaye art|finansal rapor|faaliyet raporu|bilanço|yatırım karar|teşvik|üretime başla|maddi duran varlık|devre kesici|dava|ceza|hasar|iptal|fesih|fesh)/;
function sinifla(baslik, tip){
  const b = kucult(baslik);
  let yon = 0;
  if (POZ.test(b)) yon = 1;
  if (NEG.test(b)) yon = -1; // ihtiyatlılık: negatif pozitifi ezer
  let onem = 0;
  if (tip === 'FR' || ONEMLI.test(b)) onem = 2;
  else if (tip === 'ODA' || tip === 'CA') onem = 1;
  return [onem, yon];
}

// "26.05.2026 09:10:35" → ISO (İstanbul, UTC+3)
function trTarih(s){
  const m = String(s||'').match(/(\d{2})\.(\d{2})\.(\d{4})[ T]?(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!m) return '';
  return `${m[3]}-${m[2]}-${m[1]}T${m[4]}:${m[5]}:${m[6]||'00'}+03:00`;
}

function normalize(b){
  const kodRaw = b.stockCodes || b.relatedStocks || '';
  const kodlar = String(kodRaw).split(/[,;\s]+/).map(s=>s.trim().toUpperCase()).filter(s=>/^[A-Z]{3,6}$/.test(s));
  const baslik = b.subject || b.summary || b.disclosureCategory || '';
  const tipRaw = String(b.disclosureType || b.disclosureCategory || '').toUpperCase();
  const tip = ['FR','ODA','DUY','DG','CA','FON','DKB'].find(t=>tipRaw.includes(t)) || 'DG';
  if (!kodlar.length || !baslik) return null;
  const [onem, yon] = sinifla(baslik, tip);
  return { k: kodlar, b: String(baslik).slice(0,180) + (b.kapTitle && !b.stockCodes ? ' — '+String(b.kapTitle).slice(0,60) : ''),
           t: tip, o: onem, y: yon, ts: trTarih(b.publishDate),
           url: b.disclosureIndex ? ('https://www.kap.org.tr/tr/Bildirim/'+b.disclosureIndex) : 'https://www.kap.org.tr',
           i: b.disclosureIndex || 0 };
}

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

// Vercel Hobby 12-fonksiyon sınırı: yorumlu akış buradan yönlendirilir → ?mod=yorum
// ?mod=sukuk → api/_lib/sukuk.js (özel sektör kira sertifikası akışı)
//
// §199b MODÜL KARIŞIKLIĞI. Bu dosya ESM (`export default`) ama alt modülleri
// `require()` ile alıyordu. ESM'de `require` TANIMLI DEĞİLDİR — modül yüklenirken
// ReferenceError atar ve /api/kap TÜM modlarıyla birlikte ölür. Alt modüller
// CommonJS (`module.exports`), bu yüzden dinamik `import()` kullanılır: ESM'de
// çalışır ve CommonJS modülünü `.default` altında verir.
// TEMBEL YÜKLEME yan faydası: yalnız o mod istendiğinde yüklenir, soğuk başlangıç
// diğer modlarda daha hızlı.
async function _altModul(yol){
  const m = await import(yol);
  return m.default || m;
}
/* §208 ORTAK AYRIŞTIRICI — HTTP zincirlemesi KALDIRILDI.
   mod=ceyrek, mod=bilanco'yu KENDİ SİTESİNE İSTEK ATARAK çağırıyordu ve
   "cari bilanço alınamadı" veriyordu. İki sebep üst üste:
     (a) middleware tüm yolları koruyor; iç istekte çerez yok → 401
         (§199'daki aynı tuzak, bu sefer kendi eklediğim kodda)
     (b) maliyet: mod=fr(120g) sekiz dilim + iki adet 5 MB sayfa = süre aşımı
   ÇÖZÜM: ayrıştırma YEREL FONKSİYONA çıkarıldı. Artık ne middleware'e takılır,
   ne ağ turu ekler, ne CRON_SECRET gerektirir.
   DERS: kendi sunucusuna HTTP isteği atmak, aynı süreçte duran bir fonksiyonu
   çağırmanın pahalı ve kırılgan yoludur. */
const _BIN_KALIP = /^-?\(?\d{1,3}(\.\d{3})*\)?$/;
const _sayiCoz = (t) => {
  const ham = String(t).trim();
  if(!_BIN_KALIP.test(ham)) return null;              // dipnot referansı elenir (§206)
  const eksi = /^\(/.test(ham) || /^-/.test(ham);
  const n = parseFloat(ham.replace(/[()\-]/g,'').replace(/\./g,''));
  if(!isFinite(n)) return null;
  if(ham.indexOf('.') < 0 && n < 1000) return null;
  return eksi ? -n : n;
};
const _SANAYI = [
  ['ciro',        ['Hasılat','Satış Gelirleri']],
  ['brutKar',     ['Brüt Kar (Zarar)','Brüt Kâr (Zarar)','BRÜT KAR (ZARAR)']],
  ['faaliyetKar', ['Esas Faaliyet Karı (Zararı)','Faaliyet Karı (Zararı)','ESAS FAALİYET KARI (ZARARI)']],
  ['finansGider', ['Finansman Giderleri']],
  ['parasal',     ['Net Parasal Pozisyon Kazançları (Kayıpları)']],
  ['netKar',      ['Ana Ortaklık Payları']],
  ['ozkaynak',    ['Ana Ortaklığa Ait Özkaynaklar']],
  ['nakit',       ['Nakit ve Nakit Benzerleri']]
];
const _BANKA = [
  ['netFaiz',     ['NET FAİZ GELİRİ VEYA GİDERİ','NET FAİZ GELİRİ']],
  ['komisyon',    ['NET ÜCRET VE KOMİSYON GELİRLERİ VEYA GİDERLERİ']],
  ['karsilik',    ['Beklenen Zarar Karşılıkları (-)','Beklenen Zarar Karşılıkları']],
  ['faalKar',     ['NET FAALİYET KARI (ZARARI)']],
  ['netKar',      ['Grubun Karı (Zararı)','Ana Ortaklık Payları']],
  ['ozkaynak',    ['Ana Ortaklığa Ait Özkaynaklar','ÖZKAYNAKLAR']]
];
/* STOK kalemleri: bilanço anlık durumu gösterir, çeyrekliğe çevrilirken
   ÇIKARILMAZ. Akış kalemleri (gelir tablosu) birikir, çıkarılır (§207.3). */
const _STOK = new Set(['ozkaynak','nakit']);

async function _bilancoAyristir(id){
  const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';
  const r = await fetch('https://www.kap.org.tr/tr/Bildirim/'+id, {
    headers:{ 'user-agent':UA, 'accept':'text/html', 'referer':'https://www.kap.org.tr/tr/bildirim-sorgu' },
    signal: AbortSignal.timeout(22000) });
  if(!r.ok) return { ok:false, id, http:r.status, err:'sayfa alınamadı' };
  let h = await r.text();
  /* §210 TEK GEÇİŞ. Dört zincirli replace, 5 MB dizgenin DÖRT KOPYASINI
     üretiyordu (20 MB churn). İki sayfa paralel çekilince 40 MB+ oluyor ve
     serverless bellek/süre sınırında ikinci ayrıştırma sessizce düşüyordu.
     Tek regex + eşleme tablosu ile bir kopya yeter. */
  const KACIS = { '\\u003c':'<', '\\u003e':'>', '\\"':'"', '\\n':' ' };
  h = h.replace(/\\u003[ce]|\\"|\\n/g, m => KACIS[m] || m);
  const kalemBul = (etiketler) => {
    for(const e of etiketler){
      const kalip = new RegExp('>'+e.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\s*<\\/div>', 'g');
      let m;
      while((m = kalip.exec(h)) !== null){
        const dilim = h.slice(m.index, m.index + 3000);
        const hucreler = [...dilim.matchAll(/>([\-\(]?[\d.,]{3,})\s*</g)].map(x=>_sayiCoz(x[1])).filter(v=>v!==null);
        if(hucreler.length >= 1) return { deger:hucreler[0], onceki:hucreler[1] ?? null, etiket:e };
      }
    }
    return null;
  };
  const dene = (liste) => { const c={}; let dolu=0;
    liste.forEach(([ad,et])=>{ const v=kalemBul(et); c[ad]=v; if(v)dolu++; }); return {c,dolu}; };
  const sanayi = dene(_SANAYI), banka = dene(_BANKA);
  const sablon = banka.dolu > sanayi.dolu ? 'banka' : 'sanayi';
  const secili = sablon==='banka' ? banka : sanayi;
  const liste  = sablon==='banka' ? _BANKA : _SANAYI;
  const eksik = liste.filter(([ad])=>!secili.c[ad]).map(([ad])=>ad);
  return { ok: secili.dolu>0, id, sablon, bulunan:secili.dolu, toplam:liste.length,
    eksik, kalemler:secili.c,
    uyari: eksik.length ? eksik.length+' kalem bulunamadı — sayfa yapısı değişmiş olabilir' : null };
}

export default async function handler(req, res){
  const _mod = String((req.query && req.query.mod) || '').toLowerCase();
  if (_mod === 'yorum') return (await _altModul('./_lib/kapyorum.js'))(req, res);
  if (_mod === 'sukuk') return (await _altModul('./_lib/sukuk.js'))(req, res);
  /* §201 YOKLAMA: KAP yapısal finansal veri veriyor mu?
     Fintables'ın kaynağı KAP. Eğer KAP'ın finansal rapor uçları sunucudan
     erişilebiliyorsa, şu an Fintables'a bağımlı BEŞ katman birden çözülür:
     faktör modeli · multiple bilanço kalemleri · guidance · pay adedi ·
     beklenen bilanço takvimi. Tam otomasyonun önündeki asıl engel bu.
     Sandbox'tan kap.org.tr'ye erişim yok; yoklama SUNUCUDAN yapılmalı.
     ?mod=yokla → aday uçları dener, HTTP kodu + yanıt başlangıcı döner.
     Tahmin etmek yerine ölçmek (§145, §167). */
  /* §201b YOKLAMA v2 — ÇALIŞAN UÇTAN YÜRÜ.
     v1'de beş yol TAHMİN ettim, beşi de 404 döndü. Ama 404 iyi haberdi:
     sunucu KAP'a ULAŞIYOR (403/timeout değil), yalnız yollar yanlıştı.
     KAP bir Next.js uygulaması ve elimizde ZATEN ÇALIŞAN bir uç var:
       POST /tr/api/disclosure/members/byCriteria  (haber akışı bunu kullanıyor)
     Doğru yöntem: tahmin etmeyi bırak, çalışandan yürü. Önce o uçla TOASO'nun
     son FR bildirimini bul, sonra o bildirimin KİMLİĞİYLE detay uçlarını dene.
     Kimlik elde olunca yol tahmini gerekmiyor — bildirimin kendisi ne
     döndürdüğünü söyler. */
  /* §201c YOKLAMA v3 — CALISAN ISTEGI BIREBIR KOPYALA.
     v2'de gövdeyi yine TAHMIN ettim ve 500 aldım. İki hata vardı:
       · tarih biçimi DD.MM.YYYY yazmışım — çalışan kod YYYY-MM-DD kullanıyor
       · fazladan alan eklemişim (disclosureClass, year, prd, term)
       · pencereyi 120 gün yapmışım — çalışan kodun yorumu uyarıyordu:
         "son 2 günlük pencere (2000 tavanına uzak)"
     v3 kuralı: çalışan isteğin GÖVDESİNİ, BAŞLIKLARINI ve ÇEREZ ISINMASINI
     birebir al; yalnız PENCEREYİ genişlet ve FR süzgecini İSTEMCİ tarafında
     uygula. Sunucuya yeni bir alan gönderme.
     Bu, bugünkü "çalışandan yürü" dersinin üçüncü uygulaması — ilk ikisinde
     yine tahmin etmişim. */
  /* §202 ?mod=fr — FINANSAL RAPOR BILDIRIMLERI, DONEM BILGISIYLE.
     Yoklama v3 kanıtladı: byCriteria FR bildirimlerini TAM METADATA ile
     veriyor. Kullanılan alanlar:
       disclosureClass 'FR'  → başlık metni tahmin etmeye gerek yok
       stockCodes            → hisse kodu (virgüllü olabilir)
       year + period         → DÖNEM. Nöbet artık tarih toleransıyla değil
                               DÖNEMLE karşılaştırır (§197'deki 14 günlük hile
                               kalkar; aynı dönemin ikinci bildirimi zaten aynı
                               year/period taşır)
       isLate                → KAP'ın kendi gecikme bayrağı. ARENA'da (§181)
                               elle keşfettiğim 120 günlük deseni doğrudan verir
       disclosureIndex       → kimlik, KAP bağlantısı için
     PENCERE: varsayılan 7 gün. KAP'ın 2000 kayıt tavanı var; 7 günde 1978
     kayıt geldi, yani tavan ZORLANIYOR. gun>10 istenirse iki dilime bölünür. */
  if (_mod === 'fr') {
    /* §209 TARİH ARALIĞI. `gun` yalnız BUGÜNDEN geriye bakıyordu; geçmiş bir
       çeyreğin bildirimini bulmak imkânsızdı (TOASO 1Ç26 nisan sonunda).
       Artık ?bas=YYYY-MM-DD&son=YYYY-MM-DD ile herhangi bir pencere taranır.
       `kod` verilirse yalnız o hisse döner — 2000 tavanına takılmadan geniş
       aralık taramak için. */
    const gunIst = Math.min(Math.max(parseInt(req.query && req.query.gun) || 7, 1), 40);
    const basIst = String((req.query && req.query.bas) || '').slice(0,10);
    const sonIst = String((req.query && req.query.son) || '').slice(0,10);
    const kodSuz = String((req.query && req.query.kod) || '').toUpperCase().replace(/[^A-Z]/g,'').slice(0,6);
    const ARALIK = /^\d{4}-\d{2}-\d{2}$/.test(basIst) && /^\d{4}-\d{2}-\d{2}$/.test(sonIst);
    const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';
    let cookie = '';
    try{
      const w = await fetch('https://www.kap.org.tr/tr/bildirim-sorgu', { headers:{ 'user-agent':UA }, signal:AbortSignal.timeout(8000) });
      const sc = w.headers.get('set-cookie');
      if(sc) cookie = sc.split(',').map(x=>x.split(';')[0]).join('; ');
    }catch(e){}

    const GUN = 86400000, simdi = Date.now();
    const iso = t => new Date(t).toISOString().slice(0,10);
    /* DİLİMLEME: 7 günde 1978 kayıt geldi, tavan 2000. Daha geniş pencere
       istenirse 5 günlük dilimlere bölünür — §168'deki Finnhub dersinin aynısı:
       "veri gelmiyor" demeden önce SINIRA çarpıp çarpmadığına bak. */
    const dilimler = [];
    /* DİLİM BOYU: varsayılan 5 gün. Ölçüldü — nisan-mayıs bilanço sezonunda
       5 günlük dilimler 2000 tavanına ÇARPIYOR (üç dilim birden). Yoğun
       dönemde ?dilim=2 ile daraltılabilir. */
    const dilimGun = Math.min(Math.max(parseInt(req.query && req.query.dilim) || 5, 1), 10);
    if(ARALIK){
      const b0 = new Date(basIst+'T00:00:00Z').getTime(), s0 = new Date(sonIst+'T00:00:00Z').getTime();
      for(let t = s0; t > b0; t -= dilimGun*GUN) dilimler.push([Math.max(t-dilimGun*GUN, b0), t]);
    } else {
      for(let b = gunIst; b > 0; b -= dilimGun) dilimler.push([Math.max(b-dilimGun,0), b]);
    }
    const ham = [], hatalar = [];
    for(const [bas, son] of dilimler){
      try{
        const r = await fetch('https://www.kap.org.tr/tr/api/disclosure/members/byCriteria', {
          method:'POST',
          headers:{ 'content-type':'application/json', 'accept':'application/json',
                    'referer':'https://www.kap.org.tr/tr/bildirim-sorgu', 'user-agent':UA,
                    ...(cookie ? { 'cookie': cookie } : {}) },
          body: JSON.stringify({
            fromDate: ARALIK ? iso(bas) : iso(simdi - son*GUN),
            toDate:   ARALIK ? iso(son) : iso(simdi - bas*GUN),
            mkkMemberOidList: [], subjectList: [] }),
          signal: AbortSignal.timeout(12000)
        });
        if(!r.ok){ hatalar.push('HTTP '+r.status+' ('+bas+'-'+son+'g)'); continue; }
        const j = await r.json();
        const d = Array.isArray(j) ? j : (j.items || j.data || []);
        ham.push(...d);
        /* §210c UYARIYI OKUNUR YAP. Aralık modunda bas/son ZAMAN DAMGASI;
           ham basılınca "1778457600000-1778889600000g" gibi anlamsız çıkıyordu.
           Bir uyarı okunamıyorsa yok sayılır. */
        const etiket = ARALIK ? (iso(bas)+' → '+iso(son)) : (bas+'-'+son+' gün önce');
        if(d.length >= 1990) hatalar.push('['+etiket+'] TAVANA ÇARPTI ('+d.length+' kayıt) — bu aralıkta bildirim eksik olabilir, daha dar pencere dene');
      }catch(e){ hatalar.push(String(e.message||e).slice(0,80)+' ('+bas+'-'+son+'g)'); }
    }

    /* §203 GECİKMEYİ KENDİMİZ HESAPLA — isLate GÜVENİLMEZ.
       Ölçüldü: ARENA 1Ç26'yı dönem sonundan 120 GÜN sonra açıkladı ama
       isLate=false geldi. Aynı şekilde KARTN 211 gün, GEDIK 575 gün — hepsi
       false. isLate KAP'ın kendi iç kuralı; SPK bildirim süresini ölçmüyor.
       §181'de ARENA'nın 120 gününü dokuz çeyreğin tarihini tek tek
       hesaplayarak bulmuştum; burada aynı hesap tek satır.
       DÖNEM SONU: 1→31 Mar · 2→30 Haz · 3→30 Eyl · 4/Yıllık→31 Ara.
       EŞİK: SPK sınırı konsolide için ~70 gün. 80 günü aşan GECİKMİŞ sayılır
       (tampon bırakıldı, sınır dönem tipine göre değişiyor). */
    const DONEM_SONU = { 1:[2,31], 2:[5,30], 3:[8,30], 4:[11,31] };
    const gecikmeHesap = (yil, donem, tur, tarih) => {
      if(!yil || !tarih) return null;
      const yillikMi = /yıllık|yillik/i.test(String(tur||''));
      const [ay, gun] = yillikMi ? [11,31] : (DONEM_SONU[donem] || [11,31]);
      const son = new Date(Date.UTC(yil, ay, gun));
      const bil = new Date(tarih + 'T00:00:00Z');
      return Math.round((bil - son) / 86400000);
    };

    /* TEKİLLEŞTİRME: (kod, yıl, dönem) başına TEK kayıt, EN ERKEN olanı.
       Ölçüldü: TOASO 2026/2 için 29 Tem'de üç, 30 Tem'de bir bildirim var
       (TR/EN sürüm, düzeltme, ek belge). İlk bildirim ASIL açıklamadır;
       sonrakiler onun tekrarı. Nöbet ve gecikme hesabı ilkini kullanmalı.
       §197'deki "aynı dönemin ikinci bildirimi" sorunu kökten burada çözülür. */
    const kayit = new Map();
    ham.forEach(x => {
      if(String(x.disclosureClass||'').toUpperCase() !== 'FR') return;
      const idx = x.disclosureIndex;
      const kodlar = String(x.stockCodes||'').split(/[,;\s]+/).filter(Boolean);
      const tarih = String(x.publishDate||'').slice(0,10).split('.').reverse().join('-');
      const saat = String(x.publishDate||'').slice(11,16);
      kodlar.forEach(kRaw => {
        const kod = kRaw.toUpperCase();
        if(kodSuz && kod !== kodSuz) return;      // §209 kod süzgeci
        const anahtar = kod+'|'+x.year+'|'+x.period;
        const yeni = { kod, tarih, saat, yil:x.year, donem:x.period, tur:x.ruleType||null,
          gecikmeGun: gecikmeHesap(x.year, x.period, x.ruleType, tarih),
          id: idx, unvan: x.kapTitle || null, tekrar: 1,
          /* §211 TÜM KİMLİKLER. Tekilleştirme en erkeni tutuyordu ama EN ERKEN
             BİLDİRİM FİNANSAL TABLO OLMAYABİLİR — faaliyet raporu, ek belge ya
             da denetim raporu olabilir ve içinde bilanço tablosu bulunmaz.
             ÖLÇÜLDÜ: TOASO 1Ç26'da üç bildirim var; en erkeni (1601476)
             ayrıştırıldığında 0/8 kalem çıktı. 2Ç26'da yedi bildirim vardı ve
             işleyen (1639026) ORTADAKİYDİ.
             Artık hepsi `idler` dizisinde; ayrıştırıcı sırayla dener. */
          idler: [idx],
          url: idx ? 'https://www.kap.org.tr/tr/Bildirim/'+idx : null };
        yeni.gec = yeni.gecikmeGun != null && yeni.gecikmeGun > 80;
        const eski = kayit.get(anahtar);
        if(!eski){ kayit.set(anahtar, yeni); return; }
        eski.tekrar++;
        if(eski.idler.indexOf(idx) < 0) eski.idler.push(idx);
        /* EN ERKEN gösterilir (gecikme hesabı ona göre) ama TÜM kimlikler
           saklanır — hangisinin finansal tablo olduğu ancak denenerek bulunur. */
        if(yeni.tarih < eski.tarih || (yeni.tarih === eski.tarih && yeni.saat < eski.saat)){
          yeni.tekrar = eski.tekrar; yeni.idler = eski.idler;
          kayit.set(anahtar, yeni);
        }
      });
    });
    const fr = [...kayit.values()].sort((a,b)=>
      a.tarih < b.tarih ? 1 : a.tarih > b.tarih ? -1 : (a.saat < b.saat ? 1 : -1));

    res.setHeader('Cache-Control','s-maxage=540, stale-while-revalidate=1800');
    return res.status(200).json({ ok: fr.length>0, kaynak:'byCriteria/FR',
      pencere: ARALIK ? (basIst+' → '+sonIst) : (gunIst+' gün'),
      kodSuzgeci: kodSuz || null, gun:gunIst,
      taranan: ham.length, dilim: dilimler.length,
      hamBildirim: ham.filter(x=>String(x.disclosureClass||'').toUpperCase()==='FR').length,
      bildirim: fr.length,                       // tekilleştirilmiş
      gecikmis: fr.filter(x=>x.gec).length,      // >80 gün, HESAPLANMIŞ
      not_isLate: 'KAP isLate alanı kullanılmıyor — ARENA 120 gün geç açıkladı ama false geliyordu',
      uyari: hatalar.length ? hatalar : null, fr });
  }

  /* §204 ?mod=kalem — BILDIRIM SAYFASINDA KALEM VAR MI?
     Zincirin tek engeli: bilanço kalemleri. /tr/api/disclosure/<id> 404 verdi
     ama /tr/Bildirim/<id> 200 + 162 KB HTML döndü. KAP'ın kendi görüntüleyicisi
     tabloları orada gösteriyor; Next.js sayfası veriyi ya __NEXT_DATA__ içinde
     ya da RSC flight yükünde taşır.
     BU YOKLAMA: sayfayı çeker, BİLİNEN KALEM ETİKETLERİNİ arar ve nerede
     bulduğunu söyler. Etiket bulunuyorsa ayrıştırma mümkün demektir.
     ÖNEMLİ: sayfa yapısı değişebilir, bu yol KIRILGANDIR. Ama Fintables'a
     alternatif tek yol bu; önce VAR MI diye bakmak gerek. */
  /* §205 ?mod=bilanco — KALEMLERİ AYRIŞTIR. Zincirin son engeli.
     YOKLAMA SONUCU (mod=kalem, TOASO 1639026): 7 kalem etiketi bulundu,
     736 tablo, 580 bin-ayraçlı sayı, Next.js RSC flight yükü (5 MB).
     YAPI: KAP'ın finansal rapor görüntüleyicisi GWT tabanlı ve flight yükünün
     içinde KAÇIRILMIŞ HTML olarak duruyor:
       <div class="...content-tr">ETİKET</div></td><td...><div>DEĞER</div></td>
     AYRIŞTIRMA: kaçışları çöz → etiketi bul → sonraki hücrelerdeki sayıları al.
     Genelde iki sütun var: CARİ dönem ve ÖNCEKİ dönem.
     KIRILGANLIK: sayfa yapısı değişirse kırılır. Bu yüzden her kalem için
     BULUNDU/BULUNAMADI raporlanır ve eksik kalem SESSİZCE atlanmaz —
     yarım bilanço, yanlış bilançodan iyidir ama ancak EKSİĞİ SÖYLERSE. */
  /* §207 ?mod=ceyrek — DÖNEMSELİ ÇEYREKLİĞE ÇEVİR.
     ÇAPRAZ DENETİM SONUCU (TOASO 1639026): sekiz kalemin hepsi Fintables ile
     BİREBİR tuttu. Üç kalem toplam yoluyla da doğrulandı:
       1Ç26 101.780.929 + 2Ç26 100.016.179 = 201.797.108 = KAP ✓
     AMA KAP DÖNEMSEL (kümülatif) veriyor: "6 Aylık" satırı iki çeyreğin
     toplamıdır. Kart için ÇEYREKLİK gerekir — TOASO'nun 2Ç cirosu 100 mlr,
     201,8 değil.
     ÇEYREKLİK = bu dönemin kümülatifi − önceki dönemin kümülatifi.
     Bu yüzden İKİ bildirim çekilir: cari (2026/2) ve bir önceki (2026/1).
     1. dönem zaten çeyrekliktir, çıkarma yapılmaz.
     4. dönem/Yıllık için önceki 3. dönemdir.
     KARŞILAŞTIRMA DÖNEMİ: her bildirimin `onceki` alanı geçen yılın aynı
     kümülatifidir; aynı çıkarma onda da yapılır, y/y çeyreklik çıkar. */
  /* §208b ?mod=ceyrek — KİMLİKLER DIŞARIDAN GELİR.
     İlk sürüm mod=fr'yi 120 günle çağırıp kimlikleri kendi buluyordu:
     sekiz dilim + iki adet 5 MB sayfa = süre aşımı. Üstelik iç HTTP isteği
     middleware'e takılıyordu.
     ARTIK: kimlikleri çağıran verir (mod=fr çıktısında zaten var) ve
     ayrıştırma YEREL fonksiyonla yapılır. Tek ağ işi iki KAP sayfası.
     Kullanım:  ?mod=ceyrek&id=<cari>&onceki=<bir önceki dönem>
     `onceki` verilmezse yalnız kümülatif döner — 1. dönem için doğrudur. */
  if (_mod === 'ceyrek') {
    const id  = String((req.query && req.query.id) || '').replace(/[^0-9]/g,'').slice(0,10);
    /* §211c VİRGÜL KORUNMALI. §211'de `onceki` parametresine virgüllü liste
       desteği ekledim ama BURADAKİ temizleyiciyi düzeltmeyi unuttum:
       [^0-9] virgülü de siliyordu ve "1601476,1601475,1601474" önce
       "160147616014751601474" oluyor, sonra slice(0,10) ile "1601476160"
       kalıyordu — var olmayan bir kimlik.
       Bir yeri değiştirip diğerini bırakmak: bu oturumun en sık hatası
       (§129 alan silme · §189 kısmi yükleme · şimdi bu). */
    const onc = String((req.query && req.query.onceki) || '').replace(/[^0-9,]/g,'').slice(0,80);
    if(!id) return res.status(400).json({ ok:false, err:'id gerekli — /api/kap?mod=fr çıktısındaki id' });
    try{
      /* §210b SIRAYLA, PARALEL DEĞİL. İki 5 MB sayfayı aynı anda işlemek
         belleği zorluyordu; ikinci ayrıştırma SESSİZCE düşüyor ve yalnız
         "ayrıştırılamadı" diyordu — sebep yok. Sıralı çekim hem hafif hem
         hangi adımda düştüğü belli. */
      const b1 = await _bilancoAyristir(id);
      if(!b1 || !b1.ok) return res.status(200).json({ ok:false, id, err:'cari bilanço ayrıştırılamadı', detay:b1 });
      /* §211b BİRDEN FAZLA KİMLİK DENE. `onceki` virgülle ayrık liste alabilir
         (mod=fr çıktısındaki `idler`). İlk ayrışan kullanılır. En erken bildirim
         çoğu zaman faaliyet raporudur; finansal tablo genelde sonrakilerdedir. */
      let b0 = null, b0Hata = null, b0Kullanilan = null;
      const oncListe = onc.split(',').map(x=>x.replace(/[^0-9]/g,'')).filter(Boolean).slice(0,6);
      const denemeler = [];
      for(const oid of oncListe){
        try{
          const d = await _bilancoAyristir(oid);
          denemeler.push({ id:oid, bulunan:(d&&d.bulunan)||0, ok:!!(d&&d.ok) });
          if(d && d.ok){ b0 = d; b0Kullanilan = oid; break; }
        }catch(e){ denemeler.push({ id:oid, hata:String(e.message||e).slice(0,60) }); }
      }
      if(oncListe.length && !b0) b0Hata = oncListe.length+' kimlik denendi, hiçbirinde kalem yok';

      const cikar = (a,b) => (a==null) ? null : (b==null ? a : a-b);
      const kumulatif = {}, ceyreklik = {};
      Object.keys(b1.kalemler||{}).forEach(k=>{
        const c = b1.kalemler[k]; if(!c) return;
        kumulatif[k] = { deger:c.deger, onceki:c.onceki };
        if(_STOK.has(k)){ ceyreklik[k] = { deger:c.deger, onceki:c.onceki, tur:'stok' }; return; }
        if(!onc){ ceyreklik[k] = { deger:c.deger, onceki:c.onceki, tur:'kümülatif (önceki dönem verilmedi)' }; return; }
        const p = (b0 && b0.ok && b0.kalemler[k]) || null;
        if(!p){ ceyreklik[k] = { deger:null, onceki:null, tur:'hesaplanamadı' }; return; }
        ceyreklik[k] = { deger: cikar(c.deger,p.deger), onceki: cikar(c.onceki,p.onceki), tur:'ceyreklik' };
      });

      res.setHeader('Cache-Control','s-maxage=86400, stale-while-revalidate=604800');
      return res.status(200).json({ ok:true, id, oncekiId:b0Kullanilan||onc||null, sablon:b1.sablon,
        bulunan:b1.bulunan, toplam:b1.toplam, eksik:b1.eksik,
        kumulatif, ceyreklik,
        /* SEBEBİ SÖYLE — "ayrıştırılamadı" tek başına işe yaramaz (§145) */
        oncekiDurum: onc ? (b0 && b0.ok
          ? { ok:true, kullanilan:b0Kullanilan, bulunan:b0.bulunan, sablon:b0.sablon, denemeler }
          : { ok:false, sebep:b0Hata || 'bilinmiyor', denemeler }) : null,
        uyari: (onc && (!b0 || !b0.ok)) ? ('önceki dönem ayrıştırılamadı ('+(b0Hata||'sebep bilinmiyor')+') — çeyreklik yok, kümülatif var') : b1.uyari,
        not: 'kumulatif = KAP dönemsel · ceyreklik = cari − önceki. STOK kalemleri (özkaynak, nakit) çıkarılmaz. Birim BİN TL.' });
    }catch(e){ return res.status(200).json({ ok:false, id, hata:String(e.message||e).slice(0,140) }); }
  }

  if (_mod === 'bilanco') {
    const id = String((req.query && req.query.id) || '').replace(/[^0-9]/g,'').slice(0,10);
    if(!id) return res.status(400).json({ ok:false, err:'id gerekli — /api/kap?mod=fr ile bul' });
    try{
      const c = await _bilancoAyristir(id);
      res.setHeader('Cache-Control','s-maxage=86400, stale-while-revalidate=604800');
      return res.status(200).json({ ...c, not:'deger = cari dönem · onceki = karşılaştırma dönemi. Birim BİN TL.' });
    }catch(e){ return res.status(200).json({ ok:false, id, hata:String(e.message||e).slice(0,140) }); }
  }

  if (_mod === 'kalem') {
    const id = String((req.query && req.query.id) || '1639026').replace(/[^0-9]/g,'').slice(0,10);
    const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';
    const cikti = { ok:true, mod:'kalem', id, bulgu:[] };
    try{
      const r = await fetch('https://www.kap.org.tr/tr/Bildirim/'+id, {
        headers:{ 'user-agent':UA, 'accept':'text/html', 'referer':'https://www.kap.org.tr/tr/bildirim-sorgu' },
        signal: AbortSignal.timeout(15000) });
      const h = await r.text();
      cikti.http = r.status; cikti.uzunluk = h.length;

      /* 1) Veri kapsayıcıları — Next.js iki biçimden birini kullanır */
      cikti.kapsayici = {
        nextData: h.indexOf('__NEXT_DATA__') >= 0,
        flight: h.indexOf('self.__next_f') >= 0,
        scriptSayisi: (h.match(/<script/g)||[]).length,
        tabloSayisi: (h.match(/<table/g)||[]).length
      };

      /* 2) BİLİNEN KALEM ETİKETLERİ — Fintables'ta kullandıklarımın aynısı */
      const ETIKET = ['Satış Gelirleri','Brüt Kar','Brüt Kâr','FAVÖK','Faaliyet Karı',
        'Faaliyet Kârı','Ana Ortaklık Payları','Net Dönem Karı','Dönem Karı',
        'Finansman Giderleri','Net Parasal Pozisyon','Toplam Varlıklar','Özkaynaklar',
        'NET FAİZ GELİRİ','Beklenen Zarar Karşılıkları','Nakit ve Nakit Benzerleri'];
      ETIKET.forEach(e=>{
        const i = h.indexOf(e);
        if(i >= 0) cikti.bulgu.push({ etiket:e, konum:i, cevre: h.slice(Math.max(0,i-60), i+140).replace(/\s+/g,' ') });
      });

      /* 3) Sayı deseni — kalem varsa yanında büyük sayılar olmalı */
      const sayilar = h.match(/[-]?\d{1,3}(\.\d{3}){2,}/g);
      cikti.buyukSayi = sayilar ? { adet:sayilar.length, ornek:sayilar.slice(0,6) } : null;

      cikti.sonuc = cikti.bulgu.length
        ? cikti.bulgu.length+' kalem etiketi BULUNDU — ayrıştırma mümkün görünüyor'
        : 'kalem etiketi YOK — veri sayfada değil, ek dosyada olabilir (attachmentCount)';
    }catch(e){ cikti.ok=false; cikti.hata = String(e.message||e).slice(0,140); }
    return res.status(200).json(cikti);
  }

  if (_mod === 'yokla') {
    const kod = String((req.query && req.query.kod) || 'TOASO').toUpperCase().replace(/[^A-Z]/g,'').slice(0,6);
    const gunSayi = Math.min(Math.max(parseInt(req.query && req.query.gun) || 7, 1), 30);
    const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';
    const cikti = { ok:true, yokla:'v3', kod, gun:gunSayi, adim:[] };

    // 0) Çerez ısınması — çalışan kod bunu yapıyor, WAF'ı yumuşatıyor
    let cookie = '';
    try{
      const w = await fetch('https://www.kap.org.tr/tr/bildirim-sorgu', {
        headers:{ 'user-agent':UA }, signal:AbortSignal.timeout(8000) });
      const sc = w.headers.get('set-cookie');
      if(sc) cookie = sc.split(',').map(x=>x.split(';')[0]).join('; ');
      cikti.adim.push({ ad:'0-isinma', http:w.status, cerez: cookie ? 'alindi' : 'yok' });
    }catch(e){ cikti.adim.push({ ad:'0-isinma', hata:String(e.message||e).slice(0,90) }); }

    // 1) byCriteria — ÇALIŞAN gövdenin AYNISI, yalnız pencere geniş
    let dizi = [];
    try{
      const gun = 86400000, simdi = new Date();
      const tarih = d => d.toISOString().slice(0,10);          // YYYY-MM-DD — çalışan biçim
      const govde = { fromDate: tarih(new Date(simdi - gunSayi*gun)), toDate: tarih(simdi),
                      mkkMemberOidList: [], subjectList: [] }; // FAZLADAN ALAN YOK
      const r = await fetch('https://www.kap.org.tr/tr/api/disclosure/members/byCriteria', {
        method:'POST',
        headers:{ 'content-type':'application/json', 'accept':'application/json',
                  'referer':'https://www.kap.org.tr/tr/bildirim-sorgu', 'user-agent':UA,
                  ...(cookie ? { 'cookie': cookie } : {}) },
        body: JSON.stringify(govde), signal: AbortSignal.timeout(12000)
      });
      const t = await r.text();
      let j=null; try{ j=JSON.parse(t); }catch(e){}
      dizi = Array.isArray(j) ? j : (j && (j.items||j.data)) || [];
      cikti.adim.push({ ad:'1-liste', http:r.status, kayit:dizi.length,
        alanlar: dizi[0] ? Object.keys(dizi[0]) : null,
        bas: j ? null : t.slice(0,200) });
    }catch(e){ cikti.adim.push({ ad:'1-liste', hata:String(e.message||e).slice(0,120) }); }

    // 2) FR ve kod süzgeci — İSTEMCİ tarafında
    const metin = x => JSON.stringify(x).toUpperCase();
    const frler = dizi.filter(x => /FINANSAL RAPOR|FINANSAL TABLO|"FR"/.test(metin(x)));
    const bizim = frler.filter(x => metin(x).indexOf(kod) >= 0);
    cikti.adim.push({ ad:'2-suzgec', toplam:dizi.length, frSayisi:frler.length, kodEslesen:bizim.length,
      ornekFR: frler[0] ? JSON.stringify(frler[0]).slice(0,400) : null });

    // 3) Kimlikle detay
    const b = bizim[0] || frler[0];
    const kimlik = b && (b.disclosureIndex || b.id || b.index || b.oid || b.disclosureId);
    if(kimlik){
      for(const u of ['https://www.kap.org.tr/tr/api/disclosure/'+kimlik,
                      'https://www.kap.org.tr/tr/Bildirim/'+kimlik]){
        try{
          const r = await fetch(u, { headers:{ 'accept':'application/json, text/html', 'user-agent':UA,
            'referer':'https://www.kap.org.tr/tr/bildirim-sorgu', ...(cookie?{cookie}:{}) },
            signal:AbortSignal.timeout(9000) });
          const t = await r.text();
          cikti.adim.push({ ad:'3-detay', url:u, http:r.status, uzunluk:t.length,
            json:(t.trim()[0]==='{'||t.trim()[0]==='['), bas:t.slice(0,180) });
        }catch(e){ cikti.adim.push({ ad:'3-detay', url:u, hata:String(e.message||e).slice(0,90) }); }
      }
    } else cikti.adim.push({ ad:'3-detay', atlandi:'kimlik yok — 2. adımın ornekFR alanına bak' });

    cikti.not = '1-liste kayit>0 ise FR listesi erisilebilir. 3-detay json:true ise bilanco kalemi gelebilir.';
    return res.status(200).json(cikti);
  }
  res.setHeader('Cache-Control', 's-maxage=540, stale-while-revalidate=300');
  res.setHeader('Access-Control-Allow-Origin', '*');
  try{
    // 1) Session warmup — çerez topla (WAF yumuşatıcı)
    let cookie = '';
    try{
      const w = await fetch('https://www.kap.org.tr/tr/bildirim-sorgu', {
        headers: { 'user-agent': UA, 'accept': 'text/html' }, signal: AbortSignal.timeout(6000) });
      const sc = w.headers.getSetCookie ? w.headers.getSetCookie() : [];
      cookie = sc.map(c=>c.split(';')[0]).join('; ');
    }catch(e){ /* warmup başarısızsa çerezsiz dene */ }

    // 2) byCriteria — son 2 günlük pencere (2000 tavanına uzak)
    const gun = 86400000, simdi = new Date();
    const tarih = d => d.toISOString().slice(0,10);
    const govde = { fromDate: tarih(new Date(simdi - 2*gun)), toDate: tarih(simdi), mkkMemberOidList: [], subjectList: [] };
    const r = await fetch('https://www.kap.org.tr/tr/api/disclosure/members/byCriteria', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'accept': 'application/json',
        'referer': 'https://www.kap.org.tr/tr/bildirim-sorgu',
        'user-agent': UA,
        ...(cookie ? { 'cookie': cookie } : {})
      },
      body: JSON.stringify(govde),
      signal: AbortSignal.timeout(9000)
    });
    if (!r.ok) throw new Error('KAP HTTP '+r.status);
    const j = await r.json();
    const dizi = Array.isArray(j) ? j : (j.items || j.data || []);
    const items = dizi.map(normalize).filter(Boolean)
      .sort((a,b)=>b.i-a.i).slice(0, 150);
    return res.status(200).json({ ok: items.length>0, kaynak:'byCriteria', alinma:new Date().toISOString(),
      pencere: govde.fromDate+'..'+govde.toDate, items,
      ...(items.length ? {} : { err:'Uç yanıt verdi ama kayıt çözülemedi (şema değişmiş olabilir)' }) });
  }catch(e){
    return res.status(200).json({ ok:false, err:'KAP kaynağına ulaşılamadı: '+String(e.message||e).slice(0,120), alinma:new Date().toISOString(), items:[] });
  }
}
