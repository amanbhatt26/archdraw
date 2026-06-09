import psycopg2
import socketio
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import gzip
import json
from urllib.parse import parse_qs
import shortuuid
from models import StateSnapshot


sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins=[
    "http://localhost:5173"
])
api = FastAPI()
api.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173"])

# placeholder
conn = psycopg2.connect("dbname=archdraw user=postgres host=localhost")
cur = conn.cursor()


connected_clients = set()
doc_subscribers = dict()

@sio.event
async def connect(sid, environ):
    query = environ["QUERY_STRING"]
    documentId = parse_qs(query)['documentId'][0]
    print("connected", sid, "docid", documentId)
    connected_clients.add(sid)
    if documentId not in doc_subscribers.keys():
        doc_subscribers[documentId] = set()
    doc_subscribers[documentId].add(sid)

@sio.event
async def disconnect(sid, environ):
    print("disconnected", sid)
    connected_clients.remove(sid)

    for doc in doc_subscribers.keys():
        if sid in doc_subscribers[doc]:
            doc_subscribers[doc].remove(sid)
    
    for doc in list(doc_subscribers.keys()):
        if len(doc_subscribers[doc])==0:
            doc_subscribers.pop(doc)


@sio.event
async def snapshot(sid, data):
    print(len(data))
    json_string = gzip.decompress(data)
    state_snapshot = json.loads(json_string)
    documentId = state_snapshot['id']

    for subscriber in doc_subscribers[documentId]:
        if subscriber == sid:
            continue
        await sio.emit("snapshot",data, to=subscriber)


@api.get("/")
async def index():
    return {"message":"up and running"}


@api.get("/designs")
async def getDesigns():
    cur.execute("SELECT * FROM documents")
    designs_compressed = cur.fetchall()
    designs = [
        {"id":id, "state_snapshot":json.loads(str(gzip.decompress(state_snapshot), encoding="utf8"))} 
        for (id, state_snapshot) in designs_compressed 
        ]
    return {"designs":designs}


@api.post("/designs")
async def postDesign():
    id = shortuuid.uuid() 
    state_snapshot = StateSnapshot(
        id=id,
        nodes={},
        edges={},
        node_posx={},
        node_posy={},
        node_label={}
    )

    state_bytes_uncompressed = bytes(state_snapshot.model_dump_json(), encoding="utf8")
    state_bytes_compressed = gzip.compress(state_bytes_uncompressed)

    cur.execute(
        """
        INSERT INTO documents (id, state)
        VALUES (%s, %s)
        """,
        (id, state_bytes_compressed)
    )

    conn.commit()
    

    return {"id":id, "state_snapshot": state_snapshot}


@api.get("/designs/{id}")
async def getDesign(id:str):
    
    cur.execute(
        """
        SELECT * FROM documents WHERE id=%s
        """,
        (id,)
    )

    design = cur.fetchone()

    if design is None:
        raise HTTPException(status_code=404, detail=f"Design with id={id} not found.")
    
    state_snapshot = json.loads(str(gzip.decompress(design[1]), encoding="utf8"))
    return {"id":id, "state_snapshot":state_snapshot}


@api.delete("/designs/{id}")
async def deleteDesign(id:str):

    cur.execute(
        """
        DELETE FROM documents
        WHERE id=%s
        """,
        (id,)
    )

    if cur.rowcount == 0:
        raise HTTPException(status_code=404, detail="Item not found")

    return {"message":"successfully deleted design"}


app = socketio.ASGIApp(sio, other_asgi_app=api)


