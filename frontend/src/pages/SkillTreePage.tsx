import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { GitBranch, Upload, ArrowLeft, Loader2, RefreshCw, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { AppLayout } from '@/components/layout/AppLayout'
import { SkillTreeGraph } from '@/components/skilltree/SkillTreeGraph'
import { LearningPanel } from '@/components/skilltree/LearningPanel'
import { UploadPanel } from '@/components/upload/UploadPanel'
import { getSkillTrees, getSkillTree, deleteSkillTree } from '@/lib/api'

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

interface SkillTreeData {
  _id: string
  title: string
  nodes: SkillNodeData[]
  overall_mastery: number
  total_interactions: number
  status: string
  source_file: string
  created_at: string
}

export function SkillTreePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [trees, setTrees] = useState<SkillTreeData[]>([])
  const [selectedTree, setSelectedTree] = useState<SkillTreeData | null>(null)
  const [selectedSkill, setSelectedSkill] = useState<SkillNodeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)

  const loadTrees = useCallback(async () => {
    try {
      const data = await getSkillTrees()
      setTrees(data)

      if (id) {
        const tree = await getSkillTree(id)
        setSelectedTree(tree)
      } else if (data.length > 0 && !selectedTree) {
        const tree = await getSkillTree(data[0]._id)
        setSelectedTree(tree)
      }
    } catch {
      // silently fail
    }
    setLoading(false)
  }, [id])

  useEffect(() => {
    loadTrees()
  }, [loadTrees])

  async function handleSelectTree(treeId: string) {
    setLoading(true)
    setSelectedSkill(null)
    try {
      const tree = await getSkillTree(treeId)
      setSelectedTree(tree)
      navigate(`/skill-tree/${treeId}`, { replace: true })
    } catch {
      // silently fail
    }
    setLoading(false)
  }

  async function handleDeleteTree(treeId: string) {
    try {
      await deleteSkillTree(treeId)
      setTrees(prev => prev.filter(t => t._id !== treeId))
      if (selectedTree?._id === treeId) {
        setSelectedTree(null)
        setSelectedSkill(null)
      }
    } catch {
      // silently fail
    }
  }

  function handleNodeClick(nodeId: string, nodeData: SkillNodeData) {
    setSelectedSkill(nodeData)
  }

  function handleMasteryUpdate() {
    // Refresh the current tree to get updated mastery
    if (selectedTree) {
      getSkillTree(selectedTree._id).then(tree => {
        setSelectedTree(tree)
      }).catch(() => {})
    }
  }

  return (
    <AppLayout
      title="Skill Trees"
      description="Visual learning paths generated from your notes"
      headerRight={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowUpload(!showUpload)}>
            <Upload className="size-4 mr-1.5" />
            Upload Notes
          </Button>
          {selectedTree && (
            <Button variant="ghost" size="sm" onClick={() => { setLoading(true); loadTrees() }}>
              <RefreshCw className="size-4" />
            </Button>
          )}
        </div>
      }
    >
      <div className="flex gap-4 h-[calc(100vh-8rem)]">
        {/* Left sidebar: tree list + upload */}
        <div className="w-64 shrink-0 flex flex-col gap-3 overflow-hidden h-full">
          {showUpload && (
            <Card className="p-3 border-border/60">
              <UploadPanel
                compact
                onUploadComplete={() => {
                  setShowUpload(false)
                  setTimeout(loadTrees, 2000) // Wait for processing
                }}
              />
            </Card>
          )}

          <div className="flex-1 overflow-auto space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground px-1 mb-2">Your Skill Trees</p>
            {trees.length === 0 && !loading ? (
              <div className="text-center py-8">
                <GitBranch className="size-8 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No skill trees yet</p>
                <p className="text-xs text-muted-foreground mt-1">Upload notes to get started</p>
                <Button
                  size="sm"
                  className="mt-3 brand-gradient text-white border-0"
                  onClick={() => setShowUpload(true)}
                >
                  <Upload className="size-3.5 mr-1.5" /> Upload
                </Button>
              </div>
            ) : (
              trees.map((tree) => (
                <button
                  key={tree._id}
                  onClick={() => handleSelectTree(tree._id)}
                  className={`
                    w-full text-left rounded-lg border p-3 transition-all
                    ${selectedTree?._id === tree._id
                      ? 'border-primary/50 bg-primary/5 shadow-sm'
                      : 'border-border/60 hover:border-border hover:bg-muted/50'
                    }
                  `}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{tree.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {tree.nodes?.length || 0} skills
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs shrink-0 ${
                        tree.overall_mastery >= 80 ? 'text-emerald-600 dark:text-emerald-400 border-emerald-500/30' :
                        tree.overall_mastery >= 50 ? 'text-amber-600 dark:text-amber-400 border-amber-500/30' :
                        'text-muted-foreground'
                      }`}
                    >
                      {tree.overall_mastery}%
                    </Badge>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Main area: skill tree graph */}
        <div className="flex-1 rounded-xl border border-border/60 shadow-sm overflow-hidden bg-card h-full">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="size-8 text-primary animate-spin" />
            </div>
          ) : selectedTree ? (
            <SkillTreeGraph
              nodes={selectedTree.nodes}
              title={selectedTree.title}
              onNodeClick={handleNodeClick}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4 px-4 text-center">
              <div className="flex size-16 items-center justify-center rounded-2xl brand-gradient shadow-lg">
                <GitBranch className="size-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Build Your Skill Tree</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  Upload your study notes and we'll generate an interactive skill tree with personalized learning paths.
                </p>
              </div>
              <Button
                className="brand-gradient text-white border-0"
                onClick={() => setShowUpload(true)}
              >
                <Upload className="size-4 mr-2" /> Upload Notes
              </Button>
            </div>
          )}
        </div>

        {/* Right panel: learning panel */}
        {selectedSkill && selectedTree && (
          <div className="w-96 shrink-0 rounded-xl border border-border/60 shadow-sm overflow-hidden h-full">
            <LearningPanel
              skill={selectedSkill}
              skillTreeId={selectedTree._id}
              onClose={() => setSelectedSkill(null)}
              onMasteryUpdate={handleMasteryUpdate}
            />
          </div>
        )}
      </div>
    </AppLayout>
  )
}

export default SkillTreePage
