/**
 * Internationalization
 */
const translations = {
  en: {
    'system.ready': 'System ready',
    // Add more as needed
  }
};

let locale = 'en';

export const i18n = {
  setLocale: (loc) => { locale = loc; },
  t: (key) => {
    return translations[locale] && translations[locale][key] ? translations[locale][key] : key;
  }
};

export default i18n;
