# PYŞ Sektör Tazeleme Reçetesi ("pyş tazele" komutu)

Amaç: `pyssektor.json`'u Fintables canlı verisiyle yeniden üretmek.
Kanıt: 3 Ağu 2026 (§248a) + **25 Ağu 2026 doğrulama koşusu** (aşağıdaki
düzeltmelerle birlikte 6 sorgu da temiz döndü).

## Kurallar (ölçülmüş)

1. `ROUND(double)` hata verir → `ROUND(CAST(x AS numeric), n)`.
2. `UNION ALL` + `GROUP BY` birlikte REDDEDİLİR → her dönem AYRI sade sorgu.
3. **ÇİFT KAYIT TUZAĞI** (YLB kanıtı): `gunluk_fon_degerleri`'nde ardışık
   damga günleri örtüşür. GÜNLÜK blok için `tarih >= 'SON_DAMGA'` tam gün
   kullan (İstanbul günü D verisi (D+1)T00 damgalı gelir; önce
   `SELECT MAX(tarih_europe_istanbul)` ile son damgayı ÖLÇ).
   Aylık/yıllık toplamlarda örtüşme marjinal ama not düş.
4. `fon_tipi='mutual'` filtresi şart (emeklilik/BYF karışmasın).
5. Fintables kategori taksonomisi TEFAS şemsiyesinden FARKLI (Kira
   Sertifikaları ayrımı katılım için daha iyi) — tür adları olduğu gibi.
6. **PYŞ JOIN SÜTUNU** (25 Ağu düzeltmesi): `portfoy_yonetim_sirketleri`
   tablosunda `portfoy_yonetim_sirketi_id` YOKTUR. Bağlantı sütunu
   `portfoy_yonetim_sirketi_kodu` (BEF1901 biçiminde). Reçetenin eski hali
   `_id` diyordu ve sorgu hata veriyordu.
7. **NULL AKIŞ TUZAĞI** (25 Ağu, TNA kanıtı): bazı fonların
   `gunluk_nakit_giris_cikisi` alanı BOŞ gelir ve `ORDER BY ... DESC`'te
   EN ÜSTE oturur — liste başında boş satır görürsün. Fon bazlı sorgulara
   `AND g.gunluk_nakit_giris_cikisi IS NOT NULL` ekle.
   (Tür/PYŞ toplamlarında SUM zaten NULL'ları atlar, sorun yalnız satır
   bazlı sorgularda.)

## Sorgular (dönem başına; tarihleri güncelle)

```sql
-- 0) ÖNCE SON DAMGAYI ÖLÇ
SELECT MAX(tarih_europe_istanbul) AS son_damga FROM gunluk_fon_degerleri;

-- 1) TÜR  (1G: >= SON_DAMGA · 1A: >= bugün-30g)
SELECT fk.baslik, ROUND(CAST(SUM(g.gunluk_nakit_giris_cikisi)/1e9 AS numeric),2) AS net_mlr
FROM gunluk_fon_degerleri g
JOIN fonlar f ON f.fon_kodu=g.fon_kodu
JOIN fon_kategori_iliskileri fki ON fki.fon_kodu=g.fon_kodu
JOIN fon_kategorileri fk ON fk.fon_kategori_id=fki.fon_kategori_id
WHERE g.tarih_europe_istanbul >= '<TARIH>' AND f.fon_tipi='mutual'
GROUP BY fk.baslik ORDER BY net_mlr DESC LIMIT 12;

-- 2) PYŞ  (aynı gövde; kategori JOIN'leri YERİNE:)
JOIN portfoy_yonetim_sirketleri p
  ON p.portfoy_yonetim_sirketi_kodu = f.portfoy_yonetim_sirketi_kodu
... GROUP BY p.unvan

-- 3) FON 1G (satır bazlı, SUM yok — NULL filtresi ŞART)
SELECT g.fon_kodu, f.unvan, ROUND(CAST(g.gunluk_nakit_giris_cikisi/1e9 AS numeric),2) AS net_mlr
FROM gunluk_fon_degerleri g JOIN fonlar f ON f.fon_kodu=g.fon_kodu
WHERE g.tarih_europe_istanbul >= '<SON_DAMGA>' AND f.fon_tipi='mutual'
  AND g.gunluk_nakit_giris_cikisi IS NOT NULL
ORDER BY net_mlr DESC LIMIT 10;

-- 4) FON 1A (SUM + GROUP BY g.fon_kodu, unvan için MAX(f.unvan))
```

Negatif uç istenirse `ORDER BY net_mlr ASC` ile ikinci koşu.

## Üretim

Sonuçlar → `pyssektor.json`:
`{ pys:{1G,1A}, fon:{1G,1A}, tur:{1G,1A}, guncelleme, damga_gunu, kaynak, _okuma_notu }`

Unvanlar kısaltılır (`AK PORTFÖY YÖNETİMİ A.Ş.` → `Ak`).
`guncelleme` = veri günü · `kaynak` = 'Fintables gunluk_fon_degerleri (canlı sorgu)'.

## Çapraz denetim (yeni — 25 Ağu)

PYŞ 1G lideri, aynı günkü **Actions fon akışı raporundaki** PYŞ sıralamasıyla
karşılaştırılır. 25 Ağu'da AK +15,54 mlr ₺ ile **birebir tuttu** — iki bağımsız
kaynak (Fintables SQL ve TEFAS köprüsü) aynı sonucu verdi. Tutmuyorsa önce
damga günü ve `fon_tipi` filtresi kontrol edilir.

## Otomasyon durumu

Fintables MCP **yalnız Claude oturumunda** çalışır; Actions bu katmanı kendi
çekemez. Bu yüzden `pyssektor.json` "Claude ile tazelenir" sınıfındadır —
detay: `OTOMASYON.md`.
