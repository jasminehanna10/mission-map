var map = L.map('map').setView([34.0522, -118.2437], 9); // Set default center and zoom level

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Set bounds for California
var californiaBounds = [
    [32.5343, -124.4096],  // Southwest corner
    [37.0000, -118.0000]   // Northeast corner (adjusted for SoCal)
];
map.setMaxBounds(californiaBounds);
map.fitBounds(californiaBounds); // Ensure map is centered within these bounds


// Function to add marker and include removal option
function addMarkerToMap(data) {
    const marker = L.marker([data.lat, data.lng]).addTo(map)
        .bindPopup(`${data.info} <br><button onclick="removePin(${data.lat}, ${data.lng}, this)">Remove Pin</button>`);
}

// Function to remove pin (this emits the event to the server)
function removePin(lat, lng, button) {
    if (confirm('Are you sure you want to remove this pin?')) {
        socket.emit('remove mission', { lat: lat, lng: lng });

        // Remove the pin from the map immediately for the user who clicked the button
        map.eachLayer(function (layer) {
            if (layer instanceof L.Marker) {
                const { lat: markerLat, lng: markerLng } = layer.getLatLng();
                if (markerLat === lat && markerLng === lng) {
                    map.removeLayer(layer);
                }
            }
        });
    }
}

// Load pins when the map initializes
socket.on('load pins', function (pins) {
    pins.forEach(function (pin) {
        addMarkerToMap(pin);
    });
});

// Add new pin when the 'new mission' event is received
socket.on('update map', function (data) {
    addMarkerToMap(data);
});

// Remove the pin when the 'remove pin' event is received from the server
socket.on('remove pin', function (latLng) {
    map.eachLayer(function (layer) {
        if (layer instanceof L.Marker) {
            const { lat, lng } = layer.getLatLng();
            if (lat === latLng.lat && lng === latLng.lng) {
                map.removeLayer(layer);
            }
        }
    });
});

// Geocoding and Adding Pin by Address
function addPinByAddress() {
    const address = document.getElementById('address-input').value;
    const name = document.getElementById('name-input').value;

    if (address && name) {
        fetch(`https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(address)}&key=YOUR_API_KEY`)
            .then(response => response.json())
            .then(data => {
                if (data.results.length > 0) {
                    const latLng = data.results[0].geometry;
                    const lat = latLng.lat;
                    const lng = latLng.lng;

                    // Add marker to the map
                    const markerData = { lat: lat, lng: lng, info: name };
                    addMarkerToMap(markerData);

                    // Optionally, send the new pin data to the server
                    socket.emit('new mission', markerData);
                } else {
                    alert("Address not found. Please enter a valid address.");
                }
            })
            .catch(error => {
                console.error("Error fetching geocoding data:", error);
                alert("There was an error finding the location. Please try again.");
            });
    } else {
        alert("Please fill out both name and address fields.");
    }
}

