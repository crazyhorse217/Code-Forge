export type Language = 'html' | 'python' | 'nodejs' | 'react' | 'react-native' | 'unknown'

// Entry points that are framework specifiers, not real files
const FRAMEWORK_MAINS = [
  'expo-router/entry',
  'expo/AppEntry',
  'node_modules/expo/AppEntry',
]

export function detectLanguage(files: Record<string, string>): Language {
  const names = Object.keys(files)
  const allContent = Object.values(files).join('\n')

  // ── Check package.json for framework indicators ───────────────────────────
  if (names.includes('package.json')) {
    try {
      const pkg = JSON.parse(files['package.json'])
      const deps = { ...pkg.dependencies, ...pkg.devDependencies, ...pkg.peerDependencies }

      // Expo / React Native project
      if (
        deps['expo'] ||
        deps['expo-router'] ||
        deps['expo-modules-core'] ||
        deps['react-native'] ||
        FRAMEWORK_MAINS.some((m) => pkg.main?.includes(m)) ||
        names.includes('app.json') ||
        names.includes('app.config.js') ||
        names.includes('app.config.ts')
      ) {
        return 'react-native'
      }

      // React + Vite / CRA web project (has react dep + a bundler, no react-native)
      if (
        deps['react'] && deps['react-dom'] &&
        (deps['vite'] || deps['@vitejs/plugin-react'] || deps['@vitejs/plugin-react-swc'] ||
         deps['react-scripts'] || deps['@craco/craco'] ||
         names.includes('vite.config.ts') || names.includes('vite.config.js'))
      ) {
        return 'react'
      }
    } catch { /* malformed package.json — fall through */ }
  }

  // ── React Native: import from 'react-native' in source ───────────────────
  if (allContent.match(/from ['"]react-native['"]/)) return 'react-native'

  // ── Python ────────────────────────────────────────────────────────────────
  if (names.some((f) => f.endsWith('.py'))) return 'python'

  // ── HTML / web ────────────────────────────────────────────────────────────
  if (names.some((f) => f.endsWith('.html'))) return 'html'

  // ── Node.js / TypeScript ──────────────────────────────────────────────────
  if (names.includes('package.json')) return 'nodejs'
  if (names.some((f) => f.match(/\.[jt]sx?$/))) return 'nodejs'

  return 'unknown'
}
