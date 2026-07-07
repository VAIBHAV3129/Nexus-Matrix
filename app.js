const UI = {
    clock: document.getElementById('clock-readout'),
    latency: document.getElementById('latency-readout'),
    coords: document.getElementById('coord-readout'),
    nodeCount: document.getElementById('node-count'),
    linkCount: document.getElementById('link-count'),
    entropy: document.getElementById('entropy-val'),
    buffer: document.getElementById('buffer-val'),
    mainCanvas: document.getElementById('main-viewport'),
    plotCanvas: document.getElementById('plotter-canvas')
};

const App = {
    init() {
        this.setupCanvases();
        this.startClock();
        this.bindEvents();
        this.bootEngine();
    },

    setupCanvases() {
        UI.mainCanvas.width = UI.mainCanvas.clientWidth;
        UI.mainCanvas.height = UI.mainCanvas.clientHeight;
        UI.plotCanvas.width = UI.plotCanvas.clientWidth;
        UI.plotCanvas.height = UI.plotCanvas.clientHeight;
    },

    startClock() {
        setInterval(() => {
            const now = new Date();
            UI.clock.textContent = now.toTimeString().split(' ')[0];
        }, 1000);
    },

    bindEvents() {
        window.addEventListener('resize', () => {
            this.setupCanvases();
            window.NexusCore.updateViewportSize();
        });

        UI.mainCanvas.addEventListener('mousedown', (e) => {
            window.NexusCore.setDragging(true);
            window.NexusCore.setLastMousePos(e.clientX, e.clientY);
        });

        window.addEventListener('mouseup', () => {
            window.NexusCore.setDragging(false);
        });

        window.addEventListener('mousemove', (e) => {
            if (window.NexusCore.isDragging) {
                window.NexusCore.pan(e.clientX, e.clientY);
            }
            const worldPos = window.NexusCore.screenToWorld(e.clientX, e.clientY);
            UI.coords.textContent = `${worldPos.x.toFixed(2)}, ${worldPos.y.toFixed(2)}`;
        });

        UI.mainCanvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            window.NexusCore.zoom(e.deltaY, e.clientX, e.clientY);
        }, { passive: false });
    },

    bootEngine() {
        window.NexusCore = new NexusEngine(UI.mainCanvas, UI.plotCanvas);
        this.loop();
    },

    loop() {
        window.NexusCore.update();
        window.NexusCore.render();
        requestAnimationFrame(() => this.loop());
    }
};

window.onload = () => App.init();
