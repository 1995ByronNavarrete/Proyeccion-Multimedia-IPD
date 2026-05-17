export interface AnimGroup { label: string; items: { id: string; label: string }[] }

export const ANIM_GROUPS: AnimGroup[] = [
  {
    label: '✨ Básicas', items: [
      { id: 'anim-fade', label: 'Fundido' },
      { id: 'anim-dissolve', label: 'Disolver' },
      { id: 'anim-focus', label: 'Enfoque cine' },
      { id: 'anim-typewriter', label: 'Máquina escribir' },
      { id: 'anim-gradient-text', label: 'Texto degradado' },
      { id: 'anim-glass', label: 'Efecto vidrio' },
    ]
  },
  {
    label: '⬆️ Deslizantes', items: [
      { id: 'anim-float-up', label: 'Flotar arriba' },
      { id: 'anim-float-down', label: 'Flotar abajo' },
      { id: 'anim-sweep-r', label: 'Barrido →' },
      { id: 'anim-sweep-l', label: 'Barrido ←' },
      { id: 'anim-blur-slide', label: 'Desliz borroso' },
      { id: 'anim-drop-in', label: 'Caer' },
      { id: 'anim-slide-elastic', label: 'Desliz elástico' },
      { id: 'anim-levitate', label: 'Levitación' },
    ]
  },
  {
    label: '🎭 Cortinas', items: [
      { id: 'anim-reveal-up', label: 'Cortina ↑' },
      { id: 'anim-reveal-down', label: 'Cortina ↓' },
      { id: 'anim-shutter-down', label: 'Persiana ↓' },
      { id: 'anim-shutter-up', label: 'Persiana ↑' },
      { id: 'anim-h-reveal', label: 'Revelar horiz.' },
      { id: 'anim-radial', label: 'Radial' },
      { id: 'anim-curtain', label: 'Telón teatro' },
      { id: 'anim-reveal-circle', label: 'Círculo revelador' },
    ]
  },
  {
    label: '🌀 3D y Perspectiva', items: [
      { id: 'anim-spin', label: 'Giro 3D' },
      { id: 'anim-perspective', label: 'Perspectiva' },
      { id: 'anim-book-flip', label: 'Volteo libro' },
      { id: 'anim-fold-in', label: 'Plegar papel' },
      { id: 'anim-fan', label: 'Abanico' },
      { id: 'anim-hologram', label: 'Holograma' },
    ]
  },
  {
    label: '🎸 Elásticos y Rebotes', items: [
      { id: 'anim-bounce-in', label: 'Rebote' },
      { id: 'anim-elastic', label: 'Elástico' },
      { id: 'anim-pulse-in', label: 'Latido' },
      { id: 'anim-compress', label: 'Comprimir' },
      { id: 'anim-stretch', label: 'Estirar' },
      { id: 'anim-accordion', label: 'Acordeón' },
      { id: 'anim-stamp', label: 'Sello' },
    ]
  },
  {
    label: '⚡ Dinámicas', items: [
      { id: 'anim-zoom', label: 'Zoom' },
      { id: 'anim-speed-in', label: 'Velocidad' },
      { id: 'anim-slingshot', label: 'Resortera' },
      { id: 'anim-swing', label: 'Columpio' },
      { id: 'anim-roll-in', label: 'Girar rodando' },
      { id: 'anim-spiral', label: 'Remolino' },
      { id: 'anim-vortex', label: 'Vórtice' },
    ]
  },
  {
    label: '🔥 Efectos Especiales', items: [
      { id: 'anim-glitch', label: 'Glitch' },
      { id: 'anim-wave', label: 'Ola' },
      { id: 'anim-light-sweep', label: 'Barrido luz' },
      { id: 'anim-morph', label: 'Morfar' },
      { id: 'anim-burnout', label: 'Quemar' },
      { id: 'anim-neon-flicker', label: 'Neón parpadeo' },
      { id: 'anim-ascend', label: 'Ascender' },
      { id: 'anim-descend', label: 'Descender' },
    ]
  },
  {
    label: '🔤 Letra por letra', items: [
      { id: 'anim-letter-rise', label: 'Elevar' },
      { id: 'anim-letter-wave', label: 'Ola' },
      { id: 'anim-letter-stagger', label: 'Escalonado' },
      { id: 'anim-letter-tumble', label: 'Tumbar' },
      { id: 'anim-letter-swing', label: 'Columpio' },
      { id: 'anim-letter-shake', label: 'Agitar' },
      { id: 'anim-letter-zoom', label: 'Zoom' },
      { id: 'anim-letter-glow', label: 'Resplandor' },
      { id: 'anim-letter-flip', label: 'Volteo 3D' },
      { id: 'anim-letter-elastic', label: 'Elástico' },
    ]
  },
]

export const ANUNCIO_ANIM_IDS = [
  'anim-fade', 'anim-dissolve', 'anuncio-blur-in', 'anuncio-slide-up',
  'anuncio-drop-in', 'anuncio-float-in', 'anuncio-bounce', 'anuncio-flip',
  'anuncio-zoom', 'anuncio-swirl-in', 'anuncio-glow', 'anuncio-gradient',
  'anuncio-fire', 'letra-fade', 'letra-slide-up', 'letra-pop',
  'letra-bounce', 'letra-flip'
]

export const BG_CATEGORIES = [
  { label: 'Suaves', items: [
    { id: 'anuncio-bg-soft-lavender', label: 'Lavanda' },
    { id: 'anuncio-bg-soft-sky', label: 'Cielo' },
    { id: 'anuncio-bg-glass', label: 'Vidrio' },
    { id: 'anuncio-bg-fade', label: 'Degradado' },
  ]},
  { label: 'Oscuros', items: [
    { id: 'anuncio-bg-midnight', label: 'Medianoche' },
    { id: 'anuncio-bg-gradient', label: 'Violeta' },
    { id: 'anuncio-bg-circles', label: 'Círculos' },
    { id: 'anuncio-bg-waves', label: 'Olas' },
  ]},
  { label: 'Vibrantes', items: [
    { id: 'anuncio-bg-rainbow', label: 'Arcoíris' },
    { id: 'anuncio-bg-neon', label: 'Neón' },
    { id: 'anuncio-bg-sunset', label: 'Atardecer' },
    { id: 'anuncio-bg-ocean', label: 'Océano' },
  ]},
]

export const ANUNCIO_SIZES = [
  { id: 'anuncio-sm', label: 'S' },
  { id: 'anuncio-md', label: 'M' },
  { id: 'anuncio-lg', label: 'L' },
  { id: 'anuncio-xl', label: 'XL' },
]

export const ANUNCIO_FONTS = [
  { id: 'anuncio-font-normal', label: 'Normal' },
  { id: 'anuncio-font-bold', label: 'Negrita' },
  { id: 'anuncio-font-light', label: 'Fino' },
  { id: 'anuncio-font-italic', label: 'Itálica' },
  { id: 'anuncio-font-cursive', label: 'Cursiva' },
]

export const COLOR_CATEGORIES = [
  { label: 'Sólidos', items: [
    { id: 'anuncio-color-white', label: 'Blanco' },
    { id: 'anuncio-color-gold', label: 'Dorado' },
    { id: 'anuncio-color-gradient', label: 'Violeta' },
    { id: 'anuncio-color-sunset', label: 'Atardecer' },
    { id: 'anuncio-color-ocean', label: 'Océano' },
    { id: 'anuncio-color-aurora', label: 'Aurora' },
    { id: 'anuncio-color-rainbow', label: 'Arcoíris' },
    { id: 'anuncio-color-neon', label: 'Neón' },
  ]},
]
