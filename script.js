document.addEventListener("DOMContentLoaded", function() {
    const apiKey = "76a2100077e1cce5bbb13f02acf9f280"; // OpenWeatherMap API key
    const map = L.map('map').setView([24.8607, 67.0011], 5); // Default view (Karachi)
    const botName = "Garry"; // The AI bot's name

    // Set up the base OpenStreetMap layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    // Add OpenWeatherMap weather layers (temperature, clouds, wind, etc.)
    const baseLayers = {
        "OpenStreetMap": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'),
    };

    const overlayLayers = {
        "Precipitation": L.tileLayer(`https://{s}.tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${apiKey}`),
        "Clouds": L.tileLayer(`https://{s}.tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${apiKey}`),
    };

    L.control.layers(baseLayers, overlayLayers).addTo(map);

    // Function to get weather data
    function getWeather(city) {
        console.log("Getting weather for:", city); // Log the city name for debugging
        fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error("City not found");
                }
                return response.json();
            })
            .then(data => {
                displayWeather(data);
                checkWeatherAlert(data.weather[0].main.toLowerCase(), city);
                updateMapWithWeather(data.coord.lat, data.coord.lon);
                speakWeatherInfo(data);
            })
            .catch(error => {
                console.error("Error fetching weather data:", error);
                alert("Sorry, we couldn't retrieve the weather data for this location. Please try again.");
            });
    }

    // Function to display weather data in the right box
    function displayWeather(data) {
        const city = data.name;
        const weatherDesc = data.weather[0].description;
        const temp = Math.round(data.main.temp - 273.15); // Convert to Celsius
        const forecast = `${weatherDesc} with a temperature of ${temp}°C`; // Dynamic forecast

        document.getElementById("cityName").innerText = `City: ${city}`;
        document.getElementById("weatherDesc").innerText = `Weather: ${weatherDesc}`;
        document.getElementById("temperature").innerText = `Temperature: ${temp}°C`;
        document.getElementById("forecast").innerText = `Forecast: ${forecast}`;
    }

    // Function to check weather condition and show popup alert
    function checkWeatherAlert(weatherCondition, city) {
        const alertMessageBox = document.getElementById("weatherAlertBox");
        let alertMessage = '';

        switch (weatherCondition) {
            case "thunderstorm":
                alertMessage = `⚡ Thunderstorm Warning in ${city}! Stay indoors.`;
                break;
            case "rain":
                alertMessage = `🌧️ Rain Alert in ${city}. Bring your umbrella!`;
                break;
            case "snow":
                alertMessage = `❄️ Snowfall Warning in ${city}. Drive safely!`;
                break;
            case "clear":
                alertMessage = `☀️ Clear skies in ${city}. Enjoy your day!`;
                break;
            default:
                alertMessage = `Weather update for ${city}: ${weatherCondition}.`;
        }

        if (alertMessage) {
            showAlert(alertMessage);  // Show the alert box with the dynamic message
        }
    }

    // Function to update map with weather markers and info
    function updateMapWithWeather(lat, lon) {
        // Clear previous markers
        map.eachLayer(layer => {
            if (layer instanceof L.Marker) {
                map.removeLayer(layer);
            }
        });

        // Add a new marker with the weather data
        L.marker([lat, lon]).addTo(map)
            .bindPopup(`<b>Weather Location</b><br>Lat: ${lat}, Lon: ${lon}`)
            .openPopup();

        // Update the map view to center on the new city and zoom in
        map.setView([lat, lon], 10); // Set new center and zoom level
    }

    // Function to speak the weather update aloud
    function speakWeatherInfo(data) {
        const city = data.name;
        const weatherDesc = data.weather[0].description;
        const temp = Math.round(data.main.temp - 273.15); // Convert to Celsius
        const humidity = data.main.humidity;
        const windSpeed = data.wind.speed;
        const forecast = `${weatherDesc}, with a temperature of ${temp} degrees Celsius.`;

        let speechText = `Hey there! The weather in ${city} is currently ${forecast} `;
        
        // Add advice based on conditions
        if (weatherDesc.includes("rain")) {
            speechText += `It looks like rain, so you might want to carry an umbrella!`;
        } else if (weatherDesc.includes("clear")) {
            speechText += `It’s a sunny day, perfect for some outdoor fun!`;
        } else if (weatherDesc.includes("cloud")) {
            speechText += `There are some clouds in the sky, but no need to worry.`;
        }

        // Mention humidity and wind speed for a more personalized forecast
        speechText += ` The humidity level is at ${humidity}%. The wind speed is around ${windSpeed} meters per second.`;
        
        // Check if the SpeechSynthesis API is supported
        if ('speechSynthesis' in window) {
            const speech = new SpeechSynthesisUtterance(speechText);
            speech.lang = 'en-US';  // You can change language here
            speech.rate = 1;        // Speed of the voice
            speech.pitch = 1;       // Pitch of the voice
            speech.volume = 1;      // Volume level
            window.speechSynthesis.speak(speech);
        } else {
            console.log("SpeechSynthesis API is not supported in your browser.");
        }
    }

    // Function to show the alert box with dynamic message
    function showAlert(message) {
        const alertBox = document.getElementById('weatherAlert');
        alertBox.querySelector('p').innerText = message; // Set the dynamic message
        alertBox.style.display = 'block'; // Show the alert box
    }

    // Handle user input for city search
    document.getElementById("getWeatherBtn").addEventListener("click", function() {
        const cityName = document.getElementById("cityInput").value.trim();
        console.log("City entered:", cityName); // Log the city name for debugging
        
        if (cityName === "") {
            alert("Please enter a city name.");
        } else {
            getWeather(cityName); // Get weather for entered city
        }
    });

    // Get initial weather data for Karachi
    getWeather("Karachi");

    // Setup SpeechRecognition (Speech to Text)
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.continuous = true; // keep listening until stopped
    recognition.interimResults = false; // get final result only

    // Setup Speech Synthesis (Text to Speech)
    const synth = window.speechSynthesis;

    // Function to start listening to user voice input
    function startListening() {
        recognition.start();
        document.getElementById("response").innerHTML = "Listening... Speak now!";
    }

    // Handle the recognition result
    recognition.onresult = function(event) {
        const spokenText = event.results[event.resultIndex][0].transcript.toLowerCase();
        console.log("Spoken text:", spokenText); // Log for debugging

        if (spokenText.includes("hello garry") || spokenText.includes("hi garry")) {
            speakResponse("Hello! How can I assist you today?");
        }
        else if (spokenText.includes("what's the weather in") || spokenText.includes("weather in")) {
            const city = extractCity(spokenText);
            if (city) {
                getWeather(city);
            } else {
                speakResponse("Please mention a city after 'weather in'. For example, 'What's the weather in Lahore?'");
            }
        }
        else if (spokenText.includes("what time is it") || spokenText.includes("tell me the time")) {
            const currentTime = new Date().toLocaleTimeString();
            speakResponse("The current time is " + currentTime);
        }
        else if (spokenText.includes("what's your name") || spokenText.includes("who are you")) {
            speakResponse("I am Garry, your voice assistant. How can I help you?");
        }
        else if (spokenText.includes("tell me a joke") || spokenText.includes("make me laugh")) {
            tellJoke();
        }
        else if (spokenText.includes("goodbye") || spokenText.includes("bye")) {
            speakResponse("Goodbye! Have a great day!");
            recognition.stop();
        }
        else {
            speakResponse("Sorry, I didn't quite catch that. Can you repeat?");
        }
    };

    // Extract the city name from the spoken text
    function extractCity(text) {
        const cityPattern = /weather in ([a-zA-Z ]+)/;
        const match = text.match(cityPattern);
        return match ? match[1] : null;
    }

    // Function to respond to the user's speech
    function speakResponse(responseText) {
        const utterance = new SpeechSynthesisUtterance(responseText);
        utterance.lang = 'en-US';
        synth.speak(utterance);
        document.getElementById("response").innerHTML = responseText;
    }

    // Start listening to user speech when button is clicked
    document.getElementById("startListeningBtn").addEventListener("click", startListening);

    // Function to tell a joke
    function tellJoke() {
        const jokes = [
            "Why don't skeletons fight each other? They don't have the guts.",
            "I told my computer I needed a break, and now it won’t stop sending me KitKats.",
            "Why don’t programmers like nature? It has too many bugs.",
            "What do you call fake spaghetti? An impasta."
        ];

        const joke = jokes[Math.floor(Math.random() * jokes.length)];
        speakResponse(joke);
    }
});
