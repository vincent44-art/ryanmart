# Login Error Fix Plan

## Issues Identified:
1. SQLAlchemy 1.4+ compatibility - `db.session.execute('SELECT 1')` missing `text()` wrapper
2. Relative import issues in `backend/resources/auth.py`
3. Relative import issues in `backend/utils/it_monitor.py`

## Tasks:

### Step 1: Fix SQLAlchemy text() wrapper in app.py
- [ ] Change `db.session.execute('SELECT 1')` to `db.session.execute(text('SELECT 1'))`

### Step 2: Fix relative imports in auth.py
- [ ] Change `from models.user import User` to `from ..models.user import User`
- [ ] Change `from utils.helpers import make_response_data, get_current_user` to `from ..utils.helpers import make_response_data, get_current_user`
- [ ] Change `from utils.it_monitor import log_login_success, log_login_failure` to `from ..utils.it_monitor import log_login_success, log_login_failure`

### Step 3: Fix relative imports in it_monitor.py
- [ ] Fix all relative imports to use `..` prefix

### Step 4: Test the fixes
- [ ] Run backend and verify login works

