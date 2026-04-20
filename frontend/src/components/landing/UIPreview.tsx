import { motion } from 'framer-motion'

export function UIPreview() {
  return (
    <section className="py-24 px-6 bg-surface overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          className="relative perspective-1000 group"
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          viewport={{ once: true, margin: "-100px" }}
        >
          <div className="absolute -inset-10 bg-blue-500/10 blur-[120px] rounded-full"></div>
          <div className="relative mx-auto max-w-5xl rounded-[2rem] border-[12px] border-slate-900 bg-slate-900 shadow-2xl overflow-hidden transform group-hover:scale-[1.01] transition-transform duration-700">
            <div className="aspect-video relative">
              <img 
                className="w-full h-full object-cover" 
                alt="Modern SaaS dashboard featuring elegant data visualizations, radial mastery charts, and an AI-driven learning timeline in a clean purple-themed UI" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB-mB3UIQ-h93FGpMILdgjy0jFTAqaptdZOLbY1XzR-YfR9Fs1SjA6iyEUnlUegzkehjGOg0WQRuoyCttEVMNqobSjoi9oMfW7HGEcx9gTea8Fq9pmqCal6uB18tyC21I1-2jw7iJsdvB63LzMNZfDyN_0LJWoitgSqGNtPyvy6tq5wMmednMy2Q43HzsSpIR3p_iTxUZKTkA-PqpVY7Kfm4BmgHTjRMS4Nx2MkB-BJuuUNQYYydigy_m-4VdRb5O01v3aJokYrpw"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 to-blue-500/5"></div>
            </div>
          </div>
          {/* Laptop Base */}
          <div className="relative mx-auto max-w-6xl h-4 bg-slate-800 rounded-b-xl shadow-xl"></div>
          <div className="relative mx-auto w-32 h-2 bg-slate-700 rounded-b-lg"></div>
        </motion.div>
      </div>
    </section>
  )
}
