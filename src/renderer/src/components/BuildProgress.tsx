import { useEffect, useRef } from 'react'
import type { LogEntry } from '../types'

interface Props {
  logs: LogEntry[]
  isBuilding: boolean
}

export default function BuildProgress({ logs, isBuilding }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Status bar */}
      <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs text-slate-500">
        {isBuilding ? (
          <>
            <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-amber-400">Building…</span>
          </>
        ) : logs.length > 0 ? (
          <>
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                logs.some((l) => l.type === 'error') ? 'bg-red-500' : 'bg-emerald-500'
              }`}
            />
            <span
              className={
                logs.some((l) => l.type === 'error') ? 'text-red-400' : 'text-emerald-400'
              }
            >
              {logs.some((l) => l.type === 'error') ? 'Build failed' : 'Build complete'}
            </span>
          </>
        ) : (
          <>
            <span className="inline-block w-2 h-2 rounded-full bg-slate-700" />
            <span>Waiting for build…</span>
          </>
        )}
      </div>

      {/* Log output */}
      <div className="flex-1 overflow-y-auto p-4 font-mono text-xs leading-relaxed">
        {logs.length === 0 && !isBuilding && (
          <p className="text-slate-700 italic">No output yet. Hit Build Now to start.</p>
        )}

        {logs.map((entry) => (
          <div key={entry.id} className="flex gap-2 mb-0.5">
            <span className="text-slate-700 flex-shrink-0 select-none">
              {new Date(entry.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}
            </span>
            <span
              className={
                entry.type === 'error'
                  ? 'text-red-400'
                  : entry.type === 'step'
                  ? 'text-violet-400 font-semibold'
                  : entry.type === 'success'
                  ? 'text-emerald-400 font-semibold'
                  : 'text-slate-300'
              }
            >
              {entry.type === 'step' ? '› ' : entry.type === 'error' ? '✗ ' : '  '}
              {entry.message}
            </span>
          </div>
        ))}

        {isBuilding && (
          <div className="flex gap-2 mt-1">
            <span className="text-slate-700">···</span>
            <span className="text-slate-500 animate-pulse">running</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  )
}
