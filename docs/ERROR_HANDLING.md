# Manejo de Errores — DesktopAppIPD

Estrategia unificada para capturar, registrar y recuperar errores en toda la aplicación.

---

## Principios

1. **Nunca silenciar errores** — todo error debe registrarse al menos en consola/log.
2. **Recuperación graceful** — la UI nunca debe crashear; mostrar mensaje amigable al usuario.
3. **Log centralizado** — todos los errores pasan por un logger en el main process.
4. **Errores IPC** — siempre responder con `{ success: false, error: mensaje }` en handlers IPC.
5. **Errores de módulos** — cada módulo maneja sus propios errores sin afectar a los demás.

---

## Estructura

```
src/
  main/
    logger.ts              ← Logger centralizado (main process)
  renderer/
    lib/
      error-boundary.tsx   ← Error Boundary de React
      error-handler.ts     ← Utilidades para errores en renderer
      ipc-error.ts         ← Tipos y helpers para respuestas IPC
```

---

## Logger Centralizado (`logger.ts`)

```typescript
enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
  details?: unknown;
  stack?: string;
}

class Logger {
  private logFile: string;
  private entries: LogEntry[] = [];

  constructor() {
    this.logFile = path.join(app.getPath('userData'), 'logs', 'app.log');
  }

  debug(module: string, message: string, details?: unknown): void { ... }
  info(module: string, message: string, details?: unknown): void { ... }
  warn(module: string, message: string, details?: unknown): void { ... }
  error(module: string, message: string, details?: unknown): void { ... }

  private write(entry: LogEntry): void {
    this.entries.push(entry);
    // Append to log file
    fs.appendFileSync(this.logFile, JSON.stringify(entry) + '\n');
  }

  getRecent(count: number): LogEntry[] { ... }
  clear(): void { ... }
}
```

---

## Error Boundary (React)

```typescript
// error-boundary.tsx
class ModuleErrorBoundary extends React.Component<
  { moduleName: string; children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Enviar error al logger del main process vía IPC
    window.api.logError(this.props.moduleName, error.message, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h3>Error en {this.props.moduleName}</h3>
          <p>{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Reintentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

---

## Patrón de Respuesta IPC

Toda comunicación IPC debe seguir esta estructura:

```typescript
// Tipos compartidos
interface IpcSuccess<T = void> {
  success: true;
  data: T;
}

interface IpcError {
  success: false;
  error: string;
  code?: string;
}

type IpcResponse<T = void> = IpcSuccess<T> | IpcError;

// Uso en handler
ipcMain.handle('medialocal:import', async (_event, filePath: string): Promise<IpcResponse<MediaInfo>> => {
  try {
    const info = await importMediaFile(filePath);
    return { success: true, data: info };
  } catch (err) {
    logger.error('medialocal', 'Error al importar archivo', { filePath, error: err.message });
    return { success: false, error: `No se pudo importar el archivo: ${err.message}` };
  }
});
```

---

## Errores Comunes por Módulo

| Módulo | Error | Causa | Acción |
|---|---|---|---|
| Biblia | Traducción no encontrada | BD corrupta o faltante | Reimportar datos bíblicos |
| Proyector | Monitor no detectado | Cable desconectado | Refrescar lista de pantallas |
| Proyector | Video de YouTube no reproducible | Enlace caído o restricción geográfica | Mostrar error y sugerir alternativa local |
| Biblioteca Local | Archivo no soportado | Formato no incluido en la whitelist | Mostrar formatos soportados |
| Biblioteca Local | Ruta no accesible | Archivo movido o eliminado | Preguntar si desea eliminar de la biblioteca |
| Programación | Evento en tiempo pasado | Reloj del sistema desincronizado | Saltar evento automáticamente |
| Configuración | Puerto WebSocket ocupado | Otro proceso usando el puerto | Sugerir puerto alternativo |

---

## Logs de Diagnóstico

Los logs se almacenan en `%APPDATA%/DesktopAppIPD/logs/app.log`.  
El usuario puede acceder a ellos desde `Configuración → Exportar Logs`.
