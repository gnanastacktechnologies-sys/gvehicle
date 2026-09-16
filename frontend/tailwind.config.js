/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4F46E5',
          dark: '#4338CA',
          light: '#6366F1',
          50: '#EEF2FF',
          100: '#E0E7FF',
        },
        surface: {
          bg: '#F3F4F6',
          card: '#FFFFFF',
          input: '#F9FAFB',
          border: '#E5E7EB',
        },
        txt: {
          primary: '#1E293B',
          secondary: '#64748B',
          muted: '#94A3B8',
        },
        status: {
          success: '#16A34A',
          warning: '#F59E0B',
          danger: '#EF4444',
          info: '#3B82F6',
        }
      },
    },
  },
  plugins: [],
}
