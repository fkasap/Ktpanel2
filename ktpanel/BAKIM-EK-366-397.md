# BAKIM EK BLOGU — §366-§397 (21-23 Agu 2026)
# BAKIM-EK-338-365.md'nin DEVAMI. KTPANEL-BAKIM.md icine yapistirilir; sondaki
# "DAMGA CIZELGESINE EKLENECEKLER" bolumu KTPANEL-DAMGA.md'ye gider.
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

# ===========================================================================
# DAMGA CIZELGESINE EKLENECEKLER (KTPANEL-DAMGA.md)
# ===========================================================================

## YENI KART/KATMAN SATIRLARI
- FEK + KOPMA-σ (t9 Degerleme altinda) · KAP canli · borc servisi dayanikliligi
  · veto sistemi · iki rejimli DD · beklenen kayip · duyarlilik izgarasi
- MKK Fon Buyuklugu (t27 alt sekme) · vap-fon-akis.json · 14 fon turu × ay
  · ay gezinmesi · resmi saklama verisi
- SOHBET (sag alt yuzen dugme) · Ebu'nun ikinci modu · panel ozeti + web
  aramasi + kart acma protokolu [KART:tXX:TICKER]
- kap-arsiv/<KOD>.json · ham tablolar · 15 ceyrek · faktorden BEDAVA doluyor

## ALTIN KURALLARA EKLER
- HIZ SINIRINI ASMAYA CALISMA — ISTEGI HIC YAPMA (edge cache + arsiv).
- AYNI VERIYI IKI MODUL CEKIYORSA BIRI CEKSIN, DIGERI OKUSUN.
- AYNI COZUMU IKINCI KEZ YAZIYORSAN ORTAK YERE TASI.
- BIR FONKSIYONUN DONUS SOZLESMESINI DEGISTIRIRSEN TUM CAGIRANLARI GOZDEN GECIR.
- BIR KOSULU IKIYE BOLERKEN ICINDEKI HER KORUMAYI DAGIT.
- Math.abs/parseFloat GIBI DONUSUMLER null'I SESSIZCE SAYIYA CEVIRIR.
- BIR MODELIN GECERLI ARALIGI VARSA EKRAN ONU BILMELI (4σ · 10x tavanlari).
- IKI OLCU AYNI EKRANDAYSA DOYGUNLUK ESIKLERI AYNI BUYUKLUGE BAKMALI.
- BIR GIRDI SUPHELIYSE ONU KULLANAN TUM CIKTILAR AYNI SEKILDE ISARETLENIR.
- BIR UYARI SONUCU DEGISTIRMIYORSA CEZAYA DONUSMEMELI.
- BIR SONUCA GUVENMIYORSAN ONU NOTLANDIRMA (uyari notun YERINE gecer).
- TURETILMIS BIR SAYI SACMA GORUNUYORSA GIRDIYI SORGULA.
- DUZENLI SALINIM RISK DEGILDIR — mevsimselligi belirsizlikten ayir.
- DAGILIMIN UCUNU OLCERKEN DAYANIKLI TAHMINCI KULLANMA (MAD kuyruk icin yanli).
- ESIKLI FONKSIYON GIRDI GURULTUSUNU NOT SICRAMASINA CEVIRIR — sureklilestir.
- BIR ESIGI HANGI SERIDEN HESAPLADIYSAN O SERIYE UYGULA.
- BASARISIZ SORGU EKRANI TEMIZLEMELI — bayat sonuc yeni cevap gibi gorunur.
- ELLE YAZILAN ICERIK OTOMATIK URETIMIN KAPSAMINDA OLMAMALI (data-ebu="hayir").
- BIR RISK GERCEKLESTIGINDE UYARIYI HABERE CEVIR.
- SAYI BICIMINI DILE GORE VARSAYMA — buyukluk testiyle dogrula.
- BUYUK JSON'DA VERI YOKSA ANAHTAR ADINI DEGIL DEGER KALIBINI ARA.
- TARAYICIDA CALISIP SUNUCUDA 401 VERIYORSA ILK BAKILACAK YER CEREZ.
- BIR SAYFADA TEK GRID VARSAYMA.
- OZET KATMANI EKSIKSE MODEL PANELI YOK SAYAR (sohbet kapsamini kaynaklarla esitle).
- "HEPSINI GONDER" KOLAY AMA PAHALI — soruyu okuyup sec.
- AYRIM VERIDE YOKSA VEKIL KULLAN AMA VEKILIN NEREDE CURUDUGUNU SOYLE.
- SUREKLI DUSEN BIR KAYIT KUYRUGU KILITLER — geri cekilme sart.
- KAYIT VARDI, OKUMADIM (bu blokta UC kez: §361c · §367 · §369c).

## SURUM IZI (panel)
20260821a (§364 GYO NAV) → b (§364b fiyat) → c (§365 Sektorel Veriler) →
d (§365c Ebu kapsam) → e (§366 MKK VAP) → f (§366e tur kirilimi) →
g (§366f ay gezinmesi) → h (§369 FEK) → i (§369b gevsek) → j (§369c onbellek) →
k (§369d hata nesnesi) → m (§370 KOPMA-σ) → n (§370b dayanikli σ) →
p (§371+§372) → r (§372b) → s (§372c ayrisma) → t (§373 faiz denetimi) →
u (§373b bos kalem) → v (§373c not bastirma) → w (§374 faiz zinciri) →
x (§375 elestiri paketi) → y (§377) → z (§378 mevsimsellik) →
20260822a (§379 bayat sonuc) → b (§385 sohbet) → c (§386 gercek sayilar) →
d (§387 makro) → e (§388 secici ozet) → f (§389 gorunum) → g (§390 capex) →
h (§391 doygunluk) → i (§392 faiz tutarliligi) → j (§392c) → k (§393) →
m (§394 esik hizalama) → n (§394b NaN) →
20260823a (§395 repo rejimi) → b (§396 haftalik not) → c (§397 Ebu disi) →
d (§397b takvim).
api/kap.js: §380 edge cache (mod=ham 1 yil · mod=donemler 6 saat).
api/ajanktp.js: §385 sohbet modu · §386b sozluk+kart · §388b model secimi.
scripts/tazele.mjs: §366 VAP → §381 arsiv → §382 kosu-ici onbellek →
  §383 faktor arsive yazar → §384 basarisizlik sayaci.
vercel.json: ajanktp maxDuration 45 → 120 (sohbet + web aramasi).

## ACIK KALEMLER
- FAKTOR EVRENI PANELE HALA BAGLANMADI (bilincli). Kapsam 64/245.
  GYO'lar icin cozum hazir (§364 NAV iskontosu); BANKA (ALBRK) sablonu henuz
  siraya girmedi.
- KAP ARSIVI: 20 dosya. Kosu basina +8-10 ceyrek (faktorden bedava).
  XK030 ~10 gunde, tum evren ~33 gunde dolar. Panel arsive HENUZ BAGLANMADI —
  baglaninca bir sirket icin 15 istek 1'e iner.
- VAP TUR KIRILIMI KISMI: 100/168 satir (yanit sayfali). Son 7 ay tam, eski
  aylar eksik. Dosyada `tur_kismi:true` ile isaretli.
- ARSIV MODULUNUN KENDI CEKIMI hala hiz sinirina takiliyor ("fetch failed").
  Onemi yok — asil is faktor evreninde bedava yapiliyor.
- TEFAS BOT KORUMASI (24 Agu kosusu): "Request Rejected" — katilim fonlari
  31/46 (%67), esik %95. Gecici gorunuyor; ust uste tekrarlarsa kopruye
  bekleme/tekrar deneme eklenmeli.
- CEKIRDEK FAVOK DOGRULAMASI: MERCN 556 mn hala elle dogrulanmadi. Zincirin
  basinda duruyor (karsilama -> firma carpani -> λ -> yuk), yani hata AYNI
  YONDE IKI KEZ carpiliyor.
- FEK "bilgi tasidigi aralik 0,8-3,0" metni ile 10x doygunluk esigi arasinda
  kucuk bir metin uyumsuzlugu var (LMKDC/CIMSA'da goruldu). Sonucu etkilemiyor.
- STOKASTIK BARIYER ve USD BAZLI σ SERISI: elestiride onerildi, YAPILMADI.
  Ikisi birlikte yapilmali (biri digerini dengeliyor); USD seri KAP'tan gelmiyor.
