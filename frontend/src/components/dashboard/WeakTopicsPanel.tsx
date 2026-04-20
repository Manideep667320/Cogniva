import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowRight, BookOpen } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { getSkillTrees } from '@/lib/api'

interface WeakSkill {
  id: string
  name: string
  mastery: number
  treeId: string
  treeTitle: string
}

export function WeakTopicsPanel() {
  const [weakSkills, setWeakSkills] = useState<WeakSkill[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const trees = await getSkillTrees()
        const weak: WeakSkill[] = []

        for (const tree of trees) {
          if (tree.nodes) {
            for (const node of tree.nodes) {
              const mastery = node.mastery_data?.mastery_score ?? node.mastery ?? 0
              if (mastery < 50 && (node.mastery_data?.interactions ?? 0) > 0) {
                weak.push({
                  id: node.id,
                  name: node.name,
                  mastery,
                  treeId: tree._id,
                  treeTitle: tree.title,
                })
              }
            }
          }
        }

        weak.sort((a, b) => a.mastery - b.mastery)
        setWeakSkills(weak.slice(0, 5))
      } catch {
        // silently fail
      }
      setLoading(false)
    }
    load()
  }, [])

  if (loading || weakSkills.length === 0) return null

  return (
    <Card className="border-border/60 shadow-sm border-l-4 border-l-orange-500/60">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-orange-500/10">
            <AlertTriangle className="size-4 text-orange-600 dark:text-orange-400" />
          </div>
          <CardTitle className="text-base">Weak Topics</CardTitle>
          <Badge variant="outline" className="ml-auto text-xs text-orange-600 dark:text-orange-400 border-orange-500/30">
            {weakSkills.length} topics
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {weakSkills.map((skill) => (
          <Link
            key={`${skill.treeId}-${skill.id}`}
            to={`/skill-tree/${skill.treeId}`}
            className="group flex items-center gap-3 rounded-lg border border-border/60 p-3 hover:bg-muted/50 transition-colors"
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-orange-500/10">
              <BookOpen className="size-3.5 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                {skill.name}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Progress
                  value={skill.mastery}
                  className="h-1.5 flex-1 [&>div]:bg-orange-500"
                />
                <span className="text-xs font-medium text-orange-600 dark:text-orange-400 tabular-nums">
                  {skill.mastery}%
                </span>
              </div>
            </div>
            <ArrowRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}

export default WeakTopicsPanel
