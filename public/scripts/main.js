/**
 * main.js 
 */

import { GameState, showPhase, updateGameInfo, updatePhaseIndicator } from './game/state.js';
import { initSocket, startGame, submitBid, nextRound, leaveGame, playAgain } from './socket.js';
import { updateLobby } from './ui/lobby.js';
import { 
    showMainMenu, 
    showCreateRoomForm, 
    showJoinRoomForm, 
    backToMainMenu, 
    createRoom, 
    joinRoomById, 
    joinRoomByCode, 
    promptPasswordAndJoin, 
    togglePasswordField, 
    refreshRoomList 
} from './ui/menu.js';
import { renderBiddingArea } from './ui/bidding.js';
import { renderGameStatus } from './ui/playing.js';
import { renderResults } from './ui/results.js';
import { updateScoreboard } from './ui/scoreboard.js';
import { renderHand, renderTrick } from './game/cards.js';
import { showPauseOverlay, hidePauseOverlay } from './ui/overlays.js';
import { clearPlayerSession } from './session.js';
import { showScreen } from './utils.js';

export function updateGameUI() {
    if (!GameState.gameState) return;

    if (GameState.gameState.isPaused) {
        showPauseOverlay(GameState.gameState.pauseReason, 120);
    } else {
        hidePauseOverlay();
    }

    // Jos peli ei ole alkanut, näytetään lobby
    if (GameState.gameState.phase === 'waiting') {
        showScreen('lobbyScreen');
        updateLobby();
        return;
    }

    // Jos peli on alkanut, näytetään pelinäkymä
    if (GameState.gameState.gameStarted) {
        showScreen('gameScreen');
        
        updateGameInfo();
        updatePhaseIndicator();
        updateScoreboard();

        if (GameState.gameState.phase === 'bidding') {
            showPhase('bidding');
            renderBiddingArea();
            renderHand();
        } else if (GameState.gameState.phase === 'playing') {
            showPhase('playing');
            renderGameStatus();
            renderHand();
            renderTrick();
        } else if (GameState.gameState.phase === 'results') {
            showPhase('results');
            renderResults();
        }
    }
}

window.addEventListener('load', () => {
    console.log('🎮 Lupaus-peli ladattu (Modulaarinen versio)');
    
    const MAX_WAIT_TIME = 10000; // 10 sekuntia max
    const startTime = Date.now();
    
    if (typeof io !== 'undefined'){
        initSocket();
    } else {
        console.log('⏳ Odotetaan Socket.io:ta...');
        const waitForSocketIO = setInterval(() => {
            if (typeof io !== 'undefined'){
                console.log("✅ Socket.io ladattu");
                clearInterval(waitForSocketIO);
                initSocket();
            } else if (Date.now() - startTime > MAX_WAIT_TIME) {
                console.error('❌ Socket.io ei latautunut ajoissa');
                clearInterval(waitForSocketIO);
                showError('Yhteysongelma - päivitä sivu');
            }
        }, 50);
    }
});

// beforeunload - session stays
window.addEventListener('beforeunload', () => {
    if (!GameState.gameState ||
        GameState.gameState.phase === 'waiting' ||
        GameState.gameState.phase === 'finished') {
        console.log('🗑️ Sivu suljetaan - session säilytetään vain jos peli kesken');
    }
});

window.startGame = startGame;
window.submitBid = submitBid;
window.nextRound = nextRound;
window.leaveGame = leaveGame;
window.playAgain = playAgain;

// Menu funktiot
window.showMainMenu = showMainMenu;
window.showCreateRoomForm = showCreateRoomForm;
window.showJoinRoomForm = showJoinRoomForm;
window.backToMainMenu = backToMainMenu;
window.createRoom = createRoom;
window.joinRoomById = joinRoomById;
window.joinRoomByCode = joinRoomByCode;
window.promptPasswordAndJoin = promptPasswordAndJoin;
window.togglePasswordField = togglePasswordField;
window.refreshRoomList = refreshRoomList;
window.leaveRoom = () => {
    if (confirm('Haluatko varmasti poistua huoneesta?')) {
        clearPlayerSession();
        location.reload();
    }
};

// Debug-mode
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.DEBUG = {
        gameState: () => console.log(GameState.gameState),
        myHand: () => console.log(GameState.myHand),
        myIndex: () => console.log(GameState.myPlayerIndex),
        socket: () => console.log(GameState.socket),
        state: () => console.log(GameState)
    };
    
    window.clearSession = () => {
        localStorage.clear();
        console.log('🗑️ Session tyhjennetty');
        location.reload();
    };
    
    window.showSession = () => {
        const session = {
            sessionId: localStorage.getItem('lupaus_sessionId'),
            playerName: localStorage.getItem('lupaus_playerName'),
            roomId: localStorage.getItem('lupaus_roomId')
        };
        console.table(session);
        return session;
    };
    
    console.log('🐛 Debug-tila käytössä');
    console.log('📊 Komennot: DEBUG.gameState(), DEBUG.myHand(), clearSession(), showSession()');
}