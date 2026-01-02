export default function QuestionList({ history }) {
    return (
        <div className="h-full flex flex-col overflow-hidden">
            <div className="px-6 py-5 border-b border-border">
                <h2 className="font-semibold text-lg text-white mb-1">Chat History</h2>
                <p className="text-xs text-muted">{history.length} question{history.length !== 1 ? 's' : ''}</p>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
                {history.length === 0 && (
                    <div className="text-center py-12 px-4">
                        <div className="w-12 h-12 bg-bg-secondary rounded-xl flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                        </div>
                        <p className="text-muted text-sm">
                            Your questions will appear here
                        </p>
                    </div>
                )}

                <div className="space-y-2">
                    {history.map((q, i) => (
                        <div
                            key={i}
                            className="group p-3 rounded-xl bg-bg-secondary hover:bg-panel-hover border border-transparent hover:border-border-light transition-all cursor-pointer"
                        >
                            <div className="flex items-start gap-2">
                                <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <svg className="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <p className="text-sm text-white leading-relaxed flex-1 line-clamp-3">
                                    {q}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
