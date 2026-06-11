import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter, Route } from 'react-router'
import { Routes } from 'react-router'
import { LandingPage } from './components/LandingPage.tsx'
import { DesignPage } from './components/DesignPage.tsx'
import { ReactFlowProvider } from '@xyflow/react'
createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/designs/:id" element={<ReactFlowProvider><DesignPage/></ReactFlowProvider>}/>
    </Routes>
  </BrowserRouter>,
)
