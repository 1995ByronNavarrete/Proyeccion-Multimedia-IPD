const initSqlJs = require('sql.js')
const fs = require('fs')
const path = require('path')

const DB_PATH = path.join(process.env.APPDATA, 'desktopappipd', 'desktopappipd.db')

async function main() {
  const SQL = await initSqlJs()
  const buf = fs.readFileSync(DB_PATH)
  const db = new SQL.Database(buf)

  // TLA check
  const tla = db.exec("SELECT substr(v.texto,1,80) FROM versiculos v JOIN libros l ON v.libro_id = l.id JOIN traducciones t ON l.traduccion_id = t.id WHERE t.abreviatura = 'TLA' AND l.orden = 1 AND v.capitulo = 1 AND v.versiculo = 1")
  if (tla.length && tla[0].values.length) console.log('TLA Gen 1:1:', tla[0].values[0][0])
  else console.log('TLA Gen 1:1 not found')

  const tlaCnt = db.exec("SELECT COUNT(*) FROM versiculos v JOIN libros l ON v.libro_id = l.id JOIN traducciones t ON l.traduccion_id = t.id WHERE t.abreviatura = 'TLA'")
  if (tlaCnt.length) console.log('TLA total verses:', tlaCnt[0].values[0][0])

  // NTV check
  const ntv = db.exec("SELECT substr(v.texto,1,80) FROM versiculos v JOIN libros l ON v.libro_id = l.id JOIN traducciones t ON l.traduccion_id = t.id WHERE t.abreviatura = 'NTV' AND l.orden = 1 AND v.capitulo = 1 AND v.versiculo = 1")
  if (ntv.length && ntv[0].values.length) console.log('NTV Gen 1:1:', ntv[0].values[0][0])
  else console.log('NTV Gen 1:1 not found')

  const ntvCnt = db.exec("SELECT COUNT(*) FROM versiculos v JOIN libros l ON v.libro_id = l.id JOIN traducciones t ON l.traduccion_id = t.id WHERE t.abreviatura = 'NTV'")
  if (ntvCnt.length) console.log('NTV total verses:', ntvCnt[0].values[0][0])

  db.close()
}

main().catch(console.error)
