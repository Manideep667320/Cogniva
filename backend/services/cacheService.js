/**
 * Cache Service
 * Simple in-memory LRU cache with TTL support.
 * Used to cache skill trees, embeddings, and frequent LLM queries.
 */
class CacheService {
  constructor(maxSize = 500) {
    this.cache = new Map()
    this.maxSize = maxSize
    this.hits = 0
    this.misses = 0
  }

  /**
   * Get a value from cache
   * @returns {any|null} cached value or null if not found/expired
   */
  get(key) {
    const entry = this.cache.get(key)
    if (!entry) {
      this.misses++
      return null
    }

    // Check TTL
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      this.misses++
      return null
    }

    this.hits++

    // Move to end for LRU behavior
    this.cache.delete(key)
    this.cache.set(key, entry)

    return entry.value
  }

  /**
   * Set a value in cache
   * @param {string} key
   * @param {any} value
   * @param {number} ttlMs - Time to live in milliseconds (0 = no expiry)
   */
  set(key, value, ttlMs = 300000) {
    // Enforce max size — evict oldest entries
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }

    this.cache.set(key, {
      value,
      expiresAt: ttlMs > 0 ? Date.now() + ttlMs : null,
      createdAt: Date.now(),
    })
  }

  /**
   * Check if key exists and is not expired
   */
  has(key) {
    const entry = this.cache.get(key)
    if (!entry) return false
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return false
    }
    return true
  }

  /**
   * Invalidate entries matching a pattern
   * @param {string} pattern - prefix to match against keys
   */
  invalidate(pattern) {
    let count = 0
    for (const key of this.cache.keys()) {
      if (key.startsWith(pattern)) {
        this.cache.delete(key)
        count++
      }
    }
    return count
  }

  /**
   * Delete a specific key
   */
  delete(key) {
    return this.cache.delete(key)
  }

  /**
   * Clear entire cache
   */
  clear() {
    this.cache.clear()
    this.hits = 0
    this.misses = 0
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.hits + this.misses
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? Math.round((this.hits / total) * 100) : 0,
    }
  }
}

// Singleton instances for different cache domains
export const skillTreeCache = new CacheService(100)    // TTL: 5 min default
export const embeddingCache = new CacheService(200)     // TTL: 10 min default
export const llmCache = new CacheService(150)           // TTL: 5 min default
export const profileCache = new CacheService(100)       // TTL: 2 min default

export default {
  skillTreeCache,
  embeddingCache,
  llmCache,
  profileCache,
}
