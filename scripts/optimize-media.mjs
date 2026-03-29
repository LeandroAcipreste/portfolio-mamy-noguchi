/**
 * Otimiza mídias em `public-static/img` para deploy (Vercel).
 * - Imagens: JPEG/PNG/WebP
 * - Vídeos: MP4/MOV/WebM (reencoda com ffmpeg, se disponível no sistema)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const mediaRoot = path.join(root, 'public-static', 'img');

const IMG_EXT = /\.(jpe?g|png|webp)$/i;
const VIDEO_EXT = /\.(mp4|mov|webm)$/i;
const MAX_WIDTH = 2200;

function walk(dir, files = []) {
    if (!fs.existsSync(dir)) return files;
    for (const name of fs.readdirSync(dir)) {
        const full = path.join(dir, name);
        const st = fs.statSync(full);
        if (st.isDirectory()) walk(full, files);
        else files.push(full);
    }
    return files;
}

async function optimizeImage(filePath) {
    try {
        const ext = path.extname(filePath).toLowerCase();
        const before = fs.statSync(filePath).size;
        if (before < 8 * 1024) return 0;

        let pipeline = sharp(filePath);
        const meta = await pipeline.metadata();
        if (meta.width && meta.width > MAX_WIDTH) {
            pipeline = pipeline.resize(MAX_WIDTH, null, { withoutEnlargement: true, fit: 'inside' });
        }

        let buf;
        if (ext === '.jpg' || ext === '.jpeg') {
            buf = await pipeline.jpeg({ quality: 80, mozjpeg: true }).toBuffer();
        } else if (ext === '.png') {
            buf = await pipeline.png({ quality: 80, compressionLevel: 9, palette: true }).toBuffer();
        } else if (ext === '.webp') {
            buf = await pipeline.webp({ quality: 80 }).toBuffer();
        } else {
            return 0;
        }

        if (buf.length < before) {
            fs.writeFileSync(filePath, buf);
            return before - buf.length;
        }
        return 0;
    } catch (err) {
        console.warn('[optimize-media] Imagem ignorada:', filePath, err.message);
        return 0;
    }
}

function hasFfmpeg() {
    const cmd = process.platform === 'win32' ? 'where' : 'which';
    const result = spawnSync(cmd, ['ffmpeg'], { stdio: 'ignore', shell: true });
    return result.status === 0;
}

function optimizeVideo(filePath) {
    try {
        const before = fs.statSync(filePath).size;
        if (before < 300 * 1024) return 0;

        const temp = `${filePath}.tmp.mp4`;
        const args = [
            '-y',
            '-i',
            filePath,
            '-c:v',
            'libx264',
            '-preset',
            'medium',
            '-crf',
            '30',
            '-vf',
            'scale=min(1920\\,iw):-2',
            '-r',
            '30',
            '-movflags',
            '+faststart',
            '-an',
            temp,
        ];

        const run = spawnSync('ffmpeg', args, { stdio: 'ignore', shell: true });
        if (run.status !== 0 || !fs.existsSync(temp)) {
            if (fs.existsSync(temp)) fs.unlinkSync(temp);
            return 0;
        }

        const after = fs.statSync(temp).size;
        if (after < before) {
            fs.renameSync(temp, filePath);
            return before - after;
        }
        fs.unlinkSync(temp);
        return 0;
    } catch (err) {
        console.warn('[optimize-media] Vídeo ignorado:', filePath, err.message);
        return 0;
    }
}

if (!fs.existsSync(mediaRoot)) {
    console.warn('[optimize-media] Pasta não encontrada:', mediaRoot);
    process.exit(0);
}

const files = walk(mediaRoot);
let imgSaved = 0;
let videoSaved = 0;

for (const f of files) {
    if (IMG_EXT.test(f)) {
        imgSaved += await optimizeImage(f);
    }
}

const ffmpegAvailable = hasFfmpeg();
if (ffmpegAvailable) {
    for (const f of files) {
        if (VIDEO_EXT.test(f)) videoSaved += optimizeVideo(f);
    }
} else {
    console.warn('[optimize-media] ffmpeg não encontrado no sistema. Otimização de vídeo foi pulada.');
}

const totalKb = (imgSaved + videoSaved) / 1024;
console.log(
    `[optimize-media] Economia total: ${totalKb.toFixed(1)} KB (imagens: ${(imgSaved / 1024).toFixed(1)} KB, videos: ${(videoSaved / 1024).toFixed(1)} KB)`
);
