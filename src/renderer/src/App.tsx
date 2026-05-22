import { HashRouter, Routes, Route } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import DashboardView from './views/DashboardView'
import ProjectorView from './views/ProjectorView'
import { ModuleProvider } from './modules'
import { LangProvider } from './i18n'
import { ToastProvider } from './components/Toast'
import ErrorBoundary from './components/ErrorBoundary'

function App() {
  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  )
}

export default App
