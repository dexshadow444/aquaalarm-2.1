#!/usr/bin/env python3
"""Convert the project's markdown docs into PDF files.

Pipeline: markdown → styled standalone HTML (pure Python stdlib) →
print-to-PDF via headless Edge (or Chrome). No pip installs needed.

Usage:
    python scripts/md2pdf.py [docs/*.md ...]

Output: one .pdf next to each input .md file.
"""

import re
import shutil
import subprocess
import sys
import tempfile
from html import escape
from pathlib import Path

# ── Markdown → HTML ─────────────────────────────────────────────────────────

CSS = """
@page { size: A4; margin: 18mm 16mm; }
* { box-sizing: border-box; }
body {
  font-family: "Segoe UI", Calibri, Arial, sans-serif;
  font-size: 10.5pt; line-height: 1.5; color: #1e293b; margin: 0;
}
h1, h2, h3, h4 { font-family: "Segoe UI", Calibri, Arial, sans-serif; color: #0e7c86; }
h1 { font-size: 19pt; margin: 0 0 10pt; padding-bottom: 6pt; border-bottom: 2px solid #0e7c86; }
h2 { font-size: 14pt; margin: 18pt 0 6pt; }
h3 { font-size: 11.5pt; margin: 14pt 0 4pt; }
p { margin: 6pt 0; }
li { margin: 2pt 0; }
table { border-collapse: collapse; width: 100%; margin: 8pt 0; page-break-inside: avoid; }
th, td { border: 1px solid #94a3b8; padding: 4pt 7pt; text-align: left; font-size: 9.5pt; }
th { background: #e2f1f2; color: #11576e; }
code, pre {
  font-family: Consolas, "Cascadia Mono", monospace;
  background: #f1f5f9; border-radius: 3px;
}
code { padding: 0.5pt 3pt; font-size: 9pt; }
pre { padding: 8pt 10pt; overflow: hidden; page-break-inside: avoid; }
pre code { background: none; padding: 0; }
ul, ol { padding-left: 20pt; margin: 6pt 0; }
strong { color: #0f172a; }
"""


def inline(text: str) -> str:
    text = escape(text)
    text = re.sub(r"`([^`]+)`", r"<code>\1</code>", text)
    text = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", text)
    return text


def markdown_to_html(md: str) -> str:
    out: list[str] = []
    lines = md.splitlines()
    in_code = False
    code_buf: list[str] = []
    table_buf: list[str] = []
    i = 0

    def flush_code() -> None:
        out.append("<pre><code>" + escape("\n".join(code_buf)) + "</code></pre>")

    def flush_table() -> None:
        rows = []
        for line in table_buf:
            cells = [c.strip() for c in line.strip().strip("|").split("|")]
            if all(re.fullmatch(r":?-{2,}:?", c) for c in cells):
                continue
            rows.append(cells)
        if rows:
            html = ["<table>"]
            for r_i, row in enumerate(rows):
                tag = "th" if r_i == 0 else "td"
                html.append("<tr>" + "".join(f"<{tag}>{inline(c)}</{tag}>" for c in row) + "</tr>")
            html.append("</table>")
            out.append("".join(html))
        table_buf.clear()

    while i < len(lines):
        line = lines[i]
        s = line.strip()
        if s.startswith("```"):
            if in_code:
                flush_code()
                code_buf.clear()
                in_code = False
            else:
                in_code = True
            i += 1
            continue
        if in_code:
            code_buf.append(line)
            i += 1
            continue
        if table_buf and not s.startswith("|"):
            flush_table()
        if s.startswith("|"):
            table_buf.append(s)
            i += 1
            continue
        if not s:
            i += 1
            continue
        m = re.match(r"^(#{1,4})\s+(.*)$", s)
        if m:
            out.append(f"<h{len(m.group(1))}>{inline(m.group(2))}</h{len(m.group(1))}>")
            i += 1
            continue
        m = re.match(r"^[-*]\s+(.*)$", s)
        if m:
            out.append(f"<li>{inline(m.group(1))}</li>")
            i += 1
            continue
        m = re.match(r"^\d+\.\s+(.*)$", s)
        if m:
            out.append(f"<li>{inline(m.group(1))}</li>")
            i += 1
            continue
        out.append(f"<p>{inline(s)}</p>")
        i += 1

    if table_buf:
        flush_table()
    if in_code and code_buf:
        flush_code()

    # wrap consecutive <li> into <ul>/<ol>
    html = "".join(out)
    html = re.sub(r"(<li>.*?</li>)(?!\s*<li>)", r"<ul>\1</ul>", html, flags=re.S)
    html = re.sub(r"<ul>(<li>.*?)</ul>", r"<ul>\1</ul>", html, flags=re.S)

    return f"<!DOCTYPE html><html><head><meta charset=\"utf-8\"><style>{CSS}</style></head><body>{html}</body></html>"


# ── PDF via headless browser ────────────────────────────────────────────────

def browser_candidates() -> list[str]:
    cands = [
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    ]
    return [c for c in cands if Path(c).exists()]


def html_to_pdf(html: str, out_path: Path) -> None:
    browser = browser_candidates()[0]
    out_abs = str(out_path.resolve())  # Edge needs an absolute output path
    profile = tempfile.mkdtemp(prefix="aquaalarm-pdf-")
    with tempfile.NamedTemporaryFile(
        "w", suffix=".html", delete=False, encoding="utf-8"
    ) as f:
        f.write(html)
        tmp_html = f.name
    try:
        subprocess.run(
            [
                browser,
                "--headless",
                "--disable-gpu",
                "--no-pdf-header-footer",
                f"--user-data-dir={profile}",
                f"--print-to-pdf={out_abs}",
                Path(tmp_html).as_uri(),
            ],
            check=True,
            capture_output=True,
            timeout=60,
        )
        if not out_path.exists():
            raise RuntimeError(f"{out_path} was not produced by the browser")
    finally:
        Path(tmp_html).unlink(missing_ok=True)
        shutil.rmtree(profile, ignore_errors=True)


def main() -> None:
    files = sys.argv[1:] or ["docs/ABSTRACT.md", "docs/WORKING.md"]
    for f in files:
        src = Path(f)
        if not src.exists():
            print(f"skip (missing): {src}")
            continue
        out = src.with_suffix(".pdf")
        html_to_pdf(markdown_to_html(src.read_text(encoding="utf-8")), out)
        print(f"wrote {out} ({out.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
