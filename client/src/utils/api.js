import axios from "axios";

const api = axios.create({
  baseURL: "/api",
});

export const getWeather = (city) => api.get(`/weather/${city}`);
export const getWeatherHistory = (city) => api.get(`/weather/${city}/history`);
export const getSummary = (city) => api.get(`/summary/${city}`);
export const saveThreshold = (data) => api.post("/thresholds", data);
