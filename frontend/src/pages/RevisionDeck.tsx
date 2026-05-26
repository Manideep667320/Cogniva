import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AppLayout } from '@/components/layout/AppLayout'

interface QueueItem {
  _id: string
  type: 'QA' | 'CLOZE' | 'CONCEPT'
  front: string
  back: string
  reviewState: {
    state: number
    difficulty: number
    stability: number
    weaknessScore: number
    priority: number
  }
}

export function RevisionDeck() {
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [startTime, setStartTime] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchQueue()
  }, [])

  const fetchQueue = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('https://cogniva-wu5f.onrender.com/api/flashcards/queue', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        setQueue(data.queue)
        setStartTime(Date.now())
      }
    } catch (error) {
      console.error('Failed to fetch queue', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReveal = () => {
    setShowAnswer(true)
  }

  const handleRating = async (rating: number) => {
    const timeTakenMs = Date.now() - startTime
    const currentCard = queue[currentIndex]

    // Optimistically move to next card
    setShowAnswer(false)
    setCurrentIndex(prev => prev + 1)
    setStartTime(Date.now())

    try {
      const token = localStorage.getItem('token')
      await fetch('https://cogniva-wu5f.onrender.com/api/flashcards/review', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          flashcardId: currentCard._id,
          rating,
          responseTimeMs: timeTakenMs
        })
      })
    } catch (error) {
      console.error('Failed to submit review', error)
    }
  }

  const activeCard = queue[currentIndex]

  if (loading) {
    return <AppLayout title="Revision Deck" description=""><p>Loading queue...</p></AppLayout>
  }

  if (!activeCard) {
    return (
      <AppLayout title="Revision Deck" description="Adaptive Spaced Repetition">
        <div className="max-w-2xl mx-auto mt-20 text-center">
          <div className="inline-flex size-20 items-center justify-center rounded-full bg-emerald-500/10 mb-6">
            <span className="text-4xl">🎉</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight mb-2">You're all caught up!</h2>
          <p className="text-muted-foreground text-lg mb-8">You've completed all your scheduled reviews for today.</p>
          <Button onClick={fetchQueue}>Refresh Queue</Button>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Revision Deck" description="Adaptive Spaced Repetition">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex justify-between text-sm font-medium text-muted-foreground mb-4">
          <span>Card {currentIndex + 1} of {queue.length}</span>
          <span className="text-primary font-bold">
            Weakness Score: {activeCard.reviewState.weaknessScore.toFixed(1)}
          </span>
        </div>

        <Card className="min-h-[300px] flex flex-col shadow-lg border-primary/20">
          <CardContent className="flex-1 flex flex-col justify-center items-center p-8 text-center">
            <span className="text-xs font-bold px-2 py-1 bg-muted rounded-md uppercase tracking-wider mb-6 self-start">
              {activeCard.type}
            </span>
            
            <h3 className="text-2xl font-semibold leading-relaxed mb-8">
              {activeCard.front}
            </h3>

            {showAnswer ? (
              <div className="w-full mt-4 pt-8 border-t border-dashed animate-in fade-in slide-in-from-bottom-4">
                <p className="text-xl font-medium text-primary">{activeCard.back}</p>
              </div>
            ) : (
              <Button size="lg" className="mt-8 w-48" onClick={handleReveal}>
                Show Answer
              </Button>
            )}
          </CardContent>

          {showAnswer && (
            <div className="grid grid-cols-4 gap-2 p-4 bg-muted/30 border-t">
              <Button variant="outline" className="border-red-500/50 hover:bg-red-500/10 hover:text-red-600 flex flex-col h-16" onClick={() => handleRating(1)}>
                <span className="font-bold">Again</span>
                <span className="text-xs text-muted-foreground font-normal">&lt; 1 min</span>
              </Button>
              <Button variant="outline" className="border-orange-500/50 hover:bg-orange-500/10 hover:text-orange-600 flex flex-col h-16" onClick={() => handleRating(2)}>
                <span className="font-bold">Hard</span>
                <span className="text-xs text-muted-foreground font-normal">Slow/Unsure</span>
              </Button>
              <Button variant="outline" className="border-blue-500/50 hover:bg-blue-500/10 hover:text-blue-600 flex flex-col h-16" onClick={() => handleRating(3)}>
                <span className="font-bold">Good</span>
                <span className="text-xs text-muted-foreground font-normal">Normal</span>
              </Button>
              <Button variant="outline" className="border-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-600 flex flex-col h-16" onClick={() => handleRating(4)}>
                <span className="font-bold">Easy</span>
                <span className="text-xs text-muted-foreground font-normal">Instant</span>
              </Button>
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  )
}
