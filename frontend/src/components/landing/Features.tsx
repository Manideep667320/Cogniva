import React, { useState, useEffect } from 'react'
import { Brain, Mic, Database, Zap, Sparkles, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card3DTilt } from './Card3DTilt'

export function Features() {
  const [activeIdx, setActiveIdx] = useState(0)

  const features = [
    { 
      icon: Brain, 
      title: '3D Skill Tree Map', 
      description: 'Interact with a visual 3D roadmap of your learning journey. Node clicks launch custom units designed around specific mastery metrics.', 
      bgClass: 'bg-violet-600',
      shadowClass: 'shadow-violet-600/25',
      color: '#8b5cf6'
    },
    { 
      icon: Mic, 
      title: 'Glowing Voice Orb', 
      description: 'Interact hands-free. Command the UI, interrupt lessons, or dictate questions directly using our floating voice assistant.', 
      bgClass: 'bg-blue-600',
      shadowClass: 'shadow-blue-600/25',
      color: '#3b82f6'
    },
    { 
      icon: Database, 
      title: 'MongoDB Atlas Vector Search', 
      description: 'Upload PDF notes or textbooks. A native Atlas vector index immediately embeds and queries your documents to feed lessons.', 
      bgClass: 'bg-indigo-600',
      shadowClass: 'shadow-indigo-600/25',
      color: '#6366f1'
    },
    { 
      icon: Zap, 
      title: 'Live-Streaming AI Tutor', 
      description: 'Experience adaptive lessons generated in real-time. Responses stream word-by-word to match the speed of your visual comprehension.', 
      bgClass: 'bg-pink-600',
      shadowClass: 'shadow-pink-600/25',
      color: '#ec4899'
    }
  ];

  // Auto-cycle features one-by-one every 6 seconds.
  // The timer clears and restarts when activeIdx changes, ensuring manual clicks get a full cycle.
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % features.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [features.length, activeIdx])


  return (
    <section id="platform" className="bg-slate-50/10 dark:bg-transparent py-24 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          className="mb-16 text-center md:text-left"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          viewport={{ once: true, margin: "-100px" }}
        >
          <h2 className="text-4xl md:text-5xl font-[Plus_Jakarta_Sans] font-bold mb-4 text-slate-900 dark:text-white">
            Interact with the Cogniva Core
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-xl">
            Select a developed module to simulate the advanced cognitive learning loops active on your dashboard.
          </p>
        </motion.div>
        
        <div className="grid lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Interactive Feature List */}
          <div className="lg:col-span-5 space-y-4">
            {features.map((feature, idx) => {
              const isActive = activeIdx === idx
              return (
                <div 
                  key={idx}
                  onClick={() => setActiveIdx(idx)}
                  className={`cursor-pointer p-6 rounded-xl border transition-all duration-300 relative overflow-hidden ${
                    isActive 
                      ? 'bg-white dark:bg-slate-900 border-purple-500/50 shadow-lg shadow-purple-500/5' 
                      : 'bg-white/40 dark:bg-slate-900/30 border-slate-200/50 dark:border-slate-800/80 hover:bg-white/60 dark:hover:bg-slate-900/40'
                  }`}
                >
                  {/* Glowing left highlight */}
                  {isActive && (
                    <motion.div 
                      layoutId="activeGlow"
                      className="absolute left-0 top-0 bottom-0 w-[4px] bg-gradient-to-b from-purple-600 to-blue-500"
                    />
                  )}
                  <div className="flex gap-4 items-start">
                    <div className={`w-10 h-10 rounded-lg ${feature.bgClass} flex items-center justify-center shrink-0 shadow-md ${feature.shadowClass}`}>
                      <feature.icon size={20} className="text-white" />
                    </div>
                    <div>
                      <h4 className={`text-lg font-[Plus_Jakarta_Sans] font-bold transition-colors ${
                        isActive ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-400'
                      }`}>
                        {feature.title}
                      </h4>
                      <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Right Column: Creative Animated 3D Simulation Panel */}
          <div className="lg:col-span-7 h-[420px] w-full" style={{ perspective: 1200 }}>
            <Card3DTilt className="h-full w-full">
              <div className="relative h-full w-full rounded-2xl border border-slate-200/50 dark:border-slate-800 p-8 flex flex-col justify-between overflow-hidden shadow-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl" style={{
                boxShadow: 'inset 0px 1px 0px 0px rgba(255, 255, 255, 0.08)'
              }}>
                {/* Header of the Simulator */}
                <div className="flex items-center justify-between border-b border-slate-200/40 dark:border-slate-800/60 pb-4">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                      <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
                      <span className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-2">
                      Interactive Feature Simulator
                    </span>
                  </div>
                  <Sparkles className="size-4 text-purple-500 animate-pulse" />
                </div>

                {/* Body Area with AnimatePresence */}
                <div className="flex-1 flex items-center justify-center relative overflow-hidden py-6">
                  <AnimatePresence mode="wait">
                    {activeIdx === 0 && (
                      <motion.div
                        key="skilltree"
                        initial={{ opacity: 0, scale: 0.9, rotateX: -10 }}
                        animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                        exit={{ opacity: 0, scale: 0.9, rotateX: 10 }}
                        transition={{ duration: 0.4 }}
                        className="w-full flex flex-col items-center gap-6"
                      >
                        <div className="relative flex justify-center items-center w-full max-w-[320px] h-[180px]">
                          {/* SVG paths representing skills connection */}
                          <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                            <motion.path 
                              d="M 160,30 L 80,100 M 160,30 L 240,100 M 80,100 L 160,160 M 240,100 L 160,160"
                              stroke="rgba(139, 92, 246, 0.4)"
                              strokeWidth="2"
                              strokeDasharray="4,4"
                              fill="none"
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: 1 }}
                              transition={{ duration: 1.5, repeat: Infinity, repeatType: 'reverse' }}
                            />
                          </svg>

                          {/* Node 1: Root */}
                          <motion.div 
                            className="absolute top-2 w-28 py-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-400 font-mono text-[10px] text-center font-semibold"
                            animate={{ y: [0, -4, 0] }}
                            transition={{ duration: 3, repeat: Infinity }}
                          >
                            Neural Networks
                          </motion.div>

                          {/* Node 2: Left Child */}
                          <motion.div 
                            className="absolute left-4 top-20 w-28 py-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-400 font-mono text-[10px] text-center font-semibold"
                            animate={{ y: [0, 4, 0] }}
                            transition={{ duration: 3, delay: 0.5, repeat: Infinity }}
                          >
                            Cost Functions
                          </motion.div>

                          {/* Node 3: Right Child */}
                          <motion.div 
                            className="absolute right-4 top-20 w-28 py-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 font-mono text-[10px] text-center font-semibold"
                            animate={{ y: [0, 2, 0] }}
                            transition={{ duration: 3, delay: 1, repeat: Infinity }}
                          >
                            Gradient Descent
                          </motion.div>

                          {/* Node 4: Leaf */}
                          <motion.div 
                            className="absolute bottom-2 w-32 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-mono text-[10px] text-center font-semibold"
                            animate={{ y: [0, -3, 0] }}
                            transition={{ duration: 3, delay: 1.5, repeat: Infinity }}
                          >
                            Backpropagation
                          </motion.div>
                        </div>
                        <span className="text-xs text-slate-400 font-mono text-center">
                          Visualizing node relations & user knowledge states
                        </span>
                      </motion.div>
                    )}

                    {activeIdx === 1 && (
                      <motion.div
                        key="voiceorb"
                        initial={{ opacity: 0, scale: 0.9, rotateY: -15 }}
                        animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                        exit={{ opacity: 0, scale: 0.9, rotateY: 15 }}
                        transition={{ duration: 0.4 }}
                        className="w-full flex flex-col items-center gap-6"
                      >
                        {/* Interactive pulsating voice orb simulator */}
                        <div className="relative w-24 h-24 rounded-full flex items-center justify-center">
                          <motion.div 
                            className="absolute inset-0 bg-red-500/20 rounded-full"
                            animate={{ scale: [1, 1.4, 1] }}
                            transition={{ duration: 1.8, repeat: Infinity }}
                          />
                          <motion.div 
                            className="absolute w-16 h-16 bg-red-500/40 rounded-full"
                            animate={{ scale: [1, 1.25, 1] }}
                            transition={{ duration: 1.8, delay: 0.3, repeat: Infinity }}
                          />
                          <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/30">
                            <Mic className="size-5 text-white" />
                          </div>
                        </div>

                        {/* Speech wave bars */}
                        <div className="flex gap-1 h-6 items-end">
                          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <motion.span 
                              key={i}
                              className="w-1.5 bg-red-500/80 rounded-full"
                              animate={{ height: [4, Math.random() * 24 + 4, 4] }}
                              transition={{ duration: 0.5 + Math.random() * 0.5, repeat: Infinity }}
                            />
                          ))}
                        </div>
                        <p className="text-xs font-mono text-center px-4 py-2 rounded-lg bg-slate-900/10 dark:bg-slate-900/50 border border-slate-200/20 dark:border-slate-800 text-slate-600 dark:text-slate-300 italic max-w-[280px]">
                          "Show me notes on backpropagation"
                        </p>
                      </motion.div>
                    )}

                    {activeIdx === 2 && (
                      <motion.div
                        key="vectorsearch"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.4 }}
                        className="w-full flex flex-col items-center gap-6"
                      >
                        {/* File upload animation */}
                        <div className="flex items-center gap-8 relative h-20 w-full justify-center max-w-[320px]">
                          {/* File Document */}
                          <motion.div 
                            className="p-3 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-lg flex flex-col items-center"
                            animate={{ x: [-40, 20, -40] }}
                            transition={{ duration: 4, repeat: Infinity }}
                          >
                            <span className="text-[9px] font-mono font-bold">Notes.pdf</span>
                          </motion.div>
                          
                          <ArrowRight className="size-6 text-slate-400" />
                          
                          {/* MongoDB database target node */}
                          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg flex flex-col items-center">
                            <span className="text-[9px] font-mono font-bold">Atlas Search</span>
                          </div>
                        </div>

                        {/* Floating Vector chunks represent dynamic storage */}
                        <div className="grid grid-cols-4 gap-2 w-full max-w-[280px]">
                          {[1, 2, 3, 4].map((i) => (
                            <motion.div 
                              key={i} 
                              className="py-1 rounded bg-indigo-500/20 border border-indigo-500/40 text-[8px] font-mono text-center text-indigo-300"
                              animate={{ opacity: [0.3, 1, 0.3] }}
                              transition={{ duration: 1.5, delay: i * 0.3, repeat: Infinity }}
                            >
                              [v{i}, 0.28...]
                            </motion.div>
                          ))}
                        </div>
                        <span className="text-xs text-slate-400 font-mono text-center">
                          Splitting text & building vector embedding indexes
                        </span>
                      </motion.div>
                    )}

                    {activeIdx === 3 && (
                      <motion.div
                        key="aitutor"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                        className="w-full flex flex-col items-start gap-4 max-w-[340px]"
                      >
                        <div className="flex gap-2 items-start w-full">
                          <div className="w-6 h-6 rounded-full bg-pink-500 flex items-center justify-center shrink-0">
                            <Zap className="size-3 text-white" />
                          </div>
                          <div className="bg-pink-500/10 border border-pink-500/30 rounded-xl rounded-tl-sm p-4 w-full h-32 overflow-hidden relative">
                            <motion.p 
                              className="text-[11px] font-mono text-slate-700 dark:text-slate-300 leading-relaxed"
                              initial={{ width: 0 }}
                              animate={{ width: "100%" }}
                              transition={{ duration: 3, repeat: Infinity, repeatType: 'loop' }}
                            >
                              Backpropagation propagates errors backwards, allowing gradient descent to adjust weights step-by-step.
                            </motion.p>
                            {/* Cursor blip */}
                            <motion.span 
                              className="absolute inline-block w-1.5 h-3 bg-pink-500 ml-1"
                              animate={{ opacity: [1, 0, 1] }}
                              transition={{ duration: 0.8, repeat: Infinity }}
                            />
                          </div>
                        </div>
                        <span className="text-xs text-slate-400 font-mono self-center">
                          Streaming answers word-by-word via Gemini AI
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Footer of the Simulator */}
                <div className="border-t border-slate-200/40 dark:border-slate-800/60 pt-4 flex items-center justify-between text-[10px] font-mono text-slate-400 dark:text-slate-500">
                  <span>COGNIVA SYSTEM KERNEL v4.1</span>
                  <span>STATUS: SECURE & STABLE</span>
                </div>
              </div>
            </Card3DTilt>
          </div>
        </div>
      </div>
    </section>
  )
}


