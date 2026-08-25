# KTPanel — Deploy Listesi

> **SÜRÜM NUMARASI BU DOSYAYA YAZILMAZ.** Bir zamanlar yazıyordu (`20260731-p`)
> ve 25 gün bayat kaldı — talimatı izleyen kişi doğru deploy'u yanlış sanardı.
> §399/§415'in dersi: *tarihi/sürümü gösteren yer, kaynağından beslenmeli.*
> Güncel sürüm **her zaman canlı rozetten** okunur (aşağıya bak).

---

## ▸ NE DEĞİŞTİYSE O YÜKLENİR — ama bağlı olanlar BİRLİKTE

Her teslimatta beş dosyanın hepsi değişmez. Kural şu: **birbirine bağlı
olanlar aynı commit'te gider**, yoksa arada tutarsız durum oluşur.

| Değişen | Yanında ZORUNLU giden | Neden |
|---|---|---|
| `app.js` | `index.html` | sürüm damgası üçlüsü (KTP_SURUM + iki `?v=`) |
| `ajan.js` | `index.html` | aynı — `?v=` damgası |
| `api/*.js` | — | bağımsız; kendi `SURUM` alanını taşır |
| veri (`*.json`) | — | bağımsız; panel `cache:no-store` okur |

**Dosya yerleri**

| Dosya | Nereye |
|---|---|
| `app.js` · `ajan.js` · `index.html` · `mail.js` · `middleware.js` | `ktpanel/` |
| `api/*.js` (kap · edgar · tefas · katfon · evds2 · bddk · tcmb · market · data · platts · usnews · ajanktp) | `ktpanel/api/` |
| `tazele.mjs` · `denetim.mjs` | `scripts/` |
| `tazele.yml` | `.github/workflows/` |
| araçlar (`fm-isle.py` · `tefas-konsol.js` · `tefas-har-isle.mjs`) | `ktpanel/arac/` |
| konsol çıktısı (`tefas-tam-*.json`) | `ktpanel/arac/gelen/` |
| tüm veri dosyaları | `ktpanel/` |

⚠ **API kotası 12/12 DOLU** (Vercel Hobby sınırı). Yeni yetenek ancak
mevcut bir uca `?mod=` eklenerek ya da `api/_lib` içine konularak gelir.
Yeni `api/*.js` dosyası AÇILAMAZ.

---

## ▸ DEPLOY DOĞRULAMASI — tek bakış

**EQUITY → Finansal Tablolar** sekmesini aç. Sol üstteki rozet:

```
panel 20260825a        ← app.js'teki KTP_SURUM ile AYNI olmalı
```

Arama yapınca API sürümü de eklenir. Ayrıca her API yanıtı `surum` taşır:

```
ktpanel.vercel.app/api/kap?mod=fr&gun=7   → { "surum": "kap-2026-08-..." }
ktpanel.vercel.app/api/edgar?...          → { "surum": "edgar-2026-08-23-e" }
```

**Rozet eski sürümü gösteriyorsa gerisini denemeye gerek yok** — ya yükleme
eksik ya Vercel henüz deploy etmemiş (1-2 dk).

Konsol hatası kontrolü: F12 → Console. Temiz olmalı; kırmızı satır varsa
`index.html` ile `app.js` sürümleri ayrışmıştır (ilk şüpheli budur).

---

## ▸ YÜKLEMEDEN SONRA ÜÇ KONTROL

1. **Rozet** — `panel <yeni sürüm>` ✓
2. **Veri Durumu çekmecesi** (başlıkta) — kırmızı `GÜNCELLE` satırı beklenmedik
   bir yerde çıkmamalı. Kalemin tarihi `·dosya` etiketi taşıyorsa tarih
   dosyadan geliyordur; taşımıyorsa `guncelleme-plani.json`'dan (elle) gelir.
3. **Değişen sekme** — ne yüklediysen onu aç, gözle doğrula.

---

## ▸ YÜKLEME SIRASI (kritik)

- Kod dosyaları **koşu sırasında yüklenmez** — Actions çalışırken push atmak
  çakışma üretir. Koşunun bitmesini bekle.
- `scripts/tazele.mjs` değiştiyse: **önce yükle, sonra tetikle.** Ters sıra
  bir turu eski kodla boşa harcatır (24 Ağu'da iki kez yaşandı).
- Silme işleri (yetim dosya vb.) yükleme bittikten **sonra** yapılır.
