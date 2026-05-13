const initSqlJs = require('sql.js')
const fs = require('fs')
const path = require('path')

const DB_PATH = path.join(process.env.APPDATA, 'desktopappipd', 'desktopappipd.db')

async function main() {
  const SQL = await initSqlJs()
  const buf = fs.readFileSync(DB_PATH)
  const db = new SQL.Database(buf)

  // Check TLA verses look correct - sample a few
  for (const [trans, chap, v] of [['TLA', 1, 1], ['TLA', 23, 1], ['TLA', 119, 1], ['TLA', 1, 5]]) {
    const r = db.exec(`SELECT substr(v.texto,1,120) FROM versiculos v JOIN libros l ON v.libro_id = l.id JOIN traducciones t ON l.traduccion_id = t.id WHERE t.abreviatura = '${trans}' AND l.nombre = 'Salmos' AND v.capitulo = ${chap} AND v.versiculo = ${v}`)
    if (r.length && r[0].values.length) {
      console.log(`TLA Salmos ${chap}:${v}: ${r[0].values[0][0]}`)
    }
  }

  // Check if any TLA book has chapters with missing verses
  console.log('\nTLA books with chapters that have no verses:')
  const books = db.exec(`SELECT l.nombre FROM libros l JOIN traducciones t ON l.traduccion_id = t.id WHERE t.abreviatura = 'TLA' ORDER BY l.orden`)
  if (books.length) {
    for (const [name] of books[0].values) {
      const chCnt = db.exec(`SELECT v.capitulo, COUNT(*) FROM versiculos v JOIN libros l ON v.libro_id = l.id WHERE l.nombre = '${name}' AND l.traduccion_id IN (SELECT id FROM traducciones WHERE abreviatura = 'TLA') GROUP BY v.capitulo ORDER BY v.capitulo`)
      // Check for jumps in chapter numbers
      if (chCnt.length) {
        const chs = chCnt[0].values.map(r => r[0])
        for (let i = 1; i < chs.length; i++) {
          if (chs[i] - chs[i-1] > 1) {
            console.log(`  ${name}: missing chapter ${chs[i-1] + 1}`)
          }
        }
      }
    }
  }

  db.close()
}

main().catch(console.error)
