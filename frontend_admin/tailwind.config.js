/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // "kitchen ticket" palette — warm steel + amber, not the generic terracotta/cream default
        ink: {
          950: '#12181B',
          900: '#1B2327',
          800: '#232D32',
          700: '#313D43',
        },
        steel: {
          50: '#F4F7F7',
          100: '#E7EDEE',
          200: '#C9D6D8',
          400: '#8FA5A9',
          600: '#516266',
        },
        amber: {
          400: '#E8A63C',
          500: '#DB9020',
          600: '#B8740F',
        },
        signal: {
          waiting: '#DB9020',
          preparing: '#3D7EBF',
          ready: '#3E9D5C',
          collected: '#6B7A80',
          rejected: '#C4573F',
        }
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: {
        sm: '3px',
      }
    },
  },
  plugins: [],
}
