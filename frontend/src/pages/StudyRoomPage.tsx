import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { io, Socket } from 'socket.io-client'
import { getRoom, uploadRoomPdf } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, Send, Users, ArrowLeft, ChevronLeft, ChevronRight, FileUp, FolderOpen, FileText, Layers, Sparkles, ChevronDown, CheckCircle2, XCircle, ArrowRight, X, MoreVertical, MessageSquare } from 'lucide-react'
import { generateRoomFlashcards } from '@/lib/api'
import { Tldraw } from '@tldraw/tldraw'
import '@tldraw/tldraw/tldraw.css'
import { API_BASE_URL } from '@/lib/api'

// Setup pdf.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface Message {
  sender_id: string | null
  sender_name: string
  message: string
  timestamp: string
  is_ai: boolean
}

export function StudyRoomPage() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  
  const [socket, setSocket] = useState<Socket | null>(null)
  const [room, setRoom] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState(1)

  const [uploadingPdf, setUploadingPdf] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [activeMembers, setActiveMembers] = useState<any[]>([])
  const [flashcardStatus, setFlashcardStatus] = useState<'idle' | 'generating' | 'saved'>('idle')
  const [isFlashcardOpen, setIsFlashcardOpen] = useState(false)
  const [flashcards, setFlashcards] = useState<any[]>([])
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [activeTab, setActiveTab] = useState<'pdf' | 'whiteboard'>('pdf')
  const [showLeftSidebar, setShowLeftSidebar] = useState(false)
  const [showChatSidebar, setShowChatSidebar] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState<number | undefined>(undefined)

  useEffect(() => {
    if (!containerRef.current) return

    const resizeObserver = new ResizeObserver((entries) => {
      if (entries[0]) {
        // Subtract some padding/margins
        setContainerWidth(entries[0].contentRect.width - 24)
      }
    })

    resizeObserver.observe(containerRef.current)
    return () => resizeObserver.disconnect()
  }, [activeTab])

  const isOwner = profile?.id && room?.creator_id?._id && profile.id === room.creator_id._id

  useEffect(() => {
    let activeSocket: Socket | null = null
    let isMounted = true

    async function initRoom() {
      if (!roomId) return
      try {
        const roomData = await getRoom(roomId)
        if (!isMounted) return
        setRoom(roomData)
        setMessages(roomData.chat_history || [])
        if (roomData.generated_flashcards && roomData.generated_flashcards.length > 0) {
          setFlashcards(roomData.generated_flashcards)
          setFlashcardStatus('saved')
        }
        if (roomData.current_page) {
          setPageNumber(roomData.current_page)
        }

        // Initialize Socket
        const newSocket = io(API_BASE_URL)
        activeSocket = newSocket
        setSocket(newSocket)

        newSocket.emit('join_room', { room_code: roomId, user: profile })

        newSocket.on('new_message', (msg: Message) => {
          setMessages(prev => [...prev, msg])
          setTimeout(() => {
            scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
          }, 100)
        })

        newSocket.on('pdf_page_changed', ({ pageNumber: newPage }) => {
          setPageNumber(newPage)
        })

        newSocket.on('pdf_url_changed', ({ pdf_url }) => {
          setRoom((prev: any) => ({ ...prev, pdf_url }))
          setPageNumber(1)
        })

        newSocket.on('room_members_update', (members: any[]) => {
          const uniqueMembers = Array.from(
            new Map(members.map(m => [m._id || m.id, m])).values()
          )
          setActiveMembers(uniqueMembers)
        })

      } catch (err) {
        toast.error('Failed to load room')
        navigate('/rooms')
      } finally {
        setLoading(false)
      }
    }
    
    if (profile) {
      initRoom()
    }

    return () => {
      isMounted = false
      if (activeSocket) {
        activeSocket.emit('leave_room', { room_code: roomId, user: profile })
        activeSocket.disconnect()
      }
    }
  }, [roomId, profile])

  useEffect(() => {
    // Scroll to bottom on load
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [loading])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !socket) return

    socket.emit('send_message', {
      room_code: roomId,
      user: profile,
      message: newMessage
    })
    setNewMessage('')
  }

  const getAvatarForMessage = (senderId: string | null, isAi: boolean, senderName: string) => {
    if (isAi) {
      return (
        <div className="size-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 border border-primary/30 mt-4">
          <span className="text-[10px]">🤖</span>
        </div>
      )
    }
    const member = activeMembers.find(m => (m._id || m.id) === senderId)
    if (member && member.avatar_url) {
      return <img src={member.avatar_url} alt={senderName} className="size-6 rounded-full object-cover shrink-0 mt-4" />
    }
    return (
      <div className="size-6 rounded-full bg-muted flex items-center justify-center shrink-0 text-[10px] font-bold uppercase text-muted-foreground border border-border mt-4">
        {(senderName || '?').substring(0, 2)}
      </div>
    )
  }

  const changePage = (offset: number) => {
    const newPage = pageNumber + offset
    if (newPage >= 1 && newPage <= numPages) {
      setPageNumber(newPage)
      if (socket) {
        socket.emit('sync_pdf_page', { room_code: roomId, pageNumber: newPage })
      }
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !roomId) return

    setUploadingPdf(true)
    try {
      const data = await uploadRoomPdf(roomId, file)
      setRoom((prev: any) => ({ ...prev, pdf_url: data.pdf_url }))
      setPageNumber(1)
      if (socket) {
        socket.emit('sync_pdf_url', { room_code: roomId, pdf_url: data.pdf_url })
      }
      toast.success('PDF uploaded successfully')
    } catch (err) {
      toast.error('Failed to upload PDF')
    } finally {
      setUploadingPdf(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleGenerateFlashcards = async () => {
    if (!roomId) return
    setFlashcardStatus('generating')
    try {
      const data = await generateRoomFlashcards(roomId)
      setFlashcards(data.data)
      setFlashcardStatus('saved')
      toast.success('Flashcards generated successfully!')
    } catch (err) {
      toast.error('Failed to generate flashcards')
      setFlashcardStatus('idle')
    }
  }

  if (loading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="size-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Header */}
      <header className="flex h-14 items-center justify-between border-b px-4 shrink-0 bg-card">
        <div className="flex items-center gap-2 md:gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/rooms')}>
            <ArrowLeft className="size-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden" 
            onClick={() => {
              setShowLeftSidebar(true)
              setShowChatSidebar(false)
            }}
          >
            <FolderOpen className="size-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="font-semibold truncate max-w-[120px] sm:max-w-none">{room?.name}</h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Room Code: <span className="font-mono text-primary font-bold">{room?.room_code}</span></p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2 hidden sm:flex">
            <Users className="size-4" /> Invite
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden text-primary" 
            onClick={() => {
              setShowChatSidebar(true)
              setShowLeftSidebar(false)
            }}
          >
            <MessageSquare className="size-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Backdrops for mobile view */}
        {showLeftSidebar && (
          <div 
            className="fixed inset-0 z-40 bg-black/50 md:hidden" 
            onClick={() => setShowLeftSidebar(false)}
          />
        )}
        {showChatSidebar && (
          <div 
            className="fixed inset-0 z-40 bg-black/50 md:hidden" 
            onClick={() => setShowChatSidebar(false)}
          />
        )}

        {/* Left Sidebar: Members & Resources */}
        <div className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-card border-r p-4 overflow-y-auto flex flex-col transition-transform duration-300 ease-in-out shrink-0
          ${showLeftSidebar ? 'translate-x-0' : '-translate-x-full'}
          md:relative md:translate-x-0 md:flex md:h-auto md:z-0
        `}>
          {/* Mobile Close Button */}
          <div className="flex justify-between items-center md:hidden mb-4 shrink-0">
            <span className="font-semibold text-sm">Room Menu</span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowLeftSidebar(false)}>
              <X className="size-4" />
            </Button>
          </div>
          {/* Active Members */}
          <div className="mb-8">
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-4">Active Members</h3>
            <div className="space-y-4">
              {activeMembers.map((member, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="relative">
                    {member.avatar_url ? (
                      <img src={member.avatar_url} alt={member.full_name || member.name} className="size-8 rounded-full border border-primary/20 object-cover" />
                    ) : (
                      <div className="flex items-center justify-center size-8 rounded-full bg-primary/20 text-primary text-xs font-bold uppercase">
                        {(member.full_name || member.name || '?').substring(0, 2)}
                      </div>
                    )}
                    <div className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500 border-2 border-card" />
                  </div>
                  <span className="text-sm font-medium">{member.full_name || member.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Resources */}
          <div className="flex-1">
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-4">Resources</h3>
            <div className="space-y-1">
              <div className="bg-primary/10 rounded-lg p-2 flex flex-col">
                <div className="flex items-center justify-between text-primary">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="size-4" />
                    <span className="text-sm font-medium">PDFs</span>
                  </div>
                  <ChevronDown className="size-4" />
                </div>
                
                <div className="mt-2 ml-4 flex flex-col gap-2">
                  {room?.pdf_url ? (
                    <div className="flex items-center gap-2 text-primary cursor-pointer hover:underline">
                      <FileText className="size-3.5" />
                      <span className="text-xs truncate max-w-[140px]" title={room.pdf_url.split('/').pop()}>{decodeURIComponent(room.pdf_url.split('/').pop() || 'Document.pdf')}</span>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground italic">No PDF uploaded</div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 mt-2 text-muted-foreground hover:text-foreground cursor-pointer transition-colors rounded-lg hover:bg-muted/50">
                <FileText className="size-4" />
                <span className="text-sm">Notes</span>
              </div>
              
              {flashcardStatus === 'idle' && (
                <div 
                  className="flex items-center gap-2 p-2 text-muted-foreground hover:text-foreground cursor-pointer transition-colors rounded-lg hover:bg-muted/50"
                  onClick={handleGenerateFlashcards}
                >
                  <Layers className="size-4" />
                  <span className="text-sm">Flashcards</span>
                </div>
              )}

              {flashcardStatus === 'generating' && (
                <div className="flex items-center gap-3 p-3 mt-2 bg-muted/40 rounded-lg border border-primary/20">
                  <Loader2 className="size-4 animate-spin text-primary shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">Generating Flashcards...</span>
                    <span className="text-xs text-muted-foreground">based on 1 source</span>
                  </div>
                </div>
              )}

              {flashcardStatus === 'saved' && (
                <Dialog open={isFlashcardOpen} onOpenChange={setIsFlashcardOpen}>
                  <DialogTrigger asChild>
                    <div className="flex items-center justify-between p-3 mt-2 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer rounded-lg border border-border group">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded bg-primary/10 text-primary">
                          <Layers className="size-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">Algorithm Flashcards</span>
                          <span className="text-xs text-muted-foreground">1 source &middot; just now</span>
                        </div>
                      </div>
                      <MoreVertical className="size-4 text-muted-foreground" />
                    </div>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px] bg-[#2D333B] border-border text-foreground p-0 overflow-hidden hide-close-button">
                    {/* Flashcard Viewer Modal UI */}
                    <div className="flex flex-col h-[500px]">
                      {/* Header */}
                      <div className="flex items-center justify-between p-4 border-b border-border/50">
                        <div className="flex items-center gap-3">
                          <h2 className="text-lg font-semibold">Algorithm Flashcards</h2>
                          <Badge variant="outline" className="bg-background/50">View 1 source</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-foreground">
                            <Sparkles className="size-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-foreground">
                            <MoreVertical className="size-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-foreground" onClick={() => setIsFlashcardOpen(false)}>
                            <X className="size-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Flashcard Body */}
                      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-transparent to-primary/5">
                        <p className="text-xs text-muted-foreground mb-4">Press "Space" to flip, "← / →" to navigate</p>
                        
                        <div className="w-full flex-1 max-h-[300px] bg-[#22272E] rounded-xl border border-border shadow-lg p-6 flex flex-col relative group">
                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                            <span>{currentFlashcardIndex + 1} / {flashcards.length}</span>
                            <MoreVertical className="size-4 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" />
                          </div>
                          
                          <div className="flex-1 flex items-center justify-center text-center">
                            <h3 className="text-xl font-medium leading-relaxed">
                              {showAnswer ? flashcards[currentFlashcardIndex]?.answer : flashcards[currentFlashcardIndex]?.question}
                            </h3>
                          </div>
                          
                          <div 
                            className="text-center text-sm text-muted-foreground mt-4 cursor-pointer hover:text-foreground transition-colors"
                            onClick={() => setShowAnswer(!showAnswer)}
                          >
                            {showAnswer ? 'See question' : 'See answer'}
                          </div>
                        </div>
                        
                        {/* Controls */}
                        <div className="flex items-center gap-4 mt-8">
                          <Button 
                            variant="outline" size="icon" className="rounded-full size-12 border-border/50 bg-[#22272E] hover:bg-muted"
                            onClick={() => {
                              setCurrentFlashcardIndex(Math.max(0, currentFlashcardIndex - 1))
                              setShowAnswer(false)
                            }}
                            disabled={currentFlashcardIndex === 0}
                          >
                            <ArrowLeft className="size-5" />
                          </Button>
                          <Button variant="outline" className="rounded-full h-12 px-6 border-destructive/20 text-destructive bg-destructive/5 hover:bg-destructive/10 hover:text-destructive">
                            <XCircle className="size-5 mr-2" /> 0
                          </Button>
                          <Button variant="outline" className="rounded-full h-12 px-6 border-emerald-500/20 text-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/10 hover:text-emerald-500">
                            0 <CheckCircle2 className="size-5 ml-2" />
                          </Button>
                          <Button 
                            variant="outline" size="icon" className="rounded-full size-12 border-border/50 bg-[#22272E] hover:bg-muted"
                            onClick={() => {
                              setCurrentFlashcardIndex(Math.min(flashcards.length - 1, currentFlashcardIndex + 1))
                              setShowAnswer(false)
                            }}
                            disabled={currentFlashcardIndex === flashcards.length - 1}
                          >
                            <ArrowRight className="size-5 text-primary" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Footer Feedback */}
                      <div className="p-4 border-t border-border/50 flex gap-2">
                        <Button variant="outline" size="sm" className="bg-[#22272E] border-border/50 hover:bg-muted">
                          👍 Good content
                        </Button>
                        <Button variant="outline" size="sm" className="bg-[#22272E] border-border/50 hover:bg-muted">
                          👎 Bad content
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t">
            <Button variant="outline" className="w-full gap-2 bg-transparent hover:bg-primary/10 border-muted">
              <Sparkles className="size-4 text-cyan-400" />
              Generate Quiz
            </Button>
          </div>
        </div>

        {/* PDF Viewer (Center/Main) */}
        <div ref={containerRef} className="flex-1 flex flex-col bg-muted/10 relative overflow-hidden">
          {/* Main Area Tabs */}
          <div className="flex items-center justify-center border-b bg-card shrink-0 p-2 gap-4">
            <Button 
              variant={activeTab === 'pdf' ? 'secondary' : 'ghost'} 
              size="sm" 
              onClick={() => setActiveTab('pdf')}
              className="w-32"
            >
              PDF Viewer
            </Button>
            <Button 
              variant={activeTab === 'whiteboard' ? 'secondary' : 'ghost'} 
              size="sm" 
              onClick={() => setActiveTab('whiteboard')}
              className="w-32"
            >
              Whiteboard
            </Button>
          </div>

          {activeTab === 'pdf' ? (
            room?.pdf_url ? (
              <div className="flex-1 flex flex-col h-full overflow-hidden">
              <div className="flex items-center justify-between gap-4 p-2 bg-background border-b shrink-0 z-10 shadow-sm">
                <div className="flex items-center gap-2">
                  {isOwner && (
                    <>
                      <input type="file" accept="application/pdf" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                      <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploadingPdf}>
                        {uploadingPdf ? <Loader2 className="size-4 animate-spin mr-2" /> : <FileUp className="size-4 mr-2" />} Change PDF
                      </Button>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <Button variant="outline" size="sm" onClick={() => changePage(-1)} disabled={pageNumber <= 1}>
                    <ChevronLeft className="size-4" /> Prev
                  </Button>
                  <span className="text-sm font-medium">Page {pageNumber} of {numPages || '--'}</span>
                  <Button variant="outline" size="sm" onClick={() => changePage(1)} disabled={pageNumber >= numPages}>
                    Next <ChevronRight className="size-4" />
                  </Button>
                </div>
                <div className="w-[100px]" /> {/* Spacer to balance flex-between */}
              </div>
              <div className="flex-1 overflow-auto flex items-start justify-center p-4">
                <Document
                  file={room.pdf_url}
                  onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                  loading={<Loader2 className="size-8 animate-spin text-primary my-10" />}
                  error={<div className="text-destructive mt-10">Failed to load PDF. Check if the URL is accessible via CORS.</div>}
                >
                  <Page 
                    pageNumber={pageNumber} 
                    renderTextLayer={true} 
                    renderAnnotationLayer={true}
                    className="max-w-full shadow-xl animate-in fade-in zoom-in-95 duration-200"
                    width={containerWidth}
                  />
                </Document>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center flex-col text-muted-foreground p-8 text-center">
              {isOwner ? (
                <div className="space-y-4 flex flex-col items-center">
                  <div className="p-4 rounded-full bg-primary/10">
                    <FileUp className="size-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">Upload a PDF to start</h3>
                  <p className="text-sm">As the room owner, you can upload a document for everyone to study together.</p>
                  
                  <input type="file" accept="application/pdf" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                  <Button onClick={() => fileInputRef.current?.click()} disabled={uploadingPdf} size="lg" className="mt-4">
                    {uploadingPdf ? <Loader2 className="size-4 animate-spin mr-2" /> : <FileUp className="size-4 mr-2" />} 
                    {uploadingPdf ? 'Uploading...' : 'Choose PDF File'}
                  </Button>
                </div>
              ) : (
                <>
                  <p>No PDF was uploaded for this room.</p>
                  <p className="text-sm mt-2">Waiting for the room owner to upload a document...</p>
                  <p className="text-sm mt-4">Use the chat to discuss topics instead.</p>
                </>
              )}
            </div>
          )
          ) : (
            <div className="flex-1 w-full h-full relative z-0">
              <Tldraw persistenceKey={`room-whiteboard-${roomId}`} />
            </div>
          )}
        </div>

        {/* Chat Sidebar (Right) */}
        <div className={`
          fixed inset-y-0 right-0 z-50 w-80 bg-card border-l overflow-hidden flex flex-col transition-transform duration-300 ease-in-out shrink-0
          ${showChatSidebar ? 'translate-x-0' : 'translate-x-full'}
          md:relative md:translate-x-0 md:flex md:h-auto md:z-0
        `}>
          <div className="p-3 border-b flex justify-between items-center bg-muted/20 shrink-0">
            <div>
              <h2 className="font-semibold text-sm">Room Chat</h2>
              <p className="text-xs text-muted-foreground">Tag <span className="text-primary font-medium">@tutor</span> to ask AI</p>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden" onClick={() => setShowChatSidebar(false)}>
              <X className="size-4" />
            </Button>
          </div>
          
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex w-full ${msg.sender_id === profile?.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex gap-2 max-w-[90%] ${msg.sender_id === profile?.id ? 'flex-row-reverse' : 'flex-row'}`}>
                    {getAvatarForMessage(msg.sender_id, msg.is_ai, msg.sender_name)}
                    <div className={`flex flex-col ${msg.sender_id === profile?.id ? 'items-end' : 'items-start'}`}>
                      <span className="text-[10px] text-muted-foreground mb-1">{msg.is_ai ? 'AI Tutor' : msg.sender_name}</span>
                      <div className={`px-3 py-2 text-sm ${
                        msg.is_ai 
                          ? 'bg-primary/20 text-foreground border border-primary/30 rounded-2xl rounded-tl-sm' 
                          : msg.sender_id === profile?.id 
                            ? 'bg-primary text-primary-foreground rounded-2xl rounded-tr-sm' 
                            : 'bg-muted rounded-2xl rounded-tl-sm'
                      }`}>
                        {msg.message}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          <form onSubmit={handleSendMessage} className="p-3 border-t bg-background flex gap-2 shrink-0">
            <Input 
              placeholder="Type a message... (@tutor for AI)" 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={!newMessage.trim()}>
              <Send className="size-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
