# Mejoras Realizadas

## 1. BibliaPanel (`src/renderer/src/components/BibliaPanel.tsx`)
- **Vista previa con contexto**: Muestra 2 versículos antes y después del seleccionado (anteriores en opaco, actual destacado con borde morado `border-l-2 border-[#6c5ce7]`)
- **Referencia + traducción** en el encabezado de la vista previa
- **Botón Proyectar con feedback**: cambia a verde "Proyectado" con ícono Check por 1.5s al proyectar
- **Resultados de búsqueda** con etiqueta de traducción coloreada y hover con desplazamiento sutil

## 2. EffectsPanel (`src/renderer/src/components/EffectsPanel.tsx`)
- Rediseñado a formato compacto con **pills/chips** en lugar de lista vertical
- Header más pequeño con indicador inline del efecto activo
- Botón para quitar efecto en el header (ya no requiere scroll hasta abajo)
- Configuración accesible desde engranaje en el header
- Toggle rápido: tocar el mismo efecto lo desactiva

## 3. DirectoryBrowser (`src/renderer/src/components/DirectoryBrowser.tsx`)
- **Barra de búsqueda** para filtrar archivos por nombre en tiempo real
- **Ordenamiento** por nombre o tamaño (asc/desc) con indicador visual
- **Badge de extensión** del archivo (MP4, MP3, etc.)
- **Icono con fondo de color** por tipo de archivo
- **Botones de acción hover**: aparecen al pasar el mouse (interfaz más limpia)
- Tamaño de fuente ajustado a 12px

## 4. AnimSelectorModal (`src/renderer/src/components/shared/AnimSelectorModal.tsx`)
- Selector de animaciones cambiado a **formato lista vertical** con indicadores circulares (luego revertido a grid por solicitud del usuario)

## 5. Layout - DashboardView (`src/renderer/src/views/DashboardView.tsx`)
- Intercambio: `AudioControl` movido a columna izquierda, `EscenasPanel` + `AnunciosPanel` a columna derecha
- Intercambio: `EffectsPanel` movido a columna izquierda (debajo de SermonInfo), `DirectoryBrowser` a columna derecha (arriba de ScenesPanel)

## 6. Módulo Configuración (M5) — Nuevo
- **`ConfigPanel.tsx`** — Panel completo con 5 solapas: General, Pantallas, Biblias, Atajos, Remoto WebSocket
- **General**: opacidad overlay, selector de idioma, logotipo, encabezado, respaldo/restauración
- **Pantallas**: lista de monitores detectados, indicador control/proyección, slider de opacidad con preview visual
- **Biblias (traducciones)**: listado con toggle activar/desactivar, eliminación de traducciones completas
- **Atajos**: grabador interactivo de combinaciones de teclas, edición de descripción, guardado persistente
- **Remoto WebSocket**: toggle habilitar, selector de puerto, instrucciones de conexión
- **Registrado como módulo** en `modules.tsx` (desactivado por defecto), accesible desde Vistas
- **Nuevos IPC handlers**: `bible:getAllTranslations`, `bible:setTranslationActive`, `bible:deleteTranslation`

## 7. Dashboard más limpio — Módulos colapsables
- Los módulos desactivados desaparecen completamente sin dejar divs vacíos
- `grid-cols-2` reemplazado por `flex` condicional
- Los paneles activos ocupan el 100% del espacio disponible

## 8. Zoom/Pan en imágenes (`ProjectionView+ProjectorView`)
- Controles − + % Reset visibles siempre
- Rueda del mouse para zoom, arrastrar para mover
- Solo para el operador en Vista Proyección; pantalla externa al 100%
- Sincronización vía IPC `projector:imageZoom`

## 9. Búsqueda por referencia exacta (`BibliaPanel`)
- Input "Ir a referencia (ej: Jn 3:16)" con botón Ir
- Soporta formato "Jn 3:16", "juan 3:16", "Ro 8"
- Navega automáticamente al libro/capítulo/versículo

## 10. Pantalla de bienvenida (`WelcomeScreen`)
- 14 pasos con funcionalidades del sistema
- Animaciones modernas (fadeIn, floatUp)
- Versículo final: Salmos 118:24 (RVR1960)
- Aparece solo la primera vez que se abre la app

## 11. Multi-idioma (`i18n.tsx`)
- Sistema completo i18n con español e inglés
- Selector de idioma en header y ConfigPanel
- Traducciones en todos los componentes principales

## 12. Notificaciones Toast (`Toast.tsx`)
- Provider + hook `useToast()`
- 3 tipos: success (verde), error (rojo), info (púrpura)
- Auto-desaparición a los 3 segundos
- Aparecen al proyectar versículos, imágenes, videos y guardar config

## 13. Video al proyectar versículo
- El video en pantalla externa se detiene/limpia al proyectar un versículo
- El versículo aparece limpio sin residuos de video

## 14. Imagen por defecto en pantalla externa
- SVG con diseño elegante en `resources/DesktopAppIPD/default/default-bg.svg`
- Muestra Salmos 118:24 cuando no hay contenido proyectado
- Componente `DefaultBg` en `ProjectorView.tsx`

## 15. Código muerto eliminado
- Archivos `layout.tsx` y `LayoutEditor.tsx` eliminados (no se usaban)
- Imports sin usar limpiados en múltiples componentes
- Función `copyToAll()` eliminada de `ScreensModal`
- `MAX_ACTIVE_MODULES` eliminado de `modules.tsx`

## 16. Bug fixes
- `update:checkNow` no tenía handler IPC → corregido (redirige a `update:check`)
- Promesas sin `.catch()` corregidas en Header y DashboardView
- Auto-proyección inicial de Biblia desactivada al cargar la app
