import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Lightbulb, ArrowRight, RotateCcw, Dumbbell, Rocket, Play } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getRecommendations } from '@/lib/api'

interface RecommendedSkill {
  skill_id: string
  skill_name: string
  description: string
  mastery_score: number
  interactions: number
  prerequisites_met: boolean
  level: number
}

interface Recommendations {
  skill_tree_id: string
  skill_tree_title: string
  overall_mastery: number
  recommendations: {
    repeat_basics: RecommendedSkill[]
    moderate_practice: RecommendedSkill[]
    ready_to_advance: RecommendedSkill[]
    next_skills: RecommendedSkill[]
  }
}

export function RecommendationPanel() {
  const [recs, setRecs] = useState<Recommendations | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await getRecommendations()
        setRecs(data)
      } catch {
        // silently fail
      }
      setLoading(false)
    }
    load()
  }, [])

  if (loading || !recs) return null

  const { recommendations } = recs
  const hasAny =
    recommendations.next_skills.length > 0 ||
    recommendations.repeat_basics.length > 0 ||
    recommendations.moderate_practice.length > 0 ||
    recommendations.ready_to_advance.length > 0

  if (!hasAny) return null

  return (
    <Card className="border-border/60 shadow-sm border-l-4 border-l-primary/60">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg brand-gradient">
            <Lightbulb className="size-4 text-white" />
          </div>
          <div>
            <CardTitle className="text-base">Recommended Next Steps</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">{recs.skill_tree_title}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Next skills to start */}
        {recommendations.next_skills.slice(0, 2).map((skill) => (
          <Link
            key={skill.skill_id}
            to={`/skill-tree/${recs.skill_tree_id}`}
            className="group flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3 hover:bg-primary/10 transition-colors"
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg brand-gradient">
              <Play className="size-3.5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{skill.skill_name}</p>
              <p className="text-xs text-muted-foreground">Ready to start</p>
            </div>
            <Badge className="brand-gradient text-white border-0 text-xs">Start</Badge>
          </Link>
        ))}

        {/* Repeat basics */}
        {recommendations.repeat_basics.slice(0, 2).map((skill) => (
          <Link
            key={skill.skill_id}
            to={`/skill-tree/${recs.skill_tree_id}`}
            className="group flex items-center gap-3 rounded-lg border border-orange-500/20 p-3 hover:bg-orange-500/5 transition-colors"
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-orange-500/10">
              <RotateCcw className="size-3.5 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{skill.skill_name}</p>
              <p className="text-xs text-orange-600 dark:text-orange-400">Review needed • {skill.mastery_score}%</p>
            </div>
            <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </Link>
        ))}

        {/* Moderate practice */}
        {recommendations.moderate_practice.slice(0, 2).map((skill) => (
          <Link
            key={skill.skill_id}
            to={`/skill-tree/${recs.skill_tree_id}`}
            className="group flex items-center gap-3 rounded-lg border border-amber-500/20 p-3 hover:bg-amber-500/5 transition-colors"
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
              <Dumbbell className="size-3.5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{skill.skill_name}</p>
              <p className="text-xs text-amber-600 dark:text-amber-400">Practice more • {skill.mastery_score}%</p>
            </div>
            <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </Link>
        ))}

        {/* Ready to advance */}
        {recommendations.ready_to_advance.slice(0, 1).map((skill) => (
          <div
            key={skill.skill_id}
            className="flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3"
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
              <Rocket className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{skill.skill_name}</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">Mastered! • {skill.mastery_score}%</p>
            </div>
            <Badge variant="outline" className="text-xs text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
              ✓ Done
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export default RecommendationPanel
