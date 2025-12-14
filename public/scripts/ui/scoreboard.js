/**
 * scoreboard.js
 */

import { GameState } from '../game/state.js';
import { escapeHtml } from '../utils.js';

export function updateScoreboard() {
    const container = document.getElementById('scoreboardContent');
    container.innerHTML = '';

    GameState.gameState.players.forEach((player, i) => {
        const playerScores = GameState.gameState.scores[i];
        const total = playerScores.reduce((sum, round) => sum + round.points, 0);

        const div = document.createElement('div');
        div.className = 'player-score';
        if (i === GameState.myPlayerIndex) {
            div.classList.add('you');
        }

        const roundsHtml = playerScores.map(round => `
            <div class="round-score ${round.success ? 'success' : 'failed'} ${round.round === GameState.gameState.currentRound ? 'current' : ''}">
                <span>Kierros ${round.round}</span>
                <span>${round.success ? '✓' : '✗'} ${round.bid} (${round.tricks})</span>
            </div>
        `).join('');

        div.innerHTML = `
            <div class="player-header">
                <span>${escapeHtml(player.playerName)} ${i === GameState.myPlayerIndex ? '(Sinä)' : ''}</span>
                <span class="player-total">${total}p</span>
            </div>
            <div class="round-scores">
                ${roundsHtml || '<small style="color: #999;">Ei vielä kierroksia</small>'}
            </div>
        `;

        container.appendChild(div);
    });
}