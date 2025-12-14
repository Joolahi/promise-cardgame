/**
 * socket.js - Socket.IO communication
 */

import { GameState, updateConnectionStatus } from './game/state.js';
import { getOrCreateSessionId, savePlayerSession, loadPlayerSession, clearPlayerSession } from './session.js';
import { showError, showSuccess, showScreen } from './utils.js';
import { renderHand } from './game/cards.js';
import { showFinalScores } from './ui/results.js';
import { showPauseOverlay, hidePauseOverlay } from './ui/overlays.js';
import { updateGameUI } from './main.js';

export function initSocket() {
    GameState.socket = io();
    GameState.mySessionId = getOrCreateSessionId();

    GameState.socket.on('connect', () => {
        console.log('✅ Yhdistetty palvelimeen');
        updateConnectionStatus(true);

        const savedSession = loadPlayerSession();
        if (savedSession.sessionId && savedSession.playerName && savedSession.roomId) {
            console.log('🔄 Yritetään automaattista uudelleenyhdistämistä...');
            console.log(`   Pelaaja: ${savedSession.playerName}`);
            
            document.getElementById('joinForm').classList.add('hidden');
            document.getElementById('lobbyContent').classList.remove('hidden');

            GameState.socket.emit('reconnectGame', {
                sessionId: savedSession.sessionId,
                playerName: savedSession.playerName,
                roomId: savedSession.roomId
            });
        }
    });
    GameState.socket.on('disconnect', () => {
        console.log('❌ Yhteys katkesi');
        updateConnectionStatus(false);
    });

    GameState.socket.on('reconnected', ({ playerIndex, message }) => {
        console.log('✅ Uudelleenyhdistäminen onnistui!');
        GameState.myPlayerIndex = playerIndex;
        GameState.myPlayerName = loadPlayerSession().playerName;
        showSuccess(message || 'Tervetuloa takaisin!');
    });


    GameState.socket.on('reconnectFailed', ({ message }) => {
        console.log('❌ Uudelleenyhdistäminen epäonnistui:', message);
        clearPlayerSession();
        GameState.mySessionId = getOrCreateSessionId();
        
        document.getElementById('joinForm').classList.remove('hidden');
        document.getElementById('lobbyContent').classList.add('hidden');
        showError(message || 'Uudelleenyhdistäminen epäonnistui. Liity uudelleen.');
    });

    GameState.socket.on('gameStateUpdate', (state) => {
        console.log('📊 Pelitila päivittyi');
        GameState.gameState = state;
        updateGameUI();
    });


    GameState.socket.on('receiveHand', (hand) => {
        console.log('🎴 Vastaanotettu kortit');
        GameState.myHand = hand;
        renderHand();
    });


    GameState.socket.on('gameStarted', () => {
        console.log('🎮 Peli alkoi!');
        showScreen('gameScreen');
    });


    GameState.socket.on('gameFinished', ({ scores }) => {
        console.log('🏆 Peli päättyi');
        showFinalScores(scores);
    });

    GameState.socket.on('playerLeft', () => {
        console.log('👋 Pelaaja poistui');
        showError('Pelaaja poistui pelistä. Peli keskeytetty.');
    });

    GameState.socket.on('playerDisconnected', ({ playerName, timeoutSeconds }) => {
        console.log(`⚠️ ${playerName} irtosi`);
        showPauseOverlay(`${playerName} irtosi. Odotetaan paluuta...`, timeoutSeconds);
    });

    GameState.socket.on('playerReconnected', ({ playerName, isPaused }) => {
        console.log(`✅ ${playerName} palasi peliin`);
        showSuccess(`${playerName} palasi peliin!`);

        if (!isPaused) {
            hidePauseOverlay();
        }
    });


    GameState.socket.on('gameAborted', ({ reason }) => {
        console.log('⛔ Peli keskeytetty:', reason);
        hidePauseOverlay();
        alert(reason);
        clearPlayerSession();
        setTimeout(() => location.reload(), 1000);
    });


    GameState.socket.on('joinSuccess', ({ playerIndex, playerName, roomId }) => {
        console.log('✅ Liittyminen onnistui!');
        GameState.myPlayerIndex = playerIndex;
        GameState.myPlayerName = playerName;
        savePlayerSession(playerName, roomId);
    });


    GameState.socket.on('joinError', ({ message }) => {
        console.log('❌ Liittymisvirhe:', message);
        showError(message);
        document.getElementById('joinForm').classList.remove('hidden');
        document.getElementById('lobbyContent').classList.add('hidden');
    });


    GameState.socket.on('error', ({ message }) => {
        console.log('❌ Virhe:', message);
        showError(message);
    });
}

export function joinGame() {
    const nameInput = document.getElementById('playerName');
    const playerName = nameInput.value.trim();

    if (!playerName) {
        showError('Syötä nimesi ensin!');
        return;
    }

    if (playerName.length > 20) {
        showError('Nimi voi olla enintään 20 merkkiä');
        return;
    }

    GameState.myPlayerName = playerName;
    const roomId = 'default';
    GameState.socket.emit('joinGame', {
        playerName,
        roomId,
        sessionId: GameState.mySessionId
    });

    document.getElementById('joinForm').classList.add('hidden');
    document.getElementById('lobbyContent').classList.remove('hidden');
}

export function startGame() {
    GameState.socket.emit('startGame');
}

export function submitBid(playerIndex) {
    const bidInput = document.getElementById(`bidInput${playerIndex}`);
    const bid = parseInt(bidInput.value);

    if (isNaN(bid) || bid < 0) {
        showError('Virheellinen lupaus');
        return;
    }

    GameState.socket.emit('submitBid', { bid });
}

export function nextRound() {
    GameState.socket.emit('nextRound');
}

export function leaveGame() {
    if (confirm('Haluatko varmasti poistua pelistä?')) {
        clearPlayerSession();
        location.reload();
    }
}

export function playAgain() {
    clearPlayerSession();
    console.log('🔄 Aloitetaan uusi peli - session tyhjennetty');
    location.reload();
}