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
/* §245g KÖK NEDEN BULUNDU — DEĞİŞKENLİ import() PAKETE GİRMİYOR.
   Eski hali:  async function _altModul(yol){ const m = await import(yol); ... }
   `import()` içine DEĞİŞKEN veriliyordu. Vercel'in dosya izleyicisi (@vercel/nft)
   STATİK analiz yapar: `import('./_lib/x.js')` gibi SABİT DİZGEYİ izler ve dosyayı
   dağıtım paketine koyar; `import(yol)` gibi değişkeni İZLEYEMEZ. Sonuç:
   api/_lib/kapyorum.js ve sukuk.js dağıtıma HİÇ girmiyordu → çalışma anında
   ERR_MODULE_NOT_FOUND → 500 (§245c'den sonra: teşhisli 502).
   KANIT YAN YANA DURUYORDU: api/data.js `require('./_lib/mail.js')`,
   api/evds2.js `require('./_lib/tlref.js')` — SABİT dizge, izleniyor, çalışıyor.
   Değişkenli import kullanan TEK dosya kap.js'ti, bozuk olan TEK dosya da o.
   Yerelde çalışıp üretimde patlaması da bunu söylüyordu: yerelde dosya diskte
   duruyor, üretimde pakete alınmamış.
   ÇÖZÜM: her modül SABİT dizgeli kendi ok fonksiyonunda. Tembel yükleme
   korunuyor (yalnız o mod istendiğinde çağrılır) ama artık nft izleyebiliyor.
   AYRICA vercel.json'a includeFiles eklendi — kemer + askı. */
const _ALT_MODUL = {
  yorum: () => import('./_lib/kapyorum.js'),
  sukuk: () => import('./_lib/sukuk.js')
};
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
/* §220 SOLO (KONSOLİDE OLMAYAN) YEDEK ETİKETLER.
   İlk liste KONSOLİDE rapor içindi: "Ana Ortaklık Payları" ve "Ana Ortaklığa
   Ait Özkaynaklar" yalnız konsolide tablolarda bulunur. Küçük şirketler SOLO
   rapor verir; orada bu satırlar YOK, doğrudan "DÖNEM KARI (ZARARI)" ve
   "Özkaynaklar" yazar.
   ÖLÇÜLDÜ: nöbet CANTE ve GENIL'i yakaladı, ikisinde de 0 kalem çıktı.
   Etiketler sırayla denenir; konsolide önce, solo yedekte. */
const _SANAYI = [
  ['ciro',        ['Hasılat','Satış Gelirleri','HASILAT']],
  ['brutKar',     ['BRÜT KAR (ZARAR)','Brüt Kar (Zarar)','Brüt Kâr (Zarar)','BRÜT KAR']],
  ['faaliyetKar', ['ESAS FAALİYET KARI (ZARARI)','Esas Faaliyet Karı (Zararı)','Faaliyet Karı (Zararı)','ESAS FAALİYET KARI']],
  ['finansGider', ['Finansman Giderleri (-)','Finansman Giderleri']],
  ['parasal',     ['Net Parasal Pozisyon Kazançları (Kayıpları)','Net Parasal Pozisyon Kazançları/Kayıpları']],
  ['netKar',      ['Ana Ortaklık Payları','DÖNEM KARI (ZARARI)','Dönem Karı (Zararı)','SÜRDÜRÜLEN FAALİYETLER DÖNEM KARI (ZARARI)']],
  ['ozkaynak',    ['Ana Ortaklığa Ait Özkaynaklar','ÖZKAYNAKLAR','Özkaynaklar']],
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

/* §223 İŞARET VE BÜYÜKLÜK KISITI — yanlış satır yakalamayı önler.
   ÖLÇÜLDÜ (BORSK): ciro −1.383.291.932 çıktı. Hasılat NEGATİF OLAMAZ ve bu
   büyüklük küçük bir şirket için mantıksız (1,4 katrilyon TL). Ayrıştırıcı
   "Hasılat" etiketini bir dipnot/kırılım tablosunda yakalayıp oradaki negatif
   sayıyı almış. Özkaynak da 7,8 katrilyon TL çıkmıştı — aynı hata.
   ÇÖZÜM: bazı kalemlerin İŞARETİ BELLİDİR (hasılat +, gider −). Beklenene
   uymayan eşleşme REDDEDİLİR, arama sonraki eşleşmeyle DEVAM EDER.
   §206'daki dipnot süzgecinin kardeşi: BİÇİM yetmiyorsa ANLAM kısıtı koy. */
const _ISARET = {
  ciro:'+', ozkaynak:'+', nakit:'+', toplamVarlik:'+', toplamKaynak:'+',
  donenVarlik:'+', duranVarlik:'+', kisaVadeli:'+', uzunVadeli:'+',
  stoklar:'+', ticariAlacak:'+', maddiDuran:'+', odenmisSermaye:'+',
  ticariBorc:'+', kvFinansBorc:'+', uvFinansBorc:'+',
  satisMaliyet:'-', finansGider:'-', pazarlama:'-', genelYonetim:'-', arge:'-',
  digerGider:'-', karsilik:'-', personel:'-', vergi:'-', faizGider:'-',
  krediler:'+', mevduat:'+', menkulDeger:'+', faizGelir:'+', komisyon:'+',
  digerGelir:'+', finansGelir:'+', yatirimGelir:'+'
  /* brutKar · faaliyetKar · netKar · parasal · netFaiz: işaret SERBEST,
     zarar da kâr da olabilir */
};
/* Bin TL cinsinde bir kalem 1 milyar bin TL'yi (1 katrilyon TL) aşamaz —
   BIST'te böyle bir şirket yok. Aşan değer YANLIŞ SATIRDIR. */
/* §230 ÜST SINIR BİRİME BAĞLI OLMALI — kendi kısıtım geçerli veriyi reddetti.
   §223'te 1e9 sabit sınır koydum, gerekçesi "bin TL cinsinde bir kalem
   1 milyar bin TL'yi aşamaz" idi. Doğruydu — AMA YALNIZ BİN TL İÇİN.
   BORSK raporunu TL cinsinden veriyor; cirosu 1.383.291.932 TL ve bu sınırı
   AŞIYOR. Geçerli değer reddedildi, kalem sayısı 0'a düştü.
   BORSK ÖNCE ÇALIŞIYORDU; §223'ü ekleyince KIRDIM.
   Kısıtı yazarken hangi varsayıma dayandığını NOT ETTİM ama o varsayımı
   DOĞRULAMADIM. §229'da birim tespitini eklerken de sınırı ona bağlamayı
   unuttum — iki değişiklik yan yana yapıldı ve biri diğerini gerektiriyordu.
   ŞÜPHEDE GENİŞ TUT: reddedilen veri geri gelmiyor, fazla kabul edilen veri
   ise denetimde yakalanır. */
const _UST_SINIR = 1e9;                       // bin TL tabanı (geriye uyum)
function _ustSinir(birim){
  if(!birim || !birim.carpan) return 1e13;    // belirsiz → geniş
  if(birim.carpan === 1)    return 1e12;      // TL
  if(birim.carpan === 1000) return 1e9;       // bin TL
  if(birim.carpan >= 1e6)   return 1e7;       // milyon TL
  return 1e13;
}

/* §229 BİRİM TESPİTİ — her rapor BİN TL DEĞİL.
   ÖLÇÜLDÜ (BORSK): brüt kâr 77.668.780 çıktı ve "bin TL" diye gösterildi →
   77,7 MİLYAR TL. Küçük bir şeker şirketi için imkânsız. Aynı sayı TL olarak
   okununca 77,7 MİLYON TL — makul. Net zarar 282 mn, nakit 343 mn; hepsi
   oturuyor.
   KAP raporlarında birim ŞİRKET SEÇİMİDİR: kimi "TL", kimi "Bin TL",
   nadiren "Milyon TL". Sayfada belirtilir.
   HER RAPORU BİN TL VARSAYMAK, küçük şirketleri BİN KAT BÜYÜK gösteriyordu —
   ve bu sessizdi: sayı makul biçimliydi, yalnız ölçeği yanlıştı.
   TESPİT: sayfadaki birim ifadesi aranır; bulunamazsa 'belirsiz' döner ve
   ÖYLE SÖYLENİR — varsayılan uydurmak, yanlış ölçeği gizlemekti. */
function _birimBul(h){
  const bas = h.slice(0, 400000);   // birim ifadesi tablo başlarında olur
  if(/Bin\s*T[Ll]|BinTL|\(Bin\s*TL\)|bin\s*Türk\s*Lirası/i.test(bas)) return { ad:'bin TL', carpan:1000 };
  if(/Milyon\s*T[Ll]|\(Milyon\s*TL\)/i.test(bas))                        return { ad:'milyon TL', carpan:1e6 };
  if(/Tam\s*T[Ll]|tutarlar\s+Türk\s+Lirası|TL\s*olarak\s+gösteril/i.test(bas)) return { ad:'TL', carpan:1 };
  return { ad:'belirsiz', carpan:null };
}
/* §255 BİRİM ÇAPRAZ DOĞRULAMASI — kalıp bulunamazsa ÖLÇEKLE KANITLA.
   SORUN: _birimBul sayfada "Bin TL / Milyon TL / Tam TL" ifadelerini arar.
   LMKDC 2Ç26'da (KAP 1647444) hiçbiri tutmadı -> birim 'belirsiz'. §229'un
   kuralı gereği varsayılan UYDURULMADI ve modele "belirsiz" denildi — ama
   MODEL UYDURDU: özette "2,32 milyar", tabloda "2.317,8 mlr birim" yazdı.
   İkisi 1000 KAT farklıydı ve kart o haliyle onaylandı.
   ÇÖZÜM: ölçeği METİNDEN değil VERİDEN kanıtla. Panelin multiple.json'unda
   her hisse için TTM ciro (milyon TL) zaten var. Çeyreklik ciro × 4, üç
   aday çarpanla denenip TTM'e oranlanır; oran makul bandda olan ADAY KAZANIR.
   LMKDC ÖLÇÜMÜ (10 Ağu):
     bin TL   -> 2.317.827 ×1000 ×4 /1e6 = 9.271 mn  · TTM 9.306 -> oran 0,996 ✓
     TL       -> 9,3 mn                              -> oran 0,001 ✗
     milyon TL-> 9.271.308 mn                        -> oran 996   ✗
   Ayrışma 1000 KAT — belirsizlik yok. Fintables ile de doğrulandı: KAP ham
   değerleri tam TL karşılıklarının BİREBİR 1/1000'i (beş kalemde de).
   TOLERANS: çeyrek×4 ile TTM arasında mevsimsellik farkı olur; [0,3–3,0]
   bandı bunu fazlasıyla karşılar ve yanlış adayı (1000 kat uzakta) ASLA
   içine almaz. */
const _CARPAN_ADAY = [
  { ad:'bin TL',    carpan:1000 },
  { ad:'TL',        carpan:1    },
  { ad:'milyon TL', carpan:1e6  }
];
function _birimDogrula(birim, ciroCeyrek, ttmCiroMn, ozkaynak, pdMn){
  /* Zaten kesinse dokunma — sayfanın kendi beyanı her zaman üstündür. */
  if(birim && birim.carpan) return { birim, kanit:null };
  /* İKİ EKSEN, sırayla:
       1) CİRO — çeyreklik×4 vs multiple.json TTM cirosu. En güvenilir.
       2) ÖZKAYNAK — piyasa değeri / özkaynak = PD/DD. Ciro referansı yoksa.
     §257b: multiple.json 141 hisse taşıyor; KTLEV gibi kapsam dışı isimlerde
     birinci eksen çalışmaz. PD/DD ikinci eksen olarak devreye girer —
     borsada işlem gören bir şirkette PD/DD pratikte 0,05–30 bandındadır,
     yanlış ölçek bu bandın 1000 KAT dışına düşer. */
  const eksen = [];
  if(isFinite(ciroCeyrek) && ciroCeyrek > 0 && isFinite(ttmCiroMn) && ttmCiroMn > 0)
    eksen.push({ ad:'ciro', ham:ciroCeyrek,
                 olc:(h,c)=>(h*c*4)/1e6/ttmCiroMn, alt:0.3, ust:3.0, ref:ttmCiroMn });
  if(isFinite(ozkaynak) && ozkaynak > 0 && isFinite(pdMn) && pdMn > 0)
    eksen.push({ ad:'ozkaynak(PD/DD)', ham:ozkaynak,
                 olc:(h,c)=>pdMn/((h*c)/1e6), alt:0.05, ust:30, ref:pdMn });
  if(!eksen.length) return { birim, kanit:null };
  const E = eksen[0];
  const gecen = [];
  for(const a of _CARPAN_ADAY){
    const oran = E.olc(E.ham, a.carpan);
    if(oran >= E.alt && oran <= E.ust) gecen.push({ ...a, oran:+oran.toFixed(3), eksen:E.ad });
  }
  /* TEK aday geçmeli. İki aday geçerse ayrışma yetersizdir ve KARAR VERİLMEZ —
     belirsizi belirsiz bırakmak, yanlış kesinlikten iyidir (§229). */
  if(gecen.length !== 1) return { birim, kanit:{ sonuc:'kararsiz', eksen:E.ad, gecen, ref:E.ref } };
  const k = gecen[0];
  return {
    birim: { ad:k.ad, carpan:k.carpan, kaynak:'capraz-dogrulama' },
    kanit: { sonuc:'kanitlandi', eksen:E.ad, secilen:k.ad, oran:k.oran, ham:E.ham, ref:E.ref,
             not: E.ad==='ciro'
               ? 'ceyreklik ciro x4, multiple.json TTM cirosuna oranlandi'
               : 'piyasa degeri / ozkaynak = PD/DD makul bandda mi' }
  };
}
function _isaretUygun(ad, v, sinir){
  if(v == null) return false;
  if(!isFinite(v) || Math.abs(v) > (sinir || 1e13)) return false;
  const bek = _ISARET[ad];
  if(bek === '+' && v < 0) return false;
  if(bek === '-' && v > 0) return false;
  return true;
}

/* §216 TAM TABLO ŞABLONLARI — Finansal Tablolar sekmesi için.
   mod=kart sekiz kalemle yetiniyordu; tam bilanço ve gelir tablosu için
   çok daha fazlası gerekiyor.
   SIRA ÖNEMLİ: uzun etiket önce. "Dönem Karı" kısa etiketi
   "Dönem Karı Vergi Yükümlülüğü" satırını yakalıyordu (§206'da ölçüldü).
   Her kalem [anahtar, [etiketler], girinti] — girinti tabloda hiyerarşi için. */
/* §233b GENİŞLETİLMİŞ ŞABLON DOĞRULANMAMIŞTI.
   Sekiz kalemlik `_SANAYI` seti TOASO'da 12/12 doğrulandı (§213). Ama tam
   tablo şablonu (15+18 kalem) hiç sınanmadı — etiketleri KAP'ın gerçek
   metniyle karşılaştırmadım, tahminle yazdım.
   Doğrulanmış etiketler buraya da eklendi ve varyantlar çoğaltıldı.
   Büyük harfli biçimler önce: KAP ara toplamları BÜYÜK HARF yazıyor. */
const _BILANCO_SANAYI = [
  ['donenVarlik',   ['DÖNEN VARLIKLAR','Dönen Varlıklar','TOPLAM DÖNEN VARLIKLAR'], 0],
  ['nakit',         ['Nakit ve Nakit Benzerleri','NAKİT VE NAKİT BENZERLERİ'], 1],
  ['ticariAlacak',  ['Ticari Alacaklar','TİCARİ ALACAKLAR'], 1],
  ['stoklar',       ['Stoklar','STOKLAR'], 1],
  ['duranVarlik',   ['DURAN VARLIKLAR','Duran Varlıklar','TOPLAM DURAN VARLIKLAR'], 0],
  ['maddiDuran',    ['Maddi Duran Varlıklar','MADDİ DURAN VARLIKLAR'], 1],
  ['toplamVarlik',  ['TOPLAM VARLIKLAR','Toplam Varlıklar','VARLIKLAR TOPLAMI','AKTİF TOPLAMI'], 0],
  ['kisaVadeli',    ['KISA VADELİ YÜKÜMLÜLÜKLER','Kısa Vadeli Yükümlülükler','TOPLAM KISA VADELİ YÜKÜMLÜLÜKLER'], 0],
  ['ticariBorc',    ['Ticari Borçlar','TİCARİ BORÇLAR'], 1],
  ['kvFinansBorc',  ['Kısa Vadeli Borçlanmalar','KISA VADELİ BORÇLANMALAR'], 1],
  ['uzunVadeli',    ['UZUN VADELİ YÜKÜMLÜLÜKLER','Uzun Vadeli Yükümlülükler','TOPLAM UZUN VADELİ YÜKÜMLÜLÜKLER'], 0],
  ['uvFinansBorc',  ['Uzun Vadeli Borçlanmalar','UZUN VADELİ BORÇLANMALAR'], 1],
  ['ozkaynak',      ['Ana Ortaklığa Ait Özkaynaklar','ÖZKAYNAKLAR','Özkaynaklar'], 0],
  ['odenmisSermaye',['Ödenmiş Sermaye','ÖDENMİŞ SERMAYE'], 1],
  ['toplamKaynak',  ['TOPLAM KAYNAKLAR','Toplam Kaynaklar','PASİF TOPLAMI','KAYNAKLAR TOPLAMI'], 0]
];
const _GELIR_SANAYI = [
  ['ciro',          ['Hasılat','Satış Gelirleri'], 0],
  ['satisMaliyet',  ['Satışların Maliyeti (-)','Satışların Maliyeti','SATIŞLARIN MALİYETİ (-)'], 1],
  ['brutKar',       ['BRÜT KAR (ZARAR)','Brüt Kar (Zarar)','Brüt Kâr (Zarar)'], 0],
  ['pazarlama',     ['Pazarlama, Satış ve Dağıtım Giderleri (-)','Pazarlama Giderleri (-)','Pazarlama Giderleri'], 1],
  ['genelYonetim',  ['Genel Yönetim Giderleri (-)','Genel Yönetim Giderleri'], 1],
  ['arge',          ['Araştırma ve Geliştirme Giderleri (-)','Araştırma ve Geliştirme Giderleri'], 1],
  ['digerGelir',    ['Esas Faaliyetlerden Diğer Gelirler'], 1],
  ['digerGider',    ['Esas Faaliyetlerden Diğer Giderler (-)'], 1],
  ['faaliyetKar',   ['ESAS FAALİYET KARI (ZARARI)','Esas Faaliyet Karı (Zararı)'], 0],
  ['yatirimGelir',  ['Yatırım Faaliyetlerinden Gelirler'], 1],
  ['fgoFaaliyet',   ['FİNANSMAN GİDERİ ÖNCESİ FAALİYET KARI (ZARARI)'], 0],
  ['finansGelir',   ['Finansman Gelirleri'], 1],
  ['finansGider',   ['Finansman Giderleri (-)','Finansman Giderleri'], 1],
  ['parasal',       ['Net Parasal Pozisyon Kazançları (Kayıpları)'], 1],
  ['vergiOncesi',   ['SÜRDÜRÜLEN FAALİYETLER VERGİ ÖNCESİ KARI (ZARARI)'], 0],
  ['vergi',         ['Sürdürülen Faaliyetler Vergi Gideri (-)','Dönem Vergi Gideri (-)','Dönem Vergi Geliri (Gideri)'], 1],
  ['donemKar',      ['DÖNEM KARI (ZARARI)','SÜRDÜRÜLEN FAALİYETLER DÖNEM KARI (ZARARI)','Dönem Karı (Zararı)'], 0],
  /* SOLO raporda "Ana Ortaklık Payları" YOKTUR — dönem kârının kendisi net
     kârdır. Yedek olarak aynı etiketler verildi; ikisi de bulunursa
     konsolide, yalnız ikincisi bulunursa solo demektir. */
  ['netKar',        ['Ana Ortaklık Payları','DÖNEM KARI (ZARARI)','Dönem Karı (Zararı)'], 1]
];
const _BILANCO_BANKA = [
  ['nakit',         ['Nakit Değerler ve Merkez Bankası','NAKİT DEĞERLER VE MERKEZ BANKASI'], 0],
  ['krediler',      ['KREDİLER','Krediler'], 0],
  ['menkulDeger',   ['Menkul Değerler'], 0],
  ['toplamVarlik',  ['TOPLAM VARLIKLAR','VARLIKLAR TOPLAMI'], 0],
  ['mevduat',       ['MEVDUAT','Mevduat'], 0],
  ['alinanKredi',   ['ALINAN KREDİLER','Alınan Krediler'], 0],
  ['ozkaynak',      ['ÖZKAYNAKLAR','Ana Ortaklığa Ait Özkaynaklar'], 0],
  ['toplamKaynak',  ['YÜKÜMLÜLÜKLER TOPLAMI','TOPLAM YÜKÜMLÜLÜKLER'], 0]
];
const _GELIR_BANKA = [
  ['faizGelir',     ['FAİZ GELİRLERİ'], 0],
  ['faizGider',     ['FAİZ GİDERLERİ (-)','FAİZ GİDERLERİ'], 0],
  ['netFaiz',       ['NET FAİZ GELİRİ VEYA GİDERİ','NET FAİZ GELİRİ'], 0],
  ['komisyon',      ['NET ÜCRET VE KOMİSYON GELİRLERİ VEYA GİDERLERİ'], 0],
  ['ticariKar',     ['TİCARİ KAR VEYA ZARAR (Net)'], 1],
  ['faaliyetBrut',  ['FAALİYET BRÜT KÂRI','FAALİYET BRÜT KARI'], 0],
  ['karsilik',      ['Beklenen Zarar Karşılıkları (-)','Beklenen Zarar Karşılıkları'], 1],
  ['personel',      ['PERSONEL GİDERLERİ (-)','Personel Giderleri (-)'], 1],
  ['netFaalKar',    ['NET FAALİYET KARI (ZARARI)'], 0],
  ['vergi',         ['Vergi Karşılığı (-)','Sürdürülen Faaliyetler Vergi Karşılığı (-)'], 1],
  ['netKar',        ['Grubun Karı (Zararı)','Ana Ortaklık Payları'], 0]
];


/* §235 TEK HÜCRE BULUCU — iki kopya vardı, düzeltmeler birine uygulandı.
   `kalemBul` (mod=bilanco/kart) ve `bul` (mod=tablo) AYNI İŞİ yapıyordu ama
   ayrı yazılmıştı. §233b'deki dar-satır kurtarması yalnız birincisine eklendi;
   TOASO 8 kalemlik yolda çalıştı, geniş tabloda çalışmadı.
   ÜÇ TUR bunu şablon/sınır/teşhis sanıp yanlış yerde aradım.
   Artık TEK fonksiyon. İkinci kopya yok, sapma da olamaz. */
function _hucreBul(h, etiketler, ad, sinir){
  for(const e of etiketler){
    const kalip = new RegExp('>'+e.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\s*<\\/div>', 'g');
    let m;
    while((m = kalip.exec(h)) !== null){
      /* Önce SATIR sınırı (doğru olan o), sayı çıkmazsa geniş pencere (kurtarma) */
      const satirSon = h.indexOf('</tr>', m.index);
      const dar = (satirSon > 0 && satirSon - m.index < 4000) ? satirSon : m.index + 2200;
      const say = (son) => [...h.slice(m.index, son).matchAll(/>([\-\(]?[\d.,]{3,})\s*</g)]
        .map(x=>_sayiCoz(x[1])).filter(v=>v!==null);
      let hc = say(dar);
      if(!hc.length && dar < m.index + 2200) hc = say(m.index + 2200);
      if(hc.length >= 1 && _isaretUygun(ad, hc[0], sinir)){
        return { deger:hc[0], onceki:hc[1] ?? null, ceyrek:hc[2] ?? null,
                 ceyrekOnceki:hc[3] ?? null, hepsi:hc.slice(0,6), etiket:e };
      }
    }
  }
  return null;
}

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
  /* Birim ÖNCE — üst sınır ona göre ölçeklenecek (§230) */
  const _birim = _birimBul(h), _sinir = _ustSinir(_birim);
  const kalemBul = (etiketler, _ad) => _hucreBul(h, etiketler, _ad, _sinir);
  const dene = (liste) => { const c={}; let dolu=0;
    liste.forEach(([ad,et])=>{ const v=kalemBul(et, ad); c[ad]=v; if(v)dolu++; }); return {c,dolu}; };
  const sanayi = dene(_SANAYI), banka = dene(_BANKA);
  const sablon = banka.dolu > sanayi.dolu ? 'banka' : 'sanayi';
  const secili = sablon==='banka' ? banka : sanayi;
  const liste  = sablon==='banka' ? _BANKA : _SANAYI;
  const eksik = liste.filter(([ad])=>!secili.c[ad]).map(([ad])=>ad);
  return { ok: secili.dolu>0, id, sablon, birim:_birim, ustSinir:_sinir, bulunan:secili.dolu, toplam:liste.length,
    eksik, kalemler:secili.c,
    uyari: eksik.length ? eksik.length+' kalem bulunamadı — sayfa yapısı değişmiş olabilir' : null };
}

/* §228 SÜRÜM DAMGASI. Bugün ALTI KEZ eski dosyayla uğraştık: çıktıyı okuyup
   "şu düzeltme çalışmamış" diye teşhis kurdum, oysa dosya deploy edilmemişti.
   Her yanıt artık `surum` taşıyor. Beklenen sürümü görmüyorsan gerisini
   okumaya gerek yok.
   Bir sistemin HANGİ SÜRÜMÜNÜN koştuğu, çıktısının ilk satırında olmalı. */
const _SURUM = 'kap-2026-08-20-p';   /* §338 donemler + §340 ham */

export default async function handler(req, res){
  res.setHeader('X-KTPanel-Surum', _SURUM);
  const _mod = String((req.query && req.query.mod) || '').toLowerCase();
  /* §245c OPAK 500 → KONUŞAN HATA.
     31 Tem'de panel konsolunda `mod=yorum` 500 döndü. Alt modülün KENDİSİ
     sağlam: yerelde ESM bağlamında import edilip çağrıldı, hata yolunda
     200 + {ok:false, err:'KAP HTTP 403'} döndürdü. Yani patlama modülün
     İÇİNDE değil, YÜKLENMESİNDE — ve `_altModul` çıplaktı: import başarısız
     olursa istisna handler'dan dışarı sızıyor, Vercel jenerik 500 basıyor.
     500'ün söylediği tek şey "bir şey oldu"; hangi modül, hangi hata — yok.
     §145'in dersi buydu: teşhis aracının kendisi susuyordu.
     Artık sarmalanıyor: yanıt yine hata ama OKUNABİLİR — modül adı, hata
     sınıfı ve mesajı JSON'da. Bir sonraki turda tahmin etmeye gerek kalmaz.
     NOT: 200 DEĞİL 502 dönüyor — bu gerçek bir arıza, panelin "veri yok" ile
     "sunucu kırık" ayrımını koruması gerekir (§60: sessizce normal görünme). */
  async function _yonlendir(ad){
    try{
      const yukle = _ALT_MODUL[ad];
      if(!yukle) throw new Error('bilinmeyen alt modül: '+ad);
      const m = await yukle();
      const f = (m && (m.default || m));
      if(typeof f !== 'function') throw new Error('modül fonksiyon döndürmedi (tip: '+typeof f+')');
      return await f(req, res);
    }catch(e){
      return res.status(502).json({ ok:false, mod:ad, asama:'alt-modul-yukleme',
        hata:(e && e.constructor && e.constructor.name) || 'Error',
        mesaj:String((e && e.message) || e).slice(0,300),
        ipucu:'api/_lib/'+ad+'.js dağıtıma dahil edilmemiş olabilir (Vercel dinamik import izleme) '+
              'ya da modül yüklenirken hata attı. X-KTPanel-Surum: '+_SURUM });
    }
  }
  if (_mod === 'yorum') return _yonlendir('yorum');
  if (_mod === 'sukuk') return _yonlendir('sukuk');
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
    /* §227 BAŞLIK AYRIMI — deneme yanılma BİTTİ.
       Ham KAP akışı üç ayrı bildirimi AYNI sınıfta (FR) veriyor:
         "Finansal Rapor"                      -> TABLOLAR BURADA
         "Faaliyet Raporu (Konsolide)"         -> tablo YOK, düz metin
         "Sorumluluk Beyanı (Konsolide Olmayan)" -> tablo YOK, imza sayfası
       ÖLÇÜLDÜ: TOASO 1639759 = Faaliyet Raporu; 0/8 kalem çıkmasının sebebi
       buydu. §211'de "en erken bildirim finansal tablo olmayabilir" diye
       tespit etmiş ama SEBEBİNİ bilmediğim için sırayla denemeye başlamıştım.
       Şimdi sebep belli: BAŞLIK söylüyor.
       AYRICA "Konsolide Olmayan" ibaresi SOLO şablon demek (§220) — hangi
       etiket setinin kullanılacağı önceden biliniyor. */
    const _BASLIK_TIP = (b) => {
      const t = String(b||'');
      if(/^Finansal Rapor/i.test(t)) return 'tablo';
      if(/Faaliyet Raporu/i.test(t)) return 'faaliyet';
      if(/Sorumluluk Beyan/i.test(t)) return 'beyan';
      return 'diger';
    };
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
          /* Başlıktan türeyen iki bilgi: tablo taşıyor mu, solo mu konsolide mi */
          tip: _BASLIK_TIP(x.subject || x.kapTitle),
          solo: /Konsolide Olmayan/i.test(String(x.subject||'')),
          /* §211 TÜM KİMLİKLER. Tekilleştirme en erkeni tutuyordu ama EN ERKEN
             BİLDİRİM FİNANSAL TABLO OLMAYABİLİR — faaliyet raporu, ek belge ya
             da denetim raporu olabilir ve içinde bilanço tablosu bulunmaz.
             ÖLÇÜLDÜ: TOASO 1Ç26'da üç bildirim var; en erkeni (1601476)
             ayrıştırıldığında 0/8 kalem çıktı. 2Ç26'da yedi bildirim vardı ve
             işleyen (1639026) ORTADAKİYDİ.
             Artık hepsi `idler` dizisinde; ayrıştırıcı sırayla dener. */
          idler: [idx],
          /* TABLO TAŞIYAN kimlikler ayrı tutulur — ayrıştırıcı ÖNCE bunları
             dener, deneme sayısı 7'den 1'e iner. */
          tabloIdler: _BASLIK_TIP(x.subject || x.kapTitle) === 'tablo' ? [idx] : [],
          url: idx ? 'https://www.kap.org.tr/tr/Bildirim/'+idx : null };
        yeni.gec = yeni.gecikmeGun != null && yeni.gecikmeGun > 80;
        const eski = kayit.get(anahtar);
        if(!eski){ kayit.set(anahtar, yeni); return; }
        eski.tekrar++;
        if(eski.idler.indexOf(idx) < 0) eski.idler.push(idx);
        if(_BASLIK_TIP(x.subject || x.kapTitle) === 'tablo' && eski.tabloIdler.indexOf(idx) < 0)
          eski.tabloIdler.push(idx);
        if(/Konsolide Olmayan/i.test(String(x.subject||''))) eski.solo = true;
        /* EN ERKEN gösterilir (gecikme hesabı ona göre) ama TÜM kimlikler
           saklanır — hangisinin finansal tablo olduğu ancak denenerek bulunur. */
        if(yeni.tarih < eski.tarih || (yeni.tarih === eski.tarih && yeni.saat < eski.saat)){
          /* §234 tabloIdler DE TAŞINMALI — burası kırılmıştı.
             Daha erken bir bildirim kaydın yerine geçerken `idler` taşınıyor
             ama `tabloIdler` taşınmıyordu. TOASO'nun en erken bildirimi
             "Faaliyet Raporu" olduğu için tabloIdler BOŞALIYOR, sonra §232
             süzgeci kaydı tamamen ELİYOR: "bildirim bulunamadı".
             Finansal Rapor orada duruyordu; kayıt süzgece takılıyordu.
             §232'yi eklerken tekilleştirmenin bu dalını gözden kaçırdım —
             onuncu "bir yeri değiştirip diğerini bırakma" vakası. */
          yeni.tekrar = eski.tekrar;
          yeni.idler = eski.idler;
          yeni.tabloIdler = eski.tabloIdler;
          yeni.solo = eski.solo || yeni.solo;
          kayit.set(anahtar, yeni);
        }
      });
    });
    /* idler dizisini TABLO TAŞIYANLAR ÖNDE olacak şekilde sırala */
    kayit.forEach(v => {
      if(v.tabloIdler && v.tabloIdler.length){
        const digerleri = v.idler.filter(i => v.tabloIdler.indexOf(i) < 0);
        v.idler = v.tabloIdler.concat(digerleri);
      }
    });
    /* §232 TABLO TAŞIMAYANI SÜZ — nöbetin CANTE'yi yakalama sebebi buydu.
       KAP `disclosureClass:'FR'` altında DÖRT ayrı şey veriyor:
         Finansal Rapor · Faaliyet Raporu · Sorumluluk Beyanı ·
         TSRS Uyumlu SÜRDÜRÜLEBİLİRLİK RAPORU
       ÖLÇÜLDÜ (CANTE 1635828): başlığı sürdürülebilirlik raporu, içinde
       karbon fiyatı tablosu var, BİLANÇO YOK.
       Ayrıştırıcı bozuk değildi — AYRIŞTIRACAK BİLANÇO YOKTU.
       §227'de `tip` alanını hesapladım ama nöbeti ona BAĞLAMADIM.
       Bir ayrımı hesaplayıp KULLANMAMAK, hiç hesaplamamakla aynı.
       ?tumu=1 ile süzgeç kapanır (takvim tüm bildirimleri isteyebilir). */
    const tumuIst = String((req.query && req.query.tumu) || '') === '1';
    const _hepsi = [...kayit.values()];
    const fr = (tumuIst ? _hepsi
        : _hepsi.filter(v => (v.tabloIdler && v.tabloIdler.length) || v.tip === 'tablo')
      ).sort((a,b)=>
      a.tarih < b.tarih ? 1 : a.tarih > b.tarih ? -1 : (a.saat < b.saat ? 1 : -1));

    res.setHeader('Cache-Control','s-maxage=540, stale-while-revalidate=1800');
    return res.status(200).json({ surum:_SURUM,  ok: fr.length>0, kaynak:'byCriteria/FR',
      suzgec: tumuIst ? 'yok (tumu=1)' : 'yalnız "Finansal Rapor" başlıklılar',
      suzulen: _hepsi.length - fr.length,
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
  /* §214 ?mod=kart — METRİK SETİ. Zincirin son mekanik adımı.
     mod=ceyrek ham kalem veriyor; kart için METRİK gerekir. §183'te tanımlanan
     standart: ciro · brüt marj · faaliyet kârı+marj · net kâr+marj · y/y · ç/ç.
     BU UÇ YORUM YAZMAZ. Rakamı ve değişimi hesaplar, DİKKAT ÇEKEN DESENLERİ
     işaretler. Yorum ve skor kullanıcıda kalır (§204 taslak+onay kurgusu).
     İŞARETLENEN DESENLER — bugün elle bulduklarım:
       · marj makası: FAVÖK/faaliyet ters yönde (TOASO, CWENE)
       · alt satır dışsal: net kâr artarken faaliyet düşüyorsa finansman/parasal
       · ç/ç ile y/y çelişkisi (TSKB karşılık vakası)
     Bunlar YORUM DEĞİL, BAKILACAK YER işaretidir. */
  /* §217 ?mod=tablo — TAM BİLANÇO + GELİR TABLOSU, analiz kolonlarıyla.
     YATAY ANALİZ (bilanço): kalem kaleme cari vs önceki, TUTAR FARKI ve
       YÜZDE DEĞİŞİM. Bilanço STOK olduğu için iki tarihin karşılaştırması
       anlamlıdır — "ne birikmiş" değil "ne değişmiş" sorusu.
     DİKEY ANALİZ (gelir tablosu): her kalem / HASILAT × 100. Yapıyı gösterir:
       maliyet cironun kaçta kaçı, faaliyet gideri ne kadar yiyor.
       Bankada payda hasılat değil FAİZ GELİRLERİ.
     NEDEN BU EŞLEŞME: bilanço iki andı karşılaştırır (yatay), gelir tablosu
     bir dönemin İÇ YAPISINI gösterir (dikey). Tersini yapmak — bilançoda
     dikey, gelir tablosunda yatay — bilgi vermez değil ama SORUYU KAÇIRIR. */
  /* §226 ?mod=teshis — HANGİ ETİKET NE BULDU, HAM HALİYLE.
     "Kalem eksik geliyor" şikâyeti tahminle çözülmez. Bu uç her etiket için
     şunu söyler: bulundu mu, hangi varyantla, satırın ham hâli ne, hangi
     sayılar çıktı, kısıt neden reddetti.
     Sayfada GEÇEN ama listemde OLMAYAN başlıkları da tarar — şablona neyin
     eklenmesi gerektiği görünsün.
     Bu, TEFAS (§145) ve Finnhub (§167) teşhislerinin aynı deseni: önce
     GÖRÜNÜR yap, sonra oku. */
  if (_mod === 'teshis') {
    /* §228b KOD İLE DE ÇALIŞSIN. Kimlik bulmak için önce mod=fr koşmak
       gerekiyordu — teşhis için fazladan adım. ?kod=CANTE&gun=15 verilirse
       kimliği kendi bulur ve TABLO TAŞIYAN bildirimi seçer (§227). */
    let id = String((req.query && req.query.id) || '').replace(/[^0-9]/g,'').slice(0,10);
    let secilen = null;
    if(!id){
      const kodI = String((req.query && req.query.kod) || '').toUpperCase().replace(/[^A-Z]/g,'').slice(0,6);
      if(!kodI) return res.status(400).json({ surum:_SURUM, ok:false, err:'id ya da kod gerekli' });
      const gunI = Math.min(Math.max(parseInt(req.query && req.query.gun) || 15, 1), 40);
      const UA2 = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';
      const G2 = 86400000, N2 = Date.now(), iso2 = t => new Date(t).toISOString().slice(0,10);
      const bulunan = [];
      for(let b = gunI; b > 0; b -= 5){
        try{
          const rr = await fetch('https://www.kap.org.tr/tr/api/disclosure/members/byCriteria', {
            method:'POST',
            headers:{ 'content-type':'application/json', 'accept':'application/json',
                      'referer':'https://www.kap.org.tr/tr/bildirim-sorgu', 'user-agent':UA2 },
            body: JSON.stringify({ fromDate: iso2(N2 - b*G2), toDate: iso2(N2 - Math.max(b-5,0)*G2),
                                   mkkMemberOidList: [], subjectList: [] }),
            signal: AbortSignal.timeout(12000) });
          if(!rr.ok) continue;
          const jj = await rr.json();
          (Array.isArray(jj) ? jj : (jj.items||jj.data||[])).forEach(x=>{
            if(String(x.disclosureClass||'').toUpperCase() !== 'FR') return;
            if(String(x.stockCodes||'').toUpperCase().indexOf(kodI) < 0) return;
            bulunan.push({ id:x.disclosureIndex, baslik:x.subject||x.kapTitle,
              tarih:String(x.publishDate||'').slice(0,10), yil:x.year, donem:x.period });
          });
        }catch(e){}
      }
      const tablolu = bulunan.filter(x=>/^Finansal Rapor/i.test(String(x.baslik||'')));
      /* §232b SESSİZCE BAŞKASINA DÜŞME. Önce tablo taşıyan yoksa listedeki
         ilkine düşüyordu — CANTE'de sürdürülebilirlik raporuna düşüp
         "0 kalem" raporladı. Teşhis aracının KENDİSİ yanıltıcı olmuş.
         Artık tablo yoksa AÇIKÇA söylenir ve ne bulunduğu listelenir. */
      if(!tablolu.length){
        return res.status(200).json({ surum:_SURUM, ok:false, kod:kodI,
          err:'Bu pencerede FİNANSAL TABLO içeren bildirim YOK',
          bulunanlar: bulunan.map(x=>({ id:x.id, baslik:x.baslik, tarih:x.tarih, yil:x.yil, donem:x.donem })),
          not:'KAP disclosureClass=FR altında sürdürülebilirlik raporu, faaliyet raporu ve sorumluluk beyanı da geliyor — bunların içinde BİLANÇO YOKTUR. Şirket bu pencerede finansal rapor vermemiş olabilir; daha geniş ?gun= dene.' });
      }
      secilen = tablolu[0];
      if(!secilen) return res.status(200).json({ surum:_SURUM, ok:false, kod:kodI,
        err:'FR bildirimi bulunamadı ('+gunI+' gün penceresinde)', bulunanlar:bulunan });
      id = String(secilen.id);
    }
    const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';
    try{
      const r = await fetch('https://www.kap.org.tr/tr/Bildirim/'+id, {
        headers:{ 'user-agent':UA, 'accept':'text/html', 'referer':'https://www.kap.org.tr/tr/bildirim-sorgu' },
        signal: AbortSignal.timeout(22000) });
      if(!r.ok) return res.status(200).json({ surum:_SURUM,  ok:false, id, http:r.status });
      let h = await r.text();
      const KACIS = { '\\u003c':'<', '\\u003e':'>', '\\"':'"', '\\n':' ' };
      h = h.replace(/\\u003[ce]|\\"|\\n/g, m => KACIS[m] || m);

      const _birimTe = _birimBul(h), _sinirTe = _ustSinir(_birimTe);
      const rapor = [];
      /* §233 TEŞHİS TÜM ŞABLONLARI TARASIN.
         Önce yalnız _SANAYI ve _BANKA (8/6 kalemlik KART şablonu) taranıyordu.
         Ama Finansal Tablolar sekmesi mod=tablo kullanıyor ve o GENİŞ
         şablonlarla çalışıyor (_BILANCO_SANAYI 15 · _GELIR_SANAYI 18 · banka
         karşılıkları). Teşhis onları taramıyordu — yani mod=tablo'nun sorunu
         teşhis edilemiyordu.
         Bir teşhis aracı, TEŞHİS ETTİĞİ SİSTEMLE AYNI ŞABLONA bakmalı.
         `kaynak` alanı hangi listeden geldiğini söyler. */
      const TUM = [
        ..._SANAYI.map(x=>[x[0], x[1], 'kart/sanayi']),
        ..._BANKA.map(x=>[x[0], x[1], 'kart/banka']),
        ..._BILANCO_SANAYI.map(x=>[x[0], x[1], 'tablo/bilanço-sanayi']),
        ..._GELIR_SANAYI.map(x=>[x[0], x[1], 'tablo/gelir-sanayi']),
        ..._BILANCO_BANKA.map(x=>[x[0], x[1], 'tablo/bilanço-banka']),
        ..._GELIR_BANKA.map(x=>[x[0], x[1], 'tablo/gelir-banka'])
      ];
      TUM.forEach(([ad, etiketler, kaynak])=>{
        const kayit = { ad, kaynak, denenen:[] };
        for(const e of etiketler){
          const kalip = new RegExp('>'+e.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\s*<\\/div>', 'g');
          let m, bulundu = 0;
          while((m = kalip.exec(h)) !== null && bulundu < 3){
            bulundu++;
            /* §235b TEŞHİS AYRIŞTIRICININ GÖRDÜĞÜNÜ GÖSTERSİN.
               Aynı dar-sınır + kurtarma mantığı; yoksa teşhis "sayı yok" der
               ama ayrıştırıcı bulur (ya da tersi) — arac yaniltir. */
            const satirSon = h.indexOf('</tr>', m.index);
            const dar = (satirSon > 0 && satirSon - m.index < 4000) ? satirSon : m.index + 2200;
            const cek = (son) => [...h.slice(m.index, son).matchAll(/>([\-\(]?[\d.,]{3,})\s*</g)].map(x=>x[1]);
            let ham = cek(dar), genisletildi = false;
            if(!ham.filter(x=>_sayiCoz(x)!==null).length && dar < m.index + 2200){
              ham = cek(m.index + 2200); genisletildi = true;
            }
            const sinir = genisletildi ? (m.index + 2200) : dar;
            const coz = ham.map(x=>_sayiCoz(x));
            const gecerli = coz.filter(v=>v!==null);
            kayit.denenen.push({ etiket:e, konum:m.index,
              satirUzunluk: sinir - m.index, genisletildi,
              hamHucreler: ham.slice(0,8),
              cozulen: gecerli.slice(0,6),
              kisitGecti: gecerli.length ? _isaretUygun(ad, gecerli[0], _sinirTe) : false,
              redSebebi: gecerli.length && !_isaretUygun(ad, gecerli[0], _sinirTe)
                ? (Math.abs(gecerli[0])>_sinirTe ? ('büyüklük sınırı '+_sinirTe) : 'işaret uyuşmazlığı') : null });
          }
          if(kayit.denenen.length) break;
        }
        if(!kayit.denenen.length) kayit.hicBulunamadi = true;
        rapor.push(kayit);
      });

      /* Sayfada geçen AMA listemde olmayan başlıklar — şablona eklenecekler */
      const bilinen = new Set([..._SANAYI, ..._BANKA].flatMap(x=>x[1]));
      const adaylar = [...new Set(
        [...h.matchAll(/>([A-ZÇĞİÖŞÜ][A-Za-zÇĞİÖŞÜçğıöşü\s,()\-]{8,58})\s*<\/div><\/td>/g)]
          .map(m=>m[1].trim())
          .filter(t=>!bilinen.has(t) && /[A-ZÇĞİÖŞÜ]{2,}|Kar|Kâr|Gelir|Gider|Varlık|Yükümlülük|Özkaynak|Hasılat|Nakit/.test(t))
      )].slice(0,45);

      /* Şablon bazında özet — hangi listenin işlediği tek bakışta görünsün */
      const ozet = {};
      rapor.forEach(x=>{
        const k = x.kaynak || '?';
        if(!ozet[k]) ozet[k] = { toplam:0, bulunan:0 };
        ozet[k].toplam++;
        if(!x.hicBulunamadi && x.denenen[0] && x.denenen[0].kisitGecti) ozet[k].bulunan++;
      });
      return res.status(200).json({ surum:_SURUM, ok:true, id, secilen, uzunluk:h.length,
        birim:_birimTe, ustSinir:_sinirTe, sablonOzeti:ozet,
        bulunan: rapor.filter(x=>!x.hicBulunamadi && x.denenen[0] && x.denenen[0].kisitGecti).length,
        rapor,
        sayfadakiDigerBasliklar: adaylar,
        not:'hamHucreler = satırdaki ham metinler · cozulen = sayıya dönenler · kisitGecti = işaret/büyüklük kısıtı. sayfadakiDigerBasliklar = listede OLMAYAN başlıklar, şablona eklenebilir.' });
    }catch(e){ return res.status(200).json({ surum:_SURUM,  ok:false, id, hata:String(e.message||e).slice(0,140) }); }
  }

  /* ── §338 mod=donemler — SIRKET BAZLI DONEM LISTESI (20 Agu) ───────────────
     KOK SORUN (olculdu): mod=fr TUM piyasanin bildirimlerini cekip sonra kod
     suzuyordu ve KAP'in 2000 KAYIT TAVANINA takiliyordu. Kanit: hem dar
     (8-9 Agu) hem genis (Tem-Ara) pencerede TAM 399 kayit dondu; listede
     BIMAS/SISE vardi ama TUPRS, THYAO, GARAN, ASELS, EREGL, KCHOL YOKTU.
     Yani buyuk sirketlerin finansallari bu yoldan HIC gorunmuyordu (bilanco
     borc defterinin neden hep orta-kucuk isimlerle doldugunu da bu aciklar).

     COZUM (kullanicinin verdigi KAP HAR dosyasindan cikti — gercek trafik):
       1) GET /tr/api/member/filter/{TICKER}
          -> [{companyCode, mkkMemberOid, title, permaLink}]
       2) GET /tr/api/financialTable/listCompanyExcelMembers/{oid}/{yil}/T
          -> o YILIN TUM donemleri: {stockCode, disclosureIndex, year, period}
     Sirket bazli oldugu icin TAVAN YOK; dort yil = dort istek = ~16 ceyrek.
     Donem tablolari mevcut mod=tablo ile cikarilir (olculdu: TUPRS 2024/2
     id 1321133 -> 1,6 sn, sablon sanayi, temel "ceyreklik (rapor sutunu)").

     PARAMETRELER: kod (zorunlu) · yil (kac yil geriye, varsayilan 4, tavan 8)
     CIKTI: {oid, unvan, donemler:[{yil,donem,id}...]} — en yeni ustte. */
  /* ── §340 mod=ham — TUM TABLOLARIN TUM SATIRLARI (20 Agu) ─────────────────
     KOK SORUN: mod=tablo SABIT etiket listesiyle calisiyor (bilanco 15, gelir
     18 kalem) ve NAKIT AKIS TABLOSU hic yok. Kullanici Excel modelindeki
     metrikleri istiyor; FAVOK (amortisman), serbest nakit akisi (yatirim
     harcamasi), faiz odemeleri gibi kalemler yalniz nakit akis tablosunda.

     KAYNAK OLCUMU (canli, TUPRS 2026/2 id 1643116): bildirim sayfasinda BES
     buyuk tablo var — Bilanco (595 satir), Kar/Zarar (142), Diger Kapsamli
     Gelir (167), NAKIT AKIS dolayli yontem (419), Ozkaynak Degisim (140).
     Her satirin basinda XBRL ETIKETI duruyor:
       ifrs-full_CashFlowsFromUsedInOperatingActivities | ISLETME FAALIYET... | 132.366.363 | 15.012.559
       kap-fr_ProfitLossForCashFlowStatement | Donem Kari (Zarari) | 50.272.473 | 11.981.560
     XBRL KODU STANDARTTIR — Turkce etiket sirketten sirkete degisebilir ama
     kod degismez. Eslestirme metne degil KODA dayanirsa sablon farki sorunu
     buyuk olcude coker (§114'un bu ekrandaki cozumu).

     BU MOD ham satirlari doner; SECIM ve METRIK panelde yapilir (tek sahip:
     ayristirma burada, yorum orada). Cikti: {tablolar:[{ad, satirlar:[...]}]}
     her satir {xbrl, etiket, degerler:[...]} — degerler sutun sirasiyla
     (cari, onceki, cari3A, onceki3A ... raporun kendi duzeni). */
  if (_mod === 'ham') {
    const idH = String((req.query && req.query.id) || '').replace(/[^0-9]/g, '');
    if (!idH) return res.status(400).json({ surum: _SURUM, ok: false, err: 'id gerekli' });
    try {
      const r = await fetch('https://www.kap.org.tr/tr/Bildirim/' + idH, {
        headers: { 'user-agent': UA, 'accept': 'text/html', 'referer': 'https://www.kap.org.tr/tr/bildirim-sorgu' },
        signal: AbortSignal.timeout(25000) });
      if (!r.ok) return res.status(200).json({ surum: _SURUM, ok: false, id: idH, err: 'sayfa HTTP ' + r.status });
      let h = await r.text();
      const KACIS = { '\\u003c': '<', '\\u003e': '>', '\\"': '"', '\\n': ' ' };
      h = h.replace(/\\u003[ce]|\\"|\\n/g, m => KACIS[m] || m);
      const birim = _birimBul(h);

      /* Tablolari <table ...> ... </table> siniriyla ayikla; yalnizca 40+
         satirli olanlar finansal tablodur (kucukler basluk/duzen tablosu). */
      const tablolar = [];
      const trSay = (blok) => (blok.match(/<tr[\s>]/g) || []).length;
      let p = 0, koruma = 0;
      while (koruma++ < 4000) {
        const bas = h.indexOf('<table', p); if (bas < 0) break;
        const son = h.indexOf('</table>', bas); if (son < 0) break;
        const blok = h.slice(bas, son);
        p = son + 8;
        if (trSay(blok) < 40) continue;

        /* Sutun basliklari: "Cari Dönem", "Önceki Dönem", "Cari Dönem 3 Aylık"… */
        const basSatir = (blok.match(/<tr[\s\S]{0,3000}?<\/tr>/) || [''])[0];
        const sutunlar = [...basSatir.matchAll(/>([^<>]{4,80}?)</g)].map(x => x[1].replace(/\s+/g, ' ').trim())
          .filter(x => /Dönem|Period|Özkaynak/i.test(x)).slice(0, 8);

        /* Tablo adi: XBRL kok etiketinden ya da ilk metinden */
        const adM = blok.match(/(kap-fr|ifrs-full)_(StatementOfFinancialPosition|IncomeStatement|StatementOfCashFlows[A-Za-z]*|StatementOfOtherComprehensive[A-Za-z]*|StatementOfChangesInEquity)/);
        const adHam = (blok.match(/>\s*(Finansal Durum Tablosu[^<]{0,40}|Kar veya Zarar Tablosu[^<]{0,30}|Nakit Ak[ıi]ş Tablosu[^<]{0,40}|Diğer Kapsamlı Gelir[^<]{0,40}|Özkaynak[^<]{0,40})</) || [])[1];
        const ad = (adHam || (adM ? adM[2] : 'tablo')).replace(/\s+/g, ' ').trim();

        /* Satirlar: her <tr> icinde ilk hucre XBRL kodu, sonra etiket, sonra sayilar */
        const satirlar = [];
        for (const tm of blok.matchAll(/<tr[\s\S]{0,6000}?<\/tr>/g)) {
          const tr = tm[0];
          const hucreler = [...tr.matchAll(/<t[dh][^>]*>([\s\S]{0,600}?)<\/t[dh]>/g)]
            .map(x => x[1].replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim());
          if (!hucreler.length) continue;
          const xbrl = (hucreler.find(x => /^(kap-fr|ifrs-full|tr-fr)_[A-Za-z0-9_]+$/.test(x)) || '').trim();
          const sayilar = [];
          hucreler.forEach(x => {
            if (/^[\-(]?[\d.]{1,20}(,\d+)?\)?$/.test(x.replace(/\s/g, ''))) {
              const v = _sayiCoz(x); if (v !== null) sayilar.push(v);
            }
          });
          /* Etiket: XBRL ve sayi olmayan, harf iceren ILK hucre */
          const etiket = (hucreler.find(x => x && x !== xbrl && /[A-Za-zÇĞİÖŞÜçğıöşü]/.test(x) && !/^[\d.,\-()]+$/.test(x)) || '').slice(0, 120);
          if (!etiket && !sayilar.length) continue;
          if (!xbrl && !sayilar.length) continue;
          satirlar.push({ xbrl: xbrl || null, etiket, degerler: sayilar.slice(0, 6) });
        }
        if (satirlar.length >= 20) tablolar.push({ ad, sutunlar, satir: satirlar.length, satirlar });
      }
      return res.status(200).json({ surum: _SURUM, ok: tablolar.length > 0, id: idH,
        birim, tabloSayisi: tablolar.length, tablolar });
    } catch (e) {
      return res.status(200).json({ surum: _SURUM, ok: false, id: idH, err: String(e && e.message || e).slice(0, 120) });
    }
  }

  if (_mod === 'donemler') {
    const kodD = String((req.query && req.query.kod) || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
    if (!kodD) return res.status(400).json({ surum: _SURUM, ok: false, err: 'kod gerekli' });
    const yilSayi = Math.min(8, Math.max(1, parseInt((req.query && req.query.yil) || '4', 10) || 4));
    const BAS = { 'user-agent': UA, 'accept': 'application/json', 'referer': 'https://www.kap.org.tr/tr/bildirim-sorgu' };
    try {
      const mr = await fetch('https://www.kap.org.tr/tr/api/member/filter/' + encodeURIComponent(kodD),
        { headers: BAS, signal: AbortSignal.timeout(12000) });
      if (!mr.ok) return res.status(200).json({ surum: _SURUM, ok: false, err: 'member/filter HTTP ' + mr.status });
      const mj = await mr.json();
      const uye = Array.isArray(mj) ? mj[0] : null;
      if (!uye || !uye.mkkMemberOid) return res.status(200).json({ surum: _SURUM, ok: false, err: 'kod bulunamadı: ' + kodD });

      const buYil = new Date().getFullYear();
      const yillar = []; for (let i = 0; i < yilSayi; i++) yillar.push(buYil - i);
      const donemler = []; const hatalar = [];
      /* Yillar PARALEL cekilir — dort istek, ~1 sn. */
      const sonuc = await Promise.allSettled(yillar.map(y =>
        fetch('https://www.kap.org.tr/tr/api/financialTable/listCompanyExcelMembers/' + uye.mkkMemberOid + '/' + y + '/T',
          { headers: BAS, signal: AbortSignal.timeout(12000) })
          .then(r => r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status)))
          .then(arr => ({ y, arr: Array.isArray(arr) ? arr : [] }))
      ));
      sonuc.forEach((s, i) => {
        if (s.status !== 'fulfilled') { hatalar.push(yillar[i] + ': ' + String(s.reason && s.reason.message || s.reason).slice(0, 40)); return; }
        s.value.arr.forEach(x => {
          if (!x || !x.disclosureIndex) return;
          donemler.push({ yil: +x.year, donem: +x.period, id: String(x.disclosureIndex), kod: x.stockCode || kodD });
        });
      });
      /* Ayni yil+donem birden fazla bildirim tasiyabilir (duzeltme/yeniden
         ilan): EN BUYUK disclosureIndex en yenisidir, o kalir (§204 dersi). */
      const enIyi = new Map();
      donemler.forEach(d => {
        const k = d.yil + '|' + d.donem;
        const v = enIyi.get(k);
        if (!v || +d.id > +v.id) enIyi.set(k, d);
      });
      const liste = [...enIyi.values()].sort((a, b) => (b.yil - a.yil) || (b.donem - a.donem));
      return res.status(200).json({ surum: _SURUM, ok: liste.length > 0, kod: kodD,
        oid: uye.mkkMemberOid, unvan: uye.title || null, companyCode: uye.companyCode || null,
        yilSayi, adet: liste.length, donemler: liste, hatalar: hatalar.length ? hatalar : undefined });
    } catch (e) {
      return res.status(200).json({ surum: _SURUM, ok: false, err: String(e && e.message || e).slice(0, 120) });
    }
  }

  if (_mod === 'tablo') {
    const id = String((req.query && req.query.id) || '').replace(/[^0-9]/g,'').slice(0,10);
    if(!id) return res.status(400).json({ surum:_SURUM,  ok:false, err:'id gerekli — /api/kap?mod=fr ile bul' });
    const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';
    try{
      const r = await fetch('https://www.kap.org.tr/tr/Bildirim/'+id, {
        headers:{ 'user-agent':UA, 'accept':'text/html', 'referer':'https://www.kap.org.tr/tr/bildirim-sorgu' },
        signal: AbortSignal.timeout(22000) });
      if(!r.ok) return res.status(200).json({ surum:_SURUM,  ok:false, id, http:r.status, err:'sayfa alınamadı' });
      let h = await r.text();
      const KACIS = { '\\u003c':'<', '\\u003e':'>', '\\"':'"', '\\n':' ' };
      h = h.replace(/\\u003[ce]|\\"|\\n/g, m => KACIS[m] || m);

      const _birimT = _birimBul(h), _sinirT = _ustSinir(_birimT);
      const bul = (etiketler, _ad) => _hucreBul(h, etiketler, _ad, _sinirT);
      const cikar = (liste) => {
        const c = {}; let dolu = 0;
        liste.forEach(([ad, et, gir])=>{ const v = bul(et, ad); if(v){ v.girinti = gir; dolu++; } c[ad] = v; });
        return { c, dolu };
      };

      /* Şablon TAHMİN edilmez, ÖLÇÜLÜR — hangisi daha çok dolarsa o (§205.3) */
      const bs = cikar(_BILANCO_SANAYI), bb = cikar(_BILANCO_BANKA);
      const sablon = bb.dolu > bs.dolu ? 'banka' : 'sanayi';
      const bil = sablon==='banka' ? bb : bs;
      const gel = cikar(sablon==='banka' ? _GELIR_BANKA : _GELIR_SANAYI);
      const bilListe = sablon==='banka' ? _BILANCO_BANKA : _BILANCO_SANAYI;
      const gelListe = sablon==='banka' ? _GELIR_BANKA : _GELIR_SANAYI;

      /* YATAY — bilanço: fark ve % değişim */
      const yatay = bilListe.map(([ad, et, gir])=>{
        const v = bil.c[ad];
        if(!v) return { ad, etiket:et[0], girinti:gir, yok:true };
        const f = (v.deger!=null && v.onceki!=null) ? v.deger - v.onceki : null;
        return { ad, etiket:v.etiket, girinti:gir, cari:v.deger, onceki:v.onceki,
          fark:f, degisim: (f!=null && v.onceki) ? +((f/Math.abs(v.onceki))*100).toFixed(1) : null };
      });

      /* DİKEY — gelir tablosu: hasılatın yüzdesi. Çeyrek sütunu varsa ONA göre. */
      const payAd = sablon==='banka' ? 'faizGelir' : 'ciro';
      const pv = gel.c[payAd];
      const ceyrekVar = !!(pv && pv.ceyrek != null);
      const payda  = pv ? (ceyrekVar ? pv.ceyrek : pv.deger) : null;
      const payda0 = pv ? (ceyrekVar ? pv.ceyrekOnceki : pv.onceki) : null;
      const dikey = gelListe.map(([ad, et, gir])=>{
        const v = gel.c[ad];
        if(!v) return { ad, etiket:et[0], girinti:gir, yok:true };
        const c  = ceyrekVar ? v.ceyrek : v.deger;
        const c0 = ceyrekVar ? v.ceyrekOnceki : v.onceki;
        const p  = (c!=null && payda)  ? +((c/payda)*100).toFixed(2)  : null;
        const p0 = (c0!=null && payda0)? +((c0/payda0)*100).toFixed(2): null;
        return { ad, etiket:v.etiket, girinti:gir, cari:c, onceki:c0,
          pay:p, oncekiPay:p0, puanFark: (p!=null && p0!=null) ? +(p-p0).toFixed(2) : null };
      });

      res.setHeader('Cache-Control','s-maxage=86400, stale-while-revalidate=604800');
      return res.status(200).json({ surum:_SURUM,  ok:(bil.dolu+gel.dolu)>0, id, sablon, birim:_birimT, ustSinir:_sinirT,
        temel: ceyrekVar ? 'çeyreklik (rapor sütunu)' : 'kümülatif',
        bilanco: { bulunan:bil.dolu, toplam:bilListe.length, kalemler:yatay },
        gelir:   { bulunan:gel.dolu, toplam:gelListe.length, kalemler:dikey, payda, payda0 },
        not:'YATAY (bilanço): fark = cari − önceki, değişim %. DİKEY (gelir tablosu): pay = kalem / '+(sablon==='banka'?'faiz gelirleri':'hasılat')+' × 100, puanFark = cari pay − önceki pay. BİRİM `birim` alanında (raporun beyanı). Bulunamayan kalem "yok:true" taşır — sessizce atlanmaz.' });
    }catch(e){ return res.status(200).json({ surum:_SURUM,  ok:false, id, hata:String(e.message||e).slice(0,140) }); }
  }

  if (_mod === 'kart') {
    const id  = String((req.query && req.query.id) || '').replace(/[^0-9]/g,'').slice(0,10);
    if(!id) return res.status(400).json({ surum:_SURUM,  ok:false, err:'id gerekli' });
    try{
      const b = await _bilancoAyristir(id);
      if(!b || !b.ok) return res.status(200).json({ surum:_SURUM,  ok:false, id, err:'bilanço ayrıştırılamadı', detay:b });

      const K = b.kalemler;
      const al = (ad, alan) => (K[ad] && K[ad][alan] != null) ? K[ad][alan] : null;
      const yuzde = (a, b0) => (a==null || b0==null || b0===0) ? null : +(((a/b0)-1)*100).toFixed(1);
      const marj  = (a, c) => (a==null || !c) ? null : +((a/c)*100).toFixed(2);
      const puan  = (a, b0) => (a==null || b0==null) ? null : +(a-b0).toFixed(2);

      /* ÇEYREKLİK öncelikli — rapor sütunu varsa o, yoksa kümülatif */
      const ceyrekVar = K.ciro && K.ciro.ceyrek != null;
      const c  = (ad) => ceyrekVar ? al(ad,'ceyrek') : al(ad,'deger');
      const c0 = (ad) => ceyrekVar ? al(ad,'ceyrekOnceki') : al(ad,'onceki');

      const m = {};
      if(b.sablon === 'sanayi'){
        const ciro=c('ciro'), ciro0=c0('ciro');
        const brut=c('brutKar'), brut0=c0('brutKar');
        const faal=c('faaliyetKar'), faal0=c0('faaliyetKar');
        const net=c('netKar'), net0=c0('netKar');
        m.ciro        = { deger:ciro, yoy:yuzde(ciro,ciro0) };
        m.brutMarj    = { deger:marj(brut,ciro), oncekiMarj:marj(brut0,ciro0),
                          puanFark:puan(marj(brut,ciro), marj(brut0,ciro0)), tutar:brut, yoy:yuzde(brut,brut0) };
        m.faaliyetKar = { deger:faal, marj:marj(faal,ciro), oncekiMarj:marj(faal0,ciro0),
                          puanFark:puan(marj(faal,ciro), marj(faal0,ciro0)), yoy:yuzde(faal,faal0) };
        m.netKar      = { deger:net, marj:marj(net,ciro), oncekiMarj:marj(net0,ciro0),
                          puanFark:puan(marj(net,ciro), marj(net0,ciro0)), yoy:yuzde(net,net0) };
        m.finansGider = { deger:c('finansGider'), yoy:yuzde(Math.abs(c('finansGider')||0), Math.abs(c0('finansGider')||0)) };
        m.parasal     = { deger:c('parasal'), onceki:c0('parasal') };
        m.ozkaynak    = { deger:al('ozkaynak','deger'), onceki:al('ozkaynak','onceki') };
        m.nakit       = { deger:al('nakit','deger'), onceki:al('nakit','onceki') };
      } else {
        const nf=c('netFaiz'), nf0=c0('netFaiz');
        m.netFaiz  = { deger:nf, yoy:yuzde(nf,nf0) };
        m.komisyon = { deger:c('komisyon'), yoy:yuzde(c('komisyon'),c0('komisyon')) };
        m.karsilik = { deger:c('karsilik'), yoy:yuzde(Math.abs(c('karsilik')||0), Math.abs(c0('karsilik')||0)) };
        m.faalKar  = { deger:c('faalKar'), yoy:yuzde(c('faalKar'),c0('faalKar')) };
        m.netKar   = { deger:c('netKar'), yoy:yuzde(c('netKar'),c0('netKar')) };
        m.ozkaynak = { deger:al('ozkaynak','deger'), onceki:al('ozkaynak','onceki') };
      }

      /* DESEN İŞARETLERİ — yorum değil, BAKILACAK YER */
      const isaret = [];
      if(b.sablon === 'sanayi'){
        const fy = m.faaliyetKar.yoy, ny = m.netKar.yoy;
        if(fy != null && ny != null && fy < 0 && ny > 0)
          isaret.push({ tip:'alt satır dışsal', not:'faaliyet kârı y/y '+fy+'% düşerken net kâr '+ny+'% arttı — farkı finansman gideri ve/veya parasal pozisyon taşıyor olabilir. Operasyonel iyileşme DEĞİL.' });
        if(m.brutMarj.puanFark != null && m.brutMarj.puanFark < -0.5)
          isaret.push({ tip:'brüt marj erozyonu', not:'brüt marj '+m.brutMarj.puanFark+' puan geriledi ('+m.brutMarj.oncekiMarj+'% → '+m.brutMarj.deger+'%)' });
        if(m.faaliyetKar.puanFark != null && m.brutMarj.puanFark != null &&
           Math.abs(m.faaliyetKar.puanFark) > Math.abs(m.brutMarj.puanFark) * 1.5)
          isaret.push({ tip:'faaliyet gideri baskısı', not:'faaliyet marjı, brüt marjdan daha çok oynadı — sorun yalnız üretim maliyetinde değil, faaliyet giderlerinde de olabilir' });
        if(m.parasal.deger != null && m.netKar.deger && Math.abs(m.parasal.deger) > Math.abs(m.netKar.deger)*0.3)
          isaret.push({ tip:'parasal pozisyon ağır', not:'parasal pozisyon net kârın %'+Math.round(Math.abs(m.parasal.deger)/Math.abs(m.netKar.deger)*100)+'\'i kadar — enflasyon muhasebesi alt satırı belirgin etkiliyor' });
      } else {
        if(m.karsilik.yoy != null && m.karsilik.yoy > 50)
          isaret.push({ tip:'karşılık sıçraması', not:'karşılıklar y/y %'+m.karsilik.yoy+' arttı — ÇEYREKLİK ve YILLIK bazda AYRI AYRI bakılmalı, ikisi ters yön gösterebilir' });
        if(m.netFaiz.yoy != null && m.netFaiz.yoy > 40)
          isaret.push({ tip:'net faiz baz etkisi', not:'net faiz y/y %'+m.netFaiz.yoy+' — geçen yılın düşük bazından geliyor olabilir, ÇEYREKLİK seyre bakılmalı' });
      }

      /* §255 BİRİM ÇAPRAZ DOĞRULAMASI. Sayfa birimi beyan etmediyse (belirsiz),
         çeyreklik ciroyu panelin TTM cirosuna oranlayarak ölçeği KANITLA.
         İstemci `?ttm=<milyon TL>` geçirir (multiple.json'daki `ciro`).
         Geçmezse davranış AYNEN eskisi gibi kalır — belirsiz, belirsiz. */
      const _ttmRef = parseFloat(String(req.query.ttm || '').replace(',', '.'));
      const _pdRef  = parseFloat(String(req.query.pd  || '').replace(',', '.'));   /* §257b milyon TL */
      const _dg = _birimDogrula(b.birim, (m.ciro && m.ciro.deger), _ttmRef,
                                (m.ozkaynak && m.ozkaynak.deger), _pdRef);
      const _birimSon = _dg.birim;
      res.setHeader('Cache-Control','s-maxage=86400, stale-while-revalidate=604800');
      return res.status(200).json({ surum:_SURUM,  ok:true, id, sablon:b.sablon, birim:_birimSon,
        birimKanit:_dg.kanit,
        temel: ceyrekVar ? 'çeyreklik (rapor sütunu)' : 'kümülatif (çeyrek sütunu yok)',
        bulunan:b.bulunan, toplam:b.toplam, eksik:b.eksik,
        metrikler:m, isaretler:isaret,
        not:'Bu uç YORUM YAZMAZ ve SKOR VERMEZ. Rakamı, değişimi ve dikkat çeken deseni verir; kart metni ve skor insana aittir. BİRİM `birim` alanında — raporun kendi beyanından okundu, VARSAYILMADI. Marjlar %.' });
    }catch(e){ return res.status(200).json({ surum:_SURUM,  ok:false, id, hata:String(e.message||e).slice(0,140) }); }
  }

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
    if(!id) return res.status(400).json({ surum:_SURUM,  ok:false, err:'id gerekli — /api/kap?mod=fr çıktısındaki id' });
    try{
      /* §210b SIRAYLA, PARALEL DEĞİL. İki 5 MB sayfayı aynı anda işlemek
         belleği zorluyordu; ikinci ayrıştırma SESSİZCE düşüyor ve yalnız
         "ayrıştırılamadı" diyordu — sebep yok. Sıralı çekim hem hafif hem
         hangi adımda düştüğü belli. */
      const b1 = await _bilancoAyristir(id);
      if(!b1 || !b1.ok) return res.status(200).json({ surum:_SURUM,  ok:false, id, err:'cari bilanço ayrıştırılamadı', detay:b1 });
      /* §212c `onceki` ARTIK GEREKSİZ — yalnız YEDEK.
         Rapor kendi çeyrek sütununu taşıyor (§212), dolayısıyla tek bildirim
         yetiyor. DOĞRULANDI: TOASO 2Ç26'nın ON İKİ değeri de Fintables ile
         BİREBİR (altı kalem × cari/önceki).
         `onceki` yalnız çeyrek sütunu BULUNAMAYAN raporlar için duruyor —
         o zaman çıkarmaya düşer ve "⚠ enflasyon sapması" etiketi basar.
         Yani parametre artık istisna yolu, ana yol değil. */
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
        /* §212b ÖNCELİK SIRASI:
           1. RAPORUN KENDİ çeyrek sütunu — en doğru, aynı fiyat seviyesi
           2. çıkarma — yalnız 1. yoksa; ENFLASYON SAPMASI TAŞIR, işaretlenir
           3. 1. dönemse kümülatif zaten çeyrekliktir */
        if(c.ceyrek != null){
          ceyreklik[k] = { deger:c.ceyrek, onceki:c.ceyrekOnceki, tur:'rapor sütunu' };
          return;
        }
        if(!onc){ ceyreklik[k] = { deger:c.deger, onceki:c.onceki, tur:'kümülatif (çeyrek sütunu yok)' }; return; }
        const p = (b0 && b0.ok && b0.kalemler[k]) || null;
        if(!p){ ceyreklik[k] = { deger:null, onceki:null, tur:'hesaplanamadı' }; return; }
        ceyreklik[k] = { deger: cikar(c.deger,p.deger), onceki: cikar(c.onceki,p.onceki),
          tur:'çıkarma (⚠ enflasyon sapması taşır)' };
      });

      res.setHeader('Cache-Control','s-maxage=86400, stale-while-revalidate=604800');
      return res.status(200).json({ surum:_SURUM,  ok:true, id, oncekiId:b0Kullanilan||onc||null, sablon:b1.sablon,
        bulunan:b1.bulunan, toplam:b1.toplam, eksik:b1.eksik,
        kumulatif, ceyreklik,
        /* SEBEBİ SÖYLE — "ayrıştırılamadı" tek başına işe yaramaz (§145) */
        oncekiDurum: onc ? (b0 && b0.ok
          ? { ok:true, kullanilan:b0Kullanilan, bulunan:b0.bulunan, sablon:b0.sablon, denemeler }
          : { ok:false, sebep:b0Hata || 'bilinmiyor', denemeler }) : null,
        uyari: (onc && (!b0 || !b0.ok)) ? ('önceki dönem ayrıştırılamadı ('+(b0Hata||'sebep bilinmiyor')+') — çeyreklik yok, kümülatif var') : b1.uyari,
        not: 'kumulatif = raporun dönemsel sütunu (yılbaşından bugüne) · ceyreklik = raporun ÇEYREK sütunu (çıkarma yok, enflasyon sapması yok). onceki parametresi yalnız çeyrek sütunu olmayan raporlar için yedektir. STOK kalemleri (özkaynak, nakit) dönem sonu değeridir. Birim `birim` alanında.' });
    }catch(e){ return res.status(200).json({ surum:_SURUM,  ok:false, id, hata:String(e.message||e).slice(0,140) }); }
  }

  if (_mod === 'bilanco') {
    const id = String((req.query && req.query.id) || '').replace(/[^0-9]/g,'').slice(0,10);
    if(!id) return res.status(400).json({ surum:_SURUM,  ok:false, err:'id gerekli — /api/kap?mod=fr ile bul' });
    try{
      const c = await _bilancoAyristir(id);
      res.setHeader('Cache-Control','s-maxage=86400, stale-while-revalidate=604800');
      return res.status(200).json({ surum:_SURUM,  ...c, not:'deger = cari dönem · onceki = karşılaştırma dönemi. Birim `birim` alanında.' });
    }catch(e){ return res.status(200).json({ surum:_SURUM,  ok:false, id, hata:String(e.message||e).slice(0,140) }); }
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

    /* §245i PENCERE UYUMSUZLUĞU — çağıran 30 gün sanıyordu, kaynak yarım gün veriyordu.
       Eskiden burası SABİTTİ: 2 günlük pencere + .slice(0,150). sukuk.js ise
       /api/kap'ı PARAMETRESİZ çağırıp sonucu 30 GÜNLÜK süzgeçten geçiriyordu.
       Üstelik asıl darboğaz pencere değil DİLİMDİ: KAP günde ~280 bildirim
       üretiyor, 150 kayıt ≈ yarım gün. Yani sukuk süzgeci 30 gün soruyor,
       fiilen son YARIM GÜNÜ tarıyordu ve "canliAdet:0" dönüyordu.
       Bu, boş sonuçtan daha kötüsüydü: yanıt `pencereGun:30` diyordu, yani
       YANLIŞ BİLGİ veriyordu — "30 gün tarandı, piyasa sakin" dedirtiyordu.
       §243'ün ayrımı: eskilik görünür kusur, ÇELİŞKİ gizli yalandır.
       Artık gun/limit dışarıdan verilebiliyor. VARSAYILANLAR DEĞİŞMEDİ (2 gün,
       150 kayıt) — mevcut çağıranların davranışı aynı kalsın diye.
       TAVAN: §''de ölçülmüş — 7 günde 1978 kayıt geliyor, KAP tavanı 2000.
       Bu yüzden gun en fazla 10, limit en fazla 2000. Zaman aşımı da pencereye
       göre ölçekleniyor: dar pencerede 9 sn yeterli, geniş pencerede değil. */
    const gunIst = Math.min(Math.max(parseInt(req.query && req.query.gun) || 2, 1), 10);
    const limIst = Math.min(Math.max(parseInt(req.query && req.query.limit) || 150, 50), 2000);
    const gun = 86400000, simdi = new Date();
    const tarih = d => d.toISOString().slice(0,10);
    const govde = { fromDate: tarih(new Date(simdi - gunIst*gun)), toDate: tarih(simdi), mkkMemberOidList: [], subjectList: [] };
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
      signal: AbortSignal.timeout(gunIst <= 2 ? 9000 : 22000)
    });
    if (!r.ok) throw new Error('KAP HTTP '+r.status);
    const j = await r.json();
    const dizi = Array.isArray(j) ? j : (j.items || j.data || []);
    const hamAdet = dizi.length;
    const items = dizi.map(normalize).filter(Boolean)
      .sort((a,b)=>b.i-a.i).slice(0, limIst);
    return res.status(200).json({ surum:_SURUM,  ok: items.length>0, kaynak:'byCriteria', alinma:new Date().toISOString(),
      pencere: govde.fromDate+'..'+govde.toDate, pencereGun:gunIst, limit:limIst,
      /* hamAdet = KAP'ın döndürdüğü, SÜZÜLMEDEN önceki kayıt sayısı.
         Çağıran "0 sonuç" aldığında kaynağın mı sustuğunu yoksa süzgecin mi
         elediğini AYIRT EDEBİLSİN diye (§245h: ayırt etmeyen teşhis yoktur).
         hamAdet 2000'e dayanmışsa pencere KIRPILMIŞ demektir. */
      hamAdet, tavanaDayandi: hamAdet >= 2000, items,
      ...(items.length ? {} : { err:'Uç yanıt verdi ama kayıt çözülemedi (şema değişmiş olabilir)' }) });
  }catch(e){
    return res.status(200).json({ surum:_SURUM,  ok:false, err:'KAP kaynağına ulaşılamadı: '+String(e.message||e).slice(0,120), alinma:new Date().toISOString(), items:[] });
  }
}
