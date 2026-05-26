import path from 'path'
import fs from 'fs'
import os from 'os'
import { execSync } from 'child_process'
import { BuildConfig, ProgressCallback } from '../index'
import { runCommand } from '../utils'

function findPython(): string {
  for (const cmd of ['python', 'python3', 'py']) {
    try {
      execSync(`${cmd} --version`, { timeout: 5000, stdio: 'pipe' })
      return cmd
    } catch {
      // try next
    }
  }
  throw new Error('Python not found. Install Python 3 and ensure it is on your PATH.')
}

export async function buildPythonExe(
  files: Record<string, string>,
  config: BuildConfig,
  onProgress: ProgressCallback
): Promise<string> {
  const python = findPython()
  onProgress('log', `Using Python: ${python}`)

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'codeforge-py-'))
  onProgress('log', `Build workspace: ${tmpDir}`)

  const pyFiles = Object.entries(files).filter(([name]) => name.endsWith('.py'))
  if (pyFiles.length === 0) throw new Error('No .py files found in the provided code.')

  for (const [name, content] of pyFiles) {
    const dest = path.join(tmpDir, name)
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    fs.writeFileSync(dest, content, 'utf8')
  }

  // Also write non-py files (assets, data files, etc.)
  for (const [name, content] of Object.entries(files)) {
    if (!name.endsWith('.py')) {
      const dest = path.join(tmpDir, name)
      fs.mkdirSync(path.dirname(dest), { recursive: true })
      fs.writeFileSync(dest, content, 'utf8')
    }
  }

  // Determine entry point: prefer main.py, app.py, run.py, then first py file
  const entryPriority = ['main.py', 'app.py', 'run.py', '__main__.py']
  const entryPoint =
    entryPriority.find((n) => pyFiles.some(([f]) => f === n)) || pyFiles[0][0]

  onProgress('log', `Entry point: ${entryPoint}`)

  // Install / upgrade PyInstaller
  onProgress('log', 'Installing PyInstaller...')
  await runCommand(`${python} -m pip install pyinstaller --upgrade --quiet`, tmpDir, onProgress)

  const safeName = config.appName.replace(/[^a-zA-Z0-9_-]/g, '_') || 'MyApp'
  const distDir = path.join(tmpDir, 'dist')

  // Copy icon if provided
  let iconArg = ''
  if (config.iconPath && fs.existsSync(config.iconPath)) {
    const iconDest = path.join(tmpDir, path.basename(config.iconPath))
    fs.copyFileSync(config.iconPath, iconDest)
    iconArg = `--icon "${iconDest}"`
    onProgress('log', `Using icon: ${path.basename(config.iconPath)}`)
  }

  onProgress('log', `Compiling ${entryPoint} → ${safeName}.exe ...`)
  await runCommand(
    `${python} -m PyInstaller --onefile ${iconArg} --name "${safeName}" --distpath "${distDir}" --workpath "${path.join(tmpDir, 'build')}" --specpath "${tmpDir}" "${path.join(tmpDir, entryPoint)}"`,
    tmpDir,
    onProgress
  )

  const exePath = path.join(distDir, `${safeName}.exe`)
  if (!fs.existsSync(exePath)) {
    throw new Error('Build completed but EXE not found in dist/ directory.')
  }

  onProgress('log', `✓ EXE ready: ${safeName}.exe`)
  return exePath
}
