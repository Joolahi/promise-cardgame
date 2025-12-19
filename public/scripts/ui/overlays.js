/**
 * overlays.js - Tauko-overlay ja ilmoitukset
 */
import { GameState } from '../game/state.js';
import { escapeHtml } from '../utils.js';

let pauseTimer = null;

export function showPauseOverlay(reason, timeRemaining) {
    const overlay = document.getElementById('pauseOverlay');
    const reasonEl = document.getElementById('pauseReason');
    const timeEl = document.getElementById('pauseTimeRemaining');
    
    reasonEl.textContent = reason || 'Pelaaja irtosi - odotetaan...';
    timeEl.textContent = timeRemaining || 120;
    
    overlay.classList.remove('hidden');
    
    if (pauseTimer) clearInterval(pauseTimer);
    
    let remaining = timeRemaining || 120;
    pauseTimer = setInterval(() => {
        remaining--;
        timeEl.textContent = remaining;
        
        if (remaining <= 0) {
            clearInterval(pauseTimer);
            pauseTimer = null;  // LISÄTTY
        }
    }, 1000);
}

export function hidePauseOverlay() {
    const overlay = document.getElementById('pauseOverlay');
    overlay.classList.add('hidden');
    
    if (pauseTimer) {
        clearInterval(pauseTimer);
        pauseTimer = null;
    }
    // POISTETTU: pauseTimeRemaining = 0; (tätä muuttujaa ei ole!)
}