class Bus {
  constructor(name = "RetroOS") {
    this.name = name;
    this._listeners = /* @__PURE__ */ new Map();
    this._wildcards = /* @__PURE__ */ new Map();
    this._history = [];
    this._historyLimit = 100;
    this._debug = false;
    this._subscriptions = /* @__PURE__ */ new Map();
  }
  /**
   * Subscribe to an event
   * @param {string} event - Event name (supports wildcards: "app.*", "window.*")
   * @param {Function} handler - Callback function
   * @param {Object} options - { once: boolean, priority: number, context: object }
   * @returns {Function} Unsubscribe function
   */
  on(event, handler, options = {}) {
    if (typeof handler !== "function") {
      throw new TypeError("Handler must be a function");
    }
    const subscription = {
      id: this._generateId(),
      event,
      handler,
      once: options.once || false,
      priority: options.priority || 0,
      context: options.context || null,
      created: Date.now()
    };
    if (event.includes("*")) {
      if (!this._wildcards.has(event)) {
        this._wildcards.set(event, []);
      }
      this._wildcards.get(event).push(subscription);
    } else {
      if (!this._listeners.has(event)) {
        this._listeners.set(event, []);
      }
      this._listeners.get(event).push(subscription);
    }
    const list = this._wildcards.has(event) ? this._wildcards.get(event) : this._listeners.get(event);
    list.sort((a, b) => b.priority - a.priority);
    return () => this.off(event, handler);
  }
  /**
   * Subscribe once
   */
  once(event, handler, options = {}) {
    return this.on(event, handler, { ...options, once: true });
  }
  /**
   * Unsubscribe from event
   */
  off(event, handler) {
    const removeFromList = (list) => {
      const index = list.findIndex((s) => s.handler === handler);
      if (index !== -1) {
        list.splice(index, 1);
        return true;
      }
      return false;
    };
    let removed = false;
    if (this._listeners.has(event)) {
      removed = removeFromList(this._listeners.get(event)) || removed;
      if (this._listeners.get(event).length === 0) {
        this._listeners.delete(event);
      }
    }
    if (this._wildcards.has(event)) {
      removed = removeFromList(this._wildcards.get(event)) || removed;
      if (this._wildcards.get(event).length === 0) {
        this._wildcards.delete(event);
      }
    }
    return removed;
  }
  /**
   * Remove all listeners for an event
   */
  offAll(event) {
    if (event) {
      this._listeners.delete(event);
      this._wildcards.delete(event);
    } else {
      this._listeners.clear();
      this._wildcards.clear();
    }
  }
  /**
   * Emit an event
   * @param {string} event - Event name
   * @param {...any} args - Arguments to pass to handlers
   * @returns {Promise<number>} Number of handlers called
   */
  async emit(event, ...args) {
    const handlers = this._getHandlers(event);
    if (handlers.length === 0) return 0;
    let called = 0;
    for (const sub of handlers) {
      try {
        if (sub.context) {
          await sub.handler.call(sub.context, ...args);
        } else {
          await sub.handler(...args);
        }
        called++;
        if (sub.once) {
          this.off(event, sub.handler);
        }
      } catch (error) {
        this._logError(event, error, args);
      }
    }
    this._recordHistory(event, args, called);
    return called;
  }
  /**
   * Emit synchronously (for non-async handlers)
   */
  emitSync(event, ...args) {
    const handlers = this._getHandlers(event);
    let called = 0;
    for (const sub of handlers) {
      try {
        if (sub.context) {
          sub.handler.call(sub.context, ...args);
        } else {
          sub.handler(...args);
        }
        called++;
        if (sub.once) {
          this.off(event, sub.handler);
        }
      } catch (error) {
        this._logError(event, error, args);
      }
    }
    this._recordHistory(event, args, called);
    return called;
  }
  /**
   * Emit and collect return values
   */
  async emitCollect(event, ...args) {
    const handlers = this._getHandlers(event);
    const results = [];
    for (const sub of handlers) {
      try {
        let result;
        if (sub.context) {
          result = await sub.handler.call(sub.context, ...args);
        } else {
          result = await sub.handler(...args);
        }
        results.push(result);
        if (sub.once) {
          this.off(event, sub.handler);
        }
      } catch (error) {
        this._logError(event, error, args);
        results.push({ error: error.message });
      }
    }
    return results;
  }
  /**
   * Wait for an event (returns a promise)
   */
  waitFor(event, timeout = 5e3) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.off(event, handler);
        reject(new Error(`Timeout waiting for ${event}`));
      }, timeout);
      const handler = (...args) => {
        clearTimeout(timer);
        resolve(args.length === 1 ? args[0] : args);
      };
      this.once(event, handler);
    });
  }
  /**
   * Create a scoped subscription that auto-cleans on context destruction
   */
  scope(context) {
    const subs = [];
    const scoped = {
      on: (event, handler, options) => {
        const unsub = this.on(event, handler, { ...options, context });
        subs.push(unsub);
        return unsub;
      },
      once: (event, handler, options) => {
        const unsub = this.once(event, handler, { ...options, context });
        subs.push(unsub);
        return unsub;
      },
      off: (event, handler) => this.off(event, handler),
      dispose: () => {
        subs.forEach((unsub) => unsub());
        subs.length = 0;
      }
    };
    if (context && typeof context.onDestroy === "function") {
      context.onDestroy(() => scoped.dispose());
    }
    return scoped;
  }
  /**
   * Get listener count for an event
   */
  listenerCount(event) {
    var _a;
    let count = ((_a = this._listeners.get(event)) == null ? void 0 : _a.length) || 0;
    for (const [pattern, list] of this._wildcards) {
      if (this._matchPattern(pattern, event)) {
        count += list.length;
      }
    }
    return count;
  }
  /**
   * Get all listeners for an event (for debugging)
   */
  getListeners(event) {
    return this._getHandlers(event).map((s) => ({
      id: s.id,
      event: s.event,
      once: s.once,
      priority: s.priority,
      created: s.created
    }));
  }
  /**
   * Enable/disable debug logging
   */
  setDebug(enabled) {
    this._debug = enabled;
  }
  /**
   * Get event history
   */
  getHistory(limit = 50) {
    return this._history.slice(-limit);
  }
  /**
   * Clear history
   */
  clearHistory() {
    this._history.length = 0;
  }
  // Private methods
  _getHandlers(event) {
    const handlers = [];
    if (this._listeners.has(event)) {
      handlers.push(...this._listeners.get(event));
    }
    for (const [pattern, list] of this._wildcards) {
      if (this._matchPattern(pattern, event)) {
        handlers.push(...list);
      }
    }
    return handlers.sort((a, b) => b.priority - a.priority);
  }
  _matchPattern(pattern, event) {
    const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
    return regex.test(event);
  }
  _recordHistory(event, args, called) {
    this._history.push({
      event,
      args: args.map(this._safeSerialize),
      called,
      timestamp: Date.now()
    });
    if (this._history.length > this._historyLimit) {
      this._history.shift();
    }
  }
  _safeSerialize(value) {
    try {
      if (value === null || value === void 0) return value;
      if (typeof value === "function") return "[Function]";
      if (typeof value === "symbol") return "[Symbol]";
      if (value instanceof HTMLElement) return `[HTMLElement: ${value.tagName}]`;
      if (value instanceof Error) return `[Error: ${value.message}]`;
      if (typeof value === "object") {
        return JSON.stringify(value, (key, val) => {
          if (typeof val === "function") return "[Function]";
          if (val instanceof HTMLElement) return `[HTMLElement: ${val.tagName}]`;
          return val;
        });
      }
      return value;
    } catch (e) {
      return "[Unserializable]";
    }
  }
  _logError(event, error, args) {
    console.error(`[Bus:${this.name}] Error in "${event}":`, error);
    if (this._debug) {
      console.debug("Args:", args);
    }
  }
  _generateId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }
}
const bus = new Bus("RetroOS");
class IDB {
  constructor(options = {}) {
    this.name = options.name || "RetroWebOS";
    this.version = options.version || 3;
    this.stores = options.stores || [
      { name: "state", keyPath: "key", indexes: [] },
      { name: "files", keyPath: "id", indexes: [{ name: "path", unique: false }, { name: "parent", unique: false }] },
      { name: "apps", keyPath: "id", indexes: [{ name: "installed", unique: false }] },
      { name: "history", keyPath: "id", autoIncrement: true, indexes: [{ name: "timestamp", unique: false }] },
      { name: "cache", keyPath: "key", indexes: [{ name: "expires", unique: false }] },
      { name: "logs", keyPath: "id", autoIncrement: true, indexes: [{ name: "level", unique: false }, { name: "timestamp", unique: false }] }
    ];
    this.db = null;
    this.ready = this.init();
  }
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.name, this.version);
      request.onupgradeneeded = (event) => {
        this.db = event.target.result;
        const oldVersion = event.oldVersion;
        this.stores.forEach((storeConfig) => {
          let store;
          if (!this.db.objectStoreNames.contains(storeConfig.name)) {
            store = this.db.createObjectStore(storeConfig.name, {
              keyPath: storeConfig.keyPath,
              autoIncrement: storeConfig.autoIncrement || false
            });
          } else {
            store = event.target.transaction.objectStore(storeConfig.name);
          }
          storeConfig.indexes.forEach((index) => {
            if (!store.indexNames.contains(index.name)) {
              store.createIndex(index.name, index.name, { unique: index.unique || false });
            }
          });
        });
        this.migrate(oldVersion, this.version);
      };
      request.onsuccess = (event) => {
        this.db = event.target.result;
        this.db.onerror = (e) => console.error("[IDB] Database error:", e.target.error);
        resolve(this);
      };
      request.onerror = (event) => {
        console.error("[IDB] Failed to open:", event.target.error);
        reject(event.target.error);
      };
      request.onblocked = () => {
        console.warn("[IDB] Database blocked - close other tabs");
      };
    });
  }
  migrate(fromVersion, toVersion) {
    if (fromVersion < 2 && toVersion >= 2) {
      console.log("[IDB] Migrating to v2: adding files store");
    }
    if (fromVersion < 3 && toVersion >= 3) {
      console.log("[IDB] Migrating to v3: adding cache and logs stores");
    }
  }
  async ensureReady() {
    if (!this.db) await this.ready;
    return this.db;
  }
  // Generic CRUD operations
  async get(storeName, key) {
    await this.ensureReady();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, "readonly");
      const store = tx.objectStore(storeName);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  async getAll(storeName, indexName = null, query = null) {
    await this.ensureReady();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, "readonly");
      const store = tx.objectStore(storeName);
      const source = indexName ? store.index(indexName) : store;
      const request = query ? source.getAll(query) : source.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  async put(storeName, value) {
    await this.ensureReady();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      const request = store.put(value);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  async add(storeName, value) {
    await this.ensureReady();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      const request = store.add(value);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  async delete(storeName, key) {
    await this.ensureReady();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      const request = store.delete(key);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }
  async clear(storeName) {
    await this.ensureReady();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      const request = store.clear();
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }
  async count(storeName, indexName = null, query = null) {
    await this.ensureReady();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, "readonly");
      const store = tx.objectStore(storeName);
      const source = indexName ? store.index(indexName) : store;
      const request = query ? source.count(query) : source.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  // Cursor iteration for large datasets
  async iterate(storeName, callback, options = {}) {
    await this.ensureReady();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, options.write ? "readwrite" : "readonly");
      const store = tx.objectStore(storeName);
      const source = options.index ? store.index(options.index) : store;
      const request = source.openCursor(options.range, options.direction);
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          const result = callback(cursor.value, cursor);
          if (result === false) {
            resolve();
            return;
          }
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  }
  // Transaction helper for batch operations
  async transaction(storeNames, mode, callback) {
    await this.ensureReady();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeNames, mode);
      const stores = storeNames.map((name) => tx.objectStore(name));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
      callback(stores.length === 1 ? stores[0] : stores, tx);
    });
  }
  // Cache with TTL
  async cacheSet(key, value, ttl = 36e5) {
    const expires = Date.now() + ttl;
    await this.put("cache", { key, value, expires, created: Date.now() });
  }
  async cacheGet(key) {
    const entry = await this.get("cache", key);
    if (!entry) return null;
    if (entry.expires && entry.expires < Date.now()) {
      await this.delete("cache", key);
      return null;
    }
    return entry.value;
  }
  async cacheDelete(key) {
    await this.delete("cache", key);
  }
  async cacheClearExpired() {
    await this.ensureReady();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction("cache", "readwrite");
      const store = tx.objectStore("cache");
      const index = store.index("expires");
      const range = IDBKeyRange.upperBound(Date.now());
      const request = index.openCursor(range);
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  }
  // Logging
  async log(level, message, data = {}) {
    await this.add("logs", {
      level,
      message,
      data,
      timestamp: Date.now(),
      userAgent: navigator.userAgent
    });
  }
  async getLogs(options = {}) {
    const { level, limit = 100, since } = options;
    let logs = await this.getAll("logs", "timestamp");
    if (level) logs = logs.filter((l) => l.level === level);
    if (since) logs = logs.filter((l) => l.timestamp >= since);
    return logs.slice(-limit).reverse();
  }
  async clearLogs(olderThan = 0) {
    await this.ensureReady();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction("logs", "readwrite");
      const store = tx.objectStore("logs");
      const index = store.index("timestamp");
      const range = olderThan > 0 ? IDBKeyRange.upperBound(olderThan) : null;
      const request = index.openCursor(range);
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  }
  // Backup/Export
  async exportAll() {
    const data = {};
    for (const store of this.stores) {
      data[store.name] = await this.getAll(store.name);
    }
    return data;
  }
  async importAll(data) {
    for (const store of this.stores) {
      if (data[store.name]) {
        await this.clear(store.name);
        for (const item of data[store.name]) {
          await this.put(store.name, item);
        }
      }
    }
  }
  // Health check
  async healthCheck() {
    try {
      await this.ensureReady();
      const counts = {};
      for (const store of this.stores) {
        counts[store.name] = await this.count(store.name);
      }
      return { healthy: true, counts, version: this.version };
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}
const idb = new IDB();
class Crypto {
  constructor() {
    this._algorithm = "AES-GCM";
    this._keyLength = 256;
    this._pbkdf2Iterations = 12e4;
    this._saltLength = 16;
    this._ivLength = 12;
    this._tagLength = 128;
    this._hashAlgorithm = "SHA-256";
  }
  /**
   * Derive a key from password using PBKDF2
   * @param {string|ArrayBuffer} password - Password or key material
   * @param {Uint8Array} salt - Salt (generated if not provided)
   * @param {Object} options - { iterations, algorithm, keyLength }
   * @returns {Promise<{ key: CryptoKey, salt: Uint8Array }>}
   */
  async deriveKey(password, salt = null, options = {}) {
    const encoder = new TextEncoder();
    const iterations = options.iterations || this._pbkdf2Iterations;
    options.algorithm || { hash: this._hashAlgorithm };
    const keyLength = options.keyLength || this._keyLength;
    const usages = options.usages || ["encrypt", "decrypt"];
    let keyMaterial;
    if (password instanceof ArrayBuffer || ArrayBuffer.isView(password)) {
      keyMaterial = await crypto$1.subtle.importKey("raw", password, "PBKDF2", false, ["deriveKey"]);
    } else {
      keyMaterial = await crypto$1.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveKey"]);
    }
    const finalSalt = salt || crypto$1.getRandomValues(new Uint8Array(this._saltLength));
    const key = await crypto$1.subtle.deriveKey(
      { name: "PBKDF2", salt: finalSalt, iterations, hash: this._hashAlgorithm },
      keyMaterial,
      { name: this._algorithm, length: keyLength },
      false,
      usages
    );
    return { key, salt: finalSalt };
  }
  /**
   * Encrypt data with password
   * @param {string|ArrayBuffer|Object} data - Data to encrypt
   * @param {string} password - Password
   * @param {Object} options - { algorithm, iterations, associatedData }
   * @returns {Promise<Object>} { ciphertext, salt, iv, tag, algorithm }
   */
  async encrypt(data, password, options = {}) {
    const encoder = new TextEncoder();
    const { key, salt } = await this.deriveKey(password, null, {
      iterations: options.iterations,
      usages: ["encrypt"]
    });
    const iv = crypto$1.getRandomValues(new Uint8Array(this._ivLength));
    const plaintext = data instanceof ArrayBuffer || ArrayBuffer.isView(data) ? data : encoder.encode(typeof data === "string" ? data : JSON.stringify(data));
    let associatedData = null;
    if (options.associatedData) {
      associatedData = typeof options.associatedData === "string" ? encoder.encode(options.associatedData) : options.associatedData;
    }
    const ciphertext = await crypto$1.subtle.encrypt(
      { name: this._algorithm, iv, tagLength: this._tagLength, additionalData: associatedData },
      key,
      plaintext
    );
    const cipherArray = new Uint8Array(ciphertext);
    const tag = cipherArray.slice(-16);
    const encrypted = cipherArray.slice(0, -16);
    return {
      algorithm: this._algorithm,
      ciphertext: this._toBase64(encrypted),
      salt: this._toBase64(salt),
      iv: this._toBase64(iv),
      tag: this._toBase64(tag),
      version: 1,
      timestamp: Date.now()
    };
  }
  /**
   * Decrypt data with password
   * @param {Object} encrypted - Output from encrypt()
   * @param {string} password - Password
   * @param {Object} options - { associatedData }
   * @returns {Promise<ArrayBuffer>} Decrypted data
   */
  async decrypt(encrypted, password, options = {}) {
    if (!encrypted || !encrypted.ciphertext) {
      throw new Error("Invalid encrypted data");
    }
    const { key } = await this.deriveKey(password, this._fromBase64(encrypted.salt), {
      usages: ["decrypt"]
    });
    const iv = this._fromBase64(encrypted.iv);
    const ciphertext = this._fromBase64(encrypted.ciphertext);
    const tag = this._fromBase64(encrypted.tag);
    const combined = new Uint8Array(ciphertext.byteLength + tag.byteLength);
    combined.set(new Uint8Array(ciphertext), 0);
    combined.set(new Uint8Array(tag), ciphertext.byteLength);
    let associatedData = null;
    if (options.associatedData) {
      associatedData = typeof options.associatedData === "string" ? new TextEncoder().encode(options.associatedData) : options.associatedData;
    }
    try {
      const plaintext = await crypto$1.subtle.decrypt(
        { name: this._algorithm, iv, tagLength: this._tagLength, additionalData: associatedData },
        key,
        combined
      );
      return plaintext;
    } catch (e) {
      throw new Error("Decryption failed: incorrect password or corrupted data");
    }
  }
  /**
   * Decrypt to string
   */
  async decryptToString(encrypted, password, options = {}) {
    const buffer = await this.decrypt(encrypted, password, options);
    return new TextDecoder().decode(buffer);
  }
  /**
   * Decrypt to JSON
   */
  async decryptToJSON(encrypted, password, options = {}) {
    const str = await this.decryptToString(encrypted, password, options);
    return JSON.parse(str);
  }
  /**
   * Hash data with SHA-256
   */
  async hash(data, algorithm = "SHA-256") {
    const encoder = new TextEncoder();
    const buffer = data instanceof ArrayBuffer || ArrayBuffer.isView(data) ? data : encoder.encode(typeof data === "string" ? data : JSON.stringify(data));
    const hash = await crypto$1.subtle.digest(algorithm, buffer);
    return this._toBase64(new Uint8Array(hash));
  }
  /**
   * Generate HMAC
   */
  async hmac(data, key, algorithm = "SHA-256") {
    const encoder = new TextEncoder();
    const keyBuffer = key instanceof ArrayBuffer || ArrayBuffer.isView(key) ? key : encoder.encode(key);
    const dataBuffer = data instanceof ArrayBuffer || ArrayBuffer.isView(data) ? data : encoder.encode(typeof data === "string" ? data : JSON.stringify(data));
    const cryptoKey = await crypto$1.subtle.importKey(
      "raw",
      keyBuffer,
      { name: "HMAC", hash: algorithm },
      false,
      ["sign"]
    );
    const signature = await crypto$1.subtle.sign("HMAC", cryptoKey, dataBuffer);
    return this._toBase64(new Uint8Array(signature));
  }
  /**
   * Generate random bytes
   */
  randomBytes(length) {
    return crypto$1.getRandomValues(new Uint8Array(length));
  }
  /**
   * Generate random string (URL-safe base64)
   */
  randomString(length = 32) {
    const bytes = this.randomBytes(length);
    return this._toBase64URL(bytes);
  }
  /**
   * Generate UUID v4
   */
  uuid() {
    const bytes = this.randomBytes(16);
    bytes[6] = bytes[6] & 15 | 64;
    bytes[8] = bytes[8] & 63 | 128;
    return this._bytesToHex(bytes).replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, "$1-$2-$3-$4-$5");
  }
  /**
   * Constant-time comparison to prevent timing attacks
   */
  constantTimeEqual(a, b) {
    const arrA = a instanceof Uint8Array ? a : new TextEncoder().encode(a);
    const arrB = b instanceof Uint8Array ? b : new TextEncoder().encode(b);
    if (arrA.length !== arrB.length) return false;
    let result = 0;
    for (let i = 0; i < arrA.length; i++) {
      result |= arrA[i] ^ arrB[i];
    }
    return result === 0;
  }
  /**
   * Secure password verification (using scrypt if available, else PBKDF2)
   */
  async verifyPassword(password, hashData) {
    const { salt, hash, iterations = this._pbkdf2Iterations } = hashData;
    const { key } = await this.deriveKey(password, this._fromBase64(salt), { iterations });
    const derived = await crypto$1.subtle.exportKey("raw", key);
    return this.constantTimeEqual(new Uint8Array(derived), this._fromBase64(hash));
  }
  /**
   * Create password hash for storage
   */
  async hashPassword(password, options = {}) {
    const iterations = options.iterations || this._pbkdf2Iterations;
    const salt = options.salt || this.randomBytes(this._saltLength);
    const { key } = await this.deriveKey(password, salt, { iterations });
    const hash = await crypto$1.subtle.exportKey("raw", key);
    return {
      algorithm: "PBKDF2",
      hash: this._toBase64(new Uint8Array(hash)),
      salt: this._toBase64(salt),
      iterations,
      version: 1
    };
  }
  // Utility methods
  _toBase64(bytes) {
    let binary = "";
    const uint8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    for (let i = 0; i < uint8.length; i++) {
      binary += String.fromCharCode(uint8[i]);
    }
    return btoa(binary);
  }
  _toBase64URL(bytes) {
    return this._toBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  }
  _fromBase64(str) {
    const binary = atob(str);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
  _bytesToHex(bytes) {
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  }
}
const crypto$1 = new Crypto();
const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  FATAL: 4,
  OFF: 5
};
class LogEntry {
  constructor(level, message, context = {}, meta = {}) {
    this.id = crypto$1.uuid();
    this.timestamp = Date.now();
    this.level = level;
    this.levelName = LogLevelNames[level];
    this.message = message;
    this.context = this._sanitizeContext(context);
    this.meta = {
      service: DEFAULT_CONFIG.serviceName,
      environment: DEFAULT_CONFIG.environment,
      ...meta
    };
    this.correlationId = meta.correlationId || this._getCorrelationId();
    this.sessionId = meta.sessionId || this._getSessionId();
    this.userId = meta.userId || null;
    this.tags = meta.tags || [];
  }
  _sanitizeContext(context) {
    const sanitized = { ...context };
    for (const field of DEFAULT_CONFIG.piiFields) {
      const regex = new RegExp(field, "i");
      for (const key of Object.keys(sanitized)) {
        if (regex.test(key)) {
          sanitized[key] = "[REDACTED]";
        }
      }
    }
    return sanitized;
  }
  _getCorrelationId() {
    try {
      const header = document.querySelector(`meta[name="${DEFAULT_CONFIG.correlationIdHeader}"]`);
      return (header == null ? void 0 : header.content) || crypto$1.uuid();
    } catch {
      return crypto$1.uuid();
    }
  }
  _getSessionId() {
    try {
      return sessionStorage.getItem("session_id") || "unknown";
    } catch {
      return "unknown";
    }
  }
  toJSON() {
    return {
      id: this.id,
      timestamp: this.timestamp,
      level: this.levelName,
      message: this.message,
      context: this.context,
      meta: this.meta,
      correlationId: this.correlationId,
      sessionId: this.sessionId,
      userId: this.userId,
      tags: this.tags
    };
  }
  toString() {
    const ts = new Date(this.timestamp).toISOString();
    const ctx = Object.keys(this.context).length ? ` ${JSON.stringify(this.context)}` : "";
    return `[${ts}] ${this.levelName.padEnd(5)} ${this.message}${ctx}`;
  }
}
const LogLevelNames = {
  0: "DEBUG",
  1: "INFO",
  2: "WARN",
  3: "ERROR",
  4: "FATAL",
  5: "OFF"
};
const DEFAULT_CONFIG = {
  level: LogLevel.INFO,
  enableConsole: true,
  enableIndexedDB: true,
  enableRemote: false,
  remoteEndpoint: null,
  remoteApiKey: null,
  bufferSize: 100,
  flushInterval: 5e3,
  maxBatchSize: 50,
  retentionDays: 30,
  maxLogSize: 10 * 1024 * 1024,
  // 10MB
  piiFields: ["password", "token", "secret", "key", "auth", "credential", "ssn", "creditcard"],
  includeStackTrace: true,
  prettyPrint: false,
  timestampFormat: "iso",
  // 'iso' | 'unix' | 'relative'
  correlationIdHeader: "x-correlation-id",
  serviceName: "retrowayos",
  environment: "production"
};
class Transport {
  constructor(name, options = {}) {
    this.name = name;
    this.options = options;
    this.enabled = true;
  }
  async write(entry) {
    throw new Error("Transport.write() must be implemented");
  }
  async flush() {
  }
  async close() {
    this.enabled = false;
  }
}
class ConsoleTransport extends Transport {
  constructor(options = {}) {
    super("console", options);
    this.colors = {
      DEBUG: "\x1B[36m",
      // cyan
      INFO: "\x1B[32m",
      // green
      WARN: "\x1B[33m",
      // yellow
      ERROR: "\x1B[31m",
      // red
      FATAL: "\x1B[35m",
      // magenta
      RESET: "\x1B[0m"
    };
  }
  async write(entry) {
    if (!this.enabled) return;
    const color = this.colors[entry.levelName] || this.colors.RESET;
    const reset = this.colors.RESET;
    const prefix = `${color}[${entry.levelName}]${reset}`;
    {
      console.log(`${prefix} ${entry.toString()}`);
    }
  }
}
class IndexedDBTransport extends Transport {
  constructor(options = {}) {
    super("indexeddb", options);
    this.buffer = [];
    this.dbName = "retrowayos-logs";
    this.storeName = "logs";
    this.flushTimer = null;
    this._init();
  }
  async _init() {
    try {
      await idb.init();
      const db = await idb.openDatabase(this.dbName, 2, (db2, oldVer, newVer) => {
        if (oldVer < 1) {
          db2.createObjectStore(this.storeName, { keyPath: "id" });
        }
        if (oldVer < 2) {
          const store = db2.transaction(this.storeName, "readwrite").objectStore(this.storeName);
          store.createIndex("timestamp", "timestamp", { unique: false });
          store.createIndex("level", "level", { unique: false });
          store.createIndex("correlationId", "correlationId", { unique: false });
        }
      });
      this._startFlushTimer();
    } catch (e) {
      console.error("[Logger] IndexedDB transport init failed:", e);
      this.enabled = false;
    }
  }
  _startFlushTimer() {
    this.flushTimer = setInterval(() => this.flush(), DEFAULT_CONFIG.flushInterval);
  }
  async write(entry) {
    if (!this.enabled) return;
    this.buffer.push(entry.toJSON());
    if (this.buffer.length >= DEFAULT_CONFIG.bufferSize) {
      await this.flush();
    }
  }
  async flush() {
    if (!this.enabled || this.buffer.length === 0) return;
    const entries = this.buffer.splice(0, DEFAULT_CONFIG.maxBatchSize);
    try {
      await idb.transaction(this.dbName, this.storeName, "readwrite", async (store) => {
        for (const entry of entries) {
          await store.put(entry);
        }
      });
      await this._enforceRetention();
    } catch (e) {
      console.error("[Logger] IndexedDB flush failed:", e);
      this.buffer.unshift(...entries);
    }
  }
  async _enforceRetention() {
    try {
      const cutoff = Date.now() - DEFAULT_CONFIG.retentionDays * 24 * 60 * 60 * 1e3;
      await idb.transaction(this.dbName, this.storeName, "readwrite", async (store) => {
        const index = store.index("timestamp");
        let cursor = await index.openCursor(IDBKeyRange.upperBound(cutoff));
        while (cursor) {
          await cursor.delete();
          cursor = await cursor.continue();
        }
      });
      const count = await idb.count(this.dbName, this.storeName);
      if (count > 1e4) {
        await idb.transaction(this.dbName, this.storeName, "readwrite", async (store) => {
          const index = store.index("timestamp");
          let cursor = await index.openCursor();
          let deleted = 0;
          while (cursor && deleted < count * 0.3) {
            await cursor.delete();
            cursor = await cursor.continue();
            deleted++;
          }
        });
      }
    } catch (e) {
      console.error("[Logger] Retention enforcement failed:", e);
    }
  }
  async query(options = {}) {
    const { level, correlationId, startTime, endTime, limit = 100, offset = 0 } = options;
    try {
      return await idb.query(this.dbName, this.storeName, {
        index: correlationId ? "correlationId" : level ? "level" : "timestamp",
        range: correlationId ? IDBKeyRange.only(correlationId) : level ? IDBKeyRange.only(level) : startTime && endTime ? IDBKeyRange.bound(startTime, endTime) : startTime ? IDBKeyRange.lowerBound(startTime) : endTime ? IDBKeyRange.upperBound(endTime) : null,
        limit,
        offset,
        direction: "prev"
      });
    } catch (e) {
      console.error("[Logger] Query failed:", e);
      return [];
    }
  }
  async close() {
    if (this.flushTimer) clearInterval(this.flushTimer);
    await this.flush();
    this.enabled = false;
  }
}
class RemoteTransport extends Transport {
  constructor(options = {}) {
    super("remote", options);
    this.buffer = [];
    this.endpoint = options.endpoint || DEFAULT_CONFIG.remoteEndpoint;
    this.apiKey = options.apiKey || DEFAULT_CONFIG.remoteApiKey;
    this.batchSize = options.batchSize || DEFAULT_CONFIG.maxBatchSize;
    this.flushTimer = null;
    if (this.endpoint) this._startFlushTimer();
  }
  _startFlushTimer() {
    this.flushTimer = setInterval(() => this.flush(), DEFAULT_CONFIG.flushInterval);
  }
  async write(entry) {
    if (!this.enabled || !this.endpoint) return;
    this.buffer.push(entry.toJSON());
    if (this.buffer.length >= this.batchSize) {
      await this.flush();
    }
  }
  async flush() {
    if (!this.enabled || !this.endpoint || this.buffer.length === 0) return;
    const entries = this.buffer.splice(0, this.batchSize);
    try {
      await fetch(this.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
          "X-Service-Name": DEFAULT_CONFIG.serviceName
        },
        body: JSON.stringify({ logs: entries })
      });
    } catch (e) {
      console.error("[Logger] Remote flush failed:", e);
      this.buffer.unshift(...entries);
    }
  }
  async close() {
    if (this.flushTimer) clearInterval(this.flushTimer);
    await this.flush();
    this.enabled = false;
  }
}
class EventBusTransport extends Transport {
  constructor(options = {}) {
    super("eventbus", options);
    this.streamEnabled = true;
  }
  async write(entry) {
    if (!this.enabled || !this.streamEnabled) return;
    bus.emit("log:entry", entry.toJSON());
  }
  setStreaming(enabled) {
    this.streamEnabled = enabled;
  }
}
class Logger {
  constructor(name, options = {}) {
    this.name = name;
    this.options = { ...DEFAULT_CONFIG, ...options };
    this.level = this.options.level;
    this.transports = [];
    this.childLoggers = /* @__PURE__ */ new Map();
    this.context = {};
    this._initTransports();
    this._setupEventListeners();
  }
  _initTransports() {
    if (this.options.enableConsole) {
      this.transports.push(new ConsoleTransport(this.options));
    }
    if (this.options.enableIndexedDB) {
      this.transports.push(new IndexedDBTransport(this.options));
    }
    if (this.options.enableRemote && this.options.remoteEndpoint) {
      this.transports.push(new RemoteTransport(this.options));
    }
    this.eventBusTransport = new EventBusTransport(this.options);
    this.transports.push(this.eventBusTransport);
  }
  _setupEventListeners() {
    bus.on("settings:changed", ({ key, value }) => {
      if (key === "logLevel") {
        this.setLevel(value);
      }
    });
    bus.on("request:start", ({ correlationId }) => {
      this.setCorrelationId(correlationId);
    });
    bus.on("request:end", () => {
      this.clearCorrelationId();
    });
  }
  setLevel(level) {
    if (typeof level === "string") {
      level = LogLevel[level.toUpperCase()] ?? LogLevel.INFO;
    }
    this.level = level;
  }
  setCorrelationId(id) {
    this._correlationId = id;
  }
  clearCorrelationId() {
    this._correlationId = null;
  }
  child(context) {
    const key = JSON.stringify(context);
    if (!this.childLoggers.has(key)) {
      const child = new Logger(`${this.name}:${Object.keys(context).join(",")}`, this.options);
      child.context = { ...this.context, ...context };
      child._correlationId = this._correlationId;
      this.childLoggers.set(key, child);
    }
    return this.childLoggers.get(key);
  }
  withContext(context) {
    return this.child(context);
  }
  addTransport(transport) {
    this.transports.push(transport);
  }
  removeTransport(name) {
    const idx = this.transports.findIndex((t) => t.name === name);
    if (idx >= 0) {
      this.transports[idx].close();
      this.transports.splice(idx, 1);
    }
  }
  _log(level, message, context = {}, meta = {}) {
    if (level < this.level) return;
    const entry = new LogEntry(
      level,
      message,
      { ...this.context, ...context },
      { ...meta, correlationId: this._correlationId }
    );
    for (const transport of this.transports) {
      if (transport.enabled) {
        transport.write(entry).catch((e) => {
          console.error(`[Logger] Transport ${transport.name} write failed:`, e);
        });
      }
    }
    return entry;
  }
  debug(message, context, meta) {
    return this._log(LogLevel.DEBUG, message, context, meta);
  }
  info(message, context, meta) {
    return this._log(LogLevel.INFO, message, context, meta);
  }
  warn(message, context, meta) {
    return this._log(LogLevel.WARN, message, context, meta);
  }
  error(message, context, meta) {
    return this._log(LogLevel.ERROR, message, context, meta);
  }
  fatal(message, context, meta) {
    return this._log(LogLevel.FATAL, message, context, meta);
  }
  // Convenience methods
  log(message, context, meta) {
    return this.info(message, context, meta);
  }
  trace(message, context, meta) {
    return this.debug(message, context, meta);
  }
  // Structured logging helpers
  startTimer(label) {
    const start = performance.now();
    return {
      end: (context = {}, meta = {}) => {
        const duration = performance.now() - start;
        this.debug(`${label} completed`, { ...context, duration: `${duration.toFixed(2)}ms` }, meta);
        return duration;
      }
    };
  }
  measureAsync(label, fn, context = {}, meta = {}) {
    const timer = this.startTimer(label);
    return Promise.resolve(fn()).then(
      (result) => {
        timer.end({ ...context, success: true }, meta);
        return result;
      },
      (error) => {
        timer.end({ ...context, success: false, error: error.message }, meta);
        throw error;
      }
    );
  }
  // Query methods
  async query(options = {}) {
    const idbTransport = this.transports.find((t) => t instanceof IndexedDBTransport);
    if (idbTransport) {
      return idbTransport.query(options);
    }
    return [];
  }
  async exportLogs(format = "json", options = {}) {
    const logs = await this.query({ limit: 1e4, ...options });
    if (format === "json") {
      return JSON.stringify(logs, null, 2);
    } else if (format === "csv") {
      return this._logsToCSV(logs);
    }
    return logs;
  }
  _logsToCSV(logs) {
    if (logs.length === 0) return "";
    const headers = ["timestamp", "level", "message", "correlationId", "sessionId"];
    const rows = logs.map((log2) => [
      new Date(log2.timestamp).toISOString(),
      log2.level,
      `"${log2.message.replace(/"/g, '""')}"`,
      log2.correlationId,
      log2.sessionId
    ]);
    return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  }
  // Lifecycle
  async flush() {
    await Promise.all(this.transports.map((t) => t.flush()));
  }
  async destroy() {
    for (const transport of this.transports) {
      await transport.close();
    }
    this.transports = [];
    this.childLoggers.clear();
  }
  // Static factory
  static create(name, options) {
    return new Logger(name, options);
  }
  static getLevel(name) {
    return LogLevel[name.toUpperCase()] ?? LogLevel.INFO;
  }
}
const loggers = /* @__PURE__ */ new Map();
let defaultOptions = { ...DEFAULT_CONFIG };
const log = {
  getLogger: (name, options) => {
    if (!loggers.has(name)) {
      loggers.set(name, new Logger(name, { ...defaultOptions, ...options }));
    }
    return loggers.get(name);
  },
  configure: (options) => {
    defaultOptions = { ...defaultOptions, ...options };
    for (const logger of loggers.values()) {
      logger.options = { ...logger.options, ...options };
      if (options.level !== void 0) logger.setLevel(options.level);
    }
  },
  setLevel: (level) => {
    defaultOptions.level = typeof level === "string" ? LogLevel[level.toUpperCase()] : level;
    for (const logger of loggers.values()) {
      logger.setLevel(defaultOptions.level);
    }
  },
  flushAll: async () => {
    await Promise.all([...loggers.values()].map((l) => l.flush()));
  },
  destroyAll: async () => {
    await Promise.all([...loggers.values()].map((l) => l.destroy()));
    loggers.clear();
  },
  getAllLoggers: () => Array.from(loggers.keys()),
  // Quick access to root logger
  root: null
};
log.root = log.getLogger("root");
const metricsLogger = log.getLogger("metrics");
const MetricType = {
  COUNTER: "counter",
  GAUGE: "gauge",
  HISTOGRAM: "histogram",
  TIMER: "timer"
};
const MetricUnit = {
  MS: "ms",
  BYTES: "bytes",
  COUNT: "count",
  PERCENT: "%",
  FPS: "fps",
  KB: "kb",
  MB: "mb"
};
class Metric {
  constructor(name, type, options = {}) {
    this.name = name;
    this.type = type;
    this.unit = options.unit || MetricUnit.COUNT;
    this.description = options.description || "";
    this.labels = options.labels || {};
    this.value = 0;
    this.sum = 0;
    this.count = 0;
    this.min = Infinity;
    this.max = -Infinity;
    this.buckets = options.buckets || [
      5,
      10,
      25,
      50,
      100,
      250,
      500,
      1e3,
      2500,
      5e3,
      1e4
    ];
    this.bucketCounts = new Array(this.buckets.length + 1).fill(0);
    this.samples = options.maxSamples ? [] : null;
    this.maxSamples = options.maxSamples || 1e3;
    this.createdAt = Date.now();
    this.updatedAt = Date.now();
  }
  observe(value, labels = {}) {
    this.updatedAt = Date.now();
    switch (this.type) {
      case MetricType.COUNTER:
        this.value += value;
        break;
      case MetricType.GAUGE:
        this.value = value;
        break;
      case MetricType.HISTOGRAM:
      case MetricType.TIMER:
        this._recordHistogram(value);
        break;
    }
    if (this.samples !== null) {
      this.samples.push({ value, labels, timestamp: Date.now() });
      if (this.samples.length > this.maxSamples) {
        this.samples.shift();
      }
    }
    return this;
  }
  _recordHistogram(value) {
    this.sum += value;
    this.count++;
    this.min = Math.min(this.min, value);
    this.max = Math.max(this.max, value);
    this.value = this.sum / this.count;
    let bucketIndex = this.buckets.findIndex((b) => value <= b);
    if (bucketIndex === -1) bucketIndex = this.buckets.length;
    this.bucketCounts[bucketIndex]++;
  }
  increment(labels = {}) {
    return this.observe(1, labels);
  }
  decrement(labels = {}) {
    return this.observe(-1, labels);
  }
  set(value, labels = {}) {
    return this.observe(value, labels);
  }
  startTimer() {
    const start = performance.now();
    return {
      stop: (labels = {}) => {
        const duration = performance.now() - start;
        this.observe(duration, labels);
        return duration;
      }
    };
  }
  getSnapshot() {
    const snapshot = {
      name: this.name,
      type: this.type,
      unit: this.unit,
      description: this.description,
      labels: this.labels,
      value: this.value,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
    if (this.type === MetricType.HISTOGRAM || this.type === MetricType.TIMER) {
      snapshot.sum = this.sum;
      snapshot.count = this.count;
      snapshot.min = this.min === Infinity ? 0 : this.min;
      snapshot.max = this.max === -Infinity ? 0 : this.max;
      snapshot.buckets = this.buckets.map((le, i) => ({ le, count: this.bucketCounts[i] }));
      snapshot.bucketInf = { le: "+Inf", count: this.bucketCounts[this.buckets.length] };
    }
    if (this.samples) {
      snapshot.samples = this.samples.slice(-100);
    }
    return snapshot;
  }
  reset() {
    this.value = 0;
    this.sum = 0;
    this.count = 0;
    this.min = Infinity;
    this.max = -Infinity;
    this.bucketCounts.fill(0);
    if (this.samples) this.samples = [];
    this.updatedAt = Date.now();
  }
}
class MetricsRegistry {
  constructor() {
    this.metrics = /* @__PURE__ */ new Map();
    this.collectors = /* @__PURE__ */ new Set();
    this.defaultLabels = {
      service: "retrowayos",
      environment: "production"
    };
  }
  createCounter(name, options = {}) {
    return this._register(name, MetricType.COUNTER, options);
  }
  createGauge(name, options = {}) {
    return this._register(name, MetricType.GAUGE, options);
  }
  createHistogram(name, options = {}) {
    return this._register(name, MetricType.HISTOGRAM, options);
  }
  createTimer(name, options = {}) {
    return this._register(name, MetricType.TIMER, { ...options, unit: MetricUnit.MS });
  }
  _register(name, type, options) {
    const fullName = this._getFullName(name);
    if (this.metrics.has(fullName)) {
      return this.metrics.get(fullName);
    }
    const metric = new Metric(fullName, type, {
      ...options,
      labels: { ...this.defaultLabels, ...options.labels }
    });
    this.metrics.set(fullName, metric);
    metricsLogger.debug("Metric registered", { name: fullName, type });
    return metric;
  }
  _getFullName(name) {
    return name;
  }
  get(name) {
    return this.metrics.get(name);
  }
  getAll() {
    return Array.from(this.metrics.values());
  }
  getSnapshots() {
    return this.getAll().map((m) => m.getSnapshot());
  }
  registerCollector(collector) {
    this.collectors.add(collector);
  }
  unregisterCollector(collector) {
    this.collectors.delete(collector);
  }
  async collect() {
    const results = [];
    for (const collector of this.collectors) {
      try {
        const metrics = await collector.collect();
        results.push(...metrics);
      } catch (e) {
        metricsLogger.error("Collector error", { collector: collector.constructor.name, error: e.message });
      }
    }
    return results;
  }
  clear() {
    this.metrics.clear();
  }
  setDefaultLabels(labels) {
    this.defaultLabels = { ...this.defaultLabels, ...labels };
  }
}
class PerformanceCollector {
  constructor() {
    this.observer = null;
    this.navigationTiming = null;
    this.resourceTimings = [];
    this.longTasks = [];
    this.paintTimings = [];
    this._initObservers();
  }
  _initObservers() {
    var _a, _b, _c, _d, _e, _f;
    if (performance.timing) {
      this.navigationTiming = performance.timing;
    }
    if ((_a = PerformanceObserver.supportedEntryTypes) == null ? void 0 : _a.includes("resource")) {
      const resourceObserver = new PerformanceObserver((list) => {
        this.resourceTimings.push(...list.getEntries());
        if (this.resourceTimings.length > 1e3) {
          this.resourceTimings = this.resourceTimings.slice(-500);
        }
      });
      resourceObserver.observe({ type: "resource", buffered: true });
    }
    if ((_b = PerformanceObserver.supportedEntryTypes) == null ? void 0 : _b.includes("longtask")) {
      const longTaskObserver = new PerformanceObserver((list) => {
        this.longTasks.push(...list.getEntries());
        if (this.longTasks.length > 100) {
          this.longTasks = this.longTasks.slice(-50);
        }
      });
      longTaskObserver.observe({ type: "longtask", buffered: true });
    }
    if ((_c = PerformanceObserver.supportedEntryTypes) == null ? void 0 : _c.includes("paint")) {
      const paintObserver = new PerformanceObserver((list) => {
        this.paintTimings.push(...list.getEntries());
      });
      paintObserver.observe({ type: "paint", buffered: true });
    }
    if ((_d = PerformanceObserver.supportedEntryTypes) == null ? void 0 : _d.includes("layout-shift")) {
      this.clsValue = 0;
      this.clsEntries = [];
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            this.clsValue += entry.value;
            this.clsEntries.push(entry);
          }
        }
      });
      clsObserver.observe({ type: "layout-shift", buffered: true });
    }
    if ((_e = PerformanceObserver.supportedEntryTypes) == null ? void 0 : _e.includes("first-input")) {
      const fidObserver = new PerformanceObserver((list) => {
        this.fidEntry = list.getEntries()[0];
      });
      fidObserver.observe({ type: "first-input", buffered: true });
    }
    if ((_f = PerformanceObserver.supportedEntryTypes) == null ? void 0 : _f.includes("largest-contentful-paint")) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        this.lcpEntry = entries[entries.length - 1];
      });
      lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
    }
  }
  async collect() {
    const metrics = [];
    const mem = performance.memory;
    const now = Date.now();
    if (mem) {
      metrics.push({
        name: "memory.js.heap.used",
        type: MetricType.GAUGE,
        unit: MetricUnit.BYTES,
        value: mem.usedJSHeapSize,
        timestamp: now
      });
      metrics.push({
        name: "memory.js.heap.total",
        type: MetricType.GAUGE,
        unit: MetricUnit.BYTES,
        value: mem.totalJSHeapSize,
        timestamp: now
      });
      metrics.push({
        name: "memory.js.heap.limit",
        type: MetricType.GAUGE,
        unit: MetricUnit.BYTES,
        value: mem.jsHeapSizeLimit,
        timestamp: now
      });
    }
    metrics.push({
      name: "dom.nodes.count",
      type: MetricType.GAUGE,
      unit: MetricUnit.COUNT,
      value: document.getElementsByTagName("*").length,
      timestamp: now
    });
    if (this.navigationTiming) {
      const nt = this.navigationTiming;
      metrics.push({
        name: "webvital.ttfb",
        type: MetricType.TIMER,
        unit: MetricUnit.MS,
        value: nt.responseStart - nt.navigationStart,
        timestamp: now
      });
      metrics.push({
        name: "webvital.domContentLoaded",
        type: MetricType.TIMER,
        unit: MetricUnit.MS,
        value: nt.domContentLoadedEventEnd - nt.navigationStart,
        timestamp: now
      });
      metrics.push({
        name: "webvital.loadComplete",
        type: MetricType.TIMER,
        unit: MetricUnit.MS,
        value: nt.loadEventEnd - nt.navigationStart,
        timestamp: now
      });
    }
    for (const entry of this.paintTimings) {
      metrics.push({
        name: `webvital.${entry.name.replace("-", ".")}`,
        type: MetricType.TIMER,
        unit: MetricUnit.MS,
        value: entry.startTime,
        timestamp: now
      });
    }
    if (this.lcpEntry) {
      metrics.push({
        name: "webvital.lcp",
        type: MetricType.TIMER,
        unit: MetricUnit.MS,
        value: this.lcpEntry.startTime,
        timestamp: now
      });
    }
    if (this.fidEntry) {
      metrics.push({
        name: "webvital.fid",
        type: MetricType.TIMER,
        unit: MetricUnit.MS,
        value: this.fidEntry.processingStart - this.fidEntry.startTime,
        timestamp: now
      });
    }
    if (this.clsValue !== void 0) {
      metrics.push({
        name: "webvital.cls",
        type: MetricType.GAUGE,
        unit: MetricUnit.COUNT,
        value: this.clsValue,
        timestamp: now
      });
    }
    if (this.longTasks.length > 0) {
      metrics.push({
        name: "performance.longTasks.count",
        type: MetricType.COUNTER,
        unit: MetricUnit.COUNT,
        value: this.longTasks.length,
        timestamp: now
      });
      metrics.push({
        name: "performance.longTasks.maxDuration",
        type: MetricType.GAUGE,
        unit: MetricUnit.MS,
        value: Math.max(...this.longTasks.map((t) => t.duration)),
        timestamp: now
      });
    }
    return metrics;
  }
}
class FPSCounter {
  constructor() {
    this.frames = [];
    this.lastTime = performance.now();
    this.running = false;
    this.callback = null;
  }
  start(callback) {
    this.callback = callback;
    this.running = true;
    this._tick();
  }
  stop() {
    this.running = false;
    this.callback = null;
  }
  _tick() {
    if (!this.running) return;
    const now = performance.now();
    const delta = now - this.lastTime;
    this.lastTime = now;
    this.frames.push({ time: now, delta });
    if (this.frames.length > 120) this.frames.shift();
    const fps = this._calculateFPS();
    if (this.callback) this.callback(fps, delta);
    requestAnimationFrame(() => this._tick());
  }
  _calculateFPS() {
    const now = performance.now();
    const recentFrames = this.frames.filter((f) => now - f.time < 1e3);
    return recentFrames.length;
  }
  getFPS() {
    return this._calculateFPS();
  }
  getFrameTime() {
    const recent = this.frames.slice(-10);
    if (recent.length < 2) return 16.67;
    const avgDelta = recent.reduce((sum, f) => sum + f.delta, 0) / recent.length;
    return avgDelta;
  }
}
class MemoryProfiler {
  constructor() {
    this.snapshots = [];
    this.maxSnapshots = 50;
    this.gcObservers = [];
  }
  takeSnapshot(label = "") {
    if (!performance.memory) return null;
    const snapshot = {
      label,
      timestamp: Date.now(),
      usedJSHeapSize: performance.memory.usedJSHeapSize,
      totalJSHeapSize: performance.memory.totalJSHeapSize,
      jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
      domNodes: document.getElementsByTagName("*").length,
      eventListeners: this._countEventListeners()
    };
    this.snapshots.push(snapshot);
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }
    metricsLogger.debug("Memory snapshot taken", snapshot);
    return snapshot;
  }
  _countEventListeners() {
    var _a;
    let count = 0;
    const elements = document.querySelectorAll("*");
    for (const el of elements) {
      count += ((_a = el._listeners) == null ? void 0 : _a.size) || 0;
    }
    return count;
  }
  compareSnapshots(index1, index2) {
    const s1 = this.snapshots[index1];
    const s2 = this.snapshots[index2];
    if (!s1 || !s2) return null;
    return {
      heapDelta: s2.usedJSHeapSize - s1.usedJSHeapSize,
      heapDeltaPercent: (s2.usedJSHeapSize - s1.usedJSHeapSize) / s1.usedJSHeapSize * 100,
      domDelta: s2.domNodes - s1.domNodes,
      timeDelta: s2.timestamp - s1.timestamp,
      leakSuspected: s2.usedJSHeapSize - s1.usedJSHeapSize > 1024 * 1024
      // > 1MB growth
    };
  }
  detectLeaks() {
    if (this.snapshots.length < 5) return [];
    const leaks = [];
    for (let i = 1; i < this.snapshots.length; i++) {
      const comparison = this.compareSnapshots(i - 1, i);
      if (comparison && comparison.leakSuspected) {
        leaks.push({
          snapshot: this.snapshots[i],
          comparison
        });
      }
    }
    return leaks;
  }
  getSnapshots() {
    return [...this.snapshots];
  }
  clear() {
    this.snapshots = [];
  }
}
class ResourceAnalyzer {
  constructor() {
    this.resources = [];
    this.maxResources = 500;
  }
  analyze() {
    if (!performance.getEntriesByType) return [];
    const entries = performance.getEntriesByType("resource");
    this.resources = entries.slice(-this.maxResources);
    return this.resources.map((r) => ({
      name: r.name,
      type: r.initiatorType,
      duration: r.duration,
      size: r.transferSize || r.encodedBodySize || 0,
      cached: r.transferSize === 0 && (r.encodedBodySize || 0) > 0,
      startTime: r.startTime,
      dns: r.domainLookupEnd - r.domainLookupStart,
      tcp: r.connectEnd - r.connectStart,
      tls: r.secureConnectionStart ? r.connectEnd - r.secureConnectionStart : 0,
      ttfb: r.responseStart - r.requestStart,
      download: r.responseEnd - r.responseStart
    }));
  }
  getSlowResources(threshold = 1e3) {
    return this.analyze().filter((r) => r.duration > threshold);
  }
  getUncachedResources() {
    return this.analyze().filter((r) => !r.cached);
  }
  getTotalSize() {
    return this.analyze().reduce((sum, r) => sum + r.size, 0);
  }
  getByType(type) {
    return this.analyze().filter((r) => r.type === type);
  }
}
class AlertManager {
  constructor() {
    this.alerts = [];
    this.rules = /* @__PURE__ */ new Map();
    this.handlers = [];
    this.checkInterval = 1e4;
    this.timer = null;
  }
  addRule(name, rule) {
    this.rules.set(name, {
      ...rule,
      name,
      enabled: true,
      lastTriggered: null,
      cooldown: rule.cooldown || 6e4
    });
  }
  removeRule(name) {
    this.rules.delete(name);
  }
  addHandler(handler) {
    this.handlers.push(handler);
  }
  start() {
    if (this.timer) return;
    this.timer = setInterval(() => this._checkRules(), this.checkInterval);
    metricsLogger.info("Alert manager started");
  }
  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }
  _checkRules() {
    const snapshots = registry.getSnapshots();
    const metricsMap = new Map(snapshots.map((s) => [s.name, s]));
    for (const [name, rule] of this.rules) {
      if (!rule.enabled) continue;
      const metric = metricsMap.get(rule.metric);
      if (!metric) continue;
      const shouldTrigger = this._evaluateCondition(metric, rule.condition);
      const cooldownPassed = !rule.lastTriggered || Date.now() - rule.lastTriggered > rule.cooldown;
      if (shouldTrigger && cooldownPassed) {
        this._triggerAlert(name, rule, metric);
      }
    }
  }
  _evaluateCondition(metric, condition) {
    const value = metric.value;
    switch (condition.operator) {
      case "gt":
        return value > condition.threshold;
      case "gte":
        return value >= condition.threshold;
      case "lt":
        return value < condition.threshold;
      case "lte":
        return value <= condition.threshold;
      case "eq":
        return value === condition.threshold;
      case "neq":
        return value !== condition.threshold;
      default:
        return false;
    }
  }
  _triggerAlert(name, rule, metric) {
    const alert = {
      id: crypto.uuid ? crypto.uuid() : Math.random().toString(36).substring(7),
      rule: name,
      metric: rule.metric,
      value: metric.value,
      threshold: rule.condition.threshold,
      operator: rule.condition.operator,
      severity: rule.severity || "warning",
      message: rule.message || `Alert: ${rule.metric} ${rule.condition.operator} ${rule.condition.threshold}`,
      timestamp: Date.now()
    };
    this.alerts.push(alert);
    if (this.alerts.length > 1e3) this.alerts.shift();
    rule.lastTriggered = Date.now();
    for (const handler of this.handlers) {
      try {
        handler(alert);
      } catch (e) {
        metricsLogger.error("Alert handler error", { error: e.message });
      }
    }
    bus.emit("alert:triggered", alert);
    metricsLogger.warn("Alert triggered", alert);
  }
  getAlerts(filter = {}) {
    let results = [...this.alerts];
    if (filter.severity) results = results.filter((a) => a.severity === filter.severity);
    if (filter.since) results = results.filter((a) => a.timestamp > filter.since);
    if (filter.limit) results = results.slice(-filter.limit);
    return results.sort((a, b) => b.timestamp - a.timestamp);
  }
  clearAlerts() {
    this.alerts = [];
  }
}
const registry = new MetricsRegistry();
const performanceCollector = new PerformanceCollector();
const fpsCounter = new FPSCounter();
const memoryProfiler = new MemoryProfiler();
const resourceAnalyzer = new ResourceAnalyzer();
const alertManager = new AlertManager();
registry.registerCollector(performanceCollector);
const Metrics = {
  MetricType,
  MetricUnit,
  registry,
  performanceCollector,
  fpsCounter,
  memoryProfiler,
  resourceAnalyzer,
  alertManager,
  // Convenience methods
  counter: (name, options) => registry.createCounter(name, options),
  gauge: (name, options) => registry.createGauge(name, options),
  histogram: (name, options) => registry.createHistogram(name, options),
  timer: (name, options) => registry.createTimer(name, options),
  getSnapshot: () => registry.getSnapshots(),
  collect: () => registry.collect(),
  startFPS: (callback) => fpsCounter.start(callback),
  stopFPS: () => fpsCounter.stop(),
  snapshotMemory: (label) => memoryProfiler.takeSnapshot(label),
  detectMemoryLeaks: () => memoryProfiler.detectLeaks(),
  analyzeResources: () => resourceAnalyzer.analyze(),
  getSlowResources: (threshold) => resourceAnalyzer.getSlowResources(threshold),
  addAlertRule: (name, rule) => alertManager.addRule(name, rule),
  onAlert: (handler) => alertManager.addHandler(handler),
  startAlerts: () => alertManager.start(),
  stopAlerts: () => alertManager.stop(),
  logger: metricsLogger
};
export {
  AlertManager,
  FPSCounter,
  MemoryProfiler,
  Metric,
  MetricType,
  MetricUnit,
  Metrics,
  MetricsRegistry,
  PerformanceCollector,
  ResourceAnalyzer,
  Metrics as default
};
