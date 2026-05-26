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
      entryPoint = pkg.main || pkg.bin || 'index.js'
      if (typeof pkg.bin === 'object') {
        entryPoint = Object.values(pkg.bin)[0] as string
      }
    } catch {
      // keep default
    }
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
