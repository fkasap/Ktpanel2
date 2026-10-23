# Tazeleme — 2026-10-23

Katman: `endeks,fiyat,fon` · Veri dizini: `ktpanel`


### XK100 ağırlıkları — ✓ GEÇTİ
- ✓ **kapsam**: 100/100 (%100)
- ✓ **tarih birliği**: tek tarih: 2026-10-23
- ✓ **fiyat yasi (XK100 ağırlıkları)**: 2026-10-23 (0 is gunu — guncel)
- ✓ **toplam**: 100.00 (hedef 100 ±3)

### XKTUM ağırlıkları — ✓ GEÇTİ
- ✓ **kapsam**: 238/238 (%100)
- ✓ **tarih birliği**: tek tarih: 2026-10-23
- ✓ **fiyat yasi (XKTUM ağırlıkları)**: 2026-10-23 (0 is gunu — guncel)
- ✓ **toplam**: 100.00 (hedef 100 ±3)

### XKTMT ağırlıkları — ✓ GEÇTİ
- ✓ **kapsam**: 41/41 (%100)
- ✓ **tarih birliği**: tek tarih: 2026-10-23
- ✓ **fiyat yasi (XKTMT ağırlıkları)**: 2026-10-23 (0 is gunu — guncel)
- ✓ **toplam**: 100.00 (hedef 100 ±3)

### Multiple fiyatları — ✓ GEÇTİ
- ✓ **kapsam**: 141/141 (%100)
- ✓ **tarih birliği**: tek tarih: 2026-10-23
- ✓ **fiyat yasi (Multiple fiyatları)**: 2026-10-23 (0 is gunu — guncel)
- ✓ **aykırı değer**: temiz (sınır ±%25)

### Model sicili — ✓ GEÇTİ
- ✓ **kapsam**: 40/40 (%100)
- ✓ **tarih birliği**: tek tarih: 2026-10-23
- ✓ **fiyat yasi (Model sicili)**: 2026-10-23 (0 is gunu — guncel)
- ✓ **aykırı değer**: temiz (sınır ±%25)

### TR 5Y CDS — ✓ 251.06 bp · 2026-10-23 · -1.83
- ✓ 3335 günlük seri · kaynak etiketi 2026-10-23 (hafta sonu doldurmalı)

### TEFAS genel bilgi (§253i) — ✓ 1983 fon · AUM + yatırımcı sayısı köprüden (ham 2017 kayıt, sayfalamalı)

### TEFAS köprü (bilgi)
- getiri: 1071 fon ✓ · liste: 941 kayıt · alanlar: fonKod, unvan, kurucuKod, kurucuAd, oprKod, oprAd, durum, tarih

### Fon akışı — ℹ 1033 fonun kurucusu fon adından türetildi (§279; mod=liste 941 kayıt kapsıyordu, evren 1983)

### Akış pencereleri (§359) — ✓ 1H, 1A hazır · arşiv 26 gün
- 1H giriş: ALBARAKA 5.9 mlr · AKTİF 2.2 mlr · HSBC 1.7 mlr
- 1A giriş: YAPI KREDİ 27.5 mlr · TRA 4.5 mlr · İNCİR ANONİM ŞİRKETİ 1.3 mlr

### PYŞ bazında akış (§358) — ✓ 68 kurum · 2026-10-23 · 9 fon eşleşmedi
- giriş: GARANTİ 1.76 mlr · ALBARAKA 1.46 mlr · YAPI KREDİ 0.96 mlr
- çıkış: DENİZ -2.68 mlr · KUVEYT TÜRK -6.59 mlr · MT -6.67 mlr

### Fon akışı (§263) — ✓ 1981 fon · 2026-10-22 → 2026-10-23
- giriş 54.43 mlr ₺ · çıkış -69.06 mlr ₺ · net -14.63 mlr ₺

### TEFAS alan keşfi (bilgi)
- uç: `/api/statistics/tefas/getFplFonList`
- alanlar: fonKod, unvan, kurucuKod, kurucuAd, oprKod, oprAd, durum, tarih

### TEFAS çekim tanısı (bilgi)
- yol: vercel-köprüsü (1983 fon fiyat + 1071 getiri)
- yakalanan JSON: 1 / toplam yanıt: 82 · sayfa: "Fon Getirileri - TEFAS Fon Bilgilendirme ve Karşılaştırma | " · gövde: `Görme engelliler için erişilebilirliği etkinleştirin Erişilebilirlik menüsünü açma Erişilebilir Gezinme Menüsünü Açın Ana içeriğe geç Ana Sayfa Fon Getirileri Fon Karşılaştır F` · uçlar: /api/statistics/tefas/getFplFonList (941)

### Katılım fonları — ✓ GEÇTİ
- ✓ **kapsam**: 45/46 (%98)
- ✓ **aykırı değer**: temiz (sınır ±%2)
- ✓ **dönem tutarlılığı**: temiz

### Katılım fonları — ℹ tekrar koşu (fiyat vektörü değişmedi: 45/45 aynı): fiyat/AUM tazelendi, 1G ve akış KORUNDU (§266/§427)

### Depo hijyeni + kalem tazeligi (§297) — ✓ GEÇTİ
- ✓ **ikiz dosya**: temiz
- ✓ **seri guncelligi (track.series)**: 2026-10-22 (referans 2026-10-23, fark 1g)
- ✓ **seri guncelligi (fon-akis)**: 2026-10-23 (referans 2026-10-23, fark 0g)

### BIST bilanço takvimi (§459) — ✓ 1 şirket açıkladı (SOHOE, EREGL, ISDMR, EBEBK) · beklenen 212 · gerçekleşen 4

### Bilanço borç defteri — ✓ GEÇTİ
- ⚠ **borc defteri (§299)**: 112 kart bekliyor · en eski AKHAN (66g)
  - 110 kod 21 gunden uzun suredir kartsiz: AKHAN, AKYHO, ALKIM, ALTNY, BAKAB, BERA, BIENY, BIMAS, BINHO, BRKSN, BRLSM, BUCIM …

### Bilanço tetiği (§299 kümülatif) — ✓ 112 şirket kart bekliyor (katılım evreni · evren dışı 161 saklı, §428)
- pencere: 12 FR · yeni deftere giren: 8 (DENIZ, DZGYO, EBEBK, EREGL, ISDMR, KLSYN, MARMR, SOHOE)
- kart yazılıp düşen: 5 (DZGYO, EBEBK, EREGL, ISDMR, KLSYN)
- en eski borç: AKHAN · 66 gündür bekliyor ⚠
- AKHAN, AKYHO, ALKIM, ALTNY, BAKAB, BANVT, BERA, BIENY, BIMAS, BINHO, BRKSN, BRLSM, BUCIM, BURCE, BYDNR, CELHA, CITAS, COSMO, CVKMD, DARDL …

### Endeks üyelikleri — ✓ XK030EA:30 · XKTUM:238 · XK100:100 · XK050:50 · XK030:30 · XSRDK:27 · XKTMT:41
- ✓ üyelik uyumu XKTUM: 238/238 (tasarım gereği ilk 238)
- ✓ üyelik uyumu XK100: 100/100 (tam kapsam)
- ✓ üyelik uyumu XKTMT: 41/41 (tam kapsam)

### Endeks kapanışları — ✓ 87 endeks · veri günü 2026-10-23
- XKTUM 14475.56 · XKTMT 12595.18 · XK100 12579.19 · XU100 11116.99 · BISTTLREFK 4335.37123
- arşiv: 661 gün · dosyalar: bisttlrefkendeksi.csv(1), zip:[FiyatEndeksleri_PriceIndices.csv, GetiriEndeksleri_ReturnIndices.csv], FiyatEndeksleri_PriceIndices.csv(84), GetiriEndeksleri_ReturnIndices.csv(2)
- ℹ beklenen 404 (§250b: bu dosyalar zip içinde, tekil URL yok): FiyatEndeksleri_PriceIndices.csv:HTTP404 · GetiriEndeksleri_ReturnIndices.csv:HTTP404

### Model sicili serisi (§291) — ✓ 2026-10-23 · model %-26.995 / endeks %-20.737

### Sektör ısı + rotasyon (§333) — ✓ 2026-10-23 · 15/15 sektör
- çapalar: 1G 2026-10-22 · 1H 2026-10-16 · 1A 2026-09-23 · 3A null
- XU100 (1G/1H/1A/3A): -0.92 · -5.16 · -16.11 · -11.88
- 3A lideri: XKMYA %24.21
- ⚠ çapa sapması: 3A hedef 2026-07-25 → 2026-06-30 (25 gün geride) — ufuk ATLANDI, damgalı değer korundu

### Hazine ihale sonuçları (§314) — ✓ defter 18 duyuru · yeni 0
- yeni duyuru yok

### Hazine ihraç takvimi (§334) — ⏭ yeni strateji yok (mevcut: 2026-09-30 · Ekim–Aralık 2026)

### Küresel makro takvim (§319) — ✓ 19 olay (5 yüksek etki)
- 2026-10-19 12:30Z · CAD · CPI m/m
- 2026-10-19 12:30Z · CAD · Median CPI y/y
- 2026-10-19 12:30Z · CAD · Trimmed CPI y/y
- 2026-10-21 06:00Z · GBP · CPI y/y
- 2026-10-21 21:45Z · NZD · CPI q/q

### Sektör sürücüleri (§462) — ✓ 2026-10-23 · dizel 77.96 · benzin 18.93 · Brent 120.438 $/v
- 469 satır · 21 çeyrek · USDTRY Yahoo günlük · değişiklik yok

### Sürücü serileri (§464) — ✓ 14 seri
- altin 4010.6001 (2026-10-23, 506 gün)
- gumus 54.045 (2026-10-23, 506 gün)
- bakir 6.4995 (2026-10-23, 506 gün)
- aluminyum 3136 (2026-10-23, 505 gün)
- hrc_abd 1368 (2026-10-23, 505 gün)
- ttf 93.3 (2026-10-23, 506 gün)
- henryhub 3.048 (2026-10-23, 506 gün)
- bugday 625 (2026-10-23, 505 gün)
- pamuk 80.31 (2026-10-23, 506 gün)
- brent_yh 111.68 (2026-10-23, 506 gün)
- eurusd 1.1197 (2026-10-23, 521 gün)
- usdtry 49.7301 (2026-10-23, 521 gün)
- metal_marji_tr 193.5 $/t
- wb 15 seri · 2026M09 · "Updated on October 02, 2026" (aynı sayı)
- ⚠ hurda_lme: fetch/Playwright Cloudflare duvarı · köprü: LME engeli HTTP 403 ·  Just a moment... *{box-sizing:border-box;margin:0;padding:0
- ⚠ demir_lme: fetch/Playwright Cloudflare duvarı · köprü: LME engeli HTTP 403 ·  Just a moment... *{box-sizing:border-box;margin:0;padding:0

### EVDS serileri (§466) — ✓ 17 seri (16 EVDS + türetilmiş)
- tufe 137.23 (2026-09, 141 ay, aylık 1.84%, yıllık 29.7%, zincirli)
- tufe_gida 134.04 (2026-09, 141 ay, aylık -0.20%, yıllık 27.6%, zincirli)
- tufe_giyim 112.06 (2026-09, 141 ay, aylık 3.98%, yıllık 13.2%, zincirli)
- yiufe 5901.26 (2026-09, 141 ay, aylık 2.07%, yıllık 27.4%)
- cimento_ufe 6454.84 (2026-09, 141 ay, aylık 1.77%, yıllık 28.5%)
- celik_ufe 6926.89 (2026-09, 141 ay, aylık 2.87%, yıllık 27.0%)
- elektrik_ufe 3050.64 (2026-09, 141 ay, aylık 1.52%, yıllık 0.5%)
- gubre_ufe 9900.26 (2026-09, 141 ay, aylık 3.34%, yıllık 36.7%)
- plastik_uretim 98.56 (2026-08, 140 ay, aylık -1.40%, yıllık 1.2%)
- konut_ilk_el 51519 (2026-09, 141 ay, aylık 16.09%, yıllık 3.9%)
- konut_toplam 142390 (2026-09, 141 ay, aylık 11.76%, yıllık -9.3%)
- konut_ipotekli 23397 (2026-09, 141 ay, aylık 5.72%, yıllık 5.1%)
- kfe 239.38 (2026-09, 115 ay, aylık 1.22%, yıllık 22.3%)
- aofm %36.04 (2026-10-23, 966 gün)
- tlref %36.8769 (2026-10-22, 947 gün)
- katilim_kar_payi %42.35 (2026-10-16, 303 gün)
- epdk_tarife 722.24 (2026-11, TÜFE z−2 türevi, 119 ay)

### EPİAŞ PTF (§466) — ✓ 3666.44 TL/MWh · 74.01 $/MWh (2026-10-24)
- 1393 gün (2023-01-01→) · bu koşuda 11 gün/264 saat · 1 parça
- son 30 gün ort. 2735 TL/MWh · yıllık 0.6% · kimlik: EPIAS_ID+EPIAS_KEY

### ASELSAN sözleşme akışı (§467) — ✓ 212 sözleşme (2017-01-06→2026-10-23) · kur Yahoo 10y
- 2026Q4 (koşu): 5.36 mlr $ / 7 sözleşme · 2026Q3: 3.09 mlr $ · 2025Q4: 2.31 mlr $ · son 4 çeyrek 10.5 mlr $
- son: 2026-10-23 442.5 mn $ — ASELSAN uluslararası bir müşterisi ile; Radar, İHA Karşı Tedbir, Komuta ve Kontrol Sisteml
- resmî backlog (elle): 2024Q4 14 · 2025Q4 20.4 · 2026Q2 23.2 mlr $

### KAP Yeni İş İlişkisi (§469) — ✓ 101 bildirim kayıtlı · bu koşu 0 sayfa, 0 yeni
- KATMR: 14 bildirim · 2026Q4 0.00 mlr $ (0) · 2026Q3 0.00
- ALTNY: 28 bildirim · 2026Q4 0.00 mlr $ (0) · 2026Q3 0.13
- GLRMK: 19 bildirim · 2026Q4 0.00 mlr $ (0) · 2026Q3 0.00
- ASELS: 40 bildirim · 2026Q4 5.36 mlr $ (7) · 2026Q3 3.09 · çapraz 2026Q3: KAP 3.09 / webapi 3.09 mlr $ ✓

### Kardemir fiyatları (§472) — ✓ kütük 565 (2026-10-13) $/t · hurda Özel Ekstra 20120 TL/t ≈ 411.04 $/t (2026-09-25) · metal marjı 153.96 $/t
- liste 483 tarih (2014-01-07→2026-10-21) · dosyada 483 · hurda 347 tarih (2014-02-11→2026-09-25) · dosyada 347 · bu koşu 0 sayfa, 0 yeni · geriye doldurma TAMAM
- nervürlü Ø12-32 30210 TL/t ≈ 608.8 $/t (2026-10-21) · profil IPE 180-200 670 (2026-07-07) $/t · filmaşin 635 (2026-10-21) $/t
- kütük − 1,6×cevher 408.68 $/t (kok hariç) · KCAER hadde spread'i (profil − kütük) 105 $/t · kur: günlük 2603 · ay başı 262

### GES zinciri fiyatları (§483) — ✓ 2026-10-21 · modül 0.114 $/W (y/y +29.5%) · hücre 0.046 $/W (y/y +9.5%) · polisilikon 40 RMB/kg (y/y -23.1%) · montaj makası 0.068 $/W (y/y +47.8%)
- arşiv: 54 hafta (2025-01-15→2026-10-21) · Wayback 183 görüntü, bu koşu 4 · 113 görüntü sonraki koşulara
- polisilikon_rmb 54 hafta [k1 ad değişimi, oran 1 (33 hafta)] · polisilikon_usd 54 hafta [k1 ad değişimi, oran 1 (33 hafta)] · wafer_rmb 54 hafta · hucre_usd 54 hafta [k1 ad değişimi, oran 1 (45 hafta)] · hucre_rmb 54 hafta · modul_usd 54 hafta · modul_rmb 54 hafta · modul_avrupa_usd 54 hafta [k1 ad değişimi, oran 1 (43 hafta)] · modul_abd_usd 54 hafta [k1 ad değişimi, oran 1 (43 hafta)] · CNY kuru 2601 gün
- archive.org hız sınırı (HTTP 429) ×4 — görüntüler sonraki koşulara (hata sayılmadı)
- PVinsights (§483b): ✓ canlı 2026-10-21 · modül 0.089 $/W (y/y +14.1%) · hücre 0.04 $/W (y/y +11.1%) · polisilikon 5.07 $/kg (y/y -22%) · makas 0.049 $/W (y/y +16.7%) · arşiv 35 hafta (2024-02-21→2026-10-21) · Wayback 87 görüntü, bu koşu 1 · 43 sonraki koşulara · polisilikon_usd 35 · wafer_usd 35 [k1 ×0.933 (33 örtüşme, 2 hafta)] · hucre_usd 35 · modul_usd 35

### Elle seriler (§484 backlog · §485 asgari ücret) — ✓ tkfen_backlog 2026Q2 = 413 mn $ (4 çeyrek) · asgari_ucret 33030 TL (2026-10, son adım 2026-01-01) · reel 24069 (2026-09) · değişiklik yok

### TÜİK inşaat maliyet endeksi (§486) — ✓ ime_konut 2449.7 (2026-08, y/y 28.78%) · ime_konut_malzeme 2212.4 (2026-08, y/y 27.75%) · ime_konut_iscilik 2981.0 (2026-08, y/y 30.52%) · ime_insaat 2501.4 (2026-08, y/y 29.59%) · ekgyo_kfe_ime 151.3 (2026-08)

### TÜİK geniş tablolar (§487) — ✓ 7/7 tablo · ufe_plastik 6946.05 (2026-09, y/y 45.6%) · ufe_cimento 6482.69 (2026-09, y/y 29.0%) · ufe_makarna 5356.46 (2026-09, y/y 18.4%) · ufe_celik_2410 6926.89 (2026-09, y/y 27.0%) · ufe_kumas 3692.83 (2026-09, y/y 20.0%) · ufe_gubre_2015 10127.37 (2026-09, y/y 31.8%) · ydufe_plastik 3531.22 (2026-09, y/y 33.5%) · ydufe_cimento 3223.24 (2026-09, y/y 21.6%) · ydufe_makarna 2770.00 (2026-09, y/y 18.7%) · ydufe_celik 5615.64 (2026-09, y/y 26.8%) · bugday_tl 15.82 (2026-09, y/y 18.8%) · gubre_girdi 1340.19 (2026-08, y/y 28.8%) · perakende_gida_hacim 172.33 (2026-07, y/y 3.2%) · perakende_giyim_hacim 154.57 (2026-07, y/y 7.7%) · insaat_uretim_bina 141.73 (2026-08, y/y -0.9%) · insaat_uretim_toplam 126.64 (2026-08, y/y 2.3%) · kara_tasima_hacim 131.89 (2026-07, y/y 5.6%) · obams_makas 91.7 (2026-09) · petkm_ufe_makas 70.0 (2026-09)

### PlasticPortal PE/PP (§488) — ⏭ bugün zaten denendi (günde 1; veri aylık) · son ay 2026-10 · yol {"tohum":4}

### DCE polimer vadelileri (§489) — ✓ LLDPE 8770 CNY/t ≈ 1315 $/t (2026-10-23, $ y/y 34.4%, 232 ay) · PP 9383 CNY/t ≈ 1407 $/t (2026-10-23, $ y/y 50.6%, 153 ay) · PVC 4941 CNY/t ≈ 741 $/t (2026-10-23, $ y/y 11.6%, 210 ay) · Asya makası 410 $/t (2026-10)

### SUT endeksi (§474) — ✓ SUT 597.14 (son artış 2026-01-01 +%25) · reel 69.01 (2020-12=100, 2026-09) · TTB 548.42 (son 2026-01-01 +%16.5) · TTB reel 141.67
- 6 SUT adımı (2021-04-28→2026-01-01, 1 otomatik) · 7 TTB adımı · son SUT artışından bu yana TÜFE +%24.3 → reel %-19.6
- SGK güncel SUT: değişiklik yok (son duyuru 2026-10-02)
- RG fihrist taraması: 28 sayfa (14 erişildi) · 0 yeni başlık · kayıtlı 0

### Faktör evreni (§361) — ✓ parti 6 · kapsam 144/238 · ⚠ 14 kayıt eski yöntemle (sıraya öne alındı)
- bu turda: 0 tam · 3 eksik kalemli · 3 alınamadı
- not: §455c arşivden 3 şirket (ağ yok) · temel kapsamın XKTUM ağırlığı %85.6 · ALBRK:2 ana kalem boş · BINHO:1 ana kalem boş · KTLEV:2 ana kalem boş · CITAS:liste boş · KPEKS:liste boş · TKNKA:liste boş
- ⚠ ÖLÇÜM TURU: parti 6 şirketle sınırlı; KAP hız sınırı ve şablon uyumu görülünce büyütülecek. Panel HENÜZ bağlı değil (multiple.json korunuyor).

### Multiple kendi verimizden (§496) — ✓ 78 hisse KAP · 63 eski (evren dışı)
- kurumsal işlem düzeltmesi: AKFYE 2026-09-21 ×6.000 (Yahoo) | CVKMD 2026-08-03 ×2.623 (fiyat boşluğu, yaklaşık) | HRKET 2026-09-21 ×14.000 (Yahoo) | YEOTK 2026-07-31 ×2.338 (Yahoo) · 26 sn

### Fonzi gerçekleşen (§457) — ✓ 232 hisse · endeks XKTUM -17.1 · XK100 -20.5 · XK030 -20 · XU100 -14 · fon-portfoy.json/tasfiye.gerceklesen

### Faktör skorları (§455) — ✓ sıralanan 124/238 · temel veri 124 · fiyat 232 · beta çıpası XKTUM arşivi · Rel.Vol medyan 0.77 ✓
- ✓ fm.json TERFİ ETTİ (adet 124 ≥ 100 · XKTUM ağırlık kapsamı %85.6 ≥ %70) — panel kendi hesabımızla çalışıyor
- imza: VALUE 124 0.012 0.955 -3.00 1.30 0 · GROWTH 123 -0.001 0.996 -2.15 3.00 0 · QUALITY 124 -0.000 1.000 -2.70 2.54 0 · MOMENTUM 124 -0.000 0.999 -2.19 3.00 0 · LOW_RISK 124 0.000 1.000 -2.34 2.08 0

### KAP arşivi (§381) — ✓ +8 çeyrek · 0/238 şirket tam · 2 yeni dosya
- EBEBK:0→4 · ISDMR:0→4
- öncelik: bilanço tetiği → XK030 → XK100 → kalanlar (en çok bakılan önce dolar)
- §500 yeni dönem önceliği: EBEBK, EREGL, ISDMR, SOHOE
- ⓘ Ham tablolar `kap-arsiv/<KOD>.json` içinde, şirket başına en fazla 15 çeyrek. Yayımlanmış bildirim değişmediği için bir kez yazılır; panel KAP yerine buradan okuyabilir (15 istek → 1).

### Ton başına FAVÖK (§499) — ✓ EREGL 2026Q2: FAVÖK/t 68.3 $ · fiyat/t 672.9 · maliyet/t 604.6 · 2117 bin t (10 çeyrek) | KRDMD 2026Q2: FAVÖK/t 78.1 $ · fiyat/t 637.2 · maliyet/t 559.1 · 699.4 bin t (10 çeyrek)
- ⚠ EREGL tonaj var, bilanço arşivde yok: 2026Q3

### GYO NAV (§364) — ⏭ hiçbir şirket için veri alınamadı (dönem 202606)

- §366c tür kırılımı: 14 tür × 8 ay · 100/168 satır · 700 hücre eşlendi · ⚠ KISMİ (yanıt sayfalı; ilk blok alındı)

- en büyük türler (2026-09): SERBEST 5458 mlr · PARA PİYASASI 1450 mlr · GİRİŞİM SERMAYESİ YATIRIM FONU 482 mlr

### VAP fon akışı (§366) — ✓ 8 ay · son 2026-09
- toplam fon tutarı: 8833.4 mlr ₺
- son ay net değişimi: -1757.0 mlr ₺ (dönem sonu − dönem başı, tüm türler)
- ölçüler: Dönem Başı Fon Adedi · Dönem Sonu Fon Adedi · Fon Adedi Değişim · Dönem Başı Fon Tutarı (TL) · Dönem Sonu Fon Tutarı (TL) · Dönem Başı Fon Sayısı · Dönem Sonu Fon Sayısı

### Bülten keşfi (§250k) — ✓ thb202610221.zip indi · 249KB
- içerik: thb202610221.csv
- endeks izi: `thb202610221.csv → TARIH;ISLEM  KODU;BULTEN ADI;PAZAR GRUBU;PAZAR;YAPISAL BAZDA PIYASA ALT BOLUMU;ENSTRUMAN GRUBU;ENSTRUMAN TIPI;ENSTRUMAN SINIFI;ISLEM YONTEMI;PIYASA YAPICI;BIST 100 ENDEKS;BIST 30 ENDEKS;BRUT TAKAS;OZS`

### Bülten fiyat keşfi (§305 · tek koşuluk ölçüm) — thb202610221.csv
- satır: 10507 · kolon: 57
- fiyat kolon adayları: ONCEKI KAPANIS FIYATI · ACILIS FIYATI · ACILIS SEANSI FIYATI · EN DUSUK FIYAT · EN YUKSEK FIYAT · KAPANIS FIYATI · KAPANIS SEANSI FIYATI · REFERANS FIYAT …
- THYAO varyantları (kod=kapanış): THYAO.AOF=0 · THYAO.E=259
- örnek satır: `2026-10-22;THYAO.AOF;TURK HAVA YOLLARI AOF;;Z;MSPOT;AOF;MSPOTAOF;MSPOTAOFTHYAO;SI;0;0;0;0;;0;0;0;0;0;0;0;0;0;0;0;0;;;;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0`


---
**Sonuç:** XK100 ağırlıkları · XKTUM ağırlıkları · XKTMT ağırlıkları · Multiple fiyatları (124 fiyat) · Model sicili (38 fiyat) · TR 5Y CDS (251.06 bp) · fon akışı (1981) · katılım fonları (45+akış) · bilanço takvimi (3Ç26) · bilanço tetiği (112 bekliyor) · endeks üyelikleri · endeks arşivi · sicil serisi · sektör ısı (15 sektör) · küresel makro takvim (19 olay) · sürücü serileri (14) · EVDS serileri (17) · EPİAŞ PTF (1393 gün) · ASELSAN sözleşme akışı (212) · GES zinciri fiyatları (1 hafta) · TÜİK İME (5) · TÜİK tablolar (19) · DCE polimer (4) · faktör evreni (144/238) · multiple bilanço (78 kendi · 63 eski) · fonzi gerçekleşen · fm.json (§455 kendi hesap · ağırlık %86) · fm-oto · KAP arşivi (+8 çeyrek) · ton başına FAVÖK (2) · VAP fon akışı (8 ay)

### Süre bütçesi (§326)
- ⏱ Sürücü serileri (§464) — 115 sn
- ⏱ GES zinciri fiyatları (§483) — 69 sn
- ⏱ KAP arşivi (§381) — 80 sn
- toplam: 402 sn