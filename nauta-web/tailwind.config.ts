import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Paleta principal — verde terminal / cyan oscuro
        nauta: {
          bg:       '#090e12',
          surface:  '#0f1923',
          border:   '#1a2e3d',
          accent:   '#00d4ff',
          accent2:  '#00ff9d',
          muted:    '#4a6a7a',
          text:     '#c8dde8',
          danger:   '#ff4d6d',
          warning:  '#ffb347',
        },
      },
      fontFamily: {
        mono:    ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Syne', 'sans-serif'],
        body:    ['DM Sans', 'sans-serif'],
      },
      animation: {
        'pulse-slow':   'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in':      'fadeIn 0.4s ease forwards',
        'slide-up':     'slideUp 0.4s ease forwards',
        'glow':         'glow 2s ease-in-out infinite alternate',
        'scan':         'scan 4s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glow: {
          '0%':   { boxShadow: '0 0 4px #00d4ff44' },
          '100%': { boxShadow: '0 0 18px #00d4ff88' },
        },
        scan: {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
      },
      backgroundImage: {
        'grid-nauta': `
          linear-gradient(rgba(0,212,255,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,212,255,0.04) 1px, transparent 1px)
        `,
        'glow-radial': 'radial-gradient(ellipse at center, #00d4ff18 0%, transparent 70%)',
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
      boxShadow: {
        'nauta':      '0 0 0 1px #00d4ff33, 0 4px 24px #00d4ff18',
        'nauta-lg':   '0 0 0 1px #00d4ff44, 0 8px 48px #00d4ff22',
        'danger':     '0 0 0 1px #ff4d6d44, 0 4px 24px #ff4d6d18',
      },
    },
  },
  plugins: [],
}

export default config