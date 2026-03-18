import { useEffect, useRef } from 'react'
import { useStore } from '../store'
import { Trash2 } from 'lucide-react'

export default function TranscriptPanel() {
  const transcript = useStore((s) => s.transcript)
  const clearTranscript = useStore((s) => s.clearTranscript)
  const isRecording = useStore((s) => s.isRecording)
  const isInterviewActive = useStore((s) => s.isInterviewActive)
  const speechState = useStore((s) => s.speechState)
  const mode = useStore((s) => s.mode)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [transcript])

  const formatTime = (ts: number) => {
    const d = new Date(ts)
    return d.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
        <span className="text-xs text-white/40">
          {transcript.length} segment
          {transcript.length !== 1 ? 's' : ''}
          {isInterviewActive && (
            <span className="ml-2 text-red-400 animate-pulse-recording">
              ● Interview in progress
            </span>
          )}
          {!isInterviewActive && isRecording && (
            <span className="ml-2 text-red-400 animate-pulse-recording">
              ● Recording
            </span>
          )}
        </span>
        {transcript.length > 0 && !isInterviewActive && (
          <button
            onClick={clearTranscript}
            className="text-white/30 hover:text-red-400 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      {/* Transcript entries */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {transcript.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/20 text-sm">
            {mode === 'interview' && !isInterviewActive ? (
              <>
                <p className="text-2xl mb-2">🎯</p>
                <p>Click "Start Interview Session" above</p>
                <p className="text-xs mt-1 text-white/15">
                  GhostKey will automatically listen and transcribe
                </p>
                <p className="text-[10px] mt-3 text-white/10">
                  Tip: Add your resume and job description in the Context tab
                  first
                </p>
              </>
            ) : mode === 'interview' && isInterviewActive ? (
              <>
                <p className="text-2xl mb-2">👂</p>
                <p>Listening for speech...</p>
                <p className="text-xs mt-1 text-white/15">
                  The interview is being transcribed automatically
                </p>
              </>
            ) : (
              <>
                <p className="text-2xl mb-2">🎙️</p>
                <p>
                  Press{' '}
                  <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-xs">
                    Ctrl+Shift+R
                  </kbd>{' '}
                  to start recording
                </p>
                <p className="text-xs mt-1 text-white/15">
                  Audio will be transcribed in real-time
                </p>
              </>
            )}
          </div>
        ) : (
          <>
            {transcript.map((entry) => (
              <div
                key={entry.id}
                className="flex gap-2 text-sm leading-relaxed"
              >
                <span className="flex-shrink-0 text-[10px] text-white/20 pt-1 font-mono">
                  {formatTime(entry.timestamp)}
                </span>
                <p className="text-white/80 select-text">{entry.text}</p>
              </div>
            ))}
            {/* Live speech indicator */}
            {isInterviewActive && speechState === 'speaking' && (
              <div className="flex items-center gap-2 text-xs text-green-400/60 py-1">
                <span className="animate-pulse-recording">●</span>
                <span>Someone is speaking...</span>
              </div>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}