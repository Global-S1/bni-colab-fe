/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        brand: {
          red: '#D40000',       // BNI Eventos Red Primary
          darkred: '#8B0000',   // Eventos Crimson Dark
          dark: '#0F0F12',      // Eventos Dark Background
          cardDark: '#1A1A24',  // Eventos Card Dark / Sidebar Header
          sidebar: '#121117',   // Eventos Sidebar Dark
          lightBg: '#F8F9FA',   // Eventos Light Canvas (gray-100 / F8F9FA)
          lightCard: '#FFFFFF', // Eventos Light Card
        },
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
