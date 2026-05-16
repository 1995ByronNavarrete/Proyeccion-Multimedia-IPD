import { useState, useEffect } from 'react'
import { X, Sparkles, Search, Save } from 'lucide-react'
import { ANIM_GROUPS } from '../../constants'

interface AnimSelectorModalProps {
  open: boolean
  onClose: () => void
  onSave: (animId: string) => void
  currentAnim: string
  title?: string
  showPreview?: boolean
  previewText?: string
  previewRef?: string
  previewBg?: string
}

export default function AnimSelectorModal({ open, onClose, onSave, currentAnim, title = 'Efectos de Animación', showPreview = true, previewText, previewRef, previewBg }: AnimSelectorModalProps) {
  const [animSearch, setAnimSearch] = useState('')
  const [animCategory, setAnimCategory] = useState<string | null>(ANIM_GROUPS[0]?.label || null)
  const [previewAnim, setPreviewAnim] = useState<string | null>(null)
  const displayAnim = previewAnim ?? currentAnim

  useEffect(() => {
    if (open) {
      setPreviewAnim(null)
      setAnimSearch('')
      setAnimCategory(ANIM_GROUPS[0]?.label || null)
    }
  }, [open])

  const filteredGroups = ANIM_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((a) => !animSearch || a.label.toLowerCase().includes(animSearch.toLowerCase()))
  })).filter((g) => animCategory ? g.label === animCategory : g.items.length > 0)
    .filter((g) => g.items.length > 0)

  const currentLabel = ANIM_GROUPS.flatMap(g => g.items).find(a => a.id === displayAnim)?.label || displayAnim
  const isLetterAnim = displayAnim.startsWith('anim-letter-')

  if (!open) return null

  const previewContent = previewText || 'Texto de muestra'
  const previewReference = previewRef || 'Referencia'

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[960px] max-w-[95vw] max-h-[90vh] bg-theme-panel border border-theme rounded-xl shadow-2xl shadow-black/60 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-theme shrink-0">
          <h3 className="text-xs font-bold text-theme flex items-center gap-2">
            <Sparkles size={14} className="text-[#6c5ce7]" /> {title}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-white/5 rounded transition-colors"><X size={14} className="text-theme-dim" /></button>
        </div>

        <div className="flex flex-1 min-h-0">
          {showPreview && (
            <div className="w-[460px] shrink-0 border-r border-theme flex flex-col p-3">
              <p className="text-[8px] text-theme-dim font-semibold uppercase tracking-wider mb-2">Vista previa</p>
              <div className="flex-1 rounded-lg overflow-hidden relative bg-black flex items-center justify-center" style={{ aspectRatio: '16/9' }} key={displayAnim}>
                {previewBg && <img src={previewBg} alt="" className="absolute inset-0 w-full h-full object-cover" />}
                <div className="absolute inset-0 bg-black/50" />
                <div className="relative z-10 text-center px-4 max-w-full">
                  {isLetterAnim ? (
                    <p className={`text-xs sm:text-sm md:text-base font-bold text-white leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] ${displayAnim}`}>
                      {previewContent.split('').map((char, i) => (
                        <span key={i} style={{ animationDelay: `${i * 0.045}s` }} className="inline-block">{char === ' ' ? '\u00A0' : char}</span>
                      ))}
                    </p>
                  ) : (
                    <p className={`text-xs sm:text-sm md:text-base font-bold text-white leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] ${displayAnim} anim-delay-text`}>{previewContent}</p>
                  )}
                  <p className={`text-[10px] sm:text-xs text-white/70 mt-2 drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)] ${displayAnim} anim-delay-ref`}>— {previewReference}</p>
                </div>
              </div>
              <p className="text-[7px] text-theme-dim text-center mt-1">{currentLabel}</p>
            </div>
          )}

          <div className="flex-1 flex flex-col min-w-0">
            <div className="px-3 pt-3 pb-1 shrink-0">
              <div className="relative">
                <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-theme-dim" />
                <input type="text" value={animSearch} onChange={(e) => setAnimSearch(e.target.value)}
                  placeholder="Buscar animación..."
                  className="w-full pl-7 pr-3 py-1.5 bg-theme-card rounded-lg text-[10px] text-theme placeholder:text-theme-dim border border-theme outline-none focus:border-[#6c5ce7] transition-colors" />
              </div>
            </div>

            <div className="flex flex-wrap gap-1 px-3 pb-1 shrink-0">
              {ANIM_GROUPS.map((g) => (
                <button key={g.label} onClick={() => setAnimCategory(g.label === animCategory ? null : g.label)}
                  className={`text-[11px] whitespace-nowrap px-3 py-1.5 rounded-full transition-colors ${animCategory === g.label ? 'bg-[#6c5ce7] text-white' : 'bg-theme-card text-theme-dim hover:text-theme'}`}>{g.label}</button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto px-3 pb-3">
              {filteredGroups.map((g) => (
                <div key={g.label} className="mb-2">
                  <div className="text-[8px] text-theme-dim font-bold uppercase tracking-wider mb-1">{g.label}</div>
                  <div className="flex flex-wrap gap-1">
                    {g.items.map((a) => (
                      <button key={a.id} onClick={() => setPreviewAnim(a.id)}
                        className={`text-[11px] px-3 py-2 rounded-full transition-all border whitespace-nowrap ${displayAnim === a.id
                          ? 'bg-[#6c5ce7]/20 border-[#6c5ce7] text-[#6c5ce7] font-medium'
                          : 'bg-theme-card border-transparent text-theme-dim hover:text-theme hover:border-theme hover:bg-theme-card/80'}`}>{a.label}</button>
                    ))}
                  </div>
                </div>
              ))}
              {filteredGroups.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-[10px] text-theme-dim">Sin resultados para "{animSearch}"</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-theme shrink-0">
          <p className="text-[7px] text-theme-dim mr-auto">Selecciona un efecto para previsualizar</p>
          <button onClick={onClose}
            className="px-4 py-1.5 text-[9px] bg-theme-card text-theme-dim rounded-lg hover:text-theme hover:border-theme border border-theme transition-colors">Cerrar</button>
          <button onClick={() => { if (previewAnim) onSave(previewAnim); onClose() }}
            className="flex items-center gap-1.5 px-4 py-1.5 text-[9px] bg-[#6c5ce7] text-white rounded-lg hover:bg-[#5a4bd1] transition-colors font-medium">
            <Save size={11} /> Guardar
          </button>
        </div>
      </div>
    </>
  )
}