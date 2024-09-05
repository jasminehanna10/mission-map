const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

// Create the Express app and HTTP server
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve the public folder
app.use(express.static('public'));

// Handle Socket.io connections
io.on('connection', (socket) => {
    console.log('A user connected');
    
    socket.on('new mission', (data) => {
        io.emit('update map', data);  // Broadcast new point to all clients
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

// Start the server on port 3000
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

