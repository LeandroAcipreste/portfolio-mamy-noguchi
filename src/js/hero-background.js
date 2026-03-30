export async function initHeroBackground() {
    const container = document.getElementById('hero-canvas-container');
    if (!container) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // Carrega Three.js apenas quando necessário.
    // eslint-disable-next-line no-undef
    const THREE = await import('three');

    const isCoarsePointer = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    const cpuCores = navigator.hardwareConcurrency || 4;
    const deviceMem = navigator.deviceMemory || 4;
    const isLowPerfDevice = isCoarsePointer || cpuCores <= 2 || deviceMem <= 2;

    const scene = new THREE.Scene();

    let width = container.clientWidth || window.innerWidth;
    let heightEl = container.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(60, width / heightEl, 0.1, 1000);
    camera.position.z = 50;

    const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: !isLowPerfDevice,
        powerPreference: isLowPerfDevice ? 'low-power' : 'high-performance',
    });
    renderer.setSize(width, heightEl);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isLowPerfDevice ? 1.25 : 2));
    container.appendChild(renderer.domElement);

    const vFOV = THREE.MathUtils.degToRad(camera.fov);
    let viewHeight = 2 * Math.tan(vFOV / 2) * camera.position.z;
    const origin = new THREE.Vector3(0, -viewHeight / 2, 0);

    const mouse = new THREE.Vector2(0, 0);
    const targetMouse = new THREE.Vector2(0, 0);
    const raycaster = new THREE.Raycaster();
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const intersectionPoint = new THREE.Vector3();

    const rayCount = isLowPerfDevice ? 520 : 900;
    const maxRadius = viewHeight * 0.85;

    const lineGeo = new THREE.BufferGeometry();
    const linePositions = new Float32Array(rayCount * 2 * 3);
    const lineColors = new Float32Array(rayCount * 2 * 3);

    const pointGeo = new THREE.BufferGeometry();
    const pointPositions = new Float32Array(rayCount * 3);
    const pointColors = new Float32Array(rayCount * 3);

    const rayData = [];

    const pointCanvas = document.createElement('canvas');
    pointCanvas.width = 32;
    pointCanvas.height = 32;
    const ctx = pointCanvas.getContext('2d');
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.35, 'rgba(255,255,255,0.8)');
    gradient.addColorStop(0.65, 'rgba(255,255,255,0.25)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);
    const tex = new THREE.CanvasTexture(pointCanvas);

    const colorPrimary = new THREE.Color('#e5c9a8');
    const colorSecondary = new THREE.Color('#e5c9a8');

    for (let i = 0; i < rayCount; i++) {
        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);

        let dir = new THREE.Vector3(
            Math.sin(phi) * Math.cos(theta),
            Math.cos(phi),
            Math.sin(phi) * Math.sin(theta)
        );

        dir.y = Math.abs(dir.y);
        dir.x *= 1.5;
        dir.normalize();

        const targetLen = (Math.random() * 0.9 + 0.1) * maxRadius;

        rayData.push({
            dir,
            targetLen,
            currentLen: 0,
            speed: 0.1 + Math.random() * 0.2,
            phase: Math.random() * Math.PI * 2,
            driftSpeed: 0.005 + Math.random() * 0.015,
            repulsion: new THREE.Vector3(),
        });

        linePositions[i * 6] = origin.x;
        linePositions[i * 6 + 1] = origin.y;
        linePositions[i * 6 + 2] = origin.z;

        lineColors[i * 6] = colorPrimary.r;
        lineColors[i * 6 + 1] = colorPrimary.g;
        lineColors[i * 6 + 2] = colorPrimary.b;
        lineColors[i * 6 + 3] = colorSecondary.r;
        lineColors[i * 6 + 4] = colorSecondary.g;
        lineColors[i * 6 + 5] = colorSecondary.b;

        pointColors[i * 3] = colorPrimary.r;
        pointColors[i * 3 + 1] = colorPrimary.g;
        pointColors[i * 3 + 2] = colorPrimary.b;
    }

    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    lineGeo.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));

    pointGeo.setAttribute('position', new THREE.BufferAttribute(pointPositions, 3));
    pointGeo.setAttribute('color', new THREE.BufferAttribute(pointColors, 3));

    const lineMat = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: isLowPerfDevice ? 0.18 : 0.22,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });

    const pointMat = new THREE.PointsMaterial({
        vertexColors: true,
        size: isLowPerfDevice ? 0.7 : 0.85,
        map: tex,
        transparent: true,
        opacity: isLowPerfDevice ? 0.65 : 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });

    const lines = new THREE.LineSegments(lineGeo, lineMat);
    const points = new THREE.Points(pointGeo, pointMat);
    scene.add(lines);
    scene.add(points);

    const coreGeo = new THREE.BufferGeometry();
    coreGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([origin.x, origin.y, origin.z]), 3));
    const coreMat = new THREE.PointsMaterial({
        color: colorPrimary,
        size: 18,
        map: tex,
        transparent: true,
        opacity: 0.25,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });
    scene.add(new THREE.Points(coreGeo, coreMat));

    const resizeObserver = new ResizeObserver(() => {
        if (!container.clientWidth || !container.clientHeight) return;
        width = container.clientWidth;
        heightEl = container.clientHeight;

        camera.aspect = width / heightEl;
        camera.updateProjectionMatrix();
        renderer.setSize(width, heightEl);

        const newVFOV = THREE.MathUtils.degToRad(camera.fov);
        viewHeight = 2 * Math.tan(newVFOV / 2) * camera.position.z;
        origin.y = -viewHeight / 2;

        const lPos = lineGeo.attributes.position.array;
        for (let i = 0; i < rayCount; i++) {
            lPos[i * 6 + 1] = origin.y;
        }
        lineGeo.attributes.position.needsUpdate = true;
        coreGeo.attributes.position.array[1] = origin.y;
        coreGeo.attributes.position.needsUpdate = true;
    });
    resizeObserver.observe(container);

    const updateMouse = (x, y) => {
        const rect = container.getBoundingClientRect();
        targetMouse.x = ((x - rect.left) / rect.width) * 2 - 1;
        targetMouse.y = -((y - rect.top) / rect.height) * 2 + 1;
    };

    window.addEventListener('mousemove', (e) => updateMouse(e.clientX, e.clientY), { passive: true });
    window.addEventListener(
        'touchmove',
        (e) => {
            if (e.touches.length > 0) updateMouse(e.touches[0].clientX, e.touches[0].clientY);
        },
        { passive: true }
    );

    let isVisible = true;
    const io = new IntersectionObserver(
        (entries) => {
            isVisible = entries[0]?.isIntersecting ?? true;
        },
        { threshold: 0.01 }
    );
    io.observe(container);

    let time = 0;
    let lastT = performance.now();

    const animate = (t) => {
        requestAnimationFrame(animate);
        if (!isVisible) return;

        const dt = Math.min(0.033, (t - lastT) / 1000);
        lastT = t;
        time += dt;

        mouse.x += (targetMouse.x - mouse.x) * 0.05;
        mouse.y += (targetMouse.y - mouse.y) * 0.05;

        camera.position.x = mouse.x * 2;
        camera.position.y = mouse.y * 2;
        camera.lookAt(origin.x, origin.y + viewHeight / 2, 0);

        raycaster.setFromCamera(mouse, camera);
        raycaster.ray.intersectPlane(plane, intersectionPoint);

        const lPos = lineGeo.attributes.position.array;
        const pPos = pointGeo.attributes.position.array;
        const pCol = pointGeo.attributes.color.array;

        for (let i = 0; i < rayCount; i++) {
            const data = rayData[i];

            if (data.currentLen < data.targetLen) {
                data.currentLen += (data.targetLen - data.currentLen) * data.speed * 0.5;
                if (Math.abs(data.targetLen - data.currentLen) < 0.1) data.currentLen = data.targetLen;
            }

            const driftX = Math.sin(time * data.driftSpeed + data.phase) * 0.15;
            const driftZ = Math.cos(time * data.driftSpeed + data.phase) * 0.15;

            let endX = origin.x + (data.dir.x + driftX) * data.currentLen;
            let endY = origin.y + data.dir.y * data.currentLen;
            let endZ = origin.z + (data.dir.z + driftZ) * data.currentLen;

            if (intersectionPoint) {
                const dx = endX - intersectionPoint.x;
                const dy = endY - intersectionPoint.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const repelRadius = isLowPerfDevice ? 12 : 15;
                if (dist > 0.0001 && dist < repelRadius) {
                    const force = (repelRadius - dist) / repelRadius;
                    data.repulsion.x += (dx / dist) * force * 0.5;
                    data.repulsion.y += (dy / dist) * force * 0.5;
                }
            }

            data.repulsion.multiplyScalar(0.95);
            endX += data.repulsion.x;
            endY += data.repulsion.y;

            lPos[i * 6 + 3] = endX;
            lPos[i * 6 + 4] = endY;
            lPos[i * 6 + 5] = endZ;

            pPos[i * 3] = endX;
            pPos[i * 3 + 1] = endY;
            pPos[i * 3 + 2] = endZ;

            let brightness = 0.55 + Math.sin(time * 3 + data.phase) * 0.25;
            const repelMag = data.repulsion.length();
            if (repelMag > 0.05) brightness += repelMag * 1.1;
            brightness = Math.max(0.2, Math.min(1.0, brightness));

            pCol[i * 3] = colorPrimary.r * brightness;
            pCol[i * 3 + 1] = colorPrimary.g * brightness;
            pCol[i * 3 + 2] = colorPrimary.b * brightness;
        }

        lineGeo.attributes.position.needsUpdate = true;
        pointGeo.attributes.position.needsUpdate = true;
        pointGeo.attributes.color.needsUpdate = true;

        pointMat.opacity = (isLowPerfDevice ? 0.58 : 0.68) + Math.sin(time * 2) * 0.08;
        renderer.render(scene, camera);
    };

    requestAnimationFrame(animate);
}

