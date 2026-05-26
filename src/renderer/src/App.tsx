import { useState, useEffect, useCallback, useRef } from 'react'
import { Cpu, Code2, Terminal, Download, Clock, FolderOpen, Save, Sparkles, Eye, LayoutTemplate, BookOpen } from 'lucide-react'
import CodeEditor from './components/CodeEditor'
import BuildConfigPanel from './components/BuildConfig'
import BuildProgress from './components/BuildProgress'
import DownloadPanel from './components/DownloadPanel'
import BuildHistory from './components/BuildHistory'
import AIAssistant from './components/AIAssistant'
import UpdateBanner, { useUpdater } from './components/UpdateBanner'
import TemplateModal from './components/TemplateModal'
import TutorialPanel from './components/TutorialPanel'
import WelcomeTour from './components/WelcomeTour'
import ThemeSwitcher, { type Theme } from './components/ThemeSwitcher'
import type { BuildConfig, LogEntry, BuildOutputPaths, ToolStatus, BuildHistoryEntry } from './types'

type Tab = 'editor' | 'log' | 'history' | 'ai' | 'guide'

let logIdCounter = 0
let historyIdCounter = 0

export default function App() {
  const [files, setFiles] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] = useState<Tab>('editor')
  const [isBuilding, setIsBuilding] = useState(false)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [buildOutput, setBuildOutput] = useState<BuildOutputPaths | null>(null)
  const [tools, setTools] = useState<ToolStatus | null>(null)
  const [history, setHistory] = useState<BuildHistoryEntry[]>([])
  const [config, setConfig] = useState<BuildConfig>({
    appName: 'MyApp',
    version: '1.0.0',
    target: 'exe',
    language: 'auto'
  })

  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem('cf-theme') as Theme) ?? 'dark'
  )
  // dataUrl is what we actually set as background-image (never stored in localStorage — too large)
  const [photoBg, setPhotoBg] = useState<string | null>(null)

  const cleanupRef = useRef<(() => void)[]>([])
  const buildStartRef = useRef<number>(0)
  const updater = useUpdater()
  const [showTemplates, setShowTemplates] = useState(false)
  const [showTour, setShowTour] = useState(
    () => !localStorage.getItem('cf-tour-done')
  )

  const hasHtmlFiles = Object.keys(files).some((f) => f.endsWith('.html'))

  useEffect(() => {
    window.api.checkTools().then((t) => setTools(t as ToolStatus))
  }, [])

  // Subscribe to update events once on mount
  useEffect(() => updater.subscribe(), [])

  // On startup, reload saved photo from its file path
  useEffect(() => {
    const savedPath = localStorage.getItem('cf-photo-path')
    if (savedPath) {
      window.api.loadBackground(savedPath).then((res) => {
        if (res) setPhotoBg(res.dataUrl)
      })
    }
  }, [])

  // Persist theme
  useEffect(() => {
    localStorage.setItem('cf-theme', theme)
  }, [theme])

  // Pick a new background photo — switches theme immediately, then loads image
  const handlePickPhoto = useCallback(async () => {
    setTheme('photo') // highlight button right away
    const res = await window.api.pickBackground()
    if (res) {
      setPhotoBg(res.dataUrl)
      localStorage.setItem('cf-photo-path', res.filePath)
    }
  }, [])

  const handleThemeChange = useCallback((t: Theme) => {
    setTheme(t)
    if (t === 'photo') {
      window.api.pickBackground().then((res) => {
        if (res) {
          setPhotoBg(res.dataUrl)
          localStorage.setItem('cf-photo-path', res.filePath)
        }
      })
    }
  }, [])

  const addLog = useCallback((type: LogEntry['type'], message: string) => {
    setLogs((prev) => [
      ...prev,
      { id: ++logIdCounter, type, message, timestamp: Date.now() }
    ])
  }, [])

  const handleBuild = useCallback(() => {
    if (Object.keys(files).length === 0) {
      addLog('error', 'No files to build. Add at least one file in the editor.')
      setActiveTab('log')
      return
    }

    setLogs([])
    setBuildOutput(null)
    setIsBuilding(true)
    setActiveTab('log')
    buildStartRef.current = Date.now()

    cleanupRef.current.forEach((fn) => fn())
    cleanupRef.current = []

    const removeProgress = window.api.onBuildProgress(({ type, data }) => {
      addLog(type as LogEntry['type'], data)
    })

    const removeComplete = window.api.onBuildComplete(({ success, outputPaths, error }) => {
      const duration = Date.now() - buildStartRef.current
      setIsBuilding(false)

      if (success && outputPaths) {
        setBuildOutput(outputPaths)
        addLog('success', '✓ Build completed successfully!')
        setHistory((prev) => [
          ...prev,
          {
            id: ++historyIdCounter,
            timestamp: Date.now(),
            appName: config.appName,
            target: config.target,
            status: 'success',
            outputPaths,
            duration
          }
        ])
      } else {
        addLog('error', `✗ Build failed: ${error ?? 'Unknown error'}`)
        setHistory((prev) => [
          ...prev,
          {
            id: ++historyIdCounter,
            timestamp: Date.now(),
            appName: config.appName,
            target: config.target,
            status: 'failed',
            duration,
            error: error ?? 'Unknown error'
          }
        ])
      }
    })

    cleanupRef.current = [removeProgress, removeComplete]
    window.api.startBuild(files, config)
  }, [files, config, addLog])

  const handlePreview = useCallback(async () => {
    const result = await window.api.previewApp(files)
    if (result.error) {
      addLog('error', `Preview failed: ${result.error}`)
      setActiveTab('log')
    }
  }, [files, addLog])

  const handleSaveProject = useCallback(async () => {
    await window.api.saveProject({ files, config })
  }, [files, config])

  const handleLoadProject = useCallback(async () => {
    const data = await window.api.loadProject()
    if (!data) return
    if (data.files) setFiles(data.files as Record<string, string>)
    if (data.config) setConfig(data.config as BuildConfig)
    setActiveTab('editor')
  }, [])

  const bgStyle: React.CSSProperties =
    theme === 'photo'
      ? photoBg
        ? { backgroundImage: `url("${photoBg}")` }
        : { background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 45%, #0c1a3a 100%)' }
      : {}

  return (
    <div
      className="h-screen flex flex-col bg-slate-950 select-none"
      data-theme={theme}
      style={bgStyle}
    >
      {/* Update banner */}
      {updater.showBanner && updater.updateState && (
        <UpdateBanner
          state={updater.updateState}
          version={updater.updateVersion}
          onInstall={updater.install}
          onDismiss={updater.dismiss}
        />
      )}

      {/* Title bar / header */}
      <header
        className="drag-region flex items-center justify-between px-5 bg-slate-900 border-b border-slate-800"
        style={{ minHeight: 44 }}
      >
        <div className="no-drag flex items-center gap-3">
          <Cpu className="w-5 h-5 text-violet-400 flex-shrink-0" />
          <span className="text-base font-bold text-white tracking-wide">CodeForge</span>
          <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
            v1.0.0
          </span>

          {/* Project save / load */}
          <div className="flex items-center gap-1 ml-2">
            <button
              onClick={() => setShowTemplates(true)}
              title="New from template"
              className="flex items-center gap-1 px-2 py-1 text-xs text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
            >
              <LayoutTemplate className="w-3.5 h-3.5" />
              Templates
            </button>
            <button
              onClick={handleSaveProject}
              title="Save project"
              className="flex items-center gap-1 px-2 py-1 text-xs text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              Save
            </button>
            <button
              onClick={handleLoadProject}
              title="Open project"
              className="flex items-center gap-1 px-2 py-1 text-xs text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              Open
            </button>
            {hasHtmlFiles && (
              <button
                onClick={handlePreview}
                title="Preview web app"
                className="flex items-center gap-1 px-2 py-1 text-xs text-violet-400 hover:text-violet-300 hover:bg-slate-800 rounded transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                Preview
              </button>
            )}
          </div>
        </div>

        {/* Theme switcher */}
        <ThemeSwitcher
          theme={theme}
          hasPhoto={!!photoBg}
          onThemeChange={handleThemeChange}
          onPickPhoto={handlePickPhoto}
        />

        {/* Tool status pills */}
        <div className="no-drag flex items-center gap-3 text-[11px]">
          {tools ? (
            <>
              <ToolPill label="Node" value={tools.node} />
              <ToolPill label="Python" value={tools.python} />
              <ToolPill label="Java" value={tools.java} />
              <ToolPill label="Android SDK" value={tools.androidSdk} />
            </>
          ) : (
            <span className="text-slate-600">Checking tools…</span>
          )}
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left pane */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-slate-800">
          {/* Tab bar */}
          <div className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 border-b border-slate-800">
            <TabButton
              active={activeTab === 'editor'}
              onClick={() => setActiveTab('editor')}
              icon={<Code2 className="w-3.5 h-3.5" />}
              label="Editor"
            />
            <TabButton
              active={activeTab === 'log'}
              onClick={() => setActiveTab('log')}
              icon={<Terminal className="w-3.5 h-3.5" />}
              label="Build Log"
              badge={isBuilding ? '●' : logs.length > 0 ? String(logs.length) : undefined}
            />
            <TabButton
              active={activeTab === 'history'}
              onClick={() => setActiveTab('history')}
              icon={<Clock className="w-3.5 h-3.5" />}
              label="History"
              badge={history.length > 0 ? String(history.length) : undefined}
            />
            <TabButton
              active={activeTab === 'ai'}
              onClick={() => setActiveTab('ai')}
              icon={<Sparkles className="w-3.5 h-3.5" />}
              label="AI"
            />
            <TabButton
              active={activeTab === 'guide'}
              onClick={() => setActiveTab('guide')}
              icon={<BookOpen className="w-3.5 h-3.5" />}
              label="Guide"
            />
          </div>

          {/* Pane content */}
          <div className="flex-1 overflow-hidden cf-tab-content" key={activeTab}>
            {activeTab === 'editor' && (
              <CodeEditor
                files={files}
                onFilesChange={setFiles}
                monacoTheme={theme === 'light' ? 'vs' : 'vs-dark'}
              />
            )}
            {activeTab === 'log' && (
              <BuildProgress logs={logs} isBuilding={isBuilding} />
            )}
            {activeTab === 'history' && (
              <BuildHistory history={history} onClear={() => setHistory([])} />
            )}
            {activeTab === 'ai' && (
              <AIAssistant
                files={files}
                logs={logs}
                onApplyConfig={(partial) => setConfig((prev) => ({ ...prev, ...partial }))}
              />
            )}
            {activeTab === 'guide' && (
              <TutorialPanel onStartTour={() => setShowTour(true)} />
            )}
          </div>
        </div>

        {/* Welcome tour */}
        {showTour && (
          <WelcomeTour
            onClose={() => {
              localStorage.setItem('cf-tour-done', '1')
              setShowTour(false)
            }}
          />
        )}

        {/* Template modal */}
        {showTemplates && (
          <TemplateModal
            hasFiles={Object.keys(files).length > 0}
            onSelect={(tplFiles) => { setFiles(tplFiles); setActiveTab('editor') }}
            onClose={() => setShowTemplates(false)}
          />
        )}

        {/* Right sidebar */}
        <div className="w-[300px] flex-shrink-0 flex flex-col bg-slate-900 overflow-y-auto">
          <BuildConfigPanel
            config={config}
            onChange={setConfig}
            onBuild={handleBuild}
            isBuilding={isBuilding}
            tools={tools}
          />

          {buildOutput && (
            <div className="border-t border-slate-800">
              <div className="flex items-center gap-2 px-4 py-3">
                <Download className="w-4 h-4 text-violet-400" />
                <span className="text-sm font-semibold text-slate-200">Downloads</span>
              </div>
              <DownloadPanel output={buildOutput} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ToolPill({ label, value }: { label: string; value: string | false }) {
  const ok = !!value
  return (
    <span className={`flex items-center gap-1 ${ok ? 'text-emerald-400' : 'text-slate-600'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-emerald-400' : 'bg-slate-600'}`} />
      {label}
    </span>
  )
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  badge
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  badge?: string
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded transition-colors ${
        active
          ? 'bg-violet-600 text-white'
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
      }`}
    >
      {icon}
      {label}
      {badge && (
        <span
          className={`text-[9px] px-1 rounded-full ${
            badge === '●' ? 'text-amber-400' : 'bg-slate-700 text-slate-300'
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  )
}
