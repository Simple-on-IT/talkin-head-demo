import { spawn } from 'node:child_process';

const scriptArgs = process.argv.slice(2);

if (scriptArgs.length === 0) {
  console.error('Usage: node ./scripts/python-runner.mjs <python args...>');
  process.exit(1);
}

const envPython = process.env.PYTHON?.trim();
const platformCandidates =
  process.platform === 'win32'
    ? [
        { command: 'py', args: ['-3'] },
        { command: 'python', args: [] },
        { command: 'python3', args: [] },
      ]
    : [
        { command: 'python3', args: [] },
        { command: 'python', args: [] },
      ];

const candidates = envPython
  ? [{ command: envPython, args: [] }, ...platformCandidates]
  : platformCandidates;

function spawnPython(candidate, args, stdio) {
  return spawn(candidate.command, [...candidate.args, ...args], {
    cwd: process.cwd(),
    env: process.env,
    stdio,
    shell: false,
  });
}

function isMissingCommand(error) {
  return error.code === 'ENOENT' || error.code === 'UNKNOWN';
}

function runCandidate(index) {
  const candidate = candidates[index];

  if (!candidate) {
    console.error(
      'Python 3 was not found. Install Python 3 and make sure python3 or python is on PATH.',
    );
    process.exit(1);
  }

  let probe;

  try {
    probe = spawnPython(
      candidate,
      ['-c', 'import sys; raise SystemExit(0 if sys.version_info[0] == 3 else 1)'],
      'ignore',
    );
  } catch (error) {
    if (isMissingCommand(error)) {
      runCandidate(index + 1);
      return;
    }

    console.error(error.message);
    process.exit(1);
  }

  probe.on('error', (error) => {
    if (isMissingCommand(error)) {
      runCandidate(index + 1);
      return;
    }

    console.error(error.message);
    process.exit(1);
  });

  probe.on('exit', (code) => {
    if (code !== 0) {
      runCandidate(index + 1);
      return;
    }

    runPython(candidate);
  });
}

function runPython(candidate) {
  let child;

  try {
    child = spawnPython(candidate, scriptArgs, 'inherit');
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }

  child.on('error', (error) => {
    console.error(error.message);
    process.exit(1);
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 0);
  });
}

runCandidate(0);
