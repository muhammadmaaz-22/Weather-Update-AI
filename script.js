document.addEventListener("DOMContentLoaded", function () {
    const apiKey = "76a2100077e1cce5bbb13f02acf9f280"; // OpenWeatherMap API key
    const map = L.map("map").setView([24.8607, 67.0011], 5); // Default view (Karachi)
    const botName = "Garry"; // The AI bot's name

    // Set up the base OpenStreetMap layer
    const openStreetMapLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png");
    openStreetMapLayer.addTo(map);

    // Add weather overlay layers
    const overlayLayers = {
        "Precipitation": L.tileLayer(`https://{s}.tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${apiKey}`),
        "Clouds": L.tileLayer(`https://{s}.tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${apiKey}`),
    };

    L.control.layers({ "OpenStreetMap": openStreetMapLayer }, overlayLayers).addTo(map);

    // Function to fetch weather data
    function getWeather(city) {
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}`;
        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.cod === 200) {
                    displayWeather(data);
                    checkWeatherAlert(data.weather[0].main.toLowerCase(), city);
                    updateMapWithWeather(data.coord.lat, data.coord.lon);
                    speakWeatherInfo(data);
                } else {
                    alert(`Weather information for "${city}" not found. Please check the city name.`);
                }
            })
            .catch(error => {
                console.error("Error fetching weather data:", error);
                alert("Unable to retrieve weather data. Please try again later.");
            });
    }

    // Display weather information
    function displayWeather(data) {
        const city = data.name;
        const weatherDesc = data.weather[0].description;
        const temp = Math.round(data.main.temp - 273.15); // Convert Kelvin to Celsius
        const forecast = `${weatherDesc} with a temperature of ${temp}°C`;

        document.getElementById("cityName").innerText = `City: ${city}`;
        document.getElementById("weatherDesc").innerText = `Weather: ${weatherDesc}`;
        document.getElementById("temperature").innerText = `Temperature: ${temp}°C`;
        document.getElementById("forecast").innerText = `Forecast: ${forecast}`;
    }

    // Show weather alert
    function checkWeatherAlert(condition, city) {
        const weatherAlertBox = document.getElementById("weatherAlert");
        const alertMessages = {
            thunderstorm: `⚡ Thunderstorm in ${city}! Stay indoors.`,
            rain: `🌧️ Rain in ${city}. Don't forget your umbrella!`,
            snow: `❄️ Snow in ${city}. Drive carefully!`,
            clear: `☀️ Clear skies in ${city}. Have a great day!`,
        };

        const alertMessage = alertMessages[condition] || `Weather in ${city}: ${condition}`;
        weatherAlertBox.querySelector("p").innerText = alertMessage;
        weatherAlertBox.style.display = "block";
    }

    // Update map based on weather data
    function updateMapWithWeather(lat, lon) {
        // Clear previous markers
        map.eachLayer(layer => {
            if (layer instanceof L.Marker) map.removeLayer(layer);
        });

        // Add new marker
        L.marker([lat, lon])
            .addTo(map)
            .bindPopup(`Lat: ${lat}, Lon: ${lon}`)
            .openPopup();

        map.setView([lat, lon], 10); // Center and zoom to location
    }

    // Speak weather information
    function speakWeatherInfo(data) {
        const city = data.name;
        const weatherDesc = data.weather[0].description;
        const temp = Math.round(data.main.temp - 273.15);
        const humidity = data.main.humidity;
        const windSpeed = data.wind.speed;

        const forecast = `${weatherDesc}, with a temperature of ${temp}°C, humidity of ${humidity}%, and wind speed of ${windSpeed} m/s.`;

        speak(`The weather in ${city} is ${forecast}`);
    }

    // Speak function
    function speak(message) {
        if ("speechSynthesis" in window) {
            const speech = new SpeechSynthesisUtterance(message);
            speech.lang = "en-US";
            speech.rate = 1;
            speech.pitch = 1;
            speech.volume = 1;
            window.speechSynthesis.speak(speech);
        } else {
            console.error("SpeechSynthesis API not supported in this browser.");
        }
    }

    // Handle user input for city search
    document.getElementById("getWeatherBtn").addEventListener("click", function () {
        const cityName = document.getElementById("cityInput").value.trim();
        if (!cityName) {
            alert("Please enter a city name.");
        } else {
            getWeather(cityName);
        }
    });

    // Default weather display for Karachi
    getWeather("Karachi");

    // Voice interaction with Garry
    document.getElementById("botImage").addEventListener("click", startListening);

    function startListening() {
        const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.lang = "en-US";

        recognition.onstart = () => {
            document.getElementById("statusMessage").innerText = "Garry is listening...";
        };

        recognition.onresult = event => {
            const userInput = event.results[0][0].transcript.toLowerCase();
            if (userInput.includes("weather")) {
                const city = userInput.split("in")[1]?.trim();
                if (city) {
                    getWeather(city);
                } else {
                    speak("Please specify a city name.");
                }
            } else {
                speak("Sorry, I didn't understand. Please ask about the weather.");
            }
        };

        recognition.onerror = () => {
            speak("There was an error with voice recognition. Please try again.");
        };

        recognition.start();
    }
});
