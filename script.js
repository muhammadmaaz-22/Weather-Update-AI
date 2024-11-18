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
        fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}`)
            .then(response => response.json())
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
        if (cityName === "") {
            alert("Please enter a city name.");
        } else {
            getWeather(cityName);
        }
    });

    // Get initial weather data for Karachi
    getWeather("Karachi");

    // Speech Recognition for interacting with Garry
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = function(event) {
        const spokenText = event.results[0][0].transcript.toLowerCase();
        if (spokenText.includes("hi garry") || spokenText.includes("hello garry")) {
            speakBotResponse("Hello, I am Garry! How can I help you today?");
        }
    };

    // Start listening for speech
    function startListening() {
        recognition.start();
        document.getElementById("statusMessage").innerText = "Garry is now listening...";  // Update the status message
    }

    // Speak a response from the bot
    function speakBotResponse(responseText) {
        if ('speechSynthesis' in window) {
            const speech = new SpeechSynthesisUtterance(responseText);
            speech.lang = 'en-US';
            speech.rate = 1;
            speech.pitch = 1;
            speech.volume = 1;
            window.speechSynthesis.speak(speech);
        }
    }

    // Activate listening when the user clicks on the bot image
    document.getElementById("botImage").addEventListener("click", function() {
        startListening();
    });

    // Activate listening when the user clicks a button (or can be voice-activated)
    document.getElementById("startListeningBtn").addEventListener("click", startListening);
});// Get elements
const chatbotBtn = document.getElementById('chatbotBtn');
const botImage = document.getElementById('botImage');
const statusMessage = document.getElementById('statusMessage');
const voiceWave = document.getElementById('voiceWave');



// Add event listener to chatbot button
chatbotBtn.addEventListener('click', () => {
  // Toggle active class for resizing and animation
  chatbotBtn.classList.toggle('active');
  
  // Toggle vibrating effect when bot starts answering
  if (chatbotBtn.classList.contains('active')) {
    // Show the "Garry is listening..." message
    statusMessage.textContent = "Garry is listening...";
    statusMessage.style.display = "block";
    
    // Add the vibrating effect when active
    chatbotBtn.classList.add('vibrating');

    // Show the voice wave effect
    voiceWave.style.display = "block";
    
    // Play the voice (text-to-speech) audio message with a female voice
    let speech = new SpeechSynthesisUtterance("I'm activated. How can I help you?");
    speech.lang = "en-US";
    
    // Select a female voice (if available)
    let voices = window.speechSynthesis.getVoices();
    speech.voice = voices.find(voice => voice.name.includes("Female")) || voices[0]; // Default to the first available voice if no female voices found
    
    window.speechSynthesis.speak(speech);

    // Start listening for user input after activation
    startListening();
  } else {
    // Hide the status message and voice wave if the chatbot is closed
    statusMessage.style.display = "none";
    voiceWave.style.display = "none";
  }
});

// Function to start listening for user input
function startListening() {
  // Set up Speech Recognition (Web Speech API)
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = 'en-US'; // Set the language to English
  
  recognition.onstart = function() {
    // Update status message when listening starts
    statusMessage.textContent = "Listening...";
  };

  recognition.onresult = function(event) {
    const userSpeech = event.results[0][0].transcript.toLowerCase();
    console.log("User said:", userSpeech); // Log user input for debugging

    // Check if user said "weather" and a city name
    if (userSpeech.includes("weather")) {
      let city = userSpeech.split("in")[1]?.trim(); // Extract city from user input
      if (city) {
        fetchWeather(city);
      } else {
        speak("I didn't catch the city. Please mention the city.");
      }
    } else {
      speak("Sorry, I didn't understand. Please ask me about the weather.");
    }
  };

  recognition.onerror = function(event) {
    console.error("Speech Recognition Error", event.error);
    speak("Sorry, there was an issue with listening. Please try again.");
  };

  recognition.start();
}

// Function to speak a message
function speak(message) {
  let speech = new SpeechSynthesisUtterance(message);
  speech.lang = "en-US";
  
  let voices = window.speechSynthesis.getVoices();
  speech.voice = voices.find(voice => voice.name.includes("Female")) || voices[0]; // Select a female voice

  window.speechSynthesis.speak(speech);
}

// Function to fetch weather for a city
function fetchWeather(city) {
  const url = `${weatherApiUrl}${city}&appid=${weatherApiKey}&units=metric`;
  fetch(url)
    .then(response => response.json())
    .then(data => {
      if (data.cod === 200) {
        const weatherDescription = data.weather[0].description;
        const temperature = data.main.temp;
        const weatherMessage = `The weather in ${city} is ${weatherDescription} with a temperature of ${temperature}°C.`;
        speak(weatherMessage);
        statusMessage.textContent = weatherMessage;
      } else {
        speak("I couldn't find the weather information for that city. Please try again.");
      }
    })
    .catch(error => {
      console.error("Error fetching weather:", error);
      speak("Sorry, I couldn't fetch the weather information. Please try again later.");
    });
}
