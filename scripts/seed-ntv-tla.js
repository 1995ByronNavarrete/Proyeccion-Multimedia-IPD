const initSqlJs = require('sql.js')
const fs = require('fs')
const path = require('path')

const DB_PATH = path.join(process.env.APPDATA, 'desktopappipd', 'desktopappipd.db')
const TRANSLATIONS = [
  { file: path.join(__dirname, 'ntv.json'), abbreviation: 'NTV', nombre: 'Nueva Traducción Viviente' },
  { file: path.join(__dirname, 'tla.json'), abbreviation: 'TLA', nombre: 'Traducción en Lenguaje Actual' },
]

function saveDb(db) {
  fs.writeFileSync(DB_PATH, Buffer.from(db.export()))
}

// HTMl entity decoding
function decodeHtml(text) {
  return text
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(d))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
}

// Extract all text content from HTML, stripping tags
function extractText(html) {
  return decodeHtml(html.replace(/<[^>]+>/g, '').trim())
}

// Extract verses from chapter HTML
function extractVerses(html) {
  // Remove footnotes, cross-references, parallel verses, labels
  let clean = html
    .replace(/<span class="note[^>]*>[\s\S]*?<\/span>/g, '')
    .replace(/<span class="label">\d+<\/span>/g, '')
    .replace(/<span class="vp[^>]*>[\s\S]*?<\/span>/g, '')

  // Collect all content spans within each verse span
  const verses = []
  const verseOpenRe = /<span class="verse v(\d+)"[^>]*>/g
  let vMatch
  const indices = []

  while ((vMatch = verseOpenRe.exec(clean)) !== null) {
    indices.push({ start: vMatch.index, verse: parseInt(vMatch[1], 10) })
  }

  for (let i = 0; i < indices.length; i++) {
    const start = indices[i].start
    const end = i < indices.length - 1 ? indices[i + 1].start : clean.length
    const section = clean.substring(start, end)

    const contentRe = /<span class="content">([\s\S]*?)<\/span>/g
    let cMatch
    const parts = []
    while ((cMatch = contentRe.exec(section)) !== null) {
      const text = extractText(cMatch[1])
      if (text) parts.push(text)
    }
    const fullText = parts.join(' ').replace(/^\d+\s*/, '').trim()
    if (fullText) {
      verses.push({ verse: indices[i].verse, text: fullText })
    }
  }

  // Concatenate fragments with the same verse number
  const combined = new Map()
  for (const v of verses) {
    const existing = combined.get(v.verse)
    if (existing) {
      combined.set(v.verse, existing + ' ' + v.text)
    } else {
      combined.set(v.verse, v.text)
    }
  }
  return Array.from(combined.entries())
    .map(function(e) { return { verse: e[0], text: e[1] } })
    .sort(function(a, b) { return a.verse - b.verse })
}

function getTestament(bookIndex) {
  return bookIndex < 39 ? 'AT' : 'NT'
}

async function main() {
  console.log('Abriendo base de datos...')
  const SQL = await initSqlJs()
  const buf = fs.existsSync(DB_PATH) ? fs.readFileSync(DB_PATH) : null
  const db = new SQL.Database(buf)
  db.run('PRAGMA foreign_keys = ON')

  for (const trans of TRANSLATIONS) {
    const file = trans.file
    if (!fs.existsSync(file)) {
      console.log(`  Archivo no encontrado: ${file}, saltando...`)
      continue
    }

    // Check if already exists
    const existing = db.exec(`SELECT id FROM traducciones WHERE abreviatura = '${trans.abbreviation}'`)
    if (existing.length && existing[0].values.length) {
      console.log(`${trans.abbreviation} ya está en la base de datos.`)
      continue
    }

    console.log(`\nProcesando ${trans.abbreviation} — ${trans.nombre}...`)
    const data = JSON.parse(fs.readFileSync(file, 'utf-8'))
    console.log(`  Libros: ${data.books.length}`)

    // Insert translation
    db.run("INSERT INTO traducciones (nombre, abreviatura, idioma, activa) VALUES (?, ?, ?, ?)",
      [trans.nombre, trans.abbreviation, 'es', 0])
    const transId = db.exec("SELECT last_insert_rowid()")[0].values[0][0]

    let totalBooks = 0
    let totalVerses = 0
    let totalChapters = 0

    for (let bi = 0; bi < data.books.length; bi++) {
      const book = data.books[bi]
      const test = getTestament(bi)

      // Insert book
      db.run("INSERT INTO libros (traduccion_id, nombre, orden, testamento) VALUES (?, ?, ?, ?)",
        [transId, book.name, bi + 1, test])
      const bookId = db.exec("SELECT last_insert_rowid()")[0].values[0][0]

      // Skip non-chapter entries (introductions, etc.)
      const realChapters = book.chapters.filter(c => c.is_chapter !== false && !c.chapter_usfm?.includes('INTRO'))

      for (const ch of realChapters) {
        const html = ch.chapter_html || ''
        const verses = extractVerses(html)

        // Extract chapter number from usfm: "GEN.1" -> 1
        const chapterNum = ch.chapter_usfm ? parseInt(ch.chapter_usfm.split('.').pop(), 10) : 0
        if (!chapterNum || !verses.length) continue

        for (const v of verses) {
          db.run("INSERT INTO versiculos (libro_id, capitulo, versiculo, texto) VALUES (?, ?, ?, ?)",
            [bookId, chapterNum, v.verse, v.text])
          totalVerses++
        }
        totalChapters++
      }
      totalBooks++
    }

    // Mark as active
    db.run("UPDATE traducciones SET activa = 1 WHERE id = ?", [transId])
    saveDb(db)

    console.log(`  Libros: ${totalBooks}`)
    console.log(`  Capítulos: ${totalChapters}`)
    console.log(`  Versículos: ${totalVerses}`)
  }

  db.close()
  console.log('\n¡Completado!')
}

main().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
