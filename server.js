/*
* server.js main server file -  sets up the express server and middleware
*/

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const {registerSocketHandlers}  = require('./socket/socketHandlers');

// Server setup
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static('public'));

// Routes 
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp : new Date().toISOString()
    });
});

app.get('/api/rooms', (req, res) => {
    const {getRoomCount} = require('./socket/socketHandlers');
    res.json({
        roomCount: getRoomCount(),
        maxPlayers: 5,
        minPlayers: 3
    })
});

// Socket.io setup
registerSocketHandlers(io);

// Error handlers
app.use((req, res) => {
    res.status(404).json({error: '404 Not Found'});
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({error: '500 Internal server error'});
});

// Start server
server.listen(PORT, () => {
    console.log('═══════════════════════════════════════════════');
    console.log('Lupaus-palvelin käynnissä!');
    console.log('═══════════════════════════════════════════════');
    console.log(`Portti: ${PORT}`);
    console.log(`URL: http://localhost:${PORT}`);
    console.log(`Käynnistysaika: ${new Date().toLocaleString('fi-FI')}`);
    console.log('═══════════════════════════════════════════════');
    console.log('Odottaa pelaajia...\n');
});

// Clean up on exit
process.on('SIGINT', () => {
    console.log('\n🛑 Suljetaan palvelin...');
    server.close(() => {
        console.log('✅ Palvelin suljettu');
        process.exit(0);
    });
});

process.on('uncaughtException', (err) => {
    console.error('Unexcpected error:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Error Promise rejection:', reason);
});

module.exports = { app, server, io };
