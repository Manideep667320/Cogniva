import { motion } from 'framer-motion'

export function HowItWorks() {
  const steps = [
    { number: 1, title: 'Diagnose', description: 'Cogniva identifies your knowledge gaps and learning style through a 5-minute interactive assessment.', color: 'blue-500', align: 'right' },
    { number: 2, title: 'Practice', description: 'Engage in high-intensity micro-learning sessions tailored to your current cognitive load and focus level.', color: 'indigo-500', align: 'left' },
    { number: 3, title: 'Master', description: 'Validate your skills through real-world simulation and earn verified credentials stored on-chain.', color: 'blue-500', align: 'right' }
  ];

  return (
    <section id="curriculum" className="py-24 px-6 max-w-4xl mx-auto overflow-hidden">
      <motion.h2 
        className="text-4xl font-[Plus_Jakarta_Sans] font-bold text-center mb-20"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        viewport={{ once: true, margin: "-100px" }}
      >
        The Evolution Cycle
      </motion.h2>
      
      <div className="relative">
        {/* Vertical Line */}
        <motion.div 
          className="absolute left-[20px] md:left-1/2 top-0 bottom-0 w-[2px] bg-gradient-to-b from-blue-500 via-indigo-500 to-transparent origin-top"
          initial={{ scaleY: 0 }}
          whileInView={{ scaleY: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          viewport={{ once: true, margin: "-100px" }}
        ></motion.div>
        
        {steps.map((step, idx) => (
          <motion.div 
            key={idx} 
            className={`relative flex items-center mb-20 group ${step.align === 'left' ? 'md:justify-end' : 'md:justify-start'}`}
            initial={{ opacity: 0, x: step.align === 'left' ? -30 : 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.2 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <div className={`absolute left-0 md:left-1/2 -translate-x-[18px] md:-translate-x-1/2 w-10 h-10 rounded-full bg-white border-4 border-${step.color} z-10 flex items-center justify-center font-bold text-${step.color} group-hover:scale-110 transition-transform`}>
              {step.number}
            </div>
            <motion.div 
              className={`ml-16 md:ml-0 md:w-1/2 ${step.align === 'right' ? 'md:pr-16 md:text-right' : 'md:pl-16 md:text-left'}`}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className={`text-2xl font-[Plus_Jakarta_Sans] font-bold text-${step.color}`}>{step.title}</h3>
              <p className="text-slate-500 mt-2">{step.description}</p>
            </motion.div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
