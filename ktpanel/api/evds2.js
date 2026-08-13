// TCMB EVDS3 köprüsü — canlı fonlama/faiz serileri
// Yeni EVDS3 API: https://evds3.tcmb.gov.tr/igmevdsms-dis/ (eski /service/evds kaldırıldı)
// Anahtar: Vercel env var EVDS_KEY (veya ?key= test için) — header'da gönderilir
// Kullanım: /api/evds2?series=TP.APIFON4 · çoklu: series=A,B · teşhis: &debug=1
// NOT: Vercel Hobby planı 12 fonksiyonla sınırlı. Faiz/veri uçları buradan yönlendirilir:
//   ?mod=tlref → api/_lib/tlref.js   ·   ?mod=egri → api/_lib/egri.js
//   ?mod=kart  → api/_lib/kart.js    (kredi kartı harcamaları, sektörel)
// (_ ile başlayan klasörler Vercel'de ayrı serverless fonksiyon sayılmaz.)
const _tlref = require('./_lib/tlref.js');
const _egri  = require('./_lib/egri.js');
const _kart  = require('./_lib/kart.js');



// ═══ Genel kendini-çözen çekici: grup adı regex + hedef seri regex'leri → son 2 gözlem ═══
async function cozCek(key, grupRx, hedefler, gunGeri){
  const H = { 'key': key, 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' };
  const getJ = async (url)=>{ try{
      const r=await fetch(url,{headers:H,signal:AbortSignal.timeout(20000)});
      const t=await r.text();
      if(t.trim().startsWith('[')||t.trim().startsWith('{')) return JSON.parse(t);
      return null; }catch(e){ return null; } };
  const gruplar = await getJ('https://evds3.tcmb.gov.tr/igmevdsms-dis/datagroups/mode=0&type=json');
  if(!Array.isArray(gruplar)) return { ok:false, err:'datagroups alınamadı' };
  const g = gruplar.find(x=>grupRx.test(String(x.DATAGROUP_NAME||'')));
  if(!g) return { ok:false, err:'grup bulunamadı: '+grupRx };
  const seriler = await getJ('https://evds3.tcmb.gov.tr/igmevdsms-dis/serieList/code='+encodeURIComponent(g.DATAGROUP_CODE)+'&type=json');
  if(!Array.isArray(seriler)) return { ok:false, err:'serieList alınamadı', grup:g.DATAGROUP_CODE };
  const kodlar={}, adlar={};
  for(const h of hedefler){
    const bulunan=seriler.find(x=>h.rx.test(String(x.SERIE_NAME||'')));
    if(bulunan){ kodlar[h.ad]=bulunan.SERIE_CODE; adlar[h.ad]=bulunan.SERIE_NAME; }
  }
  const liste=Object.values(kodlar);
  if(!liste.length) return { ok:false, err:'hedef seri yok', grup:g.DATAGROUP_CODE,
    ornekler:seriler.slice(0,12).map(x=>x.SERIE_NAME) };
  const bit=new Date(), bas=new Date(bit.getTime()-gunGeri*86400000);
  const f=(d)=>String(d.getDate()).padStart(2,'0')+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+d.getFullYear();
  const veri=await getJ('https://evds3.tcmb.gov.tr/igmevdsms-dis/series='+liste.join('-')+
    '&startDate='+f(bas)+'&endDate='+f(bit)+'&type=json');
  const items=(veri&&veri.items)||[];
  const cikti={};
  for(const ad in kodlar){
    const al=kodlar[ad].replace(/[.\-]/g,'_');
    const dolu=items.filter(x=>x[al]!=null&&x[al]!=='');
    if(!dolu.length){ cikti[ad]=null; continue; }
    const so=dolu[dolu.length-1], on=dolu.length>1?dolu[dolu.length-2]:null;
    cikti[ad]={ deger:parseFloat(so[al]), tarih:so.Tarih||so.TARIH||'',
      fark:on?+(parseFloat(so[al])-parseFloat(on[al])).toFixed(1):null, seriAd:adlar[ad],
      /* §245r: ham 90 günlük seri ZATEN çekiliyordu, yalnız son iki gözlem
         dışarı veriliyordu — gerisi atılıyordu. Artık isteyen mod tüm
         gözlemleri alır (tarih+değer çiftleri). Elle tutulan hafta_seri'nin
         yerini bu alacak: veri kaynaktan gelirken damgalı kopyası tutulmaz. */
      seri: dolu.map(x=>({ t:x.Tarih||x.TARIH||'', v:parseFloat(x[al]) })) };
  }
  return { ok:true, grup:g.DATAGROUP_CODE, veri:cikti };
}

// ═══ yab modu — Yabancıların menkul kıymet portföyü (haftalık stok+değişim) ═══
/* §259 YABANCI AKIŞI — REGEX TAHMİNİ YERİNE KESİN SERİ KODLARI.
   ÖNCEKİ HAL SESSİZCE BOŞ DÖNÜYORDU: cozCek'e verilen grup deseni
   /yurt dışı yerleşiklerin.../ idi ama CANLI grubun adı "Yurt Dışı
   Yerleşikler Menkul Kıymet Portföyü" — İYELİK EKİ YOK. Desen yalnız ARŞİV
   grubuna (bie_yymkpyuk) uydu ve alt-desenler orada tutmadı:
     {"ok":true,"grup":"bie_yymkpyuk","veri":{hisseNet:null,dibsNet:null,...}}
   `ok:true` DÖNÜYORDU — başarı gibi görünen boş yanıt. Panel de elle
   girilen yabanci.json'a düşüyordu ve o 24 GÜN ESKİYDİ.
   10 Agu ÖLÇÜMÜ: panel 17 Tem haftasını gösteriyordu (+278 mn net GİRİŞ);
   EVDS'de 24 Tem ve 31 TEM DE VARDI ve 31 Tem NET ÇIKIŞ (-152 mn):
   hisse -185,9 · ÖST -129,9 — İŞARET DÖNMÜŞ. Panelin "ılımlı giriş" anlatısı
   yalnız eski değil TERS olmuştu.
   SERİ KODLARI kullanıcının 10 Agu list ölçümünden (bie_mknethar, 32 seri):
     M7  = 2.1.1. Hisse Senedi              (net değişim, haftalık, mn $)
     M8  = 2.1.2. DİBS (Kesin Alım)         (net değişim)
     M12 = 2.1.3. Genel Yönetim Dışı Borçlanma Senetleri = ÖST
     M1/M2/M6 = aynıların STOK karşılıkları
   Kod TAHMİN EDİLMEZ, ÖLÇÜLÜR — regex grup adına bağlıydı ve tek harf
   (yerleşikler/yerleşiklerin) yüzünden aylardır çalışmıyordu. */
/* §275 ECB VERİ PORTALI — AÇIK API, ANAHTAR YOK.
   12 Ağu ölçümü: data-api.ecb.europa.eu tarayıcıdan DOĞRUDAN açıldı (CORS izni
   var) ve DFR=2,25 döndü. Dosyadaki eski not "ECB ağı kapalıyken OECD serisi"
   diyordu — o durum artık geçerli değil, en azından bu uç için.
   Panelde ECB kartları ELLE giriliyordu (HICP %2,9/%2,5/%10,0 · DFR %2,25) ve
   damgalıydı. Artık kaynaktan gelir, tarih de veriden.
   YENİ UÇ AÇILMADI (§248c): evds2'ye mod=ecb olarak bindirildi.
   BİÇİM SDMX-JSON: değer  dataSets[0].series[<anahtar>].observations[i][0]
                    tarih  structure.dimensions.observation[0].values[i].id */
const ECB_SERI = {
  dfr: ['FM/D.U2.EUR.4F.KR.DFR.LEV', 'Mevduat faizi (DFR)'],
  mro: ['FM/D.U2.EUR.4F.KR.MRR_FR.LEV', 'Ana refinansman faizi (MRO)'],
  /* §275e HICP GERİ GELDİ — DOĞRU AKIŞ VE ANAHTAR BULUNDU (13 Ağu).
     ICP akışı 4 Şub 2026'da EMEKLİ EDİLDİ (ECB'nin kendi OBS_COM notu:
     "the ECB will also discontinue the current ICP dataset and replace it
     with a new HICP dataset"). Veri 2025-12'de duruyordu.
     YENİ AKIŞ: HICP. Ama BOYUT YAPISI FARKLI — bu yüzden eski kalıp 404 verdi:
       ICP  : FREQ.REF_AREA.ADJUSTMENT.ICP_ITEM.STS_INSTITUTION.ICP_SUFFIX
       HICP : FREQ.REF_AREA.ADJUSTMENT.ICP_ITEM.DATA_PROVIDER.ICP_SUFFIX
     5. boyut '4' (Eurostat) yerine '4D0'.
     ANAHTARLAR TAHMİN EDİLMEDİ: akışın 90.068 serisi ?detail=serieskeysonly
     ile çekilip euro bölgesi (U2), aylık (M), arındırılmamış (N), yıllık
     değişim (ANR) süzgeciyle bulundu. Üç kez tahmin edip yanıldıktan sonra
     KATALOĞA SORULDU — doğru yol buydu. */
  hicp:         ['HICP/M.U2.N.000000.4D0.ANR', 'HICP manşet (yıllık)'],
  hicpCekirdek: ['HICP/M.U2.N.XEF000.4D0.ANR', 'HICP çekirdek (enerji+gıda hariç)'],
  hicpEnerji:   ['HICP/M.U2.N.NRGY00.4D0.ANR', 'HICP enerji']
  /* §275d (13 Ağu ÇÖZÜLDÜ, bkz §275e): HICP'ler ICP akışı emekli olduğu
     için 8 ay bayattı ve geçici olarak çıkarılmıştı. Yeni akış bulundu. */
};
async function ecbModu(req, res){
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=10800, stale-while-revalidate=43200');
  const n = Math.min(24, Math.max(1, parseInt(req.query.n) || 2));
  /* SDMX-JSON'dan [tarih, değer] çiftleri. Yapı derin ve tek bir alan eksikse
     sessizce çöker — her adım korumalı. */
  const coz = (j) => {
    try{
      const ds = j && j.dataSets && j.dataSets[0];
      const seri = ds && ds.series && Object.values(ds.series)[0];
      const obs = seri && seri.observations;
      const zaman = j.structure && j.structure.dimensions
        && (j.structure.dimensions.observation || []).find(d => d.id === 'TIME_PERIOD');
      if(!obs || !zaman) return null;
      const cikti = [];
      for(const k of Object.keys(obs)){
        const v = obs[k] && obs[k][0];
        const t = zaman.values[+k] && (zaman.values[+k].id || zaman.values[+k].name);
        if(t != null && isFinite(v)) cikti.push([String(t), +v]);
      }
      return cikti.sort((a,b) => a[0] < b[0] ? -1 : 1);
    }catch(e){ return null; }
  };
  const sonuc = {}; const hata = [];
  /* §275b PARALEL -> SIRALI. 12 Ağu ölçümü: dört eşzamanlı istekte dfr ve
     hicpCekirdek HTTP 504 verdi, oysa ikisi de tarayıcıdan TEK TEK çalışıyor.
     ECB portalı eşzamanlı isteklerde yavaşlıyor. Sıralı çekim + 20 sn ile
     dördü de geçiyor; toplam süre yine Vercel bütçesinin altında. */
  for(const ad of Object.keys(ECB_SERI)){
    const [yol, aciklama] = ECB_SERI[ad];
    try{
      const u = 'https://data-api.ecb.europa.eu/service/data/' + yol
        + '?lastNObservations=' + n + '&format=jsondata';
      const r = await fetch(u, { headers:{ 'Accept':'application/json' }, signal: AbortSignal.timeout(20000) });
      if(!r.ok){ hata.push(ad + ':HTTP' + r.status); return; }
      const seri = coz(await r.json());
      if(!seri || !seri.length){ hata.push(ad + ':boş'); return; }
      const son = seri[seri.length-1], onc = seri.length > 1 ? seri[seri.length-2] : null;
      sonuc[ad] = { ad:aciklama, deger:son[1], tarih:son[0],
        onceki: onc ? onc[1] : null,
        /* ivme = son − önceki. HICP'de bu "hızlanıyor mu" demektir; DFR'de
           "son adım" büyüklüğü. İkisi de anlamlı, ikisi de HESAPLANIR. */
        fark: onc ? +(son[1] - onc[1]).toFixed(2) : null,
        seri: seri.slice(-12) };
    }catch(e){ hata.push(ad + ':' + String(e.message||e).slice(0,40)); }
  }
  if(!Object.keys(sonuc).length)
    return res.status(200).json({ ok:false, err:'ECB yanıt vermedi', hata });
  /* §275c YAŞ KONTROLÜ. 12 Ağu: ICP/M.U2.N.000000.4.ANR serisi 2025-12'de
     KALMIŞ (8 ay eski) ama uç ok:true dönüyordu — panel bunu canlı sanardı.
     Aylık seri 90 günden eskiyse İŞARETLENİR; sessiz bayatlık en kötüsü. */
  try{
    const bugun = new Date();
    for(const k of Object.keys(sonuc)){
      const t = String(sonuc[k].tarih || '');
      const d = new Date(t.length === 7 ? (t + '-01') : t);
      if(isNaN(d)) continue;
      const gun = Math.floor((bugun - d) / 86400000);
      sonuc[k].yasGun = gun;
      if(gun > 90) sonuc[k].bayat = true;
    }
  }catch(e){}
  const _bayat = Object.keys(sonuc).filter(k => sonuc[k].bayat);
  return res.status(200).json({ ok:true, kaynak:'ECB Data Portal (data-api.ecb.europa.eu · açık API)',
    veri:sonuc, eksik: hata.length ? hata : undefined,
    bayatSeri: _bayat.length ? _bayat : undefined,
    not:'Anahtar gerekmez. Damgalı ECB kartlarının yerini alır (§275).' });
}
async function yabModu(req, res, cfg){
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=43200');
  if(!(cfg&&cfg.key)) return res.status(200).json({ ok:false, err:'EVDS_KEY yok' });
  const SERI = {
    hisseNet:'TP.MKNETHAR.M7', dibsNet:'TP.MKNETHAR.M8', ostNet:'TP.MKNETHAR.M12',
    hisseStok:'TP.MKNETHAR.M1', dibsStok:'TP.MKNETHAR.M2', ostStok:'TP.MKNETHAR.M6'
  };
  const hafta = Math.min(52, Math.max(3, parseInt(req.query.hafta) || 8));
  try{
    /* §259b UÇ ADRESİ DÜZELTİLDİ. İlk yazımda evds2.tcmb.gov.tr/service/evds/
       kullanmıştım — o ESKİ uç ve HTML döndürüyor ("Unexpected token '<'").
       Dosyanın GERİ KALANI evds3.tcmb.gov.tr/igmevdsms-dis/ kullanıyor ve
       çalışıyor. Kendi URL'mi yazmak yerine ÇALIŞAN KALIBI kullanmalıydım —
       aynı dosyada kanıtı duruyordu. İki denemeli, HTML gelirse null. */
    const H = { 'key': cfg.key, 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' };
    const gg = d => String(d.getDate()).padStart(2,'0')+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+d.getFullYear();
    const bit = new Date(), bas = new Date(bit.getTime() - (hafta+4)*7*86400000);
    const url = 'https://evds3.tcmb.gov.tr/igmevdsms-dis/series=' + Object.values(SERI).join('-')
      + '&startDate=' + gg(bas) + '&endDate=' + gg(bit) + '&type=json';
    let ham = null;
    for(const ms of [12000, 22000]){
      try{
        const r = await fetch(url, { headers:H, signal: AbortSignal.timeout(ms) });
        const t = await r.text();
        if(t.trim().startsWith('{') || t.trim().startsWith('[')){ const j = JSON.parse(t); ham = j.items || []; break; }
      }catch(e){}
    }
    if(!Array.isArray(ham)) return res.status(200).json({ ok:false, err:'EVDS yanıt vermedi ya da JSON değil' });
    const say = v => { const x = parseFloat(String(v).replace(',','.')); return isFinite(x) ? x : null; };
    const sut = k => SERI[k].replace(/\./g,'_');
    /* Yalnız net-değişim serisi DOLU olan haftalar — EVDS boş satır da döndürür */
    const seri = ham.map(x => ({
        tarih: String(x.Tarih||''),
        hisse: say(x[sut('hisseNet')]), dibs: say(x[sut('dibsNet')]), ost: say(x[sut('ostNet')]),
        hisseStok: say(x[sut('hisseStok')]), dibsStok: say(x[sut('dibsStok')]), ostStok: say(x[sut('ostStok')])
      }))
      .filter(x => x.hisse!=null || x.dibs!=null || x.ost!=null)
      .slice(-hafta);
    if(!seri.length) return res.status(200).json({ ok:false, err:'boş seri', hamAdet:ham.length });
    const son = seri[seri.length-1];
    const t = (o) => (o.hisse||0)+(o.dibs||0)+(o.ost||0);
    const sonTop = +t(son).toFixed(1);
    /* YÖN HESAPLANIR, İDDİA EDİLMEZ — "ılımlı giriş" metni elle yazılıyordu ve
       son hafta net ÇIKIŞ olduğu halde "giriş" diyordu. */
    const yon = sonTop > 200 ? 'güçlü giriş' : sonTop > 0 ? 'ılımlı giriş'
              : sonTop > -200 ? 'ılımlı çıkış' : 'güçlü çıkış';
    const kum4 = +seri.slice(-4).reduce((a,x)=>a+t(x),0).toFixed(1);
    return res.status(200).json({
      ok:true, kaynak:'TCMB EVDS · bie_mknethar (haftalık, mn $)',
      sonHafta: son.tarih, hisse: son.hisse, dibs: son.dibs, ost: son.ost,
      toplam: sonTop, yon, kumulatif4h: kum4,
      stok: { hisse: son.hisseStok, dibs: son.dibsStok, ost: son.ostStok },
      seri,
      not: 'net degisim = o haftaki NET alim/satim. Yon HESAPLANIR (esik ±200 mn $), elle yazilmaz. §259'
    });
  }catch(e){ return res.status(200).json({ ok:false, err:String(e.message||e).slice(0,120) }); }
}

// ═══ kko modu — İmalat sanayi Kapasite Kullanım Oranı + mal grupları (aylık) ═══
async function kkoModu(req, res, cfg){
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=43200, stale-while-revalidate=86400');
  if(!(cfg&&cfg.key)) return res.status(200).json({ ok:false, err:'EVDS_KEY yok' });
  try{
    const r = await cozCek(cfg.key, /kapasite kullanım/i, [
      { ad:'genel',    rx:/imalat sanayi.*genel|genel.*imalat|^toplam|^imalat sanayi$/i },
      { ad:'tuketim',  rx:/tüketim mal/i },
      { ad:'ara',      rx:/ara mal|girdi mal/i },
      { ad:'yatirim',  rx:/yatırım mal/i },
      { ad:'dayanikli',rx:/dayanıklı tüketim/i },
      { ad:'gida',     rx:/gıda/i }
    ], 200);
    return res.status(200).json(r);
  }catch(e){ return res.status(200).json({ ok:false, err:String(e.message||e).slice(0,120) }); }
}

// ═══ dvz modu — Reel sektör (finansal kesim dışı firmalar) döviz pozisyonu ═══
// Seri kodu sabitlenmemiş: EVDS'in kendi kataloğundan KENDİNİ ÇÖZER
// (datagroups araması → serieList → adı eşleşen serilerin verisi). Aylık veri → 24h cache.
async function dvzModu(req, res, cfg){
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=172800');
  const key = cfg && cfg.key;
  if(!key) return res.status(200).json({ ok:false, err:'EVDS_KEY yok' });
  const H = { 'key': key, 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' };
  const getJ = async (url)=>{ try{
      const r=await fetch(url,{headers:H,signal:AbortSignal.timeout(20000)});
      const t=await r.text();
      if(t.trim().startsWith('[')||t.trim().startsWith('{')) return JSON.parse(t);
      return null;
    }catch(e){ return null; } };
  try{
    // 1) Grup kodunu bul
    const gruplar = await getJ('https://evds3.tcmb.gov.tr/igmevdsms-dis/datagroups/mode=0&type=json');
    if(!Array.isArray(gruplar)) return res.status(200).json({ ok:false, err:'datagroups alınamadı' });
    const g = gruplar.find(x=>/finansal kesim d/i.test(String(x.DATAGROUP_NAME||'')));
    if(!g) return res.status(200).json({ ok:false, err:'grup bulunamadı (Finansal Kesim Dışı)' });
    const gk = g.DATAGROUP_CODE;
    // 2) Seri listesinden hedefleri bul
    const seriler = await getJ('https://evds3.tcmb.gov.tr/igmevdsms-dis/serieList/code='+encodeURIComponent(gk)+'&type=json');
    if(!Array.isArray(seriler)) return res.status(200).json({ ok:false, err:'serieList alınamadı', grup:gk });
    const bul=(rx)=>{ const s=seriler.find(x=>rx.test(String(x.SERIE_NAME||''))); return s?s.SERIE_CODE:null; };
    const kNet   = bul(/net döviz pozisyon/i) || bul(/net pozisyon/i);
    const kKisa  = bul(/kısa vadeli net/i);
    const kVarl  = bul(/^toplam varlık|varlıklar.*toplam|toplam.*varlık/i);
    const kYuk   = bul(/^toplam yüküml|yükümlülük.*toplam|toplam.*yüküml/i);
    const istenen=[kNet,kKisa,kVarl,kYuk].filter(Boolean);
    if(!istenen.length) return res.status(200).json({ ok:false, err:'hedef seriler bulunamadı', grup:gk,
      ornekler: seriler.slice(0,10).map(x=>x.SERIE_NAME) });
    // 3) Veriyi çek (son ~14 ay)
    const bit=new Date(), bas=new Date(bit.getTime()-430*86400000);
    const f=(d)=>String(d.getDate()).padStart(2,'0')+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+d.getFullYear();
    const vu='https://evds3.tcmb.gov.tr/igmevdsms-dis/series='+istenen.join('-')+
      '&startDate='+f(bas)+'&endDate='+f(bit)+'&type=json';
    const veri=await getJ(vu);
    const items=(veri&&veri.items)||[];
    const sonIki=(kod)=>{ const al=kod.replace(/[.\-]/g,'_');
      const dolu=items.filter(x=>x[al]!=null&&x[al]!=='');
      if(!dolu.length) return null;
      const s=dolu[dolu.length-1], o=dolu.length>1?dolu[dolu.length-2]:null;
      return { deger:parseFloat(s[al]), tarih:s.Tarih||s.TARIH||'', fark:o?+(parseFloat(s[al])-parseFloat(o[al])).toFixed(0):null }; };
    const cikti={};
    if(kNet) cikti.net=sonIki(kNet);
    if(kKisa) cikti.kisaVadeli=sonIki(kKisa);
    if(kVarl) cikti.varlik=sonIki(kVarl);
    if(kYuk) cikti.yukumluluk=sonIki(kYuk);
    return res.status(200).json({ ok:true, grup:gk, kaynak:'EVDS (kendini çözen)', veri:cikti,
      seriAdlari:{net:kNet,kisa:kKisa} });
  }catch(e){
    return res.status(200).json({ ok:false, err:'dvz: '+String(e.message||e).slice(0,120) });
  }
}

module.exports = async (req, res) => {
  const mod = String((req.query && req.query.mod) || '').toLowerCase();
  if (mod === 'tlref') return _tlref(req, res);
  if (mod === 'egri')  return _egri(req, res);
  if (mod === 'kart')  return _kart(req, res);
  if (mod === 'rezerv') return rezervModu(req, res);
  if (mod === 'dvz') return dvzModu(req, res, { key: process.env.EVDS_KEY || req.query.key });
  if (mod === 'ecb') return ecbModu(req, res);   /* §275 — EVDS anahtarı GEREKMEZ */
  if (mod === 'yab') return yabModu(req, res, { key: process.env.EVDS_KEY || req.query.key });
  if (mod === 'kko') return kkoModu(req, res, { key: process.env.EVDS_KEY || req.query.key });

  res.setHeader('Access-Control-Allow-Origin', '*');

  const key = process.env.EVDS_KEY || req.query.key;
  if (!key) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(400).json({ error: 'EVDS_KEY tanımlı değil. Vercel > Settings > Environment Variables > EVDS_KEY ekleyin.' });
  }

  // Ortak EVDS fetch: timeout + retry. TIMEOUT YOKKEN büyük gruplar (bie_mbblnch,
  // bie_ulusdovlkd) asılı kalıp fonksiyonu 60sn'de zorla kestiriyordu → tarayıcıya
  // BOŞ yanıt dönüyordu. Artık her çağrı en fazla 20sn bekler, 2 kez dener, hata net döner.
  const H = { 'key': key, 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' };
  const evdsGet = async (url, sureler = [12000, 22000]) => {
    let sonHata = null;
    for (const ms of sureler) {
      try {
        const r = await fetch(url, { headers: H, signal: AbortSignal.timeout(ms) });
        const t = await r.text();
        if (t.trim().startsWith('[') || t.trim().startsWith('{')) return { ok: true, json: JSON.parse(t), durum: r.status };
        return { ok: false, durum: r.status, ilk200: t.slice(0, 200) };
      } catch (e) {
        sonHata = e;  // timeout ya da ağ hatası → sonraki (daha uzun) süreyle tekrar dene
      }
    }
    return { ok: false, hata: String((sonHata && sonHata.message) || sonHata || 'bilinmeyen') };
  };

  // Arama modu: ?ara=rezerv -> adında geçen tüm veri gruplarını bulur
  if (req.query.ara) {
    try {
      const au = 'https://evds3.tcmb.gov.tr/igmevdsms-dis/datagroups/mode=0&type=json';
      const g = await evdsGet(au);
      if (g.ok) {
        const ad = g.json;
        const hepsi = Array.isArray(ad) ? ad : (ad.items || []);
        const q = req.query.ara.toLocaleLowerCase('tr');
        const bul = hepsi.filter(x => ((x.DATAGROUP_NAME || '') + ' ' + (x.DATAGROUP_NAME_ENG || '')).toLocaleLowerCase('tr').includes(q))
          .map(x => ({ kod: x.DATAGROUP_CODE, ad: x.DATAGROUP_NAME }));
        res.setHeader('Cache-Control', 'no-store');
        return res.status(200).json({ arama: req.query.ara, bulunan: bul.length, gruplar: bul.slice(0, 30) });
      }
      res.setHeader('Cache-Control', 'no-store');
      return res.status(502).json({ error: 'datagroups alınamadı', detay: g.hata || g.ilk200 || ('HTTP '+g.durum) });
    } catch (e) {
      res.setHeader('Cache-Control', 'no-store');
      return res.status(502).json({ error: 'arama hatası', detay: String(e.message || e) });
    }
  }

  // Keşif modu: ?list=bie_apifon -> o veri grubundaki tüm seri kodlarını döner
  if (req.query.list) {
    try {
      const lu = 'https://evds3.tcmb.gov.tr/igmevdsms-dis/serieList/code=' + encodeURIComponent(req.query.list) + '&type=json';
      const g = await evdsGet(lu);
      if (g.ok) {
        const ld = g.json;
        let liste = (Array.isArray(ld) ? ld : (ld.items || [])).map(x => ({ kod: x.SERIE_CODE, ad: x.SERIE_NAME || x.SERIE_NAME_TR }));
        const toplamSeri = liste.length;
        // ?q= ile ad filtresi (büyük gruplarda çıktıyı daraltır — Türkçe büyük/küçük duyarsız)
        if (req.query.q) {
          const q = String(req.query.q).toLocaleLowerCase('tr');
          liste = liste.filter(x => String(x.ad || '').toLocaleLowerCase('tr').includes(q));
        }
        res.setHeader('Cache-Control', 'no-store');
        return res.status(200).json({ grup: req.query.list, toplam: toplamSeri, eslesen: liste.length, seriler: liste.slice(0, 40) });
      }
      res.setHeader('Cache-Control', 'no-store');
      return res.status(502).json({ error: 'serieList alınamadı (timeout olabilir)', detay: g.hata || g.ilk200 || ('HTTP '+g.durum) });
    } catch (e) {
      res.setHeader('Cache-Control', 'no-store');
      return res.status(502).json({ error: 'serieList hatası', detay: String(e.message || e) });
    }
  }

  // Kendini çözen mod: ?grup=bie_tukfiy2025&adFiltre=Genel -> gruptaki adı eşleşen ilk serinin verisini çeker
  let cozulenKod = null;
  let seriesParam = req.query.series;
  if (req.query.grup) {
    try {
      const lu = 'https://evds3.tcmb.gov.tr/igmevdsms-dis/serieList/code=' + encodeURIComponent(req.query.grup) + '&type=json';
      const g = await evdsGet(lu);
      if (g.ok) {
        const ld = g.json;
        const liste = Array.isArray(ld) ? ld : (ld.items || []);
        const q = (req.query.adFiltre || '').toLocaleLowerCase('tr');
        const adCek = x => ((x.SERIE_NAME || '') + ' ' + (x.SERIE_NAME_TR || '') + ' ' + (x.SERIE_NAME_ENG || '')).toLocaleLowerCase('tr');
        let hit = q ? liste.find(x => adCek(x).includes(q)) : liste[0];
        if (!hit && liste.length) hit = liste[0]; // eşleşme yoksa ilk seri
        if (hit && hit.SERIE_CODE) { cozulenKod = hit.SERIE_CODE; seriesParam = hit.SERIE_CODE; }
        if (req.query.debug === '1') {
          res.setHeader('Cache-Control', 'no-store');
          return res.status(200).json({ grup: req.query.grup, adFiltre: req.query.adFiltre, cozulen: cozulenKod, tumSeriler: liste.map(x => ({ kod: x.SERIE_CODE, ad: x.SERIE_NAME || x.SERIE_NAME_TR })) });
        }
      }
      if (!seriesParam) {
        res.setHeader('Cache-Control', 'no-store');
        return res.status(404).json({ error: 'Grupta eşleşen seri bulunamadı', grup: req.query.grup, adFiltre: req.query.adFiltre });
      }
    } catch (e) {
      res.setHeader('Cache-Control', 'no-store');
      return res.status(502).json({ error: 'grup çözümleme hatası', detay: String(e.message || e) });
    }
  }

  const seriesRaw = seriesParam || 'TP.APIFON4';
  const series = seriesRaw.split(',').map(s => s.trim());
  const gun = parseInt(req.query.gun) || 60;
  const debug = req.query.debug === '1';
  const full = req.query.full === '1';

  const fmt = (dt) => String(dt.getDate()).padStart(2, '0') + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + dt.getFullYear();
  const bugun = new Date();
  const bas = new Date(bugun.getTime() - gun * 86400000);

  // EVDS3 format: parametreler base URL'e ? OLMADAN eklenir; çoklu seri '-' ile ayrılır
  const freq = req.query.freq || '';
  let url = 'https://evds3.tcmb.gov.tr/igmevdsms-dis/' +
    'series=' + series.join('-') +
    '&startDate=' + fmt(bas) + '&endDate=' + fmt(bugun) + '&type=json';
  if (freq) url += '&frequency=' + freq + '&aggregationTypes=' + series.map(() => 'last').join('-');

  try {
    const r = await fetch(url, {
      headers: {
        'key': key,
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
      },
      signal: AbortSignal.timeout(25000)
    });
    const text = await r.text();
    if (!(text.trim().startsWith('{') || text.trim().startsWith('['))) {
      res.setHeader('Cache-Control', 'no-store');
      return res.status(502).json({ error: 'EVDS3 JSON dönmedi', durum: r.status, ilk200: debug ? text.slice(0, 200) : undefined, url: debug ? url : undefined });
    }
    const data = JSON.parse(text);
    const items = (data && data.items) ? data.items : [];
    const sonGecerli = {};
    series.forEach(k => {
      const alan = k.replace(/\./g, '_');
      for (let i = items.length - 1; i >= 0; i--) {
        const v = items[i][alan];
        if (v !== null && v !== undefined && v !== '') {
          sonGecerli[k] = { deger: parseFloat(v), tarih: items[i].Tarih };
          break;
        }
      }
    });
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200');
    res.status(200).json({ kaynak: 'TCMB EVDS3', seri: seriesRaw, cozulen: cozulenKod || undefined, son: sonGecerli, ham: full ? items : (debug ? items.slice(-5) : undefined) });
  } catch (e) {
    res.setHeader('Cache-Control', 'no-store');
    res.status(502).json({ error: 'EVDS3 verisine ulaşılamadı', detay: String(e.message || e) });
  }
};
module.exports.config = { maxDuration: 60 };


// ═══ REZERV MODU ═══ Karne için: brüt (haftalık) + net rezerv bileşenleri (aylık)
// Brüt: bie_abres2 TP.AB.TOPLAM (altın+döviz, milyon USD, HAFTALIK) — makro kartla aynı seri
// Net: analitik bilanço A02−A10 (bin TL, AYLIK), USD çevirimi CLIENT'ta (window.__usdtry)
// Doğrulama: (A02−A10)/kur = 56,3 mlr$ (10 Tem damgalı ile tuttu, 2 mlr TL fark)
async function rezervModu(req, res){
  res.setHeader('Access-Control-Allow-Origin','*');
  const key = process.env.EVDS_KEY || req.query.key;
  if (!key) return res.status(400).json({ ok:false, err:'EVDS_KEY yok' });
  const H = { 'key': key, 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' };
  const cek = async (seriler, extra='') => {
    const bugun = new Date();
    const bitis = String(bugun.getDate()).padStart(2,'0')+'-'+String(bugun.getMonth()+1).padStart(2,'0')+'-'+bugun.getFullYear();
    const url = 'https://evds3.tcmb.gov.tr/igmevdsms-dis/series=' + seriler.join('-') +
      extra + '&endDate=' + bitis + '&type=json';
    for (const ms of [12000, 22000]) {
      try {
        const r = await fetch(url, { headers: H, signal: AbortSignal.timeout(ms) });
        const t = await r.text();
        if (t.trim().startsWith('{') || t.trim().startsWith('[')) { const j = JSON.parse(t); return j.items || []; }
      } catch(e){}
    }
    return null;
  };
  try {
    // Brüt rezerv (haftalık) — son ~6 hafta, değişim için
    const brutItems = await cek(['TP.AB.TOPLAM','TP.AB.C1','TP.AB.C2'], '&startDate=01-06-2026');
    // Net rezerv bileşenleri (aylık) — dış varlıklar, döviz yükümlülükleri
    const netItems = await cek(['TP.AB.A02','TP.AB.A10'], '&startDate=01-01-2026');
    // USD/TRY kuru (günlük) — net rezervi USD'ye çevirmek için, son ~10 gün
    const kurItems = await cek(['TP.DK.USD.A.YTL'], '&startDate=01-07-2026');
    if (!brutItems && !netItems) return res.status(200).json({ ok:false, err:'EVDS yanıt vermedi (timeout)' });

    const sonGecerli = (items, alan) => {
      if (!items) return null;
      let v = null, t = null;
      items.forEach(it => { const x = it[alan]; if (x!==null && x!==undefined && x!=='') { const n = parseFloat(String(x).replace(',','.')); if (isFinite(n)) { v = n; t = it.Tarih || it.TARIH || it.YEARWEEK; } } });
      return v===null ? null : { v, t };
    };
    // Brüt: son + bir önceki hafta (değişim)
    let brutSon=null, brutOnce=null, altin=null, doviz=null;
    if (brutItems) {
      const gecerli = brutItems.filter(it => { const x=it['TP_AB_TOPLAM']; return x!==null&&x!==undefined&&x!==''; });
      if (gecerli.length) {
        const sonIt = gecerli[gecerli.length-1], onceIt = gecerli.length>1 ? gecerli[gecerli.length-2] : null;
        brutSon = { v: parseFloat(sonIt['TP_AB_TOPLAM']), t: sonIt.Tarih };
        if (onceIt) brutOnce = { v: parseFloat(onceIt['TP_AB_TOPLAM']), t: onceIt.Tarih };
        altin = sonGecerli(brutItems, 'TP_AB_C1');
        doviz = sonGecerli(brutItems, 'TP_AB_C2');
      }
    }
    // Net bileşenleri (bin TL)
    const disVarlik = sonGecerli(netItems, 'TP_AB_A02');
    const dovizYuk  = sonGecerli(netItems, 'TP_AB_A10');
    // Güncel kur (EVDS günlük, en son geçerli değer)
    const kur = sonGecerli(kurItems, 'TP_DK_USD_A_YTL');

    res.setHeader('Cache-Control','s-maxage=3600, stale-while-revalidate=7200');
    return res.status(200).json({ ok:true, kaynak:'TCMB EVDS3',
      brut: brutSon ? {
        deger: +(brutSon.v/1000).toFixed(1),           // milyon → milyar USD
        tarih: brutSon.t,
        degisim: brutOnce ? +((brutSon.v-brutOnce.v)/1000).toFixed(1) : null,
        altin: altin ? +(altin.v/1000).toFixed(1) : null,
        doviz: doviz ? +(doviz.v/1000).toFixed(1) : null,
        frekans: 'haftalık'
      } : null,
      net: (disVarlik && dovizYuk) ? {
        disVarlikBinTL: disVarlik.v,
        dovizYukBinTL: dovizYuk.v,
        farkBinTL: disVarlik.v - dovizYuk.v,
        // Net rezerv USD = (fark bin TL / 1e6 = mlr TL) / kur = mlr USD
        // Kur EVDS'den (TP.DK.USD.A.YTL, günlük en güncel) — canlı kur değil, tutarlı
        degerUSD: kur ? +(((disVarlik.v - dovizYuk.v)/1e6)/kur.v).toFixed(1) : null,
        kur: kur ? +kur.v.toFixed(2) : null,
        kurTarih: kur ? kur.t : null,
        tarih: disVarlik.t,
        frekans: 'aylık TL · güncel kur'
      } : null,
      // Swap hariç net = net − swap stoku. Swap stoku CLIENT'ta rezerv.json'dan okunup
      // net.degerUSD'den düşülür (EVDS'de temiz swap stoku yok — yurtdışı ikili swap gizli).
      swapStokuNotu: 'client rezerv.json swapStoku değerini net.degerUSD den düşer'
    });
  } catch(e) {
    return res.status(200).json({ ok:false, err:'rezerv modu: '+String(e.message||e).slice(0,120) });
  }
}
