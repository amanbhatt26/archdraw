import {Background, Controls, ReactFlow } from "@xyflow/react"
import '@xyflow/react/dist/style.css';
import { useCallback, useState, useSyncExternalStore } from "react";
import { SharedDocument } from "./core/document";
import {generate} from "short-uuid";
import type { SyncManager } from "./core/syncmanager";

export const App = ({sharedDoc, syncManager}:{sharedDoc:SharedDocument, syncManager:SyncManager})=>{

  const nodes = useSyncExternalStore(
    sharedDoc.subscribe.bind(sharedDoc),
    sharedDoc.getNodes.bind(sharedDoc)
  )

  const edges = useSyncExternalStore(
    sharedDoc.subscribe.bind(sharedDoc),
    sharedDoc.getEdges.bind(sharedDoc)
  )

  const [inputValue, setInputValue] = useState<string>("");
  const onInputChange = (e:any)=>{
    setInputValue(e.target.value)
  }

  const onButtonClick = ()=>{
    if(inputValue == "") return;
    sharedDoc.addNode(generate(), 30, 30, inputValue);
  }
  
  const onNodesChange = useCallback(
    (changes:any) => {

      for(const change of changes){
        
        const changeType = change.type

        if(changeType === "position"){
          sharedDoc.moveNode(change.id, change.position.x, change.position.y)
        }

        if(changeType === "remove"){
          sharedDoc.removeNode(change.id)
        }

        if(changeType === "select"){
          if(change.selected){
            sharedDoc.selectNode(change.id)
          }else{
            sharedDoc.deselectNode(change.id)
          }
        }
      }
      // console.log(sharedDoc.stateSnapshot())
    },
    [],
  );


  const onEdgesChange = useCallback(
    (changes:any) => {
      for(const change of changes){
        
        const changeType = change.type

        if(changeType === "remove"){
          sharedDoc.removeEdge(change.id)
        }

        if(changeType === "select"){
          if(change.selected){
            sharedDoc.selectEdge(change.id)
          }else{
            sharedDoc.deselectEdge(change.id)
          }
        }
      }
      // console.log(sharedDoc.stateSnapshot())
    },
    [],
  );
  const onConnect = useCallback(
    (params:any) => {
      sharedDoc.addEdge(params.source, params.target)
      // console.log(sharedDoc.stateSnapshot())
    },
    [],
  );
  return <div style={{height:'100vh',width:'100vw'}}>
    <input value={inputValue} onChange={onInputChange}></input>
    <button onClick={onButtonClick}> Add node </button>
    <ReactFlow nodes={nodes} edges={edges} 
    onNodesChange={onNodesChange} 
    onEdgesChange={onEdgesChange} 
    onConnect={onConnect}
    
    >
      <Background/>
      <Controls/>
    </ReactFlow>
  </div>
}