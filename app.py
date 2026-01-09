# Root-level WSGI entrypoint for Render/Gunicorn
# Ensures `gunicorn app:app` works by importing the Flask app from backend.
import os
import sys

# Make sure the project root is on sys.path
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

# Import the actual Flask app from the backend package
from backend.app import app  # noqa: E402

# Optional local run support
if __name__ == "__main__":
    # Running directly will start the development server (not used on Render)
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=False)
