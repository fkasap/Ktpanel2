/* KTPanel — §538 HAFTALIK NOT OTOMASYONU (25 Eki 2026)
   NEDEN: Haftalık Yorum ajan tarafından panel AÇIKKEN Pazartesi yazılıyordu (ajan.js haftalikYorumYaz, pazartesi tetiği). Panel Pazartesi
   açılmazsa not eski haftada kalıyor; 22 Eki PPK öncesi yazılan not 3 gün "%37" dedi (§534). Bu iş akışı her Pazartesi 07:30 TSİ paneli
   Playwright ile açar, AYNI fonksiyonu çağırır (haftalikYorumYaz(true,'hafta')) — yani metin yine panelin canlı kartlarından ve aynı
   AI köprüsünden üretilir; sonucu panelin kendi bulut hafızasına (api/ajanktp mod=yaz) yazar. Cihazlar açılışta buluttan okur (§423).
   Ay başındaki ilk Pazartesi ayrıca AYLIK not da yazılır.
   GÜVENLİK: CRON_SECRET yalnız panelin kendi alan adına giden isteklere eklenir; mail ucu kapalı; başka POST yapılmaz (yalnız ajanktp yaz
   ve market mod=ai).  KULLANIM: CRON_SECRET=… node scripts/haftalik-not.mjs [--kip=hafta|ay|ikisi] */
import fs from 'node:fs/promises';
import path from 'node:path';
const ARG = Object.fromEntries(process.argv.slice(2).map(a => { const m = a.match(/^--([^=]+)(?:=(.*))?$/); return m ? [m[1], m[2] ?? '1'] : [a, '1']; }));
const KOK_URL = (process.env.KTP_URL || 'https://ktpanel.vercel.app').replace(/\/$/, '');
const HOST = new URL(KOK_URL).host;
const SIR = process.env.CRON_SECRET || process.env.KTP_CRON_SECRET || '';
const AUTH = SIR ? { authorization: 'Bearer ' + SIR } : {};
const uyku = ms => new Promise(r => setTimeout(r, ms));
const bugun = new Date();
const ayBasiPazartesi = bugun.getDay() === 1 && bugun.getDate() <= 7;
const KIP = (ARG.kip && ARG.kip !== '1' && ARG.kip !== '') ? ARG.kip : (ayBasiPazartesi ? 'ikisi' : 'hafta');
const ozet = [];
async function main() {
  if (!SIR) { ozet.push('CRON_SECRET yok — atlandı'); return 2; }
  let pw; try { pw = await import('playwright'); } catch (e) { ozet.push('playwright yok'); return 2; }
  const tarayici = await pw.chromium.launch(process.env.PW_CHROME ? { executablePath: process.env.PW_CHROME } : {});
  try {
    const ctx = await tarayici.newContext({ viewport: { width: 1440, height: 900 }, locale: 'tr-TR', timezoneId: 'Europe/Istanbul' });
    const yazildi = { ajanktp: 0, ai: 0 };
    await ctx.route('**/*', async (route) => {
      const req = route.request(); let u; try { u = new URL(req.url()); } catch (e) { return route.continue(); }
      if (u.host !== HOST) return route.continue();
      if (u.searchParams.get('mod') === 'mail') return route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":false,"err":"haftalik-not: mail yok"}' });
      if (req.method() !== 'GET' && u.pathname.startsWith('/api/')) {
        const izin = u.pathname.startsWith('/api/ajanktp') || (u.pathname.startsWith('/api/market') && u.searchParams.get('mod') === 'ai');
        if (!izin) return route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true,"haftalikBot":true}' });
        if (u.pathname.startsWith('/api/ajanktp')) yazildi.ajanktp++; else yazildi.ai++;
      }
      return route.continue({ headers: { ...req.headers(), ...AUTH } });
    });
    const sayfa = await ctx.newPage(); const hata = [];
    sayfa.on('pageerror', e => hata.push(String(e.message || e).slice(0, 160)));
    await sayfa.goto(KOK_URL + '/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await sayfa.waitForLoadState('networkidle', { timeout: 45000 }).catch(() => {});
    if (await sayfa.locator('form[action="/giris"]').count()) { ozet.push('giriş sayfasına takıldı (Bearer muafiyeti yok)'); return 1; }
    await uyku(25000);   /* canlı kartlar (EVDS, Yahoo, taktik model) dolsun — not bunlardan yazılır */
    /* Haftalık Yorum'un bulunduğu sekmeyi aç (kartlar DOM'da zaten var; yine de görünür olsun) */
    await sayfa.evaluate(() => { const b = document.querySelector('nav.tabs button[data-tab="t2"]'); b && b.click(); const s = document.querySelector('.subtab-btn[data-sub="mk-yorum"]'); s && s.click(); }).catch(() => {});
    await uyku(3000);
    /* EMNİYET: api/ajanktp mod=yaz bulut hafızayı BÜTÜNÜYLE değiştirir (KV SET). Taze tarayıcıda localStorage boş; not doğrudan yazılsa
       diğer tüm kayıtlar (kart notları, gündem, taktik) silinirdi. Önce bulut hafıza yerel depoya indirilir; yoksa HİÇ yazılmaz. */
    const bulut = await sayfa.evaluate(async () => { try { if (typeof notlariGeriYukle === 'function') await notlariGeriYukle(); const k = JSON.parse(localStorage.getItem('ajan_notlar') || '{}'); return Object.keys(k).length; } catch (e) { return -1; } });
    if (!(bulut > 0)) { ozet.push('bulut hafıza okunamadı (' + bulut + ' kayıt) — üzerine yazma riski, not YAZILMADI'); return 1; }
    ozet.push('bulut hafıza yüklendi: ' + bulut + ' kayıt');
    const kipler = KIP === 'ikisi' ? ['hafta', 'ay'] : [KIP];
    for (const kip of kipler) {
      const oncekiTs = await sayfa.evaluate(() => { try { const k = JSON.parse(localStorage.getItem('ajan_notlar') || '{}'); return (k.__HAFTALIK__ || {}).ts || 0; } catch (e) { return 0; } });
      const sonuc = await sayfa.evaluate(async (kip) => { if (typeof haftalikYorumYaz !== 'function') return 'fonksiyon yok'; try { await haftalikYorumYaz(true, kip); return 'çağrıldı'; } catch (e) { return 'hata: ' + String(e && e.message || e).slice(0, 120); } }, kip);
      await uyku(8000);   /* notKaydet → bulut yazımı tamamlansın */
      const durum = await sayfa.evaluate((kip) => { try { const k = JSON.parse(localStorage.getItem('ajan_notlar') || '{}'); const K = k[kip === 'ay' ? '__AYLIK__' : '__HAFTALIK__'] || {}; const log = (window.AJAN && AJAN.log || []).slice(0, 4); return { ts: K.ts || 0, etiket: K.etiket || '', uzunluk: (K.html || '').length, log }; } catch (e) { return { hata: String(e) }; } }, kip);
      const yeni = durum.ts && durum.ts > oncekiTs;
      ozet.push((kip === 'ay' ? 'AYLIK' : 'HAFTALIK') + ': ' + sonuc + ' · ' + (yeni ? 'YAZILDI "' + durum.etiket + '" (' + durum.uzunluk + ' kr)' : 'yazılmadı') + ' · ajan günlüğü: ' + (durum.log || []).join(' | ').slice(0, 300));
      if (!yeni) { await fs.mkdir('rapor', { recursive: true }); await sayfa.screenshot({ path: 'rapor/haftalik-not-hata.png', fullPage: false }).catch(() => {}); }
    }
    ozet.push('bulut yazımı ' + yazildi.ajanktp + ' · AI çağrısı ' + yazildi.ai + (hata.length ? ' · JS hatası: ' + hata.slice(0, 2).join(' | ') : ''));
    return ozet.some(x => /YAZILDI/.test(x)) ? 0 : 1;
  } finally { await tarayici.close().catch(() => {}); }
}
const kod = await main().catch(e => { ozet.push('✗ ' + String(e && e.message || e).slice(0, 200)); return 1; });
const metin = '# Haftalık not — ' + bugun.toISOString().slice(0, 10) + '\n\n' + ozet.map(x => '- ' + x).join('\n') + '\n';
await fs.mkdir('rapor', { recursive: true }); await fs.writeFile(path.join('rapor', 'haftalik-not.md'), metin, 'utf8');
if (process.env.GITHUB_STEP_SUMMARY) await fs.appendFile(process.env.GITHUB_STEP_SUMMARY, metin);
if (process.env.GITHUB_OUTPUT) await fs.appendFile(process.env.GITHUB_OUTPUT, 'ozet=' + ozet.join(' · ').replace(/\n/g, ' ').slice(0, 180) + '\n');
console.log(metin);
process.exit(kod);
