import { useState } from 'react'
import { X, BookOpen, MessageSquare, Send, CheckCircle2, XCircle, Loader2, HelpCircle, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { sendTutorMessage, submitAnswer, generateQuestion } from '@/lib/api'
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

type Phase = 'explain' | 'question' | 'feedback'

export function LearningPanel({ skill, skillTreeId, onClose, onMasteryUpdate }: LearningPanelProps) {
  const { user } = useAuth()
  const [phase, setPhase] = useState<Phase>('explain')
  const [explanation, setExplanation] = useState('')
  const [question, setQuestion] = useState<any>(null)
  const [userAnswer, setUserAnswer] = useState('')
  const [feedback, setFeedback] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([])

  const mastery = skill.mastery_data?.mastery_score ?? skill.mastery ?? 0

  async function fetchExplanation() {
    setLoading(true)
    try {
      const result = await sendTutorMessage({
        message: `Explain the concept of "${skill.name}" in detail. ${skill.description ? `Context: ${skill.description}` : ''}`,
        user_id: user!.id,
        skill_id: skill.id,
        skill_tree_id: skillTreeId,
      })
      setExplanation(result.response)
      setChatMessages([{ role: 'assistant', content: result.response }])
    } catch (err) {
      setExplanation('Failed to load explanation. Please try again.')
    }
    setLoading(false)
  }

  async function fetchQuestion() {
    setLoading(true)
    try {
      const q = await generateQuestion({
        skill_tree_id: skillTreeId,
        skill_id: skill.id,
      })
      setQuestion(q)
      setPhase('question')
    } catch (err) {
      setQuestion({
        question: `Explain the key concepts of ${skill.name} in your own words.`,
        hint: 'Focus on the main ideas and how they relate.',
        difficulty: 'medium',
      })
      setPhase('question')
    }
    setLoading(false)
  }

  async function handleSubmitAnswer() {
    if (!userAnswer.trim() || !question) return
    setLoading(true)
    try {
      const result = await submitAnswer({
        skill_tree_id: skillTreeId,
        skill_id: skill.id,
        question: question.question,
        answer: userAnswer,
      })
      setFeedback(result)
      setPhase('feedback')
      onMasteryUpdate?.()
    } catch (err) {
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
    if (!chatInput.trim() || loading) return
    const msg = chatInput.trim()
    setChatInput('')
    setChatMessages(prev => [...prev, { role: 'user', content: msg }])
    setLoading(true)
    try {
      const result = await sendTutorMessage({
        message: msg,
        user_id: user!.id,
        skill_id: skill.id,
        skill_tree_id: skillTreeId,
        history: chatMessages,
      })
      setChatMessages(prev => [...prev, { role: 'assistant', content: result.response }])
    } catch {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I could not process that. Try again.' }])
    }
    setLoading(false)
  }

  // Auto-fetch explanation on first mount
  if (!explanation && !loading && chatMessages.length === 0) {
    fetchExplanation()
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
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
          <X className="size-4" />
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 p-4 min-h-0">
        {phase === 'explain' && (
          <div className="space-y-4">
            {/* Chat messages */}
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
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
                `}>
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Thinking...
              </div>
            )}

            {!loading && explanation && (
              <Button onClick={fetchQuestion} className="w-full brand-gradient text-white border-0 mt-2">
                <HelpCircle className="size-4 mr-2" /> Test Your Knowledge
              </Button>
            )}
          </div>
        )}

        {phase === 'question' && question && (
          <div className="space-y-4">
            <div className="rounded-xl border border-border/60 p-4 bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs">
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
          </div>
        )}

        {phase === 'feedback' && feedback && (
          <div className="space-y-4">
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

            {/* Actions */}
            <div className="flex gap-2">
              <Button onClick={fetchQuestion} variant="outline" className="flex-1">
                <HelpCircle className="size-4 mr-2" /> Another Question
              </Button>
              <Button onClick={() => { setPhase('explain'); setChatInput(''); }} className="flex-1 brand-gradient text-white border-0">
                <MessageSquare className="size-4 mr-2" /> Ask Tutor
              </Button>
            </div>
          </div>
        )}
      </ScrollArea>

      {/* Chat input (always visible in explain phase) */}
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
              disabled={loading}
            />
            <Button
              onClick={handleChatSend}
              disabled={!chatInput.trim() || loading}
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
