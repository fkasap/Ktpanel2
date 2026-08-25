# BAKIM EK — §415 (25 Agu 2026 · panel taramasi bulgulari)
# Degisen: ktpanel/app.js · ktpanel/index.html · ktpanel/guncelleme-plani.json
# Surum: 20260824e → 20260825a

## §415 CEKMECE IC ICE SEMAYI OKUMUYORDU: TAZE VERI, BAYAT ETIKET

OLCUM (canli panel taramasi, 25 Agu): Veri Durumu cekmecesi
"Faktor modeli — 14 Tem · GUNCELLE" gosteriyordu. Ama fm.json 24 Agu'da
215 hisseye TAZELENMISTI ve t6 basligi (§404) dogru sekilde "24 Agu 2026"
yaziyordu. Yani ayni gercek icin panelde IKI FARKLI TARIH vardi.

KOK NEDEN: dosyaTarihleri() yalniz KOK alanlara bakiyordu —
  j.guncelleme || j.tarih || j.fiyat_tarihi
fm.json ise tarihini META icinde tutar: j.meta.tarih. Kokte bulamayinca
fonksiyon o dosyayi ATLIYOR ve cekmece guncelleme-plani.json'daki ELLE
yazilmis "son": "2026-07-14" degerine dusuyordu. Plan kaydi da fm tazelenince
guncellenmemisti → iki katmanli bayatlik.

COZUM (iki yonlu, cunku tek yon yetmez):
  a) dosyaTarihleri artik meta.tarih / meta.guncelleme'yi de okur. Boylece
     BUNDAN SONRA fm.json her tazelendiginde cekmece KENDILIGINDEN doner —
     plan kaydina bagimli degil (§399'un cekmece ikizi: tarihi gosteren
     her yer AYNI kaynaktan beslenmeli).
  b) guncelleme-plani.json'daki fm.json kaydi 2026-07-14 → 2026-08-24
     hizalandi (gecmis bayatligin temizligi).
Cekmece zaten "·dosya" mini etiketiyle tarihin dosyadan mi plandan mi
geldigini soyluyordu (§245p) — fm satirinda o etiket YOKTU, ipucu oradaydi.

DERS: BIR OKUYUCU SADECE BILDIGI SEMAYI OKUR — yeni bir dosya ic ice sema
kullaniyorsa okuyucu SESSIZCE atlar ve yedege duser. Yedek de elle tutuluyorsa
bayatlik iki kat gizlenir. Sema degistiginde OKUYUCULARI DA GEZ.

## TARAMA RAPORU (25 Agu, canli panel · 20260824e)
SAGLIKLI:
  - konsol hatasi 0 · bos kart 0 · asili "Yukleniyor" 0 · div dengesi 950/950
  - §403 sari kutu CANLI: "8 pozisyon + %0,0 nakitle taban %12,5 — %8 tavani
    hicbir portfoyle saglanamaz, en az 13 isim" (kalibrasyon karari kullanicida)
  - §404 damga CANLI: t6 acilinca bes metin birden "24 Agu"ya dondu
  - §405 dislama listesi CANLI: 25 satirda x dugmesi + cip cubugu
  - faktor evreni 215/215 siralandi
VERI TAZELIGI (0g = bugun): katfon 0g · fon-akis 0g · risk 0g · multiple 0g ·
  faktor-evren 0g · gyo-nav 0g · track 0g · endeks-arsiv 0g · fm 1g ·
  inceleme-ai 1g
YANLIS ALARM DUZELTMESI: ilk taramada kap-arsiv/sukuk/vap-fon "404" gorundu —
  SEBEP benim dosya adi TAHMINIM yanlisti (gercekler: sukuk-ihrac.json,
  vap-fon-akis.json, KAP arsivi ayri klasor). Panelde sorun YOK.
  DERS: 404 gormek "dosya yok" demek degil, "aradigin ad yanlis" da olabilir —
  once repodaki gercek adi olc.

## ACIK — VERI TAZELEME (Fintables gerektiriyor, bu oturumda cekilemedi)
  - Guidance (guidance.json · 20 sirket): 17 Tem, 39 GUN — en eski kalem.
    2C sezonu bitti, rehberlikler revize edilmis olmali. Kaynak: Fintables
    guidance. NOT: Fintables MCP bu oturumda BAGLI DEGILDI (arac listesinde
    yok) — cekilemedi, kullaniciya birakildi.
  - Analist konsensusu (analist.json · 55 hisse): 10 Agu, 15 gun,
    "vade yaklasti". Kaynak: Fintables araci kurum hedef fiyatlari,
    son 6 ay ortalamasi. Bilanco sezonu sonrasi hedefler revize edilir.
  - Swap stoku (rezerv.json): 10 Agu — Persembe TCMB yayini sonrasi ritüel
    (§245p: bu katman dogasi geregi 6-13 gun salinir, panik yok).

# ===========================================================================
# DAMGA CIZELGESINE
# ===========================================================================
## ALTIN KURALLARA EKLER
- SEMA DEGISTIGINDE OKUYUCULARI DA GEZ — ic ice alan kullanan dosya, kok
  alana bakan okuyucu tarafindan SESSIZCE atlanir.
- 404 = "ad yanlis" olabilir; once repodaki gercek dosya adini olc.
## SURUM IZI (panel)
20260824e (§407 catal birlestirme) -> 20260825a (§415 cekmece ic ice sema).
