import { useState, useRef, useEffect } from "react";
import { api } from "../api";

export default function ChatInput({ setMessages, setLoading, loading }) {
    const [question, setQuestion] = useState("");
    const textareaRef = useRef(null);

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

    const ask = async () => {
        if (!question.trim() || loading) return;

        setMessages(prev => [
            ...prev,
            { role: "user", content: question }
        ]);

        setLoading(true);
        const currentQuestion = question;
        setQuestion("");

        try {
            const res = await api.post("/chat", { question: currentQuestion });

            setMessages(prev => [
                ...prev,
                { role: "assistant", content: res.data.answer }
            ]);
        } catch (error) {
            setMessages(prev => [
                ...prev,
                { role: "assistant", content: "Sorry, I encountered an error. Please try again." }
            ]);
        } finally {
            setLoading(false);
        }
    };

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
                            onClick={ask}
                            disabled={!question.trim() || loading}
                            className="absolute right-2 bottom-2 w-8 h-8 bg-primary hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed rounded-lg flex items-center justify-center transition-all shadow-soft"
                        >
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        </button>
                    </div>
                </div>
                <p className="text-xs text-muted mt-2 ml-1">
                    Press Enter to send, Shift+Enter for new line
                </p>
            </div>
        </div>
    );
}
