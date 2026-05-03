import { useState } from 'react'
import { 
  User, 
  Mail, 
  Shield, 
  Bell, 
  Camera, 
  Save, 
  Loader2, 
  CheckCircle2,
  ExternalLink,
  GraduationCap
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { AppLayout } from '@/components/layout/AppLayout'
import { useAuth } from '@/contexts/AuthContext'
import { updateAccount } from '@/lib/api'

export function SettingsPage() {
  const { profile, user, refreshProfile } = useAuth()
  
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [bio, setBio] = useState(profile?.bio || '')
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setSuccess(false)
    
    try {
      await updateAccount({
        full_name: fullName,
        bio: bio,
        avatar_url: avatarUrl
      })
      await refreshProfile()
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error('Failed to update profile:', err)
      alert('Failed to update profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  return (
    <AppLayout 
      title="Settings" 
      description="Manage your professional profile and account preferences."
    >
      <div className="max-w-4xl space-y-8 pb-10">
        {/* Profile Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="size-5 text-primary" />
              Public Profile
            </h3>
            <p className="text-sm text-muted-foreground">
              This information will be displayed to students on your course pages.
            </p>
          </div>

          <Card className="md:col-span-2 shadow-sm border-border/60">
            <form onSubmit={handleSaveProfile}>
              <CardContent className="pt-6 space-y-6">
                {/* Avatar Row */}
                <div className="flex items-center gap-6">
                  <div className="relative group">
                    <Avatar className="size-20 border-2 border-background ring-2 ring-primary/10 transition-all group-hover:ring-primary/30">
                      <AvatarImage src={avatarUrl} />
                      <AvatarFallback className="brand-gradient text-white text-xl font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <button 
                      type="button"
                      className="absolute bottom-0 right-0 size-7 rounded-full bg-primary text-white flex items-center justify-center border-2 border-background shadow-sm hover:scale-110 transition-transform"
                    >
                      <Camera className="size-3.5" />
                    </button>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold">Profile Photo</h4>
                    <p className="text-xs text-muted-foreground">JPG, PNG or SVG. Max 1MB.</p>
                    <Input 
                      placeholder="Avatar URL (e.g., https://...)" 
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      className="h-8 text-xs mt-2"
                    />
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input 
                      id="full_name" 
                      value={fullName} 
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g., Dr. Jane Smith"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="bio">Professional Bio</Label>
                    <Textarea 
                      id="bio" 
                      value={bio} 
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Briefly describe your expertise and teaching experience..."
                      rows={4}
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Max 500 characters. Markdown supported.
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t bg-muted/20 px-6 py-4 flex items-center justify-between">
                {success ? (
                  <span className="text-xs text-emerald-600 font-medium flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2">
                    <CheckCircle2 className="size-3.5" /> Changes saved successfully!
                  </span>
                ) : <span />}
                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="brand-gradient text-white border-0 px-6"
                >
                  {loading ? (
                    <><Loader2 className="size-4 animate-spin mr-2" /> Saving...</>
                  ) : (
                    <><Save className="size-4 mr-2" /> Save Changes</>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>

        {/* Account Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Shield className="size-5 text-primary" />
              Account Security
            </h3>
            <p className="text-sm text-muted-foreground">
              Manage your login credentials and account status.
            </p>
          </div>

          <Card className="md:col-span-2 shadow-sm border-border/60">
            <CardContent className="pt-6 space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/10">
                <div className="space-y-1">
                  <p className="text-sm font-semibold flex items-center gap-2">
                    <Mail className="size-4 text-muted-foreground" />
                    Email Address
                  </p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-0">Verified</Badge>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/10">
                <div className="space-y-1">
                  <p className="text-sm font-semibold flex items-center gap-2">
                    <GraduationCap className="size-4 text-muted-foreground" />
                    Account Role
                  </p>
                  <p className="text-sm text-muted-foreground capitalize">{profile?.role}</p>
                </div>
                <Button variant="ghost" size="sm" className="text-xs gap-1.5 h-8">
                  Request Change <ExternalLink className="size-3" />
                </Button>
              </div>

              <div className="pt-2">
                <Button variant="outline" className="w-full justify-between group">
                  Change Password
                  <Shield className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notifications */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Bell className="size-5 text-primary" />
              Notifications
            </h3>
            <p className="text-sm text-muted-foreground">
              Control when and how you want to be notified.
            </p>
          </div>

          <Card className="md:col-span-2 shadow-sm border-border/60">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-xs text-muted-foreground">Receive weekly summaries of student performance.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Security Alerts</Label>
                  <p className="text-xs text-muted-foreground">Get notified about new login sessions.</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
