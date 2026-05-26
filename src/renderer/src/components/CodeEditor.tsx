import { useState, useCallback, useRef } from 'react'
import Editor from '@monaco-editor/react'
import { Plus, X, Upload, FileCode, Archive, Check } from 'lucide-react'

interface Props {
  files: Record<string, string>
  onFilesChange: (files: Record<string, string>) => void
  monacoTheme?: string
}

const EXT_LANG: Record<string, string> = {
  html: 'html',
  htm: 'html',
  css: 'css',
  js: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  py: 'python',
  json: 'json',
  md: 'markdown',
  xml: 'xml',
  sh: 'shell',
  yaml: 'yaml',
  yml: 'yaml',
  txt: 'plaintext'
}

function getLang(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  return EXT_LANG[ext] ?? 'plaintext'
}

export default function CodeEditor({ files, onFilesChange, monacoTheme = 'vs-dark' }: Props) {
  const [activeFile, setActiveFile] = useState<string>('')
  const [naming, setNaming] = useState(false)
  const [newName, setNewName] = useState('')
  const nameInputRef = useRef<HTMLInputElement>(null)

  const fileNames = Object.keys(files)
  const currentFile = fileNames.includes(activeFile) ? activeFile : fileNames[0] ?? ''

  const setContent = (value: string | undefined) => {
    if (!currentFile) return
    onFilesChange({ ...files, [currentFile]: value ?? '' })
  }

  const startNaming = () => {
    setNewName('')
    setNaming(true)
    // Focus after render
    setTimeout(() => nameInputRef.current?.focus(), 0)
  }

  const commitNewFile = () => {
    const name = newName.trim()
    setNaming(false)
    setNewName('')
    if (!name || files[name] !== undefined) return
    onFilesChange({ ...files, [name]: '' })
    setActiveFile(name)
  }

  const cancelNaming = () => {
    setNaming(false)
    setNewName('')
  }

  const deleteFile = (name: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const next = { ...files }
    delete next[name]
    onFilesChange(next)
    if (activeFile === name) setActiveFile(Object.keys(next)[0] ?? '')
  }

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      const dropped = Array.from(e.dataTransfer.files)
      const next = { ...files }
      let firstNew = ''

      for (const file of dropped) {
        // ZIP extraction — use the real filesystem path available in Electron
        if (file.name.endsWith('.zip')) {
          const zipPath = (file as File & { path?: string }).path
          if (zipPath) {
            const extracted = await window.api.extractZip(zipPath)
            for (const [name, content] of Object.entries(extracted)) {
              next[name] = content
              if (!firstNew) firstNew = name
            }
          }
          continue
        }

        // Regular text file
        const content: string = await new Promise((resolve) => {
          const reader = new FileReader()
          reader.onload = (ev) => resolve((ev.target?.result as string) ?? '')
          reader.readAsText(file)
        })
        next[file.name] = content
        if (!firstNew) firstNew = file.name
      }

      onFilesChange(next)
      if (firstNew && !fileNames.includes(activeFile)) setActiveFile(firstNew)
    },
    [files, activeFile, fileNames, onFilesChange]
  )

  return (
    <div
      className="flex flex-col h-full"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      {/* File tabs */}
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
        {naming ? (
          <div className="flex items-center gap-1 ml-1">
            <input
              ref={nameInputRef}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitNewFile()
                if (e.key === 'Escape') cancelNaming()
              }}
              placeholder="filename.html"
              className="w-32 px-2 py-0.5 text-xs bg-slate-800 border border-violet-500 rounded text-slate-100 placeholder-slate-600 focus:outline-none"
            />
            <button onClick={commitNewFile} className="text-emerald-400 hover:text-emerald-300">
              <Check className="w-3.5 h-3.5" />
            </button>
            <button onClick={cancelNaming} className="text-slate-500 hover:text-red-400">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={startNaming}
            title="New file"
            className="p-1 ml-1 text-slate-500 hover:text-violet-400 transition-colors flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Editor or empty state */}
      {fileNames.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-slate-600">
          <Upload className="w-14 h-14 opacity-40" />
          <div className="text-center">
            <p className="text-slate-400 font-medium mb-1">Drop files or a .zip folder here</p>
            <p className="text-sm text-slate-600">
              Supports .html .css .js .ts .py .json — or drop a .zip to extract all at once
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-700">
            <Archive className="w-3.5 h-3.5" />
            <span>.zip auto-extracted</span>
          </div>
          <button
            onClick={startNaming}
            className="mt-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm rounded-md transition-colors"
          >
            + New file
          </button>
        </div>
      ) : (
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
