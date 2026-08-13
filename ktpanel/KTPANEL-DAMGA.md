# KTPANEL DAMGA CIZELGESI
# HER OTURUMDA ILK BU DOSYA OKUNUR. Amac: hangi kart ne zaman eskir —
# tek bakista gorunur, tur tur kesif yapip kontor harcanmaz.
# Bir kart guncellenince buradaki "son:" tarihi de guncellenir (ayni turda!).
# Son tam denetim: 13 Agu 2026 (§252b-276: tum repo okundu, 83 duzeltme)
# CRON DUZENI (§252x): hafta ici 09:10 fon · 18:10 endeks,fiyat,fon · Cmt 07:00 hepsi(risk dahil)

## ALTIN KURALLAR
1. Panelde GORELI ZAMAN IFADESI YASAK: "bu gece / bugun / yarin" yazilmaz —
   mutlak tarih yazilir (Moody's "bu gece ~23:30" vakasi, 3 gun bayat kaldi).
2. Damga tarihi = icerigin dogrulandigi gun. Icerik dogrulanmadan damga tazelenmez.
3. Rakam iceren statik yorum metni ya CANLI hesaba baglanir ya RAKAMSIZLASTIRILIR (§56).
   Bu kural EBU icin de gecerlidir ve artik ISTEME gomuludur (§111): canli kartlarda
   ([CANLI] etiketli) ajan RAKAM YAZMAZ, yon+kompozisyon yazar. Ihlal ajan panosuna duser.
   AYNI BUYUKLUGUN IKI SAHIBI OLMAZ (§112): bir sayi iki dosyada duruyorsa biri SAHIP,
   digeri ona hizalanir. Ornek: rezerv = rezerv.json sahibi, yabanci.json tuketici.
4. Olay listesi (asagida) ile bu cizelge her oturum acilisinda karsilastirilir.
5. Cizelgeye "islendi" yazmadan once KARTIN KENDISINDE dogrula — bir olay
   birden cok karti besler (Moody's vakasi: Takvim islendi, Kredi Notu karti
   atlandi ama cizelgeye "islendi" yazildi). Olay basina etkilenen TUM kartlar
   bitmeden tarih islenmez.

6. TARIH SATIRI HESAPLANABILIYORSA HESAPLANIR, YAZILMAZ (§245).
   "Siradaki FOMC" ve "Siradaki haftalik veri" satirlari elle yaziliyordu ve
   ikisi de bayatladi. Mutlak tarih yazmak KURAL 1'i saglar ama YETMEZ: tarih
   dogru bicimde yazilir, olay yine de gecer. Takvimi bilinen her satir
   (FOMC · TCMB Persembe · PPK) paneldeki listeden TURETILIR.
   Kontrol: bir tarih satirini elle guncelliyorsan, hesaplanabilir mi diye sor.
7. GUNLUGE YENI BOLUM NUMARASI VERMEDEN ONCE OLC (§245.0).
   BAKIM.md'de 230+ kayit var; ezberden numara verince cakisiyor.
   `grep -o "^## [0-9]*\." KTPANEL-BAKIM.md | grep -o "[0-9]*" | sort -n | tail -1`

## A) OLAY-TETIKLI — olay gerceklesince ANINDA guncellenir
| Kart @konum | Tetikleyici | son |
|---|---|---|
| 07 Kritik Takvim + GORUS @t1 | takvimdeki HER olay gerceklesince satir ✓ + paragraf | 27T |
| MB & Beklentiler tablosu @t1 | herhangi bir MB karari (TCMB/Fed/ECB/BoJ/BOK/BoE) | 27T |
| Fed & Politika @t17 | FOMC karari/tonu — SIRADAKI PANEL HESAPLIYOR (§245: #fomcSonraki) · 29 Tem SABIT gecti | 31T |
| Fed Bilancosu notlari @t17 | FOMC/QT degisikligi | 27T |
| ECB & Politika @t18 | ECB karari — siradaki 10-11 Eyl | 27T |
| BoJ Politika @t16 | BoJ karari — 30 Tem toplantisi GECTI; siradaki tarih DOGRULANMADI (§7.5) | ⚠ 27T |
| BOK kartlari @t16 | BOK karari | 27T (16T artirimi islendi) |
| HKMA kartlari @t16 | aylik bulten (~ay ortasi) | 27T (Haz bulteni) |
| Earnings AI @t14 + GLOBAL @t1 | bilanco aciklaninca — SIRADAKI: 29T GARAN+MSFT/META, 30T AAPL/AMZN/YKBNK, 31T PCE | 28T (ANHYT·PASEU·AKBNK·TAVHL·BMSTL) |
| BIST-YEREL bilanco karti @t1 | TR bilanco/takvim degisikligi | 27T |
| Gundem Ozeti @t7 | buyuk gundem donusu | 27T |
| Ulke kredi notu @mk-para | Moody's/Fitch/S&P olayi | 27T (Moody's 24T teyidi Takvim+KrediNotu kartlarina islendi) |
| Fonlama rejimi @mk-para | PPK karari — siradaki 10 Eyl | 23T (dogru) |
| ABD TUFE (FRED) | OTOMATIK — CPIAUCNS/CPILFENS (NSA, BLS mansetiyle ayni). Hesap TARIHE gore eslesir; indeks sayimi bir eksik gozlemde bir ay kaydiriyordu (§272) | 12A ✓ |
| ECB HICP + politika | OTOMATIK — /api/evds2?mod=ecb. ICP akisi 4 Sub 2026'da EMEKLI, yeni akis HICP ve 5. boyut '4D0' (§275). Uc 'bayat' bayragi tasir | 13A ✓ |
| Halka arz carpanlari | Tahmin birimi ₺ VEYA \$ — \$ secilirse carpan tabani da USD PD/EV olur (§276). Birim yanlis secilirse 1000 KAT sapar | 13A ✓ |
| Bilanco karti istemi | Alti kural sunucuda HESAPLANIR: birim · GYO marj tuzagi · net kar koprusu · puan/bp · bilanco tabani · token tavani (§271) | 12A ✓ |
| Gunluk fon akisi | OTOMATIK — fon-akis.json, Actions sabah kosusu. Formul (pay_t - pay_t-1) x fiyat. Ham DAUM KULLANILMAZ (%48 sapar) (§263) | 12A ✓ |
| Katfon 1G + akis | ⚠ AYNI GUN IKINCI KOSU sifirliyordu — koruma eklendi (§266). Rapor 'ayni gun tekrar kosu' derse 1G korunmus demektir | 12A ✓ |
| Tazelik hesabi | TEK SAHIP: window.tazelikHesap. ajan.js kendi kopyasini KULLANMIYOR artik (§261). Cekmece ile nobet AYRISAMAZ; fark yalniz ESIKTE (Ebu yaklasti'yi da uyarir) | 11A ✓ |
| Yabanci AYLIK blogu | ELLE — odemeler dengesi, ayda bir. Haftalik kisim CANLI (§259/261) | 11A |
| Yabanci haftalik akis | ARTIK OTOMATIK — /api/evds2?mod=yab (bie_mknethar M7/M8/M12). Panelde 'EVDS canli' yazmiyorsa uc dusmus (§259) | 11A ✓ |
| TR 5Y CDS (barometre) | ARTIK OTOMATIK — /api/tcmb?cds=1 · worldgovernmentbonds. 'canli' yazmiyorsa uc dusmus (§253). Eski 206 YANLISTI, 34 puan sapma | 10A ✓ |
| Kart harcamalari (kart.js) | ARTIK OTOMATIK ay secimi — ayin son gozlemi ay sonuna <7 gun ise ay KAPANDI sayilir (§260). Onceki hal bir ay GERIDEYDI | 11A ✓ |
| TEFAS AUM + yatirimci | ARTIK OTOMATIK — kopruden mod=gnl (fonGnlBlgSiraliGetir, sayfalamali). Playwright'e gerek yok (§253i) | 10A ✓ |
| Ebu not motoru | ⚠ KOTA BITERSE panelde serit cikar (#ajanDurum). 'Ebu duraklatildi' KALICI, 'son tur atlandi' GECICI (§254) | izleniyor |
| Bilanco karti birimi | Sayfa beyan etmezse CAPRAZ DOGRULAMA (ciro/TTM ya da PD/DD). Kart 'birim belirsiz' diyorsa ikisi de tutmamis (§255/257) | 11A ✓ |
| Beta cipasi (risk.json) | ARTIK OTOMATIK — XKTUM (BIST resmi arsiv). Rapor 'XU100.IS' derse arsiv tohumu bozulmus demektir (§252y) | 10A ✓ |
| Sektor rotasyonu (sektor.json) | Fintables endeks mumlari · capalar dosyada yazili | 10A §252w |
| Swap stoku (rezerv.json) | TCMB haftalik yayin, PERSEMBE. Sıradaki: 13 Agu (7 Agu haftasi) | 10A §252v |
| Faktor modeli (fm.json) | ⏸ ~1 EYLUL'e ERTELENDI — 2C sezonu bitmeden yarim evren. arac/fm-isle.py HAZIR. Evren karari (147 vs 215) o zaman verilecek | 14T |
| Guidance (guidance.json) | ⏸ ayni gerekce — sirketler 2C ile beklenti revize ediyor | 17T |
| Endeks pay_adedi (xktum/xk100/xktmt.json) | HER BEDELSIZ/SERMAYE ARTIRIMINDA — ceyreklik YETMEZ. 9 Agu'da 10 gunde 3 bedelsiz kacti (KTLEV x3,33 uc dosyada birden) | 10A §252b |
| XKTMT uyelik (39) | BIST revizyonu. Denetim bunu KONTROL ETMIYOR (yalniz xktum) — A2 isi acik | 10A §252b |
| Egri Okuma sabitleri (app.js OKU_*) | PPK (politika 37, 23T sabit) / TUFE (31,75 Tem) / anket (23,95 Tem) | 10A §252d |
| Mega-cap Derinlik @t17 | bilanco sonuclari gecince (29-30T sonrasi yenile) | 25T (icerik dogru) |
| Haftalik yorum ici olay satirlari @mk-yorum | Fed tonu / AKBNK / TUFE sonuclari | 27T |

## B) HAFTALIK RITUEL
### Pazartesi sabah:
| Is | son |
|---|---|
| Haftalik Yorum yeniden yazilir @mk-yorum | 27T |
| Taktiksel Dagilim damga+gerekce | 27T |
| Damga cizelgesi ile olay karsilastirmasi (bu dosya) | 27T |
### Persembe aksami (TCMB haftalik yayinlari):
| Is | son veri | siradaki |
|---|---|---|
| Yabanci akis yabanci.json (hafta_seri'ye ekle) | 17T haftasi | 30T yayini |
| Rezerv karnesi @mk-para (swap haric net) | canli 46,5 · ⚠ swap stoku 24T (18 gunluk), panel kendi uyariyor | 13A Per yayini |
| Katfon akis/AUM gomulu (Fintables) @t5 | 24T | hafta ici herhangi gun |
| Katfon donem getirileri (1A..3Y damgali taban) | 21T | haftalik (Fintables'tan hesaplanabilir) |
| Makroihtiyati @mk-banka: YP mevduat + kredi hacmi (BDDK haftalik) | Tem basi | Cuma yayini |

## B2) SEKTOR ROTASYONU — HAFTALIK DAMGA (§114)
Yahoo 13 BIST sektor endeksine 1H/1A/3A serisi VERMIYOR (yalniz XUSIN·XBANK dolu).
RS o ufuklarda DAMGALI tabandan hesaplanir — sektor.json eskidikce RS de eskir.
| Is | son |
|---|---|
| sektor.json haftalik damgalama (1G/1H/1A/3A) | 28 Tem — Fintables koprusuyle |
KAYNAK TARAMASI KAPANDI (§117): Yahoo · Financekit · Massive/Polygon · Alpha Vantage
hicbirinde BIST sektor endeksi gecmisi YOK. Fintables'ta VAR ama MCP (panel erisemez).
TEKRAR ARASTIRMA. Komut: "sektorleri tazele". Otomasyon
yok, KOPRU zorunlu. Kaynak: Fintables endeks_mumlar_gunluk_gh. Siradaki: 4 Agu Pzt.
KONTROL: rotasyon tablosunun altindaki damga "N/M RS ufku DAMGALI" diyorsa
sektor.json'un tarihine bak. Kalici cozum: sektor getirisini bilesen hisselerden
hesaplamak (§11 + §114.4).

## B4) ENDEKSTEN AYRISMA (t22) — YARI DAMGALI (§151-153)
CANLI: hisse ve endeks getirileri (/api/market, ayni akis — taban kaymasi yok).
DAMGALI: xk100.json endeks uye agirliklari.
  · UYELIK   uc ayda bir degisir (BIST revizyonu: 1 May-31 Eki / 1 Kas-30 Nis)
  · AGIRLIK  HER GUN kayar — serbest dolasim piyasa degerinden turer, fiyatla oynar
OLCULDU: bir hisse %5 hareket edince kendi agirligi ~80 bps, digerleri ~13 bps
seyrelir. Haftalik tazelemede kayma 10-30 bps — aktif agirliklar 100-3000 bps
mertebesinde oldugu icin yorumu BOZMAZ. Sert hareket varsa (%20) kayma 300 bps'e
cikar; kart 14 gunden eskiyse KIRMIZI uyari verir.
TAZELEME: "paneli guncelle" ritualinin PARCASIDIR. Fintables sorgusu
guncelleme-plani.json'da kayitli (hisse_senetleri, 'XK100' = ANY(endeksler)).

## B3) TEKNIK ANALIZ (t21) — CANLI, damga yok (§119)
Fiyat serisi Yahoo'dan (api/market.js ?mod=seri, 400 gun), gostergeler PANELDE
hesaplanir (Wilder). Grafik: Lightweight Charts 5.2.0 (unpkg, SURUM SABIT).
KONTROL: ekran bos acilirsa (a) CDN engelli olabilir — konsolda script hatasi,
(b) Yahoo o kodda seri vermiyor olabilir — durum satirinda yazar.
NOT: TradingView GOMULU widget'i BIST'i kapsamaz (§119.1); bu ekran widget
DEGIL, kendi verimizle cizilen grafiktir. Damgali bileseni YOKTUR.

## B8) ABD BILANCOSU — KAYNAK SIRASI (§184, kullanici kurali)
Kullanici 30 Tem: "AV'den cekebildiklerini cek, sonra eksikleri ve teyit icin
webe basvur, bu kural olsun."

SIRA — her ABD karti icin bu duzende:
  1) ALPHA VANTAGE once denenir
       EARNINGS            -> EPS, beklenti, surpriz yuzdesi, rapor tarihi
       INCOME_STATEMENT    -> ciro, brut kar, faaliyet kari, net kar (marj
                              hesabi buradan cikar)
       EARNINGS_ESTIMATES  -> ileriye donuk EPS/ciro tahminleri
  2) WEB — IKI is icin:
       (a) EKSIKLER: AV'de olmayan kalemler (FCF, capex, segment dagilimi,
           rehberlik, tek seferlik kalemler) — bunlar icin BIRINCIL KAYNAK
           sirketin investor relations bulteni, ikincil CNBC/Bloomberg/8-K
       (b) TEYIT: AV'den gelen rakamlar bultenle karsilastirilir; tutmazsa
           BULTEN kazanir ve fark NOT EDILIR

KRITIK ISTISNA — AYNI GUN ACIKLANAN BILANCO:
AV toplayici bir saglayicidir ve YENI ACIKLANAN CEYREGI GEC ISLER.
OLCULDU (29-30 Tem 2026):
  MSFT 4C aciklamadan ~9 saat sonra: reportedEPS "None", YILLIK satir yalniz
       UC ceyregi topluyordu (13,15 vs FY25 13,64) -> "kar dustu" gibi
       gorunuyordu, oysa bir ceyrek EKSIKTI. Gercek FY26 EPS 17,95 (+%32).
  META EARNINGS_ESTIMATES: estimates BOS dondu.
DOLAYISIYLA: aciklama gunu ve ertesi gun AV'ye guvenilmez. O pencerede
BULTEN BIRINCIL, AV yalniz gecmis ceyrekler icin kullanilir.
AV bir-iki gun sonra CAPRAZ DENETIM aracina doner: kart yazildiktan sonra
rakamlar AV ile karsilastirilir, tutmuyorsa kart duzeltilir.

EKSIKLIK SESSIZDIR — asil tehlike bu: AV alan icin "None" doner ama TURETILMIS
satirlari (yillik toplam gibi) yine de BIR SAYI verir. Denetlenmezse fark
edilmez. Bu yuzden AV'den gelen her rakamin YANINDA hangi ceyreklerin dahil
oldugu kontrol edilir.

## B7) BILANCO KARTI METRIK STANDARDI (§183)
Kullanici 30 Tem'de MSFT/META kartlarini elestirdi: "brut marj nerde, ebitda
marji nerde, net kar marji nerde, fcf nerde." HAKLIYDI — kartlar ciro/EPS/
faaliyet karina bakip MARJ KATMANLARINI ve NAKDI atliyordu.

ZORUNLU METRIK SETI (hem BIST hem ABD):
  1. CIRO            + y/y (+ c/c varsa)
  2. BRUT MARJ       yuzde ve y/y degisim (puan)
  3. FAALIYET KARI   tutar VE marj — FAVOK ayrica aciklanmiyorsa bu kullanilir
                     ve "FAVOK aciklanmadi" NOTU dusulur
  4. NET KAR         tutar VE marj + EPS (ABD'de beklentiyle birlikte)
  5. FCF             + CAPEX — nakit tarafi marjdan bagimsiz hikaye anlatir
  6. SEGMENT DAGILIMI ciro ve mumkunse segment karliligi

KURALLAR:
- Bir kalem kaynakta YOKSA "aciklanmadi" yazilir, TAHMIN EDILMEZ.
  (MSFT 4C FCF boyle isaretlendi — sirket ceyreklik FCF vermedi.)
- MARJ KATMANLARI YAN YANA OKUNUR: brut -> faaliyet -> net. Hangi katmanda
  kayip oldugu sorunun NEREDE oldugunu soyler.
  ORNEK (30 Tem): MSFT brut −1 puan AMA faaliyet marji YATAY (%45);
  META brut korunmus AMA faaliyet %43 -> %31. Ayni AI harcamasi, farkli sonuc.
  Bu karsilastirma ancak IKI KARTTA DA AYNI SET varsa yapilabilir — standardin
  asil sebebi bu.
- FCF ATLANMAZ. META'da mansette gorunmeyen asil hikaye oradaydi: 784 mn$
  (1C26'da 12,4 mlr$), capex ikiye katlandi, aradaki fark BORCLA fonlaniyor.
  Marja bakip FCF'e bakmamak, bu tesbiti tamamen kacirmak demekti.

inceleme-ai.json'a `_kart_standardi` alani olarak da yazildi.

## B6) BILANCO KARTI VERI KAYNAKLARI (§178)
YERLI (BIST): Fintables SQL — hisse_finansal_tablolari + gelir_tablosu_kalemleri.
  Dogrudan KAP bildiriminden turer, ACIKLANDIGI AN kullanilabilir.
  Sorgu: WHERE yil=<Y> AND ay=<3/6/9/12>, try_ceyreklik + try_donemsel.
YABANCI (ABD): UC KATMANLI, sirasiyla denenir —
  1) SIRKET BULTENI (investor relations sayfasi) — ayni gun, en guvenilir
  2) Web aramasi (CNBC/Bloomberg/Reuters) — ayni gun, ikincil dogrulama icin
  3) Alpha Vantage EARNINGS — BIR-IKI GUN SONRA birincil kaynak olur
OLCULDU (29 Tem 2026, MSFT): aciklamadan ~9 saat sonra Alpha Vantage'da
  reportedEPS "None" idi; YILLIK satir yalniz UC CEYREGI topluyordu (13,15).
  Bu haliyle okunsa "FY26 13,15 < FY25 13,64 -> kar dustu" sonucu cikardi.
  GERCEK: 4. ceyrek 4,81 (GAAP), FY26 ~17,96, yani +%31,7.
KURAL: toplayici veri saglayicilari AYNI GUN aciklanan bilancoda EKSIK olabilir
ve eksiklik SESSIZDIR — alan "None" dondurur, yillik satir yine de bir sayi
verir. Ayni gun kart yaziliyorsa sirket bulteni birincil kaynaktir; AV
bir-iki gun sonra CAPRAZ DENETIM icin kullanilir.

## B5) INCELEME KARTLARI (inceleme-ai.json) — YAZIM KURALI (§161)
YENI KART DIZININ BASINA EKLENIR. Sona eklemek 29 Tem'de kartlarin gorunmemesine
yol acti: 18-20. siraya dustuler, kullanici 17 kart kaydirmadigi icin goremedi.
Her kartta IKI tarih alani bulunur:
  · tarih      -> TR gorunum, "29 Tem 2026"
  · tarih_iso  -> siralama icin, "2026-07-29"
Panel §161 ile KENDI DE SIRALIYOR (en yeni ustte, ayni gunde alfabetik), yani
dosya sirasi artik kirilma yaratmaz. Yine de dosya dogru sirali tutulur —
iki katman birden, cunku dosyayi elle acan insan da dogru sirayi gormeli.

## C) CANLI (kendiliginden akar — dokunulmaz, sadece bozulursa)
Yahoo endeks/vix/dxy/brent · EVDS egri+makro · FRED 29 seri · BoJ · HKMA ·
ECB (DFR/bilanco/IRS) · TEFAS yeni API (1G+fiyat+AUM) · KAP akisi · Finnhub ·
kripto · barometre skorlari · Okuma karti hesaplari · lensler ·
TL kredi/mevduat faizleri+makas (mk-faiz) · Reel sektor doviz pozisyonu (mk-enf, mod=dvz kendini-cozen — aylik ~2ay gecikmeli) ·
KKO + mal gruplari (mk-enf, mod=kko — aylik, ay ortasi) ·
Yabanci stok+hafta canli katmani (mk-para karti, mod=yab — Per yayininda OTOMATIK yenilenir,
rituel yuku azaldi: yabanci.json hafta_seri'ye tarihsel ekleme yeterli)
KONTROL: "CANLI" damgasi olan kart bos/eski gorunuyorsa API olmus olabilir —
TEFAS vakasi (§60): canli damga ancak veri gercekten akiyorsa basilir.

## C2) DEPLOY ONCESI (§104.4)
| Is | komut |
|---|---|
| Kopru testi — 23 uc, sema dogrulamali | `KTP_CRON_SECRET=xxx node test/kopru-testi.js` |
| Hizli tur (5 kritik uc) | `... node test/kopru-testi.js --hizli` |
Cikis kodu 1 -> DEPLOY ETME. Bozuk kopru panelde SESSIZCE bos gorunur,
damga hala "canli" der — §60 dersi tam olarak buydu.

## D) YAPISAL / NADIR
| Is | son | not |
|---|---|---|
| fm.json faktor modeli | 14T | tazeleme ayri buyuk is — kullanici isterse |
| EGRI_STATIK yedegi | 27T | canli calisirken onemsiz |
| HICP yeni dataflow anahtari | — | deploy ciktisiyla netlesecek (⚠eski seri etiketi) |
| BOK ECOS canliya baglama | — | kullanici key alirsa |
| Kredi notu takvimi (S&P/Fitch pencereleri) | — | arastirilip A'ya tarih yazilabilir |

## BILINEN YAKIN OLAYLAR (27 Tem itibariyla)
28T Sal: AKBNK✓ TAVHL✓ BMSTL✓ islendi + FOMC gun1 · 29T Car: FED 21:00 + GARAN + MSFT/META ·
30T Per: AAPL/AMZN + YKBNK + BoJ Outlook + TCMB haftalik yayinlar ·
31T Cum: PCE · 3A Pzt: TUFE · 5A: Novo · 7A: TCMB Enf Raporu + ABD istihdam ·
10A: ENJSA (portfoyde) · 12A: ABD TUFE · 13A: RGYAS (portfoyde) · 19A: BIST son tarih ·
20-22A: Jackson Hole

## E) GUVENLIK
middleware.js (Edge, kota disi): PANEL_USER+PANEL_PASS env ile giris korumasi.
Oturum 30 gun imzali cerez; sifre degisince eski oturumlar otomatik duser.
/cikis ile oturum kapanir. Env silinirse koruma kapanir (kilitlenme yok).

## E2) COK KULLANICI (§105)
PANEL_USERS env ile her kisinin kendi hesabi. Kayitlar ikiye ayrilir:
KISISEL (poz · tez · risk ayari · sicil · sukuk) -> ktpanel:kisi:<profil>
ORTAK   (guidance · halka arz degerlemeleri)     -> ktpanel:ortak
Ayrim api/data.js > ORTAK_ANAHTARLAR sabitinde, tek satir.
Profil oturum cerezinden gelir, istemci belirleyemez.
KONTROL: Yonetim > BULUT DEPO satirinda profil adi gorunmeli. Kirmizi uyari
cikiyorsa PANEL_USERS yok YA DA eski cerezle girilmis — /cikis + yeniden giris.
Kurtarma: ?yedek=YYYY-MM-DD (7 gun) · ?eski=1 (profil oncesi kutu).

## F0) NOBETCILER (§118) — Ebu'nun deterministik tarafi
TAZELIK: guncelleme-plani.json yaslarini olcer; SEZON kurali (Sub-Mar/Nis-May/
Tem-Agu/Eki-Kas) ceyreklik katmanlarda limiti 10 gune dusurur.
BILANCO: KAP FR bildirimleri vs inceleme-ai.json kartlari; karti eksik/eski
kodlar "kart bekliyor" listesine duser (portfoy + Top-40 + kartlilar evreni).
GORULDUGU YER: ajan cekmecesi "⚙ NOBET" · Earnings AI ust seridi · sabah notu.
KONTROL: cekmecedeki NOBET bolumu bos ya da "nobet henuz calismadi" diyorsa
ajan.js yuklenmemis ya da guncelleme-plani.json okunamiyor.
ONEMLI: panele veri besleyen HER dosya guncelleme-plani.json'da OLMALI —
kayitta olmayan dosya sessizce eskir (28 Tem'e kadar 6 dosya boyleydi).

## F) YASAYAN AJAN (ajan.js — runtime katmani)
Panel acikken: 10 dk'da bir GOREVLER listesindeki canli fonksiyonlari tazeler
(pozFiyatOto/katfonCanli/tlFaizKart/yabCanli/kkoKart/fmKarne/atifRender),
30 dk'da bir AJAN GUNDEM NOTU yazar (Haberler t7 basindaki kart).
AI: kullanicinin Anthropic anahtari (localStorage, yalniz o tarayici) ->
Claude Haiku dogrudan browser'dan; anahtar yoksa kural-tabanli ozet.
Urettigi her sey RUNTIME. v4 FONKSIYON MIMARISI: gozler client (DOM kesfi),
beyin sunucu (mod=ai), HAFIZA BULUT (api/ajan + Upstash KV — cihazlar senkron),
SABAH CRON'u 09:00 TR (son baglam fotografindan gundem — panel acilmadan hazir).
KV env yoksa localStorage'a zarif dusus.
BAKIM NOTU: panelde IKI ayri alt-sekme mekanizmasi var (§124), karistirma:
(a) PY_GRUP+pySubnav = ANA SEKME grubu · (b) subtab-btn/subtab-panel = SEKME ICI
bolum (t2 Makro, t10 Sukuk). Once hangisi oldugunu KONTROL ET.
Sabit metinli bolumler ajandan data-ebu="hayir" ile muaf tutulur.
Portfoy Yonetimi alt-navina YENI SEKME eklenince UC yere yazilir:
(a) app.js PY_GRUP  (b) index.html pySubnav butonu  (c) ajan.js SEKME_DISLA (§121).
Ucuncusu unutulursa Ebu o sekmenin kilavuz notlarini yeniden yazip siler.
yeni canli fonksiyon eklenince ajan GOREVLER listesine de eklenir;
yeni onemli kart eklenince BAGLAM listesine; NOT MOTORU v3 OTOMATIK KESIF kullanir: notu olan HER kart kendiliginden
kapsama girer — yeni kart icin liste bakimi GEREKMEZ (lbl+note yeterli).
NOT MOTORU: kart verisinin hash'i degisince o kartin .note'unu AI'ya yeniden
yazdirir (degisim yoksa istek YOK — maliyet sifir). Ajan notlari localStorage
'ajan_notlar'; statik HTML metni fabrika ayaridir, sifirla butonuyla donulur.

