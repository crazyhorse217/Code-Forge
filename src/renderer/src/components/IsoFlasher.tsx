import { useState, useCallback, useEffect, useRef } from 'react'
import { Usb, HardDrive, RefreshCw, FolderOpen, AlertTriangle, Flame, X, CheckCircle2, Loader2 } from 'lucide-react'

interface Drive {
  device: string      // \\.\PhysicalDrive1
  number: number
  description: string // "Kingston DataTraveler 3.0"
  size: number        // bytes
  letters: string     // "E,F" or ""
}

type FlashState = 'idle' | 'flashing' | 'success' | 'error'

interface Progress {
  written: number
  total: number
  speed: number  // bytes/s
  eta: number    // seconds
}

function fmtBytes(b: number): string {
  if (b >= 1e9) return (b / 1e9).toFixed(1) + ' GB'
  if (b >= 1e6) return (b / 1e6).toFixed(1) + ' MB'
  if (b >= 1e3) return (b / 1e3).toFixed(0) + ' KB'
  return b + ' B'
}

function fmtSpeed(bps: number): string {
  return fmtBytes(bps) + '/s'
}

function fmtEta(s: number): string {
  if (!isFinite(s) || s <= 0) return '—'
  if (s >= 3600) return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`
  if (s >= 60) return `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`
  return `${Math.round(s)}s`
}

export default function IsoFlasher() {
  const [isoPath, setIsoPath] = useState<string | null>(null)
  const [isoSize, setIsoSize] = useState<number>(0)
  const [drives, setDrives] = useState<Drive[]>([])
  const [selectedDrive, setSelectedDrive] = useState<Drive | null>(null)
  const [loadingDrives, setLoadingDrives] = useState(false)
  const [flashState, setFlashState] = useState<FlashState>('idle')
  const [progress, setProgress] = useState<Progress>({ written: 0, total: 0, speed: 0, eta: 0 })
  const [error, setError] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)

  const cleanupRef = useRef<(() => void)[]>([])

  // Load drives on mount
  useEffect(() => {
    loadDrives()
  }, [])

  async function loadDrives() {
    setLoadingDrives(true)
    setSelectedDrive(null)
    try {
      const list = await window.api.listDrives()
      setDrives(list)
    } finally {
      setLoadingDrives(false)
    }
  }

  const handlePickIso = useCallback(async () => {
    const result = await window.api.pickIso()
    if (result) {
      setIsoPath(result.path)
      setIsoSize(result.size)
      setFlashState('idle')
      setError(null)
      setConfirmed(false)
    }
  }, [])

  const handleFlash = useCallback(() => {
    if (!isoPath || !selectedDrive) return

    setFlashState('flashing')
    setError(null)
    setProgress({ written: 0, total: isoSize, speed: 0, eta: 0 })

    cleanupRef.current.forEach((fn) => fn())
    cleanupRef.current = []

    const removeProgress = window.api.onFlashProgress((p) => setProgress(p))
    const removeComplete = window.api.onFlashComplete(({ success, error: err }) => {
      if (success) {
        setFlashState('success')
        setProgress((prev) => ({ ...prev, written: prev.total, speed: 0, eta: 0 }))
      } else {
        setFlashState('error')
        setError(err ?? 'Unknown error')
      }
      cleanupRef.current.forEach((fn) => fn())
      cleanupRef.current = []
    })

    cleanupRef.current = [removeProgress, removeComplete]
    window.api.flashIso(isoPath, selectedDrive.device)
  }, [isoPath, selectedDrive, isoSize])

  const handleCancel = useCallback(() => {
    window.api.cancelFlash()
    setFlashState('idle')
    setProgress({ written: 0, total: 0, speed: 0, eta: 0 })
    cleanupRef.current.forEach((fn) => fn())
    cleanupRef.current = []
  }, [])

  const handleReset = useCallback(() => {
    setFlashState('idle')
    setError(null)
    setProgress({ written: 0, total: 0, speed: 0, eta: 0 })
    setConfirmed(false)
  }, [])

  const pct = progress.total > 0 ? (progress.written / progress.total) * 100 : 0
  const isFlashing = flashState === 'flashing'
  const tooSmall = selectedDrive && isoSize > 0 && selectedDrive.size < isoSize

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-xl mx-auto p-6 flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
            <Usb className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">USB ISO Flasher</h2>
            <p className="text-xs text-slate-500">Write an ISO image to a USB drive</p>
          </div>
        </div>

        {/* Step 1 – Select ISO */}
        <div className="flex flex-col gap-3">
          <StepLabel n={1} label="Select ISO image" />

          <button
            onClick={handlePickIso}
            disabled={isFlashing}
            className="flex items-center gap-3 px-4 py-3 bg-slate-800 border border-dashed border-slate-600 rounded-xl hover:border-violet-500 hover:bg-slate-750 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FolderOpen className="w-4 h-4 text-slate-400 flex-shrink-0" />
            {isoPath ? (
              <span className="text-sm text-slate-200 truncate flex-1 text-left">
                {isoPath.split(/[\\/]/).pop()}
              </span>
            ) : (
              <span className="text-sm text-slate-500 flex-1 text-left">
                Click to browse for .iso file…
              </span>
            )}
            {isoPath && (
              <span className="text-xs text-slate-500 flex-shrink-0 font-mono">
                {fmtBytes(isoSize)}
              </span>
            )}
          </button>
        </div>

        {/* Step 2 – Select drive */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <StepLabel n={2} label="Select USB drive" />
            <button
              onClick={loadDrives}
              disabled={isFlashing || loadingDrives}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-40"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingDrives ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {loadingDrives ? (
            <div className="flex items-center gap-2 px-4 py-3 bg-slate-800 rounded-xl text-sm text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Detecting USB drives…
            </div>
          ) : drives.length === 0 ? (
            <div className="px-4 py-3 bg-slate-800 rounded-xl text-sm text-slate-500 border border-slate-700">
              No USB drives detected. Insert a drive and click Refresh.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {drives.map((d) => (
                <label
                  key={d.device}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all ${
                    isFlashing ? 'pointer-events-none opacity-60' : ''
                  } ${
                    selectedDrive?.device === d.device
                      ? 'bg-violet-600/15 border-violet-500/50'
                      : 'bg-slate-800 border-slate-700 hover:border-slate-500'
                  }`}
                >
                  <input
                    type="radio"
                    name="drive"
                    value={d.device}
                    checked={selectedDrive?.device === d.device}
                    onChange={() => { setSelectedDrive(d); setConfirmed(false) }}
                    className="accent-violet-500"
                  />
                  <HardDrive className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 truncate font-medium">
                      {d.description || `USB Drive ${d.number}`}
                    </p>
                    <p className="text-xs text-slate-500">
                      {d.letters ? `${d.letters.split(',').map((l) => `${l}:`).join('  ')}  ·  ` : ''}{fmtBytes(d.size)}
                    </p>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-400 font-mono flex-shrink-0">
                    PhysicalDrive{d.number}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Size warning */}
        {tooSmall && (
          <div className="flex gap-2 p-3 bg-red-950/40 border border-red-700/50 rounded-xl text-xs text-red-300">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
            <span>The ISO ({fmtBytes(isoSize)}) is larger than the selected drive ({fmtBytes(selectedDrive.size)}). Choose a bigger drive.</span>
          </div>
        )}

        {/* Confirm checkbox */}
        {isoPath && selectedDrive && !tooSmall && flashState === 'idle' && (
          <label className="flex items-start gap-3 p-3 bg-amber-950/30 border border-amber-700/40 rounded-xl cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="accent-amber-500 mt-0.5 flex-shrink-0 w-4 h-4"
            />
            <span className="text-xs text-amber-300/90 leading-relaxed">
              <strong className="text-amber-300">I understand</strong> that all data on{' '}
              <strong className="text-amber-300">
                {selectedDrive.letters
                  ? selectedDrive.letters.split(',').map((l) => `${l}:`).join(', ')
                  : `PhysicalDrive${selectedDrive.number}`}
              </strong>{' '}
              will be permanently erased and replaced with the ISO contents.
            </span>
          </label>
        )}

        {/* Flash button */}
        {flashState === 'idle' && (
          <button
            onClick={handleFlash}
            disabled={!isoPath || !selectedDrive || !confirmed || !!tooSmall}
            className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/40"
          >
            <Flame className="w-4 h-4" />
            Flash Now
          </button>
        )}

        {/* Progress */}
        {isFlashing && (
          <div className="flex flex-col gap-3 p-4 bg-slate-800 border border-slate-700 rounded-xl">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-400" />
                Writing…
              </span>
              <span>{pct.toFixed(1)}%</span>
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-600 to-violet-400 rounded-full transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{fmtBytes(progress.written)} / {fmtBytes(progress.total)}</span>
              <span className="flex items-center gap-3">
                <span>{fmtSpeed(progress.speed)}</span>
                <span>ETA {fmtEta(progress.eta)}</span>
              </span>
            </div>

            <button
              onClick={handleCancel}
              className="flex items-center justify-center gap-2 py-2 rounded-lg text-xs text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-700/50 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Cancel
            </button>
          </div>
        )}

        {/* Success */}
        {flashState === 'success' && (
          <div className="flex flex-col gap-3 p-4 bg-emerald-950/40 border border-emerald-700/40 rounded-xl">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-300">Flash complete!</p>
                <p className="text-xs text-emerald-400/70 mt-0.5">
                  {fmtBytes(progress.total)} written successfully. You can safely eject the drive.
                </p>
              </div>
            </div>
            <button
              onClick={handleReset}
              className="py-2 rounded-lg text-xs text-slate-400 hover:text-slate-200 border border-slate-700 transition-colors"
            >
              Flash another
            </button>
          </div>
        )}

        {/* Error */}
        {flashState === 'error' && error && (
          <div className="flex flex-col gap-3 p-4 bg-red-950/40 border border-red-700/40 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-red-300">Flash failed</p>
                {error === 'needs-admin' ? (
                  <p className="text-xs text-red-400/80 mt-1 leading-relaxed">
                    Windows blocked raw disk access. Right-click CodeForge →{' '}
                    <strong className="text-red-300">Run as administrator</strong>, then try again.
                  </p>
                ) : (
                  <p className="text-xs text-red-400/80 mt-1 font-mono break-all">{error}</p>
                )}
              </div>
            </div>
            <button
              onClick={handleReset}
              className="py-2 rounded-lg text-xs text-slate-400 hover:text-slate-200 border border-slate-700 transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        {/* Info footer */}
        <p className="text-[11px] text-slate-600 text-center leading-relaxed">
          Requires administrator privileges to write to raw disk devices on Windows.
        </p>
      </div>
    </div>
  )
}

function StepLabel({ n, label }: { n: number; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-5 h-5 rounded-full bg-violet-600 text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">
        {n}
      </span>
      <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">{label}</span>
    </div>
  )
}
