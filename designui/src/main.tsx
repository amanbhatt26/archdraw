import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import {App} from './App.tsx'
import { SharedDocument } from './core/document.ts'
import { SyncManager } from './core/syncmanager.ts'

const createDoc = ()=>{
  const doc = new SharedDocument("shareddoc1");
  return doc;
}

const sharedDoc = createDoc()
const syncManager = new SyncManager(sharedDoc)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App sharedDoc={sharedDoc} syncManager={syncManager} />
  </StrictMode>,
)
