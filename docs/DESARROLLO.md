# Guía de Desarrollo

## Scripts Disponibles

```bash
npm run dev          # Inicia entorno de desarrollo (hot reload)
npm run build        # Compila para producción
npm run typecheck    # Verifica tipos TypeScript
npm run preview      # Vista previa de build
npm run release      # Build + empaquetado con electron-builder
```

## Arquitectura

### Procesos de Electron

```
┌─────────────────────────────────────────────────────┐
│                 MAIN PROCESS (Node.js)               │
│  src/main/index.ts                                   │
│    ├── database.ts    → SQLite (sql.js)              │
│    ├── ipc-handlers.ts → Handlers IPC               │
│    ├── bible-source.ts → APIs externas               │
│    ├── bible-seed.ts   → Seed de datos bíblicos      │
│    ├── video-handlers.ts → YouTube                   │
│    ├── backup-handler.ts → Backup BD                 │
│    └── streaming-service.ts → FFmpeg → RTMP          │
└──────────────────────┬──────────────────────────────┘
                       │ IPC (contextBridge)
                       ▼
┌──────────────────────────┐ ┌────────────────────────┐
│   RENDERER MAIN WINDOW   │ │  RENDERER PROJECTOR     │
│   React + Tailwind       │ │  (fullscreen 2do mon.)  │
│   DashboardView.tsx      │ │  ProjectorView.tsx      │
└──────────────────────────┘ └────────────────────────┘
```

### Comunicación IPC

Toda la comunicación entre procesos usa `contextBridge.exposeInMainWorld`:

```typescript
// Preload expone:
window.api.biblia.*        // Operaciones bíblicas
window.api.projector.*     // Control del proyector
window.api.video.*         // Reproducción de video
window.api.medialocal.*    // Archivos multimedia locales
window.api.app.*           // Configuración de la app
window.api.update.*        // Actualizaciones
window.api.on()            // Eventos push del main process
```

### Canales de eventos (push)

Los canales válidos están definidos en `src/preload/index.ts`:

- `projector:content` - Nuevo contenido para proyectar
- `projector:showBlack` - Pantalla negra
- `projector:playVideo` / `projector:pauseVideo` / etc.
- `projector:overlay` - Efectos visuales overlay
- `video:progress` - Progreso de reproducción
- `medialocal:changed` - Cambios en archivos multimedia
- `bible:downloadProgress` - Progreso de descarga bíblica
- `update:*` - Eventos de actualización

## Base de Datos SQLite

### Tablas principales

| Tabla | Propósito |
|---|---|
| `traducciones` | Versiones bíblicas |
| `libros` | Libros por traducción |
| `versiculos` | Todos los versículos |
| `medios_locales` | Archivos multimedia importados |
| `listas_reproduccion` | Playlists |
| `lista_medios` | Relación playlist-medios |
| `anuncios` | Anuncios guardados |
| `tareas_imagenes` | Tareas con imágenes |
| `tarea_imagenes` | Imágenes asociadas a tareas |

### Búsqueda sin acentos

Se registró una función SQL personalizada `noacct()` que elimina diacríticos:

```typescript
db.create_function('noacct', (s: string) => 
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
)
```

## Estilos y Tema

### TailwindCSS + CSS Variables

El tema usa colores personalizados de Tailwind y variables CSS:

```css
:root {
  --accent: #6c5ce7;     /* Color de acento principal */
  --wallpaper: none;      /* Imagen de fondo de la interfaz */
}
```

### Tema oscuro/claro

El tema se controla mediante la clase `.light` en `<html>` y persiste en `localStorage('theme')`.

## Componentes Compartidos

### AnimSelectorModal
Selector de animaciones reutilizable en 3 contextos:
- ProjectionView (animación de versículos)
- EscenasPanel (animación de fondos)

### ImageEditor
Editor de imágenes con canvas:
- Ajustes: Brillo, Contraste, Saturación
- Filtros: Gris, Sepia, Invertir, Vintage, Frío, Cálido, Dramático
- Transformaciones: Rotar, Voltear H/V
- Zoom

## Web Audio API

El ReproductorPanel construye una cadena de audio:

```
<audio> → EQ Filters (8 bandas) → StereoPanner → Gain → Destination
```

Los filtros EQ se aplican mediante `BiquadFilterNode` (lowshelf, peaking, highshelf).

## Actualizaciones

Configurado via `electron-updater` con GitHub Releases:

```json
{
  "publish": {
    "provider": "github",
    "owner": "1995ByronNavarrete",
    "repo": "Proyeccion-Multimedia-IPD"
  }
}
```

## Empaquetado

```bash
npm run release
```

Genera instalador NSIS para Windows en `/release`.
