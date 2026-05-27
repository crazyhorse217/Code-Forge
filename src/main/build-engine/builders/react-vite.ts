import path from 'path'
import fs from 'fs'
import os from 'os'
import { BuildConfig, ProgressCallback } from '../index'
import { runCommand } from '../utils'

/**
 * Builds a React + Vite project into a Windows EXE.
 * Flow: write files → npm install → vite build → wrap dist/ in Electron → electron-builder
 */
export async function buildReactViteExe(
  files: Record<string, string>,
  config: BuildConfig,
  onProgress: ProgressCallback
): Promise<string> {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'codeforge-react-'))
  onProgress('log', `Build workspace: ${tmpDir}`)

  // Write all source files
  for (const [name, content] of Object.entries(files)) {
    const dest = path.join(tmpDir, name)
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    fs.writeFileSync(dest, content, 'utf8')
  }

  // Install project dependencies
  onProgress('log', 'Installing project dependencies (React, Vite, TypeScript)...')
  await runCommand('npm install', tmpDir, onProgress)

  // Run Vite build → produces dist/
  onProgress('log', 'Building React app with Vite...')
  await runCommand('npm run build', tmpDir, onProgress)

  const distDir = path.join(tmpDir, 'dist')
  if (!fs.existsSync(distDir) || !fs.existsSync(path.join(distDir, 'index.html'))) {
    throw new Error(
      'Vite build succeeded but dist/index.html was not found. ' +
      'Make sure your vite.config.ts has build.outDir set to "dist" (the default).'
    )
  }

  onProgress('log', 'Vite build complete — wrapping in Electron...')

  // Electron main process that loads the built Vite output
  const electronMain = `
const { app, BrowserWindow } = require('electron')
const path = require('path')

app.whenReady().then(() => {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: { contextIsolation: true }
  })
  win.loadFile(path.join(__dirname, 'dist', 'index.html'))
  win.on('closed', () => app.quit())
})
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
`.trim()

  fs.writeFileSync(path.join(tmpDir, 'electron-main.js'), electronMain)

  const safeId = config.appName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'myreactapp'
  const safeName = config.appName.replace(/[^a-zA-Z0-9 _-]/g, '') || 'MyReactApp'

  let iconBuildPath: string | undefined
  if (config.iconPath && fs.existsSync(config.iconPath)) {
    const iconExt = path.extname(config.iconPath)
    iconBuildPath = path.join(tmpDir, `icon${iconExt}`)
    fs.copyFileSync(config.iconPath, iconBuildPath)
    onProgress('log', `Using icon: ${path.basename(config.iconPath)}`)
  }

  // Electron-builder config
  const ebPkg = {
    name: safeId,
    version: config.version || '1.0.0',
    description: `${safeName} — built with CodeForge`,
    main: 'electron-main.js',
    scripts: { package: 'electron-builder --win --x64' },
    build: {
      appId: `com.codeforge.${safeId}`,
      productName: safeName,
      directories: { output: 'electron-dist' },
      files: ['electron-main.js', 'dist/**/*', ...(iconBuildPath ? [path.basename(iconBuildPath)] : [])],
      win: {
        target: [{ target: 'portable', arch: ['x64'] }],
        ...(iconBuildPath ? { icon: iconBuildPath } : {}),
      }
    }
  }

  // Merge into existing package.json (keep deps, override build/main/scripts.package)
  let existingPkg: Record<string, unknown> = {}
  const pkgPath = path.join(tmpDir, 'package.json')
  try { existingPkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) } catch { /* ignore */ }

  const finalPkg = {
    ...existingPkg,
    name: ebPkg.name,
    version: ebPkg.version,
    main: ebPkg.main,
    scripts: { ...(existingPkg.scripts as object ?? {}), ...ebPkg.scripts },
    build: ebPkg.build,
  }
  fs.writeFileSync(pkgPath, JSON.stringify(finalPkg, null, 2))

  onProgress('log', 'Installing Electron & electron-builder...')
  await runCommand(
    'npm install --save-dev electron@latest electron-builder@latest',
    tmpDir,
    onProgress
  )

  onProgress('log', 'Packaging as Windows EXE...')
  await runCommand('npm run package', tmpDir, onProgress)

  const electronDistDir = path.join(tmpDir, 'electron-dist')
  const entries = fs.readdirSync(electronDistDir)
  const exeFile = entries.find((f) => f.endsWith('.exe'))

  if (!exeFile) throw new Error('Packaging finished but no EXE found in output directory.')

  onProgress('log', `✓ EXE ready: ${exeFile}`)
  return path.join(electronDistDir, exeFile)
}
