// Özel sektör kira sertifikası (sukuk) ihraç akışı — KAP canlı + statik zenginleştirme
// Erişim: /api/kap?mod=sukuk   (kap.js'ten yönlendirilir, ayrı fonksiyon slotu yakmaz)
//
// TASARIM (melez): KAP canlı akar ama başlığı jeneriktir ve ihraççı ünvanını vermez.
// Bu yüzden iki statik harita ile zenginleştirilir. Tanınmayan kod gelirse SAKLANMAZ —
// kodu ham haliyle gösterilir ve `bilinmeyenKodlar` alanında raporlanır ki haritayı
// ne zaman genişleteceğimizi bilelim.
//
// AYIRICI İŞARET: KAP, kira sertifikası bildirimlerini "(Faizsiz)" ekiyle işaretler;
// konvansiyonel tahviller "(Faiz İçeren)" olur. Ölçüldü (2026-07-24 /api/kap akışı).
//
// HAZİNE İHRAÇLARINA DOKUNMAZ: hazine-takvim.json ve hazineRender() ayrı katmandır.

// Varlık Kiralama Şirketi kod → ünvan.
// POLİTİKA: YALNIZCA TEYİTLİ KODLAR. Tahmini kod yazılmaz — yanlış bir eşleşme,
// panelde sessizce yanlış ihraççı adı gösterir ki bu, boş göstermekten kötüdür.
// Teyit edilmemiş kod geldiğinde "(ünvan haritada yok)" görünür ve bilinmeyenKodlar'da raporlanır.
// (İlk sürümde VKFVK/ZVKS/ALVKS/EMVKS/TDVKS/KLVKS tahmin edilmişti; VKFVK yanlış çıktı —
//  gerçek Vakıf kodu VAKVK. Hepsi kaldırıldı.)
const VKS = {
  'NURVK':'Nurol Varlık Kiralama',       // arşiv kaydı
  'TFNVK':'TF Varlık Kiralama',          // arşiv kaydı
  'KATVK':'Katılım Varlık Kiralama',     // arşiv kaydı
  'EKTVK':'EKT Varlık Kiralama',         // arşiv kaydı
  'HLVKS':'Halk Varlık Kiralama',        // arşiv kaydı
  'DGRVK':'Değer Varlık Kiralama',       // KAP teyitli 2026-07-24
  'VAKVK':'Vakıf Varlık Kiralama',       // KAP teyitli 2026-07-24 · fon kullanıcısı Vakıf Katılım Bankası
  'TEVKS':'Tera Varlık Kiralama'         // KAP teyitli 2026-07-24
};
// Bildirim başlığı → panelde gösterilecek tip rozeti.
// app.js tipRenk(): /Yeşil|Sürdürülebilir/→yeşil · /Dönemsel|Ödeme/→mavi · diğer→gri
const TIP = [
  [/yeşil|sürdürülebilir/i,              'Yeşil/Sürdürülebilir Kira Sertifikası'],
  [/kupon|kâr payı|kar payı|itfa|ödeme/i,'Dönemsel Kâr Payı Ödemesi'],
  [/ihraç tavan/i,                       'İhraç Tavanı Başvurusu'],
  [/tertip/i,                            'Tertip İhraç Belgesi'],
  [/nitelikli yatırımcı/i,               'Nitelikli Yatırımcıya Satış'],
  [/pay dışında/i,                       'Kira Sertifikası İşlemi']
];
const kucult = s => String(s||'').replace(/İ/g,'i').replace(/I/g,'ı').toLowerCase();
const vksMi  = k => Object.prototype.hasOwnProperty.call(VKS, String(k||'').toUpperCase())
                 || /^[A-Z]{2,4}(VK|VKS)$/.test(String(k||'').toUpperCase());

function tipBul(baslik){
  for (const [re, ad] of TIP) if (re.test(baslik)) return ad;
  return String(baslik||'').replace(/\s*—.*$/,'').slice(0,60) || 'Kira Sertifikası İşlemi';
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin','*');
  const kok = 'https://' + (req.headers['x-forwarded-host'] || req.headers.host);
  const gun = Math.max(parseInt(req.query && req.query.gun) || 30, 1);
  const limit = Math.min(Math.max(parseInt(req.query && req.query.limit) || 25, 1), 100);

  // 1) STATİK ARŞİV — canlı akış boşsa da liste dolu kalsın (damgalı yedek deseni)
  let statik = [], statikGun = null, statikKaynak = null;
  try{
    const r = await fetch(kok + '/sukuk-ihrac.json', { signal: AbortSignal.timeout(8000) });
    const d = await r.json();
    // Ünvanı haritadan normalize et: aynı kod canlı ve arşivde farklı isimle görünmesin
    statik = (d.ihraclar || []).map(x => Object.assign({}, x, {
      kaynak:'arşiv',
      ihracci: VKS[String(x.kod||'').toUpperCase()] || x.ihracci
    }));
    statikGun = d.guncelleme; statikKaynak = d.kaynak;
  }catch(e){ /* arşiv yoksa yalnız canlı ile devam */ }

  // 2) CANLI KAP — kendi köprümüzü çağır (WAF/oturum yönetimi orada zaten çözülü)
  let canli = [], kapHata = null;
  const bilinmeyen = new Set();
  try{
    const r = await fetch(kok + '/api/kap', { signal: AbortSignal.timeout(15000) });
    const d = await r.json();
    const items = (d && d.items) || [];
    const sinir = new Date(Date.now() - gun*86400000);
    items.forEach(it => {
      const kodlar = (it.k || []).map(x => String(x).toUpperCase());
      const baslik = String(it.b || '');
      const faizsiz = /faizsiz/i.test(baslik);
      const vksKod  = kodlar.find(vksMi) || null;
      // Sukuk sayılma koşulu: başlık "(Faizsiz)" VEYA bildirim bir VKŞ'den geliyor
      if (!faizsiz && !vksKod) return;
      if (!faizsiz && !/ihraç tavan|tertip|pay dışında/i.test(kucult(baslik))) return;
      const t = new Date(it.ts); if (isNaN(t) || t < sinir) return;
      if (vksKod && !VKS[vksKod]) bilinmeyen.add(vksKod);
      // fon kullanıcısı = VKŞ dışındaki diğer kod (varsa)
      const fon = kodlar.filter(k => k !== vksKod)[0] || null;
      canli.push({
        tarih: t.toISOString().slice(0,10),
        kod: vksKod || kodlar[0] || '—',
        ihracci: (vksKod && VKS[vksKod]) || (vksKod ? vksKod + ' (ünvan haritada yok)' : 'Bilinmeyen ihraççı'),
        tip: tipBul(baslik),
        not: (fon ? ('fon kullanıcısı: ' + fon + ' · ') : '') +
             t.toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Istanbul'}) + ' KAP',
        url: it.url || null,
        kaynak: 'canlı'
      });
    });
  }catch(e){ kapHata = String(e.message || e); }

  // 3) BİRLEŞTİR — aynı gün+kod+tip tekrarını ele, tarihe göre yeniden sırala
  const anahtar = x => x.tarih + '|' + x.kod + '|' + x.tip;
  const gorulen = new Set(), birlesik = [];
  canli.concat(statik).forEach(x => { const a = anahtar(x);
    if (!gorulen.has(a)) { gorulen.add(a); birlesik.push(x); } });
  birlesik.sort((a,b) => (a.tarih < b.tarih ? 1 : a.tarih > b.tarih ? -1 : 0));

  res.setHeader('Cache-Control','s-maxage=540, stale-while-revalidate=1800'); // 9 dk, kap.js ile aynı
  return res.status(200).json({
    ok: birlesik.length > 0,
    kaynak: canli.length ? ('KAP canlı' + (statik.length ? ' + arşiv' : '')) : (statikKaynak || 'arşiv'),
    guncelleme: birlesik.length ? birlesik[0].tarih : (statikGun || null),
    canliAdet: canli.length, arsivAdet: statik.length,
    pencereGun: gun,
    bilinmeyenKodlar: Array.from(bilinmeyen),   // haritaya eklenmesi gerekenler
    kapHata,                                    // canlı akış düştüyse sebep (arşiv yine görünür)
    ihraclar: birlesik.slice(0, limit)
  });
};
