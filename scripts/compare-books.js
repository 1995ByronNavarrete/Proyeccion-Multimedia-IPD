const initSqlJs = require('sql.js')
const fs = require('fs')
const path = require('path')

const DB_PATH = path.join(process.env.APPDATA, 'desktopappipd', 'desktopappipd.db')

async function main() {
  const SQL = await initSqlJs()
  const buf = fs.readFileSync(DB_PATH)
  const db = new SQL.Database(buf)

  for (const trans of ['NTV', 'TLA', 'RVR1960']) {
    const books = db.exec(`
      SELECT l.nombre, COUNT(v.id) as v_count, MAX(v.capitulo) as max_ch
      FROM libros l
      LEFT JOIN versiculos v ON v.libro_id = l.id
      JOIN traducciones t ON l.traduccion_id = t.id
      WHERE t.abreviatura = '${trans}'
      GROUP BY l.id ORDER BY l.orden
    `)
    if (!books.length) continue
    console.log(`\n=== ${trans} ===`)
    let totalV = 0
    for (const row of books[0].values) {
      console.log(`  ${row[0].padEnd(20)} ${String(row[1]).padStart(6)} vers  cap ${row[2]}`)
      totalV += row[1]
    }
    console.log(`  TOTAL: ${totalV}`)
  }
  db.close()
}

main().catch(console.error)
