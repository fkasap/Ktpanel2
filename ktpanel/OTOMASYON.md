# Tam Otomasyon — Nerede Duruyoruz

**Güncelleme: 25 Ağustos 2026.** (Önceki sürüm 31 Temmuz'da yazılmıştı ve
merkezindeki soru — "KAP sunucudan açılır mı" — o günden beri ÇÖZÜLDÜ.)

---

## ✓ ÇÖZÜLDÜ — GitHub Actions'ta kendi kendine dönüyor

**Canlı akan (tarayıcıdan, damgasız):** kur çipleri · küresel endeksler ·
VIX/DXY/Brent · yabancı akış+carry · net rezerv · TCMB faizi · sukuk arşivi ·
BIST endeksleri · sektör ısı haritası · KAP haber akışı

**Actions koşusunda (cron):** XK100/XKTUM/XKTMT ağırlıkları · multiple
fiyatları · model sicili · risk metrikleri (vol/beta) · endeks arşivi ·
CDS · bilanço tetiği · GYO NAV · hazine ihale sonuçları · fon akışı ·
katılım fonları

### 🔓 KAP DÜĞÜMÜ ÇÖZÜLDÜ (§338-§365, 20-21 Ağu)

31 Temmuz'daki "tek büyük düğüm" şuydu: *beş katman bilanço kalemlerine
takılıyor, Fintables'a bağımlıyız, KAP sunucudan açılır mı bilmiyoruz.*
**Ölçüldü ve açıldı.** `api/kap.js` finansal rapor uçlarını okuyor;
`faktor-evren.json` KAP'tan kademeli doluyor (25 Ağu: 94/245).

Zincirin bedeli beş turluk hata dizisiydi ve hepsi **sessizce yanlış veri**
sınıfındaydı (yanlış alan adı · middleware kapısı · TTM kısmi toplamı ·
isFinite tuzağı · düşen null savunması). Bu yüzden kural: **panel sağlamlaşana
kadar bağlanmaz** — model hâlâ `fm.json`'dan besleniyor, `faktor-evren.json`
paralel koşuyor. Bağlama eşiği: kapsam ~150-200 + banka/GYO şablon sınavı.

### 🔓 ABD BİLANÇOSU — EDGAR (§398-401, 23-24 Ağu)

KAP motorunun ABD'ye taşınması: `api/edgar.js`. SEC EDGAR company-facts
uçları; TMS-29 sorunu yok, çeyrek/kümülatif ayrımı `start/end` ile
kendiliğinden geliyor. Yabancı Hisse sekmesini besliyor.

---

## ⚠ TEFAS — ERİŞİM REJİMİ DEĞİŞTİ (§408-§412, 24-25 Ağu)

**Bu, otomasyonun en zorlu dosyası. Kod eksiği YOK — kapı kapalı.**

Beş yol ölçüldü, hepsi canlı:

| Yol | Sonuç |
|---|---|
| Vercel köprüsü (`api/tefas`) | **DALGALI** — bazen "fetch failed", bazen çalışır |
| Actions runner, düz fetch | TSPD JS meydan okuması: 200 döner ama 6 KB kabuk |
| Actions runner, API doğrudan | bağlantı düzeyi ret ("fetch failed") |
| Playwright (runner, headless) | JSON yakalayamıyor |
| Otomasyonla sürülen tarayıcı | davranış tespiti → "Request Rejected" |
| Kullanıcının kendi tarayıcısı | **ÇALIŞIYOR** — 2038/2038 fon |

**Sonuç:** TEFAS bulut IP'lerini (Vercel, GitHub Actions) tanıyıp kesiyor.
Çizgi baştan çizildi ve korunuyor: **bot koruma taklidi ve IP gizleme YOK.**

**Mimari — iki katmanlı savunma:**
1. Köprü çalışırsa veri otomatik akar (25 Ağu'da dört koşuda çalıştı;
   kapsam 1891 → 2004 → 2010 → 2018 diye toparlandı).
2. Köprü düşerse `arac/gelen/tefas-tam-*.json` devreye girer —
   `arac/tefas-konsol.js` ile kullanıcının kendi tarayıcısından toplanır.
   İki kapı: **tazelik** (bugün olmalı) + **kapsam** (arşivdekinden az olamaz).

**Kalıcı tam otomasyon için gereken:** TEFAS'ın kabul ettiği bir adresten
koşan runner (yerli VPS ya da evde sürekli açık cihaz + self-hosted runner).
Karar kullanıcıda; köprünün güvenilirliği birkaç gün ölçülüyor.

---

## ◐ CLAUDE OTURUMUNDA TAZELENEN — 4 katman

Fintables MCP **yalnız Claude oturumunda** çalışır; Actions bunları kendi
çekemez. Doğası gereği "Claude ile tazelenir" sınıfı:

| Katman | Sıklık | Kaynak |
|---|---|---|
| Guidance | çeyreklik (sezon sonrası) | Fintables `guidance` |
| Analist konsensüsü | aylık | Fintables aracı kurum hedefleri (1 YIL penceresi — §252v) |
| Halka arzlar | olay bazlı | Fintables `halka_arzlar` |
| Faktör modeli (fm.json) | çeyreklik | Koyfin CSV → `arac/fm-isle.py` |

---

## ✗ MEŞRU ELLE İSTİSNALAR — 2 kalem

1. **Swap stoku** (`rezerv.json`) — EVDS'de YOK, TCMB haftalık basın
   açıklamasında. Perşembe yayını sonrası "rezervleri güncelle". §245k.
   Nöbetçi limiti 13 gün (§245p: yayın Perşembe, veri önceki Cuma'ya ait).
2. **TEFAS konsol dosyası** — yukarıdaki tablonun sonucu. Köprü düştüğü
   günlerde. §410.

İstisna listesine ekleme kuralı: **önce ÖLÇÜM** (kanal denendi ve yok),
sonra günlüğe gerekçe. Sayı ya sabit kalır ya düşer — asla artmaz.

---

## ✗ OTOMATİKLEŞMEYECEK — ve olmamalı

Bilanço kartları · tezler · taktiksel duruş · risk uyarıları · Ebu yorumları.

Bunlar yargı işi. Kartların değeri rakamlarda değil, **hangi soruyu
sorduğunda**:

- **WMT (§401)** — EPS beat +%11 ama faaliyet büyümesinin 750 bps'i tarife
  iadesi, GAAP net kâr −%9,4. "Beat'in kalitesi" sorusu betikte yok.
- **CSCO (§401)** — rekor sonuç + hisse düşüşü. Sipariş +%35 ama AI donanım
  karışımı marjı seyreltiyor. Gerilimi görmek yargı.
- **TOASO** — FAVÖK −%33, faaliyet kârı +%214; sebep amortismanın −%63'ü.
  Aynı gün CWENE'de tam tersi. İkisini yan yana koymak yargı.
- **ARENA** — rakamlar sıradan, asıl bulgu 120 günlük gecikme deseni.
  Betik "anomali" der; *"bu şirket evrenden çıkmalı"* diyemez.

---

## BUGÜNÜN DERSİ — sessiz hatalar

Yakalanan hataların çoğu, bir sistemin *"çalışıyorum"* derken çalışmamasıydı:

| Ne | Nasıl görüldü |
|---|---|
| Sukuk akışı middleware'e takılıyordu (3 gün) | teşhis satırı |
| §410 konsol zinciri hiç koşmadı (yol hatası + sessiz catch) | **beklenen rapor satırının HİÇ ÇIKMAMASI** |
| Çekmece fm tarihini plandan okuyordu | aynı gerçek için panelde iki tarih |
| Faktör modeli AKHAN'ı %66 eksik ciroyla skorlayacaktı | paralel koşu + imza kıyası |

**Otomatikleşmesi gereken şey veri; görülmesi gereken şey verinin gerçekten
geldiği.** Sessiz catch yasak — arama yapan her blok bulamadığını da söyler.
