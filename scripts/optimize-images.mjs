/**
 * Comprime PNG/JPEG/WebP em dist/img após o build (Sharp).
 * Executado em postbuild; pode rodar manualmente: npm run optimize-images
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const distImg = path.join(root, 'dist', 'img');

const MAX_WIDTH = 2400;

async function processFile(filePath) {
    try {
        const ext = path.extname(filePath).toLowerCase();
        const stat = fs.statSync(filePath);
        if (stat.size < 2048) return { saved: 0 };

        let pipeline = sharp(filePath);
        const meta = await pipeline.metadata();
        if (meta.width && meta.width > MAX_WIDTH) {
            pipeline = pipeline.resize(MAX_WIDTH, null, { withoutEnlargement: true, fit: 'inside' });
        }

        let buf;
        if (ext === '.jpg' || ext === '.jpeg') {
            buf = await pipeline.jpeg({ quality: 82, mozjpeg: true }).toBuffer();
        } else if (ext === '.png') {
            buf = await pipeline.png({ quality: 85, compressionLevel: 9 }).toBuffer();
        } else if (ext === '.webp') {
            buf = await pipeline.webp({ quality: 82 }).toBuffer();
        } else {
            return { saved: 0 };
        }

        const before = stat.size;
        if (buf.length < before) {
            fs.writeFileSync(filePath, buf);
            return { saved: before - buf.length };
        }
        return { saved: 0 };
    } catch (err) {
        console.warn('[optimize-images] Ignorado (arquivo bloqueado ou inválido):', filePath, err.message);
        return { saved: 0 };
    }
}

async function walk(dir) {
    let totalSaved = 0;
    if (!fs.existsSync(dir)) {
        console.warn('[optimize-images] Pasta não encontrada:', dir);
        return 0;
    }
    for (const name of fs.readdirSync(dir)) {
        const full = path.join(dir, name);
        const st = fs.statSync(full);
        if (st.isDirectory()) {
            totalSaved += await walk(full);
        } else if (/\.(jpe?g|png|webp)$/i.test(name)) {
            const { saved } = await processFile(full);
            totalSaved += saved;
        }
    }
    return totalSaved;
}

const saved = await walk(distImg);
if (saved > 0) {
    console.log(`[optimize-images] Economia aproximada: ${(saved / 1024).toFixed(1)} KB`);
} else {
    console.log('[optimize-images] Nada a otimizar ou pasta dist/img ausente (rode npm run build antes).');
}
