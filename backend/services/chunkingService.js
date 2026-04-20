import { PDFParse } from 'pdf-parse'

/**
 * Chunking Service
 * Handles text extraction from files and splitting into chunks for embedding.
 */
class ChunkingService {
  constructor() {
    this.defaultChunkSize = 500
    this.defaultOverlap = 50
  }

  /**
   * Extract text from a PDF buffer
   */
  async extractTextFromPDF(buffer) {
    let parser = null
    try {
      parser = new PDFParse({ data: buffer })
      const data = await parser.getText()
      return data.text || ''
    } catch (error) {
      console.error('❌ PDF extraction error:', error.message)
      throw new Error(`Failed to extract text from PDF: ${error.message}`)
    } finally {
      if (parser) {
        await parser.destroy()
      }
    }
  }

  /**
   * Extract text from a file buffer based on mime type
   */
  async extractTextFromFile(buffer, mimeType) {
    if (mimeType === 'application/pdf') {
      return this.extractTextFromPDF(buffer)
    }

    if (mimeType === 'text/plain' || mimeType === 'text/markdown') {
      return buffer.toString('utf-8')
    }

    throw new Error(`Unsupported file type: ${mimeType}`)
  }

  /**
   * Split text into chunks using sliding window approach
   */
  chunkText(text, chunkSize = this.defaultChunkSize, overlap = this.defaultOverlap) {
    if (!text || text.trim().length === 0) {
      return []
    }

    // Clean up whitespace
    const cleanText = text.replace(/\s+/g, ' ').trim()
    const words = cleanText.split(' ')

    if (words.length <= chunkSize) {
      return [cleanText]
    }

    const chunks = []
    let start = 0

    while (start < words.length) {
      const end = Math.min(start + chunkSize, words.length)
      const chunk = words.slice(start, end).join(' ')

      if (chunk.trim().length > 0) {
        chunks.push(chunk.trim())
      }

      // Move forward by (chunkSize - overlap) words
      start += chunkSize - overlap

      // Prevent infinite loop
      if (start >= words.length) break
    }

    return chunks
  }

  /**
   * Smart chunking that tries to respect paragraph boundaries
   */
  chunkByParagraphs(text, maxChunkSize = 1500) {
    if (!text || text.trim().length === 0) {
      return []
    }

    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0)
    const chunks = []
    let currentChunk = ''

    for (const paragraph of paragraphs) {
      const trimmed = paragraph.trim().replace(/\s+/g, ' ')

      if (currentChunk.length + trimmed.length > maxChunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim())
        currentChunk = trimmed
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + trimmed
      }
    }

    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim())
    }

    // If any chunk is still too large, split it further
    const finalChunks = []
    for (const chunk of chunks) {
      if (chunk.length > maxChunkSize * 1.5) {
        finalChunks.push(...this.chunkText(chunk))
      } else {
        finalChunks.push(chunk)
      }
    }

    return finalChunks
  }
}

export default new ChunkingService()
