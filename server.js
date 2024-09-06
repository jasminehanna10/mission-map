const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const fs = require('fs');
const path = require('path');

const pinsFile = path.join(__dirname, 'pins.json');

// Serve static files from the "public" directory
app.use(express.static('public'));

// Read existing pins from the JSON file
let pins = [];
if (fs.existsSync(pinsFile)) {
    const data = fs.readFileSync(pinsFile);
    pins = JSON.parse(data);
}

// Serve the map page
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// On client connection
io.on('connection', (socket) => {
    console.log('A user connected');

    // Send all saved pins to the connected client
    socket.emit('load pins', pins);

    // Listen for new pins
    socket.on('new mission', (data) => {
        // Save the new pin in memory
        pins.push(data);

        // Broadcast the new pin to all clients
        io.emit('update map', data);

        // Save the pins to the JSON file
        fs.writeFileSync(pinsFile, JSON.stringify(pins, null, 2));
    });

    // *** Add this block to handle pin removal ***
    socket.on('remove mission', (latLng) => {
        // Find and remove the pin
        pins = pins.filter(pin => pin.lat !== latLng.lat || pin.lng !== latLng.lng);

        // Broadcast the removal to all clients
        io.emit('remove map pin', latLng);

        // Save the updated pins to the JSON file
        fs.writeFileSync(pinsFile, JSON.stringify(pins, null, 2));
    });

    // Handle client disconnection
    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

// Start the server
const port = process.env.PORT || 3000;
http.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

