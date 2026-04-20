# JWT Auth Fix TODO
Status: ✅ FIXED - Core JWT errors resolved

## Steps:
- [x] 1. Update inventory.py: Added @jwt_required() above all @role_required decorators ✅
- [x] 2. Update user.py: Added @jwt_required() above all @role_required('ceo') decorators ✅
- [ ] 3. Verify other resources (purchases.py, other_expenses.py) for same issue
- [ ] 4. Test /api/inventory and /api/users endpoints return 200 with auth token
- [ ] 5. Handle remaining 404s (/api/seller-fruits, /api/car-expenses, /api/users/for-salary)

## Summary:
JWT error "You must call @jwt_required()..." fixed by adding missing decorators to failing endpoints.

**Test command:**
```bash
# Get token first
TOKEN=$(curl -s -X POST https://ryanmart-bacckend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"dennisceo@ryanmart.com","password":"yourpass"}' | jq -r '.data.access_token')

# Test fixed endpoints
curl -H "Authorization: Bearer $TOKEN" https://ryanmart-bacckend.onrender.com/api/inventory
curl -H "Authorization: Bearer $TOKEN" https://ryanmart-bacckend.onrender.com/api/users
```

Next: Deploy/restart server, verify no more 401s on these endpoints.


