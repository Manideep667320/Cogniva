import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageSquare, BookOpen, Clock, ArrowRight, Sparkles, TrendingUp, Target, GitBranch, Upload } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { AppLayout } from '@/components/layout/AppLayout'
import { MasteryProgress } from '@/components/dashboard/MasteryProgress'
import { WeakTopicsPanel } from '@/components/dashboard/WeakTopicsPanel'
import { RecommendationPanel } from '@/components/dashboard/RecommendationPanel'
import { useAuth } from '@/contexts/AuthContext'
import { getSkillTrees, getCourses, getChatHistory } from '@/lib/api'
import { CourseCard } from '@/components/courses/CourseCard'
import { useNavigate } from 'react-router-dom'
import { LearningHeatmap } from '@/components/dashboard/LearningHeatmap'
import { LearningProfileCard } from '@/components/dashboard/LearningProfileCard'
import { MasteryTrendChart } from '@/components/dashboard/MasteryTrendChart'

interface LocalMessage {
  id: string
  user_id: string
  message: string
  response: string
  model: string
  created_at: string
}

interface Course {
  id: string
  _id?: string
  title: string
  description: string
  level: 'Beginner' | 'Intermediate' | 'Advanced'
  duration_hours?: number
  faculty_name?: string
  tags?: string[]
}

function StatCard({ icon: Icon, label, value, trend }: { icon: React.ElementType; label: string; value: string | number; trend?: string }) {
  return (
    <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
            {trend && <p className="text-xs text-muted-foreground">{trend}</p>}
          </div>
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="size-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function StudentDashboard() {
  const { profile, user } = useAuth()
  const [recentChats, setRecentChats] = useState<LocalMessage[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [treeCount, setTreeCount] = useState(0)
  const [chatHistory, setChatHistory] = useState<LocalMessage[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) return
    
    async function loadData() {
      setLoading(true)
      try {
        // Load skill trees
        const trees = await getSkillTrees()
        setTreeCount(trees.length)

        // Load published courses
        const courseData = await getCourses()
        setCourses(courseData.slice(0, 3)) // Show top 3 for dashboard

        // Load chat history for heatmap
        const history = await getChatHistory()
        setChatHistory(history)
      } catch (err) {
        console.error('Failed to load dashboard data:', err)
      }
      setLoading(false)
    }

    loadData()
  }, [user])

  const navigate = useNavigate()

  const firstName = profile?.full_name?.split(' ')[0] || 'Learner'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <AppLayout title="Dashboard" description="Your learning overview">
      {/* Hero greeting */}
      <div className="rounded-xl brand-gradient p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-6 -right-6 size-40 rounded-full bg-white/30 blur-2xl" />
        </div>
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-white/80 text-sm font-medium">{greeting},</p>
            <h2 className="text-2xl font-bold mt-0.5">{firstName} 👋</h2>
            <p className="text-white/70 text-sm mt-1">Ready to learn something new today?</p>
          </div>
          <div className="flex gap-2">
            <Button asChild className="bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm">
              <Link to="/skill-tree">
                <GitBranch className="size-4 mr-2" /> Skill Trees
              </Link>
            </Button>
            <Button asChild className="bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm">
              <Link to="/tutor">
                <Sparkles className="size-4 mr-2" /> AI Tutor
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={GitBranch} label="Skill Trees" value={treeCount} trend="Upload notes to create" />
        <StatCard icon={MessageSquare} label="AI Conversations" value={chatHistory.length} trend="All time" />
        <StatCard icon={TrendingUp} label="Learning Streak" value="3 days" trend="Keep it up!" />
      </div>

      {/* Profile Heatmap Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3">
          <LearningHeatmap history={chatHistory} />
        </div>
        <div className="lg:col-span-1">
          <LearningProfileCard />
        </div>
      </div>

      {/* Main content grid */}
      <div className={`grid grid-cols-1 ${treeCount > 0 ? 'lg:grid-cols-3' : ''} gap-4`}>
        {/* Left column: Quick actions + Mastery */}
        <div className={`${treeCount > 0 ? 'lg:col-span-2' : ''} space-y-4`}>
          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/skill-tree" className="group block">
              <Card className="border-border/60 shadow-sm hover:shadow-md transition-all hover:border-primary/30 cursor-pointer h-full">
                <CardContent className="pt-6 pb-6">
                  <div className="flex flex-col gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg brand-gradient">
                      <GitBranch className="size-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold group-hover:text-primary transition-colors">Skill Trees</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Visualize your learning path</p>
                    </div>
                    <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link to="/tutor" className="group block">
              <Card className="border-border/60 shadow-sm hover:shadow-md transition-all hover:border-primary/30 cursor-pointer h-full">
                <CardContent className="pt-6 pb-6">
                  <div className="flex flex-col gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-sky-500/10">
                      <MessageSquare className="size-5 text-sky-600 dark:text-sky-400" />
                    </div>
                    <div>
                      <p className="font-semibold group-hover:text-primary transition-colors">Ask AI Tutor</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Get instant help on any topic</p>
                    </div>
                    <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Card className="border-border/60 shadow-sm">
              <CardContent className="pt-6 pb-6">
                <div className="flex flex-col gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10">
                    <Target className="size-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-semibold">Daily Goal</p>
                    <p className="text-xs text-muted-foreground mt-0.5">30 min learning session</p>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div className="h-full w-2/3 rounded-full brand-gradient" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Mastery Progress */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MasteryProgress />
            <MasteryTrendChart />
          </div>

          {/* Recent Chat History */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">Recent AI Conversations</CardTitle>
                <CardDescription>Your latest tutor sessions</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link to="/tutor">View all <ArrowRight className="size-3 ml-1" /></Link>
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex flex-col gap-3">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full rounded-md" />)}
                </div>
              ) : recentChats.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
                  <MessageSquare className="size-8 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">No conversations yet.</p>
                  <Button asChild size="sm" className="mt-1 brand-gradient text-white border-0">
                    <Link to="/tutor">Start your first session</Link>
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {recentChats.map((chat) => (
                    <div key={chat.id} className="flex items-start gap-3 rounded-lg border border-border/60 p-3 hover:bg-muted/50 transition-colors">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-md brand-gradient">
                        <MessageSquare className="size-3.5 text-white" />
                      </div>
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <p className="text-sm font-medium truncate">{chat.message}</p>
                        <p className="text-xs text-muted-foreground truncate">{chat.response.slice(0, 80)}...</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="size-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {new Date(chat.created_at).toLocaleDateString()}
                          </span>
                          <Badge variant="outline" className="text-xs py-0">{chat.model}</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column: Recommendations + Weak topics + Courses */}
        {treeCount > 0 ? (
          <div className="space-y-4">
            <RecommendationPanel />
            <WeakTopicsPanel />

            {/* Explore Courses Section (Sidebar) */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between px-1">
                <div>
                  <h3 className="text-sm font-bold">Explore Courses</h3>
                </div>
                <Button asChild variant="link" size="sm" className="h-auto p-0 text-xs">
                  <Link to="/courses">View all</Link>
                </Button>
              </div>
              
              {loading ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
                </div>
              ) : courses.length === 0 ? (
                <div className="text-center py-4 border border-dashed rounded-lg">
                  <p className="text-[10px] text-muted-foreground">No courses available</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {courses.slice(0, 2).map((course: Course) => (
                    <CourseCard 
                      key={course._id || course.id} 
                      course={course} 
                      onView={() => navigate('/courses')}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <Card className="border-border/60 shadow-sm border-l-4 border-l-primary/60 lg:col-span-3">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center gap-3 py-4">
                <div className="flex size-12 items-center justify-center rounded-xl brand-gradient">
                  <Upload className="size-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold">Get Started with Skill Trees</p>
                  <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                    Upload your study notes to generate personalized skill trees, track mastery, and get AI-powered recommendations.
                  </p>
                </div>
                <Button asChild className="mt-1 brand-gradient text-white border-0">
                  <Link to="/skill-tree">
                    <GitBranch className="size-4 mr-2" /> Create Skill Tree
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  )
}
