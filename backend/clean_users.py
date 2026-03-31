"""
Clean users script: Keep only dennisceo@ryanmart.com with password 'delete', delete all others.
"""
import os
import sys
import sqlite3
from werkzeug.security import generate_password_hash

def clean_users():
    # DB path relative to backend/
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'instance', 'fruittrack.db')
    
    print(f"Connecting to DB: {db_path}")
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Count users before
    cursor.execute('SELECT COUNT(*) FROM "user"')
    before_count = cursor.fetchone()[0]
    print(f"Users before cleanup: {before_count}")
    
    cursor.execute('SELECT email FROM "user"')
    all_users = cursor.fetchall()
    print("All users before:")
    for email in all_users:
        print(f"  - {email[0]}")
    
    # Delete all except target
    target_email = 'dennisceo@ryanmart.com'
    cursor.execute('DELETE FROM "user" WHERE email != ?', (target_email,))
    deleted_count = cursor.rowcount
    print(f"Deleted {deleted_count} other users.")
    
    # Update target user password
    new_password = 'delete'
    new_hash = generate_password_hash(new_password)
    cursor.execute("""
        UPDATE "user" 
        SET password_hash = ?, is_first_login = 0 
        WHERE email = ?
    """, (new_hash, target_email))
    updated_count = cursor.rowcount
    if updated_count > 0:
        print(f"✅ Updated password for {target_email} to '{new_password}'")
        cursor.execute('SELECT name, role FROM "user" WHERE email = ?', (target_email,))
        details = cursor.fetchone()
        if details:
            print(f"  Name: {details[0]}, Role: {details[1]}")
    else:
        print(f"❌ Target user {target_email} not found!")
        conn.rollback()
        conn.close()
        return
    
    # Count after
    cursor.execute('SELECT COUNT(*) FROM "user"')
    after_count = cursor.fetchone()[0]
    print(f"Users after cleanup: {after_count} (should be 1)")
    
    conn.commit()
    conn.close()
    print("\n✅ Cleanup complete! Only dennisceo@ryanmart.com remains with password 'delete'.")

if __name__ == '__main__':
    clean_users()

