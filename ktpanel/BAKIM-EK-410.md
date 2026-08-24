# BAKIM EK — §410 (24 Agu 2026, gece · TEFAS ERISIM REJIMI DEGISTI)
# KTPANEL-BAKIM.md'ye en yeni ustte; DAMGA bolumu KTPANEL-DAMGA.md'ye.
# Degisen: scripts/tazele.mjs · YENI: ktpanel/arac/tefas-konsol.js,
#          ktpanel/arac/gelen/BENIOKU.md · Panel (app.js/index.html) DOKUNULMADI.

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

# ===========================================================================
# DAMGA CIZELGESINE (KTPANEL-DAMGA.md)
# ===========================================================================
## GUNCELLENEN
- TEFAS: sunucudan otomatik cekim OLU (5 yol da olculdu) → KONSOL TOPLAYICI
  (elle, gunluk ritüel, kapsam kapili). Otomasyon kuralinin IKINCI olculmus
  istisnasi (swap stoku emsali).
## ALTIN KURALLARA EKLER
- IKI TOPLAYICI AYNI KOTAYI PAYLASIR — uzun betikte kilit sart.
- "HEP AYNI SAYIDA" DURAN HATA KOTADIR, backoff'u uzatma, YONTEMI degistir.
- ELLE KATMAN IYI VERIYI EZEMEZ — tazelik + KAPSAM kapisi birlikte.
- DAMGADA KANAL ADI SABIT YAZILMAZ.
- SOZDIZIMI TEMIZ ≠ CALISIR (tanimsiz degisken kapsam denetimiyle yakalanir).
