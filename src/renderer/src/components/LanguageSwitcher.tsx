import { useLang } from '../i18n'
import { Globe } from 'lucide-react'

export default function LanguageSwitcher() {
  const { lang, setLang } = useLang()
  return (
    <div className="flex items-center gap-2">
      <Globe size={11} className="text-theme-dim" />
      <select value={lang} onChange={e => setLang(e.target.value)}
        className="px-2 py-1 bg-theme-card rounded text-[10px] text-theme border border-theme outline-none focus:border-[#6c5ce7]">
        <option value="es">Español</option>
        <option value="en">English</option>
      </select>
    </div>
  )
}
