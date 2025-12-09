import sqlite3
import os

def clear_all_data():
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'instance', 'fruittrack.db')

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        # Get all table names
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [row[0] for row in cursor.fetchall()]
        # Exclude sqlite internal tables and user table
        tables = [t for t in tables if not t.startswith('sqlite_') and t != 'user']
        print(f"Tables found: {tables}")
        for table in tables:
            cursor.execute(f"DELETE FROM {table}")
        conn.commit()
        conn.close()
        print("All data cleared from the database successfully.")
    except Exception as e:
        print(f"Failed to clear all data: {str(e)}")

if __name__ == '__main__':
    clear_all_data()
