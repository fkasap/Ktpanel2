# BAKIM EK — §398-§401 (24 Agu 2026)
# Onceki 398-400 dosyasinin YERINE gecer (kumulatif). KTPANEL-BAKIM.md'ye
# en yeni ustte; DAMGA bolumu KTPANEL-DAMGA.md'ye.

## §401 ABD GEC-SEZON TURU: WMT + HD + CSCO KARTLARI (24 Agu)

TARAMA: AV EARNINGS + web teyidi ile izleme evreni tarandi; Temmuz sonundaki
7 mega-cap turundan sonra uc yeni bilanco kartsiz birikmisti.
KARTLAR (inceleme-ai.json basina, _kural sirasiyla — en yeni ustte):
  - WMT FY27 2C (20 Agu) — KARISIK: duz. EPS 0,81 vs 0,73 (+%11, AV) ve
    rehberlik YUKSELTILDI; ama faaliyet buyumesinin 750 bps'i TARIFE IADESI,
    GAAP net kar −%9,4, ABD LFL +2,6 beklenti alti — hisse −%9.
    "Beat'in kalitesi" analizi MSFT kartinin ayna hali olarak yazildi.
  - HD FY26 2C (18 Agu) — POZITIF: EPS 4,92 vs 4,71 (+%4,5, AV); onceki dort
    ceyregin ucu eksi surprizdi, SERI KIRILDI. 13/16 kategori pozitif ama
    talep KUCUK projelerde — konut-faiz kanali baglantisi teze islendi.
  - CSCO FY26 4C (12 Agu) — POZITIF: siparis super dongusu (+%35 toplam,
    networking +%40 · 8. ardisik cift hane), AI siparisi FY26 9,3 mlr$
    (4,5x) -> FY27 ~7,5 mlr$ AI geliri hedefi; rekora ragmen marj
    endisesiyle satis. 26 Agu NVDA raporuyla zincir bagi kuruldu.
KURALLARA UYUM: zorunlu 6'li metrik seti ucunde de tam; kaynakta olmayan/
derlenmeyen kalem "aciklanmadi/derlenmedi" yazildi, TAHMIN EDILMEDI.
Skor sozlugu MEVCUT ETIKETLERLE: KARISIK (AMZN emsali) — ilk yazimda NOTR
kullanilmisti, sozluk denetimi yakaladi.
DERS-1: SKOR/ETIKET SOZLUGU DOSYANIN KENDISINDEN OKUNUR — yeni etiket
uydurulmaz (enum sanilan serbest metin §245'in tersi: burasi GERCEK enum).
DERS-2: AYNI ISIMLI IKI LISTE AYNI LISTE DEGILDIR — ikinci "ABD" seti
DISLAMA setiydi (birlesik takvimin BIST bacagi icin, 4-5 harf regex'li);
WMT 3 harf oldugundan oraya eklenmedi. Toplu degistir yerine kuyruk sayimi
(count==1) yanlis seti degistirmeyi ONLEDI.
AV NOTU (§184 dogrulamasi): WMT 20 Agu'da "reportedEPS: None" idi (§353
acik kalemi), 24 Agu'da islenmis — "aciklama gunu ve ertesi gun AV'ye
guvenilmez" kurali bir kez daha olculdu. CSCO icin AV cekilmedi (kota);
capraz denetim acik kalem.
WATCHLIST: WMT birinci ABD setine eklendi (takvimde 'aciklandi' gorunur).

## §400 FM DISLAMA LISTESI (24 Agu) — [onceki blokla ayni]
Kullanici vetosu: x ile secim-oncesi eleme, yedek ustten girer; fm_disla_v1
CLOUD_KEYS'te; karne ve resmi sicil veto DISI. Simulasyon: ESCOM/ARASE/PAGYO
cikinca EGPRO/ONCSM/RGYAS girdi, 25 korundu, sektor tavani tuttu.

## §399 FM.JSON 24 AGU (215 hisse) + CANLI DAMGA — [onceki blokla ayni]
Korelasyon: QUA 0,90 · VAL 0,70 · GRO 0,73 · LOW 0,68 · MOM 0,27 (beklenen).
ACIK KALEM: fmKarne tabani MFIYAT gunluk — donmus taban karari bekliyor.

## §398 RISK BUTCESI TABAN/TAVAN AYRIMI — [onceki blokla ayni]
tabanW %12,4 -> %9 YAPISAL tutarsiz · tabanC %12,5 -> %15 TUTARLI.

# ===========================================================================
# DAMGA CIZELGESINE EKLENECEKLER (KTPANEL-DAMGA.md)
# ===========================================================================
## GUNCELLENEN SATIRLAR
- Earnings AI @t14: 24A ✓ — WMT/HD/CSCO eklendi (55 kart). SIRADAKI:
  NVDA 26 Agu CARSAMBA kapanis sonrasi (2C FY27, rehberlik ~91 mlr$ ±2,
  konsensus 93-95) — haftanin makas olayi; CRM ayni hafta.
- CSCO karti: AV capraz denetimi ACIK (birkac gun icinde, §184).
## ALTIN KURALLARA EKLER
- ETIKET SOZLUGU DOSYADAN OKUNUR — yeni skor etiketi uydurulmaz.
- AYNI ISIMLI IKI LISTE AYNI LISTE DEGILDIR — degistirmeden once kuyrugu say.
## SURUM IZI (panel)
20260824a (§398) -> b (§399) -> c (§400) -> d (§401 WMT izleme + kartlar).
