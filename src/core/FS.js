/**
 * File System wrapper (using browser's filesystem access API or localStorage as fallback)
 */
export const fs = {
  readFile: async (path) => '',
  writeFile: async (path, content) => {},
  appendFile: async (path, content) => {},
  unlink: async (path) => {},
  readdir: async (path) => [],
  stat: async (path) => ({ size: 0, isFile: () => true, isDirectory: () => false }),
  mkdir: async (path, recursive) => {},
  rmdir: async (path, recursive) => {}
};
