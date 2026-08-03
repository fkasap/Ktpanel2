#!/usr/bin/env python3
"""§247: Koyfin Shariah CSV → yevren.json. Kullanım: python3 koyfin-isle.py <csv> <hedef.json>
Boş satırları atar; sayısalları çevirir; MCap'i mlr $'a normalize eder."""
import sys, json, math
import pandas as pd
K={'Ticker':'t','EV/EBITDA (LTM)':'ee','EV/EBITDA (EST FY1)':'ee1','EV/EBITDA (EST FY2)':'ee2',
'EV/Sales (EST FY1)':'es1','EV/Sales (EST FY2)':'es2','P/FCF (LTM)':'pf','CFO (LTM)':'cfo',
'Capital Expenditure (LTM)':'cap','FCF (LTM)':'fcf','Net Debt (LTM)':'nd','Net Debt / EBITDA (LTM)':'nde',
'Revenues - Est Avg (FY1E)':'r1','Revenues - Est Avg (FY2E)':'r2','PEG (NTM)':'peg','Altman Z-Score (LTM)':'z',
'# Buys Ratings':'nb','Analyst Rating':'ar','Div Yield (TTM)':'dy','Price Chg. % (6M)':'c6',
'Rel. Volume':'rv','Country':'u','Market Cap':'mc','P/E (EST FY1)':'pe1','P/E (EST FY2)':'pe2'}
df=pd.read_csv(sys.argv[1]).dropna(how='all')
df=df[df['Ticker'].notna()]
assert len(df)>0, 'CSV yine boş — Koyfin ekranında tablo doluyken export alın'
KUR=float(sys.argv[3]) if len(sys.argv)>3 else 47.55
H=[]
for _,r in df.iterrows():
    h={}
    for kk,vv in K.items():
        if kk not in df.columns: continue
        v=r[kk]
        if isinstance(v,float) and math.isnan(v): v=None
        elif kk not in ('Ticker','Analyst Rating','Country'):
            try: v=float(v)
            except: v=None
        h[vv]=v
    # §247a ÖLÇEK ÇÖZÜLDÜ: export MİLYON TL cinsinden (hesap TL görünümde).
    # Kanıt: AAPL ham MCap 212.559.484 mnTL /1000/47,55 = 4,47 tr$ ✓,
    # AAPL CFO → 143,8 mlr$ ✓, Hitachi → 149 mlr$ ✓. Oranlar birimden
    # bağımsız, yalnız parasal kolonlar çevrilir: mnTL → mlr$.
    for f in ('mc','fcf','cfo','cap','nd','r1','r2'):
        if h.get(f) is not None: h[f]=round(h[f]/1000.0/KUR,2)
    H.append(h)
import datetime
out={'guncelleme':str(datetime.date.today()),'kaynak':'Koyfin Shariah Universe CSV (mnTL→mlr$, kur '+str(KUR)+')','kur':KUR,'kolonlar':K,'hisseler':H}
json.dump(out,open(sys.argv[2],'w',encoding='utf-8'),ensure_ascii=False,indent=1)
print(f'✓ {len(H)} hisse → {sys.argv[2]}')
