# Manual de Usuario

## Panel Principal (Dashboard)

El dashboard está organizado en 3 columnas:

### Columna Izquierda
- **Biblia Interactiva**: Navegación por libros, capítulos y versículos. Búsqueda por texto o referencia.
- **Pantallas**: Muestra los monitores conectados. Botones para pantalla negra y cerrar proyección.
- **YouTube**: Busca y reproduce videos de YouTube en el proyector.

### Columna Central
- **Vista Proyección**: Muestra una vista previa de lo que se proyecta. Selector de animaciones.
- **Escenas y Fondos**: Administra imágenes de fondo, tareas de imágenes y anuncios.
- **Consola de Audio**: Mezclador profesional con 4 canales, EQ, efectos y balance.

### Columna Derecha
- **Vista Secundaria**: Muestra el video de fondo.
- **Reproductor**: Reproduce archivos de audio locales.
- **Multimedia**: Navega archivos de audio y video. Botones: Play, Fondo, Eliminar.
- **Efectos Visuales**: Efectos de partículas, nieve, confeti, etc. sobre la proyección.

---

## Módulo de Biblia

### Navegación
1. Selecciona una traducción (RVR1960, NTV, TLA, etc.)
2. Elige un libro del listado
3. Selecciona un capítulo
4. Haz clic en un versículo para proyectarlo

### Búsqueda
- Escribe una palabra clave → busca en todas las traducciones
- Escribe una referencia (ej: "Juan 3:16") → busca exactamente ese versículo
- Resultados con píldoras de color que indican la traducción
- Al hacer clic en un resultado, cambia automáticamente a esa traducción

### Búsqueda inteligente
- Sin acentos ni mayúsculas: "genesis" encuentra "Génesis"
- Busca en todas las traducciones simultáneamente
- Combina resultados de referencia y texto

---

## Consola de Audio

### Canales
| Canal | Descripción | Control |
|---|---|---|
| MASTER | Volumen general | Controla todos los canales simultáneamente |
| PROYECCIÓN | Volumen del video proyectado | `window.api.video.setVolume()` |
| FONDO | Volumen del video de fondo | Elementos `<video>` con `data-volume="bg"` |
| REPRODUCTOR | Volumen del reproductor local | Elementos `<audio>` con `data-volume="player"` |
| MICRÓFONO | Volumen de micrófono | (Interfaz solamente) |

### Efectos (FX)
- Reverb, Echo, Bass Boost, Treble, Compresor, Noise Gate
- Integrados con Web Audio API

### Ecualizador (EQ)
- 8 bandas: 32Hz, 64Hz, 125Hz, 250Hz, 500Hz, 1kHz, 4kHz, 16kHz
- Presets: Plano, Rock, Pop, Clásica, Voz

### Balance
- Control estéreo L/R mediante `StereoPannerNode`

---

## Efectos Visuales

13 efectos de partículas que se renderizan como overlay sobre cualquier contenido:

| Efecto | Descripción |
|---|---|
| Partículas | Puntos flotantes |
| Nieve | Copos cayendo infinitamente |
| Luciérnagas | Puntos luminosos flotantes |
| Confeti | Trozos de colores cayendo |
| Burbujas | Círculos ascendentes |
| Lluvia | Gotas cayendo |
| Corazones | ♥ ascendentes |
| Humo | Volutas que se desvanecen |
| Fuegos artificiales | Explosiones de colores |
| Brillantina | Destellos intermitentes |
| Matrix | Caracteres katakana cayendo |
| Neón | Círculos luminosos orbitando |
| Anillos | Ondas expansivas |

### Controles por efecto
- **Velocidad**: 0.3x a 3x
- **Intensidad**: 10% a 100% (cantidad de partículas base)
- **Cantidad**: 10 a 150 partículas
- **Tamaño**: 10% a 200%

---

## Atajos de Teclado

| Tecla | Acción |
|---|---|
| ← → | Verso anterior / siguiente |
| F11 | Pantalla completa |
| Esc | Cerrar modal / panel |

Los atajos son configurables desde Configuración > Atajos de teclado.

---

## Créditos

**Desarrollador y creador**: Byron Antonio Navarrete Cañada

### Ideas implementadas
1. **Edwin**: Imágenes en la proyección · Proyección de documentos
2. **Jehiel**: Filtrar Biblia por versión · Agregar archivos desde la interfaz · Información de prédica
