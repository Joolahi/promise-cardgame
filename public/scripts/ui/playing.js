/**
 * playing.js
 */

import { GameState } from '../game/state.js';
import { escapeHtml } from '../utils.js';

export function renderGameStatus() {
    const container = document.getElementById('gameStatus');
    if (!container) return;

    container.innerHTML = '';

    GameState.gameState.players.forEach((player, i) => {
        const div = document.createElement('div');
        div.className = 'player-status';

        const bid = GameState.gameState.bids[i];
        const tricks = GameState.gameState.tricks[i];
        const isCurrentTurn = i === GameState.gameState.currentPlayerIndex;

        let statusClass = '';
        let statusEmoji = '';
        let statusText = '';

        if (tricks === bid) {
            statusClass = 'on-track';
            statusEmoji = '✅';
            statusText = 'Tavoitteessa';
        } else if (tricks < bid) {
            statusClass = 'behind';
            statusEmoji = '⬇️';
            statusText = `Tarvitsee ${bid - tricks} lisää`;
        } else {
            statusClass = 'ahead';
            statusEmoji = '⬆️';
            statusText = `${tricks - bid} yli`;
        }

        if (i === GameState.myPlayerIndex) {
            div.classList.add('you');
        }

        if (isCurrentTurn) {
            div.classList.add('current-turn');
        }

        div.classList.add(statusClass);

        const progress = bid > 0 ? Math.min((tricks / bid) * 100, 100) : (tricks > 0 ? 100 : 0);
        const progressClass = tricks === bid ? 'success' : tricks < bid ? 'warning' : 'danger';

        div.innerHTML = `
            <div class="status-header">
                <div class="status-name">
                    ${escapeHtml(player.playerName)} ${i === GameState.myPlayerIndex ? '(Sinä)' : ''}
                </div>
                ${isCurrentTurn ? '<div class="status-turn-indicator">VUORO</div>' : ''}
            </div>
            <div class="status-details">
                <div class="status-row">
                    <span class="status-label">Lupaus:</span>
                    <span class="status-value">${bid}</span>
                </div>
                <div class="status-row">
                    <span class="status-label">Tikit:</span>
                    <span class="status-value" style="color: ${tricks === bid ? 'var(--success)' : tricks > bid ? 'var(--danger)' : 'var(--warning)'}">
                        ${tricks}
                    </span>
                </div>
                <div class="status-progress">
                    <div class="progress-bar-container">
                        <div class="progress-bar ${progressClass}" style="width: ${Math.min(progress, 100)}%"></div>
                    </div>
                    <span class="status-emoji">${statusEmoji}</span>
                </div>
                <div style="text-align: center; font-size: 0.85rem; color: ${tricks === bid ? 'var(--success)' : 'var(--gray-600)'}; font-weight: bold;">
                    ${statusText}
                </div>
            </div>
        `;

        container.appendChild(div);
    });
}