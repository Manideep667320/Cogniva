import { BrainCircuit, UserRound, Copy, CheckCheck } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface ChatBubbleProps {
    role: 'user' | 'assistant'
    content: string
    timestamp?: string
    isStreaming?: boolean
}

export function ChatBubble({ role, content, timestamp, isStreaming }: ChatBubbleProps) {
    const [copied, setCopied] = useState(false)

    function handleCopy() {
        navigator.clipboard.writeText(content)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const isUser = role === 'user'

    return (
        <div className={cn('flex gap-3 w-full group', isUser && 'flex-row-reverse')}>
            {/* Avatar */}
            <div className={cn(
                'flex size-8 shrink-0 items-center justify-center rounded-full mt-1',
                isUser ? 'bg-muted border border-border' : 'brand-gradient'
            )}>
                {isUser
                    ? <UserRound className="size-4 text-muted-foreground" />
                    : <BrainCircuit className="size-4 text-white" />
                }
            </div>

            {/* Bubble */}
            <div className={cn('flex flex-col gap-1 max-w-[75%]', isUser && 'items-end')}>
                <div className={cn(
                    'rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm',
                    isUser
                        ? 'brand-gradient text-white rounded-tr-sm'
                        : 'bg-muted text-foreground border border-border/60 rounded-tl-sm',
                    isStreaming && 'after:content-["▊"] after:animate-pulse after:ml-0.5 after:text-primary'
                )}>
                    <p className="whitespace-pre-wrap break-words">{content}</p>
                </div>

                <div className={cn('flex items-center gap-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity', isUser && 'flex-row-reverse')}>
                    {timestamp && (
                        <span className="text-xs text-muted-foreground">
                            {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    )}
                    {!isUser && (
                        <Button variant="ghost" size="icon-xs" onClick={handleCopy} className="text-muted-foreground hover:text-foreground">
                            {copied ? <CheckCheck className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
