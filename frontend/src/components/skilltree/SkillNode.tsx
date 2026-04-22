import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Lock, CheckCircle2, Circle, Play, Zap, AlertTriangle } from 'lucide-react'

interface SkillNodeData {
  label: string
  description?: string
  mastery: number
  prerequisites_met: boolean
  interactions: number
  level: number
  isHighlighted?: boolean
  isDimmed?: boolean
  isWeak?: boolean
  [key: string]: unknown
}

function getStatusStyle(mastery: number, prerequisites_met: boolean) {
  if (!prerequisites_met) {
    return {
      status: 'locked',
      bg: 'bg-slate-900/40',
      border: 'border-slate-800/60',
      text: 'text-slate-500',
      icon: Lock,
      accent: 'bg-slate-700/50',
      badge: 'bg-slate-800 text-slate-400'
    }
  }
  if (mastery >= 80) {
    return {
      status: 'mastered',
      bg: 'bg-emerald-950/30',
      border: 'border-emerald-500/40',
      text: 'text-emerald-400',
      icon: CheckCircle2,
      accent: 'bg-emerald-500',
      badge: 'bg-emerald-500/20 text-emerald-300'
    }
  }
  if (mastery > 0) {
    return {
      status: 'in-progress',
      bg: 'bg-amber-950/30',
      border: 'border-amber-500/40',
      text: 'text-amber-400',
      icon: Circle,
      accent: 'bg-amber-500',
      badge: 'bg-amber-500/20 text-amber-300'
    }
  }
  return {
    status: 'unlocked',
    bg: 'bg-indigo-950/30',
    border: 'border-indigo-500/40',
    text: 'text-indigo-400',
    icon: Play,
    accent: 'bg-indigo-500',
    badge: 'bg-indigo-500/20 text-indigo-300'
  }
}

export const SkillNode = memo(function SkillNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as SkillNodeData
  const { 
    label, 
    mastery = 0, 
    prerequisites_met = true, 
    level = 1,
    isHighlighted = true,
    isDimmed = false,
    isWeak = false,
    interactions = 0,
  } = nodeData
  
  const style = getStatusStyle(mastery, prerequisites_met)
  // Detect weak nodes: has interactions but low mastery
  const showWeakGlow = (isWeak || (mastery < 30 && interactions > 2)) && prerequisites_met
  const XP_VALUES = [100, 150, 200, 250, 300]
  const xp = XP_VALUES[(level - 1) % XP_VALUES.length]
  const DURATION_VALUES = ['45m', '60m', '75m', '90m', '120m']
  const duration = DURATION_VALUES[(level - 1) % DURATION_VALUES.length]

  // Calculate dots (4 dots total)
  const dotCount = 4
  const filledDots = Math.floor((mastery / 100) * dotCount)

  return (
    <div
      className={`
        relative px-4 py-3 rounded-xl border transition-all duration-300 min-w-[180px] max-w-[240px]
        ${style.bg} ${style.border} backdrop-blur-md
        ${selected ? 'ring-2 ring-primary/50 shadow-[0_0_20px_rgba(59,130,246,0.3)] scale-105 z-20' : 'hover:scale-[1.02]'}
        ${!prerequisites_met ? 'opacity-70 grayscale-[0.05]' : 'shadow-lg'}
        ${isDimmed ? 'opacity-20 grayscale-[0.8] scale-95 pointer-events-none' : 'opacity-100'}
        ${isHighlighted && selected ? 'z-20' : 'z-10'}
        cursor-pointer group
      `}
      style={showWeakGlow ? {
        animation: 'weakPulse 2s ease-in-out infinite',
        boxShadow: '0 0 15px rgba(239, 68, 68, 0.25)',
      } : undefined}
    >
      <Handle 
        type="target" 
        position={Position.Top} 
        className="!bg-primary/50 !w-2 !h-2 !border-0 !opacity-0 group-hover:!opacity-100 transition-opacity" 
      />

      {/* XP Badge */}
      {prerequisites_met && (
        <div className={`absolute -top-2.5 -right-2 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm z-10 ${style.badge} flex items-center gap-0.5`}>
          <Zap className="w-2.5 h-2.5 fill-current" />
          +{xp}XP
        </div>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className={`${style.text}`}>
            <style.icon className="w-4 h-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <p className="text-sm font-bold tracking-tight text-slate-100 truncate">{label}</p>
            {!isDimmed && (
              <p className={`text-[9px] font-bold uppercase tracking-wider transition-all duration-300 opacity-0 group-hover:opacity-100 h-0 group-hover:h-3 overflow-hidden ${style.text}`}>
                {!prerequisites_met ? 'Locked' : mastery >= 80 ? 'Mastered' : mastery > 0 ? 'In Progress' : 'Ready to Start'}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-end justify-between mt-1">
          {/* Progress Dots */}
          <div className="flex gap-1">
            {[...Array(dotCount)].map((_, i) => (
              <div 
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i < filledDots 
                    ? style.accent 
                    : 'bg-slate-700/50'
                }`}
              />
            ))}
          </div>

          {/* Time indicator */}
          <div className="text-[10px] font-medium text-slate-500">
            {duration}
          </div>
        </div>
      </div>

      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="!bg-primary/50 !w-2 !h-2 !border-0 !opacity-0 group-hover:!opacity-100 transition-opacity" 
      />
    </div>
  )
})

export default SkillNode
