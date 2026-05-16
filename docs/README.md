# Proyección Multimedia IPD

Sistema profesional de proyección multimedia para iglesias, construido con Electron + React + TypeScript.

## Versión

1.2.1

## Desarrollador

**Byron Antonio Navarrete Cañada**

---

## Stack Tecnológico

| Componente | Tecnología |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Backend/Desktop | Electron 33 |
| Build | electron-vite |
| Estilos | TailwindCSS 3 |
| Base de datos | SQLite (sql.js WASM) |
| Audio/Video | Web Audio API, YouTube IFrame API |
| Actualizaciones | electron-updater + GitHub Releases |

## Estructura del Proyecto

```
src/
├── main/                    # Proceso principal (Node.js)
│   ├── index.ts            # Punto de entrada: ventanas, IPC, auto-updater
│   ├── database.ts         # Inicialización SQLite, queries, seed de Biblia
│   ├── ipc-handlers.ts     # Handlers IPC: Biblia, multimedia, anuncios, app
│   ├── bible-source.ts     # Fuentes externas de datos bíblicos
│   ├── bible-seed.ts       # Seed de biblias desde APIs
│   ├── video-handlers.ts   # YouTube (yt-search, play-dl, youtube-dl-exec)
│   ├── backup-handler.ts   # Backup y restauración de BD
│   └── streaming-service.ts # Streaming en vivo vía FFmpeg
├── preload/
│   └── index.ts            # contextBridge: API expuesta al renderer
└── renderer/
    ├── index.html
    └── src/
        ├── main.tsx        # Entry point React
        ├── App.tsx         # Router principal (HashRouter)
        ├── env.d.ts        # Tipos TypeScript globales
        ├── constants.ts    # Constantes de animaciones
        ├── assets/
        │   └── main.css    # Estilos globales + animaciones CSS
        ├── layouts/
        │   └── MainLayout.tsx
        ├── views/
        │   ├── DashboardView.tsx    # Vista principal (grid 3 columnas)
        │   └── ProjectorView.tsx    # Vista proyector (fullscreen)
        └── components/
            ├── header/
            │   └── Header.tsx       # Barra superior con logo, reloj, controles
            ├── theme/
            │   └── ThemeToggle.tsx  # Toggle claro/oscuro
            ├── mixer/
            │   ├── AudioControl.tsx # Consola de audio profesional
            │   └── ServiceTimer.tsx # Temporizador de servicio (reemplazado)
            ├── shared/
            │   ├── AnimSelectorModal.tsx # Selector de animaciones compartido
            │   └── ImageEditor.tsx  # Editor de imágenes con filtros
            ├── BibliaPanel.tsx      # Navegación y búsqueda bíblica
            ├── ProyectorPanel.tsx   # Control de pantallas
            ├── ProjectionView.tsx   # Vista previa de proyección
            ├── SecondaryDisplay.tsx # Vista secundaria (video fondo)
            ├── ReproductorPanel.tsx # Reproductor de audio/video local
            ├── VideoControls.tsx    # Controles de video proyectado
            ├── YouTubeSearch.tsx    # Buscador de YouTube
            ├── EscenasPanel.tsx     # Fondos, imágenes, anuncios, tareas
            ├── ProgramacionPanel.tsx # Navegador de archivos multimedia
            ├── DirectoryBrowser.tsx # Explorador de directorios multimedia
            ├── AudioVisualizer.tsx  # Visualizador de audio
            ├── UpdateNotifier.tsx   # Notificador de actualizaciones
            ├── EffectsPanel.tsx     # Efectos visuales para proyector
            ├── MoodPanel.tsx        # Ambiente/color para proyector
            ├── QuickRefPanel.tsx    # Referencia bíblica rápida
            ├── DrawPanel.tsx        # Pizarra digital
            ├── SlideshowPanel.tsx   # Presentación de diapositivas
            ├── ShortcutsPanel.tsx   # Atajos de teclado
            ├── SermonPanel.tsx      # Puntos de sermón
            ├── LyricsPanel.tsx      # Letras de canciones
            ├── TextProjector.tsx    # Proyector de texto rápido
            ├── QRPanel.tsx          # Generador de códigos QR
            ├── QuickControls.tsx    # Controles rápidos
            ├── WallpaperPanel.tsx   # Fondo de interfaz
            ├── EventPanel.tsx       # Próximo evento
            └── ThemePanel.tsx       # Personalización de tema
```
