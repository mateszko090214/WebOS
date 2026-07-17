/**
 * Settings store
 */
import { writable } from 'svelte/store';

// Since we don't have svelte in this project, let's use a simple object
let settings = {
  get: (key, defaultValue) => {
    // For now, return defaults
    switch (key) {
      case 'logLevel': return 'info';
      case 'telemetryEnabled': return false;
      case 'highContrast': return false;
      case 'developerMode': return false;
      default: return defaultValue;
    }
  }
};

export const settings = {
  get: settings.get
};

export const defaultSettings = {};
