import axios from 'axios'

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models'
const EMBEDDING_MODEL = 'text-embedding-004'

/**
 * Embedding Service
 * Generates vector embeddings using Gemini API.
 */
class EmbeddingService {
  constructor() {
    this.apiUrl = GEMINI_API_URL
    this.model = EMBEDDING_MODEL
    this.cache = new Map() // in-memory cache for embeddings
  }

  get apiKey() {
    return (process.env.GEMINI_API_KEY || '').trim();
  }

  /**
   * Generate embedding for a single text
   */
  async generateEmbedding(text) {
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty')
    }

    // Check cache
    const cacheKey = this._hashText(text)
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    try {
      const response = await axios.post(
        `${this.apiUrl}/${this.model}:embedContent?key=${this.apiKey}`,
        {
          model: `models/${this.model}`,
          content: {
            parts: [{ text: text }]
          }
        }
      )

      if (!response.data || !response.data.embedding || !response.data.embedding.values) {
        throw new Error('No embeddings returned from Gemini')
      }

      const embedding = response.data.embedding.values

      // Cache the result
      this.cache.set(cacheKey, embedding)

      return embedding
    } catch (error) {
      throw new Error(`Embedding generation failed: ${error.response?.data?.error?.message || error.message}`)
    }
  }

  /**
   * Generate embeddings for multiple texts (batch)
   */
  async generateEmbeddings(texts) {
    if (!texts || texts.length === 0) {
      return []
    }

    console.log(`🔮 Generating embeddings for ${texts.length} chunks...`)

    const embeddings = []

    // Process in batches of 10 to avoid overwhelming Ollama
    const batchSize = 10
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize)
      const batchPromises = batch.map(text => this.generateEmbedding(text))

      try {
        const batchResults = await Promise.all(batchPromises)
        embeddings.push(...batchResults)
        console.log(`  ✅ Embedded ${Math.min(i + batchSize, texts.length)}/${texts.length} chunks`)
      } catch (error) {
        console.error(`  ❌ Batch ${i}-${i + batchSize} failed:`, error.message)
        // Push null for failed embeddings
        for (let j = 0; j < batch.length; j++) {
          embeddings.push(null)
        }
      }
    }

    return embeddings
  }

  /**
   * Check if the embedding model is available
   */
  async isModelAvailable() {
    return !!this.apiKey
  }

  /**
   * Simple hash for caching
   */
  _hashText(text) {
    let hash = 0
    const str = text.substring(0, 200) // Use first 200 chars for hash
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return `${hash}_${text.length}`
  }

  /**
   * Clear the in-memory cache
   */
  clearCache() {
    this.cache.clear()
  }
}

export default new EmbeddingService()
