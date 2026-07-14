/* global process */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { Buffer } from 'buffer'
import { spawn } from 'child_process'
import crypto from 'crypto'
import dotenv from 'dotenv'
import os from 'os'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ========== UTILITARE GLOBALE ==========
const COLLECTION_LIMIT = 1000
const spotifyUserTokenCache = { token: null, expiresAt: 0 }

function isYouTubeUrl(url) {
  return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/.test(url)
}

function extractSpotifyResource(url) {
  if (!url) return null
  const match = url.match(/spotify\.com\/(track|playlist|album)\/([a-zA-Z0-9]+)/)
  if (!match) return null
  return { type: match[1], id: match[2] }
}

function ensureDownloadsDir() {
  const dir = path.resolve(os.tmpdir(), 'update-maker-downloads')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return dir
}

function safeFilename(str, fallback = 'fisier') {
  return (str || fallback)
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\.+$/, '')
    .trim()
    .slice(0, 200) || fallback
}

function sendSse(res, data) {
  res.write(`data: ${JSON.stringify(data)}\n\n`)
}

function scheduleDownloadCleanup(filePath) {
  setTimeout(() => {
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    } catch (e) {
      console.error('Failed to delete downloaded file:', e)
    }
  }, 3600000)
}

function createZipFromDirectory(dirPath, zipPath) {
  return new Promise((resolve, reject) => {
    const psCommand = `Compress-Archive -Path '${dirPath}\\*' -DestinationPath '${zipPath}' -Force`
    const child = spawn('powershell', ['-Command', psCommand])
    child.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`Crearea arhivei ZIP a eșuat cu codul ${code}`))
    })
    child.on('error', reject)
  })
}

// =====================================================================

// Plugin-uri
const igdbAdminPlugin = () => ({
  name: 'igdb-admin-plugin',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.method === 'POST' && req.headers['content-type'] === 'application/json') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
          if (body) {
            try { req.body = JSON.parse(body); } catch { /* ignore */ }
          }
          next();
        });
      } else {
        next();
      }
    });

    server.middlewares.use('/api/igdb/search', async (req, res) => {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const query = url.searchParams.get('q');

      if (!query) {
        res.statusCode = 400;
        return res.end(JSON.stringify({ error: 'No query provided' }));
      }

      const clientId = process.env.TWITCH_CLIENT_ID;
      const clientSecret = process.env.TWITCH_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        res.statusCode = 500;
        return res.end(JSON.stringify({ error: 'Missing Twitch API Keys in .env' }));
      }

      try {
        const tokenRes = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`, { method: 'POST' });
        const tokenData = await tokenRes.json();

        if (!tokenRes.ok) throw new Error(tokenData.message || 'Failed to get token');

        const igdbRes = await fetch('https://api.igdb.com/v4/games', {
          method: 'POST',
          headers: {
            'Client-ID': clientId,
            'Authorization': `Bearer ${tokenData.access_token}`,
            'Accept': 'application/json',
            'Content-Type': 'text/plain'
          },
          body: `search "${query}"; fields name, cover.url; limit 12;`
        });

        const games = await igdbRes.json();
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(games));
      } catch (err) {
        console.error(err);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: err.message }));
      }
    });

    server.middlewares.use('/api/games/save', (req, res, next) => {
      if (req.method !== 'POST') return next();

      const newGame = req.body;
      if (!newGame || !newGame.id || !newGame.name) {
        res.statusCode = 400;
        return res.end(JSON.stringify({ error: 'Invalid game data' }));
      }

      const filePath = path.resolve(__dirname, 'src/data/myGames.json');
      let currentGames = [];
      try {
        currentGames = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      } catch { /* ignore */ }

      const exists = currentGames.find(g => g.id === newGame.id);
      if (!exists) {
        currentGames.push({
          id: newGame.id,
          name: newGame.name,
          playtimeHours: newGame.playtimeHours || 0,
          imageUrl: newGame.imageUrl
        });
        fs.writeFileSync(filePath, JSON.stringify(currentGames, null, 2));
      }

      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: true }));
    });

    server.middlewares.use('/api/games/delete', (req, res, next) => {
      if (req.method !== 'POST') return next();
      const { id } = req.body;
      const filePath = path.resolve(__dirname, 'src/data/myGames.json');
      try {
        let currentGames = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        currentGames = currentGames.filter(g => g.id !== id);
        fs.writeFileSync(filePath, JSON.stringify(currentGames, null, 2));
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: e.message }));
      }
    });
  }
});

const spotifyPlugin = () => ({
  name: 'spotify-plugin',
  configureServer(server) {
    const getSpotifyAccessToken = async () => {
      const clientId = process.env.SPOTIFY_CLIENT_ID;
      const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
      const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;

      if (!clientId || !clientSecret || !refreshToken) {
        throw new Error('Missing Spotify keys or refresh token in .env');
      }

      const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basic}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }),
      });

      const data = await response.json();
      return data.access_token;
    };

    server.middlewares.use('/api/spotify/login', (req, res, next) => {
      if (req.url !== '/') return next();
      const clientId = process.env.SPOTIFY_CLIENT_ID;
      if (!clientId) {
        res.statusCode = 400;
        return res.end('Lipseste SPOTIFY_CLIENT_ID in .env');
      }
      const redirectUri = 'http://127.0.0.1:5173/callback';
      const scope = 'user-top-read playlist-read-private user-read-private user-follow-read';
      const url = `https://accounts.spotify.com/authorize?response_type=code&client_id=${clientId}&scope=${encodeURIComponent(scope)}&redirect_uri=${encodeURIComponent(redirectUri)}`;
      res.statusCode = 302;
      res.setHeader('Location', url);
      res.end();
    });

    server.middlewares.use('/callback', async (req, res, next) => {
      const url = new URL(req.url, `http://${req.headers.host}`);
      if (url.pathname !== '/') return next();

      const code = url.searchParams.get('code');
      const clientId = process.env.SPOTIFY_CLIENT_ID;
      const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
      const redirectUri = 'http://127.0.0.1:5173/callback';

      if (!code) return res.end('No code provided');

      try {
        const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
        const response = await fetch('https://accounts.spotify.com/api/token', {
          method: 'POST',
          headers: {
            Authorization: `Basic ${basic}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri,
          }),
        });

        const data = await response.json();
        if (data.refresh_token) {
          const envPath = path.resolve(__dirname, '.env');
          let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';
          if (envContent.includes('SPOTIFY_REFRESH_TOKEN=')) {
            envContent = envContent.replace(/SPOTIFY_REFRESH_TOKEN=.*/, `SPOTIFY_REFRESH_TOKEN=${data.refresh_token}`);
          } else {
            envContent += `\nSPOTIFY_REFRESH_TOKEN=${data.refresh_token}\n`;
          }
          fs.writeFileSync(envPath, envContent);
          process.env.SPOTIFY_REFRESH_TOKEN = data.refresh_token;
        }

        if (data.access_token) {
          spotifyUserTokenCache.token = data.access_token;
          spotifyUserTokenCache.expiresAt = Date.now() + (data.expires_in || 3600) * 1000;
        }

        res.statusCode = 302;
        res.setHeader('Location', '/');
        res.end();
      } catch (err) {
        console.error(err);
        res.statusCode = 500;
        res.end('Error during Spotify auth');
      }
    });

    server.middlewares.use('/api/spotify/data', async (req, res, next) => {
      if (req.url !== '/') return next();

      try {
        const token = await getSpotifyAccessToken();
        const authHeaders = { Authorization: `Bearer ${token}` };

        const fetchSpotifyJson = async url => {
          const response = await fetch(url, { headers: authHeaders });

          let data;
          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            data = await response.json();
          } else {
            const text = await response.text();
            try { data = JSON.parse(text); } catch { data = { error: { message: text || 'Spotify request failed' } }; }
          }

          if (!response.ok) {
            const spotifyMessage = data?.error?.message || data?.error || 'Spotify request failed';
            const error = new Error(spotifyMessage);
            error.status = response.status;
            throw error;
          }

          return data;
        };

        const fetchAllPlaylists = async () => {
          const items = [];
          let nextUrl = 'https://api.spotify.com/v1/me/playlists?limit=50&fields=items(id,name,images,tracks,external_urls,public,owner),next';

          while (nextUrl) {
            const page = await fetchSpotifyJson(nextUrl);
            items.push(...(page.items || []));
            nextUrl = page.next;
          }

          return items;
        };

        const fetchFollowedArtists = async () => {
          const items = [];
          let nextUrl = 'https://api.spotify.com/v1/me/following?type=artist&limit=50';

          while (nextUrl) {
            const page = await fetchSpotifyJson(nextUrl);
            const artistPage = page.artists || {};
            items.push(...(artistPage.items || []));
            nextUrl = artistPage.next;
          }

          return items;
        };

        const spotifyWarnings = {};

        let profile = null;
        try {
          profile = await fetchSpotifyJson('https://api.spotify.com/v1/me');
        } catch (err) {
          spotifyWarnings.profile = err.message;
        }

        let topArtistsItems = [];
        try {
          const topArtists = await fetchSpotifyJson('https://api.spotify.com/v1/me/top/artists?time_range=short_term&limit=50');
          topArtistsItems = topArtists.items || [];
        } catch (err) {
          spotifyWarnings.topArtists = err.status === 403 || (err.message && err.message.toLowerCase().includes('premium'))
            ? 'Top artists necesita un cont Spotify Premium.'
            : err.message;
        }

        let playlists = [];
        try {
          playlists = await fetchAllPlaylists();
        } catch (err) {
          spotifyWarnings.playlists = err.status === 403 || (err.message && err.message.toLowerCase().includes('premium'))
            ? 'Playlists necesita un cont Spotify Premium.'
            : err.message;
        }

        let followedArtists = [];
        try {
          followedArtists = await fetchFollowedArtists();
        } catch (err) {
          spotifyWarnings.followedArtists = err.status === 403
            ? 'Reconecteaza Spotify pentru a permite accesul la artistii urmariti.'
            : err.message;
        }

        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          profile,
          topArtists: topArtistsItems,
          playlists,
          followedArtists,
          spotifyWarnings
        }));
      } catch (err) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: err.message }));
      }
    });

    server.middlewares.use('/api/spotify/search', async (req, res, next) => {
      const urlObj = new URL(req.url, `http://${req.headers.host}`);
      if (urlObj.pathname !== '/') return next();

      const query = urlObj.searchParams.get('q');
      if (!query) {
        res.statusCode = 400;
        return res.end(JSON.stringify({ error: 'No query provided' }));
      }

      try {
        const token = await getSpotifyAccessToken();
        const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();

        if (!response.ok) throw new Error(data.error?.message || 'Search failed');

        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(data.artists?.items || []));
      } catch (err) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: err.message }));
      }
    });
  }
});

const ytdlpPlugin = () => ({
  name: 'ytdlp-plugin',
  configureServer(server) {
    server.middlewares.use('/api/ytdl/info', async (req, res, next) => {
      const urlObj = new URL(req.url, `http://${req.headers.host}`);
      if (urlObj.pathname !== '/') return next();

      const videoUrl = urlObj.searchParams.get('url');
      if (!videoUrl) {
        res.statusCode = 400;
        return res.end(JSON.stringify({ error: 'No URL provided' }));
      }

      const binPath = path.resolve(__dirname, 'bin/yt-dlp.exe');

      if (!fs.existsSync(binPath)) {
        res.statusCode = 500;
        return res.end(JSON.stringify({ error: 'yt-dlp binary not found. Please wait for setup to finish.' }));
      }

      const child = spawn(binPath, [
        '--dump-json',
        '--no-playlist',
        '--playlist-items', '1',
        videoUrl
      ]);
      let dataStr = '';
      let errStr = '';
      child.stdout.on('data', chunk => dataStr += chunk);
      child.stderr && child.stderr.on('data', chunk => errStr += chunk);

      const killTimer = setTimeout(() => {
        try { child.kill(); } catch { /* ignore */ }
        if (!res.headersSent) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'Request timed out. Try again or check the URL.' }));
        }
      }, 30000);

      child.on('close', code => {
        clearTimeout(killTimer);
        if (res.headersSent) return;
        if (code !== 0) {
          res.statusCode = 500;
          return res.end(JSON.stringify({ error: 'yt-dlp failed to fetch info. Check the URL.' }));
        }
        try {
          const info = JSON.parse(dataStr);

          const availableHeights = new Set();
          (info.formats || []).forEach(f => {
            if (f.height && f.vcodec && f.vcodec !== 'none') {
              availableHeights.add(f.height);
            }
          });

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            title: info.title,
            thumbnail: info.thumbnail,
            duration: info.duration,
            uploader: info.uploader || info.channel || null,
            viewCount: info.view_count || null,
            uploadDate: info.upload_date || null,
            availableHeights: Array.from(availableHeights).sort((a, b) => b - a),
          }));
        } catch (err) {
          console.error(err);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'Failed to parse yt-dlp output' }));
        }
      });
    });

    server.middlewares.use('/api/ytdl/download', (req, res, next) => {
      const urlObj = new URL(req.url, `http://${req.headers.host}`);
      if (urlObj.pathname !== '/') return next();

      const videoUrl = urlObj.searchParams.get('url');
      const format = urlObj.searchParams.get('format') || 'video:bestvideo[ext=mp4]+bestaudio[ext=m4a]/best';
      const startTime = urlObj.searchParams.get('start');
      const endTime = urlObj.searchParams.get('end');

      if (!videoUrl) {
        res.statusCode = 400;
        return res.end('No URL');
      }

      const binPath = path.resolve(__dirname, 'bin/yt-dlp.exe');
      const ffmpegPath = path.resolve(__dirname, 'bin');
      const downloadsDir = path.resolve(os.tmpdir(), 'update-maker-downloads');
      if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir, { recursive: true });

      let args;

      if (format.startsWith('audio:')) {
        const parts = format.split(':');
        const audioFmt = parts[1] || 'mp3';
        const audioQuality = parts[2] || '0';

        if (audioFmt === 'wav') {
          args = [
            '-x', '--audio-format', 'wav',
            '-o', `${downloadsDir}/%(title)s.%(ext)s`,
            '--ffmpeg-location', ffmpegPath,
            videoUrl
          ];
        } else if (audioFmt === 'vorbis') {
          args = [
            '-x', '--audio-format', 'vorbis', '--audio-quality', audioQuality,
            '-o', `${downloadsDir}/%(title)s.%(ext)s`,
            '--ffmpeg-location', ffmpegPath,
            videoUrl
          ];
        } else {
          args = [
            '-x', '--audio-format', 'mp3', '--audio-quality', audioQuality,
            '-o', `${downloadsDir}/%(title)s.%(ext)s`,
            '--ffmpeg-location', ffmpegPath,
            videoUrl
          ];
        }
      } else if (format.startsWith('video:')) {
        const formatStr = format.substring(6);
        args = [
          '-f', formatStr,
          '--merge-output-format', 'mp4',
          '-o', `${downloadsDir}/%(title)s.%(ext)s`,
          '--ffmpeg-location', ffmpegPath,
          videoUrl
        ];
      } else {
        if (format === 'mp3') {
          args = ['-x', '--audio-format', 'mp3', '--audio-quality', '0', '-o', `${downloadsDir}/%(title)s.%(ext)s`, '--ffmpeg-location', ffmpegPath, videoUrl];
        } else {
          args = ['-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best', '--merge-output-format', 'mp4', '-o', `${downloadsDir}/%(title)s.%(ext)s`, '--ffmpeg-location', ffmpegPath, videoUrl];
        }
      }

      if (startTime && endTime) {
        args.splice(args.length - 1, 0, '--download-sections', `*${startTime}-${endTime}`);
      }

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      args.push('--no-playlist', '--newline');

      const child = spawn(binPath, args);
      let finalFilename = '';

      const handleOutput = (chunk) => {
        const str = chunk.toString();

        const destMatch = str.match(/Destination:\s*(.*)/);
        if (destMatch && destMatch[1]) {
          finalFilename = path.basename(destMatch[1].trim());
        }

        const alreadyMatch = str.match(/\]\s+(.*?)\s*has already been downloaded/);
        if (alreadyMatch && alreadyMatch[1]) {
          finalFilename = path.basename(alreadyMatch[1].trim());
        }

        const mergeMatch = str.match(/Merging formats into "(.*)"/);
        if (mergeMatch && mergeMatch[1]) {
          finalFilename = path.basename(mergeMatch[1].trim());
        }

        const progressMatch = str.match(/\[download\]\s+([\d.]+)%/);
        let progress = 0;
        if (progressMatch) progress = parseFloat(progressMatch[1]);

        res.write(`data: ${JSON.stringify({ raw: str, progress, filename: finalFilename })}\n\n`);
      };

      child.stdout.on('data', handleOutput);
      child.stderr && child.stderr.on('data', handleOutput);

      child.on('close', code => {
        res.write(`data: ${JSON.stringify({ done: true, code, finalFilename })}\n\n`);
        res.end();
      });
    });

    server.middlewares.use('/api/mp3/cover', async (req, res, next) => {
      const urlObj = new URL(req.url, `http://${req.headers.host}`);
      if (urlObj.pathname !== '/') return next();
      if (req.method !== 'POST') { res.statusCode = 405; return res.end('Method Not Allowed'); }

      try {
        const { parseBuffer } = await import('music-metadata');

        const chunks = [];
        req.on('data', chunk => chunks.push(chunk));
        await new Promise((resolve, reject) => {
          req.on('end', resolve);
          req.on('error', reject);
        });
        const buffer = Buffer.concat(chunks);
        const mimeType = req.headers['content-type'] || 'audio/mpeg';

        const metadata = await parseBuffer(buffer, { mimeType }, { skipCovers: false });
        const picture = metadata.common.picture?.[0];

        if (picture) {
          const b64 = picture.data.toString('base64');
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({
            coverDataUrl: `data:${picture.format};base64,${b64}`,
            title: metadata.common.title || null,
            artist: metadata.common.artist || null,
            album: metadata.common.album || null,
          }));
        } else {
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ coverDataUrl: null, title: metadata.common.title || null, artist: metadata.common.artist || null }));
        }
      } catch (err) {
        console.error('Cover extraction failed:', err);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: err.message }));
      }
    });

    server.middlewares.use('/api/ytdl/cut-local', (req, res, next) => {
      const urlObj = new URL(req.url, `http://${req.headers.host}`);
      if (urlObj.pathname !== '/') return next();

      if (req.method !== 'POST') {
        res.statusCode = 405;
        return res.end('Method Not Allowed');
      }

      const startTime = urlObj.searchParams.get('start');
      const endTime = urlObj.searchParams.get('end');
      const ext = urlObj.searchParams.get('ext') || 'mp3';
      const fadeIn = parseFloat(urlObj.searchParams.get('fadeIn') || '0');
      const fadeOut = parseFloat(urlObj.searchParams.get('fadeOut') || '0');
      const volume = parseFloat(urlObj.searchParams.get('volume') || '1');
      const sourceFile = urlObj.searchParams.get('sourceFile');

      if (!startTime || !endTime) {
        res.statusCode = 400;
        return res.end(JSON.stringify({ error: 'Missing start or end time' }));
      }

      const downloadsDir = path.resolve(os.tmpdir(), 'update-maker-downloads');
      if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir, { recursive: true });

      const tempId = crypto.randomUUID();
      const outputFilename = `cut_${tempId}.${ext}`;
      const outputFile = path.resolve(downloadsDir, outputFilename);

      const runFfmpeg = (inputFilePath, isTemp) => {
        const ffmpegPath = path.resolve(__dirname, 'bin/ffmpeg.exe');
        if (!fs.existsSync(ffmpegPath)) {
          res.statusCode = 500;
          return res.end(JSON.stringify({ error: 'ffmpeg binary not found.' }));
        }

        let finalArgs;
        const hasFades = fadeIn > 0 || fadeOut > 0;
        const hasVolume = volume !== 1;
        const requiresAudioFilter = hasFades || hasVolume;
        const selDuration = parseFloat(endTime) - parseFloat(startTime);

        if (requiresAudioFilter) {
          const afilters = ['asetpts=PTS-STARTPTS'];
          if (hasVolume) afilters.push(`volume=${volume}`);
          if (fadeIn > 0) afilters.push(`afade=t=in:st=0:d=${fadeIn}`);
          if (fadeOut > 0) afilters.push(`afade=t=out:st=${(selDuration - fadeOut).toFixed(3)}:d=${fadeOut}`);

          finalArgs = [
            '-ss', startTime.toString(),
            '-i', inputFilePath,
            '-t', selDuration.toFixed(3),
            '-af', afilters.join(','),
            '-c:v', 'copy',
            '-c:a', 'libmp3lame',
            '-q:a', '2',
            '-y',
            outputFile
          ];
        } else {
          finalArgs = [
            '-ss', startTime.toString(),
            '-i', inputFilePath,
            '-t', selDuration.toFixed(3),
            '-c', 'copy',
            '-y',
            outputFile
          ];
        }

        const child = spawn(ffmpegPath, finalArgs);

        child.on('close', code => {
          if (isTemp) {
            try {
              if (fs.existsSync(inputFilePath)) fs.unlinkSync(inputFilePath);
            } catch { /* ignore */ }
          }

          if (code !== 0) {
            res.statusCode = 500;
            return res.end(JSON.stringify({ error: 'ffmpeg failed to cut file' }));
          }

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ finalFilename: outputFilename }));
        });
      };

      if (sourceFile) {
        const fullSourcePath = path.resolve(downloadsDir, sourceFile);
        if (!fs.existsSync(fullSourcePath)) {
          res.statusCode = 404;
          return res.end(JSON.stringify({ error: 'Source file not found' }));
        }
        runFfmpeg(fullSourcePath, false);
      } else {
        const inputTempFile = path.resolve(downloadsDir, `temp_input_${tempId}.${ext}`);
        const writeStream = fs.createWriteStream(inputTempFile);
        req.pipe(writeStream);
        req.on('end', () => runFfmpeg(inputTempFile, true));
        req.on('error', () => {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'Upload failed' }));
        });
      }
    });
  }
});

const fileDownloadPlugin = () => ({
  name: 'file-download-plugin',
  configureServer(server) {
    server.middlewares.use('/downloads', (req, res, next) => {
      const safeFile = path.basename(req.url.split('?')[0]);
      if (!safeFile) return next();
      const filePath = path.resolve(os.tmpdir(), 'update-maker-downloads', safeFile);
      if (!fs.existsSync(filePath)) {
        res.statusCode = 404;
        return res.end('File not found');
      }
      const ext = path.extname(safeFile).toLowerCase();
      const mimeMap = { '.mp3': 'audio/mpeg', '.mp4': 'video/mp4', '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.m4a': 'audio/mp4', '.webm': 'audio/webm' };
      const mime = mimeMap[ext] || 'application/octet-stream';
      const stat = fs.statSync(filePath);
      res.writeHead(200, { 'Content-Type': mime, 'Content-Length': stat.size, 'Accept-Ranges': 'bytes' });
      fs.createReadStream(filePath).pipe(res);
    });

    server.middlewares.use('/api/download-file', (req, res, next) => {
      const urlObj = new URL(req.url, `http://${req.headers.host}`);
      if (urlObj.pathname !== '/') return next();

      const file = urlObj.searchParams.get('file');
      if (!file) {
        res.statusCode = 400;
        return res.end('No file specified');
      }

      const safeFile = path.basename(file);
      const filePath = path.resolve(os.tmpdir(), 'update-maker-downloads', safeFile);

      if (!fs.existsSync(filePath)) {
        res.statusCode = 404;
        return res.end('File not found');
      }

      const outNameRaw = urlObj.searchParams.get('outName');
      let downloadFilename = safeFile;
      if (outNameRaw && outNameRaw.trim()) {
        const cleanName = outNameRaw.trim().replace(/[^a-zA-Z0-9_ -]/g, '');
        const ext = path.extname(safeFile) || '.mp3';
        downloadFilename = cleanName.endsWith(ext) ? cleanName : `${cleanName}${ext}`;
      }

      const stat = fs.statSync(filePath);
      res.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'Content-Length': stat.size,
        'Content-Disposition': `attachment; filename="${downloadFilename}"`
      });

      const readStream = fs.createReadStream(filePath);
      readStream.pipe(res);

      readStream.on('end', () => {
        setTimeout(() => {
          try {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          } catch (e) {
            console.error('Failed to delete downloaded file:', e);
          }
        }, 3600000);
      });

      readStream.on('error', (err) => {
        console.error('Error reading file:', err);
        res.end();
      });
    });
  }
});

const spotifyDownloaderPlugin = () => ({
  name: 'spotify-downloader-plugin',
  configureServer(server) {
    const getClientCredentialsToken = async () => {
      const clientId = process.env.SPOTIFY_CLIENT_ID;
      const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
      if (!clientId || !clientSecret) throw new Error('Missing Spotify keys in .env');

      const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basic}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ grant_type: 'client_credentials' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error_description || 'Failed to get Spotify token');
      return data.access_token;
    };

    server.middlewares.use('/api/spotify/track-info', async (req, res, next) => {
      const urlObj = new URL(req.url, `http://${req.headers.host}`);
      if (urlObj.pathname !== '/') return next();

      const spotifyUrl = urlObj.searchParams.get('url');
      if (!spotifyUrl) {
        res.statusCode = 400;
        return res.end(JSON.stringify({ error: 'No URL provided' }));
      }

      const trackIdMatch = spotifyUrl.match(/track\/([a-zA-Z0-9]+)/);
      if (!trackIdMatch) {
        res.statusCode = 400;
        return res.end(JSON.stringify({ error: 'Invalid Spotify track URL' }));
      }
      const trackId = trackIdMatch[1];

      try {
        const token = await getClientCredentialsToken();
        const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const track = await response.json();

        if (!response.ok) throw new Error(track.error?.message || 'Failed to fetch track info');

        const title = track.name;
        const artist = track.artists.map(a => a.name).join(', ');
        const album = track.album.name;
        const coverUrl = track.album.images[0]?.url || '';
        const duration_ms = track.duration_ms;

        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ title, artist, album, coverUrl, duration_ms, trackId }));
      } catch (err) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: err.message }));
      }
    });

    server.middlewares.use('/api/spotify/download', async (req, res, next) => {
      const urlObj = new URL(req.url, `http://${req.headers.host}`);
      if (urlObj.pathname !== '/') return next();

      const title = urlObj.searchParams.get('title');
      const artist = urlObj.searchParams.get('artist');
      const album = urlObj.searchParams.get('album');
      const coverUrl = urlObj.searchParams.get('coverUrl');

      if (!title || !artist) {
        res.statusCode = 400;
        return res.end('Missing metadata parameters');
      }

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const downloadsDir = path.resolve(os.tmpdir(), 'update-maker-downloads');
      if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir, { recursive: true });

      const safeName = `${artist} - ${title}`.replace(/[^a-zA-Z0-9 _-]/g, '').trim().slice(0, 100);
      const searchStr = `ytsearch1:${artist} ${title} audio`;

      const binPath = path.resolve(__dirname, 'bin/yt-dlp.exe');
      const ffmpegPath = path.resolve(__dirname, 'bin/ffmpeg.exe');

      const tempId = crypto.randomUUID();
      const rawAudioPath = path.resolve(downloadsDir, `temp_${tempId}.mp3`);
      const coverPath = path.resolve(downloadsDir, `cover_${tempId}.jpg`);
      const finalOutputFile = path.resolve(downloadsDir, `${safeName}.mp3`);

      try {
        if (coverUrl) {
          res.write(`data: ${JSON.stringify({ progress: 5, raw: 'Downloading cover art...\n' })}\n\n`);
          const coverRes = await fetch(coverUrl);
          const buffer = await coverRes.arrayBuffer();
          fs.writeFileSync(coverPath, Buffer.from(buffer));
        }

        const args = [
          '-x', '--audio-format', 'mp3', '--audio-quality', '0',
          '--ffmpeg-location', ffmpegPath,
          '-o', rawAudioPath,
          searchStr
        ];

        const ytChild = spawn(binPath, args);

        ytChild.stdout.on('data', chunk => {
          const str = chunk.toString();
          const progressMatch = str.match(/\[download\]\s+([\d.]+)%/);
          let progress = 5;
          if (progressMatch) progress = 5 + (parseFloat(progressMatch[1]) * 0.8);
          res.write(`data: ${JSON.stringify({ raw: str, progress })}\n\n`);
        });

        ytChild.stderr.on('data', chunk => {
          const str = chunk.toString();
          const progressMatch = str.match(/\[download\]\s+([\d.]+)%/);
          if (progressMatch) {
            const progress = 5 + (parseFloat(progressMatch[1]) * 0.8);
            res.write(`data: ${JSON.stringify({ raw: str, progress })}\n\n`);
          }
        });

        await new Promise((resolve, reject) => {
          ytChild.on('close', code => {
            if (code !== 0) reject(new Error('yt-dlp failed to download audio'));
            else resolve();
          });
        });

        if (!fs.existsSync(rawAudioPath)) {
          throw new Error('Downloaded audio file not found');
        }

        res.write(`data: ${JSON.stringify({ progress: 90, raw: 'Embedding metadata...\n' })}\n\n`);

        const ffmpegArgs = ['-y', '-i', rawAudioPath];
        if (coverUrl && fs.existsSync(coverPath)) {
          ffmpegArgs.push('-i', coverPath, '-map', '0:0', '-map', '1:0', '-c', 'copy', '-id3v2_version', '3');
          ffmpegArgs.push('-metadata:s:v', 'title=Album cover', '-metadata:s:v', 'comment=Cover (front)');
        } else {
          ffmpegArgs.push('-c', 'copy');
        }

        ffmpegArgs.push('-metadata', `title=${title}`);
        ffmpegArgs.push('-metadata', `artist=${artist}`);
        if (album) ffmpegArgs.push('-metadata', `album=${album}`);

        ffmpegArgs.push(finalOutputFile);

        const ffChild = spawn(ffmpegPath, ffmpegArgs);

        await new Promise((resolve, reject) => {
          ffChild.on('close', code => {
            if (code !== 0) reject(new Error('ffmpeg metadata embedding failed'));
            else resolve();
          });
        });

        try { if (fs.existsSync(rawAudioPath)) fs.unlinkSync(rawAudioPath); } catch (e) { console.error('Audio cleanup error:', e); }
        try { if (fs.existsSync(coverPath)) fs.unlinkSync(coverPath); } catch (e) { console.error('Cover cleanup error:', e); }

        res.write(`data: ${JSON.stringify({ done: true, progress: 100, finalFilename: `${safeName}.mp3` })}\n\n`);
        res.end();

      } catch (error) {
        res.write(`data: ${JSON.stringify({ done: true, error: error.message })}\n\n`);
        res.end();
        try { if (fs.existsSync(rawAudioPath)) fs.unlinkSync(rawAudioPath); } catch (e) { console.error('Audio cleanup error:', e); }
        try { if (fs.existsSync(coverPath)) fs.unlinkSync(coverPath); } catch (e) { console.error('Cover cleanup error:', e); }
      }
    });
  }
});

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

    // ======== FUNCȚIA GET SPOTIFY TOKEN - FOLOSEȘTE REFRESH TOKEN CU SCOPURI ========
    const getSpotifyToken = async () => {
      console.log('\n=== GET SPOTIFY TOKEN ===')
      console.log('Cache token:', spotifyUserTokenCache.token ? '✅ existent' : '❌ lipsă')
      console.log('Cache expiră la:', new Date(spotifyUserTokenCache.expiresAt).toLocaleString())

      if (spotifyUserTokenCache.token && Date.now() < spotifyUserTokenCache.expiresAt - 300_000) {
        console.log('Folosesc token din cache')
        return spotifyUserTokenCache.token
      }

      const clientId = process.env.SPOTIFY_CLIENT_ID
      const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
      const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN

      console.log('Client ID:', clientId ? '✅ SETAT' : '❌ LIPSĂ')
      console.log('Client Secret:', clientSecret ? '✅ SETAT' : '❌ LIPSĂ')
      console.log('Refresh Token:', refreshToken ? '✅ SETAT' : '❌ LIPSĂ')

      if (!clientId || !clientSecret) {
        throw new Error('Lipsesc cheile Spotify din fișierul .env.')
      }

      if (!refreshToken) {
        throw new Error(
          'Lipsește SPOTIFY_REFRESH_TOKEN. Conectează-te prin butonul "Conectează-te" pentru a-l genera.'
        )
      }

      const basic = Buffer.from(clientId + ':' + clientSecret).toString('base64')
      // Folosește refresh_token pentru a obține un token cu scopurile utilizatorului
      const body = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })

      try {
        console.log('Trimit request către Spotify token endpoint (refresh_token)...')
        const response = await fetch('https://accounts.spotify.com/api/token', {
          method: 'POST',
          headers: {
            Authorization: 'Basic ' + basic,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body
        })
        const data = await response.json()
        console.log('Răspuns token status:', response.status)
        if (!response.ok) {
          console.error('Eroare token Spotify:', data)
          throw new Error(data.error_description || 'Nu am putut obține acces la Spotify.')
        }

        spotifyUserTokenCache.token = data.access_token
        spotifyUserTokenCache.expiresAt = Date.now() + (data.expires_in || 3600) * 1000
        console.log('✅ Token obținut cu succes, expiră la:', new Date(spotifyUserTokenCache.expiresAt).toLocaleString())
        return data.access_token
      } catch (err) {
        console.error('❌ Eroare în getSpotifyToken:', err)
        throw err
      }
    }

    const spotifyRequest = async (token, endpoint) => {
      const url = endpoint.startsWith('http') ? endpoint : 'https://api.spotify.com/v1' + endpoint
      console.log('Spotify request către:', url)
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
          .map(item => {
            // Handle new /items endpoint structure: item contains the track data
            const track = item?.item || item?.track || item
            if (!track) return null
            if (track.type === 'episode') return null
            if (track.is_local) return null
            return track
          })
          .filter(Boolean)
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
        const tracks = await fetchSpotifyTracks(token, '/playlists/' + resource.id + '/items?limit=50')
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

    server.middlewares.use('/api/spotify/collection-info', async (req, res, next) => {
      const urlObj = new URL(req.url, 'http://' + req.headers.host)
      if (urlObj.pathname !== '/') return next()

      const spotifyUrl = urlObj.searchParams.get('url')
      console.log('\n=== SPOTIFY COLLECTION INFO ===')
      console.log('URL primit:', spotifyUrl)

      const resource = extractSpotifyResource(spotifyUrl)
      console.log('Resource extras:', resource)

      if (!resource) {
        res.statusCode = 400
        return res.end(JSON.stringify({
          error: 'URL invalid',
          received: spotifyUrl
        }))
      }

      try {
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
          stack: error.stack,
          details: error.cause || 'Fără detalii suplimentare'
        }))
      }
    })

    server.middlewares.use('/api/spotify/top-tracks', async (req, res, next) => {
      const urlObj = new URL(req.url, 'http://' + req.headers.host)
      if (urlObj.pathname !== '/') return next()

      const timeRange = urlObj.searchParams.get('time_range') || 'medium_term'
      const limit = parseInt(urlObj.searchParams.get('limit')) || 50

      console.log('\n=== SPOTIFY TOP TRACKS ===')
      console.log('Time range:', timeRange, 'Limit:', limit)

      try {
        const token = await getSpotifyToken()
        const endpoint = `/me/top/tracks?time_range=${timeRange}&limit=${limit}`
        const data = await spotifyRequest(token, endpoint)

        const tracks = data.items?.map(item => spotifyTrack(item)) || []
        console.log('Top tracks obținute:', tracks.length)

        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({
          tracks,
          total: data.total
        }))
      } catch (error) {
        console.error('=== EROARE SPOTIFY TOP TRACKS ===')
        console.error(error)
        res.statusCode = 500
        res.end(JSON.stringify({
          error: error.message || 'Nu am putut încărca top tracks.',
          details: error.cause || 'Fără detalii suplimentare'
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

export default defineConfig({
  plugins: [
    react(),
    igdbAdminPlugin(),
    spotifyPlugin(),
    ytdlpPlugin(),
    fileDownloadPlugin(),
    spotifyDownloaderPlugin(),
    collectionDownloaderPlugin()
  ],
  server: {
    host: true,
  }
})