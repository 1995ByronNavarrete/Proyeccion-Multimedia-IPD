import { useState, useEffect, useRef } from 'react'
import { Megaphone, Plus, Play, Trash2, Eye, X, Settings, Sparkles } from 'lucide-react'

const ANUNCIO_ANIM_IDS = ['anim-fade', 'anim-dissolve', 'anuncio-blur-in', 'anuncio-slide-up', 'anuncio-drop-in', 'anuncio-float-in', 'anuncio-bounce', 'anuncio-flip', 'anuncio-zoom', 'anuncio-swirl-in', 'anuncio-glow', 'anuncio-gradient', 'anuncio-fire', 'letra-fade', 'letra-slide-up', 'letra-pop', 'letra-bounce', 'letra-flip']

const BG_CATEGORIES = [
  { label: 'Suaves', items: [
    { id: 'anuncio-bg-soft-lavender', label: 'Lavanda' }, { id: 'anuncio-bg-soft-sky', label: 'Cielo' },
    { id: 'anuncio-bg-glass', label: 'Vidrio' }, { id: 'anuncio-bg-fade', label: 'Degradado' },
  ]},
  { label: 'Oscuros', items: [
    { id: 'anuncio-bg-midnight', label: 'Medianoche' }, { id: 'anuncio-bg-gradient', label: 'Violeta' },
    { id: 'anuncio-bg-circles', label: 'Círculos' }, { id: 'anuncio-bg-waves', label: 'Olas' },
  ]},
  { label: 'Vibrantes', items: [
    { id: 'anuncio-bg-rainbow', label: 'Arcoíris' }, { id: 'anuncio-bg-neon', label: 'Neón' },
    { id: 'anuncio-bg-sunset', label: 'Atardecer' }, { id: 'anuncio-bg-ocean', label: 'Océano' },
  ]},
]

const SIZES = [{id:'anuncio-sm',label:'S'},{id:'anuncio-md',label:'M'},{id:'anuncio-lg',label:'L'},{id:'anuncio-xl',label:'XL'}]
const FONTS = [{id:'anuncio-font-normal',label:'Normal'},{id:'anuncio-font-bold',label:'Negrita'},{id:'anuncio-font-light',label:'Fino'},{id:'anuncio-font-cursive',label:'Cursiva'}]
const COLORS = [{id:'anuncio-color-white',label:'Blanco'},{id:'anuncio-color-gold',label:'Dorado'},{id:'anuncio-color-gradient',label:'Violeta'},{id:'anuncio-color-sunset',label:'Atardecer'},{id:'anuncio-color-ocean',label:'Océano'},{id:'anuncio-color-rainbow',label:'Arcoíris'},{id:'anuncio-color-neon',label:'Neón'}]

export default function AnunciosPanel() {
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
  const [duracion] = useState(8)
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

  const handleDelete = async (id: number) => {
    await window.api.anuncios.delete(id)
    setList(list.filter(a => a.id !== id))
  }

  const handleProject = (a: {id:number;texto:string}) => {
    window.api.projector.showAnnouncement({ text: a.texto, animation: animIn, animIn, animOut, duration: duracion, bg, bgAnimIn, bgAnimOut, size, font, color })
    setProyectadoId(a.id)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setProyectadoId(null), duracion * 1000 + 800)
  }

  const handleHide = () => {
    window.api.projector.hideAnnouncement()
    setProyectadoId(null)
  }

  return (
    <div className="h-full bg-theme-panel border border-theme rounded-xl flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-theme">
        <h3 className="text-[10px] font-semibold text-theme-muted uppercase tracking-wider flex items-center gap-1.5">
          <Megaphone size={11} /> Anuncios
        </h3>
        <button onClick={() => setShowStyle(true)} className="p-1 hover:bg-white/5 rounded" title="Estilo">
          <Settings size={10} className="text-theme-dim" />
        </button>
      </div>
      <div className="flex gap-1 px-2 pt-1.5">
        <input type="text" value={text} onChange={e => setText(e.target.value)} placeholder="Nuevo anuncio..."
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
            <button onClick={e => { e.stopPropagation(); handleDelete(a.id) }}
              className="p-0.5 text-theme-dim hover:text-red-400 opacity-0 group-hover:opacity-100 shrink-0"><Trash2 size={9} /></button>
          </div>
        ))}
        {list.length === 0 && <p className="text-[9px] text-theme-dim text-center py-4">Agrega un anuncio</p>}
      </div>

      {showStyle && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setShowStyle(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[700px] max-w-[90vw] max-h-[85vh] bg-theme-panel border border-theme rounded-xl shadow-2xl shadow-black/60 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-theme shrink-0">
              <h3 className="text-xs font-bold text-theme flex items-center gap-2"><Sparkles size={14} className="text-[#6c5ce7]" /> Estilo de Anuncio</h3>
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
                <p className="text-[10px] text-theme-dim font-semibold mb-1">Fondo</p>
                <div className="flex flex-wrap gap-1.5">
                  {BG_CATEGORIES.flatMap(c => c.items).map(a => (
                    <button key={a.id} onClick={() => { setBg(a.id); saveConfig('bgAnuncios', a.id) }}
                      className={`text-[10px] px-2.5 py-1.5 rounded-full transition-all border ${bg === a.id ? 'bg-[#6c5ce7]/20 border-[#6c5ce7] text-[#6c5ce7]' : 'bg-theme-card border-transparent text-theme-dim hover:text-theme'}`}>{a.label}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] text-theme-dim font-semibold mb-1">Animación</p>
                <div className="flex flex-wrap gap-1.5">
                  {ANUNCIO_ANIM_IDS.map(a => (
                    <button key={a} onClick={() => { setAnimIn(a); saveConfig('animAnuncios', a) }}
                      className={`text-[10px] px-2.5 py-1.5 rounded-full transition-all border ${animIn === a ? 'bg-[#6c5ce7]/20 border-[#6c5ce7] text-[#6c5ce7]' : 'bg-theme-card border-transparent text-theme-dim hover:text-theme'}`}>{a.replace('anuncio-','').replace('anim-','').replace('-',' ')}</button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <p className="text-[10px] text-theme-dim font-semibold mb-1">Tamaño</p>
                  <div className="flex flex-wrap gap-1.5">
                    {SIZES.map(a => (
                      <button key={a.id} onClick={() => { setSize(a.id); saveConfig('sizeAnuncios', a.id) }}
                        className={`text-[10px] px-2.5 py-1.5 rounded-full transition-all border ${size === a.id ? 'bg-[#6c5ce7]/20 border-[#6c5ce7] text-[#6c5ce7]' : 'bg-theme-card border-transparent text-theme-dim hover:text-theme'}`}>{a.label}</button>
                    ))}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-theme-dim font-semibold mb-1">Fuente</p>
                  <div className="flex flex-wrap gap-1.5">
                    {FONTS.map(a => (
                      <button key={a.id} onClick={() => { setFont(a.id); saveConfig('fontAnuncios', a.id) }}
                        className={`text-[10px] px-2.5 py-1.5 rounded-full transition-all border ${font === a.id ? 'bg-[#6c5ce7]/20 border-[#6c5ce7] text-[#6c5ce7]' : 'bg-theme-card border-transparent text-theme-dim hover:text-theme'}`}>{a.label}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-theme-dim font-semibold mb-1">Color</p>
                <div className="flex flex-wrap gap-1.5">
                  {COLORS.map(a => (
                    <button key={a.id} onClick={() => { setColor(a.id); saveConfig('colorAnuncios', a.id) }}
                      className={`text-[10px] px-2.5 py-1.5 rounded-full transition-all border ${color === a.id ? 'bg-[#6c5ce7]/20 border-[#6c5ce7] text-[#6c5ce7]' : 'bg-theme-card border-transparent text-theme-dim hover:text-theme'}`}>{a.label}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end px-4 py-3 border-t border-theme">
              <button onClick={() => setShowStyle(false)} className="px-4 py-1.5 text-[9px] bg-[#6c5ce7] text-white rounded-lg hover:bg-[#5a4bd1]">Cerrar</button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
