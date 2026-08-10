# Tazeleme — 2026-08-10

Katman: `hepsi` · Veri dizini: `ktpanel`


### XK100 ağırlıkları — ✓ GEÇTİ
- ✓ **kapsam**: 100/100 (%100)
- ✓ **tarih birliği**: tek tarih: 2026-08-10
- ✓ **toplam**: 100.00 (hedef 100 ±3)

### XKTUM ağırlıkları — ✓ GEÇTİ
- ✓ **kapsam**: 150/150 (%100)
- ✓ **tarih birliği**: tek tarih: 2026-08-10
- ✓ **toplam**: 96.50 (hedef 96.5 ±3)

### XKTMT ağırlıkları — ✓ GEÇTİ
- ✓ **kapsam**: 39/39 (%100)
- ✓ **tarih birliği**: tek tarih: 2026-08-10
- ✓ **toplam**: 100.00 (hedef 100 ±3)

### Multiple fiyatları — ✓ GEÇTİ
- ✓ **kapsam**: 141/141 (%100)
- ✓ **tarih birliği**: tek tarih: 2026-08-10
- ✓ **aykırı değer**: temiz (sınır ±%25)

### Model sicili — ✓ GEÇTİ
- ✓ **kapsam**: 40/40 (%100)
- ✓ **tarih birliği**: tek tarih: 2026-08-10
- ✓ **aykırı değer**: temiz (sınır ±%25)

### TR 5Y CDS — ✓ 227.65 bp · 2026-08-08 · -0.78
- ✓ 3272 günlük seri · kaynak etiketi 2026-08-10 (hafta sonu doldurmalı)

### Risk metrikleri — ✓ GEÇTİ
- ✓ **kapsam**: 141/141 (%100)
- ✓ **aykırı değer**: temiz (sınır ±%3)
- ✓ **aykırı değer**: temiz (sınır ±%150)
- ℹ **beta referansı: XKTUM (BIST resmî arşiv)** (178 gün)
- ℹ 4 gözlem kurumsal işlem süzgecine takıldı (±%20 üstü hareket — bölünme/bedelsiz)
- ℹ 1692 gözlem TARİH BOŞLUĞU nedeniyle atlandı (>5 gün ara — aylık tohum noktaları; §252z) — ✓ GERÇEK katılım çıpası (BIST resmî)

### TEFAS genel bilgi (§253i) — ✓ 2023 fon · AUM + yatırımcı sayısı köprüden (ham 2030 kayıt, sayfalamalı)

### TEFAS köprü (bilgi)
- getiri: 1048 fon ✓ · liste: 1039 kayıt · alanlar: fonKod, unvan, kurucuKod, kurucuAd, oprKod, oprAd, durum, tarih

### TEFAS alan keşfi (bilgi)
- uç: `/api/statistics/tefas/getFplFonList`
- alanlar: fonKod, unvan, kurucuKod, kurucuAd, oprKod, oprAd, durum, tarih

### TEFAS çekim tanısı (bilgi)
- yol: vercel-köprüsü (2023 fon fiyat + 1048 getiri)
- yakalanan JSON: 1 / toplam yanıt: 82 · sayfa: "Fon Getirileri - TEFAS Fon Bilgilendirme ve Karşılaştırma | " · gövde: `Ana içeriğe geç Ana Sayfa Fon Getirileri Fon Karşılaştır Fon Verileri İstatistikler Kurumsal SSS Varsayılan olarak işletim sistemi tema tercihi kullanılır. Bu düğmeyle açık` · uçlar: /api/statistics/tefas/getFplFonList (1039)

### Katılım fonları — ✓ GEÇTİ
- ✓ **kapsam**: 46/46 (%100)
- ✓ **aykırı değer**: temiz (sınır ±%2)
- ✓ **dönem tutarlılığı**: temiz

### Bilanço tetiği — ✓ 128 şirket FR yayımladı
- AAGYO, ACSEL, ADEL, AHSGY, AKCVR, AKTVK, ALKA, ALNUS, ARSVY, ARTMS, ASGYO, ATAVK, ATLAS, AVPGY, AYES, BAHKM, BANVT, BASCM, BASGZ, BEGYO …

### Endeks üyelikleri — ✓ XK030EA:30 · XKTUM:242 · XK100:100 · XK050:50 · XK030:30 · XSRDK:24 · XKTMT:39
- ✓ üyelik uyumu XKTUM: 150/242 (tasarım gereği ilk 150)
- ✓ üyelik uyumu XK100: 100/100 (tam kapsam)
- ✓ üyelik uyumu XKTMT: 39/39 (tam kapsam)

### Endeks kapanışları — ✓ 87 endeks · veri günü 2026-08-10
- XKTUM 18819.67 · XKTMT 17312.87 · XK100 17600.94 · XU100 13811.6 · BISTTLREFK 4015.02998
- arşiv: 607 gün · dosyalar: bisttlrefkendeksi.csv(1), zip:[FiyatEndeksleri_PriceIndices.csv, GetiriEndeksleri_ReturnIndices.csv], FiyatEndeksleri_PriceIndices.csv(84), GetiriEndeksleri_ReturnIndices.csv(2)
- ℹ beklenen 404 (§250b: bu dosyalar zip içinde, tekil URL yok): FiyatEndeksleri_PriceIndices.csv:HTTP404 · GetiriEndeksleri_ReturnIndices.csv:HTTP404

### Bülten keşfi (§250k) — ✓ thb202608071.zip indi · 295KB
- içerik: thb202608071.csv
- endeks izi: `thb202608071.csv → TARIH;ISLEM  KODU;BULTEN ADI;PAZAR GRUBU;PAZAR;YAPISAL BAZDA PIYASA ALT BOLUMU;ENSTRUMAN GRUBU;ENSTRUMAN TIPI;ENSTRUMAN SINIFI;ISLEM YONTEMI;PIYASA YAPICI;BIST 100 ENDEKS;BIST 30 ENDEKS;BRUT TAKAS;OZS`


---
**Sonuç:** TR 5Y CDS (227.65 bp) · risk metrikleri (138) · katılım fonları (46) · bilanço tetiği (128) · endeks üyelikleri · endeks arşivi