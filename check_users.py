import sqlite3

conn = sqlite3.connect("database.db")
conn.row_factory = sqlite3.Row

users = conn.execute("SELECT * FROM users").fetchall()

for user in users:
    print(dict(user))

conn.close()
