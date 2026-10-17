import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, AlertCircle } from 'lucide-react';

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  className?: string;
}

// Window interface augmentation for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  onTranscript,
  className = '',
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        onTranscript(transcript);
      }
      setIsRecording(false);
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition notice:', event.error);
      if (event.error === 'not-allowed') {
        setErrorMessage('Microphone access denied. Please grant permission in browser settings.');
      } else if (event.error === 'no-speech') {
        setErrorMessage('No voice detected. Please try speaking closer to the microphone.');
      } else {
        setErrorMessage(`Voice input notice: ${event.error}`);
      }
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
  }, [onTranscript]);

  const toggleRecording = () => {
    setErrorMessage(null);
    if (!isSupported) {
      setErrorMessage('Browser Speech Recognition is not supported by your current browser.');
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsRecording(true);
      } catch (err: any) {
        console.error(err);
        setIsRecording(false);
      }
    }
  };

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={toggleRecording}
        title={isSupported ? "Voice Demo (Web Speech API)" : "Speech recognition not supported in this browser"}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
          isRecording
            ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-200'
            : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
        } ${className}`}
      >
        {isRecording ? (
          <>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            <Mic className="w-3.5 h-3.5" />
            <span>Listening...</span>
          </>
        ) : (
          <>
            <Mic className="w-3.5 h-3.5 text-blue-600" />
            <span>Voice Demo</span>
          </>
        )}
      </button>

      {errorMessage && (
        <div className="absolute bottom-full mb-2 left-0 w-64 p-2 bg-rose-50 border border-rose-200 text-rose-700 text-[11px] rounded-lg shadow-lg z-50 flex items-start gap-1.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
          <div className="flex-1">
            <span>{errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              className="block mt-1 font-semibold text-rose-800 hover:underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
