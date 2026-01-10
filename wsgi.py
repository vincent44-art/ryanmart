# Root WSGI entrypoint to ensure backend package is importable on Render
import os
import sys

# Ensure the repository root is on sys.path
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

# Import the Flask app from the backend package
from backend.app import app  # noqa: E402
