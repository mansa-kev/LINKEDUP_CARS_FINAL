/**
 * Production-safe logging utility
 * Logs only in development mode to prevent exposing sensitive information in production
 */

const viteEnv = typeof import.meta !== 'undefined' ? import.meta.env : undefined;
const isDev = Boolean(viteEnv?.DEV || process.env.NODE_ENV !== 'production');

export const logger = {
  log: (...args: any[]) => {
    if (isDev) console.log(...args);
  },
  error: (...args: any[]) => {
    if (isDev) console.error(...args);
  },
  warn: (...args: any[]) => {
    if (isDev) console.warn(...args);
  },
  info: (...args: any[]) => {
    if (isDev) console.info(...args);
  },
  debug: (...args: any[]) => {
    if (isDev) console.debug(...args);
  }
};
