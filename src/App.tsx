import { useEffect, useRef, useCallback } from 'react'
import { useStore } from './store'
import Header from './components/Header'
import TranscriptPanel from './components/TranscriptPanel'
import ResponsePanel from './components/ResponsePanel'
import ContextPanel from './components/ContextPanel'
import SettingsPanel from './components/Settings'
import StatusBar from './components/StatusBar'
import UpdateNotification from './components/UpdateNotification'

export default function App() {
  const activeTab = useStore((s) => s.activeTab)
  const opacity = useStore((s) => s.opacity)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const silenceFrameRef = useRef<number | null>(null)
  const triggerAIRef = useRef<(s?: string) => void>(() => {})

  // Screen watch
  const screenWatchTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastScreenDataLengthRef = useRef<number>(0)

  // ── Load settings ───────────────────────────────────
  useEffect(() => {
    window.ghostkey.loadSettings().then((s: any) => {
      const state = useStore.getState()
      state.updateSettings({
        apiKey: s.apiKey || '',
        provider: s.provider || 'groq',
        mode: s.mode || 'interview',
        opacity: s.opacity || 92,
        fontSize: s.fontSize || 14,
        language: s.language || 'en',
        autoCopy: s.autoCopy !== undefined ? s.autoCopy : true,
      })
      state.setMode(s.mode || 'interview')
      state.setOpacity(s.opacity || 92)
    })
  }, [])

  // ── AI streaming + auto-copy ────────────────────────
  useEffect(() => {
    const offChunk = window.ghostkey.onAIChunk((data) => {
      if (data.error) {
        useStore.getState().setAIError(data.error)
      } else if (data.text) {
        useStore.getState().appendAI(data.text)
      }
    })

    const offDone = window.ghostkey.onAIDone(() => {
      const state = useStore.getState()
      state.setAILoading(false)
      state.saveToHistory()

      // Auto-copy to clipboard
      if (state.settings.autoCopy && state.aiResponse) {
        window.ghostkey
          .copyToClipboard(state.aiResponse)
          .then(() => {
            state.setAutoCopied(true)
            setTimeout(() => useStore.getState().setAutoCopied(false), 3000)
          })
          .catch(() => {})
      }
    })

    return () => {
      offChunk()
      offDone()
    }
  }, [])

  // ── Audio chunk recording ───────────────────────────
  const recordChunk = useCallback((stream: MediaStream) => {
    if (!stream.active) return

    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm'

    const recorder = new MediaRecorder(stream, { mimeType })
    const chunks: Blob[] = []

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data)
    }

    recorder.onstop = async () => {
      if (useStore.getState().isRecording && stream.active) {
        recordChunk(stream)
      }
      if (chunks.length > 0) {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        const arrayBuffer = await blob.arrayBuffer()
        const lang = useStore.getState().settings.language
        const result = await window.ghostkey.transcribe(arrayBuffer, lang)
        if (result.text) {
          useStore.getState().addTranscript(result.text)
        }
      }
    }

    recorder.start()
    mediaRecorderRef.current = recorder

    const duration = useStore.getState().isInterviewActive ? 5000 : 4000
    chunkTimerRef.current = setTimeout(() => {
      if (recorder.state === 'recording') recorder.stop()
    }, duration)
  }, [])

  // ── Manual recording ────────────────────────────────
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 16000 },
      })
      streamRef.current = stream
      useStore.getState().setRecording(true)
      recordChunk(stream)
    } catch (e: any) {
      useStore.getState().setAIError('Microphone access denied')
    }
  }, [recordChunk])

  const stopRecording = useCallback(() => {
    useStore.getState().setRecording(false)
    if (chunkTimerRef.current) clearTimeout(chunkTimerRef.current)
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop()
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    mediaRecorderRef.current = null
  }, [])

  const toggleRecording = useCallback(() => {
    if (useStore.getState().isRecording) stopRecording()
    else startRecording()
  }, [startRecording, stopRecording])

  // ── Interview session ───────────────────────────────
  const startInterviewSession = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 16000 },
      })
      streamRef.current = stream

      const audioContext = new AudioContext()
      audioContextRef.current = audioContext
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 512
      analyser.smoothingTimeConstant = 0.85
      source.connect(analyser)
      analyserRef.current = analyser

      const state = useStore.getState()
      state.setInterviewActive(true)
      state.setRecording(true)
      state.clearTranscript()
      state.clearAI()
      state.setSpeechState('silent')
      state.setNewQuestionDetected(false)

      recordChunk(stream)
      startSilenceDetection()
    } catch (e: any) {
      useStore.getState().setAIError('Microphone access denied')
    }
  }, [recordChunk])

  const stopInterviewSession = useCallback(() => {
    const state = useStore.getState()
    state.setInterviewActive(false)
    state.setRecording(false)
    state.setSpeechState('silent')
    state.setNewQuestionDetected(false)

    if (chunkTimerRef.current) clearTimeout(chunkTimerRef.current)
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop()
    if (silenceFrameRef.current) cancelAnimationFrame(silenceFrameRef.current)
    silenceFrameRef.current = null
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {})
      audioContextRef.current = null
      analyserRef.current = null
    }
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    mediaRecorderRef.current = null
  }, [])

  // ── Silence detection ───────────────────────────────
  const startSilenceDetection = useCallback(() => {
    const analyser = analyserRef.current
    if (!analyser) return

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    let wasSpeaking = false
    let silenceStartTime = 0

    const detect = () => {
      if (!useStore.getState().isInterviewActive) return
      analyser.getByteFrequencyData(dataArray)

      let sum = 0
      for (let i = 0; i < bufferLength; i++) sum += dataArray[i]
      const average = sum / bufferLength

      if (average > 15) {
        wasSpeaking = true
        silenceStartTime = 0
        useStore.getState().setSpeechState('speaking')
        useStore.getState().setNewQuestionDetected(false)
      } else if (average < 10 && wasSpeaking) {
        if (silenceStartTime === 0) {
          silenceStartTime = Date.now()
        } else if (Date.now() - silenceStartTime > 2500) {
          useStore.getState().setSpeechState('silent')
          useStore.getState().setNewQuestionDetected(true)
          wasSpeaking = false
          silenceStartTime = 0

          const cs = useStore.getState()
          if (cs.autoGenerate && !cs.aiLoading && cs.transcript.length > 0) {
            triggerAIRef.current()
          }
        }
      }

      silenceFrameRef.current = requestAnimationFrame(detect)
    }

    silenceFrameRef.current = requestAnimationFrame(detect)
  }, [])

  // ── Screen Watch session ────────────────────────────
  const startScreenWatch = useCallback(() => {
    const state = useStore.getState()
    state.setScreenWatchActive(true)
    state.clearAI()
    state.setActiveTab('response')
    lastScreenDataLengthRef.current = 0
  }, [])

  const stopScreenWatch = useCallback(() => {
    useStore.getState().setScreenWatchActive(false)
    useStore.getState().setAutoSolve(false)
    if (screenWatchTimerRef.current) {
      clearInterval(screenWatchTimerRef.current)
      screenWatchTimerRef.current = null
    }
    lastScreenDataLengthRef.current = 0
  }, [])

  // Auto-solve: periodic screenshot + AI
  const startAutoSolveLoop = useCallback(() => {
    if (screenWatchTimerRef.current) clearInterval(screenWatchTimerRef.current)

    screenWatchTimerRef.current = setInterval(async () => {
      const state = useStore.getState()
      if (!state.isScreenWatchActive || !state.autoSolve || state.aiLoading) return

      const result = await window.ghostkey.captureScreen()
      if (!result.dataUrl) return

      const newLength = result.dataUrl.length
      const oldLength = lastScreenDataLengthRef.current

      // If screen changed by more than 5%
      if (oldLength === 0 || Math.abs(newLength - oldLength) / oldLength > 0.05) {
        lastScreenDataLengthRef.current = newLength
        useStore.getState().setLastScreenshot(result.dataUrl)
        useStore.getState().setScreenChanged(true)
        triggerAIRef.current(result.dataUrl)
      }
    }, 12000) // every 12 seconds
  }, [])

  const stopAutoSolveLoop = useCallback(() => {
    if (screenWatchTimerRef.current) {
      clearInterval(screenWatchTimerRef.current)
      screenWatchTimerRef.current = null
    }
  }, [])

  // Watch autoSolve toggle
  useEffect(() => {
    const unsub = useStore.subscribe((state, prevState) => {
      if (state.autoSolve && !prevState.autoSolve && state.isScreenWatchActive) {
        startAutoSolveLoop()
      } else if (!state.autoSolve && prevState.autoSolve) {
        stopAutoSolveLoop()
      }
    })
    return () => unsub()
  }, [startAutoSolveLoop, stopAutoSolveLoop])

  // ── AI generation ───────────────────────────────────
  const triggerAI = useCallback((screenshotDataUrl?: string) => {
    const state = useStore.getState()
    state.clearAI()
    state.setAILoading(true)
    state.setActiveTab('response')
    state.setNewQuestionDetected(false)
    state.setScreenChanged(false)

    const transcriptText = state.transcript.map((t) => t.text).join('\n')
    const contextText = state.contextDocs
      .map((d) => `[${d.name}]\n${d.content}`)
      .join('\n\n')

    let userInstruction: string | undefined
    if (state.isInterviewActive) {
      userInstruction =
        'Analyze this interview transcript carefully. Identify the MOST RECENT question from the interviewer. Provide the perfect answer I should say right now.'
    } else if (state.isScreenWatchActive || screenshotDataUrl) {
      userInstruction =
        'Look at my screen carefully. Read EVERYTHING visible. If there are questions or problems, solve ALL of them completely. Provide clear, ready-to-use answers.'
    }

    window.ghostkey.generateAI({
      transcript: transcriptText,
      mode: state.mode,
      contextDocs: contextText,
      language: state.settings.language,
      screenshotDataUrl,
      userInstruction,
    })
  }, [])

  // Keep ref updated
  useEffect(() => {
    triggerAIRef.current = triggerAI
  }, [triggerAI])

  // Solve This = screenshot + AI
  const solveScreen = useCallback(async () => {
    const result = await window.ghostkey.captureScreen()
    if (result.dataUrl) {
      useStore.getState().setLastScreenshot(result.dataUrl)
      lastScreenDataLengthRef.current = result.dataUrl.length
      triggerAI(result.dataUrl)
    } else {
      useStore.getState().setAIError(result.error || 'Screenshot failed')
    }
  }, [triggerAI])

  // ── Global hotkeys ──────────────────────────────────
  useEffect(() => {
    const off1 = window.ghostkey.onToggleRecording(() => {
      if (useStore.getState().isInterviewActive || useStore.getState().isScreenWatchActive) return
      toggleRecording()
    })
    const off2 = window.ghostkey.onTriggerAI(() => {
      if (useStore.getState().isScreenWatchActive) {
        solveScreen()
      } else {
        triggerAI()
      }
    })
    const off3 = window.ghostkey.onTriggerScreenshot(solveScreen)
    const off4 = window.ghostkey.onClearAll(() => useStore.getState().clearAll())
    return () => { off1(); off2(); off3(); off4() }
  }, [toggleRecording, triggerAI, solveScreen])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (useStore.getState().isInterviewActive) stopInterviewSession()
      if (useStore.getState().isScreenWatchActive) stopScreenWatch()
    }
  }, [stopInterviewSession, stopScreenWatch])

  const renderTab = () => {
    switch (activeTab) {
      case 'transcript': return <TranscriptPanel />
      case 'response': return <ResponsePanel />
      case 'context': return <ContextPanel />
      case 'settings': return <SettingsPanel />
    }
  }

  return (
    <div className="h-full w-full p-1" style={{ opacity: opacity / 100 }}>
      <div className="h-full flex flex-col rounded-2xl border border-white/10 bg-ghost-950/[0.96] backdrop-blur-xl overflow-hidden shadow-2xl shadow-purple-900/20">
        <Header
          onToggleRecording={toggleRecording}
          onTriggerAI={() => triggerAI()}
          onTriggerScreenshot={solveScreen}
          onStartInterview={startInterviewSession}
          onEndInterview={stopInterviewSession}
          onStartScreenWatch={startScreenWatch}
          onEndScreenWatch={stopScreenWatch}
          onSolveScreen={solveScreen}
        />
        <div className="flex-1 overflow-hidden">{renderTab()}</div>
        <UpdateNotification />
        <StatusBar />
      </div>
    </div>
  )
}