from fastapi import FastAPI, HTTPException, Request, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from pathlib import Path
import time

from aura.config import settings
from aura.storage import storage
from aura.tools import reset_chroma_vectorstore
from aura.pipelines import (
    run_research_pipeline,
    run_rag_pipeline,
    run_code_pipeline,
    run_data_pipeline,
    run_vision_pipeline,
    run_auto_router_pipeline
)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Production-Grade Multi-Agent AI Platform API"
)

# Enable CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================================================================
# Request / Response Schemas
# =====================================================================

class ResearchRequest(BaseModel):
    topic: str = Field(..., example="Latest developments in quantum computing")
    session_id: Optional[str] = None

class RAGRequest(BaseModel):
    query: str = Field(..., example="What are the key contractual terms in this PDF?")
    file_path: str = Field(..., example="uploads/contract.pdf")
    session_id: Optional[str] = None

class CodeRequest(BaseModel):
    task: str = Field(..., example="Write an async LRU cache class in Python")
    code_snippet: Optional[str] = Field("", example="class LRUCache: pass")
    session_id: Optional[str] = None

class DataRequest(BaseModel):
    query: str = Field(..., example="Calculate total sales by region and list top 3 products")
    file_path: str = Field(..., example="uploads/sales.csv")
    session_id: Optional[str] = None

class VisionRequest(BaseModel):
    query: str = Field(..., example="Describe the architecture diagram in this image")
    image_path: str = Field(..., example="uploads/architecture.png")
    session_id: Optional[str] = None

class ChatRequest(BaseModel):
    prompt: str = Field(..., example="Explain this code snippet or research topic")
    file_path: Optional[str] = Field("", example="")
    session_id: Optional[str] = None

class UpdateSessionRequest(BaseModel):
    title: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class ExecutionPlanSchema(BaseModel):
    agent_name: str
    tools: List[str]
    pipeline_steps: List[str]

class AgentResponse(BaseModel):
    status: str = "success"
    session_id: Optional[str] = None
    agent_type: str
    input_query: str
    execution_plan: Optional[ExecutionPlanSchema] = None
    output: str
    details: Optional[Dict[str, Any]] = None

# Helper to fetch prior session chat history
def get_session_history(session_id: Optional[str]) -> List[Dict[str, Any]]:
    if not session_id:
        return []
    sess = storage.get_session_by_id(session_id)
    if sess and isinstance(sess.get("chat_history"), list):
        return sess["chat_history"]
    return []

# =====================================================================
# Endpoints
# =====================================================================

@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION
    }

@app.get("/api/system/status", tags=["System"])
async def system_status_endpoint():
    """Retrieve AURA platform diagnostic metrics, storage stats, and active agents."""
    files = storage.get_uploaded_files()
    sessions = storage.get_sessions()
    chroma_exists = (settings.BASE_DIR / "chroma_db").exists()
    
    return {
        "status": "online",
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "chroma_db_active": chroma_exists,
        "total_files_uploaded": len(files),
        "total_chat_sessions": len(sessions),
        "active_agents": ["Research", "RAG Documents", "Code Engineer", "Pandas Data Analyst", "Vision & OCR", "Auto Router"]
    }

@app.get("/api/sessions", tags=["Sessions"])
async def get_sessions_endpoint():
    """Retrieve list of all persistent conversation Sessions."""
    return {"status": "success", "sessions": storage.get_sessions()}

@app.get("/api/sessions/{session_id}", tags=["Sessions"])
async def get_session_detail_endpoint(session_id: str):
    """Retrieve full conversation record and chat history for a specific Session."""
    sess = storage.get_session_by_id(session_id)
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"status": "success", "session": sess}

@app.put("/api/sessions/{session_id}", tags=["Sessions"])
async def update_session_endpoint(session_id: str, req: UpdateSessionRequest):
    """Update title or metadata for a conversation session."""
    updates = {}
    if req.title:
        updates["title"] = req.title
    if req.metadata:
        updates["metadata"] = req.metadata
    
    updated_sess = storage.update_session_metadata(session_id, updates)
    if not updated_sess:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"status": "updated", "session": updated_sess}

@app.get("/api/history", tags=["Storage"])
async def get_history_endpoint():
    """Retrieve all sessions for backward compatibility."""
    return {"status": "success", "sessions": storage.get_sessions()}

@app.get("/api/files", tags=["Storage"])
async def get_files_endpoint(file_type: Optional[str] = None):
    """Retrieve persistent record of all uploaded files, timestamps, and paths."""
    return {"status": "success", "files": storage.get_uploaded_files(file_type)}

@app.delete("/api/vectorstore/reset", tags=["VectorStore"])
async def reset_vectorstore_endpoint():
    """Clear and reset ChromaDB persistent vector database."""
    success = reset_chroma_vectorstore()
    return {"status": "cleared" if success else "failed", "message": "ChromaDB vector store reset successfully."}

@app.post("/api/upload", tags=["Files"])
async def upload_file_endpoint(request: Request):
    """Upload PDF, DOCX, TXT, CSV, Excel, or Image files directly to AURA storage."""
    try:
        filename = request.headers.get("x-file-name", "uploaded_file.bin")
        target_path = settings.UPLOADS_DIR / filename
        body = await request.body()
        
        with open(target_path, "wb") as f:
            f.write(body)
            
        suffix = target_path.suffix.lower()
        file_type = "pdf" if suffix == ".pdf" else "csv" if suffix in [".csv", ".xlsx"] else "image" if suffix in [".png", ".jpg", ".jpeg"] else "doc"
        
        record = storage.save_file_metadata(
            filename=filename,
            file_type=file_type,
            saved_path=str(target_path),
            size_bytes=len(body)
        )
        
        return {
            "status": "uploaded",
            "filename": filename,
            "saved_path": str(target_path),
            "record": record
        }
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(err)}")

@app.post("/api/research", response_model=AgentResponse, tags=["Agents"])
async def research_agent_endpoint(req: ResearchRequest):
    try:
        sid = req.session_id or f"session_{int(time.time() * 1000)}"
        history = get_session_history(sid)
        res = run_research_pipeline(req.topic, history)
        storage.save_session_message(
            session_id=sid,
            user_query=req.topic,
            agent_type=res["agent_type"],
            execution_plan=res.get("execution_plan"),
            output=res["output"],
            mode="manual"
        )
        res["session_id"] = sid
        return AgentResponse(**res)
    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err))

@app.post("/api/rag", response_model=AgentResponse, tags=["Agents"])
async def rag_agent_endpoint(req: RAGRequest):
    try:
        sid = req.session_id or f"session_{int(time.time() * 1000)}"
        history = get_session_history(sid)
        res = run_rag_pipeline(req.query, req.file_path, history)
        storage.save_session_message(
            session_id=sid,
            user_query=req.query,
            agent_type=res["agent_type"],
            execution_plan=res.get("execution_plan"),
            output=res["output"],
            file_path=req.file_path,
            mode="manual"
        )
        res["session_id"] = sid
        return AgentResponse(**res)
    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err))

@app.post("/api/code", response_model=AgentResponse, tags=["Agents"])
async def code_agent_endpoint(req: CodeRequest):
    try:
        sid = req.session_id or f"session_{int(time.time() * 1000)}"
        history = get_session_history(sid)
        res = run_code_pipeline(req.task, req.code_snippet, history)
        storage.save_session_message(
            session_id=sid,
            user_query=req.task,
            agent_type=res["agent_type"],
            execution_plan=res.get("execution_plan"),
            output=res["output"],
            mode="manual"
        )
        res["session_id"] = sid
        return AgentResponse(**res)
    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err))

@app.post("/api/data", response_model=AgentResponse, tags=["Agents"])
async def data_agent_endpoint(req: DataRequest):
    try:
        sid = req.session_id or f"session_{int(time.time() * 1000)}"
        history = get_session_history(sid)
        res = run_data_pipeline(req.query, req.file_path, history)
        storage.save_session_message(
            session_id=sid,
            user_query=req.query,
            agent_type=res["agent_type"],
            execution_plan=res.get("execution_plan"),
            output=res["output"],
            file_path=req.file_path,
            mode="manual"
        )
        res["session_id"] = sid
        return AgentResponse(**res)
    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err))

@app.post("/api/vision", response_model=AgentResponse, tags=["Agents"])
async def vision_agent_endpoint(req: VisionRequest):
    try:
        sid = req.session_id or f"session_{int(time.time() * 1000)}"
        history = get_session_history(sid)
        res = run_vision_pipeline(req.query, req.image_path, history)
        storage.save_session_message(
            session_id=sid,
            user_query=req.query,
            agent_type=res["agent_type"],
            execution_plan=res.get("execution_plan"),
            output=res["output"],
            file_path=req.image_path,
            mode="manual"
        )
        res["session_id"] = sid
        return AgentResponse(**res)
    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err))

@app.post("/api/chat", response_model=AgentResponse, tags=["Router"])
async def router_endpoint(req: ChatRequest):
    try:
        sid = req.session_id or f"session_{int(time.time() * 1000)}"
        history = get_session_history(sid)
        res = run_auto_router_pipeline(req.prompt, req.file_path, history)
        storage.save_session_message(
            session_id=sid,
            user_query=req.prompt,
            agent_type=res["agent_type"],
            execution_plan=res.get("execution_plan"),
            output=res["output"],
            file_path=req.file_path,
            mode="auto"
        )
        res["session_id"] = sid
        return AgentResponse(**res)
    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err))
