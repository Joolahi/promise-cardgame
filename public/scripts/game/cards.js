/**
 * cards.js - card rendering 
 */

import { GameState } from './state.js';
import { escapeHtml } from '../utils.js';

export function renderHand() {
    const container = document.getElementById('playerHand');
    container.innerHTML = '';

    const isBiddingPhase = GameState.gameState.phase === 'bidding';
    const isMyTurn = GameState.gameState.currentPlayerIndex === GameState.myPlayerIndex;

    GameState.myHand.forEach(card => {
        const cardDiv = createCardElement(card);

        if (isBiddingPhase) {
            cardDiv.classList.add('disabled');
            cardDiv.style.cursor = 'default';
        } else if (isMyTurn && canPlayCard(card, GameState.myHand)) {
            cardDiv.onclick = () => {
                GameState.socket.emit('playCard', { card });
            };
        } else {
            cardDiv.classList.add('disabled');
        }

        container.appendChild(cardDiv);
    });

    if (GameState.myHand.length === 0) {
        container.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">Ei kortteja</p>';
    }
}

export function createCardElement(card) {
    const div = document.createElement('div');
    div.className = 'card';
    div.setAttribute('data-suit', card.suit);

    if (card.suit === '♥' || card.suit === '♦') {
        div.classList.add('red');
    } else {
        div.classList.add('black');
    }

    div.innerHTML = `
        <div class="card-rank">${card.rank}</div>
        <div class="card-suit">${card.suit}</div>
    `;

    return div;
}

export function canPlayCard(card, hand) {
    if (!GameState.gameState.currentTrick || GameState.gameState.currentTrick.length === 0) {
        return true;
    }

    const leadSuit = GameState.gameState.currentTrick[0].card.suit;
    const hasSuit = hand.some(c => c.suit === leadSuit);

    return !hasSuit || card.suit === leadSuit;
}

export function renderTrick() {
    const container = document.getElementById('trickCards');
    container.innerHTML = '';

    if (!GameState.gameState.currentTrick || GameState.gameState.currentTrick.length === 0) {
        container.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">Ei kortteja pöydällä</p>';
        return;
    }

    GameState.gameState.currentTrick.forEach(play => {
        const div = document.createElement('div');
        div.className = 'trick-card';

        const playerName = GameState.gameState.players[play.playerIndex].playerName;
        const cardDiv = createCardElement(play.card);

        div.innerHTML = `
            <div class="trick-player-name">${escapeHtml(playerName)}</div>
        `;
        div.appendChild(cardDiv);

        container.appendChild(div);
    });
}