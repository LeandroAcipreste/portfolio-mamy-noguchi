/**
 * Mamy Portfolio — GSAP + Lenis + Particles.js
 * Lenis sincronizado com ScrollTrigger; input de ponteiro unificado para performance.
 */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

const DEBUG = false;
const log = (...args) => {
    if (DEBUG) console.log('[Mamy]', ...args);
};

document.addEventListener('DOMContentLoaded', () => {
    const debugRunId = 'bird-motion-post-fix';
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isCoarsePointer = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    const cpuCores = navigator.hardwareConcurrency || 4;
    const deviceMem = navigator.deviceMemory || 4;
    const isLowPerfDevice = isCoarsePointer || cpuCores <= 2 || deviceMem <= 2;
    const allowHeavyEffects = !prefersReducedMotion && !isLowPerfDevice;

    let lenis;
    try {
        lenis = new Lenis({
            duration: 1.05,
            easing: (t) => 1 - Math.pow(1 - t, 3),
            smoothWheel: true,
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            wheelMultiplier: 0.92,
            // Touch + Lenis costuma travar ou não chegar ao fim da página; scroll nativo no mobile.
            smoothTouch: false,
            touchMultiplier: 1.05,
            infinite: false,
            autoResize: true,
        });

        lenis.stop();

        gsap.ticker.add((time) => {
            lenis.raf(time * 1000);
        });
        gsap.ticker.lagSmoothing(0);
        log('Lenis initialized (stopped for intro)');
    } catch (e) {
        console.error('Mamy: Lenis error:', e);
    }

    const initParticles = (attempt = 0) => {
        try {
            if (typeof particlesJS !== 'undefined') {
                // Config espelhada do template "digital_system_ai" (network + grab no cursor)
                particlesJS('particles-js', {
                    particles: {
                        number: { value: 60, density: { enable: true, value_area: 800 } },
                        color: { value: '#e5c9a8' },
                        shape: { type: 'circle' },
                        opacity: { value: 0.5, random: false },
                        size: { value: 3, random: true },
                        line_linked: { enable: true, distance: 150, color: '#e5c9a8', opacity: 0.4, width: 1 },
                        move: {
                            enable: true,
                            speed: 2,
                            direction: 'none',
                            random: false,
                            straight: false,
                            out_mode: 'out',
                            bounce: false,
                        },
                    },
                    interactivity: {
                        detect_on: 'window',
                        events: {
                            onhover: { enable: true, mode: 'grab' },
                            onclick: { enable: true, mode: 'push' },
                            resize: true,
                        },
                        modes: {
                            grab: {
                                distance: 200,
                                line_linked: { opacity: 0.8 },
                            },
                            push: { particles_nb: 4 },
                            bubble: { distance: 400, size: 40, duration: 2, opacity: 8, speed: 3 },
                            repulse: { distance: 200, duration: 0.4 },
                            remove: { particles_nb: 2 },
                        },
                    },
                    retina_detect: true,
                });
                return;
            }
            if (attempt < 10) {
                setTimeout(() => initParticles(attempt + 1), 250);
            }
        } catch (e) {
            console.error('Mamy: Particles error:', e);
        }
    };

    const magazineCanvasEl = document.getElementById('magazine-canvas');
    const magPointer = { targetMX: 0.5, targetMY: 0.5 };

    try {
        gsap.registerPlugin(ScrollTrigger);

        log('Initializing GSAP timelines');

            const masterTl = gsap.timeline();

            const sigPaths = document.querySelectorAll('.sig-path');

            const sigPathLengths = [];
            sigPaths.forEach((path) => {
                sigPathLengths.push(path.getTotalLength());
            });

            sigPaths.forEach((path, i) => {
                const len = sigPathLengths[i];
                path.style.strokeDasharray = len;
                path.style.strokeDashoffset = len;
                path.style.fill = 'transparent';
                path.style.transition = 'none';
            });

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    sigPaths.forEach((path, i) => {
                        const len = sigPathLengths[i];
                        const delay = i * 0.08;
                        path.style.transition = `stroke-dashoffset 2.0s ${delay}s cubic-bezier(0.4, 0.0, 0.2, 1), fill 0.8s ${1.6 + delay}s ease-in-out`;
                        path.style.strokeDashoffset = '0';
                        path.style.fill = '#b39344';
                    });
                });
            });

            const signatureLine = document.querySelector('.signature-line');

            masterTl
                .to(
                    signatureLine,
                    {
                        width: '100%',
                        duration: 2.0,
                        ease: 'power2.inOut',
                    },
                    0
                )
                .to(
                    '#preloader',
                    {
                        yPercent: -100,
                        duration: 1.0,
                        ease: 'expo.inOut',
                        delay: 1.2,
                        onStart: () => {
                            initParticles();
                        },
                        onComplete: () => {
                            const preloader = document.getElementById('preloader');
                            if (preloader) {
                                preloader.style.display = 'none';
                                preloader.style.pointerEvents = 'none';
                            }
                        },
                    }
                );

            const heroTl = gsap.timeline({
                defaults: { ease: 'expo.out', duration: 1.6, force3D: true },
                onComplete: () => {
                    if (lenis) lenis.start();
                    document.documentElement.classList.remove('overflow-hidden');
                    document.body.classList.remove('overflow-hidden');
                    document.body.classList.add('overflow-x-hidden');

                    initScrollEffects();
                },
            });

            const welcomePaths = document.querySelectorAll('.welcome-path');
            welcomePaths.forEach((path) => {
                const length = path.getTotalLength();
                gsap.set(path, { strokeDasharray: length, strokeDashoffset: length, opacity: 1 });
            });

            heroTl.to(welcomePaths, { strokeDashoffset: 0, duration: 1.8, stagger: 0.05, ease: 'power2.inOut' });
            heroTl.to(welcomePaths, { fill: '#b39344', duration: 0.8, ease: 'power1.inOut' }, '-=0.5');

            heroTl.fromTo('.hero-logo-container', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1.4 }, '-=1.2');

            heroTl.fromTo('.hero-card-container', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1.6 }, '-=1.4');
            heroTl.fromTo('.hero-camada-top', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1.2 }, '-=1.2');
            heroTl.fromTo(
                '.wood-btn',
                { opacity: 0, scale: 0.9, y: 15 },
                { opacity: 1, scale: 1, y: 0, stagger: 0.1, duration: 1.4, ease: 'back.out(1.7)' },
                '-=1.0'
            );
            heroTl.fromTo('.hero-camada-bottom', { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 1.2 }, '-=1.2');

            heroTl.fromTo(
                '.hero-bird-image',
                { opacity: 0, x: -150, scale: 0.92 },
                { opacity: 1, x: 0, scale: 1, duration: 2.8, ease: 'power3.out', overwrite: 'auto' },
                '-=2.2'
            );

            heroTl.fromTo('.wood-marquee', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1.2 }, '-=1.5');

            masterTl.add(heroTl, '-=0.6');

            const prefersFinePointer = window.matchMedia('(pointer: fine)');
            const birdFloatLayer = document.querySelector('.hero-bird-float-layer');
            const birdImage = document.querySelector('.hero-bird-image');
            const allowBirdMotion = prefersFinePointer.matches && !!birdFloatLayer;
            let birdDebugEventCount = 0;
            let birdDebugAppliedCount = 0;
            let birdDebugBlockedLogged = false;

            // #region agent log
            fetch('http://127.0.0.1:7285/ingest/4ff671a5-dc58-4d00-9dd9-95e3aaf110f6',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'ffad29'},body:JSON.stringify({sessionId:'ffad29',runId:debugRunId,hypothesisId:'H1',location:'src/js/script-mamy.js:init-bird-motion',message:'Bird motion gating values',data:{prefersReducedMotion,isCoarsePointer,allowHeavyEffects,prefersFinePointer:prefersFinePointer.matches,hasBirdFloatLayer:!!birdFloatLayer,hasBirdImage:!!birdImage,allowBirdMotion},timestamp:Date.now()})}).catch(()=>{});
            // #endregion

            let birdParallaxX;
            let birdParallaxY;
            if (allowBirdMotion) {
                birdParallaxX = gsap.quickTo(birdFloatLayer, 'x', { duration: 0.9, ease: 'power2.out' });
                birdParallaxY = gsap.quickTo(birdFloatLayer, 'y', { duration: 0.9, ease: 'power2.out' });

                // #region agent log
                fetch('http://127.0.0.1:7285/ingest/4ff671a5-dc58-4d00-9dd9-95e3aaf110f6',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'ffad29'},body:JSON.stringify({sessionId:'ffad29',runId:debugRunId,hypothesisId:'H2',location:'src/js/script-mamy.js:init-parallax',message:'Parallax quickTo created',data:{hasQuickToX:!!birdParallaxX,hasQuickToY:!!birdParallaxY},timestamp:Date.now()})}).catch(()=>{});
                // #endregion
            }

            if (birdImage) {
                gsap.to(birdImage, {
                    y: '+=10',
                    rotation: 1.2,
                    duration: 2.8,
                    repeat: -1,
                    yoyo: true,
                    ease: 'sine.inOut',
                });
            }

            const cursor = document.getElementById('mamy-custom-cursor');
            let cursorXTo;
            let cursorYTo;
            const useCustomCursor = cursor && window.innerWidth > 1024;
            if (useCustomCursor) {
                cursorXTo = gsap.quickTo(cursor, 'x', { duration: 0.2, ease: 'power3' });
                cursorYTo = gsap.quickTo(cursor, 'y', { duration: 0.2, ease: 'power3' });
            }

            const onGlobalPointerMove = (e) => {
                if (birdDebugEventCount < 3) {
                    birdDebugEventCount += 1;
                    // #region agent log
                    fetch('http://127.0.0.1:7285/ingest/4ff671a5-dc58-4d00-9dd9-95e3aaf110f6',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'ffad29'},body:JSON.stringify({sessionId:'ffad29',runId:debugRunId,hypothesisId:'H3',location:'src/js/script-mamy.js:onGlobalPointerMove',message:'Pointer event received',data:{count:birdDebugEventCount,clientX:e.clientX,clientY:e.clientY,allowBirdMotion,hasParallaxX:!!birdParallaxX,hasParallaxY:!!birdParallaxY},timestamp:Date.now()})}).catch(()=>{});
                    // #endregion
                }

                if (allowBirdMotion && birdParallaxX && birdParallaxY) {
                    const x = (e.clientX - window.innerWidth / 2) * 0.01;
                    const y = (e.clientY - window.innerHeight / 2) * 0.01;
                    birdParallaxX(x * 2.4);
                    birdParallaxY(y * 2.1);
                    if (birdDebugAppliedCount < 3) {
                        birdDebugAppliedCount += 1;
                        // #region agent log
                        fetch('http://127.0.0.1:7285/ingest/4ff671a5-dc58-4d00-9dd9-95e3aaf110f6',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'ffad29'},body:JSON.stringify({sessionId:'ffad29',runId:debugRunId,hypothesisId:'H4',location:'src/js/script-mamy.js:apply-parallax',message:'Parallax applied to bird',data:{count:birdDebugAppliedCount,x,y,targetX:x*2.4,targetY:y*2.1},timestamp:Date.now()})}).catch(()=>{});
                        // #endregion
                    }
                } else if (!birdDebugBlockedLogged) {
                    birdDebugBlockedLogged = true;
                    // #region agent log
                    fetch('http://127.0.0.1:7285/ingest/4ff671a5-dc58-4d00-9dd9-95e3aaf110f6',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'ffad29'},body:JSON.stringify({sessionId:'ffad29',runId:debugRunId,hypothesisId:'H5',location:'src/js/script-mamy.js:blocked-parallax',message:'Parallax branch blocked',data:{allowBirdMotion,hasParallaxX:!!birdParallaxX,hasParallaxY:!!birdParallaxY,prefersFinePointer:prefersFinePointer.matches,prefersReducedMotion},timestamp:Date.now()})}).catch(()=>{});
                    // #endregion
                }

                if (magazineCanvasEl) {
                    const rect = magazineCanvasEl.getBoundingClientRect();
                    if (
                        e.clientX >= rect.left &&
                        e.clientX <= rect.right &&
                        e.clientY >= rect.top &&
                        e.clientY <= rect.bottom
                    ) {
                        magPointer.targetMX = (e.clientX - rect.left) / rect.width;
                        magPointer.targetMY = 1.0 - (e.clientY - rect.top) / rect.height;
                    }
                }

                if (useCustomCursor && cursorXTo && cursorYTo) {
                    cursorXTo(e.clientX);
                    cursorYTo(e.clientY);
                    gsap.to(cursor, { opacity: 1, duration: 0.3 });
                }
            };

            window.addEventListener('mousemove', onGlobalPointerMove, { passive: true });

            if (useCustomCursor && cursor) {
                document.addEventListener('mouseleave', () => {
                    gsap.to(cursor, { opacity: 0, duration: 0.3 });
                });
            }

            function initSectionHeaderScroll(headerSelector, exitTriggerSelector) {
                const header = document.querySelector(headerSelector);
                if (!header) return;

                gsap.fromTo(
                    header.children,
                    { opacity: 0, y: 30 },
                    {
                        opacity: 1,
                        y: 0,
                        stagger: 0.1,
                        scrollTrigger: {
                            trigger: header,
                            start: 'top 95%',
                            end: 'top 65%',
                            scrub: 1,
                        },
                    }
                );

                if (exitTriggerSelector) {
                    gsap.to(header, {
                        opacity: 0,
                        y: -30,
                        scrollTrigger: {
                            trigger: exitTriggerSelector,
                            start: 'top 40%',
                            end: 'top -10%',
                            scrub: 1.2,
                        },
                    });
                }
            }

            function initScrollEffects() {
                if (lenis) {
                    lenis.on('scroll', ScrollTrigger.update);
                }

                let resizeDebounce;
                window.addEventListener(
                    'resize',
                    () => {
                        clearTimeout(resizeDebounce);
                        resizeDebounce = setTimeout(() => ScrollTrigger.refresh(), 150);
                    },
                    { passive: true }
                );

                gsap.to('.hero-logo-container, .hero-card-container', {
                    scrollTrigger: {
                        trigger: '.hero-card-container',
                        start: 'top 10%',
                        end: 'bottom top',
                        scrub: true,
                        invalidateOnRefresh: true,
                    },
                    opacity: 0,
                    y: -80,
                    ease: 'none',
                });

                initSectionHeaderScroll('#logo-branding-scrolling .max-w-3xl', '.logoEbranding-wall-stage');
                initSectionHeaderScroll('#social-media-section .max-w-3xl', null);

                ScrollTrigger.create({
                    trigger: 'section.max-w-7xl',
                    start: 'top 20%',
                    onEnterBack: () => {
                        gsap.fromTo(
                            '.welcome-path',
                            { strokeDashoffset: 1000, fill: 'transparent' },
                            {
                                strokeDashoffset: 0,
                                duration: 2.2,
                                stagger: 0.1,
                                ease: 'slow(0.7, 0.7, false)',
                                overwrite: true,
                                onComplete: () => {
                                    gsap.to('.welcome-path', { fill: '#b39344', duration: 0.8 });
                                },
                            }
                        );

                        gsap.fromTo(
                            '.hero-bird-image',
                            { opacity: 0, x: -150, scale: 0.95 },
                            { opacity: 1, x: 0, scale: 1, duration: 2.2, ease: 'power2.out', overwrite: true }
                        );

                        gsap.fromTo(
                            '.hero-logo-container',
                            { opacity: 0, y: 30 },
                            { opacity: 1, y: 0, duration: 1.4, overwrite: true }
                        );

                        gsap.fromTo(
                            '.hero-card-container',
                            { opacity: 0, y: 40 },
                            { opacity: 1, y: 0, duration: 1.6, overwrite: true }
                        );
                        gsap.fromTo(
                            '.hero-camada-top',
                            { opacity: 0, y: 20 },
                            { opacity: 1, y: 0, duration: 1.2, overwrite: true }
                        );
                        gsap.fromTo(
                            '.wood-btn',
                            { opacity: 0, scale: 0.9, y: 15 },
                            {
                                opacity: 1,
                                scale: 1,
                                y: 0,
                                stagger: 0.08,
                                duration: 1.2,
                                ease: 'back.out(1.7)',
                                overwrite: true,
                            }
                        );
                        gsap.fromTo(
                            '.hero-camada-bottom',
                            { opacity: 0, y: -20 },
                            { opacity: 1, y: 0, duration: 1.2, overwrite: true }
                        );
                    },
                });

                if (document.querySelector('.logoEbranding-features')) {
                    const tlCards = gsap.timeline({
                        scrollTrigger: {
                            trigger: '.logoEbranding-features',
                            start: 'top 85%',
                            end: 'bottom 30%',
                            toggleActions: 'play reverse play reverse',
                        },
                    });

                    tlCards.fromTo(
                        '.logoEbranding-features .card-left',
                        { x: -100, opacity: 0 },
                        { x: 0, opacity: 1, duration: 1.2, ease: 'power3.out' },
                        0
                    );

                    tlCards.fromTo(
                        '.logoEbranding-features .card-bottom',
                        { y: 150, opacity: 0 },
                        { y: 0, opacity: 1, duration: 1.2, ease: 'power3.out' },
                        0.15
                    );

                    tlCards.fromTo(
                        '.logoEbranding-features .card-right',
                        { x: 100, opacity: 0 },
                        { x: 0, opacity: 1, duration: 1.2, ease: 'power3.out' },
                        0.3
                    );
                }

                log('Scroll effects initialized');
            }

            document.querySelectorAll('.wood-btn[href^="#"]').forEach((btn) => {
                const targetId = btn.getAttribute('href');
                if (targetId && targetId !== '#' && lenis) {
                    const targetEl = document.querySelector(targetId);
                    if (targetEl) {
                        btn.addEventListener('click', (e) => {
                            e.preventDefault();

                            ScrollTrigger.getAll().forEach((st) => st.disable());
                            setTimeout(() => ScrollTrigger.getAll().forEach((st) => st.enable()), 3500);

                            lenis.scrollTo(targetEl, {
                                duration: 3.2,
                                easing: (t) =>
                                    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
                                offset: -60,
                            });
                        });
                    }
                }
            });

            const MARQUEE_BASE_DURATION = 28;
            document
                .querySelectorAll('#logo-branding-scrolling .js-marquee-up, #social-media-section .js-marquee-up')
                .forEach((track, index) => {
                    const tween = gsap.to(track, {
                        yPercent: -50,
                        ease: 'none',
                        repeat: -1,
                        duration: MARQUEE_BASE_DURATION + index * 0.4,
                    });
                    const col = track.closest('.logoEbranding-wall-column');
                    if (col) {
                        col.addEventListener('mouseenter', () => tween.pause());
                        col.addEventListener('mouseleave', () => tween.play());
                    }
                });

            document
                .querySelectorAll('#logo-branding-scrolling .js-marquee-down, #social-media-section .js-marquee-down')
                .forEach((track, index) => {
                    gsap.set(track, { yPercent: -50 });
                    const tween = gsap.to(track, {
                        yPercent: 0,
                        ease: 'none',
                        repeat: -1,
                        duration: MARQUEE_BASE_DURATION + index * 0.4,
                    });
                    const col = track.closest('.logoEbranding-wall-column');
                    if (col) {
                        col.addEventListener('mouseenter', () => tween.pause());
                        col.addEventListener('mouseleave', () => tween.play());
                    }
                });

            if (document.querySelector('#books-section')) {
                const bookCards = gsap.utils.toArray('.book-card');

                gsap.fromTo(
                    bookCards,
                    {
                        opacity: 0,
                        y: 100,
                        rotateY: 15,
                        scale: 0.9,
                    },
                    {
                        opacity: 1,
                        y: 0,
                        rotateY: 0,
                        scale: 1,
                        duration: 1.5,
                        stagger: 0.2,
                        ease: 'power4.out',
                        scrollTrigger: {
                            trigger: '#books-section',
                            start: 'top 70%',
                            toggleActions: 'play none none reverse',
                        },
                    }
                );

                const booksVideo = document.getElementById('books-bg-video');
                if (booksVideo) {
                    ScrollTrigger.create({
                        trigger: '#books-section',
                        start: 'top 60%',
                        onEnter: () => {
                            booksVideo.currentTime = 0;
                            booksVideo.play().catch((err) => console.warn('Video play failed:', err));
                        },
                        onEnterBack: () => {
                            booksVideo.currentTime = 0;
                            booksVideo.play().catch((err) => console.warn('Video play failed:', err));
                        },
                        onLeave: () => {
                            booksVideo.pause();
                        },
                        onLeaveBack: () => {
                            booksVideo.pause();
                        },
                    });
                }
            }

            if (magazineCanvasEl) {
                const gl = magazineCanvasEl.getContext('webgl', {
                    alpha: true,
                    antialias: allowHeavyEffects && !import.meta.env.DEV,
                    powerPreference: allowHeavyEffects ? 'high-performance' : 'low-power',
                });
                if (gl) {
                    let mX = 0.5;
                    let mY = 0.5;
                    const magDpr = Math.min(window.devicePixelRatio || 1, allowHeavyEffects ? (import.meta.env.DEV ? 1.25 : 1.5) : 1);

                    function resizeMag() {
                        magazineCanvasEl.width = magazineCanvasEl.clientWidth * magDpr;
                        magazineCanvasEl.height = magazineCanvasEl.clientHeight * magDpr;
                        gl.viewport(0, 0, magazineCanvasEl.width, magazineCanvasEl.height);
                    }
                    window.addEventListener('resize', resizeMag, { passive: true });
                    resizeMag();

                    const vsSource = `
                        attribute vec2 position;
                        void main() { gl_Position = vec4(position, 0.0, 1.0); }
                    `;

                    const fsSource = `
                        precision highp float;
                        uniform vec2 u_resolution;
                        uniform float u_time;
                        uniform vec2 u_mouse;

                        float rand(vec2 n) {
                            return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
                        }

                        void main() {
                            vec2 st = gl_FragCoord.xy / u_resolution.xy;
                            vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);
                            vec2 uv = st * aspect;
                            vec2 mouse = u_mouse * aspect;

                            float dist = distance(uv, mouse);
                            float glow = exp(-dist * 6.0);

                            vec3 accent = vec3(0.898, 0.788, 0.658);

                            float gridLines = 40.0;
                            vec2 gridUv = uv * gridLines;
                            float lineThickness = 0.98;
                            float grid = max(step(lineThickness, fract(gridUv.x)), step(lineThickness, fract(gridUv.y)));
                            float flicker = abs(sin(u_time * 2.0 + uv.y * 5.0)) * 0.4 + 0.1;
                            vec3 finalGridColor = accent * grid * flicker * 0.1;

                            float scale = 60.0;
                            vec2 dotUv = fract(uv * scale);
                            vec2 cellId = floor(uv * scale);
                            float wave = sin(length(cellId * 0.1 - mouse * scale * 0.1) * 2.5 - u_time * 3.0);
                            float dotSize = 0.12 + (wave * 0.07) + (glow * 0.2);
                            float circle = 1.0 - smoothstep(dotSize, dotSize + 0.05, length(dotUv - vec2(0.5)));
                            vec3 finalDotColor = accent * (wave * 0.3 + 0.7 + glow * 1.5) * circle;

                            vec3 composite = finalGridColor + finalDotColor;
                            float edgeFade = smoothstep(0.0, 0.2, st.x) * smoothstep(1.0, 0.8, st.x) *
                                             smoothstep(0.0, 0.2, st.y) * smoothstep(1.0, 0.8, st.y);

                            gl_FragColor = vec4(composite * edgeFade, (composite.r + composite.g + composite.b) * 0.4);
                        }
                    `;

                    function compileS(type, src) {
                        const s = gl.createShader(type);
                        gl.shaderSource(s, src);
                        gl.compileShader(s);
                        return s;
                    }

                    const program = gl.createProgram();
                    gl.attachShader(program, compileS(gl.VERTEX_SHADER, vsSource));
                    gl.attachShader(program, compileS(gl.FRAGMENT_SHADER, fsSource));
                    gl.linkProgram(program);
                    gl.useProgram(program);

                    const buffer = gl.createBuffer();
                    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
                    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
                    const posLoc = gl.getAttribLocation(program, 'position');
                    gl.enableVertexAttribArray(posLoc);
                    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

                    const uRes = gl.getUniformLocation(program, 'u_resolution');
                    const uT = gl.getUniformLocation(program, 'u_time');
                    const uM = gl.getUniformLocation(program, 'u_mouse');

                    let sTime = performance.now();
                    let isMagVisible = false;
                    let magRafId = 0;
                    let lastMagFrame = 0;
                    const targetFrameGap = allowHeavyEffects ? 1000 / 45 : 1000 / 30;

                    const observer = new IntersectionObserver(
                        (entries) => {
                            const vis = entries[0].isIntersecting;
                            if (vis && !isMagVisible) {
                                isMagVisible = true;
                                scheduleMagFrame();
                            } else if (!vis && isMagVisible) {
                                isMagVisible = false;
                                cancelAnimationFrame(magRafId);
                            }
                        },
                        { root: null, threshold: 0.01 }
                    );
                    observer.observe(magazineCanvasEl);

                    function scheduleMagFrame() {
                        if (!isMagVisible) return;
                        magRafId = requestAnimationFrame(renderMag);
                    }

                    function renderMag(t) {
                        if (!isMagVisible) return;
                        if (t - lastMagFrame < targetFrameGap) {
                            magRafId = requestAnimationFrame(renderMag);
                            return;
                        }
                        lastMagFrame = t;

                        mX += (magPointer.targetMX - mX) * 0.08;
                        mY += (magPointer.targetMY - mY) * 0.08;
                        gl.uniform2f(uRes, magazineCanvasEl.width, magazineCanvasEl.height);
                        gl.uniform1f(uT, (t - sTime) * 0.001);
                        gl.uniform2f(uM, mX, mY);
                        gl.clearColor(0, 0, 0, 0);
                        gl.clear(gl.COLOR_BUFFER_BIT);
                        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
                        magRafId = requestAnimationFrame(renderMag);
                    }
                }
            }

            const magCards = gsap.utils.toArray('.magazine-card');
            if (magCards.length > 0) {
                gsap.fromTo(
                    magCards,
                    {
                        opacity: 0,
                        y: 80,
                        scale: 0.9,
                        filter: 'blur(10px)',
                    },
                    {
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        filter: 'blur(0px)',
                        duration: 1.2,
                        stagger: 0.15,
                        ease: 'power3.out',
                        clearProps: 'transform,filter',
                        scrollTrigger: {
                            trigger: '#menu-magazine-section',
                            start: 'top 60%',
                            toggleActions: 'play none none reverse',
                        },
                    }
                );
            }

            const packingBgImg = document.getElementById('packing-bg-img');
            if (packingBgImg) {
                gsap.to(packingBgImg, {
                    yPercent: allowHeavyEffects ? 20 : 10,
                    scale: allowHeavyEffects ? 1.1 : 1.04,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: '#label-packing-section',
                        start: 'top bottom',
                        end: 'bottom top',
                        scrub: allowHeavyEffects ? 1.5 : 0.7,
                    },
                });
            }

            const packCards = gsap.utils.toArray('.packing-card, .packing-accordion-card');
            if (packCards.length > 0) {
                gsap.fromTo(
                    packCards,
                    { opacity: 0, y: 100 },
                    {
                        opacity: 1,
                        y: 0,
                        duration: 1.5,
                        stagger: 0.2,
                        ease: 'power4.out',
                        scrollTrigger: {
                            trigger: '#label-packing-section',
                            start: 'top 60%',
                            toggleActions: 'play none none reverse',
                        },
                    }
                );

                packCards.forEach((card) => {
                    const depth = parseFloat(card.dataset.depth) || 0.1;
                    if (allowHeavyEffects) {
                        gsap.to(card, {
                            y: () => -window.innerHeight * depth,
                            ease: 'none',
                            scrollTrigger: {
                                trigger: '#label-packing-section',
                                start: 'top bottom',
                                end: 'bottom top',
                                scrub: true,
                            },
                        });
                    }

                    if (allowHeavyEffects && card.classList.contains('packing-card')) {
                        gsap.to(card, {
                            y: '+=20',
                            x: '+=10',
                            rotation: '+=2',
                            duration: 3 + Math.random() * 2,
                            repeat: -1,
                            yoyo: true,
                            ease: 'sine.inOut',
                            delay: Math.random() * 2,
                        });
                    }
                });
            }

            const accordionCards = document.querySelectorAll('.packing-accordion-card');
            const accordionWrapper = document.querySelector('#label-packing-section .flex.flex-col');

            if (accordionCards.length > 0 && isCoarsePointer) {
                accordionCards.forEach((card) => {
                    card.addEventListener(
                        'touchend',
                        (e) => {
                            e.preventDefault();

                            const isActive = card.classList.contains('touch-active');

                            accordionCards.forEach((c) => c.classList.remove('touch-active'));
                            if (accordionWrapper) accordionWrapper.classList.remove('accordion-has-active');

                            if (!isActive) {
                                card.classList.add('touch-active');
                                if (accordionWrapper) accordionWrapper.classList.add('accordion-has-active');
                            }
                        },
                        { passive: false }
                    );
                });
            }

            const mainFooter = document.getElementById('main-footer');
            const footerNameClip = document.getElementById('footer-name-sign-clip');
            const footerNameSignText = document.getElementById('footer-name-sign-text');
            const footerNameLine = document.getElementById('footer-name-sign-line');

            if (mainFooter) {
                const footerTagline = mainFooter.querySelector('.footer-tagline');
                const footerBtns = mainFooter.querySelectorAll('.footer-social-btn');
                const reduceMotionFooter = prefersReducedMotion || isLowPerfDevice;

                const getFooterNameWidth = () => (footerNameSignText ? footerNameSignText.offsetWidth : 0);

                if (footerTagline && footerBtns.length) {
                    if (reduceMotionFooter) {
                        gsap.set(footerTagline, { opacity: 1, y: 0, filter: 'none' });
                        gsap.set(footerBtns, { opacity: 1, y: 0 });
                        if (footerNameClip && footerNameLine) {
                            const w = getFooterNameWidth();
                            gsap.set(footerNameClip, { width: w });
                            gsap.set(footerNameLine, { width: w });
                        }
                    } else {
                        if (footerNameClip && footerNameSignText && footerNameLine) {
                            gsap.set(footerNameClip, { width: 0 });
                            gsap.set(footerNameLine, { width: 0 });

                            gsap
                                .timeline({
                                    scrollTrigger: {
                                        trigger: mainFooter,
                                        start: 'top 88%',
                                        end: 'bottom bottom',
                                        scrub: 1.05,
                                        invalidateOnRefresh: true,
                                    },
                                })
                                .fromTo(
                                    footerNameClip,
                                    { width: 0 },
                                    { width: () => getFooterNameWidth(), ease: 'none', duration: 1 },
                                    0
                                )
                                .fromTo(
                                    footerNameLine,
                                    { width: 0 },
                                    { width: () => getFooterNameWidth(), ease: 'none', duration: 1 },
                                    0
                                );

                            if (typeof document.fonts !== 'undefined' && document.fonts.ready) {
                                document.fonts.ready.then(() => ScrollTrigger.refresh());
                            }
                        }

                        gsap
                            .timeline({
                                scrollTrigger: {
                                    trigger: mainFooter,
                                    start: 'top 62%',
                                    end: 'bottom bottom',
                                    scrub: 1.15,
                                },
                            })
                            .fromTo(
                                footerTagline,
                                { opacity: 0, y: 32, filter: 'blur(10px)' },
                                { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1, ease: 'none' },
                                0
                            )
                            .from(
                                footerBtns,
                                {
                                    opacity: 0,
                                    y: 24,
                                    stagger: 0.08,
                                    duration: 0.45,
                                    ease: 'none',
                                },
                                0.12
                            );
                    }
                }
            }

            requestAnimationFrame(() => ScrollTrigger.refresh());
            window.addEventListener(
                'load',
                () => {
                    ScrollTrigger.refresh();
                },
                { once: true }
            );

            log('All sections initialized');
    } catch (e) {
        console.error('Mamy: GSAP error:', e);
        document
            .querySelectorAll(
                '.hero-bird-image, .hero-card-container, .wood-btn, .animate-title, .animate-footer, #main-footer .footer-tagline, #main-footer .footer-social-btn'
            )
            .forEach((el) => {
                el.style.opacity = '1';
            });
        const fntFallback = document.getElementById('footer-name-sign-text');
        if (fntFallback) {
            const wFb = fntFallback.offsetWidth;
            const fcFb = document.getElementById('footer-name-sign-clip');
            const flFb = document.getElementById('footer-name-sign-line');
            if (fcFb) fcFb.style.width = `${wFb}px`;
            if (flFb) flFb.style.width = `${wFb}px`;
        }
    }

    const backTopBtn = document.getElementById('mamy-back-top');
    const heroSectionEl = document.querySelector('section.max-w-7xl');
    if (backTopBtn && heroSectionEl) {
        const heroScrollThreshold = () => Math.max(heroSectionEl.offsetHeight * 0.35, 120);

        const setBackTopVisible = (show) => {
            backTopBtn.classList.toggle('mamy-back-top-visible', show);
        };

        const updateFromScrollPos = (scrollPos) => {
            setBackTopVisible(scrollPos > heroScrollThreshold());
        };

        backTopBtn.addEventListener('click', () => {
            ScrollTrigger.getAll().forEach((st) => st.disable());
            setTimeout(() => ScrollTrigger.getAll().forEach((st) => st.enable()), 3500);
            if (lenis) {
                lenis.scrollTo(0, {
                    duration: 2.4,
                    easing: (t) => 1 - Math.pow(1 - t, 3),
                });
            } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });

        const readLenisScroll = () => {
            if (!lenis) return 0;
            if (typeof lenis.scroll === 'number') return lenis.scroll;
            if (typeof lenis.animatedScroll === 'number') return lenis.animatedScroll;
            return 0;
        };

        if (lenis) {
            lenis.on('scroll', (e) => {
                const pos =
                    typeof e.animatedScroll === 'number'
                        ? e.animatedScroll
                        : typeof e.scroll === 'number'
                          ? e.scroll
                          : readLenisScroll();
                updateFromScrollPos(pos);
            });
        } else {
            let ticking = false;
            window.addEventListener(
                'scroll',
                () => {
                    if (!ticking) {
                        requestAnimationFrame(() => {
                            updateFromScrollPos(window.scrollY || document.documentElement.scrollTop);
                            ticking = false;
                        });
                        ticking = true;
                    }
                },
                { passive: true }
            );
        }

        window.addEventListener(
            'resize',
            () => {
                requestAnimationFrame(() => {
                    if (lenis) {
                        updateFromScrollPos(readLenisScroll());
                    } else {
                        updateFromScrollPos(window.scrollY || document.documentElement.scrollTop);
                    }
                });
            },
            { passive: true }
        );
        requestAnimationFrame(() => updateFromScrollPos(lenis ? readLenisScroll() : 0));
    }
});
