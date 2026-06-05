/** @type {import('tailwindcss').Config} */

/*
 * Design tokens centralizados (cores, fontes, raios, sombras).
 * Toda a identidade visual deriva daqui — evite cores/medidas "mágicas" nas classes.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Verde — economia / cor primária
        primary: {
          DEFAULT: '#0E9F6E',
          hover: '#0B8A5F',
          active: '#047857',
          soft: '#E9F8F1',
        },
        // Azul — tecnologia / confiança / secundária
        secondary: {
          DEFAULT: '#2563EB',
          hover: '#1D4FD7',
          active: '#1E40AF',
          soft: '#EAF1FF',
        },
        // Superfícies e estrutura
        bg: '#F4F7FB', // fundo da aplicação (off-white / light gray)
        surface: '#FFFFFF', // cards
        border: '#E5EAF1', // bordas
        // Texto
        text: {
          DEFAULT: '#0F172A', // principal
          muted: '#475569', // secundário
          subtle: '#94A3B8', // terciário / placeholder
        },
        // Semânticos
        warning: '#F59E0B',
        danger: '#EF4444', // "mais caro" / erro
        success: '#0E9F6E', // "mais barato" / sucesso
      },
      fontFamily: {
        // Fonte sem serifa otimizada para monitor
        sans: ['Manrope', "'Segoe UI'", 'system-ui', 'sans-serif'],
        display: ['Manrope', "'Segoe UI'", 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '18px',
        xl: '24px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 16px rgba(15, 23, 42, 0.06)',
        'card-hover': '0 4px 8px rgba(15, 23, 42, 0.06), 0 12px 28px rgba(15, 23, 42, 0.10)',
        focus: '0 0 0 3px rgba(37, 99, 235, 0.35)',
      },
      maxWidth: {
        content: '1440px',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-in-right': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        'toast-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 150ms ease-out',
        'slide-in-right': 'slide-in-right 220ms ease-out',
        'toast-in': 'toast-in 180ms ease-out',
      },
    },
  },
  plugins: [],
};
