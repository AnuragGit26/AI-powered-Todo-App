import { ThemeConfig } from '../types';

/**
 * Initialize theme settings in the DOM based on stored preferences
 */
export const initializeTheme = (theme: ThemeConfig) => {
  // Apply theme mode (light/dark)
  document.documentElement.classList.toggle('dark', theme.mode === 'dark');
  
  // Apply custom colors as CSS variables
  document.documentElement.style.setProperty('--primary-color', theme.primaryColor || '#53c9d9');
  document.documentElement.style.setProperty('--secondary-color', theme.secondaryColor || '#5f4ae8');
  
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