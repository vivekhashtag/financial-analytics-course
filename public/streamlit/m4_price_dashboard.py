"""
Module 4 - Your First Streamlit Dashboard
=========================================
A live NIFTY 50 dashboard in ~90 lines.

HOW TO RUN (in VS Code or any terminal):
    1. pip install streamlit pandas numpy matplotlib
    2. Put nifty50_prices.csv in a folder called data/ next to this file
       (or change DATA_PATH below)
    3. streamlit run m4_price_dashboard.py
    4. A browser tab opens at http://localhost:8501 - that's your app.

Every st.something() call paints one element on the page, top to bottom.
Change any value in the sidebar and Streamlit re-runs this whole script -
that's the entire mental model: a script that re-runs on every interaction.
"""

import streamlit as st
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

DATA_PATH = "data/nifty50_prices.csv"

# ---------- Page setup ----------
st.set_page_config(page_title="NIFTY 50 Dashboard", layout="wide")
st.title("NIFTY 50 — Descriptive Dashboard")
st.caption("Module 4 · Financial Analytics Course · course data (synthetic)")

# ---------- Load data (cached so it reads the file only once) ----------
@st.cache_data
def load_prices(path):
    df = pd.read_csv(path, parse_dates=["date"]).sort_values("date")
    df["ret"] = df["close"].pct_change()
    return df

px = load_prices(DATA_PATH)

# ---------- Sidebar controls ----------
st.sidebar.header("Controls")
years = sorted(px["date"].dt.year.unique())
year_range = st.sidebar.select_slider(
    "Year range", options=years, value=(years[0], years[-1]))
ma_window = st.sidebar.slider("Moving-average window (days)", 10, 200, 50, step=10)
show_band = st.sidebar.checkbox("Show ±2σ band", value=True)

# Filter to the chosen years
mask = px["date"].dt.year.between(year_range[0], year_range[1])
d = px[mask].copy()
d["ma"] = d["close"].rolling(ma_window).mean()
d["sd"] = d["close"].rolling(ma_window).std()

# ---------- KPI row ----------
col1, col2, col3, col4 = st.columns(4)
period_ret = d["close"].iloc[-1] / d["close"].iloc[0] - 1
ann_vol = d["ret"].std() * np.sqrt(252)
drawdown = (d["close"] / d["close"].cummax() - 1).min()

col1.metric("Latest close", f"{d['close'].iloc[-1]:,.0f}")
col2.metric("Period return", f"{period_ret*100:+.1f}%")
col3.metric("Annualised vol", f"{ann_vol*100:.1f}%")
col4.metric("Max drawdown", f"{drawdown*100:.1f}%")

# ---------- Price chart ----------
st.subheader("Price with moving average")
fig, ax = plt.subplots(figsize=(11, 4))
ax.plot(d["date"], d["close"], lw=0.8, color="#94A3B8", label="Close")
ax.plot(d["date"], d["ma"], lw=1.8, color="#2563EB", label=f"{ma_window}-day MA")
if show_band:
    ax.fill_between(d["date"], d["ma"] - 2*d["sd"], d["ma"] + 2*d["sd"],
                    alpha=0.15, color="#2563EB", label="±2σ band")
ax.legend(fontsize=8)
ax.grid(alpha=0.3)
st.pyplot(fig)

# ---------- Two-column detail row ----------
left, right = st.columns(2)

with left:
    st.subheader("Return distribution")
    fig2, ax2 = plt.subplots(figsize=(5.5, 3.5))
    ax2.hist(d["ret"].dropna() * 100, bins=60, color="#7C3AED", alpha=0.8)
    ax2.set_xlabel("Daily return (%)")
    ax2.grid(alpha=0.3)
    st.pyplot(fig2)

with right:
    st.subheader("Drawdown")
    dd = d["close"] / d["close"].cummax() - 1
    fig3, ax3 = plt.subplots(figsize=(5.5, 3.5))
    ax3.fill_between(d["date"], dd * 100, 0, color="#DC2626", alpha=0.5)
    ax3.set_ylabel("% below peak")
    ax3.grid(alpha=0.3)
    st.pyplot(fig3)

# ---------- Data peek ----------
with st.expander("Peek at the underlying data"):
    st.dataframe(d.tail(20), use_container_width=True)
    st.caption("Remember Module 1: this dataset has documented quirks - "
               "volume is blank for 2021, and 2024-08-13 contains a fat-finger high.")
