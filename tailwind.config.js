/** @type {import('tailwindcss').Config} */

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0A1628',
          surface: '#0F2137',
          elevated: '#162A45',
        },
        border: {
          DEFAULT: '#1E3A5F',
        },
        primary: {
          DEFAULT: '#00D4FF',
          dim: '#0099BB',
        },
        success: '#00FFA3',
        warning: '#FF8C00',
        danger: '#FF3B5C',
        gold: '#FFD700',
        vip: '#9D4EDD',
        text: {
          DEFAULT: '#E8F4FD',
          secondary: '#8BA3C0',
          muted: '#5A7594',
        },
        heat: {
          1: '#00FFA3',
          2: '#8CFF00',
          3: '#FFD700',
          4: '#FF8C00',
          5: '#FF3B5C',
        },
      },
      fontFamily: {
        display: ['Orbitron', 'monospace'],
        sans: ['PingFang SC', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 20px rgba(0, 212, 255, 0.3)',
        'glow-success': '0 0 20px rgba(0, 255, 163, 0.3)',
        'glow-danger': '0 0 20px rgba(255, 59, 92, 0.3)',
        'glow-warning': '0 0 20px rgba(255, 140, 0, 0.3)',
        'glow-gold': '0 0 20px rgba(255, 215, 0, 0.3)',
        'glow-vip': '0 0 20px rgba(157, 78, 221, 0.3)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
      },
      keyframes: {
        glowPulse: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.6 },
        },
      },
    },
  },
  plugins: [],
};
