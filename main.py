"""
AURA - Autonomous Universal Reasoning Assistant
Main Application Launcher
"""

import sys
import uvicorn
from aura.config import settings
from aura.pipelines import run_auto_router_pipeline

def run_cli():
    print(f"\n{'='*60}")
    print(f" Welcome to {settings.APP_NAME} (v{settings.APP_VERSION})")
    print(f"{'='*60}")
    
    prompt = input("\nEnter your task or query: ")
    file_path = input("Enter file path (optional, press Enter to skip): ").strip()
    
    result = run_auto_router_pipeline(prompt, file_path)
    
    print(f"\n{'='*60}")
    print(f" Agent Activated: {result['agent_type'].upper()}")
    print(f"{'='*60}\n")
    print(result['output'])

def run_server():
    print(f"Starting AURA FastAPI Server on http://{settings.HOST}:{settings.PORT} ...")
    uvicorn.run("aura.api:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "server":
        run_server()
    else:
        run_cli()
