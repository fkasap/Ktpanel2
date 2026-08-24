# BAKIM EK — §403-§409 (24 Agu 2026, aksam)
# Repodaki BAKIM-EK-398.md / 398-399 / 398-400 / 398-401 dosyalarinin
# DORDU DE SILINIR — icerikleri yeniden numaralanarak buraya tasindi.
# KTPANEL-BAKIM.md'ye en yeni ustte; DAMGA bolumu KTPANEL-DAMGA.md'ye.

## §407 CATAL OLAYI: IKI SOHBET, IKI SOY — BIRLESTIRME (24 Agu aksam)

NE OLDU: Ayni gun iki ayri Claude sohbeti ayni 20260823d tabanindan calisti.
Sabah sohbeti 20260824a→d hattini uretti (risk butcesi, fm tazeleme+damga,
dislama, ABD kartlari); ogleden sonra sohbeti ayni tabandan 20260823e→g
hattini uretti (EDGAR, fiyat sunucudan, TEFAS dogrudan v1). SON YUKLEYEN
KAZANDI: g-hatti deploy oldu, sabahin KOD isleri ezildi (veri dosyalari
kurtuldu — fm.json 215, WMT/HD/CSCO kartlari, cunku veri yollari kesismedi).
NASIL YAKALANDI: SURUM DAMGASI — canli rozette 20260823g gorulur gorulmez
catal belliydi; sistem tam tasarlandigi isi yapti. Ikinci belirti: bugunun
isine dunun tarihi (23g) — damga tarihi kuralinin ihlali de catalin izi.
YAN HASAR: BOLUM NUMARASI CAKISMASI — iki sohbet de §398-401 bandini
kullandi (EDGAR §398 ≠ risk butcesi §398). Cozum: g-hatti kodda/deployda
oldugu icin SABIT kaldi; sabah isleri §403-406 olarak YENIDEN NUMARALANDI
ve g-tabaninin ustune yeniden uygulandi (capalar tek tek dogrulanarak).
DERS-1: IKI SOHBET AYNI TABANDAN CALISMAZ — ise baslarken repo cekilir,
canli rozet ile calisilan tabanin damgasi KARSILASTIRILIR.
DERS-2: BOLUM NUMARASI DAGITIMI TEK KAYNAKTAN — yeni kayit acmadan once
repodaki EN YUKSEK numara olculur (kod + EK dosyalari taranir).
DERS-3: VERI/KOD AYRIMI catalda dogal siper — veri dosyalari kod catalindan
etkilenmedi; tek sahipli dosya duzeni burada da is gordu.

## §403 RISK BUTCESI: TABAN/TAVAN AYRIMI (eski §398 — yeniden uygulandi)
a) AGIRLIK TAVANI TUM POZISYONLARA — kapsam disi dahil (§179.3 sinifi kapandi).
b) TUTARLILIK DENETIMI: tabanW=(100−nakit%)/N · tabanC=100/N; tavan tabanin
   altindaysa SARI "BUTCE TUTARSIZ" kutusu ihlalin USTUNDE, cozum cumlesiyle.
   8 pozisyon + %0,8 nakit: tabanW %12,4 → %9 tavan YAPISAL tutarsiz;
   tabanC %12,5 → %15 TUTARLI (CWENE %30 / TUPRS %20 GERCEK suruklenmedir).
DERS: IHLAL SAYISI TEK BASINA SINYAL DEGIL — once tavanin saglanabilirligi olculur.

## §404 FM CANLI DAMGA (eski §399b — yeniden uygulandi)
t6'daki bes "14 Tem" metni span'a alindi; fmInit fm.json meta.tarih'ten basar
(Turkce kisa ay). meta.tarih yoksa metin DURUR. Bu yama olmadan canli panel
24 Agu verisini "14 Tem" etiketiyle gosteriyordu — catalin gorunur zarari.
ACIK KALEM (tasindi): fmKarne tabani MFIYAT (gunluk) — donmus taban karari.

## §405 FM DISLAMA LISTESI (eski §400 — yeniden uygulandi)
x → secim ONCESI eleme, yedek ustten girer; cip cubugu + geri al;
fm_disla_v1 CLOUD_KEYS'te. KARNE ve resmi sicil veto DISI (bilincli).
Simulasyon (215'lik evrende): ESCOM/ARASE/PAGYO → EGPRO/ONCSM/RGYAS girdi,
25 korundu, sektor tavani 6≤6.

## §406 WMT IZLEME SETINE (eski §401 watchlist kismi — yeniden uygulandi)
Birinci ABD setine eklendi; ikinci ayni-isimli set DISLAMA setidir (4-5 harf
regex) — WMT 3 harf, oraya gerekmez. DERS: AYNI ISIMLI IKI LISTE AYNI LISTE
DEGILDIR. (WMT/HD/CSCO kartlari §401-kartlar olarak inceleme-ai'da yasiyor,
yeniden uygulama GEREKMEDI — veri dosyasi catalda kurtulmustu.)

## §407b KOK YETIM KOPYA BEKCISI (denetim.mjs)
ktpanel/ KOKUNDE yetim edgar.js bulundu (api'nin eski -a kopyasi, referans 0,
bir kez silinip yukleme setiyle geri gelmis). api/ bekcisi koku gormuyordu.
Kok kod dosyalari icin beyaz liste (app/ajan/mail/middleware) — UYARI
seviyesi, is kirmizi yanmaz. YAPILACAK: GitHub'dan ktpanel/edgar.js SIL.

## §408 TEFAS DOGRUDAN CEKIM v2 (HAR olcumuyle)
TESHIS (kullanici HAR'i): TEFAS erisim mimarisi degisti —
  1) Authorization: Bearer ST-tefasweb... ZORUNLU ve jeton sitenin KENDI
     on-yuz paketinde (common-*.js chunk) HERKESE AYNI statik degerle gomulu
     → kullanmak oturum taklidi DEGIL, istemci sozlesmesi. Build'de
     degisebilir → koda GOMULMEZ, her kosuda chunk'tan CANLI sokulur.
  2) Getiri ucu yenilendi: api/funds/fonGetiriBazliBilgiGetir (1058 fon,
     1A/3A/6A/1Y/YB/3Y/5Y). Eski fonGnlBlgSiraliGetir cagrisi bayatti.
  3) Bot-koruma cerez ailesi (wid/zid/xid) JS meydan okumasiyla — sunucudan
     taklit EDILMEZ. Iki ariza imzasi tutarli: Vercel'e BAGLANTI duzeyi blok
     ("fetch failed"), runner'a UYGULAMA duzeyi ret ("Request Rejected").
ZINCIR (tazele fon katmani): kopru → dogrudan v2 (canli jeton) → §409 HAR →
hicbiri yoksa katman YAZILMAZ ve nedeni raporlanir. Etik cizgi §401'dekiyle
AYNI: sayfa/chunk bile reddedilirse ORADA DURULUR; cerez taklidi yok.
UYGULAMA NOTU: ilk yazim turunda readFileSync varsayimi assert'e takildi —
tazele fs/promises + oku() deseni kullaniyor; yama MEVCUT desene uyarlandi.
DERS: YAMAYI DOSYANIN KENDI DESENINE YAZ — kendi aliskanligina degil.

## §409 HAR ICE-AKTARMA ARACI (mesru elle istisna — swap stoku emsali)
arac/tefas-har-isle.mjs: kullanicinin kendi tarayicisindan aldigi HAR'i
tefas-har-veri.json'a cevirir (yalniz YANIT GOVDELERI — cerez/jeton yeniden
KULLANILMAZ). tazele yalniz AYNI GUN tazeyse okur; bayat HAR sessiz
kullanilmaz, raporda soylenir (§301 ruhu). ILK URETIM bugunku HAR'la yapildi:
2026-08-24 · 1058 getiri + 1048 kurucu kaydi — aksam kosusu bu veriyle donebilir.
30 saniyelik ritüel: fon-getirileri sayfasi → DevTools → Export HAR → arac.

# ===========================================================================
# DAMGA CIZELGESINE EKLENECEKLER (KTPANEL-DAMGA.md)
# ===========================================================================
## GUNCELLENEN SATIRLAR
- TEFAS getiri: kopru OLU (Vercel IP blok) · dogrudan v2 + HAR zinciri (§408/409).
  Fon AKISI (AUM/pay) ucu HENUZ v2'de YOK — siradaki HAR fon buyukluk
  sayfasindan alinirsa eslenir (ACIK KALEM).
- Faktor modeli t6: dislama listesi CANLI (bulut) · damga meta.tarih'ten.
- Yetim kok edgar.js: GitHub'dan SILINECEK (bekci artik uyarir).
## ALTIN KURALLARA EKLER
- ISE BASLARKEN TABAN DAMGASI OLCULUR — iki sohbet ayni tabandan calismaz.
- BOLUM NUMARASI: once repodaki EN YUKSEK numarayi olc, sonra ac.
- YAMAYI DOSYANIN KENDI DESENINE YAZ.
## SURUM IZI (panel)
20260823g (catal ucu) -> 20260824e (§407 birlestirme: 403+404+405+406 g ustune).
