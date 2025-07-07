const express = require('express')
const ytdl = require('ytdl-core')
const app = express()
const PORT = process.env.PORT || 8080

app.get('/', async (req, res) => {
  const url = req.query.url
  if (!url || !ytdl.validateURL(url)) {
    return res.status(400).send('Invalid or missing YouTube URL')
  }

  try {
    const info = await ytdl.getInfo(url)
    const format = ytdl.chooseFormat(info.formats, { quality: '18' }) // 360p mp4 with audio+video
    if (!format || !format.url) throw new Error('No suitable format found')

    const title = info.videoDetails.title.replace(/[^\w\s]/gi, '')
    res.setHeader('Content-Disposition', `attachment; filename="${title}.mp4"`)
    ytdl.downloadFromInfo(info, { format }).pipe(res)

  } catch (err) {
    res.status(500).send('Error processing the video')
  }
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
