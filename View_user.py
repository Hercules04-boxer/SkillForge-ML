import sqlite3

# Connect to database using context manager
with sqlite3.connect("database.db") as conn:
    conn.row_factory = sqlite3.Row  # Access columns by name
    cursor = conn.cursor()

    # Fetch all users
    cursor.execute("SELECT * FROM users")
    users = cursor.fetchall()

    if users:
        print("ID | Name | Phone | Email | Password | Background")
        print("-" * 60)
        for user in users:
            print(f"{user['id']} | {user['name']} | {user['phone'] or '-'} | {user['email']} | {user['password']} | {user['background']}")
    else:
        print("No users found in the database.")