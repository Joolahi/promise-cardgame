/**
 * socketHandlers.js - Socket.IO event handlers
 * Client-server communication for game actions
 */

const GameRoom = require('../game/GameRoom');
//activ game rooms 
const gameRooms = new Map();

/**
 * Register Socket.IO event handlers
 */
function registerSocketHandlers(io) {
    io.on('connection', (socket) => {
        console.log('Uusi pelaaja yhdisti:', socket.id);

        // Joinning game
        
        socket.on('joinGame', ({ playerName, roomId = 'default', sessionId }) => {
            handleJoinGame(socket, io, playerName, roomId, sessionId);
        });
        
        // Reconnecting to game
        socket.on('reconnectGame', ({ playerName, roomId = 'default', sessionId }) => {
            handleJoinGame(socket, io, playerName, roomId, sessionId);
        });

        // Starting game
        
        socket.on('startGame', () => {
            handleStartGame(socket, io);
        });

        // Bidding phase
        
        socket.on('submitBid', ({ bid }) => {
            handleSubmitBid(socket, io, bid);
        });

        // Playing phase
        
        socket.on('playCard', ({ card }) => {
            handlePlayCard(socket, io, card);
        });

        // End of the round
        
        socket.on('nextRound', () => {
            handleNextRound(socket, io);
        });

        // Score
        
        socket.on('getFinalScores', () => {
            handleGetFinalScores(socket);
        });

        // Disconnecting
        
        socket.on('disconnect', () => {
            handleDisconnect(socket, io);
        });
    });
}

// Event handlers

function handleJoinGame(socket, io, playerName, roomId, sessionId) {
    if (!gameRooms.has(roomId)) {
        gameRooms.set(roomId, new GameRoom(roomId));
    }

    const room = gameRooms.get(roomId);
    
    // Priotity 1: Try to reconnect using sessionId
    if (sessionId) {
        const reconnectResult = room.reconnectPlayerBySession(sessionId, socket.id);
        
        if (reconnectResult.success) {
            socket.join(roomId);
            socket.roomId = roomId;
            socket.playerIndex = reconnectResult.playerIndex;
            socket.playerName = reconnectResult.playerName;
            
            // Send success response
            socket.emit('reconnected', {
                playerIndex: reconnectResult.playerIndex,
                message: reconnectResult.wasDisconnected ? 
                    'Tervetuloa takaisin!' : 
                    'Yhteys palautettu'
            });
            
            // Notify other players
            if (reconnectResult.wasDisconnected) {
                io.to(roomId).emit('playerReconnected', {
                    playerName: reconnectResult.playerName,
                    playerIndex: reconnectResult.playerIndex,
                    isPaused: room.isPaused
                });
            }
            
            // Send updated game state and cards
            io.to(roomId).emit('gameStateUpdate', room.getGameState());
            
            if (room.phase === 'bidding' || room.phase === 'playing') {
                socket.emit('receiveHand', room.getPlayerHand(reconnectResult.playerIndex));
            }
            
            console.log(`${reconnectResult.playerName} yhdisti uudelleen (session: ${sessionId})`);
            return;
        }
    }
    
    // Priority 2: Check if the reconnect by name is possible
    const disconnectedPlayer = Array.from(room.disconnectedPlayers.entries())
        .find(([index, info]) => info.playerName === playerName);
    
    if (disconnectedPlayer) {
        const [playerIndex, info] = disconnectedPlayer;
        const reconnectResult = room.reconnectPlayer(playerIndex, socket.id);
        
        if (reconnectResult.success) {
            socket.join(roomId);
            socket.roomId = roomId;
            socket.playerIndex = playerIndex;
            socket.playerName = playerName;
            
            // Notify all players
            io.to(roomId).emit('playerReconnected', {
                playerIndex: playerIndex,
                playerName: reconnectResult.playerName,
                isPaused: room.isPaused
            });
            io.to(roomId).emit('gameStateUpdate', room.getGameState());
            
            // Send cards back
            socket.emit('receiveHand', room.getPlayerHand(playerIndex));
            
            console.log(`${reconnectResult.playerName} palasi peliin huoneeseen ${roomId}`);
            return;
        }
    }
    
    // Priority 3: Normal join
    const result = room.addPlayer(socket.id, playerName, sessionId);

    if (!result.success) {
        socket.emit('joinError', { message: result.message });
        return;
    }

    socket.join(roomId);
    socket.roomId = roomId;
    socket.playerIndex = result.player.playerIndex;
    socket.playerName = playerName;

    // Send success response
    socket.emit('joinSuccess', {
        playerIndex: result.player.playerIndex,
        playerName: playerName,
        roomId: roomId
    });

    // Send updated game state to all players
    io.to(roomId).emit('gameStateUpdate', room.getGameState());
    
    console.log(`${playerName} liittyi huoneeseen ${roomId} (session: ${sessionId})`);
}

function handleStartGame(socket, io) {
    const roomId = socket.roomId;
    if (!roomId) return;

    const room = gameRooms.get(roomId);
    if (!room) return;

    if (room.startGame()) {
        io.to(roomId).emit('gameStarted');
        io.to(roomId).emit('gameStateUpdate', room.getGameState());
        
        // Send cards to all players
        room.players.forEach((player) => {
            io.to(player.socketId).emit('receiveHand', room.getPlayerHand(player.playerIndex));
        });
        
        console.log(`Peli alkoi huoneessa ${roomId}`);
    } else {
        socket.emit('error', { message: 'Ei voida aloittaa peliä' });
    }
}

function handleSubmitBid(socket, io, bid) {
    const roomId = socket.roomId;
    if (!roomId) return;

    const room = gameRooms.get(roomId);
    if (!room) return;

    const result = room.submitBid(socket.playerIndex, bid);
    
    if (result.success) {
        io.to(roomId).emit('gameStateUpdate', room.getGameState());
        console.log(`Pelaaja ${socket.playerIndex} lupasi ${bid} huoneessa ${roomId}`);
    } else {
        socket.emit('error', { message: result.message });
    }
}

function handlePlayCard(socket, io, card) {
    const roomId = socket.roomId;
    if (!roomId) return;

    const room = gameRooms.get(roomId);
    if (!room) return;

    const result = room.playCard(socket.playerIndex, card);
    
    if (result.success) {
        io.to(roomId).emit('gameStateUpdate', room.getGameState());
        
        // Send updated hands to all players
        room.players.forEach((player) => {
            io.to(player.socketId).emit('receiveHand', room.getPlayerHand(player.playerIndex));
        });
        
        console.log(`Pelaaja ${socket.playerIndex} pelasi kortin ${card.rank}${card.suit} huoneessa ${roomId}`);
    } else {
        socket.emit('error', { message: result.message });
    }
}

function handleNextRound(socket, io) {
    const roomId = socket.roomId;
    if (!roomId) return;

    const room = gameRooms.get(roomId);
    if (!room) return;

    if (room.nextRound()) {
        io.to(roomId).emit('gameStateUpdate', room.getGameState());
        // Send updated hands to all players
        room.players.forEach((player) => {
            io.to(player.socketId).emit('receiveHand', room.getPlayerHand(player.playerIndex));
        });
        
        console.log(`Uusi kierros alkoi huoneessa ${roomId}`);
    } else {
        // Game finished
        const finalScores = room.getFinalScores();
        io.to(roomId).emit('gameFinished', { scores: finalScores });
        
        console.log(`Peli päättyi huoneessa ${roomId}`);
    }
}

function handleGetFinalScores(socket) {
    const roomId = socket.roomId;
    if (!roomId) return;

    const room = gameRooms.get(roomId);
    if (!room) return;

    const finalScores = room.getFinalScores();
    socket.emit('finalScores', { scores: finalScores });
}

function handleDisconnect(socket, io) {
    console.log('Pelaaja poistui:', socket.id);
    
    const roomId = socket.roomId;
    if (!roomId) return;

    const room = gameRooms.get(roomId);
    if (!room) return;

    const result = room.removePlayer(socket.id);

    // If the player was in-game and the game is paused, set a timeout for reconnection
    if (result.wasInGame && result.isPaused) {
        const timeoutId = setTimeout(() => {
            room.handleReconnectTimeout(result.playerIndex);
            io.to(roomId).emit('gameAborted', { 
                reason: `Peli keskeytettiin: ${result.playerName} ei palannut ajoissa` 
            });
            
            gameRooms.delete(roomId);
            console.log(`Huone ${roomId} poistettu (timeout)`);
        }, room.RECONNECT_TIMEOUT);
        
        // Save timeoutId for potential reconnection
        const disconnectedInfo = room.disconnectedPlayers.get(result.playerIndex);
        if (disconnectedInfo) {
            disconnectedInfo.timeoutId = timeoutId;
        }
        
        // Notify other players
        io.to(roomId).emit('playerDisconnected', {
            playerIndex: result.playerIndex,
            playerName: result.playerName,
            timeoutSeconds: room.RECONNECT_TIMEOUT / 1000
        });
        io.to(roomId).emit('gameStateUpdate', room.getGameState());
        return;
    }

    // If no players left, delte the room
    if (room.players.length === 0) {
        gameRooms.delete(roomId);
        console.log(`Huone ${roomId} poistettu`);
    } else {
        // Update remaining players
        io.to(roomId).emit('playerLeft');
        io.to(roomId).emit('gameStateUpdate', room.getGameState());
    }
}


// Helper functions

// get a specific room by ID
function getRoom(roomId) {
    return gameRooms.get(roomId);
}

// get all active rooms
function getAllRooms() {
    return Array.from(gameRooms.values());
}

// get the count of active rooms
function getRoomCount() {
    return gameRooms.size;
}

// clear all rooms (for testing purposes)
function clearAllRooms() {
    gameRooms.clear();
}

module.exports = {
    registerSocketHandlers,
    getRoom,
    getAllRooms,
    getRoomCount,
    clearAllRooms
};