# BAKIM EK — §398-§400 (24 Agu 2026)
# Onceki 398-399 dosyasinin YERINE gecer (kumulatif). KTPANEL-BAKIM.md'ye
# en yeni ustte; DAMGA bolumu KTPANEL-DAMGA.md'ye.

## §400 FM DISLAMA LISTESI — KULLANICI VETOSU, BULUTTA (24 Agu)

ISTEK: "bazi sirketleri elimine etmek istiyorum; cikar dedigimde modelden
ciksin, yedekten girsin, kaydedilsin."
TASARIM: kantitatif siralamaya KALITATIF VETO katmani. Ayri bir "yedek cek"
mekanigi YAZILMADI — dislananlar SECIMDEN ONCE dustugu icin secim dongusu
siradaki ismi (tampon) kendiliginden alir; agirliklar ve sektor tavani ayni
motorla yeniden kurulur. En az mekanizma, ayni davranis.
  - Tabloya 11. sutun: her satirda × (satir tiklamasini stopPropagation ile
    YUTAR — yoksa cikarirken teshis karti acilirdi).
  - Tablonun altinda DISLANAN cubugu: cip basina ↩ geri-al + "tumunu geri al".
  - Dislama TICKER bazli — fm.json yenilense de YASAR; evren disina dusen
    isim cipte "(evren disi)" etiketiyle gorunur, sessizce kaybolmaz.
KALICILIK: fm_disla_v1 anahtari; CLOUD_KEYS'e eklendi (§265 bilanco-yoksay
EMSALI: "cihazlar arasi tasinmali, yoksa her cihazda tek tek"). localStorage
sarimi CLOUD_KEYS'i profil bazli buluta otomatik tasir — ek is yok.
KAPSAM SINIRI (bilincli): KARNE'YE DOKUNULMADI — karne modelin kendini
kanitlama testidir (tum evren, esit agirlik, "slider'dan bagimsiz sabit
referans"); kullanici vetosu olcume karisirsa test modeli degil kullaniciyi
olcer. Resmi sicil (track) de veto disi.
DOGRULAMA: gercek fm.json ile simulasyon — ESCOM/ARASE/PAGYO dislaninca
EGPRO/ONCSM/RGYAS yedekten girdi; secim 25'te kaldi, sektor tavani 6≤6,
dislanan listede yok. node --check ✓ · div 943/943 ✓ · colspan 10→11 iki
noktada (index yukleniyor + fmInit hata) ✓.
DERS-1: YEDEK MEKANIGI YAZMA, SECIMIN ONUNE FILTRE KOY — dongu zaten yedegi bilir.
DERS-2: SATIR ICI DUGME satir tiklamasini yutmali (stopPropagation) — §343
sinifi "dugme bagli degil" kazalarinin tersi: dugme bagli ama yanlisi da tetikliyor.
NOT (uygulama): ilk yazim turunda coklu-degisim betigi 4. adimda eslesme
bulamayip DURDU ve dosya YAZILMADI (tum degisimler bellekte, yazim en sonda)
— index/app tutarsiz kalmadi; adim-adim tanili ikinci turda 7/7 gecti.
Uzun tutturma dizgisi kirilgandir; esssiz KISA kuyruk daha saglam.

## §399 FM.JSON TAZELENDI: 147 -> 215 + t6 DAMGASI CANLI (24 Agu)
[değişiklik yok — önceki blokla aynı]
KOK NEDEN: fm.json 14 Tem'de donmustu (41 gun); "14 Tem" bes yerde ELLE yaziliydi.
OLCUM: 215/215 siralandi, cikan yok, 68 yeni; imza saglikli; eski dosyaya
korelasyon QUALITY 0,90 · VALUE 0,70 · GROWTH 0,73 · LOW_RISK 0,68 ·
MOMENTUM 0,27 (beklenen desen — momentum 6 haftada doner).
COZUM: yeni fm.json (meta.tarih 2026-08-24) + §399 damga yazicisi: bes metin
span'a alindi, fmInit meta.tarih'ten basar; meta.tarih yoksa metin durur.
ACIK KALEM: fmKarne tabani MFIYAT (multiple.json, GUNLUK tazelenir) — "uretim
tarihinden bugune" iddiasiyla celisir. Kalici cozum: fm-isle.py uretim gunu
fiyat anlik goruntusunu fm.json'a gomer, karne o tabani kullanir (ayri karar).

## §398 RISK BUTCESI: YAPISAL TUTARSIZLIK / GERCEK SURUKLENME AYRIMI (24 Agu)
[değişiklik yok — önceki blokla aynı]
Taban matematigi: agirlik (100−nakit)/N=%12,4 → %9 tavan YAPISAL tutarsiz;
risk payi 100/N=%12,5 → %15 TUTARLI (CWENE %30 / TUPRS %20 GERCEK).
§398a agirlik tavani TUM pozisyonlara bakar; §398b sari "BUTCE TUTARSIZ"
kutusu ihlalin USTUNDE, cozum cumlesiyle.

# ===========================================================================
# DAMGA CIZELGESINE EKLENECEKLER (KTPANEL-DAMGA.md)
# ===========================================================================
## YENI SATIR
- FM dislama listesi (t6) · fm_disla_v1 · BULUT ✓ · veto secim-oncesi filtre;
  karne ve resmi sicil veto DISI (bilincli).
## GUNCELLENEN
- Faktor modeli: 24 Agu ✓ (215 hisse) · t6 damgasi meta.tarih'ten CANLI.
## ALTIN KURALLARA EKLER
- TAVAN KOYMADAN ONCE TABANI OLC ((100−nakit)/N · 100/N).
- DOSYAYI TAZELERKEN TARIHINI GOSTEREN METINLERI ayni kaynaga bagla.
- SATIR ICI DUGME SATIR TIKLAMASINI YUTMALI (stopPropagation).
## SURUM IZI (panel)
20260824a (§398) -> b (§399) -> c (§400 dislama listesi).
