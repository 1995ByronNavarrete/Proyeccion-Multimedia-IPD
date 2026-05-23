import { execute, queryOne } from './database'
import { seedFromBibleApi, seedFromApiBible } from './bible-source'

export async function downloadAndSeedBible(
  abbreviation: string,
  nombre: string,
  source: 'bible-api' | 'api-bible',
  apiKey: string,
  onProgress: (completed: number, total: number, bookName?: string) => void
): Promise<void> {
  const existing = queryOne('SELECT id FROM traducciones WHERE abreviatura = ?', [abbreviation])
  if (existing) {
    throw new Error(`La biblia "${abbreviation}" ya está descargada`)
  }

  const transResult = execute(
    'INSERT INTO traducciones (nombre, abreviatura, idioma, activa) VALUES (?, ?, ?, ?)',
    [nombre, abbreviation, 'es', 1]
  )
  const translationId = transResult.lastInsertRowid

  try {
    if (source === 'bible-api') {
      await seedFromBibleApi(translationId, abbreviation, onProgress)
    } else {
      await seedFromApiBible(translationId, abbreviation, apiKey, nombre, abbreviation, onProgress)
    }
  } catch (err) {
    execute('DELETE FROM versiculos WHERE libro_id IN (SELECT id FROM libros WHERE traduccion_id = ?)', [translationId])
    execute('DELETE FROM libros WHERE traduccion_id = ?', [translationId])
    execute('DELETE FROM traducciones WHERE id = ?', [translationId])
    throw err
  }

  execute('UPDATE traducciones SET activa = 1 WHERE id = ?', [translationId])
}
