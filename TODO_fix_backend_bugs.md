# Fix Backend Bugs - 500 Errors

## Issues Fixed
- [x] Added missing `from sqlalchemy import text` import in `backend/resources/purchases.py`
- [x] Changed model columns from Float to String in `backend/models/purchases.py`:
  - quantity: Float -> String(50)
  - cost: Float -> String(50)
  - amount_per_kg: Float -> String(50)

## Next Steps
- [ ] Test the fixes by running the backend and making API calls
- [ ] Verify that GET /api/purchases/by-email works without "name 'text' is not defined" error
- [ ] Verify that POST /api/purchases works without "Unknown PG numeric type: 1043" error
- [ ] If issues persist, may need to create a database migration to alter column types
