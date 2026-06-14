/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './lib/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#FF6B6B',
          secondary: '#FF8E53',
          light: '#FFF0EE',
        },
        semantic: {
          success: '#34C759',
          warning: '#FF9F0A',
          danger: '#FF3B30',
          info: '#007AFF',
        },
        ink: {
          900: '#1C1C1E',
          700: '#3A3A3C',
          500: '#6E6E73',
          300: '#AEAEB2',
          100: '#E8E8ED',
        },
        canvas: {
          DEFAULT: '#FAFAFA',
          sunken: '#F4F4F6',
        },
      },
    },
  },
  plugins: [],
};
