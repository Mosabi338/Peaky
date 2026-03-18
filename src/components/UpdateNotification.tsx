import { useState, useEffect } from 'react'
import { Download, X, RefreshCw } from 'lucide-react'

export default function UpdateNotification() {
  const [updateState, setUpdateState] = useState<
    'idle' | 'available' | 'downloading' | 'ready'
  >('idle')
  const [version, setVersion] = useState('')
  const [progress, setProgress] = useState(0)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const gk = (window as any).ghostkey
    if (!gk?.onUpdateAvailable) return

    const off1 = gk.onUpdateAvailable((v: string) => {
      setVersion(v)
      setUpdateState('available')
      setDismissed(false)
    })

    const off2 = gk.onUpdateProgress((percent: number) => {
      setUpdateState('downloading')
      setProgress(percent)
    })

    const off3 = gk.onUpdateDownloaded((v: string) => {
      setVersion(v)
      setUpdateState('ready')
      setDismissed(false)
    })

    return () => {
      off1()
      off2()
      off3()
    }
  }, [])

  if (updateState === 'idle' || dismissed) return null

  return (
    <div className="mx-1 mb-1">
      <div className="rounded-lg border border-ghost-500/30 bg-ghost-500/10 px-3 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {updateState === 'downloading' ? (
              <RefreshCw size={13} className="text-ghost-500 animate-spin" />
            ) : (
              <Download size={13} className="text-ghost-500" />
            )}

            <div>
              {updateState === 'available' && (
                <p className="text-xs text-white/80">
                  Update <span className="font-bold text-ghost-500">v{version}</span> is downloading...
                </p>
              )}
              {updateState === 'downloading' && (
                <p className="text-xs text-white/80">
                  Downloading update... {progress}%
                </p>
              )}
              {updateState === 'ready' && (
                <p className="text-xs text-white/80">
                  Update <span className="font-bold text-ghost-500">v{version}</span> ready!
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {updateState === 'ready' && (
              <button
                onClick={() => {
                  const gk = (window as any).ghostkey
                  gk?.installUpdate()
                }}
                className="px-2.5 py-1 rounded-md bg-ghost-500 text-white text-[10px] font-bold hover:bg-ghost-600 transition-colors"
              >
                Restart & Update
              </button>
            )}
            <button
              onClick={() => setDismissed(true)}
              className="text-white/30 hover:text-white/60 transition-colors"
            >
              <X size={12} />
            </button>
          </div>
        </div>

        {updateState === 'downloading' && (
          <div className="mt-1.5 w-full h-1 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-ghost-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  )
}