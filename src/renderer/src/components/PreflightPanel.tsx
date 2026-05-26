import { useMemo } from 'react'
import {
  CheckCircle, AlertTriangle, XCircle, Info,
  ChevronRight, Layers, FileCode, Package, Zap,
} from 'lucide-react'

interface Issue {
  level: 'error' | 'warning' | 'info'
  title: string
  detail: string
  fix?: string
}

interface PreflightResult {
  lang: string
  langLabel: string
  framework?: string
  entryPoint?: string
  canBuildExe: boolean
  canBuildApk: boolean
  issues: Issue[]
}

interface Props {
  files: Record<string, string>
  buildTarget: 'exe' | 'apk' | 'both'
}

// ── LangShift-powered pre-flight detector ───────────────────────────────────

const FRAMEWORK_MAINS = ['expo-router/entry', 'expo/AppEntry', 'node_modules/expo/AppEntry']
const FALLBACK_ENTRIES = ['index.js', 'server.js', 'app.js', 'main.js', 'src/index.js']

function runPreflight(files: Record<string, string>, buildTarget: 'exe' | 'apk' | 'both'): PreflightResult {
  const names = Object.keys(files)
  const allContent = Object.values(files).join('\n')
  const issues: Issue[] = []

  let lang = 'unknown'
  let langLabel = 'Unknown'
  let framework: string | undefined
  let entryPoint: string | undefined
  let canBuildExe = true
  let canBuildApk = true

  if (names.length === 0) {
    return { lang, langLabel, canBuildExe: false, canBuildApk: false, issues: [{
      level: 'error', title: 'No files', detail: 'Add at least one source file before building.'
    }] }
  }

  // ── Detect language ─────────────────────────────────────────────────────
  let pkg: Record<string, any> | null = null
  if (names.includes('package.json')) {
    try { pkg = JSON.parse(files['package.json']) } catch { /* ignore */ }
  }

  const deps: Record<string, string> = pkg
    ? { ...pkg.dependencies, ...pkg.devDependencies, ...pkg.peerDependencies }
    : {}

  const isExpo = !!(
    deps['expo'] || deps['expo-router'] || deps['expo-modules-core'] || deps['react-native'] ||
    FRAMEWORK_MAINS.some(m => pkg?.main?.includes(m)) ||
    names.includes('app.json') || names.includes('app.config.js') || names.includes('app.config.ts')
  )
  const isRNImport = /from ['"]react-native['"]/.test(allContent)

  if (isExpo || isRNImport) {
    lang = 'react-native'
    langLabel = 'React Native / Expo'
    framework = deps['expo-router'] ? 'Expo Router' : deps['expo'] ? 'Expo' : 'React Native'
    canBuildExe = false

    issues.push({
      level: 'error',
      title: 'Cannot build EXE — React Native / Expo project',
      detail: `${framework} apps require the Android/iOS build toolchain. The Windows EXE builder (pkg) cannot package these projects.`,
      fix: 'Change build target to APK',
    })

    if (pkg?.main && FRAMEWORK_MAINS.some(m => pkg.main.includes(m))) {
      issues.push({
        level: 'error',
        title: `Entry point "${pkg.main}" is a module specifier, not a file`,
        detail: 'pkg will try to open this as a file path and fail with "Input file does not exist".',
        fix: 'Use APK build — Expo handles its own bundling',
      })
    }

  } else if (names.some(f => f.endsWith('.py'))) {
    lang = 'python'
    langLabel = 'Python 3'
    canBuildApk = false
    const pyFiles = names.filter(f => f.endsWith('.py'))
    const mainFile = pyFiles.find(f => f === 'main.py') ?? pyFiles[0]
    entryPoint = mainFile

    if (!pyFiles.some(f => ['main.py', 'app.py', 'server.py', '__main__.py'].includes(f))) {
      issues.push({
        level: 'warning',
        title: 'No standard Python entry point found',
        detail: `Expected main.py, app.py, server.py, or __main__.py. Found: ${pyFiles.join(', ')}.`,
        fix: 'Rename your main file to main.py for reliable builds',
      })
    }

    if (allContent.includes('import tkinter') || allContent.includes('import PyQt')) {
      issues.push({
        level: 'info',
        title: 'GUI library detected',
        detail: 'tkinter / PyQt GUIs are supported by PyInstaller but the output EXE must be run on a machine with the matching Python GUI libraries.',
      })
    }

    issues.push({
      level: 'info',
      title: 'APK build not supported for Python',
      detail: 'Python → APK requires Buildozer on Linux/macOS (WSL). This target is disabled.',
    })

  } else if (names.some(f => f.endsWith('.html'))) {
    lang = 'html'
    langLabel = 'HTML / Web'
    entryPoint = names.find(f => f === 'index.html') ?? names.find(f => f.endsWith('.html'))

    if (!names.includes('index.html')) {
      issues.push({
        level: 'warning',
        title: 'No index.html found',
        detail: `The HTML builder looks for index.html as the entry point. Found: ${names.filter(f => f.endsWith('.html')).join(', ')}.`,
        fix: 'Rename your main HTML file to index.html',
      })
    }

  } else if (pkg || names.some(f => f.match(/\.[jt]sx?$/))) {
    lang = 'nodejs'
    langLabel = 'Node.js'

    // Detect framework
    if (deps['express']) framework = 'Express'
    else if (deps['fastify']) framework = 'Fastify'
    else if (deps['next']) framework = 'Next.js'

    // Resolve entry point
    let candidate = pkg?.main || 'index.js'
    if (typeof pkg?.bin === 'object') candidate = Object.values(pkg.bin)[0] as string
    else if (typeof pkg?.bin === 'string') candidate = pkg.bin
    entryPoint = candidate

    if (!names.includes(candidate) && !FALLBACK_ENTRIES.some(f => names.includes(f))) {
      issues.push({
        level: 'error',
        title: `Entry point "${candidate}" not found`,
        detail: `No file matches the entry point. Checked: ${candidate}, ${FALLBACK_ENTRIES.join(', ')}.`,
        fix: 'Add an index.js file or set "main" in package.json to an existing file',
      })
      canBuildExe = false
    } else if (!names.includes(candidate)) {
      const found = FALLBACK_ENTRIES.find(f => names.includes(f))
      issues.push({
        level: 'warning',
        title: `"${candidate}" not found — will use "${found}" as fallback`,
        detail: 'The builder will automatically fall back to the first matching file.',
      })
      entryPoint = found
    }

    if (deps['electron']) {
      issues.push({
        level: 'warning',
        title: 'Electron project detected',
        detail: 'Electron apps cannot be packaged with pkg. Use electron-builder directly instead.',
      })
      canBuildExe = false
    }

    canBuildApk = false
    if (buildTarget === 'apk' || buildTarget === 'both') {
      issues.push({
        level: 'error',
        title: 'Node.js → APK not supported',
        detail: 'Wrap your UI in React Native / HTML to target Android.',
      })
    }

  } else {
    issues.push({
      level: 'warning',
      title: 'Language could not be detected',
      detail: `Files present: ${names.slice(0, 5).join(', ')}${names.length > 5 ? ` +${names.length - 5} more` : ''}. Make sure your entry file has the correct extension.`,
    })
    canBuildExe = false
    canBuildApk = false
  }

  // ── Cross-cutting checks ────────────────────────────────────────────────
  if (names.length > 50) {
    issues.push({
      level: 'info',
      title: `${names.length} files loaded`,
      detail: 'Large projects may take longer to bundle. Make sure node_modules is not included.',
    })
  }
  if (names.some(f => f.includes('node_modules/'))) {
    issues.push({
      level: 'warning',
      title: 'node_modules files detected',
      detail: 'You\'ve imported files from node_modules. Remove them — the build engine installs dependencies automatically.',
      fix: 'Import only your source files (not node_modules)',
    })
  }

  // Build target validation
  if ((buildTarget === 'exe' || buildTarget === 'both') && !canBuildExe && lang !== 'react-native') {
    if (!issues.find(i => i.level === 'error' && i.title.includes('EXE'))) {
      issues.push({
        level: 'error',
        title: 'EXE build not available for this project',
        detail: `${langLabel} projects cannot be packaged as a Windows EXE with the current builder.`,
      })
    }
  }

  return { lang, langLabel, framework, entryPoint, canBuildExe, canBuildApk, issues }
}

// ── Component ───────────────────────────────────────────────────────────────

export default function PreflightPanel({ files, buildTarget }: Props) {
  const result = useMemo(() => runPreflight(files, buildTarget), [files, buildTarget])

  if (Object.keys(files).length === 0) return null

  const errors   = result.issues.filter(i => i.level === 'error')
  const warnings = result.issues.filter(i => i.level === 'warning')
  const infos    = result.issues.filter(i => i.level === 'info')

  const overallOk = errors.length === 0

  return (
    <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950">
      {/* Header */}
      <div className={`flex items-center gap-2 px-3 py-2 border-b border-slate-800 ${
        overallOk ? 'bg-emerald-950/30' : 'bg-red-950/30'
      }`}>
        {overallOk
          ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          : <XCircle    className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
        }
        <span className="text-xs font-semibold text-white">Pre-flight Check</span>
        <span className="text-[10px] text-slate-500 ml-auto uppercase tracking-widest">LangShift</span>
      </div>

      {/* Detection summary */}
      <div className="flex items-center gap-3 px-3 py-2 border-b border-slate-800/50 flex-wrap gap-y-1">
        <div className="flex items-center gap-1.5">
          <Layers className="w-3 h-3 text-slate-500" />
          <span className="text-[10px] text-slate-400">Language:</span>
          <span className="text-[10px] font-semibold text-cyan-400">{result.langLabel}</span>
          {result.framework && (
            <span className="text-[10px] text-violet-400">· {result.framework}</span>
          )}
        </div>
        {result.entryPoint && (
          <div className="flex items-center gap-1.5">
            <FileCode className="w-3 h-3 text-slate-500" />
            <span className="text-[10px] text-slate-400">Entry:</span>
            <span className="text-[10px] font-mono text-slate-300">{result.entryPoint}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 ml-auto">
          <Package className="w-3 h-3 text-slate-500" />
          <span className="text-[10px] text-slate-400">
            {Object.keys(files).length} file{Object.keys(files).length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Build target readiness */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-slate-800/50">
        <Zap className="w-3 h-3 text-slate-500" />
        <span className="text-[10px] text-slate-500">Build targets:</span>
        {(buildTarget === 'exe' || buildTarget === 'both') && (
          <Badge ok={result.canBuildExe} label="EXE" />
        )}
        {(buildTarget === 'apk' || buildTarget === 'both') && (
          <Badge ok={result.canBuildApk} label="APK" />
        )}
      </div>

      {/* Issues */}
      {result.issues.length > 0 && (
        <div className="divide-y divide-slate-800/50">
          {[...errors, ...warnings, ...infos].map((issue, i) => (
            <IssueRow key={i} issue={issue} />
          ))}
        </div>
      )}

      {overallOk && result.issues.length === 0 && (
        <div className="flex items-center gap-2 px-3 py-2 text-emerald-400">
          <CheckCircle className="w-3 h-3" />
          <span className="text-[10px]">All checks passed — ready to build</span>
        </div>
      )}
    </div>
  )
}

function Badge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${
      ok ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-800/50'
         : 'bg-red-900/50 text-red-400 border border-red-800/50'
    }`}>
      {ok ? <CheckCircle className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}
      {label}
    </span>
  )
}

function IssueRow({ issue }: { issue: Issue }) {
  const cfg = {
    error:   { icon: <XCircle className="w-3 h-3 text-red-400 flex-shrink-0 mt-0.5" />,    titleClass: 'text-red-300' },
    warning: { icon: <AlertTriangle className="w-3 h-3 text-yellow-400 flex-shrink-0 mt-0.5" />, titleClass: 'text-yellow-300' },
    info:    { icon: <Info className="w-3 h-3 text-blue-400 flex-shrink-0 mt-0.5" />,       titleClass: 'text-blue-300' },
  }[issue.level]

  return (
    <div className="flex items-start gap-2 px-3 py-2">
      {cfg.icon}
      <div className="flex-1 min-w-0">
        <p className={`text-[10px] font-semibold ${cfg.titleClass} leading-snug`}>{issue.title}</p>
        <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{issue.detail}</p>
        {issue.fix && (
          <div className="flex items-center gap-1 mt-1">
            <ChevronRight className="w-2.5 h-2.5 text-emerald-500 flex-shrink-0" />
            <span className="text-[10px] text-emerald-400">{issue.fix}</span>
          </div>
        )}
      </div>
    </div>
  )
}
