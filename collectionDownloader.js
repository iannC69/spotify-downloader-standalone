const path = require('path')
const fs = require('fs')
const crypto = require('crypto')
const { spawn } = require('child_process')
const archiver = require('archiver')

const COLLECTION_LIMIT = 100
let spotifyUserTokenCache = { token: null, expiresAt: 0 }

const isYouTubeUrl = (url) => {
  if (!url) return false
  return /(?:youtube\.com|youtu\.be)/.test(url)
}

const extractSpotifyResource = (url) => {
  if (!url) return null

  // Curăță URL-ul de parametri
  const cleanUrl = url.split('?')[0]

  // Diferite pattern-uri pentru Spotify
  const patterns = [
    /spotify\.com\/track\/([a-zA-Z0-9]+)/,
    /spotify\.com\/playlist\/([a-zA-Z0-9]+)/,
    /spotify\.com\/album\/([a-zA-Z0-9]+)/,
    /open\.spotify\.com\/track\/([a-zA-Z0-9]+)/,
    /open\.spotify\.com\/playlist\/([a-zA-Z0-9]+)/,
    /open\.spotify\.com\/album\/([a-zA-Z0-9]+)/
  ]

  for (const pattern of patterns) {
    const match = cleanUrl.match(pattern)
    if (match) {
      const type = cleanUrl.includes('/track/') ? 'track' :
        cleanUrl.includes('/playlist/') ? 'playlist' : 'album'
      return { type, id: match[1] }
    }
  }

  return null
}

const safeFilename = (name, fallback = 'unknown') => {
  if (!name) return fallback
  return name.replace(/[<>:"/\\|?*]/g, '').trim() || fallback
}

const ensureDownloadsDir = () => {
  const downloadsDir = path.resolve(process.cwd(), 'downloads')
  if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir, { recursive: true })
  }
  return downloadsDir
}

const createZipFromDirectory = (sourceDir, outputPath) => {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath)
    const archive = archiver('zip', { zlib: { level: 9 } })
    output.on('close', resolve)
    archive.on('error', reject)
    archive.pipe(output)
    archive.directory(sourceDir, false)
    archive.finalize()
  })
}

const scheduleDownloadCleanup = (filePath) => {
  setTimeout(() => {
    try {
      if (fs.existsSync(filePath)) {
        fs.rmSync(filePath, { force: true })
      }
    } catch { /* ignore */ }
  }, 3600000) // 1 oră
}

const sendSse = (res, data) => {
  res.write('data: ' + JSON.stringify(data) + '\n\n')
}

const collectionDownloaderPlugin = () => ({
  name: 'collection-downloader-plugin',
  configureServer(server) {
    const binPath = path.resolve(__dirname, 'bin/yt-dlp.exe')
    const ffmpegPath = path.resolve(__dirname, 'bin/ffmpeg.exe')

    const runProcess = (command, args, onOutput = () => { }) => new Promise((resolve, reject) => {
      const child = spawn(command, args)
      let stderr = ''
      child.stdout.on('data', chunk => onOutput(chunk.toString()))
      child.stderr.on('data', chunk => {
        const text = chunk.toString()
        stderr += text
        onOutput(text)
      })
      child.on('error', reject)
      child.on('close', code => {
        if (code === 0) resolve()
        else reject(new Error(stderr.trim() || 'Procesul de descărcare a eșuat.'))
      })
    })

    const runYtDlpJson = (args) => new Promise((resolve, reject) => {
      const child = spawn(binPath, args)
      let stdout = ''
      let stderr = ''
      let settled = false
      const timeout = setTimeout(() => {
        try { child.kill() } catch { /* ignore */ }
        if (!settled) {
          settled = true
          reject(new Error('Cererea către YouTube a expirat.'))
        }
      }, 120000)
      child.stdout.on('data', chunk => { stdout += chunk.toString() })
      child.stderr.on('data', chunk => { stderr += chunk.toString() })
      child.on('error', error => {
        if (!settled) {
          settled = true
          clearTimeout(timeout)
          reject(error)
        }
      })
      child.on('close', code => {
        if (settled) return
        settled = true
        clearTimeout(timeout)
        if (code !== 0) return reject(new Error(stderr.trim() || 'yt-dlp nu a putut citi acest link.'))
        try {
          resolve(JSON.parse(stdout))
        } catch {
          reject(new Error('Nu am putut interpreta răspunsul YouTube.'))
        }
      })
    })

    const getSpotifyToken = async () => {
      console.log('Încerc să obțin token Spotify...')

      // Return cached token if still valid (5 minute buffer)
      if (spotifyUserTokenCache.token && Date.now() < spotifyUserTokenCache.expiresAt - 300_000) {
        console.log('Folosesc token cache')
        return spotifyUserTokenCache.token
      }

      const clientId = process.env.SPOTIFY_CLIENT_ID
      const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
      const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN

      console.log('Client ID:', clientId ? 'SETAT' : 'LIPSĂ')
      console.log('Client Secret:', clientSecret ? 'SETAT' : 'LIPSĂ')
      console.log('Refresh Token:', refreshToken ? 'SETAT' : 'LIPSĂ')

      if (!clientId || !clientSecret) {
        throw new Error('Lipsesc cheile Spotify din fișierul .env.')
      }

      const basic = Buffer.from(clientId + ':' + clientSecret).toString('base64')
      const body = refreshToken
        ? new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken })
        : new URLSearchParams({ grant_type: 'client_credentials' })

      try {
        const response = await fetch('https://accounts.spotify.com/api/token', {
          method: 'POST',
          headers: {
            Authorization: 'Basic ' + basic,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body
        })
        const data = await response.json()
        if (!response.ok) {
          console.error('Eroare Spotify token:', data)
          throw new Error(data.error_description || 'Nu am putut obține acces la Spotify.')
        }

        // Cache token with expiry
        spotifyUserTokenCache.token = data.access_token
        spotifyUserTokenCache.expiresAt = Date.now() + (data.expires_in || 3600) * 1000
        console.log('Token obținut cu succes, expiră la:', new Date(spotifyUserTokenCache.expiresAt))
        return data.access_token
      } catch (error) {
        console.error('Eroare la obținerea tokenului:', error)
        throw error
      }
    }

    const spotifyRequest = async (token, endpoint) => {
      const url = endpoint.startsWith('http') ? endpoint : 'https://api.spotify.com/v1' + endpoint
      console.log('Spotify request:', url)
      const response = await fetch(url, {
        headers: { Authorization: 'Bearer ' + token }
      })
      const data = await response.json()
      if (!response.ok) {
        console.error('Spotify API error:', data)
        throw new Error(data.error?.message || 'Spotify nu a putut citi acest link.')
      }
      return data
    }

    const spotifyTrack = (track, overrides = {}) => ({
      title: track.name,
      artist: (track.artists || []).map(artist => artist.name).join(', ') || 'Artist necunoscut',
      album: overrides.album || track.album?.name || '',
      coverUrl: overrides.coverUrl || track.album?.images?.[0]?.url || '',
      duration_ms: track.duration_ms || 0,
      trackNumber: track.track_number || 0
    })

    const fetchSpotifyTracks = async (token, endpoint, overrides = {}) => {
      const tracks = []
      let next = endpoint
      while (next && tracks.length < COLLECTION_LIMIT) {
        const page = await spotifyRequest(token, next)
        const pageTracks = (page.items || [])
          .map(item => item.track || item)
          .filter(track => track && track.type !== 'episode' && !track.is_local)
        tracks.push(...pageTracks.slice(0, COLLECTION_LIMIT - tracks.length).map(track => spotifyTrack(track, overrides)))
        next = page.next
      }
      return tracks
    }

    const getSpotifyCollection = async (spotifyUrl) => {
      const resource = extractSpotifyResource(spotifyUrl)
      console.log('Resource extras:', resource)

      if (!resource) throw new Error('Introdu un link valid de track, playlist sau album Spotify.')

      const token = await getSpotifyToken()
      console.log('Token obținut, încerc să fetch-uiesc:', resource.type, resource.id)

      if (resource.type === 'track') {
        const track = await spotifyRequest(token, '/tracks/' + resource.id)
        const normalized = spotifyTrack(track)
        return {
          kind: 'track',
          title: normalized.title,
          artist: normalized.artist,
          album: normalized.album,
          coverUrl: normalized.coverUrl,
          duration_ms: normalized.duration_ms,
          trackCount: 1,
          tracks: [normalized]
        }
      }

      if (resource.type === 'playlist') {
        const playlist = await spotifyRequest(token, '/playlists/' + resource.id)
        const tracks = await fetchSpotifyTracks(token, '/playlists/' + resource.id + '/tracks?limit=100')
        return {
          kind: 'playlist',
          title: playlist.name || 'Spotify Playlist',
          artist: playlist.owner?.display_name || 'Spotify',
          album: '',
          coverUrl: playlist.images?.[0]?.url || '',
          duration_ms: 0,
          trackCount: Number(playlist.tracks?.total || tracks.length),
          tracks
        }
      }

      // Album
      const album = await spotifyRequest(token, '/albums/' + resource.id)
      const albumArtist = (album.artists || []).map(artist => artist.name).join(', ') || 'Artist necunoscut'
      const tracks = await fetchSpotifyTracks(token, '/albums/' + resource.id + '/tracks?limit=50', {
        album: album.name || '',
        coverUrl: album.images?.[0]?.url || ''
      })
      return {
        kind: 'album',
        title: album.name || 'Spotify Album',
        artist: albumArtist,
        album: album.name || '',
        coverUrl: album.images?.[0]?.url || '',
        duration_ms: 0,
        trackCount: Number(album.total_tracks || tracks.length),
        tracks
      }
    }

    const publicSpotifyCollection = collection => ({
      kind: collection.kind,
      title: collection.title,
      artist: collection.artist,
      album: collection.album,
      coverUrl: collection.coverUrl,
      duration_ms: collection.duration_ms,
      trackCount: collection.trackCount,
      downloadableCount: collection.tracks.length,
      isTruncated: collection.trackCount > collection.tracks.length,
      previewTracks: collection.tracks.slice(0, 5).map(track => ({
        title: track.title,
        artist: track.artist,
        duration_ms: track.duration_ms
      }))
    })

    server.middlewares.use('/api/ytdl/collection-info', async (req, res, next) => {
      const urlObj = new URL(req.url, 'http://' + req.headers.host)
      if (urlObj.pathname !== '/') return next()
      const videoUrl = urlObj.searchParams.get('url')
      if (!videoUrl || !isYouTubeUrl(videoUrl)) {
        res.statusCode = 400
        return res.end(JSON.stringify({ error: 'Introdu un link valid de YouTube.' }))
      }

      try {
        const playlist = await runYtDlpJson([
          '--dump-single-json',
          '--flat-playlist',
          '--playlist-end', String(COLLECTION_LIMIT + 1),
          videoUrl
        ])
        const entries = (playlist.entries || []).filter(Boolean)
        if (!entries.length && playlist._type !== 'playlist') throw new Error('Acest link nu conține un playlist disponibil.')
        const count = Number(playlist.playlist_count || playlist.n_entries || entries.length)
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({
          title: playlist.title || playlist.playlist_title || 'YouTube Playlist',
          count,
          downloadableCount: Math.min(count || entries.length, COLLECTION_LIMIT),
          isTruncated: count > COLLECTION_LIMIT,
          entries: entries.slice(0, 5).map(entry => ({
            title: entry.title || 'Video fără titlu',
            uploader: entry.uploader || entry.channel || null,
            duration: entry.duration || null
          }))
        }))
      } catch (error) {
        console.error('YouTube error:', error)
        res.statusCode = 500
        res.end(JSON.stringify({ error: error.message || 'Nu am putut încărca playlistul.' }))
      }
    })

    server.middlewares.use('/api/ytdl/collection-download', (req, res, next) => {
      const urlObj = new URL(req.url, 'http://' + req.headers.host)
      if (urlObj.pathname !== '/') return next()
      const videoUrl = urlObj.searchParams.get('url')
      const format = urlObj.searchParams.get('format') || 'video:bestvideo[ext=mp4]+bestaudio[ext=m4a]/best'
      if (!videoUrl || !isYouTubeUrl(videoUrl)) {
        res.statusCode = 400
        return res.end('Introdu un link valid de YouTube.')
      }

      const downloadsDir = ensureDownloadsDir()
      const jobId = crypto.randomUUID()
      const collectionDir = path.join(downloadsDir, 'youtube-playlist-' + jobId)
      fs.mkdirSync(collectionDir, { recursive: true })
      const outputTemplate = path.join(collectionDir, '%(playlist_index)03d - %(title)s.%(ext)s')
      let args

      if (format.startsWith('audio:')) {
        const parts = format.split(':')
        const audioFormat = ['mp3', 'wav', 'vorbis'].includes(parts[1]) ? parts[1] : 'mp3'
        const audioQuality = /^\d+$/.test(parts[2] || '') ? parts[2] : '0'
        args = ['-x', '--audio-format', audioFormat, '-o', outputTemplate, '--ffmpeg-location', path.resolve(__dirname, 'bin')]
        if (audioFormat !== 'wav') args.splice(3, 0, '--audio-quality', audioQuality)
      } else {
        const videoFormat = format.startsWith('video:') ? format.substring(6) : 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best'
        args = ['-f', videoFormat, '--merge-output-format', 'mp4', '-o', outputTemplate, '--ffmpeg-location', path.resolve(__dirname, 'bin')]
      }

      args.push('--yes-playlist', '--playlist-end', String(COLLECTION_LIMIT), '--restrict-filenames', '--newline', videoUrl)
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')

      let currentItem = 1
      let totalItems = 0
      let lastOutput = ''
      const onOutput = text => {
        lastOutput = text
        const item = text.match(/Downloading item\s+(\d+)\s+of\s+(\d+)/i)
        const itemProgress = text.match(/\[download\]\s+([\d.]+)%/)
        if (item) {
          currentItem = Number(item[1])
          totalItems = Number(item[2])
        }
        const progress = totalItems
          ? ((currentItem - 1) / totalItems) * 100 + ((itemProgress ? Number(itemProgress[1]) : 0) / totalItems)
          : 0
        sendSse(res, {
          progress: Math.min(progress, 99),
          currentItem,
          totalItems,
          status: totalItems ? 'Se descarcă piesa ' + currentItem + ' din ' + totalItems : 'Se pregătește playlistul...'
        })
      }

      runProcess(binPath, args, onOutput)
        .then(async () => {
          sendSse(res, { progress: 99, status: 'Se creează arhiva ZIP...' })
          const zipFilename = 'youtube-playlist-' + jobId + '.zip'
          const zipPath = path.join(downloadsDir, zipFilename)
          await createZipFromDirectory(collectionDir, zipPath)
          fs.rmSync(collectionDir, { recursive: true, force: true })
          scheduleDownloadCleanup(zipPath)
          sendSse(res, { done: true, progress: 100, finalFilename: zipFilename, isArchive: true })
          res.end()
        })
        .catch(error => {
          try { fs.rmSync(collectionDir, { recursive: true, force: true }) } catch { /* ignore */ }
          sendSse(res, { done: true, error: error.message || lastOutput || 'Nu am putut descărca playlistul.' })
          res.end()
        })
    })

    // ENDPOINT PRINCIPAL SPOTIFY - MODIFICAT
    server.middlewares.use('/api/spotify/collection-info', async (req, res, next) => {
      const urlObj = new URL(req.url, 'http://' + req.headers.host)
      if (urlObj.pathname !== '/') return next()

      const spotifyUrl = urlObj.searchParams.get('url')
      console.log('=== SPOTIFY COLLECTION INFO ===')
      console.log('URL primit:', spotifyUrl)

      const resource = extractSpotifyResource(spotifyUrl)
      console.log('Resource extras:', resource)

      if (!resource) {
        console.log('Resource invalid, trimit 400')
        res.statusCode = 400
        return res.end(JSON.stringify({
          error: 'Introdu un link valid de track, playlist sau album Spotify.',
          received: spotifyUrl
        }))
      }

      try {
        console.log('Încep să fetch-uiesc colecția...')
        const collection = await getSpotifyCollection(spotifyUrl)
        console.log('Colecție obținută:', collection.title, collection.tracks.length)
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(publicSpotifyCollection(collection)))
      } catch (error) {
        console.error('=== EROARE SPOTIFY ===')
        console.error(error)
        res.statusCode = 500
        res.end(JSON.stringify({
          error: error.message || 'Nu am putut încărca linkul Spotify.',
          details: error.stack || 'Nu există detalii'
        }))
      }
    })

    server.middlewares.use('/api/spotify/collection-download', async (req, res, next) => {
      const urlObj = new URL(req.url, 'http://' + req.headers.host)
      if (urlObj.pathname !== '/') return next()
      const spotifyUrl = urlObj.searchParams.get('url')
      const format = urlObj.searchParams.get('format') || 'mp3:0'
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')

      const downloadsDir = ensureDownloadsDir()
      const jobId = crypto.randomUUID()
      const jobDir = path.join(downloadsDir, 'spotify-' + jobId)
      const coverPaths = new Map()

      try {
        const collection = await getSpotifyCollection(spotifyUrl)
        if (!collection.tracks.length) throw new Error('Nu am găsit piese care pot fi descărcate în această colecție.')
        fs.mkdirSync(jobDir, { recursive: true })
        const total = collection.tracks.length
        sendSse(res, { progress: 0, currentItem: 0, totalItems: total, status: 'Se pregătesc ' + total + ' piese...' })

        const getCover = async coverUrl => {
          if (!coverUrl) return ''
          if (coverPaths.has(coverUrl)) return coverPaths.get(coverUrl)
          try {
            const coverResponse = await fetch(coverUrl)
            if (!coverResponse.ok) throw new Error('Cover unavailable')
            const coverPath = path.join(downloadsDir, 'spotify-cover-' + jobId + '-' + coverPaths.size + '.jpg')
            fs.writeFileSync(coverPath, Buffer.from(await coverResponse.arrayBuffer()))
            coverPaths.set(coverUrl, coverPath)
            return coverPath
          } catch {
            coverPaths.set(coverUrl, '')
            return ''
          }
        }

        const outputFiles = []
        for (let index = 0; index < total; index += 1) {
          const track = collection.tracks[index]
          const itemNumber = index + 1
          const rawPath = path.join(jobDir, 'raw-' + itemNumber + '.mp3')
          const prefix = String(itemNumber).padStart(String(total).length, '0')
          const outputPath = path.join(jobDir, prefix + ' - ' + safeFilename(track.artist, 'Artist') + ' - ' + safeFilename(track.title, 'Track') + '.mp3')
          const coverPath = await getCover(track.coverUrl)
          const search = 'ytsearch1:' + track.artist + ' ' + track.title + ' audio'

          sendSse(res, {
            progress: (index / total) * 90,
            currentItem: itemNumber,
            totalItems: total,
            currentTitle: track.title,
            status: 'Se descarcă piesa ' + itemNumber + ' din ' + total + ': ' + track.title
          })

          const audioQuality = format.split(':')[1] || '0'

          await runProcess(binPath, [
            '-x', '--audio-format', 'mp3', '--audio-quality', audioQuality,
            '--ffmpeg-location', ffmpegPath,
            '-o', rawPath,
            search
          ], text => {
            const progressMatch = text.match(/\[download\]\s+([\d.]+)%/)
            if (progressMatch) {
              sendSse(res, {
                progress: ((index + Number(progressMatch[1]) / 100) / total) * 90,
                currentItem: itemNumber,
                totalItems: total,
                currentTitle: track.title,
                status: 'Se descarcă piesa ' + itemNumber + ' din ' + total + ': ' + track.title
              })
            }
          })
          if (!fs.existsSync(rawPath)) throw new Error('Fișierul pentru „' + track.title + '” nu a fost creat.')

          const ffmpegArgs = ['-y', '-i', rawPath]
          if (coverPath && fs.existsSync(coverPath)) {
            ffmpegArgs.push('-i', coverPath, '-map', '0:0', '-map', '1:0', '-c', 'copy', '-id3v2_version', '3')
            ffmpegArgs.push('-metadata:s:v', 'title=Album cover', '-metadata:s:v', 'comment=Cover (front)')
          } else {
            ffmpegArgs.push('-c', 'copy')
          }
          ffmpegArgs.push('-metadata', 'title=' + track.title)
          ffmpegArgs.push('-metadata', 'artist=' + track.artist)
          if (track.album) ffmpegArgs.push('-metadata', 'album=' + track.album)
          ffmpegArgs.push(outputPath)
          await runProcess(ffmpegPath, ffmpegArgs)
          fs.rmSync(rawPath, { force: true })
          outputFiles.push(outputPath)
          sendSse(res, {
            progress: ((index + 1) / total) * 90,
            currentItem: itemNumber,
            totalItems: total,
            currentTitle: track.title,
            status: 'S-a pregătit piesa ' + itemNumber + ' din ' + total
          })
        }

        coverPaths.forEach(coverPath => {
          try { if (coverPath) fs.rmSync(coverPath, { force: true }) } catch { /* ignore */ }
        })

        let finalFilename
        const isArchive = collection.kind !== 'track'
        if (isArchive) {
          sendSse(res, { progress: 99, status: 'Se creează arhiva ZIP...' })
          finalFilename = 'spotify-' + collection.kind + '-' + jobId + '.zip'
          const zipPath = path.join(downloadsDir, finalFilename)
          await createZipFromDirectory(jobDir, zipPath)
          fs.rmSync(jobDir, { recursive: true, force: true })
          scheduleDownloadCleanup(zipPath)
        } else {
          finalFilename = 'spotify-track-' + jobId + '.mp3'
          fs.renameSync(outputFiles[0], path.join(downloadsDir, finalFilename))
          fs.rmSync(jobDir, { recursive: true, force: true })
          scheduleDownloadCleanup(path.join(downloadsDir, finalFilename))
        }

        sendSse(res, { done: true, progress: 100, finalFilename, isArchive })
        res.end()
      } catch (error) {
        coverPaths.forEach(coverPath => {
          try { if (coverPath) fs.rmSync(coverPath, { force: true }) } catch { /* ignore */ }
        })
        try { fs.rmSync(jobDir, { recursive: true, force: true }) } catch { /* ignore */ }
        sendSse(res, { done: true, error: error.message || 'Nu am putut pregăti descărcarea Spotify.' })
        res.end()
      }
    })
  }
})

module.exports = collectionDownloaderPlugin