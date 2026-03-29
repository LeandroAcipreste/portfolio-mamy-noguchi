import { defineConfig } from 'vite';

export default defineConfig({
    base: './',
    publicDir: 'public-static',
    css: {
        devSourcemap: false,
    },
    optimizeDeps: {
        include: ['gsap', 'lenis'],
    },
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        minify: 'esbuild',
        target: 'es2020',
        cssMinify: true,
        rollupOptions: {
            output: {
                manualChunks: undefined,
                entryFileNames: 'assets/[name]-[hash].js',
                chunkFileNames: 'assets/[name]-[hash].js',
                assetFileNames: 'assets/[name]-[hash][extname]',
            },
        },
    },
    server: {
        open: true,
        watch: {
            ignored: ['**/public-static/img/**'],
        },
    },
});
