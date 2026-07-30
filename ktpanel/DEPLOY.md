# KTPanel — Deploy Listesi
**29 Temmuz 2026 (akşam)** · `app.js?v=20260730v` · `ajan.js?v=20260730a`

Tümü denetimden geçti: 8 JS sözdizimi + 11 JSON geçerli.

---

## ★ YENİ DOSYALAR (6) — daha önce hiç deploy edilmedi

| Dosya | Konum | Hash | Ne işe yarar |
|---|---|---|---|
| `xk100.json` | **kök** | `3fbb55a7a925` | BIST Katılım 100 ağırlıkları (100 üye) |
| `xktum.json` | **kök** | `608654247fad` | BIST Katılım Tüm (150/242 üye · %96,5) |
| `xktmt.json` | **kök** | `32c24c138455` | BIST Katılım dar endeks (34 üye) |
| `bist-takvim.json` | **kök** | `bb019b3c892e` | BIST beklenen bilanço tarihleri (40 hisse) |
| `api/usnews.js` | **`api/`** | `1a1308d7e7a9` | Finnhub kazanç takvimi + ABD haberleri |
| `test/kopru-testi.js` | `test/` | `b9830d4c931a` | Köprü sağlık testi (deploy şart değil) |

> Eksik olurlarsa: Endeksten Ayrışma "ağırlık yok" der · BIST takviminde beklenenler görünmez · ABD kazanç takvimi boş kalır.

---

## DEĞİŞEN DOSYALAR (17)

### Kod
| Dosya | Konum | Hash |
|---|---|---|
| `app.js` | kök | `ede69def1bde` |
| `index.html` | kök | `10dba564e561` |
| `ajan.js` | kök | `784245d5d56d` |
| `middleware.js` | kök | `48033763ccb5` |
| `vercel.json` | kök | `41090214649a` |
| `api/market.js` | `api/` | `6563fe4993be` |
| `api/katfon.js` | `api/` | `df1900c0c031` |
| `api/data.js` | `api/` | `3c020d29ace9` |

### Veri
| Dosya | Hash | Bu turda ne değişti |
|---|---|---|
| `multiple.json` | `de980a0b1af2` | 141 hissenin fiyatı 29 Tem'e çekildi |
| `katfon.json` | `e0c752adbe24` | Getiriler 27 Tem · AUM/akış 29 Tem |
| `inceleme-ai.json` | `1790ab6a25d1` | CWENE · ARCLK · TSKB eklendi (20 kart) |
| `guncelleme-plani.json` | `793141b22c62` | Endeks ağırlıkları + BIST takvim katmanları |
| `sektor.json` | `1b16fe79a76a` | — |
| `yabanci.json` | `061d11f9cba1` | — |

### Belge
| Dosya | Hash |
|---|---|
| `KTPANEL-BAKIM.md` | `1b942dd3978a` |
| `KTPANEL-DAMGA.md` | `bdae0d85f989` |

---

## DEPLOY SONRASI KONTROL

**1 · Fiyat akışı** — Portföy → Endeksten Ayrışma, kartın altında:
```
Fiyat akışı: ~158 sembol istendi, sunucu 158 döndürdü
```
"sunucu 40 döndürdü" ya da kırmızı uyarı → `api/market.js` deploy edilmemiş.

**2 · ABD kazanç takvimi** — Piyasa sekmesi, GLOBAL kartının içinde. 29–30 Tem'de MSFT/META/AAPL/AMZN görünmeli. Boşsa → `api/usnews.js` eksik.

**3 · BIST bilanço takvimi** — MPARK ve TUPRS **GECİKTİ** (kırmızı), TUREX/NTGAZ/ASELS **BEKLENİYOR** rozetiyle üstte. Yoksa → `bist-takvim.json` eksik.

**4 · Endeks seçici** — XKTUM · XK100 · XKTMT. Biri "ağırlık yok" derse o JSON eksik.

**5 · ABD kartı** — politika faizi görünmeli:
```
Politika faizi — hedef aralık    %3,50 – %3,75
· efektif (DFF) — aralığın neresinde
```
Yoksa → `api/market.js` eski (`DFEDTARL/DFEDTARU` orada).

**6 · Ebu notu** — BIST takvim kartının altındaki not hâlâ "bu hafta bilanço sakin" diyorsa §169 soğuma delmesi çalışmamış; söyle, not motorunun kart keşfine bakarız.

---

## AÇIK KALEMLER

- **Ağustos dalgası (~10–29 Ağu):** faktör modeli · guidance · analist · multiple bilanço kalemleri **birlikte** tazelenmeli — aynı dönem verisiyle, yoksa faktör skorları karışık dönemden oluşur.
- **Haftalık:** endeks ağırlıkları (XKTUM/XK100/XKTMT). Kart 14 günü aşarsa kırmızı uyarır.
- **Swap stoku** (`rezerv.json`) 12 gün gecikmiş — EVDS'den, ayrı iş.
- **`parite_gecmis_v1`** buluta bağlanmadı; tarayıcı değişince geçmiş sıfırlanıyor.
- **`oranlar.json`** önerisi açık — Fintables'ın 22 finansal oranı (ROE, ROIC, marj katmanları, kaldıraç). Onay bekliyor.
- **TEFAS canlı çekim** kapalı (bot koruması); köprü ritüeli çalışıyor.
