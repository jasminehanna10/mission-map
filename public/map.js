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

// Set map view for California/Southern California boundaries
var map = L.map('map').setView([34.0522, -118.2437], 9);  // Example coordinates for SoCal
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Handle form submission
document.getElementById('pin-form').addEventListener('submit', async function(event) {
    event.preventDefault();  // Prevent the form from reloading the page

    const userName = document.getElementById('userName').value;
    const userAddress = document.getElementById('userAddress').value;

    if (userName && userAddress) {
        const location = await geocodeAddress(userAddress);
        if (location) {
            // Emit the new mission event with the coordinates and user info
            socket.emit('new mission', {
                lat: location.lat,
                lng: location.lng,
                info: `${userName} at ${userAddress}`
            });
        }
    }
});

// Listen for updates from the server to update the map
socket.on('update map', function (data) {
    L.marker([data.lat, data.lng]).addTo(map)
        .bindPopup(data.info)
        .openPopup();
});

