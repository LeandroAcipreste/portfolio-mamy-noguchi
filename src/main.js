import './css/input.css';
import './js/script-mamy.js';

// Carrega o fundo WebGL da hero sob demanda (reduz bundle inicial).
if (document.getElementById('hero-canvas-container')) {
    import('./js/hero-background.js').then((m) => m.initHeroBackground()).catch(console.error);
}
