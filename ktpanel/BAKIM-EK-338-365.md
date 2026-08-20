# BAKIM EK BLOGU — §338-§365 (20-21 Agu 2026)
# BIR GECELIK SERININ TAM KAYDI. KTPANEL-BAKIM.md icine (en yeni ustte duzenine
# gore) yapistirilir; dosyanin SONUNDAKI "DAMGA CIZELGESINE EKLENECEKLER"
# bolumu ise KTPANEL-DAMGA.md icine gider.
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

# ===========================================================================
# DAMGA CIZELGESINE EKLENECEKLER (KTPANEL-DAMGA.md)
# ===========================================================================

## YENI KART/KATMAN SATIRLARI
- CEYREKLIK SERI (t23) · KAP mod=ham · 15 ceyrek · tam bilanco+gelir+nakit akis
  + 14 turev metrik · ENFLASYON ENDEKSLI · onbellek ktp_kap_ceyrek_v2
- GYO NAV (t26) · gyo-nav.json · TSPB resmi NAD · 45 sirket · fiyat Actions'ta
- SEKTOREL VERILER (t27) · Katilim Fonlari + PYS Sektor (t10'dan tasindi)
- PYS akisi · fon-akis.json `pys` + `pencereler` · 1G/1H (1A gun birikince)
- Faktor evreni · faktor-evren.json · XKTUM 245 uye · kademeli · PANEL BAGLI DEGIL
- ABD Risk kartina: JOLTS, istifa orani, ham petrol stoku, rafineri kullanimi, WTI

## ALTIN KURALLARA EKLER
- DOM'DA VAR OLMAK GORUNUR OLMAK DEGILDIR (<tr> icin tBodies[0]).
- null KONTROLUNDE isFinite DEGIL Number.isFinite.
- KAYIT SEMASI DEGISIYORSA ONBELLEK ANAHTARI DA DEGISMELI.
- HESAP YONTEMI DEGISTIYSE ESKI KAYITLAR DAMGALANIP ONE ALINMALI.
- ENFLASYON MUHASEBESINDE KUMULATIF FARKI CEYREK DEGILDIR.
- TURETILMIS ORAN GOSTERECEKSEN IKI BACAGINI DA SEN GETIR.
- HEDEF DOSYANIN BIRIMINI VARSAYMA — bir ornekle DOGRULA.
- UCUN GERCEK CIKTISINI GOR, ALAN ADI TAHMIN ETME.
- TASIMA = KAPSAMIN DA TASINMASI (dugme + panel + uyelik + ajan kapsami).
- SESSIZ RETURN TESHISI GECIKTIRIR — her erken cikis iz birakmali.
- YORUMDA ETIKET ADI GECMEZ (denetim sayaci sahte dengesizlik uretir).
- PARALELLIK BOT SAYILABILIR — kaynak reddediyorsa seri + gecikmeli dene.

## SURUM IZI (panel)
20260820a (§339) → b (§341+§342) → c (§342b) → d (§343+§344) → e (§345) →
f (§345b) → g (§345c) → h (§345d) → i (§345e) → j (§347) → k (§348) →
l (§349+§350) → m (§350b) → n (§350c) → o (§351) → p/r (§351b/c) → s (§352) →
t (§353) → u (§353b) → v (§353c) → w (§354) → x (§355) → y (§356+§357) →
z (§360) → 20260821a (§364) → b (§364b) → c (§365+§365b) → d (§365c).
api/kap.js: kap-2026-08-20-o (§338) → p/q/r/s (§340 denemeleri) → t (§340e) →
u (§338b seri cekim).
middleware.js: §361c (/api/kap muafiyeti).
scripts/tazele.mjs: §358 → §359 → §361 → §361b/d/e/f/g → §362 → §363/b → §364/b.

## ACIK KALEMLER (takvimli)
- FAKTOR EVRENI PANELE BAGLANMADI (bilincli). Iki kosul: (a) kapsam ~150-200
  sirket (su an 21/245, turda 6, ~2 hafta), (b) banka/GYO sablon sinavi.
  GYO'lar icin cozum HAZIR (§364 NAV iskontosu); BANKA (ALBRK) henuz siraya
  girmedi — XBRL kodlari farkli, ayri harita gerekebilir.
- GYO NAV donem gecikmesi: son YAYIMLANMIS 2025/12; 2026/06 hazir ama
  isPublished=false. Yayimlaninca kendiliginden gecer.
- TDGYO/PEKGY/IDGYO gibi asiri primli gorunenler icin ESIK karari (faktore
  baglarken).
- PMI gerceklesen degeri: FRED'de lisansli degil, alternatif kaynak arastirilmadi.
- §359 1A penceresi ~22 is gunu birikince acilir (su an arsiv 7 gun).
- WMT 2026/2C: Alpha Vantage 20 Agu'da reportedEPS "None" — bilancolar birkac
  saat/gun sonra isleniyor.
- ONERI (kullaniciya sunuldu, karar bekliyor): Qwen 3.8 ile KAP bildirim
  ozetleri (gunde 200+ bildirim okunmuyor) ve yedek AI saglayici. YARGI
  gerektiren isler (portfoy yorumu, celiski denetimi) Claude'da kalir.
