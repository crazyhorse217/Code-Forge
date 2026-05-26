import { spawn } from 'child_process'
import { ProgressCallback } from './index'

export function runCommand(
  cmd: string,
  cwd: string,
  onProgress: ProgressCallback,
  env?: NodeJS.ProcessEnv
): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, [], {
      cwd,
      shell: true,
      env: { ...process.env, ...env }
    })

    proc.stdout.on('data', (d) => {
      const line = d.toString().trim()
      if (line) onProgress('log', line)
    })

    proc.stderr.on('data', (d) => {
      const line = d.toString().trim()
      if (line) onProgress('log', line)
    })

    proc.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`Command failed (exit ${code}): ${cmd}`))
    })

    proc.on('error', reject)
  })
}
