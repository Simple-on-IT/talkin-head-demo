import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';

const isWindows = process.platform === 'win32';
const fallbackNpmCliPath = isWindows
  ? resolve(dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js')
  : 'npm';
const npmCliPath = process.env.npm_execpath ?? fallbackNpmCliPath;
const useNodeForNpm = isWindows || Boolean(process.env.npm_execpath);
const npmCommand = useNodeForNpm ? process.execPath : npmCliPath;
const npmArgsPrefix = useNodeForNpm ? [npmCliPath] : [];

const processes = [
  {
    name: 'ru-tts',
    command: npmCommand,
    args: [...npmArgsPrefix, 'run', 'dev:ru-tts'],
  },
  {
    name: 'web',
    command: npmCommand,
    args: [...npmArgsPrefix, 'run', 'dev'],
  },
];

let shuttingDown = false;
const children = [];

function prefixOutput(name, stream, data) {
  const lines = data.toString().split(/\r?\n/);

  for (const line of lines) {
    if (line.length > 0) {
      stream.write(`[${name}] ${line}\n`);
    }
  }
}

function stopProcess(child) {
  if (child.exitCode !== null || child.signalCode !== null) {
    return;
  }

  if (isWindows) {
    spawn('taskkill', ['/pid', String(child.pid), '/t', '/f'], {
      stdio: 'ignore',
    });
    return;
  }

  try {
    process.kill(-child.pid, 'SIGTERM');
  } catch {
    child.kill('SIGTERM');
  }
}

function shutdown() {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  console.log('\nStopping dev services...');

  for (const child of children) {
    stopProcess(child);
  }
}

for (const processConfig of processes) {
  const child = spawn(processConfig.command, processConfig.args, {
    cwd: process.cwd(),
    stdio: ['ignore', 'pipe', 'pipe'],
    env: process.env,
    shell: false,
    detached: !isWindows,
  });

  children.push(child);

  child.stdout.on('data', (data) => {
    prefixOutput(processConfig.name, process.stdout, data);
  });

  child.stderr.on('data', (data) => {
    prefixOutput(processConfig.name, process.stderr, data);
  });

  child.on('exit', (code, signal) => {
    if (!shuttingDown) {
      console.error(
        `[${processConfig.name}] exited with ${signal ?? `code ${code ?? 0}`}`,
      );
      shutdown();
      process.exitCode = code ?? 1;
    }
  });
}

console.log('Starting Silero TTS and Vite dev server...');
console.log('Open http://127.0.0.1:5173/ after Vite reports that it is ready.');
console.log('Press Ctrl+C to stop both services.');

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('exit', shutdown);
