import { useState, useRef, useEffect } from 'react'
import { X, BookOpen, MessageSquare, Send, CheckCircle2, XCircle, Loader2, HelpCircle, Sparkles, Zap, Brain, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { runAgentLoop, agentEvaluate, streamTutorMessage, sendTutorMessage, getSkillContent } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { useVoice } from '@/contexts/VoiceContext'

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

type Phase = 'loading' | 'content' | 'explain' | 'question' | 'feedback'

interface AgentPlan {
  difficulty: string
  approachType: string
  reasoning: string
  sessionPlan?: { steps: string[]; estimated_time_min: number }
}

export function LearningPanel({ skill, skillTreeId, onClose, onMasteryUpdate }: LearningPanelProps) {
  const { user } = useAuth()
  const { speak, stopSpeaking, registerCommandHandler, unregisterCommandHandler } = useVoice()
  const [phase, setPhase] = useState<Phase>('loading')
  const [skillContent, setSkillContent] = useState<{ title: string; content: string } | null>(null)
  const [contentSections, setContentSections] = useState<string[][]>([]) // all sections
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0)      // which section we're on
  const [paragraphs, setParagraphs] = useState<string[]>([])
  const [activeParagraphIndex, setActiveParagraphIndex] = useState(-1)
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

  const PARAGRAPHS_PER_SECTION = 4 // how many paragraphs make one "content section"

  async function loadContent() {
    setLoading(true)
    setPhase('loading')
    try {
      const contentData = await getSkillContent(skillTreeId, skill.id)
      setSkillContent(contentData)
      
      // Split content into paragraphs
      const allParas = contentData.content.split('\n\n').filter((p: string) => p.trim().length > 0)

      // Group paragraphs into sections
      const sections: string[][] = []
      for (let i = 0; i < allParas.length; i += PARAGRAPHS_PER_SECTION) {
        sections.push(allParas.slice(i, i + PARAGRAPHS_PER_SECTION))
      }
      if (sections.length === 0) sections.push([contentData.content])

      // Resume from saved progress if available
      const savedIndexStr = localStorage.getItem(`cogniva_progress_${skillTreeId}_${skill.id}`)
      const savedIndex = savedIndexStr ? parseInt(savedIndexStr, 10) : 0
      const validIndex = (savedIndex >= 0 && savedIndex < sections.length) ? savedIndex : 0

      setContentSections(sections)
      setCurrentSectionIndex(validIndex)
      setParagraphs(sections[validIndex])
      setActiveParagraphIndex(0)
      setPhase('content')
    } catch {
      const fallbackMsg = 'Failed to load content. You can proceed to the quiz.'
      setSkillContent({ title: skill.name, content: fallbackMsg })
      setContentSections([[fallbackMsg]])
      setCurrentSectionIndex(0)
      setParagraphs([fallbackMsg])
      setActiveParagraphIndex(0)
      setPhase('content')
    }
    setLoading(false)
  }

  // Load a specific section by index (used after quiz to advance)
  function loadSection(sectionIdx: number) {
    stopSpeaking()
    setUserAnswer('')
    setFeedback(null)
    setQuestion(null)
    setChatMessages([])
    
    // Save progress
    localStorage.setItem(`cogniva_progress_${skillTreeId}_${skill.id}`, String(sectionIdx))
    
    setCurrentSectionIndex(sectionIdx)
    setParagraphs(contentSections[sectionIdx])
    setActiveParagraphIndex(0)
    setPhase('content')
  }

  // Run the agent loop to start quiz
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

  // Voice playback effect
  useEffect(() => {
    if (phase !== 'content' || activeParagraphIndex < 0 || activeParagraphIndex >= paragraphs.length) return
    
    // Play the current paragraph
    speak(paragraphs[activeParagraphIndex], () => {
      // On end, move to next paragraph if not interrupted
      setActiveParagraphIndex((prev) => {
        if (prev === activeParagraphIndex) {
          const next = prev + 1
          if (next >= paragraphs.length) {
            // Finished reading all paragraphs -> move to quiz
            runAgent()
            return -1
          }
          return next
        }
        return prev
      })
    })

    return () => {
      stopSpeaking()
    }
  }, [activeParagraphIndex, phase, paragraphs]) // eslint-disable-line react-hooks/exhaustive-deps

  // Voice doubt handler
  useEffect(() => {
    registerCommandHandler(async (transcript: string) => {
      // Pause reading
      stopSpeaking()
      
      const msg = transcript.trim()
      
      // Do not change phase to explain or show chat messages.
      // Just stream the tutor response silently and have the Orb speak it.
      try {
        let accumulated = ''
        await streamTutorMessage({
          message: msg,
          skill_id: skill.id,
          skill_tree_id: skillTreeId,
          onChunk: (chunk) => {
            accumulated += chunk
          },
          onDone: () => {
            // Speak the answer automatically
            speak(accumulated, () => {
              // Optionally return to lesson after answering
              // Force resume of the current paragraph
              if (phase === 'content' && activeParagraphIndex >= 0 && activeParagraphIndex < paragraphs.length) {
                // To trigger the effect again, we can just call speak manually here, 
                // or briefly set activeParagraphIndex to a dummy value and back.
                // It's safer to just let them click it again, or we can use a small timeout:
                setTimeout(() => {
                  setActiveParagraphIndex(prev => prev); // Wait, setting to same value doesn't trigger effect.
                  // We'll just manually call speak to resume the paragraph flow.
                  speak(paragraphs[activeParagraphIndex], () => {
                    setActiveParagraphIndex((prev) => {
                      if (prev === activeParagraphIndex) {
                        const next = prev + 1
                        if (next >= paragraphs.length) {
                          runAgent()
                          return -1
                        }
                        return next
                      }
                      return prev
                    })
                  })
                }, 500);
              }
            })
          },
          onError: () => {
            speak("Sorry, I could not process your voice doubt.")
          },
        })
      } catch {
        speak("Sorry, I could not process your voice doubt.")
      }
    })

    return () => {
      unregisterCommandHandler()
    }
  }, [skill.id, skillTreeId, chatMessages]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-load content on first mount
  if (phase === 'loading' && !loading && !skillContent && chatMessages.length === 0) {
    loadContent()
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

        {phase === 'content' && skillContent && (
          <div className="space-y-6">
            <div className="prose prose-sm prose-invert max-w-none">
              <h2 className="text-xl font-bold mb-4">{skillContent.title}</h2>
              <div className="space-y-4">
                {paragraphs.map((p, idx) => (
                  <p 
                    key={idx} 
                    className={`leading-relaxed transition-colors duration-300 ${
                      idx === activeParagraphIndex 
                        ? 'text-primary font-medium bg-primary/5 p-2 rounded border-l-2 border-primary' 
                        : idx < activeParagraphIndex 
                          ? 'text-slate-400' 
                          : 'text-slate-200'
                    }`}
                  >
                    {p}
                  </p>
                ))}
              </div>
            </div>
            <div className="pt-4 border-t border-border/50">
              <Button onClick={runAgent} className="w-full brand-gradient text-white border-0 shadow-lg hover:shadow-indigo-500/25 transition-all duration-300">
                <HelpCircle className="size-4 mr-2" /> Take Quiz
              </Button>
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
                  <div 
                    className={`
                    rounded-2xl px-4 py-3 text-sm max-w-[85%] leading-relaxed
                    ${msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-tr-sm'
                      : 'bg-muted border border-border/60 rounded-tl-sm'
                    }
                    ${isStreaming && i === chatMessages.length - 1 && msg.role === 'assistant'
                      ? 'after:content-["▊"] after:animate-pulse after:ml-0.5 after:text-primary'
                      : ''
                    }
                  `}
                    dangerouslySetInnerHTML={{ 
                      __html: msg.content
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em>$1</em>')
                        .replace(/\n/g, '<br/>') 
                    }}
                  />
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

            {/* Profile & XP update indicator */}
            {feedback.profile && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
                <p className="text-xs font-medium text-primary mb-1 flex items-center gap-1">
                  <Brain className="size-3" /> Profile Updated
                </p>
                <div className="flex flex-wrap gap-2 mb-2">
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
                {feedback.xp_gained > 0 && (
                  <div className="mt-2 flex items-center gap-1 text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded-md w-fit text-xs border border-emerald-500/20">
                    <Zap className="size-3" /> +{feedback.xp_gained} XP Earned!
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              {currentSectionIndex + 1 < contentSections.length ? (
                // More sections to go — advance to next
                <Button
                  onClick={() => loadSection(currentSectionIndex + 1)}
                  className="flex-1 brand-gradient text-white border-0"
                >
                  <BookOpen className="size-4 mr-2" />
                  Next Section ({currentSectionIndex + 2}/{contentSections.length})
                </Button>
              ) : (
                // All sections done — show completion
                <Button
                  onClick={() => {
                    localStorage.removeItem(`cogniva_progress_${skillTreeId}_${skill.id}`)
                    onClose()
                  }}
                  className="flex-1 brand-gradient text-white border-0"
                >
                  <CheckCircle2 className="size-4 mr-2" />
                  Node Complete! 🎉
                </Button>
              )}
              <Button onClick={() => { setPhase('explain'); setChatInput(''); }} variant="outline" className="flex-1">
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
