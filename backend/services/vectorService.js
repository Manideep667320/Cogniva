import { ChromaClient } from 'chromadb'

const CHROMA_HOST = process.env.CHROMA_HOST || 'localhost'
const CHROMA_PORT = parseInt(process.env.CHROMA_PORT || '8000')

/**
 * Vector Service
 * Manages ChromaDB collections for storing and querying document embeddings.
 */
class VectorService {
  constructor() {
    this.client = null
    this.initialized = false
  }

  /**
   * Initialize the ChromaDB client
   */
  async init() {
    if (this.initialized) return

    try {
      this.client = new ChromaClient({
        host: CHROMA_HOST,
        port: CHROMA_PORT,
      })
      // Test connection
      await this.client.heartbeat()
      this.initialized = true
      console.log(`✅ ChromaDB connected at ${CHROMA_HOST}:${CHROMA_PORT}`)
    } catch (error) {
      console.warn('⚠️ ChromaDB not available:', error.message)
      console.warn('   Vector search will use fallback mode (no ChromaDB)')
      this.client = null
      this.initialized = false
    }
  }

  /**
   * Check if ChromaDB is available
   */
  async isAvailable() {
    try {
      if (!this.client) {
        await this.init()
      }
      if (this.client) {
        await this.client.heartbeat()
        return true
      }
      return false
    } catch {
      this.initialized = false
      this.client = null
      return false
    }
  }

  /**
   * Create or get a collection
   */
  async getOrCreateCollection(name) {
    await this.init()
    if (!this.client) {
      throw new Error('ChromaDB is not available')
    }

    try {
      const collection = await this.client.getOrCreateCollection({
        name: name,
        metadata: { 'hnsw:space': 'cosine' },
      })
      return collection
    } catch (error) {
      throw new Error(`Failed to create collection '${name}': ${error.message}`)
    }
  }

  /**
   * Add documents with embeddings to a collection
   */
  async addDocuments(collectionName, documents, embeddings, metadatas = [], ids = []) {
    const collection = await this.getOrCreateCollection(collectionName)

    // Filter out any entries where embedding is null
    const validIndices = embeddings.reduce((acc, emb, i) => {
      if (emb !== null) acc.push(i)
      return acc
    }, [])

    const validDocs = validIndices.map(i => documents[i])
    const validEmbs = validIndices.map(i => embeddings[i])
    const validMetas = validIndices.map(i => metadatas[i] || { chunk_index: i })
    const validIds = validIndices.map(i => ids[i] || `doc_${i}`)

    if (validDocs.length === 0) {
      console.warn('⚠️ No valid documents to add to ChromaDB')
      return
    }

    try {
      await collection.add({
        ids: validIds,
        documents: validDocs,
        embeddings: validEmbs,
        metadatas: validMetas,
      })
      console.log(`📦 Added ${validDocs.length} documents to collection '${collectionName}'`)
    } catch (error) {
      throw new Error(`Failed to add documents: ${error.message}`)
    }
  }

  /**
   * Query relevant documents from a collection
   */
  async queryRelevant(collectionName, queryEmbedding, topK = 5) {
    const collection = await this.getOrCreateCollection(collectionName)

    try {
      const results = await collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: topK,
      })

      if (!results || !results.documents || results.documents.length === 0) {
        return []
      }

      // Flatten and return with metadata
      const documents = results.documents[0] || []
      const metadatas = results.metadatas?.[0] || []
      const distances = results.distances?.[0] || []

      return documents.map((doc, i) => ({
        content: doc,
        metadata: metadatas[i] || {},
        distance: distances[i] || 0,
      }))
    } catch (error) {
      console.error('❌ Query failed:', error.message)
      return []
    }
  }

  /**
   * Delete a collection
   */
  async deleteCollection(name) {
    await this.init()
    if (!this.client) return

    try {
      await this.client.deleteCollection({ name })
      console.log(`🗑️ Deleted collection '${name}'`)
    } catch (error) {
      console.warn(`⚠️ Failed to delete collection '${name}':`, error.message)
    }
  }

  /**
   * Get collection info
   */
  async getCollectionInfo(name) {
    await this.init()
    if (!this.client) return null

    try {
      const collection = await this.client.getCollection({ name })
      const count = await collection.count()
      return { name, count }
    } catch {
      return null
    }
  }
}

export default new VectorService()
