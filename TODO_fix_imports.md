# TODO: Fix Relative Imports for App Import

## Task
Convert all `from ..` relative imports to absolute imports rooted at `backend/` to fix the import error when running `python -c "import app"`.

## Files to Modify

### 1. backend/resources/salaries.py
- [x] `from ..models.salary import Salary, db` → `from models.salary import Salary` (use existing `db` import)

### 2. backend/resources/it_alerts.py
- [x] `from ..models.it_alert import ITAlert, AlertSeverity` → `from models.it_alert import ITAlert, AlertSeverity`
- [x] `from ..models.user import User` → `from models.user import User`
- [x] `from ..utils.helpers import make_response_data` → `from utils.helpers import make_response_data`
- [x] `from ..extensions import db` → `from extensions import db`

### 3. backend/resources/it_events.py
- [x] `from ..models.it_event import ITEvent, EventType, Severity` → `from models.it_event import ITEvent, EventType, Severity`
- [x] `from ..models.user import User` → `from models.user import User`
- [x] `from ..utils.helpers import make_response_data` → `from utils.helpers import make_response_data`
- [x] `from ..extensions import db` → `from extensions import db`

### 4. backend/resources/receipts.py
- [x] `from ..utils.helpers import make_response_data` → `from utils.helpers import make_response_data`

### 5. backend/resources/inventory.py
- [x] `from ..utils.helpers import make_response_data, get_current_user` → `from utils.helpers import make_response_data, get_current_user`
- [x] `from ..utils.decorators import role_required` → `from utils.decorators import role_required`

## Validation
After completing all edits, run:
```bash
cd /home/vincent/ryanmart && python -c "import app; print('All imports successful')"
```

Expected: No import errors.

## Status: COMPLETED ✅
All relative imports have been converted to absolute imports. The app now imports successfully.

