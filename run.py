"""
Run both FastAPI and Flask applications
"""
import subprocess
import sys
import os
import threading
import time

def run_fastapi():
    """Run FastAPI server"""
    os.system("uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload")

def run_flask():
    """Run Flask admin server"""
    os.system("python flask_admin/app.py")

if __name__ == "__main__":
    print("=" * 50)
    print("Starting Bareq Al-Yusr Backend Services")
    print("=" * 50)
    print()
    print("FastAPI (Main API): http://localhost:8000")
    print("  - API Documentation: http://localhost:8000/docs")
    print("  - ReDoc: http://localhost:8000/redoc")
    print()
    print("Flask (Admin Dashboard): http://localhost:5000")
    print()
    print("=" * 50)
    
    # Run FastAPI in a separate thread
    fastapi_thread = threading.Thread(target=run_fastapi, daemon=True)
    fastapi_thread.start()
    
    # Give FastAPI time to start
    time.sleep(2)
    
    # Run Flask in main thread
    run_flask()
