import initSqlJs, { Database as SqlJsDatabase, SqlValue } from 'sql.js'
import { app } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { getBundledDbPath, getBundledDataDbPath, getBibleBackupPath } from './shared'

let db: SqlJsDatabase | null = null
let saveTimeout: ReturnType<typeof setTimeout> | null = null
let saveMaxTimeout: ReturnType<typeof setTimeout> | null = null
const SAVE_MAX_WAIT = 5000

export function getDbPath(): string {
  return join(app.getPath('userData'), 'desktopappipd.db')
}

function flushNow(): void {
  if (saveTimeout) { clearTimeout(saveTimeout); saveTimeout = null }
  if (saveMaxTimeout) { clearTimeout(saveMaxTimeout); saveMaxTimeout = null }
  if (!db) return
  const data = db.export()
  writeFileSync(getDbPath(), Buffer.from(data))
}

export function saveDatabase(): void {
  if (saveTimeout) clearTimeout(saveTimeout)
  saveTimeout = setTimeout(() => {
    saveTimeout = null
    if (saveMaxTimeout) { clearTimeout(saveMaxTimeout); saveMaxTimeout = null }
    flushNow()
  }, 200)
  if (!saveMaxTimeout) {
    saveMaxTimeout = setTimeout(() => {
      saveMaxTimeout = null
      if (saveTimeout) { clearTimeout(saveTimeout); saveTimeout = null }
      flushNow()
    }, SAVE_MAX_WAIT)
  }
}

export function flushDatabase(): void {
  flushNow()
}

export function getDatabase(): SqlJsDatabase {
  if (!db) throw new Error('Database not initialized')
  return db
}

export async function initDatabase(): Promise<void> {
  const SQL = await initSqlJs()
  const dbPath = getDbPath()

  if (existsSync(dbPath)) {
    const buffer = readFileSync(dbPath)
    db = new SQL.Database(buffer)
  } else {
    let loaded = false
    try {
      const backup = getBibleBackupPath()
      if (backup) {
        const buf = readFileSync(backup)
        db = new SQL.Database(buf)
        console.log('[db] Loaded bundled Bible database')
        loaded = true
      }
    } catch {}
    if (!loaded) {
      db = new SQL.Database()
    }
  }
  if (!db) db = new SQL.Database()
  db.run('PRAGMA foreign_keys = ON')

  db.run(`
    CREATE TABLE IF NOT EXISTS traducciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      abreviatura TEXT NOT NULL,
      idioma TEXT DEFAULT 'es',
      activa BOOLEAN DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS libros (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      traduccion_id INTEGER NOT NULL,
      nombre TEXT NOT NULL,
      orden INTEGER NOT NULL,
      testamento TEXT NOT NULL,
      FOREIGN KEY (traduccion_id) REFERENCES traducciones(id)
    );

    CREATE TABLE IF NOT EXISTS versiculos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      libro_id INTEGER NOT NULL,
      capitulo INTEGER NOT NULL,
      versiculo INTEGER NOT NULL,
      texto TEXT NOT NULL,
      FOREIGN KEY (libro_id) REFERENCES libros(id)
    );

    CREATE TABLE IF NOT EXISTS medios_locales (
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

    CREATE TABLE IF NOT EXISTS listas_reproduccion (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      descripcion TEXT,
      fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS lista_medios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lista_id INTEGER NOT NULL,
      medio_id INTEGER NOT NULL,
      orden INTEGER DEFAULT 0,
      FOREIGN KEY (lista_id) REFERENCES listas_reproduccion(id) ON DELETE CASCADE,
      FOREIGN KEY (medio_id) REFERENCES medios_locales(id) ON DELETE CASCADE
    );
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS anuncios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      texto TEXT NOT NULL,
      animacion TEXT DEFAULT 'anim-fade',
      fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS tareas_imagenes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tarea_imagenes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tarea_id INTEGER NOT NULL,
      ruta_archivo TEXT NOT NULL,
      nombre TEXT NOT NULL,
      fecha_agregado DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tarea_id) REFERENCES tareas_imagenes(id) ON DELETE CASCADE
    );
  `)

  db.run('CREATE INDEX IF NOT EXISTS idx_versiculos_libro_capitulo ON versiculos(libro_id, capitulo)')
  db.run('CREATE INDEX IF NOT EXISTS idx_medios_locales_tipo ON medios_locales(tipo)')
  db.run('CREATE INDEX IF NOT EXISTS idx_medios_locales_favorito ON medios_locales(favorito)')
  db.run('CREATE INDEX IF NOT EXISTS idx_tarea_imagenes_tarea ON tarea_imagenes(tarea_id)')

  flushDatabase()
  registerCustomFunctions()
}

export function noAccent(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

export async function reloadDatabase(): Promise<string> {
  flushNow()
  if (db) { try { (db as any).close?.() } catch {} }
  const SQL = await initSqlJs()
  const dbPath = getDbPath()
  if (!existsSync(dbPath)) return 'NO_FILE'
  const buffer = readFileSync(dbPath)
  const newDb = new SQL.Database(buffer)
  newDb.run('PRAGMA foreign_keys = ON')
  db = newDb
  registerCustomFunctions()
  try {
    const row = queryOne('SELECT COUNT(*) as c FROM traducciones')
    return (row && Number(row.c) > 0) ? 'OK' : 'NO_BIBLE'
  } catch { return 'ERROR' }
}

export function registerCustomFunctions(): void {
  if (!db) return
  try { db.create_function('noacct', noAccent) } catch {}
}

export function queryAll(sql: string, params?: SqlValue[]): Record<string, unknown>[] {
  const d = getDatabase()
  const stmt = d.prepare(sql)
  if (params) stmt.bind(params)
  const results: Record<string, unknown>[] = []
  while (stmt.step()) {
    results.push(stmt.getAsObject())
  }
  stmt.free()
  return results
}

export function queryOne(sql: string, params?: SqlValue[]): Record<string, unknown> | null {
  const d = getDatabase()
  const stmt = d.prepare(sql)
  if (params) stmt.bind(params)
  const result = stmt.step() ? stmt.getAsObject() : null
  stmt.free()
  return result
}

export async function seedBibleIfEmpty(): Promise<void> {
  try {
    const row = queryOne('SELECT COUNT(*) as count FROM traducciones')
    if (row && (row.count as number) > 0) {
      console.log('[seed] Bible data already present')
      return
    }
  } catch {
    return
  }

  async function replaceDb(srcPath: string): Promise<boolean> {
    try {
      flushNow()
      if (db) { try { (db as any).close?.() } catch {} }
      const dest = getDbPath()
      const buf = readFileSync(srcPath)
      writeFileSync(dest, Buffer.from(buf))
      const SQL = await initSqlJs()
      const newDb = new SQL.Database(readFileSync(dest))
      newDb.run('PRAGMA foreign_keys = ON')
      db = newDb
      registerCustomFunctions()
      return true
    } catch (err) {
      console.error('[seed] Replace DB error:', err)
      return false
    }
  }

  const backup = getBibleBackupPath()
  if (backup && await replaceDb(backup)) {
    console.log('[seed] Bible database replaced from biblia-backup.db')
    return
  }

  const bundled = getBundledDataDbPath()
  if (bundled && await replaceDb(bundled)) {
    console.log('[seed] Database replaced with bundled-data.db')
    return
  }
}

export function execute(sql: string, params?: SqlValue[]): { changes: number; lastInsertRowid: number } {
  const d = getDatabase()
  if (params) {
    d.run(sql, params)
  } else {
    d.run(sql)
  }
  saveDatabase()
  const result = queryOne('SELECT changes() as changes, last_insert_rowid() as lastInsertRowid')
  return {
    changes: (result?.changes as number) ?? 0,
    lastInsertRowid: (result?.lastInsertRowid as number) ?? 0
  }
}

export function executeBatch(sql: string, batchParams: SqlValue[][]): { changes: number; lastInsertRowid: number } {
  const d = getDatabase()
  d.run('BEGIN TRANSACTION')
  try {
    for (const params of batchParams) {
      d.run(sql, params)
    }
    d.run('COMMIT')
  } catch (err) {
    d.run('ROLLBACK')
    console.error('[db] executeBatch error, rolled back:', err)
    throw err
  }
  saveDatabase()
  const result = queryOne('SELECT changes() as changes, last_insert_rowid() as lastInsertRowid')
  return {
    changes: (result?.changes as number) ?? 0,
    lastInsertRowid: (result?.lastInsertRowid as number) ?? 0
  }
}
