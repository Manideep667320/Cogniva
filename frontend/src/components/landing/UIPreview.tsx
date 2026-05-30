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
            <div className="aspect-video relative bg-slate-950 flex">
              {/* Animated Dashboard Skeleton */}
              
              {/* Sidebar */}
              <div className="w-1/5 border-r border-slate-800 p-4 flex flex-col gap-4 bg-slate-900/50">
                <div className="flex items-center gap-2 mb-6">
                  <div className="h-8 w-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <div className="w-4 h-4 bg-blue-500 rounded-full" />
                  </div>
                  <span className="text-slate-200 font-bold text-sm tracking-tight hidden md:block">Cogniva AI</span>
                </div>
                
                {[
                  { icon: 'LayoutDashboard', label: 'Dashboard' },
                  { icon: 'Trophy', label: 'Leaderboard' },
                  { icon: 'GitBranch', label: 'Skill Trees' },
                  { icon: 'Bot', label: 'AI Tutor' },
                  { icon: 'BookOpen', label: 'Courses' }
                ].map((item, i) => (
                  <motion.div 
                    key={`sidebar-${i}`}
                    className="flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-slate-800/50"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.1, duration: 0.3 }}
                  >
                    <div className="h-4 w-4 rounded bg-slate-700/50 shrink-0" />
                    <div className="h-3 rounded bg-slate-700/50 w-full max-w-[100px] overflow-hidden relative">
                      <span className="absolute inset-0 text-[9px] font-medium text-slate-400 pl-1 leading-3 truncate">{item.label}</span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Main Content */}
              <div className="flex-1 p-8 flex flex-col gap-6 overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center">
                  <div className="space-y-1 w-1/2">
                    <motion.div 
                      className="relative overflow-visible"
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, duration: 0.4 }}
                    >
                      <h2 className="text-xl font-bold text-white tracking-tight">Welcome back, Alex!</h2>
                    </motion.div>
                    <motion.div 
                      className="relative overflow-visible"
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4, duration: 0.4 }}
                    >
                      <p className="text-xs text-slate-400">You're on a 5-day streak. Keep it up!</p>
                    </motion.div>
                  </div>
                  <motion.div 
                    className="h-9 w-32 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center"
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    <span className="text-xs font-semibold text-blue-400">Resume Python</span>
                  </motion.div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { title: 'Mastery Score', val: '84%', color: 'bg-emerald-500' },
                    { title: 'Learning Health', val: 'Low Risk', color: 'bg-emerald-500' },
                    { title: 'Weekly Goal', val: '4/5 Tasks', color: 'bg-blue-500' }
                  ].map((card, i) => (
                    <motion.div 
                      key={`card-${i}`}
                      className="h-28 rounded-xl bg-slate-900 border border-slate-800 p-4 flex flex-col justify-between relative overflow-hidden"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
                    >
                      <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{card.title}</div>
                      <div className="text-2xl font-bold text-white">{card.val}</div>
                      {/* Animated progress bar inside card */}
                      <div className="h-1.5 w-full bg-slate-800 rounded-full mt-2 overflow-hidden">
                        <motion.div 
                          className={`h-full ${card.color}`}
                          initial={{ width: "0%" }}
                          whileInView={{ width: `${Math.random() * 30 + 60}%` }}
                          transition={{ delay: 1 + i * 0.2, duration: 1, ease: "easeOut" }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Skill Tree / Learning Path Area */}
                <motion.div 
                  className="flex-1 rounded-xl bg-slate-900 border border-slate-800 relative p-6 overflow-hidden flex flex-col"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                >
                  <div className="text-sm font-semibold text-white mb-2">Neural Learning Path</div>
                  <div className="text-[10px] text-slate-400 mb-6">AI is dynamically adjusting your curriculum based on recent performance.</div>
                  
                  {/* Animated Nodes */}
                  <div className="relative flex-1 w-full flex items-center justify-center">
                    {/* Connecting Line */}
                    <motion.div 
                      className="absolute left-1/4 right-1/4 h-1 bg-slate-800 top-1/2 -translate-y-1/2 rounded"
                      initial={{ width: "0%" }}
                      whileInView={{ width: "50%" }}
                      transition={{ delay: 1.2, duration: 1 }}
                    />
                    
                    {/* Node 1 */}
                    <div className="absolute left-1/4 top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10">
                      <motion.div 
                        className="w-12 h-12 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        transition={{ delay: 1, type: "spring" }}
                      >
                        <div className="w-4 h-4 bg-emerald-500 rounded-full" />
                      </motion.div>
                      <motion.span className="text-[9px] font-medium text-emerald-400" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 1.2 }}>Variables</motion.span>
                    </div>

                    {/* Node 2 (Current) */}
                    <div className="absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10">
                      <motion.div 
                        className="w-16 h-16 rounded-full bg-blue-500/20 border-2 border-blue-500 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        transition={{ delay: 1.5, type: "spring" }}
                        animate={{ boxShadow: ["0 0 20px rgba(59,130,246,0.5)", "0 0 40px rgba(59,130,246,0.8)", "0 0 20px rgba(59,130,246,0.5)"] }}
                        // @ts-ignore
                        transition={{ boxShadow: { repeat: Infinity, duration: 2 } }}
                      >
                        <div className="w-6 h-6 bg-blue-500 rounded-full" />
                      </motion.div>
                      <motion.span className="text-[10px] font-bold text-blue-400" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 1.7 }}>Loops</motion.span>
                    </div>

                    {/* Node 3 (Locked) */}
                    <div className="absolute left-3/4 top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10">
                      <motion.div 
                        className="w-12 h-12 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center"
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        transition={{ delay: 1.8, type: "spring" }}
                      >
                        <div className="w-4 h-4 bg-slate-600 rounded-full" />
                      </motion.div>
                      <motion.span className="text-[9px] font-medium text-slate-500" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 2 }}>Functions</motion.span>
                    </div>
                  </div>
                </motion.div>

              </div>
              
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/5 to-blue-500/5 pointer-events-none"></div>
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
