import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import path from 'path'
import { is } from '@electron-toolkit/utils'
import { execSync, spawn } from 'child_process'
import fs from 'fs'
import Anthropic from '@anthropic-ai/sdk'
import { autoUpdater } from 'electron-updater'
import { buildProject } from './build-engine/index'

let mainWindow: BrowserWindow | null = null

// ── Splash screen ─────────────────────────────────────────────────────────────
function createSplash(): BrowserWindow {
  const splash = new BrowserWindow({
    width: 480,
    height: 300,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    center: true,
    webPreferences: { contextIsolation: true }
  })

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:480px;height:300px;background:#0f172a;border-radius:16px;overflow:hidden;
    font-family:system-ui,sans-serif;display:flex;flex-direction:column;
    align-items:center;justify-content:center;position:relative;
    border:1px solid rgba(124,58,237,0.35);
    box-shadow:0 0 80px rgba(124,58,237,0.2),0 25px 60px rgba(0,0,0,0.6);}
  .glow{position:absolute;width:320px;height:220px;
    background:radial-gradient(ellipse,rgba(124,58,237,0.18) 0%,transparent 70%);
    top:50%;left:50%;transform:translate(-50%,-50%);
    animation:pulse 2.4s ease-in-out infinite;}
  @keyframes pulse{0%,100%{opacity:.5;transform:translate(-50%,-50%) scale(1)}
    50%{opacity:1;transform:translate(-50%,-50%) scale(1.12)}}
  .icon{font-size:52px;margin-bottom:10px;position:relative;z-index:1;
    animation:float 3s ease-in-out infinite;}
  @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
  .name{font-size:30px;font-weight:900;color:#fff;letter-spacing:3px;
    position:relative;z-index:1;text-shadow:0 0 40px rgba(167,139,250,0.6);}
  .name span{color:#a78bfa;}
  .tag{font-size:11px;color:#475569;margin-top:6px;position:relative;z-index:1;
    letter-spacing:2px;text-transform:uppercase;}
  .ver{font-size:10px;color:#334155;margin-top:3px;position:relative;z-index:1;}
  .dots{display:flex;gap:7px;margin-top:22px;position:relative;z-index:1;}
  .dot{width:6px;height:6px;border-radius:50%;background:#7c3aed;
    animation:bounce 1.2s ease-in-out infinite;}
  .dot:nth-child(2){animation-delay:.2s}.dot:nth-child(3){animation-delay:.4s}
  @keyframes bounce{0%,80%,100%{transform:scale(.55);opacity:.4}40%{transform:scale(1);opacity:1}}
  .bar{position:absolute;bottom:0;left:0;right:0;height:3px;background:rgba(124,58,237,.12);}
  .fill{height:100%;background:linear-gradient(90deg,#4c1d95,#7c3aed,#a78bfa,#7c3aed,#4c1d95);
    background-size:300% 100%;
    animation:grow 2.6s cubic-bezier(.4,0,.2,1) forwards,shine 1.8s linear infinite;}
  @keyframes grow{0%{width:0%}50%{width:65%}85%{width:90%}100%{width:100%}}
  @keyframes shine{0%{background-position:100% 0}100%{background-position:-200% 0}}
  .corner{position:absolute;width:28px;height:28px;border-color:rgba(124,58,237,.25);border-style:solid;}
  .tl{top:14px;left:14px;border-width:2px 0 0 2px;border-radius:4px 0 0 0}
  .tr{top:14px;right:14px;border-width:2px 2px 0 0;border-radius:0 4px 0 0}
  .bl{bottom:14px;left:14px;border-width:0 0 2px 2px;border-radius:0 0 0 4px}
  .br{bottom:14px;right:14px;border-width:0 2px 2px 0;border-radius:0 0 4px 0}
  </style></head><body>
  <div class="glow"></div>
  <div class="corner tl"></div><div class="corner tr"></div>
  <div class="corner bl"></div><div class="corner br"></div>
  <div class="icon">🔨</div>
  <div class="name">Code<span>Forge</span></div>
  <div class="tag">Source Code → Real Apps</div>
  <div class="ver">v1.0.0</div>
  <div class="dots"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>
  <div class="bar"><div class="fill"></div></div>
  </body></html>`

  splash.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html))
  return splash
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    show: false,                     // hidden until splash is done
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    },
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#0f172a',
      symbolColor: '#94a3b8',
      height: 36
    }
  })

  mainWindow.on('closed', () => { mainWindow = null })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

const MIN_SPLASH_MS = is.dev ? 1200 : 2600   // shorter in dev

app.whenReady().then(() => {
  const splash = createSplash()
  const splashShown = Date.now()

  createWindow()

  mainWindow!.once('ready-to-show', () => {
    const wait = Math.max(0, MIN_SPLASH_MS - (Date.now() - splashShown))
    setTimeout(() => {
      splash.destroy()
      mainWindow?.show()
      mainWindow?.focus()
    }, wait)
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  // ── Auto-updater (packaged builds only) ─────────────────────────────────────
  if (!is.dev) {
    autoUpdater.autoDownload = true
    autoUpdater.autoInstallOnAppQuit = true

    autoUpdater.on('update-available', (info) => {
      mainWindow?.webContents.send('update-available', { version: info.version })
    })

    autoUpdater.on('update-downloaded', () => {
      mainWindow?.webContents.send('update-downloaded')
    })

    autoUpdater.on('error', (err) => {
      console.error('[AutoUpdater]', err.message)
    })

    autoUpdater.checkForUpdates().catch(console.error)
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// ── IPC: Check available build tools ──────────────────────────────────────────
ipcMain.handle('check-tools', async () => {
  const check = (cmd: string): string | false => {
    try {
      return execSync(cmd, { timeout: 5000, stdio: 'pipe' }).toString().trim()
    } catch {
      return false
    }
  }

  // Android SDK: prefer env vars, then scan common installation paths
  let androidSdk: string | false =
    process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || false

  if (!androidSdk) {
    const candidates = [
      path.join(process.env.LOCALAPPDATA ?? '', 'Android', 'Sdk'),
      path.join(process.env.USERPROFILE ?? '', 'AppData', 'Local', 'Android', 'Sdk'),
      'C:\\Android\\Sdk',
      path.join(process.env.USERPROFILE ?? '', 'Android', 'Sdk'),
    ]
    for (const p of candidates) {
      try {
        if (fs.existsSync(p) && fs.existsSync(path.join(p, 'platform-tools'))) {
          androidSdk = p
          break
        }
      } catch { /* skip */ }
    }
  }

  // Android Studio installation path
  let androidStudioPath: string | false = false
  const studioCandidates = [
    'C:\\Program Files\\Android\\Android Studio',
    path.join(process.env.LOCALAPPDATA ?? '', 'Programs', 'Android Studio'),
    path.join(process.env.ProgramFiles ?? '', 'Android', 'Android Studio'),
  ]
  for (const p of studioCandidates) {
    try { if (fs.existsSync(p)) { androidStudioPath = p; break } } catch { /* skip */ }
  }

  return {
    node: check('node --version'),
    python: check('python --version') || check('python3 --version'),
    java: (() => {
      try {
        return execSync('java -version 2>&1', { timeout: 5000 }).toString().trim()
      } catch {
        return false
      }
    })(),
    androidSdk,
    androidStudioPath,
    adb: check('adb version'),
    pkg: check('pkg --version'),
    pyinstaller: check('pyinstaller --version')
  }
})

// ── IPC: Open external URL in default browser ─────────────────────────────
ipcMain.handle('open-url', async (_event, url: string) => {
  if (typeof url === 'string' && (url.startsWith('https://') || url.startsWith('http://'))) {
    await shell.openExternal(url)
  }
})

// ── IPC: Start build ──────────────────────────────────────────────────────────
ipcMain.on('start-build', (event, { files, config }) => {
  const sender = event.sender

  buildProject(files, config, (type, data) => {
    if (!sender.isDestroyed()) {
      sender.send('build-progress', { type, data })
    }
  })
    .then((outputPaths) => {
      if (!sender.isDestroyed()) {
        sender.send('build-complete', { success: true, outputPaths })
      }
    })
    .catch((err: Error) => {
      if (!sender.isDestroyed()) {
        sender.send('build-complete', { success: false, error: err.message })
      }
    })
})

// ── IPC: Save output file ─────────────────────────────────────────────────────
ipcMain.handle('save-file', async (_, { srcPath, defaultName }) => {
  const ext = defaultName.split('.').pop() || '*'
  const { filePath, canceled } = await dialog.showSaveDialog(mainWindow!, {
    defaultPath: defaultName,
    filters: [{ name: ext.toUpperCase() + ' File', extensions: [ext] }]
  })

  if (canceled || !filePath) return null

  fs.copyFileSync(srcPath, filePath)
  return filePath
})

// ── IPC: Open folder in Explorer ──────────────────────────────────────────────
ipcMain.handle('open-folder', async (_, folderPath: string) => {
  shell.openPath(folderPath)
})

// ── IPC: Extract ZIP and return files as { path: content } ───────────────────
ipcMain.handle('extract-zip', async (_, zipPath: string) => {
  const AdmZip = (await import('adm-zip')).default
  const zip = new AdmZip(zipPath)
  const result: Record<string, string> = {}

  for (const entry of zip.getEntries()) {
    if (entry.isDirectory) continue
    const name = entry.entryName
    if (name.startsWith('__MACOSX') || name.startsWith('.')) continue
    try {
      result[name] = entry.getData().toString('utf8')
    } catch {
      // skip binary files
    }
  }
  return result
})

// ── IPC: Pick background photo → return as base64 data URL ───────────────────
function imageToDataUrl(filePath: string): { dataUrl: string; filePath: string } {
  const buf = fs.readFileSync(filePath)
  const ext = path.extname(filePath).slice(1).toLowerCase()
  const mime: Record<string, string> = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
    webp: 'image/webp', gif: 'image/gif', bmp: 'image/bmp',
    tiff: 'image/tiff', avif: 'image/avif'
  }
  return {
    dataUrl: `data:${mime[ext] ?? 'image/jpeg'};base64,${buf.toString('base64')}`,
    filePath
  }
}

ipcMain.handle('pick-background', async () => {
  console.log('[pick-background] opening dialog, mainWindow=', !!mainWindow)
  const { filePaths, canceled } = await dialog.showOpenDialog(mainWindow!, {
    title: 'Select Background Photo',
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'tiff', 'avif'] }],
    properties: ['openFile']
  })
  console.log('[pick-background] canceled=', canceled, 'filePaths=', filePaths)
  if (canceled || filePaths.length === 0) return null
  return imageToDataUrl(filePaths[0])
})

ipcMain.handle('load-background', async (_, filePath: string) => {
  if (!filePath || !fs.existsSync(filePath)) return null
  return imageToDataUrl(filePath)
})

// ── IPC: Open icon picker dialog ──────────────────────────────────────────────
ipcMain.handle('pick-icon', async () => {
  console.log('[pick-icon] opening dialog, mainWindow=', !!mainWindow)
  const { filePaths, canceled } = await dialog.showOpenDialog(mainWindow!, {
    title: 'Select App Icon',
    filters: [{ name: 'Images', extensions: ['png', 'ico', 'jpg', 'jpeg', 'svg'] }],
    properties: ['openFile']
  })
  return canceled || filePaths.length === 0 ? null : filePaths[0]
})

// ── IPC: Save project ─────────────────────────────────────────────────────────
ipcMain.handle('save-project', async (_, data: object) => {
  const { filePath, canceled } = await dialog.showSaveDialog(mainWindow!, {
    title: 'Save CodeForge Project',
    defaultPath: 'project.codeforge',
    filters: [{ name: 'CodeForge Project', extensions: ['codeforge'] }]
  })
  if (canceled || !filePath) return false
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8')
  return true
})

// ── IPC: Load project ─────────────────────────────────────────────────────────
ipcMain.handle('load-project', async () => {
  const { filePaths, canceled } = await dialog.showOpenDialog(mainWindow!, {
    title: 'Open CodeForge Project',
    filters: [{ name: 'CodeForge Project', extensions: ['codeforge'] }],
    properties: ['openFile']
  })
  if (canceled || filePaths.length === 0) return null
  try {
    return JSON.parse(fs.readFileSync(filePaths[0], 'utf8'))
  } catch {
    return null
  }
})

// ── IPC: AI code analysis (streaming) ────────────────────────────────────────
ipcMain.on('ai-analyze', (event, { files, errorLog, apiKey }: {
  files: Record<string, string>
  errorLog?: string
  apiKey: string
}) => {
  const sender = event.sender

  const client = new Anthropic({ apiKey })

  const fileContents = Object.entries(files)
    .slice(0, 10)
    .map(([name, content]) => `### ${name}\n\`\`\`\n${content.slice(0, 3000)}\n\`\`\``)
    .join('\n\n')

  const analyzePrompt = `You are an expert developer assistant inside CodeForge, a desktop app that compiles source code into EXE/APK files.

Analyze the following project files and provide:
1. A brief description of what the project does
2. Any code issues that might prevent a successful build
3. Specific build recommendations

Then end your response with a JSON config block like this:
\`\`\`json
{"appName": "MyApp", "language": "html", "version": "1.0.0"}
\`\`\`
Valid language values: auto, html, python, nodejs, react-native

## Project Files:
${fileContents}`

  const fixPrompt = `You are an expert developer assistant inside CodeForge, a desktop app that compiles source code into EXE/APK files.

The user's build failed. Analyze the code and error and provide:
1. A clear explanation of what went wrong
2. The exact code changes needed to fix it
3. Any other issues to watch for

## Project Files:
${fileContents}

## Build Error:
${errorLog}`

  ;(async () => {
    try {
      const stream = client.messages.stream({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1500,
        messages: [{ role: 'user', content: errorLog ? fixPrompt : analyzePrompt }]
      })

      stream.on('text', (text) => {
        if (!sender.isDestroyed()) sender.send('ai-chunk', text)
      })

      await stream.finalMessage()
      if (!sender.isDestroyed()) sender.send('ai-done')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      if (!sender.isDestroyed()) sender.send('ai-error', message)
    }
  })()
})

// ── IPC: Install downloaded update ────────────────────────────────────────────
ipcMain.on('install-update', () => {
  autoUpdater.quitAndInstall()
})

// ── IPC: List USB drives (Windows PowerShell) ─────────────────────────────────
ipcMain.handle('list-drives', async () => {
  const tmpScript = path.join(app.getPath('temp'), 'cf-listdrives.ps1')
  const script = `
$result = @()
foreach ($disk in (Get-Disk | Where-Object {$_.BusType -eq 'USB'})) {
  try {
    $vols = Get-Partition -DiskNumber $disk.Number -ErrorAction SilentlyContinue |
            Get-Volume -ErrorAction SilentlyContinue
    $letters = if ($vols) { ($vols.DriveLetter | Where-Object {$_}) -join ',' } else { '' }
  } catch { $letters = '' }
  $result += [PSCustomObject]@{
    device      = '\\\\.\\PhysicalDrive' + $disk.Number
    number      = [int]$disk.Number
    description = [string]$disk.FriendlyName
    size        = [long]$disk.Size
    letters     = $letters
  }
}
if ($result.Count -eq 0) { '[]' } else { ConvertTo-Json $result }
`
  try {
    fs.writeFileSync(tmpScript, script, 'utf8')
    const out = execSync(`powershell -NoProfile -NonInteractive -File "${tmpScript}"`, {
      timeout: 15000,
      windowsHide: true,
      encoding: 'utf8'
    }).trim()
    try { fs.unlinkSync(tmpScript) } catch { /* ignore */ }
    if (!out || out === '[]') return []
    const parsed = JSON.parse(out)
    return Array.isArray(parsed) ? parsed : [parsed]
  } catch {
    try { fs.unlinkSync(tmpScript) } catch { /* ignore */ }
    return []
  }
})

// ── IPC: Pick ISO file ────────────────────────────────────────────────────────
ipcMain.handle('pick-iso', async () => {
  const { filePaths, canceled } = await dialog.showOpenDialog(mainWindow!, {
    title: 'Select ISO Image',
    filters: [{ name: 'ISO Images', extensions: ['iso', 'img'] }],
    properties: ['openFile']
  })
  if (canceled || filePaths.length === 0) return null
  const p = filePaths[0]
  const size = fs.statSync(p).size
  return { path: p, size }
})

// ── IPC: Flash ISO to physical drive ─────────────────────────────────────────
let flashCancelled = false

ipcMain.on('flash-iso', (event, { isoPath, drivePath }: { isoPath: string; drivePath: string }) => {
  const sender = event.sender
  flashCancelled = false

  const CHUNK = 4 * 1024 * 1024 // 4 MB

  ;(async () => {
    let isoHandle: fs.promises.FileHandle | null = null
    let driveHandle: fs.promises.FileHandle | null = null

    try {
      const isoSize = fs.statSync(isoPath).size
      isoHandle = await fs.promises.open(isoPath, 'r')

      try {
        driveHandle = await fs.promises.open(drivePath, 'r+')
      } catch (err: unknown) {
        const e = err as NodeJS.ErrnoException
        if (!sender.isDestroyed()) {
          sender.send('flash-complete', {
            success: false,
            error: e.code === 'EACCES' ? 'needs-admin' : (e.message || String(err))
          })
        }
        return
      }

      const buf = Buffer.alloc(CHUNK)
      let written = 0
      let speedStart = Date.now()
      let speedBytes = 0

      while (!flashCancelled) {
        const { bytesRead } = await isoHandle.read(buf, 0, CHUNK, written)
        if (bytesRead === 0) break

        // Align write size to 512-byte sector boundary for raw device
        const aligned = bytesRead % 512 === 0 ? bytesRead : bytesRead + (512 - bytesRead % 512)
        if (aligned > bytesRead) buf.fill(0, bytesRead, aligned)

        await driveHandle.write(buf, 0, aligned, written)
        written += bytesRead   // track real bytes, not padded
        speedBytes += bytesRead

        const now = Date.now()
        if (now - speedStart >= 400 && !sender.isDestroyed()) {
          const speed = (speedBytes / (now - speedStart)) * 1000
          const eta = speed > 0 ? (isoSize - written) / speed : 0
          sender.send('flash-progress', { written, total: isoSize, speed, eta })
          speedStart = now
          speedBytes = 0
        }
      }

      if (!sender.isDestroyed()) {
        if (flashCancelled) {
          sender.send('flash-complete', { success: false, error: 'cancelled' })
        } else {
          sender.send('flash-progress', { written, total: written, speed: 0, eta: 0 })
          sender.send('flash-complete', { success: true })
        }
      }
    } catch (err: unknown) {
      const e = err as NodeJS.ErrnoException
      if (!sender.isDestroyed()) {
        sender.send('flash-complete', {
          success: false,
          error: e.code === 'EACCES' ? 'needs-admin' : (e.message || String(err))
        })
      }
    } finally {
      await isoHandle?.close().catch(() => { /* ignore */ })
      await driveHandle?.close().catch(() => { /* ignore */ })
    }
  })()
})

ipcMain.on('cancel-flash', () => {
  flashCancelled = true
})

// ── IPC: Find signtool.exe ────────────────────────────────────────────────────
ipcMain.handle('find-signtool', () => {
  const bases = [
    'C:\\Program Files (x86)\\Windows Kits\\10\\bin',
    'C:\\Program Files\\Windows Kits\\10\\bin'
  ]
  for (const base of bases) {
    if (!fs.existsSync(base)) continue
    try {
      const versions = fs.readdirSync(base)
        .filter((d) => /^\d+\.\d+\./.test(d))
        .sort()
        .reverse()
      for (const v of versions) {
        const candidate = path.join(base, v, 'x64', 'signtool.exe')
        if (fs.existsSync(candidate)) return candidate
      }
    } catch { /* skip */ }
  }
  return null
})

// ── IPC: Pick a ZIP file (returns path) ──────────────────────────────────────
ipcMain.handle('pick-zip', async () => {
  const { filePaths, canceled } = await dialog.showOpenDialog(mainWindow!, {
    title: 'Import ZIP Project',
    filters: [{ name: 'ZIP Archives', extensions: ['zip'] }],
    properties: ['openFile']
  })
  return canceled || filePaths.length === 0 ? null : filePaths[0]
})

// ── IPC: Pick source files and return name+content pairs ──────────────────────
ipcMain.handle('pick-source-files', async () => {
  const { filePaths, canceled } = await dialog.showOpenDialog(mainWindow!, {
    title: 'Import Source Files',
    filters: [
      {
        name: 'Source Files',
        extensions: ['html', 'htm', 'css', 'js', 'jsx', 'ts', 'tsx', 'py',
                     'json', 'md', 'xml', 'sh', 'yaml', 'yml', 'txt', 'env', 'toml']
      },
      { name: 'All Files', extensions: ['*'] }
    ],
    properties: ['openFile', 'multiSelections']
  })
  if (canceled || filePaths.length === 0) return []
  return filePaths.map((fp) => ({
    name: path.basename(fp),
    content: (() => { try { return fs.readFileSync(fp, 'utf8') } catch { return '' } })()
  }))
})

// ── IPC: Extract ZIP from a raw buffer (fallback when path is unavailable) ────
ipcMain.handle('extract-zip-buffer', async (_, buffer: ArrayBuffer) => {
  const AdmZip = (await import('adm-zip')).default
  const zip = new AdmZip(Buffer.from(buffer))
  const result: Record<string, string> = {}
  for (const entry of zip.getEntries()) {
    if (entry.isDirectory) continue
    const name = entry.entryName
    if (name.startsWith('__MACOSX') || name.startsWith('.')) continue
    try { result[name] = entry.getData().toString('utf8') } catch { /* skip binary */ }
  }
  return result
})

// ── IPC: Pick .pfx certificate file ──────────────────────────────────────────
ipcMain.handle('pick-cert', async () => {
  const { filePaths, canceled } = await dialog.showOpenDialog(mainWindow!, {
    title: 'Select Code Signing Certificate',
    filters: [{ name: 'PFX Certificate', extensions: ['pfx', 'p12'] }],
    properties: ['openFile']
  })
  return canceled || filePaths.length === 0 ? null : filePaths[0]
})

// ── IPC: Sign EXE files with signtool ────────────────────────────────────────
ipcMain.on('sign-exe', (event, {
  filePaths, certPath, password, tsServer, signtoolPath
}: {
  filePaths: string[]
  certPath: string
  password: string
  tsServer: string
  signtoolPath: string
}) => {
  const sender = event.sender

  const runSigntool = (filePath: string): Promise<void> =>
    new Promise((resolve, reject) => {
      const proc = spawn(signtoolPath, [
        'sign',
        '/f', certPath,
        '/p', password,
        '/tr', tsServer,
        '/td', 'sha256',
        '/fd', 'sha256',
        filePath
      ], { windowsHide: true })

      let stderr = ''
      let stdout = ''
      proc.stdout?.on('data', (d: Buffer) => { stdout += d.toString() })
      proc.stderr?.on('data', (d: Buffer) => { stderr += d.toString() })
      proc.on('close', (code) => {
        if (code === 0) resolve()
        else reject(new Error(stderr || stdout || `signtool exited with code ${code}`))
      })
      proc.on('error', reject)
    })

  ;(async () => {
    try {
      for (const filePath of filePaths) {
        if (!filePath.endsWith('.exe')) continue
        if (!sender.isDestroyed()) sender.send('sign-progress', { file: path.basename(filePath) })
        await runSigntool(filePath)
      }
      if (!sender.isDestroyed()) sender.send('sign-complete', { success: true })
    } catch (err: unknown) {
      if (!sender.isDestroyed()) {
        sender.send('sign-complete', {
          success: false,
          error: err instanceof Error ? err.message : String(err)
        })
      }
    }
  })()
})

// ── IPC: Get file size ────────────────────────────────────────────────────────
ipcMain.handle('get-file-size', (_, filePath: string) => {
  try {
    return fs.statSync(filePath).size
  } catch {
    return null
  }
})

// ── IPC: Publish GitHub release + upload assets ───────────────────────────────
ipcMain.on('publish-release', (event, {
  token, owner, repo, tag, title, notes, prerelease, filePaths
}: {
  token: string
  owner: string
  repo: string
  tag: string
  title: string
  notes: string
  prerelease: boolean
  filePaths: string[]
}) => {
  const sender = event.sender

  ;(async () => {
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'CodeForge/1.0.0',
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    }

    try {
      // Step 1: Create the release
      if (!sender.isDestroyed()) sender.send('publish-progress', 'Creating release on GitHub…')

      const createRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ tag_name: tag, name: title, body: notes, prerelease, draft: false })
      })

      if (!createRes.ok) {
        const body = await createRes.json() as { message?: string; errors?: Array<{ message?: string }> }
        const msg = body.errors?.[0]?.message ?? body.message ?? `HTTP ${createRes.status}`
        throw new Error(msg)
      }

      const release = await createRes.json() as { id: number; html_url: string }

      // Step 2: Upload each asset
      const validPaths = filePaths.filter((p) => p && fs.existsSync(p))

      for (const filePath of validPaths) {
        const filename = path.basename(filePath)
        if (!sender.isDestroyed()) sender.send('publish-progress', `Uploading ${filename}…`)

        const ext = path.extname(filename).slice(1).toLowerCase()
        const contentType =
          ext === 'exe' ? 'application/vnd.microsoft.portable-executable' :
          ext === 'apk' ? 'application/vnd.android.package-archive' :
          'application/octet-stream'

        const fileBuffer = fs.readFileSync(filePath)
        const uploadUrl = `https://uploads.github.com/repos/${owner}/${repo}/releases/${release.id}/assets?name=${encodeURIComponent(filename)}`

        const uploadRes = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': contentType,
            'User-Agent': 'CodeForge/1.0.0',
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28'
          },
          // @ts-ignore — Node 18+ fetch accepts Buffer as body
          body: fileBuffer,
          duplex: 'half'
        } as RequestInit)

        if (!uploadRes.ok) {
          const body = await uploadRes.json() as { message?: string }
          throw new Error(`Upload failed: ${body.message ?? `HTTP ${uploadRes.status}`}`)
        }
      }

      if (!sender.isDestroyed()) {
        sender.send('publish-complete', { success: true, url: release.html_url })
      }
    } catch (err: unknown) {
      if (!sender.isDestroyed()) {
        sender.send('publish-complete', {
          success: false,
          error: err instanceof Error ? err.message : String(err)
        })
      }
    }
  })()
})

// ── IPC: Preview web app in sandboxed window ──────────────────────────────────
ipcMain.handle('preview-app', async (_, files: Record<string, string>) => {
  const tmpDir = path.join(app.getPath('temp'), 'codeforge-preview')

  try {
    if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true })
    fs.mkdirSync(tmpDir, { recursive: true })

    for (const [name, content] of Object.entries(files)) {
      const dest = path.join(tmpDir, name)
      fs.mkdirSync(path.dirname(dest), { recursive: true })
      fs.writeFileSync(dest, content, 'utf8')
    }

    const entry =
      Object.keys(files).find((f) => f === 'index.html') ??
      Object.keys(files).find((f) => f.endsWith('/index.html')) ??
      Object.keys(files).find((f) => f.endsWith('.html'))

    if (!entry) return { error: 'No HTML file found to preview' }

    const previewWin = new BrowserWindow({
      width: 1200,
      height: 800,
      title: `Preview — ${entry}`,
      parent: mainWindow ?? undefined,
      autoHideMenuBar: true,
      webPreferences: {
        sandbox: true,
        contextIsolation: true,
        nodeIntegration: false
      }
    })

    previewWin.loadFile(path.join(tmpDir, entry))
    return { success: true }
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : String(err) }
  }
})
