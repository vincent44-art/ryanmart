#!/usr/bin/env python3
import requests
import json

BASE_URL = 'http://localhost:5000'

def test_salary_api():
    # First, login to get token
    login_data = {
        'email': 'dennis@ryanmart.com',  # Assuming this is a test user
        'password': 'password123'
    }

    try:
        # Login
        login_response = requests.post(f'{BASE_URL}/api/auth/login', json=login_data)
        if login_response.status_code != 200:
            print(f"Login failed: {login_response.status_code} - {login_response.text}")
            return

        token = login_response.json().get('access_token')
        headers = {'Authorization': f'Bearer {token}'}

        print("✅ Login successful")

        # Test GET salaries
        salaries_response = requests.get(f'{BASE_URL}/api/salaries', headers=headers)
        print(f"GET /api/salaries: {salaries_response.status_code}")
        if salaries_response.status_code == 200:
            print("✅ Fetch salaries successful")
        else:
            print(f"❌ Fetch salaries failed: {salaries_response.text}")

        # Test POST create salary
        salary_data = {
            'user_id': 1,  # Assuming user ID 1 exists
            'amount': 50000,
            'description': 'Test salary',
            'date': '2024-01-15'
        }

        create_response = requests.post(f'{BASE_URL}/api/salaries', json=salary_data, headers=headers)
        print(f"POST /api/salaries: {create_response.status_code}")
        if create_response.status_code == 201:
            print("✅ Create salary successful")
            salary_id = create_response.json().get('data', {}).get('id')
        else:
            print(f"❌ Create salary failed: {create_response.text}")
            return

        # Test toggle status
        if salary_id:
            toggle_response = requests.post(f'{BASE_URL}/api/salary-payments/{salary_id}/toggle-status', headers=headers)
            print(f"POST /api/salary-payments/{salary_id}/toggle-status: {toggle_response.status_code}")
            if toggle_response.status_code == 200:
                print("✅ Toggle status successful")
            else:
                print(f"❌ Toggle status failed: {toggle_response.text}")

        print("\n🎉 All salary API tests completed!")

    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to server. Make sure backend is running on localhost:5000")
    except Exception as e:
        print(f"❌ Test failed with error: {e}")

if __name__ == '__main__':
    test_salary_api()
