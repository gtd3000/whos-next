export class SoundEngine {
    constructor() {
        this.ctx = null;
        this.enabled = false;
    }

    enable() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        this.enabled = true;
    }

    disable() {
        this.enabled = false;
    }

    toggle() {
        if (this.enabled) this.disable();
        else this.enable();
        return this.enabled;
    }

    playTick(velocity) {
        if (!this.enabled || !this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        // Higher pitch as wheel slows (lower velocity = higher pitch)
        const freq = 800 + (1 - Math.min(velocity / 0.3, 1)) * 600;
        osc.frequency.value = freq;
        osc.type = 'sine';
        gain.gain.value = 0.08;
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);

        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + 0.06);
    }

    playWhoosh() {
        if (!this.enabled || !this.ctx) return;
        const bufferSize = this.ctx.sampleRate * 0.25;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const source = this.ctx.createBufferSource();
        source.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 500;
        filter.frequency.exponentialRampToValueAtTime(4000, this.ctx.currentTime + 0.2);

        const gain = this.ctx.createGain();
        gain.gain.value = 0.15;
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        source.start();
    }

    playWinnerChime() {
        if (!this.enabled || !this.ctx) return;
        const now = this.ctx.currentTime;

        [523.25, 659.25].forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.frequency.value = freq;
            osc.type = 'sine';
            gain.gain.value = 0;
            gain.gain.linearRampToValueAtTime(0.12, now + i * 0.15 + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.6);

            osc.start(now + i * 0.15);
            osc.stop(now + i * 0.15 + 0.6);
        });
    }
}
