import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { colors, typography, spacing, borderRadius } from '../constants/theme';

// Cores padrão — garantem que o app não quebre caso falte algo no constants/theme
const DEFAULT_COLORS = {
  background: '#F5F7F6',
  surface: '#FFFFFF',
  primary: '#2E7D5B',
  text: '#1A2B2A',
  textSecondary: '#6B7A79',
  border: '#E1E6E4',
  danger: '#E53935',
};

// Mescla as cores existentes com os defaults (os existentes têm prioridade)
const mergedColors = {
  ...DEFAULT_COLORS,
  ...colors,
};

export interface Theme {
  colors: typeof mergedColors;
  typography: typeof typography;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
}

interface ThemeContextType {
  theme: Theme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const theme = useMemo<Theme>(() => ({
    colors: mergedColors,
    typography,
    spacing,
    borderRadius,
  }), []);

  return (
    <ThemeContext.Provider value={{ theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  }
  return context.theme;
};