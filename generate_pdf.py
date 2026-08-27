import os
import re
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_header_footer(num_pages)
            super().showPage()
        super().save()

    def draw_header_footer(self, page_count):
        if self._pageNumber == 1:
            return  # Skip cover header/footer
        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#3730a3"))
        # Running Header
        self.drawString(54, 750, "AURA — Autonomous Unified Research Assistant | Technical & Interview Guide")
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(54, 742, 558, 742)

        # Running Footer
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#475569"))
        self.drawString(54, 36, "Authoritative Engineering Reference Manual — Mayur Gawas")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 36, page_str)
        self.line(54, 48, 558, 48)
        self.restoreState()

def clean_text(t):
    # Escape XML entities first
    t = t.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    # Convert MD formatting into ReportLab HTML tags
    t = re.sub(r'\*\*\*(.*?)\*\*\*', r'<b><i>\1</i></b>', t)
    t = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', t)
    t = re.sub(r'\*(.*?)\*', r'<i>\1</i>', t)
    t = re.sub(r'`(.*?)`', r'<font fontName="Courier" color="#3730a3">\1</font>', t)
    t = re.sub(r'\[(.*?)\]\((.*?)\)', r'<font color="#2563eb"><u>\1</u></font>', t)
    # Re-fix unescaped XML tags created by regex replacements
    t = t.replace('&lt;b&gt;', '<b>').replace('&lt;/b&gt;', '</b>')
    t = t.replace('&lt;i&gt;', '<i>').replace('&lt;/i&gt;', '</i>')
    t = t.replace('&lt;font', '<font').replace('&lt;/font&gt;', '</font>')
    t = t.replace('&lt;u&gt;', '<u>').replace('&lt;/u&gt;', '</u>')
    return t

def build_pdf(md_path, pdf_path):
    with open(md_path, 'r', encoding='utf-8') as f:
        content = f.read()

    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Custom Palette
    COLOR_PRIMARY = colors.HexColor("#1e1b4b")   # Deep Indigo
    COLOR_SECONDARY = colors.HexColor("#3730a3") # Medium Indigo
    COLOR_TEXT = colors.HexColor("#0f172a")      # Slate 900
    COLOR_BG_CODE = colors.HexColor("#f8fafc")   # Slate 50
    COLOR_BORDER = colors.HexColor("#cbd5e1")    # Slate 300

    # Custom Styles
    style_cover_title = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=COLOR_PRIMARY,
        spaceAfter=8,
        alignment=0
    )

    style_h1 = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=COLOR_PRIMARY,
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    )

    style_h2 = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=COLOR_SECONDARY,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    style_h3 = ParagraphStyle(
        'Heading3_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor("#1e293b"),
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    )

    style_body = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11.5,
        textColor=COLOR_TEXT,
        spaceAfter=5
    )

    style_bullet = ParagraphStyle(
        'Bullet_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11.5,
        textColor=COLOR_TEXT,
        leftIndent=10,
        spaceAfter=3
    )

    style_code = ParagraphStyle(
        'Code_Custom',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=7.5,
        leading=9.5,
        textColor=colors.HexColor("#0f172a"),
        spaceBefore=4,
        spaceAfter=6,
        backColor=COLOR_BG_CODE,
        borderColor=COLOR_BORDER,
        borderWidth=0.5,
        borderPadding=5,
        borderRadius=3
    )

    story = []

    lines = content.split('\n')
    in_code_block = False
    code_buffer = []
    in_table = False
    table_rows = []

    def flush_table():
        nonlocal table_rows, story
        if not table_rows:
            return
        
        formatted_data = []
        for r_idx, row in enumerate(table_rows):
            formatted_row = []
            for cell in row:
                cell_text = clean_text(cell.strip())
                st = ParagraphStyle('TCellHeader', parent=style_body, fontName='Helvetica-Bold', textColor=colors.white, fontSize=7.5, leading=9.5) if r_idx == 0 else ParagraphStyle('TCell', parent=style_body, fontSize=7.5, leading=9.5)
                formatted_row.append(Paragraph(cell_text, st))
            formatted_data.append(formatted_row)

        if formatted_data:
            num_cols = len(formatted_data[0]) if formatted_data[0] else 1
            col_widths = [504 / num_cols] * num_cols
            t = Table(formatted_data, colWidths=col_widths)
            t.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), COLOR_PRIMARY),
                ('ALIGN', (0,0), (-1,-1), 'LEFT'),
                ('VALIGN', (0,0), (-1,-1), 'TOP'),
                ('BOTTOMPADDING', (0,0), (-1,-1), 3),
                ('TOPPADDING', (0,0), (-1,-1), 3),
                ('LEFTPADDING', (0,0), (-1,-1), 3),
                ('RIGHTPADDING', (0,0), (-1,-1), 3),
                ('GRID', (0,0), (-1,-1), 0.5, COLOR_BORDER),
                ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#f8fafc")]),
            ]))
            story.append(t)
            story.append(Spacer(1, 6))
        table_rows = []

    for line in lines:
        stripped = line.strip()

        # Handle Code Block Toggle
        if stripped.startswith('```'):
            if in_code_block:
                in_code_block = False
                raw_code = '\n'.join(code_buffer)
                escaped_code = raw_code.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
                story.append(Paragraph(escaped_code.replace('\n', '<br/>'), style_code))
                code_buffer = []
            else:
                if in_table:
                    in_table = False
                    flush_table()
                in_code_block = True
            continue

        if in_code_block:
            code_buffer.append(line)
            continue

        # Handle Table Rows
        if stripped.startswith('|') and stripped.endswith('|'):
            if not in_table:
                in_table = True
                table_rows = []
            if re.match(r'^\|[\s:\-|\-]+\|$', stripped):
                continue
            cells = [c for c in stripped.split('|')[1:-1]]
            table_rows.append(cells)
            continue
        elif in_table:
            in_table = False
            flush_table()

        if not stripped:
            story.append(Spacer(1, 3))
            continue

        # Handle Headings
        if stripped.startswith('# '):
            story.append(Spacer(1, 8))
            story.append(Paragraph(clean_text(stripped[2:]), style_cover_title))
            story.append(HRFlowable(width="100%", thickness=1.5, color=COLOR_PRIMARY, spaceBefore=4, spaceAfter=8))
        elif stripped.startswith('## '):
            story.append(Spacer(1, 6))
            story.append(Paragraph(clean_text(stripped[3:]), style_h1))
            story.append(HRFlowable(width="100%", thickness=0.75, color=COLOR_SECONDARY, spaceBefore=2, spaceAfter=4))
        elif stripped.startswith('### '):
            story.append(Paragraph(clean_text(stripped[4:]), style_h2))
        elif stripped.startswith('#### '):
            story.append(Paragraph(clean_text(stripped[5:]), style_h3))
        elif stripped.startswith('---'):
            story.append(HRFlowable(width="100%", thickness=0.5, color=COLOR_BORDER, spaceBefore=4, spaceAfter=4))
        elif stripped.startswith('* ') or stripped.startswith('- '):
            b_text = '• ' + clean_text(stripped[2:])
            story.append(Paragraph(b_text, style_bullet))
        elif re.match(r'^\d+\.\s', stripped):
            story.append(Paragraph(clean_text(stripped), style_bullet))
        else:
            story.append(Paragraph(clean_text(stripped), style_body))

    if in_table:
        flush_table()

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF successfully generated: {pdf_path}")

if __name__ == '__main__':
    md_file = r"c:\Users\mayur\OneDrive\Desktop\COMEBACK\AURA - Copy\AURA_Project_Guide.md"
    pdf_file = r"c:\Users\mayur\OneDrive\Desktop\COMEBACK\AURA - Copy\AURA_Project_Guide.pdf"
    build_pdf(md_file, pdf_file)
