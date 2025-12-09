import sqlite3
import os

def delete_demo_users():
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'instance', 'fruittrack.db')

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Delete user with email ceo@fruittrack.com
        cursor.execute("DELETE FROM user WHERE email = ?", ('ceo@fruittrack.com',))
        deleted_count = cursor.rowcount
        print(f"Deleted {deleted_count} user(s) with email ceo@fruittrack.com")

        # Delete user with email ceo@company.com if exists
        cursor.execute("DELETE FROM user WHERE email = ?", ('ceo@company.com',))
        deleted_count2 = cursor.rowcount
        print(f"Deleted {deleted_count2} user(s) with email ceo@company.com")

        conn.commit()
        conn.close()
        print("Demo users deleted successfully.")
    except Exception as e:
        print(f"Failed to delete demo users: {str(e)}")

if __name__ == '__main__':
    delete_demo_users()
