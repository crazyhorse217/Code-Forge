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
    pickBackground(): Promise<{ dataUrl: string; filePath: string } | null>
    loadBackground(filePath: string): Promise<{ dataUrl: string; filePath: string } | null>
    pickIcon(): Promise<string | null>
    saveProject(data: object): Promise<boolean>
    loadProject(): Promise<Record<string, unknown> | null>
  }
}
