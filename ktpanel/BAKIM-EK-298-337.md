# BAKIM EK BLOGU — §298-§337 (17-19 Agu 2026)
# UC GUNLUK SERININ TAM KAYDI. KTPANEL-BAKIM.md icine (en yeni ustte duzenine
# gore) yapistirilir; dosyanin SONUNDAKI "DAMGA CIZELGESINE EKLENECEKLER"
# bolumu ise KTPANEL-DAMGA.md icine gider.
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

# ===========================================================================
# DAMGA CIZELGESINE EKLENECEKLER (KTPANEL-DAMGA.md)
# ===========================================================================

## YENI KART/KATMAN SATIRLARI
- hazine-sonuc.json  · son: OTOMATIK (18:10 kosusu) · kaynak: HMB WP-API
  (portal/v2/posts) + duyuru PDF/govde (§314, pdf-parse) · KUMULATIF —
  duyuru slug'la BIR KEZ islenir · limit 7g (ihalesiz haftalar olabilir)
- sektor.json        · son: 2026-08-17 kapanisi (18 Agu damgalandi) ·
  Fintables endeks_mumlar_gunluk_gh · Claude koprusu · UTC+1 seans kurali
- bist-takvim.json   · son: 2026-08-18 · Fintables yayinlanma_tarihi ·
  8 beklenen / 32 gerceklesen / 7 GECIKEN (SPK sinir notu iceride)
- /lib/lightweight-charts.standalone.production.js · 5.2.0 · npm'den eve
  alindi (§313) — CDN bagimliligi YOK (api/_lib'e degil STATIK alana!)
- makro-takvim.json · son: OTOMATIK (her kosu) · kaynak: ForexFactory/
  FairEconomy haftalik JSON (§319) · High tum ulkeler + Medium majorler ·
  haftalik pencere, arsiv YOK · kaynak limiti 5dk/2 istek (kosu basina 1)

## ALTIN KURALLARA EKLER
- MONOTONLUK (§300): zaman serisi yalniz ILERI akar; kaynak geri giderse
  veri degil rapor uretilir. Fiyat katmanlarinda canli.
- FIYAT YASI (§301): dosya tazeligi ayri, FIYATIN yasi ayri olculur;
  birlikte eskime artik gorunur (is gunu, hep uyari).
- FETCH TAVANI (§311): sayfadaki her fetch 25 sn tavanli (tek sahip sarim);
  kendi signal'i olan aynen gecer.
- YEDEK SIRASI (§307): fiyatta Yahoo birincil, BIST bulteni kosullu yedek;
  yedek girerse katmanin TUMU tek kaynaktan (§114). Yahoo 5+ is gunu
  donarsa oncelik TERSINE cevrilebilir — karar olcume bagli, acik kalem.
- TLS PIN TAKVIMI (§309): bddk pini 15 KAS 2026'da sertifikayla birlikte
  KIRILACAK — hata mesajindaki yeni parmak izi BDDK_PIN'e yapistirilir.

## YENI OTOMATIK KATMANLAR (19 Agu — elle ritual BITTI)
- sektor.json     · SS333 · endeks-arsiv.json'dan · capa sapmasi >7 gun ise
  o ufuk atlanir, damgali deger korunur
- hazine-takvim.json · SS334 v5 · HMB WP-API + strateji PDF · esik 8 ihrac ·
  surum damgali kilit (_ayristirici) · panelin okudugu TUM alanlar yazilir
- makro-takvim.json · SS319 · ForexFactory haftalik JSON
- hazine-sonuc.json · SS314 · HMB ihale sonuclari (muhurlu)

## SURUM IZI (panel)
20260817a→b (§298) → 20260818a (§302) → b (§303) → c (§304) → d (§310) →
e (§311) → f (§312+§313) → g (§316 t25 + §313b) → 20260819a (§317 + sekme
adlari) → b (§315+§316b+§318) → c (§319) → d (§319-D kap) → e (§320 egri) →
f (§321 hizalama) → g (§322 Ebu koprusu · ajan.js cache-buster da bump'landi).
TUMU CANLI DOGRULANDI (19 Agu 16:2x): §319 12 satir ciziyor, Ebu gorusu
16:23'te tazelendi, egri gorseli TR·ABD canli. scripts/tazele.mjs zinciri: §291→297→299/300/301→
305/307/308→314 V1→V2→V2.1→V2.2 (her surum bir onceki kosunun OLCUMUNDEN).

## ACIK KALEMLER (takvimli)
- Cmt 07:00: §306 kopru testinin ILK kosusu (CRON_SECRET eklendiyse)
- ~25 Agu Sali: HMB Eyl-Kas ic borclanma stratejisi → hazine-takvim.json
  rituel (Claude koprusu isler)
- 1 Eyl: fm.json + guidance.json sezon acilisi (bilincli ⏸ suruyor)
- 15 Kas: bddk TLS pin yenileme (takvimli kirilma)
- §315-§337 TAMAMLANDI ve CANLI DOGRULANDI (19 Agu). ham_ozet MUHURLENDI.
- ACIK RISK: /api/data POST'u kutuyu BIRLESTIRMEZ, DEGISTIRIR — eksik paket
  kalani siler. Emniyet yalniz "tamamen bos"u durduruyor (§331 notu).
- SIRADAKI ADAY (kullanici erteledi): Merkez Bankalari karti — TCMB/Fed/ECB/BoJ
  faizleri ve koridor/AOFM panelde ZATEN canli akiyor, tablo onlari okumuyor;
  "son karar" sutunu seri gecmisinden turetilebilir. BOK/BoE kaynaksiz (damgali
  kalir), "siradaki toplanti" kural tabanli takvimle dolar.
- ACIK/OPSIYONEL: (a) DE/JP egri canli kaynagi (Bundesbank/JGB kesfi) — §320
  V2; (b) sinyal sicili (§315 okumalarinin tarihe karsi kaydi, ⭐ onay ister);
  (c) Ebu'ya §315 rozetlerini girdi vermek (data-ebu-veri ile tek satir).
- 20 Agu Per: USD KS sonucu → takvim rozeti kendiliginden yeserecek
- abdSekme fosil imzasi temizlendi (KTP_SURUM'a baglandi)
