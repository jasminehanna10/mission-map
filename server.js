import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    res.sendFile(path.join(__dirname, '/public/index.html'));
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

    // Handle pin removal
    socket.on('remove mission', (latLng) => {
        // Find and remove the pin
        pins = pins.filter(pin => pin.lat !== latLng.lat || pin.lng !== latLng.lng);

        // Broadcast the removal to all clients
        io.emit('remove map pin', latLng);

        // Save the updated pins to the JSON file
        fs.writeFileSync(pinsFile, JSON.stringify(pins, null, 2));
    });
});

// Start the server
httpServer.listen(process.env.PORT || 3000, () => {
    console.log('Server running on port ' + (process.env.PORT || 3000));
});

