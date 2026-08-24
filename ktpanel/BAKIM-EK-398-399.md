# BAKIM EK — §398-§399 (24 Agu 2026)
# Onceki BAKIM-EK-398.md'nin YERINE gecer (kumulatif). KTPANEL-BAKIM.md'ye
# en yeni ustte yapistirilir; DAMGA bolumu KTPANEL-DAMGA.md'ye.

## §399 FM.JSON TAZELENDI: 147 -> 215 HISSE + t6 DAMGASI CANLIYA BAGLANDI (24 Agu)

KOK NEDEN: fm.json 14 Tem CSV'sinde donmustu (41 gun); t6 basligi, karne
notlari ve footer'daki "14 Tem" damgalari ELLE yaziliydi ve dosya yenilense
bile eskimis gorunecekti (Altin Kural 6 ihlal sinifi).
OLCUM (fm-isle.py --dogrula, 24 Agu CSV'si):
  - 215/215 hisse siralandi, minfac eleği 0 fire. Evren 147 -> 215;
    CIKAN YOK, 68 yeni isim (LOGO, KONTR, AKSA + kucuk GYO'lar).
  - Yapisal imza saglikli: ortalamalar ~0, |z|>3 yok (kirpma +-3,00'te
    calisiyor), sektorler arasi yayilim deseni dogru (VAL/GRO/QUA dar
    0,07-0,17 · MOM/LOW genis 0,38-0,60).
  - Eski dosyaya korelasyon (ortak 147): QUALITY 0,90 · GROWTH 0,73 ·
    VALUE 0,70 · LOW_RISK 0,68 · MOMENTUM 0,27. Desen BEKLENEN: kalite
    yavas doner, momentum 6 haftada doner — kolon/birim kaymasi sinyali yok.
COZUM:
  a) fm.json yeni CSV'den uretildi (meta.tarih=2026-08-24, _uretim kaynagi
     dosya adiyla kayitli). Panel cache:'no-store' ile okur — surum
     damgasi GEREKMEZDI ama (b) app.js'i degistirdigi icin damga ilerledi.
  b) §399 damga yazicisi: index.html'deki bes "14 Tem" metni span'a alindi
     (id=fmDamga uzun bicim, class=fmDamgaKisa kisa bicim); fmInit
     FM.meta.tarih'ten Turkce kisa ay ile basar. meta.tarih yoksa (eski
     sema) metin DURUR — sessiz yanlis yerine bilinen eski. TEK SAHIP (§112):
     bu tarihlerin sahibi fm.json meta.tarih, yazicisi fmInit'teki blok.
DOGRULAMA: node --check ✓ · div 942/942, span 589/589 ✓ · index'te ciplak
"14 Tem" kalmadi ✓ · KTP_SURUM 20260824b = iki ?v= ✓ · kisisel faktor
agirliklari etkilenmez (localStorage/bulut, §108).
DERS: DOSYA TAZELEMEK YETMEZ — dosyanin TARIHINI GOSTEREN HER METIN de ayni
kaynaktan beslenmeli, yoksa taze veri bayat etiketle gezer (§345b'nin metin ikizi).

### ACIK KALEM — KARNE TABANI (karar bekliyor)
fmKarne getiriyi MFIYAT'a (multiple.json fiyati) gore olcer; multiple.json
§186'dan beri HER GUN tazelenir. Kart metni "uretim tarihinden bugune" der
ama mekanik fiilen "son kapanistan bugune"yi olcuyor — otomasyon gunlage
gecince metin sessizce bayatlamisti. Bugun model yenilendigi icin ikisi
GECICI hizali; kalici cozum fm-isle.py'nin uretim gunu fiyat anlik
goruntusunu fm.json'a gommesi ve karnenin o tabani kullanmasi (mekanik
degisiklik — kullanici karariyla, ayri tur).

## §398 RISK BUTCESI: YAPISAL TUTARSIZLIK ile GERCEK SURUKLENME AYRILDI (24 Agu)

KOK NEDEN: "BUTCE IHLALI · 8" kutusundaki ihlallerin bir kismi portfoyun
degil TAVANIN hatasiydi. 8 pozisyon + %0,8 nakitle tek isim agirliginin
matematiksel TABANI (100−nakit)/N = %12,4 — %9 tavan HICBIR portfoyle
saglanamaz; kutu yapisal olarak hep dolu kalir ve gercek suruklenme alarmi
degersizlesir (§300: nobetci her hickirikta bagirirsa kimse dinlemez).
Risk payinin tabani 100/N = %12,5 (ERC siniri) — %15 tavan TUTARLI, yani
CWENE %30 ve TUPRS %20 risk payi GERCEK konsantrasyon.
§398a AGIRLIK TAVANI TUM POZISYONLARA BAKAR: eski dongu yalniz risk.json
kapsamindaydi; kapsam disi isim %30 olsa ihlal uretmiyordu (§179.3 sinifi).
Dongu `hisseler`e alindi; x.wT tablo kullanimi yerinde.
§398b TUTARLILIK DENETIMI: tabanW ve tabanC her hesapta olculur; tavan
tabanin altindaysa SARI "BUTCE TUTARSIZ" kutusu ihlal kutusunun USTUNDE
cikar ve cozumu soyler. Kirmizi degil: kaybi olmayan arizada is kirmizi
yakilmaz. Birim test: tabanW %12,4 -> 9 TUTARSIZ · tabanC %12,5 -> 15 TUTARLI.
DERS: IHLAL SAYISI TEK BASINA SINYAL DEGILDIR — once tavanin kendisinin
saglanabilirligi olculur. Limit ihlali bazen kalibrasyon hatasidir.

# ===========================================================================
# DAMGA CIZELGESINE EKLENECEKLER (KTPANEL-DAMGA.md)
# ===========================================================================
## GUNCELLENEN SATIRLAR
- Faktor modeli (fm.json): 14T -> 24 Agu ✓ (215 hisse · Koyfin CSV ·
  fm-isle.py). t6 damgasi ARTIK meta.tarih'ten CANLI — elle guncelleme yok.
  Siradaki buyuk is: ~1 Eyl KAP gecisi (faktor-evren kapsam 150-200 + sablon sinavi).
## ALTIN KURALLARA EKLER
- TAVAN KOYMADAN ONCE TABANI OLC: agirlik tabani (100−nakit)/N, risk payi 100/N.
- DOSYAYI TAZELERKEN TARIHINI GOSTEREN METINLERI de ayni kaynaga bagla (§399).
## SURUM IZI (panel)
20260824a (§398a+b risk butcesi) -> 20260824b (§399 fm tazeleme + canli damga).
