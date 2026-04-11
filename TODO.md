# RyanMart Backend/Frontend Task Tracker

## Completed
- [x] Fix ModuleNotFoundError: No module named 'backend' - Fixed absolute imports in backend/app.py to relative imports (from backend.X → from X). Ready for Render redeploy.
  - Changed 9 import statements leveraging sys.path.insert(0, BACKEND_ROOT).
  - Tested locally with `gunicorn --bind 0.0.0.0:5000 wsgi:app`.

## Pending Tasks
*(Existing TODOs from various files - consolidate as needed)*

- Fix remaining 500 errors (purchases, car expenses, etc.)
- CORS/JSON fixes
- API endpoint improvements
- Spolige tracker enhancements
- ...
