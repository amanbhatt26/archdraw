import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import {App} from './App.tsx'
import { SharedDocument } from './core/document.ts'
import { generate } from 'short-uuid'
import { SyncManager } from './core/syncmanager.ts'

const createDoc = ()=>{
  const doc = new SharedDocument(generate());
  doc.addNode(generate(), 20, 40, "hello")
  doc.addNode(generate(), 40,100, "world")
  return doc;
}

const sharedDoc = createDoc()
const syncManager = new SyncManager(sharedDoc)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App sharedDoc={sharedDoc} syncManager={syncManager} />
  </StrictMode>,
)
