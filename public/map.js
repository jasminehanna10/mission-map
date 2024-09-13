const API_KEY = 'c21d1bb174d74027af4df2ce25cde9a1';

// Function to handle geocoding
async function geocodeAddress(address) {
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(address)}&key=${API_KEY}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.results && data.results.length > 0) {
            const location = data.results[0].geometry;
            return location;  // return {lat: ..., lng: ...}
        } else {
            throw new Error('No results found for the provided address.');
        }
    } catch (error) {
        console.error('Error fetching geocode data:', error);
        alert('There was an issue finding that address. Please try again.');
        return null;
    }
}

// Initialize the map, set it to Southern California area
var map = L.map('map').setView([34.0522, -118.2437], 9);  // Set view to Los Angeles as the default
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Set bounds for Southern California
var californiaBounds = [
    [32.5343, -124.4096],  // Southwest corner
    [37.0000, -118.0000]   // Northeast corner (adjusted for SoCal)
];
map.setMaxBounds(californiaBounds);
map.fitBounds(californiaBounds); // Ensure map is centered within these bounds

// Function to add a marker and include a removal button in the popup
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

// Function to handle form submission and geocoding
document.getElementById('pin-form').addEventListener('submit', async function(event) {
    event.preventDefault();  // Prevent the form from reloading the page

    const userName = document.getElementById('userName').value;
    const userAddress = document.getElementById('userAddress').value;

    if (userName && userAddress) {
        const location = await geocodeAddress(userAddress);
        if (location) {
            // Emit the new mission event with the coordinates and user info
            const pinData = {
                lat: location.lat,
                lng: location.lng,
                info: `${userName} at ${userAddress}`
            };

            socket.emit('new mission', pinData);  // Send the pin to the server

            // Add the pin locally for immediate feedback
            addMarkerToMap(pinData);
        }
    } else {
        alert("Please enter both name and address.");
    }
});

