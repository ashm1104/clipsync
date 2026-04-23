/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"DM Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        green: {
          primary: '#3B6D11',
          hover: '#27500A',
          light: '#EAF3DE',
          text: '#27500A',
        },
        amber: {
          primary: '#BA7517',
          light: '#FAEEDA',
          border: '#FAC775',
          text: '#633806',
        },
        red: {
          light: '#FCEBEB',
          text: '#A32D2D',
        },
        blue: {
          light: '#E6F1FB',
          text: '#185FA5',
        },
        bg: {
          page: '#f0ede8',
          card: '#ffffff',
          surface: '#f5f4f0',
          raised: '#ebe9e3',
        },
        text: {
          primary: '#1a1a18',
          secondary: '#5a5754',
          tertiary: '#9a9690',
        },
        dark: {
          'bg-page': '#111110',
          'bg-card': '#1a1a18',
          'bg-surface': '#222220',
          'bg-raised': '#2c2c2a',
          'text-primary': '#f0ede8',
          'text-secondary': '#9a9690',
          'text-tertiary': '#5a5754',
        },
      },
      borderRadius: {
        card: '12px',
        btn: '8px',
        pill: '4px',
        modal: '14px',
      },
      borderWidth: {
        hair: '0.5px',
      },
    },
  },
  plugins: [],
};
