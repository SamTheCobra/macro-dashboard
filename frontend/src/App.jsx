import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import ThesisDetail from './pages/ThesisDetail'
import Portfolio from './pages/Portfolio'
import Retrospective from './pages/Retrospective'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="thesis/:id" element={<ThesisDetail />} />
          <Route path="portfolio" element={<Portfolio />} />
          <Route path="retrospective" element={<Retrospective />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
