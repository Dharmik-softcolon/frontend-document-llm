import { useState } from "react";
import UploadPanel from "../components/UploadPanel";
import QuestionList from "../components/QuestionList";
import AnswerView from "../components/AnswerView";
import ChatInput from "../components/ChatInput";

export default function Home() {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);

    return (
        <div className="h-screen flex flex-col bg-bg overflow-hidden">
            {/* Header */}
            <header className="bg-panel border-b border-border px-6 py-4 flex items-center justify-between shadow-soft">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center shadow-medium">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold text-white">Document Q&A</h1>
                        <p className="text-xs text-muted">Intelligent document analysis</p>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 grid grid-cols-12 gap-0 overflow-hidden">
                {/* LEFT SIDEBAR */}
                <div className="col-span-3 border-r border-border bg-panel">
                    <QuestionList
                        history={messages.filter(m => m.role === "user").map(m => m.content)}
                    />
                </div>

                {/* CENTER CHAT */}
                <div className="col-span-6 flex flex-col bg-bg border-r border-border min-h-0">
                    <AnswerView messages={messages} loading={loading} />
                    <ChatInput setMessages={setMessages} setLoading={setLoading} loading={loading} />
                </div>

                {/* RIGHT SIDEBAR */}
                <div className="col-span-3 bg-panel">
                    <UploadPanel />
                </div>
            </div>
        </div>
    );
}
