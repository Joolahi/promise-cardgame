/**
 * results.js
 */

import { GameState } from '../game/state.js';
import { escapeHtml, showScreen } from '../utils.js';
import { clearPlayerSession } from '../session.js';

export function renderResults() {
    const container = document.getElementById('resultsContent');
    container.innerHTML = '';

    GameState.gameState.players.forEach((player, i) => {
        const bid = GameState.gameState.bids[i];
        const tricks = GameState.gameState.tricks[i];
        const success = bid === tricks;

        const div = document.createElement('div');
        div.className = `result-item ${success ? 'success' : 'failure'}`;

        const points = success ? 10 + bid : 0;

        div.innerHTML = `
            <div>
                <div class="result-player">${escapeHtml(player.playerName)}</div>
                <div class="result-stats">
                    <span>Lupaus: ${bid}</span>
                    <span>Tikit: ${tricks}</span>
                </div>
            </div>
            <div class="result-points">
                ${success ? `✓ +${points}p` : '✗ Ohi!'}
            </div>
        `;

        container.appendChild(div);
    });
}

export function showFinalScores(scores) {
    showScreen('finalScreen');

    clearPlayerSession();
    console.log('🎮 Peli päättyi - session tyhjennetty');

    const container = document.getElementById('finalScores');
    container.innerHTML = '';

    scores.forEach((score, i) => {
        const div = document.createElement('div');
        div.className = `final-score-item ${i === 0 ? 'winner' : ''}`;

        div.innerHTML = `
            <div class="final-rank">${i === 0 ? '🏆' : `${i + 1}.`}</div>
            <div class="final-player">${escapeHtml(score.playerName)}</div>
            <div class="final-points">${score.total} pistettä</div>
        `;

        container.appendChild(div);
    });
}