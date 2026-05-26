import { useState, useEffect, useRef, useCallback } from 'react'
import { Sparkles, Key, Zap, AlertCircle, CheckCircle } from 'lucide-react'
import type { BuildConfig, LogEntry } from '../types'

interface Props {
  files: Record<string, string>
  logs: LogEntry[]
  onApplyConfig: (config: Partial<BuildConfig>) => void
}

export default function AIAssistant({ files, logs, onApplyConfig }: Props) {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('cf-anthropic-key') ?? '')
  const [keyInput, setKeyInput] = useState('')
  const [showKeyInput, setShowKeyInput] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [output, setOutput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [suggestedConfig, setSuggestedConfig] = useState<Partial<BuildConfig> | null>(null)
  const outputRef = useRef<HTMLDivElement>(null)
  const cleanupRef = useRef<(() => void)[]>([])

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [output])

  const hasFiles = Object.keys(files).length > 0
  const lastError = logs.filter((l) => l.type === 'error').pop()?.message

  const runAnalysis = useCallback(
    (mode: 'analyze' | 'fix') => {
      if (!apiKey) { setShowKeyInput(true); return }
      if (!hasFiles) return

      cleanupRef.current.forEach((fn) => fn())
      cleanupRef.current = []

      setIsAnalyzing(true)
      setOutput('')
      setError(null)
      setSuggestedConfig(null)

      const removeChunk = window.api.onAiChunk((text) => {
        setOutput((prev) => prev + text)
      })
      const removeDone = window.api.onAiDone(() => setIsAnalyzing(false))
      const removeError = window.api.onAiError((err) => {
        setError(err)
        setIsAnalyzing(false)
      })

      cleanupRef.current = [removeChunk, removeDone, removeError]

      window.api.aiAnalyze({
        files,
        errorLog: mode === 'fix' ? lastError : undefined,
        apiKey
      })
    },
    [apiKey, files, lastError, hasFiles]
  )

  // Parse config suggestion from completed output
  useEffect(() => {
    if (!isAnalyzing && output) {
      const match = output.match(/```json\n([\s\S]*?)\n```/)
      if (match) {
        try {
          setSuggestedConfig(JSON.parse(match[1]))
        } catch { /* ignore */ }
      }
    }
  }, [isAnalyzing, output])

  const saveKey = () => {
    const trimmed = keyInput.trim()
    if (trimmed) {
      localStorage.setItem('cf-anthropic-key', trimmed)
      setApiKey(trimmed)
      setKeyInput('')
      setShowKeyInput(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-slate-950">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-gradient-to-r from-violet-950/50 to-slate-900">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-violet-400" />
          <span className="text-sm font-semibold text-slate-200">AI Build Assistant</span>
          <span className="text-[10px] bg-violet-600/30 text-violet-300 border border-violet-500/30 px-1.5 py-0.5 rounded-full">
            Claude
          </span>
        </div>
        <button
          onClick={() => setShowKeyInput((v) => !v)}
          title={apiKey ? 'API key set — click to change' : 'Set Anthropic API key'}
          className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded transition-colors ${
            apiKey
              ? 'text-emerald-400 hover:text-emerald-300'
              : 'text-amber-400 hover:text-amber-300 animate-pulse'
          }`}
        >
          <Key className="w-3 h-3" />
          {apiKey ? 'Key set' : 'Add key'}
        </button>
      </div>

      {/* API key input */}
      {showKeyInput && (
        <div className="px-4 py-3 bg-slate-900 border-b border-slate-800">
          <p className="text-[11px] text-slate-400 mb-2">
            Enter your{' '}
            <span className="text-violet-400">Anthropic API key</span> — stored
            locally only, never sent anywhere except Anthropic's API.
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveKey()}
              placeholder="sk-ant-..."
              className="flex-1 bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500"
            />
            <button
              onClick={saveKey}
              className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs rounded transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 px-4 py-3 border-b border-slate-800">
        <button
          onClick={() => runAnalysis('analyze')}
          disabled={isAnalyzing || !hasFiles}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-md transition-all ${
            isAnalyzing || !hasFiles
              ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
              : 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-900/30'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          {isAnalyzing ? 'Analyzing…' : 'Analyze Code'}
        </button>
        {lastError && (
          <button
            onClick={() => runAnalysis('fix')}
            disabled={isAnalyzing}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-md bg-red-900/30 hover:bg-red-900/50 text-red-300 border border-red-800/40 transition-all disabled:opacity-40"
          >
            <Zap className="w-3.5 h-3.5" />
            Fix Last Error
          </button>
        )}
      </div>

      {/* Streaming output */}
      <div ref={outputRef} className="flex-1 overflow-y-auto px-4 py-3 text-[12px] leading-relaxed">
        {!output && !error && !isAnalyzing && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-600">
            <Sparkles className="w-10 h-10 opacity-20" />
            <p className="text-center text-xs max-w-[200px]">
              {!hasFiles
                ? 'Add some code files first, then click Analyze.'
                : !apiKey
                ? 'Add your Anthropic API key above to get started.'
                : 'Click Analyze Code to get AI insights about your project.'}
            </p>
          </div>
        )}

        {error && (
          <div className="flex gap-2 p-3 bg-red-950/40 border border-red-800/40 rounded-md text-red-300 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {isAnalyzing && !output && (
          <div className="flex items-center gap-1.5 text-slate-500 text-xs">
            <span className="animate-bounce" style={{ animationDelay: '0ms' }}>●</span>
            <span className="animate-bounce" style={{ animationDelay: '150ms' }}>●</span>
            <span className="animate-bounce" style={{ animationDelay: '300ms' }}>●</span>
          </div>
        )}

        {output && <AIOutput text={output} />}
      </div>

      {/* Suggested config card */}
      {suggestedConfig && !isAnalyzing && (
        <div className="px-4 py-3 border-t border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
              <CheckCircle className="w-3.5 h-3.5" />
              Suggested Config
            </div>
            <button
              onClick={() => onApplyConfig(suggestedConfig)}
              className="text-[11px] px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-700/40 rounded transition-colors"
            >
              Apply ✓
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {suggestedConfig.appName && <Chip label="Name" value={suggestedConfig.appName} />}
            {suggestedConfig.language && <Chip label="Language" value={suggestedConfig.language} />}
            {suggestedConfig.version && <Chip label="Version" value={suggestedConfig.version} />}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Lightweight markdown renderer ─────────────────────────────────────────────
function AIOutput({ text }: { text: string }) {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let inCode = false
  let codeLines: string[] = []

  lines.forEach((line, i) => {
    if (line.startsWith('```')) {
      if (!inCode) {
        inCode = true
        codeLines = []
      } else {
        inCode = false
        elements.push(
          <pre
            key={i}
            className="bg-slate-900 border border-slate-700 rounded p-3 my-2 overflow-x-auto text-[11px] text-slate-300 leading-relaxed"
          >
            <code>{codeLines.join('\n')}</code>
          </pre>
        )
      }
      return
    }
    if (inCode) { codeLines.push(line); return }

    if (line.startsWith('### ')) {
      elements.push(<h3 key={i} className="text-slate-100 font-semibold text-[13px] mt-3 mb-1">{line.slice(4)}</h3>)
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={i} className="text-white font-bold text-sm mt-4 mb-1">{line.slice(3)}</h2>)
    } else if (line.startsWith('# ')) {
      elements.push(<h1 key={i} className="text-white font-bold text-base mt-4 mb-2">{line.slice(2)}</h1>)
    } else if (line.match(/^[-*] /)) {
      elements.push(
        <div key={i} className="flex gap-2 my-0.5 text-slate-300">
          <span className="text-violet-400 flex-shrink-0 mt-0.5">•</span>
          <span>{renderInline(line.slice(2))}</span>
        </div>
      )
    } else if (line.trim() === '') {
      elements.push(<div key={i} className="h-2" />)
    } else {
      elements.push(<p key={i} className="my-0.5 text-slate-300">{renderInline(line)}</p>)
    }
  })

  return <div>{elements}</div>
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i} className="text-slate-100 font-semibold">{part.slice(2, -2)}</strong>
    if (part.startsWith('`') && part.endsWith('`'))
      return <code key={i} className="bg-slate-800 text-violet-300 px-1 rounded text-[11px]">{part.slice(1, -1)}</code>
    return part
  })
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex items-center gap-1 text-[10px] bg-slate-800 border border-slate-700 rounded px-2 py-0.5">
      <span className="text-slate-500">{label}:</span>
      <span className="text-slate-200">{value}</span>
    </span>
  )
}
