// Center the map between Berkeley and Tijuana
var map = L.map('map').setView([35.5, -119.5], 6); 

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Set bounds for California (from Tijuana, Mexico to Berkeley, CA)
var californiaBounds = [
    [32.5343, -124.4096],  // Southwest corner (Tijuana area)
    [42.0095, -114.1315]   // Northeast corner (California/Nevada border, near Oregon)
];

// Restrict the map view to California bounds
map.setMaxBounds(californiaBounds);
map.on('drag', function() {
    map.panInsideBounds(californiaBounds, { animate: true });
});

map.setMinZoom(6);
map.setMaxZoom(10);

// Connect to the server
var socket = io();

// Load existing pins from the server
socket.on('load pins', function(pins) {
    pins.forEach(function(pin) {
        addMarker(pin);
    });
});

// Add marker based on address
document.getElementById('addMissionBtn').addEventListener('click', function() {
    var name = document.getElementById('name').value;
    var address = document.getElementById('address').value;
    
    if (!name || !address) {
        alert('Please enter both your name and address.');
        return;
    }
    
    // Use an API like OpenCage to get lat/lng from address
    fetch(`https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(address)}&key=YOUR_API_KEY`)
        .then(response => response.json())
        .then(data => {
            if (data.results.length > 0) {
                var latLng = data.results[0].geometry;
                
                // Only add if the location is in California
                if (latLng.lat >= 32.5343 && latLng.lat <= 42.0095 && latLng.lng >= -124.4096 && latLng.lng <= -114.1315) {
                    var missionInfo = `${name}: ${address}`;
                    var pinData = { lat: latLng.lat, lng: latLng.lng, info: missionInfo };
                    socket.emit('new mission', pinData);
                } else {
                    alert('The address is outside of California.');
                }
            } else {
                alert('Could not find the address. Please try again.');
            }
        })
        .catch(err => {
            console.error('Error fetching geocode:', err);
            alert('Error geocoding the address.');
        });
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
            var markerData = layer._latLngData;
            if (markerData && markerData.lat === latLng.lat && markerData.lng === latLng.lng) {
                map.removeLayer(layer);
            }
        }
    });
});

