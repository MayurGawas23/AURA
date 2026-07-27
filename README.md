# ⚡ AURA — Autonomous Universal Reasoning Assistant

AURA (**Autonomous Universal Reasoning Assistant**) is a production-grade, multi-agent AI system engineered to execute complex autonomous reasoning tasks across web research, document RAG QA, code generation & execution, tabular data analysis, optical image inspection, and cross-session conversational memory.

---

## 🌟 Key Capabilities & Agent Architecture

AURA features an **Autonomous Intent Auto-Router** that dynamically classifies user prompts and routes execution to specialized reasoning agents:

1. **⚡ Auto Intent Router**: Intelligently classifies user queries in real-time and routes to the optimal agent while managing cross-session global memory.
2. **🧠 Deep Web Research Agent**: Multi-step pipeline powered by Tavily Search and BeautifulSoup web scrapers to synthesize structured, comparative technical reports.
3. **📚 RAG Document QA Agent**: Contextual QA over uploaded PDFs, DOCX, and text files powered by **ChromaDB Vector Store**, **Mistral AI Embeddings**, and **Maximal Marginal Relevance (MMR) Retrieval** with strict metadata filtering.
4. **💻 Code Engineering Agent**: Generates production-grade code with error diagnostics, unit tests, and $O(N)$ time/space complexity analysis.
5. **📊 Pandas Data Analysis Agent**: Profiling engine for CSV/Excel datasets that computes statistical metrics and outputs JSON visual chart payloads for interactive bar graph rendering.
6. **👁 Optical Inspection & Vision Agent**: Visual reasoning engine for inspecting circuit schematics (CD), technical diagrams, and document notices.
7. **💾 Cross-Session Global Memory Engine**: Automatically extracts user names, custom bot personas (e.g. *Jarvis*), and global facts, persisting them across all conversation turns and new chat sessions.

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend UI** | React 18, Vite, TailwindCSS, Lucide Icons, React Markdown |
| **Backend API** | Python 3.10+, FastAPI, Uvicorn, Pydantic |
| **AI Orchestration** | LangChain Core, LangGraph, Tavily API |
| **LLM & Embeddings** | Mistral AI API (`mistral-large-latest`), MistralAIEmbeddings |
| **Vector Store** | ChromaDB (Local Persistent Vector DB with MMR Filtering) |
| **Data & Vision** | Pandas, PyPDF, BeautifulSoup4, PIL (Pillow) |

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python 3.10+**
- **Node.js 18+** & `npm`
- **Mistral AI API Key** & **Tavily API Key**

---

### 1️⃣ Clone & Configure Environment

```bash
git clone https://github.com/MayurGawas23/AURA.git
cd AURA

# Copy environment template
cp .env.example .env
```

Edit `.env` and add your API keys:
```env
MISTRAL_API_KEY=your_mistral_api_key_here
TAVILY_API_KEY=your_tavily_api_key_here
HOST=0.0.0.0
PORT=8000
```

---

### 2️⃣ Backend Setup (FastAPI & LangChain)

```bash
# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install Python dependencies
pip install -r requirement.txt

# Launch AURA FastAPI Server
python main.py server
```
The backend server runs on `http://localhost:8000`.

---

### 3️⃣ Frontend Setup (React & Vite)

```bash
# Navigate to UI directory
cd aura-ui

# Install dependencies
npm install

# Start development server
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 📁 Repository Directory Structure

```text
AURA/
├── aura/
│   ├── agents.py       # Reusable LangChain Agent Constructors
│   ├── api.py          # FastAPI REST Endpoints & Storage Handlers
│   ├── components.py   # System Prompts & LangChain Chains
│   ├── config.py       # System Settings & Pydantic Config
│   ├── llm.py          # Mistral LLM Connection Factory
│   ├── pipelines.py    # 6 Specialized Agent Execution Pipelines
│   ├── storage.py      # Session & Global Cross-Session Memory Engine
│   └── tools.py        # Tavily Search, ChromaDB RAG, Sandbox Tools
├── aura-ui/            # React + Vite + Tailwind Web Application
├── .env.example        # Environment Variables Template
├── .gitignore          # Production Git Exclusion Rules
├── main.py             # Server CLI Launcher
└── requirement.txt     # Python Dependencies
```

---

## 🔌 API Reference Endpoints

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `GET /health` | `GET` | Health check & system diagnostic status |
| `POST /api/chat` | `POST` | Auto Router & Conversational Memory Endpoint |
| `POST /api/research` | `POST` | Deep Web Research Agent Endpoint |
| `POST /api/rag` | `POST` | RAG Document QA Endpoint |
| `POST /api/code` | `POST` | Code Engineering Agent Endpoint |
| `POST /api/data` | `POST` | Pandas Data Analysis Agent Endpoint |
| `POST /api/vision` | `POST` | Optical Inspection Vision Agent Endpoint |
| `POST /api/upload` | `POST` | Binary & Document Upload Handler |
| `GET /api/sessions` | `GET` | Fetch all saved chat sessions |

---

## 📄 License & Author

Created by **Mayur Gawas** ([GitHub Profile](https://github.com/MayurGawas23)).
Licensed under the MIT License.
