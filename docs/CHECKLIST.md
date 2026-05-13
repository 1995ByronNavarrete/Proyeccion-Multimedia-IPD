# Checklist de Actividades — DesktopAppIPD

> Marca cada tarea como completada (`[x]`) a medida que avanzas.

---

## Sprint 1 — Fundación

### Proyecto
- [ ] Inicializar Electron + React + Vite + TypeScript
- [ ] Configurar TailwindCSS, Framer Motion, Zustand
- [ ] Configurar ESLint y Prettier

### Base de datos
- [ ] Instalar better-sqlite3 en main process
- [ ] Crear schema inicial con todas las tablas
- [ ] Script de seed para datos bíblicos

### IPC
- [ ] Crear preload.ts con contextBridge
- [ ] Registrar ipcMain.handle() para bible:*
- [ ] Registrar ipcMain.handle() para screen:*
- [ ] Registrar ipcMain.handle() para projector:*
- [ ] Registrar ipcMain.handle() para medialocal:*
- [ ] Registrar ipcMain.handle() para video:*

### Ventanas
- [ ] Ventana principal con layout base y menú lateral
- [ ] Ventana proyector secundaria fullscreen
- [ ] Detección de monitores con electron.screen.getAllDisplays()

---

## Sprint 2 — Módulo Biblia (M1)

- [ ] Importar datos bíblicos (JSON → SQLite)
- [ ] Navegación jerárquica: traducción → libro → capítulo → versículo
- [ ] Animaciones de transición entre niveles
- [ ] Buscador rápido de versículos (LIKE + FTS)
- [ ] Botón "Proyectar" → enviar versículo vía IPC
- [ ] Overlay de texto sobre video con control de opacidad
- [ ] Soporte para múltiples traducciones (RVR1960, NVI, etc.)

---

## Sprint 3 — Módulo Proyector (M2) + Biblioteca Multimedia Local (M3)

### Proyector
- [ ] Panel de pantallas conectadas con preview y selección
- [ ] Botón "Proyectar en todas" / selección individual
- [ ] Buscador de YouTube integrado (API v3 + ytdl-core)
- [ ] Reproductor multimedia en ventana proyector
- [ ] Controles: Play, Pause, Volumen, Loop, Fade In/Out
- [ ] Pantalla negra rápida
- [ ] Stop global

### Biblioteca Multimedia Local
- [ ] Explorador de archivos nativo (dialog.showOpenDialog)
- [ ] Carga y reproducción de MP4, AVI, MKV, MOV, MP3, WAV, FLAC, AAC
- [ ] Escaneo de carpetas para importar bibliotecas completas
- [ ] Gestor de listas de reproducción (CRUD en SQLite)
- [ ] Vista previa con metadatos (duración, resolución, codec, bitrate)
- [ ] Arrastrar y soltar archivos desde el explorador de Windows
- [ ] Búsqueda y filtrado por nombre, tipo, duración y fecha
- [ ] Marcar medios como favoritos
- [ ] Enviar medio al proyector para pantalla secundaria

---

## Sprint 4 — Programación de Videos (M4)

- [ ] CRUD de eventos en SQLite
- [ ] Etapas del servicio: Inicio, Alabanza, Predicación, Oración, Despedida
- [ ] Temporizador y cuenta regresiva antes de cada reproducción
- [ ] Reproducción secuencial automática
- [ ] Prioridad manual (interrupción sobre programación automática)
- [ ] Guardado y carga de sesiones
- [ ] Historial de reproducción

---

## Sprint 5 — Configuración (M5) + Funciones Extra (M6) + Empaquetado

### Configuración
- [ ] Preferencias generales: monitor primario, opacidad overlay, fuentes
- [ ] Atajos de teclado configurables
- [ ] Gestión de traducciones bíblicas (activar/desactivar)
- [ ] Configuración de control remoto WebSocket

### Funciones Extra
- [ ] Fondos dinámicos (imágenes y videos locales)
- [ ] Overlay de letras de canciones
- [ ] Transiciones cinematográficas entre contenidos
- [ ] Control remoto desde celular vía WebSocket
- [ ] Sistema de escenas (guardar/restaurar estado completo)
- [ ] Modo emergencia sin Internet
- [ ] Cache y descarga previa de videos

### Empaquetado
- [ ] Configurar electron-builder
- [ ] Generar instalador .exe autónomo
- [ ] Probar instalación limpia en Windows

---

## Pruebas Generales

- [ ] Probar todos los módulos sin conexión a internet
- [ ] Verificar independencia entre módulos (desactivar/activar cada uno)
- [ ] Probar multi-monitor con 2+ pantallas
- [ ] Probar drag & drop de archivos multimedia
- [ ] Verificar que el overlay de texto funciona sobre video
- [ ] Probar reproducción secuencial de programación de videos
