import { logger } from './logger';

export interface CacheStore {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  invalidatePattern(prefix: string): Promise<number>;
}

interface InMemoryCacheEntry<T> {
  value: T;
  expiresAt: number | null;
}

class InMemoryCache implements CacheStore {
  private store = new Map<string, InMemoryCacheEntry<unknown>>();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.store.set(key, { value, expiresAt });

    // Simple LRU-style cleanup if map exceeds 5000 items
    if (this.store.size > 5000) {
      const firstKey = this.store.keys().next().value;
      if (firstKey) this.store.delete(firstKey);
    }
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async invalidatePattern(prefix: string): Promise<number> {
    let deletedCount = 0;
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
        deletedCount++;
      }
    }
    return deletedCount;
  }
}

class RedisCache implements CacheStore {
  private inMemoryFallback = new InMemoryCache();

  constructor(
    private url: string,
    private token?: string
  ) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      // If Upstash REST API
      if (this.url.startsWith('https://') && this.token) {
        const res = await fetch(`${this.url}/get/${encodeURIComponent(key)}`, {
          headers: { Authorization: `Bearer ${this.token}` },
        });
        if (!res.ok) return this.inMemoryFallback.get<T>(key);
        const data = (await res.json()) as { result: string | null };
        if (!data.result) return null;
        return JSON.parse(data.result) as T;
      }

      return this.inMemoryFallback.get<T>(key);
    } catch {
      return this.inMemoryFallback.get<T>(key);
    }
  }

  async set<T>(key: string, value: T, ttlSeconds = 300): Promise<void> {
    try {
      if (this.url.startsWith('https://') && this.token) {
        const payload = JSON.stringify(value);
        await fetch(`${this.url}/set/${encodeURIComponent(key)}?ex=${ttlSeconds}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${this.token}` },
          body: payload,
        });
        return;
      }

      await this.inMemoryFallback.set(key, value, ttlSeconds);
    } catch {
      await this.inMemoryFallback.set(key, value, ttlSeconds);
    }
  }

  async del(key: string): Promise<void> {
    try {
      if (this.url.startsWith('https://') && this.token) {
        await fetch(`${this.url}/del/${encodeURIComponent(key)}`, {
          headers: { Authorization: `Bearer ${this.token}` },
        });
      }
      await this.inMemoryFallback.del(key);
    } catch {
      await this.inMemoryFallback.del(key);
    }
  }

  async invalidatePattern(prefix: string): Promise<number> {
    return this.inMemoryFallback.invalidatePattern(prefix);
  }
}

function initializeCache(): CacheStore {
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  const redisUrl = process.env.REDIS_URL;

  if (upstashUrl && upstashToken) {
    logger.info('Using Upstash Redis distributed cache');
    return new RedisCache(upstashUrl, upstashToken);
  }

  if (redisUrl) {
    logger.info('Using Redis cache connection');
    return new RedisCache(redisUrl);
  }

  logger.info('Using in-memory TTL cache fallback');
  return new InMemoryCache();
}

export const cache = initializeCache();

/**
 * Helper to get cached value or compute and store it.
 */
export async function getOrSetCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds = 60
): Promise<T> {
  const cached = await cache.get<T>(key);
  if (cached !== null && cached !== undefined) {
    return cached;
  }

  const fresh = await fetcher();
  await cache.set(key, fresh, ttlSeconds);
  return fresh;
}
