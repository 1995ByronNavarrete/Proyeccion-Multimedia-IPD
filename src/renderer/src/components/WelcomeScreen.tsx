import { useState, useEffect } from 'react'
import { X, Monitor, BookOpen, Youtube, Music, Image, Sparkles, Radio, ArrowRight, Check, Camera, Globe, Timer, Mic, Clapperboard, Sliders, Heart } from 'lucide-react'
import { useLang } from '../i18n'

const STEPS = [
  {
    icon: Radio,
    titleKey: 'welcome.step1.title',
    descKey: 'welcome.step1.desc',
  },
  {
    icon: Monitor,
    titleKey: 'welcome.step2.title',
    descKey: 'welcome.step2.desc',
  },
  {
    icon: BookOpen,
    titleKey: 'welcome.step3.title',
    descKey: 'welcome.step3.desc',
  },
  {
    icon: Youtube,
    titleKey: 'welcome.step4.title',
    descKey: 'welcome.step4.desc',
  },
  {
    icon: Music,
    titleKey: 'welcome.step5.title',
    descKey: 'welcome.step5.desc',
  },
  {
    icon: Image,
    titleKey: 'welcome.step6.title',
    descKey: 'welcome.step6.desc',
  },
  {
    icon: Sparkles,
    titleKey: 'welcome.step7.title',
    descKey: 'welcome.step7.desc',
  },
  {
    icon: Camera,
    titleKey: 'welcome.step8.title',
    descKey: 'welcome.step8.desc',
  },
  {
    icon: Globe,
    titleKey: 'welcome.step9.title',
    descKey: 'welcome.step9.desc',
  },
  {
    icon: Mic,
    titleKey: 'welcome.step10.title',
    descKey: 'welcome.step10.desc',
  },
  {
    icon: Clapperboard,
    titleKey: 'welcome.step11.title',
    descKey: 'welcome.step11.desc',
  },
  {
    icon: Timer,
    titleKey: 'welcome.step12.title',
    descKey: 'welcome.step12.desc',
  },
  {
    icon: Sliders,
    titleKey: 'welcome.step13.title',
    descKey: 'welcome.step13.desc',
  },
  {
    icon: Heart,
    titleKey: 'welcome.verse.title',
    descKey: 'welcome.verse.desc',
  },
]

export default function WelcomeScreen() {
  const { t } = useLang()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    const seen = localStorage.getItem('ipd-welcome-seen')
    if (!seen) setOpen(true)
  }, [])

  const finish = () => {
    localStorage.setItem('ipd-welcome-seen', 'true')
    setOpen(false)
  }

  const next = () => {
    if (step < STEPS.length - 1) setStep(s => s + 1)
    else finish()
  }

  if (!open) return null

  const s = STEPS[step]
  const Icon = s.icon
  const isLast = step === STEPS.length - 1

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={finish} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[580px] max-w-[94vw] bg-gradient-to-br from-[#0a0a1a] via-[#12122a] to-[#0a0a1a] border border-[#6c5ce7]/30 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#6c5ce7] via-[#a855f7] to-[#00d4ff] animate-pulse" style={{ opacity: 0.6 }} />
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#6c5ce7]/20">
          <div className="flex gap-1 items-center">
            {STEPS.map((_, i) => {
              const isVerseStep = i === STEPS.length - 1
              return (
                <div key={i}
                  className={`rounded-full transition-all duration-500 ease-out ${isVerseStep ? 'w-2 h-2' : 'h-1'} ${i === step ? (isVerseStep ? 'bg-amber-400 scale-125' : 'w-8 bg-[#6c5ce7]') : i < step ? 'bg-[#6c5ce7]/40' : 'bg-white/10'}`} />
              )
            })}
          </div>
          <button onClick={finish} className="p-1 hover:bg-white/5 rounded transition-colors group">
            <X size={14} className="text-theme-dim group-hover:text-white transition-colors" />
          </button>
        </div>

        <div className="flex flex-col items-center text-center px-10 py-8 min-h-[220px] justify-center" key={step}>
          {step === STEPS.length - 1 ? (
            <>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mb-5 shadow-lg shadow-amber-500/30 animate-[pulse_2s_ease-in-out_infinite]"
                style={{ animation: 'floatUp 0.6s ease-out' }}>
                <Heart size={28} className="text-white" />
              </div>
              <h2 className="text-lg font-bold text-amber-400 mb-3" style={{ animation: 'fadeIn 0.5s ease-out 0.1s both' }}>{t(s.titleKey)}</h2>
              <div className="w-12 h-0.5 bg-gradient-to-r from-amber-400/0 via-amber-400 to-amber-400/0 mx-auto mb-3" style={{ animation: 'fadeIn 0.4s ease-out 0.2s both' }} />
              <p className="text-sm text-white/90 leading-relaxed max-w-md italic font-semibold" style={{ animation: 'fadeIn 0.5s ease-out 0.3s both' }}>"{t('welcome.verse.desc')}"</p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#6c5ce7] to-[#a855f7] flex items-center justify-center mb-5 shadow-lg shadow-[#6c5ce7]/30"
                style={{ animation: 'floatUp 0.6s ease-out' }}>
                <Icon size={28} className="text-white" />
              </div>
              <h2 className="text-lg font-bold text-white mb-2" style={{ animation: 'fadeIn 0.5s ease-out 0.1s both' }}>{t(s.titleKey)}</h2>
              <div className="w-8 h-0.5 bg-gradient-to-r from-[#6c5ce7]/0 via-[#6c5ce7] to-[#6c5ce7]/0 mx-auto mb-2" style={{ animation: 'fadeIn 0.4s ease-out 0.15s both' }} />
              <p className="text-xs text-theme-dim leading-relaxed max-w-sm" style={{ animation: 'fadeIn 0.5s ease-out 0.2s both' }}>{t(s.descKey)}</p>
            </>
          )}
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-t border-[#6c5ce7]/20 bg-black/30">
          <button onClick={finish} className="text-[10px] text-theme-dim hover:text-white transition-colors group flex items-center gap-1">
            <span className="group-hover:-translate-x-0.5 transition-transform">←</span> {t('welcome.skip')}
          </button>
          <button onClick={next}
            className={`flex items-center gap-1.5 px-5 py-2 rounded-lg text-[10px] font-bold hover:opacity-90 transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg ${isLast ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-amber-500/30' : 'bg-gradient-to-r from-[#6c5ce7] to-[#a855f7] text-white shadow-[#6c5ce7]/20'}`}>
            {isLast ? <><Heart size={12} /> Amén</> : <>{t('welcome.next')} <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" /></>}
          </button>
        </div>
      </div>
    </>
  )
}
