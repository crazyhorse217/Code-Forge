import { Hammer, AlertTriangle, ImageIcon, X, Download, CheckCircle, RefreshCw, ExternalLink } from 'lucide-react'
import type { BuildConfig, ToolStatus } from '../types'

interface Props {
  config: BuildConfig
  onChange: (c: BuildConfig) => void
  onBuild: () => void
  onRefreshTools: () => void
  isBuilding: boolean
  tools: ToolStatus | null
}

const LANGUAGES = [
  { value: 'auto', label: 'Auto-detect' },
  { value: 'html', label: 'HTML / CSS / JS' },
  { value: 'python', label: 'Python' },
  { value: 'nodejs', label: 'Node.js / TypeScript' },
  { value: 'react-native', label: 'React Native' }
]

export default function BuildConfigPanel({ config, onChange, onBuild, onRefreshTools, isBuilding, tools }: Props) {
  const set = <K extends keyof BuildConfig>(key: K, value: BuildConfig[K]) =>
    onChange({ ...config, [key]: value })

  const needsAndroid = config.target === 'apk' || config.target === 'both'
  const androidReady = !!(tools?.java && tools?.androidSdk)
  const androidMissing = needsAndroid && tools && !androidReady

  return (
    <div className="flex flex-col gap-4 p-4">
      <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-widest">
        Build Config
      </h2>

      {/* App name */}
      <label className="flex flex-col gap-1.5">
        <span className="text-xs text-slate-500 uppercase tracking-wider">App Name</span>
        <input
          type="text"
          value={config.appName}
          onChange={(e) => set('appName', e.target.value)}
          placeholder="MyApp"
          className="bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-colors"
        />
      </label>

      {/* Version */}
      <label className="flex flex-col gap-1.5">
        <span className="text-xs text-slate-500 uppercase tracking-wider">Version</span>
        <input
          type="text"
          value={config.version}
          onChange={(e) => set('version', e.target.value)}
          placeholder="1.0.0"
          className="bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-colors"
        />
      </label>

      {/* Language */}
      <label className="flex flex-col gap-1.5">
        <span className="text-xs text-slate-500 uppercase tracking-wider">Source Language</span>
        <select
          value={config.language}
          onChange={(e) => set('language', e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-violet-500 transition-colors appearance-none cursor-pointer"
        >
          {LANGUAGES.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>
      </label>

      {/* Output target */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-slate-500 uppercase tracking-wider">Output Target</span>
        <div className="grid grid-cols-3 gap-1.5">
          {(['exe', 'apk', 'both'] as const).map((t) => (
            <button
              key={t}
              onClick={() => set('target', t)}
              className={`py-2 text-xs font-medium rounded-md border transition-colors ${
                config.target === t
                  ? 'bg-violet-600 border-violet-500 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
              }`}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Android setup card */}
      {androidMissing && (
        <div className="flex flex-col gap-2 p-3 bg-amber-950/30 border border-amber-800/50 rounded-md text-xs">
          <div className="flex items-center gap-2 text-amber-300 font-semibold">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            Android build tools required
          </div>

          {/* Status rows */}
          <div className="flex flex-col gap-1 pl-1">
            <StatusRow ok={!!tools?.java}       label={tools?.java ? `Java — ${tools.java.split('\n')[0]}` : 'Java (JDK 17+) — not found'} />
            <StatusRow ok={!!tools?.androidSdk} label={tools?.androidSdk ? `Android SDK — ${tools.androidSdk}` : 'Android SDK — not found'} />
            <StatusRow ok={!!tools?.androidStudioPath} label={tools?.androidStudioPath ? `Android Studio — installed` : 'Android Studio — not installed'} />
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-1.5 mt-1">
            {!tools?.androidStudioPath && (
              <button
                onClick={() => window.api.openUrl('https://developer.android.com/studio')}
                className="flex items-center gap-2 px-3 py-2 bg-amber-600 hover:bg-amber-500 text-black font-semibold rounded transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Download Android Studio
                <ExternalLink className="w-3 h-3 ml-auto opacity-70" />
              </button>
            )}
            {!tools?.java && (
              <button
                onClick={() => window.api.openUrl('https://adoptium.net/temurin/releases/?version=17')}
                className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Download JDK 17
                <ExternalLink className="w-3 h-3 ml-auto opacity-70" />
              </button>
            )}
            <button
              onClick={onRefreshTools}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Re-check tools after installing
            </button>
          </div>

          <p className="text-amber-400/60 leading-relaxed">
            After installing Android Studio, open it once to finish SDK setup, then click Re-check above.
            CodeForge finds the SDK automatically — no env vars needed.
          </p>
        </div>
      )}

      {/* App icon */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-slate-500 uppercase tracking-wider">App Icon</span>
        {config.iconPath ? (
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-md">
            <ImageIcon className="w-4 h-4 text-violet-400 flex-shrink-0" />
            <span className="text-xs text-slate-300 flex-1 truncate">
              {config.iconPath.split(/[\\/]/).pop()}
            </span>
            <button
              onClick={() => set('iconPath', undefined)}
              className="text-slate-500 hover:text-red-400 transition-colors flex-shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={async () => {
              const p = await window.api.pickIcon()
              if (p) set('iconPath', p)
            }}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 border border-dashed border-slate-600 rounded-md text-xs text-slate-500 hover:border-violet-500 hover:text-slate-300 transition-colors"
          >
            <ImageIcon className="w-4 h-4" />
            Pick icon (PNG / ICO)…
          </button>
        )}
      </div>

      {/* Build capabilities */}
      {tools && (
        <div className="flex flex-col gap-1 p-3 bg-slate-800/50 rounded-md text-xs text-slate-500">
          <p className="text-slate-400 font-medium mb-1">Available builders</p>
          <CapRow ok={!!tools.node} label="Web → EXE (Electron)" />
          <CapRow ok={!!tools.python} label="Python → EXE (PyInstaller)" />
          <CapRow ok={!!tools.node} label="Node.js → EXE (pkg)" />
          <CapRow ok={!!tools.java && !!tools.androidSdk} label="Web → APK (Capacitor)" />
        </div>
      )}

      {/* Build button */}
      <button
        onClick={onBuild}
        disabled={isBuilding}
        className={`flex items-center justify-center gap-2 py-3 rounded-md font-semibold text-sm transition-all ${
          isBuilding
            ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
            : 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-900/40 hover:shadow-violet-800/50 cf-glow'
        }`}
      >
        {isBuilding ? (
          <>
            <span className="animate-spin">⟳</span>
            Building…
          </>
        ) : (
          <>
            <Hammer className="w-4 h-4" />
            Build Now
          </>
        )}
      </button>
    </div>
  )
}

function CapRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-2 ${ok ? 'text-slate-400' : 'text-slate-600'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-emerald-500' : 'bg-slate-600'}`} />
      {label}
    </div>
  )
}

function StatusRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-1.5 ${ok ? 'text-emerald-400' : 'text-amber-400/70'}`}>
      {ok
        ? <CheckCircle className="w-3 h-3 flex-shrink-0" />
        : <AlertTriangle className="w-3 h-3 flex-shrink-0" />
      }
      <span className="truncate">{label}</span>
    </div>
  )
}
