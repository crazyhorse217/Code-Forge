import path from 'path'
import fs from 'fs'
import os from 'os'
import { BuildConfig, ProgressCallback } from '../index'
import { runCommand } from '../utils'

export async function buildWebApk(
  files: Record<string, string>,
  config: BuildConfig,
  onProgress: ProgressCallback
): Promise<string> {
  const androidHome = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT
  if (!androidHome) {
    throw new Error(
      'Android SDK not found.\n' +
        'Install Android Studio, then set the ANDROID_HOME environment variable.\n' +
        'Also ensure Java 17+ is installed and on your PATH.'
    )
  }

  // Quick Java check
  try {
    const { execSync } = require('child_process')
    execSync('java -version 2>&1', { timeout: 5000 })
  } catch {
    throw new Error('Java not found. Install JDK 17+ and ensure "java" is on your PATH.')
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'codeforge-apk-'))
  onProgress('log', `Build workspace: ${tmpDir}`)

  const safeId = config.appName.toLowerCase().replace(/[^a-z0-9]/g, '')
  const safeName = config.appName.replace(/[^a-zA-Z0-9 _-]/g, '')
  const appId = `com.codeforge.${safeId || 'app'}`

  // Write web files to www/
  const wwwDir = path.join(tmpDir, 'www')
  fs.mkdirSync(wwwDir, { recursive: true })
  for (const [name, content] of Object.entries(files)) {
    const dest = path.join(wwwDir, name)
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    fs.writeFileSync(dest, content, 'utf8')
  }

  // Minimal package.json for Capacitor
  const pkg = {
    name: safeId || 'myapp',
    version: config.version || '1.0.0',
    scripts: { build: 'echo ok' },
    dependencies: {
      '@capacitor/core': '^6.0.0',
      '@capacitor/android': '^6.0.0'
    },
    devDependencies: {
      '@capacitor/cli': '^6.0.0'
    }
  }
  fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify(pkg, null, 2))

  // capacitor.config.json
  const capConfig = {
    appId,
    appName: safeName,
    webDir: 'www',
    server: { androidScheme: 'https' }
  }
  fs.writeFileSync(
    path.join(tmpDir, 'capacitor.config.json'),
    JSON.stringify(capConfig, null, 2)
  )

  onProgress('log', 'Installing Capacitor...')
  await runCommand('npm install', tmpDir, onProgress)

  onProgress('log', 'Adding Android platform...')
  await runCommand('npx cap add android', tmpDir, onProgress)

  onProgress('log', 'Syncing web assets...')
  await runCommand('npx cap sync android', tmpDir, onProgress)

  onProgress('log', 'Building debug APK with Gradle (may take several minutes)...')
  const androidDir = path.join(tmpDir, 'android')
  const gradleCmd = process.platform === 'win32' ? 'gradlew.bat assembleDebug' : './gradlew assembleDebug'
  await runCommand(gradleCmd, androidDir, onProgress, { ANDROID_HOME: androidHome })

  const apkPath = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk')
  if (!fs.existsSync(apkPath)) {
    throw new Error('Build finished but APK not found at expected path.')
  }

  onProgress('log', '✓ APK ready')
  return apkPath
}
