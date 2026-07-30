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
    const gunIst = Math.min(Math.max(parseInt(req.query && req.query.gun) || 7, 1), 40);
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
    for(let b = gunIst; b > 0; b -= 5) dilimler.push([Math.max(b-5,0), b]);
    const ham = [], hatalar = [];
    for(const [bas, son] of dilimler){
      try{
        const r = await fetch('https://www.kap.org.tr/tr/api/disclosure/members/byCriteria', {
          method:'POST',
          headers:{ 'content-type':'application/json', 'accept':'application/json',
                    'referer':'https://www.kap.org.tr/tr/bildirim-sorgu', 'user-agent':UA,
                    ...(cookie ? { 'cookie': cookie } : {}) },
          body: JSON.stringify({ fromDate: iso(simdi - son*GUN), toDate: iso(simdi - bas*GUN),
                                 mkkMemberOidList: [], subjectList: [] }),
          signal: AbortSignal.timeout(12000)
        });
        if(!r.ok){ hatalar.push('HTTP '+r.status+' ('+bas+'-'+son+'g)'); continue; }
        const j = await r.json();
        const d = Array.isArray(j) ? j : (j.items || j.data || []);
        ham.push(...d);
        if(d.length >= 1990) hatalar.push('dilim '+bas+'-'+son+'g TAVANA ÇARPTI ('+d.length+') — kayıt eksik olabilir');
      }catch(e){ hatalar.push(String(e.message||e).slice(0,80)+' ('+bas+'-'+son+'g)'); }
    }

    const gorulen = new Set(), fr = [];
    ham.forEach(x => {
      if(String(x.disclosureClass||'').toUpperCase() !== 'FR') return;
      const idx = x.disclosureIndex;
      if(gorulen.has(idx)) return; gorulen.add(idx);
      /* stockCodes virgüllü olabilir (holding + bağlı ortaklık) — hepsi ayrı satır */
      const kodlar = String(x.stockCodes||'').split(/[,;\s]+/).filter(Boolean);
      const tarih = String(x.publishDate||'').slice(0,10).split('.').reverse().join('-');
      kodlar.forEach(k => fr.push({
        kod: k.toUpperCase(), tarih, saat: String(x.publishDate||'').slice(11,16),
        yil: x.year, donem: x.period, tur: x.ruleType || null,
        gec: !!x.isLate, id: idx, unvan: x.kapTitle || null,
        url: idx ? 'https://www.kap.org.tr/tr/Bildirim/'+idx : null
      }));
    });
    fr.sort((a,b)=> a.tarih < b.tarih ? 1 : a.tarih > b.tarih ? -1 : 0);

    res.setHeader('Cache-Control','s-maxage=540, stale-while-revalidate=1800');
    return res.status(200).json({ ok: fr.length>0, kaynak:'byCriteria/FR', gun:gunIst,
      taranan: ham.length, dilim: dilimler.length, bildirim: fr.length,
      gecikmis: fr.filter(x=>x.gec).length,
      uyari: hatalar.length ? hatalar : null, fr });
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
