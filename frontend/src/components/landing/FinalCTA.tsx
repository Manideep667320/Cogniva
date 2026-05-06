import { motion } from 'framer-motion'

interface FinalCTAProps {
  onSignup: () => void
}

export function FinalCTA({ onSignup }: FinalCTAProps) {
  return (
    <section id="pricing" className="py-24 px-6 overflow-hidden">
      <motion.div 
        className="max-w-5xl mx-auto bg-slate-950 rounded-[2.5rem] p-12 md:p-24 text-center relative overflow-hidden shadow-2xl"
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        viewport={{ once: true, margin: "-100px" }}
      >
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500 via-transparent to-transparent"></div>
        </div>
        <div className="relative z-10">
          <motion.h2 
            className="text-4xl md:text-6xl font-[Plus_Jakarta_Sans] font-extrabold text-white mb-8 tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            viewport={{ once: true }}
          >
            Ready to evolve your intellect?
          </motion.h2>
          <motion.p 
            className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            viewport={{ once: true }}
          >
            Join 50,000+ professionals using Cogniva AI to accelerate their career and mastery.
          </motion.p>
          <motion.button 
            onClick={onSignup}
            className="bg-blue-500 text-white px-12 py-5 rounded-xl font-bold text-xl shadow-2xl shadow-blue-500/40"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05, boxShadow: '0 0 25px rgba(59, 130, 246, 0.6)' }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            viewport={{ once: true }}
          >
            Start Free Today
          </motion.button>
          <motion.p 
            className="mt-6 text-slate-500 text-sm"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            viewport={{ once: true }}
          >
            No credit card required. 14-day premium trial.
          </motion.p>
        </div>
      </motion.div>
    </section>
  )
}
