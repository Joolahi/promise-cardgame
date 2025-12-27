/**
 * socketHandlers.js - Socket.IO event handlers
 * Client-server communication for game actions
 */

const GameRoom = require('../game/GameRoom');
const gameRooms = new Map();

function registerSocketHandlers(io) {
    io.on('connection', (socket) => {
        console.log('Uusi pelaaja yhdisti:', socket.id);

        socket.on('createRoom', ({ roomName, password, maxPlayers, minPlayers, playerName, sessionId }) => {
            handleCreateRoom(socket, io, roomName, password, maxPlayers, minPlayers, playerName, sessionId);
        });

        socket.on('getRoomList', () => {
            handleGetRoomList(socket);
        });

        socket.on('joinGame', ({ playerName, roomId = 'default', sessionId, password }) => {
            handleJoinGame(socket, io, playerName, roomId, sessionId, password);
        });
        
        socket.on('reconnectGame', ({ playerName, roomId = 'default', sessionId }) => {
            handleJoinGame(socket, io, playerName, roomId, sessionId);
        });

        socket.on('startGame', () => {
            handleStartGame(socket, io);
        });

        socket.on('submitBid', ({ bid }) => {
            handleSubmitBid(socket, io, bid);
        });

        socket.on('playCard', ({ card }) => {
            handlePlayCard(socket, io, card);
        });

        socket.on('nextRound', () => {
            handleNextRound(socket, io);
        });

        socket.on('getFinalScores', () => {
            handleGetFinalScores(socket);
        });

        socket.on('disconnect', () => {
            handleDisconnect(socket, io);
        });
    });
}

// Event handlers

function handleCreateRoom(socket, io, roomName, password, maxPlayers, minPlayers, playerName, sessionId) {
    // Luodaan uniikki huone-ID
    const roomId = generateRoomId();
    
    const config = {
        roomName: roomName || `${playerName}n huone`,
        password: password || null,
        maxPlayers: maxPlayers || 5,
        minPlayers: minPlayers || 3,
        createdBy: playerName
    };
    
    const room = new GameRoom(roomId, config);
    gameRooms.set(roomId, room);
    
    console.log(`🏠 Luotiin uusi huone "${roomName}" (ID: ${roomId})`);
    
    // Liitetään luoja automaattisesti huoneeseen
    const result = room.addPlayer(socket.id, playerName, sessionId);
    
    if (result.success) {
        socket.join(roomId);
        socket.roomId = roomId;
        socket.playerIndex = result.player.playerIndex;
        socket.playerName = playerName;
        
        socket.emit('roomCreated', {
            roomId: roomId,
            roomName: roomName,
            playerIndex: result.player.playerIndex
        });
        
        socket.emit('joinSuccess', {
            playerIndex: result.player.playerIndex,
            playerName: playerName,
            roomId: roomId
        });
        
        io.to(roomId).emit('gameStateUpdate', room.getGameState());
        
        console.log(`${playerName} loi ja liittyi huoneeseen ${roomId}`);
    }
}

function handleGetRoomList(socket) {
    const rooms = Array.from(gameRooms.values())
        .filter(room => !room.gameStarted) // Näytetään vain huoneet joissa peli ei ole alkanut
        .map(room => ({
            roomId: room.roomId,
            roomName: room.roomName,
            isPrivate: room.isPrivate,
            playerCount: room.players.length,
            maxPlayers: room.maxPlayers,
            minPlayers: room.minPlayers,
            createdBy: room.createdBy
        }));
    
    socket.emit('roomList', { rooms });
}

function handleJoinGame(socket, io, playerName, roomId, sessionId, password) {
    // Tarkistetaan onko huone olemassa
    if (!gameRooms.has(roomId)) {
        socket.emit('joinError', { message: 'Huonetta ei löydy' });
        return;
    }

    const room = gameRooms.get(roomId);
    
    // Tarkistetaan salasana
    if (room.isPrivate && !room.verifyPassword(password)) {
        socket.emit('joinError', { message: 'Väärä salasana' });
        return;
    }
    
    if (sessionId) {
        const reconnectResult = room.reconnectPlayerBySession(sessionId, socket.id);
        
        if (reconnectResult.success) {
            socket.join(roomId);
            socket.roomId = roomId;
            socket.playerIndex = reconnectResult.playerIndex;
            socket.playerName = reconnectResult.playerName;
            
            socket.emit('reconnected', {
                playerIndex: reconnectResult.playerIndex,
                message: reconnectResult.wasDisconnected ? 
                    'Tervetuloa takaisin!' : 
                    'Yhteys palautettu'
            });
            
            if (reconnectResult.wasDisconnected) {
                io.to(roomId).emit('playerReconnected', {
                    playerName: reconnectResult.playerName,
                    playerIndex: reconnectResult.playerIndex,
                    isPaused: room.isPaused
                });
            }
            
            io.to(roomId).emit('gameStateUpdate', room.getGameState());
            
            if (room.phase === 'bidding' || room.phase === 'playing') {
                socket.emit('receiveHand', room.getPlayerHand(reconnectResult.playerIndex));
            }
            
            console.log(`${reconnectResult.playerName} yhdisti uudelleen (session: ${sessionId})`);
            return;
        }
    }
    
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
            
            io.to(roomId).emit('playerReconnected', {
                playerIndex: playerIndex,
                playerName: reconnectResult.playerName,
                isPaused: room.isPaused
            });
            io.to(roomId).emit('gameStateUpdate', room.getGameState());
            
            socket.emit('receiveHand', room.getPlayerHand(playerIndex));
            
            console.log(`${reconnectResult.playerName} palasi peliin huoneeseen ${roomId}`);
            return;
        }
    }
    
    const result = room.addPlayer(socket.id, playerName, sessionId);

    if (!result.success) {
        socket.emit('joinError', { message: result.message });
        return;
    }

    socket.join(roomId);
    socket.roomId = roomId;
    socket.playerIndex = result.player.playerIndex;
    socket.playerName = playerName;

    socket.emit('joinSuccess', {
        playerIndex: result.player.playerIndex,
        playerName: playerName,
        roomId: roomId
    });

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

// Handling 2 seconds delay after trick is complete
function handlePlayCard(socket, io, card) {
    const roomId = socket.roomId;
    if (!roomId) return;

    const room = gameRooms.get(roomId);
    if (!room) return;

    const result = room.playCard(socket.playerIndex, card);
    
    if (!result.success) {
        socket.emit('error', { message: result.message });
        return;
    }
    
    io.to(roomId).emit('gameStateUpdate', room.getGameState());
    
    room.players.forEach((player) => {
        io.to(player.socketId).emit('receiveHand', room.getPlayerHand(player.playerIndex));
    });
    
    console.log(`Pelaaja ${socket.playerIndex} pelasi kortin ${card.rank}${card.suit} huoneessa ${roomId}`);
        if (result.trickComplete) {
        console.log('⏱️ Tikki täynnä - odotetaan 2 sekuntia...');
        
        setTimeout(() => {
            const completeResult = room.completeTrick();
            
            if (completeResult.error) {
                console.error('Virhe tikin viimeistelyssa:', completeResult.error);
                return;
            }
            
            console.log(`🏆 Tikin voitti pelaaja ${completeResult.trickWinner}`);
                        io.to(roomId).emit('gameStateUpdate', room.getGameState());
            
            if (completeResult.roundComplete) {
                console.log('🎉 Kierros päättyi!');
            }
        }, 2000); // 2 second delay
    }
}

function handleNextRound(socket, io) {
    const roomId = socket.roomId;
    if (!roomId) return;

    const room = gameRooms.get(roomId);
    if (!room) return;

    if (room.nextRound()) {
        io.to(roomId).emit('gameStateUpdate', room.getGameState());
        
        room.players.forEach((player) => {
            io.to(player.socketId).emit('receiveHand', room.getPlayerHand(player.playerIndex));
        });
        
        console.log(`Uusi kierros alkoi huoneessa ${roomId}`);
    } else {
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

    if (result.wasInGame && result.isPaused) {
        const timeoutId = setTimeout(() => {
            const room = gameRooms.get(roomId);
            if (!room) return;
            
            room.handleReconnectTimeout(result.playerIndex);
            io.to(roomId).emit('gameAborted', { 
                reason: `Peli keskeytettiin: ${result.playerName} ei palannut ajoissa` 
            });
            
            gameRooms.delete(roomId);
            console.log(`Huone ${roomId} poistettu (timeout)`);
        }, room.RECONNECT_TIMEOUT);
        
        const disconnectedInfo = room.disconnectedPlayers.get(result.playerIndex);
        if (disconnectedInfo) {
            disconnectedInfo.timeoutId = timeoutId;
        }
        
        io.to(roomId).emit('playerDisconnected', {
            playerIndex: result.playerIndex,
            playerName: result.playerName,
            timeoutSeconds: room.RECONNECT_TIMEOUT / 1000
        });
        io.to(roomId).emit('gameStateUpdate', room.getGameState());
        return;
    }

    if (room.players.length === 0) {
        gameRooms.delete(roomId);
        console.log(`Huone ${roomId} poistettu`);
    } else {
        io.to(roomId).emit('playerLeft');
        io.to(roomId).emit('gameStateUpdate', room.getGameState());
    }
}

// Helper functions

function generateRoomId() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let roomId;
    let attempts = 0;
    const maxAttempts = 100;
    
    do {
        roomId = '';
        for (let i = 0; i < 6; i++) {
            roomId += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        attempts++;
    } while (gameRooms.has(roomId) && attempts < maxAttempts);
    
    if (attempts >= maxAttempts) {
        roomId = `ROOM_${Date.now()}`;
    }
    
    return roomId;
}

function getRoom(roomId) {
    return gameRooms.get(roomId);
}

function getAllRooms() {
    return Array.from(gameRooms.values());
}

function getRoomCount() {
    return gameRooms.size;
}

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