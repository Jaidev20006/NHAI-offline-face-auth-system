import React, { createContext, useState, useContext, ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark';

export const THEMES = {
  dark: {
    mode: 'dark' as ThemeMode,
    bg: '#040C18',
    bgAlt: '#07131D',
    card: '#0A1628',
    card2: '#0F1E35',
    border: '#162844',
    borderAlt: '#1E3A5F',
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    textTertiary: '#64748B',
    blue: '#3B82F6',
    blueGlow: '#1D4ED8',
    blueBg: '#1B4A8A',
    blueBorder: '#2A5EB5',
    cyan: '#06B6D4',
    green: '#10B981',
    amber: '#F59E0B',
    red: '#EF4444',
    grey: '#64748B',
    dim: '#1E3A5F',
  },
  light: {
    mode: 'light' as ThemeMode,
    bg: '#F8FAFC',
    bgAlt: '#F1F5F9',
    card: '#FFFFFF',
    card2: '#F0F9FF',
    border: '#E2E8F0',
    borderAlt: '#CBD5E1',
    text: '#0F172A',
    textSecondary: '#475569',
    textTertiary: '#64748B',
    blue: '#2563EB',
    blueGlow: '#1D4ED8',
    blueBg: '#DBEAFE',
    blueBorder: '#3B82F6',
    cyan: '#0891B2',
    green: '#059669',
    amber: '#D97706',
    red: '#DC2626',
    grey: '#78716C',
    dim: '#E0E7FF',
  },
};

export type Theme = typeof THEMES.dark;

interface ThemeContextType {
  theme: Theme;
  mode: ThemeMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('dark');

  const toggleTheme = () => {
    setMode(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const theme = THEMES[mode];

  return (
    <ThemeContext.Provider value={{ theme, mode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
