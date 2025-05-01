/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        zinc: {
          950: '#09090b',
          900: '#18181b',
          800: '#27272a',
          700: '#3f3f46',
          600: '#52525b',
          500: '#71717a',
          400: '#a1a1aa',
          300: '#d4d4d8',
          200: '#e4e4e7',
          100: '#f4f4f5',
          50: '#fafafa',
        },
        indigo: {
          600: '#4f46e5',
          500: '#6366f1',
          400: '#818cf8',
        },
      },
    },
  },
  // Adding default Tailwind config as a foundation
  // This ensures all the basic utility classes are available
  corePlugins: {
    preflight: true,
  },
  darkMode: 'class',
  plugins: [],
}
