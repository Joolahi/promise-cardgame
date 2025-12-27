/**
 * menu.js - Main menu and room management UI
 */

import { GameState } from '../game/state.js';
import { escapeHtml, showError } from '../utils.js';

export function showMainMenu() {
    const menuScreen = document.getElementById('menuScreen');
    const lobbyScreen = document.getElementById('lobbyScreen');
    
    if (menuScreen) {
        menuScreen.classList.remove('hidden');
    }
    if (lobbyScreen) {
        lobbyScreen.classList.add('hidden');
    }
}

export function showCreateRoomForm() {
    document.getElementById('menuMain').classList.add('hidden');
    document.getElementById('createRoomForm').classList.remove('hidden');
}

export function showJoinRoomForm() {
    document.getElementById('menuMain').classList.add('hidden');
    document.getElementById('joinRoomForm').classList.remove('hidden');
    
    // Päivitä huonelista
    GameState.socket.emit('getRoomList');
}

export function backToMainMenu() {
    document.getElementById('menuMain').classList.remove('hidden');
    document.getElementById('createRoomForm').classList.add('hidden');
    document.getElementById('joinRoomForm').classList.add('hidden');
}

export function renderRoomList(rooms) {
    const container = document.getElementById('roomList');
    container.innerHTML = '';
    
    if (rooms.length === 0) {
        container.innerHTML = `
            <div class="no-rooms">
                <div class="no-rooms-icon">🏠</div>
                <p>Ei avoimia huoneita</p>
                <p class="small">Luo uusi huone aloittaaksesi!</p>
            </div>
        `;
        return;
    }
    
    rooms.forEach(room => {
        const roomDiv = document.createElement('div');
        roomDiv.className = 'room-item';
        
        const isFull = room.playerCount >= room.maxPlayers;
        if (isFull) {
            roomDiv.classList.add('full');
        }
        
        roomDiv.innerHTML = `
            <div class="room-header">
                <div class="room-name">
                    ${room.isPrivate ? '🔒' : '🌐'} ${escapeHtml(room.roomName)}
                </div>
                <div class="room-code">ID: ${escapeHtml(room.roomId)}</div>
            </div>
            <div class="room-info">
                <div class="room-stat">
                    <span class="stat-icon">👥</span>
                    <span>${room.playerCount}/${room.maxPlayers}</span>
                </div>
                <div class="room-stat">
                    <span class="stat-icon">👤</span>
                    <span>${escapeHtml(room.createdBy)}</span>
                </div>
            </div>
            <div class="room-actions">
                ${isFull ? 
                    '<button class="btn btn-secondary" disabled>Täynnä</button>' :
                    room.isPrivate ?
                        `<button class="btn btn-primary" onclick="window.promptPasswordAndJoin('${room.roomId}')">Liity</button>` :
                        `<button class="btn btn-primary" onclick="window.joinRoomById('${room.roomId}')">Liity</button>`
                }
            </div>
        `;
        
        container.appendChild(roomDiv);
    });
}

export function createRoom() {
    const roomName = document.getElementById('newRoomName').value.trim();
    const password = document.getElementById('newRoomPassword').value.trim();
    const hasPassword = document.getElementById('roomHasPassword').checked;
    const maxPlayers = parseInt(document.getElementById('newRoomMaxPlayers').value);
    const minPlayers = parseInt(document.getElementById('newRoomMinPlayers').value);
    const playerName = document.getElementById('creatorName').value.trim();
    
    if (!playerName) {
        showError('Syötä nimesi');
        return;
    }
    
    if (!roomName) {
        showError('Anna huoneelle nimi');
        return;
    }
    
    if (hasPassword && !password) {
        showError('Syötä salasana tai poista salasanan käyttö');
        return;
    }
    
    if (minPlayers > maxPlayers) {
        showError('Minimipelaajia ei voi olla enemmän kuin maksimipelaajia');
        return;
    }
    
    GameState.myPlayerName = playerName;
    
    GameState.socket.emit('createRoom', {
        roomName,
        password: hasPassword ? password : null,
        maxPlayers,
        minPlayers,
        playerName,
        sessionId: GameState.mySessionId
    });
}

export function joinRoomById(roomId, password = null) {
    const playerName = document.getElementById('joinPlayerName').value.trim();
    
    if (!playerName) {
        showError('Syötä nimesi');
        return;
    }
    
    GameState.myPlayerName = playerName;
    
    GameState.socket.emit('joinGame', {
        playerName,
        roomId,
        sessionId: GameState.mySessionId,
        password
    });
}

export function joinRoomByCode() {
    const roomCode = document.getElementById('roomCode').value.trim().toUpperCase();
    const playerName = document.getElementById('joinPlayerName').value.trim();
    
    if (!playerName) {
        showError('Syötä nimesi');
        return;
    }
    
    if (!roomCode) {
        showError('Syötä huoneen koodi');
        return;
    }
    
    GameState.myPlayerName = playerName;
    
    GameState.socket.emit('joinGame', {
        playerName,
        roomId: roomCode,
        sessionId: GameState.mySessionId
    });
}

export function promptPasswordAndJoin(roomId) {
    const password = prompt('Syötä huoneen salasana:');
    
    if (password === null) {
        return; // Käyttäjä perui
    }
    
    joinRoomById(roomId, password);
}

export function togglePasswordField() {
    const checkbox = document.getElementById('roomHasPassword');
    const passwordField = document.getElementById('passwordFieldContainer');
    
    if (checkbox.checked) {
        passwordField.classList.remove('hidden');
    } else {
        passwordField.classList.add('hidden');
        document.getElementById('newRoomPassword').value = '';
    }
}

export function refreshRoomList() {
    GameState.socket.emit('getRoomList');
}