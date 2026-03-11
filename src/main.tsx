import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import IndexPage from './pages/IndexPage'
import CuisinePage from './pages/CuisinePage'
import StravaPage from './pages/StravaPage'
import PasswordGate from './components/PasswordGate'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PasswordGate>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<IndexPage />} />
          <Route path="/cuisine" element={<CuisinePage />} />
          <Route path="/strava" element={<StravaPage />} />
        </Routes>
      </BrowserRouter>
    </PasswordGate>
  </StrictMode>,
)
