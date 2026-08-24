# BAKIM EK — §410c (24 Agu 2026, gece · SESSIZ CATCH KAZASI)
# YALNIZ scripts/tazele.mjs degisti. §410 blogunun DUZELTMESI — onceki
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
