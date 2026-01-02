export default {
    content: ["./index.html", "./src/**/*.{js,jsx}"],
    theme: {
        extend: {
            colors: {
                bg: "#0f172a",
                "bg-secondary": "#1e293b",
                panel: "#1e293b",
                "panel-hover": "#334155",
                border: "#334155",
                "border-light": "#475569",
                primary: "#3b82f6",
                "primary-hover": "#2563eb",
                "primary-light": "#60a5fa",
                accent: "#8b5cf6",
                muted: "#94a3b8",
                "muted-light": "#cbd5e1",
                success: "#10b981",
                error: "#ef4444"
            },
            boxShadow: {
                'soft': '0 2px 8px rgba(0, 0, 0, 0.15)',
                'medium': '0 4px 16px rgba(0, 0, 0, 0.2)',
                'large': '0 8px 32px rgba(0, 0, 0, 0.25)',
            }
        }
    },
    plugins: []
};
