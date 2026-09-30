# Tazeleme — 2026-09-30

Katman: `endeks,fiyat,fon` · Veri dizini: `ktpanel`


### XK100 ağırlıkları — ✓ GEÇTİ
- ✓ **kapsam**: 100/100 (%100)
- ✓ **tarih birliği**: baskın 2026-09-30 (%99) · 1 kayıt ≤1 gün geride (işlem görmemiş olabilir)
  - USAK:2026-09-29
- ✓ **fiyat yasi (XK100 ağırlıkları)**: 2026-09-30 (0 is gunu — guncel)
- ✓ **toplam**: 100.00 (hedef 100 ±3)

### XKTUM ağırlıkları — ✓ GEÇTİ
- ✓ **kapsam**: 150/150 (%100)
- ✓ **tarih birliği**: baskın 2026-09-30 (%99) · 1 kayıt ≤1 gün geride (işlem görmemiş olabilir)
  - USAK:2026-09-29
- ✓ **fiyat yasi (XKTUM ağırlıkları)**: 2026-09-30 (0 is gunu — guncel)
- ✓ **toplam**: 96.50 (hedef 96.5 ±3)

### XKTMT ağırlıkları — ✓ GEÇTİ
- ✓ **kapsam**: 39/39 (%100)
- ✓ **tarih birliği**: tek tarih: 2026-09-30
- ✓ **fiyat yasi (XKTMT ağırlıkları)**: 2026-09-30 (0 is gunu — guncel)
- ✓ **toplam**: 100.00 (hedef 100 ±3)

### Multiple fiyatları — ✓ GEÇTİ
- ✓ **kapsam**: 141/141 (%100)
- ✓ **tarih birliği**: baskın 2026-09-30 (%99) · 1 kayıt ≤1 gün geride (işlem görmemiş olabilir)
  - USAK:2026-09-29
- ✓ **fiyat yasi (Multiple fiyatları)**: 2026-09-30 (0 is gunu — guncel)
- ✓ **aykırı değer**: temiz (sınır ±%25)

### Model sicili — ✓ GEÇTİ
- ✓ **kapsam**: 40/40 (%100)
- ✓ **tarih birliği**: tek tarih: 2026-09-30
- ✓ **fiyat yasi (Model sicili)**: 2026-09-30 (0 is gunu — guncel)
- ✓ **aykırı değer**: temiz (sınır ±%25)

### TR 5Y CDS — ✓ 245.17 bp · 2026-09-26 · +4.31
- ✓ 3316 günlük seri · kaynak etiketi 2026-09-28 (hafta sonu doldurmalı)

### TEFAS genel bilgi (§253i) — ✓ 2008 fon · AUM + yatırımcı sayısı köprüden (ham 2034 kayıt, sayfalamalı)

### TEFAS köprü (bilgi)
- getiri: 1070 fon ✓ · liste: 941 kayıt · alanlar: fonKod, unvan, kurucuKod, kurucuAd, oprKod, oprAd, durum, tarih

### Fon akışı — ℹ 1059 fonun kurucusu fon adından türetildi (§279; mod=liste 941 kayıt kapsıyordu, evren 2008)

### Akış pencereleri (§359) — ✓ 1H, 1A hazır · arşiv 26 gün
- 1H giriş: EMLAK KATILIM 3.3 mlr · İNCİR ANONİM ŞİRKETİ 1.2 mlr · BTCTURK ANONİM ŞİRKETİ 0.1 mlr
- 1A giriş: ZİRAAT 23.2 mlr · VAKIF KATILIM ANONİM ŞİRKETİ 4.7 mlr · EMLAK KATILIM 4.5 mlr

### PYŞ bazında akış (§358) — ✓ 68 kurum · 2026-09-30 · 9 fon eşleşmedi
- giriş: EMLAK KATILIM 0.96 mlr · YAPI KREDİ 0.43 mlr · VAKIF KATILIM ANONİM ŞİRKETİ 0.13 mlr
- çıkış: GARANTİ -8.97 mlr · ALBARAKA -10.60 mlr · AK -11.40 mlr

### Fon akışı (§263) — ✓ 2008 fon · 2026-09-29 → 2026-09-30
- giriş 23.41 mlr ₺ · çıkış -76.33 mlr ₺ · net -52.92 mlr ₺

### Katılım fonları — ✗ TEFAS erişimi düştü
- page.goto: net::ERR_EMPTY_RESPONSE at https://www.tefas.gov.tr/tr/fon-getirileri?fundType=YAT
Call log:
  - navigating to "https://www.tefas

### Katılım fonları — ✗ Cannot access 'tefasKayipMi' before initialization

### Depo hijyeni + kalem tazeligi (§297) — ✓ GEÇTİ
- ✓ **ikiz dosya**: temiz
- ✓ **seri guncelligi (track.series)**: 2026-09-29 (referans 2026-09-30, fark 1g)
- ✓ **seri guncelligi (fon-akis)**: 2026-09-30 (referans 2026-09-30, fark 0g)

### Bilanço borç defteri — ✓ GEÇTİ
- ⚠ **borc defteri (§299)**: 72 kart bekliyor · en eski AKHAN (43g)
  - 68 kod 21 gunden uzun suredir kartsiz: AKHAN, ALFAS, ALKIM, ALKLC, ALTNY, ALVES, BERA, BIENY, BIMAS, BINHO, BRLSM, BUCIM …

### Bilanço tetiği (§299 kümülatif) — ✓ 72 şirket kart bekliyor (katılım evreni · evren dışı 182 saklı, §428)
- pencere: 2 FR · yeni deftere giren: 2 (DIRIT, TRYKI)
- kart yazılıp düşen: 0
- en eski borç: AKHAN · 43 gündür bekliyor ⚠
- AKHAN, ALFAS, ALKIM, ALKLC, ALTNY, ALVES, BERA, BIENY, BIMAS, BINHO, BRLSM, BUCIM, BURCE, CANTE, CELHA, CVKMD, DCTTR, EGGUB, EGPRO, ELITE …

### Endeks üyelikleri — ✓ XK030EA:30 · XKTUM:238 · XK100:100 · XK050:50 · XK030:30 · XSRDK:27 · XKTMT:41
- ⚠ REVİZYON XKTUM: FAZLA 21 (OZATD, RALYH, UFUK, GUNDG, RGYAS, ALKLC) · ölü ağırlık %4.38 — xktum.json revize edilmeli
- ⚠ REVİZYON XK100: FAZLA 35 (KTLEV, OZATD, RALYH, PASEU, EUPWR, GUNDG) · ölü ağırlık %9.35 · EKSİK 35 (AHGAZ, AKCNS, AKFIS, ARASE, ATAKP, AVPGY) — xk100.json revize edilmeli
- ⚠ REVİZYON XKTMT: FAZLA 3 (AYEN, GENTS, SUNTK) · ölü ağırlık %0.41 · EKSİK 5 (AKCNS, ENERY, KFEIN, PNLSN, TGSAS) — xktmt.json revize edilmeli

### Endeks kapanışları — ✓ 87 endeks · veri günü 2026-09-30
- XKTUM 15823.4 · XKTMT 14265.55 · XK100 13890.46 · XU100 11947.18 · BISTTLREFK 4228.39795
- arşiv: 644 gün · dosyalar: bisttlrefkendeksi.csv(1), zip:[FiyatEndeksleri_PriceIndices.csv, GetiriEndeksleri_ReturnIndices.csv], FiyatEndeksleri_PriceIndices.csv(84), GetiriEndeksleri_ReturnIndices.csv(2)
- ℹ beklenen 404 (§250b: bu dosyalar zip içinde, tekil URL yok): FiyatEndeksleri_PriceIndices.csv:HTTP404 · GetiriEndeksleri_ReturnIndices.csv:HTTP404

### Model sicili serisi (§291) — ✓ 2026-09-30 · model %-16.741 / endeks %-13.356

### Sektör ısı + rotasyon (§333) — ✓ 2026-09-30 · 15/15 sektör
- çapalar: 1G 2026-09-29 · 1H 2026-09-23 · 1A 2026-08-31 · 3A 2026-06-30
- XU100 (1G/1H/1A/3A): -2.79 · -9.85 · -16.65 · -15.4
- 3A lideri: XKMYA %19.42

### Hazine ihale sonuçları (§314) — ✓ defter 14 duyuru · yeni 0
- yeni duyuru yok

### Hazine ihraç takvimi (§334) — ✓ 16 ihraç · 3 kira sertifikası
- dönem: Ekim–Aralık 2026 · sonraki yayın: ~25 Ocak (Oca–Mar stratejisi)
- finansman tablosu: 3 ay
- kaynak: 2026-09-30 · Ekim – Aralık 2026 İç Borçlanma Stratejisi
- 2026-10-05 · Sabit Kuponlu Devlet Tahvili · 2 Yıl
- 2026-10-05 · Altın Tahvili · 2 Yıl
- 2026-10-05 · Altına Dayalı Kira Sertifikası · 2 Yıl · KATILIM
- 2026-10-05 · TLREFK'ye Endeksli Kira Sertifikası · 2 Yıl · KATILIM
- 2026-10-05 · Sabit Kuponlu Devlet Tahvili · 5 Yıl
- 2026-10-06 · ABD Doları Cinsi Devlet Tahvili · 1 Yıl

### Küresel makro takvim (§319) — ✓ 27 olay (10 yüksek etki)
- 2026-09-29 04:30Z · AUD · Cash Rate
- 2026-09-29 04:30Z · AUD · RBA Rate Statement
- 2026-09-30 01:30Z · AUD · CPI m/m
- 2026-09-30 01:30Z · AUD · CPI y/y
- 2026-09-30 01:30Z · AUD · Trimmed Mean CPI m/m
- 2026-09-30 12:30Z · USD · Core PCE Price Index m/m

### Faktör evreni (§361) — ✓ parti 6 · kapsam 105/238
- bu turda: 6 tam · 0 eksik kalemli · 0 alınamadı
- ⚠ ÖLÇÜM TURU: parti 6 şirketle sınırlı; KAP hız sınırı ve şablon uyumu görülünce büyütülecek. Panel HENÜZ bağlı değil (multiple.json korunuyor).

### KAP arşivi (§381) — ✓ +8 çeyrek · 0/238 şirket tam
- CIMSA:4→8 · CWENE:4→8
- öncelik: bilanço tetiği → XK030 → XK100 → kalanlar (en çok bakılan önce dolar)
- ⓘ Ham tablolar `kap-arsiv/<KOD>.json` içinde, şirket başına en fazla 15 çeyrek. Yayımlanmış bildirim değişmediği için bir kez yazılır; panel KAP yerine buradan okuyabilir (15 istek → 1).

- §364b fiyat: 46/46 GYO için canlı fiyat eklendi (güncel iskonto hesaplandı)

### GYO NAV (§364) — ✓ 46 şirket · dönem 2025/12
- sektör iskontosu: %-47.9 · borçluluk %25.1
- en iskontolu: %-1678.0 · medyan %-55.1 · en primli %1032.2
- 8 şirket o dönem bildirim göndermemiş (kayıt yazılmadı)

- §366c tür kırılımı: 14 tür × 8 ay · 100/168 satır · 700 hücre eşlendi · ⚠ KISMİ (yanıt sayfalı; ilk blok alındı)

- en büyük türler (2026-08): SERBEST 6444 mlr · PARA PİYASASI 2021 mlr · GİRİŞİM SERMAYESİ YATIRIM FONU 501 mlr

### VAP fon akışı (§366) — ✓ 8 ay · son 2026-08
- toplam fon tutarı: 10590.4 mlr ₺
- son ay net değişimi: 538.3 mlr ₺ (dönem sonu − dönem başı, tüm türler)
- ölçüler: Dönem Başı Fon Adedi · Dönem Sonu Fon Adedi · Fon Adedi Değişim · Dönem Başı Fon Tutarı (TL) · Dönem Sonu Fon Tutarı (TL) · Dönem Başı Fon Sayısı · Dönem Sonu Fon Sayısı

### Bülten keşfi (§250k) — ✓ thb202609291.zip indi · 303KB
- içerik: thb202609291.csv
- endeks izi: `thb202609291.csv → TARIH;ISLEM  KODU;BULTEN ADI;PAZAR GRUBU;PAZAR;YAPISAL BAZDA PIYASA ALT BOLUMU;ENSTRUMAN GRUBU;ENSTRUMAN TIPI;ENSTRUMAN SINIFI;ISLEM YONTEMI;PIYASA YAPICI;BIST 100 ENDEKS;BIST 30 ENDEKS;BRUT TAKAS;OZS`

### Bülten fiyat keşfi (§305 · tek koşuluk ölçüm) — thb202609291.csv
- satır: 12832 · kolon: 57
- fiyat kolon adayları: ONCEKI KAPANIS FIYATI · ACILIS FIYATI · ACILIS SEANSI FIYATI · EN DUSUK FIYAT · EN YUKSEK FIYAT · KAPANIS FIYATI · KAPANIS SEANSI FIYATI · REFERANS FIYAT …
- THYAO varyantları (kod=kapanış): THYAO.AOF=0 · THYAO.E=291.5
- örnek satır: `2026-09-29;THYAO.AOF;TURK HAVA YOLLARI AOF;;Z;MSPOT;AOF;MSPOTAOF;MSPOTAOFTHYAO;SI;0;0;0;0;;0;0;0;0;0;0;0;0;0;0;0;0;;;;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0`


---
**Sonuç:** XK100 ağırlıkları · XKTUM ağırlıkları · XKTMT ağırlıkları · Multiple fiyatları (136 fiyat) · Model sicili (40 fiyat) · TR 5Y CDS (245.17 bp) · fon akışı (2008) · bilanço tetiği (72 bekliyor) · endeks üyelikleri · endeks arşivi · sicil serisi · sektör ısı (15 sektör) · hazine ihraç takvimi (16) · küresel makro takvim (27 olay) · faktör evreni (105/238) · KAP arşivi (+8 çeyrek) · GYO NAV (46 şirket) · VAP fon akışı (8 ay)

### Süre bütçesi (§326)
- ⏱ Faktör evreni (§361) — 110 sn
- ⏱ KAP arşivi (§381) — 90 sn
- toplam: 256 sn