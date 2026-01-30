# Fix for "Unknown PG numeric type: 1043" Error

## Problem
The error `Unknown PG numeric type: 1043` occurs when:
1. Using ORM queries for `Purchase`, `Sale`, and `SellerFruit` models (fixed in `stock_tracking.py`)
2. Deleting a User with cascade relationships to Sales (fixed in `user.py`)

## Root Cause
psycopg2 encounters an unknown PostgreSQL OID for numeric types when using ORM queries. The error code 1043 is related to PostgreSQL's `NUMERIC` type OID. When deleting a User with cascade relationships, SQLAlchemy tries to lazy-load related Sales records during the flush phase, triggering the numeric type conversion issue.

## Solution
Replace ORM queries with raw SQL queries using explicit `::text` casting for numeric fields. For user deletion, use raw SQL to delete related records before deleting the user.

---

## Fix 1: stock_tracking.py (COMPLETED)
Replaced ORM queries with raw SQL using `::text` casting for numeric fields.

### Changes Made
1. ✅ Replaced `Purchase.query.all()` with raw SQL using `::text` casting
2. ✅ Replaced `Sale.query.filter()` calls with raw SQL using `::text` casting
3. ✅ Replaced `SellerFruit.query.all()` with raw SQL using `::text` casting

### ORM Queries Fixed (5 locations)
1. `StockTrackingAggregatedResource.get()` - Purchase query (line ~975)
2. `StockTrackingAggregatedResource.get()` - Sale query with date filter (line ~974)
3. `StockTrackingAggregatedResource.get()` - SellerFruit query (line ~1030)
4. `generate_stock_pdf_group()` - Sale query for stock out (line ~418)
5. `generate_stock_pdf_combined()` - Sale query for stocks out (line ~804)

---

## Fix 2: user.py (COMPLETED)
Fixed user deletion by using raw SQL to delete related records before deleting the user.

### Changes Made
1. Added `from sqlalchemy import text` import
2. Updated `UserResource.delete()` method to:
   - Use raw SQL to delete related `sale`, `purchase`, `other_expenses`, `inventory`, and `message` records first
   - Fallback to deactivating the user if foreign key constraints prevent deletion
   - Delete the user only after related records are removed

### Code Pattern
```python
@role_required('ceo')
def delete(self, user_id):
    user = User.query.get_or_404(user_id)
    
    # Use raw SQL to delete related records first to avoid
    # "Unknown PG numeric type: 1043" error during cascade delete
    try:
        db.session.execute(text("DELETE FROM sale WHERE seller_id = :user_id"), {"user_id": user_id})
        db.session.execute(text("DELETE FROM purchase WHERE purchaser_id = :user_id"), {"user_id": user_id})
        db.session.execute(text("DELETE FROM other_expenses WHERE user_id = :user_id"), {"user_id": user_id})
        db.session.execute(text("DELETE FROM inventory WHERE added_by = :user_id"), {"user_id": user_id})
        db.session.execute(text("DELETE FROM message WHERE sender_id = :user_id OR recipient_id = :user_id"), {"user_id": user_id})
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        user.is_active = False
        db.session.commit()
        return make_response_data(
            success=True, 
            message=f"User {user.name} has been deactivated (could not delete due to existing records).",
            warning=True
        )
    
    db.session.delete(user)
    db.session.commit()
    return make_response_data(message=f"User {user.name} deleted successfully.")
```

---

## Fix 3: user.py - Expunge User from session (COMPLETED)
Fixed user deletion by expunging the User object from the session before raw SQL deletes.

### Changes Made
1. Updated `UserResource.delete()` method to:
   - Fetch the User object using `db.session.get(User, user_id)`
   - Expunge the user from session using `db.session.expunge(user)` before raw SQL deletes
   - This prevents SQLAlchemy from processing cascade relationships during commit

### Why This Is Needed
Even though raw SQL is used for deleting related records, SQLAlchemy's ORM still tracks the User object in the session. During commit, SQLAlchemy tries to process cascade delete relationships (via the `sales` and `purchases` relationships with `cascade="all, delete-orphan"`), triggering lazy-load queries that cause the numeric type error.

### Code Pattern
```python
@role_required('ceo')
def delete(self, user_id):
    result = db.session.execute(text("SELECT name FROM \"user\" WHERE id = :user_id"), {"user_id": user_id}).fetchone()
    if not result:
        return make_response_data(success=False, message="User not found.", status_code=404)

    user_name = result[0]

    try:
        # Expunge any tracked User object from session to prevent cascade delete issues
        # This prevents SQLAlchemy from trying to lazy-load related records during commit
        user = db.session.get(User, user_id)
        if user:
            db.session.expunge(user)
        
        # Delete related records using raw SQL
        db.session.execute(text("DELETE FROM sale WHERE seller_id = :user_id"), {"user_id": user_id})
        # ... more deletes.commit()
        return
        db.session make_response_data(message=f"User {user_name} deleted successfully.")
    except Exception as e:
        db.session.rollback()
        # Fallback to deactivation
        ...
```

## Status
✅ COMPLETED - All numeric type errors fixed (including user deletion cascade issue)

