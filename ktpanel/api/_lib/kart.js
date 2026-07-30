// Kredi/banka kartı harcamaları — sektörel · TCMB EVDS
// Erişim: /api/evds2?mod=kart   (evds2.js'ten yönlendirilir, ayrı fonksiyon slotu yakmaz)
//
// SERİ KODLARI ÖLÇÜLDÜ (2026-07-24), ezberden yazılmadı:
//   ?ara=kredi kart  → grup bie_kkhartut "Banka Kartı ve Kredi Kartı Harcama Tutarı (Akım)"
//   ?list=bie_kkhartut → KT1 toplam · KT2–KT26 + KT49 sektörler · KT50–KT52 bilgi amaçlı
//   ?grup=bie_tukfiy2025&adFiltre=Genel&debug=1 → TP.TUKFIY2025.GENEL
//
// İKİ KRİTİK METODOLOJİ KARARI:
// 1) Seri HAFTALIK ve AKIM'dır. Aylığa çevirirken haftalar TOPLANIR (son değer alınmaz).
//    Ama ay başına hafta sayısı 4 veya 5 olabilir; ham toplamı karşılaştırmak 5 haftalık ayı
//    %25 şişirir. Bu yüzden tüm karşılaştırmalar HAFTALIK ORTALAMA üzerinden yapılır.
// 2) %30 enflasyonda nominal artış bilgi taşımaz. Her sektör için TÜFE ile deflate edilmiş
//    REEL yıllık değişim hesaplanır: (1+nominal)/(1+tüfe) − 1. Sıralama reele göredir.

const KART = {
  'TP.KKHARTUT.KT1':'TOPLAM',
  'TP.KKHARTUT.KT2':'Araba Kiralama',
  'TP.KKHARTUT.KT3':'Araç Satış/Servis/Yedek Parça',
  'TP.KKHARTUT.KT4':'Benzin ve Yakıt İstasyonları',
  'TP.KKHARTUT.KT5':'Çeşitli Gıda',
  'TP.KKHARTUT.KT6':'Doğrudan Pazarlama',
  'TP.KKHARTUT.KT7':'Eğitim / Kırtasiye / Ofis',
  'TP.KKHARTUT.KT8':'Elektronik ve Bilgisayar',
  'TP.KKHARTUT.KT9':'Giyim ve Aksesuar',
  'TP.KKHARTUT.KT10':'Havayolları',
  'TP.KKHARTUT.KT11':'Hizmet Sektörleri',
  'TP.KKHARTUT.KT12':'Konaklama',
  'TP.KKHARTUT.KT13':'Kulüp / Dernek / Sosyal',
  'TP.KKHARTUT.KT14':'Kumarhane / İçkili Yerler',
  'TP.KKHARTUT.KT15':'Kuyumcular',
  'TP.KKHARTUT.KT16':'Market ve AVM',
  'TP.KKHARTUT.KT17':'Mobilya ve Dekorasyon',
  'TP.KKHARTUT.KT18':'Müteahhit İşleri',
  'TP.KKHARTUT.KT19':'Sağlık / Kozmetik',
  'TP.KKHARTUT.KT20':'Seyahat Acenteleri / Taşımacılık',
  'TP.KKHARTUT.KT21':'Sigorta',
  'TP.KKHARTUT.KT22':'Telekomünikasyon',
  'TP.KKHARTUT.KT23':'Yapı Malzemeleri / Nalburiye',
  'TP.KKHARTUT.KT24':'Yemek',
  'TP.KKHARTUT.KT25':'Kamu / Vergi Ödemeleri',
  'TP.KKHARTUT.KT26':'Bireysel Emeklilik',
  'TP.KKHARTUT.KT49':'Diğer'
};
const BILGI = {
  'TP.KKHARTUT.KT50':'İnternet Üzerinden Alışveriş',
  'TP.KKHARTUT.KT51':'Mektup/Telefonla Alışveriş',
  'TP.KKHARTUT.KT52':'Gümrük Vergisi Ödemeleri'
};
const TUFE = 'TP.TUKFIY2025.GENEL';

// KÜME TANIMLARI — manşet toplam tüketimi olduğundan fazla gösteriyor, çünkü listede
// tüketim OLMAYAN iki kalem var ve ikisi de zıt yönde bozuyor:
//   KAMU    → kartla vergi ödemesi. Harcama değil yükümlülük; 2026-06'da toplam reel
//             büyümenin ~%36'sını tek başına üretti. Tüketim okumasından ÇIKARILMALI.
//   KORUNMA → kuyumcu. Türkiye'de altın alımı tüketim değil tasarruf/enflasyon korunmasıdır;
//             keyfi harcama kümesine katılırsa o kümenin sinyalini bozar.
// TEMEL vs KEYFİ makası ise hanehalkı sıkışmasının en doğrudan ölçüsüdür.
const KUME = {
  temel:   ['TP.KKHARTUT.KT16','TP.KKHARTUT.KT5','TP.KKHARTUT.KT19','TP.KKHARTUT.KT4',
            'TP.KKHARTUT.KT24','TP.KKHARTUT.KT22','TP.KKHARTUT.KT7'],
  keyfi:   ['TP.KKHARTUT.KT9','TP.KKHARTUT.KT8','TP.KKHARTUT.KT10','TP.KKHARTUT.KT12',
            'TP.KKHARTUT.KT17','TP.KKHARTUT.KT2','TP.KKHARTUT.KT14','TP.KKHARTUT.KT13',
            'TP.KKHARTUT.KT20'],
  korunma: ['TP.KKHARTUT.KT15'],
  kamu:    ['TP.KKHARTUT.KT25']
};
const KUME_AD = { temel:'Temel (gıda·sağlık·yakıt·iletişim)', keyfi:'Keyfi (giyim·elektronik·seyahat)',
                  korunma:'Korunma (kuyumcu)', kamu:'Kamu/Vergi (tüketim değil)' };

const iki = n => String(n).padStart(2,'0');
const fmt = d => iki(d.getDate()) + '-' + iki(d.getMonth()+1) + '-' + d.getFullYear();

// EVDS tarih biçimleri: haftalık "DD-MM-YYYY", aylık "YYYY-M" veya "MM-YYYY".
// Hepsini "YYYY-MM" ay anahtarına indirger.
function ayAnahtar(t){
  const s = String(t||'').trim();
  let m;
  if ((m = s.match(/^(\d{2})-(\d{2})-(\d{4})$/))) return m[3]+'-'+m[2];      // 17-07-2026
  if ((m = s.match(/^(\d{4})-(\d{1,2})$/)))       return m[1]+'-'+iki(m[2]); // 2026-7
  if ((m = s.match(/^(\d{1,2})-(\d{4})$/)))       return m[2]+'-'+iki(m[1]); // 7-2026
  return null;
}
const ayKaydir = (a,n) => { const [y,m]=a.split('-').map(Number);
  const d=new Date(Date.UTC(y, m-1+n, 1)); return d.getUTCFullYear()+'-'+iki(d.getUTCMonth()+1); };

async function evdsCek(seriler, key, basDate, bitDate){
  const url = 'https://evds3.tcmb.gov.tr/igmevdsms-dis/series=' + seriler.join('-') +
              '&startDate=' + fmt(basDate) + '&endDate=' + fmt(bitDate) + '&type=json';
  const r = await fetch(url, { headers:{ 'key':key, 'Accept':'application/json',
    'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36' }});
  const t = await r.text();
  if (!(t.trim().startsWith('{') || t.trim().startsWith('['))) throw new Error('EVDS JSON dönmedi ('+r.status+')');
  const j = JSON.parse(t);
  return (j && j.items) ? j.items : [];
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin','*');
  const key = process.env.EVDS_KEY || (req.query && req.query.key);
  if (!key) { res.setHeader('Cache-Control','no-store');
    return res.status(400).json({ ok:false, err:'EVDS_KEY tanımlı değil' }); }

  const gun = parseInt(req.query && req.query.gun) || 500;   // ~16 ay: yıllık karşılaştırma için yeterli
  const bit = new Date(), bas = new Date(bit.getTime() - gun*86400000);

  try {
    const kodlar = Object.keys(KART).concat(Object.keys(BILGI));
    // EVDS uzun seri listelerinde tökezleyebiliyor → 10'arlı parçalar hâlinde, sırayla
    const parca = []; for (let i=0;i<kodlar.length;i+=10) parca.push(kodlar.slice(i,i+10));
    const haftalik = {};   // kod → { 'YYYY-MM': {top, hafta} }
    let sonTarih = null, sonHaftaTop = null;

    for (const p of parca) {
      const items = await evdsCek(p, key, bas, bit);
      items.forEach(it => {
        const ay = ayAnahtar(it.Tarih); if (!ay) return;
        p.forEach(kod => {
          const alan = kod.replace(/\./g,'_');
          const v = it[alan];
          if (v === null || v === undefined || v === '') return;
          const sayi = parseFloat(v); if (!isFinite(sayi)) return;
          (haftalik[kod] = haftalik[kod] || {});
          const h = (haftalik[kod][ay] = haftalik[kod][ay] || { top:0, hafta:0 });
          h.top += sayi; h.hafta += 1;
          if (kod === 'TP.KKHARTUT.KT1') {
            if (!sonTarih || String(it.Tarih) > '') { sonTarih = it.Tarih; sonHaftaTop = sayi; }
          }
        });
      });
    }

    const toplamAylar = Object.keys(haftalik['TP.KKHARTUT.KT1'] || {}).sort();
    if (!toplamAylar.length) return res.status(200).json({ ok:false, err:'EVDS kart serisi boş döndü' });

    // TAMAMLANMIŞ AY: bir sonraki ayda gözlem varsa o ay tamamlanmıştır.
    // (Son ay her zaman kısmidir — 17 Tem verisiyle temmuz henüz bitmemiştir.)
    const donem = toplamAylar[toplamAylar.length-2] || toplamAylar[toplamAylar.length-1];
    const oncekiAy = ayKaydir(donem,-1), gecenYil = ayKaydir(donem,-12);

    // TÜFE — aynı ay ve bir yıl öncesi
    let tufeYoy = null, tufeDonem = null;
    try {
      const ti = await evdsCek([TUFE], key, new Date(bit.getTime()-800*86400000), bit);
      const idx = {};
      ti.forEach(it => { const a=ayAnahtar(it.Tarih); const v=it[TUFE.replace(/\./g,'_')];
        if (a && v!==null && v!==undefined && v!=='') idx[a]=parseFloat(v); });
      if (idx[donem] && idx[gecenYil]) { tufeYoy = (idx[donem]/idx[gecenYil]-1)*100; tufeDonem = donem; }
    } catch(e) { /* TÜFE alınamazsa reel sütunu boş kalır, nominal yine çalışır */ }

    const ort = (kod, ay) => { const h = haftalik[kod] && haftalik[kod][ay];
      return (h && h.hafta) ? h.top/h.hafta : null; };
    const yuz = (y,e) => (y!=null && e) ? +((y/e-1)*100).toFixed(2) : null;
    const reel = nom => (nom!=null && tufeYoy!=null) ? +(((1+nom/100)/(1+tufeYoy/100)-1)*100).toFixed(2) : null;

    const topOrt = ort('TP.KKHARTUT.KT1', donem);
    const kur = (kod, ad) => {
      const h = haftalik[kod] && haftalik[kod][donem]; if (!h) return null;
      const o = ort(kod,donem), yoy = yuz(o, ort(kod,gecenYil));
      return { kod, ad,
        tutar:+h.top.toFixed(0), hafta:h.hafta, haftalikOrt:+o.toFixed(0),
        pay: topOrt ? +(o/topOrt*100).toFixed(2) : null,
        mom: yuz(o, ort(kod,oncekiAy)),
        yoy, reelYoy: reel(yoy) };
    };

    const sektorler = Object.keys(KART).filter(k => k!=='TP.KKHARTUT.KT1')
      .map(k => kur(k, KART[k])).filter(Boolean)
      .sort((a,b) => (b.reelYoy!=null?b.reelYoy:-999) - (a.reelYoy!=null?a.reelYoy:-999));
    const bilgi = Object.keys(BILGI).map(k => kur(k, BILGI[k])).filter(Boolean);
    const toplam = kur('TP.KKHARTUT.KT1','TOPLAM');

    // Tutarlılık kontrolü: sektör paylarının toplamı ~%100 olmalı. Değilse seri seti eksik.
    const paySum = sektorler.reduce((a,b)=>a+(b.pay||0),0);

    // Küme toplamları — haftalık ortalamalar üzerinden (hafta sayısı normalize edilmiş)
    const kumeHesap = (kodlar) => {
      let s=0, o=0, g=0, kapsam=0;
      kodlar.forEach(k => { const a=ort(k,donem); if(a==null) return;
        s+=a; kapsam++; const b=ort(k,oncekiAy), c=ort(k,gecenYil);
        if(b!=null) o+=b; if(c!=null) g+=c; });
      if(!kapsam) return null;
      const yoy = g ? +((s/g-1)*100).toFixed(2) : null;
      return { haftalikOrt:+s.toFixed(0), pay: topOrt?+(s/topOrt*100).toFixed(2):null,
               mom: o?+((s/o-1)*100).toFixed(2):null, yoy, reelYoy:reel(yoy), seriSayisi:kapsam };
    };
    const kumeler = {};
    Object.keys(KUME).forEach(k => { const h=kumeHesap(KUME[k]); if(h){ h.ad=KUME_AD[k]; kumeler[k]=h; } });
    // TEMEL − KEYFİ makası: hanehalkı sıkışmasının tek sayılık özeti (reel puan farkı)
    const makas = (kumeler.temel && kumeler.keyfi && kumeler.temel.reelYoy!=null && kumeler.keyfi.reelYoy!=null)
      ? +(kumeler.temel.reelYoy - kumeler.keyfi.reelYoy).toFixed(2) : null;

    // Kamu/Vergi HARİÇ toplam — asıl tüketim okuması budur
    let exKamu = null;
    const kamuOrt = ort('TP.KKHARTUT.KT25', donem), kamuGecen = ort('TP.KKHARTUT.KT25', gecenYil),
          kamuOnce = ort('TP.KKHARTUT.KT25', oncekiAy);
    const topGecen = ort('TP.KKHARTUT.KT1', gecenYil), topOnce = ort('TP.KKHARTUT.KT1', oncekiAy);
    if (topOrt!=null && kamuOrt!=null && topGecen && kamuGecen!=null) {
      const s = topOrt-kamuOrt, g = topGecen-kamuGecen;
      const o = (topOnce!=null && kamuOnce!=null) ? topOnce-kamuOnce : null;
      const yoy = g ? +((s/g-1)*100).toFixed(2) : null;
      exKamu = { haftalikOrt:+s.toFixed(0), pay: +(s/topOrt*100).toFixed(2),
                 mom: o?+((s/o-1)*100).toFixed(2):null, yoy, reelYoy:reel(yoy) };
    }

    res.setHeader('Cache-Control','s-maxage=21600, stale-while-revalidate=43200'); // haftalık veri, 6 saat
    return res.status(200).json({
      ok:true, kaynak:'TCMB EVDS · bie_kkhartut', birim:'bin TL',
      donem, oncekiDonem:oncekiAy, gecenYil,
      tufe: tufeYoy!=null ? { donem:tufeDonem, yoy:+tufeYoy.toFixed(2), seri:TUFE } : null,
      toplam, exKamu, kumeler, makas, sektorler, bilgi,
      paylarToplami:+paySum.toFixed(1),
      sonHafta: sonTarih ? { tarih:sonTarih, tutar:sonHaftaTop } : null,
      not:'Haftalık akım serisi aylığa TOPLANARAK çevrildi; karşılaştırmalar ay başına hafta sayısı '+
          '4/5 değiştiği için HAFTALIK ORTALAMA üzerinden yapıldı. Reel değişim TÜFE ile deflate edilmiştir. '+
          'EVDS haftalık tarihi hafta sonunu gösterir; ay sınırına denk gelen haftalar bir sonraki aya yazılır — '+
          'bu sapma yıllık karşılaştırmada iki tarafta da aynı olduğu için büyük ölçüde götürür.'
    });
  } catch (e) {
    res.setHeader('Cache-Control','no-store');
    return res.status(502).json({ ok:false, err:'EVDS kart verisi alınamadı', detay:String(e.message||e) });
  }
};
