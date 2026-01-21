#!/usr/bin/env python3
"""
Test script to verify purchase API endpoints are working correctly.
This helps diagnose the "Expected JSON but got HTML" error for purchases.
"""
import os
import sys

# Ensure backend is importable
backend_root = os.path.dirname(os.path.abspath(__file__))
if backend_root not in sys.path:
    sys.path.insert(0, backend_root)

def test_purchase_routes():
    """Test that purchase API routes are properly registered."""
    from backend.app import create_app

    app = create_app()
    with app.test_client() as client:
        print("=" * 60)
        print("Testing Purchase API Routes")
        print("=" * 60)

        # Test 1: Health check
        print("\n1. Testing /api/health...")
        resp = client.get('/api/health')
        print(f"   Status: {resp.status_code}")
        print(f"   Content-Type: {resp.content_type}")
        if resp.content_type == 'application/json':
            print("   ✅ Returns JSON!")
            print(f"   Response: {resp.get_json()}")
        else:
            print("   ❌ Returns HTML instead of JSON!")
            print(f"   First 200 chars: {resp.data[:200]}")

        # Test 2: Debug routes
        print("\n2. Testing /api/_debug/routes...")
        resp = client.get('/api/_debug/routes')
        print(f"   Status: {resp.status_code}")
        if resp.content_type == 'application/json':
            data = resp.get_json()
            print(f"   ✅ Returns JSON!")
            print(f"   Total routes: {data.get('total', 0)}")
            # Check if purchase routes exist
            routes = [r['path'] for r in data.get('routes', [])]
            purchase_routes = [r for r in routes if 'purchases' in r]
            if purchase_routes:
                print(f"   ✅ Purchase routes found: {purchase_routes}")
            else:
                print("   ❌ No purchase routes found!")
        else:
            print("   ❌ Returns HTML instead of JSON!")

        # Test 3: Purchase by email endpoint (requires auth - should return 401)
        print("\n3. Testing /api/purchases/by-email/test@example.com (no auth - should return 401)...")
        resp = client.get('/api/purchases/by-email/test@example.com')
        print(f"   Status: {resp.status_code}")
        print(f"   Content-Type: {resp.content_type}")
        if resp.content_type == 'application/json':
            print("   ✅ Returns JSON (expected 401 for unauthorized)!")
            print(f"   Response: {resp.get_json()}")
        else:
            print("   ❌ Returns HTML instead of JSON!")
            print(f"   First 200 chars: {resp.data[:200]}")

        # Test 4: Main purchases endpoint (requires auth - should return 401)
        print("\n4. Testing /api/purchases (no auth - should return 401)...")
        resp = client.get('/api/purchases')
        print(f"   Status: {resp.status_code}")
        print(f"   Content-Type: {resp.content_type}")
        if resp.content_type == 'application/json':
            print("   ✅ Returns JSON (expected 401 for unauthorized)!")
            print(f"   Response: {resp.get_json()}")
        else:
            print("   ❌ Returns HTML instead of JSON!")
            print(f"   First 200 chars: {resp.data[:200]}")

        print("\n" + "=" * 60)
        print("Summary")
        print("=" * 60)
        print("If any test shows HTML instead of JSON, there's a route registration issue.")
        print("Check that:")
        print("  1. Frontend build exists at frontend/build/")
        print("  2. API routes are properly registered")
        print("  3. CORS headers are set correctly")
        print("  4. PurchaseByEmailResource is properly imported and registered")

if __name__ == '__main__':
    test_purchase_routes()
