const { spawn } = require('child_process');

const children = new Set();
let shuttingDown = false;

function run(name, command, args, options = {}) {
    const isWin = process.platform === 'win32';
    const child = spawn(isWin ? `${command} ${args.join(' ')}` : command, isWin ? [] : args, {
        cwd: options.cwd || process.cwd(),
        shell: isWin,
        stdio: ['ignore', 'pipe', 'pipe']
    });

    children.add(child);

    const pipe = (stream, target) => {
        stream.on('data', (chunk) => {
            String(chunk)
                .split(/\r?\n/)
                .filter(Boolean)
                .forEach((line) => target.write(`[${name}] ${line}\n`));
        });
    };

    pipe(child.stdout, process.stdout);
    pipe(child.stderr, process.stderr);

    child.on('error', (error) => {
        console.error(`[${name}] ${error.message}`);
        shutdown(1);
    });

    child.on('exit', (code) => {
        children.delete(child);
        if (!shuttingDown && code && code !== 0) {
            shutdown(code);
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

run('site', 'npm', ['run', 'vite']);
run('overlay', 'npm', ['run', 'dev'], { cwd: 'asets/tiktok_overlay' });
