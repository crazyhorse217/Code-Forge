import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  checkTools: (): Promise<Record<string, string | false>> =>
    ipcRenderer.invoke('check-tools'),

  startBuild: (files: Record<string, string>, config: object): void => {
    ipcRenderer.send('start-build', { files, config })
  },

  onBuildProgress: (cb: (data: { type: string; data: string }) => void): (() => void) => {
    const handler = (_: Electron.IpcRendererEvent, data: { type: string; data: string }): void =>
      cb(data)
    ipcRenderer.on('build-progress', handler)
    return () => ipcRenderer.removeListener('build-progress', handler)
  },

  onBuildComplete: (
    cb: (data: { success: boolean; outputPaths?: Record<string, string>; error?: string }) => void
  ): (() => void) => {
    const handler = (
      _: Electron.IpcRendererEvent,
      data: { success: boolean; outputPaths?: Record<string, string>; error?: string }
    ): void => cb(data)
    ipcRenderer.on('build-complete', handler)
    return () => ipcRenderer.removeListener('build-complete', handler)
  },

  saveFile: (srcPath: string, defaultName: string): Promise<string | null> =>
    ipcRenderer.invoke('save-file', { srcPath, defaultName }),

  openFolder: (folderPath: string): Promise<void> =>
    ipcRenderer.invoke('open-folder', folderPath),

  extractZip: (zipPath: string): Promise<Record<string, string>> =>
    ipcRenderer.invoke('extract-zip', zipPath),

  pickZip: (): Promise<string | null> =>
    ipcRenderer.invoke('pick-zip'),

  pickSourceFiles: (): Promise<Array<{ name: string; content: string }>> =>
    ipcRenderer.invoke('pick-source-files'),

  extractZipBuffer: (buffer: ArrayBuffer): Promise<Record<string, string>> =>
    ipcRenderer.invoke('extract-zip-buffer', buffer),

  pickBackground: (): Promise<{ dataUrl: string; filePath: string } | null> =>
    ipcRenderer.invoke('pick-background'),

  loadBackground: (filePath: string): Promise<{ dataUrl: string; filePath: string } | null> =>
    ipcRenderer.invoke('load-background', filePath),

  pickIcon: (): Promise<string | null> =>
    ipcRenderer.invoke('pick-icon'),

  saveProject: (data: object): Promise<boolean> =>
    ipcRenderer.invoke('save-project', data),

  loadProject: (): Promise<Record<string, unknown> | null> =>
    ipcRenderer.invoke('load-project'),

  aiAnalyze: (params: { files: Record<string, string>; errorLog?: string; apiKey: string }): void => {
    ipcRenderer.send('ai-analyze', params)
  },

  onAiChunk: (cb: (text: string) => void): (() => void) => {
    const handler = (_: Electron.IpcRendererEvent, text: string): void => cb(text)
    ipcRenderer.on('ai-chunk', handler)
    return () => ipcRenderer.removeListener('ai-chunk', handler)
  },

  onAiDone: (cb: () => void): (() => void) => {
    const handler = (): void => cb()
    ipcRenderer.on('ai-done', handler)
    return () => ipcRenderer.removeListener('ai-done', handler)
  },

  onAiError: (cb: (error: string) => void): (() => void) => {
    const handler = (_: Electron.IpcRendererEvent, error: string): void => cb(error)
    ipcRenderer.on('ai-error', handler)
    return () => ipcRenderer.removeListener('ai-error', handler)
  },

  // ── Auto-updater ──────────────────────────────────────────────────────────
  onUpdateAvailable: (cb: (info: { version: string }) => void): (() => void) => {
    const handler = (_: Electron.IpcRendererEvent, info: { version: string }): void => cb(info)
    ipcRenderer.on('update-available', handler)
    return () => ipcRenderer.removeListener('update-available', handler)
  },

  onUpdateDownloaded: (cb: () => void): (() => void) => {
    const handler = (): void => cb()
    ipcRenderer.on('update-downloaded', handler)
    return () => ipcRenderer.removeListener('update-downloaded', handler)
  },

  installUpdate: (): void => {
    ipcRenderer.send('install-update')
  },

  // ── Preview window ────────────────────────────────────────────────────────
  previewApp: (files: Record<string, string>): Promise<{ success?: boolean; error?: string }> =>
    ipcRenderer.invoke('preview-app', files),

  // ── ISO Flasher ───────────────────────────────────────────────────────────
  listDrives: (): Promise<Array<{ device: string; number: number; description: string; size: number; letters: string }>> =>
    ipcRenderer.invoke('list-drives'),

  pickIso: (): Promise<{ path: string; size: number } | null> =>
    ipcRenderer.invoke('pick-iso'),

  flashIso: (isoPath: string, drivePath: string): void => {
    ipcRenderer.send('flash-iso', { isoPath, drivePath })
  },

  cancelFlash: (): void => {
    ipcRenderer.send('cancel-flash')
  },

  onFlashProgress: (cb: (p: { written: number; total: number; speed: number; eta: number }) => void): (() => void) => {
    const handler = (_: Electron.IpcRendererEvent, p: { written: number; total: number; speed: number; eta: number }): void => cb(p)
    ipcRenderer.on('flash-progress', handler)
    return () => ipcRenderer.removeListener('flash-progress', handler)
  },

  onFlashComplete: (cb: (result: { success: boolean; error?: string }) => void): (() => void) => {
    const handler = (_: Electron.IpcRendererEvent, result: { success: boolean; error?: string }): void => cb(result)
    ipcRenderer.on('flash-complete', handler)
    return () => ipcRenderer.removeListener('flash-complete', handler)
  },

  // ── Code signing ──────────────────────────────────────────────────────────
  findSigntool: (): Promise<string | null> =>
    ipcRenderer.invoke('find-signtool'),

  pickCert: (): Promise<string | null> =>
    ipcRenderer.invoke('pick-cert'),

  signExe: (params: { filePaths: string[]; certPath: string; password: string; tsServer: string; signtoolPath: string }): void => {
    ipcRenderer.send('sign-exe', params)
  },

  onSignProgress: (cb: (data: { file: string }) => void): (() => void) => {
    const handler = (_: Electron.IpcRendererEvent, data: { file: string }): void => cb(data)
    ipcRenderer.on('sign-progress', handler)
    return () => ipcRenderer.removeListener('sign-progress', handler)
  },

  onSignComplete: (cb: (result: { success: boolean; error?: string }) => void): (() => void) => {
    const handler = (_: Electron.IpcRendererEvent, result: { success: boolean; error?: string }): void => cb(result)
    ipcRenderer.on('sign-complete', handler)
    return () => ipcRenderer.removeListener('sign-complete', handler)
  },

  // ── File utilities ────────────────────────────────────────────────────────
  getFileSize: (filePath: string): Promise<number | null> =>
    ipcRenderer.invoke('get-file-size', filePath),

  // ── GitHub publisher ──────────────────────────────────────────────────────
  publishRelease: (params: {
    token: string; owner: string; repo: string; tag: string
    title: string; notes: string; prerelease: boolean; filePaths: string[]
  }): void => {
    ipcRenderer.send('publish-release', params)
  },

  onPublishProgress: (cb: (step: string) => void): (() => void) => {
    const handler = (_: Electron.IpcRendererEvent, step: string): void => cb(step)
    ipcRenderer.on('publish-progress', handler)
    return () => ipcRenderer.removeListener('publish-progress', handler)
  },

  onPublishComplete: (cb: (result: { success: boolean; url?: string; error?: string }) => void): (() => void) => {
    const handler = (_: Electron.IpcRendererEvent, result: { success: boolean; url?: string; error?: string }): void => cb(result)
    ipcRenderer.on('publish-complete', handler)
    return () => ipcRenderer.removeListener('publish-complete', handler)
  }
})
