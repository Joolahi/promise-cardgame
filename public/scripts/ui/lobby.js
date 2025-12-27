/**
 * lobby.js
 */

import { GameState } from '../game/state.js';
import { escapeHtml } from '../utils.js';

export function updateLobby() {
    // Päivitetään huoneen tiedot
    if (GameState.gameState) {
        const roomNameEl = document.getElementById('lobbyRoomName');
        const roomCodeEl = document.getElementById('lobbyRoomCode');
        
        if (roomNameEl && GameState.gameState.roomName) {
            roomNameEl.textContent = GameState.gameState.roomName;
        }
        if (roomCodeEl && GameState.gameState.roomId) {
            roomCodeEl.textContent = GameState.gameState.roomId;
        }
    }

    const slotsContainer = document.getElementById('playerSlots');
    slotsContainer.innerHTML = '';


    const myPlayer = GameState.gameState.players.find(p => p.playerName === GameState.myPlayerName);
    if (myPlayer) {
        GameState.myPlayerIndex = myPlayer.playerIndex;
    }

    for (let i = 0; i < GameState.gameState.maxPlayers; i++) {
        const slot = document.createElement('div');
        slot.className = 'player-slot';

        if (i < GameState.gameState.players.length) {
            const player = GameState.gameState.players[i];
            slot.classList.add('filled');

            if (player.playerIndex === GameState.myPlayerIndex) {
                slot.classList.add('you');
            }

            slot.innerHTML = `
                <div class="player-icon">${player.playerIndex === GameState.myPlayerIndex ? '👤' : '👥'}</div>
                <div class="player-name">${escapeHtml(player.playerName)}</div>
                ${player.playerIndex === GameState.myPlayerIndex ? '<div class="player-badge">Sinä</div>' : ''}
            `;
        } else {
            slot.innerHTML = `
                <div class="player-icon" style="opacity: 0.3;">⭕</div>
                <div style="color: #999;">Tyhjä paikka</div>
            `;
        }

        slotsContainer.appendChild(slot);
    }

    updateStartButton();
}

export function updateStartButton() {
    const startButton = document.getElementById('startButton');
    const startButtonText = document.getElementById('startButtonText');
    const waitingMessage = document.getElementById('waitingMessage');

    const canStart = GameState.gameState.players.length >= GameState.gameState.minPlayers &&
        GameState.gameState.players.length <= GameState.gameState.maxPlayers;

    startButton.disabled = !canStart;

    if (canStart) {
        startButtonText.textContent = `Aloita peli (${GameState.gameState.players.length} pelaajaa)`;
        waitingMessage.classList.add('ready');
        waitingMessage.innerHTML = `
            <h3>✅ Valmis aloittamaan!</h3>
            <p>Painakaa "Aloita peli" kun olette valmiit</p>
        `;
    } else {
        startButtonText.textContent = `Odotetaan pelaajia (${GameState.gameState.players.length}/${GameState.gameState.minPlayers})`;
        waitingMessage.classList.remove('ready');
    }
}