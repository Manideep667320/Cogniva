import { CheckCircle, Brain, Zap, Activity, Clock, XCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { Card3DTilt } from './Card3DTilt'

export function ProblemSolution() {
  const traditionalIssues = [
    { icon: <div className="w-5 h-0.5 bg-red-500/60 rotate-90"></div>, text: 'Fragmented resources spread across multiple platforms' },
    { icon: <Clock size={20} className="text-red-500/60" />, text: 'Slow progress due to "one size fits all" curriculum' },
    { icon: <XCircle size={20} className="text-red-500/60" />, text: 'Lack of real-time corrective feedback' }
  ];

  const cognivaBenefits = [
    { icon: <Brain size={20} className="text-blue-500" />, text: 'Personalized AI tutoring available 24/7' },
    { icon: <Zap size={20} className="text-indigo-500" />, text: 'Accelerated mastery through real-time adjustments' },
    { icon: <Activity size={20} className="text-blue-500" />, text: 'Deep-work optimization and flow-state analytics' }
  ];

  return (
    <section id="solutions" className="py-24 px-6 max-w-7xl mx-auto overflow-hidden">
      <motion.div
        className="text-center mb-16"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        viewport={{ once: true, margin: "-100px" }}
      >
        <h2 className="text-3xl md:text-5xl border-b-2 border-transparent font-[Plus_Jakarta_Sans] font-bold mb-4 text-slate-900 dark:text-white">Reinventing the Learning Loop</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
          Traditional methods are rigid. Cogniva AI is fluid, adapting to your pace and cognitive load.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-8 relative z-10" style={{ perspective: 1000 }}>
        {/* Traditional Learning */}
        <Card3DTilt>
          <motion.div
            className="bg-slate-50/50 dark:bg-slate-900/40 p-8 rounded-xl border-l-4 border-red-500/40 dark:border-red-500/30 border border-slate-200/50 dark:border-slate-800/80 h-full animate-perspective"
            initial={{ opacity: 0, x: -30, rotateY: 10 }}
            whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-2xl font-[Plus_Jakarta_Sans] font-bold opacity-60 text-slate-900 dark:text-white">Traditional Learning</h3>
              <XCircle size={32} className="text-red-500" />
            </div>
            <ul className="space-y-4 text-slate-500 dark:text-slate-400">
              {traditionalIssues.map((issue, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  {issue.icon}
                  <span>{issue.text}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </Card3DTilt>

        {/* Cogniva Solution */}
        <Card3DTilt>
          <motion.div
            className="bg-white/80 dark:bg-slate-900/80 p-8 rounded-xl border-l-4 border-blue-500 shadow-xl shadow-blue-500/5 dark:shadow-none relative z-20 border border-slate-200/50 dark:border-slate-800 h-full animate-perspective"
            initial={{ opacity: 0, x: 30, rotateY: -10 }}
            whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-2xl font-[Plus_Jakarta_Sans] font-bold text-slate-900 dark:text-white">Cogniva AI</h3>
              <CheckCircle size={32} className="text-indigo-500" fill="currentColor" />
            </div>
            <ul className="space-y-4">
              {cognivaBenefits.map((benefit, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  {benefit.icon}
                  <span className="font-medium text-slate-500 dark:text-slate-400">{benefit.text}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </Card3DTilt>
      </div>
    </section>
  )
}

