import { useState, useRef, useEffect } from "react";
import { api, transcribeAudio } from "../api";

export default function ChatInput({ setMessages, setLoading, loading }) {
    const [question, setQuestion] = useState("");
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [ttsEnabled, setTtsEnabled] = useState(() => {
        // Load from localStorage or default to false
        const saved = localStorage.getItem('ttsEnabled');
        return saved ? JSON.parse(saved) : false;
    });
    const textareaRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const speechSynthesisRef = useRef(null);

    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            const scrollHeight = textarea.scrollHeight;
            
            if (scrollHeight <= 200) {
                textarea.style.height = `${Math.max(52, scrollHeight)}px`;
            } else {
                textarea.style.height = '200px';
            }
        }
    }, [question]);

    const speakText = (text) => {
        // Stop any ongoing speech
        if (speechSynthesisRef.current) {
            window.speechSynthesis.cancel();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        speechSynthesisRef.current = utterance;
        window.speechSynthesis.speak(utterance);
    };

    const ask = async (questionText = null) => {
        const questionToAsk = questionText || question;
        if (!questionToAsk.trim() || loading) return;

        setMessages(prev => [
            ...prev,
            { role: "user", content: questionToAsk }
        ]);

        setLoading(true);
        if (!questionText) {
            setQuestion("");
        }

        try {
            const res = await api.post("/chat", { question: questionToAsk.trim() });

            setMessages(prev => [
                ...prev,
                { role: "assistant", content: res.data.answer }
            ]);

            // Speak the answer only if TTS is enabled
            if (ttsEnabled) {
                speakText(res.data.answer);
            }
        } catch (error) {
            const errorMessage = "Sorry, I encountered an error. Please try again.";
            setMessages(prev => [
                ...prev,
                { role: "assistant", content: errorMessage }
            ]);
            if (ttsEnabled) {
                speakText(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus'
            });

            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                stream.getTracks().forEach(track => track.stop());
                
                setIsTranscribing(true);
                try {
                    const transcript = await transcribeAudio(audioBlob);
                    if (transcript && transcript.trim()) {
                        setQuestion(transcript);
                        await ask(transcript);
                    } else {
                        setMessages(prev => [
                            ...prev,
                            { role: "assistant", content: "I couldn't understand the audio. Please try speaking again." }
                        ]);
                    }
                } catch (error) {
                    console.error("Transcription error:", error);
                    setMessages(prev => [
                        ...prev,
                        { role: "assistant", content: "Failed to transcribe audio. Please try again." }
                    ]);
                } finally {
                    setIsTranscribing(false);
                }
            };

            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.start();
            setIsRecording(true);
        } catch (error) {
            console.error("Error starting recording:", error);
            alert("Failed to access microphone. Please check your permissions.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    useEffect(() => {
        // Save TTS preference to localStorage
        localStorage.setItem('ttsEnabled', JSON.stringify(ttsEnabled));
    }, [ttsEnabled]);

    useEffect(() => {
        return () => {
            if (mediaRecorderRef.current && isRecording) {
                mediaRecorderRef.current.stop();
            }
            if (speechSynthesisRef.current) {
                window.speechSynthesis.cancel();
            }
        };
    }, [isRecording]);

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            ask();
        }
    };

    const handleChange = ({ target: { value } }) => {
        try {
            setQuestion(value);
        } catch (error) {
            console.error('Error updating question:', error);
        }
    };

    const toggleTTS = () => {
        setTtsEnabled(prev => !prev);
        // Stop any ongoing speech when disabling
        if (ttsEnabled && speechSynthesisRef.current) {
            window.speechSynthesis.cancel();
        }
    };

    return (
        <div className="border-t border-border bg-panel px-6 py-4">
            <div className="max-w-4xl mx-auto">
                <div className="flex gap-3 items-end">
                    <div className="flex flex-col gap-2">
                        <button
                            onClick={isRecording ? stopRecording : startRecording}
                            disabled={loading || isTranscribing}
                            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-soft ${
                                isRecording 
                                    ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                                    : 'bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed'
                            }`}
                            title={isRecording ? "Stop recording" : "Start voice recording"}
                        >
                            {isTranscribing ? (
                                <svg className="w-6 h-6 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : isRecording ? (
                                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M6 6h12v12H6z" />
                                </svg>
                            ) : (
                                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                                </svg>
                            )}
                        </button>
                        <button
                            onClick={toggleTTS}
                            className={`w-12 h-10 rounded-lg flex items-center justify-center transition-all shadow-soft ${
                                ttsEnabled 
                                    ? 'bg-primary hover:bg-primary-hover' 
                                    : 'bg-bg-secondary hover:bg-bg-secondary/80 border border-border'
                            }`}
                            title={ttsEnabled ? "Disable text-to-speech" : "Enable text-to-speech"}
                        >
                            {ttsEnabled ? (
                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5 text-muted" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                                </svg>
                            )}
                        </button>
                    </div>
                    <div className="flex-1 relative">
                        <textarea
                            ref={textareaRef}
                            value={question || ''}
                            onChange={handleChange}
                            onKeyDown={handleKeyPress}
                            placeholder="Ask a question about your document or use voice..."
                            rows={1}
                            className="w-full bg-bg-secondary border border-border rounded-xl px-4 py-3 pr-12 text-[15px] text-white placeholder-muted resize-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all overflow-y-auto"
                            style={{ minHeight: '52px', maxHeight: '200px' }}
                            disabled={loading || isTranscribing}
                        />
                        <button
                            onClick={() => ask()}
                            disabled={!question.trim() || loading || isTranscribing}
                            className="absolute right-2 bottom-2 w-8 h-8 bg-primary hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed rounded-lg flex items-center justify-center transition-all shadow-soft"
                        >
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        </button>
                    </div>
                </div>
                <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-muted ml-1">
                        {isRecording ? (
                            <span className="text-red-400">● Recording... Click again to stop</span>
                        ) : isTranscribing ? (
                            <span className="text-blue-400">Transcribing audio...</span>
                        ) : (
                            "Press Enter to send, Shift+Enter for new line, or click microphone to use voice"
                        )}
                    </p>
                    {ttsEnabled && (
                        <p className="text-xs text-primary flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                            </svg>
                            Audio enabled
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
