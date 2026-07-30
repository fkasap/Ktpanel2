# Tam Otomasyon — Nerede Duruyoruz

**31 Temmuz 2026.** 33 katmanın durumu, kalanların gerçek engeli, ve önümüzdeki tek büyük düğüm.

---

## ✓ ÇÖZÜLDÜ — 13 katman

**Zaten canlı (7):** kur çipleri · küresel endeksler · VIX/DXY/Brent · yabancı akış+carry · net rezerv · TCMB faizi · sukuk arşivi

**GitHub Actions'ta otomatik (6):** XK100 · XKTUM · XKTMT ağırlıkları · multiple fiyatları · model sicili · risk metrikleri (vol/beta)

Hafta içi 18:10, cumartesi 07:00. Denetimden geçmeyen katman **yazılmaz**, iş kırmızı yanar.

---

## ◐ SUNUCUDAN ERİŞİLEBİLİR — 14 katman

KAP · EVDS · BDDK · Yahoo · FRED üzerinden zaten canlı akıyor ya da akabilir. Bunlar için ek iş yok; sorun çıkarsa akış tarafındadır.

---

## ✗ ENGELLİ — 6 katman

Hepsi **aynı tek şeye** takılıyor: bilanço kalemleri.

| Katman | Ne gerekiyor |
|---|---|
| Faktör modeli | ciro · FAVÖK · net borç · özkaynak (çeyreklik) |
| Multiple (EV/EBITDA) | aynı kalemler |
| Guidance | şirket hedefleri (KAP metin) |
| Pay adedi | serbest dolaşım (çeyreklik) |
| BIST beklenen takvim | geçmiş açıklama tarihleri |
| Analist konsensüsü | aracı kurum hedefleri |

İlk beşi bilanço verisi. Şu an Fintables'tan alıyorum — ama **Fintables'ın kaynağı KAP.**

---

## ▸ TEK BÜYÜK DÜĞÜM: KAP yapısal veri

Eğer KAP'ın finansal rapor uçları sunucudan erişilebiliyorsa, **beş katman birden** çözülür ve geriye yalnız analist konsensüsü kalır.

Sandbox'tan `kap.org.tr`'ye erişemiyorum. Yoklama sunucudan yapılmalı:

```
/api/kap?mod=yokla&kod=TOASO
```

Beş aday uç dener, her biri için **HTTP kodu + içerik tipi + yanıt başlangıcı** döndürür.

**Okuma:**
- `200` + `application/json` → o uç kullanılabilir, Fintables bağımlılığı kırılır
- `403` / `404` → bot koruması ya da uç yok
- Hepsi düşerse → KAP yolu kapalı, Fintables kalır

Bu, TEFAS'ta (§145-148) ve Finnhub'da (§167) işe yarayan desen: **tahmin etmek yerine ölçmek.**

---

## ✗ OTOMATİKLEŞMEYECEK — ve olmamalı

Bilanço kartları · tezler · taktiksel duruş · risk uyarıları.

31 Temmuz'da yazılan kartların değeri **rakamlarda değildi:**

- **ARENA** — rakamlar sıradan, asıl bulgu 120 günlük gecikme deseni. Dokuz çeyrek 36-42 gün, sonra dördü birden 120+. Betik "anomali" der; *"bu şirket evrenden çıkmalı"* diyemez.
- **TOASO** — FAVÖK −%33 ama faaliyet kârı +%214. Sebep amortismanın −%63'ü. Aynı gün **CWENE'de tam tersi** vardı. İkisini yan yana koyup "aynı makasın iki ucu" demek yargı.
- **TSKB** — karşılık 11,8 kat sıçradı, panik yaratacak rakam. Ama altı aylıkta geçen yılın **altında**. Çeyreklik bakan yanılır.
- **META** — gelir +%28, EPS −%13. Asıl hikâye manşette değil FCF'te: 784 milyon dolar, capex ikiye katlanmış, fark borçla kapanıyor.

Bunları otomatikleştirmek daha çok kod yazmak değil — **hangi soruyu soracağını bilmek.**

---

## BUGÜNÜN DERSİ

Yakalanan hataların çoğu, bir sistemin *"çalışıyorum"* derken çalışmamasıydı:

| Ne | Ne kadardır |
|---|---|
| Sukuk akışı middleware'e takılıyordu | 3 gün |
| Sicil karşılaştırması hiç çalışmıyordu | bilinmiyor |
| Upstash bağlı bile değil | bilinmiyor |
| XKTUM ağırlıkları %38 yanlış yazılacaktı | ilk koşuda yakalandı |

Dördü de sessizdi. Görülmesini sağlayan şey her seferinde aynı oldu: **bir teşhis satırı.**

Tam otomasyon bunları görmez. Otomatikleşmesi gereken şey veri; görülmesi gereken şey **verinin gerçekten geldiği.**

---

## SIRADAKİ ADIM

1. `api/kap.js`'i deploy et
2. `ktpanel.vercel.app/api/kap?mod=yokla&kod=TOASO` adresini aç
3. Çıktıyı bana gönder

Bir uç bile `200 + json` dönerse, önümüzdeki hafta beş katmanı birden otomatikleştiririz.
