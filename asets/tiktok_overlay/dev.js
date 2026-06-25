const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const children = new Set();
let shuttingDown = false;
const tunnelUrlPath = path.join(__dirname, 'tunnel-url.txt');

function rememberTunnelUrl(line) {
    const match = String(line).match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/i);
    if (!match) return;

    fs.writeFileSync(tunnelUrlPath, match[0]);
    console.log(`[dev] Public TikTok URL base: ${match[0]}`);
    console.log(`[dev] Use this as API base in the Wildfire Overlay tool.`);
}

function pipeOutput(name, stream, target) {
    stream.on('data', (chunk) => {
        String(chunk)
            .split(/\r?\n/)
            .filter(Boolean)
            .forEach((line) => {
                if (name === 'tunnel') rememberTunnelUrl(line);
                target.write(`[${name}] ${line}\n`);
            });
    });
}

function runProcess(name, command, args) {
    const child = spawn(command, args, {
        cwd: __dirname,
        stdio: ['ignore', 'pipe', 'pipe']
    });

    children.add(child);
    pipeOutput(name, child.stdout, process.stdout);
    pipeOutput(name, child.stderr, process.stderr);

    child.on('error', (error) => {
        console.error(`[${name}] ${error.message}`);
        shutdown(1);
    });

    child.on('exit', (code) => {
        children.delete(child);
        if (!shuttingDown && name === 'overlay') {
            shutdown(code || 0);
        }
    });

    return child;
}

function shutdown(code = 0) {
    if (shuttingDown) return;
    shuttingDown = true;

    children.forEach((child) => {
        if (!child.killed) child.kill();
    });

    process.exitCode = code;
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

const cloudflaredPath = path.join(__dirname, process.platform === 'win32' ? 'cloudflared.exe' : 'cloudflared');

console.log('[dev] Starting overlay server and public tunnel...');
try {
    fs.rmSync(tunnelUrlPath, { force: true });
} catch {
    // Ignore stale tunnel cleanup failures.
}
runProcess('overlay', 'node', ['server.js']);

setTimeout(() => {
    if (!fs.existsSync(cloudflaredPath)) {
        console.error('[tunnel] cloudflared executable not found in asets/tiktok_overlay.');
        return;
    }

    runProcess('tunnel', cloudflaredPath, ['tunnel', '--url', 'http://localhost:3000']);
}, 800);
