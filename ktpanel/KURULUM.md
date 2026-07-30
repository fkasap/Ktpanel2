# Otomatik Tazeleme — Kurulum

Bir kez yapılır. Sonrası kendi kendine döner.

## 1 · Dosyaları repo'ya koy

```
.github/workflows/tazele.yml     ← zamanlayıcı + iş tanımı
scripts/tazele.mjs               ← çek · hesapla · denetle · yaz
scripts/denetim.mjs              ← kural seti
xk100.json · xktum.json · xktmt.json   ← pay adedi biçimine geçirildi
```

## 2 · package.json'a ekle

```json
{
  "name": "ktpanel",
  "private": true,
  "type": "commonjs",
  "devDependencies": { "playwright": "^1.48.0" }
}
```

**`"type"` DEĞİŞMEYECEK.** `api/*.js` dosyaları `require()` kullanıyor; `"module"` yapılırsa hepsi kırılır. Tazeleme betikleri `.mjs` uzantılı olduğu için Node onları `package.json`'dan bağımsız olarak ESM sayar.

Playwright yalnız fon katmanında kuruluyor — diğer koşularda atlanıyor.

## 3 · Actions iznini aç

`Settings → Actions → General → Workflow permissions` → **Read and write**

Bu, botun commit atabilmesi için gerekli. Vercel repo'ya bağlı olduğu için commit deploy'u kendiliğinden tetikler; ek kimlik bilgisi **gerekmiyor**.

## 4 · Elle bir kez çalıştır

`Actions → Veri Tazele → Run workflow` → katman: `hepsi`

İş özetinde denetim raporu görünür. Kırmızıysa veri yazılmamıştır, rapor sebebi söyler.

---

## Zamanlama

| Ne zaman | Ne yapar |
|---|---|
| Hafta içi 18:10 TSİ | Fiyat katmanı — BIST kapanışından ~40 dk sonra |
| Cumartesi 07:00 TSİ | Haftalık kalemler |
| Elle | `workflow_dispatch` ile istediğin zaman |

---

## Değişen mimari — çarpan/fiyat ayrışması

**Önce:** `xk100.json` ağırlık tutuyordu (`ASELS: %20,23`) → fiyat içine gömülü, her gün bayatlıyordu.

**Sonra:** pay adedi tutuyor (`ASELS: 1.175.568.000`) → sunucu her gün Yahoo'dan fiyatı çekip ağırlığı **kendisi hesaplıyor**.

Doğrulandı: pay adedinden ima edilen fiyat, gerçek fiyatı ortalama **%0,5** sapmayla tutuyor.

`multiple.json` ve `track.json` zaten doğru yapıdaydı — bileşenler sabit, yalnız fiyat tazeleniyor.

### İş yükü

```
elle tazeleme:  438/yıl  →  ~32/yıl
```

Kalan 32: analist konsensüsü (aylık 12) · pay adedi ve bilanço kalemleri (çeyreklik) · beklenen bilanço takvimi (çeyreklik). Hepsi Fintables istiyor, hepsi seyrek.

---

## Denetim — en önemli kısım

Denetimden geçmeyen veri **commit edilmez.** İş kırmızı yanar, bildirim gider.

Kurallar 29 Temmuz'da yakalanan üç sessiz hatadan türedi:

| Kural | Neyi yakalar | Gerçek vaka |
|---|---|---|
| **kapsam** | eksik kayıt | model portföyde 11 hisse eski fiyatta kalmıştı → 29/40 |
| **tarih birliği** | karışık tarihli hesap | aynı vakada 2 farklı fiyat tarihi |
| **aykırı değer** | dağıtım/bölünme | MPE tek günde −%3,57 (kâr payı) |
| **dönem tutarlılığı** | çapa hatası | YTD < 3A olması |
| **toplam** | yanlış normalize | XKTUM 96,5 yerine 100 çıkarsa |
| **bayatlık** | tazelenemeyen kayıt | analist hedeflerinde 4 bayat → SNGYO'da sahte %238 |

Üçü de "veri geldi" diyordu ve üçü de sessizce yanlıştı. **Eski veri, eksik veriden tehlikelidir** — çünkü görünmez: bir sayı vardır, makul durur, hesaba girer.

---

## Otomatikleşmeyen — ve olmaması gereken

Bilanço kartları · tezler · taktiksel duruş · Ebu yorumları.

Bunlar yargı işi. Bugünkü kartların değeri rakamlarda değildi: ARENA'daki 120 günlük gecikme deseni, TOASO'da FAVÖK düşerken faaliyet kârının artmasının amortismandan gelmesi, META'da FCF'in 784 milyon dolara inmesi. Betik bunları yazamaz.
