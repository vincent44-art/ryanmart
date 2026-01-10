# Thin wrapper to keep compatibility with 'gunicorn app:app'
from wsgi import app  # re-export app from wsgi.py

if __name__ == "__main__":
    import os
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=False)
