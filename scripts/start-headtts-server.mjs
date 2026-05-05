import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const packageDir = resolve(rootDir, 'node_modules/@met4citizen/headtts');
const configPath = resolve(rootDir, 'headtts-node.json');
const serverPath = resolve(packageDir, 'modules/headtts-node.mjs');

process.chdir(packageDir);
process.argv = [process.execPath, serverPath, '--config', configPath];

await import(pathToFileURL(serverPath).href);

