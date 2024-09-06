var map = L.map('map').setView([0, 0], 2);  // Center of the world

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Connect to the server
var socket = io();

// Load existing pins from the server
socket.on('load pins', function(pins) {
    pins.forEach(function(pin) {
        L.marker([pin.lat, pin.lng]).addTo(map)
            .bindPopup(pin.info)
            .openPopup();
    });
});

// Add marker on map click
map.on('click', function(e) {
    var latLng = e.latlng;
    var missionInfo = prompt('Enter mission work details:');
    if (missionInfo) {
        var pinData = { lat: latLng.lat, lng: latLng.lng, info: missionInfo };
        socket.emit('new mission', pinData);
    }
});

// Listen for map updates from other users
socket.on('update map', function(data) {
    L.marker([data.lat, data.lng]).addTo(map)
        .bindPopup(data.info)
        .openPopup();
});

