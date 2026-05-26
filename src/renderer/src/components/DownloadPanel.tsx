import { useState } from 'react'
import { Package, CheckCircle, FolderOpen, Download } from 'lucide-react'
import type { BuildOutputPaths } from '../types'

interface Props {
  output: BuildOutputPaths
}

export default function DownloadPanel({ output }: Props) {
  return (
    <div className="flex flex-col gap-2 p-4">
      {output.exe && (
        <ArtifactCard srcPath={output.exe} label="Windows EXE" ext="exe" />
      )}
      {output.apk && (
        <ArtifactCard srcPath={output.apk} label="Android APK" ext="apk" />
      )}
    </div>
  )
}

function ArtifactCard({
  srcPath,
  label,
  ext
}: {
  srcPath: string
  label: string
  ext: string
}) {
  const [saved, setSaved] = useState(false)
  const filename = srcPath.split(/[\\/]/).pop() ?? `output.${ext}`

  const handleSave = async () => {
    const result = await window.api.saveFile(srcPath, filename)
    if (result) setSaved(true)
  }

  const handleOpenFolder = async () => {
    const folder = srcPath.substring(0, srcPath.lastIndexOf('\\') || srcPath.lastIndexOf('/'))
    await window.api.openFolder(folder)
  }

  return (
    <div className="flex flex-col gap-2 p-3 bg-slate-800 border border-slate-700 rounded-lg">
      <div className="flex items-center gap-2">
        <Package className="w-4 h-4 text-violet-400 flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-200">{label}</p>
          <p
            className="text-xs text-slate-500 truncate"
            title={filename}
          >
            {filename}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs rounded-md transition-colors ${
            saved
              ? 'bg-emerald-800/40 text-emerald-400 border border-emerald-700/50'
              : 'bg-violet-600 hover:bg-violet-500 text-white'
          }`}
        >
          {saved ? (
            <>
              <CheckCircle className="w-3.5 h-3.5" />
              Saved
            </>
          ) : (
            <>
              <Download className="w-3.5 h-3.5" />
              Save As…
            </>
          )}
        </button>

        <button
          onClick={handleOpenFolder}
          title="Open output folder"
          className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-md transition-colors"
        >
          <FolderOpen className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
