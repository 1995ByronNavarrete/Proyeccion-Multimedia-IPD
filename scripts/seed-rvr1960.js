const initSqlJs = require('sql.js')
const fs = require('fs')
const path = require('path')

const DB_PATH = path.join(process.env.APPDATA, 'desktopappipd', 'desktopappipd.db')
const JSON_PATH = path.join(__dirname, 'rvr1960.json')

function saveDb(db) {
  fs.writeFileSync(DB_PATH, Buffer.from(db.export()))
}

async function main() {
  console.log('Cargando datos RVR1960...')
  const verses = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'))
  console.log(`Total registros: ${verses.length}`)

  const bookMap = new Map()
  for (const v of verses) {
    if (!bookMap.has(v.Book)) {
      bookMap.set(v.Book, { number: v.BoookNumber, testament: v.Testament === 'Antiguo' ? 'AT' : 'NT' })
    }
  }
  const books = Array.from(bookMap.entries()).sort((a, b) => a[1].number - b[1].number)
  console.log(`Libros: ${books.length}`)

  const SQL = await initSqlJs()
  const buf = fs.existsSync(DB_PATH) ? fs.readFileSync(DB_PATH) : null
  const db = new SQL.Database(buf)
  db.run('PRAGMA foreign_keys = ON')

  // Check if RVR1960 already has books
  const existing = db.exec("SELECT COUNT(*) FROM libros l JOIN traducciones t ON l.traduccion_id = t.id WHERE t.abreviatura = 'RVR1960'")
  if (existing.length && existing[0].values[0][0] > 0) {
    console.log('RVR1960 ya tiene libros. Saliendo...')
    db.close()
    return
  }

  // Get or create RVR1960 translation record
  let transId
  const trans = db.exec("SELECT id FROM traducciones WHERE abreviatura = 'RVR1960'")
  if (trans.length && trans[0].values.length) {
    transId = trans[0].values[0][0]
    console.log('Usando traducción existente ID:', transId)
    // Clear its data
    db.run("DELETE FROM versiculos WHERE libro_id IN (SELECT id FROM libros WHERE traduccion_id = ?)", [transId])
    db.run("DELETE FROM libros WHERE traduccion_id = ?", [transId])
    saveDb(db)
  } else {
    db.run("INSERT INTO traducciones (nombre, abreviatura, idioma, activa) VALUES (?, ?, ?, ?)",
      ['Reina-Valera 1960', 'RVR1960', 'es', 0])
    transId = db.exec("SELECT last_insert_rowid()")[0].values[0][0]
  }

  let totalChapters = 0
  let totalVerses = 0

  for (const [bookName, info] of books) {
    const bookVerses = verses.filter(v => v.Book === bookName)
    const chapters = [...new Set(bookVerses.map(v => v.Chapter))].sort((a, b) => a - b)
    totalChapters += chapters.length

    db.run("INSERT INTO libros (traduccion_id, nombre, orden, testamento) VALUES (?, ?, ?, ?)",
      [transId, bookName, info.number, info.testament])
    const bookDbId = db.exec("SELECT last_insert_rowid()")[0].values[0][0]

    for (const v of bookVerses) {
      db.run("INSERT INTO versiculos (libro_id, capitulo, versiculo, texto) VALUES (?, ?, ?, ?)",
        [bookDbId, v.Chapter, v.Verse, v.Text])
      totalVerses++
      if (totalVerses % 5000 === 0) {
        saveDb(db)
        process.stdout.write(`\r  Procesados ${totalVerses} versículos...`)
      }
    }
  }

  db.run("UPDATE traducciones SET activa = 1 WHERE id = ?", [transId])
  saveDb(db)

  console.log(`\r  Procesados ${totalVerses} versículos.`)
  console.log(`\n¡Completado!`)
  console.log(`  Libros: ${books.length}`)
  console.log(`  Capítulos: ${totalChapters}`)
  console.log(`  Versículos: ${totalVerses}`)

  db.close()
}

main().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
