const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const coordDisp = document.getElementById('coord-val');
const nodeDisp = document.getElementById('node-val');

let width, height;
let nodes = [];
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

window.addEventListener('resize', resize);
resize();

canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) {
        const world = screenToWorld(e.clientX, e.clientY - 30);
        nodes.push(world);
        nodeDisp.textContent = nodes.length;
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

    ctx.strokeStyle = '#4a4d3f';
    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            const dx = nodes[i].x - nodes[j].x;
            const dy = nodes[i].y - nodes[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 300) {
                const p1 = worldToScreen(nodes[i].x, nodes[i].y);
                const p2 = worldToScreen(nodes[j].x, nodes[j].y);
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }
        }
    }

    ctx.fillStyle = '#ffdf80';
    nodes.forEach(n => {
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
