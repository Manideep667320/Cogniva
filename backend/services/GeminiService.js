import axios from 'axios'
import { llmCache } from './cacheService.js'

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models'
const DEFAULT_MODEL = 'gemini-flash-lite-latest'

export class GeminiService {
  constructor() {
    this.apiUrl = GEMINI_API_URL
    this.model = DEFAULT_MODEL
  }

  get apiKey() {
    return (process.env.GEMINI_API_KEY || '').trim();
  }

  async isHealthy() {
    // If we have an API key, assume healthy
    return !!this.apiKey
  }

  async generateResponse(prompt, conversationHistory = [], retries = 3) {
    let contents = []
    if (conversationHistory && conversationHistory.length > 0) {
      contents = conversationHistory.map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }))
    }
    contents.push({ role: 'user', parts: [{ text: prompt }] })

    console.log(`🤖 Sending request to Gemini (${this.model})...`)

    const cacheKey = `llm:${this._hashPrompt(prompt + JSON.stringify(conversationHistory))}`
    const cached = llmCache.get(cacheKey)
    if (cached) {
      console.log('💾 LLM cache hit')
      return cached
    }

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await axios.post(
          `${this.apiUrl}/${this.model}:generateContent?key=${this.apiKey}`,
          { contents }
        )

        const assistantMessage = response.data.candidates[0].content.parts[0].text.trim()
        console.log('✅ Response generated successfully')

        const result = {
          response: assistantMessage,
          model: this.model,
          tokens_used: response.data.usageMetadata?.totalTokenCount || 0,
        }

        llmCache.set(cacheKey, result, 300000)
        return result
      } catch (error) {
        const status = error.response?.status
        const isRateLimit = status === 429

        if (isRateLimit && attempt < retries) {
          // Try to read Retry-After header or parse message for wait time
          let waitSeconds = Math.pow(2, attempt + 1) * 8 // 16s, 32s, 64s
          const retryAfter = error.response?.headers?.['retry-after']
          if (retryAfter) {
            waitSeconds = parseInt(retryAfter, 10) + 2
          } else {
            const msg = error.response?.data?.error?.message || ''
            const match = msg.match(/retry after (\d+)/i) || msg.match(/([\d.]+)s/)
            if (match) waitSeconds = Math.ceil(parseFloat(match[1])) + 2
          }
          console.warn(`⏳ Gemini rate limited (429). Waiting ${waitSeconds}s before retry ${attempt + 1}/${retries}...`)
          await new Promise(res => setTimeout(res, waitSeconds * 1000))
          continue
        }

        console.error('❌ Gemini generation error:', error.response?.data || error.message)
        throw new Error(`Failed to generate response: ${error.message}`)
      }
    }
  }


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
  "mistake_type": "calculation/misconception/factual/incomplete",
  "expected_key_points": ["point1"],
  "follow_up_question": "A question to probe further"
}
Ensure the response is ONLY the JSON object, with no markdown formatting or extra text.`

    let retries = 2;
    for (let i = 0; i <= retries; i++) {
      try {
        const response = await this.generateResponse(evalPrompt, [])
        const text = response.response
        
        // Extract JSON using regex just in case
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0])
        }
        return JSON.parse(text)
      } catch (error) {
        if (error.message.includes('429') && i < retries) {
          console.warn(`[Evaluator] Rate limited (429). Retrying in 16 seconds...`);
          await new Promise(res => setTimeout(res, 16000));
          continue;
        }
        console.error('❌ Evaluator JSON parsing error:', error)
        throw error
      }
    }
  }

  async evaluateAssignment(question, userAnswer, context = '') {
    const evalPrompt = `You are an expert educator evaluating a student's assignment submission. Analyze the answer and provide comprehensive feedback.

CONTEXT (study material or course details, if any):
${context.substring(0, 2000)}

QUESTION / PROMPT: ${question}

STUDENT'S SUBMISSION: ${userAnswer}

Evaluate the submission and return ONLY valid JSON in this exact format:
{
  "score": 0-100,
  "feedback": "Detailed overall feedback on the submission",
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "suggestions": ["suggestion1", "suggestion2"]
}
Ensure the response is ONLY the JSON object, with no markdown formatting or extra text.`

    let retries = 2;
    for (let i = 0; i <= retries; i++) {
      try {
        const response = await this.generateResponse(evalPrompt, [])
        const text = response.response
        
        // Extract JSON using regex just in case
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0])
        }
        return JSON.parse(text)
      } catch (error) {
        if (error.message.includes('429') && i < retries) {
          console.warn(`[Evaluator] Rate limited (429). Retrying in 16 seconds...`);
          await new Promise(res => setTimeout(res, 16000));
          continue;
        }
        console.error('❌ Assignment Evaluator JSON parsing error:', error)
        throw error
      }
    }
  }

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
        return JSON.parse(responseText.replace(/```json/g, '').replace(/```/g, ''))
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

  async generateStreamingResponse(prompt, onChunk, conversationHistory = []) {
    let contents = []
    if (conversationHistory && conversationHistory.length > 0) {
      contents = conversationHistory.map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }))
    }
    contents.push({ role: 'user', parts: [{ text: prompt }] })

    console.log(`🔄 Streaming request to Gemini (${this.model})...`)

    try {
      const response = await axios.post(
        `${this.apiUrl}/${this.model}:streamGenerateContent?alt=sse&key=${this.apiKey}`,
        { contents },
        { responseType: 'stream' }
      )

      let fullResponse = ''

      return new Promise((resolve, reject) => {
        response.data.on('data', (chunk) => {
          const lines = chunk.toString().split('\n')
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const dataStr = line.replace('data: ', '').trim()
                if (dataStr === '[DONE]') continue
                
                const parsed = JSON.parse(dataStr)
                if (parsed.candidates && parsed.candidates[0].content) {
                  const textChunk = parsed.candidates[0].content.parts[0].text
                  fullResponse += textChunk
                  onChunk(textChunk)
                }
              } catch (e) {}
            }
          }
        })

        response.data.on('error', (err) => {
          reject(new Error(`Stream error: ${err.message}`))
        })

        response.data.on('end', () => {
          resolve({
            response: fullResponse.trim(),
            model: this.model,
            tokens_used: 0,
          })
        })
      })
    } catch (error) {
      throw new Error(`Streaming failed: ${error.message}`)
    }
  }

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

  async getAvailableModels() {
    return [{ name: this.model }]
  }
}

export default new GeminiService()
