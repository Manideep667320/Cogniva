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
  Plus,
  Link as LinkIcon,
  Globe,
  Video
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { AppLayout } from '@/components/layout/AppLayout'
import { getUploads, uploadFile, deleteUpload, uploadUrlResource } from '@/lib/api'
import { formatDistanceToNow } from 'date-fns'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'

interface UploadRecord {
  _id: string
  original_name: string
  file_size: number
  status: 'uploaded' | 'extracting' | 'chunking' | 'embedding' | 'generating_tree' | 'completed' | 'error'
  error_message?: string
  created_at: string
  mime_type?: string
  filename?: string
  url?: string
}

export function ResourcesPage() {
  const [uploads, setUploads] = useState<UploadRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [search, setSearch] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // URL Resource States
  const [urlVal, setUrlVal] = useState('')
  const [urlTitle, setUrlTitle] = useState('')
  const [urlUploading, setUrlUploading] = useState(false)

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
      toast.success('File uploaded successfully! AI ingestion initiated.')
      loadUploads()
    } catch (err) {
      console.error('Upload failed:', err)
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleUrlSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!urlVal.trim()) {
      toast.error('Please enter a valid URL')
      return
    }

    setUrlUploading(true)
    try {
      const title = urlTitle.trim() || 'URL Resource'
      await uploadUrlResource(urlVal.trim(), title)
      toast.success('URL registered successfully! AI ingestion initiated.')
      setUrlVal('')
      setUrlTitle('')
      loadUploads()
    } catch (err: any) {
      console.error('URL resource upload failed:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to register URL resource')
    } finally {
      setUrlUploading(false)
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

  const formatSize = (bytes: number, upload: UploadRecord) => {
    if (upload.mime_type === 'text/html' || upload.filename?.startsWith('url_')) {
      return 'Web Link'
    }
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  return (
    <AppLayout 
      title="Knowledge Base" 
      description="Manage the research papers, documents, and online media resources that power your AI Tutor."
    >
      <div className="flex flex-col gap-6">
        <Tabs defaultValue="file" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mb-4 bg-muted/60">
            <TabsTrigger value="file">
              <UploadIcon className="size-4 mr-2" /> Upload File
            </TabsTrigger>
            <TabsTrigger value="url">
              <LinkIcon className="size-4 mr-2" /> Add URL / Media Link
            </TabsTrigger>
          </TabsList>

          <TabsContent value="file">
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
          </TabsContent>

          <TabsContent value="url">
            {/* URL Input Form */}
            <Card className="border-dashed border-2 bg-muted/30">
              <CardContent className="py-8 px-6">
                <form onSubmit={handleUrlSubmit} className="space-y-4 max-w-2xl mx-auto">
                  <div className="text-center mb-6">
                    <div className="flex size-14 items-center justify-center rounded-2xl brand-gradient mb-3 shadow-lg shadow-primary/20 mx-auto">
                      {urlUploading ? <Loader2 className="size-7 text-white animate-spin" /> : <LinkIcon className="size-7 text-white" />}
                    </div>
                    <h3 className="font-semibold text-lg">Add Web URL or Recorded Video</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Add YouTube videos, Loom recordings, web articles, or lecture URLs. The AI will scrape and learn from the text content.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="url-input" className="text-sm font-semibold text-foreground">
                      Resource URL <span className="text-destructive">*</span>
                    </label>
                    <Input 
                      id="url-input"
                      type="url"
                      placeholder="https://www.youtube.com/watch?v=... or https://loom.com/..."
                      value={urlVal}
                      onChange={(e) => setUrlVal(e.target.value)}
                      required
                      className="bg-background"
                      disabled={urlUploading}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="url-title" className="text-sm font-semibold text-foreground">
                      Resource Title (Optional)
                    </label>
                    <Input 
                      id="url-title"
                      type="text"
                      placeholder="e.g. Introduction to Neural Networks"
                      value={urlTitle}
                      onChange={(e) => setUrlTitle(e.target.value)}
                      className="bg-background"
                      disabled={urlUploading}
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={urlUploading}
                      className="brand-gradient text-white border-0 px-8 w-full sm:w-auto"
                    >
                      {urlUploading ? (
                        <><Loader2 className="size-4 animate-spin mr-2" /> Scraping & Ingesting...</>
                      ) : (
                        <><Plus className="size-4 mr-2" /> Add URL Resource</>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* List Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-xl font-bold tracking-tight">Your Resources</h2>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input 
                placeholder="Search resources..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 w-full"
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
                const isUrl = upload.mime_type === 'text/html' || upload.filename?.startsWith('url_')
                const isYoutube = isUrl && (
                  upload.url?.includes('youtube.com') || 
                  upload.url?.includes('youtu.be') || 
                  upload.original_name.toLowerCase().includes('youtube')
                )
                const isRecorded = isUrl && !isYoutube && (
                  upload.url?.includes('loom.com') ||
                  upload.url?.includes('vimeo') ||
                  upload.url?.includes('drive.google')
                )

                // Select Icon
                let ResourceIcon = File
                let iconColor = 'text-primary'
                let iconBg = 'bg-primary/10'

                if (isYoutube) {
                  ResourceIcon = Video
                  iconColor = 'text-red-500'
                  iconBg = 'bg-red-500/10'
                } else if (isRecorded) {
                  ResourceIcon = Video
                  iconColor = 'text-amber-500'
                  iconBg = 'bg-amber-500/10'
                } else if (isUrl) {
                  ResourceIcon = LinkIcon
                  iconColor = 'text-blue-500'
                  iconBg = 'bg-blue-500/10'
                }

                return (
                  <Card key={upload._id} className="overflow-hidden hover:shadow-md transition-shadow group">
                    <CardContent className="p-0">
                      <div className="flex items-center gap-4 p-4">
                        <div className={`flex size-10 items-center justify-center rounded-lg ${iconBg} shrink-0`}>
                          <ResourceIcon className={`size-5 ${iconColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold truncate max-w-[200px] sm:max-w-[400px]">
                              {upload.original_name}
                            </h4>
                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 shrink-0 ${status.bg} ${status.color} border-0`}>
                              <status.icon className={`size-2.5 mr-1 ${status.spin ? 'animate-spin' : ''}`} />
                              {status.label}
                            </Badge>
                          </div>
                          {upload.url && (
                            <a 
                              href={upload.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline block truncate max-w-[200px] sm:max-w-[400px] mt-0.5"
                            >
                              {upload.url}
                            </a>
                          )}
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-muted-foreground">{formatSize(upload.file_size, upload)}</span>
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
                          className="text-muted-foreground hover:text-destructive opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
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
