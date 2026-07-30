# KTPanel — Deploy Listesi
**30 Temmuz 2026** · `app.js?v=20260730z` · `ajan.js?v=20260730a`

28 dosyanın hepsi denetimden geçti.

> **Yapı hatırlatması** — repo iki katmanlı:
> ```
> Ktpanel2/
> ├── .github/workflows/  ← OTOMASYON (repo kökü)
> ├── scripts/            ← OTOMASYON (repo kökü)
> ├── package.json        ← OTOMASYON (repo kökü)
> ├── .gitignore          ← OTOMASYON (repo kökü)
> └── ktpanel/            ← PANEL (Vercel Root Directory)
>     ├── index.html · app.js · *.json
>     └── api/
> ```

---

## ▸ ACİL — sicil karşılaştırmasını düzeltir

| Dosya | Hedef | Hash |
|---|---|---|
| `api/market.js` | `ktpanel/api/` | `1ba3cc22e6bb` |
| `app.js` | `ktpanel/` | `c14288d839bc` |

**Neden acil:** `XKTUM.IS` Yahoo'da **yok** (Actions koşusunda kanıtlandı: `XKTUM.IS boş · ^XKTUM boş · XU100.IS 250`). Bu yüzden `m.xktum.p` hep null dönüyordu ve sicil karşılaştırması canlı tarafta **sessizce hiç çalışmıyordu**. Sembol `XU100.IS`'e yönlendirildi.

---

## ▸ PANEL — `ktpanel/` klasörüne

### Kod
| Dosya | Hash | Ne değişti |
|---|---|---|
| `index.html` | `10f5a097a0b6` | Endeksten Ayrışma Portföy içine · başlıklar h2 · takvim düzeni |
| `app.js` | `c14288d839bc` | ↑ acil listede |
| `ajan.js` | `784245d5d56d` | §169 soğuma delmesi (olay kartları beklemez) |
| `middleware.js` | `48033763ccb5` | — |
| `vercel.json` | `41090214649a` | — |
| `package.json` | `00baabb044c5` | — |

### api/
| Dosya | Hash | Ne değişti |
|---|---|---|
| `api/market.js` | `1ba3cc22e6bb` | ↑ acil · + `DFEDTARL/U` politika faizi · dinamik hisse listesi |
| `api/usnews.js` | `1a1308d7e7a9` | Finnhub 5 dilime bölündü (1500 kayıt sınırı) |
| `api/katfon.js` | `df1900c0c031` | — |
| `api/data.js` | `3c020d29ace9` | — |

### Veri
| Dosya | Hash | Durum |
|---|---|---|
| `xk100.json` | `b4a01f527a92` | ★ **YENİ** · pay adedi biçimi |
| `xktum.json` | `191395980276` | ★ **YENİ** · pay adedi biçimi |
| `xktmt.json` | `b7e873dab359` | ★ **YENİ** · pay adedi biçimi |
| `bist-takvim.json` | `bb019b3c892e` | ★ **YENİ** · beklenen bilanço tarihleri |
| `inceleme-ai.json` | `82b670663a26` | 25 kart (GARAN·TSKB·TOASO·MSFT·META·CWENE·ARCLK·ARENA) |
| `analist.json` | `2e82237f18c7` | 51/55 tazelendi · 4 bayat işaretlendi |
| `multiple.json` | `de980a0b1af2` | 141 fiyat 29 Tem |
| `katfon.json` | `2e216d2c1f23` | getiri 28 Tem · AUM 29 Tem |
| `track.json` | `478e89b4a10a` | sicil 28 Tem |
| `guncelleme-plani.json` | `f8ae65264237` | yeni katmanlar + araştırma kayıtları |
| `sektor.json` · `yabanci.json` | — | değişmedi |

### Belge
`KTPANEL-BAKIM.md` `76d0f4141aa4` · `KTPANEL-DAMGA.md` `4707be061978` · `DEPLOY.md` · `KURULUM.md` · `OTOMASYON.md`

---

## ▸ OTOMASYON — repo KÖKÜNE (ktpanel/ değil)

| Dosya | Hash | Not |
|---|---|---|
| `scripts/tazele.mjs` | `34b4452c6763` | ★ risk katmanı + kurumsal işlem süzgeci |
| `scripts/denetim.mjs` | `07ff601c64da` | ★ altı kural |
| `.github/workflows/tazele.yml` | — | ★ zamanlayıcı |
| `.gitignore` | `acd2ceb9bd10` | ★ node_modules |
| `package.json` (kök) | `84c0d5464251` | ★ playwright |

> `kok/package.json` dosyasını **`package.json`** adıyla repo köküne koy — `ktpanel/package.json` ile karışmaz, Vercel Root Directory `ktpanel` olduğu için köktekini görmez.

---

## DEPLOY SONRASI KONTROL

**1 · Sicil** — Portföy Yönetimi → Yönetim. Model vs endeks karşılaştırması artık dolmalı. "Canlı fiyatlar henüz yüklenmedi" diyorsa `api/market.js` gitmemiş.

**2 · Fiyat akışı** — Portföy → Endeksten Ayrışma, kart altında:
```
Fiyat akışı: ~158 sembol istendi, sunucu 158 döndürdü
```
"40 döndürdü" ya da kırmızı uyarı → `api/market.js` eski.

**3 · Politika faizi** — Makro/ABD sekmesinde `%3,50 – %3,75` görünmeli.

**4 · Bilanço takvimi** — Piyasa sekmesi. BIST kartında MPARK/TUPRS **GECİKTİ** (kırmızı), TUREX/NTGAZ/ASELS **BEKLENİYOR**. GLOBAL kartında MSFT/META/AAPL/AMZN.

**5 · Earnings AI** — 25 kart, en üstte GARAN · TSKB · TOASO · MSFT · META.

**6 · Endeks seçici** — XKTUM · XK100 · XKTMT. Biri "ağırlık yok" derse o JSON gitmemiş.

---

## OTOMATİK OLANLAR — artık elle yapılmıyor

Altı katman GitHub Actions'ta dönüyor (hafta içi 18:10, cumartesi 07:00):
**XK100 · XKTUM · XKTMT ağırlıkları · Multiple fiyatları · Model sicili · Risk metrikleri**

Denetimden geçmeyen katman **yazılmaz**, iş kırmızı yanar, bildirim gider.

---

## AÇIK KALEMLER

- **Sentetik XKTUM** — `track.json` gerçek XKTUM bazlı (18.262,59), canlı taraf artık XU100. İki farklı endeks; oran taban kayması üretir. `xktum.json`'daki ağırlıklarla sentetik endeks hesaplanabilir.
- **Fon katmanı** — TEFAS/Playwright henüz doğrulanmadı.
- **Ağustos dalgası (~10–29 Ağu)** — faktör modeli · guidance · multiple bilanço kalemleri **birlikte** tazelenmeli.
- **Çeyreklik** — pay adedi, bilanço kalemleri, beklenen bilanço takvimi (Fintables).
- **Aylık** — analist konsensüsü.
- **`parite_gecmis_v1`** buluta bağlanmadı.
- **`oranlar.json`** önerisi açık (Fintables 22 finansal oran).
- **Bu akşam** — QCOM · AAPL · AMZN kartları.
