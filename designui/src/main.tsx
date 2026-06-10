import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter, Route } from 'react-router'
import { Routes } from 'react-router'
import { LandingPage } from './components/LandingPage.tsx'
import { DesignPage } from './components/DesignPage.tsx'
createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/designs/:id" element={<DesignPage/>}/>
    </Routes>
  </BrowserRouter>,
)
