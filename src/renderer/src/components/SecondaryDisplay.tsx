import { Monitor, ImageIcon } from 'lucide-react'
import { useLang } from '../i18n'
import type { ProjectedContent } from '../views/DashboardView'
import VerseDisplay from './shared/VerseDisplay'

interface SecondaryDisplayProps {
  projected?: ProjectedContent
  backgroundUrl?: string | null
  animation?: string
  overlayOpacity?: number
}

export default function SecondaryDisplay({ projected, backgroundUrl, animation, overlayOpacity = 80 }: SecondaryDisplayProps) {
  const { t } = useLang()
  const hasContent = projected?.type === 'verse' || projected?.type === 'black' || projected?.type === 'media'
  const showVerse = projected?.type === 'verse' && projected.text

  return (
    <div className="h-full w-full bg-[rgba(8,12,30,0.95)] bg-theme-panel border border-[rgba(120,80,255,0.15)] border-theme rounded-xl overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[rgba(120,80,255,0.15)] border-theme shrink-0">
        <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{t('view.secondary')}</h3>
        {showVerse && (
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[8px] text-green-500">LIVE</span>
          </span>
        )}
      </div>

      <div className="flex-1 relative overflow-hidden rounded-lg m-2">
        {!hasContent ? (
          <div className="h-full w-full flex items-center justify-center">
            <div className="text-center">
              <Monitor size={24} className="text-gray-600 mx-auto mb-1" />
              <p className="text-[9px] text-gray-500">{t('black.empty')}</p>
            </div>
          </div>
        ) : projected?.type === 'black' ? (
          <div className="h-full w-full bg-black flex items-center justify-center">
            <div className="text-center">
              <Monitor size={28} className="text-gray-700 mx-auto mb-2" />
              <p className="text-[10px] text-gray-600">{t('black.title')}</p>
            </div>
          </div>
        ) : projected?.type === 'media' && projected.mediaUrl?.startsWith('data:image') ? (
          <div className="h-full w-full bg-black flex items-center justify-center">
            <img src={projected.mediaUrl} alt="" className="max-w-full max-h-full object-contain" />
          </div>
        ) : (
          <VerseDisplay projected={projected} backgroundUrl={backgroundUrl} animation={animation} overlayOpacity={overlayOpacity} />
        )}
      </div>
    </div>
  )
}
