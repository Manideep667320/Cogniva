import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BrainCircuit, Loader as Loader2, GraduationCap, UserRound, BookOpen, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'

const features = [
  { icon: Sparkles, label: 'AI-Powered Tutoring' },
  { icon: BookOpen, label: 'Curated Course Library' },
  { icon: GraduationCap, label: 'Faculty Tools' },
]

export function LoginPage() {
  const navigate = useNavigate()
  const { signIn, signUp } = useAuth()

  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)

  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [signupName, setSignupName] = useState('')
  const [signupRole, setSignupRole] = useState<'student' | 'faculty'>('student')
  const [signupLoading, setSignupLoading] = useState(false)
  const [signupError, setSignupError] = useState<string | null>(null)
  const [signupSuccess, setSignupSuccess] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoginLoading(true)
    setLoginError(null)
    const { error } = await signIn(loginEmail, loginPassword)
    if (error) {
      setLoginError(error)
      setLoginLoading(false)
    } else {
      navigate('/dashboard')
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (signupPassword.length < 6) {
      setSignupError('Password must be at least 6 characters.')
      return
    }
    setSignupLoading(true)
    setSignupError(null)
    const { error } = await signUp(signupEmail, signupPassword, signupName, signupRole)
    setSignupLoading(false)
    if (error) {
      setSignupError(error)
    } else {
      setSignupSuccess(true)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Brand */}
      <div className="hidden lg:flex lg:w-1/2 brand-gradient flex-col items-center justify-center p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 size-64 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-10 right-10 size-80 rounded-full bg-white/10 blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col items-center text-center gap-8 max-w-sm">
          <div className="flex size-20 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 shadow-lg">
            <BrainCircuit className="size-10 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-2">Cogniva</h1>
            <p className="text-white/80 text-lg leading-relaxed">
              Your agentic AI learning companion. Learn faster, retain more, achieve more.
            </p>
          </div>
          <div className="flex flex-col gap-3 w-full">
            {features.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3 border border-white/20">
                <div className="flex size-8 items-center justify-center rounded-md bg-white/20">
                  <Icon className="size-4 text-white" />
                </div>
                <span className="text-sm font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Forms */}
      <div className="flex flex-1 items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="flex size-9 items-center justify-center rounded-lg brand-gradient">
              <BrainCircuit className="size-5 text-white" />
            </div>
            <span className="text-xl font-bold brand-gradient-text">Cogniva</span>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
            <p className="text-muted-foreground mt-1">Sign in to your account or create a new one</p>
          </div>

          <Tabs defaultValue="login">
            <TabsList className="w-full mb-6">
              <TabsTrigger value="login" className="flex-1">Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="flex-1">Create Account</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card className="border-border/60 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">Sign in to Cogniva</CardTitle>
                  <CardDescription>Enter your credentials to continue</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="flex flex-col gap-4">
                    {loginError && (
                      <Alert variant="destructive">
                        <AlertDescription>{loginError}</AlertDescription>
                      </Alert>
                    )}
                    <div className="grid gap-1.5">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="you@example.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                        autoComplete="email"
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                      />
                    </div>
                    <Button type="submit" className="w-full brand-gradient text-white border-0 mt-2" disabled={loginLoading}>
                      {loginLoading ? <><Loader2 className="size-4 animate-spin mr-2" />Signing in...</> : 'Sign In'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="signup">
              <Card className="border-border/60 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">Create your account</CardTitle>
                  <CardDescription>Join Cogniva and start learning today</CardDescription>
                </CardHeader>
                <CardContent>
                  {signupSuccess ? (
                    <div className="text-center py-6 flex flex-col items-center gap-3">
                      <div className="size-12 rounded-full brand-gradient flex items-center justify-center">
                        <Sparkles className="size-6 text-white" />
                      </div>
                      <p className="font-semibold">Account created!</p>
                      <p className="text-sm text-muted-foreground">Check your email to confirm your account, then sign in.</p>
                    </div>
                  ) : (
                    <form onSubmit={handleSignup} className="flex flex-col gap-4">
                      {signupError && (
                        <Alert variant="destructive">
                          <AlertDescription>{signupError}</AlertDescription>
                        </Alert>
                      )}
                      <div className="grid gap-1.5">
                        <Label htmlFor="signup-name">Full Name</Label>
                        <Input
                          id="signup-name"
                          type="text"
                          placeholder="Jane Smith"
                          value={signupName}
                          onChange={(e) => setSignupName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="grid gap-1.5">
                        <Label htmlFor="signup-email">Email</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="you@example.com"
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          required
                          autoComplete="email"
                        />
                      </div>
                      <div className="grid gap-1.5">
                        <Label htmlFor="signup-password">Password</Label>
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="Min. 6 characters"
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          required
                          autoComplete="new-password"
                        />
                      </div>
                      <div className="grid gap-1.5">
                        <Label>I am a...</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setSignupRole('student')}
                            className={`flex items-center gap-2 rounded-md border px-3 py-2.5 text-sm font-medium transition-colors ${
                              signupRole === 'student'
                                ? 'border-primary bg-primary/5 text-primary'
                                : 'border-border text-muted-foreground hover:border-primary/50'
                            }`}
                          >
                            <UserRound className="size-4" /> Student
                          </button>
                          <button
                            type="button"
                            onClick={() => setSignupRole('faculty')}
                            className={`flex items-center gap-2 rounded-md border px-3 py-2.5 text-sm font-medium transition-colors ${
                              signupRole === 'faculty'
                                ? 'border-primary bg-primary/5 text-primary'
                                : 'border-border text-muted-foreground hover:border-primary/50'
                            }`}
                          >
                            <GraduationCap className="size-4" /> Faculty
                          </button>
                        </div>
                      </div>
                      <Button type="submit" className="w-full brand-gradient text-white border-0 mt-2" disabled={signupLoading}>
                        {signupLoading ? <><Loader2 className="size-4 animate-spin mr-2" />Creating account...</> : 'Create Account'}
                      </Button>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs font-normal">
                          {signupRole === 'faculty' ? 'Faculty access includes course creation tools' : 'Students get full AI Tutor access'}
                        </Badge>
                      </div>
                    </form>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
