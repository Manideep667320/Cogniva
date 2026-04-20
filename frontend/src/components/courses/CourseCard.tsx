import { BookOpen, Clock, ChartBar as BarChart2, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

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
    Beginner: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    Intermediate: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    Advanced: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800',
}

interface CourseCardProps {
    course: Course
    onView: (course: Course) => void
    isFaculty?: boolean
}

export function CourseCard({ course, onView, isFaculty }: CourseCardProps) {
    return (
        <Card className="border-border/60 shadow-sm hover:shadow-md transition-all hover:border-primary/30 flex flex-col">
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg brand-gradient">
                        <BookOpen className="size-5 text-white" />
                    </div>
                    <Badge
                        variant="outline"
                        className={`text-xs shrink-0 ${levelColors[course.level] || ''}`}
                    >
                        <BarChart2 className="size-3 mr-1" />{course.level}
                    </Badge>
                </div>
                <div className="mt-2">
                    <h3 className="font-semibold text-sm leading-snug line-clamp-2">{course.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{course.description}</p>
                </div>
            </CardHeader>

            <CardContent className="pb-2 flex-1">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <Clock className="size-3" /> {course.duration_hours}h
                    </span>
                    <span className="text-border">•</span>
                    <span>By {course.faculty_name || 'Instructor'}</span>
                </div>
                {course.tags && course.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                        {course.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs py-0">
                                {tag}
                            </Badge>
                        ))}
                    </div>
                )}
            </CardContent>

            <CardFooter className="pt-2">
                <Button
                    onClick={() => onView(course)}
                    variant="outline"
                    size="sm"
                    className="w-full hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
                >
                    {isFaculty ? 'View & Edit' : 'View Course'} <ChevronRight className="size-3 ml-1" />
                </Button>
            </CardFooter>
        </Card>
    )
}
