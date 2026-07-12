class NexusEngine {
    constructor(mainCtxCanvas, plotCtxCanvas) {
        this.mainCtx = mainCtxCanvas.getContext('2d');
        this.plotCtx = plotCtxCanvas.getContext('2d');
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        
        this.systemSeed = "NEXUS_77_BETA";
        this.CHUNK_SIZE = 500;
        
        this.viewportState = {
            offsetX: 0,
            offsetY: 0,
            zoom: 1,
            width: mainCtxCanvas.width,
            height: mainCtxCanvas.height
        };
    }

    updateViewportSize() {
        this.viewportState.width = this.mainCtx.canvas.width;
        this.viewportState.height = this.mainCtx.canvas.height;
    }

    setDragging(state) {
        this.isDragging = state;
    }

    setLastMousePos(x, y) {
        this.lastMouseX = x;
        this.lastMouseY = y;
    }

    pan(mouseX, mouseY) {
        const dx = mouseX - this.lastMouseX;
        const dy = mouseY - this.lastMouseY;
        
        this.viewportState.offsetX += dx;
        this.viewportState.offsetY += dy;
        
        this.lastMouseX = mouseX;
        this.lastMouseY = mouseY;
    }

    zoom(delta, mouseX, mouseY) {
        const zoomSpeed = 0.001;
        const factor = Math.exp(-delta * zoomSpeed);
        const newZoom = Math.min(Math.max(this.viewportState.zoom * factor, 0.1), 5);
        
        const worldPos = this.screenToWorld(mouseX, mouseY);
        
        this.viewportState.zoom = newZoom;
        
        this.viewportState.offsetX = mouseX - worldPos.x * this.viewportState.zoom;
        this.viewportState.offsetY = mouseY - worldPos.y * this.viewportState.zoom;
    }

    screenToWorld(sx, sy) {
        return {
            x: (sx - this.viewportState.offsetX) / this.viewportState.zoom,
            y: (sy - this.viewportState.offsetY) / this.viewportState.zoom
        };
    }

    worldToScreen(wx, wy) {
        return {
            x: wx * this.viewportState.zoom + this.viewportState.offsetX,
            y: wy * this.viewportState.zoom + this.viewportState.offsetY
        };
    }

    getSectorCoordinate(wx, wy) {
        return {
            cx: Math.floor(wx / this.CHUNK_SIZE),
            cy: Math.floor(wy / this.CHUNK_SIZE)
        };
    }

    generateDeterministicHash(cx, cy) {
        const str = `${this.systemSeed}_${cx}_${cy}`;
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
        }
        return hash;
    }

    getChunkNodes(cx, cy) {
        const seed = this.generateDeterministicHash(cx, cy);
        const nodes = [];
        const nodeCount = (Math.abs(seed) % 4) + 2;
        
        for (let i = 0; i < nodeCount; i++) {
            const nodeSeed = this.generateDeterministicHash(cx + i, cy + seed);
            nodes.push({
                x: (Math.abs(nodeSeed) % this.CHUNK_SIZE),
                y: (Math.abs(nodeSeed >> 2) % this.CHUNK_SIZE),
                id: `${cx}_${cy}_${i}`
            });
        }
        return nodes;
    }

    update() {
    }

    render() {
        this.clear();
        this.drawGrid();
        this.drawSectorBorders();
        this.drawActiveNodes();
    }

    clear() {
        this.mainCtx.fillStyle = '#000';
        this.mainCtx.fillRect(0, 0, this.viewportState.width, this.viewportState.height);
    }

    drawGrid() {
        const ctx = this.mainCtx;
        ctx.strokeStyle = '#3a3626';
        ctx.lineWidth = 1;
        ctx.beginPath();
        
        const gridSize = 50;
        const scaledGrid = gridSize * this.viewportState.zoom;
        
        const startX = this.viewportState.offsetX % scaledGrid;
        const startY = this.viewportState.offsetY % scaledGrid;
        
        for (let x = startX; x < this.viewportState.width; x += scaledGrid) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.viewportState.height);
        }
        
        for (let y = startY; y < this.viewportState.height; y += scaledGrid) {
            ctx.moveTo(0, y);
            ctx.lineTo(this.viewportState.width, y);
        }
        
        ctx.stroke();
    }

    drawSectorBorders() {
        const ctx = this.mainCtx;
        ctx.strokeStyle = '#6b6343';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        const scaledChunk = this.CHUNK_SIZE * this.viewportState.zoom;
        
        const startX = this.viewportState.offsetX % scaledChunk;
        const startY = this.viewportState.offsetY % scaledChunk;
        
        for (let x = startX; x < this.viewportState.width; x += scaledChunk) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.viewportState.height);
        }
        
        for (let y = startY; y < this.viewportState.height; y += scaledChunk) {
            ctx.moveTo(0, y);
            ctx.lineTo(this.viewportState.width, y);
        }
        
        ctx.stroke();
    }

    drawActiveNodes() {
        const ctx = this.mainCtx;
        const topLeft = this.screenToWorld(0, 0);
        const bottomRight = this.screenToWorld(this.viewportState.width, this.viewportState.height);
        
        const startCX = this.getSectorCoordinate(topLeft.x, topLeft.y).cx;
        const startCY = this.getSectorCoordinate(topLeft.x, topLeft.y).cy;
        const endCX = this.getSectorCoordinate(bottomRight.x, bottomRight.y).cx;
        const endCY = this.getSectorCoordinate(bottomRight.x, bottomRight.y).cy;

        ctx.fillStyle = '#ffdf80';
        
        for (let cx = startCX; cx <= endCX; cx++) {
            for (let cy = startCY; cy <= endCY; cy++) {
                const nodes = this.getChunkNodes(cx, cy);
                nodes.forEach(node => {
                    const worldX = cx * this.CHUNK_SIZE + node.x;
                    const worldY = cy * this.CHUNK_SIZE + node.y;
                    const screen = this.worldToScreen(worldX, worldY);
                    
                    ctx.fillRect(screen.x - 2, screen.y - 2, 4, 4);
                });
            }
        }
    }
}
