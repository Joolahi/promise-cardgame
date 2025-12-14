/**
 * bidding.js - Bidding state
 */

import { GameState } from '../game/state.js';
import { escapeHtml } from '../utils.js';

export function renderBiddingArea() {
    const container = document.getElementById('biddingArea');
    container.innerHTML = '';

    if (!GameState.gameState || !GameState.gameState.players) return;

    const biddedCount = GameState.gameState.bids.filter(b => b !== null).length;
    const isLastBidder = biddedCount === GameState.gameState.players.length - 1;
    const forbiddenBid = isLastBidder ? calculateForbiddenBid() : null;

    GameState.gameState.players.forEach((player, i) => {
        const div = document.createElement('div');
        div.className = 'player-bid';

        const isMyTurn = i === GameState.myPlayerIndex && GameState.gameState.bids[i] === null;
        const hasBid = GameState.gameState.bids[i] !== null;
        const isCurrentBidder = !hasBid && biddedCount === i;

        if (i === GameState.myPlayerIndex) {
            div.classList.add('you');
        }

        if (isCurrentBidder) {
            div.classList.add('active');
        }

        const isDealer = i === GameState.gameState.dealerIndex;

        div.innerHTML = `
            <div class="bid-player-name">
                ${escapeHtml(player.playerName)} ${i === GameState.myPlayerIndex ? '(Sinä)' : ''}
                ${isDealer ? '<span class="dealer-badge">🎲 Dealer</span>' : ''}
            </div>
            ${!hasBid ? `
                ${isMyTurn ? `
                    <div class="bid-controls">
                        <input type="number" id="bidInput${i}" min="0" max="${GameState.gameState.cardsThisRound}" value="0">
                        <button class="btn btn-success" onclick="window.submitBid(${i})">Lupaa</button>
                    </div>
                    ${forbiddenBid !== null ? `
                        <div class="forbidden-warning">
                            ⚠️ Et voi luvata: ${forbiddenBid} (viimeisen pelaajan sääntö)
                        </div>
                    ` : ''}
                ` : `
                    <div class="bid-waiting">
                        ${isCurrentBidder ? '⏳ Vuorossa...' : '⏱️ Odottaa...'}
                    </div>
                `}
            ` : `
                <div class="bid-value">
                    ✓ ${GameState.gameState.bids[i]}
                    <div class="bid-label">Lupasi ${GameState.gameState.bids[i]} ${GameState.gameState.bids[i] === 1 ? 'tikin' : 'tikkiä'}</div>
                </div>
            `}
        `;
        container.appendChild(div);
    });

    // Summary
    const summaryDiv = document.createElement('div');
    summaryDiv.className = 'bid-summary';

    const totalBids = GameState.gameState.bids.filter(b => b !== null).reduce((a, b) => a + b, 0);
    const remainingBids = GameState.gameState.players.length - biddedCount;
    const isTight = totalBids > GameState.gameState.cardsThisRound;
    const isLoose = totalBids < GameState.gameState.cardsThisRound;

    let tieInfo = '';
    if (biddedCount === GameState.gameState.players.length) {
        const maxBid = Math.max(...GameState.gameState.bids);
        const highestBidders = GameState.gameState.bids
            .map((bid, idx) => ({ bid, idx, name: GameState.gameState.players[idx].playerName }))
            .filter(item => item.bid === maxBid);

        if (highestBidders.length > 1) {
            const firstBidder = highestBidders[0];
            tieInfo = `
                <div class="summary-tie-info">
                    🎲 Tasatilanne! ${highestBidders.map(b => b.name).join(', ')} lupasivat kaikki ${maxBid}.
                    <br/>
                    <strong>${escapeHtml(firstBidder.name)}</strong> aloittaa (lupasi ensin).
                </div>
            `;
        }
    }

    summaryDiv.innerHTML = `
        <div class="summary-header">📊 Lupausten tilanne</div>
        <div class="summary-content">
            <div class="summary-item">
                <span class="summary-label">Luvattu yhteensä:</span>
                <span class="summary-value ${isTight ? 'tight' : isLoose ? 'loose' : ''}">${totalBids} / ${GameState.gameState.cardsThisRound}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Lupauksia jäljellä:</span>
                <span class="summary-value">${remainingBids}</span>
            </div>
            ${biddedCount > 0 ? `
                <div class="summary-status ${isTight ? 'tight' : isLoose ? 'loose' : 'balanced'}">
                    ${isTight ? '🔥 Kireitä - Luvattu enemmän kuin kortteja!' :
                isLoose ? '💧 Löysiä - Luvattu vähemmän kuin kortteja!' :
                    '⚖️ Tasapainossa'}
                </div>
            ` : ''}
            ${tieInfo}
        </div>
    `;

    container.appendChild(summaryDiv);
}

export function calculateForbiddenBid() {
    const currentBids = GameState.gameState.bids.filter(b => b !== null);
    if (currentBids.length === GameState.gameState.players.length - 1) {
        const sum = currentBids.reduce((a, b) => a + b, 0);
        const forbidden = GameState.gameState.cardsThisRound - sum;
        if (forbidden >= 0 && forbidden <= GameState.gameState.cardsThisRound) {
            return forbidden;
        }
    }
    return null;
}