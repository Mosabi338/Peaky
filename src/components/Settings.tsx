import { useState, useEffect } from 'react'
import { useStore } from '../store'
import { Save, Eye, EyeOff, Shield, Globe, Clipboard } from 'lucide-react'

const PROVIDER_INFO = {
  groq: {
    label: '⚡ Groq (FREE)',
    placeholder: 'gsk_...',
    signupUrl: 'https://console.groq.com',
    description: 'Free • Llama 3.3 70B • Whisper • Screen reading (experimental)',
  },
  openai: {
    label: '🧠 OpenAI (Paid)',
    placeholder: 'sk-...',
    signupUrl: 'https://platform.openai.com/api-keys',
    description: 'GPT-4o • Best screen reading & vision • Whisper • Requires billing',
  },
}

const LANGUAGES = [
  { code: 'en', name: '🇬🇧 English' },
  { code: 'es', name: '🇪🇸 Español (Spanish)' },
  { code: 'fr', name: '🇫🇷 Français (French)' },
  { code: 'de', name: '🇩🇪 Deutsch (German)' },
  { code: 'pt', name: '🇧🇷 Português (Portuguese)' },
  { code: 'zh', name: '🇨🇳 中文 (Chinese)' },
  { code: 'ja', name: '🇯🇵 日本語 (Japanese)' },
  { code: 'ko', name: '🇰🇷 한국어 (Korean)' },
  { code: 'ar', name: '🇸🇦 العربية (Arabic)' },
  { code: 'hi', name: '🇮🇳 हिन्दी (Hindi)' },
  { code: 'ru', name: '🇷🇺 Русский (Russian)' },
  { code: 'it', name: '🇮🇹 Italiano (Italian)' },
  { code: 'nl', name: '🇳🇱 Nederlands (Dutch)' },
  { code: 'tr', name: '🇹🇷 Türkçe (Turkish)' },
  { code: 'pl', name: '🇵🇱 Polski (Polish)' },
  { code: 'sv', name: '🇸🇪 Svenska (Swedish)' },
  { code: 'uk', name: '🇺🇦 Українська (Ukrainian)' },
]

export default function SettingsPanel() {
  const settings = useStore((s) => s.settings)
  const updateSettings = useStore((s) => s.updateSettings)
  const opacity = useStore((s) => s.opacity)
  const setOpacity = useStore((s) => s.setOpacity)

  const [apiKey, setApiKey] = useState('')
  const [provider, setProvider] = useState<'groq' | 'openai'>('groq')
  const [language, setLanguage] = useState('en')
  const [showKey, setShowKey] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    window.ghostkey.loadSettings().then((s: any) => {
      setApiKey(s.apiKey || s.openaiApiKey || '')
      setProvider(s.provider || 'groq')
      setLanguage(s.language || 'en')
    })
  }, [])

  const save = async () => {
    const newSettings = {
      apiKey,
      provider,
      opacity,
      fontSize: settings.fontSize,
      language,
    }
    await window.ghostkey.saveSettings(newSettings)
    updateSettings(newSettings as any)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const currentProvider = PROVIDER_INFO[provider]

  return (
    <div className="h-full overflow-y-auto px-3 py-3 space-y-4">
      {/* Provider */}
      <div>
        <label className="block text-xs text-white/50 mb-1.5">AI Provider</label>
        <div className="space-y-1.5">
          {(Object.keys(PROVIDER_INFO) as Array<'groq' | 'openai'>).map((key) => {
            const info = PROVIDER_INFO[key]
            const isSelected = provider === key
            return (
              <button
                key={key}
                onClick={() => setProvider(key)}
                className={`w-full text-left px-3 py-2 rounded-lg border transition-all ${
                  isSelected
                    ? 'border-ghost-500 bg-ghost-500/10 text-white'
                    : 'border-white/5 bg-white/5 text-white/40 hover:border-white/20 hover:text-white/60'
                }`}
              >
                <div className="text-xs font-medium">{info.label}</div>
                <div className="text-[10px] mt-0.5 opacity-60">{info.description}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* API Key */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs text-white/50">API Key</label>
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); window.open(currentProvider.signupUrl, '_blank') }}
            className="text-[10px] text-ghost-500 hover:text-ghost-400"
          >
            Get key →
          </a>
        </div>
        <div className="relative">
          <input
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={currentProvider.placeholder}
            className="w-full bg-ghost-900 text-white text-xs rounded-md px-2 py-2 pr-8 border border-white/10 outline-none focus:border-ghost-500 placeholder:text-white/20 font-mono"
          />
          <button onClick={() => setShowKey(!showKey)} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
            {showKey ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
        </div>
      </div>

      {/* Language */}
      <div>
        <label className="flex items-center gap-1.5 text-xs text-white/50 mb-1.5">
          <Globe size={12} />
          Language
        </label>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="w-full bg-ghost-900 text-white text-xs rounded-md px-2 py-2 border border-white/10 outline-none focus:border-ghost-500 cursor-pointer"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>{lang.name}</option>
          ))}
        </select>
        <p className="text-[10px] text-white/20 mt-1">
          AI will respond in this language. Audio transcription will also use this language.
        </p>
      </div>

      {/* Opacity */}
      <div>
        <label className="block text-xs text-white/50 mb-1.5">Opacity: {opacity}%</label>
        <input type="range" min={30} max={100} value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} className="w-full accent-ghost-500" />
      </div>

      {/* Font Size */}
      <div>
        <label className="block text-xs text-white/50 mb-1.5">Response Font Size: {settings.fontSize}px</label>
        <input type="range" min={10} max={24} value={settings.fontSize} onChange={(e) => updateSettings({ fontSize: Number(e.target.value) })} className="w-full accent-ghost-500" />
      </div>

      {/* Save */}
      <button
        onClick={save}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-ghost-500 text-white text-xs font-medium hover:bg-ghost-600 transition-colors"
      >
        <Save size={13} />
        {saved ? '✓ Saved!' : 'Save Settings'}
      </button>

      {/* Stealth Info */}
      <div className="mt-4 pt-4 border-t border-white/5">
        <div className="flex items-center gap-1.5 mb-2">
          <Shield size={12} className="text-green-400" />
          <p className="text-xs text-green-400/80 font-medium">Stealth Protection Active</p>
        </div>
        <div className="space-y-1 text-[10px] text-white/25">
          <p>✅ Invisible to screen sharing & recording</p>
          <p>✅ Hidden from Alt+Tab & window picker</p>
          <p>✅ No taskbar icon • No window title</p>
          <p>✅ Panic hide: Ctrl+Shift+P</p>
        </div>
      </div>

      {/* Shortcuts */}
      <div className="mt-4 pt-4 border-t border-white/5">
        <p className="text-xs text-white/30 mb-2 font-medium">Keyboard Shortcuts</p>
        <div className="space-y-1.5 text-[11px]">
          {[
            ['Ctrl+Shift+G', 'Show / Hide'],
            ['Ctrl+Shift+P', '🚨 PANIC hide'],
            ['Ctrl+Shift+T', 'Click-through toggle'],
            ['Ctrl+Shift+R', 'Start / Stop recording'],
            ['Ctrl+Shift+A', 'Generate / Solve'],
            ['Ctrl+Shift+S', 'Screenshot + AI'],
            ['Ctrl+Shift+X', 'Clear everything'],
          ].map(([key, desc]) => (
            <div key={key} className="flex justify-between">
              <kbd className="px-1.5 py-0.5 rounded bg-white/5 text-white/40 font-mono text-[10px]">{key}</kbd>
              <span className="text-white/25">{desc}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-white/5 text-center">
        <p className="text-[10px] text-white/15">GhostKey v2.1.0</p>
      </div>
    </div>
  )
}