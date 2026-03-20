import { useStore } from '../store'
import type { AppMode, Tab } from '../types'
import {
  Mic, MicOff, Sparkles, Camera, MessageSquare, Brain,
  FileText, Settings, GripHorizontal, Play, Square, Zap,
  Monitor, Eye,
} from 'lucide-react'

const MODES: { value: AppMode; label: string; emoji: string }[] = [
  { value: 'interview', label: 'Interview', emoji: '🎯' },
  { value: 'meeting', label: 'Meeting', emoji: '📋' },
  { value: 'coding', label: 'Coding', emoji: '💻' },
  { value: 'exam', label: 'Exam', emoji: '📝' },
  { value: 'general', label: 'General', emoji: '✨' },
]

const TABS: { value: Tab; label: string; icon: any }[] = [
  { value: 'transcript', label: 'Transcript', icon: MessageSquare },
  { value: 'response', label: 'AI Response', icon: Brain },
  { value: 'context', label: 'Context', icon: FileText },
  { value: 'settings', label: 'Settings', icon: Settings },
]

interface Props {
  onToggleRecording: () => void
  onTriggerAI: () => void
  onTriggerScreenshot: () => void
  onStartInterview: () => void
  onEndInterview: () => void
  onStartScreenWatch: () => void
  onEndScreenWatch: () => void
  onSolveScreen: () => void
}

export default function Header({
  onToggleRecording, onTriggerAI, onTriggerScreenshot,
  onStartInterview, onEndInterview,
  onStartScreenWatch, onEndScreenWatch, onSolveScreen,
}: Props) {
  const mode = useStore((s) => s.mode)
  const setMode = useStore((s) => s.setMode)
  const isRecording = useStore((s) => s.isRecording)
  const activeTab = useStore((s) => s.activeTab)
  const setActiveTab = useStore((s) => s.setActiveTab)
  const aiLoading = useStore((s) => s.aiLoading)
  const isInterviewActive = useStore((s) => s.isInterviewActive)
  const autoGenerate = useStore((s) => s.autoGenerate)
  const setAutoGenerate = useStore((s) => s.setAutoGenerate)
  const speechState = useStore((s) => s.speechState)
  const newQuestionDetected = useStore((s) => s.newQuestionDetected)
  const isScreenWatchActive = useStore((s) => s.isScreenWatchActive)
  const autoSolve = useStore((s) => s.autoSolve)
  const setAutoSolve = useStore((s) => s.setAutoSolve)
  const screenChanged = useStore((s) => s.screenChanged)
  const language = useStore((s) => s.settings.language)

  const isSessionActive = isInterviewActive || isScreenWatchActive

  const renderActionButtons = () => {
    // ── Active Interview ────────────────────────────
    if (mode === 'interview' && isInterviewActive) {
      return (
        <>
          <div className="flex items-center gap-1.5 px-3 py-1.5">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30">
              <span className="animate-pulse-recording w-2 h-2 rounded-full bg-red-500" />
              <span className="text-xs text-red-400 font-bold">LIVE</span>
              {speechState === 'speaking' && <span className="text-[10px] text-green-400">🗣️</span>}
            </div>
            <button
              onClick={onTriggerAI}
              disabled={aiLoading}
              className="no-drag flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-ghost-500 text-white hover:bg-ghost-600 transition-all disabled:opacity-50 relative"
            >
              {newQuestionDetected && !aiLoading && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse" />
              )}
              <MessageSquare size={13} />
              <span>{aiLoading ? 'Thinking...' : 'What should I say?'}</span>
            </button>
            <button onClick={onTriggerScreenshot} className="no-drag flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs bg-white/5 text-white/50 border border-white/10 hover:text-white transition-all">
              <Camera size={12} />
            </button>
            <button onClick={onEndInterview} className="no-drag flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-white/50 border border-white/10 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 transition-all">
              <Square size={11} />
              <span>End</span>
            </button>
          </div>
          <div className="flex items-center justify-between px-3 py-0.5">
            <div className="flex items-center gap-2">
              {newQuestionDetected && (
                <span className="flex items-center gap-1 text-[10px] text-yellow-400 animate-pulse">
                  <Zap size={10} />New question detected
                </span>
              )}
              {speechState === 'speaking' && !newQuestionDetected && (
                <span className="text-[10px] text-green-400/60">Listening...</span>
              )}
            </div>
            <label className="no-drag flex items-center gap-1.5 text-[10px] text-white/40 cursor-pointer select-none">
              <input type="checkbox" checked={autoGenerate} onChange={(e) => setAutoGenerate(e.target.checked)} className="accent-ghost-500 w-3 h-3 cursor-pointer" />
              Auto-answer
            </label>
          </div>
        </>
      )
    }

    // ── Active Screen Watch ─────────────────────────
    if ((mode === 'coding' || mode === 'exam') && isScreenWatchActive) {
      return (
        <>
          <div className="flex items-center gap-1.5 px-3 py-1.5">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-500/20 border border-blue-500/30">
              <Eye size={13} className="text-blue-400 animate-pulse" />
              <span className="text-xs text-blue-400 font-bold">WATCHING</span>
            </div>
            <button
              onClick={onSolveScreen}
              disabled={aiLoading}
              className="no-drag flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-ghost-500 text-white hover:bg-ghost-600 transition-all disabled:opacity-50 relative"
            >
              {screenChanged && !aiLoading && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse" />
              )}
              <Sparkles size={13} className={aiLoading ? 'animate-spin' : ''} />
              <span>{aiLoading ? 'Solving...' : mode === 'exam' ? 'Answer This' : 'Solve This'}</span>
            </button>
            <button onClick={onEndScreenWatch} className="no-drag flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-white/50 border border-white/10 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 transition-all">
              <Square size={11} />
              <span>End</span>
            </button>
          </div>
          <div className="flex items-center justify-between px-3 py-0.5">
            <div className="flex items-center gap-2">
              {screenChanged && (
                <span className="flex items-center gap-1 text-[10px] text-yellow-400 animate-pulse">
                  <Zap size={10} />Screen changed
                </span>
              )}
            </div>
            <label className="no-drag flex items-center gap-1.5 text-[10px] text-white/40 cursor-pointer select-none">
              <input type="checkbox" checked={autoSolve} onChange={(e) => setAutoSolve(e.target.checked)} className="accent-ghost-500 w-3 h-3 cursor-pointer" />
              Auto-solve
            </label>
          </div>
        </>
      )
    }

    // ── Interview mode — not started ────────────────
    if (mode === 'interview') {
      return (
        <div className="flex items-center gap-1.5 px-3 py-1.5">
          <button onClick={onStartInterview} className="no-drag flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-bold bg-ghost-500 text-white hover:bg-ghost-600 transition-all">
            <Play size={15} />Start Interview Session
          </button>
          <button onClick={onTriggerScreenshot} className="no-drag flex items-center gap-1 px-3 py-2.5 rounded-lg text-xs font-medium bg-ghost-800 text-white/70 border border-white/10 hover:border-ghost-500/50 hover:text-white transition-all">
            <Camera size={13} />
          </button>
        </div>
      )
    }

    // ── Coding/Exam mode — not started ──────────────
    if (mode === 'coding' || mode === 'exam') {
      return (
        <div className="flex items-center gap-1.5 px-3 py-1.5">
          <button onClick={onStartScreenWatch} className="no-drag flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-bold bg-ghost-500 text-white hover:bg-ghost-600 transition-all">
            <Monitor size={15} />
            {mode === 'exam' ? 'Start Exam Helper' : 'Start Screen Watch'}
          </button>
          <button onClick={onTriggerScreenshot} className="no-drag flex items-center gap-1 px-3 py-2.5 rounded-lg text-xs font-medium bg-ghost-800 text-white/70 border border-white/10 hover:border-ghost-500/50 hover:text-white transition-all">
            <Camera size={13} />
          </button>
        </div>
      )
    }

    // ── Meeting/General mode ────────────────────────
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5">
        <button
          onClick={onToggleRecording}
          className={`no-drag flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            isRecording
              ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
              : 'bg-ghost-800 text-white/70 border border-white/10 hover:border-ghost-500/50 hover:text-white'
          }`}
        >
          {isRecording ? <><MicOff size={13} /><span>Stop</span><span className="animate-pulse-recording ml-0.5 w-1.5 h-1.5 rounded-full bg-red-400" /></> : <><Mic size={13} /><span>Record</span></>}
        </button>
        <button onClick={onTriggerAI} disabled={aiLoading} className="no-drag flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-ghost-500/20 text-ghost-50 border border-ghost-500/30 hover:bg-ghost-500/30 transition-all disabled:opacity-50">
          <Sparkles size={13} className={aiLoading ? 'animate-spin' : ''} />
          <span>{aiLoading ? 'Thinking...' : 'Generate'}</span>
        </button>
        <button onClick={onTriggerScreenshot} className="no-drag flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-ghost-800 text-white/70 border border-white/10 hover:border-ghost-500/50 hover:text-white transition-all">
          <Camera size={13} /><span>Screen</span>
        </button>
      </div>
    )
  }

  return (
    <div className="flex-shrink-0">
      <div className="drag-region flex items-center justify-between px-3 pt-2 pb-1">
        <div className="flex items-center gap-2">
          <GripHorizontal size={14} className="text-white/30" />
          <span className="text-xs font-bold text-ghost-500 tracking-wider">Peaky</span>
          {language !== 'en' && (
            <span className="text-[10px] text-white/30 uppercase">{language}</span>
          )}
        </div>
        <select
          className="no-drag bg-ghost-800 text-white/80 text-xs rounded-md px-2 py-1 border border-white/10 outline-none focus:border-ghost-500 cursor-pointer"
          value={mode}
          disabled={isSessionActive}
          onChange={(e) => {
            const newMode = e.target.value as AppMode
            setMode(newMode)
            window.ghostkey.saveSettings({ mode: newMode })
          }}
        >
          {MODES.map((m) => (
            <option key={m.value} value={m.value}>{m.emoji} {m.label}</option>
          ))}
        </select>
      </div>

      {renderActionButtons()}

      <div className="flex border-b border-white/5 px-2">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const active = activeTab === tab.value
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`no-drag flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-all border-b-2 ${
                active ? 'border-ghost-500 text-ghost-50' : 'border-transparent text-white/40 hover:text-white/70'
              }`}
            >
              <Icon size={12} />{tab.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}