import { useState, useEffect } from 'react'
import { useStore } from '../store'
import { Shield, Wifi, Radio, MousePointer, Eye, Globe } from 'lucide-react'

export default function StatusBar() {
  const isRecording = useStore((s) => s.isRecording)
  const mode = useStore((s) => s.mode)
  const apiKey = useStore((s) => s.settings.apiKey)
  const language = useStore((s) => s.settings.language)
  const isInterviewActive = useStore((s) => s.isInterviewActive)
  const isScreenWatchActive = useStore((s) => s.isScreenWatchActive)
  const autoGenerate = useStore((s) => s.autoGenerate)
  const autoSolve = useStore((s) => s.autoSolve)

  const [clickThrough, setClickThrough] = useState(false)

  useEffect(() => {
    const gk = (window as any).ghostkey
    if (!gk?.onClickThroughChanged) return
    const off = gk.onClickThroughChanged((enabled: boolean) => {
      setClickThrough(enabled)
    })
    return () => off()
  }, [])

  return (
    <div className="flex-shrink-0 flex items-center justify-between px-3 py-1.5 border-t border-white/5 bg-ghost-950/50">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 text-[10px] text-green-400/60">
          <Shield size={10} />
          <span>Stealth</span>
        </div>
        {clickThrough && (
          <div className="flex items-center gap-1 text-[10px] text-yellow-400/60">
            <MousePointer size={10} />
          </div>
        )}
        <div className={`flex items-center gap-1 text-[10px] ${apiKey ? 'text-green-400/60' : 'text-red-400/60'}`}>
          <Wifi size={10} />
          <span>{apiKey ? 'OK' : 'No Key'}</span>
        </div>
        {language !== 'en' && (
          <div className="flex items-center gap-1 text-[10px] text-blue-400/60">
            <Globe size={9} />
            <span className="uppercase">{language}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {isInterviewActive && (
          <span className="flex items-center gap-1 text-[10px] text-ghost-500">
            <Radio size={10} />Live
            {autoGenerate && <span className="text-yellow-400">⚡</span>}
          </span>
        )}
        {isScreenWatchActive && (
          <span className="flex items-center gap-1 text-[10px] text-blue-400">
            <Eye size={10} />Watch
            {autoSolve && <span className="text-yellow-400">⚡</span>}
          </span>
        )}
        {isRecording && !isInterviewActive && (
          <span className="flex items-center gap-1 text-[10px] text-red-400">
            <span className="animate-pulse-recording w-1.5 h-1.5 rounded-full bg-red-400" />
            REC
          </span>
        )}
        <span className="text-[10px] text-white/20 capitalize">{mode}</span>
      </div>
    </div>
  )
}