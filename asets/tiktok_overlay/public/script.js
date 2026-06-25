const serverTitleEl = document.getElementById('server-title');
const playersValEl = document.getElementById('players-val');
const mapValEl = document.getElementById('map-val');
const clockValEl = document.getElementById('clock-val');
const params = new URLSearchParams(window.location.search);

const settings = {
    title: params.get('title') || 'CS2.WILDFIRE.RO',
    api: params.get('api') || '/api/status',
    host: params.get('host') || '5.135.142.4',
    port: params.get('port') || '27015',
    type: params.get('type') || 'csgo',
    accent: params.get('accent') ? `#${params.get('accent').replace('#', '')}` : '#ff8800',
    shadow: params.get('shadow') ? `#${params.get('shadow').replace('#', '')}` : '#000000',
    pollMs: Math.max(2500, Number.parseInt(params.get('poll') || '5000', 10)),
    position: params.get('position') || 'top-left',
    scale: params.get('scale') || '1'
};

function normalizeColor(value, fallback) {
    const color = String(value || fallback).trim();
    return /^#[0-9a-f]{6}$/i.test(color) ? color : fallback;
}

function applyConfig(config = {}) {
    if (config.title) settings.title = String(config.title);
    if (config.api) settings.api = String(config.api);
    if (config.host) settings.host = String(config.host);
    if (config.port) settings.port = String(config.port);
    if (config.type) settings.type = String(config.type);
    settings.accent = normalizeColor(config.accent, settings.accent);
    settings.shadow = normalizeColor(config.shadow, settings.shadow);
    settings.pollMs = Math.max(2500, Number.parseInt(config.pollMs || config.poll || settings.pollMs, 10));
    if (config.position) settings.position = String(config.position);
    if (config.scale) settings.scale = String(config.scale);
}

function applyVisualSettings() {
    document.documentElement.style.setProperty('--hud-accent', settings.accent);
document.documentElement.style.setProperty('--hud-shadow', settings.shadow);
document.documentElement.style.setProperty('--hud-scale', settings.scale);
document.body.dataset.position = settings.position;
document.body.dataset.debug = params.get('debug') === '1' ? 'true' : 'false';
}

async function loadProfileConfig() {
    const profile = params.get('profile');
    if (!profile) return;

    try {
        const response = await fetch(`/api/config/${encodeURIComponent(profile)}`);
        if (!response.ok) throw new Error('Profile config unavailable');
        const data = await response.json();
        applyConfig(data.config || {});
    } catch (error) {
        console.error('Error loading overlay profile:', error);
    }
}

function updateElement(el, newValue, animate = true) {
    if (!el || el.innerText === newValue) return;

    const oldVal = el.innerText;
    el.innerText = newValue;

    if (!animate) return;

    el.classList.remove('update-pulse', 'update-up', 'update-down');
    void el.offsetWidth;

    const oldNumMatch = oldVal ? oldVal.match(/^(\d+)/) : null;
    const newNumMatch = newValue ? String(newValue).match(/^(\d+)/) : null;

    if (oldNumMatch && newNumMatch) {
        const oldNum = Number.parseInt(oldNumMatch[1], 10);
        const newNum = Number.parseInt(newNumMatch[1], 10);

        if (newNum > oldNum) {
            el.classList.add('update-up');
            return;
        }

        if (newNum < oldNum) {
            el.classList.add('update-down');
            return;
        }
    }

    el.classList.add('update-pulse');
}

function updateClock() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    updateElement(clockValEl, `${hh}:${mm}:${ss}`, false);
}

function buildStatusEndpoint() {
    const endpoint = new URL(settings.api, window.location.origin);
    endpoint.searchParams.set('title', settings.title);
    endpoint.searchParams.set('host', settings.host);
    endpoint.searchParams.set('port', settings.port);
    endpoint.searchParams.set('type', settings.type);
    return endpoint;
}

async function fetchServerStatus() {
    try {
        const response = await fetch(buildStatusEndpoint());
        if (!response.ok) throw new Error('Failed to fetch status');
        const data = await response.json();

        if (data.online) {
            updateElement(serverTitleEl, data.name || settings.title);
            const displayPlayers = Number(data.players ?? 0);
            const displayMaxPlayers = Number(data.maxPlayers ?? 0);
            updateElement(playersValEl, `${displayPlayers}/${displayMaxPlayers}`);
            updateElement(mapValEl, data.map || '--');
        } else {
            updateElement(serverTitleEl, data.name || settings.title);
            updateElement(playersValEl, 'OFFLINE');
            updateElement(mapValEl, '--');
        }
    } catch (error) {
        console.error('Error fetching server status:', error);
        updateElement(serverTitleEl, settings.title);
        updateElement(playersValEl, 'ERROR');
    }
}

async function initOverlay() {
    await loadProfileConfig();
    applyVisualSettings();
    updateElement(serverTitleEl, settings.title, false);
    updateClock();
    fetchServerStatus();

    setInterval(updateClock, 1000);
    setInterval(fetchServerStatus, settings.pollMs);
}

initOverlay();
