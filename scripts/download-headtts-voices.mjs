import { createWriteStream } from 'node:fs';
import { mkdir, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const targetDir = resolve(rootDir, '.headtts/voices');
const voiceBaseUrl = 'https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/main/voices';
const voices = ['af_bella', 'af_sky', 'am_fenrir', 'am_michael'];

await mkdir(targetDir, { recursive: true });

async function fileExists(path) {
  try {
    const result = await stat(path);
    return result.isFile() && result.size > 0;
  } catch {
    return false;
  }
}

for (const voice of voices) {
  const targetPath = resolve(targetDir, `${voice}.bin`);

  if (await fileExists(targetPath)) {
    console.log(`Voice ${voice} already exists`);
    continue;
  }

  const url = `${voiceBaseUrl}/${voice}.bin`;
  console.log(`Downloading ${voice}...`);

  const response = await fetch(url);

  if (!response.ok || !response.body) {
    throw new Error(`Failed to download ${voice}: ${response.status} ${response.statusText}`);
  }

  await pipeline(Readable.fromWeb(response.body), createWriteStream(targetPath));
  console.log(`Saved ${targetPath}`);
}

