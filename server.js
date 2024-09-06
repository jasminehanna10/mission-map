const express = require('express');
const app = express();
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');

// Set the port to use Heroku’s dynamically assigned port or default to 3000
const PORT = process.env.PORT || 3000;

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Handle the basic root request and serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
const server = http.createServer(app);
const io = socketIo(server);

// Handle socket connections
io.on('connection', (socket) => {
    console.log('A user connected');
    socket.on('new mission', (data) => {
        io.emit('update map', data);
    });
});

// Listen on the correct port
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

