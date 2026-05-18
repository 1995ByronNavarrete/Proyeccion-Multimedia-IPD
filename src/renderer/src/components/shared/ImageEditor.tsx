import { useState, useRef, useEffect, useCallback } from 'react'
import { X, RotateCw, FlipHorizontal, FlipVertical, ZoomIn, Undo, Download, Save, Sun, Contrast, Droplets, Image as ImageIcon } from 'lucide-react'

interface ImageEditorProps {
  open: boolean
  imageUrl: string
  imageName: string
  onClose: () => void
  onSave: (editedDataUrl: string) => void
}

const FILTERS = [
  { id: 'none', label: 'Original' },
  { id: 'grayscale', label: 'Gris' },
  { id: 'sepia', label: 'Sepia' },
  { id: 'invert', label: 'Invertir' },
  { id: 'vintage', label: 'Vintage' },
  { id: 'cool', label: 'Frío' },
  { id: 'warm', label: 'Cálido' },
  { id: 'dramatic', label: 'Dramático' },
]

export default function ImageEditor({ open, imageUrl, imageName, onClose, onSave }: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)
  const [saturation, setSaturation] = useState(100)
  const [blur, setBlur] = useState(0)
  const [rotation, setRotation] = useState(0)
  const [scaleX, setScaleX] = useState(1)
  const [scaleY, setScaleY] = useState(1)
  const [filter, setFilter] = useState('none')
  const [zoom, setZoom] = useState(1)
  const [loaded, setLoaded] = useState(false)
  const [activeTab, setActiveTab] = useState<'adjust' | 'filters'>('adjust')

  useEffect(() => {
    if (!open) return
    setBrightness(100); setContrast(100); setSaturation(100); setBlur(0)
    setRotation(0); setScaleX(1); setScaleY(1); setFilter('none'); setZoom(1)
    setLoaded(false)
  }, [open, imageUrl])

  const applyFilter = useCallback(() => {
    const canvas = canvasRef.current
    const img = imgRef.current
    if (!canvas || !img || !loaded) return

    const ctx = canvas.getContext('2d')!
    const w = img.naturalWidth; const h = img.naturalHeight
    const maxW = 800; const maxH = 600
    let dw = w; let dh = h
    if (dw > maxW) { dh = dh * maxW / dw; dw = maxW }
    if (dh > maxH) { dw = dw * maxH / dh; dh = maxH }
    canvas.width = dw; canvas.height = dh

    ctx.clearRect(0, 0, dw, dh)
    ctx.save()
    ctx.translate(dw / 2, dh / 2)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.scale(scaleX, scaleY)
    ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh)
    ctx.restore()

    const imageData = ctx.getImageData(0, 0, dw, dh)
    const data = imageData.data

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3]

      // Brightness
      r = r * (brightness / 100)
      g = g * (brightness / 100)
      b = b * (brightness / 100)

      // Contrast
      const cf = (259 * (contrast + 255)) / (255 * (259 - contrast))
      r = cf * (r - 128) + 128
      g = cf * (g - 128) + 128
      b = cf * (b - 128) + 128

      // Saturation
      const gray = 0.2989 * r + 0.587 * g + 0.114 * b
      r = gray + (r - gray) * (saturation / 100)
      g = gray + (g - gray) * (saturation / 100)
      b = gray + (b - gray) * (saturation / 100)

      // Filters
      if (filter === 'grayscale') {
        const gr = 0.2989 * r + 0.587 * g + 0.114 * b
        r = gr; g = gr; b = gr
      } else if (filter === 'sepia') {
        r = r * 0.393 + g * 0.769 + b * 0.189
        g = r * 0.349 + g * 0.686 + b * 0.168
        b = r * 0.272 + g * 0.534 + b * 0.131
      } else if (filter === 'invert') {
        r = 255 - r; g = 255 - g; b = 255 - b
      } else if (filter === 'vintage') {
        r = r * 0.9 + 20; g = g * 0.85 + 10; b = b * 0.75
      } else if (filter === 'cool') {
        r = r * 0.9; g = g * 0.95; b = b * 1.1
      } else if (filter === 'warm') {
        r = r * 1.1; g = g * 1.0; b = b * 0.9
      } else if (filter === 'dramatic') {
        const dr = (r > 128) ? 255 : 0
        const dg = (g > 128) ? 255 : 0
        const db = (b > 128) ? 255 : 0
        r = r * 0.5 + dr * 0.5
        g = g * 0.5 + dg * 0.5
        b = b * 0.5 + db * 0.5
      }

      data[i] = Math.max(0, Math.min(255, r))
      data[i + 1] = Math.max(0, Math.min(255, g))
      data[i + 2] = Math.max(0, Math.min(255, b))
    }
    ctx.putImageData(imageData, 0, 0)
  }, [brightness, contrast, saturation, blur, rotation, scaleX, scaleY, filter, loaded])

  useEffect(() => { applyFilter() }, [applyFilter])

  const handleSave = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    onSave(canvas.toDataURL('image/png'))
    onClose()
  }

  const handleDownload = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `${imageName.replace(/\.[^.]+$/, '')}-editado.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  const handleRotate = () => setRotation(r => (r + 90) % 360)
  const handleFlipH = () => setScaleX(s => s * -1)
  const handleFlipV = () => setScaleY(s => s * -1)

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[900px] max-w-[95vw] max-h-[90vh] bg-theme-panel border border-theme rounded-xl shadow-2xl shadow-black/60 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-theme shrink-0">
          <h3 className="text-xs font-bold text-theme flex items-center gap-2">
            <ImageIcon size={14} className="text-[#6c5ce7]" /> Editor: {imageName}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-white/5 rounded"><X size={14} className="text-theme-dim" /></button>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Canvas preview */}
          <div className="flex-1 flex items-center justify-center p-4 bg-black/50 overflow-hidden">
            <div className="relative" style={{ transform: `scale(${zoom})` }}>
              <img ref={imgRef} src={imageUrl} alt="" className="hidden" crossOrigin="anonymous" onLoad={() => setLoaded(true)} onError={(e) => console.error('[ImageEditor] load error:', e)} />
              <canvas ref={canvasRef} className="max-w-full max-h-[55vh] rounded-lg shadow-lg" />
            </div>
          </div>

          {/* Tools panel */}
          <div className="w-[260px] shrink-0 border-l border-theme flex flex-col overflow-y-auto">
            <div className="flex border-b border-theme shrink-0">
              {(['adjust', 'filters'] as const).map(t => (
                <button key={t} onClick={() => setActiveTab(t)}
                  className={`flex-1 text-[8px] py-2 font-semibold uppercase tracking-wider transition-colors ${activeTab === t ? 'text-[#6c5ce7] border-b-2 border-[#6c5ce7]' : 'text-theme-dim hover:text-theme'}`}>
                  {t === 'adjust' ? 'Ajustes' : 'Filtros'}
                </button>
              ))}
            </div>

            <div className="flex-1 p-3 space-y-3">
              {activeTab === 'adjust' ? (
                <>
                  <Slider label="Brillo" icon={<Sun size={10} />} value={brightness} min={0} max={200} onChange={setBrightness} />
                  <Slider label="Contraste" icon={<Contrast size={10} />} value={contrast} min={0} max={200} onChange={setContrast} />
                  <Slider label="Saturación" icon={<Droplets size={10} />} value={saturation} min={0} max={200} onChange={setSaturation} />
                  <Slider label="Zoom" icon={<ZoomIn size={10} />} value={Math.round(zoom * 100)} min={50} max={300} onChange={v => setZoom(v / 100)} />

                  <div className="pt-2 border-t border-theme">
                    <p className="text-[8px] text-theme-dim font-semibold mb-1.5">Transformar</p>
                    <div className="grid grid-cols-3 gap-1">
                      <ToolBtn icon={<RotateCw size={10} />} label="Rotar" onClick={handleRotate} />
                      <ToolBtn icon={<FlipHorizontal size={10} />} label="Voltear H" onClick={handleFlipH} />
                      <ToolBtn icon={<FlipVertical size={10} />} label="Voltear V" onClick={handleFlipV} />
                    </div>
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-1.5">
                  {FILTERS.map(f => (
                    <button key={f.id} onClick={() => setFilter(f.id)}
                      className={`px-2 py-2 rounded-lg text-[9px] font-medium transition-all border ${filter === f.id ? 'bg-[#6c5ce7]/20 border-[#6c5ce7] text-[#6c5ce7]' : 'bg-theme-card border-transparent text-theme-dim hover:text-theme hover:border-theme'}`}>
                      {f.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 border-t border-theme space-y-1.5">
              <button onClick={handleSave}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-[#6c5ce7] text-white rounded-lg text-[9px] font-medium hover:bg-[#5a4bd1] transition-colors">
                <Save size={11} /> Guardar cambios
              </button>
              <button onClick={handleDownload}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-theme-card text-theme-dim rounded-lg text-[8px] hover:text-theme border border-theme transition-colors">
                <Download size={9} /> Descargar
              </button>
              <button onClick={() => { setBrightness(100); setContrast(100); setSaturation(100); setBlur(0); setRotation(0); setScaleX(1); setScaleY(1); setFilter('none'); setZoom(1) }}
                className="w-full flex items-center justify-center gap-1 px-3 py-1 text-[8px] text-theme-dim hover:text-theme transition-colors">
                <Undo size={8} /> Restaurar original
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function Slider({ label, icon, value, min, max, onChange }: { label: string; icon: React.ReactNode; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-0.5">
        <span className="flex items-center gap-1 text-[8px] text-theme">{icon} {label}</span>
        <span className="text-[7px] text-theme-dim tabular-nums">{value}%</span>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1 accent-[#6c5ce7]" />
    </div>
  )
}

function ToolBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="flex flex-col items-center gap-0.5 px-2 py-2 bg-theme-card rounded-lg hover:bg-[#6c5ce7]/10 transition-colors border border-theme">
      <span className="text-[#6c5ce7]">{icon}</span>
      <span className="text-[6px] text-theme-dim">{label}</span>
    </button>
  )
}