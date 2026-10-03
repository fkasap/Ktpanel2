# Tazeleme — 2026-10-03

Katman: `hepsi` · Veri dizini: `ktpanel`


### XK100 ağırlıkları — ✓ GEÇTİ
- ✓ **kapsam**: 100/100 (%100)
- ✓ **tarih birliği**: tek tarih: 2026-10-02
- ✓ **fiyat yasi (XK100 ağırlıkları)**: 2026-10-02 (0 is gunu — guncel)
- ✓ **toplam**: 100.00 (hedef 100 ±3)

### XKTUM ağırlıkları — ✓ GEÇTİ
- ✓ **kapsam**: 150/150 (%100)
- ✓ **tarih birliği**: tek tarih: 2026-10-02
- ✓ **fiyat yasi (XKTUM ağırlıkları)**: 2026-10-02 (0 is gunu — guncel)
- ✓ **toplam**: 96.50 (hedef 96.5 ±3)

### XKTMT ağırlıkları — ✓ GEÇTİ
- ✓ **kapsam**: 39/39 (%100)
- ✓ **tarih birliği**: tek tarih: 2026-10-02
- ✓ **fiyat yasi (XKTMT ağırlıkları)**: 2026-10-02 (0 is gunu — guncel)
- ✓ **toplam**: 100.00 (hedef 100 ±3)

### Multiple fiyatları — ✓ GEÇTİ
- ✓ **kapsam**: 141/141 (%100)
- ✓ **tarih birliği**: tek tarih: 2026-10-02
- ✓ **fiyat yasi (Multiple fiyatları)**: 2026-10-02 (0 is gunu — guncel)
- ✓ **aykırı değer**: temiz (sınır ±%25)

### Model sicili — ✓ GEÇTİ
- ✓ **kapsam**: 40/40 (%100)
- ✓ **tarih birliği**: tek tarih: 2026-10-02
- ✓ **fiyat yasi (Model sicili)**: 2026-10-02 (0 is gunu — guncel)
- ✓ **aykırı değer**: temiz (sınır ±%25)

### TR 5Y CDS — ✓ 252.1 bp · 2026-10-03 · +5.69
- ✓ 3319 günlük seri · kaynak etiketi 2026-10-03 (hafta sonu doldurmalı)

### Risk metrikleri — ✓ GEÇTİ
- ✓ **kapsam**: 141/141 (%100)
- ✓ **aykırı değer**: temiz (sınır ±%3)
- ✓ **aykırı değer**: temiz (sınır ±%150)
- ℹ **beta referansı: XKTUM (BIST resmî arşiv)** (217 gün)
- ℹ 4 gözlem kurumsal işlem süzgecine takıldı (±%20 üstü hareket — bölünme/bedelsiz)
- ℹ 1128 gözlem TARİH BOŞLUĞU nedeniyle atlandı (>5 gün ara — aylık tohum noktaları; §252z) — ✓ GERÇEK katılım çıpası (BIST resmî)

### TEFAS genel bilgi (§253i) — ⏭ boş döndü
- Playwright yedeği devrede.

### TEFAS köprü (bilgi)
- getiri: 1071 fon ✓ · liste: 942 kayıt · alanlar: fonKod, unvan, kurucuKod, kurucuAd, oprKod, oprAd, durum, tarih

### TEFAS çekim tanısı (bilgi)
- yol: yok
- yakalanan JSON: 0 / toplam yanıt: 1 · sayfa: "Request Rejected" · gövde: `The requested URL was rejected. Please consult with your administrator. Your support ID is: <9051587013020056120> [Go Back]`

- §410 konsol dosyası YOK: arac/gelen/tefas-tam-*.json okunamadı (ENOENT) — üretmek için: ktpanel/arac/tefas-konsol.js

### Katılım fonları — ✓ GETİRİ-MODU: 36/46 fonun 5 dönem getirisi + fiyat/1G yazıldı (AUM/akış önceki turdan)

### Depo hijyeni + kalem tazeligi (§297) — ✓ GEÇTİ
- ✓ **ikiz dosya**: temiz
- ✓ **seri guncelligi (track.series)**: 2026-10-02 (referans 2026-10-02, fark 0g)
- ✓ **seri guncelligi (fon-akis)**: 2026-10-02 (referans 2026-10-03, fark 1g)

### Bilanço borç defteri — ✓ GEÇTİ
- ⚠ **borc defteri (§299)**: 73 kart bekliyor · en eski AKHAN (46g)
  - 68 kod 21 gunden uzun suredir kartsiz: AKHAN, ALFAS, ALKIM, ALKLC, ALTNY, ALVES, BERA, BIENY, BIMAS, BINHO, BRLSM, BUCIM …

### Bilanço tetiği (§299 kümülatif) — ✓ 73 şirket kart bekliyor (katılım evreni · evren dışı 184 saklı, §428)
- pencere: 3 FR · yeni deftere giren: 0
- kart yazılıp düşen: 0
- en eski borç: AKHAN · 46 gündür bekliyor ⚠
- AKHAN, ALFAS, ALKIM, ALKLC, ALTNY, ALVES, BERA, BIENY, BIMAS, BINHO, BRLSM, BSOKE, BUCIM, BURCE, CANTE, CELHA, CVKMD, DCTTR, EGGUB, EGPRO …

### Endeks üyelikleri — ✓ XK030EA:30 · XKTUM:238 · XK100:100 · XK050:50 · XK030:30 · XSRDK:27 · XKTMT:41
- ⚠ REVİZYON XKTUM: FAZLA 21 (OZATD, RALYH, UFUK, GUNDG, RGYAS, ALKLC) · ölü ağırlık %3.94 — xktum.json revize edilmeli
- ⚠ REVİZYON XK100: FAZLA 35 (KTLEV, OZATD, RALYH, PASEU, EUPWR, GUNDG) · ölü ağırlık %8.97 · EKSİK 35 (AHGAZ, AKCNS, AKFIS, ARASE, ATAKP, AVPGY) — xk100.json revize edilmeli
- ⚠ REVİZYON XKTMT: FAZLA 3 (AYEN, GENTS, SUNTK) · ölü ağırlık %0.41 · EKSİK 5 (AKCNS, ENERY, KFEIN, PNLSN, TGSAS) — xktmt.json revize edilmeli

### Endeks kapanışları — ✓ 87 endeks · veri günü 2026-10-02
- XKTUM 16325.58 · XKTMT 14683.33 · XK100 14378.97 · XU100 12270.18 · BISTTLREFK 4245.40312
- arşiv: 646 gün · dosyalar: bisttlrefkendeksi.csv(1), zip:[FiyatEndeksleri_PriceIndices.csv, GetiriEndeksleri_ReturnIndices.csv], FiyatEndeksleri_PriceIndices.csv(84), GetiriEndeksleri_ReturnIndices.csv(2)
- ℹ beklenen 404 (§250b: bu dosyalar zip içinde, tekil URL yok): FiyatEndeksleri_PriceIndices.csv:HTTP404 · GetiriEndeksleri_ReturnIndices.csv:HTTP404

### Model sicili serisi (§291) — ✓ 2026-10-02 · model %-13.159 / endeks %-10.606

### Sektör ısı + rotasyon (§333) — ✓ 2026-10-02 · 15/15 sektör
- çapalar: 1G 2026-10-01 · 1H 2026-09-25 · 1A 2026-09-02 · 3A 2026-06-30
- XU100 (1G/1H/1A/3A): 0.17 · -4.88 · -12.67 · -13.11
- 3A lideri: XKMYA %21.09

### Hazine ihale sonuçları (§314) — ✓ defter 14 duyuru · yeni 0
- yeni duyuru yok

### Hazine ihraç takvimi (§334) — ⏭ yeni strateji yok (mevcut: 2026-09-30 · Ekim–Aralık 2026)

### Küresel makro takvim (§319) — ✓ 27 olay (10 yüksek etki)
- 2026-09-29 04:30Z · AUD · Cash Rate
- 2026-09-29 04:30Z · AUD · RBA Rate Statement
- 2026-09-30 01:30Z · AUD · CPI m/m
- 2026-09-30 01:30Z · AUD · CPI y/y
- 2026-09-30 01:30Z · AUD · Trimmed Mean CPI m/m
- 2026-09-30 12:30Z · USD · Core PCE Price Index m/m

- §383 arşive yazıldı: +1 çeyrek (ek istek YOK — faktörün zaten çektiği tablolar)

### Faktör evreni (§361) — ✓ parti 6 · kapsam 105/238
- bu turda: 6 tam · 0 eksik kalemli · 0 alınamadı
- ⚠ ÖLÇÜM TURU: parti 6 şirketle sınırlı; KAP hız sınırı ve şablon uyumu görülünce büyütülecek. Panel HENÜZ bağlı değil (multiple.json korunuyor).

### KAP arşivi (§381) — ✓ +8 çeyrek · 0/238 şirket tam
- EKGYO:4→8 · EREGL:4→8
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

### Bülten keşfi (§250k) — ✓ thb202610021.zip indi · 250KB
- içerik: thb202610021.csv
- endeks izi: `thb202610021.csv → TARIH;ISLEM  KODU;BULTEN ADI;PAZAR GRUBU;PAZAR;YAPISAL BAZDA PIYASA ALT BOLUMU;ENSTRUMAN GRUBU;ENSTRUMAN TIPI;ENSTRUMAN SINIFI;ISLEM YONTEMI;PIYASA YAPICI;BIST 100 ENDEKS;BIST 30 ENDEKS;BRUT TAKAS;OZS`

### Bülten fiyat keşfi (§305 · tek koşuluk ölçüm) — thb202610021.csv
- satır: 10307 · kolon: 57
- fiyat kolon adayları: ONCEKI KAPANIS FIYATI · ACILIS FIYATI · ACILIS SEANSI FIYATI · EN DUSUK FIYAT · EN YUKSEK FIYAT · KAPANIS FIYATI · KAPANIS SEANSI FIYATI · REFERANS FIYAT …
- THYAO varyantları (kod=kapanış): THYAO.AOF=0 · THYAO.E=292
- örnek satır: `2026-10-02;THYAO.AOF;TURK HAVA YOLLARI AOF;;Z;MSPOT;AOF;MSPOTAOF;MSPOTAOFTHYAO;SI;0;0;0;0;;0;0;0;0;0;0;0;0;0;0;0;0;;;;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0`

- §429p kabul dağılımı: 40 fon kabul (NKT:7 VHS:5 RKH:10 KTS:9 PKD:7 HFI:7 KLH:7 OHK:6 NKM:5 PUK:4 HFO:2 MAC:5 MKA:5 ZPE:5 TZD:5 RPI:5 KHJ:5 MPS:5 PHK:5 GKV:5 KTI:5 TLZ:5 KHC:7 KST:6 ELZ:5 YHK:6 DKH:6 MTK:6 TIL:6 RBH:5 KH1:5 KTM:5 KPA:5 KPU:5 KPC:5 KCV:5 HKH:5 NNF:5 IVF:5 ZPJ:2)

- §429f teşhis: listede 1324 farklı fon kodu · evrenden görülen: 40/47
- §429n GÖRÜLMEYEN (7, 150 günde KAP listesinde yok): FS3=ONE PORTFÖY KATILIM HİSSE SE · HKP=HEDEF PORTFÖY KATILIM HİSSE  · KBP=KUVEYT TÜRK PORTFÖY PY KATIL · KHD=ATLAS PORTFÖY İKİNCİ KATILIM · KHF=ALLBATROSS PORTFÖY KATILIM H · PKH=DENİZ PORTFÖY POYRAZ KATILIM · VHK=V PORTFÖY KATILIM HİSSE SENE
- §429n kod uyuşmazlığı adayları (KAP başlığı katılım-hisse, kod evren dışı): ZPMDK=ZİRAAT PORTFÖY BIST KATILIM 100 ENDEKSİ MODEL PORTFÖY H | Z30KP=ZİRAAT PORTFÖY BIST KATILIM 30 ENDEKSİ HİSSE SENEDİ YOĞ | Z30KE=ZİRAAT PORTFÖY BIST KATILIM 30 EŞİT AĞIRLIKLI ENDEKSİ H | OPK30=OSMANLI PORTFÖY KATILIM 30 ENDEKSİ HİSSE SENEDİ YOĞUN (

- §429p kuyruk: liste 218 kayıt · daha önce işlenmiş 142 idx · iş 38

### Fon portföy dağılımı (§429) — ✓ 32 rapor işlendi · evren 47 fon (oto +0) · depo 34 fon / 169 dönem · KAP yolu: tarama(47 fon, 10613 kayıt) · pencere 150 gün · kalıcı istisna 7 fon
- bu turda hedef 35 (tur tavanı 80; kalan sonraki koşuda)
- ⚠ hata (ilk 3, tanılı): RKH idx1666763: dönem çözülemedi · belge başı: "RKH - KATILIM HİSSE SENEDİ SERBEST (TL) FON 14/09/2026 - 18/09/2026 I-FONU TANITICI BİLGİLER A-)Fonu"
  · RKH idx1669713: dönem çözülemedi · belge başı: "RKH - KATILIM HİSSE SENEDİ SERBEST (TL) FON 21/09/2026 - 25/09/2026 I-FONU TANITICI BİLGİLER A-)Fonu"
  · VHS null: ek bulunamadı (HTTP 200)

### SEC ticker yedeği (§448) — ✗ HTTP 403 · " SEC.gov | Request Rate Threshold Exceeded html {height: 100%} body {height: 100%; margin:0; padding:0;} #header {backgr"


---
**Sonuç:** TR 5Y CDS (252.1 bp) · risk metrikleri (134) · katılım fonları (getiri-modu 36) · bilanço tetiği (73 bekliyor) · endeks üyelikleri · endeks arşivi · sicil serisi · sektör ısı (15 sektör) · küresel makro takvim (27 olay) · faktör evreni (105/238) · KAP arşivi (+8 çeyrek) · GYO NAV (46 şirket) · VAP fon akışı (8 ay) · fon portföy (32 rapor)

### Süre bütçesi (§326)
- ⏱ Faktör evreni (§361) — 105 sn
- ⏱ KAP arşivi (§381) — 89 sn
- toplam: 312 sn