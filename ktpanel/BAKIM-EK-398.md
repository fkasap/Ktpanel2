# BAKIM EK — §398 (24 Agu 2026)
# KTPANEL-BAKIM.md'ye en yeni ustte yapistirilir; DAMGA bolumu KTPANEL-DAMGA.md'ye.

## §398 RISK BUTCESI: YAPISAL TUTARSIZLIK ile GERCEK SURUKLENME AYRILDI (24 Agu)

KOK NEDEN: Kart "BUTCE IHLALI · 8" gosteriyordu ama ihlallerin bir kismi
portfoyun DEGIL, TAVANIN hatasiydi. OLCUM: 8 pozisyon + %0,8 nakitle tek isim
agirliginin matematiksel TABANI (100−nakit)/N = %12,4'tur — %9 tavan HICBIR
portfoyle saglanamaz; kutu yapisal olarak hep dolu kalir ve gercek suruklenme
alarminin degeri duser (§300: nobetci her hickirikta bagirirsa kimse dinlemez).
Risk payinin tabani ise 100/N = %12,5 (esit risk katkisi siniri, ERC) — %15
tavan TUTARLI, yani CWENE %30 ve TUPRS %20 risk payi GERCEK konsantrasyon.

### §398a AGIRLIK TAVANI TUM POZISYONLARA BAKAR
Eskiden dongu yalniz `kal` (risk.json kapsami) uzerindeydi; kapsam disi bir
isim toplam varligin %30'u olsa agirlik ihlali URETMIYORDU — sessiz eksik
denetim sinifi (§179.3: eksik olan gorunmezse en tehlikelisidir). Agirlik saf
bir agirlik kuralidir, vol/beta GEREKTIRMEZ; dongu `hisseler`e alindi.
`x.wT` hesabi tabloda kullanilmaya devam ediyor, kaldirilmadi.

### §398b BUTCE TUTARLILIK DENETIMI (sari kutu)
tabanW=(100−nakit)/N ve tabanC=100/N her hesapta olculur; tavan tabanin
altindaysa SARI "BUTCE TUTARSIZ" kutusu ihlal kutusunun USTUNDE cikar —
okuma sirasi once yapi, sonra surunkleme. KIRMIZI DEGIL: kaybi olmayan
arizada is kirmizi yakilmaz (§300 gerekce). Mesaj cozumu de soyler:
"ya tavani yukselt ya isim sayisini en az X'e cikar".

DOGRULAMA: node --check ✓ · div dengesi 942/942 ✓ · x.wT tablo kullanimlari
yerinde (5354, 5357) ✓ · birim test: tabanW %12,4 → 9 TUTARSIZ, tabanC %12,5
→ 15 TUTARLI ✓ · KTP_SURUM 20260824a = index.html ?v= (iki script) ✓.

DERS: IHLAL SAYISI TEK BASINA SINYAL DEGILDIR — once tavanin kendisinin
saglanabilir oldugu olculur. Limit ihlali bazen pozisyon hatasi degil,
limitin kalibrasyon hatasidir; ikisi ayni kutuda gosterilirse ikisi de okunmaz.

# ===========================================================================
# DAMGA CIZELGESINE EKLENECEKLER (KTPANEL-DAMGA.md)
# ===========================================================================
## ALTIN KURALLARA EKLER
- TAVAN KOYMADAN ONCE TABANI OLC: agirlik tabani (100−nakit)/N, risk payi
  tabani 100/N. Tavan tabanin altindaysa ihlal listesi yapisal gurultudur.
## SURUM IZI (panel)
20260824a (§398a+b) — risk butcesi tutarlilik denetimi + kapsam disi agirlik tavani.
