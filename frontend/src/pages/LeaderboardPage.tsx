import { useEffect, useState } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { getLeaderboard, getMyRank, getBadges, getMyBadges } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge as UIBadge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Trophy, Medal, Star, Flame, Award, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'

export function LeaderboardPage() {
  const { profile } = useAuth()
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [myRank, setMyRank] = useState<any>(null)
  const [allBadges, setAllBadges] = useState<any[]>([])
  const [myBadges, setMyBadges] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const [lbData, rankData, badgesData, myBadgesData] = await Promise.all([
          getLeaderboard(),
          getMyRank(),
          getBadges(),
          getMyBadges()
        ])
        setLeaderboard(lbData)
        setMyRank(rankData)
        setAllBadges(badgesData)
        setMyBadges(myBadgesData)
      } catch (e) {
        toast.error('Failed to load leaderboard data')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) return (
    <AppLayout title="Leaderboard" description="Loading rankings...">
      <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    </AppLayout>
  )

  const myBadgeIds = new Set(myBadges.map(b => b._id))

  return (
    <AppLayout title="Leaderboard & Badges" description="Compete with peers and earn achievements">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {myRank && (
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex flex-col items-center justify-center bg-background rounded-full h-16 w-16 shadow-sm border">
                  <span className="text-xs text-muted-foreground font-semibold">RANK</span>
                  <span className="text-2xl font-bold text-primary">#{myRank.rank}</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{profile?.full_name || 'You'}</h2>
                  <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                    <span className="flex items-center"><Star className="h-4 w-4 mr-1 text-yellow-500" /> {myRank.xp} XP</span>
                    <span className="flex items-center"><Flame className="h-4 w-4 mr-1 text-orange-500" /> {myRank.streak} Day Streak</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="leaderboard">
          <TabsList className="mb-4">
            <TabsTrigger value="leaderboard">Global Leaderboard</TabsTrigger>
            <TabsTrigger value="badges">Badges & Achievements</TabsTrigger>
          </TabsList>

          <TabsContent value="leaderboard">
            <Card>
              <CardHeader>
                <CardTitle>Top Students</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {leaderboard.map((entry) => (
                    <div 
                      key={entry.user?._id || entry.rank}
                      className={`flex items-center gap-4 p-4 rounded-lg border ${
                        entry.user?._id === profile?._id ? 'bg-primary/5 border-primary/30' : 'bg-card'
                      }`}
                    >
                      <div className="flex items-center justify-center w-8 font-bold text-lg text-muted-foreground">
                        {entry.rank === 1 ? <Trophy className="h-6 w-6 text-yellow-500" /> :
                         entry.rank === 2 ? <Medal className="h-6 w-6 text-slate-400" /> :
                         entry.rank === 3 ? <Medal className="h-6 w-6 text-amber-600" /> :
                         `#${entry.rank}`}
                      </div>
                      
                      <Avatar className="h-10 w-10 border">
                        <AvatarImage src={entry.user?.avatar_url} />
                        <AvatarFallback>{entry.user?.full_name?.[0] || 'U'}</AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">
                          {entry.user?.full_name || 'Unknown User'}
                          {entry.user?._id === profile?._id && <span className="ml-2 text-xs font-normal text-primary">(You)</span>}
                        </div>
                        {entry.top_badge && (
                          <div className="flex items-center text-xs text-muted-foreground mt-0.5">
                            <span className="mr-1">{entry.top_badge.icon}</span> {entry.top_badge.name}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col items-end gap-1">
                        <div className="font-bold text-lg">{entry.xp} <span className="text-sm font-normal text-muted-foreground">XP</span></div>
                        {entry.streak > 0 && (
                          <div className="flex items-center text-xs text-orange-500 font-medium">
                            <Flame className="h-3 w-3 mr-0.5" /> {entry.streak}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="badges">
            <Card>
              <CardHeader>
                <CardTitle>Badge Showcase</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {allBadges.map((badge) => {
                    const isEarned = myBadgeIds.has(badge._id);
                    return (
                      <div 
                        key={badge._id}
                        className={`flex flex-col items-center p-4 rounded-xl border text-center transition-all ${
                          isEarned ? 'bg-gradient-to-b from-card to-primary/5 border-primary/20 shadow-sm' : 'opacity-60 grayscale bg-muted/20'
                        }`}
                      >
                        <div className="text-4xl mb-3">{badge.icon}</div>
                        <h4 className="font-semibold text-sm mb-1">{badge.name}</h4>
                        <p className="text-xs text-muted-foreground mb-3">{badge.description}</p>
                        <UIBadge variant={isEarned ? "default" : "outline"} className="mt-auto capitalize text-[10px]">
                          {badge.tier} Tier
                        </UIBadge>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

      </div>
    </AppLayout>
  )
}
