import { useEffect } from 'react'
import { X } from 'lucide-react'
import { TEMPLATES, type Template } from '../templates'

const LANG_BADGE: Record<Template['language'], string> = {
  html:   'bg-orange-900/50 text-orange-300 border-orange-700/40',
  python: 'bg-blue-900/50   text-blue-300   border-blue-700/40',
  nodejs: 'bg-green-900/50  text-green-300  border-green-700/40'
}

const LANG_LABEL: Record<Template['language'], string> = {
  html:   'HTML / JS',
  python: 'Python',
  nodejs: 'Node.js'
}

interface Props {
  hasFiles: boolean
  onSelect: (files: Record<string, string>) => void
  onClose: () => void
}

export default function TemplateModal({ hasFiles, onSelect, onClose }: Props) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleSelect = (t: Template) => {
    if (hasFiles) {
      const ok = window.confirm(
        `Load "${t.name}" template?\n\nThis will replace your current files.`
      )
      if (!ok) return
    }
    onSelect(t.files)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-100">New from Template</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose a starter project — files will be loaded into the editor.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Template grid */}
        <div className="overflow-y-auto p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => handleSelect(t)}
              className="group text-left bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-violet-500/60 rounded-lg p-4 transition-all"
            >
              {/* Top row */}
              <div className="flex items-start justify-between mb-2">
                <span className="text-3xl leading-none">{t.emoji}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${LANG_BADGE[t.language]}`}
                >
                  {LANG_LABEL[t.language]}
                </span>
              </div>

              {/* Name + description */}
              <h3 className="text-sm font-semibold text-slate-100 group-hover:text-violet-300 transition-colors mb-1">
                {t.name}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">{t.description}</p>

              {/* File list */}
              <div className="flex flex-wrap gap-1">
                {Object.keys(t.files).map((f) => (
                  <span
                    key={f}
                    className="text-[10px] bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded font-mono"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
