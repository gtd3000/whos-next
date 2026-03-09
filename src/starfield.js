export class StarField {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.stars = [];
        this.resize();
        this.generateStars(200);
        this.animate();

        this._onResize = () => this.resize();
        window.addEventListener('resize', this._onResize);
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    generateStars(count) {
        this.stars = Array.from({ length: count }, () => ({
            x: Math.random(),
            y: Math.random(),
            radius: Math.random() * 1.5 + 0.5,
            baseOpacity: Math.random() * 0.6 + 0.2,
            twinkleSpeed: Math.random() * 0.02 + 0.005,
            twinkleOffset: Math.random() * Math.PI * 2,
        }));
    }

    animate() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const time = Date.now() * 0.001;

        for (const star of this.stars) {
            const twinkle = Math.sin(time * star.twinkleSpeed * 10 + star.twinkleOffset);
            const opacity = star.baseOpacity + twinkle * 0.2;

            ctx.beginPath();
            ctx.arc(
                star.x * this.canvas.width,
                star.y * this.canvas.height,
                star.radius,
                0,
                Math.PI * 2
            );
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.05, opacity)})`;
            ctx.fill();
        }

        requestAnimationFrame(() => this.animate());
    }

    destroy() {
        window.removeEventListener('resize', this._onResize);
    }
}
