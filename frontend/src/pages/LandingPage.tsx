import { useState, useEffect } from 'react'
import { Navbar } from '@/components/landing/Navbar'
import { Hero } from '@/components/landing/Hero'
import { TrustBadges } from '@/components/landing/TrustBadges'
import { ProblemSolution } from '@/components/landing/ProblemSolution'
import { Features } from '@/components/landing/Features'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { UIPreview } from '@/components/landing/UIPreview'
import { FinalCTA } from '@/components/landing/FinalCTA'
import { Footer } from '@/components/landing/Footer'
import { AuthModal } from '@/components/auth/AuthModal'

export function LandingPage() {
  const [authModal, setAuthModal] = useState<{ isOpen: boolean; mode: 'login' | 'signup' }>({
    isOpen: false,
    mode: 'login'
  })

  const openLogin = () => setAuthModal({ isOpen: true, mode: 'login' })
  const openSignup = () => setAuthModal({ isOpen: true, mode: 'signup' })
  const closeAuth = () => {
    setAuthModal(prev => ({ ...prev, isOpen: false }))
    // Clean up URL params after closing
    window.history.replaceState({}, document.title, window.location.pathname)
  }

  // Handle auto-open via query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const authAction = params.get('auth')
    if (authAction === 'login') openLogin()
    else if (authAction === 'signup') openSignup()
  }, [])

  return (
    <div className="min-h-screen bg-surface overflow-x-hidden" style={{
      scrollbarWidth: 'none',
      msOverflowStyle: 'none'
    }}>
      <style>{`
        ::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <Navbar onLogin={openLogin} onSignup={openSignup} />
      <main className="pt-12">
        <Hero onSignup={openSignup} />
        <TrustBadges />
        <ProblemSolution />
        <Features />
        <HowItWorks />
        <UIPreview />
        <FinalCTA onSignup={openSignup} />
      </main>
      <Footer />
      
      <AuthModal 
        isOpen={authModal.isOpen} 
        onClose={closeAuth} 
        defaultMode={authModal.mode} 
      />
    </div>
  )
}
