# 25 Agu 2026 — DOKUMANTASYON TAZELEME

## YUKLE
  DEPLOY.md      -> ktpanel/           (uzerine yaz)
  OTOMASYON.md   -> ktpanel/           (uzerine yaz)
  KURULUM.md     -> ktpanel/           (uzerine yaz)
  BENIOKU.md     -> ktpanel/arac/gelen/   ← DIKKAT: YENI YER
## SIL
  ktpanel/BENIOKU.md        (kokteki eski kopya — yeri yanlisti)
  ktpanel/SILINECEK-DOSYALAR.md  (birlestirme talimatiydi, isi bitti)

## NE DUZELTILDI

### DEPLOY.md — en yanilticisiydi
- SURUM NUMARASI SILINDI. "panel 20260731-p" yaziyordu; gercek 20260825a idi
  ve 25 gundur bayatti. Talimati izleyen kisi DOGRU deploy'u YANLIS sanardi.
  Artik sürüm bu dosyada YAZMIYOR — "canli rozetten oku" deseni (§399/§415).
- "Bes dosya hepsi birden" -> gercege uyarlandi: her teslimatta bes dosya
  degismiyor. Kural artik "BAGLI OLANLAR birlikte": app.js<->index.html,
  ajan.js<->index.html (surum damgasi ucluüsu); api ve veri BAGIMSIZ.
- Dosya yerleri tablosu guncel: 12 api ucu, scripts/, arac/, arac/gelen/.
- API KOTASI 12/12 DOLU uyarisi eklendi (yeni api/*.js ACILAMAZ).
- Yukleme sirasi kurallari eklendi (kosu sirasinda push yok; tazele.mjs once
  yuklenir sonra tetiklenir — 24 Agu'da iki tur bosa gitti).
- Gecmis "acik kalemler" (CANTE/GENIL teshis, Agustos dalgasi) SILINDI: cozuldu.

### OTOMASYON.md — hikayenin sonu yazilmamisti
- Dosyanin MERKEZINDEKI soru "KAP sunucudan acilir mi" ÇÖZÜLDÜ (§338-365):
  api/kap.js finansal raporlari okuyor, faktor-evren KAP'tan doluyor (94/245).
  Eski metin bunu hala ACIK gosteriyordu.
- "Engelli 6 katman" tablosu gecersizdi — yerine gercek durum kondu.
- EDGAR bolumu eklendi (§398-401): ABD bilancosu, KAP motorunun tasinmasi.
- TEFAS BOLUMU EKLENDI — son iki gunun en buyuk mimari olayi hic yazmiyordu.
  Bes erisim yolunun olcum tablosu + iki katmanli savunma + kalici cozum sarti.
- "Claude oturumunda tazelenen" sinifi tanimlandi (Fintables MCP Actions'tan
  cagrilamaz — bu bir eksiklik degil, YAPISAL sinir).
- Mesru elle istisna sayisi: 2 (swap stoku + TEFAS konsol). Kural korundu:
  once olcum, sonra gerekce; sayi asla artmaz.
- "Sessiz hatalar" tablosu 25 Agu vakalariyla guncellendi.

### KURULUM.md — saglamdi, eksikleri tamamlandi
- 09:10 SABAH FON KOSUSU eklendi (§249n) — zamanlama tablosunda YOKTU.
- 11 dakikalik butce kurali eklendi.
- Denetim tablosuna "ikiz dosya + kok yetim" bekcisi eklendi (§407b).
- §413 KIRMIZI/SARI ayrimi anlatildi (veri kaybi yoksa sari).
- "KOSU RAPORUNU OKUMA" bolumu eklendi: yol: satiri, fon sayisi, §4xx
  satirlari, ve "beklenen satir hic cikmadiysa once blok calisti mi sorulur".
- "Elle tazeleme 32/yil" hesabi yerine GERCEK tablo: kim neyi ne zaman yapar.
- Sorun cikarsa nereye bakilir bolumu eklendi.

### BENIOKU.md — icerik dogruydu, YERI yanlisti
ktpanel/ kokunde duruyordu ama anlattigi klasor arac/gelen/. Tasindi;
"yalniz kopru dustugunde bakilir" ve 24 Agu kapsam kapisi vakasi eklendi.

## BIRLESTIRME KARARI (neden 3 dosya ayri kaldi)
Ucu de AYRI SORUYA cevap veriyor ve ayri anlarda okunuyor:
  DEPLOY    = "yukledim, dogru mu?"        (her teslimattan sonra)
  KURULUM   = "sistem nasil isliyor?"      (sorun cikinca / yeni kurulumda)
  OTOMASYON = "ne otomatik, ne degil, neden?"  (mimari karar aninda)
Tek dosyada birlesseydi 300+ satirlik bir metinde her seferinde dogru
bolumu aramak gerekirdi. Birlestirme YAPILDI ama dogru yerde: 18 BAKIM-EK
-> KTPANEL-BAKIM.md (ayni soruya cevap veren dosyalar birlestirildi).
Capraz referanslar eklendi: her dosya digerine yol gosteriyor.
