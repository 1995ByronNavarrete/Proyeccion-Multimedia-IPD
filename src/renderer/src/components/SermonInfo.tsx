import { useState, useEffect } from 'react'
import { Eye, EyeOff, BookOpen, User, RotateCcw } from 'lucide-react'
import { useLang } from '../i18n'

export default function SermonInfo() {
  const { t } = useLang()
  const [title, setTitle] = useState('')
  const [preacher, setPreacher] = useState('')
  const [active, setActive] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('sermonInfo')
      if (saved) { const d = JSON.parse(saved); setTitle(d.title || ''); setPreacher(d.preacher || '') }
    } catch {}
  }, [])

  const saveAndShow = () => {
    const data = { title: title.trim(), preacher: preacher.trim() }
    localStorage.setItem('sermonInfo', JSON.stringify(data))
    if (!data.title && !data.preacher) return
    setActive(true)
    window.dispatchEvent(new CustomEvent('sermon:update', { detail: data }))
  }

  const removeAll = () => {
    setActive(false)
    setTitle('')
    setPreacher('')
    localStorage.removeItem('sermonInfo')
    window.dispatchEvent(new CustomEvent('sermon:update', { detail: null }))
  }

  return (
    <div className="h-full bg-theme-panel border border-theme rounded-xl flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-theme shrink-0 bg-gradient-to-r from-amber-500/10 to-transparent">
        <BookOpen size={10} className="text-amber-400" />
        <h3 className="text-[9px] font-bold text-theme-muted uppercase tracking-wider flex-1">{t('sermon.title')}</h3>
        {active && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
      </div>

      <div className="flex-1 p-2 space-y-1.5">
        <div>
          <label className="text-[7px] text-theme-dim font-semibold uppercase tracking-wider">{t('sermon.theme')}</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)}
            placeholder="Ej: El amor de Dios"
            className="w-full mt-0.5 px-2 py-1.5 bg-theme-card rounded-lg text-[9px] text-theme placeholder:text-theme-dim border border-theme outline-none focus:border-amber-500 transition-colors" />
        </div>
        <div>
          <label className="text-[7px] text-theme-dim font-semibold uppercase tracking-wider">{t('sermon.preacher')}</label>
          <input type="text" value={preacher} onChange={e => setPreacher(e.target.value)}
            placeholder="Ej: Pastor Juan Pérez"
            className="w-full mt-0.5 px-2 py-1.5 bg-theme-card rounded-lg text-[9px] text-theme placeholder:text-theme-dim border border-theme outline-none focus:border-amber-500 transition-colors" />
        </div>
      </div>

      <div className="px-2 pb-2 space-y-1">
        <button onClick={saveAndShow} disabled={!title.trim() && !preacher.trim()}
          className="w-full flex items-center justify-center gap-1 py-1.5 bg-amber-500/20 text-amber-400 rounded-lg text-[8px] font-medium hover:bg-amber-500/30 disabled:opacity-30 transition-colors">
          <Eye size={9} /> {t('sermon.show')}
        </button>
        <button onClick={removeAll}
          className="w-full flex items-center justify-center gap-1 py-1 bg-red-500/10 text-red-400 rounded-lg text-[7px] hover:bg-red-500/20 transition-colors">
          <EyeOff size={8} /> {t('sermon.remove')}
        </button>
      </div>
    </div>
  )
}