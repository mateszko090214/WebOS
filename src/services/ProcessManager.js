/**
 * ProcessManager - Simplified version for bootstrapping
 */

import { bus } from '../core/Bus.js';
import { log } from '../core/Logger.js';

const procLogger = log.getLogger('process-manager');

export const ProcessState = {
  CREATED: 'created',
  STARTING: 'starting',
  RUNNING: 'running',
  SLEEPING: 'sleeping',
  STOPPED: 'stopped',
  ZOMBIE: 'zombie',
  DEAD: 'dead'
};

export class ProcessManager {
  constructor() {
    this.processes = new Map();
    this.initProcess = null;
  }

  async init(options = {}) {
    procLogger.info('ProcessManager initialized');
    return this;
  }

  async spawn(moduleOrFn, options = {}) {
    procLogger.info('Spawning process', { module: typeof moduleOrFn === 'string' ? moduleOrFn : moduleOrFn.name || 'anonymous' });
    // Simulate a process object
    const process = {
      pid: Math.floor(Math.random() * 10000),
      ppid: options.parent?.pid || 0,
      name: options.name || (typeof moduleOrFn === 'string' ? moduleOrFn : moduleOrFn.name || 'anonymous'),
      state: 'running',
      toJSON: () => ({
        pid: Math.floor(Math.random() * 10000),
        ppid: options.parent?.pid || 0,
        name: options.name || (typeof moduleOrFn === 'string' ? moduleOrFn : moduleOrFn.name || 'anonymous'),
        state: 'running'
      })
    };
    this.processes.set(process.pid, process);
    // Return a mock process and job
    return {
      process,
      job: { id: `job_${process.pid}`, processes: new Set([process.pid]) }
    };
  }

  // Other methods stubbed as needed
  getProcess(pid) {
    return this.processes.get(pid);
  }
  getAllProcesses() {
    return Array.from(this.processes.values()).map(p => p.toJSON());
  }
}

// Singleton
let _instance = null;
export function getProcessManager() {
  if (!_instance) _instance = new ProcessManager();
  return _instance;
}

export const processManager = getProcessManager();

export default ProcessManager;
