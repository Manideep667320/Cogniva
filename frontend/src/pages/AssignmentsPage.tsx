import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AppLayout } from '@/components/layout/AppLayout'
import { getStudentAssignments, submitAssignment, evaluateAssignment, getFacultySubmissions, overrideAssignmentScore, getCourses, getFacultyCourses } from '@/lib/api'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2, CheckCircle, FileText, Send, AlertCircle, Bot, User as UserIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'

export function AssignmentsPage() {
  const { user, profile } = useAuth()
  const isFaculty = profile?.role === 'faculty'

  const [activeTab, setActiveTab] = useState(isFaculty ? 'faculty' : 'student')

  return (
    <AppLayout title="Assignments" description="Manage and evaluate course assignments">
      <div className="max-w-6xl mx-auto space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            {isFaculty ? (
              <TabsTrigger value="faculty">Faculty Submissions</TabsTrigger>
            ) : (
              <>
                <TabsTrigger value="student">My Submissions</TabsTrigger>
                <TabsTrigger value="submit">New Submission</TabsTrigger>
              </>
            )}
          </TabsList>
          
          <TabsContent value="student" className="mt-6">
            <StudentHistoryTab />
          </TabsContent>
          
          <TabsContent value="submit" className="mt-6">
            <StudentSubmitTab onSubmitted={() => setActiveTab('student')} />
          </TabsContent>

          {isFaculty && (
            <TabsContent value="faculty" className="mt-6">
              <FacultySubmissionsTab />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </AppLayout>
  )
}

function StudentHistoryTab() {
  const [assignments, setAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [evaluatingId, setEvaluatingId] = useState<string | null>(null)

  useEffect(() => {
    loadAssignments()
  }, [])

  async function loadAssignments() {
    try {
      setLoading(true)
      const data = await getStudentAssignments()
      setAssignments(data)
    } catch (error) {
      toast.error('Failed to load assignments')
    } finally {
      setLoading(false)
    }
  }

  async function handleEvaluate(id: string) {
    try {
      setEvaluatingId(id)
      await evaluateAssignment(id)
      toast.success('Assignment evaluated successfully')
      loadAssignments()
    } catch (error) {
      toast.error('Failed to evaluate assignment')
    } finally {
      setEvaluatingId(null)
    }
  }

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>

  if (assignments.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
          <FileText className="h-12 w-12 mb-4 text-muted-foreground/50" />
          <p>No assignments submitted yet.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <ScrollArea className="h-[calc(100vh-220px)] pr-4">
      <div className="space-y-4 pb-4">
        {assignments.map(a => (
          <Card key={a._id} className="overflow-hidden">
            <CardHeader className="bg-muted/30 pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{a.title}</CardTitle>
                  <CardDescription>{a.course_id?.title}</CardDescription>
                </div>
                <Badge variant={a.status === 'evaluated' ? 'default' : a.status === 'reviewed' ? 'secondary' : 'outline'}>
                  {a.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Question</h4>
                <p className="text-sm bg-muted/50 p-3 rounded-md">{a.question_text}</p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Your Answer</h4>
                <p className="text-sm whitespace-pre-wrap border p-3 rounded-md">{a.student_answer}</p>
              </div>
              
              {a.status === 'pending' && (
                <div className="flex justify-end pt-2">
                  <Button 
                    onClick={() => handleEvaluate(a._id)} 
                    disabled={evaluatingId === a._id}
                  >
                    {evaluatingId === a._id ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Evaluating with AI...</>
                    ) : (
                      <><Bot className="mr-2 h-4 w-4" /> Get AI Feedback</>
                    )}
                  </Button>
                </div>
              )}

              {(a.status === 'evaluated' || a.status === 'reviewed') && a.ai_evaluation && (
                <div className="mt-4 border rounded-lg p-4 bg-primary/5 space-y-4">
                  <div className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-lg">AI Feedback</h3>
                    <div className="ml-auto text-xl font-bold text-primary">
                      {a.ai_evaluation.score}/100
                    </div>
                  </div>
                  
                  <p className="text-sm">{a.ai_evaluation.feedback}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    {a.ai_evaluation.strengths?.length > 0 && (
                      <div className="space-y-1">
                        <h4 className="font-medium text-sm text-green-600 dark:text-green-400 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Strengths</h4>
                        <ul className="list-disc list-inside text-sm text-muted-foreground">
                          {a.ai_evaluation.strengths.map((s: string, i: number) => <li key={i}>{s}</li>)}
                        </ul>
                      </div>
                    )}
                    {a.ai_evaluation.weaknesses?.length > 0 && (
                      <div className="space-y-1">
                        <h4 className="font-medium text-sm text-red-600 dark:text-red-400 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Areas to Improve</h4>
                        <ul className="list-disc list-inside text-sm text-muted-foreground">
                          {a.ai_evaluation.weaknesses.map((w: string, i: number) => <li key={i}>{w}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  {a.faculty_override_score !== null && (
                    <div className="mt-4 pt-4 border-t border-primary/10 flex items-center gap-2 text-sm">
                      <UserIcon className="h-4 w-4 text-orange-500" />
                      <span>Faculty reviewed this submission. Final Score: <strong>{a.faculty_override_score}/100</strong></span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  )
}

function StudentSubmitTab({ onSubmitted }: { onSubmitted: () => void }) {
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  const [courseId, setCourseId] = useState('')
  const [title, setTitle] = useState('')
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')

  useEffect(() => {
    async function loadCourses() {
      try {
        setLoading(true)
        const res = await getCourses()
        setCourses(res.data)
      } catch (e) {
        toast.error('Failed to load courses')
      } finally {
        setLoading(false)
      }
    }
    loadCourses()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!courseId || !title || !question || !answer) {
      return toast.error('Please fill all fields')
    }

    try {
      setSubmitting(true)
      await submitAssignment(courseId, title, question, answer)
      toast.success('Assignment submitted successfully')
      
      // Reset form
      setCourseId('')
      setTitle('')
      setQuestion('')
      setAnswer('')
      
      onSubmitted()
    } catch (error) {
      toast.error('Failed to submit assignment')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit New Assignment</CardTitle>
        <CardDescription>Paste your assignment question and your answer for AI evaluation</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Course</Label>
            <Select value={courseId} onValueChange={setCourseId} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                {(courses || []).map(c => (
                  <SelectItem key={c._id} value={c._id}>{c.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Assignment Title</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Week 3 Reflection" />
          </div>
          
          <div className="space-y-2">
            <Label>Question / Prompt</Label>
            <Textarea 
              value={question} 
              onChange={e => setQuestion(e.target.value)} 
              placeholder="What was the assignment question?" 
              className="min-h-[100px]"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Your Answer</Label>
            <Textarea 
              value={answer} 
              onChange={e => setAnswer(e.target.value)} 
              placeholder="Type or paste your answer here..." 
              className="min-h-[200px]"
            />
          </div>
          
          <Button type="submit" disabled={submitting || !courseId || !title || !question || !answer} className="w-full">
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Submit Assignment
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function FacultySubmissionsTab() {
  const { profile } = useAuth()
  const [courses, setCourses] = useState<any[]>([])
  const [selectedCourse, setSelectedCourse] = useState<string>('')
  const [submissions, setSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [overridingId, setOverridingId] = useState<string | null>(null)
  const [overrideScores, setOverrideScores] = useState<Record<string, string>>({})

  useEffect(() => {
    async function loadFacultyCourses() {
      if (!profile?.id) return
      try {
        const res = await getFacultyCourses(profile.id)
        setCourses(res.data)
        if (res.data.length > 0) {
          setSelectedCourse(res.data[0]._id)
        }
      } catch (e) {
        toast.error('Failed to load courses')
      }
    }
    loadFacultyCourses()
  }, [profile?.id])

  useEffect(() => {
    if (selectedCourse) {
      loadSubmissions(selectedCourse)
    }
  }, [selectedCourse])

  async function loadSubmissions(courseId: string) {
    try {
      setLoading(true)
      const data = await getFacultySubmissions(courseId)
      setSubmissions(data)
    } catch (error) {
      toast.error('Failed to load submissions')
    } finally {
      setLoading(false)
    }
  }

  async function handleOverride(id: string) {
    const scoreVal = parseInt(overrideScores[id])
    if (isNaN(scoreVal) || scoreVal < 0 || scoreVal > 100) {
      return toast.error('Please enter a valid score (0-100)')
    }
    
    try {
      setOverridingId(id)
      await overrideAssignmentScore(id, scoreVal)
      toast.success('Score updated')
      loadSubmissions(selectedCourse)
    } catch (error) {
      toast.error('Failed to override score')
    } finally {
      setOverridingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-lg border">
        <Label className="whitespace-nowrap">Filter by Course:</Label>
        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Select course" />
          </SelectTrigger>
          <SelectContent>
            {(courses || []).map(c => (
              <SelectItem key={c._id} value={c._id}>{c.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>
      ) : submissions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mb-4 text-muted-foreground/50" />
            <p>No submissions for this course yet.</p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[calc(100vh-280px)] pr-4">
          <div className="space-y-4 pb-4">
            {submissions.map(a => (
              <Card key={a._id}>
                <CardHeader className="bg-muted/30 pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{a.title}</CardTitle>
                      <CardDescription>Submitted by: {a.user_id?.full_name || 'Student'}</CardDescription>
                    </div>
                    <Badge variant={a.status === 'reviewed' ? 'secondary' : a.status === 'evaluated' ? 'default' : 'outline'}>
                      {a.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Question</h4>
                      <p className="text-sm border p-3 rounded-md bg-muted/10 h-32 overflow-y-auto">{a.question_text}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Answer</h4>
                      <p className="text-sm border p-3 rounded-md h-32 overflow-y-auto whitespace-pre-wrap">{a.student_answer}</p>
                    </div>
                  </div>

                  {a.status !== 'pending' && a.ai_evaluation && (
                    <div className="border rounded-md p-4 bg-primary/5">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm flex items-center gap-2"><Bot className="h-4 w-4 text-primary" /> AI Evaluation</h4>
                        <span className="font-bold">Score: {a.ai_evaluation.score}/100</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{a.ai_evaluation.feedback}</p>
                      
                      <div className="flex items-center gap-3 pt-3 mt-3 border-t">
                        <Label>Override Score:</Label>
                        <Input 
                          type="number" 
                          min="0" max="100" 
                          className="w-24 h-8"
                          placeholder={a.faculty_override_score !== null ? String(a.faculty_override_score) : ''}
                          value={overrideScores[a._id] !== undefined ? overrideScores[a._id] : (a.faculty_override_score !== null ? String(a.faculty_override_score) : '')}
                          onChange={e => setOverrideScores(prev => ({...prev, [a._id]: e.target.value}))}
                        />
                        <Button 
                          size="sm" 
                          onClick={() => handleOverride(a._id)}
                          disabled={overridingId === a._id || !overrideScores[a._id]}
                        >
                          {overridingId === a._id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Score'}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}
