import { HashRouter, Routes, Route } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import DashboardView from './views/DashboardView'
import ProjectorView from './views/ProjectorView'

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<DashboardView />} />
          <Route path="projector" element={<ProjectorView />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

export default App
