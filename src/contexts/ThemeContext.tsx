import React, { createContext, useContext, ReactNode } from 'react';
import { colors, typography, spacing, borderRadius } from '../constants/theme';

// Define a interface do tema — facilita trocar tema no futuro (dark mode)
export interface Theme {
  colors: typeof colors;
  typography: typeof typography;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
}

export const theme: Theme = {
  colors,
  typography,
  spacing,
  borderRadius,
};

interface ThemeContextType {
  theme: Theme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  return (
    <ThemeContext.Provider value={{ theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook customizado para acessar o tema — evita boilerplate
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  }
  return context.theme;
};