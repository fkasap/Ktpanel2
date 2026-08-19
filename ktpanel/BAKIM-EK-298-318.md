# BAKIM EK BLOGU — §298-§318 (17-19 Agu 2026)
# Bu dosya 298-314 blogunun UZERINE 19 Agu kayitlarini ekler; tek parca
# yapistirilir. En yeni ustte.

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
  alindi (§313) — CDN bagimliligi YOK

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

## SURUM IZI (panel)
20260817a→b (§298) → 20260818a (§302) → b (§303) → c (§304) → d (§310) →
e (§311) → f (§312+§313) → g (§316 t25 + §313b) → 20260819a (§317 + sekme
adlari) → 20260819b (§315 sinyal + §316b ima + §318 aofm onbellek).
Canli dogrulanan: g'ye kadar tumú + 19a; 19b kullanici yuklemesinde. scripts/tazele.mjs zinciri: §291→297→299/300/301→
305/307/308→314 V1→V2→V2.1→V2.2 (her surum bir onceki kosunun OLCUMUNDEN).

## ACIK KALEMLER (takvimli)
- Cmt 07:00: §306 kopru testinin ILK kosusu (CRON_SECRET eklendiyse)
- ~25 Agu Sali: HMB Eyl-Kas ic borclanma stratejisi → hazine-takvim.json
  rituel (Claude koprusu isler)
- 1 Eyl: fm.json + guidance.json sezon acilisi (bilincli ⏸ suruyor)
- 15 Kas: bddk TLS pin yenileme (takvimli kirilma)
- §315 + §316b + §318: TAMAMLANDI (19 Agu, sandbox 14/14) — kabul kullanici
  yuklemesinde. ham_ozet MUHURLENDI (18 Agu aksami, 10 ham temizlendi).
- 20 Agu Per: USD KS sonucu → takvim rozeti kendiliginden yeserecek
- abdSekme fosil imzasi temizlendi (KTP_SURUM'a baglandi)
