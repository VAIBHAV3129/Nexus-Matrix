class NexusEngine {
    constructor(mainCtxCanvas, plotCtxCanvas) {
        this.mainCtx = mainCtxCanvas.getContext('2d');
        this.plotCtx = plotCtxCanvas.getContext('2d');
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        
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

    update() {
    }

    render() {
        this.clear();
        this.drawGrid();
        this.drawSectorBorders();
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
}
