import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Orb from './Orb';

export function VoiceAvatar() {
  const { session } = useAuth();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleGreeting = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop any ongoing speech
      const hour = new Date().getHours();
      const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
      speakResponse(`${greeting}! I am ready to help you learn. Click me to use voice commands.`);
    }
  };

  const speakResponse = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          await sendVoiceCommand(audioBlob);
          // Stop all audio tracks to turn off the microphone light
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Microphone access denied or error:", err);
        alert("Please allow microphone access to use voice commands.");
      }
    }
  };

  const sendVoiceCommand = async (blob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('audio', blob, 'command.webm');

      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8000/api/voice/command', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!res.ok) throw new Error('Voice command failed');

      const data = await res.json();
      speakResponse(data.response);
    } catch (err) {
      console.error(err);
      speakResponse("Sorry, I could not process your command right now. Make sure AssemblyAI is configured.");
    }
  };

  // Play a greeting when the avatar mounts (if browser allows)
  useEffect(() => {
    const timer = setTimeout(() => {
      handleGreeting();
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (!session) return null;

  return (
    <div 
      className="fixed bottom-8 right-8 z-50 cursor-pointer flex flex-col items-center group" 
      onClick={toggleRecording}
      title="Click to speak a command"
    >
      <div style={{ width: '150px', height: '150px' }}>
        <Orb
          hue={isRecording ? 0 : 210} // Red if recording, Blue/Indigo otherwise
          hoverIntensity={isRecording ? 1.0 : 0.5}
          rotateOnHover={true}
          forceHoverState={isSpeaking || isRecording}
          backgroundColor="rgba(0, 0, 0, 0)" // Transparent so it floats nicely
        />
      </div>
      
      {/* Dynamic Status Text */}
      {isRecording ? (
        <span className="text-xs text-red-500 font-bold mt-2 animate-pulse bg-background/80 px-2 py-1 rounded-md backdrop-blur-sm border border-border">
          Listening... Click to send
        </span>
      ) : (
        <span className="text-xs text-muted-foreground font-medium mt-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 px-2 py-1 rounded-md backdrop-blur-sm border border-border">
          Click to speak
        </span>
      )}
    </div>
  );
}
