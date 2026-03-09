/**
 * Wheel Engine - Canvas-based spinning wheel with physics simulation
 */

export class Wheel {
    constructor(canvas, names) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.names = names;
        this.rotation = 0;
        this.angularVelocity = 0;
        this.isSpinning = false;
        this.friction = 0.99; // Adjusted for ~5 second spin
        this.minVelocity = 0.002; // Stop sooner to avoid long crawl

        this._resizeRAF = null;
        this._onResize = () => {
            if (this._resizeRAF) return;
            this._resizeRAF = requestAnimationFrame(() => {
                this._resizeRAF = null;
                this.resize();
            });
        };

        this.resize();
        window.addEventListener('resize', this._onResize);

        this.draw();
    }

    resize() {
        const size = Math.min(window.innerWidth * 0.5, window.innerHeight * 0.7, 600);
        this.canvas.width = size;
        this.canvas.height = size;
        this.radius = size / 2;
        this.draw();
    }

    updateNames(names) {
        this.names = names;
        this.draw();
    }

    /**
     * Flash the winning segment briefly
     */
    flashWinner(winner) {
        this._flashWinner = winner;
        this.draw();
        setTimeout(() => {
            this._flashWinner = null;
            this.draw();
        }, 600);
    }

    /**
     * Generate truly random angular velocity using crypto API
     */
    generateRandomVelocity() {
        const array = new Uint32Array(1);
        crypto.getRandomValues(array);
        // Map to velocity between 0.3 and 0.5 radians per frame
        return (array[0] / 0xffffffff) * 0.2 + 0.3;
    }

    spin() {
        if (this.isSpinning || this.names.length === 0) return null;

        this.isSpinning = true;
        const targetVelocity = this.generateRandomVelocity();

        return new Promise((resolve) => {
            this.onSpinComplete = resolve;
            // Wind-up: rotate backward briefly
            const windupDuration = 200;
            const windupStart = performance.now();
            const windupAngle = -0.15;

            const windUp = (now) => {
                const t = typeof now === 'number' && !isNaN(now) ? now : performance.now();
                const elapsed = t - windupStart;
                const progress = Math.min(elapsed / windupDuration, 1);
                const eased = progress * (2 - progress); // ease-out
                const delta = (windupAngle / windupDuration) * 16 * (1 - eased);
                this.rotation += Number.isFinite(delta) ? delta : 0;
                this.draw();

                if (progress < 1) {
                    requestAnimationFrame(windUp);
                } else {
                    this.angularVelocity = targetVelocity;
                    this.animate();
                }
            };
            requestAnimationFrame(windUp);
        });
    }

    animate() {
        if (!this.isSpinning) return;

        this.angularVelocity *= this.friction;
        this.rotation += this.angularVelocity;

        // Detect segment crossing for tick
        if (this.names.length > 0) {
            const segAngle = (Math.PI * 2) / this.names.length;
            const norm = ((this.rotation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
            const currentSeg = Math.floor(norm / segAngle);
            if (this._lastSegment !== undefined && currentSeg !== this._lastSegment) {
                if (this.onTick) this.onTick(this.angularVelocity);
            }
            this._lastSegment = currentSeg;
        }

        if (this.angularVelocity < this.minVelocity) {
            this.isSpinning = false;
            this.angularVelocity = 0;
            this._lastSegment = undefined;
            this.draw();
            const winner = this.getWinner();
            if (this.onSpinComplete) this.onSpinComplete(winner);
        } else {
            this.draw();
            requestAnimationFrame(() => this.animate());
        }
    }

    /**
     * Get the winning name based on current rotation
     */
    getWinner() {
        if (this.names.length === 0) return null;

        // Normalize rotation to 0-2π
        const normalizedRotation = ((this.rotation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);

        // Calculate which segment is at the pointer (right side, middle)
        // Since we draw clockwise from top, the pointer at 0° (right) corresponds to index
        const segmentAngle = (Math.PI * 2) / this.names.length;
        // Pointer is at the right (0 radians), but segments start from the top (-π/2),
        // so the pointer maps to π/2 in segment coordinates.
        const pointerAngle = Math.PI / 2;

        // Calculate the relative angle from top
        const relativeAngle = (pointerAngle - normalizedRotation + Math.PI * 2) % (Math.PI * 2);

        // Find which segment this falls into
        const winningIndex = Math.floor(relativeAngle / segmentAngle);

        return this.names[winningIndex];
    }

    /**
     * Draw the wheel
     */
    draw() {
        const ctx = this.ctx;
        const canvas = this.canvas;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (this.names.length === 0) {
            this.drawEmptyState();
            return;
        }

        // Save context
        ctx.save();

        // Move to center and rotate
        ctx.translate(this.radius, this.radius);
        ctx.rotate(this.rotation);

        // Draw segments
        const segmentAngle = (Math.PI * 2) / this.names.length;
        const colors = this.getSegmentColors();

        this.names.forEach((name, i) => {
            const startAngle = i * segmentAngle - Math.PI / 2; // Start from top
            const endAngle = startAngle + segmentAngle;

            // Draw segment with radial gradient (lighter at outer edge)
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, this.radius, startAngle, endAngle);
            ctx.closePath();

            const baseColor = colors[i % colors.length];
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius);
            gradient.addColorStop(0, baseColor);
            gradient.addColorStop(1, this.lightenColor(baseColor, 15));
            ctx.fillStyle = gradient;
            ctx.fill();

            // White divider with glow
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 2;
            ctx.shadowBlur = 4;
            ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Draw text
            ctx.save();
            ctx.rotate(startAngle + segmentAngle / 2);
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';

            const color = colors[i % colors.length];
            const isLight = Wheel.isLightColor(color);
            ctx.fillStyle = isLight ? '#000' : '#fff';

            ctx.font = `bold ${Math.min(20, this.radius / 15)}px Outfit, sans-serif`;

            ctx.shadowColor = isLight ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)';
            ctx.shadowBlur = 6;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;

            // Truncate long names
            const maxLength = 15;
            const displayName = name.length > maxLength ? name.slice(0, maxLength) + '...' : name;
            ctx.fillText(displayName, this.radius * 0.85, 0);
            ctx.restore();

            // Flash glow on winning segment
            if (this._flashWinner && name === this._flashWinner) {
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.arc(0, 0, this.radius, startAngle, endAngle);
                ctx.closePath();
                ctx.fillStyle = 'hsla(175, 80%, 55%, 0.4)';
                ctx.fill();
            }
        });

        // Draw outer ring (teal gradient stroke)
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.lineWidth = 8;
        const ringGradient = ctx.createLinearGradient(-this.radius, 0, this.radius, 0);
        ringGradient.addColorStop(0, 'hsl(175, 80%, 35%)');
        ringGradient.addColorStop(0.5, this.isSpinning ? 'hsl(175, 80%, 55%)' : 'hsl(175, 80%, 45%)');
        ringGradient.addColorStop(1, 'hsl(175, 80%, 35%)');
        ctx.strokeStyle = ringGradient;
        ctx.stroke();

        // Center hub: dark fill
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.18, 0, Math.PI * 2);
        ctx.fillStyle = 'hsl(230, 30%, 12%)';
        ctx.fill();

        // Center hub: teal stroke ring + breathing glow when idle
        if (!this.isSpinning) {
            const breathe = Math.sin(Date.now() * 0.001) * 0.15 + 0.45;
            ctx.shadowColor = `hsla(175, 80%, 45%, ${breathe})`;
            ctx.shadowBlur = 20;
        }
        ctx.strokeStyle = 'hsl(175, 80%, 45%)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.18, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Center hub: "SPIN" text when not spinning
        if (!this.isSpinning) {
            ctx.fillStyle = 'hsl(175, 80%, 55%)';
            ctx.font = `bold ${Math.min(14, this.radius / 25)}px Space Mono, monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('SPIN', 0, 0);
        }

        ctx.restore();
    }

    lightenColor(hslString, amount) {
        const match = hslString.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
        if (!match) return hslString;
        const h = parseInt(match[1], 10);
        const s = parseInt(match[2], 10);
        const l = Math.min(100, parseInt(match[3], 10) + amount);
        return `hsl(${h}, ${s}%, ${l}%)`;
    }

    drawEmptyState() {
        const ctx = this.ctx;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.beginPath();
        ctx.arc(this.radius, this.radius, this.radius * 0.9, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '24px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Add names to spin', this.radius, this.radius);
    }

    /**
     * Get vibrant segment colors
     */
    destroy() {
        this.isSpinning = false;
        window.removeEventListener('resize', this._onResize);
        if (this._resizeRAF) {
            cancelAnimationFrame(this._resizeRAF);
            this._resizeRAF = null;
        }
    }

    /**
     * Parse an HSL string and determine if it's a "light" color.
     * Uses the W3C relative luminance threshold of lightness > 60%.
     */
    static isLightColor(hslString) {
        const match = hslString.match(/hsl\(\s*(\d+),\s*(\d+)%,\s*(\d+)%\)/);
        if (!match) return false;
        const l = parseInt(match[3], 10);
        return l >= 55;
    }

    getSegmentColors() {
        return [
            'hsl(10, 75%, 55%)',
            'hsl(35, 80%, 52%)',
            'hsl(55, 65%, 48%)',
            'hsl(160, 55%, 42%)',
            'hsl(185, 60%, 40%)',
            'hsl(215, 50%, 50%)',
            'hsl(265, 45%, 52%)',
            'hsl(340, 55%, 52%)',
        ];
    }
}
