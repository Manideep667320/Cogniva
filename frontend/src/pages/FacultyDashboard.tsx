import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Users, TrendingUp, Plus, ArrowRight, ChartBar as BarChart3, Star, Clock, Trash2, Video } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { AppLayout } from '@/components/layout/AppLayout'
import { useAuth } from '@/contexts/AuthContext'
import { getFacultyCourses, getFacultyStats } from '@/lib/api'

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

interface Stats {
  total_students: number
  avg_rating: number
  total_hours: number
  total_courses: number
  published_courses: number
}

// Analytics cards removed to use dynamic data

export function FacultyDashboard() {
  const { profile, user } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  const handleDeleteCourse = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) return

    try {
      await deleteCourse(id)
      setCourses(courses.filter(c => (c._id || c.id) !== id))
      if (user?.id) {
        const statsData = await getFacultyStats(user.id)
        setStats(statsData)
      }
    } catch (err) {
      console.error('Failed to delete course:', err)
      alert('Failed to delete course. Please try again.')
    }
  }

  useEffect(() => {
    if (!user?.id) return

    async function loadData() {
      setLoading(true)
      try {
        const [coursesData, statsData] = await Promise.all([
          getFacultyCourses(user!.id),
          getFacultyStats(user!.id)
        ])
        setCourses(coursesData)
        setStats(statsData)
      } catch (err) {
        console.error('Failed to load faculty dashboard data:', err)
      }
      setLoading(false)
    }

    loadData()
  }, [user])

  const firstName = profile?.full_name?.split(' ')[0] || 'Professor'

  // Calculate real stats from backend aggregator
  const dynamicStats = [
    {
      label: 'Total Students',
      value: stats?.total_students?.toString() || '0',
      sub: 'Enrolled in your courses',
      icon: Users,
      color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
    },
    {
      label: 'Avg. Rating',
      value: stats?.avg_rating?.toFixed(1) || '0.0',
      sub: 'Course satisfaction',
      icon: Star,
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
    },
    {
      label: 'Course Hours',
      value: stats?.total_hours?.toString() || '0',
      sub: 'Total content length',
      icon: Clock,
      color: 'bg-sky-500/10 text-sky-600 dark:text-sky-400'
    },
    {
      label: 'Live Courses',
      value: stats?.published_courses?.toString() || '0',
      sub: `${stats?.total_courses || 0} total managed`,
      icon: TrendingUp,
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
    },
  ]

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
            You have <span className="text-white font-semibold">{stats?.total_courses || 0} course{stats?.total_courses !== 1 ? 's' : ''}</span> under management.
          </p>
        </div>
      </div>

      {/* Analytics Cards */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="size-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Course Analytics</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {dynamicStats.map(({ label, value, sub, icon: Icon, color }) => (
            <Card key={label} className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-5 pb-5">
                <div className="flex flex-col gap-2">
                  <div className={`flex size-9 items-center justify-center rounded-lg ${color.split(' ')[0]}`}>
                    <Icon className={`size-4 ${color.split(' ').slice(1).join(' ')}`} />
                  </div>
                  <p className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-12" /> : value}</p>
                  <div>
                    <p className="text-xs font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">{sub}</p>
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
                <div key={course._id || course.id} className="flex items-center gap-4 rounded-lg border border-border/60 p-3 hover:bg-muted/50 transition-colors group">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg brand-gradient">
                    <BookOpen className="size-4 text-white" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <p className="text-sm font-semibold truncate">{course.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{course.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Badge variant={course.is_published ? 'default' : 'secondary'} className="text-xs">
                        {course.is_published ? 'Published' : 'Draft'}
                      </Badge>
                      <span className="text-xs text-muted-foreground capitalize">{course.level}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                      onClick={() => handleDeleteCourse(course._id || course.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
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
function deleteCourse(id: string) {
  throw new Error('Function not implemented.')
}

