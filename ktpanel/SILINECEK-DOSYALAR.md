# 25 Agu 2026 — BAKIM DOSYASI BIRLESTIRME (18 dosya -> 0)

## ONCE YUKLE (2 dosya, ktpanel/ icine)
  KTPANEL-BAKIM.md    11.861 -> 13.575 satir  (+1.714: §298-§416 kayitlari)
  KTPANEL-DAMGA.md       303 ->    570 satir  (+267: damga bolumleri)

## SONRA SIL (18 dosya, ktpanel/ icinden)
BAKIM-EK-298-314.md
BAKIM-EK-298-318.md
BAKIM-EK-298-319.md
BAKIM-EK-298-322.md
BAKIM-EK-298-337.md
BAKIM-EK-338-365.md
BAKIM-EK-366-397.md
BAKIM-EK-398.md
BAKIM-EK-398-399.md
BAKIM-EK-398-400.md
BAKIM-EK-398-401.md
BAKIM-EK-403-409.md
BAKIM-EK-408b.md
BAKIM-EK-410.md
BAKIM-EK-410c.md
BAKIM-EK-413-414.md
BAKIM-EK-415.md
BAKIM-EK-415-416.md

## NE YAPILDI
KRITIK BULGU: KTPANEL-BAKIM.md 17 Agu'da (§290) DONMUSTU. §298-§416 arasi
TUM kayitlar (8 gunluk is) yalniz EK dosyalarinda yasiyordu — yani bu
dosyalar "fazlalik" degil, ARSIVE GIRMEMIS ASIL KAYITLARDI. Once
birlestirildi, sonra silinebilir hale geldi.

BIRLESTIRME KURALI:
  - Kumulatif zincirlerde YALNIZ en kapsayici surum alindi:
      298-314 ⊂ 298-318 ⊂ 298-319 ⊂ 298-322 ⊂ 298-337  -> 298-337
      398 ⊂ 398-399 ⊂ 398-400 ⊂ 398-401                -> 398-401
      415 ⊂ 415-416                                     -> 415-416
    (8 dosya zaten mukerrerdi; icerik kaybi YOK)
  - 10 benzersiz dosyanin GOVDESI KTPANEL-BAKIM.md'ye, "DAMGA CIZELGESINE"
    bolumleri KTPANEL-DAMGA.md'ye tasindi.
  - Siralama EN YENI USTTE: §415-416 -> §413-414 -> §410c -> §410 -> §408b
    -> §403-409 -> §398-401 -> §366-397 -> §338-365 -> §298-337
  - Yukleme yonergesi yorumlari ("... yapistirilir", "Onceki ... yerine
    gecer") temizlendi; artik gereksiz.
  - Blok basina bir HTML yorumu konuldu: nereden geldigi ve neden
    birlestirildigi okunabilir.

DOGRULAMA: §298, §300, §311, §315, §322, §337, §338, §345, §362, §365,
§366, §397, §398, §401, §403, §407, §409, §410, §410c, §413, §415, §416
-> hepsi birlesik dosyada MEVCUT ✓
Kritik dersler korundu: "SESSIZ CATCH YASAK", "IKI SOHBET AYNI TABANDAN
CALISMAZ", "SEMA DEGISTIGINDE OKUYUCULARI DA GEZ", "TAZELEME METODOLOJI
DARALTMASI DEGILDIR" ✓

## BUNDAN SONRA
Yeni kayitlar dogrudan KTPANEL-BAKIM.md'nin BASINA yazilacak; ayri
BAKIM-EK dosyasi URETILMEYECEK. (Ben yine de teslimat kolayligi icin
"su blogu basa yapistir" seklinde metin verecegim — ama ayri dosya olarak
repoya girmeyecek.)
