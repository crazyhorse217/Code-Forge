/// <reference types="vite/client" />

interface Window {
  api: {
    checkTools(): Promise<Record<string, string | false>>
    startBuild(files: Record<string, string>, config: object): void
    onBuildProgress(cb: (data: { type: string; data: string }) => void): () => void
    onBuildComplete(
      cb: (data: {
        success: boolean
        outputPaths?: Record<string, string>
        error?: string
      }) => void
    ): () => void
    saveFile(srcPath: string, defaultName: string): Promise<string | null>
    openFolder(folderPath: string): Promise<void>
    extractZip(zipPath: string): Promise<Record<string, string>>
    pickZip(): Promise<string | null>
    pickSourceFiles(): Promise<Array<{ name: string; content: string }>>
    extractZipBuffer(buffer: ArrayBuffer): Promise<Record<string, string>>
    pickBackground(): Promise<{ dataUrl: string; filePath: string } | null>
    loadBackground(filePath: string): Promise<{ dataUrl: string; filePath: string } | null>
    pickIcon(): Promise<string | null>
    saveProject(data: object): Promise<boolean>
    loadProject(): Promise<Record<string, unknown> | null>
    aiAnalyze(params: { files: Record<string, string>; errorLog?: string; apiKey: string }): void
    onAiChunk(cb: (text: string) => void): () => void
    onAiDone(cb: () => void): () => void
    onAiError(cb: (error: string) => void): () => void
    onUpdateAvailable(cb: (info: { version: string }) => void): () => void
    onUpdateDownloaded(cb: () => void): () => void
    installUpdate(): void
    previewApp(files: Record<string, string>): Promise<{ success?: boolean; error?: string }>
    listDrives(): Promise<Array<{ device: string; number: number; description: string; size: number; letters: string }>>
    pickIso(): Promise<{ path: string; size: number } | null>
    flashIso(isoPath: string, drivePath: string): void
    cancelFlash(): void
    onFlashProgress(cb: (p: { written: number; total: number; speed: number; eta: number }) => void): () => void
    onFlashComplete(cb: (result: { success: boolean; error?: string }) => void): () => void
    findSigntool(): Promise<string | null>
    pickCert(): Promise<string | null>
    signExe(params: { filePaths: string[]; certPath: string; password: string; tsServer: string; signtoolPath: string }): void
    onSignProgress(cb: (data: { file: string }) => void): () => void
    onSignComplete(cb: (result: { success: boolean; error?: string }) => void): () => void
    getFileSize(filePath: string): Promise<number | null>
    openUrl(url: string): Promise<void>
    publishRelease(params: { token: string; owner: string; repo: string; tag: string; title: string; notes: string; prerelease: boolean; filePaths: string[] }): void
    onPublishProgress(cb: (step: string) => void): () => void
    onPublishComplete(cb: (result: { success: boolean; url?: string; error?: string }) => void): () => void
  }
}
