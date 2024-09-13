// Map initialization with view restricted to California and zoom limits
var map = L.map('map', {
    center: [36.7783, -119.4179], // Centering on California
    zoom: 7, // Starting zoom level
    minZoom: 6, // Minimum zoom level (to prevent zooming out too far)
    maxZoom: 14, // Maximum zoom level (to prevent zooming in too close)
    maxBounds: [[32.5343, -124.4096], [36.7378, -119.7871]], // Boundaries: Southwest to Fresno
});

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Fetch function to get geocoded coordinates
async function geocodeAddress(address) {
    const apiKey = 'c21d1bb174d74027af4df2ce25cde9a1'; // Your OpenCage API key
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(address)}&key=${apiKey}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
            return data.results[0].geometry; // Return the first result's geometry (lat, lng)
        } else {
            alert('Address not found!');
            return null;
        }
    } catch (error) {
        console.error('Error fetching geocode data:', error);
        alert('An error occurred while fetching location data.');
        return null;
    }
}

// Listen for form submission
document.getElementById('pin-form').addEventListener('submit', async function (e) {
    e.preventDefault(); // Prevent the form from submitting in the traditional way
    
    const name = document.getElementById('userName').value;
    const address = document.getElementById('userAddress').value;

    if (!name || !address) {
        alert('Please enter both your name and an address.');
        return;
    }

    // Geocode the address
    const latLng = await geocodeAddress(address);
    
    if (latLng) {
        // Create a new pin and add it to the map
        const pinData = { lat: latLng.lat, lng: latLng.lng, info: `${name}: ${address}` };
        socket.emit('new mission', pinData); // Emit the new pin to the server
    }
});

// Connect to the server using socket.io
var socket = io();

// Load pins when the map initializes
socket.on('load pins', function (pins) {
    pins.forEach(function (pin) {
        addMarkerToMap(pin);
    });
});

// Add a pin to the map and include a removal option
function addMarkerToMap(data) {
    const marker = L.marker([data.lat, data.lng]).addTo(map)
        .bindPopup(`${data.info} <br><button onclick="removePin(${data.lat}, ${data.lng})">Remove Pin</button>`)
        .openPopup();
}

// Add the new pin to the map when a new mission is received
socket.on('update map', function (data) {
    addMarkerToMap(data);
});

// Function to remove a pin
function removePin(lat, lng) {
    if (confirm('Are you sure you want to remove this pin?')) {
        socket.emit('remove mission', { lat, lng });
    }
}

// Listen for pin removal event from the server
socket.on('remove pin', function (latLng) {
    // Find the marker with the given lat/lng and remove it from the map
    map.eachLayer(function (layer) {
        if (layer instanceof L.Marker) {
            const { lat, lng } = layer.getLatLng();
            if (lat === latLng.lat && lng === latLng.lng) {
                map.removeLayer(layer);
            }
        }
    });
});

