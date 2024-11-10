const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const createCache = <T>() => {
    /* eslint-disable-next-line padded-blocks */
  const cache = new Map<string, { data: T; timestamp: number }>();
  
  return {
    get: (key: string) => {
      const item = cache.get(key);
      if (!item) return null;
      if (Date.now() - item.timestamp > CACHE_DURATION) {
        cache.delete(key);
        return null;
      }
      return item.data;
    },
     /* eslint-disable-next-line padded-blocks */
    set: (key: string, data: T) => {
      cache.set(key, { data, timestamp: Date.now() });
    }
  };
}; 