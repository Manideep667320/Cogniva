import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AppLayout } from '@/components/layout/AppLayout'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { BrainCircuit, BookOpen, Presentation, Zap, Calendar as CalendarIcon, Loader2, Sparkles, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { API_BASE_URL } from '@/lib/api'

interface StudyTask {
  _id: string
  title: string
  topic: string
  type: 'review' | 'new_concept' | 'quiz' | 'reading'
  durationMinutes: number
  completed: boolean
}

interface StudyPlan {
  _id: string
  date: string
  tasks: StudyTask[]
}

export function StudyCalendar() {
  const navigate = useNavigate()
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [plans, setPlans] = useState<StudyPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  const handleTaskClick = (task: StudyTask) => {
    switch (task.type) {
      case 'review':
        navigate('/flashcards/review')
        break
      case 'new_concept':
      case 'reading':
        navigate('/skill-tree')
        break
      case 'quiz':
        navigate('/courses')
        break
      default:
        navigate('/dashboard')
    }
  }

  const fetchPlans = async () => {
    try {
      const token = sessionStorage.getItem('auth_token')
      const res = await fetch(`${API_BASE_URL}/api/plan/schedule`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const json = await res.json()
      if (json.success) {
        setPlans(json.data)
      }
    } catch (err) {
      console.error('Failed to fetch schedule', err)
      toast.error('Failed to load study plan')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlans()
  }, [])

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const token = sessionStorage.getItem('auth_token')
      const res = await fetch(`${API_BASE_URL}/api/plan/generate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const json = await res.json()
      if (json.success) {
        setPlans(json.data)
        toast.success('Successfully generated optimized 7-day study plan!')
      } else {
        toast.error('Failed to generate study plan')
      }
    } catch (err) {
      console.error('Failed to generate schedule', err)
      toast.error('Agent error while generating plan')
    } finally {
      setGenerating(false)
    }
  }

  const handleToggleTask = async (planId: string, taskId: string, currentStatus: boolean) => {
    // Optimistic update
    setPlans(plans.map(p => {
      if (p._id !== planId) return p
      return {
        ...p,
        tasks: p.tasks.map(t => t._id === taskId ? { ...t, completed: !currentStatus } : t)
      }
    }))

    try {
      const token = sessionStorage.getItem('auth_token')
      await fetch(`${API_BASE_URL}/api/plan/task/${planId}/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ completed: !currentStatus })
      })
    } catch (err) {
      // Revert on error (simple reload for now)
      fetchPlans()
    }
  }

  // Find plan for selected date
  const selectedDateStr = date ? date.toISOString().split('T')[0] : ''
  const selectedPlan = plans.find(p => p.date.startsWith(selectedDateStr))

  const incompleteTasks = selectedPlan ? selectedPlan.tasks.filter(t => !t.completed) : []
  const hasCompletedTasks = selectedPlan ? selectedPlan.tasks.some(t => t.completed) : false

  // Find dates that have incomplete tasks for the calendar highlights
  const datesWithTasks = plans.filter(p => p.tasks.some(t => !t.completed)).map(p => new Date(p.date))

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'review': return <BrainCircuit className="size-4 text-emerald-500" />
      case 'new_concept': return <Zap className="size-4 text-amber-500" />
      case 'reading': return <BookOpen className="size-4 text-blue-500" />
      case 'quiz': return <Presentation className="size-4 text-purple-500" />
      default: return <BrainCircuit className="size-4" />
    }
  }

  return (
    <AppLayout 
      title="Study Calendar" 
      description="Your autonomously generated 7-day academic schedule."
      headerRight={
        <Button onClick={handleGenerate} disabled={generating} className="gap-2 brand-gradient text-white border-0">
          {generating ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          Generate Weekly Plan
        </Button>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Calendar Side */}
        <div className="md:col-span-5 lg:col-span-4 flex flex-col gap-6">
          <Card className="shadow-sm">
            <CardContent className="p-4 flex justify-center">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                modifiers={{ hasTasks: datesWithTasks }}
                modifiersStyles={{
                  hasTasks: { fontWeight: 'bold', textDecoration: 'underline', textDecorationColor: 'hsl(var(--primary))' }
                }}
                className="rounded-md w-full"
              />
            </CardContent>
          </Card>

          <Card className="shadow-sm bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <BrainCircuit className="size-4 text-primary" />
                AI Schedule Agent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The Schedule Agent continuously analyzes your <strong>FSRS retention metrics</strong> and pending skill tree goals to automatically map out an optimized learning schedule that prevents forgetting while advancing your knowledge.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tasks Side */}
        <div className="md:col-span-7 lg:col-span-8">
          <Card className="shadow-sm h-full flex flex-col min-h-[500px]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="size-5 text-primary" />
                {date ? date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) : 'Select a date'}
              </CardTitle>
              <CardDescription>
                {selectedPlan 
                  ? incompleteTasks.length > 0 
                    ? `You have ${incompleteTasks.length} study tasks remaining for today. Estimated time: ${incompleteTasks.reduce((a, b) => a + b.durationMinutes, 0)} mins.`
                    : selectedPlan.tasks.length > 0 
                      ? 'All study tasks for today are completed!'
                      : 'No tasks scheduled for this day.' 
                  : 'No tasks scheduled for this day.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              
              {loading ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
              ) : selectedPlan && incompleteTasks.length > 0 ? (
                <div className="space-y-4">
                  {incompleteTasks.map(task => (
                    <div 
                      key={task._id} 
                      onClick={() => handleTaskClick(task)}
                      className="flex items-start gap-4 p-4 rounded-xl border transition-all bg-card hover:border-primary/50 shadow-sm hover:shadow-md cursor-pointer group"
                    >
                      <div onClick={(e) => e.stopPropagation()}>
                        <Checkbox 
                          id={task._id} 
                          checked={task.completed} 
                          onCheckedChange={() => handleToggleTask(selectedPlan._id, task._id, task.completed)}
                          className="mt-1"
                        />
                      </div>
                      <div className="flex-1 space-y-1">
                        <label 
                          htmlFor={task._id} 
                          className="font-medium text-sm cursor-pointer text-foreground group-hover:text-primary transition-colors"
                          onClick={(e) => e.preventDefault()} // prevent label trigger twice
                        >
                          {task.title}
                        </label>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-[10px] gap-1 px-1.5 py-0">
                            {getTaskIcon(task.type)}
                            <span className="capitalize">{task.type.replace('_', ' ')}</span>
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            • {task.durationMinutes} mins
                          </span>
                          {task.topic && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              • Topic: {task.topic}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : selectedPlan && hasCompletedTasks ? (
                <div className="flex flex-col items-center justify-center h-64 text-center space-y-3">
                  <div className="p-4 bg-emerald-500/10 rounded-full text-emerald-500 animate-bounce">
                    <CheckCircle2 className="size-8" />
                  </div>
                  <h3 className="font-semibold text-lg text-emerald-500">All tasks completed!</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Awesome job! You've checked off all your scheduled study tasks for today.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center space-y-3">
                  <div className="p-4 bg-muted/50 rounded-full">
                    <Sparkles className="size-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium">You have free time!</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    No study tasks are scheduled for this date. Enjoy your rest, or click "Generate Weekly Plan" to let the AI build a new schedule.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </AppLayout>
  )
}
