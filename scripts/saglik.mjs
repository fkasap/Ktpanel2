#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════════════════════════
   §509 SAĞLIK BEKÇİSİ (24 Eki 2026) — panelin kendini denetleyen katmanı
   ─────────────────────────────────────────────────────────────────────────────────────────────
   NEDEN: 24 Eki elle taramasında bulunan hataların çoğu SESSİZ KIRILMAYDI — TP.PF.FF.GUN günlerce
   boş döndü ve panel uyarısız BIS yedeğine (37, yanlış) düştü; EVDS3 tarih biçimini değiştirdi ve eğri
   Δ sütunu sessizce "—" oldu; EREGL bilanço açıklayınca karar motoru 2023Q4'e kaydı. Hepsi kullanıcı
   ya da elle tarama ile yakalandı, sistemle DEĞİL. Yaşayan sistem bunu kendisi yakalamalı.

   İLKE: el ile tutulan eşik/liste YOK — her şey KENDİ KENDİNE KALİBRE olur:
     1 SERİLER   — app.js içinde geçen her EVDS seri kodu otomatik keşfedilir (yeni seri eklenince
                   kendiliğinden izlenir). Bayatlık eşiği serinin KENDİ gözlem aralığından çıkar
                   (günlük → 7 gün, haftalık → 21, aylık → ~95, çeyreklik → ~250 gün).
     2 DOSYALAR  — ktpanel/*.json için bot (ktpanel-bot) commit geçmişinden ritim (medyan aralık)
                   öğrenilir; ritmin 3 katını aşan dosya "otomasyon durmuş" sayılır. Bot hiç yazmamış
                   dosyalar = OTOMASYON BORCU listesi (elle güncellenenler) — yaş ile raporlanır.
     3 KÖPRÜLER  — test/kopru-testi.js (şema doğrulaması) her gün koşar, sonuçları buraya akar.
     4 TUTARLILIK— aynı büyüklüğün iki kaynağı uyuşuyor mu (damga ↔ canlı) · iş gününde eğri Δ var mı.
     5 EKRAN     — Playwright ile panel açılır, her sekme ve alt sekme tıklanır; "veri yok/alınamadı/
                   NaN/undefined" türü ekran hataları ve JS istisnaları toplanır. Önceki koşuyla
                   karşılaştırılır: YENİ olan öne çıkar, süregelen "kaç gündür" bilgisiyle listelenir.
   GÜVENLİK (ekran katmanı): CRON_SECRET yalnız panelin kendi alan adına giden isteklere eklenir
   (üçüncü taraf CDN/Yahoo'ya SIZMAZ). Bot hiçbir şey YAZMAZ: /api/data yazımları, mail ve
   /api/ajanktp (AI maliyeti) taklit yanıtla kesilir.
   ÇIKTI: ktpanel/saglik.json (panel "Veri Durumu" çekmecesi okur) · rapor/saglik.md · YENİ kritik
   bulgu varsa mail (Resend köprüsü /api/data?mod=mail, MAIL_TO'ya).
   KULLANIM: CRON_SECRET=… GITHUB_TOKEN=… node scripts/saglik.mjs [--ekran=0] [--mail=0]
   ═══════════════════════════════════════════════════════════════════════════════════════════════ */
import fs from 'node:fs/promises';
import fss from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const ARG = Object.fromEntries(process.argv.slice(2).map(a => { const m = a.match(/^--([^=]+)(?:=(.*))?$/); return m ? [m[1], m[2] ?? '1'] : [a, '1']; }));
const KOK_URL = (process.env.KTP_URL || 'https://ktpanel.vercel.app').replace(/\/$/, '');
const HOST = new URL(KOK_URL).host;
const SIR = process.env.CRON_SECRET || process.env.KTP_CRON_SECRET || '';
const REPO = process.env.GITHUB_REPOSITORY || 'fkasap/Ktpanel2';
const GH = process.env.GITHUB_TOKEN || '';
const DIZIN = ['ktpanel', '.'].find(d => fss.existsSync(path.join(d, 'app.js')) && fss.existsSync(path.join(d, 'index.html'))) || 'ktpanel';
const CIKTI = path.join(DIZIN, 'saglik.json');
const T0 = Date.now();
const simdi = new Date();
const bugunISO = simdi.toISOString().slice(0, 10);
const AUTH = SIR ? { authorization: 'Bearer ' + SIR } : {};

const bulgular = [];          /* {id, seviye:'kritik'|'uyari'|'bilgi', katman, baslik, ayrinti} */
const ekle = (seviye, katman, id, baslik, ayrinti) => bulgular.push({ id: katman + ':' + id, seviye, katman, baslik, ayrinti: ayrinti || '' });
const katmanDurum = {};       /* katman → {sure, not} */
const uyku = ms => new Promise(r => setTimeout(r, ms));
const gunFark = (a, b) => Math.round((b - a) / 864e5);
const isGunuFark = (a, b) => { let n = 0; const d = new Date(Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate())); const son = Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate());
  while (d.getTime() < son) { d.setUTCDate(d.getUTCDate() + 1); const g = d.getUTCDay(); if (g !== 0 && g !== 6) n++; } return n; };
const medyan = a => { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
async function havuz(liste, n, is) { const sonuc = []; let i = 0; await Promise.all(Array.from({ length: n }, async () => { while (i < liste.length) { const k = i++; sonuc[k] = await is(liste[k], k); } })); return sonuc; }
async function jget(u, ek = {}, ms = 45000) { const r = await fetch(u, { headers: { ...AUTH, ...ek }, signal: AbortSignal.timeout(ms) }); const t = await r.text(); let j = null; try { j = JSON.parse(t); } catch (e) {} return { durum: r.status, j, t }; }

/* EVDS tarih biçimleri (hepsi ölçüldü): "24-10-2026" / "24.10.2026" günlük · "2026-9" aylık · "2026-Q3"/"2026 Ç3" çeyrek · "2026" yıl */
function tarihCoz(s) {
  s = String(s || '').trim(); let m;
  if ((m = s.match(/^(\d{1,2})[-./](\d{1,2})[-./](\d{4})$/))) return new Date(Date.UTC(+m[3], +m[2] - 1, +m[1]));
  if ((m = s.match(/^(\d{4})-(\d{2})-(\d{2})/))) return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  if ((m = s.match(/^(\d{4})[-\s]*(?:Q|Ç|C)\s*([1-4])$/i))) return new Date(Date.UTC(+m[1], (+m[2] - 1) * 3, 1));
  if ((m = s.match(/^(\d{4})-(\d{1,2})$/))) return new Date(Date.UTC(+m[1], +m[2] - 1, 1));
  if ((m = s.match(/^(\d{4})$/))) return new Date(Date.UTC(+m[1], 0, 1));
  return null;
}

/* ── 1 · SERİLER ─────────────────────────────────────────────────────────────────────────────── */
async function katmanSeriler(appSrc) {
  const t = Date.now();
  const kodlar = [...new Set([...appSrc.matchAll(/['"](TP\.[A-Z0-9_.]+)['"]/g)].map(m => m[1]))].sort();
  /* Bilerek durmuş seriler kodun YANINDA işaretlenir (el ile liste yok): yorum içinde "saglik:tarihsel TP.X TP.Y" */
  const tarihsel = new Set(); for (const m of appSrc.matchAll(/saglik:tarihsel\s+((?:TP\.[A-Z0-9_.]+[\s,]*)+)/g)) for (const k of m[1].match(/TP\.[A-Z0-9_.]+/g) || []) tarihsel.add(k.replace(/\.$/, ''));
  const yedekler = new Set(); for (const m of appSrc.matchAll(/yedek\s*:\s*\[([^\]]*)\]/g)) for (const k of m[1].matchAll(/['"](TP\.[A-Z0-9_.]+)['"]/g)) yedekler.add(k[1]);
  const sonuc = {};
  if (!SIR) { katmanDurum.seriler = { sure: 0, not: 'CRON_SECRET yok — atlandı' }; ekle('kritik', 'seriler', 'sir', 'CRON_SECRET tanımsız', 'Seri denetimi panel köprüsünden yapılır; Actions secret CRON_SECRET gerekli.'); return sonuc; }
  await havuz(kodlar, 4, async (kod) => {
    const rol = yedekler.has(kod) ? 'yedek' : 'birincil';
    try {
      const { durum, j } = await jget(KOK_URL + '/api/evds2?series=' + encodeURIComponent(kod) + '&gun=800&full=1');
      if (durum !== 200 || !j) { ekle(rol === 'yedek' ? 'uyari' : 'kritik', 'seriler', kod, kod + ' köprü HTTP ' + durum, ''); sonuc[kod] = { rol, durum: 'hata' }; return; }
      const alan = kod.replace(/\./g, '_');
      const gozlem = (j.ham || []).filter(x => x && x[alan] != null && x[alan] !== '').map(x => ({ t: tarihCoz(x.Tarih), v: parseFloat(String(x[alan]).replace(',', '.')) })).filter(x => x.t && Number.isFinite(x.v)).sort((a, b) => a.t - b.t);
      const son = j.son && j.son[kod];
      if (!gozlem.length && !(son && son.deger != null)) {
        ekle(rol === 'yedek' ? 'uyari' : 'kritik', 'seriler', kod, kod + ' BOŞ dönüyor' + (rol === 'yedek' ? ' (yedek seri)' : ' — panel yedeğe düşer ya da kart boşalır'), 'EVDS 800 günlük pencerede tek gözlem yok. Seri kodu değişmiş/emekli olmuş olabilir; EVDS3 aramasıyla yerine geçen seri bulunmalı.');
        sonuc[kod] = { rol, durum: 'bos' }; return;
      }
      const tarihler = gozlem.map(x => x.t);
      const araliklar = []; for (let i = 1; i < tarihler.length; i++) araliklar.push(gunFark(tarihler[i - 1], tarihler[i]));
      const g = medyan(araliklar.slice(-24)) || 30;
      const sonT = tarihler.length ? tarihler[tarihler.length - 1] : tarihCoz(son.tarih);
      const yas = sonT ? gunFark(sonT, simdi) : null;
      const limit = g <= 3 ? 7 : g <= 10 ? 21 : Math.round(g * 2.5 + 20);
      const siklik = g <= 3 ? 'günlük' : g <= 10 ? 'haftalık' : g <= 40 ? 'aylık' : g <= 120 ? 'çeyreklik' : 'yıllık';
      sonuc[kod] = { rol, durum: 'ok', siklik, son: gozlem.length ? gozlem[gozlem.length - 1].v : (son && son.deger), tarih: sonT ? sonT.toISOString().slice(0, 10) : null, yas, limit };
      /* §517: aylık seride 12 ay önceki gözlem varsa yıllık % (endeks → enflasyon): damga↔canlı denetimi TÜFE'yi bununla kıyaslar */
      if (siklik === 'aylık' && gozlem.length >= 13) { const a = gozlem[gozlem.length - 1], b = gozlem[gozlem.length - 13]; if (b.v > 0 && gunFark(b.t, a.t) > 330 && gunFark(b.t, a.t) < 400) sonuc[kod].yy = +((a.v / b.v - 1) * 100).toFixed(2); }
      if (tarihsel.has(kod)) sonuc[kod].tarihsel = true;
      if (yas != null && yas > limit && !tarihsel.has(kod)) {
        sonuc[kod].durum = 'bayat';
        ekle('uyari', 'seriler', kod, kod + ' BAYAT — son gözlem ' + sonuc[kod].tarih + ' (' + yas + ' gün; ' + siklik + ' seri için eşik ' + limit + ')', 'Eşik serinin kendi gözlem aralığından türetildi (medyan ' + g + ' gün). Kaynak yayını durdurmuş ya da seri yeniden kodlanmış olabilir.');
      }
    } catch (e) { ekle(rol === 'yedek' ? 'uyari' : 'kritik', 'seriler', kod, kod + ' köprü hatası', String(e.message || e).slice(0, 120)); sonuc[kod] = { rol, durum: 'hata' }; }
  });
  katmanDurum.seriler = { sure: Math.round((Date.now() - t) / 1000), not: kodlar.length + ' seri (app.js\'ten keşfedildi)' };
  return sonuc;
}

/* ── 2 · DOSYALAR ────────────────────────────────────────────────────────────────────────────── */
async function katmanDosyalar() {
  const t = Date.now();
  const atla = new Set(['saglik.json', 'package.json', 'package-lock.json', 'vercel.json']);
  const dosyalar = (await fs.readdir(DIZIN)).filter(f => /\.(json|csv)$/.test(f) && !atla.has(f)).sort();
  const onek = DIZIN === '.' ? '' : DIZIN + '/';
  const oto = [], borc = []; let hata = 0, sonHata = '';
  await havuz(dosyalar, 4, async (f) => {
    try {
      const r = await fetch('https://api.github.com/repos/' + REPO + '/commits?per_page=30&path=' + encodeURIComponent(onek + f), { headers: { accept: 'application/vnd.github+json', ...(GH ? { authorization: 'Bearer ' + GH } : {}) }, signal: AbortSignal.timeout(20000) });
      if (!r.ok) { hata++; sonHata = 'HTTP ' + r.status; return; }
      const C = await r.json(); if (!Array.isArray(C) || !C.length) return;
      const bot = C.filter(c => c.commit && c.commit.author && c.commit.author.name === 'ktpanel-bot').map(c => new Date(c.commit.committer.date)).sort((a, b) => a - b);
      const sonHerhangi = new Date(C[0].commit.committer.date);
      if (bot.length < 3) { borc.push({ dosya: f, son: sonHerhangi.toISOString().slice(0, 10), gun: gunFark(sonHerhangi, simdi), bot: bot.length }); return; }
      const ar = []; for (let i = 1; i < bot.length; i++) { const d = isGunuFark(bot[i - 1], bot[i]); if (d > 0) ar.push(d); }
      const m = medyan(ar) || 1;
      const sonBot = bot[bot.length - 1];
      const yas = isGunuFark(sonBot, simdi);
      const limit = Math.max(3, Math.ceil(m * 3));
      const kayit = { dosya: f, son: sonBot.toISOString().slice(0, 10), isGunu: yas, ritim: m, limit };
      oto.push(kayit);
      if (yas > limit) ekle(yas > limit * 3 ? 'kritik' : 'uyari', 'dosyalar', f, f + ' otomasyonu durmuş görünüyor — bot son ' + kayit.son + ' yazdı (' + yas + ' iş günü; ritmi ~' + m + ' iş günü, eşik ' + limit + ')', 'Ritim bot commit geçmişinden öğrenildi. Katman tazele.mjs içinde atlanıyor, hata veriyor ya da veri değişmediği için commit edilmiyor olabilir — rapor/son-tazeleme.md\'ye bak.');
    } catch (e) { hata++; sonHata = String(e.message || e).slice(0, 60); }
  });
  if (hata) ekle(hata > dosyalar.length / 2 ? 'kritik' : 'uyari', 'dosyalar', 'github-api', 'Dosya geçmişi okunamadı: ' + hata + '/' + dosyalar.length + ' dosya', sonHata);
  borc.sort((a, b) => b.gun - a.gun);
  katmanDurum.dosyalar = { sure: Math.round((Date.now() - t) / 1000), not: oto.length + ' otomatik dosya izlendi · ' + borc.length + ' elle güncellenen (otomasyon borcu)' };
  return { oto: oto.sort((a, b) => a.dosya < b.dosya ? -1 : 1), borc };
}

/* ── 3 · KÖPRÜLER (test/kopru-testi.js) ──────────────────────────────────────────────────────── */
async function katmanKopruler(onceki) {
  const t = Date.now();
  const test = path.join(DIZIN, 'test', 'kopru-testi.js');
  if (!fss.existsSync(test) || !SIR) { katmanDurum.kopruler = { sure: 0, not: !SIR ? 'CRON_SECRET yok — atlandı' : 'test dosyası yok' }; return []; }
  const jsonYol = path.join(process.env.RUNNER_TEMP || '/tmp', 'kopru-' + process.pid + '.json');
  await new Promise(coz => { const p = spawn(process.execPath, [test], { env: { ...process.env, KOPRU_JSON: jsonYol }, stdio: ['ignore', 'ignore', 'ignore'] });
    const z = setTimeout(() => { try { p.kill('SIGKILL'); } catch (e) {} coz(); }, 240000); p.on('exit', () => { clearTimeout(z); coz(); }); });
  let S = []; try { S = JSON.parse(await fs.readFile(jsonYol, 'utf8')); } catch (e) { ekle('uyari', 'kopruler', 'cikti', 'Köprü testi çıktı üretmedi', 'test/kopru-testi.js KOPRU_JSON desteği yüklü mü?'); }
  /* §509c: köprü UYARISI da iki tur onayından geçer (AV kotası, HKMA 502 gibi tek turluk kaynak hıçkırıkları); kritik uçta HATA anında. */
  const eskiK = new Set(((onceki && onceki.kopruler) || []).filter(x => x.sonuc !== 'GECTI').map(x => x.ad));
  for (const x of S) {
    if (x.sonuc === 'GECTI') continue;
    const sert = (x.sonuc === 'HATA' || x.sonuc === 'KIMLIK');
    const sev = sert && x.kritik ? 'kritik' : (sert || eskiK.has(x.ad)) ? 'uyari' : 'bilgi';
    ekle(sev, 'kopruler', x.ad, x.ad + ' — ' + (x.sonuc === 'KIMLIK' ? 'kimlik (401)' : x.sonuc.toLowerCase()), (x.not || '') + (sev === 'bilgi' ? ' · ilk tur — bir sonraki turda da sürerse uyarı' : ''));
  }
  katmanDurum.kopruler = { sure: Math.round((Date.now() - t) / 1000), not: S.length + ' uç · ' + S.filter(x => x.sonuc === 'GECTI').length + ' geçti' };
  return S.map(x => ({ ad: x.ad, sonuc: x.sonuc, ms: x.ms, not: x.not || '' }));
}

/* ── 4 · TUTARLILIK ──────────────────────────────────────────────────────────────────────────── */
async function katmanTutarlilik(appSrc, seriler) {
  const t = Date.now(); let n = 0;
  /* (a) Politika faizi: elle damga ↔ TCMB serisi. Damga, canlı düşerse gösterilen değerdir — eskirse sessizce yanlış basar. */
  const dm = appSrc.match(/POLITIKA_DAMGA\s*=\s*\{\s*deger\s*:\s*([\d.]+)/); const canli = seriler['TP.PY.P02.1H'];
  if (dm && canli && canli.durum === 'ok') { n++; if (Math.abs(+dm[1] - canli.son) > 0.01) ekle('uyari', 'tutarlilik', 'politika-damga', 'Politika faizi damgası %' + dm[1] + ' ↔ TCMB canlı %' + canli.son + ' (' + canli.tarih + ')', 'app.js POLITIKA_DAMGA yeni PPK kararına göre eskimiş; canlı kaynak düşerse panel eski oranı basar.'); }
  /* (b) Getiri eğrisi: iş gününde Günlük Δ hepsi boşsa tarih/konvansiyon ayrıştırması kırılmıştır (§503 sınıfı). */
  if (SIR) { try { n++; const { j } = await jget(KOK_URL + '/api/evds2?mod=egri');
      const V = (j && j.vadeler) || {}; const dl = Object.values(V).map(v => v && v.delta);
      if (dl.length && dl.every(d => d == null) && isGunuFark(new Date(Date.now() - 864e5 * 4), simdi) >= 2) ekle('uyari', 'tutarlilik', 'egri-delta', 'Getiri eğrisi: ' + dl.length + ' vadenin hepsinde Günlük Δ boş', 'egri.js önceki gözlemi eşleyemiyor (tarih biçimi/aralık). §503 benzeri.');
      if (!j || !j.ok) ekle('kritik', 'tutarlilik', 'egri', 'Getiri eğrisi köprüsü ok:false', (j && j.err) || ''); } catch (e) {} }
  katmanDurum.tutarlilik = { sure: Math.round((Date.now() - t) / 1000), not: n + ' kural' };
}

/* ── 5 · EKRAN (Playwright) ──────────────────────────────────────────────────────────────────── */
async function katmanEkran(onceki, seriler) {
  const t = Date.now();
  if (ARG.ekran === '0') { katmanDurum.ekran = { sure: 0, not: 'kapalı (--ekran=0)' }; return null; }
  if (!SIR) { katmanDurum.ekran = { sure: 0, not: 'CRON_SECRET yok — atlandı' }; return null; }
  let pw; try { pw = await import('playwright'); } catch (e) { katmanDurum.ekran = { sure: 0, not: 'playwright yok — atlandı' }; return null; }
  const BUTCE = 7 * 60 * 1000;
  const tarayici = await pw.chromium.launch(process.env.PW_CHROME ? { executablePath: process.env.PW_CHROME } : {});
  const sonuc = { sekmeler: {}, jsHata: [], konsol: [] };
  try {
    const ctx = await tarayici.newContext({ viewport: { width: 1440, height: 900 }, locale: 'tr-TR', timezoneId: 'Europe/Istanbul' });
    await ctx.route('**/*', async (route) => {
      const req = route.request(); let u; try { u = new URL(req.url()); } catch (e) { return route.continue(); }
      if (u.host !== HOST) return route.continue();                         /* sır üçüncü tarafa GİTMEZ */
      const sahte = (o) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(o) });
      if (u.pathname.startsWith('/api/ajanktp')) return sahte({ ok: false, err: 'saglik-bot: AI çağrısı yapılmaz' });
      if (u.searchParams.get('mod') === 'mail') return sahte({ ok: false, err: 'saglik-bot: mail yok' });
      if (req.method() !== 'GET' && u.pathname.startsWith('/api/')) return sahte({ ok: true, saglikBot: true });
      return route.continue({ headers: { ...req.headers(), ...AUTH } });
    });
    const sayfa = await ctx.newPage();
    sayfa.on('pageerror', e => { if (sonuc.jsHata.length < 30) sonuc.jsHata.push(String(e.message || e).slice(0, 200)); });
    sayfa.on('console', m => { if (m.type() === 'error' && sonuc.konsol.length < 40) sonuc.konsol.push(m.text().slice(0, 200)); });
    await sayfa.goto(KOK_URL + '/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await sayfa.waitForLoadState('networkidle', { timeout: 45000 }).catch(() => {});
    await uyku(6000);
    if (await sayfa.locator('form[action="/giris"]').count()) { ekle('kritik', 'ekran', 'giris', 'Bekçi giriş sayfasına takıldı', 'Middleware Bearer CRON_SECRET muafiyeti çalışmıyor.'); return sonuc; }
    /* sekme listesi: aynı data-tab'ı taşıyan iki düğme olabilir (EQUITY grup başlığı + Yönetim) → sıra numarasıyla */
    const sekmeler = await sayfa.$$eval('[data-tab]', bs => bs.map((b, i) => ({ i, tab: b.dataset.tab, ad: b.textContent.trim().slice(0, 30) })));
    const tara = async () => sayfa.evaluate(() => {
      const kok = [...document.querySelectorAll('[id]')].filter(e => /^t\d+$/.test(e.id) && e.offsetParent)[0]; if (!kok) return { kok: null, isaret: [] };
      /* İki sınıf: TEKNİK izler her uzunlukta hatadır; DOĞAL DİL kalıpları yalnız kısa etiket/hücrede (≤90 karakter) —
         AI notu ya da haber metni "başarısız/bulunamadı" kelimesini doğal olarak içerebilir (ilk denemede Earnings AI yanlış alarmı). */
      const TEK = /(\bundefined\b|\bNaN\b|Invalid Date|\[object Object\]|HTTP [45]\d\d|JSON BOZUK|sunucuda YOK)/;
      const DOG = /(veri yok|alınamadı|alinamadi|yüklenemedi|bulunamadı|erişilemedi|başarısız|bağlantı hatası)/i;
      const RX = { test: s => TEK.test(s) || (s.length <= 90 && DOG.test(s)) };
      const out = new Set(); const w = document.createTreeWalker(kok, NodeFilter.SHOW_TEXT); let n;
      while ((n = w.nextNode())) { const el = n.parentElement; if (!el || !el.offsetParent) continue; const s = n.textContent.replace(/\s+/g, ' ').trim(); if (!s || s.length > 220 || !RX.test(s)) continue;
        if (/saglik-bot/.test(s)) continue;                                   /* bekçinin kendi kestiği çağrılar */
        const c = el.closest('.card,.kv,tr,li,.note,.sub') || el; out.add((c.textContent || s).replace(/\s+/g, ' ').trim().slice(0, 180)); }
      return { kok: kok.id, isaret: [...out].slice(0, 15) };
    });
    for (const s of sekmeler) {
      if (Date.now() - t > BUTCE) { sonuc.yarim = true; break; }
      try {
        /* JS ile tıklanır: EQUITY alt sekmeleri gizli alt menüde (#pySubnav) durur, görünür tıklama zaman aşımına düşüyordu */
        await sayfa.locator('[data-tab]').nth(s.i).evaluate(b => b.click(), null, { timeout: 5000 }); await uyku(6500);
        const r = await tara(); const anahtar = s.tab + '·' + s.ad;
        sonuc.sekmeler[anahtar] = r.isaret;
        const alt = await sayfa.$$eval('[data-subtab]', bs => bs.filter(b => b.offsetParent).map(b => ({ st: b.dataset.subtab, ad: b.textContent.trim().slice(0, 30) })));
        for (const a of alt) {
          if (Date.now() - t > BUTCE) { sonuc.yarim = true; break; }
          await sayfa.locator('[data-subtab="' + a.st + '"]').first().evaluate(b => b.click()).catch(() => {}); await uyku(6000);
          const r2 = await tara(); sonuc.sekmeler[anahtar + ' › ' + a.ad] = r2.isaret;
        }
      } catch (e) { sonuc.sekmeler[s.tab + '·' + s.ad] = ['(bekçi: sekme açılamadı — ' + String(e.message || e).slice(0, 60) + ')']; }
    }
    /* ── §517 DAMGA ↔ CANLI: tüm sekmeler gezildikten sonra DOM'un TAMAMI (gizli sekmeler dahil — elle damga HTML'de durur) taranır.
       Canlı serisi olan büyüklük bir satırda/cümlede başka değerle yazılmışsa uyarı. Bugün üç kart bu sınıftan çıktı (§459a · §493 · §514).
       Kurallar serilerden kurulur; seri yoksa kural düşer (uydurma kıyas yok). */
    const S = seriler || {}; const KUR = [];
    const p1 = S['TP.PY.P02.1H']; if (p1 && p1.durum === 'ok') KUR.push({ ad: 'politika faizi', rx: 'politika faiz', deger: p1.son, tol: 0.01, kaynak: 'TP.PY.P02.1H ' + p1.tarih });
    const tf = S['TP.TUKFIY2025.GENEL']; if (tf && tf.yy != null) KUR.push({ ad: 'TÜFE yıllık', rx: 'TÜFE[^.%]{0,25}yıllık|yıllık (?:TÜFE|enflasyon)|enflasyon yıllık', deger: tf.yy, tol: 0.2, kaynak: 'TP.TUKFIY2025.GENEL y/y ' + tf.tarih });
    if (KUR.length) {
      sonuc.damga = await sayfa.evaluate((KUR) => {
        const sayi = t => { const m = String(t).match(/%\s?(\d{1,2}(?:[.,]\d{1,2})?)(?!\d)|(\d{1,2}(?:[.,]\d{1,2})?)\s?%/); return m ? parseFloat((m[1] || m[2]).replace(',', '.')) : null; };
        const out = [];
        /* Kapsam: yalnız TÜRKİYE büyüklükleri — yabancı merkez bankası sekmeleri (Asya t16 · ABD t17 · Avrupa t18) dışarıda.
           Beklenti/tahmin/fark bağlamı da dışarıda ("yıl sonu ≈%34,7", "politika faizine makas") — onlar güncel değer iddia etmez. */
        const YABANCI = el => !!el.closest('#t16,#t17,#t18');
        const HARIC = /yıl sonu|beklenti|beklenen|tahmin|medyan|hedef|≈|~%|makas|fark|forward|ima|anket|senaryo|patika/i;
        for (const k of KUR) { const R = new RegExp(k.rx, 'i');
          /* (a) anahtar-değer satırı: .kv içinde etiket kuralı tutar, değer hücresindeki ilk % sayısı */
          document.querySelectorAll('.kv').forEach(kv => { const et = kv.querySelector('.k'); if (!et || !R.test(et.textContent) || YABANCI(kv) || kv.closest('details') || HARIC.test(et.textContent)) return;
            const d = kv.cloneNode(true); d.querySelector('.k').remove(); const v = sayi(d.textContent);
            if (v != null && Math.abs(v - k.deger) > k.tol) out.push({ kural: k.ad, deger: v, canli: k.deger, kaynak: k.kaynak, yer: (kv.closest('[id^=t],[id^=mk-],[id^=sv-],[id^=sk-],[id^=ft-]') || {}).id || '?', metin: kv.textContent.replace(/\s+/g, ' ').trim().slice(0, 140) }); });
          /* (b) düz metin: anahtar kelimeden sonraki 30 karakter içinde % sayısı (tarih geçen geçmiş cümleleri atlanır) */
          document.querySelectorAll('.note,p,li,.sub').forEach(el => { if (el.closest('.kv') || YABANCI(el) || el.closest('details')) return;
            String(el.textContent).replace(/\s+/g, ' ').split(/(?<=[.;!?])\s+/).forEach(c => { const m = c.match(R); if (!m) return;
              const sonra = c.slice(m.index + m[0].length, m.index + m[0].length + 30); if (/\b\d{1,2}\s(?:Oca|Şub|Mar|Nis|May|Haz|Tem|Ağu|Eyl|Eki|Kas|Ara)/i.test(c) || HARIC.test(c.slice(Math.max(0, m.index - 25), m.index + m[0].length + 30))) return;
              const v = sayi(sonra); if (v != null && Math.abs(v - k.deger) > k.tol) out.push({ kural: k.ad, deger: v, canli: k.deger, kaynak: k.kaynak, yer: (el.closest('[id^=t],[id^=mk-],[id^=sv-],[id^=sk-],[id^=ft-]') || {}).id || '?', metin: c.slice(0, 160) }); }); });
        }
        const g = new Set(); return out.filter(x => { const a = x.kural + '|' + x.metin; if (g.has(a)) return false; g.add(a); return true; }).slice(0, 30);
      }, KUR).catch(e => [{ kural: 'bekçi', metin: 'damga taraması çöktü: ' + String(e.message || e).slice(0, 80) }]);
    }
    /* ── §521 ELLE KART YAŞI (24 Eki kart taraması): (1) "sıradaki/planlı/takvimde … <tarih>" ifadesinin tarihi GEÇMİŞSE kart eskimiştir
       (ECB "Sıradaki toplantı 29 Eki", BoJ "Sıradaki 29–30 Eki", Gündem "S&P CUMA" sınıfı); (2) elle basılmış kart etiketi (.tag.snap)
       30 günden eskiyse. Kural genel: yeni bir damgalı kart eklenince kendiliğinden kapsanır. Kuruluş/başlangıç etiketleri hariç. */
    sonuc.elleKart = await sayfa.evaluate(() => {
      const AY = { oca: 0, 'şub': 1, sub: 1, mar: 2, nis: 3, may: 4, haz: 5, tem: 6, 'ağu': 7, agu: 7, eyl: 8, eki: 9, kas: 10, ara: 11 };
      const simdi = new Date(); const bugun = new Date(simdi.getFullYear(), simdi.getMonth(), simdi.getDate());
      const tarih = (g, a, y) => { const m = AY[String(a).toLocaleLowerCase('tr-TR').slice(0, 3)]; if (m == null) return null; return new Date(y ? +y : bugun.getFullYear(), m, +g); };
      const kartAd = el => { const c = el.closest('.card'); const l = c && c.querySelector('.lbl'); return l ? l.childNodes[0].textContent.replace(/\s+/g, ' ').trim().slice(0, 50) : '?'; };
      const yer = el => (el.closest('[id^=t]') || {}).id || '?';
      const out = [];
      const RX = /(sıradaki[^.;|]{0,30}?|planlı değerlendirme|takvimde|bekleniyor|sonraki toplantı)\D{0,25}?(\d{1,2})(?:\s*[–-]\s*(\d{1,2}))?\s(Oca|Şub|Mar|Nis|May|Haz|Tem|Ağu|Eyl|Eki|Kas|Ara)[a-zçğıöşü]*\.?(?:\s(20\d\d))?/gi;
      document.querySelectorAll('.card .kv, .card .note').forEach(el => { if (el.closest('details')) return;   /* katlı arşiv notu (ör. Gündem eski elle not) taranmaz */
        const t = el.textContent.replace(/\s+/g, ' '); let m;
        while ((m = RX.exec(t))) { const d = tarih(m[3] || m[2], m[4], m[5]); if (!d) continue;
          if (!m[5] && d - bugun > 200 * 864e5) d.setFullYear(d.getFullYear() - 1);
          const gecen = Math.round((bugun - d) / 864e5);
          if (gecen >= 1 && gecen < 200) out.push({ tur: 'sıradaki', yer: yer(el), kart: kartAd(el), gun: gecen, metin: t.slice(Math.max(0, m.index - 10), m.index + m[0].length + 10).trim() }); }
      });
      document.querySelectorAll('.card .lbl .tag.snap').forEach(el => {
        const t = el.textContent.trim(); if (/KURULUŞ|BAŞLANGIÇ|KURULDU/i.test(t)) return;
        const m = t.match(/(\d{1,2})\s*(?:[–-]\s*\d{1,2}\s*)?(OCA|ŞUB|MAR|NİS|NIS|MAY|HAZ|TEM|AĞU|AGU|EYL|EKİ|EKI|KAS|ARA)/i); if (!m) return;
        const d = tarih(m[1], m[2]); if (!d) return; if (d > bugun) d.setFullYear(d.getFullYear() - 1);
        const gun = Math.round((bugun - d) / 864e5); if (gun > 30) out.push({ tur: 'etiket', yer: yer(el), kart: kartAd(el), gun, metin: t.slice(0, 90) });
      });
      const g = new Set(); return out.filter(x => { const a = x.tur + '|' + x.kart + '|' + x.metin; if (g.has(a)) return false; g.add(a); return true; }).slice(0, 40);
    }).catch(e => []);
  } finally { await tarayici.close().catch(() => {}); }
  /* yeni ↔ süregelen: önceki koşunun ekran işaretleriyle karşılaştır */
  const eskiS = (onceki && onceki.ekran && onceki.ekran.sekmeler) || {};
  /* §509b İKİ TUR ONAYI (ilk canlı koşu, 24 Eki 14:16): HKMA "HTTP 405" ve FRED "alınamadı" tek turluk kaynak hıçkırığıydı —
     dakikalar sonra ikisi de sağlamdı. Ekran işareti ilk turda BİLGİ ("gözlemde"), bir sonraki turda da duruyorsa UYARI olur.
     Sert kırılmaları seri/köprü katmanları zaten anında yakalar; JS istisnası da anında kritik. */
  for (const [sk, liste] of Object.entries(sonuc.sekmeler)) for (const x of liste) {
    const onceden = (eskiS[sk] || []).includes(x);
    if (/^\(bekçi:/.test(x)) { ekle('uyari', 'ekran', sk + '|' + x.slice(0, 60), sk + ': ' + x, 'Bekçinin kendi gezinme hatası.'); continue; }
    ekle(onceden ? 'uyari' : 'bilgi', 'ekran', sk + '|' + x.slice(0, 60), sk + ': ' + x, onceden ? 'En az iki turdur ekranda.' : 'İlk kez görüldü — bir sonraki turda da sürerse uyarıya yükselir.');
  }
  for (const x of (sonuc.elleKart || [])) ekle(x.tur === 'sıradaki' ? 'uyari' : 'bilgi', 'ekran', 'elle|' + x.tur + '|' + x.kart, (x.tur === 'sıradaki' ? 'Geçmiş tarihli "sıradaki" (' + x.yer + ' · ' + x.kart + '): ' + x.gun + ' gün önce' : 'Elle kart ' + x.gun + ' gündür güncellenmedi (' + x.yer + ' · ' + x.kart + ')'), '“' + x.metin + '” — elle yazılmış kart; olay geçti ya da etiket eskidi. Kart canlıya bağlanmalı ya da metin yenilenmeli.');
  for (const x of (sonuc.damga || [])) ekle('uyari', 'ekran', 'damga|' + x.kural + '|' + String(x.metin).slice(0, 60), 'Ekranda eski damga (' + x.yer + '): ' + x.kural + ' %' + x.deger + ' yazıyor, canlı %' + x.canli, '“' + x.metin + '” — kaynak ' + x.kaynak + '. Elle yazılmış rakam canlıdan sapmış; satır canlı seriye bağlanmalı ya da metin güncellenmeli.');
  const eskiJ = new Set((onceki && onceki.ekran && onceki.ekran.jsHata) || []);
  for (const e of sonuc.jsHata) ekle(eskiJ.has(e) ? 'uyari' : 'kritik', 'ekran', 'js|' + e.slice(0, 80), 'JS istisnası: ' + e, 'Sayfa kodunda yakalanmamış hata — bir kart ya da sekme hiç çizilmiyor olabilir.');
  katmanDurum.ekran = { sure: Math.round((Date.now() - t) / 1000), not: Object.keys(sonuc.sekmeler).length + ' sekme/alt sekme' + (sonuc.yarim ? ' (bütçe doldu, yarım)' : '') };
  return sonuc;
}

/* ── MAIL (yalnız YENİ kritik bulgu ya da düzelen kritik varsa; Cumartesi haftalık özet) ─────── */
async function mailAt(rapor, yeniKritik, duzelen) {
  if (ARG.mail === '0' || !SIR) return 'atlandı';
  const haftalik = simdi.getUTCDay() === 6;
  if (!yeniKritik.length && !duzelen.length && !haftalik) return 'gerek yok';
  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const satir = (b, renk) => '<tr><td style="padding:6px 10px;border-bottom:1px solid #E8EDF1;font:600 10px sans-serif;color:' + renk + ';white-space:nowrap">' + esc(b.katman) + '</td><td style="padding:6px 10px;border-bottom:1px solid #E8EDF1;font:400 12px sans-serif;color:#1B2733">' + esc(b.baslik) + (b.ayrinti ? '<br><span style="color:#6B7B8C;font-size:11px">' + esc(b.ayrinti) + '</span>' : '') + '</td></tr>';
  const blok = (bas, liste, renk) => liste.length ? '<div style="font:700 10px sans-serif;letter-spacing:1px;color:' + renk + ';margin:16px 0 6px">' + bas + ' (' + liste.length + ')</div><table width="100%" style="border-collapse:collapse;background:#fff;border:1px solid #E8EDF1">' + liste.map(b => satir(b, renk)).join('') + '</table>' : '';
  const kritik = rapor.bulgular.filter(b => b.seviye === 'kritik'), uyari = rapor.bulgular.filter(b => b.seviye === 'uyari');
  const html = '<div style="max-width:680px;margin:0 auto;padding:18px;background:#F6F8F9;font-family:sans-serif">' +
    '<div style="font:700 11px sans-serif;letter-spacing:1.4px;color:' + (kritik.length ? '#DE4B5E' : '#0FA26B') + '">KTPANEL · SAĞLIK BEKÇİSİ</div>' +
    '<div style="font:400 13px sans-serif;color:#1B2733;margin:8px 0">' + rapor.ozet.kritik + ' kritik · ' + rapor.ozet.uyari + ' uyarı · ' + rapor.ozet.bilgi + ' bilgi — ' + esc(rapor.guncelleme) + '</div>' +
    blok('YENİ KRİTİK', yeniKritik, '#DE4B5E') + blok('DÜZELDİ', duzelen, '#0FA26B') +
    (haftalik ? blok('SÜREGELEN KRİTİK', kritik.filter(b => !yeniKritik.includes(b)), '#DE4B5E') + blok('UYARILAR', uyari.slice(0, 25), '#E8933B') : '') +
    (rapor.borc && rapor.borc.length ? '<div style="font:400 11px sans-serif;color:#6B7B8C;margin-top:14px">Otomasyon borcu (elle güncellenen dosyalar): ' + rapor.borc.slice(0, 12).map(x => esc(x.dosya) + ' ' + x.gun + 'g').join(' · ') + '</div>' : '') +
    '<div style="font:400 10px sans-serif;color:#8896A5;margin-top:14px">Panelde: Veri Durumu çekmecesi › Sağlık Bekçisi · scripts/saglik.mjs §509</div></div>';
  const metin = rapor.bulgular.filter(b => b.seviye !== 'bilgi').map(b => '[' + b.seviye + '] ' + b.katman + ' · ' + b.baslik).join('\n');
  const konu = (yeniKritik.length ? '🔴 ' + yeniKritik.length + ' yeni kritik' : duzelen.length ? '✅ ' + duzelen.length + ' sorun düzeldi' : '📋 Haftalık sağlık özeti') + ' · KTPanel bekçisi · ' + rapor.ozet.kritik + 'K/' + rapor.ozet.uyari + 'U';
  try { const r = await fetch(KOK_URL + '/api/data?mod=mail', { method: 'POST', headers: { 'content-type': 'application/json', ...AUTH }, body: JSON.stringify({ subject: konu, html, text: metin }), signal: AbortSignal.timeout(30000) });
    const j = await r.json().catch(() => null); return j && j.ok ? 'gönderildi' : ('gönderilemedi: ' + ((j && j.err) || r.status)); } catch (e) { return 'gönderilemedi: ' + String(e.message || e).slice(0, 80); }
}

/* ── ANA AKIŞ ────────────────────────────────────────────────────────────────────────────────── */
(async () => {
  const appSrc = await fs.readFile(path.join(DIZIN, 'app.js'), 'utf8');
  let onceki = null; try { onceki = JSON.parse(await fs.readFile(CIKTI, 'utf8')); } catch (e) {}
  /* --sadece=ekran,seriler → yalnız seçilen katmanlar (elle teşhis için) */
  const SADECE = ARG.sadece ? new Set(String(ARG.sadece).split(',')) : null; const ac = k => !SADECE || SADECE.has(k);
  const guvenli = async (ad, f) => { if (!ac(ad)) { katmanDurum[ad] = { sure: 0, not: 'seçilmedi' }; return null; }
    try { return await f(); } catch (e) { ekle('uyari', 'bekci', ad, 'Bekçi katmanı çöktü: ' + ad, String(e.stack || e).slice(0, 200)); katmanDurum[ad] = { sure: 0, not: 'çöktü' }; return null; } };
  const seriler = (await guvenli('seriler', () => katmanSeriler(appSrc))) || {};
  const dosya = (await guvenli('dosyalar', () => katmanDosyalar())) || { oto: [], borc: [] };
  const kopru = (await guvenli('kopruler', () => katmanKopruler(onceki))) || [];
  await guvenli('tutarlilik', () => katmanTutarlilik(appSrc, seriler));
  const ekran = await guvenli('ekran', () => katmanEkran(onceki, seriler));

  /* Koşmayan katmanın (seçilmedi/atlandı/çöktü) önceki bulguları TAŞINIR — yoksa bir sonraki turda hepsi "yeni" ve
     "düzeldi" diye sahte bildirim üretirdi (ör. Playwright kurulamayan turda ekran bulguları). */
  const kosan = new Set(Object.entries(katmanDurum).filter(([, v]) => !/seçilmedi|atlandı|çöktü|kapalı/.test(v.not || '')).map(([k]) => k));
  kosan.add('bekci');   /* bekçinin kendi çökme notu taşınmaz — her tur yeniden üretilir */
  for (const b of ((onceki && onceki.bulgular) || [])) if (!kosan.has(b.katman) && !bulgular.some(x => x.id === b.id)) bulgular.push({ ...b, tasindi: true });
  /* ilk görülme + düzelen */
  const eskiB = new Map(((onceki && onceki.bulgular) || []).map(b => [b.id, b]));
  for (const b of bulgular) { const e = eskiB.get(b.id); b.ilk = e && e.ilk ? e.ilk : bugunISO; b.gun = gunFark(new Date(b.ilk + 'T00:00:00Z'), new Date(bugunISO + 'T00:00:00Z')); b.yeni = !e; }
  const simdiId = new Set(bulgular.map(b => b.id));
  const duzelen = [...eskiB.values()].filter(b => !simdiId.has(b.id) && b.seviye !== 'bilgi' && kosan.has(b.katman)).map(b => ({ ...b, duzeldi: bugunISO }));
  const SIRA = { kritik: 0, uyari: 1, bilgi: 2 };
  bulgular.sort((a, b) => SIRA[a.seviye] - SIRA[b.seviye] || (b.yeni - a.yeni) || a.id.localeCompare(b.id));
  const ozet = { kritik: bulgular.filter(b => b.seviye === 'kritik').length, uyari: bulgular.filter(b => b.seviye === 'uyari').length, bilgi: bulgular.filter(b => b.seviye === 'bilgi').length, yeni: bulgular.filter(b => b.yeni && b.seviye !== 'bilgi').length, duzelen: duzelen.length };
  const gecmis = [...(((onceki && onceki.gecmis) || []).filter(g => g.tarih !== bugunISO)), { tarih: bugunISO, kritik: ozet.kritik, uyari: ozet.uyari }].slice(-60);
  const rapor = {
    guncelleme: simdi.toISOString().slice(0, 19) + 'Z', surum: '§509', sure_sn: Math.round((Date.now() - T0) / 1000),
    ozet, katmanlar: katmanDurum, bulgular, duzelen: duzelen.concat(((onceki && onceki.duzelen) || []).filter(d => gunFark(new Date(d.duzeldi + 'T00:00:00Z'), simdi) <= 7 && !simdiId.has(d.id) && !duzelen.some(x => x.id === d.id))).slice(0, 40),
    seriler: kosan.has('seriler') ? seriler : ((onceki && onceki.seriler) || {}),
    dosyalar: kosan.has('dosyalar') ? dosya.oto : ((onceki && onceki.dosyalar) || []), borc: kosan.has('dosyalar') ? dosya.borc : ((onceki && onceki.borc) || []),
    kopruler: kosan.has('kopruler') ? kopru : ((onceki && onceki.kopruler) || []),
    ekran: ekran || (onceki && onceki.ekran ? { ...onceki.ekran, eski: true } : null), gecmis
  };
  const yeniKritik = bulgular.filter(b => b.yeni && b.seviye === 'kritik');
  rapor.mail = await mailAt(rapor, yeniKritik, duzelen.filter(d => d.seviye === 'kritik'));
  await fs.writeFile(CIKTI, JSON.stringify(rapor, null, 1) + '\n');

  /* insan okuması: rapor/saglik.md + Actions özeti */
  const md = ['# Sağlık bekçisi — ' + rapor.guncelleme, '', '**' + ozet.kritik + ' kritik · ' + ozet.uyari + ' uyarı · ' + ozet.bilgi + ' bilgi** · yeni ' + ozet.yeni + ' · düzelen ' + ozet.duzelen + ' · mail: ' + rapor.mail + ' · ' + rapor.sure_sn + ' sn', '',
    '| katman | süre | not |', '|---|---|---|', ...Object.entries(katmanDurum).map(([k, v]) => '| ' + k + ' | ' + v.sure + ' sn | ' + v.not + ' |'), '',
    ...bulgular.filter(b => b.seviye !== 'bilgi').map(b => '- ' + (b.seviye === 'kritik' ? '🔴' : '🟠') + (b.yeni ? ' **YENİ**' : ' (' + b.gun + ' gündür)') + ' `' + b.katman + '` ' + b.baslik),
    ...(duzelen.length ? ['', '### Düzelen', ...duzelen.map(d => '- ✅ `' + d.katman + '` ' + d.baslik)] : []),
    '', '### Otomasyon borcu (bot hiç yazmamış dosyalar)', ...dosya.borc.map(x => '- ' + x.dosya + ' — son ' + x.son + ' (' + x.gun + ' gün)')].join('\n');
  try { await fs.mkdir('rapor', { recursive: true }); await fs.writeFile('rapor/saglik.md', md + '\n'); } catch (e) {}
  if (process.env.GITHUB_STEP_SUMMARY) await fs.appendFile(process.env.GITHUB_STEP_SUMMARY, md + '\n').catch(() => {});
  if (process.env.GITHUB_OUTPUT) await fs.appendFile(process.env.GITHUB_OUTPUT, 'kritik=' + ozet.kritik + '\nyeni_kritik=' + yeniKritik.length + '\nozet=' + ozet.kritik + 'K/' + ozet.uyari + 'U\n').catch(() => {});
  console.log(md);
})().catch(e => { console.error('BEKÇİ ÇÖKTÜ:', e); process.exit(1); });
