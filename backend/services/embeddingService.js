import axios from 'axios'

const OLLAMA_API_URL = process.env.OLLAMA_API_URL || 'http://localhost:11434'
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'nomic-embed-text'

/**
 * Embedding Service
 * Generates vector embeddings using Ollama's embed endpoint.
 */
class EmbeddingService {
  constructor() {
    this.apiUrl = OLLAMA_API_URL
    this.model = EMBEDDING_MODEL
    this.client = axios.create({
      baseURL: this.apiUrl,
      timeout: 120000, // 2 min timeout for large batches
    })
    this.cache = new Map() // in-memory cache for embeddings
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
      const response = await this.client.post('/api/embed', {
        model: this.model,
        input: text,
      })

      if (!response.data || !response.data.embeddings || response.data.embeddings.length === 0) {
        throw new Error('No embeddings returned from Ollama')
      }

      const embedding = response.data.embeddings[0]

      // Cache the result
      this.cache.set(cacheKey, embedding)

      return embedding
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Ollama service is not running. Please start Ollama and pull the nomic-embed-text model.')
      }
      throw new Error(`Embedding generation failed: ${error.message}`)
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
    try {
      const response = await this.client.get('/api/tags')
      const models = response.data?.models || []
      return models.some(m => m.name.includes(this.model))
    } catch {
      return false
    }
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
