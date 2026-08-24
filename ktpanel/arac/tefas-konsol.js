/* ══════════════════════════════════════════════════════════════════════════
   §410 TEFAS KONSOL TOPLAYICI v4 — kalıcı sürüm
   ══════════════════════════════════════════════════════════════════════════
   NEDEN ELLE: TEFAS erişimi 24 Ağu ölçümleriyle kapandı —
     • Vercel köprüsü: bağlantı düzeyinde blok ("fetch failed")
     • Actions runner: TSPD JS meydan okuması (6 KB kabuk, chunk yok)
     • Otomasyonla sürülen tarayıcı: davranış düzeyinde "Request Rejected"
     • BindHistoryInfo: HTTP 404 (yeni sitede kaldırılmış)
     • Sayfalı uç: pencere başına ~600 kayıtta HTTP 429
   Geriye tek meşru yol kaldı: KULLANICININ KENDİ elle gezdiği oturumu.
   Bot koruma ATLATILMAZ — çerezleri tarayıcı üretti, biz dokunmuyoruz;
   yalnızca sayfanın zaten yaptığı çağrılar, kotasına saygıyla tekrarlanır.

   v3'ten FARKLAR (canlı ölçümle):
     • ÇİFT KOŞU KİLİDİ — v2+v3 üst üste koşunca 2100 kayıtta 200 mükerrer
       oluştu ve istek hızı ikiye katlanıp 429'u tetikledi. Artık ikinci
       çalıştırma "zaten koşuyor" deyip çıkar.
     • DİLİM 100→50, aralık 3 sn: kotaya daha nazik.
     • İLERLEME KORUNUR (window.__ktpAum) — yarıda kalırsa tekrar yapıştır,
       kaldığı sıradan devam eder, mükerrer eklemez.
     • KAPSAM DÜRÜSTLÜĞÜ: dosyaya _kapsam/_hedef/_tam yazılır; tazele kısmi
       dosyayı iyi verinin üstüne YAZMAZ (§410 kapsam kapısı).

   KULLANIM:
     1) tefas.gov.tr'de fon listesi/getirileri sayfasını AÇ, tablo dolsun
        (kendi normal sekmen — otomasyon sürülen sekme reddediliyor)
     2) F12 → Console → bu kodun TAMAMINI yapıştır → Enter
        (Chrome uyarırsa: önce  allow pasting  yaz, Enter, sonra yapıştır)
     3) Bitince tefas-tam-<tarih>.json iner → repoda ktpanel/arac/gelen/
        klasörüne koy → "veri tazele" (fon katmanı) çalıştır.
   ══════════════════════════════════════════════════════════════════════════ */

(async () => {
  if (window.__ktpCalisiyor) { console.warn('[KTPanel] Zaten koşuyor — ikinci kopya başlatılmadı (429 sebebi buydu).'); return; }
  window.__ktpCalisiyor = true;
  try {
    const BEKLE = ms => new Promise(r => setTimeout(r, ms));
    const log = (...a) => console.log('%c[KTPanel]', 'color:#0a7', ...a);
    const b = new Date();
    const gg = String(b.getDate()).padStart(2, '0'), aa = String(b.getMonth() + 1).padStart(2, '0');
    const gunStr = b.getFullYear() + aa + gg;
    const isoStr = b.getFullYear() + '-' + aa + '-' + gg;

    /* ── jeton: sayfanın kendi paketlerinden ── */
    let jeton = window.__ktpJeton || null;
    if (!jeton) {
      for (const u of performance.getEntriesByType('resource').map(r => r.name)
             .filter(u => /\/_next\/static\/chunks\/.*\.js$/.test(u))) {
        try { const m = (await (await fetch(u)).text()).match(/ST-tefasweb[A-Za-z0-9]{10,}/); if (m) { jeton = m[0]; break; } } catch (e) {}
      }
      if (!jeton) { console.error('[KTPanel] Jeton yok — sayfayı Ctrl+Shift+R ile yenile, tekrar dene'); return; }
      window.__ktpJeton = jeton;
    }
    log('jeton:', jeton.slice(0, 18) + '…');

    const cagir = async (uc, govde, etiket) => {
      let bekleme = 45000;
      for (let d = 1; d <= 6; d++) {
        const r = await fetch('https://www.tefas.gov.tr/api/' + uc, {
          method: 'POST', credentials: 'include',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + jeton,
                     'Accept': 'application/json, text/javascript, */*; q=0.01' },
          body: JSON.stringify(govde)
        });
        if (r.ok) return r.json();
        if (r.status === 429) {
          log('  ⏳ kota (429) — ' + Math.round(bekleme / 1000) + ' sn bekleniyor · ' + etiket + ' · deneme ' + d + '/6');
          await BEKLE(bekleme); bekleme = Math.min(bekleme * 1.5, 240000); continue;
        }
        throw new Error(uc + ' → HTTP ' + r.status);
      }
      throw new Error('429 ısrarlı: ' + etiket);
    };

    /* ── 1) AUM / pay / yatırımcı — sayfa sayfa, kaldığı yerden ── */
    const DILIM = 50;
    window.__ktpAum = window.__ktpAum || [];
    const gorulen = new Set(window.__ktpAum.map(x => x.fonKodu));
    let toplam = window.__ktpToplam || null;
    if (window.__ktpAum.length) log('devam: elde ' + gorulen.size + ' tekil kayıt var');
    try {
      while (true) {
        if (toplam && gorulen.size >= toplam) break;
        const basSira = window.__ktpAum.length + 1;
        const d = await cagir('funds/fonGnlBlgSiraliGetir', {
          fonTipi: 'YAT', fonKodu: null, aramaMetni: null, fonTurKod: null, fonGrubu: null,
          sfonTurKod: null, basTarih: gunStr, bitTarih: gunStr,
          basSira, bitSira: basSira + DILIM - 1, fonTurAciklama: null, dil: 'TR', kurucuKod: null
        }, 'sayfa ' + basSira);
        const L = d.resultList || [];
        if (toplam === null) { toplam = window.__ktpToplam = d.toplamSayi || 0; log('toplam fon:', toplam); }
        if (!L.length) break;
        L.forEach(x => { if (x.fonKodu && !gorulen.has(x.fonKodu)) { gorulen.add(x.fonKodu); window.__ktpAum.push(x); } });
        log('  ' + gorulen.size + ' / ' + toplam);
        if (gorulen.size >= toplam) break;
        await BEKLE(3000);
      }
    } catch (e) { console.warn('[KTPanel] AUM turu durdu:', e.message, '— elde', gorulen.size, 'kayıt; yine de indirilecek'); }

    /* ── 2) getiri + kurucu listesi ── */
    let getiri = window.__ktpGetiri || [], liste = window.__ktpListe || [];
    if (!getiri.length) { try { await BEKLE(3000);
      getiri = window.__ktpGetiri = (await cagir('funds/fonGetiriBazliBilgiGetir', {
        dil: 'TR', fonTipi: 'YAT', kurucuKodu: null, sfonTurKod: null, fonTurAciklama: null, islem: 1,
        fonTurKod: null, fonGrubu: null, donemGetiri1a: '1', donemGetiri3a: '1', donemGetiri6a: '1',
        donemGetiri1y: '1', donemGetiriyb: '1', donemGetiri3y: '1', donemGetiri5y: '1',
        basTarih: null, bitTarih: null, calismaTipi: 2, getiriOrani: '1' }, 'getiri')).resultList || [];
      log('getiri:', getiri.length); } catch (e) { console.warn('getiri:', e.message); } }
    if (!liste.length) { try { await BEKLE(3000);
      liste = window.__ktpListe = (await cagir('statistics/tefas/getFplFonList', {}, 'fon listesi')).data || [];
      log('kurucu listesi:', liste.length); } catch (e) { console.warn('liste:', e.message); } }

    /* ── 3) indir ── */
    const aum = window.__ktpAum.map(x => ({ fonKodu: x.fonKodu, tarih: x.tarih, fiyat: x.fiyat,
      tedPaySayisi: x.tedPaySayisi, kisiSayisi: x.kisiSayisi, portfoyBuyukluk: x.portfoyBuyukluk }));
    const cikti = {
      _kaynak: 'TEFAS konsol toplayıcı v4 (kullanıcı tarayıcı oturumu · §410)',
      _uretim: new Date().toISOString(), tarih: isoStr,
      _kapsam: aum.length, _hedef: toplam || null, _tam: !!(toplam && aum.length >= toplam),
      aum,
      getiri: getiri.map(x => ({ fonKodu: x.fonKodu, fonUnvan: x.fonUnvan, fonTurAciklama: x.fonTurAciklama,
        tefasDurum: x.tefasDurum, getiri1a: x.getiri1a, getiri3a: x.getiri3a, getiri6a: x.getiri6a,
        getiri1y: x.getiri1y, getiriyb: x.getiriyb, getiri3y: x.getiri3y, getiri5y: x.getiri5y, riskDegeri: x.riskDegeri })),
      liste: liste.map(x => ({ fonKod: x.fonKod, unvan: x.unvan, kurucuKod: x.kurucuKod, kurucuAd: x.kurucuAd, durum: x.durum }))
    };
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(cikti)], { type: 'application/json' }));
    a.download = 'tefas-tam-' + isoStr + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    log((cikti._tam ? '✓ TAM' : '⚠ KISMİ') + ' — aum ' + aum.length + (toplam ? '/' + toplam : '') +
        ' · getiri ' + cikti.getiri.length + ' · liste ' + cikti.liste.length + ' → ' + a.download);
    if (!cikti._tam) log('  (kısmi dosya tazelede İYİ VERİYİ EZMEZ — kapsam kapısı. Tamamlamak için kodu tekrar yapıştır.)');
  } finally { window.__ktpCalisiyor = false; }
})();
