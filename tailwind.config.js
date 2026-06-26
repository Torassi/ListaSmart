/** @type {import('tailwindcss').Config} */

/*
 * Design tokens centralizados (cores, fontes, raios, sombras).
 * Toda a identidade visual deriva daqui — evite cores/medidas "mágicas" nas classes.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      /*
       * Tema ESCURO (dark) — superfícies em slate profundo e tons de marca
       * vivos. Convenção dos tokens de marca:
       *   - DEFAULT/hover  → fundo de botões sólidos (texto branco)
       *   - active         → tom CLARO, usado como TEXTO de realce sobre `soft`
       *   - soft           → tom ESCURO (tint), usado como FUNDO de chips/badges
       * Assim chips e destaques mantêm bom contraste no escuro.
       */
      colors: {
        // Verde — economia / cor primária
        primary: {
          DEFAULT: '#0E9F6E',
          hover: '#12B886',
          active: '#34D399', // texto de realce (claro)
          soft: '#112A20', // fundo de chip (escuro)
        },
        // Azul — tecnologia / confiança / secundária
        secondary: {
          DEFAULT: '#2563EB',
          hover: '#3B82F6',
          active: '#93C5FD', // texto de realce (claro)
          soft: '#16233B', // fundo de chip (escuro)
        },
        // Âmbar/laranja — acento quente, energia e proximidade regional (uso pontual)
        accent: {
          DEFAULT: '#F97316',
          hover: '#FB923C',
          active: '#FDBA74', // texto de realce (claro)
          soft: '#2A1A0F', // fundo de chip (escuro)
        },
        // Superfícies e estrutura (slate escuro)
        bg: '#0E141F', // fundo da aplicação
        surface: '#19212E', // cards / barras
        'surface-muted': '#222C3C', // superfícies secundárias (zebra, trilhas)
        border: '#2B3647', // bordas
        'border-strong': '#3B475A', // bordas de ênfase / divisores
        // Texto (claro sobre escuro)
        text: {
          DEFAULT: '#EEF2F7', // principal
          muted: '#AAB4C4', // secundário
          subtle: '#8390A3', // terciário / placeholder
        },
        // Semânticos
        warning: '#F59E0B',
        danger: '#F87171', // "mais caro" / erro
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
        '2xl': '28px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 16px rgba(15, 23, 42, 0.06)',
        'card-hover': '0 4px 8px rgba(15, 23, 42, 0.06), 0 12px 28px rgba(15, 23, 42, 0.10)',
        // Elevação extra para banners/realces e o app shell mobile.
        pop: '0 10px 30px -8px rgba(15, 23, 42, 0.18)',
        nav: '0 -1px 2px rgba(15, 23, 42, 0.04), 0 -8px 24px rgba(15, 23, 42, 0.08)',
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
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.98)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 150ms ease-out',
        'slide-in-right': 'slide-in-right 220ms ease-out',
        'toast-in': 'toast-in 180ms ease-out',
        'scale-in': 'scale-in 160ms ease-out',
      },
    },
  },
  plugins: [],
};
