# Course Content Schema v1.0

**The contract between content and code.** Content authors fill this shape; the Next.js app renders it. Neither side needs to know about the other.

## File layout

```
content/
  modules/
    00-orientation/
      module.json          ← metadata + structure (validated against schema)
      pages/
        01-why-this-course.mdx
        02-course-map.mdx
        ...
      quiz.json
      exercises.json       ← optional
notebooks/                 ← .ipynb files, referenced by path from module.json
data/                      ← CSVs, served for download + Colab fetch
```

**Why MDX for pages, JSON for structure:** prose needs to be writable and reviewable as text; structure needs to be validated and queried. MDX bodies can embed widget components inline (`<StatCounter />`, `<BiasGame />`); JSON drives navigation, progress, gating, and search.

---

## `module.json`

```jsonc
{
  "id": "00-orientation",           // stable slug, matches folder name
  "number": "0",                    // display number ("0", "1.5", "8B")
  "part": "A",                      // A | B | C | D | capstone | appendix
  "title": "Orientation: How This Course Works",
  "subtitle": "And how to learn with AI",
  "estimatedMinutes": 120,
  "status": "published",            // draft | review | published

  "prerequisites": [],              // module ids
  "learningOutcomes": [
    "Set up a working Python environment via Colab",
    "Apply the AI Learning Charter to your own study"
  ],

  "pages": [
    { "slug": "why-this-course", "title": "Why This Course Exists", "file": "pages/01-why-this-course.mdx" }
  ],

  "notebooks": [
    {
      "id": "00_setup_check",
      "title": "Setup Check — Your First Notebook",
      "file": "notebooks/00_setup_check.ipynb",
      "colabEnabled": true,
      "datasets": [],               // dataset ids this notebook needs
      "packages": ["pandas", "numpy", "matplotlib"],
      "solutionFile": null          // path, or null if none
    }
  ],

  "streamlitApps": [],              // see shape below — download-and-run-locally .py files

  "quiz": { "file": "quiz.json", "passingScore": 6 },
  "exercises": { "file": "exercises.json" },

  "biasCheck": {                    // null for modules before M1
    "enabled": false,
    "prompt": null
  },

  "aiSidebar": {
    "green": [
      { "situation": "Explain code", "prompt": "Explain this Python code line by line as if I'm a beginner: [paste]" }
    ],
    "red": [
      { "danger": "Financial figures", "why": "LLMs invent numbers confidently", "rule": "Every number needs a clickable source" }
    ]
  },

  "streamConnector": {              // null where not applicable
    "corporateFinance": "…",
    "assetManagement": "…",
    "banking": "…",
    "markets": "…"
  },

  "badge": { "id": "environment-ready", "label": "Environment Ready", "icon": "rocket" },

  "caseStudy": {                    // null if none
    "id": "knight-capital-2012",
    "title": "Knight Capital, 2012",
    "hook": "One wrong setting on one computer lost $440M in 45 minutes",
    "lesson": "Check the data and config before trusting the machine",
    "file": "pages/case-knight-capital.mdx"
  },

  "widgets": ["StatCounter", "CourseMetroMap", "AICharterCards"]
}
```

### `streamlitApps[]` shape
```jsonc
{
  "id": "m4_price_dashboard",
  "title": "NIFTY Price Dashboard",
  "file": "streamlit/m4_price_dashboard.py",
  "runInstructions": "pip install streamlit pandas plotly  →  streamlit run m4_price_dashboard.py",
  "datasets": ["nifty50_prices"]
}
```
Streamlit is **always download-and-run-locally in VS Code** — never embedded. The app renders a download card, the run command, and a screenshot/GIF of the expected result.

---

## `quiz.json`

```jsonc
{
  "questions": [
    {
      "id": "q1",
      "type": "single",            // single | multi | truefalse | match | numeric
      "prompt": "Roughly what fraction of US equity trading volume is algorithmic?",
      "options": ["~25%", "~50%", "~75%", "~95%"],
      "answer": 2,                 // index, or array for multi
      "explanation": "About three-quarters — up from ~25% in 2005.",
      "difficulty": "easy"
    },
    {
      "id": "q5",
      "type": "match",
      "prompt": "Match each example to its data bucket",
      "pairs": [
        { "left": "Satellite images of parking lots", "right": "Alternative" },
        { "left": "Quarterly P&L", "right": "Quantitative" }
      ],
      "explanation": "…"
    }
  ]
}
```

## `exercises.json`

```jsonc
{
  "exercises": [
    {
      "id": "m2-e07",
      "type": "code",              // code | form | sort | scenario
      "title": "Portfolio value function",
      "brief": "Write compute_value(holdings, prices) returning total ₹ value.",
      "starterCode": "def compute_value(holdings, prices):\n    # your code here\n    pass",
      "checkCode": "assert compute_value({'TCS.NS': 10}, {'TCS.NS': 3450}) == 34500",
      "hints": ["Loop over holdings.items()", "Multiply quantity by price"],
      "solution": "def compute_value(holdings, prices):\n    return sum(q * prices[t] for t, q in holdings.items())",
      "points": 2
    },
    {
      "id": "m1-e01",
      "type": "form",              // guided form, e.g. the Trust Report
      "title": "Trust Report — messy_transactions.csv",
      "fields": [
        { "id": "pillars", "label": "Which quality pillars look violated?", "type": "multiselect",
          "options": ["Accuracy","Completeness","Consistency","Timeliness","Lineage","Auditability"],
          "modelAnswer": ["Accuracy","Completeness","Consistency"] }
      ],
      "modelReport": "pages/model-trust-report-b.mdx"
    }
  ]
}
```

**Auto-check philosophy:** `code` exercises run in the learner's notebook (the app ships the assert cell), not in-browser. The app tracks self-reported completion + the notebook's own pass/fail output. No in-browser Python runtime in v1 — it doubles build complexity for marginal gain.

---

## Dataset registry (`data/datasets.json`)

```jsonc
{
  "datasets": [
    {
      "id": "nifty50_prices",
      "file": "data/nifty50_prices.csv",
      "title": "NIFTY 50 Daily Prices",
      "rows": 1277, "cols": 6,
      "grain": "One NSE trading day, 2021-01-01 → 2025-12-31",
      "units": "Index points; volume in contracts",
      "synthetic": true,
      "usedIn": ["00-orientation", "03-pandas", "04-descriptive", "06-predictive", "09-lab-timeseries", "10-lab-simulation"],
      "quirks": [
        { "code": "a", "quirk": "volume blank for all of 2021", "teaches": "Field-level completeness" }
      ],
      "rawUrl": "/data/nifty50_prices.csv"    // Colab fetches this via pd.read_csv(URL)
    }
  ]
}
```

The `rawUrl` matters: notebooks must load data by URL, not local file, so they work identically in Colab and locally. Standard first cell:
```python
BASE = "https://<course-domain>/data/"
prices = pd.read_csv(BASE + "nifty50_prices.csv", parse_dates=["date"])
```

---

## Design tokens (`schema/tokens.json`)

**Brand direction: light mode, colourful, student-friendly.** Each course Part gets its own accent so learners orient by colour on the metro-map.

```jsonc
{
  "color": {
    "bg":        "#FFFFFF",
    "surface":   "#F7F9FC",
    "border":    "#E3E8EF",
    "text":      "#0F172A",
    "textMuted": "#5B6B84",
    "primary":   "#2563EB",     // course primary — bright blue
    "primaryFg": "#FFFFFF",
    "part": {
      "A": "#2563EB",           // Foundations — blue
      "B": "#7C3AED",           // Four Questions — violet
      "C": "#0D9488",           // Finance Map — teal
      "D": "#EA580C",           // Labs — orange
      "capstone": "#DB2777"     // Capstone — pink
    },
    "semantic": {
      "success": "#16A34A", "warn": "#D97706", "danger": "#DC2626", "info": "#0284C7"
    },
    "chart": ["#2563EB","#7C3AED","#0D9488","#EA580C","#DB2777","#16A34A","#D97706","#0891B2"]
  },
  "font": {
    "sans": "Inter, system-ui, sans-serif",
    "mono": "JetBrains Mono, ui-monospace, monospace",
    "scale": { "xs":"0.8rem","sm":"0.9rem","base":"1rem","lg":"1.15rem","xl":"1.4rem","2xl":"1.85rem","3xl":"2.4rem","4xl":"3rem" }
  },
  "radius": { "sm":"6px","md":"10px","lg":"16px","xl":"24px" },
  "shadow": { "card":"0 1px 3px rgba(15,23,42,.08), 0 8px 24px rgba(15,23,42,.06)" },
  "space":  { "1":"4px","2":"8px","3":"12px","4":"16px","6":"24px","8":"32px","12":"48px","16":"64px" }
}
```

---

## Widget registry

Components MDX pages may embed. Claude Code implements these; content references them by name.

| Widget | Used by | Purpose |
|---|---|---|
| `StatCounter` | M0 | Count-up animated stat cards |
| `CourseMetroMap` | M0, global nav | Interactive journey map, colour-coded by Part |
| `AICharterCards` | M0 | Green/Red flip cards |
| `NotebookCard` | all | Download + Open-in-Colab + package list |
| `StreamlitCard` | M4+ | Download .py + run instructions + preview GIF |
| `Quiz` | all | Renders quiz.json, instant feedback, scoring |
| `SortingGame` | M1 | Drag-and-drop bucket classification |
| `FlipCards` | M1 | Six quality pillars with reveal |
| `BiasDetective` | M1 | Scenario cards, streak counter |
| `TrustReportForm` | M1 | Guided form + model-answer diff |
| `DatasetPreview` | M1, M3 | Renders a CSV slice as a table with quirk annotations |
| `CodePeek` | M2+ | Read-only syntax-highlighted snippet with copy button |
| `ExerciseList` | M2+ | Renders exercises.json with hints/solution gating |
| `BiasCheckBlock` | M9+ | The recurring four-bias ritual form |
| `ForecastSlider` | M9 | Horizon slider → widening intervals |
| `MonteCarloPaths` | M10 | Animated path fan |
| `OrderBookViewer` | M11 | Animated bid/ask ladder |
| `Frontier3D` | M12 | 3D risk-return-weight surface (Plotly) |

---

## Progress & gating

```jsonc
// per learner, persisted client-side (v1) or in DB (v2)
{
  "moduleId": "00-orientation",
  "pagesRead": ["why-this-course", "course-map"],
  "notebooksDownloaded": ["00_setup_check"],
  "quizScore": 7,
  "exercisesComplete": ["m0-e01"],
  "badges": ["environment-ready"],
  "completedAt": "2026-08-17T10:20:00Z"
}
```
Gating is **soft** — a module suggests prerequisites but never hard-blocks. Students hate walls; nudges work better.

---

## Validation

`schema/module.schema.json` (JSON Schema draft-07) validates every `module.json` in CI. A module that doesn't validate doesn't build. This is what lets content and code be written in parallel by different people at different times.
