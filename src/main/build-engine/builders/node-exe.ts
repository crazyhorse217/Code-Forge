import path from 'path'
import fs from 'fs'
import os from 'os'
import { BuildConfig, ProgressCallback } from '../index'
import { runCommand } from '../utils'

export async function buildNodeExe(
  files: Record<string, string>,
  config: BuildConfig,
  onProgress: ProgressCallback
): Promise<string> {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'codeforge-node-'))
  onProgress('log', `Build workspace: ${tmpDir}`)

  for (const [name, content] of Object.entries(files)) {
    const dest = path.join(tmpDir, name)
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    fs.writeFileSync(dest, content, 'utf8')
  }

  // Resolve or generate package.json
  let entryPoint = 'index.js'
  if (!files['package.json']) {
    const pkg = {
      name: config.appName.toLowerCase().replace(/[^a-z0-9-]/g, '-') || 'myapp',
      version: config.version || '1.0.0',
      main: 'index.js',
      bin: { app: 'index.js' }
    }
    fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify(pkg, null, 2))
  } else {
    try {
      const pkg = JSON.parse(files['package.json'])
      let candidate: string = pkg.main || 'index.js'
      if (typeof pkg.bin === 'object') {
        candidate = Object.values(pkg.bin)[0] as string
      } else if (typeof pkg.bin === 'string') {
        candidate = pkg.bin
      }
      entryPoint = candidate
    } catch {
      // keep default
    }
  }

  // ── Validate entry point is a real file, not a framework module specifier ──
  // Module specifiers like "expo-router/entry" or "expo/AppEntry" are package
  // imports, not file paths. If the resolved entry doesn't exist on disk we
  // fall back to common Node.js entry-point conventions.
  const FRAMEWORK_SPECIFIERS = [
    'expo-router/entry',
    'expo/AppEntry',
    'node_modules/expo/AppEntry',
  ]
  if (FRAMEWORK_SPECIFIERS.some((s) => entryPoint.includes(s))) {
    throw new Error(
      `This appears to be an Expo / React Native project (entry: "${entryPoint}").\n` +
      `Expo projects cannot be built into a Windows EXE — they require the Android/iOS ` +
      `build toolchain. Use the APK target instead, or select a plain Node.js project.`
    )
  }

  const FALLBACKS = ['index.js', 'server.js', 'app.js', 'main.js', 'src/index.js']
  if (!fs.existsSync(path.join(tmpDir, entryPoint))) {
    onProgress('log', `Entry "${entryPoint}" not found on disk — searching for a fallback...`)
    const found = FALLBACKS.find((f) => fs.existsSync(path.join(tmpDir, f)))
    if (!found) {
      throw new Error(
        `Could not find a valid entry point. Tried: ${entryPoint}, ${FALLBACKS.join(', ')}.\n` +
        `Make sure your project has an index.js (or set "main" in package.json to a real file).`
      )
    }
    onProgress('log', `Using fallback entry point: ${found}`)
    entryPoint = found
  }

  onProgress('log', `Entry point: ${entryPoint}`)

  // Install project deps if package.json exists
  if (files['package.json']) {
    onProgress('log', 'Installing project dependencies...')
    await runCommand('npm install --prefer-offline', tmpDir, onProgress)
  }

  // Install pkg bundler globally (idempotent)
  onProgress('log', 'Installing pkg bundler...')
  await runCommand('npm install -g @yao-pkg/pkg', tmpDir, onProgress)

  const safeName = config.appName.replace(/[^a-zA-Z0-9_-]/g, '_') || 'MyApp'
  const outputExe = path.join(tmpDir, `${safeName}.exe`)

  onProgress('log', `Bundling ${entryPoint} → ${safeName}.exe ...`)
  await runCommand(
    `pkg "${path.join(tmpDir, entryPoint)}" --target node18-win-x64 --output "${outputExe}"`,
    tmpDir,
    onProgress
  )

  if (!fs.existsSync(outputExe)) {
    throw new Error('pkg completed but EXE not found.')
  }

  onProgress('log', `✓ EXE ready: ${safeName}.exe`)
  return outputExe
}
