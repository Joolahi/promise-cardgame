/**
 * state.js - Game state controlling
 */

export const GameState = {
    socket: null,
    myPlayerIndex: -1,
    myPlayerName: '',
    gameState: null,
    myHand: [],
    mySessionId: null
};

export function updateConnectionStatus(connected) {
    const status = document.getElementById('connectionStatus');
    const statusText = status.querySelector('.status-text');

    if (connected) {
        status.className = 'connection-status connected';
        statusText.textContent = 'Yhdistetty';
    } else {
        status.className = 'connection-status disconnected';
        statusText.textContent = 'Yhteys katkesi';
    }
}

export function showPhase(phase) {
    const biddingArea = document.getElementById('biddingArea');
    const playArea = document.getElementById('playArea');
    const tableSection = playArea.querySelector('.table-section');
    const roundResults = document.getElementById('roundResults');

    biddingArea.classList.add('hidden');
    playArea.classList.add('hidden');
    roundResults.classList.add('hidden');

    if (phase === 'bidding') {
        biddingArea.classList.remove('hidden');
        playArea.classList.remove('hidden');
        if (tableSection) tableSection.style.display = 'none';
    } else if (phase === 'playing') {
        playArea.classList.remove('hidden');
        if (tableSection) tableSection.style.display = 'block';
    } else if (phase === 'results') {
        roundResults.classList.remove('hidden');
    }
}

export function updateGameInfo() {
    const { gameState } = GameState;
    
    document.getElementById('currentRound').textContent = gameState.currentRound;
    document.getElementById('cardsInDeal').textContent = gameState.cardsThisRound;

    if (gameState.players[gameState.dealerIndex]) {
        document.getElementById('dealer').textContent = gameState.players[gameState.dealerIndex].playerName;
    }

    const totalBids = gameState.bids.filter(b => b !== null).reduce((a, b) => a + b, 0);
    document.getElementById('totalBids').textContent = totalBids;
}

export function updatePhaseIndicator() {
    const { gameState } = GameState;
    const phaseTitle = document.getElementById('phaseTitle');
    const phaseDescription = document.getElementById('phaseDescription');

    if (gameState.phase === 'bidding') {
        phaseTitle.textContent = '🎲 Lupausvaihe';
        const bidsComplete = gameState.bids.filter(b => b !== null).length;
        phaseDescription.textContent = `Lupauksia: ${bidsComplete}/${gameState.players.length}`;
    } else if (gameState.phase === 'playing') {
        phaseTitle.textContent = '🎮 Pelivaihe';
        const currentPlayer = gameState.players[gameState.currentPlayerIndex];
        phaseDescription.textContent = `Vuorossa: ${currentPlayer.playerName}`;
    } else if (gameState.phase === 'results') {
        phaseTitle.textContent = '🏆 Kierros päättyi';
        phaseDescription.textContent = 'Kierroksen tulokset';
    }
}