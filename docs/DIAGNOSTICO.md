# Diagnóstico del Sistema — DesktopAppIPD

Herramientas y procedimientos para diagnosticar problemas en la aplicación.

---

## Panel de Diagnóstico (UI)

Accesible desde `Configuración → Diagnóstico` o atajo `Ctrl+Shift+D`.

### Secciones del Panel

```
┌────────────────────────────────────────────┐
│  DIAGNÓSTICO DEL SISTEMA                   │
├────────────────────────────────────────────┤
│  💻 Sistema         ✅ OK                  │
│  🖥️ Monitores       2 detectados          │
│  💾 Base de Datos   ✅ OK (45.2 MB)        │
│  📁 Biblioteca Local 142 archivos          │
│  🌐 YouTube API     ⚠️ Sin conexión        │
│  📡 WebSocket       🟢 Puerto 9090         │
│  🧪 Pruebas Rápidas [Ejecutar]             │
│  📋 Últimos Errores [Ver Logs]             │
│  📤 Exportar Reporte [Descargar]           │
└────────────────────────────────────────────┘
```

### Indicadores de Estado

| Icono | Estado | Descripción |
|---|---|---|
| ✅ | OK | Funcionando correctamente |
| ⚠️ | Advertencia | Funciona con limitaciones |
| ❌ | Error | No disponible o fallando |

---

## Pruebas Rápidas

Botón "Ejecutar" en el panel de diagnóstico que corre:

1. **Conexión a BD** — `SELECT 1` a SQLite
2. **Espacio en disco** — Verificar espacio libre para logs/cache
3. **Monitores** — Listar displays con `electron.screen.getAllDisplays()`
4. **Reproducción local** — Intentar reproducir un archivo de prueba interno
5. **YouTube** — Ping a youtube.com + ytdl-core
6. **WebSocket** — Verificar que el puerto esté escuchando
7. **Integridad de módulos** — Verificar que cada módulo tenga sus handlers IPC registrados

---

## Logs

### Ubicación
```
%APPDATA%/DesktopAppIPD/logs/app.log
```

### Niveles de Log
| Nivel | Uso |
|---|---|
| DEBUG | Información detallada para desarrollo |
| INFO | Eventos normales de la aplicación |
| WARN | Problemas no críticos recuperables |
| ERROR | Fallos que requieren atención |

### Formato de cada línea
```json
{"timestamp":"2026-05-13T04:00:00.000Z","level":"ERROR","module":"medialocal","message":"Archivo no encontrado","details":{"path":"C:/musica/canción.mp3"}}
```

---

## Exportar Reporte

Genera un archivo `diagnostico_{fecha}.json` con:

```json
{
  "version": "1.0.0",
  "fecha": "2026-05-13T04:00:00Z",
  "sistema": {
    "plataforma": "win32",
    "version SO": "Windows 11 Pro 23H2",
    "arquitectura": "x64",
    "memoria_total_gb": 16,
    "memoria_libre_gb": 8.5
  },
  "monitores": [
    { "id": 1, "nombre": "DELL S2721QS", "resolucion": "3840x2160", "primario": true },
    { "id": 2, "nombre": "LG 32UL750", "resolucion": "3840x2160", "primario": false }
  ],
  "base_datos": {
    "tamano_mb": 45.2,
    "tablas": 8,
    "traducciones": 2,
    "versiculos": 31000,
    "medios_locales": 142
  },
  "modulos": {
    "biblia": { "activo": true, "estado": "ok" },
    "proyector": { "activo": true, "estado": "ok" },
    "medialocal": { "activo": true, "estado": "ok" },
    "programacion": { "activo": true, "estado": "ok" },
    "configuracion": { "activo": true, "estado": "ok" },
    "extra": { "activo": true, "estado": "ok" }
  },
  "ultimos_errores": [
    { "timestamp": "2026-05-13T03:55:00Z", "module": "medialocal", "message": "Archivo no encontrado" }
  ],
  "pruebas_rapidas": {
    "base_datos": "ok",
    "espacio_disco": "ok (23.4 GB libres)",
    "monitores": "ok",
    "reproduccion_local": "ok",
    "youtube": "sin_conexion",
    "websocket": "ok"
  }
}
```

---

## Solución de Problemas Comunes

| Problema | Causa Posible | Solución |
|---|---|---|
| La app no inicia | Puerto ocupado o BD corrupta | `--reset` en línea de comandos |
| No se detecta monitor secundario | Cable HDMI/DP desconectado | Verificar conexión física y botón "Refrescar" |
| Video local no se reproduce | Códec no soportado | Verificar formatos soportados en CHECKLIST |
| YouTube no carga | Sin conexión a internet | Usar Biblioteca Multimedia Local |
| Overlay de texto no aparece | Ventana proyector no creada | Abrir proyector desde el panel |
| Error "SQLITE_BUSY" | Múltiples accesos concurrentes | better-sqlite3 es síncrono, no debería ocurrir; verificar workers |

---

## Línea de Comandos

```bash
# Iniciar con logs detallados
DesktopAppIPD.exe --verbose

# Resetear configuración
DesktopAppIPD.exe --reset

# Abrir panel de diagnóstico al inicio
DesktopAppIPD.exe --diagnostico

# Modo seguro (desactiva módulos no esenciales)
DesktopAppIPD.exe --safe-mode
```
