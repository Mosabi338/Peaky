import {
  app,
  BrowserWindow,
  ipcMain,
  globalShortcut,
  desktopCapturer,
  clipboard,
  Tray,
  Menu,
  nativeImage,
  screen as electronScreen,
} from 'electron'
import { join } from 'path'
import {
  writeFileSync,
  readFileSync,
  unlinkSync,
  existsSync,
  mkdirSync,
  createReadStream,
} from 'fs'
import { tmpdir } from 'os'
import OpenAI from 'openai'

// Auto-updater (only works in production builds)
let autoUpdater: any = null
try {
  autoUpdater = require('electron-updater').autoUpdater
} catch (e) {
  // Not available in dev mode — that's fine
}

// ── State ──────────────────────────────────────────────
let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let openai: OpenAI | null = null
let isVisible = true
let isClickThrough = false

const SETTINGS_DIR = join(app.getPath('userData'), 'Peaky')
const SETTINGS_PATH = join(SETTINGS_DIR, 'settings.json')

interface Settings {
  apiKey: string
  provider: 'openai' | 'groq'
  mode: string
  opacity: number
  fontSize: number
  stealthLevel: 'normal' | 'max'
  language: string
  autoCopy: boolean
  windowBounds?: { x: number; y: number; width: number; height: number }
}

const DEFAULT_SETTINGS: Settings = {
  apiKey: '',
  provider: 'groq',
  mode: 'interview',
  opacity: 92,
  fontSize: 14,
  stealthLevel: 'max',
  language: 'en',
  autoCopy: true,
}

const PROVIDERS: Record<
  string,
  { baseURL: string; chatModel: string; visionModel: string; whisperModel: string }
> = {
  groq: {
    baseURL: 'https://api.groq.com/openai/v1',
    chatModel: 'llama-3.3-70b-versatile',
    visionModel: 'llama-3.2-90b-vision-preview',
    whisperModel: 'whisper-large-v3',
  },
  openai: {
    baseURL: 'https://api.openai.com/v1',
    chatModel: 'gpt-4o',
    visionModel: 'gpt-4o',
    whisperModel: 'whisper-1',
  },
}

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  pt: 'Portuguese',
  zh: 'Chinese',
  ja: 'Japanese',
  ko: 'Korean',
  ar: 'Arabic',
  hi: 'Hindi',
  ru: 'Russian',
  it: 'Italian',
  nl: 'Dutch',
  tr: 'Turkish',
  pl: 'Polish',
  sv: 'Swedish',
  uk: 'Ukrainian',
}

function loadSettings(): Settings {
  try {
    if (!existsSync(SETTINGS_DIR)) mkdirSync(SETTINGS_DIR, { recursive: true })
    if (existsSync(SETTINGS_PATH)) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(readFileSync(SETTINGS_PATH, 'utf-8')) }
    }
  } catch (e) {
    console.error('Failed to load settings:', e)
  }
  return { ...DEFAULT_SETTINGS }
}

function saveSettings(settings: Settings) {
  try {
    if (!existsSync(SETTINGS_DIR)) mkdirSync(SETTINGS_DIR, { recursive: true })
    writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2))
  } catch (e) {
    console.error('Failed to save settings:', e)
  }
}

function initAI(apiKey: string, provider: string) {
  if (apiKey) {
    const config = PROVIDERS[provider] || PROVIDERS.groq
    openai = new OpenAI({ apiKey, baseURL: config.baseURL })
  }
}

function getProviderConfig() {
  const settings = loadSettings()
  return PROVIDERS[settings.provider] || PROVIDERS.groq
}

// ── System Prompts (with language support) ─────────────
function getSystemPrompt(mode: string, language: string): string {
  const langName = LANGUAGE_NAMES[language] || 'English'
  const langInstruction =
    language !== 'en'
      ? `\n\nCRITICAL LANGUAGE INSTRUCTION: You MUST respond ENTIRELY in ${langName}. Every single word of your output must be in ${langName}.`
      : ''

  const prompts: Record<string, string> = {
    interview: `You are an elite interview coach embedded in the candidate's overlay HUD.
You are reading a LIVE transcript captured from a microphone during an interview. The transcript may contain BOTH the interviewer's voice and the candidate's voice mixed together.

Your job:
1. Carefully analyze the full transcript
2. Identify the MOST RECENT question or prompt from the interviewer
3. Generate the PERFECT answer the candidate should say RIGHT NOW

How to identify speakers:
- The interviewer ASKS questions (who, what, when, where, why, how, tell me about, describe, explain, walk me through, can you, have you, etc.)
- The interviewer introduces new topics, follows up, and probes deeper
- The candidate ANSWERS with personal experiences, skills, and examples
- Focus on the LAST question asked — that is what needs answering now

Rules:
- Start with a brief restatement of the identified question
- Then provide the perfect answer
- Be concise (2-4 sentences unless deep technical question)
- Sound natural and conversational, not robotic
- Use STAR method for behavioral questions (Situation, Task, Action, Result)
- Include specific metrics, numbers, and examples when possible
- If context docs (resume, job description) are provided, weave in relevant details
- If you cannot identify a clear question, provide a smart response based on the conversation flow${langInstruction}`,

    meeting: `You are a real-time meeting assistant. Based on the transcript:
- Provide relevant talking points and data
- Suggest smart questions to ask
- Summarize key decisions and action items
- Keep suggestions brief and actionable${langInstruction}`,

    coding: `You are a senior software engineer and coding expert. You can see the user's screen and read code, error messages, terminal output, and coding problems.

Your job:
- Analyze what's visible on screen (code, errors, problem statements, test cases, IDE content)
- Provide correct, clean, working code solutions
- Explain your approach concisely
- Catch bugs, edge cases, and optimization opportunities
- Use proper formatting with code blocks and language identifiers
- If you see a coding problem, challenge, or leetcode question, solve it COMPLETELY step by step
- If you see an error or stack trace, explain what's wrong and provide the exact fix
- If you see code that needs improvement, show the improved version
- Always provide code that can be directly copied and used${langInstruction}`,

    exam: `You are a knowledgeable expert tutor and exam helper. You can see the user's screen showing exam questions, quizzes, tests, or assignments.

Your job:
- Read ALL questions and problems visible on screen carefully
- Provide accurate, complete, well-structured answers for EACH question
- Number your answers to match the question numbers on screen
- Show your work for math, science, and technical problems
- For multiple choice: state the correct letter/option AND explain why
- For written/essay questions: provide clear, concise, well-organized responses
- For calculations: show each step clearly
- For true/false: state the answer and brief justification
- For fill-in-the-blank: provide the exact answer
- Reference key concepts, formulas, and theories where relevant
- Be thorough but concise — give answers ready to submit${langInstruction}`,

    general: `You are a brilliant AI assistant on the user's screen overlay.
Provide concise, direct, actionable responses. No fluff.
If you can see the user's screen, analyze what's visible and help accordingly.${langInstruction}`,
  }

  return prompts[mode] || prompts.general
}

// ── Window Creation ────────────────────────────────────
function createWindow() {
  const settings = loadSettings()
  const display = electronScreen.getPrimaryDisplay()
  const { width: screenW } = display.workAreaSize

  const bounds = settings.windowBounds || {
    x: screenW - 440,
    y: 60,
    width: 420,
    height: 700,
  }

  mainWindow = new BrowserWindow({
    ...bounds,
    title: '',
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    resizable: true,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    type: 'toolbar',
    focusable: true,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  // ★ STEALTH ★
  mainWindow.setContentProtection(true)
  mainWindow.setTitle('')
  mainWindow.setAlwaysOnTop(true, 'screen-saver', 1)
  mainWindow.setVisibleOnAllWorkspaces(true)
  mainWindow.setSkipTaskbar(true)

  mainWindow.on('moved', () => {
    if (mainWindow) {
      const s = loadSettings()
      s.windowBounds = mainWindow.getBounds()
      saveSettings(s)
    }
  })
  mainWindow.on('resized', () => {
    if (mainWindow) {
      const s = loadSettings()
      s.windowBounds = mainWindow.getBounds()
      saveSettings(s)
    }
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'))
  }

  initAI(settings.apiKey, settings.provider)
}

// ── Tray ───────────────────────────────────────────────
function createTray() {
  const icon = nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAUdJREFUOI2dk71KA0EUhb+ZzUaJhYKFYOMD+AK+gmBnZWHhI/gIFnaCnY2lL2Bj4QOIjQERLBQsRBSNbnZn7rVYNm4S/+DAMMOc795zhivGGP5T8ScfjTE/DEBU4B+MYIyB/wVIsgBlAVJBhBWQNIgCGAFJILnknPt6E+8FkFR4ZA9YBLYA2cA7oNS3UT8ZY7jVCAZwD9gBdoEHnuelAJqSngGXwBrwAiwBl8AKMA28A9vAOnAHOJ1IH8A5sAgsADPAI3ADnABbwBRwCzwBZ8A2sAwsAifADnAAHAFrwC6wBBwCR8ApUN+TUlriui7GGJqamoK6uro/BXAcB2stzc3NlJSU4Ps+nudhrSVNU1KpFLlcjlwuRy6X+11AUhAEAdlslkwmQzabJZ1Ok0qlyGQypNNpstksiUTiZ4EoivA8j0QigbUWay3WWqIoIp/P/wXwDUUb7aORDAAAAABJRU5ErkJggg=='
  )
  tray = new Tray(icon.resize({ width: 16, height: 16 }))
  tray.setToolTip('')
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Toggle', click: () => toggleVisibility() },
      { type: 'separator' },
      { label: 'Exit', click: () => app.quit() },
    ])
  )
  tray.on('click', () => toggleVisibility())
}

function toggleVisibility() {
  if (!mainWindow) return
  if (isVisible) {
    mainWindow.hide()
  } else {
    mainWindow.show()
    mainWindow.setAlwaysOnTop(true, 'screen-saver', 1)
  }
  isVisible = !isVisible
  mainWindow.webContents.send('visibility-changed', isVisible)
}

function panicHide() {
  if (!mainWindow) return
  isVisible = false
  mainWindow.hide()
  mainWindow.webContents.send('visibility-changed', false)
  mainWindow.webContents.send('panic-mode', true)
}

function toggleClickThrough() {
  if (!mainWindow) return
  isClickThrough = !isClickThrough
  mainWindow.setIgnoreMouseEvents(isClickThrough, { forward: true })
  mainWindow.webContents.send('click-through-changed', isClickThrough)
}

// ── Global Shortcuts ───────────────────────────────────
function registerShortcuts() {
  globalShortcut.register('CommandOrControl+Shift+G', () => toggleVisibility())
  globalShortcut.register('CommandOrControl+Shift+P', () => panicHide())
  globalShortcut.register('CommandOrControl+Shift+T', () => toggleClickThrough())
  globalShortcut.register('CommandOrControl+Shift+R', () => {
    mainWindow?.webContents.send('toggle-recording')
  })
  globalShortcut.register('CommandOrControl+Shift+A', () => {
    mainWindow?.webContents.send('trigger-ai')
  })
  globalShortcut.register('CommandOrControl+Shift+S', () => {
    mainWindow?.webContents.send('trigger-screenshot')
  })
  globalShortcut.register('CommandOrControl+Shift+X', () => {
    mainWindow?.webContents.send('clear-all')
  })
}

// ── IPC: Transcribe ────────────────────────────────────
ipcMain.handle(
  'transcribe',
  async (_event, audioData: ArrayBuffer, language: string) => {
    if (!openai) return { error: 'API key not set' }
    try {
      const buffer = Buffer.from(audioData)
      if (buffer.length < 1000) return { text: '' }

      const tempPath = join(tmpdir(), `tmp-${Date.now()}.webm`)
      writeFileSync(tempPath, buffer)

      const config = getProviderConfig()

      const transcription = await openai.audio.transcriptions.create({
        file: createReadStream(tempPath),
        model: config.whisperModel,
        response_format: 'text',
        language: language || 'en',
      })

      try {
        unlinkSync(tempPath)
      } catch (e) {}

      const text =
        typeof transcription === 'string'
          ? transcription
          : (transcription as any).text || ''
      return { text: text.trim() }
    } catch (e: any) {
      console.error('Transcription error:', e.message)
      return { error: e.message }
    }
  }
)

// ── IPC: AI Generate (streaming) ───────────────────────
ipcMain.on(
  'ai-generate',
  async (
    event,
    payload: {
      transcript: string
      mode: string
      contextDocs: string
      language: string
      screenshotDataUrl?: string
      userInstruction?: string
    }
  ) => {
    if (!openai) {
      event.sender.send('ai-chunk', { error: 'API key not set' })
      event.sender.send('ai-done')
      return
    }

    try {
      const systemPrompt = getSystemPrompt(
        payload.mode,
        payload.language || 'en'
      )

      const contextBlock = payload.contextDocs
        ? `\n\n--- CONTEXT DOCUMENTS ---\n${payload.contextDocs}\n--- END CONTEXT ---`
        : ''

      const config = getProviderConfig()
      const model = payload.screenshotDataUrl
        ? config.visionModel
        : config.chatModel

      const messages: any[] = [
        { role: 'system', content: systemPrompt + contextBlock },
      ]

      if (payload.screenshotDataUrl) {
        const transcriptBlock = payload.transcript
          ? `\n\nConversation/notes transcript:\n${payload.transcript}`
          : ''

        messages.push({
          role: 'user',
          content: [
            {
              type: 'text',
              text: `${payload.userInstruction || 'Look at my screen carefully. Read everything visible. If there are questions, answer ALL of them. If there is code, analyze and help. If there is a problem, solve it completely.'}${transcriptBlock}`,
            },
            {
              type: 'image_url',
              image_url: {
                url: payload.screenshotDataUrl,
                detail: 'high',
              },
            },
          ],
        })
      } else {
        messages.push({
          role: 'user',
          content: `Live conversation transcript:\n\n${payload.transcript || '(no transcript yet)'}\n\n${payload.userInstruction || 'Based on the conversation above, provide the best response I should give next.'}`,
        })
      }

      const stream = await openai.chat.completions.create({
        model,
        messages,
        stream: true,
        temperature: 0.7,
        max_tokens: 4096,
      })

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content
        if (content) {
          event.sender.send('ai-chunk', { text: content })
        }
      }

      event.sender.send('ai-done')
    } catch (e: any) {
      console.error('AI error:', e.message)
      event.sender.send('ai-chunk', { error: e.message })
      event.sender.send('ai-done')
    }
  }
)
// ── IPC: Get system audio source ───────────────────────
ipcMain.handle('get-desktop-audio-source', async () => {
  try {
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: 1, height: 1 },
    })
    if (sources.length > 0) {
      return { sourceId: sources[0].id }
    }
    return { error: 'No source found' }
  } catch (e: any) {
    return { error: e.message }
  }
})
// ── IPC: Screen capture ────────────────────────────────
ipcMain.handle('capture-screen', async () => {
  try {
    const wasVisible = mainWindow?.isVisible()
    mainWindow?.hide()
    await new Promise((r) => setTimeout(r, 150))

    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: 1920, height: 1080 },
    })

    if (wasVisible) {
      mainWindow?.show()
      mainWindow?.setAlwaysOnTop(true, 'screen-saver', 1)
    }

    if (sources.length > 0) {
      return { dataUrl: sources[0].thumbnail.toDataURL() }
    }
    return { error: 'No screen source found' }
  } catch (e: any) {
    mainWindow?.show()
    return { error: e.message }
  }
})

// ── IPC: Clipboard ─────────────────────────────────────
ipcMain.handle('copy-to-clipboard', (_event, text: string) => {
  clipboard.writeText(text)
  return true
})

// ── IPC: Settings ──────────────────────────────────────
ipcMain.handle('load-settings', () => loadSettings())

ipcMain.handle('save-settings', (_event, newSettings: Partial<Settings>) => {
  const current = loadSettings()
  const merged = { ...current, ...newSettings }
  saveSettings(merged)
  if (newSettings.apiKey !== undefined || newSettings.provider !== undefined) {
    initAI(merged.apiKey, merged.provider)
  }
  return merged
})

// ── IPC: Install update ────────────────────────────────
ipcMain.on('install-update', () => {
  if (autoUpdater) autoUpdater.quitAndInstall(false, true)
})

// ── App Lifecycle ──────────────────────────────────────
app.whenReady().then(() => {
  createWindow()
  createTray()
  registerShortcuts()

  // ── Auto-Update (only in production) ─────────────
  if (!process.env.VITE_DEV_SERVER_URL && autoUpdater) {
    autoUpdater.autoDownload = true
    autoUpdater.autoInstallOnAppQuit = true

    autoUpdater.on('checking-for-update', () => {
      console.log('Checking for updates...')
    })

    autoUpdater.on('update-available', (info: any) => {
      console.log('Update available:', info.version)
      mainWindow?.webContents.send('update-available', info.version)
    })

    autoUpdater.on('update-not-available', () => {
      console.log('App is up to date')
    })

    autoUpdater.on('download-progress', (progress: any) => {
      mainWindow?.webContents.send(
        'update-progress',
        Math.round(progress.percent)
      )
    })

    autoUpdater.on('update-downloaded', (info: any) => {
      console.log('Update downloaded:', info.version)
      mainWindow?.webContents.send('update-downloaded', info.version)
    })

    autoUpdater.on('error', (err: any) => {
      console.log('Auto-updater error:', err.message)
    })

    // Check for updates 3 seconds after launch
    setTimeout(() => {
      autoUpdater.checkForUpdatesAndNotify().catch(() => {})
    }, 3000)
  }
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

app.on('window-all-closed', () => {
  app.quit()
})