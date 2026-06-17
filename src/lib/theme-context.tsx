// ==================== 主题 Context ====================

import { createContext, useContext } from 'react';

export interface ThemeContextValue {
  isDark: boolean;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextValue>({
  isDark: true,
  toggleTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}
