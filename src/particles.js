export class ParticleMotes {
    constructor() {
        this.motes = [];
        this.container = document.createElement('div');
        this.container.style.cssText =
            'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:-1;overflow:hidden;';
        document.body.appendChild(this.container);
        this.spawn(7);
    }

    spawn(count) {
        for (let i = 0; i < count; i++) {
            const mote = document.createElement('div');
            const size = Math.random() * 3 + 2;
            const duration = Math.random() * 20 + 25;
            const delay = Math.random() * -30;
            const startX = Math.random() * 100;
            const startY = Math.random() * 100;
            const driftX = (Math.random() - 0.5) * 200;
            const driftY = (Math.random() - 0.5) * 200;

            mote.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                border-radius: 50%;
                background: hsla(175, 80%, 45%, ${Math.random() * 0.3 + 0.1});
                left: ${startX}%;
                top: ${startY}%;
                animation: mote-float ${duration}s linear ${delay}s infinite;
                --drift-x: ${driftX}px;
                --drift-y: ${driftY}px;
            `;
            this.container.appendChild(mote);
            this.motes.push(mote);
        }
    }

    destroy() {
        this.container.remove();
    }
}
