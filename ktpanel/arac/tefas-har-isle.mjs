#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════════════════════
   §409 TEFAS HAR İÇE-AKTARMA — meşru elle istisna (swap stoku emsali)
   ══════════════════════════════════════════════════════════════════════════
   NEDEN: TEFAS erişim mimarisini değiştirdi (§408) — Vercel IP'si bağlantı
   düzeyinde, Actions runner'ı WAF düzeyinde engelli; bot-koruma çerezleri
   sunucudan taklit EDİLMEZ (etik çizgi). Kullanıcının KENDİ tarayıcısı ise
   meşru istemci: DevTools → Network → "HAR olarak kaydet" 30 saniyelik iş.
   KULLANIM:
     1) tefas.gov.tr/tr/fon-getirileri sayfasını aç, tablo dolsun
     2) DevTools → Network → ⬇ (Export HAR) → dosyayı kaydet
     3) node arac/tefas-har-isle.mjs <dosya.har>
     → ktpanel/tefas-har-veri.json yazılır; tazele fon katmanı köprü ve
       doğrudan çekim DÜŞERSE bu dosyayı okur (yalnız AYNI GÜN taze ise —
       bayat HAR sessizce kullanılmaz, §301 ruhu).
   NOT: HAR'dan yalnız YANIT GÖVDELERİ alınır — çerez/jeton sunucu tarafında
   YENİDEN KULLANILMAZ. Veri kamuya açık, indirmeyi yapan kullanıcının kendisi.
   ══════════════════════════════════════════════════════════════════════════ */
import { readFileSync, writeFileSync } from 'fs';
const yol = process.argv[2];
if (!yol) { console.error('kullanım: node arac/tefas-har-isle.mjs <dosya.har>'); process.exit(1); }
const H = JSON.parse(readFileSync(yol, 'utf-8'));
let getiri = null, liste = null, tarih = null;
for (const e of H.log.entries) {
  const u = e.request.url;
  try {
    if (u.includes('fonGetiriBazliBilgiGetir')) {
      getiri = JSON.parse(e.response.content.text).resultList || null;
      tarih = (e.startedDateTime || '').slice(0, 10);
    }
    if (u.endsWith('getFplFonList'))
      liste = JSON.parse(e.response.content.text).data || null;
  } catch (err) { /* gövdesi kırpılmış girdi — atla */ }
}
if (!getiri) { console.error('✗ fonGetiriBazliBilgiGetir yanıtı HAR içinde yok — fon-getirileri sayfasında tablo dolduktan SONRA HAR al'); process.exit(1); }
const al = (x, k) => Object.fromEntries(k.map(a => [a, x[a] ?? null]));
const cikti = {
  _kaynak: 'HAR (kullanıcı tarayıcısı — elle, meşru istisna §408/§409)',
  _uretim: 'arac/tefas-har-isle.mjs',
  tarih,
  getiri: getiri.map(x => al(x, ['fonKodu','fonUnvan','fonTurAciklama','tefasDurum','getiri1a','getiri3a','getiri6a','getiri1y','getiriyb','getiri3y','getiri5y'])),
  liste: (liste || []).map(x => al(x, ['fonKod','unvan','kurucuKod','kurucuAd','durum']))
};
writeFileSync('ktpanel/tefas-har-veri.json', JSON.stringify(cikti));
console.log('✓ tefas-har-veri.json — ' + tarih + ' · getiri ' + cikti.getiri.length + ' · liste ' + cikti.liste.length);
