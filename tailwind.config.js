/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Editorial palette — "The Decisive Record"
        background: '#fbf9f4',
        surface: '#fbf9f4',
        'surface-bright': '#fbf9f4',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f5f3ee',
        'surface-container': '#f0eee9',
        'surface-container-high': '#eae8e3',
        'surface-container-highest': '#e4e2dd',
        'surface-dim': '#dbdad5',

        'on-background': '#1b1c19',
        'on-surface': '#1b1c19',
        'on-surface-variant': '#42493e',

        // Primary — Deep scholarly green
        primary: '#154212',
        'on-primary': '#ffffff',
        'primary-container': '#2d5a27',
        'on-primary-container': '#9dd090',
        'primary-fixed': '#bcf0ae',
        'primary-fixed-dim': '#a1d494',

        // Secondary — Muted navy
        secondary: '#3056c4',
        'on-secondary': '#ffffff',
        'secondary-container': '#6b8dfe',
        'on-secondary-container': '#002474',
        'secondary-fixed': '#dce1ff',
        'secondary-fixed-dim': '#b6c4ff',

        // Tertiary — Sophisticated gold
        tertiary: '#735c00',
        'on-tertiary': '#ffffff',
        'tertiary-container': '#cea700',
        'on-tertiary-container': '#4e3e00',
        'tertiary-fixed': '#ffe084',
        'tertiary-fixed-dim': '#eec209',

        // Error
        error: '#ba1a1a',
        'on-error': '#ffffff',
        'error-container': '#ffdad6',
        'on-error-container': '#93000a',

        // Outlines
        outline: '#72796e',
        'outline-variant': '#c2c9bb',

        // Inverse
        'inverse-surface': '#30312e',
        'inverse-on-surface': '#f2f1ec',
        'inverse-primary': '#a1d494',

        // Surface tint
        'surface-tint': '#3b6934',

        // Ideological diverging scale
        'ideo-left': '#B22222',
        'ideo-center': '#7FB069',
        'ideo-right': '#0047AB',
      },
      fontFamily: {
        headline: ['Newsreader', 'Georgia', 'serif'],
        body: ['Newsreader', 'Georgia', 'serif'],
        label: ['Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0px',
        sm: '0px',
        md: '0px',
        lg: '0px',
        xl: '0px',
        full: '9999px',
      },
      boxShadow: {
        'editorial': '0 12px 40px rgba(26, 28, 27, 0.06)',
        'editorial-lg': '0 40px 40px -5px rgba(27, 28, 25, 0.06)',
        'ghost': '0 0 0 1px rgba(194, 201, 187, 0.15)',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
    },
  },
  plugins: [],
};