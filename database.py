import sqlite3
from flask import g

DATABASE = 'database.db'

def getDb():
    if 'db' not in g:
        g.db = sqlite3.connect(DATABASE)
        g.db.row_factory = sqlite3.Row
    return g.db

def closeDb(exception=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()

def initDb(app):
    with app.app_context():
        db = getDb()
        db.execute("""CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL, password TEXT NOT NULL, avatar TEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)""")
        db.execute("""CREATE TABLE IF NOT EXISTS uploads (id INTEGER PRIMARY KEY AUTOINCREMENT, author TEXT NOT NULL, setid TEXT NOT NULL, image TEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)""")
        db.commit()