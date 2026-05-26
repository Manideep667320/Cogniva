import * as React from 'react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { BookOpen, Video, FileText, BrainCircuit, MessageSquare, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SearchResult {
  content: string
  metadata: {
    source?: string
    memory_type?: string
    [key: string]: any
  }
  distance: number
}

export function GlobalSearch() {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const [results, setResults] = React.useState<SearchResult[]>([])
  const [loading, setLoading] = React.useState(false)
  
  const [selectedMemory, setSelectedMemory] = React.useState<SearchResult | null>(null)

  // Toggle Command Palette
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  // Debounced API Search
  React.useEffect(() => {
    const timer = setTimeout(async () => {
      if (!query.trim()) {
        setResults([])
        return
      }

      setLoading(true)
      try {
        const token = localStorage.getItem('token')
        const res = await fetch('https://cogniva-wu5f.onrender.com/api/memory/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ query, top_k: 10 })
        })
        const json = await res.json()
        if (json.success) {
          setResults(json.data)
        }
      } catch (err) {
        console.error('Failed to semantic search', err)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  const getIcon = (type?: string, source?: string) => {
    if (source === 'AssemblyAI_Lecture_Capture') return <Video className="size-4 text-primary" />
    if (type === 'lecture') return <Video className="size-4 text-primary" />
    if (type === 'document' || source?.endsWith('.pdf')) return <BookOpen className="size-4 text-emerald-500" />
    if (type === 'chat') return <MessageSquare className="size-4 text-sky-500" />
    return <BrainCircuit className="size-4 text-amber-500" />
  }

  const getTitle = (res: SearchResult) => {
    if (res.metadata.source) return res.metadata.source
    if (res.metadata.memory_type) return `Memory: ${res.metadata.memory_type}`
    return 'Semantic Memory'
  }

  const handleSelect = (res: SearchResult) => {
    setOpen(false)
    setSelectedMemory(res)
  }

  return (
    <>
      <div className="w-full max-w-sm hidden md:block" onClick={() => setOpen(true)}>
        <Button variant="outline" className="relative w-full justify-start text-muted-foreground shadow-sm bg-muted/50">
          <span className="hidden lg:inline-flex">Search your academic history...</span>
          <span className="inline-flex lg:hidden">Search...</span>
          <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-6 select-none items-center gap-1 rounded-sm border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="Search semantic memory (e.g., 'What is normalization?')..." 
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {loading && <CommandEmpty>Searching the deep neural pathways...</CommandEmpty>}
          {!loading && results.length === 0 && query.length > 0 && (
            <CommandEmpty>No academic memories found for this query.</CommandEmpty>
          )}
          {!loading && results.length === 0 && query.length === 0 && (
            <CommandEmpty>Type naturally to search across all your lectures and notes.</CommandEmpty>
          )}

          {results.length > 0 && (
            <CommandGroup heading="Semantic Search Results">
              {results.map((res, i) => (
                <CommandItem
                  key={i}
                  onSelect={() => handleSelect(res)}
                  className="flex flex-col items-start py-3 cursor-pointer"
                >
                  <div className="flex items-center gap-2 w-full mb-1">
                    {getIcon(res.metadata.memory_type, res.metadata.source)}
                    <span className="font-semibold text-sm truncate">{getTitle(res)}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {(res.distance * 100).toFixed(1)}% match
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 w-full text-left pl-6 leading-relaxed">
                    {res.content}
                  </p>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>

      {/* Detail Overlay */}
      <Dialog open={!!selectedMemory} onOpenChange={(val) => !val && setSelectedMemory(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2">
              {selectedMemory && getIcon(selectedMemory.metadata.memory_type, selectedMemory.metadata.source)}
              {selectedMemory && getTitle(selectedMemory)}
            </DialogTitle>
            <DialogDescription>
              Detailed view of the semantic memory match.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto mt-4 pr-2">
            <div className="bg-muted/30 p-4 rounded-xl border whitespace-pre-wrap font-mono text-sm leading-relaxed">
              {selectedMemory?.content}
            </div>
            
            {selectedMemory?.metadata && Object.keys(selectedMemory.metadata).length > 0 && (
              <div className="mt-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Attached Metadata</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(selectedMemory.metadata).map(([key, value]) => (
                    key !== 'user_id' && (
                      <div key={key} className="flex flex-col bg-muted/50 p-2 rounded-lg">
                        <span className="text-xs text-muted-foreground">{key}</span>
                        <span className="font-medium truncate">{String(value)}</span>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
