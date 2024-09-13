const API_KEY = 'c21d1bb174d74027af4df2ce25cde9a1';
var socket = io(); // Initializes the socket connection

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

// Initialize the map and set it to show from Fresno to Tijuana, centered around LA/OC
var map = L.map('map', {
    center: [34.0522, -118.2437],  // Centered near Los Angeles
    zoom: 8,  // Zoom out to show from Fresno to Tijuana
    minZoom: 7,  // Minimum zoom level (to prevent zooming too far out)
    maxZoom: 12  // Maximum zoom level (for detailed views of cities)
});

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Set bounds from Fresno (north) to Tijuana (south), Catalina Island (west) to Palm Springs (east)
var californiaBounds = [
    [32.5343, -118.6],  // Southwest corner (near Tijuana and Catalina Island)
    [37.0, -115.0]      // Northeast corner (near Fresno and Palm Springs)
];
map.setMaxBounds(californiaBounds);  // Restrict map bounds
map.fitBounds(californiaBounds);     // Ensure the map starts within these bounds

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
function addPinByAddress() {
    const address = document.getElementById('address-input').value;
    const name = document.getElementById('name-input').value;

    if (address && name) {
        fetch(`https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(address)}&key=${API_KEY}`)
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
