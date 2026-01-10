# Fix Relative Imports in Backend

## Files to Edit

### 1. backend/utils/it_monitor.py
- Change `from ..models.it_event import ITEvent, EventType, Severity` to `from models.it_event import ITEvent, EventType, Severity`
- Change `from ..models.it_alert import ITAlert, AlertSeverity` to `from models.it_alert import ITAlert, AlertSeverity`
- Change `from ..models.user import User` to `from models.user import User`
- Change `from ..extensions import db` to `from extensions import db`

### 2. backend/resources/user.py
- Change `from ..models.user import db, User, UserRole` to `from models.user import db, User, UserRole`

### 3. backend/resources/assignments.py
- Change `from ..models.assignment import Assignment` to `from models.assignment import Assignment`
- Change `from ..models.sales import Sale` to `from models.sales import Sale`
- Change `from ..models.user import db` to `from models.user import db`
- Change `from ..utils.helpers import make_response_data` to `from utils.helpers import make_response_data`

### 4. backend/resources/salaries.py
- Change `from ..models.salary import Salary, db` to `from models.salary import Salary, db`

### 5. backend/resources/inventory.py
- Change `from ..utils.helpers import make_response_data, get_current_user` to `from utils.helpers import make_response_data, get_current_user`
- Change `from ..utils.decorators import role_required` to `from utils.decorators import role_required`

### 6. backend/resources/drivers.py
- Change `from ..models.driver import DriverExpense` to `from models.driver import DriverExpense`
- Change `from ..models.user import db` to `from models.user import db`

### 7. backend/resources/receipts.py
- Change `from ..utils.helpers import make_response_data` to `from utils.helpers import make_response_data`

### 8. backend/resources/it_events.py
- Change `from ..models.it_event import ITEvent, EventType, Severity` to `from models.it_event import ITEvent, EventType, Severity`
- Change `from ..models.user import User` to `from models.user import User`
- Change `from ..utils.helpers import make_response_data` to `from utils.helpers import make_response_data`

### 9. backend/resources/it_alerts.py
- Change `from ..models.it_alert import ITAlert, AlertSeverity` to `from models.it_alert import ITAlert, AlertSeverity`
- Change `from ..models.user import User` to `from models.user import User`
- Change `from ..utils.helpers import make_response_data` to `from utils.helpers import make_response_data`
- Change `from ..extensions import db` to `from extensions import db`

## Validation
After completing all edits, run:
```bash
python -c "import app; print('All imports successful!')"
```

Expected: No import errors.
