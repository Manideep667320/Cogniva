import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Zap, Brain, Target, TrendingUp, Flame, BookOpen, Wrench } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getLearningProfile } from '@/lib/api'

interface LearningProfileData {
  learning_speed: 'slow' | 'medium' | 'fast'
  preferred_style: 'conceptual' | 'practical'
  difficulty_level: string
  engagement_score: number
  correct_rate: number
  total_interactions: number
  streak: { current: number; longest: number }
  top_weaknesses: Array<{ concept: string; frequency: number }>
}

const speedConfig = {
  slow: { label: 'Steady', color: 'text-amber-500', bg: 'bg-amber-500/10', icon: '🐢' },
  medium: { label: 'Balanced', color: 'text-blue-500', bg: 'bg-blue-500/10', icon: '⚡' },
  fast: { label: 'Rapid', color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: '🚀' },
}

const difficultyConfig: Record<string, { label: string; color: string }> = {
  easy: { label: 'Easy', color: 'text-green-500' },
  medium: { label: 'Medium', color: 'text-amber-500' },
  hard: { label: 'Hard', color: 'text-red-500' },
  adaptive: { label: 'Adaptive', color: 'text-purple-500' },
}

export function LearningProfileCard() {
  const [profile, setProfile] = useState<LearningProfileData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await getLearningProfile()
        setProfile(data)
      } catch {
        // Profile may not exist yet
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
            <div className="h-8 bg-muted rounded" />
            <div className="h-4 bg-muted rounded w-2/3" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!profile) {
    return (
      <Card className="border-border/60 shadow-sm border-l-4 border-l-primary/40">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <Brain className="size-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">Learning Profile</p>
              <p className="text-xs text-muted-foreground">
                Start practicing to build your personalized learning profile
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const speed = speedConfig[profile.learning_speed] || speedConfig.medium
  const difficulty = difficultyConfig[profile.difficulty_level] || difficultyConfig.adaptive

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="border-border/60 shadow-sm overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="size-4 text-primary" />
            Learning Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Key metrics row */}
          <div className="grid grid-cols-3 gap-3">
            {/* Learning Speed */}
            <div className={`rounded-lg ${speed.bg} p-3 text-center`}>
              <span className="text-lg">{speed.icon}</span>
              <p className={`text-xs font-bold mt-1 ${speed.color}`}>{speed.label}</p>
              <p className="text-[10px] text-muted-foreground">Speed</p>
            </div>

            {/* Engagement */}
            <div className="rounded-lg bg-primary/5 p-3 text-center relative overflow-hidden">
              <div
                className="absolute inset-x-0 bottom-0 bg-primary/10 transition-all duration-700"
                style={{ height: `${profile.engagement_score}%` }}
              />
              <div className="relative">
                <Flame className="size-4 mx-auto text-orange-500" />
                <p className="text-xs font-bold mt-1">{profile.engagement_score}%</p>
                <p className="text-[10px] text-muted-foreground">Engagement</p>
              </div>
            </div>

            {/* Accuracy */}
            <div className="rounded-lg bg-emerald-500/5 p-3 text-center">
              <Target className="size-4 mx-auto text-emerald-500" />
              <p className="text-xs font-bold mt-1 text-emerald-600 dark:text-emerald-400">{profile.correct_rate}%</p>
              <p className="text-[10px] text-muted-foreground">Accuracy</p>
            </div>
          </div>

          {/* Info badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs gap-1">
              <Zap className="size-3" />
              <span className={difficulty.color}>{difficulty.label}</span> difficulty
            </Badge>
            <Badge variant="outline" className="text-xs gap-1">
              {profile.preferred_style === 'practical'
                ? <Wrench className="size-3" />
                : <BookOpen className="size-3" />
              }
              {profile.preferred_style} learner
            </Badge>
            {profile.streak.current > 0 && (
              <Badge variant="outline" className="text-xs gap-1">
                <Flame className="size-3 text-orange-500" />
                {profile.streak.current} day streak
              </Badge>
            )}
          </div>

          {/* Top weaknesses */}
          {profile.top_weaknesses.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1.5">
                Focus Areas
              </p>
              <div className="flex flex-wrap gap-1.5">
                {profile.top_weaknesses.slice(0, 3).map((w, i) => (
                  <Badge key={i} variant="secondary" className="text-xs bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20">
                    {w.concept} ({w.frequency}×)
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Stats footer */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
            <span className="flex items-center gap-1">
              <TrendingUp className="size-3" />
              {profile.total_interactions} interactions
            </span>
            {profile.streak.longest > 0 && (
              <span>Best streak: {profile.streak.longest} days</span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
