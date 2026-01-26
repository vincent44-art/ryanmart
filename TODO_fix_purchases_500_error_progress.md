# Purchase API 500 Error Fix - Progress Tracker

## Tasks Completed
- [ ] Task 1: Update `backend/models/purchases.py` with proper model definition
- [ ] Task 2: Update `backend/resources/purchases.py` to import from models.purchases
- [ ] Task 3: Test the fix

## Status: In Progress

## Current Issue
The Purchase model is defined in the wrong file with problematic relative imports causing 500 errors.

## Fix Implementation
1. Move Purchase model to `backend/models/purchases.py`
2. Update imports in `backend/resources/purchases.py`

