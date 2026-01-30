import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary brand colors
        brand: {
          DEFAULT: '#7ee30f',
          primary: '#7ee30f',
          secondary: '#0f172b',
          soft: '#1b2d81',
          light: '#e6e8ef',
          surface: '#cacedd',
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444',
        },
        // Background colors
        bglight: '#f7f6f6',
        // Text colors
        dark: '#0f172a',
        light: '#f8fafc',
      },
    },
  },
  plugins: [
    require('tailwind-scrollbar'),
    require('tailwindcss-animated'),
    require('@tailwindcss/typography'),
  ],
};

export default config;
