# Otomatik Tazeleme — Kurulum & İşleyiş

Kurulum bir kez yapılır. Bu dosya hem kurulumu hem **günlük işleyişi** anlatır.

---

## 1 · Dosya düzeni

```
.github/workflows/tazele.yml     ← zamanlayıcı + iş tanımı
scripts/tazele.mjs               ← çek · hesapla · denetle · yaz
scripts/denetim.mjs              ← kural seti (bekçiler)
ktpanel/arac/                    ← elle çalıştırılan araçlar
ktpanel/arac/gelen/              ← TEFAS konsol çıktısı buraya
```

## 2 · package.json

```json
{ "name": "ktpanel", "private": true, "type": "commonjs",
  "devDependencies": { "playwright": "^1.48.0" } }
```

**`"type"` DEĞİŞMEYECEK.** `api/*.js` `require()` kullanıyor; `"module"`
yapılırsa hepsi kırılır. Tazeleme betikleri `.mjs` olduğu için Node onları
`package.json`'dan bağımsız ESM sayar.

Playwright yalnız fon katmanında kuruluyor — diğer koşularda atlanıyor.

## 3 · Actions izni

`Settings → Actions → General → Workflow permissions` → **Read and write**

Bot commit atabilsin diye gerekli. Vercel repo'ya bağlı olduğundan commit
deploy'u kendiliğinden tetikler; ek kimlik bilgisi gerekmiyor.

---

## Zamanlama

| Ne zaman | Katman | Neden o saat |
|---|---|---|
| Hafta içi **09:10** TSİ | `fon` | TEFAS önceki günü sabah yayınlar (§249n) |
| Hafta içi **18:10** TSİ | `fiyat` | BIST kapanışından ~40 dk sonra |
| Cumartesi **07:00** TSİ | haftalık kalemler | — |
| Elle | seçilebilir | `Actions → Veri Tazele → Run workflow` |

Elle koşuda katman seçilir: `hepsi | fiyat | endeks | risk | fon`.
Tek katman sınanacaksa **hepsi seçme** — hem hızlı biter hem rapor okunur olur.

Koşu **11 dakikalık bütçe** tutar; aşarsa kalan katmanları atlar ve bunu
raporlar (sessizce yarım kalmaz).

---

## Denetim — en önemli kısım

**Denetimden geçmeyen veri commit edilmez.** İş kırmızı yanar, bildirim gider.

| Kural | Neyi yakalar | Gerçek vaka |
|---|---|---|
| kapsam | eksik kayıt | model portföyde 11 hisse eski fiyatta → 29/40 |
| tarih birliği | karışık tarihli hesap | aynı vakada 2 farklı fiyat tarihi |
| aykırı değer | dağıtım/bölünme | MPE tek günde −%3,57 (kâr payı) |
| dönem tutarlılığı | çapa hatası | YTD < 3A olması |
| toplam | yanlış normalize | XKTUM 96,5 yerine 100 çıkarsa |
| bayatlık | tazelenemeyen kayıt | analist hedeflerinde 4 bayat → SNGYO'da sahte %238 |
| ikiz dosya + kök yetim | sürüklenen kopya | `ktpanel/edgar.js` (api'nin eski kopyası) — §407b |

**Eski veri, eksik veriden tehlikelidir** — çünkü görünmez: bir sayı vardır,
makul durur, hesaba girer.

### Kırmızı mı sarı mı (§413)

TEFAS düştüğünde iş artık **koşulsuz kırmızı yanmıyor**:
- arşivde bugünün verisi **varsa** → sarı (uyarı satırı, iş yeşil biter)
- arşivde **yoksa** → kırmızı (gerçek kayıp, bildirim gitmeli)

Gerekçe §300: *veri kaybı olmayan arızada iş kırmızı yakılmaz* — yoksa alarm
gürültüye döner ve gerçek kayıp günü gözden kaçar.

---

## Koşu raporunu okuma

Rapor iki yere yazılır: Actions iş özeti + `rapor/son-tazeleme.md`.

Bakılacak satırlar:
- **`yol:`** — fon verisi hangi kanaldan geldi (`vercel-köprüsü` /
  `doğrudan v2` / `konsol toplayıcı (elle · §410)`)
- **fon sayısı** — 2000 civarı normal; belirgin düşükse köprü kısmi çalışmış
- **`§4xx` satırları** — o turda çalışan özel bloklar kendi durumlarını söyler
- **denetim özeti** — hangi katman geçti/kaldı

Beklenen bir satır **hiç çıkmamışsa**, "sorun yok" demek değildir; önce
*blok çalıştı mı* sorulur (§410c'nin dersi: sessiz catch arızayı görünmez yapar).

---

## Elle kalan iş — güncel tablo

| Kalem | Kim yapar | Ne zaman |
|---|---|---|
| Guidance · analist · halka arz · fm.json | **Claude** (Fintables/Koyfin) | çeyreklik / aylık / sezon sonrası |
| Swap stoku (`rezerv.json`) | kullanıcı | Perşembe TCMB yayını sonrası |
| TEFAS konsol dosyası | Claude (tarayıcıdan) | yalnız köprü düştüğü gün |
| Bilanço kartları · tezler · yorumlar | **yargı işi** | otomatikleşmeyecek |

Detay ve gerekçeler: `OTOMASYON.md`.

---

## Sorun çıkarsa

1. `rapor/son-tazeleme.md` — koşunun kendi anlatımı
2. Actions log — hangi adımda düştü
3. `KTPANEL-BAKIM.md` — aynı arıza daha önce yaşandıysa dersi orada
4. Deploy sorunuysa: `DEPLOY.md` (rozet kontrolü)
