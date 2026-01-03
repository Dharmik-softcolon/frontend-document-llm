import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 600000
});

export const transcribeAudio = async (audioBlob) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'audio.webm');
    
    const response = await api.post('/transcribe', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        },
        timeout: 120000 // 2 minutes for transcription
    });
    
    return response.data.transcript;
};