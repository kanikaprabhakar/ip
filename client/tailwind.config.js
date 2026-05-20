export default {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#0a0a0f',
        'dark-secondary': '#0f0f1a',
        'dark-tertiary': '#13131f',
        'purple-accent': '#7c6fff',
        'teal-accent': '#00d4aa'
      },
      fontFamily: {
        inter: 'Inter, sans-serif'
      },
      backdropFilter: {
        blur: 'blur(16px)'
      },
      boxShadow: {
        'glass': '0 0 0 1px rgba(255, 255, 255, 0.06)',
        'glass-glow': '0 0 0 1px rgba(124, 111, 255, 0.3)'
      }
    }
  },
  plugins: []
};
