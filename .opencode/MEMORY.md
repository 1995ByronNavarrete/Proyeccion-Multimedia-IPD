# MEMORIA DEL PROYECTO — Proyeccion-Multimedia-IPD

> Archivo de continuidad para mantener contexto entre sesiones de opencode.

---

## DATOS DEL PROYECTO

- **Nombre**: Proyeccion-Multimedia-IPD (DesktopAppIPD)
- **Stack**: Electron + React 18 + TypeScript + TailwindCSS + SQLite (sql.js)
- **Build**: electron-vite + electron-builder
- **Autor**: Byron Antonio Navarrete Cañada
- **Version actual**: 1.5.3
- **Repo**: https://github.com/1995ByronNavarrete/Proyeccion-Multimedia-IPD

---

## ARQUITECTURA

### Procesos
- **Main process** (`src/main/`): Node.js, IPC handlers, SQLite, ventanas, video
- **Preload** (`src/preload/`): API bridge expuesto via `contextBridge`
- **Renderer** (`src/renderer/`): React SPA con HashRouter

### Vistas principales
| Ruta | Archivo | Proposito |
|------|---------|-----------|
| `/` (MainLayout) | `DashboardView.tsx` | Layout principal con paneles modulares |
| `/projector` | `ProjectorView.tsx` | Ventana de proyeccion externa (fullscreen) |

### Modulos (definidos en `modules.tsx`)
| ID | Nombre | Zona | Default |
|----|--------|------|---------|
| `pantallas` | Pantallas | left-bottom | si |
| `youtube` | YouTube | left-bottom | si |
| `imagenes` | Imagenes | center-bottom | si |
| `audio` | Consola Audio | center-bottom | si |
| `anuncios` | Anuncios | center-bottom | si |
| `predicacion` | Predicacion | right-bottom | si |
| `multimedia` | Multimedia | right-bottom | si |
| `efectos` | Efectos Visuales | right-bottom | si |
| `cronometro` | Cronometro | right-bottom | si |
| `escenas` | Escenas | right-bottom | si |
| `configuracion` | Configuracion | right-bottom | no |

---

## CAMBIOS RECIENTES

### 2026-05-23: Fix video pegado en ProjectionView
- **Archivos**: `ProjectionView.tsx`, `DashboardView.tsx`
- **Problema**: Los videos se quedaban pegados (no se actualizaban) en la vista previa del operador
- **Solucion**: Se aplico la misma logica de `SecondaryDisplay` a `ProjectionView`:
  - Se agregaron props `bgVideo`, `onPause`, `onResume`, `onStop`
  - Se anadio tracking de URL con `lastUrlRef` para detectar cambios y reiniciar el video
  - Se agregaron efectos para manejar play/pause/stop de videos locales (via `<video>`) y YouTube (via `<iframe>` + postMessage)
  - Se agrego limpieza de src cuando la URL se vuelve null
  - Se anadio sistema de autodiagnostico (boton `⚡`) con overlay de debug y `runSelfTest()`
- **Commit**: `5fd1937`

### 2026-05-23: Creacion de agentes opencode
- **Archivos**: `.opencode/agents/leader.md`, `.opencode/agents/biblia.md`, `.opencode/agents/multimedia.md`
- **Config**: `opencode.json`
- **Memoria**: `.opencode/MEMORY.md`

---

## CONVENCIONES DE CODIGO

- **Estilo**: Sin comentarios en codigo (a menos que el usuario los pida explicitamente)
- **Imports**: Agrupar por (1) librerias externas, (2) componentes locales, (3) tipos/utilidades
- **Iconos**: Usar `lucide-react`
- **Rutas**: HashRouter con `<HashRouter>`
- **Estado**: useState/useRef local (no hay Zustand ni Redux)
- **Comunicacion IPC**: `window.api.*` via preload
- **i18n**: Claves en `i18n.tsx` con `useLang().t('clave')`
- **Multi-monitor**: `window.api.screen.getLayout()` para detectar pantallas

---

## AGENTES OPENCODE

| Agente | Rol | Archivo |
|--------|-----|---------|
| `leader` | Coordina el equipo, revisa arquitectura | `.opencode/agents/leader.md` |
| `biblia` | Modulo de Biblia (navegacion, proyeccion, DB) | `.opencode/agents/biblia.md` |
| `multimedia` | Video, audio, imagenes, efectos, pantallas | `.opencode/agents/multimedia.md` |

---

## PENDIENTES / OBSERVACIONES

- (vacio)

---

## NOTAS

- La base de datos SQLite usa sql.js (no better-sqlite3 como dice PLAN.md)
- El build en dev usa `electron-vite dev` con HMR
- Para produccion: `npm run release` (typecheck + build + electron-builder --win)
- Los archivos multimedia se almacenan en `app.getPath('documents')/Fondos/`
- Las traducciones biblicas se descargan a la base de datos local
