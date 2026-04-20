interface NavbarProps {
  onLogin: () => void
  onSignup: () => void
}

export function Navbar({ onLogin, onSignup }: NavbarProps) {
  return (
    <nav className="fixed top-0 w-full z-50 backdrop-blur-3xl border-b border-white/20 shadow-[0_8px_32px_0_rgba(139,92,246,0.05)]" style={{
      backgroundColor: 'rgba(255, 255, 255, 0.7)'
    }}>
      <div className="flex justify-between items-center w-full px-6 py-4 max-w-7xl mx-auto">
        {/* Logo */}
        <div className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent font-[Plus_Jakarta_Sans]">
          Cogniva AI
        </div>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center space-x-8">
          <a className="text-purple-600 font-semibold text-sm tracking-tight hover:text-purple-700 transition-colors" href="#platform">
            Platform
          </a>
          <a className="text-slate-600 hover:text-slate-800 transition-colors text-sm tracking-tight" href="#solutions">
            Solutions
          </a>
          <a className="text-slate-600 hover:text-slate-800 transition-colors text-sm tracking-tight" href="#curriculum">
            Curriculum
          </a>
          <a className="text-slate-600 hover:text-slate-800 transition-colors text-sm tracking-tight" href="#pricing">
            Pricing
          </a>
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
