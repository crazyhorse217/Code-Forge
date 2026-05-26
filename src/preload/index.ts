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
    ipcRenderer.invoke('preview-app', files)
})
