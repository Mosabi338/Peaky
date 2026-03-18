export type AppMode = 'interview' | 'meeting' | 'coding' | 'exam' | 'general'
export type Tab = 'transcript' | 'response' | 'context' | 'settings'

export interface TranscriptEntry {
  id: string
  text: string
  timestamp: number
}

export interface ContextDoc {
  id: string
  name: string
  content: string
}

export interface Settings {
  apiKey: string
  provider: 'openai' | 'groq'
  mode: AppMode
  opacity: number
  fontSize: number
  language: string
  autoCopy: boolean
}

declare global {
  interface Window {
    ghostkey: {
      transcribe: (audioData: ArrayBuffer, language?: string) => Promise<{ text?: string; error?: string }>
      generateAI: (payload: {
        transcript: string
        mode: string
        contextDocs: string
        language: string
        screenshotDataUrl?: string
        userInstruction?: string
      }) => void
      onAIChunk: (cb: (data: { text?: string; error?: string }) => void) => () => void
      onAIDone: (cb: () => void) => () => void
      captureScreen: () => Promise<{ dataUrl?: string; error?: string }>
      copyToClipboard: (text: string) => Promise<boolean>
      loadSettings: () => Promise<any>
      saveSettings: (s: Partial<any>) => Promise<any>
      onToggleRecording: (cb: () => void) => () => void
      onTriggerAI: (cb: () => void) => () => void
      onTriggerScreenshot: (cb: () => void) => () => void
      onClearAll: (cb: () => void) => () => void
      onVisibilityChanged: (cb: (v: boolean) => void) => () => void
      onPanicMode: (cb: (active: boolean) => void) => () => void
      onClickThroughChanged: (cb: (enabled: boolean) => void) => () => void
      installUpdate: () => void
      onUpdateAvailable: (cb: (version: string) => void) => () => void
      onUpdateProgress: (cb: (percent: number) => void) => () => void
      onUpdateDownloaded: (cb: (version: string) => void) => () => void
    }
  }
}