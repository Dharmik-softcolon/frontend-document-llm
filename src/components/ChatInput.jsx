import { useState, useRef, useEffect } from "react";
import { api } from "../api";

export default function ChatInput({ setMessages, setLoading, loading }) {
    const [question, setQuestion] = useState("");
    const [ttsEnabled, setTtsEnabled] = useState(() => {
        // Load from localStorage or default to false
        const saved = localStorage.getItem('ttsEnabled');
        return saved ? JSON.parse(saved) : false;
    });
    const textareaRef = useRef(null);
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

    return (
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
                            className="w-full bg-bg-secondary border border-border rounded-xl px-4 py-3 pr-12 text-[15px] text-white placeholder-muted resize-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all overflow-y-auto"
                            style={{ minHeight: '52px', maxHeight: '200px' }}
                            disabled={loading}
                        />
                        <button
                            onClick={() => ask()}
                            disabled={!question.trim() || loading}
                            className="absolute right-2 bottom-2 w-8 h-8 bg-primary hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed rounded-lg flex items-center justify-center transition-all shadow-soft"
                        >
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        </button>
                    </div>
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
                        {"Press Enter to send, Shift+Enter for new line"}
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
