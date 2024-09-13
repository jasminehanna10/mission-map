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

// Add bounds and set the map to only show the southern California region
var socalBounds = [
    [32.5343, -124.4096],  // Southwest corner (Tijuana)
    [37.5, -114.1315]      // Northeast corner (around Fresno)
];

// Restrict the map view to Southern California bounds
var map = L.map('map', {
    maxBounds: socalBounds,
    zoomControl: true,
    minZoom: 6,  // Limit how far out they can zoom
    maxZoom: 12  // Limit how close they can zoom in
}).setView([34.0522, -118.2437], 8); // Initial view centered on Los Angeles

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Add event listener to 'Add Pin' button for manual entry
document.getElementById('addPinBtn').addEventListener('click', function () {
    const name = document.getElementById('nameInput').value;
    const address = document.getElementById('addressInput').value;

    if (!name || !address) {
        alert('Please fill out both the name and address.');
        return;
    }

    fetch(`https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(address)}&key=YOUR_API_KEY`)
        .then(response => response.json())
        .then(data => {
            if (data.results.length > 0) {
                const latLng = data.results[0].geometry;

                // Emit the new pin to the server
                socket.emit('new mission', { lat: latLng.lat, lng: latLng.lng, info: `${name}: ${address}` });

                // Optionally clear the input fields
                document.getElementById('nameInput').value = '';
                document.getElementById('addressInput').value = '';
            } else {
                alert('Address not found. Please try again.');
            }
        })
        .catch(error => {
            console.error('Error fetching geocode data:', error);
        });
});

