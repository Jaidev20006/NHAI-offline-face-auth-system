import React, { createContext, useContext, useState } from 'react';

export type Theme = 'dark' | 'light';

interface ThemeColors {
  bg: string;
  bgCard: string;
  bgCardAlt: string;
  border: string;
  text: string;
  textSub: string;
  textMuted: string;
  accent: string;
  accentDim: string;
  success: string;
  successDim: string;
  warning: string;
  warningDim: string;
  danger: string;
  dangerDim: string;
  headerBg: string;
}

const DARK: ThemeColors = {
  bg: '#060D1A',
  bgCard: '#0D1B2E',
  bgCardAlt: '#0A1525',
  border: '#152030',
  text: '#F0F4FF',
  textSub: '#8BA8CC',
  textMuted: '#3D5570',
  accent: '#3D8EF0',
  accentDim: '#0D2550',
  success: '#22C55E',
  successDim: '#052A14',
  warning: '#F59E0B',
  warningDim: '#2A1A03',
  danger: '#EF4444',
  dangerDim: '#2A0808',
  headerBg: '#060D1A',
};

const LIGHT: ThemeColors = {
  bg: '#F0F4FF',
  bgCard: '#FFFFFF',
  bgCardAlt: '#E8EFFE',
  border: '#C8D8F0',
  text: '#0A1628',
  textSub: '#3D5570',
  textMuted: '#8BA8CC',
  accent: '#1A6ED8',
  accentDim: '#D0E4FF',
  success: '#16A34A',
  successDim: '#DCFCE7',
  warning: '#D97706',
  warningDim: '#FEF3C7',
  danger: '#DC2626',
  dangerDim: '#FEE2E2',
  headerBg: '#0A1628',
};

interface ThemeContextType {
  theme: Theme;
  colors: ThemeColors;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  colors: DARK,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const toggleTheme = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'));
  return (
    <ThemeContext.Provider value={{ theme, colors: theme === 'dark' ? DARK : LIGHT, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
