import os
import re
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

class SummaryCanvas(canvas.Canvas):
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
        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#3730a3"))
        # Running Header
        self.drawString(54, 750, "AURA — Quick Reference & Executive Interview Summary")
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(54, 742, 558, 742)

        # Running Footer
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#475569"))
        self.drawString(54, 36, "AURA Quick Summary Manual — Mayur Gawas")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 36, page_str)
        self.line(54, 48, 558, 48)
        self.restoreState()

def build_summary_pdf(pdf_path):
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    COLOR_PRIMARY = colors.HexColor("#1e1b4b")   # Deep Indigo
    COLOR_SECONDARY = colors.HexColor("#3730a3") # Medium Indigo
    COLOR_TEXT = colors.HexColor("#0f172a")      # Slate 900
    COLOR_BORDER = colors.HexColor("#cbd5e1")    # Slate 300
    COLOR_BG = colors.HexColor("#f8fafc")        # Slate 50

    style_title = ParagraphStyle(
        'SumTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=COLOR_PRIMARY,
        spaceAfter=3
    )

    style_subtitle = ParagraphStyle(
        'SumSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=12,
        textColor=colors.HexColor("#4f46e5"),
        spaceAfter=8
    )

    style_h1 = ParagraphStyle(
        'SumH1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=15,
        textColor=COLOR_PRIMARY,
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    )

    style_h2 = ParagraphStyle(
        'SumH2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=12,
        textColor=COLOR_SECONDARY,
        spaceBefore=6,
        spaceAfter=2,
        keepWithNext=True
    )

    style_body = ParagraphStyle(
        'SumBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=COLOR_TEXT,
        spaceAfter=4
    )

    style_bullet = ParagraphStyle(
        'SumBullet',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=COLOR_TEXT,
        leftIndent=10,
        spaceAfter=3
    )

    style_qa_q = ParagraphStyle(
        'SumQA_Q',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11.5,
        textColor=COLOR_PRIMARY,
        spaceBefore=5,
        spaceAfter=1,
        keepWithNext=True
    )

    style_qa_a = ParagraphStyle(
        'SumQA_A',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=COLOR_TEXT,
        leftIndent=8,
        spaceAfter=3
    )

    story = []

    # Title Banner
    story.append(Paragraph("AURA: Project Overview & Interview Cheat Sheet", style_title))
    story.append(Paragraph("Autonomous Unified Research Assistant — High-Level Technical Summary", style_subtitle))
    story.append(HRFlowable(width="100%", thickness=1.2, color=COLOR_PRIMARY, spaceBefore=2, spaceAfter=6))

    # 1. Project Overview & Purpose
    story.append(Paragraph("1. Project Overview & Purpose", style_h1))
    story.append(Paragraph(
        "<b>AURA (Autonomous Unified Research Assistant)</b> is a full-stack, production-grade multi-agent AI system built to execute domain-specific autonomous reasoning across web research, document QA, code generation, dataset profiling, and visual OCR inspection.",
        style_body
    ))
    story.append(Paragraph("<b>Core Problems Solved:</b>", style_body))
    story.append(Paragraph("• <b>Context Contamination</b>: Replaces monolithic prompts with specialized domain agents operating under targeted system instructions.", style_bullet))
    story.append(Paragraph("• <b>Vector Leakage</b>: Enforces metadata-scoped vector retrieval in ChromaDB, preventing cross-document contamination.", style_bullet))
    story.append(Paragraph("• <b>Knowledge Cutoffs</b>: Fuses live Tavily web research with vector retrieval for real-time comparative synthesis.", style_bullet))
    story.append(Paragraph("• <b>Interactive Data Profiling</b>: Automated Pandas tabular profiling paired with dynamic React visual bar charts.", style_bullet))
    story.append(Spacer(1, 3))

    # 2. Elevator Pitches
    story.append(Paragraph("2. Quick Interview Elevator Pitches", style_h1))
    story.append(Paragraph("<b>30-Second Summary:</b>", style_h2))
    story.append(Paragraph(
        "<i>\"AURA is a multi-agent AI platform built with Python, FastAPI, LangChain, Mistral AI, ChromaDB, and React. Instead of relying on a single prompt, an Auto-Router dynamically classifies user queries and delegates execution across 6 specialized agents—including Web Research, Document RAG, Code Engineering, Pandas Profiling, and Vision OCR. It features strict vector metadata scoping and cross-session memory.\"</i>",
        style_body
    ))
    story.append(Paragraph("<b>1-Minute Summary:</b>", style_h2))
    story.append(Paragraph(
        "<i>\"Most AI wrappers suffer from context bloat and vector leakage. I built AURA to solve this using a hub-and-spoke multi-agent architecture. The FastAPI backend receives requests, and an Intent Classifier routes queries to specialized LCEL pipelines. For document QA, AURA indexes PDFs into ChromaDB using Mistral embeddings and retrieves context via MMR search with metadata filters. For tabular datasets, it runs Pandas profiling and outputs structured JSON rendered into interactive visual bar charts by React. The system is deployed on Render and Vercel Edge CDN.\"</i>",
        style_body
    ))
    story.append(Spacer(1, 3))

    # 3. Tech Stack & Selection Rationale
    story.append(Paragraph("3. Tech Stack & Selection Rationale", style_h1))
    
    tech_data = [
        ["Technology", "Role", "Why Chosen (Selection Rationale)"],
        ["Python 3.10+", "Backend Language", "Rich AI ecosystem, native LangChain support, async loop support."],
        ["FastAPI", "API Gateway", "ASGI non-blocking execution, high concurrency, Pydantic validation."],
        ["LangChain (LCEL)", "Pipeline Orchestration", "Declarative pipeline composition via pipe operator (|), async support."],
        ["Mistral AI", "Core LLM & Embeddings", "Superior instruction-following, competitive reasoning, 1024-dim dense embeddings."],
        ["Pixtral 12B", "Vision-Language Model", "Visual OCR and optical inspection over schematics and diagrams."],
        ["ChromaDB", "Vector Database", "Embedded disk persistence (HNSW index), zero external server cluster dependency."],
        ["Tavily Search API", "Real-Time Search", "Purpose-built for LLMs, returns clean extracted markdown text."],
        ["BeautifulSoup4", "Web Scraper", "Lightweight HTML text parsing for deep comparative research."],
        ["React 18 + Vite", "Frontend Framework", "Fast Virtual DOM, fast HMR build tooling, responsive component state."],
        ["TailwindCSS", "UI Styling Engine", "Utility-first modern dark design system and responsive grid breakpoints."]
    ]

    t_data = []
    for r_idx, row in enumerate(tech_data):
        r_cols = []
        for cell in row:
            st = ParagraphStyle('TH', parent=style_body, fontName='Helvetica-Bold', textColor=colors.white, fontSize=7.5, leading=9.5) if r_idx == 0 else ParagraphStyle('TD', parent=style_body, fontSize=7.5, leading=9.5)
            r_cols.append(Paragraph(cell, st))
        t_data.append(r_cols)

    t_tech = Table(t_data, colWidths=[90, 110, 304])
    t_tech.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), COLOR_PRIMARY),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('LEFTPADDING', (0,0), (-1,-1), 3),
        ('RIGHTPADDING', (0,0), (-1,-1), 3),
        ('GRID', (0,0), (-1,-1), 0.5, COLOR_BORDER),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, COLOR_BG]),
    ]))
    story.append(t_tech)
    story.append(Spacer(1, 4))

    # 4. End-to-End Workflow Flowchart
    story.append(Paragraph("4. End-to-End Project Workflow", style_h1))
    story.append(Paragraph("<b>Step 1: User Request</b> ➔ User submits query/file via React 18 UI.", style_bullet))
    story.append(Paragraph("<b>Step 2: API Ingestion</b> ➔ FastAPI validates request payloads via Pydantic (`/api/chat`).", style_bullet))
    story.append(Paragraph("<b>Step 3: Intent Routing</b> ➔ Auto-Router classifies intent (`rag`, `research`, `code`, `data`, `vision`, `chat`).", style_bullet))
    story.append(Paragraph("<b>Step 4: Pipeline Execution</b> ➔ Invokes target LCEL chain binding prompts, external tools, or ChromaDB.", style_bullet))
    story.append(Paragraph("<b>Step 5: Memory Sync</b> ➔ Appends interaction history and user facts into `storage/db.json`.", style_bullet))
    story.append(Paragraph("<b>Step 6: UI Rendering</b> ➔ Returns JSON response; React renders markdown text and interactive bar charts.", style_bullet))
    story.append(Spacer(1, 3))

    # 5. Summary of 6 Specialized Agents
    story.append(Paragraph("5. Summary of 6 Specialized Agents", style_h1))
    story.append(Paragraph("1. <b>Auto Router Agent (`auto`)</b>: Classifies query intent and manages stateful global user memory.", style_bullet))
    story.append(Paragraph("2. <b>Deep Research Agent (`research`)</b>: Multi-step Tavily search & BeautifulSoup scraper generating comparative reports.", style_bullet))
    story.append(Paragraph("3. <b>RAG Document QA Agent (`rag`)</b>: PDF/DOCX chunking, Mistral embeddings, and ChromaDB MMR search with metadata filters.", style_bullet))
    story.append(Paragraph("4. <b>Code Engineer Agent (`code`)</b>: Generates clean, fundamental code with $O(1)/O(N)$ complexity metrics.", style_bullet))
    story.append(Paragraph("5. <b>Data Analysis Agent (`data`)</b>: Profiles CSV datasets via Pandas and outputs visual JSON bar charts.", style_bullet))
    story.append(Paragraph("6. <b>Vision & OCR Agent (`vision`)</b>: Processes image pixels via `pixtral-12b-2409` for visual schematic inspection.", style_bullet))
    story.append(Spacer(1, 3))

    # 6. Top 15 Essential Interview Questions & Answers
    story.append(Paragraph("6. Top 15 Essential Interview Q&A", style_h1))

    qa_list = [
        ("Q1: What is the core problem AURA solves?",
         "AURA eliminates context clutter, tool hallucinations, and vector cross-leakage by routing requests across 6 domain-focused agents instead of a single monolithic prompt."),
        
        ("Q2: How does the Intent Router work?",
         "An intent classifier directive inspects user queries and maps them to target agent keys (`rag`, `research`, `code`, `data`, `vision`, `chat`) in ~200ms."),
        
        ("Q3: How do you prevent document cross-contamination in RAG?",
         "By applying strict metadata filtering (`filter={'source': file_path}`) during ChromaDB similarity searches so queries only retrieve chunks from the active document."),
        
        ("Q4: What is Maximal Marginal Relevance (MMR) search?",
         "MMR optimizes both query similarity and context diversity, preventing redundant chunks from filling the prompt window."),
        
        ("Q5: Why choose FastAPI over Flask or Django?",
         "FastAPI runs on ASGI (`asyncio`), handling non-blocking network I/O for concurrent LLM requests efficiently while providing Pydantic payload validation."),
        
        ("Q6: Why LCEL over legacy LangChain chains?",
         "LCEL uses a declarative pipe interface (`|`), providing type safety, built-in async support, and explicit component composition without hidden dictionary mechanics."),
        
        ("Q7: What chunking parameters do you use?",
         "1,000-character chunks with a 200-character overlap using `RecursiveCharacterTextSplitter` to preserve paragraph context across chunk boundaries."),
        
        ("Q8: How does the Data Agent render visual graphs?",
         "Pandas profiles dataset statistics, the LLM returns a structured JSON chart block, and the React frontend parses this block to render dynamic visual bar charts."),
        
        ("Q9: Why use ChromaDB?",
         "ChromaDB is a lightweight embedded vector store that persists to disk (`storage/chroma_db`) without requiring an external database cluster during development."),
        
        ("Q10: How does AURA handle user session state?",
         "A lightweight JSON database (`storage/db.json`) persists chat history and user facts across server restarts."),
        
        ("Q11: How do you prevent blocking calls in FastAPI?",
         "By running network requests and vector searches inside asynchronous event loops using Python's `asyncio` framework."),
        
        ("Q12: How does the Vision Agent process images?",
         "Image files are base64 encoded and dispatched to the `pixtral-12b-2409` multimodal model along with structured inspection directives."),
        
        ("Q13: How do you handle UI markdown rendering bugs?",
         "A frontend text sanitizer (`formatMarkdownContent`) uses regex to fix single-line markdown pipe table joins before rendering."),
        
        ("Q14: How would you scale AURA for 100,000 users?",
         "Containerize FastAPI backend pods on AWS ECS, replace embedded ChromaDB with Qdrant/Pinecone, and migrate `db.json` to Redis Cloud."),
        
        ("Q15: What is the benefit of setting temperature to 0.0?",
         "It ensures deterministic, reproducible LLM outputs for code generation, data profiling, and structured retrieval.")
    ]

    for q, a in qa_list:
        story.append(Paragraph(f"<b>{q}</b>", style_qa_q))
        story.append(Paragraph(a, style_qa_a))

    doc.build(story, canvasmaker=SummaryCanvas)
    print(f"Summary PDF successfully generated: {pdf_path}")

if __name__ == '__main__':
    pdf_out = r"c:\Users\mayur\OneDrive\Desktop\COMEBACK\AURA - Copy\AURA_Quick_Summary.pdf"
    build_summary_pdf(pdf_out)
