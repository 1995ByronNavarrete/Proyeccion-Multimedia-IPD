import { HashRouter, Routes, Route } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import DashboardView from './views/DashboardView'
import ProjectorView from './views/ProjectorView'
import { ModuleProvider } from './modules'
import { LangProvider } from './i18n'
import { ToastProvider } from './components/Toast'

function App() {
  return (
    <ModuleProvider>
      <LangProvider>
      <ToastProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<DashboardView />} />
            <Route path="projector" element={<ProjectorView />} />
          </Route>
        </Routes>
      </HashRouter>
      </ToastProvider>
      </LangProvider>
    </ModuleProvider>
  )
}

export default App
