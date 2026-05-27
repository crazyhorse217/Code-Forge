import { detectLanguage, Language } from './detector'
import { buildWebExe } from './builders/web-exe'
import { buildWebApk } from './builders/web-apk'
import { buildPythonExe } from './builders/python-exe'
import { buildNodeExe } from './builders/node-exe'
import { buildReactViteExe } from './builders/react-vite'

export interface BuildConfig {
  appName: string
  version: string
  target: 'exe' | 'apk' | 'both'
  language: string // 'auto' or a Language value
  iconPath?: string
}

export type ProgressType = 'log' | 'error' | 'step'
export type ProgressCallback = (type: ProgressType, data: string) => void

export interface BuildOutputPaths {
  exe?: string
  apk?: string
}

export async function buildProject(
  files: Record<string, string>,
  config: BuildConfig,
  onProgress: ProgressCallback
): Promise<BuildOutputPaths> {
  const lang: Language =
    config.language === 'auto'
      ? detectLanguage(files)
      : (config.language as Language)

  onProgress('step', `Detected language: ${lang}`)

  const buildExe = config.target === 'exe' || config.target === 'both'
  const buildApk = config.target === 'apk' || config.target === 'both'
  const outputs: BuildOutputPaths = {}

  // ── EXE build ────────────────────────────────────────────────────────────────
  if (buildExe) {
    onProgress('step', '— Starting Windows EXE build —')
    switch (lang) {
      case 'html':
        outputs.exe = await buildWebExe(files, config, onProgress)
        break
      case 'python':
        outputs.exe = await buildPythonExe(files, config, onProgress)
        break
      case 'react':
        outputs.exe = await buildReactViteExe(files, config, onProgress)
        break
      case 'nodejs':
        outputs.exe = await buildNodeExe(files, config, onProgress)
        break
      case 'react-native':
        throw new Error(
          'React Native / Expo projects cannot be compiled to a Windows EXE.\n' +
          'These projects require the Android or iOS build toolchain.\n' +
          'Options:\n' +
          '  • Use the APK target to build an Android app\n' +
          '  • For a desktop app, rewrite your UI in plain HTML/JS or Node.js'
        )
      default:
        throw new Error(`EXE build not supported for language: ${lang}`)
    }
  }

  // ── APK build ────────────────────────────────────────────────────────────────
  if (buildApk) {
    onProgress('step', '— Starting Android APK build —')
    switch (lang) {
      case 'html':
      case 'react':
      case 'react-native':
        outputs.apk = await buildWebApk(files, config, onProgress)
        break
      case 'python':
        throw new Error(
          'Python → APK requires Buildozer on Linux/macOS (WSL on Windows). Not yet supported.'
        )
      case 'nodejs':
        throw new Error(
          'Node.js → APK: wrap your code in React Native or use the HTML output target instead.'
        )
      default:
        throw new Error(`APK build not supported for language: ${lang}`)
    }
  }

  return outputs
}
