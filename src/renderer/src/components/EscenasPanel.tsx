import { useState, useEffect, useRef } from 'react'
import { Image as ImageIcon, Trash2, Check, Plus, FolderOpen, Monitor, ListTodo, Sparkles, Edit3 } from 'lucide-react'
import { ANIM_GROUPS } from '../constants'
import AnimSelectorModal from './shared/AnimSelectorModal'
import ImageEditor from './shared/ImageEditor'
import { fileUrl } from '../utils'
import { useLang } from '../i18n'

interface BackgroundImage {
  id: string
  name: string
  filePath: string
}

interface Tarea {
  id: number
  nombre: string
  fecha_creacion: string
  imagen_count: number
}

interface TareaImagen {
  id: number
  nombre: string
  filePath: string
}

interface EscenasPanelProps {
  backgroundUrl: string | null
  onSelectBackground: (url: string | null) => void
  onProjectVerse: (text: string, reference: string) => void
  onProjectImage?: (img: string, name: string) => void
}

interface Anuncio {
  id: number
  texto: string
  animacion: string
}

const ANUNCIO_ANIM_IDS = ['anim-fade', 'anim-dissolve', 'anuncio-blur-in', 'anuncio-slide-up', 'anuncio-drop-in', 'anuncio-float-in', 'anuncio-bounce', 'anuncio-flip', 'anuncio-zoom', 'anuncio-swirl-in', 'anuncio-glow', 'anuncio-gradient', 'anuncio-fire', 'letra-fade', 'letra-slide-up', 'letra-pop', 'letra-bounce', 'letra-flip']

const ANIM_CATEGORIES = ANIM_GROUPS.filter(g => g.items.some(a => ANUNCIO_ANIM_IDS.includes(a.id))).map(g => ({
  ...g,
  items: g.items.filter(a => ANUNCIO_ANIM_IDS.includes(a.id))
}))

const DURACIONES = [
  { id: 3, label: '3s', labelKey: 'escenas.duration.3s' as const },
  { id: 5, label: '5s', labelKey: 'escenas.duration.5s' as const },
  { id: 8, label: '8s', labelKey: 'escenas.duration.8s' as const },
  { id: 10, label: '10s', labelKey: 'escenas.duration.10s' as const },
  { id: 15, label: '15s', labelKey: 'escenas.duration.15s' as const },
  { id: 30, label: '30s', labelKey: 'escenas.duration.30s' as const },
  { id: 0, label: '∞ Manual', labelKey: 'escenas.duration.manual' as const },
]

const BG_ANIMS_IN = [
  { id: 'anuncio-bg-fade-in', label: 'Fundido in', labelKey: 'escenas.bgAnim.anuncio-bg-fade-in' as const },
  { id: 'anuncio-bg-slide-up', label: 'Subir in', labelKey: 'escenas.bgAnim.anuncio-bg-slide-up' as const },
  { id: 'anuncio-bg-zoom-in', label: 'Zoom in', labelKey: 'escenas.bgAnim.anuncio-bg-zoom-in' as const },
]

const BG_ANIMS_OUT = [
  { id: 'anuncio-bg-fade-out', label: 'Fundido out', labelKey: 'escenas.bgAnim.anuncio-bg-fade-out' as const },
  { id: 'anuncio-bg-slide-down', label: 'Bajar out', labelKey: 'escenas.bgAnim.anuncio-bg-slide-down' as const },
  { id: 'anuncio-bg-zoom-out', label: 'Zoom out', labelKey: 'escenas.bgAnim.anuncio-bg-zoom-out' as const },
]

const BG_CATEGORIES = [
  {
    labelKey: 'escenas.bgCat.desvanecidos', items: [
      { id: 'anuncio-bg-soft-lavender', labelKey: 'escenas.bgItem.anuncio-bg-soft-lavender' },
      { id: 'anuncio-bg-soft-sky', labelKey: 'escenas.bgItem.anuncio-bg-soft-sky' },
      { id: 'anuncio-bg-glass', labelKey: 'escenas.bgItem.anuncio-bg-glass' },
      { id: 'anuncio-bg-fade', labelKey: 'escenas.bgItem.anuncio-bg-fade' },
    ]
  },
  {
    labelKey: 'escenas.bgCat.elegantes', items: [
      { id: 'anuncio-bg-midnight', labelKey: 'escenas.bgItem.anuncio-bg-midnight' },
      { id: 'anuncio-bg-gradient', labelKey: 'escenas.bgItem.anuncio-bg-gradient' },
      { id: 'anuncio-bg-circles', labelKey: 'escenas.bgItem.anuncio-bg-circles' },
      { id: 'anuncio-bg-waves', labelKey: 'escenas.bgItem.anuncio-bg-waves' },
    ]
  },
  {
    labelKey: 'escenas.bgCat.dinamicos', items: [
      { id: 'anuncio-bg-rainbow', labelKey: 'escenas.bgItem.anuncio-bg-rainbow' },
      { id: 'anuncio-bg-neon', labelKey: 'escenas.bgItem.anuncio-bg-neon' },
      { id: 'anuncio-bg-sunset', labelKey: 'escenas.bgItem.anuncio-bg-sunset' },
      { id: 'anuncio-bg-ocean', labelKey: 'escenas.bgItem.anuncio-bg-ocean' },
    ]
  },
]

const ANUNCIO_SIZES = [
  { id: 'anuncio-sm', labelKey: 'escenas.size.small' },
  { id: 'anuncio-md', labelKey: 'escenas.size.medium' },
  { id: 'anuncio-lg', labelKey: 'escenas.size.large' },
  { id: 'anuncio-xl', labelKey: 'escenas.size.xlarge' },
]

const ANUNCIO_FONTS = [
  { id: 'anuncio-font-normal', labelKey: 'escenas.font.normal' },
  { id: 'anuncio-font-bold', labelKey: 'escenas.font.bold' },
  { id: 'anuncio-font-light', labelKey: 'escenas.font.light' },
  { id: 'anuncio-font-italic', labelKey: 'escenas.font.italic' },
  { id: 'anuncio-font-cursive', labelKey: 'escenas.font.cursive' },
]

const COLOR_CATEGORIES = [
  {
    labelKey: 'escenas.colorCat.premium', items: [
      { id: 'anuncio-color-white', labelKey: 'escenas.color.white' },
      { id: 'anuncio-color-gold', labelKey: 'escenas.color.gold' },
      { id: 'anuncio-color-gradient', labelKey: 'escenas.color.violet' },
      { id: 'anuncio-color-gradient2', labelKey: 'escenas.color.fire' },
      { id: 'anuncio-color-sunset', labelKey: 'escenas.color.sunset' },
      { id: 'anuncio-color-ocean', labelKey: 'escenas.color.ocean' },
      { id: 'anuncio-color-aurora', labelKey: 'escenas.color.aurora' },
      { id: 'anuncio-color-rainbow', labelKey: 'escenas.color.rainbow' },
      { id: 'anuncio-color-neon', labelKey: 'escenas.color.neon' },
    ]
  },
]

const allAnuncioAnims = ANIM_CATEGORIES.flatMap((c) => c.items)

export default function EscenasPanel({ backgroundUrl, onSelectBackground, onProjectVerse, onProjectImage }: EscenasPanelProps) {
  const { t } = useLang()
  const [tab, setTab] = useState<'fondos' | 'imagenes'>('fondos')
  const [images, setImages] = useState<BackgroundImage[]>([])
  const [animFondos, setAnimFondos] = useState('anim-fade')
  const [announcements, setAnnouncements] = useState<Anuncio[]>([])
  const [announceText, setAnnounceText] = useState('')
  const [animIn, setAnimIn] = useState('anuncio-slide-up')
  const [animOut, setAnimOut] = useState('anim-fade')
  const [duracion, setDuracion] = useState(8)
  const [bgAnimIn, setBgAnimIn] = useState('anuncio-bg-fade-in')
  const [bgAnimOut, setBgAnimOut] = useState('anuncio-bg-fade-out')
  const [bgAnuncios, setBgAnuncios] = useState('anuncio-bg-dark')
  const [sizeAnuncios, setSizeAnuncios] = useState('anuncio-lg')
  const [fontAnuncios, setFontAnuncios] = useState('anuncio-font-bold')
  const [colorAnuncios, setColorAnuncios] = useState('anuncio-color-white')
  const [animAnuncios, setAnimAnuncios] = useState('anuncio-slide-up')
  const [proyectadoId, setProyectadoId] = useState<number | null>(null)
  const [showStyleModal, setShowStyleModal] = useState(false)
  const [showFondosModal, setShowFondosModal] = useState(false)
  const prevBgRef = useRef<string | null>(null)
  const [editImage, setEditImage] = useState<BackgroundImage | null>(null)
  const [editImageDataUrl, setEditImageDataUrl] = useState<string | null>(null)
  const [editingTarea, setEditingTarea] = useState(false)

  // Tareas state
  const [tareas, setTareas] = useState<Tarea[]>([])
  const [selectedTarea, setSelectedTarea] = useState<Tarea | null>(null)
  const [tareaImagenes, setTareaImagenes] = useState<TareaImagen[]>([])
  const [newTareaName, setNewTareaName] = useState('')

  const saveConfig = async (key: string, value: string) => {
    const res = await window.api.app.getConfig()
    const cfg = res?.success && res.data ? { ...res.data } : {}
    cfg[key] = value
    await window.api.app.saveConfig(cfg)
  }

  // Load initial data
  useEffect(() => {
    Promise.all([
      window.api.app.getFondos(),
      window.api.app.getConfig(),
      window.api.anuncios.getAll(),
      window.api.tarea.getAll()
    ]).then(([fondosRes, cfgRes, anunRes, tareaRes]) => {
      const cfg = cfgRes?.success && cfgRes.data ? cfgRes.data : {}
      if (fondosRes?.success && fondosRes.data && fondosRes.data.length > 0) {
        setImages(fondosRes.data)
        const savedId = cfg.fondoId as string
        if (savedId) {
          const match = fondosRes.data.find((img) => img.id === savedId)
          if (match) onSelectBackground(fileUrl(match.filePath))
        } else {
          const first = fondosRes.data[0]
          onSelectBackground(fileUrl(first.filePath))
          saveConfig('fondoId', first.id)
        }
      }
      if (cfg.animFondos) setAnimFondos(cfg.animFondos as string)
      if (cfg.animIn) setAnimIn(cfg.animIn as string)
      if (cfg.animOut) setAnimOut(cfg.animOut as string)
      if (cfg.duracion != null) setDuracion(cfg.duracion as number)
      if (cfg.bgAnimIn) setBgAnimIn(cfg.bgAnimIn as string)
      if (cfg.bgAnimOut) setBgAnimOut(cfg.bgAnimOut as string)
      if (cfg.bgAnuncios) setBgAnuncios(cfg.bgAnuncios as string)
      if (cfg.sizeAnuncios) setSizeAnuncios(cfg.sizeAnuncios as string)
      if (cfg.fontAnuncios) setFontAnuncios(cfg.fontAnuncios as string)
      if (cfg.colorAnuncios) setColorAnuncios(cfg.colorAnuncios as string)
      if (anunRes?.success && anunRes.data) setAnnouncements(anunRes.data)
      if (tareaRes?.success && tareaRes.data) setTareas(tareaRes.data)
    })
  }, [])

  useEffect(() => {
    const unsub = window.api.on('medialocal:changed', () => {
      window.api.app.getFondos().then((res) => {
        if (res?.success && res.data) setImages(res.data)
      })
    })
    return () => unsub?.()
  }, [])

  // Load images when a tarea is selected
  useEffect(() => {
    if (!selectedTarea) { setTareaImagenes([]); return }
    window.api.tarea.getImages(selectedTarea.id).then((res) => {
      if (res?.success && res.data) setTareaImagenes(res.data)
    })
  }, [selectedTarea])

  const handleAddImage = async () => {
    const res = await window.api.app.pickImage()
    if (res?.success && res.data) {
      const newImgs: BackgroundImage[] = res.data.map(f => ({ id: `${Date.now()}-${f.filePath}`, name: f.nombre, filePath: f.filePath }))
      setImages([...images, ...newImgs])
    }
  }

  const handleAddAnuncio = async () => {
    const text = announceText.trim()
    if (!text) return
    const res = await window.api.anuncios.create(text, animAnuncios)
    if (res.success && res.data) {
      setAnnouncements([{ id: res.data.id as number, texto: text, animacion: animAnuncios }, ...announcements])
      setAnnounceText('')
    }
  }

  const handleDeleteAnuncio = async (id: number) => {
    await window.api.anuncios.delete(id)
    setAnnouncements(announcements.filter((a) => a.id !== id))
    if (proyectadoId === id) {
      setProyectadoId(null)
      window.api.projector.hideAnnouncement()
    }
  }

  const anuncioTimeoutRef = useRef<ReturnType<typeof setTimeout>>()
  useEffect(() => { return () => { if (anuncioTimeoutRef.current) clearTimeout(anuncioTimeoutRef.current) } }, [])

  const handleProjectAnuncio = (a: Anuncio) => {
    setProyectadoId(a.id)
    window.api.projector.showAnnouncement({
      text: a.texto,
      animIn, animOut, duration: duracion, bg: bgAnuncios, bgAnimIn, bgAnimOut,
      size: sizeAnuncios, font: fontAnuncios, color: colorAnuncios
    })
    if (anuncioTimeoutRef.current) clearTimeout(anuncioTimeoutRef.current)
    if (duracion > 0) anuncioTimeoutRef.current = setTimeout(() => { setProyectadoId(null) }, duracion * 1000 + 800)
  }

  const updateStyle = (key: string, value: string | number) => {
    if (proyectadoId != null) window.api.projector.updateAnnouncement({ [key]: value })
  }

  const handleHideAnuncio = () => {
    setProyectadoId(null)
    window.api.projector.hideAnnouncement()
  }

  // ─── Tarea handlers ───
  const handleCreateTarea = async () => {
    const name = newTareaName.trim()
    if (!name) return
    const res = await window.api.tarea.create(name)
    if (res.success && res.data) {
      const tareaCompleta: Tarea = { ...res.data, fecha_creacion: new Date().toISOString(), imagen_count: 0 }
      setTareas([tareaCompleta, ...tareas])
      setNewTareaName('')
      setSelectedTarea(tareaCompleta)
    }
  }

  const handleDeleteTarea = async (id: number) => {
    await window.api.tarea.delete(id)
    setTareas(tareas.filter((t) => t.id !== id))
    if (selectedTarea?.id === id) setSelectedTarea(null)
  }

  const handleAddTareaImage = async () => {
    if (!selectedTarea) return
    const res = await window.api.tarea.addImage(selectedTarea.id)
    if (res.success && res.data) {
      const added = res.data.added || []
      if (added.length) {
        setTareaImagenes([...tareaImagenes, ...added])
        setTareas(tareas.map((t) => t.id === selectedTarea.id ? { ...t, imagen_count: t.imagen_count + added.length } : t))
      }
    }
  }

  const handleDeleteTareaImage = async (imgId: number) => {
    await window.api.tarea.deleteImage(imgId)
    setTareaImagenes(tareaImagenes.filter((img) => img.id !== imgId))
    if (selectedTarea) setTareas(tareas.map((t) => t.id === selectedTarea.id ? { ...t, imagen_count: t.imagen_count - 1 } : t))
  }

  const handleProjectTareaImage = (img: TareaImagen) => {
    const url = fileUrl(img.filePath)
    const content = { type: 'media', mediaUrl: url, text: img.nombre }
    window.api.projector.sendContent(content)
    onProjectImage?.(url, img.nombre)
  }

  const selected = backgroundUrl ? images.find((img) => fileUrl(img.filePath) === backgroundUrl) : undefined

  return (
    <div className="h-full bg-theme-panel border border-theme rounded-xl flex flex-col overflow-hidden">
      {/* ─── TABS ─── */}
      <div className="flex border-b border-theme shrink-0">
        <button onClick={() => setTab('fondos')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[9px] font-semibold transition-colors ${tab === 'fondos' ? 'text-[#6c5ce7] border-b-2 border-[#6c5ce7]' : 'text-theme-dim hover:text-theme'}`}>
          <ImageIcon size={11} /> {t('escenas.tab.fondos')}
        </button>
        <button onClick={() => setTab('imagenes')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[9px] font-semibold transition-colors ${tab === 'imagenes' ? 'text-[#6c5ce7] border-b-2 border-[#6c5ce7]' : 'text-theme-dim hover:text-theme'}`}>
          <Monitor size={11} /> {t('escenas.tab.imagenes')}
        </button>
      </div>

      {tab === 'fondos' && (
        <>
          {/* ─── FONDOS ─── */}
          <div className="flex flex-col flex-1 min-h-0 border-b border-theme">
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-theme">
              <h3 className="text-[10px] font-semibold text-theme-muted uppercase tracking-wider">{t('escenas.versiculos')}</h3>
              <div className="flex items-center gap-1">
                <span className="text-[9px] text-theme-dim">{images.length}</span>
                <button onClick={handleAddImage}
                  className="p-1 bg-[#6c5ce7]/20 rounded text-[#6c5ce7] hover:bg-[#6c5ce7]/30 transition-colors" title={t('escenas.addFondoTitle')}>
                  <Plus size={10} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              <div className="grid grid-cols-3 gap-1">
                {images.map((img) => {
                  const isSelected = img.id === selected?.id
                  return (
                    <div key={img.id} onClick={() => {
                      if (isSelected) { onSelectBackground(null); saveConfig('fondoId', '') }
                      else { prevBgRef.current = backgroundUrl; onSelectBackground(fileUrl(img.filePath)); saveConfig('fondoId', img.id) }
                    }}
                      className={`relative aspect-[3/2] rounded-md overflow-hidden cursor-pointer transition-all group ${isSelected ? 'ring-2 ring-[#6c5ce7]' : 'ring-1 ring-theme hover:ring-[#6c5ce7]/50'}`}>
                      <img src={fileUrl(img.filePath)} alt="" className="w-full h-full object-cover" loading="lazy" />
                      {isSelected && <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#6c5ce7] flex items-center justify-center shadow-lg"><Check size={8} className="text-white" /></div>}
                      <button onClick={(e) => { e.stopPropagation(); setImages(images.filter((x) => x.id !== img.id)); if (isSelected) onSelectBackground(null) }}
                        className="absolute top-1 left-1 p-0.5 bg-black/50 rounded text-white/80 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={7} /></button>
                    </div>
                  )
                })}
                {images.length === 0 && (
                  <div className="col-span-3 flex flex-col items-center justify-center h-full text-center px-4 py-8">
                    <ImageIcon size={16} className="text-theme-dim mb-1" />
                    <p className="text-[9px] text-theme-dim">{t('escenas.noFondos')}</p>
                    <p className="text-[8px] text-theme-dim mt-0.5">{t('escenas.noFondosDesc')}</p>
                  </div>
                )}
              </div>
              {prevBgRef.current && backgroundUrl && prevBgRef.current !== backgroundUrl && (
                <button onClick={() => { onSelectBackground(prevBgRef.current); prevBgRef.current = null }}
                  className="w-full text-[7px] py-1 mt-1 bg-theme-card text-theme-dim hover:text-theme rounded transition-colors">
                  {t('escenas.restoreBg')}
                </button>
              )}
            </div>
            <div className="px-2 pb-1">
              <button onClick={() => setShowFondosModal(true)}
                className="w-full flex items-center justify-between gap-1 text-[8px] bg-theme-card text-theme-dim px-2 py-1.5 rounded border border-theme outline-none hover:border-[#6c5ce7]/50 transition-colors">
                <span className="truncate">{ANIM_GROUPS.flatMap(g => g.items).find(a => a.id === animFondos)?.label || animFondos}</span>
                <Sparkles size={9} className="shrink-0 text-[#6c5ce7]" />
              </button>
            </div>
          </div>

          <AnimSelectorModal
            open={showFondosModal}
            onClose={() => setShowFondosModal(false)}
            onSave={(animId) => { setAnimFondos(animId); saveConfig('animFondos', animId) }}
            currentAnim={animFondos}
            title={t('escenas.animFondos')}
            previewText={t('escenas.previewText')}
            previewRef={t('escenas.previewRef')}
            previewBg={backgroundUrl || undefined}
          />

        </>
      )}

      {tab === 'imagenes' && (
        <div className="flex flex-1 min-h-0">
          <div className="w-[130px] shrink-0 border-r border-theme flex flex-col">
            <div className="p-1.5 border-b border-theme">
              <div className="flex gap-1">
                <input type="text" value={newTareaName} onChange={(e) => setNewTareaName(e.target.value)} placeholder={t('escenas.newTarea')}
                  className="min-w-0 flex-1 px-1.5 py-1 bg-theme-card rounded text-[8px] text-theme placeholder:text-theme-dim border border-theme outline-none"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCreateTarea() }} />
                <button onClick={handleCreateTarea} className="p-1 shrink-0 bg-[#6c5ce7]/20 rounded text-[#6c5ce7] hover:bg-[#6c5ce7]/30"><Plus size={9} /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-1 space-y-0.5">
              {tareas.map((t) => (
                <div key={t.id} onClick={() => setSelectedTarea(t)}
                  className={`flex items-center gap-1 px-1.5 py-1.5 rounded cursor-pointer text-[8px] transition-colors group ${selectedTarea?.id === t.id ? 'bg-[#6c5ce7]/20 text-[#6c5ce7]' : 'text-theme-dim hover:bg-theme-card hover:text-theme'}`}>
                  <ListTodo size={8} className="shrink-0" />
                  <span className="truncate flex-1">{t.nombre}</span>
                  <span className="text-[7px] text-theme-dim shrink-0">{t.imagen_count}</span>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteTarea(t.id) }}
                    className="p-0.5 text-theme-dim hover:text-red-400 opacity-0 group-hover:opacity-100"><Trash2 size={7} /></button>
                </div>
              ))}
              {tareas.length === 0 && <p className="text-[8px] text-theme-dim text-center py-4">{t('escenas.emptyTareas')}</p>}
            </div>
          </div>

          {/* ─── IMÁGENES DE LA TAREA ─── */}
          <div className="flex-1 flex flex-col min-w-0">
            {selectedTarea ? (
              <>
                <div className="flex items-center justify-between px-2 py-1.5 border-b border-theme shrink-0">
                  <h3 className="text-[9px] font-semibold text-theme truncate">{selectedTarea.nombre}</h3>
                  <button onClick={handleAddTareaImage}
                    className="flex items-center gap-1 px-2 py-1 bg-[#6c5ce7]/20 rounded text-[#6c5ce7] hover:bg-[#6c5ce7]/30 text-[8px] transition-colors">
                    <Plus size={8} /> {t('escenas.addImage')}
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                  <div className="grid grid-cols-2 gap-1.5">
                    {tareaImagenes.map((img) => (
                      <div key={img.id} onClick={() => handleProjectTareaImage(img)}
                        className="relative aspect-[4/3] rounded-lg overflow-hidden cursor-pointer group ring-1 ring-theme hover:ring-[#6c5ce7]/50 transition-all">
                        <img src={fileUrl(img.filePath)} alt="" className="w-full h-full object-cover" loading="lazy" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center pointer-events-none">
                          <Monitor size={16} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-1.5 py-1 pointer-events-none">
                          <p className="text-[7px] text-white/90 truncate">{img.nombre}</p>
                        </div>
                        <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto">
                          <button onClick={(e) => { e.stopPropagation(); setEditImage({ id: img.id.toString(), name: img.nombre, filePath: img.filePath }); setEditImageDataUrl(fileUrl(img.filePath)); setEditingTarea(true) }}
                            className="p-0.5 bg-black/50 rounded text-white/80 hover:text-[#6c5ce7]"><Edit3 size={7} /></button>
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteTareaImage(img.id) }}
                            className="p-0.5 bg-black/50 rounded text-white/80 hover:text-red-400"><Trash2 size={7} /></button>
                        </div>
                      </div>
                    ))}
                    {tareaImagenes.length === 0 && (
                      <div className="col-span-2 flex flex-col items-center justify-center h-full text-center px-4 py-8">
                        <FolderOpen size={16} className="text-theme-dim mb-1" />
                        <p className="text-[9px] text-theme-dim">{t('escenas.noImages')}</p>
                        <p className="text-[8px] text-theme-dim mt-0.5">{t('escenas.tapToProject')}</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center px-4">
                  <ListTodo size={20} className="text-theme-dim mx-auto mb-2" />
                  <p className="text-[9px] text-theme-dim">{t('escenas.selectTarea')}</p>
                  <p className="text-[8px] text-theme-dim mt-1">{t('escenas.tapImageProject')}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {editImage && editImageDataUrl && (
        <ImageEditor
          open={!!editImage}
          imageUrl={editImageDataUrl}
          imageName={editImage.name}
          onClose={() => { setEditImage(null); setEditImageDataUrl(null); setEditingTarea(false) }}
          onSave={async (dataUrl) => {
            const res = await window.api.app.saveEditedImage(dataUrl, editImage.name)
            if (res?.success && res.data != null) {
              const d = res.data
              const newImg: BackgroundImage = { id: `edited-${Date.now()}`, name: d.nombre, filePath: d.filePath }
              if (!editingTarea) {
                const idx = images.findIndex(i => i.id === editImage.id)
                const updated = [...images]
                if (idx >= 0) {
                  const oldId = updated[idx].id
                  updated[idx] = newImg
                  setImages(updated)
                  if (backgroundUrl && oldId === editImage.id) {
                    onSelectBackground(fileUrl(d.filePath))
                  }
                } else {
                  setImages([...updated, newImg])
                }
              } else {
                setTareaImagenes(prev => prev.map(ti => ti.id.toString() === editImage.id ? { ...ti, filePath: d.filePath } : ti))
              }
              window.api.app.getFondos().then(r => { if (r?.success && r.data) setImages(r.data) })
            }
            setEditImage(null); setEditImageDataUrl(null); setEditingTarea(false)
          }}
        />
      )}
    </div>
  )
}
