import { translations } from './translations.js';

export { translations };

export const locales = ['pt', 'en', 'es'];
export const localeLabels = { pt: 'PT-BR', en: 'EN', es: 'ES' };

export function getLocaleLabel(locale) {
  return localeLabels[locale] || locale.toUpperCase();
}

let currentLocale = 'pt';
let listeners = [];

function getStoredLocale() {
  try {
    return localStorage.getItem('mis-locale');
  } catch {
    return null;
  }
}

function detectBrowserLocale() {
  if (typeof navigator === 'undefined') return 'pt';

  const browserLang = navigator.language || navigator.languages?.[0] || '';

  if (browserLang.startsWith('pt')) return 'pt';
  if (browserLang.startsWith('en')) return 'en';
  if (browserLang.startsWith('es')) return 'es';

  return 'pt';
}

export function initI18n() {
  const stored = getStoredLocale();
  currentLocale = stored && locales.includes(stored) ? stored : detectBrowserLocale();
  return currentLocale;
}

export function getLocale() {
  return currentLocale;
}

export function setLocale(locale) {
  if (!locales.includes(locale)) return;

  currentLocale = locale;

  try {
    localStorage.setItem('mis-locale', locale);
  } catch {}

  listeners.forEach((fn) => fn(locale));
}

export function t(key, params = {}) {
  const dict = translations[currentLocale] || translations.pt;
  let text = dict[key] || key;

  Object.entries(params).forEach(([paramKey, value]) => {
    text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), value);
  });

  return text;
}

export function applyI18n(root = document) {
  if (!root || typeof root.querySelectorAll !== 'function') return;

  root.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    if (key) el.textContent = t(key);
  });

  root.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.dataset.i18nPlaceholder;
    if (key) el.placeholder = t(key);
  });
}

export function useI18n() {
  return { locale: currentLocale, setLocale, t };
}

export function onLocaleChange(fn) {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((listener) => listener !== fn);
  };
}
