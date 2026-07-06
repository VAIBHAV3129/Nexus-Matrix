class NexusEngine {
    constructor(mainCtxCanvas, plotCtxCanvas) {
        this.mainCtx = mainCtxCanvas.getContext('2d');
        this.plotCtx = plotCtxCanvas.getContext('2d');
        this.viewportState = {
            x: 0,
            y: 0,
            zoom: 1,
            width: mainCtxCanvas.width,
            height: mainCtxCanvas.height
        };
    }

    update() {
    }

    render() {
        this.clear();
        this.drawGrid();
    }

    clear() {
        this.mainCtx.fillStyle = '#000';
        this.mainCtx.fillRect(0, 0, this.viewportState.width, this.viewportState.height);
    }

    drawGrid() {
        const ctx = this.mainCtx;
        ctx.strokeStyle = '#3d4231';
        ctx.lineWidth = 1;
        ctx.beginPath();
        
        const step = 50 * this.viewportState.zoom;
        
        for (let x = 0; x < this.viewportState.width; x += step) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.viewportState.height);
        }
        
        for (let y = 0; y < this.viewportState.height; y += step) {
            ctx.moveTo(0, y);
            ctx.lineTo(this.viewportState.width, y);
        }
        
        ctx.stroke();
    }
}
