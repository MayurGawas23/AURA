from typing import TypedDict, Optional, Dict, Any, List
from aura.storage import storage
from aura.agents import (
    build_search_agent,
    build_reader_agent,
    build_rag_agent,
    build_code_agent,
    build_data_agent,
    build_vision_agent
)
from aura.components import (
    chat_chain,
    writer_chain,
    critic_chain,
    rag_chain,
    code_chain,
    data_chain,
    vision_chain,
    router_chain
)
from aura.tools import (
    read_document,
    execute_python_code,
    analyze_dataset,
    analyze_image
)

class ExecutionPlan(TypedDict):
    agent_name: str
    tools: List[str]
    pipeline_steps: List[str]

class PipelineResult(TypedDict, total=False):
    agent_type: str
    input_query: str
    execution_plan: ExecutionPlan
    output: str
    details: Optional[Dict[str, Any]]

def format_chat_history(raw_history: Optional[List[Dict[str, Any]]]) -> List[Any]:
    """Helper to convert raw JSON chat history into tuple pairs for LangChain history placeholders."""
    formatted = []
    if not raw_history:
        return formatted
    for msg in raw_history:
        role = msg.get("role", "")
        content = msg.get("content") or msg.get("text") or ""
        if not content:
            continue
        if role == "user":
            formatted.append(("user", content))
        elif role == "assistant":
            formatted.append(("assistant", content))
    return formatted[-10:]

# =====================================================================
# 1. Research Pipeline
# =====================================================================

def run_research_pipeline(topic: str, chat_history: Optional[List[Dict[str, Any]]] = None) -> PipelineResult:
    """Executes multi-step Research Pipeline with Search, Reader, Writer, and Critic."""
    storage.update_global_memory_from_text(topic)
    plan: ExecutionPlan = {
        "agent_name": "Research Agent",
        "tools": ["Tavily Search", "BeautifulSoup Scraper"],
        "pipeline_steps": ["Web Search", "Content Scraping", "Report Synthesis"]
    }

    history = format_chat_history(chat_history)
    global_mem = storage.get_global_memory_context()
    
    search_agent = build_search_agent()
    search_res = search_agent.invoke({
        "messages": [("user", f"Find recent, reliable information about: {topic}")]
    })
    search_text = search_res["messages"][-1].content

    reader_agent = build_reader_agent()
    reader_res = reader_agent.invoke({
        "messages": [(
            "user",
            f"Based on search results about '{topic}', pick the most relevant URL and scrape it:\n\n{search_text[:800]}"
        )]
    })
    scraped_text = reader_res["messages"][-1].content

    combined_research = f"GLOBAL USER MEMORY:\n{global_mem}\n\nSEARCH RESULTS:\n{search_text}\n\nSCRAPED CONTENT:\n{scraped_text}"
    report = writer_chain.invoke({"topic": topic, "research": combined_research, "history": history})

    return {
        "agent_type": "research",
        "input_query": topic,
        "execution_plan": plan,
        "output": report,
        "details": {
            "search_result": search_text,
            "scraped_content": scraped_text,
            "report": report
        }
    }

# =====================================================================
# 2. RAG Pipeline
# =====================================================================

def run_rag_pipeline(query: str, file_path: str, chat_history: Optional[List[Dict[str, Any]]] = None) -> PipelineResult:
    """Executes RAG Document QA Pipeline using ChromaDB vector database."""
    storage.update_global_memory_from_text(query)
    plan: ExecutionPlan = {
        "agent_name": "RAG Document Agent",
        "tools": ["ChromaDB Vector Database", "Mistral AI Embeddings", "MMR Retriever"],
        "pipeline_steps": ["Parse & Chunk Document", "Generate Embeddings", "Persist to ChromaDB", "MMR Vector Search", "Synthesize Answer"]
    }

    history = format_chat_history(chat_history)
    global_mem = storage.get_global_memory_context()
    context = read_document.invoke({"file_path": file_path, "query": query})
    full_context = f"{global_mem}\n\nDOCUMENT CONTEXT:\n{context}"
    output = rag_chain.invoke({"question": query, "context": full_context, "history": history})

    return {
        "agent_type": "rag",
        "input_query": query,
        "execution_plan": plan,
        "output": output,
        "details": {"file_path": file_path, "context_snippet": context[:500]}
    }

# =====================================================================
# 3. Code Pipeline
# =====================================================================

def run_code_pipeline(task: str, code_snippet: str = "", chat_history: Optional[List[Dict[str, Any]]] = None) -> PipelineResult:
    """Executes Code Engineering Pipeline."""
    storage.update_global_memory_from_text(task)
    plan: ExecutionPlan = {
        "agent_name": "Code Agent",
        "tools": ["Python Code Execution Sandbox", "Syntax Analyzer"],
        "pipeline_steps": ["Code Generation", "Syntax & Execution Check"]
    }

    history = format_chat_history(chat_history)
    global_mem = storage.get_global_memory_context()
    full_code_context = f"{global_mem}\n\nCODE CONTEXT:\n{code_snippet or 'None provided.'}"
    output = code_chain.invoke({"task": task, "code_context": full_code_context, "history": history})

    return {
        "agent_type": "code",
        "input_query": task,
        "execution_plan": plan,
        "output": output,
        "details": {"code_context": code_snippet}
    }

# =====================================================================
# 4. Data Analysis Pipeline
# =====================================================================

def run_data_pipeline(query: str, file_path: str, chat_history: Optional[List[Dict[str, Any]]] = None) -> PipelineResult:
    """Executes Data Analysis Pipeline."""
    storage.update_global_memory_from_text(query)
    plan: ExecutionPlan = {
        "agent_name": "Data Analysis Agent",
        "tools": ["Tabular Data Inspector", "Python Code Sandbox"],
        "pipeline_steps": ["Load CSV/Excel Dataset", "Extract Schema & Stats", "Generate Direct Insights"]
    }

    history = format_chat_history(chat_history)
    global_mem = storage.get_global_memory_context()
    dataset_summary = analyze_dataset.invoke(file_path)
    full_summary = f"{global_mem}\n\nDATASET SUMMARY:\n{dataset_summary}"
    output = data_chain.invoke({"query": query, "dataset_summary": full_summary, "history": history})

    return {
        "agent_type": "data",
        "input_query": query,
        "execution_plan": plan,
        "output": output,
        "details": {"file_path": file_path, "summary": dataset_summary}
    }

# =====================================================================
# 5. Vision Pipeline
# =====================================================================

def run_vision_pipeline(query: str, image_path: str, chat_history: Optional[List[Dict[str, Any]]] = None) -> PipelineResult:
    """Executes Vision & Visual Reasoning Pipeline."""
    storage.update_global_memory_from_text(query)
    plan: ExecutionPlan = {
        "agent_name": "Vision Agent",
        "tools": ["Visual Inspection Tool", "OCR Engine"],
        "pipeline_steps": ["Inspect Image Artifact", "Extract Text / OCR", "Visual QA Synthesis"]
    }

    history = format_chat_history(chat_history)
    global_mem = storage.get_global_memory_context()
    image_details = analyze_image.invoke(image_path)
    full_details = f"{global_mem}\n\nVISION DETAILS:\n{image_details}"
    output = vision_chain.invoke({"query": query, "image_details": full_details, "history": history})

    return {
        "agent_type": "vision",
        "input_query": query,
        "execution_plan": plan,
        "output": output,
        "details": {"image_path": image_path, "inspection": image_details}
    }

# =====================================================================
# 6. Intent Auto-Router Pipeline (Intelligent Multi-Model Routing)
# =====================================================================

def run_auto_router_pipeline(user_prompt: str, optional_file_path: str = "", chat_history: Optional[List[Dict[str, Any]]] = None) -> PipelineResult:
    """Routes query automatically based on user intent and optional file attachment context."""
    storage.update_global_memory_from_text(user_prompt)
    history = format_chat_history(chat_history)
    global_mem = storage.get_global_memory_context()

    raw_category = router_chain.invoke({"query": user_prompt}).strip().lower()
    category = raw_category.split()[0] if raw_category else "chat"

    # Intelligent Auto-Correction based on attached file type if router output is ambiguous
    if optional_file_path:
        ext = optional_file_path.lower().split('.')[-1]
        if ext in ['pdf', 'txt', 'docx']:
            if category in ['chat', 'research']:
                category = 'rag'
        elif ext in ['csv', 'xlsx', 'xls']:
            if category in ['chat', 'research']:
                category = 'data'
        elif ext in ['png', 'jpg', 'jpeg', 'webp', 'bmp']:
            if category in ['chat', 'research']:
                category = 'vision'

    if category == "chat":
        plan: ExecutionPlan = {
            "agent_name": "AURA Conversational Agent",
            "tools": ["Conversational Reasoning Engine"],
            "pipeline_steps": ["Intent Classification", "Global Memory Retrieval", "On-Point Response Synthesis"]
        }
        augmented_prompt = f"[{global_mem}]\n\nUser Query: {user_prompt}"
        output = chat_chain.invoke({"prompt": augmented_prompt, "history": history})
        return {
            "agent_type": "chat",
            "input_query": user_prompt,
            "execution_plan": plan,
            "output": output
        }
    elif category == "rag" and optional_file_path:
        return run_rag_pipeline(user_prompt, optional_file_path, chat_history)
    elif category == "code":
        return run_code_pipeline(user_prompt, optional_file_path, chat_history)
    elif category == "data" and optional_file_path:
        return run_data_pipeline(user_prompt, optional_file_path, chat_history)
    elif category == "vision" and optional_file_path:
        return run_vision_pipeline(user_prompt, optional_file_path, chat_history)
    else:
        return run_research_pipeline(user_prompt, chat_history)
