import { useState, useRef } from 'react'
import { X, BookOpen, MessageSquare, Send, CheckCircle2, XCircle, Loader2, HelpCircle, Sparkles, Zap, Brain, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { runAgentLoop, agentEvaluate, streamTutorMessage, sendTutorMessage } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'

interface SkillNodeData {
  id: string
  name: string
  description: string
  prerequisites: string[]
  mastery: number
  level: number
  mastery_data?: {
    mastery_score: number
    interactions: number
    correct_answers: number
    last_interaction: string | null
    mistakes_count: number
  }
}

interface LearningPanelProps {
  skill: SkillNodeData
  skillTreeId: string
  onClose: () => void
  onMasteryUpdate?: () => void
}

type Phase = 'loading' | 'explain' | 'question' | 'feedback'

interface AgentPlan {
  difficulty: string
  approachType: string
  reasoning: string
  sessionPlan?: { steps: string[]; estimated_time_min: number }
}

export function LearningPanel({ skill, skillTreeId, onClose, onMasteryUpdate }: LearningPanelProps) {
  const { user } = useAuth()
  const [phase, setPhase] = useState<Phase>('loading')
  const [explanation, setExplanation] = useState('')
  const [question, setQuestion] = useState<any>(null)
  const [userAnswer, setUserAnswer] = useState('')
  const [feedback, setFeedback] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([])
  const [agentPlan, setAgentPlan] = useState<AgentPlan | null>(null)
  const [streamingText, setStreamingText] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [reasoningGaps, setReasoningGaps] = useState<any[]>([])
  const [profileUpdate, setProfileUpdate] = useState<any>(null)
  const questionTimerRef = useRef<number>(0)

  const mastery = skill.mastery_data?.mastery_score ?? skill.mastery ?? 0

  // Run the agent loop when the panel loads
  async function runAgent() {
    setLoading(true)
    setPhase('loading')
    try {
      const result = await runAgentLoop({
        skill_tree_id: skillTreeId,
        skill_id: skill.id,
      })

      if (result.status === 'complete') {
        setExplanation(result.message || 'All skills mastered!')
        setChatMessages([{ role: 'assistant', content: result.message }])
        setPhase('explain')
        setLoading(false)
        return
      }

      setAgentPlan({
        difficulty: result.plan.difficulty,
        approachType: result.plan.approachType,
        reasoning: result.plan.reasoning,
        sessionPlan: result.plan.sessionPlan,
      })

      setExplanation(result.explanation)
      setChatMessages([{ role: 'assistant', content: result.explanation }])
      setQuestion(result.question)
      setPhase('explain')

      if (result.learningProfile) {
        setProfileUpdate(result.learningProfile)
      }
    } catch (err) {
      // Fallback to simple explanation
      await fetchExplanationFallback()
    }
    setLoading(false)
  }

  async function fetchExplanationFallback() {
    try {
      setIsStreaming(true)
      setStreamingText('')
      setChatMessages([{ role: 'assistant', content: '' }])
      setPhase('explain')

      await streamTutorMessage({
        message: `Explain the concept of "${skill.name}" in detail. ${skill.description ? `Context: ${skill.description}` : ''}`,
        skill_id: skill.id,
        skill_tree_id: skillTreeId,
        onChunk: (chunk) => {
          setStreamingText((prev) => {
            const newText = prev + chunk
            setChatMessages([{ role: 'assistant', content: newText }])
            return newText
          })
        },
        onDone: () => {
          setIsStreaming(false)
        },
        onError: () => {
          setIsStreaming(false)
        },
      })
    } catch {
      // Final fallback - non-streaming
      try {
        const result = await sendTutorMessage({
          message: `Explain "${skill.name}" in detail.`,
          user_id: user!.id,
          skill_id: skill.id,
          skill_tree_id: skillTreeId,
        })
        setExplanation(result.response)
        setChatMessages([{ role: 'assistant', content: result.response }])
      } catch {
        setExplanation('Failed to load explanation. Please try again.')
        setChatMessages([{ role: 'assistant', content: 'Failed to load explanation.' }])
      }
    }
    setPhase('explain')
  }

  function startQuestion() {
    if (question) {
      setPhase('question')
      questionTimerRef.current = Date.now()
    }
  }

  async function handleSubmitAnswer() {
    if (!userAnswer.trim() || !question) return
    setLoading(true)

    const responseTimeMs = questionTimerRef.current > 0
      ? Date.now() - questionTimerRef.current
      : undefined

    try {
      const result = await agentEvaluate({
        skill_tree_id: skillTreeId,
        skill_id: skill.id,
        question: question.question,
        answer: userAnswer,
        response_time_ms: responseTimeMs,
      })

      setFeedback(result)
      setReasoningGaps(result.reasoning_gaps || [])
      if (result.profile) {
        setProfileUpdate(result.profile)
      }
      setPhase('feedback')
      onMasteryUpdate?.()
    } catch {
      setFeedback({
        evaluation: {
          is_correct: false,
          score: 0,
          feedback: 'Failed to evaluate. Please try again.',
          missing_concepts: [],
        },
        mastery: { mastery_score: mastery },
      })
      setPhase('feedback')
    }
    setLoading(false)
  }

  async function handleChatSend() {
    if (!chatInput.trim() || loading || isStreaming) return
    const msg = chatInput.trim()
    setChatInput('')
    setChatMessages(prev => [...prev, { role: 'user', content: msg }])

    // Try streaming
    setIsStreaming(true)
    setChatMessages(prev => [...prev, { role: 'assistant', content: '' }])

    try {
      let accumulated = ''
      await streamTutorMessage({
        message: msg,
        skill_id: skill.id,
        skill_tree_id: skillTreeId,
        onChunk: (chunk) => {
          accumulated += chunk
          setChatMessages(prev => {
            const updated = [...prev]
            updated[updated.length - 1] = { role: 'assistant', content: accumulated }
            return updated
          })
        },
        onDone: () => setIsStreaming(false),
        onError: () => setIsStreaming(false),
      })
    } catch {
      // Fallback to non-streaming
      try {
        const result = await sendTutorMessage({
          message: msg,
          user_id: user!.id,
          skill_id: skill.id,
          skill_tree_id: skillTreeId,
          history: chatMessages,
        })
        setChatMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: result.response }
          return updated
        })
      } catch {
        setChatMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: 'Sorry, I could not process that.' }
          return updated
        })
      }
      setIsStreaming(false)
    }
  }

  // Auto-run agent on first mount
  if (phase === 'loading' && !loading && chatMessages.length === 0) {
    runAgent()
  }

  const difficultyColors: Record<string, string> = {
    easy: 'text-green-500 border-green-500/30 bg-green-500/10',
    medium: 'text-amber-500 border-amber-500/30 bg-amber-500/10',
    hard: 'text-red-500 border-red-500/30 bg-red-500/10',
  }

  return (
    <div className="flex flex-col h-full bg-card border-l border-border">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex size-10 items-center justify-center rounded-lg brand-gradient shrink-0">
            <BookOpen className="size-5 text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm truncate">{skill.name}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <Progress value={mastery} className="h-1.5 w-20" />
              <span className="text-xs text-muted-foreground">{mastery}%</span>
              {agentPlan && (
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${difficultyColors[agentPlan.difficulty] || ''}`}>
                  {agentPlan.difficulty}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
          <X className="size-4" />
        </Button>
      </div>

      {/* Agent plan banner */}
      {agentPlan && phase === 'explain' && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="border-b border-border/60 bg-primary/5 px-4 py-2.5"
        >
          <div className="flex items-start gap-2">
            <Brain className="size-4 text-primary shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-primary">Agent Plan</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{agentPlan.reasoning}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Content */}
      <ScrollArea className="flex-1 p-4 min-h-0">
        {phase === 'loading' && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <Brain className="size-8 text-primary" />
            </motion.div>
            <div className="text-center">
              <p className="text-sm font-medium">Agent is thinking...</p>
              <p className="text-xs text-muted-foreground mt-1">Diagnosing → Planning → Generating</p>
            </div>
          </div>
        )}

        {phase === 'explain' && (
          <div className="space-y-4">
            {/* Chat messages */}
            <AnimatePresence mode="popLayout">
              {chatMessages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full brand-gradient mt-1">
                      <Sparkles className="size-3.5 text-white" />
                    </div>
                  )}
                  <div className={`
                    rounded-2xl px-4 py-3 text-sm max-w-[85%] whitespace-pre-wrap leading-relaxed
                    ${msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-tr-sm'
                      : 'bg-muted border border-border/60 rounded-tl-sm'
                    }
                    ${isStreaming && i === chatMessages.length - 1 && msg.role === 'assistant'
                      ? 'after:content-["▊"] after:animate-pulse after:ml-0.5 after:text-primary'
                      : ''
                    }
                  `}>
                    {msg.content}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
                <Loader2 className="size-4 animate-spin text-primary" />
                <span>Synthesizing information...</span>
              </div>
            )}

            {!loading && !isStreaming && chatMessages.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="space-y-3 pt-2"
              >
                {question && (
                  <Button onClick={startQuestion} className="w-full brand-gradient text-white border-0">
                    <HelpCircle className="size-4 mr-2" /> Test Your Knowledge
                    {agentPlan && (
                      <Badge variant="outline" className={`ml-2 text-[10px] text-white border-white/30`}>
                        {agentPlan.difficulty}
                      </Badge>
                    )}
                  </Button>
                )}
              </motion.div>
            )}
          </div>
        )}

        {phase === 'question' && question && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="rounded-xl border border-border/60 p-4 bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className={`text-xs ${difficultyColors[question.difficulty] || ''}`}>
                  <Zap className="size-3 mr-1" />
                  {question.difficulty || 'medium'}
                </Badge>
                <span className="text-xs text-muted-foreground">Practice Question</span>
              </div>
              <p className="text-sm font-medium">{question.question}</p>
              {question.hint && (
                <p className="text-xs text-muted-foreground mt-2 italic">
                  💡 Hint: {question.hint}
                </p>
              )}
            </div>

            <Textarea
              placeholder="Type your answer here..."
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              rows={4}
              className="resize-none"
            />

            <Button
              onClick={handleSubmitAnswer}
              disabled={!userAnswer.trim() || loading}
              className="w-full brand-gradient text-white border-0"
            >
              {loading ? (
                <><Loader2 className="size-4 mr-2 animate-spin" /> Evaluating...</>
              ) : (
                <><Send className="size-4 mr-2" /> Submit Answer</>
              )}
            </Button>
          </motion.div>
        )}

        {phase === 'feedback' && feedback && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4"
          >
            {/* Result card */}
            <div className={`rounded-xl border-2 p-4 ${
              feedback.evaluation.is_correct
                ? 'border-emerald-500/60 bg-emerald-500/10'
                : 'border-orange-500/60 bg-orange-500/10'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {feedback.evaluation.is_correct ? (
                  <><CheckCircle2 className="size-5 text-emerald-500" /><span className="font-semibold text-emerald-600 dark:text-emerald-400">Correct!</span></>
                ) : (
                  <><XCircle className="size-5 text-orange-500" /><span className="font-semibold text-orange-600 dark:text-orange-400">Needs Improvement</span></>
                )}
                <Badge variant="outline" className="ml-auto">
                  Score: {feedback.evaluation.score}%
                </Badge>
              </div>
              <p className="text-sm">{feedback.evaluation.feedback}</p>
            </div>

            {/* Reasoning gaps */}
            {reasoningGaps.length > 0 && (
              <div className="rounded-xl border border-border/60 p-4">
                <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                  <AlertCircle className="size-3.5" /> Reasoning Gaps Detected
                </p>
                <div className="space-y-2">
                  {reasoningGaps.map((gap: any, i: number) => (
                    <div key={i} className="flex items-start gap-2">
                      <Badge variant={gap.severity === 'high' ? 'destructive' : 'secondary'} className="text-[10px] shrink-0 mt-0.5">
                        {gap.severity}
                      </Badge>
                      <div>
                        <p className="text-xs">{gap.description}</p>
                        <p className="text-[11px] text-muted-foreground italic mt-0.5">{gap.recommendation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Missing concepts */}
            {feedback.evaluation.missing_concepts?.length > 0 && (
              <div className="rounded-xl border border-border/60 p-4">
                <p className="text-xs font-medium text-muted-foreground mb-2">Missing Concepts:</p>
                <div className="flex flex-wrap gap-1.5">
                  {feedback.evaluation.missing_concepts.map((c: string, i: number) => (
                    <Badge key={i} variant="secondary" className="text-xs">{c}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Updated mastery */}
            <div className="rounded-xl border border-border/60 p-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">Updated Mastery</p>
              <div className="flex items-center gap-3">
                <Progress value={feedback.mastery?.mastery_score || 0} className="h-2 flex-1" />
                <span className="text-sm font-bold">{feedback.mastery?.mastery_score || 0}%</span>
              </div>
            </div>

            {/* Profile update indicator */}
            {feedback.profile && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
                <p className="text-xs font-medium text-primary mb-1 flex items-center gap-1">
                  <Brain className="size-3" /> Profile Updated
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-[10px]">
                    Speed: {feedback.profile.learning_speed}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    Difficulty: {feedback.profile.difficulty_level}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    Engagement: {feedback.profile.engagement_score}%
                  </Badge>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button onClick={() => { setPhase('loading'); setChatMessages([]); setUserAnswer(''); runAgent() }} variant="outline" className="flex-1">
                <HelpCircle className="size-4 mr-2" /> Next Session
              </Button>
              <Button onClick={() => { setPhase('explain'); setChatInput(''); }} className="flex-1 brand-gradient text-white border-0">
                <MessageSquare className="size-4 mr-2" /> Ask Tutor
              </Button>
            </div>
          </motion.div>
        )}
      </ScrollArea>

      {/* Chat input (visible in explain phase) */}
      {phase === 'explain' && (
        <div className="border-t border-border p-3">
          <div className="flex gap-2">
            <Textarea
              placeholder="Ask about this topic..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChatSend() } }}
              rows={1}
              className="min-h-[40px] max-h-24 resize-none flex-1"
              disabled={loading || isStreaming}
            />
            <Button
              onClick={handleChatSend}
              disabled={!chatInput.trim() || loading || isStreaming}
              size="icon"
              className="brand-gradient text-white border-0 shrink-0"
            >
              <Send className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default LearningPanel
