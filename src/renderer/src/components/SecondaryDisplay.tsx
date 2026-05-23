import { Monitor } from 'lucide-react'
import { useLang } from '../i18n'

export default function SecondaryDisplay() {
  const { t } = useLang()

  return (
    <div className="h-full w-full bg-[rgba(8,12,30,0.95)] bg-theme-panel border border-[rgba(120,80,255,0.15)] border-theme rounded-xl overflow-hidden flex flex-col">
      <div className="flex items-center px-3 py-2 border-b border-[rgba(120,80,255,0.15)] border-theme shrink-0">
        <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{t('view.secondary')}</h3>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Monitor size={24} className="text-gray-600 mx-auto mb-1" />
          <p className="text-[9px] text-gray-500">{t('black.empty')}</p>
        </div>
      </div>
    </div>
  )
}
