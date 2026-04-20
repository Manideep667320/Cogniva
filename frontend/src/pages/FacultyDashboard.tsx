import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Users, TrendingUp, Plus, ArrowRight, ChartBar as BarChart3, Star, Clock } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { AppLayout } from '@/components/layout/AppLayout'
import { useAuth } from '@/contexts/AuthContext'
import { getFacultyCourses } from '@/lib/api'

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

const analyticsCards = [
  { label: 'Total Students', value: '142', change: '+12%', icon: Users, color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  { label: 'Avg. Completion', value: '78%', change: '+5%', icon: TrendingUp, color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  { label: 'Avg. Rating', value: '4.7', change: 'out of 5', icon: Star, color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  { label: 'Hours Delivered', value: '1.2k', change: 'this month', icon: Clock, color: 'bg-sky-500/10 text-sky-600 dark:text-sky-400' },
]

export function FacultyDashboard() {
  const { profile, user } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    
    async function loadData() {
      setLoading(true)
      try {
        const data = await getFacultyCourses(user!.id)
        setCourses(data)
      } catch (err) {
        console.error('Failed to load faculty courses:', err)
      }
      setLoading(false)
    }

    loadData()
  }, [user])

  const firstName = profile?.full_name?.split(' ')[0] || 'Professor'

  return (
    <AppLayout
      title="Faculty Dashboard"
      description="Manage your courses and track student progress"
      headerRight={
        <Button asChild size="sm" className="brand-gradient text-white border-0">
          <Link to="/courses"><Plus className="size-4 mr-1" /> New Course</Link>
        </Button>
      }
    >
      {/* Hero */}
      <div className="rounded-xl brand-gradient p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-6 -right-6 size-40 rounded-full bg-white/30 blur-2xl" />
          <div className="absolute bottom-0 left-1/3 size-32 rounded-full bg-white/20 blur-2xl" />
        </div>
        <div className="relative z-10">
          <p className="text-white/80 text-sm">Welcome back,</p>
          <h2 className="text-2xl font-bold mt-0.5">Prof. {firstName}</h2>
          <p className="text-white/70 text-sm mt-1">
            You have <span className="text-white font-semibold">{courses.length} course{courses.length !== 1 ? 's' : ''}</span> published.
          </p>
        </div>
      </div>

      {/* Analytics Cards (dummy data) */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="size-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Analytics Overview</h3>
          <Badge variant="outline" className="text-xs ml-auto">Demo data</Badge>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {analyticsCards.map(({ label, value, change, icon: Icon, color }) => (
            <Card key={label} className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-5 pb-5">
                <div className="flex flex-col gap-2">
                  <div className={`flex size-9 items-center justify-center rounded-lg ${color.split(' ')[0]}`}>
                    <Icon className={`size-4 ${color.split(' ').slice(1).join(' ')}`} />
                  </div>
                  <p className="text-2xl font-bold">{value}</p>
                  <div>
                    <p className="text-xs font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">{change}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* My Courses */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base">My Courses</CardTitle>
            <CardDescription>Courses you have created</CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/courses">Manage all <ArrowRight className="size-3 ml-1" /></Link>
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-md" />)}
            </div>
          ) : courses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
              <BookOpen className="size-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No courses yet.</p>
              <Button asChild size="sm" className="mt-1 brand-gradient text-white border-0">
                <Link to="/courses">Create your first course</Link>
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {courses.map((course: Course) => (
                <div key={course._id || course.id} className="flex items-center gap-4 rounded-lg border border-border/60 p-3 hover:bg-muted/50 transition-colors">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg brand-gradient">
                    <BookOpen className="size-4 text-white" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <p className="text-sm font-semibold truncate">{course.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{course.description}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge variant={course.is_published ? 'default' : 'secondary'} className="text-xs">
                      {course.is_published ? 'Published' : 'Draft'}
                    </Badge>
                    <span className="text-xs text-muted-foreground capitalize">{course.level}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </AppLayout>
  )
}
