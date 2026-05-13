import { net } from 'electron'
import { execute, queryOne, queryAll } from './database'

const API_BIBLE_BASE = 'https://api.scripture.api.bible/v1'
const BIBLE_API_BASE = 'https://bible-api.com/data'

export interface SourceTranslation {
  id: string
  name: string
  abbreviation: string
  language: string
  source: 'bible-api' | 'api-bible'
}

export async function getApiBibleTranslations(apiKey: string): Promise<SourceTranslation[]> {
  try {
    const response = await net.fetch(`${API_BIBLE_BASE}/bibles?language=spa`, {
      method: 'GET',
      headers: { 'api-key': apiKey }
    })
    if (!response.ok) return []
    const data = await response.json()
    if (!data?.data?.length) return []
    return data.data.map((b: { id: string; name: string; abbreviation: string }) => ({
      id: b.id,
      name: b.name,
      abbreviation: b.abbreviation,
      language: 'es',
      source: 'api-bible' as const
    }))
  } catch {
    return []
  }
}

export async function getBibleApiTranslations(): Promise<SourceTranslation[]> {
  try {
    const response = await net.fetch(`${BIBLE_API_BASE}`, { method: 'GET' })
    if (!response.ok) return []
    const data = await response.json()
    if (!data?.translations?.length) return []
    return data.translations
      .filter((t: { language_code: string }) => t.language_code === 'spa' || t.language_code === 'eng')
      .map((t: { identifier: string; name: string; language: string }) => ({
        id: t.identifier,
        name: t.name,
        abbreviation: t.identifier.toUpperCase(),
        language: t.language === 'Spanish' ? 'es' : 'en',
        source: 'bible-api' as const
      }))
  } catch {
    return []
  }
}

export async function seedFromBibleApi(
  translationId: number,
  abbreviation: string,
  onProgress: (completed: number, total: number, bookName?: string) => void
): Promise<void> {
  const transData = await fetchJson<{ books: { id: string; name: string; url: string }[] }>(
    `${BIBLE_API_BASE}/${abbreviation.toLowerCase()}`
  )
  const booksList = transData.books

  let completedChapters = 0
  const insertedBooks: { id: number; name: string; bookId: string; chapters: number }[] = []

  for (let i = 0; i < booksList.length; i++) {
    const book = booksList[i]
    const testament = i < 39 ? 'AT' : 'NT'

    // Fetch individual book to get chapter count
    let chapterCount = 0
    try {
      const bookData = await fetchJson<{ chapters: unknown[] }>(
        `${BIBLE_API_BASE}/${abbreviation.toLowerCase()}/${book.id}`
      )
      chapterCount = bookData.chapters?.length || 0
    } catch {
      chapterCount = 0
    }

    const result = execute(
      'INSERT INTO libros (traduccion_id, nombre, orden, testamento) VALUES (?, ?, ?, ?)',
      [translationId, book.name, i + 1, testament]
    )
    insertedBooks.push({ id: result.lastInsertRowid, name: book.name, bookId: book.id, chapters: chapterCount })
  }

  const totalChapters = insertedBooks.reduce((s, b) => s + b.chapters, 0)

  const queue: { book: typeof insertedBooks[0]; chapter: number }[] = []
  for (const book of insertedBooks) {
    for (let c = 1; c <= book.chapters; c++) {
      queue.push({ book, chapter: c })
    }
  }

  let index = 0
  const workers = Array.from({ length: 6 }, () => worker())
  await Promise.all(workers)

  async function worker(): Promise<void> {
    while (index < queue.length) {
      const item = queue[index++]

      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const data = await fetchJson<{ verses: { chapter: number; verse: number; text: string }[] }>(
            `${BIBLE_API_BASE}/${abbreviation.toLowerCase()}/${item.book.bookId}/${item.chapter}`
          )
          for (const v of data.verses) {
            execute(
              'INSERT INTO versiculos (libro_id, capitulo, versiculo, texto) VALUES (?, ?, ?, ?)',
              [item.book.id, v.chapter, v.verse, v.text]
            )
          }
          break
        } catch {
          if (attempt < 2) await delay(1000 * (attempt + 1))
        }
      }
      completedChapters++
      onProgress(completedChapters, totalChapters, item.book.name)
    }
  }
}

export async function seedFromApiBible(
  translationId: number,
  bibleId: string,
  apiKey: string,
  nombre: string,
  abreviatura: string,
  onProgress: (completed: number, total: number, bookName?: string) => void
): Promise<void> {
  const headers = { 'api-key': apiKey }

  const booksRes = await fetchJsonWithHeaders(`${API_BIBLE_BASE}/bibles/${bibleId}/books`, headers)
  const booksData = booksRes?.data?.filter((b: { bookGroup: string }) => b.bookGroup !== 'APOCRYPHA') ?? []
  if (!booksData.length) throw new Error('No se pudieron obtener los libros')

  const totalChapters = booksData.reduce((s: number, b: { chapters: unknown[] }) => s + (b.chapters?.length || 0), 0)
  let completedChapters = 0

  const insertedBooks: { id: number; name: string; bookId: string; chapters: string[] }[] = []

  for (let i = 0; i < booksData.length; i++) {
    const book = booksData[i]
    const testament = i < 39 ? 'AT' : 'NT'
    const result = execute(
      'INSERT INTO libros (traduccion_id, nombre, orden, testamento) VALUES (?, ?, ?, ?)',
      [translationId, book.name, i + 1, testament]
    )
    const chapterIds = (book.chapters || []).map((c: { id: string }) => c.id)
    insertedBooks.push({ id: result.lastInsertRowid, name: book.name, bookId: book.id, chapters: chapterIds })
  }

  const queue: { book: typeof insertedBooks[0]; chapterId: string }[] = []
  for (const book of insertedBooks) {
    for (const ch of book.chapters) {
      queue.push({ book, chapterId: ch })
    }
  }

  let index = 0
  const workers = Array.from({ length: 4 }, () => worker())
  await Promise.all(workers)

  async function worker(): Promise<void> {
    while (index < queue.length) {
      const item = queue[index++]
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const chRes = await fetchJsonWithHeaders(
            `${API_BIBLE_BASE}/bibles/${bibleId}/chapters/${item.chapterId}/verses`,
            headers
          )
          const versesData = chRes?.data ?? []
          for (const v of versesData) {
            execute(
              'INSERT INTO versiculos (libro_id, capitulo, versiculo, texto) VALUES (?, ?, ?, ?)',
              [item.book.id, v.chapterId ? parseInt(v.chapterId.split('.').pop() || '1', 10) : 1, v.orgId ? parseInt(v.orgId, 10) : 1, v.textContent || v.content?.[0]?.text || '']
            )
          }
          break
        } catch {
          if (attempt < 2) await delay(1000 * (attempt + 1))
        }
      }
      completedChapters++
      onProgress(completedChapters, totalChapters, item.book.name)
    }
  }
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await net.fetch(url, { method: 'GET' })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
}

async function fetchJsonWithHeaders(url: string, headers: Record<string, string>): Promise<any> {
  const response = await net.fetch(url, { method: 'GET', headers })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}
