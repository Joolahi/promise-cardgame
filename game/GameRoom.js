/**
 * GameRoom.js - Manages game room state and functionality
 */

const Deck = require('./Deck');
const Rules = require('./Rules');
const ScoreCalculator = require('./ScoreCalculator');

class GameRoom {
    constructor(roomId, config = {}) {
        this.roomId = roomId;
        this.maxPlayers = config.maxPlayers || 5;
        this.minPlayers = config.minPlayers || 3;
        this.startCards = config.startCards || 10;
        this.oneCardBlind = config.oneCardBlind || false;

        this.players = [];
        this.gameStarted = false;
        this.currentRound = 0;
        this.cardsThisRound = this.startCards;
        this.dealerIndex = 0;
        this.currentPlayerIndex = 0;
        this.phase = 'waiting'; // waiting, bidding, playing, results, finished

        this.bids = [];
        this.tricks = [];
        this.currentTrick = [];
        this.leadSuit = null;

        this.scores = [];
        this.hands = [];

        this.disconnectedPlayers = new Map(); // playerIndex -> { playerName, disconnectTime, timeoutId }
        this.isPaused = false;
        this.pauseReason = '';
        this.RECONNECT_TIMEOUT = 120000; // 2 minutes in milliseconds
    }

    // Player management

    addPlayer(socketId, playerName, sessionId) {
        if (this.players.length >= this.maxPlayers) {
            return { success: false, message: 'Huone on täynnä' };
        }

        if (this.gameStarted) {
            return { success: false, message: 'Peli on jo alkanut' };
        }

        const player = {
            socketId,
            playerName,
            playerIndex: this.players.length,
            ready: false,
            sessionId: sessionId || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        };

        this.players.push(player);
        this.scores.push([]);

        return { success: true, player };
    }

    removePlayer(socketId) {
        const index = this.players.findIndex(p => p.socketId === socketId);
        if (index === -1) return { wasInGame: false };

        const player = this.players[index];
        
        // Dont remove yet!
        if (this.gameStarted && !this.isPaused) {
            console.log(`⚠️ Pelaaja ${player.playerName} irtosi pelistä - annetaan 2 min aikaa palata`);
            
            // tag as a disconnected
            this.disconnectedPlayers.set(index, {
                playerName: player.playerName,
                disconnectTime: Date.now(),
                timeoutId: null
            });
            
            // Set game to pause
            this.pauseGame(`Pelaaja ${player.playerName} katkaisi yhteyden. Odotetaan 2 minuuttia...`);
            
            return { 
                wasInGame: true, 
                playerIndex: index,
                playerName: player.playerName,
                isPaused: true 
            };
        }
        
        this.players.splice(index, 1);
        this.scores.splice(index, 1);
        
        this.players.forEach((p, i) => {
            p.playerIndex = i;
        });

        return { wasInGame: false };
    }
    
    reconnectPlayer(playerIndex, socketId) {
        const disconnectedInfo = this.disconnectedPlayers.get(playerIndex);
        
        if (!disconnectedInfo) {
            return { success: false, message: 'Ei löydy irronneita pelaajia tällä indeksillä' };
        }
        
        this.players[playerIndex].socketId = socketId;
        
        if (disconnectedInfo.timeoutId) {
            clearTimeout(disconnectedInfo.timeoutId);
        }
        this.disconnectedPlayers.delete(playerIndex);
        
        console.log(`✅ Pelaaja ${disconnectedInfo.playerName} palasi peliin`);
        
        if (this.disconnectedPlayers.size === 0) {
            this.resumeGame();
        }
        
        return { 
            success: true, 
            playerName: disconnectedInfo.playerName,
            playerIndex: playerIndex
        };
    }
    
    reconnectPlayerBySession(sessionId, newSocketId) {
        const player = this.players.find(p => p.sessionId === sessionId);
        
        if (!player) {
            return { success: false, message: 'Pelaajaa ei löydy session ID:llä' };
        }
        
        const playerIndex = player.playerIndex;
        const disconnectedInfo = this.disconnectedPlayers.get(playerIndex);
        
        if (!disconnectedInfo) {
            // Player in the game update socket id
            player.socketId = newSocketId;
            return { 
                success: true, 
                playerName: player.playerName,
                playerIndex: playerIndex,
                wasDisconnected: false
            };
        }
        
        player.socketId = newSocketId;
        
        if (disconnectedInfo.timeoutId) {
            clearTimeout(disconnectedInfo.timeoutId);
        }
        this.disconnectedPlayers.delete(playerIndex);
        
        console.log(`✅ Pelaaja ${player.playerName} palasi peliin (session: ${sessionId})`);
        
        if (this.disconnectedPlayers.size === 0) {
            this.resumeGame();
        }
        
        return { 
            success: true, 
            playerName: player.playerName,
            playerIndex: playerIndex,
            wasDisconnected: true
        };
    }
    
    pauseGame(reason) {
        this.isPaused = true;
        this.pauseReason = reason;
        console.log(`⏸️ Peli tauolla: ${reason}`);
    }
    
    resumeGame() {
        this.isPaused = false;
        this.pauseReason = '';
        console.log(`▶️ Peli jatkuu`);
    }
    
    handleReconnectTimeout(playerIndex) {
        const disconnectedInfo = this.disconnectedPlayers.get(playerIndex);
        if (!disconnectedInfo) return;
        
        console.log(`⏰ Pelaaja ${disconnectedInfo.playerName} ei palannut ajoissa - peli päättyy`);
        
        this.disconnectedPlayers.forEach((info, idx) => {
            if (info.timeoutId) {
                clearTimeout(info.timeoutId);
            }
        });
        
        this.phase = 'aborted';
        this.pauseReason = `Peli keskeytettiin: ${disconnectedInfo.playerName} ei palannut ajoissa`;
    }

    getPlayerBySocketId(socketId) {
        return this.players.find(p => p.socketId === socketId);
    }

    // Stating game

    canStartGame() {
        return Rules.isValidPlayerCount(this.players.length, this.minPlayers, this.maxPlayers) 
               && !this.gameStarted;
    }

    startGame() {
        if (!this.canStartGame()) {
            return false;
        }

        this.gameStarted = true;
        
        // Random dealer for the 1st round
        this.dealerIndex = Math.floor(Math.random() * this.players.length);
        console.log(`🎲 Aloittaja valittu satunnaisesti: ${this.players[this.dealerIndex].playerName} (index ${this.dealerIndex})`);
        
        this.startNewRound();
        return true;
    }

    resetGame() {
        this.gameStarted = false;
        this.currentRound = 0;
        this.cardsThisRound = this.startCards;
        this.dealerIndex = 0;
        this.currentPlayerIndex = 0;
        this.bids = [];
        this.tricks = [];
        this.currentTrick = [];
        this.scores = this.players.map(() => []);
        this.phase = 'waiting';
        this.hands = [];
        this.leadSuit = null;
        
        this.players.forEach(p => p.ready = false);
    }

    // Rounds control
    startNewRound() {
        this.currentRound++;
        if (this.currentRound <= this.startCards) {
            //10 -> 1
            this.cardsThisRound = this.startCards - this.currentRound + 1;
        } else {
            //2 -> 10
            const ascending = this.currentRound - this.startCards;
            this.cardsThisRound = ascending + 1;
        }

        if (Rules.isGameFinished(this.currentRound, this.startCards)) {
            this.phase = 'finished';
            return;
        }

        this.bids = new Array(this.players.length).fill(null);
        this.tricks = new Array(this.players.length).fill(0);
        this.currentTrick = [];
        this.phase = 'bidding';
        this.leadSuit = null;

        this.hands = Deck.dealCards(this.players.length, this.cardsThisRound);
        if (this.currentRound > 1) {
            this.dealerIndex = (this.dealerIndex + 1) % this.players.length;
            console.log(`🔄 Uusi dealer: ${this.players[this.dealerIndex].playerName} (index ${this.dealerIndex})`);
        }
                this.currentPlayerIndex = this.dealerIndex;
        console.log(`📢 Kierros ${this.currentRound}: Lupaukset alkavat pelaajasta ${this.players[this.dealerIndex].playerName}`);
    }

    nextRound() {
        if (Rules.isGameFinished(this.currentRound + 1, this.startCards)) {
            this.phase = 'finished';
            return false;
        }

        this.startNewRound();
        return true;
    }

    // Bidding phase

    submitBid(playerIndex, bid) {
        if (this.phase !== 'bidding') {
            return { success: false, message: 'Ei lupausvaihe' };
        }

        if (this.bids[playerIndex] !== null) {
            return { success: false, message: 'Olet jo luvannut' };
        }

        const currentBids = this.bids.filter(b => b !== null);
        const expectedPlayerIndex = (this.dealerIndex + currentBids.length) % this.players.length;
        
        if (playerIndex !== expectedPlayerIndex) {
            return { success: false, message: 'Ei sinun vuorosi' };
        }
        const isLastBidder = currentBids.length === this.players.length - 1;
        const validationResult = Rules.isValidBid(
            bid, 
            this.cardsThisRound, 
            currentBids, 
            isLastBidder
        );

        if (!validationResult.valid) {
            return { success: false, message: validationResult.reason };
        }

        this.bids[playerIndex] = bid;

        if (this.bids.every(b => b !== null)) {
            this.startPlaying();
        }

        return { success: true };
    }

    getForbiddenBid() {
        const currentBids = this.bids.filter(b => b !== null);
        if (currentBids.length === this.players.length - 1) {
            return Rules.getForbiddenBid(currentBids, this.cardsThisRound);
        }
        return null;
    }

    // Game phase

    startPlaying() {
        this.phase = 'playing';
        
        // Highest bid
        const maxBid = Math.max(...this.bids);
        
        // if the highest bid on more than 1 player 1st player to start if who bidded 1st
        const starterIndex = this.bids.indexOf(maxBid);
        
        this.currentPlayerIndex = starterIndex;
        
        // Check if multiple players have made the same bid
        const highestBidders = this.bids
            .map((bid, index) => ({ bid, index }))
            .filter(item => item.bid === maxBid);
        
        if (highestBidders.length > 1) {
            const bidderNames = highestBidders.map(item => this.players[item.index].playerName).join(', ');
            console.log(`🎮 Tasatilanne! Pelaajat ${bidderNames} lupasivat kaikki ${maxBid} → ${this.players[starterIndex].playerName} aloittaa (lupasi ensin)`);
        } else {
            console.log(`🎮 Pelivaihe alkaa: Korkein lupaus ${maxBid} → ${this.players[starterIndex].playerName} aloittaa (index ${starterIndex})`);
        }
        
        this.currentTrick = [];
        this.leadSuit = null;
    }

    playCard(playerIndex, card) {
        if (this.phase !== 'playing') {
            return { success: false, message: 'Ei pelivaihe' };
        }

        if (playerIndex !== this.currentPlayerIndex) {
            return { success: false, message: 'Ei sinun vuorosi' };
        }

        const hand = this.hands[playerIndex];
        const cardIndex = hand.findIndex(c => c.rank === card.rank && c.suit === card.suit);
        
        if (cardIndex === -1) {
            return { success: false, message: 'Sinulla ei ole tätä korttia' };
        }

        // Validating the possible card to play
        const validationResult = Rules.canPlayCard(card, hand, this.leadSuit);
        if (!validationResult.valid) {
            return { success: false, message: validationResult.reason };
        }

        // Remove from the hand
        hand.splice(cardIndex, 1);

        if (this.currentTrick.length === 0) {
            this.leadSuit = card.suit;
        }

        this.currentTrick.push({ playerIndex, card });

        if (this.currentTrick.length === this.players.length) {
            this.finishTrick();
        } else {
            this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        }

        return { success: true };
    }

    finishTrick() {
        // Define winner
        const winnerIndex = Rules.getTrickWinner(this.currentTrick, this.leadSuit);
        
        this.tricks[winnerIndex]++;
        this.currentPlayerIndex = winnerIndex;
        
        const trickWinner = winnerIndex;
        const completedTrick = [...this.currentTrick];
        
        this.currentTrick = [];
        this.leadSuit = null;

        // Check if the round is over
        if (this.hands[0].length === 0) {
            this.finishRound();
            return { roundComplete: true, trickWinner, completedTrick };
        }

        return { roundComplete: false, trickWinner, completedTrick };
    }

    // Ending round

    finishRound() {
        this.phase = 'results';
        
        // Count score
        const results = ScoreCalculator.calculateRoundResults(
            this.players, 
            this.bids, 
            this.tricks, 
            this.currentRound
        );

        results.forEach((result, i) => {
            this.scores[i].push({
                round: result.round,
                bid: result.bid,
                tricks: result.tricks,
                success: result.success,
                points: result.points
            });
        });
    }

    // Scrores

    getFinalScores() {
        return ScoreCalculator.calculateFinalScores(this.players, this.scores);
    }

    getPlayerStatistics(playerIndex) {
        return ScoreCalculator.calculateStatistics(this.scores[playerIndex]);
    }

    // state search

    getGameState() {
        return {
            roomId: this.roomId,
            players: this.players.map(p => ({
                playerName: p.playerName,
                playerIndex: p.playerIndex,
                ready: p.ready
            })),
            gameStarted: this.gameStarted,
            currentRound: this.currentRound,
            cardsThisRound: this.cardsThisRound,
            dealerIndex: this.dealerIndex,
            currentPlayerIndex: this.currentPlayerIndex,
            bids: this.bids,
            tricks: this.tricks,
            currentTrick: this.currentTrick,
            scores: this.scores,
            phase: this.phase,
            maxPlayers: this.maxPlayers,
            minPlayers: this.minPlayers,
            leadSuit: this.leadSuit,
            isPaused: this.isPaused,
            pauseReason: this.pauseReason,
            disconnectedPlayers: Array.from(this.disconnectedPlayers.entries()).map(([index, info]) => ({
                playerIndex: index,
                playerName: info.playerName,
                disconnectTime: info.disconnectTime,
                timeRemaining: this.RECONNECT_TIMEOUT - (Date.now() - info.disconnectTime)
            }))
        };
    }

    getPlayerHand(playerIndex) {
        return this.hands[playerIndex] || [];
    }
}

module.exports = GameRoom;