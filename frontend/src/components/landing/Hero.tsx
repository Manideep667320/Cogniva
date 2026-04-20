import { Play } from 'lucide-react'
import { motion } from 'framer-motion'

interface HeroProps {
  onSignup: () => void
}

export function Hero({ onSignup }: HeroProps) {
  return (
    <section className="relative px-6 py-8 md:py-12 max-w-7xl mx-auto overflow-hidden">
      {/* Gradient Orbs */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px]"></div>
      <div className="absolute top-1/2 -left-24 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px]"></div>

      <div className="grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Content */}
        <motion.div 
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Badge */}
          <motion.div 
            className="inline-flex items-center px-3 py-1 rounded-full bg-purple-100/30 text-purple-700 text-xs font-semibold uppercase tracking-widest border border-purple-200/50"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            The Future of Learning
          </motion.div>

          {/* Headline */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-[Plus_Jakarta_Sans] font-extrabold tracking-tight leading-[1.1] text-slate-900">
            Master any skill with{' '}
            <span className="bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
              AI-powered
            </span>{' '}
            precision.
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-slate-600 max-w-xl leading-relaxed">
            Cogniva AI adapts to your unique cognitive signature, creating an optimized learning path that evolves in real-time as you progress.
          </p>

          {/* CTA Buttons */}
          <motion.div 
            className="flex flex-wrap gap-4 pt-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <motion.button 
              className="bg-gradient-to-r from-purple-600 to-blue-500 text-white px-8 py-3 rounded-lg font-bold text-lg shadow-xl shadow-purple-600/25"
              whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(147, 51, 234, 0.4)' }}
              whileTap={{ scale: 0.95 }}
              onClick={onSignup}
              transition={{ duration: 0.3 }}
            >
              Start Learning Free
            </motion.button>
            <motion.button 
              className="bg-stone-100 text-slate-900 px-8 py-3 rounded-lg flex font-bold text-lg transition-colors items-center gap-2"
              whileHover={{ scale: 1.02, backgroundColor: '#e5e5e5' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {}}
              transition={{ duration: 0.3 }}
            >
              <Play className="w-5 h-5 text-blue-500" />
              Watch Demo
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Right Preview */}
        <motion.div 
          className="relative group"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="absolute -inset-4 bg-gradient-to-r from-purple-600 to-blue-500 opacity-20 blur-2xl group-hover:opacity-30 transition-opacity"></div>
          <div className="relative rounded-xl overflow-hidden border border-white/40 shadow-2xl" style={{
            background: 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            boxShadow: 'inset 0px 1px 0px 0px rgba(255, 255, 255, 0.5)'
          }}>
            <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD_hgCFm5UFMy4at24Gv6ir7vTycaLqdgm5hDctMeodAJYvxbX_KTHdtTZ1FLHk3BbxIHh2oOQ7Q7Sf07J0640_6LnDulgjGLi3oYniajzFr-HSZj1mfvKtdX7rXz5aziUoQqCUEjnVUiNtO3HgezsaoQg5NsWCijwUa3XbQ_KniwafQ3KAAmjx2JQj7C3X8t4WWViLeSjfS7VPosFyvIWpDvoAui5-MOsAnxwfgZdFn8xLthSLvRMvzOTh_7AtQmo4iuDNKLvptw" alt="AI Code Editor Preview" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>
            <div className="absolute bottom-6 left-6 right-6 p-4" style={{
              background: 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              borderRadius: '0.5rem',
              border: '1px solid rgba(255,255,255,0.5)'
            }}>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                <span className="text-xs font-mono text-slate-600 uppercase tracking-tighter">AI Assistant: Optimizing Knowledge Graph...</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
