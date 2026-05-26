import { useState, useEffect, useRef, useCallback } from 'react'
import { Shield, FolderOpen, X, ChevronDown, ChevronRight, CheckCircle2, AlertCircle, Loader2, ExternalLink } from 'lucide-react'

const TIMESTAMP_SERVERS = [
  { label: 'DigiCert (recommended)', url: 'http://timestamp.digicert.com' },
  { label: 'Sectigo',                url: 'http://timestamp.sectigo.com' },
  { label: 'GlobalSign',             url: 'http://timestamp.globalsign.com/scripts/timstamp.dll' },
  { label: 'Comodo',                 url: 'http://timestamp.comodoca.com' }
]

interface SignResult {
  success: boolean
  error?: string
}

interface Props {
  outputPaths: { exe?: string; apk?: string } | null
  autoSign: boolean
  onAutoSignChange: (v: boolean) => void
}

export default function SigningConfig({ outputPaths, autoSign, onAutoSignChange }: Props) {
  const [open, setOpen]         = useState(false)
  const [certPath, setCertPath] = useState(() => localStorage.getItem('cf-cert-path') ?? '')
  const [password, setPassword] = useState('')
  const [tsServer, setTsServer] = useState(() => localStorage.getItem('cf-ts-server') ?? TIMESTAMP_SERVERS[0].url)
  const [signtoolPath, setSigntoolPath] = useState<string | null>(null)
  const [checkingTool, setCheckingTool] = useState(false)
  const [isSigning, setIsSigning]       = useState(false)
  const [result, setResult]             = useState<SignResult | null>(null)
  const cleanupRef = useRef<(() => void)[]>([])

  // Find signtool on mount
  useEffect(() => {
    setCheckingTool(true)
    window.api.findSigntool().then((p) => {
      setSigntoolPath(p)
      setCheckingTool(false)
    })
  }, [])

  // Persist cert path and timestamp server
  useEffect(() => { localStorage.setItem('cf-cert-path', certPath) }, [certPath])
  useEffect(() => { localStorage.setItem('cf-ts-server', tsServer) }, [tsServer])

  // Auto-sign when new build output arrives
  const prevOutputRef = useRef<typeof outputPaths>(null)
  useEffect(() => {
    if (
      autoSign &&
      outputPaths &&
      outputPaths !== prevOutputRef.current &&
      certPath &&
      password &&
      signtoolPath
    ) {
      triggerSign(outputPaths)
    }
    prevOutputRef.current = outputPaths
  }, [outputPaths])

  const triggerSign = useCallback((paths: typeof outputPaths) => {
    if (!paths || !certPath || !password || !signtoolPath) return
    const filePaths = [paths.exe, paths.apk].filter((p): p is string => !!p && p.endsWith('.exe'))
    if (filePaths.length === 0) return

    setIsSigning(true)
    setResult(null)

    cleanupRef.current.forEach((fn) => fn())
    cleanupRef.current = []

    const removeComplete = window.api.onSignComplete((r) => {
      setIsSigning(false)
      setResult(r)
      cleanupRef.current.forEach((fn) => fn())
      cleanupRef.current = []
    })

    cleanupRef.current = [removeComplete]
    window.api.signExe({ filePaths, certPath, password, tsServer, signtoolPath })
  }, [certPath, password, tsServer, signtoolPath])

  const exeFiles = outputPaths
    ? [outputPaths.exe].filter((p): p is string => !!p && p.endsWith('.exe'))
    : []

  const canSign = !!certPath && !!password && !!signtoolPath && exeFiles.length > 0 && !isSigning

  return (
    <div className="border-t border-slate-800">
      {/* Collapsible header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-violet-400" />
          <span className="text-sm font-semibold text-slate-300">Code Signing</span>
          {result?.success && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
          {result && !result.success && <AlertCircle className="w-3.5 h-3.5 text-red-400" />}
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
      </button>

      {open && (
        <div className="px-4 pb-4 flex flex-col gap-3">

          {/* signtool status */}
          <div className="flex items-center gap-2 text-xs">
            {checkingTool ? (
              <><Loader2 className="w-3 h-3 animate-spin text-slate-500" /><span className="text-slate-500">Locating signtool…</span></>
            ) : signtoolPath ? (
              <><CheckCircle2 className="w-3 h-3 text-emerald-400" /><span className="text-slate-400 truncate font-mono">{signtoolPath.split('\\').slice(-3).join('\\')}</span></>
            ) : (
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="w-3 h-3 text-amber-400 flex-shrink-0" />
                  <span className="text-amber-300">signtool.exe not found</span>
                </div>
                <a
                  href="https://developer.microsoft.com/en-us/windows/downloads/windows-sdk/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-violet-400 hover:text-violet-300 transition-colors"
                  onClick={(e) => { e.preventDefault(); window.open('https://developer.microsoft.com/en-us/windows/downloads/windows-sdk/') }}
                >
                  <ExternalLink className="w-3 h-3" />
                  Download Windows SDK
                </a>
              </div>
            )}
          </div>

          {/* Certificate picker */}
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-slate-500 uppercase tracking-wider">Certificate (.pfx)</span>
            {certPath ? (
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-md">
                <Shield className="w-4 h-4 text-violet-400 flex-shrink-0" />
                <span className="text-xs text-slate-300 flex-1 truncate">{certPath.split(/[\\/]/).pop()}</span>
                <button
                  onClick={() => setCertPath('')}
                  className="text-slate-500 hover:text-red-400 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={async () => {
                  const p = await window.api.pickCert()
                  if (p) setCertPath(p)
                }}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800 border border-dashed border-slate-600 rounded-md text-xs text-slate-500 hover:border-violet-500 hover:text-slate-300 transition-colors"
              >
                <FolderOpen className="w-4 h-4" />
                Browse for .pfx file…
              </button>
            )}
          </label>

          {/* Password */}
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-slate-500 uppercase tracking-wider">Certificate Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Not stored between sessions"
              className="bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-colors"
            />
          </label>

          {/* Timestamp server */}
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-slate-500 uppercase tracking-wider">Timestamp Server</span>
            <select
              value={tsServer}
              onChange={(e) => setTsServer(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-violet-500 transition-colors appearance-none cursor-pointer"
            >
              {TIMESTAMP_SERVERS.map((s) => (
                <option key={s.url} value={s.url}>{s.label}</option>
              ))}
            </select>
          </label>

          {/* Auto-sign toggle */}
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={autoSign}
              onChange={(e) => onAutoSignChange(e.target.checked)}
              className="accent-violet-500 w-4 h-4"
            />
            <span className="text-xs text-slate-400">Auto-sign EXE after every build</span>
          </label>

          {/* Result */}
          {result && (
            result.success ? (
              <div className="flex items-center gap-2 p-2 bg-emerald-950/40 border border-emerald-700/40 rounded-md text-xs text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                EXE signed successfully
              </div>
            ) : (
              <div className="flex items-start gap-2 p-2 bg-red-950/40 border border-red-700/40 rounded-md text-xs text-red-300">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span className="break-all">{result.error}</span>
              </div>
            )
          )}

          {/* Sign Now button */}
          <button
            onClick={() => triggerSign(outputPaths)}
            disabled={!canSign}
            className="flex items-center justify-center gap-2 py-2 rounded-md text-sm font-semibold transition-all disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed bg-violet-700 hover:bg-violet-600 text-white"
          >
            {isSigning ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Signing…</>
            ) : (
              <><Shield className="w-4 h-4" />Sign Now</>
            )}
          </button>
          {!outputPaths && (
            <p className="text-[11px] text-slate-600 text-center">Build an EXE first to enable signing.</p>
          )}
        </div>
      )}
    </div>
  )
}
