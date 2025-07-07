const express = require('express')
const ytdl = require('ytdl-core')
const app = express()
const PORT = process.env.PORT || 3000

app.get('/', (req, res) => {
  const url = req.query.url
  if (!ytdl.validateURL(url)) return res.status(400).send('Invalid YouTube URL')

  ytdl.getInfo(url).then(info => {
    res.header('Content-Disposition', `attachment; filename="${info.videoDetails.title}.mp4"`)
    ytdl(url, { filter: 'audioandvideo' }).pipe(res)
  }).catch(() => {
    res.status(500).send('Error processing the video')
  })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
