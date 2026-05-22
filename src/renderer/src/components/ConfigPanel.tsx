import { useState, useEffect, useCallback } from 'react'
import { Monitor, Keyboard, BookOpen, Wifi, Radio, Sun, Save, Trash2, Download, Upload, X, ChevronRight, Eye, EyeOff, Globe, Sliders, Image } from 'lucide-react'
import LanguageSwitcher from './LanguageSwitcher'
import { fileUrl } from '../utils'
import { useToast } from './Toast'

interface Translation {
  id: number
  nombre: string
  abreviatura: string
  idioma: string
  activa: number
}

interface DisplayInfo {
  id: number
  name: string
  bounds: { x: number; y: number; width: number; height: number }
  primary: boolean
}

type Tab = 'general' | 'pantallas' | 'traducciones' | 'atajos' | 'websocket' | 'temas'

export default function ConfigPanel() {
  const { toast } = useToast()
  const [tab, setTab] = useState<Tab>('general')
  const [config, setConfig] = useState<Record<string, any>>({})
  const [dirty, setDirty] = useState(false)
  const [saved, setSaved] = useState(false)
  const [translations, setTranslations] = useState<Translation[]>([])
  const [displays, setDisplays] = useState<DisplayInfo[]>([])
  const [appDisplayId, setAppDisplayId] = useState<number | null>(null)

  const [overlayOpacity, setOverlayOpacity] = useState(80)
  const [primaryMonitor, setPrimaryMonitor] = useState('')
  const [wsEnabled, setWsEnabled] = useState(false)
  const [wsPort, setWsPort] = useState(9090)
  const [shortcuts, setShortcuts] = useState<{ key: string; desc: string }[]>([])
  const [logoSrc, setLogoSrc] = useState<string | null>(null)
  const [loadingLogo, setLoadingLogo] = useState(false)
  const [headerTitle, setHeaderTitle] = useState('')
  const [headerSub, setHeaderSub] = useState('')
  const [newShortcutKey, setNewShortcutKey] = useState('')
  const [newShortcutDesc, setNewShortcutDesc] = useState('')
  const [recordingShortcut, setRecordingShortcut] = useState(false)

  useEffect(() => {
    loadConfig()
    loadTranslations()
    loadDisplays()
    loadShortcuts()
    loadLogo()
  }, [])

  useEffect(() => {
    if (saved) {
      const t = setTimeout(() => setSaved(false), 2000)
      return () => clearTimeout(t)
    }
  }, [saved])

  const loadConfig = async () => {
    const res = await window.api.app.getConfig()
    if (res.success && res.data) {
      const cfg = res.data as Record<string, any>
      setConfig(cfg)
      if (cfg.overlayOpacity != null) setOverlayOpacity(cfg.overlayOpacity)
      if (cfg.primaryMonitor) setPrimaryMonitor(cfg.primaryMonitor)
      if (cfg.wsEnabled != null) setWsEnabled(cfg.wsEnabled)
      if (cfg.wsPort) setWsPort(cfg.wsPort)
    }
  }

  const loadTranslations = async () => {
    const res = await window.api.bible.getAllTranslations()
    if (res.success && res.data) setTranslations(res.data)
  }

  const loadDisplays = async () => {
    const res = await window.api.screen.getLayout()
    setDisplays(res.displays)
    setAppDisplayId(res.appDisplayId)
  }

  const loadLogo = async () => {
    const logoRes = await window.api.app.getLogo()
    if (logoRes.success && logoRes.data) setLogoSrc(fileUrl(logoRes.data.filePath))
    const configRes = await window.api.app.getConfig()
    if (configRes.success && configRes.data) {
      const cfg = configRes.data as Record<string, string>
      if (cfg.headerTitle) setHeaderTitle(cfg.headerTitle)
      if (cfg.headerSub) setHeaderSub(cfg.headerSub)
    }
  }

  const handleSelectLogo = async () => {
    setLoadingLogo(true)
    try {
      const res = await window.api.app.selectAndSaveLogo()
      if (res.success && res.data) setLogoSrc(fileUrl(res.data.filePath))
    } finally { setLoadingLogo(false) }
  }

  const handleRemoveLogo = () => setLogoSrc(null)

  const loadShortcuts = () => {
    try {
      const saved = localStorage.getItem('shortcuts')
      if (saved) setShortcuts(JSON.parse(saved))
    } catch {}
  }

  const saveAll = useCallback(async () => {
    const newConfig: Record<string, any> = {
      ...config,
      overlayOpacity,
      primaryMonitor,
      wsEnabled,
      wsPort
    }
    if (headerTitle || headerSub) {
      newConfig.headerTitle = headerTitle
      newConfig.headerSub = headerSub
    }
    await window.api.app.saveConfig(newConfig)
    setConfig(newConfig)
    if (shortcuts.length) localStorage.setItem('shortcuts', JSON.stringify(shortcuts))
    setDirty(false)
    setSaved(true)
    window.api.projector.updateConfig({ overlayOpacity })
    window.dispatchEvent(new CustomEvent('config:changed', { detail: { overlayOpacity } }))
    toast('Configuración guardada', 'success')
  }, [config, overlayOpacity, primaryMonitor, wsEnabled, wsPort, shortcuts])

  const toggleTranslation = async (id: number, active: boolean) => {
    await window.api.bible.setTranslationActive(id, active)
    setTranslations(prev => prev.map(t => t.id === id ? { ...t, activa: active ? 1 : 0 } : t))
  }

  const deleteTranslation = async (id: number) => {
    const t = translations.find(t => t.id === id)
    if (!t) return
    await window.api.bible.deleteTranslation(id)
    setTranslations(prev => prev.filter(t => t.id !== id))
  }

  const startRecording = () => {
    setRecordingShortcut(true)
    setNewShortcutKey('Presiona una tecla...')
    const handler = (e: KeyboardEvent) => {
      e.preventDefault()
      const combo: string[] = []
      if (e.ctrlKey) combo.push('Ctrl')
      if (e.altKey) combo.push('Alt')
      if (e.shiftKey) combo.push('Shift')
      combo.push(e.key === ' ' ? 'Espacio' : e.key)
      setNewShortcutKey(combo.join('+'))
      setRecordingShortcut(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }

  const addShortcut = () => {
    if (!newShortcutKey || !newShortcutDesc.trim()) return
    setShortcuts(prev => [...prev, { key: newShortcutKey, desc: newShortcutDesc.trim() }])
    setNewShortcutKey('')
    setNewShortcutDesc('')
    setDirty(true)
  }

  const removeShortcut = (idx: number) => {
    setShortcuts(prev => prev.filter((_, i) => i !== idx))
    setDirty(true)
  }

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'general', label: 'General', icon: Sliders },
    { id: 'pantallas', label: 'Pantallas', icon: Monitor },
    { id: 'traducciones', label: 'Biblias', icon: BookOpen },
    { id: 'atajos', label: 'Atajos', icon: Keyboard },
    { id: 'websocket', label: 'Remoto', icon: Wifi },
  ]

  return (
    <div className="h-full bg-theme-panel rounded-xl overflow-hidden flex flex-col border border-theme">
      <div className="flex items-center justify-between px-3 py-2 border-b border-theme shrink-0">
        <h3 className="text-xs font-bold text-theme flex items-center gap-1.5">
          <Sliders size={13} className="text-[#6c5ce7]" /> Configuración
        </h3>
        <div className="flex items-center gap-2">
          {saved && <span className="text-[10px] text-green-400 font-medium">Guardado</span>}
          {dirty && (
            <button onClick={saveAll} className="flex items-center gap-1 px-2.5 py-1 bg-[#6c5ce7] rounded text-[10px] text-white font-medium hover:bg-[#5a4bd1] transition-colors">
              <Save size={10} /> Guardar
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-0 flex-1 min-h-0">
        <div className="w-36 shrink-0 border-r border-theme p-1.5 space-y-0.5 overflow-y-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] transition-colors ${
                tab === t.id ? 'bg-[#6c5ce7]/15 text-[#6c5ce7] font-medium' : 'text-theme-dim hover:text-theme hover:bg-theme-card'
              }`}>
              <t.icon size={12} />
              <span className="truncate">{t.label}</span>
              {tab === t.id && <ChevronRight size={10} className="ml-auto shrink-0" />}
            </button>
          ))}
        </div>

        <div className="flex-1 p-3 overflow-y-auto min-h-0">
          {tab === 'general' && (
            <div className="space-y-4">
              <SectionTitle icon={Image} title="Logotipo" />
              <div className="flex items-center gap-2">
                {logoSrc && <img src={logoSrc} alt="Logo" className="h-12 w-12 rounded-lg object-cover border border-theme" />}
                <button onClick={handleSelectLogo} disabled={loadingLogo}
                  className="flex items-center gap-1.5 px-3 py-2 bg-theme-card rounded-lg text-[10px] text-theme-muted hover:text-theme border border-theme transition-colors">
                  <Image size={12} /> {loadingLogo ? 'Cargando...' : logoSrc ? 'Cambiar' : 'Seleccionar'}
                </button>
                {logoSrc && (
                  <button onClick={handleRemoveLogo} className="p-2 hover:bg-red-500/20 rounded-lg transition-colors">
                    <Trash2 size={12} className="text-gray-500 hover:text-red-400" />
                  </button>
                )}
              </div>

              <SectionTitle icon={Radio} title="Encabezado" />
              <div className="space-y-2">
                <div>
                  <label className="text-[10px] text-theme-dim block mb-1">Título</label>
                  <input type="text" value={headerTitle} onChange={e => setHeaderTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-theme-card rounded-lg text-[10px] text-theme border border-theme outline-none focus:border-[#6c5ce7]" />
                </div>
                <div>
                  <label className="text-[10px] text-theme-dim block mb-1">Subtítulo</label>
                  <input type="text" value={headerSub} onChange={e => setHeaderSub(e.target.value)}
                    className="w-full px-3 py-2 bg-theme-card rounded-lg text-[10px] text-theme border border-theme outline-none focus:border-[#6c5ce7]" />
                </div>
              </div>

              <SectionTitle icon={Globe} title="Idioma / Language" />
              <LanguageSwitcher />
              <div className="border-t border-theme pt-4" />
              <SectionTitle icon={Sun} title="Apariencia" />
              <div>
                <label className="text-[10px] text-theme-dim block mb-1">Opacidad del overlay (%)</label>
                <div className="flex items-center gap-2">
                  <input type="range" min={20} max={100} value={overlayOpacity} onChange={e => { setOverlayOpacity(Number(e.target.value)); setDirty(true) }}
                    className="w-full accent-[#6c5ce7]" />
                  <span className="text-[10px] text-theme w-8 text-right">{overlayOpacity}%</span>
                </div>
              </div>

              <div className="border-t border-theme pt-4">
                <SectionTitle icon={Radio} title="Comportamiento" />
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={config.projectionFollowsVerse ?? true}
                      onChange={e => { setConfig(prev => ({ ...prev, projectionFollowsVerse: e.target.checked })); setDirty(true) }}
                      className="accent-[#6c5ce7]" />
                    <span className="text-[10px] text-theme">Proyección sigue al versículo seleccionado</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={config.autoProjectNewChapter ?? false}
                      onChange={e => { setConfig(prev => ({ ...prev, autoProjectNewChapter: e.target.checked })); setDirty(true) }}
                      className="accent-[#6c5ce7]" />
                    <span className="text-[10px] text-theme">Proyectar automáticamente al cambiar de capítulo</span>
                  </label>
                </div>
              </div>

              <div className="border-t border-theme pt-4">
                <SectionTitle icon={Download} title="Datos" />
                <div className="flex gap-2">
                  <button onClick={async () => { const r = await window.api.backup.create(); if (r.success) setSaved(true) }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-theme-card rounded-lg text-[10px] text-theme-muted hover:text-theme border border-theme transition-colors">
                    <Download size={11} /> Crear respaldo
                  </button>
                  <button onClick={async () => { const r = await window.api.backup.restore(); if (r.success) { alert('Restauración exitosa. Reinicia la app.'); window.api.app.quit() } }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-theme-card rounded-lg text-[10px] text-theme-muted hover:text-theme border border-theme transition-colors">
                    <Upload size={11} /> Restaurar
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === 'pantallas' && (
            <div className="space-y-3">
              <SectionTitle icon={Monitor} title="Monitores" />
              <div className="space-y-1.5">
                {displays.map(d => (
                  <div key={d.id}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                      d.id === appDisplayId ? 'bg-[#6c5ce7]/10 border-[#6c5ce7]/30' : 'bg-theme-card border-theme'
                    }`}>
                    <Monitor size={12} className={d.primary ? 'text-[#00d4ff]' : 'text-theme-dim'} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-theme truncate">{d.name}</p>
                      <p className="text-[9px] text-theme-dim">{d.bounds.width}×{d.bounds.height}{d.primary ? ' · Principal' : ''}</p>
                    </div>
                    {d.id === appDisplayId ? (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#6c5ce7]/20 text-[#6c5ce7] shrink-0">Control</span>
                    ) : (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 shrink-0">Proyección</span>
                    )}
                  </div>
                ))}
              </div>

              <div className="border-t border-theme pt-4">
                <SectionTitle icon={Eye} title="Overlay" />
                <div className="space-y-2">
                  <label className="text-[10px] text-theme-dim block mb-1">Opacidad del overlay de texto</label>
                  <input type="range" min={20} max={100} value={overlayOpacity} onChange={e => { setOverlayOpacity(Number(e.target.value)); setDirty(true) }}
                    className="w-full accent-[#6c5ce7]" />
                  <div className="flex items-center gap-2 mt-1">
                    <EyeOff size={11} className="text-theme-dim" />
                    <div className="flex-1 h-3 rounded-full bg-gradient-to-r from-transparent via-[#6c5ce7] to-white" style={{ opacity: overlayOpacity / 100 }} />
                    <Eye size={11} className="text-theme-dim" />
                    <span className="text-[10px] text-theme w-8 text-right">{overlayOpacity}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'traducciones' && (
            <div className="space-y-2">
              <SectionTitle icon={BookOpen} title="Traducciones bíblicas" />
              <p className="text-[9px] text-theme-dim mb-2">Activa o desactiva las traducciones disponibles. Las desactivadas no aparecerán en el selector de Biblia.</p>
              {translations.length === 0 ? (
                <p className="text-[10px] text-theme-dim italic">No hay traducciones instaladas. Descarga una desde el módulo Biblia.</p>
              ) : (
                translations.map(t => (
                  <div key={t.id} className="flex items-center gap-2 px-3 py-2 bg-theme-card rounded-lg border border-theme">
                    <button onClick={() => toggleTranslation(t.id, !t.activa)}
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                        t.activa ? 'bg-[#6c5ce7] border-[#6c5ce7]' : 'border-theme-dim/40'
                      }`}>
                      {t.activa && <Eye size={8} className="text-white" />}
                    </button>
                    <Globe size={11} className="text-[#00d4ff] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-theme truncate">{t.nombre}</p>
                      <p className="text-[8px] text-theme-dim">{t.abreviatura} · {t.idioma.toUpperCase()}</p>
                    </div>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${t.activa ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-500'}`}>
                      {t.activa ? 'Activa' : 'Inactiva'}
                    </span>
                    <button onClick={() => deleteTranslation(t.id)}
                      className="p-1 text-theme-dim hover:text-red-400 transition-colors" title="Eliminar traducción">
                      <Trash2 size={10} />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'atajos' && (
            <div className="space-y-3">
              <SectionTitle icon={Keyboard} title="Atajos de teclado" />
              <div className="space-y-1">
                {shortcuts.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 px-2 py-1.5 bg-theme-card rounded-lg border border-theme">
                    <kbd className="px-2 py-0.5 bg-[#1e1e3a] rounded text-[10px] font-mono text-[#6c5ce7] min-w-[80px] text-center border border-[#6c5ce7]/30">{s.key}</kbd>
                    <span className="flex-1 text-[10px] text-theme">{s.desc}</span>
                    <button onClick={() => removeShortcut(i)} className="p-0.5 text-theme-dim hover:text-red-400 transition-colors">
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="border-t border-theme pt-3">
                <p className="text-[10px] text-theme-dim font-medium mb-2">Agregar nuevo atajo</p>
                <div className="flex items-center gap-2">
                  <button onClick={startRecording}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-mono border transition-colors ${
                      recordingShortcut ? 'bg-[#6c5ce7]/20 border-[#6c5ce7] text-[#6c5ce7] animate-pulse' : 'bg-theme-card border-theme text-theme-dim hover:text-theme'
                    }`}>
                    {newShortcutKey || 'Click para grabar'}
                  </button>
                  <input type="text" value={newShortcutDesc} onChange={e => setNewShortcutDesc(e.target.value)}
                    placeholder="Descripción del atajo..."
                    className="flex-1 px-2 py-1.5 bg-theme-card rounded-lg text-[10px] text-theme border border-theme outline-none focus:border-[#6c5ce7]" />
                  <button onClick={addShortcut} disabled={!newShortcutKey || !newShortcutDesc.trim()}
                    className="px-2 py-1.5 bg-[#6c5ce7] rounded-lg text-[10px] text-white disabled:opacity-40 hover:bg-[#5a4bd1] transition-colors">
                    <Save size={11} />
                  </button>
                </div>
              </div>
              <div className="border-t border-theme pt-3">
                <button onClick={() => { localStorage.setItem('shortcuts', JSON.stringify(shortcuts)); setSaved(true) }}
                  className="w-full py-2 bg-[#6c5ce7]/20 text-[#6c5ce7] rounded-lg text-[10px] font-medium hover:bg-[#6c5ce7]/30 transition-colors">
                  Guardar todos los atajos
                </button>
              </div>
            </div>
          )}

          {tab === 'websocket' && (
            <div className="space-y-4">
              <SectionTitle icon={Wifi} title="Control remoto vía WebSocket" />
              <p className="text-[9px] text-theme-dim leading-relaxed">
                Permite controlar la proyección desde un celular u otro dispositivo en la misma red local.
                Escanea el código QR o ingresa la IP y puerto en tu navegador.
              </p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={wsEnabled} onChange={e => { setWsEnabled(e.target.checked); setDirty(true) }}
                  className="accent-[#6c5ce7]" />
                <span className="text-[11px] text-theme font-medium">Habilitar servidor WebSocket</span>
              </label>
              {wsEnabled && (
                <div>
                  <label className="text-[10px] text-theme-dim block mb-1">Puerto</label>
                  <input type="number" value={wsPort} onChange={e => { setWsPort(Number(e.target.value)); setDirty(true) }}
                    min={1024} max={65535}
                    className="w-24 px-2 py-1.5 bg-theme-card rounded-lg text-[10px] text-theme border border-theme outline-none focus:border-[#6c5ce7]" />
                  <p className="text-[8px] text-theme-dim mt-1">Puerto recomendado: 9090 (predeterminado)</p>
                </div>
              )}
              <div className="bg-theme-card rounded-lg p-3 border border-theme">
                <p className="text-[10px] text-theme-dim font-medium mb-1">Cómo conectarte:</p>
                <ol className="text-[9px] text-theme-dim space-y-1 list-decimal list-inside">
                  <li>Activa el servidor WebSocket arriba</li>
                  <li>Asegúrate de que tu celular esté en la misma red WiFi</li>
                  <li>Abre el navegador del celular y ve a: <code className="text-[#00d4ff]">http://&lt;IP-DE-TU-PC&gt;:{wsPort}</code></li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>

      {dirty && (
        <div className="px-3 py-2 border-t border-theme flex items-center justify-between shrink-0 bg-[#6c5ce7]/5">
          <span className="text-[9px] text-theme-dim">Tienes cambios sin guardar</span>
          <button onClick={saveAll} className="flex items-center gap-1 px-3 py-1.5 bg-[#6c5ce7] rounded-lg text-[10px] text-white font-medium hover:bg-[#5a4bd1] transition-colors">
            <Save size={10} /> Guardar cambios
          </button>
        </div>
      )}
    </div>
  )
}

function SectionTitle({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <p className="text-[10px] text-[#6c5ce7] font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
      <Icon size={12} /> {title}
    </p>
  )
}
