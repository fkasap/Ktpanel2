# PYŞ Sektör Tazeleme Reçetesi ("pyş tazele" komutu)
Amaç: pyssektor.json'u Fintables canlı verisiyle yeniden üretmek.
Kanıt: 3 Ağu 2026 oturumu (§248a) — GROUP BY+JOIN+SUM destekli, UNION+GROUP YASAK.

## Kurallar (ölçülmüş)
1. ROUND(double) hata verir → ROUND(CAST(x AS numeric), n).
2. UNION ALL + GROUP BY birlikte REDDEDİLİR → her dönem AYRI sade sorgu.
3. ÇİFT KAYIT TUZAĞI (YLB kanıtı): gunluk_fon_degerleri'nde ardışık damga
   günleri örtüşür. GÜNLÜK blok için tarih >= 'SON_DAMGA' tam gün kullan
   (İstanbul günü D verisi (D+1)T00 damgalı gelir; önce
   SELECT MAX(tarih_europe_istanbul) ile son damgayı ölç).
   AYLIK/YILLIK toplamlarda örtüşme marjinal ama not düş.
4. fon_tipi='mutual' filtresi şart (emeklilik/BYF karışmasın).
5. Fintables kategori taksonomisi TEFAS şemsiyesinden FARKLI (Kira
   Sertifikaları ayrımı katılım için daha iyi) — tür adları olduğu gibi.

## Sorgular (dönem başına; tarihleri güncelle)
-- TÜR (1G): tarih >= SON_DAMGA; 1A: >= bugün-30g
SELECT fk.baslik, ROUND(CAST(SUM(g.gunluk_nakit_giris_cikisi)/1e9 AS numeric),2) AS net_mlr
FROM gunluk_fon_degerleri g
JOIN fonlar f ON f.fon_kodu=g.fon_kodu
JOIN fon_kategori_iliskileri fki ON fki.fon_kodu=g.fon_kodu
JOIN fon_kategorileri fk ON fk.fon_kategori_id=fki.fon_kategori_id
WHERE g.tarih_europe_istanbul >= '<TARIH>' AND f.fon_tipi='mutual'
GROUP BY fk.baslik ORDER BY net_mlr DESC LIMIT 12;

-- PYŞ (1G/1A): aynı gövde, JOIN portfoy_yonetim_sirketleri p, GROUP BY p.unvan
-- FON (1G): SUM'suz doğrudan satır; (1A): SUM ... GROUP BY g.fon_kodu, f.unvan
-- Negatif uç istenirse ORDER BY net_mlr ASC ikinci koşu.

## Üretim
Sonuçlar → pyssektor.json {pys:{1G,1A}, fon:{1G,1A}, tur:{1G,1A}} +
guncelleme=veri günü + kaynak='Fintables gunluk_fon_degerleri (canlı sorgu)'.
Unvanlar kısaltılır ('PORTFÖY YÖNETİMİ A.Ş.' → 'Portföy').
Tam otomasyon (panele Fintables erişimi yok): Actions/TEFAS katmanı — bekleyen büyük iş.
