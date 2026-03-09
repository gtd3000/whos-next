/**
 * UI Controller - Manages user interface interactions
 */

import confetti from 'canvas-confetti';
import { saveNames } from './storage.js';

export class UI {
    constructor(onNamesUpdate, onSpin, sound) {
        this.onNamesUpdate = onNamesUpdate;
        this.onSpin = onSpin;
        this.sound = sound;
        this.results = [];

        this.textarea = document.getElementById('namesInput');
        this.resultsContainer = document.getElementById('results');
        this.spinButton = document.getElementById('spinButton');
        this.wheelCanvas = document.getElementById('wheelCanvas');

        this.bindEvents();
        this.displayVersion();
    }

    bindEvents() {
        // Update names when textarea changes
        this.textarea.addEventListener('input', () => {
            const names = this.parseNames();
            this.onNamesUpdate(names);

            // Save to localStorage
            saveNames(names);
        });

        // Spin on button click
        this.spinButton.addEventListener('click', () => this.handleSpin());

        // Spin on canvas click
        this.wheelCanvas.addEventListener('click', () => this.handleSpin());

        // Keyboard shortcut: Ctrl+Enter
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                this.handleSpin();
            }
        });
    }

    parseNames() {
        const text = this.textarea.value;
        return text
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line.length > 0);
    }

    showValidationError(message) {
        let existing = document.querySelector('.validation-error');
        if (existing) existing.remove();

        const el = document.createElement('div');
        el.className = 'validation-error';
        el.setAttribute('role', 'alert');
        el.textContent = message;

        this.textarea.parentNode.insertBefore(el, this.textarea.nextSibling);
        setTimeout(() => el.remove(), 3000);
    }

    async handleSpin() {
        const names = this.parseNames();
        if (names.length === 0) {
            this.showValidationError('Please add at least one name!');
            this.textarea.focus();
            return;
        }

        this.setSpinning(true);
        if (this.sound) this.sound.playWhoosh();
        const winner = await this.onSpin();
        this.setSpinning(false);

        if (winner) {
            // 1. Flash winning segment + chime
            if (this.wheel) this.wheel.flashWinner(winner);
            if (this.sound) this.sound.playWinnerChime();

            // 2. Shockwave at wheel center
            const rect = this.wheelCanvas.getBoundingClientRect();
            const shockwave = document.createElement('div');
            shockwave.className = 'shockwave';
            shockwave.style.left = rect.left + rect.width / 2 + 'px';
            shockwave.style.top = rect.top + rect.height / 2 + 'px';
            shockwave.style.transform = 'translate(-50%, -50%)';
            document.body.appendChild(shockwave);
            setTimeout(() => shockwave.remove(), 600);

            // 3. After 300ms: confetti
            setTimeout(() => this.showConfetti(), 300);

            // 4. After 800ms: show modal
            setTimeout(() => this.showWinnerModal(winner), 800);

            this.addResult(winner);
        }
    }

    setSpinning(isSpinning) {
        this.spinButton.disabled = isSpinning;
        this.spinButton.textContent = isSpinning ? 'Spinning...' : 'Spin the Wheel';
        this.wheelCanvas.style.cursor = isSpinning ? 'wait' : 'pointer';
        this.wheelCanvas.classList.toggle('spinning', isSpinning);
    }

    addResult(winner) {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        this.results.unshift({ winner, time: timeStr });

        // Keep only last 10 results
        if (this.results.length > 10) {
            this.results = this.results.slice(0, 10);
        }

        this.renderResults();
    }

    renderResults() {
        if (this.results.length === 0) {
            this.resultsContainer.innerHTML =
                '<p style="opacity: 0.5; text-align: center;">No spins yet</p>';
            return;
        }

        this.resultsContainer.innerHTML = this.results
            .map(
                ({ winner, time }) => `
        <div class="result-item">
          <span class="result-winner">${this.escapeHtml(winner)}</span>
          <span class="result-time">${time}</span>
        </div>
      `,
            )
            .join('');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Show confetti celebration using canvas-confetti library
     */
    showConfetti() {
        const wheelCanvas = this.wheelCanvas;
        const rect = wheelCanvas.getBoundingClientRect();
        const x = (rect.left + rect.width / 2) / window.innerWidth;
        const y = (rect.top + rect.height / 2) / window.innerHeight;

        const colors = ['#d9584e', '#d9933a', '#998c3d', '#3d9976', '#3d8c99', '#5c7fbf', '#7a5cbf', '#bf5c7a'];

        // V-shaped dual burst
        confetti({ particleCount: 60, angle: 60, spread: 55, origin: { x, y }, colors });
        confetti({ particleCount: 60, angle: 120, spread: 55, origin: { x, y }, colors });
    }

    /**
     * Show winner modal announcement
     */
    showWinnerModal(winner) {
        this._previouslyFocused = document.activeElement;

        const modal = document.createElement('div');
        modal.className = 'winner-modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-label', `Winner: ${winner}`);
        modal.innerHTML = `
            <div class="winner-modal-content">
                <div class="winner-emoji" aria-hidden="true">🎉</div>
                <h2>Winner!</h2>
                <div class="winner-name"></div>
                <button class="winner-modal-close">Awesome!</button>
            </div>
        `;

        document.body.appendChild(modal);

        const nameEl = modal.querySelector('.winner-name');
        nameEl.textContent = '';
        nameEl.style.borderRight = '2px solid var(--color-nebula)';

        let i = 0;
        const typeInterval = setInterval(() => {
            if (i < winner.length) {
                nameEl.textContent += winner[i];
                i++;
            } else {
                clearInterval(typeInterval);
                setTimeout(() => {
                    nameEl.style.borderRight = 'none';
                }, 500);
            }
        }, 60);

        const closeButton = modal.querySelector('.winner-modal-close');

        const closeModal = () => {
            modal.style.opacity = '0';
            setTimeout(() => {
                modal.remove();
                if (this._previouslyFocused) {
                    this._previouslyFocused.focus();
                }
            }, 300);
        };

        closeButton.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeModal();
                return;
            }
            if (e.key === 'Tab') {
                e.preventDefault();
                closeButton.focus();
            }
        });

        closeButton.focus();
    }

    displayVersion() {
        const versionEl = document.createElement('div');
        versionEl.className = 'app-version';
        // __APP_VERSION__ is defined in vite.config.js
        versionEl.textContent = `v${__APP_VERSION__}`;
        versionEl.style.position = 'fixed';
        versionEl.style.bottom = '10px';
        versionEl.style.right = '10px';
        versionEl.style.opacity = '0.5';
        versionEl.style.fontSize = '12px';
        versionEl.style.pointerEvents = 'none';
        document.body.appendChild(versionEl);
    }
}
