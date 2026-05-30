import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Users, LogIn, Plus } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { createRoom } from '@/lib/api'
import { toast } from 'sonner'

export function RoomsDashboard() {
  const navigate = useNavigate()
  const [joinCode, setJoinCode] = useState('')
  const [roomName, setRoomName] = useState('')
  const [pdfUrl, setPdfUrl] = useState('')
  const [loading, setLoading] = useState(false)

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!joinCode) return
    navigate(`/rooms/${joinCode.toUpperCase()}`)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!roomName) return
    
    setLoading(true)
    try {
      const room = await createRoom(roomName, pdfUrl)
      toast.success('Room created successfully!')
      navigate(`/rooms/${room.room_code}`)
    } catch (err) {
      toast.error('Failed to create room')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppLayout title="Study Rooms" description="Collaborate with peers in real-time.">
      <div className="max-w-4xl mx-auto space-y-8 mt-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Collaborative Study Rooms</h1>
          <p className="text-muted-foreground">Join a room to study together, view PDFs synchronously, and chat with peers & our AI Tutor.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
          {/* Join Room Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <LogIn className="size-5 text-primary" />
                </div>
                <CardTitle>Join a Room</CardTitle>
              </div>
              <CardDescription>Have a code from a friend? Enter it below to join their study session.</CardDescription>
            </CardHeader>
            <form onSubmit={handleJoin}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="room-code">Room Code</Label>
                  <Input 
                    id="room-code" 
                    placeholder="e.g. A1B2C3" 
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    className="uppercase"
                    maxLength={6}
                  />
                </div>
              </CardContent>
              <CardFooter className="pt-8">
                <Button type="submit" className="w-full" disabled={!joinCode || joinCode.length < 5}>
                  Join Room
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* Create Room Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <Plus className="size-5 text-emerald-500" />
                </div>
                <CardTitle>Create a Room</CardTitle>
              </div>
              <CardDescription>Start a new study session and invite others to join.</CardDescription>
            </CardHeader>
            <form onSubmit={handleCreate}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="room-name">Room Name</Label>
                  <Input 
                    id="room-name" 
                    placeholder="e.g. Physics 101 Midterm Prep" 
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pdf-url">PDF URL (Optional)</Label>
                  <Input 
                    id="pdf-url" 
                    placeholder="https://example.com/document.pdf" 
                    type="url"
                    value={pdfUrl}
                    onChange={(e) => setPdfUrl(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Provide a public link to a PDF to study together.</p>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" variant="secondary" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white" disabled={!roomName || loading}>
                  {loading ? 'Creating...' : 'Create Room'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
