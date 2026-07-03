import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Pranko palette — playful, energetic, prank-y
        pranko: {
          bg: '#0A0118',          // Deep midnight purple
          surface: '#150A2E',     // Slightly lighter purple
          card: '#1F1140',        // Card background
          border: '#3B1F6B',      // Border
          // Brand colors — lime green + hot pink energy
          lime: '#C7FF3D',        // Primary brand — toxic lime
          pink: '#FF3DC7',        // Hot pink accent
          purple: '#9D4EDD',      // Vivid purple
          cyan: '#3DEFFF',        // Electric cyan
          orange: '#FF8C3D',      // Punchy orange
          yellow: '#FFE93D',      // Sun yellow
          text: '#FFFFFF',
          muted: '#9B8FB8',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      animation: {
        'bounce-slow': 'bounce 3s infinite',
        'wiggle': 'wiggle 1s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'slide-up': 'slide-up 0.6s ease-out',
        'fade-in': 'fade-in 0.5s ease-out',
        'marquee': 'marquee 30s linear infinite',
        'spin-slow': 'spin 8s linear infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(199, 255, 61, 0.4)' },
          '50%': { boxShadow: '0 0 40px rgba(199, 255, 61, 0.8)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      backgroundImage: {
        'gradient-pranko': 'linear-gradient(135deg, #C7FF3D 0%, #FF3DC7 100%)',
        'gradient-mischief': 'linear-gradient(135deg, #9D4EDD 0%, #FF3DC7 50%, #FF8C3D 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
