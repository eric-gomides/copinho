import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { useColorScheme, StyleSheet, ViewStyle, TextStyle, ImageStyle } from 'react-native';

// ─── Token types ─────────────────────────────────────────

export interface ThemeColors {
  teal900: string; teal700: string; teal500: string;
  teal300: string; teal100: string; teal50: string;
  coral: string; coralSoft: string; sun: string; mint: string; plum: string;
  ink: string; inkSoft: string; inkMute: string;
  paper: string; paper2: string; line: string; white: string;
}

// ─── Light theme ─────────────────────────────────────────

export const light: ThemeColors = {
  teal900: '#0a4a47', teal700: '#1a8273', teal500: '#2ea395',
  teal300: '#9dd4c7', teal100: '#dcefe9', teal50: '#edf8f4',
  coral: '#f58b6b', coralSoft: '#fadcd0', sun: '#f7d97a',
  mint: '#c6eddb', plum: '#8a5ba8',
  ink: '#1e2a29', inkSoft: '#556361', inkMute: '#8c9997',
  paper: '#fafcfb', paper2: '#f0f4f2', line: '#dde4e2', white: '#ffffff',
};

// ─── Dark theme ───────────────────────────────────────────

export const dark: ThemeColors = {
  teal900: '#9dd4c7', teal700: '#4cc5b3', teal500: '#2ea395',
  teal300: '#1e5049', teal100: '#142e2a', teal50: '#0e2320',
  coral: '#f58b6b', coralSoft: '#3d1a12', sun: '#f7d97a',
  mint: '#0f2e22', plum: '#b07fd0',
  ink: '#e2eeec', inkSoft: '#94b5b0', inkMute: '#5c7f7a',
  paper: '#0c1916', paper2: '#142220', line: '#1f3330', white: '#162520',
};

// ─── Context ──────────────────────────────────────────────

interface ThemeCtx { colors: ThemeColors; isDark: boolean }
const ThemeContext = createContext<ThemeCtx>({ colors: light, isDark: false });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = isDark ? dark : light;
  const value = useMemo(() => ({ colors, isDark }), [isDark]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeCtx {
  return useContext(ThemeContext);
}

// ─── makeStyles helper ────────────────────────────────────
// Usage (at module level):
//   const useStyles = makeStyles(c => StyleSheet.create({ root: { backgroundColor: c.paper } }));
// Usage (in component):
//   const styles = useStyles();

type NamedStyles = { [k: string]: ViewStyle | TextStyle | ImageStyle };

export function makeStyles<T extends NamedStyles>(
  factory: (colors: ThemeColors) => T
): () => T {
  return function useStyles() {
    const { colors } = useTheme();
    return useMemo(() => StyleSheet.create(factory(colors)) as T, [colors]);
  };
}
