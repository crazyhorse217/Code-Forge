import { useState, useCallback, useRef } from 'react'
import Editor from '@monaco-editor/react'
import { Plus, X, Upload, FileCode, Archive, Check, FolderOpen, FileUp, Trash2 } from 'lucide-react'

interface Props {
  files: Record<string, string>
  onFilesChange: (files: Record<string, string>) => void
  monacoTheme?: string
}

const EXT_LANG: Record<string, string> = {
  html: 'html', htm: 'html', css: 'css',
  js: 'javascript', jsx: 'javascript',
  ts: 'typescript', tsx: 'typescript',
  py: 'python', json: 'json', md: 'markdown',
  xml: 'xml', sh: 'shell', yaml: 'yaml', yml: 'yaml', txt: 'plaintext'
}

function getLang(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  return EXT_LANG[ext] ?? 'plaintext'
}

export default function CodeEditor({ files, onFilesChange, monacoTheme = 'vs-dark' }: Props) {
  const [activeFile, setActiveFile] = useState<string>('')
  const [naming, setNaming]         = useState(false)
  const [newName, setNewName]       = useState('')
  const [importing, setImporting]   = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)

  const fileNames  = Object.keys(files)
  const currentFile = fileNames.includes(activeFile) ? activeFile : fileNames[0] ?? ''

  const setContent = (value: string | undefined) => {
    if (!currentFile) return
    onFilesChange({ ...files, [currentFile]: value ?? '' })
  }

  const startNaming = () => {
    setNewName('')
    setNaming(true)
    setTimeout(() => nameInputRef.current?.focus(), 50)
  }

  const commitNewFile = () => {
    const name = newName.trim()
    setNaming(false)
    setNewName('')
    if (!name || files[name] !== undefined) return
    onFilesChange({ ...files, [name]: '' })
    setActiveFile(name)
  }

  const cancelNaming = () => { setNaming(false); setNewName('') }

  const clearAll = () => {
    if (!confirmClear) { setConfirmClear(true); setTimeout(() => setConfirmClear(false), 3000); return }
    onFilesChange({})
    setActiveFile('')
    setConfirmClear(false)
  }

  const deleteFile = (name: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const next = { ...files }
    delete next[name]
    onFilesChange(next)
    if (activeFile === name) setActiveFile(Object.keys(next)[0] ?? '')
  }

  // ── Native file-dialog imports (reliable in packaged app) ─────────────────
  const handleImportZip = useCallback(async () => {
    setImporting(true)
    try {
      const zipPath = await window.api.pickZip()
      if (!zipPath) return
      const extracted = await window.api.extractZip(zipPath)
      if (Object.keys(extracted).length === 0) return
      const next = { ...files, ...extracted }
      onFilesChange(next)
      setActiveFile(Object.keys(extracted)[0])
    } finally {
      setImporting(false)
    }
  }, [files, onFilesChange])

  const handleImportFiles = useCallback(async () => {
    setImporting(true)
    try {
      const imported = await window.api.pickSourceFiles()
      if (imported.length === 0) return
      const next = { ...files }
      for (const { name, content } of imported) next[name] = content
      onFilesChange(next)
      setActiveFile(imported[0].name)
    } finally {
      setImporting(false)
    }
  }, [files, onFilesChange])

  // ── Drag-and-drop (with path fallback for packaged app) ───────────────────
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    const dropped = Array.from(e.dataTransfer.files)
    const next = { ...files }
    let firstNew = ''

    for (const file of dropped) {
      if (file.name.endsWith('.zip')) {
        // Try path-based extraction first (works in dev), fallback to buffer (works in packaged)
        const zipPath = (file as File & { path?: string }).path
        let extracted: Record<string, string> = {}
        if (zipPath) {
          extracted = await window.api.extractZip(zipPath)
        } else {
          const buf = await file.arrayBuffer()
          extracted = await window.api.extractZipBuffer(buf)
        }
        for (const [name, content] of Object.entries(extracted)) {
          next[name] = content
          if (!firstNew) firstNew = name
        }
        continue
      }

      // Regular text file — read in renderer
      const content: string = await new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = (ev) => resolve((ev.target?.result as string) ?? '')
        reader.readAsText(file)
      })
      next[file.name] = content
      if (!firstNew) firstNew = file.name
    }

    onFilesChange(next)
    if (firstNew) setActiveFile(firstNew)
  }, [files, onFilesChange])

  return (
    <div
      className="flex flex-col h-full"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      {/* ── Tab bar ── */}
      <div className="flex items-center gap-0.5 px-2 py-1 bg-slate-950 border-b border-slate-800 overflow-x-auto min-h-[36px]">
        {fileNames.map((name) => (
          <button
            key={name}
            onClick={() => setActiveFile(name)}
            className={`group flex items-center gap-1.5 px-3 py-1 text-xs rounded-sm whitespace-nowrap transition-colors ${
              name === currentFile
                ? 'bg-slate-700 text-white'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
            }`}
          >
            <FileCode className="w-3 h-3 flex-shrink-0" />
            {name}
            <span
              onClick={(e) => deleteFile(name, e)}
              className="ml-1 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity"
              role="button"
            >
              <X className="w-3 h-3" />
            </span>
          </button>
        ))}

        {/* Inline new-file input */}
        {naming ? (
          <div className="flex items-center gap-1 ml-1 flex-shrink-0">
            <input
              ref={nameInputRef}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter')  commitNewFile()
                if (e.key === 'Escape') cancelNaming()
              }}
              placeholder="filename.html"
              className="w-32 px-2 py-0.5 text-xs bg-slate-800 border border-violet-500 rounded text-slate-100 placeholder-slate-600 focus:outline-none"
            />
            <button onClick={commitNewFile} className="text-emerald-400 hover:text-emerald-300 flex-shrink-0">
              <Check className="w-3.5 h-3.5" />
            </button>
            <button onClick={cancelNaming} className="text-slate-500 hover:text-red-400 flex-shrink-0">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-0.5 ml-1 flex-shrink-0">
            {/* + New file */}
            <button
              onClick={startNaming}
              title="New file"
              className="p-1 text-slate-500 hover:text-violet-400 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
            {/* Open file(s) */}
            <button
              onClick={handleImportFiles}
              disabled={importing}
              title="Open file(s)"
              className="p-1 text-slate-500 hover:text-blue-400 transition-colors disabled:opacity-40"
            >
              <FolderOpen className="w-3.5 h-3.5" />
            </button>
            {/* Import ZIP */}
            <button
              onClick={handleImportZip}
              disabled={importing}
              title="Import ZIP project"
              className="p-1 text-slate-500 hover:text-emerald-400 transition-colors disabled:opacity-40"
            >
              <Archive className="w-3.5 h-3.5" />
            </button>
            {/* Clear all files */}
            {fileNames.length > 0 && (
              <button
                onClick={clearAll}
                title={confirmClear ? 'Click again to confirm clear all' : 'Clear all files'}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] transition-all ml-1 ${
                  confirmClear
                    ? 'bg-red-600 text-white'
                    : 'text-slate-500 hover:text-red-400'
                }`}
              >
                <Trash2 className="w-3 h-3" />
                {confirmClear && <span className="font-semibold">Confirm?</span>}
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Empty state ── */}
      {fileNames.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-slate-600 p-6">
          <Upload className="w-14 h-14 opacity-30" />
          <div className="text-center">
            <p className="text-slate-300 font-semibold text-base mb-1">No files yet</p>
            <p className="text-sm text-slate-500 max-w-xs">
              Create a blank file, open existing source files, import a ZIP project, or drag &amp; drop files here.
            </p>
          </div>

          {/* Three big action buttons */}
          <div className="flex flex-col gap-2 w-full max-w-xs mt-2">
            <button
              onClick={startNaming}
              className="flex items-center gap-2.5 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              New blank file
            </button>
            <button
              onClick={handleImportFiles}
              disabled={importing}
              className="flex items-center gap-2.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              <FolderOpen className="w-4 h-4 text-blue-400" />
              Open source file(s)…
            </button>
            <button
              onClick={handleImportZip}
              disabled={importing}
              className="flex items-center gap-2.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              <Archive className="w-4 h-4 text-emerald-400" />
              Import ZIP project…
            </button>
          </div>

          <p className="text-xs text-slate-700 mt-1 flex items-center gap-1.5">
            <FileUp className="w-3.5 h-3.5" />
            Or drag &amp; drop files / .zip anywhere on this panel
          </p>
        </div>
      ) : (
        /* ── Monaco editor ── */
        <div className="flex-1 overflow-hidden">
          <Editor
            height="100%"
            language={getLang(currentFile)}
            value={files[currentFile] ?? ''}
            onChange={setContent}
            theme={monacoTheme}
            options={{
              fontSize: 13,
              lineHeight: 21,
              minimap: { enabled: false },
              lineNumbers: 'on',
              wordWrap: 'on',
              automaticLayout: true,
              padding: { top: 12, bottom: 12 },
              scrollBeyondLastLine: false,
              renderLineHighlight: 'gutter',
              tabSize: 2
            }}
          />
        </div>
      )}
    </div>
  )
}
