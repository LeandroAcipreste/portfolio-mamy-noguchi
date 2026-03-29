/**
 * Sincroniza `img` -> `public-static/img` de forma incremental.
 * Evita recópia de arquivos pesados a cada `npm run dev`.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const srcImg = path.join(root, 'img');
const destImg = path.join(root, 'public-static', 'img');

if (!fs.existsSync(srcImg)) {
    console.warn('[sync-public-assets] Pasta "img" não encontrada na raiz. Crie ou copie imagens para ./img ou ./public/img');
    process.exit(0);
}

let copied = 0;
let skipped = 0;
let failed = 0;

function sameFile(src, dest) {
    try {
        const a = fs.statSync(src);
        const b = fs.statSync(dest);
        return a.size === b.size && Math.floor(a.mtimeMs) === Math.floor(b.mtimeMs);
    } catch {
        return false;
    }
}

function syncDir(srcDir, destDir) {
    fs.mkdirSync(destDir, { recursive: true });
    for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
        const srcPath = path.join(srcDir, entry.name);
        const destPath = path.join(destDir, entry.name);
        if (entry.isDirectory()) {
            syncDir(srcPath, destPath);
            continue;
        }
        if (sameFile(srcPath, destPath)) {
            skipped += 1;
            continue;
        }
        try {
            fs.copyFileSync(srcPath, destPath);
            const srcStat = fs.statSync(srcPath);
            fs.utimesSync(destPath, srcStat.atime, srcStat.mtime);
            copied += 1;
        } catch (err) {
            failed += 1;
            console.warn('[sync-public-assets] Ignorado (arquivo bloqueado):', srcPath, err.message);
        }
    }
}

syncDir(srcImg, destImg);
console.log(`[sync-public-assets] Concluído. Copiados: ${copied}, inalterados: ${skipped}, falhas: ${failed}`);
