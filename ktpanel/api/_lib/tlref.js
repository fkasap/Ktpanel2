// /api/tlref — TLREF günlük serisi (EVDS: TP.BISTTLREF.KAPANIS) + dönem bileşik birikimi
// TLREFK lisanslı kanaldan dağıtıldığı için otomatik çekilemiyor; TLREF konvansiyonel muadili,
// ikisi arasında küçük bir baz farkı olur (marj alanıyla düzeltilebilir).
// Kullanım: /api/tlref?bas=11.03.2026&bit=22.07.2026&baz=364
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200');
  const key = process.env.EVDS_KEY || req.query.key;
  if (!key) return res.status(200).json({ ok:false, err:'EVDS_KEY tanımlı değil (Vercel > Settings > Environment Variables).' });

  const trTar = (s) => { const m=String(s||'').match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})$/); return m ? new Date(+m[3],+m[2]-1,+m[1]) : null; };
  const fmt = (d) => String(d.getDate()).padStart(2,'0')+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+d.getFullYear();
  const bas = trTar(req.query.bas), bit = trTar(req.query.bit) || new Date();
  const baz = parseInt(req.query.baz) || 364;
  if (!bas) return res.status(200).json({ ok:false, err:'bas parametresi gerekli (GG.AA.YYYY)' });

  const url = 'https://evds3.tcmb.gov.tr/igmevdsms-dis/series=TP.BISTTLREF.KAPANIS&startDate='+fmt(bas)+'&endDate='+fmt(bit)+'&type=json';
  try{
    const r = await fetch(url, { headers:{ 'key':key, 'Accept':'application/json',
      'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36' },
      signal: AbortSignal.timeout(9000) });
    const text = await r.text();
    if (!(text.trim().startsWith('{')||text.trim().startsWith('['))) throw new Error('EVDS JSON dönmedi ('+r.status+')');
    const items = (JSON.parse(text).items)||[];
    // Değerleri topla (hafta sonu/tatil boş gelir → atlanır)
    const noktalar = [];
    for (const it of items){
      const ham = it['TP_BISTTLREF_KAPANIS'];
      const v = (ham===null||ham===undefined||ham==='') ? null : parseFloat(String(ham).replace(',','.'));
      if (v!=null && isFinite(v)) noktalar.push({ t: it.Tarih, v });
    }
    if (!noktalar.length) return res.status(200).json({ ok:false, err:'EVDS boş döndü (tarih aralığı ya da seri kodu)', url: req.query.debug?url:undefined });

    // ENDEKS mi ORAN mı? Endeks seviyeleri binlerde, gecelik oran %20-60 aralığında.
    const ort = noktalar.reduce((s,x)=>s+x.v,0)/noktalar.length;
    const tip = ort > 200 ? 'endeks' : 'oran';
    const ilk = noktalar[0], son = noktalar[noktalar.length-1];
    let birikim;
    if (tip==='endeks'){
      birikim = (son.v/ilk.v - 1)*100;           // endeks zaten bileşiklenmiş
    }else{
      let f=1; noktalar.forEach(x=>{ f *= (1 + x.v/100/baz); });
      birikim = (f-1)*100;
    }
    const takvimGun = Math.round((new Date(son.t.split('-').reverse().join('-')) - new Date(ilk.t.split('-').reverse().join('-')))/86400000) || noktalar.length;
    return res.status(200).json({ ok:true, kaynak:'TCMB EVDS · TP.BISTTLREF.KAPANIS',
      tip,
      uyari:'TLREFK değil TLREF (konvansiyonel) — katılım oranıyla arasında küçük baz farkı olur.',
      bas:req.query.bas, bit:fmt(bit), baz,
      gozlem: noktalar.length, takvimGun,
      E0: ilk.v, Et: son.v, E0Tarih: ilk.t, EtTarih: son.t,
      birikim,
      basitEsdeger: takvimGun>0 ? birikim*baz/takvimGun : null,
      oranlar: tip==='oran' ? noktalar.map(x=>x.v) : undefined });
  }catch(e){
    return res.status(200).json({ ok:false, err:'EVDS/TLREF çekilemedi: '+String(e.message||e).slice(0,120) });
  }
};
