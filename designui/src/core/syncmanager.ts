import type { SharedDocument } from "./document";
export class SyncManager {

    doc:SharedDocument
    private debounceTimer?: number;
    private syncInProgress = false;

    constructor(doc:SharedDocument){
        this.doc = doc;
        this.doc.subscribe(()=>{
            this.onDocumentChanged();
        });

        setInterval(()=>{
            this.flush();
        }, 10000);
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
            console.log(this.doc.stateSnapshot())
            // TODO:only clear dirty if above succeeded. 
            this.doc.clearDirty();
        } finally {
            this.syncInProgress = false;
        }

    }

}