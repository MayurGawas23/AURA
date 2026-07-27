import json
import time
import re
from pathlib import Path
from typing import Dict, Any, List, Optional
from aura.config import settings

class StorageManager:
    """
    Extensible Session Storage & Global Memory Manager:
    Persists complete conversation trajectories and cross-session Global Persistent Memory
    (e.g., user name, AI name like 'Jarvis', user preferences, and global facts).
    """
    def __init__(self, db_path: Optional[Path] = None):
        self.db_path = db_path or (settings.BASE_DIR / "storage" / "db.json")
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    def _init_db(self):
        if not self.db_path.exists():
            initial_data = {
                "files": [],
                "sessions": [],
                "global_memory": {
                    "user_name": "",
                    "ai_name": "AURA",
                    "user_facts": []
                }
            }
            self._write_db(initial_data)

    def _read_db(self) -> Dict[str, Any]:
        try:
            with open(self.db_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                if "sessions" not in data:
                    data["sessions"] = []
                if "global_memory" not in data:
                    data["global_memory"] = {"user_name": "", "ai_name": "AURA", "user_facts": []}
                return data
        except Exception:
            return {"files": [], "sessions": [], "global_memory": {"user_name": "", "ai_name": "AURA", "user_facts": []}}

    def _write_db(self, data: Dict[str, Any]):
        with open(self.db_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)

    # =====================================================================
    # Global Persistent Memory Engine (Cross-Session Memory)
    # =====================================================================

    def get_global_memory(self) -> Dict[str, Any]:
        db = self._read_db()
        return db.get("global_memory", {"user_name": "", "ai_name": "AURA", "user_facts": []})

    def update_global_memory_from_text(self, text: str):
        """Extract and persist global user facts (user_name, ai_name, preferences) from user prompts."""
        if not text:
            return
        
        db = self._read_db()
        mem = db.get("global_memory", {"user_name": "", "ai_name": "AURA", "user_facts": []})
        updated = False

        text_lower = text.lower()

        # Extract AI Name (e.g. "your name is jarvis", "call yourself jarvis", "from now your name is jarvis")
        ai_match = re.search(r"(?:your name is|call yourself|from now your name is|rename yourself to)\s+([a-zA-Z0-9_-]+)", text, re.IGNORECASE)
        if ai_match:
            new_ai_name = ai_match.group(1).capitalize()
            if new_ai_name and mem.get("ai_name") != new_ai_name:
                mem["ai_name"] = new_ai_name
                updated = True

        # Extract User Name (e.g. "my name is mayur", "call me mayur", "i am mayur")
        user_match = re.search(r"(?:my name is|call me|i am called)\s+([a-zA-Z0-9_-]+)", text, re.IGNORECASE)
        if user_match:
            new_user_name = user_match.group(1).capitalize()
            # Exclude common adjectives/words
            if new_user_name.lower() not in ["a", "an", "the", "ready", "here", "testing", "asking", "fine", "good"]:
                if mem.get("user_name") != new_user_name:
                    mem["user_name"] = new_user_name
                    updated = True

        # Extract General Remembered Fact (e.g. "remember that I prefer Python")
        rem_match = re.search(r"(?:remember that|keep in mind that)\s+(.+)", text, re.IGNORECASE)
        if rem_match:
            fact = rem_match.group(1).strip()
            if fact and fact not in mem.get("user_facts", []):
                if "user_facts" not in mem:
                    mem["user_facts"] = []
                mem["user_facts"].append(fact)
                updated = True

        if updated:
            db["global_memory"] = mem
            self._write_db(db)

    def get_global_memory_context(self) -> str:
        """Construct a formatted string payload of all persistent global facts for prompt injection."""
        mem = self.get_global_memory()
        user_name = mem.get("user_name", "")
        ai_name = mem.get("ai_name", "AURA")
        user_facts = mem.get("user_facts", [])

        lines = [
            "GLOBAL PERSISTENT USER MEMORY (RETAINED ACROSS ALL CONVERSATION SESSIONS):",
            f"- AI's Assigned Name: {ai_name}",
            f"- User's Name: {user_name if user_name else 'Not specified yet'}"
        ]

        if user_facts:
            lines.append("- Remembered User Facts & Preferences:")
            for f in user_facts:
                lines.append(f"  • {f}")

        return "\n".join(lines)

    # File Metadata Management
    def save_file_metadata(self, filename: str, file_type: str, saved_path: str, size_bytes: int) -> Dict[str, Any]:
        db = self._read_db()
        record = {
            "id": f"file_{int(time.time() * 1000)}",
            "filename": filename,
            "file_type": file_type,
            "saved_path": saved_path,
            "size_bytes": size_bytes,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
        }
        db["files"].append(record)
        self._write_db(db)
        return record

    def get_uploaded_files(self, file_type: Optional[str] = None) -> List[Dict[str, Any]]:
        db = self._read_db()
        files = db.get("files", [])
        if file_type:
            return [f for f in files if f.get("file_type") == file_type]
        return files

    # Conversation Storage
    def save_session_message(
        self,
        session_id: str,
        user_query: str,
        agent_type: str,
        execution_plan: Optional[Dict[str, Any]],
        output: str,
        file_path: Optional[str] = "",
        mode: str = "manual"
    ) -> Dict[str, Any]:
        # Automatically update global memory from user query text
        self.update_global_memory_from_text(user_query)

        db = self._read_db()
        sessions = db.get("sessions", [])
        now_str = time.strftime("%Y-%m-%d %H:%M:%S")
        
        target_session = None
        for s in sessions:
            if s.get("session_id") == session_id:
                target_session = s
                break

        tools_activated = execution_plan.get("tools", []) if execution_plan else []
        has_tools = len(tools_activated) > 0

        user_turn = {
            "id": f"msg_user_{int(time.time() * 1000)}",
            "role": "user",
            "content": user_query,
            "file_path": file_path or "",
            "timestamp": now_str
        }

        assistant_turn = {
            "id": f"msg_assistant_{int(time.time() * 1000)}",
            "role": "assistant",
            "content": output,
            "agent_type": agent_type,
            "execution_plan": execution_plan,
            "timestamp": now_str
        }

        if target_session:
            target_session["last_updated"] = now_str
            if "chat_history" not in target_session:
                target_session["chat_history"] = []
            
            target_session["chat_history"].extend([user_turn, assistant_turn])
            
            if "tools_used" not in target_session:
                target_session["tools_used"] = []
            for t in tools_activated:
                if t not in target_session["tools_used"]:
                    target_session["tools_used"].append(t)
                    
            target_session["has_tools"] = len(target_session["tools_used"]) > 0

            if file_path:
                if "uploaded_files" not in target_session:
                    target_session["uploaded_files"] = []
                if file_path not in target_session["uploaded_files"]:
                    target_session["uploaded_files"].append(file_path)
        else:
            target_session = {
                "session_id": session_id or f"session_{int(time.time() * 1000)}",
                "created_at": now_str,
                "last_updated": now_str,
                "title": user_query[:50] + ("..." if len(user_query) > 50 else ""),
                "agent_used": agent_type,
                "execution_mode": mode,
                "has_tools": has_tools,
                "tools_used": tools_activated,
                "uploaded_files": [file_path] if file_path else [],
                "metadata": {
                    "version": "1.0",
                    "client": "AURA Web Dashboard",
                    "tags": [agent_type, mode]
                },
                "chat_history": [user_turn, assistant_turn]
            }
            sessions.append(target_session)

        db["sessions"] = sessions
        self._write_db(db)
        return target_session

    def update_session_metadata(self, session_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        db = self._read_db()
        sessions = db.get("sessions", [])
        for s in sessions:
            if s.get("session_id") == session_id:
                if "title" in updates:
                    s["title"] = updates["title"]
                if "metadata" in updates:
                    s["metadata"].update(updates["metadata"])
                s["last_updated"] = time.strftime("%Y-%m-%d %H:%M:%S")
                self._write_db(db)
                return s
        return None

    def get_sessions(self) -> List[Dict[str, Any]]:
        db = self._read_db()
        return db.get("sessions", [])

    def get_session_by_id(self, session_id: str) -> Optional[Dict[str, Any]]:
        sessions = self.get_sessions()
        for s in sessions:
            if s.get("session_id") == session_id:
                return s
        return None

storage = StorageManager()
