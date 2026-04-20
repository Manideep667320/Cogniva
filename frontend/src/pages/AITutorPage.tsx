import { useEffect, useRef, useState } from 'react'
import { Send, Trash2, BrainCircuit, Loader as Loader2, TriangleAlert as AlertTriangle, History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { AppLayout } from '@/components/layout/AppLayout'
import { ChatBubble } from '@/components/chat/ChatBubble'
import { useAuth } from '@/contexts/AuthContext'
import { sendTutorMessage } from '@/lib/api'

interface LocalMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

const SUGGESTED_PROMPTS = [
  'Explain neural networks with a simple analogy',
  'What is the difference between AI, ML, and Deep Learning?',
  'How does gradient descent work?',
  'Summarize the key concepts in linear algebra for ML',
]

export function AITutorPage() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<LocalMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!user) return
    // Chat history will be loaded from backend API
  }, [user])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function sendMessage(text?: string) {
    const msgText = (text ?? input).trim()
    if (!msgText || loading) return

    setInput('')
    setError(null)

    const userMsg: LocalMessage = {
      role: 'user',
      content: msgText,
      timestamp: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])
    setLoading(true)

    try {
      const conversationHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }))

      const result = await sendTutorMessage({
        message: msgText,
        user_id: user!.id,
        history: conversationHistory,
      })

      const assistantMsg: LocalMessage = {
        role: 'assistant',
        content: result.response,
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error'
      setError(
        errMsg.includes('Failed to fetch') || errMsg.includes('Backend error')
          ? 'Cannot reach the AI backend. Make sure the FastAPI server is running on http://localhost:8000 with Ollama.'
          : errMsg
      )
      setMessages((prev) => prev.slice(0, -1))
    } finally {
      setLoading(false)
      textareaRef.current?.focus()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function clearSession() {
    setMessages([])
    setError(null)
  }

  const hasMessages = messages.length > 0

  return (
    <AppLayout
      title="AI Tutor"
      description="Ask anything — powered by local LLM via Ollama"
      headerRight={
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="hidden sm:flex gap-1 items-center">
            <div className="size-1.5 rounded-full bg-emerald-500" /> Phi-3 / Mistral
          </Badge>
          {hasMessages && (
            <Button variant="ghost" size="sm" onClick={clearSession} className="text-muted-foreground">
              <Trash2 className="size-4 mr-1" /> Clear
            </Button>
          )}
        </div>
      }
    >
      <div className="flex h-[calc(100vh-8rem)] gap-4">
        {/* Main Chat Area */}
        <div className="flex flex-1 flex-col rounded-xl border border-border/60 shadow-sm overflow-hidden bg-card">
          <ScrollArea className="flex-1 p-4">
            {!hasMessages ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-6 text-center px-4">
                <div className="flex size-16 items-center justify-center rounded-2xl brand-gradient shadow-lg">
                  <BrainCircuit className="size-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">How can I help you learn today?</h3>
                  <p className="text-muted-foreground text-sm mt-1 max-w-sm">
                    Ask me anything — concepts, problem-solving, code explanations, or study tips.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                  {SUGGESTED_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => sendMessage(prompt)}
                      className="text-left rounded-lg border border-border/60 p-3 text-sm hover:border-primary/50 hover:bg-accent transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4 pb-2">
                {messages.map((msg, i) => (
                  <ChatBubble
                    key={i}
                    role={msg.role}
                    content={msg.content}
                    timestamp={msg.timestamp}
                  />
                ))}
                {loading && (
                  <div className="flex gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full brand-gradient mt-1">
                      <BrainCircuit className="size-4 text-white" />
                    </div>
                    <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-muted border border-border/60 px-4 py-3">
                      <div className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                      <div className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                      <div className="size-1.5 rounded-full bg-primary animate-bounce" />
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            )}
          </ScrollArea>

          {error && (
            <div className="px-4 pb-2">
              <Alert variant="destructive" className="py-2">
                <AlertTriangle className="size-4" />
                <AlertDescription className="text-xs">{error}</AlertDescription>
              </Alert>
            </div>
          )}

          {/* Input Area */}
          <div className="border-t border-border/60 p-3">
            <div className="flex gap-2 items-end">
              <Textarea
                ref={textareaRef}
                placeholder="Ask your AI Tutor... (Enter to send, Shift+Enter for new line)"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                className="min-h-[44px] max-h-32 resize-none flex-1 bg-muted border-border/60 focus-visible:border-primary"
                disabled={loading}
              />
              <Button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                size="icon"
                className="brand-gradient text-white border-0 shrink-0 size-[44px]"
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 px-1">
              Powered by Ollama local LLM • Responses stored in your history
            </p>
          </div>
        </div>

        {/* History Sidebar */}
        <div className="hidden lg:flex w-64 flex-col rounded-xl border border-border/60 shadow-sm overflow-hidden bg-card">
          <div className="flex items-center gap-2 border-b border-border/60 p-3">
            <History className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium">Recent Messages</span>
          </div>
          <ScrollArea className="flex-1">
            {loading ? (
              <div className="flex flex-col gap-2 p-3">
                {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-14 w-full rounded-md" />)}
              </div>
            ) : messages.filter((m) => m.role === 'user').length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 p-4 text-center">
                <p className="text-xs text-muted-foreground">No messages yet</p>
              </div>
            ) : (
              <div className="flex flex-col p-2 gap-1">
                {messages
                  .filter((m) => m.role === 'user')
                  .map((item, i) => (
                    <div key={i}>
                      <button
                        className="w-full text-left rounded-lg p-2 hover:bg-muted transition-colors"
                        onClick={() => {
                          setMessages([item])
                        }}
                      >
                        <p className="text-xs font-medium truncate">{item.content}</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">
                          {new Date(item.timestamp).toLocaleDateString()}
                        </p>
                      </button>
                      {i < messages.filter((m) => m.role === 'user').length - 1 && <Separator className="my-1" />}
                    </div>
                  ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </AppLayout>
  )
}
