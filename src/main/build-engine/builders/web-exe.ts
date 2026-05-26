import path from 'path'
import fs from 'fs'
import os from 'os'
import { BuildConfig, ProgressCallback } from '../index'
import { runCommand } from '../utils'

export async function buildWebExe(
  files: Record<string, string>,
  config: BuildConfig,
  onProgress: ProgressCallback
): Promise<string> {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'codeforge-web-'))
  onProgress('log', `Build workspace: ${tmpDir}`)

  // Write user's web files into a web/ subfolder
  const webDir = path.join(tmpDir, 'web')
  fs.mkdirSync(webDir, { recursive: true })
  for (const [name, content] of Object.entries(files)) {
    const dest = path.join(webDir, name)
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    fs.writeFileSync(dest, content, 'utf8')
  }

  // Electron main process wrapper
  const electronMain = `
const { app, BrowserWindow } = require('electron')
const path = require('path')

app.whenReady().then(() => {
  const win = new BrowserWindow({ width: 1280, height: 800 })
  win.loadFile(path.join(__dirname, 'web', 'index.html'))
  win.on('closed', () => app.quit())
})
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
`.trim()

  fs.writeFileSync(path.join(tmpDir, 'main.js'), electronMain)

  const safeId = config.appName.toLowerCase().replace(/[^a-z0-9]/g, '')
  const safeName = config.appName.replace(/[^a-zA-Z0-9 _-]/g, '')

  // Copy icon into build dir if provided
  let iconBuildPath: string | undefined
  if (config.iconPath && fs.existsSync(config.iconPath)) {
    const iconExt = path.extname(config.iconPath)
    iconBuildPath = path.join(tmpDir, `icon${iconExt}`)
    fs.copyFileSync(config.iconPath, iconBuildPath)
    onProgress('log', `Using icon: ${path.basename(config.iconPath)}`)
  }

  const winBuild: Record<string, unknown> = {
    target: [{ target: 'portable', arch: ['x64'] }]
  }
  if (iconBuildPath) winBuild.icon = iconBuildPath

  const pkg = {
    name: safeId || 'myapp',
    version: config.version || '1.0.0',
    description: `${safeName} — packaged by CodeForge`,
    main: 'main.js',
    scripts: { build: 'electron-builder --win --x64' },
    build: {
      appId: `com.codeforge.${safeId}`,
      productName: safeName,
      directories: { output: 'dist' },
      files: ['main.js', 'web/**/*', ...(iconBuildPath ? [path.basename(iconBuildPath)] : [])],
      win: winBuild
    }
  }

  fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify(pkg, null, 2))

  onProgress('log', 'Installing Electron & electron-builder (this takes 1–3 min on first run)...')
  await runCommand('npm install --save-dev electron@latest electron-builder@latest', tmpDir, onProgress)

  onProgress('log', 'Packaging EXE...')
  await runCommand('npm run build', tmpDir, onProgress)

  const distDir = path.join(tmpDir, 'dist')
  const entries = fs.readdirSync(distDir)
  const exeFile = entries.find((f) => f.endsWith('.exe'))

  if (!exeFile) throw new Error('Build finished but no EXE found in output directory.')

  onProgress('log', `✓ EXE ready: ${exeFile}`)
  return path.join(distDir, exeFile)
}
