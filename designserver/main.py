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


designs = []


@api.get("/")
async def index():
    return {"message":"up and running"}


@api.get("/designs")
async def getDesigns():
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
    state_snapshot.id = id
    designs.append({"id":id, "state_snapshot": state_snapshot})
    return {"id":id, "state_snapshot": state_snapshot}


@api.get("/designs/{id}")
async def getDesign(id:str):
    print(id)
    
    for design in designs:
        if design['id'] == id:
            return design
    
    raise HTTPException(status_code=404, detail="Item not found")


@api.delete("/designs/{id}")
async def deleteDesign(id:str):
    delIndex = -1
    for i in range(len(designs)):
        if designs[i]['id'] == id:
            delIndex = i
    
    if delIndex != -1:
        designs.pop(delIndex)
    raise HTTPException(status_code=404, detail="Item not found")


app = socketio.ASGIApp(sio, other_asgi_app=api)


