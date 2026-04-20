import { CheckCircle, Brain, Zap, Activity, Clock, XCircle } from 'lucide-react'
import { motion } from 'framer-motion'

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
    <section className="py-24 px-6 max-w-7xl mx-auto overflow-hidden">
      <motion.div 
        className="text-center mb-16"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        viewport={{ once: true, margin: "-100px" }}
      >
        <h2 className="text-3xl md:text-5xl border-b-2 border-transparent font-[Plus_Jakarta_Sans] font-bold mb-4">Reinventing the Learning Loop</h2>
        <p className="text-slate-500 max-w-2xl mx-auto">
          Traditional methods are rigid. Cogniva AI is fluid, adapting to your pace and cognitive load.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-8 relative z-10">
        {/* Traditional Learning */}
        <motion.div 
          className="bg-slate-50/50 p-8 rounded-xl border-l-4 border-red-500/30"
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          viewport={{ once: true, margin: "-100px" }}
          whileHover={{ y: -5 }}
        >
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-2xl font-[Plus_Jakarta_Sans] font-bold opacity-60">Traditional Learning</h3>
            <XCircle size={32} className="text-red-500" />
          </div>
          <ul className="space-y-4 text-slate-500">
            {traditionalIssues.map((issue, idx) => (
              <li key={idx} className="flex items-start gap-3">
                {issue.icon}
                <span>{issue.text}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Cogniva Solution */}
        <motion.div 
          className="bg-white p-8 rounded-xl border-l-4 border-blue-500 shadow-xl shadow-blue-500/5 relative z-20"
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          viewport={{ once: true, margin: "-100px" }}
          whileHover={{ y: -5 }}
        >
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-2xl font-[Plus_Jakarta_Sans] font-bold">Cogniva AI</h3>
            <CheckCircle size={32} className="text-indigo-500" fill="currentColor" />
          </div>
          <ul className="space-y-4">
            {cognivaBenefits.map((benefit, idx) => (
              <li key={idx} className="flex items-start gap-3">
                {benefit.icon}
                <span className="font-medium text-slate-800">{benefit.text}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  )
}
