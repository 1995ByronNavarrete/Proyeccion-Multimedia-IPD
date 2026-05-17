# Configuración de 3 Pantallas Externas para Proyección

## Hardware necesario

| Cantidad | Adaptador | Por qué |
|----------|-----------|---------|
| 1 | Cable HDMI (ya lo tenés) | Conecta Monitor 1 (SAMSUNG) directo al puerto HDMI del HP |
| 2 | **Adaptador DisplayLink USB 3.0 a HDMI** | Convierten USB en salida de video independiente |

### Adaptadores DisplayLink recomendados

| Marca / Modelo | Resolución | Precio estimado |
|----------------|-----------|-----------------|
| Plugable UD-3900H | 4K @ 60Hz | ~$50 USD |
| Startech USB32HD4 | 4K @ 30Hz | ~$45 USD |
| Wavlink UG69PD7 | 4K @ 60Hz | ~$40 USD |
| CableMatters 201046 | 4K @ 60Hz | ~$35 USD |

> **Importante:** Cualquiera sirve. Asegurate que diga "DisplayLink" en la caja.

## Diagrama de Conexión

```
┌────────────────────────────────────────────────────────────┐
│                    HP ALL-in-One 24-cb1xxx                  │
│                                                            │
│  ┌───────────────────┐    ┌──────────────┐  ┌────────────┐ │
│  │ Puerto HDMI 1.4   │    │ USB 3.0 #1   │  │ USB 3.0 #2 │ │
│  └────────┬──────────┘    └──────┬───────┘  └─────┬──────┘ │
│           │                      │                │        │
│      Cable HDMI            DisplayLink          DisplayLink │
│           │                      │                │        │
│     ┌─────┴──────┐        ┌─────┴──────┐   ┌─────┴──────┐ │
│     │ SAMSUNG    │        │ Monitor 2  │   │ Monitor 3  │ │
│     │ 1280×720   │        │ (elige tú) │   │ (elige tú) │ │
│     │ HDMI       │        │ HDMI       │   │ HDMI       │ │
│     └────────────┘        └────────────┘   └────────────┘ │
│                                                            │
│  Pantalla integrada HP: control/app (no proyección)        │
└────────────────────────────────────────────────────────────┘
```

### Explicación
- **Cada monitor** muestra contenido **diferente** (no clon)
- El HDMI directo usa el gráfico Intel (rápido para video)
- Los DisplayLink usan USB (ideales para Biblia, imágenes, cronómetro)
- La pantalla del HP se queda como control (no proyecta)

## Pasos para hacerlo funcionar

### 1. Conectar físicamente
1. Conectá los 2 adaptadores DisplayLink a los **puertos USB 3.0** (los de atrás, no confundir con USB 2.0)
2. Conectá cada monitor a su adaptador con cable HDMI
3. Conectá el SAMSUNG directo al **HDMI 1.4** del HP

### 2. Instalar driver DisplayLink
1. Windows puede instalarlo automático, si no:
2. Descargalo de: https://www.displaylink.com/downloads
3. Instalá y **reiniciá** la PC

### 3. Verificar en Windows
1. Presioná **Win + P** → debe decir **"Ampliar"**
2. Andá a **Configuración → Sistema → Pantalla**
3. Deberías ver **4 pantallas** numeradas:
   - Pantalla 1: HP integrada
   - Pantalla 2: SAMSUNG (HDMI directo)
   - Pantalla 3: DisplayLink #1
   - Pantalla 4: DisplayLink #2

### 4. Verificar en la app
1. Abrí la app → **Configurar pantallas** (ícono de monitor)
2. Deberían aparecer las 3 pantallas externas
3. Seleccioná cada una y asignale contenido (Biblia, Video, etc.)
4. Hacé clic en **"Aplicar"**

### 5. Solución de problemas

| Problema | Causa | Solución |
|----------|-------|----------|
| Solo veo 2 pantallas en Windows | Faltan drivers DisplayLink | Instalar driver + reiniciar |
| La pantalla DisplayLink se ve lenta | Está en USB 2.0 | Mové el adaptador a un puerto USB 3.0 |
| La app no detecta la pantalla | No se aplicó la asignación | Abrí Configurar pantallas y aplicá de nuevo |
| El video se traba en pantalla DisplayLink | DisplayLink tiene más latencia | Asigná el video a la pantalla HDMI directo |
| La pantalla externa está en negro | Proyector no abierto | En la app, desactivá y activá esa pantalla |

## Notas importantes

- Los adaptadores DisplayLink funcionan mejor en **USB 3.0** (puertos azules)
- **No uses** splitters HDMI — duplican imagen
- **No uses** hubs USB sin DisplayLink — no agregan video
- Si querés todos los monitores en 1080p, asegurate que los adaptadores lo soporten
- El Intel UHD Graphics solo maneja 3 pantallas total (1 interna + 1 HDMI + 1 DisplayPort virtual), los DisplayLink tienen su propio procesador y no cuentan para ese límite
