import { useEffect, useRef } from "react";

export default function AnswerView({ messages, loading }) {
    const messagesEndRef = useRef(null);
    const scrollContainerRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading]);

    return (
        <div 
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto px-6 py-8 scroll-smooth"
            style={{ 
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(148, 163, 184, 0.3) rgba(15, 23, 42, 0.5)'
            }}
        >
            {messages.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center h-full text-center max-w-2xl mx-auto min-h-[400px]">
                    <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center mb-6">
                        <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-semibold text-white mb-2">Start a conversation</h2>
                    <p className="text-muted text-base">
                        Upload a document to begin asking questions and get intelligent answers
                    </p>
                </div>
            )}

            <div className="max-w-4xl mx-auto space-y-6 pb-4">
                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={`message-enter flex gap-4 ${
                            msg.role === "user" ? "justify-end" : "justify-start"
                        }`}
                    >
                        {msg.role === "assistant" && (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 shadow-medium">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                            </div>
                        )}
                        
                        <div
                            className={`max-w-[85%] rounded-2xl px-5 py-4 shadow-medium break-words ${
                                msg.role === "user"
                                    ? "bg-gradient-to-br from-primary to-primary-hover text-white rounded-tr-sm"
                                    : "bg-panel text-white border border-border rounded-tl-sm"
                            }`}
                        >
                            <div className="text-[15px] leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere formatted-content">
                                {msg.content}
                            </div>
                            
                            {/* Show sources for assistant messages */}
                            {msg.role === "assistant" && msg.sources && msg.sources.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-border/50">
                                    <div className="text-xs text-muted mb-2 flex items-center gap-2">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Sources:
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {msg.sources.map((source, idx) => (
                                            <div 
                                                key={idx}
                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-bg-secondary border border-border/50 rounded-lg text-xs"
                                                title={`Relevance: ${(source.relevanceScore * 100).toFixed(1)}%`}
                                            >
                                                <svg className="w-3 h-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                <span className="text-muted">Page {source.page}</span>
                                                {source.type === 'table' && (
                                                    <span className="ml-1 px-1.5 py-0.5 bg-accent/20 text-accent text-[10px] rounded">TABLE</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    {msg.hasTabularData && (
                                        <div className="mt-2 text-[11px] text-accent/80 flex items-center gap-1.5">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                            This answer includes data from tables
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {msg.role === "user" && (
                            <div className="w-8 h-8 rounded-full bg-bg-secondary border border-border flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                        )}
                    </div>
                ))}

                {loading && (
                    <div className="flex gap-4 justify-start">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 shadow-medium">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                        </div>
                        <div className="bg-panel border border-border rounded-2xl rounded-tl-sm px-5 py-4 shadow-medium">
                            <div className="flex items-center gap-2 text-muted">
                                <div className="flex gap-1">
                                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                                <span className="text-sm ml-2">Thinking...</span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
        </div>
    );
}
