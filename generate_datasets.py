"""
Financial Analytics Course — Dataset Generator
Generates five India-first synthetic datasets with documented, deliberate defects.
All data is SYNTHETIC. Realistic in shape and scale; not real market data.
"""
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

rng = np.random.default_rng(42)
OUT = "data"

# ----------------------------------------------------------------------------
# NSE trading calendar helper (weekdays minus approximate NSE holidays)
# ----------------------------------------------------------------------------
NSE_HOLIDAYS = set()
for y in range(2021, 2027):
    for m, d in [(1, 26), (3, 8), (4, 14), (5, 1), (8, 15), (10, 2), (12, 25)]:
        NSE_HOLIDAYS.add(pd.Timestamp(year=y, month=m, day=d).normalize())
# Diwali cluster (approx) — used later for the Muhurat-session teaching trap
DIWALI = {2021: "2021-11-04", 2022: "2022-10-24", 2023: "2023-11-12",
          2024: "2024-11-01", 2025: "2025-10-21", 2026: "2026-11-08"}
for v in DIWALI.values():
    NSE_HOLIDAYS.add(pd.Timestamp(v).normalize())


def trading_days(start, end):
    days = pd.bdate_range(start, end)
    return pd.DatetimeIndex([d for d in days if d.normalize() not in NSE_HOLIDAYS])


# ============================================================================
# 1. nifty50_prices.csv  — the workhorse price series (M0, 3, 4, 6, 9, 10)
# ============================================================================
def make_nifty():
    days = trading_days("2021-01-01", "2025-12-31")
    n = len(days)
    # GBM-ish path with a regime change (calmer 2021-22, choppier 2023+)
    vol = np.where(np.arange(n) < n * 0.45, 0.0085, 0.0125)
    drift = 0.00050 + 0.5 * vol ** 2   # compensate vol drag so the series actually trends up
    shocks = drift + rng.normal(0.0, 1.0, n) * vol   # drift must be ADDED, not scaled by vol
    # one realistic drawdown episode
    crash_start = int(n * 0.62)
    shocks[crash_start:crash_start + 12] -= 0.011
    level = 14000 * np.exp(np.cumsum(shocks))

    df = pd.DataFrame({"date": days, "close": np.round(level, 2)})
    df["open"] = np.round(df["close"].shift(1).fillna(13980) * (1 + rng.normal(0, 0.002, n)), 2)
    df["high"] = np.round(np.maximum(df["open"], df["close"]) * (1 + np.abs(rng.normal(0, 0.003, n))), 2)
    df["low"] = np.round(np.minimum(df["open"], df["close"]) * (1 - np.abs(rng.normal(0, 0.003, n))), 2)
    df["volume"] = (rng.lognormal(19.1, 0.28, n)).astype(int)

    # --- PLANTED DEFECTS -----------------------------------------------------
    # (a) volume missing for the whole first year  -> completeness (field-level)
    df.loc[df["date"] < "2022-01-01", "volume"] = np.nan
    # (b) two genuine trading days silently dropped -> completeness (row-level)
    drop_dates = [pd.Timestamp("2023-06-14"), pd.Timestamp("2024-02-21")]
    df = df[~df["date"].isin(drop_dates)]
    # (c) one fat-finger spike (10x) -> accuracy
    idx = df.index[df["date"] == pd.Timestamp("2024-08-13")]
    if len(idx):
        df.loc[idx, "high"] = df.loc[idx, "high"] * 10
    # (d) Diwali Muhurat sessions ARE present (a half-session on a holiday)
    #     -> the "looks like an error but isn't" trap
    muhurat = pd.DataFrame([
        {"date": pd.Timestamp(DIWALI[y]),
         "close": np.nan, "open": np.nan, "high": np.nan, "low": np.nan, "volume": np.nan}
        for y in [2022, 2023, 2024, 2025]
    ])
    for i, row in muhurat.iterrows():
        prev = df[df["date"] < row["date"]]["close"]
        if len(prev):
            base = prev.iloc[-1]
            muhurat.loc[i, ["open", "close"]] = [round(base * 1.001, 2), round(base * 1.004, 2)]
            muhurat.loc[i, "high"] = round(base * 1.006, 2)
            muhurat.loc[i, "low"] = round(base * 0.999, 2)
            muhurat.loc[i, "volume"] = int(rng.lognormal(17.5, 0.2))
    df = pd.concat([df, muhurat]).sort_values("date").reset_index(drop=True)

    df = df[["date", "open", "high", "low", "close", "volume"]]
    df["date"] = df["date"].dt.strftime("%Y-%m-%d")
    df.to_csv(f"{OUT}/nifty50_prices.csv", index=False)
    return df


# ============================================================================
# 2. messy_transactions.csv — the deliberately dirty one (M1, 3, 3.5, 5)
# ============================================================================
def make_transactions():
    n = 5000
    cats = ["Groceries", "Fuel", "Utilities", "Rent", "Dining", "Travel",
            "Healthcare", "Education", "Shopping", "Investment", "Salary Credit"]
    modes = ["UPI", "NEFT", "IMPS", "Debit Card", "Credit Card", "Cash"]
    merchants = ["BigBazaar", "Indian Oil", "Tata Power", "Swiggy", "IRCTC", "Apollo Pharmacy",
                 "Amazon India", "Flipkart", "Zerodha", "Reliance Fresh", "BSNL", "Uber India"]

    start = datetime(2024, 1, 1)
    dates = [start + timedelta(days=int(x)) for x in rng.integers(0, 540, n)]
    amounts = np.round(rng.lognormal(6.6, 1.15, n), 2)

    df = pd.DataFrame({
        "txn_id": [f"TXN{100000 + i}" for i in range(n)],
        "txn_date": dates,
        "customer_id": [f"CUST{int(x):04d}" for x in rng.integers(1, 1001, n)],
        "merchant": rng.choice(merchants, n),
        "category": rng.choice(cats, n),
        "mode": rng.choice(modes, n),
        "amount_inr": amounts,
        "city": rng.choice(["Mumbai", "Delhi", "Bengaluru", "Chennai", "Hyderabad",
                            "Pune", "Kolkata", "Ahmedabad"], n),
    })

    # --- PLANTED DEFECTS -----------------------------------------------------
    # (a) MIXED DATE FORMATS  -> the ambiguity trap (12/01/2024: Jan 12 or Dec 1?)
    fmt_choice = rng.choice(["iso", "dmy_slash", "text"], n, p=[0.6, 0.28, 0.12])
    formatted = []
    for d, f in zip(df["txn_date"], fmt_choice):
        if f == "iso":
            formatted.append(d.strftime("%Y-%m-%d"))
        elif f == "dmy_slash":
            formatted.append(d.strftime("%d/%m/%Y"))
        else:
            formatted.append(d.strftime("%b %d, %y"))
    df["txn_date"] = formatted

    # (b) exact duplicate rows (a double-posting incident)
    dupes = df.sample(60, random_state=7)
    df = pd.concat([df, dupes], ignore_index=True)

    # (c) missing categories (uncategorised transactions)
    miss_idx = df.sample(190, random_state=11).index
    df.loc[miss_idx, "category"] = np.nan

    # (d) inconsistent merchant naming -> same entity, different strings
    ent_idx = df.sample(140, random_state=13).index
    variants = {"BigBazaar": "BIG BAZAAR", "Indian Oil": "IndianOil ", "Amazon India": "amazon india",
                "Tata Power": "TATA POWER LTD", "Zerodha": "Zerodha Broking"}
    df.loc[ent_idx, "merchant"] = df.loc[ent_idx, "merchant"].map(lambda m: variants.get(m, m))

    # (e) currency contamination: 12 rows are actually USD, unmarked
    usd_idx = df.sample(12, random_state=17).index
    df.loc[usd_idx, "amount_inr"] = np.round(df.loc[usd_idx, "amount_inr"] / 83.0, 2)

    # (f) zero-amount and negative-amount rows -> the "impossible value" check
    z_idx = df.sample(15, random_state=19).index
    df.loc[z_idx, "amount_inr"] = 0.0
    neg_idx = df.sample(8, random_state=23).index
    df.loc[neg_idx, "amount_inr"] = -df.loc[neg_idx, "amount_inr"].abs()

    # (g) Unix-epoch default dates -> "1970-01-01 means missing"
    ep_idx = df.sample(9, random_state=29).index
    df.loc[ep_idx, "txn_date"] = "1970-01-01"

    # (h) whitespace / case noise in city
    c_idx = df.sample(120, random_state=31).index
    df.loc[c_idx, "city"] = df.loc[c_idx, "city"].map(lambda c: f" {c.upper()} ")

    df = df.sample(frac=1, random_state=3).reset_index(drop=True)
    df.to_csv(f"{OUT}/messy_transactions.csv", index=False)
    return df


# ============================================================================
# 3. client_book.csv — wealth-management clients (M3, 3.5, 5, 8A)
# ============================================================================
def make_clients():
    n = 1000
    cities = ["Mumbai", "Delhi", "Bengaluru", "Chennai", "Hyderabad", "Pune", "Kolkata", "Ahmedabad"]
    segs = ["Mass", "Affluent", "HNI", "Ultra-HNI"]
    seg_p = [0.52, 0.30, 0.15, 0.03]

    seg = rng.choice(segs, n, p=seg_p)
    base = {"Mass": 4.2, "Affluent": 6.2, "HNI": 7.6, "Ultra-HNI": 8.8}
    aum = np.array([np.exp(rng.normal(base[s], 0.55)) * 10000 for s in seg])

    tenure = rng.integers(1, 145, n)          # months
    risk = rng.choice(["Conservative", "Moderate", "Aggressive"], n, p=[0.35, 0.45, 0.20])
    products = rng.integers(1, 7, n)
    # churn depends on tenure, products, segment — a learnable pattern for M5
    churn_logit = (-0.15 - 0.013 * tenure - 0.30 * products
                   + np.where(seg == "Mass", 0.85, 0.0)
                   + np.where(df_sip_placeholder := rng.random(n) < 0.42, 0.35, -0.25)
                   + rng.normal(0, 0.55, n))
    churn_p = 1 / (1 + np.exp(-churn_logit))
    churned = (rng.random(n) < churn_p).astype(int)   # ~18-22% churn: enough signal to model

    df = pd.DataFrame({
        "client_id": [f"CUST{i:04d}" for i in range(1, n + 1)],
        "onboard_date": [(datetime(2026, 1, 1) - timedelta(days=int(t) * 30)).strftime("%Y-%m-%d")
                         for t in tenure],
        "city": rng.choice(cities, n),
        "segment": seg,
        "risk_profile": risk,
        "aum_inr": np.round(aum, 0),
        "products_held": products,
        "tenure_months": tenure,
        "sip_active": rng.choice([0, 1], n, p=[0.42, 0.58]),
        "relationship_manager": [f"RM{int(x):02d}" for x in rng.integers(1, 26, n)],
        "churned": churned,
    })

    # --- PLANTED (mild) DEFECTS: this set is teachable, not hostile ----------
    df.loc[df.sample(28, random_state=5).index, "risk_profile"] = np.nan   # missing field
    df.loc[df.sample(6, random_state=9).index, "aum_inr"] = np.nan
    # survivorship teaching hook: churned clients' AUM frozen at exit, documented in registry
    df.to_csv(f"{OUT}/client_book.csv", index=False)
    return df


# ============================================================================
# 4. company_financials.csv — "MoneyMart India" P&L, ₹ crore (M4, 5, 6, 8B)
# ============================================================================
def make_financials():
    years = list(range(2016, 2026))
    rev = [2450]
    for i in range(1, len(years)):
        g = 0.155 if years[i] not in (2020, 2021) else -0.06   # COVID dip = regime change
        rev.append(round(rev[-1] * (1 + g + rng.normal(0, 0.025)), 1))

    rows = []
    for i, y in enumerate(years):
        revenue = rev[i]
        cogs = round(revenue * rng.normal(0.615, 0.012), 1)
        gross = round(revenue - cogs, 1)
        emp = round(revenue * rng.normal(0.118, 0.008), 1)
        mkt = round(revenue * rng.normal(0.061, 0.009), 1)
        other = round(revenue * rng.normal(0.072, 0.006), 1)
        ebitda = round(gross - emp - mkt - other, 1)
        dep = round(revenue * rng.normal(0.033, 0.004), 1)
        ebit = round(ebitda - dep, 1)
        interest = round(revenue * rng.normal(0.017, 0.003), 1)
        pbt = round(ebit - interest, 1)
        tax = round(max(pbt, 0) * 0.252, 1)
        pat = round(pbt - tax, 1)
        rows.append({
            "fiscal_year": f"FY{str(y)[2:]}-{str(y + 1)[2:]}",
            "revenue_cr": revenue, "cogs_cr": cogs, "gross_profit_cr": gross,
            "employee_cost_cr": emp, "marketing_cr": mkt, "other_opex_cr": other,
            "ebitda_cr": ebitda, "depreciation_cr": dep, "ebit_cr": ebit,
            "interest_cr": interest, "pbt_cr": pbt, "tax_cr": tax, "pat_cr": pat,
            "stores_count": int(180 * (1.09 ** i)),
            "avg_ticket_size_inr": round(880 * (1.045 ** i) + rng.normal(0, 12), 0),
        })

    df = pd.DataFrame(rows)
    # --- PLANTED DEFECT: FY20-21 revenue was RESTATED (point-in-time bias hook)
    df["revenue_cr_as_first_reported"] = df["revenue_cr"]
    covid_idx = df.index[df["fiscal_year"] == "FY20-21"]
    df.loc[covid_idx, "revenue_cr_as_first_reported"] = round(
        float(df.loc[covid_idx, "revenue_cr"].iloc[0]) * 1.043, 1)
    df.to_csv(f"{OUT}/company_financials.csv", index=False)
    return df


# ============================================================================
# 5. nse_stock_universe.csv — 20 NSE stocks, long format (M9, 11, 12)
# ============================================================================
def make_universe():
    stocks = [
        ("RELIANCE.NS", "Energy", 2380, 0.0142), ("TCS.NS", "IT", 3450, 0.0118),
        ("HDFCBANK.NS", "Financials", 1520, 0.0125), ("INFY.NS", "IT", 1480, 0.0131),
        ("ICICIBANK.NS", "Financials", 940, 0.0134), ("HINDUNILVR.NS", "FMCG", 2510, 0.0102),
        ("ITC.NS", "FMCG", 415, 0.0110), ("SBIN.NS", "Financials", 590, 0.0158),
        ("BHARTIARTL.NS", "Telecom", 880, 0.0139), ("KOTAKBANK.NS", "Financials", 1760, 0.0128),
        ("LT.NS", "Infrastructure", 2340, 0.0146), ("AXISBANK.NS", "Financials", 980, 0.0151),
        ("ASIANPAINT.NS", "Materials", 3120, 0.0129), ("MARUTI.NS", "Auto", 9450, 0.0143),
        ("TATAMOTORS.NS", "Auto", 620, 0.0212), ("SUNPHARMA.NS", "Pharma", 1180, 0.0124),
        ("TITAN.NS", "Consumer", 2890, 0.0148), ("WIPRO.NS", "IT", 425, 0.0136),
        ("NESTLEIND.NS", "FMCG", 2210, 0.0096), ("POWERGRID.NS", "Utilities", 245, 0.0113),
    ]
    days = trading_days("2022-01-03", "2025-12-31")
    n = len(days)
    market = rng.normal(0.0004, 0.0072, n)          # common factor -> correlation exists
    sector_f = {s: rng.normal(0, 0.0045, n) for s in set(x[1] for x in stocks)}

    frames = []
    for ticker, sector, p0, vol in stocks:
        idio = rng.normal(0, vol * 0.88, n)
        beta = rng.uniform(0.65, 1.45)
        r = beta * market + 0.55 * sector_f[sector] + idio
        price = p0 * np.exp(np.cumsum(r))
        frames.append(pd.DataFrame({
            "date": days.strftime("%Y-%m-%d"),
            "ticker": ticker,
            "sector": sector,
            "close": np.round(price, 2),
            "volume": rng.lognormal(15.2, 0.35, n).astype(int),
        }))
    df = pd.concat(frames, ignore_index=True)

    # --- PLANTED DEFECT: one stock has a 1:5 split, unadjusted (M1's lesson, live)
    mask = (df["ticker"] == "TATAMOTORS.NS") & (df["date"] >= "2024-09-02")
    df.loc[mask, "close"] = np.round(df.loc[mask, "close"] / 5, 2)
    df.to_csv(f"{OUT}/nse_stock_universe.csv", index=False)
    return df


if __name__ == "__main__":
    import os
    os.makedirs(OUT, exist_ok=True)
    a = make_nifty();        print(f"nifty50_prices.csv       {a.shape}")
    b = make_transactions(); print(f"messy_transactions.csv   {b.shape}")
    c = make_clients();      print(f"client_book.csv          {c.shape}")
    d = make_financials();   print(f"company_financials.csv   {d.shape}")
    e = make_universe();     print(f"nse_stock_universe.csv   {e.shape}")
