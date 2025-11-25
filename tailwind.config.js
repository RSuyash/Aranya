/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'bg-app': 'var(--bg-app)',
                'bg-panel': 'var(--bg-panel)',
                'bg-panel-soft': 'var(--bg-panel-soft)',
                'primary': 'var(--primary)',
                'primary-dim': 'var(--primary-dim)',
                'success': 'var(--success)',
                'warning': 'var(--warning)',
                'danger': 'var(--danger)',
                'text-main': 'var(--text-main)',
                'text-muted': 'var(--text-muted)',
                'border': 'var(--border)',
            },
        },
    },
    plugins: [],
}
