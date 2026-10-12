# Tazeleme — 2026-10-12

Katman: `endeks,fiyat,fon` · Veri dizini: `ktpanel`


### XK100 ağırlıkları — ✓ GEÇTİ
- ✓ **kapsam**: 100/100 (%100)
- ✓ **tarih birliği**: tek tarih: 2026-10-09
- ✓ **fiyat yasi (XK100 ağırlıkları)**: 2026-10-09 (1 is gunu — guncel)
- ✓ **toplam**: 100.00 (hedef 100 ±3)

### XK100 ağırlıkları — ⏭ ATLANDI (§300 geri gitme korumasi)
- kaynak 2026-10-09 dondurdu, dosyada 2026-10-12 var — 3 gun ESKI
- dosya KORUNDU: taze fiyatlar eski fiyatla ezilmedi. Kaynak toparlayinca yazim kendiliginden surer.

### XKTUM ağırlıkları — ✓ GEÇTİ
- ✓ **kapsam**: 238/238 (%100)
- ✓ **tarih birliği**: tek tarih: 2026-10-09
- ✓ **fiyat yasi (XKTUM ağırlıkları)**: 2026-10-09 (1 is gunu — guncel)
- ✓ **toplam**: 100.00 (hedef 100 ±3)

### XKTUM ağırlıkları — ⏭ ATLANDI (§300 geri gitme korumasi)
- kaynak 2026-10-09 dondurdu, dosyada 2026-10-12 var — 3 gun ESKI
- dosya KORUNDU: taze fiyatlar eski fiyatla ezilmedi. Kaynak toparlayinca yazim kendiliginden surer.

### XKTMT ağırlıkları — ✓ GEÇTİ
- ✓ **kapsam**: 41/41 (%100)
- ✓ **tarih birliği**: tek tarih: 2026-10-09
- ✓ **fiyat yasi (XKTMT ağırlıkları)**: 2026-10-09 (1 is gunu — guncel)
- ✓ **toplam**: 100.00 (hedef 100 ±3)

### XKTMT ağırlıkları — ⏭ ATLANDI (§300 geri gitme korumasi)
- kaynak 2026-10-09 dondurdu, dosyada 2026-10-12 var — 3 gun ESKI
- dosya KORUNDU: taze fiyatlar eski fiyatla ezilmedi. Kaynak toparlayinca yazim kendiliginden surer.

### Multiple fiyatları — ✓ GEÇTİ
- ✓ **kapsam**: 141/141 (%100)
- ✓ **tarih birliği**: tek tarih: 2026-10-09
- ✓ **fiyat yasi (Multiple fiyatları)**: 2026-10-09 (1 is gunu — guncel)
- ✓ **aykırı değer**: temiz (sınır ±%25)

### Multiple fiyatları — ⏭ ATLANDI (§300 geri gitme korumasi)
- kaynak 2026-10-09 dondurdu, dosyada 2026-10-12 var — 3 gun ESKI
- dosya KORUNDU: taze fiyatlar eski fiyatla ezilmedi. Kaynak toparlayinca yazim kendiliginden surer.

### Model sicili — ✓ GEÇTİ
- ✓ **kapsam**: 40/40 (%100)
- ✓ **tarih birliği**: tek tarih: 2026-10-09
- ✓ **fiyat yasi (Model sicili)**: 2026-10-09 (1 is gunu — guncel)
- ✓ **aykırı değer**: temiz (sınır ±%25)

### Model sicili — ⏭ ATLANDI (§300 geri gitme korumasi)
- kaynak 2026-10-09 dondurdu, dosyada 2026-10-12 var — 3 gun ESKI
- dosya KORUNDU: taze fiyatlar eski fiyatla ezilmedi. Kaynak toparlayinca yazim kendiliginden surer.

### TR 5Y CDS — ✓ 247.8 bp · 2026-10-09 · +0.61
- ✓ 3325 günlük seri · kaynak etiketi 2026-10-09 (hafta sonu doldurmalı)

### TEFAS genel bilgi (§253i) — ✓ 1994 fon · AUM + yatırımcı sayısı köprüden (ham 2025 kayıt, sayfalamalı)

### TEFAS köprü (bilgi)
- getiri: 1071 fon ✓ · liste: 942 kayıt · alanlar: fonKod, unvan, kurucuKod, kurucuAd, oprKod, oprAd, durum, tarih

### Fon akışı — ℹ 1043 fonun kurucusu fon adından türetildi (§279; mod=liste 942 kayıt kapsıyordu, evren 1994)

### Akış pencereleri (§359) — ✓ 1H, 1A hazır · arşiv 26 gün
- 1H giriş: YAPI KREDİ 42.8 mlr · GARANTİ 14.7 mlr · EMLAK KATILIM 4.8 mlr
- 1A giriş: EMLAK KATILIM 10.7 mlr · ZİRAAT 9.0 mlr · TRA 2.2 mlr

### PYŞ bazında akış (§358) — ✓ 68 kurum · 2026-10-12 · 9 fon eşleşmedi
- giriş: İŞ 6.12 mlr · YAPI KREDİ 3.43 mlr · ZİRAAT 1.76 mlr
- çıkış: AK -1.15 mlr · PARDUS -2.29 mlr · KUVEYT TÜRK -10.78 mlr

### Fon akışı (§263) — ✓ 1993 fon · 2026-10-09 → 2026-10-12
- giriş 49.28 mlr ₺ · çıkış -56.35 mlr ₺ · net -7.08 mlr ₺

### TEFAS alan keşfi (bilgi)
- uç: `/api/statistics/tefas/getFplFonList`
- alanlar: fonKod, unvan, kurucuKod, kurucuAd, oprKod, oprAd, durum, tarih

### TEFAS çekim tanısı (bilgi)
- yol: vercel-köprüsü (1994 fon fiyat + 1071 getiri)
- yakalanan JSON: 1 / toplam yanıt: 83 · sayfa: "Fon Getirileri - TEFAS Fon Bilgilendirme ve Karşılaştırma | " · gövde: `Görme engelliler için erişilebilirliği etkinleştirin Erişilebilirlik menüsünü açma Erişilebilir Gezinme Menüsünü Açın Ana içeriğe geç Ana Sayfa Fon Getirileri Fon Karşılaştır F` · uçlar: /api/statistics/tefas/getFplFonList (942)

### Katılım fonları — ✓ GEÇTİ
- ✓ **kapsam**: 45/46 (%98)
- ✓ **aykırı değer**: temiz (sınır ±%2)
- ✓ **dönem tutarlılığı**: temiz

### Katılım fonları — ℹ tekrar koşu (fiyat vektörü değişmedi: 45/45 aynı): fiyat/AUM tazelendi, 1G ve akış KORUNDU (§266/§427)

### Depo hijyeni + kalem tazeligi (§297) — ✓ GEÇTİ
- ✓ **ikiz dosya**: temiz
- ✓ **seri guncelligi (track.series)**: 2026-10-09 (referans 2026-10-12, fark 3g)
- ✓ **seri guncelligi (fon-akis)**: 2026-10-12 (referans 2026-10-12, fark 0g)

### BIST bilanço takvimi (§459) — ✓ 3Ç26 · beklenen 215 · gerçekleşen 0 · bugün yeni açıklama yok

### Bilanço borç defteri — ✓ GEÇTİ
- ⚠ **borc defteri (§299)**: 111 kart bekliyor · en eski AKHAN (55g)
  - 110 kod 21 gunden uzun suredir kartsiz: AKHAN, AKYHO, ALKIM, ALTNY, BAKAB, BERA, BIENY, BIMAS, BINHO, BRKSN, BRLSM, BUCIM …

### Bilanço tetiği (§299 kümülatif) — ✓ 111 şirket kart bekliyor (katılım evreni · evren dışı 152 saklı, §428)
- pencere: 6 FR · yeni deftere giren: 6 (BANVT, BJKAS, FENER, GSRAY, TRILC, TSPOR)
- kart yazılıp düşen: 0
- en eski borç: AKHAN · 55 gündür bekliyor ⚠
- AKHAN, AKYHO, ALKIM, ALTNY, BAKAB, BANVT, BERA, BIENY, BIMAS, BINHO, BRKSN, BRLSM, BUCIM, BURCE, BYDNR, CELHA, CITAS, COSMO, CVKMD, DARDL …

### Endeks üyelikleri — ✓ XK030EA:30 · XKTUM:238 · XK100:100 · XK050:50 · XK030:30 · XSRDK:27 · XKTMT:41
- ✓ üyelik uyumu XKTUM: 238/238 (tasarım gereği ilk 238)
- ✓ üyelik uyumu XK100: 100/100 (tam kapsam)
- ✓ üyelik uyumu XKTMT: 41/41 (tam kapsam)

### Endeks kapanışları — ✓ 87 endeks · veri günü 2026-10-12
- XKTUM 16023.54 · XKTMT 14438.03 · XK100 14224.9 · XU100 12150.67 · BISTTLREFK 4279.57063
- arşiv: 652 gün · dosyalar: bisttlrefkendeksi.csv(1), zip:[FiyatEndeksleri_PriceIndices.csv, GetiriEndeksleri_ReturnIndices.csv], FiyatEndeksleri_PriceIndices.csv(84), GetiriEndeksleri_ReturnIndices.csv(2)
- ℹ beklenen 404 (§250b: bu dosyalar zip içinde, tekil URL yok): FiyatEndeksleri_PriceIndices.csv:HTTP404 · GetiriEndeksleri_ReturnIndices.csv:HTTP404

### Model sicili serisi (§291) — ✓ 2026-10-12 · model %-14.966 / endeks %-12.26

### Sektör ısı + rotasyon (§333) — ✓ 2026-10-12 · 15/15 sektör
- çapalar: 1G 2026-10-09 · 1H 2026-10-05 · 1A 2026-09-11 · 3A null
- XU100 (1G/1H/1A/3A): -0.94 · -2.36 · -16.01 · -11.88
- 3A lideri: XKMYA %24.21
- ⚠ çapa sapması: 3A hedef 2026-07-14 → 2026-06-30 (14 gün geride) — ufuk ATLANDI, damgalı değer korundu

### Hazine ihale sonuçları (§314) — ✓ defter 18 duyuru · yeni 0
- yeni duyuru yok

### Hazine ihraç takvimi (§334) — ⏭ yeni strateji yok (mevcut: 2026-09-30 · Ekim–Aralık 2026)

### Küresel makro takvim (§319) — ✓ 20 olay (13 yüksek etki)
- 2026-10-14 12:30Z · USD · Core CPI m/m
- 2026-10-14 12:30Z · USD · Core CPI y/y
- 2026-10-14 12:30Z · USD · CPI m/m
- 2026-10-14 12:30Z · USD · CPI y/y
- 2026-10-15 00:30Z · AUD · Employment Change
- 2026-10-15 00:30Z · AUD · Unemployment Rate

- §383 arşive yazıldı: +5 çeyrek (ek istek YOK — faktörün zaten çektiği tablolar)

### Faktör evreni (§361) — ✓ parti 6 · kapsam 135/238
- bu turda: 2 tam · 2 eksik kalemli · 3 alınamadı
- not: §455c arşivden 2 şirket (ağ yok) · temel kapsamın XKTUM ağırlığı %77.7 · BINHO:1 ana kalem boş · KTLEV:2 ana kalem boş · CITAS:liste boş · TKNKA:liste boş · KPEKS:liste boş
- ⚠ ÖLÇÜM TURU: parti 6 şirketle sınırlı; KAP hız sınırı ve şablon uyumu görülünce büyütülecek. Panel HENÜZ bağlı değil (multiple.json korunuyor).

### Fonzi gerçekleşen (§457) — ✓ 231 hisse · endeks XKTUM -17.1 · XK100 -20.5 · XK030 -20 · XU100 -14 · fon-portfoy.json/tasfiye.gerceklesen

### Faktör skorları (§455) — ✓ sıralanan 115/238 · temel veri 116 · fiyat 231 · beta çıpası XKTUM arşivi · Rel.Vol medyan 0.60 ✓
- ✓ fm.json TERFİ ETTİ (adet 115 ≥ 100 · XKTUM ağırlık kapsamı %77.6 ≥ %70) — panel kendi hesabımızla çalışıyor
- imza: VALUE 115 -0.115 0.774 -2.98 1.13 0 · GROWTH 114 -0.006 0.688 -1.93 2.14 0 · QUALITY 115 -0.010 0.685 -1.60 1.77 0 · MOMENTUM 115 -0.077 0.615 -1.71 2.39 0 · LOW_RISK 115 -0.054 0.736 -1.60 1.58 0

### KAP arşivi (§381) — ✓ +0 çeyrek · 0/238 şirket tam
- GLRMK:7→7 · EFOR:9→9
- öncelik: bilanço tetiği → XK030 → XK100 → kalanlar (en çok bakılan önce dolar)
- ⓘ Ham tablolar `kap-arsiv/<KOD>.json` içinde, şirket başına en fazla 15 çeyrek. Yayımlanmış bildirim değişmediği için bir kez yazılır; panel KAP yerine buradan okuyabilir (15 istek → 1).

- §364b fiyat: 46/46 GYO için canlı fiyat eklendi (güncel iskonto hesaplandı)

### GYO NAV (§364) — ✓ 46 şirket · dönem 2025/12
- sektör iskontosu: %-47.9 · borçluluk %25.1
- en iskontolu: %-1678.0 · medyan %-55.1 · en primli %1032.2
- 8 şirket o dönem bildirim göndermemiş (kayıt yazılmadı)

- §366c tür kırılımı: 14 tür × 8 ay · 100/168 satır · 700 hücre eşlendi · ⚠ KISMİ (yanıt sayfalı; ilk blok alındı)

- en büyük türler (2026-09): SERBEST 5458 mlr · PARA PİYASASI 1450 mlr · GİRİŞİM SERMAYESİ YATIRIM FONU 482 mlr

### VAP fon akışı (§366) — ✓ 8 ay · son 2026-09
- toplam fon tutarı: 8833.4 mlr ₺
- son ay net değişimi: -1757.0 mlr ₺ (dönem sonu − dönem başı, tüm türler)
- ölçüler: Dönem Başı Fon Adedi · Dönem Sonu Fon Adedi · Fon Adedi Değişim · Dönem Başı Fon Tutarı (TL) · Dönem Sonu Fon Tutarı (TL) · Dönem Başı Fon Sayısı · Dönem Sonu Fon Sayısı

### Bülten keşfi (§250k) — ✓ thb202610121.zip indi · 240KB
- içerik: thb202610121.csv
- endeks izi: `thb202610121.csv → TARIH;ISLEM  KODU;BULTEN ADI;PAZAR GRUBU;PAZAR;YAPISAL BAZDA PIYASA ALT BOLUMU;ENSTRUMAN GRUBU;ENSTRUMAN TIPI;ENSTRUMAN SINIFI;ISLEM YONTEMI;PIYASA YAPICI;BIST 100 ENDEKS;BIST 30 ENDEKS;BRUT TAKAS;OZS`

### Bülten fiyat keşfi (§305 · tek koşuluk ölçüm) — thb202610121.csv
- satır: 10301 · kolon: 57
- fiyat kolon adayları: ONCEKI KAPANIS FIYATI · ACILIS FIYATI · ACILIS SEANSI FIYATI · EN DUSUK FIYAT · EN YUKSEK FIYAT · KAPANIS FIYATI · KAPANIS SEANSI FIYATI · REFERANS FIYAT …
- THYAO varyantları (kod=kapanış): THYAO.AOF=0 · THYAO.E=285.75
- örnek satır: `2026-10-12;THYAO.AOF;TURK HAVA YOLLARI AOF;;Z;MSPOT;AOF;MSPOTAOF;MSPOTAOFTHYAO;SI;0;0;0;0;;0;0;0;0;0;0;0;0;0;0;0;0;;;;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0`


---
**Sonuç:** TR 5Y CDS (247.8 bp) · fon akışı (1993) · katılım fonları (45+akış) · bilanço tetiği (111 bekliyor) · endeks üyelikleri · endeks arşivi · sicil serisi · sektör ısı (15 sektör) · küresel makro takvim (20 olay) · faktör evreni (135/238) · fonzi gerçekleşen · fm.json (§455 kendi hesap · ağırlık %78) · fm-oto · KAP arşivi (+0 çeyrek) · GYO NAV (46 şirket) · VAP fon akışı (8 ay)

### Süre bütçesi (§326)
- ⏱ KAP arşivi (§381) — 63 sn
- toplam: 194 sn