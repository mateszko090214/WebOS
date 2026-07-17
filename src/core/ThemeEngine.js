/**
 * Theme engine
 */
export const themeEngine = {
  setTheme: (theme) => {
    console.log(`Setting theme: ${theme}`);
    document.documentElement.setAttribute('data-theme', theme);
  },
  getCurrentTheme: () => document.documentElement.getAttribute('data-theme') || 'amber'
};
