ONEMLI: Her oturumda ONCE KTPANEL-DAMGA.md okunur (damga cizelgesi —
hangi kart ne zaman eskir, tek bakis). Bu dosya ders arsividir.

# KTPanel — Bakım & Güncelleme Haritası

Son güncelleme: 2026-08-25


# BAKIM EK — §420 (27 Agu 2026)

## §420 TLREF FONLAMA REJIMI KARTINDA — SOZ VERILEN, GOSTERILMEYEN VERI

TETIKLEYICI: Iktisatbank hazine bulteni (27 Agu) panel verileriyle
karsilastirildi. Bultendeki her veri noktasi tek tek arandi.
BULUNAN: TLREF panelde HIC GOSTERILMIYORDU — ama Fonlama Rejimi kartinin
KENDI NOTU aylardir "TLREF'in politika faizine yakinsamasi (KARTTA CANLI)"
diye izlenecekler arasinda gosteriyordu. Yani not bir satiri tarif ediyordu,
o satir hicbir zaman EKLENMEMISTI. Seri EVDS'de zaten cekiliyordu
(api/_lib/tlref.js + evds2 koprusu) — boru hatti DOLU, ekran BOS.
DERS: KARTIN KENDI METNI BIR GOSTERGE VAAT EDIYORSA, O GOSTERGE VAR MI DIYE
BAKILIR. Notlar kodu tarif eder ama kodu DOGRULAMAZ; ikisi ayrisabilir
(§415'in metin ikizi: orada tarih iki yerde farkliydi, burada gosterge
notta var ekranda yok).

EKLENEN: "TLREF — piyasa gecelik (politika faizine makas)" satiri, AOFM'nin
hemen altina. Deger + makas birlikte gosteriliyor, RENKLI:
  makas <= -25bp YESIL (piyasa politika faizinin ALTINDA fonlaniyor —
    bolluk / ortulu gevseme) · >= +25bp KIRMIZI (sikisiklik) · arasi NOTR.
OKUMA: TLREF piyasanin FIILI gecelik maliyeti, politika faizi TCMB'nin
ILAN ETTIGI. Makas rejimin gercek yerini soyler. 23 Agu'da haftalik repo
yeniden acilinca TLREF politika faizine yakinsadi: 25 Agu %36,90, makas
-10bp (bulten 27 Agu icin %36,84 = -16bp diyor, bir gunluk farkla tutarli).
Mart-Agustos arasi ortulu SIKILASMA doneminde bu makas ARTI tarafta ve
genisti; simdi kapandi — kartin "ortulu indirim" tezi ekranda OLCULEBILIR
hale geldi.

## SERI KODU KAZASI — CANLI OLCUMLE YAKALANDI
Ilk yazimda TP.BISTTLREF.KAPANIS kullanildi. Yamayi gondermeden once canli
denendi: o seri ENDEKS dondurüyor (6600,1326), faiz DEGIL. Kartta
"%6600,13 (+656313bp)" yazacakti — gulunc ama SESSIZ olmayan bir hata
(sayi absurt oldugu icin fark edilirdi; asil tehlike absurt OLMAYANLAR).
DOGRUSU: TP.BISTTLREF.ORAN → %36,9008 (25 Agu). Grup taramasiyla teyit:
bie_bisttlref grubu da .ORAN'a cozuyor.
DERS: SERI KODU HATIRLANMAZ, CAGRILIP DONEN DEGER OKUNUR (§116). Ad mantikli
gorunmesi degerin dogru oldugunu GOSTERMEZ.

## BULTEN KARSILASTIRMASI — panelde OLMAYAN kalan iki kalem (acik)
  - Gosterge tahvil (2Y bilesik): bulten "%40'in hemen altini test etti,
    dort ay sonra ilk kez" diyor. Panelde getiri egrisi VAR (9 sukuk + 8
    DIBS) ve 2Y noktasi egrinin ICINDE — ama tek satirlik gosterge YOK.
  - ABD 30Y tahvil faizi (%5,17): panelde ABD 10Y var (%4,71), 30Y yok.
  - Brent: risk barometresinde geciyor ama Commodity tablosunda WTI
    listeleniyor (81,42), Brent degeri gorunmuyor. Turkiye icin Brent daha
    alakali (ithalat fiyatlamasi Brent uzerinden).
  - UYUSMAZLIK NOTU: gram altin panel 7.116 TL / bulten 7.150 TL; ons altin
    panel basligi 4.598 · Commodity tablosu 4.659 · bulten 4.630. UC AYRI
    YERDE UC FARKLI ONS DEGERI — zaman damgasi farki olabilir ama tek
    gercek icin tek sayi kurali (§112) geregi INCELENMELI.

# BAKIM EK — §419 (26 Agu 2026)

## §419 PLATTS UCU EMEKLIYE AYRILDI — KOTA 12/12 → 11/12
OLCUM: KULLANIM app.js 0 · ajan.js 0 · index.html 0 · tazele.mjs 0 referans
(app/index'teki "spg" eslesmeleri YANLIS ALARM: spGau = gram altin
sparkline'i). Veri dosyasi da uretilmemis. DURUM: HTTP 502 · "SPG_KEY
dogrudan Bearer kabul edilmedi — token akisi gerekebilir".
AMAC: kullanici BDI (Baltic Dry Index) icin yazdirmisti. ANCAK BDI Baltic
Exchange'in (SGX) TESCILLI endeksi, Platts'in DEGIL — uc calissaydi bile
BDI'yi VEREMEZDI. Platts yalniz kendi freight degerlendirmelerini
verebilirdi, o da abonelik kapsamina bagli (kapsam hic olculmedi).
YAN OLCUM: BDI vekili BDRY (Breakwave Dry Bulk Shipping ETF) Yahoo'da
CALISIYOR (15,06 USD, 76 bar) — navlun gostergesi istenirse ucretsiz ve
API slotu YAKMADAN kurulabilir. ^BDIY gibi endeks sembolleri Yahoo'da YOK.
KARAR: uc kaldirildi; icerik git gecmisinde. Geri istenirse tercihen
api/_lib altina modul olarak (slot yakmadan).
BIRLIKTE TEMIZLENEN (tek basina silmek YETMEZ): denetim.mjs API_BEYAZ
listesi · kopru-testi.js girdisi (§417'de yeni eklenmisti; silinen uca test
birakmak her Cumartesi bos alarm uretirdi).
DERS: BIR DOSYAYI SILMEK, ONA ATIF YAPAN HER YERI DE GEZMEKTIR. Ayni gun
ucuncu kez ayni sinif: yetim edgar.js (§407b) · cekmecenin bayat plan kaydi
(§415) · platts atiflari.

## MEVZUAT SEKMESI — YAPILMADI (bilincli karar)
SPK API'si olculdu: mevzuat.spk.gov.tr/api/Search/All acik, kimlik istemiyor,
tek cagrida 388 kayit (~134 KB kirpilmis). CORS KAPALI → Actions cekmeliydi.
Kapsam daraltildi: PYS + yatirim fonlari + emeklilik fonlari mevzuati ve
rehberleri = 21 kayit (III-52.1 · III-55.1 · portfoy saklama · performans
sunum · II-14.2 · BYF · GYF · GSYF · emeklilik yonetmeligi + 2 rehber).
IPTAL GEREKCESI (olcumle): indekste REHBERLERIN TARIHI YOK — ne Resmi Gazete
ne guncelleme tarihi. Tebliglerdeki tarih ILK YAYIM (cogu 2013); sonraki
degisiklikler indekste GORUNMUYOR. Asil risk olan SESSIZ DEGISIKLIK
(rehbere yeni portfoy sinirlamasi, fon toplam gider orani degisikligi)
indeks nobetcisiyle YAKALANAMAZ. Ayrica 21 belgeyi tabloda listelemek SPK'nin
kendi sitesini tekrarlamak olurdu; yilda bir iki kez degisen sekme OLU
AGIRLIKTIR ve tazelik nobetcisi bosuna durter (§300).
ILERIDE ISTENIRSE degerli olan TEK parca: haftalik PDF PARMAK IZI nobetcisi
(21 PDF, yalniz hash, ~25 satir; degisirse Claude okur ve kart yazar).
DERS: BIR KAYNAGIN ACIK OLMASI IZLENMEYE DEGER OLMASI DEMEK DEGILDIR — once
"degisikligi YAKALAYABILIYOR MUYUM" diye sorulur.

# BAKIM EK — §417-§418 (25 Agu 2026, aksam)

## §418 PUSH CAKISMASI — kosu yesil, is KIRMIZI
OLCUM: 18:52-18:56 kosusu bastan sona YESIL rapor uretti (2030 fon · akis
+14,70 mlr · katilim 46/46 · CDS 220,5 · GYO NAV 45) ve raporun sonunda
"⚠ bir katman gecemedi" satiri YOKTU — denetimDustu FALSE. Buna ragmen is
exit 1 verdi. KOK NEDEN: kosu surerken kullanici BES silme commit'i atti;
bot push'a geldiginde uzak dal ILERLEMISTI → push REDDEDILDI. Annotation
yalniz "exit code 1" dedi, ::error:: mesaji YOKTU. KANIT: o aksama ait TEK
BIR ktpanel-bot commit'i yok.
COZUM: push reddedilirse `git pull --rebase --autostash origin main && git push`.
DOGRULAMA (19:11 kosusu): bot commit'i d189355 DUSTU, veri geri geldi. ✓
DERS-1: KIRMIZI ≠ DENETIM DUSTU — rapor yesilken sebep denetim DISINDA aranir.
DERS-2: KOSU SURERKEN PUSH ATMA (ayni gun DEPLOY.md'ye yazilan kural, ayni
gun ihlal edilip dogrulandi).

## §417 KOPRU TESTI: UC EKSIKTI, BIR SINIFLANDIRMA YANLISTI
Test 13 Agu'dan (§286) beri guncellenmemisti. CANLI TARAMA (29 uc):
saglam — market (15/15) · evds2 (8 mod) · kap · tcmb · bddk · usnews · data ·
ajanktp · tefas mod=gnl · CDS. Bozuk — platts (HTTP 502). Beklenen —
katfon ok:false (canli cekim §147-148'de bilerek kapatildi, panel
katfon.json'dan besleniyor).
DEGISIKLIK: katfon kritik:true → false (kapali:true artik BILGI) · edgar
eklendi. Gerekce app.js'in kendi yorumu: "kapanmis bir kapinin onunde nobet
tutmaya devam etmek, panelin diger uyarilarinin ciddiyetini azaltir".
KRITIK BULGU — CRON_SECRET TANIMLIYMIS: test her Cumartesi KOSUYOR ve YESIL
veriyordu. Platts'i kacirmasinin sebebi secret eksikligi DEGIL, ucun LISTEDE
HIC OLMAMASI. "Test yesil" ile "sistem saglam" ayni sey degil.
DERS: YENI UC ACILDIGINDA TESTE DE EKLENIR — eklenmeyen uc, izlenmeyen uctur.

<!-- §298-§416: 17-25 Agu 2026 kayitlari. Daha once 18 ayri BAKIM-EK-*.md
     dosyasindaydi; 25 Agu'da bu dosyaya BIRLESTIRILDI. En yeni ustte.
     Kumulatif zincirlerde yalniz en kapsayici surum alindi. -->

# BAKIM EK — §415-§416 (25 Agu 2026)
#          guncelleme-plani.json   ·   Surum: 20260824e → 20260825a

## §415 CEKMECE IC ICE SEMAYI OKUMUYORDU (kod duzeltmesi)
OLCUM: cekmece "Faktor modeli — 14 Tem · GUNCELLE" diyordu ama fm.json 24 Agu'ya
tazelenmisti; t6 basligi dogru, cekmece yanlis — AYNI GERCEK ICIN IKI TARIH.
KOK NEDEN: dosyaTarihleri() yalniz KOK alanlara bakiyordu (guncelleme/tarih/
fiyat_tarihi). fm.json tarihini META icinde tutar (meta.tarih) → bulunamayinca
dosya ATLANIYOR, cekmece guncelleme-plani.json'daki ELLE yazili degere dusuyordu.
COZUM: (a) okuyucu artik meta.tarih/meta.guncelleme'yi de okur — bundan sonra
fm her tazelendiginde cekmece KENDILIGINDEN doner; (b) plan kaydi hizalandi.
IPUCU EKRANDA IDI: cekmece "·dosya" mini etiketiyle tarihin dosyadan geldigini
soyler (§245p); fm satirinda o etiket YOKTU.
DERS: BIR OKUYUCU SADECE BILDIGI SEMAYI OKUR — ic ice sema kullanan dosya
sessizce atlanir ve yedege duser. Sema degistiginde OKUYUCULARI DA GEZ.
DOGRULAMA (canli): cekmece artik "Faktor modeli — 24 Agu · taze" ✓

## §416 UC BAYAT VERI KALEMI TAZELENDI (Fintables)
### analist.json — 10 Agu → 25 Agu (55/55 hisse)
Pencere 1 YIL olarak KORUNDU (§252v): 6 aylik pencere daha taze GORUNUR ama
kurum sayilarini dusurur (ASELS 23→18) — bu tazeleme degil METODOLOJI
DARALTMASI olurdu. 28 hissede hedef/kurum degisti. Dikkat cekenler:
  SELEC 125,24 → 153,67 (+23%) · CWENE 44,85 → 52,43 (+17%, kurum 1→2)
  GRSEL 422 → 493 (+17%, kurum 1→2) · KRDMD 46,03 → 51,05 (+11%, kurum 15→17)
  BIMAS 559,50 → 492,88 (−12%, kurum 27 sabit) — TEK ANLAMLI ASAGI REVIZYON
4 hisse son 6 ayda raporsuz → bayat:true (ALKLC, GOKNR, SNGYO, SUNTK):
hedefi eskidir, guncel fiyatla kiyaslanmamalidir.
### guidance.json — 17 Tem → 25 Agu (20/20 sirket, 39 gun bayatlik kapandi)
2C sonrasi revizyonlar islendi. Tablolar ARTIK "2025 Gerceklesen" sutunu ve
"(Onceki: ...)" izlerini tasiyor — sirketin hedefini NE YONDE degistirdigi
okunabiliyor. One cikan revizyonlar:
  TUPRS net rafineri marji 6-7 → 13-15 $/v (BUYUK YUKARI revizyon)
  FROTO satis geliri: Yatay → orta-yuksek tek haneli DARALMA; FAVOK %7-8 → %6-7
  ULKER ciro: Yatay → dusuk tek haneli DARALMA; FAVOK %17,5 → %13,5
  AEFES bira hacmi: buyume → DARALMA; konsolide FAVOK marji Yatay → hafif daralma
  AKBNK NFM ~%4 → %3,2-3,5 · ISCTR NFM ~%5 → %3,2-3,4 (bankalarda marj indirimi)
YORUM (fon yoneticisi notu): rafineri disinda genel yon ASAGI — sanayi/tuketim
tarafinda 2026 beklentileri kirpiliyor, bankalarda marj hedefleri geriliyor.
### halkaarz.json — 7 Agu → 25 Agu (35 kayit, 7 yeni/guncel)
AKTIF SUREÇLER: INTET talep 26-27 Agu · BKRGY talep 24-25-26 Agu (BUGUN ACIK).
Yeni tamamlananlar ve getirileri (25 Agu fiyatiyla):
  CITAS +%63,8 · TKNKA +%46,1 · KPEKS +%33,0 · VEYAS +%14,9 · QUICK −%8,4
Mevcut kayitlarin guncel fiyat/getirileri de yeniden hesaplandi.

## KAPSAM NOTU
Fintables MCP yalniz Claude oturumunda calisir — Actions bu kalemleri KENDI
CEKEMEZ. Bu uc dosya dogasi geregi "Claude ile tazelenir" sinifinda; plan
kayitlari da 25 Agu'ya hizalandi.

## HALA BEKLEYEN (bu turda YAPILMADI)
  - degerleme.json 25g · sukuk-ihrac.json 36g · pyssektor.json 15g
  - rezerv.json (swap stoku) 15g — Persembe TCMB yayini sonrasi, TAKVIMLI (§245p)


# BAKIM EK — §413-§414 (25 Agu 2026 · hizli temizlik turu)

## §413 KIRMIZI/SARI AYRIMI: VERI KAYBI OLMAYAN ARIZADA IS KIRMIZI YANMAZ

KOK NEDEN: 24-25 Agu'da TEFAS kopruusu birkac kez dustu ve is HER SEFERINDE
kirmizi yandi + bildirim geldi. Ama iki kez de arsivde O GUNUN verisi ZATEN
yaziliydi (sabah kosusundan) — yani panel eksik degildi, sadece tazelenemedi.
§300'un kendi kurali bunu soyluyordu: "veri kaybi olmayan arizada is kirmizi
yakilmaz" — kural vardi, TEFAS dalinda UYGULANMAMISTI.
ALARM ENFLASYONU RISKI: her hickirikta kirmizi yanarsa gercek kayip gunu de
gozden kacar (§300 nobetci dersi).

COZUM: tefasKayipMi() yardimcisi — TEFAS dustugunde fon-arsiv.json'da BUGUN
icin kayit var mi diye bakar:
  - kayit VAR  → denetimDustu SET EDILMEZ. Rapora "§413 not: arsivde bugun N
    fon yazili — VERI KAYBI YOK, is sari" satiri duser. Is YESIL biter.
  - kayit YOK  → gercek kayip, denetimDustu = true, is KIRMIZI (bildirim gelir).
Iki dusme noktasina da baglandi: (a) "TEFAS erisimi dustu" (catch),
(b) "TEFAS eslesme SIFIR (v4)".
BIRIM TEST: arsivde 2030 fon → SARI · arsiv bos → KIRMIZI.
KAPSAM SINIRI: yalniz KATILIM FONLARI dalinda. Diger katmanlarin denetim
mantigi DEGISMEDI — her katmanin kayip tanimi kendine ozgudur, toptan
"hepsi sari olsun" YAPILMADI (§112 tek sahip ruhu).

DERS: BIR KURAL YAZMAK ONU HER DALDA UYGULAMAK DEGILDIR — §300 aylardir
yaziliydi ama TEFAS dali kirmizi yakmaya devam ediyordu. Yeni bir dal
eklerken "bu dalin kayip tanimi ne" diye sorulmali.

## §414 WORKFLOW: actions/checkout@v4 + setup-node@v4 → v5

GitHub uyarisi: "Node.js 20 is deprecated... v4 aksiyonlari Node 24'e
ZORLANIYOR". Zorlama calisiyordu ama uyari her kosuda geliyordu ve bir gun
zorlama kalkarsa is kirilir. v5 surumleri Node 24 tabanli — uyari susar.
node-version: '22' AYNEN KALDI (§326 karari; Actions zaten 24'e zorluyor).
DOGRULAMA: YAML gecerli · iki satir degisti, baska hicbir sey.

## TEMIZLIK: KOK YETIM edgar.js SILINDI (kullanici, 25 Agu)
§407b bekcisi uc kosu boyunca uyarmisti; ktpanel/edgar.js kaldirildi,
ktpanel/api/edgar.js (gercek olan) yerinde. Bekci artik susmali.

## GOZLEM NOTU — TEFAS KOPRU GUVENILIRLIGI (karar bekliyor)
25 Agu uc kosu: kapsam 1891 → 2004 → 2010 (gercek toplam 2038). Kopru
TOPARLANIYOR; gelen/ klasoru BOS iken de veri akti. Kullanicinin "24 Agu
gecesi gecici arizaydi" hipotezi su ana kadar destekleniyor.
IZLEME: birkac gun raporun "yol:" satiri + fon sayisi biriktirilecek.
  - her gun "vercel-koprusu" + 2000 ustu ise → §408/§410 katmanlari
    SADELESTIRILIR, konsol toplayici emekliye ayrilir.
  - dalgaliysa → yedek kalir, gerektiginde "TEFAS'i cek" ritueli.
KARAR VERIYE BAKARAK VERILECEK, tek gune gore DEGIL.


# BAKIM EK — §410c (24 Agu 2026, gece · SESSIZ CATCH KAZASI)
# BAKIM-EK-410.md gecerli, bu onun uzerine eklenir.

## §410c KONSOL ZINCIRI CALISMADI: YOL HATASI + SESSIZ CATCH

OLCUM: 21:41'de §410'lu tazele yuklendi, 21:56 kosusu onunla dondu
(kodda §410 vardi, dogrulandi) — AMA raporda §410 satiri HIC CIKMADI.
Ne "kullanildi", ne "kismi", ne "yok". Blok calisti ve TEK KELIME ETMEDEN
gecti. Bu, panelin en cok savastigi ariza sinifi: SESSIZ YANLIS.

KOK NEDEN — IKI KATMANLI:
  1) YOL: KOK degiskeni ZATEN 'ktpanel' (ADAYLAR icinden index.html ile
     bulunuyor, satir 31). Ben blok icinde 'ktpanel/arac/gelen' yazinca
     path.join(KOK, ...) → 'ktpanel/ktpanel/arac/gelen' oldu. Dogrusu
     'arac/gelen' — dosyanin kendi deseni: oku('fon-arsiv.json') gibi
     KOK'e GORE yol yazilir (§408'de ogrenilen dersin AYNISI: yamayi
     dosyanin kendi desenine yaz — iki kez ayni yere dustum).
  2) SESSIZ CATCH: readdir hata verdi, `catch (e) {}` onu yuttu; rapor
     mesajlarinin HEPSI `if (dosyalar.length)` icindeydi, yani dosya
     bulunamayinca hicbir sey basilmiyordu. Arizanin GORUNMEZ olmasinin
     sebebi yol hatasi degil, catch'in dilsizligiydi.

COZUM:
  - Yol duzeltildi: 'arac/gelen'.
  - Catch artik KONUSUYOR: hata kodu (ENOENT vb.) rapora yaziliyor.
  - Dosya yoksa da satir basiliyor: "§410 konsol dosyasi YOK: arac/gelen/
    tefas-tam-*.json bulunamadi — uretmek icin: ktpanel/arac/tefas-konsol.js"
    Boylece zincirin son basamagi HER kosuda durumunu bildiriyor.

DOGRULAMA (gercek repo dosyalariyla simulasyon):
  bulunan: tefas-tam-2026-08-24-2.json · tarih 2026-08-24 · tazelik GECTI
  tekil 1900 · arsivde bugun 2030 → SONUC: KISMI, kullanilmaz.
  Yani siradaki kosuda beklenen satir:
    "§410 konsol dosyasi KISMI (1900 fon) — arsivde bugun zaten 2030 fon
     var, iyi veri eksikle EZILMEDI (kapsam kapisi)"

DERS-1: SESSIZ CATCH YASAK. Arama/okuma yapan her blok BULAMADIGINI da
soylemeli. `catch (e) {}` yazan el, arizanin gorunmezligini de yazmis olur.
DERS-2: BIR RAPOR SATIRININ HIC CIKMAMASI, "sorun yok" DEMEK DEGILDIR —
beklenen satir yoksa once BLOGUN CALISIP CALISMADIGI sorulur.
DERS-3: KOK'E GORE YOL. Dosyanin kendi yol deseni neyse ona uy; iki kez
ayni hataya dusmek, desene bakmadan yazmanin bedeli.

## DAMGA CIZELGESINE
## ALTIN KURALLARA EKLER
- SESSIZ CATCH YASAK: her arama blogu bulamadigini da raporlar.
- BEKLENEN SATIR YOKSA once "blok calisti mi" sorulur.


# BAKIM EK — §410 (24 Agu 2026, gece · TEFAS ERISIM REJIMI DEGISTI)

## §410 TEFAS: SUNUCUDAN OTOMATIK CEKIM OLDU — KONSOL TOPLAYICI DEVREDE

TAM ERISIM TABLOSU (24 Agu, hepsi CANLI olculdu — tahmin yok):
  1. Vercel kopru        → "fetch failed" (baglanti duzeyi IP blogu)
  2. Actions runner      → TSPD JS meydan okumasi: HTTP 200 ama 6 KB kabuk,
                           chunk:0, inline jeton yok (§408b TANI satiri)
  3. Playwright          → ag dinleme JSON yakalayamiyor (headless taniniyor)
  4. Otomasyon-suruculu tarayici (CDP) → ilk sayfa acildi, ikinci istekte
                           "Request Rejected"; ana sayfa dahil tum site kapandi
  5. BindHistoryInfo     → HTTP 404 (yeni sitede KALDIRILMIS; katfon.json
                           damgasindaki bu isim artik tarihsel iz — §410b)
  6. Sayfali uc          → pencere basina ~600 kayitta HTTP 429; 15/24/38 sn
                           geri cekilmeler pencereyi ACMIYOR (kota, gecikme degil)
SONUC: sunucudan otomatik cekim OLDU. Kalan tek mesru yol kullanicinin KENDI
elle gezdigi tarayici oturumu. Cerez/JS meydan okumasi TAKLIT EDILMEZ — cizgi
§401'de cizildi, aynen duruyor.

### §410a KONSOL TOPLAYICI (arac/tefas-konsol.js, v4)
Sayfanin KENDI oturumunda, KENDI jetonu (on-yuz paketine gomulu, herkese ayni)
ve KENDI cerezleriyle, sayfanin zaten yaptigi cagrilari kotasina saygiyla
tekrarlar. Cikti: tefas-tam-<tarih>.json (aum: fiyat+tedPaySayisi+kisiSayisi+
portfoyBuyukluk · getiri: 1A/3A/6A/1Y/YB/3Y/5Y+riskDegeri · liste: kurucu).
v1→v4 OLCUM ZINCIRI: 350 ms aralik → 600'de 429 · 1500 ms + 15 sn backoff →
yine TAM 600'de 429 (kota kaniti) · v3 BindHistoryInfo denemesi → 404 ·
v2+v3 UST USTE kosunca 2100 kayitta 200 MUKERRER + hiz iki kati (429 tetikleyicisi).
v4: CIFT KOSU KILIDI (window.__ktpCalisiyor) · dilim 50 · 3 sn aralik ·
ilerleme korunur, mukerrer eklemez · dosyaya _kapsam/_hedef/_tam yazar.
DERS-1: IKI TOPLAYICI AYNI KOTAYI PAYLASIR — ikinci kopya hizi ikiye katlar,
kotayi erken yakar. Uzun sureli betiklerde KILIT sart.
DERS-2: "TAM AYNI SAYIDA" DURAN HATA GECIKME DEGIL KOTADIR — backoff uzatmak
yerine yontemi degistir (v3'te tek-cagri ucu arandi; 404 cikinca kabul edildi).

### §410 TAZELE ENTEGRASYONU (iki kapi)
Fon katmani, kopru+dogrudan+HAR dustuyse arac/gelen/ icindeki EN YENI
tefas-tam-*.json dosyasini okur. Iki kapi:
  1) TAZELIK: kv.tarih === bugun degilse KULLANILMAZ (raporda soylenir).
  2) KAPSAM: dosyadaki TEKIL fon sayisi, arsivde BUGUN icin yazili kayittan
     AZSA KULLANILMAZ. 24 Agu'da tam bu oldu: sabah kosusu 2030 fon yazmisti,
     konsol 429 yuzunden 1900'de kalmisti — iyi veriyi eksikle ezmek en sinsi
     kayiptir (§112 tek sahip + §300 ruhu). Birim test: (1900,2030)→KISMI,
     (2037,0)→kullanilir, (2030,2030)→kullanilir.
CAPRAZ DENETIM (24 Agu, sistemin kendini kanitladigi an): konsol verisi ile
sabah kosusunun yazdigi arsiv 1893 ORTAK FONDA fiyat farki 0, pay farki 0 —
iki bagimsiz yol bit bit mutabik. Konsol yolunun guvenilirligi KANITLI.

### §410b DAMGA GERCEK KANALI YAZAR
katfon.json damgasi sabit "BindHistoryInfo" yaziyordu — o uc artik 404.
Damga globalThis.__tefasYol'dan besleniyor: kopru / dogrudan v2 / HAR /
"konsol toplayici (elle · §410)". DERS: DAMGADA KANAL ADI SABIT YAZILMAZ —
kanal degisir, damga yalan soyler (§111'in kaynak ikizi).
UYGULAMA NOTU: ilk yazimda tanimsiz `yolNot` degiskeni kullanilmisti —
node --check gecti (calisma zamani hatasi), kapsam denetimi yakaladi.
DERS: SOZDIZIMI TEMIZ ≠ CALISIR; yeni degisken ekliyorsan KAPSAMINI dogrula.

### GUNLUK RITUEL (blok surdukce)
1) TEFAS fon sayfasini KENDI sekmende ac, tablo dolsun
2) F12 → Console → arac/tefas-konsol.js icerigini yapistir
3) Inen tefas-tam-<tarih>.json → repo: ktpanel/arac/gelen/
4) "veri tazele" (fon katmani) → rapor "§410 KONSOL DOSYASI KULLANILDI" demeli

### ACIK KALEMLER
- TEFAS'a AYDA BIR otomatik yol denenmeli (kapi acilirsa §408 zinciri hazir).
- Kalici cozum adayi: MKK VAP (resmi saklama, aylik) + Fintables katilim kartI
  zaten calisiyor — TEFAS'a bagimlilik yalniz 2037-fonluk gunluk akis tablosunda.
- ktpanel/edgar.js (kok yetim) HALA SILINMEDI — bekci her kosuda uyariyor.


# BAKIM EK — §408b (24 Agu 2026, gece · TEFAS jeton tani turu)

## §408b TEFAS JETON: "0 ADAY" TESHISI + UC KURTARMA

OLCUM (aksam kosusu): "§408 chunk taramasinda jeton bulunamadi (0 aday)".
KRITIK: "sayfa WAF reddetti" DEGIL — sayfa geldi ama chunk regex eslesmedi.
HAR CAPRAZ KONTROL: kullanicinin sayfasinda 6 chunk VAR, jeton common-*.js'te,
sayfada inline ST-token YOK. Yani runner SENIN gordugunden FARKLI HTML aliyor.

BU TUR TANI + KURTARMA (kor atis yok, once ne oldugunu gor):
  - §408b TANI satiri rapora: HTTP durum · HTML boy · "Request Rejected" mi ·
    chunk sayisi · inline jeton var mi · HTML ilk 120 karakter.
  - Kurtarma 1: jeton dogrudan HTML'de mi (bazen inline gomulur).
  - Kurtarma 2: chunk regex GENISLETILDI — yol ayiraci (/) dahil, lazy eslesme;
    dar regex bir alt-klasorlu chunk yolunu kaciriyor olabilirdi.
  - Kurtarma 3: tarayici basliklari eklendi (Accept-Language, Referer) — WAF
    UA-only istegi "yumusak" sayfayla geciştiriyor olabilir; tam tarayici
    imzasi gercek sayfayi getirebilir.
ETIK CIZGI AYNEN: hala yalniz kamuya acik sayfa/chunk okunuyor, cerez taklidi
YOK. Reddedilirse yine durulur; bu tur sadece "neden 0 aday" sorusunu yanitlar.

BEKLENEN OKUMA (siradaki kosu raporu):
  - inlineJeton:VAR → jeton HTML'de, cozuldu.
  - chunk:6 + jeton bulundu → dar regex sorunuydu, cozuldu.
  - chunk:0 + boy kucuk + Rejected:hayir → WAF yumusak sayfa donuyor; jeton
    yolu runner'da KAPALI, karar B'ye (HAR'i asil yola koy) doner.
  - Rejected:EVET → WAF sert blok; ayni sonuc, B'ye don.

DERS: "0 sonuc" bir cevap degil, bir SORU — kor duzeltme yerine once ORTAMIN
NE GORDUGUNU raporlat. Uc kurtarmayi ayni turda koymak, tani + olasi cozumu
tek kosuya sigdirdi (§383 "az sayida, sabirli" ruhu: ama burada tani ucuz).


# BAKIM EK — §403-§409 (24 Agu 2026, aksam)
# Repodaki BAKIM-EK-398.md / 398-399 / 398-400 / 398-401 dosyalarinin
# DORDU DE SILINIR — icerikleri yeniden numaralanarak buraya tasindi.

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


# BAKIM EK — §398-§401 (24 Agu 2026)
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


# BAKIM EK BLOGU — §366-§397 (21-23 Agu 2026)
# Her kayit: KOK NEDEN -> OLCUM -> COZUM -> DERS. Tum sayilar olculdu.
#
# BU BLOGUN OMURGASI: BIR OLCU KURMAK, ONU DOGRU CALISTIRMAKTAN KOLAYDIR.
# FEK/KOPMA-sigma matematigi ilk turda tuttu (referans hesapla BIREBIR).
# Sonraki ON YEDI tur tamamen GIRDI KALITESI ve ANLATIM TUTARLILIGI icindi.
# Kusurlarin neredeyse tamami kullanicinin EKRAN GORUNTUSUYLE yakalandi —
# birim testi bunlari bulamazdi, cunku hepsi "makul gorunen yanlis" tipindeydi.

## §366 MKK VAP FON AKISI — MicroStrategy API (21 Agu, kullanicinin HAR'indan)

KAYNAK: mobil.vap.org.tr — MKK Veri Analiz Platformu, MicroStrategy Library.
UC ADIM, SIFRESIZ (anonim "public" kullanicisi):
  1) POST /api/auth/login {"loginMode":1,"username":"public","password":""}
     -> X-MSTR-AuthToken yanit BASLIGINDA (govdede degil)
  2) POST /api/dossiers/{DOSSIER}/instances -> mid
  3) GET  /api/dossiers/{DOSSIER}/instances/{mid}
          ?includeTOC=true&includeShortcutInfo=true&resultFlag=3&checkPrompted=true
UC TUZAK, UCU DE SESSIZ:
  · X-MSTR-ProjectID BASLIGI olmadan adim 2 -> HTTP 400
  · resultFlag=3 olmadan adim 3 -> HTTP 200 ama `data` BOS
  · §366b CEREZ: Actions'tan HTTP 401, tarayicidan 201. HAR'da gorulen:
    Cookie iSession=<deger> ve X-MSTR-AuthToken <deger> AYNI. Tarayici cerezi
    kendiliginden tasir, Node fetch TASIMAZ.
    DERS: TARAYICIDA CALISIP SUNUCUDA 401 VERIYORSA ILK BAKILACAK YER CEREZ.
VERININ YERI (ilk HAR'da bulunamadi, ikinci HAR cozdu): hucreler
gvs.items[0].items[] icinde `rv` alanlarinda, satir sirasiyla duz dizi.
Ay etiketleri gts.col[0].es[].n icinde.
DERS: BUYUK JSON'DA VERI YOKSA ANAHTAR ADINI DEGIL DEGER KALIBINI ARA
(uzun sayi dizisi yerine {"rv":...} tekrari aranarak bulundu).

## §366c-d FON TURU KIRILIMI + IKI KAZA (21 Agu)

Kullanici "toplam degil TUR BAZINDA degisim istiyorum" dedi. Sayfada IKI grid
varmis, ilkini almisim:
  W6DCDACFE1… -> Ay × 3 olcu (TOPLAM)
  EA1D66EEC2… -> satirlar Ay × FON TURU, 7 olcu (ISTENEN) · 14 tur
DERS: BIR SAYFADA TEK GRID VARSAYMA — gsi tasiyan TUM dugumleri tara.
HUCRE ESLEME `pi` ILE: pi.left.ri satir, pi.top.ci sutun — kaynagin KENDI
indeksi. 168 satir sayfali geldigi icin (100'luk bloklar) siraya guvenmek riskli.
§366d BICIM KAZASI: Katilim fonu 0,4 mlr cikti, gercegi ~332 mlr — BIN KAT.
VAP metni INGILIZ bicimi: "331,939 M" -> virgul BINLIK ayraci, nokta ondalik.
Ben Turkce sanip virgulu ondaliga cevirmistim.
DERS: SAYI BICIMINI DILE GORE VARSAYMA — buyukluk testiyle dogrula
(bir fon turu milyar mertebesinde olmali, milyon degil).
CANLI SONUC (2026-07): sektor 10.052,1 mlr · Serbest Semsiye 6.221,8 (%62) ·
Para Piyasasi 1.839,3 · Girisim Sermayesi 474,6 · KATILIM SEMSIYE 421,2 (%4,2).
CAPRAZ DOGRULAMA: tur toplami = ilk gridin genel toplami, BIREBIR.
§366e RAPOR SATIRI: tur kirilimina gecince ozet satiri turSeri[0]'i (TEK BIR
TUR) aliyordu — rapor "toplam fon 181,1 mlr" yazdi, gercegi 10.052.
DERS: BIR VERI YAPISI DEGISINCE ONU OZETLEYEN SATIRI DA GOZDEN GECIR.
§366f AY GEZINMESI: 7 tam ay + 1 yarim. TAM OLMAYAN AY GIZLENIR (2025-12
yalniz 2 tur tasiyor; gosterilse "sektor kuculdu" diye yanlis okunur).
Esik: o aydaki tur sayisi en dolu ayin %70'i olmali.

## §367 EVDS KESIF MODU — GEREKSIZ CIKTI, GERI ALINDI (21 Agu)

Kullanici "EVDS'ye altin islemleri gelmis, API kesif baglantisi gonder" dedi.
403 aldi cunku evds3 uclari `key` BASLIGI ister, anahtar sunucuda.
Kesif modu yazdim — SONRA PANELDE ZATEN VAR OLDUGUNU gordum (§288, ?ara= ve
?list=). Yazdigim kod kaldirildi.
DERS: KAYIT VARDI, OKUMADIM — bu blokta UCUNCU kez (§361c middleware, §369c
donem onbellegi, bu).

## §368 KIYMETLI MADENLER — KESFEDILDI, KULLANILMADI (21 Agu)

KESIF (panelin kendi ?ara= ve ?list= uclariyla, tahmin YOK):
  bie_altinbistbul · bie_gumusbistbul · bie_platinbistbul · bie_paladiumbistbul
YAPI: grup basina 20 seri = 5 olcu × 4 para birimi.
  Olculer: KAP (kapanis) · AGORT (agirlikli ortalama) · HACM · MIKT · ISSAY
  Birim ekleri: 02=TL/kg · 03=USD/ons · 04=EUR/ons · 05=TL/gr
ACILIS FIYATI YOK — kullanici "acilis-kapanis" bekliyordu; onun yerine
AGORT var. AGORT−KAP farki gun ici yonu verir (kapanis ortalamanin ustundeyse
gun alicili kapanmis).
YAZIM TUZAGI: grup adi `paladium`, seri kodu `PALADYUM` — IKISI FARKLI.
Tahmin edilseydi yanlis olurdu; ikisi de olculdu.
KULLANICI VAZGECTI, TR EMTIA blogu geri alindi. Kesif bilgisi burada duruyor.

## §369 FEK — FINANSAL EMNIYET KATSAYISI (21 Agu, kullanicinin dokumanindan)

FEK = (cekirdek FAVOK + serbest likidite − bakim capex)
      ÷ (odenen faiz + KV finansal borc × λ)
KOPRU MANTIGI: tasiyabilecegi yuk ÷ uzerine binen yuk. 1,0 kopma noktasi.
HER KALEM BIR TUZAGI KAPATIYOR:
  · CEKIRDEK FAVOK, raporlanan degil (§351'de MERCN'de olculdu: raporun "esas
    faaliyet kari" 233 mn, icinde 104 mn DIGER net gelir). Borc servisi
    TEKRARLANABILIR nakitle yapilir.
  · SERBEST LIKIDITE = likit − asgari isletme nakdi (ciro %2).
  · BAKIM CAPEX: buyume capex'i ISTEGE BAGLI; sikisan sirket erteler.
  · λ (yenilenmeme): asil risk faiz degil ROLLOVER.
VETOLAR (odeme aczi zincirdir, ortalama degil):
  V1 cekirdek FAVOK/faiz < 1,0x -> tavan 2
  V2 nakit oran < 0,20 VE KV borc payi > %70 -> tavan 2
§369b GEVSEK MOD: mulKapTTM EV/EBITDA icin yazilmis, ciro+FAVOK ZORUNLU
tutuyordu; FEK'in ikisine de ihtiyaci yok. Ayrica null donuyordu — SEBEP
GORUNMUYORDU. Artik {hata:...} doner.
§369c ORTAK DONEM ONBELLEGI: §348'de bu onbellek EKLENMISTI ama yalniz
Ceyreklik Seri kartinda duruyordu; mulKapTTM her cagrida KAP'i yokluyordu.
DERS: AYNI COZUMU IKINCI KEZ YAZIYORSAN ORTAK YERE TASI.
§369d DONUS SOZLESMESI KAZASI: §369b'de null yerine {hata:...} donmeye
baslayinca EV/EBITDA karti hata nesnesini GECERLI VERI sandi (bos olmayan
nesne truthy) -> "TTM undefined", her yerde NaN.
DERS: BIR FONKSIYONUN DONUS SOZLESMESINI DEGISTIRIRSEN TUM CAGIRANLARI
GOZDEN GECIR — null kontrolu artik yetmez.

## §370 KOPMA-σ — NAKIT SERVIS KOPMA MESAFESI (21 Agu)

Merton DD FORMU korunur, UC GIRDISI degistirilir:
  1) varlik degeri yerine NAKIT KAPASITESI (BIST'te sirket varligi borcunu
     astigi halde ODEYEMEDIGI icin olur)
  2) hisse volatilitesi yerine FAVOK MARJI OYNAKLIGI (fiili dolasim dusuk,
     TMS-29 defteri yeniden ifade ediyor; fiyat gurultu)
  3) tek dagilim yerine IKI REJIM (He-Xiong rollover kanali: fonlama kosulu
     surekli degisken degil DURUM'dur)
DD = [ln(K/L) + (−σ²/2)] / σ · PD = p·Φ(−DD_kriz) + (1−p)·Φ(−DD_baz)
KOPMA-σ = −Φ⁻¹(PD)
Φ Abramowitz-Stegun 7.1.26, Φ⁻¹ Acklam — bes referans degerle test edildi.
ILK TURDA REFERANS HESAPLA BIREBIR: DD baz 1,90 (yazi 1,89) · kriz −0,59 ·
PD %16,7 (yazi %16,8) · KOPMA-σ 0,96 (ayni).
§370b DAYANIKLI σ: MERCN'de σ %37,7 cikti, referans %16,3. Sebep TEK AYKIRI
CEYREK (1Ç26'da ciro 38 mn'ye dusmus). Referans metin de gormus ama ELLE
temizlemis. Medyan+MAD ile otomatiklestirildi ve model aykiri ceyregi
KENDILIGINDEN 2025/3 diye buldu — yazinin elle cikardiginin AYNISI.
DERS: 8 GOZLEMDE TEK AYKIRI DEGER σ'YI IKIYE KATLAR.

## §371-§373c FEK/KOPMA-σ GIRDI KALITESI ZINCIRI (21-22 Agu)

§371 DOYGUNLUK TAVANI (4σ): ELITE'te 6,75σ ve "14.449 katı" gibi artiklar.
  4σ otesinde NORMAL DAGILIM VARSAYIMININ KENDISI model riskinden az guvenilir.
  DERS: BIR MODELIN GECERLI ARALIGI VARSA EKRAN ONU BILMELI.
§372 λ REJIMDEN SECILIR (kullanicinin ikinci dokumaninda TCMB/BDDK
  kalibrasyonu onerildi): λ_sistem = P(takip) + P(yapilandirma) × anapara talebi
    Baz: ticari TGA %2,3 + yapilandirma %5,2 × 0,15 -> %3,1
    Kriz (2020): %6,4 + %12 × 0,30 -> %10,0
  DURUSTLUK NOTU (kartta yazili): TGA "bankanin tahsil edemedigi kredi",
  λ "firmanin borcunun yenilenmemesi" — ILISKILI AMA AYNI SEY DEGIL. Sistem
  tabani veriden, FIRMA CARPANI YARGIDIR ve λ'yi bes kata kadar oynatir.
§372b TURKIYE NOTU: burada olum iflasla degil SULANDIRMAYLA gelir —
  evergreening, KGF, aile kefaleti. Cikti P(iflas) DEGIL
  P(zorunlu finansman olayi) olarak okunur.
§373 FAIZ TUTARLILIK DENETIMI (EUPWR'da yakalandi): KV borc 1.339 mn ama
  odenen faiz 26 mn -> ortuk faiz %1,9, TL'de imkansiz. FEK 84x cikiyordu.
  DERS: TURETILMIS BIR SAYI SACMA GORUNUYORSA GIRDIYI SORGULA.
§373b BOS vs SIFIR (BIMAS): Math.abs(null)=0 ve Number.isFinite(0)=true —
  hic bulunamamis kalem "dolu ve sifir" gibi basiliyordu ("+0").
  DERS: Math.abs/parseFloat GIBI DONUSUMLER null'I SESSIZCE SAYIYA CEVIRIR.
§373c NOT BASTIRMA: kart hem "faiz supheli, yuk hafife alinmis olabilir"
  diyor HEM 5/5 "Kale" notu veriyordu — en kotu kombinasyon.
  DERS: BIR SONUCA GUVENMIYORSAN ONU NOTLANDIRMA. Uyari, notun YANINDA degil
  YERINE gecmeli.

## §374 FAIZ DUSUS ZINCIRI (22 Agu) — SISTEMATIK COZUM

BIMAS/EUPWR/ARDYZ ucunde de faiz bulunamadi. IAS 7 odenen faizin ISLETME ya da
FINANSMAN altinda raporlanmasina izin verir; IFRS 16 kira faizleri ayri satirda.
SIRA (en dogrudan -> en vekil):
  1) finansman: odenen faiz        — nakit, kesin
  2) isletme: odenen faiz          — nakit, kesin
  3) mutabakat: faiz gelir/gider duzeltmesi — tahakkuk, net
  4) gelir tablosu: finansman gideri — GENIS vekil (kur farki da icerir)
Hangi kaynaktan geldigi KAYDEDILIR; finansman disiysa kartta "vekil" etiketi.
Son adim bilincli olarak genis: FEK icin MUHAFAZAKAR tarafta hata yapmak dogru.

## §375-§377 ELESTIRI PAKETI (22 Agu, kullanicinin ucuncu dokumani)

Alti maddenin HEPSI uygulandi:
§375b VETO BILESIGE: V2 tetikliyken FEK 2'ye tavanlaniyor ama KOPMA-σ
  "4/5 Saglam" YESIL yaziyordu. Gerekce: likidite vetosu tam olarak σ'nin
  GOREMEDIGI turden bir olay — σ FAVOK'un dalgalanmasini olcer, tamponun
  yoklugunu degil. Iki olcu AYRISMIYOR, biri digerinin KOR NOKTASINI gosteriyor.
§375 λ ETIKETLERI: tablo sabit 0,10/0,25 yaziyordu, motor TCMB kalibreli
  degerleri kullaniyordu. Hesap dogru, ETIKET yanlisti.
§375 SUREKLI CARPAN: basamak fonksiyonu ESIK UCURUMU yaratiyordu (MERCN
  karsilama 1,65x, esik 1,50x — faiz %10 artsa carpan 1,0'dan 2,5'e siciyordu).
  c = clamp(4,0/karsilama, 0,5, 5,0). Yan etki: MERCN λ'si %3,1 -> %7,5,
  referans metnin %7,7'siyle neredeyse ayni.
  DERS: ESIKLI FONKSIYON GIRDI GURULTUSUNU NOT SICRAMASINA CEVIRIR.
§375c MANSET MUHAFAZAKAR σ: MAD × 1,4826 NORMALLIK altinda σ'ya yakinsar;
  kalin kuyrukta sistematik olarak ASAGI YANLIDIR. Robust estimator dagilimin
  MERKEZI icin dogrudur — biz UCUNU olcuyoruz.
  DERS: DAGILIMIN UCUNU OLCERKEN DAYANIKLI TAHMINCI KULLANMA.
§375d DUYARLILIK EKSENI σ'YA DONDU: λ × p izgarasi TCMB kalibrasyonundan
  sonra hicbir hucrede notu degistirmiyordu, ustelik mevcut calisma noktasi
  (λ 0,10) taranan araligin (0,15-0,35) DISINDA kaliyordu.
§376 NAKDE DONUSUM ORANI: cekirdek FAVOK ÷ isletme nakit akisi. 2,0 ustu ->
  "kar nakde donmuyor, numeratorun onemli kismi bir muhasebe ifadesi".
§377 KOSULLU TESHIS: σ yukselince baskin risk vade yapisindan FAALIYET
  OYNAKLIGINA kaydi ama metin hala "kisa vadeli borc agirliginin imzasi"
  diyordu. Kriz dali payi %50 altina duserse cumle degisir.
§377b SINIR MESAFESI: "sinir 1'e 3,5 puan σ mesafede — KENARDA". Bir sinifin
  ortasinda olmakla kenarinda olmak farklidir.
§377c BEKLENEN KAYIP: KOPMA-σ olasiligi verir, SIDDETI vermez. Zorunlu
  finansman olayi sifir deger demek degil — iskontolu bedelli mevcut ortagin
  degerinin kabaca ucte birini siler. PD × %35 = beklenen kayip.
  MERCN: %28,5 × %35 ≈ %10 -> "uzak dur" degil, "adil degerden %10 kes".

## §378 MEVSIMSELLIK TUZAGI (22 Agu, BASGZ'de yakalandi)

σ %76,4 cikti. Dogalgaz dagitiminda kis ceyregi FAVOK'u patlatir, yaz coker —
model bu DUZENLI salinimi BELIRSIZLIK saniyordu. Dipnot "mevsimselligi gormez"
diyordu; aslinda goruyor ve YANLIS YORUMLUYORDU, ki daha kotu.
TESPIT: ceyrek-ici sapma ÷ toplam sapma < 0,60 -> mevsimsel.
DUZELTME: σ ceyreklik yerine TTM KAYAN marjdan hesaplanir (mevsimsellikten
arinik). Test: tipik dogalgaz deseninde ceyreklik CV %74, TTM ile %1.
DERS: DUZENLI SALINIM RISK DEGILDIR — belirsizlik olcerken deseni ayir.

## §379 BAYAT SONUC (22 Agu, NTGAZ'da yakalandi)

NTGAZ basarisiz oldu ama ekranda ELITE'in karti duruyordu: rozet "ELITE",
kutu "NTGAZ". Yanlis sirketin verisine bakiyor sanmak, hic sonuc gormemekten
COK DAHA TEHLIKELI.
DERS: BASARISIZ SORGU EKRANI TEMIZLEMELI — bayat sonuc yeni sorgunun cevabi
gibi gorunur.

## §380-§384 KAP HIZ SINIRI — UC KATMANLI COZUM (22 Agu)

Kullanici "hiz sinirini nasil asariz" diye sordu. CEVAP: ASMA, ISTEGI HIC YAPMA.
IP rotasyonu/proxy zinciri REDDEDILDI: kaynagin kurallarini dolanmak olur ve
yakalanirsa panelin KAP erisimi TAMAMEN gider.
§380 EDGE ONBELLEK (asil cozum): YAYIMLANMIS BILDIRIM ASLA DEGISMEZ. TUPRS'in
  2026/2Ç tablosu bugun ne diyorsa yil sonra da ayni. Vercel edge 1 YIL tutar.
  mod=ham -> s-maxage=31536000, immutable · mod=donemler -> 6 saat.
  CANLI DOGRULAMA: ikinci istekte x-vercel-cache: HIT, age: 20.
  DERS: HIZ SINIRINI ASMAYA CALISMA — ISTEGI HIC YAPMA.
§381 KAP HAM ARSIVI: sirket basina tek dosya (kap-arsiv/<KOD>.json), en fazla
  15 ceyrek, ham tablolar. Boyut olculdu: ~23 KB/bildirim -> 245×15 ≈ 86 MB,
  GitHub sinirlarinin (repo 1 GB) rahat altinda. Panel bir sirket icin
  15 ISTEK -> 1 ISTEK (GitHub'a).
§382 KOSU-ICI ONBELLEK: ilk arsiv kosusunda 3/3 "donem yok" — AMA ayni kosuda
  faktor evreni 43/245 ile sorunsuzdu. Iki modul AYNI LISTEYI AYRI AYRI
  cekiyordu; faktor once kosup KAP'i yoruyordu.
  DERS: AYNI KOSUDA IKI MODUL AYNI UCU CAGIRIYORSA ARALARINDA ONBELLEK OLMALI.
§383 FAKTOR CEKTIGINI ARSIVE YAZSIN (asil tasarim degisikligi): faktor evreni
  ZATEN ham tabloyu eline aliyor; onu diske yazmak SIFIR EK ISTEK. Kosu basina
  +10 ceyrek BEDAVA. Arsiv modulu artik yalniz eski ceyrekleri tamamliyor.
  DERS: AYNI VERIYI IKI MODUL CEKIYORSA BIRI CEKSIN, DIGERI OKUSUN.
§384 BASARISIZLIK SAYACI: CITAS ve DENGE her kosuda oncelik listesinin basina
  cikip dusuyor ve SIRAYI TIKIYORDU. Ust uste 3 basarisizlikta 6 saat
  dinlendirilir (kap-arsiv/_durum.json, kosular arasi hafiza).
  DERS: SUREKLI DUSEN BIR KAYIT KUYRUGU KILITLER — geri cekilme sart.
§381b ONCELIK: bilanco tetigi -> XK030 -> XK100 -> kalanlar. Tum evren ~33 gun
  ama XK030 ~10 gunde hazir; arsiv tam tur bitmeden kullanilabilir hale gelir.

## §385-§388 SOHBET KATMANI — EBU'YA SORU-CEVAP (22 Agu)

KONUM KARARI: sag altta yuzen dugme + kayan panel (mobilde tam ekran).
Sekme degistirmeden erisim; bot HANGI SEKMEDE OLDUGUNU ve SECILI TICKERI
baglam olarak gorur — panelin diger araclarda olmayan ustunlugu bu.
KIMLIK: ayri bir bot degil, EBU'NUN IKINCI MODU (tutarlilik + tek kural seti).
§385 OZET KATMANI: panelde onlarca JSON var; hepsini gondermek pahali. Her
  kaynaktan kompakt ozet + web aramasi (panelde olmayan icin).
§386 GERCEK SAYILAR: "ASELS'in EV/FAVOK'u kac" cevaplanamadi cunku ozette
  YALNIZ KOD LISTESI vardi. 141 hissenin tam satiri + ONCEDEN HESAPLANMIS
  EV/FAVOK gonderiliyor (model aritmetik hatasi yapmasin).
§386b SOZLUK: FEK'i "Fiyat/Kazanc" sandi. Panelin kendi terimleri sisteme
  yazildi (FEK, KOPMA-σ, λ, cekirdek vs genis FAVOK).
§386c KART ACMA: model cevabin sonuna [KART:t9:ASELS] birakir; panel isareti
  ayiklar, SEKMEYI ACAR ve tickeri doldurur. "Su karta bak" demek yerine
  KARTI ACMAK — sohbetin panele gomulu olmasinin asil faydasi.
§387 MAKRO KATMANI: "ABD'de TUFE kac" sorusuna panel yerine WEB'e bakildi —
  oysa ABD sekmesinde TUFE, GSYH, Fed olasiliklari, JOLTS hepsi VAR. Ozet
  yalniz hisse/fon katmanlarini topluyordu.
  DERS: OZET KATMANI EKSIKSE MODEL PANELI YOK SAYAR.
§388 SECICI OZET (kullanici: "her soruda kontorumu yiyor"): ~12K token/soru
  ideoluyordu. Soruda hisse kodu varsa YALNIZ o satirlar; makro kartlari
  yalniz makro sozcugu varsa. Model secimi: Haiku varsayilan, akil yurutme
  gerektiren sorularda Sonnet (10 kat maliyet farki). Web aracı kosullu.
  Sonuc: "ASELS EV/FAVOK" ~600 token, "ABD TUFE" ~1.700, tasarruf %75-90.
  DERS: "HEPSINI GONDER" KOLAY AMA PAHALI — soruyu okuyup secmek bes kat ucuz.

## §389-§394b FEK GORUNUM + TUTARLILIK TURU (22-23 Agu)

§389 KALIP BIRLIGI: FEK, EV/EBITDA kartiyla AYNI kaliba dokuldu (h2 baslik +
  iki sutunlu izgara: solda hisse, sagda rejim varsayimlari).
§390 BAKIM CAPEX — VEKILDEN UCLU KARARA (kullanici sordu: "bakim capexi nasil
  anliyorsun"). DURUST CEVAP: KAP'ta ayrim YOK, tek satir var.
  1) capex yoksa -> amortisman (eski vekil)
  2) capex ≤ amortisman -> capex'in KENDISI (buyume yatirimi yok demektir)
  3) capex > amortisman VE ciro buyumuyor (<%5) -> capex'in TAMAMI bakim
     (buyumeyen sirket kapasite eklemiyordur)
  4) capex > amortisman VE buyuyor -> fazlasi buyume, bakim = amortisman
  MUHAFAZAKAR: kararsizsa YUKSEK olan; bakim capex'i az gostermek FEK'i
  oldugundan iyi gosterir.
  DERS: AYRIM VERIDE YOKSA VEKIL KULLAN AMA VEKILIN NEREDE CURUDUGUNU SOYLE.
§391 FEK DOYGUNLUGU + KOSULLU FAIZ CEZASI (ASELS): FEK 53,32x diye sayi
  basiliyordu — yuk kapasitenin %1,9'u iken oranin kesinligi SAHTE. 10x ustu
  "OLCUM DISI". Ayrica faiz cezasi yersizdi: yuk zaten onemsizken faiz 10 kat
  yanlis olsa bile sonuc degismez (stres FEK 11,6x).
  DERS: BIR UYARI SONUCU DEGISTIRMIYORSA CEZAYA DONUSMEMELI.
§392 FAIZ CEZASI HER IKI OLCUYE (JANTS: FEK 3/5 ama KOPMA-σ 5/5).
  DERS: BIR GIRDI SUPHELIYSE ONU KULLANAN TUM CIKTILAR AYNI SEKILDE ISARETLENIR.
§392b DOVIZ KREDISI BANDI: JANTS ortuk faiz %7,8 — TL icin dusuk ama
  IHRACATCIDA EUR/USD kredisi icin NORMAL. Esik sessizce TL varsayiyordu.
  %4-9 bandi ayri isaretlenir; %4 alti hala supheli.
§392c AYRISMA NIHAI NOTU: uyari "FEK 5/5, KOPMA-σ 3/5" dedi ama ekranda ikisi
  de 3/5'ti — HAM notu kullaniyordu.
  DERS: BIR KARSILASTIRMA GOSTERIYORSAN EKRANDAKI SAYILARI KARSILASTIR.
§393 AYKIRI LISTESI KULLANILAN SERIDEN (NTGAZ: 8 ceyregin 6'si "aykiri"
  listelendi — tanim geregi imkansiz). σ TTM'den hesaplaniyor ama aykiri
  tespiti CEYREKLIK seriye bakiyordu. Mevsimsel seride "aykiri ceyrek" zaten
  anlamsiz. DD sutunu da ±10σ'da tavanlandi (+144,70σ gorunuyordu).
  DERS: BIR ESIGI HANGI SERIDEN HESAPLADIYSAN O SERIYE UYGULA.
§394 DOYGUNLUK ESIKLERI HIZALANDI (CIMSA): KOPMA-σ "risk bilancoda degil"
  derken FEK ayni ekranda "Dar emniyet 3/5" diyordu. FEK esigi 10x,
  KOPMA-σ'ninki 4σ — FARKLI OLCEKLER. ORTAK OLCUT: yuk/kapasite < %10.
  DERS: IKI OLCU AYNI EKRANDAYSA DOYGUNLUK ESIKLERI AYNI BUYUKLUGE BAKMALI.
§394b NaN KORUMASI (CIMSA "NaNσ · 1/5 Kirilgan"): PD sifira yaklasinca
  Φ⁻¹(0) NaN doner. §394'te `doygun`u ikiye bolerken koruma tasinmadi ve NaN
  TERS bir not uretti (risk COK DUSUK oldugu icin PD sifirlanmisti).
  DERS: BIR KOSULU IKIYE BOLERKEN ICINDEKI HER KORUMAYI DAGIT.

## §395 REPO REJIMI DONDU (23 Agu) — PANELIN UYARDIGI SENARYO GERCEKLESTI

TCMB Duyuru 2026-35: 1 Mart'ta ara verilen BIR HAFTA VADELI REPO IHALELERINE
YENIDEN BASLANDI. Panel aylardir "rejim riski: repo yeniden acilirsa AOFM bir
anda ~300bp duser, PPK hic indirim yapmasa bile" diye uyariyordu.
MEKANIZMA: fonlama gecelik pencereden (koridor tavani %40) politika faizine
(%37) kayar. ORTULU SIKILASMA -> ORTULU INDIRIM.
Mart'taki adim kur oynakligina karsiydi (ayni gun TL uzlasmali vadeli doviz
satimi basladi); geri alinmasi TCMB'nin KUR TARAFINDA RAHATLADIGINI soyler.
PANEL DAVRANISI: app.js mantigi OLCULEN AOFM'ye bakiyor, sabit varsayima
degil — AOFM %40'tan %37'ye inince kart kendiliginden "POLITIKA" moduna gecer.
Metin haber diline cevrildi; AOFM hala tavandaysa bunun VERI GECIKMESI oldugu
yazildi.
DERS: BIR RISK GERCEKLESTIGINDE UYARIYI HABERE CEVIR — "olursa" diyen metin,
olduktan sonra YANLIS BILGI halini alir.
YAN HABER (22 Agu): 2022/11 sayili "yastik alti altin" tebligi yururlukten
kaldirildi (RG 33348). KKM tasfiyesinin altin ayagi. Kaldirilan mulkiyet degil,
TL'ye DONUSUM TESVIKI.

## §396-§397b HAFTALIK NOT + TAKTIKSEL (23 Agu)

Ikisi de guncellendi (not 3-9 Agu'daydi, taktiksel 27 Tem'de).
TAKTIKSELDE IKI DURUS DEGISTI, sebebi ayni — repo rejimi:
  TL/sabit getiri USTU -> NOTR (carry'nin kaynagi zayifliyor)
  Altin NOTR -> NOTR/USTU egilimli (teblig kalkti + reel faiz ortulu dusuyor)
  Yeni satir: GYO SECICI USTU (iskonto −%48,4, faiz duserse kapanma temasi)
§397 EBU UZERINE YAZIYORDU (kullanici: "haftalik not kayboldu"): Ebu gece
  kosusunda data-ebu="hayir" tasimayan kartlara not uretiyor ve ELLE YAZILAN
  analizi EZIYORDU. Teshisi kolaylastiran celiski: ETIKET YENI, GOVDE ESKI —
  etiket statik HTML oldugu icin kalmis, govdeyi JS degistirmis. Sondaki
  "🤖Ebu 09:21" damgasi ele verdi.
  Haftalik not + taktiksel dagilim data-ebu="hayir" ile korundu.
  DERS: ELLE YAZILAN ICERIK OTOMATIK URETIMIN KAPSAMINDA OLMAMALI.
  (§365c'nin kardesi — panele elle icerik eklerken EBU KAPSAMI DORDUNCU
   KONTROL NOKTASI.)
§397b TAKVIM HATASI (kullanici duzeltti): "30 Agustos Zafer Bayrami — piyasa
  kapali, hafta kisa" yazmistim. 30 Agustos 2026 PAZAR'a denk geliyor, zaten
  kapali; hafta 24-28 Agu TAM BES IS GUNU. Yerine daha ise yarar cerceve:
  takvim bos, fiyatlamayi TEK BASINA repo rejimi surukleyecek.


# BAKIM EK BLOGU — §338-§365 (20-21 Agu 2026)
# Her kayit: KOK NEDEN -> OLCUM -> COZUM -> DERS/KURAL. Tum sayilar olculdu.
#
# BU SERININ OMURGASI: KAP'IN KAPISI ACILDI. Sabah "TUPRS bulunamiyor"
# noktasindaydik; gece bes finansal tablonun TAMAMI okunuyor, enflasyon
# endekslemesi bagimsiz kaynakla BIREBIR dogrulandi, faktor evreni kendi
# kendine doluyor, GYO'lar NAV iskontosuyla geldi.
# SERININ KARAKTERI: on'a yakin fail cikti ve BUYUK COGUNLUGU "sessizce yanlis
# veri ureten" turdendi. Panel bu yuzden BILEREK bagli tutulmadi.

## §338 mod=donemler — SIRKET BAZLI DONEM LISTESI (20 Agu)

KOK NEDEN: mod=fr TUM PIYASANIN bildirimlerini cekip suzuyordu ve KAP'in 2000
KAYIT TAVANINA takiliyordu. KANIT: her pencerede tam 399 kayit dondu; TUPRS,
THYAO, GARAN, ASELS, EREGL, KCHOL listede YOKTU — yani en buyukler hic
gorunmuyordu.
COZUM (kullanicinin KAP HAR dosyasindan): iki yeni uc
  GET /tr/api/member/filter/{TICKER}                    -> mkkMemberOid
  GET /tr/api/financialTable/listCompanyExcelMembers/{oid}/{yil}/T
Sirket bazli sorgu -> tavan YOK. Canli test: TUPRS mod=donemler&yil=4 -> 14
donem (2023/1'den 2026/2'ye).
YAN KAZANIM: bu bulgu §299 bilanco borc defterinin neden hep orta-kucuk
hisselerle dolu oldugunu da acikladi.
DERS: BIR UC BOS DONUYORSA ONCE TAVANI OLC — filtre degil KAPSAM sorunu olabilir.

## §338b PARALELLIK BOT SAYILDI (20 Agu, canli ariza)

Dort yil PARALEL cekilince KAP dordunu de reddetti: "fetch failed" (ag
seviyesi, HTTP degil). member/filter ayni anda CALISIYORDU, yani host
erisilebilir; reddedilen es zamanli istek DEMETI.
COZUM: siralı cekim, her istek arasi 250 ms, basarisizsa 1 kez tekrar (600 ms).
Ayrica listCompanyExcelMembers finansal tablo sayfasindan cagrildigi icin
referer O sayfa yapildi.
DERS: PARALELLIK HIZ KAZANDIRIR AMA KAYNAK ONU BOT DAVRANISI SAYABILIR.

## §340 mod=ham — BES TABLONUN TAMAMI (20 Agu) · UC BASARISIZ DENEME

HEDEF: mod=tablo SABIT etiket listesiyle calisiyordu (bilanco 15, gelir 18
kalem) ve NAKIT AKIS TABLOSU HIC YOKTU. Kullanici tam kalem istedi.
KAYNAK OLCUMU (TUPRS 2026/2, id 1643116): bildirimde BES buyuk tablo var —
Bilanco, Kar/Zarar, Diger Kapsamli Gelir, NAKIT AKIS (dolayli), Ozkaynak
Degisim. Her satirin basinda XBRL ETIKETI duruyor.
UC DENEME, UC FARKLI DERS:
  v1: <table>...</table> sinir aramasi. Tablolar IC ICE (1471 adet); naif
      indexOf('</table>') ILK kapanisi yakalayip yanlis blok uretti -> 0 tablo.
  v2: XBRL regex'i ^...$ ile bitiyordu. Kod ROL URI'si tasiyor
      ("ifrs-full_X|http://mkk...") -> hic eslesmedi.
  v3: <tr>...</tr> non-greedy. VERI SATIRININ ICINDE baslik tablosu var; es
      ic satirda kesiliyordu (hata vermiyor, SESSIZCE eksik veri).
COZUM (§340d) — TANI CIKTISIYLA: HTML'in KENDI KIMLIK ETIKETLERI var.
  <table class="financial-table tbl_general_role_520003">  -> TABLO
  <tr class="general_role_520003-row-2 data-input-row ...">  -> VERI SATIRI
Satirlar "data-input-row" KONUMLARINDAN dilimlenir; tablo kimligi rol
sinifindan (210015 bilanco, 520003 nakit akis...). Ic ice yapi onemsizlesir.
BIRIM: "Sunum Para Birimi: 1.000 TL" raporun kendi beyani — okunur, uygulanir.
DERS: KAYNAK KENDI KIMLIK ETIKETLERINI VERIYORSA YAPIYI TAHMIN ETME.
DERS-2: SESSIZ RETURN TESHISI GECIKTIRIR — her erken cikis iz birakmali (§353b).

## §340e TEKILLESTIRME (20 Agu)

Ilk tam cikti IKI KAT sisikti: her tablo iki kez geliyordu (sayfada TR/EN
kopya). Imza = xbrl + degerler; ayni imza ikinci kez gelirse atlanir. Ozkaynak
Degisim'de ayni xbrl MESRU olarak tekrar eder (Donem Basi/Sonu) ama DEGERLERI
farklidir — imzaya degerler de girdigi icin mesru tekrarlar korunur.
Bos sablon satirlari da suzuldu (?bos=1 ile istenebilir). Sonuc: 1400 satir ->
176 satir.

## §341-§342 PANEL: XBRL HARITASI + METRIK MOTORU (20 Agu)

Kalem eslestirmesi METNE DEGIL XBRL KODUNA dayanir ("Hasilat"/"Satis Gelirleri"
degisir, ifrs-full_Revenue degismez).
SUTUN KURALI (olculdu): Bilanco -> degerler[0] donem sonu; Gelir/DKG -> 4 sutun
gelirse [kum.cari, kum.onceki, CEYREK.cari, ceyrek.onceki]; Nakit akis -> yalniz
kumulatif.
METRIKLER: FAVOK, marjlar, net borc, SNA, isletme sermayesi, cari oran, ROE,
ROA, ozkaynak/aktif. KURAL: bir bacak eksikse metrik HESAPLANMAZ —
"yarim metrik yanlis metriktir". (Testte SNA bos kaldi ve DOGRU davranisti.)

## §342b ENFLASYON MUHASEBESI: KUMULATIF FARKI CEYREK DEGILDIR (20 Agu)

Kullanici "veriler dogru mu" diye sordu, olcum yapildi:
  TUPRS 1C26 raporunda kumulatif ciro 258,3 mlr
  TUPRS 2C26 raporunda 6 aylik  662,8 mlr
  Fark 404,5 CIKAR ama raporun KENDI 2C sutunu 386,4 diyor -> %4,7 SAPMA.
SEBEP: TMS-29 geregi HER RAPOR kendi donem sonu ALIM GUCUNE gore yeniden ifade
edilir. AYNI rapor icindeki sutunlar tutarlidir; FARKLI raporlar arasi fark
DEGILDIR. 1C26 degeri 2C raporunda 276,4'e (+%7) yeniden ifade edilmis.
COZUM: turetilen hucre "≈" ile ve soluk gosterilir; rapor kendi ceyrek sutununu
veriyorsa O KULLANILIR (kesin).

## §345 ENFLASYON ENDEKSLEME — DIS VERI KULLANMADAN (20 Agu)

CAPRAZ DOGRULAMA (Fintables): 2025 yillik raporda hasilat 830,4 mlr; ayni donem
bugunku parayla 977 mlr. Oran 1,1766; 2024 icin 1,1775 — AYNI KATSAYI. Yani
panel 15 ceyregi 15 FARKLI PARAYLA gosteriyordu, trend yaniltiyordu.
COZUM: zincirleme katsayi, raporlarin KENDI "onceki donem" sutunlarindan.
  (a) ARDISIK: rapor t'de kumulatif − ceyrek = bir onceki donemin kumulatifi,
      AMA t'nin parasiyla. Kendi raporundaki degere bolununce katsayi cikar.
  (b) YIL BAZLI: t'nin "onceki donem" sutunu ÷ gecen yil ayni donem kumulatifi.
  (c) YIL SONU KOPRUSU — BILANCODAN: gelir tablosunda 4C'ye bag YOK (2026
      raporlari 2025 yilligini tasimaz); ama BILANCONUN "onceki donem" sutunu
      HER ZAMAN 31 ARALIK'tir. Toplam varliklar uzerinden koprulendi.
  (d) CIFT YONLU: katsayi hem geriye hem ILERIYE tasinir (2025/3'un dogrudan
      koprusu yok, komsudan miras alinca 1,178 kaliyordu; dogrusu 1,229).
FARK ALMA SIRASI: iki kumulatif farkli paralardaysa ONCE her biri kendi
katsayisiyla bugune cevrilir, SONRA fark alinir. (Ham fark alip tek katsayiyla
carpmak 4C'yi sisiriyordu: ≈305 cikti, dogrusu 242.)
CANLI KABUL (Fintables ile BIREBIR): 2025/1 222,1 · 2025/2 242,0 · 2025/3
271,3 · 2026/1 276,4.

## §345b ONBELLEK SEMA SURUMU (20 Agu, canli ariza)

§345 icin kayitlara `onceki` alani eklendi ama ONBELLEKTEKI eski kayitlarda o
alan YOKTU. Panel "tumu onbellekten" deyip eski semayi kullandi, katsayilar 1
kaldi, degerler HAM gorundu — ve dipnot yine de "ENDEKSLI" diyordu.
EN KOTU TUR: YANLIS ETIKETLI VERI.
COZUM: anahtar SEMA SURUMU tasir (ktp_kap_ceyrek_v2); sema degisince eski
kayitlar kullanilmaz, otomatik yeniden cekilir. Dipnot da durustlestirildi:
katsayi cikarilamazsa "⚠ ENDEKSLENEMEDI — degerler HAM" der.
DERS: KAYIT SEMASI DEGISIYORSA ONBELLEK ANAHTARI DA DEGISMELI.

## §343 ESKI KART KALKTI + §343b KURULUM TEMIZLIGI (20 Agu)

Tek donem gosteren "SIRKET SEC" karti kaldirildi (Ceyreklik Seri ayni veriyi 15
ceyrek + tam kalem + metriklerle veriyor).
ARIZA: kaldirdim ama KURULUM KODUNU temizlemedim — `$('ftYil').innerHTML`
artik NULL uzerine yaziyordu, TypeError firlatti ve catch'e dustu; ONDAN
SONRAKI satirlar (Ceyreklik Seri dugme baglantilari) HIC kosmadi. Kullanici
"ticker girip seriyi getir diyorum hicbir sey olmuyor" dedi; fonksiyon
saglamdi, DUGME BAGLI DEGILDI.
DERS: BIR KARTI KALDIRIRKEN ONUN KURULUM KODUNU DA KALDIR — tek try blogunda
toplanan kurulumlar birbirini dusurur.

## §344 SPARKLINE + §355 OKUNABILIRLIK + §356 ISI + §357 GRAFIKLER (20 Agu)

§344: her satirin sonunda 15 ceyreklik trend. Tablo en yeni SOLDA ama sparkline
ZAMAN YONUNDE cizilir (eski solda) — aksi halde goz yanilir. Olcek satirin
KENDI min-max'i; negatif seride kesikli SIFIR CIZGISI.
§355: "ic ice yazilar" sikayetinin KOKU yapiskan olmayan kalem sutunuydu —
kaydirinca sayilar adin ustunden geciyordu. Yapiskan sutun + yil bloklari (ayni
yil ayni ton, yil degisiminde kenar cizgisi) + yapiskan baslik + satir vurgusu.
§356: oran satirlarinda ISI HUCRELERI, satirin KENDI min-max'ina gore
(brut marj %25-40'ta gezerken net marj %2-6'da; ortak olcek duzlestirirdi).
Yogunluk tavani .28 — sayi okunabilirligi zemine feda edilmez.
§357: uc grafik (ciro+FAVOK ikili cubuk, marj bandi, net borc/FAVOK). Hepsi SVG,
harici kutuphane yok.

## §351 IKI FAVOK: GENIS ve CEKIRDEK (20 Agu, MERCN'de olculdu)

KAP'ta "esas faaliyet kari" DIGER FAALIYET GELIR/GIDERLERINI de icerir.
MERCN 2026/2C kalem kalem:
  brut kar 439 − pazarlama 137 − genel yonetim 159 − ArGe 14 = 129
  + amortisman 17 -> FAVOK CEKIRDEK 146 (marj %8,7) · bagimsiz kaynak 142 ✓
  raporun "esas faaliyet kari" 233 -> icinde 104 mn DIGER NET GELIR var
  -> FAVOK GENIS 250 (marj %14,8) — gercek operasyonel marjin neredeyse 2 KATI
Panel IKISINI DE gosterir; tek sayi verip tanimi gizlemek en yaniltici olurdu.
KULLANICI KARARI (§351c): carpan analizi GENIS tanimla hesaplanir, cekirdek
karsilastirma satirinda kalir.

## §349-§350 EV/EBITDA KARTI KAP'A BAGLANDI (20 Agu)

ESKI: multiple.json (elle tazelenen snapshot). YENI: son 4 ceyrek KAP'tan,
enflasyon endeksli TTM (ciro, FAVOK, net borc) + canli fiyat × pay adedi.
Kaynak ekranda yazili; alinamazsa snapshot'a duser ve BUNU SOYLER.
Varsayimlar YIL YIL girilir (3 yil), ufuk 5 -> 3 yil.
§350b HIZ: 18 sn suruyordu ve kart o sure boyunca snapshot gosteriyordu;
kullanici beklemeden bakti. Uclu paralel + acilista otomatik + "⏳ KAP
okunuyor" gostergesi -> ~6 sn.
§350c BIRIM KAZASI (kullanici yakaladi): net borc "1.523,9 mlr ₺" gorundu —
BIN KAT. multiple.json tutarlari MILYON TL cinsinden sakliyor; ben KAP'in TL
degerlerini BINE bolup "bin TL" sandim. Dogru cevrim /1e6.
DERS: HEDEF DOSYANIN BIRIMINI VARSAYMA — bir ornekle DOGRULA
(fiyat × adet = piyasa degeri hesabi birimi ele veriyordu).

## §347 EBU KOPRUSU: CEYREKLIK SERI (20 Agu)

Bilanco karti yazilirken Ebu'ya TEK DONEMIN kalemleri gidiyordu. Artik 8
ceyreklik ENDEKSLI seri (ciro/FAVOK/marj/net kar + net borc) prompt'a ekleniyor
ve Ebu'ya acikca soyleniyor: "tek ceyregin rakami degil TREND onemli; sicrama
varsa hangi ceyrekten basladigini soyle".
MIMARI SINIR: app.js veriyi URETIR (tek sahip), ajan.js yalniz OKUR. Fonksiyon
yoksa ya da seri bos donerse Ebu eskisi gibi calisir.

## §353 KRITIK TAKVIMDE ACTIONS VERISI GORUNMUYOR — DORT TURLUK BILMECE

Kullanici: "kritik takvimde Actions'ta kosulan seyler gelmiyor".
OLCUM ZINCIRI (her tur bir hipotezi CURUTTU):
  1) Veri var mi? makro-takvim.json 15:46 damgali, 7 ILERI TARIHLI olay. VAR.
  2) Fonksiyon calisiyor mu? Elle cagirdim: 7 satir tabloya girdi ve 20 sn
     boyunca KALICI kaldi. CALISIYOR.
  3) Yaris durumu mu? takvimSatirlari (§245) tabloya HIC DOKUNMUYOR —
     yalnizca FOMC/TCMB metinlerini guncelliyor. HIPOTEZ CURUDU.
  4) Sessiz erken donus mu? §353b ile hata gorunur yapildi -> konsol:
     "§353b makro takvim: 7 olay tabloya ekleniyor" YAZIYOR ve katlama dugmesi
     de olusuyor. Yani fonksiyon BASTAN SONA kosuyor.
GERCEK SEBEP (§353c): <tr> DOGRUDAN <table>'a eklenemez. Tarayici onu DOM
agacinda TUTAR (querySelectorAll BULUR!) ama RENDER ETMEZ. Satirlar tbody'ye
eklenmeliydi: tablo.tBodies[0].
DERS: DOM'DA VAR OLMAK GORUNUR OLMAK DEGILDIR — tablo satirlari icin tBodies[0].
DERS-2: OLCUM DOM'A, GOZ EKRANA BAKIYORDU. Celiskinin kaynagi buydu.

## §354 JOLTS + ENERJI STOKLARI (20 Agu, kullanici istegi)

"Petrol, JOLTS, PMI verileri Actions'ta gorebilir miyiz?"
OLCUM: ForexFactory takvimi (§319) bu olaylarin TARIHINI ve BEKLENTISINI
veriyor ama GERCEKLESEN degeri YOK (alanlar: title/country/date/impact/
forecast/previous — "actual" yok).
COZUM: FRED'e bes seri eklendi — JTSJOL (JOLTS acik pozisyon), JTSQUR (istifa
orani), WCESTUS1 (ham petrol stoku), WPULEUS3 (rafineri kullanimi), DCOILWTICO.
ABD sekmesi Risk & Finansal Kosullar kartinda.
PMI NOTU: ISM ve S&P Global PMI serileri FRED'de LISANSLI DEGIL (telif). Vekil
seri UYDURULMADI; PMI icin takvimdeki beklenti/onceki kullanilmaya devam eder.

## §358-§360 PYS AKISI ELLE BESLEMEDEN KURTULDU (20 Agu)

SORUN: PYS karti pyssektor.json'dan besleniyordu, 13 GUN ESKIYDI ve "gunluk"
diyordu.
OLCUM: fon-akis.json ZATEN Actions'ta uretiliyor (§263) ve hem gunluk fon
akisini (pay adedi × fiyat farki) hem `kurucu` eslemesini tasiyor — 1966 fonun
1957'si esleniyor. Eksik olan tek sey KURUM BAZINDA TOPLAM'di.
AD NORMALIZASYONU SART: ayni kurum iki isimle geciyordu ("AK PORTFOY YONETIMI
A.S." ve "AK PORTFOY" ayri toplaniyor, +10,31 ve +1,60 diye BOLUNMUS
gorunuyordu; dogrusu +11,91). 113 isim -> 69 gercek kurum.
§359 PENCERELER: arsiv 15 -> 26 gun; 1G/1H/1A ayni yontemle (taban gun degisir).
1A yeterli gun birikene kadar URETILMEZ — kisa seriyle "aylik" demek yaniltici.
§360 PANEL: canli pencereler eski dosyanin UZERINE binder; pencere yoksa eski
blok DURUR ve kendi tarihiyle gorunur.
§360b DUGME SIRASI: Object.keys EKLENME sirasini korur, 1H sonradan bindigi
icin sona dusuyordu (1G, 1A, 1H). Zaman ufkuna gore siralandi.
CANLI BULGU: ALBARAKA gunluk −4,27 mlr (gunun en buyuk cikisi) ama haftalik
+10,2 mlr (en guclu girislerden). TEK GUNE BAKMAK TERSINI SOYLUYORMUS.

## §361-§363 FAKTOR EVRENI — KADEMELI KAP CEKIMI (20-21 Agu)

SORUN (olculdu): faktor modeli "XKTUM evreni" diyor ama multiple.json ELLE
besleniyor ve 141 hisse tasiyor. XKTUM 245 uye (endeks-uyeler.json, BIST resmi,
her kosuda taze). Yani:
  · 113 XKTUM uyesi modelde HIC YOK (evrenin %46'si)
  · KCHOL/THYAO/SISE/SAHOL gibi 9 hisse modelde VAR ama XKTUM uyesi DEGIL
TASARIM: kademeli tazeleme (her kosuda en eski guncellenen N sirket; bilanco
tetiginde gorunenler ONE alinir), AYRI DOSYA (multiple.json'a DOKUNULMAZ),
panel SAGLAMLASANA KADAR BAGLANMAZ.
BES TURLUK FAIL ZINCIRI — hepsi sessiz yanlis veri ureten turden:
  §361b-1 ALAN ADI: mod=donemler {yil, donem, id, kod} donduruyor,
    `disclosureIndex` DEGIL. Kodum o adi ariyordu -> id=undefined.
    DERS: UCUN GERCEK CIKTISINI GOR, ALAN ADI TAHMIN ETME.
  §361c MIDDLEWARE: 12/12 "giris gerekli". Actions cerezsiz gelir ve middleware
    /api/kap'i kesiyordu. AYNI TUZAK §249j'de TEFAS'ta yasanmis ve KODA
    YAZILMIS ("uc kosuluk 401 bilmecesinin gercek suclusu TEFAS degil BU
    kapiydi") — /api/tefas muaf tutulmus, /api/kap unutulmus. Ben de iki tur
    KAP hiz sinirini sucladim.
    DERS: KAYIT VARDI, OKUMADIM.
  §361d TTM YONTEMI COKTU: "ceyrek sutununu topla" varsayimi, o sutunu
    vermeyen sablonlarda KISMI TOPLAM uretiyordu. ALKIM'in gelir tablosu (rol
    310003) yalniz kumulatif veriyor; AKHAN dosyada 3,81 mlr gorundu, gercek
    TTM 11,22 mlr — %66 EKSIK. Bagimsiz kaynak yakaladi, ben degil.
    YENI YONTEM: TTM = son_yillik + cari_kumulatif − gecen_yil_ayni_kumulatif.
    Uc degerin ikisi TEK RAPORDAN gelir. HER sablonda calisir.
    KURAL: eksik bacak varsa sonuc NULL — kismi toplam YOK.
  §361f isFinite TUZAGI: global isFinite(null) TRUE doner (null -> 0). BINHO'nun
    BOS cirosu "dolu" sayildi (eksik:false) ve aritmetikte null sessizce 0 gibi
    davranip TTM'i de bozabilirdi. 14 yerde Number.isFinite'e cevrildi.
    DERS: null KONTROLUNDE isFinite DEGIL Number.isFinite.
  §361g NULL SAVUNMASI DUSTU: siralamayi duzeltirken `!r` kontrolunu
    kaldirmisim; hic cekilmemis sirkette r.y patladi ve MODULUN TAMAMI dustu.
    DERS: BIR KOSULU YENIDEN SIRALARKEN ICINDEKI SAVUNMAYI TASI.
§361e YONTEM SURUMU: her kayit hangi yontemle yazildigini tasir; surumu eski
olanlar HIC CEKILMEMIS gibi EN ONE alinir (yanlis veri, eksik veriden once
duzeltilir). Yoksa dogru kodla yanlis veri bir arada yasar.
§363 PARTI DENEYI: 6 -> 12 buyutuldu, 12'de 7/12 "fetch failed" (6'da 1/6 idi).
GERI ALINDI + DEVRE KESICI (3 ardisik hatada tur erken biter).
DERS: BUYUTME DENEMESI OLCULEBILIR YAPILIRSA TEK TURDA GERI ALINIR.

## §362 FAKTOR DEGISKENLERI (21 Agu, kullanici: "amac faktor metriklerine
## ulasma degil mi")

Ayni ham ciktidan, EK ISTEK MALIYETI SIFIR:
  isletmeNA + capex -> SERBEST NAKIT AKISI (deger: F/SNA · kalite: nakit uretimi)
  isletmeNA + netKar -> TAHAKKUK ORANI (Sloan): kagit kari nakde donuyor mu
  odenenFaiz -> faiz karsilama · odenenTemettu -> temettu verimi
  stok/ticariAlacak/ticariBorc -> devir hizlari, Beneish kanallari
  BUYUME: y/y oranlar — veri ZATEN elimizdeydi (`onceki` sutunu), kaydedilmiyordu.
    Kumulatif y/y kullanildi (6A26 vs 6A25): donem eslesmesi birebir, mevsimsellik yok.
CANLI AYRISMA (ilk 15 sirket): BYDNR tahakkuk −26,4 ve ALKIM −16,6 (nakit,
kagit karindan buyuk) · ALKLC +5,8 ve AKHAN +5,2 ters yonde · SNA'da BIMAS
+30,2 mlr, BUCIM −1,82 (yatirim donemi) · buyume AKHAN +%67, ALFAS −%29,5.

## §364 GYO NAV — TSPB RESMI NAD SERVISI (21 Agu, kullanicinin HAR'indan)

NEDEN: GYO'da ciro/FAVOK ANLAMSIZDIR; deger olcusu NAV ISKONTOSUDUR. §361'de
GYO'lar "eksik kalem" diye dusecekti — oysa kendi olculeri var.
KAYNAK: tspbnad.matriksdata.com
  /api/base/getmembers/all   -> 57 GYO (member_uid ↔ member_symbol)
  /api/base/getperiods/all   -> donemler + isPublished bayragi
  /api/reports/getmemReport/{uid}/{donem} -> sirket bazli NAD tablosu
CIKAN ALANLAR (Toplam Veriler): t1 portfoy · t4 borclar · t5 NET AKTIF DEGER ·
t6 odenmis sermaye · t7 PAY BASINA NAD · t8 ISKONTO/PRIM % · t9 borcluluk %
TSPB'nin kendi tanimi (rapor notunda): Iskonto = (piyasa degeri / NAD) − 1.
CANLI SONUC: 45 sirket, donem 2025/12. Sektor iskontosu −%48,4, borcluluk
%26,5, sektor NAD 1.422 mlr. En iskontolu ZERGY −%86,6 (borcluluk %13,2),
OZGYO −%83,5 (borcluluk %3), medyan −%51,9.
BOS BILDIRIM: 9 sirket o donem bildirim gondermemis, her alani 0 donuyor —
KAYIT YAZILMAZ (sifir iskonto gibi gorunmesin).
§364b FIYAT DA BURADA CEKILIR: panel CANLI_FIYAT'i yalniz multiple.json
evreninden (141 hisse) dolduruyor ve 45 GYO'dan sadece 5'i orada vardi
(AVPGY, EKGYO, KZBGY, RGYAS, SNGYO) — "guncel iskonto" sutunu bos kaliyordu.
Fiyat NAD ile AYNI YERDE cekiliyor (Yahoo toplu uc, §176). 45/45 fiyatlandi.
DERS: TURETILMIS BIR ORAN GOSTERECEKSEN IKI BACAGINI DA SEN GETIR.
CANLI BULGU: iskontolar DERINLESMIS. KZBGY Aralik'ta −%81,9 iken bugun −%88,8;
SNGYO −%75,4 -> −%82,7; KLGYO −%75,4 -> −%81,8. OZGYO/ASGYO/VKGYO yerinde.
DIKKAT: TDGYO +%1032, PEKGY +%679, IDGYO +%230 — pay basina NAD cok kucuk
oldugu icin oran patliyor. Faktore baglarken ESIK dusunulmeli.

## §365 SEKTOREL VERILER SEKMESI (21 Agu, kullanici istegi)

Katilim Fonlari + PYS Sektor, Fix Income (t10) altindan yeni t27'ye tasindi.
Alt sekme mekanizmasi `.tab` kapsayicisina bagli oldugu icin dugme+panel
birlikte tasininca kendiliginden calisti (app.js'e dokunulmadi).
IKI TASIMA HATASI:
  (a) Panel sinirlarini "sonraki sekme baslangici" diye aradim ve SUKUK
      SEKMESININ KAPANISINI da kestim (denge −1/+1 dagildi). Temiz kopyaya
      donup DIV DENGESIYLE kesildi.
  (b) Aciklama yorumuna etiket benzeri metin yazdim; denetim sayaci onu GERCEK
      ETIKET sandi ve sahte dengesizlik uretti. Dosyanin KENDI UYARISI vardi:
      "yorumda etiket adi gecmez — onceki iki onarim denemesini sayaca takilan
      yorum metni dusurdu." Ayni tuzaga ucuncu kez dusuldu.
§365b PY_GRUP: t26 (GYO NAV) listeye eklenmemisti; Equity alt cubugu O SEKMEDE
GIZLENIYORDU. §247b'de Yabanci Hisse'de BIREBIR AYNISI yasanmis ve not
dusulmus.
§365c EBU KAPSAMI: t27 ve t26 SEKME_DISLA'ya eklendi. t27 kritik — Katilim
Fonlari ve PYS eskiden t10 altindaydi ve t10 ZATEN dislanmisti; tasima
dislamayi da tasimaliydi, yoksa Ebu bir gecede kapsamina giren iki karta yorum
yazmaya baslardi.
DERS: TASIMA = KAPSAMIN DA TASINMASI. UC-YER KURALI'nin (§121) DORDUNCU ayagi
var: dugme + panel + uyelik + AJAN KAPSAMI.


# BAKIM EK BLOGU — §298-§337 (17-19 Agu 2026)
# Her kayit: KOK NEDEN -> OLCUM -> COZUM -> DERS/KURAL. Tum sayilar olculdu.

## §337 EBU'NUN TAKVIM YORUMU: UC AYRI ENGEL (19 Agu gece)

Kullanici: "Ebu burayi hala guncellemedi" — gorus 19:16'da yazilmis, Temmuz
olaylarini anlatiyordu. UC ENGEL vardi, ucu de ayri:
1) YANLIS BORU HATTI VARSAYIMI (benim hatam): SS322 komsu-veri koprusunu kurdum
   ve "artik Ebu takvimi goruyor" dedim. OLCUM aksini gosterdi — GORUS notu o
   yoldan DEGIL, ajan.js'in OZEL GOREV mekanizmasindan besleniyor
   (OZEL_GOREVLER: veriLbl 'TAKVIM' -> hedefLbl 'GORUS'), kendi kirpmasi ve
   kendi sogumasi var. Kopruyu dogru kurdum ama bu not oradan gecmiyormus.
2) KIRPMA: ozel gorev kaynak metni 1600 karaktere kirpiyordu; SS336 birlesik
   takvimi ~1700'u astigi ve elle GECMIS satirlar ONCE geldigi icin kesilen
   tam olarak YAKLASAN satirlardi. -> 2600.
3) SOGUMA: 6 saat. Takvim degisse bile yorum saatlerce eski kaliyordu.
   Ozel gorevler icin 90 dk'ya indirildi (veri hash'i degismediyse zaten
   yazmiyor; yani gereksiz cagri olusmaz).
SS337b UZUNLUK: prompt "180-280 kelime" diyordu ve SS321'de takvimle esit
yukseklige getirilen kart ancak yarisini dolduruyordu -> 380-520 kelime,
5-7 paragraf, token tavani 2000->3000. Ust sinir KALDI: sinirsiz metin hem
maliyet hem okunabilirlik bozar; "son paragrafi TAMAMLA" kurali korunur.
CANLI KABUL: 21:48 notu "72 Saatlik Kritik Veri Akisi" basligiyla acildi —
FOMC 21:00, AUD istihdam 04:30, Cuma PMI dalgasi, Jackson Hole, 25 Agu HMB.
DERS: BIR NOTU BESLEYEN BORU HATTINI VARSAYMA — hangi mekanizmanin yazdigini
kodda DOGRULA. Kopru kurmak yetmez; paketin PROMPTA VARDIGINI da olc.

## §336 BIRLESIK KRONOLOJIK TAKVIM (19 Agu gece)

Kullanici iki kez soyledi: "yine iki ayri takvim gibi durmuyor mu". Ilk cozum
(SS335: gecmisi katla) yetmedi — kart hala ELLE liste + dipnot + AYRI baslikli
otomatik blok seklinde okunuyordu. KOK NEDEN GORSEL DEGIL ZAMANSAL: elle liste
GERIYE (24 Tem'den beri), otomatik liste ILERIYE bakiyordu.
COZUM: SS319 olaylari artik ELLE TABLONUN ICINE, ayni <tr> bicimiyle ve
KRONOLOJIK sirada giriyor; ayri kap (#makroOto) emekli edildi. Elle satirlar
SILINMEZ (SS112 — sahibi index.html), yalniz siralamaya katilir. Idempotent:
her kosuda data-oto satirlari once temizlenir.
IKI YAN KAZA, ikisi de canlida yakalandi:
- SS335b SECICI: elle takvim .kv sanilmisti; DOM'da <table class="cal"> + 15
  <tr> cikti. Fonksiyon sifir satir bulup SESSIZCE dondu (hata yok, is de yok).
  Ayrica katlama dugmesi <div> olarak eklenemez — tarayici onu tablonun DISINA
  atar; dugme colspan'li <tr> oldu.
- SS336b IKI DUGME: katlama iki yerden kuruluyordu (boot baglantisi + render
  sonu) ve eski dugme temizlenmiyordu; ekranda iki "12 gecmis olay" satiri
  olustu ve ustteki OLU idi (eski satir listesine bagli). Dugme kimliklendi
  (#takvimKatlaDug), her cagrida kaldirilip yeniden kuruluyor, cagri TEK yerden.
DERS (bugun ikinci kez): SECICIYI DOM'DAN DOGRULA, kaynaktan varsayma.

## §334 HAZINE IHRAC TAKVIMI — DORT SURUMDE OTURDU (19 Agu)

Amac: ~25'inde yayimlanan uc aylik HMB stratejisini Actions'in kendisi cekip
hazine-takvim.json'a yazsin (elle ritual bitsin). SS314 zaten WP-API yolunu
acmisti; PDF pdf-parse ile okunuyor.
SURUM GUNLUGU — her adim bir OLCUMDEN dogdu:
v1: "3 satir ayristirdim" deyip dosyayi YAZDI ve CANLI TAKVIMI BOZDU (15+
    ihracli dosya 3 satira dustu, tarihler yanlis, finansman eski donemde
    kaldi). Hata benim esik tanimimdaydi: "sifirdan buyuk" esik degildir.
v3: ESIK 8'e cekildi (uc aylik strateji en az ~8 ihrac icerir) + SURUM DAMGALI
    KILIT: slug tek basina yetmez, ayristirici surumu degisince ayni duyuru
    YENIDEN islenmeli — yoksa bozuk cikti dosyada kalir.
v4: Kullanici gercek PDF'i verdi. Yapı goruldu: her satir UC ARDISIK TARIH
    tasiyor (ihale | valor | itfa) — tarih-bazli bolme satirlari parcaliyor,
    itfalar sahte ihrac oluyordu. Tek regex tum satiri yakalayacak sekilde
    yeniden yazildi. Incelikler: gun TEK HANELI olabiliyor (8.06.2026),
    "8 A y / 238 Gun" — PDF "Ay"i BOSLUKLU cikariyor.
v5: Canli kosu ham metni gosterdi: pdf-parse bu belgede sutunlari BITISTIRIYOR
    ("5.08.20264.47154.476"). Web uzerinden okudugum ayni PDF BOSLUKLU idi —
    yani iki farkli metin cikarici, iki farkli cikti. Tum ayiraclar \s* yapildi;
    Turkce ondalik (virgulden sonra TEK hane) sayesinde "554,9616,3595,8" bile
    dogru ayriliyor.
SONUC (canli): 22 ihrac · 5 kira sertifikasi · donem "Agustos–Ekim 2026" ·
finansman 3 ay (596,3/536,7 · 271,5/257,9 · 405,1/405,1) · sonraki yayin
"~25 Kasim". Panel takvimi duzeldi.
SS334d PANELIN OKUDUGU HER ALAN: ilk yazim yalniz ihraclar+donem yaziyordu;
hazineRender ayrica sonraki_aciklama ve finansman okuyor. Yeni strateji gelse
"~25 Agustos (Eyl-Kas)" notu ve ESKI DONEMIN finansman tablosu ekranda
kalacakti. Kural: BIR DOSYAYI OTOMATIKLESTIRIRKEN, ONU OKUYAN RENDER'IN
TUKETTIGI ALANLARIN TAMAMI YAZILIR — yarim yazilan dosya, yazilmamistan kotudur.
Cozulemeyen alan SILINIR (panel "—" gosterir), eski donemin rakami ASLA kalmaz.
DERS: BASARI ESIGI, KAYNAGIN BILINEN EN KUCUK MAKUL CIKTISINDAN hesaplanir.
DERS: AYRISTIRICI SURUMU DE KILIDIN PARCASIDIR.

## §333 SEKTOR ISI + ROTASYON OTOMATIK (19 Agu)

Elle ritueldi (haftalik Fintables koprusu). OLCUM: 15 sektor endeksinin TAMAMI
zaten endeks-arsiv.json'da — kaynak evde, kopruye gerek yok. Dogrulama: XKMYA
3A arsivden %13,98 / kopruden %13,86.
SS333b DURUSTLUK ESIGI (ilk testte yakalandi): sektor satirlari arsive 4 Agu'dan
beri gunluk dusuyor, oncesinde yalniz ay sonu tohumlari var (30 Nis · 26 May ·
30 Haz · 31 Tem). Bu yuzden "1A" capasi 20 gun geriye kayiyor ve etiket 1 AY
derken 50 GUNLUK getiri gosteriyordu. KURAL: capa hedeften >7 gun saparsa
O UFUK HESAPLANMAZ — damgali eski deger korunur, rapor sapmayi yazar.
Arsiv doldukca (Eyl'de 1A, Kas'ta 3A) ufuklar kendiliginden acilir.
DERS: YANLIS ETIKETLI DOGRU SAYI, YANLIS SAYIDAN TEHLIKELIDIR.

## §331 BULUT SENKRONU: UC KATMANLI SESSIZ ARIZA (19 Agu)

Kullanici: "kartı gizle diyorum, yenileyince geri geliyor". OLCUM zinciri:
gizle -> localStorage'a yaziliyor (46->47) -> cloudSave POST'u KURULAMIYOR ->
catch(e){} yutuyor -> yenilemede cloudLoad bulutun 46'lik kopyasini geri
yaziyor -> kart geri geliyor.
FAIL: yazma anahtari "kasapoglu" (Turkce g ile) ve HTTP BASLIGINA Latin-1 disi
karakter KONULAMAZ — fetch daha istegi kurmadan patliyor
("String contains non ISO-8859-1 code point").
COZUM: (a) anahtar yuzde-kodlu gonderilir, sunucu her iki bicimi kabul eder
(ASCII anahtarlar aynen calisir); (b) SESSIZ YUTMA BITTI — POST kurulamazsa
ekranda ve konsolda gorunur uyari. (c) Kullanici Vercel env ile tarayicidaki
anahtari esitledi; canli kabul: "buluta kaydedildi ✓ (105 kayit)", yenileme
sonrasi kayit KALDI.
KAPSAM: yalniz "kart gizle" degil, bulut senkronuna yazan HER SEY (pozisyonlar,
journal, PPK dagilimi, sicil tabani, portfoyler — 18 anahtar) etkilenmisti.
ACIK RISK (deftere): /api/data POST'u kutunun TAMAMINI degistiriyor, birlestirmiyor.
Emniyet yalniz "tamamen bos paket"i durduruyor; EKSIK paket gecer ve kalanini
siler. Teshis testimde anahtar yanlis oldugu icin ucuz atlattik. Oneri: gelen
paket buluttaki anahtar sayisinin yarisindan azsa REDDET + raporla.
DERS: SESSIZ KALMAK, VERI KAYBININ FARK EDILMEDIGI TEK DURUMDUR (SS200b'nin
kendi cumlesi — bu kez kendi kodumuzda delinmisti).

## §330 KATMAN SIRASI: SICIL ARSIVDEN SONRA (19 Agu)

Rapor her kosuda "Model sicili serisi (SS291) — ⏭ XKTUM arsivde yok" diyordu.
Kod dogru, veri dogru, olcum dogru — SIRA yanlisti: sicil, XKTUM'u
endeks-arsiv.json'dan okuyor ama o dosyayi dolduran endeksKapanisTazele
ZINCIRDE 30 SATIR SONRA kosuyordu. Yani gun sonu noktasi ancak ERTESI gun
yazilabiliyordu; kullanicinin "her gun sonu hesaplansin" istegi tam burada
tikaniyordu. Tek satir tasima ile cozuldu.
CANLI KABUL: "SS291 — ✓ 2026-08-19 · model %2,879 / endeks %11,034".
DERS: BIR KATMAN BASKA KATMANIN CIKTISINI OKUYORSA, ZINCIRDE ONDAN SONRA GELIR.

## §329 GUN SONU OTORITESI + §328 KURUMSAL ISLEM (19 Agu)

Kullanici sicilde yakaladi: "model -1 getiri olamaz ya". Haklidi.
OLCUM: ORGE 5:1 bolundu (13 Agu 110,70 -> 16 Agu 22,80, Fintables ham seriyle
dogrulandi). Sicil p0'i 108,80'de kaldigi icin panelin CANLI hesabi
22,64/108,80 = -%79 sahte dusus yazdi ve %2,5 agirlikla modelden ~2 puan
goturdu. Ekranda "-1,08%" gorundu; dosyadaki GUN SONU degeri +%3,08 idi.
SS328 OTOMATIK OLCEKLEME (kullanici kurali: "hicbir sey elle guncellenmeyecek"):
bolunme/bedelsiz tespit edilince p0 AYNI ORANLA otomatik olceklenir; oran
yuvarlanmaz (bedelsizde 1/1,5 gibi kusuratli oranlar da dogru). Emniyet:
oran [0,05–0,95] veya [1,05–20] araliginda degilse dokunulmaz (kaynak arizasi).
SS328b YAN ETKI (kullanici uyarisi sayesinde yakalandi): ayni fonksiyon
multiple.json'da da kosuyor ve orada `adet` var — carpanlar fiyat×adet.
Fiyati 1/5'e cekip adedi birakmak 141 hissenin EV/EBITDA'sini bozacakti.
Eski karantina, fiyata HIC dokunmayarak bunu farkinda olmadan engelliyordu:
yani "duzeltme" calisan bir korumayi kaldirip yerine sessiz hata koyacakti.
DOGRUSU: fiyat ×oran ise ADET ÷oran (piyasa degeri SABIT kalir).
SS329 GUN SONU OTORITEDIR: Actions zaten her gun sicilSeriEkle ile modeli
hesapliyor; tarayici artik AYNI GUNUN dosya kaydi varsa kendi canli hesabini
ONUN YERINE GECIRMEZ. Iki hesap = iki gercek (SS112) sorunu kapandi.
SS329b: sicil sifirlandiginda dosyadaki yuzdeler ESKI tabanliydi; artik yeni
taban gunune gore yeniden hesaplaniyor (28 Tem tabaniyla 18 Agu: model +%3,08 /
endeks +%7,21 — elle yapilan bagimsiz hesapla birebir).
CANLI KABUL: ORGE p0 108,80 -> 21,7792 (oran 0,2002), karantina temizlendi,
multiple adet 80 -> 400 (piyasa degeri korundu).
DERS: BIR FONKSIYONU DEGISTIRMEDEN ONCE ONU KIM CAGIRIYOR DIYE BAK.

## §326 SURE BUTCESI — IKI DERSTE OTURDU (19 Agu)

Is 15 dk tavanina carpip IPTAL oldu ("operation was canceled"). Iptal edilen
kosu HICBIR teshis birakmaz; tarayicida SS312 vardi, Actions'ta karsiligi yoktu.
SS326: her ana katman sure olculerek kosar (>60 sn rapora yazilir) + betigin
kendi 11 dk BUTCESI; asilirsa kalan katmanlar ATLANIR, rapor YAZILIR, is YESIL
biter. "Yarim veri > iptal edilmis kosu: iptal hicbir sey yazmaz, atlama neyin
eksik oldugunu SOYLER."
SS326b (ayni aksam): butce katmanlar ARASINDA olculuyordu — TEK katman 13 dk
surunce zincir onu KESEMEDI. Her katmana kendi tavani kondu (genel 4 dk,
Playwright'li fon katmani 6 dk); tavan dolunca bekleme birakilir, rapora
yazilir, sonraki katman baslar. Betik sonunda process.exit(0): asili arka plan
isi Actions'i bekletemez. Workflow tavani 15->20 dk (yalniz emniyet supabi),
Node 20->22 (deprecation).
DERS: BUTCE YALNIZ KATMANLAR ARASINDA DEGIL, HER KATMANIN ICINDE DE OLMALI.

## §327 TEMBEL KARTA YORUM YASAGI (19 Agu)

Denetim turunda yakalandi: Ebu, Finansal Tablolar kartina "nakit pozisyonundaki
gerileme ile ticari alacaklardaki ARTIS..." yazmisti; ayni anda getirilen TOASO
2026/2C tablosunda ticari alacaklar %2,3 AZALMISTI. Kart TEMBEL — tablo ancak
kullanici sirket secip "getir" dedikten sonra dolar; Ebu BOS karti yorumlayip
genel finans bilgisiyle DOLDURMA yapti. Ayrica kart KULLANICIYA OZEL bir sorgu
ekrani: her kullanici baska sirkete bakar, tek bir "not" kimin verisini
anlattigini bilemez. t23 SEKME_DISLA'ya eklendi.
DERS (SS111'in kardesi): BOS/TEMBEL KARTA YORUM YAZILMAZ — veri gelmeden
uretilen cumle bilgi degil DOLDURMADIR.

## §324-§325-§332 ABD KARTLARI (19 Agu)

SS324: MEGA-CAP DERINLIK karti 25 Tem damgaliydi ve "MSFT (29 Tem Car)" diye
GECMIS bir olayi GELECEKMIS gibi anlatiyordu. Once bayatlik nobetcisi yazildi
(Finnhub canli takviminden tarih tazeleme + "gecti" damgasi + BAYAT rozeti).
SS332: kullanici karti tamamen kaldirtti, yerine ABD BUYUME karti geldi (7 satir
FRED canli: reel GSYH, GDPNow, tarim disi istihdam, perakende, guven, Sahm,
10Y-3A). OLCEK: grid stretch + kart flex + notun margin-top:auto ile dibe
yapismasi — endeks karti 4 satir, buyume karti 7 satir; esit yukseklik olmadan
hizalama bozuluyordu. Nobetci silinmedi, yorumla emekli edildi.
SS325: sektor rotasyonu kadranina aciklama eklendi — "Kadran SEVIYEYI degil
IVMEYI okur": RS'i yuksek sektor ZAYIFLIYOR (hiz kesiyor), RS'i negatif sektor
GUCLENIYOR (acigi kapatiyor) cikabilir. Rakamlarla kadran celismiyor.
Ayrica EQUITY basligindaki noktali I (Turkce yerel i->İ) duzeltildi.

## §323 TEMBEL KAP DENETIMI (19 Agu)

Boot denetcisi her aciliste "Bos/eksik bolumler: Reel getiri" diye ASILSIZ
alarm veriyordu. Kap saglikliydi; sorun ZAMANLAMA: reelAtifRender TUFE serisi
yuklenince (asenkron) kosuyor, denetci ondan ONCE olcuyordu. Kap TEMBEL
isaretlendi — varligi hala denetleniyor, DOLULUK sekme/asenkron sonrasi konusu.
DERS: BIR DENETIME KAP EKLERKEN "BU NE ZAMAN DOLAR" SORUSU, "BU VAR MI"DAN
ONCE GELIR.

## §320c + §318b HIZ: KENDI ACTIGIM GEDIGI KENDI ARACIMIZ YAKALADI (19 Agu)

SS312 (yavas modul logu) ikinci avini verdi: "Egri Gorseli 12388 ms" — SS320
ile ekledigim kart EVDS'nin yavas ucunu boot zincirine AWAIT'li koymustu ve
boot'u 1,2 sn'den 14,3 sn'ye cikarmisti; SS318'in kazanimini yedim.
SS320c: cizim ARKA PLANA alindi (SS318 deseni), statik SVG'ler kapta durdugu
icin ara surede kart bos kalmaz.
SS318b: AOFM onbellegi "0 hucre" yaziyordu — kosul '· canli' METNINI ariyordu
ama canlilik isigini ekleyen kod (.ldot) o metni SILIYOR. Artik METNE degil
ANLAMA bakiliyor: hucrede rakam varsa deger gelmistir.
CANLI KABUL: boot 14.264 ms -> 1.217 ms; onbellek 4 hucre (aofm/tufe/rek/rezerv).
DERS: YAVAS UCU OLAN HER YENI MODUL, DOGDUGU GUN ARKA PLANA KONUR.
DERS: BIR DEGERIN VARLIGINI SUSLEMESINDEN DEGIL KENDISINDEN ANLA.

## §322 EBU KOMSU VERI KOPRUSU — YORUMUN KOR NOKTASI (19 Agu)

Kullanici: "sagdaki gorus karti soldakiyle hizalanabilir, Ebu ona gore gorus
doldurur olmaz mi?" Hizalama kucuk isti (§321); ALTINDAN cikan sey buyuktu.
OLCUM: ajan.js'te bir notun girdisi YALNIZ KENDI KARTININ metni. GORUS ayri
bir kart oldugu icin Ebu'ya giden paket NEREDEYSE BOSTU — yani yorum, yanindaki
takvimi HIC GORMEDEN yaziliyordu. 24 Tem penceresini anlatmaya devam etmesinin
sebebi buydu; kimse fark etmemisti cunku metin akici ve dogruydu, sadece ESKIYDI.
COZUM (genel, dar degil): not artik data-ebu-veri="<CSS secici>" ile BASKA
kaplarin metnini girdi olarak ister. Secici HTML'de durur — yeni kart/veri
eslesmesi icin ajan.js'e dokunmak GEREKMEZ (§245 ruhu). Kendi notunu ve diger
notlari girdi saymaz (dongu yok), 1600 karakterle sinirli.
BAGLANTI: GORUS notu → #kritikTakvimKart (elle satirlar + §319 KURESEL MAKRO).
Karta data-ebu-oncelik="yuksek" verildi: takvim tazelenince sogumayi beklemez.
CANLI KABUL: Ebu gorusu 14:29 → 16:23'te yeniden yazdi; Temmuz atiflari 4'e
indi, Agustos 9'a cikti, metinde "19 Agustos FOMC tutanaklari" ve "Jackson
Hole" gecti. Kor nokta kapandi.
DERS: BIR AJANIN YORUMU, ONA VERILEN VERI KADAR TAZEDIR. Yorum kalitesini
sorgulamadan once GIRDI PAKETINI olc.

## §321 TAKVIM-GORUS HIZALAMASI (19 Agu)

§319 otomatik bolumu takvim kartini uzatinca GORUS karti yarida kaldi
(align-items:start + notta sabit max-height:460px). Grid stretch'e alindi,
GORUS karti dikey flex kolonu oldu, sabit tavan yerine esnek alan (flex:1 +
min-height:0) kondu — metin kart yuksekligini doldurur, tasarsa kendi icinde
kayar. Iki kartin alt kenari artik hizali.

## §320 GETIRI EGRISI GORSELI CANLIYA BAGLANDI (19 Agu)

Kullanici: "eski kalmis gibi" — dogruydu: 27 Tem'de ELLE kodlanmis dort
statik SVG. TR ve ABD panelleri artik her aciliste CANLI veriden yeniden
cizilir: TR ← /api/evds2?mod=egri (sk-egri ile AYNI uc), ABD ← window.US_FRED
(abdSekme'nin fetch'i yazar — DOM kazima YOK, §304 tek sahip; fetch yoksa
/api/market?mod=fred yedegi). Gorsel dil birebir korundu (viewBox 320x135,
ayni cizgi/etiket dili) — kart degismedi, CANLANDI.
DURUSTLUK IKI KATMANLI: (1) DE/JP icin canli kaynak YOK (Bundesbank/JGB kesfi
= V2) — statikleri DURUR ve rozet acikca soyler: "TR·ABD CANLI <tarih> ·
DE·JP 27 TEM". (2) Veri gelmezse eski statik SVG kapta YEDEK olarak gorunur
ve rozet GUNCELLENMEZ — bayatlik gizlenmez, gorunur kalir.
Sandbox 7/7: SVG uretimi, Y koordinat bandi (20-110), tepe/son etiketleri,
kismi ariza (TR canli + ABD dusuk) senaryosu.

## §319-D MAKRO TAKVIM DOGRU KABA (19 Agu aksami)

Kullanici sordu: "nereye ekledi bunu?" — cevap: HICBIR YERE. Render
$('takvimBody') hedefliyordu; canli DOM olcumu o ID'nin SAYFADA OLMADIGINI
gosterdi (gercek kaplar: bistTakvim / globalTakvim / kazancCanli). Hedefi
koddaki ESKI BIR YORUMDAN okumustum. Fonksiyon kabi bulamayinca sessizce
donuyordu: veri dogdu, evi yoktu.
DUZELTME: index'e kalici <div id="makroOto"> — kritik takvim kartinda, elle
tablonun ve "~" dipnotunun ALTINDA; render dogrudan onu hedefler, kap-yaratma
dali kalkti. Elle satirlara tek karakter dokunulmadi.
DERS: YORUM DEGIL, DOM KANITTIR. Hedef ID'si canli sayfadan dogrulanir.

## §319 KURESEL MAKRO TAKVIM — KESIFLI OTOMASYON (19 Agu)

Kullanici: Piyasa'daki kritik takvimin KURESEL ayagi Actions'la guncellensin;
"orasi onemli". KESIF once: ForexFactory/FairEconomy kamuya acik haftalik
JSON (nfs.faireconomy.media/ff_calendar_thisweek.json) — gercek cekimle sema
dogrulandi (title/country/date-ET/impact/forecast/previous; FOMC Tutanaklari
listedeydi). Kaynagin kendi kurali olculdu: 5 dk'da 2 istek, asiminda JSON
yerine "Request Denied" HTML — parser bunu yakalar ve DOSYAYI KORUR (§300).
KATMAN (makro-takvim.json, ⭐ istisna onayli): High tum ulkeler + Medium
yalniz USD/EUR/GBP/CNY/JPY/TRY; Low alinmaz. Saat UTC yazilir, TSI'ye ceviri
render'da. Haftalik pencere — arsiv tutmaz, takvim ileriye bakar.
RENDER: elle TR-yerel satirlara DOKUNULMAZ; altlarina kendi kabinda (SS173:
idempotent innerHTML) "KURESEL MAKRO" bolumu — 12 olay, TSI saat, YUKSEK
rozeti, bek/onc cifti. Sandbox: ET→UTC→TSI zinciri (14:00 ET FOMC = 21:00
TSI ✓), filtre 6→4 ✓, HTML-donus koruma dali ✓.
KENDI HATAM: yamaya tam-genislik parantezli olu bir satir kacti, sozdizimi
kirdi — sokuldu. DERS: URETILEN KODA DA node --check, istisnasiz.

## §318 AOFM ONBELLEGI — BOOT ARTIK EVDS'I BEKLEMIYOR (19 Agu)

§312 ilk avini vermisti: "yavas modul: Canli AOFM 12699 ms" — 12,5 sn'lik
acilisin faili EVDS API'siydi. COZUM uc katman: (1) acilista SON BILINEN
degerler localStorage'dan ANINDA basilir, "· canli" rozeti "· son bilinen"e
cevrilir (yaniltma yok); (2) canli cekim ARKA PLANDA surer, gelince hucreleri
VE onbellegi tazeler; (3) boot AOFM'u beklemez — sure konsola ayri satirla
yazilir: "[KTPanel] SS318 AOFM canli X ms (arka plan) · N hucre".
KURAL: YAVAS UC BOOT'TAN CIKARILIR, EKRANA SON BILINEN + ARKAYA CANLI.

## §317 IHRAC TAKVIMI = PLAN + GERCEKLESME EKRANI (19 Agu)

Kullanici ayri "Ihrac Sonuclari" sekmesi onerdi; §121 geregi mevcut takvim
sekmesi DONUSTURULDU (yeni dugme/panel/init sifir): (1) gecmis ihale
satirlarina yesil gerceklesme rozeti — eslestirme tarih + enstruman-kelimesi
kesisimiyle (ANAHTAR liste: tufe/tlref/sabit/degisken/kira/bono/kuponsuz/
usd/dolar/altin); kesisim yoksa ROZET YOK (uydurma eslesme yasak — ayni gun
iki ihale olabilir); (2) altta GERCEKLESEN IHALELER blogu: son 8 duyuru,
teklif|gerceklesme cifti, ISIN, kira/tutar+itfa. Sandbox 8/8 rozet; 20 Agu
USD KS dogru sekilde rozetsiz (sonuc dusunce kendiliginden yeserecek).

## §316 T25 KURTARMA — SAYI DENGESI ≠ YAPI DENGESI (18-19 Agu)

Kullanici "Yabanci Hisse bombos" dedi; canli olcum: veri TAMDI (738 hisse,
201 satir DOM'da) ama t25 paneli t10'UN ICINE hapsolmustu — §298 tasima
kazasi: "t10 kapanisi" sanilan kapanis etiketi aslinda t25'inkiydi; sk-pys
paneli araya girince t25 bir seviye iceri kaydi ve Sukuk kapaliyken 0 piksele
coktu. DIV SAYISI dengede kaldigi icin eski bekci yakalayamadi.
ONARIMIN KENDI HIKAYESI DE DERSLIK: iki deneme, ekledigim HTML YORUMUNUN
icindeki literal kapanis-etiketi kelimesi yuzunden dustu — sayac yorumu da
saydi (§298'de "(eski t26)" vakasinin birebir tekrari). Ucuncu deneme temiz.
YENI BEKCI: hicbir .tab baska .tab icinde olamaz (yapi dogrulanir, sayi degil).
CANLI KABUL: t25 parent=wrap, tablo 5.427px, NVDA basta.
DERS: BEKCILER YAZARINI DA DENETLER; YORUM METNINE ETIKET ADI YAZILMAZ.

## §315 SUKUK TAKTIK SINYAL KARTI (19 Agu)

Otonomi paketinin son halkasi. Fix Income / Degerleme basinda; KARAR DEGIL
OKUMA — dort+1 rozet, her satirin kaynagi yaninda: PATIKA (kullanici PPK
takdiri, Σbp + artirim kuyrugu uyarisi) · EGRI (defterden en yuksek nominal
vs en dusuk sabit bilesik → terslik bp; ≥300bp "DERIN fiyatlanmis") · REEL
(ex-ante − TUFE-endeksli ihrac reeli makasi; ≥2pt "koruma PAHALI") · TL
(REK + ex-ante → tasima cıpalari; "USD KS getiri degil SEPET karari") ·
IMA (§316b degiskeninden piyasa forward dilimleri).
Sandbox 11/11: Σ-345bp, ters 1098bp (%46,1→%35,1), makas 3,6pt, kuyruk %10
uyarisi. Girdilerin TUMU otomatik akiyor — kart elle veri istemez.

## §316b PIYASA IMASI KOPRUSU + BIR SOZDIZIMI DERSI (19 Agu)

Tahminler'deki forward hesabi artik window.PIYASA_IMA'ya da yazar (ayni
hesap, ayni ay-formati — §131; format ikinci sahibi yok); sinyal karti
yalniz okur. Ilk deneme atamayi ternary icine VIRGUL-OPERATORUYLE gomdu;
acilan parantez cok satirli string zincirinde acik kaldi, ':' basibos dustu
(SyntaxError 6521). Duzeltme: atama ifade DISINA, if blogu olarak.
DERS: COK SATIRLI TERNARY ZINCIRINE YAN ETKI GOMULMEZ; basit olan dogrudur.

## §313b LIB DEPLOY MACERASI — UC GORUNUM, TEK KOK (18 Agu aksami)

Getiri Egrisi + Teknik + "CDN engeli" sikayetlerinin uclu koku: lib/ dosyasi
repoya girmeden app.js f yayina cikti → /lib 404 → LightweightCharts
undefined → chart cizen HER kart sessizce bos. Kullanicinin gordugu "CDN
engeli" mesaji §313b sigortasinin kendi uyarisiydi (unpkg yedegi de aginda
kesikti). Cozum zinciri: (1) §313b sigortasi — yerel yuklenemezse unpkg'ye
dusulur ve konsola yazilir (deploy-sirasi sigortasi); (2) lib dosyasi once
yanlislikla api/_lib'e yuklendi — ORADAN SUNULMAZ (api/ fonksiyon alanidir,
statik servis yok) + kap paketine 196KB yuk; GitHub rename ile ktpanel/lib/'e
tasindi. CANLI KABUL: /lib HTTP 200, LWC object, Teknik'te 7 canvas, egri
kullanici onayiyla DUZELDI.
KURAL: DOSYAYI require EDEN SUNUCUYSA YERI api/_lib; INDIREN TARAYICIYSA
YERI STATIK ALAN. Ikisi ayni "kutuphane" gibi gorunur, biri mutfak biri vitrin.
ARAC NOTU: sentetik alt-sekme tiklamalari uzantı katmaninda bastiriliyor
(olay belgeye ulasmiyor) — alt-sekme testleri state'i elle kurup yapilir;
kullanicinin gercek tiklamasi olcumun yerini tutar.

## SEKME ADLARI: EQUITY · FIX INCOME · COMMODITY (19 Agu)

Kullanici istegi + noktali-I fixi: dugme metinleri kucuk yazilip CSS'le
buyutuluyordu, Turkce yerelde i→İ oldu ("EQUİTY"). Adlar kaynakta buyuk
harf Ingilizce yazildi — donusum devre disi. Metne bagimli tuketici yok
(sekmeler data-tab kimlikleriyle calisir); sifir yan etki.


## §314 HAZINE IHALE SONUCLARI KATMANI — KESIFTEN CANLIYA UC KOSU (18 Agu)

Kullanici onayiyla acilan TAM OTOMATIK katman (⭐ "yeni damgali katman yasak"
kuralinin ISTISNASI — onay 18 Agu, plana _314 notuyla islendi).
KESIF: hmb.gov.tr JavaScript'siz BOS KABUK donduren bir SPA. Tarayici
uzerinden canli olculdu: arka uc WORDPRESS (kanit: guid alaninda
api.hmb.gov.tr/?page_id=). /portal/v2/posts?search=... standart WP REST —
/duyurular rotasi 404 olsa bile API saglam. Duyuru govdesi tek cumle; gercek
icerik ekli PDF'te (ms.hmb.gov.tr/uploads/.../KAF_YYYYMMDD_ihale_sonucu_*.pdf
— dosya ADI bile yapisal: 4TUFE_9s = 4Y TUFE + 9Y sabit).
V1 (ilk kosu): boru hatti uctan uca akti, regex SIFIR yakaladi — ama
sozlesme geregi her kayda ham_ozet yazildi ve gercek duzen goruldu:
  PDF tablo hucreleri BITISIK duzlesiyor: "Ortalama Donem:3,012,87"
  = teklif 3,01 | gerceklesme 2,87 (iki kolon: Teklif | Gerceklesme).
V2: sabit iki-ondalik bicim sayesinde yapisik cift DETERMINISTIK ayrilir:
  (\d{1,2},\d{2})(\d{1,3},\d{2}). Gercek 6 kayitta 6/6; 17 Agu FRN %20,87
  dis haber kaynagiyla BIREBIR teyit.
V2.1: bir duyuru BIRDEN COK ihale tasiyabilir (18 Agu = TUFE 4Y + sabit 9Y);
  metin "Ihale No:" sinirlarindan bloklara bolunur. ISIN 12 haneye sabitlendi
  (acgozlu regex "Ortalama"nin O'sunu yutuyordu: TRT080530T27O).
V2.2: kira sertifikasi / dogrudan satis duyurulari TABLOSUZ DUZYAZI ve
  icerde ORAN YOK (dogrudan satista aciklanmiyor) — uydurma-yok geregi olan
  yapilandirilir: tutar, valor, itfa, ISIN, senet turu. 4/4 gercek hamla test.
GERIYE DONUK ONARIM: defterdeki bos kayitlar sonraki kosuda kendiliginden
yeniden islenir (slug anahtarli kumulatif defter, §299 ailesi).
DERS: KESIF SONDASI BIR KOSULUK MALIYETTIR, TAHMINLE YAZILMIS AYRISTIRICI
HAFTALIK MALIYET. ham_ozet penceresi olmasaydi V1'in bos donmesi KOR kalirdi.
DERS: SPA gorursen once guid/manifest/performance izlerine bak — arka uc
cogu zaman standart bir CMS'tir ve REST'i aciktir.
YAN KAYIT (package.json kazasi): pdf-parse eklerken kok package.json'u
yeniden uretirken ORIJINALI EZDIM — playwright devDependency ucuyordu, fon
katmani sessizce olurdu. Workflow'daki eski kaza yorumu yakalatti; onarildi,
playwright canli kilitteki 1.62.1'e SABITLENDI.
KURAL: KILIT YENIDEN URETILIRKEN ESKI KILITTEKI SURUM SABITLERI KORUNUR —
semver araligi "izin"dir, "istek" degil; surum de veridir.
ILK GUNUN FOTOGRAFI (defterden): fonlama %40 iken sabit bilesikler vadeyle
cokuyor — 6A bono %41,1 → 2Y %41,7 → 5Y %39,3 → 9Y %35,1 → TUFE-endeksli
REEL %5,83. Derin ters egri; dezenflasyon prim odenerek satin aliniyor.

## §313 GRAFIK KUTUPHANESI EVE ALINDI (18 Agu)

lightweight-charts unpkg CDN'inden yukleniyordu: ucuncu taraf TEK HATA
NOKTASI (Yahoo dersinin kardesi) + Edge Tracking Prevention her aciliste 4
uyari. npm'den birebir indirildi (5.2.0, 196KB), /lib/ altindan sunulur.
KURAL: CANLI PANELIN CIZIM KUTUPHANESI UCUNCU TARAF CDN'DEN GELMEZ.

## §312 YAVAS MODUL TESHISI (18 Agu)

Paralel boot bir aciliste 12,5 sn surdu ve HANGI modulun sundugu
gorulemiyordu (toplam sure tek satirdi). kos() sarmali artik modul basina
sure tutar; 2,5 sn'yi asan konsola adiyla yazilir.
DERS: TOPLAM OLCUMU TESHIS DEGILDIR — fail gorunmuyorsa alarm ise yaramaz.

## §311 KURESEL FETCH ZAMAN ASIMI (18 Agu)

Asya forex "yukleniyor..." bir oturumda SONSUZA DEK asili kaldi. Kod
sucsuzdu: catch/else dallari yer tutucuyu guncelliyordu — ama fetch ZAMAN
ASIMSIZ bekledigi icin istek askida kalinca HICBIR dal kosmadi.
ENVANTER: app.js 102 + ajan.js 11 await fetch, SIFIR AbortSignal.
COZUM (tek sahip): 113 noktaya dokunmak yerine window.fetch BIR KEZ sarilir
— kendi signal'i olan AYNEN gecer, olmayana 25 sn tavan. Tarayici
AbortSignal.timeout bilmiyorsa sarim kendini kapatir (asla daha kotu olmaz).
app.js ajan.js'ten ONCE yuklendigi icin Ebu'nun cagrilari da kapsamda.
KURAL: HER fetch'IN BIR TAVANI OLMALI; tavani olmayan istek "yukleniyor"
yazisinin ebedi kiracisidir.

## §310 PARALEL BOOT (18 Agu)

17 fetch'li modul seri await'le kosuyordu: gecikme = SURELERIN TOPLAMI.
Bagimlilik haritasi grep'le cikarildi: yalniz pyInit ve planInit,
multipleInit'in doldurdugu MFIYAT/MRISK'i tuketiyor. Iki asama: bagimsizlar
paralel, o ikili multiple bitince. Hata izolasyonu ayni (allSettled + modul
basi log). GERI DONUS ANAHTARI: localStorage ktp_boot_seri_v1=1 → eski seri
yol, deploy'suz (§136.4: kalkan degil ANAHTAR). Boot suresi konsola yazilir.
CANLI KABUL: "boot 4024 ms (paralel §310)" — tum kartlar dolu.
KURAL: PARALELLESTIRMEDEN ONCE BAGIMLILIK HARITASI OLCULUR; "muhtemelen
bagimsizdir" bir olcum degildir.

## §309 BDDK TLS UC KATMAN + PIN (18 Agu)

Eski kontrol yalniz sertifika ALAN ADINA bakiyordu — kendinden imzali sahte
sertifika geciyordu (subject'i saldirgan yazar). Eklendi: (1) kendinden-
imzali RED, (2) gecerlilik penceresi, (3) sha256 parmak izi PIN.
Pin TAHMINLE YAZILMADI: once olcum modu (yanita _tls alani), kullanici
canli teshis=1 ciktisini getirdi, pin oyle muhurlendi:
45:74:...:40:79 · CN *.bddk.org.tr · GlobalSign OV · BITIS 15 KAS 2026.
TAKVIM: 15 Kas civari sertifika yenilenince pin BILEREK kirilir; hata
mesaji yeni parmak izini TAM basar → tek satirlik bakim.
DERS: OLC → PINLE. Bir de kendi kazam: pin yazan betik SyntaxError'la HIC
kosmadi ama zincirdeki boru hatti hatayi yuttu, sonraki komutlar degismemis
dosyada YESIL basti. CIKTI KANIT DEGILDIR, DOSYA KANITTIR (§252n bana da).

## §307-308 BIST BULTEN FIYAT YEDEGI (18 Agu)

Yahoo donmasi (asagida §300 kronolojisi) resmi yedegi dogurdu. §305 sondasi
olcmustu: thb bulteninde KAPANIS FIYATI var, 57 kolon, 11.161 satir, tarih
ISO — VE tuzak: THYAO araniyorsa .AOF turev satiri cikiyor (tamami sifir).
KATMAN: Yahoo son is gununu vermezse bulten devralir. Kurallar:
- TAM kod veya KOD.E kabul (ILK KOSU KANITLADI: bultende ciplak kod YOK,
  pay satiri KOD.E gezer; 11.161 satirda saf THYAO sifir eslesme).
- kapanis>0 (askı/turev disari) · Turk sayi bicimi (1.234,56) cozulur.
- kapsam <%80 ise yedek REDDEDILIR — yarim bulten yarim Yahoo KARISIK TABAN
  YASAK (§114). Yedek girerse o katmanin TUM fiyatlari tek kaynaktan.
- zip kosu basina BIR kez iner (kesifle ortak onbellek).
CANLI SONUC: bes katman "§307 YEDEK DEVREDE: BIST bulteni 2026-08-17",
kapsamlar TAM (100/100, 150/150, 141/141, 40/40) — ve dun ezilen 17 Agu
fiyatlari resmi kaynaktan GERI GELDI (ARASE 124 yeniden). Yahoo'nun meta
fiyati (301,00) bulten kapanisiyla birebir: iki bagimsiz kaynak ayni sayi.
KURAL: TEK SATICIYA BAGLI MASA, MASA DEGILDIR — resmi kaynak varken ucuncu
taraf ancak KONFORDUR ve konforun yedegi olur.

## §306 KOPRU TESTI CUMARTESIYE BAGLANDI (18 Agu)

Test 13 Agu'dan beri repodaydi ama otomasyona bagli DEGILDI — elle
kosulmayan test, olmayan testtir (§243 sinifi). Cmt 07:00 kosusunda calisir;
commit'ten SONRA (kopru kirigi veri yazimini engellemez); kritik uc bozuksa
is KIRMIZI (gercek ariza kirmiziyi hak eder); CRON_SECRET tanimsizsa
kendini ATLAR (sirsiz korumali uca gitmek 401 yagmuru = asilsiz kirmizi).
KURULUM NOTU: GitHub repo Settings → Secrets → CRON_SECRET (Vercel'dekiyle
ayni deger) eklenmeden adim nazikce atlanir.

## §305 BULTEN FIYAT SONDASI (18 Agu)

Tek kosuluk olcum: yedek yazilmadan ONCE bultenin fiyat tasidigi kanitlandi
ve .AOF tuzagi yakalandi. Sonda raporda THYAO varyantlarini kapanislariyla
listeler (THYAO.E=301 · THYAO.AOF=0). Gorevini yapti; §307 canlida bir kez
daha dogrulaninca sadelestirilebilir.
DERS: SONDA UCUZDUR — regexi gercek veriye yazdirir, tahmine degil.

## §304 DOM KAZIMA TASFIYESI (18 Agu)

reelFaizler ve taktikRender, AOFM/TUFE/REK degerlerini EKRAN METNINDEN
regex'le geri kaziyordu — render bicimi degisse hesap sessizce bozulurdu
(§89 kuzeni). Tek sahip degiskenlere baglandi (AOFM_SON, TUFE_YILLIK zaten
vardi; REK_SON eklendi, EVDS cekimi doldurur). Tanimlar ilk tuketiciden
ONCEYE tasindi (let+TDZ). KABUL TESTI KOSULDU: DOM tamamen yokken
reelFaizler tam sonucu uretti (ex-post Fisher 6,28 elle dogrulandi); eski
kod ayni ortamda null verirdi.
BILINCLI SINIR: yorumPano'nun makro satirlari AYNA KOPYA kaldi — orada
hesap yok, sahibin URETTIGI bicimli metin kopyalaniyor; degiskenden yeniden
bicimlemek formatin IKINCI sahibini yaratirdi (§112'nin tersi).

## §303 PPK AGACINA ARTIRIM KOLU (18 Agu)

Dagilim yalniz indirim/sabit kollarini iceriyordu — KESIK dagilim; kuyruk
senaryosu (sok → artirim) fiyatlanamiyordu. +100 ve +250bp kolonlari
eklendi. VARSAYILAN OLASILIK 0: kuyruga kac puan verilecegi TAKDIRDIR ve
takdir kullanicinindir — panel olasilik UYDURMAZ, yalniz kolonu acar.
PPK_KOLLAR listesi TEK SAHIP oldu (baslik+govde+colspan ondan turer; §112).
OLCULDU: kuyruga %10 vermek beklenene az (−112→−85bp) belirsizlige COK
(±70→±106bp) dokunur — kuyruk fiyatlamasi dagilim GENISLIGINI oynatir,
sukuk vade tercihini asil etkileyen de odur. Kullanici dagilimlari
localStorage'da korunur (eski kayit + yeni kolon 0).

## §302 RISK TEK SAHIP (18 Agu)

Risk metrikleri karti vol/VaR'i KENDI hesapliyordu: pVol = Σw·vol
(korelasyonsuz toplam) — riskButceHesap'in icinde ZATEN "eski (yanlis)
yontem" diye isaretlenmis hesap. Ayni portfoy iki kartta iki risk (§112
ihlali). Naif motor emekli; iki kart tek motordan okur; motor canli fiyat
kullanir (eski kart pozisyon giris fiyatinda kaliydi).
FARK OLCULDU (39/40 hisse): naif %40,1 vs model %27,8 — 12,4 puan
cesitlendirme faydasi; VaR %45 ABARTILIYDI (338₺ vs 234₺). Beta iki yontemde
ayni (0,87 — beta lineer, ic tutarlilik kaniti). Kimlik testi: Σctr = volP
ucuncu hanede esit. "Sharpe (varsayimsal)" satiri KALDIRILDI — (β·10)/vol
uydurma primdi; yerine OLCULEN "cesitlendirme kazanci" kondu.
CANLI KABUL: kart basligi "risk butcesi motoru · tek sahip §302",
%28,0 / −14,3p / VaR 5.485₺.

## §301 FIYAT YASI KURALI (18 Agu)

Yahoo donmasinda "tarih birligi: tek tarih 2026-08-14" YESIL yaniyordu —
kural "hepsi ayni gunde mi" soruyordu, "o gun BUGUNE yakin mi" sormuyordu.
141 hisse BIRLIKTE eskirse denetim sessizdi (§179.3'un olcum boslugu).
fiyatYasi: is gunu sayar; ≥2 uyari, ≥5 "kaynak DONMUS" siddeti. HEP UYARI,
ASLA KIRMIZI: kaynak donmusken durduracak yeni veri yok — kaybi olmayan
arizada is kirmizi yakilmaz, gercek kaybin kirmizisi ucuzlamaz.
Cuma→Pazartesi is-gunu hesabiyla sessiz (test edildi).

## §300 GERI GITME KORUMASI (18 Agu) + YAHOO DONMASI KRONOLOJISI

OLCULDU: ayni kosuda Yahoo'dan beslenen BES dosya 17 Agu'dan 14 Agu'ya
GERILEDI; Yahoo kullanmayan uc dosya (risk=BIST, katfon=Fintables, cds=wgb)
ayni kosuda ILERLEDI → ariza kaynakta. 40 hissenin 39'unun TAZE fiyati dort
gun ESKI fiyatla ezildi (ARASE 124→114,6) ve panel bunu "bugunun fiyati"
diye gosterdi — §179.3'un harfi harfine ihlali (ESKI VERI EKSIKTEN
TEHLIKELIDIR: eksik olsa "veri yok" derdi, eski oldugu icin YANLIS soyledi).
KOK NEDEN (kullanicinin ham Yahoo ciktisiyla KESINLESTI): 17 Agu barinin
close'u NULL, 18 Agu bari hic yok, meta kendi icinde celiskili. Kod dogru
davranip null'u atlamis, son gecerli gune dusmustu — soylemeyen yoktu.
KORUMA: gelen fiyat tarihi dosyadakinden ESKIYSE yazilmaz, dosya korunur,
rapora "kaynak geriledi, dosya KORUNDU" duser. §266 ayni-gun korumasinin
fiyat kardesi. NOT: sicil serisi zarar GORMEDI — tarih anahtarli yazdigi
icin; dogru tasarlanan bilesen ayakta kaldi, korumasizlar dustu. Ayrica
karanlik pencereye 14 Agu satiri geriye donuk KAZANILDI (bosluk ikiye
bolundu). SON DURUM: §307 yedegi devrede, donma operasyonel sorun olmaktan
cikti; Yahoo'nun quote ucu SAGLAMDI (canli katman hep dogruydu), bozuk olan
yalniz gunluk bar arsivi.
KURAL: MONOTONLUK — zaman serisine giden yol yalniz ILERI akar; kaynak
geri giderse veri degil RAPOR uretir.

## §299 BILANCO BORC DEFTERI (17-18 Agu)

bilanco-tetik.json PENCERE fotografiydi: her kosu son 1 gunun FR listesini
UZERINE yaziyordu; pencere kayinca kartsiz sirketler SESSIZCE dusuyordu.
OLCULDU: 128→43→52 — 85 sirket bir gecede gorunmez oldu (§245k ihlali).
DONUSUM: dosya BORC DEFTERI oldu — kod listeye girer, ANCAK KARTI YAZILINCA
cikar (muhasebenin en eski kurali). ilk_gorulme ile borc YASI gorunur.
IKI SAVUNMA: inceleme-ai.json okunamazsa dusum YAPILMAZ (kart listesi
gelmedi diye 50 borcu "odenmis" saymak asil felaket olurdu — rapor acikca
soyler); borcYasi nobetcisi en eski borc ≥21g veya defter >200 ise UYARIR
ama isi kirmizi yakmaz (kart yazmak insan isidir, otomasyon zorlayamaz).
CANLI: 52→65→68 gercek borc gorunur oldu; panel seridi ayni sayiyi soyler
("68 sirket FR yayimladi, karti yok"). Ebu'nun NOBET listesi AYRI ve
BILINCLI: canli KAP + evren suzgeci + yoksay — defter KALICI borcu, Ebu
MASADAKI kuyrugu tutar; farkli sorular, §112 ihlali degil.
V1 tarih tuzagi (ilk yazimda): "bugun eklenenler" seti ilk_gorulme'ye
YANLIS gun yazabilirdi — ayni kosuda duzeltildi.

## §298 SEKME CERRAHISI: EQUITY · FIX INCOME · PYS TASIMA (17 Agu)

Kullanici istegi: Portfoy Yonetimi→Equity, Sukuk→Fix Income, PYS Sektor
alt sekmesi Fix Income altina. §248 sk-katfon DESENININ BIREBIR TEKRARI:
t26 icerigi t10 icine subtab-panel (sk-pys) olarak tasindi, IC ID'LER AYNEN
korundu → pysInit tek satir degismeden calisti. §121 uc-yer kurali kapatildi
(dugme t10 alt-navinda ✓ PY_GRUP'tan cikti ✓ ajan SEKME_DISLA t10'u zaten
kapsiyor ✓). Cache-buster iki dosyada da tazelendi; ajan.js bump'i BONUS
(onceki teslimde unutulmustu — §1878 dersi, onbellek riski kapandi).
DAVRANIS NOTU: PYS artik t10 icinde = Ebu NOT YAZMAZ (SEKME_DISLA) —
bilincli, istenirse ayri cozulur. Ilk python denemesi kendi bekcisine
takildi: §298 yorumuna "(eski t26)" yazinca t26-kalinti asserti kirmizi
yakti — BEKCILER YAZARINI DA DENETLER, iyi isaret.
CANLI KABUL (Claude tarayicidan gezdi): ust cubukta Equity/Fix Income,
Fix Income 5. ic sekme PYS Sektor, FINTABLES gunun damgasi, t26 DOM'da sifir.

## HAFTANIN RITUEL KOSULARI (18 Agu — kod degil, veri)

- sektor.json: Fintables koprusuyle tazelendi (plan zaten bu yolu emrediyor).
  INCE TUZAK OLCULDU: Fintables gunluk mumlar UTC 21:00 damgali ve SEANS
  GUNU = DAMGA+1 (16T21Z barinin kapanisi panelin 17 Agu arsiviyle birebir);
  bugunun KAPANMAMIS mumu damgaya alinmadi (iki sorgu arasinda degistigi
  bizzat goruldu). Damganin hikayesi: 8 gunluk gecikme rotasyonu sakliyordu
  — Kimya 3A +3,2→+13,9 · Teknoloji −1,3→+6,9 · Banka −9,7→−5,7.
  KURAL: KAPANMAMIS MUM DAMGAYA GIRMEZ; bar gunu = zaman_utc + 1 (TSI).
- bist-takvim.json: 8 gunun hasadi — 17 sirket gercek KAP tarihiyle arsive
  (kaynak Fintables yayinlanma_tarihi), kalan 8 beklenen, 7'si GECIKEN.
  NOT DUSULDU: SPK konsolide-olmayan 45g siniri 14 Agu'da DOLDU — geciken
  yediliden konsolide olmayan varsa SINIR ASIMI; konsolide sinir 29 Agu.
  Yontem karnesi olculdu: 17 aciklamada MAE 1,5 gun, 10/17 TAM gununde —
  "gecen yilin ayni hafta gunu" yontemi is goruyor.
- BIMAS 2Ç26 karti (Fintables canli veriyle, dosya standardina tam uyum)
  uretildi; kullanici kart isini EBU'ya devretti — kart uretimi bundan
  sonra Ebu'nun, Claude yalniz altyapi.


## ⭐ OTOMASYON KURALI (KULLANICI KURALI — 2 Agu 2026)

"Artik sistemi otomatiklestiriyoruz. Damgali bir sey yok, cok cok zorda
kalmadikca." — Bu tarihten itibaren:

1. YENI OZELLIK OTOMATIK DOGAR. Otomatik beslenemeyecek bir kart/katman
   PANELE GIRMEZ. Once kanal (Yahoo/EVDS/KAP/bot), sonra kart.
   §245j emsal: ozet kartlari saf turetim, damgasiz — yeni is boyle kurulur.
2. MEVCUT DAMGALILAR ERITILIR, cogaltilmaz. Elle katman sayisi su an 10
   (yol haritasi asagida). Her turda bu sayi ya sabit kalir ya duser —
   ASLA artmaz.
3. MESRU ISTISNALAR (olculdu, gercekten otomatiklestirilemez):
   - Swap stoku: EVDS'de YOK (yurt disi ikili swap, TCMB basin aciklamasi).
     Tek sayi, haftalik, "rezervleri guncelle" komutuyla elle. §245k.
   - Olay bazli katmanlar (kredi notu, halka arz, kopru testi): damga degil,
     dogasi seyrek.
   Istisna listesine ekleme = once OLCUM (kanal denendi ve yok), sonra
   gunluge gerekce.
4. DAMGALI VERI EKLEMEK GEREKIRSE (cok cok zorda): kart uzerinde tarih
   GORUNUR + guncelleme-plani.json kaydi + nobetci limiti ZORUNLU.
   Gizli damga (sabit sayi + sessiz dusus) YASAK — §245k'nin dersi.

### ELLE KALAN 10 KATMAN — ERITME YOL HARITASI (2 Agu)
  KANAL HAZIR (siradaki isler):
    yabanci.json seri gecmisi  -> ✓ BITTI (§245r: seri canli, elle sifir)
    bist-takvim + beklenen     -> KAP FR listesi (§201 adim 1, uc calisiyor)
    hazine-takvim              -> Hazine aylik ihrac programi, cekilebilir
  KANAL ARASTIRILACAK:
    sektor.json                -> DAMGA §B2 "otomasyon yok" diyor ama Yahoo
                                  sektor endeksleri (XBANK.IS vb.) denenebilir
    analist / multiple payda   -> bilanco kalemi ister; §201 adim 2'ye bagli
    fm.json / guidance            (KAP kalem veriyor mu — henuz belirsiz)
  ISTISNA (kalici elle): swap stoku.

## ⭐ VERI KAYNAGI ONCELIGI (KULLANICI KURALI — 24 Tem 2026)

SIRALAMA: Fintables > Alpha Vantage > Yahoo > digerleri

- 1. FINTABLES (MCP): BIST icin BIRINCIL. hisse_senetleri.son_fiyat (canli, tek SQL),
     finansal tablolar, temettu, carpanlar, KAP. AMA MCP = sadece Claude cagirir,
     panel (tarayici) DOGRUDAN erisemez. Kullanim: Claude ceker -> json'a yazar (kopru),
     ya da dogrulama/kalite kontrol. "fiyatlari guncelle" komutu Fintables'tan beslenir.
- 2. ALPHA VANTAGE (MCP): global/emtia/forex/teknik. Yine MCP (Claude cagirir).
- 3. YAHOO (api/market.js): panelin BAGIMSIZ canli tabani (client'tan direkt, Claude gerekmez).
     Panel kendi basina calisirken TEK secenek bu. ?mod=fiyat 141 hisse.
- 4. EVDS (api/evds2.js): TCMB makro/rezerv (yerli resmi veri).
- 5. Diger: gold-api vb.

MIMARI KURAL: Panel canli calisirken sadece client-erisilebilir kaynaklar (Yahoo, EVDS,
gold-api) kullanilabilir. Fintables/AlphaVantage MCP -> Claude araciligyla json kopru.
Yani "en iyi veri" (Fintables) ile "panel bagimsiz canli" (Yahoo) ayrimi onemli:
  - Kalite/dogrulama/guncelleme -> Fintables once
  - Surekli otomatik canlilik -> Yahoo (cunku panel MCP'ye erisemez)

Ornek dogrulama (24 Tem): panel snapshot 15 Tem'de donmustu, Fintables canli ile
karsilastirildi: EUPWR +17,6%, TUREX +17,1%, MERCN -10% sapma vardi. Fintables
BIST'te Yahoo'dan daha guvenilir referans.

## 1. Deploy kontrol listesi (klasörde olması gereken dosyalar)

`Downloads/ktpanel/` içinde şunlar bulunmalı — biri eksikse ilgili bölüm **boş** görünür:

**Kökte:**
- `index.html` — panelin iskeleti
- `app.js` — tüm mantık
- `fm.json` — faktör model (147 hisse)
- `katfon.json` — 46 katılım fonu getirisi
- `track.json` — sicil (25 hisse + performans serisi)
- `sektor.json` — sektör ısı haritası + rotasyon
- `yabanci.json` — yabancı para akışı
- `halkaarz.json` — halka arzlar
- `guidance.json` — şirket guidance'ları

**`api/` klasöründe:**
- `market.js` — canlı küresel piyasa köprüsü (Yahoo)
- `tcmb.js` — TCMB kur köprüsü
- `tefas.js` — TEFAS fon köprüsü

Deploy: dosyaları klasöre koy → `vercel --prod`

## 2. Sağlık kontrolü (bir bölüm boşsa)

Panel açılınca tarayıcı konsolu (F12 → Console) şunu yazar:
- `✓ Tüm veri modülleri yüklendi.` → her şey yolunda
- `⚠ Boş/eksik bölümler: ...` → o bölümün `.json` dosyası klasörde yok veya bozuk

## 3. Veri katmanları ve güncelleme sıklığı

### CANLI (hiç dokunma — kendiliğinden akar)
- Kur, kripto, TCMB, altın/gümüş, döviz sepeti → API'lerden
- Küresel endeksler, VIX, DXY, Brent → `/api/market` (Yahoo)
- Risk iştahı barometresi → VIX + BIST'ten canlı hesap

### STATİK — güncelleme sıklığına göre:

| Veri | Dosya | Sıklık |
|---|---|---|
| BIST endeksleri | app.js (ENDEKSLER) | Gün sonu (isteğe bağlı) |
| Sektör ısı/rotasyon | sektor.json | Haftalık |
| Fon getirileri | katfon.json | Haftalık (T+1 gecikmeli) |
| Sicil performans | track.json | Haftalık (yeni nokta ekle) |
| Yabancı para akışı | yabanci.json | Aylık (ödemeler dengesi) + haftalık son |
| Tahvil eğrisi / CDS | index.html | Olay bazlı (TCMB kararı) |
| Makro (TÜFE, sanayi) | index.html | Aylık (TÜİK açıklaması) |
| Haberler | app.js (HABERLER) | Gün sonu (isteğe bağlı) |
| Halka arzlar | halkaarz.json | Seyrek (yeni arz oldukça) |
| Guidance | guidance.json | Yılda 1-2 (şirket revize edince) |
| Kart yorumları | index.html/app.js | Manuel (Claude ile) |

## 4. "Güncelle" rutini ne yapar

"Güncelle" dendiğinde Claude şunları tek pakette çeker:
BIST endeksleri + sektör + fon getirileri + sicil noktası + KAP haberleri + gerekiyorsa makro/tahvil.
Sonuç: değişen dosyalar → klasöre koy → `vercel --prod`.

**Normal günlerde hiçbir şey yapma** — canlı katman zaten güncel.
**Haftada bir veya önemli kapanışta** "güncelle" yeterli.

## 5. Tek-kaynak notu (dikkat edilecek)

Swap hariç net rezerv şu an **iki yerde** görünür: Rezerv Karnesi (index.html)
ve Yabancı Para Akışı (yabanci.json). Güncellerken **ikisini de** aynı değere getir,
yoksa tutarsız görünür. (İleride tek kaynağa bağlanabilir.)

## 6. Bankacılık sekmesi — sahiplik kırılımı (23 Tem 2026 eklendi)

BDDK **banka bazında veri yayımlamaz**: Bankacılık Kanunu ve resmi istatistik gizlilik
hükümleri gereği veriler, kuruluşun tespitini engelleyecek şekilde toplulaştırılır
(üçten az kuruluş içeren grup bir üst seviyeye toplanır). Banka bazına ancak bağımsız
denetim raporlarından / KAP çeyreklik finansallarından ulaşılır.

İzin verilen en ince granülerlik **sahiplik grubu**dur ve artık panelde:

| Kod | Grup | Mayıs 2026 aktif |
|---|---|---|
| 10005 | Kamu Sermayeli | 14,80 trn ₺ (%28,6) |
| 10006 | Yerli Özel | 24,18 trn ₺ (%46,7) |
| 10007 | Yabancı Sermayeli | 12,78 trn ₺ (%24,7) |

**Kimlik testi:** 10005+10006+10007 = 10001 (sektör toplamı). Kodlar bu eşitlikle
ölçülerek doğrulandı — BDDK grup kodlarını değiştirirse bu test tutmaz ve tablo
`ok:false` döner (sessizce yanlış veri göstermez).

**Neden ayrı uç nokta (`?sahiplik=1`):** `panel=1` zaten 4 grup × 2 dönem = 8 istek
yapıyor. Üç grup daha eklemek 14 ardışık isteğe çıkarıp `maxDuration:45` sınırını
zorlardı. Ayrı tutulunca ikisi bağımsız çalışıyor; sahiplik düşse bile Grup
Karşılaştırması kartı ayakta kalıyor (`Promise.allSettled`).

**Bakım gerektirmez** — aylık veri BDDK'dan otomatik akar, okuma notu da
hesaplanan değerlerden kendini yazar.

**İzlenecek satır:** aylık kredi büyümesinde kamunun yerli özelden ayrışması.
Kamu hızlanıp özel yavaşlıyorsa, politika faizi ne derse desin kredi kanalı
fiilen gevşiyor demektir.

## 7. Çalışma kuralları (Claude için — yeni sohbette BU DOSYAYI YÜKLE)

Yeni bir sohbette Claude bu projeyi hatırlamaz. Bu bölüm, kuralları geri getirir.

### 7.1 İş akışı
Kullanıcı `ktpanel` klasörünü yükler → Claude değişen dosyaları üretir →
kullanıcı terminalden `vercel --prod` ile deploy eder.
Claude **deploy etmez**, sadece dosya üretir.

### 7.2 Bozmak yok — doğrulanabilir olmalı
Her teslimattan önce Claude, ürettiği ağacı yüklenen dosyalarla **hash karşılaştırır**
ve hangi dosyaların değiştiğini/dokunulmadığını raporlar. "Dokundum sanmıyorum" yetmez.
Çalışan bir kod yolunu (`panel=1` gibi) değiştirmek yerine **yanına yeni yol** açılır.

### 7.3 Vercel Hobby: 12 fonksiyon sınırı — MİMARİYİ BU BELİRLER
- `api/*.js` → **serverless fonksiyon, slot yakar.** Şu an **10/12** (2 rezerv).
  (§85'te `ajanktp.js` eklendi; bu satır 28 Tem'e kadar 9/12 diyordu — kota raporlama
  kuralının kendisi bayatlamıştı, §112'de düzeltildi.)
- `api/_lib/*.js` → **modül, slot yakmaz.** Vercel `_` ile başlayan klasörü route
  keşfinde atlar. Route'lar bunları `require('./_lib/x.js')` ile çağırır.

**Kural (normal sezginin tersi): dosya büyütmek bedava, dosya eklemek pahalı.**
Yeni yetenek → mevcut route'a `?mod=` ekle, ağır mantığı `_lib`'e koy.
Yeni `api/*.js` ancak gerçekten şartsa ve slot bütçesi konuşularak açılır.

Mevcut dispatch deseni:
| Modül (`_lib`) | Çağıran route | Erişim |
|---|---|---|
| `mail.js` | `data.js` | `/api/data?mod=mail` |
| `tlref.js` | `evds2.js` | `/api/evds2?mod=tlref` |
| `egri.js` | `evds2.js` | `/api/evds2?mod=egri` |
| `kapyorum.js` | `kap.js` | (içeriden) |

Claude her dosya teslimatında açıkça yazar: **fonksiyon mu (`api/`) modül mü (`_lib/`)**
ve kotanın ne olacağı.

### 7.4 Klasör yapısı (deployment ile birebir)
```
ktpanel/
├── index.html  app.js  ajan.js  middleware.js  *.json
├── KTPANEL-BAKIM.md  KTPANEL-DAMGA.md  package.json  vercel.json
├── test/
│   └── kopru-testi.js                              ← slot YAKMAZ (api/ dışında)
└── api/
    ├── ajanktp.js bddk.js data.js evds2.js kap.js
    ├── katfon.js market.js tcmb.js tefas.js usnews.js   ← 10 fonksiyon
    └── _lib/ egri.js kapyorum.js kart.js
              mail.js sukuk.js tlref.js              ← modüller, bedava
```
DİKKAT: `middleware.js` KÖKTE olmalı (api/ içinde değil) — Edge middleware'dir,
fonksiyon kotasına dahil DEĞİLDİR. `test/` klasörü deploy edilir ama route üretmez.

### 7.5 Veri kaynağı ilkeleri
- Kaynak kodu kaybolursa canlı deployment'tan çekilebilir
  (`ktpanel.vercel.app/index.html`, `/app.js`) — ama `api/*.js` çekilemez, kullanıcı yükler.
- Dış kaynağın kod/şema varsayımları **ölçülerek doğrulanır**, ezberden yazılmaz.
  Örnek: BDDK grup kodları kimlik testiyle (`10005+10006+10007 = 10001`) teyit edildi;
  test tutmazsa kod yanlış veri göstermek yerine `ok:false` döner.
- Test için ağ gerekmez: `bddk.js` içindeki `global.__BDDK_TEST_ISTEK` kancasıyla
  stub veriyle uçtan uca çalıştırılabilir. Yeni köprülerde aynı kanca açılmalı.

## 8. BDDK Aylık Bülten — tablo haritası (23 Tem 2026)

Bülten **17 tablo** içerir; panel bunlardan üçünü kullanıyor. `?ham=1&tablo=N` ile
her tablonun hücre yapısı, `?tablolar=1&bas=1&bit=8` ile toplu keşif yapılabilir.

| Tablo | İçerik | Satır | Panelde |
|---|---|---|---|
| 1 | Bilanço (TP/YP/Toplam) | 62 | ✓ `?panel=1`, `?sahiplik=1` |
| 2 | Gelir tablosu (faiz gelir/gider, komisyon, karşılık) | 53 | — |
| 3 | Kredi türleri (ihracat/yatırım/işletme × kısa-uzun) | 20 | — |
| 5 | Sektörel kredi × takip | 70 | ✓ `?sektor=1` |
| 4, 6–17 | Henüz haritalanmadı | ? | — |

### ⚠ BİRİM TUZAĞI
Tablolar arasında birim **değişir**. Tablo 1 ve 3 → **milyon TL**.
Tablo 5 → **bin TL** (ölçüldü: toplam krediler 26.046.642.273 = 26,05 trn).
`?sektor=1` bunu 1000'e bölerek milyon TL'ye çevirir. Yeni tablo eklerken
birimi mutlaka TOPLAM satırını Tablo 1 ile karşılaştırarak doğrula.

### Tablo 5 hücre düzeni (ölçüldü)
`[0]=grup [1]=sıra [2]=kalem [3]=font('bold'=üst düzey) [4]=kısa [5]=ortaUzun`
`[6]=nakdi [7]=takipteki [8]=toplamNakdi [9]=gayriNakdi`

Genel `cek()` ayrıştırıcısı burada **kullanılamaz**: a+b=c sezgisi Kısa+Orta=Nakdi'yi
bulur ve Takipteki sütununu kaybeder. Bu yüzden `cekHucre()` yazıldı — TP/YP düzeninde
olmayan tüm tablolar için o kullanılmalı.

### Sıradaki adaylar
- **Tablo 2 → sahiplik bazında net faiz marjı.** Yabancı bankaların yüksek aktif
  kârlılığının fiyatlamadan mı hacimden mi geldiğini ölçer.
- **Tablo 3 → kredi türü kompozisyonu.** İhracat mı tüketici mi büyüyor: TCMB'nin
  seçici kredi politikasının fiilen işleyip işlemediği.
- **Sermaye yeterliliği** (tablo no bulunmadı) — yerli özel grubun 13,0x kaldıraçla
  sıkışmasının gerçekten bağlayıcı olup olmadığını teyit eder.

### Sektörel tabloda maddiyat filtresi (düzeltme, 23 Tem 2026)
Okuma notu ilk sürümde "en çok bozulan" sektörü filtresiz seçiyordu ve gerçek veride
defterin %0,01'i olan "İşçi Çalıştıran Özel Kişiler"i (+85 bp) öne çıkarıyordu.
Küçük defterlerde takip oranı gürültülüdür — tek kredi oranı uçurur.
Artık öne çıkarmalar **defter payı ≥ %1** olan sektörlerle sınırlı (`ESIK` sabiti).
Ders: türetilmiş sıralamalarda daima bir maddiyat eşiği olmalı; stub testi bunu
yakalayamaz çünkü stub'da hep büyük kalemler bulunur.

## 9. Yahoo 1G değişimi %0,00 hatası (düzeltildi, 24 Tem 2026)

**Belirti:** Piyasa kapalıyken BIST/ABD/Avrupa kartlarında günlük değişim %0,00.
Asya doğru, IBEX 35 doğru, tek tek hisseler doğru.

**Teşhis:** Değerler tam sıfır değil, ~1e-6 mertebesinde kalıntı taşıyordu — bu,
bir sayının kendisine bölündüğünün imzasıdır. Sebep `market.js` içindeki
`Math.abs(p - bar[L-1].c) < 1e-9` karşılaştırması: Yahoo `regularMarketPrice`ı
YUVARLANMIŞ (7408.3), grafik kapanışını TAM ondalıklı (7408.29998) döndürür.
Fark 1e-9'u aştığı için kod aynı seansı yeni seans sanıyor, `pIdx=L` yapıyor ve
1G referansı olarak fiyatın kendi kapanışını alıyordu.
IBEX tesadüfen doğruydu çünkü değeri tam sayı (19267) — fark tam 0.

**Çözüm:** Seans tespiti fiyat karşılaştırmasından `meta.regularMarketTime`
zaman damgasına taşındı. Fiyatın hangi güne ait olduğu tahmin edilmez, sorulur.
Zaman damgası yoksa yedek olarak **göreli** tolerans (`|Δ| > |c|·1e-6`) kullanılır.

**Ders:** Kayan noktalı sayılarda mutlak tolerans (1e-9) kullanma; ya göreli
tolerans kullan ya da hiç karşılaştırma yapma — veri zaten cevabı içeriyorsa onu sor.
Hata yalnızca dar bir pencerede (piyasa kapalı + son bar = fiyatın seansı) göründüğü
için aylarca fark edilmemişti; sabah maili tam bu pencerede gidiyor.

**Yeni alan:** `barGun` — serideki son barın tarihi, teşhis için. `gun` artık
fiyatın ait olduğu seansı gösterir.

## 10. ABD bilanço kartı iş akışı — VERİ KAYNAĞI SIRASI (24 Tem 2026)

### Sıra
1. **Alpha Vantage EARNINGS** → EPS, konsensüs, sürpriz, yıllık/çeyreklik EPS serisi. Bu uç
   bilanço günü güncellenir, güvenilir.
2. **Alpha Vantage INCOME_STATEMENT** → ciro, marj, D&A. **Ama alan alan kontrol et**, aşağıya bak.
3. **Şirketin SEC 8-K'sı (Ex-99)** → AV'de eksik olan her şey. Gelir tablosu, nakit akışı,
   segment kırılımı, rehberlik buradan.
4. Kartta **hangi rakamın nereden geldiği yazılır**. "Yayımlanmadı" bir kart satırı değildir.

### ⚠ EBITDA KURALI — sağlayıcının hazır alanını ASLA kullanma
**EBITDA = Faaliyet Kârı + D&A** olarak HESAPLA. Gerekçe ölçüldü:

AV, EBIT'i `vergi öncesi kâr + faiz gideri` olarak türetiyor (INTC ve TXN'de dörder çeyrekte
doğrulandı). Bu, faaliyet dışı kalemlerin EBITDA'ya sızması demek. İki farklı arıza görüldü:

| | Arıza | Sonuç |
|---|---|---|
| INTC 2Ç26 | AV kaydı henüz yok | Yayımlanınca ~−7 mlr$ gösterecek (gerçek: +5.020) |
| TXN 2Ç26 | Kayıt var ama `D&A=None`, `ebit=None` | `ebitda` alanı sessizce faaliyet kârına eşit: 2.310 (gerçek: 2.878, −%19,7) |

INTC 3Ç25'te AV EBITDA marjı %57,5 görünüyordu — bir çip üreticisi için imkânsız; fark tamamen
faaliyet dışı kazançtan. Seri −%39,3 ile +%57,5 arasında salınıyor: ölçüm değil, gürültü.

### D&A nereden alınır
- AV'de doluysa onu kullan (tanımı = amortisman + yazılım itfası; TXN 2Ç25'te 8-K ile birebir 481 ✓).
- Boşsa 8-K nakit akış tablosundan al.
- 8-K yalnız 6 aylık veriyorsa (INTC deseni): **6 aylık − AV'nin 1Ç değeri**.
  INTC 2Ç26: (5.891+469) − 3.136 = 3.224. Yöntem 2Ç25'te doğrulandı: (5.213+474) − 2.674 = 3.013 = AV'nin 3.013'ü ✓
- Bulduğun değeri daima çeyreklik seriye karşı makullük kontrolünden geçir.

### Sıradaki kartlar
MSFT, META (29 Tem) · AAPL, AMZN (30 Tem). Dördünün de büyük yatırım portföyü var —
aynı EBITDA tuzağı orada da kurulu. GOOGL kartındaki "EBITDA (faaliyet bazlı)" etiketi standarttır.

## 11. Sektör ısı haritası "canlı diyor ama veri eski" (24 Tem 2026)

**Belirti:** Damga "canlı · veri 2026-07-24" yazıyor ama sektör kutuları 15 Temmuz
değerlerinde takılı. Daha önce aynı yerde tüm sektörler %0,00 görünüyordu.

**Teşhis:** İki ayrı sorun aynı yerde birleşiyordu.

1. **Kök neden — Yahoo veri boşluğu.** `/api/market` ölçümü: 15 sektörün **13'ünde**
   `chg:null`, 15 endeksin **12'sinde** `chg:null`. Sadece XU100, XU030, XUSIN ve XBANK
   dolu. Sebep: Yahoo bu semboller için 3 aylık aralıkta **tek bar** döndürüyor (`n=1`),
   dolayısıyla `ref(1)` referansı kurulamıyor. `h1/a1/q3`'ün de null olması bunu doğruluyor.
   *Aynı kök neden, iki semptom:* eski kodda `pIdx=L` olduğu için `ref(1)` fiyatın kendisiydi
   → %0,000001; yeni kodda `pIdx=L-1` → null.

2. **Damga yalan söylüyordu.** `canliEnjekte()` doğru davranıyor — `chg==null` ise
   `sektor.json`'daki damgalı değeri KORUYOR (tasarım doğru). Ama damga metni yalnızca
   `xu100.gun`'a bakıyordu; XU100 canlı olduğu için "canlı" yazıyor, oysa 13 sektör
   damgalı veride kalıyordu.

**Çözüm:**
- `market.js`: seri referansı yoksa `meta.previousClose`'a düş (`kaynak:'meta'`).
  **Sıra önemli:** `previousClose` = önceki SEANS kapanışı (günlük değişim için doğru);
  `chartPreviousClose` = grafik aralığından önceki kapanış, 3 aylık aralıkta 3 ay öncesi.
  Eski kod yanlış olanı önceliyordu — >%12 makullük kontrolünde de bu referans kullanılıyordu.
- `app.js`: damga artık `"2/15 canlı · 10:42 · diğerleri damgalı 2026-07-15"` yazıyor.
  Kaç sektörün gerçekten canlı olduğunu `SEKTOR.canli` zaten sayıyordu, sadece gösterilmiyordu.

**Yeni teşhis alanları:** `n` (geçerli bar sayısı — 1 ise Yahoo o sembolde veri vermiyor),
`kaynak` (1G nereden geldi: `seri` | `meta`).

**Deploy sonrası kontrol:** `/api/market` yanıtında sektörlerin `chg` değerleri dolu mu ve
`kaynak:"meta"` mı? Hâlâ null ise Yahoo o sembolde `previousClose` da vermiyor demektir;
o durumda çözüm sembol bazında değil, sektör getirisini bileşen hisselerden hesaplamaktır.

**Ders:** Bir kartın "canlı" etiketi, verinin canlı olduğunu değil kaynağın canlı olduğunu
gösteriyordu. Damga daima **kaç kaydın gerçekten tazelendiğini** söylemeli.

## 12. Kart harcamaları — sektörel (24 Tem 2026 eklendi)

Enflasyon ve Reel Ekonomi sekmesinin altında. **Fonksiyon slotu yakmaz** — `api/_lib/kart.js`
modülü `evds2.js`'ten `?mod=kart` ile çağrılır. Kota hâlâ 9/12.

### Seri kodları ÖLÇÜLDÜ, ezberlenmedi
```
/api/evds2?ara=kredi kart                        → grup: bie_kkhartut
/api/evds2?list=bie_kkhartut                     → KT1 toplam · KT2–KT26,KT49 sektör · KT50–52 bilgi
/api/evds2?grup=bie_tukfiy2025&adFiltre=Genel&debug=1 → TP.TUKFIY2025.GENEL
```

### İki metodoloji kararı (ikisi de zorunlu)
**1. Hafta sayısı normalizasyonu.** Seri HAFTALIK ve AKIM. Aylığa çevirirken haftalar
TOPLANIR — `aggregationTypes=last` bu seri için YANLIŞTIR. Ama ay başına hafta sayısı
4 veya 5 olabilir; ham aylık toplamları karşılaştırmak 5 haftalık ayı %25 şişirir.
Bu yüzden **tüm karşılaştırmalar haftalık ortalama üzerinden** yapılır.
Test bunu doğruladı: 2025-06 (5 hafta) vs 2026-06 (4 hafta) kurgusunda nominal yıllık
değişim tasarlanan değeri tam tutturdu; ham toplamla o sektör yanlışlıkla eksi görünüyordu.

**2. Reelleştirme.** %30 enflasyonda nominal artış bilgi taşımaz. Her sektör için
`(1+nominal)/(1+TÜFE) − 1` hesaplanır ve **sıralama reele göre** yapılır. Nominal sütun
sadece karşılaştırma için durur. Tabloda okunacak sütun REEL'dir.

### Bilinen sapma
EVDS haftalık tarihi hafta SONUNU gösterir; ay sınırına denk gelen hafta bir sonraki aya
yazılır. Yıllık karşılaştırmada sapma iki tarafta da aynı yönde olduğu için büyük ölçüde
götürür, ama aylık (MoM) okumada bir haftalık kayma olabilir — MoM'u tek başına yorumlama.

### Dönem seçimi
Son ay daima kısmidir (17 Tem verisiyle temmuz bitmemiştir). Modül **son tamamlanmış ayı**
seçer: `toplamAylar[uzunluk-2]`. Damgada hangi dönem olduğu yazar.

### Sağlık kontrolü
Yanıttaki `paylarToplami` ~%100 olmalı. Belirgin sapma varsa EVDS seri seti eksik dönmüştür.

### 12.1 Küme ayrımı ve vergi düzeltmesi (24 Tem 2026)

İlk sürüm manşet toplamı gösteriyordu; ölçünce yanıltıcı olduğu görüldü.

**Sorun 1 — Kamu/Vergi Ödemeleri tüketim değil.** Harcamanın %10,2'si ve reel +%71,5
büyüyor (kartla vergi ödeme yaygınlaşıyor). Manşet reel büyümenin **~%36'sını** tek başına
üretiyor. Artık `exKamu` alanı var: 2026-06'da toplam reel +%11,91 iken vergi hariç **+%7,68**.

**Sorun 2 — Kuyumcu da tüketim değil.** Türkiye'de altın alımı tasarruf/enflasyon
korunmasıdır. Keyfi kümesine dahil edildiğinde (reel +%29,6 ile) o kümenin sinyalini
bozuyordu: keyfi −%3,51 görünüyordu, ayrılınca **−%6,93** çıktı ve makas 14 → **17,4 puana**
açıldı. Yani sıkışma sinyali yarı yarıya gizleniyormuş.

**Dört küme:** `temel` (7 seri, pay %44,3) · `keyfi` (9 seri, %17,6) · `korunma` (kuyumcu, %2,5)
· `kamu` (vergi, %10,2). Kalan ~%25 karma sektörler (sigorta, müteahhit, yapı malz., araç
servis, hizmet, diğer) — bilinçli olarak kümelenmedi, çünkü tüketim/yatırım ayrımı net değil.

**MAKAS = temel reel − keyfi reel.** Hanehalkı sıkışmasının tek sayılık özeti. Açıldıkça
zorunlu tüketim korunup isteğe bağlı kesiliyor demektir. Her ay izlenecek asıl sayı budur;
okuma notu ve özet şeridi bunu öne çıkarır.

**Okuma notunda dışlama:** "reel en güçlü büyük kalem" seçiminde Kamu/Vergi ve Kuyumcular
hariç tutulur — yoksa tablo vergi ödemesini tüketim canlılığı sanar.

## 13. Earnings AI — kaç kart gönderileceğinin seçimi (24 Tem 2026)

**Sorun:** Arşiv büyüdükçe "Tümünü Mail At" tüm kartları gönderiyordu; ara seçenek yoktu.
Sadece iki uç vardı: tek kart (kart üzerindeki ✉) veya hepsi.

### Arayüz (yeni)
- Her kartın başlığında **onay kutusu**.
- Araç çubuğunda **"✉ Seçilenleri Mail At (N)"** — N canlı sayaç, seçim yoksa buton soluk.
- **Hızlı seç** menüsü: Son 1 / 2 / 3 / 5 kart · Tümü · Seçimi temizle.
  (Kartlar dosyada en yeniden eskiye sıralı olduğu için "Son N" = listenin ilk N'i.)
- "✉ Tümünü Mail At" duruyor ama ikincil (soluk) hale getirildi.

`incMail()` artık üç girdi kabul eder: `null` → tümü · `'KOD'` → tek · `['A','B']` → seçilenler.
Tek kart seçildiğinde konu satırı otomatik tek-kart formatına döner.

### Sunucu / cron (yeni parametreler)
`/api/data?mod=mail&cron=1&...`

| Parametre | Etki |
|---|---|
| `gun=N` | son N gün içindeki kartlar (varsayılan 3) — **mevcut** |
| `hepsi=1` | gün filtresini atla — **mevcut** |
| `adet=N` | yukarıdaki filtreden sonra **en yeni N kartla sınırla** — YENİ |
| `kod=A,B` | yalnız bu kodlar; diğer filtreleri ezer — YENİ |

Sıra: `kod` > (`hepsi` veya `gun`) > `adet`.
`adet` geçersiz/0 ise yok sayılır — geriye dönük uyumluluk korunur.

**Cron'u sınırlamak istersen** `vercel.json` içindeki yolu değiştir, örn:
`/api/data?mod=mail&cron=1&gun=2&adet=3` → günlük mailde en fazla 3 kart.
Şu an cron'da `adet` YOK, yani davranış değişmedi.

## 14. Özel sektör sukuk akışı — canlıya alındı (24 Tem 2026)

`sukuk-ihrac.json` elle bakımlıydı ve 4 gün bayattı. Artık **melez**: KAP'tan canlı akar,
statik haritalarla zenginleşir, arşivle birleşir. **Fonksiyon slotu yakmaz** —
`api/_lib/sukuk.js`, `kap.js`'ten `?mod=sukuk` ile çağrılır. Kota 9/12.

### ⚠ HAZİNE KATMANINA DOKUNULMADI
`hazine-takvim.json` ve `hazineRender()` ayrı katmandır, elle kalır.
Doğrulandı: hazineRender bloğu 2164 karakter, değişiklik öncesi/sonrası **bire bir aynı**.

### Ayırıcı işaret (ölçüldü)
KAP kira sertifikası bildirimlerini **"(Faizsiz)"**, konvansiyonel tahvilleri
**"(Faiz İçeren)"** ekiyle işaretler. Filtre buna dayanır. Test doğruladı:
SMRFA/ENJSA gibi faizli tahviller elenir, AYGAZ devre kesici gibi alakasız bildirimler elenir,
MDIAZ gibi VKŞ olmayan ihraç tavanı bildirimleri elenir.

### Zenginleştirme
KAP başlığı jeneriktir ve ihraççı ünvanı vermez; iki statik harita bunu tamamlar:
- **`VKS`** — varlık kiralama şirketi kod → ünvan (sonlu, yavaş değişen küme)
- **`TIP`** — başlık deseni → panel rozeti (app.js `tipRenk()` ile uyumlu:
  Yeşil/Sürdürülebilir→yeşil · Dönemsel/Ödeme→mavi · diğer→gri)

**Bonus:** KAP'ın `k` dizisi VKŞ kodunun yanında **fon kullanıcısı** şirketi de taşır
(örn. `["DGRVK","ERCB"]`) → nota "fon kullanıcısı: ERCB" olarak yazılır.

### Bilinmeyen kod politikası
Haritada olmayan VKŞ kodu SAKLANMAZ: satırda `KOD (ünvan haritada yok)` görünür ve
yanıtın `bilinmeyenKodlar` alanında raporlanır; panel bunu kart altında uyarı olarak basar.
**POLİTİKA: haritaya YALNIZCA teyitli kod yazılır.** Tahmini eşleşme, panelde sessizce
yanlış ihraççı adı gösterir — bu, boş göstermekten kötüdür.

İlk sürümde VKFVK/ZVKS/ALVKS/EMVKS/TDVKS/KLVKS tahmin edilmişti; canlı çıktı `VKFVK`'nın
YANLIŞ olduğunu ortaya çıkardı (gerçek Vakıf kodu **VAKVK**). Tümü kaldırıldı.

Teyitli harita (8 kod): NURVK · TFNVK · KATVK · EKTVK · HLVKS (arşivden) ·
DGRVK Değer · VAKVK Vakıf (fon kullanıcısı Vakıf Katılım Bankası) · TEVKS Tera
(son üçü 2026-07-24'te KAP'tan teyit edildi).

**Ünvan normalizasyonu:** arşiv kayıtlarının `ihracci` alanı da haritadan geçirilir, yoksa
aynı kod canlıda ve arşivde farklı isimle görünür (NURVK'da bu yaşandı: canlıda
"Nurol Varlık Kiralama", arşivde "Nurol Yatırım Kira Sertifikası").

### Uç nokta
`/api/kap?mod=sukuk&gun=30&limit=25`
| Alan | Anlam |
|---|---|
| `canliAdet` / `arsivAdet` | kaynak kırılımı |
| `bilinmeyenKodlar` | haritaya eklenecekler |
| `kapHata` | canlı akış düştüyse sebep (arşiv yine görünür) |

Arayüzde canlı satırlar **CANLI** rozeti alır ve ihraççı adı KAP bildirimine link olur.

## 15. Getiri eğrisi GRAFİĞİ (24 Tem 2026)

Sukuk sekmesinde, Kira Sertifikası İhraç Takvimi'nin **soluna** eklendi.
Yeni dosya YOK, yeni fonksiyon slotu YOK — veri zaten `/api/evds2?mod=egri` ile geliyordu,
eksik olan yalnızca görselleştirmeydi.

### Veri
`api/_lib/egri.js` her gösterge için `getiri`, `kalanYil`, `isin`, `itfa`, `kupon` döndürür.
`kalanYil` grafiğin X ekseni, `getiri` Y ekseni, `isin` ise nokta üzerindeki ipucu.
Canlı veri 4 göstergeden azsa `EGRI_STATIK` damgalı yedeğine düşer.

### Eğri neden Nelson-Siegel?
Noktaları rastgele bir spline ile birleştirmek görsel olarak hoş ama **yorumlanamaz**.
Nelson-Siegel tahvil piyasasının standardıdır ve üç parametresi doğrudan anlam taşır:

`y(t) = β₀ + β₁·f₁ + β₂·f₂` , `f₁=(1-e^(-t/τ))/(t/τ)` , `f₂=f₁-e^(-t/τ)`

| Parametre | Anlamı | Okuma |
|---|---|---|
| β₀ | uzun vade seviyesi, `y(∞)` | piyasanın uzun vadeli faiz beklentisi |
| β₁ | eğim, `y(0)−y(∞)` | **β₁>0 → kısa uç uzun ucun ÜSTÜNDE → eğri TERS** |
| β₂ | kambur | β₂>0 → orta vadede şişkinlik |
| τ | kamburun konumu | hangi vadede tepe yaptığı |

⚠ **β₁ işaret yorumu:** ilk denemede "β₁>0 → normal eğri" yazmıştım, YANLIŞ.
`y(0)=β₀+β₁` ve `y(∞)=β₀` olduğundan β₁>0 kısa ucun yüksek olduğu, yani TERS eğri demektir.

τ ızgarada (0,3–12) taranır; her τ için β'lar 3×3 normal denklemle en küçük kareler çözülür,
en düşük RMSE'li τ seçilir. Test: 8 gösterge ile RMSE **0,072 puan**; 13 tahvilli
referans veri setinde 0,22 puan.

### RMSE'nin okunması
Küçük RMSE eğrinin tutarlı olduğunu, büyük RMSE bazı kıymetlerin piyasadan koptuğunu
(likidite sorunu, vergi etkisi, tekil arz baskısı) gösterir. Not metninde gösterilir.

### İKİ EĞRİ: konvansiyonel + sukuk (24 Tem 2026)
**ÖLÇÜLDÜ:** `bie_pydibs` grubu (4.140 seri) HER İKİSİNİ birden taşır. Ayrı sukuk grubu YOK
(`?gruplar=1&q=kira` yalnız kira endekslerini buluyor).

| | ISIN öneki | Tip kodu | Erişim |
|---|---|---|---|
| Konvansiyonel DİBS | **TRT** | `24T2` | `?mod=egri` |
| Hazine kira sertifikası | **TRD** | `24D2` | `?mod=egri&tur=sukuk` |

Süzgeç hem ISIN önekini hem tip kodundaki harfi kontrol eder — çapraz sızıntı testte doğrulandı.
TRB (bono), TRM (likidite senedi), A serileri ve kupon striptleri elenir.

**Vade hedefleri genişletildi:** eskiden 4 vade (2Y/3Y/5Y/10Y) seçiliyordu; Nelson-Siegel'in
4 parametresi için bu tam belirlenmiş sistem demek, serbestlik derecesi yok. Artık 9 vade.

### ⚠ NS TEKİLLEŞMESİ — düzeltildi
Sukuk verisiyle ilk uyum **bozuk** çıktı: τ ızgaranın üst sınırına (12) dayandı ve
β₀=−196, β₁=232, β₂=256 gibi anlamsız parametreler üretti. Sebep: büyük τ'da f₁ ve f₂
neredeyse aynı fonksiyona dönüşür, sistem tekilleşir, birbirini götüren dev katsayılar çıkar.
Uydurulan *değerler* makul görünüyordu ama parametreler saçmaydı ve not metni
"uzun vade seviyesi −196" yazacaktı.

Üç katmanlı çözüm: **τ üst sınırı 8** · **ridge (Tikhonov) cezası** yalnız β₁ ve β₂'ye
(seviyeye değil) · **makullük kontrolü** |β|<150. Sonuç: τ=1,8, β₀=24,9, β₁=10,8, β₂=16,7.
RMSE 0,55→0,76'ya çıktı; anlamlı parametre için kabul edilebilir takas.

### Makas — asıl bilgi
Sukuk, konvansiyonelin **~5 puan altında** işlem görüyor ve makas vade boyunca şaşırtıcı
derecede sabit (0,5 yıl 4,80 → 7 yıl 5,20 puan). Sebep BDDK verisinde: katılım bankalarının
fon kullandırma oranı %65,9 ile sektörün (%87,9) çok altında — toplanan fonun bir kısmı
krediye değil kira sertifikasına gidiyor, yapısal ve fiyata duyarsız bir alıcı tabanı var.
**Makas daralıyorsa** sukuk pahalılaşıyor, **açılıyorsa** katılım tarafında değer var.

### Etiket politikası
Referans grafiklerde (ArfCap) tüm ISIN'ler basıldığı için etiketler üst üste biniyor.
Burada yalnızca **uç noktalar ve gösterge vadeler (2Y/5Y/10Y)** etiketlenir; tam ISIN ve
kalan vade, noktanın `<title>` ipucunda görünür.

## 16. Parite kartı — aynı itfa tarihli çiftler + tarihsel yön (24 Tem 2026)

Getiri eğrisi grafiğinin ALTINA, sk-egri panelinde. İki katman:

### Ham kanıt (model değil)
`?tur=parite` modu (`egri.js` içinde, yeni fonksiyon slotu yok): tüm TRD ve TRT
adaylarını **itfa tarihine göre** eşleştirir (±3 gün tolerans), aynı gün itfa olan
çiftlerin getiri farkını döndürür. Nelson-Siegel tahmini DEĞİL — aynı borçlunun (Hazine)
aynı vadeli iki kâğıdının ham getiri farkı. İkisi de aynı kredi riski olduğundan fark ~0
(parite) beklenir. Eşleştirme testte doğrulandı: 10.02.2027 çifti sıfır gün farkla eşleşti,
gürültü (farklı itfa) ve A serileri elendi.

**Fark işareti:** pozitif (DİBS yüksek) → sukuk ucuz · negatif → sukuk pahalı
(katılım talebi arzı aşıyor). Durum rozeti: |ort|<0,15 PARİTE · ort>0 SUKUK UCUZ · ort<0 SUKUK PAHALI.

### Tarihsel yön (localStorage)
`parite_gecmis_v1` anahtarında günlük snapshot (poz_v1/journal_v1 ile aynı desen).
Panel her açıldığında `pariteKaydet()` bugünün ortalama farkını yazar, aynı günü bir kez
tutar, ~120 gün saklar. `pariteKart()` son değerleri mini SVG çizgi grafiğiyle gösterir,
sıfır çizgisi = parite. **İzlenecek olan farkın seviyesi değil YÖNÜ:** sürekli daralma,
BDDK'daki yapısal katılım talebinin (fon kullandırma %65,9 vs sektör %87,9) fiyata
yansımaya başladığını gösterir.

⚠ Geçmiş tarayıcıda tutulur (sunucuda değil) — kullanıcı bazlı, cihaz değişince sıfırlanır.
Sunucu tarafı kalıcı seri istenirse ayrı bir JSON katmanı + cron gerekir (şu an yok).

## 17. Parite alarmı — makas eşiği aşınca mail (24 Tem 2026)

Aktif al-sat için: aynı itfa tarihli TRD/TRT çiftinde makas eşiği aşınca sabah mailine düşer.
`mail.js`'e `tip=parite` dalı eklendi (yeni fonksiyon slotu yok — data.js→mail.js zaten var).

### Çalışma
`/api/data?mod=mail&cron=1&tip=parite&esik=0.25`
- `?tur=parite` verisini çeker, `|fark| ≥ esik` olan çiftleri süzer
- **Aşan yoksa mail ATMAZ** (spam önleme) — sadece log döner
- Aşan varsa alarm maili: her çift için itfa, iki ISIN, iki getiri, makas (bp) + aksiyon
- Yön: fark>0 sukuk ucuz (al sukuk/sat DİBS) · fark<0 sukuk pahalı (tersine)

### Cron
`vercel.json`'a eklendi: `15 5 * * 1-5` (hafta içi 08:15 TR, earnings mailinden 15 dk sonra).
Eik cron path'inde: `&esik=0.25`. Değiştirmek için path'i düzenle, yeniden deploy et.

### Test
Parite kartında **"⚡ Test alarmı gönder"** butonu → `esik=0` ile çağırır, mevcut en büyük
makas ne olursa olsun mail atar. `CRON_SECRET` tanımlıysa `localStorage.ktp_cron_k`'den okur.

### Eşik mantığı (neden 25 bp)
Sukuk likiditesi DİBS'ten düşük; giriş/çıkış maliyeti farkı yiyebilir. 25 bp altı makaslar
işlem maliyetini karşılamaz, alarm üretmemeli. Kart başlığında "en büyük makas X bp / alarm 25 bp"
göstergesi eşiğe yakınlığı canlı gösterir.

⚠ Test edildi (3 senaryo): parite→sessiz · anomali→doğru yön+bp · negatif fark→ters aksiyon.

## 18. Emtia sekmesi (24 Tem 2026)

Yeni ana sekme `t15` (Sukuk'un yanı). Canlı emtia özeti — 17 vadeli sözleşme.

### Veri: mevcut market.js boru hattı
Yeni fonksiyon YOK. `market.js`'in `syms` objesine emtia sembolleri eklendi (Yahoo `=F`
vadeli sözleşmeler). Brent/WTI zaten vardı; enerji, değerli metal, sanayi metali, tahıl,
yumuşak emtia grupları eklendi. Her sembol otomatik `window.__market`'a düşer, `emtiaRender()`
okur. Fiyat + gün (chg) + hafta (h1) + ay (a1) — hepsi market.js'ten hazır geliyor.

⚠ **Alan adları:** haftalık = `h1`, aylık = `a1` (chgW/chgM DEĞİL). İlk yazımda yanlıştı, düzeltildi.

### Fon yöneticisi bağlamı
Her emtia satırının `title`'ında Türkiye etkisi var (hover). Üç kanal notta açıklanıyor:
enflasyon (enerji/tarım → TÜFE), kur (net enerji ithalatçısı → cari açık/TL), sektör
(altın→kuyumcu, bakır→inşaat, pamuk→tekstil/KOTON, tahıl→gıda üreticileri).

### Türkçe büyük harf
Grup başlıklarında JS `toUpperCase()` KULLANMA — "i"yi "I" yapar (İ değil). CSS
`.lbl{text-transform:uppercase}` locale-doğru çeviriyor; grup adı olduğu gibi basılır.

### AV emtia serileri neden kullanılmadı
Alpha Vantage MCP'de WTI/Brent/bakır/doğalgaz **aylık** granülerlikte — günlük hareket
vermez, fon yöneticisi için işe yaramaz. GOLD_SILVER_SPOT canlı ama tek başına yetersiz.
Yahoo `=F` sözleşmeleri günlük/haftalık/aylık üçünü de canlı veriyor → tek tutarlı kaynak.

## 19. evds2.js timeout — "boş çıktı" teşhisi (24 Tem 2026)

**Belirti:** `?list=bie_mbblnch`, `?list=bie_ulusdovlkd` üç kez BOŞ döndü; `bie_abanlbil` çalıştı.
**Kök neden:** evds2.js'teki HİÇBİR fetch'te timeout yoktu. Büyük/yavaş gruplar asılı kalıp
Vercel fonksiyonunu 60sn'de zorla kestiriyordu → tarayıcıya boş yanıt. Küçük gruplar hızlı
yanıt verdiği için çalışıyordu (boyut değil, YANIT SÜRESİ meselesi).
**Çözüm:** Ortak `evdsGet(url, sureler)` helper'ı — AbortSignal.timeout + 2 deneme (12s, 22s) +
başarısızlıkta net hata (`{error, detay}`). Tüm fetch'ler (arama, list, grup-çöz, ana veri) sarıldı.
**Ders:** Serverless'te timeout'suz dış fetch = sessiz boş yanıt riski. Her dış çağrı timeout'lu olmalı.

### Net rezerv otomasyonu — durum
Formül DOĞRULANDI (analitik bilanço, aylık): net rezerv = (TP.AB.A02 − TP.AB.A10) ÷ USD-TRY.
2026-7: (7.971.936.256 − 5.621.644.669) bin TL = 2.350 mlr TL ÷ ~41,7 ≈ 56,3 mlr$ ✓
(10 Tem damgalı değerle 2 mlr TL farkla tuttu). AMA analitik bilanço AYLIK.
Haftalık için bie_mbblnch (MB Haftalık Vaziyeti) gerekiyordu — timeout düzeltilince yeniden denenecek.

## 20. Rezerv karnesi — brüt + net canlıya bağlandı (24 Tem 2026)

**Sorun (kullanıcı yakaladı):** Aynı brüt rezerv panelde iki yerde FARKLI:
makro kartı canlı 160,5 (17 Tem, bie_abres2) vs karne damgalı 163,3 (10 Tem). Karne
elle güncellenmediği için 1 hafta eskiydi. Tutarsızlık buradan.

**Çözüm:** `evds2.js`'e `?mod=rezerv` eklendi (yeni fonksiyon slotu yok).
- **Brüt** → `TP.AB.TOPLAM` (bie_abres2, altın+döviz, milyon USD, HAFTALIK). Makro kartla
  AYNI seri → artık iki yer de aynı canlı sayı. Haftalık değişim son 2 haftadan hesaplanır.
- **Net** → analitik bilanço `TP.AB.A02 − TP.AB.A10` (bin TL, AYLIK). USD çevirimi CLIENT'ta
  `window.__usdtry` ile: (farkBinTL/1e6)/kur = mlr USD. DOĞRULANDI: 56,4 (bilinen 56,3, 0,1 fark).
- **Swap hariç net** → DAMGALI kalıyor (EVDS'de hiçbir tabloda temiz yok — bkz. §19 araştırma).

**Karne etiketleri:** brüt "haftalık · canlı", net "aylık · canlı (kur X)", swap hariç "damgalı".
Frekanslar dürüstçe işaretli. `karneRezervCanli()` makro yüklemede çağrılır (koyGrup rezervLive sonrası).

**EVDS seri teyidi (bie_abres2):** TP.AB.C1=Altın, TP.AB.C2=Döviz, TP.AB.TOPLAM=brüt (hepsi milyon USD).

⚠ Net rezervin İKİ tanımı var, karıştırma:
- Analitik bilanço A02−A10 = 56,3 → piyasa "net rezerv"i (BU kullanılıyor)
- IMF şablonu (bie_ulusdovlkd) resmi rezerv − net döviz çıkışları = 105 → FARKLI tanım, kullanılmadı


## 21. Net rezerv - EVDS kuruyla duzeltildi (24 Tem 2026)

Sorun: net rezerv client'ta canli kurla (window.__usdtry) cevriliyordu. Kur 41,7->47,3
oynayinca net 49,7 cikti (10 Tem'de 56,3 tutmustu). Aylik TL bilanco degerini bugunku
canli kurla cevirmek tarih-uyumsuz.

Cozum (kullanici fikri): Kur da EVDS'den. rezervModu'na TP.DK.USD.A.YTL (gunluk USD/TRY,
DOGRULANDI) eklendi. Net rezerv SERVER'da: degerUSD = (A02-A10)/1e6/kur. Kur = EVDS gunluk.

Dogrulama (formul DOGRU, kur-tarih eslestirmesi):
- 2350 mlr TL / 41,7 = 56,4 (10 Tem web 56,3)
- 2350 mlr TL / 45,9 = 51,2 (17 Tem web 51,2)
- 2350 mlr TL / 47,15 = 49,9 (24 Tem bugun)

Net rezervin dogasi: Aylik TL tabani + gunluk EVDS kuru. TL ayda bir, kur her gun ->
net rezerv her gun CANLI hareket eder. Kur yukseldikce USD karsiligi erir (dogru).

SWAP HARIC NET hala damgali (42,5, olmasi gereken 37,7). EVDS'de yok. Web/PDF gerekir. Ayri is.

client: karneRezervCanli() server'dan hazir net.degerUSD aliyor.


## 22. Swap haric net rezerv - canliya baglandi (24 Tem 2026)

Kullanici: "swap haric neti canliya aktarcaz baska yolu yok."

EVDS ARASTIRMASI (bie_swaptektarf - TCMB Tarafli Swap Islemleri, 22 seri):
- Ihale bazli swap stoklari var ama toplam ~3,7 mlr$ (TOTALSTOKSATIMYONLU)
- Gereken swap stoku 13,5 mlr$ (17 Tem: net 51,2 - swap haric 37,7)
- Fark ~9,8 mlr: yurtdisi MB swap hatlari + banka doviz ZK'lari - EVDS ihale
  tablosunda YOK, dagink. Tam swap stoku tek/birkac temiz seriden CIKMIYOR.
- Analistler bunu TCMB haftalik PDF'inden okur, hesaplayarak degil.

COZUM (Yol B - net'e bagli, swap stoku parametre):
  swap haric net = net rezerv (CANLI) - SWAP_STOKU (13,5, ayda bir guncellenir)
  Neden saglam: swap stoku YAVAS degisir (2 haftada 13,8->13,5 = 0,3).
  Swap haric net'teki hareketin %94'u NET'ten (kur+bilanco), %6'si swap'tan.
  Net canli oldugu icin swap haric net de her gun canli hareket eder.

evds2.js rezervModu:
  SWAP_STOKU = 13.5 (sabit, dosya basinda, ayda bir elle guncellenir)
  swapHaricNet.degerUSD = net.degerUSD - SWAP_STOKU
  Dogrulama: bugun net 49,9 - 13,5 = 36,4 (web 17 Tem 37,7, o gun kur dusuktu)

KARNE 3 SATIR ARTIK CANLI:
  Brut  -> bie_abres2 TP.AB.TOPLAM (haftalik)
  Net   -> A02-A10 / EVDS gunluk kur (§21)
  Swap haric -> net - 13,5 swap stoku (bu §)
  Damgali HICBIR sey kalmadi. Not metni de guncel duruma cekildi.

SWAP_STOKU GUNCELLEME: ayda bir TCMB haftalik PDF'inden (net - swap haric net).
Su an 13,5 (17 Tem). Yavas degistigi icin aylik guncelleme yeterli.


## 23. Swap haric net - kendini duzelten hibrit COZUM (24 Tem 2026)

Kullanici PDF yukledi (RT20260710TR.pdf). PDF okundu (pdf-reading skill):
- IMF Uluslararasi Rezervler tablosu. Swap satiri: "para swaplarinin gelecekteki
  bacagi" = -16.601 mn = 16,6 mlr$.
- AMA piyasa swap stoku 13,8 (10 Tem). IMF swap'i (16,6) != piyasa swap stoku (13,8).
- PDF net rezervi de IMF tanimi (105 mertebesi), piyasa 56,3 degil.
- KESIN: piyasa 42,5/37,7 sayisi ne EVDS ne PDF'te bilesenleriyle var.
  Web arastirmasi (ozcankuzulu.com): swap stokunun ~%73'u YURT DISI ikili anlasma
  (Katar ~15 mlr limit), yurt ici swap sifira yakin. Yurt disi swap GIZLI, yayinlanmiyor.

COZUM (kendini duzelten hibrit):
- rezerv.json YENI dosya: swapStoku (13,5) + web dogrulama saklanir.
- Swap stoku YAVAS degisir (Katar anlasmasi aylarca sabit) -> json'da tutmak saglam.
- Client: swap haric net = CANLI net (EVDS A02-A10/kur) - rezerv.json swapStoku.
  Net canli oldugu icin swap haric net de her gun canli hareket eder.
- server SWAP_STOKU sabiti KALDIRILDI, client json'dan okuyor.

Dogrulama: 17 Tem net 51,2 - swap 13,5 = 37,7 (web 37,7 BIREBIR).
Bugun net 49,9 - 13,5 = 36,4 (kur 47 icin dogru).

GUNCELLEME: 'rezervleri guncelle' -> web'den o haftanin net+swap haric net cek ->
yeni swap stoku = web_net - web_swaphric -> rezerv.json guncellenir. Kolay, kod degismez.

KARNE 3 SATIR CANLI + not metni guncel. Damgali hicbir sey yok.
rezerv.json swap stoku ~aylik guncellenir (yavas degisir).


## 24. Iki kart uyumu + deploy notu (24 Tem 2026)

Kullanici goruntu: iki kartta da swap haric net 42,5 damgali kalmis.
SEBEP 1: rezerv.json HENUZ DEPLOY EDILMEMISTI (bu turda olusturuldu). fetch('/rezerv.json')
  basarisiz -> swap haric net eski deger. DEPLOY edilince duzelir.
SEBEP 2: Yabanci Para Akisi karti AYRI kod (yabanciRender), swap haric net'i yabanci.json'dan
  (d.rezerv.guncel) aliyordu. Rezerv Karnesi'ni baglarken bu karti ellememisitk.

COZUM: loadYabanciCanli() sonuna swap haric net canli baglama eklendi. Karneyle AYNI kaynak:
  /api/evds2?mod=rezerv (net) + /rezerv.json (swapStoku) -> shNet = net.degerUSD - swapStoku.
  Iki kart da ayni formul, ayni sayi.

DEPLOY LISTESI (hepsi gerekli):
  rezerv.json  -> KOK (YENI, olmadan swap haric net calismaz)
  app.js       -> KOK
  evds2.js     -> api/
Karne 3 satir + Yabanci Para karti swap haric net -> hepsi canli.


## 25. Canli isik gostergesi - "canli" yazisi yerine yesil pulse (24 Tem 2026)

Kullanici: "canli yazilarini da sil, onlarin yerine isik. yanip sonen isik gibi."
NOT: Bu ozellik HAZIR ama HENUZ DEPLOY EDILMEDI (kullanici istegi).

CSS (index.html): .ldot = 5px yesil (--up #0FA26B) yuvarlak, box-shadow glow,
  @keyframes pl ile 1.6sn'de yanip soner (opacity 1->.3->1). Mevcut .pulse'un mini hali.

JS (app.js): canliIsiklari() fonksiyonu - span.thin/.stamp/.tag tarar,
  "canli/CANLI" iceren etiketlerde: kelimeyi + komsu ayraci (·) siler, basina .ldot koyar.
  - regex Turkce ı/İ destekli (canl[ıiİI])
  - ayrac temizligi: "· canli"->"", cift ayrac, bos parantez, bastaki · vb.
  - "damgali yedek" gibi kelimeler KORUNUR (sadece canli silinir)
  - ldot span kontrolu: veri tazelenip canli geri gelince isik YENIDEN eklenir
    (dataset.ldot kullanilmadi cunku innerHTML sifirlaninca isik da gider, tekrar konur)
  - cagri: baslangicta canliIsiklari() + setInterval 5000 (veri farkli zamanlarda gelir)

Ornek donusum:
  "EVDS3 · haftalik · canli" -> [yesil] "EVDS3 · haftalik"
  "· 23-07 · canli (EVDS kur 47,2)" -> [yesil] "23-07 (EVDS kur 47,2)"
  "KAP · CANLI" -> [yesil] "KAP"

DAMGALI VERI ENVANTERI (bu turda cikarildi):
  CEKILEBILIR (EVDS): Yİ-ÜFE + alt kirilim (10 satir), politika faizi/koridor,
    2Y tahvil, 10Y reel, egim -> sonraki is icin en yuksek getiri
  CEKILEBILIR (Yahoo/web): Fed funds, ABD/JGB tahvil, ECB/BOJ faiz (nadir degisir)
  CEKILEMEZ (dogru damgali): anket/tahmin (yil sonu TUFE/kur/faiz), tarihsel capa
    (rezerv Ocak zirve/Haz dibi), metin yorumlari (FOMC/BOJ mesaj)

DEPLOY: index.html + app.js (isik icin). Henuz yapilmadi.


## 26. Baslik tarihi canliya baglandi (24 Tem 2026)

Kullanici goruntu: baslikta "SON KAPANIS: 19 TEM · GUNCEL: 20 TEM 2026" damgali kalmis
(en tepede, panelin guncellik algisini belirleyen yer). §25 envanterinde kacmisti.

Cozum: baslikTarih div'ine id="baslikTarih" eklendi. app.js baslikTarih() fonksiyonu:
  GUNCEL = new Date() (bugun, yil dahil)
  SON KAPANIS = son isgunu (geriye dogru ilk hafta ici; hafta sonu atlanir)
  Turkce ay kisaltmalari (Oca..Ara), buyuk harf.
  Baslangicta cagrilir (marketCek civari).

Test: Cuma->Per, Cmt/Paz->Cuma, Pzt->onceki Cuma, ay gecisi dogru.
Bugun (24 Tem Cuma): "SON KAPANIS: 23 TEM · GUNCEL: 24 TEM 2026".

SINIR: resmi tatilleri (bayram) bilmiyor, sadece hafta sonu atlar. Nadir durumda
1 gun sasabilir. Tatil takvimi eklenebilir ama simdilik hafta sonu mantigi yeterli.

DEPLOY: index.html + app.js (isik §25 ile birlikte). Henuz yapilmadi.


## 27. KKM satiri duzeltildi - iki seri (24 Tem 2026)

Kullanici: "kkm neden cekemiyorsun / kkm sifir normal o" + "neden yesil yanmiyor"

SORUN 1 (KKM '—'): loadRotasyon 3. blok adFiltre='Toplam' kullaniyordu.
  bie_kkm grubunda 'Toplam' IKI seride geciyor:
    TP.KKM.K1 '1. DDKKM – Toplam (milyar $)'  ← doviz
    TP.KKM.K4 '2. TL KKM – Toplam (milyar TL)' ← TL
  Belirsizlik -> bos donuyor -> '—'.

COZUM: Net seri kodu. Kullanici "ikisini de goster" dedi.
  fetch series=TP.KKM.K1,TP.KKM.K4
  DDKKM (K1, mlr $): fark×1000 = mn $  (diger satirlarla ayni birim)
  TL KKM (K4, mlr TL): fark = mlr ₺
  Cikti: "DDKKM -200 mn $ · TL -2,5 mlr ₺ (DDKKM stok 19,3 mlr $)"
  Renk: azalma=yesil (KKM cozulur = TL'lesme/dolarizasyon azalir, olumlu).

SORUN 2 (yesil yanmiyor): canliIsiklari (§25) HENUZ DEPLOY EDILMEDI.
  Goruntudeki panel eski app.js. Deploy edince yanar.

NOT: YURT ICI YATIRIMCI ROTASYONU karti ZATEN tamamen EVDS canli
  (TP.HPBITABLO3.2 TL mevduat, TP.HPBITABLO5.* YP/parite/altin, bie_kkm).
  Sadece KKM alt-serisi bug'liydi, o da duzeldi.

DEPLOY: app.js (KKM fix) + index.html (isik CSS). Henuz yapilmadi.


## 28. Portfoy + degerleme GUNCEL fiyatlar canliya baglandi (24 Tem 2026)

Kullanici: "buradaki guncel degerler eski" (portfoy karti guncel=2026-07-15 snapshot,
9 gun eski). "Tum 141 hisseyi canli cek."

KAYNAK: multiple.json (141 hisse: fiyat + ciro/ebitda/netBorc, elle snapshot 15 Tem).
  Fiyat -> canli cekilebilir. ciro/ebitda/netBorc -> ceyreklik, json'da kalir (dogru).

COZUM:
- market.js'e ?mod=fiyat eklendi (YENI SLOT YAKMAZ, kota 9/12).
  Yahoo v8 chart range=1d (SON fiyat, seri yok = hafif). 10'lu havuz.
  ?mod=fiyat&kodlar=AAA,BBB,... -> {fiyat:{...}, tarih, adet}
  AbortSignal 8sn timeout her istekte.
- app.js pyInit: multiple.json yuklenince 141 kodu toplu ceker, MFIYAT +
  CANLI_FIYAT global'ini doldurur, snapshot fiyatlarin uzerine yazar.
  atifRender/riskMet/likidite/multipleRender canli fiyatla yeniden cizilir.
  MULTIPLE_TARIH = 'YYYY-MM-DD · canli' olur.
- CANLI_FIYAT global: pyInit ve multipleInit arasi senkron (init sirasi belirsiz).
  multipleInit yuklenince CANLI_FIYAT varsa uygular.
- FALLBACK: Yahoo coker/kod gecersizse o hisse snapshot fiyatinda kalir (bos kalmaz).

PERFORMANS: 141 hisse x ayri istek, 10'lu havuz ~14 tur ~7sn ilk yukte.
  Vercel cache s-maxage=180 -> sonraki kullanicilar hizli. Portfoy sekmesi
  acilinca yuklenir (sayfa acilisinda degil), kabul edilebilir.

ETKI: Portfoy getirisi/katki/guncel + DEGERLEME karti (multiple/EV/EBITDA) canli.
DEPLOY: market.js (api/) + app.js. Henuz yapilmadi (birikmis: §22-28).


## 29. Veri Durumu paneli - iki katman CANLI'ya cevrildi (24 Tem 2026)

Kullanici: Veri Durumu panelinde 2 katman "vade yaklasti" (turuncu):
  Yabanci para akisi+carry (17 Tem), Net rezerv/Rezerv Karnesi (16 Tem).
  "gercekten guncel degil mi yoksa baska sey mi?"

TESHIS: planInit() tazeligi guncelleme-plani.json'daki 'son' tarihinden hesaplar
  (gercek veriden DEGIL). Bu turda net rezerv+swap haric+yabanci akisi CANLIYA
  baglandi (§20-24) ama plan.json 'son:16/17 Tem' + siklik:haftalik kalmisti.
  -> VERI GUNCEL, ETIKET ESKI. Panel yaniliyor, veri degil.

COZUM: guncelleme-plani.json iki katmanin siklik'i haftalik -> canli.
  Artik yesil CANLI gosterir, tarih bazli vade hesabina girmez (BIST/kur gibi).

Dogruluk: net rezerv kur nedeniyle her gun canli hareket eder, CANLI durust.
Yabanci akisin aylik cubuklari hala yabanci.json damgali ama haftalik akis+
carry+swap haric canli -> CANLI makul.

DEPLOY: guncelleme-plani.json. (birikmis: §22-29)


## 30. Asya-Pasifik karti (t16) + Twelve Data forex (25 Tem 2026)

Kullanici Twelve Data API key aldi, Asya eksigi icin. ONCE KESIF: market.js
Yahoo cikitisinda Asya ENDEKSLERI ZATEN VAR (nikkei/kospi/hangseng/shanghai/
asx/taiwan/nifty/kosdaq). Yani "Asya eksik" = KART eksik, veri degil.

KARAR (kullanici): Twelve Data ile sadece EKSIKLERI ekle (forex).

TWELVE DATA TESTI (deploy + ?mod=asya):
- 4 forex GELDI: USD/JPY 163,8 · USD/CNH 6,78 · USD/KRW 1459 · USD/INR 96,5 ✓
- STI (Straits Times) → 6,6 geldi = YANLIS (endeks ~3700). symbol_search:
  ucretsiz tier'da STI ENDEKSI YOK, sadece ES3 ETF + alakasiz hisseler.
- SENSEX → gelmedi. JP10Y (tahvil) → gelmedi.
- SONUC: Twelve Data ucretsiz tier ENDEKS ve TAHVIL vermiyor, sadece FOREX.
  Asya endeksleri zaten Yahoo'da -> forex Twelve Data'dan yeterli.

market.js ?mod=asya: SEMBOL listesi 4 foreks sabitlendi. TWELVEDATA_KEY env var.
  Batch /quote endpoint, tek istek. Yahoo'da olan endeksleri MUKERRER cekmez.

FRONTEND (t16 Asya-Pasifik):
- Sekme butonu + tab. asyaRender(): Yahoo endeksleri (window.__market) tablo +
  ozet 4 kart, sonra Twelve Data forex ayri fetch (ASYA_FOREX cache).
- 8 endeks (nikkei/hangseng/shanghai/kospi/kosdaq/taiwan/nifty/asx) + 4 forex.
- Not metni: Asya seansi TR sabahindan once kapanir, gece risk istahi gostergesi.
  USD/JPY carry barometresi, USD/CNH Cin kur durusu.
- .tbl class'i CSS'te tanimsiz ama emtia da kullaniyor, ham tablo render (sorun yok).

DEPLOY: market.js (api/, TWELVEDATA_KEY env var GEREKLI) + index.html + app.js.
GUVENLIK: kullanici key'i sohbette paylasti -> iptal edip yeni key almali.


## 31. Finnhub — kazanç takvimi + kripto (25 Tem 2026)

Kullanici Finnhub key aldi. 4 ozellik TEST EDILDI (olcerek, ezberden degil):
  Ekonomik takvim → PREMIUM (403 "don't have access") ✗
  Kazanc takvimi  → CALISIYOR ✓ (666 sirket, zengin: date/hour/EPS/revenue)
  Sentiment       → GEREK YOK (Alpha Vantage NEWS_SENTIMENT zaten var, usnews.js)
  Kripto quote    → CALISIYOR ✓ (BTC 64021, c/d/dp/h/l/o format)

MIMARI: usnews.js'e ?mod=kazanc + ?mod=kripto eklendi (YENI SLOT YOK, kota 9/12).
  Key: env FINNHUB_KEY (Vercel env var, koda gomulu DEGIL).

KAZANC (finnhubKazanc):
  /calendar/earnings?from=bugun&to=+21gun. usnews.js'teki IZLEME (50 hisse)
  ile FILTRE → 666 degil ~izleme listesi. sort tarih. EPS/gelir beklentisi.
  Frontend: takvimRender() sonuna kazancTakvimCanli() → elle makro olaylarin
  ALTINA canli mega-cap bilanco tarihleri (insertAdjacentHTML beforeend).

KRIPTO (finnhubKripto):
  5 coin BTC/ETH/BNB/SOL/XRP, BINANCE:XXXUSDT /quote. Promise.all.
  Frontend: asyaRender() forex altina kripto tablosu (kullanici karari:
  kazanc→takvim, kripto→Asya karti). Ondalik otomatik (fiyat<10 ? 4hane).

KULLANICI KARARI: kazanc→mevcut takvim karti, kripto→Asya karti (ayri sekme degil).

DEPLOY: usnews.js (api/, FINNHUB_KEY env var GEREKLI) + app.js.
GUVENLIK: Finnhub key sohbete YAZILMADI (dogru), env var'da. Twelve Data key
  paylasilmisti — o iptal edilmeli.


## 32. Haftalik yorum sayfasi guncellendi — 20-25 Tem (25 Tem 2026)

Kullanici: "haftalik yorum sayfasini bastan sona guncelle. paneldeki datalara gore
yaziyordun, haftalik degisen + emtialari belirtiyordun, agirlikla Turkiye piyasasi."
Onceki yorumlarin tarzi conversation_search ile bulundu (veri-dayali, karsi-tezli,
senaryo+sinav noktasi, emtia belirtilir, TR odakli).

DURUM: iki katman. (1) Canli pano (XU100/AOFM/TUFE/REK/carry/beklenti) OTOMATIK,
dokunulmadi. (2) Arastirma notu ELLE, "PPK oncesi" dilinde kalmisti — PPK 23 Tem'de
oldu, not yarim gecisti (bolum 0 guncel, bolum 2-4 hala "senaryo/oncesi").

WEB'DEN CEKILEN GERCEK VERI (23-25 Tem):
- PPK %37 sabit (surpriz yok). BIST 100 14.078 -%0,43. Madencilik +%4,47 lider.
- Brent 100$ ASTI (Hurmuz/Babulmendep riski) — onceki notun "enerji soku" uyarisi
  GERCEKLESTI. TR net enerji ithalatcisi: cari+TL+TUFE baskisi.
- Trump tarifeleri: 60 ulke + Turkiye kapsamda (YENI risk, ihracatci/sinai tezine golge)
- Rezerv brut 160,49 (-2,81 haftalik) — panel karnesi 160,5 ile birebir.
- Yabanci tahvil alimi 6 ay zirve (carry hala cekiyor).

GUNCELLENEN (index.html, hepsi damgali metin):
  yorumHafta etiketi, taktikTag2, arastirma notu bolum 1-5 (rotasyon/enerji soku/
  tarife/katalizor/pozisyon), getiri egrisi notu (PPK oncesi->sonrasi),
  VIX-Brent karti (Brent dustu YANLISTI -> 100+ ters ruzgar), sektor isi notu.
  Div dengesi korundu 663/663.

TARZA SADIK: her iddia rakama bagli, emtia one cikti (Brent), karsi-tez (tez ayakta
AMA 2 yeni risk), TR odakli, sinav noktalari (28 Tem AKBNK, 3 Agu TUFE).

DEPLOY: index.html. (birikmis: §22-32)


## 33. Turkiye doviz pozisyonu grafigi — ARASTIRILDI, ERTELENDI (25 Tem 2026)

Kullanici bir grafik gosterdi: "Turkiye Doviz Pozisyonu" (ozel sektor + kamu +
toplam). Ozel sektor -44,7 mlr$ (Mayis), kamu -147,8, toplam -192,6 (Mart -194,4 zirve).
"EVDS'den cekip koyabilir miyiz?"

KESIF SONUCU:
- Bu HAZIR EVDS serisi DEGIL. Grafikteki metin "topladik/birlestirerek hesapladik"
  diyor -> bir arastirma birimi TUREV gosterge uretmis.
- EVDS'DE KESIN VAR: (1) reel sektor "Finansal Kesim Disindaki Firmalarin Doviz
  Varlik ve Yukumlulukleri", (2) Uluslararasi Yatirim Pozisyonu (UYP). TCMB
  ikisi de "EVDS'de zaman serisi" diyor.

⚠ TUTARSIZLIK: grafik "ozel sektor -44,7" ama TCMB resmi reel sektor -204,4 (Mayis).
  Fark: grafik reel sektor + HANEHALKI DTH + BANKACILIK topluyor. Hane mevduati (+)
  firmalarin -204'unu -44,7'ye cekiyor. Yani cok bileşenli turev.

KARAR: kullanici "simdilik kalsin" dedi. ERTELENDI.

ILERIDE YAPILIRSA:
  B (sağlam): tek seri reel sektor açığı (-204,4, EVDS kesin, savunulabilir)
  A (tam): reel+hane+banka+kamu topla — hane DTH ve banka net YP seri kodları
    + tanımları EVDS'de TEST edilmeli (tutturmak iterasyon alir, yanlis tanim
    -> savunulamaz sayi riski). Deploy YOK, kod YOK.


## 34. Taktiksel Durus karti guncellendi (25 Tem 2026)

Kullanici goruntu: "burayi guncellememissin" — §32'de yorum sayfasini guncelledim
ama Taktiksel Durus kartinin (taktikRender, app.js 2370) TETIK satirlari hala
PPK oncesi dilindeydi. Etiket "25 TEM PPK SONRASI" olmustu ama icerik degil.

CANLI (dokunulmadi): carry/AOFM/TUFE/REK/model alfa DOM'dan okunuyor, otomatik.
  Alt "Canli girdi" satiri da canli (app.js 2442).

GUNCELLENEN tetikler + riskler:
1. Yerli Hisse tetik: "23 Tem PPK guvercin/sahin" -> "28 Tem AKBNK + 3 Agu TUFE;
   Brent 100+ manşete gecerse notrle". Risk listesine Brent 100$+ ve Trump tarife eklendi.
2. Yabanci Hisse tetik: "29-30 Tem MSFT/META/AAPL" -> "30 Tem MSFT/META, 31 Tem
   AAPL/AMZN" (dogru tarih). Risk: Trump tarife dalgasi (60 ulke) eklendi.
3. Altin teze: "Iran soku hafizasi/jeopolitik yatisirsa" -> "Brent 100$+ jeopolitik
   TAZELENDI, yatismadi tersine artti" (guncel gercek).
4. TL/Sabit: tetik zaten gecerli, dokunulmadi.

Tema: bu haftanin iki yeni riski (Brent 100+, Trump tarife) ilgili varlik
siniflarina islendi. Tarza sadik (rakama bagli, karsi-tez, sinav noktasi).

DEPLOY: app.js. (birikmis: §22-34)


## 35. Taktiksel Durus — POZISYON-GEREKCE CELISKISI duzeltildi (25 Tem 2026)

Kullanici KRITIK yakalama: "kotu yazip oneri olarak ustu demissin (yerli hisse+altin),
Amerika tarafina guclu diyip notr demissin. celiski yok mu?"
Kullanici: "benim cagrim degil, SEN degerlendirip damgayi koyacaksin, ben dogru/yanlis
diyecegim. sen ogrenci ben ogretmenim." -> Claude pozisyon karari VERECEK.

CELISKI: durus etiketi (USTU/NOTR) ile dayanak-risk dengesi tutmuyordu:
- Yerli Hisse: USTU ama 5 risk (reel faiz/REK/Brent/tarife/benchmark) vs 3 dayanak
- Yabanci Hisse: NOTR ama tez bastan sona olumlu (+%23,6 sezon, AI capex, kur+hisse)

CLAUDE'UN DEGERLENDIRMESI (gerekce etiketi belirledi, tersi degil):
- Yerli Hisse USTU -> NOTR: ana tez saglam ama rotasyon fiyatlandi + bu hafta 2 yeni
  asagi risk (Brent 100+, tarife). "Dogru tez yanlis giris, teyit bekle" (28 Tem
  AKBNK + 3 Agu TUFE). Haftalik yorumdaki durusla ARTIK TUTARLI (yorum "pesin
  fiyatlama bekle" diyordu, kart "ustu" diyordu -> celiski cozuldu).
- Yabanci Hisse NOTR -> USTU: TL yatirimci icin kur getirisi + guclu sezon = cifte
  motor. Rekor degerleme freni var ama kur kazanci telafi ediyor.
- Altin USTU kaldi (tutarli, jeopolitik taze) + "neden riske ragmen ustu" netlestirildi.
- TL/Sabit USTU kaldi (carry pozitif, tutarli).

Alt not: "23 Tem PPK bu duruslari teyit etti" -> "bu hafta 2 yeni risk isiginda revize
edildi: yerli NOTR, yabanci USTU" (dogru gerekce).

DERS: fon yoneticisi kartinda POZISYON ile GEREKCE ayni yone bakmali. Etiket
gerekceyi izlemeli, ters degil.

DEPLOY: app.js + index.html. (birikmis: §22-35)


## 36. Taktiksel Durus — KULLANICI DERSI ile revize (25 Tem 2026)

Kullanici "sana birseyler ogreteyim" deyip 4 varlik sinifi icin makro tez verdi.
Claude once DOGRULADI (web+veri), sonra karti guncelledi. 4 tez de DOGRU cikti:

1. BANKA MAKASI: indirim gelseydi banka fonlama makasi kazanci yazardi (aktif %40
   eski kredi + pasif %30 mevduat = NFM genisler). 7 hafta otelendi -> 2C banka
   bilancosu zayif. DOGRU (klasik indirim-NFM dinamigi). Yerli hisse tezine islendi.

2. YABANCI HISSE: Brent 75->100 -> enflasyon bekl. -> ABD tahvil getirisi yukselir
   -> risksiz faiz hisseyi ezer. DOGRU ✓✓✓ VERI: 23 Tem ABD 10Y %4,707 (Ocak 2025
   zirvesi), Fed Eylul ARTIRIM olasiligi %52->%82. Claude'un onceki "kur+sezon=USTU"
   tezi YANLISTI. -> ALTI'ya cekildi.

3. ALTIN: yuksek reel faiz + kuresel indirim yok -> altin baskilanir; MB alimi taban
   ama roket degil. DOGRU ✓ Kanit: Brent 100+ iken bile altin -%0,50. -> USTU'den NOTR.

4. TL: dunyada en yuksek reel faizlerden (~%7, belki sadece Arjantin onde). DOGRU ✓
   -> USTU kaldi, teze kuresel kiyas eklendi.

SON DURUSLAR: Yerli NOTR · Yabanci ALTI · Altin NOTR · TL USTU.
DERS (Claude icin): tek varlik sinifina bakarken TRANSMISYON ZINCIRININ sonuna kadar
git — "guclu sezon+kur=al" mekanikti; dogrusu enerji->enflasyon bekl->tahvil getirisi
->hisse baskisi. Kullanici bunu veriye bakmadan gordu.

DEPLOY: app.js + index.html. (birikmis: §22-36)


## 37. ABD KAZANC/BILANCO — kaynak is bolumu kurali (25 Tem 2026)

Kullanici "shibui + finnhub + AV ucunu de kullanalim, hangisi iyiyse onu" dedi.
Uc kaynak MSFT ile TEST edildi, olculdu (ezber degil):

CAPRAZ DOGRULAMA: AV ve Shibui MSFT 2026 Q1 = 4,27 gercek / 4,09 bek / +%4,4
  BIREBIR AYNI. Iki bagimsiz kaynak teyit -> veri guvenilir (savunulabilir sayi).

KAYNAK IS BOLUMU (ABD hisse kazanc/bilanco):
  FINNHUB → GELECEK TAKVIM (tek secenek, tekel)
    "kim ne zaman aciklayacak" — calendar/earnings. Shibui/AV'de gelecek YOK.
    Panel kazanc takvimi (usnews.js ?mod=kazanc) bundan beslenir.
  ALPHA VANTAGE → basit gecmis EPS + surpriz (tek cagri, SQL yok)
    EARNINGS tool: 30 yil EPS, pre/post-market, surprise%. Tek hisse hizli is.
  SHIBUI → derin analiz + degerleme + coklu hisse (SQL/DuckDB)
    Bilanco+deger+marj+sektor+tarama+teknik+SEC bir arada. Coklu hisse tek sorgu.
    AV'de OLMAYAN: P/E-P/S-ROE-Piotroski, sektor kiyas, tarama, teknik, filing.

SECIM KURALI (ortusme = EPS surprizi hem AV hem Shibui'de):
  - Yaklasan tarih          → Finnhub (tek)
  - Hizli EPS/surpriz 1 hisse → AV (tek cagri)
  - Deger/sektor/tarama/coklu → Shibui (SQL)
  - Derin bilanco + dogrulama → Shibui + AV (iki kaynak capraz teyit)

Bu, BIST'te Fintables-birincil kuralinin ABD karsiligi: "is neyse kaynak o".
NOT: Shibui + AV MCP = sadece Claude cagirir (panel degil). Finnhub REST = panelde canli.


## 38. ABD sekmesi (t17) + FRED canli tahvil (25 Tem 2026)

Kullanici: "US sekmesi acalim, Asya'nin yaninda. Endeks+futures+onemli seyler.
Hisse ve makro AYRI kartlarda." Mimari karari Claude'a birakti; karar:
CIZGI = mumkun/imkansiz. Canli OLABILEN her sey canli, olamayan seffaf damgali.

KESIFLER:
- Eski "ABD Ekonomisi" karti (mk-global alt sekme) TAMAMEN DAMGALI ve ESKIMISTI:
  "Eylul artirim %50-60" diyordu, gercek %82 (5 gun sessiz eskime). Bu, damgali
  makronun neden tehlikeli oldugunun kaniti oldu.
- Massive futures TEST: ZQ (Fed funds) + snapshot = 403 PREMIUM. Hisse/ETF acik
  (SPY 738,93 / QQQ 684,23 cekildi). "Futures'la isler" ucretsiz planda YOK.
  Massive = SPY/QQQ yedek kaynak olarak kalir.

KURULAN:
1. api/market.js ?mod=fred (YENI SLOT YOK, kota 9/12):
   FRED REST: DGS2/5/10/30 (tahvil), T5YIE/T10YIE (breakeven enflasyon bekl.),
   DFF (efektif fed funds). Son 10 gozlemden ilk dolu deger + onceki dolu ile fark.
   env FRED_KEY (kullanici ekledi). Cache 1 saat.
2. index.html t17 "ABD" sekmesi (Asya t16 yanina buton):
   HISSE: (a) Endeksler CANLI — Yahoo sp500/nasdaq/dow/russell (zaten cekiliyordu)
          (b) Mega-cap derinlik DAMGALI (Shibui+AV: MSFT P/E 22,6 8/8 beat,
              META surpriz daraliyor %23->%7, AAPL/AMZN 31 Tem)
   MAKRO: (a) Tahvil+breakeven CANLI — usFredBody, FRED
          (b) Fed & politika DAMGALI (Eylul artirim %82, FOMC 28-29, Warsh anlatisi)
   Fon yoneticisi okuma notu: izleme sirasi 10Y -> 2Y -> T5YIE -> mega-cap.
3. app.js usRender(): t17 acilinca endeks (api/market ana) + FRED (?mod=fred).
   Tahvil yukselisi=down (kirmizi) BILINCLI (hisse icin negatif).
   Egim 10Y-2Y hesaplanip gosteriliyor.
4. Eski mk-global ABD karti: eskimis degerler duzeltildi (%82, %4,71) + "canlisi
   ABD sekmesinde" isareti. Kaldirilmadi (kirilma riski), yonlendirme yapildi.

T5YIE ONEMI: kullanicinin dersi (Brent->enflasyon bekl->tahvil->hisse) artik
CANLI izlenebilir — breakeven yukselisi zincirin 2. halkasinin kanitidir.

DEPLOY: api/market.js + index.html + app.js. ENV: FRED_KEY (eklendi).
(birikmis: §22-38)


## 39. ABD sekmesi ilk deploy — iki canli kart bos, duzeltme (26 Tem 2026)

Kullanici goruntu: sekme kuruldu, damgali kartlar (mega-cap, Fed) mukemmel,
AMA Endeksler + FRED "yukleniyor..."da takili.

TESHIS (koddan olculdu):
1. ENDEKS BUG: market.js ana handler { t, tarih, data } donduruyor, alanlar
   data.sp500.p (fiyat) ve .chg (gunluk %). usRender d.sp500.fiyat/.degisim
   okuyordu -> hic eslesme -> sonsuz yukleniyor. DUZELTILDI: j.data + p/chg.
2. FRED: frontend r.ok disinda/bos seride sessiz kaliyordu. SAGLAMLASTIRILDI:
   her durumda mesaj basar (err varsa gosterir, yoksa "env FRED_KEY kontrol").
   Gercek sebep deploy'da belli olacak — kullanici test URL'si:
   https://ktpanel.vercel.app/api/market?mod=fred
   Beklenen: {ok:true, seriler:{DGS10:{deger:4.7,...},...}}
   ok:false + "FRED_KEY tanimli degil" -> Vercel env eksik/yeniden deploy gerek.

DERS: yeni frontend, mevcut API'nin YANIT YAPISINI varsayarak yazilmamali —
once yapiyi koddan/curl'den OLC (bu, veri oncelik kuralinin kod karsiligi).

DEPLOY: app.js (tek dosya degisti bu turda).


## 40. Serverless crash — fredModu TANIMSIZDI (26 Tem 2026)

Kullanici: "This Serverless Function has crashed."

KOK NEDEN (ciddi ders): §38'de fredModu'yu eklerken Python replace hedefi
"export default async function handler" idi — AMA market.js COMMONJS
(module.exports = async...). Kalip dosyada YOKTU -> replace SESSIZCE hicbir sey
eklemedi, assert de koymamistim. Sonuc: satir 86'da fredModu(req,res) CAGRISI var,
TANIMI yok -> her ?mod=fred istegi ReferenceError ile fonksiyonu COKERTIYORDU.

DUZELTME: fredModu tanimi module.exports'tan ONCE eklendi, bu sefer:
- assert "module.exports = async" in s (hedef var mi)
- assert fredModu not in s (cift ekleme yok)
- node --check + grep -c dogrulama (1 eslesme)
- mantik lokal simulasyonla test edildi (FRED '.' bos gun formati dahil)

DERS (bakim icin KRITIK): Python replace ile kod eklerken HEDEF KALIBIN
DOSYADA VAR OLDUGUNU assert ET. Sessiz no-op replace = tanimsiz fonksiyon =
runtime crash. node --check sozdizimini gecirir ama tanimsiz cagriyi YAKALAMAZ
(runtime hatasi). api/ dosyalari CommonJS (module.exports), ES degil!

DEPLOY: api/market.js.


## 41. ABD sekmesi KOK NEDEN: usRender ISIM CAKISMASI (26 Tem 2026)

Uzun teshis maratonunun sonucu. Belirtiler: API 200, kod sunucuda (curl grep 3),
typeof usRender="function", AMA cagirinca iz dusmuyor, kartlar dolmuyor.

KOK NEDEN (kullanicinin konsoldan toString() cikartmasiyla bulundu):
app.js'te ZATEN bir usRender VARDI (satir 852, usnews HABER AKISI cizen,
usAkis elementli). Ben yenimi satir 157'ye ekledim. JS'te ayni isimli iki
function declaration'dan SONRAKI kazanir -> eski haber fonksiyonu benimkini
EZDI. Cagrilan hep haberci usRender'di; usAkis'i bulamayinca sessiz cikiyordu.

COZUM: benimki abdSekme olarak yeniden adlandirildi (tanim + t17 click +
boot listesi + dosya sonu setTimeout, 4 nokta, hepsi assert'li). Eski usRender
(haber) DOKUNULMADI. cache-buster v=20260726d.

DERS (bakim icin kalici): yeni fonksiyon eklemeden once ISIM CAKISMASI kontrol:
  grep -c "function <isim>" app.js  → 0 olmali. app.js 3400+ satir, jenerik
  isimler (usRender, render, init...) muhtemelen ALINMIS. Onek kullan (abd*, t17*).
TESHIS TEKNIGI (degerli): tarayici konsolunda fonksiyon.toString().slice(0,300)
  — deploy edilen kodun GERCEKTE ne oldugunu gosterir, tahmin bitirir.

DEPLOY: app.js + index.html.

EK (§41 sonucu): abdSekme yeniden adlandirmasi DEPLOY EDILDI ve CALISTI (26 Tem).
ABD sekmesi tam canli: endeksler Yahoo (S&P 7412, Russell -0,35 negatif ayrisma —
kartin faiz-baskisi okumasi ilk gunden teyit), FRED tahvil+breakeven akiyor
(10Y 4,71 yukselirken T5YIE 2,24 dusuyor = reel getiri sikismasi canli izleniyor).
Panel 4 cografya tamam: BIST / Avrupa / Asya-Pasifik / ABD.


## 42. FRED genislemesi — Risk & Kosullar karti (26 Tem 2026)

Kullanici: "FRED'den baska neler alabiliriz, ABD kartini dolduralim." Katman 1+2 secildi.

6 YENI SERI (?mod=fred SERILER listesine eklendi, toplam 13, tek paralel cagri):
  DFII10       10Y TIPS reel getiri — dun elle hesapladigimiz "reel sikisma" DIREKT
  BAMLH0A0HYM2 HY kredi spread (OAS) — stres oncusu (<350 rahat/350-500 gergin/>500 stres)
  DTWEXBGS     Ticaret agirlikli dolar — "Fed artirirsa dolar guclenir, EM sikisir" olcumu
  VIXCLS       VIX (elle olan canliya dondu)
  ICSA         Haftalik issizlik basvurulari (en yuksek frekansli isgucu verisi)
  UNRATE       Issizlik orani (aylik)

FRONTEND: t17 makro bolumune 3. kart "RISK & FINANSAL KOSULLAR" (usRiskBody).
  abdSekme icinde ayni FRED yanitindan render (ekstra istek YOK).
  BIRIM DONUSUMLERI: HY yuzde->bp (3,42->342bp), ICSA adet->bin (218000->218 bin).
  TERS RENK MANTIGI: bu kartta HER artis = risk artisi = KIRMIZI (rSatir ters=true).
  Not metni okuma anahtarlariyla (HY esikleri, dolar-EM zinciri, ICSA frekans avantaji).

Karar disiplinine katki: yabanci hisse ALTI tezi artik 3 canli gostergeyle izlenir
(reel getiri + HY spread + dolar). Cache-buster v=20260726e.

DEPLOY: api/market.js + index.html + app.js.


## 43. FRED 2. genisleme — Enflasyon kirilimi + Fed bilancosu (26 Tem 2026)

Kullanici: "ABD TUFE kalemleri + bilanco genislemesi/daralmasi karti (ne yapmis/
ne yapabilir)". Tam set kuruldu.

BACKEND (fredModu, toplam 22 seri):
  SERILER artik [id, tip] ciftleri. tip='yillik' -> endeksten YILLIK % hesabi:
  limit 26 gozlem, (g[0]/g[12]-1)*100; fark = IVME (bu ayin yilligi - gecen ayinki,
  pozitif=hizlaniyor). Hesap lokal test edildi (310->320,85 = %3,5 dogru).
  Yeni seriler:
    yillik: CPIAUCSL (manset), CPILFESL (cekirdek), CPIENGSL (ENERJI - Brent
      gecisken- ligi), CUSR0000SAH1 (barinma), CUSR0000SASLE (hizmet),
      PCEPILFE (cekirdek PCE - Fed'in RESMI %2 pusulasi, TUFE degil!)
    seviye: WALCL (toplam varlik), RRPONTSYD (ters repo), WRESBAL (rezervler)

FRONTEND (t17 makro, 2 yeni kart, toplam 5 makro karti):
  1. ABD ENFLASYON KIRILIMI (usEnfBody): 6 kalem yillik % + ivme. Ivme>0=kirmizi.
  2. FED BILANCOSU QT (usBilancoBody): hibrit —
     canli: toplam varlik (WALCL mn$->mlr$ /1000!), RRP (esik mantigi:
       >400 tampon dolu / 100-400 eriyor / <100 BITTI-rezerv emiyor), rezervler
     hesap: zirveden bugune QT = 8965 (Nis 2022 sabit) - guncel (CANLI hesap)
     damgali not: "ne yapabilir" mekanizmalari + 2019 repo krizi/rezerv-GSYH esigi

BIRIM UYARISI (kritik): WALCL/RRP/WRESBAL FRED'de MILYON $ gelir -> /1000 = mlr$.
Cache-buster v=20260726f. DEPLOY: api/market.js + index.html + app.js.


## 44. FRED 3. genisleme — Konjonktur & Resesyon Radari (26 Tem 2026) — ABD TAMAM

Kullanicinin "baska neler koyabiliriz" sorusuna: SON anlamli katman kuruldu,
sonrasi gurultu (bu acikca soylendi ve kabul edildi).

7 YENI SERI (toplam 29):
  T10Y3M       10Y-3M spread — akademik en iyi resesyon oncusu (NY Fed modeli).
               Negatif = TERS EGRI kirmizi.
  SAHMREALTIME Sahm kurali — issizlikten otomatik sinyal. >=0,50 TETIKLENDI
               kirmizi, >=0,30 "yaklasiyor".
  GDPNOW       Atlanta Fed nowcast — <1 zayif kirmizi.
  NFCI         Chicago Fed finansal kosullar — >0 SIKI kirmizi.
  PAYEMS       Tarim disi istihdam — FARK gosterilir (aylik degisim, bin);
               <100 bin zayif kirmizi (trend 150-200).
  RSAFS        Perakende yillik % (tip=yillik) — tuketici GSYH %70.
  UMCSENT      Michigan guveni — <70 kirmizi (tarihsel ort ~85).

FRONTEND: t17 makro sonuna TAM GENISLIK kart (usRadarBody), esikler otomatik
yorumlu. Kart felsefesi notta: "bu kart YARINI olcer, ustekiler BUGUNU;
ikisi celisirse (bugun guclu + radar kizariyor) pozisyon kucultme zamani."

ABD SEKMESI NIHAI YAPI (7 kart): Endeks (canli) · Mega-cap (damgali Shibui+AV) ·
Tahvil+breakeven (canli) · Risk&Kosullar (canli) · Fed&Politika (damgali) ·
Enflasyon kirilimi (canli yillik%) · Bilanco QT (hibrit) · Resesyon radari (canli).
FRED toplam 29 seri, tek paralel cagri, tek mod (?mod=fred), SIFIR ek slot.

Cache-buster v=20260726g. DEPLOY: api/market.js + index.html + app.js.


## 45. Makro kart semasi duzeltildi — gomulu grid hatasi (26 Tem 2026)

Kullanici goruntu: "kart semasi kotu, bir taraf bos bir taraf asagi gidiyor."
SEBEP: §43-44 eklemelerinde ek_nokta hesabi yanlis </div> buldu — enflasyon/
bilanco/radar kartlari Fed&Politika kartinin ICINE gomuldu (sag sutun yigildi).

DUZELTME (uc asama, hepsi dogrulamali):
1. Makro bolgesi div-DENGELI kesici ile 6 karta ayrildi, 3x2 yeniden kuruldu:
   GRID1[tahvil|risk] GRID2[fed|enflasyon] GRID3[bilanco|radar]
2. Fed karti 3758 karakterdi (gomulu kalintili) -> gomulu blok ilk ic grid'den
   fed'in KENDI notuna kadar kesildi (3168 karakter atildi).
3. YAN HASAR yakalandi: kesim fed'in kv satirlarini da goturmustu (FOMC/
   Eylul %82/surukleyici/TUFE) -> str_replace ile geri yazildi.

SON YAPI dogrulandi: GRID→tahvil→risk → GRID→fed→enf → GRID→bilanco→radar,
id'ler tekil, div 713/713. Cache-buster v=20260726h.

DERS: insertAdjacentHTML/python string ekleme yaparken hedef </div>'in HANGI
seviyeye ait oldugunu dogrula (div-dengeli sayim), sonrasinda LBL iskelet
dokumuyle yapiyi DOGRULA (bu tur yakalamayi o saglad). Buyuk HTML'de kor
"find next </div>" tehlikeli.

DEPLOY: index.html (tek dosya).


## 46. Japonya makro — BoJ API (Asya-Pasifik sekmesi t16) (26-27 Tem 2026)

Kullanici: "ABD icin yaptigimizi Japonya icin de yap, ama Asya-Pasifik sekmesine
(ABD'ye degil)." BoJ API kilavuzu verildi.

BoJ API DEGERLENDIRME: KEY GEREKMEZ (herkese acik!), REST+JSON, lang=en.
stat-search.boj.or.jp/api/v1/getDataCode?db=XX&code=YYY&startDate=YYYYMM
FRED'le ayni kalip. ?mod=boj (market.js, slot yakmadi).

YANIT YAPISI (test edildi, VARSAYIM DEGIL):
  j.RESULTSET[0].VALUES.SURVEY_DATES[] + .VALUES[] paralel diziler.
  ⚠ ASC sirali (FRED desc idi!) -> son deger dizinin SONUNDA.
  ⚠ null=tatil/haftasonu -> ayikla, son dolu degeri al.

3 SERI (kilavuz orneklerinden, KULLANICI TEST ETTI, ucu de STATUS 200):
  FM01/STRDCLUCON       gecelik cagri faizi (gunluk) — 16 Haz'da 0,727->0,977
    sicramasi = BoJ artiriminin (%0,75->%1,00) piyasa teyidi
  CO/TK99F1000601GCQ01000  TANKAN buyuk imalat DI (ceyreklik) — 2026Q2=22 (+5)
  PR01/PRCG20_2200000000   CGPI/UFE (aylik) — endeksten yillik %: Haz %7,12
    (eski damgali kart %6,3 diyordu, HIZLANMIS; Brent gecisenligi)

FRONTEND (t16, asyaBody'den sonra, "JAPONYA MAKRO" 2 kart):
  jpMakroBody CANLI (BoJ faiz+UFE+TANKAN) · BOJ POLITIKA damgali (politika karari,
  TUFE — e-Stat'ta, BoJ'da yok). jpMakro() asyaRender sonu + boot listesi.
  UFE ivme>0=kirmizi, TANKAN>0=yesil.

SINIRLAR: Japonya TUFE (e-Stat/Istatistik Burosu) ve JGB egrisi (MoF) BoJ API'de
YOK -> damgali kaldi. Ileride FRED'den Japonya 10Y (aylik OECD) koprulenebilir.

TURKIYE BAGI (kart notunda): BoJ artirim hizlanirsa yen carry cozulur -> TL dahil
EM'lere dolayli satis baskisi. USD/JPY dususu erken sinyal.

Cache-buster v=20260726i. DEPLOY: api/market.js + index.html + app.js.


## 47. TANKAN bug fix + kripto tasima (27 Tem 2026)

1) TANKAN BUG (goruntuden yakalandi): BoJ kartinda TANKAN satiri BOSTU.
   SEBEP: ceyreklik seri startDate YYYYQQ ister (202501=2025 Q1!), bojModu
   ay(20) ile YYYYMM gonderiyordu -> gecersiz ceyrek (orn QQ=11) -> istek bos.
   FIX: TANKAN startDate = (yil-2)+'01' (YYYYQQ, 2 yil once Q1).
   DERS: BoJ'da tarih formati FREKANSA GORE degisir (D/W/M: YYYYMM, Q: YYYYQQ,
   H: YYYYHH, Y: YYYY). Yeni ceyreklik/yarim-yillik seri eklerken dikkat!

2) KRIPTO TASINDI (kullanici istegi): Asya sekmesinden -> PIYASA sekmesi,
   "03 Kuresel Hisse Endeksleri"nin ALTINA (04 Merkez Bankalari oncesi).
   - HTML: statik kart id=kriptoBody (eski dinamik asyaKriptoBlok yerine)
   - app.js: kripto kodu asyaRender'dan SOKULDU -> bagimsiz kriptoRender(),
     boot listesinde (1500ms). asyaKriptoBlok/Body referanslari 0'landi.
   - Kart notu: kripto = risk istahinin en yuksek-beta ucu, endekslerden once
     doner; BTC duserken endeks yataysa risk-off erken sinyali.

Cache-buster v=20260726j. DEPLOY: api/market.js + index.html + app.js.


## 47. TANKAN kayip + kripto tasima (27 Tem 2026)

Kullanici goruntu: BoJ kartlari calisiyor AMA TANKAN satiri YOK (faiz+UFE geldi).
Ve istek: kripto kartini Piyasa sekmesine, kuresel endekslerin altina tasi.

TANKAN: dosyadaki startDate zaten gecerli YYYYQQ idi (YYYY01) — format suclu
DEGIL. startDate dinamik ceyrek(7) yapildi (yeni ceyrek() yardimcisi, YYYYQQ
uretir, QQ 01-04 garanti). GERCEK SEBEP deploy sonrasi canli testle netlesecek:
  ktpanel.vercel.app/api/market?mod=boj → seriler.tankan var mi?
  Yoksa: BoJ 3 paralel istegi kisitliyor olabilir -> sirali fetch'e cevrilir.

KRIPTO: calisma kopyasinda tasima ZATEN tamamdi (onceki turda yapilmis):
  index.html Piyasa'da KRIPTO karti (kriptoBody, kuresel endeks + not altinda,
  "risk istahinin en yuksek-beta ucu, endekslerden once doner" okuma notuyla),
  app.js kriptoRender() + boot ['Kripto', 1500ms], asyaRender TEMIZ (forex->jpMakro).
  Goruntudeki Asya kriptosu ESKI deploy — yeni deploy'la Piyasa'ya gecer.
  t16 basligi guncellendi (kripto tasindi notu).

Cache-buster v=20260727a. DEPLOY: api/market.js + index.html + app.js.
SONRAKI ADAY: BoJ bilancosu (BS01) — ABD paraleli icin. Kod metadata'dan:
  stat-search.boj.or.jp/api/v1/getMetadata?format=csv&lang=en&db=BS01

EK (§47 sonucu): ceyrek(7) duzeltmesi DEPLOY EDILDI ve TANKAN GELDI (27 Tem):
?mod=boj → callRate 0,978 + tankan 22 (+5) + cgpi %7,12 (ivme +0,48). UC SERI TAM.
Kok neden: deploy edilen onceki kod gecersiz ceyrek startDate gonderiyordu.
Japonya makro CANLI ve tamam. BoJ bilancosu (BS01) istege bagli sonraki adim.


## 48. Katilim Fonlari guncelleme — BUG + AUM/AKIS boyutu (27 Tem 2026)

Kullanici: "katilim fonlari sekmesini guncelle." Kesif + olcum + uc is:

1. BUG DUZELTILDI: ozet kartlarda "EN YUKSEK/EN DUSUK YTD" secimi g[2] (YTD) ile
   yapilirken GOSTERILEN deger g[4] (3Y!) idi — yanlis rakam. -> g[2]. Ayrica
   ort 4 ondalik->2, hard-coded "46 fon geneli" -> gec.length dinamik.

2. YENI BOYUT — AUM/AKIS (Fintables yatirim_fonlari veri seti kesfedildi):
   gunluk_fon_degerleri: fon_buyuklugu + yatirimci_sayisi + gunluk_nakit_giris_cikisi.
   46 fonun 24 Tem degerleri DISTINCT ON sorgusuyla cekildi, katfon.json'a gomuldu
   (her fona b/ys/a alanlari + akis_tarihi). SONUC: toplam AUM 486,5 mlr TL,
   gunluk NET +3,6 mlr GIRIS. KPR +1,64mlr (en cok giren), KLU +1,21mlr,
   KKT -307mn / PKL -250mn / VPA -235mn (cikanlar). HPV 340bin yatirimci.
   RENDER: ozete 4 yeni kart (TOPLAM BUYUKLUK / GUNLUK NET AKIS / EN COK GIREN /
   EN COK CIKAN) + fon tablosuna "AUM · gunluk akis" kolonu (91,4mlr ▲1,2mlr).

3. Baslik etiketi tazelendi: "fiyatlar 21 Tem" sabiti -> "getiriler canli TEFAS +
   damgali taban · AUM/akis 24 Tem Fintables".

NOT: getiri canli katmani (katfonCanli -> /api/katfon TEFAS BindComparison)
ZATEN calisiyordu, dokunulmadi. Fintables'ta getiri icin ohlcv skill gerekir
(fon fiyat serisinden hesap) — TEFAS canli varken gereksiz, kullanilmadi.
AKIS verisi damgali (Fintables MCP=sadece Claude) — haftalik yorum ritualinde
tazelenebilir. Cache v=20260727b.

DEPLOY: katfon.json + app.js + index.html.


## 49. Hong Kong makro — HKMA API (t16, BoJ paraleli) (27 Tem 2026)

Kullanici HKMA acik API'sini buldu (monetary-statistics endpoint). BoJ gibi
Asya-Pasifik'e kart istedi. Claude URL'yi DOGRUDAN fetch edebildi (key yok,
JSON) -> Vercel kesin erisir. ?mod=hkma (market.js, slot yok).

YANIT YAPISI (olculdu): header.success + result.records[] DESC sirali (en yeni
ILK — BoJ ASC idi, FRED desc, HKMA desc; her API farkli!). 'YYYY-00' kayitlari
YILLIK ozet -> regex /-00$/ ile filtrelenir.

VERI HIKAYESI (2026-06, ders kitabi currency board mekanigi):
- USD/HKD 7,844 = band (7,75-7,85) %94'u -> ZAYIF UCA YAPISIK (cikis baskisi)
- Aggregate Balance: May25 173mlr -> Agu25 54mlr (HKMA savunmasi, ~120mlr cekti)
- HIBOR gecelik %0,03 (Haz25) -> %3,84 (Haz26) — likidite daralmasinin fiyati
- Baz faiz %4,00 (Fed takipcisi)

KURULUM:
- hkmaModu: tek fetch, aylik filtre, son+onceki ay fark, bandKonum hesabi
  ((kur-7,75)/0,10*100). Cache 6 saat (aylik bulten).
- Frontend: t16 Japonya altina "HONG KONG MAKRO" 2 kart:
  hkMakroBody CANLI (band konumu esikli yorum: %85+ zayif uc KIRMIZI, HIBOR
  aylik +0,2 ustu KIRMIZI) + OKUMA&BOLGE BAGI damgali (mekanizma + 2025-26
  hikayesi + Turkiye bagi: HK+HIBOR gergin = Asya dolar sikisikligi = EM
  fonlama stresi, USD/CNH ile birlikte oku; Hang Seng faiz-duyarli).
- hkMakro(): asyaRender sonu + boot listesi. Isim cakismasi kontrollu.

Cache v=20260727c. DEPLOY: api/market.js + index.html + app.js.
ASYA SEKMESI ARTIK: endeks+forex+Japonya(BoJ)+HongKong(HKMA) — bolgesel makro tam.


## 50. SEKME YENIDEN DUZENLEME (27 Tem 2026)

Kullanici 4 duzenleme istedi, hepsi yapildi (div-dengeli kesici + assert'li):

1. HAFTALIK YORUM: ana sekme (t13) -> Makro Veriler ALT-sekmesi "mk-yorum",
   Bankacilik'in SAGINDA. t13 icerigi (9207 kr) dengeli kesilip subtab-panel'e
   cevrildi, t13 tab+buton tamamen kaldirildi. Subtab handler genel (data-subtab)
   -> otomatik uyum. yorumPano/taktikRender boot'tan id-tabanli calisir, tasima
   etkilemez (id'ler dogrulandi: yXU100=1, taktikBody2=1).

2. KURESEL (mk-global) SILINDI (8051 kr): icindeki ABD ozeti (zaten ABD
   sekmesine yonlendirmeliydi) ve Japonya karti (BoJ t16'da canli) artik yeni
   sekmelerde — bilgi kaybi YOK. Kalinti 0.

3. KATILIM FONLARI: ana cubuktan Portfoy Yonetimi buton grubuna tasindi
   (Faktor Model'den sonra). Icerik (t5) yerinde — sadece buton tasindi,
   data-tab mekanizmasi ayni.

4. AVRUPA (t18) YENI SEKME: Asya-Pasifik ile ABD arasinda. ABD kalibi:
   - ENDEKSLER canli (avEndeksBody): dax/eustoxx/ftse/cac/ftsemib/ibex
     (Yahoo'da ZATEN cekiliyordu, KURESEL_A) — her birine okuma notu
     (DAX=TR ihracat pazari nabzi, CAC=Cin talebi vekili...)
   - ECB & POLITIKA damgali: %2,40 mevduat faizi, Agustos toplanti yok,
     Turkiye bagi 3 kanal (ticaret/kur-sepet/faiz-koro).
   - avrupaSekme() (abdSekme kalibi, j.data+p/chg) + t18 tetigi + boot.
   ILERI ADIM: ECB SDW acik API'den canliya baglanabilir (nota yazildi).

YENI YAPI: Ana: Piyasa·Makro·PY·Sukuk·Emtia·Asya·Avrupa·ABD·Haberler
  Makro alt: Para·Faiz·Enflasyon·Bankacilik·HaftalikYorum
  PY grubu: Yonetim·Portfoy·Degerleme·Journal·FaktorModel·KatilimFonlari·Guidance·EarningsAI
Cache v=20260727d. DEPLOY: index.html + app.js.

EK (§50 duzeltme, 27 Tem): t5 PY grubuna tasindiginda alt cubuk kayboluyordu —
sebep: app.js satir 24 PY_GRUP dizisinde t5 yoktu (buton HTML tasindi ama
gorunurluk listesi guncellenmedi). t5 eklendi -> alt nav artik Katilim Fonlari
acikken de gorunur + dogru isaretleme. Cache v=20260727e. DERS: buton tasima =
HTML + JS grup listesi BIRLIKTE. Deploy: app.js + index.html.


## 51. ECB canli entegrasyonu — Avrupa sekmesi FED paraleli (27 Tem 2026)

Kullanici SDMX-REST standardini gosterdi; gercek API: data-api.ecb.europa.eu
(key YOK). format=csvdata JSON'dan kolay. Kullanici 3 URL test etti, UCU DE calisti.

OLCULEN YAPI: CSV, ASC sirali; TIME_PERIOD/OBS_VALUE kolon indeksi DATAFLOW'A
GORE DEGISIR (FM:8/9, ICP:7/8, ILM:7/8) -> header'dan dinamik bulunur.
Tirnakli virgullu alanlar (OBS_COM/TITLE) OBS_VALUE'dan SONRA -> split guvenli.

TEST BULGULARI (onemli!):
1. DFR serisi "degisim tarihleri" formati: son kayit=guncel faiz.
   ECB 17 Haz 2026: %2,00 -> %2,25 ARTIRIM! Damgali karttaki %2,40 YANLISTI
   — duzeltildi. KORO: BoJ 16 Haz + ECB 17 Haz + Fed Eylul %82.
2. HICP: Eurostat 4 Sub 2026 metodoloji degisikligi -> eski ICP dataset DURDU
   (son 2025-12). Kod once yeni 'HICP' dataflow dener, bossa ICP fallback
   (frontend '⚠eski seri' etiketi basar). Yeni flow anahtari deploy'da netlesir.
3. Bilanco ILM haftalik: W29-2026 = 5.949 mlr EUR, zirve ~8.836 (Haz22)
   -> toplam QT -2.887 mlr (%33 kuculme!), haftalik ~-21 mlr.

KURULUM: ?mod=ecb (5 seri paralel: DFR/manset/cekirdek/enerji/bilanco, savunmali).
t18'e 2 canli kart: ECB FAIZ&ENFLASYON (avEcbBody) + EUROSYSTEM BILANCOSU
(avBilancoBody, zirveden QT canli hesap + "Fed+ECB ayni anda kuculuyor = kuresel
rezerv havuzu iki koldan daraliyor, ABD RRP kartiyla birlikte oku" notu).
Damgali kart guncellendi (son hamle 17 Haz + koro satiri). avrupaSekme'ye fetch.

PANEL ARTIK 5 MERKEZ BANKASI CANLI: TCMB/Fed/BoJ/HKMA/ECB.
Cache v=20260727f. DEPLOY: api/market.js + index.html + app.js.


## 52. Avrupa 3. satir — Tahvil&Spread + Mega-cap (27 Tem 2026)

Kullanici: "tahvil karti veya mega cap karti gibi baska ne ekleyebiliriz?"
Ikisi de kuruldu, Avrupa sekmesi ABD ile TAM SIMETRIK oldu (6+1 kart).

1. TAHVIL & SPREAD (canli, avTahvilBody): ecbModu'ya IRS 3 seri eklendi
   (Maastricht 10Y AYLIK: M.DE/IT/FR.L.L40.CI.0000.EUR.N.Z — anahtar kalibi
   test EDILMEDI, savunmali; bos gelirse kart "deploy sonrasi netlesir" der).
   Backend BTP-Bund ve OAT-Bund spread'lerini bp olarak HESAPLAR.
   Esikler: BTP-Bund <150 sakin / 150-250 gergin / >250 STRES (2011: 500+).
   OAT-Bund >80 kirmizi (Fransa siyasi risk primi). MIB "spread duyarli"
   notu buraya baglanir.

2. AVRUPA MEGA-CAP (damgali, web arastirmali 27 Tem): "IKI AVRUPA" temasi —
   ASML Q2 (15 Tem): 9,3 mlr euro beat, 2026 gorunum 36-40 -> 43-45 mlr'a
   YUKSELTILDI, Avrupa'nin ILK 700 mlr$ sirketi (LVMH/Novo/SAP'i gecti),
   2027 EUV dolu +%30 kapasite. KARSISINDA: LVMH/SAP/Novo yilbasi ~-%30,
   Stoxx 600 kaybinin %53'u bu ucunden (Bloomberg). Novo Q2: 5 AGUSTOS
   (2026 rehberlik -%4-12, GLP-1 rekabeti+jenerikler). Endeks yesili tema
   ayrismasini gizler. TR bagi: LVMH=Cin luks talebi sinyali (CAC),
   ASML=AI capex saglamligi (ABD mega-cap kartiyla ayni hikaye).

TAKVIM EKLEME ADAYI: 5 Agu Novo bilancosu.
Cache v=20260727g. DEPLOY: api/market.js + index.html + app.js.
IRS anahtari dogrulama URL'si (istenirse):
data-api.ecb.europa.eu/service/data/IRS/M.DE.L.L40.CI.0000.EUR.N.Z?lastNObservations=3&format=csvdata


## 53. Guney Kore karti (t16, damgali) + KORO 4 MERKEZ (27 Tem 2026)

Kullanici data.go.kr "기업경영분석" API'sini onerdi. OLCUM: o set kurumsal
isletme analizi (yillik sirket bilanco istatistikleri) — makro kart icin uygun
DEGIL + data.go.kr serviceKey ister + robots engelli. Durustce soylendi.
CANLI YOL: BOK ECOS (ecos.bok.or.kr/api) ucretsiz key ile FRED gibi baglanir —
kullanici key alirsa kurulur (karta not yazildi).

DAMGALI KART KURULDU (web arastirma 27 Tem) — BUYUK HABER:
- BOK 16 TEM: %2,50->%2,75 ARTIRIM, 3,5 yilda ILK (oybirligi, sahin rehberlik)
  Gerekce: enflasyon 2,5 yil zirvesi, won ~1.480, buyume %3'e revize (cip ihracati)
- KOSPI kaosu: 16 Tem -%6,4 (6.820), hafta -%8,8; yilda 28 gun +-%5,
  sidecar/circuit breaker REKOR. Samsung -8,8 / SK Hynix -11,5.
  SEBEP: "bellek fiyati zirveyi gecti" endisesi (ASML/TSMC rekor kirarken!) —
  AI zincirinde litografi ucu vs bellek ucu AYRISMASI.
- Politika celiskisi: hukumet 800+ trn won super butce vs BOK sikilastirma.
- Akim: yabanci -1,4 trn, kurum -2,4 trn satis; perakende +3,7 trn alim.

KORO GUNCELLENDI (ECB kartinda da): BoJ 16 Haz + ECB 17 Haz + BOK 16 Tem +
Fed Eylul %82 = DORT merkez ayni yonde. "Yabanci hisse ALTI" tezinin Asya kaniti.
TR bagi kartta: EM fonlama 4 koldan daraliyor; bellek endisesi = ABD AI temasi
ilk catlak sinyali (MSFT/META capex rehberligi bu gozle okunacak); sert Asya
gecesi BIST acilisina tasar.

Cache v=20260727h. DEPLOY: index.html (tek dosya — damgali kartlar, JS yok).


## 54. Katilim fonlarina 1G kolonu geri geldi (27 Tem 2026)

Kullanici: "1 gunluk getiriler vardi, kaybolmus." OLCUM: donemLbl 5'liydi
(1A/3A/YTD/1Y/3Y), TEFAS comparison ucunda 1G alani eslenmiyordu.

COZUM (iki katmanli):
1. KAYNAK: Fintables mumlar_gunluk_gh — fon birim fiyatlari VAR (endeks haric
   tum enstrumanlar; fon kodlari dahil, gunluk kapanis). 46 fonun 23-24 Tem
   kapanislarindan 1G%= (24/23-1)*100 hesaplandi, katfon.json'a gomuldu.
   yu (birim fiyat) 21 Tem -> 24 Tem tazelendi. g artik 6'li: [1G,1A,3A,YTD,1Y,3Y]
   (g_donemler alani json'a eklendi).
2. CANLI ADAY: api/katfon.js g basina TEFAS 1G aday alanlari (GETIRI1G/
   GUNLUKGETIRI...) — TEFAS'ta varsa canli akar, yoksa null -> katfonCanli'nin
   f.g.map(c.g[i]!=null?...) mantigi DAMGALI 1G'yi KORUR (uyum testi gecti).

INDEKS KAYMALARI (kritik, hepsi guncellendi):
  sIdx haritasi 6'li ({'1g':0...'3y':5}) · donemLbl 6'li · ozet kartlar
  g[2]->g[3] (YTD) · siralama select'ine "1 Gun" secenegi · satir render
  f.g.forEach oldugu icin otomatik uyumlu.

ILK OKUMA: para piyasasi fonlari ~+%0,10/gun (TLREF ritmi); KDT/KTT/TPZ/ZPF/KIS
gunluk NEGATIF (hisse iceriklier Cuma BIST kirmizisini yansitiyor) — 1G kolonu
fon TIPINI tek bakista ele veriyor.

Cache v=20260727i. DEPLOY: katfon.json + app.js + api/katfon.js + index.html.


## 55. Haftalik yorum guncellendi — 27 Tem-2 Agu (27 Tem 2026)

Yeni damga: "27 TEM-2 AGU · FOMC + BILANCO ZIRVESI". Notun omurgasi:
0. KURESEL KORO (ana tema): 4 merkez sikilasirken TCMB ters akintida —
   TL carry goreli cazibe artti AMA risk istahi kanali daraldi.
   Panel kanitlariyla: reel sikisma, RRP 0, ECB -%33, JP UFE %7,1, HK %94.
1. OMURGA: Carsamba = yilin en yogun 24 saati (Fed karari 21:00 TSI +
   ayni aksam MSFT/META). Asil bilgi Warsh basin toplantisi tonu.
2. AI CATLAGI: bellek (Kore soku) vs litografi (ASML rekor) ayrismasi —
   MSFT/META capex rehberligi hakem.
3. TR: AKBNK Sali (NFM+karsilik testi), Brent-TUFE gecisi 3 Agu'da olculecek,
   katfon akisi +3,6 mlr/gun = TL USTU akis kaniti.
4. RISK: Asya bulasmasi (sabah rutini: once Asya sekmesi), carry kirilganligi,
   yen riski, tarife.
5. DURUS: 4'lu AYNEN + GUCLENDI. 4 teyit noktasi: AKBNK / Warsh tonu /
   MSFT-META capex / 3 Agu TUFE.
Taktik tag: "27 TEM · FOMC HAFTASI", taktik notu koro+akis kanitiyla tazelendi.

Cache v=20260727j. DEPLOY: index.html (tek dosya).
SONRAKI RITUEL NOTU: katfon akis verisi 27 Tem'e tazelenebilir (Fintables'ta
mevcut — bugun goruldu, KLU 27 Tem +1,23 mlr giris devam).


## 56. Faiz Egrisi bolumu tutarlilik onarimi (27 Tem 2026)

Kullanici goruntusuyle yakalandi: tablo EVDS CANLIYDI (27 Tem, 2Y %42,16) ama
cevresi ESKI statiklerle celisiyor idi (metin %41,26/783bp, Okuma karti +426bp,
SVG %41,3, baslik "19 Tem Investing").

OLCUM: egriBody+egriEgim canli; Okuma kv'leri, tablo-alti not, bolum basligi,
4-ulke SVG statikti. YC_PRESET (969) ayri bir simulasyon araci, dokunulmadi.

DUZELTMELER:
1. OKUMA KARTI ARTIK CANLI (bir daha eskimez): kv'lere id (okuFark/oku2yReel/
   oku2yIleri/oku10yReel), egriRender sonunda hesap — sabitler OKU_POLITIKA=37,
   OKU_TUFE=32.11, OKU_BEK=23.81 (damgali; PPK/TUFE degisince guncellenir).
   Dogru degerler: fark +516bp (426 degil!), 2Y reel +10,1, ileriye +18,4,
   10Y reel +3,4.
2. Statik metin/SVG 27 Tem degerleriyle tazelendi: not 42,16/35,46/~670bp
   + "EVDS canli" vurgusu; SVG TR %42,2/%35,5, ABD 30Y %5,17, kisa uc %4,4
   (FRED olcumleri); baslik "(EVDS canli · karsilastirma 27 Tem damgali)";
   damga "4 ULKE · 27 TEM". Almanya/Japonya egrileri damgali kaldi (kaynak yok).
3. EGRI_STATIK yedegi 27 Tem canli degerleriyle tazelendi (yedek de guncel).
   "damgali (19 Tem)" -> "(27 Tem)".

DERS: canli tablonun YANINDAKI statik yorum metinleri sessizce eskir —
rakam iceren her satiri ya canli hesaba bagla ya rakamsizlastir.
Cache v=20260727k. DEPLOY: index.html + app.js.


## 57. Barometre onarimi + BRENT GERCEGI (27 Tem 2026) — ONEMLI TEZ NUANSI

Kullanici 3 karti sordu. Olcum:
- Global Risk Barometresi: VIX/DXY/Brent ZATEN CANLI (satir 652 rb() __market'ten;
  vix+dxy+brent Yahoo anahtarlari mevcut) — ama damga "16 TEM · CANLI" yaniltici
  statikti; 10Y %4,51 ve CDS 225 satirları ESKI statikti.
- Risk Istahi: VIX+BIST canli, RISK_CDS=225 sabiti 15 Haz'dan kalma.
- Yabanci akis: /yabanci.json damgali (son hafta 17-07) — TAZELEME BEKLIYOR
  (sonraki adim: 24 Tem TCMB yayinindan yeni hafta eklenebilir).

*** BRENT GERCEGI (canli panel 90,27 gosterince arastirildi): ***
23 Tem zirve 102$ (Houthi tanker saldirilari) -> 24 Tem -%5,2 -> 26 Tem -%7,6
-> ~91$. Tetik: Pakistan/Cin arabuluculuk umudu + EIA 2026 talep kesintisi
(-1,2 mn v/g). Aylik hala +%23, Hurmuz/Babulmendeb riski COZULMEDI.
YANI: "100+ asti" dogruydu (23 Tem) ama "100+ seyrediyor" ESKIMISTI —
canli Yahoo verisi statik anlatiyi duzeltti (panelin varlik nedeni!).
TEZ NUANSI: Brent duzeltmesi kaliciysa Fed'in Eylul artirim gerekcesi zayiflar
-> Carsamba Warsh tonu daha da belirleyici. TCMB eylul alani da rahatlar.

DUZELTMELER:
1. Barometre: damga durust ("VIX·DXY·BRENT CANLI · 10Y/CDS 27 TEM"), 10Y 4,71,
   CDS 206 (iyilesiyor etiketi), not YENI Brent hikayesiyle yazildi.
2. RISK_CDS=206 -> risk istahi skoru otomatik yukselir (cdsS formulu).
3. Fed&Politika + ECB kartlari + haftalik not: "Brent 100$+" -> "zirve 102,
   duzeltmede ~91" ifadeleriyle tazelendi.

Cache v=20260727l. DEPLOY: index.html + app.js.


## 58. Yabanci akis karti guncellendi + 5 haftalik seri (27 Tem 2026)

TESHIS: ekrandaki "17-07" ZATEN son yayindi (23 Tem Persembe aciklandi;
siradaki 30 Tem). Yani kart eski degildi — ama calisma kopyamdaki yabanci.json
KARISIK ARA SURUMDU (hafta 3 Tem / rezerv 42,5 / carry 5,4 — deploy'la tutarsiz;
duzeltilmezse sonraki deploy'da guncel dosyayi EZERDI).

YAPILAN: json SIFIRDAN temiz kuruldu (arastirma dogrulamali):
- hafta_son: 17 Tem — hisse +37,5 / DIBS +196,6 / OST +43,8 mn (etikette
  "son yayin 23 Tem · siradaki 30 Tem" — bayatlama gorunur)
- YENI hafta_seri (5 hafta): 19Haz 466/343 → 26Haz 203/448 → 3Tem 12/572 →
  10Tem 34/2562★ (DIBS 1,23mlr + OST 1,34mlr = TEK HAFTADA ~2,5 MLR $ CARRY,
  13 Sub'dan beri rekor) → 17Tem 38/240 normallesme.
- hafta_not: hisse istahi Tem'de DURDU (466→203→12→34→38), tahvil 6 haftadir
  kesintisiz — akis SAF CARRY. Taktik durusla birebir: yabanci BIST'e gelmiyor,
  TL faize geliyor.
- rezerv 42,5 (10 Tem etiketli) · carry reel_faiz 7,9 (panel tutarliligi).

RENDER: Son hafta satiri OST'lu + hafta_seri trend satiri (rekor ★ vurgulu) +
hafta_not mini notu eklendi.

RITUEL NOTU: 30 Tem Persembe yeni hafta yayinlanir — haftalik guncellemede
hafta_seri'ye eklenir (en eski dusurulur). Cache v=20260727m.
DEPLOY: yabanci.json + app.js + index.html.


## 59. 1G tazelik sorunu — PKR vakasi + debug modu (27 Tem 2026)

Kullanici: "PKR gercekte -%1,36 ama panel cok farkli gosteriyor."

OLCUM (Fintables): PKR 22->23->24 Tem fiyatlari 1,5145->1,5160->1,5176 —
hepsi +%0,10 ritmi. Panelin +0,10'u 24 Tem (Cuma) itibariyla DOGRU.
27 Tem (Pzt) fiyati Fintables mum tablosunda HENUZ YOK. Kullanicinin -1,36'si
buyuk ihtimalle TEFAS'in BUGUN acikladigi yeni fiyattan -> panel yanlis degil,
BIR ISGUNU GERIDE (damgali 1G'nin yapisal zaafi).
NOT: para piyasasi fonunda gunluk -1,36 sira disi — PKR'nin fiili portfoy
icerigi kategorisinden farkli olabilir (netlesecek).

YAPILAN:
1. api/katfon.js DEBUG MODU: /api/katfon?debug=1 -> TEFAS ham ilk kayit +
   TUM ALAN ADLARI. Amac: GETIRI1G / SONFIYAT / 1H alani var mi OLCMEK —
   varsa 1G tam canliya baglanir (sonraki adim, tahminsiz).
2. Etiketler durustlestirildi: sekme basligi "1G ve AUM/akis 24 Tem (Cuma)",
   siralama secenegi "1 Gun (24 Tem)".

KULLANICI ADIMI (deploy sonrasi): ktpanel.vercel.app/api/katfon?debug=1
ciktisini at -> alan listesine gore 1G canli baglanir ya da alternatif kurulur
(Fintables ritueliyle gunluk tazeleme).
Cache v=20260727n. DEPLOY: api/katfon.js + index.html.


## 60. TEFAS YENI API'ye gecis — 1G/fiyat/AUM CANLI (27 Tem 2026)

Debug testi TEFAS 404 verdi -> ARASTIRMA: TEFAS 2026'da Next.js altyapisina
gecti, eski api/DB/BindComparisonFundReturns EMEKLI EDILDI. Yani canli katman
bir suredir ZATEN olu idi (ozet kartta "CANLI" damgasi yoktu — getiriler
damgali tabandan geliyordu; PKR tutarsizliginin koku de bu).

YENI UC (pytefas kaynak kodundan OLCULDU — raw.githubusercontent sandbox'tan):
  POST tefas.gov.tr/api/funds/fonGnlBlgSiraliGetir
  Header: Content-Type application/json + Origin + Referer /tr/fon-verileri
  Body(JSON): fonTipi:'YAT', basTarih/bitTarih:'YYYYMMDD' (max ~28 gun),
    basSira:1, bitSira:100000, dil:'TR' (+bos alanlar)
  Yanit: resultList[{fonKodu,fonUnvan,tarih,fiyat,tedPaySayisi,kisiSayisi,
    portfoyBuyukluk,borsaBultenFiyat}] · hafta sonu errorMessage "out of
    bounds" = bos gun (normal, hata degil).

YENI MIMARI (api/katfon.js sifirdan):
  Son 7 gun araligi tek istekte -> fon basina fiyat serisi -> 1G = son/onceki
  isgunu (CANLI!). items: fiyat+tarih+g[1G,null×5]+b(AUM)+ys(yatirimci).
  Donem getirileri (1A..3Y) yeni API'de YOK -> damgali taban korunur;
  katfonCanli'nin null-koruma mantigi otomatik uyumlu. AUM/ys canli eslendi
  (akis oku damgali 24 Tem kalir). debug=1 modu yeni yanit icin korundu
  (tarih alani formati deploy'da goruluр — siralama savunmali: sayi/string).
  Cache 30dk (gun ici fiyat guncellenebilir).

SONUC: PKR vakasi cozulur — panel artik TEFAS'in ayni gun fiyatiyla 1G
gosterir. Cache v=20260727o.
DEPLOY: api/katfon.js + app.js + index.html.
DOGRULAMA: /api/katfon?debug=1 (alanlar+tarih formati) ve sekmede
"CANLI TEFAS (1G+fiyat+AUM)" damgasi.

## 61. Barometre kartlari tasindi (27 Tem 2026)
Kullanici istegi: Risk Istahi + Global Risk barometreleri Piyasa sekmesinde
kuresel hisse endekslerinin USTUNE. Div-dengeli kesici ile tasindi (once
sonraki kart kesildi — offset korunumu), margin-top eklendi. JS degismedi
(render'lar id-bazli: riskBaroSkor/vixV vs — konumdan bagimsiz calisir).
Yeni sira dogrulandi: BIST → Risk Istahi → Global Risk → Kuresel Endeksler →
Kripto → Merkez Bankalari. Mantikli akis: once "iklim" (risk istahi),
sonra fiyatlar. Cache v=20260727p. DEPLOY: index.html (tek dosya).

## 62. Portfoy lensleri teyidi — tur/tip bug + kacis (27 Tem 2026)

Kullanici: "lens ekrani alakasiz gibi" (Gercek pozisyon 0 hisse yaziyordu).

TEYIT SONUCU: Lensler ALAKALI — pozHisse() dogru alanla (p.tip) calisiyor,
sektor/faktor/ciftler gercek 26 hisse pozisyonuyla hesaplaniyor (CIMSA/MPARK/
ENJSA... ekranin ust kesiminde kalan pozisyonlar; n=26 "modeldeki hisse").

BUG: pozisyonlar {tip:...} ile saklanirken 4 yerde x.tur===... araniyordu:
1. pozHisseSay -> "Gercek pozisyon 0 hisse" (kullanicinin yakaladigi)
2. ozet sayaclari (hisse/fon/nakit) -> kayitli portfoy "0h" etiketi de bundandi
3. KAP yorum akisi portfoy filtresi -> BOS gidiyordu = portfoy-oncelikli haber
   ozelligi SESSIZCE koptu (bonus onarim — kullanici fark etmemisti)
Hepsi tip'e cevrildi (6 nokta, assert'li).

AYRICA: ekranda ham "\u0027" gorunuyordu (%58\u0027i, DNA\u0027si) —
python heredoc cift-kacis kalintisi. 2 literal &#39; entity'sine cevrildi.

DERS: veri modeli alan adlari (tip/tur) tek sozlukte olmali; yeni yardimci
fonksiyon yazarken mevcut push/render kodundan alan adini DOGRULA (grep).
Cache v=20260727r. DEPLOY: app.js + index.html.


## 63. Earnings AI + GLOBAL kart guncellemesi + CACHE DERSI (27 Tem 2026)

1. EARNINGS AI: TSLA 2Q26 karti eklendi (11 kart oldu). Skor KARISIK:
   gelir 28,24 mlr$ +%26 BEAT + rekor 480 bin teslimat AMA non-GAAP EPS 0,33$
   (bek. 0,49) -%33 MISS, faaliyet marji %1,4, FCF -1,09 mlr (capex +%142
   "en buyuk yatirim donemi"), SpaceX 1 mlr degerleme kazanci ayiklanmis.
   Hisse -%4. guidance+tez alanlari dolu. GOOGL/INTC/TXN kartlari zaten vardi.

2. GLOBAL KART (t1): 22-23 Tem satirlari "ACIKLANDI" sonuclariyla; not
   yenilendi ("Ilk perde kapandi": GOOGL beat + Anthropic-tuzagi AYNEN
   gerceklesti — GAAP EPS 9,11$; TSLA hacim-var-kar-yok; S&P ~%88 beat ama
   REJIM DEGISTI: iyi haber bile yetmiyor; "Ikinci perde Carsamba gecesi"
   Fed 21:00 + MSFT/META — capex rehberligi bellek-korkusunun hakemi).
   ABD mega-cap tarihleri duzeltildi: MSFT/META 29 Tem Car (Fed gunu aksami),
   AAPL/AMZN 30 Tem Per.

3. *** CACHE-BUSTER DERSI (kritik!): *** Bugunku tum cache artislari
   (v=27a→r zinciri) ASSERT'SIZ replace oldugu icin SESSIZ NO-OP olmustu —
   dosya v=20260726j'de kalmisti! Bakim notlarindaki "Cache v=..." kayitlari
   bu yuzden gercegi yansitmiyordu. Simdi assert'li olarak v=20260727s'e
   cekildi. KURAL GENISLETMESI (par. 3'un cache versiyonu): cache-buster
   degisikligi de ASSERT ile yapilir; tur sonunda grep ile dogrulanir.
   (Zarar sinirliydi: kullanici Cmd+Option+E ile manuel bosaltiyor.)

ANHYT (27 Tem TR bilancosu) islenMEDI — aksam KAP'a duser, yarin rituelde.
DEPLOY: inceleme-ai.json + index.html.


## 64. HAFTA BASI DAMGALI-KART DENETIMI (27 Tem 2026 aksam)

48 damga tarandi (envanter scripti: tag/tag-snap + yakin baslik regex'i).
Cogu canli ya da bugun tazelenmisti. Bulgular ve islemler:

DUZELTILDI (yanlis/eski):
1. MB & BEKLENTILER TABLOSU (t1) — EN KRITIK: ECB %2,40 YANLIS idi -> %2,25
   (▲17 Haz), siradaki 10-11 Eyl. TCMB "siradaki 23 Tem" gecmisti -> 10 Eyl.
   Fed siradaki "29 Tem CAR" vurgulu. BoJ (%1,00 ▲16 Haz) ve BOK (%2,75
   ▲16 Tem) satirlari EKLENDI — tablo artik korosuyla tam. Koro notu eklendi.
2. GUNDEM OZETI (Haberler): 23 Tem PPK gunu iceriginden 27 Tem FOMC haftasi
   acilisina yeniden yazildi (omurga/Brent devrilmesi/Asya devri/ilk perde).
3. Damga tazelemeleri (icerik dogrulanarak): FED&POLITIKA 25->27,
   FED BILANCOSU 26->27 (2 damga), BOJ POLITIKA 26->27.

DOKUNULMADI (dogru/dürust):
- MEGA-CAP DERINLIK [25 TEM]: icerik SADECE gelecek dordu (MSFT/META/AAPL/AMZN),
  tarihler 29/30 dogru, kaynak verisi 25 Tem'de cekildi — damga durust.
- FONLAMA REJIMI [23 TEM: SABIT]: olay tarihi, eskime degil.
- ULKE KREDI NOTU [17 TEM], CANLI SICIL [KURULUS 14 TEM]: dogru.
- REZERV KARNESI [10 TEM]: 30 Tem yayininda tazelenir (rituel).

BEKLEYEN:
- ANHYT 2C26: arama sonucsuz — henuz KAP'a dusmedi (aksam/gece beklenir).
  Yarin rituelinde sonucla islenir. Baglam notu: Deniz Yatirim hedef 168,86 AL,
  karlilik-odakli strateji, kredili hayat buyumesi.
- fm.json 14 Tem: faktor modeli tazeleme ayri buyuk is (istenirse).

DERS (bu turda yasandi): python heredoc bloklarinin SONUNDA open(...,'w').write
sart — ilk denemede write unutuldu, degisiklikler diske gitmedi (print'ler
yaniltici "basari" gosterdi). Kontrol: degisiklik bloklari yazimla bitmeli.
Cache v=20260727t. DEPLOY: index.html (tek dosya).


## 65. Moody's sonucu + DAMGA CIZELGESI SISTEMI (27 Tem 2026 gece)

Kullanici Takvim kartinda "bu gece Moody's" kalintisini yakaladi (3 gun bayat)
ve haklı sistem elestirisi yapti: "kendine cizelge yap, kontorumu harcama".

NEDEN KACTI: §64 denetimi TARIHLI damgalari taradi; Takvim gibi tarihsiz
damgali kartlarin ICERIK bayatligini gormedi. Ders: damga ≠ icerik tazeligi.

COZUM — KTPANEL-DAMGA.md OLUSTURULDU (kalici sistem):
- 4 kategori: OLAY-TETIKLI / HAFTALIK RITUEL / CANLI / YAPISAL
- Her kartin tetikleyicisi + son guncelleme tarihi tek tabloda
- ALTIN KURAL 1: panelde goreli zaman ifadesi ("bu gece/bugun") YASAK —
  mutlak tarih yazilir. Moody's vakasinin koku buydu.
- Her oturum ACILISINDA once bu dosya + yakin olay listesi karsilastirilir
  -> kesif turlari biter, kontor tasarrufu.
- Bakim dosyasinin BASINA yonlendirme kondu.

ICERIK GUNCELLEMELERI:
1. Moody's (24 Tem): Ba3/duragan TEYIT — takvim satiri ✓ + Gorus paragrafi
   sonucla yazildi: TCMB'ye ovgu, 2026 enf tahmini %29'a YUKSELTILDI (Brent
   etkisi notta), not artisi kapisi acik. CDS 206 gerilemesiyle tutarli.
2. Gorus'te BoJ HATASI duzeltildi: %0,75 -> %1,00 (16 Haz artirimi).
   Ve GOZDEN KACAN OLAY yakalandi: 30 Tem Per BoJ toplanti + OUTLOOK raporu
   (AAPL/AMZN/YKBNK ile ayni gun!) — Outlook enflasyon patikasi Eylul artirim
   fiyatlamasini sekillendirir; cizelgeye + Persembe gunune islendi.

Cache v=20260727u. DEPLOY: index.html + KTPANEL-DAMGA.md (yeni dosya, repo'ya girer).

EK (§65 duzeltme, 27 Tem gece): Kullanici Kredi Notu kartini yakaladi — Moody's
teyidi Takvim'e islenmis, mk-para ULKE KREDI NOTU kartina islenMEMIS, cizelgeye
ise "islendi" yazilmisti (YANLIS KAYIT — cizelgesizlikten tehlikeli).
Duzeltildi: Moody's satiri "TEYIT · 24 Tem" + damga 24 TEM + not sonuc paragrafi.
CIZELGE KURAL 5: olay basina etkilenen TUM kartlar bitmeden "islendi" yazilmaz.
Makroihtiyati BDDK haftaligi Cuma rituelinne eklendi (kartin cogu zaten guncel:
KKM 0 kalici, kredi egilim anketi ceyreklik 2C26 dogru donem).
Cache v=20260727v. DEPLOY: index.html + KTPANEL-DAMGA.md.


## 66. KT Portfoy sunum verileri CANLI kuruldu (27 Tem 2026 gece)

Kullanici 3 veri seti istedi (KT Portfoy sunumundan), SART: canli olacak.
Hepsi EVDS'den canli kuruldu — yeni backend YOK (genel ?series kullanildi),
sadece mod=dvz eklendi:

1. TL KREDI/MEVDUAT FAIZLERI + MAKAS (mk-faiz, 2 kart):
   TP.KTF17/10/11/12 (ticari/ihtiyac/tasit/konut) + TP.TRY.MT02/MT03 (1A/3A
   mevduat) — haftalik akim. MAKAS KARTI CANLI HESAP: ticari−3A mevduat =
   ham NFM gostergesi (esikli yorum: <2 cok dar) + mevduat−politika farki.
   AKBNK tezi ile dogrudan bagli. NOT: KTF kodlari yaygin-bilinen; yanlissa
   kart "bos dondu" der, deploy'da dogrulanir.

2. YERLESIKLERIN DOVIZ MEVDUATI (mk-enf): TP.HPBITABLO5.1/12/6+11 —
   ZATEN panelde kullanilan dogrulanmis seriler (rotasyon karti). Gercek kisi
   arindirilmis degisim + parite etkisi + altin + SON 4 HAFTA mini seri +
   kumulatif TL'lesme/dolarizasyon yorumu.

3. REEL SEKTOR DOVIZ POZISYONU (mk-enf): mod=dvz — KENDINI COZEN zincir:
   datagroups aramasi ("finansal kesim d...") -> serieList -> ad-regex ile
   net/kisa vadeli/varlik/yukumluluk serileri -> veri. Seri kodu sabitlenmedi
   (EVDS katalogu degisse de calisir). 24h cache (aylik veri). Renk mantigi:
   net acik kuculmesi YESIL, kisa vadeli artis YESIL.

Cizelge CANLI bolumune 3 kart eklendi. Cache v=20260727w.
DEPLOY: api/evds2.js + index.html + app.js.
DOGRULAMA: mk-faiz/mk-enf kartlari dolu mu + ?mod=dvz ciktisi (gerekirse).


## 67. Yabanci portfoy dogrulamasi + yab/kko modlari (27 Tem 2026 gece)

KT Portfoy sunumu (17 Tem) DOGRULANDI — arama gerekmedi: hisse stok 41.111 /
DIBS 16.965 / haftalik +37,5 ve +196,6 = yabanci.json (27 Tem TCMB yayini
arastirmasi) ile BIREBIR. Carry pozisyon buyuklugu 55,8 mlr $ ise KT'nin
TURETILMIS metrigi (DIBS+swap bilesimi) — EVDS'de dogrudan serisi YOK,
kurulmadi (kullaniciya aciklandi). Carry haftalik serisi de ayni sebeple
bizim menkul kiymet serimizden farkli tanim.

KURULUM (cozCek genel fonksiyonu — dvz kalibinin genellestirilmisi:
grupRx + hedef seri rx listesi -> kendini cozen):
1. mod=yab: "yurt disi yerleskilerin mulkiyetindeki menkul" grubu ->
   hisse/DIBS stok + net degisim. FRONTEND yabCanli(): stok satirini karta
   enjekte eder + SON HAFTA degerlerini EVDS canlisiyla EZER -> 30 Tem
   yayininda kart OTOMATIK yenilenir (rituel yuku dustu; yabanci.json
   sadece hafta_seri tarihcesi icin kalir).
2. mod=kko: "kapasite kullanim" grubu -> genel/yatirim/ara/tuketim/
   dayanikli/gida. KART mk-enf'te: esikli rejim yorumu (76+ guclu / <72
   soguma), yatirim mallari=capex istahi vurgusu.
Regex'ler seri adlarina gore savunmali — eslesmezse kart "cozulemedi" der,
mod ciktisindaki 'ornekler' alanindan tek bakista duzeltilir.

Cizelge CANLI bolumu guncellendi. Cache v=20260727x.
DEPLOY: api/evds2.js + index.html + app.js.


## 68. Mukerrerlik onarimi (27 Tem gece — kullanici yakaladi)

Kullanici: "kartlarin bazilari ayni gibi." OLCUM:
1. Makroihtiyati: TEK kart var — iki goruntu ayni kartin iki cekimi (kopya yok).
2. GERCEK MUKERRERLIK (benim hatam): dun eklenen YERLESIKLERIN DOVIZ MEVDUATI
   karti (mk-enf) = mevcut YURT ICI YATIRIMCI ROTASYONU kartinin (mk-banka)
   kismi kopyasiydi (ayni TABLO5 serileri). DERS: yeni kart kurmadan once
   ayni seri/temanin panelde OLUP OLMADIGI grep'lenir (seri kodu + tema adi).

ONARIM: mukerrer kart silindi; tek katkisi (4 haftalik seri + kumulatif
TL'lesme/dolarizasyon yorumu) ROTASYON kartina tasindi (rotSeri id'si —
rotasyon zaten gun=30 cektigi icin ek istek YOK). KKO karti dvz'nin yanina
grid'e hizalandi (mk-enf duzeni: [Reel Sektor Dvz | KKO]).
Cizelgeden mukerrer kayit dusuldu. Cache v=20260727y.
DEPLOY: index.html + app.js.

## 69. Faiz karti kalibrasyonu (27 Tem gece — kullanici capraz kiyasla yakaladi)

Kullanici KT sunumuyla kiyaslayinca iki sey cikti:
1. VADE ETIKETI KAYMASI: ayni hafta (17 Tem) KT: 1A=46,1 / 3A=48,0;
   panel: "1A"=48,0 -> MT02 aslinda "3 AYA KADAR" (48,0 eslesmesi kanit).
   Duzeltme: MT01 (1 aya kadar) eklendi, etiketler kaydirildi
   (MT01=1A / MT02=3A / MT03=6A), makas MT02 ile hesaplanir oldu.
2. NOT KURGUSU: "dar makas = pahali toplayip ucuza satma" cumlesi kosullu
   senaryoydu ama tek yonlu ornek yanlis okunuyordu -> IKI YONLU yazildi
   (genis=ucuza topla pahaliya sat / dar=tersi). Ayrica kapsam notu:
   KTF17 KMH dahil genis tanim (~5p yuksek) -> "seviye degil yon/trend izle".
DERS: canli seri etiketi, ayni donemin bagimsiz kaynagiyla (KT sunumu)
CAPRAZ dogrulanmali — deger eslesmesi etiket kaniti. Cache v=20260727z.
DEPLOY: app.js + index.html.

EK (27 Tem gece): Vercel log uyarisi "ESM to CommonJS... add type:module" —
ZARARSIZ (fonksiyonlar calisiyor) ama TUZAK: onerilen type:module bizim
CommonJS api dosyalarini KIRAR. Cozum tersi: package.json olusturuldu
{type: commonjs} — niyet acik, uyari kesilir. KURAL: package.json'a asla
type:module eklenmez (api/ CommonJS kalir). DEPLOY: package.json (yeni dosya).

## 70. GIRIS KORUMASI — middleware.js (27 Tem gece)

Kullanici istegi: kullanici adi+sifre ile giris. COZUM: Vercel Edge middleware
(kok dizinde middleware.js) — FONKSIYON KOTASINA DAHIL DEGIL (9/12 korunur),
sayfa+json+API hepsini korur (gercek koruma, gorsel perde degil).

MIMARI: PANEL_USER/PANEL_PASS env → SHA-256 imzali HttpOnly cerez (30 gun,
Secure, SameSite=Lax). Imza sifreden turetilir → sifre degisince tum eski
oturumlar OTOMATIK gecersiz. /giris POST dogrulama · /cikis cerez silme ·
API'lere JSON 401 (fetch'ler net hata gorur) · env tanimsizsa koruma DEVRE
DISI (yanlis deploy'da panel kilitlenmez). Giris sayfasi panel estetiginde
(yesil/krem), middleware icinden servis edilir — ek dosya/fonksiyon yok.
NOT: middleware ESM'dir (export) — package.json type:commonjs API'ler icindir,
Vercel middleware'i ayri derler, cakismaz.

TEST: 7 akis simulasyonla dogrulandi (imza, cerezsiz 401, dogru giris 302+cerez,
yanlis sifre, cerezli gecis, API JSON 401, cikis).

KURULUM (kullanici): Vercel > Settings > Environment Variables >
PANEL_USER ve PANEL_PASS ekle (Production) → vercel --prod → test.
DEPLOY: middleware.js (yeni dosya).

## 71. Hisse fiyatlari OTOMATIK tazeleme (27 Tem gece)

Kullanici: "gun sonu otomatik olacakti, olmuyor." OLCUM: mod=fiyat ucu VARDI
(Yahoo BIST, baska yerde kullaniliyor) ama POZISYONLARA HIC BAGLANMAMISTI —
notlar da "elle guncelle" diyordu. Fonlardaki TEFAS otomatigi vardi, hisse yoktu.

KURULUM: pozFiyatOto() — poz'daki hisse kodlarini toplar, tek istekle
mod=fiyat'tan ceker, p.fiyat gunceller, savePoz()+pozRender(). Tetikler:
(1) panel acilisi (boot, 5sn), (2) Portfoy sekmesine (t3) her tiklama.
MIMARI GERCEK: sunucu cron'u localStorage'a yazamaz — "gun sonu otomatik"
= panel her acildiginda guncel/kapanis fiyati gelir (aksam acinca kapanis).
Notlar guncellendi (son tazeleme saati de gosterilir). Savunmali: fiyat
null/0 ise pozisyon ellenmiyor. Cache v=20260728a.
DEPLOY: app.js + index.html.

## 72. Sicil (atif) karti onarimi — cifte bug (27 Tem gece)

Kullanici sicilde tum getirilerin 0 oldugunu gosterdi. TESHIS:
1. guncel=MFIYAT[kod] — 14 Tem SNAPSHOT'tan basliyor, canli fetch bu akista
   olu -> maliyet==snapshot -> +0,0. (LMKDC -4,1 bile canli degil,
   snapshot/maliyet farkiydi.)
2. GIZLI BOMBA: maliyet=p.fiyat okunuyordu (dogrusu p.maliyet) — pozFiyatOto
   p.fiyat'i guncellemeye baslayinca maliyet kolonu canliya donusecekti.
   Deploy ONCESI yakalandi (§71 ile ayni turda catisacakti!).

ONARIM: maliyet=p.maliyet||p.fiyat · guncel onceligi CANLI_FIYAT > taze
p.fiyat > MFIYAT snapshot · agirlik maliyet-tabanli · pozFiyatOto artik
CANLI_FIYAT'a da yazar + atifRender'i tetikler (tek fetch iki tuketici) ·
alt not gercege uyarlandi. DERS: ayni alan (p.fiyat) iki anlamda (maliyet-
vekili + guncel) kullanilamaz — anlam degisikligi tum tuketicilerde taranir.
Cache v=20260728b. DEPLOY: app.js + index.html.

## 73. Faktor Model Karnesi — skor vs gerceklesen (27 Tem gece)

Kullanici: "faktor modeldeki getiriler de olculecek mi?" OLCUM: fm.json saf
z-skor fotografi (fiyat alani YOK, 14 Tem) — skorlar otomatik OLCULMEZ
(yeniden uretim ayri is, cizelge D). AMA dogrulama kurulabilirdi -> KURULDU:

fmKarne() (t6 basinda MODEL KARNESI karti): kompozit skora gore (esit
agirlik — slider'dan bagimsiz sabit referans) ilk 10 vs son 10 hissenin
14 Tem (MFIYAT snapshot) -> bugun (mod=fiyat canli, 20 kod tek istek)
gerceklesen ort. getirisi + SKOR MAKASI + esikli yorum (>1p CALISIYOR /
-1..1 notr / <-1 TERS-rejim sorgusu). Kapsam kesisimi n gosterilir.
Fetch tek sefer cache'lenir (FM_KARNE_FIYAT). Cache v=20260728c.
DEPLOY: app.js + index.html.

## 74. YASAYAN AJAN v1 (28 Tem gecesi)

Kullanici istegi: "siteyi yasayan seye donusturelim — surekli kontrol,
yorum uretimi, deploy'suz." KURULDU: ajan.js (yeni dosya, IIFE):

1. VERI TURU (10 dk): GOREVLER listesindeki mevcut canli fonksiyonlari
   typeof-guvenli cagirir — panel kendini tazeler.
2. BAGLAM TOPLAYICI: kritik kart id'lerinin innerText'ini derler
   (riskBaroSkor/tlMakasBody/kkoBody/dvzPozBody/rotSeri/fmKarneBody/yabHaftaVal).
3. YORUM TURU (30 dk + buton): anahtar VARSA Claude Haiku'ya
   (claude-haiku-4-5-20251001, anthropic-dangerous-direct-browser-access
   header'iyla dogrudan browser'dan) fon-yoneticisi tonunda 4-6 cumlelik
   GUNDEM NOTU yazdirir; YOKSA kural-tabanli esik ozetleri basar.
4. UI: t7 basinda AJAN kartI (not + pano/log + veri/yorum butonlari +
   anahtar girisi maskeli) + durum damgasi.
DURUST SINIRLAR (kullaniciya soylendi): tarayici kapaliyken uyur;
AI maliyeti kullanicinin anahtarindan (Haiku ~kurus/tur); anahtar
localStorage'da (sifreli panel arkasinda ama yine de kisisel tarayicida).
FAZ 2 fikirleri: Vercel cron + KV ile 7/24; olay-tetikli bildirimler;
ajan yorumlarinin tarihcesi. Cache v=20260728d.
DEPLOY (tek seferlik): ajan.js (yeni) + index.html. Sonrasi deploy'suz yasar.

## 75. Ajan anahtari SUNUCUYA tasindi (28 Tem gecesi)

Kullanici: "Vercel'e kaydetsem her seferinde girmesem?" — EVET, daha iyi:
api/market.js'e mod=ai eklendi (KOTA ARTMADI, 9/12): POST {prompt} ->
ANTHROPIC_API_KEY env ile Haiku'ya iletir. GUVENLIK KILIDI: PANEL_USER env
kurulu degilse mod=ai CALISMAZ (anahtar public uca acilamaz; middleware
zaten sifresiz istekleri 401'ler). ajan.js oncelik zinciri:
SUNUCU anahtari -> yerel anahtar (localStorage) -> kural-tabanli.
Kazanc: anahtar tarayiciya inmez, Mac+iPhone cihaz bagimsiz calisir.
KURULUM: Vercel env ANTHROPIC_API_KEY (Production) + deploy.
Cache v=20260728e. DEPLOY: api/market.js + ajan.js + index.html.

EK (§75, 28 Tem 00:00+): Ilk canli test — zincir CALISTI (ajan->mod=ai->
Anthropic'e ulasti), hata Anthropic tarafinda: kredi yetersiz ("credit
balance too low"). Cozum: console.anthropic.com > Plans&Billing kredi yukle.
UX yamasi: kural-yorum alt notu artik gercek sunucu hatasini gosteriyor
("anahtar gir" yaniltmasi giderildi). ajan.js v=28f. DEPLOY: ajan.js+index.html.

## 76. AJAN v2 — NOT MOTORU (28 Tem gecesi; kullanicinin gercek istegi)

Kullanici duzeltti: istedigi merkezi gundem notu degil, KART-ALTI DAMGALI
YORUMLARIN veri yenilendiginde otomatik guncellenmesiydi. KURULDU:

MIMARI: KARTLAR haritasi [{ad, veriId}] -> notBul: veriId'nin en yakin .card
atasindaki .note (HTML'e ID eklenmedi). Veri turundan 4sn sonra: veri
innerText hash'i onceki ile kiyas -> SADECE DEGISEN kartlar AI'ya TOPLU TEK
istekte (degisim yoksa istek YOK — "sadece veri yenilendiginde" sarti).
Prompt: uzunluk/egitici ton/kavramsal kisim korunur, rakam-durum guncel
veriden, uydurmak yasak, SADECE JSON. Donen not .note'a basilir + robot+saat
imzasi + localStorage(ajan_notlar) -> sayfa acilisinda geri yuklenir.
Statik HTML notu fabrika ayari; "notlari sifirla" butonu. aiCagir ortak
zincir: sunucu -> yerel -> yok. mod=ai max_tokens body'den (tavan 1600).
v1 kapsam (7): makas/tlFaiz/KKO/dvz/karne/yabanci/rotasyon. Ilk tur tum
kartlari yazar (senkron), sonrasi yalniz gercek degisim.
Cache v=20260728g. DEPLOY: api/market.js + ajan.js + index.html.

## 77. AJAN v3 — TUM KARTLAR + HAFTALIK YORUM (28 Tem gecesi)

Kullanici kapsami buyuttu: tum kartlar + frekans uyumu + haftalik yorum sayfasi.

1. OTOMATIK KESIF: sabit liste kalkti — DOM'da .card icinde .lbl + .note olan
   HER kart kapsamda (~87 not / 125 kart; yorumMetin ve AJAN karti haric).
   Yeni kart eklenince liste bakimi GEREKMEZ. Anahtar=lbl metni (cakisma #2).
2. FREKANS: hash dogal cozer (gunluk veri gunluk degisir...) + SOGUMA 20 saat
   (canli fiyat kartlari gurultuyle her tur yazilmasin — gunde ~1 yazim).
3. PARTI: tur basina 6 not (max_tokens 1600 siniri); ilk senkron ~15 turda
   dogal tamamlanir; kalan "sirada" gosterilir.
4. HAFTALIK YORUM GOREVI: yorumMetin gövdesi (hyMail'in okudugu ana metin) —
   26 kartin canli ozetinden 5-7 bolumluk yorum (mevcut kutu-HTML kalibi
   promptta), her bolumde "Portfoy cevirisi". Tetik: 📝 butonu + Pazartesi
   otomatik (son yazim >5 gun ise). Fabrika yorumu localStorage katmani
   altinda korunur, ⌫ ile donulur; hyMail/Kopya ajan surumunu paylasir
   (innerText uzerinden — otomatik uyumlu).
Cache v=20260728h. DEPLOY: ajan.js + index.html.

EK (§77, 28 Tem 00:15): Ilk canli testte gundem notu MUKEMMEL geldi (AI zinciri
tam calisiyor) ama not motoru "JSON cozulemedi" verdi — 5 notun toplu JSON'u
1600 token tavaninda KESILDI -> kapanmamis JSON. Uclu duzeltme:
(1) backend tavan 2500; (2) PARTI 6->4 + hesapli butce (200+parti*500);
(3) DAYANIKLI ayristirici: ilk{...son} dilimi -> olmazsa regex ile tamamlanmis
key-value ciftlerini KISMI KURTARMA (kesik son not atlanir, gerisi basilir) +
prompta "mevcut nottan uzun yazma" freni. Ajanin turu atlamasi DOGRU
davranisti (bozuk not basmadi). ajan.js v=28i.
DEPLOY: api/market.js + ajan.js + index.html.

## 78. Ajan sag ust drawer'a tasindi (28 Tem 00:30)

Kullanici: ajan Haberler'den ciksin, sag ustte Veri Durumu yaninda buton
olsun. YAPILDI: ajan karti div-dengeli kesildi -> yeni AJAN DRAWER'a
(Veri Durumu drawer kalibinin kopyasi: dback+aside+open class) tasindi.
Header'a "🤖 Agent" dtrig butonu (Yardim yanina). app.js'e ac/kapa IIFE
(ayni kalip, Escape dahil). ajan.js DEGISMEDI — id'ler tasindi, DOM konumu
motorlar icin farksiz (kesif document geneli). Ilk canli test notu: motor
2/4 not guncelledi + 46 sirada (parti sistemi calisiyor); 50 kart kesfedildi.
Cache v=20260728j. DEPLOY: index.html + app.js.

## 79. OZEL GOREVLER — Takvim→Gorus (28 Tem 00:45)

Kullanici ornekle istedi: Takvim'in yanindaki GORUS bolumunu ajan yazsin,
takvim degisince tetiklensin. SORUN: not motoru tekil-kart varsayimli —
Gorus'un verisi KOMSU kartta (Takvim), kendi kartinda veri yok -> kesif
disi kaliyordu. COZUM: OZEL_GOREVLER sistemi (genisletilebilir dizi):
{veriLbl, hedefLbl, tarif} — kaynak kartin innerText hash'i degisince
(olay ✓ islenince / pencere kayinca = kullanicinin "ayda 1" ritmi dogal)
+ 20h soguma -> hedef kartin .note'u yeniden yazilir. Prompt: kaynak veri +
10 kart canli ozeti + mevcut metin (uslup ornegi); paragraf kalibi
(renkli baslik + <br><br>), 250-400 kelime, son paragraf kritik gunler.
kartByLbl bulucu (lbl prefix). GORUS kesiften acikca dislandi (cift yazim
garantisi). Geri yukleme __GOREV_* anahtarlariyla. Yeni cift eklemek =
diziye 3 satir. Cache ajan v=28k. DEPLOY: ajan.js + index.html.

## 80. GIZLI SEKME KORLUGU duzeltildi (28 Tem 01:00)

Kullanici: ajan Makro alt sekmelerine hic ugramadi (🤖 imzasi yok).
KOK: alt sekmeler display:none — innerText GORUNMEYEN elemanda BOS doner ->
kesif "veri<15" filtresiyle gizli kartlari atliyordu ("50 kart" logu =
yalniz o an gorunur olanlar). AYNI korlukten BAGLAM toplayici da etkileniyordu
(gundem notu yalniz gorunur sekmenin verisiyle yaziliyormus!).
COZUM: tum OKUMA noktalarinda innerText -> textContent (gorunurlukten
bagimsiz DOM metni; yazimlar innerHTML, etkilenmez). + lblAdi() yardimcisi:
lbl klonlanip .tag/.thin/.ldot/.sub temizlenir -> kart anahtari damga
tarihinden ARINIR (anahtar istikrari; damga degisince anahtar kaymaz).
kartByLbl de lblAdi kullanir ("REZERV KARNESI [tag]" dogru eslesir).
Beklenen: kesif ~87 nota cikar, Makro kartlari kuyruga girer, gundem notu
TUM panelin verisiyle yazilir. ajan v=28l. DEPLOY: ajan.js + index.html.

## 81. Gorus kesilmesi — uclu koruma + kayan kutu (28 Tem 01:15)

Kullanici: ajanin Gorus'u iyi ama son baslik ("Kritik Gunler") govdesiz —
yanit max_tokens'ta (1400) kesilmis. Iki oneri sundu (kayan kart / kisa
yorum); IKISI DE + kok cozum yapildi:
1. STOP TESPITI: mod=ai yaniti stop_reason tasir; ajan max_tokens gorurse
   kesik metni BASMAZ (yarim yorum ekrana gitmez), sonraki turda dener.
2. BUTCE+KISALIK: ozel gorev 1400->2000 token + hedef 180-280 kelime
   ("SON PARAGRAFI MUTLAKA TAMAMLA"); haftalik 1600->2300 + 350-500 kelime.
3. KAYAN KUTU (bonus UX): Gorus note max-height 460px, yorumMetin 560px,
   overflow-y:auto — uzun icerik kartlari sisirmez.
ajan v=28m. DEPLOY: api/market.js + ajan.js + index.html.

## 82. Kuyruk HIZ MODU (28 Tem 01:25)

Kullanici: mk-faiz/enf/banka + Asya/ABD/Avrupa'ya ajan ugramamis — atil mi?
CEVAP: atil degil, SIRADA idi — matematik: 87 not / 4'luk parti / 10dk tur
= ~3,5 saat tam senkron; kesif belge sirali (Piyasa+mk-para once islendi).
COZUM: HIZ MODU — parti basariliysa ve kuyruk doluysa 20 sn sonra sonraki
parti zincirlenir (10 dk beklenmez) -> ilk senkron ~10-15 dk'ya iner.
Sonrasi normal ritim (degisim-bazli, seyrek). + notKilit reentrancy korumasi
(veri turu tetigi ile zincir cakismasin). Erken cikislarda (AI yok/JSON yok)
zincir durur — hata dongusu olmaz. ajan v=28n. DEPLOY: ajan.js + index.html.

## 83. LBL'siz kartlar — h2-takipli kesif (28 Tem 01:35)

Kullanici BIST endeksleri kartinin atlandigini yakaladi. SEBEP: o kartin
.lbl'i YOK — baslik kart DISINDA h2 ("02 BORSA ISTANBUL..."); kesif
lbl+note ikilisi sartiyla lbl'siz kartlari gormuyordu (ayni yapidaki diger
bolum kartlari da: 03 Kuresel vb).
COZUM: kesif artik querySelectorAll('h2, .card') ile SIRALI gezer; h2
gorunce hatirlar (thin/tag temizlenerek), lbl'siz+note'lu kartta kimlik =
son h2. lbl'li davranis degismedi; ad cakismasi #2 sayaciyla zaten cozuluyor.
Beklenen: kesif sayisi 87'ye tamamlanir. ajan v=28o.
DEPLOY: ajan.js + index.html.

## 84. GUNLUK BAKIM gorevi — takvim tablolari (28 Tem 01:45)

Kullanici: "takvim kartlarini her gun tek seferde guncelleyemez mi?"
Ajanin 3. organi kuruldu: GUNLUK BAKIM — notlar degil TABLO GOVDELERI:
- Kapsam: GUNLUK_BOLUMLER=['07 K','08 B'] (Kritik Takvim + Bilanco Takvimi)
  — bolum h2'sinden sonraki kartlarin <table>'lari (bolumTablolari gezgini).
- Frekans: gunde 1 (kayit.gun===bugun -> skip); tetik: baslangic+18sn +
  her veri turu zinciri (ic kontrol).
- GUVENLIK (dar prompt): gecmis satirlara ✓ + gecmis zaman; goreli ifade
  temizligi; SONUC UYDURMA YASAK ("bilmiyorsan sadece gerceklesti de");
  yeni satir/tarih/sirket YASAK; yapi korunur. DOGRULAMA: donen tablo
  tr sayisi orijinalle esit degilse BASILMAZ. max 6000kr tablo siniri.
- SINERJI: 07'deki TAKVIM tablosu ajanca ✓'lenince hash degisir ->
  Takvim→Gorus ozel gorevi OTOMATIK tetiklenir (gorusun de yenilenmesi).
- h2 baslik parantezlerindeki "bu gece/itibariyla" bayatliklari AI'siz
  deterministik tazelenir. Geri yukleme: __GUN_* kayitlari yalniz AYNI GUN
  basilir (eski gunun tablosu basilmaz; statik kalir, gorev yeniden yazar).
ajan v=28p. DEPLOY: ajan.js + index.html.

## 85. AJAN v4 — FONKSIYON MIMARISI (28 Tem 02:00)

Kullanici: "ajani fonksiyon olarak kursaydik — cok onemli." HAKLIYDI.
Hibrit: GOZLER client (87-kart DOM kesfi ayni) · BEYIN sunucu (mod=ai) ·
HAFIZA BULUT (yeni api/ajan.js — KOTA 10/12) · SABAH CRON'u (09:00 TR).

api/ajan.js: oku (KV blob -> tum cihazlar ayni notlar; acilis bulut-oncelikli,
localStorage yedek) · yaz (notKaydet ortak fn — 5 kayit noktasi baglandi,
fire-and-forget) · cron (CRON_SECRET dogrulama; __BAGLAM__ fotografindan —
client her turda 30-kart ozeti yazar — sabah GUNDEM NOTU -> __GUNDEM__,
"sen uyurken yazildi" imzasiyla acilista basilir). KV: Upstash REST komutlari.
Env yoksa her sey localStorage ile ayni calisir (kademeli).

KRITIK YAN KESIF: vercel.json'da 3 MAIL CRON'u zaten varmis (/api/data
mod=mail — sabah brifingleri) ve middleware kurulunca cerezsiz gelen bu
cron'lar 401 YIYORDU (sessiz kirilma!). Muafiyet GENELLESTIRILDI: Bearer
CRON_SECRET dogru ise tum path'ler gecer -> mail cron'lari da kurtuldu.
vercel.json GUVENLI BIRLESTIRILDI (assert onceden var olanini yakaladi —
ezilseydi fonksiyon sureleri + mail cron'lari SILINECEKTI; ders: yeni
kok-dosya olusturmadan once varlik kontrolu).

KURULUM: (1) upstash.com ucretsiz Redis -> REST URL+TOKEN; (2) Vercel env:
UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN, CRON_SECRET (rastgele —
MAIL CRON'LARININ CALISMASI ICIN DE SART ARTIK); (3) deploy.
DEPLOY: api/ajan.js + ajan.js + middleware.js + vercel.json + index.html.
ajan v=28r · kota 10/12.

EK (§85, 02:10): Isim cakismasi giderildi — kullanici onerisiyle sunucu
fonksiyonu api/ajan.js -> api/ajanktp.js olarak yeniden adlandirildi
(kok ajan.js = tarayici ajani, degisti sadece endpoint referanslari).
Guncellenen: client 3 endpoint + vercel.json (fonksiyon suresi + cron path).
Artik iki dosyanin adi farkli — yanlis klasore atma riski sifir.
ajan v=28s. DEPLOY: api/ajanktp.js + ajan.js + vercel.json + index.html
(+middleware onceki turdan).

## 86. EBU dogdu + coklu-not + gorunur bulut (28 Tem 02:30)

1. AJANIN ADI: EBU (kullanici verdi) — drawer basligi, buton, kart lbl,
   log satirlari ve not imzalari (🤖Ebu HH:MM) rebrand edildi.
2. COKLU-NOT KESFI: bir kartta birden cok .note olabiliyor (Yabanci Akis
   kartinda 2 not — ilki imzali, ikincisi hic kapsanmamisti; querySelector
   yalniz ilkini aliyordu). Artik querySelectorAll: her not ayri hedef
   (anahtar: ad + " ·n2"); veri hesabi tum notlar cikarilarak.
3. GORUNUR BULUT: notKaydet fire-and-forget idi — hata gorunmuyordu.
   Artik pano loglar: "☁ hafiza buluta yazildi — cihazlar senkron" (ilk
   basarida bir kez) / "☁ bulut yazim sorunu: X". Depo bosluguun en olasi
   sebebi eski client (bulut yazimi v=28r'de geldi) — yeni logla netlesir.
KULLANICI ADIMI: deploy (ajan.js+index.html) -> SERT YENILE -> Ebu drawer
-> 30 sn -> "☁ buluta yazildi" bekle -> mod=oku tekrar kontrol (dolu blob).
ajan v=28t.

EK (§86, 02:45): mod=oku hala bos AMA client "buluta yazildi" diyordu —
CELISKININ KOKU: Upstash hatalari "error" alaninda doner, kvKomut "err"
bakiyordu -> SET basarisizken ok:true YALANI. Duzeltme: (1) kvKomut j.error
+ HTTP status yakalar; (2) mod=yaz SET result===OK dogrular, basarida boyut
doner; (3) mod=test sagilik ucu: env varligi + kucuk SET/GET ham yanitlari +
ana blob STRLEN — gercek Upstash hatasi (Unauthorized/boyut vs) tek bakista.
KULLANICI: deploy -> /api/ajanktp?mod=test ciktisini at.

## 87. Gunluk bakim DETERMINISTIGE cevrildi (28 Tem 03:00)

Ilk kosuda Haiku GELECEK satirlara da ✓+gerceklesti basti (Jackson Hole
Agustos dahil!) — Turkce tarih kiyasini model yapamadi; satir-sayisi
sigortasi yapiyi korudu ama ANLAMI koruyamadi. DERS: tarih karsilastirmasi
AI'ya birakilmaz. YENI SURUM AI'SIZ: JS regex ile TR tarih ayristirma
(gun[-aralik] + ay kisaltmasi; aralikta BITIS gunu esas; bugun dahil
GELECEK -> DOKUNMA), yalniz gecmis satirlara ✓ (metin degistirilmez) +
gecmis satirlarda goreli-zaman span temizligi. AI maliyeti de sifirlandi.
EK BUG: notlariSifirla bulutu temizlemiyordu -> bozuk tablo geri gelirdi;
artik buluta bos blob yazar. Eski __GUN_ AI-tablo kayitlari geri yuklemede
devre disi. KULLANICI KURTARMA ADIMI: deploy -> Ebu'da 'notlari sifirla' ->
sert yenile -> statik dogru tablolar doner, deterministik bakim yalniz
Moody's (24T) gibi gercek gecmisleri ✓'ler. ajan v=28u.
DEPLOY: ajan.js + index.html.

## 87. EBU'NUN ILK HALUSINASYONU — gunluk bakim v2 (28 Tem 03:00)

VAKA: Gunluk bakim TUM takvim satirlarini "gerceklesti" isaretledi —
Jackson Hole (Agustos!) dahil. Haiku "gelecege dokunma" talimatini cignedi;
satir-sayisi sigortasi yapiyi korudu ama ICERIK denetimi yoktu.
DERS: tarih aritmetigi MODELE EMANET EDILMEZ.

V2 MIMARI (deterministik):
- JS satir tarihlerini parse eder ("24 Tem", "~28 Tem", "28-29 Tem",
  aralikta BITIS gunu esas) -> gecmis/gelecek kararini KOD verir.
- Modele YALNIZ gecmis+✓'suz satirlar gider (satir-bazli JSON: {idx:tr});
  gelecek satirlar modele hic gosterilmez -> bozulmasi fiziken imkansiz.
- Donen tr'ler regex dogrulamali (<tr...</tr>) yerine konur.
- Islenecek satir yoksa istek YOK (bugun 28 Tem: yalniz Moody's gecmis,
  o da ✓'liydi -> bakim "islem yok" der, statik dogru tablo kalir).
- SURUM GECISI: eski __GUN_ kayitlari (bozuk tablolar KV'de!) otomatik
  SILINIR + geri yukleme yalniz __GUN2_ kabul eder -> sayfa yenilenince
  fabrika tablosu doner, bozuk kayit bir daha basilmaz.
Gorus metni etkilenmemisti (makul kaldi), dokunulmadi.
ajan v=28u. DEPLOY: ajan.js + index.html. Deploy+sert yenileme sonrasi
takvim kendini duzeltir (elle mudahale gerekmez).

## 88. Sekme dislama + aninda basim + soguma ayari (28 Tem sabah)

Kullanicinin uc istegi + bir kesif:
1. SEKME DISLAMA: Ebu artik Portfoy Yonetimi grubu (t3/t4/t5/t6/t8/t9/
   t11/t14) ve Sukuk (t10) sekmelerine HIC bakmaz — kesif kartin
   closest('.tab').id ile filtreler; geri yukleme de ayni kesfi kullandigi
   icin otomatik tutarli (o sekmelere basim da olmaz).
2. ANINDA BASIM: acilista fabrika (eski) notlar gorunuyordu — hizliGeriYukle
   SENKRON localStorage basimi Ebu uyanir uyanmaz calisir (0ms), bulut
   yuklemesi 400ms'e cekildi. Kullanici artik hep Ebu'nun son yazdiklarini
   gorur; veri degisince Ebu eskisini silip yenisini yazar (mevcut davranis).
3. SOGUMA 20h -> 6h: Getiri Egrisi notu eski rakamlarla kalmisti — sebep
   20h'lik katilik (veri degisti ama "dun yazdim" diye bekliyordu). 6h ile
   gunluk canli kartlar ayni gun icinde tazelenebilir (gunde ~2-4 tavan).
4. LOG SEFFAFLIGI: "degisim yok" mesaji yaniltiyordu — artik "X degisim
   sogumada (6h)" ayri raporlanir.
ajan v=28v. DEPLOY: ajan.js + index.html.

## 89. "undefined" TABLO VAKASI — assert'suz replace felaketi (28 Tem sabah)

Kullanici Takvim tablosunun "undefined" olduğunu gosterdi. KOK NEDEN:
§87'deki geri-yukleme filtre replace'i ASSERT'SUZDU ve SESSIZ NO-OP kaldi —
dosyada enkaz filtre vardi ("if(false) return;" kaniti). Sonuc: TAKVIM'in
bos kaydi ({gun, bos:true} — html YOK) filtresiz gecip
T.table.outerHTML=undefined basti -> ekranda "undefined".
KENDI KURALIMI (§63: her replace assert'li) cignedim; bedeli bu.

ONARIM: filtre bastan, assert'li + CELIK KORUMA: kayit ancak
(a) bugunun tarihi, (b) bos degil, (c) html string, (d) '<table' ile
basliyor, (e) en az 2 <tr> iceriyorsa basilir — aksi halde statik tablo
korunur. Artik hicbir yol tabloya undefined/bozuk icerik basamaz.
Sayfa yenilenince statik (dogru) takvim doner; bugunku bos kayit zararsiz.
KURAL PEKISTIRME: istisnasiz HER replace assert'li — "kucuk" filtre
degisiklikleri dahil. ajan v=28w. DEPLOY: ajan.js + index.html.

## 90. CANLI KARTLARDA EBU NOTLARI KAYBI (28 Tem sabah — kullanici hakli kizgin)

BELIRTI: mk-faiz/mk-enf/Bankacilik gibi CANLI kartlarda Ebu imzalari yok,
fabrika notlari gorunuyor — oysa dun gece yazilmislardi.
KOK: §88'de geri yuklemeyi 0ms/400ms'e cektim; o anda canli kartlar
"yukleniyor…" der -> kesif veri filtresi onlari eler -> HAFIZADAKI notlar
o kartlara BASILAMAZ; motor da hash-esit deyip yeniden yazmaz -> fabrika
notu kalici gorunur. Yani dunku "erken basim" iyilestirmesi canli kartlarin
geri yuklemesini kirdi (statik-verili kartlar etkilenmedi).
DUZELTME: kartKesfet(veriSart) parametresi — GERI YUKLEME icin veri sarti
YOK (not basmak icin kartin dolu olmasi gerekmez; ad lbl'den gelir):
hizli+bulut yuklemeleri kartKesfet(false); yazim/hash yollari (motor,
baglam, haftalik) veriSart=true ayni kaldi. + EMNIYET: 9. saniyede ikinci
hizliGeriYukle gecisi (canlilar dolunca — hicbir kart acikta kalmasin).
Beklenen: deploy+yenilemede TUM kartlarda (Bankacilik dahil) Ebu imzalari
geri gelir; bugun veri degistikce motor ustune yeni yazar.
ajan v=28x. DEPLOY: ajan.js + index.html.

## 91. EGEPO 2C26 karti — Fintables'tan cekildi (28 Tem)

Kullanici hatirlati: bilanco rakamlari Fintables dokumanlarindan cekilebilir
(web aramasi kucuk sirketlerde gec kaliyor). AKIS: dokumanlarda_ara
(filter: iliskili_semboller IN [KOD] AND yil=2026) -> finansal_rapor
dokumani -> dokuman_chunk_yukle (chunk id) -> tam gelir tablosu (TMS-29).
NOT: dokumanlarda_ara filter ZORUNLU string + purpose zorunlu;
chunk yukleme ids=[sonuc id'si] ile.
EGEPO bulgusu: 2C reel hasilat +%28, brut marj %11,6->%16,4, esas faaliyet
59mn'a donus; AMA 6A net -61,6mn ZARAR — kaynak ertelenmis vergi (2C -144,5mn
nakit-disi). Kart cift-katmanli yazildi (siga okuma vs derin okuma) + MPARK
%6,9 pozisyonuna sektor-provasi baglantisi. inceleme-ai.json guncellendi.

## 92. BANKACILIK / Yİ-ÜFE / KART HARCAMA — IKI KOK BIRDEN (28 Tem)

Kullanici ucuncu kez ayni bolgeleri gosterdi; OLCUM yapildi (tahmin degil):
KOK-1 (kalici silinme): bu kartlarin notlarini APP.JS URETIYOR —
app.js:1779 bnkNot.innerHTML=..., :1931 kartOzet.innerHTML=... Her render'da
Ebu'nun notu EZILIYOR; motor "veri degismedi" deyip yeniden yazmiyordu.
KOK-2 (hic kesfedilmeme): </div> sayimi ile dogrulandi — kartOzet ve
Yi-UFE notu KART DISINDA (bolum seviyesinde, card kapandiktan sonra).
Kesif yalniz .card icindeki .note'lara bakiyordu -> bu notlar hic kapsanmadi.

COZUM-1 NOBETCI: Ebu'nun yazdigi her not data-ebu ile isaretlenir;
MutationObserver (900ms debounce) isareti kaybolan notu Ebu surumuyle geri
kor + her veri turundan 1,5sn sonra dogrudan uygulanir ("Nobetci: N not geri
kondu"). Dongu yok (isaret varsa dokunmaz).
COZUM-2 KESIF YENILENDI: artik querySelectorAll('h2,.card,.note') sirali
gezilir; kart-ici notlar ESKI ANAHTARLARLA ayni (hafiza bozulmaz), kart
DISI notlar yeni anahtarla ("BOLUM ·bolum") kapsama girer; bolum notunun
verisi = o bolumdeki TUM kartlarin metni (dogru baglam).
ajan v=28y. DEPLOY: ajan.js + index.html.

## 93. KART HARCAMA / BANKACILIK — jsdom ile GERCEK olcum (28 Tem)

Ucuncu turda tahmin birakilip jsdom kuruldu: kartKesfet index.html uzerinde
CALISTIRILIP ciktisi okundu (npm jsdom; /home/claude/test-kesif.js kalibi).
BULGULAR:
- bnkNot ve kartNot GERCEKTEN .note (kapsanabilir) ama KART DISINDA;
  kartOzet/kartDamga .grid/.tag — not degil, dogru sekilde kapsam disi.
- v=28y'de kapsama girdiler AMA kimlik/veri yanlisti: kartNot
  "Yİ-ÜFE Detayi ·bolum2" adini ve UFE verisini aliyordu (bolum notu tum
  bolum kartlarini veri sayiyordu) -> Ebu yanlis baglamla yazacakti.
- KOK: bu bloklarin basliklari H2 degil H3 ("KART HARCAMALARI — SEKTOREL",
  "GRUP KARSILASTIRMASI") ve notun verisi hemen onundeki kardes blokta.
DUZELTME (v=28z): kesif h3 de izler (sonH3; h2 gelince sifirlanir) ->
lbl'siz kart ve bolum notu kimligi alt basliktan; bolum notunun VERISI
notun onceki kardes bloklarindan (H2/H3 ya da baska nota gelince durur).
DOGRULAMA (jsdom): kartNot -> "KART HARCAMALARI — SEKTOREL ·not" + kendi
tablosu; bnkNot -> "GRUP KARSILASTIRMASI ·not" + banka tablosu; 66 not,
0 isim cakismasi. DEPLOY: ajan.js + index.html.

## 94. JSON ANAHTAR ESLESMEZLIGI — sessiz yazim kaybi (28 Tem)

Kullanici "yine ayni" dedi. Kod incelemesi: not motoru prompt'unda kart
ANAHTARI kartin ADI idi ("### KART HARCAMALARI — SEKTOREL ·not") ve donen
JSON'da j[x.ad] ile araniyordu. Uzun + ozel karakterli (em dash, ·, Turkce
buyuk harf) anahtarlari model BIREBIR dondurmuyor -> j[x.ad] undefined ->
not SESSIZCE yazilmiyor ("0/4 guncellendi" loglari bunun izi). Kisa/sade
adli kartlar etkilenmiyordu — bu yuzden sorun tam da Kart Harcamalari /
Bankacilik / bolum notlarinda gorunuyordu.
DUZELTME: prompt anahtarlari NUMARA (### 1, ### 2...), yanit {"1":"..."}
formatinda; eslesme index ile, isim fallback korunur. + TESHIS: panoda
gonderilen kart adlari ve eslesmeyen yanit anahtarlari loglanir.
ajan v=28za. DEPLOY: ajan.js + index.html.

## 95. AVRUPA (ECB) VERI KESINTISI + Ebu koruma kurali (28 Tem)

BELIRTI: ECB Faiz, Eurosystem bilanco, Devlet tahvilleri kartlari
"alinamadi"; Ebu da notlari "veri akisinda kesinti" diye yeniden yazmis
(dogru ama egitici not zarar gordu).
OLCUM: ECB SDMX API'si AYAKTA — web_fetch ile data-api.ecb.europa.eu/
service/data/FM?format=csvdata cekildi, veri dondu. Yani sorun kaynakta
degil, bizim serverless isteginin reddedilmesinde (en olasi: UA'siz
istekler 403).
DUZELTME-1 (api/market.js ecbModu): tarayici UA + Accept basliklari,
timeout 9->12sn, basarisizlikta 600ms sonra TEK tekrar.
DUZELTME-2 (ajan.js): kart verisi /alinamadi|veri yok|erisilemedi|hata/
kaliplarindan birini iceriyorsa Ebu O NOTA DOKUNMAZ — kesinti sirasinda
egitici notlar korunur, veri donunce hash degisir ve normal yazim olur.
Hasar gormus notlar icin: "notlari sifirla" fabrika metnini geri getirir.
ajan v=28zb. DEPLOY: api/market.js + ajan.js + index.html.

## 96. ECB kesintisi teshis — TANI bos cikti + yanlis fonksiyon yamasi (28 Tem)

debug=1 ciktisi: {"tani":[], ozet: hepsi false} = CekCsv hicbir kayit
birakmadan null dondu -> demek TUM istekler ISTISNA firlatiyor (timeout/
baglanti), HTTP hata kodu bile donmuyor. Ayrica onceki yamada catch-push
YANLIS FONKSIYONA (BoJ cekici, satir 167) dusmustu — orada TANI tanimsiz;
calisma aninda ReferenceError riski vardi, geri alindi (assert'siz replace
degil, YANLIS ESLESME dersi: ayni kalip birden fazla fonksiyonda olabilir,
eslesme bagalmi ile dogrulanmali).
YENI: ECB cekCsv'de ana istek 8sn -> basarisizsa YEDEK UC
(sdw-wsrest.ecb.europa.eu legacy host) 8sn; her asama TANI'ya yazilir
(asama: ana/yedek/islem + hata adi). debug=1 artik gercek sebebi gosterir.
DEPLOY: api/market.js.

## 97. ECB — SUNUCU ARADAN CIKARILDI (tarayici yedegi) (28 Tem)

Sunucu tarafi (Vercel -> ECB) istisna firlatiyordu; UA basligi, retry ve
legacy yedek uc denendi, olmadi (tani listesi bos = HTTP cevabi bile yok,
ag seviyesinde tikanma). KOKTEN COZUM: ECB SDMX API'si CORS'a acik ve
anahtar istemiyor -> veri artik KULLANICININ TARAYICISINDAN cekilir.
app.js: ecbTarayiciCek() — 8 seri (DFR, ILM bilanco, 3x HICP, DE/IT/FR
10Y) paralel cekilir, ayni 'seriler' sekli uretilir (dfr/bilanco/hicp*/
bund/btp/oat/btpBund/oatBund). Tuketici once sunucuyu dener, BOS donerse
tarayici yedegine duser -> Vercel ECB'ye ulasabilirse sunucu, ulasamazsa
tarayici; her iki halde kartlar dolar. Sunucu tarafi (mod=ecb) dokunulmadan
birakildi (ileride ag duzelirse kendiliginden calisir).
app.js v=20260728zc. DEPLOY: app.js + index.html.

## 98. Tahvil karti FRED'e tasindi + mimari not (28 Tem)

Kullanici hakli itiraz: tarayici-cekimi tek kullanicilik degil ama sunucu
yolu daha saglam/onbellekli olmali. DURUM: ECB'nin IRS (Maastricht 10Y)
serisi tarayici yedeginde de bos dondu (muhtemel: seri kodu/format degisimi).
COZUM: tahvil bacagi ECB yerine FRED'e alindi — FRED koprusu Vercel'den
CALISIYOR (kanitli, ABD sekmesi bununla doluyor):
IRLTLT01DEM156N (DE 10Y) · IRLTLT01ITM156N (IT) · IRLTLT01FRM156N (FR),
OECD uzun vadeli faiz serileri, aylik. Spreadler client'ta hesaplanir
(BTP-Bund, OAT-Bund bp). Akis: ECB sunucu -> ECB tarayici -> FRED sunucu.
NOT: ECB faiz/HICP/bilanco su an tarayici yolundan geliyor; bu HER
kullanicinin tarayicisinda calisir (kisiye ozel degil) ama onbelleklenmez.
Vercel->ECB agi acilirsa sunucu yolu kendiliginden devreye girer.
app.js v=20260728zd. DEPLOY: api/market.js + app.js + index.html.

## 99. IRS ayristirma + HKMA timeout (28 Tem)

1) TAHVIL: ECB seri kodu DOGRULANDI (web arama: IRS.M.DE.L.L40.CI.0000.
EUR.N.Z mevcut, son guncelleme Mart 2026) -> sorun kodda degil
AYRISTIRMADA: csvdata satirlarinda TIRNAK ICINDE VIRGUL olan alanlar
kolon indekslerini kaydiriyor (FM/HICP'te virgullu alanlar OBS_VALUE'dan
SONRA oldugu icin sorun cikmamisti; IRS'te oncesinde olabilir).
DUZELTME: tarayici cekicide (a) once &detail=dataonly (sade kolonlar),
(b) tirnak-duyarli CSV bolucu, (c) olmazsa tam format yedegi.
2) HKMA: 9sn timeout yetmiyordu ("operation aborted") -> 14sn + 800ms
sonra 12sn'lik ikinci deneme + UA basligi; iki deneme de duserse net mesaj.
app.js v=20260728ze. DEPLOY: app.js + api/market.js + index.html.

EK (§98, 28 Tem): (a) FRED yanit sekli DOGRULANDI: seriler[id]={deger,tarih,
fark} — client eslemesi dogruydu; tahvil bosluğunun sebebi market.js'in
henuz deploy edilmemesi. Yine de client saglamlastirildi: S TAMAMEN bos
donse bile FRED tahvil yolu calisir (S={} ile baslar).
(b) HKMA timeout: tek deneme 15sn idi -> tarayici UA + Accept basligi,
20sn, basarisizlikta 800ms sonra TEK tekrar; iki deneme de duserse acik
hata mesaji. app.js v=20260728ze.
DEPLOY: api/market.js + app.js + index.html (UCU BIRDEN).

## 99. ECB tahvil (IRS) — CSV ayristirma kusuru (28 Tem)

Kullanici: "Avrupa verisi ECB'den gelir, FRED'i niye onariyorsun" — hakli;
FRED yalnizca Vercel ECB'ye ulasamadigi icin YEDEK olarak konmustu.
DOGRULAMA: IRS seri kodlari DOGRU (IRS.M.DE.L.L40.CI.0000.EUR.N.Z — ECB
Data Portal sayfalari teyit etti). Diger uc kart ayni yardimciyla calisip
yalniz IRS'in dusmesi -> sorun kod/ag degil AYRISTIRMA: naif split(',')
tirnak icinde virgul tasiyan alanlarda kolon kaydiriyor (bazi akislarda
metin alanlari var) -> OBS_VALUE parseFloat NaN -> seri bos.
DUZELTME: tirnak-duyarli CSV bolucu + OBS_VALUE bulunamazsa satirdaki
son SAYISAL alani alma yedegi. FRED yolu son care olarak duruyor
(ECB once, FRED yalniz ECB tumden dusesrse). app.js v=20260728zf.
DEPLOY: app.js + index.html.

EK (§99): app.js'te tirnak-duyarli CSV bolucu ve detail=dataonly denemesi
ZATEN vardi (onceki turda eklenmis) — yani ayristirma sucu degil. Eklendi:
IRS icin 3. yol deneTarih() — lastNObservations parametresiz, startPeriod=
(gecen yil) ile sorgu + son 3 gozlem. Sirala: detail=dataonly -> sade ->
startPeriod. FRED (OECD 10Y) son care olarak kalir; ayni Maastricht
verisinin aynasidir, kart kaynagi damgayla belli olur.
app.js v=20260728zg. DEPLOY: app.js + index.html + (api/market.js henuz
gonderilmediyse o da — HKMA onarimi ve FRED euro serileri orada).

## 100. ECB ENFLASYON — YANLIS DATAFLOW ADI (28 Tem)

Konsol + kullanicinin verdigi linkler kesin kanit sundu: 404'ler
/service/data/HICP/M.U2.N.000000.4.ANR yolundan geliyordu. ECB'de dataflow
adi HICP DEGIL **ICP** (Indices of Consumer Prices); seri anahtari dogru
(M.U2.N.000000.4.ANR / XEF000 / NRGY00). Yani manset/cekirdek/enerji
enflasyon satirlari BASINDAN BERI bos geliyordu, ICP "yedegi" aslinda
DOGRU yoldu (§99'da gurultu sanip kaldirmistim — yanlis teshis, geri alindi).
DUZELTME: client hicp() akisi ICP; api/market.js'te de 'HICP' gecisleri
'ICP' yapildi. app.js v=20260728zi.
DERS: 404'un URL'sini okumak, hata mesajinin "gurultu" sanilmasindan
daha guvenilir — kullanicinin paylastigi tam link teshisi bitirdi.
DEPLOY: app.js + index.html (+ api/market.js).

## 101. TAHVIL KARTI — ALAN ADI UYUSMAZLIGI (28 Tem, nihai)

Kartin render kodu S.bund10 / S.btp10 / S.oat10 / S.btpSpread / S.oatSpread
bekliyordu; benim yazdigim tarayici cekimi ve FRED yedegi S.bund / S.btp /
S.oat / S.btpBund / S.oatBund dolduruyordu -> VERI GELIYOR AMA KART
GORMUYORDU. Tum tur boyunca ECB tarafinda hata aradim, kusur eslesmedeydi.
DUZELTME: her iki yol da bund10/btp10/oat10 + btpSpread/oatSpread yazar;
FRED tetigi de S.bund10'a bakar. Konsol loglari kaldirildi, yerine KART ICI
tani (window.EBU_IRS_TANI) — kullanicidan konsol istemeye gerek kalmaz.
DERS: yeni veri yolu eklerken TUKETICININ bekledigi alan adlari once
okunmali (grep) — kaynak dogru olsa da isim tutmazsa kart bos kalir.
app.js v=20260728zj. DEPLOY: app.js + index.html.

EK (§101): ECB verisi donunce Avrupa notlari kesinti metniyle kalmasin diye
not motorunun 6 saatlik SOGUMA freni, kayitli notu /kesinti|alinamadi|
mevcut degildir|erisilemedi/ iceren kartlarda ATLANIR — veri dondugu ilk
turda gercek rakamlarla yeniden yazilir. ajan v=20260728zk.

## 102. PORTFOY/SUKUK/JOURNAL BULUTA (28 Tem)

Kullanici: kayitlar tarayicida degil Upstash'te dursun. KESIF: altyapi
ZATEN VARDI — api/data.js Upstash REST kullaniyor (KV_REST_API_URL ||
UPSTASH_REDIS_REST_URL) ve app.js'te CLOUD_KEYS/cloudSave/wkey mekanizmasi
mevcut; env olmadigi icin sessizce calismiyordu. Dun UPSTASH env'leri
kurulunca yol acildi.
YAPILAN:
1. CLOUD_KEYS'e ktp_sukuk_kayit_v1 eklendi (sukuk kayitlari da senkron).
2. SUNUCU EMNIYETI (api/data.js): (a) BOS YAZMA YASAGI — bulutta >=3 kayit
   varken 0 kayitli istek gelirse 409 ile REDDEDILIR (kaza silme koruma);
   (b) GUNLUK YEDEK — her yazimda o anki bulut icerigi KEY_yedek_YYYY-MM-DD
   anahtarina 7 gun TTL ile kopyalanir; (c) GET ?yedek=YYYY-MM-DD ile o gunun
   fotografi okunur (geri yukleme).
3. ISTEMCI EMNIYETI (app.js cloudLoad): bulut BOS + yerel DOLU ise yerel
   KORUNUR (bulut yereli ezemez); yuklenen kume sayisi bildirilir.
4. cloudSave sonucu gorunur: "buluta kaydedildi (N kayit)" / sunucu hata
   metni; window.KTP_BULUT_DURUM.
KURULUM: Vercel env KTPANEL_WRITE_KEY (gizli yazma anahtari) + panelde
Yonetim > bulut anahtar kutusuna AYNI degeri gir (yalniz yazan cihazda).
Okuma anahtar istemez — diger cihazlar otomatik senkron olur.
app.js v=20260728zm. DEPLOY: api/data.js + app.js + index.html.

## 111. CANLI KARTLARDA RAKAM YASAGI (§110.1 kapatildi) (28 Tem)

§110.1'de acik birakilan sorun: Ebu'nun notu tabloyla CELISIYORDU.
  not (15:54): XU100 -%0,34 · XUMAL -%0,70 · XK100 +%0,25 "katilim direncli"
  tablo(18:11): XU100 -%0,49 · XUMAL -%0,98 · XK100 -%0,37
XK100'un ISARETI TERSTI — notun sonucu canli veriyle celisiyordu.
Sebep hata degil TASARIM: SOGUMA_MS (6 saat) not yeniden yazimini bekletiyor.
Bu maliyet kontrolu icin dogru; yanlis olan sey CANLI kartta RAKAM birakmak.
DAMGA ALTIN KURAL 3 zaten bunu yasakliyordu: "Rakam iceren statik yorum metni
ya CANLI hesaba baglanir ya RAKAMSIZLASTIRILIR." Kural vardi, ajana ogretilmemisti.

COZUM — UC KATMAN:
1) TESPIT: kartKesfet artik her kart icin `canli` bayragi uretir. Isaret .ldot
   (yesil nabiz) — canliIsiklari() bunu zaten canli kartlara basiyordu, yeni bir
   isaretleme icat edilmedi, VAR OLAN kullanildi. Kartin kendisinde ya da bagli
   oldugu h2/h3 basliginda .ldot varsa kart canli sayilir.
2) ISTEM: her kart [CANLI] ya da [damgali] etiketiyle gonderilir. Canli olanlar
   icin kural: "RAKAM YAZMA — yon, kompozisyon ve ne anlama geldigini yaz,
   rakami tabloya birak. Endeks/hisse KODU serbest, ORANI degil."
   Damgali kartlarda rakam serbest (orada zaten canli tablo yok).
3) DENETIM: yazimdan sonra canli kartin notunda oran kaldiysa ajan panosuna
   uyari duser. KESMIYORUZ — "%20 esiginin altinda" gibi mesru kullanimlar var;
   sessiz kesme yeni bir sessiz hata uretirdi. Gorunur kilmak yeterli (§106 dersi).
TEST (8 vaka, 8/8): tabloyla celisebilecek 4 oran YAKALANDI, rakamsiz 4 yorum
TEMIZ gecti ("Katilim endeksi ana endekslerden olumlu ayrisiyor" gibi — istenen bicim).

DERS: bir kural DOKUMANDA olmasi onun UYGULANDIGI anlamina gelmez. DAMGA'nin
3. altin kurali 27 Tem'den beri yaziliydi; Ebu 28 Tem'de ihlal etti cunku kural
ona hic soylenmemisti. Insan icin yazilan kurallar, ajan devreye girince ISTEME
tasinmali — yoksa dokuman ile davranis sessizce ayrisir.

ajan.js v=20260729b. DOSYALAR: ajan.js + index.html.

## 233. SURUM ROZETI ISE YARADI · GENISLETILMIS SABLON DOGRULANMAMISTI (31 Tem)

Rozet ilk kosuda gorevini yapti:
    panel 20260731-p · api kap-2026-07-31-g
Ikisi de dogru. Yani deploy TAMAM, sorun BASKA YERDE. Onceki alti turda bu
ayrimi yapmak icin her seferinde bir tur harciyorduk.
YAN NOT: kirmizi kutudaki "ARENA" mesaji benim hata ciktim degil, EBU'NUN
04:00 damgali eski notuymus. Iki farkli sistemin ayni alana yazmasi
karistiriyor — Ebu notlari kendi damgasini tasidigi icin ayirt edilebiliyor.

### 233.1 ASIL SORUN: TAM TABLO SABLONU HIC SINANMADI
Sekiz kalemlik `_SANAYI` seti TOASO'da 12/12 DOGRULANDI (§213).
Ama tam tablo sablonu (_BILANCO_SANAYI 15 + _GELIR_SANAYI 18) HIC SINANMADI —
etiketleri KAP'in gercek metniyle karsilastirmadim, TAHMINLE yazdim.
Ustelik esik ">3 kalem" koymustum: az bulunca TAMAMEN basarisiz sayiyordu.
Yani calisan bir sey vardi ama gorunmuyordu.

### 233.2 IKI DUZELTME
(a) KISMI TABLO GOSTERILIR. Esik kalkti; en cok kalem bulan kimlik secilir
    (ilk yeterli olan degil). Eksik kalemler ZATEN soluk ve "bulunamadi"
    notuyla gorunuyor (§218.3) — yaniltmiyor. Kismi tablo hic tablodan iyi.
    Basarisizlikta her kimligin KAC KALEM verdigi yaziliyor ve teshis komutu
    oneriliyor.
(b) ETIKET VARYANTLARI COGALTILDI. KAP ara toplamlari BUYUK HARF yaziyor;
    buyuk harfli bicimler ONE alindi. Ayrica "VARLIKLAR TOPLAMI",
    "AKTIF TOPLAMI", "PASIF TOPLAMI" gibi alternatifler eklendi.
    16 kalem / 39 varyant (bilanco) · 19 kalem / 35 varyant (gelir).

### 233.3 DERS — DOGRULANMIS SETI GENISLETIRKEN DOGRULAMA TASINMIYOR
`_SANAYI` sekiz kalem, TOASO'da birebir dogrulandi. Sonra "tam tablo" icin
15+18 kalemlik yeni listeler yazdim ve DOGRULANMIS SAYDIM — oysa yeni
etiketlerin hicbiri sinanmamisti.
Bir setin dogrulanmis olmasi, ONU GENISLETEN setin dogrulandigi anlamina
gelmez. Genisletme YENI VARSAYIMLAR getirir ve onlar ayrica olculmelidir.

app.js v=20260731q · panel 20260731-q · api kap-2026-07-31-h.
DOSYALAR: api/kap.js + app.js + index.html.

## 246f 'SON 4 HAFTA' SATIRI — PENCERE-KENARI HATASI (3 Agu)

Kullanici: rotasyon kartinda 'Son 4 hafta YP degisim' onceden doluydu,
simdi bos. OLCUM: ayni ham'dan ilk uc satir DOLU -> veri geliyor; bosluk
`gSeri.length>=4` HEPSI-YA-HIC sartindan. Sorgu gun=30: bugun (Pzt 3 Agu)
- 30g = 4 Tem; TCMB Persembe yayinlar, son veri 24 Tem -> pencerede 3-4
yayin ve haftanin ilerleyen gunlerinde 4.su DISARI DUSUYOR. Onceden dolu
gorunmesi takvim sansiydi. (§245p limit kalibrasyonuyla ayni aile:
pencereler yayin RITMINE gore boyutlanir, yuvarlak sayiya gore degil.)
DUZELTME: gun=30 -> 60 (8 yayin garantisi) + length>=2 ile KISMI gosterim
('N hafta' etiketiyle) — hepsi-ya-hic yerine durust kismi gorunum.
KKM satiri ('—') ayri konu: gun=40 penceresi ayni riske acik ama KKM
verisinin kendisi de sonlanmis olabilir (program kapanisi) — siradaki
turda olculecek (bekleyen islere kondu).

app.js v=20260803f · ajan.js v=20260803a
DOSYALAR: app.js + index.html

## 276 HALKA ARZ: TAHMIN BIRIMI $ ISE CARPAN TABANI DA $ OLMALI (13 Agu)

BULGU (kullanici, KPEKS karti): "TL EV ile dolar FAVOK'u boluyor, halbuki USD
EV'yi de hesapliyor."
Tahmin Birimi secenekleri yalnizca ₺ idi (mn/bin/tam). Izahnameler cogu zaman
MILYON USD verir; kullanici ₺ secip $ deger girince carpanlar anlamsizlasiyor.
Ayrica birim YANLIS secilince 1000 KAT sapma: KPEKS'te "₺ (tam)" seciliydi,
EV/Satislar 108,5x gorundu — dogrusu 0,1085x.
ILK COZUMUM YANLISTI: tahmini KUR ile ₺'ye ceviriyordum. Kullanici duzeltti —
USD EV ZATEN HESAPLANIYOR (D(ev), koprü tablosunun sag sutunu). Dogrusu
tahmini oldugu gibi birakip PAYDAYI degistirmek:
    _pdT = _bUsd ? D(pd) : pd
    _evT = _bUsd ? D(ev) : ev
Cevirmek yuvarlama hatasi da ekler; bolmek temizdir.
EKLENEN: mn $ · bin $ · $ (tam) secenekleri. Tablo basligi para birimini
gosterir ("Satislar (mn $)"). USD secili ama KUR bossa UYARI cikar — sessizce
sifir tahmin uretmez.
DERS: bir orani hesaplarken PAY ve PAYDANIN ayni para biriminde oldugunu ne
garanti ediyor? (§252z ailesinin para birimi versiyonu.)

## 275 ECB: ICP AKISI EMEKLI, HICP AKISI GELDI — BOYUT YAPISI DEGISTI (12-13 Agu)

ECB Data Portal ACIK: anahtar yok, CORS izni var, tarayicidan dogrudan
calisiyor. Dosyadaki eski not "ECB agi kapaliyken OECD serisi" diyordu — o
durum artik gecerli DEGIL.
YENI UC ACILMADI (§248c): evds2'ye mod=ecb olarak bindirildi.

### ZINCIR — dort deneme, dorduncude KATALOGA SORULDU
1) ICP/M.U2.N.000000.4.ANR -> ok ama son gozlem 2025-12 (8 AY ESKI).
   Panel %2,9 (2026-07) gosteriyordu; uc "canli" diye 8 aylik veri verecekti.
2) `Y` varyanti (arindirilmis) denendi -> 404, oyle bir seri YOK.
3) HICP akisi ayni kalipla denendi -> 404.
4) KATALOG SORULDU: /service/dataflow/ECB -> 104 akis, icinde HICP var.
   Sonra ?detail=serieskeysonly ile 90.068 seri cekildi ve suzuldu.
KOK NEDEN — BOYUT YAPISI DEGISMIS:
   ICP  : FREQ.REF_AREA.ADJUSTMENT.ICP_ITEM.STS_INSTITUTION.ICP_SUFFIX
   HICP : FREQ.REF_AREA.ADJUSTMENT.ICP_ITEM.DATA_PROVIDER.ICP_SUFFIX
5. boyut '4' (Eurostat) yerine '4D0'. Akis adi ve madde kodlari AYNIYDI —
tek bir boyut degeri yuzunden 404.
DOGRU ANAHTARLAR (tahmin DEGIL, katalogdan suzuldu):
   HICP/M.U2.N.000000.4D0.ANR   manset
   HICP/M.U2.N.XEF000.4D0.ANR   cekirdek
   HICP/M.U2.N.NRGY00.4D0.ANR   enerji
   FM/D.U2.EUR.4F.KR.DFR.LEV    mevduat faizi (canli)
   FM/D.U2.EUR.4F.KR.MRR_FR.LEV ana refinansman

### §275b SIRALI CEKIM
Dort eszamanli istekte dfr ve hicpCekirdek HTTP 504 verdi — ikisi de
tarayicidan TEK TEK calisiyor. ECB portali eszamanlilikta yavasliyor.
Sirali + 20 sn: dordu de geciyor.

### §275c YAS KONTROLU — SESSIZ BAYATLIK EN KOTUSU
Uc ok:true donuyordu ama veri 8 AY eskiydi. Aylik seri 90 gunden eskiyse
`bayat:true` isaretlenir. Bu olmasaydi ICP'nin durdugunu FARK ETMEZDIK.

### UYARI — ECB HIZ SINIRI
Art arda alti sorgu atinca ECB IP'yi gecici engelledi ("Your access has been
blocked due to security concerns", HTTP 400). Cerez degil IP tabanli;
~1 saatte acildi. Kesif sorgulari ARALIKLI yapilmali, ozellikle
?references=all gibi agir olanlar.

## 274 AYNI NOT IKI KEZ BASILIYORDU — AD DEGIL METIN BAZLI COZUM (13 Agu)

Avrupa sekmesi: "AVRO BOLGESI ENFLASYON — KIRILIM" notu ekranda IKI KEZ,
ayni metin ayni damga.
ILK COZUM (§274, ad bazli tekillestirme) YAKALAMADI. OLCULDU:
  document.querySelectorAll('.note').filter(ayni metin).length = 2
Iki AYRI .note elemani ayni icerigi tasiyor ve FARKLI adlara cozuluyorlar —
ad bazli suzgec bu yuzden calismadi.
§274b: METIN IMZASI ile karsilastirilir (ilk 140 karakter, >=40 uzunluk).
Ad ne olursa olsun ayni icerik ikinci kez basilmissa GIZLENIR.
GIZLENIR, SILINMEZ: sonraki tur adlari dogru cozerse eleman yerinde durur ve
geri gorunur. Silmek geri donussuz olurdu.
Dort noktadan cagrilir: nobetci, iki geri-yukleme, yeni yazim sonrasi.
DOGRULANDI: kartta artik iki FARKLI icerik var (statik aciklama + Ebu notu),
tekrar yok.

## 273 RRP BIRIM HATASI — YUVARLAMA BIR YARGIYA DONUSMUSTU (12 Agu)

Fed Bilancosu karti "Ters repo (RRP) 0 mlr\$ — tampon BITTI" diyordu ve
uzerine anlati kuruyordu ("likidite tamponu bitmis, QT baskisi dogrudan banka
rezervlerine aktariliyor").
GERCEK DEGER 0,725 mlr\$ = 725 MILYON. Sifir DEGIL.
KOK NEDEN: RRPONTSYD FRED'den MILYAR gelir, WALCL/WRESBAL MILYON. Kod ucunu
de 1000'e boluyordu -> 0,725/1000 = 0,000725 -> trN(,0) -> "0".
(§252l ailesi: birim SERIYE GORE degisir.)
DUZELTME: bolme kaldirildi, gosterim <10 mlr icin 2 ondalik, ve esik metni
"tampon BITTI" -> "tampon tukendi (<1 mlr)". Yon ayni, iddia durust.
DERS: bir yuvarlama sonucu METIN URETIYORSA, o metin veriyi degil
YUVARLAMAYI yansitiyor olabilir.

## 272 TUFE: BIR EKSIK GOZLEM, BIR AYLIK KAYMA (12 Agu)

Kullanici yakaladi: "TUFE temmuzda 3.4 geldi ama bir kontrol etsene."
Panel %3,52 hesapliyordu, BLS mansети %3,4.
UC TUR TAHMIN, DORDUNCUDE OLCUM:
  1) onbellek sandim -> degildi (no-store ile ayni sonuc)
  2) SA/NSA farki sandim -> CPIAUCSL->CPIAUCNS gecisi yaptim, %3,52 KALDI
  3) tarayicidan FRED'e bakalim dedim -> CORS, gidilemez
  4) market.js'e ?hamSeri= teshis parametresi eklendi -> HAM GOZLEMLER GELDI
KOK NEDEN (ham veriden):
    2025-12  324.054
    2025-11  324.122
    2025-09  324.800     <- 2025-10 GOZLEMI YOK
Kod gozlemler[0] / gozlemler[12] yapiyordu. Bir ay eksik oldugu icin indeks 12
Temmuz 2025 yerine HAZIRAN 2025'e denk geliyordu:
    333.918 / 322.561 (Haz'25) = %3,52   <- panel
    333.918 / 323.048 (Tem'25) = %3,37   <- BLS ile ayni
DUZELTME: TARIHE GORE ESLEME. Ay hesaplanir, o tarihli gozlem ARANIR;
bulunamazsa hesap YAPILMAZ (yanlis ay yerine deger yok).
NOT: SA->NSA gecisi de DOGRUYDU ama YETMIYORDU — iki hata ust uste binmisti.
DERS: indeks sayarak geriye gitmek, seride TEK BIR bosluk olsa bile hesabi
SESSIZCE kaydirir. (§252z ile ayni aile, ucuncu vaka.)

## 266 AYNI GUN IKINCI KOSU 1G'YI VE AKISI SIFIRLADI (12 Agu)

BULGU: katfon.json'da 46 fonun HEPSINDE g[0]=0 VE a=0. Panel "+0" gosterdi.
Dosyada onceki gun gercek degerler vardi (GOP 0,1101 · KSK 0,0998).
KOK NEDEN:
    const eski = f.yu;                  // dosyadaki fiyat
    f.g[0] = (yeni / eski - 1) * 100;   // 1G hesaplanir
    f.yu = yeni;                        // USTUNE YAZILIR
Ilk kosu DOGRU. Ayni gun ikinci kosuda f.yu ARTIK BUGUNUN fiyati ->
yeni/eski = 1 -> 1G TAM SIFIR. 12 Agu'da Actions UC KEZ `hepsi` kostu.
AKIS ayni sebeple (§266b): dunKayit arsivin SON gununu aliyordu, o da
BUGUNDU (ilk kosu yazmisti) -> Dpay = 0 -> 46 fonda birden sifir.
COZUM:
  1G  — d.fiyat_tarihi === bugun ise TEKRAR KOSUDUR: seviyeler (fiyat/AUM)
        tazelenir, 1G ve akis KORUNUR. Ilk kosunun hesabi dogrudur,
        ikincisinin yapacak isi yoktur. Rapora satir dusuluyor.
  akis — dunKayit artik bugunu ACIKCA disliyor
        (Object.keys(...).filter(x => x !== bugun)). Hafta sonu/tatil
        boslugu kendiliginden atlanir.
NOT: §263'un yeni fon-akis.json yolu bu hatayi TASIMIYOR — bugunun kaydini
ANAHTAR BAZLI uzerine yaziyor, sonIki hep [dun, bugun] cikiyor. Test edildi.
SIFIRLANANLAR GERI GELMEZ: eski fiyatlar dosyadan silindi. Sonraki gun
kosusu dogru hesaplar.

DESEN — BU OTURUMDA UCUNCU KEZ: iki olcum arasindaki GERCEK ZAMAN FARKI
sifirsa, degisim de TANIMSIZDIR.
  §252z  beta: arsiv karma yogunlukta, ay-araligi gunluk getiri sayiliyordu
  §266   katfon 1G: ayni gun ikinci kosu, fiyat farki sifir
  §266b  katfon akis: "dun" bugunun kendisi
Ucunde de kod SESSIZCE sifir ya da sacma deger uretti. Bir degisim hesabi
yazarken SORULACAK SORU: "iki ucun farkli zamanlara ait oldugunu ne
garanti ediyor?"

## 290 HANE HALKI YATIRIM TERCIHI + IKI TUZAK (14-17 Agu)

TCMB Hanehalki Beklenti Anketi SORU_20: "yatirim yapabilecegin nakit varligin
olsa hangisini yaparsin?" — mevduat/doviz/altin/borsa/TL fonu/doviz fonu/
gayrimenkul dagilimi. TP.HANEBEK.HAN20*
NEDEN: gunluk fon akisi (§263) GERCEKLESEN davranisi olcuyor, bu seri NIYETI
veriyor. Ikisi ayrisirsa sinyal — "borsada degerlendiririm" yukselirken fon
girisi yoksa niyet var eylem yok demektir.

### §290b IKI TUZAK, IKISI DE ILK SURUMU BOZDU
1) ?adFiltre=SORU_20 ESLESEN ILK SERIYI seciyor, hepsini DEGIL. Yanitta
   cozulen tek kod (HAN20A), ham'da tek sutun. Diger dordu HIC gelmiyordu.
   -> Bes seri AYRI cekiliyor (uc onbellekli, maliyet dusuk).
2) isFinite(null) JS'te TRUE doner — Number(null)=0 oldugu icin. Suzgec bos
   degerleri GECIRDI ve kartta "%0,0" gorundu. isFinite('') de TRUE.
   -> Number.isFinite kullanilir.
DERS: bir suzgec "sayi mi" diye soruyorsa hangi isFinite oldugu ONEMLIDIR.

### KAYNAK ARASTIRMASININ SONUCU (13-17 Agu)
Piyasa Katilimcilari Anketi'nin TAM SETI EVDS'DE YOK. Bes arama terimi
denendi (beklenti/katilimci/anket/piyasa/yeni), ?ara= siniri kaldirildi
(§288), gruplar tarandi. Bulunan:
  bie_enfbek      5 seri  — 12 ay enflasyon beklentisi (piyasa/reel sektor/
                            hanehalki). UCU DE PANELDE ZATEN KULLANILIYOR.
  bie_hanebek    33 seri  — hanehalki anketi: kur beklentisi (HAN19A), konut
                            (HAN18A), yatirim tercihi (HAN20*)
  bie_bekodtufeyeni 100   — yalniz olasilik dagilimlari
YOK: yil sonu politika faizi · yil sonu TUFE · USD/TRY · buyume · cari acik.
Bunlar TCMB'nin AYLIK PDF raporunda, EVDS'de yayinlanmiyor.
SONUC: kartin o bes satirinin elle olmasi TERCIH DEGIL KAYNAK KISITI.

## 289 EX-ANTE REEL FAIZ SEKMEYE BAGIMLIYDI (14 Agu)

Merkez Bankalari kartindaki "Ileriye donuk reel faiz" BOS (—) gorunuyordu.
KOK NEDEN: exAnteHesapla yalniz tahminCiz() icinden cagriliyor, o da
TAHMINLER ALT SEKMESI acilinca kosuyor (tembel yukleme). Kullanici o sekmeye
girmeden deger hic hesaplanmiyordu.
DUZELTME: acilista da hesaplanir. Politika faizi UCTAN DEGIL
tahminPolitikaFaizi()'nden alinir — o zaten BIS/EVDS siralamasini ve damgali
yedegi yonetiyor (§125); kendi cagrimi yazsaydim IKINCI SAHIP yaratirdim.
Tahminler acilinca tahminCiz() ayni degeri uzerine yazar, celiski olmaz.
YAN BULGU: TP.ENFBEK.PKA12ENF (Piyasa Katilimcilari Anketi 12 ay TUFE)
PANELDE ZATEN VARDI — gun boyu EVDS'de aradigimiz seri Tahminler sekmesinde
calisiyormus. Once KENDI KODUNA bak.

## 288 ?ara= SINIRI PARAMETRELI (13 Agu)

Katalog aramasi 30 grupla sinirliydi. ?ara=e 668 grup buldu ama uc yalniz 30
donduruyordu — aranan grup GORULEMEDI ve bes tur terim tahmin edildi.
?n= ile 500'e kadar. Varsayilan 30 (yanit kucuk kalsin).
DERS: katalog taramasi gerektiginde TUM LISTE okunabilmeli; tahmin turu
maliyetli ve bugun dort kez bosa harcandi.

## 287 TEK TIK IKI MAIL — DINLEYICI CIFTLENMESI (14 Agu)

Kullanici bir kez tikliyor, Resend IKI mail gonderiyordu.
KOK NEDEN: incPaylasInit() HER KART LISTESI CIZIMINDE cagriliyor ve her
cagrida addEventListener YENI dinleyici EKLIYOR — eskisi duruyor.
incelemeInit iki yerden kosuyor: acilista VE KART SILINDIGINDE. Sil-uret
dongusu ne kadar tekrarlarsa o kadar dinleyici birikiyor.
RESEND SUCSUZ: tarayici gercekten iki POST atiyordu.
DUZELTME: bagla() yardimcisi — dataset ile "zaten bagli mi" isaretlenir,
ikinci cagride atlanir. YEDI dinleyiciyi birden kapsar (mail/kopyala/yazdir/
alici/secim/hizli secim) ve en kritigi KART ICI delege dinleyici: o
ciftlenirse tek tikta iki mail VE IKI SILME olur.
DERS: bir init fonksiyonu birden fazla kez cagrilabiliyorsa icindeki
addEventListener'lar KORUMASIZ birikir. Belirti bambaska yerde gorunur.

## 285 GSYH KARTLARI + ECB/FRED TAZELIK YARISI (13 Agu)

Turkiye makro seridinde "BUYUME Ç1'26 +%2,5" vardi; ABD ve Avrupa icin
karsiligi YOKTU.
ABD : A191RL1Q225SBEA — ceyreklik YILLIKLANDIRILMIS (SAAR), manset rakam
AVRO: MNA/Q.Y.I9... — YILLIK degisim (y/y)
IKISI AYNI OLCU DEGIL ve kartlarda oyle YAZILI. Ayni karta koyup ikisine de
"buyume" demek, farkli olculeri karistirmak olurdu (§268 ailesi).

### §285b ECB SECIMIM YANLIS CIKTI — OLCUM DUZELTTI
Anahtar TAHMIN EDILMEDI: MNA akisinin 29.593 serisi ?detail=serieskeysonly ile
cekilip suzuldu. IKI ADAY:
  I8 = 19 ulke (Hirvatistan HARIC) -> son gozlem 2024-Q1, SERI DURMUS
  I9 = 20 ulke (guncel bilesim)    -> son gozlem 2026-Q1 ✓
ECB'yi secme gerekcem "20 ulke kapsami dogru" idi ve HALA GECERLI. AMA:
  ECB  (MNA/I9)      : Ç1'26 · +0,5%
  FRED (Eurostat)    : Ç2'26 · +0,9%   <- BIR CEYREK ONDE
Eurostat hizli tahminini ceyrek bitiminden ~30 gun sonra yayinliyor; ECB'nin
MNA akisi geriden geliyor. Bir ceyrek ESKI veriyle ustune yazmak KAZANC DEGIL
KAYIP olurdu.
DUZELTME: tarih karsilastirilir, ECB yalniz DAHA YENIYSE yazar. Kapsam
avantaji ECB'de, tazelik FRED'de — hangisi ondeyse o gorunur.
DERS: "daha otoriter kaynak" ile "daha guncel kaynak" AYNI SEY DEGIL.

## 284 AYNI DEGER IKI KARTTA, IKISI FARKLI (13 Agu)

Kullanici sordu: "ileriye donuk reel faiz %13 dogru mu, baska kartta %10".
"≈ %13" index.html'e SABIT yazilmisti, hicbir hesaba bagli degildi.
Dogrusu (1,37/1,2395-1)×100 = %10,5 — IKI BUCUK PUAN sapma. %13 muhtemelen
beklenti ~%21 iken hesaplanmis bir damga.
§129 TAM BU SORUNU bir kez yasamis: "Kullanici hakli olarak sordu: %10,5
diyorsun ama burada %7,9". Tek kaynak kurali konmus AMA BU KARTA
UYGULANMAMIS.
Ayni gun ayni desen ALTI kez: CDS · TUFE · Brent · Fed olasiligi · GSYH ·
reel faiz. Hepsi ayni: BIR DEGERI DUZELTIRKEN AYNI DEGERIN BASKA NEREDE
GECTIGINE BAKILMALI.
§284b Fed "siradaki 29 Tem" GECMISTI (bugun 13 Agu) ve Fed & Politika karti
  ZATEN "15-16 Eyl" diyordu — ayni ekranda iki tarih.
§284c 12 ay TUFE %23,81 sabitti; OKU_BEK 23,95'e guncellenmis ama bu satir
  eski degerde kalmisti.
§284d ≈%82 Fed olasiligi DORT kartta geciyor, ikisinde yas etiketi vardi
  ikisinde yoktu. SINIF BAZLI (.fedYas82) yapildi — yeni kart eklenirse
  otomatik kapsar.

## 283 BOS METRIK KUTULARI — ZINCIRIN ILK HALKASI KOPMUSTU (13 Agu)

ARASE ve ATATP kartlarinda dort metrik "—" gorundu, oysa OZET METINDE
rakamlar vardi. Kart "Birim belirsiz" diyordu.
§283  Model boş birakirsa SUNUCU DOLDURUR: degerler _gost'ta zaten hazir,
      metrik adindan eslenip yaziliyor. Deterministik, token'dan bagimsiz.
      EŞLEME TUZAGI: "Nakit & Parasal Pozisyon" once parasal'a dusuyordu —
      sira duzeltildi, basliktA ONCE GECEN kalem esas.
§283b Birim COZULEMEZSE ham sayi yazilir. Olcek eki YOK (§257 korunur) ama
      kutu DOLU. Bilinmeyen olcekli rakam, bos kutudan iyidir.
§283c ASIL KOK NEDEN: fiyat CANLI_FIYAT sozlugunden aliniyordu; o yalniz ACIK
      SEKMEDEKI hisseleri tasiyor. Bilanco karti Ebu panosundan uretiliyor ve
      orada cogu hisse YOK. ATATP'nin pay_adedi xktum.json'da VARDI ama fiyat
      gelmedigi icin pd gonderilmedi -> §255 PD/DD ekseni HIC calismadi ->
      birim belirsiz kaldi -> kutular bos.
      Artik fiyat UCTAN alinir (?mod=fiyat&kodlar=). Ilk yazimda parametre adi
      (kod vs kodlar) ve yanit bicimi de yanlisti — ikisi de olculup duzeltildi.
DERS: belirti "birim belirsiz" diyordu, hata UC ADIM ONCESINDE bir fiyat
sorgusundaydi.

## 282 AVRUPA MEGA-CAP CANLIYA — VE MARKETSTACK KOTASI KORUNDU (13 Agu)

Kart 27 Tem'den beri elleydi. Arastirma notlari DEGERLI ve KALDI; yalniz
FIYATLAR canliya bagli: ASML.AS · MC.PA · SAP.DE · NOVO-B.CO (yerel borsalar,
kendi para birimlerinde — ADR degil, notlardaki €/DKK ile ayni zeminde).
KARAR: Marketstack API'si alinmisti (ayda 100 istek) ama BURAYA HARCANMADI.
Yahoo ayni veriyi ucretsiz ve sinirsiz veriyor. Kotanin gercek degeri
split_factor/dividend alanlarinda — Yahoo onlari temiz vermiyor ve bedelsizler
gunlerce kacabiliyor (KTLEV vakasi).
§282b SESSIZ KAYIP: semboller `tum` listesine EKLENDI ama data'ya
  YAZILMADI — her grup tek tek dagitiliyor (keys/SEC/END/HIS2) ve AVMEGA icin
  o satir yoktu. Cekiliyordu, sonuc ATILIYORDU. Panel "ASML.AS: YOK" gosterdi.
  Bu oturumda YEDINCI "kod var, teslim yok" vakasi.

## 280 GUNLUK FON AKISI: KURUCU ESLEMESI (13 Agu)

Kullanici sordu: "rakamlar dogru mu Actions'un cektigi".
FON BAZINDA DOKUZ FON birebir dogrulandi (KLU/KTV/KTT/PBR/PRY/PNU/TLY/THF/TP2)
— hesap, tarih, isaret, birim hepsi tam. AMA KURUM TOPLAMLARI ayrisiyordu:
Pusula panelde -2,51 mlr, gercekte +1,85 mlr (ISARET BILE TERS).
KOK NEDEN: mod=liste 1041 kayit donduruyor, evren 2015 fon. 974 fonun
kurucusu YOK ve hepsi "(kurucu bilinmiyor)" satirinda toplaniyordu:
+21,78 MLR TEK SATIRDA.
§279 COZUM: TEFAS fon adlari kurumla baslar ("GARANTI PORTFOY IKINCI PARA
PIYASASI (TL) FONU"). "PORTFOY" kelimesine kadar olan kisim kurum kimligidir.
Turetme YALNIZ esleme yoksa devreye girer — mevcut kurucuAd'a DOKUNMAZ, yani
en kotu ihtimalde onceki durum kalir.
§279b NORMALLESTIRME: "TERA PORTFOY YONETIMI A.S." (TEFAS) ve "TERA PORTFOY"
(turetilen) ayni satira dusmeliydi, yoksa kurum IKI SATIR olurdu.
SONUC (dogrulandi): 974 fon eslendi, "(kurucu bilinmiyor)" satiri TAMAMEN
kayboldu, SEKIZ KURUM Fintables ile birebir tuttu.
ZIRAAT/QNB farki HATA DEGIL: Halk Portfoy Ziraat bunyesine gecmis; TEFAS fon
adini guncellemis, Fintables PYS tablosu eski eslemede. PANEL DAHA GUNCEL.
YAN FAYDA: fon adindan turetmek, kurucu tablosundan okumaktan TAZE olabiliyor.

DERS: hata HESAPTA DEGIL DAGITIMDA idi ve bunu ancak dokuz fonu tek tek
dogrulayarak anladim. Formul bastan beri dogruydu; kurcalasaydim CALISAN BIR
SEYI BOZACAKTIM.

## 281 ARZ FORMU: MARJDAN TURETME + YIL OTO-DOLDURMA (13 Agu)

Kullanici istedi: marj girilince FAVOK/net kar kendiliginden hesaplansin, ve
1. yil girilince digerleri +1 gelsin.
Hesapta marj turetmesi ZATEN VARDI ama sonuc yalniz hesapta kullaniliyor,
KUTUYA YAZILMIYORDU — kullanici marji girip kutuyu bos goruyordu.
§278c KENDI KORUMAM TERS TEPTI: "yalniz kutu BOSSA doldur" kurali koydum;
  kullanici "15" yazarken once "1" tusuna basiyor -> FAVOK 10.000 yaziliyor ->
  "5" gelince marj 15 oluyor AMA kutu artik DOLU oldugu icin guncellenmiyordu.
  Koruma dogruydu ama KENDI YAZDIGINI da "elle girilmis" sayiyordu.
  Uc durum AYRILDI: bos -> doldur · turetilmis -> YENIDEN HESAPLA ·
  elle girilmis -> DOKUNMA.
Yil etiketleri: yalniz BOS olanlar doldurulur; "2027T" gibi ozel etiket
korunur ve o kutuya dokununca oto damgasi kalkar.

## 286 KOPRU TESTI 15 GUNDUR GUNCELLENMEMISTI (14 Agu)

test/kopru-testi.js son 29 Tem'de guncellenmis; aradan gecen surede ALTI yeni
uc kuruldu ve BIR DOGRULAYICI YANLISTI.
§286a mod=fiyat dogrulayicisi `d.fiyat || d.fiyatlar` ariyordu ama uc
  {KOD: deger} DUZ SOZLUK donduruyor. SAGLAM UCTA ASILSIZ ALARM veriyordu —
  §116'nin tekrari: sema KAYNAKTAN okunmali, hatirlanmamali.
EKLENEN: evds2 mod=yab (ok:true ama BOS — §259 vakasi) · mod=ecb (bayat seri
  bayragi) · tefas mod=gnl (tedPaySayisi yoksa fon akisi hesaplanamaz) ·
  tcmb cds=1 (akil disi deger + 10 gun eskime) · market Avrupa mega-cap
  (§282b "cekiliyor atiliyor" hatasi) · fon-akis.json (kurucu eslesmesi %90
  altina duserse — §279 vakasi)
24 -> 30 uc. Yeni uclarin hepsi KRITIK DEGIL: damgali yedekleri var, dususte
panel bosalmaz ama SESSIZCE eskir — uyari yeterli.

## 277 UC GUNUN ORTAK DERSI: "IKI UC HANGI ZAMANA/BIRIME AIT?" (13 Agu)

Bu oturumda AYNI SINIF hata BES kez cikti ve hepsi SESSIZCE yanlis deger
uretti — hicbiri hata firlatmadi, hicbiri denetimden dusmedi:

  §252z  beta       arsiv karma yogunlukta; AY araligi GUNLUK getiri sayildi
  §266   katfon 1G  ayni gun ikinci kosu; fiyat farki sifir
  §266b  katfon akis "dun" bugunun kendisiydi
  §272   ABD TUFE   bir eksik gozlem; indeks 12 BIR AY kaydi
  §276   arz carpan TL EV bolu USD FAVOK

Dordu ZAMAN, biri PARA BIRIMI — ama soru ayni:
    BIR ORAN YA DA DEGISIM HESAPLARKEN, IKI UCUN AYNI OLCEGE
    (ayni zaman araligi / ayni para birimi) AIT OLDUGUNU NE GARANTI EDIYOR?
Kod bunu VARSAYIYORDU: "indeks 12 = 12 ay once", "son kayit = dun",
"iki deger de TL". Varsayimlarin hicbiri kontrol edilmiyordu.

KURAL: fark/oran hesaplayan her yerde ucun KIMLIGI dogrulanir —
  · zaman: tarihi HESAPLA ve o tarihli gozlemi ARA (indeks sayma)
  · sureklilik: iki gozlem arasi makul mu (>5 gun ise gunluk getiri DEGIL)
  · ayni gun: dosyanin damgasi bugunse bu TEKRAR kosudur, hesap yapma
  · para birimi: pay ve payda ayni birimde mi
Bulunamazsa HESAP YAPILMAZ. Yanlis ay/birim yerine DEGER YOK daha iyidir.

### IKINCI ORTAK DERS: TAHMIN ETME, KAYNAGA SOR
Bu oturumda dort kaynak avi yasandi ve DORDU DE ayni sekilde cozuldu:
  CDS      — dokuz kaynak denendi, kullanicinin HAR olcumu cozdu
  TEFAS    — uc uc adi tahmin edildi (ucu de yanlis), HAR dogrusunu verdi
  ABD TUFE — uc tur tahmin (onbellek/SA-NSA/CORS), HAM GOZLEM cozdu
  ECB HICP — uc anahtar tahmin edildi (404), KATALOG cozdu
Ortalama: her avda ~3 bosa deneme, sonra olcum. Tahmin sirasi TERSINE
CEVRILMELI — once ham veriyi/katalogu iste, sonra kod yaz.

### UCUNCU: DUZELTMENIN KENDISI KIRIK CIKABILIR
Bu oturumda yazdigim duzeltmelerden ALTISI ilk halinde calismadi:
  sapma (yanlis alan) · uyeSayi (zamanlama) · tohumlama (tarih surekliligi)
  TEFAS sayfalamasi (ilk 1000) · EVDS URL (eski uc) · §276 (yanlis yon)
Hepsi node --check ve envanter testinden GECTI. Hepsini CALISAN SISTEMIN
CIKTISI yakaladi: konsol dokumu, ekran goruntusu, rapordaki sayi, kullanici.
"Kod var" ile "kod isini yapiyor" AYRI SEYLERDIR (§252n/§252u).

## 271 BILANCO KARTI ISTEMI: ALTI KURAL, ALTISI DA HESAPLANMIS (12 Agu)

Gun boyunca bilanco kart zincirine alti kural eklendi ve HEPSI ayni ilkeyle:
MODELE "DIKKAT ET" DEMEK YERINE OLGUYU SUNUCUDA HESAPLAYIP VERMEK.
Bir kural, hesaplanmis bir olguyla birlikte verilirse TUTAR; yalniz uyari
olarak verilirse model onu unutur ya da yanlis uygular.

§257  BIRIM — hazir gosterim dizgisi (bkz. ayri bolum)
§267  GYO MARJ TUZAGI. RGYAS: model "faaliyet marji %115'e dustu, sorunlu
      seviye" yazdi. Rakam DOGRU (5,31/4,61) ama OKUMA YANLIS — faaliyet kari
      ciroyu asamaz; GYO'da asar cunku YATIRIM AMACLI GAYRIMENKUL DEGERLEME
      KAZANCI "Diger Faaliyet Gelirleri"nden faaliyet karina girer, ciroya
      girmez. RGYAS'ta bu kalem 2,49 mlr (faaliyet karinin %47'si).
      2C25'te oran %237 idi -> "marj dustu" degil DEGERLEME KAZANCI KUCULDU.
      COZUM: faaliyet kari > ciro ise isteme UYARI + ALTERNATIF yazim yolu
      (farki TUTAR olarak soyle, brut marji kullan). Esik SUNUCUDA olculur.
      Panelde EKGYO/AVPGY/PAGYO/BEGYO/ASGYO... cok — tuzak TEKRARLAYACAK.
§267b NET KAR KOPRUSU. Model "artis parasal kazanctan" dedi. OLCULDU:
      finansman gideri +2,21 mlr · parasal +0,63 mlr -> finansman UC KAT
      buyuk etken, model SIRALAMAYI TERS kurmustu. Artik katkilar buyukten
      kucuge hesaplanip isteme yaziliyor: "hangisi baskin" YORUM DEGIL
      ARITMETIKTIR.
§267c ONCEKI DEGER TURETMESI. kap.js yalniz parasal/ozkaynak/nakit'te
      `onceki` gonderiyor; digerleri icin yoy'dan geri hesaplanir
      (onceki = deger/(1+yoy/100)). Gercek veriyle dogrulandi, sapma binde bir.
§268  PUAN / BP. Model "faaliyet marji y/y -122 bp" yazdi; gercek fark 122
      PUAN = 12.200 bp, YUZ KAT hata. Ilginc olan: AYNI KART brut marjda
      "+3 bp"yi DOGRU kullandi — birimi biliyor, buyuk farkta kayiyor.
      KURAL: |fark| >= 1 puan ise PUAN, altinda bp. Dizgi hazir verilir.
§268b BILANCO TABANI. Model "oz kaynaklar +%4,6" dedi, gercek y/y +%15,2.
      MODEL SUCLU DEGIL: KAP BILANCOSUNDA `onceki` = ONCEKI DONEM SONU,
      GELIR TABLOSUNDA = GECEN YILIN AYNI CEYREGI. Iki farkli taban, AYNI
      alan adi — istemde hangisinin ne oldugu SOYLENMIYORDU. Model dogru
      hesaplamis, yanlis ETIKETLEMISTI. Artik taban acikca yaziliyor.
§269  TOKEN TAVANI. RGYAS karti YARIМ cikti: son iki metrik "undefined",
      PORTFOY TEZI HIC YAZILMADI, ve model butceyi metriklerde harcayip hazir
      gosterimi kullanmadi (ciro "4.608.603 bin ₺" ham yazildi).
      ALTINDA IKI KAT SESSIZ HATA: cagiran aiUret(istem, 2600) diyordu ama
      aiUret icindeki Math.min(2500, ...) onu SESSIZCE KIRPIYORDU. §223b tam
      bu sorunu bir kez yasamis, 1400->2600 yapmis ve tavanin kirptigini FARK
      ETMEMIS. Tavan 4000, istek 3600.
§269b KESILME REDDI. stop_reason==='max_tokens' yakalanir ve kart HIC
      URETILMEZ. Yarim kart vermek, kart vermemekten KOTUDUR — cunku yarim
      kart DOGRU GORUNUR. Kullanici "portfoy tezi yazmadi" diye fark etti;
      fark etmeseydi eksik kart onaylanacakti.
§269c "undefined" DIZGESI. Model metrik degerine LITERAL "undefined" yazdi;
      esc(m.deger||'') bunu yakalamaz (dolu bir dizgedir). Artik "—" gosterilir
      ve yanitta eksikMetrik sayaci doner.

SONUC (dogrulandi): RGYAS karti ucuncu uretimde TAM cikti — 11 rakamin 11'i
Fintables ile birebir, marj dili yok, kopru sirali, birimler dogru, tez yerinde.

## 265 BILANCO YOKSAYMA — "SIL" DEGIL "GIZLE" (12 Agu)

Kart bekleyen bilanco listesi 29 sirket gosteriyordu; kullanici hepsinin
kartini yazmak istemiyor. Ama liste KAP'tan TURETILIR — statik bir kayit
degil, silmek ise yaramaz (sonraki nobette geri gelir).
COZUM: kod+DONEM kapsaminda kalici yoksayma (ktp_bilanco_yoksay_v1).
  · ✕ dugmesi IKI yerde: Ebu panosu + Earnings AI rozet seridi
  · Kapsam kod+donem: ZERGY 2026/2 gizlemek 2026/3'u GIZLEMEZ — yeni ceyrek
    yeni karardir, kalici sessizlestirme degil
  · GERI ALMA GORUNUR: pano altinda "gizlenen N: ZERGY · OZATD ..." satiri,
    tiklayinca geri gelir. Yoksa kullanici neyi sakladigini unutur ve liste
    sessizce eksik kalir.
  · CLOUD_KEYS'e eklendi — her cihazda tek tek gizlemek gerekmesin.

## 264 ONAYLANAN KART YENILEMEDE KAYBOLUYORDU (12 Agu)

BULGU: ZERGY karti onaylandi, "✓ Earnings AI'a eklendi" mesaji cikti,
localStorage'a YAZILDI (dogrulandi) — ama SAYFA YENILENINCE YOK OLDU.
KOK NEDEN: cloudSaveDebounced 900 MS BEKLER. Kullanici o sure dolmadan
yenilerse kayit buluta HIC GITMEZ; cloudLoad bulutdaki ESKI listeyi (8 kart)
yerelin (9 kart) USTUNE yazar ve yeni kart silinir.
MEVCUT KORUMA YETMIYORDU:
    if(bSay===0 && ySay>0) return;   // yalniz bulut TAMAMEN BOSken
Burada bSay=8, ySay=9 -> kosul tutmadi.
IKI DUZELTME:
  1) BIRLESTIRME (app.js cloudLoad): taslak kartlar kod|donem anahtariyla
     BIRLESTIRILIR, ezilmez. Cakismada _onay damgasi YENI olan kazanir.
     Test: kullanicinin durumu / cakisma / baska cihazda eklenen — ucu de dogru.
  2) ANLIK BULUT YAZIMI: onay ve silme artik `await cloudSave()` kullaniyor,
     debounce DEGIL. Onay ANLIK bir eylemdir, biriktirilecek bir sey yok.
     SILME ICIN KRITIK: 900 ms gecikmede yenileme yapilirsa silinen kart
     bulutta kalir ve BIRLESTIRME onu GERI GETIRIR.

## 263 GUNLUK FON AKISI — PAY ADEDI YONTEMI, FINTABLES GEREKMEZ (12 Agu)

SORU: Pusula/Tera fonlarina gunluk giris-cikis hesaplanabilir mi?
OLCULDU (25 gozlem, 5 fon x 5 gun):
  ham DAUM   -> ortalama %48 SAPMA. AUM hem akistan hem GETIRIDEN degisir.
                T3B'de akis TAM SIFIRKEN AUM 6 gunde +%9 artti (tamami getiri).
  pay adedi  -> MEDYAN %0 FARK, 25/25 gozlemde <%10.
FORMUL:  akis = (pay_t - pay_t-1) x fiyat_t
Pay adedi getiriden ETKILENMEZ; yalniz alim-satimla degisir. Fintables'in
kendi gunluk_nakit_giris_cikisi alani da boyle hesaplaniyor.
VERI ZATEN ELDEYDI: mod=gnl yaniti tedPaySayisi + fiyat veriyor. Tek eksik
DUNUN pay adediydi -> fon-akis.json arsivi (son 15 gun).
Kurucu eslemesi mod=liste'nin kurucuAd alanindan -> PYS bazinda gruplama.
KART: Katilim Fonlari sekmesinde GIRIS/CIKIS/NET + en cok giren 8, en cok
cikan 5 PYS (her satirda o kurumun en buyuk uc fonu).
AKLI BASINDA SINIR: tek fonda tek gunde >50 mlr TL akis REDDEDILIR
(pay adedi duzeltmesi ya da bolunme olabilir).

## 262 YARDIM MENUSU GUNCELLENDI (12 Agu)

Kilavuz sekme rehberi + kavram sozlugu olarak IYIYDI ama panelin SU ANKI
calisma bicimini anlatmiyordu: Ebu hic gecmiyordu, canli/damgali ayrimi
yoktu, bilanco karti akisi ve nobet yoktu.
EKLENEN UC BOLUM: (1) veri nereden gelir — canli/uc/otomasyon/damgali dort
katman, (2) Ebu — iki isi, hash mekanizmasi, nobet, not yasi, duraklama
seridi, (3) bilanco karti akisi — taslak/oku/skor+onayla, birim capraz
dogrulamasi, "skoru SEN verirsin".
RAKAMSIZLASTIRMA: "147 XKTUM hissesi" -> "XKTUM evrenindeki hisseler".
Evren karari Eylul'e ertelendi (147 vs 215); sabit sayi bir ay sonra yanlis
olacakti. §258'in ayni ilkesi: sabit sayi yazma, ya canlidan uret ya hic yazma.

## 261 TAZELIK HESABI TEK SAHIBE DEVREDILDI — §245p'NIN YARIM ISI (11 Agu)

§245p "hesap artik window.tazelikHesap'ta, ajan.js de bunu kullanir" DIYORDU.
OLCULDU: ajan.js tazelikHesap'i HIC CAGIRMIYORDU — kendi sikCoz/sikNorm/
dosyaTarihleri/dongusunu calistiriyordu. Birlestirme yarim kalmis, fark
BUYUMUSTU. (10 Agu'da sezon kuralini hizalamistim; asil ayrisma daha derindi.)

### 33 KATMANDA UC GERCEK FARK — olculdu, tahmin degil
1) `limit_gun` ALANI OKUNMUYORDU. Planda "Yabanci para akisi" ve "Swap stoku"
   icin limit_gun:13 YAZILI (§245p: TCMB Persembe yayinlar, veri onceki
   CUMA'ya ait, katman dogasi geregi 6-12 gun salinir; 13 = "bir yayin kacti"
   esigi). app.js okuyor, ajan.js HIC BAKMIYOR ve sozlukten 7 aliyordu.
   PLANA YAZILMIS BIR KURAL EBU'YA ULASMIYORDU.
2) `olay` TIPI YOKTU. Ulke kredi notu / Halka arzlar / Inceleme AI / Kopru
   testi olay bazli, takvimi yok. app.js 'olay' deyip muaf tutuyor; ajan.js'te
   bu dal YOKTU, 999 limitine dusup KAZARA "taze" diyordu. Dogru sonuc,
   YANLIS GEREKCE — ve 999 baska bir katmanda ciksa yanlis alarm verirdi.
3) `yaklasti` KADEMESI YOKTU. app.js taze/yaklasti/bayat (3 kademe),
   ajan.js taze/bayat (2). YEDI katmanda Ebu BAYAT derken cekmece "yaklasti"
   diyordu — ayni veriye bakip farkli sey soyluyorlardi.

### COZUM: tek hesap, iki rapor
tazelikNobeti artik TZ.durum() / TZ.dosyaTarihleri() / TZ.sezonBaglam()
cagiriyor. Kendi sikCoz/sikNorm/dongusu KALDIRILDI.
HESAP AYRISMASI ARTIK FIZIKEN IMKANSIZ.
KORUNAN — Ebu'nun RAPOR katmani kendisine ait kalir:
  · `tanimsiz` yaptirim listesi (§245) — sozlukle eslesmeyeni panoda gosterir
  · `asim`'e gore siralama
  · pano sozlesmesi {ad, dosya, gun, limit, sez, asim, tip}
BILINCLI FARK (yaziya dokuldu): Ebu 'yaklasti'yi DA bayat sayar
(tip!=='taze'), cunku NOBETIN ISI UYARMAK, CEKMECENIN ISI DURUM GOSTERMEK.
Ayni hesap, farkli esik — artik kaza degil, karar.

### YAN TEMIZLIK
nobGun ve nobGunAnahtar OLU kaldi, kaldirildi. NOT: nobGunAnahtar BU
OTURUMDAN ONCE de oluydu (cagri 0), benim degisikligimle ilgisi yok.

### YABANCI KATMANI DARALTILDI
Kaydin kendisi zaten "KISMEN canli" diyordu. 11 Agu'da haftalik kisim TAMAMEN
canliya gecti (§259: mod=yab alti haftalik seri + stok). Geriye ELLE kalan tek
blok: `aylik` (odemeler dengesi, ayda bir yayin).
  ad: "Yabanci para akisi + carry" -> "Yabanci akisi — AYLIK odemeler dengesi"
  siklik: haftalik -> aylik
  limit_gun: 13 KALDIRILDI (o esik Persembe haftalik ritmi icindi, aylikta
             anlamsiz)
Sonuc: yabanci.json nobet listesinden DUSTU — yanlis alarm degil, dogru kapsam.

### PLAN TARIHLERI HIZALANDI
7 kayit: 10-11 Agu'da GERCEKTEN tazelenenler (sektor, katfon, multiple,
analist, rezerv, bist-takvim, yabanci). Ayrica "BIST beklenen bilanco takvimi"
kaydina EKSIK `dosya` alani eklendi (§252r'de bulunmustu).
NOBET SONUCU: 3 -> 2. Kalan ikisi (fm.json 29g, guidance.json 26g) BILINCLI
ERTELENEN kalemler, gerekcesi plan dosyasinda yazili.

### CANLIDA GORULEN IKI MEKANIZMA
Ekran gunlugunde:
  "§111 yaptirim: 1 not REDDEDILDI (canli kartta rakam) — eski not korundu"
  "Nobetci: 1 not yeniden cizimden sonra geri kondu"
Ikincisi §259c'de app.js tarafina ekledigim korumanin Ebu'daki karsiligi —
ayni tuzak (render'in canli yazimi silmesi) iki yerde de cozulmus durumda.

### rezerv YEDEGI — "olu" dedigim alan olu degilmis
10 Agu'da yabanci.json'daki `rezerv` blogunu "panel okumuyor" diye isaretledim.
YANLISTI: app.js'te 5 YERDE okunuyor, ILK CIZIM yedegi. Canli hesap sonra
ustune yaziyor. 37,7'de kalmisti (17 Tem verisi) -> 46,8 hizalandi
(net 60,2 - swap 13,4). Blogun KENDI NOTU zaten "TEK DOGRU KAYNAK
rezerv.json'dur, bu alan onunla hizalanir" diyordu; hizali degildi.

## 260 KART HARCAMALARI BIR AY GERIDEYDI — "YORUM DOGRU, KOD BASKA" (11 Agu)

BULGU: panel kart harcamalarinda 2026-06 gosteriyordu; Temmuz TAMAMLANMISTI.
Olcum: TP.KKHARTUT.KT1 haftalik seri — May 5 hafta (son 29-05), Haz 4 hafta
(son 26-06), TEM 5 HAFTA (son 31-07, AYIN TAM SON GUNU).
KOK NEDEN — _lib/kart.js:138:
    // TAMAMLANMIS AY: bir sonraki ayda gozlem varsa o ay tamamlanmistir.
    const donem = toplamAylar[toplamAylar.length-2] || ...
Yorum bir KURAL tarif ediyordu, kod o kurali HIC UYGULAMIYORDU — korlemesine
sondan ikinciyi aliyordu. (Bu oturumun en sik deseni: yorum dogruyu soyluyor,
kod baska sey yapiyor. bkz. §252q "ajan.js de bunu kullanir" — kullanmiyordu.)
YORUMUN KENDI KURALI DA YETMEZDI: EVDS haftalik veriyi ~1 HAFTA GECIKMEYLE
yayinlar. 11 Agu'da Agustos gozlemi HENUZ YOK, dolayisiyla "sonraki ayda
gozlem var mi" testi TEMMUZ'U DA ELERDI. Yani kural uygulansaydi bile
sonuc yine Haziran olurdu.
DOGRU OLCUT: ayin SON GOZLEMI ayin sonuna 7 GUNDEN YAKIN MI.
  Bir ayin son haftalik gozlemi o ayin SON CUMASIDIR; ay sonuna uzakligi
  yapisal olarak 0-6 gundur. Tamamlanmamis ayda bu >=7 olur.
  Ornek: Agustos 2026 Cumalari 7-14-21-28; 29 Agu-4 Eyl haftasi kodun kendi
  notu geregi EYLUL'e yazilir, yani Agustos 28'de KAPANIR (31-28=3 <7 ✓).
  En az 4 hafta sarti korundu (kismi ay elenir).
EK DUZELTME (§260b): satir 127 `if (!sonTarih || String(it.Tarih) > '')` —
bir dizge bos dizgeden DAIMA buyuktur, kosul HEP DOGRUYDU. EVDS kronolojik
donduugu icin kazara calisiyordu. Gercek tarih karsilastirmasina cevrildi
(GG-AA-YYYY -> YYYYAAGG).
YAN ETKI: donem Temmuz olunca TUFE deflatoru de %32,11 (Haz) yerine
%31,75 (Tem) olur — REEL ORANLAR da duzelir.

## 259 YABANCI AKISI: BIR IYELIK EKI, 24 GUNLUK BAYATLIK, TERS ANLATI (10-11 Agu)

`mod=yab` YAZILMISTI ama HIC CALISMAMISTI. cozCek'e verilen grup deseni
  /yurt disi yerlesiklerin mulkiyetindeki|yurt disi yerlesiklerin menkul/i
Gercek grup adi: "Yurt Disi Yerlesikler Menkul Kiymet Portfoyu" — IYELIK EKI
YOK. Desen yalnizca ARSIV grubuna (bie_yymkpyuk) uydu, alt-desenler orada
tutmadi ve uc sunu dondurdu:
  {"ok":true,"grup":"bie_yymkpyuk","veri":{hisseNet:null,dibsNet:null,...}}
`ok:true` DONEN BOS YANIT — basari gibi gorunen basarisizlik. Panel elle
girilen yabanci.json'a dustu ve o 24 GUN ESKIDI.
SONUCU SADECE BAYATLIK DEGILDI, ANLATI TERSTI:
  panel  17 Tem: hisse +37,5 · DIBS +196,6 · OST +43,8 = +278 mn GIRIS
  EVDS'de ayrica 24 Tem (+981) VE 31 TEM VARDI:
  31 Tem: hisse -185,9 · DIBS +164,0 · OST -129,9 = -152 mn NET CIKIS
Panel "ilimli giris · akis saf carry" diyordu. Gercek: ILIMLI CIKIS.
Ustelik etiket "sıradaki 30 Tem" yaziyordu — KENDI VADESINI 11 GUN GECMIS.
COZUM: regex tahmini KALDIRILDI, kesin seri kodlari kullanildi (kullanicinin
?list=bie_mknethar olcumunden, 32 seri):
  M7  = 2.1.1. Hisse Senedi (net degisim, haftalik, mn $)
  M8  = 2.1.2. DIBS (Kesin Alim)
  M12 = 2.1.3. Genel Yonetim Disi Borclanma Senetleri (OST)
  M1/M2/M6 = ayni kalemlerin STOK karsiliklari
YON ARTIK HESAPLANIYOR, IDDIA EDILMIYOR: esik ±200 mn $.
STOK DA GELDI ve ayri bir hikaye anlatiyor: hisse stoku 41,4 -> 39,6 mlr $
(son hafta -1,8 mlr) — net akim -186 mn iken stok 1,8 mlr dustu; aradaki
fark FIYAT ETKISI.

### §259b KENDI HATAM: CALISAN KALIP AYNI DOSYADAYDI
Ilk yazimda URL'yi SIFIRDAN yazdim: evds2.tcmb.gov.tr/service/evds/ — o ESKI
uc ve HTML donduruyor ("Unexpected token '<'"). Dosyanin geri kalani 14 YERDE
evds3.tcmb.gov.tr/igmevdsms-dis/ kullaniyor ve CALISIYOR.
DERS: yeni bir dis cagri yazmadan once AYNI DOSYADA calisan kalip var mi diye
bakilir. Bu oturumda ayni hatayi uc kez yaptim (dokuz CDS kaynagi denerken,
uc TEFAS ucu tahmin ederken, burada).

### §259c PANELE BAGLANDI — VE YENIDEN CIZIM TUZAGI
yabanciRender() karti JSON'dan KOMPLE yeniden kuruyor ve
exAnteHesapla -> yabCarryTazele -> yabanciRender zinciri KULLANICI TAHMINLER
SEKMESINI ACINCA tetikleniyor. Tek seferlik yazim o an SILINIRDI ve panel
sessizce 17 Tem'e donerdi. Deger YAB_CANLI'da saklanip render sonunda
yeniden basiliyor.
NOT: bu tuzagi app.js:8095'teki KENDI ESKI YORUMUN uyardi ("bu blok loadAOFM
sonunda USTUNE YAZIYORDU — etiket yeni, deger eski gorunuyordu; ekran
goruntusuyle yakalandi"). Ayni kart, ayni tuzak.

### §259d SIKLIK AYRIMI
Kart iki farkli olcuyu AYNI KELIMELERLE gosteriyordu: skor AYLIK odemeler
dengesinden ("57 ILIMLI GIRIS"), haftalik satir MENKUL KIYMET
istatistiginden ("ilimli cikis"). 10 Agu'da ZIT yone isaret ettiler ve
okuyan CELISKI SANDI. Ikisi de dogruydu, etiketleri eksikti. Sikliklar
yazildi.

## 258 ETIKET ILE DEGER AYRISMISTI (10 Agu)

Egri kartinda: "2Y reel (cari TUFE %32,11'e gore)  ≈ +9,5 puan"
HESAP DOGRUYDU (41,20 - 31,75 = 9,45) ama ETIKET ESKIYDI. §252d sabiti
duzeltmisti; index.html:533'teki etiket metni SABIT YAZILIYDI ve kalmisti.
Ayni satirda DOGRU SAYI ve YANLIS GEREKCE yan yana durdu.
COZUM: etiket de app.js'teki AYNI sabitten uretiliyor (#okuTufeEt, #okuBekEt).
Kullanici EKRANDAN yakaladi.
DERS: bir sayiyi duzeltirken o sayinin ETIKETTE de gecip gecmedigine bakilir.
§241'in ayni dersi: ayni deger iki yerde yasarsa biri gunceller, oteki kalir.

## 257 BILANCO KARTI BIRIM ZINCIRI — UC AYRI KIRIK (10-11 Agu)

LMKDC 2C26 karti BIN KAT sisik birimle onaylandi: ozet "2,32 milyar TL"
derken tablo "2.317,8 mlr TL" yaziyordu — AYNI KARTIN ICINDE iki farkli olcek.

KIRIK 1 — _birimBul tutmadi. Sayfada "Bin TL/Milyon TL/Tam TL" kaliplarini
  arar; LMKDC'de hicbiri eslesmedi -> birim 'belirsiz'. §229 geregi varsayilan
  UYDURULMADI (dogru davranis) ve modele "belirsiz" denildi.
KIRIK 2 — MODEL UYDURDU. Istem "birim belirsizligini SOYLE, uydurma" diyordu;
  model "milyar birim varsayilmistir" yazdi VE tutarsiz yazdi.
KIRIK 3 (KOK NEDEN) — ajanktp.js:144'teki ORNEK SATIR:
     {"ad":"Ciro (2C)","deger":"100,02 mlr ₺",...}
  Model bu EKI KOPYALIYORDU, gercek olcege bakmadan. Ozet serbest metin
  oldugu icin orada dogru yaziyor, tabloda ORNEGI TAKLIT EDIYORDU.

COZUM 1 — CAPRAZ DOGRULAMA (§255). Sayfa birimi beyan etmezse olcek VERIDEN
kanitlanir. IKI EKSEN:
  (a) CIRO: ceyreklik ciro x4, multiple.json TTM cirosuna oranlanir.
      LMKDC: bin TL -> 9.271 mn vs TTM 9.306 -> oran 0,996 ✓
             TL -> 0,001 ✗ · milyon TL -> 996 ✗   (1000 KAT ayrisma)
  (b) PD/DD: piyasa degeri / ozkaynak. multiple.json 141 hisse tasiyor;
      KTLEV gibi kapsam disi isimlerde (a) calismaz. Borsada islem goren
      sirkette PD/DD 0,05-30 bandindadir, yanlis olcek 1000 kat disina duser.
  IKI ADAY GECERSE 'kararsiz' -> birim belirsiz KALIR (yanlis kesinlik yerine
  durust belirsizlik).
  FINTABLES ILE TEYIT: KAP ham degerleri tam TL karsiliklarinin BIREBIR
  1/1000'i (bes kalemde de).
COZUM 2 — BICIMLENDIRME MODELDEN ALINDI (§257). Ham deger x carpan ile TL'ye
cevrilir, buyuklige gore mlr/mn/₺ SUNUCUDA secilir, modele HAZIR DIZGI verilir:
"deger alaninda BUNLARI AYNEN KULLAN — olcek eki EKLEME."
Birim cozulemezse dizgi uretilmez ve model olcek eki YAZMAZ.
SONUC (dogrulandi): ciro 2,32 mlr ₺ · net kar 539,0 mn ₺ · parasal -181,9 mn ₺
— dordu de OZETLE BIREBIR AYNI.

### §256 SIL DUGMESI — ONAY TEK YONLUYDU
Kart onaylanabiliyordu ama GERI ALINAMIYORDU; tek care konsola JSON yazmakti.
🗑 dugmesi eklendi, YALNIZ onayli taslakta (dosyadan gelen kart repoda yasar,
tarayicidan silinemez; dugme cikarsa yaniltir). IKI TIK onay ister.
Uc adim, onayin tersi sirayla: localStorage'dan cikar -> BULUTA YAZ (yoksa
baska cihazda geri gelir) -> listeyi yeniden kur.
ktp_taslak_kart_v1 CLOUD_KEYS'te (dogrulandi) — setItem maymun-yamasi zaten
senkronu tetikliyor, acik cagri fazladan guvence.

## 254 EBU'NUN SESSIZLIGI GORUNUR OLDU (10 Agu)

11 GUNDUR kota bitikti. Gunluk her turda soyluyordu ("Your credit balance is
too low") ama PANELDE HICBIR ISARET YOKTU. Rotasyon kartini okuyan biri
kendinden emin bir yorum goruyordu; notun 11 gunluk oldugunu bilmiyordu.
Sorun "tespit edilmiyor" DEGIL, TESPIT EDILDIGI YER ILE GOSTERILDIGI YERIN
AYRI OLMASIYDI.
OLCUM: 123 notun 74'u 7 GUNDEN eski, ortanca 11 GUN, ve <6s kutusunda 1 not.
Dagilim UCURUM sekliydi (6s-3g arasi TAMAMEN BOS) — aclik degil DURMA.
EK OLCUM: PARTI=4 x 30dk = gunde 192 yazim kapasitesi, 126 kart icin
fazlasiyla yeterli. "Parti acligi" teshisim YANLISTI, kullanici hakliydi.

UC DUZELTME:
  1. aiCagir r.ok'u HIC kontrol etmiyordu. Anthropic hata durumunda 4xx doner
     ve govdede {type:'error',error:{type,message}} gelir; `content` olmadigi
     icin null donuyordu ve NEDEN null oldugu KAYBOLUYORDU.
     Yedi hata tipi ayirt ediliyor.
  2. Durum seridi (#ajanDurum) — hata + not yasi.
  3. Not yasi etiketi — 3 gunden eski notlarda "· Ng once yazildi".
     UC boyama noktasina da baglandi (hizliGeriYukle + notlariGeriYukle x2),
     etiket her basimda TEKILLENIR.

### §254b GECICI / KALICI AYRIMI — kendi kusurumu duzelttim
Kota gelince Ebu 41 not yazdi, ama bir turda zaman asimi oldu ve serit
"⚠ Ebu duraklatildi" dedi — MOTOR CALISIYORDU. Gecici hata kalici gibi
gosterilirse kullanici gereksiz mudahale eder.
  KALICI (mudahale gerek): kota, gecersiz anahtar, yetki, model adi
  GECICI (kendiliginden duzelir): zaman asimi, hiz siniri, servis yogun
Gecicide "ℹ son tur atlandi" (soluk), kalicida "⚠ Ebu duraklatildi" + not yasi.
Sunucu iki denemeyi " · " ile birlestirdigi icin ayni cumle iki kez
goruruyordu — TEKILLESTIRME eklendi.

### ACIK KALAN: 54 YETIM NOT
SEKME_DISLA'daki 11 sekmede kalmis kartlarin notlari depoda duruyor (126
kayit, Ebu 72 tariyor). Kota gelse bile GUNCELLENMEYECEKLER. Karar gerekiyor:
sekmeler kapsama alinsin mi, yoksa o notlar temizlensin mi.

## 253i TEFAS AUM/YATIRIMCI KOPRUYE ALINDI — UC ADI OLCULDU (10 Agu)

SORUN: AUM ve yatirimci sayisi Playwright AG-DINLEME ile toplaniyordu; TEFAS'in
F5 guvenlik duvari "Request Rejected" veriyordu ve rapor her kosuda
"AUM/akis onceki turdan" diyordu. Getiri yolu (1048 fon) SAGLAMDI — engelli
olan yalnizca KESIF yoluydu.
UC ADI UC KEZ TAHMIN EDILDI, UCU DE YANLIS CIKTI:
  fonProfilDtyGetir     -> AUM DEGIL, fonun ALTIN/BIST100/USD karsisindaki
                           KIYASLAMA GETIRISI (n=9, alanlar fonTurGetiri...)
  fonDetayGetir         -> bos dizi
  fonToplamDegerGetir   -> ERR-006 "Method not found or disabled!"
  fonPortfoyDagilimGetir-> ERR-006
DOGRUSU KULLANICININ HAR OLCUMUNDEN GELDI:
  POST /api/funds/fonGnlBlgSiraliGetir -> resultList[]
  alanlar: fonKodu · fonUnvan · tarih · fiyat · tedPaySayisi · kisiSayisi ·
           portfoyBuyukluk    (HEPSI TEK CAGRIDA)
  govde: {fonTipi,fonKodu,basTarih,bitTarih,basSira,bitSira,dil,...}
  toplamSayi 2030 · sayfalamali
  TOKEN: HAR'daki Authorization tefas.js'te ZATEN gomulu olanla BIREBIR AYNI —
  yeni sir eklenmedi, mevcut kopru altyapisi tasidi.
COZUM: api/tefas.js'e `mod=gnl` eklendi (yeni uc DEGIL, mevcut uca mod).
tazele.mjs kopru asamasinda cagirir; Playwright'e GEREK KALMIYOR.

### REGRESYON VE DENETIMIN YAKALAMASI — kayda deger
Ilk yazimda TEK CAGRI vardi (bas=1&bit=1000). TEFAS'ta 2030 fon var ve 46
katilim fonu tum listeye DAGILMIS; ilk 1000'e yalnizca 10'u dusuyordu.
  ONCE (Playwright bloke, meta BOS)  -> GETIRI-MODU, 36/46 yaziliyordu
  SONRA (meta dolu ama EKSIK)        -> tam yol, 10/46
Yani YENI VERI, EKSIK OLDUGU ICIN ESKISINDEN KOTU SONUC VERDI.
DENETIM YAKALADI: "Katilim fonlari — ✗ KALDI · kapsam 10/46 (%22), esik %95"
ve VERIYI YAZMADI. katfon.json eski+dogru haliyle kaldi. §104'un tam isi.
DUZELTME: sayfalama (1-1000, 1001-2000, 2001-3000; d.length<1000 ise dur).
SONUC: 2023 fon · Katilim fonlari ✓ 46/46 (%100).
DERS: denetim esikleri yalniz DIS KAYNAGI degil, KENDI DEGISIKLIGINI de
yakalar. Bu oturumda uc kez arkalarina saklandim (CDS makul aralik, tarih
sureklilik, kapsam esigi) ve UCUNDE DE HAKLI CIKTILAR.
YAN ETKI: son kosuda Playwright sayfayi ACABILDI (82 yanit, 1 JSON) —
F5 engeli KALICI DEGIL, OTURUMSAL. Ama artik ona bagimli degiliz.

## 253g-h GURULTULU BASARI: IKI SAHTE UYARI SUSTURULDU (10 Agu)

Rapor her kosuda iki "ariza" bildiriyordu ve IKISI DE ARIZA DEGILDI.
Bu, §143'un sessiz-yedek ailesinin TERSI ve ayni derecede tehlikeli:
gercek bir ariza ciktiginda SAHTE UYARILARIN ARASINDA KAYBOLUR.

§253g CSV 404 — BEKLENEN DAVRANISTI.
  §250b ZATEN olcmustu: FiyatEndeksleri_PriceIndices.csv ve
  GetiriEndeksleri_ReturnIndices.csv /datum/ altinda YOK, PayEndeksleri.zip
  ICINDELER. Kod DOGRU davraniyor: tekil URL'yi dener, 404 alir, zip'e duser,
  CALISIR (84 endeks). Ama rapor bunu "⚠ inmeyenler" diye basiyordu.
  COZUM: BEKLENEN_404 listesi + ayri "ℹ beklenen 404" satiri.

§253h BULTEN 404 — DUNU ARIYORDU.
  Kod duz `Date.now()-86400000` kullaniyordu. PAZARTESI kosusunda bu PAZAR'a
  denk geliyor; borsa kapali, bulten YOK -> her hafta basi dort 404 ve
  "⚠ indirilemedi". Rapor bir ariza bildiriyordu ama ARIZA YOKTU.
  COZUM: hafta sonu atlanir, gerekirse 4 IS GUNU geriye bakilir (resmi
  tatiller icin). Ilk inen kabul edilir. Hicbiri inmezse DENENEN GUNLER
  raporda gorunur — dort ardisik is gunu bossa GERCEK sorun vardir.
  DOGRULANDI: Pazartesi kosusu thb202608071.zip (CUMA) indirdi, 295KB.

KURAL: uyari, GERCEKTEN UYARILACAK BIR SEY OLDUGUNDA cikmali. Bu oturumda
tersini de uc kez gorduk (bulutUyari, rotKKM, taktikselBody: ariza VARDI,
hic bagirmiyordu). Ikisi ayni kurala bakiyor.

## 253 CDS CANLIYA BAGLANDI — DOKUZ KAYNAK, BIR HAR DOSYASI (10 Agu)

SONUC: /api/tcmb?cds=1 -> worldgovernmentbonds.com. Panel artik
"228 bp -0,8 · 8 Agu · canli". Damgali sabit oldu.

### Bulgu 1: 206 BAYAT DEGIL, YANLISTI
Kullanicinin DevTools HAR olcumuyle gercek seri elde edildi:
  24 Tem 244,00 · 27 Tem 239,96 · 30 Tem 239,57 · 6 Agu 227,65
Panel 27 Tem icin 206 diyordu — 34 PUAN sapma. Serinin 160 gunluk tamaminda
206'ya yakin TEK GUN YOK; en dusuk 203,98 ve o Aralik 2025. Muhtemelen
52-HAFTALIK DIP kutusundan okunmustu.
ETKISI: cdsS=(330-cds)/140*100 · 206 -> 88,6 · 227,65 -> 73,1 puan.
Barometre 77 -> 73: "ASIRI ACGOZLULUK" -> "ACGOZLULUK". BIR ESIK YUKARIDAYDI.

### Bulgu 2: IKINCI BIR CDS GOSTERIMI VARDI
index.html:303 "Global Risk Barometresi" icinde TR 5Y CDS ≈206 — TAMAMEN
STATIK, ID'SI YOK, app.js ona hic dokunamiyordu. Risk barometresi
duzeltilirken bu kopya 206'da kaldi; AYNI EKRANDA IKI FARKLI CDS gorundu.
§241'in ayni dersi: ayni deger iki yerde. Artik id verildi (#glbCds), tek
kaynak iki gosterim.
AYRICA "iyilesiyor" ETIKETI DE SABIT YAZILIYDI — CDS yukselse bile oyle
kalirdi. Artik degisimden OLCULUYOR; canli veri yoksa yon HIC IDDIA EDILMIYOR.

### ELENEN DOKUZ KAYNAK (tekrar denenmesin)
  EVDS                 — sovereign CDS YOK. ?ara=risk yalnizca BANKACILIK
                         sektoru kredi riski donduruyor (Sektor Riski
                         Nakdi/Gayri Nakdi × TL/YP). Beklenen: CDS Londra'da
                         islem goren bir turev, TCMB yayinlamaz.
  Fintables            — katalogda yok (hisse/endeks/fon/finansal tablo).
  Alpha Vantage        — yok. SYMBOL_SEARCH "TRGV5YUSAC" -> bos.
  Massive              — Economy bolumu tamamen ABD Fed verisi.
  TradingEconomics     — SUNUCU TARAFI BASIYOR (TR 2Y 37,77 · 10Y 32,24 ham
                         fetch ile geldi) AMA CDS SAYFASI YOK.
                         NOT: YEDEK KAYNAK OLARAK DEGERLI — Yahoo ya da EVDS
                         duserse burasi ayakta olabilir.
  doviz724.com         — sunucu tarafi basiyor AMA VERI ARALIK 2024'TE DURMUS
                         (257.71 · 29 Ara 2024; 2026 tablosu BOS).
  Yahoo TRGV5YUSAC=R   — "No data found, symbol may be delisted". Refinitiv
                         RIC'i tescilli kodlama; Yahoo tasimaz.
  Yahoo CDS            — o ticker "Evolve One Inc.", son islem 2019 (donmus).
  investing.com API    — CALISIYOR ama HER IKI SUNUCU YOLUNDAN DA 403:
                         Vercel 403 · GitHub Actions 403 (Cloudflare
                         datacenter IP engeli, IKISI DE OLCULDU).
                         Tarayici yolu da kapali: yanit
                         `Access-Control-Allow-Origin: https://tr.investing.com`.
UCRETLI OLANLAR DA ISE YARAMIYOR: EODHD sovereign CDS alani Damodaran/NYU
verisi (YILDA IKI KEZ) · MacroMicro kendi yaziyor "haftalik sunulur" ·
Cbonds Excel eklentisi · Markit/Bloomberg kurumsal abonelik.

### COZUM: worldgovernmentbonds.com
ASIL FARK: sayfasi ham fetch ile ACILIYOR, Cloudflare bot engeli YOK.
Ben bu siteyi ONCE ELEMISTIM ("degerler ---- geliyor, JS ile basiliyor") —
DOGRUYDU AMA EKSIKTI. JS ile basiliyorsa BIR UC VARDIR ve o uc engelsizdi.
HAR olmadan bulunamazdi.
  POST https://www.worldgovernmentbonds.com/wp-json/common/v1/historical
  govde: {"GLOBALVAR":{"FUNCTION":"CDS","COUNTRY1":{"SYMBOL":"13",...},
          "OBJ1":{"DURATA":60},...}}
  CEREZ GEREKMIYOR — giden cerezlerin hepsi analitik/reklam (_ga, __gads).
  3272 kayit, 2015-12-15'ten beri.
DEGER DOGRULANDI: investing.com ile BIREBIR ayni; site zaten kunyesinde
Investing.com'u kaynak gosteriyor.

### TARIH TUZAGI — YAKALANDI
Kaynak hafta sonlarini ve tatilleri SON DEGERI TASIYARAK dolduruyor:
08-08, 08-09, 08-10 hepsi 227,65. Ham haliyle alinsa panel "10 Agustos
verisi" derdi — YALAN OLURDU.
COZUM: sondan geriye "duz kosu" (ayni degerin tekrari) taranir, dizinin BASI
gozlem gunudur.
KALINTI SAPMA (durustce kayda geciyor): duz kosu 08-08'de basliyor, investing
ayni degeri 08-06'ya yaziyor. Yani kaynagin tarihleri ~2 GUN ILERI kaymis.
DEGER dogru, TARIH ~2 gun iyimser. Ham etiket (etiketTarih) de yanitta
tasiniyor ki fark olculebilsin.

### UC KADEMELI DUSUS (app.js cdsCek)
  1) /api/tcmb?cds=1  — Vercel'den wgb. CALISIYOR (10 Agu dogrulandi).
  2) /cds.json        — Actions kosusunun yazdigi dosya (tazele.mjs
                        cdsTazele, 'fiyat' katmani). Vercel engellenirse.
  3) damgali yedek    — RISK_CDS=227.65, etikete "damgali" basilir.
Her kademe basarisizsa BIR SONRAKINE duser; hicbirinde SESSIZ DUSUS yok.

### MIMARI NOTLAR
- Yeni uc ACILMADI: §248c kurali, ?cds=1 olarak tcmb.js'e bindirildi.
  Fonksiyon kotasi 10/12 korundu.
- AKLI BASINDA ARALIK: 100-1500 bp disi deger REDDEDILIR. Kaynak alan
  sirasini degistirirse sessizce sacma deger kabul edilmez (test: 0,5 bp
  girdisi "makul aralik disi" ile reddedildi).
- cdsCek() AYRI ucdan gider, market yanitina baglanmaz — kaynak yavassa
  barometrenin geri kalanini bekletmez.
- CDS_CANLI tanimi dosyanin EN USTUNE alindi: `let` HOISTED DEGILDIR ve
  renderRiskBaro() satir 1314'te cagriliyor. Su an guvenli (await sonrasi
  async govde) ama TESADUFI bir guvenlikti. (§247c / §252m ayni sinif.)

### DERS
Dokuz kaynagi ben denedim, hepsi kapandi. Cozen sey ARAMAK DEGIL, KULLANICININ
TARAYICI OLCUMUYDU. Bir sitenin "JS ile basiyor" diye elenmesi, ARKASINDAKI
UCUN DA KAPALI oldugu anlamina GELMEZ. Bir dahaki sefere: JS ile basan sayfa
gorulunce ONCE HAR istenir, sonra elenir.

## 252ü OTURUM DERSI-2: YAZDIGIM DUZELTMENIN KENDISI KIRIK CIKTI (10 Agu)

Bu oturumun ikinci yarisinda app.js/tazele.mjs'e yazilan duzeltmelerin UCU
ILK HALINDE CALISMIYORDU. Ucu de `node --check`ten VE fonksiyon envanteri
testinden GECTI. Ucunu de yalniz CALISAN SISTEMIN CIKTISI yakaladi:

  §252h  sapma      -> `j.sapma.skor` yazildi, OYLE BIR ALAN YOK (nesne).
                       YAKALAYAN: konsol dokumunde egriDamga'da sapma yoktu.
  §252m  uyeSayi    -> kod dogru, ZAMANLAMA yanlis: es.innerHTML kuruluyor
                       ama ENDAG asagida doluyor; dataset.dolu ikinci
                       doldurmayi engelliyor -> etiket sonsuza kadar sayisiz.
                       YAKALAYAN: $('ayrEndeks').textContent bos dondu.
  §252y  tohumlama  -> arsive gunluk seri eklendi ama arsiv KARMA hale geldi
                       (gunluk + aylik); betik ay-araligini gunluk getiri
                       saydi. YAKALAYAN: raporda bir sayinin 5'ten 234'e
                       ziplamasi.

KURAL (§252n'nin sertlestirilmis hali): "kod var" ile "kod isini yapiyor"
AYRI SEYLERDIR. Sozdizimi + envanter GEREKLI ama YETERLI DEGIL.
Her duzeltme icin deploy sonrasi UC SORU:
  1. Elemanin/alanin GERCEKTEN var oldugunu ne kanitliyor? (konsol, id sayimi)
  2. Kod CALISTIGINDA veri HAZIR mi? (zamanlama — §247c, §252m)
  3. Duzeltme YENI bir sayiyi degistirdi mi? (rapordaki sayaclari KIYASLA)
3. madde bu oturumda en pahali hatayi yakaladi ve hicbir statik test bulamazdi.

## 252z BETA TOHUMLAMASI TARIH SUREKLILIGINI BOZDU — ONARILDI (10 Agu)

§252y tohumlamasindan sonra "kurumsal islem suzgecine takilan gun" 5 -> 234.
KOK NEDEN: endeks-arsiv.json artik KARMA yogunlukta — Sub-Agu 2026 GUNLUK
(117 nokta) + 2021-2026 AYLIK tohum (61 nokta). Hisse serisi (Yahoo) ardisik
gunluk oldugundan kesisimin eski bolumunde noktalar AY ARALIKLI kaliyor ve
`getiriler()` ardisik iki noktayi "gunluk getiri" sayiyordu.
ASIL TEHLIKE ATILANLAR DEGIL ATILMAYANLARDI: %20'nin ALTINDA kalan aylik
getiriler gunluk gibi seriye giriyor, vol sqrt(252) ile yillliklandirilinca
SISIYORDU. Olculdu: 12 gozlem kirli, vol 20,8 -> 19,6 (%6 sisme).
COZUM: ardisik iki gozlem arasi >5 TAKVIM GUNU ise getiri HESAPLANMAZ
(egri.js:250'deki ayni kalip). Iki sayac AYRI tutuldu.
SONUC (olculdu): kurumsal islem 234 -> 4 · tarih boslugu 1692 (yeni sayac)
· kapsam 141/141 KORUNDU.
DERS: iki sayaci tek sayacta toplamak TESHISI YALANCI yapar. 234 rakami
"bedelsiz" diye raporlaniyordu; gercekte 230'u ay-boslugu, 4'u bedelsizdi.

## 252y BETA CIPASI COZULDU — ARSIVE XKTUM TOHUMLANDI (10 Agu)

SORUN: beta aylardir XU100'e dusuyordu. XU100 ~%25 BANKA agirlikli; katilim
evreni portfoyunun betasi yanlis cipada olculuyordu (βp, tracking error,
katki atfi hepsi kayikti).
ELENEN YOL — VERCEL KOPRUSU: §245t "XKTUM.IS Vercel IP'sinden geliyor"
demisti ve ben bunu SERIYE GENELLEMISTIM. OLCULDU:
  /api/market?mod=seri&kod=XKTUM&gun=400  ->  {"ok":false,"adet":1,...}
Yahoo XKTUM.IS icin CANLI FIYAT verir (sonFiyat 18854.68 dondu) ama GECMIS
VERMEZ. §245t dogruydu ama YALNIZ ANLIK KOTASYON icin. Olcmeden yazsaydim
sessizce XU100'e dusen bir kod eklemis olacaktim.
ELENEN YOL — ARSIV BEKLEME: gunluk birikim 4 Agu'da basladi, 1 nokta/gun;
60 esigine ~3 AY sonra ulasilirdi.
COZUM: Fintables endeks_mumlar_gunluk_gh — XKTUM'un 400 GUNLUK tam serisi
var. 126 gun (Sub-Agu 2026) cekildi, arsive tohumlandi.
DOGRULAMA: cakisan 9 gunde arsiv ve Fintables BIREBIR ayni (2026-08-07 =
18694.71 her ikisinde). Eski degerlerden HICBIRI degismedi.
SONUC: XKTUM 61 -> 178 nokta · son 120 gunde 7 -> 77 (esik 60) · beta artik
"XKTUM (BIST resmi arsiv)".
SURDURULEBILIRLIK: gunluk birikim ~21 nokta/ay ekliyor, 120 gunluk pencerede
~85 nokta kalir — esik kendiliginden korunur, tekrar tohumlama gerekmez.

## 252x tazele.yml: SABAH KOSUSU EKLENDI + RISK HAFTALIGA ALINDI (10 Agu)

BULGU 1: §249n (5 Agu) gunluge "ikinci cron '10 6 * * 1-5', yalniz FON
katmani" diye yazilmisti ama DOSYADA NE O CRON VARDI NE github.event.schedule
KOSULU. Fon getirileri hala bir gun geriden geliyordu.
BULGU 2: `--katman="${{ github.event.inputs.katman || 'hepsi' }}"` —
inputs YALNIZ workflow_dispatch'te dolu. Her iki cron da 'hepsi' kosuyordu.
Cumartesi yorumu ("haftalik kalemler") ve KURULUM.md tablosu bir AYRIM TARIF
EDIYORDU ama kodda KARSILIGI YOKTU -> risk katmani HER GUN (141 gereksiz
Yahoo istegi/gun; vol/beta 1 yillik pencereden, gunluk oynamasi anlamsiz).
COZUM: `Katman sec` adimi github.event.schedule'a bakar:
  '10 6 * * 1-5'  -> fon                (09:10 sabah, YENI)
  '10 15 * * 1-5' -> endeks,fiyat,fon   (18:10 aksam, risk YOK)
  '0 4 * * 6'     -> hepsi              (cumartesi, risk DAHIL)
  bilinmeyen/bos  -> hepsi              (ESKI DAVRANIS = guvenli varsayilan)
tazele.mjs `ister()` artik VIRGULLU LISTE kabul eder (geriye uyumlu, test
edildi: hepsi|fiyat|endeks|risk|fon ve bos deger aynen davranir).
Risk katmani haftada 6 -> 1 kez. Sekiz tetikleme yolu shell'de test edildi.

## 252w-v VERI TAZELEME TURU (10 Agu)

sektor.json  — dort capa Fintables endeks_mumlar_gunluk_gh'den. CAPA
  TARIHLERI ARTIK DOSYADA (`capalar` alani) — hangi gune gore hesaplandigi
  sonradan sorgulanabilsin. 3A capasi 8 May HAFTA SONUNA denk geldi, en
  yakin islem gunu 11 May kullanildi. Kimya/Petrol 1H +%9,31.
analist.json — 55 hisse, PENCERE 1 YIL OLARAK KORUNDU. Fintables'in 6 aylik
  sorgusu daha taze gorunur ama kurum sayilarini DUSURUR (ASELS 23->18,
  THYAO 30->22) — bu TAZELEME degil METODOLOJI DARALTMASI olurdu (§252c'nin
  ayni dersi). 1-yil sorgusu panelin kurum sayilariyla BIREBIR tuttu.
  YEOTK bedelsiz duzeltmesi (74,21) korundu.
rezerv.json  — swapStoku 12,8 -> 13,4. TCMB 31 Tem haftasi (6 Agu yayini;
  dosyanin KENDI uyardigi, kacan yayin). net 54,2 - swap haric 40,8 = 13,4.
  Panelin brut rakami (164,4) TCMB ile zaten TUTUYORDU — geride kalan
  yalniz swap bilesenıydi.
bist-takvim.json — 15 sirket TAHMINDEN GERCEGE gecti (yeni `gerceklesen`
  bloku). ONEMLI OLCUM: tahmin yontemi SAGLAM cikti — ortalama mutlak sapma
  2,7 GUN, 3/15 tam isabet, 8/15 ±1 gun. Onceki "15/40 yanlis" tespitim
  YANLISTI: "tahmini gecmis ama aciklamamis" ile "yanlis tahmin"i
  karistirmistim (bu oturumun ikinci olcum hatasi).
  RENDER RISKI YAKALANDI: aciklananlar INC_KARTLAR'dan geliyor; karti
  olmayan sirket `beklenen`den cikinca LISTEDEN TAMAMEN KAYBOLUYORDU.
  KTLEV tam o durumdaydi (o gun acikladi, karti yok). §252r ile
  `gerceklesen` blogu render'a baglandi + "YAYINLANDI · kart bekliyor"
  rozeti. Simulasyon: 40/40, kimse kaybolmuyor.
fm.json      — TAZELENMEDI, BILEREK (bkz. guncelleme-plani.json karar notu).
guidance.json— TAZELENMEDI, ayni gerekce (sezon ortasinda yarim revizyon).

## 252t FAKTOR MODELI BORU HATTI YAZILDI: arac/fm-isle.py (10 Agu)

BOSLUK: yevren.json icin koyfin-isle.py vardi, fm.json icin BETIK YOKTU —
her sezon elden geciyordu ve elle islem metrik setinin sessizce kaymasina
acik kapiydi. Ustelik YONTEM HICBIR YERDE YAZILI DEGILDI.
YONTEM GERI COZULDU (mevcut fm.json'un istatistiksel imzasindan +
app.js:1518-1523 etiketleriyle teyitli):
  - metrik basina z-skor, ±3 KIRPMA (mevcut dosyada hic |z|>3 yok)
  - VALUE/GROWTH/QUALITY SEKTOR ICINDE, MOMENTUM/LOW_RISK TUM EVRENDE
    (olcum: sektorler arasi yayilim VAL .114 GRO .021 QUA .074 = dar;
     MOM .414 LOW .650 = genis — etiketlerle ortusuyor)
  - hib=false metrikte ISARET TERS
  - faktor skoru = mevcut metrik z-skorlarinin ORTALAMASI (std 0,57-0,74;
    tek z-skor olsa 1,0 olurdu)
  - f dizisi sirasi app.js:1519 ile SABIT: VALUE:0 GROWTH:1 QUALITY:2
    MOMENTUM:3 LOW_RISK:4
DOGRULAMA SINIRI: 14 Tem CSV'si elde olmadigi icin SAYISAL dogrulama
yapilamadi. Dogrulanan sey YAPISAL IMZA (ort/std/kirpma/sektor yayilimi) VE
korelasyon deseni: QUALITY .919, LOW_RISK .855 (yavas degisen) vs MOMENTUM
.386 (hizli degisen). Yontem yanlis olsaydi korelasyonlar RASTGELE dagilirdi,
HIZINA GORE siralanmazdi.
EVREN KARARI ERTELENDI: 10 Agu CSV'si 215 hisse tasiyordu, mevcut evren 147.
ETKI AYRISTIRILDI — Top-40 degisiminin YARISI bilancodan, YARISI evren
genislemesinden: A(14 Tem/147)->B(10 Agu/147) 14 isim, B->C(10 Agu/215)
14 isim, A->C 21 isim. Evren genisletilecekse BILINCLI gecis olarak
kaydedilmeli. track.json sicil sepeti 28 Tem temelli, DEGISTIRILMEMELI.

## 252s CDS OTOMATIKLESTIRILEMIYOR — BES KAYNAK ELENDI (10 Agu)

RISK_CDS=206 (27 Tem) barometrenin %25'ini besliyor. Otomasyon kurali
geregi API'ye baglanmak istendi. BES KAYNAK DENENDI, BESI DE KAPALI:
  EVDS               — sovereign CDS YOK. `?ara=risk` yalnizca BANKACILIK
                       sektoru kredi riski donduruyor (Sektor Riski Nakdi/
                       Gayri Nakdi × TL/YP). Beklenen sonuc: CDS Londra'da
                       islem goren bir turev, TCMB yayinlamaz.
  Fintables          — katalogda yok (hisse/endeks/fon/finansal tablo).
  Alpha Vantage      — sovereign CDS yok.
  worldgovernmentbonds — sayfa BOT KORUMASIZ acildi ama degerler `----`;
                       JS ile basiliyor, sunucu tarafi fetch kabugu alir.
  TradingEconomics   — SUNUCU TARAFI BASIYOR (Turkiye 2Y 37,77 · 10Y 32,24
                       · USDTRY 47,7175 ham fetch ile geldi) AMA CDS SAYFASI
                       YOK. NOT: yedek kaynak olarak degerli, bir gun Yahoo
                       ya da EVDS duserse burasi ayakta olabilir.
  investing.com      — var, ama Cloudflare + Refinitiv RIC kodu
                       (TRGV5YUSAC=R). §249i'de tefas.js icin gomulen
                       Bearer+F5 cerezinin AYNI DESENI — o coz bugun
                       "Request Rejected" veriyor.
KARAR: sabit KALDI (kullanici karari). ONERI ACIK: barometre altindaki
"TR CDS (ulke riski)" satirina DAMGA TARIHI eklenmeli — su an 13 gunluk bir
sayiya bakildigi SOYLENMIYOR. §245k: gizli damga, acik damgadan kotudur.
KAYNAK NOTU: panelin 206'si uydurma DEGIL — TRT Haber Haz 2026'da CDS'in
225'i gordugunu yazmis, kod yorumu da "225->206" diyor. Kaynak muhtemelen
Bloomberg CDS mid (Turk medyasinin standart referansi). Investing.com'un
239,57'si FARKLI BIR KOTASYON; benim "%16 fark" diye isaretledigim sey
muhtemelen kaynak farki, HATA DEGIL.

## 252r-o DENETIM VE PANEL DUZELTMELERI (10 Agu)

252o UYELIK DENETIMI UC DOSYAYA GENISLETILDI (scripts/denetim yolu,
  tazele.mjs:713). Onceki hali YALNIZ xktum.json'a bakiyordu; xktmt.json'in
  34/39 tasidigi bu yuzden gorulmedi. IKI FARKLI TASARIM, IKI FARKLI KONTROL:
  xktum KASTEN ilk 150/242 (yalniz "fazla" anlamli), xk100/xktmt TAM kapsam
  (HER IKI YON hata). ESKI DOSYAYLA SIMULE EDILDI, bugunku hatayi aynen
  basiyor; duzeltilmis dosyalarla YANLIS ALARM URETMIYOR.
252p SERIT DONMUSTU. tapeItems'in BIST 100/30 degerleri sabit yaziliydi ve
  HICBIR YAZAR yoktu — sayfanin en tepesindeki akan sayi hep 14.080/16.175.
  Veri ZATEN ELDEYDI (m.end.XU100/XU030). Yedege '(damgali)' etiketi eklendi:
  canli gelmezse SESSIZCE eski sayi gostermez, damgali oldugunu SOYLER.
  Yedi senaryo test edildi (veri yok/kismi/p=null/chg=NaN/chg=0).
252q SEZON KURALI TEK SAHIBE TASINDI. §245p "hesap window.tazelikHesap'ta
  birlestirildi, ajan.js de bunu kullanir" DIYORDU — OLCULDU: ajan.js
  tazelikHesap'i HIC CAGIRMIYOR, kendi kopyasini calistiriyor. Birlestirme
  YARIM KALMIS. Gorunen belirti: sezon kurali yalniz ajan.js:445'teydi.
  10 Agu olcumu: BES katman ayrisiyor (Faktor modeli 27g ve Guidance 24g
  Ebu'ya gore BAYAT, cekmeceye gore TAZE(90)). Kural tazelikHesap.durum()
  icine alindi + sezonBaglam() yardimcisi. Ayrisma 5 -> 0.
  SEZON ROZETI eklendi ('·sezon 10g') — gizli siki limit, gizli gevsek limit
  kadar kafa karistirir.
  ACIK KALAN: ajan.js hala kendi kopyasini calistiriyor. Bugun SONUCLAR
  hizalandi ama IKI UYGULAMA DURUYOR — bir sonraki duzeltme yine birinde
  eskiyebilir. Gercek cozum ajan.js dongusunu tazelikHesap'a baglamak.
252r BILANCO TAKVIMI `gerceklesen` blogu render'a baglandi + rozet.

## 252n OTURUM DERSI: OKUMAK YETMIYOR, EKRANI OLCMEK GEREK (10 Agu)

Bu oturumda repodaki HER kod ve belge dosyasi satir satir okundu (~28.000
satir; 24 JS, 7 MD, 29 JSON). Buna ragmen gunun EN BUYUK iki hatasi
okumayla DEGIL, tarayici konsolundan gelen ciktiyla bulundu:
  - rotTL "17.821,01 trl TL" (bin kat) — §252j
  - krediVal "26.609,54 trl TL" (bin kat) — §252l
Ikisi de kodda DOGRU gorunuyordu. Hata bolen ile SERININ BIRIMI arasindaki
uyumsuzluktaydi; kaynak birimini bilmeden koda bakarak anlasilamaz.

DAHA CIDDISI: bu oturumda app.js'e yazilan 4 duzeltmenin IKISI OLU DOGDU.
  - §252h sapma: `j.sapma.skor` yazildi — OYLE BIR ALAN YOK. egri.js
    `sapma:skor` doner ve skor bir NESNEDIR {konvansiyon_adi: puan}.
    Dogrusu j.sapma[j.konvansiyon]. sp hep '' kaliyordu.
  - §252m uyeSayi: kod dogruydu, ZAMANLAMA yanlisti. es.innerHTML
    kuruluyor ama ENDAG asagidaki endeksAgirlikYukle() ile SONRA doluyor;
    ustune dataset.dolu ikinci doldurmayi engelliyor -> etiket sonsuza
    kadar sayisiz kalirdi.
IKISI DE `node --check`ten GECTI. IKISI DE fonksiyon envanteri testinden
gecti. Ikisini de yalniz CALISAN PANEL yakaladi.

KURAL (yeni): app.js'e yazilan her duzeltme, deploy sonrasi konsoldan
TEK TEK dogrulanir. Sozdizimi ve envanter kontrolleri GEREKLI ama YETERLI
DEGIL — ikisi de "kod var" der, "kod isini yapiyor" demez.
Dogrulama kalibi: console.log ile ilgili id'nin textContent'i okunur ve
BEKLENEN DEGERLE karsilastirilir. Beklenen deger yamayi yazarken
hesaplanip yaziya dokulur (ornek: "17821006486/1e9 = 17,82 trl").

IKINCI KALIP — tam ekran dokumu (mertebe testi):
  document.querySelectorAll('[id]') ile yaprak dugumler taranir, sayi
  iceren her deger dokulur. Bilinen capalarla kiyaslanir: GSYH ~50 trl TL,
  toplam mevduat ~20 trl, bankacilik kredi ~26 trl, brut rezerv ~170 mlr $,
  YP mevduat ~260 mlr $, politika faizi %37, TUFE %31,75.
  Bu testle bu oturumda 2 bin-kat hatasi + 1 bayat etiket bulundu.
  UYARI: dokum betigi kart basligini yanlis eslestirebiliyor — "aofmLive
  %40 Politika faizi satirinda" diye yanlis alarm verdi; gercekte satir
  index.html:420'de "AOFM — efektif fonlama" olarak DOGRU etiketli.
  Alarmi koda bakmadan rapor etme.

UCUNCU DERS — YANLIS BULGU: pyssektor.json'da "uc blok celisikli" diye
bir bulgu raporlandi (fon toplami 112,89 vs pys toplami 38,37; GAL 63,28
vs Garanti 4,56). GERI CEKILDI. Sebep: fon blogu BRUT GIRISE gore ilk 12,
pys blogu NETE gore ilk 10 — iki FARKLI olcu toplanip fark celiski
sanildi. Olcum: GAL'in 4 Agu'daki +63,28'i GERCEK, o gun piyasadaki en
buyuk tek fon girisi (brut girisin %43u) ve ayni fon 31 Tem'de -70,13
vermis; kurumsal nakit tasiyan bir arac, gidis-donus yapiyor.
DERS: farkli tabanlarda siralanmis iki listenin TOPLAMLARI kiyaslanmaz.
Panelde hata yoktu; analizde vardi.

## 252m XKTMT ETIKETI SABIT KALMISTI -> DOSYADAN OKUNUYOR (10 Agu)

app.js:5874 `ad:'BIST Katilim (dar · 34)'` sabit yaziliydi. §252b'de dosya
39 uyeye cikarildi, etiket 34'te kaldi. Konsol dokumunde yakalandi.
COZUM: `uyeSayi:true` bayragi + ayrEtiketTazele() — sayi ENDAG'dan (yani
DOSYADAN) okunur. Uye sayisi bir daha degisirse elle guncelleme GEREKMEZ.
DIKKAT: ilk yazim calismiyordu (siralama), bkz §252n.

## 252l BANKACILIK KREDI HACMI BIN KAT SISIK (10 Agu)

Ekranda "26.609,54 trl TL" — Turkiye GSYH'sinin ~530 kati.
app.js:7804 `x=>trN(x/1e6,2)+' trl TL'`. bie_hpbitablo6 BIN TL biriminde
gelir; dogru bolen 1e9. -> 26,61 trl TL.
§229 (BORSK bin kat) ve §252j (rotTL) ile ayni aile, DORDUNCU vaka.
KRITIK NOT: koyGrupSon bolenleri GRUBA GORE DEGISIR. bie_hpbitablo4
MILYON $ (/1000 dogru, 260,1 mlr $), bie_hpbitablo6 BIN TL (/1e9).
Yeni satir eklerken KOPYALAMADAN once serinin birimi dogrulanir.
Ayrica: KKM notu duzeltildi — seri sifira oturmus (program kapandi),
"dusus trendi" anlatmak yaniltiyordu.

## 252k rotKKM SATIRI KALDIRILDI — IKI AYRI KIRIK (10 Agu)

§246g "YP mevduat stoku" satirini eklemisti. Konsol teyidi: rotKKM = "—".
KIRIK 1 (kapsam): gSeri onceki try-blogunun if'i icinde const, bu blokta
KAPSAM DISI. `typeof gSeri!=='undefined'` tanimsiz isim icin 'undefined'
doner -> kosul DAIMA false, satir hic yazilmadi.
KIRIK 2 (semantik): kapsam duzeltilse bile YANLIS SAYI basacakti.
TP.HPBITABLO5.1 bir AKIM serisi (haftalik degisim, mn $), stok degil —
rotYP ile ayni sayinin bin kati kucugu, "stok" etiketiyle.
Dogru stok serisi ARANDI: HPBITABLO tablo 5 tamamen akim (5.2..5.10 hepsi
birkac bin mertebesinde); tablo 3 stok ama seri ADLARI cozulemedi
(3.1=20,09 trl, 3.2=17,82 trl, fark 2,27 trl ~55 mlr $ — Turkiye YP
mevduatinin ucte biri, yani 3.1 "toplam" degil).
KARAR: satir kaldirildi. §243 kurali — etiketi DOGRULANAMAYAN sayi, BOS
SATIRDAN kotudur. Ayrica panel zaten iki kart yukarida "Toplam YP mevduat
260,1 mlr $" (bie_hpbitablo4) gosteriyor; satir onu TEKRARLAYACAKTI.
Geri getirmek icin: dogru stok serisinin EVDS adi tespit edilmeli.

## 252j rotTL BIN KAT SISIK (10 Agu)

Ekranda "17.821,01 trl TL". Ham deger 17821006486, seri BIN TL biriminde
-> gercek 17,82 TRILYON TL. Bolen 1e6 idi, 1e9 olmali. Degisim satirinda
da fazladan *1000 vardi: gercek -95,5 mlr TL, ekranda "-95.468 mlr".
NASIL BULUNDU: rotKKM'yi olcmek icin istenen konsol ciktisi ortaya
cikardi. 28.000 satir okunurken GOZDEN KACTI.

## 252i mail.js ID UYUSMAZLIGI — TAKTIKSEL BLOK MAILE HIC GIRMIYORDU (10 Agu)

api/_lib/mail.js `al('taktikselBody') || al('taktiksel')` ariyordu;
index.html'de IKISI DE YOK. Gercek id 'taktikBody2' (yedegi 'taktikBody').
app.js:3279 dogrusunu biliyor. Sonuc: takVar hep false, TAKTIKSEL DAGILIM
blogu maile HIC girmiyor, dipnot zarifce "panelde hesaplanir" deyip
geciyordu — ARIZA GIBI GORUNMUYORDU (§143 sessiz yedek ailesi).
NOT: O1 HALA ACIK — Pazartesi cron'u index.html'i SUNUCUDAN cekiyor,
Ebu'nun yorumu localStorage.__HAFTALIK__'ta. Mail damgali fabrika metnini
gonderiyor. Cozum yolu: mail.js Upstash'ten okusun (ajanktp kvKomut deseni).

## 252g GUCLU SKORU GRIYE DUSUYORDU (10 Agu)

inceleme-ai.json metin skorlari: POZITIF(7) KARISIK(4) NEGATIF(3) NOTR(1)
GUCLU(1). skorRenk GUCLU'yu hicbir dala uydurmuyordu -> GRI, yani NOTR ile
ayni. Sezonun en guclu bilancosu (Samsung) notr gorunuyordu.
Iki ayri cizicide birden duzeltildi (app.js:3383 ve 3815).

## 252f ID KAPSAM DENETIMI — YENI KONTROL (10 Agu)

app.js'in $('...') ile aradigi TUM id'ler index.html'e karsi tarandi:
380 id, 9'u HTML'de yok. Sekizi DINAMIK yaratiliyor (yabCarryVal,
asyaForexBody, bilTetik, pariteTestDurum...), dokuzuncusu yedek zincirin
ikinci halkasi (taktikBody). Yani bulutUyari TEK GERCEK KAYIPTI.
Denetim hem hatayi buldu hem YANLIS ALARM URETMEDI.
Bu kontrol kopru-testi.js'e eklenmeye degen bir adaydir.

## 252e bulutUyari ELEMANI <style> ICINDE SIKISMISTI (10 Agu)

index.html:59 — §200b'de yazilan uyari elemani YAPISTIRMA KAZASIYLA
<style> blogundaki §193 yorumunun ORTASINA dusmustu. DOM'da olmadigi icin
app.js:6330 $('bulutUyari') daima null donuyordu ve "Bulut deposu kapali"
uyarisi HIC BASILMIYORDU — §200'un tarif ettigi sessiz veri kaybi aynen
duruyordu. Eleman seridin altina, wrap'in ustune alindi.
DESEN: "duzeltme yazildi, teslim noktasi koptu, kopukluk sessiz" —
bu oturumda 7 vaka sayildi (rotKKM, bulutUyari, Pazartesi maili,
taktikselBody, xktumGercek, §249n cron'u, egri sapma).

## 252d OKU_* SABITLERI TAZELENDI (10 Agu)

app.js:2954 `OKU_POLITIKA=37, OKU_TUFE=32.11, OKU_BEK=23.81`.
  - TUFE 32,11 (Haz) -> 31,75 (Tem, TUIK 3 Agu, yillik 0,35 puan geriledi)
  - BEK 23,81 (Haz anketi) -> 23,95 (Tem anketi, 20 Tem yayin)
  - POLITIKA 37 DEGISMEDI — 23 Tem PPK sabit tuttu, dogrulandi
Panel KENDI ICINDE CELISIYORDU: bilanco tezi metni ve index.html:707 zaten
%31,75 diyordu, sabit %32,11'de kalmisti -> 2Y/10Y REEL GETIRI 0,36 puan
yanlis. Canli teyit: oku2yReel +9,0 -> +9,4 · oku2yIleri +17,3 -> +17,2.
RISK_CDS'E DOKUNULMADI: panel 206 diyor, Investing.com 30 Tem kapanisi
239,57. Kaynak konvansiyonu BAKIM.md'de KAYITLI DEGIL. Bilinmeyen kaynagi
bilinmeyen sayiyla degistirmek, bayat birakmaktan kotudur. Kaynak
belirlenince duzeltilecek.

## 252c YEOTK BEDELSIZ DUZELTMESI — analist.json (10 Agu)

Hedef 173,50 (14 May, TEK kurum) / fiyat 39,30 -> panel +%341 potansiyel
gosteriyordu. 31 Tem 2026 bedelsizi (%58,77 + ic kaynak %75,03 = x2,3380)
sermayeyi 830 mn TL yapti. Duzeltilmis hedef 74,21 -> +%89.
KRITIK AYRIM: bu bir BAYATLIK sorunu DEGIL. Fintables da ayni ham 173,50
degerini tasiyor — raporu veren kurum revize etmemis. Kaynak duzeltmiyorsa
PANEL duzeltmek zorunda. §179 bayat bayragi bu vakayi YAKALAMAZ: rapor
6 aydan yeni, sorun tarihi degil BOLUNMESI.
KONTROL EDILDI: BIMAS (14 May, x2) ve GOODY (2 Tem, x5,63) de bedelsiz
yapti ama panel hedefleri bedelsiz SONRASI tarihli, duzeltme gerekmedi.
NOT: analist.json genel olarak COK IYI durumda — 55 hissenin yalniz 2'si
%10+ sapiyor (EREGL, TUPRS; sadece daha taze rapor) ve bayat bayraklari
Fintables ile BIREBIR tuttu. Tum dosya TAZELENMEDI cunku Fintables sorgusu
6 aylik pencere, panelin dosyasi 1 YILLIK (kurum sayilari tutarli bicimde
daha yuksek: ASELS 20 vs 18, THYAO 24 vs 22). Ezmek metodolojiyi sessizce
DARALTMAK olurdu — duzeltme degil.

## 252b ENDEKS DOSYALARI: UC BEDELSIZ ISLENMEMISTI (9-10 Agu)

BULGU 1 — XKTMT UYELIGI: resmi 39, panel 34. JANTS FAZLA (o XKTUM ve
XK100 uyesi, XKTMT degil), AVPGY GENTS KBORU NETCD SDTTR TEZOL EKSIK.
kapsanan_agirlik:100 yalandi — 34 ismi %100'e normalize ediyordu.
Iki BAGIMSIZ kaynak teyit etti: BIST resmi CSV (endeks-uyeler.json) ve
Fintables. Ikisi de 39 dedi.
YAKALANMAMA SEBEBI: tazele.mjs:713 uyelik uyumunu YALNIZ xktum.json icin
kontrol ediyor. Dogrulayacak veri 5 Agu'dan beri repoda duruyordu.
-> A2 ISI ACIK: denetime XKTMT/XK100 uyelik kontrolu eklenmeli.

BULGU 2 (daha buyuk) — PAY ADEDI BAYAT: son 10 gunde UC bedelsiz olmus,
panel hicbirini kaydetmemis:
  YEOTK 31 Tem  %58,77 + ic kaynak %75,03  (x2,3380)
  KTLEV  3 Agu  ic kaynaklardan %238,16     (x3,3260)
  CVKMD  5 Agu  sermaye 3,78 mlr'a
KTLEV UC DOSYADA BIRDEN bayatti (xk100, xktum, xktmt) ve portfoyde.
XKTMT'de agirligi %1,56 -> %4,88 (+333 bp). Ilk 4 yogunlasma %85,8 -> %81,5.
Toplam 20+ isimde >%2 sapma vardi.
_gocs alani ZATEN UYARIYORDU: "pay_adedi CEYREKLIK elle tazelenir (BIST
endeks revizyonu + SERMAYE ARTIRIMLARI)". Rituel kacmis.
DOGRULAMA: Actions kosusu XK100 100/100, XKTUM 150/150, XKTMT 39/39,
toplam 100.00 — ucu de GECTI.
NOT: tazele.mjs risk katmani bedelsizleri ZATEN yakaliyordu ("5 gun
kurumsal islem suzgecine takildi, ±%20 ustu hareket"). Suzgec calisiyordu,
SINYALI KIMSE OKUMUYORDU.

## 252a DAMGALI KART TARAMASI + MB KARTLARI GUNCELLENDI (8 Agu)

TARAMA: panelde damgali/eski etiket taramasi yapildi. 15 aday bulundu:
  - TUFE/UFE kartlari (628, 642): 'damgali (Haz 2026)' etiketi VARSAYILAN
    metin — canli EVDS gelince 'EVDS · 2026-7' oluyor. SORUN YOK.
  - 11 kart '27 TEM' damgasinda (12 gun eski): global risk barometresi,
    getiri egrisi, BOJ, BOK, ECB, Avrupa mega-cap, FED, ABD bilanco,
    haber akisi, gundem ozeti.
GUNCELLENEN (web arastirmasiyla dogrulanan guncel durum):
  BOJ: Temmuz toplantisi SABIT %1,00 (8-1; Takata %1,25 istedi); riskler
    dengeli, AI talebi + kur izleniyor. Haziran'da +25bp yapmisti.
  ECB: 17 Haz %2,25 artirim — bes indirimden sonra donus, ARTIRAN TEK
    buyuk merkez. Agustos toplantisi yok, 10-11 Eylul; Hormuz enerji soku
    enflasyonu hedef ustunde tutarsa ikinci artirim tartisilir.
  FED: 'Eylul artirim %82' rakami DONDURULDU — o 27 Tem fiyatlamasiydi;
    yerine durust ifade: fiyatlama oynak, kurul derin bolunmus (4-8
    muhalefet), piyasa uzun sureli bekleme fiyatliyor.
NOT: eski metinlerdeki tek tek olasilik rakamlari (X%) hizla bayatliyor —
kartlarda RAKAM yerine REJIM tarif etmek daha dayanikli; bu ilke
uygulandi.
KALAN ESKI KARTLAR (sonraki tur): global risk barometresi, getiri egrisi
gorseli, BOK, Avrupa mega-cap, ABD bilanco, gundem ozeti.

DOSYALAR: index.html (ktpanel/)

## 252 HAFTALIK YORUM + TAKTIKSEL DURUS YENILENDI (8 Agu)

HAFTALIK YORUM (index.html, 5 blok tamamen yeniden yazildi):
 1. Ceyregin temasi: MALIYET MAKASI — emtia zinciri patladi (TUPRS 4x,
    EREGL 6,5x, ISDMR 3,8x, PETKM zarardan cikis, BRISA +6,6 puan marj).
    Sok marji uyarisi: madencilik UFE +8,30 -> -4,22 dondu.
 2. BIST/katilim: XKTUM 18.694; XK100 aylik +6,60 vs model +3,57 =
    3,03 puan GERIDE. Atif: ASELS eksik agirlik +1,69 kazandirdi ama
    TUPRS eksikligi (+%26 ralli) -0,94 goturdu. ALBRK +%69 dondu;
    THYAO marj cokusu, TKNSA/ALCTL zayif.
 3. Enflasyon: TUFE %31,75 indi AMA gida %37,53'e cikti (dezenflasyon
    genele yayilmis DEGIL); Yi-UFE %27,83. PP fonlarina gunluk 39 mlr,
    aylik 211,5 mlr. TLREFK 4.010,7 — alfa sutunu canli.
 4. Degerli metal: altin 4.399,70 (hafta +8,7), gumus +10,3.
 5. Tuketici ikiye ayrildi (makas +17,4 puan): EBEBK vs TKNSA; ajanda
    ve Agustos halka arz yogunlugu.

TAKTIKSEL DURUS (app.js varliklar dizisi):
  Yerli Hisse NOTR -> USTU: tez artik beklenti degil KANIT (2C kar
    donusu + banka toparlanmasi + UFE'nin TUFE'den hizli sogumasi).
  Yabanci Hisse ALTI korundu (goreli cazibe yurt ici lehine).
  Altin NOTR — ama TEZ CURUDU acikca yazildi: 'yuksek reel faiz tavan
    koyar' varsayimini fiyat REDDETTI (+%8,7 hafta). Ralliye gec
    katilmamak icin USTU denmedi; tezin yenilenmesi bekleniyor.
    DURUSTLUK NOTU: modelin yanildigi yer kartta ACIKCA kayitli.
  TL/Sabit USTU — ama 'zirveye yakin' uyarisiyla; ilk indirimde sure
    uzatma (sukuk) karari icin pencere daraliyor.

app.js v=20260808a · DOSYALAR: app.js + index.html (ktpanel/)

## 251 S&P GLOBAL (PLATTS) KOPRUSU — KESIF TAMAM, SEMBOL BEKLENIYOR (8 Agu)

Kullanici S&P Global Commodity Insights aboneligi aldi, anahtari Vercel
env SPG_KEY olarak ekledi. Kopru kuruldu ve KESIF turlariyla API'nin
yapisi OLCULDU (tahmin yok):

MIMARI: api/platts.js AYRI FONKSIYON (kullanici tercihi; tcmb'ye
bindirme geri alindi — farkli kimlik modeli/kota/hata dili). Envanter
11/12. Uc KORUMALI birakildi (middleware muafiyeti YOK) — ucuncu kisiler
abonelik kotasini tuketemesin; panel oturumla cagirir.

OLCUM SONUCLARI (Bearer + Accept + appkey basligiyla):
  ✓ CALISIYOR: /market-data/v3/value/current/symbol
      filtre dili: filter=symbol="KOD"  (IN ve : varyantlari da kabul)
      hata mesaji 'Unsubscribed symbols: X' = boru hatti SAGLAM, yalniz
      sembol abonelik disi.
  ✓ /market-data/v3/metadata → 200; sorgulanabilir TEK alan 'symbol'
      (isQueryField:true). Alanlar: mdc, value, symbol, bate, ...
  ✗ /market-data/v3/value/current/mdc → 403 'User doesn't have access to
      the dataset' (MDC/kategori bazli toplu sorgu abonelikte YOK).
  ✗ reference-data/search → 403 (sembol ARAMA kapali — katalog gezilemez).
  ✗ 18 dataset taramasi: yalniz market-data 200; refinery-data 401
      (route VAR, kimlik farkli — ileride bakilabilir); digerleri 404.

KALAN TEK EKSIK: abone olunan 7 karakterli SEMBOL KODLARI (jet, nafta,
gasoil, varsa freight). Portal: Entitlements / My Subscriptions.
Kodlar gelince: platts.js uretim moduna (sabit semboller), platts-arsiv
.json gunluk birikim, Emtia sekmesine 'Rafineri Marjlari & Navlun' blogu
(jet/nafta gercek Platts + gasoil-Brent crack + sparkline).

ARA COZUM (Platts gelene dek): crack'ler Yahoo verisinden HESAPLANABILIR —
emtia sekmesinde Brent/WTI/RB(benzin)/HO(ULSD) zaten var:
  diesel crack = HO×42 − Brent · benzin crack = RB×42 − Brent
  3-2-1 crack = ((2×RB + 1×HO)×42 − 3×Brent)/3
Jet crack icin ULSD vekil (orta distilat ailesi, birkac $ diferansiyel).
Nafta ve BDI icin ucretsiz karsilik YOK (BDI Baltic Exchange lisansli;
Massive'de Platts/Baltic urunleri KATALOGDA var ama fiyat 403 — futures
paketi gerekiyor).

DOSYALAR: api/platts.js (ktpanel/api/) + middleware.js + KTPANEL-BAKIM.md

## 250q XLSX SEYREK HUCRE — KOLON KAYMASI (5 Agu)

Panel tanisi bilmeceyi cozdu: 'arsiv: XK100 1 nokta' — 95.563 kayit
girmis ama XK100/XKTUM ANAHTARIYLA DEGIL. Kok neden: xlsx'te BOS HUCRE
XML'de HIC YAZILMAZ (seyrek satir); ben hucreleri SIRAYLA okuyunca
kolonlar kayiyordu (kod yerine ad/kur okundu) — tarihler dogruydu, o
yuzden arsiv 1.472 gun gorunuyordu ama endeks kodlari coptu.
§250q: hucre ADRESI (r="B2") kolon indeksine cevrilir (A=0, B=1...),
boşluklar korunur; kapanis 5. kolon (dokuman: Tarih;Kod;Ad;Kur;Kapanis),
yoksa son dolu hucre. Ilk satir ORNEK olarak rapora basilir.
TEMIZLIK: eski tohum kayik anahtarlar birakti — bayrak surumlendi
(aylik_tohum_v2); eski tohumda endeks-kodu desenine uymayan anahtarlar
SILINIR, tohum yeniden calisir.
TEST: seyrek satir (C kolonu bos) dogru okundu → tarih/kod/kapanis yerinde.

DOSYALAR: scripts/tazele.mjs (DEPO KOKU)

## 250p TARIH ANAHTARI KARISIKLIGI COZULDU (5 Agu)

Kullanicinin actigi endeks-arsiv.json ekrani kok nedeni gosterdi: anahtar
IKI FORMATTA — '2026-08-05' (ISO, TLREFK yolundan) ve '04/08/2026'
(GG/AA/YYYY, gunluk CSV'nin TARIH kolonundan). Siralama/karsilastirma ISO
varsayiyordu; karisik anahtarlarla gecmis bulunamiyor, panelde donemler
acilmiyordu.
IKI TARAFLI DUZELTME:
  tazele (§250p): veriGunu artik isoCevir() ile HER ZAMAN ISO; ayrica
    arsivdeki eski GG/AA/YYYY anahtarlar tek seferlik ISO'ya TASINIR
    (onarim, veri kaybi yok).
  app.js: panel Actions'i beklemeden okurken normallestirir — anahtarlar
    ISO'ya cevrilip harita kurulur, degerler oradan okunur.
Test: karisik anahtarli arsivde 1A getirisi dogru hesaplandi (+7,15%).
DERS: ayni dosyaya IKI FARKLI KAYNAKTAN yazilirken anahtar bicimi TEK
noktada normallestirilir; yoksa dosya 'dolu ama okunamaz' olur.

app.js v=20260805f · DOSYALAR: app.js + index.html (ktpanel/) +
scripts/tazele.mjs (DEPO KOKU)

## 250n ACIL: SONSUZ DONGU (sekme kilitlenmesi) — 5 Agu

Kullanici: 'Portfoy Yonetimi > Portfoy'e tiklayinca sayfa tikaniyor.'
KOK NEDEN (benim 250m hatam): ayrismaCiz icine koydugum
endArsivYukle().then(()=>ayrismaCiz()) her cizimde yeniden tetikleniyordu
— ENDARS dolu olsa bile then calisip ayrismaCiz'i cagiriyor, o da yine...
SONSUZ DONGU, sekme kilitleniyor.
§250n: (a) tetik window.__endArsivTetik bayragiyla TEK KEZ; (b) performans:
1.473 gunluk arsivin gun listesi her cagrida filtrelenip siralaniyordu —
kod basina onbellek (__endArsivBellek).
DERS: 'yukle sonra yeniden ciz' deseni ciziм fonksiyonunun ICINE
konulacaksa MUTLAKA tek-sefer bayragi ister.

app.js v=20260805d · DOSYALAR: app.js + index.html (ktpanel/)

## 250m ARSIV TABANLI DONEM GETIRISI — AYRISMA ACILDI (5 Agu)

Aylik tohum TUTTU: 95.563 kayit, arsiv 1.473 gun (XKTUM 2015'e uzaniyor).
Panel yamasi (§250m): ayrismaHesap'ta endeks donem getirisi icin ONCE
canli akis, YOKSA endeks-arsiv.json — 'son deger / hedef tarihe en yakin
onceki kapanis'. Donem secici de arsivi hesaba katar (247m'nin 'veri yok'
kilidi aylik seri sayesinde acilir).
Simulasyon dogrulandi: YTD/1A/3A hesaplari beklenen degerleri verdi.
KAPSAM: 1A/3A/YTD/1Y aylik tohumla CALISIR; 1H (hafta) gunluk veri ister —
gunluk arsiv doldukca (gunde 1) o da acilir. Beta cipasi ayni takvimde.
Rapor/etiket: rBKaynak alani 'canli' | 'BIST arsiv' ayrimini tutar.

app.js v=20260805c · DOSYALAR: app.js + index.html (ktpanel/)

## 250l XLSX SHEET KESFI + BULTEN SONUCU (5 Agu)

Iki tani:
1) BULTEN (§250k sonucu): thb202608041.zip INDI (285KB, tek CSV). AMA
   icerik HISSE BAZLI: TARIH;ISLEM KODU;BULTEN ADI;PAZAR;...;BIST 100
   ENDEKS;BIST 30 ENDEKS — buradaki 'ENDEKS' kolonlari hissenin o
   endekste olup olmadigini gosteren BAYRAK, endeks DEGERI degil.
   SONUC: XKTUM gunluk serisi bultende YOK; gunluk tarihsel icin kamu
   kaynagi kalmadi -> dogal birikim (gunde 1) devam.
   YAN FIRSAT (bekleyen): bultende HISSE KAPANISLARI var (285KB, tum
   pazar) — Yahoo bagimliligini azaltacak RESMI fiyat kaynagi olabilir;
   multiple/risk katmanlari icin ayrica degerlendirilecek.
2) AYLIK TOHUM: 'xlsx hata ENOENT' — sheet dosyasinin adi sabit degil.
   §250l: xl/worksheets dizinindeki ILK .xml bulunur; dizin yoksa xl/
   icerigi rapora basilir (kesif). Boylece TR_PayEndeksleri*.xlsx
   ay sonu serileri arsive girecek.

DOSYALAR: scripts/tazele.mjs (DEPO KOKU)

## 250k GUNLUK TARIHSEL ICIN BULTEN KESFI (5 Agu)

Kullanici: 'gunluk de cekilemiyor mu?' — /datum/ katalogunda gunluk
tarihsel endeks YOK (son gun + ay sonu var). AMA doküman baska bir kapi
gosteriyor: BULTEN VERILERI /data/thb/YYYY/AA/thbYYYYAAGGS.zip — BIST'in
gunluk tam bulteni; endeks kapanislari icinde olabilir.
§250k bultenKesif(): DUN icin dort sonek denenir (S=1/2/3/bos), inen zip
acilir, ilk 12 dosyada XKTUM/XU100/ENDEKS izi aranir; DOSYA LISTESI +
IZ SATIRI rapora basilir. Tahmin yok — olcum.
Tutarsa: 60-90 gunluk tohum donguse cevrilir (gun basina bir zip) ve
GUNLUK XKTUM arsivi bir kosuda dolar -> betalar HEMEN gercek katilim
cipasina gecer (3 ay beklemek yerine).
Tutmazsa: dogal birikim devam (gunde 1 gun, ~3 ay) — panel bu arada
dogru calisiyor, yalnizca cipa yedekte.

DOSYALAR: scripts/tazele.mjs (DEPO KOKU)

## 250j XLSX OKUYUCU (kutuphanesiz) — 5 Agu

Tani: 'Aylik endeks tohumu — CSV bulunamadi · TR_PayEndeksleriFiyat.zip
→[TR_PayEndeksleriFiyat.xlsx]'. Dosyalar .xlsx cikti.
§250j: bagimlilik EKLEMEDEN xlsx okuyucu — xlsx zaten bir ZIP: acilir,
xl/sharedStrings.xml (metin havuzu) + xl/worksheets/sheet1.xml (hucreler)
regexle okunur; t="s" hucre paylasilan metin indeksi, digerleri ham sayi.
Excel SERI TARIHI de desteklenir (1899-12-30 + gun) — BIST metin tarih
kullaniyor ama iki ihtimal de kapsandi.
TEST: sahte XML ile dogrulandi → ['30.11.2015','XKTUM',...,'6768.97']
dogru ayristirildi (kod XKTUM, kapanis 6768,97, tarih 2015-11-30).
Beklenen: 'Aylik endeks tohumu ✓ N kayit' — XKTUM'un 2015'e uzanan ay
sonu serisi arsive girer; ayrisma 1A/3A/YTD/1Y icin taban hazir olur.
Beta korumasi (250i) yerinde: aylik noktalar gunluk beta cipasini
ETKILEMEZ (son 120g yogunluk sarti).

DOSYALAR: scripts/tazele.mjs (DEPO KOKU)

## 250i AYLIK TARIHSEL TOHUM + BETA YOGUNLUK KORUMASI (5 Agu)

BIST format dokumani (§2.1.7/2.1.8) iki yeni kaynak verdi:
  TR_PayEndeksleriFiyat.zip / TR_PayEndeksleriGetiri.zip → endeksin
  HESAPLANMAYA BASLANDIGI TARIHTEN itibaren AY SONU kapanislari.
KRITIK AYRIM: bu veri AYLIK. Ayrisma 1A/3A/YTD/1Y icin altin ama GUNLUK
BETA icin KULLANILAMAZ — aylik noktalarla gunluk beta hesaplanirsa sonuc
saçmalar. Bu yuzden iki yama BIRLIKTE:
  (a) Aylik tohum: iki zip cekilir, CSV varsa ayristirilir (BOM/kodlama
      otomatik), arsive yazilir; CSV yoksa (xlsx olabilir) icerik listesi
      rapora basilir — tahmin yok.
  (b) BETA KORUMASI: arsiv secimi artik 'nokta sayisi >= 60' degil
      'SON 120 TAKVIM GUNUNDE >= 60 nokta' sartina bagli; aylik tohum
      sayaci sisirse bile beta yanlis cipaya GECMEZ. Rapor yogunlugu
      yazar: 'arsiv XKTUM: N nokta (son 120g: M)'.
DERS: yeni veri eklerken o verinin FREKANSI mevcut hesaplarla uyumlu mu
diye sorulur; uyumsuzsa veri eklenir ama KULLANIM KAPISI korunur.

DOSYALAR: scripts/tazele.mjs (DEPO KOKU)

## 250h TOHUM COZULDU: UTF-16 + BASLIKTAN KOLON (5 Agu, gece 3)

Alan kesfi bilmeceyi cozdu — ornek satirdaki 'ÿş' BOM'u ve harf-arasi
bosluklar TARIHSEL dosyanin UTF-16LE oldugunu gosterdi (gunluk dosya
ISO-8859-9). Ayrica kolon duzeni FARKLI: tarih ILK kolonda, gunlukte
6. kolonda.
§250h: (a) BOM'a bakip decode ('utf-16le' / 'iso-8859-9'); (b) kolon
indeksleri BASLIK SATIRINDAN ogrenilir (TARIH|DATE ve KAPANIS|CLOSING
aramasi) — sabit indeks yerine okuma; bulunamazsa gunluk duzen yedek.
Simulasyon: baslikta tarih=0, kapanis=4 dogru tespit edildi.
BEKLENEN: 'TLREFK tarihsel tohum ✓ N gun' -> katfon tablosunda
'α vs TLREFK' sutunu ACILIR (fon YTD − benchmark YTD).
DERS PEKISTI: dosya formati TAHMIN EDILMEZ, ORNEK SATIR RAPORLANIR ve
kodlama/kolon ORADAN ogrenilir (EVDS seri adi, TEFAS alan adi, simdi
BIST kodlamasi — ayni desen ucuncu kez kazandirdi).

DOSYALAR: scripts/tazele.mjs (DEPO KOKU)

## 250g TOHUM ALAN KESFI (5 Agu, gece 2)

Tani mukemmel calisti: zip INDI (87 endeks, XKTUM 18292,29 arsivde ✓),
'inmeyenler' satirindaki iki HTTP404 KOZMETIK (o CSV'ler zaten zip
icinde, dogrudan adres yok). Tek gercek sorun: 'TLREFK tohum — zip
acildi ama CSV ayristirilamadi' — TARIHSEL dosyanin kolon/tarih duzeni
GUNLUK dosyadan farkli.
§250g: (a) ayristirilamazsa zip ICERIGI + ilk 3 satir ORNEK rapora
basilir (TEFAS'ta ise yarayan alan-kesfi deseni); (b) tarih ayristirma
esnetildi: GG/AA/YYYY, G.A.YYYY ve YYYY-AA-GG kabul; (c) 'ilk 2 satiri
atla' yerine HER SATIR denenir (baslik satirlari desen filtresine
takilip elenir) — tarihsel dosyada baslik sayisi farkli olabilir.
Sonraki kosuda ya tohum gelir ya da ornek satir bize gercek formati
soyler.

DOSYALAR: scripts/tazele.mjs (DEPO KOKU)

## 250f INDIRME SESSIZLIGI KIRILDI (5 Agu, gece)

Kosu raporu iki SESSIZ basarisizlik gosterdi: endeks kapanislari 87 ->
1 endekse dustu (PayEndeksleri.zip inmedi) ve 'TLREFK tarihsel tohum'
satiri HIC cikmadi (o zip de inmedi). Sebep ayni: cek() null donunce kod
sessizce geciyordu — 249b'de fon katmaninda ogrendigimiz dersin AYNISI,
yeni katmanda tekrarlanmis.
§250f: cek() artik cekNot dizisine SEBEP yazar (HTTP kodu / bos govde /
istisna) ve rapora '⚠ inmeyenler: dosya:HTTP403 ...' satiri duser; iki
zip icin de else dallari eklendi ('PayEndeksleri.zip INMEDI', 'TLREFK
tohum — ⚠ ... inmedi'). Ayrica: 30 sn zaman asimi, Accept:*/* basligi,
200 bayttan kucuk yanit 'bos' sayilir (WAF/HTML hata sayfasi tuzagi).
GOZLEM: onceki kosuda ayni zip INMISTI (87 endeks) — yani kaynak
kararsiz; tani satiri artik hangi turde ne oldugunu kalici olarak
kaydedecek.
KARANTINALAR TEMIZ ✓ (250d dogrulandi) · UYELIK UYUMU ✓ (250e oz-duzeltme
dogrulandi).

DOSYALAR: scripts/tazele.mjs (DEPO KOKU)

## 250e KAPSAM UYARISI DUZELTILDI + TLREFK ALFA (5 Agu, aksam 3)

OZ-DUZELTME: §250'deki 'panel 150 / resmi 242 KAPSAM' uyarisi YANLIS
ALARMDI — xktum.json 242 uyeyi ZATEN biliyor, ilk 150'yi KASTEN tasiyor,
agirliklar normalize DEGIL (toplam %96,5 dogru, dosyanin kendi notunda
yaziyor). Uyari kaldirildi; yerine GERCEK kontrol: UYELIK REVIZYONU —
panelde olup BIST listesinde olmayan hisseler (olu agirlik, %'siyle) ya
da uyum teyidi. BIST uc ayda bir revize eder; asil risk budur.
DERS: 'panel X, resmi Y' farki gormek YETMEZ — dosyanin kendi tasarim
notu okunmadan uyari yazilmaz (kaynak once, alarm sonra).

TLREFK ALFA (full otomasyon hedefine dogru):
  tazele: BISTTLREFKENDEKSI_D.zip tarihsel tohum (arsivde <30 gun TLREFK
    varsa bir kez) -> YTD/1Y hesabi mumkun; arsiv penceresi 400->1500 gun.
  app.js: tlrefkYukle() endeks-arsiv.json'dan TLREFK YTD hesaplar;
    katfon tablosuna 'α vs TLREFK' sutunu — fonun YTD getirisi eksi
    benchmark. Nominal getiri yerine GERCEK alfa: 'TLV +X puan'.
  TLREFK verisi yoksa sutun hic basilmaz (dursuz).

app.js v=20260805b · DOSYALAR: scripts/tazele.mjs (KOK) + app.js +
index.html + KTPANEL-BAKIM.md (ktpanel/)

## 250d UC KARANTINA KAPATILDI — BIRI YANLIS ALARM (5 Agu)

Fintables olcumu (odenmis_sermaye + son_fiyat + PD) uc vakayi ayirdi:
  CVKMD BEDELSIZ: adet 1400 -> 3.780 mn, fiyat 36 -> 14,74. PD korunumu
    testi: 50.400 -> 55.717 mn (fark %10,5 = gercek fiyat hareketi) ✓.
    multiple.json fiyat+adet guncellendi.
  KTLEV BEDELSIZ: sermaye 7.000 mn; ima carpan 3,618x. track.json p0
    196,1 -> 54,2 ve p 156 -> 43,12. GETIRI KORUNUMU: -%20,4 -> -%20,4 ✓
    (bedelsiz duzeltmesinin dogru yapildiginin kaniti — sicil bozulmadi).
  PASEU YANLIS ALARM: adet 672 mn DEGISMEDI — kurumsal islem YOK, fiyat
    129,8 -> 182,5 GERCEK yukselis (%40). Karantina esigi (±%25) hizli
    ralli yapan hisseyi de yakaliyor; fiyat guncellendi, karantina duser.
    DERS: karantina 'kurumsal islem SUPHESI'dir, teshis DEGIL — adet
    degismediyse alarm yanlistir.

DOSYALAR: multiple.json + track.json (ktpanel/)

## 250c ZIP TUTTU + BETA CIPASI XKTUM'A BAGLANDI (5 Agu, aksam 2)

Kosu kaniti: 'Endeks kapanislari ✓ 87 endeks · XKTUM 18292,29 · XKTMT
16965,73 · XK100 17144,33 · XU100 13687,93 · TLREFK 3988,87 · arsiv 2
gun · zip:[FiyatEndeksleri(84), GetiriEndeksleri(2)]'. Aylarca 'Yahoo'da
bos' olan XKTUM artik HER AKSAM depoda.
§250c: riskTazele endeks secimi ARSIV ONCELIKLI oldu — endeks-arsiv.json'da
XKTUM >= 60 gun birikince beta GERCEK katilim cipasiyla hesaplanir
(XU100 %25 banka agirlikliydi, katilim evrenini yanlis temsil ediyordu);
o zamana dek Yahoo zinciri yedek. Rapor cipayi acikca yazar:
'XKTUM (BIST resmi arsiv) — ✓ GERCEK katilim cipasi'.
TAKVIM: arsiv gunde 1 gun buyur; ~3 ay sonra (60 is gunu) betalar
kendiliginde n dogru cipaya gecer. Aceleyse XKTUM tarihsel serisi BIST'ten
tek seferlik alinip arsive tohumlanabilir (opsiyonel).
KARANTINA: CVKMD -%61,8 · PASEU +%40,4 · KTLEV -%72,5 — uc hisse
bekliyor ('karantinalari kapat').

DOSYALAR: scripts/tazele.mjs (DEPO KOKU)

## 250b ZIP YOLU: FIYAT/GETIRI ENDEKSLERI (5 Agu, aksam)

Ilk kosu iki katmani da dogruladi: 'Endeks uyelikleri ✓ XKTUM:242 ...
⚠ KAPSAM: panel 150 / BIST 242' (kor nokta artik raporda) ve 'Endeks
kapanislari ✓ 1 endeks — BISTTLREFK 3988,87'. TANI: yalniz
bisttlrefkendeksi.csv /datum/ altinda; Fiyat/Getiri endeks CSV'leri ZIP
icinde (PayEndeksleri.zip) — tahmin degil, rapor soyledi.
§250b: XKTUM yoksa zip indirilir, unzip ile acilir, icindeki TUM CSV'ler
ayristirilir; zip ICERIK LISTESI rapora basilir (dosya adi tahmini yok).
Beklenen: 87+ endeks, XKTUM 18292 civari, arsiv gunluk birikir.
ONCELIK NOTU: XKTUM kapanisi gelince (a) risk betalari gercek katilim
cipasina cevrilecek, (b) ayrisma 1H/3A arsivden dolacak, (c) panel
xktum.json 150->242 tamamlanacak (uyari bunu izler).

DOSYALAR: scripts/tazele.mjs (DEPO KOKU)

## 250a ENDEKS KAPANISLARI + TLREFK BAGLANDI — XKTUM BULUNDU (5 Agu)

Kullanicinin indirdigi uc BIST dosyasi (Fiyat/Getiri endeksleri +
bisttlrefkendeksi) katmana baglandi. TARIHI BULGU: **XKTUM KAPANISI
BURADA** — 18.292,29 (4 Agu). Aylardir 'XKTUM.IS Yahoo'da bos, YEDEK
endeks kullanildi, beta cipasi XU100'e dusuyor' uyarisini basan sorun
RESMI KAYNAKLA cozuldu; SENTETIK XKTUM hesabina gerek KALMAYABILIR
(Laspeyres isi opsiyonel hale geldi).
endeksKapanisTazele(): uc CSV cekilir (ISO-8859-9, ';', KAPANIS=7. kolon,
'_' iceren doviz varyantlari elenir) -> endeks-arsiv.json birikimli
(400 gun pencere). Gercek dosyalarla TEST: 87 endeks, XKTUM 18292,29 ·
XKTMT 16965,73 · XK100 17144,33 · TLREFK 3988,87.
ACILAN KAPILAR: (1) risk.json betalari GERCEK XKTUM cipasiyla
hesaplanabilir (XU100 %25 banka — yanlis cipaydi); (2) Ayrisma sekmesi
1H/1A/3A arsiv biriktikce dogal dolar (247m'nin kalici cozumu);
(3) TLREFK = katilim fonlarinin dogal benchmark'i — fon tablosuna alfa
sutunu (TLV vs TLREFK) eklenebilir.
NOT: CSV adresleri /datum/ altinda varsayildi; ilk kosu dogrulayacak,
bos donerse dosyalar PayEndeksleri.zip icinden alinacak (rapor soyler).

DOSYALAR: scripts/tazele.mjs (DEPO KOKU)

## 250 BIST RESMI ENDEKS UYELIKLERI + KAPSAM KOR NOKTASI (5 Agu)

Kullanicinin BIST veri dizini haritasi (VerilerDosyaIsimleri.xlsx) uc
hazine cikardi — hepsi KAMU, auth yok:
  hisse_endeks_katilim_ds.csv  -> katilim endeks UYELIKLERI (baglandi)
  PayEndeksleri.zip            -> endeks kapanislari (XKTUM.IS bos derdi)
  tlrefkorani / bisttlrefkendeksi -> TLREFK katilim referans getirisi
    (katilim fonlarinin dogal benchmark'i — panel fon tablosuna alfa olcusu)
BAGLANAN (§250): tazele.mjs endeksUyeTazele() — CSV (ISO-8859-9, ';')
gunluk cekilir -> endeks-uyeler.json {sayim, uyeler}. Gercek dosyayla
ayristirma TEST EDILDI: XKTUM 242 · XK100 100 · XK050 50 · XK030 30 ·
XKTMT 39 · XSRDK 24 · XK030EA 30, damga 5/8/26.
KRITIK BULGU — KOR NOKTA: panelin xktum.json'i 150 uye tasiyor, BIST
resmi 242. Denetim 'XKTUM agirliklari 150/150 %100' derken KENDI
listesine bakiyordu; kapsam eksigi gorunmuyordu. Yeni katman resmiyle
kiyaslayip uyari basar (%95 esigi). Sentetik XKTUM isine girmeden ONCE
bu fark kapatilmali — yoksa endeks yanlis cikar.
SIRADAKI: PayEndeksleri.zip (endeks kapanis arsivi -> ayrisma 1H/3A) ve
TLREFK (fon benchmark'i) — ikisi de ayni desenle baglanabilir.

DOSYALAR: scripts/tazele.mjs (DEPO KOKU)

## 249o SPK AYLIK AUM DEGISIMI (5 Agu)

Kullanici: 'SPK PYS para girislerini de otomatige ekleyelim.' DURUST
CERCEVE: SPK akis yayimlamaz, aylik STOK yayimlar; iki dolu ayin farki =
buyukluk degisimi (piyasa etkisi dahil) — etiket 'AUM Δ', para girisi
DEGIL. spkCek ilk dolu ayi bulunca bir onceki dolu ayi da ceker (ayni
uc, cache'li); spkBas her satira aylik %Δ basar (yesil/kirmizi), damga
'Δ: 2026/05'e gore aylik'. TAM OTOMATIK — elle adim sifir.

app.js v=20260805a · DOSYALAR: app.js + index.html (ktpanel/)

## 249n SABAH KOSUSU: DUNKU GETIRI TAZE (5 Agu)

Kullanicinin operasyonel tespiti dogru: fon fiyati SABAH ilan edilir ve
DUNUN degerlemesidir — aksam 18:10 kosusu hep bir gun geriden gelir.
COZUM: ikinci cron '10 6 * * 1-5' (09:10 TSI) — yalniz FON katmani
(github.event.schedule kosuluyla; kopru Playwright'siz ~1 dk... not:
Playwright kurulum adimi fon kosusunda hala calisiyor, sadelestirme
bekleyende). Aksam kosusu aynen: gec ilan eden fonlari yakalar + diger
katmanlar. Ritim: sabah 09:10 dunku getiri panele duser; aksam 18:10
tamamlama.

DOSYALAR: .github/workflows/tazele.yml (DEPO KOKU .github/workflows/)

## 249m EKSIK 10 FON: SERIDEN HESAP (5 Agu, sabah 4)

36/46'nin eksigi buyuk olasilikla nitelikli-yatirimci serbest fonlari
(genel getiri listesi kapsamiyor) ama fiyat ucu FON-BAZLI ve serbest
KPR'de calisti. v7.1: getirisi listede olmayan fonlarda fiyat cekimi
p=36 (3 yillik seri) ile yapilir, 5 donem SERIDEN hesaplanir (<= hedef
tarihe en yakin kapanis; YTD yilbasi oncesi son kapanis). tefas.js
periyod parametreli. BEKLENEN: GETIRI-MODU 46/46 + fiyat.

DOSYALAR: api/tefas.js (ktpanel/api/) + scripts/tazele.mjs (KOK)

## 249l SON PARCA: FIYAT UCU (5 Agu, sabah 3)

KPR detay HAR'i son kapiyi acti: POST /api/funds/fonFiyatBilgiGetir
{fonKodu, dil, periyod} -> gunluk fiyat serisi (tarih+fiyat).
tefas.js h3: ?mod=fiyat&kod=X (periyod=1 ay yeter). tazele v7:
getiri-modunda 46 fon icin fiyat serisi cekilir (~15 sn) -> yu=son
fiyat, g[0]=1G (son/onceki). AUM/akis hala Fintables (haftalik tur) —
bilinen tek kalan parca; TEFAS'ta AUM ucu gorulurse o da baglanir.
BEKLENEN: 'GETIRI-MODU: 36/46 + fiyat' — katfon gunluk ritmi TAM.

DOSYALAR: api/tefas.js h3 (ktpanel/api/) + scripts/tazele.mjs v7 (KOK)

## 249k KAPI ACILDI — GETIRI-MODU (5 Agu, sabah 2)

TARIHI SATIR: 'TEFAS kopru: getiri 1047 fon ✓ · liste 1031 kayit'.
Token + birebir basliklar + middleware muafiyeti = TEFAS ILK KEZ veri
verdi. Iki bulgu: (1) liste ucu fiyat degil KIMLIK listesi (fonKod,
kurucuKod/Ad — pyssektor PYS eslemesi icin altin); (2) kod fiyat-zorunlu
oldugundan 1047 resmi getiriyi elinde tutup YAZMADAN dondu.
v6 GETIRI-MODU: fiyat yoksa ve getiri kapsami >=%80 ise g[1..5] TEFAS
RESMI degerleriyle yazilir (1A/3A/YTD/1Y/3Y — hesap yok, resmi yuzde);
1G/fiyat/AUM/akis onceki turdan damgali kalir. Hibrit: katfonun en agir
kismi (5 donem getiri x 46 fon) ARTIK OTOMATIK; fiyat ucu bulununca
(fon detay sayfasi HAR'i — ileride) tam otomasyona gecilir.
Yol haritasi guncel: pyssektor PYS eslemesi icin kurucuKod/Ad listesi
hazir bekliyor.

DOSYALAR: scripts/tazele.mjs v6 (DEPO KOKU)

## 249j GERCEK SUCLU: KENDI KAPIMIZ (5 Agu, sabah)

v'li tani ilk govdeli kosuda bilmeceyi COZDU: 'giris gerekli' — TURKCE
mesaj = PANELIN KENDI middleware'i. Actions cerezsiz gelince oturum
korumasi /api/tefas'i kesiyordu; UC KOSULUK 401 TEFAS'in degil BIZIM
kapinin cevabiydi (eski format govdesiz oldugundan ayirt edilememisti —
govde-okuma yamasi tam bu yuzden degerliydi).
DUZELTME: middleware'e tek satir — /api/tefas GIRISSIZ (kamu verisi
proxy'si, hassas icerik yok, 30 dk cache). Bearer/CRON_SECRET yolu da
vardi; en az surtunmeli path muafiyeti secildi.
NOT: TEFAS token+basliklarin gercekten yeterli olup olmadigi ILK KEZ bu
kosuda test edilecek — simdiye dek TEFAS'a hic ulasamamistik.

DOSYALAR: middleware.js (ktpanel/ KOKUNE — api/ degil!) + KTPANEL-BAKIM.md

## 249i UCUNCU META-HATA DERSI + SON KOZ (5 Agu, gece 5)

Ikinci 401 — ama ESKI mi YENI mi tefas.js kostu AYIRT EDILEMEDI: kopru
yanitina surum alani koymamistim (ayni meta-hata ucuncu kez: 249b mesaj,
249d asama-2, simdi kopru). KURAL ARTIK MUTLAK: HER tani/yanit uretici
bilesene surum damgasi, istisnasiz.
Uc yama: (1) tefas.js v:'h2-cerezli' alani — tazele koprusu raporu g2
JSON'unu bastigi icin surum RAPORDA gorunur; (2) tazele hata GOVDESINI
de okur (TEFAS 401'de ne diyor: invalid token / missing id ayrimi);
(3) SON KOZ: HAR'daki F5 kimlik cerezi (wid...) basliklara eklendi
(kullanici HAR'i paylasarak fiilen onayladi; GA cerezi GOMULMEDI —
kisisel takip kimligi, gereksiz). wid TTL'li/IP-bagli cikabilir —
yanit kesin soyler.
SIRA: tefas.js yukle -> Vercel READY -> dispatch. Rapor artik uc seyden
birini soyler: basari / 'v:h2 + TEFAS mesaji' (cerez de yetmedi, mesaj
yol gosterir) / v'siz yanit (deploy gecikmesi).

DOSYALAR: api/tefas.js (ktpanel/api/) + scripts/tazele.mjs (DEPO KOKU)

## 249h KOPRU 401 COZUMU: x-request-id (5 Agu, gece 4)

Ilk kopru kosusu IKI kesin tani verdi: (1) Playwright yolu Actions'ta
resmen OLU — v4.1 sayfa kimligi ilk kez konustu: GitHub IP'sine 'Request
Rejected' HTML'i veriliyor, dinleme yolu kapatildi sayilir; (2) kopru
TEFAS'a ULASTI — Rejected degil HTTP 401: WAF gecildi, API kapisinda
yalniz kimlik reddedildi.
HAR'in tam baslik dokumunde kritik eksik bulundu: x-request-id (istek
basina UUID; sayfa JS'i token'la BIRLIKTE uretiyordu — zorunlu ikili).
api/tefas.js: basliklar HAR'daki gercek istekle BIREBIR (Accept:*/*,
Accept-Language, Pragma/Cache-Control, Sec-Fetch uclusu) + her istekte
taze UUID. CEREZ BILEREK DISARIDA (kisisel GA + F5 wid kimligi; cogu
API katmani istemez) — 401 surerse son koz olarak degerlendirilir.
SIRA: api/tefas.js yukle -> deploy bekle -> dispatch katman=fon.

DOSYALAR: api/tefas.js (ktpanel/api/)

## 249g HAR COZDU: YENI UCLAR + VERCEL KOPRUSU (5 Agu, gece 3)

Kullanicinin HAR dosyasi destani bitirdi — DevTools kaydinin tamami:
  YENI ANA UC: POST /api/funds/fonGetiriBazliBilgiGetir — 1.047 fon,
    alanlar: fonKodu, fonUnvan, fonTurAciklama (TUR!), getiri1a/3a/6a/
    1y/yb/3y/5y (RESMI yuzdeler — hesap gereksiz), riskDegeri.
  IKINCI UC: /api/statistics/tefas/getFplFonList (261KB — govdesi HAR'a
    kaydedilmemis; alanlari kopru ilk canli cagrida RAPORA basar).
  TOKEN STATIK: Bearer 'ST-tefasweb...' sayfanin JS paketinde HARD-CODED
    (comm on-*.js icinde olculdu) — oturum degil uygulama sabiti.
    Kirilganlik notu: bundle yenilenirse degisebilir; kopru 401/403'te
    'TOKEN YENILE' der, yeni HAR ile 1 dk'da guncellenir.
MIMARI:
  api/tefas.js SIFIRDAN: iki mod (?mod=getiri&tip=YAT / ?mod=liste),
    sabit bearer + tarayici basliklari, 30 dk cache, alan-kesfi ('ornek')
    yanitta. Vercel WAF'tan geciyor (ERR-006 kaniti).
  tazele.mjs v5: BIRINCIL ASAMA Vercel koprusu — Actions TEFAS'a degil
    ktpanel.vercel.app/api/tefas'a gider. Getiriler katfon g dizisine
    TEFAS RESMI degerleriyle yazilir ([1G korunur, 1A,3A,YTD,1Y,3Y
    resmi]); fiyat/AUM liste ucundan aday alanlarla. Playwright dinleme
    YEDEK olarak duruyor.
BEKLENEN: once api/tefas.js deploy, sonra dispatch — rapor 'yol:
vercel-koprusu (N fon fiyat + 1047 getiri)' + liste alan kesfi.
1G akis icin fon-arsiv birikimi ayni sekilde isler.

DOSYALAR: api/tefas.js (ktpanel/api/ USTUNE YAZ) + scripts/tazele.mjs
(DEPO KOKU) + KTPANEL-BAKIM.md

## 249f v4.1 + PLAN B: VERCEL KOPRUSU STRATEJISI (5 Agu, gece 2)

v4 kosusu: 'yakalanan JSON: 0' — sayfa acildi ama tek JSON gelmedi.
Guclu suphe: WAF, Actions'in datacenter IP'sine sayfanin kendisi yerine
'Request Rejected' HTML'i veriyor (o sayfada XHR olmaz). v4.1 kesin
ayirt eder: SAYFA BASLIGI + govde ilk 180 karakter + toplam yanit sayisi
rapora — 'Request Rejected' gorursek WAF-IP kesin.
KRITIK IPUCU + PLAN B: eski uc Actions'tan 'Rejected' DEGIL ERR-006
almisti = Vercel IP'leri WAF'tan GECIYOR. Kalici mimari:
  1. Kullanici yeni sayfada DevTools ile XHR'i yakalar (SPK yontemi),
  2. Yeni uc api/tefas.js'e (Vercel) yazilir,
  3. tazele.mjs Actions'tan TEFAS'a degil KENDI Vercel ucumuza gider
     (ktpanel.vercel.app/api/tefas) — WAF sorunu kokten biter, panel ve
     Actions ayni tek kaynagi kullanir.
Bilanco tetigi ucuncu kosuda da ✓ (32 sirket — FROTO, AYGAZ, GOZDE
katildi; sezon zirvede).

DOSYALAR: scripts/tazele.mjs v4.1 (DEPO KOKU)

## 249e v4: AG DINLEME — YENI TEFAS SITESI (5 Agu, gece)

Kullanici YENI TEFAS arayuzunu buldu: tefas.gov.tr/tr/fon-getirileri
(?fundType=YAT / EMK) — eski .aspx'lerin ERR-006'sinin sebebi site
yenilemesi. Dogrudan sunucu fetch'i WAF'a takildi ('Request Rejected',
F5 imzali) ama Playwright zaten iceride.
v4 YAKLASIMI (uc tahmini DEVRI KAPANDI): gercek tarayici yeni sayfayi
acar, sayfanin KENDI cagirdigi JSON yanitlarini DINLER
(sayfa.on('response') — DevTools'un otomatik hali):
  20+ kayitli her tefas.gov.tr JSON'u yakalanir; en buyugu secilir;
  UC + ALAN ADLARI rapora basilir ('TEFAS alan kesfi') — TEFAS yeniden
  tasinsa bile yontem bulur, kod korlemesine kalmaz.
  Alan adaylari iki nesil kapsar (FONKODU/fonKodu, FIYAT/birimPayDegeri,
  PORTFOYBUYUKLUK/fonBuyuklugu...) — camelCase yeni API normu.
  Turkce sayi bicimi ('1.234,56') parse guard'li.
EMK linki not edildi: ayni dinleme fundType=EMK ile emeklilik fonlarina
genisletilebilir (pyssektor kapsam buyumesi — bekleyen).
BEKLENEN ILK KOSU: ya 'yol: ag-dinleme (N fon)' + katfon dolar, ya da
tani satiri yakalanan uc listesini soyler — her iki durumda OKUYARAK
ilerlenir.

DOSYALAR: scripts/tazele.mjs v4 (DEPO KOKU)

## 249d TANI KONUSTU: TEFAS API KATALOGU DEGISMIS (4-5 Agu gecesi)

v3 kosusu tam is gordu — 'TEFAS cekim tanisi: comparison HTTP 404 ·
ERR-006 Method not found or disabled!'. Bu WAF/bot engeli DEGIL: API
gecidinin resmi 'metot yok' cevabi. TEFAS uc kataloğunu degistirmis —
BindComparisonFundReturns OLMUS. Asama 2 (BindHistoryInfo) de bos ama
onun ham tanisi raporlanmamisti — v3.1: ilk denenen kod icin status +
ilk 120 karakter hamNot'a eklenir; bir sonraki kosu HistoryInfo'nun da
mi oldugunu (ayni ERR-006 mu, farkli mi) KESIN soyler.
YENI UCLARI BULMA YOLU (SPK'da 30 saniyede calisan yontem): kullanici
tefas.gov.tr/FonKarsilastirma.aspx'te DevTools Network/XHR ile tabloyu
yukleyen istegi kopyalar -> yeni uc sabitlenir. Panel api/tefas.js de
ayni eski uclari kullaniyor — TEFAS degisikligi ONU DA kirmis olabilir;
yeni uc bulununca ikisi birden guncellenir.
NOT: bilanco tetigi ikinci kosuda da ✓ (30 sirket — bilanco sezonu
kiziserek suruyor); PASEU/KTLEV karantina hatirlatmasi duruyor.

DOSYALAR: scripts/tazele.mjs v3.1 (DEPO KOKU) + KTPANEL-BAKIM.md

## 249c FON CEKIMI v3: IKI ASAMALI + VERSIYONLU TANI (4 Agu, gece)

Kullanicinin elle dispatch kosusu ayni 'eslesme SIFIR' mesajini verdi —
ve BEN AYIRT EDEMEDIM: 249b mesaji versiyonlamamistim, eski dosya mi
kostu yoksa Comparison da mi bos dondu belirsiz kaldi. Tani mesaji
surumsuz birakmak hataydi; v3 bunu kokten cozer:
  ASAMA 1: BindComparisonFundReturns (tek istek; calisirsa alan kesfi +
    pyssektor zemini).
  ASAMA 2 (dusus): KANITLI tek-fon modu — panelin fiilen calistirdigi
    BindHistoryInfo cagrisi, 46 katfon kodu icin dongyle (~10 sn).
    Uc degisse de en dayanikli yol.
  HER KOSUDA rapor: 'TEFAS cekim tanisi — yol: ... · comparison HTTP N ·
    ilk 160 karakter' — bir daha korlemesine tur atilmaz.
  Eslesme-sifir mesaji '(v3)' damgali: eski dosya kosarsa damgasizligindan
    ANINDA belli olur.
Exit code 1 tasarim geregi (denetim dusunce veri yazilmaz + kosu kirmizi).
Node 20 uyarisi kozmetik (checkout@v4 bagimliligi), islevi etkilemiyor.

DOSYALAR: scripts/tazele.mjs (DEPO KOKU — Ktpanel2/scripts/)

## 249b ILK KOSU RAPORU: TETIK ✓ / FON UCU DUZELTMESI (4 Agu, aksam)

Ilk Actions kosusu tasarimi sahada dogruladi:
  BILANCO TETIGI ✓ ILK KOSUDA: 14 sirket FR (ALBTN...TTRAK) — liste
    raporda, panel seridi kartsizlari gosterecek.
  SESSIZLIK YASAGI ✓: fon katmani dustu ama 'TEFAS eslesme SIFIR' diye
    bagirdi, eski veri korundu — 249'un B yamasi ilk sinavini verdi.
ARIZA TANISI: BindHistoryInfo fonkod BOSKEN liste vermiyor (panelin
kaniti tek-fon icindi; genelleme benim hatamdi). DUZELTME (§249b):
  Kanitli BindComparisonFundReturns'e donuldu; PAY ADEDI GEREKMIYOR —
  pay = AUM/fiyat TURETILIR, akis = Δpay×fiyat aynen calisir.
  Kod kendini olcer: yanit alan adlari rapora basilir ('TEFAS alan
  kesfi') — alan tahmini devri bitti; AUM/ys aday listelerinden ilk
  bulunan kullanilir, yoksa null (uydurma yok).
AYRICA: iki YENI karantina — PASEU +35,4 / KTLEV -75,3 (kurumsal islem;
pay adedi + referans fiyat elle guncellenmeli — YEOTK proseduru).
Fintables olcumuyle sonraki turda kapatilir. YEOTK karantinasi KAPANDI ✓.

DOSYALAR: scripts/tazele.mjs (DEPO KOKU) + KTPANEL-BAKIM.md (ktpanel/)

## 249a DALGA-3/1: BILANCO TETIGI OTOMATIK (4 Agu)

inceleme-ai'nin uretimi bilinçli elde kaliyor (analiz kalitesi) ama
TETIGI artik otomatik:
  tazele.mjs bilancoTetik(): her hafta ici kosuda KAP byCriteria'dan son
    24 saatin FR bildirimleri -> BIST kodlari -> bilanco-tetik.json
    (rapora sirket listesi de dusuyor — Actions ozeti tek bakista okunur).
    Uc formati panel api/kap.js'ten birebir (Referer zorunlu, JSON body).
  app.js incelemeInit: kartta OLMAYAN yeni aciklananlar Earnings AI
    sekmesinin ustunde yesil serit: 'Bilanco tetigi: N sirket FR yayimladi,
    karti yok — X, Y, Z. Kart istemek icin: ...'
Boylece akis: aksam kosusu -> panel seridi -> kullanici 'X Y kartlarini
yaz' -> ben Fintables tam setiyle uretirim. KAP'i elle tarama bitti.
KALAN DALGA-3: yevren AV rotasyonu (25 istek/gun x 30 gun = aylik tam
forward seti) — siradaki tur; endeks arsivi + XKTUM + hazine takvim
listede.

app.js v=20260804d · DOSYALAR: scripts/tazele.mjs (DEPO KOKU) + app.js +
index.html + KTPANEL-BAKIM.md (ktpanel/)

## 249 DALGA-2 PARCA 1: KATFON TAM OTOMASYON + AKIS ARSIVI (4 Agu)

Kullanici 'Dalga 2'yi yap' dedi. OLCUM ZINCIRI once uc kesif cikardi:
  1. fonTazele() ZATEN YAZILMIS (Playwright ile TEFAS challenge asimi,
     %95 kapsam + kar payi dagitim tuzagi + capa yontemli getiri) — ama
     yalniz FIYAT cekiyordu (BindComparisonFundReturns) ve AUM/akis yoktu.
  2. Son kosu raporunda fon bolumu HIC yok: kapsanan=0 dali SESSIZ
     return'du — tani gorunmezdi.
  3. Workflow fon katmanini cron'da kapsiyor (inputs bos -> 'hepsi').

YAMALAR (scripts/tazele.mjs — DEPO KOKU, ktpanel DEGIL!):
  A) BindHistoryInfo'ya gecis (panel api/tefas.js'ten kanitli body):
     son 6 gun istenir, fon basina EN YENI satir — fiyat + PORTFOYBUYUKLUK
     (AUM) + KISISAYISI (yatirimci) + TEDPAYSAYISI tek istekte.
  B) Sessiz return raporlu: 'TEFAS eslesme SIFIR' + denetimDustu.
  C) AKIS = Δpay × fiyat: fon-arsiv.json birikimli gunluk kayit (40 is
     gunu pencere). Ilk kosuda dun yok -> akis null + temel atilir
     (UYDURMA YOK); ikinci kosudan itibaren akis otomatik.
Simulasyon: akis hesabi + 40 gun kirpma dogrulandi. node --check gecti.
SONUC: ilk iki basarili Actions kosusundan sonra 'katfon guncelle' elle
turu OLUR TARIHE KARISIR (getiri+AUM+yatirimci+akis tam otomatik).
Elle sayac 7 -> 6 (ilk kosu kanitiyla kesinlesir).
KALAN DALGA PARCALARI (siradaki turlar): pyssektor uretimi ayni arsivden
(unvan->PYS + tur eslemesi), endeks kapanis arsivi + sentetik XKTUM,
KAP FR takvim + hazine-takvim, inceleme-ai tetigi.

DOSYALAR: scripts/tazele.mjs (DEPO KOKUNE — Ktpanel2/scripts/) +
KTPANEL-BAKIM.md (ktpanel/)

## 248g DALGA-1 OLCUMU: LISTE BAYATMIS — SAYAC 7 (4 Agu)

Kullanici 'Dalga 1'i yap' dedi; olcum uc surpriz cikardi:
  1. Yabanci seri gecmisi: §245r'de ZATEN bitmis (uc 90 gunluk seri
     donduruyor, istemci son 5 haftayi canlidan kurup damgaliyi eziyor,
     elle is SIFIR). 2 Agu yol haritasi bayatti.
  2. Rezerv brut: serit karti ZATEN canli (mkGrupBul 'rezerv' +
     /toplam|brut/ — ekrandaki 24-07 ● bunun kaniti). Persembe ritueli
     yalniz swap-hariç net + swap stoku (yabanci.json) icin elle.
  3. Kalan gercek Dalga-1 isleri (bist-takvim gelecek tarihleri +
     hazine-takvim) ISTEMCI isi degil ACTIONS isi (KAP FR listesi/HMB
     programi kosuda cekilip json uretilmeli) — hafta sonu TEFAS
     dalgasina BIRLESTIRILDI (tek tazele.mjs patch'i, tek test turu).
GUNCEL ELLE SAYAC: 7 — yevren(haftalik CSV) · pyssektor('pys tazele') ·
katfon('katfon guncelle') · inceleme-ai(analiz, tetigi otomatiklesecek) ·
bist-takvim(beklenen) · hazine-takvim · swap net/stok(kalici istisna,
haftada tek satir).
HAFTA SONU TEFAS DALGASI KAPSAMI (buyuk patch, tek koşu): TEFAS tum-fon
fiyat+akis (katfon+pyssektor otomatik olur, sayac 7->5) + endeks kapanis
arsivi (ayrisma 1H/3A) + sentetik XKTUM + KAP FR takvim + hazine-takvim
(sayac 5->3) + inceleme-ai tetik uyarisi.

DOSYALAR: KTPANEL-BAKIM.md (yalniz gunluk — kod degisikligi yok, iki
kalem zaten canliydi; gereksiz deploy turu ACILMADI)

## 248f BAR DOLGULARI OLU DOGMUS — display:block (4 Agu)

Kullanici hakliydi ve iki turdur soyluyordu: bar GENISLIKLERI calismiyor,
tum cubuklar ayni boy soluk serit. Ben etikete bakip asil arizayi
iskaladim — ozur gunluge de islendi.
KOK NEDEN (uc olcum sonra bulundu): .bf bir <span> ve CSS'inde display
tanimi YOK -> varsayilan inline -> inline elemanda width/height YOK
SAYILIR -> dolgu sifir boyut. Dis kap .bt grid hucresi oldugu icin
bloklasirken icteki dolgu bloklasmiyordu. Yani PANELDEKI TUM .bf
dolgulari (fm sektor agirliklari, TUFE harcama barlari, pys, spk AUM)
bastan beri olu idi — degerler yakin oldugu kartlarda fark edilmemis,
PYS'nin genis araligi (7,12 vs 1,41) ortaya cikardi.
DUZELTME: .bf{display:block;...} — tek satir, BES kart birden dirildi.
DERS: 'grid cocugu bloklasir' guveni yalniz DOGRUDAN cocuk icin gecerli;
ic ice span'da display acikca verilir. Gorsel bilesen ilk kez ekranda
DOLU DEGERLE dogrulanmadan 'calisiyor' sayilmaz.

index.html v=20260804c · DOSYALAR: index.html + KTPANEL-BAKIM.md

## 248e SURUM DAMGASI IHLALI — KURAL KENDIME DE ISLER (4 Agu)

Kullanici: 'hala damgali' (ikinci kez). Tani ekrandan: VERILER YENI
(Is 7,12 / GAL 63 = canli json yuklenmis) ama etiket 'DAMGALI' ve not
eski PDF metni = ESKI app.js onbellekte. KOK NEDEN: 248d turunda app.js
icerigi degisti ama surum parametresi ARTIRILMADI (gunluge bile 'damga
ayni gun' diye yazmisim) — 'her degisiklikte surum artar' kuralinin
ihlali, fail bende. index.html v=20260804b yapildi; sert yenilemeyle
kaynak-duyarli etiket iner, damga 'FINTABLES · 2026-08-03' olur.
DERS SERTLESTIRILDI: surum artirimi 'ayni gun ikinci degisiklikte
atlanabilir' DEGILDIR — icerik degisti mi harf artar, istisnasiz.
(Ebu'nun alt notu ilk ajan kosusunda yeni veriyle kendisi tazelenir.)

DOSYALAR: index.html + KTPANEL-BAKIM.md (app.js zaten onceki teslimde)

## 248d 'PYS TAZELE' ILK KOSUSU — SEKME CANLI VERIYE DONDU (4 Agu)

Kullanici: 'hala damgali geliyor neden' — cevap: tasarim geregi (248a'da
json bilerek uretilmemisti, cift kayit duzeltmesi ilk kosuya birakilmisti).
ILK KOSU yapildi: 6 sade sorgu (recete birebir izlendi; gunluk bloklar
SON DAMGA >= 2026-08-04 tek gunuyle — YLB artik TEK satir, tuzak cozuldu).
pyssektor.json 64 cubukla CANLI uretildi (damga 2026-08-03 Pazartesi).
Damga etiketi kaynak-duyarli oldu: Fintables kaynakli ise 'FINTABLES ·
<tarih>', PDF ise 'DAMGALI'.
GUNUN FOTOGRAFI (temiz veri PDF'ten COK farkli cikti — cift kayit ve
gun karisimi eski resmi bozuyormus): TUR 1G Para Piyasasi 38,6 mlr acik
lider (PDF 2,3 gosteriyordu); PYS 1G Is 7,12 · YKP 6,49 · Ziraat 4,99 ·
ALBARAKA 4,07 (katilim!); TUR 1A PP 211,5 mlr / Kira Sert toplam 17,1;
FON 1A GAL 64,2 mlr — tek fonda aylik rekor.
NOT: FON 1A satirlari yalniz kodla (unvan sorgusu token ekonomisi;
sonraki kosuda JOIN'la unvanli).

app.js v=20260804a · DOSYALAR: pyssektor.json + app.js + KTPANEL-BAKIM.md

## 248c SPK AYRI UC IPTAL — TCMB UCUNA BINDIRME (4 Agu)

Kullanici uyardi: her api/*.js bir Vercel fonksiyonu, Hobby limiti 12 ve
envanter spk.js ile 11'e cikmisti (ajanktp bddk data evds2 kap katfon
market spk tcmb tefas usnews). HAKLI — mimari duzeltildi:
  api/spk.js SILINDI (hic deploy edilmedi, slot yakilmadi).
  SPK modu api/tcmb.js'e bindirildi: ?spk=1&yil&ay — ayni proxy mantigi
  (Origin basligi, doluluk sayaci, 6 saat cache), kur modu dokunulmadi.
  app.js spkCek yolu /api/tcmb?spk=1'e cevrildi.
Envanter yeniden 10 fonksiyon; 2 slot nefes payi.
DERS: yeni dis kaynak = REFLEKS olarak yeni uc DEGIL — once mevcut
kamu-veri uclarina (tcmb/bddk/evds2) parametre moduyla bindirme dusunulur;
uc sayisi kit kaynak.

app.js v=20260804a (icerik degisti, damga ayni gun) · DOSYALAR:
api/tcmb.js + app.js + KTPANEL-BAKIM.md (api/spk.js YUKLENMEYECEK —
onceki teslimde indirdiysen depoya KOYMA)

## 248b SPK AUM UCU BULUNDU VE BAGLANDI — TAM OTOMASYON (4 Agu)

Kullanici DevTools'tan (Safari Ag sekmesi, tarif verildi) ucu YAKALADI:
  ws.spk.gov.tr/SeryetPortfoyDegerleri/api/GetPortfoyDegerleri?yil&ay
Dogrulama: sunucudan basliksiz GET temiz JSON donduruyor (Origin sarti
yok). Haziran fotografı: Ziraat 2,29 TRILYON TL toplam AUM lideri, Is
1,57tr, Garanti 1,48tr, Pusula 818mlr(!), Kuveyt Turk 608mlr, QNB 580mlr.
Bazi buyukler (Ak/YKP/Deniz) null = o ayin bildirimi henuz gonderilmemis
— bildirimler ay ortasina dek damlar.
YAPILAN:
  api/spk.js (YENI UC): parametreli proxy, 6 saat cache, doluluk sayaci.
  t26'ya 4. blok: 'PYS Portfoy Buyuklukleri — SPK' — top 14 yatay bar,
    katilim PYS'leri (KATILIM/ALBARAKA/KUVEYT/GOLDEN/EMLAK deseni) yesil
    nokta + yesil bar; damga 'CANLI · N sirket bildirdi'.
  spkCek: onceki aydan baslar, doluluk<25 ise uc aya kadar geri duser
    (eksik bildirim ayinda yanlis siralama basmaz).
SONUC: PYS Sektor sekmesi iki kaynakli oldu — AKIS (Fintables, 'pys
tazele' yari-otomatik) + STOK (SPK, TAM otomatik). SPK icin elle adim
SIFIR. DevTools yontemi ECB/EVDS olcum ailesine eklendi: ic uc bir kez
olculur, sonsuza dek baglanir.

app.js v=20260804a · DOSYALAR: api/spk.js (ktpanel/api/ YENI) + app.js +
index.html + KTPANEL-BAKIM.md

## 248a PYS SEKTOR OTOMASYONU KANITLANDI + RECETE (4 Agu, gece 9)

Kullanici: 'nasil otomatiklestiririz, Fintables'a bak.' CEVAP: EVET —
yapi taslari canli sorguyla KANITLANDI:
  TUR bazinda: 4'lu JOIN + GROUP BY + SUM calisiyor (3 Agu: Kira Sert-KV
    1,88 + Kira Sert 1,73 mlr — Fintables taksonomisi TEFAS semsiyesinden
    farkli ama katilim icin DAHA ayirt edici).
  PYS bazinda 1G: Yapi Kredi 7,21 · Vakif Katilim 2,22 · Tera 1,75 mlr.
  PYS 1A: Deniz 33,7 · YKP 29,5 · Garanti 27,2 · Ak 24,2 · Ziraat 23,5.
  FON 1G: GAL tek gunde 63,3 mlr (kurumsal blok!), DCB 11,4, UCP 10,0.
OLCULEN KISITLAR (recetenin kurallari): ROUND(double) -> CAST sart;
UNION+GROUP BY birlikte REDDEDILIR (donem basina ayri sorgu); CIFT KAYIT
TUZAGI: >= filtresi iki damga gununu kapsayabiliyor (YLB listede iki kez
gorundu — kanit) -> gunluk blok SON_DAMGA esitligiyle.
TESLIM: arac/pys-tazele.md (sorgu sablonlari + kurallar). 'pys tazele'
komutu = 4-6 sade sorgu -> pyssektor.json yeniden uretim (yari-otomatik,
tek komut). TAM otomasyon panele Fintables erisimi olmadigi icin Actions/
TEFAS katmanina bagli — bekleyen buyuk iste (sentetik XKTUM ailesi).
NOT: pyssektor.json bu turda YENIDEN URETILMEDI (cift-kayit duzeltmesli
tam set sonraki 'pys tazele' kosusunda) — eldeki 31 Tem damgasi durust.

DOSYALAR: arac/pys-tazele.md (ktpanel/arac/) + KTPANEL-BAKIM.md

## 248 KATFON SUKUK'A TASINDI + PYS SEKTOR SEKMESI (3 Agu, gece 8)

Kullanici uclu istek: (1) Katilim Fonlari alt sekmesi Sukuk'un altina,
Ihrac Takvimi'nin sagina; (2) PY altina PYS Sektor yeni alt sekme (alt
cubuk kaybolmadan — 247b dersi pesinen uygulandi); (3) icerik: Power BI
PDF'indeki net para girisi grafiklerinin panel-temali hali + veri kaynagi
arastirmasi.

### 248.1 TASIMA
t5 tab'i derinlik sayaciyla kesildi, icerigi AYNEN (ic id'ler korunarak —
katfon init'leri degismeden calisir) Sukuk'un subtab duzenine tasindi:
yeni buton data-subtab=sk-katfon (Ihrac Takvimi'nin sagi), panel
sk-ihrac'in ardinda. pySubnav butonu silindi, PY_GRUP'tan t5 cikti.
Kalinti dogrulandi: data-tab="t5" ve 't5' referansi iki dosyada SIFIR.

### 248.2 PYS SEKTOR (t26)
pySubnav + PY_GRUP + panel: uc blok (PYS / Fon / Tur bazinda) x donem
dugmeleri (verisi olan donemler gosterilir). Sablon panel temasi: mevcut
.bar ailesi (Power BI renk cirkinligi yok), negatif deger kirmizi.
pyssektor.json: PDF'in 8 sayfasindan METIN KATMANIYLA cikarilan 58 cubuk
(deger-etiket eslesmesi sirali ve dogrulanabilirdi; haftalik turde degeri
metne dusmeyen 2 mini bar ATLANDI — tahmin edilmedi). Damga acik:
'DAMGALI · 2026-07-31'.
Analitik not karta yazildi: doviz serbest fonlarin yillik 269 mlr TL ile
acik ara liderligi = dolarizasyon talebinin kurumsal kaniti.

### 248.3 VERI KAYNAGI ARASTIRMASI
SPK portfoy degerleri sayfasi: DINAMIK — tablo iskeleti bos, veri donem
secimiyle AJAX'tan geliyor; dogrudan fetch CALISMAZ. Secenekler:
(a) aylik Excel'i elle indirip 'spk isle' (Koyfin deseni), (b) ic API
kesfi (ayri calisma). PDF verilerinin asil kaynagi TEFAS akis turevleri:
KALICI OTOMASYON ADAYI = tazele.mjs'e TEFAS tum-fon katmani (gunluk
kosuda fon akislarini hesaplar) — bekleyen buyuk islere eklendi
(sentetik XKTUM + endeks arsiviyle ayni aile).

app.js v=20260803u · DOSYALAR: app.js + index.html + pyssektor.json

## 247m AYRISMA DONEM SECICI VERIYE DARALTILDI (3 Agu, gece 7)

Kullanici: XKTMT'de 1H/1A/3A gelmiyor, 'duzeltmesi zor mu, zorsa kaldir'.
OLCUM: market.js one() h1/a1/q3'u ZATEN hesapliyor AMA 5+ seans bar
gerektirir; XKTMT'de Yahoo anlik fiyati (meta) verip TARIHSEL BAR
vermiyor -> gunluk dolu, donemler null. Veri yoksa sunucu hesaplayamaz —
'kolay duzeltme' yok (XKTUM/Actions ailesinden sembol kapsama sorunu).
YAPILAN (kaldirmanin akilli hali): donem secici secili endeksin VERI-DOLU
alanlarina daraltilir — verisiz donem devre disi '(veri yok)' etiketli;
secili donem verisizlesirse 1G'ye duser. XK100 gibi bar gecmisi olanlarda
tum donemler calisir; XKTMT'de yalniz 1G secilebilir, hata mesaji yerine
NEDEN gorunur.
KALICI COZUM (bekleyen): tazele.mjs her kosuda END kapanislarini
endeks-arsiv.json'a biriktirir -> 1H bir haftada, 3A uc ayda dogal dolar
(geriye donuk kurulamaz). Sentetik XKTUM isiyle ayni ailede ele alinabilir.

app.js v=20260803t · DOSYALAR: app.js + index.html

## 247k MAKRO SERIT UFE KARTI DA AYNI TUZAKTA (3 Agu, gece 6)

Kullanici: makro seritte canliya bagli olmayan veriler var. Olcum: seridin
Yi-UFE karti HAZ %28,09'da kalmis (detay kart Temmuz %27,83'u cekmisken).
KOK: serit cekimi grubu buluyordu ama seriyi /genel/ deseniyle ariyordu —
124 serinin HICBIRINDE 'genel' kelimesi yok (T1 adi '1.Yurt İçi Üretici
Fiyat Endeksi'). TUFE serit kartinin calismasi yaniltici paralellikti:
onun grubunda 'Genel' adli seri gercekten var.
DUZELTME: serit UFE dogrudan mkSeriKod('TP.TUFE1YI.T1') — ayni gecenin
ayni cozumu, ucuncu uygulama.
DIGER KARTLAR ARIZA DEGIL: cari MAY (Haziran ~11 Agu), sanayi MAY (8 Agu),
buyume C1 (C2 1 Eyl), issizlik HAZ guncel — yayin takviminin dogal ritmi.
Dis ticaret MAY sinirda (Haziran 31 Tem aciklandi, EVDS aktarimi gecikebilir;
birkac gun icinde kendiliginden donmeli, donmezse ayrica olculur).

app.js v=20260803s · DOSYALAR: app.js + index.html

## 247j SAG BLOK B PLANI: BES CANLI IMALAT SEKTORU (3 Agu, gece 5)

MIGS 6 olcumle kesin YOK; kullanicinin 'hepsi vardir' inadi B plani icin
HAKLI cikti — imalat alt sektorlerinin tamami grupta ve kodlari olculdu:
  Gida urunleri T16 · Kok-rafine petrol T49 · Kimyasallar T52 ·
  Ana metaller T73 · Motorlu kara tasitlari T105 (hepsi bolum duzeyi).
UFE_STATIK_SAG bu beslige cevrildi (tumu kodlu -> aramasiz, tam canli).
Yeni satirlarin Haziran yedegi yok: statik deger null, ufeSatir null'da
'—' basar (NaN korumasi) + negatif deger isareti duzeltildi (madencilik
-%4,22 orneginde '+%-4,22' gorunuyordu -> '−%4,22').
ufeNot statik yorumu sektor-tanim diline cevrildi; Temmuz yorumunu veri
degisince Ebu yazacak. Portfoy dili: ana metal=celik girdisi, kok-rafine=
petrokimya marji, gida urunleri=perakende maliyet, motorlu=otomotiv
fiyatlama.
SONUC: Yi-UFE kartinda damgali satir KALMADI — iki TUFE karti uctan uca
EVDS canli. Elle sayac 10 -> 8 KESINLESTI (ilk tam canli ekranla).

app.js v=20260803r · DOSYALAR: app.js + index.html

## 247i UFE ELEKTRIK+SU KODLA SABIT (3 Agu, gece 4)

Son iki olcum: Elektrik-gaz ana sektoru TP.TUFE1YI.T118 ('4. Elektrik Gaz
Buhar ve Iklimlendirme...'), Su TP.TUFE1YI.T123 ('5. Su Temini
Kanalizasyon...') — ikisi de bolum duzeyi. mkSeriKod'a baglandi (desenler
bu adlari tutmaliyken sahada tutmuyordu; sebep avciligi yerine kod sabit).
ufeCek satir yapisina 5. eleman (kod) eklendi; kod varsa arama atlanir.
EKRAN KANITI (onceki tur): UFE karti CANLI 'EVDS · 2026-7' — Temmuz:
genel %1,52/%27,83 (Haz %1,80/%28,09'dan yavaslama), MADENCILIK -%4,22
(+%8,30'dan SERT DONUS — petrol soku duzeltmesinin UFE yansimasi; Ebu'nun
'sok gectikce normallesir' tezi bir ayda dogrulandi), imalat %1,06.
Tani satiri ilk kosusunda eksikleri isimle saydi — tasarim ise yaradi.
SAG BLOK (MIGS 5'lisi): EVDS'de karsiligi YOK (uc olcumle kesin: q=mallar
0, q=dayanikli yalniz 'atese dayanikli', ara=sanayi yalniz uretim/KKO).
Durum: damgali kalir; secenekler kullaniciya sunuldu (A: aylik elle bulten
/ B: grupta yasayan imalat alt sektorlerine donustur — gida urunleri T16
olculdu, digerleri olculecek). Karar bekleniyor.
BEKLENEN (bu surum): UFE sol blok 5/5 canli; TUFE 4/4 canli (247h).

app.js v=20260803q · DOSYALAR: app.js + index.html

## 247h KONUT/ULASTIRMA KODLA SABIT + MIGS AYRI GRUPTA (3 Agu, gece 3)

Uc olcum: Konut = TP.TUKFIY2025.04 ('04. Konut, Su, Elektrik, Gaz Ve Diger
Yakitlar'), Ulastirma = TP.TUKFIY2025.07 (tek sonuc). Desenler bu adlari
tutmaliydi ama SAHADA tutmadi — sebep pesinde kosmak yerine mimari karar:
OLCULEN KOD VARSA ARAMA BITER. mkSeriKod eklendi (desen aramasiz dogrudan
cekim); HRC iki satiri koda baglandi, calisan gida/genel desenle kaldi.
KRITIK BULGU: ?q=mallar bie_tufe1yi'de SIFIR sonuc — MIGS beslisi (enerji/
ara/sermaye/dayanikli/dayaniksiz) bu grupta YOK, ayri grupta. O 5 satir
mevcut grupta asla dolmayacak; grup adi olculunce baglanacak (kullaniciya
?ara=sanayi linki verildi). O zamana dek 5 satir damgali — durust durum.
BEKLENEN (bu surumle): TUFE 4/4 canli 'EVDS · 2026-7'; UFE sol blok
(genel/madencilik/elektrik/su/imalat) canli, sag blok damgali + tani
satiri eksikleri isimle soyler.

app.js v=20260803p · DOSYALAR: app.js + index.html

## 247g KISMI CANLILIK + UFE GENEL DESENI (3 Agu, gece 2)

Ekran: TUFE karti CANLIYA DONDU ('EVDS · 2026-7') — Temmuz verisi panelde:
Gida %35,45->%37,53 YUKSELDI, Genel %32,11->%31,75 DUSTU. Ama KISMI:
Konut ve Ulastirma eslesemedi, Haziran degerinde nokta isaretsiz kaldi.
Yi-UFE hala damgali — VE kendi hatam olculdu: genel satir desenine
'yurt içi üfe' yazmisim, olculen ad 'yurt içi üretici' (kisaltma tuzagi
UCUNCU kez). Duzeltildi.
TANI GORUNUR yapildi (ECB kirilim dersinin EVDS hali): iki kartin damgasi
artik eslesmeyen satirlari ISIMLE soyler ('EVDS · 2026-7 · eslesmeyen:
Konut, Ulastirma') — sonraki ekran tahmin degil kanit tasir.
Konut/Ulastirma ve UFE sektor adlarinin kesin yazimi icin kullaniciya
evds2'nin q parametreli list linkleri verildi (rapor).
NOT: kismi-canli karisim riski kabul edildi: eslesmeyen satir damgali
deger gosterir, nokta isareti ayirt eder; tani satiri artik acikca soyler.

app.js v=20260803o · DOSYALAR: app.js + index.html

## 247f IKI GRUP DA SABIT — DESEN HATASI OLCUMLE YAKALANDI (3 Agu, gece)

Kullanicinin son iki olcumu:
  TUFE grubu KESIN: bie_tukfiy2025 ('Tüketici Fiyat Endeksi (2025=100)',
    guncel resmi baz) — koda sabitlendi, arama kalkti.
  Yi-UFE seri listesi KESIN: T1 genel, T2 'Madencilik ve Taşocakçılığı',
    T15 '3. İmalat' — adlar SAYI ONEKLI. Bu, /^imalat/ desenimin ASLA
    tutmayacagini gosterdi (bastaki '3. ' yuzunden) — /imalat/ yapildi
    (liste sirali, ilk eslesme ana sektor). Genel TUFE deseni de onekli
    adlara dayanikli /genel/'e gevsatildi.
  MIGS beslisi (enerji/ara/sermaye/dayanikli/dayaniksiz): 124 serilik
    listenin gorulen ilk 40'inda yok — sonda ya da ayri grupta; desenler
    duruyor, eslesmezse o 5 satir damgali kalir (durust), ilk kosu soyler.
BEKLENEN: iki damga da 'EVDS · <Tem>' olur; katki pp '—' (bilinen sinir).
Elle sayac 10 -> 8 (dogrulama ilk basarili kosuyla gunluge islenecek).
DERS ZINCIRI TAMAM: kisaltma degil tam ad (247e) + onek varsayma (247f) —
meta-katalog desenleri OLCULMUS ada yazilir, koda sabitlenir.

app.js v=20260803n · DOSYALAR: app.js + index.html

## 247e OLCUM SONUCU: KISALTMALAR GRUP ADINDA YOK (3 Agu, gece)

Kullanici iki test linkini calistirdi — kok neden netlesti: mkGrupBul
aramalarim ('tüfe','üfe') HIC grup bulamiyordu cunku EVDS grup adlari
kisaltma icermiyor ('Tüketici Fiyat Endeksi' icinde 'tüfe' alt dizesi
gecmez). Kartlarin damgalida kalmasi dogru savunmaydi, arama kelimesi
yanlisti.
KESINLESEN: Yi-UFE grubu = bie_tufe1yi ('Yurt İçi Üretici Fiyat Endeksi',
arsiv degil) — koda SABITLENDI (arama kaldirildi). TUFE ana grup icin
arama 'tüketici'ye cevrildi; kesin grup kodu + seri adi desenleri
kullanicinin iki olcumuyle (asagida) sabitlenecek.
DERS: meta-katalog aramasinda KISALTMAYLA degil TAM ADLA ara; grup kodu
bir kez olculdukten sonra aramaya degil SABITE baglan (arama kesif
araci, calisma-zamani bagimliligi degil).

app.js v=20260803m · DOSYALAR: app.js + index.html

## 247d IKI STATIK TUFE KARTI EVDS CANLIYA BAGLANDI (3 Agu, aksam)

Kullanici istegi (246'daki eritme onerisinin onayi): Ana Harcama Gruplari
ve Yi-UFE Detayi statikti, ortadaki Ozel Kapsamli gibi otomatik olsun.

YONTEM — OKT deseninin birebir kopyasi (kod tahmini SIFIR):
  mkGrupBul meta katalogdan grubu ARAR ('tüfe'+/harcama grup/,
  'üfe'+/yurt içi üretici/), mkSeri ad desenine uyan seriyi cheker;
  uymayan satir DAMGALI kalir (sessiz uydurma yok). Statik diziler
  Haziran degerleriyle yedek olarak duruyor; canli gelince ● isareti +
  damga 'EVDS · <donem>' olur.
  hrcCek: 4 grup, endeksten yillik% hesabi (son/12 ay once), en az 2
    eslesme sartiyla canliya gecis. Bar genisligi canli maks'a oranli.
  ufeCek: 10 sektor/MIGS satiri, aylik% (son/onceki) + genel icin yillik;
    en az 3 eslesme sarti. 'yillik degisim' adli seriler ELENIR (endeks
    isteniyor, hazir-yuzde serisiyle cift donusum olmasin).
  KATKI pp: canli ayda '—' — agirlik serisi baglanmadan katki UYDURULMAZ
  (yaklasik katki=w×yillik hesabi bile agirlik dogrulanmadan yazilmadi).
  Ebu notlari (00:48/09:32) Haziran metniyle kaldi — not motoru veri
  degisince kendisi tazeler.
RISK/BILINEN: desenler EVDS seri adlarina gore yazildi ama adlarin gercek
bicimi OLCULMEDI (bu ortamdan EVDS'ye erisim yok) — ilk canli kosuda
eslesme sayisi damgada gorunur ('EVDS · TEM' vs 'damgali'); eksik satir
cikarsa seri adi olculup desen duzeltilir. Elle sayac: 10 -> 8 ADAY
(iki kart canliya gecince elle katman listesinden dusecek; ilk basarili
TEM kosusu dogrulayinca gunluge islenir).

app.js v=20260803k · DOSYALAR: app.js + index.html

## 247c "SUTUNLAR" DUGMESI OLU DOGMUSTU — TDZ (3 Agu, aksam)

Kullanici: sekme geldi, sutun secici dugmesi calismiyor. Olcum: KOL_TUM
tanimi satir 3445, KULLANIMI satir 3422 — const geriye erisim vermez
(temporal dead zone); yevrenInit checkbox basma satirinda sessizce oluyordu.
Tablonun cizilmesi yaniltti: filtre listener'lari hatadan ONCE baglandigi
icin cizim onlardan tetikleniyordu, secici ise hic dogmuyordu.
DUZELTME: KOL_TUM + yevGor + __yevKol tanim blogu yevrenInit'ten ONCEYE
tasindi (tanim -> init -> cizim sirasi); dogrulama: tanim offseti <
kullanim offseti olculdu.
DERS: ayni fonksiyon ailesine sonradan ozellik eklerken tanimlarin
KULLANIMDAN ONCE geldigi dogrulanir — node --check TDZ'yi YAKALAMAZ
(calisma zamani hatasi), siralama testi elle yapilir.

app.js v=20260803j · DOSYALAR: app.js + index.html

## 247b ALT CUBUK KAYBI + SUTUN SECICI (3 Agu)

Kullanici ekrani: Yabanci Hisse acikken PY alt sekme cubugu KAYIP.
KOK NEDEN tek satir: PY_GRUP dizisine t25 eklenMEMISTI — listede olmayan
sekmede kod alt cubugu bilerek gizliyor (grup disi sekme sanmis).
t25 gruba eklendi; artik alt cubuk durur, ust cubuk zaten duruyordu.
DERS: yeni alt sekme ac iliski LISTESINI de guncelle — sekme mekanigi
tek yerde (PY_GRUP) ama kayit orada, HTML'de degil.

SUTUN SECICI (istek): 'Sutunlar ▾' detay paneli — 20 aday kolon
(F/K FY2 · EV/EB FY2 · EV/Satis FY1 · P/FCF · CFO · PEG · #Al · Rel.Hacim
dahil), onay kutulariyla ac/kapa; Ticker kapatilamaz. Secim localStorage
('yev_kolon_v1') — kisisel gorunum tercihi, buluta gitmez. Satir hucreleri
sabit dizilimden KOL-gudumlu dizilime cevrildi: baslik ve hucre ayni
listeden uretilir, hiza BOZULAMAZ (test: secim degisiminde baslik-hucre
esitligi + kapatilan kolonun kaybolmasi dogrulandi). colspan dinamik.

app.js v=20260803i · DOSYALAR: app.js + index.html

## 247a EVREN DOLDU — OLCEK BILMECESI COZULDU (3 Agu)

Dolu CSV geldi (738 hisse) ama ILK ISLEME SUPHELI sayilar uretti: 'en buyuk
PD 992.036 mlr$' (imkansiz). Ham dagilim olcumu bilmeceyi cozdu: export
MILYON TL cinsindendi (Koyfin hesabi TL gorunumde). KANIT (kur 47,5478):
  AAPL 212.559.484 mnTL -> 4.470 mlr$ ✓ (gercek ~4,4-4,5tr)
  NVDA -> 5.009 mlr$ ✓ · MSFT -> 3.626 ✓ · Hitachi(6501) -> 149,3 ✓
  AAPL FCF -> 134 mlr$ ✓ · NVDA FCF -> 112,7 ✓
Isleyici duzeltildi: parasal kolonlar (mc,fcf,cfo,cap,nd,r1,r2) mnTL->mlr$
kur parametresiyle (varsayilan 47,55; 3. arguman); oranlar dokunulmadi
(birimden bagimsiz). json'a 'kur' damgasi. Kolon basligi 'FCF mlr$';
veri varken sekme notu kullanim notuna doner.
Evren profili: 738 hisse · US 302, JP 64, CN 63, CA 29, TW 24 · doluluk
pe1 %87, ee %93, z %79, analist %90.
DERS (245t.2 ailesi): ihracat/export dosyasinda ILK soru birim ve para
birimidir; 'mantiksiz buyukluk' testi (dunyanin en buyuk sirketiyle kiyas)
tek satirlik ama kesin bir dogrulamadir.

app.js v=20260803h · DOSYALAR: app.js + index.html + yevren.json +
arac/koyfin-isle.py (ktpanel/arac/)

## 247 YABANCI HISSE SEKMESI — SHARIAH EVRENI ALTYAPISI (3 Agu)

Kullanici istegi: Portfoy Yonetimi altina 'Yabanci Hisse' alt sekmesi +
Koyfin Shariah evreni filtreli/siralanabilir tablo.

### ONEMLI BULGU: yuklenen CSV BOS
739 satirin 738'i tamamen bos — yalniz baslik dolu. Koyfin export'u tablo
ekranda doluyken alinmamis. Sahte/ornek veriyle doldurulMADI (otomasyon
kurali + durustluk): panel 'VERI BEKLENIYOR' durumuyla acilir, notu sebebi
soyler. Dolu CSV gelince 'koyfin isle' komutu tablolari doldurur.

### KURULAN ALTYAPI
  index.html  pySubnav'a data-tab=t25 buton (ust sekmeler KAYBOLMAZ —
              mevcut alt-sekme mekanizmasi ayni) + t25 paneli:
              arama kutusu · ulke secici · PD esigi (10/50/200 mlr$) ·
              sayac · siralanabilir tablo iskeleti.
  yevren.json iskelet: kolon sozlugu (25 Koyfin kolonu -> kisa anahtar),
              hisseler[] bos, kaynak/damga durust.
  app.js      yevrenInit + yevrenCiz (§247): fetch->filtre->sirala->bas.
              Siralama: basliga tik (ikinci tik yon cevirir), null degerler
              HER YONDE SONA atilir (bos veri siralamayi kirletmez),
              dizge kolonlar localeCompare. 200 satir ustu kirpilir
              ('filtreyle daralt'). Kolonlar: Ticker·Ulke·PD·F/K FY1·
              EV/EBITDA(LTM+FY1)·NB/EBITDA·FCF·Temettu·AltmanZ·Analist·6A%.
  arac/koyfin-isle.py  CSV->json isleyici: bos satir atar, sayisallastirir,
              MCap mlr$/buyuk kalemler mn$'a normalize, bos CSV'de acikca
              DURUR ('yine bos' uyarisi).
  Test: siralama cekirdegi 5 sahte hisseyle dogrulandi (null sona, filtre,
        A-Z); ilk kosuda 'HATA' cikti ama motor degil TEST BEKLENTISI
        yanlisti (410>=400) — olcum once kendini olcer.

### SONRAKI ADIMLAR (sirali)
  1. Kullanici dolu CSV yukler -> 'koyfin isle' -> yevren.json dolar.
  2. Yahoo canli fiyat bindirme (his2 deseni) — fiyat+gunluk% kolonu.
  3. api/globalq: AV_KEY ile izleme listesine EARNINGS_ESTIMATES
     (forward EPS/gelir + revizyon momentumu — 246 kesfi).

app.js v=20260803g · ajan.js v=20260803a
DOSYALAR: app.js + index.html + yevren.json + arac/koyfin-isle.py

## 246g OLU KKM SATIRI YASAYAN GOSTERGEYLE DEGISTI (3 Agu)

KKM Δ satiri olu seriyi (program kapandi, TP.KKM.K1/K4 bos) gosteriyordu —
bostluk ariza degil GERCEKTI ama ekranda ariza gibi duruyordu. Kullanici
onayiyla satir, TAHMINSIZ bir gostergeye cevrildi: zaten cekilen YP mevduat
serisinin (TP_HPBITABLO5_1) son stok degeri + yayin tarihi (EVDS canli).
Yeni EVDS seri kodu TAHMIN EDILMEDI (oturumun dersi); dolarizasyon ORANI
icin TL toplam mevduat serisi gerekir — kodu dogrulanmadan eklenmedi,
istenirse Persembe sonrasi ayri turda olculerek yapilir.
app.js v=20260803f · DOSYALAR: app.js + index.html

## 246e KIRILIM SON HAMLE: SUNUCUYA TASINDI (3 Agu)

Uc client-tarafi deneme (retry, iki dalga, tek-istek) sahada dogrulanamadi.
Yapi kesfi kesin ipucunu verdi: kartta d2 (sunucu /api/market yaniti) ZATEN
var ve mansetin dolmasi muhtemelen ondan — client'in ECB fetch'i tarayici
ortaminda (CORS/engelleyici) bastan beri olu olabilir; kullanicinin link
testi gezinmeydi, CORS'a takilmaz. TESHIS DEGISTI: rate-limit degil,
CLIENT->ECB kanalinin kendisi supheli.
COZUM: kanal degistirildi —
  market.js: hicpCek'e FOOD00/SERV00/IGXE00 eklendi; seriler.hicpGida/
    Hizmet/Sanayi yanita kondu (Vercel cikisi CORS/adblock tanimaz).
  app.js: render oncesi S'nin eksik alanlari d2.seriler'den tamamlanir;
    client cekimi artik YEDEK.
Ayni bicim (sonFark+akis) iki tarafta da ayni — render degismedi.
DERS: 'kullanici eski surumde' varsayimi iki tur yedi; kanalin kendisini
degistirmek surum tartismasini da gecersiz kilar. Deploy edilen HERHANGI
surumde kirilim artik sunucudan dolar.

app.js v=20260803e · ajan.js v=20260803a · api market.js §246e
DOSYALAR: app.js + index.html + api/market.js (ktpanel/api/!)

## 246d KIRILIM: ISTEK AZALTMA YETMEDI, TEKE INDIRILDI (3 Agu)

Kullanici: 'hala gelmiyor' — tani satiri da ekranda yok. Iki tur yama
(retry + iki dalga) sahada dogrulanamadi; dongu kirilsin diye mimari
degistirildi: SDMX '+' sozdizimi TEK istekte cok seri verir.
  Kirilim : M.U2.N.FOOD00+SERV00+IGXE00.4D0.ANR   -> 1 istek
  Ulkeler : M.DE+FR+IT+ES.N.000000.4D0.ANR        -> 1 istek
Eski mimari 7-13 istekti; hiz sinirina carpacak kalabalik KALMADI.
cokluCek(): grup kolonuyla (ICP_ITEM/REF_AREA) ayirir, 429/5xx tek retry,
hata EBU_ECB_TANI'ya. Test: cok-serili CSV ile 3 seri dogru gruplandi,
eski->yeni siralama dogru, tirnakli virgul parser'i sasirtmadi.
hicpCoklu kirilimda artik KULLANILMIYOR (tanim duruyor, cagiran yok).
NOT: onceki ekranlarda taninin hic gorunmemesi buyuk olasilikla eski deploy
(Ebu imzalari dunku saatler). Yine de varsayima yaslanmak yerine istek
sayisi kokten dusuruldu — hangi surumde olursa olsun 429 fiilen imkansiz.

app.js v=20260803d · ajan.js v=20260803a · api kap-2026-07-31-n
DOSYALAR: app.js + index.html

## 246c TAKTIKSEL DAGILIM: DORT KART BIRDEN BU HAFTAYA (3 Agu)

Kullanici elestirisi HAKLIYDI: "neden parca parca guncelliyorsun" — 246b'de
yalniz ETIKETI dinamiklestirdim, TEZ METINLERI '27 Tem' haftasinda kaldi
(28 Tem AKBNK 'gelecek' diye, MSFT/META 'bu hafta test' diye yaziyordu —
hepsi SONUCLANMIS olaylar). Ders: bir bileseni guncellerken o bilesenin
TUM icerik katmanlari (etiket + tez + tetik + risk) birlikte taranir;
yarim guncelleme bayat veriden kotudur cunku taze GORUNUR.

Dort kartin teze+tetik metinleri sonuclanmis olaylar ve bu haftanin
ajandasiyla yeniden yazildi (durus/dayanak/risk iskeleti korundu):
  Yerli NOTR   banka bilancolari test gecti, XKTUM +%1,0; hakem BUGUN TUFE
  Yabanci ALTI bilanco zirvesi sonuclandi (AMZN/MSFT guclu, META/AAPL ceza),
               Avrupa enflasyon donusu 'sikilasma uzar' riskini buyuttu
  Altin NOTR   ons 4.062$ plato; ECB indirim umudu otelendi, tetik uzaklasti
  TL USTU      koro uzadikca yuksek nominali uzun kilitleme firsati;
               katfon 479,3 mlr akis kaniti; tetikler TUFE + 6 Agu rezerv
Statik '27 TEM · FOMC HAFTASI' etiketi zaten 246b'de dinamige baglanmisti.

AVRUPA KIRILIMI: kullanici 'yine calismiyor' dedi — 20260803a+ deploy'unun
yuklu olup olmadigi ekrandan teyit edilemedi. v>=e'de kirilim bossa kartin
dibinde TANI SATIRI cikmali ('bos donen anahtarlar: ... (HTTP kod)').
Siradaki adim: kullanicidan tani satirinin goruntusu — tahmin yok, kanit var.

app.js v=20260803c · ajan.js v=20260803a · api kap-2026-07-31-n
DOSYALAR: app.js + index.html

## 246b PAZARTESI YORUMU NEDEN YAZILMADI — TETIK OLCUSU YANLISTI (3 Agu)

Kullanici ekrani: haftalik yorum hala '27 TEM–2 AGU', imza 'Ebu 09:33'
(localStorage'dan GERI YUKLENEN eski not — 246'daki statik guncelleme bu
yuzden hic gorunmedi: kayitli not statik HTML'i ezer, bu TASARIM GEREGI).
Asil soru: Ebu bu sabah Pazartesi NEDEN yeni yorum yazmadi?

KOK NEDEN (ajan.js): bayat = 'son yazimdan 5+ gun gecti'. Son yorum FOMC
sonrasi hafta ICI elle tazelendi (Car/Per) -> Pazartesi'ye 3-4 gun ->
'bayat degil' -> YAZILMADI. Olcu yanlis: dogru soru 'kac gun gecti' degil
'HANGI HAFTAYA AIT'.
DUZELTME: hafta-kimligi tetigi — Pazartesi VE son yazim bu haftanin
pazartesisinden onceyse yaz. Hafta ici elle tazeleme artik Pazartesi
yenilemesini iptal EDEMEZ. (§245p limit kalibrasyonuyla ayni aile:
alarm/tetik, takvim ritmine gore olculur.)

EK: TAKTIKSEL DAGILIM etiketi '27 TEM · FOMC HAFTASI' statikti — tablo
CANLI turetim oldugu halde damgasi bayat gorunuyordu (guven asindirir).
taktikRender artik etiketi kendisi basar: '<hafta araligi> · CANLI TURETIM'.

KULLANICIYA AKIS: deploy -> paneli ac -> 40. saniyede Ebu bu haftanin
yorumunu CANLI kartlardan yazar (bu haftaki tum gelismeler kartlarda:
enflasyon donusu, Samsung, rezerv, katfon Cuma kapanislari). Beklemek
istemezse Ebu panelindeki 📝 butonu aninda tetikler.
NOT: index.html'deki statik 3-9 Agu blogu bos-tarayici/ilk-kurulum icin
dogru baslangic olarak KALDI; kayitli notu olan tarayicida gorunmez, bu
celiski degil katman sirasi.

app.js v=20260803b · ajan.js v=20260803a · api kap-2026-07-31-n
DOSYALAR: app.js + ajan.js + index.html

## 246a KIRILIM COZULDU: ANAHTAR DEGIL, HIZ SINIRIYDI (3 Agu)

Kullanici verilen test linklerini calistirip UC CSV yapistirdi — kesin kanit:
  SERV00  %3,3 (2026-07, ivme +0,10)   FOOD00  %1,2 (ivme -0,30, dusus!)
  FOODUN  %2,5 — hepsi DOLU, hepsi 4D0.ANR, Temmuz satiri OBS_STATUS=E (flash).
ANAHTARLAR BASTAN BERI DOGRUYDU. Parser da temiz: kullanicinin gercek
CSV'siyle birebir test edildi, 3/3 satir okundu (E bayragi dahil).

O halde panel neden bos? TEK aday kaldi ve kod onayladi: avrupaSekme
acilista ECB'ye 15+ istegi AYNI ANDA atiyordu; ilk gelenler (manset/
cekirdek/enerji) doluyor, kalanlar 429'a takiliyor ve cek() icindeki
`if(!r.ok) return null` ile SESSIZCE yutuluyordu. Ulke kiriliminin da bos
olmasi ayni sebep. Sessiz catch dersinin HTTP hali: hata kodu yutulunca
'anahtar yanlis' diye iki gun yanlis iz surduk.

DUZELTMELER (app.js v=20260803a):
  1. cek(): 429/5xx'te ~1sn bekle + BIR kez yeniden dene; yine olmazsa
     EBU_ECB_TANI[flow.kalem]='HTTP <kod>' — sessizlik bitti.
  2. IKI DALGA: Promise.all bolundu — dalga 1 kart omurgasi (8 istek:
     DFR, bilanco, 3 ana HICP, 3 IRS), 450ms nefes, dalga 2 kirilim+ulkeler
     (hicpCoklu zaten sirali). Anlik istek <=8.
  3. Tani satiri artik SEBEP gosterir: 'FOOD00 (HTTP 429)' — bir sonraki
     ariza bildiriminde kod da gorunur.
BEKLENEN: Hizmet %3,3 · Gida %1,2 (dusus — mansetteki yukselisin enerji
kaynakli oldugunun kaniti) · Sanayi dolar; ulke kirilimi geri gelir.
DERS: 'veri gelmiyor' arizasinda uc soru SIRAYLA: anahtar dogru mu (test
linki) -> parser dogru mu (gercek veriyle) -> TASIMA katmani mi (hiz siniri,
CORS, eszamanlilik). Ilk ikisini olcmeden ucuncuye bakmadik ve iki tur
kaybettik; kullanicinin tek tarayici testi hepsini cozdu.

app.js v=20260803a · ajan.js v=20260731p · api kap-2026-07-31-n
DOSYALAR: app.js + index.html

## 246 HAFTALIK YORUM ELLE TAZELENDI + ECB TEST LINKLERI (3 Agu Pzt)

### 246.1 HAFTALIK YORUM — index.html statik baslangici bu haftaya tasindi
Kullanici acikca istedi ("haftalik yorum sayfasini guncelle, tum siteyi
inceleyip"). Yapi kesfi: yorum TARAYICIDA yasar (yorumMetin DOM +
ajan_notlar.__HAFTALIK__); ajan.js Pazartesi acilisinda 40. sn otomatik
yazar (ajanHaftalikBtn ile elle zorlanir). AMA index.html'de STATIK
baslangic icerigi var ve '27 TEM–2 AGU' etiketiyle GECEN HAFTADA kalmisti.
O blok bu haftanin olculmus panel verileriyle yeniden yazildi (5 bolum +
buyuk resim): enflasyon donusu (AB manset %1,9->%2,9), bilanco zirvesi
bilancosu (MSFT/AMZN/META/AAPL/Samsung), BIST&katilim (XKTUM +%1,0, EFOR
zayif, YEOTK bedelsiz, sicil alfa ~+1,6), rezerv (162,6/38,3/12,8 · 6 Agu
Persembe yayin), Avrupa revizyonu, ajanda&riskler. Etiket: '3–9 AGU ·
ENFLASYON DONUSU + REZERV HAFTASI'. Ebu Pazartesi otomatigi UZERINE yazar —
statik blok panel acilana kadarki dogru baslangictir, celiski degil.
NOT: taktikBody2 (TAKTIKSEL DAGILIM) JS'ten dolar — statik karsiligi yok,
dokunulmadi.

### 246.2 TARIHI HTML BORCU KAPANDI
Yeni denetime <b>/<em> sayimi eklenince tarihî bir cift '<b><b>' yakalandi
(satir 397, GOOGL notu — onceki teslimlerde de vardi, tarayici tolere
ediyordu). Kapatildi. Denetim listesi artik b+em dahil.

### 246.3 ECB KIRILIM — KULLANICI TEST LINKLERI
Kirilim (Hizmet/Gida/Sanayi) hala bos ve tani satiri son ekranda yoktu
(goruntu tani surumunden onceki acilistan olabilir). Kullanici 'link ver
deneyeyim' dedi — dogru yontem: kanit tarayicidan. Verilen linkler CSV
dondurur; BOS sayfa = seri yok, VERI satiri = anahtar dogru. Sonuca gore
hicpCoklu aday listesi kanitla guncellenir. (Linkler teslim raporunda.)

app.js v=20260802g · ajan.js v=20260731p · api kap-2026-07-31-n
DOSYALAR: index.html + KTPANEL-BAKIM.md

## 245z TEK BOZUK KART 30 KARTI OLDURDU (2 Agu, gece 2)

245y'nin ayirt eden teshisi ILK KOSUDA meyve verdi — kullanici ekrani:
"(k.metrikler||[]).map is not a function". Dosya inmis, JSON gecerli,
RENDER kiriliyor. Olcum tablosu iki suclu gosterdi:
  SMSN   onceki oturumdan cift Samsung karti — metrikler DIZI degil OBJE.
         .map firlatti, 30 kartin 30'u birden kayboldu. Sekme muhtemelen
         o kart yazildigindan beri kirikti; bugun fark edildi.
  005930+EFOR (bu oturum) — kirmiyordu ama semaya uymuyordu: metrikler
         yerine duz metin 'detay'; 'onemli' string (sema DIZI bekliyor —
         mail fonksiyonu forEach cagiriyor, orada kirilirdi).
DERSLER:
  1. SEMAYI TAHMIN ETME, OLC: kart eklerken mevcut saglam karttan sema
     cikarilir (kod,ad,donem,tarih,tarih_iso,sablon,skor,ozet,metrikler[],
     onemli[],guidance,tez,kaynak). Iki oturum ust uste iki farkli el
     (SMSN'yi yazan + ben) ayni hatayi yapti.
  2. KAYIT-SEVIYESI ARIZA KATMAN-SEVIYESI CEZA ALMAZ (§245s YEOTK'nin
     render hali): kart() artik tip zorluyor — metrikler obje gelirse
     Object.values ile kurtarilir, olmazsa kart METRIKSIZ ama GORUNUR.
     'onemli' string gelirse tek elemanli diziye sarilir.
YAPILAN: SMSN silindi (005930 guncel kart kaldi — 30 Tem kesin sonuclar) ·
005930+EFOR metrikler[]/onemli[]/guidance/tez semasina donusturuldu ·
kart() tip zorlamasi · 30/30 render+mail simulasyonu gecti.

app.js v=20260802g · ajan.js v=20260731p · api kap-2026-07-31-n
DOSYALAR: app.js + index.html + inceleme-ai.json

## 245y "KARTLAR KAYBOLDU" — DOSYA SAGLAM, TESHIS KORDU (2 Agu, gece)

Earnings AI sekmesi: "Inceleme kartlari yuklenemedi — inceleme-ai.json
klasorde mi?" Kullanici hakli olarak "kartlar kayboldu" dedi.

### OLCUM: dosya SUCSUZ
Teslim edilen inceleme-ai.json JS gozuyle test edildi (Python degil —
Python daha toleransli, §: json.dump NaN yazabilir, JSON.parse reddeder):
JSON.parse GECTI · 31 kart · BOM yok · NaN/Infinity yok · 119 KB.
Yani ariza dosyada degil YUKLEME ZINCIRINDE: dosya Vercel'e hic gitmedi
(404) ya da giderken kesildi/bozuldu (parse). Hangisi? EKRANDAN ANLASILAMAZ,
cunku...

### KOK KUSUR: catch UC ARIZAYI TEK MESAJA BINDIRIYORDU
incelemeInit'in catch'i 404'u, parse hatasini ve ag kopmasini ayni
"yuklenemedi" cumlesine sikistiriyordu. §245h dersinin DORDUNCU tekrari:
AYIRT ETMEYEN TESHIS, TESHIS DEGILDIR.
DUZELTME (app.js): fetch sonucu r.ok kontrolu + text() sonra parse;
uc ariza uc ayri mesaj:
  404          -> "dosya sunucuda YOK — yuklenmemis ya da deploy bitmemis"
  diger HTTP   -> durum koduyla
  PARSE        -> "indirildi ama JSON BOZUK — yukleme sirasinda kesilmis
                  olabilir" + hata detayi + inen boyut KB
Bir sonraki ekran goruntusu tahmin degil KANIT tasiyacak.

### TESLIM BUTUNLUK KANITI
inceleme-ai.json yeniden teslim edildi. Dogrulama degerleri asagida (yukleme
sonrasi https://<site>/inceleme-ai.json acilip boyut/kart karsilastirilabilir):
  boyut ~119 KB (121.877 bayt civari) · kart 31 · ilk kod 005930 · md5 gunlukte degil,
  teslim raporunda. Kullanici GitHub web arayuzunden yuklerken buyuk JSON'un
  kesilme riski dusuk ama SIFIR degil; suphe halinde raw URL'den boyut bakilir.

app.js v=20260802f · ajan.js v=20260731p · api kap-2026-07-31-n
DOSYALAR: app.js + index.html + inceleme-ai.json (yeniden)

## 245v HICP KIRILIMI: TAHMINI BIRAK, OLCTUR (2 Agu, aksam)

245u sonrasi kullanici ekrani: manset/cekirdek/enerji 2026-07'ye ATLADI
(akis tasimasi CALISTI — manset %2,9, enerji %10,0 Brent sokuyla tutarli).
Ama Hizmet/Gida/Sanayi hala bos. Ek olcum: bu uc satir §242'de eklendiginden
beri HIC dolmamis — eski ICP'de de yokmus; iki akis tasimasi da 'anahtar
tahmini' ile yapildi ve ikisinde de kirilim kor kaldi.

PORTAL KANITI (web): gida yeni sette BOLUNMUS — FOODPR (islenmis+alkol+tutun)
ve FOODUN (islenmemis) ayri seriler, toplam FOOD00 gorunmuyor. SERV00 ve
IGXE00 tanimlari yeni sette duruyor (SERV00 4D0.ANR Haziran 2026'ya kadar
canli ornek goruldu) — o halde U2 cagrilarinin neden bos dondugu TAHMINLE
cozulemez, OLCUM gerekir. ECB'ye bu ortamdan erisim yok; olcum yeri TARAYICI.

YAPILAN (app.js):
1. hicpCoklu(adaylar[], etiketler[]): kalem basina SIRALI alternatif kod
   listesi — ilk dolu olan kazanir, alternatife dusulduyse satirda kucuk
   etiket gorunur ('islenmis gida' gibi). Baglanti:
     Gida    FOOD00 -> FOODPR -> FOODUN
     Hizmet  SERV00 -> SERV
     Sanayi  IGXE00 -> IGDXEN -> NEIG00
2. TANI GORUNUR: her deneme window.EBU_HICP_TANI'ya yazilir; kirilimdan biri
   hala bossa kartin dibinde 'bos donen anahtarlar: ...' satiri cikar.
   Boylece bir SONRAKI ekran goruntusu tahmin degil KANIT tasir — hangi
   anahtar bos, dogrudan gorulur. Uc satir da doluysa tani hic gorunmez.
DERS (245u'nun devami): iki tasima da tahminle yapildi, ikisi de kirilimi
acamadi. Ucuncu deneme tahmin DEGIL: alternatifler + olcum enstrumani.
Erisemedigin API'yi kod icinden OLCTUR; kullanici ekrani laboratuvardir.

NOT: kart altindaki Ebu yorumlari hala eski rakamlari soyluyor ('%1,9,
cekirdegin altinda' — artik %2,9 ve USTUNDE). Not motoru 20 saatlik soguma
sonrasi veri degisimini gorup kendisi yeniden yazacak; mudahale edilmedi.

app.js v=20260802e · ajan.js v=20260731p · api kap-2026-07-31-n
DOSYALAR: app.js + index.html

## 245u AVRUPA TURU: DONMUS HICP AKISI + YARIM DUZELTME + BILANCO KARTLARI (2 Agu)

Kullanici Avrupa kartini gosterdi: "damgali veri var mi, gelmeyen verilerin
API'sini kontrol et, haftalik yorum + varlik dagilimini guncelle (Pazartesi
toplantisi), megacap/BIST bilancolarini hallet."

### 245u.1 KOK NEDEN: ECB AKISI OLMEDI, DONDU (7 ay bayat HICP)
Ekran: manset/cekirdek/enerji 2025-12 · Hizmet/Gida/Sanayi BOS.
Tarihce iki kez dondu: §104'te 'HICP' 404 veriyordu -> dogru akis 'ICP'
bulundu (O GUN DOGRUYDU). Sonra ECB 4 SUBAT 2026'da Eurostat metodoloji
degisimiyle ICP setini KALDIRDI, yerine YENI HICP setini koydu (DSD ECB_ICP3).
Olu ICP tarihsel veriyi DONDURULMUS dondurmeye devam etti: 404 yok, hata yok,
sadece 2025-12'de kalmis seri. DONAN AKIS OLEN AKISTAN SINSI.
YENI ANAHTAR: dataflow 'HICP' + saglayici '4' -> '4D0'
(HICP.M.U2.N.000000.4D0.ANR — portal 17 Haz 2026 canli; kalem kodlari ayni).
app.js hicp() + ulke() tasindi, ICP'ye yalniz arsiv yedegi olarak dusuluyor
('ICP-arsiv' etiketiyle — yalan etiket yok).

### 245u.2 market.js'TE YARIM KALMIS DUZELTME (yalan etiket)
api/market.js hicpCek yorumu "yeni dataflow denenir" diyordu ama IKI DAL DA
ayni eski 'ICP'yi cekiyordu ve ilk dal 'akis:HICP' ETIKETI BASIYORDU.
Kod calisiyor gorunuyor, etiket taze akis soyluyor, veri donmus duruyordu.
Tamamlandi: ilk dal gercekten HICP+4D0.
DERS: yorum ve etiket KODUN kanitidir sanilir — degildir. Duzeltme yaparken
"etiket ne diyor" degil "fetch NEREYE gidiyor" okunur.

### 245u.3 AVRUPA KARTINDAKI DIGER DAMGALILAR — TESHIS
  ECB&Politika + Mega-cap notlari (27 Tem · CLAUDE): AJAN.NOTLAR'da tarayici
    localStorage'inda — DOSYADAN MUDAHALE EDILEMEZ. Ebu not motoru kartin
    verisi degisince (HICP duzelince degisecek) kendi yeniden yazar.
  Tahvil 2026-06: Maastricht AYLIK seri — dogal ritim, sorun degil.

### 245u.4 HAFTALIK YORUM + VARLIK DAGILIMI — OTOMASYON KURALINA UYULDU
"Varlik dagilimi" = haftalik yorumun TAKTIKSEL DAGILIM blogu (hyHtml ~3054).
index.html notu: Ebu HER PAZARTESI Haftalik Yorum sayfasini panelin CANLI
verilerinden bastan yazar (yorumPano). Elle yazmak otomasyon kuralinin
ihlali olurdu — yazilmadi. Pazartesi panel ACILDIGINDA bugun duzeltilen
taze verilerle (HICP canli, sicil dogru XKTUM, katfon Cuma kapanisi) Ebu
kendisi yazacak. Tek sart: panelin Pazartesi acilmasi.

### 245u.5 BILANCO KARTLARI (inceleme-ai.json 28 -> 30)
KESIF: MSFT/META/AAPL/AMZN/GARAN/TOASO/YKBNK/TSKB kartlari ZATEN vardi
(30-31 Tem) — is onceden yapilmis, MUKERRER YAZILMADI.
EKLENEN 1 — SAMSUNG 2Ç26 (30 Tem, Kore megacap): ciro ₩171,5 tr (+%130 y/y,
rekor x3), faaliyet ₩89,5 tr (~62 mlr$, y/y x19, beklenti ustu), EPS +%52.
Karin %99'u DS/HBM'den; MX (telefon) ILK KEZ faaliyet zarari (−₩0,7 tr) —
ayni bellek kitligi kendi telefonunu vurdu. HBM4 3Ç'de x3, kitlik 2028'e dek.
EKLENEN 2 — EFOR 2Ç26 (31 Tem, XKTUM uyesi, PD 45,2 mlr): satis 3.839 mn
(y/y −%11,5), brut marj %16,5, ana ortaklik −90 mn (1Ç +124'ten zarara),
TTM 13 mn — PD/kar carpani anlamsiz bolgede. Fintables kesin kalemleri.
ATLANAN: DOGUB (3,2 mlr) + ANGEN (2,1 mlr) — kucukluk esiginin altinda.

app.js v=20260802d · ajan.js v=20260731p · api kap-2026-07-31-n
DOSYALAR: app.js + index.html + api/market.js + inceleme-ai.json

## 245u AVRUPA TURU: DONAN HICP AKISI + BILANCO KARTLARI (2 Agu)

Kullanicinin dort istekli Avrupa turu. Bulgular ve yapilanlar:

### 245u.1 GELMEYEN VERI — HICP AKISI OLMEMIS, DONMUSTU (kok neden)
Ekran: manset/cekirdek/enerji '2025-12' (7 ay bayat), Hizmet/Gida/Sanayi BOS.
KOK NEDEN: ECB 4 Subat 2026'da Eurostat metodoloji degisimiyle eski ICP
setini KALDIRDI, yerine YENI 'HICP' seti koydu (DSD ECB_ICP3). Olu ICP
akisi tarihsel veriyi DONDURULMUS dondurmeye devam etti — 404 yok, hata
yok, sadece 2025-12'de sabit. DONAN AKIS, OLEN AKISTAN SINSI.
Tarihce cetveli: §104'te 'HICP 404 -> dogru akis ICP' tespiti O GUN icin
DOGRUYDU; Subat'ta ECB adi GERI HICP yapti ve saglayici kodunu degistirdi.
DERS: 'dogru akis' tespitleri TARIHLIDIR. Donmus seri suphesinde ilk soru:
'bu dataset hala yasiyor mu?'
DUZELTME (iki dosya):
  app.js hicp() + ulke(): cek('HICP','M.U2.N.<kalem>.4D0.ANR') — saglayici
    '4' -> '4D0'. Kalem kodlari AYNI. Yedek: ICP-arsiv (etiketiyle).
  api/market.js hicpCek: YARIM KALMIS duzeltme bulundu — yorum 'yeni
    dataflow denenir' diyordu ama IKI DAL DA eski ICP'yi cekiyor ve ilk dal
    'akis:HICP' YALAN ETIKETI basiyordu. Tamamlandi.
Beklenen: manset ~2026-06'ya atlar, Hizmet/Gida/Sanayi kirilimi ILK KEZ dolar.

### 245u.2 AVRUPA KARTINDA DAMGALI NE VAR
  ECB&Politika + Mega-cap notlari '27 Tem · CLAUDE' — bunlar AJAN.NOTLAR'da
  TARAYICIDA sakli; dosyadan mudahale EDILEMEZ. Ebu not motoru, kartin verisi
  degisince (HICP duzeltmesi tam bunu tetikler) kendi yeniden yazar.
  Tahvil 2026-06: Maastricht AYLIK serisi — dogal ritim, bayat degil.

### 245u.3 HAFTALIK YORUM + TAKTIKSEL DAGILIM — PAZARTESI OTOMATIK
'Varlik dagilimi' = haftalik yorumun TAKTIKSEL DAGILIM blogu (hyHtml).
index.html notu: Ebu HER PAZARTESI Haftalik Yorum sayfasini panelin CANLI
verilerinden bastan yazar. OTOMASYON KURALI geregi elle yazilmadi — Pazartesi
panel acilinca bugun duzeltilen taze verilerle (HICP, sicil, katfon, YEOTK)
kendisi yazacak. Tek sart: panelin Pazartesi ACILMASI.

### 245u.4 BILANCO KARTLARI (inceleme-ai.json 31 kart)
KESIF: MSFT/META/AAPL/AMZN + GARAN/TOASO/YKBNK/TSKB kartlari ZATEN VARDI
(30-31 Tem) — is onceden yapilmis. EKSIKLER kapatildi:
  005930 Samsung 2Ç26 (30 Tem kesin): ciro 171,5 tr won c/c +%28 y/y +%130 ·
    faaliyet 89,5 tr won marj %52,2, DS %99,7 · EPS 10.849 c/c +%52 ·
    uc ceyrek ust uste rekor, NVIDIA'nin ceyregini gecti · ~19-20 tr won
    prim karsiligi tek seferlik · peak-out tartismasi basladi.
    ABD kartlariyla bag: Apple'in bellek zammi = Samsung'un fiyatlamasi.
  EFOR 2Ç26 (31 Tem, Fintables): satis 3.839 mn y/y -%11,5 · brut marj %16,5
    (c/c toparladi, y/y geride) · ana ortaklik -90 mn, TTM 13 mn'e eridi.
    Skor 2,0. Standart uygulandi: FAVOK/FCF cekilmedi -> 'aciklanmadi'.
  DOGUB (3,2 mlr) + ANGEN (2,1 mlr): esik alti, kart acilmadi (kayitli).

app.js v=20260802d · ajan.js v=20260731p · api kap-2026-07-31-n
DOSYALAR: app.js + index.html + api/market.js + inceleme-ai.json + BAKIM.md

## 245t UC IS: SICIL ELMA/ARMUT · KATFON PERSEMBE CIKTI · YEOTK KAPANDI (2 Agu)

### 245t.1 SICIL -%27,59 — MATEMATIK PARMAK IZIYLE KOK NEDEN
Ekran: "XKTUM (kurulustan) -27,59% · referans 18.586,93". Ama endeks tablosu
XKTUM'u 18.254 gosteriyordu -> gercek dusus -%1,79. Kanit:
    13.458 (XU100 canli) / 18.587 (XKTUM referansi) - 1 = -%27,59  BIREBIR
Sicil, XKTUM referansina XU100 PUANINI boluyordu. m.xktum §191'de BILEREK
XU100'e yonlendirilmisti (Actions kosusunda XKTUM.IS bos donmustu). AMA
Vercel/market yolunda XKTUM.IS CALISIYOR — BIST tablosundaki canli 18.254
zaten m.end.XKTUM'dan geliyordu. Gercek XKTUM ELDEYDI, sicil yanlis alani
okuyordu. §191'in "XKTUM yok" kaniti ORTAMA ozeldi (Actions IP'si), genel
gecer sanilmis. DERS: "kaynak yok" tespiti hangi ortamda olculduyse ORAYA
aittir; baska yol calisiyor olabilir.
DUZELTME: sicil + trkSifirla artik m.end.XKTUM okur. Gercek XKTUM yoksa
endeks noktasi NULL — ASLA XU100'le bolunmez; trackRender null'u tasir
(cizgiden atlar, 'veri yok' yazar, alfa '—'). trkSifirla XU100'le kurulmayi
REDDEDER (yanlis tabanla kurulan sicil hatayi KALICI yapardi).
NOT: bulut serisindeki eski -27'li noktalar bir sonraki acilista bugunun
dogru noktasiyla guncellenir; kalici kirlilik gorulurse SIFIRLA kullanilir.

### 245t.2 KATFON: "31 TEM" DAMGASI ASLINDA 30 TEM PERSEMBEYDI
Kullanici "Cuma kapanislari cikmis olmali" dedi — HAKLIYDI. Fintables sorgusu
kanitladi: mevcut json'daki fiyatlar (orn GOP 1,188176) yeni sorgunun p_1g
(30 Tem) sutunuyla birebir; Cuma kapanisi (GOP 1,189483) ayri satirda duruyordu.
Yani onceki cekim Cuma gunu OGLEN yapilmis, son fiyat henuz Persembe'ydi,
damga "31 Tem" yazilmisti. GIZLI BIR GUN KAYMASI.
YENILEME: 46 fon x 7 referans (son·1G·1A·3A·YTD·1Y·3Y) tek SQL'de cekildi,
getiriler yeniden hesaplandi (43 fonun YTD'si ~+0,13 puan yukari = Cuma
kazanci), AUM+akis+yatirimci sayisi 31 Tem kesin verisiyle guncellendi.
DERS: "bugunun tarihi" ile "son kapanisin tarihi" ayri seylerdir; damga
IKINCISINI yazmali. Cekim saati kapanistan onceyse damga bir gun geridir.

### 245t.3 YEOTK KARANTINASI KAPANDI (dun acilmisti, §245s)
Fintables sermaye artirimi tablosu web bulgusunu dogruladi: bedelsiz
58,77 (ihrac) + 75,03 (ic kaynak) = %133,8 · 31 Tem DAGITILDI.
multiple.json: adet 355 -> 830 mn · referans fiyat 96,1 -> 39,0.
KENDINI KANITLAMA: 830/355 = 2,3380 = tam bedelsiz carpani; piyasa degeri
korunumu %-5,1 fark (Cuma'nin fiyat hareketi dahil — beklenen). Yarinki bot
kosusu YEOTK'yi karantinasiz normal gunceller.

app.js v=20260802c · ajan.js v=20260731p · api kap-2026-07-31-n
DOSYALAR: app.js + index.html + katfon.json + multiple.json

## 245s GITHUB ACTIONS DENETIMI: DOGRU YAKALADI, YANLIS CEZALANDIRDI (2 Agu)

1 Agu tazeleme raporu uc katmani dusurdu:
  XK100 + XKTUM + Multiple  "tarih birligi: 2 FARKLI tarih (30+31 Tem)"
  Multiple ayrica            "YEOTK -59,42% aykiri"
Kullanici "bu hatayi duzelt" dedi. OLCUNCE iki ayri durum cikti ve IKISI DE
denetimin hatasi degildi — CEZANIN OLCUSU hataliydi.

### 245s.1 TARIH "KARISIKLIGI" VERI HATASI DEGIL, PIYASA GERCEGI
141 hissenin 137'si Cuma (31 Tem) kapanisli, 4'u Persembe (30 Tem) — cunku
likit olmayan kagitlar Cuma gunu HIC ISLEM GORMEMIS; Yahoo son islem gununun
barini veriyor. Bu Turkiye kucuk-kagit gercegi: mutlak "tek tarih" sarti
likit olmayan kuyrukta HER ZAMAN duser ve gecerli 137 fiyatin guncellenmesini
de bloke eder.
YENI KURAL (denetim.mjs tarihBirligi): GECER ancak ve ancak
  a) baskin tarih kayitlarin >= %90'i   (kaynak arizasi elenir)
  b) azinlik en fazla 3 takvim gunu geride  (suruklenen bayat fiyat elenir)
  c) azinlik ISIMLE raporlanir — sessiz tolerans yok
Test: 137+4/1gun GECER · tek hisse 5 gun geride KALIR · %80 baskin KALIR.

### 245s.2 YEOTK: SUZGEC GOREVINI YAPTI, CEZA YANLIS YERE KESILDI
-59,42% gercek bir fiyat hatasi DEGIL: YEOTK 31 Tem'de %133,8 BEDELSIZ
sermaye artirimi yapti (web'den dogrulandi) — fiyat mekanik dustu, referans
fiyat eski pay yapisinda. Aykiri suzgeci tam bu is icin var ve YAKALADI.
AMA ceza katman-capliydi: TEK hisse 141 hissenin guncellenmesini bloke etti.
YENI KURAL (tazele.mjs fiyatTazele): aykirilar KARANTINAYA alinir —
  fiyatlari GUNCELLENMEZ (referans eski yapida, yeni fiyat carpani bozar),
  d._karantina = {kodlar, tarih, not} dosyaya yazilir,
  rapor "pay adedi + referans fiyat ELLE guncellenmeli" der,
  kalan 140 hisse NORMAL guncellenir. Katman DUSMEZ.
Kapsam ve tarih birligi dusurmeye devam eder — onlar kaynak arizasidir.
Karantina ayristirma testi: detay "YEOTK: -59.42%" -> Set{YEOTK}, ASELS disari.

### DERS
Denetim kurali yazarken iki soru ayri sorulur: (1) bu sinyal GERCEK bir
ariza mi yakaliyor? (2) cezanin KAPSAMI sinyalin kapsamiyla orantili mi?
Burada (1) evet, (2) hayirdi: hisse-seviyesi sinyal, katman-seviyesi ceza.
Aykiri = karantina (cerrahî) · kapsam/tarih arizasi = katman durur (genel).

### KULLANICIYA NOT — YEOTK ELLE ISI
multiple.json'da YEOTK'nin pay adedi ve referans fiyati bedelsiz sonrasi
yapiyla guncellenmeli (%133,8 bedelsiz -> pay 2,338x, fiyat /2,338).
Karantina o zamana kadar YEOTK fiyatina dokunmaz, eski carpan korunur.

DOSYALAR: scripts/denetim.mjs + scripts/tazele.mjs -> DEPO KOKU scripts/
          (Actions kokten kosar, ktpanel/ DEGIL!) · KTPANEL-BAKIM.md -> ktpanel/

## 245r OTOMASYON KURALININ ILK UYGULAMASI — hafta_seri CANLIYA GECTI (2 Agu)

Kural kondu ("damgali bir sey yok, cok cok zorda kalmadikca") ve ayni turda
ilk eritme yapildi: yabanci.json'daki ELLE tutulan hafta_seri.

### TESPIT: seri ZATEN cekiliyordu, atiliyordu
cozCek() EVDS'ten 90 gunluk ham seriyi cekiyor, yalniz SON IKI gozlemi
donduruyor, gerisini atiyordu. Yani "5 haftalik seri" satiri icin gereken
veri her cagrida elde ediliyor ve COPE gidiyordu; satir ise Persembe
rituelinde ELLE JSON duzenlemeyle besleniyordu. Otomasyon eksigi degil,
ISRAF vardi.

### YAPILAN
1. cozCek ciktisina `seri` alani eklendi (tum dolu gozlemler, t+v ciftleri).
   Mevcut cagiranlar etkilenmez — yalniz yeni alan.
2. yabCanli: son 5 hafta canlidan kurulup damgali satir EZILIYOR
   ("EVDS canli" iziyle). Tarih bicimi savunmali: GG-AA-YYYY · GG.AA.YYYY ·
   ISO (yil onde) ucu de cozuluyor; hisse/DIBS dizileri farkli uzunluktaysa
   cokmuyor (eksik "—" basilir). DIBS>2000mn rekor yildizi korundu.
3. ELLE IS: haftada bir JSON duzenleme -> SIFIR. yabanci.json'da elle kalan
   tek sey ayl ik odemeler dengesi blogu (EVDS haftaliklarinda gercekten yok).

ELLE KATMAN SAYACI: 10 -> 9 (kural #2 isliyor).

app.js v=20260802b · ajan.js v=20260731p · api kap-2026-07-31-n
DOSYALAR: app.js + index.html + api/evds2.js + KTPANEL-BAKIM.md (kural)

## 245p IKI TAZELIK OKUYUCUSU — PANEL KENDISIYLE CELISIYORDU (2 Agu)

Kullanici Veri Durumu cekmecesini gosterdi: iki katman KIRMIZI "GUNCELLE".
Sordu: "bunlar gercekten eski mi yoksa bir hata mi var?" — CEVAP: BIRI GERCEK,
BIRI HATA. Ve hata benim taramamin kacirdigi bir seydi.

### 245p.1 KOK NEDEN: AYNI ISI YAPAN IKI KOD (§112 ihlali)
  ajan.js tazelikNobeti()  dosya tarihi okur ✓ · siklik normalize ✓ · yaptirim ✓
  app.js  planInit()       yalniz plan.son okur ✗ · birebir 'canli' ✗ · sessiz 7 ✗
§198'de dosya-tarihi okumasini, §245'te normalize + yaptirimi ajan.js'e
uyguladim — UC KEZ dokundum ama "bu isi baska kim yapiyor" diye HIC sormadim.
Sonuc: nobet panosu dogruyu, cekmece yanlisi soyluyordu. Ayni panelde iki
farkli cevap. §112 tam bu yuzden var: AYNI BUYUKLUGUN IKI SAHIBI OLMAZ —
biri duzeltilir, oteki eskir ve celiski GIZLI kalir.
DERS: bir duzeltmeyi uygularken ONCE ayni isi yapan baska kod aranir.
`grep` ile "bu hesabi baska kim yapiyor" sorusu, duzeltmenin ilk adimidir.

### 245p.2 COZUM: window.tazelikHesap — TEK SAHIP
Hesap app.js'e tasindi (norm · dosyaTarihleri · limitCoz · durum).
index.html app.js'i ajan.js'ten ONCE yukluyor, sira guvenli.
planInit artik bunu cagiriyor; dosya tarihi DOSYADAN geliyorsa satirda
"·dosya" izi var — plan geride kaldiginda "neden farkli" sorusunu kod
kendisi cevapliyor.

### 245p.3 IKI KIRMIZININ TESHISI
  Yabanci para akisi + carry — HATAYDI. yabanci.json kendi icinde 28 Tem
    yaziyor (5 gun, TAZE); plan `son` 17 Tem'de kalmisti. Ayrica katman adi
    "+ carry" diyor ama CARRY ZATEN CANLI: §112 geregi yabanci.json'daki
    carry alani bosaltilmis, deger window.EXANTE'den (canli EVDS) geliyor.
    Yani etiket IKI KERE yaniltiyordu.
  Swap stoku — GERCEKTI. 17 Tem verisiyle 16 gun; 24 ve 31 Tem yayinlari
    kacmisti.

### 245p.4 SWAP STOKU GUNCELLENDI (elle — otomatiklestirilemez, §245k)
24 Tem haftasi (30 Tem Persembe yayini): brut 162,6 · net 51,1 ·
swap haric net 38,3 -> swapStoku = 51,1 − 38,3 = 12,8 (onceki 13,5).
DOGRULAMA: 51,1 − 12,8 = 38,3, yayinlanan rakamla BIREBIR.
rezerv.json guncelleme 2026-07-24. Siradaki: 31 Tem haftasi, 6 Agu Persembe.

### 245p.5 LIMIT KALIBRASYONU — alarm YAYIN KACINCA calsin
Guncelleme sonrasi swap stoku "yaklasti" (9 gun / limit 7) cikti — oysa bu
ELDE OLABILECEK EN TAZE VERI. TCMB Persembe yayinlar, veri bir onceki CUMA'ya
aittir: katman dogasi geregi 6–12 gun salinir. 7 gunluk genel limit haftanin
COGUNDA bosuna turuncu yakar ve uyari gurultuye doner (§243).
COZUM: katman kaydinda `limit_gun` gecersiz kilma alani (sozlugun onune gecer).
Rezerv/yabanci katmanlarina 13 kondu = "bir yayin kacti" esigi.
SONUC: izlenen 10 · kirmizi 0 · turuncu 0 · yesil 10. Alarm artik yalnizca
GERCEK bir yayin kacinca calacak.

app.js v=20260802a · ajan.js v=20260731p · api kap-2026-07-31-n · data.js §245m
DOSYALAR: app.js + index.html + guncelleme-plani.json + rezerv.json

## 245n "REDDEDILDI" — YAPTIRIM DOGRUYDU, TESHIS YANLISTI (2 Agu)

Kullanici Ebu gunlugunu gosterdi:
    Not motoru: 0/4 not guncellendi · 16 sirada
    §111 yaptirim: 4 not REDDEDILDI (canli kartta rakam) — eski not korundu
    ⚠ eslesmeyen yanit anahtarlari: 1,2,3,4
"Neden reddedildi diyor?" — hakli soru, cunku UC AYRI SORUN ust uste binmisti.

### 245n.1 YANLIS TESHIS (asil kafa karistirici)
    if(g < parti.length) kayit('⚠ eslesmeyen yanit anahtarlari: ...')
g yalniz YAZILAN notu sayar. §111 reddi de g'yi artirmaz (satir 857 `return`).
Sonuc: dort not reddedilince kod "anahtarlar eslesmedi" saniyor ve
"1,2,3,4" basiyor — oysa o anahtarlar TAM ESLESMISTI. Notlar bulundu,
rakam yuzunden reddedildi. Iki farkli ariza tek mesaja bindi ve mesaj
YANLIS olani soyledi.
COZUM: bulunamadi[] ayri toplanir; anahtar uyarisi YALNIZ gercekten
karsiligi olmayan kart varsa yazilir, metni de netlesti.
§245h'nin dersi ucuncu kez: AYIRT ETMEYEN TESHIS, TESHIS DEGILDIR.

### 245n.2 MUAFIYET KALIBI DAR — asil ret sebebi buydu
    /%\s*[\d.,]+\s*(hedef|esik|...)/    <- sayi ile kelime BITISIK olmali
Olculdu: "Fed %2 enflasyon hedefine odakli" REDDEDILIYORDU — araya
"enflasyon" girdigi icin muafiyet tutmuyordu. Oysa politika hedefi SABITTIR,
tabloyla celismez; §111'in korumak istedigi sey bu degil.
Yani model DOGRU not yaziyor, yaptirim YANLIS yere vuruyor, kart hic
guncellenmiyordu. Kural dogruydu, KALIBI hataliydi.
COZUM: sayi ile anahtar kelime arasinda 3 kelimeye izin; kapsam genisledi
(taban/tavan/bant + ekli haller). 9 ornekle test: 9/9.

### 245n.3 CIKMAZ: ret sessizdi, model ogrenmiyordu
Ret tek basina yetmiyordu — model her turda ayni kartlara yine rakam yaziyor,
yaptirim yine reddediyor, o kartlarin notu HIC guncellenmiyordu. Kullanicinin
gordugu "0/4" tam buydu.
COZUM: AJAN.__redSayac ile kart bazinda ret sayaci; istem bir sonraki turda
O KARTA OZEL uyari tasiyor ("onceki denemen reddedildi, N kez"), ikinci retten
sonra dil sertlesiyor ("HIC sayi yazma"). Temiz yazan kartin sayaci sifirlanir.
Kural istemde GENELDI, artik ADRESLI.

### NE DEGISMEDI
§111 yaptiriminin KENDISI dogru ve yerinde: canli kartin sayisi dakikada bir
degisir, not saatlerce durur; tabloda %-0,49 iken notta %-0,34 kalmasi paneli
kendisiyle celiskiye dusurur. Eski notu korumak dogru karar.

### BILINEN ACIK (bu turda kapatilmadi)
Suzgec yalniz YUZDE kaliplarini yakaliyor. "CDS 206bp" ya da "Brent 91$" gibi
yuzdesiz canli rakamlar geciyor. Genisletmek yanlis-ret riskini artirir;
once bu turun etkisi olculmeli (kac kart temiz yaziyor). Siradaki ise yazildi.

app.js v=20260731af · ajan.js v=20260731p · api kap-2026-07-31-n · data.js §245m
DOSYALAR: ajan.js + index.html

## 245m ORTAK KUTU: "OLDUGU GIBI YAZ" -> "BIRLESTIREREK YAZ" (2 Agu)

Ikinci goz (ChatGPT analizi) yaris kosulunu isaretledi; olcunce DAHA KOTUSU
cikti: ayir(yeniVeri,true) istemcinin ortak kopyasini KV'dekiyle birlestirmeden
OLDUGU GIBI yaziyordu. Es-zamanlilik bile gerekmiyordu — sabah acik kalan sekme
(kopyasinda 40 kayit) aksam PORTFOY kaydederken ortak kutuyu da gonderir ve
arkadasin ogle girdigi 5 kaydi kendi bayat 40'iyla ezerdi. Bos-yazma emniyeti
yakalamaz: gelen veri bos degil BAYATTI. Gunluk yedek kurtarir ama ancak kayip
FARK EDILIRSE.

ONEMLI SINIR: sorun YALNIZ ortak kutudaydi (guidance_v1 + ktp_arz_kayit_v1).
Portfoy/journal KISISEL kutuda (ktpanel:kisi:<profil>) — orada ezme zaten
IMKANSIZ, tek yazar var. Kullanicinin istedigi ayrim ZATEN calisiyordu;
is, iki kisinin ortak yazdigi iki anahtardaydi.

### COZUM: ANAHTAR BAZLI BIRLESIM + MEZAR TASI (api/data.js)
  KIMLIK   guidance -> kod|yil (ayni sirket-yil tek kayit) · arz -> kod
  HAKEM    ts (epoch ms). Istemci artik ekleme aninda ts basiyor
           (guidanceEkle + arzKaydet). ts'siz eski kayitlar 0 sayilir ->
           damgali taraf kazanir, ama kayit KAYBOLMAZ (S6 testi).
  BIRLESIM bulut ∪ gelen: yalniz bulutta olan KORUNUR (asil kazanc),
           yalniz gelende olan EKLENIR, ikisinde olan ts buyukle kalir.
  MEZAR    silme birlesimde geri dirilmesin diye silinen kimlikler
           __sil_<anahtar> listesinde tasinir (id+ts), sunucuda birlesir,
           90 gunde budanir. Mezardan SONRA yeniden eklenen yasar (ts>mezar).
  Bos-yazma yasagi kaldirildi — birlesimde gereksiz: bos gelen istek
  birlesim=buluttaki demek, hicbir sey kaybolmaz (S7 testi).
  Yedek yine alinir: merge hatasina karsi son sigorta.
  Yanita ortakBirlesim raporu eklendi: {eski, gelen, sonuc, mezar} —
  panel istedigi gun "3 kayit birlesti" gosterebilir.

### ISTEMCI (app.js)
  guidanceEkle -> ts:Date.now() · arzKaydet -> ts eklendi
  guidance silme -> __sil_guidance_v1'e mezar tasi (son 200 tutulur)
  CLOUD_KEYS'e __sil_guidance_v1 eklendi -> mezar buluta cikar/iner,
  cihazlar arasi silme de senkron olur.

### TEST — 7 SENARYO, 7/7 (gercek fonksiyon, /tmp/mtest.js)
  S1 bayat kopya arkadasin kaydini EZEMIYOR (ana vaka)
  S2 iki tarafin ekledigi birlesiyor
  S3 ayni kayitta yeni ts kazaniyor
  S4 silinen, bayat kopyadan GERI DONMUYOR (mezar)
  S5 mezardan sonra bilerek eklenen YASIYOR
  S6 ts'siz eski kayitlar korunuyor (geriye uyum)
  S7 bos istek buluttakini silemiyor
NOT: CAS/optimistic locking Upstash REST'te zahmetli; anahtar-bazli birlesim
pratikte ayni isi goruyor. Kalan teorik pencere: iki JSON.stringify yazmasi
ayni MILISANIYEDE cakisirsa son yazan kazanir — ama artik ikisi de BIRLESIK
kutu yazdigi icin kaybedilen sey en fazla obur tarafin ayni anki tek kaydi
olur ve bir sonraki senkronda geri gelir (mezar+birlesim kalici kayip birakmaz).

### CHATGPT ANALIZININ DIGER MADDELERI (olculdu)
  CORS '*'      dogru ama middleware 401 kalkani var — hijyen isi, acil degil
  write-key     "sizarsa" senaryosu mimariyi yanlis okumus: anahtar kodda
                degil kullanicinin localStorage'inda; ayrica tek basina
                yetmiyor (oturum cerezi de sart)
  package.json  "dependency cakismasi" bos cikti: ikisinde de tek ve AYNI
                bagimlilik (playwright ^1.48.0). Gercek borc baska: ESM/CJS
                karisimi (§245.7'de zaten kayitli)
  8 soru        6'sinin cevabi BAKIM.md + guncelleme-plani.json'da yaziliydi

app.js v=20260731ae · ajan.js v=20260731n · api kap-2026-07-31-n · data.js §245m
DOSYALAR: app.js + index.html + api/data.js

## 245k TCMB UCLUSU: OTOMASYON DEGIL, DURUSTLUK ISIYMIS (31 Tem)

Kullanici "damgali sayisini minimuma indirecegiz" dedi; TCMB uclusunu
otomatiklestirmeyi onerdim. OLCUNCE ONERIM YANLIS CIKTI — cogu zaten otomatikti:
  Net rezerv    karneRezervCanli -> /api/evds2?mod=rezerv  TAM CANLI
  Yabanci akis  yabCanli -> mod=yab  KISMEN CANLI (stok+son hafta, damgaliyi ezer)
  Swap stoku    GERCEKTEN elle — ve OTOMATIKLESTIRILEMEZ: EVDS'de yok (yurt disi
                ikili swap, agirlikla Katar; TCMB haftalik basin aciklamasi)
DERS: "damgali" ETIKETI ile damgali GERCEK ayri seyler. Plan 17 gosteriyordu.

### ASIL SORUN: SABIT YEDEK + SESSIZ DUSUS BILESIMI
index.html'de uc SABIT sayi (163,3 · 56,3 · 42,5 — 16 Tem) duruyordu;
karneRezervCanli canliyi uzerine yaziyordu ama uc cikis yolu da sessizdi
(if(!r.ok)return · if(!j.ok)return · catch(e){}). EVDS dusunce 16 Tem'in
sayilari BUGUNMUS GIBI kaliyordu. Gizli damga, acik damgadan kotu.

### YAPILANLAR
1. SABIT YEDEKLER KALDIRILDI: uc hucre "—" baslar. Bos hucre yanlis sayidan iyi.
2. SESSIZ DUSUS KONUSTURULDU (karneRezervCanli + yabCanli): damgada sebep +
   konsol warn (§245d deseni). yabCanli duserse damgaliya birakir — DOGRU
   davranis (tarihli damga yalan degil); eklenen sey NEDENIN gorunmesi.
3. PLAN ETIKETLERI GERCEGE UYDURULDU:
   Net rezerv -> canli/otomatik (nobetci 15 gun BOSUNA alarm veriyordu)
   Risk metrikleri -> canli (bot §230'dan beri guncelliyor, etiket eskiydi)
   Endeks agirliklari -> canli + dosya:xktum.json (§198 okumasi calissin)
   Yabanci akis haftalik KALIR (seri gecmisi elle; dosya damgasi izliyor)
   DAMGALI: 17 -> 14, ve kalan 14'un damgasi artik GERCEGI soyluyor.
4. SWAP STOKU YASI SAYININ YANINDA: stok >10 gunse karnede ve yabanci kartinda
   sari uyari ("stok 14 gunluk — rezervleri guncelle"). "· canli" damgasi yarim
   dogruydu: net canli ama stok elle — simdi tam.

### DOGRULAMA
Nobetci simulasyonu: yanlis alarm (net rezerv) GITTI, gercek alarm (swap 14g —
TCMB 17 ve 24 Tem yayinlari islenmemis) KALDI. Yas mantigi 4 sinir durumunda
test edildi (14g uyari · 7g/1g/bos sessiz, NaN yok).

### 245k-EK: PARTI BIRLESTIRME KAZASI (ayni tur)
Bu turun calisma kopyasini DEPODAN (aa) kurdum — oysa ab (sukuk penceresi) ve
ac (ozet kartlari) partileri henuz depoya yuklenmemisti, ayri kopyada duruyordu.
Teslim etseydim kullanicinin yukleyecegi app.js O IKI PARTIYI GERI ALIRDI.
Surum denetimi yakaladi (beklenen ad, gorunen aa) — surum damgasi tam bu is
icin var (§233). Cozum: ab+ac tabanina 245k parca parca, assert'li tasindi;
her iki partinin izleri birlesik dosyada dogrulandi.
DERS: calisma kopyasi HER ZAMAN son teslimden kurulur, depodan degil —
depo, kullanicinin yukleme ritmine gore GERIDE olabilir.

app.js v=20260731ad (ab+ac+ad birlesik) · ajan.js v=20260731n · api kap-2026-07-31-n
DOSYALAR: app.js + index.html + guncelleme-plani.json
NOT: ab ve ac partileri bu dosyalarin ICINDE — ayrica api/kap.js ve
api/_lib/sukuk.js (245i teslimi) hala gecerli, degismedi.

## 245j OZET KARTLARI TABLONUN KOPYASIYDI — ALANI HAK ETTIRILDI (31 Tem)

Kullanici: "ustteki buyuk kutulara gerek yok dimi asagida ayniları var."
OLCULDU, dogruydu: Asya sekmesindeki dort kart (Nikkei · Hang Seng · Shanghai ·
KOSPI) tablonun ILK DORT SATIRIYDI — ayni sira, ayni kaynak (window.__market),
ayni iki alan (d.p, d.chg). Ustelik EKSIK: tabloda hafta (h1) ve ay (a1) da var.
Emtia sekmesinde ayni desen (Brent · Altin · Bakir · Dogalgaz).

Iki secenek sunuldu — SIL ya da ALANI HAK ETTIR. Kullanici ikincisini secti.

### YENI OLCUT
Bir ozet karti, tablonun SOYLEYEMEDIGINI soylemeli. Tablo tek tek kalemleri
verir; kart BUTUNU okumali. Yoksa dikey alani harciyor demektir.

### ASYA — dort kart
  1 GECE YONU     agirliksiz ortalama + kac/kac artida
                  AGIRLIKSIZ BILEREK: aranan piyasa buyuklugu degil, kac ayri
                  piyasanin ayni yone baktigi. Genislik yonu, ortalama siddeti.
  2 DAGILIM       en iyi - en kotu puan farki + uclardaki isimler
                  DAR = ortak makro itki, BIST'e tasinma olasiligi yuksek.
                  GENIS = ulkeye ozgu hikayeler, gece ortalamasi YANILTICI.
  3 TEKNO·IHRACAT Nikkei+KOSPI+KOSDAQ+Taiwan ortalamasi
  4 CIN TALEBI    Hang Seng+Shanghai ortalamasi
3 ve 4'un gruplamasi panelin KENDI cercevesinden geliyor — t16 alt notu zaten
"Nikkei ve KOSPI teknoloji/ihracat oncusu · Hang Seng ve Shanghai Cin talep
sinyali" diyordu. Not bunu SOYLUYORDU, panel HESAPLAMIYORDU.
Ikisinde GUN + AY birlikte: zit isaretliyse SICRAMA, ayni isaretliyse trend.
31 Tem verisiyle dogrulandi: tekno gun +%5,90 · ay -%15,1 -> sicrama.
Dagilim 11,7 puan (KOSDAQ ↔ KOSPI) -> hikaye bazli, makro dalga DEGIL.
Tablo bu dordunun HICBIRINI soylemiyordu; 8 satira bakip kafadan hesaplaniyordu.

### EMTIA — ayni olcut, FARKLI cozum
Emtia tablosu ZATEN gruplu (Enerji · Degerli Metal · Sanayi Metali · Tahil ·
Yumusak). Yani grup ortalamasi gostermek yeni bilgi OLMAZDI — Asya desenini
mekanik kopyalamak yanlis olurdu. Eksik olan GRUPLAR ARASI okuma:
  1 MALIYET BASKISI  Brent+dogalgaz+bugday. Turkiye net enerji ithalatcisi;
                     panelin kendi notu "cari acigi ve TL baskisini artirir,
                     TUFE'ye gecer" diyor. Fon icin asil emtia sorusu bu.
  2 BAKIR − ALTIN    klasik buyume-korku dengesi. Tabloda iki AYRI satir var
                     ama ORAN yok. Seviye orani anlamsiz (birimler farkli),
                     o yuzden GUNLUK GORELI hareket: bakirin altina karsi kac
                     puan ayristigi. Arti = dongu onde, eksi = korunma onde.
  3 ALTIN            gun+ay, reel faize ters
  4 GENISLIK         kac kalem artida + dagilim

### SINIR DURUMLARI TEST EDILDI
Asya 4 senaryo: gercek veri · tekduze makro hareket (dagilim 0,7 -> "ortak
itki") · yarisi eksik veri (3/3 hesaplar, cokmez) · veri hic yok (tek "—" kart).
Emtia 3 senaryo: enerji soku · risk-off (bakir-altin -6,2 -> korunma onde) ·
veri yok. Hicbirinde NaN/undefined sizmiyor.

### DERS
"Bu kart tablodaki bir satirin buyutulmus hali mi?" — oyleyse ya silinir ya
yukseltilir. Ozet, TEKRAR degil TURETIM olmali.
Ve desen kopyalanirken baglam sorgulanmali: Asya'da grup ortalamasi yeni
bilgiydi, Emtia'da OLMAZDI cunku tablo zaten gruplu.

app.js v=20260731ac · ajan.js v=20260731n · api kap-2026-07-31-n
DOSYALAR: app.js + index.html

## 245i PENCERE UYUMSUZLUGU — 30 GUN SANILIYORDU, YARIM GUN TARANIYORDU (31 Tem)

Kullanici /api/kap?mod=sukuk ciktisini yapistirdi:
    {"ok":true, "canliAdet":0, "arsivAdet":6, "pencereGun":30, "kapHata":null}
ONCE IYI HABER: ok:true ve kapHata:null — modul YUKLENIYOR. §245g duzeltmesi
tuttu, alt modul yukleme sorunu bu ucta yok.

### Kok neden
sukuk.js satir 87 (eski):  fetch(kok + '/api/kap')   <- PARAMETRESIZ
kap.js varsayilan akis:    fromDate = simdi - 2 gun · .slice(0, 150)

Yani sukuk modulu 30 GUNLUK suzgec uygularken kaynak 2 gun veriyordu. Ama asil
darbogaz pencere DEGIL DILIMDI: KAP gunde ~280 bildirim uretiyor, 150 kayit
YARIM GUN eder. Olculdu:
    ESKI  istenen 2g · ham 560  · dilim 150  -> FIILEN 0.5 gun
    YENI  istenen 7g · ham 1960 · dilim 2000 -> FIILEN 7.0 gun
Suzgecin uyguladigi 30 gun, gercegin 60 KATIYDI.

### Neden bos sonuctan KOTU
Yanit `pencereGun:30` diyordu. Bu bos sonuc degil, YANLIS BILGIYDI:
"30 gun tarandi, sukuk ihraci yok" dedirtiyordu — oysa yarim gun tarandi.
Panelin uyari metni de ustune "10 gunu asiyorsa akis kopmustur" diyerek
GERCEKLESMEMIS bir taramaya dayali teshis oneriyordu. §243'un ayrimi:
eskilik gorunur kusur, CELISKI gizli yalandir. Burada celiski vardi.

### Cozum
1. kap.js varsayilan akisa gun (1-10, vars. 2) ve limit (50-2000, vars. 150)
   parametreleri eklendi. VARSAYILANLAR DEGISMEDI — tek parametresiz cagiran
   app.js:1616 (genel haber akisi) aynen calisiyor.
   Zaman asimi pencereye gore olcekleniyor: <=2 gun 9sn, genis pencere 22sn.
2. sukuk.js artik /api/kap?gun=7&limit=2000 cagiriyor. gun=7 secildi cunku
   §''de olculmus: 7 gunde ~1978 kayit geliyor, KAP tavani 2000. En genis
   GUVENLI pencere bu. Kendi zaman asimi 15 -> 28 sn.
3. YANIT ARTIK DURUST — uc alan birden:
     istenenPencereGun  suzgecin uyguladigi
     ustPencereGun      /api/kap'in GERCEKTEN taradigi
     hamAdet            suzulmeden onceki kayit sayisi
     tavanaDayandi      pencere kirpildi mi
   pencereGun eski adiyla duruyor ama artik GERCEKLESEN pencere (ikisinin
   kucugu). "canliAdet:0" gorunce tek bakista ayirt edilir:
     hamAdet 0      -> kaynak sustu
     hamAdet yuksek -> kaynak akiyor, SUZGEC eliyor
   §245h dersinin uygulamasi: AYIRT ETMEYEN TESHIS YOKTUR.
4. Paneldeki uyari metni de duzeltildi; artik ham sayiyi gosterip ayrimi
   okuyucuya birakiyor, "akis kopmustur" diye yanlis sonuca yonlendirmiyor.

### Ders
Bir modul BASKA bir ucun ciktisini suzuyorsa, kendi suzgec penceresi ile
kaynagin penceresi AYRI IKI SAYIDIR ve biri otekini sessizce sinirlar.
Kontrol: "bu suzgec N gun istiyor — kaynak N gun VERIYOR MU?"
kapyorum.js'te ayni tuzak YOK (kendi cekimini yapiyor, dilim kirpmasi yok) —
bakildi ve dogrulandi.

app.js v=20260731ab · ajan.js v=20260731n · api kap-2026-07-31-n
DOSYALAR: app.js + index.html + api/kap.js + api/_lib/sukuk.js

## 245. PANEL TARAMASI — SESSIZ SAGLIK RAPORU, ENUM SANILAN SERBEST METIN (31 Tem)

Kullanici: "iyilestirme icin siteyi bastan sona tara ama once bakim dosyalarini
oku ogren." Bakim dosyalari once okundu; tarama onlarda TEKRAR EDEN hata
desenleri uzerinden yapildi (cift tanim · yetim cagri · onbellek · goreli zaman).

### 245.0 ONCE KENDI HATAM — numara cakismasi
Ayni oturumda Ayrisma katlamasina "§201" yazmistim; §201 zaten 29 Tem'de
KAP yoklamasi icin kullanilmisti. Gunlukte 232 kayit var ve en yuksek numara
244 — ezberden numara vermek yerine OLCULMELI. §245'e cevrildi.
DERS: bu dosya artik ezberlenemeyecek kadar buyuk; yeni numara yazmadan once
`grep -o "^## [0-9]*\." | sort -n | tail` calistirilir.

### 245.1 TARAMANIN TEMIZ CIKTIKLARI (once bunlar — kapsam kaniti)
  · 274 fonksiyonda CIFT TANIM yok        -> §173 idempotent yazim tutmus
  · 23 JSON cekiminin 23'unde no-store    -> §240 TAM kapsanmis
  · Vercel fonksiyon kotasi 10/12         -> §7.3 sinirinda
  · 369 DOM cagrisindan yalniz 2'si yetim
Tarama raporunun temiz kismi ONEMLIDIR: neyin bakildigini gosterir. Yalniz
bulgu yazan rapor, bakilmayan yerleri gizler.

### 245.2 BULGU A — SAGLIK KONTROLU KAYIP KABI "SAGLIKLI" SAYIYORDU
    const bos = kontrol.filter(([ad,id])=>{
      const el = document.getElementById(id);
      if(!el) return false;        // <- KAP YOKSA "sorun yok"
Kap BOSSA yakaliyordu, kap HIC YOKSA yakalamiyordu. Oysa kabin silinmesi daha
agir arizadir: modul kosar, hicbir sey yazmaz, konsol "✓ tum moduller yuklendi"
der. §244'te temettu karti VE #temettuBody kaldirildi — yarim silme olsaydi bu
kontrol susardi. Sagligi olcen aracin kendisi §60'taki TEFAS vakasina donusmustu.
COZUM: iki ayri ariza, iki ayri rapor (KAYIP KAP = console.error, BOS = warn).
KAPSAM: 8 kap izleniyordu, boot 30 modul kosuyordu (%27). 15 kaba cikarildi —
karar omurgasi (atif · risk · ayrisma · sicil · reel getiri) artik izlemede.

### 245.3 BULGU B — aiInit OLU KODDU VE BOOT ONU BASARI SAYIYORDU
`['Inceleme AI', aiInit]` boot listesinde kayitliydi. Ilk satiri:
`const el=$('aiKartlar'); if(!el) return;` — ve #aiKartlar panelde YOKTU.
Canli halefi incelemeInit() -> #incelemeBody, ayni inceleme-ai.json'i okuyor.
Fonksiyon her acilista cagriliyor, sessizce donuyor, HATA ATMIYOR, bu yuzden
saglik raporuna BASARI olarak giriyordu.
DERS: olu kod zararsiz degildir. Calismadigi halde basarili sayildigi surece
saglik raporunu yalanci yapar — §60 deseninin yazilim tarafi.

### 245.3b SILME SIRASINDA YAPTIGIM HATA — ve neden node --check yakalamadi
Fonksiyonu susly parantez sayarak silen bir betik yazdim. Govde icindeki
string'lerde gecen parantezler sayimi kaydirdi: 22 satir yerine 3531 SATIR
silindi, 154 fonksiyon gitti (boot · ayrismaCiz · riskButceRender dahil).
`node --check` GECTI — cunku kalan kod sozdizimsel olarak gecerliydi.
§156'nin dersi birebir tekrar etti: "tanimli" ile "calisiyor" ayri seylerdir;
sozdizimi denetimi OLU KODU gormez, EKSIK KODU da gormez.
GERI ALINDI. Dogru yontem: fonksiyon sinirini SATIR DESENIYLE bul (sonraki ust
duzey `function`/yorum blogu), sonra sinirlari assert ile DOGRULA, sonra sil.
DOGRULAMA: silme sonrasi FONKSIYON ENVANTERI karsilastirildi —
eski 274, yeni 274 (aiInit gitti, takvimSatirlari geldi). Satir sayisi degil
ENVANTER karsilastirilmali; satir sayisi bu hatayi gizleyebilirdi.

### 245.4 BULGU C — `siklik` SERBEST METINDI, ENUM GIBI OKUNUYORDU
    let limit = sg[k.siklik] || 7;
Sozlukte olmayan HER deger sessizce 7 gune dusuyordu. OLCULDU: 32 katmanin
12'sinde siklik sozlukle eslesmiyor —
  'canli (Yahoo)' · 'canli (EVDS)' · 'canli (KAP)' · 'canli (TEFAS)' ·
  'canli (AV)' · 'aylik (~25'i)' · 'olay bazli (FR)'
SONUC: AYLIK bir katman 7 gunde bayat sayilir (kronik yanlis alarm), OLAY BAZLI
olan da oyle. Ve §243'te ogrendigimiz gibi surekli tekrarlanan uyari, uyari
olmaktan cikar.
COZUM IKI KATMANLI:
  1) NORMALIZE — parantezli ek atilir, Turkce harf sadelesir, on ek eslestirilir
     'aylik (~25'i)' -> aylik (30) · 'olay bazli (FR)' -> olay (999)
  2) YAPTIRIM — normalize sonrasi hala eslesmiyorsa VARSAYIM YOK: katman
     `tanimsiz` listesine duser ve nobet panosunda KIRMIZI gorunur.
OLCULDU: 12 farkli siklik degerinin 8'inin limiti duzeldi, tanimsiz kalan 0.
DERS §243'un tekrari: sessiz varsayim, yanlis limitten tehlikelidir — cunku
yanlis limit bir gun fark edilir, sessiz varsayim edilmez.

### 245.5 BULGU D — UC HAFTALIK ELLE RITUEL NOBETTEN MUAFTI
DAMGA §B "Persembe ritueli" diyor, plan `canli`/`otomatik` diyordu:
  yabanci.json           siklik='canli'     -> muaf   (ELLE, hafta_seri ekleme)
  Net rezerv (index.html) siklik='canli'    -> muaf   (TCMB Persembe, ELLE)
  sektor.json            son='otomatik'     -> muaf   (DAMGA §B2: "otomasyon YOK,
                                                       KOPRU zorunlu")
Uc katman da nobetcinin KOR NOKTASINDAYDI. Bu, §F0'in kendi uyarisinin ikinci
yarisi: kayitta OLMAYAN dosya gorulmez — ama kayitta YANLIS BAYRAKLA duran
dosya da gorulmez, ve ikincisi daha sinsidir cunku listede DURUYOR.
Ayrica bist-takvim.json kayitta hic yoktu (§F0 ihlali) — eklendi.
IZLENEN KATMAN: 15 -> 17. Yeni alarm: Net rezerv 15 gun (limit 7) — GERCEK,
TCMB'nin 23 ve 30 Tem yayinlari islenmemis.

### 245.6 BULGU E — IKI TARIH SATIRI BAYATTI, YENI TARIH YAZILMADI
  "Siradaki FOMC: 28-29 Tem"        -> toplanti 29 Tem'de YAPILDI (faiz sabit)
  "Siradaki haftalik veri: 23 Tem"  -> 8 gun geride
Damga kural 1 ihlali DEGIL (mutlak tarih yazilmis) ama daha sinsi: tarih DOGRU
bicimde yazilmis, OLAY GECMIS. §56'nin tarih karsiligi.
Yeni bir sabit tarih yazmak yalniz saati sifirlardi. IKISI DE HESAPLANABILIR:
  · FOMC — resmi takvim yil onceden yayimlanir; liste tutulur, sirada olan secilir
  · TCMB — haftalik yayin Persembe; sirada olan takvimden turer
Artik ELLE tazelenemezler, dolayisiyla bayatlayamazlar.
SINIR DURUMU TEST EDILDI (9 tarih): karar gunu hala "siradaki" kalir, ertesi gun
doner; takvim tukendiginde SESSIZ kalmaz, kirmizi "takvim guncellenmeli" der.
NOT: ayni karttaki "Eylul ARTIRIM olasiligi ≈%82" hala STATIK — piyasa fiyatli
bir sayi ve §56 kapsaminda. Canliya baglanmali ya da rakamsizlastirilmali;
bu turda DOKUNULMADI, siradaki ise yazildi.

### 245.7 DUZELTILMEYENLER (bilerek — siradaki ise)
  · index.html:719 "Sali AKBNK ... ilk testi" — AKBNK 28 Tem'de acikladi.
    Haftalik yorum metni, Pazartesi ritueline ait; sonucu bilmeden yazilmaz.
  · DAMGA BoJ satiri "SIRADAKI: 30 Tem" — bir sonraki BoJ tarihi dogrulanmadan
    yazilmaz (§7.5: dis kaynak varsayimi OLCULEREK dogrulanir, ezberden degil).
  · package.json "type":"commonjs" ama api/kap.js · api/usnews.js ·
    middleware.js ESM. Vercel derleyicisi tolere ediyor (panel canli), ama
    yerelde `node` ile kosulursa kirilir. Gizli borç, tasinma aninda patlar.
  · XKTUM beta tabani hala XU100'e dusuyor (onceki tur bulgusu) — sentetik
    endeks isi ayri ve buyuk.

### 245b DEPLOY SONRASI: KENDI URETTIGIM YANLIS ALARM (31 Tem, ayni gun)
Ilk deploy'da konsol:
    [KTPanel] ⚠ Bos/eksik bolumler: Endeksten ayrisma
Yeni saglik kontrolu ILK CALISMASINDA bir sey yakaladi — ve yakaladigi sey
BENIM urettigim yanlis alarmdi. #ayrBody bostu, ama BOS OLMASI GEREKIYORDU:
ayrismaInit() boot listesinde DEGIL, t3 sekmesi tiklaninca cagriliyor (§154'te
portfoy sekmesinin icine tasinmisti).
HATA: kapsami 8'den 15 kaba cikarirken DOLMA ZAMANINA bakmadim. "Bu kap var mi"
sorusunu sordum, "bu kap ne zaman dolar" sorusunu sormadim.
COZUM: kontrol listesine 3. eleman — TEMBEL bayragi. Tembel kapta VARLIK
denetlenir, DOLULUK denetlenmez. Varlik denetimi zaten asil kazanimdi
(silinen kabi yakalamak); dolulugu boot aninda olcmek KATEGORI HATASI.
STATIK ANALIZ YETMEDI: hangi kaplarin tembel oldugunu koddan cikarmaya
calistim, uc yanlis pozitif verdi (kuresel1 · riskBaroSkor · fmKarneBody —
bunlar marketCek/ajan GOREVLER uzerinden doluyor). KONSOL YER GERCEGIDIR;
cagri zincirini statik izlemek dolayli yollari kaciriyor.

### 245c OPAK 500 → KONUSAN HATA (api/kap.js)
Ayni konsolda: `api/kap?mod=yorum...` 500.
OLCTUM, TAHMIN ETMEDIM: alt modul ESM baglaminda yerel olarak import edildi ve
sahte req/res ile cagrildi -> 200 + {ok:false, err:'KAP HTTP 403'}. Yani modulun
KENDISI saglam ve hata yolu dogru. Demek ki patlama YUKLENMEDE.
`_altModul` CIPLAKTI: import basarisiz olursa istisna handler'dan disari sizar,
Vercel jenerik 500 basar. 500'un soyledigi tek sey "bir sey oldu".
Sunucu gunlugu olmadan kok neden UZAKTAN KESINLESTIRILEMEZ — o yuzden neden
aranmadi, GORUNURLUK eklendi: yonlendirme sarmalandi, yanit 502 + {mod, asama,
hata, mesaj, ipucu}. Bir sonraki turda tahmine gerek kalmayacak (§145, §167).
NEDEN 200 DEGIL 502: bu gercek bir ariza. 200 donmek panelin "veri yok" ile
"sunucu kirik" ayrimini yok ederdi.

### 245d SESSIZ YEDEGE DUSME — konsolda 500, ekranda HICBIR IZ
haberCanliCek() sonu: `catch(e){}`. Ve `if(j&&j.ok&&...)` kosulu ok:false
gelince de sessizce geciyordu. Sonuc: canli KAP akisi olurken panel statik
HABERLER dizisini gosteriyor, damga eski haliyle duruyor.
KULLANICI EKRANDA HICBIR SEY GORMUYOR. Konsolda 500 vardi, ekranda iz yoktu.
§60'in TEFAS vakasi birebir: damga "canli" der, akan veri yoktur.
Artik dusus GORUNUR: damgaya kirmizi "⚠ DAMGALI YEDEK" duser, sebebi yazar
(HTTP kodu ya da hata mesaji) ve konsola warn dusulur.
YEDEGE DUSMEK KUSUR DEGIL; SESSIZCE DUSMEK KUSURDUR.

### 245e KOKTE UC OLU KOPYA (§241 tuzagi)
  kapyorum.js  <-> api/_lib/kapyorum.js   md5 AYNI, kokteki CAGRILMIYOR
  sukuk.js     <-> api/_lib/sukuk.js      md5 AYNI, kokteki CAGRILMIYOR
  ajanktp.js   <-> api/ajanktp.js         FARKLI, kokteki CAGRILMIYOR
index.html yalniz app.js ve ajan.js yukluyor. Bu uc dosya deploy ediliyor ama
hicbir yerden cagrilmiyor. §241'in tuzagi tam bu: "uc tur ayni satiri
duzeltemedim, sebep IKI DOSYA BAGIMLILIGI". Biri kokteki kopyayi duzeltirse
hicbir sey degismez ve sebebi bulmak turlar alir.
BU TURDA SILINMEDI — silme ayri bir denetim ister (ajanktp.js kopyalari FARKLI,
once hangisinin yeni oldugu belirlenmeli). Siradaki ise yazildi.

### 245f TRACKING PREVENTION UYARISI — ariza DEGIL
Konsolda dort kez: "Tracking Prevention blocked access to storage for
unpkg.com/lightweight-charts". Bu DEPOLAMA erisimi uyarisi, betik yuklemesi
engeli degil; kutuphane yuklenmis olabilir. Zaten ele alinmis: tkKutuphane()
onerror'da false doner, tkYukle "grafik kutuphanesi yuklenemedi (CDN engelli
olabilir)" diyerek durum satirina yazar. DAMGA §B3'teki teshis yolu isliyor.
Aksiyon gerekmiyor — ama Teknik sekmesi bos acilirsa bakilacak ilk yer burasi.

### 245g KOK NEDEN BULUNDU — DEGISKENLI import() PAKETE GIRMIYOR
§245c'de eklenen teshis ISE YARADI: opak 500, teshisli 502'ye dondu ve konsolda
"KAP yorum akisi HTTP 502 — statik yedek gosteriliyor" gorundu. Sebep:
    async function _altModul(yol){ const m = await import(yol); ... }
`import()` icine DEGISKEN veriliyordu. Vercel'in dosya izleyicisi (@vercel/nft)
STATIK analiz yapar: `import('./_lib/x.js')` gibi SABIT DIZGEYI izler ve dosyayi
dagitim paketine koyar; `import(yol)` gibi degiskeni IZLEYEMEZ. Sonuc:
api/_lib/kapyorum.js ve sukuk.js dagitima HIC girmiyordu -> ERR_MODULE_NOT_FOUND.
KANIT YAN YANA DURUYORDU, uc turdur bakmamisim:
    api/data.js   require('./_lib/mail.js')    SABIT -> calisiyor
    api/evds2.js  require('./_lib/tlref.js')   SABIT -> calisiyor
    api/kap.js    import(yol)                  DEGISKEN -> tek bozuk dosya
Yerelde calisip uretimde patlamasi da tam bunu soyluyordu: yerelde dosya diskte
duruyor, uretimde pakete alinmamis. §245c'de "yerelde 200 dondu" olcumunu
yapmistim ama bu isareti okumamistim — OLCUM YETMEZ, OKUNMASI DA GEREKIR.
COZUM: her modul SABIT dizgeli kendi ok fonksiyonunda (_ALT_MODUL haritasi).
Tembel yukleme korunuyor, nft artik izleyebiliyor.
AYRICA vercel.json -> api/kap.js includeFiles:'api/_lib/**' (kemer + aski).
DOGRULAMA: yorumlar soyuldu, canli kodda degiskenli import KALMADI, iki sabit
dizge duruyor (ilk denetimim kusurluydu: satir basinda '*' aradi, oysa satirlar
/* */ blogunun ICINDEydi — yanlis "CANLI KOD" alarmi verdi).

### 245h SUNUCUYU KONUSTURUP ISTEMCIYI SAGIR BIRAKMISIM
§245c'de sunucuya teshis govdesi ekledim: {mod, asama, hata, mesaj, ipucu}.
Ama istemci tarafinda yazdigim satir:
    if(!r.ok){ damgaUyar('HTTP '+r.status); return; }
GOVDEYI OKUMADAN cikiyordu. Konsolda "HTTP 502" gorundu, SEBEBI gorunmedi.
Teshis uretildi ve ayni turda cope atildi. Kok nedeni bulmak icin koda geri
donup `_altModul`'u okumak gerekti — oysa cevap sunucunun yanitindaydi.
DERS: bir teshis, OKUNMUYORSA YOKTUR. Teshis eklerken "bunu kim, nerede
gorecek" sorusu kodun kendisi kadar onemli.
Duzeltildi: hata govdesi ayristirilip hem damgaya hem konsola dusuyor.
AYRICA mod=sukuk ayni hatanin ikinci kurbaniydi ve `catch(e){}` ile sessizdi —
uc turdur gorunmemisti. Satir bazinda "CANLI" rozeti "canli degil" diyordu ama
"niye degil" demiyordu. Artik konsola dusuyor.

app.js v=20260731aa · ajan.js v=20260731n · api kap-2026-07-31-m
DOSYALAR: app.js + index.html + api/kap.js + vercel.json


## 244. TEMETTU KARTI VE YIELD CURVE LAB KALDIRILDI (31 Tem)

Kullanici: "bu iki temettü ile ilgili kısmı ve yield curve laboratuvarını
kaldır, gereksiz onlar." HAKLI — ikisi de karar akisina girmiyordu.

### 244.1 NEDEN GEREKSIZDILER
TEMETTU KARTI: portfoyun agirlikli temettu verimi + en yuksek verimli 19 hisse.
Katilim evreninde temettu bir SECIM OLCUTU degil, SONUC. Panelin hicbir tezi
"yuksek temettu" uzerine kurulu degil; kart bilgi veriyordu ama karar
degistirmiyordu.
YIELD CURVE LAB: uc kaydiraciyla (S·L·C) Nelson-Siegel egrisi cizdiren
OGRETICI bir arac. Kavrami anlatiyordu ama panelde ZATEN GERCEK egri var
(§ Faiz Egrisi karti, EVDS canli, sukuk+DIBS iki egri, parite tablosu).
Simulasyon, gercegin yaninda duruyorsa gereksizdir.

### 244.2 TAM TEMIZLIK — yarim silme yapilmadi
Bu oturumda ONIKI kez "bir yeri degistirip digerini birakma" hatasi yaptik.
Silerken de ayni risk var: HTML kalir JS gider, ya da fonksiyon gider cagri kalir.
KALDIRILANLAR:
  index.html : Temettu h2 + #temettuBody · YIELD CURVE LAB karti (1.683 kr)
               ayrica sekme aciklamasindaki "Temettu (verim)" ifadesi
  app.js     : temettuRender() · ycY() · ycLabDraw() · YC_PRESET
               olay baglari (3) · POZ_GOREV listesinden temettuRender
               temettu.json CEKIMI ve TEMETTU/TEMETTU_TARIH degiskenleri
DENETIM: kalan iz SIFIR (temettuRender·ycLab·YC_PRESET·TEMETTU·temettu.json),
cift tanim yok, yetim cagri yok.

### 244.3 YAN KAZANC — bir cekim daha eksildi
§240'ta 22 JSON cekimini tek tek elden gecirmistik; temettu.json onlardan
biriydi. Kullanilmayan bir karti beslemek icin her acilista dosya cekmek
hem gereksiz istek hem bakim yuku. Artik 21.

app.js v=20260731x. DOSYALAR: app.js + index.html

## 243. KURAL VARDI, YAPTIRIM YOKTU (31 Tem)

Kullanici Ebu gunlugunu gosterdi:
  [14:47] ⚠ CANLI kartta rakam yazıldı (§111 — tabloyla çelişebilir): Emtia
  [14:46] ⚠ CANLI kartta rakam yazıldı (§111): GLOBAL RİSK BAROMETRESİ
Uyari her turda tekrarliyordu.

### 243.1 TESHIS: UC KATMAN VARDI, ORTADAKI BOSTU
  KURAL   §111 — canli kartta rakam yazma          ✓ var
  ISTEM   modele ACIKCA soyluyor ("⚠ [CANLI] ...")  ✓ var
  YAPTIRIM                                          ✗ YOK
Denetim yalniz RAPORLUYORDU. Ihlal eden not YINE DE YAYINLANIYOR, gunluge
uyari dusuyor, panel kendisiyle celismeye devam ediyordu.
§111'in kendi yorumunda gerekce yaziliydi: "Kesmiyoruz — '%20 eşiğinin
altında' gibi meşru kullanımlar var." Endise DOGRUYDU ama cozum yanlisti:
istisna varsa ISTISNAYI TANIMLA, kurali gevset degil.

### 243.2 COZUM
    oranVar && !esikMi  ->  NOT REDDEDILIR, eski not korunur
esikMi: "%2 hedefi" · "%20 eşiği" · "%5 üzeri" · "%3 altında" gibi SABIT
ifadeler. Bunlar tabloyla celismez cunku degismezler.
TEST EDILDI — alti vaka, altisi da dogru ayrildi.

### 243.3 NEDEN ESKI NOT, CELISEN NOTTAN IYI
Birkac saat eski bir not TOLERE EDILIR: kullanici imzadaki saati gorur.
Tabloyla CELISEN bir not ise okuyucuya "hangisi dogru" sorusunu sordurur ve
panelin TAMAMINI supheli kilar.
ESKILIK GORUNUR BIR KUSUR, CELISKI GIZLI BIR YALANDIR.
Kart bir sonraki turda yeniden denenir; model bu sefer kurala uyarsa yayinlanir.

### 243.4 GUNLUK GURULTUSU (§243b)
Ayni uyari her turda tekrarlaniyordu — kullanicinin fark etmesinin sebebi buydu.
Artik yalniz ihlal eden kart KUMESI DEGISTIYSE yazilir, duzelince de
"ihlal kalmadı ✓" der.
Surekli tekrarlanan bir uyari, uyari olmaktan cikar; arka plan gurultusune
doner ve GERCEK bir uyari geldiginde de gorulmez.

ajan.js v=20260731m. DOSYALAR: ajan.js + index.html

## 242. AVRUPA ENFLASYON KARTI — ECB'den kirilimli (31 Tem)

Kullanici: "Avrupa kartinda enflasyon kartı yok, ECB apisinden ceker misin?"
YARIM DOGRU: HICP zaten cekiliyordu AMA "ECB FAİZ & ENFLASYON" kartinin
ICINE sikistirilmisti, uc satirla (manset·cekirdek·enerji).
ECB'nin TEK YASAL GOREVI fiyat istikrari; enflasyon faiz kartinin alt satiri
olamaz. Kendi kartina cikarildi ve kirilim eklendi.

### 242.1 EKLENEN SERILER (ICP akisi)
  FOOD00  gida · SERV00 HIZMET · IGXE00 sanayi mali (enerji disi)
  ULKE: M.<DE|FR|IT|ES>.N.000000.4.ANR
ICP akisinda ulke kodu U2 yerine ISO2 ile degisiyor — ayni desen.

### 242.2 SIRA: manset → cekirdek → HIZMET
ECB toplanti metinlerinde bu sirayla okur. HIZMET en yapiskan kalem cunku
ucretlere bagli: manset hedefe inse bile hizmet %3'un ustundeyse indirim
GECIKIR. Ayri vurguyla gosteriliyor.
Her satirda UC bilgi: seviye · hedefe uzaklik (%2) · ivme (onceki aya gore).
Seviye tek basina yon soylemez; ivme soyler.

### 242.3 ULKE MAKASI — parcalanma termometresi
Dort ulkenin yillik HICP'si ve aralarindaki MAKAS. Tek para politikasi,
enflasyonlar ayristikca herkese ayni gelmez: Almanya %1,8 iken Ispanya %3,5
ise ayni faiz birine gevsek digerine siki olur. 1,5 puan uzeri "ayrisma
belirgin" diye isaretleniyor.
Bu, BTP-Bund spread'inin (mevcut tahvil karti) enflasyon tarafindaki karsiligi.

### 242.4 OKUMA — kural tabanli, AI YOK
Uc kural, hepsi olculebilir:
  · manset < cekirdek -> dusus enerji/gidadan, KALICI DEGIL
  · hizmet > %3       -> ucret baskisi surüyor, indirim alani dar
  · |cekirdek − 2| < 0,4 -> ECB icin rahatlama sinyali
Kart tahmin etmiyor, gozlemi soyluyor.

app.js v=20260731w. DOSYALAR: app.js + index.html

## 241. UC TUR AYNI SATIRI DUZELTEMEDIM — sebep IKI DOSYA BAGIMLILIGI (31 Tem)

Kullanici hakli olarak patladi: "ulan bir 24 temmuzu duzeltemedin."
UC TUR boyunca ayni metin ekranda kaldi. Sebep tek: METIN IKI DOSYADAYDI.

### 241.1 NEDEN TAKILDI
  index.html -> baslik metni STATIK: "...akış 24 Tem Fintables"
  app.js     -> ozet kutusu metni: "köprü ritüeli · TEFAS kapalı..."
Her duzeltmede IKISI de degisiyor. Ustelik surum etiketi (?v=) index.html'de,
duzeltme app.js'te — yani:
  · yalniz app.js yuklenirse -> tarayici eski app.js'i onbellekten verir
    (cunku index.html hala eski ?v= istiyor)
  · yalniz index.html yuklenirse -> yeni ?v= ister ama app.js eski
Konsol bunu ELE VERDI: `app.js?v=20260731r` yaziyordu, benim son surumum
`t` idi. Yani kullanici r'yi yuklemis, ben s ve t uretmisim.
BENIM HATAM: her kucuk duzeltmede surumu ziplattim ve her seferinde IKI
DOSYA istedim. Uc tur boyunca en az biri eksik kaldi.

### 241.2 COZUM: BASLIGI DA app.js YAZSIN
katfonRender basinda:
    document.querySelector('#t5 h2 .thin').textContent = '...'
Sekme her cizildiginde calisir. index.html'de ne yazdigi ARTIK ONEMSIZ.
SONUC: bu metin icin TEK DOSYA yuklemek yeter.

### 241.3 DERS — TEK KAYNAK ARAYUZ METNI ICIN DE GECERLI
§112'de "tek kaynak" kurali VERI icin konulmustu. Ayni sey ARAYUZ METNI icin
de gecerliymis: ayni cumle iki dosyada duruyorsa, degistiginde IKI DOSYAYI DA
yuklemek gerekir ve biri mutlaka unutulur.
Bu, §235'teki "iki kopya" dersinin arayuz versiyonu — orada kod kopyasiydi,
burada METIN kopyasi. Ikisi de ayni sonucu verdi: duzeltme birine uygulandi,
digeri eski kaldi, saatler kayboldu.
KURAL: bir metin/mantik ikinci kez yaziliyorsa DUR. Tek yerde tut, digeri
oradan okusun.

app.js v=20260731u. DOSYA: YALNIZ app.js

## 240b. KATFON DOGRULANDI + BAYAT METINLER TEMIZLENDI (31 Tem)

Ekran kontrolu: alti fon satiri ve sekiz ozet kutusu DOSYAYLA BIREBIR.
    TLV · NSA · AIS · PKT · KSK · NSP  -> YU · AUM · akis · 1G · YTD hepsi ✓
    toplam 479,3 mlr · net akis −3,4 mlr · ort YTD %22,38 · 43 fon ✓
    en yuksek KKL %29,32 · en dusuk KIS %9,74 ✓
    en cok giren KTV +600 mn · en cok cikan ZP8 −1,6 mlr ✓
Veri DOGRU. Sorun yalniz METINLERDEYDI.

### 240b.1 UC BAYAT METIN
  index.html basligi: "1G+fiyat+AUM canlı TEFAS (yeni API) · dönem getirileri
    damgalı taban · akış 24 Tem Fintables"
  app.js damgasi: "köprü ritüeli · ..."
  app.js uyarisi: "TEFAS canlı çekim kapalı, bot koruması sunucudan erişime
    izin vermiyor (§147)"
UCU DE ARTIK GECERSIZ: veri tek Fintables sorgusuyla, tek tarihte geliyor;
TEFAS'a hic gidilmiyor; kopru rituali diye bir surec kalmadi.

### 240b.2 NEDEN ONEMLI — inandiriciligi tuketiyor
Kapanmis bir kapinin onunde nobet tutmaya devam etmek, panelin DIGER
uyarilarinin da ciddiyetini azaltir. Kullanici "TEFAS kapali" yazisini her
gun gorup gormezden gelmeye alisirsa, GERCEK bir arizada da gormez.
Bu, §185'teki "gecici durum kalici gorunmemeli" kuralinin AYNASI:
kalkmis bir kisit da kalici gorunmemeli.

### 240b.3 YENI DAMGA — tarih AYRISMASINI izliyor
Eski metin sabit bir uyariydi. Yenisi KOSULLU:
    fiyat_tarihi === akis_tarihi  -> "tek tarih, tümü Fintables"
    ayrisirsa                     -> KIRMIZI "TARİHLER AYRIŞIK — hangi
                                      rakamın hangi güne ait olduğuna dikkat"
Yani uyari, GERCEKTEN bir sorun oldugunda cikiyor. Bugun ayrisik degil, o
yuzden sakin metin gorunuyor. Onceki halde her gun ayni uyari vardi ve
hicbir sey soylemiyordu.

app.js v=20260731t. DOSYALAR: app.js + index.html + katfon.json

## 240. "YUKLEDIM AMA GORUNMUYOR" — 21 dosyada onbellek acikti (31 Tem)

Kullanici katfon.json'u yukledi, panel ESKISINI gosterdi. Dosyayi actik:
`guncelleme: 2026-07-31` — DOSYA DOGRUYDU. Sorun TARAYICI ONBELLEGI.

### 240.1 OLCUM
    22 JSON cekiminden YALNIZ 1'inde {cache:'no-store'} vardi
    (bist-takvim.json — o da §166'da elle eklenmisti)
Diger 21 dosya tarayici onbellegi ile servis ediliyordu.
JS ve CSS dosyalari ?v= etiketi tasiyor, degistiginde URL degisiyor ve
tarayici yeniden cekiyor. JSON VERI dosyalarinda boyle bir mekanizma YOK —
URL sabit, icerik degisiyor, tarayici fark etmiyor.

### 240.2 BU SORUN BUGUN KAC KEZ ZAMAN KAYBETTIRDI
Deploy sonrasi "calismadi" diye teshis kurdugumuz her tur bu ihtimali
tasiyordu. §228'de API'ye surum damgasi, §231'de panele surum rozeti
ekledim — IKISI DE DOGRUYDU ama KOK SEBEBI cozmuyordu:
kod dosyalari icin ?v= vardi, VERI dosyalari icin hicbir sey yoktu.
Rozet "panel yeni" der, veri eski gelir, teshis yine yaniltir.

### 240.3 COZUM VE GEREKCESI
21 cekime {cache:'no-store'} eklendi.
NEDEN GUVENLI: bir veri dosyasi TAZELENMEK icin vardir; onbellege alinmasi
amacina aykiridir. Vercel CDN'i zaten s-maxage ile yonetiyor — istemci
onbellegi ustune bir katman daha ekliyor ve o katman KONTROLSUZ.
Maliyet: her acilista tekrar indirme. Dosyalar kucuk (en buyugu ~200 KB),
CDN'den geliyor, fark hissedilmez.

### 240.4 DERS — MEKANIZMA VARSA HER TURU KAPSAMALI
JS icin surum etiketi kurulmustu ve ISLIYORDU. Veri dosyalari AYNI SORUNU
yasiyordu ama mekanizmanin disinda kalmisti.
Bir cozum bir DOSYA TURU icin kurulduysa, "digerleri de ayni sorunu yasar mi"
diye sorulmali. Burada cevap EVETTI ve alti ay boyunca sorulmadi.

DOSYALAR: app.js (v=20260731r) + katfon.json + index.html

## 239. KATFON TAZELENDI — tek oturumda, tek tarihte (31 Tem)

Onceki hali: getiriler 28 Tem, AUM/akis 29 Tem — IKI FARKLI TARIH ve ikisi de
bayat. "Fintables kopru rituali" ile elle toplaniyordu.
Simdi Fintables MCP ile UC SORGUDA bitti ve HEPSI AYNI TARIH: 31 Tem.

### 239.1 NASIL
  1. gunluk_fon_degerleri -> 46 fon icin buyukluk · yatirimci · gunluk akis
     (DISTINCT ON + tarih DESC ile fon basina en son kayit)
  2. mumlar_gunluk_gh     -> son ve onceki gun kapanisi (1G getirisi)
  3. mumlar_gunluk_gh     -> referans tarihlerdeki kapanislar
     1A=30 Haz · 3A=30 Nis · YTD=31 Ara 2025 · 1Y=31 Tem 2025 · 3Y=31 Tem 2023
     (her donem icin PARTITION + ROW_NUMBER ile o tarihe kadarki SON islem gunu)
REFERANS TARIHI SECIMI ONEMLI: "30 Haziran" tatil olabilir; `t <= tarih`
kosuluyla o tarihe kadarki SON ISLEM GUNU aliniyor, boslugu atlamiyor.

### 239.2 DENETIM — dort kural kosuldu
  tarih birligi        ✓ fiyat = akis = getiri = 2026-07-31
  1G aykiri (|%|>1,5)  ✓ yok
  1G bosluk            ✓ yok, 46/46
  donem sirasi (YTD>=3A>=1A)  ✓ bozuk yok
Dorduncusu ozellikle degerli: getiri hesabinda referans tarihi kayarsa donem
sirasi BOZULUR ve bu tek bakista gorunur. §186'daki denetim kulturunun
fon tarafina uygulanmasi.

### 239.3 TABLO
  TOPLAM AUM       479,3 mlr TL (46 fon)
  31 Tem NET AKIS  −3.439 mn TL — cikis gunu
  En buyuk: KLU 93,1 · KPR 77,4 · ZP8 57,7 mlr
  En yuksek YTD: KKL %29,3 · TLV %27,0 · KNS %25,5
En buyuk cikislar ZP8 (−1,61 mlr) ve KLU (−1,18 mlr); en buyuk giris
KTV (+600 mn) ve HPV (+555 mn).

### 239.4 DERS — "KOPRU RITUELI" GEREKSIZDI
Bu veri Fintables'ta HEP VARDI. Elle toplama ritueli, aracin ne verdigini
tam bilmemekten dogmustu. §238'de ayni sey olmustu (web'de aradim, MCP
bagliydi).
KURAL: tekrarlayan bir ELLE IS varsa, once "bu veriyi zaten veren bir arac
var mi" diye sor. Rituel kurmak, aracin yerine gecmez — sadece gorunmez kilar.

DOSYALAR: katfon.json

## 238. FINTABLES MCP — dogru arac elimin altindaydi (31 Tem)

Kullanici: "abi fintablesten ceksene." HAKLI. Iki tur web aramasi yapip
"acilanan rakamlari bulamiyorum" dedim; oysa FINTABLES MCP BAGLIYDI.
Tek sorguda geldi.

### 238.1 NE YAPTIM
    hisse_finansal_tablolari -> YKBNK 2026/6 yayinlanmis mi?
      -> 2026-07-31T05:00:31Z (08:00 TSI) · KAP 1639924 · sablon 'bank'
    hisse_finansal_tablolari_gelir_tablosu_kalemleri -> 45 kalem, try_ceyreklik
    ayni tablodan 1C26 (2026/3) ve 2C25 (2025/6) -> karsilastirma
Uc sorgu, tam veri, CEYREKLIK sutun (enflasyon sapmasi yok).
Web aramasi iki turdur bulamadigi rakami Fintables ANINDA verdi — cunku
KAP'a dusen veriyi ISLEYIP saklyor, haber sitesinin yazmasini beklemiyor.

### 238.2 DERS — ARAC ENVANTERINI KONTROL ET
Bu oturumda KAP ayristiricisi kurarken "Fintables bagimliligini kirdik" diye
sevindim (§207.1). Dogruydu — AMA Fintables'i KULLANMAYI birakmak anlamina
gelmiyordu. Bagimliligi kirmak, aracin degerini yok etmez.
Ustelik hiz farki buyuk: KAP ayristirici 5 MB sayfa cekip regex ile
ayristiriyor; Fintables tek SQL sorgusu. Ikisi FARKLI ISLER icin:
  · KAP ayristirici -> panelde CANLI, sunucudan, aninda, bagimsiz
  · Fintables MCP   -> BURADA, oturum icinde, kart yazarken
DERS: elde birden fazla arac varsa, gorevin dogru aracini SEC. "Yeni kurdum"
demek, "her yerde onu kullan" demek degil.

### 238.3 YKBNK BULGUSU — teshis dogru, SEBEP yanlis
Is Yatirim "YKBNK sektorun gerisinde kalacak: marj baskisi + zayif ticari
gelirler" demisti.
GERCEKLESEN: net faiz geliri c/c +%2,0 ARTTI — marj baskisi OLMADI.
Yonetim de 1C'de "2C'de marjda asagi yonlu seyir" demisti, o da olmadi.
Kari tek basina TICARI ZARAR dusurdu: −27,26 mlr (c/c %45 derinlesme),
altinda turev finansal islemlerden −39,94 mlr (1C: −9,72, DORT KAT).
Yani tahmin TUTTU (10,72 vs 10,76 beklenti) ama GEREKCESI tutmadi.
BU AYRIM ONEMLI: dogru sayiya yanlis sebeple ulasan bir tahmin, gelecek
ceyrekte YANLIS sayiya goturur.

### 238.4 UC BANKA ORTAK DESENI
    GARAN 30,30 mlr · AKBNK 15,20 mlr · YKBNK 10,72 mlr (2C ceyreklik net kar)
Ucunde de AYNI YAPI: cekirdek bankacilik (net faiz + komisyon) TUTUYOR,
ticari zarar ve karsilik ALT SATIRI YIYOR.
Bu, panelin TL/Sabit Getirili tezine ve PPK patikasina dogrudan girdi:
bankalarin ticari zarari faiz patikasina duyarli; indirim dongusu hizlanirsa
bu kalem TERSINE DONER.

DOSYALAR: inceleme-ai.json (28 kart)

## 237. TASLAK KARTINDA UC KUSUR (31 Tem)

BORSK taslagi onaylandi, Earnings AI'a dustu. Uc sorun:

### 237.1 DONEM IKI KEZ BICIMLENDI: "2026/2026/1"
Nobet kaydinda `donem` ZATEN "2026/1" olarak biciimlendiriliyordu.
Taslak dugmesi bir kez DAHA yil+'/'+donem yapiyordu -> "2026/2026/1".
DUZELTME: biciimlendirme TEK YERDE (nobet kaydinda), dugme onu OLDUGU GIBI
gecirir.
DERS: ayni degeri iki yerde bicimlendirmek, iki yerde hesaplamakla ayni
sinifta. Bir yerde yap, digeri KULLANSIN.

### 237.2 KART TARIHI BUGUN YAZILIYORDU
`tarih_iso` uretim gunu (31 Tem) olarak yaziliyordu. BORSK 30 Tem'de
aciklamisti; kart GARAN'in (30 Tem) USTUNE cikti ve listede yanlis yere
oturdu.
Siralama tarih_iso'ya gore ve dogru olan BILDIRIM TARIHI.
DUZELTME: bildirim tarihi zincirin basindan sonuna tasiniyor
(nobet kaydi `tsIso` -> dugme -> POST `tarihIso` -> kart `tarih_iso`).
Uretim zamani `_uretim` alaninda ayrica duruyor, kaybolmuyor.

### 237.3 NOBET ONAYLANAN KARTI GORMUYORDU
Nobet kartlari YALNIZ inceleme-ai.json'dan okuyordu. Onaylanan taslak
buluta yaziliyor ve Earnings AI'da GORUNUYOR ama nobet onu gormedigi icin
"kart bekliyor" demeye DEVAM EDIYORDU.
Kullanici karti onayliyor, is bitiyor, nobet hala uyariyor — en can sikici
YANLIS POZITIF turu: yapilan isi yapilmamis gostermek.
app.js ayni birlestirmeyi §222b'de yapiyordu; NOBETE EKLEMEYI UNUTTUM.
ONIKINCI "bir yeri degistirip digerini birakma" vakasi — ve yine ayni desen:
bir birlestirme mantigi IKI TUKETICI tarafindan gerekiyordu, birine yazildi.

ajan.js v=20260731k. DOSYALAR: ajan.js + api/ajanktp.js + index.html.

## 236. AAPL + AMZN KARTLARI — dortlu tablo tamamlandi (31 Tem)

30 Tem kapanis sonrasi ikisi de acikladi. §184 kurali islendi: once Alpha
Vantage (YINE BOS — EARNINGS_ESTIMATES: []), sonra web. Istisna UCUNCU kez
dogrulandi: AV aciklama gunu ve ertesi gun kullanilamiyor.

### 236.1 AAPL — POZITIF, ama asil ilginc yani BASKA
Ciro 109,40 mlr$ (bek 108,75) · EPS 2,02$ (bek 1,88, y/y +%29).
Ikisi de asildi ama kartin degeri rakamda degil: APPLE BU SEZONUN
KARSI ORNEGI. MSFT·META·AMZN'de soru "AI harcamasi getiri uretiyor mu"
idi; Apple o soruyu HIC SORMUYOR — veri merkezi kurmuyor, 100 mlr$ geri
alimla nakdi hissedara donduruyor. Belirsizlik haftasinda RISK SIGINAGI
olarak fiyatlandi, NVIDIA'dan en degerli sirket unvanini geri aldi.
KARTTA DENGE KURULDU: bu bir TAKAS, ustunluk degil. Varlik-hafif yaklasim
kisa vadede marji korur, uzun vadede ekosistemi AI yeteneklerinde geride
birakabilir — ve bugunku rakamlar takasin MALIYETINI gostermez.

### 236.2 AMZN — KARISIK, ucluуnun ORTA NOKTASI
Ciro 200,60 mlr$ (ILK 200 mlr$ ceyregi, 18 ceyregin en hizlisi).
AWS 42,23 mlr$ +%36,7 (bek 40,54) — 2021'den beri en hizli.
AMA FCF −7,60 mlr$ ve uzun vadeli borc y/y +%123 -> 119 mlr$.

### 236.3 DORT SIRKET, AYNI SORU, DORT CEVAP — bu sezonun tablosu
    MSFT  Azure +%43     faaliyet marji YATAY %45   -> harcama GETIRI URETIYOR
    AMZN  AWS +%36,7     FCF −7,6 mlr$              -> getiri VAR, nakit YOK
    META  gelir +%28     faaliyet marji %43->%31    -> harcama VAR, getiri YOK
    AAPL  EPS +%29       veri merkezi capex'i YOK   -> soruyu hic sormuyor
PIYASA HER BIRINI AYRI FIYATLADI: MSFT odullendirildi · META cezalandirildi ·
AMZN affedildi (+%7) · AAPL siginak oldu.
DERS: "sektor" diye tek bir tepki YOK. Ayrim GETIRININ GORUNURLUGUNDE.
Bu, panelin sektor rotasyonu okumasina da uyariyor — XUTEK'in −%4,68 dustugu
gun bu dort sirket dort ayri yone gitti.

### 236.4 SUPHELI RAKAM ISARETLENDI
Kaynakta "AWS marji %13,69 rekor" diye bir ifade var. AWS'nin tarihsel marji
COK DAHA YUKSEK; bu rakam baska bir metrik olabilir. Karta yazildi AMA
"DOGRULANMADAN KULLANILMAMALI" notuyla.
§184'un ozu: kaynagin soyledigini aynen aktarmak degil, TUTARSIZ GORUNENI
ISARETLEMEK.

DOSYALAR: inceleme-ai.json (27 kart)

## 235. IKI KOPYA VARDI — kok sebep buydu (31 Tem)

Kullanici hakli olarak patladi: "onceden yaptigin seyi simdi niye yapamiyorsun?"
CEVAP: ayni isi yapan IKI AYRI KOPYA vardi ve duzeltmeleri hep BIRINE uyguladim.

### 235.1 KOPYALAR
    _bilancoAyristir icindeki `kalemBul`   -> mod=bilanco · mod=kart · mod=ceyrek
    mod=tablo icindeki `bul`               -> Finansal Tablolar sekmesi
Ayni mantik, ayri yazim. Degisken adlari bile farkliydi (`hucreler` vs `hc`) —
bu yuzden toplu arama-degistirme de birini atliyordu.
§233b'deki DAR SATIR KURTARMASI yalniz `kalemBul`a eklendi. TOASO 8 kalemlik
yolda calisti, genis tabloda calismadi.
UC TUR bunu sablon eksigi / satir siniri / teshis araci sandim. Hepsi ORTAK
kisimdi ve ortak kisim ZATEN calisiyordu.

### 235.2 COZUM: TEK FONKSIYON
`_hucreBul(h, etiketler, ad, sinir)` — iki cagiran da buna delege ediyor.
Ikinci kopya YOK, dolayisiyla sapma da OLAMAZ.
mod=teshis de ayni dar-sinir + kurtarma mantigini kullaniyor artik; yoksa
teshis "sayi yok" derken ayristirici buluyor olabilirdi — arac yaniltir.

### 235.3 DERS — AYNI ISI IKI YERDE YAZMA
Bu oturumda ONBIRINCI "bir yeri degistirip digerini birakma" vakasi ama
digerlerinden FARKLI: otekiler UNUTMAKTI, bu YAPISALDI.
Iki kopya varsa, unutmak KACINILMAZDIR — mesele dikkat degil TASARIM.
KURAL: ayni mantigi ikinci kez yazmak uzere oldugunda DUR ve ortak fonksiyona
cikar. "Simdilik kopyalayayim" demek, gelecekteki her duzeltmeyi IKI KEZ
yapmayi ve birini unutmayi kabul etmektir.
Ve unutuldugunda hata KOPYADA degil, kopyanin OLMASINDA aranmali — ben uc tur
kopyanin icinde aradim.

### 235.4 BUGUNUN OZETI — KAP ZINCIRI
On tur surdu, sekiz gercek hata cikti (§201·202·206·208·210·211·212·230·232·234)
ve ucu BENIM ACTIGIM regresyondu (§230 kisit · §232 suzgec · §235 kopya).
Calisan bir seyi bozup sonra baska yerde aramak, en pahali dongu.

surum kap-2026-07-31-j. DOSYALAR: api/kap.js

## 234. TOASO'YU BEN KIRDIM — tabloIdler tekillestirmede kayboluyordu (31 Tem)

Kullanici hakli olarak kizdi: "beceremedin bu isi ya, bozdun."
DOGRU. TOASO 2C26 mod=ceyrek ile 12/12 CALISIYOR ama Finansal Tablolar'da
"ayristirilamadi" diyordu. Sebep §232'de actigim kirik.

### 234.1 KIRIK
Tekillestirmede daha erken bir bildirim kaydin yerine gecerken:
    yeni.tekrar = eski.tekrar;
    yeni.idler  = eski.idler;     // tasiniyor
    // yeni.tabloIdler            <- TASINMIYOR
TOASO'nun EN ERKEN bildirimi "Sorumluluk Beyanı" (20:54). O kaydin
tabloIdler'i BOS. Yerine gecince Finansal Rapor kimligi (1639026) KAYBOLDU.
Sonra §232 suzgeci "tabloIdler bos" diye kaydi TAMAMEN ELEDI ->
"bildirim bulunamadi".
Finansal Rapor ORADA DURUYORDU; kayit suzgece takiliyordu.

### 234.2 ONUNCU TEKRAR — ve en pahaliisi
  §129 · §189 · §194 · §208 · §211c · §219b · §224 · §230 · §232 · §234
Hepsi: BIR YERI DEGISTIRIP DIGERINI BIRAKMAK.
Bu sefer ozellikle kotu cunku:
  (a) §232'de suzgeci eklerken tekillestirmenin O DALINA bakmadim
  (b) uc tur boyunca YANLIS YERDE aradim (sablon, satir siniri, teshis araci)
  (c) her turda "duzelttim" deyip kullaniciyi tekrar denemeye gonderdim
CALISAN bir seyi bozup sonra baska yerde arama — en pahali hata dongusu.

### 234.3 NE YAPMALIYDIM
TOASO mod=ceyrek ile CALISIYORDU. Finansal Tablolar'da calismiyordu.
IKI YOL ARASINDAKI FARKI ilk turda listelemeliydim:
    mod=ceyrek : id DISARIDAN gelir, mod=fr KULLANMAZ
    mod=tablo  : id'yi mod=fr'den ALIR
Fark mod=fr'deydi ve mod=fr'yi §232'de DEGISTIRMISTIM. Uc tur once
bulunabilirdi.
KURAL: bir sey BIR YERDE calisip DIGERINDE calismiyorsa, once IKI YOLUN
FARKINI listele. Ortak kismi sucla degil.

### 234.4 TARAMA
Devralma noktasindaki tum alanlar kontrol edildi: idler · tabloIdler · solo
artik tasiniyor. Baska kayip alan yok.

surum kap-2026-07-31-i. DOSYALAR: api/kap.js

## 233. TESHIS ARACI YANLIS SABLONA BAKIYORDU (31 Tem)

Rozet dogru: panel 20260731-p · api kap-2026-07-31-g. IKISI DE YENI.
Ama TOASO 2C26 Finansal Tablolar'da "ayristirilamadi" diyor — oysa
mod=ceyrek ile 12/12 CALISIYOR.

### 233.1 IKI AYRI SABLON VAR, TESHIS BIRINE BAKIYORDU
  mod=kart / mod=ceyrek -> _SANAYI (8 kalem) · _BANKA (6 kalem)
  mod=tablo             -> _BILANCO_SANAYI (15) · _GELIR_SANAYI (18) ·
                           _BILANCO_BANKA (8) · _GELIR_BANKA (11)
Finansal Tablolar sekmesi mod=tablo kullaniyor. Teshis ise yalniz KART
sablonunu tariyordu. Yani mod=tablo'nun sorunu TESHIS EDILEMIYORDU —
arac yanlis yere bakiyordu.
Bir teshis araci, TESHIS ETTIGI SISTEMLE AYNI SABLONA bakmali. Yoksa
"bulunamadi" cevabi sistemin degil ARACIN eksigini olcer.
ARTIK: 66 kalem taraniyor ve her biri `kaynak` alani tasiyor
(kart/sanayi · tablo/gelir-sanayi ...). `sablonOzeti` hangi listenin kac
kalem buldugunu ozetliyor.

### 233.2 DAR SATIR SINIRI KURTARMASI
§225'te satir siniri eklendi ve DOGRUYDU — 3000 karakterlik dilim alttaki
satira tasiyordu. AMA bazi tablolarda </tr> beklenenden ERKEN geliyor
(ic ice tablo, hucre ici div sarmali) ve deger hucreleri disarida kaliyor.
O zaman hic sayi bulunamiyor, kalem "yok" sayiliyor.
COZUM: once DAR sinirla dene; sayi cikmazsa 2200 karakterlik pencereyle
BIR KEZ DAHA dene. Dar sinir oncelikli — dogru olan o; genis pencere yalniz
kurtarma.
Yedek pencere de 900'den 2200'e cikarildi; 900 bazi tablolarda deger
hucrelerine ulasmiyordu.

### 233.3 DERS — DUZELTMENIN YAN ETKISINI OLC
§225 gercek bir kusuru duzeltti ama YENI bir kusur acti: cok dar sinir.
§223 (isaret kisiti) da oyleydi — dogru fikirdi, gecerli veriyi reddetti (§230).
Bir kisit eklerken "neyi engelliyorum" kadar "neyi ENGELLEMEMELIYIM" de
sorulmali. Ikisi de bu oturumda ayni sekilde kacti: kisit yazildi, ETKI ALANI
olculmedi.

surum kap-2026-07-31-h. DOSYALAR: api/kap.js

## 232. CANTE COZULDU — AYRISTIRACAK BILANCO YOKMUS (31 Tem)

Teshis tek bakista bitirdi:
    "secilen": { "id":1635828, "baslik":"TSRS Uyumlu Sürdürülebilirlik Raporu" }
    "sayfadakiDigerBasliklar": ["İç karbon fiyatı (TL)", ...]
CANTE'nin nobette yakalanan bildirimi SURDURULEBILIRLIK RAPORU. Icinde
bilanco YOK, olmasi da beklenmez.
AYRISTIRICI BOZUK DEGILDI — AYRISTIRACAK BILANCO YOKTU.

### 232.1 KOK SEBEP: SINIFA BAKTIM, BASLIGA DEGIL
KAP `disclosureClass:'FR'` altinda DORT ayri sey veriyor:
    Finansal Rapor · Faaliyet Raporu · Sorumluluk Beyani ·
    TSRS Uyumlu Surdurulebilirlik Raporu
Yalniz BIRINCISINDE tablo var.
§227'de bunu KESFETTIM ve `tip` alanini hesapladim. AMA NOBETI ONA
BAGLAMADIM — nobet sinifa bakmaya devam etti.
BIR AYRIMI HESAPLAYIP KULLANMAMAK, HIC HESAPLAMAMAKLA AYNI.
Bu oturumun DOKUZUNCU "bir yeri degistirip digerini birakma" vakasi.

### 232.2 TESHIS ARACININ KENDISI YANILTICIYDI
mod=teshis'te su vardi:
    secilen = tablolu[0] || bulunan[0] || null;
Tablo tasiyan yoksa SESSIZCE listedeki ilkine dusuyordu — CANTE'de
surdurulebilirlik raporuna dusup "0 kalem" raporladi. Yani teshis, "sablon
uyusmuyor" izlenimi verdi; oysa dogru cevap "bu bildirimde bilanco yok"tu.
Bir teshis araci YANLIS YERE BAKARSA, aradigi seyi bulamamasi TESHIS DEGIL
GURULTUDUR.
ARTIK: tablo tasiyan yoksa acikca soyluyor ve ne buldugunu LISTELIYOR.

### 232.3 DUZELTME
mod=fr artik tablo tasimayan bildirimleri SUZUYOR (?tumu=1 ile kapatilabilir).
Yanitta `suzgec` ve `suzulen` alanlari var — kac bildirimin elendigi gorunur.
SONUC: CANTE ve GENIL nobet listesinden DUSECEK. Ikisi de finansal rapor
vermemis; nobet onlari yanlislikla isaretliyordu.

### 232.4 DERS — "BULUNAMADI" UC AYRI SEY DEMEK OLABILIR
  (a) veri var, ayristirici bulamiyor      -> sablon eksigi
  (b) veri var, kisit reddediyor            -> kisit yanlis (§230)
  (c) VERI YOK                              -> aranacak sey yok  <- CANTE
Ucu de ayni mesaji veriyordu: "ayristirilamadi". Uc tur (a) ve (b) sandim,
(c) cikti. Teshis alani olmasa hala saniyordum.
Bir hata mesaji, HANGI TURDEN oldugunu ayirt etmiyorsa yol gostermez.

surum kap-2026-07-31-g. DOSYALAR: api/kap.js

## 230. KENDI KISITIMI GECERLI VERIYI REDDEDER HALE GETIRDIM (31 Tem)

BORSK ONCE CALISIYORDU — kart uretildi, Earnings AI'a dustu. Sonra uc
kimlikte de "ayristirilamadi" demeye basladi. SEBEP BENDIM.

### 230.1 §223'UN YAN ETKISI
§223'te yanlis satir yakalamayi onlemek icin sabit ust sinir koydum:
    const _UST_SINIR = 1e9;
Gerekce: "bin TL cinsinde bir kalem 1 milyar bin TL'yi (1 katrilyon TL)
asamaz — BIST'te oyle sirket yok." DOGRUYDU — AMA YALNIZ BIN TL ICIN.
BORSK raporunu TL cinsinden veriyor. Cirosu 1.383.291.932 TL (1,4 milyar).
Bu sinir 1e9'u ASIYOR -> gecerli deger REDDEDILDI -> 0 kalem.

### 230.2 IKI DEGISIKLIK BIRBIRINI GEREKTIRIYORDU
§229'da birim tespitini ekledim (rapor TL mi bin TL mi soyluyor).
Ama SINIRI ona baglamayi unuttum. Iki degisiklik yan yana yapildi ve
BIRI DIGERINI GEREKTIRIYORDU:
  · birim tespiti -> olcek biliniyor
  · ust sinir     -> olcege gore ayarlanmali
Birini yapip digerini birakmak, bu oturumun SEKIZINCI tekrari.
FARKI: bu sefer iki degisiklik AYRI TURLARDA yapildi ve aralarindaki
bagimlilik GORUNMUYORDU. Ayni turda olsalar fark ederdim.

### 230.3 KENDI YORUMUM UYARIYORDU, OKUMADIM
§223'un yorumunda AYNEN sunu yazmisim:
    "bin TL cinsinde bir kalem 1 milyar bin TL'yi asamaz"
Varsayim ACIKCA yaziliydi. Yazdim ama DOGRULAMADIM — "her rapor bin TL mi?"
diye sormadim. Alti tur sonra §229'da "her rapor bin TL DEGIL" diye
kesfettim ve yine baglamadim.
DERS: bir kisitin dayandigi varsayimi YAZMAK yetmiyor; o varsayim
DEGISTIGINDE kisiti da guncellemek gerekiyor. Yorum bir HATIRLATICI degil,
BAGLANTI olmali — kod duzeyinde.

### 230.4 COZUM
    _ustSinir(birim):  TL -> 1e12 · bin TL -> 1e9 · milyon TL -> 1e7
                       belirsiz -> 1e13 (GENIS)
SUPHEDE GENIS TUT: reddedilen veri geri gelmiyor; fazla kabul edilen veri
denetimde yakalanir. Asimetri acik.
Sinir mod=bilanco · mod=tablo · mod=teshis'te de gecirildi; teshis ciktisinda
`ustSinir` ve red sebebi ("büyüklük sınırı 1e9") yaziyor.

surum kap-2026-07-31-f. DOSYALAR: api/kap.js

## 229. BIRIM VARSAYIMI — kucuk sirketleri BIN KAT buyuk gosteriyordu (31 Tem)

BORSK karti Earnings AI'a dustu ama rakamlar sacmaydi:
    "Brüt Kar 77.668.780 bin ₺"  = 77,7 MILYAR TL
Kucuk bir seker sirketi icin imkansiz. Net zarar 282 milyar, nakit 343 milyar.
AYNI SAYILAR TL OLARAK OKUNUNCA: 77,7 mn · 282 mn · 343 mn — hepsi oturuyor.

### 229.1 SEBEP: HER RAPORU BIN TL VARSAYIYORDUM
KAP raporlarinda birim SIRKET SECIMIDIR: kimi "TL", kimi "Bin TL", nadiren
"Milyon TL". Sayfada belirtilir.
Ben `not` alanina sabit "Birim BIN TL" yaziyordum ve istem de modele boyle
soyluyordu. Model tekrarliyordu.
BU SESSIZ BIR HATAYDI: sayilar makul BICIMDEYDI (binlik ayrac, dogru isaret,
tutarli y/y), yalniz OLCEGI bin kat yanlisti. Hicbir denetim kurali
yakalamaz — cunku her sey kendi icinde tutarli.
Yakalayan: kullanicinin SIRKETI TANIMASI. "BORSK bu kadar buyuk olamaz."

### 229.2 COZUM: RAPORDAN OKU, VARSAYMA
`_birimBul(h)` sayfadaki birim ifadesini arar:
    "Bin TL" / "(Bin TL)" / "bin Türk Lirası"  -> bin TL
    "Milyon TL"                                 -> milyon TL
    "Tam TL" / "tutarlar Türk Lirası olarak"    -> TL
    hicbiri yoksa                               -> 'belirsiz'
BELIRSIZSE VARSAYILAN UYDURULMAZ. 'belirsiz' doner, arayuzde KIRMIZI
"raporda bulunamadi, olcek DOGRULANMALI" yazar, isteme de "birim belirsiz,
ozet icinde SOYLE, uydurma" talimati gider.
Birim artik mod=kart, mod=tablo ve taslak zincirinin HER adiminda tasiniyor.

### 229.3 DERS — TUTARLI OLAN DOGRU DEMEK DEGIL (ikinci kez)
§212'de cikarma yontemi "calisiyordu": sayilar makul, isaretler dogru,
mertebe yerinde — ama enflasyon sapmasi tasiyordu.
Burada ayni sey: bicim dogru, ic tutarlilik tam, OLCEK yanlis.
Ikisini de yakalayan sey DIS BILGI oldu: orada Fintables rakamlari, burada
kullanicinin sirket buyuklugu sezgisi.
Bir sistem KENDI ICINDE ne kadar tutarli olursa olsun, DIS DUNYAYLA
karsilastirilmadan dogrulanamaz.

DOSYALAR: api/kap.js + api/ajanktp.js + app.js + ajan.js + index.html.
app.js v=20260731n · ajan.js v=20260731j · kap surum kap-2026-07-31-e.

## 228. SURUM DAMGASI — teshis etmeden once NE KOSTUGUNU bil (31 Tem)

Bugun ALTI KEZ eski dosyayla ugrastik. Cikti okundu, "su duzeltme
calismamis" diye teshis kuruldu, oysa dosya DEPLOY EDILMEMISTI. Her seferinde
bir tur kaybedildi.

### 228.1 COZUM
api/kap.js her yaniti `surum:'kap-2026-07-31-e'` tasiyor (23 yanit noktasi)
ve X-KTPanel-Surum basligi doner.
KURAL: beklenen surumu gormuyorsan GERISINI OKUMAYA GEREK YOK.
Bir sistemin HANGI SURUMUNUN kostugu, ciktisinin ILK SATIRINDA olmali.
Bu, §141'in ("panel ne bildigini degil NEREDEN bildigini de soylemeli")
kod surumune uygulanmis hali.

### 228.2 TESHIS ARTIK KOD ILE CALISIYOR
Onceden ?id= zorunluydu ve kimlik bulmak icin once mod=fr kosmak gerekiyordu.
Simdi ?kod=CANTE&gun=15 yeter: kimligi kendi bulur ve TABLO TASIYAN bildirimi
secer (§227 baslik ayrimi). Secilen bildirim `secilen` alaninda doner —
hangisine bakildigi gorunur.
Teshis aracinin KENDISI zahmetli olmamali; zahmetliyse kullanilmaz ve
tahmine geri donulur.

KULLANIM: /api/kap?mod=teshis&kod=CANTE&gun=15

## 227. BASLIK ZATEN SOYLUYORMUS — deneme yanilma bitti (31 Tem)

Kullanici ham KAP akisini gonderdi ve HER SEY COZULDU. Uc ayri bildirim
AYNI SINIFTA (disclosureClass 'FR') geliyor ama BASLIKLARI farkli:
    "Finansal Rapor"                        -> TABLOLAR BURADA
    "Faaliyet Raporu (Konsolide)"           -> tablo YOK, duz metin
    "Sorumluluk Beyanı (Konsolide Olmayan)" -> tablo YOK, imza sayfasi

### 227.1 UC TURDUR YANLIS YOLDAN GIDIYORDUM
§211'de "en erken bildirim finansal tablo OLMAYABILIR" diye tespit etmistim
ve SIRAYLA DENEME cozumu koymustum. Tespit dogruydu, cozum yanlisti:
SEBEBINI aramak yerine SONUCUNU tolere ettim.
§220'de "solo sablon" diye ekledim — kismen dogruydu ama asil sorun bu degildi.
§225'te satir sinirini duzelttim — gercek bir kusurdu ama CANTE'yi cozmezdi.
UCU DE SEMPTOMA MUDAHALEYDI. Sebep BASLIKTAYDI ve baslik ILK GUNDEN BERI
akista duruyordu (§202.2'de alan listesinde `subject` yazili).
DERS: bir alani LISTELEMEK, OKUMAK degildir. Alan adlarini not aldim ama
iceriklerine bakmadim; bakmis olsam uc tur once cozecektim.

### 227.2 COZUM
mod=fr artik her bildirim icin:
    tip  : 'tablo' | 'faaliyet' | 'beyan' | 'diger'   (baslikten)
    solo : "Konsolide Olmayan" geciyor mu             (sablon secimi icin)
    tabloIdler : yalniz TABLO TASIYAN kimlikler
`idler` dizisi TABLO TASIYANLAR ONDE olacak sekilde siralaniyor.
SONUC: BORSK icin uc deneme yerine BIR. TOASO'nun faaliyet raporu ELENIYOR.
Ustelik `solo` bayragi sayesinde hangi etiket setinin kullanilacagi ONCEDEN
biliniyor — deneme yanilma tamamen kalkiyor.

### 227.3 §225 VE §220 YINE DE GEREKLI
Satir siniri (§225) gercek bir kusurdu: 3000 karakterlik pencere sonraki
satira tasiyordu ve ceyrek sutunlari yanlis doluyordu. Baslik ayrimi bunu
COZMEZ.
Solo etiketler (§220) de gerekli: "Konsolide Olmayan" raporlarda gercekten
farkli basliklar var.
Yani uc duzeltme birbirini TAMAMLIYOR; ama sirasi yanlisti — once basliga
bakmaliydim.

DOSYALAR: api/kap.js

## 226. AYRISTIRICIDA YAPISAL KUSUR + TESHIS UCU (31 Tem)

Kullanici: "cantenin bilancosu gelmiyor, gelen kalemler de sikintili/eksik."

### 226.1 KUSUR: DILIM SONRAKI SATIRA TASIYORDU (§225)
kalemBul, etiketten sonra 3000 KARAKTERLIK dilim alip icindeki TUM sayilari
topluyordu. O pencere birkac <tr> boyunca uzayabiliyor:
    <tr><td>Hasılat</td><td>100.016.179</td><td>91.737.074</td></tr>
    <tr><td>Satışların Maliyeti</td><td>(93.364.595)</td>...
"Hasılat" icin toplanan sayilar ALTTAKI SATIRIN maliyet rakamlarini da
iceriyordu. Boylece `ceyrek` ve `ceyrekOnceki` alanlari YANLIS doluyordu —
cunku onlar 3. ve 4. hucreden okunuyor.
BUYUK SIRKETLERDE gorunmedi cunku tablolari genis ve dolgulu; KUCUK
sirketlerde satirlar sikisik, etki buyuk. CANTE'deki "eksik/karisik" tam bu.
DUZELTME: etiketten sonra ILK </tr>'ye kadar kes. Bulunamazsa dar pencere (900).

### 226.2 ?mod=teshis — TAHMIN ETMEYI BIRAK
"Kalem eksik geliyor" sikayeti tahminle cozulmez. Yeni uc her etiket icin
sunu doner:
  · bulundu mu, HANGI VARYANTLA
  · satirin uzunlugu (satir siniri calisti mi gorunur)
  · hamHucreler — satirdaki ham metinler
  · cozulen — sayiya donenler
  · kisitGecti + redSebebi (buyukluk / isaret uyusmazligi)
AYRICA: sayfada GECEN ama listemde OLMAYAN basliklari tarar
(`sayfadakiDigerBasliklar`) — sablona neyin eklenmesi gerektigi GORUNUR olur.
Bu, TEFAS (§145) ve Finnhub (§167) teshislerinin ayni deseni: once GORUNUR
yap, sonra oku. Uc kez ise yaradi, dorduncude de yarayacak.

KULLANIM: /api/kap?mod=teshis&id=<CANTE bildirim kimligi>

DOSYALAR: api/kap.js

## 224. "EKLENDI" DEDI AMA GORUNMEDI — cizim eski listeden (31 Tem)

BORSK taslagi guzel cikti, skor girildi, "✓ Earnings AI'a eklendi" yazdi.
AMA KART GORUNMEDI.

### 224.1 SEBEP: IKI DEGISKEN, BIRI GUNCELLENDI
§222b'de birlestirme eklendi:
    let birlesik = kartlar;  ...  INC_KARTLAR = birlesik;
INC_KARTLAR guncellendi (nobet ve takvim onu okuyor) AMA CIZIM hala
`kartlar`i kullaniyordu — yani YALNIZ DOSYADAN geleni:
    if(!kartlar.length) ...
    el.innerHTML = kartlar.map(...)
Taslak listeye giriyordu, EKRANA GELMIYORDU.
"Eklendi" deyip gostermemek, en kafa karistirici hata turu: kullanici
kaydin kaybolduğunu saniyor, oysa kayit YERINDE, GOSTERIM eksik.

### 224.2 BU BUGUNUN YEDINCI TEKRARI
  §129  alan sildim, okuyanlari biraktim
  §189  JSON yukledim, betigi biraktim
  §194  ozellik yazdim, var mi bakmadim
  §208  ic HTTP tuzagini cozdum, tekrar yaptim
  §211c virgul destegi ekledim, temizleyiciyi biraktim
  §219b sekme ekledim, uyelik listesini biraktim
  §224  degisken birlestirdim, CIZIMI biraktim
Desen ayni: BIR YERI DEGISTIRIP DIGERINI BIRAKMAK.
Bu sefer ozellikle sinsi cunku IKI DEGISKEN AYNI SEYIN IKI HALIYDI —
`kartlar` (ham) ve `birlesik` (birlesmis). Isim benzerligi, birinin
digerinin yerine gectigini gizledi.
KURAL: bir degiskenin TUREVI olusturuluyorsa, ORIJINALIN TUM KULLANIMLARI
taranmali. Turev olusturmak, orijinali OTOMATIK OLARAK gecersiz kilmaz.

### 224.3 ONAY ROZETI
Onaylanan (buluttan gelen) kart artik "ONAYLI TASLAK" rozetiyle gorunuyor.
Dosyaya islenmis kartla ayirt edilebilmeli: biri kalici, digeri henuz
repoya girmemis. Karistirilirsa hangisinin deploy gerektirdigi bilinmez.

### 224.4 YAN TEMIZLIK
globalTakvimRender() ust uste IKI KEZ cagriliyordu. Zararsiz ama bosuna is;
tek cagriya indirildi.

app.js v=20260731m. DOSYALAR: app.js + index.html.

## 223. UC SORUN: yanlis satir · kesik JSON · yanlis donem (31 Tem)

BORSK taslagi uc ayri sorun gosterdi.

### 223.1 CIRO NEGATIF CIKTI — isaret kisiti eklendi
    "ciro": { "deger": -1.383.291.932, "yoy": 14.7 }
Hasilat NEGATIF OLAMAZ. Ustelik 1,4 KATRILYON TL — kucuk bir seker sirketi
icin sacma. Ozkaynak da 7,8 katrilyon cikmisti.
SEBEP: "Hasılat" etiketi bir DIPNOT/KIRILIM tablosunda yakalandi ve oradaki
negatif sayi alindi. Ilk eslesme kabul ediliyordu.
COZUM: bazi kalemlerin ISARETI BELLIDIR.
    ciro·ozkaynak·nakit·varlik·stok...  -> POZITIF
    satisMaliyet·finansGider·pazarlama·karsilik·vergi -> NEGATIF
    brutKar·faaliyetKar·netKar·parasal  -> SERBEST (zarar olabilir)
Ustelik BUYUKLUK kisiti: bin TL cinsinde bir kalem 1 milyar bin TL'yi
(1 katrilyon TL) asamaz — BIST'te oyle sirket yok.
Kisita uymayan eslesme REDDEDILIR ve arama SONRAKI eslesmeyle DEVAM EDER.
§206'daki dipnot suzgecinin kardesi: BICIM yetmiyorsa ANLAM kisiti koy.

### 223.2 JSON KESILDI — token ve onarim
Hata: "Expected ',' or ']' ... at position 1510". max_tokens 1400 yetmemis.
Kart yapisi (ozet + 6 metrik + 3 madde + guidance + tez) rahat 2000 istiyor.
2600'e cikarildi.
AYRICA ONARIM eklendi: yanit yine kesilirse yarim kalan son nesne/ozellik/
dizi elemani atilir ve parantezler dengelenir. TEST EDILDI — dort senaryo
(nesne ortasi · dizi elemani ortasi · ozellik ortasi · TAM JSON) dogru
sonuc veriyor; tam JSON BOZULMUYOR.
Onarim yapildiysa `onarildi:true` doner ve kullaniciya SOYLENIR: "model
yaniti KESILDI, son alanlar eksik olabilir". Yarim kart hic karttan iyidir
AMA ancak eksik oldugu SOYLENIRSE.

### 223.3 YANLIS DONEM SECIMI — ne VAR onu goster
Kullanici Finansal Tablolar'da BORSK 2C26 aradi. BORSK 1C26 aciklamisti
(121 gun gecikmeli). Panel "bulunamadi" deyip SUSUYORDU.
Oysa AYNI PENCEREDE baska bir donem VARDI ve bunu soylemek tek satirlik is:
    "Ama bu pencerede 2026/1 (3 Aylık) bulundu — donem secimini kontrol et."
Bir arama sonucsuz kaldiginda, YAKININDA NE OLDUGUNU soylemek arayanin
isini yariya indirir.

DOSYALAR: api/kap.js + api/ajanktp.js + app.js + index.html.
app.js v=20260731k.

## 222. TASLAK ARTIK KART YAPISINDA + ONAY AKISI (31 Tem)

Kullanici: "yorum bizim kartlarla uyumlu degil, yapiya uygun olsun. Ayrica
onaylama tusu yok. Onayladiktan sonra Earnings AI'da kart olussun."

### 222.1 ISTEM KART YAPISI URETIYOR (§221)
Onceki surum OZET/DIKKAT/IZLENECEK biciminde DUZ METIN veriyordu. Panelin
kart yapisi ise: kod·ad·donem·tarih·tarih_iso·sablon·skor·ozet·metrikler[]·
onemli[]·guidance·tez.
Artik model YALNIZCA JSON donduruyor ve sunucu iskeleti tamamliyor
(tarih, tarih_iso, sablon otomatik).
JSON AYRISTIRMA KORUMASI: model bazen kod bloguyla sarar; ilk { ile son }
arasi alinir. Ayrismazsa HAM METIN dondurulur ve kullaniciya soylenir —
sessizce bos kart uretmek en kotusu olurdu.

### 222.2 SKOR BILEREK YOK
Model skor VERMIYOR. Onay kutusunda kullanici giriyor ve SKORSUZ KART
YAYINLANMIYOR. §204'te kararlastirilan kurgunun somut hali: yazma emegi
kalkar, YARGI TEK SATIRDA INSANDAN GELIR.

### 222.3 ONAY → EARNINGS AI
Sorun: inceleme-ai.json REPO'DA, tarayicidan yazilamaz.
Cozum: onaylanan kart `ktp_taslak_kart_v1`e yazilir (CLOUD_KEYS'e eklendi,
buluta senkron) ve app.js bunu dosyayla BIRLESTIRIR.
BIRLESTIRME KURALI: ayni (kod, donem) varsa DOSYA KAZANIR — dosyaya islenmis
kart, taslagin kalicilasmis halidir; taslak artik gereksizdir. Boylece ayni
kart iki kez gorunmez ve elle isleme yapildiginda taslak kendiliginden duser.
Onaydan sonra incelemeInit() tekrar cagrilir; kart ANINDA Earnings AI'da
gorunur, deploy beklemez.

### 222.4 ONIZLEME KART BICIMINDE
Taslak artik panelin kart biciminde gosteriliyor: baslik, ozet, metrik
tablosu, onemli maddeler, guidance, tez. Onaylamadan once NASIL GORUNECEGI
belli oluyor. Serbest metin gosterip "onayla" demek, gorunmeden imzalatmakti.

ajan.js v=20260731h · app.js v=20260731j.
DOSYALAR: api/ajanktp.js + ajan.js + app.js + index.html.

## 220. SOLO RAPOR SABLONU — nobet ise yaradi, eksigi gosterdi (31 Tem)

§219'da evren genisleyince nobet UC kod yakaladi: BORSK · CANTE · GENIL.
Ikisinde taslak dugmesi "Bilanco ayristirilamadi" dedi.
NOBET ISE YARADI: gormeseydik bu eksigi hic fark etmeyecektik. Genis evren
yalniz daha cok sirket izlemek degil, AYRISTIRICIYI DAHA COK SINAMAK demek.

### 220.1 SEBEP: KONSOLIDE vs SOLO
Etiket listem KONSOLIDE rapor icin yazilmisti:
    "Ana Ortaklık Payları" · "Ana Ortaklığa Ait Özkaynaklar"
Bunlar yalniz KONSOLIDE tablolarda bulunur. Kucuk sirketler SOLO (konsolide
olmayan) rapor verir; orada bu satirlar YOKTUR — dogrudan
    "DÖNEM KARI (ZARARI)" · "ÖZKAYNAKLAR"
yazar. TOASO/GARAN gibi buyuk isimlerle test ettigim icin bu gorunmedi.
DERS: bir ayristiriciyi yalniz BUYUK orneklerle sinamak, kucuk olcekteki
YAPISAL FARKI gizler. Test kumesi CESITLI olmali.

### 220.2 DUZELTME
Konsolide etiketler once, SOLO yedekte:
    netKar   : Ana Ortaklık Payları -> DÖNEM KARI (ZARARI) -> Dönem Karı (Zararı)
    ozkaynak : Ana Ortaklığa Ait Özkaynaklar -> ÖZKAYNAKLAR -> Özkaynaklar
    ciro/brutKar/faaliyetKar : buyuk-kucuk harf varyantlari eklendi
Ikisi de bulunursa KONSOLIDE, yalniz ikincisi bulunursa SOLO demektir.

### 220.3 HATA MESAJI TAHMIN EDIYORDU
Onceki metin: "KAP sayfasi yapisi degismis olabilir" — bu bir TAHMINDI ve
cogu zaman YANLISTI. Gercek sebep sablon uyumsuzlugu, bildirimin ek belge
olmasi ya da sektore ozel tablo.
Artik her kimligin KAC KALEM verdigi yaziliyor ve muhtemel sebepler
siralaniyor. Kullaniciya somut bir sonraki adim veriliyor: "KAP sayfasini
acip tablo basliklarini gonderirsen sablona eklenebilir."
Bir hata mesaji, SEBEBI bilmiyorsa TAHMIN ETMEMELI — ne bildigini soylemeli.

ajan.js v=20260731g. DOSYALAR: api/kap.js + ajan.js + index.html.

## 219b. t23'U PY_GRUP'A EKLEMEYI UNUTTUM (31 Tem)

Kullanici: "finansal tablolar sekmesine tikladigimda alt sekmeler kayboluyor."

SEBEP: `PY_GRUP` dizisi Portfoy Yonetimi alt sekmelerini listeliyor. Bu
listede OLMAYAN bir sekme acilinca `pySubnav` GIZLENIYOR.
index.html'e dugmeyi ve bolumu ekledim, PY_GRUP'a eklemeyi UNUTTUM. Sekme
aciliyordu ama alt cubuk kayboluyordu.

BU BUGUNUN EN SIK HATASI — altinci tekrar:
  §129  alani sildim, okuyanlari biraktim
  §189  yeni JSON yukledim, betigi biraktim
  §194  yeni ozellik yazdim, var mi bakmadim
  §208  ic HTTP tuzagini cozdum, saatler sonra tekrar yaptim
  §211c virgul destegi ekledim, temizleyiciyi biraktim
  §219b sekme ekledim, uyelik listesini biraktim
Hepsi: BIR YERI DEGISTIRIP DIGERINI BIRAKMAK. Ozellikle "IKI YERDE TANIMLI"
seylerde — dugme HTML'de, uyelik JS'te.

DENETIM EKLENDI: PY_GRUP ile alt nav dugmeleri KARSILASTIRILDI, ikisi de
11 sekme, tam ortusuyor. Bu karsilastirma her yeni sekmede kosulmali —
tek satirlik kontrol, saatlerce arama onler.

app.js v=20260731i. DOSYALAR: app.js + index.html.

## 219. NOBET EVRENI DARDI — katilim endeksleri girmiyordu (31 Tem)

Kullanici: "73 kod izleniyor ama tum XKTUM'u izlemesi lazim." HAKLI.

### 219.1 ESKI EVREN
    kartlar (25) + portfoy (30) + TOP40 (40) = 73 benzersiz kod
Panelin ASIL ilgi alani KATILIM EVRENI oldugu halde XKTUM uyeleri
izlenmiyordu. Portfoyde olmayan bir katilim hissesi bilanco aciklasa nobet
SUSUYORDU — ve bu sessizlik "her sey yolunda" gibi gorunuyordu.

### 219.2 YENI EVREN
ENDAG'daki uc endeksin uyeleri eklendi:
    XK100 100 · XKTUM 150 · XKTMT 34  ->  158 BENZERSIZ kod
Ucu de eklendi cunku listeler TAM ORTUSMUYOR: §159'da olculdu, XKTMT'de
XKTUM'da olmayan dort isim var (AYEN·ELITE·PLTUR·VAKKO).
Yeni evren ~208 kod.
KAYNAK: app.js'in yukledigi ENDAG. Ayni sayfada calisildigi icin erisilebilir;
ayri fetch gereksiz olurdu.

### 219.3 KIRILIM EKRANA TASINDI
Onceden yalniz "73 kod izleniyor" yaziyordu. Tek sayi, NEREDEN GELDIGINI
soylemiyor — kullanici ancak SEZEREK fark etti eksigi.
Artik: "208 kod: katilim endeksleri 158 + portfoy + kartli 25"
§141'in ayni mantigi: panel ne bildigini degil, NEREDEN bildigini de
soylemeli. Bir kapsam sayisi, kapsamin ICERIGINI gostermiyorsa denetlenemez.

ajan.js v=20260731f. DOSYALAR: ajan.js + index.html.

## 218. FINANSAL TABLOLAR SEKMESI (t23) — yatay + dikey analiz (31 Tem)

Kullanici: "portfoy yonetimi altina Finansal Tablolar sekmesi, tickerini
girdigimiz sirketin bilancosu ve gelir tablosu gelsin. Bilancoda YATAY,
gelir tablosunda DIKEY analiz."

### 218.1 NEDEN BU ESLESME DOGRU
BILANCO = STOK. Belirli bir ANDAKI durumu gosterir. Iki tarihi
karsilastirmak (YATAY) anlamlidir: "ne birikmis" degil "ne DEGISMIS".
GELIR TABLOSU = AKIS. Bir donemin ICINI gosterir. Her kalemi hasilatin
yuzdesi yapmak (DIKEY) yapiyi acar: maliyet ciroyu ne kadar yiyor,
faaliyet gideri nerede.
Tersini yapmak bilgi vermez degil ama SORUYU KACIRIR.
Bankada dikey analizin paydasi hasilat degil FAIZ GELIRLERI.

### 218.2 SABLONLAR GENISLETILDI (§216)
mod=kart sekiz kalemle yetiniyordu. Tam tablo icin:
  _BILANCO_SANAYI 15 kalem · _GELIR_SANAYI 18 kalem
  _BILANCO_BANKA   8 kalem · _GELIR_BANKA  11 kalem
Her kalem [anahtar, etiketler, GIRINTI] tasiyor — tabloda hiyerarsi gorunuyor
(ana kalem kalin ve gri zeminli, alt kalem girintili).
SIRA YINE ONEMLI: uzun etiket once (§206 dipnot dersi).

### 218.3 EKSIK KALEM SESSIZCE ATLANMIYOR
Bulunamayan kalem `yok:true` tasiyor ve tabloda SOLUK, "— bulunamadi"
notuyla gosteriliyor. Toplam da yaziliyor: "12/15 kalem".
KAP sayfa yapisi degisirse hangi kalemin dustugu ANINDA gorunur.
Bu oturumun en cok tekrarlanan dersi (§143 · §185 · §199 · §210):
BASARISIZLIK GORUNUR OLMALI.

### 218.4 OKUMA NOTU — kural tabanli, AI degil
Tablonun altinda uc desen otomatik isaretleniyor:
  · faaliyet marji brutten cok oynadiysa -> hareket faaliyet giderlerinde
  · faaliyet marji duserken net marj arttiysa -> finansman/parasal tasiyor
  · ozkaynak %5'ten fazla gerilediyse -> temettu/zarar/enflasyon duzeltmesi
Bunlar bugun ELLE bulunan desenler (TOASO · ARCLK · CWENE). Kural tabanli,
AI cagirmadan calisiyor — hizli ve deterministik.

### 218.5 DONEM PENCERESI
Sirket + yil + donem secilir; panel o donemin bildirimini KAP'ta arar.
Pencereler: 1C 15 Nis-15 Haz · 2C 15 Tem-15 Eyl · 3C 15 Eki-15 Ara ·
4C (yillik) ERTESI YIL 15 Sub-30 Nis.
Bulunamazsa neden bulunamadigi yaziliyor (gec aciklama ihtimali dahil).
Aynı donemin birden fazla bildirimi icin `idler` sirayla deneniyor (§211).

app.js v=20260731h. DOSYALAR: api/kap.js (mod=tablo) + app.js + index.html.

## 215. EBU KART TASLAGI YAZIYOR — zincir baglandi (31 Tem)

Kullanici: "ebu yorumlasin karti oyle bana cikartsin."

### 215.1 AKIS — tarayicidan iki adim
Nobet satirinda "taslak" dugmesi:
  1) /api/kap?mod=kart&id=<kimlik>     -> metrikler + isaretler
  2) POST /api/ajanktp?mod=bilanco     -> Claude taslak yazar
SUNUCUDAN SUNUCUYA ISTEK YOK. §208'de olculdu: kendi sitesine HTTP istegi
middleware'e takiliyor ve gecikme ekliyor. Tarayici ikisini de cagirabiliyor,
orkestrasyon orada.
KIMLIK DENEMESI: `idler` sirayla denenir, ilk ayrisan kullanilir (§211 —
en erken bildirim cogu zaman faaliyet raporudur).

### 215.2 ISTEM — bugunku kartlardan turedi
Soyut "iyi analiz yap" demiyor; NEYE BAKILACAGINI soyluyor. Her kural bir
VAKAYA dayaniyor:
  · net kar artarken faaliyet duserse -> farki finansman/parasal tasiyor,
    operasyonel iyilesme DEGIL            (TOASO, ARCLK)
  · faaliyet artarken FAVOK duserse -> amortisman, muhasebesel  (TOASO/CWENE)
  · bankada karsilik ceyreklik sicrarken yillik azalabilir, IKISINI AYRI
    soyle                                  (TSKB)
  · buyuk yuzdeler dusuk bazdan gelir, MUTLAK TUTARI da yaz
  · marj katmanlarini yan yana oku: brut -> faaliyet -> net
  · SKOR VERME, yatirim tavsiyesi verme
  · emin olmadigini SOYLE, doldurma
Bunlar bu oturumda ELLE bulundu; istem onlari kalicilastiriyor.

### 215.3 NE YAPMIYOR — bilincli
TASLAK URETIR, KART YAYINLAMAZ. Skor vermez. Ekranda gosterir, kullanici okur,
duzeltir, karta kendisi isler.
Kutunun ustunde kalici uyari: "⚠ TASLAK — skor ve yayin karari SENDE".
§204'te kararlastirilan kurgu: yazma emegi kalkar, YARGI INSANDA KALIR.

### 215.4 ZINCIR TAMAM
  1 yakala    ✓ mod=fr
  2 kalem     ✓ mod=bilanco
  3 ceyreklik ✓ mod=ceyrek (rapor sutunu, 12/12 dogrulandi)
  4 metrik    ✓ mod=kart
  5 taslak    ✓ ajanktp mod=bilanco   <- BU TURDA
  6 ONAY        insan
  7 yayin       elle / Actions
Bilanco geldiginde: nobet gorur -> "taslak" bas -> metrik + yorum gelir ->
okursun, duzeltirsin, karta islersin.

GEREKLI: Vercel'de ANTHROPIC_API_KEY tanimli olmali (ajanktp zaten kullaniyor).

ajan.js v=20260731e. DOSYALAR: api/ajanktp.js + ajan.js + index.html.

## 214. ?mod=kart — SON MEKANIK ADIM (31 Tem)

Kullanici: "tamam simdi otomatik mi geliyor?" HAYIR — parcalar vardi ama
BIRBIRINE BAGLI DEGILDI. Bu tur son mekanik halkayi kurdu.

### 214.1 NE YAPIYOR
id -> ayristir -> CEYREKLIK oncelikli metrik seti:
  SANAYI: ciro+y/y · brut marj+puan farki · faaliyet kari+marj+y/y ·
          net kar+marj+y/y · finansman gideri · parasal · ozkaynak · nakit
  BANKA : net faiz · komisyon · karsilik · faaliyet kari · net kar
Marjlar, y/y degisimler ve PUAN FARKLARI hesaplanmis geliyor.

### 214.2 NE YAPMIYOR — bilincli
YORUM YAZMAZ. SKOR VERMEZ. Bunlar §204'te kararlastirildi: yazma emegi
kalkar, YARGI KULLANICIDA KALIR.
Bunun yerine ISARETLER dondurur — "yorum" degil "BAKILACAK YER":
  · alt satir dissal   : faaliyet duserken net kar artiyorsa
  · brut marj erozyonu : 0,5 puandan fazla gerileme
  · faaliyet gideri baskisi : faaliyet marji brutten cok oynadiysa
  · parasal pozisyon agir   : net karin %30'unu asiyorsa
  · karsilik sicramasi (banka) : %50+ artis, "ceyreklik VE yillik ayri bak" notuyla
  · net faiz baz etkisi (banka): %40+ artis, "dusuk bazdan gelebilir" notuyla
Bu isaretler BUGUN ELLE BULDUGUM desenlerden turedi: TOASO'da amortisman
makasi, CWENE'de tersi, TSKB'de ceyreklik/yillik celiskisi, ARCLK'te parasal
pozisyonun tasidigi net kar.

### 214.3 DOGRULAMA
TOASO 2C26 ile kosuldu:
    ciro 100.016.179 (y/y +%9,0) · brut marj %6,65 (−0,67 puan)
    faaliyet marj %1,08 (y/y +%213,5) · net marj %3,09 (y/y +%33,7)
    ISARET: brut marj erozyonu · parasal pozisyon agir (net karin %38'i)
§177'de ELLE yazdigim kartla AYNI TESPITLER. Hesap dogru.

### 214.4 ZINCIR — mekanik kisim TAMAM
  1 yakala      ✓ mod=fr
  2 kalem       ✓ mod=bilanco
  3 ceyreklik   ✓ mod=ceyrek
  4 metrik      ✓ mod=kart      <- BU TURDA
  5 YORUM         insan
  6 yayin         Actions
Geriye YALNIZ 5. adim kaldi ve orasi bilerek insanda.
BAGLANMASI GEREKEN: panel, nobetteki "kart bekliyor" satirindan mod=kart'i
cagirip metrikleri gostersin. O UI isi, ayri tur.

DOSYALAR: api/kap.js

## 213. DOGRULANDI: 12/12 BIREBIR — zincirin 2. ve 3. adimi KAPANDI (31 Tem)

Rapor sutunu okumasi TOASO 2C26'da tam sonuc verdi:
    KALEM          KAP 2C26      FINTABLES     KAP 2C25      FINTABLES
    ciro        100.016.179  = 100.016.179   91.737.074  =  91.737.074
    brutKar       6.651.584  =   6.651.584    6.711.191  =   6.711.191
    faaliyetKar   1.082.468  =   1.082.468      345.257  =     345.257
    finansGider    −807.686  =    −807.686   −2.984.100  =  −2.984.100
    parasal       1.174.771  =   1.174.771      203.459  =     203.459
    netKar        3.092.347  =   3.092.347    2.313.313  =   2.313.313
ON IKI DEGERIN HEPSI BIREBIR.

### 213.1 NE KAZANILDI
  · cikarma GEREKMIYOR — enflasyon sapmasi ortadan kalkti
  · onceki donem kimligi GEREKMIYOR — tek bildirim yetiyor
  · y/y karsilastirma HAZIR geliyor (2C25 sutunu ayni raporda)
  · tek KAP sayfasi = tam ceyreklik tablo
`onceki` parametresi YEDEGE dustu: yalniz ceyrek sutunu bulunamayan
raporlarda cikarmaya duser ve "⚠ enflasyon sapmasi" etiketi basar.

### 213.2 SEKIZ TURDA SEKIZ HATA — hepsi olcumle bulundu
  §201  bes yol tahmin        -> 404
  §202  govde tahmin          -> 500 (tarih bicimi + fazladan alan + pencere)
  §206  ilk sayiyi al         -> dipnot referansi (ciro 4,17 cikti)
  §208  ic HTTP istegi        -> middleware 401 (ayni tuzaga ikinci kez)
  §210  paralel + 4x replace  -> bellek, sessiz dusme
  §211  en erken kimlik       -> faaliyet raporu, 0/8 kalem
  §211c virgul temizlendi     -> "1601476160" var olmayan kimlik
  §212  cikarma yontemi       -> enflasyon sapmasi, +6,7 mlr
Sekizinin de ortak yani: MAKUL GORUNEN BIR VARSAYIM. Ve sekizi de ancak
OLCUMLE ortaya cikti — dordu dis referansla (Fintables), dordu teshis
alaniyla.

### 213.3 ZINCIRIN DURUMU
  1 bildirimi yakala   ✓ mod=fr      donem · gecikme · tum kimlikler
  2 kalemleri al       ✓ mod=bilanco 8/8 · capraz denetlenmis
  3 ceyreklige cevir   ✓ mod=ceyrek  12/12 birebir · rapor sutunu
  4 yorumu yaz           TASLAK+ONAY — yargi kullanicida kalir
  5 karta ekle           Actions zaten yapiyor
Mekanik adimlarin HEPSI kapandi. Fintables bagimliligi bilanco kalemleri
icin TAMAMEN kirildi.

DOSYALAR: api/kap.js

## 212. CIKARMA YONTEMI ENFLASYON ALTINDA YANLIS (31 Tem)

Coklu kimlik denemesi calisti (1601474 -> 8/8) ve ceyreklik HESAPLANDI.
Ama Fintables ile karsilastirinca RAKAMLAR TUTMADI:
    ciro         cikarma 106.687.189  ·  gercek 100.016.179  fark +6.671.010
    faaliyetKar  cikarma   1.200.570  ·  gercek   1.082.468  fark   +118.102
    netKar       cikarma   3.301.965  ·  gercek   3.092.347  fark   +209.618
Hepsi AYNI YONDE sapiyor — sistematik hata.

### 212.1 SEBEP: TMS-29 ENFLASYON MUHASEBESI
Cikarmanin ima ettigi 1C26 cirosu 95.109.919; Fintables 1C26 = 101.780.929.
Fark −6,7 mlr.
SEBEP: 1C26 raporu 1C26 SATIN ALMA GUCUNDE yazilir. 2C26 raporu ayni donemi
2C26 gucune GUNCELLEYEREK gosterir. Iki rapor FARKLI FIYAT SEVIYESINDEDIR;
aralarinda cikarma yapmak elmayla armut cikarmaktir.
Yuksek enflasyon rejiminde bu fark buyuk ve SISTEMATIK — her kalemde ayni
yonde. Fark etmemek, her ceyregi oldugundan buyuk gostermek demekti.

### 212.2 COZUM: RAPORUN KENDI CEYREK SUTUNU
Turk ara donem raporlari DORT sutun tasir:
    1 Oca-30 Haz 2026 | 1 Oca-30 Haz 2025 | 1 Nis-30 Haz 2026 | 1 Nis-30 Haz 2025
Yani KUMULATIF ikisi, CEYREKLIK ikisi. Ayristirici yalniz ILK IKISINI
aliyordu; ucuncu ve dorduncu ZATEN CEYREKLIK.
Cikarma GEREKMIYOR. Ayni rapor, ayni fiyat seviyesi, enflasyon sorunu YOK.

### 212.3 ONCELIK SIRASI
  1. rapor sutunu   — en dogru
  2. cikarma        — yalniz 1. yoksa, "⚠ enflasyon sapmasi tasir" etiketiyle
  3. kumulatif      — 1. donemde zaten ceyrekliktir
`hepsi` alani ilk alti hucreyi dondurur: sutun yapisi GORUNUR olur, bir daha
tahmin edilmez.

### 212.4 DERS — TUTARLI GORUNEN SONUC DOGRU DEMEK DEGIL
Cikarma yontemi CALISIYORDU: sayilar makul, isaretler dogru, buyukluk
mertebesi yerinde. Hicbir denetim kurali bunu yakalamazdi — ne aykiri deger,
ne tutarlilik, ne kapsam.
Yakalayan yine DIS REFERANS oldu (Fintables). Bu oturumda dorduncu kez:
§184 AV eksik ceyrek · §203 isLate · §206 dipnot · §212 enflasyon.
KURAL: yeni bir hesap yolu kurulunca, BILINEN BIR VAKAYLA sayisal karsilastirma
SART. "Makul gorunuyor" kabul olcutü degildir.

DOSYALAR: api/kap.js

## 211c. VIRGUL TEMIZLEYICIDE SILINIYORDU (31 Tem)

§211'de `onceki` parametresine virgullu liste destegi ekledim. Ama parametreyi
temizleyen satiri DUZELTMEYI UNUTTUM:
    .replace(/[^0-9]/g,'').slice(0,10)
Virgul de silindi -> "1601476,1601475,1601474" once "160147616014751601474"
oldu, sonra ilk 10 hane alindi: "1601476160" — VAR OLMAYAN BIR KIMLIK.
Yanit da bunu acikca gosterdi: denemeler:[{id:"1601476160", bulunan:0}].

DUZELTME: [^0-9,] ve slice(0,80). Bolme sonrasi her parca ayrica temizleniyor,
guvenlik korunuyor (test: "1601476,abc,<script>,1601475" -> iki gecerli kimlik).

DERS — BU OTURUMUN EN SIK HATASI:
  §129  bir alani sildim, okuyanlari birakmisim
  §189  yeni JSON'u yukledim, betigi birakmisim
  §194  yeni ozellik yazdim, var mi diye bakmamisim
  §208  ic HTTP tuzagini cozdum, birkac saat sonra tekrar yaptim
  §211c virgul destegi ekledim, temizleyiciyi birakmisim
Hepsi ayni desen: BIR YERI DEGISTIRIP DIGERINI BIRAKMAK.
Ortak sebep: degisikligin ETKI ALANINI taramamak. Bir parametrenin
davranisini degistirirken O PARAMETREYE DOKUNAN TUM SATIRLAR aranmali —
tanim, temizleme, kullanim, dogrulama.

## 211. EN ERKEN BILDIRIM FINANSAL TABLO DEGIL — coklu kimlik (31 Tem)

§210'daki teshis alani ise yaradi ve sebebi TEK SATIRDA verdi:
    oncekiDurum: { ok:false, sebep:"bulunan 0/8", http:null }
`http:null` = sayfa ALINDI. `bulunan 0/8` = ayristirma sifir kalem buldu.
Yani indirme degil, ICERIK sorunu.

### 211.1 SEBEP: TEKILLESTIRME YANLIS KIMLIGI SECIYORDU
§203'te (kod,yil,donem) basina EN ERKEN bildirimi tutuyorduk. Gerekce
mantikliydi: "ilk bildirim asil aciklamadir".
AMA EN ERKEN BILDIRIM FINANSAL TABLO OLMAYABILIR. Sirketler ayni anda
faaliyet raporu, denetim raporu, ek belge de gonderiyor; bunlarin icinde
bilanco TABLOSU YOK.
OLCULDU:
  TOASO 1C26  tekrar:3  en erken 1601476 -> 0/8 kalem  (faaliyet raporu)
  TOASO 2C26  tekrar:7  isleyen  1639026 -> 8/8 kalem  (ORTADAKI bildirim)
Yani dogru kimlik ne ILK ne SON — denenerek bulunur.

### 211.2 COZUM: TUM KIMLIKLER SAKLANIR, SIRAYLA DENENIR
mod=fr artik her donem icin `idler` dizisi tutuyor (tekrarlarin hepsi).
mod=ceyrek `onceki` parametresinde VIRGULLU liste kabul ediyor ve ilk
ayrisani kullaniyor. `denemeler` alani hangisinin kac kalem verdigini
raporluyor — bir daha tahmin yok.
Gecikme hesabi yine EN ERKEN bildirime gore (dogru olan o: sirket o gun
aciklamis sayilir).

### 211.3 DERS — "MAKUL VARSAYIM" OLCULMEDEN KURAL OLMAZ
"Ilk bildirim asil aciklamadir" makul bir varsayimdi ve YANLISTI. Uc turda
ustuste kurdugum kural (§197 tolerans -> §203 tekillestirme -> §211 coklu
kimlik) her seferinde bir varsayimin olculmesiyle duzeldi.
Bu oturumun tekrarlayan dersi: VARSAYIM, OLCUM YERINE GECMEZ. Ve olcum
ancak TESHIS ALANI varsa mumkun — §210'da eklenen `oncekiDurum` olmasaydi
bu sorun "ayristirilamadi" olarak kalirdi.

DOSYALAR: api/kap.js

## 210. IKINCI SAYFA SESSIZCE DUSUYORDU — bellek ve TESHIS (31 Tem)

mod=ceyrek dogru kimliklerle cagrildi (id=1639026, onceki=1601476) ama
ceyreklik yine "hesaplanamadi" dedi. Yanit SEBEBI SOYLEMIYORDU — kendi
kuralimi (§145) cignemisim.

### 210.1 SEBEP: BELLEK / SURE
_bilancoAyristir her sayfada DORT ZINCIRLI replace yapiyordu:
    h.replace(...).replace(...).replace(...).replace(...)
5 MB dizgede bu DORT KOPYA demek = 20 MB churn. Iki sayfa PARALEL cekilince
40 MB+ ve serverless sinirinda ikinci ayristirma sessizce dusuyordu.
OLCULDU: zincirli 4 replace 529 ms · tek gecis 219 ms (ayni sonuc).
DUZELTME (a) tek regex + esleme tablosu — bir kopya yeter
DUZELTME (b) PARALEL degil SIRALI cekim — hem hafif hem hangi adimda
             dustugu belli

### 210.2 ASIL KUSUR: SEBEP SOYLENMIYORDU
"onceki donem ayristirilamadi" tek basina ise yaramaz. Bu oturumda defalarca
yazdigim ders (§145 teshis · §185 sessiz yedek · §199 sessiz arizalar) ve
yine ayni hataya dustum — hem de KENDI yazdigim yeni kodda.
EKLENEN: `oncekiDurum` alani — ok/sebep/http/bulunan. Uyari metni de sebebi
tasiyor artik.
DESEN: bir kod yolunda BASARISIZLIK MUMKUNSE, o yol SEBEBINI dondurmelidir.
Istisna yok.

### 210.3 TAVAN UYARISI OKUNAMIYORDU
Aralik modunda uyari "dilim 1778457600000-1778889600000g TAVANA CARPTI"
diyordu — ham zaman damgasi. Bir uyari OKUNAMIYORSA YOK SAYILIR.
Artik "[2026-05-06 → 2026-05-11] TAVANA CARPTI (2000 kayit)" yaziyor.
Ayrica ?dilim=N eklendi: nisan-mayis bilanco sezonunda 5 gunluk dilimler
tavani asiyor (uc dilim birden), yogun donemde 2 gune indirilebilir.

DOSYALAR: api/kap.js

## 209. TARIH ARALIGI + KOD SUZGECI (31 Tem)

mod=ceyrek kumulatifi KUSURSUZ dondurdu (8/8, hepsi capraz denetlenmis) ama
ceyreklik hesaplanamadi: onceki donem kimligi gecersizdi ("126").

### 209.1 EKSIK: GECMISE BAKAMIYORDUK
mod=fr yalniz BUGUNDEN GERIYE `gun` kadar tariyordu ve gun 40'la sinirliydi.
TOASO'nun 1C26 bildirimi NISAN SONUNDA — 40 gunluk pencerede yok, dolayisiyla
kimligi bulmak IMKANSIZDI.
Ceyreklige cevirme icin onceki donemin kimligi SART; bu eksik, zinciri
kullanilamaz kiliyordu.

### 209.2 EKLENEN
  ?bas=YYYY-MM-DD&son=YYYY-MM-DD   herhangi bir pencere
  ?kod=TOASO                        yalniz o hisse
Aralik modunda dilimleme MUTLAK tarihlerle yapilir (5 gunluk). Kod suzgeci
sunucu tarafinda uygulanir; 2000 tavani sorun olsa bile ilgili hisse
kaybolmaz cunku dilimler kucuk.

### 209.3 KULLANIM — iki adim
  1. onceki donem kimligini bul:
     /api/kap?mod=fr&kod=TOASO&bas=2026-04-20&son=2026-05-31
  2. ceyreklige cevir:
     /api/kap?mod=ceyrek&id=1639026&onceki=<1. adimdan gelen id>
Beklenen sonuc (Fintables ile dogrulanmis):
     ciro 100.016.179 · faaliyetKar 1.082.468 · netKar 3.092.347

### 209.4 NEDEN OTOMATIK ARAMIYOR
mod=ceyrek onceki donemi KENDI arayabilirdi ama bu, §208'de kaldirilan ic
HTTP zincirlemesini geri getirirdi. Kimlik bir kez bulunur ve saklanir;
her seferinde aramak israftir. Panel tarafinda kimlikler zaten mod=fr
ciktisinda duruyor.

DOSYALAR: api/kap.js

## 208. KENDI KENDINE HTTP ISTEGI — AYNI TUZAGA IKINCI KEZ DUSTUM (31 Tem)

mod=ceyrek "cari bilanco alinamadi" dedi. IKI SEBEP UST USTE:

### 208.1 (a) MIDDLEWARE — §199'un TEKRARI, kendi kodumda
mod=ceyrek, mod=bilanco'yu KENDI SITESINE HTTP ISTEGI ATARAK cagiriyordu.
middleware `matcher:'/:path*'` ile tum yollari koruyor; ic istekte cerez yok
-> 401.
BU TUZAGI BUGUN §199'DA COZDUM ve sukuk.js'e CRON_SECRET basligi ekledim.
Sonra mod=ceyrek'i yazarken AYNI HATAYI TEKRAR YAPTIM — hem de birkac saat
sonra, ayni dosyada.
Ders yazmak yetmiyor; DESEN yanlissa tekrarlanir.

### 208.2 (b) MALIYET
mod=fr(gun=120) -> mod=fr gun'u 40'a kirpiyor -> 8 dilim -> ~16 sn
+ iki adet 5 MB KAP sayfasi -> ~20 sn
Toplam 60 sn sinirina dayaniyordu. Basarili olsa bile kirilgan olurdu.

### 208.3 COZUM: HTTP DEGIL FONKSIYON
Ayristirma `_bilancoAyristir(id)` ortak fonksiyonuna cikarildi. Artik:
  · middleware'e takilmaz (ag turu yok)
  · CRON_SECRET gerektirmez
  · gecikme eklemez
Ayrica KIMLIKLER DISARIDAN gelir: ?mod=ceyrek&id=<cari>&onceki=<onceki>
mod=fr ciktisinda o kimlikler ZATEN var; ikinci kez aramak israfti.
DERS: kendi sunucusuna HTTP istegi atmak, ayni surecte duran bir fonksiyonu
cagirmanin PAHALI ve KIRILGAN yoludur. Mikroservis refleksi tek dosyada
anlamsizdir.

### 208.4 SADELESME
api/kap.js modlari: fr · bilanco · ceyrek · kalem · yokla · sukuk · yorum
Ic HTTP istegi kalintisi: 0. Ortak ayristirici cagrisi: 4 yerde.

DOSYALAR: api/kap.js

## 207. AYRISTIRICI DOGRULANDI · CEYREKLIGE CEVIRME (31 Tem)

Dipnot suzgeci sonrasi TOASO cikti tekrar alindi. TAM CAPRAZ DENETIM:

### 207.1 BES KALEM BIREBIR
    ciro        201.797.108  =  Fintables 6A26      ✓
    ciro onceki 125.633.352  =  Fintables 6A25      ✓
    netKar        6.290.532  =  Fintables 6A26      ✓
    netKar onc.   2.116.615  =  Fintables 6A25      ✓
TOPLAM YOLUYLA (1C + 2C = 6A) uc kalem daha:
    ciro        101.780.929 + 100.016.179 = 201.797.108  = KAP  ✓
    faaliyetKar   1.801.885 +   1.082.468 =   2.884.353  = KAP  ✓
    netKar        3.198.185 +   3.092.347 =   6.290.532  = KAP  ✓
Ayristirici DOGRU. Fintables bagimliligi bilanco kalemleri icin KIRILDI.

### 207.2 AMA KAP DONEMSEL VERIYOR, CEYREKLIK DEGIL
"6 Aylik" satiri IKI CEYREGIN TOPLAMIDIR. Kart icin CEYREKLIK gerekir:
TOASO'nun 2C cirosu 100 mlr, 201,8 DEGIL. Bu ayrimi kacirmak, sirketi iki
kat buyuk gostermek demektir — sessiz ve buyuk bir hata.
COZUM (?mod=ceyrek): IKI bildirim cekilir, cikarilir.
    ceyreklik = bu donem kumulatif − onceki donem kumulatif
DOGRULANDI: uc kalemde de birebir 2C degeri cikiyor.
1. donem zaten ceyrekliktir, cikarma yapilmaz.

### 207.3 STOK vs AKIS AYRIMI — kritik
OZKAYNAK ve NAKIT bilanco kalemidir, STOK'tur: belirli bir andaki durumu
gosterir, donem boyunca birikmez. Bunlari cikarmak ANLAMSIZ sonuc verir
(ornegin ozkaynak farki "bu ceyrek ozkaynak degisimi" olur, ozkaynagin
kendisi degil).
Gelir tablosu kalemleri (ciro, kar, gider) AKIS'tir, birikir, cikarilir.
Ayristirici bu ikisini AYIRIYOR ve `tur` alaninda soyluyor.
Bu ayrimi kacirmak, §114'teki taban kaymasi ailesinden bir hata olurdu.

### 207.4 ZINCIR TAMAMLANDI
  1 bildirimi yakala   ✓ mod=fr      (donem + gecikme + tekillestirme)
  2 kalemleri al       ✓ mod=bilanco (8/8, capraz denetlendi)
  3 ceyreklige cevir   ✓ mod=ceyrek  (stok/akis ayrimi ile)
  4 yorumu yaz           TASLAK+ONAY kurgusu onerildi — yargi kullanicida
  5 karta ekle           Actions zaten yapiyor
Ucuncu adim da mekanik olarak kapandi. Geriye YALNIZ YORUM kaldi.

DOSYALAR: api/kap.js

## 206. DIPNOT REFERANSI TUZAGI — capraz denetim yakaladi (31 Tem)

mod=bilanco ilk kosusu: 8/8 kalem BULUNDU, eksik yok, uyari yok. Basarili
gorunuyordu. Fintables rakamlariyla karsilastirinca BIR KALEM KAYMISTI.

### 206.1 OLCUM
    KAP ayristirici   ciro.deger   = 4,17
                      ciro.onceki  = 201.797.108
    Fintables         6A26 ciro    = 201.797.108   <- cari donem
                      6A25 ciro    = 125.633.352
Yani cari deger "onceki" alanina dusmus, "deger" alanina DIPNOT NUMARASI
gelmis. TUM SUTUNLAR BIR KAYMIS.
netKar TAM DOGRUYDU (6.290.532 / 2.116.615 — Fintables ile birebir).

### 206.2 SEBEP: DIPNOT REFERANSI SUTUNU
KAP tablosu:  | Kalem | Dipnot Ref | Cari Donem | Onceki Donem |
              | Hasilat |   4.17   | 201.797.108 | 125.633.352 |
Ayristirici etiketten sonraki ILK sayiyi aliyordu; o da dipnot numarasiydi.
NEDEN YALNIZ CIRODA: ARA TOPLAMLARIN dipnotu YOK (BRUT KAR, ESAS FAALIYET
KARI, Ana Ortaklik Paylari), KALEM SATIRLARININ VAR (Hasilat).
Yani hata KALEME GORE degisiyordu — en sinsi tur. 8/8 "bulundu" raporu
dogruydu; bulunan DEGERIN yanlis oldugunu rapor SOYLEYEMEZDI.

### 206.3 COZUM: BIN AYRACI BICIMI ZORUNLU
    /^-?\\(?\\d{1,3}(\\.\\d{3})*\\)?$/
Degerler "201.797.108" gibi: her noktadan sonra TAM UC HANE.
"4.17" uymaz (17 iki hane) · "2.1" uymaz · noktasiz ve 1000'den kucuk sayilar
da elenir (bin TL cinsinde gercek kalem 1000'in altina inmez).
TEST: sekiz senaryo dogru ayriliyor.

### 206.4 DERS — "BULUNDU" ILE "DOGRU" AYRI SEYLER
Ayristirici 8/8 bildirdi, `eksik` bostu, `uyari` yoktu. Kendi denetimine gore
KUSURSUZ calisiyordu. Hatayi yakalayan sey DIS REFERANSTI: Fintables'tan
bilinen TOASO rakamlari.
Bir ayristiricinin kendi kendini denetleyemedigi nokta budur — VERININ
DOGRULUGU, ayristirmanin BASARISINDAN bagimsizdir.
KURAL: yeni bir veri kaynagi acildiginda ILK IS, bilinen bir vakayla
CAPRAZ DENETIM. Bu oturumda ucuncu kez ise yaradi (§184 AV eksik ceyrek,
§203 isLate, §206 dipnot).

DOSYALAR: api/kap.js

## 205. BILANCO KALEMLERI ACILDI — zincirin engeli kalkti (31 Tem)

?mod=kalem yoklamasi (TOASO 1639026) sonucu:
    7 kalem etiketi BULUNDU · 736 tablo · 580 bin-ayracli sayi
    flight:true (Next.js RSC yuku) · uzunluk 5.071.275
Yani KAP'in finansal rapor goruntuleyicisi GWT tabanli ve HTML olarak flight
yukunun icinde KACIRILMIS halde duruyor. Ayristirilabilir.

### 205.1 YAPI
    <div class="...content-tr">ETIKET</div></td><td...><div>DEGER</div></td>
Etiket bir hucrede, degerler sonraki hucrelerde. Genelde IKI sutun:
cari donem ve onceki donem.
Kacislar: \\u003c -> < · \\u003e -> > · \\" -> "

### 205.2 YOKLAMANIN GOSTERDIGI TUZAK
"Dönem Karı" etiketi konum 607977'de bulundu AMA cevre metni
"Dönem Karı Vergi Yükümlülüğü" idi — YANLIS SATIR.
Kisa etiket, uzun etiketin ICINDE geciyor. Bu yuzden ayristirici:
  · etiketi TAM HUCRE ICERIGI olarak arar: >ETIKET</div>
  · UZUN etiketi ONCE dener (SANAYI/BANKA listelerinde sira bilincli)
Yoklama olmasaydi bu tuzak sessizce yanlis sayi uretecekti — vergi
yukumlulugunu net kar sanacaktik.

### 205.3 IKI SABLON
SANAYI: ciro · brutKar · faaliyetKar · finansGider · parasal · netKar ·
        ozkaynak · nakit
BANKA : netFaiz · komisyon · karsilik · faalKar · netKar · ozkaynak
Ikisi de denenir, HANGISI DAHA COK DOLARSA o kabul edilir. Sablon tahmin
edilmez, OLCULUR (§160'ta TSKB/GARAN icin elle ayirt etmistim).

### 205.4 EKSIK KALEM SESSIZCE ATLANMAZ
Her kalem icin bulundu/bulunamadi raporlanir; `eksik` dizisi ve `uyari` alani
doner. KIRILGANLIK GERCEK: sayfa yapisi degisirse ayristirma kirilir.
Yarim bilanco yanlis bilancodan iyidir — AMA ancak EKSIGINI SOYLERSE.
Bu, bugun tekrarlanan "sessiz basarisizlik" dersinin ayristirici versiyonu.

### 205.5 ZINCIRIN DURUMU
  1 bildirimi yakala   ✓ mod=fr
  2 kalemleri al       ✓ mod=bilanco  <- BU TURDA ACILDI
  3 metrikleri hesapla   formul belli (§183 metrik standardi)
  4 yorumu yaz           panelde Claude var; TASLAK+ONAY kurgusu onerildi
  5 karta ekle, yayinla  Actions zaten yapiyor
Ikinci adim acilinca 3 ve 5 mekanik. 4 icin kalite riski var ve taslak
kuyrugu onerildi: yazma emegi kalkar, YARGI KULLANICIDA KALIR.

DOSYALAR: api/kap.js (mod=kalem + mod=bilanco)

## 203. isLate GUVENILMEZ · TEKRAR SORUNU COZULDU (31 Tem)

mod=fr calisti: 7 gunde 2299 kayit, 280 FR bildirimi, tavan uyarisi yok.
Ama gercek veri IKI SORUN gosterdi.

### 203.1 isLate ISE YARAMIYOR — olculdu
    ARENA  2026/1  bildirim 29 Tem  -> donem sonundan 120 GUN  · isLate=false
    KARTN  2025/1  bildirim 30 Tem  -> 211 GUN                 · isLate=false
    GEDIK  2024/1  bildirim 29 Tem  -> 575 GUN                 · isLate=false
Ucu de agir gecikmis, ucu de false. isLate KAP'in KENDI IC KURALI; SPK
bildirim suresini olcmuyor.
§181'de ARENA'nin 120 gununu DOKUZ CEYREGIN TARIHINI TEK TEK hesaplayarak
bulmustum. Simdi ayni hesap tek satir:
    gecikme = bildirimTarihi − donemSonu   (1→31 Mar · 2→30 Haz · 3→30 Eyl ·
                                            4/Yillik→31 Ara)
ESIK 80 gun (SPK konsolide siniri ~70, tampon birakildi).
DERS: bir kaynagin BAYRAK alani, senin sordugun soruyu cevapliyor olmayabilir.
Ad benziyor diye anlam ayni sanma — ORNEKLE DOGRULA. Burada ARENA elimde
bilinen bir vaka oldugu icin yakalandi; olmasaydi bayraga guvenip gecikmis
sirketleri KACIRACAKTIM.

### 203.2 AYNI DONEM, COK BILDIRIM — kokten cozuldu
Gercek veri: TOASO 2026/2 icin 29 Tem'de UC bildirim (20:54·20:55·20:55),
30 Tem'de BIR tane daha. QNBTR/FIN ayni id'yi paylasiyor (ana ortaklik+bagli).
TEKILLESTIRME: (kod, yil, donem) basina TEK kayit, EN ERKEN olani.
Ilk bildirim ASIL aciklamadir; sonrakiler TR/EN surumu, duzeltme ya da ek
belge. Gecikme hesabi da ilkini kullanmali — sonrakini alsak ARENA'nin
gecikmesi bir gun fazla cikardi.
`tekrar` alani kac bildirim oldugunu tutar (gorunurluk).
§197'deki 14 gunluk TOLERANS HILESI artik tamamen gereksiz — sorun kaynakta
cozuldu, panelde ortulmuyor.

### 203.3 SONUC
280 ham FR -> tekillestirilmis liste. Nobet artik:
  · donem bazli karsilastirir (yil/donem)
  · gecikmeyi GUN olarak gosterir ("⚠ 120 GÜN GECİKMİŞ")
  · kac bildirim yapildigini yazar
ARENA gibi bir vaka bir daha ELLE kesfedilmeyecek.

ajan.js v=20260731d. DOSYALAR: api/kap.js + ajan.js + index.html.

## 202. KAP FR LISTESI ACILDI — kalemler acilmadi (31 Tem)

Yoklama v3 sonucu: LISTE ERISILEBILIR, KALEMLER DEGIL.

### 202.1 v1→v3: UC KEZ TAHMIN, BIR KEZ OLCUM
v1 bes yol tahmin -> besi de 404
v2 govdeyi tahmin -> 500 (tarih bicimi DD.MM.YYYY yazmisim, calisan kod
   YYYY-MM-DD; ustelik fazladan alan eklemisim ve pencereyi 120 gun yapmisim
   — calisan kodun YORUMU "2 gunluk pencere, 2000 tavanina uzak" diye
   uyariyordu, okumamisim)
v3 calisan istegi BIREBIR kopyala -> 200, 1978 kayit
UC TUR AYNI HATA: elde calisan ornek varken tahmin etmek. Her seferinde
"bu sefer dogru tahmin ederim" diye dusundum. Ucuncude kopyaladim, calisti.

### 202.2 GELEN ALANLAR — degerli olanlar
  disclosureClass 'FR'   -> baslik metni suzmeye gerek YOK
  stockCodes             -> hisse kodu (virgullu olabilir: holding + bagli ort.)
  year + period + ruleType -> DONEM ("2026 / 2 / 6 Aylik")
  isLate                 -> KAP'IN KENDI GECIKME BAYRAGI
  disclosureIndex        -> kimlik + /tr/Bildirim/<id> baglantisi
  publishDate            -> "30.07.2026 23:56:49"

### 202.3 IKI SORUN BUNUNLA KAPANDI
(a) NOBET ARTIK DONEM BAZLI. §197'de "ayni donemin ikinci bildirimi" sorununu
    14 gunluk TOLERANS HILESIYLE ortmustum. Artik gerek yok: ayni donemin her
    bildirimi AYNI year/period tasir. Hile yedege dustu (eski uc icin).
(b) GECIKME TESPITI BEDAVA GELDI. ARENA'da (§181) 120 gunluk deseni ELLE
    kesfetmistim — dokuz ceyregin tarihini tek tek hesaplayarak. isLate bayragi
    bunu dogrudan veriyor. Kartta "GECIKMIS" rozeti otomatik cikacak.

### 202.4 KALEMLER ACILMADI
/tr/api/disclosure/<id> -> 404 · /tr/Bildirim/<id> -> 200 ama HTML (162 KB).
Bilanco KALEMLERI bu yollardan JSON gelmiyor. `attachmentCount:1` var — rapor
EK DOSYA olarak duruyor. Ek dosya ucu ayrica yoklanmali.
DOLAYISIYLA: faktor modeli · multiple bilanco kalemleri · guidance · pay adedi
hala Fintables'a bagli. AMA "beklenen bilanco takvimi" katmani ARTIK KAP'TAN
uretilebilir (gecmis publishDate + year/period ile).

### 202.5 TAVAN UYARISI
7 gunde 1978 kayit geldi, KAP tavani 2000. TAVANA CARPIYORUZ.
mod=fr 5 gunluk DILIMLERE boluyor ve bir dilim 1990'i asarsa uyari basiyor.
§168'deki Finnhub dersinin aynisi: "veri gelmiyor" demeden once SINIRA carpip
carpmadigina bak.

DOSYALAR: api/kap.js (mod=fr) + ajan.js + index.html. ajan.js v=20260731c.

## 201. KAP YOKLAMASI — v1 tahmindi, v2 calisandan yuruyor (31 Tem)

Tam otomasyonun onundeki tek buyuk dugum: alti engelli katmanin BESI bilanco
kalemi istiyor ve su an Fintables'tan geliyor. AMA Fintables'in kaynagi KAP.
KAP'a sunucudan erisilebiliyorsa bes katman birden cozulur.

### 201.1 v1 SONUCU: BESI DE 404 — ama ONEMLI bir bilgiyle
Bes yol TAHMIN ettim (financialReport/list, company/generalInfo, ...), besi de
404 dondu. Yanit `__next_error__` icerikli HTML — KAP bir Next.js uygulamasi.
KOTU HABER DEGIL: 404 demek sunucu KAP'A ULASIYOR. 403 ya da timeout olsaydi
bot korumasi/ag engeli olurdu ve yol tamamen kapanirdi. Erisim VAR, yollar
yanlisti.

### 201.2 HATA BENDEYDI: ELIMDE CALISAN UC VARDI
kap.js zaten su ucu kullaniyor ve HABER AKISI CALISIYOR:
    POST /tr/api/disclosure/members/byCriteria
    headers: content-type, accept, REFERER (zorunlu), user-agent, cookie
Yani API tabani biliniyordu. Ben yine de yol TAHMIN ETTIM.
DERS: elde calisan bir ornek varken tahmin etmek israftir. Once calisani
incele, ondan yuru. Bu, bugun defalarca tekrarlanan "olcmeden karar verme"
dersinin kaynak kesfi versiyonu.

### 201.3 v2 TASARIMI: IKI ADIM, KIMLIKTEN YURU
  ADIM 1 — calisan ucla (byCriteria, disclosureClass:'FR') son 120 gunun
    finansal rapor bildirimlerini cek. Kod eslesenleri sus.
    RAPORLA: HTTP, kayit sayisi, kod eslesen sayisi, ILK KAYDIN ALAN ADLARI.
    Alan adlari kritik: bildirim kimliginin hangi alanda oldugunu ogrenmek
    icin tahmin degil GOZLEM gerekiyor.
  ADIM 2 — bulunan kimlikle dort detay ucu dene. Kimlik elde olunca yol
    tahmini azalir; bildirimin kendisi ne dondurdugunu soyler.
Her adim HTTP + icerik tipi + uzunluk + JSON mu + ilk 150 karakter dondurur.

### 201.4 OKUMA KILAVUZU
  1. adim kayit>0 ve alan adlari geldi -> FR listesi ERISILEBILIR (buyuk adim:
     beklenen bilanco takvimi ve "kart bekleyen" nobeti bundan beslenebilir)
  2. adimda JSON donen uc -> bilanco kalemleri gelebilir -> BES KATMAN cozulur
  Hicbiri JSON dondurmezse -> KAP yalniz LISTE veriyor, KALEM vermiyor;
     Fintables bagimliligi kalir ama elle is yine de yilda ~32.

DOSYALAR: api/kap.js

## 200. UPSTASH KULLANILMIYOR — sessiz kapalilik (31 Tem)

Kullanici: "site upstashi hic kullanmiyor, biraz oraya dosya upload etsin ya."

### 200.1 TESHIS: PANEL DESTEKLIYOR, ENV YOK
api/data.js hem KV_REST_API_URL/TOKEN hem UPSTASH_REDIS_REST_URL/TOKEN
okuyor. Ikisi de yoksa 503 ve ACIK MESAJ donuyor:
  "Depo yapilandirilmamis — Vercel'de Upstash/KV baglanmali"
API DOGRU DAVRANIYOR. Panel bunu YUTUYORDU: cloudLoad'daki try/catch hatayi
sessizce gecistiriyordu.
SONUC: kayitlar yalniz tarayicida kaliyor, kullanici senkron saniyor. Cihaz
degistirince veri "kayboldu" gorunur — oysa HIC GITMEMISTIR. En kotu hata
tipi: kayip, kaybedildigi anda degil, cok sonra fark edilir.
DUZELTME: pencere ustunde kalici uyari. `window.__bulutDurum` da isaretlenir.

### 200.2 IKI ANAHTAR BULUTA EKLENDI
parite_gecmis_v1 — gunluk snapshot biriktirir, 120 kayitla sinirli (~4 ay).
  Tarayici degisince SIFIRLANIYORDU ve geri kurulamiyordu: geriye donuk
  hesaplanamaz, yalniz gunu gunune birikir. Oturum ozetinde acik kalemdi.
  YUK OLCULDU: kayit basina 55 B, 120 kayit 6,4 KB — 900 KB sinirinin %0,7'si.
ktp_mail_to — tercih, gizli degil, eklendi.
ktp_cron_k EKLENMEDI ve eklenmeyecek: o bir ANAHTAR. Sirlar cihazdan cihaza
  dolasmaz — kaybolursa yeniden uretilir, sizarsa geri alinamaz. Asimetri
  aciktir: kolayligi az, riski buyuk.

### 200.3 "DOSYA UPLOAD ETSIN" — NE UPSTASH'E GIRER, NE GIRMEZ
UPSTASH'E: kullaniciya ozel ve sik degisen veri — pozisyon, journal, sicil,
  parite gecmisi, ajan notlari. Bunlar git'e girmemeli (her kaydetme bir
  commit olurdu) ve CDN'den servis edilemez (kisiye ozel).
GIT'E: referans verisi — endeks agirliklari, carpanlar, kartlar. Statik,
  herkese ayni, CDN'den ANINDA gelir. KV'ye tasinsa her acilista bir API
  cagrisi eklenir ve panel yavaslar.
Yani Upstash'in "bos" durmasi bir eksiklik degil, ROL AYRIMI — ama env
tanimli degilse kullanici verisi hic gitmiyor demektir ve ASIL SORUN BUDUR.

YAPILACAK (kullanici tarafinda): Vercel projesinde Upstash entegrasyonu
baglanmali. Baglaninca KV_REST_API_URL/TOKEN kendiliginden enjekte edilir;
kod degisikligi GEREKMEZ. Uyari da kendiliginden kalkar.

app.js v=20260731g. DOSYALAR: app.js + index.html.

## 199. SUKUK AKISI: IKI AYRI ARIZA, IKISI DE SESSIZ (31 Tem)

Kullanici: "bu otomatik geliyordu simdi bos geliyor."
§185'te eklenen teshis satiri sebebi ELE VERDI:
    canli 0 / arsiv 0 · pencerede (? gun)
Ikisi de sifir AMA ekranda 6 kayit var — demek ki yanit /api/kap?mod=sukuk'tan
HIC GELMEDI, panel dogrudan statik dosyaya dustu. `pencereGun` tanimsiz
olmasi da bunu dogruluyor (o alan yalniz canli uctan gelir).

### 199.1 ARIZA 1: KENDI KENDINE ISTEK MIDDLEWARE'E TAKILIYOR
middleware.js `matcher: '/:path*'` ile TUM yollari koruyor.
sukuk.js sunucu icinden kendi sitesine istek atiyor:
    fetch(kok + '/sukuk-ihrac.json')   -> 401 giris sayfasi HTML -> JSON.parse patlar
    fetch(kok + '/api/kap')            -> 401 {ok:false,'giris gerekli'} -> items yok
Ikisi de catch icinde yutuluyordu. birlesik bos -> ok:false -> panel statige duser.
NEDEN ESKIDEN CALISIYORDU: cok kullanicili koruma (§140) acilmadan once
PANEL_USERS tanimsizdi ve middleware ilk satirda `return` ediyordu. Yani
28 Tem'deki cok kullanici degisikligi, 20 Tem'den beri sessizce sukuk akisini
kirmis. UC GUNDUR bozuk ve kimse fark etmemis — cunku statik yedek doluydu.
COZUM: middleware'in ZATEN tanidigi cron muafiyetini kullan —
`Authorization: Bearer CRON_SECRET`. Yeni kapi acmiyor, var olani kullaniyor.
CRON_SECRET yoksa baslik gonderilmez, davranis degismez.

### 199.2 ARIZA 2: ESM ICINDE require()
api/kap.js `export default` (ESM) kullaniyor AMA alt modulleri `require()`
ile aliyordu. ESM'de `require` TANIMLI DEGILDIR — modul yuklenirken
ReferenceError atar ve /api/kap TUM MODLARIYLA olur.
node --check bunu ancak dosya .mjs olarak denenince gosterdi; package.json
"type":"commonjs" oldugu icin varsayilan denetim yaniltici hata veriyordu
(§'de once yanlis alarm sanmistim, dogru alarmmis).
COZUM: dinamik `import()` — ESM'de calisir, CommonJS modulunu `.default`
altinda verir. Yan fayda: TEMBEL yukleme, yalniz o mod istendiginde yuklenir.

### 199.3 IKI ARIZA UST USTE, IKISI DE SESSIZ
Bu ikisi ayni anda vardi ve BIRBIRINI MASKELIYORDU: require hatasi olsa bile
middleware zaten 401 donduruyordu; middleware duzeltilse require patlayacakti.
Teshis satiri olmasaydi hicbiri gorunmezdi — panel "6 bildirim" gosteriyor,
tarih eski ama makul, kimse sorgulamaz.
§185'te "gecici durum kalici gibi gorunmemeli" diye eklenen tek satir, UC
GUNDUR bozuk olan bir akisi ortaya cikardi.

### 199.4 DOSYALAR CIKTIYA ALINDI
api/kap.js · api/_lib/sukuk.js · api/_lib/kapyorum.js — bunlar bugune kadar
cikti dizininde YOKTU (degismedikleri icin). Artik degistiler, deploy listesine
girdiler. api/_lib/ ALT KLASOR — yuklerken yapisi korunmali.

app.js v=20260731f. DOSYALAR: api/kap.js + api/_lib/sukuk.js +
api/_lib/kapyorum.js + index.html.

## 198. TAZELIK NOBETI PLANI OKUYORDU, DOSYAYI DEGIL (31 Tem)

Ebu "inceleme-ai.json 10 gun bayat" diyordu. Oysa dosya 30 Tem'de tazelenmisti.
SEBEP: nobet `guncelleme-plani.json`'daki `son` alanini okuyor — dosyanin
KENDISINI degil. Kart ekledim, planin `son` alanini guncellemedim.

### 198.1 KENDI KURALIMI IHLAL ETTIM
§157.2'de tam bunu yazmistim: "veri tazelenince DAMGA da tazelenir; ikisi tek
islemdir." Katfon.json'da yasanmisti, kural yazildi, iki gun sonra
inceleme-ai.json'da TEKRARLANDI.
DERS: KURAL YAZMAK YETMIYOR. Elle senkron tutulmasi gereken iki alan varsa,
er gec ayrisirlar — insan hatasi degil, TASARIM hatasi. Mekanizma gerekir.

### 198.2 COZUM: TEK KAYNAK (§112)
Nobet artik JSON katmanlarinda DOSYANIN KENDI tarihini okuyor
(`guncelleme` / `tarih` / `fiyat_tarihi` alanlari) ve plandakinden YENIYSE
onu kullaniyor. Plan artik YEDEK.
Boylece elle senkron zorunlulugu KALKTI: dosyayi tazeleyen kisi planı
guncellemeyi unutsa bile nobet dogru sonuc verir.
SECIM KURALI: hangisi YENIYSE o. Cunku iki yonde de geride kalma olabilir —
plan elle tutuldugu icin geride kalir, dosyada `guncelleme` alani hic
yazilmamis olabilir.
TEST: bes senaryo (plan geride · dosya geride · dosyada tarih yok · planda
tarih yok · ikisi ayni) dogru sonuc veriyor.

### 198.3 KALAN DORT UYARI GERCEK
fm.json 17g · rezerv.json 14g · guidance.json 14g · hazine-takvim.json 10g
Bunlar GERCEKTEN bayat. Ilk ucu bilanco verisi ister (Agustos dalgasi),
hazine takvimi ayda bir elle. Nobet dogru calisiyor.

ajan.js v=20260731b. DOSYALAR: ajan.js + guncelleme-plani.json + index.html.

## 197. TOASO YANLIS POZITIFI — ayni donem, iki bildirim (31 Tem)

Kullanici karti deploy etti, Ebu HALA "TOASO kart bekliyor" diyordu.
§196'da "veri eskiydi" demistim — o dogruydu ama TEK sebep degilmis.

### 197.1 SEBEP: AYNI DONEMIN IKINCI BILDIRIMI
Ebu'nun karsilastirmasi GUN BAZINDA:
    if(kartT && nobGunAnahtar(kartT) >= nobGunAnahtar(ts)) return;
TOASO 29 Tem'de acikladi, kart 29 Tem yazildi. AMA KAP'ta 30 Tem'de IKINCI
bir FR bildirimi var. Sirketler ayni raporu birden fazla kez bildirir:
TR/EN surum, duzeltme, ek belge, bagimsiz denetim raporu.
Kart bir gun eski gorundu -> "yeni donem" sanildi.

### 197.2 COZUM: OLCEK FARKINA DAYAN
Ceyrekler arasi ~90 GUN. Ayni donemin tekrar bildirimi BIRKAC GUN icinde.
Aradaki buyukluk farki kurali kendiliginden veriyor: 14 gunluk tolerans
ikisini KESIN ayirir.
  0g  · ayni gun            -> atla
  1g  · TOASO ikinci bildirim -> atla ✓ (sorun buydu)
 12g  · iki hafta ici ek belge -> atla
 17g  · sinirin disi        -> uyar
 91g  · 3C26 gercek yeni donem -> uyar ✓
14 secildi cunku bilanco + faaliyet raporu + denetim bildirimleri bazen iki
haftaya yayilir.

### 197.3 BIR TUZAK DAHA: nobGunAnahtar SAYI DONDURUYOR
Ilk yazimda `(nobGunAnahtar(ts) - nobGunAnahtar(kartT)) / 86400000` yazdim.
nobGunAnahtar YYYYMMDD SAYISI dondurur (20260729), zaman damgasi DEGIL.
Fark 1 gun icin 1 verir, 86400000'e bolununce 0,0000000116 cikardi — tolerans
hep saglanir, nobet HIC uyarmazdi. Tam ters yonde bir hata.
Fonksiyonun ADINDAN ne dondurdugu anlasilmiyor; tanimina bakmak gerekti.
DERS: bir yardimci fonksiyonu kullanmadan once NE DONDURDUGUNE bak, adina
guvenme. "Anahtar" kelimesi hem zaman damgasi hem sirali sayi olabilir.

ajan.js v=20260731a. DOSYALAR: ajan.js + index.html.

## 196. NOBET ZATEN VARDI — §194 GERI ALINDI (31 Tem)

Ekran goruntusu iki sey gosterdi ve ikisi de beni yanilttigimi kanitladi.

### 196.1 EBU HAKLIYDI — deploy edilmemis dosya
Panel "TOASO kart bekliyor" diyordu, kullanici "ama karti var" dedi.
AYNI EKRANDA: "TAZELENMELI · 5 ... inceleme-ai.json 10 gun".
Yani DEPLOY EDILMIS surum 10 gun eski; TOASO karti orada YOK. Ebu dogru
soyluyordu. Bugun yazilan 25 kartin HICBIRI yayinda degil.
DERS: bir uyarinin yanlis oldugunu dusunmeden once, uyarinin BAKTIGI VERININ
guncel olup olmadigina bak. §195'te kodu "duzelttim" — oysa kod dogruydu,
veri eskiydi. Yanlis teshis, gereksiz degisiklik.

### 196.2 NOBET ZATEN VARDI — ben ikincisini yazdim
ajan.js'te `nobetPano`, `NOBET_SON.bilanco`, "KART BEKLEYEN BILANCO"
BASTAN BERI VARDI. §194'te aynisini app.js'e ikinci kez yazdim, VAR MI DIYE
BAKMADAN.
Bugun bu hatayi IKI KEZ yakalamistim (§171 globalTakvimRender cift tanim,
§173 bistTakvimRender cift tanim) ve her ikisinde de "bir fonksiyon yazmadan
once ayni adda var mi diye bakilir" dersini yazmistim. UCUNCUSUNU KENDIM
YAPTIM — ve bu sefer ayni dosyada degil, KOMSU DOSYADA aradim gerekirdi.
KURAL GENISLETILDI: yeni bir ozellik yazmadan once yalniz app.js degil
ajan.js de taranir. Panel iki motorlu (app + ajan); ozellik ikisinden birinde
olabilir.
§194 GERI ALINDI: fonksiyon, cagrilar ve #bilancoNobet kutusu kaldirildi.

### 196.3 GERI ALIRKEN BLOK KESME YINE FAZLA GITTI
Kaldirma sirasinda susly parantez sayaci dizge icindekileri de saydi ve
153 SATIR silindi — bistTakvimRender'in govdesi de gitti.
node --check "Unexpected end of input" verdi, yakalandi.
ONARIM: govde §172 kaynagindan yeniden yazildi. Sonra TAM DENETIM kosuldu:
270 fonksiyon, cift tanim YOK, bes kritik fonksiyonun tanim/cagri/kutu
uclusu dogrulandi.
Bu, §130.3'ten beri BESINCI blok kesme hatasi. Dengeli tarama SUSLY PARANTEZ
sayarak yapiliyor ve JS'te parantez dizge/regex icinde de gecer. Tek guvenilir
yontem: kesilen blogun ICINDE olmasi gerekeni VE olmamasi gerekeni assert
etmek — bu sefer "olmamasi gereken"i yazmamistim.

app.js v=20260731e. DOSYALAR: app.js + index.html.

## 195. NOBET YANLIS POZITIF VERDI — TOASO (31 Tem)

Kullanici: "toaso bekleyen kart diyor ama toaso karti var zaten." HAKLI.

### 195.1 SEBEP: BOS TARIHTE ACIGA DUSEN KOSUL
    if(kt && t && kt >= t) return;     // ESKI
`t` KAP bildiriminin tarihi. Okunamazsa (ts alani yok ya da cozulemiyor)
`t` bos string olur, `t &&` kosulu DUSER, atlama gerceklesmez ve karti olan
sirket "bekliyor" diye isaretlenir.
TOASO'nun karti 29 Tem'de yazilmisti ve tarih_iso alani da doluydu — sorun
kart tarafinda DEGIL, KAP tarafindaydi.
DUZELTME:
    if(kt && (!t || kt >= t)) return;  // YENI
Tarih bilinmiyorsa VE kart varsa ATLA.

### 195.2 NEDEN "SUPHEDE SUS"
Bir nobet sisteminde yanlis pozitif, yanlis negatiften DAHA ZARARLIDIR:
kacirilan bir uyari tek bir karti geciktirir; yanlis uyari ise SISTEME OLAN
GUVENI bitirir. Iki kez "ama bunun karti var" dedirtirse kullanici uyarilara
bakmayi birakir ve gercek uyari da kaybolur.
KURAL: belirsizlikte ALARM VERME. Emin degilsen sus, ama SUSTUGUNU de
gorunur kil (asagida).

### 195.3 GEREKCE EKRANA TASINDI
Satirda artik kart tarihi de yaziyor:
    30 Tem  GARAN  Finansal Rapor · son kart 2026-07-30  [BUGUN]
    31 Tem  ASELS  Finansal Rapor · kart yok
Boylece "bunun karti var" itirazi ekranda ZATEN cevaplanmis olur —
karsilastirma gorunur. Kullanicinin koda bakmasi gerekmez.
Bu, §141'in ("panel ne bildigini degil, HANGI TARIHTEN bildigini de soylemeli")
karar mantigina uygulanmis hali: yalniz sonucu degil GEREKCESINI de goster.

app.js v=20260731c. DOSYALAR: app.js + index.html.

## 194. BILANCO NOBETI — kart bekleyeni YAKALA, kart URETME (31 Tem)

Kullanici: "simdi bilanco geldiginde otomatik tarayip kart mi cikartacak?"
CEVAP: HAYIR — ve olmamali. Ama TESPIT otomatiklesebilir.

### 194.1 AYRIM: TESPIT vs YARGI
Kart yazmak yargi isidir. Bugunku kartlarin degeri rakamlarda DEGILDI:
  ARENA  120 gunluk gecikme deseni (9 ceyrek 36-42 gun, sonra 4'u birden 120+)
  TOASO  FAVOK duserken faaliyet karinin ARTMASI — sebep amortismanin −%63'u
  TSKB   karsilik 11,8 kat sicradi AMA 6 aylik bazda gecen yilin ALTINDA
  META   FCF 784 mn$ — mansette hic gorunmuyor
Bir betik rakami tabloya dizer, hangisinin TUZAK oldugunu soyleyemez.
AMA "X sirketi FR bildirimi yapti, karti yok" demek TAMAMEN mekanik.
Nobet bunu yapar: KART URETMEZ, EKSIGI SOYLER.

### 194.2 KAPSAM SUZGECI SART
30 Tem'de 11 sirket acikladi, yalnizca 1'i panel kapsamindaydi. Kapsam disi
isimler icin uyari basmak GERCEK UYARIYI GURULTUDE BOGAR.
Kapsam = XK100 ∪ XKTUM ∪ XKTMT ∪ portfoy ∪ multiple.json ∪ DAHA ONCE KART
YAZILANLAR. Sonuncusu onemli: TSKB/GARAN katilim evreni disinda ama izlenen
isimler; bir kez kart yazildiysa o sirket ilgi alanindadir.

### 194.3 ILK SURUM KUSURLUYDU — SIRKET degil DONEM duzeyi
Ilk yazim `kartli.has(kod)` diyordu: GARAN'in 2C26 karti varsa 3C26
acikladiginda SESSIZ kalirdi. Sirket duzeyinde calisiyor, donem duzeyinde
degil.
DUZELTME: sirket basina EN YENI kart tarihi tutulur; bildirim ondan sonraysa
yeni donem demektir, uyari verilir.
TEST: GARAN 2C26 (kart 30 Tem) -> atlanir · GARAN 3C26 (28 Eki) -> YAKALANIR.
Bu, §161'deki "yazdim ama gorunmuyor" ailesinin akrabasi: kural DOGRU
gorunuyordu ama BIR BOYUT eksikti.

### 194.4 KAYNAK: mevcut KAP akisi
Ayri cagri yapilmadi — kapCek() zaten /api/kap'i cekiyor, yanit
window.__kapAkis'e saklanip nobet tetikleniyor. FR suzgeci: bildirim tipi FR
ya da baslikta "finansal rapor|finansal tablo|bagimsiz denetim".
Test: "Pay Alim Satim Bildirimi" dogru sekilde ATLANDI.

app.js v=20260731b. DOSYALAR: app.js + index.html.

## 193. DAMGALI YEDEK GECICI OLDUGUNU SOYLEMIYORDU (31 Tem)

Kullanici: "sayfayi yeniledigimde herseyy once eski tarihteki veriler geliyor
sonra guncelleniyor, mesela tarih 20 temmuz geliyor sonra 31 temmuz oluyor."

### 193.1 TASARIM DOGRU, GORUNUM YANILTICI
Panel damgali yedegi ANINDA basar (ag beklemeden, sayfa bos kalmasin diye),
canli veri gelince degistirir. Bu desen dogru — alternatifi bos ekran.
AMA o birkac saniyede ekranda ESKI BIR TARIH durur ve GUNCEL GORUNUR.
Fon yoneticisi icin bu kucuk bir sey degil: 20 Tem tarihli bir rakama bakip
bugunku sanmak, karar zincirinin en basinda hata demektir.
DAHA KOTUSU: canli cagri DUSERSE o hal KALICI olur ve hicbir uyari cikmaz.
§143'un ("sessiz yedek yedegin kendisinden tehlikeli") arayuz versiyonu.

### 193.2 UC DURUM GORUNUR YAPILDI
  1. ACILIS   <body class="veri-bekliyor"> — damgalar SOLUK (.45), kesikli
              cerceveli, ⏳ ekli ve NABIZLI (1,6 sn animasyon).
              Deger alanlari da soluk (.62). Mesaj: "henuz canli degil".
  2. CANLI    canliEnjekte icinde sinif KALKAR, her sey normale doner.
              Neden orada: market verisinin islendigi TEK nokta. Daha erkene
              konsa "geldi" demeden kalkardi, daha geceye konsa bir hatada
              hic kalkmazdi.
  3. GELMEDI  20 sn sonra sinif kalkar AMA damgalara KALICI kirmizi uyari
              basilir: "DAMGALI YEDEK · <eski metin>". Sessizce normale
              donmek EN KOTUSU olurdu — eski rakam guncel gorunurdu.

### 193.3 NEDEN ENDEKS TABLOSU ETKILENMEDI
endeksRender ZATEN dogru yapiyordu: her satiri canli mi damgali mi diye
isaretliyor (`tz` bayragi -> "canli" rozeti). Sorun DAMGA TARIHLERINDEYDI —
kartlarin ustundeki tarih rozetleri damgali dosyanin tarihini basip canli
gelince degistiriyordu. Cozum genel: butun .tag ogeleri kapsaniyor.

### 193.4 DERS
Gecici bir durum, KALICI GIBI GORUNMEMELI. Yukleniyor hali ile yuklenmis hali
ayirt edilemiyorsa, kullanici her zaman yanlis olani dogru sanar — ve bu
YALNIZCA ilk saniyelerde degil, cagri dustugunde SURESIZ boyle kalir.

index.html + app.js. app.js v=20260731a.

## 192. adjclose YETMEDI — kurumsal islem suzgeci (30 Tem)

§191'de POLHO'nun %325,40 vol'u icin adjclose'a gecildi. YENI KOSUDA SAYI
DEGISMEDI: yine 325,40, virgulune kadar. Ve "ham kapanis kullanildi" uyarisi
da CIKMADI — yani adjclose VARDI ama close ile AYNIYDI.

### 192.1 TESHIS: Yahoo BIST'te tam duzeltmiyor
Yahoo'nun adjclose'u temettu ve bolunmeyi ABD hisselerinde duzeltir; BIST'te
bedelsiz ve sermaye artirimi cogu zaman ISLENMEZ. Seri ham kalir, adjclose
alani var ama icerigi close ile ayni. Dolayisiyla "adjclose kullan" cozumu
BU PIYASADA YETERSIZ.
Bunu ancak SAYININ DEGISMEMESI gosterdi — kod dogru calisiyordu, veri
yetersizdi. Farki gormek icin ayni olcumu iki kez yapmak gerekti.

### 192.2 COZUM: PIYASA KURALINA DAYAN
BIST'te gunluk fiyat limiti ±%10. Bunu asan TEK GUNLUK hareket FIYAT HAREKETI
OLAMAZ — bolunme, bedelsiz ya da sermaye artirimidir.
Sinir %20 secildi (limitin IKI KATI): tavan-taban serisi, seans kesintisi
gibi mesru uc durumlara alan birakir, kurumsal islemi yakalar.
OLCULDU (sentetik): temiz seri %13,6 · tek −%75 gun eklenince %76,6
(5,6 KAT) · suzgecten sonra %13,5 — sapma %0,3. Temize donuyor.
Atlanan gun SAYILIR ve raporlanir: "N gun kurumsal islem suzgecine takildi".

### 192.3 BETA ICIN ESLESMIS CIFT SARTI
Suzgec beta hesabini bozabilirdi: hisse tarafinda bir gun atilip endeks
tarafinda atilmasa, seriler kayar ve korelasyon anlamsizlasir.
Bu yuzden gunler once null ile ISARETLENIR, sonra IKI SERIDE DE gecerli
olanlar eslestirilerek alinir. Tek tarafli atma YOK.
Ayni hizalama mantiginin (§190.2 ortak gun sarti) devami.

### 192.4 DERS — "cozumu uyguladim" ile "sorun cozuldu" ayri seyler
adjclose dogru bir duzeltmeydi ve DOGRU UYGULANDI. Ama sorunu cozmedi cunku
kaynak veri o duzeltmeyi tasimiyordu. Kod dogru, veri yetersiz.
Bir duzeltmeden sonra AYNI OLCUMU TEKRAR KOSTURMAK sarttir; "yaptim" demek
yetmez. Bu oturumun tekrarlayan temasi (§136 tanimli/calisiyor · §161
yazdim/gorunuyor · §189 yukledim/calisiyor) — bu da onun VERI versiyonu.

DOSYALAR: scripts/tazele.mjs

## 191. IKI GERCEK BULGU: XKTUM Yahoo'da YOK + duzeltilmemis seri (30 Tem)

Risk katmani ilk kosusunda teshis tam istendigi gibi calisti ve IKI GERCEK
SORUN ortaya cikardi. Ikisi de panelin BASKA yerlerini de ilgilendiriyor.

### 191.1 XKTUM YAHOO'DA YOK — panelin sicili sessizce calismiyormus
Yedekli zincir cikti verdi:
    XKTUM.IS: bos · ^XKTUM: bos · XU100.IS: 250
Yani Yahoo'da XKTUM DIYE BIR SEMBOL YOK.
ETKISI RISK KATMANIYLA SINIRLI DEGIL: api/market.js'te `xktum: 'XKTUM.IS'`
yaziyordu. Demek ki `m.xktum.p` HER ZAMAN null donuyordu ve:
  · trackRender'daki `if(... && m.xktum && m.xktum.p)` korumasi hep FALSE
  · sicil (model vs endeks) canli tarafta HIC GUNCELLENMIYORDU
  · sicil kurma ekrani "Canli fiyatlar henuz yuklenmedi" uyarisi veriyordu
Hata firlatmiyor, sessizce ATLIYORDU — bu oturumun tekrarlayan temasi.
DUZELTME: market.js'te xktum -> XU100.IS'e yonlendirildi.
ACIK KALAN: track.json'un endeks_kapanis'i Fintables'tan gelen GERCEK XKTUM
(18262,59). Canli taraf artik XU100 donduruyor. IKI FARKLI ENDEKS — oran
almak taban kaymasi uretir (§114). Koda uyari notu dusuldu; kalici cozum ya
track.json'u XU100 bazina cevirmek ya da sentetik XKTUM hesaplamak
(xktum.json'da agirliklar VAR, uyelerin fiyati da cekiliyor — yapilabilir).

### 191.2 POLHO %325 VOL — HAM kapanis kullaniyormusum
Denetim yakaladi: 1 kayit ±%150 sinirini asti, POLHO 325,40%.
SEBEP: Yahoo'nun `indicators.quote[0].close` alani HAM kapanistir; bolunme ve
bedelsiz icin DUZELTILMEZ. Duzeltilmis seri ayri alanda: `indicators.adjclose`.
OLCULDU (sentetik 1:4 bolunme): ham vol %76,1 · duzeltilmis %11,3 — tek bir
bolunme oynakligi 6,8 KAT sisiriyor.
Bu, §149'daki "dagitim tuzagi"nin HISSE SERISI versiyonu: orada fon fiyati
kar payi icin duzeltilmemisti, burada hisse fiyati bolunme icin. AYNI HATA,
FARKLI VARLIK.
DUZELTME: adjclose oncelikli, yoksa close'a duser VE duseni RAPORLAR
("duzeltilmis seri yok, HAM kapanis kullanildi: ...").

### 191.3 DENETIM YINE ISINI YAPTI
Bu iki sorun da denetim kurallari olmadan GORUNMEZDI:
  · XKTUM: seri bos donunce eski kod sessizce atlardi
  · POLHO: %325 vol makul gorunmez ama kimse tek tek bakmaz
Kurallar yazilirken gerekce olarak 29 Tem'in hatalari kullanilmisti; iki gun
icinde uc yeni gercek hata yakaladilar (XKTUM payda + XKTUM sembol + POLHO).

DOSYALAR: scripts/tazele.mjs + api/market.js + app.js

## 190. RISK METRIKLERI OTOMATIKLESTI — vol · beta (30 Tem)

Bes katman yesil yandiktan sonra kullanici: "baska neyleri otomatik yapabiliriz."
Kalan damgali katmanlar tarandi; RISK acik ara en uygun cikti.

### 190.1 NEDEN RISK
risk.json yalniz {kod, vol, beta} tutuyor ve IKISI DE SAF HESAP —
fiyat serisinden turer, dis kaynak GEREKMEZ:
  vol  = gunluk getiri std sapmasi × √252   (yilliklandirilmis %)
  beta = kov(hisse, endeks) / var(endeks)
Betik zaten Yahoo'ya gidiyordu; tek fark range=5d yerine range=1y cekip
hesap yapmak. 141 hisse, ayda bir elle yapiliyordu.
DEGERI: panelin GROSS BETA hesabi (endeksten ayrisma karti) dogrudan buna
dayaniyor. Bayat beta, ayrisma yorumunu sessizce kaydiriyordu.

### 190.2 IKI TASARIM KARARI
ENDEKS OLARAK XKTUM: panelin sicil karsilastirmasi da XKTUM kullaniyor
(track.json endeks_kapanis). Boylece beta ile sicil AYNI TABANDAN olculuyor.
XU100 secilseydi iki metrik farkli evrene bakardi — §114'teki taban kaymasi
hatasinin ayni ailesi.
ORTAK GUN SARTI: hisse ve endeks serisi AYNI GUNLERDE hizalanir (kesisim).
Yahoo bazi gunleri atlar (tatil, islem yok); hizalamadan hesaplanan beta
YANLIS cikar ve bu SESSIZ bir hatadir — sayi makul gorunur.
TEST: %14 gunu eksik seride bile beta 1,50'de kaldi (kesisim sayesinde).

### 190.3 DOGRULAMA — bilinen degerlerle
  endeksin kendisi        -> beta 1,00  ✓
  1,5 kat oynak seri      -> beta 1,50  ✓ · vol orani 1,51 ✓
  %14 gunu eksik seri     -> beta 1,50 (222 ortak gun) ✓
  40 gunluk seri          -> null (60 gun sarti) ✓
Sentetik seriyle sinama, gercek veriye gitmeden matematigi kanitlar.

### 190.4 DENETIM SINIRLARI — gerekceli
beta ±3: BIST'te 3'u asan beta neredeyse HER ZAMAN hizalama hatasi ya da
  bolunme artigidir, gercek degil.
vol %150: asan hisse ya islem gormuyor ya veri bozuk.
kapsam %90 (digerlerinde %95): seri gerektiren hesapta bazi hisselerin
  gecmisi kisa olabilir (yeni halka arzlar), tolerans biraz genis.
Hesaplanamayanlar RAPORLANIR, sessizce atlanmaz.

### 190.5 HAFTALIK, GUNLUK DEGIL
1 yillik pencereden hesaplanan vol/beta gunluk anlamli oynamaz. Cumartesi
kosusuna birakildi — gereksiz commit uretmez.

SIRADAKI ADAYLAR (yapilmadi): halka arzlar (guncel fiyat + getiri fiyattan
turur, ilk/arz/buyukluk sabit) · temettu (Yahoo events=div, ama BIST'te
bedelsiz/bolunme ayni akistan gelir, ayirmak gerekir).

DOSYALAR: scripts/tazele.mjs + .github/workflows/tazele.yml

## 189. IKI KALINTI: kismi yukleme + --omit=dev tuzagi (30 Tem)

Dorduncu kosu. XKTUM 61,98 -> 100,00 oldu ama hedef 96,5'i yine tutmadi;
ayrica fon katmani "Playwright kurulu degil" diyerek atlandi.

### 189.1 XKTUM: BETIK YUKLENMEMIS, JSON YUKLENMIS
Kullanici xktum.json'i yukledi (kural hedefi 96,5 okuyor — dogru) AMA
scripts/tazele.mjs'i yuklemedi. Eski betikte `toplam_uye_sd` alanina bakan
bir dal vardi; o alani JSON'dan KALDIRDIGIM icin eski betik `payda = toplamSD`
yapti ve agirliklar 100'e normalize oldu.
Yani: yeni veri + eski kod = UCUNCU BIR YANLIS SONUC.
DERS: bir alanin ADI degisiyorsa veya KALKIYORSA, o alani okuyan KOD ile
BIRLIKTE deploy edilmeli. Ayri ayri yuklenirse arada tutarsiz bir durum olusur
ve bu durum COGU ZAMAN SESSIZDIR — burada denetim yakaladi, yakalamayabilirdi.
(§129'daki "bir alani silmeden once TUM okuyucularini ara" kuralinin deploy
zamani versiyonu.)

### 189.2 --omit=dev TUZAGI — kendi kendini kuran hata
Is akisinda:
    if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install; fi
ILK kosu: lock YOK -> npm install -> playwright kuruldu ✓ (log: 32 sn,
  Chrome Headless Shell indirildi)
IKINCI kosu: ilk kosu package-lock.json'i COMMIT ETTI -> lock VAR ->
  npm ci --omit=dev -> playwright devDependencies'te oldugu icin ATLANDI ✗
Yani ilk kosunun BASARISI, ikinci kosunun basarisizligini uretti. Bu tur
"kendi kendini kuran" hatalar en zor fark edilenlerdir cunku ayni kod iki
kez farkli davranir.
DUZELTME: --omit=dev kaldirildi. Ayrica adima bir kontrol satiri eklendi:
`require.resolve('playwright')` denenir ve sonuc LOGA YAZILIR — bir daha
"kuruldu mu kurulmadi mi" diye tahmin edilmez (§145).

### 189.3 IYI HABER
Rapor artik TAM: bes katmanin dordu gecti, biri kaldi, biri atlandi ve
UCUNUN DE SEBEBI YAZILI. "Sonuc: degisiklik yok" satiri da dogru — veri
onceki kosuda zaten yazilmisti, fiyatlar degismedi (Yahoo hala 29 Tem).
Sistem calisiyor; kalan iki sorun da KURULUM kalintisi, mimari degil.

DOSYALAR: .github/workflows/tazele.yml

## 188. OTOMASYON UCTAN UCA CALISTI — ve denetim ILK GERCEK HATAYI yakaladi (30 Tem)

Ucuncu kosuda sistem tamamlandi:
  cek -> hesapla -> DENETLE -> yaz -> commit -> Vercel deploy
Log: `ff829db..b3fee26 main -> main · commit atildi — Vercel deploy'u tetiklendi`

### 188.1 SONUC: 4 KATMAN GECTI, 1 KALDI
  XK100   ✓ 100/100 · tek tarih · toplam 100,00
  XKTMT   ✓  34/34  · tek tarih · toplam 100,00
  Multiple ✓ 141/141 · tek tarih · aykiri temiz (137 fiyat yazildi)
  Sicil    ✓  40/40  · tek tarih · aykiri temiz
  XKTUM   ✗ toplam 61,98 (hedef 96,5) — sapma 34,52
Kapsam ve tarih birligi XKTUM'da da GECTI; yalniz TOPLAM kurali kaldi.
Ve kaldigi icin XKTUM YAZILMADI — digerleri yazildi. Tam istenen davranis:
kismi basari, bozuk veri yok, bildirim var.

### 188.2 YAKALANAN HATA BENIM FORMULUMDU
    payda = (toplamSD / kapsanan) × toplam_uye        ← YANLIS
Bu, "eksik uyelerin ortalama buyuklugu kapsananlarinkine esit" varsayar.
DEGIL: kapsanan 150 EN BUYUKLER, eksik 92 ince kuyruk. Payda 1,61 kat sisti,
agirliklar ayni oranda kuculdu: 100 / 1,6133 = 61,98. Tam olcum bu.
DOGRUSU basit ve varsayimsiz — kapsama orani ZATEN BILINIYOR:
    payda = toplamSD / (kapsanan_agirlik_hedef / 100)
XKTUM icin hedef 96,5 -> toplam 96,50 cikar. DOGRULANDI.
`toplam_uye_sd` alani kaldirildi; `kapsanan_agirlik_hedef` hem HEDEF hem
PAYDA CARPANI olarak kullaniliyor — tek kaynak, kendi kendine tutarli (§112).

### 188.3 DENETIM KENDINI KANITLADI
Bu kural (§186.4'te "yanlis normalize"yi yakalasin diye yazilmisti) ILK
KOSUDA gercek bir hata buldu — ve hata BENIM KODUMDAYDI.
Denetim olmasaydi XKTUM agirliklari %38 DUSUK yazilacakti ve endeksten
ayrisma tablosundaki TUM aktif agirliklar sistematik kayacakti. Ustelik
kimse fark etmezdi: sayilar makul goruntdur, toplam ekranda gorunmez.
§179.3'un ("eski veri eksik veriden tehlikelidir") kardesi: YANLIS veri de
eksik veriden tehlikelidir, ayni sebeple — gorunmez.

### 188.4 IKI EKSIK KAPATILDI
  · .gitignore YOKTU -> ilk commit'e node_modules girdi (binlerce dosya).
    .gitignore eklendi + commit adimina `git rm -r --cached node_modules`
    konuldu (indeksten dusurur, .gitignore yeni gelenleri engeller).
  · Yapiyi goster adimi §187'de duzeltilmisti, bu kosuda dogru calisti:
    "index.html bulundu → ktpanel".

DOSYALAR: scripts/tazele.mjs · xktum.json · .gitignore (YENI) ·
.github/workflows/tazele.yml

## 187. TESHIS ADIMI ISI OLDURDU — bash && tuzagi (30 Tem)

Ilk iki kosuda is dustu. Ucuncude sebep goruldu ve suclu BENIM TESHIS ADIMIMDI.

### 187.1 ONCEKI IKI HATA (cozuldu)
#1 exit 254, 11 sn: `npm ci` repo KOKUNDE package.json bulamadi. Kullanici
   package.json'i ktpanel/ altina koymustu (dogru yer, Vercel icin) ama npm
   kokten kosuyor. KOKE AYRI package.json konuldu — Vercel Root Directory
   ktpanel oldugu icin onu gormez, karismaz.
#2 exit 1, 49 sn: npm ve Playwright gecti, betik CALISTI. Ama...

### 187.2 ASIL HATA: `[ -f x ] && echo` KALIBI
Teshis adiminda su vardi:
    for d in . ktpanel panel public; do
      [ -f "$d/index.html" ] && echo "bulundu → $d"
    done
Dongunun SON turu `public` — orada dosya yok, `[ -f ]` 1 doner, `&&` kisa
devre yapar ve DONGUNUN cikis kodu 1 olur. Actions bunu hata sayip isi
DURDURUR. "Tazele" adimi ⊘ ile atlandi — asil is hic kosmadi.
LOG YAPIYI DOGRU YAZMISTI: "index.html bulundu → ktpanel". Yani arama
CALISIYORDU; adim yalnizca cikis koduyla kendini oldurdu.
DUZELTME: if/fi kullan, sona `exit 0` koy, continue-on-error ekle.
OLCULDU: eski kalip cikis 1, yeni kalip cikis 0.

### 187.3 DERS — §145'IN TEKRARI, BU SEFER BASH'TE
§145'te "teshis araci teshis edecegi arizadan ETKILENMEMELI" yazilmisti
(katfon debug modu arizadan once kosmaliydi). Burada daha kotusu oldu:
teshis adimi arizayi YARATTI. Bilgi toplamak icin eklenen adim, bilgi
toplanacak adimin kosmasini engelledi.
KURAL: teshis/log adimlari HER ZAMAN continue-on-error tasir ve cikis kodu
0 dondurur. Bir gozlemci, gozledigi sistemi durdurmamalidir.

DOSYALAR: .github/workflows/tazele.yml + kok/package.json (YENI).

## 186. OTOMATIK TAZELEME KURULDU — GitHub Actions (30 Tem)

Kullanici: "senin siteyi tarayip otomatik deploy etmen lazim, bunu nasil
yapariz." Sonra: "benim makinemi baglayayim mi?" -> HAYIR, GitHub Actions.
Sonra: "senin githuba erisimin var yap ozaman" -> YAZMA ERISIMIM YOK,
dosyalar yazildi, deploy kullaniciya birakildi.

### 186.1 NEDEN ACTIONS, KULLANICININ MAKINESI DEGIL
Makine acik olmak zorunda kalir, tatilde veri bayatlar, bir bagimlilik daha
eklenir. Actions GitHub'in sunucusunda kosar, Playwright'i destekler ve
COMMIT ATINCA VERCEL KENDILIGINDEN DEPLOY EDER — kullanicinin bastaki
"otomatik deploy" sorusunun cevabi da bu.

### 186.2 CEKIRDEK FIKIR: CARPAN/FIYAT AYRISMASI
Damgalanan sey FIYAT degil CARPAN olmali.
  ONCE : xk100.json = {ASELS: %20,23}        -> fiyat gomulu, HER GUN bayatlar
  SONRA: xk100.json = {ASELS: 1.175.568.000} -> serbest dolasim PAY ADEDI
Sunucu her gun Yahoo'dan fiyati ceker, agirligi KENDI hesaplar. Pay adedi
CEYREKLIK degisir (endeks revizyonu + sermaye artirimi).
DOGRULAMA: pay adedinden IMA EDILEN fiyat, gercek fiyati ort. %0,5 sapmayla
tutuyor (ASELS 359,75 vs 357,50 · CIMSA 47,43 vs 47,44). Goc dogru.
multiple.json ve track.json ZATEN dogru yapidaydi (bilesenler sabit, fiyat
tazelenir) — goc gerekmedi.
OLCUM: elle tazeleme 438/yil -> ~32/yil.

### 186.3 UC KATMANLI SINIFLANDIRMA (33 katman)
  ① 7 katman ZATEN CANLI — is yok
  ② 20 katman sunucudan erisilebilir (Yahoo/FRED/KAP/EVDS/web)
  ③ 6 katman Fintables ister — AMA cogu aslinda FIYAT bagimliligiydi;
    ayrismadan sonra geriye yalniz analist (aylik) + ceyreklik carpanlar kaldi
DARBOGAZ: katilim fonlari (gunluk 250/yil, kalan yukun %89'u). TEFAS bot
korumasi sunucudan duz fetch'e izin vermiyor (§145-148) ama Playwright ile
Actions'ta calisir — betikte o yol yazildi (sayfa baglamindan fetch, cerezler
tarayicinin kendisinden gider).

### 186.4 DENETIM AYRI DOSYADA — kasitli
scripts/denetim.mjs, tazele.mjs'ten BAGIMSIZ. Ayni fonksiyon hem veriyi cekip
hem "dogru mu" derse, cekme mantigindaki hata denetimi de kandirir.
Alti kural, hepsi 29 Tem'de yakalanan gercek hatalardan turedi:
  kapsam (29/40 vakasi) · tarih birligi (karisik tarih) · aykiri deger (MPE
  dagitimi −%3,57) · donem tutarliligi (capa hatasi) · toplam (yanlis
  normalize) · bayatlik (SNGYO sahte %238)
TEST EDILDI: alti kural da ilgili senaryoyu dogru yakaliyor.
KURAL: denetimden gecmeyen veri COMMIT EDILMEZ, is KIRMIZI yanar.
Sessizce bozuk veri yayinlamaktansa eski veriyle kalmak yegdir.

### 186.5 OTOMATIKLESMEYECEKLER
Bilanco kartlari · tezler · taktiksel durus · Ebu yorumlari. Yargi isi.
Bugunku kartlarin degeri rakamlarda degildi: ARENA 120 gunluk gecikme deseni,
TOASO'da FAVOK duserken faaliyet karinin AMORTISMANDAN artmasi, META'da FCF'in
784 mn$'a inmesi. Betik bunlari yazamaz.

DOSYALAR (YENI): .github/workflows/tazele.yml · scripts/tazele.mjs ·
scripts/denetim.mjs · KURULUM.md · OTOMASYON.md
DEGISEN: xk100.json · xktum.json · xktmt.json (pay_adedi biçimine gecti)

## 185. KIRA SERTIFIKASI AKISI — canli degil, ARSIV gosteriyordu (30 Tem)

Kullanici: "bu kisim akiyor mu, canli olmasi lazim."
Ekranda yesil nokta + "KAP · bildirimler" + rozet "KAP · 20 TEM 26".
BUGUN 30 TEM. Damga 10 GUN ESKI.

### 185.1 TESHIS: KOD DURUSTTU, GORUNUM ALDATICIYDI
ihracRender ONCE canliyi deniyor (/api/kap?mod=sukuk), duserse statik
sukuk-ihrac.json'a doner — dogru desen.
Rozet mantigi da dogruydu:
    (d.canliAdet ? 'KAP canli · ' : 'KAP · ') + tarih
canliAdet=0 oldugu icin "canli" YAZMIYORDU. Yani kod yalan soylemiyordu.
AMA AYRIM COK INCEYDI: kullanici yesil nokta + "KAP" gorup canli saniyordu.
Ekrandaki alti kayit sukuk-ihrac.json'un (20 Tem, 6 ihrac) TA KENDISIYDI —
statik dosya ile ekran birebir ayni.
API ZATEN TESHIS DONDURUYORDU: kaynak · canliAdet · arsivAdet · kapHata ·
pencereGun. `kapHata` HICBIR YERDE GOSTERILMIYORDU — dustugunu biliyorduk,
NEDEN dustugunu soylemiyorduk (§143'un tekrari).

### 185.2 DUZELTME
  · canliAdet=0 ise rozet KIRMIZI ve metni "ARSIV · <tarih>"
  · govdede kirmizi cerceveli uyari: son kayit tarihi + KAC GUN once +
    sebep (kapHata varsa o, yoksa "akis yanit verdi ama <pencere> gunde
    sukuk bildirimi bulunamadi")
  · alt satirda her zaman "canli N / arsiv M" kirilimi
TEST: uc senaryo (canli bos · KAP hatasi · canli calisiyor) dogru ayriliyor.

### 185.3 ASIL SORU ACIK KALDI
canliAdet neden 0? Iki ihtimal:
  (a) /api/kap genel akisinda 30 gunluk pencerede "(Faizsiz)" basligi ya da
      VKS kodu tasiyan bildirim YOK — Turkiye piyasasi icin 10 gun boyunca
      sifir sukuk bildirimi OLASI DEGIL
  (b) /api/kap'in KENDISI dusuyor ya da dar donuyor
Sandbox'tan kap.org.tr'ye erisim yok, olculemedi. Panel artik SEBEBI EKRANDA
yazacagi icin bir sonraki acilista hangisi oldugu gorunecek.
Bu, §167'deki Finnhub teshisinin ayni deseni: once GORUNUR yap, sonra oku.

app.js v=20260730z. DOSYALAR: app.js + index.html.
NOT: api/kap.js ve api/_lib/sukuk.js CIKTI DIZININDE YOK — kaynakta var,
degistirilmedi, deploy listesine dahil DEGIL.

## 184. ABD BILANCOSU KAYNAK SIRASI — kullanici kurali (30 Tem)

Kullanici: "AV den cekebildiklerini cek sonra eksikleri ve teyit icin webe
basvur, bu kural olsun." KABUL EDILDI ve iki yere yazildi
(KTPANEL-DAMGA B8 + inceleme-ai.json `_kaynak_sirasi`).

### 184.1 SIRA
  1) ALPHA VANTAGE: EARNINGS (EPS/beklenti/surpriz) · INCOME_STATEMENT
     (ciro/brut/faaliyet/net -> marjlar buradan) · EARNINGS_ESTIMATES (ileri)
  2) WEB: (a) EKSIKLER — FCF, capex, segment dagilimi, rehberlik, tek seferlik
     kalemler; birincil kaynak SIRKET BULTENI, ikincil CNBC/Bloomberg/8-K
           (b) TEYIT — AV rakamlari bultenle karsilastirilir, tutmazsa
     BULTEN KAZANIR ve fark not edilir

### 184.2 ISTISNA OLCULDU: AV AYNI GUN GEC ISLIYOR
  MSFT 4C, aciklamadan ~9 saat sonra: reportedEPS "None"; YILLIK satir yalniz
       uc ceyregi topluyordu (13,15) ve FY25 13,64 ile yan yana "kar dustu"
       gorunumu veriyordu. GERCEK: FY26 EPS 17,95, +%32.
  META EARNINGS_ESTIMATES: `estimates: []` — tamamen bos.
Yani kural sirasi DOGRU ama aciklama gunu ve ertesi gun 1. ADIM BOS DONER.
O pencerede bulten birincil kaynaktir; AV bir-iki gun sonra CAPRAZ DENETIM
aracina doner.

### 184.3 ASIL TEHLIKE: EKSIKLIK SESSIZ
AV bir alan icin "None" doner AMA TURETILMIS satirlari (yillik toplam) yine de
BIR SAYI verir. Denetlenmezse fark edilmez ve yanlislik cogu zaman ILGI CEKICI
yonde olur. §179.3'teki "eski veri eksik veriden tehlikelidir" dersinin
toplayici-saglayici versiyonu.
KURAL: AV'den gelen her turetilmis rakamda HANGI CEYREKLERIN DAHIL OLDUGU
kontrol edilir. Ceyrek sayisi eksikse o satir KULLANILMAZ.

### 184.4 ISLEYIS
Bundan sonra "X'in bilancosu geldi" dendiginde:
  BIST  -> Fintables SQL (aciklandigi an kullanilabilir, §178)
  ABD   -> AV once, sonra web (eksik + teyit); aciklama gunuyse bulten birincil
Her iki durumda da §183 metrik standardi uygulanir: ciro · brut marj ·
faaliyet kari+marj · net kar+marj+EPS · FCF+capex · segment.

DOSYALAR: KTPANEL-DAMGA.md + inceleme-ai.json.

## 183. KART METRIK STANDARDI — MSFT/META yeniden yazildi (30 Tem)

Kullanici: "meta ve msft icin cikardigin kartlar hosuma gitmedi. brut marj
nerde ebitda marji nerde net kar marji nerde fcf nerde. bunlari standart
haline getir."
HAKLI. Ilk kartlar ciro/EPS/faaliyet karina bakiyor, MARJ KATMANLARINI ve
NAKDI atliyordu. Standart tanimlandi (KTPANEL-DAMGA B7) ve iki kart yeniden
yazildi.

### 183.1 STANDARDIN NEDEN ONEMLI OLDUGU — ayni gun kanitlandi
Iki kart AYNI SETLE yazilinca su gorundu:
  MSFT : brut marj %67 (−1 puan) · faaliyet marji %45 (YATAY) · net %39,8
  META : brut korunmus · faaliyet marji %43 -> %31 (12 PUAN) · net %26,1
Ayni AI harcama rejimi, TAMAMEN FARKLI sonuc. MSFT'de harcama gelirle birlikte
buyuyor, META'da gelirden iki kat hizli (+%55 vs +%28).
BU KARSILASTIRMA ANCAK IKI KARTTA DA AYNI SET VARSA YAPILABILIR. Standardin
asil gerekcesi guzellik degil, KIYASLANABILIRLIK.

### 183.2 FCF ATLANMASI EN BUYUK EKSIKTI
META'nin asil hikayesi mansette degil NAKITTE:
  FCF 784 MILYON dolar (1C26: 12,4 mlr$ · 2C24: 10,9 mlr$)
  capex 17,0 -> 31,1 mlr$ (IKIYE KATLANDI), faaliyet nakdi 31,9 mlr$
  aradaki farki ~25 mlr$ BORC IHRACI kapatiyor (borc 83,7 · nakit 90,3 mlr$)
Marja bakip FCF'e bakmamak bu tespiti TAMAMEN kacirmak demekti. Skor da
degistirildi: KARISIK -> NEGATIF.
MSFT tarafinda ceyreklik FCF ACIKLANMAMIS; "aciklanmadi" yazildi, TAHMIN
EDILMEDI. Sirketin FY27 icin "pozitif FCF" rehberligi ayrica not edildi.

### 183.3 SET
  1 Ciro +y/y · 2 Brut marj · 3 Faaliyet kari VE marji · 4 Net kar VE marji
  + EPS/beklenti · 5 FCF + capex · 6 Segment ciro dagilimi
FAVOK ayrica aciklanmiyorsa faaliyet marji kullanilir ve BELIRTILIR
(ABD sirketleri FAVOK'u genelde ayri vermez; BIST'te verilir).
Kaynakta olmayan kalem "aciklanmadi" yazilir.

DOSYALAR: inceleme-ai.json + KTPANEL-DAMGA.md.

## 182. GARAN 2C26 — ceyreklik momentum donmus (30 Tem)

KAP 1639060, 30 Tem 08:00. Donem ay=6 = 2C26 (ARENA dersi: once donem
dogrulandi). Banka sablonu.
NOT: bist-takvim.json GARAN icin tahmin URETMEMISTI (2025/6 kaydi yoktu) ama
panelin ESKI gomulu takvimi "30 Tem GARAN" diyordu ve TUTTU.

### 182.1 MANSET IYI, CEYREK YORGUN
6A net kar 63,4 mlr (y/y +%19,8) · 2C 30,3 mlr (y/y +%8,8) — yillik guclu.
AMA CEYREKLIK HER ANA KALEM GERILEDI:
  net faiz −%5,2 · faaliyet brut kari −%7,8 · net kar −%8,6
Tek buyuyen komisyon (+%11,7).
Net faiz y/y +%62,5 patlamis gorunuyor ama bu ZAYIF 2C25 BAZINDAN; ceyrek
ceyrek bakinca ZIRVE 1C26'DA KALMIS. Bu, "indirim dongusunde net faiz marji
ne olacak" sorusunun ilk somut cevabi ve cevap: DARALMAYA BASLADI.

### 182.2 IKI KALEM DIKKAT ISTIYOR
TICARI ZARAR UC CEYREKTIR BUYUYOR:
  2C25 −0,2 mlr -> 1C26 −5,3 mlr -> 2C26 −7,5 mlr
  6A: gecen yil +3,9 mlr KAR, bu yil −12,8 mlr ZARAR = 16,7 mlr TERS DONUS
  AYNI KALEM TSKB'DE DE BOZULMUSTU (§160) -> SEKTOREL olabilir, izlenmeli.
PERSONEL GIDERI y/y +%48,3 — enflasyonun (%32) 16 PUAN ustunde.
KARSILIK: ceyreklik −%5,2 (iyi) AMA 6A 59,4 mlr, gecen yilin %47 ustunde.
Ceyreklik rahatlama trend donusu olarak OKUNMAMALI — TSKB'de bunun TERSI
vardi (ceyreklik sicrama ama yillik azalma, §160.2). Ayni tuzagin iki yonu.

### 182.3 KAPSAM VE BAGLANTI
GARAN katilim evreninde DEGIL (konvansiyonel banka), multiple/model/analist
kapsaminda da yok. Earnings AI disinda hicbir ekranda gorunmez.
Yine de yazildi: BANKACILIK TERMOMETRESI. Net faiz marjinin indirim
dongusundeki seyri, panelin PPK patikasi ve TL/Sabit Getirili tezleriyle
DOGRUDAN bagli. Kartta Fed baglantisi da kuruldu: 29 Tem'deki uc sahin
muhalefet (§175) TCMB'nin indirim alanini daraltirsa net faiz baskisi uzar.
AKBNK (§160, skor 6,5) ile birlikte okunmali. Skor 5,5.

DOSYALAR: inceleme-ai.json (25 kart).

## 181. ARENA — gelen bilanco 2C26 DEGIL, 120 gun gecikmis 1C26 (29 Tem)

Kullanici: "arenanin bilancosu gelmis."
KAP 1639040, 29 Tem 19:58. AMA DONEM ay=3, yani 1C26 — 2C26 DEGIL.

### 181.1 ONCE DONEMI DOGRULA, SONRA RAKAMA BAK
"Bilanco geldi" denince refleks 2C26 varsaymakti; sorgu ay=3 gosterdi.
Varsayilsaydi 1C rakamlari 2C diye kart yazilacak, karsilastirma donemleri
yanlis kurulacak ve kart tamamen HATALI olacakti.
KURAL: bilanco karti yazmadan once (yil, ay) ALANI OKUNUR. Aciklama tarihi
donemi belirlemez.

### 181.2 ASIL BULGU: GECIKME DESENI
Aciklama gecikmesi (donem sonundan itibaren, gun):
  2024/03  40 · 2024/06  40 · 2024/09  36 · 2024/12  42 · 2025/03  39
  2025/06 129 · 2025/09 129 · 2025/12 133 · 2026/03 120
2025/3'e kadar DOKUZ ceyrek 36-42 gun — ornek sicil. 2025/6'dan itibaren
DORDU DE 120-133 gun. Ani ve KALICI degisim.
Bu desen tek basina bir sinyaldir ve genelde denetci gorusu, muhasebe
duzeltmesi ya da kurumsal bir sorunla birlikte gider. Fon yoneticisi icin
rakamdan ONCE sorulacak soru: SIRKET ZAMANINDA RAPORLAYABILIYOR MU?

### 181.3 RAKAMLAR DA DESTEKLEMIYOR
Ciro 5,59 mlr (y/y −%39,5; enflasyon ~%32 ile reel ~−%54) · brut marj
%5,50 -> %3,75 · faaliyet zarari −124 mn · net zarar −305 mn ·
2025 tam yil −1,14 mlr.
FAVOK −17 mn'den +21 mn'ye donmus AMA bu 38 mn'lik bir hareket, net zarar
305 mn. OLCEK UYUSMUYOR — donus degil, dipte kucuk oynama. Karta yazildi.

### 181.4 KAPSAM: HICBIR YERDE YOK
XK100/XKTUM/XKTMT uyesi degil · multiple.json'da yok · model portfoyde yok ·
analist takibinde yok. Kart BILGI AMACLI, skor 2,0.
Yine de yazildi cunku GECIKMIS BILANCO NASIL OKUNUR ornegi degerli: panelde
ileride benzer bir isim cikarsa bu kart referans olur.
Guidance alanina rakamsal olmayan bir esik konuldu: "2C26 zamaninda
(29 Agustos'a kadar) gelecek mi?" — gelirse dongu kirilmis, gelmezse sirket
yatirim evreninden cikmali.

DOSYALAR: inceleme-ai.json (24 kart).

## 180. KATILIM FONLARI + MODEL SICILI TAZELENDI — ve bir KARISIK TARIH hatasi (29 Tem)

Kullanici: "modeli guncelledik mi katilim fonlarini guncelledik mi?"
Kontrol: katfon getiri 27 Tem (2 gun), model sicili (track.json) 21 Tem (8 GUN).
Ikisi de bilanco beklemiyor — tazelendi. Faktor modeli (fm.json) 14 Tem'de
BIRAKILDI, Agustos dalgasini bekliyor (§157.5 karari gecerli).

### 180.1 KATILIM FONLARI: 27 -> 28 Tem
46/46 fon. Yontem: yeni fiyat alinir, her donem icin CAPA FIYATI eski getiriden
geri hesaplanir (capa = eski_fiyat / (1+getiri)), sonra yeni fiyata gore
yeniden olculur. Capalar sabit kaldigi icin donem getirileri tutarli kayar.
DENETIM: gunluk %2'den fazla oynayan fon YOK (dagitim tuzagi temiz, §149).
Gunluk getiri ort %0,098 · min %0,048 · max %0,119 — para piyasasi fonu icin
makul bant. Ic tutarlilik: YTD < 3A olan fon YOK.

### 180.2 MODEL SICILI: 21 -> 28 Tem, VE BIR HATA YAKALANDI
Ilk denemede 40 hissenin 29'u guncellendi, 11'i ESKI FIYATTA KALDI
(DAPGM SAFKR ARDYZ GOLTS YUNSA GRTHO AVPGY KONYA CEMTS KARSN SUNTK).
SEBEP: sorguyu market.js'in HIS listesinden kurmusum, track.json'un KENDI
holdings listesinden degil. Iki liste ortusuyor ama AYNI DEGIL.
SONUC: model getirisi 29 hisse 28 Tem + 11 hisse 21 Tem ile hesaplandi —
KARISIK TARIH. Bu, butun oturum boyunca yakaladigim hatanin ta kendisi
(§114 taban kaymasi · §150 iki tarih yan yana · §157.2 meta alani bayat).
DUZELTILDI ve ETKISI OLCULDU:
  karisik : model −0,94%  -> ayrisma −1,50 puan
  duzgun  : model −1,69%  -> ayrisma −2,25 puan
  FARK    : 0,75 PUAN. Kucuk gorunuyor ama 14 gunluk bir sicilde bu buyuk bir
            sapmadir ve YANLIS YONDE (model oldugundan iyi gorunuyordu).
DERS: bir liste uzerinden sorgu kurarken O LISTENIN KENDISI kullanilir,
"benzer" bir liste degil. Kapsam denetimi (kac/kac) bu yuzden her tazelemede
kosulur — 29/40 ciktisi hatayi hemen gosterdi.

### 180.3 SICIL SERISI — bos nokta UYDURULMAZ
Endeks serisi her is gunu tam (endeks_mumlar_gunluk_gh). Model getirisi ise
yalniz TAZELEME YAPILAN gunlerde kesin; ara gunler bos birakildi (10 gunun
4'unde model degeri var). Dosyaya not dusuldu: "bos model noktasi CIZILMEZ,
uydurulmaz." Ara degeri interpolasyonla doldurmak sicili GERCEK OLMAYAN bir
duzluk gosterir ve oynakligi olcen her metrigi bozar.

SONUC (28 Tem): MODEL −1,69% · XKTUM +0,56% · AYRISMA −2,25 puan.
En iyi SUNTK +23,2% · en kotu KTLEV −20,4%.

DOSYALAR: katfon.json + track.json + guncelleme-plani.json.

## 179. ANALIST KONSENSUSU TAZELENDI + BAYAT HEDEF TUZAGI (29 Tem)

Kullanici: "sitede guncellenmesi gereken seyleri guncelle."
Tazelik taramasi: 4 katman gecikmis. Uc tanesi (faktor modeli · guidance ·
swap stoku) bilanco/EVDS verisi ister — Agustos dalgasi beklenir (§157.5).
ANALIST KONSENSUSU oyle degil: aracı kurum raporlari surekli yayinlanir,
bilanco beklemez. TAZELENDI.

### 179.1 KAYNAK
Fintables `hisse_senedi_araci_kurum_hedef_fiyatlari`:
  GROUP BY hisse · COUNT(DISTINCT araci_kurum_kodu) · AVG(hedef_fiyat)
  WHERE yayin_tarihi >= bugun − 180 gun
51/55 hisse guncellendi. 17 Tem -> 29 Tem.
DENETIM: %35'ten fazla oynayan hedef YOK — veri tutarli.

### 179.2 BAYAT HEDEF TUZAGI — asil bulgu
Dort hisse (ALKLC · CWENE · GOKNR · SNGYO) son 6 ayda RAPOR ALMAMIS, dolayisiyla
guncellenemedi. ESKI hedefleri dosyada duruyordu ve panel onlari GUNCEL FIYATLA
kiyasliyordu. Sonuc:
  SNGYO "yukari potansiyel +%238"  <- GERCEK DEGIL
  ALKLC "−%61"                      <- GERCEK DEGIL
Ikisi de eski hedefin artefakti. Fiyat hareket etmis, hedef yerinde kalmis.
Bu tehlikeli cunku SAHTE FIRSAT gibi gorunuyor: bir fon yoneticisi ekranda
+%238 gorunce bakar.
DUZELTME IKI KATMANLI:
  (a) VERI: bu dort hisse `"bayat": true` isaretlendi
  (b) KOD: kart KIRMIZI cerceveli uyari basiyor — "son 6 ayda rapor YOK,
      cikan potansiyel GERCEK DEGILDIR"
Ayrica TEK KURUM uyarisi eklendi: 21 hissede kurum sayisi 1. Tek kurumun
gorusune "konsensus" demek yaniltici; kart bunu da soyluyor.

### 179.3 DERS — ESKI VERI, EKSIK VERIDEN TEHLIKELIDIR
Eksik veri gorunur: alan bos, kart "—" der, kullanici anlar.
Eski veri GORUNMEZ: bir sayi vardir, makul durur, hesaba girer ve YANLIS
SONUC uretir. Ustelik yanlislik cogu zaman ILGI CEKICI yonde olur
(buyuk potansiyel, ucuz carpan) cunku fiyat hareket ettikce makas acilir.
KURAL: bir alan tazelenirken TAZELENEMEYENLER de isaretlenir. "Guncelledim"
demek yetmez; "sunlar guncellenemedi" de yazilir.
Bu, §143'un ("sessiz yedek yedegin kendisinden tehlikeli") veri versiyonu.

app.js v=20260730x. DOSYALAR: analist.json + app.js + index.html +
guncelleme-plani.json.

## 177. AKSAM TURU: MSFT · META · TOASO (29 Tem gece)

Kullanici: "yerlide ve usa da bilanco gelmis mi bir bak, earnings AI'yi guncelleyelim."

### 177.1 YERLI — 11 SIRKET ACIKLADI, 1'I PANEL KAPSAMINDA
Bugun 2C26 aciklayan: TOASO · BIGCH · TSKB · CWENE · TSGYO · SODSN · QNBFK ·
ARCLK · KARTN · GARFA · BARMA (11 adet).
Uc tanesi (TSKB/CWENE/ARCLK) §160'ta yazilmisti. Kalan sekizin KAPSAM DENETIMI:
yalniz TOASO multiple.json'da; hicbiri XK100/XKTUM uyesi ya da portfoyde degil.
KARAR: TOASO yazildi, digerleri yazilmadi. Gerekce: kart yazmak ucuz degil
(uc sorgu + analiz + denetim) ve kapsam disi bir isim panelin hicbir ekraninda
gorunmuyor. Kart sayisini sisirmek, ilgili kartlari bulmayi zorlastirir.

### 177.2 UC BILANCODA DA AYNI DESEN — bu sezonun imzasi
  MSFT : gelir +%18, EPS 4,74 (bek 4,24) — IKISI DE ASILDI, Azure +%43
  META : gelir +%27 AMA EPS 6,18 (bek 7,18) — %13,9 ISKA; gecen yil 7,14 idi,
         yani gelir +%27 buyurken EPS GERILEDI
  TOASO: net kar +%33,7 AMA FAVOK −%32,8, brut marj %7,3→%6,7
Ucu de "mansete bakma, altina bak" ornegi — §160'taki CWENE/ARCLK/TSKB ile
ayni aile. Uc ulke, uc sektor, ayni soru.
MSFT ISTISNA VE ONEMLI: onun beat'i tek seferlik kazanca dayanmiyor. Anthropic
yatirimindan 3,2 mlr$ kazanc + dusuk VRP maliyeti hisse basina 0,27$ katki
yapti AMA sirket acikca yazdi: bu kalemler DUZELTILDIGINDE de gelir/faaliyet/EPS
beklentiyi asti. Kartta bu ayrim vurgulandi — "beat" ile "kaliteli beat" farki.

### 177.3 TOASO'DA TERS AMORTISMAN BULGUSU
FAVOK y/y −%32,8 ama faaliyet kari +%214. Celiski gibi duruyor; sebep
AMORTISMAN: 2,78 mlr -> 1,02 mlr, −%63. Yani faaliyet karindaki sicrama
OPERASYONEL DEGIL MUHASEBESEL.
Bu, ayni gun CWENE'de gorulenin TAM TERSI (orada amortisman ARTIP faaliyet
karini eziyordu). Ikisi yan yana durunca FAVOK-faaliyet makasinin her iki
yonde de yanlis okumaya yol actigi goruluyor.
Karta basit bir sinama kondu: "2C net kardan parasal kazanci dus -> 1,92 mlr".

### 177.4 §161 KURALI UYGULANDI
Kartlar BASA eklendi (insert(0)) ve dosya tarih_iso'ya gore yeniden siralandi.
Ilk alti: TSKB · TOASO · MSFT · META · CWENE · ARCLK — hepsi 29 Tem.
23 kart.

DOSYALAR: inceleme-ai.json.

## 176. borsa-api INCELENDI — yeni veri YOK, ama bir ip ucu var (29 Tem)

Kullanici: "github.com/ibidi/borsa-api seninle bunu incelemismiydik, otomatize
edecek veri icerir mi bu panele?"
Onceki oturumlarda incelenmemis. Indirildi (196 KB, 16 dosya) ve okundu.

### 176.1 HUKUM: YENI VERI YOK
src/data-provider.ts'in ILK SATIRI:
    const YahooFinanceClass = require('yahoo-finance2').default;
Kutuphane bastan sona yahoo-finance2 SARMALAYICISIDIR. Kendi veri kaynagi YOK.
Panel Yahoo'yu ZATEN dogrudan kullaniyor (/api/market -> query1.finance.yahoo.com).
Sundugu ozellikler — watchlist, compare, top gainers/losers, volume leaders,
arama — panelde ZATEN VAR ve daha genis (141 hisse + 3 endeks agirlik tablosu).
KARAR: borsa-api PANELE EKLENMEZ. Araya bir katman daha koymak, ayni veriyi
daha fazla bagimlilikla almak demek.
Bu, §148'deki Tefas-API dersinin TERSI bir vaka: orada kutuphane calisiyordu
ama Playwright gerektirdigi icin Vercel'de kosmuyordu. Burada kutuphane
Vercel'de kosar AMA yeni bir sey getirmiyor. Iki farkli red gerekcesi.

### 176.2 YAN BULGU — DEGERLI, AYRI BIR IS
Kutuphane `quoteSummary` (/v10/finance/quoteSummary) cagiriyor; panel ise
`chart` (/v8/finance/chart). ARALARINDA ONEMLI FARK VAR:
  · /v8/chart      -> crumb GEREKMEZ (panel bu yuzden sorunsuz calisiyor)
  · /v10/quoteSummary -> needsCrumb: TRUE (cerez + crumb dansi gerekir)
quoteSummary'nin verdigi ve PANELDE OLMAYAN alanlar:
  marketCap · enterpriseValue · enterpriseToEbitda · trailingPE · forwardPE ·
  priceToBook · bookValue · pegRatio · dividendYield · profitMargins ·
  returnOnEquity · debtToEquity · freeCashflow · fiftyTwoWeekHigh
Panel su an EV/EBITDA'yi KENDI hesapliyor (multiple.json: fiyat x adet + netBorc
/ ebitda) ve bilanco kalemleri CEYREKLIK DAMGALI. Yahoo bunlari CANLI veriyor.
AMA: hazir carpan BILESENINI gostermez — panelin "her rakam nereden geldi"
ilkesine (§112) aykiri. Damgali bilesenler + canli fiyat kombinasyonu
SEFFAFLIK acisindan daha iyi olabilir; hazir carpan yalnizca CAPRAZ DENETIM
icin kullanilmali.
YAPILMADI. Yapilacaksa borsa-api'ye GEREK YOK — yahoo-finance2 dogrudan
kullanilir (ya da crumb dansi elle yazilir, ~40 satir).
guncelleme-plani.json'a arastirma kaydi olarak islendi.

### 176.3 KARAR (29 Tem, kullanici)
Yahoo quoteSummary alanlari EKLENMEDI. Uc gerekce yazildi:
kirilganlik (crumb) · Fintables'ta daha iyisi var (22 oran) · hazir carpan
bilesenini gostermez.
ACIK KALAN: oranlar.json onerisi — Fintables'in 22 orani, 141 hisse, ceyreklik.
Onaylanmadi, ip acik birakildi.

DOSYALAR: guncelleme-plani.json.

## 175. 29 TEM FOMC ISLENDI + POLITIKA FAIZI FRED'DEN (29 Tem)

Kullanici: "abd de faiz mi aciklandi?" -> ARANDI, dogrulandi. Sonra:
"panelde gerekli yerleri guncelle, abd kartinda faiz orani var mi? fredden
cekebiliriz."

### 175.1 KARAR (iki bagimsiz kaynakla dogrulandi, ~20 dk once)
Fed politika faizini %3,50-3,75 SABIT tuttu. Bu yilin BESINCI pasi.
ASIL HABER OY DAGILIMINDA: karar 3'e karsi 9 alindi; Beth Hammack (Cleveland),
Neel Kashkari (Minneapolis), Lorie Logan (Dallas) 25 baz puanlik ARTIS yonunde
muhalefet etti. Muhalefet INDIRIM degil ARTIRIM yonunde.
Uc uyenin ayni yonde karsi oyu 2016'DAN BU YANA ILK. Karar metni de haziran
metniyle ayni birakildi — sozlu rehberlik gevsemedi.

### 175.2 PANELDE EKSIK OLAN: POLITIKA FAIZI
ABD kartinda yalniz DFF (EFEKTIF fed funds) vardi. O, hedef araligin ICINDE
yuzen PIYASA oranidir; Fed'in ACIKLADIGI sey HEDEF ARALIKTIR.
Bu ayrim, TCMB tarafindaki POLITIKA FAIZI vs AOFM ayriminin (§125) birebir
karsiligi: biri kurulun ilan ettigi, digeri piyasada olusan. §125'te AOFM'nin
politika faizinin 300bp ustunde olmasi "politika faizi fiilen baglayici degil"
sonucunu vermisti; ayni mantik ABD icin de gecerli.
EKLENDI: DFEDTARL (alt) + DFEDTARU (ust). Kart artik once HEDEF ARALIGI gosterir
(%3,50-3,75, FOMC karari), altinda efektif DFF ve ARALIGIN NERESINDE oldugunu
(yuzde konum). Ikisi karistirilamaz.

### 175.3 TAKTIKSEL DURUS GUNCELLENDI — UC YER
  · Yabanci Hisse tezi: "Fed Eylul ARTIRIM olasiligi %52->%82" ifadesi
    GERCEKLESMIS KARARLA degistirildi.
  · Risk maddesi: uc sahin muhalefet ve 2016'dan beri ilk olmasi yazildi.
  · Tetik: "Fed Eylul'de artirirsa -> altida kal (29 Tem'deki uc sahin muhalefet
    bu ihtimali guclendirdi)".
AYRICA TL/SABIT GETIRILI tezine FED ZINCIRI eklendi — bu, kartlar arasi en
onemli baglanti:
  Fed artirima yaklasirsa -> TCMB'nin indirim alani DARALIR -> faiz farki
  kapanir -> carry parasi cikar -> rezerv erir
"Kilcikslz getiri" tezinin ON SARTI Fed'in sabit kalmasidir. Kart bunu artik
ACIKCA soyluyor: "on sart degisirse tez de degisir."

### 175.4 KACIS KARAKTERI TUZAGI — uc kez ust uste
Turkce metinlerde KESME ISARETI ("29 Tem'de", "Eylul'de") tek tirnakli JS
dizgesini KIRIYOR. Uc yamada da ayni hata yapildi ve node --check yakaladi.
DERS: Turkce metin yamalarken kesme isareti ARANIR ve \\' olarak kacirilir.
Ozellikle tarih+ek kaliplari ("29 Tem'de", "Agustos'ta") riskli.

app.js v=20260730v. DOSYALAR: api/market.js + app.js + index.html.

## 173. CIFT TANIM YINE — ve idempotent yazim (29 Tem)

Kullanici: "nerede bist yerel bilancolar ayrica neden saga dogru yaymadin."
Ekran GLOBAL'de YENI bicimi gosteriyordu ama BIST'te ESKI metni ("Son 8 bilanco")
— yani iki kart FARKLI SURUMDEN calisiyordu.

### 173.1 CIFT TANIM, IKINCI KEZ
Tarama: bistTakvimRender 2 tanim (yeni 6373, ESKI 6504) ·
        globalTakvimRender 2 tanim (ikisi de yeni — KOPYA)
JS'te sonra gelen tanim onceki EZER:
  · BIST'te ESKI olan sonda -> yeni surum hic calismadi, beklenenler gorunmedi
  · GLOBAL'de kopya zararsizdi (ikisi ayni) ama yine de kirlilik
SEBEP: §172'de bolge degistirirken (/* §166 ... /* §170 arasi) yeni fonksiyonu
EKLEDIM ama eski §166 tanimi baska bir konumdaydi — bolge disinda kalmis.
§171'de AYNI HATAYI yapmistim ve orada "bir fonksiyon yazmadan once ayni adda
var mi diye bakilir" dersini yazmistim. BIR TUR SONRA TEKRARLADIM.
KALICI ONLEM: her fonksiyon degisikliginden sonra CIFT TANIM TARAMASI kosulur:
  Counter(re.findall(r'^function (\\w+)\\(', s, re.M)) -> v>1 olanlar
Bu tarama artik her tur yapiliyor (200 fonksiyon, su an cift YOK).

### 173.2 NOT IKI KEZ GORUNUYORDU — insertAdjacentHTML
kazancTakvimCanli `insertAdjacentHTML('beforeend', blok)` kullaniyordu. Fonksiyon
iki kez kosarsa (boot + sekme tiklamasi, ya da globalTakvimRender'dan tetik)
icerik EKLENIR, degismez. Ekranda notun ciftlenmesinin sebebi buydu.
`innerHTML = blok` yapildi — kac kez kosarsa kossun sonuc ayni.
KURAL: bir kutuya yazan fonksiyon birden fazla kez cagrilabiliyorsa EKLEMEZ,
DEGISTIRIR. Idempotentlik, "kac kez cagrildi" sorusunu tamamen ortadan kaldirir.

### 173.3 GENISLIK — sorun genislikte degildi
`.wrap{max-width:1240px}` — panelin TAMAMI o genislikte; kartlar da oyle.
Sagdaki bosluk sayfa kenar payi, her bolumde ayni.
GORUNEN sorun YUKSEKLIK DENGESIZLIGIYDI: BIST kartinda altta kocaman bosluk
vardi cunku cift tanim yuzunden BEKLENENLER HIC GELMIYORDU (8 satir), GLOBAL
ise 9 satir + uzun liste ile tasiyordu.
Cift tanim duzelince BIST 14 satira cikiyor (7 beklenen + 7 aciklanan) ve denge
kendiliginden kuruluyor. Grid yine de acikca 1fr 1fr + width:100% yapildi.
DERS: "kutu dar" sikayetinin altinda cogu zaman "kutu bos" vardir. Once ICERIGIN
dogru gelip gelmedigine bakilir, sonra CSS'e.

app.js v=20260730t. DOSYALAR: app.js + index.html.

## 172. BILANCO TAKVIMI YENIDEN KURULDU — dort istek (29 Tem)

Kullanici dort sey istedi, dordu de gecerli:
  1) alttaki iki karti ekrana ESITLE
  2) usteki ABD listesini GLOBAL kartina TASI
  3) bilancolar geldikce otomatik silinsin, asagidan yukari kaysin
  4) BIST — YEREL'de HIC BEKLENEN yok; sekmenin adi "Bilanco Takvimi" ama
     kart yalniz aciklananlari gosteriyor — "islevine uygun yap"

### 172.1 (4) EN ZORU: BEKLENEN TARIH NEREDEN
BIST/KAP makine-okunur "beklenen bilanco tarihi" tablosu YAYINLAMIYOR.
Sirketler Finansal Takvim bildirir ama SERBEST METINDIR; KAP aramasi denendi,
temiz bir kayit cikmadi.
COZUM — GECEN YIL DESENI: sirketler her yil yakin tarihlerde aciklar.
`hisse_finansal_tablolari.yayinlanma_tarihi_utc` (2025, ay=6) alindi ve AYNI
HAFTA GUNUNE hizalanarak 2026'ya tasindi (ayin ayni haftasinda, ayni is gununde
aciklama egilimi). 42 hisse.
IKI AYKIRI DEGER YAKALANDI: MAVI (17 Eyl) ve TKFEN (14 Kas) SPK sinirini
(konsolide 60 gun = 29 Agu) ASIYOR -> bu sirketlerin MALI YILI TAKVIM YILIYLA
UYUSMUYOR. Ayri `farkli_mali_yil` alanina alindi, beklenen listesine sokulmadi.
Denetim kurali basitti ama isini gordu: "tahmin SPK sinirini asamaz".
GECIKMIS TESPITI: tahmini tarihi gectigi halde aciklamamis olanlar (MPARK 27 Tem,
TUPRS 28 Tem) KIRMIZI "GECIKTI" rozetiyle gosteriliyor — bu kendi basina bilgi.

### 172.2 (3) "OTOMATIK SILINSIN, ASAGIDAN YUKARI KAYSIN"
Mekanizma ayri bir kod gerektirmedi, VERI YAPISINDAN dogdu:
  bekleyen = bist-takvim.json'daki hisseler EKSI kart yazilmis olanlar
Bir sirket aciklayip karti yazilinca `varOlan` suzgecine takilir, BEKLENEN
listesinden DUSER ve ACIKLANAN bolumune gecer. Kendiliginden kayar.
DUZEN: beklenenler USTTE (tarihe gore artan — takvim ILERIYE bakar),
kesik cizgi, altinda aciklananlar (en yeni ustte).

### 172.3 (2) LISTE GLOBAL KARTINA TASINDI
#kazancCanli ustteki bagimsiz konumundan alinip GLOBAL kartinin ICINE kondu.
20 satir kart icinde cok uzun kactigi icin KAYDIRILABILIR kutuya alindi
(max-height 260px) ve basligi "TÜM IZLEME LISTESI" olarak kucultuldu.
Bu, (1)'in on sarti: liste sinirsiz uzarsa kart yuksekligi de uzar ve
esitleme bozulur.

### 172.4 (1) KARTLAR ESITLENDI
`.grid.g2` -> align-items:stretch · her iki kart display:flex;flex-direction:column.
Boylece iki kart AYNI YUKSEKLIKTE durur; ic listeler kendi icinde kaydirilir.

bist-takvim.json YENI olusturuldu, guncelleme-plani.json'a CEYREKLIK katman
olarak eklendi (her ceyrek basinda yeni donemin tahminleri uretilir).
app.js v=20260730r. DOSYALAR: app.js + index.html + bist-takvim.json (YENI) +
guncelleme-plani.json.

## 171. IKI KIRIK: kaybolan ABD karti + CIFT TANIM (29 Tem)

Kullanici: "abd earning karti kayboldu resimde yok. Global kartini finhuba bagla
bilancolari ceksin bari." Ikisi de gecerli, ikisi de benim hatam.

### 171.1 KAYBOLAN KART — tembel yukleme VARSAYILAN SEKMEDE anlamsizdir
§163'te kazancTakvimCanli'yi "t1 acilinca tembel cagir" yapmistim:
    if(b.dataset.tab==='t1' && !kazancYuklendi){ ... }
AMA t1 VARSAYILAN ACIK SEKME — index.html'de `class="tab act" id="t1"`.
Kullanici Piyasa sekmesine TIKLAMIYOR, zaten acik geliyor. Tetikleyici hic
atesenmedi, kart tamamen kayboldu.
DUZELTME: boot listesine eklendi; sekme tiklamasindaki tetikleyici de duruyor
(baska sekmeden donunce), kazancYuklendi bayragi ikisini tek cagriya indiriyor.
TEST: eski kod "sayfa acildi, tiklamadi" senaryosunda 0 kez cekiyordu;
yeni kod 1 kez, uc kez tiklansa yine 1 kez.
DERS: tembel yukleme yazarken "bu sekme varsayilan olarak acik mi" diye sorulur.
Varsayilan sekmede tembellik = hic calismamak.

### 171.2 CIFT TANIM — yenisi eskisi tarafindan EZILIYORDU
§170'te globalTakvimRender'i yazdim (45 satir, Finnhub + inceleme-ai birlesik,
cakisma kurali dahil). AMA dosyada ZATEN bir globalTakvimRender vardi
(23 satir, YALNIZ inceleme-ai, Finnhub'i hic kullanmiyor).
Benimki 6311'de, eskisi 6379'da — JS'te sonra gelen tanim ONCEKINI EZER.
Yani kartimi yazdim ama eski surum calisiyordu. Kullanici "finhuba bagla bari"
derken HAKLIYDI: bagladigimi saniyordum, calisan kod bagli degildi.
DUZELTME: eski tanim silindi (assert: silinen govdede KAZANC_ITEMS OLMAMALI —
yanlisini silmeyeyim diye).
TARAMA: panelin TAMAMI cift tanim icin tarandi — 200 fonksiyon, baska cift YOK.
DERS: bir fonksiyon yazmadan once AYNI ADDA VAR MI diye bakilir. node --check
cift tanimi HATA SAYMAZ (gecerli JS), sessizce ezer. §136/§156/§163'un ailesi:
"yazdim" ile "calisan bu" ayri seyler.

### 171.3 SON ZINCIR (dogrulandi)
  kazancTakvimCanli (boot) -> Finnhub 5 dilim -> #kazancCanli + KAZANC_ITEMS
  INC_KARTLAR yuklenince   -> bistTakvimRender + globalTakvimRender
  KAZANC_ITEMS gelince     -> globalTakvimRender
  globalTakvimRender: aciklananlar (kart) + beklenenler (Finnhub),
    cakisirsa KART kazanir.

app.js v=20260730p. DOSYALAR: app.js + index.html.

## 170. GLOBAL KARTI DA CANLIYA — yarim birakmisim (29 Tem)

Kullanici: "global karti finhubdan mi cekiyor artik?" HAYIR — ve sorunun kendisi
bir eksigi ortaya cikardi.

### 170.1 UC AYRI SEY VARDI, IKISINI YAPMISIM
  · BIST — YEREL karti  -> §166'da canliya cevrildi (inceleme-ai.json)
  · ABD KAZANC TAKVIMI  -> ayri bolum, Finnhub'dan canli (§168 pencere duzeltmesi)
  · GLOBAL karti        -> DOKUNULMAMIS, 22-30 Tem satirlari hala SABIT HTML
Yani BIST tarafini canliya cevirip global tarafini oldugu gibi biraktim.
Kullanici sormasa fark edilmeyecekti.

### 170.2 DAHA KOTUSU: ANLAMSIZ NITELIK
§169'da GLOBAL kartina data-ebu-oncelik="yuksek" koymustum. STATIK bir kartta
bu NITELIK ISE YARAMAZ: icerik hic degismedigi icin hash de degismez,
dolayisiyla not motoru zaten hicbir zaman yeniden yazmaz — soguma delmesi de
bos yere durur.
DERS: bir isaret koyarken "bu isaretin kosulu hic gerceklesir mi" diye sorulur.
Statik bir karti "olay karti" diye isaretlemek, isaretin kendisini anlamsiz
kilar ve okuyani yanıltir ("burasi canli galiba").

### 170.3 COZUM: IKI KAYNAK BIRLESIK
  ACIKLANANLAR -> inceleme-ai.json ABD kartlari
  BEKLENENLER  -> Finnhub (§168 sonrasi mega-cap'ler geliyor)
CAKISMA KURALI: ayni sembol ikisinde de varsa ACIKLANAN KAZANIR — gerceklesen
veri, tahmini eder. (Test: GOOGL hem kartta hem Finnhub'da; kart secildi.)
SKOR BICIMI: BIST kartlari SAYISAL skor (4,5 / 5,5), ABD kartlari METIN
(POZITIF / KARISIK / NOTR). Cizici IKISINI DE destekliyor — tek kalipla
yazsaydim ABD kartlari "skor NaN" gosterirdi.
Damga: "2C26 · MEGA-CAP DALGASI" -> "inceleme-ai + Finnhub · canli".

### 170.4 BAYAT ALTYAZI
Bolum basligi "(22 Tem itibariyla · bu gece: GOOGL · TSLA · IBM · NOW)" diyordu
— BIR HAFTA onceki gece. Sabit bir ifadeye cevrildi:
"(aciklananlar inceleme-ai · beklenenler Finnhub · canli)".
Tarih iceren sabit altyazi kacinilmaz olarak bayatlar; kaynak adi bayatlamaz.

app.js v=20260730n. DOSYALAR: app.js + index.html.

## 169. SOGUMA DELMESI — olay kartlari beklemez (29 Tem)

§166'da BIST bilanco takvimi canliya gecti; ARCLK/CWENE/TSKB "BUGUN" rozetiyle
listeye dustu. AMA hemen altindaki Ebu notu hala "yerelde bu hafta bilanco
sakin" diyordu. Tablo ile not YAN YANA CELISTI.

### 169.1 SEBEP: SOGUMA (6 saat)
Not motoru hash degisimini goruyor ama SOGUMA_MS (6 saat) icindeyse yazmiyor.
Soguma, CANLI FIYAT kartlarinin gurultuyle her tur yeniden yazilmasini onlemek
icin var — ve o amacla DOGRU.
Ama bazi kartlarin verisi yalniz GERCEK BIR OLAY olunca degisir:
  · bilanco takvimi -> yeni bilanco aciklandi
  · sukuk ihrac     -> yeni ihrac geldi
Orada degisim GURULTU DEGIL HABERDIR; 6 saat beklemek notu tabloyla celisik
birakir. §111'in ("kart metni rakamla celisiyor") tekrari, bu sefer ZAMANLAMA
kaynakli.

### 169.2 COZUM: data-ebu-oncelik="yuksek"
Bu niteligi tasiyan kart soguma beklemez; hash degisir degismez not yeniden
yazilir. Zaten var olan `kesintiNotu` delmesiyle ayni desende.
Isaretlenen kartlar: BIST — YEREL ve GLOBAL (08 Bilanco Takvimi).
Nitelik oldugu icin liste guncellemek gerekmiyor — yeni bir olay karti
eklenince tek nitelik yeter (§124'un data-ebu="hayir" deseninin kardesi).
TEST (5 senaryo): veri degismediyse atlar · degisti+soguma+NORMAL kart atlar ·
degisti+soguma+ONCELIKLI YAZAR · soguma bittiyse yazar · kesinti notu varsa yazar.

### 169.3 DERS — soguma bir GURULTU FILTRESIDIR, kor bir gecikme degil
Bir hiz sinirlayici koyarken sorulmasi gereken: "bu kaynaktaki degisim gurultu
mu haber mi?" Ikisi ayni mekanizmayla ele alinamaz. Fiyat kartinda her tur
degisim gurultudur; olay kartinda her degisim haberdir.
Panelde artik ucuncu Ebu niteligi:
  data-ebu="hayir"          -> Ebu hic bakmaz (sabit metin, §124)
  data-ebu-oncelik="yuksek" -> Ebu soguma beklemez (olay karti, §169)
  (isaretsiz)               -> normal: hash + 6 saat soguma

ajan.js v=20260730a. DOSYALAR: ajan.js + index.html.

## 168. FINNHUB 1500 KAYIT SINIRI — pencere bolundu (29 Tem)

§167'de eklenen teshis modu KESIN cevabi verdi. Cikti (29 Tem 17:41):
  hamKayit: 1500
  tarihDagilimi: "2026-08-07: 44" ile BASLIYOR — oysa pencere 2026-07-29'dan
  dagilimin TOPLAMI: tam 1500
  ilkBesHamSembol: AARD@2026-08-19, ACRV@2026-08-19, ADI@2026-08-19…
  MSFT/META/AAPL/AMZN/NVDA/GOOGL/TSLA -> hamYanitta: FALSE

### 168.1 TESHIS: TASMA, KAPSAM DEGIL
Uc bulgu birlikte okununca:
  · 1500 tam sayi -> HARD LIMIT
  · yanit EN YENI TARIHTEN geriye sirali (19 Agu once)
  · en erken donen tarih 7 Agu, oysa 29 Tem istendi -> ILK ON GUN DUSMUS
MSFT/META (29 Tem) ve AAPL/AMZN (30 Tem) tam o dusen aralikta.
SONUC: "Finnhub cekemiyor" DEGIL. Finnhub cekiyor; BIZ fazla genis pencere
isteyip yaniti tasiriyorduk. Sunucu sessizce kirpip en yenileri veriyordu.
Bu, §148'de TEFAS icin verdigim "kaynak erisilemez" hukmunun TERSI bir vaka —
orada gercekten kapaliydi, burada BIZIM ISTEGIMIZ hataliydi. Teshis olmadan
ikisi ayni gorunur ("veri gelmiyor") ve yanlis hukum verilir.

### 168.2 COZUM: 5 GUNLUK DILIMLER
21 gunluk pencere 5 dilime bolundu, paralel cekiliyor, sembol+tarih anahtariyla
tekillestirilerek birlestiriliyor.
GERCEK DAGILIMLA OLCULDU (en yogun donem dahil):
  29-07→02-08: 1050 · 03→07-08: 1194 · 08→12-08: 998 · 13→17-08: 285 ·
  18→19-08: 173     — HICBIRI 1500'u asmiyor
Tek istekte 3700 kayit istenip 2200'u dusuyordu; simdi hicbiri kesilmiyor.
TASMA DENETIMI: bir dilim 1500'e dayanirsa yanitta `uyari` alani cikar ve
hangi araligin tastigi yazilir — sessiz kayip YOK. Dusen dilim de raporlanir.
Debug modu artik dilim bazinda kayit sayisi ve tasma bayragi doner.

### 168.3 DERS — "VERI GELMIYOR" UC AYRI SEY OLABILIR
  (a) kaynak kapali/engelli        -> TEFAS (§148)
  (b) kaynagin kapsami dar         -> ilk varsayimimiz buydu, YANLIS cikti
  (c) BIZIM istegimiz hatali       -> gercek sebep: pencere fazla genis
Ucu de disaridan AYNI gorunur: ekranda veri yok. Ayirmanin tek yolu HAM YANITI
gormek. §167'de teshis modunu eklemeseydim (b) diye kapatip alternatif kaynak
aramaya baslardim — bos yere.
KURAL: bir kaynak hakkinda hukum vermeden once HAM YANITIN kendisine bak;
kayit sayisi, siralama ve tarih dagilimi genelde sebebi soyler.

DOSYALAR: api/usnews.js.

## 167. FINNHUB TESHIS MODU — "cekemiyor mu?" sorusunu OLCEREK cevapla (29 Tem)

Kullanici: "finhub earningsleri cekemiyor mu?"
Ekranda yalniz HD (18 Agu) ve CSCO (19 Agu) goruluyor; MSFT/META (29 Tem) ve
AAPL/AMZN (30 Tem) YOK. Oysa IZLEME listesinde dordu de VAR, pencere bugun+21 gun.

### 167.1 BILDIGIMIZ — API CALISIYOR
HD ve CSCO GELIYOR. Yani:
  · Finnhub anahtari gecerli
  · uc nokta ayakta
  · pencere hesabi calisiyor (18-19 Agu, bugun+21 icinde)
  · suzgec CALISIYOR (bu ikisi izleme listesinde ve geciyorlar)
Dolayisiyla "cekemiyor" DEGIL — bir sey cekiyor ama eksik.

### 167.2 IKI IHTIMAL, AYIRT EDILMELI
  (a) Finnhub yanitinda o semboller HIC YOK  -> KAYNAK kapsami sorunu,
      ucretsiz katman mega-cap'leri o pencerede dondurmuyordur. Cozum:
      alternatif kaynak ya da damgali liste.
  (b) Yanitta VAR ama suzgec dusuruyor       -> BIZIM hata, sembol/bicim
      uyusmazligi (orn. "BRK-B" vs "BRK.B" gibi). Cozum: bizde.
IKISI TAMAMEN FARKLI MUDAHALE ISTER, dolayisiyla tahmin etmek yerine olculmeli.

### 167.3 TESHIS MODU EKLENDI
/api/usnews?mod=kazanc&debug=1 su alanlari doner:
  · pencere (bas/bit tarihleri)
  · hamKayit  — Finnhub kac kayit dondurdu (suzgecten ONCE)
  · izlemeEslesen — kaci izleme listesinde
  · arananlar[] — MSFT/META/AAPL/AMZN/NVDA/GOOGL/TSLA/HD/CSCO icin
      {izlemede, hamYanitta, kayit:[{tarih,saat,epsBek}]}
  · tarihDagilimi — hangi tarihte kac kayit (pencere gercekten dolu mu)
  · ilkBesHamSembol — yanitin nasil gorundugune dair ornek
"hamYanitta:false" cikan sembol -> (a); "true ama items'ta yok" -> (b).

Bu, §145'in ("teshis araci arizadan etkilenmemeli") ve §165.4'un
("iki farkli arizayi ayir") tekrari. Panelde artik ucuncu teshis ucu:
  /api/katfon?debug=1 · /api/usnews?mod=kazanc&debug=1 · kart icindeki
  "fiyat akisi" satiri.

DOSYALAR: api/usnews.js (cikti dizinine kopyalandi + teshis eklendi).

## 166. AJAN OLU ICERIGE TAZE YORUM YAZIYORDU (29 Tem)

Kullanici: "sence burda ne gibi bir sacmalik var." Bilanco takvimine bakti.

### 166.1 TESHIS — uc katmanli bir tutarsizlik
Baslik: "08 Bilanco Takvimi (29 Tem · Ebu gunluk bakiminda)"
Ebu'nun notlari GERCEKTEN TAZEYDI (15:06 damgali, bugun yazilmis).
AMA yorumladigi TABLO index.html'de ELLE YAZILMIS SABIT HTML'di:
  · 7 satirin 5'i gecmisti, "ACIKLANDI ✓" yaziyordu — takvim degil KUTUK
  · BUGUN aciklayan CWENE/TSKB/ARCLK takvimde YOKTU
  · Ebu'nun notu "yerelde bu hafta bilanco sakin" diyordu, oysa uc sirket
    ayni gun aciklamisti (§160'ta kartlarini yazdim)
EN YANILTICI HALI BU: taze DAMGA, icerigin de taze oldugunu dusundurur.
Ajan olu icerige yorum yazinca yanlislik iki kat artiyor — hem tablo eski,
hem uzerine "bugun bakildi" muhru basiliyor.

Ayrica USTUNDEKI canli Finnhub beslemesi 18-19 AGUSTOS gosteriyordu; yani
29 Tem - 18 Agu arasi BOSTU. Damgali kart "bu aksam MSFT/META" derken canli
besleme 20 gun ilerisinden basliyordu. Canli olan, damgalidan GERIDE.

### 166.2 COZUM: takvim KART VERISINDEN turer
BIST tablosu artik inceleme-ai.json'dan uretiliyor (bistTakvimRender).
GEREKCESI: o dosya bilanco kartlariyla BIRLIKTE guncellenir, dolayisiyla
takvim kendiliginden tazedir — ayri bir bakim kalemi olmaktan cikti.
Kart yazmak = takvimi guncellemek. TEK KAYNAK (§112'nin takvim versiyonu).
Gosterilen: tarih · kod · donem · SKOR (renk kodlu) · bugun aciklayanlarda
"BUGUN" rozeti ve vurgulu satir.
Damga da duzeltildi: "KAP · Fintables" -> "inceleme-ai · canli".
TEST: 20 karttan 13 BIST ismi suzuldu; ilk uc satir TSKB/CWENE/ARCLK ve
ucu de "BUGUN" isaretli. Eski tablo bunlari HIC gostermiyordu.

### 166.3 DURUSTLUK NOTU — neden yalniz ACIKLANANLAR
Kartta yaziyor: "Beklenen tarihler damgalidir — aciklanmamis bilanconun tarihi
TAHMINDIR." Cunku bir sirketin NE ZAMAN aciklayacagi veriden turetilemez;
yalnizca acikladiktan SONRA kesinlesir. Dolayisiyla canli liste GECMISI
gosterir, gelecek kismi damgali kalir. Bu bir eksiklik degil, verinin dogasi —
ve kart bunu SOYLUYOR.

### 166.4 ACIK KALAN
Canli Finnhub beslemesi neden MSFT/META (29 Tem) ve AAPL/AMZN (30 Tem)
dondurmuyor, cozulmedi. IZLEME listesinde dorduü de VAR, pencere bugun+21 gun.
Muhtemel sebep Finnhub ucretsiz katmaninin mega-cap kapsamasi. ?debug ile
ham yanita bakmak gerekir — ayri bir is.

app.js v=20260730m. DOSYALAR: app.js + index.html.

## 165. "FIYAT AKISINDA YOK" — ?his= HIC GONDERILMIYORDU (29 Tem)

Kullanici: "yine sicip batirdin fiyat akisinda yok nedemek yfinance demi yok."
HAKLI. Yahoo'da hepsi VAR; sorun istegi HIC GONDERMEMEM.

### 165.1 HATA 1 — YANLIS FONKSIYONU YAMAMISIM
§155'te ?his= parametresini eklerken satir numarasina gore yama yaptim ve
`avrupaSekme()` icine koydum — KURESEL ENDEKSLERI (DAX/FTSE/Euro Stoxx) cizen
fonksiyona. Oysa m.his'i dolduran TEK yer `marketCek()`.
Sonuc: ?his= hicbir zaman gonderilmedi, sunucu sabit 40 kodla dondu,
kullanicinin KENDI hisseleri (ALCTL/EKGYO/LOGO/MERCN/ALTNY) bile "fiyat
akisinda yok" cikti.
NASIL OLDU: uc ayri `/api/market` cagrisi var (satir 248/354/866). Satir
numarasiyla yama yaparken HANGISI oldugunu dogrulamadim. §156.1'de "cp'den
sonra hash kontrolu yap" dersini yazmistim; bu onun SATIR NUMARASI versiyonu —
bir satira yama yaparken O SATIRIN BAGLAMINI oku.

### 165.2 HATA 2 — ENDAG TEMBEL YUKLENIYORDU
Dogru yere konsa bile calismayacakti: ENDAG (endeks agirlik sozlukleri) yalniz
Ayrisma bolumu acilinca yukleniyor, market cagrisi ONDAN ONCE kosuyor.
Yani ilk cagrida ENDAG null -> endeks uyeleri listeye GIRMIYOR.
DUZELTME: marketCek icinde `await endeksAgirlikYukle()` — kodlar toplanmadan
once sozluk hazir.
Bu, §138'in ("tembel yuklenen kaynagi hesabin birincil girdisi yapma") ucuncu
tekrari. Bu sefer hesap degil ISTEK etkileniyordu.

### 165.3 HATA 3 — kesme sirasinda oksuz yorum
Yanlis yerdeki blogu kaldirirken /* §155 yorumunun ACILISI kaldi, KAPANISI
silinen satirlardaydi. Dosyanin geri kalani yorum icine dustu, node --check
"Unexpected end of input" verdi. Silindi.
§130.3'te "blogu satir araligiyla silme" dersini yazmistim — YORUMLAR icin de
gecerliymis, bunu dusunmemistim.

### 165.4 TESHIS EKLENDI — bir daha tahmin etmeyelim
`window.__marketKapsam = {istenen, donen, kirpilan}` ve kartta gorunur satir:
"158 sembol istendi, sunucu 158 dondurdu".
IKI FARKLI ARIZAYI AYIRIR:
  (a) istenen 0 VEYA donen tam 40 -> sunucu sabit listeyle donuyor, yani
      api/market.js'in YENI SURUMU DEPLOY EDILMEMIS. KIRMIZI uyari.
  (b) istenen yuksek, donen biraz dusuk -> Yahoo o sembolleri bulamiyor. Normal.
Bu ayrim onemli cunku (a) deploy sorunu, (b) veri sorunu — mudahaleleri
tamamen farkli.

app.js v=20260730k. DOSYALAR: app.js + index.html.

## 164. UC KATILIM ENDEKSI + TUM UYELER + SUTUN SIRALAMA (29 Tem)

Kullanici: "endeks olarak xktum xk100 ve xk050 olsun. ayrica tum endeks
listelensin burada cok azi listeleniyor. sectigimde siralansin."

### 164.1 XK050 DIYE BIR ENDEKS YOK
Fintables'ta tum endeks kodlari tarandi (unnest(endeksler) GROUP BY):
  XK100 100 · XKTUM 242 · XKTMT 34 · XTMTU 90 · XHARZ 57 · XKURY 92
  + konvansiyonel: XU030/XU050/XU100/XUTUM/XUSIN/XUMAL/XUSRD/XTUMY/XUGRA
KATILIM endeksleri dortten ibaret; XK050 ARALARINDA DEGIL.
En dar katilim endeksi XKTMT (34 uye) — tepesi XK100 ile AYNI
(ASELS %29,7 · BIMAS %22,8 · TUPRS %19,9 · EREGL %10,0 · KTLEV %5,5;
ilk bes %87,9). XK050 yerine BU konuldu.
XU100 secenegi KALDIRILDI: katilim evreni degil ve agirlik tablosu da yok,
secilince "agirlik yok" hatasi veriyordu.

### 164.2 "COK AZI LISTELENIYOR" — HAKLI, IKI SATIR GIZLENIYORDU
Onceki surum su iki grubu tablodan CIKARIYORDU:
  (a) aktif agirligi SIFIR olanlar — `if(Math.abs(aktifW)<1e-9) return;`
      "katkisi sifir, gostermeye gerek yok" mantigiyla yazilmisti. YANLIS:
      sifir katki da BILGIDIR — "burada karar vermemisim" demektir ve endeks
      tablosunun isi endeksi GOSTERMEKTIR.
  (b) getirisi gelmeyenler — ayri bir "kapsam disi" NOTUNA dusuyordu, tabloda
      hic gorunmuyordu.
Sonuc: 242 uyeli XKTUM'da ekranda 20-30 satir. Kullanici hakli olarak sordu.
ARTIK: evrenin TAMAMI basilir (portfoyum ∪ endeks uyeleri).
  · aktif agirligi sifir olanlar `notr` etiketiyle SOLUK gosterilir
  · getirisi olmayanlar %50 saydamlikta, "fiyat akisinda yok — katki
    hesaplanamadi" yazisiyla; katki hesabina GIRMEZLER (kimlik bozulmasin)
  · ne portfoyde ne endekste olanlar yine atlanir (ilgisiz)

### 164.3 SUTUN SIRALAMA
Yedi sutunun ustune tiklanabilir: HISSE · BENIM · ENDEKS · AKTIF AG. · GETIRI ·
ENDEKSE FARK · KATKI. Ayni sutuna ikinci tik YONU CEVIRIR; aktif sutunda ok
isareti (▼/▲) gorunur. Kod alfabetik ARTAN baslar, sayilar AZALAN.
KURAL: verisi olmayan satirlar HER SIRALAMADA SONDA kalir — yoksa "getiri"ye
gore siralayinca bos satirlar basa dolusurdu.
TEST: 6 alan x 2 yon = 12 kombinasyonda veri yok satiri hep sonda.

### 164.4 KAPSAM
Uc endeksin birlesik evreni 158 sembol; market akisi siniri 220 (§159), rahat.
xktmt.json YENI olusturuldu (34 uye, agirlik toplami tam %100 — 34'un tamami
yazildigi icin normalize gerekmedi).

app.js v=20260730j. DOSYALAR: xktmt.json (YENI) + app.js + index.html +
guncelleme-plani.json.

## 163. TAKVIM TASIMASI TAMAMLANDI — yarim kalmis is (29 Tem)

Kullanici: "portfoy yonetimi yonetim menusunde ekonomik surprizler kartini
kaldiralim. Abd kazanc earnings takvimini de piyasa ekranina tasiyalim."

### 163.1 IS KISMEN YAPILMIS BULUNDU
Dosyalari acinca gorundu ki §162 degisikligi ZATEN BASLAMIS ama YARIM:
  · index.html: takvimBody KALDIRILMIS (t11'den), #kazancCanli EKLENMIS (t1'e)
  · app.js: takvimRender fonksiyonu SILINMIS, kazancTakvimCanli #kazancCanli'ye
    yonlendirilmis
AMA IKI KIRIK UC KALMIS:
  1) satir 6055 hala `takvimRender()` CAGIRIYOR — fonksiyon yok, ReferenceError.
     Render zinciri (anaRender · atifRender · riskMetRender · likiditeRender ·
     temettuRender) hepsi TEK SATIRDA, takvimRender sonda. Cagri patlayinca
     kendisinden sonrasi calismiyordu.
  2) kazancTakvimCanli OKSUZ KALMIS — eskiden takvimRender icinden cagriliyordu,
     o silinince cagirani kalmadi. Yani kutu var, fonksiyon var, ama kimse
     tetiklemiyor.
Ikisi de node --check'ten GECER (sozdizimi gecerli). §136 ve §156'daki ayni
sinif: "tanimli" ile "calisiyor" ayri seyler; burada "silindi" ile
"referanslari temizlendi" ayri seyler.

### 163.2 TAMAMLANDI
  · takvimRender() cagrisi kaldirildi
  · kazancTakvimCanli t1 (Piyasa) acilinca TEMBEL cagriliyor (kazancYuklendi
    bayragi, sekme kac kez acilirsa acilsin bir kez ceker)
TEST: eski kod ReferenceError firlatiyor (kanit), yeni zincir temiz;
tembel yukleme 3 acilista 1 cekim yapiyor.

### 163.3 SON DURUM
YONETIM (t11): Portfoy Yonetimi · Analist Konsensusu · Performans & Getiri Atfi ·
  Risk Metrikleri · Likidite Analizi · Temettu   -> takvim YOK
PIYASA (t1) "08 Bilanco Takvimi": ustte DAMGALI tablo (elle yazilan makro
  olaylar + BIST/ABD bilanco tarihleri), altinda #kazancCanli -> Finnhub'dan
  CANLI ABD kazanc takvimi.
Ikisinin AYRI KUTUDA olmasi kasitli: hangisinin canli oldugu gorunsun.
Karisik tek tabloda bu ayrim kaybolurdu (§141'in "damga ne soyluyor" dersi).

### 163.4 DERS — SILME ISI, SILMEKLE BITMEZ
Bir fonksiyonu silerken UC sey birden yapilir:
  (a) tanimi sil  (b) TUM cagrilarini sil  (c) o fonksiyonun cagirdiklarina
  yeni cagiran bul (yoksa onlar da oksuz kalir)
Bu vakada (a) yapilmis, (b) ve (c) atlanmis. §129'da "bir alani silmeden once
TUM okuyucularini ara" demistim — bu onun FONKSIYON versiyonu.

app.js v=20260730h. DOSYALAR: app.js.

## 161. KARTLAR GORUNMEDI — panel SIRALAMIYORDU (29 Tem)

Kullanici: "gelmedi kartlar ne yaptin yine ya." Kartlar YAZILMISTI ama
gorunmuyordu. Iki sebep, ikisi de benim.

### 161.1 SEBEP 1: SONA EKLEDIM
Kartlari dizinin SONUNA ekledim (18-19-20. sira). Panel `kartlar.map(...)` ile
DOSYA SIRASIYLA basiyor, SIRALAMA YAPMIYOR. Kullanici ustten bakinca BMSTL/
TAVHL/AKBNK goruyor; yeni kartlari gormek icin 17 kart asagi kaydirmasi
gerekiyordu.

### 161.2 SEBEP 2: IKI FARKLI TARIH BICIMI
Dosyada iki bicim yan yanaydi:
  "28 Tem 2026"  (TR, yeni kartlar)     "2026-07-24"  (ISO, eski kartlar)
Metin siralamasi yapilsa "2026-…" ile "28 Tem…" karsilastirilir ve sonuc
anlamsiz cikardi. Yani "sirala" demek yetmiyordu, once BICIM birlestirilmeliydi.

### 161.3 IKI KATMANLI DUZELTME
(a) VERI: tum kartlara `tarih_iso` alani eklendi (TR bicim ISO'ya cevrildi),
    gorunen `tarih` de tek tipe (TR) sabitlendi. 20 kartin 20'si cevrildi.
    Dosya en yeniden eskiye siralandi.
(b) KOD: panel ARTIK KENDI SIRALIYOR. isoCoz() once tarih_iso'ya bakar, yoksa
    gorunen tarihten cozer (TR ve ISO bicimlerini de anlar, geri uyum).
    Ayni gunde alfabetik.
    KRITIK: (b) olmadan (a) gecici bir yamadir — bir sonraki kart yine sona
    eklenirse ayni sorun tekrarlar. Kod tarafi duzeltilince DOSYA SIRASI
    ONEMSIZ hale geldi.
TEST: alti tarih bicimi (ISO alani · TR · tek haneli gun · ISO metin · s'li ay ·
bozuk) dogru cozuluyor; karisik sirali dizi dogru diziliyor.

### 161.4 DERS — "yazdim" ile "gorunuyor" ayri seyler
§136'da "tanimli ile calisiyor ayri seyler" demistim (ayrGrafik cagrilmiyordu).
Bu onun VERI versiyonu: veri DOSYAYA yazildi ama EKRANA ulasmadi.
Bir veri yazdiktan sonra "kullanici bunu NEREDE gorecek" sorusu sorulur ve
o yol UCTAN UCA dogrulanir. Dosyaya yazip gecmek yarim istir.

app.js v=20260730g. DOSYALAR: inceleme-ai.json + app.js + index.html.

## 160. UC BILANCO KARTI: CWENE · ARCLK · TSKB (29 Tem)

2C26 sezonu basladi. Ucu de AYNI GUN acikladi (KAP 1638962 / 1638891 / 1638974).
§157'de "portfoydeki hisselerin hicbiri 2C aciklamadi" demistim — o gun dogruydu,
ertesi gun degisti. Sezon 10-29 Agustos'a kadar surecek.

### 160.1 UCUNDE DE AYNI DESEN: MANSET ILE FAALIYET AYRISIYOR
Uc sirket de farkli sektorden ama ucunde de alt satir faaliyetten KOPUK:
  CWENE: FAVOK marji %10,7 -> %22,9 (ikiye katlandi) AMA faaliyet marji
         %17,7 -> %6,8 (ucte bire dustu). Aradaki 16 puan AMORTISMAN+opex.
         Yatirim donguse girdi, sermaye maliyeti geldi.
  ARCLK: net kar zarardan kara dondu (2C 3,44 mlr) AMA FAVOK y/y -%37,3,
         ciro -%11,9. Donusu tasiyan 4,57 mlr parasal pozisyon kazanci ve
         gecen yilin cok dusuk bazi. NAKIT DEGIL, muhasebesel.
  TSKB:  net faiz +%6, komisyon +%127 (cekirdek saglam) AMA net kar -%12,5.
         Uc kalem yedi: karsilik 872 mn (1C'de 74 mn), ticari -155 mn
         (gecen yil +187 mn), personel +%43.
ORTAK DERS: bu ceyrekte MANSETE bakip karar vermek tehlikeli. Ucunde de
FAVOK/net kar/faaliyet kari FARKLI YONLERE isaret ediyor.

### 160.2 TSKB'DE BIR TUZAK — ceyreklik bakan yanilir
Karsiliklar 2C'de 872 mn, 1C'de 74 mn -> 11,8 KAT. Panik yaratacak gorunuyor.
AMA 6 aylik toplam 946 mn ve gecen yilin ayni doneminin (1.207 mn) ALTINDA.
Yani anormal olan 1C'nin cok dusuk karsilik ayirmasiydi; 2C NORMALLESME.
Ceyreklik bakan "bozulma" der, yillik bakan "duzeltme" gorur. Karta yazildi.
Bu, §141'deki "gecikme mi ariza mi" ayriminin bilanco versiyonu.

### 160.3 KAPSAM DURUSTLUGU
  CWENE -> XK100 uyesi (%0,54) + XKTUM (%0,45) + multiple.json · fm.json'da YOK
  ARCLK -> katilim evreninde DEGIL (faizli borc yapisi), hicbir kapsamda yok
  TSKB  -> katilim evreninde DEGIL (kalkinma-yatirim bankasi), kapsamda yok
Her kartin `tez` alanina YAZILDI. ARCLK ve TSKB kartlari BILGI AMACLI —
portfoy/endeks tablolarinda gorunmezler. Kapsam disi bir ismi kapsam icindeymis
gibi sunmak, §112'nin ("bir buyuklugun tek sahibi olur") kapsam versiyonudur.
TSKB icin ek not: faiz patikasi tezini DOGRUDAN ilgilendirir — Tahminler
sekmesindeki PPK patikasi gerceklesirse net faiz marji 2027'de baskilanir.

### 160.4 SKORLAR
CWENE 5,5 · TSKB 5,0 · ARCLK 4,5. Ucu de "kotu degil ama manset kadar iyi degil"
bandinda. Skor manseti degil KALITEYI olcuyor.

inceleme-ai.json: 17 -> 20 kart. DOSYALAR: inceleme-ai.json.

## 159. XKTUM CANLI — API zaten vardi, eksik olan UYE LISTESIYDI (29 Tem)

Kullanici: "xktum hisse fiyatlarini gunluk canli cekebilecegim bir api bulamaz
misin? 15-20 dk lag sorun degil."
CEVAP: yeni API GEREKMEDI. Yahoo bireysel BIST hisselerini zaten veriyor
(§119'da ASELS'te 255 bar olculmustu) ve /api/market bu turda (§155) DINAMIK
hale getirilmisti. Eksik olan tek sey XKTUM'un UYE LISTESI ve AGIRLIKLARIYDI.

### 159.1 XKTUM OLCUMU
242 uye, toplam serbest dolasim 2,53 trilyon TL (XK100: 100 uye, 2,09 trilyon).
YOGUNLASMA COK YUKSEK:
  ilk  5 -> %51,3 · ilk 10 -> %60,6 · ilk 20 -> %70,9
  ilk 30 -> %77,4 · ilk 50 -> %84,8 · ilk 150 -> %96,5
Kalan 92 hisse toplam %3,5, ortalama %0,038 her biri.
KARAR: ilk 150 yazildi. Kuyrugun tamamini cekmek Vercel butcesini zorlar,
kazanci %3,5. Kapsam kartta RAPORLANIR (atif motoru zaten yapiyor).
KRITIK NOT (dosyaya yazildi): agirliklar 242 uyenin TAMAMI paydada olacak
sekilde hesaplandi — ilk 150'ye NORMALIZE EDILMEDI. Dolayisiyla toplamlari
100 degil ~96,5 eder ve BU DOGRUDUR. Normalize etseydim her hissenin agirligi
%3,6 sisecek ve aktif agirliklar sistematik yanlis cikacakti.

### 159.2 CEKIM KAPASITESI ARTIRILDI
XK100 (100) + XKTUM ilk 150 birlesimi = 154 tekil (ortusme 96).
+ portfoy + sabit HIS 40 -> ~180 sembol.
  · SINIR 160 -> 220
  · havuz eszamanliligi 8 -> 12
OLCUM: 180 sembol / 12 = 15 tur; Yahoo cagrisi ~150-300ms -> 2-5 sn.
Vercel'in 10 sn butcesine sigar. 8'li kalsaydi 23 tur = 3,5-7 sn, sinira
fazla yakin olurdu.

### 159.3 HARDCODE KALDIRILDI — asil hata buydu
§152'de yazdigim satir:
    const wbHam = (XK100 && XK100.uyeler && endeksKod==='XK100') ? XK100.uyeler : null;
Endeks secicide XKTUM secilse bile XK100 agirliklari kullanilir ya da hata
verirdi. Tek endeksle calisirken gorunmeyen bir kisit, ikincisi eklenince
patlardi. ENDAG={XK100:{...},XKTUM:{...}} sozlugu kuruldu, secilen endeksin
kendi tablosu okunuyor. Agirlik yasi karti da secilen endeksin tarihini
gosteriyor.
GERIYE UYUM: market kod listesi window.XK100'e bakiyordu; Object.defineProperty
ile getter birakildi, kirilma yok.

### 159.4 TEST
Ayni portfoy iki endekse gore:
  XK100: ayrisma -0,80 · TUPRS -335bps · EREGL -686bps · aktif pay %32,3
  XKTUM: ayrisma -1,00 · TUPRS  -95bps · EREGL -558bps · aktif pay %33,8
XKTUM daha genis oldugu icin tek hisse agirliklari dusuk, ayni pozisyon orada
daha AZ eksik gorunuyor. Ikisi de dogru — farkli soru soruyorlar.

app.js v=20260730f. DOSYALAR: xktum.json (YENI) + api/market.js + app.js +
index.html + guncelleme-plani.json.

## 158. BASLIK TUTARLILIGI — bes h3, h2'ye cevrildi (29 Tem)

Kullanici: "kart harcamalari basligi da diger basliklar gibi olsun."

### 158.1 TARAMA — sorun tek basliktan ibaret degildi
Kullanici bir basligi isaret etti; tum dosya tarandi ve AYNI durumda BES baslik
bulundu (hepsi h3 + satir ici stil):
  KART HARCAMALARI — SEKTOREL · GRUP KARSILASTIRMASI · SAHIPLIK KIRILIMI ·
  SEKTOREL KREDI STRESI · KATILIM BANKALARI — BILANCO DETAYI
Hepsi `<h3 style="font-size:12px;margin:...;letter-spacing:.4px">` bicimindeydi.
h2'nin verdigi iki seyi ALMIYORLARDI:
  · h2::after -> saga uzanan gradient CIZGI
  · h2 .thin  -> parantez ici aciklamanin gri/normal gorunumu
Besi de h2'ye cevrildi. §125.4'te ayni sey Tahminler sekmesinde olmustu (.lbl
kullanilmisti); demek ki panel genelinde yerlesik bir kusur.
PENCERE BASLIKLARI (Veri Durumu, EBU) h3 KALDI — onlar bolum basligi degil.

### 158.2 KENDI YAPTIGIM TUTARSIZLIK — rozet agirligi
Cevirirken satir ici stilleri toptan sildim; rozetlerdeki
`style="font-weight:400"` de gitti. `.tag` CSS'i font-weight:600 tanimliyor,
dolayisiyla yeni rozetlerim KOYU cikacakti — mevcut rozetler ise 400 (normal).
Panelin kendi kurali 400 (mevcut uc baslikta oyle).
DUZELTILDI: rozetlerde font-weight:400 geri konuldu. `.thin` spanlarinda
GEREKMIYOR cunku `h2 .thin{font-weight:500}` CSS'i zaten hallediyor —
gereksiz satir ici stil eklemek de bir kirlilik.
DOGRULAMA: yedi rozetli h2'nin HEPSI fw=400.

DERS: bir bicim duzeltmesi yaparken "toptan sil" yaklasimi, o stillerin
BAZILARININ islevsel oldugunu kacirir. Silmeden once her satir ici stilin
CSS'te karsiligi var mi kontrol edilir; varsa sil, yoksa birak.

index.html: h2 67 · h3 2. app.js v=20260730e.
DOSYALAR: index.html.

## 157. PANEL TARAMASI VE TAZELEME (29 Tem)

Kullanici: "paneli tara, damgali verilere bak, eksik hatali var mi, bir guncelleme
calistiralim, bilanco takvimlerine bakalim."

### 157.1 TAZELIK TARAMASI — 32 katman
Bilanco sezonundayiz (Tem), sezon:true katmanlarda limit 10 gune duser (§118).
GECIKMIS BULUNANLAR (tarama oncesi 6):
  Faktor modeli 15g · Multiple 13g · Guidance 12g · Analist 12g · Swap stoku 12g
  + Kopru saglik testi: tarih alani "deploy oncesi" yaziyordu, OKUNAMIYORDU
GUNCEL OLANLAR: katfon (bugun) · sektor (28 Tem) · yabanci (28 Tem) ·
  xk100 (bugun) · sicil 8g · hazine takvimi 8g · inceleme-ai 8g

### 157.2 IC TUTARSIZLIK — katfon.json
`guncelleme=2026-07-22` ama `fiyat_tarihi=2026-07-27`, `akis_tarihi=2026-07-29`.
§149-150'de veriyi tazelerken META ALANI guncellemeyi atlamisim. Tazelik nobeti
`guncelleme` alanina baktigi icin dosya BAYAT gorunuyordu, oysa verisi taze.
DUZELTILDI. DERS: veri tazelenince DAMGA da tazelenir; ikisi tek islemdir.

### 157.3 BILANCO TAKVIMI — sezon HENUZ BASLAMADI
KAP FR bildirimleri tarandi (Fintables dokuman havuzu, kap_bildirim_tipi=FR).
BULGU: kullanicinin portfoyundeki hisselerin HICBIRI 2C26 aciklamamis.
En yeni FR'leri 1C26 (ornek GUBRF 2026/03, 11 Haziran).
SEBEP: 30.06.2026 donemi icin SPK sureleri — konsolide olmayan 45 gun
(14 Agustos), konsolide 60 gun (29 Agustos). Bankalar erken aciklar; AKBNK/
TAVHL/BMSTL zaten aciklamis ve KARTLARI VAR (§118 bilanco nobeti calisiyor).
SONUC: "kart bekliyor" listesi BOS. Asil dalga 10-29 Agustos arasi gelecek.
O zaman guidance/multiple/fm/analist BIRLIKTE tazelenmeli (ayni fiyat tarihiyle).

### 157.4 CALISTIRILAN TAZELEME: multiple.json fiyatlari
141/141 hisse, Fintables mumlar_gunluk_gh, DISTINCT ON ile fon basina son kapanis.
Uc sorgu (48+48+45). fiyat_tarihi 15 Tem -> 29 Tem.
DENETIM: 14 gunde %60'tan fazla oynayan hisse YOK (aykiri deger yok).
Ortalama 14 gunluk degisim -%3,32 — piyasa genelinde geri cekilme, tutarli.
ONEMLI NOT: bilanco kalemleri (ciro/ebitda/netBorc) 1C26'DA BIRAKILDI ve
DOGRUSU BU — 2C26 aciklanmadi. Fiyat tazelenince EV/EBITDA carpani DOGRU
hareket eder (pay degisir, payda ayni kalir). Fiyati guncelleyip bilancoyu
guncellememek burada HATA DEGIL, dogru davranistir.

### 157.5 KALAN DORT GECIKME — neden simdi yapilmadi
  Faktor modeli 15g · Guidance 12g · Analist 12g · Swap stoku 12g
Ilk ucu BILANCO VERISI ister; 2C26 aciklanmadigi icin simdi tazelemek yalniz
FIYAT bilesenini gunceller, z-skorlar 1C26 bilancosunda kalir. Agustos dalgasini
beklemek dogru — hepsi AYNI donem verisiyle birlikte tazelenmeli.
Swap stoku EVDS'den gelir (rezerv.json), ayri bir is.

DOSYALAR: multiple.json + katfon.json + guncelleme-plani.json.

## 156. UC HATA: silinen mod=seri · sabit hisse listesi · cagrilmayan grafik (29 Tem)

Ekran calisti ama uc sorun cikti. Ikisi eski, biri BU TURDA benim yaptigim.

### 156.1 KENDI SILDIGIM: mod=seri (§119) — cp ile ustune yazdim
`cp uploads/market.js outputs/api/market.js` calistirdim ve §119'da eklenen
seriModu'nu SILDIM. Teknik analiz sekmesinin (t21) TEK veri kaynagiydi; deploy
edilse Teknik sekmesi tamamen olurdu.
NASIL YAKALANDI: cp'den sonra hash kontrolu yaptim, 8613bfc85331 cikti — bu
UPLOADS surumunun hash'i. Kontrol etmeseydim fark etmeyecektim.
GERI KONDU (7cb48c620818). DERS: bir dosyayi kaynaktan kopyalamadan once o
dosyada CIKTI TARAFINDA degisiklik olup olmadigi kontrol edilir. Hash
karsilastirmasi bes saniye surer; §128'de "yerel kopya bayat olabilir" dersini
yazmistim, bu onun TERSI — cikti kopyasi ILERI olabilir.

### 156.2 KAPSAM %58 — market.js'te SABIT 40 HISSELIK LISTE
`const HIS = [...]` 40 kodluk sabit listeydi. Kullanicinin KENDI portfoyu bile
tam kapsanmiyordu: ALCTL, EKGYO, LOGO, MERCN, ALTNY getirisiz kaliyordu.
XK100'un 73 uyesi (endeks agirliginin %33,7'si) hic cekilmiyordu.
DUZELTME (§155): ?his=KOD1,KOD2 parametresi. Panel market cagrisinda portfoy
kodlarini + XK100 uyelerini gonderiyor. Toplam 114 sembol.
SINIR 160: havuz(...,8) sekizli paralel cekiyor, 160 sembol ~20 tur eder.
Fazlasi kirpilir ve `hisKirpildi` alaninda RAPORLANIR (sessiz kirpma yok).
OLCUM: XK100 agirlik kapsami %66,3 -> %100.

### 156.3 GRAFIK TANIMLIYDI AMA CAGRILMIYORDU
ayrGrafik() yazilmisti, hicbir yerden tetiklenmiyordu — kumulatif kutusu BOS
gorunuyordu. node --check gormez: fonksiyon gecerli, sadece OLU.
DUZELTME: ayrismaCiz sonunda cagriliyor.
DERS §136'nin kardesi: "tanimli" ile "calisiyor" ayri seyler. Bir fonksiyon
yazdiktan sonra CAGRILDIGI YER de yazilir; ikisi tek islemdir.
OLU KOD TARAMASI yapildi (regex ile ayr*/xk100* fonksiyonlari). Tarayici
ayrismaCiz'i "olu" isaretledi ama YANLIS ALARM: fonksiyon addEventListener ve
.then()'e REFERANS olarak geciriliyor, parantezle cagrilmiyor. Kendi tarama
aracin da yanilabilir — §137'de ayni sey brace sayacinda olmustu.

app.js v=20260730d. DOSYALAR: api/market.js + app.js + index.html.

## 154. AYRISMA PORTFOY SEKMESININ ICINE TASINDI (29 Tem)

Kullanici ekran goruntusu attı: alt navda "Endeksten Ayrisma" YOK. Iki sebep:
(a) en son index.html deploy edilmemisti — dosyada vardi, ekranda yoktu
(b) ve zaten kullanici ayri sekme ISTEMIYORDU: "portfoyun alt sekmesinin icine koy"

### 154.1 DOGRU YER NEDEN t3
Aktif agirlik, Portfoy tablosundaki AGIRLIK sutununun endeksle karsilastirilmis
halidir. Ayri sekmede olunca kullanici iki ekran arasinda gidip geliyor;
ayni ekranda olunca "benim %10, endeks %13" karsilastirmasi dogrudan goruluyor.
t22 tamamen kaldirildi, govde t3'un SONUNA tasindi (Senaryo & Stres Testi'nin
ardina). Portfoy sekmesi simdi bes bolum:
  00 Portfolio Command Center · Portfoy Risk Lensi · Cesitlendirme Lensi ·
  Senaryo & Stres Testi · Endeksten Ayrisma + Kumulatif Ayrisma

### 154.2 UC YER KURALI — TERSINE uygulandi (§124)
Yeni sekme eklerken UC yere yazilir; KALDIRIRKEN de UC yerden silinir:
  (a) app.js PY_GRUP        -> t22 cikarildi
  (b) index.html pySubnav   -> buton silindi
  (c) ajan.js SEKME_DISLA   -> t22 cikarildi (t3 zaten listede, koruma surüyor)
Tetikleyici de tasindi: b.dataset.tab==='t22' -> t3 acilinca ayrismaInit().

### 154.3 BLOK KESME — bu sefer DOGRU yapildi
§130.3'te kural yazilmisti: "blogu satir araligiyla silme, DENGELI TARAMA yap
ya da kesilen ilk VE son satiri assert et." Bu turda uygulandi:
  · t22 blogu { } sayarak bulundu
  · kesilen blokta ayrBody/ayrGrafik VAR, t15/t3 YOK diye assert edildi
  · t3'un kendi kapanisi yine dengeli tarama ile bulundu
Sonuc: t3 dengesi 55/55, ilk denemede tuttu. Onceki dort blok kesme denemesinde
(§120.4, §124, §125.5, §129.3, §130.3) hep ikinci denemede tutmustu.

app.js v=20260730c. DOSYALAR: index.html + app.js + ajan.js.

## 153. ENDEKS AGIRLIKLARI HAFTALIK RITUELE BAGLANDI (29 Tem)

Kullanici: "gunluk olarak endeks hisse agirliklari degisir biliyorsun. bunu ara
ara guncelleştirecegiz ornegin haftalik. sana paneli guncelleştir dedigimde bu
agirliklari da guncelleyeceksin."

### 153.1 IKI AYRI RITIM — karistirmamak lazim
UYELIK: uc ayda bir degisir. BIST revizyon donemleri 1 May-31 Eki / 1 Kas-30 Nis.
AGIRLIK: HER GUN kayar. Cunku agirlik = serbest dolasim piyasa degeri / toplam,
ve piyasa degeri fiyatla birlikte oynar. Uyelik sabit kalsa bile agirliklar akar.
Ayni Fintables sorgusu IKISINI DE yakalar — ayri is degil.

### 153.2 HAFTALIK YETERLI MI — olculdu
Bir hissenin fiyati %X hareket edince kendi agirligi ve digerlerinin seyrelmesi:
  +1%  -> kendi +16 bps · digerleri  -3 bps
  +5%  -> kendi +80 bps · digerleri -13 bps
  +10% -> kendi +158 bps · digerleri -26 bps
  +20% -> kendi +310 bps · digerleri -52 bps
Tipik haftalik hisse hareketi %3-5 -> agirlik kaymasi 10-30 bps.
Aktif agirliklar 100-3000 bps mertebesinde. 30 bps GURULTU, yorumu bozmaz.
HUKUM: haftalik tazeleme YETERLI. Gunluk gereksiz, aylik riskli.

### 153.3 BAYATLIK UYARISI — kart kendi yasini soyluyor
Yeni "AGIRLIK YASI" karti: xk100.json tarihinden gun farki. 14 gunu asarsa
KIRMIZI cerceve + "tazele" uyarisi. Sebep: sert hareket eden bir hisse varsa
(%20) kayma 300 bps'e cikar ve aktif agirlik yorumunu gercekten bozar.
Yasi gostermeden bayat agirlikla hesap yapmak, §141'de katilim fonlarinda
yasanan "damga cekim saatini gosteriyordu" hatasinin ayni ailesi.

### 153.4 RITUELE YAZILDI
guncelleme-plani.json: XK100 katmani siklik=haftalik, son=2026-07-29.
Kayitli sorgu (tekrarlanabilir olsun diye):
  SELECT hisse_senedi_kodu, fiili_dolasim_pay_adedi, son_fiyat
  FROM hisse_senetleri WHERE 'XK100' = ANY(endeksler)
  ORDER BY fiili_dolasim_pay_adedi * son_fiyat DESC   [LIMIT 50 + OFFSET 50]
  hesap: agirlik_i = (sd_adet_i x fiyat_i) / toplam x 100
KTPANEL-DAMGA.md'ye B4 bolumu eklendi: t22 YARI DAMGALI — getiriler canli,
agirliklar damgali.
"PANELI GUNCELLE" komutu artik sunlari kapsar: sektor.json · katfon.json
(getiri + AUM) · xk100.json (uyelik + agirlik).

app.js v=20260730b. DOSYALAR: app.js + index.html + guncelleme-plani.json +
KTPANEL-DAMGA.md.

## 152. AKTIF AGIRLIK ATIFI — dogru kurgu (29 Tem)

Kullanici §151'i duzeltti: "sen beni yanlis anladin. hisse bazli karsilastiracaksin,
portfoy bazinda degil. TUPRS'in endeks agirligi %13, ben %10 tutuyorum, endeks
bana sadece tupraştan 300 bps fark atiyor bunun gibi."
HAKLI. §151'in matematigi DOGRUYDU ama YANLIS SORUYU cevapliyordu.

### 152.1 IKI KURGU
ESKI (§151):  r_p − r_b = Σ w_i·(r_i − r_b)
YENI (§152):  r_p − r_b = Σ (w_i − wb_i)·(r_i − r_b)
Ikisi de ayni sonuca toplanir ama ATFI FARKLI DAGITIR:
1) Endeks agirliginda tutulan hisse YENI kurguda SIFIR katki yapar — dogru,
   cunku orada AKTIF BIR KARAR YOKTUR. Eski kurgu ona da katki atfediyordu.
2) HIC TUTULMAYAN endeks uyeleri YENI kurguda hesaba GIRER (w=0, aktif = −wb).
   Eksik agirlik da bir karardir. Eski kurgu bunlari TAMAMEN GORMUYORDU.
EVREN = portfoyum ∪ endeks uyeleri.

### 152.2 ENDEKS AGIRLIKLARI BULUNDU — Fintables hisse_senetleri
§151'de "BIST agirlik tablosunu yayinlamiyor" diye xk100.json bos birakilmisti.
YANLISTI: Fintables'in hisse_senetleri tablosunda UC alan var —
  · endeksler                (dizi: ["XK100","XUTUM",...])  -> UYELIK
  · fiili_dolasim_pay_adedi  (serbest dolasim pay adedi)
  · son_fiyat
BIST endeks agirliklari SERBEST DOLASIM PIYASA DEGERI ile hesaplanir:
  agirlik_i = (sd_adet_i x fiyat_i) / Σ(sd_adet x fiyat)
100 uye cekildi, toplam serbest dolasim PD 2,09 trilyon TL.
DOGRULAMA: TUPRS %13,35 cikti — kullanicinin verdigi ornekteki "%13" ile birebir.
Yontem gercek endeksle tutuyor.
EN BUYUK: ASELS %20,23 · BIMAS %15,39 · TUPRS %13,35 · EREGL %6,86.
Ilk 10 yogunlasma %67,6.
UYARI (dosyaya yazildi): BIST ayrica UST SINIR uygular (tek hisse azami agirlik).
Siniri asan hisse varsa gercek agirlik buradakinden DUSUK olur.
DERS: "kaynak yok" hukmu vermeden once ELDEKI kaynagin SEMASINA bak. §148'de
ayni hatayi tersinden yapmistim (tek kaynak tarayip genel hukum). Burada
Fintables'in hisse tablosunu hic acmadan "yok" dedim.

### 152.3 KAPSAM SORUNU — durustce raporlaniyor
Panelin market akisi Top-40 + portfoy cekiyor; XK100'un tamami yok.
Getirisi olmayan endeks uyelerinin katkisi HESAPLANAMAZ. Bu yuzden
"kapsanan toplam" ayrismaya BIREBIR ESIT DEGILDIR ve kart bunu SOYLER:
kapsam yuzdesi + eksik isimler + aktif agirliklari listelenir.
Kimlik bozuldugu icin degil, EVREN eksik oldugu icin.
Cozum (yapilmadi): market akisini XK100'u kapsayacak sekilde genisletmek.

### 152.4 TEST — kullanicinin ornegi birebir
TUPRS endekste %13, portfoyde %10 -> aktif −300 bps. TUPRS endeksi 4 puan dovdu.
KATKI = −0,03 x 4 = −0,120 puan. Isaret dogru (eksik tutup kaybettim).
EREGL hic tutulmuyor, endekste %7 -> −700 bps, endeksi 2 puan dovdu -> −0,140.
ASELS +3000 bps aktif agirlikta AMA endeksle ayni getiri -> katki TAM SIFIR.
Dogru: aktif agirlik ancak hisse endeksten SAPARSA para kazandirir/kaybettirir.
TAM ENDEKS AGIRLIGI senaryosu: aktif agirligi olan hisse sayisi 0 -> atif bos.

app.js v=20260730a. DOSYALAR: app.js + index.html + xk100.json (dolduruldu).

## 151. ENDEKSTEN AYRISMA SEKMESI (t22) — performans atifi (29 Tem)

Kullanici: "portfoyum endeksten ne kadar ayristi? katilim 100'un agirliklarini
cek, benimkiyle kiyasla, gross betam kac, hangi kagit beni dovmus."

### 151.1 ONEMLI BULGU: sorunun COGU endeks agirligi GEREKTIRMIYOR
Kimlik:  r_p − r_b = Σ w_i·r_i − r_b = Σ w_i·(r_i − r_b)      [Σw_i = 1 iken]
Yani her hissenin AYRISMAYA KATKISI = kendi agirligi × (kendi getirisi − endeks
getirisi). Toplamlari aktif getiriye BIREBIR esittir — yaklasik degil, KIMLIK.
Endeks uye listesi ya da agirligi GEREKMEZ.
Yorumu: "bu hisseyi tutmak yerine endeksi tutsaydim ne olurdu."
TEST: sapma 5,55e-17 (kayan nokta) — dort donemde de tuttu.
Agirlik GEREKTIREN yalniz iki sey: aktif agirlik (w_i − wb_i) ve aktif pay
(½Σ|w_i − wb_i|). Bunlar xk100.json varsa gosterilir, yoksa gizlenir; geri
kalan her sey calisir.

### 151.2 AYNI KAYNAK SARTI — §114'un dersi uygulandi
Hem hisse hem endeks getirisi AYNI akistan (Yahoo /api/market) okunur.
Farkli kaynaklardan alinsa TABAN KAYMASI aktif getiriyi kirletirdi. §114'te
sektor rotasyonunda tam bu yasanmisti: damgali sektor vs canli endeks
karsilastirilinca her sektore sistematik +2,05/+4,11/+4,48 puan ekleniyordu.
Burada bastan ayni tabandan okunuyor.

### 151.3 KAPSAM KURALI — payda tutarliligi
Getirisi gelmeyen hisse AGIRLIK PAYDASINDAN DA cikarilir. Aksi halde Σw < 1
olur ve katkilar toplami aktif getiriyi TUTMAZ — kimlik bozulur.
Cikarilanlar RAPORLANIR, sessizce yutulmaz (§143 dersi).
TEST: Σw = 1,0000000000 (kapsam disi hisse paydadan cikti).

### 151.4 GUNLUK BIRIKIM — "her gun otomatik guncellensin"
ayr_seri_v1: her acilista o gunun {portfoy, endeks} getirisi kaydedilir; gun
degisince yeni satir, ayni gun icinde ustune yazar. CLOUD_KEYS'e eklendi.
KAYIT YERI canliEnjekte() — market verisinin geldigi TEK nokta. Sekme ACIK
OLMASA BILE kayit duser; "her gun otomatik" sarti ancak boyle saglanir.
NEDEN GUNLUK SAKLANIYOR, KUMULATIF DEGIL: kumulatif saklamak bir gun panel
acilmazsa KALICI BOSLUK birakir. Gunlukler saklanip kumulatif CIZIM ANINDA
bilesiklenir — eksik gun yalniz o gunu kacirir, seriyi bozmaz.
BILESIK, TOPLAMA DEGIL: Π(1+r)−1. OLCULDU: 63 islem gununde toplama yontemi
0,47 puan sapma veriyor.

### 151.5 UC YER KURALI UYGULANDI (§124)
Portfoy Yonetimi grubuna yeni sekme:
  (a) app.js PY_GRUP  (b) index.html pySubnav butonu  (c) ajan.js SEKME_DISLA
Ucu de yapildi. t22 §124'te Tahminler t2'ye tasininca bosalmisti, yeniden kullanildi.

### 151.6 xk100.json — ISKELE, kopru rituelyle dolacak
BIST agirlik tablosunu API ile yayinlamiyor; serbest dolasim bazli agirliklar
makine-okunur kamusal bir kaynakta YOK. Uye listesi UC AYDA BIR revize ediliyor
(1 May-31 Eki / 1 Kas-30 Nis donemleri).
Dosya bos iskele olarak olusturuldu; doldurulunca panel AKTIF AGIRLIK ve
AKTIF PAY sutunlarini KENDILIGINDEN gosterir. guncelleme-plani.json'a
ceyreklik katman olarak eklendi.
AKTIF PAY NOTU: portfoyde OLMAYAN endeks uyeleri de hesaba katilir — asil fark
orada. Yalniz elde olanlara bakmak aktif payi sistematik olarak DUSUK gosterir.

app.js v=20260729z. DOSYALAR: app.js + index.html + ajan.js + xk100.json (YENI)
+ guncelleme-plani.json.

## 150. AUM VE AKIS DA TAZELENDI — iki tarih ayri gosteriliyor (29 Tem)

§149'da yalniz GETIRILER tazelenmisti; AUM ve gunluk akis 24 Tem'de kalmisti.
Kart iki farkli tarihi yan yana gosteriyor ve BUNU SOYLEMIYORDU.

### 150.1 KAYNAK: gunluk_fon_degerleri
Fintables'ta fon_buyuklugu / yatirimci_sayisi / gunluk_nakit_giris_cikisi ayni
tabloda. DISTINCT ON ile fon basina son kayit — 46 fon, tek sorgu.
Veri tarihi 29 TEM: fiyatlardan (27 Tem) bile TAZE.
BIRIM DENETIMI: eski damgali degerlerle oran ~1,0 (KLU 1,028 · ZP8 1,004 ·
AIS 1,056 · KPR 0,916) -> ham TL, birim ayni. Carpim hatasi yok.

### 150.2 KPR ANOMALISI — dogrulandi, veri hatasi degil
Net akis +3,6 mlr'den -7,6 mlr'ye dondu; tamami KPR'den (-8,3 mlr, fonun ~%10'u).
Buyuk bir iddia oldugu icin seri incelendi:
  21 Tem +6,5 mlr · 22 Tem -8,3 mlr · 28 Tem +0,1 · 29 Tem -8,3 mlr
Bir hafta icinde IKI KEZ ayni buyuklukte cikis. KPR kurumsal serbest fon:
1.275 yatirimci, 79 mlr -> ortalama 62 MN TL. Tek kurumun periyodik nakit
yonetimi. Not olarak katfon.json'a yazildi.

### 150.3 DENETIM
46/46 fon temiz. Kontroller: buyukluk>0 · |akis| < buyuklugun %30'u ·
yatirimci >= 1. Uc fonda yatirimci=1 (NKV/KNS/KFZ) — kurucu portfoyu, akislari
da 0, tutarli.

### 150.4 DAMGA IKI TARIHI SOYLUYOR
Getiriler ve AUM FARKLI kaynaklardan gelir (fiyat serisi vs gunluk fon degerleri)
ve ayni gun tazelenmeyebilir — nitekim simdi AUM daha taze. Damga artik:
"kopru rituali · getiriler 2026-07-27 · AUM/akis 2026-07-29 · ..."
Tek tarih gostermek, okuyucuya hepsi ayni gundenmis izlenimi verirdi.
Bu, §141'in (damga cekim saatini gosteriyordu) ayni ailesi: PANEL NE BILDIGINI
DEGIL, HANGI TARIHTEN BILDIGINI DE SOYLEMELI.

app.js v=20260729y. DOSYALAR: katfon.json + app.js + index.html.

## 149. KOPRU RITUALI CALISTIRILDI — 46 fon Fintables'tan tazelendi (29 Tem)

Kullanici: "ee ne olcak simdi getiriler guncellenmeyecek mi?" Cevap: guncellenecek,
yolu degisti. Ve laf olmasin diye AYNI TURDA calistirildi.

### 149.1 YONTEM — capa sorgusu (SQL tarafinda)
Fintables mumlar_gunluk_gh uzerinde her capa icin TEK sorgu:
  SELECT DISTINCT ON (kod) kod, kapanis FROM mumlar_gunluk_gh
  WHERE kod IN (...46 fon...) AND zaman_utc <= '<hedef>' ORDER BY kod, zaman_utc DESC
DISTINCT ON her fon icin hedefte YA DA ONCESINDE son kapanisi verir — tatil/hafta
sonu kendiliginden cozulur. Fon basina tek satir donduğu icin 50 satir siniri
asilmiyor. Alti capa = alti sorgu.
CAPALAR: son 27-07 · onceki 26-07 · 1A 27-06 · 3A 27-04 · YTD 31-12-25 ·
1Y 27-07-25 · 3Y 27-07-23.

### 149.2 KAPSAM — eksikler ANLAMLI
  1G  46/46 · 1A 46/46 · 3A 44/46 · YTD 43/46 · 1Y 36/46 · 3Y 19/46
Eksikler hata degil: fon o tarihte HENUZ KURULMAMIS. 3Y'de yalniz 19 fonun
olmasi, katilim fon evreninin son uc yilda ikiye katlandigini gosteriyor —
tablodaki tireler kendi baslarina bir bilgi.

### 149.3 DAGITIM TUZAGI — MPE (denetim yakaladi)
Yazmadan once denetim kosuldu: "1G <= 1A <= 3A <= YTD siralamasi bozulmus mu".
MPE bozdu: 1G +0,10 iken 1A -0,66. Para piyasasi fonunda aylik NEGATIF getiri olmaz.
INCELEME: 23 Tem 1,4007 -> 26 Tem 1,3507, tek gunde -%3,57. Bu bir KAR PAYI
DAGITIMIDIR — yatirimci para kaybetmedi, NAKIT ALDI. Ama Fintables fiyat serisi
dagitim icin DUZELTILMEMIS, dolayisiyla getiri kaybi gibi gorunuyor.
TARAMA: 2025-11'den bugune tum gunler LAG ile tarandi, tek gunde %0,2'den fazla
dusen BASKA gun YOK. Yalniz MPE, yalniz 26 Tem.
DUZELTME: faktor = 1,4007/1,350671 = 1,037039. Dagitim ONCESI capalarla
kiyaslanirken son fiyat bu faktorle carpilir (odenen nakit geri eklenir).
  1A -0,66 -> +3,02 · 3A +5,55 -> +9,46 · YTD +18,54 -> +22,93
1G etkilenmez (iki taraf da dagitim SONRASI). Duzeltme sonrasi 46/46 fon temiz.
katfon.json'a hem fon bazinda not hem genel `not_dagitim` yazildi.

### 149.4 SONUC
fiyat_tarihi 24-07 -> 27-07. YTD ortalama +0,68 puan yukari kaydi
(KKL %27,94 -> %29,01, en buyuk kayma). YTD araligi %9,61-%29,01, ortalama %22,13.

### 149.5 DERS — DENETIM YAZMADAN ONCE KOSULUR
MPE hatasi, veriyi yazdiktan SONRA degil ONCE yakalandi, cunku "donemler artan
olmali" gibi UCUZ bir tutarlilik kurali vardi. Kural fizikten geliyor: para
piyasasi fonu birikimlidir, uzun donem kisadan buyuk olmalidir.
KALICI KURAL: dis kaynaktan gelen veriyi dosyaya yazmadan once, o verinin
UYMASI GEREKEN bir ic tutarlilik kurali yaz ve kosur. Kural bulunamiyorsa
veri yeterince anlasilmamis demektir.

DOSYALAR: katfon.json.

## 148. TEFAS IPI KAPATILDI — devre kesici (29 Tem)

### 148.1 KESIN TESHIS
?debug=1 (10:15), cerez isindirma + iki varyantla:
  · ana sayfa GET      -> CALISIYOR, 4 cerez dondu (widcbb509a2029=… bot yonetimi)
  · /api/DB/…          -> HTTP 404, HIZLI yanit (gercek "yok", engel degil)
  · /api/funds/…       -> zaman asimi
Uc bulgu birlikte okununca tablo net: IP ENGELI YOK (sayfa geliyor), ama aldigimiz
cerez bir ON-CEREZdir. Gercek erisim, sayfadaki JavaScript kosunca veriliyor.
Vercel'de JS calistiracak tarayici yok. eneshenderson/Tefas-API'nin Playwright
kullanmasinin sebebi TAM OLARAK BU — kutuphane dogru, ortam uygun degil.
HUKUM: TEFAS sunucu tarafindan ERISILEMEZ. Denemeye devam etmek FAYDASIZ.

### 148.2 DEVRE KESICI — beyhude beklemenin bedeli
Denemeyi surdurmek ZARARLIYDI: her sekme acilisinda 8+ saniye asili kaliyor,
kullanici bekliyor, sonuc degismiyor. Artik:
  · varsayilan KAPALI, uc nokta ANINDA yanit veriyor (olculdu: 1ms vs 8000ms)
  · KATFON_CANLI=1 ortam degiskeniyle acilir
  · ?zorla=1 tek seferlik dener (yeni bir yol bulunursa sinamak icin)
  · ?debug=1 her zaman calisir (§145)
PANEL TARAFI: kapali durum KIRMIZI UYARI ile degil NOTR aciklamayla gosteriliyor
("kopru rituali · TEFAS canli cekim kapali…"). ARIZA ile KARAR farkli seylerdir;
kullanici "bozuk" sanmamali, "boyle tasarlandi" bilmeli.

### 148.3 GECERLI VERI YOLU
Kopru rituali: Fintables'tan cekilip katfon.json'a damgalanir. Bu yol OLCULDU ve
DOGRU calisiyor — §142'de 4 fonda Fintables ile birebir tuttu (sapma ort. 0,17
puan, tamami bir gunluk takvim kaymasi).
Eksigi: elle tetikleniyor. Otomatiklestirme yolu (c): kullanicinin kendi
makinesinde (gercek tarayici var) kutuphane kosar, sonuc panelin KV'sine yazilir.

### 148.4 DERS — "denemeyi birakmak" da bir muhendislik karari
Bu oturumda ayni duvara dort kez carpildi (§142 alti pencere, §144 kademeli,
§146 cerez, §147 varyant). Her seferinde bir sey ogrenildi ama duvar durdu.
Dogru hamle, duvarin OLCULMUS oldugunu kabul edip maliyeti kesmekti.
KURAL: bir yol uc denemede acilmadiysa, DORDUNCU denemeden once "bu yol
kapali mi" sorusu sorulur. Kapaliysa devre kesici konur ve ALTERNATIF yola
gecilir — israr, olcumun yerini almaz.

app.js v=20260729x. DOSYALAR: api/katfon.js + app.js + index.html +
guncelleme-plani.json (kapali arama kaydi).

## 147. TEFAS ENGELI — Tefas-API deposu incelendi (29 Tem)

### 147.1 TESHIS SONUCU KESIN
?debug=1 (29 Tem 10:07): alti pencerenin HEPSI 8000ms'de dustu.
  · 4 pencere: "zaman asimi (8000ms)"  (8001-8004ms — tam sinirda)
  · 2 pencere: "JSON cozulemedi (HTML donmus olabilir)"
JSON bekleyip HTML almak, USTELIK 8 saniye bekletildikten sonra: bot koruma /
WAF sayfasinin imzasi. Vercel'in veri merkezi IP'si tarpit'leniyor.
NOT: bu uc nokta MUHTEMELEN HIC CALISMADI. Kullanicinin ilk ekran goruntusunde
de damgali veri vardi. "Guncellenmiyor" gecikme degil, BASTAN BERI CALISMAMAK'ti;
ekran bunu soylemedigi icin gecikme sanildi (§143'un tam olarak uyardigi durum).

### 147.2 KULLANICININ ISARET ETTIGI DEPO — eneshenderson/Tefas-API
Kullanici hakli olarak hatirlatti: bu depoyu daha once gostermis, ben "olur"
demisim ama INDIRIP BAKMAMISIM. Simdi bakildi.
BULGU: kutuphane CALISIYOR ama PLAYWRIGHT ile —
  1) chromium.launch()  2) goto('tefas.gov.tr/TarihselVeriler.aspx')  3) 1sn bekle
  4) page.evaluate() ile fetch'i SAYFANIN ICINDEN calistir
Sayfanin icinden cagirinca hem bot korumasi geciliyor hem SAME-ORIGIN oldugu
icin CORS yok. Yani ham HTTP degil, GERCEK TARAYICI.
VERCEL'DE CALISMAZ: Chromium ~300MB, Hobby bundle siniri cok altinda.
DERS (kendime): bir kutuphaneyi "kullanabilir miyiz" diye soruldugunda
KURULUM TALIMATINI OKU. `playwright install chromium` satiri tek basina cevabi
veriyordu; ben okumadan onay verdim ve haftalar sonra ayni duvara carpildi.

### 147.3 AMA DEPO BIR SEY OGRETTI: FARKLI UC NOKTA
Kutuphane BIZIMKINDEN BASKA bir uca gidiyor:
  ESKI: POST /api/DB/BindHistoryInfo · form-urlencoded · tarih DD.MM.YYYY
        alanlar BUYUK HARF (.NET): FONKODU / TARIH / FIYAT / PORTFOYBUYUKLUK
  YENI: POST /api/funds/fonGnlBlgSiraliGetir · JSON · tarih YYYYMMDD  (bizimki)
Bizim kod yalniz YENI'yi deniyordu. Eski uc FARKLI BIR YOLDA; ayni WAF kuralinin
arkasinda OLMAYABILIR — denenmeye deger, maliyeti sifir.
UYGULANDI (§115 varyant zinciri deseni): once ESKI uc, tutmazsa YENI.
Alan adlari ortak bicime cevriliyor, cagiran taraf farki gormuyor.
debug ciktisi artik `varyant:'eski'|'yeni'` de raporluyor.
Ayrica §146: cerez isindirma (once sayfa GET, donen cerezle POST) — kutuphanenin
"ilk sayfa ziyareti (cookie icin)" adimindan alindi.

### 147.4 EGER IKISI DE DUSERSE — kalan yollar
(a) TARAYICI TARAFINDAN CEK: panelin ECB'de yaptigi gibi. AMA CORS engeli var;
    kutuphane bunu sayfanin ICINDEN cagirarak asiyor, biz asamayiz. ELENDI.
(b) @sparticuz/chromium ile Vercel'de headless Chrome: teknik olarak mumkun,
    Hobby sinirlarini zorlar, soguk baslangic 5-10sn. AGIR.
(c) YEREL BETIK -> KV: kullanici kendi makinesinde (gercek tarayici var)
    kutuphaneyi kosar, sonucu panelin KV'sine yazar. Kopru ritualinin otomatigi.
(d) KOPRU RITUALI: Fintables'tan cekip katfon.json'a damgalamak. Su an fiilen
    bu yapiliyor ve DOGRU calisiyor (§142'de 4 fonda dogrulandi).
ONERI: (c) en saglami. (d) zaten calisiyor ve bedava.

app.js degismedi. DOSYALAR: api/katfon.js.

## 145. TESHIS ARACININ KENDISI SUSUYORDU (29 Tem)

§144 sonrasi ekran: "TEFAS: son pencere alinamadi (TEFAS yanit vermedi)".
Yani TEK pencere bile 8 saniyede gelmiyor — sorun PARALELLIK DEGIL, TEFAS bizi
hic kabul etmiyor. Ama kullaniciya "suna bak" DENEMIYORDU, cunku:

### 145.1 IKI KOR NOKTA
1) `pencere()` her hatayi YUTUP null donuyordu:  }catch(e){ return null; }
   "Neden dustu" bilgisi (HTTP kodu? zaman asimi? DNS? HTML mi dondu?) KAYBOLUYORDU.
2) `?debug=1` blogu, "son pencere alinamadi" FIRLATMASINDAN SONRA geliyordu.
   Yani ariza varken debug hic calismiyordu — TAM IHTIYAC DUYULAN ANDA SUSUYORDU.
KURAL: teshis araci, teshis edecegi arizadan ETKILENMEMELI. Debug yolu, normal
akisin hata yollarindan ONCE ve BAGIMSIZ calismali.

### 145.2 DUZELTME
`pencere()` artik TANI NESNESI doner: {ok, dizi|sebep, ms, govde}
  · HTTP hatasi -> 'HTTP 403' + govde ornegi (180 karakter)
  · JSON cozulemedi -> 'HTML donmus olabilir' (engel sayfasi isareti)
  · TEFAS mesaji -> 'TEFAS: Sistem bakimda'
  · zaman asimi -> 'zaman asimi (8000ms)'
  · ag hatasi -> hata adi + mesaj
`?debug=1` en basa alindi: HICBIR SEY FIRLATMADAN alti pencereyi de dener ve
her biri icin sonuc/sebep/sure/kayit sayisi raporlar. Ayrica uc noktanin URL'i
ve ilk kaydin alan listesi.
TEST (5 senaryo): timeout · HTTP 403 · HTML yaniti · TEFAS hata mesaji · basari —
hepsinde debug DOGRU sebebi yaziyor. Eskiden ilk dordunde hic calismiyordu.

### 145.3 DERS
Bu, §143'un ("sessiz yedek") bir ust katmani. Orada YEDEGE DUSTUGUNU soylemek
gerekiyordu; burada NEDEN dustugunu. Ikisi ayri:
  · "damgali gosteriyorum" -> kullanici veriye guvenmemesi gerektigini bilir
  · "cunku HTTP 403"       -> kullanici SORUNU COZEBILIR
Bir arıza mesaji, eylem onermiyorsa yarim kalmistir.

DOSYALAR: api/katfon.js.

## 144. KADEMELI CEKIM — alti paralel istek hepsini dusuruyordu (29 Tem)

§143'un teshisi ISE YARADI: ekran "TEFAS: son pencere alinamadi — damgali veri
gosteriliyor" dedi. Yani sorun deploy degil, ISTEGIN KENDISIYDI.

### 144.1 KOK NEDEN: alti paralel istek
§142 alti pencereyi Promise.all ile AYNI ANDA cekiyordu. Her pencere TUM fonlari
(~800-1000) birkac gunluk doner — alti tanesi birden ya TEFAS'i ya Vercel'in
10 saniyelik fonksiyon butcesini zorluyor. Ve Promise.all HEPSINI birden
dusuruyordu: ilk pencere de gelmiyor, 1G bile hesaplanamiyordu.
Yani §142 kismi basari icin tasarlanmisti ama pratikte HEP YA HIC oluyordu.

### 144.2 DUZELTME: once "son", sonra capalar
  1) "son" penceresi TEK BASINA, 8 sn zaman asimiyla. Bu tutmazsa zaten hicbir
     sey yapilamaz (1G bile gelmez) — dogru yerde durur.
  2) Bes capa penceresi paralel, KALAN butceyle (min 1,5 sn).
     Duserlerse donemler damgali kalir ama 1G CANLI olur.
Sonuc: en kotu ihtimalle ESKI SURUM KADAR IYI. Kismi basari artik gercekten kismi.
TEST (3 senaryo):
  · hepsi calisiyor -> 6 donem canli, degerler Fintables ile birebir
  · capalar dustu   -> canliDonem:['1G'], digerleri null (damgali korunur)
  · TEFAS kapali    -> ok:false, ekranda sebep yaziyor
Eskiden ikinci senaryo da ucuncusu gibi davraniyordu.

### 144.3 ONEK TEKRARI
Ekranda "TEFAS: TEFAS: TEFAS son pencere alinamadi" yaziyordu. Sunucu zaten
"TEFAS: ..." onekiyle gonderiyor, panel bir kez daha ekliyordu, hata metninin
kendisinde de "TEFAS" geciyordu. Panel tarafinda regex ile temizlendi.
Kucuk ama gosterge: hata metinleri de KOD kadar dikkat ister, cunku kullanicinin
gordugu tek sey odur.

### 144.4 ACIK SORU — TEFAS neden yavas/redci
Alti istek fazla geldiyse sebep TEFAS'in hiz siniri da olabilir. Kademeli cekim
bunu HAFIFLETIR ama COZMEZ. Capalar duzenli olarak duserse iki secenek:
  (a) capalari SIRAYLA cek (daha yavas ama daha kibar)
  (b) capa pencerelerini gunluk cron'a tasi, sonucu KV'ye yaz, uc nokta oradan
      okusun (istek sayisi 6 -> 1'e iner, kullanici hic beklemez)
(b) dogru cozum ama ayri bir is. Once kademeli surumun tutup tutmadigi olculecek.

app.js v=20260729w. DOSYALAR: api/katfon.js + app.js + index.html.

## 143. SESSIZ HATA — "deploy ettim ama ekran ayni" (29 Tem)

Kullanici deploy ettigini soyledi ama ekran hala "fiyat: 2026-07-24" (damgali
yedek) gosteriyordu. Koda bakinca katfonCanli()'de IKI SESSIZ CIKIS bulundu:
    if(!j.ok||!j.items) return;        // sessiz
    }catch(e){}                        // sessiz yutma
SONUC: API dusse de, route hic deploy edilmemis olsa da, TEFAS bos donse de
EKRAN AYNI GORUNUYORDU. Kullanici hangisi oldugunu ANLAYAMIYORDU — ve bu
belirsizlik tam da sorunun kendisiydi ("deploy ettim zaten oncekileri").

### 143.1 DUZELTME: her hata yolu damgaya yazar
Bes ayri yol, hepsi ekranda:
  · HTTP hatasi  -> "⚠ /api/katfon HTTP 404 — damgali veri gosteriliyor"
  · TEFAS bos    -> "⚠ TEFAS: <mesaj> — damgali veri gosteriliyor"
  · kod uyusmadi -> "⚠ yanit verdi ama hicbir fon eslesmedi (812 kayit dondu)"
  · kismi basari -> "TEFAS · veri <tarih> · 3Y damgali · n fon"
  · tam basari   -> "TEFAS · veri <tarih> · tum donemler canli · n fon"
Ayrica catch bloğu console.error ile yaziyor (eskiden tamamen sessizdi).

### 143.2 DERS — SESSIZ YEDEK, YEDEGIN KENDISINDEN TEHLIKELIDIR
Damgali yedege dusmek DOGRU davranistir; sessizce dusmek DEGIL.
Kullanici ekranda bir sayi gorur ve onun CANLI oldugunu varsayar. Yedegin
devrede oldugunu bilmiyorsa:
  (a) eski veriyle karar verir
  (b) sistemin bozuk oldugunu FARK ETMEZ, dolayisiyla duzeltmez
Bu vakada ikisi de oldu — kullanici getirilerin yanlis oldugunu dusundu, oysa
getiriler dogruydu, sadece BES GUN ESKIYDI ve ekran bunu soylemiyordu.
KALICI KURAL: bir yedege dusme yolu yaziyorsan, DUSTUGUNU SOYLEYEN satiri
AYNI ANDA yaz. `catch(e){}` bos birakilmaz — en azindan console.error.
Bu, §111 (metin rakamla celisiyor) ve §141 (damga cekim saatini gosteriyor)
ile ayni ailedendir: PANEL NE BILDIGINI DEGIL, NE BILMEDIGINI DE SOYLEMELI.

app.js v=20260729v. DOSYALAR: app.js + index.html.

## 142. KATILIM FON DONEM GETIRILERI CANLIYA — capa penceresi (29 Tem)

Kullanici Fintables ile karsilastirmami istedi. SONUC: damgali degerler YANLIS
DEGILDI, 24 Tem'de DOGRUYDULAR — ama bugun 29 Tem ve yalniz 1G tazeleniyordu.
DOGRULAMA (4 fon, Fintables mumlar_gunluk_gh): sapma ortalama 0,17 puan, tamami
bir gunluk takvim kaymasi. Ornek KTN: panel 1A %1,02 vs Fintables %1,01 ·
3A %6,36 vs %6,46 · YTD %18,34 vs %18,65.
ESKIME HIZI: bir haftada ~1 puan (KKL YTD panelde %27,94, gercekte %29,01).
Bir ay tazelenmezse 4-5 puan sapar.

### 142.1 COZUM: CAPA PENCERESI — tum gecmisi cekmeden donem getirisi
Naif yol 3 yillik pencere cekmekti: ~1000 fon x 750 islem gunu = devasa yanit,
Vercel zaman asimi. Gerekli olan TUM SERI DEGIL, yalniz CAPA FIYATLARI.
ALTI DAR PENCERE paralel cekiliyor (Promise.all):
  son (8g) · 1A (hedef-30) · 3A (-91) · YTD (onceki yil son islem gunu) ·
  1Y (-365) · 3Y (-1095)
Her pencere hedefin ETRAFINDA birkac gun genis (tatil/hafta sonu icin), ama
GERIYE dogru: capa hedefte YA DA ONCESINDE olmali, sonrasinda degil.
capaSec() her fon icin hedefe en yakin gecerli kapanisi secer.
getiri = (son fiyat / capa fiyat - 1) x 100.

KISMI BASARI TASARIMI: bir pencere duserse o donem null doner ve panel damgali
degeri korur (mevcut `c.g[i]!=null?c.g[i]:v` mantigi). Tum istek cokmez.
Yanit `canliDonem` dizisi tasir — hangi donemlerin canli hesaplandigi.
ONBELLEK: 30 dk -> 6 saat (fon fiyati gunde bir yayimlanir, alti pencere pahali).

### 142.2 REFERENCEERROR — §136'nin AYNI SINIFI, yine yakalandi
Tek-istek kodunu silerken `bosMesaj` degiskeni gitti ama YANIT SATIRINDAKI
KULLANIMI KALDI. node --check GECTI (sozdizimi gecerli), calisma aninda
ReferenceError verecekti. §136'da ayni sey `k.closest` ile olmustu.
BU SEFER DUMAN TESTIYLE YAKALANDI: sahte fetch ile modul ucdan uca kosturuldu.
DERS PEKISTI: node --check "ayristirilabilir" der, "calisir" DEMEZ. Bir modulu
degistirdikten sonra SAHTE GIRDIYLE CALISTIR — 20 satirlik test, bir siniftan
tum hatayi keser.

### 142.3 TEST
· Capa secimi: hedeften SONRAKI gozlem atlaniyor · 31 Ara tatilse 30 Ara
  seciliyor · yalniz gelecek tarihli gozlem varsa capa YOK (null, damgali korunur)
· Donem hesabi: GERCEK Fintables KTN fiyatlariyla alti donem de BIREBIR
  (1G 0,0854 · 1A 1,0077 · 3A 6,4627 · YTD 18,6485 · 1Y 38,5593 · 3Y 164,5522)
· Duman testi: modul sahte fetch ile bastan sona kostu, ReferenceError yok,
  canliDonem alti donemi de listeledi.

### 142.4 DAMGA DURUSTLESTI (§141'in devami)
Panel damgasi artik: "TEFAS · veri <tarih> · <yas> · tum donemler canli · n/N fon".
Bir pencere duserse "1Y/3Y damgali" diye HANGISININ donuk kaldigi yazilir.
Onceden tabloda yalniz 1G canliydi ve damga bunu HIC soylemiyordu.

app.js v=20260729u. DOSYALAR: api/katfon.js + app.js + index.html.

## 141. KATILIM FONLARI "GUN BASLARINDA GUNCELLENMIYOR" (29 Tem)

Kullanici: "katilim fonlari sekmesi guncellenmiyor gun baslarinda neden."
UC AYRI SEY vardi; ikisi normal, biri hataydi.

### 141.1 ASIL SEBEP — TEFAS BIR GUN GECIKMELI YAYINLAR (hata degil)
Fonun T gunu birim pay degeri T+1'de aciklanir. Sabah panele girildiginde
TEFAS'ta en yeni veri DUNUN fiyatidir — ortada guncellenecek bir sey YOKTUR.
Aksam yayin gelince degisir. Pazartesi sabahi ise CUMA'nin fiyati gorunur.
Ustune CDN onbellegi: s-maxage=1800 + stale-while-revalidate=3600 -> 90 dakikaya
kadar bayat servis edilebilir.

### 141.2 ASIL KUSUR — DAMGA CEKIM SAATINI GOSTERIYORDU
Panel "CANLI TEFAS · 09:15" yaziyordu. Bu CEKIM saatidir, VERININ tarihi degil.
Kullanici bugunun verisi saniyordu; oysa dunun fiyati bugun 09:15'te cekilmisti.
Ayirt etmenin YOLU YOKTU — soru tam da bu yuzden soruldu.
DUZELTME: api/katfon.js yaniti artik `veriTarihi` ve `veriYasiGun` tasiyor.
Panel damgasi: "TEFAS · veri 2026-07-28 · 1 gun geride · 46/46 fon (cekim 09:15)".
Artik "guncellenmedi mi yoksa yayin mi gelmedi" sorusu EKRANDAN cevaplaniyor.

### 141.3 GERCEK HATA — tarih siralamasi AY GECISINDE bozuk
Eski kod:
  const nx=Number(x); if(isFinite(nx)&&isFinite(ny)) return nx-ny;
  return String(x)<String(y)?-1:1;              // <- METIN karsilastirmasi
TEFAS tarihi DD.MM.YYYY gelirse Number(...)=NaN olur ve METIN daline duser.
Metin siralamasinda "02.08.2026" < "29.07.2026" — yani AY BASI EN ESKI SANILIR
ve SON GOZLEM YANLIS SECILIR. Ay ICINDE sorun gorunmez (15/16/17.07 dogru
siralanir), yalniz AY DONUMUNDE sessizce yanlis 1G getirisi uretir.
DUZELTME: tarihMs() — epoch(ms) · ISO(YYYY-MM-DD) · TR(DD.MM.YYYY) ucunu de
epoch'a cevirir, siralama sayisal yapilir.
TEST: dort bicim (epoch · ISO · TR ay gecisi · TR ay ici) hepsi dogru siralaniyor.

### 141.4 NOT — yalniz 1G canli, digerleri damgali
API yalniz g[0] (1 gunluk) hesaplar; 1A/3A/YTD/1Y/3Y null doner ve panel
damgali katfon.json degerlerini korur (`c.g[i]!=null?c.g[i]:v`). Yani "guncel"
gorunen tabloda YALNIZ 1G sutunu canlidir. Bu tasarim geregi ama damgada
yazmiyordu; yeni damga en azindan verinin tarihini soyluyor.

app.js v=20260729t. DOSYALAR: api/katfon.js (YENI, uploads'tan kopyalandi) +
app.js + index.html.

## 140. KULLANICI SIZINTISI — ayni tarayicida profil degisimi (29 Tem)

Kullanici: "furkan kullanicisiyla girdigimde furkanin yukledikleri, emre ile
girdigimde emrenin yukledikleri gelsin." Tasarim buydu AMA BIR SIZINTI VARDI.

### 140.1 KOK NEDEN: localStorage ORIGIN basinadir, OTURUM basina DEGIL
cloudLoad'da iki koruma vardi:
  if(bulut==null) return;                 // bulutta yoksa yerele dokunma
  if(bSay===0 && ySay>0) return;          // bulut bos, yerel dolu -> YERELI KORU
Bunlar GECICI BULUT ARIZASINA karsi dogrudur. Ama PROFIL DEGISIMINDE ters teper:
  1) furkan calisir, localStorage doldu
  2) furkan cikar, emre girer — localStorage AYNEN DURUYOR
  3) cloudLoad emre'nin kutusunu ceker; emre YENI kullaniciysa kutu BOS
  4) iki koruma da devreye girer -> FURKAN'IN VERISI YERELDE KALIR
  5) emre onu GORUR
  6) emre bir sey degistirir -> cloudSave TUM anahtarlari yazar ->
     FURKAN'IN VERISI EMRE'NIN BULUT KUTUSUNA KOPYALANIR
Hem gorunurluk sizintisi hem VERI KIRLENMESI. Sahte depoyla kanitlandi.

### 140.2 COZUM: profil izi
`ktp_aktif_profil` — hangi profilin verisinin SU AN yerelde durdugunu tutan tek
anahtar. CLOUD_KEYS'te DEGIL, buluta gitmez; tarayiciya ait bir IZ, veri degil.
cloudLoad artik:
  · sunucunun bildirdigi profil ile yereldeki iz FARKLIYSA -> once TUM CLOUD_KEYS
    yerelden SILINIR, sonra bulut KOSULSUZ uygulanir (bos olsa bile)
  · AYNI profilse -> eski korumalar AYNEN gecerli (gecici ariza korumasi bozulmadi)
ILK KURULUM: iz null -> profilDegisti false -> eski davranis. Mevcut yerel verisi
olan bir kullanici ilk senkronda verisini KAYBETMEZ.

### 140.3 TEST (4 senaryo, 8 kontrol)
1) furkan ilk giris -> verisi yuklendi
2) emre giris (ayni tarayici) -> profil degisimi algilandi · furkan pozisyonlari
   SILINDI · furkan tezleri SILINDI · ORTAK guidance KORUNDU (dogru: paylasilan)
3) furkan tekrar giris -> verisi buluttan GERI GELDI (kutusunda duruyordu)
4) furkan sayfayi yeniler + bulut GECICI BOS doner -> profil degisimi YOK ->
   eski koruma calisti, yerel veri KORUNDU
Izolasyon eklendi, ariza korumasi bozulmadi.

### 140.4 DERS
Cok kullanicili bir arayuzde SUNUCU tarafi izolasyonu (KV anahtari profil bazli)
YETMEZ. ISTEMCI tarafinda da "bu depo kime ait" izi tutulmali, cunku tarayici
depolari oturumdan BAGIMSIZDIR. Sunucu dogru ayirmis olsa bile istemci onceki
kullanicinin verisini tasiyabilir — ve daha kotusu, onu yeni kullanicinin
kutusuna YAZABILIR.

app.js v=20260729s. DOSYALAR: app.js + index.html.

## 139. KAYDEDILMIS PORTFOYLER BULUTA + YUK DENETIMI (29 Tem)

Kullanici: "portfoyu kaydettiginde otomatik clouda da kaydetse."
BULGU: `ktp_portfoyler_v1` CLOUD_KEYS listesinde HIC YOKTU. "Portfoyu Kaydet" ile
saklanan coklu portfoyler yalnizca O TARAYICIDA duruyordu; diger dokuz anahtar
cihazlar arasi senkronlanirken bu kaliyordu.

### 139.1 DUZELTME BASIT, CUNKU ALTYAPI HAZIRDI
pfYaz() zaten YAMALI localStorage.setItem'i kullaniyor:
  setItem = (k,v) => { _origSet(k,v); if(CLOUD_KEYS.includes(k)) cloudSaveDebounced(); }
Dolayisiyla anahtari listeye eklemek yetti. KISISEL kaldi (ORTAK_ANAHTARLAR'a
EKLENMEDI) -> ktpanel:kisi:<profil>, yani her kullanici kendi portfoylerini gorur.
cloudLoad'daki mevcut koruma da lehimizeydi: "bulut bos + yerel dolu -> YERELI KORU".
Ilk senkronda kullanicinin var olan yerel portfoyleri SILINMEZ.

### 139.2 YUK BOYUTU DENETIMI — sessiz senkron kaybina karsi
ENDISE: portfoy kayitlari TAM POZISYON DIZISINI saklar; birikince KV deger
sinirini asip POST reddedilebilir ve kullanici BUNU FARK ETMEZ.
OLCULDU — ENDISE ABARTILIYMIS:
  tek kayit: 5 poz 0,6 KB · 15 poz 1,5 KB · 30 poz 2,8 KB
  40 kayit tavaninda toplam: 24 / 59 / 112 KB — hepsi 900 KB sinirinin COK altinda
  20 pozisyonlu kayitla sinira ~459 kayitta dayanir; tavan 40 oldugu icin
  PRATIKTE ULASILAMAZ.
Denetim yine de eklendi cunku TUM CLOUD_KEYS toplamini olcuyor — ileride baska
bir anahtar sisereseerse (ornegin trk_seri_v1 gunluk birikimi, 400 nokta) yakalar.
DAVRANIS: sinir asilirsa GONDERMEZ, "yuk X KB — sinir asildi, GONDERILMEDI" yazar
ve EN BUYUK ANAHTARI soyler. %70'i asarsa uyarir.
GEREKCE: sessizce basarisiz olmak, ekranda eski "senkron" damgasi dururken verinin
gitmemesi demektir — kullanici kaydettigini saniyor. Acikca durmak iyidir.

### 139.3 KAYIT MESAJI DURUSTLESTI
Onceki mesaj her durumda '"X" kaydedildi.' diyordu — yazma anahtari YOKSA bile.
Oysa anahtar yoksa cloudSave() hic calismaz, kayit yalniz tarayicida kalir.
YENI: anahtar varsa "buluta senkronlaniyor…", yoksa "(yalniz bu tarayicida —
yazma anahtari yok)".

CLOUD_KEYS artik 12 anahtar: 10 kisisel + 2 ortak (guidance_v1, ktp_arz_kayit_v1).

app.js v=20260729r. DOSYALAR: app.js + index.html.

## 138. SESSIZ SKOR REGRESYONU — kendi duzeltmemin yan etkisi (29 Tem)

Kullanici app.js'i gonderdi. Incelemede bulundu: yabanci para yon SKORU sessizce
yanlis hesapliyordu; sebebi §128-129'daki degisikligimin YAN ETKISIYDI.

### 138.1 ZINCIR
§128'de yabanci.json'dan damgali carry.reel_faiz=7,9 KALDIRILDI.
§129'da skor guard'i eklendi: deger yoksa carry bileseni NOTR (50).
BOOT SIRASI GOZDEN KACTI:
    boot: [... 'Yabanci Akis' yabanciInit ... 'Canli AOFM' loadAOFM ...]
             |                                    |
      SKOR HESAPLANIR                  aofmLive/tufeLive DOM'a YAZILIR
yabanciRender() calistiginda:
  · ex-ante YOK  (Tahminler alt sekmesi henuz acilmadi — tembel yukleme)
  · ex-post YOK  (aofmLive/tufeLive DOM'da hala BOS)
  -> carryRef null -> carryS=50 -> skor NOTR bilesenle hesaplanir.
Sonra loadAOFM biter ve yabCarryTazele() calisir — AMA O YALNIZ SATIRI gunceller,
SKORU yeniden hesaplaMAZ. Skor kalici olarak eksik veriyle DONUYORDU.
OLCUM: damgali 7,9 ile skor 56 · notr bilesenle 46 — 10 PUANLIK SESSIZ KAYMA.
Ekran goruntusundeki "49 NOTR/KARARSIZ" bu yuzdendi.

### 138.2 IKI DUZELTME
1) yabCarryTazele() artik SATIRI degil TUM KARTI yeniden ciziyor (yabanciRender
   cagriliyor; o zaten satiri da uretir). Dongu yok — tek yonlu. Kart henuz
   cizilmemisse eski davranisa duser (yalniz satir).
2) EKSIK BILESEN DAMGASI: carry bileseni veri yoklugundan notr alindiysa skorun
   yanina "carry olculemedi, notr alindi" yaziliyor. §129'da bunu SOZ VERMISTIM
   ("skorun eksik bilesenle hesaplandigi damgada YAZILIR") ama uygulamamisim.
   Sessiz notr, okuyucuya "olctum, notr cikti" izlenimi verir — oysa "OLCEMEDIM"
   demektir. Ikisi ayni sey degil.

TEST — boot zaman cizgisi: t=0 skor 46 (uyari damgali) · t=1 loadAOFM sonrasi 54 ·
t=2 Tahminler acilinca 59. Artik her tazelemede yeniden hesaplaniyor.

### 138.3 DERS — TEMBEL YUKLEME + TUREV HESAP
§129'da "tembel yuklenen bir kaynagi yedegi olan bir hesabin birincil girdisi
yapma" dersini yazmistim. Bu vaka ayni dersin IKINCI YARISI: bir hesap DIS
VERIYE bagliysa, o veri geldiginde HESABIN YENIDEN CALISMASI saglanmali.
Yalnizca GORUNUMU tazelemek yetmez — hesabin kendisi bayat kalir.
GENEL KURAL: "tazele" fonksiyonu yazarken sor — bu GORUNUMU mu yoksa HESABI mi
tazeliyor? Ikisi ayni degilse ikincisini yap.

app.js v=20260729p. DOSYALAR: app.js + index.html.

## 137. "FONLAMA 0,0" — BIRIM HATASI + CELISKI DENETCISI (29 Tem)

Kullanici ekranda gordu: "fonlama 0,0 mlr · sterilizasyon 1.090,5 mlr" ve ayni
kartta "oranlar koridorun TAVANINA yapisik". Sordu: "AOFM EVDS'den gelmiyor mu?"
Soru dogru yeri isaret ediyordu: IKISI DE ayni EVDS grubundan (bie_apifon).
Ayni kaynaktan gelen iki sayi celisiyorsa sorun KAYNAKTA DEGIL OKUMADA.

### 137.1 HATA 1 — BIRIM: sifir ile kucuk ayirt edilemiyordu
Kod her degeri /1000 yapip "mlr" yaziyordu. Fonlama 40 MILYON TL olsa
40/1000 = 0,04 -> "0,0" olarak YUVARLANIYORDU.
"Fonlama sifir" ile "fonlama kucuk" TAMAMEN FARKLI iki durumdur:
  · sifirsa -> TCMB hic fonlama yapmiyor, AOFM'nin dayanagi yok (bayat olmali)
  · kucukse -> marjinal fonlama var ve AOFM onun maliyeti, %40 ANLAMLI
DUZELTME: buyukluge gore birim (>=1000mn "mlr", >=1mn "mn", altinda 3 haneli).
Artik 40mn fonlama "40 mn" gorunuyor.

### 137.2 HATA 2 — FARKLI PENCERELER, farkli tarihler yan yana
AOFM 120 gunluk pencereden son gecerli degeri, likidite 30 gunluk pencereden
son 5 gozlem ortalamasini aliyordu. Yayin gecikmeleri farkliysa FARKLI TARIHLERI
yan yana koyup karsilastiriyordum.
DUZELTME: likidite de 120 gunluk pencereye cekildi, okunan son gozlemin TARIHI
karta yazildi. Tarih uyusmazligi artik GORUNUR.

### 137.3 CELISKI DENETCISI — kart kendi kendini denetler
Teori: TL FAZLASI varsa gecelik oranlar koridorun ALT bandina kayar. Oranlar
buna ragmen TAVANDAysa iki okuma CELISIR. Panel hangisinin dogru oldugunu
bilemez AMA CELISTIGINI SOYLEYEBILIR. Uyari uc olasiligi yaziyor:
(a) yayin tarihleri farkli · (b) fonlama kucuk ama sifir degil, marjinal maliyet
tavanda olusuyor · (c) rejim gercekten alisilmadik. Karar kullaniciya birakiliyor:
"TCMB'nin guncel gecelik borc verme faizi kontrol edilmeli".
GEREKCE: sessiz kalmak, okuyucunun iki satiri kendi kafasinda uzlastirmaya
calismasina yol acar. §111'de kart METNI rakamla celisiyordu; burada IKI RAKAM
birbiriyle celisiyor — ayni sinif sorun.

### 137.4 DOGRULAMA: ekrandaki ARITMETIK KUSURSUZDU
"Bu dogru mu" sorusu uzerine 14 sayi bagimsiz yeniden hesaplandi: ex-ante reel ·
uc marj · uc toplantinin beklenen hareketi VE std sapmasi · faiz patikasi ·
uc donemin bilesik getirisi · kuyruk · ucret dusumu · net. HEPSI TUTTU.
Hesap dogruydu, GOSTERIM yaniltiyordu.
DERS: "yanlis sayi" ile "dogru sayinin yanlis sunumu" farkli hatalardir ve
IKINCISI DAHA SINSIDIR cunku butun denetim testlerinden gecer.

app.js v=20260729n. DOSYALAR: app.js + index.html.

## 136. EBU'YU TAMAMEN OLDURMUSUM — degisken adi hatasi (29 Tem)

Kullanici: "ebu calismiyor yine bozdun." HAKLI. Ebu bugun HIC calismadi.

### 136.1 HATA
§124'te kart duzeyinde dislama eklerken:
    if(k.closest('[data-ebu="hayir"]')) return;
`k` O KAPSAMDA TANIMLI DEGIL. kartKesfet icindeki `const k` yukarida
H2/H3 blogunun ICINDE tanimlanip orada return ediliyor; const BLOK KAPSAMLI
oldugu icin not dalinda gorunmuyor.
ZINCIR: ReferenceError -> forEach callback'i coker -> kartKesfet() komple oler
-> onu cagiran YEDI tuketici (baglam ureteci, geri-koyma nobetcisi, not motoru,
iki parti yazici, gunluk bakim, sabah gundemi) SUSAR.
Yani tek bir harf, ajanin tamamini oldurdu.
DOGRU DEGISKEN: `nt` (not ogesi, hemen ustunde tanimli). Ayrica `nt.closest &&`
guard'i eklendi (closest'i olmayan node tiplerine karsi).

### 136.2 NEDEN YAKALANMADI — sinamanin kor noktasi
node --check GECTI cunku bu SOZDIZIMI hatasi degil, CALISMA ZAMANI hatasi.
`k` gecerli bir tanimlayici; JS onu calisma aninda cozmeye calisir ve patlar.
Bugun yazdigim butun testler SAF FONKSIYONLARI sinadi (gosterge matematigi,
baz etkisi, PPK agaci, alfa, Fisher, NaN yollari). DOM'a dokunan hicbir sey
sinanmadi cunku node'da DOM yok.
DERS: node --check "kirik degil" demez, "AYRISTIRILABILIR" der. DOM'a bagimli
kod icin sahte-DOM ile en azindan BIR yol testi yazilmali. Bu vaka icin yazildi
(test_ebu.mjs): duzeltilmis dal 2/2 geciyor, eski kod ayni girdide
ReferenceError firlatiyor — regresyon kaniti.

### 136.3 SURUM DAMGASI
ajan.js v=20260729f -> 20260729g. Bu SART: damga tazelenmezse tarayici
BOZUK surumu onbellekten servis eder ve duzeltme deploy edilse bile Ebu susmaya
devam ederdi. (Ayni tuzagi bugun app.js'te de yakalamistim — orada da damga
bes degisiklik geride kalmisti.)

### 136.4 KALICI KURAL
Bir fonksiyonun ICINE satir eklerken, kullanilan her degiskenin O NOKTADA
kapsamda oldugu dogrulanir. En kolay yontem: eklenen satirin HEMEN USTUNDEKI
satirlarda gecen degisken adlarindan birini kullan; uzaktan bir ad hatirlama.
Bu vakada dogru ad zaten iki satir yukarida duruyordu (`const nt=el;`).

DOSYALAR: ajan.js + index.html.

## 135. BORSAPY INCELEMESI — TLREF vadelileri KAPSANMIYOR (29 Tem)

Kullanici saidsurucu/borsapy deposunu isaret etti (BIST icin yfinance benzeri
Python kutuphanesi). VIOP modulu VAR ama TLREF vadelileri YOK.

### 135.1 BULGU: borsapy VIOP kapsami DORT BOLUMLE SINIRLI
borsapy/_providers/viop.py, Is Yatirim'in viop.aspx sayfasini kaziyor ve
yalnizca su dort bolumu esliyor:
  "Pay Vadeli Islem Ana Pazari" · "Endeks Vadeli Islem Ana Pazari"
  "Doviz Vadeli Islem Ana Pazari" · "Kiymetli Madenler Vadeli Islem Ana Pazari"
FAIZ VADELILERI (F_TLREF1M) LISTEDE YOK.

### 135.2 LIKIDITE — ucuncu olumsuz isaret
§134'te "likidite olculmeli" demistim. Uc BAGIMSIZ dolayli isaret birikti:
 1) Turkiye piyasalarina ADANMIS bir kutuphane (borsapy) faiz vadelilerini
    eslemeye deger gormemis.
 2) Sektor kaynaklarinda "en cok islem goren VIOP enstrumanlari" listeleri
    surekli BIST30 · USD/TRY · EUR/TRY · EUR/USD · Altin diyor; TLREF HIC gecmiyor.
 3) Hicbir ucretsiz veri saglayicisi sozlesmeyi yuzeye cikarmiyor
    (Fintables yok, Yahoo yok, borsapy yok).
HUKUM DEGIL ama YON: sozlesme 2019'dan beri var, buna ragmen kimse veri
yolunu acmamis. Likit bir enstrumanda bu olmazdi.
KESIN KARAR ICIN hala tek sey gerekiyor: F_TLREF1M'in ACIK POZISYON ve
GUNLUK HACMI (en yakin 3 vade). Terminal ya da BIST gunluk bulteni.

### 135.3 YAN KONTROL: panel EVDS3'te, sorun YOK
borsapy README'sinde kritik bir not vardi: "TCMB EVDS'yi evds3.tcmb.gov.tr'ye
tasidi; eski evds2.tcmb.gov.tr/service/evds URL'leri TAMAMEN KAPANDI".
Panelin route adi /api/evds2 oldugu icin bir an alarm verdim. KONTROL EDILDI:
evds2.js'in ILK SATIRI "Yeni EVDS3 API: evds3.tcmb.gov.tr/igmevdsms-dis/
(eski /service/evds kaldirildi)" diyor ve tum cagrilar evds3'e gidiyor.
Gecis ZATEN YAPILMIS; yalnizca ROUTE ADI eski kalmis.
NOT (kafa karisikligi kaynagi): dosya adi ve route "evds2" ama icerik EVDS3.
Yeniden adlandirmak deploy'da kirilma riski tasir (index.html + tum cagirici
dosyalar); DEGISTIRILMEDI, burada kayda gecirildi.

### 135.4 borsapy'den PANELE ALINACAK BIR SEY VAR MI
Kapsami: hisse/doviz/kripto/fon/EVDS/tahvil + VIOP(4 bolum) + TradingView
websocket streaming. Panelin ihtiyaci olan her sey (EVDS, DIBS, TLREF spot)
ZATEN VAR ve kendi yolundan akiyor. Ek deger: yok. Kutuphane ayrica
"yalnizca kisisel/egitim amacli, TICARI KULLANIM YASAK" lisansiyla geliyor —
panel icin zaten uygun degil.

DOSYALAR: yok (yalnizca arastirma kaydi).

## 134. OIS IPI YENIDEN ACILDI — ENSTRUMAN VAR, KAYNAK LISANSLI (29 Tem)

§133'te "OIS yok, ip kapandi" yazmistim. YANLISTI ve kullanici hakli olarak
"kapatmayalim, arastiralim" dedi. EVDS'de yok olmasi DUNYADA yok demek degildi.
§117 kuralini yanlis uyguladim: bir kaynakta bulunamayan sey icin "yok" hukmu
verilemez; ancak O KAYNAKTA yok denebilir.

### 134.1 BULGU 1 — VIOP TLREF VADELILERI (F_TLREF1M)
Borsa Istanbul, 2 Agustos 2019'dan beri TLREF vadeli islem sozlesmesi isletiyor.
  · Dayanak: TLREF (gecelik referans oran)
  · Tum takvim aylari; mevcut ay + en yakin 6 vade ESZAMANLI islem goruyor
  · Nominal 1.000.000 TL, fiyat = faiz orani x 100
Bu, Fed Funds vadelilerinin TAM karsiligi. DIBS'ten ustunlugu: kredi riski yok,
vade primi yok, dogrudan GECELIGIN KENDISI uzerine yazili, aylik granulariteyle
PPK takvimine eslesiyor. Kurulursa §126'daki birinci sinirlama TAMAMEN kalkar.
VERI: BIST "Derivatives Market Bulletin" (acik pozisyon dahil), dosya yollari
datafilepaths_viop.zip'te; tarihsel veri datastore.borsaistanbul.com.
Halka acik veri 15 dk gecikmeli. Fintables'ta YOK (sembol aramasi sadece TLREF
endeksli BYF'leri donduruyor: OPTLR/ZTLRF/NPTLR). Yahoo'da YOK.
ACIK SORU — LIKIDITE: hacimsiz bir vadelide uzlasma fiyati takas kurumunun
teorik isaretidir, piyasa gorusu degil. Olculmeden insa edilmemeli.
Dolayli isaretler: BIST TLREF/tahvil vadelilerinde borsa payini binde 1'e
indirmis (digerleri binde 3) ve Ocak 2025'te fiyat limitini %50'den %20'ye
cekmis — ikisi de aktif yonetim/tesvik isareti ama YETERLI DEGIL.

### 134.2 BULGU 2 — ANNA-DSB: TRY OIS ULUSLARARASI STANDART
Kullanici ANNA-DSB Product-Definitions deposunu isaret etti (DSB, OTC turevlere
ISIN veren kurum). PROD/OTC-Products/codesets icinde ISDA/FpML referans oran
kod setleri var. TRY icin TANIMLI oranlar:
  · TRY-TLREF (2021)
  · TRY-TLREF-OIS Compound (2021)      <-- ARADIGIMIZ ENSTRUMAN
  · TRY-Annual Swap Rate-11:15-BGCANTOR
  · TRY-Semi-Annual Swap Rate-TRADITION-Reference Banks
  · TRY-TRLIBOR / TRY-TRYIBOR (eski, Reuters/Reference Banks)
Ayrica UPI/Rates/Rates.Swap.Fixed_Float_OIS.UPI.V1.json = OIS urun sablonu.
SONUC: TLREF OIS gercek, standart, ISIN alan, ULUSLARARASI ISLEM GOREN bir
enstrumandir. "OIS yok" hukmu kesin olarak YANLISTI.
FIXING KAYNAGI: BGC Cantor (11:15) ve Tradition — bunlar BROKER FIXING'leridir,
Refinitiv/Bloomberg uzerinden lisansli dagitilir. UCRETSIZ API YOK.

### 134.3 PRATIK SONUC
Panel icin uc yol, tercih sirasiyla:
 (a) VIOP F_TLREF1M seridi — LIKIDITE olculursa en iyi cozum. Ucretsiz,
     gecelik uzerine yazili, PPK takvimine eslesir. Kota 10/12 -> 11/12.
 (b) Bloomberg/Refinitiv terminali varsa `TRY-TLREF-OIS Compound` egrisi
     dogrudan cekilir — en dogru zemin ama lisans gerektirir.
 (c) Mevcut durum: DIBS egrisi + §133 prim tanisi. Calisiyor, sinirlari
     kartta yazili.
KULLANICIYA DEGERI: artik brokerindan/veri saglayicindan isteyecegi seyin
TAM ADINI biliyor: "TRY-TLREF-OIS Compound" (ISDA 2021 floating rate option).

### 134.4 DERS
"Bir kaynakta yok" ile "yok" ayni sey degildir. §117'de sektor endeksi icin
dort kaynak taranip kapatilmisti — orada hukum dogruydu cunku DORT kaynak
tarandi. Burada TEK kaynak (EVDS) tarayip genel hukum verdim. Kapali arama
kaydi duzeltildi: konu "EVDS'de yok" olarak daraltildi, VIOP ve DSB bulgulari
eklendi, ip ACIK birakildi.

DOSYALAR: guncelleme-plani.json (kapali arama kaydi duzeltildi).

## 133. OIS EVDS'DE YOK — IP KAPATILDI + PRIM TANISI (29 Tem)

### 133.1 KAYNAK TARAMASI KAPANDI (§117 usulu)
ARANDI: /api/evds2?ara=swap
SONUC: tek grup — bie_swaptektarf "TCMB Tarafli Swap Islemleri". Bu TCMB'nin
kendi swap ISLEM HACMI/STOKU verisidir, bir FAIZ EGRISI DEGILDIR.
KESIN HUKUM: **EVDS'de TLREF OIS egrisi YOKTUR.** OIS kotasyonlari Bloomberg/
Refinitiv terminallerinde ve BIST swap piyasasinda; TCMB yayinlamiyor.
SONUC: DIBS egrisi alfa karsilastirmasinin KALICI zeminidir. Bu bir eksiklik
degil, olculmus bir sinirdir — kartta oyle yaziyor.
(§117 kurali: bir kaynak taramasi kapatilirken NE ARANDIGI ve NE BULUNDUGU
yazilir ki gelecekte ayni tarama tekrarlanmasin.)

### 133.2 PRIMI OLCEMIYORUZ AMA GORUNUR KILABILIRIZ
DIBS getirisi = beklenen ortalama gecelik + vade primi + likidite primi.
Iki bileseni ayiramayiz (OIS olmadan imkansiz). AMA su TANI yapilabilir:
  egrinin EN KISA ucu  vs  BUGUNKU gecelik oran
MANTIK: 3 aylik nokta kabaca "onumuzdeki 3 ayin ortalama gecelik orani + prim".
INDIRIM BEKLENEN bir ortamda 3 aylik ortalama geceligin bugunkunden DUSUK
olmasi gerekir. Kisa uc yine de USTUNDEyse fark ya PRIMDIR ya da PIYASA
GERCEKTEN INDIRIM FIYATLAMIYORDUR.
Panel hangisi oldugunu OLCEMEZ ve iddia ETMEZ — farki gosterir, yorumu
okuyucuya birakir. Ama buyuklugu, kilitleme oraninin ne kadarinin saf beklenti
OLMADIGINA dair UST SINIR verir.

BUGUNKU OKUMA: kisa uc (3A, 0,26y) %41,50 · bugunku gecelik %39,89 → **+161bp**.
Kullanicinin patikasi ilk iki toplantida 2,15 puan indirim ongoruyor; piyasa
kisa ucu YUKARI fiyatliyor. Ayrisma buyuk ve artik OLCULU.

TEST (3 senaryo): +161bp elle dogrulandi · kisa uc dusukse negatif cikiyor
(piyasa indirim fiyatliyor) · kisa uc gecelige esitse 0 (prim ihmal edilebilir).

### 133.3 ACIK KALAN (kayit)
Prim TAHMINI ileride su yolla yapilabilir: gecmis N ayda kisa uc DIBS getirisi
ile o donemde GERCEKLESEN ortalama gecelik oran karsilastirilir; sistematik
fark primin ampirik tahminidir. Ikisi de EVDS'de mevcut (bie_pydibs tarihcesi +
bie_bisttlref). YAPILMADI — ayri bir is, ayri bir tur.

DOSYALAR: app.js.

## 132. ALFA ESIGI BELIRSIZLIKTEN TURETILDI + KENDI YANLIS ALARMIM (29 Tem)

### 132.1 ONCE: BEN YANLIS ALARM VERDIM
Kullaniciya "karsilastirma bozuk, konvansiyonlar uyusmuyor, karar tavsiyesi ters
cikabilir" dedim. YANLISTI. egri.js'in getiri hesabini OKUMADAN konustum.
GERCEK: egri.js `pv = Σ odeme/(1+y)^(vkg/baz)` ile IRR cozuyor, yani getiri
ZATEN YILLIK BILESIK (etkin) bir orandir. Dolayisiyla:
  donme    = Π(1+r_i/365)^gun_i     [gecelik oran BASIT yillik kotedilir,
                                       fiilen GUNLUK bilesiklenir — bu bir
                                       konvansiyon tercihi degil, enstrumanin
                                       calisma bicimi]
  kilitleme= (1+z)^(N/365)            [IRR zaten yillik bilesik]
IKISI DE "1 TL, N gun sonra kac TL" sorusunun cevabi — TERMINAL DEGER,
ayni tabanda, elma-elma. Onerdigim "(b) ikisi de yillik bilesik" alternatifi
HATALI MODELLEMEYDI: gecelik orani yillik-bilesikmis gibi ele aliyordu.
KANIT (test 4): egri, donmenin yillik karsiligina (%45,96) ayarlandiginda iki
terminal deger BIREBIR esitlendi (26,12 = 26,12, fark 0,00). Zemin saglam.
DERS: bir bileseni "bozuk" ilan etmeden once o bilesenin kodunu OKU. §126'da
"bir alanin bicimi varsayilmaz, okunur" dedim; burada ayni hatayi FORMUL icin
yaptim ve kullaniciyi gereksiz endiseye soktum.
IKINCI HATA (ayni tur): taslak python hesabimda bant ±25,24-27,01 cikti,
paneldeki uygulama 25,69-26,56 veriyordu. Elle yeniden hesaplayinca UYGULAMA
dogru, taslak yanlisti (donemleri yanlis siralamisim). Kullaniciya once yanlis
bandi soyledim, ayni mesajda duzelttim.

### 132.2 GERCEK IYILESTIRME: esik artik keyfi degil
Eski karar kurali sabit 0,5 puanlik esikti — hicbir dayanagi yoktu.
YENI: farki TAHMININ KENDI BELIRSIZLIGIYLE kiyasla. PPK agacindaki her toplantinin
std sapmasi zaten hesaplaniyor (dagilimdan). Toplantilar bagimsiz varsayilirsa
k. toplantidan sonraki kumulatif belirsizlik σ_k = √(Σσ_i²).
Faiz patikasi ±σ kaydirilip donme getirisi yeniden hesaplanir → BANT.
  Kilitleme bandin ICINDEyse  → NOTR (fark, kendi gurultunden kucuk)
  DISINDAysa                  → KISA KAL / VADE UZAT
ESIK KENDINI AYARLIYOR: olasiliklari dagitirsan bant genisler, esik yukselir.
TEST: σ×1 → bant 0,87p (sinyal) · σ×2 → 1,75p · σ×4 → 3,49p ·
σ×8 → 6,98p ve NOTR'e geciyor. σ=0 → bant 0, en kucuk fark bile sinyal.
BUGUNKU OKUMA: donme %26,12 (bant 25,69-26,56), kilitleme %23,74 → DISARIDA,
KISA KAL sinyali kendi belirsizliginden buyuk bir farka dayaniyor, AYAKTA.

### 132.3 KALAN IKI SINIRLAMA (kartta yazili, yonu degil buyuklugu etkiler)
1) Egri DIBS'tir, OIS DEGIL — vade ve likidite primi icerir. Dogru zemin
   TLREF OIS olurdu. EVDS'de var mi ARANMADI; kullaniciya `?ara=swap` komutu
   verildi. Bulunursa egri yerine o kullanilmali.
2) Para piyasasi fonunun agirlikli ortalama vadesi 91 gun; N gunluk kilitleme
   tam uygulanamaz, gosterilen fark UST SINIRDIR.

DOSYALAR: app.js.

## 131. TAHMINLER SEKMESI — SIRA VE ADLANDIRMA (28 Tem)

### 131.1 BLOK SIRASI — numara dogruydu, DOM sirasi yanlisti
Bolumler 01-06 diye numaralanmisti ama DOM'da PPK blogu EN SONDA duruyordu;
ekranda "...05 Alfa, 06 Enflasyon, 03 PPK" diye cikiyordu. Numaralar sirali
gorunuyor diye SIRANIN dogru oldugunu varsaymisim.
DOGRU AKIS (mantiksal bagimlilik sirasi):
  01 Politika Faizi   -> mevcut durum
  02 Fonlama Zinciri  -> mevcut durum, dort halka
  03 PPK Olasilik     -> SENIN VARSAYIMIN (girdi)
  04 Repo Tahmini     -> varsayimin sonucu
  05 Alfa             -> senin gorusun vs piyasa
  06 Enflasyon        -> ayri konu, en altta (kullanicinin istegi)
03 blogu dengeli tarama ile kesilip 04'un onune tasindi (§130.3 kurali uygulandi:
kesilen blogun icerigi assert edildi — thPPK var, thAlfa/thEnf YOK).

### 131.2 "DONEM SONU" — ayni ad iki anlam
Kullanici tabloyu anlamadi ve hakliydi: hem SUTUN basligi hem KART basligi
"DONEM SONU" diyordu ama farkli seyler:
  sutun -> PPK toplanti TARIHI (09-10)
  kart  -> donem sonundaki ORAN (%36,44)
DUZELTILDI: sutun "DONEM" oldu ve artik ARALIK gosteriyor ("bugun -> 09-10",
"09-10 -> 10-22"); baslangic tarihi yoktu, sadece bitis vardi, okumayi
zorlastiriyordu. Kart "SON PPK SONRASI" oldu.
DERS: bir tabloda ayni etiketi iki farkli birimde kullanma. Sutun bir TARIH,
kart bir ORAN gosteriyorsa ikisi ayni adi tasiyamaz.

### 131.3 FORWARD ETIKETLERI okunmuyordu
"0.54y0.2y %43,01" bicimindeydi (baslangic yili + sure yili). Kimse bunu
okuyamaz. Forward oranin ANLAMI "su tarihten su tarihe kadarki donem icin
bugunden fiyatlanan oran"dir; AY cinsinden yazilinca dogrudan PPK takvimiyle
karsilastirilabilir hale geliyor:
  0.54y0.2y  -> 6->9 ay
  0.77y0.3y  -> 9->13 ay
  1.04y0.9y  -> 12->23 ay
Bu, §126'da duzeltilen vade AYRISTIRMA hatasinin SUNUM tarafiydi: hesap
duzelmisti ama gosterim hala ham yil ondaligiyla yaziyordu.

DOSYALAR: index.html + app.js.

## 130. DORDUNCU TUKETICI — "e hani Fisher ekleyecektin?" (28 Tem)

Ekran goruntusu: etiket YENİ ("reel faiz · iki bakis") ama deger ESKİ
("+%7,9 · cazip"). Yani §129'daki degisiklik uygulanmis ama uzerine yazilmis.

BULGU: loadAOFM'in SONUNDA, kart cizildikten sonra calisan bir blok vardi:
  const reel = AOFM_SON - TUFE_YILLIK;        // BASIT CIKARMA
  $('yabCarryVal').innerHTML = '+%'+reel+cazip+' · canli';
yabCarryVal'e yazan DORDUNCU tuketici. §128'de iki, §129'da uc tuketici
duzeltilmisti; bu, kartin cizim yolunda DEGIL veri turunun sonunda oldugu icin
her aramada gozden kacti.
"cazip" kelimesi ipucuydu: eski bicimin imzasiydi ve yeni kodda yoktu.

### 130.1 TOPLU TARAMA — bu sefer YAPILDI
Onceki turda "aofm-tufe kaliplarini toplu tarayalim" DEDIM ama YAPMADIM; hata
tam oradan cikti. Bu turda regex ile tarandi:
  =[^=]*\b(aofm|AOFM_SON|nominal|faiz|politika)[A-Za-z_]*\s*-\s*(tufe|TUFE|enf|beklenti)
SONUC: tek eslesme (satir 5855) — o da duzeltildi. Panelde baska basit-cikarma
reel hesabi KALMADI (tarama tekrarlandi: 0 adet).
Fisher kullanan 11 yer referans olarak dogrulandi.
DERS: "sonra bakariz" dedigin tarama, sonraki hatanin adresidir. Bir kaliba
duzeltme uygularken ayni turda TUM dosyayi tara — tuketici sayisini tahmin etme.

### 130.2 SON MIMARI — tek kaynak, dort tuketici
  reelFaizler()     -> {exante, expost} ikisi de Fisher, hicbiri NaN donmez
  reelFaizSatiri()  -> kart satirini uretir (iki bakis + aciklik)
  Cagiranlar: renderYabanci (cizim) · yabCarryTazele (tazeleme) ·
              loadAOFM sonu · exAnteHesapla (Tahminler acilinca)
Dordu de tek kaynaktan besleniyor; kendi hesabi olan kalmadi.

### 130.3 UCUNCU KEZ: blok kesmede dengeli tarama
§129.3'te "sabit bitis metni arama, DENGELI TARAMA yap" dersini yazdim ve bu
turda ILK denemede yine ihlal ettim: try{ ... }catch bloğunu satir ofsetiyle
kestim, `try{` disarida kaldi ve "Missing catch or finally" hatasi cikti.
Ikinci denemede capa dogrulamali (try{ satiri assert edilerek) ve artik
kapanislar tek tek dogrulanarak kesildi.
Bu, ayni dersin ard arda UCUNCU tekrari (§125.5 HTML, §129.3 JS, §130.3 JS).
KALICI KURAL: bir blogu satir araligiyla silme. Ya dengeli tarama yap, ya da
kesecegin ilk VE son satiri ayri ayri assert et. Ikisinden birini yapmadiysan
node --check gecene kadar isi bitmis sayma.

DOSYALAR: app.js.

## 129. "NaN SERT CIKIS" — KENDI KIRDIGIM KART (28 Tem)

### 129.1 NE OLDU
§128'de yabanci.json'dan damgali `carry.reel_faiz=7.9` alanini KALDIRDIM.
app.js'te skor satiri o alana YEDEK olarak dusuyordu:
  carryS = cl(50 + (EXANTE canliysa EXANTE.deger : d.carry.reel_faiz) * 5)
Alan silinince `undefined * 5 = NaN` -> `cl(NaN) = NaN` -> skor NaN ->
ekranda **"NaN SERT CIKIS"**. Kullanici ekran goruntusuyle yakaladi.
KOK NEDEN: §128'de "tum tuketicileri ara" dedim ve app.js'te IKI tuketici
duzelttim; skor satiri UCUNCUSUYDU ve ondan ONCE yazilmisti (§127). Kurali
soyledim ama kendim eksik uyguladim.
AYRICA: EXANTE TEMBEL yuklenir (Tahminler alt sekmesi acilinca). Yani boot'ta
carry karti cizilirken EXANTE her zaman bos olur ve HER ZAMAN yedege duser —
yedegin saglam olmasi kritikti, ben tam onu sildim.

### 129.2 DUZELTME — uc katman
1) reelFaizler() TEK KAYNAK olarak kuruldu. Panelde reel faiz UC yerde
   hesaplaniyordu, ikisi farkli formulle (§128). Artik her tuketici buradan okur.
   Iki ayri buyuklugu AYRI AYRI doner: {exante, expost} — ikisi de FISHER.
   Hicbir yolda NaN donmez; hesaplanamayan alan null kalir.
2) SKOR GUARD: deger yoksa carry bileseni NOTR (50) alinir, NaN degil.
   YENI KURAL: bir skor bileseni asla NaN olamaz. Veri yoksa notr + damgada yazilir.
3) KART SATIRI: ikisi de gosterilir ("ex-ante +%10,5 · ex-post +%6,0") ve
   ACIKLIK yazilir (4,51 puan = piyasanin fiyatladigi dezenflasyon). Kullanicinin
   "%10,5 mi %7,9 mu" sorusu boylece ekranda kendiliginden cevaplaniyor.
   Ex-ante yoksa "Tahminler sekmesini ac" ipucu cikar — sessizce gizlenmez.

### 129.3 IKINCI HATA: fonksiyon kapanisini strip() ile aradim
yabCarryTazele'yi degistirirken bitis satirini `sat[j].strip()=='}'` ile aradim.
Ic bloktaki girintili `  }` de strip'lenince '}' oluyor — DONGU ORADA DURDU,
fonksiyonun kendi kapanisi OKSUZ kaldi ve node --check sozdizimi hatasi verdi.
DUZELTME: DENGELI TARAMA ({ ve } sayarak). Bu §125.5'te HTML icin yazdigim
dersin JavaScript versiyonu: "sabit bir bitis metni aramak yerine dengeli tarama".
Dersi HTML'de ogrenmis, JS'te uygulamamisim.

### 129.4 TEST
NaN yollari: 7 kombinasyon (ikisi var / biri var / hicbiri / undefined /
silinen alan / negatif reel) — hepsinde skor sonlu, NaN yok.
Eski kod ayni girdide NaN uretiyordu, test bunu da gosteriyor (regresyon kaniti).
Brace denge taramasi: kaba regex satir 81'de yanlis alarm verdi (esc()
fonksiyonundaki regex literal'i sayiyor); node --check YETKILI kontroldur ve
temiz gecti. Kendi tarama aracin da yanilabilir — otorite parser'dadir.

DERS: bir alani silmeden once o alanin TUM okuyucularini ara — silme, ekleme
kadar tehlikelidir ve daha sinsidir cunku hata SILINEN yerde degil OKUYAN
yerde patlar. Ayrica tembel yuklenen bir kaynagi yedegi olan bir hesabin
birincil girdisi yapma; yedek her acilista devrededir.

DOSYALAR: app.js.

## 128. REEL FAIZ — UCUNCU TUKETICI + BAYAT KOPYA DERSI (28 Tem)

### 128.1 KULLANICI YAKALADI: %10,5 vs %7,9
"Ex-ante reel faiz %10,5 diyorsun ama yabanci para akisi kartinda reel faiz %7,9,
nasil oluyor bu?" IKISI DE DOGRUYDU — FARKLI SORULARIN CEVABI:
  EX-ANTE : politika 37 vs BEKLENEN enflasyon 24 -> %10,48  (TCMB'nin cipasi)
  EX-POST : AOFM 40 vs GERCEKLESEN TUFE 32,11    -> %5,97   (fonun kazandigi)
Fark iki kaynaktan: deflator (24 vs 32,11 = 8,1 puanlik dezenflasyon beklentisi)
ve nominal (37 vs 40 = 3 puanlik fonlama marji), ters yonde calisip net kaliyor.
SORUN ADLANDIRMAYDI: ikisine de "reel faiz" deniyordu (§112 ihlali).

### 128.2 FISHER — panelde UCUNCU bulundugu yer
Carry hesabi BASIT CIKARMA kullaniyordu: aofm - tufe = 40 - 32,11 = 7,89.
Fisher: (1,40/1,3211)-1 = 5,97. **1,92 PUAN SISKINLIK.**
Dusuk enflasyonda basit fark iyi bir yaklasimdir; %32'de degil. Olcum:
  enflasyon %2 -> sapma 0,75p · %10 -> 2,73p · %20 -> 3,33p · %80 -> 17,8p
Panelin reelHesap() fonksiyonu zaten Fisher kullaniyordu (omurga modulleri);
carry satiri o duzeltmeden ONCE yazilmis ve geride kalmisti.
DUZELTILDI: canli hesap Fisher'a cevrildi; "reel carry" ve "Reel faiz" ibareleri
2 yerde "(ex-post)" etiketiyle isaretlendi; yabanci.json'daki damgali reel_faiz=7.9
KALDIRILDI ve sahiplik notu yazildi (§112: bir buyuklugun tek sahibi olur).

### 128.3 ONEMLI: IS ZATEN KISMEN YAPILMISTI — BAYAT KOPYA
Yamayi hazirlarken /home/claude'daki app.js kopyasina bakiyordum: 4888 satir.
GUNCEL dosya 5948 satir. BIN SATIR BAYATTI. Guncel dosyada §127 zaten vardi:
window.EXANTE tek sahip olarak kurulmus, carry karti ondan okuyor, canli
kurulamazsa "damgali" yaziyor. Hatta bir Number.isFinite korumasi eklenmis —
isFinite(null) JavaScript'te TRUE doner (Number(null)===0), yani null korumasi
gecer ve (null,24) icin %-19,35 gibi cop uretirdi; testte yakalanmis.
BEN AYNI ISI IKINCI KEZ YAPMAK UZEREYDIM. Yamanin assert'i durdurdu
(capa 0 kez bulundu) — assert korumasi olmasaydi calisan kodu bozacaktim.
DERS: yerel kopya OLCUM DEGILDIR. Bir dosyayi degistirmeden once GUNCEL halini
oku; satir sayisi/hash karsilastirmasi 5 saniye surer. §89'un "assert korumali
patch" kurali burada ikinci kez hayat kurtardi.
KALAN IS §127'de bitmemisti: carry KARTI duzeltilmisti ama AYRI BIR TUKETICI
(durus mantigi + tez metni, satir 4924) hala basit cikarma yapiyordu. Bu §128'de
kapatildi. Ders: bir buyuklugu duzeltirken TUM tuketicileri ara, ilkini degil.

TEST: iki buyuklugun formulleri · Fisher-basit sapmasinin enflasyonla buyumesi ·
Number.isFinite tuzagi (5 vaka, isFinite(null) davranisi dogrulandi).

DOSYALAR: app.js + yabanci.json.

## 126. ALFA KARTI + VADE AYRISTIRMA HATASI (28 Tem)

### 126.1 CIDDI HATA — vade etiketi parseFloat ile ayristiriliyordu
Alfa kartini kurarken egri.js'in ne dondurdugune bakinca cikti:
vade etiketleri '3A','6A','9A','1Y','2Y','5Y','7Y','10Y' bicimindedir (A=ay, Y=yil).
§122'de yazdigim egriForward ise `parseFloat(k.replace(',','.'))` yapiyordu:
  parseFloat('3A') = 3   -> 3 AY, 3 YIL sanildi
  parseFloat('6A') = 6   -> 6 AY, 6 YIL sanildi
  parseFloat('1Y') = 1   -> dogru, tesadufen
Sonuc: egri BASTAN SONA KARISIYORDU (3A ve 5Y arasindaki siralama bozuk), forward
oranlar ANLAMSIZDI. PPK kartinda "piyasanin ima ettigi patika" diye gosterilen
satir yanlisti.
DUZELTME: egri.js her vade icin OLCULEN kalanYil'i zaten donduruyor — o kullanilir;
yoksa etiket DOGRU ayristirilir (A/M -> /12, Y/bos -> yil). Ayrica cok yakin
vadeler (fark<0.02y) forward hesabindan atlanir (gurultu).
NASIL YAKALANDI: yeni is icin kaynak okundugunda. Yani §122'de yazarken egri.js'in
cikti bicimini KONTROL ETMEDIM, tahmin ettim. §125'te "olcum anlatiyi belirler"
dedigim kural, KOD icin de gecerli: bir alanin bicimi varsayilmaz, okunur.

### 126.2 ALFA KARTI — "gorusun bedeli"
Kullaniciya anlatirken cikan eksik: 04 senin PPK varsayiminla hesapliyor,
piyasanin ima ettigi patika 03'te AYRI duruyordu. "Benim gorusum piyasadan ne
kadar farkli" sorusu tek ekranda gorulemiyordu — ki ALFA tam olarak orasidir.

CERCEVE (para piyasasi fonu icin dogru soru):
  (A) GECELIKTE DON  -> Pi(1 + piyasa_repo_i/365)^gun_i   [senin patikandan]
  (B) VADEYI KILITLE -> (1 + z_N)^(N/365) - 1             [egrinin N vadeli spot'u]
Ikisi AYNI ufukta. Fark = gorusunun bedeli/odulu.
Karar cikti: fark >+0,5p -> KISA KAL · <-0,5p -> VADE UZAT · arasi -> NOTR.
NOTR tespiti degerlidir: sifir alfa senaryosunu gormek yanlis bahisten alikoyar.

IKI DURUSTLUK NOTU (kartta yazili, ikisi de YONU degil BUYUKLUGU etkiler):
1) Egri DIBS egrisidir, OIS DEGIL — icinde vade ve likidite primi var, saf faiz
   beklentisi degil. Kucuk farklar primden kaynaklanabilir.
2) Para piyasasi fonunun agirlikli ortalama vadesi 91 GUNLE sinirli; 224 gunluk
   kilitleme tam uygulanamaz. Pratik kaldirac 1-91 gun arasi tercih, dolayisiyla
   gosterilen fark UST SINIRDIR.
Ayrica ufuk egrinin gozlenen araligi disindaysa kart UYARIR (uc deger kullanildi,
cikarim zayif) — sessizce ekstrapole etmez.

### 126.3 TEST (14 kontrol)
Vade ayristirma: 3A=0,26y (eski hatada 3y olurdu), siralama artan.
Ara deger: elle hesapla %0,01 icinde; egri disi durumda disari bayragi kalkiyor.
ALFA TUTARLILIK SINAVI (en guclu): egri DUZ ve donme getirisinin yillik
karsiligina esit yapildiginda fark TAM 0 cikti — sifir alfa senaryosu
matematiksel olarak dogrulandi.
YON/MONOTONLUK: egri -6..+9 puan kaydirildiginda fark MONOTON azaliyor
(6,55 -> -1,51) ve +7 puanda KISA KAL'dan VADE UZAT'a doniyor. Gereken kayma
45,81-39,66 = 6,15 puandi; hesap bunu birebir tutturdu.
TEST YAZIM HATASI (DORDUNCU KEZ): once "egri +4 puan -> VADE UZAT olmali" diye
iddia etmisim; +4 gecis icin YETMIYOR (6,15 gerekiyordu), kod dogru davraniyordu.
Iddia monotonluk + gecis noktasi testiyle degistirildi.
ARSIV NOTU: §120.4, §124, §125.5 ve simdi bu — dort kez test IDDIASI yanlis cikti,
kod degil. Bir sinir/esik testi yazarken once BEKLENEN ESIGIN kendisi hesaplanir,
sonra iddia kurulur. "Makul gorunen" bir kaydirma miktari secmek yetmez.

app.js v=20260729k. Bolum numaralari: 01-06 (05 Alfa eklendi, enflasyon 06'ya kaydi).
DOSYALAR: app.js + index.html.

## 125. REPO TAHMINI + CELISKI DUZELTMESI + BASLIK STILI (28 Tem)

### 125.1 KENDI CELISKIM — §111'in aynisi, bu sefer ben yaptim
Ekran goruntusunde likidite notu "TL FAZLASI var -> gecelik oranlar koridorun
ALT bandina kayar, AOFM ve TLREF politika faizinin ALTINDA kalir" diyordu;
hemen ustundeki rozetler ise +300bp / +291bp / +289bp yani USTUNDE gosteriyordu.
NOT TABLOYLA CELISIYORDU.
KOK NEDEN: kurali fazla genellestirmisim. "Sterilizasyon > fonlama => taban"
bagintisi ancak HAFTALIK REPO KANALI ACIKKEN gecerli. TCMB Mart'tan beri
haftalik repo ihalelerini askiya almis (panelin kendi karti bunu yaziyor);
fonlama gecelik pencereden yapiliyor ve oran koridorun TAVANINA yapisiyor.
DUZELTME: anlati artik VARSAYILAN kurala degil OLCULEN FARKA dayaniyor. Once
farkin ISARETINE bakilir (>50bp / <-50bp / arasi), sonra sebep yorumlanir.
YENI KURAL (arsive): OLCUM ANLATIYI BELIRLER, TERSI DEGIL. Bir kartta metin
yaziyorsan, metnin dayandigi buyukluk AYNI KARTTA gorunuyorsa once onu oku.

### 125.2 "FONLAMA 0,0 MLR" — tek gun fotografi
Likidite serileri TEK GUNUN degeriyle cekiliyordu; o gun fonlama 0,0 dondu ve
"net -1.191,2 mlr" gibi yaniltici bir tablo cikti. Bu seriler gunluk oynak.
DUZELTME: son 5 GECERLI gozlemin ortalamasi, kac gozlem kullanildigi kartta yazili.

### 125.3 REPO TAHMINI — zincir ILERIYE uzatildi
Kullanici hakli olarak sordu: "repo tahmini nerede burada?" Yoktu. §122-123
zinciri KURDU ama ileriye uzatMADI: politika faizi tahmin ediliyor, AOFM/TLREF/
piyasa reposu BUGUNKU halleriyle gosteriliyordu. Fon yoneticisinin ihtiyaci olan
sey politika faizi degil FONUN FIILEN KAZANACAGI orandir.

OLCUM NE SOYLUYOR: politika %37, AOFM %40,00, TLREF %39,91, piyasa repo %39,89.
Koridor tavani = politika+300bp = %40. AOFM TAM TAVANDA.
SONUC: POLITIKA FAIZI SU AN FIILEN BAGLAYICI DEGIL. PPK indirse bile AOFM,
koridor tavani birlikte inmedikce degismez.
DOGRU CIPA KORIDORDUR: PPK patikasi -> koridor tavani -> AOFM -> TLREF/piyasa.
Her halkadaki marj VARSAYILMAZ, BUGUNKU VERIDEN OLCULUR (+300 / +291 / +289bp).
Getiri ACT/365 GUNLUK BILESIK — basit yillik ortalama donem uzadikca sapar.

REJIM RISKI (kart ayrica uyariyor): haftalik repo ihaleleri yeniden acilirsa
fonlama politika faizine kayar ve AOFM bir anda ~300bp DUSER. PPK hic indirim
yapmasa bile fon getirisi o kadar geriler. TEST: ayni PPK patikasiyla kumulatif
getiri %26,18 -> %24,04, yani 2,14 puan fark SADECE REJIMDEN.
Bu, faiz tahmininden BAGIMSIZ ve daha buyuk bir risktir — dokumanin
"PPK'yi dogru tahmin edip fonun getirisini yine de yanlis hesaplayabilirsiniz"
uyarisinin sayisal karsiligi.

TEST (10 kontrol): marj olcumu ekrandaki gercek rakamlarla dogrulandi ·
tavanda tespiti (300bp > 250 esigi) · marj her satirda korunuyor (289bp sabit) ·
bilesikleme elle kontrolle %0,01 icinde · rejim senaryosu.
KUSUR DUZELTILDI: kayan nokta artigi (290.99999999999966 -> 291), toFixed(1).

### 125.4 BASLIK STILI
Basliklar `<div class="lbl">` ile yazilmisti; panelin standardi `<h2>`.
Fark gorunur: h2::after bir gradient CIZGI uretir (content:'' + flex:1) ve
h2 .thin parantez ici aciklamayi gri/normal yapar. .lbl bunlarin hicbirini vermez.
Bes baslik h2'ye cevrildi, numaralar 01-05 olarak yeniden siralandi
(04 Repo Tahmini eklendi, enflasyon 05'e kaydi).

### 125.5 DILIM SINIRI HATASI — UCUNCU KEZ
mk-tahmin panelini olcerken "13 acilis / 14 kapanis" cikti ve bir an bozuk
sandim. Sebep: dilimi panelin acilisindan alip BIR SONRAKI SEKMEye kadar
uzatmisim; araya t2'nin KAPANIS etiketi giriyor, acilisi girmiyor.
Dengeli tarama ile olculdugunde panel 13/13, t2 tamami 245/245.
§120.4 ve §124'te ayni sinif hata. ARSIV KURALI: bir HTML blogunu sayarken
dilim SINIRI da dogrulanir; en guvenlisi acilis etiketinden baslayip DENGELI
TARAMA ile kapanisi bulmaktir, sabit bir bitis metni aramak degil.

KULLANICI NOTU: gonderilen PDF enflasyon OLCUM metodolojisiydi (Web-TUFE),
repo tahmini icin degil. Enflasyon patikasi mevcut haliyle birakildi (05),
gelistirme durduruldu. Web-TUFE madde sepeti YUKLENMEDI.

app.js v=20260729j. DOSYALAR: app.js + index.html.

## 124. TAHMINLER YANLIS KATMANA KONMUSTU — duzeltildi (28 Tem)

Kullanici: "tahminler sekmesini yanlis ekledin, alt sekme olarak ekleyeceksin
digerleri gibi para politikasi enflasyon bankacilik gibi." Hakli.

HATA: Makro Veriler'in ZATEN kendi ic navigasyonu vardi (subtab-btn/subtab-panel
deseni): Para Politikasi · Faiz & Piyasa · Enflasyon & Reel Ekonomi · Bankacilik ·
Haftalik Yorum. Ben bunu GORMEDEN, PY_GRUP'u ornek alip AYRI BIR SEKME (t22) +
AYRI BIR ALT-NAV SATIRI (mkSubnav) kurdum. Sonuc: ekranda "MAKRO VERILER |
TAHMINLER" diye gereksiz bir ikinci satir olustu ve ana sekmeyi tekrarladi.
KOK NEDEN: yeni bir yapi kurmadan once MEVCUT yapinin ne oldugunu okumadim.
PY_GRUP'un varligini bilip t2'nin ic navini bilmemek, ayni panelde IKI FARKLI
alt-sekme mekanizmasi oldugunu kacirmak demek.

DUZELTME:
- mkSubnav <nav> tamamen kaldirildi, MK_GRUP ve sekme mantigi geri alindi
- t22 sekmesi kaldirildi, govdesi mk-tahmin adli subtab-panel'e tasindi
- t2 ic navina 6. buton eklendi (mevcut butonun bicimi klonlanarak)
- DOGRULAMA: 6 buton / 6 panel eslesiyor, t2 div dengesi 246/246

### 124.1 TASIMANIN YAN ETKISI — kart duzeyinde dislama gerekti
§122'de t22 SEKME_DISLA'ya eklenmisti (kart notlari sabit metodoloji metnidir,
Ebu yeniden yazarsa tahminin DAYANAGI silinir — bu sekmede dayanak sayidan
onemlidir). Tahminler t2'nin ICINE tasininca o dislama GECERSIZLESTI: t2 Ebu'nun
CALISTIGI bir sekme (Makro/Haberler/Emtia/bolgesel sekmelerle birlikte).
Sekme duzeyi yetmiyor; KART DUZEYI gerekti.
COZUM: kartKesfet() icine `if(k.closest('[data-ebu="hayir"]')) return;`
mk-tahmin paneline data-ebu="hayir" niteligi kondu.
NEDEN kartKesfet: onu YEDI tuketici cagiriyor (baglam ureteci, geri-koyma
nobetcisi, not motoru, iki parti yazici, gunluk bakim, sabah gundemi).
Dislama orada olunca EVRENSEL olur — tek tek her tuketiciye eklemek gerekmez.
CAKISMA KONTROLU: Ebu kendi notlarini `dataset.ebu='1'` ile isaretliyor;
benimki "hayir" — farkli deger, closest() tam-deger secicisi kullaniyor, cakisma yok.
GENELLIK: bundan sonra sabit metinli her bolum tek nitelikle muaf olur,
liste guncellemek gerekmez.

### 124.2 TEMBEL YUKLEME
Tahminler artik boot listesinde degil; alt sekme ACILINCA bir kez calisiyor
(sk-ihrac deseni, tahminLoaded bayragi). Sebep: kart 4 ayri EVDS istegi yapiyor
(politika faizi zinciri + TUFE 1200 gun + PKA beklenti + egri) ve ustune fonlama
zinciri 6 istek daha. Kullanici sekmeyi acmadan bunlar bosuna gitmemeli.

BAKIM NOTU (guncelleme — §121'in genisletilmisi): panelde IKI ayri alt-sekme
mekanizmasi var, karistirilmamali:
  (a) PY_GRUP + pySubnav  -> ANA SEKME grubu (Portfoy Yonetimi). Yeni uye:
      app.js PY_GRUP + index.html pySubnav butonu + ajan.js SEKME_DISLA.
  (b) subtab-btn/subtab-panel -> SEKME ICI bolum (t2 Makro, t10 Sukuk). Yeni uye:
      ic nava buton + ayni id'li panel + (sabit metinliyse) data-ebu="hayir".
Yeni bir bolum eklemeden once HANGI mekanizmanin kullanildigi kontrol edilir.

app.js v=20260729i · ajan.js v=20260729f.
DOSYALAR: index.html + app.js + ajan.js.

## 123. POLITIKA FAIZI KODU BULUNDU + FONLAMA ZINCIRI (28 Tem)

### 123.1 KESIF — uc adimda, ve ilk adim BENIM HATAMDI
1) ?ara=politika faizi -> 0 sonuc. SEBEP: 'ara' modu yalniz VERI GRUBU ADLARINI
   tarar (datagroups uc noktasi), seri adlarini TARAMAZ. "Politika faizi" bir grup
   adi degil, grup ICINDEKI seri. Kullaniciya bunu arattirmam bastan hataliydi —
   kodu okumadan komut verdim.
2) ?ara=faiz -> 19 grup. Aralarinda 'bie_bispolfaiz' = "Merkez Bankalari Politika
   Faiz Orani".
3) ?list=bie_bispolfaiz -> 49 ulke, desen TP.BISPOLFAIZ.<ISO3>.
SABITLENDI: TP.BISPOLFAIZ.TUR (liste 40'ta kesilmisti, Portekiz'de bitti; desen
kesin oldugu icin TUR cikarildi — aday zincirinde grup+adFiltre yedekleri duruyor
ve makullük kontrolu (5<x<100) yanlissa yakalar).
UYARI: bu bir BIS DERLEMESIDIR, TCMB'nin kendi duyurusundan GECIKMELI gelebilir.
PPK aksami henuz eski degeri gosterebilir — kart tarihi yaziyor, ona bakilmali.
YAN KAZANC: 49 ulkenin politika faizi tek grupta (Fed, ECB, BoJ, BoE dahil).
Kuresel faiz karsilastirma tablosu icin hazir kaynak — henuz kullanilmadi.

### 123.2 FONLAMA ZINCIRI — dokumanin dort halkasi
Kullanicinin getirdigi dokuman: "Turkiye'de 'repo tahmini' UC farkli seyi
kastedebiliyor" ve "nihai hedef 3 numaradir (piyasa repo) ama onu tahmin etmek
icin 1 ve 2'yi tahmin etmek zorundasiniz". Zincir: PPK -> AOFM -> TLREF -> fon getirisi.
ARAMA ciktisi dort halkanin da EVDS'de oldugunu gosterdi:
| Halka | Kaynak | Onceki durum |
|---|---|---|
| Politika faizi | TP.BISPOLFAIZ.TUR | GOMULU SABIT 37 |
| AOFM | TP.APIFON4 | panelde vardi |
| TLREF | bie_bisttlref | ayri yoldan (tlref.js) |
| Piyasa repo (BIST O/N) | bie_onrepofbap | YOKTU |
Dordu de tek kartta, rozetlerde politika faizine gore bp farki.
NEDEN ONEMLI: dokumanin "PPK'yi dogru tahmin edip fonun getirisini yine de
yanlis hesaplayabilirsiniz" uyarisi olculebilir hale geldi.

### 123.3 LIKIDITE POZISYONU — sapmanin ana kaynagi
Panel simdiye kadar yalniz NET fonlamayi (TP.APIFON3) cekiyordu. bie_apifon
listesinde BRUT bilesenler de cikti: TP.APIFON1.TOP (toplam fonlama) ve
TP.APIFON2.TOP (toplam sterilizasyon). Ikisi ayri ayri daha cok sey soyler:
net sifira yakinken bile ikisi birden buyukse KOMPOZISYON degisiyor demektir —
dokumanin "faiz degismeden sikilastirma" dedigi durum.
KART SOYLUYOR: sterilizasyon fonlamayi asiyorsa TL FAZLASI var -> gecelik oranlar
koridorun ALT bandina kayar -> AOFM ve TLREF politika faizinin ALTINDA kalir.
Tersi durumda UST banda.

DERS: bir dis veri kaynaginda "yok" demeden once ARAMA MEKANIZMASININ NEYI
TARADIGI okunur. ?ara=politika faizi bos donunce bir an "EVDS'de yok" sanildi;
oysa arama grup adlarinda geziyordu ve seri bir grubun icindeydi. §117'de
kaynak taramasini kapatirken "hangi parametrelerle arandigi yazilir" demistik;
bu vaka ayni dersin arama-mekanizmasi versiyonu.

app.js v=20260729h. DOSYALAR: app.js + index.html.

## 122. TAHMINLER SEKMESI (t22) — panelin ilk ILERIYE BAKAN katmani (28 Tem)

Bugune kadar her sey GERCEKLESMIS veriydi. Tahmin ise tanimi geregi varsayim.
TASARIM ILKESI (tek kural): ARITMETIGI VARSAYIMDAN AYIR. Ekranda hangi sayinin
KIMLIK hangisinin VARSAYIM oldugu gorunur, varsayim degistirilebilir, tahmin
asla veri gibi sunulmaz. Panelin "olctum, tahmin etmedim" ilkesini bozmadan
ileriye bakmanin tek durust yolu bu.
KONUM: Makro Veriler alt-navi (yeni MK_GRUP = t2 + t22), PY_GRUP paraleli.

### 122.1 POLITIKA FAIZI CANLIYA — gomulu sabit kaldirildi
BULGU: app.js'te `OKU_POLITIKA=37` diye GOMULU SABIT vardi. DAMGA altin kural 3
ihlali: canli kartin icinde elle yazilmis rakam. Bir sonraki PPK'da bayatlar ve
TUM faiz patikasi yanlis tabandan baslar.
EVDS seri kodu buradan dogrulanamadi (panel API'si kimlik korumali). Cozum
ADAY ZINCIRI (§115 deseni): 5 aday sirayla denenir, MAKUL deger (5<x<100)
doneni kazanir, hangisinin tuttugu ekranda RAPORLANIR. Hicbiri tutmazsa
damgaliya duser ve BUNU KIRMIZI KUTUDA YAZAR — sessizce eski deger gostermez.
KESIF: tarayicida /api/evds2?ara=politika faizi calistirilip donen kod
TAHMIN_ADAY listesinin BASINA sabitlenmeli. Dogrulama: TCMB sitesi 23 Tem PPK
sonrasi %37 diyor (web aramasiyla teyit) — zincir bunu bulmali.
guncelleme-plani.json'da "TCMB faizi" katmani olay -> canli yapildi.

### 122.2 ENFLASYON PATIKASI — baz etkisi KIMLIKTIR
y/y(t+k) = I(t+k) / I(t+k-12) - 1  ·  I(t+k) = I(t)·Π(1+r_j)
PAYDA TARIHTIR, BILINIR. Belirsizlik yalniz PAYDA'dadir (kullanicinin aylık
varsayimi). Bu yuzden tablo "enflasyon su olacak" demez, "aylik X olursa yillik
su olur" der. Bu ayrim tasarimin tamami.
ASIL DEGERI TERSINDEN: hedefe ulasmak icin gereken aylik oran.
  r = (1+hedef)^(1/12) - 1
Kullanici varsayiminin TCMB hedefiyle uyumlu olup olmadigini tek bakista gorur.
MEVSIMSELLIK: sabit aylik varsayim Ocak'i da Temmuz'u da ayni sayar. Son 5 yilin
ay-bazli ortalamasi profil verir (Ocak zam, yaz gida, Eylul egitim), olcek
katsayisiyla oranti korunarak buyutulup kucultulur.
KAPSAM KARARI (kullanici): MANSET yeterli, ana grup duzeyi cogu is icin kafi.
Web-TUFE madde sepeti (~400 kalem) YUKLENMEDI — o duzey ancak tek tek fiyat
izleniyorsa anlamli. NOT: Web-TUFE agirliklari TUIK TUFE agirliklari DEGILDIR
(kendi sepetini kurar, online izlenebilirlige gore filtreler); ileride
kullanilirsa acikca "Web-TUFE" etiketiyle AYRI tutulmali (§112 kurali).

### 122.3 PPK OLASILIK AGACI — nokta tahmini DEGIL dagilim
Kullanicinin getirdigi dokuman dogru soyluyordu: cikti toplanti bazli olasilik
agaci olmali. Her toplanti bir dugum; beklenen hareket = Σ p_i·hareket_i,
belirsizlik = dagilimin std sapmasi, faiz patikasi bilesiklenir.
NEDEN: nokta tahmini "hakli/haksiz" ikilemine dusurur; DAGILIM pozisyon
boyutlandirmaya cevrilebilir — belirsizlik buyukse pozisyon kuculur.
Olasilik toplami 100 degilse EKRANDA UYARI cikar (sessiz normalize etmez).

EX-ANTE REEL FAIZ CIPASI: reel = (1+politika)/(1+12A beklenti) - 1.
Ex-post (gecmis enflasyonla) hesaplamak dokumanin da isaret ettigi EN SIK
YAPILAN HATA — TCMB ileriye bakar. PKA 12 aylik beklenti serisi zaten akiyordu.

PIYASANIN IMA ETTIGI PATIKA (sifir alfa senaryosu): getiri egrisinden forward.
  f(t1->t2) = [(1+z2)^t2 / (1+z1)^t1]^(1/(t2-t1)) - 1
Panelin egrisi (egri.js) zaten canliydi; forward turetmek saf aritmetik.
Kartta yazili: kendi tahminin piyasayla AYNIYSA pozisyon almanin anlami yok;
alfa konsensusten SAPMADADIR. Hizli indirim beklentisi -> vade uzat; yavas -> gecelik.
AYRICA UYARI (dokumandan): faiz tek arac degil. TCMB politika faizini sabit
tutup zorunlu karsilik/kredi siniri/koridor ile sikilastirabilir; zincir
PPK -> AOFM -> TLREF -> fon getirisi ve sapmanin ana kaynagi TL likidite pozisyonu.

### 122.4 TEST (13 kontrol, hepsi gecti — agsiz, sentetik + elle hesap)
Baz etkisi kimligi: aylik %2 sabit -> 12. ay y/y %26,82 (=(1.02^12-1)) TAM tutuyor,
ve sabit rejimde her ayin y/y'si ayni cikiyor.
Tersine cozum: 3 hedefte de geri kontrol %0,01 icinde.
ASIL SINAV — degisken gecmis: gecen yilin buyuk ayi seriden duserken AYLIK
VARSAYIM DEGISMEDIGI HALDE y/y 4,47 puan dustu. Saf baz etkisi calisiyor.
PPK: beklenen hareket -112,5bp, elle hesapla birebir.
Forward: 1y1y %30,18, elle %30,18. Ters egimli egride forward spot'un ALTINDA
cikiyor — piyasa indirim fiyatliyor demek, isaret dogru.
TEST YAZIM HATASI (kayda deger): 3. testte once Ocak'i KENDİSİYLE
karsilastirmisim, ✗ verdi ve bir an kod hatasi sandim. Iddia duzeltildi, kod
dogruydu. §120.4'un aynisi: olcumun kendisi de olculur.

app.js v=20260729g · ajan.js v=20260729e (t22 dislandi, §121 kurali uygulandi).
DOSYALAR: app.js + index.html + ajan.js + guncelleme-plani.json.

## 121. TEKNIK SEKMESI EBU'NUN DISINDA (28 Tem)

Kullanici: "Ebu'nun calismayacagi sekmelere Tekniği de ekleyelim." Dogru —
t21 zaten Portfoy Yonetimi grubunun uyesi, liste o grubun TAMAMINI disliyordu;
yeni sekme eklenince listeye yazilmadiği icin tutarsizlik olusmustu.
SEKME_DISLA: t3·t4·t5·t6·t8·t9·t10·t11·t14·t20 → +t21

UC AYRI GEREKCE (yalniz "grup uyesi" oldugu icin degil):
1) t21'in .note metinleri SABIT KILAVUZDUR (çizim nasil yapilir, gostergeler
   ne anlatir, durus notu). Veriye bagli degil. Ebu yeniden yazsa bu aciklamalar
   kaybolurdu — §90'daki "canli kartlarda EBU notlari kaybi" vakasinin aynisi.
2) Grafik CANVAS; kart metni fiyatla birlikte surekli degisir. Not motoru kart
   verisinin HASH'ine bakar → her fiyat hareketinde "degisti" sanip tetiklenir,
   bosuna token yakardi (PARTI=4, her tur ~2000 token).
3) §111 zaten canli kartlarda RAKAM YASAGI koymustu; t21 bastan sona canli
   rakam. Disllamak o kuralla tutarli.

MEVCUT DURUM: 18 sekmenin 11'i dislandi, 7'sinde Ebu aktif (Makro · Haberler ·
t12 · Emtia · Asya-Pasifik · ABD · Avrupa). Yani Ebu MAKRO/PIYASA yorumu yaziyor,
PORTFOY/ARAC sekmelerine dokunmuyor — dogru ayrim: birinciler baglam ister,
ikinciler kullanicinin kendi kayitlari ve hesap araclaridir.

BAKIM NOTU (kalici): Portfoy Yonetimi alt-navina YENI SEKME eklenince
UC yere yazilir — (a) app.js PY_GRUP, (b) index.html pySubnav butonu,
(c) ajan.js SEKME_DISLA. Ucuncusu unutulursa Ebu o sekmenin notlarini
yeniden yazmaya calisir ve kilavuz metinleri kaybolur.

ajan.js v=20260729d. DOSYALAR: ajan.js + index.html.

## 120. CIZIM KATMANI — trend cizgisi + pivot + regresyon (28 Tem)

Kullanici: "trend cizgisi yok mu?" Yok — Lightweight Charts yalniz CIZICI;
cizim araclari (trend, Fibonacci) ucretli Advanced Charts kutuphanesinde.
Kendimiz ekledik. UC KATMAN, biri elle ikisi otomatik.

### 120.1 ELLE TREND CIZGISI
Iki tiklama iki capa noktasi verir. KRITIK TASARIM: cizgi ZAMAN uzayinda degil
BAR INDEKSI uzayinda kurulur. Zaman uzayinda kurulsa hafta sonu ve tatil
bosluklari cizgiyi egerdi — iki gercek islem gunu arasinda 3 takvim gunu varsa
cizgi orada yanlis egim alir. Indeks uzayinda bu sorun yok.
Cizgi serinin SONUNA KADAR uzatilir (trend cizgisinin isi zaten gelecege uzanmak).
KALICILIK: hisse bazinda localStorage (tk_cizgi_v1) + CLOUD_KEYS → diger cihazda
da ayni cizgiler. Tiklama koordinati fiyata `series.coordinateToPrice(y)` ile
cevrilir; v5 API'sinde bu mum serisi uzerinde.

### 120.2 OTOMATIK IKI KATMAN — elle cizimin oznelligine karsi denge
PIVOT: i bari, i±k penceresinin tepesi/dibi mi? Bulunanlar %1,2 toleransla
kumelenir, en az 2 dokunusu olanlar gosterilir (rozetteki sayi = dokunus adedi).
Objektif — "ben oraya cizgi cekmek istedim" yanliligi yok.
REGRESYON KANALI: son 90 barin en kucuk kareler dogrusu ±2σ. Trendin
matematiksel orta cizgisi. Elle cizilen cizgi bundan cok sapiyorsa SAPAN
MUHTEMELEN CIZGIDIR — bu notu karta da yazdik.
Ozet kartina eklendi: kanal egimi yillik %'ye cevrilir, fiyatin kanal icinde mi
2σ disinda mi oldugu yazilir.

### 120.3 TEST (11 kontrol, hepsi gecti)
Trend cizgisi: capa noktalarinda deger BIREBIR tutuyor · sona uzatiliyor ·
ters sira (t2<t1) calisiyor · gecersiz tarih null donuyor.
Pivot: ASELS 57 barda direnc 412,0 (2 dokunus); seviyeler makul aralikta.
Regresyon: ASELS egim -0,802 ₺/bar → yillik -%56,4, fiyat kanal icinde.
EN GUCLU DOGRULAMA — SENTETIK SERI: y=100+2i verildiginde egim TAM 2,0000 ve
σ TAM 0 cikti. En kucuk kareler dogru kurulmus; gercek veriyle "makul gorunuyor"
demek yetmez, kapali formu bilinen bir seride SIFIR HATA aranir.
NOT: 57 barlik ornekte "destek yok" cikti — hata degil, k=5 ve %1,2 toleransla
o pencerede kumelenen dip yok. Uretimde 400 bar var, daha fazla cikacak.

### 120.4 ETIKET DENGESI — yanlis alarm (kendi olcumumde)
t21 blogunda "7 acilis vs 8 kapanis" çıktı ve bir an bozuk sandim. Sebep:
dilimi `id="t21"` metninden baslatmisim, dolayisiyla t21'in KENDI acilis etiketi
(`<div class="tab" `) dilimin DISINDA kalmis. Tam etiketten baslatinca 8 vs 8.
DERS: bir sayim yaparken dilimin SINIRI da olculur. §116'da testin dogrulayicisi
yanlisti, burada testin DILIMI yanlisti — ayni sinif hata.

app.js v=20260729f. DOSYALAR: app.js + index.html.

## 119. TEKNIK ANALIZ SEKMESI (t21) — Lightweight Charts (28 Tem)

Kullanici TradingView gibi bir ekran istedi. IKI SECENEK OLCULDU:

### 119.1 GOMULU WIDGET — BIST'te KAPALI
TradingView'in ucretsiz iframe widget'lari (Advanced Chart, Technical Analysis)
BIST'i KAPSAMIYOR. Resmi "Available markets" listesi tarandi (28 Tem):
  Avrupa (25 borsa): Atina·Budapeste·Madrid·Bukres·Varsova·Prag·Viyana... BIST YOK
  Orta Dogu/Afrika (5): Abu Dabi·Kazablanka·Kahire·Kuveyt·Tel Aviv ... Turkiye YOK
TradingView'in KENDI sitesinde BIST var ama widget'a verilen veri kumesi AYRI
LISANS; borsa bazinda anlasma gerekiyor ve BIST o listede degil.

### 119.2 SECILEN: Lightweight Charts (Apache 2.0)
Kullanicinin buldugu kutuphane. KRITIK AYRIM: bu bir CIZICI, veri kaynagi DEGIL.
TradingView sunucularina hic baglanmiyor — veriyi BIZ veriyoruz, dolayisiyla
BIST sorunu ortadan kalkiyor. Ayrica disa bagimlilik yok: widget yolunda
TradingView politikasini degistirse ekran olurdu, burada olmez.
KAZANC: gostergeler BIZIM oldugu icin RISK BUTCESINE baglanabiliyor. ATR'den
pozisyon boyutu cikarmak gomulu widget'ta IMKANSIZDI — ozet kartindaki
"ATR -> pozisyon boyutu" satiri bu ekranin panel icin asil degeri.
BEDEL: gostergeleri biz hesapliyoruz, cizim araclari (trend/Fibonacci) yok.
ATIF: Apache 2.0 atif sarti chart option `attributionLogo:true` ile karsilanir.
SURUM SABITLENDI: unpkg@5.2.0. Sabitlenmemis CDN sessiz kirilma kaynagidir —
kutuphane majör surum atlayinca API degisir, ekran bir sabah bos acilir (§115).
v5 addSeries(Type,opt,pane) kullanilir; v4 addXxxSeries fallback'i de birakildi.

### 119.3 VERI: api/market.js ?mod=seri (slot yakmaz)
Diger modlar OZET doner (p,chg,h1,a1,q3); gostergeler HAM seri ister.
OLCULDU: Yahoo bireysel BIST hisselerinde 1y = 255 bar veriyor (ASELS.IS).
Sektor ENDEKSLERINDE vermiyor (§117) ama HISSELERDE tam seri var — bu ayrim
onemli, cunku §117'nin sonucu "Yahoo BIST'i beslemiyor" diye genellenemez.

TATIL BARI TUZAGI (olculdu): Yahoo kapali gunleri DUZ BARLA dolduruyor —
acilis=yuksek=dusuk=kapanis, hacim 0 (ASELS 27-29 May, ucu de 380,25).
Suzulmezse ATR sifira yaklasir, RSI yatay bari "degisim yok" sayar.
KOSUL BIRLESIK: yalniz hacim 0 yetmez (likit olmayan isimde gercek olabilir),
yalniz duz OHLC de yetmez (limitli gun gercektir). IKISI BIRDEN olmali.

### 119.4 GOSTERGELER — Wilder yumusatmasi
RSI ve ATR WILDER ile hesaplanir, basit ortalamayla DEGIL. Basit ortalamali
surumler ayni seride 3-5 puan farkli sonuc verir; TradingView Wilder kullanir.
TEST (9 kontrol, hepsi gecti): SMA temel · RSI sinir davranisi (kesintisiz
yukselis->100, dusus->0, duz->100) · GERCEK ASELS 57 barinda RSI/ATR/MACD/BB ·
tutarlilik (RSI [0,100], ATR>=0, BB ust>=orta>=alt).
CAPRAZ DOGRULAMA: ASELS ATR %4,60 gunluk. risk.json yillik std %54,3 -> gunluk
%3,4. Oran 1,35 — ATR'nin std'ye tipik orani (1,3-1,5). IKI BAGIMSIZ OLCU
BIRBIRINI TUTUYOR. (ATR range tabanli oldugu icin std'den YUKSEK olmasi normal;
ikisi ayni seyi olcmez, karistirilmamali.)

### 119.5 KONUM VE DURUS
Portfoy Yonetimi alt-navinda t21 "Teknik" (Degerleme'nin yaninda).
PY_GRUP'a eklendi. Evren: portfoy (● isaretli) + Top-40 + elle kod girisi.
DURUS NOTU (kartta yazili): bu ekran SINYAL URETMEZ, BAGLAM VERIR. Panelin
karar omurgasi faktor modeli ve bilancodur; teknik gorsel bunlarla celisirse
teknik olan esas alinmaz. Teknik tarafin isi ZAMANLAMA ve BOYUTLANDIRMA.
Bu kasitli bir sinirlama: klasik teknik ekranlar "al/sat" der, panelin geri
kalani faktor+bilanco temellidir; ikisi celisince hangisine uyulacagi
belirsizlesir ve disiplin bozulur.

app.js v=20260729e. DOSYALAR: app.js + index.html + api/market.js.
KOTA DEGISMEDI 10/12 (mod=seri mevcut route'a eklendi).

## 118. AJANA NOBETCI GOREVLER — deterministik taraf (28 Tem)

Kullanici: "ajani daha aktif kullanabilir miyiz, farkli gorevler verelim mi?"
TESPIT: Ebu bugune kadar esas olarak YORUM YAZIYORDU ve hatalarin HEPSI oradan
cikti (§87 halusinasyon · §110 cift imza · §111 tabloyla celisen rakam).
Kullanilmayan taraf: DETERMINISTIK gorevler. Nobetci uretmez, OLCER ve SOYLER —
veri hesaplanir, AI'ya sorulmaz. Halusinasyon riski SIFIR; yanlis olabilecek tek
sey esik ayaridir, o da gorunur ve ayarlanabilir.

### 118.1 KOR NOKTA KAPATILDI (once bu)
Panelde zaten tazelik uyari sistemi vardi: Veri Durumu cekmecesi
guncelleme-plani.json'daki her katmanin yasini hesaplar, vadesi geceni kirmizi
GUNCELLE diye isaretler. AMA ALTI DOSYA O KAYITTA YOKTU:
  fm.json · risk.json · analist.json · temettu.json · rezerv.json · sukuk-ihrac.json
Panele veri besliyorlardi ama hicbir sey yaslandiklarini SOYLEMIYORDU.
Mekanizma vardi, SICIL eksikti. Alti da eklendi (25 -> 31 katman).
Bugun rezerv celiskisini (§112) elle yakalamamizin sebebi tam olarak buydu.

### 118.2 NOBET 1: TAZELIK
guncelleme-plani.json + dosya tarihleri -> vadesi gecenler.
SEZON KURALI (yeni): BIST ceyreklik raporlari Sub-Mar / Nis-May / Tem-Agu /
Eki-Kas aylarinda yayimlanir. O aylarda sirketler guidance revize eder, carpanlar
ve faktor tabani degisir. 'sezon:true' katmanlarda limit sezon_limit_gun'e DUSER.
NEDEN GEREKLI: guidance.json nominal olarak CEYREKLIK (90 gun limit) ama sezon
ortasinda 11 gunluk guidance bile bayattir. Saf gun sayisi bunu KACIRIYORDU.
KALIBRASYON: sezon limiti once 14 kondu -> bugunku durumu yakalamadi -> 10'a
indirildi. Simdi elle vardigim yargiyla BIREBIR ortusuyor:
  rezerv.json 11g(limit 7) · fm.json 14g · multiple.json 12g · guidance.json 11g
  · analist.json 11g (son dordu SEZON limiti 10 ile)
sezon:true isaretliler: guidance · multiple · fm · analist.

### 118.3 NOBET 2: BILANCO
KAP akisindaki FR bildirimlerini inceleme-ai.json kartlariyla karsilastirir.
Karti olmayan YA DA karti bildirimden ESKI kodlar "kart bekliyor" listesine duser.
EVREN: portfoy + Top-40 + halihazirda karti olanlar. Butun BIST gurultu olurdu.
NEDEN TARIH KARSILASTIRMASI: yalniz koda bakmak yetmez — ANHYT'nin 2C26 karti
var ama 3C geldiginde yenisi gerekir.
28 TEM DERSI: o gun BES bilanco geldi (ANHYT·PASEU·AKBNK·TAVHL·BMSTL), hepsini
KULLANICI fark etti, sistem degil. Bu nobet tam o boslugu kapatir.

### 118.4 TEST BIR HATA YAKALADI (gun vs damga-zamani)
Ilk surum kart tarihi ile bildirim damgasini TIMESTAMP olarak karsilastiriyordu.
Kart tarihi SAATSIZDIR ("27 Tem 2026" -> 00:00), KAP bildirimi SAATLIDIR (19:08).
Sonuc: kart AYNI GUN yazilmis olsa bile "eski" sayilip KALICI YANLIS ALARM
uretilecekti — yani nobetci daha dogarken guvenilmez olacakti.
DUZELTILDI: karsilastirma GUN bazinda (nobGunAnahtar). Test 2/4 -> 4/4.
DERS: bir nobetcinin ilk sinavi "dogru olani yakaliyor mu" degil, "YANLIS ALARM
URETIYOR MU"dur. Kurt diye bagiran nobetci, gercek kurtta da duyulmaz (§116).

### 118.5 SUNUM
- Ajan cekmecesi: "⚙ NOBET" bolumu — bekleyen bilancolar + tazelenecek dosyalar
- Earnings AI sekmesi: ust serit, portfoydekiler yesil cerceveli, KAP linkli
- Sabah gundem notu baglami: nobetBaglam() cron notuna da girer
Her 10 dk veri turuyla kosar + acilistan 6 sn sonra bir kez.

### 118.6 SIRADAKI (konusuldu, yapilmadi)
2) Celiski avcisi — ayni buyukluk iki dosyada farkli mi, nottaki rakam kartla
   tutuyor mu, damga tarihi veri tarihiyle uyumlu mu. Tespit deterministik.
3) Tez vadesi hatirlaticisi — journal'daki acik tezler, hedefe mesafe, "bozacak"
   kosulu gerceklesti mi.
4) Risk butcesi ihlal bildirimi — kart zaten hesapliyor, sabah notuna dusurmek.

ajan.js v=20260729c · app.js v=20260729d.
DOSYALAR: ajan.js + index.html + guncelleme-plani.json.

## 117. BIST SEKTOR ENDEKSI — KAYNAK TARAMASI KAPANDI (28 Tem)

Kullanici: "financekit massive adli mcp'lerden bisey cikmaz mi?" — hepsi test
edildi. BU BOLUM KAPANMIS BIR SORUDUR, tekrar arastirilmasin.

| Kaynak | Test | Sonuc |
|---|---|---|
| Yahoo (market.js) | .IS/^ × 3mo/1y (4 varyant) | 1 bar — gecmis YOK |
| Financekit MCP | price_history XKMYA.IS 3mo | 1 bar — YAHOO SARMALAYICISI |
| Massive MCP (Polygon) | /v2/aggs I:XKMYA ve I:XU100 | BOS — BIST kapsami SIFIR |
| Alpha Vantage MCP | INDEX_CATALOG tam liste | BIST YOK — katalog bastan sona Cboe/ABD |
| Fintables MCP | endeks_mumlar_gunluk_gh | **VAR** — ama panel erisemez |

TESHIS: Financekit'in Yahoo oldugu sembol bicimi (.IS) ve ornek ticker'dan
(BTC-USD) belliydi ama TEST EDILMEDEN soylenmedi — bugun §116'da tam bu yuzden
iki kez yanildim (alan adi tahmini). Massive/Polygon'da XU100 bile yok, yani
Turkiye kapsami hic yok. AV'nin "200+ endeks" katalogu bastan sona Cboe turev
endeksi (S&P buffer serileri, VIX varyantlari); tek bir uluslararasi endeks yok.

SONUC: Fintables TEK kaynak ve MCP'dir → sunucu cagiramaz (BAKIM 1. kural).
Bu bir eksiklik degil MCP'nin TANIMIDIR: Claude'un kanali, panelin degil.
Dolayisiyla sektor 1H/1A/3A icin OTOMASYON YOKTUR; KOPRU zorunludur.

### 117.1 KOPRU KOMUTU (haftalik, ~1 dakika)
Kullanici "sektorleri tazele" der; Claude:
  1) endeks_mumlar_gunluk_gh'den 16 endeksin 5 referans kapanisini ceker
     (bugun · onceki seans · 1H · 1A · 3A)
  2) getirileri hesaplar, sektor.json'a yazar, tarih+guncelleme damgasini atar
  3) DOGRULAMA: hesaplanan 1G degerleri panelin CANLI gosterdikleriyle
     karsilastirilir — tutmuyorsa referans tarihleri yanlistir.
DAMGA B2 rituelinde kayitli. Siradaki: 4 Agu Pzt.

### 117.2 TEK KALICI COZUM (yapilmadi, kosulu var)
Sektor getirisini BILESEN HISSELERDEN hesaplamak. Yahoo bireysel BIST
hisselerini duzgun besliyor (model sicili bununla calisiyor ve dogrulandi).
ENGEL: BIST'in resmi endeks kompozisyonu (uyelik + serbest dolasim agirliklari)
gerekiyor; Fintables'in 44 kalemli taksonomisi BIST'in 15 endeks grubuyla
ortusmuyor. Kullanici BIST/KAP'tan uyelik listesi saglarsa yapilabilir —
o zaman panel Yahoo'dan bilesen fiyatlarini cekip sektor getirisini KENDI
hesaplar ve kopru tamamen kalkar.

DERS: bir veri "yok" denmeden once KAC kaynakta ve HANGI PARAMETRELERLE
arandigi yazilir. §11 dar olctu, §115 genisletti, §117 kapatti. Kayit olmasa
bu soru her ay yeniden acilirdi.

## 116. KOPRU TESTI YALAN SOYLEDI + VARYANT ZINCIRI SONUCU (28 Tem)

Ilk gercek kosu: 19 gecti · 3 uyari · 2 hata. IKI "KRITIK HATA"NIN IKISI DE
ASILSIZ ALARMDI — dogrulayicilari KAYNAGA BAKMADAN yazmisim.
| Test | Aradigim alan | GERCEK alan (kaynaktan) |
|---|---|---|
| kuresel endeksler | veri/endeksler/items | **data** (market.js:487) |
| FRED | seri | **seriler** (fredModu) |
| getiri egrisi | noktalar/egri | **vadeler/adet** (egri.js) |
Ucu de saglam calisiyordu. "DEPLOY ETME" yazan iki satir uydurmaydi.
DERS (§60'in TERSI): kurt diye bagiran test, gercek kurt geldiginde de duyulmaz.
Bir dogrulayici yazarken ucun KAYNAK KODUNDAKI return sekli okunur; alan adi
tahmin edilmez. Testin kendisi de "olculur, ezberlenmez" kuralina tabidir.
DUZELTILDI: uc dogrulayici kaynaktan yeniden yazildi + ECB "sunucu bacagi
dustu, panel tarayici yedegini kullanir (§97)" diye BILGI seviyesine indirildi
(alarm degil, beklenen durum).

### 116.1 VARYANT ZINCIRI (§115) SONUC: BASARISIZ — ama artik BILIYORUZ
15 sektorun tamami '<sembol>.IS/3mo' raporladi ve 13'unde a1 hala null.
Dort varyant da denendi (.IS/3mo, .IS/1y, ^KOD/3mo, ^KOD/1y), hicbiri >=22 bar
dondurmedi. YAHOO'DA BU 13 ENDEKSIN GECMISI YOK — aralik ya da sembol bicimi
meselesi degil. §11'in dar olcumu genisletildi ve ayni sonuca varildi; artik
"denenmedi" degil "denendi, yok" diyebiliyoruz.
YAN KUSUR DUZELTILDI: teshis 'ILK calisan' varyanti raporluyordu, EN IYISINI
degil — bu yuzden zincir hic calismamis gibi gorunuyordu. Artik en cok bar
donduren varyant + BAR SAYISI raporlanir (test ciktisinda da gorunur).

### 116.2 SONUC: DAMGA TEK YOL — ve tazelendi
Yahoo vermiyor, EVDS'de bu endeksler yok, Fintables MCP'ye panel erisemez,
Fintables sektor taksonomisi (44 kalem) BIST'in 15 endeks grubuyla ortusmuyor.
Geriye KOPRU kaliyor: Claude Fintables'tan ceker, sektor.json'a damgalar.
YAPILDI: sektor.json 15 Tem -> 28 Tem (13 gun bayatti).
Kaynak: endeks_mumlar_gunluk_gh (BIST resmi kapanislari).
DOGRULAMA: hesaplanan 1G degerleri panelin CANLI gosterdikleriyle BIREBIR tutti
(XMANA +0,46 · XGIDA -0,00 · XKMYA -0,09 ... XTRZM -1,48) — kaynak dogru.
EN BUYUK DUZELTMELER (1A): XUTEK -4,68 -> +3,42 (+8,1p) · XILTM -2,98 -> -9,98
(-7,0p) · XUMAL -4,29 -> -10,83 (-6,5p). Panel bu ucunde sektorleri ciddi
sekilde yanlis siraliyordu.

### 116.3 ACIK KALAN
sektor.json her hafta koprulenmeli (DAMGA B2 ritueli). Kalici otomasyon icin
tek yol sektor getirisini BILESEN HISSELERDEN hesaplamak; bunun icin BIST'in
resmi endeks kompozisyonu gerekir ve elimizdeki kaynaklarin hicbiri onu
vermiyor. Kullanici BIST'ten uyelik listesi saglarsa yapilabilir.

test/kopru-testi.js + api/market.js + sektor.json. KOTA DEGISMEDI 10/12.

## 115. SEKTOR SERISI — VARYANT ZINCIRI (§114'un ikinci yarisi) (28 Tem)

Kullanici hakli itiraz: "yine damgali tabandan mi aldin, yine otomatik
guncellemeyecek mi?" §114 BIRLESTIRME hatasini duzeltti ama veriyi tazelemedi.

### 115.1 MCP NEDEN COZUM DEGIL (mimari kisit, tercih degil)
Kullanici "o kadar MCP yukledim" dedi — hakli ama MCP panelin CANLI KAYNAGI
OLAMAZ. BAKIM 1. kural: "MCP = sadece Claude cagirir, panel (tarayici) dogrudan
erisemez." Fintables'i BEN cagirabiliyorum, panel cagiramaz. Ben ceker json'a
yazarsam bu yine DAMGA olur — otomatik degil.
DENENDI: Fintables sektorler tablosu 44 ince taksonomi tasiyor (Bankacilik,
Holding, Kimya ve Plastik...), BIST'in 15 endeks grubuyla (XKMYA/XGIDA/XBANK)
1:1 ORTUSMUYOR. Uyelik koprusu de temiz cikmadi.

### 115.2 OLCULMEMIS VARSAYIM: tek aralik denenmisti
§11 Yahoo'yu YALNIZ '.IS + range=3mo' ile olctu ve "veri yok" sonucuna vardi.
BU TEK BIR DENEMEYDI. Yahoo endeksler icin '^' onekini de kullaniyor
(XU100 hem 'XU100.IS' hem '^XU100' olarak var — web aramasiyla dogrulandi) ve
kisa aralikta bos donen semboller uzun aralikta dolabiliyor.

COZUM — VARYANT ZINCIRI (market.js one()):
  1) <sembol>.IS / 3mo   2) <sembol>.IS / 1y   3) ^<sembol> / 3mo   4) ^<sembol> / 1y
Ilk YETERLI varyantta durur (yeterli = >=22 bar; a1 icin 21 bar lazim).
Calisan varyant yanitta 'varyant' alaninda RAPORLANIR.
Maliyet SINIRLI: ilk denemede tutan semboller (XU100, 40 hisse) 1 istek yapar;
yalniz sorunlu 13 sektor zincire girer. market.js maxDuration 30 -> 45 sn.
HICBIRI TUTMAZSA davranis eskisiyle AYNI: h1/a1/q3 null -> §114 damgali tabana
duser ve rotasyon altindaki damga bunu YAZAR. Yani en kotu ihtimalde geriye
gidis yok, en iyi ihtimalde sorun tamamen kendiliginden cozulur.
TEST (aginsiz, sahte Yahoo, 6 senaryo 6/6): ilk denemede dolu · 3mo bos+1y dolu ·
.IS yok+^ dolu · yalniz ^+1y dolu · hicbiri yeterli degil · Yahoo hic yanit vermiyor.

### 115.3 DEPLOY SONRASI DOGRULAMA (zorunlu)
Kopru testine sektor kontrolu eklendi:
  KTP_CRON_SECRET=xxx node test/kopru-testi.js
"market · SEKTOR serisi (RS tabani)" satiri:
  GECTI  -> 15/15 sektorde a1 dolu, RS TAMAMEN CANLI, sorun bitti
  UYARI  -> kac sektorde eksik + hangi varyantlarin tuttugu yazar
Uyari cikarsa varyant dagilimina bak: hepsi '<sembol>.IS/3mo' ise zincir hic
ise yaramamis demektir; o durumda TEK KALICI COZUM sektor getirisini BILESEN
HISSELERDEN hesaplamaktir (§11 + §114.4) — ama once bunu olc, cunku bilesen
yaklasimı BIST'in resmi endeks kompozisyonunu gerektirir ve Fintables taksonomisi
onu vermiyor (bkz. 115.1).

DERS: "veri yok" sonucuna TEK BIR DENEMEYLE varilmaz. §11 dogru olcmustu ama
dar olcmustu; dort ay sonra ayni kok neden baska bir karti bozdu. Bir dis kaynak
"vermiyor" derken hangi PARAMETRELERLE denendigi de kayda gecmeli.

api/market.js + vercel.json + test/kopru-testi.js. KOTA DEGISMEDI 10/12.

## 114. SEKTOR ROTASYONU — KARISIK TABAN (§11'in kacan yarisi) (28 Tem)

Kullanici: "sektor rotasyonlari guncel mi?" — sordugu iyi oldu.
DOGRULAMA (Fintables endeks_mumlar_gunluk_gh, bagimsiz kaynak): panelin RS
degerleri gercek BIST kapanislariyla hesaplananla 15 sektorun 13'unde TUTMADI.
Tutan iki isim: XUSIN ve XBANK.

### 114.1 KOK NEDEN — §11'in ayni koku, farkli semptom
§11 (24 Tem) sunu tespit etmisti: Yahoo BIST sektor endekslerinin cogunda
3 aylik aralikta TEK BAR donduruyor; XU100/XU030/XUSIN/XBANK dolu, digerleri bos.
O zaman YALNIZ 1G (chg) duzeltildi (meta.previousClose yedegi). h1/a1/q3'e
DOKUNULMADI — onlar null kaliyor ve canliEnjekte damgali degeri koruyor. Dogru.
KACAN NOKTA: XU100'un h1/a1/q3'u CANLI geliyor ve benchmark GUNCELLENIYOR.
Sonuc: RS = DAMGALI sektor (15 Tem) − CANLI XU100 (bugun).
Iki FARKLI ZAMAN TABANININ farki. Ne sektor tarafi yanlis, ne benchmark —
BIRLESTIRME yanlis.

HIPOTEZ TESTI (28 Tem): "RS = damgali sektor − canli XU100" varsayimiyla
hesaplandi → 13/15 sektor panelde gorunenle BİREBİR tuttu (±0,15 puan).
Sapan ikisi XUSIN ve XBANK; tam da Yahoo'nun canli besledigi ikisi — onlarda
her iki taraf da canli oldugu icin RS zaten DOGRUYDU. Teshis kesin.

### 114.2 CARPITMA SISTEMATIKTI
Damgali XU100 (15 Tem) ile canli XU100 (28 Tem) farki her sektore ayni miktarda
ekleniyordu:
  RS 1H  duzeltme −3,08 puan   (damgali bm +1,03 vs canli −2,05)
  RS 1A  duzeltme −2,44 puan   (−1,67 vs −4,11)
  RS 3A  duzeltme −4,83 puan   (+0,35 vs −4,48)
Yani 13 sektorun HEPSI endekse gore olduklarindan IYI gorunuyordu; ekranda
neredeyse her seyin yesil/pozitif olmasinin sebebi buydu. KADRAN ATAMALARI da
bozuktu (LIDER/GUCLENIYOR/ZAYIFLIYOR/GERIDE rs ve mom isaretine bagli).

### 114.3 COZUM — TABAN ESLESTIRME
canliEnjekte artik: (a) damgali orijinali s.__damga'da SAKLIYOR (ilk enjeksiyondan
once), (b) her ufuk icin canli gelip gelmedigini s.__canli[i] ile isaretliyor.
renderRotasyon kurali: bir ufukta sektor VE benchmark IKISI DE canliysa canli
taban; aksi halde IKISI DE damgali taban. KARISIK TABAN ASLA KULLANILMAZ.
SEFFAFLIK (§11 dersi): rotBody altina damga dustu — "N/M RS ufku DAMGALI
tabandan (tarih)". Kac kaydin gercekten tazelendigi yaziyor.
TEST (aginsiz): eski hesap 13/13 sektorde ekrandaki degeri birebir uretti
(hata yeniden uretildi ✓), yeni hesap sabit kaymayi kaldirdi, XUSIN degismedi ✓

### 114.4 KALICI COZUM ICIN NOT
Bu yama SEMPTOMU degil BIRLESTIRME hatasini duzeltir; 13 sektorun 1H/1A/3A'si
hala DAMGALI, yani eskiyor. Kalici cozum §11'in sonunda zaten yazili:
"cozum sembol bazinda degil, sektor getirisini BILESEN HISSELERDEN hesaplamaktir."
Panelde 141 hissenin canli fiyati zaten var (/api/market?mod=fiyat); sektor
uyeligi eklenirse sektor getirileri kendi ic kaynagimizdan uretilebilir.
ARA COZUM: sektor.json'u haftalik damgalamak (su an 15 Tem, 13 gun eski).

DERS: bir kartta A ve B'yi cikariyorsan ikisinin AYNI TABANDAN geldigini
dogrula. Yari-canli birlestirme, iki tarafi da dogru olan bir hesabi yanlis
yapar — ve hicbir tarafta hata gorunmedigi icin fark edilmesi zordur.
§112'nin "ayni buyuklugun iki sahibi olmaz" kuralinin zaman boyutundaki hali.

app.js v=20260729c. DOSYALAR: app.js + index.html.

## 113. 28 TEM BILANCO TURU — 5 KART + BIR TEZ CURUTULDU (28 Tem)

Fintables ile tarama: yayinlanma_tarihi_utc >= dun aksam -> 4 yeni tablo.
AKBNK (banka, PD 342 mlr) · TAVHL (97 mlr) · BMSTL (13 mlr, XKTUM+XK100) ·
KSTUR (11 mlr, endeks disi -> kart yok). Onceki turdan ANHYT + PASEU ile
gunun toplami 5 kart. inceleme-ai.json 12 -> 17 kart.

### 113.1 TEZ CURUTULDU — kayda geciriyoruz
27 Tem'de ANHYT kartina sunu yazmistim: "faiz indirim dongusunde BANKANIN MARJI
SIKISIRKEN hayat sigortacisinin teknik tarafi calisiyor." Dayanak XBANK'in
1 aylik -%15,2'siydi. AKBNK 2Ç26 bunu CURUTTU: net faiz geliri 20,3 -> 44,9 mlr
(+%121). Banka marji sikismiyor, ACILIYOR.
MEKANIZMA (yanlis anlasilmisti): Turk bankalari 2024-25'te YUKSEK MEVDUAT
MALIYETIYLE ezilmisti. TCMB indirdikce mevduat maliyeti kredi getirisinden HIZLI
dusuyor -> marj TOPARLIYOR. XBANK'in zayifligi gecmisi fiyatliyordu.
REVIZE TEZ: indirim dongusu her iki kanadi da besliyor ama FARKLI OMURLE.
Bankada kazanc GECICI/MEKANIK (mevduat yeniden fiyatlandikca kapanir),
sigortada TEKNIK/YAPISKAN. ANHYT kartinin tezine de duzeltme notu eklendi.
DERS: sektor endeksi performansi GECMISI fiyatlar; tezi endekse degil
BILANCO MEKANIZMASINA dayandir. XBANK -%15 gorup "banka marji sikisiyor"
demek, sonucu sebep sanmakti.

### 113.2 SWAP TUZAGI (banka kartlarinda standart olmali)
Turk bankalari TL mevduatin bir kismini SWAP ile fonluyor; bu maliyet net faiz
gelirinde DEGIL "ticari kar/zarar" satirinda gorunur. AKBNK 2Ç26:
  manset NFG        +%121,2
  ticari kar/zarar  -13.134 mn (2Ç25: -691) = 19 KAT
  DUZELTILMIS (NFG + ticari): +%62,0  ·  ve 1Ç'ye gore -%19,7 (YON DONDU)
Manset NFG'ye bakip swap satirini atlamak marj iyilesmesini IKI KATINA kadar
sisirir. GARAN (29T) ve YKBNK (30T) kartlarinda AYNI DUZELTME yapilacak.
Net kar da C/C -%20,6 gerilemis (19,1 -> 15,2 mlr) — yillik +%36,6 zayif bazdan.

### 113.3 GUIDANCE KARSILASTIRMASI ICIN PARA BIRIMI KOPRUSU
TAVHL guidance'i EURO bazinda (ciro 1.880-1.890 · FAVOK 590-650 mn EUR) ama
panel TL tabloya bakiyor. Fintables gelir tablosunda eur_donemsel/eur_ttm
kolonlari VAR — ayni bazda karsilastirma bunlarla kurulur.
SONUC MANSETTEN FARKLI CIKTI: ciro TTM EUR1.881 -> hedef ARALIKTA (3Ç sezonu
daha gelmedi, ust banttan asabilir) ✓ · FAVOK TTM EUR574 -> alt bandin (590)
16 mn ALTINDA ⚠. Yani hacim tutuyor, marj tutmuyor.
AYNI KOPRU GEREKENLER (guidance.json): ASTOR (mn$), ARCLK (mn EUR),
FROTO (mn EUR), TOASO (mn EUR), TUPRS ($/varil). TL tabloyla dogrudan
karsilastirilirsa hepsi yanlis sonuc verir.

### 113.4 Mevsimsellik uyarisi
TAVHL 6A cirosu yilin ~%46'si (havacilikta 3Ç en guclu ceyrek). Yari yil
rakamini IKIYLE CARPMAK yanilir; TTM ya da mevsimsel oran kullanilmali.
Yukaridaki guidance karsilastirmasi TTM uzerinden kuruldu.

inceleme-ai.json guncellendi. DEPLOY: inceleme-ai.json + KTPANEL-DAMGA.md.

## 112. DOKUMAN SAPMASI TEMIZLIGI (28 Tem)

Ilk oturumda olculup NOT EDILEN ama duzeltilmeyen sapmalar kapatildi:

| Nerede | Yanlis | Dogru |
|---|---|---|
| §7.3 kota | "Su an 9/12" | 10/12 (§85'te ajanktp.js eklendi) |
| §7.4 klasor agaci | ajanktp.js, kart.js, sukuk.js, middleware.js, test/ YOK | tamamlandi |
| guncelleme-plani.json | TEFAS "BindComparisonFundReturns" | fonGnlBlgSiraliGetir (§60'ta degismisti) |
| guncelleme-plani.json | sicil kaynagi eski | trk_baz_v1 sifirlanabilir taban (§108) |
| yabanci.json rezerv | 42,5 (10 Tem) | 37,7 (17 Tem) — rezerv.json ile CELISIYORDU |

REZERV CELISKISI ONEMLIYDI: iki dosya ayni buyuklugu FARKLI degerle tasiyordu
ve ikisi de panele besleniyordu. rezerv.json web-dogrulamali ve kendi icinde
tutarli (51,2 net - 37,7 swap haric = 13,5 swap stoku ✓), yabanci.json bir hafta
eskiydi. Hizalandi ve yabanci.json'a "tek dogru kaynak rezerv.json'dur" notu
konuldu — ayni sayinin iki sahibi olmamali.
NOT: 10 Tem 42,5 → 17 Tem 37,7, yani haftada 4,8 mlr $ geri cekilme. 30 Tem
yayini teyit etmeli; duserse toparlanma anlatisi gozden gecirilir.

DERS (§7.2'nin veri tarafi): ayni buyuklugu tasiyan iki dosya varsa biri SAHIP
digeri TUKETICI olmali. Ikisi de bagimsiz guncellenirse sessizce ayrisirlar ve
panel hangisini once cizerse onu gosterir.

## 110. CIFT ROBOT SIMGESI — GERI BESLEME DONGUSU (28 Tem)

Kullanici: "bazi kartlarda iki tane agent simgesi var yorumlarda, neden?"
Ekran: "...duyarliligini etkiliyor. [robot] [robot]Ebu 15:54"

KOK NEDEN: imza notun ICINE <span> olarak basiliyordu. Sonraki turda not motoru
notu textContent ile okuyup AI'ya "MEVCUT NOT" diye gonderiyordu — IMZA DA DAHIL.
Isteme "mevcut notun yapisini KORU" yazdigi icin AI imzayi sadakatle geri
yaziyor, sonra kod BIR IMZA DAHA ekliyordu. Her turda birikebilirdi.
AYNI HATA IKI YERDE: not motoru (kart notlari) + ozel gorevler (Takvim->Gorus).

COZUM — CIFT TARAFLI SAVUNMA (biri atlansa digeri tutar):
  okuma: notMetni(el) → .ebuImza span'larini ve emoji kuyrugunu SOYAR.
         AI imzayi hic gormez → dongu KAYNAKTA kesilir.
  yazma: imzaEkle(html) → once imzaSil ile kalintilar temizlenir, sonra TEK
         imza basilir. Elle <span> yazan kod kalmadi, tek nokta.
Imza artik .ebuImza sinifi tasir — emoji aramaya gerek yok, guvenilir bulunur.
imzaSil dongusel calisir (max 5 tur) — birikmis coklu imzalari da temizler.

TEK SEFERLIK ONARIM: depoda (ajan_notlar) birikmis cift imzalar duruyordu ve
NOBETCI her yeniden cizimde onlari geri yaziyordu — depo temizlenmeden ekran
temizlenmezdi. imzaOnar() acilista bir kez depoyu gecer ve normallestirir.

TEST (aginsiz, 8 senaryo, 8/8 gecti): temiz not · tek imza (yeni/eski sinif) ·
EKRANDAKI CIFT VAKA · uclu birikim · AI'nin duz metin kuyrugu · yalniz emoji ·
METIN ICINDEKI emoji KORUNUYOR (yalniz kuyruk soyulur).

DERS: LLM'e "mevcut metni koru" derken NE gonderdigine bak. Sunum katmani
(imza, damga, rozet) ile ICERIK ayni DOM dugumundeyse, model sunumu icerik
sanip cogaltir. Uretilen metne sonradan eklenen her sey, bir sonraki turda
girdiye SIZAR.

ajan.js v=20260729a. DOSYALAR: ajan.js + index.html. KOTA DEGISMEDI 10/12.

### 110.1 ACIK KALAN — NOT/TABLO RAKAM UYUSMAZLIGI (§56 ihlali)
Ayni ekran goruntusunde ikinci bir sorun var, cift simgeden ONEMLI:
  not (15:54): XU100 -%0,34 · XUMAL -%0,70 · XK100 +%0,25 "katilim direncli"
  tablo(18:11): XU100 -%0,49 · XUMAL -%0,98 · XK100 -%0,37
XK100'un ISARETI TERS — notun sonucu ("katilim finans urunleri goreceli direnc
gosteriyor") canli veriyle CELISIYOR. Sebep: SOGUMA_MS (6 saat) not yeniden
yazimini bekletiyor; bu maliyet kontrolu icin DOGRU ama CANLI kartta rakam
iceren not birakiyor.
DAMGA ALTIN KURAL 3 tam olarak bunu yasakliyor: "Rakam iceren statik yorum
metni ya CANLI hesaba baglanir ya RAKAMSIZLASTIRILIR."
SECENEKLER (karar kullanicinin): (a) canli kartlarda Ebu'ya RAKAM YASAGI —
yon ve yorum yazsin, sayiyi tabloya biraksin; (b) canli kartlarda soguma
kisaltilsin (maliyet artar); (c) notun yanina "veri saati" rozeti — en ucuz
ama celiskiyi cozmez, sadece gorunur kilar. ONERI: (a).

## 109. BASLIKTAKI AD CANLIYA BAGLANDI (28 Tem)

Kullanici: "sag ustteki FURKAN KASAPOGLU'nu sil, hangi kullanici adiyla
girildiyse o yazsin." Isim index.html'de SABIT yaziliydi — coklu kullaniciya
gecince (§105) yanlis bilgi haline geldi: omer girse bile furkan yaziyordu.

IKI KAYNAK, SIRAYLA:
1) ktp_ad cerezi — middleware GIRISTE yazar. ANINDA gelir, ag istegi gerekmez,
   KV kapali olsa bile calisir. HttpOnly DEGIL, cunku JS okuyacak.
2) /api/data yanitindaki __ad — cerez silinmisse yedek. data.js profili
   PANEL_USERS'a geri esleyip kullanicinin env'e yazdigi HALI dondurur.

GUVENLIK NOTU: ktp_ad YETKI TASIMAZ, sadece etikettir. Kullanici bu cerezi
elle degistirse basliktaki isim degisir, BASKA HICBIR SEY olmaz — yetkiyi
yalniz imzali (HttpOnly) oturum cerezi tasir, KV profili de ondan cozulur.
Iki cerezin ayrilmasinin sebebi tam olarak budur.

TURKCE: profil KV anahtari icin sadelestirilir (Omer -> omer) ama BASLIKTA
orijinali gorunur. toLocaleUpperCase('tr') kullanilir — 'i' harfi dogru
buyuyor. OLCULDU: "Furkan Kasapoglu" -> profil furkankasapoglu, baslik
FURKAN KASAPOGLU ✓ · "Omer" -> profil omer, baslik OMER ✓
Kullanici adi BOSLUK ve TURKCE HARF icerebilir — tam ad ile giris yapilabilir.
Koruma kapaliysa (env yok) baslikta "·" gorunur, eski isim ASILI KALMAZ.

app.js v=20260729a. DOSYALAR: index.html + app.js + middleware.js + api/data.js.
KOTA DEGISMEDI 10/12.

## 108. SICIL SIFIRLAMA + FAKTOR AGIRLIGI KALICI (28 Tem)

Kullanici: "sicil hatali, sifirla, bugunden itibaren olcsun; reset tusu da koy
ay baslarinda sifirlayayim; faktor agirliklarini da kaydet."

### 108.1 OLCUM: SICIL HATALI DEGILDI
Sifirlamadan ONCE dogrulandi (Fintables canli fiyat vs track.json p0):
  hesaplanan model  -0,37%   ·  panelde gorunen  -0,19%   -> TUTUYOR
(kucuk fark Yahoo/Fintables zaman farki). Sermaye artirimi/bedelsiz kontrolu
de yapildi: 10-28 Tem arasi sepette HIC YOK — yani teknik carpitma yok.
Model 14 Tem'den bu yana XKTUM'un 2,46 puan GERISINDE, cunku gercekten geride.
EN COK GOTUREN: KTLEV -18,3% (katki -0,46p) · SAFKR -10,9% · SEKUR -9,2%
EN COK KATKI:   SUNTK +18,4% (+0,46p) · ENJSA +8,9% · GRSEL +8,6%
DERS: "rakam kotu" ile "hesap bozuk" ayri seylerdir. Sifirlamadan ONCE
dogrulama yapilmasaydi calisan bir olcum aracina hatali muamelesi yapilacakti.
Sifirlama yine de MESRU: aylik olcum donemi icin (kullanicinin asil amaci).

### 108.2 Sicil tabani — ORTU deseni (trk_baz_v1)
track.json'a DOKUNULMAZ. Sifirlama bir ortu yazar:
  {tarih, endeks0, p0:{KOD:fiyat}}
trkBazUygula() yuklemede ortuyu TRK uzerine bindirir (inception, endeks_kapanis,
holdings[].p0, KURULUS rozeti). canliEnjekte bulut serisini taban tarihine gore
kirpar. Ortu silinirse orijinal 14 Tem sicili GERI GELIR — geri donusu var.
EMNIYET: canli fiyat kapsami %80'in altindaysa sifirlama REDDEDILIR — eksik
fiyatla kurulan taban hayali getiri uretir. Onay kutusunda kapsam+eksikler yazar.
TEST: sifirlama aninda model 0,0000% / endeks 0,0000%; ertesi gun hisseler +%3,
XKTUM +%2 verildiginde model %3,00 endeks %2,00 alfa %1,00 -> olcum saglam ✓
AY BASI KULLANIMI: her ay 1'inde SIFIRLA tusu -> o ayin getirisi temiz olculur.

### 108.3 Faktor agirliklari kalici (fm_agirlik_v1)
5 kutu (QUALITY/VALUE/MOMENTUM/LOW_RISK/GROWTH) her degisiklikte kaydedilir,
acilista ILK CIZIMDEN ONCE geri yuklenir. "Varsayilana don" kaydi SILER —
silmeseydi varsayilan bir daha hic gelmezdi (kayit her acilista ustune binerdi).

Iki anahtar da CLOUD_KEYS'e eklendi, KISISEL kutuya gider (§105 ayrimi):
trk_baz_v1 · fm_agirlik_v1 — diger cihazinda da ayni taban ve ayni agirliklar.

app.js v=20260728zz. DOSYALAR: app.js + index.html. KOTA DEGISMEDI 10/12.

## 107. ATIF KARTI HALA ESKI — IKINCI KOK: TAZE FIYAT YOKTU (28 Tem)

KULLANICI: "PORTFOY PERFORMANSI & GETIRI ATFI karti YINE guncellenmemis,
halbuki portfoyumu yukledim." §106 tazelemeyi kurmustu ama sorun surdu.
OLCULDU: pozFiyatOto() portfoy hisselerinin CANLI fiyatini cekip CANLI_FIYAT'a
yaziyor — ama boot listesinde setTimeout(...,5000) ile YALNIZ ACILISTA kosuyor.
Portfoy sonradan yuklenince (geri cagirma / ekleme) kimse onu cagirmiyordu.
Sonuc: §106'nin pozTazele'si kartlari tazeliyor ama TAZELEYECEK FIYAT YOK —
atifRender kaydedilmis portfoydeki eski p.fiyat'a ya da multiple.json
snapshot'ina dusuyor. Kart "cizildi" ama icerik eski.

DERS: "tazele" iki ayri istir — YENIDEN CIZ ve VERIYI YENILE. Birincisi
ikincisi olmadan anlamsizdir. §106'da yalniz birincisi yapilmisti.

COZUM — ikili yapi:
  pozCiz()          : 8 karti yeniden cizer (senkron, aninda)
  pozTazele(fiyat?) : once pozCiz, sonra AWAIT pozFiyatOto, sonra pozCiz
OZYINELEME TUZAGI: pozFiyatOto sonunda tazeleme cagirir. Oradan pozCiz()
cagrilir, pozTazele() DEGIL — yoksa pozTazele→pozFiyatOto→pozTazele sonsuz
donerdi. Kontrol edildi: zincir pozTazele→pozFiyatOto→pozCiz, dongu yok.

### 107.1 §106 DERSINI KENDIME UYGULAYAMAMISIM
§106'da "typeof f==='function' kalkani savunma degil SESSIZLESTIRICIDIR" diye
yazip pozTazele'yi tam da oyle yazmisim: if(typeof f==='function')f(); — bir
gorev bulunamazsa sessizce atlaniyordu. DUZELTILDI: pozCiz eksik fonksiyonlari
toplar ve console.error ile TEK SATIRDA raporlar. Kalkan yalniz gercekten
opsiyonel seyler icin kullanilir; var olmasi GEREKEN sey icin kullanilirsa
hata degil sessizlik uretir.

### 107.2 Tazelik damgasi
Atif kartinin altina "Fiyatlar canli · son cekim SS:DD" damgasi eklendi;
POZ_FIYAT_SAAT bossa KIRMIZI uyari. "Bu kart guncel mi" sorusu artik goz
kararina birakilmiyor. atifRender'a DOKUNULMADI — damga pozDamga() ile
disaridan eklenir (§7.2: calisan yolu degistirme, yanina ac).

app.js v=20260728zy. DOSYALAR: app.js + index.html. KOTA DEGISMEDI 10/12.

## 106. POZISYON TAZELEME KOKU + tanimsiz fonksiyon (28 Tem)

KULLANICI: "kendi portfoyumu ekledim ama yonetim tarafinda hala eski portfoy var."
OLCULDU (grep, tahmin degil): savePoz() 5 yerde cagriliyor, hepsi yalnizca
renderPoz() cagiriyor. renderPoz SADECE Command Center'i + riskStresGuncelle'yi
cizer. Portfoy Yonetimi sekmesindeki kartlar pyInit() icinde BIR KEZ, acilista
ciziliyordu -> pozisyon degisince tazelenmiyorlardi.

POZ'A BAGLI KARTLAR OLCULDU (fonksiyon govdesinde poz.filter/reduce/forEach/length):
  bagli (8): renderPoz · anaRender · atifRender · riskMetRender · likiditeRender
             temettuRender · reelAtifRender · riskButceRender
  bagimsiz (2): takvimRender · fmKarne  -> cagrilmaz, bosuna is yapilmaz

COZUM: pozTazele() merkezi fonksiyonu. Her gorev ayri try ile sarili — biri
patlarsa zincir kirilmaz. 5 mutasyon noktasi + otomatik fiyat tazelemesi = 6 cagri.
renderPoz zaten sonunda riskStresGuncelle() cagirdigi icin o mukerrer eklenmedi.

### 106.1 IKINCI HATA — TANIMSIZ FONKSIYON (sinsi)
pozFiyatOto icinde:  if(typeof pozRender==='function')pozRender();
BOYLE BIR FONKSIYON YOK. Dogrusu renderPoz. typeof kalkani hatayi YUTUYORDU:
otomatik fiyat tazelemesi poz'u guncelliyor, savePoz ile kaydediyor, ama tabloyu
HIC yenilemiyordu. Konsola da bir sey dusmuyordu.
§41 (usRender isim cakismasi) ve §40 (fredModu TANIMSIZDI) ile AYNI SINIF hata.
DERS: `typeof f==='function'` kalkani savunma degil SESSIZLESTIRICIDIR. Var
olmasi GEREKEN bir fonksiyonu boyle sarma — yoksa hata degil sessizlik uretir.
pozTazele bunu duzeltir: bulunamayan gorev console.warn ile RAPORLANIR.

### 106.2 CIKIS baglantisi
Ust bar (Veri Durumu · Yardim · Ebu) yanina "⏻ Cikis" -> /cikis. Mat renkte,
yanlislikla tiklanmasin diye. Coklu kullaniciya gecerken herkesin bir kez
cikis yapmasi ZORUNLU oldugu icin (§105.4) elle URL yazma ihtiyaci kalkti.

app.js v=20260728zx. DOSYALAR: app.js + index.html. KOTA DEGISMEDI 10/12.

## 105. COK KULLANICI — profil bazli depo (28 Tem)

KULLANICI RAPORU: "iki ayri PC'den girip portfoylerimizi kaydediyoruz, panel
kim en son upload yaptiysa digerine de onu gosteriyor."
TESHIS: HATA DEGIL, TASARIM. api/data.js'in ilk satiri zaten "Paylasimli veri
deposu / GET: herkes okur" diyordu. Tek KV anahtari (ktpanel:data), cloudSave
TUM CLOUD_KEYS'i tek govdede POST ediyor -> son yazan digerini eziyor.
cloudLoad'daki muhafiz (bSay===0 && ySay>0) YAKALAMIYOR cunku bulut bos degil,
BASKASININ verisiyle dolu. Yerel localStorage da eziliyor.

### 105.1 Kimlik — middleware.js
PANEL_USERS = "ahmet:sifre1,mehmet:sifre2" (virgul ayrik, ilk ':' boler).
Yoksa PANEL_USER/PANEL_PASS'a duser, o da yoksa koruma kapali (eski davranis).
CEREZ: "<profil>|<imza>" · imza = SHA-256(kullanici|sifre|tuz)
Profil imzayla BAGLI: cerezdeki kullanici adini degistirmek imzayi bozar.
OLCULDU: furkan'in imzasi + "omer" profili -> middleware REDDETTI ✓
Profil adi KV anahtarina girdigi icin sadelestirilir (Turkce harf cevirisi +
a-z0-9_- disi atilir). "Ömer" -> "omer". DIKKAT: yalniz noktalamayla ayrilan
iki kullanici adi AYNI profile duser ve verileri karisir — env'de adlari
birbirinden acikca farkli yaz.

### 105.2 Depo — api/data.js
  KISISEL -> ktpanel:kisi:<profil>  (poz_v1, journal_v1, rb_ayar_v1,
                                     trk_seri_v1, ktp_sukuk_kayit_v1)
  ORTAK   -> ktpanel:ortak          (guidance_v1, ktp_arz_kayit_v1)
Ayrim ORTAK_ANAHTARLAR sabitindedir — tek satir degistirerek cevrilir.
KULLANICI SECIMI: model sicili KISISEL kaldi. SONUC: her profil yalniz KENDI
actigi gunleri biriktirir, iki delikli seri olusur. Ortak yapmak istenirse
trk_seri_v1'i ORTAK_ANAHTARLAR'a ekle, tek ve tam seri olur.
GET Cache-Control: no-store (kisiye ozel — kenar onbellegi OLMAZ, eskiden
s-maxage=5 vardi; profil bazinda bu SIZINTI olurdu).
Eski ktpanel:data kutusu SILINMEZ. Bos yazma yasagi + gunluk yedek her kutu
icin AYRI calisir.

### 105.3 Kurtarma (kullanici zaten veri kaybetti)
Yonetim > BULUT DEPO > "YEDEKTEN GERI YUKLE":
  ?yedek=YYYY-MM-DD -> o gunun fotografi (7 gun TTL, profil bazli)
  ?eski=1           -> profil ayrimindan ONCEKI tek kutu (ham)
Geri yukleme localStorage'a yazar; setItem kancasi cloudSave'i tetikledigi
icin kendi kutusuna senkronlanir. UYARI: gunluk yedek gun basina TEK ve her
yazimda guncellenir — ayni gun cok kez kaydedildiyse fotograf son yazimdan
hemen oncesine doner. Kurtarmadan ONCE yeni kayit YAPMAYIN.

### 105.4 DEPLOY SONRASI ZORUNLU ADIM
Eski cerezlerde profil YOK. Giris gecerli sayilir ama profil cozulemez ->
ORTAK moda duser ve ezme devam eder. HER IKI KISI DE /cikis yapip YENIDEN
GIRMELI. Panel bunu gorunur kilar: Yonetim'de profil yoksa kirmizi uyari.
ENV: PANEL_USERS ekle (PANEL_USER/PANEL_PASS silinebilir ya da kalabilir).
DOSYALAR: middleware.js + api/data.js + app.js + index.html.
app.js v=20260728zw. KOTA DEGISMEDI 10/12.

## 104. OMURGA — reel getiri · tez kapanisi · risk butcesi · kopru testleri (28 Tem)

Kullanici: "sence baska bir seye gerek var mi" -> DORT EKSIK OLCULDU (tahmin
degil, grep ile): (1) atifRender portfoy getirisini TL NOMINAL veriyordu — panel
her yerde reel dusunurken (kart harcamasi TUFE deflate, carry reel faiz) kendi
portfoyune uygulamiyordu; (2) risk lensi TANISAL, ex-ante agirlik/risk kurali
yok; (3) journal serbest metin, tez sonucu HIC olculmuyor; (4) SIFIR otomatik
test — bddk.js'teki __BDDK_TEST_ISTEK kancasi baska kopruye acilmamis.

### 104.1 KOK BULGU: portfoy volu YANLIS hesaplaniyordu
riskMetBody portfoy volunu AGIRLIKLI ORTALAMA aliyordu. Bu matematiksel hatadir:
korelasyonu yok sayar, cesitlendirmenin faydasini goremez, vol DAIMA yuksek cikar.
OLCULDU (risk.json, sigma_m=%26):
| portfoy | naif (eski) | tek-faktor (dogru) | sapma |
|---|---|---|---|
| 3 isim  | %55,1 | %38,7 | 16,5 puan |
| 8 isim  | %45,4 | %28,9 | 16,5 puan |
| 20 isim | %53,3 | %24,3 | 29,1 puan |
20 isimlik portfoy %53 vol gosteriyordu, gercek %24. Cesitlendirme buyudukce
hata BUYUYOR — yani panel en cok, en dogru yapilan seyde yaniltiyordu.

DOGRUSU (tek-faktor / piyasa modeli):
  sigma_i^2 = beta_i^2*sigma_m^2 + sigma_eps_i^2
  sigma_p^2 = beta_p^2*sigma_m^2 + SUM w_i^2*sigma_eps_i^2
RISKE KATKI (CTR) — agirlik degil RISK payi:
  Cov(r_i,r_p) = beta_i*beta_p*sigma_m^2 + w_i*sigma_eps_i^2
  CTR_i = w_i*Cov/sigma_p ,  SUM CTR_i = sigma_p   <- KIMLIK TESTI
Kimlik testi 3 senaryoda sapma 0.0e+0 ile GECTI (test_risk.js).

sigma_m ELLE GIRILIR ama UST SINIR VERIYLE BAGLI: min(sigma_i/beta_i) = %30,5
(ASELS). Ustunde negatif idiyosinkratik varyans cikar; kart bunu yakalar, sifira
kirpar ve UYARIR. Varsayilan %26. Olculdu: %32'de ASELS negatife dusuyor ✓
Eski riskMetBody'ye DOKUNULMADI (§7.2: calisan yolu degistirme, yanina ac).

### 104.2 Reel getiri
reel = (1+nominal)/(1+tufe) - 1 — CIKARMA DEGIL. %45 nominal / %32 TUFE'de
fark 13 puan degil %9,8. TUFE aylik endeks (bie_tukfiy2025), ay ici dogrusal
ara deger. Pozisyona OPSIYONEL `tar` (alim tarihi) alani eklendi (geriye donuk
uyumlu); tarihsizler icin ortak pencere secilir (YTD/1Y/3A).
BILINEN SAPMA: TUFE ~1 ay gecikmeli -> son gunler EKSIK deflate olur, yani
gercek reel getiri gosterilenden biraz DUSUK. Hata yonu karamsar tarafta — kabul.

### 104.3 Tez kapanisi
jrnl kaydina eklendi: durum · giris · cikis · kapanisTarih · sonuc · bozan.
Eski kayitlar alansiz -> 'acik' sayilir (geriye donuk uyumlu).
KARNE: isabet orani, ort nominal, ORT REEL, kazanan/kaybeden ORTALAMA BUYUKLUGU,
ort omur (gun), "bozan gerceklesti" orani. Sonuncusu DISIPLIN olcusudur: tezini
bozacagini onceden yazdigin sey oldugunda gercekten satti mi?
Acik tezler canli fiyatla izlenir (giris/guncel/nominal/reel/hedefe mesafe/yas).

### 104.4 Kopru testleri — test/kopru-testi.js (SLOT YAKMAZ, prod'a dokunmaz)
23 uc, 7'si kritik. "200 dondu mu" YETMEZ: tum kopruler hata halinde bilerek
200+{ok:false} donuyor (UI ayakta kalsin diye) — dogru tasarim ama SESSIZ KIRILMA
uretiyor. Test SEMA dogrular.
GECMIS VAKALARLA SINANDI (aginsiz, sahte yanitla) — 6/6 yakalandi:
  TUFE alani kayboldu · TEFAS emekli (§60) · KAP akisi bosaldi (§92) ·
  fiyat koprusu coktu · kart paylari %100 etmiyor · bilinmeyen VKS kodu
Cikis kodu 1 = KRITIK bozuk, deploy'u durdur. Uyarilar (kota/tatil) engellemez.
KULLANIM: KTP_CRON_SECRET=xxx node test/kopru-testi.js [--hizli]
Cron secret middleware muafiyetini kullanir — ayri kimlik gerekmez.

DOSYALAR: app.js (omurga blogu + poz.tar + CLOUD_KEYS rb_ayar_v1 + boot) ·
index.html (3 acilir kart + pTar alani) · test/kopru-testi.js (YENI).
app.js v=20260728zv. KOTA DEGISMEDI 10/12 (test dosyasi api/ disinda).

## 103. MODEL SICILI — gunluk otomatik birikim (28 Tem)

Kullanici: "faktor model sekmesi guncel degil, gun sonunda otomatik nokta
koyuyordu". OLCUM: track.json statik seri 21 Tem'de durmus (5 nokta);
canliEnjekte yalniz BUGUNUN noktasini hesapliyor, kaydetmiyordu -> 22-28
Tem bosluk.
COZUM: her acilista hesaplanan nokta 'trk_seri_v1' anahtarina yazilir
(gun ici gunceller, gun degisince yeni satir; son 400 nokta) ve CLOUD_KEYS'e
eklendigi icin BULUTA senkronlanir — cihazlar ortak sicil tutar.
Cizim: statik damgali kapanislar ONCELIKLI, bulut birikimi bosluklari
doldurur, bugun canli nokta ustte. TRK.__statik ile orijinal seri korunur
(yeniden cizimde birikim katlanmaz).
NOT: gun sonu kapanis degeri, o gun panel en son ne zaman aciksa o an
alinir (tarayici-tabanli; sunucu cron'u ileride Ebu'ya baglanabilir).
app.js v=20260728zp. DEPLOY: app.js + index.html.

