// Weather condition mapping[cite: 2]
const weatherCodes = {
  0: "Clear Sky",
  1: "Mainly Clear",
  2: "Partly Cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing Rime Fog",
  51: "Light Drizzle",
  53: "Moderate Drizzle",
  55: "Dense Drizzle",
  61: "Slight Rain",
  63: "Moderate Rain",
  65: "Heavy Rain",
  71: "Slight Snow",
  80: "Rain Showers",
  95: "Thunderstorm"
};

function getWeatherDescription(code) {
  return weatherCodes[code] || "Variable Conditions";
}

// 1. Geocoding API Call[cite: 2]
async function findCity(name) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?count=1&name=${encodeURIComponent(name)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Search service currently unavailable.");
  
  const data = await res.json();
  if (!data.results || data.results.length === 0) {
    throw new Error("City not found. Please try another city.");
  }
  
  const city = data.results[0];
  return {
    name: city.name,
    country: city.country || "",
    lat: city.latitude,
    lon: city.longitude
  };
}

// 2. Open-Meteo Weather API Call[cite: 2, 3]
async function getWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&forecast_days=5&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load forecast data.");
  return res.json();
}

// DOM Elements
const form = document.getElementById("weather-form");
const cityInput = document.getElementById("city-input");
const searchBtn = document.getElementById("search-btn");
const statusDiv = document.getElementById("status-message");

const currentCard = document.getElementById("current-weather");
const cityNameEl = document.getElementById("city-name");
const currentDateEl = document.getElementById("current-date");
const currentTempEl = document.getElementById("current-temp");
const currentConditionEl = document.getElementById("current-condition");
const currentBadgeEl = document.getElementById("current-badge");

const forecastSection = document.getElementById("forecast-section");
const forecastContainer = document.getElementById("forecast-container");

// Render UI Function[cite: 2]
function renderWeather(city, weather) {
  // Current Card Display
  cityNameEl.textContent = `${city.name}, ${city.country}`;
  currentDateEl.textContent = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric"
  });
  
  currentTempEl.textContent = Math.round(weather.current.temperature_2m);
  const condition = getWeatherDescription(weather.current.weather_code);
  currentConditionEl.textContent = condition;
  currentBadgeEl.textContent = condition;
  currentCard.classList.remove("hidden");

  // Forecast Rendering[cite: 2, 3]
  forecastContainer.innerHTML = "";
  const daily = weather.daily;

  for (let i = 0; i < daily.time.length; i++) {
    const card = document.createElement("div");
    card.className = "forecast-card";

    const dayName = new Date(daily.time[i]).toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric"
    });

    const dayEl = document.createElement("p");
    dayEl.className = "forecast-day";
    dayEl.textContent = dayName;

    const tempEl = document.createElement("p");
    tempEl.className = "forecast-temp";
    tempEl.innerHTML = `${Math.round(daily.temperature_2m_max[i])}° <span class="forecast-min">/ ${Math.round(daily.temperature_2m_min[i])}°</span>`;

    const condEl = document.createElement("p");
    condEl.className = "forecast-cond";
    condEl.textContent = getWeatherDescription(daily.weather_code[i]);

    card.append(dayEl, tempEl, condEl);
    forecastContainer.appendChild(card);
  }
  forecastSection.classList.remove("hidden");
}

// Controller Logic
async function fetchAndShowWeather(name) {
  statusDiv.className = "status-msg";
  statusDiv.textContent = "Fetching live satellite data...";
  searchBtn.disabled = true;
  currentCard.classList.add("hidden");
  forecastSection.classList.add("hidden");

  try {
    const city = await findCity(name);
    const weather = await getWeather(city.lat, city.lon);
    
    statusDiv.textContent = "";
    renderWeather(city, weather);
    localStorage.setItem("lastCity", name); // LocalStorage requirement[cite: 2, 3]
  } catch (err) {
    statusDiv.className = "status-msg error";
    statusDiv.textContent = err.message;
  } finally {
    searchBtn.disabled = false;
  }
}

// Event Listeners
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = cityInput.value.trim();
  if (!name) {
    statusDiv.className = "status-msg error";
    statusDiv.textContent = "Please enter a city name to search.";
    return;
  }
  fetchAndShowWeather(name);
});

// Load previously remembered city[cite: 2, 3]
window.addEventListener("DOMContentLoaded", () => {
  const lastCity = localStorage.getItem("lastCity");
  if (lastCity) {
    cityInput.value = lastCity;
    fetchAndShowWeather(lastCity);
  }
});