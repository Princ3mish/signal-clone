import asyncio
import aiosqlite
import bcrypt
from database import DB_PATH, init_db

def hash_pw(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

USERS = [
    (1, "alice",   "+1234567890", "Alice",   None, hash_pw("password123")),
    (2, "bob",     "+1234567891", "Bob",     None, hash_pw("password123")),
    (3, "charlie", "+1234567892", "Charlie", None, hash_pw("password123")),
    (4, "diana",   "+1234567893", "Diana",   None, hash_pw("password123")),
]

async def seed():
    # Make sure tables exist first
    await init_db()

    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row

        # Users
        await db.executemany(
            "INSERT OR IGNORE INTO users (id,username,phone_number,display_name,avatar_url,password_hash) VALUES (?,?,?,?,?,?)",
            USERS,
        )

        # Contacts: everyone knows everyone
        pairs = [(u, v) for u in range(1, 5) for v in range(1, 5) if u != v]
        await db.executemany(
            "INSERT OR IGNORE INTO contacts (user_id,contact_user_id) VALUES (?,?)", pairs
        )

        # Conversations
        await db.execute("INSERT OR IGNORE INTO conversations (id,type,creator_id) VALUES (1,'direct',1)")
        await db.execute("INSERT OR IGNORE INTO conversations (id,type,creator_id) VALUES (2,'direct',1)")
        await db.execute("INSERT OR IGNORE INTO conversations (id,type,creator_id) VALUES (3,'direct',2)")
        await db.execute("INSERT OR IGNORE INTO conversations (id,type,group_name,creator_id) VALUES (4,'group','Team Chat',1)")

        # Members
        for m in [(1,1),(1,2),(2,1),(2,3),(3,2),(3,4),(4,1),(4,2),(4,3),(4,4)]:
            await db.execute(
                "INSERT OR IGNORE INTO conversation_members (conversation_id,user_id,is_admin) VALUES (?,?,0)", m
            )
        await db.execute("UPDATE conversation_members SET is_admin=1 WHERE conversation_id=4 AND user_id=1")

        # Messages
        msgs = [
            (1, 1, "Hey Bob! How's it going?", "read"),
            (1, 2, "All good Alice! You?", "read"),
            (1, 1, "Great! Want to sync up tomorrow?", "read"),
            (1, 2, "Sure, morning works for me", "read"),
            (1, 1, "Perfect, 10am?", "read"),
            (1, 2, "See you then! 👍", "read"),
            (2, 1, "Charlie, did you check the PR?", "read"),
            (2, 3, "Yes! Left some comments", "read"),
            (2, 1, "Thanks, will review tonight", "read"),
            (3, 2, "Diana, the meeting is rescheduled", "read"),
            (3, 4, "Got it, thanks for letting me know", "read"),
            (4, 1, "Team, project kickoff is Monday", "read"),
            (4, 2, "I'll be there!", "read"),
            (4, 3, "Same here 🚀", "read"),
            (4, 4, "Looking forward to it", "read"),
            (4, 1, "Alice please prep the slides", "read"),
            (4, 2, "Need any help?", "read"),
            (4, 3, "I can help with the design part", "read"),
            (4, 4, "Let us know what you need", "read"),
            (4, 1, "Thanks everyone! Will share by Sunday", "read"),
        ]
        await db.executemany(
            "INSERT OR IGNORE INTO messages (conversation_id,sender_id,content,status) VALUES (?,?,?,?)",
            msgs,
        )
        await db.commit()
        print("Seed complete!")

asyncio.run(seed())
