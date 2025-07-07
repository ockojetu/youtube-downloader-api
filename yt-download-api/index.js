const express = require('express')
const { spawn, execSync } = require('child_process')
const path = require('path')
const app = express()
const PORT = 8080

const YTDLP_PATH = path.join(__dirname, 'yt-dlp')

function buildFormatString(quality) {
  const resolutions = {
    '144p': 144,
    '240p': 240,
    '360p': 360,
    '480p': 480,
    '720p': 720,
    '1080p': 1080,
    '2k': 1440,
    '1440p': 1440,
    '4k': 2160,
    '2160p': 2160,
  }

  const height = resolutions[quality.toLowerCase()]
  if (height) return `bestvideo[height=${height}]+bestaudio/best`
  return 'best'
}

app.get('/', (req, res) => {
  const url = req.query.url
  const quality = req.query.quality || 'best'

  if (!url || !url.startsWith('http')) {
    return res.status(400).send('Invalid or missing YouTube URL')
  }

  const format = buildFormatString(quality)

  // Check if the requested format is available
  try {
    const probe = execSync(`${YTDLP_PATH} -F "${url}"`).toString()
    if (format.includes('height=')) {
      const height = format.match(/height=(\d+)/)[1]
      const found = probe.includes(`${height}x`) || probe.includes(`${height}p`)
      if (!found) return res.status(400).send(`Requested quality (${quality}) not available`)
    }
  } catch (err) {
    return res.status(500).send('Failed to check video formats')
  }

  const process = spawn(YTDLP_PATH, ['-f', format, '-o', '-', url])

  res.setHeader('Content-Type', 'video/mp4')
  res.setHeader('Content-Disposition', `attachment; filename="video_${quality}.mp4"`)

  process.stdout.pipe(res)

  process.stderr.on('data', data => {
    console.error(`yt-dlp error: ${data}`)
  })

  process.on('error', () => {
    res.status(500).send('yt-dlp not found or failed to run')
  })

  process.on('exit', code => {
    if (code !== 0) {
      res.status(500).send('Download failed')
    }
  })
})

app.listen(PORT, () => {
  console.log(`yt-dlp API with quality control running at http://localhost:${PORT}`)
})
