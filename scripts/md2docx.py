#!/usr/bin/env python3
"""Convert the project's markdown docs into real .docx files using only the
Python standard library (no pip installs, no pandoc).

Usage:
    python scripts/md2docx.py [docs/*.md ...]

Output: one .docx next to each input .md file.
"""

import re
import sys
import zipfile
from pathlib import Path
from xml.sax.saxutils import escape

# ── WordprocessingML helpers ────────────────────────────────────────────────

NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"'


def run(text: str, bold: bool = False, code: bool = False) -> str:
    rpr = ""
    if bold:
        rpr += "<w:b/>"
    if code:
        rpr += '<w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/>'
    rpr_xml = f"<w:rPr>{rpr}</w:rPr>" if rpr else ""
    return f"<w:r>{rpr_xml}<w:t xml:space=\"preserve\">{escape(text)}</w:t></w:r>"


def runs_for_inline(text: str) -> str:
    """Split a markdown inline string into styled runs (**bold**, `code`)."""
    out: list[str] = []
    # bold first: split on ** pairs
    parts = re.split(r"\*\*(.+?)\*\*", text)
    for i, part in enumerate(parts):
        bold = i % 2 == 1
        # then inline code within the segment
        segs = re.split(r"`([^`]+)`", part)
        for j, seg in enumerate(segs):
            if seg == "":
                continue
            out.append(run(seg, bold=bold, code=(j % 2 == 1)))
    return "".join(out)


def para(text: str, style: str | None = None, shade: str | None = None) -> str:
    ppr = ""
    if style:
        ppr += f'<w:pStyle w:val="{style}"/>'
    if shade:
        ppr += f'<w:shd w:val="clear" w:color="auto" w:fill="{shade}"/>'
    ppr_xml = f"<w:pPr>{ppr}</w:pPr>" if ppr else ""
    return f"<w:p>{ppr_xml}{runs_for_inline(text)}</w:p>"


def heading(text: str, level: int) -> str:
    return para(text, style=f"Heading{min(level, 3)}")


def code_block(lines: list[str]) -> str:
    body = "".join(
        f"<w:p><w:pPr><w:shd w:val=\"clear\" w:color=\"auto\" w:fill=\"F2F2F2\"/>"
        f'<w:spacing w:after="0"/></w:pPr>'
        f'<w:r><w:rPr><w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/></w:rPr>'
        f'<w:t xml:space="preserve">{escape(line) or " "}</w:t></w:r></w:p>'
        for line in lines
    )
    return body


def table(rows: list[list[str]]) -> str:
    cells: list[str] = []
    for r_i, row in enumerate(rows):
        tr = ['<w:tr>']
        for cell in row:
            bold = r_i == 0  # header row
            tr.append(
                '<w:tc><w:tcPr>'
                '<w:tcW w:w="2600" w:type="dxa"/>'
                '</w:tcPr>'
                + f"<w:p><w:pPr>{'<w:pStyle w:val=\"Heading4\"/>' if bold else ''}</w:pPr>"
                + runs_for_inline(cell)
                + "</w:p></w:tc>"
            )
        tr.append("</w:tr>")
        cells.append("".join(tr))
    return (
        "<w:tbl><w:tblPr>"
        '<w:tblW w:w="10400" w:type="dxa"/>'
        '<w:tblBorders>'
        '<w:top w:val="single" w:sz="4" w:color="999999"/>'
        '<w:left w:val="single" w:sz="4" w:color="999999"/>'
        '<w:bottom w:val="single" w:sz="4" w:color="999999"/>'
        '<w:right w:val="single" w:sz="4" w:color="999999"/>'
        '<w:insideH w:val="single" w:sz="4" w:color="999999"/>'
        '<w:insideV w:val="single" w:sz="4" w:color="999999"/>'
        "</w:tblBorders>"
        "</w:tblPr>"
        + "".join(cells)
        + "</w:tbl>"
        + '<w:p><w:pPr><w:spacing w:after="120"/></w:pPr></w:p>'
    )


# ── Markdown → body XML ─────────────────────────────────────────────────────

def markdown_to_body(md: str) -> str:
    body: list[str] = []
    i = 0
    lines = md.splitlines()
    n = len(lines)

    def flush_code(lines_: list[str]) -> None:
        body.append(code_block(lines_))
        body.append(para("", shade=None) if False else "")

    in_code = False
    code_buf: list[str] = []
    table_buf: list[str] = []

    def flush_table(buf: list[str]) -> None:
        rows: list[list[str]] = []
        for line in buf:
            cells = [c.strip() for c in line.strip().strip("|").split("|")]
            if all(re.fullmatch(r":?-{2,}:?", c) for c in cells):
                continue  # separator row
            rows.append(cells)
        if rows:
            body.append(table(rows))
        buf.clear()

    while i < n:
        line = lines[i]
        stripped = line.strip()

        if stripped.startswith("```"):
            if in_code:
                body.append(code_block(code_buf))
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

        if table_buf and not stripped.startswith("|"):
            flush_table(table_buf)

        if stripped.startswith("|"):
            table_buf.append(stripped)
            i += 1
            continue

        if stripped == "":
            i += 1
            continue

        m = re.match(r"^(#{1,4})\s+(.*)$", stripped)
        if m:
            body.append(heading(m.group(2), len(m.group(1))))
            i += 1
            continue

        m = re.match(r"^[-*]\s+(.*)$", stripped)
        if m:
            body.append(para("•  " + m.group(1), style="ListParagraph"))
            i += 1
            continue

        m = re.match(r"^\d+\.\s+(.*)$", stripped)
        if m:
            body.append(para(m.group(1), style="ListParagraph"))
            i += 1
            continue

        body.append(para(stripped))
        i += 1

    if table_buf:
        flush_table(table_buf)
    if in_code and code_buf:
        body.append(code_block(code_buf))

    return "".join(body)


# ── Package assembly ────────────────────────────────────────────────────────

CONTENT_TYPES = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>"""

RELS = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="word/styles.xml"/>
</Relationships>"""

DOC_RELS = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>"""

STYLES = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:rPr><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Title">
    <w:name w:val="Title"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr><w:spacing w:before="240" w:after="240"/></w:pPr>
    <w:rPr><w:b/><w:sz w:val="44"/><w:szCs w:val="44"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr><w:keepNext/><w:spacing w:before="320" w:after="120"/></w:pPr>
    <w:rPr><w:b/><w:sz w:val="32"/><w:szCs w:val="32"/><w:color w:val="0E7C86"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr><w:keepNext/><w:spacing w:before="240" w:after="100"/></w:pPr>
    <w:rPr><w:b/><w:sz w:val="26"/><w:szCs w:val="26"/><w:color w:val="11576E"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading3">
    <w:name w:val="heading 3"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr><w:keepNext/><w:spacing w:before="200" w:after="80"/></w:pPr>
    <w:rPr><w:b/><w:sz w:val="23"/><w:szCs w:val="23"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading4">
    <w:name w:val="heading 4"/>
    <w:basedOn w:val="Normal"/>
    <w:rPr><w:b/><w:sz w:val="21"/><w:szCs w:val="21"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="ListParagraph">
    <w:name w:val="List Paragraph"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr><w:ind w:left="360"/></w:pPr>
  </w:style>
</w:styles>"""


def make_docx(md_text: str, out_path: Path) -> None:
    body = markdown_to_body(md_text)
    document = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
        f'<w:document {NS}><w:body>'
        + body
        + '<w:sectPr><w:pgSz w:w="12240" w:h="15840"/>'
        '<w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134"/></w:sectPr>'
        + "</w:body></w:document>"
    )
    with zipfile.ZipFile(out_path, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("[Content_Types].xml", CONTENT_TYPES)
        z.writestr("_rels/.rels", RELS)
        z.writestr("word/document.xml", document)
        z.writestr("word/_rels/document.xml.rels", DOC_RELS)
        z.writestr("word/styles.xml", STYLES)


def main() -> None:
    files = sys.argv[1:] or ["docs/ABSTRACT.md", "docs/WORKING.md"]
    for f in files:
        src = Path(f)
        if not src.exists():
            print(f"skip (missing): {src}")
            continue
        out = src.with_suffix(".docx")
        make_docx(src.read_text(encoding="utf-8"), out)
        print(f"wrote {out} ({out.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
