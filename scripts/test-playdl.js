const play = require('play-dl')
play.video_basic_info('https://www.youtube.com/watch?v=dQw4w9WgXcQ').then(info => {
  const keys = Object.keys(info.format)
  console.log('Total formats:', keys.length)
  for (const key of keys.slice(0, 5)) {
    const f = info.format[key]
    console.log(`Format ${key}:`, JSON.stringify({
      itag: f.itag,
      mimeType: (f.mimeType || '').substring(0, 30),
      quality: f.quality,
      hasVideo: f.hasVideo,
      hasAudio: f.hasAudio,
      hasUrl: !!f.url,
      url: (f.url || '').substring(0, 60)
    }))
  }
  // Find format with url
  for (const key of keys) {
    const f = info.format[key]
    if (f.url && f.hasVideo && f.hasAudio) {
      console.log('\nBest format found:', key, 'url:', f.url.substring(0, 80))
      process.exit(0)
    }
  }
  console.log('\nNo format with video+audio found')
  // Try stream_from_info
}).catch(e => console.log('Error:', e.message))
