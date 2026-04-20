import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, CheckCircle2, Loader2, AlertCircle, X, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { uploadFile, getUploadStatus, getUploads } from '@/lib/api'
import { useEffect } from 'react'

interface UploadRecord {
  _id: string
  original_name: string
  file_size: number
  status: string
  skill_tree_id?: string
  error_message?: string
  created_at: string
}

const STATUS_MAP: Record<string, { label: string; progress: number; color: string }> = {
  uploaded: { label: 'Uploaded', progress: 10, color: 'text-blue-500' },
  extracting: { label: 'Extracting text...', progress: 25, color: 'text-blue-500' },
  chunking: { label: 'Chunking content...', progress: 40, color: 'text-blue-500' },
  embedding: { label: 'Generating embeddings...', progress: 60, color: 'text-amber-500' },
  generating_tree: { label: 'Building skill tree...', progress: 80, color: 'text-purple-500' },
  completed: { label: 'Complete', progress: 100, color: 'text-emerald-500' },
  error: { label: 'Error', progress: 0, color: 'text-destructive' },
}

interface UploadPanelProps {
  onUploadComplete?: () => void
  compact?: boolean
}

export function UploadPanel({ onUploadComplete, compact = false }: UploadPanelProps) {
  const [uploads, setUploads] = useState<UploadRecord[]>([])
  const [uploading, setUploading] = useState(false)
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())

  // Load existing uploads
  useEffect(() => {
    loadUploads()
  }, [])

  // Poll for processing uploads
  useEffect(() => {
    if (processingIds.size === 0) return

    const interval = setInterval(async () => {
      let anyStillProcessing = false
      for (const id of processingIds) {
        try {
          const status = await getUploadStatus(id)
          setUploads(prev => prev.map(u => u._id === id ? { ...u, ...status } : u))

          if (status.status === 'completed') {
            onUploadComplete?.()
          } else if (status.status !== 'error' && status.status !== 'completed') {
            anyStillProcessing = true
          }
        } catch {
          // ignore polling errors
        }
      }

      if (!anyStillProcessing) {
        setProcessingIds(new Set())
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [processingIds, onUploadComplete])

  async function loadUploads() {
    try {
      const data = await getUploads()
      setUploads(data)

      // Find any still processing
      const processing = data
        .filter((u: UploadRecord) => !['completed', 'error'].includes(u.status))
        .map((u: UploadRecord) => u._id)
      if (processing.length > 0) {
        setProcessingIds(new Set(processing))
      }
    } catch {
      // silently fail
    }
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    setUploading(true)

    try {
      const result = await uploadFile(file)
      const newUpload: UploadRecord = {
        _id: result.id,
        original_name: result.original_name,
        file_size: result.file_size,
        status: 'uploaded',
        created_at: new Date().toISOString(),
      }

      setUploads(prev => [newUpload, ...prev])
      setProcessingIds(prev => new Set([...prev, result.id]))
    } catch (err) {
      console.error('Upload failed:', err)
    }

    setUploading(false)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
    },
    maxSize: 10 * 1024 * 1024,
    maxFiles: 1,
    disabled: uploading,
  })

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1048576).toFixed(1)} MB`
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all
          ${isDragActive
            ? 'border-primary bg-primary/5 scale-[0.99]'
            : 'border-border hover:border-primary/50 hover:bg-muted/50'
          }
          ${uploading ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          {uploading ? (
            <Loader2 className="size-8 text-primary animate-spin" />
          ) : (
            <Upload className="size-8 text-muted-foreground" />
          )}
          <div>
            <p className="text-sm font-medium">
              {isDragActive ? 'Drop file here...' : uploading ? 'Uploading...' : 'Upload study notes'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              PDF, TXT, or MD files up to 10MB
            </p>
          </div>
        </div>
      </div>

      {/* Upload history */}
      {uploads.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Recent Uploads</p>
          {uploads.slice(0, compact ? 3 : 10).map((upload) => {
            const status = STATUS_MAP[upload.status] || STATUS_MAP.uploaded

            return (
              <div
                key={upload._id}
                className="flex items-center gap-3 rounded-lg border border-border/60 p-3 bg-card"
              >
                <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
                  upload.status === 'completed' ? 'bg-emerald-500/10' :
                  upload.status === 'error' ? 'bg-destructive/10' :
                  'bg-primary/10'
                }`}>
                  {upload.status === 'completed' ? (
                    <CheckCircle2 className="size-4 text-emerald-500" />
                  ) : upload.status === 'error' ? (
                    <AlertCircle className="size-4 text-destructive" />
                  ) : processingIds.has(upload._id) ? (
                    <Loader2 className="size-4 text-primary animate-spin" />
                  ) : (
                    <FileText className="size-4 text-primary" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{upload.original_name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-xs ${status.color}`}>{status.label}</span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">{formatSize(upload.file_size)}</span>
                  </div>
                  {processingIds.has(upload._id) && upload.status !== 'completed' && upload.status !== 'error' && (
                    <Progress value={status.progress} className="h-1 mt-1.5" />
                  )}
                  {upload.error_message && (
                    <p className="text-xs text-destructive mt-1">{upload.error_message}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default UploadPanel
