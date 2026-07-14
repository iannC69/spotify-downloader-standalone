import http from 'http'
import { exec } from 'child_process'
import 'dotenv/config'

// Pune direct aici daca nu ai dotenv instalat
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET
const REDIRECT_URI = 'http://localhost:8888/callback'

const SCOPES = [
  'playlist-read-private',
  'playlist-read-collaborative',
  'user-library-read',
  'user-top-read'
].join(' ')

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ Lipseste SPOTIFY_CLIENT_ID sau SPOTIFY_CLIENT_SECRET din .env')
  process.exit(1)
}

const authUrl =
  'https://accounts.spotify.com/authorize' +
  '?response_type=code' +
  '&client_id=' + CLIENT_ID +
  '&scope=' + encodeURIComponent(SCOPES) +
  '&redirect_uri=' + encodeURIComponent(REDIRECT_URI)

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost:8888')

  if (url.pathname !== '/callback') {
    res.end('Se asteapta callback-ul de la Spotify...')
    return
  }

  const error = url.searchParams.get('error')
  if (error) {
    res.end('Eroare de la Spotify: ' + error)
    console.error('❌ Eroare Spotify:', error)
    server.close()
    return
  }

  const code = url.searchParams.get('code')
  if (!code) {
    res.end('Lipseste codul de autorizare.')
    server.close()
    return
  }

  try {
    const basic = Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64')
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + basic,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI
      })
    })

    const data = await response.json()

    if (!response.ok || !data.refresh_token) {
      const msg = data.error_description || data.error || 'Raspuns invalid de la Spotify'
      res.end('❌ Eroare: ' + msg)
      console.error('❌ Eroare token:', data)
      server.close()
      return
    }

    const msg = [
      '✅ Token obtinut cu succes!',
      '',
      'Adauga asta in fisierul .env:',
      '',
      'SPOTIFY_REFRESH_TOKEN=' + data.refresh_token,
      '',
      'Apoi restarteza Vite.'
    ].join('\n')

    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end(msg)

    console.log('\n' + '='.repeat(60))
    console.log('✅ SUCCES! Pune asta in .env:')
    console.log('='.repeat(60))
    console.log('SPOTIFY_REFRESH_TOKEN=' + data.refresh_token)
    console.log('='.repeat(60) + '\n')
  } catch (err) {
    res.end('Eroare la fetch: ' + err.message)
    console.error('❌ Eroare:', err)
  }

  server.close()
})

server.listen(8888, () => {
  console.log('='.repeat(60))
  console.log('🎵 Spotify Token Generator')
  console.log('='.repeat(60))
  console.log('')
  console.log('IMPORTANT: Asigura-te ca ai adaugat in Spotify Dashboard:')
  console.log('Redirect URI -> http://localhost:8888/callback')
  console.log('')
  console.log('Se deschide browserul automat...')
  console.log('Daca nu se deschide, mergi manual la:')
  console.log(authUrl)
  console.log('')

  // Windows
  exec('start "" "' + authUrl + '"', (err) => {
    if (err) {
      // macOS fallback
      exec('open "' + authUrl + '"', (err2) => {
        if (err2) {
          // Linux fallback
          exec('xdg-open "' + authUrl + '"')
        }
      })
    }
  })
})

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error('❌ Portul 8888 este deja folosit. Opreste procesul care il foloseste si incearca din nou.')
  } else {
    console.error('❌ Eroare server:', err)
  }
  process.exit(1)
})
