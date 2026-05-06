import { useState, useEffect } from 'react'

interface NavbarProps {
  onLogin: () => void
  onSignup: () => void
}

const navLinks = [
  { name: 'Platform', href: '#platform' },
  { name: 'Solutions', href: '#solutions' },
  { name: 'Curriculum', href: '#curriculum' },
  { name: 'Pricing', href: '#pricing' },
]

export function Navbar({ onLogin, onSignup }: NavbarProps) {
  const [activeSection, setActiveSection] = useState('')

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-100px 0px -40% 0px',
      threshold: 0,
    }

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(`#${entry.target.id}`)
        }
      })
    }

    const observer = new IntersectionObserver(observerCallback, observerOptions)

    navLinks.forEach((link) => {
      const element = document.querySelector(link.href)
      if (element) observer.observe(element)
    })

    return () => observer.disconnect()
  }, [])

  return (
    <nav className="fixed top-0 w-full z-50 backdrop-blur-3xl border-b border-white/20 shadow-[0_8px_32px_0_rgba(139,92,246,0.05)]" style={{
      backgroundColor: 'rgba(255, 255, 255, 0.7)'
    }}>
      <div className="flex justify-between items-center w-full px-6 py-4 max-w-7xl mx-auto">
        {/* Logo */}
        <div className="flex items-center">
          <img 
            src="/cogniva_horizontal_logo.png" 
            alt="Cogniva AI" 
            className="h-14 w-auto object-contain hover:brightness-110 transition-all cursor-pointer"
          />
        </div>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => (
            <a 
              key={link.href}
              href={link.href}
              className={`text-sm tracking-tight transition-all relative font-medium ${
                activeSection === link.href 
                ? 'text-purple-600' 
                : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {link.name}
              {activeSection === link.href && (
                <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-purple-600 rounded-full" />
              )}
            </a>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-4">
          <button 
            className="text-slate-600 font-medium text-sm hover:text-slate-800 transition-colors" 
            onClick={onLogin}
          >
            Sign In
          </button>
          <button 
            className="bg-blue-500 text-white px-6 py-2.5 rounded-lg text-sm font-semibold shadow-lg shadow-blue-500/20 hover:scale-[1.02] transition-transform active:scale-95" 
            onClick={onSignup}
          >
            Get Started
          </button>
        </div>
      </div>
    </nav>
  )
}
