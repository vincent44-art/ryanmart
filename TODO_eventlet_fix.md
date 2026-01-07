# Eventlet Monkey Patching Fix Plan

## Issues Identified
1. **Eventlet monkey patching error**: `eventlet.monkey_patch()` needs to be called BEFORE any other imports
2. **Flask extensions outside app context**: `jwt`, `migrate`, and `socketio` are initialized at module level before app context exists
3. **Port 5000 conflict**: Another program is using port 5000

## Fix Plan
- [x] 1. Move `eventlet.monkey_patch()` to be the FIRST line (before ANY imports)
- [x] 2. Move `jwt`, `migrate`, and `socketio` initializations inside the `create_app()` function
- [x] 3. Kill the process on port 5000

