import { useState, useEffect } from 'react'
import { ModeToggle } from '@/components/mode-toggle'

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
    <nav className="fixed top-0 w-full z-50 bg-transparent">
      <div className="flex justify-between items-center w-full px-6 py-4">
        {/* Logo */}
        <div className="flex items-center">
          <img 
            src="/cogniva_horizontal_logo.png" 
            alt="Cogniva AI" 
            className="h-14 w-auto object-contain hover:brightness-110 transition-all cursor-pointer dark:invert dark:hue-rotate-180 dark:mix-blend-screen"
          />
        </div>

        {/* Navigation Links - Glassmorphic Pill Box */}
        <div className="hidden md:flex items-center space-x-8 px-6 py-2 rounded-full border border-slate-200/50 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
          {navLinks.map((link) => (
            <a 
              key={link.href}
              href={link.href}
              className={`text-sm tracking-tight transition-all relative font-medium ${
                activeSection === link.href 
                ? 'text-purple-600 dark:text-purple-400' 
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
            >
              {link.name}
              {activeSection === link.href && (
                <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-purple-600 dark:bg-purple-400 rounded-full" />
              )}
            </a>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-4">
          <ModeToggle />
          <button 
            className="text-slate-600 dark:text-slate-300 font-medium text-sm hover:text-slate-800 dark:hover:text-slate-100 transition-colors" 
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
