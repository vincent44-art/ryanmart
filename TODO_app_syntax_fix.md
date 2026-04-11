# App Syntax Fix - IndentationError Resolution

## Current Status: Plan Approved

**Information Gathered:**
- IndentationError at backend/app.py line 195: `def missing_token_callback(error):`
- Issue in JWT error handlers block inside create_app()
- Cause: Mixed tabs/spaces likely

**Execution Plan:**
1. [x] ✅ Create this TODO and get user approval (DONE)
2. [ ] Fix indentation of JWT handlers block in backend/app.py
3. [ ] Verify syntax: `python -m py_compile backend/app.py`
4. [ ] Test Gunicorn startup: `gunicorn --bind 0.0.0.0:8000 backend.app:app`
5. [ ] Mark complete and suggest Render redeploy

**Progress:** 1/5 steps complete
