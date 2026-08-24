# arac/gelen/ — TEFAS konsol toplayıcı çıktıları

Buraya `tefas-tam-YYYY-AA-GG.json` dosyaları konur.
Tazele koşusu (fon katmanı) en YENİ dosyayı okur ve iki kapıdan geçirir:

1. TAZELİK — dosya BUGÜNÜN tarihini taşımalı; bayatsa kullanılmaz (raporda söylenir).
2. KAPSAM  — dosyadaki tekil fon sayısı, arşivde bugün için YAZILI kayıttan az
   olmamalı; azsa kullanılmaz (iyi veri eksikle EZİLMEZ).

Üretim: ktpanel/arac/tefas-konsol.js → tarayıcı konsoluna yapıştır.
Eski dosyalar silinebilir; koşu yalnız en yenisine bakar.
