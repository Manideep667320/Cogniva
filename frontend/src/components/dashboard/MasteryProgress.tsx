import { useEffect, useState } from 'react'
import { TrendingUp, Award, BarChart3 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { getSkillTrees } from '@/lib/api'

interface SkillTreeSummary {
  _id: string
  title: string
  overall_mastery: number
  nodes: Array<{
    id: string
    name: string
    mastery: number
  }>
}

export function MasteryProgress() {
  const [trees, setTrees] = useState<SkillTreeSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await getSkillTrees()
        setTrees(data)
      } catch {
        // silently fail
      }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <Card className="border-border/60 shadow-sm">
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-2 bg-muted rounded w-full" />
            <div className="h-2 bg-muted rounded w-2/3" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (trees.length === 0) {
    return null
  }

  function getMasteryColor(score: number) {
    if (score >= 80) return 'text-emerald-600 dark:text-emerald-400'
    if (score >= 50) return 'text-amber-600 dark:text-amber-400'
    if (score > 0) return 'text-orange-600 dark:text-orange-400'
    return 'text-muted-foreground'
  }

  function getMasteryBg(score: number) {
    if (score >= 80) return '[&>div]:bg-emerald-500'
    if (score >= 50) return '[&>div]:bg-amber-500'
    if (score > 0) return '[&>div]:bg-orange-500'
    return ''
  }

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10">
            <TrendingUp className="size-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <CardTitle className="text-base">Mastery Progress</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {trees.map((tree) => (
          <div key={tree._id} className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium truncate pr-2">{tree.title}</p>
              <span className={`text-sm font-bold tabular-nums ${getMasteryColor(tree.overall_mastery)}`}>
                {tree.overall_mastery}%
              </span>
            </div>
            <Progress
              value={tree.overall_mastery}
              className={`h-2 ${getMasteryBg(tree.overall_mastery)}`}
            />
            {/* Top skills breakdown */}
            <div className="grid grid-cols-2 gap-1.5">
              {tree.nodes?.slice(0, 4).map((node) => (
                <div key={node.id} className="flex items-center gap-1.5">
                  <div className={`size-1.5 rounded-full ${
                    node.mastery >= 80 ? 'bg-emerald-500' :
                    node.mastery >= 50 ? 'bg-amber-500' :
                    node.mastery > 0 ? 'bg-orange-500' :
                    'bg-border'
                  }`} />
                  <span className="text-xs text-muted-foreground truncate">{node.name}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export default MasteryProgress
