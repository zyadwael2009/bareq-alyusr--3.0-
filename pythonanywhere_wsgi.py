import sys
import os

# Add project directory to path
project_home = '/home/bareeqalyusr/bareq-alyusr--3.0-'
if project_home not in sys.path:
    sys.path.insert(0, project_home)

# Change to project directory
os.chdir(project_home)

# CRITICAL: Set up event loop BEFORE any async imports
import asyncio
import threading

# Create a dedicated event loop for this thread
_loop = asyncio.new_event_loop()
asyncio.set_event_loop(_loop)

# Initialize database before loading the app
from app.database import init_db
init_db()

# Import FastAPI app
from app.main import app as fastapi_app

# Use a2wsgi with thread-safe settings
from a2wsgi import ASGIMiddleware

# Create WSGI application
# The default executor=None uses ThreadPoolExecutor which is more compatible
application = ASGIMiddleware(fastapi_app, executor=None)
