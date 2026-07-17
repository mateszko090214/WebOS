/**
 * Simple event bus for pub/sub
 */
export const bus = {
  callbacks: new Map(),
  on(event, callback) {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, new Set());
    }
    this.callbacks.get(event).add(callback);
    return () => this.off(event, callback);
  },
  off(event, callback) {
    const callbacks = this.callbacks.get(event);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.callbacks.delete(event);
      }
    }
  },
  emit(event, detail) {
    const callbacks = this.callbacks.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(detail));
    }
  },
  once(event, callback) {
    const remove = this.on(event, (...args) => {
      remove();
      callback(...args);
    });
  },
  waitFor(event) {
    return new Promise(resolve => {
      const remove = this.on(event, detail => {
        remove();
        resolve(detail);
      });
    });
  }
};
