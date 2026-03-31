# Salary Tab Fix - Add User Selection

## Issue
The salaries tab doesn't allow adding a salary record because:
1. The SalaryFormModal doesn't have a user dropdown to select the employee
2. The backend endpoint requires CEO role only

## Fix Plan

### 1. Frontend Fix - SalaryFormModal.jsx ✅
- Add a user dropdown select to choose the employee
- Users are already passed as a prop from SalaryManagementTab

### 2. Backend Fix - user.py ✅
- Change UsersForSalaryResource from @role_required('ceo') to @jwt_required()

## Status
- [x] Add user dropdown to SalaryFormModal.jsx
- [x] Update backend UsersForSalaryResource to allow any authenticated user
