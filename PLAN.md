# DesktopAppIPD — Plan de Desarrollo

> **Resumen ejecutivo:** Este plan describe el desarrollo de **DesktopAppIPD**, una aplicación de escritorio profesional para iglesias que unifica en un solo sistema la proyección de biblia interactiva, reproducción de videos (YouTube + locales), soporte multi-monitor y automatización de servicios. El objetivo es reemplazar múltiples herramientas (ProPresenter, EasyWorship, OBS) con una solución integrada, moderna y gratuita, construida con tecnologías open-source (Electron + React + TypeScript + SQLite), funcionando 100% local sin depender de servidores externos ni conexión a internet para las funcionalidades críticas. El proyecto está organizado en 5 sprints entregables, comenzando con la fundación técnica y culminando con el empaquetado comercial.

## Descripción General
Aplicación de **escritorio** profesional para iglesias. Sistema de proyección multimedia con biblia interactiva, reproducción de videos de YouTube, soporte multi-monitor y automatización de servicios. Interfaz moderna modo oscuro, minimalista y cinematográfica.

---

## Objetivos del Plan

### Objetivo General
Desarrollar una aplicación de escritorio gratuita, profesional y funcionalmente completa para la proyección multimedia en iglesias, capaz de operar sin conexión a internet, reemplazando herramientas comerciales como ProPresenter y EasyWorship con una solución moderna, ligera y de código abierto.

### Objetivos Específicos
1. **Biblia interactiva offline**: Proveer navegación y búsqueda bíblica con múltiples traducciones almacenadas localmente en SQLite, con capacidad de proyección en pantalla secundaria.
2. **Proyección multi-monitor**: Detectar y gestionar múltiples pantallas conectadas, permitiendo enviar contenido (biblia, videos, fondos) a monitores específicos o a todos simultáneamente.
3. **Reproducción de YouTube integrada**: Buscar y reproducir videos de YouTube directamente desde la aplicación sin necesidad de ventanas externas.
4. **Biblioteca multimedia local**: Explorar, importar y reproducir música y videos almacenados en el disco local, con gestión de listas de reproducción, garantizando funcionamiento offline completo.
5. **Automatización de servicios**: Programar eventos multimedia por hora o por etapa del servicio (alabanza, predicación, etc.) con reproducción automática secuencial.
6. **Overlay de texto sobre video**: Superponer texto bíblico sobre videos de fondo en tiempo real, con control de opacidad y transiciones suaves.
7. **Disponibilidad offline**: Garantizar que las funcionalidades críticas (biblia, fondos locales, biblioteca multimedia, sesiones) funcionen sin conexión a internet.
8. **Experiencia profesional**: Lograr una interfaz de usuario moderna, intuitiva y cinematográfica, equiparable a software comercial de proyección.
9. **Instalación simple**: Empaquetar la aplicación como un instalador .exe autónomo que no requiera configuraciones complejas ni dependencias externas.

---

## Stack Tecnológico (Desktop)

| Tecnología | Versión | Rol en la app de escritorio |
|---|---|---|
| **Electron** | Última estable | Runtime nativo de escritorio. Acceso a ventanas, monitores, sistema de archivos, menús nativos |
| **React** | 18+ | UI componentizada en el proceso renderer |
| **Vite** | 5+ | Build rápido, HMR, empaquetado del frontend |
| **TypeScript** | 5+ | Tipado seguro en main y renderer process |
| **TailwindCSS** | 3+ | Estilos utilitarios, dark mode, diseño consistente |
| **Framer Motion** | Última | Animaciones fluidas en la interfaz |
| **better-sqlite3** | Última | Base de datos local embebida (main process, sincrónica) |
| **ytdl-core** | Última | Descarga y reproducción de audio/video de YouTube |
| **Zustand** | Última | Estado global liviano en el renderer |
| **Lucide React** | Última | Iconos vectoriales profesionales |

### Comunicación (sin servidores externos)
- **Electron IPC** (ipcMain / ipcRenderer) — canal de comunicación main ↔ renderer
- No hay backend externo. El main process de Electron actúa como servidor interno.

### Principio de Independencia de Módulos
Cada módulo debe ser funcionalmente autónomo: puede operar, ser desactivado o eliminado sin afectar a los demás. La comunicación entre módulos ocurre exclusivamente vía IPC a través del main process, nunca de forma directa entre módulos del renderer. Cada módulo tiene su propio store de estado (Zustand), sus propios handlers IPC y su propia sección en la UI.

---

## Arquitectura Desktop (Procesos de Electron)

```
┌──────────────────────────────────────────────────────────┐
│                     MAIN PROCESS                         │
│  (main.ts - Node.js)                                     │
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │ Window       │  │ SQLite       │  │ IPC Handlers    │  │
│  │ Manager      │  │ (datos)      │  │ (independientes)│  │
│  │ ● Crear      │  │ ● Biblias    │  │ ● bible:*       │  │
│  │ ● Posicion   │  │ ● MediosLoc. │  │ ● screen:*      │  │
│  │ ● Fullscreen │  │ ● Playlists  │  │ ● projector:*   │  │
│  │ ● Multi-display│ │ ● Sesiones   │  │ ● medialocal:*  │  │
│  │              │  │ ● Historial  │  │ ● video:*       │  │
│  └──────────────┘  └──────────────┘  └────────────────┘  │
│                                                           │
└───────────────────────┬──────────────────────────────────┘
                        │ IPC (contextBridge)
           ┌────────────┴────────────┐
           ▼                         ▼
┌─────────────────────┐   ┌──────────────────────────┐
│   MAIN WINDOW       │   │  PROJECTOR WINDOW(S)     │
│   (Renderer)        │   │  (Renderer)              │
│                     │   │                          │
│  ┌───────────────┐  │   │  ┌──────────────────┐    │
│  │ React App     │  │   │  │ Fullscreen        │    │
│  │ (módulos indep)│  │   │  │ ● Texto bíblico  │    │
│  │               │  │   │  │ ● Video fondo     │    │
│  │ ● Biblia      │  │   │  │ ● Overlay         │    │
│  │ ● Proyector   │  │   │  │ ● Transiciones    │    │
│  │ ● Biblio.Mult.│  │   │  └──────────────────┘    │
│  │ ● Programac.  │  │   └──────────────────────────┘
│  │ ● Config.     │  │
│  │ ● Extra       │  │
│  └───────────────┘  │
└─────────────────────┘
```

### Flujo de datos (Desktop IPC):
```
React UI → preload.ts (contextBridge) → ipcMain.handle() → SQLite / Window Manager
                                                                      ↓
                                                    ProjectorWindow.webContents.send()
```

---

## Funcionalidades por Módulo

### M1 — Biblia
- [ ] Navegación jerárquica: traducción → libro → capítulo → versículo
- [ ] Datos almacenados localmente en SQLite (sin depender de Internet)
- [ ] Buscador rápido de versículos (LIKE en SQLite + FTS)
- [ ] Vista limpia con scroll suave y animaciones
- [ ] Botón "Proyectar" → envía versículo a la ventana proyector vía IPC
- [ ] Múltiples traducciones (RVR1960, NVI, etc.) almacenadas en SQLite
- [ ] Overlay de texto sobre video con control de opacidad

### M2 — Proyector (Panel de Control)
- [ ] Detección de monitores conectados via `electron.screen.getAllDisplays()`
- [ ] Lista de pantallas con nombre, resolución, estado y mini preview
- [ ] Botón "Proyectar en todas" o selección individual
- [ ] Buscador de YouTube integrado (YouTube Data API v3)
- [ ] Reproducción de video en ventana proyector (fullscreen automático)
- [ ] Controles multimedia: Play/Pause, Volumen, Loop, Fade In/Out
- [ ] Pantalla negra rápida, Stop global

### M3 — Biblioteca Multimedia Local
- [ ] Explorador de archivos nativo para navegar y seleccionar música/videos del disco local
- [ ] Carga y reproducción de formatos populares (MP4, AVI, MKV, MOV, MP3, WAV, FLAC, AAC)
- [ ] Escaneo de carpetas para importar bibliotecas completas al gestor
- [ ] Gestor de listas de reproducción (playlists) almacenadas en SQLite
- [ ] Vista previa con metadatos (duración, resolución, codec, bitrate)
- [ ] Arrastrar y soltar archivos desde el explorador de Windows
- [ ] Búsqueda y filtrado por nombre, tipo, duración y fecha de importación
- [ ] Marcar medios como favoritos para acceso rápido
- [ ] Reproducción offline total sin dependencia de YouTube ni conexión a internet
- [ ] Enviar medio al proyector para reproducción en pantalla secundaria

### M4 — Programación de Videos
- [ ] Crear eventos programados por hora o por etapa del servicio
- [ ] Etapas: Inicio, Alabanza, Predicación, Oración, Despedida
- [ ] Reproducción automática secuencial con transiciones suaves
- [ ] Cuenta regresiva antes de cada reproducción
- [ ] Prioridad manual (interrupción) sobre la programación automática
- [ ] Guardado de sesiones y carga automática al iniciar
- [ ] Historial de reproducción en SQLite

### M5 — Configuración
- [ ] Preferencias generales: monitor primario, opacidad overlay, fuentes
- [ ] Atajos de teclado configurables
- [ ] Gestión de traducciones bíblicas (activar/desactivar)
- [ ] Configuración de control remoto (WebSocket para celular)

### M6 — Funciones Extra
- [ ] Fondos dinámicos (imágenes y videos locales)
- [ ] Overlay de letras de canciones
- [ ] Transiciones cinematográficas entre contenidos
- [ ] Control remoto desde celular vía WebSocket
- [ ] Sistema de escenas (guardar/restaurar estado completo)
- [ ] Modo emergencia sin Internet (biblias y sesiones en SQLite local)
- [ ] Cache y descarga previa de videos

---

## Base de Datos (SQLite local en main process)

```sql
CREATE TABLE traducciones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  abreviatura TEXT NOT NULL,
  idioma TEXT DEFAULT 'es',
  activa BOOLEAN DEFAULT 1
);

CREATE TABLE libros (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  traduccion_id INTEGER NOT NULL,
  nombre TEXT NOT NULL,
  orden INTEGER NOT NULL,
  testamento TEXT NOT NULL,
  FOREIGN KEY (traduccion_id) REFERENCES traducciones(id)
);

CREATE TABLE versiculos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  libro_id INTEGER NOT NULL,
  capitulo INTEGER NOT NULL,
  versiculo INTEGER NOT NULL,
  texto TEXT NOT NULL,
  FOREIGN KEY (libro_id) REFERENCES libros(id)
);

CREATE TABLE sesiones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  configuracion TEXT
);

CREATE TABLE historial (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo TEXT NOT NULL,
  contenido TEXT NOT NULL,
  fecha DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE eventos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  tipo_evento TEXT,
  hora_programada TIME,
  orden INTEGER DEFAULT 0,
  activo BOOLEAN DEFAULT 1
);

CREATE TABLE medios_locales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  ruta_archivo TEXT NOT NULL UNIQUE,
  tipo TEXT NOT NULL CHECK(tipo IN ('audio', 'video')),
  formato TEXT,
  duracion_segundos INTEGER,
  resolucion TEXT,
  tamano_bytes INTEGER,
  favorito BOOLEAN DEFAULT 0,
  fecha_agregado DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE listas_reproduccion (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE lista_medios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lista_id INTEGER NOT NULL,
  medio_id INTEGER NOT NULL,
  orden INTEGER DEFAULT 0,
  FOREIGN KEY (lista_id) REFERENCES listas_reproduccion(id) ON DELETE CASCADE,
  FOREIGN KEY (medio_id) REFERENCES medios_locales(id) ON DELETE CASCADE
);
```

---

## APIs Externas

| API | Propósito | Límite Gratuito |
|---|---|---|
| **YouTube Data API v3** | Buscar videos y obtener metadatos | 10,000 requests/día |
| **YouTube (ytdl-core)** | Reproducir audio/video en el reproductor local | Sin límite |

Los datos bíblicos son **locales** (SQLite). No se requiere API externa para la biblia.

---

## Diseño Visual (UI/UX)

- **Modo oscuro** por defecto
- **Colores**: Negro profundo, azul oscuro, morado eléctrico, cyan
- **Efectos**: Glassmorphism, blur, bordes redondeados, neon glow suave
- **Inspiración**: ProPresenter, EasyWorship, OBS Studio, Spotify, Netflix
- **Tipografía**: Moderna, grande para lectura en proyector
- **Ventana proyector**: Fullscreen en monitor secundario, overlay con opacidad ajustable

---

## Roadmap (Sprints)

### Sprint 1 — Fundación
- [ ] Inicializar proyecto: Electron + React + Vite + TypeScript
- [ ] Configurar TailwindCSS, Framer Motion, Zustand
- [ ] Configurar SQLite con better-sqlite3 en main process
- [ ] IPC bridge básico (preload.ts con contextBridge)
- [ ] Detección de monitores con `electron.screen.getAllDisplays()`
- [ ] Ventana principal con layout base y menú lateral
- [ ] Ventana proyector secundaria fullscreen

### Sprint 2 — Módulo Biblia
- [ ] Importar datos bíblicos en SQLite (JSON → SQLite)
- [ ] Navegación jerárquica con animaciones
- [ ] Búsqueda de versículos
- [ ] Proyectar versículo/capítulo a ventana proyector vía IPC
- [ ] Overlay de texto con opacidad ajustable

### Sprint 3 — Módulo Proyector y Biblioteca Multimedia Local
- [ ] Panel de pantallas conectadas con preview y selección
- [ ] Buscador de YouTube (API v3 + ytdl-core)
- [ ] Reproductor multimedia en ventana proyector
- [ ] Controles: play, pause, volumen, fade, stop
- [ ] Explorador de archivos nativo para importar música y videos locales
- [ ] Escaneo de carpetas y gestión de biblioteca local en SQLite
- [ ] Creación y administración de listas de reproducción (playlists)
- [ ] Reproducción offline de archivos locales sin YouTube

### Sprint 4 — Programación de Videos
- [ ] CRUD de eventos con SQLite
- [ ] Temporizador y cuenta regresiva
- [ ] Reproducción secuencial automática
- [ ] Guardado y carga de sesiones

### Sprint 5 — Configuración y Empaquetado
- [ ] Pantalla de configuración completa
- [ ] Atajos de teclado
- [ ] Control remoto WebSocket
- [ ] Fondos dinámicos (imágenes y videos locales)
- [ ] Empaquetado con electron-builder (instalador .exe)
