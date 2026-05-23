import { useState, useEffect, useRef } from 'react'
import Header from '../components/header/Header'
import BibliaPanel from '../components/BibliaPanel'
import ProyectorPanel from '../components/ProyectorPanel'
import ProjectionView from '../components/ProjectionView'
import YouTubeSearch from '../components/YouTubeSearch'
import EscenasPanel from '../components/EscenasPanel'
import SecondaryDisplay from '../components/SecondaryDisplay'
import ReproductorPanel from '../components/ReproductorPanel'
import DirectoryBrowser from '../components/DirectoryBrowser'
import ConfigPanel from '../components/ConfigPanel'
import EffectsPanel from '../components/EffectsPanel'
import SermonInfo from '../components/SermonInfo'
import VideoControls from '../components/VideoControls'
import AudioControl from '../components/mixer/AudioControl'
import AnunciosPanel from '../components/AnunciosPanel'
import CronometroPanel from '../components/CronometroPanel'
import ScenesPanel from '../components/ScenesPanel'
import UpdateNotifier from '../components/UpdateNotifier'
import WelcomeScreen from '../components/WelcomeScreen'
import { useModules } from '../modules'
import { useToast } from '../components/Toast'
export interface ProjectedContent {
  type: 'verse' | 'black' | 'media' | 'document' | 'none'
  text?: string
  reference?: string
  mediaUrl?: string
  backgroundUrl?: string
  animation?: string
  sermonTitle?: string
  sermonPreacher?: string
  overlayOpacity?: number
  fontSize?: number
}

export default function DashboardView() {
  const [projected, setProjected] = useState<ProjectedContent>({ type: 'none' })
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null)
  const [overlayOpacity, setOverlayOpacity] = useState(80)
  const [fontSize, setFontSize] = useState(48)

  useEffect(() => {
    let cancelled = false
    window.api.app.getConfig().then((res) => {
      if (cancelled) return
      if (res.success && res.data) {
        const cfg = res.data as Record<string, any>
        if (cfg.overlayOpacity) setOverlayOpacity(cfg.overlayOpacity)
        if (cfg.fontSize) setFontSize(cfg.fontSize)
      }
    }).catch(() => {})
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { overlayOpacity?: number; fontSize?: number }
      if (detail.overlayOpacity) setOverlayOpacity(detail.overlayOpacity)
      if (detail.fontSize) setFontSize(detail.fontSize)
    }
    window.addEventListener('config:changed', handler)
    return () => window.removeEventListener('config:changed', handler)
  }, [])

  useEffect(() => {
    let lastTitle = ''
    const unsub = window.api.on('video:progress', (arg: unknown) => {
      const data = arg as { currentTime: number; duration: number; paused: boolean; title: string }
      if (data.title) {
        if (data.title !== lastTitle) { lastTitle = data.title; toast(`▶ ${data.title}`, 'info') }
        setProjected({ type: 'media', text: data.title, mediaUrl: '' })
      } else {
        setProjected({ type: 'none' })
      }
    })
    return () => { unsub?.() }
  }, [])

  useEffect(() => {
    const unsub = window.api.on('projector:content', (arg: unknown) => {
      const data = arg as { type?: string; mediaUrl?: string; text?: string } | undefined
      if (data?.type === 'document') {
        setProjected({ type: 'document', text: data.text || 'Documento', mediaUrl: data.mediaUrl })
      } else if (data?.type === 'media' && data.mediaUrl?.startsWith('data:image')) {
        setProjected({ type: 'media', text: data.text || 'Imagen', mediaUrl: data.mediaUrl })
      }
    })
    return () => { unsub?.() }
  }, [])

  const [animBiblia, setAnimBiblia] = useState('anim-fade')

  // Escuchar cambios de pantalla desde ScreensModal
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (!detail?.assignments) return
      const newAssign = detail.assignments as Record<string, string[]>
      const selectedDisplays = (detail.displays as number[]) || []
      let oldAssign: Record<string, string[]> = {}
      try { const saved = localStorage.getItem('ipd-active-assignments'); if (saved) { const p = JSON.parse(saved); if (p.assignments) oldAssign = p.assignments } } catch {}

      for (const displayId of selectedDisplays) {
        const types = newAssign[displayId] || []
        const oldTypes: string[] = oldAssign[displayId] || []

        window.api.projector.projectToDisplay(displayId)

        setTimeout(() => {
          const removed = oldTypes.filter(t => !types.includes(t))
          const added = types.filter(t => !oldTypes.includes(t))

          // Clear removed types - show black screen on that display
          if (removed.includes('biblia') || removed.includes('video') || removed.includes('efectos') || (types.length === 0)) {
            window.api.display.sendContent(displayId, { type: 'black' })
          }
          if (removed.includes('anuncios')) {
            window.api.display.hideAnnouncement(displayId)
          }

          // Send new content for added types
          if (added.includes('biblia') || (types.includes('biblia') && !removed.includes('biblia'))) {
            if (types.includes('biblia') && lastVerse.current) {
              window.api.display.sendContent(displayId, {
                type: 'verse', text: lastVerse.current.text, reference: lastVerse.current.reference,
                animation: animBiblia, backgroundUrl: backgroundUrl || undefined
              })
            }
          }
        }, 300)
      }
    }
    window.addEventListener('screens:applied', handler)
    return () => window.removeEventListener('screens:applied', handler)
  }, [backgroundUrl, animBiblia])

  // Escuchar cambios de predicación en tiempo real
  useEffect(() => {
    const handler = (e: Event) => {
      if (!lastVerse.current) return
      const detail = (e as CustomEvent).detail
      const show = detail !== null
      const sTitle = show && detail?.title ? detail.title : ''
      const sPreacher = show && detail?.preacher ? detail.preacher : ''
      const content: ProjectedContent = { type: 'verse', text: lastVerse.current.text, reference: lastVerse.current.reference, animation: animBiblia, sermonTitle: sTitle, sermonPreacher: sPreacher, overlayOpacity, fontSize }
      if (backgroundUrl) content.backgroundUrl = backgroundUrl
      setProjected(content)
      window.api.projector.sendContent(content)
      window.api.projector.projectToAll()
    }
    window.addEventListener('sermon:update', handler)
    return () => window.removeEventListener('sermon:update', handler)
  }, [backgroundUrl, animBiblia])

  // Escuchar carga de escenas
  useEffect(() => {
    const handler = (e: Event) => {
      const scene = (e as CustomEvent).detail
      if (!scene) return
      if (scene.backgroundUrl) setBackgroundUrl(scene.backgroundUrl)
      if (scene.animBiblia) saveAnimBiblia(scene.animBiblia)
      if (scene.verse && scene.verse.text) {
        handleProjectVerse(scene.verse.text, scene.verse.reference || '')
      }
    }
    window.addEventListener('scene:load', handler)
    return () => window.removeEventListener('scene:load', handler)
  }, [backgroundUrl, animBiblia])
  const [chapterVerses, setChapterVerses] = useState<{ text: string; reference: string; verseNumber: number }[]>([])
  const [verseIdx, setVerseIdx] = useState(0)
  const lastVerse = useRef<{ text: string; reference: string } | null>(null)

  // Restaurar animación guardada y fondo
  useEffect(() => {
    window.api.app.getConfig().then((res) => {
      if (res?.success && res.data) {
        if (res.data.animBiblia) setAnimBiblia(res.data.animBiblia as string)
      }
    })
  }, [])

  const saveAnimBiblia = (anim: string) => {
    setAnimBiblia(anim)
    window.api.app.getConfig().then((res) => {
      const cfg = res?.success && res.data ? { ...res.data } : {}
      cfg.animBiblia = anim
      window.api.app.saveConfig(cfg)
    })
  }

  const saveStateToStorage = () => {
    if (lastVerse.current) localStorage.setItem('ipd-last-verse', JSON.stringify(lastVerse.current))
    if (backgroundUrl) localStorage.setItem('ipd-bg-url', backgroundUrl)
    localStorage.setItem('ipd-anim-biblia', animBiblia)
  }

  const handleProjectVerse = (text: string, reference: string) => {
    lastVerse.current = { text, reference }
    let sermonTitle = '', sermonPreacher = ''
    try { const s = JSON.parse(localStorage.getItem('sermonInfo') || '{}'); sermonTitle = s.title || ''; sermonPreacher = s.preacher || '' } catch {}
    const content: ProjectedContent = { type: 'verse', text, reference, animation: animBiblia, sermonTitle, sermonPreacher, overlayOpacity, fontSize }
    if (backgroundUrl) content.backgroundUrl = backgroundUrl
    setProjected(content)
    toast(reference, 'success')
    saveStateToStorage()
    window.api.projector.sendContent(content)
    window.api.projector.projectToAll()
  }

  const handleLoadChapter = (verses: { text: string; reference: string; verseNumber: number }[], idx: number) => {
    setChapterVerses(verses)
    setVerseIdx(idx)
  }

  const goPrevVerse = () => {
    if (verseIdx > 0) {
      const newIdx = verseIdx - 1
      setVerseIdx(newIdx)
      const v = chapterVerses[newIdx]
      handleProjectVerse(v.text, v.reference)
    }
  }

  const goNextVerse = () => {
    if (verseIdx < chapterVerses.length - 1) {
      const newIdx = verseIdx + 1
      setVerseIdx(newIdx)
      const v = chapterVerses[newIdx]
      handleProjectVerse(v.text, v.reference)
    }
  }

  const goPrevVerseRef = useRef(goPrevVerse)
  const goNextVerseRef = useRef(goNextVerse)
  goPrevVerseRef.current = goPrevVerse
  goNextVerseRef.current = goNextVerse

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') window.api.projector.scrollDocument('up')
      else if (e.key === 'ArrowDown') window.api.projector.scrollDocument('down')
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  useEffect(() => {
    const unsub1 = window.api.on('projector:prevVerse', () => goPrevVerseRef.current?.())
    const unsub2 = window.api.on('projector:nextVerse', () => goNextVerseRef.current?.())
    return () => { unsub1?.(); unsub2?.() }
  }, [])

  // Cuando cambia el fondo, re-proyectar con el nuevo fondo
  useEffect(() => {
    if (!backgroundUrl) return
    if (lastVerse.current) {
      let sermonTitle = '', sermonPreacher = ''
      try { const s = JSON.parse(localStorage.getItem('sermonInfo') || '{}'); sermonTitle = s.title || ''; sermonPreacher = s.preacher || '' } catch {}
      const content: ProjectedContent = {
        type: 'verse',
        text: lastVerse.current.text,
        reference: lastVerse.current.reference,
        animation: animBiblia,
        sermonTitle, sermonPreacher,
        backgroundUrl,
        overlayOpacity, fontSize
      }
      setProjected(content)
      window.api.projector.sendContent(content)
      window.api.projector.projectToAll()
    } else {
      const content: ProjectedContent = { type: 'media', text: 'Fondo', mediaUrl: '', backgroundUrl, overlayOpacity, fontSize }
      setProjected(content)
      window.api.projector.sendContent(content)
      window.api.projector.projectToAll()
    }
  }, [backgroundUrl])

  const handleShowBlack = () => {
    setProjected({ type: 'black' })
    window.api.projector.showBlack()
    toast('Pantalla negra', 'info')
  }

  // ── Background video state ──
  const [bgVideo, setBgVideo] = useState<{ url: string | null; title: string; paused: boolean }>({ url: null, title: '', paused: false })

  const handlePlayBg = async (url: string, title: string) => {
    setBgVideo({ url, title, paused: false })
    toast(`▶ ${title}`, 'info')
  }

  const handlePauseBg = () => {
    setBgVideo((prev) => ({ ...prev, paused: true }))
  }

  const handleResumeBg = () => {
    setBgVideo((prev) => ({ ...prev, paused: false }))
  }

  const handleStopBg = () => {
    setBgVideo({ url: null, title: '', paused: false })
  }

  const handleProjectImage = (dataUrl: string, name: string) => {
    const content: ProjectedContent = { type: 'media', text: name, mediaUrl: dataUrl, overlayOpacity, fontSize }
    setProjected(content)
    window.api.projector.sendContent(content)
    window.api.projector.projectToAll()
    toast(`Imagen: ${name}`, 'success')
  }

  const { isEnabled } = useModules()
  const { toast } = useToast()

  return (
    <div className="h-full w-full flex flex-col overflow-hidden bg-theme">
      <Header />
      <div className="flex-1 grid grid-cols-3 gap-3 p-3 overflow-hidden min-h-0">
        <div className="flex flex-col gap-3 overflow-hidden min-h-0 max-h-full">
          <div className="flex-[3] min-h-0 overflow-hidden">
            <BibliaPanel onProject={handleProjectVerse} onLoadChapter={handleLoadChapter}
              projectedVerseNumber={chapterVerses[verseIdx]?.verseNumber ?? null} />
          </div>
          <div className="flex-[2] flex flex-col gap-2 min-h-0 overflow-hidden">
            {projected.type === 'media' && <VideoControls />}
            <div className="flex-1 flex gap-3 min-h-0 overflow-hidden">
              {isEnabled('pantallas') && <div className="flex-1 min-w-0 overflow-hidden"><ProyectorPanel projected={projected} /></div>}
              {isEnabled('youtube') && <div className="flex-1 min-w-0 overflow-hidden"><YouTubeSearch onPlayBg={handlePlayBg} /></div>}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3 overflow-hidden min-h-0 max-h-full">
          <div className="flex-[3] min-h-0 overflow-hidden">
            <ProjectionView onBlack={handleShowBlack} backgroundUrl={backgroundUrl} projected={projected} animation={animBiblia} onAnimationChange={saveAnimBiblia}
              chapterVerses={chapterVerses} verseIdx={verseIdx} onPrevVerse={goPrevVerse} onNextVerse={goNextVerse}
              overlayOpacity={overlayOpacity} fontSize={fontSize}
              bgVideo={bgVideo} onPause={handlePauseBg} onResume={handleResumeBg} onStop={handleStopBg} />
          </div>
          <div className="flex-[2] flex gap-3 min-h-0 overflow-hidden">
            {isEnabled('audio') && <div className="flex-1 min-w-0 overflow-hidden"><AudioControl /></div>}
            {(isEnabled('imagenes') || isEnabled('anuncios')) && (
              <div className="flex flex-col gap-3 flex-1 min-w-0 min-h-0 overflow-hidden">
                {isEnabled('imagenes') && <div className="flex-1 min-h-0 overflow-hidden"><EscenasPanel backgroundUrl={backgroundUrl} onSelectBackground={setBackgroundUrl} onProjectVerse={handleProjectVerse} onProjectImage={handleProjectImage} /></div>}
                {isEnabled('anuncios') && <div className="shrink-0"><AnunciosPanel /></div>}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-3 overflow-hidden min-h-0 max-h-full">
          {isEnabled('configuracion') ? (
            <div className="flex-1 min-h-0">
              <ConfigPanel />
            </div>
          ) : (
            <>
              <div className="flex-[4] min-h-0 overflow-hidden">
                <SecondaryDisplay />
              </div>
              <div className="flex gap-3 min-h-0">
    <div className="flex-1 min-w-0"><ReproductorPanel onPlayBg={handlePlayBg} /></div>
                {isEnabled('cronometro') && <div className="flex-1 min-w-0"><CronometroPanel /></div>}
              </div>
              <div className="flex-[4] min-h-0 flex gap-3 overflow-hidden">
                {(isEnabled('predicacion') || isEnabled('efectos')) && (
                  <div className="flex flex-col gap-3 flex-1 min-w-0 min-h-0 overflow-hidden">
                    {isEnabled('predicacion') && <div className="shrink-0"><SermonInfo /></div>}
                    {isEnabled('efectos') && <div className="flex-1 min-h-0"><EffectsPanel /></div>}
                  </div>
                )}
                {(isEnabled('multimedia') || isEnabled('escenas')) && (
                  <div className="flex flex-col gap-3 flex-1 min-w-0 min-h-0 overflow-hidden">
                    {isEnabled('multimedia') && <div className="flex-1 min-h-0 overflow-hidden"><DirectoryBrowser onPlayBg={handlePlayBg} /></div>}
                    {isEnabled('escenas') && <ScenesPanel />}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      <UpdateNotifier />
      <WelcomeScreen />
    </div>
  )
}
