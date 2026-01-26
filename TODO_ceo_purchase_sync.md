# CEO Purchase Dashboard Sync Fix

## Problem
When a purchase is added in the Purchaser Dashboard, it should reflect in the Purchase tab on the CEO page. Currently:
1. The CEO Dashboard doesn't show purchaser email (shows "N/A")
2. No auto-refresh when purchases are added from elsewhere

## Plan

### Step 1: Update Purchase Model ✅ COMPLETED
- Add purchaserEmail field to Purchase.to_dict() by querying User model
- File: backend/models/purchases.py

### Step 2: Fix CEO Dashboard Refetch ✅ COMPLETED
- Fix the refetch mechanism in Dashboard.jsx to properly refresh data
- Expose setData from useDashboardData hook
- File: frontend/src/pages/Dashboard.jsx
- File: frontend/src/api/dashboard.js

### Step 3: Optimize CEO Dashboard Query ✅ COMPLETED
- Use JOIN query to get purchaser email efficiently
- File: backend/resources/ceo_dashboard.py

### Step 4: Add HTML Error Detection ✅ COMPLETED
- Add detection for HTML error pages in API response interceptor
- File: frontend/src/api/api.js

## Implementation Details

### 1. Purchase Model Update ✅
Added purchaserEmail field to to_dict() with safe User query:
```python
def to_dict(self):
    purchaser_email = None
    try:
        from models.user import User
        user = User.query.get(self.purchaser_id)
        if user:
            purchaser_email = user.email
    except Exception:
        purchaser_email = None
    
    return {
        ...
        'purchaserEmail': purchaser_email,
        ...
    }
```

### 2. Dashboard.jsx Refetch Fix ✅
Ensure the handlePurchaseAdded properly triggers a refetch:
```javascript
const handlePurchaseAdded = (newPurchase) => {
  setData(prevData => ({
    ...prevData,
    purchases: [...(prevData?.purchases || []), newPurchase]
  }));
  setTimeout(() => refetch(), 100);
};
```

### 3. CEO Dashboard Query Optimization ✅
Use JOIN to get purchaser email efficiently:
```python
purchases_query = db.session.query(
    Purchase,
    User.email.label('purchaser_email')
).outerjoin(
    User, Purchase.purchaser_id == User.id
).order_by(Purchase.purchase_date.desc())

purchases_data = []
for purchase, purchaser_email in purchases_query.all():
    purchase_dict = purchase.to_dict()
    purchase_dict['purchaserEmail'] = purchaser_email
    purchases_data.append(purchase_dict)
```

### 4. API Error Handling ✅
Added HTML error detection in response interceptor:
```javascript
if (contentType.includes('text/html') || 
    (typeof responseData === 'string' && responseData.trim().startsWith('<!DOCTYPE'))) {
  return Promise.reject({
    status: 500,
    message: 'Server error - received HTML instead of JSON.',
    isHtmlError: true
  });
}
```

## Status: COMPLETED ✅
All changes have been implemented. The CEO Dashboard should now:
1. Show purchaser email for each purchase
2. Automatically refresh when purchases are added from the Purchaser Dashboard
3. Handle server errors gracefully when HTML is returned instead of JSON


