# Futuras Mejoras — DesktopAppIPD

> Ideas y funcionalidades planificadas para versiones posteriores al lanzamiento inicial.

---

## Prioridad Alta (Post-Lanzamiento Inmediato)

### Integración con Spotify / Apple Music
- Reproducir listas de reproducción de Spotify directamente en la app
- Soporte para Apple Music y otras plataformas de streaming
- Autenticación OAuth para cuentas premium

### Efectos Visuales en Vivo
- Ecualizador de audio animado en la ventana proyector
- Visualizadores musicales (barras, ondas, partículas)
- Efectos de partículas en transiciones (confeti, nieve, fuegos artificiales)

### Soporte para Letras de Canciones
- Carga automática de letras desde archivos .LRC
- Sincronización tiempo-real con la reproducción
- Overlay de letras en la ventana proyector con estilo karaoke

---

## Prioridad Media

### Remoto Móvil Nativo
- App complementaria para Android/iOS
- Control total desde el celular (cambiar versículo, reproducir video, ajustar volumen)
- Escaneo de código QR para conexión automática

### Plugin System
- Arquitectura de plugins para extender funcionalidades
- API pública para que terceros desarrollen módulos personalizados
- Marketplace de plugins dentro de la app

### Nube y Sincronización
- Sincronizar bibliotecas multimedia entre computadoras (LAN)
- Respaldo automático de configuraciones y sesiones en la nube
- Compartir playlists entre instalaciones de la iglesia

### AI / ML
- Transcripción automática de voz a texto para notas de sermón
- Recomendación de versículos basada en el tema del servicio
- Detección automática de contenido inapropiado en videos

---

## Prioridad Baja

### Streaming en Vivo
- Integración con OBS Studio para transmisión en vivo
- Salida directa a YouTube Live / Facebook Live
- Overlay de textos bíblicos en la transmisión

### Notas de Sermón
- Editor de notas integrado para el predicador
- Asociar notas a versículos específicos
- Exportar notas a PDF / Markdown

### Multilenguaje
- Interfaz de usuario en inglés, portugués, francés
- Subtítulos automáticos en la proyección
- Biblias en más idiomas (inglés, portugués, francés, alemán)

### Accesibilidad
- Modo de alto contraste
- Soporte para lectores de pantalla (NVDA, JAWS)
- Atajos de teclado personalizados por módulo
- Tamaño de fuente ajustable en la interfaz principal

### Automatización Avanzada
- Reglas condicionales: "si pasa X tiempo sin interacción, reproducir Y"
- Integración con calendario (Google Calendar, Outlook)
- API REST para control externo desde otras aplicaciones

### Historial y Estadísticas
- Dashboard con estadísticas de uso: versículos más proyectados, videos más reproducidos
- Reportes semanales/mensuales de actividad
- Gráficos de tendencias en la configuración

### Temas Personalizados
- Editor de temas visuales (colores, fuentes, bordes)
- Importar/exportar temas
- Galería comunitaria de temas

---

## Técnicas / Deuda Técnica

- [ ] Migrar de better-sqlite3 a sql.js para evitar dependencias nativas
- [ ] Pruebas unitarias con Vitest para cada módulo
- [ ] Pruebas end-to-end con Playwright + Electron
- [ ] CI/CD con GitHub Actions (lint → test → build → release)
- [ ] Internacionalización (i18n) desde el inicio para facilitar multilenguaje
- [ ] Lazy loading de módulos para mejorar tiempo de inicio
- [ ] Web Workers para escaneo de bibliotecas grandes sin bloquear la UI
- [ ] Compilación AOT de schemas SQLite para consultas más rápidas

---

## Contribuciones

¿Tienes una idea para una funcionalidad nueva? Abre un issue en el repositorio con la etiqueta `enhancement`.  
Las contribuciones son bienvenidas — consulta la guía de contribución en `CONTRIBUTING.md`.
