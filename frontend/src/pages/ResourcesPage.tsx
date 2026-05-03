import { useEffect, useState, useRef } from 'react'
import { 
  Upload as UploadIcon, 
  File, 
  Trash2, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Search,
  Plus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { AppLayout } from '@/components/layout/AppLayout'
import { getUploads, uploadFile, deleteUpload } from '@/lib/api'
import { formatDistanceToNow } from 'date-fns'

interface UploadRecord {
  _id: string
  original_name: string
  file_size: number
  status: 'uploaded' | 'extracting' | 'chunking' | 'embedding' | 'generating_tree' | 'completed' | 'error'
  error_message?: string
  created_at: string
}

export function ResourcesPage() {
  const [uploads, setUploads] = useState<UploadRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [search, setSearch] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadUploads()
    const interval = setInterval(loadUploads, 5000) // Poll for status updates
    return () => clearInterval(interval)
  }, [])

  async function loadUploads() {
    try {
      const data = await getUploads()
      setUploads(data)
    } catch (err) {
      console.error('Failed to load uploads:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      await uploadFile(file)
      loadUploads()
    } catch (err) {
      console.error('Upload failed:', err)
      alert(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Are you sure you want to delete this resource? This will also remove associated AI training data.')) return
    try {
      await deleteUpload(id)
      setUploads(uploads.filter(u => u._id !== id))
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  const filtered = uploads.filter(u => 
    u.original_name.toLowerCase().includes(search.toLowerCase())
  )

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'completed':
        return { label: 'Ready', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' }
      case 'error':
        return { label: 'Error', icon: AlertCircle, color: 'text-destructive', bg: 'bg-destructive/10' }
      case 'uploaded':
        return { label: 'Queued', icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted' }
      default:
        return { label: 'Processing', icon: Loader2, color: 'text-blue-500', bg: 'bg-blue-500/10', spin: true }
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  return (
    <AppLayout 
      title="Knowledge Base" 
      description="Manage the research papers and documents that power your AI Tutor."
    >
      <div className="flex flex-col gap-6">
        {/* Upload Card */}
        <Card className="border-dashed border-2 bg-muted/30">
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl brand-gradient mb-4 shadow-lg shadow-primary/20">
              {uploading ? <Loader2 className="size-7 text-white animate-spin" /> : <UploadIcon className="size-7 text-white" />}
            </div>
            <div className="max-w-xs space-y-2">
              <h3 className="font-semibold text-lg">{uploading ? 'Processing Resource...' : 'Upload Knowledge Source'}</h3>
              <p className="text-sm text-muted-foreground">
                Upload PDFs, Text files, or Markdown papers. The AI will learn from these to tutor your students.
              </p>
            </div>
            <div className="mt-6">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept=".pdf,.txt,.md"
              />
              <Button 
                onClick={() => fileInputRef.current?.click()} 
                disabled={uploading}
                className="brand-gradient text-white border-0 px-8"
              >
                {uploading ? 'Uploading...' : <><Plus className="size-4 mr-2" /> Select File</>}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* List Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight">Your Resources</h2>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input 
                placeholder="Search resources..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>

          <div className="grid gap-3">
            {loading ? (
              [1, 2, 3].map(i => <div key={i} className="h-20 w-full animate-pulse bg-muted rounded-xl" />)
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center border rounded-xl bg-muted/20">
                <File className="size-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">No resources found</p>
              </div>
            ) : (
              filtered.map((upload) => {
                const status = getStatusInfo(upload.status)
                return (
                  <Card key={upload._id} className="overflow-hidden hover:shadow-md transition-shadow group">
                    <CardContent className="p-0">
                      <div className="flex items-center gap-4 p-4">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                          <File className="size-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold truncate max-w-[300px]">{upload.original_name}</h4>
                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 ${status.bg} ${status.color} border-0`}>
                              <status.icon className={`size-2.5 mr-1 ${status.spin ? 'animate-spin' : ''}`} />
                              {status.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-muted-foreground">{formatSize(upload.file_size)}</span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(upload.created_at))} ago
                            </span>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDelete(upload._id)}
                          className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                      {upload.status !== 'completed' && upload.status !== 'error' && (
                        <Progress value={45} className="h-0.5 rounded-none" />
                      )}
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
