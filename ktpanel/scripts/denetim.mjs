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

  /* ── TARİH BİRLİĞİ: tüm kayıtlar AYNI tarihten mi ────────────────────────
     29 Tem'deki 1. hatanın doğrudan panzehiri. Karışık tarihli hesap sessizce
     yanlış sonuç üretir ve fark edilmez. */
  tarihBirligi(kayitlar, alan = 'tarih') {
    const tarihler = [...new Set(kayitlar.map(k => k[alan]).filter(Boolean))];
    return {
      ad: 'tarih birliği',
      gecti: tarihler.length <= 1,
      mesaj: tarihler.length <= 1 ? `tek tarih: ${tarihler[0] || '—'}` : `${tarihler.length} FARKLI tarih`,
      detay: tarihler.length > 1 ? tarihler.sort().join(' · ') : null
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
  }
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
