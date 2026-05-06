import { BarChart3, Zap, MessageSquare, Trophy } from 'lucide-react'
import { motion } from 'framer-motion'

export function Features() {
  const features = [
    { 
      icon: BarChart3, 
      title: 'Predictive Analytics', 
      description: 'Anticipate your learning plateaus before they happen with neural forecasting.', 
      bgClass: 'bg-blue-600',
      shadowClass: 'shadow-blue-600/20'
    },
    { 
      icon: Zap, 
      title: 'Deep Work Mode', 
      description: 'Environment optimization that blocks distractions and induces flow states.', 
      bgClass: 'bg-indigo-600',
      shadowClass: 'shadow-indigo-600/20'
    },
    { 
      icon: MessageSquare, 
      title: 'Real-time Feedback', 
      description: 'Instant, granular corrections while you practice to prevent bad habits.', 
      bgClass: 'bg-blue-600',
      shadowClass: 'shadow-blue-600/20'
    },
    { 
      icon: Trophy, 
      title: 'Skill Mastery Tracking', 
      description: 'Visual 3D map of your expertise across complex technical domains.', 
      bgClass: 'bg-indigo-600',
      shadowClass: 'shadow-indigo-600/20'
    }
  ];

  return (
    <section id="platform" className="bg-slate-50/30 py-24 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          className="mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          viewport={{ once: true, margin: "-100px" }}
        >
          <h2 className="text-4xl font-[Plus_Jakarta_Sans] font-bold mb-4">Precision Engineering for your Mind</h2>
          <p className="text-slate-500">Every tool you need to unlock latent potential.</p>
        </motion.div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, idx) => (
            <motion.div 
              key={idx} 
              className="bg-white/70 backdrop-blur-2xl p-8 rounded-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5)] border border-white/40"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.1 }}
              viewport={{ once: true, margin: "-50px" }}
              whileHover={{ y: -8, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
            >
              <div className={`w-12 h-12 rounded-lg ${feature.bgClass} flex items-center justify-center mb-6 shadow-lg ${feature.shadowClass}`}>
                <feature.icon size={24} className="text-white" />
              </div>
              <h4 className="text-xl font-[Plus_Jakarta_Sans] font-bold mb-3">{feature.title}</h4>
              <p className="text-slate-500 text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
