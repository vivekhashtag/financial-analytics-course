#!/usr/bin/env python
"""
Generates the two printable posters the course prose offers for download:

    public/posters/ai-charter.pdf     <- Module 0, "The AI Learning Charter"
    public/posters/four-biases.pdf    <- Module 1, "The Four Biases..."

Both were referenced by a `<Download />` in the lesson text long before they
existed, so the app rendered an inert card naming a missing file. This closes
that.

## Why it parses the content instead of restating it

Every word on these posters is already written, in the pages that offer them:
the charter's do/don't lists are Module 0's `aiSidebar` block, and the four
biases and their "Always ask" questions are headings and blockquotes in
`05-four-biases.mdx`. Retyping them here would create a second copy to keep in
sync, and the first edit to the lesson would silently make the poster wrong. So
the poster is a *rendering* of the content, and re-running this script after a
content edit reprints a correct poster.

Colours come from `schema/tokens.json` — the same single source Tailwind reads,
so a poster on a desk matches the site it came from.

Typeface is Helvetica, matching `workflows_cheatsheet.pdf` and
`samples_pack.pdf`. The course's own faces (Sora/Inter) ship as web fonts that
`next/font` self-hosts; embedding them here would mean vendoring TTFs for a
print artefact, which is not worth the weight.

## Usage

    python -m pip install reportlab      # once
    python scripts/make_posters.py       # writes both PDFs
    python scripts/make_posters.py --check   # verify only, write nothing
"""
import json
import os
import re
import sys

from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, 'public', 'posters')

W, H = A4
MARGIN = 42

# ----------------------------------------------------------------- tokens

with open(os.path.join(ROOT, 'schema', 'tokens.json'), encoding='utf-8') as fh:
    TOKENS = json.load(fh)

C = TOKENS['color']
INK = HexColor(C['text'])
MUTED = HexColor(C['textMuted'])
BORDER = HexColor(C['border'])
SURFACE = HexColor(C['surface'])
SURFACE_ALT = HexColor(C['surfaceAlt'])
PRIMARY = HexColor(C['primary'])
SUCCESS = HexColor(C['semantic']['success'])
DANGER = HexColor(C['semantic']['danger'])
WARN = HexColor(C['semantic']['warn'])
PART_A = HexColor(C['part']['A'])
WHITE = HexColor(C['bg'])

BODY = 'Helvetica'
BOLD = 'Helvetica-Bold'
ITAL = 'Helvetica-Oblique'

# ------------------------------------------------------------- text utils


# Helvetica's WinAnsi encoding has no glyph for these, and reportlab silently
# substitutes — the rupee sign was coming out as a stray "n". The samples pack
# and the docx templates already write "Rs", so match that rather than embedding
# a Unicode font for one character.
UNSAFE = {
    '₹': 'Rs ',   # rupee
    '≤': '<=',
    '≥': '>=',
    '→': '->',
    '←': '<-',
    '‘': "'",
    '’': "'",
    '…': '...',
}


def safe(text):
    """WinAnsi-safe text. Applied at every draw, so nothing reaches the page raw."""
    for bad, good in UNSAFE.items():
        text = text.replace(bad, good)
    return text


def wrap(text, font, size, width):
    """Greedy wrap to `width` points."""
    words = safe(text).split()
    lines, cur = [], ''
    for word in words:
        trial = (cur + ' ' + word).strip()
        if stringWidth(trial, font, size) <= width or not cur:
            cur = trial
        else:
            lines.append(cur)
            cur = word
    if cur:
        lines.append(cur)
    return lines


def draw_para(c, text, x, y, width, font=BODY, size=9, leading=11.5, colour=INK):
    c.setFont(font, size)
    c.setFillColor(colour)
    for line in wrap(text, font, size, width):
        c.drawString(x, y, safe(line))
        y -= leading
    return y


def strip_md(s):
    """Markdown emphasis and code ticks out; the poster has its own hierarchy."""
    s = re.sub(r'\*\*(.+?)\*\*', r'\1', s)
    s = re.sub(r'\*(.+?)\*', r'\1', s)
    s = s.replace('`', '')
    return s.strip()


def header(c, title, kicker, accent):
    """Shared poster masthead. Returns the y to carry on from."""
    c.setFillColor(accent)
    c.rect(0, H - 8, W, 8, stroke=0, fill=1)

    y = H - MARGIN - 12
    c.setFont(BOLD, 23)
    c.setFillColor(INK)
    c.drawString(MARGIN, y, safe(title))

    y -= 17
    c.setFont(BODY, 9.5)
    c.setFillColor(MUTED)
    c.drawString(MARGIN, y, safe(kicker))

    y -= 12
    c.setStrokeColor(BORDER)
    c.setLineWidth(0.8)
    c.line(MARGIN, y, W - MARGIN, y)
    return y - 22


def footer(c, source):
    c.setFont(BODY, 7.5)
    c.setFillColor(MUTED)
    c.drawString(MARGIN, MARGIN - 14, safe('Financial Analytics Course  ·  ' + source))
    c.drawRightString(W - MARGIN, MARGIN - 14, 'Print it. Pin it up.')


# --------------------------------------------------------- poster 1: charter


def read_charter():
    """The green/red lists from Module 0, plus the two rules from its page."""
    with open(
        os.path.join(ROOT, 'content', 'modules', '00-orientation', 'module.json'),
        encoding='utf-8',
    ) as fh:
        mod = json.load(fh)
    sidebar = mod['aiSidebar']

    page = os.path.join(
        ROOT, 'content', 'modules', '00-orientation', 'pages', '04-ai-charter.mdx'
    )
    with open(page, encoding='utf-8') as fh:
        src = fh.read()

    steps = re.findall(r'^\d\.\s+(.+)$', src, re.M)
    rule = re.search(r'\*\*The rule that matters most:\*\*\s*(.+)', src)

    return sidebar['green'], sidebar['red'], [strip_md(s) for s in steps], (
        strip_md(rule.group(1)) if rule else ''
    )


def poster_charter(path):
    green, red, steps, rule = read_charter()
    c = canvas.Canvas(path, pagesize=A4)
    c.setTitle('The AI Learning Charter')

    y = header(
        c,
        'The AI Learning Charter',
        'An infinitely patient tutor that never sleeps. Used badly, it makes you feel like you are learning while you learn nothing.',
        PART_A,
    )

    col_w = (W - 2 * MARGIN - 18) / 2
    left_x = MARGIN
    right_x = MARGIN + col_w + 18
    top = y

    # ---- green column
    c.setFillColor(SUCCESS)
    c.setFont(BOLD, 11)
    c.drawString(left_x, y, 'USE AI FOR THIS')
    y -= 6
    c.setStrokeColor(SUCCESS)
    c.setLineWidth(1.6)
    c.line(left_x, y, left_x + col_w, y)
    y -= 16

    for item in green:
        c.setFont(BOLD, 9.5)
        c.setFillColor(INK)
        c.drawString(left_x, y, safe(item['situation']))
        y -= 11.5
        y = draw_para(
            c, '"' + item['prompt'] + '"', left_x, y, col_w,
            font=ITAL, size=8, leading=10, colour=MUTED,
        )
        y -= 8

    green_bottom = y

    # ---- red column
    y = top
    c.setFillColor(DANGER)
    c.setFont(BOLD, 11)
    c.drawString(right_x, y, 'NEVER TRUST AI FOR THIS')
    y -= 6
    c.setStrokeColor(DANGER)
    c.setLineWidth(1.6)
    c.line(right_x, y, right_x + col_w, y)
    y -= 16

    for item in red:
        c.setFont(BOLD, 9.5)
        c.setFillColor(INK)
        c.drawString(right_x, y, safe(item['danger']))
        y -= 11
        y = draw_para(c, item['why'], right_x, y, col_w, size=8, leading=9.6, colour=MUTED)
        c.setFont(BOLD, 8)
        c.setFillColor(DANGER)
        for line in wrap('Rule: ' + item['rule'], BOLD, 8, col_w):
            c.drawString(right_x, y, safe(line))
            y -= 9.6
        y -= 7

    y = min(green_bottom, y) - 6

    # ---- the verify habit
    box_h = 20 + 12 * len(steps)
    c.setFillColor(SURFACE)
    c.setStrokeColor(BORDER)
    c.setLineWidth(0.8)
    c.roundRect(MARGIN, y - box_h, W - 2 * MARGIN, box_h, 6, stroke=1, fill=1)

    ty = y - 15
    c.setFont(BOLD, 10)
    c.setFillColor(INK)
    c.drawString(MARGIN + 12, ty, 'The verify habit — three steps, every time')
    ty -= 13
    for i, step in enumerate(steps, 1):
        c.setFont(BOLD, 8.5)
        c.setFillColor(PRIMARY)
        c.drawString(MARGIN + 12, ty, str(i) + '.')
        c.setFont(BODY, 8.5)
        c.setFillColor(INK)
        c.drawString(MARGIN + 24, ty, safe(step[:150]))
        ty -= 11

    y = y - box_h - 14

    # ---- the one rule
    if rule:
        lines = wrap(rule, BODY, 9.5, W - 2 * MARGIN - 26)
        box_h = 26 + 12 * len(lines)
        c.setFillColor(HexColor('#FEF2F2'))
        c.setStrokeColor(DANGER)
        c.setLineWidth(1.2)
        c.roundRect(MARGIN, y - box_h, W - 2 * MARGIN, box_h, 6, stroke=1, fill=1)
        ty = y - 16
        c.setFont(BOLD, 9.5)
        c.setFillColor(DANGER)
        c.drawString(MARGIN + 13, ty, 'The rule that matters most')
        ty -= 13
        c.setFont(BODY, 9.5)
        c.setFillColor(INK)
        for line in lines:
            c.drawString(MARGIN + 13, ty, safe(line))
            ty -= 12
        y = y - box_h - 14

    draw_para(
        c,
        'Disclosure: every exercise and the capstone carry one line — "AI assisted with ___" or "AI was not used." '
        'Not to punish use, to build the habit. In a real finance job, undisclosed AI use inside a model is a compliance incident.',
        MARGIN, y, W - 2 * MARGIN, size=8.5, leading=10.5, colour=MUTED,
    )

    footer(c, 'Module 0 · The AI Learning Charter')
    c.showPage()
    c.save()


# ---------------------------------------------------- poster 2: four biases


def read_biases():
    """The four headings and their 'Always ask' questions, from the lesson."""
    page = os.path.join(
        ROOT, 'content', 'modules', '01-data-foundations', 'pages', '05-four-biases.mdx'
    )
    with open(page, encoding='utf-8') as fh:
        src = fh.read()

    blocks = re.split(r'^##\s+\d\.\s+', src, flags=re.M)[1:]
    out = []
    for block in blocks:
        head, _, rest = block.partition('\n')
        name, _, nickname = head.partition('—')
        ask = re.search(r'>\s*\*\*Always ask:\*\*\s*(.+)', rest)
        # the first non-empty prose line is the definition
        body = [
            strip_md(l) for l in rest.split('\n')
            if l.strip() and not l.startswith(('>', '#', '<'))
        ]
        out.append(
            {
                'name': strip_md(name),
                'nickname': strip_md(nickname).strip('"“” '),
                'what': body[0] if body else '',
                'ask': strip_md(ask.group(1)) if ask else '',
            }
        )
    return out


def poster_biases(path):
    biases = read_biases()
    c = canvas.Canvas(path, pagesize=A4)
    c.setTitle('The Four Biases That Ruin Financial Models')

    y = header(
        c,
        'The Four Biases',
        'These four appear in every lab from Module 9 onward. Run this check before you trust any result.',
        HexColor(C['part']['B']),
    )

    inner = W - 2 * MARGIN - 26
    for i, b in enumerate(biases, 1):
        what = wrap(b['what'], BODY, 9, inner)
        ask = wrap(b['ask'], BOLD, 9, inner - 10)
        box_h = 44 + 11 * len(what) + 12 * len(ask)

        c.setFillColor(WHITE)
        c.setStrokeColor(BORDER)
        c.setLineWidth(0.9)
        c.roundRect(MARGIN, y - box_h, W - 2 * MARGIN, box_h, 7, stroke=1, fill=1)

        # numbered chip
        c.setFillColor(HexColor(C['part']['B']))
        c.circle(MARGIN + 19, y - 19, 10.5, stroke=0, fill=1)
        c.setFont(BOLD, 11)
        c.setFillColor(WHITE)
        c.drawCentredString(MARGIN + 19, y - 22.5, str(i))

        ty = y - 15
        c.setFont(BOLD, 12)
        c.setFillColor(INK)
        c.drawString(MARGIN + 38, ty, safe(b['name']))
        if b['nickname']:
            c.setFont(ITAL, 9)
            c.setFillColor(MUTED)
            c.drawString(
                MARGIN + 40 + stringWidth(safe(b['name']), BOLD, 12), ty, safe('“' + b['nickname'] + '”')
            )

        ty -= 15
        c.setFont(BODY, 9)
        c.setFillColor(INK)
        for line in what:
            c.drawString(MARGIN + 38, ty, safe(line))
            ty -= 11

        ty -= 4
        c.setStrokeColor(WARN)
        c.setLineWidth(2)
        c.line(MARGIN + 38, ty + 8, MARGIN + 38, ty + 8 - 12 * len(ask))
        c.setFont(BOLD, 9)
        c.setFillColor(HexColor('#92400E'))
        for line in ask:
            c.drawString(MARGIN + 46, ty, safe('Always ask: ' + line if line is ask[0] else line))
            ty -= 12

        y = y - box_h - 11

    draw_para(
        c,
        'Your own company_financials.csv has the point-in-time trap planted: MoneyMart’s FY20-21 revenue was first '
        'reported as ₹3,511 cr and later restated to ₹3,366 cr.',
        MARGIN, y - 2, W - 2 * MARGIN, size=8.5, leading=10.5, colour=MUTED,
    )

    footer(c, 'Module 1 · The Four Biases That Ruin Financial Models')
    c.showPage()
    c.save()


# ---------------------------------------------------------------- entry


def main():
    check_only = '--check' in sys.argv

    if not check_only:
        os.makedirs(OUT_DIR, exist_ok=True)

    targets = [
        ('ai-charter.pdf', poster_charter),
        ('four-biases.pdf', poster_biases),
    ]

    # Parse first, so a content change that breaks a poster fails loudly here
    # rather than producing a half-empty PDF.
    green, red, steps, rule = read_charter()
    biases = read_biases()
    print('parsed from content/:')
    print('  charter : %d green, %d red, %d verify steps, rule %s'
          % (len(green), len(red), len(steps), 'found' if rule else 'MISSING'))
    print('  biases  : %d' % len(biases))
    for b in biases:
        print('     - %-22s ask: %s' % (b['name'], 'yes' if b['ask'] else 'MISSING'))

    problems = []
    if len(green) < 3 or len(red) < 3:
        problems.append('charter lists look truncated')
    if len(steps) < 3:
        problems.append('verify habit steps not found')
    if len(biases) != 4:
        problems.append('expected 4 biases, parsed %d' % len(biases))
    if any(not b['ask'] for b in biases):
        problems.append('a bias has no "Always ask" line')
    if problems:
        for p in problems:
            print('  ERROR %s' % p)
        return 1

    if check_only:
        print('\n--check: parsed cleanly, nothing written.')
        return 0

    for name, fn in targets:
        out = os.path.join(OUT_DIR, name)
        fn(out)
        print('\nwrote %-28s %6d bytes' % ('public/posters/' + name, os.path.getsize(out)))

    return 0


if __name__ == '__main__':
    sys.exit(main())
