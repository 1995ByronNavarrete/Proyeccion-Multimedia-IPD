import { Monitor } from 'lucide-react'
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

  return (
    <div className="h-full w-full overflow-hidden">
      {!hasContent ? (
        <div className="h-full w-full bg-[rgba(8,12,30,0.95)] rounded-xl flex items-center justify-center">
          <div className="text-center">
            <Monitor size={24} className="text-gray-600 mx-auto mb-1" />
            <p className="text-[9px] text-gray-500">{t('black.empty')}</p>
          </div>
        </div>
      ) : projected?.type === 'black' ? (
        <div className="h-full w-full bg-black rounded-xl" />
      ) : projected?.type === 'media' && projected.mediaUrl?.startsWith('data:image') ? (
        <div className="h-full w-full bg-black rounded-xl flex items-center justify-center">
          <img src={projected.mediaUrl} alt="" className="max-w-full max-h-full object-contain" />
        </div>
      ) : (
        <VerseDisplay projected={projected} backgroundUrl={backgroundUrl} animation={animation} overlayOpacity={overlayOpacity} />
      )}
    </div>
  )
}
