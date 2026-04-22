import axios from 'axios'
import { llmCache } from './cacheService.js'

const OLLAMA_API_URL = process.env.OLLAMA_API_URL || 'http://localhost:11434'
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'phi'

export class OllamaService {
  constructor() {
    this.apiUrl = OLLAMA_API_URL
    this.model = DEFAULT_MODEL
    this.client = axios.create({
      baseURL: this.apiUrl,
      timeout: 120000, // increased for large context
    })
  }

  // Check if Ollama is running
  async isHealthy() {
    try {
      const response = await this.client.get('/api/tags')
      return response.status === 200
    } catch (error) {
      console.error('Ollama health check failed:', error.message)
      return false
    }
  }

  // Generate response from Ollama
  async generateResponse(prompt, conversationHistory = []) {
    try {
      // Build conversation context
      let context = ''
      if (conversationHistory && conversationHistory.length > 0) {
        context = conversationHistory
          .map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
          .join('\n')
        context += '\n'
      }

      const fullPrompt = context + `User: ${prompt}\nAssistant:`

      console.log(`🤖 Sending request to Ollama (${this.model})...`)

      // Check LLM cache for repeated queries
      const cacheKey = `llm:${this._hashPrompt(fullPrompt)}`
      const cached = llmCache.get(cacheKey)
      if (cached) {
        console.log('💾 LLM cache hit')
        return cached
      }

      const response = await this.client.post('/api/generate', {
        model: this.model,
        prompt: fullPrompt,
        stream: false,
        temperature: 0.7,
        top_p: 0.9,
      })

      if (!response.data || !response.data.response) {
        throw new Error('Invalid response from Ollama')
      }

      const assistantMessage = response.data.response.trim()

      console.log('✅ Response generated successfully')

      const result = {
        response: assistantMessage,
        model: this.model,
        tokens_used: response.data.eval_count || 0,
      }

      // Cache the result (5 min TTL)
      llmCache.set(cacheKey, result, 300000)

      return result
    } catch (error) {
      console.error('❌ Ollama generation error:', error.message)

      if (error.code === 'ECONNREFUSED') {
        throw new Error(
          'Ollama service is not running. Please start Ollama on http://localhost:11434'
        )
      }

      throw new Error(`Failed to generate response: ${error.message}`)
    }
  }

  /**
   * RAG-enhanced response: inject retrieved context into the prompt
   */
  async generateWithContext(userQuery, retrievedChunks = [], conversationHistory = []) {
    const contextText = retrievedChunks
      .map((chunk, i) => `[Source ${i + 1}]: ${chunk.content || chunk}`)
      .join('\n\n')

    const ragPrompt = `You are an expert AI tutor helping a student learn. Use the following reference material to answer the student's question accurately.

REFERENCE MATERIAL:
${contextText}

INSTRUCTIONS:
- Answer based ONLY on the reference material provided above
- If the material doesn't contain enough information, say so honestly
- Provide clear, structured explanations
- Include relevant examples from the material
- End with 1-2 follow-up questions the student could explore next

STUDENT'S QUESTION: ${userQuery}

ANSWER:`

    return this.generateResponse(ragPrompt, conversationHistory)
  }

  /**
   * Evaluate a student's answer and detect knowledge gaps
   */
  async evaluateAnswer(question, userAnswer, context = '') {
    const evalPrompt = `You are an expert educator evaluating a student's answer. Analyze the answer and provide feedback.

CONTEXT (study material):
${context.substring(0, 2000)}

QUESTION: ${question}

STUDENT'S ANSWER: ${userAnswer}

Evaluate the answer and return ONLY valid JSON in this exact format:
{
  "is_correct": true/false,
  "score": 0-100,
  "feedback": "Detailed feedback on the answer",
  "missing_concepts": ["concept1", "concept2"],
  "mistake_type": "missing_concept" | "partial_understanding" | "misconception" | "incomplete",
  "expected_key_points": ["point1", "point2"],
  "follow_up_question": "A question to test deeper understanding"
}

Return ONLY the JSON:`

    try {
      const result = await this.generateResponse(evalPrompt)
      const responseText = result.response

      // Parse JSON from response
      try {
        return JSON.parse(responseText)
      } catch {
        // Try extracting JSON
        const jsonMatch = responseText.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0])
        }
        // Return a default evaluation
        return {
          is_correct: false,
          score: 30,
          feedback: result.response,
          missing_concepts: [],
          mistake_type: 'incomplete',
          expected_key_points: [],
          follow_up_question: 'Can you try explaining this concept in your own words?',
        }
      }
    } catch (error) {
      console.error('❌ Answer evaluation failed:', error.message)
      throw error
    }
  }

  /**
   * Generate a practice question for a specific skill
   */
  async generateQuestion(skillName, context = '') {
    const prompt = `You are an expert educator. Generate a practice question about "${skillName}" based on the following material.

MATERIAL:
${context.substring(0, 2000)}

Generate a question that tests understanding (not just memorization). Return ONLY valid JSON:
{
  "question": "The question text",
  "hint": "A subtle hint that guides without giving the answer",
  "difficulty": "easy" | "medium" | "hard",
  "expected_concepts": ["concept1", "concept2"]
}

Return ONLY the JSON:`

    try {
      const result = await this.generateResponse(prompt)
      const responseText = result.response

      try {
        return JSON.parse(responseText)
      } catch {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0])
        }
        return {
          question: `Explain the key concepts of ${skillName} in your own words.`,
          hint: 'Think about the main ideas and how they connect.',
          difficulty: 'medium',
          expected_concepts: [skillName],
        }
      }
    } catch (error) {
      console.error('❌ Question generation failed:', error.message)
      return {
        question: `What do you understand about ${skillName}?`,
        hint: 'Start with the basics and build up.',
        difficulty: 'easy',
        expected_concepts: [skillName],
      }
    }
  }

  /**
   * Stream a response from Ollama, calling onChunk for each token
   * @param {string} prompt - Full prompt to send
   * @param {Function} onChunk - callback(text) called for each chunk
   * @param {Array} conversationHistory - Prior messages
   * @returns {string} Complete response text
   */
  async generateStreamingResponse(prompt, onChunk, conversationHistory = []) {
    let context = ''
    if (conversationHistory && conversationHistory.length > 0) {
      context = conversationHistory
        .map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
        .join('\n')
      context += '\n'
    }

    const fullPrompt = context + `User: ${prompt}\nAssistant:`

    console.log(`🔄 Streaming request to Ollama (${this.model})...`)

    try {
      const response = await this.client.post('/api/generate', {
        model: this.model,
        prompt: fullPrompt,
        stream: true,
        temperature: 0.7,
        top_p: 0.9,
      }, {
        responseType: 'stream',
        timeout: 180000,
      })

      let fullResponse = ''

      return new Promise((resolve, reject) => {
        response.data.on('data', (chunk) => {
          try {
            const lines = chunk.toString().split('\n').filter(Boolean)
            for (const line of lines) {
              const parsed = JSON.parse(line)
              if (parsed.response) {
                fullResponse += parsed.response
                onChunk(parsed.response)
              }
              if (parsed.done) {
                resolve({
                  response: fullResponse.trim(),
                  model: this.model,
                  tokens_used: parsed.eval_count || 0,
                })
              }
            }
          } catch (parseErr) {
            // Partial JSON, skip
          }
        })

        response.data.on('error', (err) => {
          reject(new Error(`Stream error: ${err.message}`))
        })

        response.data.on('end', () => {
          if (fullResponse) {
            resolve({
              response: fullResponse.trim(),
              model: this.model,
              tokens_used: 0,
            })
          }
        })
      })
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Ollama service is not running.')
      }
      throw new Error(`Streaming failed: ${error.message}`)
    }
  }

  /**
   * RAG-enhanced streaming response
   */
  async generateWithContextStreaming(userQuery, retrievedChunks = [], onChunk, conversationHistory = []) {
    const contextText = retrievedChunks
      .map((chunk, i) => `[Source ${i + 1}]: ${chunk.content || chunk}`)
      .join('\n\n')

    const ragPrompt = `You are an expert AI tutor. Use the reference material to answer accurately.

REFERENCE MATERIAL:
${contextText}

INSTRUCTIONS:
- Answer based ONLY on the reference material
- Provide clear, structured explanations
- Include relevant examples
- End with 1-2 follow-up questions

STUDENT'S QUESTION: ${userQuery}

ANSWER:`

    return this.generateStreamingResponse(ragPrompt, onChunk, conversationHistory)
  }

  /**
   * Simple prompt hash for caching
   */
  _hashPrompt(text) {
    let hash = 0
    const str = text.substring(0, 300)
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return `${hash}_${text.length}`
  }

  // List available models
  async getAvailableModels() {
    try {
      const response = await this.client.get('/api/tags')
      return response.data.models || []
    } catch (error) {
      console.error('Error fetching models:', error.message)
      return []
    }
  }
}

export default new OllamaService()
