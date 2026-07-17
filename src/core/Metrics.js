/**
 * Metrics collection
 */
export const Metrics = {
  startFPS: (callback) => {
    // Mock FPS callback
    const fps = 60;
    setInterval(() => callback(fps), 1000);
    return () => {};
  },
  startAlerts: () => {
    console.log('Metrics alerts started');
  },
  performanceCollector: {
    collect: () => {
      console.log('Performance data collected');
    }
  }
};
