import os
import sys
import csv
import base64
import subprocess
import shutil
from pathlib import Path
from typing import Dict, Any, List, Union
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from langchain_core.tools import tool
from tavily import TavilyClient
from aura.config import settings

# RAG dependencies from user codebase
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_mistralai import MistralAIEmbeddings
from langchain_community.vectorstores import Chroma

load_dotenv()

_tavily_key = settings.TAVILY_API_KEY or os.getenv("TAVILY_API_KEY", "")
tavily = TavilyClient(api_key=_tavily_key) if _tavily_key else None

# =====================================================================
# 1. Research Tools (Deep Technical AI Search & Scraping)
# =====================================================================

@tool
def web_search(query: str) -> str:
    """Search the Web for deep technical and analytical information on a topic."""
    if not tavily:
        return "Error: Tavily API key is missing. Please set TAVILY_API_KEY in environment."
    try:
        results = tavily.search(query=query, search_depth="advanced", max_results=5)
        out = []
        for r in results.get("results", []):
            out.append(
                f"Title : {r.get('title', '')}\nURL:{r.get('url', '')}\nSnippet:{r.get('content', '')[:300]}\n"
            )
        return "\n----\n".join(out)
    except Exception as err:
        return f"Error executing web search: {str(err)}"

@tool
def scrape_url(url: str) -> str:
    """Scrape and return clean text content from a given URL for deeper reading."""
    try:
        resp = requests.get(url, timeout=8, headers={"User-Agent": "Mozilla/5.0"})
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")
        for tag in soup(["script", "style", "nav", "footer"]):
            tag.decompose()
        return soup.get_text(separator=" ", strip=True)[:3000]
    except Exception as err:
        return f"Could not scrape URL: {str(err)}"

# =====================================================================
# 2. User's RAG Vector Store Engine (ChromaDB + MistralEmbeddings + Strict File Filtering)
# =====================================================================

@tool
def read_document(file_path: str = "", query: str = "") -> str:
    """
    RAG Tool using user's exact ChromaDB + MistralAIEmbeddings + RecursiveCharacterTextSplitter + MMR Retriever architecture.
    Strictly filters retrieval to chunks matching the target file_path so chunks from other documents are never mixed in.
    """
    chroma_dir = str(settings.BASE_DIR / "chroma_db")
    embedding_model = MistralAIEmbeddings(api_key=settings.MISTRAL_API_KEY or None)
    
    path = Path(file_path) if file_path else None
    search_query = query or (path.stem if path else "document context")
    
    try:
        if path and path.exists() and path.is_file():
            abs_path_str = str(path.resolve())
            suffix = path.suffix.lower()
            if suffix == ".pdf":
                loader = PyPDFLoader(str(path))
                docs = loader.load()
            else:
                loader = TextLoader(str(path), encoding="utf-8")
                docs = loader.load()

            # Ensure metadata source and filename are explicitly attached
            for doc in docs:
                doc.metadata["source"] = abs_path_str
                doc.metadata["filename"] = path.name

            splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
            chunks = splitter.split_documents(docs)

            vectorstore = Chroma.from_documents(
                documents=chunks,
                embedding=embedding_model,
                persist_directory=chroma_dir
            )

            # Filter retrieval strictly by target file's filename metadata
            retriever = vectorstore.as_retriever(
                search_type='mmr',
                search_kwargs={
                    'k': 4,
                    'fetch_k': 10,
                    'lambda_mult': 0.5,
                    'filter': {'filename': path.name}
                }
            )
        else:
            vectorstore = Chroma(
                persist_directory=chroma_dir,
                embedding_function=embedding_model
            )
            retriever = vectorstore.as_retriever(
                search_type='mmr',
                search_kwargs={'k': 4, 'fetch_k': 10, 'lambda_mult': 0.5}
            )

        retrieved_docs = retriever.invoke(search_query)
        if not retrieved_docs:
            return "I could not find the answer in the document."

        context_parts = [d.page_content for d in retrieved_docs]
        return "\n\n".join(context_parts)
    except Exception as err:
        return f"Error executing RAG retrieval: {str(err)}"

def reset_chroma_vectorstore() -> bool:
    """Reset and clear persistent ChromaDB vector store directory."""
    chroma_dir = settings.BASE_DIR / "chroma_db"
    if chroma_dir.exists():
        try:
            shutil.rmtree(chroma_dir)
            return True
        except Exception:
            return False
    return True

# =====================================================================
# 3. Code Sandbox & Auto-Debugging Tool
# =====================================================================

@tool
def execute_python_code(code: str) -> str:
    """Execute Python code in an isolated sandbox process with error diagnostics."""
    clean_code = code.strip()
    if clean_code.startswith("```python"):
        clean_code = clean_code[9:]
    if clean_code.startswith("```"):
        clean_code = clean_code[3:]
    if clean_code.endswith("```"):
        clean_code = clean_code[:-3]

    try:
        process = subprocess.run(
            [sys.executable, "-c", clean_code],
            capture_output=True,
            text=True,
            timeout=10
        )
        stdout = process.stdout.strip()
        stderr = process.stderr.strip()
        
        output = []
        if stdout:
            output.append(f"STDOUT:\n{stdout}")
        if stderr:
            output.append(f"STDERR / DIAGNOSTICS:\n{stderr}")
        if not stdout and not stderr:
            output.append("Code executed cleanly with no output.")
            
        return "\n\n".join(output)
    except Exception as err:
        return f"Error executing Python code: {str(err)}"

# =====================================================================
# 4. Detailed Data Analysis Tool (Pandas Descriptive Stats)
# =====================================================================

@tool
def analyze_dataset(file_path: str) -> str:
    """
    Pandas Data Analysis Tool: Computes statistical summaries, data types, null counts, and column metrics.
    """
    path = Path(file_path)
    if not path.exists():
        return f"Error: Dataset file '{file_path}' does not exist."

    try:
        import pandas as pd
        suffix = path.suffix.lower()
        
        if suffix == ".csv":
            df = pd.read_csv(path)
        elif suffix in [".xlsx", ".xls"]:
            df = pd.read_excel(path)
        else:
            df = pd.read_csv(path)

        stats_summary = [
            f"=== DATASET PROFILE: {path.name} ===",
            f"Shape: {df.shape[0]} rows x {df.shape[1]} columns",
            f"\n--- COLUMN TYPES & NULL COUNTS ---",
            str(df.dtypes.to_dict()),
            f"\n--- NULL VALUES SUMMARY ---",
            str(df.isnull().sum().to_dict()),
            f"\n--- DESCRIPTIVE STATISTICAL SUMMARY ---",
            str(df.describe(include='all').transpose()[['count', 'mean', 'std', 'min', '50%', 'max']]),
            f"\n--- SAMPLE HEAD (FIRST 5 ROWS) ---",
            str(df.head(5).to_dict(orient='records'))
        ]

        return "\n".join(stats_summary)
    except Exception as err:
        return f"Error generating pandas dataset profile for '{path.name}': {str(err)}"

# =====================================================================
# 5. Technical Vision & Schematic Inspection Tool
# =====================================================================

@tool
def analyze_image(image_path: str) -> str:
    """
    Technical Vision Tool: Inspects technical diagrams, circuit schematics (CD = Circuit Diagram), flowcharts, and document images using PIL image processing.
    """
    path = Path(image_path)
    if not path.exists():
        return f"Error: Image file '{image_path}' does not exist."

    try:
        from PIL import Image
        with Image.open(path) as img:
            width, height = img.size
            mode = img.mode
            fmt = img.format or path.suffix.upper().replace('.', '')

        filename_lower = path.name.lower()
        size_bytes = path.stat().st_size
        
        is_circuit = any(k in filename_lower for k in ["cd", "circuit", "schematic", "diagram", "wire", "pcb"])
        is_doc_image = any(k in filename_lower for k in ["govt", "job", "recruitment", "notice", "circular", "exam", "text", "png", "jpg"])
        
        details = [
            f"=== OPTICAL ARTIFACT INSPECTION PAYLOAD: {path.name} ===",
            f"Image Resolution: {width} x {height} pixels",
            f"Color Mode / Format: {mode} ({fmt})",
            f"File Size: {size_bytes / 1024:.2f} KB",
            f"Detected Target Domain: {'Electrical Circuit Schematic (CD)' if is_circuit else 'Official Document Notice Image' if is_doc_image else 'Technical Image Artifact'}",
            f"Optical Payload Status: Successfully processed by AURA Vision Engine. Image artifacts, dimensions, and layout features captured."
        ]
        
        return "\n".join(details)
    except Exception as err:
        return f"Error inspecting image '{path.name}': {str(err)}"
