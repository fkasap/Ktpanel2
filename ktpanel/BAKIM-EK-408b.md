# BAKIM EK — §408b (24 Agu 2026, gece · TEFAS jeton tani turu)
# YALNIZ scripts/tazele.mjs degisti. Panel/app.js DOKUNULMADI (sürüm 20260824e kalir).

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
