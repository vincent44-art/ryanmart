# TODO: Convert Relative Imports to Absolute Imports (Model A)

## Task
Convert all `from ..` relative imports to local absolute imports rooted at `backend/`.

## Files to Modify

### 1. backend/utils/helpers.py
- [x] `from ..models.user import User` → `from models.user import User`

### 2. backend/utils/it_monitor.py
- [x] `from ..models.it_event import ...` → `from models.it_event import ...`
- [x] `from ..models.it_alert import ...` → `from models.it_alert import ...`
- [x] `from ..models.user import User` → `from models.user import User`
- [x] `from ..extensions import db` → `from extensions import db`

### 3. backend/resources/auth.py
- [x] `from ..models.user import User` → `from models.user import User`
- [x] `from ..utils.helpers import ...` → `from utils.helpers import ...`
- [x] `from ..utils.it_monitor import ...` → `from utils.it_monitor import ...`

### 4. backend/resources/user.py
- [x] `from ..models.user import ...` → `from models.user import ...`
- [x] `from ..utils.decorators import ...` → `from utils.decorators import ...`
- [x] `from ..utils.helpers import ...` → `from utils.helpers import ...`

### 5. backend/resources/dashboard.py
- [x] `from ..utils.helpers import ...` → `from utils.helpers import ...`
- [x] `from ..utils.decorators import ...` → `from utils.decorators import ...`

### 6. backend/resources/expenses.py
- [x] `from ..models.driver import ...` → `from models.driver import ...`
- [x] `from ..utils.helpers import ...` → `from utils.helpers import ...`
- [x] `from ..utils.pdf_generator import ...` → `from utils.pdf_generator import ...`

### 7. backend/resources/stock.py
- [x] `from ..utils.helpers import ...` → `from utils.helpers import ...`
- [x] `from ..utils.decorators import ...` → `from utils.decorators import ...`

### 8. backend/resources/stock_tracking.py
- [x] `from ..utils.helpers import ...` → `from utils.helpers import ...`
- [x] `from ..utils.decorators import ...` → `from utils.decorators import ...`

### 9. backend/resources/ai_assistance.py
- [x] `from ..utils.helpers import ...` → `from utils.helpers import ...`

### 10. backend/resources/gradients.py
- [x] `from ..utils.helpers import ...` → `from utils.helpers import ...`
- [x] `from ..utils.decorators import ...` → `from utils.decorators import ...`

### 11. backend/resources/salaries.py
- [x] `from ..models.salary import ...` → `from models.salary import ...`
- [x] `from ..utils.helpers import ...` → `from utils.helpers import ...`

### 12. backend/resources/other_expenses.py
- [x] `from ..utils.helpers import ...` → `from utils.helpers import ...`
- [x] `from ..utils.decorators import ...` → `from utils.decorators import ...`

### 13. backend/resources/it_events.py
- [x] `from ..models.it_event import ...` → `from models.it_event import ...`
- [x] `from ..models.user import ...` → `from models.user import ...`
- [x] `from ..utils.helpers import ...` → `from utils.helpers import ...`

### 14. backend/resources/it_alerts.py
- [x] `from ..models.it_alert import ...` → `from models.it_alert import ...`
- [x] `from ..models.user import ...` → `from models.user import ...`
- [x] `from ..utils.helpers import ...` → `from utils.helpers import ...`
- [x] `from ..extensions import db` → `from extensions import db`

### 15. backend/resources/purchases.py
- [x] `from ..utils.helpers import ...` → `from utils.helpers import ...`
- [x] `from ..utils.decorators import ...` → `from utils.decorators import ...`

### 16. backend/resources/assignments.py
- [x] `from ..models.assignment import ...` → `from models.assignment import ...`
- [x] `from ..models.sales import ...` → `from models.sales import ...`
- [x] `from ..models.user import db` → `from models.user import db`
- [x] `from ..utils.helpers import ...` → `from utils.helpers import ...`

### 17. backend/resources/ceo_dashboard.py
- [x] `from ..models.driver import ...` → `from models.driver import ...`
- [x] `from ..models.other_expense import ...` → `from models.other_expense import ...`
- [x] `from ..models.seller_fruit import ...` → `from models.seller_fruit import ...`
- [x] `from ..utils.helpers import ...` → `from utils.helpers import ...`

### 18. backend/resources/inventory.py
- [x] `from ..utils.helpers import ...` → `from utils.helpers import ...`
- [x] `from ..utils.decorators import ...` → `from utils.decorators import ...`

### 19. backend/resources/messages.py
- [x] `from ..utils.helpers import ...` → `from utils.helpers import ...`
- [x] `from ..utils.decorators import ...` → `from utils.decorators import ...`

### 20. backend/resources/drivers.py
- [x] `from ..models.driver import ...` → `from models.driver import ...`
- [x] `from ..models.user import db` → `from models.user import db`

### 21. backend/resources/expenses_enhanced.py
- [x] `from ..models.driver import ...` → `from models.driver import ...`
- [x] `from ..utils.helpers import ...` → `from utils.helpers import ...`
- [x] `from ..utils.pdf_generator import ...` → `from utils.pdf_generator import ...`

### 22. backend/resources/receipts.py
- [x] `from ..utils.helpers import ...` → `from utils.helpers import ...`

## Validation
After completing all edits, run:
```bash
cd backend
gunicorn app:app
```

Expected: No import errors.

