/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            colors: {
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
                // Enterprise Status Colors
                success: {
                    DEFAULT: "hsl(var(--success))",
                    foreground: "hsl(var(--success-foreground))",
                },
                warning: {
                    DEFAULT: "hsl(var(--warning))",
                    foreground: "hsl(var(--warning-foreground))",
                },
                info: {
                    DEFAULT: "hsl(var(--info))",
                    foreground: "hsl(var(--info-foreground))",
                },
                // Enterprise Chart Colors
                chart: {
                    1: "hsl(var(--chart-1))",
                    2: "hsl(var(--chart-2))",
                    3: "hsl(var(--chart-3))",
                    4: "hsl(var(--chart-4))",
                    5: "hsl(var(--chart-5))",
                },
                fontFamily: {
                    sans: ['Inter', 'system-ui', 'sans-serif'],
                    mono: ['JetBrains Mono', 'Consolas', 'monospace'],
                },
                fontSize: {
                    'xs': ['0.75rem', { lineHeight: '1rem' }],
                    'sm': ['0.875rem', { lineHeight: '1.25rem' }],
                    'base': ['1rem', { lineHeight: '1.5rem' }],
                    'lg': ['1.125rem', { lineHeight: '1.75rem' }],
                    'xl': ['1.25rem', { lineHeight: '1.75rem' }],
                    '2xl': ['1.5rem', { lineHeight: '2rem' }],
                    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
                    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
                    '5xl': ['3rem', { lineHeight: '1' }],
                    '6xl': ['3.75rem', { lineHeight: '1' }],
                },
                spacing: {
                    '18': '4.5rem',
                    '88': '22rem',
                    '128': '32rem',
                    '144': '36rem',
                },
                borderRadius: {
                    lg: `var(--radius)`,
                    md: `calc(var(--radius) - 2px)`,
                    sm: "calc(var(--radius) - 4px)",
                    'none': '0px',
                    'xs': '2px',
                    '2xl': '1rem',
                    '3xl': '1.5rem',
                },
                boxShadow: {
                    'glow': '0 0 20px rgba(59, 130, 246, 0.15)',
                    'glow-lg': '0 0 40px rgba(59, 130, 246, 0.2)',
                },
                animation: {
                    'fade-in': 'fadeIn 0.5s ease-in-out',
                    'fade-in-up': 'fadeInUp 0.5s ease-in-out',
                    'fade-in-down': 'fadeInDown 0.5s ease-in-out',
                    'slide-in-right': 'slideInRight 0.3s ease-in-out',
                    'slide-in-left': 'slideInLeft 0.3s ease-in-out',
                    'scale-in': 'scaleIn 0.2s ease-in-out',
                    'bounce-in': 'bounceIn 0.6s ease-in-out',
                    'pulse-slow': 'pulse 3s infinite',
                    'spin-slow': 'spin 3s linear infinite',
                    shine: 'shine 5s linear infinite',
                    gradient: 'gradient 8s linear infinite',
                },
                keyframes: {
                    fadeIn: {
                        '0%': { opacity: '0' },
                        '100%': { opacity: '1' },
                    },
                    fadeInUp: {
                        '0%': { opacity: '0', transform: 'translateY(10px)' },
                        '100%': { opacity: '1', transform: 'translateY(0)' },
                    },
                    fadeInDown: {
                        '0%': { opacity: '0', transform: 'translateY(-10px)' },
                        '100%': { opacity: '1', transform: 'translateY(0)' },
                    },
                    slideInRight: {
                        '0%': { opacity: '0', transform: 'translateX(10px)' },
                        '100%': { opacity: '1', transform: 'translateX(0)' },
                    },
                    slideInLeft: {
                        '0%': { opacity: '0', transform: 'translateX(-10px)' },
                        '100%': { opacity: '1', transform: 'translateX(0)' },
                    },
                    scaleIn: {
                        '0%': { opacity: '0', transform: 'scale(0.95)' },
                        '100%': { opacity: '1', transform: 'scale(1)' },
                    },
                    bounceIn: {
                        '0%': { opacity: '0', transform: 'scale(0.3)' },
                        '50%': { opacity: '1', transform: 'scale(1.05)' },
                        '70%': { transform: 'scale(0.9)' },
                        '100%': { opacity: '1', transform: 'scale(1)' },
                    },
                    shine: {
                        '0%': { 'background-position': '100%' },
                        '100%': { 'background-position': '-100%' },
                    },
                    gradient: {
                        '0%': { backgroundPosition: '0% 50%' },
                        '50%': { backgroundPosition: '100% 50%' },
                        '100%': { backgroundPosition: '0% 50%' },
                    },
                },
                backdropBlur: {
                    xs: '2px',
                },
                transitionTimingFunction: {
                    'enterprise': 'cubic-bezier(0.4, 0, 0.2, 1)',
                    'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                },
                screens: {
                    'xs': '475px',
                    '3xl': '1680px',
                    '4xl': '2000px',
                },
                maxWidth: {
                    '8xl': '88rem',
                    '9xl': '96rem',
                },
                zIndex: {
                    '60': '60',
                    '70': '70',
                    '80': '80',
                    '90': '90',
                    '100': '100',
                },
            },
        },
    },
    plugins: [
        require("tailwindcss-animate"),
        // Custom plugin for enterprise utilities
        function ({ addUtilities, theme }) {
            const newUtilities = {
                '.text-shadow': {
                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                },
                '.text-shadow-md': {
                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                },
                '.text-shadow-lg': {
                    textShadow: '0 4px 8px rgba(0, 0, 0, 0.12)',
                },
                '.text-shadow-none': {
                    textShadow: 'none',
                },
                '.backface-hidden': {
                    backfaceVisibility: 'hidden',
                },
                '.preserve-3d': {
                    transformStyle: 'preserve-3d',
                },
                '.perspective-1000': {
                    perspective: '1000px',
                },
                '.transform-gpu': {
                    transform: 'translateZ(0)',
                },
            }
            addUtilities(newUtilities)
        }
    ],
}
