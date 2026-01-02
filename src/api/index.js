import axios from "axios";

// Get API URL from environment variable, fallback to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 600000 // 10 minutes default timeout for long operations like OCR
});
