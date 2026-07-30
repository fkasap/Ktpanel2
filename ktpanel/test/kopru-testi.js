#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   KTPanel — KÖPRÜ TESTİ
   Deploy ÖNCESİ / sonrası çalıştırılır. 10 serverless ucun HEPSİNİ çağırır ve
   yanıt ŞEMASINI doğrular. Amaç "200 döndü mü" değil — o yetmiyor, çünkü tüm
   köprüler hata halinde bilerek 200 + {ok:false} döndürüyor (UI ayakta kalsın diye).
   Bu tasarım doğru ama SESSİZ KIRILMA üretiyor: BAKIM §60 (TEFAS API emekli oldu),
   §92 (üç kart birden boşaldı), §95-97 (ECB kesintisi), §101 (alan adı uyuşmazlığı)
   — dördü de kullanıcı gözüyle yakalandı, sistemle değil. Bu dosya o boşluğu kapatır.

   KULLANIM
     node test/kopru-testi.js                          # varsayılan: prod
     KTP_URL=http://localhost:3000 node test/kopru-testi.js
     CRON_SECRET=xxx node test/kopru-testi.js          # giriş korumasını atlar
       ↑ Vercel'deki CRON_SECRET'in DEĞERİ. KTP_CRON_SECRET adi da kabul edilir.
       .env.local çektiysen:  export $(grep CRON_SECRET .env.local | xargs) && node test/kopru-testi.js
     node test/kopru-testi.js --hizli                  # yalnız kritik uçlar

   ÇIKIŞ KODU: 0 = hepsi geçti · 1 = en az bir KRİTİK uç bozuk (deploy'u durdur)
   Uyarılar (kota/tatil gibi geçici sebepler) çıkış kodunu bozmaz.
   ═══════════════════════════════════════════════════════════════════════════ */
const KOK = (process.env.KTP_URL || 'https://ktpanel.vercel.app').replace(/\/$/, '');
// Cron sırrı: Vercel'de değişkenin adı CRON_SECRET'tir. Terminalde hangi adla
// verirsen ver kabul edilir — isim farkı yüzünden 401 yemeyesin diye üçü de okunur.
const SIR = process.env.KTP_CRON_SECRET || process.env.CRON_SECRET || process.env.VERCEL_CRON_SECRET || '';
const HIZLI = process.argv.includes('--hizli');
const ZAMAN = 30000;

const R = { yesil:'\x1b[32m', kirmizi:'\x1b[31m', sari:'\x1b[33m', gri:'\x1b[90m', kalin:'\x1b[1m', sifir:'\x1b[0m' };
const dizi = (o, yol) => yol.split('.').reduce((a, k) => (a == null ? a : a[k]), o);

/* Bir uç için: yol · kritik mi · doğrulayıcı(veri) → true | 'hata metni' */
const UCLAR = [
  // ŞEKİL KAYNAKTAN OKUNDU (§116): market.js → { t, tarih, data:{ <kur/endeks anahtarları>, sec, end, his } }
  // İlk sürüm 'veri/endeksler/items' arıyordu — hiçbiri yok, sağlam uç için ASILSIZ ALARM üretiyordu.
  { ad:'market · küresel endeksler', yol:'/api/market', kritik:true, dogrula:d=>{
      const D = d.data;
      if(!D || typeof D!=='object') return 'data objesi yok: '+Object.keys(d||{}).slice(0,6).join(',');
      const ana = Object.keys(D).filter(k=>!['sec','end','his'].includes(k));
      const dolu = ana.filter(k=>D[k] && D[k].p!=null);
      if(dolu.length < 3) return 'yalnız '+dolu.length+'/'+ana.length+' ana sembol çözüldü';
      const e = D.end || {};
      const eDolu = Object.keys(e).filter(k=>e[k] && e[k].p!=null).length;
      if(eDolu < 8) return 'BIST endeksleri eksik: '+eDolu+'/'+Object.keys(e).length;
      return true; } },

  { ad:'market · toplu fiyat (141 hisse)', yol:'/api/market?mod=fiyat&kodlar=ASELS,TUPRS,BIMAS', kritik:true, dogrula:d=>{
      const f = d.fiyat || d.fiyatlar;
      if(!f || typeof f!=='object') return 'fiyat objesi yok';
      const n = Object.keys(f).length;
      if(n < 2) return 'yalnız '+n+' kod çözüldü (3 istendi)';
      const v = f.ASELS ?? f.TUPRS ?? f.BIMAS;
      if(!(v>0)) return 'fiyat pozitif sayı değil: '+v;
      return true; } },

  // §115: sektör endekslerinin 1H/1A/3A serisi GERÇEKTEN geliyor mu?
  // "200 döndü" yetmez — h1/a1/q3 null ise rotasyon damgalı tabanda kalır (§114)
  // ve panel bunu sessizce yapar. Hangi varyantın tuttuğu da raporlanır.
  { ad:'market · SEKTÖR serisi (RS tabanı)', yol:'/api/market', kritik:false, dogrula:d=>{
      const sec = (d.data && d.data.sec) || d.sec;
      if(!sec) return 'sec objesi yok';
      const kod = Object.keys(sec);
      if(!kod.length) return 'sektör listesi boş';
      const eksik = kod.filter(k => !sec[k] || sec[k].a1 == null);
      const varyant = {};
      kod.forEach(k => { const v = sec[k] && sec[k].varyant; if(v) varyant[v] = (varyant[v]||0)+1; });
      const ozet = Object.keys(varyant).map(v => v+'×'+varyant[v]).join(' · ');
      if(eksik.length){
        const bar = kod.map(k=>k+':'+((sec[k]&&sec[k].n)!=null?sec[k].n:'?')).join(' ');
        return eksik.length+'/'+kod.length+' sektörde 1A serisi YOK — RS damgalı tabandan (§114). '+
               'BAR SAYILARI: '+bar+' | varyant: '+(ozet||'yok');
      }
      return true; } },

  // fredModu → { ok, kaynak, alinma, seriler:{...} }  ('seri' DEĞİL 'seriler')
  { ad:'market · FRED (ABD tahvil)', yol:'/api/market?mod=fred', kritik:false, dogrula:d=>{
      if(d.ok===false) return 'ok:false — '+(d.err||'sebep yok');
      const s = d.seriler || {};
      const n = Object.keys(s).length;
      return n>0 ? true : 'seriler boş'; } },

  // §97: ECB sunucu tarafı düşerse panel TARAYICIDAN doğrudan çekiyor — bu BEKLENEN
  // bir durum, kart boş kalmaz. Bilgi amacıyla raporlanır, alarm değildir.
  { ad:'market · ECB (sunucu bacagı)', yol:'/api/market?mod=ecb', kritik:false, dogrula:d=>
      d.ok===false ? ('sunucu bacagı düştü — panel tarayıcı yedeğini kullanır (§97): '+(d.err||'')) : true },

  { ad:'market · BoJ', yol:'/api/market?mod=boj', kritik:false, dogrula:d=>
      d.ok===false ? ('ok:false — '+(d.err||'')) : true },

  { ad:'market · HKMA', yol:'/api/market?mod=hkma', kritik:false, dogrula:d=>
      d.ok===false ? ('ok:false — '+(d.err||'')) : true },

  { ad:'evds2 · TÜFE endeksi', yol:'/api/evds2?grup=bie_tukfiy2025&adFiltre=Genel&gun=400&full=1', kritik:true, dogrula:d=>{
      const alan = String(d.cozulen || d.seri || '').replace(/\./g,'_');
      if(!alan) return 'cozulen/seri alanı yok — REEL GETİRİ MODÜLÜ BUNA BAĞLI';
      const ham = d.ham || [];
      if(!Array.isArray(ham) || ham.length < 6) return 'ham seri kısa: '+ham.length+' gözlem';
      const dolu = ham.filter(x=>x[alan]!=null && x[alan]!=='');
      if(dolu.length < 6) return alan+' alanı çoğunlukla boş ('+dolu.length+'/'+ham.length+')';
      if(!/^\d{4}-\d{1,2}$/.test(String(dolu[0].Tarih))) return 'Tarih biçimi beklenenden farklı: '+dolu[0].Tarih;
      return true; } },

  // egri.js → { ok, tur, kaynak, konvansiyon, sapma, adet, aday, baz, vadeler:{...} }
  { ad:'evds2 · getiri eğrisi (DİBS)', yol:'/api/evds2?mod=egri', kritik:true, dogrula:d=>{
      if(d.ok===false) return 'ok:false — '+(d.err||'');
      const n = d.adet!=null ? d.adet : Object.keys(d.vadeler||{}).length;
      if(n < 3) return 'vade noktası yetersiz: '+n+' (aday '+(d.aday||0)+')';
      return true; } },

  { ad:'evds2 · getiri eğrisi (sukuk)', yol:'/api/evds2?mod=egri&tur=sukuk', kritik:false, dogrula:d=>{
      if(d.ok===false) return 'ok:false — '+(d.err||'');
      const n = d.adet!=null ? d.adet : Object.keys(d.vadeler||{}).length;
      return n>=3 ? true : 'vade noktası yetersiz: '+n; } },

  { ad:'evds2 · TLREF', yol:'/api/evds2?mod=tlref&bas=01.01.2026', kritik:false, dogrula:d=>
      d.ok===false ? ('ok:false — '+(d.err||'')) :
      (d.birikim!=null ? true : 'birikim alanı yok') },

  { ad:'evds2 · kart harcamaları', yol:'/api/evds2?mod=kart', kritik:false, dogrula:d=>{
      if(d.ok===false) return 'ok:false — '+(d.err||'');
      const p = d.paylarToplami;
      if(p!=null && Math.abs(p-100) > 3) return 'TUTARLILIK: sektör payları toplamı %'+p+' (≈100 olmalı) — seri seti eksik';
      return true; } },

  { ad:'evds2 · rezerv', yol:'/api/evds2?mod=rezerv', kritik:false, dogrula:d=>
      d.ok===false ? ('ok:false — '+(d.err||'')) : true },

  { ad:'kap · bildirim akışı', yol:'/api/kap', kritik:true, dogrula:d=>{
      if(!Array.isArray(d.items)) return 'items dizisi yok';
      if(!d.items.length) return 'akış boş — WAF/şema değişmiş olabilir ('+(d.err||'hata yok')+')';
      const i = d.items[0];
      if(!Array.isArray(i.k) || !i.b) return 'kayıt şeması bozuk: '+Object.keys(i).join(',');
      return true; } },

  { ad:'kap · sukuk akışı', yol:'/api/kap?mod=sukuk', kritik:false, dogrula:d=>{
      if(!Array.isArray(d.ihraclar)) return 'ihraclar dizisi yok';
      if(d.bilinmeyenKodlar && d.bilinmeyenKodlar.length)
        return 'HARİTA EKSİĞİ: tanınmayan VKŞ kodu — '+d.bilinmeyenKodlar.join(', ');
      return true; } },

  { ad:'katfon · TEFAS', yol:'/api/katfon?k=KLU,KTV,AIS', kritik:true, dogrula:d=>{
      if(d.ok===false) return 'ok:false — '+(d.err||'')+' (TEFAS API değişmiş olabilir — §60 vakası)';
      const it = d.items||{};
      const n = Object.keys(it).length;
      if(n===0) return 'hiç fon çözülemedi';
      const bir = it[Object.keys(it)[0]];
      if(!(bir.fiyat>0)) return 'fiyat pozitif değil';
      return true; } },

  { ad:'bddk · panel', yol:'/api/bddk?panel=1', kritik:false, dogrula:d=>
      d.ok===false ? ('ok:false — '+(d.err||'')) : true },

  { ad:'bddk · sahiplik', yol:'/api/bddk?sahiplik=1', kritik:false, dogrula:d=>
      d.ok===false ? ('ok:false — '+(d.err||'')) : true },

  { ad:'usnews · AV haber akışı', yol:'/api/usnews', kritik:false, dogrula:d=>
      d.ok===false ? ('ok:false — '+(d.err||'')) :
      (Array.isArray(d.items)&&d.items.length ? true : 'haber çözülemedi') },

  { ad:'usnews · Finnhub kazanç', yol:'/api/usnews?mod=kazanc', kritik:false, dogrula:d=>
      d.ok===false ? ('ok:false — '+(d.err||'')) : true },

  { ad:'usnews · kripto', yol:'/api/usnews?mod=kripto', kritik:false, dogrula:d=>
      d.ok===false ? ('ok:false — '+(d.err||'')) : true },

  { ad:'tcmb · kurlar', yol:'/api/tcmb', kritik:true, dogrula:d=>
      (d.usd && d.usd.satis>0) ? true : 'USD kuru çözülemedi' },

  { ad:'data · bulut depo (KV)', yol:'/api/data', kritik:false, dogrula:d=>
      d.error ? ('depo yapılandırılmamış: '+String(d.error).slice(0,60)) : true },

  { ad:'ajanktp · KV sağlık', yol:'/api/ajanktp?mod=test', kritik:false, dogrula:d=>{
      if(!d.env) return 'env raporu yok';
      if(!d.env.url || !d.env.token) return 'Upstash env eksik (url:'+d.env.url+' token:'+d.env.token+')';
      return d.ok ? true : 'KV yazma/okuma başarısız'; } },
];

const KRITIK_HIZLI = new Set(['market · toplu fiyat (141 hisse)','evds2 · TÜFE endeksi','kap · bildirim akışı','katfon · TEFAS','tcmb · kurlar']);

async function calistir(u){
  const bas = Date.now();
  try{
    const r = await fetch(KOK + u.yol, {
      headers: SIR ? { 'Authorization': 'Bearer ' + SIR } : {},
      signal: AbortSignal.timeout(ZAMAN)
    });
    const ms = Date.now() - bas;
    if(r.status === 401) return { sonuc:'KIMLIK', ms, not:'401 — giriş koruması. CRON_SECRET=<deger> ile çalıştır.' };
    if(!r.ok) return { sonuc:'HATA', ms, not:'HTTP ' + r.status };
    const metin = await r.text();
    let d; try{ d = JSON.parse(metin); }
    catch(e){ return { sonuc:'HATA', ms, not:'JSON değil: ' + metin.slice(0,60).replace(/\s+/g,' ') }; }
    const s = u.dogrula(d);
    return s === true ? { sonuc:'GECTI', ms } : { sonuc: u.kritik ? 'HATA' : 'UYARI', ms, not:String(s) };
  }catch(e){
    return { sonuc:'HATA', ms: Date.now()-bas, not:String(e.message||e).slice(0,70) };
  }
}

(async () => {
  const liste = HIZLI ? UCLAR.filter(u => KRITIK_HIZLI.has(u.ad)) : UCLAR;
  console.log(`\n${R.kalin}KTPanel köprü testi${R.sifir} ${R.gri}· ${KOK} · ${liste.length} uç · ${new Date().toLocaleString('tr-TR')}${R.sifir}`);
  if(!SIR) console.log(`${R.sari}⚠ cron sırrı verilmedi — panel giriş korumalıysa HEPSİ 401/403 döner.${R.sifir}\n`+
    `${R.gri}  Vercel > Settings > Environment Variables > CRON_SECRET değerini şöyle ver:${R.sifir}\n`+
    `${R.gri}  CRON_SECRET=<deger> node test/kopru-testi.js${R.sifir}`);
  console.log('');

  const sonuclar = [];
  for(const u of liste){
    const s = await calistir(u);
    sonuclar.push({ u, s });
    const renk = s.sonuc==='GECTI' ? R.yesil : s.sonuc==='UYARI' ? R.sari : R.kirmizi;
    const isaret = s.sonuc==='GECTI' ? '✓' : s.sonuc==='UYARI' ? '!' : '✗';
    console.log(`${renk}${isaret}${R.sifir} ${u.ad.padEnd(34)} ${R.gri}${String(s.ms).padStart(5)}ms${R.sifir}` +
      (s.not ? `  ${renk}${s.not}${R.sifir}` : ''));
  }

  const gecti = sonuclar.filter(x=>x.s.sonuc==='GECTI').length;
  const uyari = sonuclar.filter(x=>x.s.sonuc==='UYARI');
  const hata  = sonuclar.filter(x=>x.s.sonuc==='HATA' || x.s.sonuc==='KIMLIK');
  console.log(`\n${R.kalin}${gecti} geçti${R.sifir} · ${R.sari}${uyari.length} uyarı${R.sifir} · ${R.kirmizi}${hata.length} hata${R.sifir}`);

  if(hata.length){
    console.log(`\n${R.kirmizi}${R.kalin}DEPLOY ETME — kritik köprüler bozuk:${R.sifir}`);
    hata.forEach(x=>console.log(`  · ${x.u.ad}: ${x.s.not}`));
    console.log(`${R.gri}Bozuk köprünün kartı panelde SESSİZCE boş görünür; damga hâlâ "canlı" der (§60 dersi).${R.sifir}`);
  } else if(uyari.length){
    console.log(`${R.gri}Uyarılar deploy'u engellemez — kota, tatil veya opsiyonel env eksikliği olabilir.${R.sifir}`);
  } else {
    console.log(`${R.yesil}Tüm köprüler sağlam.${R.sifir}`);
  }
  process.exit(hata.length ? 1 : 0);
})();
