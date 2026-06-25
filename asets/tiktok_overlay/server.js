const express = require('express');
const cors = require('cors');
const { GameDig } = require('gamedig');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const CONFIG_PATH = path.join(__dirname, 'overlay-configs.json');
const TUNNEL_URL_PATH = path.join(__dirname, 'tunnel-url.txt');
const DEFAULT_SERVER = {
    title: 'CS2.WILDFIRE.RO',
    type: 'csgo',
    host: '5.135.142.4',
    port: 27015
};
const DEFAULT_OVERLAY_CONFIG = {
    ...DEFAULT_SERVER,
    accent: '#ff8800',
    shadow: '#000000',
    pollMs: 5000,
    position: 'top-left',
    scale: '1'
};

app.use(cors());
app.use(express.json({ limit: '16kb' }));
app.use(express.static(path.join(__dirname, 'public')));

const statusCache = new Map();
const CACHE_DURATION_MS = 5000; // 5 seconds cache
const overlayConfigs = loadOverlayConfigs();

function loadOverlayConfigs() {
    try {
        if (!fs.existsSync(CONFIG_PATH)) return {};
        return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    } catch (error) {
        console.error('Failed to load overlay configs:', error.message);
        return {};
    }
}

function saveOverlayConfigs() {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(overlayConfigs, null, 2));
}

function sanitizeProfileId(value) {
    return String(value || 'default').replace(/[^a-z0-9_-]/gi, '').slice(0, 40) || 'default';
}

function normalizeColor(value, fallback) {
    const color = String(value || fallback).trim();
    return /^#[0-9a-f]{6}$/i.test(color) ? color : fallback;
}

function toSafeNumber(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
}

function sanitizeOverlayConfig(config = {}) {
    const port = Number.parseInt(config.port, 10);
    const pollMs = Number.parseInt(config.pollMs || config.poll, 10);
    const scale = Number(config.scale);
    const positions = new Set(['top-left', 'top-right', 'bottom-left', 'bottom-right']);

    return {
        title: String(config.title || DEFAULT_OVERLAY_CONFIG.title).slice(0, 80),
        type: String(config.type || DEFAULT_OVERLAY_CONFIG.type).slice(0, 32),
        host: String(config.host || DEFAULT_OVERLAY_CONFIG.host).slice(0, 120),
        port: Number.isFinite(port) ? port : DEFAULT_OVERLAY_CONFIG.port,
        accent: normalizeColor(config.accent, DEFAULT_OVERLAY_CONFIG.accent),
        shadow: normalizeColor(config.shadow, DEFAULT_OVERLAY_CONFIG.shadow),
        pollMs: Number.isFinite(pollMs) ? Math.max(2500, pollMs) : DEFAULT_OVERLAY_CONFIG.pollMs,
        position: positions.has(config.position) ? config.position : DEFAULT_OVERLAY_CONFIG.position,
        scale: Number.isFinite(scale) ? String(Math.min(2, Math.max(0.6, scale))) : DEFAULT_OVERLAY_CONFIG.scale
    };
}

function getProfileConfig(profileId) {
    const profile = sanitizeProfileId(profileId);
    return sanitizeOverlayConfig({
        ...DEFAULT_OVERLAY_CONFIG,
        ...(overlayConfigs[profile] || {})
    });
}

function normalizePlayerStats(state) {
    const rawPlayers = state.raw?.numplayers;
    const rawBots = toSafeNumber(state.raw?.bots, 0);
    const hasRawPlayerCount = Number.isFinite(Number(rawPlayers));
    const listedPlayers = Array.isArray(state.players) ? state.players.length : 0;
    const listedBots = Array.isArray(state.players)
        ? state.players.filter((player) => player.bot || player.raw?.bot).length
        : 0;
    const reportedPlayers = hasRawPlayerCount ? toSafeNumber(rawPlayers, 0) : listedPlayers;
    const bots = hasRawPlayerCount ? rawBots : listedBots;
    const players = Math.max(0, reportedPlayers - bots);

    return {
        players,
        bots,
        reportedPlayers,
        listedPlayers,
        maxPlayers: toSafeNumber(state.maxplayers ?? state.raw?.maxplayers, 0)
    };
}

function getTargetFromQuery(query) {
    const profileConfig = query.profile ? getProfileConfig(query.profile) : DEFAULT_OVERLAY_CONFIG;
    const port = Number.parseInt(query.port, 10);

    return {
        title: String(query.title || profileConfig.title).slice(0, 80),
        type: String(query.type || profileConfig.type).slice(0, 32),
        host: String(query.host || profileConfig.host).slice(0, 120),
        port: Number.isFinite(port) ? port : profileConfig.port
    };
}

app.get('/api/config/:profile', (req, res) => {
    const profile = sanitizeProfileId(req.params.profile);
    res.json({
        profile,
        config: getProfileConfig(profile)
    });
});

app.get('/api/tunnel-url', (req, res) => {
    try {
        if (!fs.existsSync(TUNNEL_URL_PATH)) {
            return res.status(404).json({
                url: '',
                message: 'Tunnel URL not ready yet'
            });
        }

        const url = fs.readFileSync(TUNNEL_URL_PATH, 'utf8').trim();
        res.json({ url });
    } catch (error) {
        res.status(500).json({
            url: '',
            message: error.message
        });
    }
});

app.post('/api/config/:profile', (req, res) => {
    const profile = sanitizeProfileId(req.params.profile);
    const config = sanitizeOverlayConfig(req.body);

    overlayConfigs[profile] = config;
    saveOverlayConfigs();

    res.json({
        profile,
        config,
        updatedAt: new Date().toISOString()
    });
});

app.get('/api/status', async (req, res) => {
    const now = Date.now();
    const target = getTargetFromQuery(req.query);
    const cacheKey = `${target.type}:${target.host}:${target.port}:${target.title}`;
    const cached = statusCache.get(cacheKey);

    if (cached && (now - cached.lastFetchTime) < CACHE_DURATION_MS) {
        return res.json(cached.status);
    }

    try {
        const state = await GameDig.query({
            type: target.type, // CS2 uses the same query protocol as CSGO
            host: target.host,
            port: target.port,
            maxAttempts: 2,
            socketTimeout: 3500,
            attemptTimeout: 3500
        });
        const playerStats = normalizePlayerStats(state);

        const status = {
            name: target.title,
            serverName: state.name || target.title,
            players: playerStats.players,
            bots: playerStats.bots,
            reportedPlayers: playerStats.reportedPlayers,
            listedPlayers: playerStats.listedPlayers,
            maxPlayers: playerStats.maxPlayers,
            map: state.map || state.raw?.map || '--',
            online: true,
            host: target.host,
            port: target.port,
            type: target.type,
            updatedAt: new Date().toISOString()
        };

        statusCache.set(cacheKey, { status, lastFetchTime: now });
        res.json(status);
    } catch (error) {
        console.error("Failed to query server:", error.message);
        
        // Return cached status if available, even if expired, but mark as offline
        if (cached) {
            return res.json({
                ...cached.status,
                players: 0,
                bots: 0,
                reportedPlayers: 0,
                listedPlayers: 0,
                map: '--',
                online: false,
                error: "Server offline"
            });
        }

        res.status(200).json({
            name: target.title,
            players: 0,
            bots: 0,
            reportedPlayers: 0,
            listedPlayers: 0,
            maxPlayers: 0,
            map: '--',
            online: false,
            host: target.host,
            port: target.port,
            type: target.type,
            error: "Server offline"
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
