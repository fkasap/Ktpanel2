#!/usr/bin/env python3
"""§252s: Koyfin YERLI (XKTUM) CSV -> fm.json.  koyfin-isle.py'nin yerli karsiligi.

  koyfin-isle.py  ->  yevren.json  (YABANCI hisseler, ham metrik tablosu)
  fm-isle.py      ->  fm.json      (YERLI hisseler, 5 FAKTOR z-skoru)

Kullanim:
  python3 fm-isle.py <csv> <hedef.json>
  python3 fm-isle.py <csv> <hedef.json> --dogrula <mevcut_fm.json>

YONTEM (10 Agu 2026'da mevcut fm.json'dan geri cozuldu, app.js:1518-1523 ile teyitli):
  1. Her metrik icin z-skor. VALUE/GROWTH/QUALITY SEKTOR ICINDE, MOMENTUM/LOW_RISK
     TUM EVRENDE. (app.js etiketleri: "sektor ici" vs "global". Olcum dogruladi:
     sektorler arasi yayilim VAL .114 GRO .021 QUA .074 — dar; MOM .414 LOW .650 — genis.)
  2. z-skor +-3'te KIRPILIR (mevcut dosyada hic |z|>3 yok).
  3. hib=false metrikte ISARET TERS (dusuk iyi: P/E, EV/EBITDA, Volatility...).
  4. Faktor skoru = o faktorun mevcut metrik z-skorlarinin ORTALAMASI.
     (Mevcut dosyada std 0.57-0.74; tek z-skor olsa 1.0 olurdu -> ortalama.)
  5. n = veri bulunan FAKTOR sayisi. minfac'ten az ise hisse SIRALANMAZ.

UYARI: Bu betik mevcut fm.json'un SAYILARINI birebir uretecek sekilde
dogrulanamadi — 14 Tem 2026 CSV'si elde yok ve veri o gunden beri degisti.
Dogrulanan sey YAPISAL IMZA: ortalama, std, kirpma siniri, sektor yayilimi.
Yeni bir kosuda --dogrula ile eski dosyaya karsi imza kiyaslanir.
"""
import sys, json, csv, math, datetime, statistics as st
from collections import defaultdict

if len(sys.argv) < 3:
    print(__doc__); sys.exit(1)
CSV, HEDEF = sys.argv[1], sys.argv[2]
DOGRULA = sys.argv[sys.argv.index('--dogrula')+1] if '--dogrula' in sys.argv else None

# ── Faktor tanimi. SIRA app.js:1519 ile SABIT: VALUE:0 GROWTH:1 QUALITY:2 MOMENTUM:3 LOW_RISK:4
FAK = ['VALUE', 'GROWTH', 'QUALITY', 'MOMENTUM', 'LOW_RISK']
SEKTOR_ICI = {'VALUE', 'GROWTH', 'QUALITY'}       # digerleri tum evren
METRIK = [
    ('P/E (LTM)',                          'VALUE',    False),
    ('EV/EBITDA (LTM)',                    'VALUE',    False),
    ('EV/Sales (LTM)',                     'VALUE',    False),
    ('P/FCF (LTM)',                        'VALUE',    False),
    ('P/OCF (LTM)',                        'VALUE',    False),
    ('Net Debt / EBITDA (LTM)',            'VALUE',    False),
    ('Total Debt / (EBITDA - Capex) (LTM)','VALUE',    False),
    ('EV/(EBIT-Capex)',                    'VALUE',    False),
    ('Total Revenues/CAGR (1Y TTM)',       'GROWTH',   True),
    ('Capex as % of Revenues (LTM)',       'GROWTH',   False),
    ('CAPEX/CAGR (3Y TTM)',                'GROWTH',   False),
    ('Nopat margin',                       'GROWTH',   True),
    ('Return On Equity % (LTM)',           'QUALITY',  True),
    ('Return on Assets (ROA) % (LTM)',     'QUALITY',  True),
    ('ROIC (LTM)',                         'QUALITY',  True),
    ('EBIT Margin % (LTM)',                'QUALITY',  True),
    ('EBITDA Margin % (LTM)',              'QUALITY',  True),
    ('Gross Profit Margin % (LTM)',        'QUALITY',  True),
    ('FCF Margin % (LTM)',                 'QUALITY',  True),
    ('Altman Z-Score (LTM)',               'QUALITY',  True),
    ('NOPAT / ASSETS',                     'QUALITY',  True),
    ('RSI 10D',                            'MOMENTUM', True),
    ('Price Chg. % (6M)',                  'MOMENTUM', True),
    ('Rel. Volume',                        'MOMENTUM', True),
    ('SMA % (10D)',                        'MOMENTUM', True),
    ('SMA % (50D)',                        'MOMENTUM', True),
    ('EMA % (20D)',                        'MOMENTUM', True),
    ('Volatility (1Y)',                    'LOW_RISK', False),
    ('Beta (1Y)',                          'LOW_RISK', False),
]
KIRP = 3.0
MINFAC = 3
MIN_SEKTOR = 5    # sektor-ici z-skor icin en az uye; altindaysa TUM EVRENE duser

def sayi(v):
    if v is None: return None
    s = str(v).strip().replace('%', '').replace(',', '')
    if s in ('', '-', 'NA', 'N/A', 'nan', 'None'): return None
    try:
        f = float(s)
        return None if (math.isnan(f) or math.isinf(f)) else f
    except ValueError:
        return None

def z(deger, havuz):
    """z-skor + kirpma. Havuzda <2 gozlem ya da std=0 ise None."""
    if len(havuz) < 2: return None
    m = st.mean(havuz); s = st.pstdev(havuz)
    if s == 0: return None
    return max(-KIRP, min(KIRP, (deger - m) / s))

# ── OKU
with open(CSV, encoding='utf-8-sig') as f:
    ham = [r for r in csv.DictReader(f) if (r.get('Ticker') or '').strip()]
kol = {k.strip(): k for k in ham[0].keys()}
eksik = [n for n, _, _ in METRIK if n not in kol]
assert not eksik, 'CSV\'de EKSIK METRIK: ' + ', '.join(eksik)

hisse = []
for r in ham:
    t = r['Ticker'].strip().upper()
    s = (r.get(kol.get('Sector', 'Sector')) or '').strip() or 'Bilinmiyor'
    d = {n: sayi(r.get(kol[n])) for n, _, _ in METRIK}
    hisse.append({'t': t, 's': s, 'ham': d})

# ── z-SKOR HAVUZLARI
sekUye = defaultdict(int)
for h in hisse: sekUye[h['s']] += 1

zs = {h['t']: {} for h in hisse}
for ad, fa, hib in METRIK:
    if fa in SEKTOR_ICI:
        gruplar = defaultdict(list)
        for h in hisse:
            g = h['s'] if sekUye[h['s']] >= MIN_SEKTOR else '__KUCUK__'
            gruplar[g].append(h)
    else:
        gruplar = {'__TUM__': hisse}
    for g, uyeler in gruplar.items():
        havuz = [h['ham'][ad] for h in uyeler if h['ham'][ad] is not None]
        for h in uyeler:
            v = h['ham'][ad]
            if v is None: continue
            zz = z(v, havuz)
            if zz is None: continue
            zs[h['t']][ad] = zz if hib else -zz     # dusuk-iyi metrikte ISARET TERS

# ── FAKTOR SKORLARI
data, atlanan = [], []
for h in hisse:
    f = []
    for fa in FAK:
        vs = [zs[h['t']][ad] for ad, ff, _ in METRIK if ff == fa and ad in zs[h['t']]]
        f.append(round(sum(vs) / len(vs), 4) if vs else None)
    n = sum(1 for x in f if x is not None)
    if n < MINFAC:
        atlanan.append(h['t']); continue
    data.append({'t': h['t'], 's': h['s'], 'f': f, 'n': n})

data.sort(key=lambda x: x['t'])
meta = {
    'uni': len(hisse), 'ranked': len(data), 'topn': 25,
    'defw': {'QUALITY': 0.3, 'VALUE': 0.25, 'MOMENTUM': 0.2, 'LOW_RISK': 0.15, 'GROWTH': 0.1},
    'minw': 0.01, 'maxw': 0.1, 'walpha': 0.5, 'seccap': 0.3, 'maxnames': 6, 'minfac': MINFAC,
    'metrics': [{'n': n, 'f': fa, 'hib': hib} for n, fa, hib in METRIK],
    'tarih': str(datetime.date.today()),
    '_faktor_sirasi': FAK,
    '_normalizasyon': {fa: ('sektör içi' if fa in SEKTOR_ICI else 'tüm evren') for fa in FAK},
    '_kirpma': KIRP, '_min_sektor_uye': MIN_SEKTOR,
    '_uretim': 'fm-isle.py · ' + CSV.split('/')[-1],
}
json.dump({'meta': meta, 'data': data},
          open(HEDEF, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(f'✓ {len(data)}/{len(hisse)} hisse → {HEDEF}   (minfac<{MINFAC} atlanan: {len(atlanan)})')
if atlanan: print('  atlananlar:', ', '.join(sorted(atlanan)[:12]))

# ── YAPISAL IMZA
print('\nYAPISAL IMZA (yontem dogru cozuldu mu?)')
print(f'{"faktor":11}{"n":>5}{"ort":>9}{"std":>8}{"min":>8}{"max":>8}{"|z|>3":>7}')
for i, fa in enumerate(FAK):
    v = [x['f'][i] for x in data if x['f'][i] is not None]
    print(f'{fa:11}{len(v):>5}{st.mean(v):>9.3f}{st.pstdev(v):>8.3f}{min(v):>8.2f}{max(v):>8.2f}'
          f'{sum(1 for q in v if abs(q) > 3):>7}')
sekG = defaultdict(lambda: defaultdict(list))
for x in data:
    for i in range(5):
        if x['f'][i] is not None: sekG[x['s']][i].append(x['f'][i])
buyuk = [k for k in sekG if len(sekG[k][2]) >= 10]
print('\nsektorler arasi YAYILIM (VAL/GRO/QUA dar, MOM/LOW genis olmali):')
for i, fa in enumerate(FAK):
    o = [st.mean(sekG[s][i]) for s in buyuk if sekG[s][i]]
    print(f'  {fa:11} {max(o)-min(o):.3f}   {"sektör içi" if fa in SEKTOR_ICI else "tüm evren"}')

if DOGRULA:
    ref = json.load(open(DOGRULA, encoding='utf-8'))
    R = {x['t']: x for x in ref['data']}
    ortak = [x for x in data if x['t'] in R]
    print(f'\n--dogrula {DOGRULA}: ortak {len(ortak)} hisse')
    print(f'{"faktor":11}{"korelasyon":>12}{"ort fark":>10}')
    for i, fa in enumerate(FAK):
        ci = [(x['f'][i], R[x['t']]['f'][i]) for x in ortak
              if x['f'][i] is not None and R[x['t']]['f'][i] is not None]
        if len(ci) < 3: print(f'{fa:11}{"—":>12}{"—":>10}'); continue
        a = [p[0] for p in ci]; b = [p[1] for p in ci]
        try: k = st.correlation(a, b)
        except Exception: k = float('nan')
        print(f'{fa:11}{k:>12.3f}{st.mean([p[0]-p[1] for p in ci]):>+10.3f}')
    print('  NOT: korelasyon YONTEM benzerligini gosterir, veri ayni degilse 1.0 BEKLENMEZ.')
