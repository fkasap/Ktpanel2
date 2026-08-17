// KTPanel giriş koruması — Vercel Edge Middleware (fonksiyon kotasına DAHİL DEĞİL)
//
// ÇOK KULLANICI (28 Tem 2026): artık her kişinin kendi kimliği var ve bu kimlik
// çerezde taşınır; api/data.js kayıtları buna göre ayırır. Tek kutuya iki kişinin
// yazması sorunu (son yazan diğerini eziyordu) böyle kapandı.
//
// KİMLİK KAYNAĞI — sırayla denenir:
//   1) PANEL_USERS = "ahmet:sifre1,mehmet:sifre2"   (virgülle ayrık, ilk ':' böler)
//   2) PANEL_USER + PANEL_PASS                      (eski tek kullanıcı — hâlâ çalışır)
//   3) hiçbiri yoksa koruma KAPALI (panel kilitlenmez, depo eski ortak moda düşer)
//
// ÇEREZ: "<profil>|<imza>" · imza = SHA-256(kullanıcı|şifre|tuz)
//   Profil kısmı imzayla bağlıdır: kullanıcı adını değiştiren imzayı bozar, çerez düşer.
//   Eski çerezler (imzasız-profilli, düz imza) kabul edilir → kimse aniden atılmaz.
// Şifre değişince o kişinin eski oturumları otomatik geçersizleşir. Çıkış: /cikis
//
// DİKKAT: profil adı KV anahtarına girdiği için sadeleştirilir (Türkçe harfler
// çevrilir, a-z0-9_- dışı atılır). Yalnız noktalamayla ayrılan iki kullanıcı adı
// ("ahmet" ve "ahmet.") AYNI profile düşer ve verileri karışır — env yazarken
// kullanıcı adlarını sade ve birbirinden açıkça farklı tut.

export const config = { matcher: '/:path*' };

const COOKIE = 'ktp_oturum';
const TR = { 'ı':'i','İ':'i','ğ':'g','Ğ':'g','ü':'u','Ü':'u','ş':'s','Ş':'s','ö':'o','Ö':'o','ç':'c','Ç':'c' };

function profilAdi(u) {
  return String(u || '').replace(/[ıİğĞüÜşŞöÖçÇ]/g, c => TR[c])
    .toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 32) || 'kisi';
}

function kullanicilar() {
  const cok = process.env.PANEL_USERS || '';
  const liste = cok.split(',').map(s => s.trim()).filter(Boolean).map(s => {
    const i = s.indexOf(':');
    if (i <= 0) return null;
    const u = s.slice(0, i).trim(), p = s.slice(i + 1);
    return (u && p) ? { u, p } : null;
  }).filter(Boolean);
  if (liste.length) return liste;
  const U = process.env.PANEL_USER, P = process.env.PANEL_PASS;
  return (U && P) ? [{ u: U, p: P }] : [];
}

async function imza(user, pass) {
  const data = new TextEncoder().encode(user + '|' + pass + '|ktpanel-tuz-v1');
  const h = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(h)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function girisSayfasi(hatali) {
  const html = `<!doctype html><html lang="tr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>KTPanel · Giriş</title><style>
:root{--bg:#F4F1E8;--ink:#1F2D27;--mm:#0E5A3A;--mm2:#177245;--line:#DDD6C4;--down:#DE4B5E}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--ink);font-family:Georgia,'Times New Roman',serif;
  min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
.kart{background:#FCFAF4;border:1px solid var(--line);border-radius:14px;
  padding:34px 30px;width:100%;max-width:380px;box-shadow:0 8px 30px rgba(14,90,58,.08)}
h1{font-size:21px;color:var(--mm);letter-spacing:.5px;margin-bottom:4px}
.alt{font-size:11px;color:#8A8676;font-family:ui-monospace,Menlo,monospace;
  letter-spacing:1px;text-transform:uppercase;margin-bottom:24px}
label{display:block;font-size:11px;font-family:ui-monospace,Menlo,monospace;
  letter-spacing:.5px;color:#6B6A5E;margin:14px 0 5px;text-transform:uppercase}
input{width:100%;padding:11px 12px;border:1px solid var(--line);border-radius:8px;
  background:#fff;font-size:14px;font-family:inherit;outline:none}
input:focus{border-color:var(--mm2)}
button{width:100%;margin-top:22px;padding:12px;border:0;border-radius:8px;
  background:var(--mm);color:#F4F1E8;font-size:13px;font-family:ui-monospace,Menlo,monospace;
  letter-spacing:1.5px;text-transform:uppercase;cursor:pointer}
button:hover{background:var(--mm2)}
.hata{margin-top:14px;font-size:12px;color:var(--down);text-align:center}
.dip{margin-top:22px;font-size:10px;color:#A8A494;text-align:center;
  font-family:ui-monospace,Menlo,monospace}
</style></head><body>
<form class="kart" method="POST" action="/giris" autocomplete="on">
  <h1>KTPanel</h1>
  <div class="alt">Katılım Finans · Portföy Masası</div>
  <label for="u">Kullanıcı Adı</label>
  <input id="u" name="u" type="text" autocomplete="username" required autofocus>
  <label for="p">Şifre</label>
  <input id="p" name="p" type="password" autocomplete="current-password" required>
  <button type="submit">Giriş</button>
  ${hatali ? '<div class="hata">Kullanıcı adı veya şifre hatalı.</div>' : ''}
  <div class="dip">oturum 30 gün hatırlanır · /cikis ile kapatılır<br>kayıtların kendi hesabına özeldir</div>
</form></body></html>`;
  return new Response(html, { status: 401,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
}

export default async function middleware(req) {
  const KISILER = kullanicilar();
  if (!KISILER.length) return; // env yok → koruma kapalı (panel kilitlenmez)

  const url = new URL(req.url);

  // §249j: /api/tefas GİRİŞSİZ — kamu verisi proxy'si (TEFAS köprüsü);
  // Actions çerezsiz gelir, middleware onu kesiyordu ("giriş gerekli" —
  // üç koşuluk 401 bilmecesinin gerçek suçlusu TEFAS değil BU kapıydı).
  if (url.pathname === '/api/tefas') return;

  // Vercel Cron muafiyeti (TÜM cron path'leri: /api/ajanktp, /api/data mail...):
  // Vercel, cron isteklerine Authorization: Bearer CRON_SECRET ekler.
  {
    const cs = process.env.CRON_SECRET;
    if (cs && (req.headers.get('authorization') === 'Bearer ' + cs)) return;
  }

  // Çıkış
  if (url.pathname === '/cikis') {
    const h = new Headers({ 'Location': '/' });
    h.append('Set-Cookie', COOKIE + '=; Path=/; Max-Age=0');
    h.append('Set-Cookie', 'ktp_ad=; Path=/; Max-Age=0');
    return new Response(null, { status: 302, headers: h });
  }

  // Mevcut çerezi doğrula
  const cerezler = req.headers.get('cookie') || '';
  const parca = cerezler.split(/;\s*/).find(x => x.startsWith(COOKIE + '='));
  const deger = parca ? decodeURIComponent(parca.slice(COOKIE.length + 1)) : null;
  if (deger) {
    const boru = deger.lastIndexOf('|');
    const cProfil = boru > 0 ? deger.slice(0, boru) : null;
    const cImza   = boru > 0 ? deger.slice(boru + 1) : deger;   // eski biçim: düz imza
    for (const k of KISILER) {
      if (await imza(k.u, k.p) === cImza) {
        // Profil kısmı varsa kullanıcıyla eşleşmeli (imza zaten kullanıcıya özel)
        if (!cProfil || cProfil === profilAdi(k.u)) return;
      }
    }
  }

  // Giriş denemesi
  if (url.pathname === '/giris' && req.method === 'POST') {
    /* §296 KABA KUVVET FRENI: IP basina 60 saniyede 10 deneme. Edge bellegi
       ornek basinadir ve kalici degildir — bu bir KILIT degil HIZ KESICIDIR;
       asil savunma guclu parola + imzali cerez (degistirilmesi kapi acmaz). */
    const _RL = globalThis.__ktpRL || (globalThis.__ktpRL = new Map());
    const _ip = (req.headers.get('x-forwarded-for') || 'x').split(',')[0].trim();
    const _t = Date.now();
    const _son = (_RL.get(_ip) || []).filter(x => _t - x < 60000);
    if (_son.length >= 10) return new Response('Cok deneme — 1 dakika bekleyin', { status: 429 });
    _son.push(_t); _RL.set(_ip, _son);
    if (_RL.size > 500) { for (const [k, v] of _RL) { if (!v.some(x => _t - x < 60000)) _RL.delete(k); } }
    const f = await req.formData().catch(() => null);
    const u = f && String(f.get('u') || ''), p = f && String(f.get('p') || '');
    const bulunan = KISILER.find(k => k.u === u && k.p === p);
    if (bulunan) {
      const deg = profilAdi(bulunan.u) + '|' + await imza(bulunan.u, bulunan.p);
      const h = new Headers({ 'Location': '/' });
      h.append('Set-Cookie', COOKIE + '=' + encodeURIComponent(deg) +
        '; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000');
      // Gorunen ad: panel basliginda gosterilir. GIZLI DEGIL, sadece etiket —
      // bu yuzden HttpOnly YOK (JS okuyabilmeli). Yetki TASIMAZ; yetkiyi yalniz
      // imzali oturum cerezi tasir, bunun degistirilmesi hicbir kapiyi acmaz.
      h.append('Set-Cookie', 'ktp_ad=' + encodeURIComponent(bulunan.u) +
        '; Path=/; Secure; SameSite=Lax; Max-Age=2592000');
      return new Response(null, { status: 302, headers: h });
    }
    return girisSayfasi(true);
  }

  // API istekleri HTML değil JSON 401 alsın (fetch'ler net hata görsün)
  if (url.pathname.startsWith('/api/')) {
    return new Response(JSON.stringify({ ok: false, err: 'giriş gerekli' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  return girisSayfasi(false);
}
