import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(scriptDir, '..');
const outputDir = resolve(rootDir, '.tmp-tests');
const outputFile = resolve(outputDir, 'russian-visemes.test.mjs');

mkdirSync(outputDir, { recursive: true });

try {
  await build({
    bundle: true,
    entryPoints: [resolve(rootDir, 'test/lipsync/russianVisemes.test.ts')],
    format: 'esm',
    logLevel: 'silent',
    outfile: outputFile,
    platform: 'node',
    target: 'node18'
  });

  const result = spawnSync(process.execPath, [outputFile], {
    cwd: rootDir,
    stdio: 'inherit'
  });

  if (result.error) {
    throw result.error;
  }

  process.exitCode = result.status ?? 1;
} finally {
  rmSync(outputDir, { force: true, recursive: true });
}
