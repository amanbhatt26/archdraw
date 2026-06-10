import type { SharedDocument } from "./document";
import {io, Socket} from "socket.io-client";
import pako from "pako";

export class SyncManager {

    doc:SharedDocument
    private debounceTimer?: number;
    private syncInProgress = false;
    private socket:Socket;

    constructor(doc:SharedDocument){
        this.doc = doc;
        this.doc.subscribe(()=>{
            this.onDocumentChanged();
        });

        this.socket = io("http://localhost:8000", {
            query: {
                documentId: this.doc.id
            }
        })
        this.registerSocketHandlers()
        setInterval(()=>{
            this.timedFlush();
        }, 10000);
    }

    registerSocketHandlers(){
        this.socket.on("connect", ()=>{
            console.log("Socket connected")
        })

        this.socket.on("disconnect", ()=>{
            console.log("disconnected")
        })

        this.socket.on("snapshot", (snapshot:any)=>{
            // console.log("snapshot:", snapshot);

            const compressed = new Uint8Array(snapshot)
            const restoredSnapshot = JSON.parse(pako.ungzip(compressed, {
                to: "string"
            }))
            // console.log("restored_snapshot",restoredSnapshot)
            this.doc.mergeStateSnapshot(restoredSnapshot)
        })
    }


    onDocumentChanged(){
        clearTimeout(this.debounceTimer);
        this.debounceTimer = window.setTimeout(() => {
            this.flush();
        }, 300);
    }

    flush(){
        if (!this.doc.isDirty()) {
            return;
        }
        if (this.syncInProgress) {
            return;
        }

        this.syncInProgress = true;

        try {
            // console.log(this.doc.stateSnapshot())s
            const jsonState = JSON.stringify(this.doc.stateSnapshot())
            this.socket.emit("snapshot", pako.gzip(jsonState), (ack:any)=>{
                this.doc.clearDirty();
            })
            
        } finally {
            this.syncInProgress = false;
        }

    }


    timedFlush(){
        
        if (this.syncInProgress) {
            return;
        }

        this.syncInProgress = true;

        try {
            // console.log(this.doc.stateSnapshot())
            const jsonState = JSON.stringify(this.doc.stateSnapshot())
            this.socket.emit("snapshot", pako.gzip(jsonState))
            
        } finally {
            this.syncInProgress = false;
        }
    }
}