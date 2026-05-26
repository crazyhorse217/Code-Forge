export type Language = 'html' | 'python' | 'nodejs' | 'react-native' | 'unknown'

export function detectLanguage(files: Record<string, string>): Language {
  const names = Object.keys(files)
  const allContent = Object.values(files).join('\n')

  // React Native: look for import from 'react-native'
  if (
    names.some((f) => f.match(/App\.[tj]sx?$/)) &&
    allContent.match(/from ['"]react-native['"]/)
  ) {
    return 'react-native'
  }

  // Python
  if (names.some((f) => f.endsWith('.py'))) return 'python'

  // HTML
  if (names.some((f) => f.endsWith('.html'))) return 'html'

  // Node.js / TypeScript project
  if (names.includes('package.json')) return 'nodejs'

  // Bare JS / TS files → treat as Node
  if (names.some((f) => f.match(/\.[jt]sx?$/))) return 'nodejs'

  return 'unknown'
}
