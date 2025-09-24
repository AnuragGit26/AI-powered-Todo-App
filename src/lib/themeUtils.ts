import { ThemeConfig } from '../types';

// Theme key
const THEME_STORAGE_KEY = 'app_theme_settings';

interface ThemeSettings extends ThemeConfig {
  fontSize: string;
  enableAnimations: boolean;
}

// Save theme
export const saveThemeSettings = (settings: Partial<ThemeSettings>) => {
  const currentSettings = loadThemeSettings();
  const updatedSettings = {
    ...currentSettings,
    ...settings,
  };
  localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(updatedSettings));
  return updatedSettings;
};

// Load theme
export const loadThemeSettings = (): ThemeSettings => {
  const defaultSettings: ThemeSettings = {
    mode: 'light',
    primaryColor: '#53c9d9',
    secondaryColor: '#5f4ae8',
    fontFamily: 'Inter',
    fontSize: 'text-base',
    enableAnimations: true,
  };

  const savedSettings = localStorage.getItem(THEME_STORAGE_KEY);
  if (!savedSettings) {
    return defaultSettings;
  }

  try {
    const parsedSettings = JSON.parse(savedSettings);
    return { ...defaultSettings, ...parsedSettings };
  } catch (error) {
    console.error('Error parsing theme settings:', error);
    return defaultSettings;
  }
};

// Init theme to DOM
export const initializeTheme = (theme: ThemeConfig) => {
  const settings = loadThemeSettings();

  // Set mode
  const mode = theme.mode || settings.mode;
  document.documentElement.classList.toggle('dark', mode === 'dark');

  // Colors -> CSS vars
  const isDarkMode = mode === 'dark';
  const darkModeColors = getDarkModeColors();

  // Better dark contrast
  const primaryColor = isDarkMode
    ? getOptimizedDarkModeColor(theme.primaryColor || settings.primaryColor, darkModeColors)
    : theme.primaryColor || settings.primaryColor;

  const secondaryColor = isDarkMode
    ? getOptimizedDarkModeColor(theme.secondaryColor || settings.secondaryColor, darkModeColors)
    : theme.secondaryColor || settings.secondaryColor;

  document.documentElement.style.setProperty('--primary-color', primaryColor);
  document.documentElement.style.setProperty('--secondary-color', secondaryColor);

  // Font family
  const fontFamily = theme.fontFamily || settings.fontFamily;
  document.documentElement.style.setProperty('--font-family', fontFamily || '');

  // Font size
  const fontSize = settings.fontSize;
  document.documentElement.classList.remove('text-sm', 'text-base', 'text-lg', 'text-xl');
  document.documentElement.classList.add(fontSize);

  // Animations on/off
  const enableAnimations = settings.enableAnimations;
  if (!enableAnimations) {
    document.documentElement.classList.add('disable-animations');
  } else {
    document.documentElement.classList.remove('disable-animations');
  }

  // Save now
  saveThemeSettings({
    mode,
    primaryColor,
    secondaryColor,
    fontFamily,
    fontSize,
    enableAnimations,
  });
};

// Pick better dark color
export const getOptimizedDarkModeColor = (color: string, darkColors: Record<string, string>): string => {
  // Swap light palette to dark
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

  // Fallback
  return darkColors.primary || color;
};

// Set color scheme
export const applyColorScheme = (primary: string, secondary: string) => {
  document.documentElement.style.setProperty('--primary-color', primary);
  document.documentElement.style.setProperty('--secondary-color', secondary);
  saveThemeSettings({ primaryColor: primary, secondaryColor: secondary });
};

// Set font size
export const changeFontSize = (size: string) => {
  // Reset size classes
  document.documentElement.classList.remove('text-sm', 'text-base', 'text-lg', 'text-xl');

  // Add size
  document.documentElement.classList.add(size);
  saveThemeSettings({ fontSize: size });
};

// Set font family
export const changeFontFamily = (fontFamily: string) => {
  document.documentElement.style.setProperty('--font-family', fontFamily);
  saveThemeSettings({ fontFamily });
};

// Toggle animations
export const toggleAnimations = (enable: boolean) => {
  if (enable) {
    document.documentElement.classList.remove('disable-animations');
  } else {
    document.documentElement.classList.add('disable-animations');
  }
  saveThemeSettings({ enableAnimations: enable });
};

// Reset theme
export const resetToDefaultTheme = () => {
  const defaultTheme: ThemeSettings = {
    mode: 'light',
    primaryColor: '#53c9d9',
    secondaryColor: '#5f4ae8',
    fontFamily: 'Inter',
    fontSize: 'text-base',
    enableAnimations: true,
  };

  // Apply defaults
  document.documentElement.classList.remove('dark');
  document.documentElement.style.setProperty('--primary-color', defaultTheme.primaryColor);
  document.documentElement.style.setProperty('--secondary-color', defaultTheme.secondaryColor);
  document.documentElement.style.setProperty('--font-family', defaultTheme.fontFamily);
  document.documentElement.classList.remove('text-sm', 'text-base', 'text-lg', 'text-xl');
  document.documentElement.classList.add(defaultTheme.fontSize);
  document.documentElement.classList.remove('disable-animations');

  // Save defaults
  saveThemeSettings(defaultTheme);

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