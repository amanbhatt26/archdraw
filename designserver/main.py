import socketio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import gzip
import json
from urllib.parse import parse_qs


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

    


@api.get("/")
async def index():
    return {"message":"up and running"}

app = socketio.ASGIApp(sio, other_asgi_app=api)


