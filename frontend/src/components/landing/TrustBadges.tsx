import { Brain, Shield, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'

export function TrustBadges() {
  const badges = [
    { icon: Brain, label: 'AI-Powered', color: 'text-blue-500' },
    { icon: Shield, label: 'SOC2 Secure', color: 'text-indigo-500' },
    { icon: TrendingUp, label: '98% Success', color: 'text-blue-500' }
  ];

  return (
    <section className="bg-slate-50/50 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div 
          className="flex flex-wrap justify-center gap-12 md:gap-24 opacity-60"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.3 }}
        >
          {badges.map((badge, idx) => (
            <motion.div 
              key={idx} 
              className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all cursor-default group"
              whileHover={{ y: -5 }}
              transition={{ duration: 0.3 }}
            >
              <badge.icon size={24} className={`${badge.color} group-hover:opacity-100`} />
              <span className="font-[Plus_Jakarta_Sans] font-bold text-lg uppercase tracking-tight">{badge.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
