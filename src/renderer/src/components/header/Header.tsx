import { useState, useEffect } from 'react'
import { Radio, Minus, Square, X, Info, User, Lightbulb, Sparkles, RefreshCw, Monitor } from 'lucide-react'
import ThemeToggle from '../theme/ThemeToggle'
import ModuleMenu from '../ModuleMenu'
import LanguageSwitcher from '../LanguageSwitcher'
import { useLang } from '../../i18n'
import ScreensModal from '../ScreensModal'
import { fileUrl } from '../../utils'

export default function Header() {
  const { t } = useLang()
  const [showScreens, setShowScreens] = useState(false)
  const [isLive, setIsLive] = useState(true)
  const [time, setTime] = useState(new Date())
  const [version, setVersion] = useState('1.0.0')
  const [appName, setAppName] = useState('SOFTWARE PREMIUM+')
  const [subName, setSubName] = useState('PARA IGLESIAS')
  const [logoSrc, setLogoSrc] = useState<string | null>(null)

  const [showInfo, setShowInfo] = useState(false)

  useEffect(() => {
    window.api.app.getVersion().then(v => { if (v) setVersion(v) }).catch(() => {})
    Promise.all([
      window.api.app.getConfig(),
      window.api.app.getLogo()
    ]).then(([configRes, logoRes]) => {
      if (configRes.success && configRes.data) {
        const cfg = configRes.data as Record<string, string>
        if (cfg.headerTitle) setAppName(cfg.headerTitle)
        if (cfg.headerSub) setSubName(cfg.headerSub)
      }
      if (logoRes.success && logoRes.data) setLogoSrc(fileUrl(logoRes.data.filePath))
    }).catch(() => {})
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
    <header className="shrink-0 bg-[#050816] bg-theme border-b border-[rgba(120,80,255,0.2)] border-theme drag relative">
      {/* Top row */}
      <div className="flex items-center justify-between px-4 h-[60px]">
        <div className="flex items-center gap-3">
          {logoSrc && (
            <img src={logoSrc} alt="Logo" className="h-10 w-auto rounded-lg object-contain" />
          )}
          <div>
            <h1 className="text-sm font-bold text-white text-theme tracking-wide">{appName}</h1>
            <p className="text-[10px] text-[#6b7280] -mt-0.5">{subName}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 no-drag">
          <div className={`flex items-center gap-2 rounded-lg px-3 py-1.5 transition-colors ${isLive ? 'bg-green-600/15 border border-green-500/30' : 'bg-red-600/15 border border-red-500/30'}`}>
            <Radio size={12} className={`${isLive ? 'text-green-500' : 'text-red-500'} animate-pulse`} />
            <span className={`text-[10px] font-bold tracking-widest ${isLive ? 'text-green-400' : 'text-red-400'}`}>{t('app.live')}</span>
          </div>
          <button onClick={() => setShowInfo(true)}
            className="p-1.5 hover:bg-[#6c5ce7]/20 rounded-lg transition-colors" title="Información del sistema">
            <Info size={12} className="text-[#6c5ce7]" />
          </button>
          <button onClick={() => window.api.update.checkNow()} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors" title="Buscar actualizaciones">
            <RefreshCw size={11} className="text-gray-400" />
          </button>
          <div className="text-right">
            <p className="text-lg font-bold text-white text-theme tabular-nums leading-tight">{timeStr}</p>
            <p className="text-[10px] text-gray-500 text-theme-muted">{dateStr}</p>
          </div>
          <ThemeToggle />
          <LanguageSwitcher />
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

      {/* Nav bar */}
      <div className="flex items-center gap-1 px-4 pb-1.5 no-drag">
        <ModuleMenu />
          <button onClick={() => setShowScreens(true)}
            className="flex items-center gap-1 px-2 py-1 hover:bg-white/5 rounded transition-colors text-[10px] text-gray-500 text-theme-muted hover:text-theme">
            <Monitor size={12} /> {t('nav.pantalla')}
          </button>
        {showScreens && <ScreensModal open={showScreens} onClose={() => setShowScreens(false)} />}
        <div className="flex-1" />
      </div>
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
                    <p>✓ Logo personalizado</p>
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
                    <div><p className="text-[11px] font-bold text-amber-400">Edwin Gaitán Castro <span className="text-[9px] text-amber-400/70 font-normal">(Colaborador)</span></p><p className="text-[9px] text-theme-dim mt-0.5 leading-relaxed">Imágenes en la proyección · Proyección de documentos</p><p className="text-[9px] text-theme-dim leading-relaxed">Control de tiempo</p></div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-teal-600 text-white flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5 shadow-sm">4</span>
                    <div><p className="text-[11px] font-bold text-green-400">Fernando Gaitán Méndez <span className="text-[9px] text-green-400/70 font-normal">(Tester)</span></p><p className="text-[9px] text-theme-dim mt-0.5 leading-relaxed">Pruebas de funcionalidad y reproducción de video</p></div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 text-white flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5 shadow-sm">3</span>
                    <div><p className="text-[11px] font-bold text-purple-400">Jehiel <span className="text-[9px] text-purple-400/70 font-normal">(Colaborador)</span></p><p className="text-[9px] text-theme-dim mt-0.5 leading-relaxed">Filtrar Biblia por versión · Agregar archivos desde la interfaz · Información de prédica</p></div>
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
