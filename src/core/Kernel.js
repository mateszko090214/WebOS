/**
 * Kernel - core system functions
 */
export const kernel = {
  version: '1.0.0',
  hostname: 'retrowebos',
  uptime: () => {
    return process.uptime ? process.uptime() : 0;
  }
};
