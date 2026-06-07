

const DEFAULT_TTL = 300; // 5 minutes
const memoryCache = new Map();

const get = async (key) => {
  const item = memoryCache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return item.value;
};

const set = async (key, value, ttl = DEFAULT_TTL) => {
  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + ttl * 1000,
  });
};

const del = async (...keys) => {
  keys.forEach((key) => memoryCache.delete(key));
};

const delPattern = async (pattern) => {
  const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
  for (const key of memoryCache.keys()) {
    if (regex.test(key)) {
      memoryCache.delete(key);
    }
  }
};

const withCache = (key, fn, ttl = DEFAULT_TTL) => async (...args) => {
  const cached = await get(key);
  if (cached) return cached;
  const result = await fn(...args);
  await set(key, result, ttl);
  return result;
};

module.exports = { get, set, del, delPattern, withCache };
