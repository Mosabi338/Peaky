import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('ghostkey', {
  transcribe: (audioData: ArrayBuffer, language?: string) =>
    ipcRenderer.invoke('transcribe', audioData, language || 'en'),

  generateAI: (payload: {
    transcript: string
    mode: string
    contextDocs: string
    language: string
    screenshotDataUrl?: string
    userInstruction?: string
  }) => ipcRenderer.send('ai-generate', payload),

  onAIChunk: (cb: (data: { text?: string; error?: string }) => void) => {
    const handler = (_e: any, data: any) => cb(data)
    ipcRenderer.on('ai-chunk', handler)
    return () => ipcRenderer.removeListener('ai-chunk', handler)
  },

  onAIDone: (cb: () => void) => {
    const handler = () => cb()
    ipcRenderer.on('ai-done', handler)
    return () => ipcRenderer.removeListener('ai-done', handler)
  },

  captureScreen: () => ipcRenderer.invoke('capture-screen'),
  getDesktopAudioSource: () => ipcRenderer.invoke('get-desktop-audio-source'),
  copyToClipboard: (text: string) => ipcRenderer.invoke('copy-to-clipboard', text),
  loadSettings: () => ipcRenderer.invoke('load-settings'),
  saveSettings: (s: any) => ipcRenderer.invoke('save-settings', s),

  onToggleRecording: (cb: () => void) => {
    const handler = () => cb()
    ipcRenderer.on('toggle-recording', handler)
    return () => ipcRenderer.removeListener('toggle-recording', handler)
  },

  onTriggerAI: (cb: () => void) => {
    const handler = () => cb()
    ipcRenderer.on('trigger-ai', handler)
    return () => ipcRenderer.removeListener('trigger-ai', handler)
  },

  onTriggerScreenshot: (cb: () => void) => {
    const handler = () => cb()
    ipcRenderer.on('trigger-screenshot', handler)
    return () => ipcRenderer.removeListener('trigger-screenshot', handler)
  },

  onClearAll: (cb: () => void) => {
    const handler = () => cb()
    ipcRenderer.on('clear-all', handler)
    return () => ipcRenderer.removeListener('clear-all', handler)
  },

  onVisibilityChanged: (cb: (visible: boolean) => void) => {
    const handler = (_e: any, v: boolean) => cb(v)
    ipcRenderer.on('visibility-changed', handler)
    return () => ipcRenderer.removeListener('visibility-changed', handler)
  },

  onPanicMode: (cb: (active: boolean) => void) => {
    const handler = (_e: any, v: boolean) => cb(v)
    ipcRenderer.on('panic-mode', handler)
    return () => ipcRenderer.removeListener('panic-mode', handler)
  },

  onClickThroughChanged: (cb: (enabled: boolean) => void) => {
    const handler = (_e: any, v: boolean) => cb(v)
    ipcRenderer.on('click-through-changed', handler)
    return () => ipcRenderer.removeListener('click-through-changed', handler)
  },

  // Auto-Update
  installUpdate: () => ipcRenderer.send('install-update'),

  onUpdateAvailable: (cb: (version: string) => void) => {
    const handler = (_e: any, v: string) => cb(v)
    ipcRenderer.on('update-available', handler)
    return () => ipcRenderer.removeListener('update-available', handler)
  },

  onUpdateProgress: (cb: (percent: number) => void) => {
    const handler = (_e: any, p: number) => cb(p)
    ipcRenderer.on('update-progress', handler)
    return () => ipcRenderer.removeListener('update-progress', handler)
  },

  onUpdateDownloaded: (cb: (version: string) => void) => {
    const handler = (_e: any, v: string) => cb(v)
    ipcRenderer.on('update-downloaded', handler)
    return () => ipcRenderer.removeListener('update-downloaded', handler)
  },
})