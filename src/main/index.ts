import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import path from 'path'
import { is } from '@electron-toolkit/utils'
import { execSync } from 'child_process'
import fs from 'fs'
import { buildProject } from './build-engine/index'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
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

  mainWindow.on('ready-to-show', () => mainWindow!.show())
  mainWindow.on('closed', () => { mainWindow = null })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
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
    androidSdk: process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || false,
    pkg: check('pkg --version'),
    pyinstaller: check('pyinstaller --version')
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
