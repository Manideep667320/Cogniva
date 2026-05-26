import { SemanticMemory } from '../models/SemanticMemory.js';
import embeddingService from './embeddingService.js';
import vectorService from './vectorService.js';
import { v4 as uuidv4 } from 'uuid';

const MEMORY_COLLECTION = 'user_semantic_memories';

class MemoryService {
  /**
   * Store a new memory for a user
   */
  async storeMemory(userId, memoryType, content, metadata = {}) {
    try {
      // 1. Generate unique embedding ID
      const embeddingId = `mem_${uuidv4()}`;

      // 2. Generate embedding for the content
      const embeddings = await embeddingService.generateEmbeddings([content]);
      if (!embeddings || embeddings.length === 0 || !embeddings[0]) {
        throw new Error('Failed to generate embedding for memory content');
      }

      const fullMetadata = {
        user_id: userId.toString(),
        memory_type: memoryType,
        ...metadata
      };

      // 3. Store in ChromaDB
      await vectorService.addDocuments(
        MEMORY_COLLECTION,
        [content],
        embeddings,
        [fullMetadata],
        [embeddingId]
      );

      // 4. Store in MongoDB for relational backup and easy standard querying
      const memory = await SemanticMemory.create({
        user_id: userId,
        memory_type: memoryType,
        content: content,
        embedding_id: embeddingId,
        metadata: fullMetadata
      });

      return memory;
    } catch (error) {
      console.error('❌ Error storing memory:', error);
      throw error;
    }
  }

  /**
   * Perform semantic search across a user's memory
   */
  async semanticSearch(userId, query, memoryType = null, topK = 5) {
    try {
      // 1. Generate query embedding
      const queryEmbeddings = await embeddingService.generateEmbeddings([query]);
      if (!queryEmbeddings || !queryEmbeddings[0]) {
        return [];
      }

      // 2. Build where filter
      let whereFilter = {
        user_id: userId.toString()
      };

      if (memoryType) {
        // If we need to filter by both user_id and memory_type in ChromaDB
        whereFilter = {
          $and: [
            { user_id: userId.toString() },
            { memory_type: memoryType }
          ]
        };
      }

      // 3. Query ChromaDB
      const results = await vectorService.queryRelevant(
        MEMORY_COLLECTION,
        queryEmbeddings[0],
        topK,
        whereFilter
      );

      return results;
    } catch (error) {
      console.error('❌ Error searching memory:', error);
      throw error;
    }
  }

  /**
   * Fetch recent memories by type (Relational DB query, not semantic)
   */
  async getRecentMemories(userId, memoryType, limit = 10) {
    try {
      const memories = await SemanticMemory.find({ user_id: userId, memory_type: memoryType })
        .sort({ created_at: -1 })
        .limit(limit);
      return memories;
    } catch (error) {
      console.error('❌ Error fetching recent memories:', error);
      throw error;
    }
  }
}

export default new MemoryService();
