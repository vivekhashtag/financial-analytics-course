"""
Module 13 - Capstone App Skeleton
=================================
Your capstone ships as a Streamlit app built on this skeleton.
Replace every CAPS placeholder; keep the four sections - they mirror
the ladder and the graders (including future employers) expect them.

Run:  streamlit run capstone_app.py     (data/ folder alongside)
"""

import streamlit as st
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

st.set_page_config(page_title="YOUR CAPSTONE TITLE", layout="wide")

# ---------- Header: the memo's headline, verbatim ----------
st.title("YOUR CAPSTONE TITLE")
st.markdown("**Headline:** YOUR ONE-SENTENCE RECOMMENDATION + KEY NUMBER + CONFIDENCE.")
st.caption("Track: ___ · Data: ___ (synthetic course data / own data) · Author: ___ · AI disclosure in About tab")

@st.cache_data
def load_data():
    # EXAMPLE (wealth track) - replace with your track's load + any cleaning
    df = pd.read_csv("data/client_book.csv", parse_dates=["onboard_date"])
    return df

df = load_data()

tab1, tab2, tab3, tab4 = st.tabs(["📊 What happened", "🔎 Why", "🔮 What's likely", "🎯 What to do"])

with tab1:
    st.subheader("Describe")
    # THE CHAMPION EXHIBIT lives here, with one control that matters
    seg = st.multiselect("Segments", sorted(df["segment"].unique()),
                         default=sorted(df["segment"].unique()))
    d = df[df["segment"].isin(seg)]
    c1, c2, c3 = st.columns(3)
    c1.metric("Clients", f"{len(d):,}")
    c2.metric("Churn rate", f"{d['churned'].mean():.1%}")
    c3.metric("Total AUM", f"Rs {d['aum_inr'].sum()/1e7:,.1f} cr")

    fig, ax = plt.subplots(figsize=(8, 3.2))
    g = d.groupby("products_held")["churned"].mean()
    ax.plot(g.index, g.values*100, marker="o", color="#0D9488")
    ax.set_title("REPLACE: your finding as a sentence", loc="left", fontweight="bold")
    ax.set_xlabel("products held"); ax.set_ylabel("churn %")
    st.pyplot(fig)

with tab2:
    st.subheader("Diagnose")
    st.markdown("- Decomposition / adjusted comparison result: **___**\n"
                "- Hidden-populations check: **___**\n"
                "- Candidate mechanisms (all): **___** · The test that separates them: **___**")

with tab3:
    st.subheader("Predict")
    st.markdown("**Central estimate ___, we'd be surprised outside ___ – ___,** "
                "assuming **___** (the load-bearing assumption).")
    st.info("Floor used: ___ · Beaten by: ___ · Split/walk-forward: ___")

with tab4:
    st.subheader("Prescribe")
    st.markdown("**Recommendation:** ___\n\n"
                "**Sensitivity:** the decision flips if ___\n\n"
                "**We'd change our mind if:** ___")

with st.expander("ℹ️ About: methods, biases checked, AI disclosure"):
    st.markdown("**Bias check:** look-ahead ___ · survivorship ___ · point-in-time ___ · regime ___\n\n"
                "**Seed & N where simulated:** ___\n\n**AI disclosure:** ___")
