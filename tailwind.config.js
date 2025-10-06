/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            animation: {
                'fade-in': 'fadeIn 1s ease-in-out',
                'slide-up': 'slideUp 0.7s ease-out forwards',
                'slide-up-delay': 'slideUp 0.7s ease-out 0.2s forwards',
                'float': 'float 20s ease-in-out infinite',
                'float-delay-1': 'float 25s ease-in-out infinite 2s',
                'float-delay-2': 'float 30s ease-in-out infinite 4s',
                'float-delay-3': 'float 22s ease-in-out infinite 6s',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: 0, transform: 'translateY(10px)' },
                    '100%': { opacity: 1, transform: 'translateY(0)' },
                },
                slideUp: {
                    '0%': { opacity: 0, transform: 'translateY(20px)' },
                    '100%': { opacity: 1, transform: 'translateY(0)' },
                },
                float: {
                    '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
                    '33%': { transform: 'translate(30px, -30px) scale(1.05)' },
                    '66%': { transform: 'translate(-20px, 30px) scale(0.95)' },
                },
            }
        },
    },
    plugins: [],
}

