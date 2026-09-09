# Appendix C · Ship It: Git, GitHub, and Free Deployment

*Reading time: about 45 minutes, then about an hour of doing. This appendix exists because of a hard truth: **a capstone on your laptop is homework; a capstone at a public link is a portfolio.** Module 13 asks you to ship. This is the missing manual for shipping. It covers four things: git (the save-point system), GitHub (the public home for your code), Streamlit Community Cloud (free hosting for your capstone app), and a short awareness tour of other deployment tools. Everything here is free. Everything here works on a normal Windows laptop.*

---

## C.1 — Why Learn This At All

Three honest reasons.

**First: recruiters click links.** "I built an interactive analytics app" is a claim. A working URL is proof. The difference in an interview is enormous.

**Second: this is half of every analytics job posting.** Look at Appendix B's roles again. "Version control" and "Git" appear constantly. Teams cannot work together on code without it. Knowing git at a basic level is now as expected as knowing Excel.

**Third: it protects your own work.** Git gives you save points. Before any risky change, you save. If the change goes wrong, you go back. Once you have this habit, you will never again lose a working version of anything.

One mindset note before we start: **you will see scary error messages.** Everyone does. This appendix shows you the four most common ones and their one-line fixes. An error message is not failure. It is the tool talking to you.

---

## C.2 — Git in Ten Commands

**What git is:** a save-point system for a folder. You work normally. At good moments, you "commit" — git photographs the entire folder and stores the photo. Forever. You can look at old photos, compare them, and go back to any of them.

**Install (once):** download "Git for Windows" from git-scm.com. Run the installer. Accept every default. Then close and reopen your terminal. Check it worked:

```
git --version
```

**Set your identity (once ever):** every save point is stamped with a name and email. Use the email of your GitHub account (section C.3) so your work is credited to you:

```
git config --global user.name "Your Name"
git config --global user.email "your-github-email@gmail.com"
```

**The daily five.** Open a terminal in your project folder (in VS Code: Terminal → New Terminal). Then:

```
git init                      # 1. turn this folder into a git project (once per project)
git status                    # 2. what has changed since the last save point?
git add .                     # 3. stage everything ("include all changes in the next photo")
git commit -m "First working version"    # 4. take the photo, with a caption
git log --oneline             # 5. list all photos so far
```

That is 90% of real-world git use. Change files → `status` → `add .` → `commit -m "what I did"`. Repeat forever.

**The safety net, when things go wrong:**

```
git checkout -- .             # throw away all changes since the last commit
```

This is the "undo everything since my last save point" command. It is the whole reason git exists.

**One important file: `.gitignore`.** Some things should never go into your save points: huge library folders, passwords, temporary files. Create a plain text file named `.gitignore` in your project folder. For a capstone project, this content is enough:

```
__pycache__/
.venv/
venv/
.env
*.log
.ipynb_checkpoints/
```

Each line is a pattern git will ignore. Create this file **before** your first `git add .` — it is much easier than removing things later.

### The four famous errors, decoded

1. **"detected dubious ownership in repository"** — Windows says the folder's owner does not match your login. Git even prints the fix. Copy and run the `git config --global --add safe.directory "..."` line it shows you. Done.
2. **"Please tell me who you are"** — you skipped the identity step. Run the two `git config` commands above.
3. **You committed a giant folder by mistake** (the commit said "10,000 files changed") — your `.gitignore` was missing. Add the file, then run `git rm -r --cached .` followed by `git add .` and commit again. The ignored folders drop out.
4. **"not a git repository"** — you are in the wrong folder, or you never ran `git init`. Check with `cd` and try again.

---

## C.3 — GitHub: Your Code's Public Home

**What GitHub is:** a website that stores git projects online. Your local git has the save points; GitHub keeps a copy of them on the internet. That gives you three things: a backup, a public portfolio page, and (later) a way to work with others.

**Step 1 — Account (once):** sign up at github.com. Your username becomes part of your portfolio URL, so choose something professional.

**Step 2 — Create an empty repository:** click the **+** icon (top right) → New repository. Give it a clear name (`financial-analytics-capstone`). Set it to **Public** — this is your portfolio; public is the point. Leave every checkbox (README, .gitignore, license) **unticked**, because your local project already has files. Click Create.

**Step 3 — Connect and push.** GitHub shows you commands. The three that matter, run in your project folder:

```
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
git push -u origin main
```

The first push opens a browser window: "Connect to GitHub." Sign in once. Git remembers you afterwards.

**Step 4 — Verify:** refresh the repository page in your browser. Your files should be there, with your commit message at the top. That page is now a link you can put on a CV.

**The rhythm from now on:** after every good working session:

```
git add .
git commit -m "what changed"
git push
```

Three commands. Your save point is taken *and* backed up online.

**One rule, non-negotiable:** never push secrets. No passwords, no API keys, no personal data files. That is what `.gitignore` and the `.env` pattern are for. A secret pushed to a public repo should be treated as stolen — change it immediately.

**The finishing touch — a README.** The front page of your repository is a file called `README.md`. Module 13's rule applies: a stranger should be able to run your project within five minutes of reading it. Minimum contents: what the project is (two sentences), how to run it (exact commands), what is in each folder, and a link to your live app (next section).

---

## C.4 — Deploy Your Capstone: Streamlit Community Cloud

**What it is:** a free hosting service by Streamlit. You point it at your GitHub repository. It runs your app on their servers and gives you a public URL like `yourapp.streamlit.app`. When you push changes to GitHub, the app updates by itself.

**Before you deploy — two files must be in your repo:**

**1. Your app file** (`capstone_app.py`) plus any data files it reads. Check the paths: the app must read data with *relative* paths (`data/client_book.csv`), never a Windows path (`D:\Users\...`). The cloud server is not your laptop.

**2. `requirements.txt`** — the list of Python libraries your app needs. The cloud installs exactly these. For the course capstone skeleton, this file is enough:

```
streamlit
pandas
numpy
matplotlib
```

One library per line. If your app imports something else (seaborn, scipy), add a line for it. **The most common deployment failure is a missing line in this file** — the error log will say `ModuleNotFoundError: No module named 'X'`, and the fix is adding `X` to requirements.txt and pushing.

**The deployment, step by step:**

1. Go to **share.streamlit.io** and sign in **with your GitHub account** (that's the whole integration).
2. Click **New app**.
3. Pick your repository, the branch (`main`), and the app file path (`capstone_app.py` — or `streamlit/capstone_app.py` if it sits in a folder).
4. Click **Deploy**. Watch the build log run — it installs your requirements, then starts the app.
5. Two minutes later: your app is live at a public URL. Open it. Test every control.

**When it fails (it often does, once):** read the log on the right side of the screen. Ninety percent of failures are one of three things: a library missing from requirements.txt (add it, push), a file path that only exists on your laptop (make it relative, push), or a data file you forgot to commit (add it, push). Every push automatically triggers a rebuild — the fix loop is fast.

**Housekeeping to know:** free apps go to sleep after some days without visitors — the first visitor wakes them (it takes ~30 seconds; this is normal, not broken). Keep the app light: read files at startup with `@st.cache_data` (your Module 4 app already does this) and avoid huge datasets.

**Then complete the loop:** put the live URL at the top of your README, and put the repo link inside your app's About section. Recruiter clicks either one, finds both. That is a shipped capstone.

---

## C.5 — The Wider World, in One Page (Awareness Level)

You will hear other tool names. Here is what each is for, so none of them intimidates you:

- **Vercel / Netlify** — free hosting for *websites* (like this course site itself, which runs on Vercel). If you ever build a web front-end, this is its home. Same pattern you just learned: connect GitHub → push → auto-deploy.
- **Hugging Face Spaces** — free hosting for ML demo apps; supports Streamlit too. An alternative to Streamlit Cloud, popular in the ML world you may enter next.
- **Docker** — a way to package an app with its entire environment so it runs identically anywhere. You do not need it yet. When a job posting mentions it, it means "we deploy things seriously."
- **CI/CD** (e.g., GitHub Actions) — robots that run checks automatically on every push. This course's own repository uses one: every push re-validates all sixteen modules against the schema. That is CI. You have already benefited from it.
- **Cloud platforms (AWS / Azure / GCP)** — where companies rent servers. Enterprise deployment lives there. Learn it when a job requires it, not before.

The pattern behind all of them is the one you now own: **code lives in git → GitHub is the shared truth → a service watches GitHub and publishes automatically.** Every professional deployment is a bigger version of what you did in C.4.

---

## C.6 — The Shipping Checklist

Run this list when your capstone is ready:

- [ ] `.gitignore` in place before the first commit (no venv, no secrets, no checkpoints)
- [ ] Git identity set with your GitHub email
- [ ] Repository is Public, clearly named, with a README a stranger can follow in five minutes
- [ ] All data files the app needs are committed, and all paths are relative
- [ ] `requirements.txt` lists every imported library
- [ ] App deployed on Streamlit Community Cloud; every control tested on the live URL
- [ ] Live URL in the README; repo link in the app's About
- [ ] The habit installed: add → commit → push after every good session

**Try this (tonight, 30 minutes):** don't wait for the capstone. Take your Module 4 dashboard (`m4_price_dashboard.py`), make a tiny practice repo, and deploy it end-to-end using C.2 → C.4. Hitting the requirements.txt error on a practice app — and fixing it in one push — is the cheapest education in this entire appendix. When the capstone's turn comes, shipping will be routine.

*Tool interfaces change. If a button has moved since this was written, the pattern has not: git → GitHub → connect → deploy. Search the tool's own docs for the current screenshots.*
