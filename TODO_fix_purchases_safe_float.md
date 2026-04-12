# TODO: Fix purchases.py safe_float NameError

## Plan Steps:
1. [x] Edit `backend/resources/purchases.py`: Add `safe_float` to module-level import from `utils.helpers` and remove redundant local imports.
2. [ ] Test the fix: Run `python test_purchase_api.py` (if applicable) or manual POST to /api/purchases.
3. [ ] Verify: Restart backend if needed, test frontend purchase form, check logs for no NameError.
4. [ ] Complete: Remove this TODO.

Current status: Starting step 1.
