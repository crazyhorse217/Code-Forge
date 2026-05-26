export interface BuildConfig {
  appName: string
  version: string
  target: 'exe' | 'apk' | 'both'
  language: string
  iconPath?: string
}

export interface BuildHistoryEntry {
  id: number
  timestamp: number
  appName: string
  target: string
  status: 'success' | 'failed'
  outputPaths?: Record<string, string>
  duration: number
  error?: string
}

export interface LogEntry {
  id: number
  type: 'log' | 'error' | 'step' | 'success'
  message: string
  timestamp: number
}

export interface BuildOutputPaths {
  exe?: string
  apk?: string
}

export interface ToolStatus {
  node: string | false
  python: string | false
  java: string | false
  androidSdk: string | false
  pkg: string | false
  pyinstaller: string | false
}
