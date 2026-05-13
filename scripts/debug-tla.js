const fs = require('fs')

function decodeHtml(text) {
  return text
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(d))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
}

function extractVerses(html) {
  let clean = html.replace(/<span class="note[^>]*>[\s\S]*?<\/span>/g, '')
  clean = clean.replace(/<span class="label">\d+<\/span>/g, '')

  const verseRegex = /<span class="verse v(\d+)"[^>]*>[\s\S]*?<span class="content">([\s\S]*?)<\/span>/g
  const verses = []
  let match
  while ((match = verseRegex.exec(clean)) !== null) {
    const verseNum = parseInt(match[1], 10)
    let text = match[2]
    text = text.replace(/<[^>]+>/g, '')
    text = decodeHtml(text.trim())
    text = text.replace(/^\d+\s*/, '')
    if (text) verses.push({ verse: verseNum, text })
  }

  const best = new Map()
  for (const v of verses) {
    const existing = best.get(v.verse)
    if (!existing || v.text.length > existing.text.length) best.set(v.verse, v)
  }
  return Array.from(best.values()).sort((a, b) => a.verse - b.verse)
}

const tla = JSON.parse(fs.readFileSync('scripts/tla.json', 'utf-8'))
const gen1 = tla.books[0].chapters.find(c => c.chapter_usfm === 'GEN.1')

const rawMatches = [...gen1.chapter_html.matchAll(/<span class="verse v(\d+)"[^>]*>/g)]
console.log('Raw verse matches in TLA Genesis 1:', rawMatches.length)

const counts = {}
rawMatches.forEach(m => { const v = parseInt(m[1]); counts[v] = (counts[v] || 0) + 1 })
const dupes = Object.entries(counts).filter(([, c]) => c > 1)
console.log('Duplicate numbers:', dupes)

const extracted = extractVerses(gen1.chapter_html)
console.log('Extracted verses:', extracted.length)
console.log('Extracted verse numbers:', extracted.map(v => v.verse).join(','))

// Check a specific duplicate
if (dupes.length) {
  const vNum = dupes[0][0]
  const idx1 = rawMatches[0].index
  const idx2 = rawMatches[1].index
  console.log('\nFirst match context:', gen1.chapter_html.substring(rawMatches[0].index, rawMatches[0].index + 300))
}
