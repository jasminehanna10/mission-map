// Add OpenCage API Key
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

// Prompt for user name and address
async function addPin() {
    const userName = prompt('Please enter your name:');
    const userAddress = prompt('Please enter your address:');

    if (userName && userAddress) {
        // Call geocoding API to get latitude and longitude
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
}

// Call the addPin function when the page loads or when triggered
addPin();

// Listen for updates from the server to update the map
socket.on('update map', function (data) {
    L.marker([data.lat, data.lng]).addTo(map)
        .bindPopup(data.info)
        .openPopup();
});

