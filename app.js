const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const coordDisp = document.getElementById('coord-val');
const nodeDisp = document.getElementById('node-val');
const saveBtn = document.getElementById('save-btn');
const toggleGen = document.getElementById('toggle-gen');
const undoBtn = document.getElementById('undo-btn');
const redoBtn = document.getElementById('redo-btn');
const clearBtn = document.getElementById('clear-btn');
const zoomInBtn = document.getElementById('zoom-in');
const zoomOutBtn = document.getElementById('zoom-out');
const rotInput = document.getElementById('rot-val');
const exportBtn = document.getElementById('export-btn');
const importBtn = document.getElementById('import-btn');
const importInput = document.getElementById('import-input');
const seedInput = document.getElementById('seed-input');

let width, height;
let userNodes = [];
let history = [];
let redoStack = [];
let seed = "NEXUS_PROTOTYPE_01";
let chunkSize = 500;
let offset = { x: 0, y: 0 };
let zoom = 1;
let rotation = 0;
let isDragging = false;
let isDrawing = false;
let lastMouse = { x: 0, y: 0 };
let chunkCache = {};

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight - 40;
}

function screenToWorld(sx, sy) {
    const tx = sx - offset.x;
    const ty = (sy - 40) - offset.y;
    const rad = -rotation * Math.PI / 180;
    const rx = (tx * Math.cos(rad) - ty * Math.sin(rad)) / zoom;
    const ry = (tx * Math.sin(rad) + ty * Math.cos(rad)) / zoom;
    return { x: rx, y: ry };
}

function worldToScreen(wx, wy) {
    const rad = rotation * Math.PI / 180;
    const rx = (wx * Math.cos(rad) - wy * Math.sin(rad)) * zoom;
    const ry = (wx * Math.sin(rad) + wy * Math.cos(rad)) * zoom;
    return { x: rx + offset.x, y: ry + offset.y };
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
    const key = `${cx},${cy}`;
    if (chunkCache[key]) return chunkCache[key];
    const chunkSeed = hash(`${seed}_${cx}_${cy}`);
    const count = (Math.abs(chunkSeed) % 3) + 1;
    const nodes = [];
    for (let i = 0; i < count; i++) {
        const nSeed = hash(`${seed}_${cx}_${cy}_${i}`);
        nodes.push({ x: (Math.abs(nSeed) % chunkSize), y: (Math.abs((nSeed >> 8) % chunkSize)) });
    }
    chunkCache[key] = nodes;
    return nodes;
}

function saveState() {
    history.push(JSON.stringify(userNodes));
    if (history.length > 50) history.shift();
    redoStack = [];
}

function persist() {
    const state = { userNodes, offset, zoom, rotation, seed };
    localStorage.setItem('nexus_matrix_state', JSON.stringify(state));
}

function loadState() {
    const raw = localStorage.getItem('nexus_matrix_state');
    if (!raw) return;
    try {
        const state = JSON.parse(raw);
        userNodes = state.userNodes || [];
        offset = state.offset || { x: 0, y: 0 };
        zoom = state.zoom !== undefined ? state.zoom : 1;
        rotation = state.rotation !== undefined ? state.rotation : 0;
        seed = state.seed || "NEXUS_PROTOTYPE_01";
        rotInput.value = rotation;
        seedInput.value = seed;
    } catch (e) {
        console.error("STATE_LOAD_FAIL");
    }
}

window.addEventListener('resize', resize);
resize();
loadState();

canvas.addEventListener('contextmenu', (e) => e.preventDefault());

canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) {
        saveState();
        isDrawing = true;
        const world = screenToWorld(e.clientX, e.clientY);
        userNodes.push(world);
    }
    if (e.button === 2 || e.button === 1 || e.shiftKey) {
        isDragging = true;
        lastMouse = { x: e.clientX, y: e.clientY };
    }
});

window.addEventListener('mouseup', () => {
    if (isDrawing || isDragging) persist();
    isDrawing = false;
    isDragging = false;
});

window.addEventListener('mousemove', (e) => {
    const world = screenToWorld(e.clientX, e.clientY);
    coordDisp.textContent = `${world.x.toFixed(0)}, ${world.y.toFixed(0)}`;
    if (isDrawing) {
        const last = userNodes[userNodes.length - 1];
        if (Math.hypot(world.x - last.x, world.y - last.y) > 15) userNodes.push(world);
    }
    if (isDragging) {
        offset.x += e.clientX - lastMouse.x;
        offset.y += e.clientY - lastMouse.y;
        lastMouse = { x: e.clientX, y: e.clientY };
    }
});

canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const world = screenToWorld(e.clientX, e.clientY);
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    zoom *= factor;
    const s = worldToScreen(world.x, world.y);
    offset.x -= (s.x - e.clientX);
    offset.y -= (s.y - (e.clientY - 40));
}, { passive: false });

undoBtn.addEventListener('click', () => {
    if (history.length > 0) {
        redoStack.push(JSON.stringify(userNodes));
        userNodes = JSON.parse(history.pop());
        persist();
    }
});

redoBtn.addEventListener('click', () => {
    if (redoStack.length > 0) {
        history.push(JSON.stringify(userNodes));
        userNodes = JSON.parse(redoStack.pop());
        persist();
    }
});

clearBtn.addEventListener('click', () => {
    saveState();
    userNodes = [];
    persist();
});

zoomInBtn.addEventListener('click', () => { zoom *= 1.2; persist(); });
zoomOutBtn.addEventListener('click', () => { zoom *= 0.8; persist(); });
rotInput.addEventListener('input', () => { 
    rotation = parseInt(rotInput.value) || 0; 
    persist(); 
});

seedInput.addEventListener('input', () => {
    seed = seedInput.value;
    chunkCache = {};
    persist();
});

exportBtn.addEventListener('click', () => {
    const data = JSON.stringify({ userNodes, seed, zoom, rotation });
    const blob = new Blob([data], { type: 'application/json' });
    const link = document.createElement('a');
    link.download = `nexus_world_${Date.now()}.json`;
    link.href = URL.createObjectURL(blob);
    link.click();
});

importBtn.addEventListener('click', () => importInput.click());

importInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const state = JSON.parse(event.target.result);
            saveState();
            userNodes = state.userNodes || [];
            seed = state.seed || seed;
            zoom = state.zoom !== undefined ? state.zoom : zoom;
            rotation = state.rotation !== undefined ? state.rotation : rotation;
            rotInput.value = rotation;
            seedInput.value = seed;
            persist();
        } catch (err) {
            alert("IMPORT_FAILED: Invalid JSON");
        }
    };
    reader.readAsText(file);
});

saveBtn.addEventListener('click', () => {
    if (userNodes.length === 0) return;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    userNodes.forEach(n => {
        minX = Math.min(minX, n.x); maxX = Math.max(maxX, n.x);
        minY = Math.min(minY, n.y); maxY = Math.max(maxY, n.y);
    });
    const pad = 100;
    const w = (maxX - minX) + pad * 2;
    const h = (maxY - minY) + pad * 2;
    const offCanvas = document.createElement('canvas');
    offCanvas.width = w; offCanvas.height = h;
    const octx = offCanvas.getContext('2d');
    octx.fillStyle = '#000';
    octx.fillRect(0, 0, w, h);
    octx.strokeStyle = '#4a4d3f';
    for (let i = 0; i < userNodes.length; i++) {
        for (let j = i + 1; j < userNodes.length; j++) {
            if (Math.hypot(userNodes[i].x - userNodes[j].x, userNodes[i].y - userNodes[j].y) < 200) {
                octx.beginPath();
                octx.moveTo(userNodes[i].x - minX + pad, userNodes[i].y - minY + pad);
                octx.lineTo(userNodes[j].x - minX + pad, userNodes[j].y - minY + pad);
                octx.stroke();
            }
        }
    }
    octx.fillStyle = '#ffdf80';
    userNodes.forEach(n => octx.fillRect(n.x - minX + pad - 2, n.y - minY + pad - 2, 4, 4));
    const link = document.createElement('a');
    link.download = `nexus_work_${Date.now()}.png`;
    link.href = offCanvas.toDataURL();
    link.click();
});

function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    const step = 100 * zoom;
    ctx.strokeStyle = '#1a1c17';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = offset.x % step; x < width; x += step) { ctx.moveTo(x, 0); ctx.lineTo(x, height); }
    for (let y = offset.y % step; y < height; y += step) { ctx.moveTo(0, y); ctx.lineTo(width, y); }
    ctx.stroke();

    let allVisible = [...userNodes];
    if (toggleGen.checked) {
        const topLeft = screenToWorld(0, 0);
        const bottomRight = screenToWorld(width, height);
        for (let cx = Math.floor(topLeft.x / chunkSize); cx <= Math.floor(bottomRight.x / chunkSize); cx++) {
            for (let cy = Math.floor(topLeft.y / chunkSize); cy <= Math.floor(bottomRight.y / chunkSize); cy++) {
                getChunkNodes(cx, cy).forEach(n => allVisible.push({ x: cx * chunkSize + n.x, y: cy * chunkSize + n.y }));
            }
        }
    }
    nodeDisp.textContent = allVisible.length;
    ctx.strokeStyle = '#4a4d3f';
    for (let i = 0; i < allVisible.length; i++) {
        const n1 = allVisible[i];
        for (let j = i + 1; j < allVisible.length; j++) {
            const n2 = allVisible[j];
            if (Math.hypot(n1.x - n2.x, n1.y - n2.y) < 200) {
                const p1 = worldToScreen(n1.x, n1.y), p2 = worldToScreen(n2.x, n2.y);
                ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
            }
        }
    }
    ctx.fillStyle = '#ffdf80';
    allVisible.forEach(n => {
        const p = worldToScreen(n.x, n.y);
        ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    });
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    for (let i = 0; i < height; i += 4) { ctx.fillRect(0, i, width, 1); }
    requestAnimationFrame(draw);
}
draw();
