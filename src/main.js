import './style.css';
import { Wheel } from './wheel.js';
import { UI } from './ui.js';
import { loadNames } from './storage.js';
import { StarField } from './starfield.js';
import { SoundEngine } from './sound.js';
import { ParticleMotes } from './particles.js';

/**
 * Who's Next - Main Application
 */

class App {
    constructor() {
        this.setupHTML();
        this.wheel = null;
        this.ui = null;
        this.init();
    }

    setupHTML() {
        const savedNames = loadNames();
        const namesText = savedNames.join('\n');

        if (!document.getElementById('starfield')) {
            const starCanvas = document.createElement('canvas');
            starCanvas.id = 'starfield';
            starCanvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:-2;pointer-events:none;';
            document.body.prepend(starCanvas);
        }

        document.querySelector('#app').innerHTML = `
      <div class="wheel-container">
        <div class="wheel-wrapper">
          <canvas id="wheelCanvas"></canvas>
          <svg class="wheel-pointer" viewBox="0 0 40 50" width="40" height="50">
            <path d="M0 25 L35 10 L35 40 Z" fill="hsl(175, 80%, 45%)" stroke="hsl(0, 0%, 94%)" stroke-width="1.5"/>
          </svg>
        </div>
        <p class="spin-instruction">Click to spin or press <kbd>Ctrl/⌘+Enter</kbd></p>
      </div>
      
      <aside class="sidebar">
        <div>
          <h2>✏️ Names</h2>
          <textarea 
            id="namesInput" 
            class="names-input" 
            placeholder="Enter names (one per line)&#10;Alice&#10;Bob&#10;Charlie&#10;David">${namesText}</textarea>
        </div>
        
        <button id="spinButton" class="btn">Spin the Wheel</button>
        
        <div class="results">
          <h3>🎉 Recent Winners</h3>
          <div id="results">
            <p style="opacity: 0.5; text-align: center;">No spins yet</p>
          </div>
        </div>
        <button id="soundToggle" class="sound-toggle" aria-label="Toggle sound" title="Toggle sound">🔇</button>
      </aside>
    `;
    }

    init() {
        const canvas = document.getElementById('wheelCanvas');
        this.sound = new SoundEngine();

        const ui = new UI(
            (names) => this.updateNames(names),
            () => this.spin(),
            this.sound,
        );

        const initialNames = ui.parseNames();
        this.wheel = new Wheel(canvas, initialNames);
        this.wheel.onTick = (velocity) => {
            const pointer = document.querySelector('.wheel-pointer');
            if (pointer) {
                pointer.classList.add('tick');
                setTimeout(() => pointer.classList.remove('tick'), 50);
            }
            this.sound.playTick(velocity);
        };
        this.ui = ui;
        this.ui.wheel = this.wheel;
        this.starfield = new StarField(document.getElementById('starfield'));
        this.particles = new ParticleMotes();

        document.getElementById('soundToggle').addEventListener('click', () => {
            const enabled = this.sound.toggle();
            document.getElementById('soundToggle').textContent = enabled ? '🔊' : '🔇';
        });
    }

    updateNames(names) {
        if (this.wheel) {
            this.wheel.updateNames(names);
        }
    }

    async spin() {
        if (this.wheel) {
            return await this.wheel.spin();
        }
        return null;
    }
}

// Start the application
new App();
