import psycopg2
import socketio
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import gzip
import json
from urllib.parse import parse_qs
import shortuuid
from models import StateSnapshot, SharedDocInput
from core.document import SharedDocument


sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins=[
    "http://localhost:5173"
])
api = FastAPI(root_path="/api/v1")
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
    
    json_string = gzip.decompress(data)
    state_snapshot = json.loads(json_string)
    documentId = state_snapshot['id']

    cur.execute(
        """
        SELECT state from documents where id=%s
        """,
        (documentId, )
    )

    (db_state) = cur.fetchone()

    if db_state is None:
        await sio.emit("error", f"documentId {documentId} not found", to=sid)
        return
    
    db_state_json = json.loads(str(gzip.decompress(db_state[0]), encoding='utf8'))
    shared_doc = SharedDocument(documentId)
    shared_doc.merge_state_snapshot(db_state_json)
    shared_doc.merge_state_snapshot(state_snapshot)

    db_state_compressed = gzip.compress(bytes(json.dumps(shared_doc.state_snapshot()), encoding="utf8"))
    
    cur.execute(
        """
        UPDATE documents SET state=%s WHERE id=%s
        """,
        (db_state_compressed, documentId)
    )
    conn.commit()

    for subscriber in doc_subscribers[documentId]:
        if subscriber == sid:
            continue
        await sio.emit("snapshot",data, to=subscriber)


@api.get("/health")
async def index():
    return {"message":"up and running"}


@api.get("/designs")
async def getDesigns():
    cur.execute("SELECT id,name FROM documents")
    designs_compressed = cur.fetchall()
    
    designs = [
        {"id":id, "name":name,} 
        for (id, name) in designs_compressed 
        ]
    return {"designs":designs}


@api.post("/designs")
async def postDesign(sharedDocInput:SharedDocInput):
    id = shortuuid.uuid() 
    name = sharedDocInput.name
    state_snapshot = dict({
            "id":id,
            "nodes":{"added":[], "removed":[]},
            "edges":{"added":[], "removed":[]},
            "node_posx":{},
            "node_posy":{},
            "node_label":{}
        }
    )

    state_bytes_uncompressed = bytes(json.dumps(state_snapshot), encoding="utf8")
    state_bytes_compressed = gzip.compress(state_bytes_uncompressed)

    cur.execute(
        """
        INSERT INTO documents (id, name, state)
        VALUES (%s, %s, %s)
        """,
        (id, name, state_bytes_compressed)
    )

    conn.commit()
    

    return {"id":id, "name": name, "state_snapshot": state_snapshot}

@api.patch("/designs/{id}")
async def patchDesign(id:str, sharedDocInput:SharedDocInput):
    print(sharedDocInput)
  
    cur.execute(
        """
        UPDATE documents SET name=%s WHERE id=%s
        """,
        (sharedDocInput.name, id)
    )
    conn.commit()

    if cur.rowcount == 0:
        raise HTTPException(status_code=404, detail="Item not found")

    return {"message":"document updated"}


@api.get("/designs/{id}")
async def getDesign(id:str):
    
    cur.execute(
        """
        SELECT id,name,state FROM documents WHERE id=%s
        """,
        (id,)
    )

    design = cur.fetchone()

    if design is None:
        raise HTTPException(status_code=404, detail=f"Design with id={id} not found.")
    
    (id, name, state_snapshot) = design
    state_snapshot = json.loads(str(gzip.decompress(state_snapshot), encoding="utf8"))
    return {"id":id, "name":name, "state_snapshot":state_snapshot}


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


