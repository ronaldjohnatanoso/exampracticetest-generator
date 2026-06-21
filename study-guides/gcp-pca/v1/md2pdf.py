#!/usr/bin/env python3
"""Convert AZ-305 Cram Guide markdown to PDF using ReportLab."""

import os, re
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib.colors import HexColor, white, black
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY

# Colors
DARK_BLUE = HexColor('#1a3a5c')
MID_BLUE = HexColor('#2d6dad')
LIGHT_BLUE = HexColor('#d4e4f7')
ALERT_RED = HexColor('#c62828')
LIGHT_GREY = HexColor('#f5f5f5')
MID_GREY = HexColor('#cccccc')
DARK_GREY = HexColor('#333333')
TABLE_HEADER = HexColor('#1a3a5c')

PAGE_W, PAGE_H = A4
MARGIN = 1.8 * cm


def parse_inline(text):
    text = re.sub(r'\*\*\*(.+?)\*\*\*', r'<b><i>\1</i></b>', text)
    text = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', text)
    text = re.sub(r'\*(.+?)\*', r'<i>\1</i>', text)
    text = re.sub(r'`(.+?)`', r'<font face="Courier" size="8">\1</font>', text)
    text = re.sub(r'\[(.+?)\]\(.+?\)', r'\1', text)
    return text


def make_banner(text, bg_color, fg_color=white, font_size=12, bold=True):
    fn = 'Helvetica-Bold' if bold else 'Helvetica'
    style = ParagraphStyle(
        'Banner', fontSize=font_size, leading=font_size + 4,
        textColor=fg_color, backColor=bg_color, alignment=TA_LEFT,
        spaceBefore=6, spaceAfter=4, fontName=fn, leftIndent=6, rightIndent=6,
    )
    return Paragraph(text, style)


def md_to_pdf(md_path, pdf_path):
    doc = SimpleDocTemplate(
        pdf_path, pagesize=A4,
        leftMargin=MARGIN, rightMargin=MARGIN,
        topMargin=1.5 * cm, bottomMargin=1.5 * cm,
        title="AZ-305 Azure Solutions Architect — Cram Guide",
        author="Examify",
    )

    story = []
    body    = ParagraphStyle('body', fontSize=9, leading=12, textColor=DARK_GREY,
                             alignment=TA_JUSTIFY, spaceBefore=2, spaceAfter=2, fontName='Helvetica')
    bullet  = ParagraphStyle('bullet', fontSize=9, leading=12, textColor=DARK_GREY,
                             leftIndent=10, spaceBefore=1, spaceAfter=1, fontName='Helvetica')
    h3      = ParagraphStyle('h3', fontSize=11, leading=13, textColor=DARK_BLUE,
                             fontName='Helvetica-Bold', spaceBefore=6, spaceAfter=3)
    h4      = ParagraphStyle('h4', fontSize=10, leading=12, textColor=MID_BLUE,
                             fontName='Helvetica-Bold', spaceBefore=4, spaceAfter=2)
    tbl_hdr = ParagraphStyle('tblhdr', fontSize=8, leading=10, textColor=white,
                             fontName='Helvetica-Bold', alignment=TA_CENTER)
    tbl_cell= ParagraphStyle('tblcell', fontSize=7.5, leading=10, textColor=DARK_GREY,
                             fontName='Helvetica', alignment=TA_LEFT)
    alert   = ParagraphStyle('alert', fontSize=9, leading=12, textColor=ALERT_RED,
                             backColor=HexColor('#fff3e0'), fontName='Helvetica-Bold',
                             leftIndent=6, spaceBefore=3, spaceAfter=3)
    code    = ParagraphStyle('code', fontSize=7.5, leading=10, textColor=HexColor('#2d2d2d'),
                             fontName='Courier', leftIndent=8, spaceBefore=3, spaceAfter=3)

    usable_w = PAGE_W - 2 * MARGIN

    def add_h1(text):
        story.append(make_banner(text, DARK_BLUE, white, 13))
        story.append(Spacer(1, 4))

    def add_h2(text):
        story.append(make_banner(text, LIGHT_BLUE, DARK_BLUE, 11))
        story.append(Spacer(1, 4))

    with open(md_path, 'r') as f:
        lines = f.readlines()

    i = 0
    table_rows, table_cols, in_table = [], 0, False

    def flush_table():
        nonlocal table_rows, table_cols, in_table
        if not in_table or len(table_rows) <= 1:
            table_rows, table_cols, in_table = [], 0, False
            return
        col_w = usable_w / table_cols
        data = []
        for r, row in enumerate(table_rows):
            data_row = []
            for cell in row:
                ct = parse_inline(cell)
                ps = tbl_hdr if r == 0 else tbl_cell
                data_row.append(Paragraph(ct, ps))
            data.append(data_row)
        t = Table(data, colWidths=[col_w] * table_cols, repeatRows=1)
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER),
            ('TEXTCOLOR', (0, 0), (-1, 0), white),
            ('GRID', (0, 0), (-1, -1), 0.3, MID_GREY),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, LIGHT_GREY]),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('LEFTPADDING', (0, 0), (-1, -1), 5),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        story.append(t)
        story.append(Spacer(1, 6))
        table_rows, table_cols, in_table = [], 0, False

    while i < len(lines):
        line = lines[i]

        if line.startswith('# Exam Practice Test'):
            i += 1; continue

        if re.match(r'^---+$', line.strip()):
            story.append(HRFlowable(width='100%', thickness=0.5, color=MID_GREY, spaceAfter=4, spaceBefore=4))
            i += 1; continue

        if line.startswith('# AZ-305'):
            add_h1(line.lstrip('#').strip()); i += 1; continue

        if line.startswith('## Version') or line.startswith('## *'):
            i += 1; continue

        if re.match(r'^## [🔐💾🏗️🔄🌐💰🏛️⚡📝]', line):
            add_h1(line.lstrip('# ').strip()); i += 1; continue

        if re.match(r'^### [^#]', line) and not line.startswith('#### '):
            add_h2(line.lstrip('# ').strip()); i += 1; continue

        if line.startswith('#### '):
            story.append(Paragraph(f'<b>{line.lstrip("# ")}</b>', h3)); i += 1; continue

        if line.startswith('##### '):
            story.append(Paragraph(f'<b>{line.lstrip("# ")}</b>', h4)); i += 1; continue

        if '⚠️' in line or '💡' in line:
            text = re.sub(r'[⚠️💡]\s*', '', line.strip()).lstrip('>').strip()
            story.append(Paragraph(f'<b>{text}</b>', alert)); i += 1; continue

        if line.startswith('```'):
            code_lines = []
            i += 1
            while i < len(lines) and not lines[i].startswith('```'):
                code_lines.append(lines[i].rstrip())
                i += 1
            code_para = Paragraph(f'<font face="Courier" size="7">{"<br/>".join(code_lines)}</font>', code)
            t = Table([[code_para]], colWidths=[usable_w])
            t.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), LIGHT_GREY),
                ('TOPPADDING', (0, 0), (-1, -1), 5),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
                ('LEFTPADDING', (0, 0), (-1, -1), 8),
                ('RIGHTPADDING', (0, 0), (-1, -1), 8),
                ('BOX', (0, 0), (-1, -1), 0.5, MID_GREY),
            ]))
            story.append(t)
            story.append(Spacer(1, 4))
            i += 1; continue

        if line.startswith('|'):
            if line.strip().startswith('|---'): i += 1; continue
            cols = [c.strip() for c in line.strip().strip('|').split('|')]
            if not in_table:
                in_table, table_cols = True, len(cols)
            table_rows.append(cols)
            i += 1; continue
        else:
            flush_table()

        if line.strip().startswith('•') or re.match(r'^[-*]\s', line.strip()):
            text = parse_inline(re.sub(r'^[•\-*]\s*', '', line.strip()))
            story.append(Paragraph(f'<bullet>&bull;</bullet> {text}', bullet))
            i += 1; continue

        if re.match(r'^\d+\.\s', line.strip()):
            text = parse_inline(re.sub(r'^\d+\.\s*', '', line.strip()))
            story.append(Paragraph(f'&#8198;&#8198;{text}', bullet))
            i += 1; continue

        if line.strip() == '':
            i += 1; continue

        text = parse_inline(line.strip())
        if text:
            story.append(Paragraph(text, body))
        i += 1

    flush_table()

    def add_page_number(canvas, doc):
        canvas.saveState()
        canvas.setFont('Helvetica', 8)
        canvas.setFillColor(HexColor('#888888'))
        page_num = canvas.getPageNumber()
        canvas.drawCentredString(PAGE_W / 2, 0.8 * cm, f"AZ-305 Cram Guide — Page {page_num}")
        canvas.restoreState()

    doc.build(story, onFirstPage=add_page_number, onLaterPages=add_page_number)
    print(f"PDF created: {pdf_path}")


if __name__ == '__main__':
    import sys
    base = os.path.dirname(os.path.abspath(__file__))
    md_path = os.path.join(base, "GCP-PCA-Cram-Guide-v1.md")
    pdf_path = os.path.join(base, "GCP-PCA-Cram-Guide-v1.pdf")
    if not os.path.exists(md_path):
        print(f"ERROR: {md_path} not found")
        sys.exit(1)
    md_to_pdf(md_path, pdf_path)
