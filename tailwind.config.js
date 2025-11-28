import { createRequire } from 'module';
const require = createRequire(import.meta.url);

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: ['class', '[data-theme="dark"]'], // Hook into your ThemeContext strategy
    theme: {
        extend: {
            colors: {
                // Map Tailwind classes to your CSS Variables
                app: 'var(--bg-app)',
                panel: {
                    DEFAULT: 'var(--bg-panel)',
                    soft: 'var(--bg-panel-soft)',
                },
                border: 'var(--border)',
                text: {
                    main: 'var(--text-main)',
                    muted: 'var(--text-muted)',
                },
                primary: 'var(--primary)',
                success: 'var(--success)',
                warning: 'var(--warning)',
                danger: 'var(--danger)',
            },
            animation: {
                'in': 'fadeIn 0.2s ease-out',
                'out': 'fadeOut 0.2s ease-in',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                fadeOut: {
                    '0%': { opacity: '1' },
                    '100%': { opacity: '0' },
                }
            }
        },
    },
    plugins: [
        require('tailwindcss-animate'),
    ],
}
