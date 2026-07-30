// api/_lib/mail.js — Earnings AI kartlarını e-posta olarak gönderir
// Sağlayıcı: Resend (ücretsiz katman: 100 mail/gün, 3.000/ay) · env: RESEND_API_KEY, MAIL_TO, MAIL_FROM
// Anahtar yoksa uç 200 döner ve "yapılandırılmadı" der — panel mailto'ya düşer.
const https = require('node:https');

const _esc = s => String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

function htmlUret(kartlar){
  const YES='#0FA26B', KIR='#DE4B5E', GRI='#8896A5', INK='#1B2733', MUT='#6B7B8C', LIN='#E8EDF1', ZEM='#F6F8F9';
  const MONO="ui-monospace,SFMono-Regular,Menlo,monospace";
  const SANS="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
  const sk=s=>s==='POZİTİF'?YES:s==='NEGATİF'?KIR:GRI;
  const yn=v=>{const s=String(v||'');return s.startsWith('+')?YES:(s.startsWith('−')||s.startsWith('-'))?KIR:MUT;};
  const kart=k=>{
    const met=(k.metrikler||[]).map((x,i)=>'<tr style="background:'+(i%2?ZEM:'#fff')+'">'+
      '<td style="padding:6px 10px;font:400 11px '+SANS+';color:'+MUT+';border-bottom:1px solid '+LIN+'">'+_esc(x.ad)+'</td>'+
      '<td style="padding:6px 10px;font:700 12px '+MONO+';color:'+INK+';text-align:right;white-space:nowrap;border-bottom:1px solid '+LIN+'">'+_esc(x.deger)+'</td>'+
      '<td style="padding:6px 10px;font:400 11px '+MONO+';color:'+yn(x.cc)+';text-align:right;white-space:nowrap;border-bottom:1px solid '+LIN+'">'+_esc(x.cc||'—')+'</td>'+
      '<td style="padding:6px 10px;font:400 11px '+MONO+';color:'+yn(x.yoy)+';text-align:right;white-space:nowrap;border-bottom:1px solid '+LIN+'">'+_esc(x.yoy||'—')+'</td></tr>').join('');
    const onem=(k.onemli||[]).map(o=>'<tr><td style="padding:3px 0 3px 14px;font:400 12px '+SANS+';line-height:1.6;color:'+INK+'"><span style="color:'+YES+'">▪</span> '+_esc(o)+'</td></tr>').join('');
    return '<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#fff;border:1px solid '+LIN+';border-radius:10px;margin-bottom:14px">'+
    '<tr><td style="padding:14px 16px 10px"><table role="presentation" width="100%"><tr>'+
    '<td style="font:700 16px '+SANS+';color:'+INK+'">'+_esc(k.kod)+' <span style="font:400 11px '+SANS+';color:'+MUT+'">'+_esc(k.ad)+' · '+_esc(k.donem)+' · '+_esc(k.tarih)+'</span></td>'+
    '<td align="right"><span style="display:inline-block;font:700 9px '+SANS+';letter-spacing:.5px;color:#fff;background:'+sk(k.skor)+';padding:4px 10px;border-radius:10px">'+_esc(k.skor)+'</span></td></tr></table>'+
    '<div style="font:400 12.5px '+SANS+';line-height:1.7;color:'+INK+';margin:10px 0 4px;padding:10px 12px;background:'+ZEM+';border-left:3px solid '+YES+';border-radius:0 6px 6px 0">'+_esc(k.ozet||'')+'</div></td></tr>'+
    '<tr><td style="padding:0 16px"><table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;margin:6px 0 10px">'+
    '<tr><td colspan="2" style="font:700 9px '+SANS+';letter-spacing:.6px;color:'+MUT+';padding:0 10px 4px">METRİK</td>'+
    '<td style="font:700 9px '+SANS+';letter-spacing:.6px;color:'+MUT+';text-align:right;padding:0 10px 4px">ÇEYREK</td>'+
    '<td style="font:700 9px '+SANS+';letter-spacing:.6px;color:'+MUT+';text-align:right;padding:0 10px 4px">YILLIK</td></tr>'+met+'</table>'+
    (onem?'<table role="presentation" width="100%" style="margin:8px 0 10px"><tr><td style="font:700 9px '+SANS+';letter-spacing:.6px;color:'+MUT+';padding-bottom:4px">ÖNEMLİ</td></tr>'+onem+'</table>':'')+
    (k.guidance?'<table role="presentation" width="100%" style="border-top:1px dashed '+LIN+';margin-top:6px"><tr><td style="font:400 11px '+SANS+';color:'+MUT+';padding:8px 0 0;width:80px;vertical-align:top">Guidance</td><td style="font:400 11.5px '+SANS+';line-height:1.6;color:'+INK+';padding:8px 0 0;text-align:right">'+_esc(k.guidance)+'</td></tr></table>':'')+
    (k.tez?'<div style="font:400 12.5px '+SANS+';line-height:1.7;color:'+INK+';margin:12px 0 14px;padding:11px 13px;background:#F0F7F4;border-left:3px solid '+YES+';border-radius:0 6px 6px 0"><b style="color:'+YES+'">Portföy tezi:</b> '+_esc(k.tez)+'</div>':'')+
    '</td></tr></table>';
  };
  return '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;background:'+ZEM+'">'+
  '<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:'+ZEM+'"><tr><td align="center" style="padding:22px 12px">'+
  '<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:660px">'+
  '<tr><td style="padding-bottom:14px"><span style="font:700 11px '+SANS+';letter-spacing:1.4px;color:'+YES+'">KTPANEL · EARNINGS AI</span>'+
  '<span style="font:400 11px '+SANS+';color:'+MUT+';float:right">'+new Date().toLocaleDateString('tr-TR',{day:'numeric',month:'long',year:'numeric'})+'</span></td></tr>'+
  '<tr><td>'+kartlar.map(kart).join('')+'</td></tr>'+
  '<tr><td style="font:400 10.5px '+SANS+';line-height:1.6;color:'+GRI+';padding-top:6px;border-top:1px solid '+LIN+'">KTPanel · otomatik gönderim · '+new Date().toLocaleString('tr-TR')+'<br>Bilgilendirme amaçlıdır, yatırım tavsiyesi değildir.</td></tr>'+
  '</table></td></tr></table></body></html>';
}
function metinUret(kartlar){
  return kartlar.map(k=>{
    const L=[k.kod+' — '+k.ad+' · '+k.donem+' ['+k.skor+']','',k.ozet||'','','METRİKLER'];
    (k.metrikler||[]).forEach(x=>L.push('  '+String(x.ad).padEnd(26)+String(x.deger).padStart(16)+'   ÇÇ '+(x.cc||'—')+'   YoY '+(x.yoy||'—')));
    if((k.onemli||[]).length){L.push('','ÖNEMLİ');(k.onemli||[]).forEach(o=>L.push('  • '+o));}
    if(k.tez)L.push('','PORTFÖY TEZİ: '+k.tez);
    return L.join('\n');
  }).join('\n\n'+'─'.repeat(50)+'\n\n');
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Cache-Control','no-store');
  const cron = req.query && (req.query.cron === '1' || req.query.otomatik === '1');
  if (req.method !== 'POST' && !cron) return res.status(200).json({ ok:false, err:'POST bekleniyor (ya da ?cron=1)' });

  const KEY = process.env.RESEND_API_KEY;
  const FROM = process.env.MAIL_FROM || 'KTPanel <onboarding@resend.dev>';
  if (!KEY) return res.status(200).json({ ok:false, kurulum:true,
    err:'RESEND_API_KEY tanımlı değil. resend.com üzerinden ücretsiz anahtar alıp Vercel ortam değişkenlerine ekleyin.' });

  // Cron modu
  if (cron) {
    const tip = String((req.query&&req.query.tip)||'earnings').toLowerCase();
    const gizli = process.env.CRON_SECRET;
    if (gizli && String((req.query&&req.query.k)||'') !== gizli && !(req.headers&&req.headers.authorization===('Bearer '+gizli)))
      return res.status(401).json({ ok:false, err:'yetkisiz' });
    const alici0 = (process.env.MAIL_TO||'').trim();
    if (!alici0) return res.status(200).json({ ok:false, err:'MAIL_TO tanımlı değil' });
    const kok0 = 'https://' + (req.headers['x-forwarded-host'] || req.headers.host);

    const trNv=(n)=>n==null?'—':Number(n).toFixed(2).replace('.',',');
    // --- Parite alarmı: aynı itfa tarihli TRD/TRT çiftinde makas eşiği aşınca uyar ---
    if (tip === 'parite') {
      const esik = Math.max(parseFloat((req.query&&req.query.esik))||0.25, 0.05); // puan (varsayılan 25 bp)
      let j=null;
      try{ const r=await fetch(kok0+'/api/evds2?mod=egri&tur=parite',{signal:AbortSignal.timeout(28000)}); j=await r.json(); }
      catch(e){ return res.status(200).json({ ok:false, err:'parite verisi alınamadı: '+String(e.message||e) }); }
      if(!j||!j.ok||!j.ciftler||!j.ciftler.length)
        return res.status(200).json({ ok:false, err:'parite çifti yok', ayrinti:j&&j.err });
      // Eşiği aşan çiftler (mutlak değer — her iki yön de fırsat)
      const asan = j.ciftler.filter(c=>Math.abs(c.fark)>=esik)
        .sort((a,b)=>Math.abs(b.fark)-Math.abs(a.fark));
      if(!asan.length)
        return res.status(200).json({ ok:true, gonderildi:false, sebep:'eşik aşan çift yok',
          esik, enBuyukFark:j.ciftler.reduce((m,c)=>Math.abs(c.fark)>Math.abs(m)?c.fark:m,0), adet:j.adet });
      // Alarm maili
      const YES='#0FA26B',KIR='#DE4B5E',INK='#1B2733',MUT='#6B7B8C',LIN='#E8EDF1',ZEM='#F6F8F9';
      const MONO="ui-monospace,SFMono-Regular,Menlo,monospace", SANS="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
      const yon=f=>f>0?YES:KIR; // + sukuk ucuz (al sukuk/sat DİBS) · − sukuk pahalı (tersine)
      const aksiyon=f=>f>0?'Sukuk UCUZ → al sukuk / sat DİBS':'Sukuk PAHALI → sat sukuk / al DİBS';
      const sat = asan.map(c=>'<tr>'+
        '<td style="padding:7px 10px;font:400 11px '+SANS+';color:'+INK+';border-bottom:1px solid '+LIN+'">'+_esc(c.itfa)+'<br><span style="color:'+MUT+';font-size:9px">'+trNv(c.kalanYil)+' yıl</span></td>'+
        '<td style="padding:7px 10px;font:400 10px '+MONO+';color:'+INK+';border-bottom:1px solid '+LIN+'">'+_esc(c.sukukIsin)+'<br><span style="color:'+MUT+'">%'+trNv(c.sukukGetiri)+'</span></td>'+
        '<td style="padding:7px 10px;font:400 10px '+MONO+';color:'+INK+';border-bottom:1px solid '+LIN+'">'+_esc(c.dibsIsin)+'<br><span style="color:'+MUT+'">%'+trNv(c.dibsGetiri)+'</span></td>'+
        '<td style="padding:7px 10px;font:700 14px '+MONO+';color:'+yon(c.fark)+';text-align:right;border-bottom:1px solid '+LIN+';white-space:nowrap">'+(c.fark>0?'+':'')+trNv(c.fark)+'<br><span style="font:400 9px '+SANS+'">'+Math.round(Math.abs(c.fark)*100)+' bp</span></td>'+
        '</tr>').join('');
      const enBuyuk = asan[0];
      const html='<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;background:'+ZEM+'">'+
        '<table role="presentation" width="100%" style="background:'+ZEM+'"><tr><td align="center" style="padding:22px 12px">'+
        '<table role="presentation" width="100%" style="max-width:620px">'+
        '<tr><td style="padding-bottom:14px"><span style="font:700 11px '+SANS+';letter-spacing:1.4px;color:'+KIR+'">⚡ KTPANEL · PARİTE ALARMI</span>'+
        '<span style="font:400 11px '+SANS+';color:'+MUT+';float:right">'+_esc(j.tarih||'')+'</span></td></tr>'+
        '<tr><td style="background:#fff;border:1px solid '+LIN+';border-radius:10px;padding:16px 18px">'+
        '<div style="font:400 13px '+SANS+';line-height:1.7;color:'+INK+';margin-bottom:12px">'+
        '<b>'+asan.length+' çiftte</b> parite '+trNv(esik)+' puan eşiğini aştı. En büyük: <b style="color:'+yon(enBuyuk.fark)+'">'+
        _esc(enBuyuk.itfa)+'</b> vadesinde '+Math.round(Math.abs(enBuyuk.fark)*100)+' bp. <b>'+aksiyon(enBuyuk.fark)+'.</b></div>'+
        '<table role="presentation" width="100%" style="border-collapse:collapse">'+
        '<tr><td style="font:700 9px '+SANS+';letter-spacing:.5px;color:'+MUT+';padding:0 10px 5px">İTFA</td>'+
        '<td style="font:700 9px '+SANS+';letter-spacing:.5px;color:'+MUT+';padding:0 10px 5px">SUKUK (TRD)</td>'+
        '<td style="font:700 9px '+SANS+';letter-spacing:.5px;color:'+MUT+';padding:0 10px 5px">DİBS (TRT)</td>'+
        '<td style="font:700 9px '+SANS+';letter-spacing:.5px;color:'+MUT+';padding:0 10px 5px;text-align:right">FARK</td></tr>'+
        sat+'</table>'+
        '<div style="font:400 11px '+SANS+';line-height:1.6;color:'+MUT+';margin-top:12px;padding-top:10px;border-top:1px dashed '+LIN+'">'+
        'Fark = DİBS getirisi − sukuk getirisi. <b style="color:'+YES+'">Pozitif</b>: sukuk ucuz (al sukuk, sat DİBS). '+
        '<b style="color:'+KIR+'">Negatif</b>: sukuk pahalı (tersine). İkisi de Hazine kâğıdı — kredi riski nötr, '+
        'yalnız fiyat farkına oynanır. Makas kapanınca çift bacak kapatılır. '+
        'Sukuk likiditesi düşük olabilir; giriş/çıkış maliyetini fark ötesinde tut.</div>'+
        '</td></tr>'+
        '<tr><td style="font:400 10.5px '+SANS+';line-height:1.6;color:#8896A5;padding-top:10px">'+
        'KTPanel · parite alarmı · eşik '+trNv(esik)+' puan · TCMB EVDS · '+new Date().toLocaleString('tr-TR')+
        '<br>Bilgilendirme amaçlıdır, yatırım tavsiyesi değildir.</td></tr>'+
        '</table></td></tr></table></body></html>';
      const metin='PARİTE ALARMI — '+asan.length+' çift eşik aştı (>'+trNv(esik)+' puan)\n'+
        asan.map(c=>c.itfa+' ('+trNv(c.kalanYil)+'y): '+c.sukukIsin+' %'+trNv(c.sukukGetiri)+' vs '+
          c.dibsIsin+' %'+trNv(c.dibsGetiri)+' → fark '+(c.fark>0?'+':'')+trNv(c.fark)+' ('+aksiyon(c.fark)+')').join('\n');
      const konu='⚡ Parite alarmı: '+asan.length+' çift · en büyük '+Math.round(Math.abs(enBuyuk.fark)*100)+' bp ('+enBuyuk.itfa+')';
      return gonder(alici0, konu, html, metin, res);
    }

    // --- Haftalık yorum ---
    if (tip === 'haftalik') {
      let sayfa='';
      try{ const r=await fetch(kok0+'/index.html',{signal:AbortSignal.timeout(15000)}); sayfa=await r.text(); }
      catch(e){ return res.status(200).json({ ok:false, err:'sayfa okunamadı: '+String(e.message||e) }); }
      // İç içe <div> sayarak doğru kapanışı bul (regex tek başına erken kesiyor)
      const al=(id)=>{
        const b = sayfa.indexOf('id="'+id+'"'); if(b<0) return '';
        const ac = sayfa.indexOf('>', b); if(ac<0) return '';
        let d=1, i=ac+1;
        while(i<sayfa.length && d>0){
          const a2=sayfa.indexOf('<div', i), k2=sayfa.indexOf('</div>', i);
          if(k2<0) break;
          if(a2>=0 && a2<k2){ d++; i=a2+4; } else { d--; if(d===0) return sayfa.slice(ac+1, k2); i=k2+6; }
        }
        return '';
      };
      const duz=(h)=>String(h).replace(/<br\s*\/?>/gi,'\n').replace(/<\/(p|div|li)>/gi,'\n')
        .replace(/<[^>]+>/g,'').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>')
        .replace(/\n{3,}/g,'\n\n').trim();
      const notHtml = al('yorumMetin');
      const takHtml = al('taktikselBody') || al('taktiksel');
      const haftaM = sayfa.match(/id="yorumHafta"[^>]*>([^<]*)</); const hafta = haftaM?haftaM[1].trim():'';
      if (!notHtml) return res.status(200).json({ ok:false, err:'haftalık araştırma notu bulunamadı' });
      // Taktiksel dağılım tarayıcıda canlı hesaplanıyor; sunucudan boş gelir → panele yönlendir
      const takVar = takHtml && takHtml.replace(/<[^>]+>/g,'').trim().length > 40;
      const YES='#0FA26B',INK='#1B2733',MUT='#6B7B8C',LIN='#E8EDF1',ZEM='#F6F8F9';
      const SANS="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
      const blok=(b,ic)=>ic?('<table role="presentation" width="100%" style="background:#fff;border:1px solid '+LIN+';border-radius:10px;margin-bottom:14px">'+
        '<tr><td style="padding:14px 16px"><div style="font:700 10px '+SANS+';letter-spacing:.8px;color:'+YES+';margin-bottom:8px">'+b+'</div>'+
        '<div style="font:400 12.5px '+SANS+';line-height:1.75;color:'+INK+'">'+ic+'</div></td></tr></table>'):'';
      const html='<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;background:'+ZEM+'">'+
        '<table role="presentation" width="100%" style="background:'+ZEM+'"><tr><td align="center" style="padding:22px 12px">'+
        '<table role="presentation" width="100%" style="max-width:660px">'+
        '<tr><td style="padding-bottom:14px"><span style="font:700 11px '+SANS+';letter-spacing:1.4px;color:'+YES+'">KTPANEL · HAFTALIK PİYASA YORUMU</span>'+
        '<span style="font:400 11px '+SANS+';color:'+MUT+';float:right">'+_esc(hafta)+'</span></td></tr>'+
        '<tr><td>'+blok('ARAŞTIRMA NOTU',notHtml)+(takVar?blok('TAKTİKSEL DAĞILIM',takHtml):'')+'</td></tr>'+
        '<tr><td style="font:400 10.5px '+SANS+';line-height:1.6;color:#8896A5;padding-top:6px;border-top:1px solid '+LIN+'">'+
        'KTPanel · otomatik haftalık gönderim · '+new Date().toLocaleString('tr-TR')+
        '<br>'+(takVar?'':'Taktiksel dağılım ve canlı pano panelde hesaplanır — Haftalık Yorum sekmesi. ')+'Bilgilendirme amaçlıdır, yatırım tavsiyesi değildir.</td></tr>'+
        '</table></td></tr></table></body></html>';
      const metin='KTPANEL · HAFTALIK PİYASA YORUMU'+(hafta?('\n'+hafta):'')+
        '\n\nARAŞTIRMA NOTU\n'+duz(notHtml)+(takHtml?('\n\nTAKTİKSEL DAĞILIM\n'+duz(takHtml)):'');
      return gonder(alici0, 'KTPanel · Haftalık Piyasa Yorumu'+(hafta?(' — '+hafta):''), html, metin, res);
    }

    // --- Earnings kartları ---
    let kartlar=[];
    try{
      const kok = kok0;
      const r = await fetch(kok + '/inceleme-ai.json', { signal: AbortSignal.timeout(10000) });
      const d = await r.json();
      kartlar = d.kartlar || [];
    }catch(e){ return res.status(200).json({ ok:false, err:'inceleme-ai.json okunamadı: '+String(e.message||e) }); }
    // Kart seçimi — üç filtre sırayla uygulanır:
    //   ?gun=N   → son N gün içindeki kartlar (varsayılan 3)
    //   ?hepsi=1 → gün filtresini atla, tümünü al
    //   ?adet=N  → yukarıdakinden sonra EN YENİ N kartla sınırla (arşiv büyüdükçe mailin şişmesini önler)
    //   ?kod=A,B → yalnız bu kodlar (adet/gün filtrelerini ezer)
    const gun = Math.max(parseInt((req.query&&req.query.gun))||3, 1);
    const sinir = new Date(Date.now() - gun*86400000);
    const yeni = kartlar.filter(k=>{ const t=new Date(k.tarih); return !isNaN(t) && t >= sinir; });
    const kodFiltre = String((req.query&&req.query.kod)||'').split(',').map(x=>x.trim().toUpperCase()).filter(Boolean);
    let secili;
    if (kodFiltre.length) secili = kartlar.filter(k=>kodFiltre.indexOf(String(k.kod).toUpperCase())>=0);
    else {
      secili = (req.query&&req.query.hepsi==='1') ? kartlar : yeni;
      const adet = parseInt((req.query&&req.query.adet));
      // kartlar dosyada en yeniden eskiye sıralı → baştan kes
      if (isFinite(adet) && adet > 0) secili = secili.slice(0, adet);
    }
    if (!secili.length) return res.status(200).json({ ok:true, atlandi:true,
      sebep: kodFiltre.length ? ('eşleşen kart yok: '+kodFiltre.join(',')) : ('son '+gun+' günde yeni kart yok') });
    return gonder(alici0,
      'KTPanel · Earnings AI — ' + secili.map(k=>k.kod).join(', ') + ' (' + new Date().toLocaleDateString('tr-TR') + ')',
      htmlUret(secili), metinUret(secili), res);
  }

  // Gövde
  let g = req.body;
  if (typeof g === 'string') { try{ g = JSON.parse(g); }catch(e){ g = {}; } }
  if (!g || typeof g !== 'object') g = {};
  const alici = (g.to || process.env.MAIL_TO || '').trim();
  if (!alici) return res.status(200).json({ ok:false, err:'Alıcı adresi yok (MAIL_TO tanımlayın ya da istekte to gönderin).' });
  const konu = String(g.subject || 'KTPanel — Bilanço İncelemesi').slice(0,180);
  const html = String(g.html || '').slice(0, 400000);
  const metin = String(g.text || '').slice(0, 200000);
  if (!html && !metin) return res.status(200).json({ ok:false, err:'İçerik boş' });

  return gonder(alici, konu, html, metin, res);
};

async function gonder(alici, konu, html, metin, res){
  const KEY = process.env.RESEND_API_KEY;
  const FROM = process.env.MAIL_FROM || 'KTPanel <onboarding@resend.dev>';
  const govde = JSON.stringify({ from:FROM, to:alici.split(',').map(s=>s.trim()).filter(Boolean),
                                 subject:konu, html:html||undefined, text:metin||undefined });
  try{
    const yanit = await new Promise((coz,red)=>{
      const r = https.request({ host:'api.resend.com', path:'/emails', method:'POST',
        headers:{ 'content-type':'application/json', 'authorization':'Bearer '+KEY,
                  'content-length':Buffer.byteLength(govde) }, timeout:20000 },
        s=>{ let d=''; s.setEncoding('utf8'); s.on('data',x=>d+=x);
             s.on('end',()=>coz({durum:s.statusCode, metin:d})); });
      r.on('error',red); r.on('timeout',()=>r.destroy(new Error('zaman aşımı')));
      r.write(govde); r.end();
    });
    let j=null; try{ j=JSON.parse(yanit.metin); }catch(e){}
    if (yanit.durum>=200 && yanit.durum<300)
      return res.status(200).json({ ok:true, id:j&&j.id, alici, gonderildi:new Date().toISOString() });
    return res.status(200).json({ ok:false, err:'Sağlayıcı hatası ('+yanit.durum+'): '+
      ((j&&(j.message||j.name))||yanit.metin.slice(0,160)) });
  }catch(e){
    return res.status(200).json({ ok:false, err:'Mail gönderilemedi: '+String(e.message||e).slice(0,140) });
  }
}
