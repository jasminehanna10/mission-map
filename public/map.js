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
        addMarker(pin);
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
    addMarker(data);
});

// Function to add a marker and handle removal
function addMarker(data) {
    var marker = L.marker([data.lat, data.lng]).addTo(map)
        .bindPopup(data.info)
        .openPopup();

    // Add event listener for pin removal
    marker.on('click', function() {
        if (confirm('Do you want to remove this mission pin?')) {
            socket.emit('remove mission', { lat: data.lat, lng: data.lng });
        }
    });

    // Store marker reference on the marker object itself for easy removal
    marker._latLngData = data;
}

// Listen for pin removal from the server
socket.on('remove map pin', function(latLng) {
    map.eachLayer(function(layer) {
        if (layer instanceof L.Marker) {
            // Compare lat/lng to find the correct marker to remove
            var markerData = layer._latLngData; // Get the stored lat/lng data
            if (markerData && markerData.lat === latLng.lat && markerData.lng === latLng.lng) {
                map.removeLayer(layer);
            }
        }
    });
});

