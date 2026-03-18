import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store'
import { Copy, Check, Trash2, History, Clipboard } from 'lucide-react'

export default function ResponsePanel() {
  const aiResponse = useStore((s) => s.aiResponse)
  const aiLoading = useStore((s) => s.aiLoading)
  const aiError = useStore((s) => s.aiError)
  const clearAI = useStore((s) => s.clearAI)
  const responseHistory = useStore((s) => s.responseHistory)
  const fontSize = useStore((s) => s.settings.fontSize)
  const autoCopy = useStore((s) => s.settings.autoCopy)
  const autoCopied = useStore((s) => s.autoCopied)

  const bottomRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [aiResponse])

  const copyResponse = async () => {
    await window.ghostkey.copyToClipboard(aiResponse)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (showHistory) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
          <span className="text-xs text-white/40">Response History</span>
          <button onClick={() => setShowHistory(false)} className="text-xs text-ghost-500 hover:text-ghost-400">← Back</button>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
          {responseHistory.length === 0 ? (
            <p className="text-white/20 text-sm text-center mt-8">No history yet</p>
          ) : (
            [...responseHistory].reverse().map((entry, i) => (
              <div key={i} className="p-2 rounded-lg bg-white/5 border border-white/5">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-white/20">{new Date(entry.timestamp).toLocaleString()}</p>
                  <button
                    onClick={async () => {
                      await window.ghostkey.copyToClipboard(entry.response)
                    }}
                    className="text-white/20 hover:text-white/60"
                  >
                    <Copy size={10} />
                  </button>
                </div>
                <p className="text-xs text-white/60 select-text mt-1">{entry.response}</p>
              </div>
            ))
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/40">
            {aiLoading ? '✨ Generating...' : aiResponse ? 'Response ready' : 'AI Response'}
          </span>
          {/* Auto-copied notification */}
          {autoCopied && (
            <span className="flex items-center gap-1 text-[10px] text-green-400 animate-pulse">
              <Clipboard size={10} />
              Auto-copied!
            </span>
          )}
          {autoCopy && !autoCopied && aiResponse && !aiLoading && (
            <span className="text-[10px] text-white/20">📋 Auto-copy ON</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowHistory(true)} className="text-white/30 hover:text-white/60 transition-colors" title="History">
            <History size={13} />
          </button>
          {aiResponse && (
            <>
              <button onClick={copyResponse} className="text-white/30 hover:text-green-400 transition-colors" title="Copy">
                {copied ? <Check size={13} /> : <Copy size={13} />}
              </button>
              <button onClick={clearAI} className="text-white/30 hover:text-red-400 transition-colors" title="Clear">
                <Trash2 size={13} />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        {aiError && (
          <div className="mb-3 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            ⚠️ {aiError}
          </div>
        )}

        {!aiResponse && !aiLoading && !aiError ? (
          <div className="flex flex-col items-center justify-center h-full text-white/20 text-sm">
            <p className="text-2xl mb-2">🤖</p>
            <p>Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-xs">Ctrl+Shift+A</kbd> to generate</p>
            <p className="text-xs mt-1 text-white/15">Or <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[10px]">Ctrl+Shift+S</kbd> to read screen</p>
          </div>
        ) : (
          <div
            className={`text-sm text-white/90 leading-relaxed whitespace-pre-wrap select-text ${aiLoading ? 'streaming-cursor' : ''}`}
            style={{ fontSize }}
          >
            {aiResponse}
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}