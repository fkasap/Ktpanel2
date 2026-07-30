// Veri deposu — Upstash Redis (Vercel KV) üzerinden.
//
// PROFİL BAZLI (28 Tem 2026): eskiden tek kutu vardı (ktpanel:data) ve iki kişi
// aynı kutuya yazınca son yazan diğerini eziyordu. Artık kayıtlar ikiye ayrılır:
//   KİŞİSEL → ktpanel:kisi:<profil>   (pozisyon, tez, risk ayarı, sicil, sukuk)
//   ORTAK   → ktpanel:ortak           (guidance, halka arz değerlemeleri)
// Profil, middleware'in doğruladığı oturum çerezinden gelir — istemci belirleyemez.
// Bu uç ancak middleware'den geçen istekle çalışır (korumasızsa eski moda düşer).
//
// GERİYE DÖNÜK UYUM: eski ktpanel:data kutusu SİLİNMEZ, dokunulmaz.
//   ?eski=1        → eski ortak kutuyu ham okur (kurtarma için)
//   ?yedek=GG-AA-YY→ o günün fotoğrafı (profil bazlı; 7 gün TTL)
// Profil çözülemezse (koruma kapalı / cron) davranış eskisiyle birebir aynıdır.
//
// Gerekli env: KV_REST_API_URL, KV_REST_API_TOKEN (Upstash entegrasyonu enjekte eder)
//              KTPANEL_WRITE_KEY (yazma anahtarı — "yazabilir mi", kimlik DEĞİL)
//              PANEL_USERS (middleware — kim olduğunu belirler)

const U = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const T = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const WRITE = process.env.KTPANEL_WRITE_KEY || '';

const KEY_ESKI  = 'ktpanel:data';        // eski tek kutu — okunur, asla silinmez
const KEY_ORTAK = 'ktpanel:ortak';
const kisiKey   = p => 'ktpanel:kisi:' + p;

// Herkesin aynısını gördüğü kayıtlar. Gerisi kişiseldir.
// Model sicilini (trk_seri_v1) buraya taşımak istersen tek satır: listeye ekle.
// NOT: sicil kişiselken her profil yalnız KENDİ açtığı günleri biriktirir, yani
// iki kişide iki delikli seri oluşur. Ortak yaparsan tek ve tam seri olur.
const ORTAK_ANAHTARLAR = ['guidance_v1', 'ktp_arz_kayit_v1'];

const _mail = require('./_lib/mail.js');

// Oturum çerezinden profil. middleware çerezi zaten doğruladı; buraya ulaşan
// istek geçerlidir, dolayısıyla profil kısmına güvenilebilir.
function profilCoz(req) {
  const c = (req.headers && req.headers.cookie) || '';
  const p = c.split(/;\s*/).find(x => x.startsWith('ktp_oturum='));
  if (!p) return null;
  let v = p.slice('ktp_oturum='.length);
  try { v = decodeURIComponent(v); } catch (e) {}
  const i = v.lastIndexOf('|');
  if (i <= 0) return null;                                  // eski biçim: profilsiz
  const ad = v.slice(0, i).replace(/[^a-z0-9_-]/g, '').slice(0, 32);
  return ad || null;
}

// Gorunen ad: profil KV anahtari icin sadelestirilmis haldedir ("omer"); basligta
// kullanicinin env'e yazdigi HALI gorunsun diye PANEL_USERS'tan geri eslestirilir.
// Cerez (ktp_ad) varsa istemci onu kullanir; bu, cerez silinmisse devreye giren yedek.
function gorunenAd(profil) {
  if (!profil) return null;
  const sade = s => String(s || '').replace(/[\u0131\u0130\u011f\u011e\u00fc\u00dc\u015f\u015e\u00f6\u00d6\u00e7\u00c7]/g,
      c => ({'\u0131':'i','\u0130':'i','\u011f':'g','\u011e':'g','\u00fc':'u','\u00dc':'u','\u015f':'s','\u015e':'s','\u00f6':'o','\u00d6':'o','\u00e7':'c','\u00c7':'c'}[c]))
    .toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 32);
  const cok = (process.env.PANEL_USERS || '').split(',').map(s => s.trim()).filter(Boolean);
  for (const s of cok) { const i = s.indexOf(':'); if (i <= 0) continue;
    const u = s.slice(0, i).trim(); if (sade(u) === profil) return u; }
  const tek = process.env.PANEL_USER;
  return (tek && sade(tek) === profil) ? tek : profil;
}

const kvGet = async (k) => {
  const r = await fetch(U + '/get/' + k, { headers: { Authorization: 'Bearer ' + T } });
  const j = await r.json();
  if (!j || j.result == null) return null;
  try { return JSON.parse(j.result); } catch (e) { return null; }
};
const kvSet = async (k, govde, ttl) => {
  const r = await fetch(U + '/set/' + k + (ttl ? '?EX=' + ttl : ''), {
    method: 'POST', headers: { Authorization: 'Bearer ' + T }, body: govde });
  if (!r.ok) throw new Error('KV yazma hatası: ' + r.status);
};
// Bir objedeki dizi uzunluklarının toplamı — "boş yazma" emniyeti için
const say = (o) => { let n = 0; if (o && typeof o === 'object')
  Object.keys(o).forEach(k => { if (Array.isArray(o[k])) n += o[k].length; }); return n; };
const ayir = (o, ortakMi) => { const r = {};
  Object.keys(o || {}).forEach(k => { if (ORTAK_ANAHTARLAR.includes(k) === ortakMi) r[k] = o[k]; });
  return r; };

module.exports = async (req, res) => {
  if (String((req.query && req.query.mod) || '').toLowerCase() === 'mail') return _mail(req, res);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Write-Key');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  if (!U || !T) {
    res.status(503).json({ error: 'Depo yapılandırılmamış — Vercel\'de Upstash/KV bağlanmalı (KV_REST_API_URL/TOKEN eksik).' });
    return;
  }

  const profil = profilCoz(req);
  const KISI = profil ? kisiKey(profil) : KEY_ESKI;   // profil yoksa eski davranış

  try {
    // ── Eski ortak kutuyu ham oku (kurtarma) ──
    if (req.method === 'GET' && req.query && req.query.eski) {
      const d = await kvGet(KEY_ESKI);
      res.setHeader('Cache-Control', 'no-store');
      res.status(200).json(d ? Object.assign({ __kaynak: 'eski-ortak-kutu' }, d)
                             : { error: 'eski kutu boş' });
      return;
    }

    // ── Günlük yedek (profil bazlı; profilsizse eski kutunun yedeği) ──
    if (req.method === 'GET' && req.query && req.query.yedek) {
      const gun = String(req.query.yedek).slice(0, 10);
      const k = await kvGet(KISI + '_yedek_' + gun);
      const o = await kvGet(KEY_ORTAK + '_yedek_' + gun);
      res.setHeader('Cache-Control', 'no-store');
      if (!k && !o) { res.status(200).json({ error: 'o güne ait yedek yok', __profil: profil }); return; }
      res.status(200).json(Object.assign({ __profil: profil, __yedek: gun }, o || {}, k || {}));
      return;
    }

    if (req.method === 'GET') {
      const kisisel = await kvGet(KISI) || {};
      const ortak = profil ? (await kvGet(KEY_ORTAK) || {}) : {};
      // Ortak önce, kişisel üste: aynı anahtar iki yerdeyse kişisel kazanır
      const veri = Object.assign({ __profil: profil, __ad: gorunenAd(profil), __ortakAnahtarlar: ORTAK_ANAHTARLAR },
                                 ayir(ortak, true), kisisel);
      res.setHeader('Cache-Control', 'no-store');   // kişiye özel — kenar önbelleği YOK
      res.status(200).json(veri);
      return;
    }

    if (req.method === 'POST') {
      const key = req.headers['x-write-key'] || '';
      if (!WRITE) { res.status(503).json({ error: 'Yazma anahtarı sunucuda tanımlı değil (KTPANEL_WRITE_KEY).' }); return; }
      if (key !== WRITE) { res.status(403).json({ error: 'Yazma anahtarı geçersiz.' }); return; }
      let body = '';
      for await (const c of req) body += c;
      const yeniVeri = JSON.parse(body); // geçerli JSON mu doğrula
      delete yeniVeri.__profil; delete yeniVeri.__ortakAnahtarlar;

      const gun = new Date().toISOString().slice(0, 10);
      let yazilan = 0;

      // ── KİŞİSEL kutu ──
      const yeniKisi = profil ? ayir(yeniVeri, false) : yeniVeri;
      const eskiKisi = await kvGet(KISI);
      const yK = say(yeniKisi), eK = say(eskiKisi);
      // EMNİYET 1: bulutta kayıt varken boş istek gelirse REDDET (kaza silme koruması)
      if (eK >= 3 && yK === 0) {
        res.status(409).json({ error: 'Boş yazma reddedildi: kutunda ' + eK + ' kayıt var, gelen istek boş.', korundu: true, __profil: profil });
        return;
      }
      // EMNİYET 2: yazmadan önceki hali günlük yedeğe kopyala (7 gün)
      if (eskiKisi) { try { await kvSet(KISI + '_yedek_' + gun, JSON.stringify(eskiKisi), 604800); } catch (e) {} }
      await kvSet(KISI, JSON.stringify(yeniKisi));
      yazilan += yK;

      // ── ORTAK kutu (yalnız profil çözülebildiyse) ──
      let ortakSay = 0;
      if (profil) {
        const yeniOrtak = ayir(yeniVeri, true);
        if (Object.keys(yeniOrtak).length) {
          const eskiOrtak = await kvGet(KEY_ORTAK);
          const yO = say(yeniOrtak), eO = say(eskiOrtak);
          if (!(eO >= 3 && yO === 0)) {   // ortak kutuda da boş yazma yasağı
            if (eskiOrtak) { try { await kvSet(KEY_ORTAK + '_yedek_' + gun, JSON.stringify(eskiOrtak), 604800); } catch (e) {} }
            await kvSet(KEY_ORTAK, JSON.stringify(yeniOrtak));
            ortakSay = yO;
          }
        }
      }

      res.status(200).json({ ok: true, kayit: yazilan + ortakSay, kisisel: yazilan,
                             ortak: ortakSay, __profil: profil });
      return;
    }

    res.status(405).json({ error: 'Yöntem desteklenmiyor' });
  } catch (e) {
    res.status(500).json({ error: String((e && e.message) || e) });
  }
};
