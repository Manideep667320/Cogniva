import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BrainCircuit,
  Loader as Loader2,
  GraduationCap,
  UserRound,
  Sparkles,
  X,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
} from 'lucide-react'
import { motion } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/contexts/AuthContext'
import authStudentImage from '@/assets/auth-student.png'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  defaultMode?: 'login' | 'signup'
}

export function AuthModal({ isOpen, onClose, defaultMode = 'login' }: AuthModalProps) {
  const navigate = useNavigate()
  const { signIn, signUp } = useAuth()
  // UI state
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>(defaultMode)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultMode)
      setShowPassword(false) // Reset on opens
    }
  }, [defaultMode, isOpen])

  // Login state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)

  // Signup state
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
      // Logic for remember me would go here (e.g. saving to localStorage)
      onClose()
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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[1050px] p-0 overflow-hidden border-none bg-transparent shadow-2xl">
        {/* Visually Hidden Accessibility Titles */}
        <div className="sr-only">
          <DialogTitle>{activeTab === 'login' ? 'Login to Cogniva AI' : 'Join Cogniva AI'}</DialogTitle>
          <DialogDescription>
            Access your personalized AI learning assistant.
          </DialogDescription>
        </div>

        {/* Main Landscape Container - Finalized Fixed Dimensions for Total Stability */}
        <div className="flex h-[700px] w-full bg-white rounded-[2rem] overflow-hidden shadow-2xl items-stretch">

          {/* Left Panel - Branding (50% Split) */}
          <div className="hidden lg:flex lg:w-1/2 bg-slate-50 relative flex-col p-12 items-center justify-center gap-10">
            {/* Logo */}
            <div className="flex items-center">
              <img
                src="/cogniva_horizontal_logo.png"
                alt="Cogniva AI"
                className="h-14 w-auto object-contain"
              />
            </div>

            {/* Scaled Blob Image - Consistent with 700px Height */}
            <div className="relative w-[380px] h-[380px] flex items-center justify-center">
              <motion.div
                className="absolute inset-0 bg-blue-100/50 rounded-full"
                animate={{
                  borderRadius: ["40% 60% 70% 30% / 40% 50% 60% 50%", "30% 60% 70% 40% / 50% 60% 30% 60%"],
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              />
              <div className="relative z-10 w-[85%] h-[85%] rounded-full overflow-hidden border-8 border-white shadow-2xl">
                <img
                  src={authStudentImage}
                  className="w-full h-full object-cover"
                  alt="Student"
                />
              </div>
            </div>

            {/* Quote */}
            <div className="text-center max-w-[300px]">
              <p className="text-slate-500 text-sm font-semibold italic leading-relaxed">
                "Education is the most powerful weapon you can use to change the world."
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <div className="h-px w-4 bg-slate-300" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Join 10k+ Learners</span>
                <div className="h-px w-4 bg-slate-300" />
              </div>
            </div>
          </div>

          {/* Right Panel - Auth Forms */}
          <div className="flex-1 flex flex-col p-10 lg:p-12 bg-[#0a1128] text-white relative justify-center">
            <DialogClose className="absolute right-8 top-8 p-2 rounded-full hover:bg-white/10 transition-colors">
              <X className="size-5 text-white/50" />
            </DialogClose>

            <div className="max-w-[700px] mx-auto w-full space-y-10">
              <div className="text-center mb-4">
                <h1 className="text-3xl font-black tracking-tight mb-2">
                  {activeTab === 'login' ? 'Welcome Back' : 'Get Started'}
                </h1>
                <p className="text-white/40 text-sm font-medium">Access your personalized AI learning assistant.</p>
              </div>

              <div className="flex flex-col gap-5 pt-2">
                <Button
                  variant="outline"
                  className="h-12 px-6 bg-white text-slate-900 border-none hover:bg-white/90 w-full flex items-center justify-center gap-3 rounded-xl font-bold text-base shadow-lg"
                >
                  <img src="https://www.vectorlogo.zone/logos/google/google-icon.svg" className="size-5" alt="Google" />
                  Sign in with Google
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/10" /></div>
                  <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest">
                    <span className="bg-[#0a1128] px-4 text-white/30">Or continue with email</span>
                  </div>
                </div>

                <div className="flex gap-10 justify-center">
                  <button
                    onClick={() => setActiveTab('login')}
                    className={`text-sm font-black tracking-widest transition-all relative pb-3 ${activeTab === 'login' ? 'text-white' : 'text-white/30'}`}
                  >
                    SIGN IN
                    {activeTab === 'login' && <motion.div layoutId="t-underline" className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded-full" />}
                  </button>
                  <button
                    onClick={() => setActiveTab('signup')}
                    className={`text-sm font-black tracking-widest transition-all relative pb-3 ${activeTab === 'signup' ? 'text-white' : 'text-white/30'}`}
                  >
                    JOIN NOW
                    {activeTab === 'signup' && <motion.div layoutId="t-underline" className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded-full" />}
                  </button>
                </div>
              </div>

              {/* Final Fixed Height Form Container to Eliminate All Jitters */}
              <div className="h-[380px] flex flex-col justify-center">
                {activeTab === 'login' ? (
                  <form onSubmit={handleLogin} className="space-y-6 pt-4">
                    {loginError && (
                      <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-400 rounded-xl">
                        <AlertDescription className="text-xs font-bold">{loginError}</AlertDescription>
                      </Alert>
                    )}

                    <div className="grid grid-cols-1 gap-y-4">
                      <div className="relative">
                        <Label className="text-[10px] uppercase tracking-widest text-white/30 mb-2.5 block ml-1 font-black">Email / ID</Label>
                        <Mail className="absolute left-4 top-[42px] size-4 text-white/20" />
                        <Input
                          type="email"
                          placeholder="Email"
                          className="pl-12 h-12 rounded-xl bg-white/5 border-white/5 text-white placeholder:text-white/10 focus:border-blue-500/50 transition-all border-2"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="relative">
                        <div className="flex justify-between items-center mb-2.5 px-1">
                          <Label className="text-[10px] uppercase tracking-widest text-white/30 block font-black">Password</Label>
                          <button type="button" className="text-[10px] font-black text-blue-500 hover:text-blue-400 tracking-tight">FORGOT?</button>
                        </div>
                        <Lock className="absolute left-4 top-[42px] size-4 text-white/20" />
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Password"
                          className="pl-12 h-12 rounded-xl bg-white/5 border-white/5 text-white placeholder:text-white/10 focus:border-blue-500/50 transition-all border-2"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-[42px] text-white/20 hover:text-white/40"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          className="size-5 rounded border-white/10 bg-white/5 accent-blue-500 cursor-pointer"
                          id="m-rem"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                        />
                        <label htmlFor="m-rem" className="text-xs text-white/40 font-black uppercase tracking-wider cursor-pointer">Remember Me</label>
                      </div>
                      <Button type="submit" className="px-12 h-12 bg-[#f59e0b] hover:bg-[#d97706] text-[#0a1128] border-0 rounded-xl font-black uppercase text-sm tracking-widest shadow-xl shadow-amber-500/10" disabled={loginLoading}>
                        {loginLoading ? <Loader2 className="size-5 animate-spin" /> : 'Login Now'}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleSignup} className="space-y-6">
                    {signupError && (
                      <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-400 rounded-xl">
                        <AlertDescription className="text-xs font-bold">{signupError}</AlertDescription>
                      </Alert>
                    )}

                    <div className="grid grid-cols-1 gap-y-5">
                      {/* Name & Email Row */}
                      <div className="grid grid-cols-2 gap-6">
                        <div className="relative">
                          <Label className="text-[10px] uppercase tracking-widest text-white/30 mb-2.5 block ml-1 font-black">Full Name</Label>
                          <User className="absolute left-4 top-[42px] size-4 text-white/20" />
                          <Input
                            placeholder="Name"
                            className="pl-12 h-12 rounded-xl bg-white/5 border-white/5 text-sm"
                            value={signupName}
                            onChange={(e) => setSignupName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="relative">
                          <Label className="text-[10px] uppercase tracking-widest text-white/30 mb-2.5 block ml-1 font-black">Email</Label>
                          <Mail className="absolute left-4 top-[42px] size-4 text-white/20" />
                          <Input
                            type="email"
                            placeholder="Email"
                            className="pl-12 h-12 rounded-xl bg-white/5 border-white/5 text-sm"
                            value={signupEmail}
                            onChange={(e) => setSignupEmail(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      {/* Password Full Width */}
                      <div className="relative">
                        <Label className="text-[10px] uppercase tracking-widest text-white/30 mb-2.5 block ml-1 font-black">Password</Label>
                        <Lock className="absolute left-4 top-[42px] size-4 text-white/20" />
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Create Password"
                          className="pl-12 h-12 rounded-xl bg-white/5 border-white/5 text-sm"
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-[42px] text-white/20 hover:text-white/40"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>

                      {/* Role Selection Below Password */}
                      <div className="space-y-3">
                        <Label className="text-[10px] uppercase tracking-widest text-white/30 block ml-1 font-black">Select Your Role</Label>
                        <div className="grid grid-cols-2 gap-4 h-12">
                          <button
                            type="button"
                            onClick={() => setSignupRole('student')}
                            className={`rounded-xl border-2 h-full text-xs font-black uppercase tracking-widest transition-all ${signupRole === 'student' ? 'bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-500/20' : 'border-white/5 text-white/20 hover:border-white/10'}`}
                          >
                            I'm a Student
                          </button>
                          <button
                            type="button"
                            onClick={() => setSignupRole('faculty')}
                            className={`rounded-xl border-2 h-full text-xs font-black uppercase tracking-widest transition-all ${signupRole === 'faculty' ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'border-white/5 text-white/20 hover:border-white/10'}`}
                          >
                            I'm Faculty
                          </button>
                        </div>
                      </div>
                    </div>

                    <Button type="submit" className="w-full h-14 bg-blue-500 hover:bg-blue-600 text-white border-0 mt-4 rounded-xl font-black uppercase tracking-widest shadow-xl shadow-blue-500/10" disabled={signupLoading}>
                      {signupLoading ? <Loader2 className="size-5 animate-spin" /> : 'Join the Community'}
                    </Button>
                  </form>
                )}
              </div>            </div>

          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
