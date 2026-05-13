import { useState, useEffect } from 'react'
import Header from '../components/header/Header'
import BibliaPanel from '../components/BibliaPanel'
import ProyectorPanel from '../components/ProyectorPanel'
import ProjectionView from '../components/ProjectionView'
import YouTubeSearch from '../components/YouTubeSearch'
import EscenasPanel from '../components/EscenasPanel'
import SecondaryDisplay from '../components/SecondaryDisplay'
import ReproductorPanel from '../components/ReproductorPanel'
import ProgramacionPanel from '../components/ProgramacionPanel'
import VideoControls from '../components/VideoControls'
import MixerAudio from '../components/mixer/MixerAudio'
import UpdateNotifier from '../components/UpdateNotifier'

export interface ProjectedContent {
  type: 'verse' | 'black' | 'media' | 'none'
  text?: string
  reference?: string
  mediaUrl?: string
}

export default function DashboardView() {
  const [projected, setProjected] = useState<ProjectedContent>({ type: 'none' })

  useEffect(() => {
    const unsub = window.api.on('video:progress', (arg: unknown) => {
      const data = arg as { currentTime: number; duration: number; paused: boolean; title: string }
      if (data.title) {
        setProjected({ type: 'media', text: data.title, mediaUrl: '' })
      } else {
        setProjected({ type: 'none' })
      }
    })
    return () => { unsub?.() }
  }, [])

  const handleProjectVerse = (text: string, reference: string) => {
    setProjected({ type: 'verse', text, reference })
    window.api.projector.projectToAll()
  }

  const handleShowBlack = () => {
    setProjected({ type: 'black' })
    window.api.projector.showBlack()
  }

  return (
    <div className="h-full w-full flex flex-col overflow-hidden bg-theme">
      <Header />

      <div className="flex-1 grid grid-cols-3 gap-3 p-3 overflow-hidden">
        {/* ─── LEFT COLUMN ─── */}
        <div className="flex flex-col gap-3 overflow-hidden">
          <div className="flex-[3] min-h-0">
            <BibliaPanel onProject={handleProjectVerse} />
          </div>
          <div className="flex-[2] flex flex-col gap-2 min-h-0">
            <VideoControls />
            <div className="flex-1 grid grid-cols-2 gap-3 min-h-0">
              <ProyectorPanel />
              <YouTubeSearch />
            </div>
          </div>
        </div>

        {/* ─── CENTER COLUMN ─── */}
        <div className="flex flex-col gap-3 overflow-hidden">
          <div className="flex-[3] min-h-0">
            <ProjectionView onBlack={handleShowBlack} />
          </div>
          <div className="flex-[2] grid grid-cols-2 gap-3 min-h-0">
            <EscenasPanel onRestore={setProjected} />
            <MixerAudio />
          </div>
        </div>

        {/* ─── RIGHT COLUMN ─── */}
        <div className="flex flex-col gap-3 overflow-hidden">
          <div className="flex-[9] min-h-0">
            <SecondaryDisplay />
          </div>
          <div className="flex-[3] min-h-0">
            <ReproductorPanel />
          </div>
          <div className="flex-[8] min-h-0">
            <ProgramacionPanel />
          </div>
        </div>
      </div>
      <UpdateNotifier />
    </div>
  )
}
