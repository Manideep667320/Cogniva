import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react'
import { useAuth } from './AuthContext'

interface VoiceContextType {
  isSpeaking: boolean
  isRecording: boolean
  speak: (text: string, onEnd?: () => void) => void
  stopSpeaking: () => void
  toggleRecording: () => void
  registerCommandHandler: (handler: (transcript: string) => Promise<void>) => void
  unregisterCommandHandler: () => void
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined)

export function VoiceProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const commandHandlerRef = useRef<((transcript: string) => Promise<void>) | null>(null)

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
    } else {
      // Start recording
      stopSpeaking() // stop any ongoing speech
      
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
      }
    }
  }

  const processVoiceCommand = async (blob: Blob) => {
    try {
      const formData = new FormData()
      formData.append('audio', blob, 'command.webm')

      const token = localStorage.getItem('auth_token')
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://cogniva-wu5f.onrender.com'
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
