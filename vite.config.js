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

const igdbAdminPlugin = () => ({
  name: 'igdb-admin-plugin',
  configureServer(server) {
    // Middleware pentru a parsa JSON body
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
      const scope = 'user-top-read playlist-read-private user-read-private';
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

        const profileRes = await fetch('https://api.spotify.com/v1/me', { headers: { Authorization: `Bearer ${token}` } });
        const profile = await profileRes.json();

        const artistsRes = await fetch('https://api.spotify.com/v1/me/top/artists?limit=6', { headers: { Authorization: `Bearer ${token}` } });
        const topArtists = await artistsRes.json();

        const playlistsRes = await fetch('https://api.spotify.com/v1/me/playlists?limit=4', { headers: { Authorization: `Bearer ${token}` } });
        const playlists = await playlistsRes.json();

        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          profile,
          topArtists: topArtists.items,
          playlists: playlists.items
        }));
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
        return res.end(JSON.stringify({error: 'No URL provided'}));
      }

      const binPath = path.resolve(__dirname, 'bin/yt-dlp.exe');
      
      if (!fs.existsSync(binPath)) {
        res.statusCode = 500;
        return res.end(JSON.stringify({error: 'yt-dlp binary not found. Please wait for setup to finish.'}));
      }

      const child = spawn(binPath, ['--dump-json', videoUrl]);
      let dataStr = '';
      let errStr = '';
      child.stdout.on('data', chunk => dataStr += chunk);
      child.stderr && child.stderr.on('data', chunk => errStr += chunk);

      child.on('close', code => {
        if (code !== 0) {
          res.statusCode = 500;
          return res.end(JSON.stringify({error: 'yt-dlp failed to fetch info. Check the URL.'}));
        }
        try {
          const info = JSON.parse(dataStr);

          // Extract unique available heights (only from video formats)
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
          res.end(JSON.stringify({error: 'Failed to parse yt-dlp output'}));
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
        // Format: "audio:<audioFmt>:<quality>"  e.g. "audio:mp3:0", "audio:wav:0"
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
          // mp3 (default)
          args = [
            '-x', '--audio-format', 'mp3', '--audio-quality', audioQuality,
            '-o', `${downloadsDir}/%(title)s.%(ext)s`,
            '--ffmpeg-location', ffmpegPath,
            videoUrl
          ];
        }
      } else if (format.startsWith('video:')) {
        // Format: "video:<yt-dlp format string>"
        const formatStr = format.substring(6); // strip "video:"
        args = [
          '-f', formatStr,
          '--merge-output-format', 'mp4',
          '-o', `${downloadsDir}/%(title)s.%(ext)s`,
          '--ffmpeg-location', ffmpegPath,
          videoUrl
        ];
      } else {
        // Legacy fallback
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

      const child = spawn(binPath, args);
      let finalFilename = '';

      child.stdout.on('data', chunk => {
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
      });

      child.stderr && child.stderr.on('data', () => {
        // silently consume stderr so it doesn't block
      });

      child.on('close', code => {
        res.write(`data: ${JSON.stringify({ done: true, code, finalFilename })}\n\n`);
        res.end();
      });
    });

    // Cover art extraction via music-metadata (Node.js side — reliable for all formats)
    server.middlewares.use('/api/mp3/cover', async (req, res, next) => {
      const urlObj = new URL(req.url, `http://${req.headers.host}`);
      if (urlObj.pathname !== '/') return next();
      if (req.method !== 'POST') { res.statusCode = 405; return res.end('Method Not Allowed'); }

      try {
        const { parseBuffer } = await import('music-metadata');

        // Collect uploaded file bytes
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
        return res.end(JSON.stringify({error: 'Missing start or end time'}));
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
          return res.end(JSON.stringify({error: 'ffmpeg binary not found.'}));
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
            '-c:v', 'copy', // Keep cover art if present
            '-c:a', 'libmp3lame',
            '-q:a', '2',
            '-y',
            outputFile
          ];
        } else {
          // Lossless copy
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
            return res.end(JSON.stringify({error: 'ffmpeg failed to cut file'}));
          }

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ finalFilename: outputFilename }));
        });
      };

      if (sourceFile) {
        const fullSourcePath = path.resolve(downloadsDir, sourceFile);
        if (!fs.existsSync(fullSourcePath)) {
            res.statusCode = 404;
            return res.end(JSON.stringify({error: 'Source file not found'}));
        }
        runFfmpeg(fullSourcePath, false);
      } else {
        const inputTempFile = path.resolve(downloadsDir, `temp_input_${tempId}.${ext}`);
        const writeStream = fs.createWriteStream(inputTempFile);
        req.pipe(writeStream);
        req.on('end', () => runFfmpeg(inputTempFile, true));
        req.on('error', () => {
          res.statusCode = 500;
          res.end(JSON.stringify({error: 'Upload failed'}));
        });
      }
    });
  }
});

const fileDownloadPlugin = () => ({
  name: 'file-download-plugin',
  configureServer(server) {
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

      // Handle custom output name
      const outNameRaw = urlObj.searchParams.get('outName');
      let downloadFilename = safeFile;
      if (outNameRaw && outNameRaw.trim()) {
        const cleanName = outNameRaw.trim().replace(/[^a-zA-Z0-9_ -]/g, '');
        const ext = path.extname(safeFile) || '.mp3';
        downloadFilename = cleanName.endsWith(ext) ? cleanName : `${cleanName}${ext}`;
      }

      // Read file and send it as a stream
      const stat = fs.statSync(filePath);
      res.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'Content-Length': stat.size,
        'Content-Disposition': `attachment; filename="${downloadFilename}"`
      });

      const readStream = fs.createReadStream(filePath);
      readStream.pipe(res);

      readStream.on('end', () => {
        // Auto-cleanup: delete file from server after 1 hour (3600000 ms)
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
        
        ytChild.stderr.on('data', () => {});

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

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), igdbAdminPlugin(), spotifyPlugin(), ytdlpPlugin(), fileDownloadPlugin(), spotifyDownloaderPlugin()],
  server: {
    host: true, // This fixes the 127.0.0.1 refused connection by binding to all IPs
  }
});
