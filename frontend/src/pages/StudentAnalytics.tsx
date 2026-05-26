import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AppLayout } from '@/components/layout/AppLayout'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar 
} from 'recharts'
import { Activity, Brain, Target, TrendingUp, AlertTriangle } from 'lucide-react'

interface AnalyticsData {
  weaknessClusters: Array<{
    front: string
    type: string
    weaknessScore: number
  }>
  consistencyData: Array<{
    date: string
    reviews: number
  }>
  focusTrends: Array<{
    date: string
    avgTimeSeconds: number
  }>
  velocityData: Array<{
    week: string
    total: number
    accuracy: number
  }>
}

export function StudentAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const token = localStorage.getItem('auth_token')
        const res = await fetch('https://cogniva-wu5f.onrender.com/api/analytics/student', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const json = await res.json()
        if (json.success) {
          setData(json.data)
        }
      } catch (err) {
        console.error('Failed to fetch analytics', err)
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
  }, [])

  if (loading) {
    return (
      <AppLayout title="Academic Analytics" description="Loading your personalized insights...">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => <Card key={i} className="h-80 animate-pulse bg-muted/20" />)}
        </div>
      </AppLayout>
    )
  }

  // Format weakness data for Radar chart (truncate long strings)
  const radarData = data?.weaknessClusters.map(w => ({
    subject: w.front.length > 20 ? w.front.substring(0, 20) + '...' : w.front,
    score: w.weaknessScore
  })) || []

  return (
    <AppLayout 
      title="Academic Analytics" 
      description="Deep dive into your learning patterns, memory retention, and conceptual weaknesses."
    >
      <div className="space-y-6">
        
        {/* Top Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Reviews (30d)</p>
                  <p className="text-3xl font-bold mt-1">
                    {data?.velocityData.reduce((acc, curr) => acc + curr.total, 0) || 0}
                  </p>
                </div>
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Activity className="size-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-emerald-500/5 border-emerald-500/20">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Latest Accuracy</p>
                  <p className="text-3xl font-bold mt-1">
                    {data?.velocityData[data.velocityData.length - 1]?.accuracy || 0}%
                  </p>
                </div>
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <Target className="size-5 text-emerald-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-amber-500/5 border-amber-500/20">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Critical Weaknesses</p>
                  <p className="text-3xl font-bold mt-1 text-amber-600">
                    {data?.weaknessClusters.filter(w => w.weaknessScore > 10).length || 0}
                  </p>
                </div>
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <AlertTriangle className="size-5 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Weakness Clusters */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="size-5 text-amber-500" />
                Conceptual Weakness Clusters
              </CardTitle>
              <CardDescription>Topics where you struggle the most based on recall failure and response time.</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {radarData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid stroke="currentColor" className="text-border" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'currentColor', fontSize: 12 }} className="text-muted-foreground" />
                    <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                    <Radar name="Weakness Score" dataKey="score" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.5} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }} />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">Not enough data yet. Keep studying!</div>
              )}
            </CardContent>
          </Card>

          {/* Revision Consistency */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="size-5 text-emerald-500" />
                Revision Consistency (30 Days)
              </CardTitle>
              <CardDescription>Daily volume of spaced repetition flashcards reviewed.</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
                <BarChart data={data?.consistencyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border/50" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(val) => val.substring(5)} // MM-DD
                    stroke="currentColor" 
                    className="text-muted-foreground text-xs" 
                    tickMargin={10}
                  />
                  <YAxis stroke="currentColor" className="text-muted-foreground text-xs" allowDecimals={false} />
                  <Tooltip 
                    cursor={{ fill: 'hsl(var(--muted))' }}
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="reviews" name="Reviews Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Focus Trends */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="size-5 text-blue-500" />
                Focus & Cognitive Load Trends
              </CardTitle>
              <CardDescription>Average time taken to recall answers (Lower is better). Last 14 days.</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
                <LineChart data={data?.focusTrends}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border/50" />
                  <XAxis dataKey="date" stroke="currentColor" className="text-muted-foreground text-xs" tickMargin={10} />
                  <YAxis stroke="currentColor" className="text-muted-foreground text-xs" unit="s" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="avgTimeSeconds" 
                    name="Avg Recall Time (s)"
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Learning Velocity */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="size-5 text-indigo-500" />
                Learning Velocity
              </CardTitle>
              <CardDescription>Volume of reviews vs. Accuracy rate over recent weeks.</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
                <AreaChart data={data?.velocityData}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border/50" />
                  <XAxis dataKey="week" stroke="currentColor" className="text-muted-foreground text-xs" tickMargin={10} />
                  <YAxis yAxisId="left" stroke="currentColor" className="text-muted-foreground text-xs" />
                  <YAxis yAxisId="right" orientation="right" stroke="currentColor" className="text-muted-foreground text-xs" unit="%" domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  />
                  <Area yAxisId="left" type="monotone" dataKey="total" name="Total Reviews" stroke="#6366f1" fillOpacity={1} fill="url(#colorTotal)" />
                  <Line yAxisId="right" type="monotone" dataKey="accuracy" name="Accuracy" stroke="#10b981" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

        </div>
      </div>
    </AppLayout>
  )
}
