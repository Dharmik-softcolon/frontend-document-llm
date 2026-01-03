import { useState, useRef, useEffect } from "react";
import { api } from "../api";

export default function ChatInput({ setMessages, setLoading, loading }) {
    const [question, setQuestion] = useState("");
    const [ttsEnabled, setTtsEnabled] = useState(() => {
        // Load from localStorage or default to false
        const saved = localStorage.getItem('ttsEnabled');
        return saved ? JSON.parse(saved) : false;
    });
    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [speechSupported, setSpeechSupported] = useState(false);
    const textareaRef = useRef(null);
    const speechSynthesisRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

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

    // Initialize microphone support (AssemblyAI-based)
    useEffect(() => {
        // Check if browser supports MediaRecorder API
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            setSpeechSupported(true);
            console.log('Speech recognition ready (AssemblyAI)');
        } else {
            console.log('MediaRecorder not supported in this browser');
            setSpeechSupported(false);
        }

        return () => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                try {
                    mediaRecorderRef.current.stop();
                } catch (e) {
                    console.log('Error stopping recorder on cleanup:', e);
                }
            }
        };
    }, []);

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
                { 
                    role: "assistant", 
                    content: res.data.answer,
                    sources: res.data.sources || [],
                    hasTabularData: res.data.hasTabularData || false
                }
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

    useEffect(() => {
        // Save TTS preference to localStorage
        localStorage.setItem('ttsEnabled', JSON.stringify(ttsEnabled));
    }, [ttsEnabled]);

    useEffect(() => {
        return () => {
            if (speechSynthesisRef.current) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

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

    const startListening = async () => {
        if (!speechSupported) {
            alert('🎤 Microphone Not Supported\n\n' +
                  'Your browser doesn\'t support audio recording.\n\n' +
                  'Please use a modern browser or type your question instead!');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];
            
            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };
            
            mediaRecorderRef.current.onstart = () => {
                console.log('Recording started');
                setIsListening(true);
            };
            
            mediaRecorderRef.current.onstop = async () => {
                console.log('Recording stopped');
                setIsListening(false);
                setIsProcessing(true);
                
                // Create audio blob
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                
                // Send to backend for transcription
                const formData = new FormData();
                formData.append('audio', audioBlob, 'recording.webm');
                
                try {
                    const response = await api.post('/speech/speech-to-text', formData, {
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        }
                    });
                    
                    if (response.data.success && response.data.text) {
                        const transcribedText = response.data.text;
                        setQuestion(transcribedText);
                        setIsProcessing(false);
                        
                        // Auto-submit the question
                        setTimeout(() => {
                            ask(transcribedText);
                        }, 100);
                    } else {
                        setIsProcessing(false);
                        alert('Could not transcribe audio. Please try again.');
                    }
                } catch (error) {
                    console.error('Transcription error:', error);
                    setIsProcessing(false);
                    alert('🎤 Transcription Failed\n\nPlease try speaking again or type your question.');
                }
                
                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };
            
            mediaRecorderRef.current.start();
            
        } catch (error) {
            console.error('Error starting recording:', error);
            setIsListening(false);
            
            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                alert('🎤 Microphone Access Denied!\n\n' +
                      '1. Click the 🔒 lock icon in the address bar\n' +
                      '2. Change Microphone to "Allow"\n' +
                      '3. Reload the page (F5)\n' +
                      '4. Try holding the microphone button again');
            } else {
                alert('🎤 Could not start microphone\n\n' +
                      'The microphone is not available.\n' +
                      'Please check:\n' +
                      '1. Microphone is connected\n' +
                      '2. No other app is using it\n' +
                      '3. Browser has permission');
            }
        }
    };

    const stopListening = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
    };

    const toggleListening = async () => {
        if (isListening) {
            // Stop recording
            stopListening();
        } else {
            // Start recording
            await startListening();
        }
    };

    return (
        <>
            {/* Recording Modal Overlay */}
            {(isListening || isProcessing) && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
                    <div className="bg-gradient-to-br from-panel to-bg-secondary border border-border rounded-3xl p-8 shadow-2xl max-w-md w-full mx-4 animate-scaleIn">
                        {isListening ? (
                            <>
                                {/* Recording State */}
                                <div className="text-center">
                                    <div className="relative inline-block mb-6">
                                        {/* Pulsing rings */}
                                        <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping"></div>
                                        <div className="absolute inset-0 rounded-full bg-red-500/30 animate-pulse"></div>
                                        
                                        {/* Microphone icon */}
                                        <div className="relative w-24 h-24 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-xl">
                                            <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                                                <path d="M17.3 11c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
                                            </svg>
                                        </div>
                                    </div>
                                    
                                    <h3 className="text-2xl font-semibold text-white mb-2">Recording...</h3>
                                    <p className="text-muted mb-6">Speak your question now</p>
                                    
                                    {/* Animated bars */}
                                    <div className="flex items-center justify-center gap-1 h-12 mb-6">
                                        {[...Array(5)].map((_, i) => (
                                            <div
                                                key={i}
                                                className="w-1 bg-gradient-to-t from-red-500 to-red-400 rounded-full animate-wave"
                                                style={{
                                                    animationDelay: `${i * 0.1}s`,
                                                    height: '100%'
                                                }}
                                            ></div>
                                        ))}
                                    </div>
                                    
                                    {/* Stop Button */}
                                    <button
                                        onClick={stopListening}
                                        className="px-8 py-3 bg-gradient-to-r from-primary to-primary-hover text-white rounded-xl font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2 mx-auto"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h6v4H9z" />
                                        </svg>
                                        <span>Stop & Process</span>
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Processing State */}
                                <div className="text-center">
                                    <div className="relative inline-block mb-6">
                                        {/* Spinning ring */}
                                        <div className="w-24 h-24 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
                                        
                                        {/* Center icon */}
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                            </svg>
                                        </div>
                                    </div>
                                    
                                    <h3 className="text-2xl font-semibold text-white mb-2">Processing...</h3>
                                    <p className="text-muted mb-4">Transcribing your audio</p>
                                    
                                    {/* Progress dots */}
                                    <div className="flex items-center justify-center gap-2">
                                        {[...Array(3)].map((_, i) => (
                                            <div
                                                key={i}
                                                className="w-2 h-2 bg-primary rounded-full animate-bounce"
                                                style={{
                                                    animationDelay: `${i * 0.15}s`,
                                                    animationDuration: '0.6s'
                                                }}
                                            ></div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Input Area */}
            <div className="border-t border-border bg-panel px-6 py-4">
                <div className="max-w-4xl mx-auto">
                    <div className="flex gap-3 items-end">
                    <div className="flex-1 relative">
                        <textarea
                            ref={textareaRef}
                            value={question || ''}
                            onChange={handleChange}
                            onKeyDown={handleKeyPress}
                            placeholder="Ask a question about your document..."
                            rows={1}
                            className="w-full bg-bg-secondary border border-border rounded-xl px-4 py-3 pr-12 text-[15px] text-white placeholder-muted resize-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all overflow-y-auto disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ minHeight: '52px', maxHeight: '200px' }}
                            disabled={loading || isListening || isProcessing}
                        />
                        <button
                            onClick={() => ask()}
                            disabled={!question.trim() || loading || isListening || isProcessing}
                            className="absolute right-2 bottom-2 w-8 h-8 bg-primary hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed rounded-lg flex items-center justify-center transition-all shadow-soft"
                        >
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        </button>
                    </div>
                    
                    {/* Voice Input Button - Click to Record */}
                    <button
                        onClick={toggleListening}
                        disabled={loading || !speechSupported || isProcessing}
                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-soft select-none ${
                            isListening 
                                ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                                : speechSupported
                                    ? 'bg-bg-secondary hover:bg-bg-secondary/80 border border-border hover:border-primary/50'
                                    : 'bg-bg-secondary/50 border border-border opacity-50 cursor-not-allowed'
                        }`}
                        title={
                            !speechSupported 
                                ? "Speech recognition not supported" 
                                : isProcessing
                                    ? "Processing audio..."
                                    : isListening
                                        ? "Click to stop recording"
                                        : "Click to start recording"
                        }
                    >
                        {isListening ? (
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                                <path d="M17.3 11c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
                            </svg>
                        ) : (
                            <svg className="w-6 h-6 text-muted" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                                <path d="M17.3 11c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
                            </svg>
                        )}
                    </button>

                    {/* TTS Toggle Button */}
                    <button
                        onClick={toggleTTS}
                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-soft ${
                            ttsEnabled 
                                ? 'bg-primary hover:bg-primary-hover' 
                                : 'bg-bg-secondary hover:bg-bg-secondary/80 border border-border'
                        }`}
                        title={ttsEnabled ? "Disable text-to-speech" : "Enable text-to-speech"}
                    >
                        {ttsEnabled ? (
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                            </svg>
                        ) : (
                            <svg className="w-6 h-6 text-muted" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                            </svg>
                        )}
                    </button>
                </div>
                <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-muted ml-1">
                        {isListening 
                            ? "🎤 Recording... Click mic or 'Stop & Process' button" 
                            : isProcessing
                                ? "⚡ Processing your audio..."
                                : "Press Enter to send, Shift+Enter for new line"}
                    </p>
                    {ttsEnabled && !isListening && !isProcessing && (
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
        </>
    );
}
