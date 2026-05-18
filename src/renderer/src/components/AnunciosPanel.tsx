import { useState, useEffect, useRef } from 'react'
import { Megaphone, Plus, Play, Trash2, Eye, X, Settings, Sparkles, Pencil } from 'lucide-react'
import { useLang } from '../i18n'

const ANUNCIO_ANIM_IDS = ['anim-fade', 'anim-dissolve', 'anuncio-blur-in', 'anuncio-slide-up', 'anuncio-drop-in', 'anuncio-float-in', 'anuncio-bounce', 'anuncio-flip', 'anuncio-zoom', 'anuncio-swirl-in', 'anuncio-glow', 'anuncio-gradient', 'anuncio-fire', 'letra-fade', 'letra-slide-up', 'letra-pop', 'letra-bounce', 'letra-flip']

const BG_CATEGORIES = [
  { labelKey: 'anuncios.bgCat.suaves', items: [
    { id: 'anuncio-bg-soft-lavender', labelKey: 'escenas.bgItem.anuncio-bg-soft-lavender' }, { id: 'anuncio-bg-soft-sky', labelKey: 'escenas.bgItem.anuncio-bg-soft-sky' },
    { id: 'anuncio-bg-glass', labelKey: 'escenas.bgItem.anuncio-bg-glass' }, { id: 'anuncio-bg-fade', labelKey: 'escenas.bgItem.anuncio-bg-fade' },
  ]},
  { labelKey: 'anuncios.bgCat.oscuros', items: [
    { id: 'anuncio-bg-midnight', labelKey: 'escenas.bgItem.anuncio-bg-midnight' }, { id: 'anuncio-bg-gradient', labelKey: 'escenas.bgItem.anuncio-bg-gradient' },
    { id: 'anuncio-bg-circles', labelKey: 'escenas.bgItem.anuncio-bg-circles' }, { id: 'anuncio-bg-waves', labelKey: 'escenas.bgItem.anuncio-bg-waves' },
  ]},
  { labelKey: 'anuncios.bgCat.vibrantes', items: [
    { id: 'anuncio-bg-rainbow', labelKey: 'escenas.bgItem.anuncio-bg-rainbow' }, { id: 'anuncio-bg-neon', labelKey: 'escenas.bgItem.anuncio-bg-neon' },
    { id: 'anuncio-bg-sunset', labelKey: 'escenas.bgItem.anuncio-bg-sunset' }, { id: 'anuncio-bg-ocean', labelKey: 'escenas.bgItem.anuncio-bg-ocean' },
  ]},
]

const SIZES = [{id:'anuncio-sm',labelKey:'escenas.size.small'},{id:'anuncio-md',labelKey:'escenas.size.medium'},{id:'anuncio-lg',labelKey:'escenas.size.large'},{id:'anuncio-xl',labelKey:'escenas.size.xlarge'}]
const FONTS = [{id:'anuncio-font-normal',labelKey:'escenas.font.normal'},{id:'anuncio-font-bold',labelKey:'escenas.font.bold'},{id:'anuncio-font-light',labelKey:'escenas.font.light'},{id:'anuncio-font-cursive',labelKey:'escenas.font.cursive'}]
const COLORS = [{id:'anuncio-color-white',labelKey:'escenas.color.white'},{id:'anuncio-color-gold',labelKey:'escenas.color.gold'},{id:'anuncio-color-gradient',labelKey:'escenas.color.violet'},{id:'anuncio-color-sunset',labelKey:'escenas.color.sunset'},{id:'anuncio-color-ocean',labelKey:'escenas.color.ocean'},{id:'anuncio-color-rainbow',labelKey:'escenas.color.rainbow'},{id:'anuncio-color-neon',labelKey:'escenas.color.neon'}]

const DURACIONES = [
  { id: 3, labelKey: 'escenas.duration.3s' as const }, { id: 5, labelKey: 'escenas.duration.5s' as const }, { id: 8, labelKey: 'escenas.duration.8s' as const },
  { id: 10, labelKey: 'escenas.duration.10s' as const }, { id: 15, labelKey: 'escenas.duration.15s' as const }, { id: 30, labelKey: 'escenas.duration.30s' as const },
  { id: 0, labelKey: 'escenas.duration.manual' as const }
]

export default function AnunciosPanel() {
  const { t } = useLang()
  const [text, setText] = useState('')
  const [list, setList] = useState<{id:number;texto:string;animacion:string}[]>([])
  const [proyectadoId, setProyectadoId] = useState<number | null>(null)
  const [showStyle, setShowStyle] = useState(false)
  const [animIn, setAnimIn] = useState('anuncio-slide-up')
  const [animOut] = useState('anim-fade')
  const [bg, setBg] = useState('anuncio-bg-dark')
  const [bgAnimIn] = useState('anuncio-bg-fade-in')
  const [bgAnimOut] = useState('anuncio-bg-fade-out')
  const [size, setSize] = useState('anuncio-lg')
  const [font, setFont] = useState('anuncio-font-bold')
  const [color, setColor] = useState('anuncio-color-white')
  const [duracion, setDuracion] = useState(8)
  const [editId, setEditId] = useState<number | null>(null)
  const [editText, setEditText] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    window.api.anuncios.getAll().then(r => { if (r.success && r.data) setList(r.data) })
    window.api.app.getConfig().then(r => {
      if (r.success && r.data) {
        const c = r.data as Record<string,string>
        if (c.bgAnuncios) setBg(c.bgAnuncios)
        if (c.sizeAnuncios) setSize(c.sizeAnuncios)
        if (c.fontAnuncios) setFont(c.fontAnuncios)
        if (c.colorAnuncios) setColor(c.colorAnuncios)
        if (c.animAnuncios) setAnimIn(c.animAnuncios)
        if (c.duracionAnuncios) setDuracion(Number(c.duracionAnuncios) || 8)
      }
    })
  }, [])

  const saveConfig = (key: string, val: string) => {
    window.api.app.getConfig().then(r => {
      const cfg = (r.success && r.data) ? { ...r.data as Record<string,string> } : {}
      cfg[key] = val
      window.api.app.saveConfig(cfg)
    })
  }

  const handleAdd = async () => {
    if (!text.trim()) return
    const res = await window.api.anuncios.create(text, animIn)
    if (res.success && res.data) {
      setList([{ id: res.data.id as number, texto: text, animacion: animIn }, ...list])
      setText('')
    }
  }

  const handleEdit = (a: {id:number;texto:string}) => {
    setEditId(a.id)
    setEditText(a.texto)
  }

  const handleSaveEdit = async () => {
    if (editId === null || !editText.trim()) return
    await window.api.anuncios.update(editId, editText, animIn)
    setList(list.map(a => a.id === editId ? { ...a, texto: editText } : a))
    setEditId(null)
    setEditText('')
  }

  const handleDelete = async (id: number) => {
    await window.api.anuncios.delete(id)
    setList(list.filter(a => a.id !== id))
  }

  const handleProject = (a: {id:number;texto:string}) => {
    window.api.projector.showAnnouncement({ text: a.texto, animation: animIn, animIn, animOut, duration: duracion, bg, bgAnimIn, bgAnimOut, size, font, color })
    setProyectadoId(a.id)
    if (timerRef.current) clearTimeout(timerRef.current)
    if (duracion > 0) {
      timerRef.current = setTimeout(() => setProyectadoId(null), duracion * 1000 + 800)
    }
  }

  const handleHide = () => {
    window.api.projector.hideAnnouncement()
    setProyectadoId(null)
  }

  return (
    <div className="h-full bg-theme-panel border border-theme rounded-xl flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-theme">
        <h3 className="text-[10px] font-semibold text-theme-muted uppercase tracking-wider flex items-center gap-1.5">
          <Megaphone size={11} /> {t('anuncios.title')}
        </h3>
        <button onClick={() => setShowStyle(true)} className="p-1 hover:bg-white/5 rounded" title={t('anuncios.styleTitle')}>
          <Settings size={10} className="text-theme-dim" />
        </button>
      </div>
      <div className="flex gap-1 px-2 pt-1.5">
        <input type="text" value={text} onChange={e => setText(e.target.value)} placeholder={t('anuncios.newPlaceholder')}
          className="flex-1 px-2 py-1 bg-theme-card rounded text-[10px] text-theme placeholder:text-theme-dim border border-theme outline-none"
          onKeyDown={e => { if (e.key === 'Enter') handleAdd() }} />
        <button onClick={handleAdd} className="p-1.5 bg-green-600/80 rounded hover:bg-green-600"><Plus size={11} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {list.map(a => (
          <div key={a.id} onClick={() => proyectadoId === a.id ? handleHide() : handleProject(a)}
            className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer group transition-colors ${proyectadoId === a.id ? 'bg-green-600/20 ring-1 ring-green-500/50' : 'bg-theme-card hover:bg-theme-card/80'}`}>
            <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${proyectadoId === a.id ? 'bg-green-500/30' : 'bg-theme'}`}>
              {proyectadoId === a.id ? <Eye size={8} className="text-green-400" /> : <Play size={8} className="text-green-500" />}
            </div>
            <span className="text-[10px] text-theme flex-1 truncate">{a.texto}</span>
            {proyectadoId === a.id && <span className="text-[7px] text-green-400 font-bold shrink-0">LIVE</span>}
            <button onClick={e => { e.stopPropagation(); handleEdit(a) }}
              className="p-0.5 text-theme-dim hover:text-blue-400 opacity-0 group-hover:opacity-100 shrink-0"><Pencil size={9} /></button>
            <button onClick={e => { e.stopPropagation(); handleDelete(a.id) }}
              className="p-0.5 text-theme-dim hover:text-red-400 opacity-0 group-hover:opacity-100 shrink-0"><Trash2 size={9} /></button>
          </div>
        ))}
        {list.length === 0 && <p className="text-[9px] text-theme-dim text-center py-4">{t('anuncios.empty')}</p>}
      </div>

      {showStyle && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setShowStyle(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[700px] max-w-[90vw] max-h-[85vh] bg-theme-panel border border-theme rounded-xl shadow-2xl shadow-black/60 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-theme shrink-0">
              <h3 className="text-xs font-bold text-theme flex items-center gap-2"><Sparkles size={14} className="text-[#6c5ce7]" /> {t('anuncios.styleTitle')}</h3>
              <button onClick={() => setShowStyle(false)} className="p-1 hover:bg-white/5 rounded"><X size={14} className="text-theme-dim" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              <div className="rounded-lg overflow-hidden relative bg-black h-24" key={`${bg}-${animIn}-${size}-${font}-${color}`}>
                <div className={`absolute inset-0 ${bg}`}>
                  <div className="absolute inset-0 anuncio-bg-scanlines" />
                  <div className="absolute inset-0 anuncio-bg-shimmer" />
                </div>
                <div className={`absolute inset-0 flex items-center justify-center p-2 ${bgAnimIn}`}>
                  <div className="text-center">
                    <p className={`${size} ${font} ${color} drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)] leading-tight ${animIn}`}>Texto</p>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-theme-dim font-semibold mb-1">{t('anuncios.bg')}</p>
                <div className="flex flex-wrap gap-1.5">
                  {BG_CATEGORIES.flatMap(c => c.items).map(a => (
                    <button key={a.id} onClick={() => { setBg(a.id); saveConfig('bgAnuncios', a.id) }}
                      className={`text-[10px] px-2.5 py-1.5 rounded-full transition-all border ${bg === a.id ? 'bg-[#6c5ce7]/20 border-[#6c5ce7] text-[#6c5ce7]' : 'bg-theme-card border-transparent text-theme-dim hover:text-theme'}`}>{t(a.labelKey)}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] text-theme-dim font-semibold mb-1">{t('anuncios.animacion')}</p>
                <div className="flex flex-wrap gap-1.5">
                  {ANUNCIO_ANIM_IDS.map(a => (
                    <button key={a} onClick={() => { setAnimIn(a); saveConfig('animAnuncios', a) }}
                      className={`text-[10px] px-2.5 py-1.5 rounded-full transition-all border ${animIn === a ? 'bg-[#6c5ce7]/20 border-[#6c5ce7] text-[#6c5ce7]' : 'bg-theme-card border-transparent text-theme-dim hover:text-theme'}`}>{a.replace('anuncio-','').replace('anim-','').replace('-',' ')}</button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <p className="text-[10px] text-theme-dim font-semibold mb-1">{t('anuncios.tamano')}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {SIZES.map(a => (
                      <button key={a.id} onClick={() => { setSize(a.id); saveConfig('sizeAnuncios', a.id) }}
                        className={`text-[10px] px-2.5 py-1.5 rounded-full transition-all border ${size === a.id ? 'bg-[#6c5ce7]/20 border-[#6c5ce7] text-[#6c5ce7]' : 'bg-theme-card border-transparent text-theme-dim hover:text-theme'}`}>{t(a.labelKey)}</button>
                    ))}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-theme-dim font-semibold mb-1">{t('anuncios.fuente')}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {FONTS.map(a => (
                      <button key={a.id} onClick={() => { setFont(a.id); saveConfig('fontAnuncios', a.id) }}
                        className={`text-[10px] px-2.5 py-1.5 rounded-full transition-all border ${font === a.id ? 'bg-[#6c5ce7]/20 border-[#6c5ce7] text-[#6c5ce7]' : 'bg-theme-card border-transparent text-theme-dim hover:text-theme'}`}>{t(a.labelKey)}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-theme-dim font-semibold mb-1">{t('anuncios.color')}</p>
                <div className="flex flex-wrap gap-1.5">
                  {COLORS.map(a => (
                    <button key={a.id} onClick={() => { setColor(a.id); saveConfig('colorAnuncios', a.id) }}
                      className={`text-[10px] px-2.5 py-1.5 rounded-full transition-all border ${color === a.id ? 'bg-[#6c5ce7]/20 border-[#6c5ce7] text-[#6c5ce7]' : 'bg-theme-card border-transparent text-theme-dim hover:text-theme'}`}>{t(a.labelKey)}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] text-theme-dim font-semibold mb-1">{t('anuncios.duracion')}</p>
                <div className="flex flex-wrap gap-1.5">
                  {DURACIONES.map(a => (
                    <button key={a.id} onClick={() => { setDuracion(a.id); saveConfig('duracionAnuncios', String(a.id)) }}
                      className={`text-[10px] px-2.5 py-1.5 rounded-full transition-all border ${duracion === a.id ? 'bg-[#6c5ce7]/20 border-[#6c5ce7] text-[#6c5ce7]' : 'bg-theme-card border-transparent text-theme-dim hover:text-theme'}`}>{t(a.labelKey)}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end px-4 py-3 border-t border-theme">
              <button onClick={() => setShowStyle(false)} className="px-4 py-1.5 text-[9px] bg-[#6c5ce7] text-white rounded-lg hover:bg-[#5a4bd1]">{t('common.close')}</button>
            </div>
          </div>
        </>
      )}

      {editId !== null && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setEditId(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[400px] max-w-[90vw] bg-theme-panel border border-theme rounded-xl shadow-2xl shadow-black/60 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-theme">
              <h3 className="text-xs font-bold text-theme flex items-center gap-2"><Megaphone size={14} className="text-blue-400" /> {t('anuncios.editTitle')}</h3>
              <button onClick={() => setEditId(null)} className="p-1 hover:bg-white/5 rounded"><X size={14} className="text-theme-dim" /></button>
            </div>
            <div className="p-4">
              <input type="text" value={editText} onChange={e => setEditText(e.target.value)} placeholder={t('anuncios.editPlaceholder')}
                className="w-full px-3 py-2 bg-theme-card rounded text-xs text-theme placeholder:text-theme-dim border border-theme outline-none"
                onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit() }} />
            </div>
            <div className="flex justify-end gap-2 px-4 py-3 border-t border-theme">
              <button onClick={() => setEditId(null)} className="px-4 py-1.5 text-[9px] bg-theme-card text-theme-dim rounded-lg hover:text-theme">{t('common.cancel')}</button>
              <button onClick={handleSaveEdit} className="px-4 py-1.5 text-[9px] bg-blue-600 text-white rounded-lg hover:bg-blue-500">{t('common.save')}</button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
