# KTPanel — Deploy Listesi
**31 Temmuz 2026** · panel `20260731-p` · api `kap-2026-07-31-f`

---

## ▸ BEŞ DOSYA, HEPSİ BİRDEN

Bunlar birbirine bağlı. Ayrı ayrı yüklersen arada tutarsız durum oluşur — bugün bunu altı kez yaşadık.

| Dosya | Nereye |
|---|---|
| `api/kap.js` | `ktpanel/api/` |
| `api/ajanktp.js` | `ktpanel/api/` |
| `app.js` | `ktpanel/` |
| `ajan.js` | `ktpanel/` |
| `index.html` | `ktpanel/` |

---

## ▸ DEPLOY DOĞRULAMASI — artık tek bakışta

Portföy Yönetimi → **Finansal Tablolar** sekmesini aç. Sağ üstteki rozet:

```
panel 20260731-p · api kap-2026-07-31-f
```

**Bu ikisini görmüyorsan gerisini denemeye gerek yok.** Rozet ilk açılışta yalnız panel sürümünü gösterir; bir arama yapınca API sürümü eklenir.

Ayrıca her API yanıtı `surum` alanı taşır:
```
ktpanel.vercel.app/api/kap?mod=fr&gun=7
→ { "surum": "kap-2026-07-31-f", ... }
```

---

## ▸ BU TURDA NE DEĞİŞTİ

**Birim artık rapordan okunuyor** — TL / bin TL / milyon TL. Sabit "bin TL" varsayımı küçük şirketleri bin kat büyük gösteriyordu (BORSK: 77,7 milyar yerine 77,7 milyon).

**Üst sınır birime bağlandı** — sabit `1e9` sınırı, TL cinsinden rapor veren şirketlerin geçerli verisini reddediyordu. BORSK'u ben kırmıştım.

**Başlık ayrımı** — `Finansal Rapor` / `Faaliyet Raporu` / `Sorumluluk Beyanı` üçü de aynı sınıfta geliyor ama yalnız birincisinde tablo var. Artık doğru bildirim doğrudan seçiliyor.

**Satır sınırı** — ayrıştırıcı etiketten sonra `</tr>`'ye kadar okuyor; önce 3000 karakter alıp alttaki satırın rakamlarını karıştırıyordu.

**Taslak → onay → Earnings AI** zinciri kuruldu. Skor onayda giriliyor, kart anında görünüyor.

---

## ▸ SONRA TEST

**1 · Finansal Tablolar** — TOASO / 2026 / 2Ç → getir. Bilanço yatay, gelir tablosu dikey gelmeli, birim tablonun altında yazmalı.

**2 · Teşhis** — CANTE hâlâ düşerse:
```
ktpanel.vercel.app/api/kap?mod=teshis&kod=CANTE&gun=15
```
`birim`, `ustSinir`, her etiketin `redSebebi` ve `sayfadakiDigerBasliklar` dönecek.

**3 · Nöbet** — Ebu panelinde "taslak" düğmesi. Kart önizlemesi, skor kutusu, onayla.

---

## ▸ AÇIK KALEMLER

- **CANTE / GENIL** — hangi şablonu kullandıkları belirsiz; teşhis çıktısı gerekiyor
- **Ağustos dalgası (~10–29 Ağu)** — faktör modeli · guidance · multiple birlikte tazelenmeli
- **Sentetik XKTUM** — `track.json` gerçek XKTUM bazlı, canlı taraf XU100; taban farklı
- **Otomatik tazeleme** — GitHub Actions'ta altı katman dönüyor, dokunmaya gerek yok
