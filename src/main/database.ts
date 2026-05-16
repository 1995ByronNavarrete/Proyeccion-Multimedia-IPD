import initSqlJs, { Database as SqlJsDatabase, SqlValue } from 'sql.js'
import { app } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'

let db: SqlJsDatabase | null = null
let saveTimeout: ReturnType<typeof setTimeout> | null = null

export function getDbPath(): string {
  return join(app.getPath('userData'), 'desktopappipd.db')
}

export function saveDatabase(): void {
  if (saveTimeout) clearTimeout(saveTimeout)
  saveTimeout = setTimeout(() => {
    if (!db) return
    const data = db.export()
    writeFileSync(getDbPath(), Buffer.from(data))
    saveTimeout = null
  }, 200)
}

export function flushDatabase(): void {
  if (saveTimeout) {
    clearTimeout(saveTimeout)
    saveTimeout = null
  }
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

export function registerCustomFunctions(): void {
  if (!db) return
  db.create_function('noacct', noAccent)
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
    if (row && (row.count as number) > 0) return
  } catch {
    return
  }

  const bundledPath = join(process.resourcesPath, 'bible-data.db')
  const devPath = join(__dirname, '..', '..', 'resources', 'bible-data.db')
  const dbPath = existsSync(bundledPath) ? bundledPath : (existsSync(devPath) ? devPath : null)
  if (!dbPath) return

  try {
    const SQL = await initSqlJs()
    const bundledBuf = readFileSync(dbPath)
    const bundledDb = new SQL.Database(bundledBuf)

    const trans = bundledDb.exec('SELECT nombre, abreviatura, idioma, activa FROM traducciones')
    if (!trans.length || !trans[0].values.length) { bundledDb.close(); return }

    for (const t of trans[0].values) {
      execute('INSERT INTO traducciones (nombre, abreviatura, idioma, activa) VALUES (?, ?, ?, ?)',
        [t[0] as string, t[1] as string, t[2] as string, t[3] as number])
      const transRow = queryOne('SELECT last_insert_rowid() as id')
      const transId = transRow?.id as number

      const books = bundledDb.exec(`SELECT nombre, orden, testamento FROM libros WHERE traduccion_id = ? ORDER BY orden`, [1])
      if (!books.length || !books[0].values.length) continue

      for (const b of books[0].values) {
        execute('INSERT INTO libros (traduccion_id, nombre, orden, testamento) VALUES (?, ?, ?, ?)',
          [transId, b[0] as string, b[1] as number, b[2] as string])
        const bookRow = queryOne('SELECT last_insert_rowid() as id')
        const bookId = bookRow?.id as number

        const verses = bundledDb.exec(
          `SELECT v.capitulo, v.versiculo, v.texto FROM versiculos v JOIN libros l ON v.libro_id = l.id WHERE l.traduccion_id = ? AND l.nombre = ? ORDER BY v.capitulo, v.versiculo`,
          [1, b[0] as string]
        )
        if (!verses.length || !verses[0].values.length) continue

        const BATCH = 200
        let batch: SqlValue[][] = []
        for (const v of verses[0].values) {
          batch.push([bookId, v[0] as number, v[1] as number, v[2] as string])
          if (batch.length >= BATCH) {
            for (const row of batch) execute('INSERT INTO versiculos (libro_id, capitulo, versiculo, texto) VALUES (?, ?, ?, ?)', row)
            batch = []
          }
        }
        for (const row of batch) execute('INSERT INTO versiculos (libro_id, capitulo, versiculo, texto) VALUES (?, ?, ?, ?)', row)
      }
    }
    bundledDb.close()
    flushDatabase()
  } catch (err) {
    console.error('[seed] Error seeding Bible:', err)
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
