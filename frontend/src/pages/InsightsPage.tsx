import { useEffect, useState } from 'react'
import { 
  TrendingUp, 
  Users, 
  AlertTriangle, 
  Trophy, 
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Brain,
  GraduationCap
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { AppLayout } from '@/components/layout/AppLayout'
import { getStudentInsights } from '@/lib/api'

interface InsightData {
  top_students: any[]
  struggling_students: any[]
  difficult_skills: any[]
}

export function InsightsPage() {
  const [data, setData] = useState<InsightData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadInsights() {
      try {
        const res = await getStudentInsights()
        setData(res)
      } catch (err) {
        console.error('Failed to load insights:', err)
      } finally {
        setLoading(false)
      }
    }
    loadInsights()
  }, [])

  if (loading) {
    return (
      <AppLayout title="Student Insights" description="Deep analytics on student performance and course difficulty.">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Card key={i} className="h-96 animate-pulse bg-muted/20" />)}
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout 
      title="Student Insights" 
      description="Identify high-achievers, support struggling students, and improve course difficulty."
    >
      <div className="space-y-8">
        {/* Top Summary Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-emerald-500/5 border-emerald-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Total Mastery Interactions</CardTitle>
              <Activity className="size-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,284</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <ArrowUpRight className="size-3 text-emerald-500" /> +12% from last week
              </p>
            </CardContent>
          </Card>
          <Card className="bg-blue-500/5 border-blue-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400">Avg. Completion Rate</CardTitle>
              <Brain className="size-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">74%</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <ArrowUpRight className="size-3 text-blue-500" /> +5% from last week
              </p>
            </CardContent>
          </Card>
          <Card className="bg-amber-500/5 border-amber-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-amber-600 dark:text-amber-400">Retention Alert</CardTitle>
              <AlertTriangle className="size-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.struggling_students.length || 0} Students</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 text-destructive">
                <ArrowDownRight className="size-3" /> Potential drop-off risk
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Performers */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Trophy className="size-5 text-amber-500" />
                <div>
                  <CardTitle>Top Performing Students</CardTitle>
                  <CardDescription>Highest average mastery across all enrolled skills</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {data?.top_students.map((student, idx) => (
                  <div key={student._id} className="flex items-center gap-4 group">
                    <div className="text-xs font-bold text-muted-foreground w-4">{idx + 1}</div>
                    <Avatar className="size-10 border-2 border-background shadow-sm">
                      <AvatarImage src={student.avatar_url} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                        {student.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{student.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{student.email}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-emerald-600">{Math.round(student.avg_mastery)}%</div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Mastery</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Challenging Topics */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Brain className="size-5 text-primary" />
                <div>
                  <CardTitle>Most Difficult Topics</CardTitle>
                  <CardDescription>Skills with the lowest average mastery scores</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {data?.difficult_skills.map((skill) => (
                  <div key={skill._id} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium truncate max-w-[200px]">{skill.skill_name}</span>
                      <span className="text-xs font-bold text-destructive">{Math.round(skill.avg_mastery)}% mastery</span>
                    </div>
                    <div className="relative h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div 
                        className="absolute inset-y-0 left-0 bg-destructive/60 transition-all duration-1000"
                        style={{ width: `${skill.avg_mastery}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Based on {skill.total_attempts} student interactions
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Struggling Students Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-destructive" />
              <div>
                <CardTitle>Students Needing Support</CardTitle>
                <CardDescription>Low mastery scores despite high interaction levels</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr className="text-left border-b">
                    <th className="p-4 font-semibold">Student Name</th>
                    <th className="p-4 font-semibold text-center">Interactions</th>
                    <th className="p-4 font-semibold text-center">Avg. Mastery</th>
                    <th className="p-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data?.struggling_students.map((student) => (
                    <tr key={student._id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <div className="font-medium">{student.name}</div>
                        <div className="text-xs text-muted-foreground">{student.email}</div>
                      </td>
                      <td className="p-4 text-center">{student.total_interactions}</td>
                      <td className="p-4 text-center">
                        <Badge variant="destructive" className="bg-destructive/10 text-destructive border-0">
                          {Math.round(student.avg_mastery)}%
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <Button variant="outline" size="sm" className="h-8">
                          Reach Out
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {data?.struggling_students.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-muted-foreground">
                        No struggling students found. Keep it up!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
