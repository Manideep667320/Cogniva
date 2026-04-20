import { useCallback, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Panel,
  type Node,
  type Edge,
  BackgroundVariant,
  ConnectionLineType,
  MarkerType,
} from '@xyflow/react'
import dagre from 'dagre'
import { CheckCircle2, Circle, Play, Lock } from 'lucide-react'
import '@xyflow/react/dist/style.css'
import { SkillNode } from './SkillNode'

interface SkillNodeData {
  id: string
  name: string
  description: string
  prerequisites: string[]
  mastery: number
  level: number
  mastery_data?: {
    mastery_score: number
    interactions: number
    correct_answers: number
    last_interaction: string | null
    mistakes_count: number
  }
}

interface SkillTreeGraphProps {
  nodes: SkillNodeData[]
  title: string
  onNodeClick?: (nodeId: string, nodeData: SkillNodeData) => void
  className?: string
}

const nodeTypes = {
  skill: SkillNode,
}

const NODE_WIDTH = 220
const NODE_HEIGHT = 100

function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  direction: 'TB' | 'LR' = 'TB'
) {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({
    rankdir: direction,
    nodesep: 80,
    ranksep: 100,
    marginx: 40,
    marginy: 40,
  })

  nodes.forEach((node) => {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT })
  })

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target)
  })

  dagre.layout(g)

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = g.node(node.id)
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - NODE_WIDTH / 2,
        y: nodeWithPosition.y - NODE_HEIGHT / 2,
      },
    }
  })

  return { nodes: layoutedNodes, edges }
}

export function SkillTreeGraph({ nodes: skillNodes, title, onNodeClick, className = '' }: SkillTreeGraphProps) {
  // Calculate Stats
  const stats = useMemo(() => {
    const total = skillNodes.length
    const mastered = skillNodes.filter(n => (n.mastery_data?.mastery_score ?? n.mastery ?? 0) >= 80).length
    const progress = total > 0 ? Math.round((mastered / total) * 100) : 0
    return { total, mastered, progress }
  }, [skillNodes])

  // Build mastery map for prerequisite checking
  const masteryMap = useMemo(() => {
    const map: Record<string, number> = {}
    skillNodes.forEach(n => {
      map[n.id] = n.mastery_data?.mastery_score ?? n.mastery ?? 0
    })
    return map
  }, [skillNodes])

  // Convert skill nodes to React Flow nodes
  const initialNodes: Node[] = useMemo(
    () =>
      skillNodes.map((node) => {
        const prerequisitesMet = node.prerequisites.every(
          (prereqId) => (masteryMap[prereqId] ?? 0) >= 50
        )

        return {
          id: node.id,
          type: 'skill',
          position: { x: 0, y: 0 },
          data: {
            label: node.name,
            description: node.description,
            mastery: node.mastery_data?.mastery_score ?? node.mastery ?? 0,
            prerequisites_met: prerequisitesMet,
            interactions: node.mastery_data?.interactions ?? 0,
            level: node.level,
          },
        }
      }),
    [skillNodes, masteryMap]
  )

  // Build edges from prerequisites
  const initialEdges: Edge[] = useMemo(
    () =>
      skillNodes.flatMap((node) =>
        node.prerequisites
          .filter((prereqId) => skillNodes.some((n) => n.id === prereqId))
          .map((prereqId) => {
            const prereqMastery = masteryMap[prereqId] ?? 0
            const isMastered = prereqMastery >= 80
            const isInProgress = prereqMastery >= 50
            
            let strokeColor = '#475569' // Default/Locked
            if (isMastered) strokeColor = '#10b981' // Emerald
            else if (isInProgress) strokeColor = '#f59e0b' // Amber
            else if (prereqMastery > 0) strokeColor = '#6366f1' // Indigo

            return {
              id: `${prereqId}-${node.id}`,
              source: prereqId,
              target: node.id,
              type: 'smoothstep',
              animated: !isMastered && prereqMastery > 0,
              style: {
                stroke: strokeColor,
                strokeWidth: 2,
                strokeDasharray: isMastered ? '0' : '5 5',
                opacity: isInProgress ? 1 : 0.4,
              },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: strokeColor,
              },
            }
          })
      ),
    [skillNodes, masteryMap]
  )

  // Apply dagre layout
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(
    () => getLayoutedElements(initialNodes, initialEdges),
    [initialNodes, initialEdges]
  )

  const [nodes, , onNodesChange] = useNodesState(layoutedNodes)
  const [edges, , onEdgesChange] = useEdgesState(layoutedEdges)

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const skillNode = skillNodes.find((n) => n.id === node.id)
      if (skillNode && onNodeClick) {
        onNodeClick(node.id, skillNode)
      }
    },
    [skillNodes, onNodeClick]
  )

  if (skillNodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>No skills to display. Upload notes to generate a skill tree.</p>
      </div>
    )
  }

  return (
    <div className={`w-full h-full relative ${className} bg-[#020617]`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={1.5}
        attributionPosition="bottom-left"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#1e293b" />
        
        {/* Top-Left Header Panel */}
        <Panel position="top-left" className="m-6 space-y-4 pointer-events-none select-none">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-slate-100 tracking-tight">{title}</h2>
            <p className="text-sm text-slate-400 font-medium">
              {stats.mastered}/{stats.total} mastered · {stats.progress}% complete
            </p>
          </div>
          
          {/* Legend/Filter Bar */}
          <div className="flex items-center gap-3 bg-slate-900/50 backdrop-blur-md p-1.5 rounded-xl border border-slate-800/50">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Mastered
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
              <Circle className="w-3.5 h-3.5" />
              In Progress
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
              <Play className="w-3.5 h-3.5" />
              Unlocked
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-500 text-xs font-semibold">
              <Lock className="w-3.5 h-3.5" />
              Locked
            </div>
          </div>
        </Panel>

        {/* Top-Right "Live" Badge */}
        <Panel position="top-right" className="m-6">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            Live
          </div>
        </Panel>

        <Controls 
          className="!bg-slate-900/80 !backdrop-blur-md !border-slate-800 !shadow-2xl !rounded-xl !p-1 scale-110 m-6"
          showInteractive={false}
        />
        
        <MiniMap
          className="!bg-slate-900/80 !backdrop-blur-md !border-slate-800 !rounded-xl overflow-hidden m-6"
          nodeColor={(node) => {
            const mastery = (node.data as any)?.mastery ?? 0
            if (mastery >= 80) return '#10b981'
            if (mastery >= 50) return '#f59e0b'
            if (mastery > 0) return '#6366f1'
            return '#334155'
          }}
          maskColor="rgba(0,0,0,0.3)"
          style={{ height: 120, width: 180 }}
        />
      </ReactFlow>
    </div>
  )
}

export default SkillTreeGraph
