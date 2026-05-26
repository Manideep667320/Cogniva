import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useVoice } from '@/contexts/VoiceContext';
import Orb from './Orb';

export function VoiceAvatar() {
  const { session } = useAuth();
  const { isSpeaking, isRecording, toggleRecording, speak } = useVoice();

  // Play a greeting when the avatar mounts (only when logged in)
  useEffect(() => {
    if (!session) return; // Don't speak on landing / unauthenticated pages
    const timer = setTimeout(() => {
      const hour = new Date().getHours();
      const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
      speak(`${greeting}! I am ready to help you learn. Click me to use voice commands.`);
    }, 1000);
    return () => clearTimeout(timer);
  }, [session]); // re-run if session changes

  if (!session) return null;

  return (
    <div 
      className="fixed z-50 cursor-pointer flex flex-col items-center group" 
      style={{ right: '95px', bottom: '95px' }}
      onClick={toggleRecording}
      title="Click to speak a command"
    >
      <div style={{ width: '24px', height: '24px' }}>
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
          Click to interrupt or speak
        </span>
      )}
    </div>
  );
}
