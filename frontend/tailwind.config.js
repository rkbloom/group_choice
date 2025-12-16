/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        // Organic minimalist palette
        sage: {
          50: '#f6f7f6',
          100: '#e3e5e3',
          200: '#c7ccc7',
          300: '#a3aca3',
          400: '#7d877d',
          500: '#626b62',
          600: '#4d554d',
          700: '#404640',
          800: '#363a36',
          900: '#2f322f',
        },
        clay: {
          50: '#faf8f6',
          100: '#f2ede8',
          200: '#e4dace',
          300: '#d2c2ad',
          400: '#bda68a',
          500: '#ad9070',
          600: '#9f7f62',
          700: '#846853',
          800: '#6c5647',
          900: '#59483c',
        },
        moss: {
          50: '#f4f7f4',
          100: '#e4ebe4',
          200: '#c9d8c9',
          300: '#a3bca3',
          400: '#769a76',
          500: '#587e58',
          600: '#456545',
          700: '#395139',
          800: '#304230',
          900: '#283728',
        },
        stone: {
          50: '#f9f9f8',
          100: '#f1f0ee',
          200: '#e4e2de',
          300: '#d1cdc6',
          400: '#b8b3a9',
          500: '#a09a8e',
          600: '#8d8679',
          700: '#756f64',
          800: '#615c54',
          900: '#514d46',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-soft': 'pulseSoft 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
      },
      borderRadius: {
        'organic': '38% 62% 63% 37% / 41% 44% 56% 59%',
      },
    },
  },
  plugins: [],
}
