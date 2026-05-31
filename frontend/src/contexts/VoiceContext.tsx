import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

interface VoiceContextType {
  isSpeaking: boolean
  isRecording: boolean
  isHandsFreeActive: boolean
  speak: (text: string, onEnd?: () => void) => void
  stopSpeaking: () => void
  toggleRecording: () => void
  registerCommandHandler: (handler: (transcript: string) => Promise<void>) => void
  unregisterCommandHandler: () => void
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined)

export function VoiceProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isHandsFreeActive, setIsHandsFreeActive] = useState(false)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const commandHandlerRef = useRef<((transcript: string) => Promise<void>) | null>(null)
  const recognitionRef = useRef<any>(null)
  const shouldListenRef = useRef(false)

  // Initialize background hands-free listening
  useEffect(() => {
    if (!session) {
      shouldListenRef.current = false
      if (recognitionRef.current) {
        try { recognitionRef.current.stop() } catch {}
      }
      setIsHandsFreeActive(false)
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      console.warn("Speech Recognition API not supported in this browser.")
      return
    }

    const rec = new SpeechRecognition()
    rec.continuous = true
    rec.interimResults = false
    rec.lang = 'en-US'

    rec.onresult = async (event: any) => {
      const lastResultIndex = event.results.length - 1
      const result = event.results[lastResultIndex]
      if (result.isFinal) {
        const text = result[0].transcript.toLowerCase().trim()
        console.log('🗣️ [VoiceCommand] Heard background phrase:', text)

        // Wake phrase validation
        if (text === 'hey cogniva' || text === 'cogniva') {
          speak("I'm listening. How can I help you?")
          return
        }

        // Voice Command Navigation
        if (text.includes('go to dashboard') || text.includes('open dashboard')) {
          speak("Opening your dashboard.")
          navigate('/dashboard')
        } else if (text.includes('go to tree') || text.includes('open skill tree') || text.includes('show skill tree')) {
          speak("Opening your skill trees.")
          navigate('/skill-tree')
        } else if (text.includes('go to calendar') || text.includes('open calendar') || text.includes('show calendar')) {
          speak("Opening your study calendar.")
          navigate('/calendar')
        } else if (text.includes('go to flashcards') || text.includes('open flashcards') || text.includes('show reviews')) {
          speak("Opening your flashcard reviews.")
          navigate('/flashcards/review')
        } else if (text.includes('go to tutor') || text.includes('open tutor') || text.includes('talk to tutor')) {
          speak("Launching AI Tutor.")
          navigate('/tutor')
        } else if (text.includes('go to rooms') || text.includes('open rooms') || text.includes('study room')) {
          speak("Opening study rooms.")
          navigate('/rooms')
        } else if (text.includes('pause reading') || text.includes('stop reading') || text.includes('shut up')) {
          stopSpeaking()
        }
      }
    }

    rec.onerror = (e: any) => {
      // Ignore transient errors (silence/no-speech and aborted are common in background listening)
      if (e.error === 'no-speech' || e.error === 'aborted') {
        return
      }
      console.error('Speech recognition error:', e)
      if (e.error === 'not-allowed') {
        shouldListenRef.current = false
        setIsHandsFreeActive(false)
      }
    }

    rec.onend = () => {
      // Only auto-restart if we intentionally want background listening active
      if (!shouldListenRef.current) {
        return
      }
      setTimeout(() => {
        if (shouldListenRef.current) {
          try { rec.start() } catch {}
        }
      }, 1000)
    }

    recognitionRef.current = rec
    try {
      shouldListenRef.current = true
      rec.start()
      setIsHandsFreeActive(true)
    } catch (err) {
      console.error('Failed to start speech recognition:', err)
    }

    return () => {
      shouldListenRef.current = false
      if (recognitionRef.current) {
        recognitionRef.current.onend = null
        recognitionRef.current.onerror = null
        try { recognitionRef.current.stop() } catch {}
      }
    }
  }, [session, navigate]) // eslint-disable-line react-hooks/exhaustive-deps

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }

  const speak = (text: string, onEnd?: () => void) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => {
        setIsSpeaking(false)
        if (onEnd) onEnd()
      }
      utterance.onerror = () => {
        setIsSpeaking(false)
        if (onEnd) onEnd()
      }
      window.speechSynthesis.speak(utterance)
    } else {
      if (onEnd) onEnd()
    }
  }

  const registerCommandHandler = (handler: (transcript: string) => Promise<void>) => {
    commandHandlerRef.current = handler
  }

  const unregisterCommandHandler = () => {
    commandHandlerRef.current = null
  }

  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      mediaRecorderRef.current?.stop()
      setIsRecording(false)
      // Resume background recognition
      shouldListenRef.current = true
      setTimeout(() => {
        if (shouldListenRef.current) {
          try { recognitionRef.current?.start() } catch {}
        }
      }, 500)
    } else {
      // Start recording
      stopSpeaking() // stop any ongoing speech
      
      // Pause background listening
      shouldListenRef.current = false
      try { recognitionRef.current?.stop() } catch {}
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const mediaRecorder = new MediaRecorder(stream)
        mediaRecorderRef.current = mediaRecorder
        audioChunksRef.current = []

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data)
          }
        }

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
          await processVoiceCommand(audioBlob)
          // Stop all audio tracks
          stream.getTracks().forEach(track => track.stop())
        }

        mediaRecorder.start()
        setIsRecording(true)
      } catch (err) {
        console.error("Microphone access denied or error:", err)
        alert("Please allow microphone access to use voice commands.")
        // Restart background listening on fail
        shouldListenRef.current = true
        setTimeout(() => {
          if (shouldListenRef.current) {
            try { recognitionRef.current?.start() } catch {}
          }
        }, 500)
      }
    }
  }

  const processVoiceCommand = async (blob: Blob) => {
    try {
      const formData = new FormData()
      formData.append('audio', blob, 'command.webm')

      const token = sessionStorage.getItem('auth_token')
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const res = await fetch(`${API_BASE_URL}/api/voice/command`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      })

      if (!res.ok) throw new Error('Voice transcription failed')

      const data = await res.json()
      
      // If a custom handler is active (e.g. from LearningPanel), pass the transcript to it
      if (commandHandlerRef.current) {
        await commandHandlerRef.current(data.command)
      } else {
        // Fallback default action
        speak(data.response || "I heard you, but I don't have a specific response right now.")
      }
    } catch (err) {
      console.error(err)
      speak("Sorry, I could not process your command right now.")
    }
  }

  return (
    <VoiceContext.Provider
      value={{
        isSpeaking,
        isRecording,
        isHandsFreeActive,
        speak,
        stopSpeaking,
        toggleRecording,
        registerCommandHandler,
        unregisterCommandHandler
      }}
    >
      {children}
    </VoiceContext.Provider>
  )
}

export function useVoice() {
  const context = useContext(VoiceContext)
  if (context === undefined) {
    throw new Error('useVoice must be used within a VoiceProvider')
  }
  return context
}
