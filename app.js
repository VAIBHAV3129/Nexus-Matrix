const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const coordDisp = document.getElementById('coord-val');
const nodeDisp = document.getElementById('node-val');

let width, height;
let userNodes = [];
let seed = "NEXUS_PROTOTYPE_01";
let chunkSize = 500;
let offset = { x: 0, y: 0 };
let zoom = 1;
let isDragging = false;
let lastMouse = { x: 0, y: 0 };

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight - 30;
}

function screenToWorld(sx, sy) {
    return {
        x: (sx - offset.x) / zoom,
        y: (sy - offset.y) / zoom
    };
}

function worldToScreen(wx, wy) {
    return {
        x: wx * zoom + offset.x,
        y: wy * zoom + offset.y
    };
}

function hash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
        h = ((h << 5) - h) + str.charCodeAt(i);
        h |= 0;
    }
    return h;
}

function getChunkNodes(cx, cy) {
    const chunkSeed = hash(`${seed}_${cx}_${cy}`);
    const count = (Math.abs(chunkSeed) % 3) + 1;
    const nodes = [];
    
    for (let i = 0; i < count; i++) {
        const nSeed = hash(`${seed}_${cx}_${cy}_${i}`);
        nodes.push({
            x: (Math.abs(nSeed) % chunkSize),
            y: (Math.abs((nSeed >> 8) % chunkSize)),
            id: `${cx}_${cy}_${i}`
        });
    }
    return nodes;
}

window.addEventListener('resize', resize);
resize();

canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) {
        const world = screenToWorld(e.clientX, e.clientY - 30);
        userNodes.push(world);
        nodeDisp.textContent = userNodes.length;
    }
    if (e.button === 1 || e.shiftKey) {
        isDragging = true;
        lastMouse = { x: e.clientX, y: e.clientY };
    }
});

window.addEventListener('mouseup', () => isDragging = false);

window.addEventListener('mousemove', (e) => {
    const world = screenToWorld(e.clientX, e.clientY - 30);
    coordDisp.textContent = `${world.x.toFixed(0)}, ${world.y.toFixed(0)}`;

    if (isDragging) {
        offset.x += e.clientX - lastMouse.x;
        offset.y += e.clientY - lastMouse.y;
        lastMouse = { x: e.clientX, y: e.clientY };
    }
});

canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const world = screenToWorld(e.clientX, e.clientY - 30);
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    zoom *= factor;
    offset.x = e.clientX - world.x * zoom;
    offset.y = (e.clientY - 30) - world.y * zoom;
}, { passive: false });

function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    const step = 100 * zoom;
    ctx.strokeStyle = '#1a1c17';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = offset.x % step; x < width; x += step) {
        ctx.moveTo(x, 0); ctx.lineTo(x, height);
    }
    for (let y = offset.y % step; y < height; y += step) {
        ctx.moveTo(0, y); ctx.lineTo(width, y);
    }
    ctx.stroke();

    const topLeft = screenToWorld(0, 0);
    const bottomRight = screenToWorld(width, height);
    const startCX = Math.floor(topLeft.x / chunkSize);
    const startCY = Math.floor(topLeft.y / chunkSize);
    const endCX = Math.floor(bottomRight.x / chunkSize);
    const endCY = Math.floor(bottomRight.y / chunkSize);

    let activeNodes = [];

    for (let cx = startCX; cx <= endCX; cx++) {
        for (let cy = startCY; cy <= endCY; cy++) {
            const chunkNodes = getChunkNodes(cx, cy);
            chunkNodes.forEach(n => {
                activeNodes.push({
                    x: cx * chunkSize + n.x,
                    y: cy * chunkSize + n.y
                });
            });
        }
    }
    
    const allNodes = [...activeNodes, ...userNodes];
    nodeDisp.textContent = allNodes.length;

    ctx.strokeStyle = '#4a4d3f';
    for (let i = 0; i < allNodes.length; i++) {
        for (let j = i + 1; j < allNodes.length; j++) {
            const dx = allNodes[i].x - allNodes[j].x;
            const dy = allNodes[i].y - allNodes[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 200) {
                const p1 = worldToScreen(allNodes[i].x, allNodes[i].y);
                const p2 = worldToScreen(allNodes[j].x, allNodes[j].y);
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }
        }
    }

    ctx.fillStyle = '#ffdf80';
    allNodes.forEach(n => {
        const p = worldToScreen(n.x, n.y);
        ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    });

    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    for (let i = 0; i < height; i += 4) {
        ctx.fillRect(0, i, width, 1);
    }

    requestAnimationFrame(draw);
}

draw();
