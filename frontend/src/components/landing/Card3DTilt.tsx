import React, { useRef, useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform, useMotionTemplate } from 'framer-motion'

interface Card3DTiltProps {
  children: React.ReactNode
  className?: string
}

export function Card3DTilt({ children, className = '' }: Card3DTiltProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState(false)
  
  // Normalized mouse coordinates: range [-0.5, 0.5]
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  
  // Smooth spring settings for butter-like motion response
  const springConfig = { damping: 25, stiffness: 180, mass: 0.6 }
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [10, -10]), springConfig)
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-10, 10]), springConfig)
  
  // Highlight reflection tracking (in pixels)
  const flareX = useSpring(useMotionValue(0), springConfig)
  const flareY = useSpring(useMotionValue(0), springConfig)
  
  // Generates radial light flare style dynamically
  const flareBackground = useMotionTemplate`radial-gradient(circle at ${flareX}px ${flareY}px, rgba(255, 255, 255, 0.14) 0%, rgba(255, 255, 255, 0) 65%)`

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    
    const normalizedX = (e.clientX - rect.left) / rect.width - 0.5
    const normalizedY = (e.clientY - rect.top) / rect.height - 0.5
    
    x.set(normalizedX)
    y.set(normalizedY)
    
    flareX.set(e.clientX - rect.left)
    flareY.set(e.clientY - rect.top)
  }

  const handleMouseEnter = () => {
    setHovered(true)
  }

  const handleMouseLeave = () => {
    setHovered(false)
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      className={`relative will-change-transform cursor-pointer ${className}`}
    >
      {/* Light Flare Overlay */}
      {hovered && (
        <motion.div
          className="absolute inset-0 pointer-events-none rounded-xl z-20 opacity-100 transition-opacity duration-300"
          style={{ background: flareBackground }}
        />
      )}
      
      {/* Inner container to ensure nested items sit correctly in 3D perspective */}
      <div 
        style={{ transform: 'translateZ(10px)', transformStyle: 'preserve-3d' }}
        className="h-full w-full"
      >
        {children}
      </div>
    </motion.div>
  )
}
