import { ThemeConfig } from '../types';

/**
 * Initialize theme settings in the DOM based on stored preferences
 */
export const initializeTheme = (theme: ThemeConfig) => {
  // Apply theme mode (light/dark)
  document.documentElement.classList.toggle('dark', theme.mode === 'dark');

  // Apply custom colors as CSS variables
  const isDarkMode = theme.mode === 'dark';
  const darkModeColors = getDarkModeColors();

  // Use different colors for dark mode with better contrast
  const primaryColor = isDarkMode 
    ? getOptimizedDarkModeColor(theme.primaryColor, darkModeColors) 
    : theme.primaryColor || '#53c9d9';
    
  const secondaryColor = isDarkMode 
    ? getOptimizedDarkModeColor(theme.secondaryColor, darkModeColors) 
    : theme.secondaryColor || '#5f4ae8';

  document.documentElement.style.setProperty('--primary-color', primaryColor);
  document.documentElement.style.setProperty('--secondary-color', secondaryColor);

  // Set additional theme colors for better UI/UX
  if (isDarkMode) {
    document.documentElement.style.setProperty('--hover-bg', 'hsla(222, 47%, 20%, 0.7)');
    document.documentElement.style.setProperty('--hover-border', primaryColor);
    document.documentElement.style.setProperty('--card-bg', 'hsl(222, 47%, 14%)');
    document.documentElement.style.setProperty('--card-border', 'hsl(223, 47%, 22%)');
    document.documentElement.style.setProperty('--input-bg', 'hsl(222, 47%, 10%)');
  } else {
    document.documentElement.style.setProperty('--hover-bg', 'hsla(0, 0%, 96%, 0.7)');
    document.documentElement.style.setProperty('--hover-border', primaryColor);
    document.documentElement.style.setProperty('--card-bg', 'hsl(0, 0%, 100%)');
    document.documentElement.style.setProperty('--card-border', 'hsl(0, 0%, 90%)');
    document.documentElement.style.setProperty('--input-bg', 'hsl(0, 0%, 98%)');
  }

  // Load and apply font size preference
  const savedFontSize = localStorage.getItem('fontSize') || 'text-base';

  // Remove all possible font size classes first
  document.documentElement.classList.remove('text-sm', 'text-base', 'text-lg', 'text-xl');

  // Add the selected font size class
  document.documentElement.classList.add(savedFontSize);

  // Apply animations preference
  const enableAnimations = localStorage.getItem('enableAnimations') !== 'false';
  if (!enableAnimations) {
    document.documentElement.classList.add('disable-animations');
  } else {
    document.documentElement.classList.remove('disable-animations');
  }
};

/**
 * Get optimized dark mode color for better contrast
 */
export const getOptimizedDarkModeColor = (color: string, darkColors: Record<string, string>): string => {
  // If color matches one of our light mode theme options, replace with dark mode version
  if (color === '#10B981') return darkColors.mint;          // Mint
  if (color === '#6366F1') return darkColors.indigo;        // Indigo
  if (color === '#F43F5E') return darkColors.rose;          // Rose
  if (color === '#F59E0B') return darkColors.amber;         // Amber
  if (color === '#64748B') return darkColors.slate;         // Slate
  if (color === '#8B5CF6') return darkColors.violet;        // Violet
  if (color === '#34D399') return darkColors.emerald;       // Emerald
  if (color === '#D946EF') return darkColors.fuchsia;       // Fuchsia
  if (color === '#14B8A6') return darkColors.teal;          // Teal
  if (color === '#2e7d32') return '#4ade80';                // Forest
  if (color === '#0277bd') return '#38bdf8';                // Ocean
  if (color === '#ff7043') return '#ffa726';                // Sunset
  if (color === '#ad1457') return '#f472b6';                // Berry
  if (color === '#424242') return '#a1a1aa';                // Monochrome
  
  // Default case - use dark mode primary or return original
  return darkColors.primary || color;
};

/**
 * Apply a theme color scheme
 */
export const applyColorScheme = (primary: string, secondary: string) => {
  document.documentElement.style.setProperty('--primary-color', primary);
  document.documentElement.style.setProperty('--secondary-color', secondary);
};

/**
 * Change the global font size
 */
export const changeFontSize = (size: string) => {
  // Remove all font size classes
  document.documentElement.classList.remove('text-sm', 'text-base', 'text-lg', 'text-xl');

  // Add selected font size class
  document.documentElement.classList.add(size);
  localStorage.setItem('fontSize', size);
};

/**
 * Toggle animations on/off globally
 */
export const toggleAnimations = (enable: boolean) => {
  if (enable) {
    document.documentElement.classList.remove('disable-animations');
  } else {
    document.documentElement.classList.add('disable-animations');
  }
  localStorage.setItem('enableAnimations', enable.toString());
};

/**
 * Reset to default theme settings
 */
export const resetToDefaultTheme = () => {
  // Default theme values
  const defaultTheme = {
    mode: 'light' as 'light' | 'dark',
    primaryColor: '#53c9d9',
    secondaryColor: '#5f4ae8',
  };

  // Apply default theme
  document.documentElement.classList.remove('dark');
  applyColorScheme(defaultTheme.primaryColor, defaultTheme.secondaryColor);

  // Reset font size to default
  changeFontSize('text-base');

  // Enable animations
  toggleAnimations(true);

  return defaultTheme;
};

/**
 * Get recommended dark mode colors that match well with dark backgrounds
 */
export const getDarkModeColors = () => {
  return {
    primary: '#3db9e5',     // Bright cyan blue
    secondary: '#7c5bf2',   // Vibrant purple
    accent: '#f06595',      // Rich pink
    success: '#34d399',     // Emerald green
    warning: '#fbbf24',     // Amber yellow
    error: '#ef4444',       // Red
    info: '#38bdf8',        // Sky blue
    surface: '#1e293b',     // Slate 800
    muted: '#475569',       // Slate 600
    // New color options for dark mode
    mint: '#34D399',        // Brighter emerald green
    indigo: '#818CF8',      // Lighter indigo
    rose: '#FB7185',        // Lighter rose red
    amber: '#FCD34D',       // Lighter amber
    slate: '#94A3B8',       // Lighter slate
    violet: '#A78BFA',      // Lighter violet
    emerald: '#6EE7B7',     // Lighter emerald
    fuchsia: '#E879F9',     // Lighter fuchsia
    teal: '#5EEAD4',        // Lighter teal
  };
}; 