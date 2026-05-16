import { useState, useEffect } from 'react'
import { Radio, Minus, Square, X, Settings, Image, Trash2, Download, Upload, Keyboard, Info, Github, User, Lightbulb, Sparkles, RefreshCw } from 'lucide-react'
import ThemeToggle from '../theme/ThemeToggle'
import { fileUrl } from '../../utils'

export default function Header() {
  const [isLive, setIsLive] = useState(true)
  const [time, setTime] = useState(new Date())
  const [showSettings, setShowSettings] = useState(false)
  const [version, setVersion] = useState('1.0.0')
  const [appName, setAppName] = useState('SOFTWARE PREMIUM+')
  const [subName, setSubName] = useState('PARA IGLESIAS')
  const [editName, setEditName] = useState('')
  const [editSub, setEditSub] = useState('')
  const [logoSrc, setLogoSrc] = useState<string | null>(null)
  const [loadingLogo, setLoadingLogo] = useState(false)
  const [videoLogoSrc, setVideoLogoSrc] = useState<string | null>(null)
  const [loadingVideoLogo, setLoadingVideoLogo] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const [shortcuts, setShortcuts] = useState<{ key: string; desc: string }[]>(() => {
    try {
      const saved = localStorage.getItem('shortcuts')
      if (saved) return JSON.parse(saved)
    } catch {}
    return [{ key: '← →', desc: 'Verso anterior / siguiente' }, { key: 'F11', desc: 'Pantalla completa' }, { key: 'Esc', desc: 'Cerrar modal' }]
  })

  useEffect(() => {
    window.api.app.getVersion().then(v => { if (v) setVersion(v) })
    Promise.all([
      window.api.app.getConfig(),
      window.api.app.getLogo(),
      window.api.app.getVideoLogo()
    ]).then(([configRes, logoRes, videoLogoRes]) => {
      if (configRes.success && configRes.data) {
        const cfg = configRes.data as Record<string, string>
        if (cfg.headerTitle) setAppName(cfg.headerTitle)
        if (cfg.headerSub) setSubName(cfg.headerSub)
      }
      if (logoRes.success && logoRes.data) setLogoSrc(fileUrl(logoRes.data.filePath))
      if (videoLogoRes?.success && videoLogoRes.data) setVideoLogoSrc(fileUrl(videoLogoRes.data.filePath))
    })
  }, [])

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const onClose = () => setIsLive(false)
    window.addEventListener('beforeunload', onClose)
    return () => window.removeEventListener('beforeunload', onClose)
  }, [])

  const openSettings = () => {
    setEditName(appName)
    setEditSub(subName)
    setShowSettings(true)
  }

  const saveSettings = () => {
    const name = editName.trim() || 'SOFTWARE PREMIUM'
    const sub = editSub.trim() || 'PARA IGLESIAS'
    setAppName(name)
    setSubName(sub)
    window.api.app.saveConfig({ headerTitle: name, headerSub: sub })
    setShowSettings(false)
  }

  const handleSelectLogo = async () => {
    setLoadingLogo(true)
    try {
      const res = await window.api.app.selectAndSaveLogo()
      if (res.success && res.data) {
        setLogoSrc(fileUrl(res.data.filePath))
      } else if (!res.success) {
        console.error('Error al cargar logo:', res.error)
      }
    } catch (err) {
      console.error('Error al seleccionar logo:', err)
    } finally {
      setLoadingLogo(false)
    }
  }

  const handleRemoveLogo = () => {
    setLogoSrc(null)
  }

  const handleSelectVideoLogo = async () => {
    setLoadingVideoLogo(true)
    try {
      const res = await window.api.app.selectAndSaveVideoLogo()
      if (res.success && res.data) setVideoLogoSrc(fileUrl(res.data.filePath))
    } catch (err) {
      console.error('Error al cargar logo de video:', err)
    } finally {
      setLoadingVideoLogo(false)
    }
  }

  const handleRemoveVideoLogo = async () => {
    setVideoLogoSrc(null)
  }

  const pad = (n: number) => n.toString().padStart(2, '0')
  const h = time.getHours()
  const m = time.getMinutes()
  const s = time.getSeconds()
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  const timeStr = `${pad(h12)}:${pad(m)}:${pad(s)} ${ampm}`
  const dateStr = time.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    .replace(/^\w/, (c) => c.toUpperCase())

  return (
    <header className="h-[90px] bg-[#050816] bg-theme border-b border-[rgba(120,80,255,0.2)] border-theme flex items-center justify-between px-4 shrink-0 drag relative">
      {/* Left */}
      <div className="flex items-center gap-5">
        <div className="relative group flex items-center gap-3">
          {logoSrc && (
            <img src={logoSrc} alt="Logo" className="h-[75px] w-auto rounded-lg object-contain" />
          )}
          <div>
            <h1 className="text-sm font-bold text-white text-theme tracking-wide">{appName}</h1>
            <p className="text-[10px] text-[#6b7280] -mt-0.5">{subName}</p>
          </div>
        </div>

      </div>

      {/* Right */}
      <div className="flex items-center gap-4 no-drag">
        <div className={`flex items-center gap-2 rounded-lg px-3 py-1.5 transition-colors ${isLive ? 'bg-green-600/15 border border-green-500/30' : 'bg-red-600/15 border border-red-500/30'}`}>
          <Radio size={12} className={`${isLive ? 'text-green-500' : 'text-red-500'} animate-pulse`} />
          <span className={`text-[10px] font-bold tracking-widest ${isLive ? 'text-green-400' : 'text-red-400'}`}>EN VIVO</span>
        </div>
        <button onClick={() => setShowInfo(true)}
          className="p-1.5 hover:bg-[#6c5ce7]/20 rounded-lg transition-colors" title="Acerca de">
          <Info size={12} className="text-[#6c5ce7]" />
        </button>
        <div className="text-right">
          <p className="text-lg font-bold text-white text-theme tabular-nums leading-tight">{timeStr}</p>
          <p className="text-[10px] text-gray-500 text-theme-muted">{dateStr}</p>
        </div>
        <div className="flex items-center gap-1 ml-2 pl-4 border-l border-[rgba(120,80,255,0.2)]">
          <button onClick={openSettings} className="p-1.5 hover:bg-white/5 rounded transition-colors" title="Configuración">
            <Settings size={12} className="text-gray-500 text-theme-muted" />
          </button>
          <ThemeToggle />
          <button onClick={() => window.api.update.checkNow()} className="p-1.5 hover:bg-white/5 rounded transition-colors" title="Buscar actualizaciones">
            <RefreshCw size={12} className="text-gray-500 text-theme-muted" />
          </button>
          <button onClick={() => window.api.app.minimize()} className="p-1.5 hover:bg-white/5 rounded transition-colors">
            <Minus size={12} className="text-gray-500 text-theme-muted" />
          </button>
          <button onClick={() => window.api.app.maximize()} className="p-1.5 hover:bg-white/5 rounded transition-colors">
            <Square size={11} className="text-gray-500 text-theme-muted" />
          </button>
          <button onClick={() => window.api.app.quit()} className="p-1.5 hover:bg-red-500/20 rounded transition-colors">
            <X size={12} className="text-gray-500 text-theme-muted" />
          </button>
        </div>
      </div>

      {showSettings && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowSettings(false)} />
          <div className="absolute top-full right-4 mt-1 z-50 bg-[rgba(8,12,30,0.98)] bg-theme-panel border border-[rgba(120,80,255,0.25)] border-theme rounded-xl p-3 shadow-2xl shadow-black/50 min-w-[260px]">
            <h4 className="text-[10px] font-semibold text-gray-400 text-theme-muted uppercase tracking-wider mb-3">Configuración</h4>
            <div className="space-y-2.5">
              <div>
                <label className="text-[8px] text-gray-500 text-theme-muted block mb-1">Logotipo</label>
                <div className="flex items-center gap-2">
                  {logoSrc && (
                    <img src={logoSrc} alt="Logo" className="h-10 w-10 rounded-lg object-cover border border-[rgba(120,80,255,0.15)] border-theme" />
                  )}
                  <button onClick={handleSelectLogo} disabled={loadingLogo}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#091225] bg-theme-card rounded-lg text-[9px] text-gray-400 text-theme-muted hover:text-white text-theme transition-colors border border-[rgba(120,80,255,0.15)] border-theme">
                    <Image size={10} /> {loadingLogo ? 'Cargando...' : logoSrc ? 'Cambiar' : 'Seleccionar'}
                  </button>
                  {logoSrc && (
                    <button onClick={handleRemoveLogo}
                      className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors">
                      <Trash2 size={10} className="text-gray-500 hover:text-red-400" />
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className="text-[8px] text-gray-500 text-theme-muted block mb-1">Logo para proyección</label>
                <div className="flex items-center gap-2">
                  {videoLogoSrc && (
                    <img src={videoLogoSrc} alt="Logo Proy." className="h-10 w-10 rounded-lg object-cover border border-[rgba(120,80,255,0.15)] border-theme" />
                  )}
                  <button onClick={handleSelectVideoLogo} disabled={loadingVideoLogo}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#091225] bg-theme-card rounded-lg text-[9px] text-gray-400 text-theme-muted hover:text-white text-theme transition-colors border border-[rgba(120,80,255,0.15)] border-theme">
                    <Image size={10} /> {loadingVideoLogo ? 'Cargando...' : videoLogoSrc ? 'Cambiar' : 'Seleccionar'}
                  </button>
                  {videoLogoSrc && (
                    <button onClick={handleRemoveVideoLogo}
                      className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors">
                      <Trash2 size={10} className="text-gray-500 hover:text-red-400" />
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className="text-[8px] text-gray-500 text-theme-muted block mb-1">Nombre principal</label>
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-2 py-1.5 bg-[#091225] bg-theme-card rounded-lg text-[10px] text-gray-200 text-theme border border-[rgba(120,80,255,0.15)] border-theme outline-none focus:border-[rgba(120,80,255,0.5)]" />
              </div>
              <div>
                <label className="text-[8px] text-gray-500 text-theme-muted block mb-1">Subtítulo</label>
                <input type="text" value={editSub} onChange={(e) => setEditSub(e.target.value)}
                  className="w-full px-2 py-1.5 bg-[#091225] bg-theme-card rounded-lg text-[10px] text-gray-200 text-theme border border-[rgba(120,80,255,0.15)] border-theme outline-none focus:border-[rgba(120,80,255,0.5)]" />
              </div>
              <div className="border-t border-[rgba(120,80,255,0.15)] pt-2 mt-1">
                <p className="text-[8px] text-theme-muted mb-1.5 flex items-center gap-1"><Keyboard size={8} /> Atajos de teclado</p>
                <div className="space-y-1 text-[7px]">
                  {shortcuts.map((s, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <input type="text" value={s.key} readOnly
                        onFocus={e => { e.target.value = 'Presiona una tecla...'; const handler = (ke: KeyboardEvent) => { ke.preventDefault(); const combo: string[] = []; if (ke.ctrlKey) combo.push('Ctrl'); if (ke.altKey) combo.push('Alt'); if (ke.shiftKey) combo.push('Shift'); combo.push(ke.key === ' ' ? 'Espacio' : ke.key); const val = combo.join('+'); const next = [...shortcuts]; next[i] = { ...next[i], key: val }; setShortcuts(next); window.removeEventListener('keydown', handler); (document.activeElement as HTMLElement)?.blur() }; window.addEventListener('keydown', handler); e.target.addEventListener('blur', () => window.removeEventListener('keydown', handler), { once: true }) }}
                        className="w-20 bg-theme-card px-1 py-0.5 rounded font-mono text-[#6c5ce7] text-center border border-theme outline-none cursor-pointer" />
                      <input type="text" value={s.desc} onChange={e => { const next = [...shortcuts]; next[i] = { ...next[i], desc: e.target.value }; setShortcuts(next) }}
                        className="flex-1 bg-transparent text-theme-dim outline-none border-b border-transparent focus:border-theme-dim/30" />
                      <button onClick={() => { const next = shortcuts.filter((_, j) => j !== i); setShortcuts(next); localStorage.setItem('shortcuts', JSON.stringify(next)) }}
                        className="p-0.5 text-theme-dim hover:text-red-400">✕</button>
                    </div>
                  ))}
                  <button onClick={() => { const next = [...shortcuts, { key: '', desc: '' }]; setShortcuts(next) }}
                    className="text-[7px] text-theme-dim hover:text-theme mt-1">+ Agregar atajo</button>
                  <button onClick={() => localStorage.setItem('shortcuts', JSON.stringify(shortcuts))}
                    className="w-full text-[7px] py-1 mt-1 bg-[#6c5ce7]/20 text-[#6c5ce7] rounded hover:bg-[#6c5ce7]/30 transition-colors">Guardar atajos</button>
                </div>
              </div>
              <div className="border-t border-[rgba(120,80,255,0.15)] pt-2 mt-1">
                <p className="text-[8px] text-gray-500 mb-1.5">Respaldo de datos</p>
                <div className="flex gap-2">
                  <button onClick={async () => { const r = await window.api.backup.create(); if (r.success) alert('Backup creado en:\n' + r.data?.path); else alert('Error: ' + r.error) }}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-[#091225] rounded-lg text-[8px] text-gray-400 hover:text-white transition-colors border border-[rgba(120,80,255,0.15)]">
                    <Download size={8} /> Respaldar
                  </button>
                  <button onClick={async () => { const r = await window.api.backup.restore(); if (r.success) { alert('Restauración exitosa. Reinicia la app.'); window.api.app.quit() } else if (r.error !== 'Cancelado') alert('Error: ' + r.error) }}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-[#091225] rounded-lg text-[8px] text-gray-400 hover:text-white transition-colors border border-[rgba(120,80,255,0.15)]">
                    <Upload size={8} /> Restaurar
                  </button>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setShowSettings(false)}
                  className="flex-1 text-[9px] py-1.5 bg-transparent text-gray-500 rounded-lg border border-[rgba(120,80,255,0.15)] border-theme hover:text-white text-theme transition-colors">
                  Cancelar
                </button>
                <button onClick={saveSettings}
                  className="flex-1 text-[9px] py-1.5 bg-[#6c5ce7] text-white rounded-lg hover:bg-[#5a4bd1] transition-colors font-medium">
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </>
      )}
      {showInfo && (
        <>
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={() => setShowInfo(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[540px] max-w-[94vw] bg-gradient-to-br from-[#0a0a1a] via-[#12122a] to-[#0a0a1a] border border-[#6c5ce7]/30 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden">
            <div className="relative h-28 bg-gradient-to-r from-[#6c5ce7]/40 via-[#a855f7]/30 to-[#00d4ff]/20 flex items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6c5ce7] to-[#a855f7] flex items-center justify-center shadow-lg shadow-[#6c5ce7]/40">
                <Radio size={22} className="text-white" />
              </div>
              <button onClick={() => setShowInfo(false)} className="absolute top-3 right-3 p-1 hover:bg-white/10 rounded"><X size={14} className="text-white/60" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="text-center -mt-10 mb-1">
                <h2 className="text-base font-bold text-white">Proyección Multimedia IPD</h2>
                <p className="text-[10px] text-theme-dim">Sistema profesional para iglesias</p>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.07] border border-white/[0.12]">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6c5ce7] to-[#a855f7] flex items-center justify-center shrink-0"><User size={16} className="text-white" /></div>
                <div>
                  <p className="text-[10px] text-theme-dim font-semibold uppercase tracking-wider">Desarrollador y creador</p>
                  <p className="text-sm font-bold text-white mt-1">Byron Antonio Navarrete Cañada</p>
                  <p className="text-[11px] text-[#6c5ce7] font-semibold mt-3 mb-1.5 flex items-center gap-1"><Sparkles size={12} /> Funcionalidades del sistema</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[9px] text-theme-dim leading-relaxed">
                    <p>✓ Biblia: multi-traducción, búsqueda inteligente</p>
                    <p>✓ Proyección multipantalla + overlay efectos</p>
                    <p>✓ Consola audio: 4 canales, EQ 8 bandas, FX</p>
                    <p>✓ Efectos visuales: 13 tipos configurables</p>
                    <p>✓ 80+ animaciones de texto para versículos</p>
                    <p>✓ Reproductor multimedia con lista</p>
                    <p>✓ YouTube Search y reproducción</p>
                    <p>✓ Editor de imágenes con filtros y ajustes</p>
                    <p>✓ Anuncios overlay configurables</p>
                    <p>✓ Fondos de pantalla para la interfaz</p>
                    <p>✓ Información de predicación en tiempo real</p>
                    <p>✓ Atajos de teclado configurables</p>
                    <p>✓ Backup y restauración de base de datos</p>
                    <p>✓ Tema oscuro/claro y color de acento</p>
                    <p>✓ Logo personalizado (app y proyección)</p>
                    <p>✓ Actualizaciones automáticas vía GitHub</p>
                    <p>✓ Importar y eliminar archivos multimedia</p>
                    <p>✓ Balance estéreo con paneo en tiempo real</p>
                    <p>✓ Fade In/Out maestro de audio</p>
                  </div>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-[11px] text-[#00d4ff] font-bold flex items-center gap-1.5 mb-3"><Lightbulb size={13} /> Ideas implementadas</p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-gradient-to-br from-[#6c5ce7] to-[#00d4ff] text-white flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5 shadow-sm">1</span>
                    <div><p className="text-[11px] font-bold text-[#6c5ce7]">Byron Antonio Navarrete Cano</p><p className="text-[9px] text-theme-dim mt-0.5 leading-relaxed">Manager de ideas · Asesoramiento</p></div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5 shadow-sm">2</span>
                    <div><p className="text-[11px] font-bold text-amber-400">Edwin</p><p className="text-[9px] text-theme-dim mt-0.5 leading-relaxed">Imágenes en la proyección · Proyección de documentos</p></div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 text-white flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5 shadow-sm">3</span>
                    <div><p className="text-[11px] font-bold text-purple-400">Jehiel</p><p className="text-[9px] text-theme-dim mt-0.5 leading-relaxed">Filtrar Biblia por versión · Agregar archivos desde la interfaz · Información de prédica</p></div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-[#6c5ce7]/10 border border-[#6c5ce7]/20">
                <span className="text-[9px] text-theme-dim">Versión</span>
                <span className="text-[10px] font-bold text-[#6c5ce7]">{version}</span>
              </div>
            </div>
            <div className="px-5 pb-5">
              <button onClick={() => setShowInfo(false)} className="w-full py-2.5 bg-gradient-to-r from-[#6c5ce7] to-[#a855f7] text-white rounded-xl text-[10px] font-bold hover:opacity-90 transition-opacity shadow-lg shadow-[#6c5ce7]/20">Cerrar</button>
            </div>
          </div>
        </>
      )}
    </header>
  )
}
