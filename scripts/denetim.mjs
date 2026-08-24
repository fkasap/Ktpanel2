/* KTPanel — DENETİM KURALLARI
 *
 * Neden ayrı dosya: tazeleme ile denetim BİRBİRİNDEN BAĞIMSIZ olmalı. Aynı
 * fonksiyon hem veriyi çekip hem "doğru mu" derse, çekme mantığındaki bir hata
 * denetimi de kandırır.
 *
 * 29 Tem 2026'da yakalanan üç hata bu kuralların gerekçesidir — üçü de
 * "veri geldi" diyordu ve üçü de sessizce yanlıştı:
 *   1. Model portföyde 40 hissenin 11'i ESKİ FİYATTA kalmıştı (yanlış listeden
 *      sorgu kurulmuştu) → ayrışma 0,75 puan yanlış çıktı, üstelik İYİ yönde
 *   2. Analist hedeflerinde 4 hisse 6 aydır güncellenmemişti → SNGYO'da
 *      +%238 sahte potansiyel
 *   3. Alpha Vantage yıllık EPS'i eksik çeyrekle veriyordu → "kâr düştü"
 *      görünümü, gerçekte +%32
 *
 * KURAL: denetimden geçmeyen veri YAZILMAZ. Eski veriyle kalmak, sessizce
 * bozuk veri yayınlamaktan iyidir.
 */

import { readdirSync } from 'node:fs';

export const KURALLAR = {

  /* ── KAPSAM: kaç kayıt bekleniyordu, kaçı geldi ──────────────────────────
     En basit ve en çok iş gören kural. "29/40" çıktısı 29 Tem'de hatayı
     anında gösterdi. Eksik oran eşiği aşarsa yazma. */
  kapsam(gelen, beklenen, esik = 0.95) {
    const oran = beklenen ? gelen / beklenen : 0;
    return {
      ad: 'kapsam',
      gecti: oran >= esik,
      mesaj: `${gelen}/${beklenen} (%${(oran * 100).toFixed(0)})`,
      detay: oran < esik ? `eşik %${esik * 100} — ${beklenen - gelen} kayıt eksik` : null
    };
  },

  /* ── AYKIRI DEĞER: tek bir kaydın makul aralığı aşması ───────────────────
     Fiyat serilerinde dağıtım/bölünme tuzağını yakalar. §149'da MPE'nin
     kâr payı dağıtımı böyle bulundu (tek günde −%3,57). */
  aykiri(kayitlar, alan, sinirYuzde) {
    const sapan = kayitlar.filter(k => {
      const d = k[alan];
      return d != null && Math.abs(d) > sinirYuzde;
    });
    return {
      ad: 'aykırı değer',
      gecti: sapan.length === 0,
      mesaj: sapan.length ? `${sapan.length} kayıt ±%${sinirYuzde} sınırını aştı` : `temiz (sınır ±%${sinirYuzde})`,
      detay: sapan.length ? sapan.slice(0, 8).map(k => `${k.kod}: ${k[alan]?.toFixed(2)}%`).join(' · ') : null
    };
  },

  /* ── İÇ TUTARLILIK: dönem getirileri artan olmalı ────────────────────────
     1G ≤ 1A ≤ 3A ≤ YTD gibi. Mutlak değil (piyasa düşerse ters döner) ama
     KABA bir sapma çapa hatasını gösterir. §149'da bu kural dağıtım
     düzeltmesini doğruladı. */
  donemArtan(kayitlar, alanlar, tolerans = 0.5) {
    const bozuk = [];
    kayitlar.forEach(k => {
      const g = k.g || k.getiriler;
      if (!Array.isArray(g)) return;
      for (let i = 1; i < alanlar.length; i++) {
        const onceki = g[alanlar[i - 1]], simdi = g[alanlar[i]];
        if (onceki == null || simdi == null) continue;
        if (simdi < onceki - tolerans) { bozuk.push(`${k.k || k.kod}`); break; }
      }
    });
    return {
      ad: 'dönem tutarlılığı',
      gecti: bozuk.length === 0,
      mesaj: bozuk.length ? `${bozuk.length} kayıtta dönem sırası bozuk` : 'temiz',
      detay: bozuk.length ? bozuk.slice(0, 10).join(', ') : null
    };
  },

  /* ── TARİH BİRLİĞİ: kayıtlar AYNI güne mi oturuyor ───────────────────────
     29 Tem'deki 1. hatanın doğrudan panzehiri. Karışık tarihli hesap sessizce
     yanlış sonuç üretir ve fark edilmez.
     §245s KURAL AKILLANDIRILDI (mutlaklık gevşetilmeden):
     1 Ağu koşusu üç katmanı "2 FARKLI tarih" ile düşürdü. Ölçüldü: 141
     hisseden birkaç likit olmayan kağıt Cuma HİÇ İŞLEM GÖRMEMİŞTİ — onların
     son Yahoo barı Perşembe. Bu veri hatası DEĞİL, piyasa gerçeği: işlem
     görmeyen hissenin resmî fiyatı önceki kapanıştır, BIST endeksi de öyle
     hesaplar. Mutlak "tek tarih" şartı likit olmayan kuyrukta HER ZAMAN
     kırılır ve katmanı komple düşürür — 29 Tem'in korkusu (karışık GÜNLER
     boyunca sürüklenen bayat fiyat) ile bunun arası ayrılmalı.
     YENİ ÖLÇÜT (üçü birden sağlanmalı, yoksa yine KALIR):
       a) BASKIN tarih kayıtların ≥ %90'ını kapsar
       b) azınlık, baskından EN FAZLA 3 takvim günü geridedir
       c) azınlık İSİMLE raporlanır — sessiz tolerans yok
     Tek hisse 5 gün geride kalırsa (a) sağlansa da (b) düşürür: sürüklenen
     bayat fiyat hâlâ yakalanır. */
  tarihBirligi(kayitlar, alan = 'tarih') {
    const dolu = kayitlar.filter(k => k && k[alan]);
    const sayim = {};
    dolu.forEach(k => { sayim[k[alan]] = (sayim[k[alan]] || 0) + 1; });
    const tarihler = Object.keys(sayim).sort();
    if (tarihler.length <= 1) return {
      ad: 'tarih birliği', gecti: true,
      mesaj: `tek tarih: ${tarihler[0] || '—'}`, detay: null
    };
    const baskin = tarihler.reduce((a, b) => sayim[b] > sayim[a] ? b : a);
    const oran = sayim[baskin] / dolu.length;
    const enEski = tarihler[0];
    const gunFark = Math.round((new Date(baskin) - new Date(enEski)) / 86400000);
    const azinlik = dolu.filter(k => k[alan] !== baskin)
      .map(k => `${k.kod || '?'}:${k[alan]}`);
    const gecti = oran >= 0.90 && gunFark <= 3;
    return {
      ad: 'tarih birliği',
      gecti,
      mesaj: gecti
        ? `baskın ${baskin} (%${Math.round(oran * 100)}) · ${azinlik.length} kayıt ≤${gunFark} gün geride (işlem görmemiş olabilir)`
        : `${tarihler.length} FARKLI tarih · baskın %${Math.round(oran * 100)}${gunFark > 3 ? ` · en eski ${gunFark} gün geride` : ''}`,
      detay: azinlik.length ? azinlik.slice(0, 8).join(' · ') : tarihler.join(' · ')
    };
  },

  /* ── BAYATLIK: kayıt yaşı sınırı aştı mı ─────────────────────────────────
     Tazelenemeyenler İŞARETLENİR, sessizce bırakılmaz. 29 Tem'deki
     2. hatanın panzehiri: eski veri, eksik veriden tehlikelidir çünkü
     GÖRÜNMEZ — bir sayı vardır, makul durur, hesaba girer. */
  bayatlik(kayitlar, tarihAlan, gunSiniri) {
    const simdi = Date.now();
    const bayat = kayitlar.filter(k => {
      const t = k[tarihAlan]; if (!t) return true;
      return (simdi - new Date(t).getTime()) / 86400000 > gunSiniri;
    });
    return {
      ad: 'bayatlık',
      gecti: true,                       // uyarı verir ama yazmayı ENGELLEMEZ
      uyari: bayat.length > 0,
      mesaj: bayat.length ? `${bayat.length} kayıt ${gunSiniri} günden eski — "bayat" işaretlendi` : 'hepsi taze',
      detay: bayat.length ? bayat.slice(0, 10).map(k => k.k || k.kod).join(', ') : null,
      isaretle: bayat.map(k => k.k || k.kod)
    };
  },

  /* ── TOPLAM: ağırlıklar beklenen toplamı tutturuyor mu ───────────────────
     Endeks ağırlıklarında normalize hatasını yakalar. XKTUM'da toplam ~96,5
     olmalı (242 üyenin 150'si yazılı) — 100 çıkarsa yanlışlıkla normalize
     edilmiş demektir ve tüm aktif ağırlıklar sistematik kayar. */
  toplam(deger, hedef, tolerans = 0.5) {
    const fark = Math.abs(deger - hedef);
    return {
      ad: 'toplam',
      gecti: fark <= tolerans,
      mesaj: `${deger.toFixed(2)} (hedef ${hedef} ±${tolerans})`,
      detay: fark > tolerans ? `sapma ${fark.toFixed(2)} — normalize hatası olabilir` : null
    };
  },

  /* ── SERI GUNCELLIGI (§291/297): dosyanin damgasi degil KALEMIN yasi olculur.
     Gerekce: track.json "taze"ydi (holdings her gun tazeleniyor), series 20 gun
     KESIKTI — dosya-bazli tazelik bunu hic goremedi. Referans tarih dosyanin
     kendi fiyat_tarihi'dir; boylece hafta sonu/tatil yanlis alarm uretmez. */
  seriGuncel(seriSonTarih, referansTarih, maksGun = 4, etiket = 'seri') {
    const ad = 'seri guncelligi (' + etiket + ')';
    const f = Math.round((new Date(referansTarih) - new Date(seriSonTarih)) / 864e5);
    if (!isFinite(f)) return { ad, gecti: false, mesaj: 'tarih okunamadi: seri=' + seriSonTarih + ' referans=' + referansTarih };
    /* §300 NEGATIF FARK AYRI BIR ARIZA SINIFIDIR — kirmizi DEGIL, uyari.
       18 Agu olcumu: seri 17 Agu, referans (track.fiyat_tarihi) 14 Agu -> -3g.
       Ilk yazimda kural `f >= 0` sarti yuzunden KALDI dedi ve isi kirmiziya
       boyadi. Ama seri KESIK DEGILDI; tam tersine referanstan TAZEYDI.
       Gercek ariza baska yerdeydi: fiyat kaynagi (Yahoo) 17 Agu'dan 14 Agu'ya
       GERILEMIS, dosya eski tarihle uzerine yazilmisti.
       Kural artik dogru yere parmak basiyor: 'seri ileride' demiyor, 'referans
       gerilemis olabilir' diyor. Ve UYARI veriyor — cunku bu durumda VERI KAYBI
       YOKTUR (seri zaten daha taze); kirmizi yakmak, gercek kesikligin kirmizisini
       degersizlestirir. Bir nobetci her hickirikta bagirirsa kimse dinlemez. */
    if (f < 0) return { ad, gecti: true, uyari: true,
      mesaj: seriSonTarih + ' (referans ' + referansTarih + ' — seri referanstan ' + (-f) + 'g ILERIDE)',
      detay: 'seri kesik DEGIL; REFERANS DOSYA GERILEMIS — fiyat kaynagi eski gun dondurmus olabilir (§300 geri gitme korumasi rapora bakiniz)' };
    return { ad,
      gecti: f <= maksGun,
      mesaj: seriSonTarih + ' (referans ' + referansTarih + ', fark ' + f + 'g)',
      detay: (f > maksGun) ? 'seri KESIK — ekleme adimi kosmamis olabilir (§291)' : null };
  },

  /* ── IKIZ DOSYA (§297): kazara kopya sinifi — kok mail.js, kok app.js,
     api/ajan.js: ayni kaza UC KEZ yasandi. Kural 1: repo KOKUNDE kod dosyasi
     durmaz (kod ktpanel/ altindadir). Kural 2: ktpanel/api/ yalniz bilinen
     fonksiyonlari icerir — yabanci dosya hem Vercel slotu yakar (§7.3, 12
     sinir) hem surtuklenme riskidir (duzeltme yanlis kopyada yasar). */
  ikizDosya() {
    /* platts.js: §251b mesru 11. fonksiyon (S&P koprusu) — kota 11/12, tek slot kaldi */
    const API_BEYAZ = new Set(['ajanktp.js', 'bddk.js', 'data.js', 'evds2.js', 'kap.js', 'edgar.js',
      'katfon.js', 'market.js', 'platts.js', 'tcmb.js', 'tefas.js', 'usnews.js']);
    const h = [];
    try { for (const f of readdirSync('.'))
      if (/\.(js|html)$/.test(f)) h.push('KOKTE KOD: ' + f); } catch (e) {}
    /* SS335 KAPSAM BOSLUGU (19 Agu, ucuncu kaza): bekci yalniz .js bakiyordu.
       app.js api/'ye dusunce yakalandi — ama ayni gun index.html de dustu ve
       GORULMEDI. Kopya index.html slot yakmaz, fakat SURTUKLENME riski aynidir:
       yanlis kopyayi duzenlemek panelde "degisiklik gorunmuyor" saatleri demek
       (bu kaza uc kez yasandi, ucunde de yukleme sirasinda yanlis klasordeydi).
       Artik api/ altinda BEYAZ LISTE DISI her kod/sayfa dosyasi yakalanir;
       _lib/ klasoru ve uzantisiz girdiler dokunulmaz kalir. */
    try { for (const f of readdirSync('ktpanel/api').filter(x => /\.(js|mjs|html|htm|css)$/i.test(x)))
      if (!API_BEYAZ.has(f)) h.push('api/ BEYAZ LISTE DISI: ' + f +
        (/\.(js|mjs)$/i.test(f) ? ' (slot yakar, §7.3)' : ' (kopya — sürüklenme riski)')); } catch (e) {}
    /* §407b KOK YETIM KOPYA BEKCISI: 24 Agu'da ktpanel/ KOKUNDE yetim bir
       edgar.js bulundu (api/'dekinin ESKI -a surumu; index.html'den referans 0,
       bir kez silinip yukleme setiyle GERI gelmis). api/ bekcisi koku gormuyordu
       — ayni sinif kaza, bir klasor otede. UYARI seviyesi (is kirmizi yanmaz):
       yetim kopya slot yakmaz ama surtuklenme riski ayni (§335). */
    const KOK_BEYAZ = new Set(['app.js', 'ajan.js', 'mail.js', 'middleware.js']);
    const ku = [];
    try { for (const f of readdirSync('ktpanel').filter(x => /\.(js|mjs)$/i.test(x)))
      if (!KOK_BEYAZ.has(f)) ku.push('KOK YETIM: ktpanel/' + f + ' (hicbir yerden yuklenmiyor — sil)'); } catch (e) {}
    return { ad: 'ikiz dosya', gecti: !h.length, uyari: ku.length > 0,
      mesaj: (h.length ? h.join(' · ') : 'temiz') + (ku.length ? ' · ' + ku.join(' · ') : ''),
      detay: h.length ? 'sil ya da ktpanel/ altina tasi — bu kaza uc kez yasandi' : (ku.length ? 'kok beyaz liste: app/ajan/mail/middleware' : null) };
  },

  /* ── FIYAT YASI (§301): tarih birligi KOR NOKTASININ kapanisi.
     OLCULDU (18 Agu): Yahoo BIST beslemesi bozuldu — 17 Agu barinin close'u
     null, 18 Agu bari hic yok, meta regularMarketPrice 11 Agu kapanisina esit.
     Kod dogru davranip null'u atladi ve 14 Agu'ya dustu. AMA raporda
     'tarih birligi: tek tarih 2026-08-14' YESIL yandi — cunku o kural
     'hepsi ayni gunde mi' diye soruyor, 'O GUN BUGUNE YAKIN MI' diye sormuyor.
     141 hisse BIRLIKTE eskirse denetim sessiz kaliyordu (§179.3'un olcum
     tarafindaki bosluk). Bu kural fiyatin YASINI is gunuyle sayar.
     HEP UYARI, ASLA KIRMIZI: kirmizi katmani durdurur; kaynak donmusken
     durduracak yeni veri zaten yok — kaybi olmayan arizada is kirmizi
     yakilmaz (§300 gerekce). Bayram tatilleri icin esik genis: 2 is gunu
     normal sinir (Cuma→Pazartesi 1 is gunu, sorunsuz), 5+ is gunu 'kaynak
     DONMUS' siddetinde uyari. */
  fiyatYasi(fiyatTarihi, referansBugun, etiket = 'fiyat') {
    const ad = 'fiyat yasi (' + etiket + ')';
    if (!fiyatTarihi) return { ad, gecti: true, uyari: true, mesaj: 'fiyat tarihi yok — olculemedi' };
    let g = 0;
    const d = new Date(fiyatTarihi), son = new Date(referansBugun);
    while (d < son) { d.setDate(d.getDate() + 1); const h = d.getDay(); if (h !== 0 && h !== 6) g++; }
    if (g <= 1) return { ad, gecti: true, mesaj: fiyatTarihi + ' (' + g + ' is gunu — guncel)' };
    return { ad, gecti: true, uyari: true,
      mesaj: fiyatTarihi + ' — bugunden ' + g + ' IS GUNU geride',
      detay: g >= 5 ? 'kaynak DONMUS gorunuyor (bayram degilse) — panel damgali katmani eski fiyatla gosteriyor; canli katman (/api/market) ayri yoldan gelir, panelden dogrulayin'
        : 'kaynak son is gununun barini vermemis olabilir — surerse §300/§301 raporlarini birlikte okuyun' };
  },

  /* ── BORC DEFTERI YASI (§299): bilanco tetigi artik KUMULATIF — bir kod
     karti yazilana kadar defterde kalir. Bu dogru davranis ama YENI BIR RISK
     dogurur: defter sessizce SISEBILIR. Eskiden sayi her gun sifirlanip
     yeniden doldugu icin "borc birikiyor" hic gorunmuyordu; simdi gorunur
     ama kimse bakmazsa yine ayni yere cikar (§243: kural vardi, yaptirim
     yoktu). Bu kural iki soru sorar:
       1) en eski borc kac gundur bekliyor (esik 21 gun — bir bilanco sezonu)
       2) defter anormal buyudu mu (esik 200 — BIST'te bir sezonda ~150-180
          sirket FR yayimlar; ustu birikme degil, dusum mekanizmasinin
          bozuldugunun isaretidir)
     UYARI verir, KALDIRMAZ: kart yazmak insan isidir, is kirmizi yanmamali —
     ama rapor her gun "su kadar gundur bekliyor" demeli. */
  borcYasi(kodlar, ilkGorulme, referansTarih, maksGun = 21, maksAdet = 200) {
    const n = Array.isArray(kodlar) ? kodlar.length : 0;
    if (!n) return { ad: 'borc defteri (§299)', gecti: true, mesaj: 'defter bos — bekleyen kart yok' };
    const G = ilkGorulme || {};
    const yas = k => G[k] ? Math.round((new Date(referansTarih) - new Date(G[k])) / 864e5) : 0;
    const sirali = kodlar.slice().sort((a, b) => yas(b) - yas(a));
    const enEski = sirali[0], eY = yas(enEski);
    const bekleyen = kodlar.filter(k => yas(k) >= maksGun);
    const sisme = n > maksAdet;
    return { ad: 'borc defteri (§299)',
      gecti: true, uyari: (eY >= maksGun || sisme),
      mesaj: n + ' kart bekliyor · en eski ' + enEski + ' (' + eY + 'g)',
      detay: sisme ? ('defter ' + n + ' koda cikti (esik ' + maksAdet + ') — dusum mekanizmasi calismiyor olabilir: inceleme-ai.json okunabiliyor mu?')
        : (eY >= maksGun ? (bekleyen.length + ' kod ' + maksGun + ' gunden uzun suredir kartsiz: ' +
            bekleyen.slice(0, 12).join(', ') + (bekleyen.length > 12 ? ' …' : '')) : null) };
  },
};

/* Bir katmanın tüm kurallarını koştur, tek sonuç döndür. */
export function denetle(katmanAdi, kontroller) {
  const gecen = kontroller.filter(k => k.gecti);
  const kalan = kontroller.filter(k => !k.gecti);
  const uyaran = kontroller.filter(k => k.uyari);
  return {
    katman: katmanAdi,
    gecti: kalan.length === 0,
    ozet: `${gecen.length}/${kontroller.length} kural geçti`,
    kontroller,
    kalan,
    uyaran,
    /* Markdown rapor — GitHub Actions özetine basılır, her koşuda görünür */
    rapor() {
      const sim = k => k.gecti ? (k.uyari ? '⚠' : '✓') : '✗';
      return [
        `### ${katmanAdi} — ${this.gecti ? '✓ GEÇTİ' : '✗ KALDI'}`,
        ...kontroller.map(k =>
          `- ${sim(k)} **${k.ad}**: ${k.mesaj}` + (k.detay ? `\n  - ${k.detay}` : '')
        )
      ].join('\n');
    }
  };
}
