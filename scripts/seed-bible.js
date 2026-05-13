const initSqlJs = require('sql.js')
const fs = require('fs')
const path = require('path')

const DB_PATH = path.join(process.env.APPDATA, 'desktopappipd', 'desktopappipd.db')
const API_BASE = 'https://bible-api.com/data'
const TRANSLATION = 'rvr1960'
const CONCURRENCY = 6

function saveDb(db) {
  fs.writeFileSync(DB_PATH, Buffer.from(db.export()))
}

async function fetchJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

function delay(ms) {
  return new Promise(r => setTimeout(r, ms))
}

async function main() {
  console.log('Iniciando descarga de la Biblia RVR1960...\n')

  const SQL = await initSqlJs()
  const buf = fs.existsSync(DB_PATH) ? fs.readFileSync(DB_PATH) : null
  const db = new SQL.Database(buf)
  db.run('PRAGMA foreign_keys = ON')

  // Check if already exists
  const existing = db.exec("SELECT id FROM traducciones WHERE abreviatura = 'RVR1960'")
  if (existing.length && existing[0].values.length) {
    console.log('RVR1960 ya está descargada.')
    db.close()
    return
  }

  // Insert translation
  db.run("INSERT INTO traducciones (nombre, abreviatura, idioma, activa) VALUES (?, ?, ?, ?)",
    ['Reina-Valera 1960', 'RVR1960', 'es', 1])
  const transId = db.exec("SELECT last_insert_rowid()")[0].values[0][0]
  saveDb(db)

  // Fetch books
  console.log('Obteniendo lista de libros...')
  const books = await fetchJson(`${API_BASE}/${TRANSLATION}`)
  console.log(`  ${books.length} libros encontrados\n`)

  const totalChapters = books.reduce((s, b) => s + b.chapters, 0)
  console.log(`Total: ${totalChapters} capítulos\n`)

  // Insert books
  const insertedBooks = []
  for (let i = 0; i < books.length; i++) {
    const bk = books[i]
    const testament = i < 39 ? 'AT' : 'NT'
    db.run("INSERT INTO libros (traduccion_id, nombre, orden, testamento) VALUES (?, ?, ?, ?)",
      [transId, bk.name, i + 1, testament])
    const id = db.exec("SELECT last_insert_rowid()")[0].values[0][0]
    insertedBooks.push({ id, name: bk.name, chapters: bk.chapters })
  }
  saveDb(db)

  // Build queue
  const queue = []
  for (let bi = 0; bi < insertedBooks.length; bi++) {
    const bk = insertedBooks[bi]
    for (let c = 1; c <= bk.chapters; c++) {
      queue.push({ bookIdx: bi, chapter: c })
    }
  }

  let index = 0
  let completed = 0
  let lastPct = -1

  function showProgress() {
    const pct = Math.round((completed / totalChapters) * 100)
    if (pct !== lastPct) {
      const bars = Math.round(pct / 2)
      const bar = '█'.repeat(bars) + '░'.repeat(50 - bars)
      process.stdout.write(`\r  [${bar}] ${pct}%  (${completed}/${totalChapters})`)
      lastPct = pct
    }
  }

  async function worker() {
    while (index < queue.length) {
      const item = queue[index++]
      const bk = insertedBooks[item.bookIdx]
      const bookNumber = item.bookIdx + 1
      let success = false

      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const data = await fetchJson(`${API_BASE}/${TRANSLATION}/${bookNumber}/${item.chapter}`)
          for (const v of data.verses) {
            db.run("INSERT INTO versiculos (libro_id, capitulo, versiculo, texto) VALUES (?, ?, ?, ?)",
              [bk.id, v.chapter, v.verse, v.text])
          }
          success = true
          break
        } catch (e) {
          if (attempt < 2) await delay(1000 * (attempt + 1))
        }
      }

      if (!success) {
        console.error(`\nError al descargar ${bk.name} ${item.chapter} después de 3 intentos`)
      }

      completed++
      showProgress()

      // Save every 50 chapters
      if (completed % 50 === 0) saveDb(db)
    }
  }

  showProgress()
  const workers = Array.from({ length: CONCURRENCY }, () => worker())
  await Promise.all(workers)

  db.run("UPDATE traducciones SET activa = 1 WHERE id = ?", [transId])
  saveDb(db)

  console.log('\n\n¡Descarga completada!')
  console.log(`  Traducción: Reina-Valera 1960`)
  console.log(`  Libros: ${books.length}`)
  console.log(`  Capítulos: ${completed}`)

  // Count verses
  const versesCount = db.exec("SELECT COUNT(*) FROM versiculos")[0].values[0][0]
  console.log(`  Versículos: ${versesCount}`)

  db.close()
}

main().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
