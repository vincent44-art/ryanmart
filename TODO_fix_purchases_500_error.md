# Plan: Fix 500 Error on Purchases API

## Problem Analysis

The 500 Internal Server Error is occurring on the purchases API endpoints:
- `GET /api/purchases/by-email/kimani@purchaser.com` returns 500
- `POST /api/purchases` returns 500

### Root Cause
Looking at `backend/resources/purchases.py`, there's a **circular import / code structure issue**:

1. The file has the `Purchase` model class defined at the **bottom** after imports
2. The `to_dict()` method uses a relative import `from .user import User` which can fail
3. The file structure is non-standard - a Resource file should not contain model definitions

### Issues Identified
1. **`Purchase` model is defined in the wrong file** - Models should be in `backend/models/`, not in `backend/resources/purchases.py`
2. **Relative import in `to_dict()` method** - `from .user import User` can cause issues when called during JSON serialization
3. **Code organization** - The file mixes Resource classes and Model definition, causing potential import issues

## Plan

### Step 1: Move Purchase model to proper location
- Move the `Purchase` class definition from `backend/resources/purchases.py` to `backend/models/purchases.py`
- Ensure proper imports in the model file

### Step 2: Update imports in `backend/resources/purchases.py`
- Remove the local `Purchase` model definition
- Import `Purchase` from `models.purchases`
- Fix the `to_dict()` method to not use relative imports

### Step 3: Update `backend/models/purchases.py`
- Ensure the model file has proper imports
- Fix the `to_dict()` method to avoid circular imports

### Step 4: Test the fix
- Run the test script to verify the API returns JSON correctly

## Files to Modify
1. `backend/resources/purchases.py` - Remove model definition, fix imports
2. `backend/models/purchases.py` - Ensure model is properly defined (may need updating)

## Implementation Details

### Current problematic code in `backend/resources/purchases.py`:
```python
# At the bottom of the file (after all the Resource classes):
from datetime import datetime
from .user import db

class Purchase(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    # ... fields ...
    
    def to_dict(self):
        from .user import User  # Relative import - can fail!
        user = db.session.get(User, self.purchaser_id)
        # ...
```

### Fix: 
The model should be in `backend/models/purchases.py` with proper imports:
```python
from datetime import datetime
from extensions import db
from models.user import User

class Purchase(db.Model):
    # ... fields ...
    
    def to_dict(self):
        # Use db.session.get() which works properly
        user = db.session.get(User, self.purchaser_id)
        # ...
```

