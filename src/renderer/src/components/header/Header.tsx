import { useState, useEffect } from 'react'
import { Radio, Minus, Square, X, Settings, Image, Trash2 } from 'lucide-react'
import ThemeToggle from '../theme/ThemeToggle'

const NAV_ITEMS = [
  'Biblia Interactiva',
  'Proyección Multipantalla',
  'Automatización',
  'Producción en Vivo'
]

export default function Header() {
  const [time, setTime] = useState(new Date())
  const [showSettings, setShowSettings] = useState(false)
  const [appName, setAppName] = useState('SOFTWARE PREMIUM')
  const [subName, setSubName] = useState('PARA IGLESIAS')
  const [editName, setEditName] = useState('')
  const [editSub, setEditSub] = useState('')
  const [logoSrc, setLogoSrc] = useState<string | null>(null)
  const [loadingLogo, setLoadingLogo] = useState(false)

  useEffect(() => {
    Promise.all([
      window.api.app.getConfig(),
      window.api.app.getLogo()
    ]).then(([configRes, logoRes]) => {
      if (configRes.success && configRes.data) {
        const cfg = configRes.data as Record<string, string>
        if (cfg.headerTitle) setAppName(cfg.headerTitle)
        if (cfg.headerSub) setSubName(cfg.headerSub)
      }
      if (logoRes.success && logoRes.data) setLogoSrc(logoRes.data.dataUrl)
    })
  }, [])

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
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
        setLogoSrc(res.data.dataUrl)
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
        <nav className="flex items-center gap-3 no-drag">
          {NAV_ITEMS.map((item, i) => (
            <div key={item} className="flex items-center gap-3">
              <button className="text-[11px] text-gray-400 text-theme-muted hover:text-white text-theme transition-colors whitespace-nowrap">{item}</button>
              {i < NAV_ITEMS.length - 1 && <span className="w-1 h-1 rounded-full bg-[#6c5ce7]" />}
            </div>
          ))}
        </nav>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4 no-drag">
        <div className="flex items-center gap-2 bg-red-600/15 border border-red-500/30 rounded-lg px-3 py-1.5">
          <Radio size={12} className="text-red-500 animate-pulse" />
          <span className="text-[10px] font-bold text-red-400 tracking-widest">EN VIVO</span>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-white text-theme tabular-nums leading-tight">{timeStr}</p>
          <p className="text-[10px] text-gray-500 text-theme-muted">{dateStr}</p>
        </div>
        <div className="flex items-center gap-1 ml-2 pl-4 border-l border-[rgba(120,80,255,0.2)]">
          <button onClick={openSettings} className="p-1.5 hover:bg-white/5 rounded transition-colors" title="Configuración">
            <Settings size={12} className="text-gray-500 text-theme-muted" />
          </button>
          <ThemeToggle />
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
                <label className="text-[8px] text-gray-500 text-theme-muted block mb-1">Nombre principal</label>
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-2 py-1.5 bg-[#091225] bg-theme-card rounded-lg text-[10px] text-gray-200 text-theme border border-[rgba(120,80,255,0.15)] border-theme outline-none focus:border-[rgba(120,80,255,0.5)]" />
              </div>
              <div>
                <label className="text-[8px] text-gray-500 text-theme-muted block mb-1">Subtítulo</label>
                <input type="text" value={editSub} onChange={(e) => setEditSub(e.target.value)}
                  className="w-full px-2 py-1.5 bg-[#091225] bg-theme-card rounded-lg text-[10px] text-gray-200 text-theme border border-[rgba(120,80,255,0.15)] border-theme outline-none focus:border-[rgba(120,80,255,0.5)]" />
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
    </header>
  )
}
