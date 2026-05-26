import Chunk from '../models/Chunk.js'

/**
 * Vector Service
 * Manages vector embeddings using MongoDB Atlas Vector Search.
 */
class VectorService {
  constructor() {
    this.initialized = true
  }

  /**
   * Check if Vector DB is available
   * Since we use MongoDB, it is always available if the app is running.
   */
  async isAvailable() {
    return true
  }

  /**
   * Add documents with embeddings to a collection (grouped by collectionName)
   */
  async addDocuments(collectionName, documents, embeddings, metadatas = [], ids = []) {
    // Filter out any entries where embedding is null
    const validIndices = embeddings.reduce((acc, emb, i) => {
      if (emb !== null) acc.push(i)
      return acc
    }, [])

    const chunksToInsert = validIndices.map(i => ({
      collectionName: collectionName,
      chunk_id: ids[i] || `doc_${i}`,
      content: documents[i],
      embedding: embeddings[i],
      metadata: metadatas[i] || { chunk_index: i },
    }))

    if (chunksToInsert.length === 0) {
      console.warn('⚠️ No valid documents to add to Vector Search')
      return
    }

    try {
      await Chunk.insertMany(chunksToInsert)
      console.log(`📦 Added ${chunksToInsert.length} documents to vector collection '${collectionName}'`)
    } catch (error) {
      throw new Error(`Failed to add documents to MongoDB Vector Search: ${error.message}`)
    }
  }

  /**
   * Query relevant documents using MongoDB Atlas Vector Search
   */
  async queryRelevant(collectionName, queryEmbedding, topK = 5, where = null) {
    try {
      // Build the filter
      const filter = { collectionName }
      if (where) {
        Object.assign(filter, where)
      }

      // Execute $vectorSearch
      const results = await Chunk.aggregate([
        {
          $vectorSearch: {
            index: 'vector_index',
            path: 'embedding',
            queryVector: queryEmbedding,
            numCandidates: Math.max(topK * 10, 100),
            limit: topK,
            filter: {
              collectionName: collectionName,
            }
          }
        },
        {
          $project: {
            _id: 0,
            content: 1,
            metadata: 1,
            score: { $meta: 'vectorSearchScore' }
          }
        }
      ])

      if (!results || results.length === 0) {
        return []
      }

      return results.map(doc => ({
        content: doc.content,
        metadata: doc.metadata || {},
        distance: 1 - doc.score // converting cosine similarity score to distance proxy
      }))
    } catch (error) {
      console.error('❌ Vector Query failed:', error.message)
      return []
    }
  }

  /**
   * Delete a collection (all chunks with that collectionName)
   */
  async deleteCollection(collectionName) {
    if (!collectionName) return

    try {
      await Chunk.deleteMany({ collectionName })
      console.log(`🗑️ Deleted vector collection '${collectionName}' from MongoDB`)
    } catch (error) {
      console.error(`❌ Failed to delete vector collection '${collectionName}':`, error.message)
    }
  }
}

export default new VectorService()
