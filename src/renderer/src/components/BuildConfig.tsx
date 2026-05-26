import { Hammer, AlertTriangle, ImageIcon, X } from 'lucide-react'
import type { BuildConfig, ToolStatus } from '../types'

interface Props {
  config: BuildConfig
  onChange: (c: BuildConfig) => void
  onBuild: () => void
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

export default function BuildConfigPanel({ config, onChange, onBuild, isBuilding, tools }: Props) {
  const set = <K extends keyof BuildConfig>(key: K, value: BuildConfig[K]) =>
    onChange({ ...config, [key]: value })

  const needsAndroid = config.target === 'apk' || config.target === 'both'
  const androidMissing = needsAndroid && tools && (!tools.java || !tools.androidSdk)

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

      {/* Android warning */}
      {androidMissing && (
        <div className="flex gap-2 p-3 bg-amber-950/40 border border-amber-800/60 rounded-md text-xs text-amber-300">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-1">Android SDK required</p>
            <p className="text-amber-400/70">
              Install Android Studio and JDK 17+, then set the{' '}
              <code className="text-amber-300">ANDROID_HOME</code> env var and restart CodeForge.
            </p>
          </div>
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
            : 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-900/40 hover:shadow-violet-800/50'
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
