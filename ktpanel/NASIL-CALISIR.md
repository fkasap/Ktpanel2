# KTPanel — Nasıl Çalışır (kısa, güncel)

> Bu belge "nasıl çalışır"ı anlatır; "neden böyle yaptık" tarihi `KTPANEL-BAKIM.md`'dedir (§1…§547, arşiv). Yeni biri önce bunu okur.
> Mimari tablo `guncelleme-plani.json` katmanlarından üretildi (26 Eki 2026, §547) — elle satır yok; plan değişince yeniden üretilir:
> yeniden üretim betiği §7'de.

## 1. Üç katman

| Katman | Nerede | Ne yapar |
|---|---|---|
| **Panel** | `ktpanel/index.html` + `app.js` + `ajan.js` (Vercel statik) | Kartları çizer; canlı veriyi köprülerden, günlük veriyi Actions'ın yazdığı JSON dosyalarından okur. Tek sahip ilkesi (§112): her büyüklüğün tek bir yazan fonksiyonu vardır, DOM'dan geri okunmaz. |
| **Köprüler** | `ktpanel/api/*.js` (Vercel fonksiyonları) | Dış kaynaklara (EVDS, Yahoo, TEFAS, BDDK, KAP, FRED/ECB, Finnhub/AV) giden istekler; önbellek `api/_lib/onbellek.js`. CRON_SECRET yalnız panelin kendi alanına gider. |
| **Actions** | `scripts/tazele.mjs` (günlük "Veri Tazele"), `scripts/saglik.mjs` (günlük "Sağlık Bekçisi"), `scripts/haftalik-not.mjs` (Pazartesi) — `.github/workflows/` | Birincil kaynaklardan JSON üretir ve `ktpanel-bot` olarak commit eder. Kullanıcı bu dosyaları elle yüklemez. |

## 2. Günlük akış

1. **Veri Tazele** (tazele.yml): katmanlar `--katman=` ile ayrılır (karar, kamu, fm, sektör sürücüleri, EPİAŞ, KAP tarayıcı…). Çıktı: `rapor/son-tazeleme.md` + Actions özeti. Dosya değişmediyse commit yok.
2. **Sağlık Bekçisi** (saglik.yml): seriler (app.js'ten keşif) · dosya ritmi (bot commit medyanı) · köprü şemaları (`test/kopru-testi.js`) · tutarlılık (damga↔canlı) · ekran (Playwright, her sekme; §521 elle kart yaşı; §547c elle sayı dedektörü). Çıktı `ktpanel/saglik.json` → panelde ⊙ Veri Durumu ve BUGÜN › Bekçi satırı. Yeni kritik varsa mail.
3. **Panel açılışı**: canlı köprüler → kartlar; §526 taktik model; §522 gündem; §547 BUGÜN (üstte beş satır) bunların hepsinden türer; Ebu (ajan.js) 10 dk'da bir veri turu, notları §540 çelişki kapısından geçirerek yazar.

## 3. Karar zinciri (fon yöneticisi gözüyle)

`BUGÜN` → (dikkat varsa) `Piyasa` genişlik → `Makro` tutarlılık → `Muhakeme` tezler (bozan kural: seri · yön · eşik, §547) → `Portföy` tez disiplini · korelasyon · stres → `Yönetim` likidite. Okuma rehberi panelde: **? Yardım › Panel Nasıl Okunur**.

## 4. Eşik kütüphanesi (§547, `app.js` → `ESIK`)

Tek yerde seri çözücüler (CDS, VIX, politika, AOFM, TÜFE, PKA 12A, ex-ante reel, REK, USD/TRY, Brent, altın, DXY, ABD 10Y, S&P, XU100/XKTUM/XK100, 1 aylık değişimler) ve dikkat eşikleri (nedenleri kodun yanında yazılı). Tez kuralları ve BUGÜN yalnız buradan okur. Yeni bir eşik eklemek = `ESIK.dikkat` dizisine bir satır.

## 5. Kurallar (kısa)

- Sayı taşıyan hiçbir cümle elle yazılmaz; şablon + canlı değer. Kalan borç bekçide "elle rakam envanteri" olarak görünür.
- Ebu'nun yazdığı her not `data-ebu="1"` taşır; görsel olarak mor noktalı çizgi + "🤖 YORUM · veri değil" (§547). Yön çağrıları Ebu karnesinde ölçülür.
- Veri bulunamazsa kart "veri yok" der; uydurma yedek yok. Fintables yalnız analist/guidance elle tazelemesinde (deklare borç c).
- Dosya teslim yerleri: `ktpanel/api/` köprüler · repo kökü `scripts/` Actions betikleri · `.github/workflows/` iş akışları · `ktpanel/test/` köprü testi.

## 6. Mimari harita (otomatik — guncelleme-plani.json'dan)

Ritim sütunu: *otomatik* = Actions/bot yazar · *canlı* = köprüden her açılışta · *elle · borç a/b/c/metin* = §547 sınıflandırması (a kaynağı var yazılmamış · b kaynağı yarı açık · c kaynağı yok, deklare · metin damgalı anlatı).

| Katman | Dosya | Sıklık | Kaynak | Ritim |
|---|---|---|---|---|
| Kur çipleri | `api/market.js` | canli | Yahoo Finance köprüsü | otomatik |
| Küresel endeksler | `api/market.js` | canli | Yahoo Finance köprüsü | otomatik |
| VIX / DXY / Brent (risk barometresi) | `api/market.js` | canli | Yahoo Finance köprüsü | otomatik |
| BIST endeksleri | `app.js` | canlı (Yahoo) | Yahoo → /api/market (15 endeks) | otomatik |
| Sicil (model vs endeks) | `track.json` | gunluk | tazele.mjs §291 | otomatik |
| Sektör ısı haritası + rotasyon | `sektor.json` | haftalik | tazele.mjs §333 | otomatik |
| KAP haber akışı | `app.js` | canlı (KAP) | KAP byCriteria → /api/kap · yorum katmanı kural bazlı | otomatik |
| Katılım fonları | `katfon.json` | canlı (TEFAS) | TEFAS fonGnlBlgSiraliGetir (YENİ API) → /api/katfon · 1G+fiyat+AUM canlı · dönem | canlı |
| Yabancı akışı — AYLIK ödemeler dengesi | `yabanci.json` | aylik | TCMB ödemeler dengesi (aylık, elle) | elle · borç a |
| Net rezerv (Rezerv Karnesi) | `index.html` | canli | TCMB haftalık rezerv (Perşembe) + web | otomatik |
| TCMB faizi / para politikası | `index.html` | canli | EVDS aday zinciri (§122) | otomatik |
| Ülke kredi notu (Fitch/Moody's/S&P) | `index.html` | olay | Fitch/Moody's/S&P rating kararları (web) | elle · borç b |
| Sanayi üretimi / makro | `index.html` | canlı (EVDS) | TCMB EVDS → /api/evds2 (8 makro kartı + özel kapsamlı TÜFE) | otomatik |
| Halka arzlar | `halkaarz.json` | olay | Fintables halka_arzlar | elle · borç a |
| Guidance | `guidance.json` | ceyreklik | Fintables guidance | elle · borç b |
| Multiple snapshot (EV/EBITDA) | `multiple.json` | ceyreklik | Fintables finansal_tablolar (bilanço dönemi) | elle · borç a |
| Hazine ihraç takvimi | `hazine-takvim.json` | aylık (~25'i) | tazele.mjs §334 | otomatik |
| İnceleme AI bilanço kartları | `inceleme-ai.json` | olay bazlı (FR) | Claude + Fintables | elle · borç b |
| Getiri eğrisi (DİBS) | `api/_lib/egri.js` | canlı (EVDS) | EVDS bie_pydibs → fiyat→IRR · /api/evds2?mod=egri | otomatik |
| ABD haber akışı | `api/usnews.js` | canlı (AV) | Alpha Vantage NEWS_SENTIMENT · 50 sembol | otomatik |
| Bankacılık sektörü (BDDK) | `api/bddk.js` | aylik | BDDK Aylık Bülten → /api/bddk?panel=1 (grup) + /api/bddk?sahiplik=1 (kamu·yerli  | otomatik |
| TLREF serisi | `api/_lib/tlref.js` | canlı (EVDS) | EVDS TP.BISTTLREF → /api/evds2?mod=tlref | otomatik |
| Kart harcamaları (sektörel) | `api/_lib/kart.js` | canlı (EVDS) | TCMB EVDS bie_kkhartut haftalık akım → aylık · TÜFE ile reelleştirilmiş · /api/e | otomatik |
| Özel sektör sukuk ihraçları | `api/_lib/sukuk.js` | canlı (KAP) | KAP "(Faizsiz)" bildirimleri → /api/kap?mod=sukuk · sukuk-ihrac.json damgalı yed | otomatik |
| Köprü sağlık testi | `test/kopru-testi.js` | olay | 23 uç şema doğrulaması | elle |
| Faktör modeli (5 faktör z-skor) | `fm.json` | ceyreklik | Fintables 29 metrik → rank-normal standardizasyon · sektör içi VALUE/GROWTH/QUAL | elle · borç b |
| Risk metrikleri (vol · beta) | `risk.json` | canli | Fintables günlük getiri · vol=yıllık std, beta=XKTUM'a karşı · risk bütçesi kart | otomatik |
| Analist konsensüsü (hedef fiyat) | `analist.json` | aylik | analist.json | elle · borç c |
| Swap stoku (rezerv bileşeni) | `rezerv.json` | haftalik | TCMB haftalık basın açıklaması (web) · swap hariç net = canlı net − swapStoku ·  | elle · borç a |
| Sukuk ihraç arşivi (yedek) | `sukuk-ihrac.json` | canli | KAP canlı akıyor (/api/kap?mod=sukuk); bu dosya yalnız damgalı yedek | otomatik |
| Endeks agirliklari (XKTUM + XK100 + XKTMT) | `xktum.json` | canli | xk100.json | otomatik |
| BIST beklenen bilanco takvimi | `bist-takvim.json` | ceyreklik | bist-takvim.json | elle · borç b |
| BIST bilanço takvimi | `bist-takvim.json` | ceyreklik | KAP beklenen bildirimler + Fintables | elle · borç b |
| Gunluk fon akisi | `fon-akis.json` | gunluk | tazele.mjs §263 | otomatik |
| Hazine ihale sonuçları | `hazine-sonuc.json` | gunluk | tazele.mjs §314 | otomatik |
| Küresel makro takvim | `makro-takvim.json` | gunluk | tazele.mjs §319 | otomatik |
| BoJ Politika kartı (damgalı) | `index.html` | olay | BoJ toplantı takvimi (~6 haftada bir) | elle · borç metin |
| HKMA Okuma & Bölge Bağı kartı (damgalı) | `index.html` | olay | Rejim anlatısı (currency board) | elle · borç metin |
| Kore BOK & Piyasa kartı (damgalı) | `index.html` | olay | BOK toplantı takvimi + KOSPI olayları | elle · borç metin |
| Kore Okuma & Bağlar kartı (koro dahil, damgalı) | `index.html` | olay | Küresel koro + Kore rolü anlatısı | elle · borç metin |
| TCMB Fonlama Rejimi kartı (damgalı satırlar) | `index.html` | olay | PPK takvimi: 10 Eyl SABİT %37 (§436b) → 22 Eki → Aralık. Karar sonrası satırlar/ | elle · borç metin |
| Haberler Gündem Özeti kartı (damgalı) | `index.html` | olay | §522 (24 Eki): kart panelin takvimlerinden OTOMATİK derlenir (PPK · FOMC · ECB · | otomatik |
| Piyasa Global Risk Barometresi (damgalı bağlam) | `index.html` | olay | Satırlar canlı (§421); yalnız etiket/okuma metni damgalı | elle · borç metin |
| ECB & Politika kartı (damgalı) | `index.html` | olay | ECB takvimi: 10 Eyl +25bp %2,50 → 29 Eki. DFR satırı/etiket CANLI (§520/§535); k | elle · borç metin |
| Fed & Politika kartı (damgalı) | `index.html` | olay | FOMC 16 Eyl +25bp -> 27-28 Eki (§449) | elle · borç metin |
| Makroihtiyati & Kredi Koşulları kartı (damgalı) | `index.html` | olay | TCMB makroihtiyati basın duyuruları + Kredi Eğilim Anketi (3Ç26 Ekim başı). Yeni | elle · borç metin |
| Fon krizi kartı (damgalı, SPK tasfiye) | `index.html` | olay | SPK bültenleri + tasfiye bankası duyuruları; ödeme turları, yeni tedbir, evren f | elle · borç metin |
| Enflasyon Patikası modeli — girdiler (PKA · TÜFE · DİBS) | `app.js` | aylik | Kullanıcının model.py/veri.py (13 Eki) → app.js EP_VARSAYILAN; kullanıcı girdile | elle · borç a |
| Sektör sürücüleri — Neste crack · Brent · USDTRY + sürücü serileri kay | `sektor-surucu.json` | gunluk | Actions sektorSurucu() (§462): ir-service.appspot.com/share/nesteoil (ProductMar | elle |
| Karar modeli kataloğu — XK030 (30 hisse): FAVÖK gerçekleri · konsensüs | `karar-model.json` | ceyreklik | Fintables MCP (19 Eki): gelir tablosu çeyreklik (10005), kurum tahminleri (ortal | elle |
| ASELSAN sözleşme akışı — KAP açıklamaları (açıklanan sözleşmeler, USD) | `sektor-surucu.json` | gunluk | Actions aselsSiparis() (§467): webapi.aselsan.com/investor-relations/kap-disclos | elle |
| KAP 'Yeni İş İlişkisi' sözleşme akışı — KATMR · ALTNY · GLRMK (+ASELS  | `sektor-surucu.json` | gunluk | Actions kapYeniIs() (§469): kap.org.tr api/member/filter → disclosure/members/by | elle |
| Kardemir liste fiyatları (kütük/nervürlü/profil/filmaşin) + hurda alım | `sektor-surucu.json` | gunluk | Actions kardemirFiyat() (§472): www.kardemir.com/api/SatisPazarlamaapi/getpricer | elle |
| GES zinciri fiyatları — InfoLink + PVinsights haftalık spot (polisilik | `sektor-surucu.json` | haftalik | Actions gesFiyat() (§483): www.infolink-group.com/spot-price (HTML tablo, ortala | elle |
| SUT fiyat endeksi (SGK EK-2B/EK-2C sepet kıyası — oran OTOMATİK) + TTB | `sektor-surucu.json` | gunluk: SGK duyuru kontrolü  | Actions sutEndeks()→sutSepet() (§475): sgk.gov.tr/Arama/Index/sut → en yeni "İşl | elle |

## 7. Üretim betiği (tabloyu yenilemek için)

```python
import json,re
d=json.load(open('ktpanel/guncelleme-plani.json',encoding='utf-8'))
for k in d['katmanlar']:
    print('|',k['ad'][:70],'|',k.get('dosya','—'),'|',k.get('siklik','—'),'|',str(k.get('kaynak',''))[:80],'|',k.get('borc','') or ('otomatik' if k.get('son')=='otomatik' else 'elle'),'|')
```
