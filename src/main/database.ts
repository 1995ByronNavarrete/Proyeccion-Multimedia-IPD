import initSqlJs, { Database as SqlJsDatabase, SqlValue } from 'sql.js'
import { app } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'

let db: SqlJsDatabase | null = null

function getDbPath(): string {
  return join(app.getPath('userData'), 'desktopappipd.db')
}

export function saveDatabase(): void {
  if (!db) return
  const data = db.export()
  writeFileSync(getDbPath(), Buffer.from(data))
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
    db = new SQL.Database()
  }

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

    CREATE TABLE IF NOT EXISTS sesiones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT,
      fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
      configuracion TEXT
    );

    CREATE TABLE IF NOT EXISTS historial (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo TEXT NOT NULL,
      contenido TEXT NOT NULL,
      fecha DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS eventos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      tipo_evento TEXT,
      hora_programada TIME,
      orden INTEGER DEFAULT 0,
      activo BOOLEAN DEFAULT 1
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

  db.run('CREATE INDEX IF NOT EXISTS idx_versiculos_libro_capitulo ON versiculos(libro_id, capitulo)')
  db.run('CREATE INDEX IF NOT EXISTS idx_medios_locales_tipo ON medios_locales(tipo)')
  db.run('CREATE INDEX IF NOT EXISTS idx_medios_locales_favorito ON medios_locales(favorito)')

  saveDatabase()
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
