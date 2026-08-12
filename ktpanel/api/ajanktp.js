// /api/ajan — Ajanın SUNUCU organları: bulut hafıza (KV) + sabah cron'u
// mod=oku  : KV'deki ajan hafızasını döndürür (tüm cihazlar aynı notları görür)
// mod=yaz  : client'ın hafıza blob'unu KV'ye yazar (localStorage'ın bulut ikizi)
// mod=cron : Vercel Cron (günde 1, sabah) — son bilinen panel bağlamından
//            GÜNDEM NOTU üretir; kullanıcı paneli açmadan not hazırdır.
// KV: Upstash Redis REST (env: UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN)
// KV env yoksa zarif düşüş: {ok:false,'kv-yok'} → client localStorage ile devam eder.
const KV_ANAHTAR = 'ktpanel_ajan_v1';

async function kvKomut(dizi){
  const URL = process.env.UPSTASH_REDIS_REST_URL, TOK = process.env.UPSTASH_REDIS_REST_TOKEN;
  if(!URL||!TOK) return { yok:true };
  try{
    const r = await fetch(URL, { method:'POST',
      headers:{ 'Authorization':'Bearer '+TOK, 'Content-Type':'application/json' },
      body: JSON.stringify(dizi), signal: AbortSignal.timeout(8000) });
    const j = await r.json();
    if (j && j.error) return { err: String(j.error).slice(0,120) };   // Upstash hatası
    if (!r.ok) return { err: 'HTTP '+r.status };
    return j;
  }catch(e){ return { err:String(e.message||e).slice(0,80) }; }
}

async function aiUret(prompt, maxTok){
  const KEY = process.env.ANTHROPIC_API_KEY;
  if(!KEY) return null;
  try{
    const r = await fetch('https://api.anthropic.com/v1/messages', { method:'POST',
      headers:{ 'x-api-key':KEY, 'anthropic-version':'2023-06-01', 'content-type':'application/json' },
      body: JSON.stringify({ model:'claude-haiku-4-5-20251001',
        /* §269 TAVAN 2500 -> 4000. Bilanço kartı istemi §257/§267/§268 ile
           zenginleşti (hazır gösterim, marj tuzağı, net kâr köprüsü, puan/bp,
           bilanço tabanı) ve model daha uzun yazmaya başladı. 12 Ağu RGYAS:
           JSON ORTADA KESİLDİ — son iki metrik "undefined", PORTFÖY TEZİ HİÇ
           YAZILMADI, ve model bütçeyi metriklerde harcayıp hazır gösterimi
           kullanmadı (ciro "4.608.603 bin ₺" diye ham yazıldı).
           Çağıran zaten 2600 istiyordu; min() onu 2500'e KIRPIYORDU. */
        max_tokens: Math.min(4000, maxTok||900),
        messages:[{ role:'user', content: prompt }] }),
      signal: AbortSignal.timeout(30000) });
    const d = await r.json();
    /* §269b KESİLME SESSİZ KALMASIN. stop_reason='max_tokens' ise JSON eksiktir
       ve ayrıştırma ya patlar ya da "undefined" alanlar üretir — ikisi de
       kullanıcıya YANLIŞ KART olarak görünür. Metnin sonuna işaret bırakılır;
       çağıran taraf bunu görüp kartı reddedebilir. */
    if (d && d.stop_reason === 'max_tokens') {
      const t = (d.content && d.content[0] && d.content[0].text) || '';
      return t ? (t + '\n/*__KESILDI__*/') : null;
    }
    return (d&&d.content&&d.content[0]&&d.content[0].text) ? d.content[0].text : null;
  }catch(e){ return null; }
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  const mod = req.query.mod;

  // ── OKU: bulut hafıza → client ──
  if(mod === 'oku'){
    const r = await kvKomut(['GET', KV_ANAHTAR]);
    if(r.yok) return res.status(200).json({ ok:false, err:'kv-yok' });
    if(r.err) return res.status(200).json({ ok:false, err:r.err });
    let blob = null;
    try{ blob = r.result ? JSON.parse(r.result) : null; }catch(e){}
    return res.status(200).json({ ok:!!blob, blob });
  }

  // ── YAZ: client hafızası → bulut ──
  if(mod === 'yaz'){
    if(req.method !== 'POST') return res.status(200).json({ ok:false, err:'POST gerekli' });
    let body = req.body;
    if(!body||typeof body==='string'){ try{ body=JSON.parse(body||'{}'); }catch(e){ body={}; } }
    if(!body.blob) return res.status(200).json({ ok:false, err:'blob yok' });
    const veri = JSON.stringify(body.blob);
    if(veri.length > 900000) return res.status(200).json({ ok:false, err:'blob çok büyük' });
    const r = await kvKomut(['SET', KV_ANAHTAR, veri]);
    if(r.yok) return res.status(200).json({ ok:false, err:'kv-yok' });
    if(r.err) return res.status(200).json({ ok:false, err:r.err });
    if(r.result!=='OK') return res.status(200).json({ ok:false, err:'SET beklenmedik yanıt: '+JSON.stringify(r).slice(0,100) });
    return res.status(200).json({ ok:true, boyut:veri.length });
  }

  // ── CRON: sabah üretimi (Vercel Cron çağırır) ──
  if(mod === 'cron'){
    // Güvenlik: Vercel cron isteği CRON_SECRET taşır (middleware muafiyeti de buna bağlı)
    const beklenen = process.env.CRON_SECRET;
    const gelen = (req.headers['authorization']||'');
    if(beklenen && gelen !== 'Bearer '+beklenen)
      return res.status(401).json({ ok:false, err:'cron yetkisiz' });
    const r = await kvKomut(['GET', KV_ANAHTAR]);
    if(r.yok||r.err||!r.result) return res.status(200).json({ ok:false, err:'hafıza yok — panel en az bir kez açılmalı' });
    let blob = {};
    try{ blob = JSON.parse(r.result); }catch(e){}
    const baglam = blob.__BAGLAM__ && blob.__BAGLAM__.metin;
    if(!baglam) return res.status(200).json({ ok:false, err:'bağlam yok' });
    const bugunTR = new Date().toLocaleDateString('tr-TR',{ day:'numeric', month:'long', weekday:'long' });
    const metin = await aiUret(
      'Sen KTPanel adlı katılım-finans portföy panelinin yerleşik ajanısın. Bugün '+bugunTR+', sabah brifingi yazıyorsun. '+
      'Aşağıda panelin SON BİLİNEN canlı verileri var (dünden). Multi-asset fon yöneticisi tonunda, Türkçe, 5-7 cümlelik '+
      'SABAH GÜNDEM NOTU yaz: günün en kritik 2-3 teması, veriler arası bağ, izlenecek olaylar, duruş cümlesi. '+
      'Rakamları verilerden al, uydurma; verilerin dünkü olduğunu bil, "dün itibarıyla" de. Doğrudan nota başla.\n\n'+baglam, 900);
    if(!metin) return res.status(200).json({ ok:false, err:'AI üretemedi' });
    blob.__GUNDEM__ = { html: metin.trim(), saat: 'sabah cron', ts: Date.now(), kaynak:'cron' };
    await kvKomut(['SET', KV_ANAHTAR, JSON.stringify(blob)]);
    return res.status(200).json({ ok:true, uretildi:true });
  }

  // ── TEST: KV sağlık kontrolü (küçük SET+GET, ham yanıtlar) ──
  /* §215 ?mod=bilanco — METRİKTEN KART TASLAĞI.
     Panel önce /api/kap?mod=kart ile metrikleri alır, sonra buraya POST eder.
     NEDEN SUNUCU SUNUCUYA ÇAĞIRMIYOR: §208'de ölçüldü — kendi sitesine HTTP
     isteği middleware'e takılıyor ve gecikme ekliyor. Tarayıcı iki ucu da
     çağırabiliyor, orkestrasyon orada.
     TASLAK ÜRETİR, KART YAYINLAMAZ. Skor vermez. Kullanıcı okur, düzeltir,
     onaylar. §204'te kararlaştırıldı: yazma emeği kalkar, yargı insanda kalır. */
  if (mod === 'bilanco') {
    if (req.method !== 'POST') return res.status(405).json({ ok:false, err:'POST gerekli' });
    let g = req.body;
    if (typeof g === 'string') { try{ g = JSON.parse(g); }catch(e){ g = null; } }
    if (!g || !g.metrikler) return res.status(400).json({ ok:false, err:'metrikler gerekli — /api/kap?mod=kart çıktısını gönder' });

    const kod   = String(g.kod || '?').toUpperCase().slice(0,8);
    const unvan = String(g.unvan || '').slice(0,80);
    const donem = String(g.donem || '').slice(0,20);
    const temel = String(g.temel || '').slice(0,40);
    /* §229b BİRİM MODELE SÖYLENİR. Önce istemde sabit "Birim: BİN TL" yazıyordu
       ve model onu tekrarlıyordu — BORSK'ta rakamlar bin kat büyük göründü.
       Birim artık RAPORDAN geliyor; belirsizse model bunu SÖYLEYECEK. */
    const birim = (g.birim && g.birim.ad) ? String(g.birim.ad) : 'belirsiz';
    /* §257 BİÇİMLENDİRME MODELDEN ALINDI.
       BULGU (10 Ağu, LMKDC): istemdeki ÖRNEK satır "deger":"100,02 mlr ₺"
       yazıyordu ve model bu EKİ KOPYALIYORDU — gerçek ölçeğe bakmadan.
       Sonuç: özet doğru ("2,32 milyar ₺"), tablo bin kat şişik
       ("2.317,8 mlr ₺"). Aynı kartın içinde iki farklı ölçek.
       ÇÖZÜM: ölçek KARARINI model vermez. Ham değer × çarpan ile TL'ye
       çevrilir, büyüklüğe göre mlr/mn/₺ SUNUCUDA seçilir, modele HAZIR
       DİZGİ verilir ve "aynen kullan" denir.
       Birim belirsizse dizgi üretilmez — model de o zaman ölçek yazmaz
       (§229: yanlış kesinlik yerine dürüst belirsizlik). */
    const _c = (g.birim && g.birim.carpan) || null;
    const _tr = (v, d) => Number(v).toLocaleString('tr-TR', {minimumFractionDigits:d, maximumFractionDigits:d});
    const _bicim = (ham) => {
      if(!_c || ham == null || !isFinite(ham)) return null;
      const tl = ham * _c, a = Math.abs(tl);
      if(a >= 1e9) return _tr(tl/1e9, 2) + ' mlr ₺';
      if(a >= 1e6) return _tr(tl/1e6, 1) + ' mn ₺';
      if(a >= 1e3) return _tr(tl/1e3, 0) + ' bin ₺';
      return _tr(tl, 0) + ' ₺';
    };
    /* Her metrik için hazır dizgi — modelin uyduracak yeri kalmasın */
    const _gost = {};
    try{
      const M = g.metrikler || {};
      for(const k of Object.keys(M)){
        const o = M[k]; if(!o || typeof o !== 'object') continue;
        const d = _bicim(o.deger);      if(d) _gost[k] = d;
        const t = _bicim(o.tutar);      if(t) _gost[k+'_tutar'] = t;
        const on = _bicim(o.onceki);    if(on) _gost[k+'_onceki'] = on;
      }
    }catch(e){}
    /* §267 GYO / YATIRIM ŞİRKETİ MARJ TUZAĞI.
       12 Ağu, RGYAS 2Ç26: model "faaliyet marjı %115'e düştü, sorunlu seviye"
       yazdı. Rakam DOĞRUYDU (5,31/4,61 = %115) ama OKUMA YANLIŞTI — faaliyet
       kârı ciroyu aşamaz; GYO'da aşar çünkü YATIRIM AMAÇLI GAYRİMENKUL
       DEĞERLEME KAZANCI "Diğer Faaliyet Gelirleri"nden faaliyet kârına girer,
       ciroya girmez. RGYAS'ta bu kalem 2,49 mlr ₺ (faaliyet kârının %47'si).
       2Ç25'te oran %237 idi; yani "marj düştü" değil DEĞERLEME KAZANCI KÜÇÜLDÜ.
       Panelde EKGYO/AVPGY/PAGYO/BEGYO/ASGYO... çok — tuzak TEKRARLAYACAK.
       ÇÖZÜM: modele "dikkat et" DEMEK yerine oranı SUNUCUDA ölç ve söyle.
       Bir kural, hesaplanmış bir olguyla birlikte verilirse tutar. */
    let _marjUyari = '';
    try{
      const _m = g.metrikler || {};
      const _ciro = _m.ciro && _m.ciro.deger;
      const _fk = _m.faaliyetKar && _m.faaliyetKar.deger;
      if (isFinite(_ciro) && _ciro > 0 && isFinite(_fk) && _fk > _ciro) {
        const _o = (_fk / _ciro * 100).toFixed(0);
        _marjUyari =
          '\n⚠ MARJ DİLİ KULLANMA — FAALİYET KÂRI CİROYU AŞIYOR (%' + _o + ').\n'
        + 'Bu bir MARJ DEĞİLDİR ve "marj %' + _o + '" diye yazmak YANLIŞ OKUMADIR.\n'
        + 'Sebep: GYO/holding/yatırım şirketlerinde YATIRIM AMAÇLI VARLIK DEĞERLEME\n'
        + 'KAZANCI ve iştirak payları "Diğer Faaliyet Gelirleri" üzerinden faaliyet\n'
        + 'kârına girer ama CİROYA GİRMEZ. Faaliyet kârının bir kısmı SATIŞTAN DEĞİL,\n'
        + 'DEĞERLEME/YENİDEN DEĞERLEMEDEN gelir — nakit değildir.\n'
        + 'BUNUN YERİNE: (a) faaliyet kârı ile brüt kâr ARASINDAKİ FARKI tutar olarak\n'
        + 'söyle, (b) bu farkın değerleme kaynaklı olabileceğini belirt, (c) oranın\n'
        + 'y/y DEĞİŞİMİNİ yorumla ("değerleme katkısı küçüldü/büyüdü"), (d) operasyonel\n'
        + 'performans için BRÜT MARJI kullan — o satışa dayanır.\n';
      }
      /* §267b NET KÂR DEĞİŞİMİNİN KAYNAĞI — HESAPLANIR, TAHMİN EDİLMEZ.
         RGYAS kartı "net kâr artışı parasal pozisyon kazancından kaynaklanıyor"
         dedi. ÖLÇÜLDÜ: finansman gideri -4,39 → -2,18 (+2,21 mlr katkı),
         parasal kazanç 1,15 → 1,78 (+0,63 mlr). Finansman ÜÇ KAT daha büyük
         etken; model sıralamayı TERS kurmuştu.
         Modelin bunu doğru sıralaması için katkıları ÖNCEDEN hesaplayıp
         veriyoruz — "hangisi büyük" sorusu yorum değil ARİTMETİKTİR. */
      const _kat = [];
      /* §267c ÖNCEKİ DEĞER: kap.js yalnız parasal/ozkaynak/nakit'te `onceki`
         gönderir; ciro, faaliyetKar, finansGider için sadece `yoy` yüzdesi
         var. Yüzdeden geri hesaplanır: onceki = deger / (1 + yoy/100).
         Bu bir TÜRETMEDİR — o yüzden köprü satırı "çeyreklik değişim" değil
         y/y değişimi olabilir; modele hangisi olduğu söyleniyor.
         yoy = -100 ise (sıfırdan çıkış) bölme tanımsız, atlanır. */
      const _onc = (o) => {
        if (!o) return null;
        if (isFinite(o.onceki)) return o.onceki;
        if (isFinite(o.deger) && isFinite(o.yoy) && Math.abs(100 + o.yoy) > 1e-9)
          return o.deger / (1 + o.yoy / 100);
        return null;
      };
      const _d = (o) => { const p = _onc(o); return (o && isFinite(o.deger) && p != null) ? (o.deger - p) : null; };
      for (const [ad, k] of [['finansman gideri','finansGider'], ['parasal pozisyon','parasal'],
                             ['faaliyet kârı','faaliyetKar'], ['brüt kâr','brutKar']]) {
        const v = _d(_m[k]);
        if (v != null && Math.abs(v) > 0) _kat.push([ad, v]);
      }
      /* §268 PUAN / BP AYRIMI — HESAPLANIR.
         12 Ağu RGYAS: model "faaliyet marjı y/y -122 bp düştü" yazdı. Gerçek
         fark 122 PUAN = 12.200 bp — YÜZ KAT hata. İlginç olan: aynı kart brüt
         marjda "+3 bp"yi DOĞRU kullandı. Yani birimi biliyor, büyük farkta
         kayıyor. Kural: |fark| >= 1 puan ise PUAN yaz, altındaysa bp.
         Modele kuralı SÖYLEMEK yetmez — eşiği burada ölçüp hazır dizgi veriyoruz. */
      const _mp = [];
      const _marjCift = (ad, o) => {
        if (!o || !isFinite(o.marj) || !isFinite(o.oncekiMarj)) return;
        const f = o.marj - o.oncekiMarj;
        const birim = Math.abs(f) >= 1 ? (Math.abs(f).toFixed(2).replace('.', ',') + ' puan')
                                       : (Math.round(Math.abs(f) * 100) + ' bp');
        _mp.push('  ' + ad + ': %' + _tr(o.oncekiMarj, 2) + ' → %' + _tr(o.marj, 2)
          + ' = ' + (f >= 0 ? '+' : '-') + birim);
      };
      _marjCift('brüt marj', _m.brutMarj);
      _marjCift('faaliyet marjı', _m.faaliyetKar);
      _marjCift('net marj', _m.netKar);
      /* §268b BİLANÇO KALEMLERİNİN TABANI FARKLIDIR.
         12 Ağu RGYAS: model "öz kaynaklar 163,93 mlr'ye yükseldi (+%4,6)" yazdı.
         Gerçek y/y +%15,2 (142,4 → 163,9). Model suçlu DEĞİL: KAP BİLANÇOSUNDA
         `onceki` = ÖNCEKİ DÖNEM SONU (yıl başı / geçen çeyrek), GELİR TABLOSUNDA
         ise GEÇEN YILIN AYNI ÇEYREĞİ. İki farklı taban, AYNI alan adı — istemde
         hangisinin ne olduğu SÖYLENMİYORDU.
         Karşılaştırma yüzdesini burada hesaplayıp TABANINI da yazıyoruz. */
      const _bl = [];
      for (const [ad, k] of [['özkaynak','ozkaynak'], ['nakit','nakit']]) {
        const o = _m[k];
        if (!o || !isFinite(o.deger) || !isFinite(o.onceki) || o.onceki === 0) continue;
        const y = ((o.deger / o.onceki - 1) * 100);
        _bl.push('  ' + ad + ': ' + (_bicim(o.onceki) || o.onceki) + ' → ' + (_bicim(o.deger) || o.deger)
          + ' = ' + (y >= 0 ? '+' : '') + _tr(y, 1) + '%');
      }
      if (_bl.length) {
        _marjUyari += '\nBİLANÇO KALEMLERİ (⚠ TABAN FARKLI — bu ÖNCEKİ DÖNEM SONUdur, '
          + 'GEÇEN YILIN AYNI ÇEYREĞİ DEĞİL):\n' + _bl.join('\n') + '\n'
          + '  Bu yüzdeleri "y/y" DİYE SUNMA. "dönem içinde" ya da "önceki bilanço dönemine göre" de.\n'
          + '  Gelir tablosu kalemlerindeki y/y ile KARIŞTIRMA — onlar geçen yılın aynı çeyreğidir.\n';
      }
      if (_mp.length) {
        _marjUyari += '\nMARJ DEĞİŞİMLERİ (birim ZATEN SEÇİLDİ — AYNEN kullan, bp/puan ÇEVİRME):\n'
          + _mp.join('\n') + '\n'
          + '  KURAL: 1 puan = 100 bp. |fark| >= 1 puan ise PUAN yazılır, altındaysa bp.\n';
      }
      if (_kat.length > 1) {
        _kat.sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
        _marjUyari += '\nNET KÂR KÖPRÜSÜ (y/y = GEÇEN YILIN AYNI ÇEYREĞİNE göre, '
          + 'BÜYÜKTEN KÜÇÜĞE — hangisinin baskın olduğunu BU SIRAYA göre söyle, tahmin etme):\n'
          + _kat.map(x => '  ' + x[0] + ': ' + (x[1] >= 0 ? '+' : '') + (_bicim(x[1]) || x[1].toFixed(0))).join('\n') + '\n';
      }
    }catch(e){}
    const _gostMetin = Object.keys(_gost).length
      ? ('\n\nHAZIR GÖSTERİM (deger alanında BUNLARI AYNEN KULLAN — ölçek eki EKLEME, DEĞİŞTİRME):\n'
         + Object.keys(_gost).map(k => '  '+k+' = '+_gost[k]).join('\n')
         + '\n⚠ Bu listede olmayan bir kalem için ölçek eki (mlr/mn) YAZMA — yalnız ham sayıyı yaz.')
      : '\n\n⚠ BİRİM ÇÖZÜLEMEDİ: hiçbir tutara ölçek eki (mlr/mn/₺) YAZMA. Ham sayıyı yaz ve özette birimin belirsiz olduğunu SÖYLE.';

    /* İSTEM — bugün elle yazılan kartlardan türedi. Her kural bir VAKAYA
       dayanıyor; soyut "iyi analiz yap" demiyor, NEYE BAKILACAĞINI söylüyor. */
    /* §221 İSTEM ARTIK KART YAPISI ÜRETİYOR — serbest metin değil.
       Önceki sürüm ÖZET/DİKKAT/İZLENECEK biçiminde düz metin veriyordu ve
       panelin kart yapısına uymuyordu: kod·ad·donem·skor·ozet·metrikler[]·
       onemli[]·guidance·tez.
       JSON isteniyor ki onaylanınca DOĞRUDAN karta dönüşebilsin.
       SKOR yine YOK — model skor vermiyor, kullanıcı onaylarken giriyor. */
    const istem =
`Sen bir katılım finans fon yöneticisinin analistisin. Aşağıdaki bilanço metriklerinden panelin KART YAPISINDA bir taslak üret.

ŞİRKET: ${kod}${unvan ? ' — '+unvan : ''}
DÖNEM: ${donem}
TEMEL: ${temel}
BİRİM: ${birim}${birim==='belirsiz' ? ' — RAPORDA BELİRTİLMEMİŞ. Tutarları yazarken birim belirsizliğini ÖZET içinde SÖYLE, uydurma.' : ' (raporun kendi beyanı)'}. Marjlar yüzde. y/y = geçen yılın aynı çeyreği.

METRİKLER:
${JSON.stringify(g.metrikler, null, 1)}

${_gostMetin}

${_marjUyari}OTOMATİK İŞARETLER (bakılacak yerler):
${(g.isaretler||[]).map(x=>'- '+x.tip+': '+x.not).join('\n') || '- yok'}

YALNIZCA GEÇERLİ JSON DÖNDÜR. Başka hiçbir şey yazma, markdown kod bloğu kullanma.

{
 "ozet": "3-5 cümle. Manşet ne diyor, ALTINDA ne var. Rakamları binlik ayraçla yaz.",
 "metrikler": [
   {"ad":"Ciro (2Ç)","deger":"<HAZIR GÖSTERİM listesinden ciro değeri>","cc":"çeyreklik değişim ya da bağlam","yoy":"+%9,0 (2Ç25: <önceki>)"}
 ],
 "onemli": ["BAŞLIK BÜYÜK HARF: açıklama. Neden önemli olduğu.", "...", "..."],
 "guidance": "Şirket guidance veriyorsa özeti; vermiyorsa İZLENECEK EŞİKLER — gelecek çeyrekte hangi rakama bakılmalı.",
 "tez": "Bu şirket panelin hangi kapsamında? Portföyde mi, endekste mi, yalnız izlemede mi? Panel açısından anlamı ne?"
}

METRİKLER dizisi 4-6 kalem olsun. Her biri: ad · deger (birimle) · cc (çeyreklik/bağlam) · yoy (yıllık değişim).
ONEMLI dizisi 3 madde olsun. Her madde BÜYÜK HARF başlıkla başlasın.

NASIL YAZACAKSIN:

1) MANŞETE DEĞİL ALTINA BAK.
   - Net kâr artarken faaliyet kârı düşüyorsa, farkı finansman gideri ya da parasal pozisyon taşıyordur. Operasyonel iyileşme DEĞİLDİR, açıkça söyle.
   - Faaliyet kârı artarken FAVÖK düşüyorsa sebep amortismandır; muhasebesel, operasyonel değil.
   - Bankada karşılık çeyreklik sıçrarken yıllık azalmış olabilir. İKİSİNİ AYRI söyle.

2) BÜYÜK YÜZDELERE DİKKAT. %200 artış çoğu zaman düşük bazdan gelir. Mutlak tutarı da yaz.

3) MARJ KATMANLARINI YAN YANA OKU: brüt → faaliyet → net. Hangi katmanda kayıp olduğu sorunun NEREDE olduğunu söyler.

4) EKSİK VERİYİ DOLDURMA. Bir kalem yoksa "açıklanmadı" yaz, tahmin etme. Eksik kalem varsa ozet içinde belirt.

5) SKOR VERME. "Al", "sat", "cazip", "ucuz" gibi kelimeler kullanma. Tavsiye değil TESPİT yaz.

Türkçe yaz. Kısa cümle kur.`;

    /* §223b TOKEN SINIRI. 1400 yetmedi — JSON "position 1510"da kesildi ve
       ayrıştırma patladı. Kart yapısı (ozet + 6 metrik + 3 madde + guidance +
       tez) rahat 2000 token istiyor. 2600 verildi, tampon bırakıldı.
       Kesilme SESSİZ bir hataydı: model doğru yazıyordu, biz yeterli yer
       vermiyorduk. */
    /* §269: 2600 -> 3600. §223b'de 2600 verilmişti ama aiUret'teki
       min(2500, ...) onu SESSİZCE 2500'e KIRPIYORDU — iki kat sessiz hata.
       Tavan 4000'e çıkarıldı, istem §257/§267/§268 ile zenginleştiği için
       3600 isteniyor. */
    const metin = await aiUret(istem, 3600);
    if (!metin) return res.status(200).json({ ok:false, kod,
      err:'AI yanıt vermedi — ANTHROPIC_API_KEY tanımlı mı?' });
    /* §269b KESİLDİYSE KART ÜRETME. Eksik JSON "undefined" alanlar ve tezsiz
       kart demektir; kullanıcı bunu YANLIŞ KART olarak görür. 12 Ağu RGYAS
       tam böyle çıktı. Sessizce yarım kart vermektense açıkça reddet. */
    if (String(metin).includes('__KESILDI__')) {
      return res.status(200).json({ ok:false, kod, kesildi:true,
        err:'yanıt token sınırında kesildi — kart eksik olurdu, üretilmedi',
        oneri:'tekrar dene; sürerse ajanktp.js maxTok değeri artırılmalı',
        uzunluk:String(metin).length });
    }

    /* JSON AYRIŞTIRMA. Model bazen kod bloğuyla sarar ya da önüne yazı ekler;
       ilk { ile son } arası alınır. Ayrışmazsa HAM METİN döndürülür ve
       kullanıcıya söylenir — sessizce boş kart üretmek en kötüsü olurdu. */
    let kart = null, ayrHata = null, onarildi = false;
    const coz = (t) => { const b=t.indexOf('{'), so=t.lastIndexOf('}'); return JSON.parse(t.slice(b, so+1)); };
    const ham = metin.replace(/```json|```/g,'').trim();
    try{ kart = coz(ham); }
    catch(e){
      ayrHata = String(e.message||e).slice(0,90);
      /* ONARIM DENEMESİ: yanıt kesilmişse son tamamlanmamış öğeyi atıp
         açık parantezleri kapat. Yarım kart, hiç karttan iyidir — AMA
         onarıldığı SÖYLENİR, kullanıcı eksik olabileceğini bilsin. */
      try{
        let t = ham.slice(ham.indexOf('{'));
        /* Kesilme üç yerde olabilir; hepsi ayrı ayrı temizlenir.
           TEST EDİLDİ: dördü de doğru sonuç veriyor, TAM JSON bozulmuyor. */
        t = t.replace(/,\s*\{[^{}]*$/,'')            // yarım kalmış son NESNE (dizi içinde)
             .replace(/,\s*"[^"]*"\s*:\s*[^,}\]]*$/,'')  // yarım kalmış son ÖZELLİK
             .replace(/,\s*"[^"]*$/,'')                // yarım kalmış son DİZİ ELEMANI
             .replace(/,\s*$/,'');                     // sondaki virgül
        const ac = (t.match(/\{/g)||[]).length, kap = (t.match(/\}/g)||[]).length;
        const dac = (t.match(/\[/g)||[]).length, dkap = (t.match(/\]/g)||[]).length;
        t += ']'.repeat(Math.max(0,dac-dkap)) + '}'.repeat(Math.max(0,ac-kap));
        kart = JSON.parse(t); onarildi = true;
      }catch(e2){}
    }

    if(!kart) return res.status(200).json({ ok:false, kod, donem,
      err:'model JSON üretmedi ('+ayrHata+')', ham:metin.slice(0,900) });

    /* Kart iskeletini TAMAMLA — panel yapısına birebir uysun. Skor BİLEREK
       null: kullanıcı onaylarken girecek (§204). */
    /* §237b KART TARİHİ = BİLDİRİM TARİHİ, bugün değil.
       Önce bugünün tarihi yazılıyordu; kart listede yanlış yere oturuyordu
       (BORSK 30 Tem'de açıkladı ama 31 Tem yazıldığı için GARAN'ın üstüne
       çıktı). Sıralama tarih_iso'ya göre — bildirim tarihi doğru olan.
       Üretim zamanı ayrıca `_uretim` alanında duruyor, kaybolmuyor. */
    const bugun = new Date();
    const AY = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
    const tIso = /^\d{4}-\d{2}-\d{2}$/.test(String(g.tarihIso||'')) ? String(g.tarihIso) : bugun.toISOString().slice(0,10);
    const tD = new Date(tIso+'T00:00:00Z');
    const tam = {
      kod, ad: unvan || kod,
      donem: donem || '',
      tarih: tD.getUTCDate()+' '+AY[tD.getUTCMonth()]+' '+tD.getUTCFullYear(),
      tarih_iso: tIso,
      sablon: 'bist',
      skor: null,                                   // ONAYDA girilecek
      ozet: String(kart.ozet||''),
      /* §269c "undefined" DİZGESİ TEMİZLENİR. 12 Ağu RGYAS: model metrik
         değerine LİTERAL "undefined" yazdı (JS'ten sızmış bir kalıntı) ve
         kartta öyle göründü. esc(m.deger||'') bunu yakalamaz — dolu bir
         dizgedir. Eksik değeri "—" ile göstermek, "undefined" göstermekten
         hem dürüst hem okunur. Hangi alanların boş kaldığı da raporlanır. */
      metrikler: (Array.isArray(kart.metrikler) ? kart.metrikler.slice(0,8) : []).map(m => {
        const tmz = (v) => {
          const t = String(v == null ? '' : v).trim();
          return (!t || t === 'undefined' || t === 'null' || t === 'NaN') ? '—' : t;
        };
        return { ...m, ad: String(m && m.ad || ''), deger: tmz(m && m.deger),
                 cc: tmz(m && m.cc), yoy: tmz(m && m.yoy) };
      }),
      onemli: Array.isArray(kart.onemli) ? kart.onemli.slice(0,5) : [],
      guidance: String(kart.guidance||''),
      tez: String(kart.tez||''),
      _taslak: true, _kaynak: 'KAP + Claude taslağı', _uretim: bugun.toISOString()
    };
    /* §269c eksik alan SAYISI raporlanır — kullanıcı kartın ne kadar tam
       olduğunu görsün, sessizce "—" dolu bir kart onaylamasın. */
    const _eksik = (tam.metrikler || []).filter(m => m.deger === '—').length;
    return res.status(200).json({ ok:true, kod, donem, kart:tam, onarildi,
      eksikMetrik: _eksik || undefined,
      uyari:'TASLAK. Skor YOK — onaylarken sen gireceksin. Okunmadan yayınlanmamalı.'+
        (onarildi ? ' ⚠ Model yanıtı KESİLDİ, JSON onarıldı — son alanlar eksik olabilir.' : '') });
  }

  if(mod === 'test'){
    const urlVar = !!process.env.UPSTASH_REDIS_REST_URL, tokVar = !!process.env.UPSTASH_REDIS_REST_TOKEN;
    const setR = await kvKomut(['SET','ktpanel_ping','pong-'+Date.now()]);
    const getR = await kvKomut(['GET','ktpanel_ping']);
    const anaR = await kvKomut(['STRLEN', KV_ANAHTAR]);
    return res.status(200).json({ ok:!(setR.err||getR.err),
      env:{ url:urlVar, token:tokVar }, set:setR, get:getR, anaBlobUzunluk:anaR });
  }
  return res.status(200).json({ ok:false, err:'mod gerekli: oku|yaz|cron|test' });
};
