import { useState } from 'react'
import { CheckCircle, XCircle, Download, Clock, Trash2 } from 'lucide-react'
import type { BuildHistoryEntry } from '../types'

interface Props {
  history: BuildHistoryEntry[]
  onClear: () => void
}

export default function BuildHistory({ history, onClear }: Props) {
  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-2 text-slate-700 py-16">
        <Clock className="w-10 h-10 opacity-30" />
        <p className="text-sm text-slate-600">No builds yet</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800">
        <span className="text-xs text-slate-500">{history.length} build{history.length !== 1 ? 's' : ''}</span>
        <button
          onClick={onClear}
          className="flex items-center gap-1 text-xs text-slate-600 hover:text-red-400 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear
        </button>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
        {[...history].reverse().map((entry) => (
          <HistoryRow key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  )
}

function HistoryRow({ entry }: { entry: BuildHistoryEntry }) {
  const [saving, setSaving] = useState<string | null>(null)

  const ts = new Date(entry.timestamp)
  const dateStr = ts.toLocaleDateString([], { month: 'short', day: 'numeric' })
  const timeStr = ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const durationStr =
    entry.duration < 60000
      ? `${Math.round(entry.duration / 1000)}s`
      : `${Math.round(entry.duration / 60000)}m`

  const handleSave = async (srcPath: string, type: string) => {
    setSaving(type)
    const ext = type === 'exe' ? 'exe' : 'apk'
    const name = `${entry.appName}.${ext}`
    await window.api.saveFile(srcPath, name)
    setSaving(null)
  }

  return (
    <div className="px-4 py-3 hover:bg-slate-800/30 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {entry.status === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">{entry.appName}</p>
            <p className="text-xs text-slate-600 truncate">
              {entry.target.toUpperCase()} · {durationStr}
            </p>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xs text-slate-500">{timeStr}</p>
          <p className="text-xs text-slate-700">{dateStr}</p>
        </div>
      </div>

      {entry.status === 'failed' && entry.error && (
        <p className="mt-1.5 text-xs text-red-400 line-clamp-2">{entry.error}</p>
      )}

      {entry.status === 'success' && entry.outputPaths && (
        <div className="flex gap-2 mt-2">
          {entry.outputPaths.exe && (
            <button
              onClick={() => handleSave(entry.outputPaths!.exe!, 'exe')}
              disabled={saving === 'exe'}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors disabled:opacity-50"
            >
              <Download className="w-3 h-3" />
              {saving === 'exe' ? 'Saving…' : 'EXE'}
            </button>
          )}
          {entry.outputPaths.apk && (
            <button
              onClick={() => handleSave(entry.outputPaths!.apk!, 'apk')}
              disabled={saving === 'apk'}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors disabled:opacity-50"
            >
              <Download className="w-3 h-3" />
              {saving === 'apk' ? 'Saving…' : 'APK'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
