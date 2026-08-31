import { create } from 'zustand'
import type { AppMode, Tab, TranscriptEntry, ContextDoc, Settings } from './types'

interface AppState {
  activeTab: Tab
  setActiveTab: (tab: Tab) => void
  mode: AppMode
  setMode: (mode: AppMode) => void
  isRecording: boolean
  setRecording: (v: boolean) => void

  // Interview session
  isInterviewActive: boolean
  setInterviewActive: (v: boolean) => void
  autoGenerate: boolean
  setAutoGenerate: (v: boolean) => void
  speechState: 'speaking' | 'silent'
  setSpeechState: (s: 'speaking' | 'silent') => void
  newQuestionDetected: boolean
  setNewQuestionDetected: (v: boolean) => void

  // Screen Watch session
  isScreenWatchActive: boolean
  setScreenWatchActive: (v: boolean) => void
  autoSolve: boolean
  setAutoSolve: (v: boolean) => void
  screenChanged: boolean
  setScreenChanged: (v: boolean) => void

  // Transcript
  transcript: TranscriptEntry[]
  addTranscript: (text: string) => void
  clearTranscript: () => void

  // AI response
  aiResponse: string
  aiLoading: boolean
  aiError: string | null
  appendAI: (text: string) => void
  setAILoading: (v: boolean) => void
  setAIError: (e: string | null) => void
  clearAI: () => void

  // History
  responseHistory: { prompt: string; response: string; timestamp: number }[]
  saveToHistory: () => void

  // Context
  contextDocs: ContextDoc[]
  addContextDoc: (doc: ContextDoc) => void
  removeContextDoc: (id: string) => void

  // Settings
  settings: Settings
  updateSettings: (s: Partial<Settings>) => void

  // UI
  opacity: number
  setOpacity: (v: number) => void
  lastScreenshot: string | null
  setLastScreenshot: (s: string | null) => void

  clearAll: () => void
}

export const useStore = create<AppState>((set, get) => ({
  activeTab: 'transcript',
  setActiveTab: (tab) => set({ activeTab: tab }),
  mode: 'interview',
  setMode: (mode) => set({ mode }),
  isRecording: false,
  setRecording: (v) => set({ isRecording: v }),

  isInterviewActive: false,
  setInterviewActive: (v) => set({ isInterviewActive: v }),
  autoGenerate: false,
  setAutoGenerate: (v) => set({ autoGenerate: v }),
  speechState: 'silent' as const,
  setSpeechState: (s) => set({ speechState: s }),
  newQuestionDetected: false,
  setNewQuestionDetected: (v) => set({ newQuestionDetected: v }),

  isScreenWatchActive: false,
  setScreenWatchActive: (v) => set({ isScreenWatchActive: v }),
  autoSolve: false,
  setAutoSolve: (v) => set({ autoSolve: v }),
  screenChanged: false,
  setScreenChanged: (v) => set({ screenChanged: v }),

  transcript: [],
  addTranscript: (text) => {
    if (!text.trim()) return
    set((s) => ({
      transcript: [
        ...s.transcript,
        { id: crypto.randomUUID(), text: text.trim(), timestamp: Date.now() },
      ],
    }))
  },
  clearTranscript: () => set({ transcript: [] }),

  aiResponse: '',
  aiLoading: false,
  aiError: null,
  appendAI: (text) => set((s) => ({ aiResponse: s.aiResponse + text })),
  setAILoading: (v) => set({ aiLoading: v }),
  setAIError: (e) => set({ aiError: e }),
  clearAI: () => set({ aiResponse: '', aiError: null }),

  responseHistory: [],
  saveToHistory: () => {
    const { aiResponse, transcript } = get()
    if (!aiResponse) return
    set((s) => ({
      responseHistory: [
        ...s.responseHistory,
        {
          prompt: transcript.map((t) => t.text).join(' '),
          response: aiResponse,
          timestamp: Date.now(),
        },
      ],
    }))
  },

  contextDocs: [],
  addContextDoc: (doc) => set((s) => ({ contextDocs: [...s.contextDocs, doc] })),
  removeContextDoc: (id) =>
    set((s) => ({ contextDocs: s.contextDocs.filter((d) => d.id !== id) })),

  settings: {
    apiKey: '',
    provider: 'groq' as const,
    mode: 'interview' as AppMode,
    opacity: 92,
    fontSize: 14,
    language: 'en',
  },
  updateSettings: (s) => set((prev) => ({ settings: { ...prev.settings, ...s } })),

  opacity: 92,
  setOpacity: (v) => set({ opacity: v }),
  lastScreenshot: null,
  setLastScreenshot: (s) => set({ lastScreenshot: s }),

  clearAll: () =>
    set({
      transcript: [],
      aiResponse: '',
      aiError: null,
      lastScreenshot: null,
      newQuestionDetected: false,
      screenChanged: false,
    }),
}))