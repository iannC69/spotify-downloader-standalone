/* global process */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

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
        return res.end(JSON.stringify({error: 'No query provided'}));
      }

      const clientId = process.env.TWITCH_CLIENT_ID;
      const clientSecret = process.env.TWITCH_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        res.statusCode = 500;
        return res.end(JSON.stringify({error: 'Missing Twitch API Keys in .env'}));
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
        res.end(JSON.stringify({error: err.message}));
      }
    });

    server.middlewares.use('/api/games/save', (req, res, next) => {
      if (req.method !== 'POST') return next();
      
      const newGame = req.body;
      if (!newGame || !newGame.id || !newGame.name) {
        res.statusCode = 400;
        return res.end(JSON.stringify({error: 'Invalid game data'}));
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
      res.end(JSON.stringify({success: true}));
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
        res.end(JSON.stringify({success: true}));
      } catch(e) {
        res.statusCode = 500;
        res.end(JSON.stringify({error: e.message}));
      }
    });
  }
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), igdbAdminPlugin()],
})
