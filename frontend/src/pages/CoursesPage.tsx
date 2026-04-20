import { useEffect, useState } from 'react'
import { Plus, Search, BookOpen, Loader as Loader2, X, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/contexts/AuthContext'
import { getCourses, createCourse, deleteCourse } from '@/lib/api'
import { AppLayout } from '@/components/layout/AppLayout'
import { CourseCard } from '@/components/courses/CourseCard'

interface Course {
  id: string
  _id?: string
  title: string
  description: string
  content?: string
  faculty_id?: string
  faculty_name?: string
  level: 'Beginner' | 'Intermediate' | 'Advanced'
  duration_hours?: number
  tags?: string[]
  is_published?: boolean
  created_at?: string
}

const levelColors: Record<string, string> = {
  Beginner: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  Intermediate: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  Advanced: 'bg-red-500/10 text-red-600 dark:text-red-400',
}

export function CoursesPage() {
  const { profile, user } = useAuth()
  const isFaculty = profile?.role === 'faculty'

  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [viewOpen, setViewOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)

  const [formTitle, setFormTitle] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formContent, setFormContent] = useState('')
  const [formLevel, setFormLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner')
  const [formHours, setFormHours] = useState('4')
  const [formTags, setFormTags] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  async function loadCourses() {
    setLoading(true)
    try {
      const data = await getCourses()
      setCourses(data)
    } catch (err) {
      console.error('Failed to load courses:', err)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (user) loadCourses()
  }, [user, isFaculty])

  const filtered = courses.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.description.toLowerCase().includes(search.toLowerCase()) ||
    c.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  )

  function openCreate() {
    setFormTitle('')
    setFormDesc('')
    setFormContent('')
    setFormLevel('Beginner')
    setFormHours('4')
    setFormTags('')
    setFormError(null)
    setCreateOpen(true)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!formTitle.trim() || !formDesc.trim()) {
      setFormError('Title and description are required.')
      return
    }
    setFormLoading(true)
    setFormError(null)
    const tags = formTags.split(',').map((t) => t.trim()).filter(Boolean)
    // Send course creation request to backend API
    try {
      await createCourse({
        title: formTitle.trim(),
        description: formDesc.trim(),
        content: formContent.trim(),
        level: formLevel,
        duration_hours: parseInt(formHours) || 0,
        tags,
      })
      setFormLoading(false)
      setCreateOpen(false)
      loadCourses()
    } catch (error: any) {
      setFormLoading(false)
      setFormError(error?.message || 'Failed to create course')
    }
  }

  async function handleDelete(courseId: string) {
    setDeleteLoading(true)
    try {
      await deleteCourse(courseId)
      setViewOpen(false)
      setSelectedCourse(null)
      loadCourses()
    } catch (err) {
      console.error('Failed to delete course:', err)
    }
    setDeleteLoading(false)
  }

  return (
    <AppLayout
      title={isFaculty ? 'Manage Courses' : 'Course Library'}
      description={isFaculty ? 'Create and manage your courses' : 'Explore available courses'}
      headerRight={
        isFaculty && (
          <Button size="sm" onClick={openCreate} className="brand-gradient text-white border-0">
            <Plus className="size-4 mr-1" /> New Course
          </Button>
        )
      }
    >
      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search courses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Course Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-52 w-full rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
            <BookOpen className="size-8 text-muted-foreground/50" />
          </div>
          <div>
            <p className="font-semibold">{search ? 'No courses match your search' : 'No courses yet'}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {isFaculty ? 'Create your first course to get started.' : 'Check back soon for new content.'}
            </p>
          </div>
          {isFaculty && (
            <Button onClick={openCreate} className="brand-gradient text-white border-0">
              <Plus className="size-4 mr-2" /> Create Course
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((course: Course) => (
            <CourseCard
              key={course._id || course.id}
              course={course}
              isFaculty={isFaculty}
              onView={(c: Course) => { setSelectedCourse(c); setViewOpen(true) }}
            />
          ))}
        </div>
      )}

      {/* View Course Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-2xl">
          {selectedCourse && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg brand-gradient shrink-0">
                      <BookOpen className="size-5 text-white" />
                    </div>
                    <div>
                      <DialogTitle className="text-lg">{selectedCourse.title}</DialogTitle>
                      <DialogDescription>{selectedCourse.description}</DialogDescription>
                    </div>
                  </div>
                </div>
              </DialogHeader>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={`text-xs ${levelColors[selectedCourse.level] || ''}`}>
                  {selectedCourse.level}
                </Badge>
                <Badge variant="secondary" className="text-xs">{selectedCourse.duration_hours}h</Badge>
                <span className="text-xs text-muted-foreground">by {selectedCourse.faculty_name}</span>
                {selectedCourse.tags?.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                ))}
              </div>
              <Separator />
              <ScrollArea className="max-h-80 pr-2">
                <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                  {selectedCourse.content || 'No detailed content has been added yet.'}
                </div>
              </ScrollArea>
              {isFaculty && selectedCourse.faculty_id === user?.id && (
                <DialogFooter>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(selectedCourse._id || selectedCourse.id)}
                    disabled={deleteLoading}
                  >
                    {deleteLoading ? <Loader2 className="size-4 animate-spin mr-2" /> : <Trash2 className="size-4 mr-2" />}
                    Delete Course
                  </Button>
                </DialogFooter>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Course Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Course</DialogTitle>
            <DialogDescription>Fill in the course details below</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            {formError && (
              <Alert variant="destructive">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
            <div className="grid gap-1.5">
              <Label htmlFor="c-title">Course Title *</Label>
              <Input id="c-title" placeholder="e.g., Intro to Machine Learning" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} required />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="c-desc">Short Description *</Label>
              <Textarea id="c-desc" placeholder="Brief description of the course..." value={formDesc} onChange={(e) => setFormDesc(e.target.value)} rows={2} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Level</Label>
                <Select value={formLevel} onValueChange={(v) => setFormLevel(v as typeof formLevel)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="c-hours">Duration (hours)</Label>
                <Input id="c-hours" type="number" min="1" value={formHours} onChange={(e) => setFormHours(e.target.value)} />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="c-tags">Tags (comma separated)</Label>
              <Input id="c-tags" placeholder="e.g., Python, AI, Math" value={formTags} onChange={(e) => setFormTags(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="c-content">Course Content / Syllabus</Label>
              <Textarea id="c-content" placeholder="Detailed course content, topics, learning objectives..." value={formContent} onChange={(e) => setFormContent(e.target.value)} rows={4} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                <X className="size-4 mr-1" /> Cancel
              </Button>
              <Button type="submit" disabled={formLoading} className="brand-gradient text-white border-0">
                {formLoading ? <><Loader2 className="size-4 animate-spin mr-2" /> Creating...</> : <><Plus className="size-4 mr-1" /> Create Course</>}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}
