# BAKIM EK — §413-§414 (25 Agu 2026 · hizli temizlik turu)
# Degisen: scripts/tazele.mjs · .github/workflows/tazele.yml
# Panel (app.js/index.html) DOKUNULMADI — surum 20260824e kalir.

## §413 KIRMIZI/SARI AYRIMI: VERI KAYBI OLMAYAN ARIZADA IS KIRMIZI YANMAZ

KOK NEDEN: 24-25 Agu'da TEFAS kopruusu birkac kez dustu ve is HER SEFERINDE
kirmizi yandi + bildirim geldi. Ama iki kez de arsivde O GUNUN verisi ZATEN
yaziliydi (sabah kosusundan) — yani panel eksik degildi, sadece tazelenemedi.
§300'un kendi kurali bunu soyluyordu: "veri kaybi olmayan arizada is kirmizi
yakilmaz" — kural vardi, TEFAS dalinda UYGULANMAMISTI.
ALARM ENFLASYONU RISKI: her hickirikta kirmizi yanarsa gercek kayip gunu de
gozden kacar (§300 nobetci dersi).

COZUM: tefasKayipMi() yardimcisi — TEFAS dustugunde fon-arsiv.json'da BUGUN
icin kayit var mi diye bakar:
  - kayit VAR  → denetimDustu SET EDILMEZ. Rapora "§413 not: arsivde bugun N
    fon yazili — VERI KAYBI YOK, is sari" satiri duser. Is YESIL biter.
  - kayit YOK  → gercek kayip, denetimDustu = true, is KIRMIZI (bildirim gelir).
Iki dusme noktasina da baglandi: (a) "TEFAS erisimi dustu" (catch),
(b) "TEFAS eslesme SIFIR (v4)".
BIRIM TEST: arsivde 2030 fon → SARI · arsiv bos → KIRMIZI.
KAPSAM SINIRI: yalniz KATILIM FONLARI dalinda. Diger katmanlarin denetim
mantigi DEGISMEDI — her katmanin kayip tanimi kendine ozgudur, toptan
"hepsi sari olsun" YAPILMADI (§112 tek sahip ruhu).

DERS: BIR KURAL YAZMAK ONU HER DALDA UYGULAMAK DEGILDIR — §300 aylardir
yaziliydi ama TEFAS dali kirmizi yakmaya devam ediyordu. Yeni bir dal
eklerken "bu dalin kayip tanimi ne" diye sorulmali.

## §414 WORKFLOW: actions/checkout@v4 + setup-node@v4 → v5

GitHub uyarisi: "Node.js 20 is deprecated... v4 aksiyonlari Node 24'e
ZORLANIYOR". Zorlama calisiyordu ama uyari her kosuda geliyordu ve bir gun
zorlama kalkarsa is kirilir. v5 surumleri Node 24 tabanli — uyari susar.
node-version: '22' AYNEN KALDI (§326 karari; Actions zaten 24'e zorluyor).
DOGRULAMA: YAML gecerli · iki satir degisti, baska hicbir sey.

## TEMIZLIK: KOK YETIM edgar.js SILINDI (kullanici, 25 Agu)
§407b bekcisi uc kosu boyunca uyarmisti; ktpanel/edgar.js kaldirildi,
ktpanel/api/edgar.js (gercek olan) yerinde. Bekci artik susmali.

## GOZLEM NOTU — TEFAS KOPRU GUVENILIRLIGI (karar bekliyor)
25 Agu uc kosu: kapsam 1891 → 2004 → 2010 (gercek toplam 2038). Kopru
TOPARLANIYOR; gelen/ klasoru BOS iken de veri akti. Kullanicinin "24 Agu
gecesi gecici arizaydi" hipotezi su ana kadar destekleniyor.
IZLEME: birkac gun raporun "yol:" satiri + fon sayisi biriktirilecek.
  - her gun "vercel-koprusu" + 2000 ustu ise → §408/§410 katmanlari
    SADELESTIRILIR, konsol toplayici emekliye ayrilir.
  - dalgaliysa → yedek kalir, gerektiginde "TEFAS'i cek" ritueli.
KARAR VERIYE BAKARAK VERILECEK, tek gune gore DEGIL.

# ===========================================================================
# DAMGA CIZELGESINE
# ===========================================================================
## ALTIN KURALLARA EKLER
- BIR KURAL YAZMAK ONU HER DALDA UYGULAMAK DEGILDIR — yeni dalda "bu dalin
  kayip tanimi ne" diye sorulur (§413).
- VERI KAYBI OLMAYAN ARIZADA IS KIRMIZI YANMAZ (§300'un TEFAS dalinda uygulanmasi).
## GUNCELLENEN
- Workflow aksiyonlari v5 (Node 24 tabanli) — deprecation uyarisi kapandi.
- Kok yetim edgar.js: SILINDI ✓
