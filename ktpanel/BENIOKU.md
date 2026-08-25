# arac/gelen/ — TEFAS konsol toplayıcı çıktıları

Buraya `tefas-tam-YYYY-AA-GG.json` dosyaları konur.
Tazele koşusu (fon katmanı) **yalnız köprü düştüğünde** buraya bakar ve en
YENİ dosyayı iki kapıdan geçirir:

1. **TAZELİK** — dosya BUGÜNÜN tarihini taşımalı; bayatsa kullanılmaz
   (raporda söylenir, sessizce atlanmaz).
2. **KAPSAM** — dosyadaki tekil fon sayısı, arşivde bugün için yazılı
   kayıttan az olmamalı; azsa kullanılmaz — **iyi veri eksikle EZİLMEZ.**
   (24 Ağu'da tam bu oldu: arşiv 2030, konsol 1900 → reddedildi.)

**Üretim:** `ktpanel/arac/tefas-konsol.js` içeriğini TEFAS fon sayfasında
tarayıcı konsoluna yapıştır. Kendi normal sekmen olmalı — otomasyonla
sürülen sekme TEFAS tarafından reddediliyor.

Eski dosyalar silinebilir; koşu yalnız en yenisine bakar.
Gerekçe ve erişim tablosu: `OTOMASYON.md` → TEFAS bölümü.
