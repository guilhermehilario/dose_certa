export const colors = {
  // Marca
  primary: '#2E7D5B',        // verde medicinal
  secondary: '#3B82A6',      // azul complementar

  // Superfícies
  background: '#F5F7F6',     // fundo geral da tela
  surface: '#FFFFFF',        // cards, modais, inputs

  // Texto
  text: '#1A2B2A',           // texto principal
  textSecondary: '#6B7A79',  // labels, placeholders
  textDisabled: '#B0BABA',

  // Estados e feedback
  danger: '#E53935',         // erros, excluir
  success: '#2E7D5B',
  warning: '#F59E0B',

  // Estrutura
  border: '#E1E6E4',
  divider: '#E1E6E4',

  // Específicos
  fab: '#2E7D5B',
  cardBg: '#FFFFFF',
  overlay: 'rgba(0, 0, 0, 0.5)',
};

export const typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
};