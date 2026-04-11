# TODO: app.py Pylance Syntax Fixes Plan

## Current Issues (from Pylance errors)
- Decorator syntax errors (line 195)
- Indentation problems (lines 195, 1416)
- `return` outside function (line 1412)
- Undefined `jwt` (lines 194,204,213)
- Undefined `app` (multiple lines: 225,228,229,231,310,321,325,338,360,506,513,585,592,819,829,843,898,909,943,950,1067,1074,1155,1165,1169,1185,1200,1212,1230,1241,1252,1263,1284,1296,1306,1317,1329,1340,1354,1386)
- Undefined `allowed_origins` (multiple CORS lines)

## Analysis from code review
- `app` and `allowed_origins` used in global scope before `create_app()` defines `app`.
- Direct route handlers (@app.route) placed after `return app` in `create_app()`, causing indent/scope issues.
- JWT handlers inside `create_app` but references global.
- CORS setup mixed global/local.

## Detailed Fix Plan

### 1. Move Global Code Inside create_app()
**Files: backend/app.py**
- Move all `@app.route`, error handlers, after_request from global to inside `create_app()` before `return app`.
- Define `allowed_origins` at top of `create_app()`.

### 2. Fix Scope Issues
- Pass `app` and `allowed_origins` to direct handlers or make them use `current_app`.
- Remove global `app = create_app()` until end.

### 3. Fix Indentation & Decorators
- Ensure all `@app.route` have proper `def` indented below.
- Fix line 1412 return in direct handler.

### 4. JWT Scope
- Import jwt inside create_app or pass as param.

### Dependent Files: None (single file fix)

### Follow-up Steps
- Test all API endpoints post-fix.
- Run `flask db upgrade` if needed.
- Check no runtime errors: `python backend/app.py`

Confirm this plan before implementing?

