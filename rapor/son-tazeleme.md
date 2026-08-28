# Tazeleme — 2026-08-28

Katman: `fon` · Veri dizini: `ktpanel`


### TEFAS genel bilgi (§253i) — ✓ 2031 fon · AUM + yatırımcı sayısı köprüden (ham 2038 kayıt, sayfalamalı)

### TEFAS köprü (bilgi)
- getiri: 1059 fon ✓ · liste: 1049 kayıt · alanlar: fonKod, unvan, kurucuKod, kurucuAd, oprKod, oprAd, durum, tarih

### Fon akışı — ℹ 973 fonun kurucusu fon adından türetildi (§279; mod=liste 1049 kayıt kapsıyordu, evren 2031)

### Akış pencereleri (§359) — ✓ 1H hazır · arşiv 13 gün
- 1H giriş: İŞ 20.5 mlr · TERA 19.8 mlr · YAPI KREDİ 18.4 mlr

### PYŞ bazında akış (§358) — ✓ 69 kurum · 2026-08-28 · 9 fon eşleşmedi
- giriş: İŞ 18.73 mlr · TERA 7.11 mlr · ALBARAKA 2.56 mlr
- çıkış: ZİRAAT -4.22 mlr · DENİZ -4.79 mlr · KUVEYT TÜRK -5.73 mlr

### Fon akışı (§263) — ✓ 2031 fon · 2026-08-27 → 2026-08-28
- giriş 79.34 mlr ₺ · çıkış -76.10 mlr ₺ · net 3.24 mlr ₺

### TEFAS alan keşfi (bilgi)
- uç: `/api/statistics/tefas/getFplFonList`
- alanlar: fonKod, unvan, kurucuKod, kurucuAd, oprKod, oprAd, durum, tarih

### TEFAS çekim tanısı (bilgi)
- yol: vercel-köprüsü (2031 fon fiyat + 1059 getiri)
- yakalanan JSON: 1 / toplam yanıt: 85 · sayfa: "Fon Getirileri - TEFAS Fon Bilgilendirme ve Karşılaştırma | " · gövde: `Görme engelliler için erişilebilirliği etkinleştirin Erişilebilirlik menüsünü açma Erişilebilir Gezinme Menüsünü Açın Ana içeriğe geç Ana Sayfa Fon Getirileri Fon Karşılaştır F` · uçlar: /api/statistics/tefas/getFplFonList (1049)

### Katılım fonları — ✓ GEÇTİ
- ✓ **kapsam**: 46/46 (%100)
- ✓ **aykırı değer**: temiz (sınır ±%2)
- ✓ **dönem tutarlılığı**: temiz

### Katılım fonları — ℹ aynı gün tekrar koşu: fiyat/AUM tazelendi, 1G ve akış KORUNDU (§266)


---
**Sonuç:** fon akışı (2031) · katılım fonları (46+akış)