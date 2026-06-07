import { LWWRegister } from "./lwwregister.ts"
import { OrSet } from "./orset.ts"


export class SharedDocument{
    id:string
    nodes:OrSet
    edges:OrSet 
    nodePosX:Map<string,LWWRegister<number>>
    nodePosY:Map<string,LWWRegister<number>>

    label:Map<string,LWWRegister<string>>

    listeners:Set<()=>void>
    nodesSnapshot:any
    edgesSnapshot:any
    selected: Set<string>
    selectedEdges: Set<string>
    dirty:boolean

    constructor(id:string){
        this.id = id
        this.nodes = new OrSet()
        this.edges = new OrSet()

        this.nodePosX = new Map<string, LWWRegister<number>>()
        this.nodePosY = new Map<string, LWWRegister<number>>()
        this.label = new Map<string, LWWRegister<string>>()
        this.listeners = new Set()
       
        this.selected = new Set<string>()
        this.selectedEdges = new Set<string>()

        this.dirty = false
        this.updateNodesSnapshot()
        this.updateEdgesSnapshot() 
        
    }

    markDirty(){
        this.dirty = true;
        this.emit();
    }

    isDirty(){
        return this.dirty;
    }

    clearDirty(){
        this.dirty = false;
    }

    addNode(nodeId:string, posX:number, posY:number, label:string){
        this.nodes.add(nodeId);

        if(this.nodePosX.has(nodeId)){
            this.nodePosX.get(nodeId)?.set(posX);
        }else{
            this.nodePosX.set(nodeId, new LWWRegister(posX));
        }

        if(this.nodePosY.has(nodeId)){
            this.nodePosY.get(nodeId)?.set(posY);
        }else{
            this.nodePosY.set(nodeId, new LWWRegister(posY));
        }

        if(this.label.has(nodeId)){
            this.label.get(nodeId)?.set(label);
        }else{
            this.label.set(nodeId, new LWWRegister(label));
        }

        this.updateNodesSnapshot()

        this.markDirty()
    }

    updateNodesSnapshot(){
        this.nodesSnapshot = [...this.nodes.snapshot()].map((curNode)=>{
            return {
                id: curNode,
                position: {
                    x: this.nodePosX.get(curNode)!.get(),
                    y: this.nodePosY.get(curNode)!.get()
                },

                data:{
                    label: this.label.get(curNode)!.get()
                },
                selected: this.selected.has(curNode)
            }
        })
    }

    updateEdgesSnapshot(){
        this.edgesSnapshot = [...this.edges.snapshot()].map((curEdge)=>{
            return {
                id: curEdge,
                source: curEdge.split("->")[0],
                target: curEdge.split("->")[1],
                selected: this.selectedEdges.has(curEdge)
            }
        });

        
    }

    getNodes(){  
        return this.nodesSnapshot;
    }

    getEdges(){
        return this.edgesSnapshot
    }


    subscribe(listener:()=>void){
        this.listeners.add(listener);

        return ()=>{
            this.listeners.delete(listener);
        };
    }

    emit(){
        for(const listener of this.listeners){
            listener();
        }
    }

    selectNode(id:string){
        this.selected.add(id)
        this.updateNodesSnapshot()
        this.emit()
    }

    deselectNode(id:string){
        this.selected.delete(id)
        this.updateNodesSnapshot()
        this.emit()
    }

    selectEdge(id:string){
        this.selectedEdges.add(id)
        this.updateEdgesSnapshot()
        this.emit()
    }

    deselectEdge(id:string){
        this.selectedEdges.delete(id)
        this.updateEdgesSnapshot()
        this.emit()
    }

    addEdge(source:string, target:string){
        // console.log("source", source, "target", target)
        this.edges.add(source + "->" + target);
        // console.log(this.edges.snapshot())
        this.updateEdgesSnapshot()
        this.markDirty()
    }

    removeEdge(edgeId:string){
        this.edges.remove(edgeId)
        this.updateEdgesSnapshot()
        this.markDirty()
    }

    removeNode(nodeId:string){
        this.nodes.remove(nodeId)
        this.updateNodesSnapshot()
        this.markDirty()
    }

    moveNode(nodeId:string, posX:number, posY:number){
        if(!this.nodes.lookup(nodeId)){
            return
        }
        this.nodePosX.get(nodeId)?.set(posX)
        this.nodePosY.get(nodeId)?.set(posY)
        this.updateNodesSnapshot()
        this.markDirty()
    }

    snapshot():{
        nodes: Record<string, { x: any; y: any; label: any }>;
        edges: string[];
    }{
        const snapshot = {
            nodes: {} as Record<string, { x: any; y: any; label: any }>,
            edges: [] as string[]
        }

        for(const node of this.nodes.snapshot()){
            snapshot.nodes[node] = {
                x: this.nodePosX.get(node)?.get(), 
                y: this.nodePosY.get(node)?.get(),
                label: this.label.get(node)?.get()
            };
        }

        for(const edge of this.edges.snapshot()){
            snapshot.edges.push(edge)
        }

        return snapshot
    }

    merge(other:SharedDocument){

        this.nodes.merge(other.nodes)
        this.edges.merge(other.edges)

        other.nodePosX.forEach((value,key)=>{
            
            if(this.nodePosX.has(key)){
                this.nodePosX.get(key)!.merge(value);
            }else{
                this.nodePosX.set(key, value)
            }
        })

        other.nodePosY.forEach((value, key)=>{
            if(this.nodePosY.has(key)){
                this.nodePosY.get(key)!.merge(value);
            }else{
                this.nodePosY.set(key, value)
            }
        })

        other.label.forEach((value, key)=>{
            if(this.label.has(key)){
                this.label.get(key)!.merge(value);
            }else{
                this.label.set(key, value)
            }
        })

        this.updateNodesSnapshot()
        this.updateEdgesSnapshot()

        this.emit()
    }

    stateSnapshot() {
        const state: any = {
            id:this.id,
            nodes: this.nodes.stateSnapshot(),
            edges: this.edges.stateSnapshot(),
            node_posx: {},
            node_posy: {},
            node_label: {}
        };

        for (const key of this.nodePosX.keys()) {
            state.node_posx[key] = this.nodePosX.get(key)!.stateSnapshot();
        }

        for (const key of this.nodePosY.keys()) {
            state.node_posy[key] = this.nodePosY.get(key)!.stateSnapshot();
        }

        for (const key of this.label.keys()) {
            state.node_label[key] = this.label.get(key)!.stateSnapshot();
        }

        return state;

    }


    mergeStateSnapshot(other: any): void {
        this.nodes.mergeStateSnapshot(other.nodes);
        this.edges.mergeStateSnapshot(other.edges);

        for (const key of Object.keys(other.node_posx)) {
            if (this.nodePosX.has(key)) {
                this.nodePosX.get(key)!.mergeStateSnapshot(other.node_posx[key]);
            } else {
                this.nodePosX.set(
                    key,
                    new LWWRegister(
                        other.node_posx[key].value,
                        other.node_posx[key].timestamp
                    )
                );
            }
        }

        for (const key of Object.keys(other.node_posy)) {
            if (this.nodePosY.has(key)) {
                this.nodePosY.get(key)!.mergeStateSnapshot(other.node_posy[key]);
            } else {
                this.nodePosY.set(
                    key,
                    new LWWRegister(
                        other.node_posy[key].value,
                        other.node_posy[key].timestamp
                    )
                );
            }
        }

        for (const key of Object.keys(other.node_label)) {
            if (this.label.has(key)) {
                this.label.get(key)!.mergeStateSnapshot(other.node_label[key]);
            } else {
                this.label.set(
                    key,
                    new LWWRegister(
                        other.node_label[key].value,
                        other.node_label[key].timestamp
                    )
                );
            }
        }

        this.updateNodesSnapshot()
        this.updateEdgesSnapshot()

        this.emit()
    }

}


// const doc = new SharedDocument("1");
// const nodeId1 = generate();
// const nodeId2 = generate();
// doc.addNode(nodeId1, 20, 30, "aman");
// doc.addNode(nodeId2, 30,45, "bhatt");
// doc.addEdge(nodeId1, nodeId2);


// // console.log(doc.snapshot())

// const stateSnapshot = doc.stateSnapshot();
// const json = JSON.stringify(stateSnapshot);

// const compressed = gzipSync(json);

// const base64 = compressed.toString("base64");
// console.log(base64);


// const compressed2 = Buffer.from(base64, "base64");

// const json2 = gunzipSync(compressed).toString("utf-8")

// const restoredSnapshot = JSON.parse(json2)

// const doc2 = new SharedDocument("2");

// doc2.mergeStateSnapshot(restoredSnapshot);

// console.log(doc2.snapshot());