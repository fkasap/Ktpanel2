# Tazeleme — 2026-09-18

Katman: `hepsi` · Veri dizini: `ktpanel`


### XK100 ağırlıkları — ✓ GEÇTİ
- ✓ **kapsam**: 100/100 (%100)
- ✓ **tarih birliği**: tek tarih: 2026-09-18
- ✓ **fiyat yasi (XK100 ağırlıkları)**: 2026-09-18 (0 is gunu — guncel)
- ✓ **toplam**: 100.00 (hedef 100 ±3)

### XKTUM ağırlıkları — ✓ GEÇTİ
- ✓ **kapsam**: 150/150 (%100)
- ✓ **tarih birliği**: tek tarih: 2026-09-18
- ✓ **fiyat yasi (XKTUM ağırlıkları)**: 2026-09-18 (0 is gunu — guncel)
- ✓ **toplam**: 96.50 (hedef 96.5 ±3)

### XKTMT ağırlıkları — ✓ GEÇTİ
- ✓ **kapsam**: 39/39 (%100)
- ✓ **tarih birliği**: tek tarih: 2026-09-18
- ✓ **fiyat yasi (XKTMT ağırlıkları)**: 2026-09-18 (0 is gunu — guncel)
- ✓ **toplam**: 100.00 (hedef 100 ±3)

### Multiple fiyatları — ✓ GEÇTİ
- ✓ **kapsam**: 141/141 (%100)
- ✓ **tarih birliği**: tek tarih: 2026-09-18
- ✓ **fiyat yasi (Multiple fiyatları)**: 2026-09-18 (0 is gunu — guncel)
- ✓ **aykırı değer**: temiz (sınır ±%25)

### Model sicili — ✓ GEÇTİ
- ✓ **kapsam**: 40/40 (%100)
- ✓ **tarih birliği**: tek tarih: 2026-09-18
- ✓ **fiyat yasi (Model sicili)**: 2026-09-18 (0 is gunu — guncel)
- ✓ **aykırı değer**: temiz (sınır ±%25)

### TR 5Y CDS — ✓ 232.97 bp · 2026-09-18 · +2.98
- ✓ 3306 günlük seri · kaynak etiketi 2026-09-18 (hafta sonu doldurmalı)

### Risk metrikleri — ✓ GEÇTİ
- ✓ **kapsam**: 141/141 (%100)
- ✓ **aykırı değer**: temiz (sınır ±%3)
- ✓ **aykırı değer**: temiz (sınır ±%150)
- ℹ **beta referansı: XKTUM (BIST resmî arşiv)** (206 gün)
- ℹ 5 gözlem kurumsal işlem süzgecine takıldı (±%20 üstü hareket — bölünme/bedelsiz)
- ℹ 1410 gözlem TARİH BOŞLUĞU nedeniyle atlandı (>5 gün ara — aylık tohum noktaları; §252z) — ✓ GERÇEK katılım çıpası (BIST resmî)

### TEFAS genel bilgi (§253i) — ⏭ boş döndü · fetch failed
- Playwright yedeği devrede.

- §408b TANI: HTTP 200 · boy 6164 · Rejected:hayır · chunk:0 · inlineJeton:yok · baş120: <!DOCTYPE html> <html><head> <meta http-equiv="Pragma" content="no-cache"/> <meta http-equiv="Expires" content="-1"/>

- §408 TEFAS: sayfada chunk yok (0) ve inline jeton yok — runner farklı HTML görüyor (TANI satırına bak)

- §412 API doğrudan test: fetch failed

- §408 TEFAS getiri: köprü + doğrudan v2 + HAR — üçü de yok; katman yazılmayacak

### TEFAS köprü (bilgi)
- getiri ucu: {"error":"fetch failed"}

### TEFAS çekim tanısı (bilgi)
- yol: yok
- yakalanan JSON: 0 / toplam yanıt: 1 · sayfa: "Request Rejected" · gövde: `The requested URL was rejected. Please consult with your administrator. Your support ID is: <9051587013067825775> [Go Back]`

- §410 konsol dosyası YOK: arac/gelen/tefas-tam-*.json okunamadı (ENOENT) — üretmek için: ktpanel/arac/tefas-konsol.js

### Katılım fonları — ✗ TEFAS eşleşme SIFIR (v4)
- Ağ dinleme JSON yakalayamadı ya da alanlar eşleşmedi — üstteki tanı satırı uç listesini söylüyor; katman yazılmadı.

### Depo hijyeni + kalem tazeligi (§297) — ✓ GEÇTİ
- ✓ **ikiz dosya**: temiz
- ✓ **seri guncelligi (track.series)**: 2026-09-17 (referans 2026-09-18, fark 1g)
- ✓ **seri guncelligi (fon-akis)**: 2026-09-17 (referans 2026-09-18, fark 1g)

### Bilanço borç defteri — ✓ GEÇTİ
- ⚠ **borc defteri (§299)**: 71 kart bekliyor · en eski AKHAN (31g)
  - 67 kod 21 gunden uzun suredir kartsiz: AKHAN, ALFAS, ALKIM, ALKLC, ALTNY, ALVES, BERA, BIENY, BIMAS, BINHO, BUCIM, BURCE …

### Bilanço tetiği (§299 kümülatif) — ✓ 71 şirket kart bekliyor (katılım evreni · evren dışı 173 saklı, §428)
- pencere: 1 FR · yeni deftere giren: 0
- kart yazılıp düşen: 0
- en eski borç: AKHAN · 31 gündür bekliyor ⚠
- AKHAN, ALFAS, ALKIM, ALKLC, ALTNY, ALVES, BERA, BIENY, BIMAS, BINHO, BRLSM, BUCIM, BURCE, CANTE, CELHA, CVKMD, DCTTR, EGGUB, EGPRO, ELITE …

### Endeks üyelikleri — ✓ XK030EA:30 · XKTUM:247 · XK100:100 · XK050:50 · XK030:30 · XSRDK:24 · XKTMT:39
- ⚠ REVİZYON XKTUM: FAZLA 1 (ALVES) · ölü ağırlık %0.04 — xktum.json revize edilmeli
- ⚠ REVİZYON XK100: FAZLA 1 (ALVES) · ölü ağırlık %0.05 · EKSİK 1 (FORTE) — xk100.json revize edilmeli
- ✓ üyelik uyumu XKTMT: 39/39 (tam kapsam)

### Endeks kapanışları — ✓ 87 endeks · veri günü 2026-09-17
- XKTUM 18297.01 · XKTMT 16366.27 · XK100 16482.67 · XU100 13509.76 · BISTTLREFK 4174.36543
- arşiv: 635 gün · dosyalar: bisttlrefkendeksi.csv(1), zip:[FiyatEndeksleri_PriceIndices.csv, GetiriEndeksleri_ReturnIndices.csv], FiyatEndeksleri_PriceIndices.csv(84), GetiriEndeksleri_ReturnIndices.csv(2)
- ℹ beklenen 404 (§250b: bu dosyalar zip içinde, tekil URL yok): FiyatEndeksleri_PriceIndices.csv:HTTP404 · GetiriEndeksleri_ReturnIndices.csv:HTTP404

### Model sicili serisi (§291) — ⏭ 2026-09-18 icin XKTUM arsivde yok; satir yazilmadi (uydurma yok)

### Sektör ısı + rotasyon (§333) — ✓ 2026-09-17 · 15/15 sektör
- çapalar: 1G 2026-09-16 · 1H 2026-09-10 · 1A 2026-08-18 · 3A null
- XU100 (1G/1H/1A/3A): 2.95 · -6.14 · -4.38 · 4.91
- 3A lideri: XKMYA %28.85
- ⚠ çapa sapması: 3A hedef 2026-06-19 → 2026-05-26 (24 gün geride) — ufuk ATLANDI, damgalı değer korundu

### Hazine ihale sonuçları (§314) — ✓ defter 14 duyuru · yeni 0
- yeni duyuru yok

### Hazine ihraç takvimi (§334) — ⏭ yeni strateji yok (mevcut: 2026-08-31 · Eylül–Kasım 2026)

### Küresel makro takvim (§319) — ✓ 25 olay (16 yüksek etki)
- 2026-09-14 12:30Z · CAD · CPI m/m
- 2026-09-14 12:30Z · CAD · Median CPI y/y
- 2026-09-14 12:30Z · CAD · Trimmed CPI y/y
- 2026-09-15 06:00Z · GBP · Claimant Count Change
- 2026-09-16 06:00Z · GBP · CPI y/y
- 2026-09-16 18:00Z · USD · Federal Funds Rate

### Faktör evreni (§361) — ✓ parti 6 · kapsam 104/247
- bu turda: 5 tam · 1 eksik kalemli · 0 alınamadı
- not: BINHO:1 ana kalem boş
- ⚠ ÖLÇÜM TURU: parti 6 şirketle sınırlı; KAP hız sınırı ve şablon uyumu görülünce büyütülecek. Panel HENÜZ bağlı değil (multiple.json korunuyor).

### KAP arşivi (§381) — ✓ +8 çeyrek · 0/247 şirket tam
- BIMAS:5→9 · CANTE:5→9
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

### Bülten keşfi (§250k) — ✓ thb202609171.zip indi · 292KB
- içerik: thb202609171.csv
- endeks izi: `thb202609171.csv → TARIH;ISLEM  KODU;BULTEN ADI;PAZAR GRUBU;PAZAR;YAPISAL BAZDA PIYASA ALT BOLUMU;ENSTRUMAN GRUBU;ENSTRUMAN TIPI;ENSTRUMAN SINIFI;ISLEM YONTEMI;PIYASA YAPICI;BIST 100 ENDEKS;BIST 30 ENDEKS;BRUT TAKAS;OZS`

### Bülten fiyat keşfi (§305 · tek koşuluk ölçüm) — thb202609171.csv
- satır: 11530 · kolon: 57
- fiyat kolon adayları: ONCEKI KAPANIS FIYATI · ACILIS FIYATI · ACILIS SEANSI FIYATI · EN DUSUK FIYAT · EN YUKSEK FIYAT · KAPANIS FIYATI · KAPANIS SEANSI FIYATI · REFERANS FIYAT …
- THYAO varyantları (kod=kapanış): THYAO.AOF=0 · THYAO.E=289.25
- örnek satır: `2026-09-17;THYAO.AOF;TURK HAVA YOLLARI AOF;;Z;MSPOT;AOF;MSPOTAOF;MSPOTAOFTHYAO;SI;0;0;0;0;;0;0;0;0;0;0;0;0;0;0;0;0;;;;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0`

- §429p kabul dağılımı: 40 fon kabul (PKD:7 HFI:7 KLH:7 KTS:7 RKH:9 OHK:6 NKM:5 PUK:4 HFO:2 MAC:5 MKA:5 ZPE:5 TZD:5 RPI:5 KHJ:5 MPS:5 PHK:5 GKV:5 KTI:5 TLZ:5 KHC:7 KST:6 ELZ:6 YHK:6 NKT:6 DKH:6 MTK:6 TIL:6 RBH:5 KH1:5 KTM:5 KPA:5 KPU:5 KPC:5 KCV:5 HKH:5 NNF:5 IVF:5 VHS:3 ZPJ:2)

- §429f teşhis: listede 1321 farklı fon kodu · evrenden görülen: 40/47
- §429n GÖRÜLMEYEN (7, 150 günde KAP listesinde yok): FS3=ONE PORTFÖY KATILIM HİSSE SE · HKP=HEDEF PORTFÖY KATILIM HİSSE  · KBP=KUVEYT TÜRK PORTFÖY PY KATIL · KHD=ATLAS PORTFÖY İKİNCİ KATILIM · KHF=ALLBATROSS PORTFÖY KATILIM H · PKH=DENİZ PORTFÖY POYRAZ KATILIM · VHK=V PORTFÖY KATILIM HİSSE SENE
- §429n kod uyuşmazlığı adayları (KAP başlığı katılım-hisse, kod evren dışı): OPK30=OSMANLI PORTFÖY KATILIM 30 ENDEKSİ HİSSE SENEDİ YOĞUN ( | Z30KP=ZİRAAT PORTFÖY BIST KATILIM 30 ENDEKSİ HİSSE SENEDİ YOĞ | Z30KE=ZİRAAT PORTFÖY BIST KATILIM 30 EŞİT AĞIRLIKLI ENDEKSİ H

- §429p kuyruk: liste 213 kayıt · daha önce işlenmiş 141 idx · iş 33

### Fon portföy dağılımı (§429) — ✓ 30 rapor işlendi · evren 47 fon (oto +0) · depo 34 fon / 168 dönem · KAP yolu: tarama(47 fon, 9868 kayıt) · pencere 150 gün · kalıcı istisna 7 fon


---
**Sonuç:** XK100 ağırlıkları · XKTUM ağırlıkları · XKTMT ağırlıkları · Multiple fiyatları (141 fiyat) · Model sicili (40 fiyat) · TR 5Y CDS (232.97 bp) · bilanço tetiği (71 bekliyor) · endeks üyelikleri · endeks arşivi · sektör ısı (15 sektör) · küresel makro takvim (25 olay) · faktör evreni (104/247) · KAP arşivi (+8 çeyrek) · GYO NAV (46 şirket) · VAP fon akışı (8 ay) · fon portföy (30 rapor)

⚠ **Bir ya da daha fazla katman denetimden geçemedi — o katmanlar YAZILMADI.**

### Süre bütçesi (§326)
- ⏱ Faktör evreni (§361) — 105 sn
- ⏱ KAP arşivi (§381) — 86 sn
- toplam: 287 sn