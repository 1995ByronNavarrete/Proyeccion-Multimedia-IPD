const play = require('play-dl')
play.video_info('https://www.youtube.com/watch?v=dQw4w9WgXcQ').then(async info => {
  const stream = await play.stream_from_info(info, { quality: 720 })
  console.log('Stream type:', typeof stream)
  console.log('Stream is Readable:', stream.readable)
  console.log('Stream keys:', Object.keys(stream))
  // The format from stream should have the URL
  const format = info.format
  for (const key of Object.keys(format)) {
    const f = format[key]
    if (f.url) {
      console.log('\nFORMAT WITH URL:', key, 'quality:', f.quality, 'url:', f.url.substring(0, 80))
      break
    }
  }
}).catch(e => console.log('Error:', e.message))
