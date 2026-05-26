import { useState, useCallback, useRef } from 'react'
import { Github, Upload, CheckCircle2, AlertCircle, Loader2, ExternalLink, Eye, EyeOff } from 'lucide-react'
import type { BuildConfig } from '../types'

interface Props {
  outputPaths: { exe?: string; apk?: string }
  config: BuildConfig
}

type PubState = 'idle' | 'publishing' | 'success' | 'error'

function fmtBytes(b: number) {
  if (b >= 1e9) return (b / 1e9).toFixed(1) + ' GB'
  if (b >= 1e6) return (b / 1e6).toFixed(1) + ' MB'
  return (b / 1e3).toFixed(0) + ' KB'
}

export default function GitHubPublisher({ outputPaths, config }: Props) {
  const [token,       setToken]       = useState(() => localStorage.getItem('cf-gh-token') ?? '')
  const [showToken,   setShowToken]   = useState(false)
  const [repoSlug,    setRepoSlug]    = useState(() => localStorage.getItem('cf-gh-repo') ?? '')
  const [tag,         setTag]         = useState(`v${config.version}`)
  const [title,       setTitle]       = useState(`${config.appName} v${config.version}`)
  const [notes,       setNotes]       = useState('')
  const [prerelease,  setPrerelease]  = useState(false)
  const [pubState,    setPubState]    = useState<PubState>('idle')
  const [step,        setStep]        = useState('')
  const [releaseUrl,  setReleaseUrl]  = useState<string | null>(null)
  const [error,       setError]       = useState<string | null>(null)
  const cleanupRef = useRef<(() => void)[]>([])

  const files = [
    outputPaths.exe && { label: 'EXE (Windows)', path: outputPaths.exe },
    outputPaths.apk && { label: 'APK (Android)', path: outputPaths.apk }
  ].filter(Boolean) as { label: string; path: string }[]

  const handlePublish = useCallback(() => {
    if (!token || !repoSlug || !tag || !title) return

    // Persist non-secret settings
    localStorage.setItem('cf-gh-token', token)
    localStorage.setItem('cf-gh-repo', repoSlug)

    const [owner, repo] = repoSlug.split('/')
    if (!owner || !repo) { setError('Repository must be in owner/repo format'); return }

    setPubState('publishing')
    setError(null)
    setReleaseUrl(null)
    setStep('Connecting to GitHub…')

    cleanupRef.current.forEach((fn) => fn())
    cleanupRef.current = []

    const removeProgress = window.api.onPublishProgress((s) => setStep(s))
    const removeComplete = window.api.onPublishComplete(({ success, url, error: err }) => {
      if (success && url) {
        setPubState('success')
        setReleaseUrl(url)
      } else {
        setPubState('error')
        setError(err ?? 'Unknown error')
      }
      cleanupRef.current.forEach((fn) => fn())
      cleanupRef.current = []
    })

    cleanupRef.current = [removeProgress, removeComplete]

    window.api.publishRelease({
      token,
      owner,
      repo,
      tag,
      title,
      notes,
      prerelease,
      filePaths: files.map((f) => f.path)
    })
  }, [token, repoSlug, tag, title, notes, prerelease, files])

  const isPublishing = pubState === 'publishing'

  return (
    <div className="border-t border-slate-800">
      <div className="flex items-center gap-2 px-4 py-3">
        <Github className="w-4 h-4 text-violet-400" />
        <span className="text-sm font-semibold text-slate-300">Publish to GitHub</span>
      </div>

      <div className="px-4 pb-4 flex flex-col gap-3">

        {/* GitHub Token */}
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-slate-500 uppercase tracking-wider">GitHub Token</span>
          <div className="relative">
            <input
              type={showToken ? 'text' : 'password'}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              disabled={isPublishing}
              className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 pr-9 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-colors font-mono disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowToken((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            >
              {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
          <p className="text-[11px] text-slate-600">
            Needs <code className="text-slate-500">repo</code> scope.{' '}
            <button
              className="text-violet-500 hover:text-violet-400 transition-colors"
              onClick={() => window.open('https://github.com/settings/tokens/new?scopes=repo&description=CodeForge')}
            >
              Generate token →
            </button>
          </p>
        </label>

        {/* Repository */}
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-slate-500 uppercase tracking-wider">Repository</span>
          <input
            type="text"
            value={repoSlug}
            onChange={(e) => setRepoSlug(e.target.value)}
            placeholder="owner/repo-name"
            disabled={isPublishing}
            className="bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-colors disabled:opacity-50 font-mono"
          />
        </label>

        {/* Tag + Title on one row */}
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-slate-500 uppercase tracking-wider">Tag</span>
            <input
              type="text"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="v1.0.0"
              disabled={isPublishing}
              className="bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-colors disabled:opacity-50 font-mono"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-slate-500 uppercase tracking-wider">Title</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Release title"
              disabled={isPublishing}
              className="bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-colors disabled:opacity-50"
            />
          </label>
        </div>

        {/* Release notes */}
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-slate-500 uppercase tracking-wider">Release Notes</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What's new in this release…"
            rows={3}
            disabled={isPublishing}
            className="bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-colors resize-none disabled:opacity-50"
          />
        </label>

        {/* Pre-release toggle */}
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={prerelease}
            onChange={(e) => setPrerelease(e.target.checked)}
            disabled={isPublishing}
            className="accent-violet-500 w-4 h-4"
          />
          <span className="text-xs text-slate-400">Mark as pre-release</span>
        </label>

        {/* Files to upload */}
        {files.length > 0 && (
          <div className="flex flex-col gap-1 p-2.5 bg-slate-800/60 rounded-md">
            <p className="text-[11px] text-slate-500 uppercase tracking-wider mb-1">Files to upload</p>
            {files.map((f) => (
              <div key={f.path} className="flex items-center gap-2 text-xs text-slate-400">
                <Upload className="w-3 h-3 text-slate-500 flex-shrink-0" />
                <span className="flex-1 truncate">{f.path.split(/[\\/]/).pop()}</span>
                <FileSize path={f.path} />
              </div>
            ))}
          </div>
        )}

        {/* Progress */}
        {isPublishing && (
          <div className="flex items-center gap-2 p-2.5 bg-slate-800 border border-slate-700 rounded-md text-xs text-slate-400">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-400 flex-shrink-0" />
            {step}
          </div>
        )}

        {/* Success */}
        {pubState === 'success' && releaseUrl && (
          <div className="flex flex-col gap-2 p-2.5 bg-emerald-950/40 border border-emerald-700/40 rounded-md">
            <div className="flex items-center gap-2 text-xs text-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
              Release published successfully!
            </div>
            <button
              onClick={() => window.open(releaseUrl)}
              className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              View on GitHub
            </button>
          </div>
        )}

        {/* Error */}
        {pubState === 'error' && error && (
          <div className="flex items-start gap-2 p-2.5 bg-red-950/40 border border-red-700/40 rounded-md text-xs text-red-300">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span className="break-all">{error}</span>
          </div>
        )}

        {/* Publish button */}
        {pubState !== 'success' && (
          <button
            onClick={handlePublish}
            disabled={isPublishing || !token || !repoSlug || !tag || !title || files.length === 0}
            className="flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-semibold transition-all disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed bg-violet-600 hover:bg-violet-500 text-white shadow-md shadow-violet-900/40"
          >
            {isPublishing ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Publishing…</>
            ) : (
              <><Github className="w-4 h-4" />Create Release & Upload</>
            )}
          </button>
        )}

        {pubState === 'success' && (
          <button
            onClick={() => { setPubState('idle'); setReleaseUrl(null) }}
            className="py-2 rounded-md text-xs text-slate-400 hover:text-slate-200 border border-slate-700 transition-colors"
          >
            Publish another
          </button>
        )}
      </div>
    </div>
  )
}

/** Async file-size display */
function FileSize({ path: filePath }: { path: string }) {
  const [size, setSize] = useState<string>('…')
  // We compute size via the IPC-available getFileSize, or just show truncated path
  // For simplicity, read it synchronously using a one-off call if available
  useState(() => {
    window.api.getFileSize(filePath).then((b) => {
      if (b !== null) setSize(fmtBytes(b))
    })
  })
  return <span className="text-slate-600 font-mono">{size}</span>
}
