import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, X, Edit2, Save } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

interface Flashcard {
  _id: string
  type: 'QA' | 'CLOZE' | 'CONCEPT'
  front: string
  back: string
  status: 'draft' | 'approved' | 'rejected'
}

export function FlashcardStudio() {
  const [drafts, setDrafts] = useState<Flashcard[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editFront, setEditFront] = useState('')
  const [editBack, setEditBack] = useState('')

  useEffect(() => {
    fetchDrafts()
  }, [])

  const fetchDrafts = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('https://cogniva-wu5f.onrender.com/api/flashcards/drafts', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        setDrafts(data.drafts)
      }
    } catch (error) {
      console.error('Failed to fetch drafts', error)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const token = localStorage.getItem('token')
      const body: any = { status }
      
      if (editingId === id) {
        body.front = editFront
        body.back = editBack
      }

      await fetch(`https://cogniva-wu5f.onrender.com/api/flashcards/${id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      setDrafts(drafts.filter(d => d._id !== id))
      setEditingId(null)
    } catch (error) {
      console.error('Failed to update status', error)
    }
  }

  const startEditing = (card: Flashcard) => {
    setEditingId(card._id)
    setEditFront(card.front)
    setEditBack(card.back)
  }

  return (
    <AppLayout title="Flashcard Studio" description="Review and approve AI-generated flashcards">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Pending Validation</h2>
            <p className="text-muted-foreground">Review cards extracted from your latest lectures.</p>
          </div>
          <div className="px-4 py-2 bg-primary/10 text-primary rounded-lg font-semibold">
            {drafts.length} Drafts
          </div>
        </div>

        {loading ? (
          <p>Loading drafts...</p>
        ) : drafts.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-xl">
            <h3 className="text-lg font-semibold">All caught up!</h3>
            <p className="text-muted-foreground mt-1">No pending flashcards to review.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {drafts.map(card => (
              <Card key={card._id} className={editingId === card._id ? 'border-primary' : ''}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold px-2 py-1 bg-muted rounded-md uppercase tracking-wider">
                      {card.type}
                    </span>
                    {editingId !== card._id && (
                      <Button variant="ghost" size="sm" onClick={() => startEditing(card)}>
                        <Edit2 className="size-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {editingId === card._id ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground">Front</label>
                        <Textarea 
                          value={editFront} 
                          onChange={e => setEditFront(e.target.value)} 
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground">Back</label>
                        <Input 
                          value={editBack} 
                          onChange={e => setEditBack(e.target.value)} 
                          className="mt-1"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase">Front</p>
                        <p className="text-lg mt-1">{card.front}</p>
                      </div>
                      <div className="bg-muted/50 p-3 rounded-lg border border-border/50">
                        <p className="text-xs font-semibold text-muted-foreground uppercase">Back</p>
                        <p className="font-medium mt-1">{card.back}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-end gap-2 bg-muted/20 border-t pt-4">
                  <Button 
                    variant="outline" 
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => updateStatus(card._id, 'rejected')}
                  >
                    <X className="size-4 mr-2" /> Reject
                  </Button>
                  <Button 
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => updateStatus(card._id, 'approved')}
                  >
                    {editingId === card._id ? <Save className="size-4 mr-2" /> : <Check className="size-4 mr-2" />}
                    {editingId === card._id ? 'Save & Approve' : 'Approve'}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
