# BAKIM EK — §415-§416 (25 Agu 2026)
# Degisen: app.js · index.html · analist.json · guidance.json · halkaarz.json
#          guncelleme-plani.json   ·   Surum: 20260824e → 20260825a

## §415 CEKMECE IC ICE SEMAYI OKUMUYORDU (kod duzeltmesi)
OLCUM: cekmece "Faktor modeli — 14 Tem · GUNCELLE" diyordu ama fm.json 24 Agu'ya
tazelenmisti; t6 basligi dogru, cekmece yanlis — AYNI GERCEK ICIN IKI TARIH.
KOK NEDEN: dosyaTarihleri() yalniz KOK alanlara bakiyordu (guncelleme/tarih/
fiyat_tarihi). fm.json tarihini META icinde tutar (meta.tarih) → bulunamayinca
dosya ATLANIYOR, cekmece guncelleme-plani.json'daki ELLE yazili degere dusuyordu.
COZUM: (a) okuyucu artik meta.tarih/meta.guncelleme'yi de okur — bundan sonra
fm her tazelendiginde cekmece KENDILIGINDEN doner; (b) plan kaydi hizalandi.
IPUCU EKRANDA IDI: cekmece "·dosya" mini etiketiyle tarihin dosyadan geldigini
soyler (§245p); fm satirinda o etiket YOKTU.
DERS: BIR OKUYUCU SADECE BILDIGI SEMAYI OKUR — ic ice sema kullanan dosya
sessizce atlanir ve yedege duser. Sema degistiginde OKUYUCULARI DA GEZ.
DOGRULAMA (canli): cekmece artik "Faktor modeli — 24 Agu · taze" ✓

## §416 UC BAYAT VERI KALEMI TAZELENDI (Fintables)
### analist.json — 10 Agu → 25 Agu (55/55 hisse)
Pencere 1 YIL olarak KORUNDU (§252v): 6 aylik pencere daha taze GORUNUR ama
kurum sayilarini dusurur (ASELS 23→18) — bu tazeleme degil METODOLOJI
DARALTMASI olurdu. 28 hissede hedef/kurum degisti. Dikkat cekenler:
  SELEC 125,24 → 153,67 (+23%) · CWENE 44,85 → 52,43 (+17%, kurum 1→2)
  GRSEL 422 → 493 (+17%, kurum 1→2) · KRDMD 46,03 → 51,05 (+11%, kurum 15→17)
  BIMAS 559,50 → 492,88 (−12%, kurum 27 sabit) — TEK ANLAMLI ASAGI REVIZYON
4 hisse son 6 ayda raporsuz → bayat:true (ALKLC, GOKNR, SNGYO, SUNTK):
hedefi eskidir, guncel fiyatla kiyaslanmamalidir.
### guidance.json — 17 Tem → 25 Agu (20/20 sirket, 39 gun bayatlik kapandi)
2C sonrasi revizyonlar islendi. Tablolar ARTIK "2025 Gerceklesen" sutunu ve
"(Onceki: ...)" izlerini tasiyor — sirketin hedefini NE YONDE degistirdigi
okunabiliyor. One cikan revizyonlar:
  TUPRS net rafineri marji 6-7 → 13-15 $/v (BUYUK YUKARI revizyon)
  FROTO satis geliri: Yatay → orta-yuksek tek haneli DARALMA; FAVOK %7-8 → %6-7
  ULKER ciro: Yatay → dusuk tek haneli DARALMA; FAVOK %17,5 → %13,5
  AEFES bira hacmi: buyume → DARALMA; konsolide FAVOK marji Yatay → hafif daralma
  AKBNK NFM ~%4 → %3,2-3,5 · ISCTR NFM ~%5 → %3,2-3,4 (bankalarda marj indirimi)
YORUM (fon yoneticisi notu): rafineri disinda genel yon ASAGI — sanayi/tuketim
tarafinda 2026 beklentileri kirpiliyor, bankalarda marj hedefleri geriliyor.
### halkaarz.json — 7 Agu → 25 Agu (35 kayit, 7 yeni/guncel)
AKTIF SUREÇLER: INTET talep 26-27 Agu · BKRGY talep 24-25-26 Agu (BUGUN ACIK).
Yeni tamamlananlar ve getirileri (25 Agu fiyatiyla):
  CITAS +%63,8 · TKNKA +%46,1 · KPEKS +%33,0 · VEYAS +%14,9 · QUICK −%8,4
Mevcut kayitlarin guncel fiyat/getirileri de yeniden hesaplandi.

## KAPSAM NOTU
Fintables MCP yalniz Claude oturumunda calisir — Actions bu kalemleri KENDI
CEKEMEZ. Bu uc dosya dogasi geregi "Claude ile tazelenir" sinifinda; plan
kayitlari da 25 Agu'ya hizalandi.

## HALA BEKLEYEN (bu turda YAPILMADI)
  - degerleme.json 25g · sukuk-ihrac.json 36g · pyssektor.json 15g
  - rezerv.json (swap stoku) 15g — Persembe TCMB yayini sonrasi, TAKVIMLI (§245p)

# ===========================================================================
# DAMGA CIZELGESINE
# ===========================================================================
## GUNCELLENEN
- analist 25A ✓ · guidance 25A ✓ · halkaarz 25A ✓ · fm cekmece damgasi CANLI
## ALTIN KURALLARA EKLER
- SEMA DEGISTIGINDE OKUYUCULARI DA GEZ (§415).
- TAZELEME METODOLOJI DARALTMASI DEGILDIR — pencere/kapsam degistirmeden tazele (§252v).
## SURUM IZI (panel)
20260824e -> 20260825a (§415 cekmece ic ice sema).
