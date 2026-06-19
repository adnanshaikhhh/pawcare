/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'media',
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './lib/**/*.{js,jsx,ts,tsx}',
    './hooks/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand
        brand: {
          primary: '#FF6B6B',
          secondary: '#FF8E53',
          light: '#FFF0EE',
          dark: '#E85555',
        },
        // Semantic
        semantic: {
          success: '#34C759',
          warning: '#FF9F0A',
          danger: '#FF3B30',
          info: '#007AFF',
        },
        // Text (light mode)
        ink: {
          900: '#1A1A1E',
          700: '#3A3A3C',
          500: '#6E6E73',
          300: '#AEAEB2',
          100: '#E8E8ED',
        },
        // Backgrounds (light mode)
        canvas: {
          DEFAULT: '#F7F7F9',
          sunken: '#F2F2F7',
        },
        // Surface colors (white card vs subtle bg)
        surface: {
          DEFAULT: '#FFFFFF',
          subtle: '#F2F2F7',
        },
      },
    },
  },
  plugins: [],
};