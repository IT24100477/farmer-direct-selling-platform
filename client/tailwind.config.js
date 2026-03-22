/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#1f7a4d',
        accent: '#f59e0b'
      }
    }
  },
  plugins: []
};
