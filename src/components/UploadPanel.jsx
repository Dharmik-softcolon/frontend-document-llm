import { useState, useRef } from "react";
import { api } from "../api";

export default function UploadPanel() {
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            const name = (droppedFile.name || "").toLowerCase();
            const isPdf = name.endsWith(".pdf") || (droppedFile.type || "").toLowerCase() === "application/pdf";
            if (!isPdf) {
                setStatus("error: Only PDF files are supported");
                setTimeout(() => setStatus(""), 10000);
                return;
            }
            setFile(droppedFile);
        }
    };

    const upload = async () => {
        if (!file || loading) return;

        setLoading(true);
        setStatus("Uploading & indexing document... This may take a few minutes for large files.");

        const form = new FormData();
        form.append("file", file);

        try {
            const response = await api.post("/upload", form, {
                headers: { "Content-Type": "multipart/form-data" },
                timeout: 600000,
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        if (percentCompleted < 100) {
                            setStatus(`Uploading file... ${percentCompleted}%`);
                        } else {
                            setStatus("File uploaded. Processing and indexing... This may take a few minutes.");
                        }
                    }
                }
            });
            
            if (response.data && response.data.success) {
                setStatus("success");
                setFile(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                setTimeout(() => setStatus(""), 5000);
            } else {
                setStatus("error");
                setTimeout(() => setStatus(""), 10000);
            }
        } catch (e) {
            console.error("Upload error:", e);
            if (e.code === 'ECONNABORTED' || e.message?.includes('timeout')) {
                setStatus("timeout");
            } else if (e.response?.data?.message) {
                setStatus(`error: ${e.response.data.message}`);
            } else {
                setStatus("error");
            }
            setTimeout(() => setStatus(""), 10000);
        } finally {
            setLoading(false);
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${Math.round(bytes / Math.pow(k, i) * 100) / 100} ${sizes[i]}`;
    };

    return (
        <div className="h-full flex flex-col overflow-hidden">
            <div className="px-6 py-5 border-b border-border">
                <h2 className="font-semibold text-lg text-white mb-1">Upload Document</h2>
                <p className="text-xs text-muted">Add documents to analyze</p>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                        isDragging
                            ? "border-primary bg-primary/10 scale-[1.02]"
                            : file
                            ? "border-border-light bg-bg-secondary"
                            : "border-border hover:border-border-light hover:bg-bg-secondary"
                    }`}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        onChange={({ target: { files } }) => {
                            const selected = files?.[0];
                            if (!selected) return;
                            const name = (selected.name || "").toLowerCase();
                            const isPdf = name.endsWith(".pdf") || (selected.type || "").toLowerCase() === "application/pdf";
                            if (!isPdf) {
                                setStatus("error: Only PDF files are supported");
                                setTimeout(() => setStatus(""), 10000);
                                return;
                            }
                            setFile(selected);
                        }}
                        className="hidden"
                        accept=".pdf"
                    />
                    
                    {!file ? (
                        <>
                            <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                            </div>
                            <p className="text-white font-medium mb-1">Drop your file here</p>
                            <p className="text-sm text-muted mb-2">or click to browse</p>
                            <p className="text-xs text-muted">Supports PDF (with OCR)</p>
                        </>
                    ) : (
                        <div className="space-y-3">
                            <div className="w-12 h-12 bg-success/20 rounded-xl flex items-center justify-center mx-auto">
                                <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-white font-medium text-sm mb-1">{file.name}</p>
                                <p className="text-xs text-muted">{formatFileSize(file.size)}</p>
                            </div>
                            <button
                                onClick={(e) => {
                                e.stopPropagation();
                                setFile(null);
                                if (fileInputRef.current) {
                                    fileInputRef.current.value = '';
                                }
                            }}
                                className="text-xs text-muted hover:text-white transition-colors"
                            >
                                Remove
                            </button>
                        </div>
                    )}
                </div>

                <button
                    onClick={upload}
                    disabled={!file || loading}
                    className="w-full mt-4 bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary text-white py-3 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-medium flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Processing...</span>
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <span>Upload & Index</span>
                        </>
                    )}
                </button>

                {status && (
                    <div className={`mt-4 p-3 rounded-xl flex items-center gap-2 ${
                        status === "success" 
                            ? "bg-success/20 text-success border border-success/30" 
                            : status === "timeout"
                            ? "bg-warning/20 text-warning border border-warning/30"
                            : status.startsWith("Uploading") || status.includes("Processing") || status.includes("indexing")
                            ? "bg-primary/20 text-primary border border-primary/30"
                            : status.startsWith("error:")
                            ? "bg-error/20 text-error border border-error/30"
                            : status === "error"
                            ? "bg-error/20 text-error border border-error/30"
                            : "bg-primary/20 text-primary border border-primary/30"
                    }`}>
                        {status === "success" ? (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-sm font-medium">Document indexed successfully</span>
                            </>
                        ) : status === "timeout" ? (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-sm font-medium">Upload timed out. The file might be processing in the background. Please wait a moment and try again.</span>
                            </>
                        ) : status.startsWith("Uploading") || status.includes("Processing") || status.includes("indexing") ? (
                            <>
                                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span className="text-sm font-medium">{status}</span>
                            </>
                        ) : status.startsWith("error:") ? (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                <span className="text-sm font-medium">{status.replace("error: ", "")}</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                <span className="text-sm font-medium">Upload failed. Please try again.</span>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
