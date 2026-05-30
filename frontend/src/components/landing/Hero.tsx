import { Play } from 'lucide-react'
import { motion } from 'framer-motion'
import { FloatingBrainOrbScene } from './Scene3D'

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
          className="space-y-6 lg:pt-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Badge */}
          <motion.div
            className="inline-flex items-center px-3 py-1 rounded-full bg-purple-100/30 dark:bg-purple-950/30 text-blue-700 dark:text-blue-300 text-xs font-semibold uppercase tracking-widest border border-purple-200/50 dark:border-purple-800/40"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            The Future of Learning
          </motion.div>

          {/* Headline */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-[Plus_Jakarta_Sans] font-extrabold tracking-tight leading-[1.1] text-slate-900 dark:text-white">
            Master any skill with{' '}
            <span className="bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
              AI-powered
            </span>{' '}
            precision.
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
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
              className="bg-stone-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-8 py-3 rounded-lg flex font-bold text-lg transition-colors items-center gap-2 border border-stone-200 dark:border-slate-700"
              whileHover={{ scale: 1.02, backgroundColor: 'rgba(0,0,0,0.05)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { }}
              transition={{ duration: 0.3 }}
            >
              <Play className="w-5 h-5 text-blue-500" />
              Watch Demo
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Right Preview - 3D Brain Orb Scene */}
        <motion.div
          className="relative group h-[380px] md:h-[480px] lg:h-[520px] w-full"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="relative h-full w-full overflow-visible">
            <FloatingBrainOrbScene />
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 p-3 flex justify-center" style={{
              background: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              borderRadius: '9999px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div className="flex items-center gap-2.5 px-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[10px] font-mono text-slate-300 uppercase tracking-wider font-semibold whitespace-nowrap">AI Neural Core: Live & Responsive</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

