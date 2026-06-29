from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect, Header
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import Optional
import aiosqlite, json, os
from dotenv import load_dotenv

load_dotenv()

from database import init_db, get_db, DB_PATH
from auth import hash_password, verify_password, create_token, decode_token
from ws_manager import manager

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(lifespan=lifespan)

CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(CORSMiddleware, allow_origins=CORS_ORIGINS, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# ─── Auth dependency ───────────────────────────────────────────────────────────
async def current_user_id(authorization: Optional[str] = Header(None)) -> int:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Not authenticated")
    try:
        return decode_token(authorization.split(" ")[1])
    except Exception:
        raise HTTPException(401, "Invalid token")

# ─── AUTH ──────────────────────────────────────────────────────────────────────
@app.post("/api/auth/register")
async def register(body: dict, db: aiosqlite.Connection = Depends(get_db)):
    try:
        await db.execute(
            "INSERT INTO users (username,phone_number,display_name,password_hash) VALUES (?,?,?,?)",
            (body["username"], body["phone_number"], body["display_name"], hash_password(body["password"]))
        )
        await db.commit()
        async with db.execute("SELECT * FROM users WHERE username=?", (body["username"],)) as cur:
            user = dict(await cur.fetchone())
        user.pop("password_hash", None)
        return {"user": user, "token": create_token(user["id"])}
    except aiosqlite.IntegrityError:
        raise HTTPException(400, "Username or phone already exists")

@app.post("/api/auth/login")
async def login(body: dict, db: aiosqlite.Connection = Depends(get_db)):
    async with db.execute(
        "SELECT * FROM users WHERE username=? OR phone_number=?",
        (body["username"], body["username"])
    ) as cur:
        row = await cur.fetchone()
    if not row or not verify_password(body["password"], row["password_hash"]):
        raise HTTPException(401, "Invalid credentials")
    user = dict(row)
    user.pop("password_hash", None)
    return {"user": user, "token": create_token(user["id"])}

@app.get("/api/auth/me")
async def me(uid: int = Depends(current_user_id), db: aiosqlite.Connection = Depends(get_db)):
    async with db.execute("SELECT id,username,phone_number,display_name,avatar_url,online_status,last_seen FROM users WHERE id=?", (uid,)) as cur:
        row = await cur.fetchone()
    if not row:
        raise HTTPException(404)
    return dict(row)

# ─── USERS ─────────────────────────────────────────────────────────────────────
@app.get("/api/users")
async def list_users(db: aiosqlite.Connection = Depends(get_db), uid: int = Depends(current_user_id)):
    async with db.execute("SELECT id,username,display_name,avatar_url,online_status,last_seen FROM users WHERE id!=?", (uid,)) as cur:
        return [dict(r) for r in await cur.fetchall()]

@app.get("/api/users/{user_id}")
async def get_user(user_id: int, db: aiosqlite.Connection = Depends(get_db), uid: int = Depends(current_user_id)):
    async with db.execute("SELECT id,username,display_name,avatar_url,online_status,last_seen,phone_number FROM users WHERE id=?", (user_id,)) as cur:
        row = await cur.fetchone()
    if not row:
        raise HTTPException(404)
    return dict(row)

@app.put("/api/users/{user_id}")
async def update_user(user_id: int, body: dict, uid: int = Depends(current_user_id), db: aiosqlite.Connection = Depends(get_db)):
    if uid != user_id:
        raise HTTPException(403)
    fields = {k: v for k, v in body.items() if k in ("display_name", "avatar_url", "phone_number")}
    if not fields:
        raise HTTPException(400, "Nothing to update")
    set_clause = ", ".join(f"{k}=?" for k in fields)
    await db.execute(f"UPDATE users SET {set_clause} WHERE id=?", (*fields.values(), user_id))
    await db.commit()
    return {"ok": True}

# ─── CONTACTS ──────────────────────────────────────────────────────────────────
@app.get("/api/contacts")
async def get_contacts(uid: int = Depends(current_user_id), db: aiosqlite.Connection = Depends(get_db)):
    async with db.execute("""
        SELECT u.id,u.username,u.display_name,u.avatar_url,u.online_status,u.last_seen
        FROM contacts c JOIN users u ON c.contact_user_id=u.id
        WHERE c.user_id=?
    """, (uid,)) as cur:
        return [dict(r) for r in await cur.fetchall()]

@app.post("/api/contacts")
async def add_contact(body: dict, uid: int = Depends(current_user_id), db: aiosqlite.Connection = Depends(get_db)):
    await db.execute("INSERT OR IGNORE INTO contacts (user_id,contact_user_id) VALUES (?,?)", (uid, body["contact_user_id"]))
    await db.commit()
    return {"ok": True}

# ─── CONVERSATIONS ──────────────────────────────────────────────────────────────
@app.get("/api/conversations")
async def get_conversations(uid: int = Depends(current_user_id), db: aiosqlite.Connection = Depends(get_db)):
    async with db.execute("""
        SELECT c.*, m.content as last_message, m.created_at as last_message_at, m.sender_id as last_sender_id
        FROM conversations c
        JOIN conversation_members cm ON c.id=cm.conversation_id AND cm.user_id=?
        LEFT JOIN messages m ON m.id=(SELECT id FROM messages WHERE conversation_id=c.id ORDER BY created_at DESC LIMIT 1)
        ORDER BY COALESCE(m.created_at, c.created_at) DESC
    """, (uid,)) as cur:
        convs = [dict(r) for r in await cur.fetchall()]

    # Attach members for each conversation
    for conv in convs:
        async with db.execute("""
            SELECT u.id,u.username,u.display_name,u.avatar_url,u.online_status,cm.is_admin
            FROM conversation_members cm JOIN users u ON cm.user_id=u.id
            WHERE cm.conversation_id=?
        """, (conv["id"],)) as cur:
            conv["members"] = [dict(r) for r in await cur.fetchall()]

        # Unread count
        async with db.execute("""
            SELECT COUNT(*) as cnt FROM messages
            WHERE conversation_id=? AND sender_id!=? AND status!='read'
        """, (conv["id"], uid)) as cur:
            row = await cur.fetchone()
            conv["unread_count"] = row["cnt"] if row else 0

    return convs

@app.post("/api/conversations")
async def create_conversation(body: dict, uid: int = Depends(current_user_id), db: aiosqlite.Connection = Depends(get_db)):
    conv_type = body.get("type", "direct")
    if conv_type == "direct":
        other_id = body["user_id"]
        # Check if already exists
        async with db.execute("""
            SELECT c.id FROM conversations c
            JOIN conversation_members cm1 ON cm1.conversation_id=c.id AND cm1.user_id=?
            JOIN conversation_members cm2 ON cm2.conversation_id=c.id AND cm2.user_id=?
            WHERE c.type='direct'
        """, (uid, other_id)) as cur:
            existing = await cur.fetchone()
        if existing:
            return {"id": existing["id"], "type": "direct"}
        cur = await db.execute("INSERT INTO conversations (type,creator_id) VALUES ('direct',?)", (uid,))
        conv_id = cur.lastrowid
        await db.execute("INSERT INTO conversation_members (conversation_id,user_id,is_admin) VALUES (?,?,1)", (conv_id, uid))
        await db.execute("INSERT INTO conversation_members (conversation_id,user_id) VALUES (?,?)", (conv_id, other_id))
    else:
        cur = await db.execute("INSERT INTO conversations (type,group_name,creator_id) VALUES ('group',?,?)", (body["name"], uid))
        conv_id = cur.lastrowid
        member_ids = list(set([uid] + body.get("member_ids", [])))
        for mid in member_ids:
            is_admin = 1 if mid == uid else 0
            await db.execute("INSERT INTO conversation_members (conversation_id,user_id,is_admin) VALUES (?,?,?)", (conv_id, mid, is_admin))
        await db.execute("INSERT INTO messages (conversation_id,sender_id,content,status) VALUES (?,?,?,?)",
            (conv_id, uid, f"Group '{body['name']}' was created", "read"))
    await db.commit()
    return {"id": conv_id, "type": conv_type}

@app.get("/api/conversations/{conv_id}")
async def get_conversation(conv_id: int, uid: int = Depends(current_user_id), db: aiosqlite.Connection = Depends(get_db)):
    async with db.execute("SELECT * FROM conversations WHERE id=?", (conv_id,)) as cur:
        row = await cur.fetchone()
    if not row:
        raise HTTPException(404)
    conv = dict(row)
    async with db.execute("""
        SELECT u.id,u.username,u.display_name,u.avatar_url,u.online_status,cm.is_admin
        FROM conversation_members cm JOIN users u ON cm.user_id=u.id
        WHERE cm.conversation_id=?
    """, (conv_id,)) as cur:
        conv["members"] = [dict(r) for r in await cur.fetchall()]
    return conv

@app.put("/api/conversations/{conv_id}")
async def update_conversation(conv_id: int, body: dict, uid: int = Depends(current_user_id), db: aiosqlite.Connection = Depends(get_db)):
    fields = {k: v for k, v in body.items() if k in ("group_name", "group_avatar")}
    set_clause = ", ".join(f"{k}=?" for k in fields)
    await db.execute(f"UPDATE conversations SET {set_clause} WHERE id=?", (*fields.values(), conv_id))
    await db.commit()
    return {"ok": True}

@app.delete("/api/conversations/{conv_id}")
async def delete_conversation(conv_id: int, uid: int = Depends(current_user_id), db: aiosqlite.Connection = Depends(get_db)):
    await db.execute("DELETE FROM conversation_members WHERE conversation_id=? AND user_id=?", (conv_id, uid))
    await db.commit()
    return {"ok": True}

# ─── MESSAGES ──────────────────────────────────────────────────────────────────
@app.get("/api/conversations/{conv_id}/messages")
async def get_messages(conv_id: int, limit: int = 50, offset: int = 0, uid: int = Depends(current_user_id), db: aiosqlite.Connection = Depends(get_db)):
    async with db.execute("""
        SELECT m.*, u.display_name as sender_name, u.avatar_url as sender_avatar
        FROM messages m JOIN users u ON m.sender_id=u.id
        WHERE m.conversation_id=?
        ORDER BY m.created_at ASC
        LIMIT ? OFFSET ?
    """, (conv_id, limit, offset)) as cur:
        return [dict(r) for r in await cur.fetchall()]

@app.post("/api/conversations/{conv_id}/messages")
async def send_message(conv_id: int, body: dict, uid: int = Depends(current_user_id), db: aiosqlite.Connection = Depends(get_db)):
    cur = await db.execute(
        "INSERT INTO messages (conversation_id,sender_id,content,status) VALUES (?,?,?,'sent')",
        (conv_id, uid, body["content"])
    )
    msg_id = cur.lastrowid
    await db.execute("UPDATE conversations SET updated_at=CURRENT_TIMESTAMP WHERE id=?", (conv_id,))
    await db.commit()

    async with db.execute("""
        SELECT m.*, u.display_name as sender_name, u.avatar_url as sender_avatar
        FROM messages m JOIN users u ON m.sender_id=u.id WHERE m.id=?
    """, (msg_id,)) as cur:
        msg = dict(await cur.fetchone())

    # Broadcast via WebSocket — include sender_id so the frontend can skip self-echoes
    await manager.broadcast(conv_id, {"type": "new_message", "message": msg, "sender_id": uid})
    # Notify delivered status for non-sender members
    await manager.broadcast(conv_id, {"type": "message_status", "message_id": msg_id, "status": "delivered"})
    return msg

@app.post("/api/messages/{msg_id}/read")
async def mark_read(msg_id: int, uid: int = Depends(current_user_id), db: aiosqlite.Connection = Depends(get_db)):
    await db.execute("INSERT OR IGNORE INTO read_receipts (message_id,user_id) VALUES (?,?)", (msg_id, uid))
    await db.execute("UPDATE messages SET status='read' WHERE id=?", (msg_id,))
    await db.commit()
    async with db.execute("SELECT conversation_id FROM messages WHERE id=?", (msg_id,)) as cur:
        row = await cur.fetchone()
    if row:
        await manager.broadcast(row["conversation_id"], {"type": "message_status", "message_id": msg_id, "status": "read"})
    return {"ok": True}

@app.delete("/api/messages/{msg_id}")
async def delete_message(msg_id: int, uid: int = Depends(current_user_id), db: aiosqlite.Connection = Depends(get_db)):
    await db.execute("DELETE FROM messages WHERE id=? AND sender_id=?", (msg_id, uid))
    await db.commit()
    return {"ok": True}

# ─── GROUP MEMBERS ─────────────────────────────────────────────────────────────
@app.post("/api/conversations/{conv_id}/members")
async def add_member(conv_id: int, body: dict, uid: int = Depends(current_user_id), db: aiosqlite.Connection = Depends(get_db)):
    await db.execute("INSERT OR IGNORE INTO conversation_members (conversation_id,user_id) VALUES (?,?)", (conv_id, body["user_id"]))
    await db.commit()
    return {"ok": True}

@app.delete("/api/conversations/{conv_id}/members/{user_id}")
async def remove_member(conv_id: int, user_id: int, uid: int = Depends(current_user_id), db: aiosqlite.Connection = Depends(get_db)):
    # Check caller is admin
    async with db.execute("SELECT is_admin FROM conversation_members WHERE conversation_id=? AND user_id=?", (conv_id, uid)) as cur:
        row = await cur.fetchone()
    if not row or not row["is_admin"]:
        raise HTTPException(403, "Not admin")
    await db.execute("DELETE FROM conversation_members WHERE conversation_id=? AND user_id=?", (conv_id, user_id))
    await db.commit()
    return {"ok": True}

# ─── WEBSOCKET ─────────────────────────────────────────────────────────────────
@app.websocket("/ws/{conv_id}/{user_id}")
async def websocket_endpoint(websocket: WebSocket, conv_id: int, user_id: int):
    await manager.connect(websocket, conv_id, user_id)
    # Notify others: user online
    await manager.broadcast(conv_id, {"type": "user_online", "user_id": user_id}, exclude_ws=websocket)
    try:
        while True:
            raw = await websocket.receive_text()
            data = json.loads(raw)
            event = data.get("type")
            if event == "typing_start":
                await manager.broadcast(conv_id, {"type": "user_typing", "user_id": user_id, "conversation_id": conv_id}, exclude_ws=websocket)
            elif event == "typing_stop":
                await manager.broadcast(conv_id, {"type": "user_stopped_typing", "user_id": user_id, "conversation_id": conv_id}, exclude_ws=websocket)
    except WebSocketDisconnect:
        manager.disconnect(websocket, conv_id)
        await manager.broadcast(conv_id, {"type": "user_offline", "user_id": user_id})
