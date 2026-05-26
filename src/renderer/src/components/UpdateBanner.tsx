import { useState } from 'react'
import { Download, RefreshCw, X } from 'lucide-react'

type UpdateState = 'available' | 'downloaded'

interface Props {
  state: UpdateState
  version?: string
  onInstall: () => void
  onDismiss: () => void
}

export default function UpdateBanner({ state, version, onInstall, onDismiss }: Props) {
  return (
    <div
      className={`flex items-center justify-between px-4 py-2 text-xs ${
        state === 'downloaded'
          ? 'bg-emerald-900/60 border-b border-emerald-700/50 text-emerald-200'
          : 'bg-violet-900/50 border-b border-violet-700/40 text-violet-200'
      }`}
    >
      <div className="flex items-center gap-2">
        {state === 'downloaded' ? (
          <RefreshCw className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
        ) : (
          <Download className="w-3.5 h-3.5 text-violet-400 flex-shrink-0 animate-bounce" />
        )}
        {state === 'available' ? (
          <span>
            <span className="font-medium">Update available</span>
            {version && <span className="text-violet-300/70 ml-1">v{version}</span>}
            <span className="text-violet-300/70 ml-1">— downloading in the background…</span>
          </span>
        ) : (
          <span>
            <span className="font-medium">Update ready!</span>
            <span className="text-emerald-300/80 ml-1">Restart CodeForge to install the latest version.</span>
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0 ml-4">
        {state === 'downloaded' && (
          <button
            onClick={onInstall}
            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-colors font-medium"
          >
            Restart &amp; Install
          </button>
        )}
        <button
          onClick={onDismiss}
          title="Dismiss"
          className="text-current opacity-50 hover:opacity-100 transition-opacity"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// Hook to wire up update events
export function useUpdater() {
  const [updateState, setUpdateState] = useState<UpdateState | null>(null)
  const [updateVersion, setUpdateVersion] = useState<string | undefined>()
  const [dismissed, setDismissed] = useState(false)

  // Called once from App on mount
  function subscribe() {
    const removeAvailable = window.api.onUpdateAvailable(({ version }) => {
      setUpdateVersion(version)
      setUpdateState('available')
      setDismissed(false)
    })
    const removeDownloaded = window.api.onUpdateDownloaded(() => {
      setUpdateState('downloaded')
      setDismissed(false)
    })
    return () => { removeAvailable(); removeDownloaded() }
  }

  return {
    showBanner: !dismissed && updateState !== null,
    updateState,
    updateVersion,
    subscribe,
    install: () => window.api.installUpdate(),
    dismiss: () => setDismissed(true)
  }
}
