/**
 * Simple logger
 */
export const log = {
  level: 'info',
  setLevel(level) {
    this.level = level;
  },
  getLogger(name) {
    return {
      debug: (...args) => { if (this.level === 'debug') console.log(`[DEBUG][${name}]`, ...args); },
      info: (...args) => { if (this.level === 'debug' || this.level === 'info') console.log(`[INFO][${name}]`, ...args); },
      warn: (...args) => { console.warn(`[WARN][${name}]`, ...args); },
      error: (...args) => { console.error(`[ERROR][${name}]`, ...args); }
    };
  }
};
export const createLogger = (name) => log.getLogger(name);
