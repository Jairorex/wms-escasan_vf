/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Colores de ESCASAN
        escasan: {
          green: {
            50: '#e8f5e9',
            100: '#c8e6c9',
            200: '#a5d6a7',
            300: '#81c784',
            400: '#66bb6a',
            500: '#009245', // Verde corporativo ESCASAN
            600: '#008139',
            700: '#00702F',
            800: '#005F26',
            900: '#004D1F',
          },
          orange: {
            50: '#fef3ee',
            100: '#fde4d7',
            200: '#fbc5ae',
            300: '#f9a67b',
            400: '#f67d46',
            500: '#f15a29', // Naranja corporativo ESCASAN
            600: '#e24110',
            700: '#bc300d',
            800: '#962812',
            900: '#792312',
          },
        },
        // Verde para botones de confirmar/aceptar/iniciar
        confirm: {
          50: '#e8f5e9',
          100: '#c8e6c9',
          200: '#a5d6a7',
          300: '#81c784',
          400: '#66bb6a',
          500: '#009245', // Verde corporativo ESCASAN para botones de acción
          600: '#008139',
          700: '#00702F',
          800: '#005F26',
          900: '#004D1F',
        },
        // Rojo para botones de cancelar
        cancel: {
          50: '#ffebee',
          100: '#ffcdd2',
          200: '#ef9a9a',
          300: '#e57373',
          400: '#ef5350',
          500: '#f44336', // Rojo cancelar
          600: '#e53935',
          700: '#d32f2f',
          800: '#c62828',
          900: '#b71c1c',
        },
        // Mantener primary para compatibilidad (mapea a verde ESCASAN)
        primary: {
          50: '#e8f5e9',
          100: '#c8e6c9',
          200: '#a5d6a7',
          300: '#81c784',
          400: '#66bb6a',
          500: '#009245',
          600: '#008139',
          700: '#00702F',
          800: '#005F26',
          900: '#004D1F',
        },
      },
    },
  },
  plugins: [],
}
