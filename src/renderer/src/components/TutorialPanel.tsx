import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface Section {
  id: string
  emoji: string
  title: string
  content: React.ReactNode
}

// ── Small reusable pieces ─────────────────────────────────────────────────────
function Step({ n, text }: { n: number; text: string }) {
  return (
    <div className="flex gap-3 items-start">
      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-violet-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">
        {n}
      </span>
      <p className="text-sm text-slate-300 leading-relaxed">{text}</p>
    </div>
  )
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 bg-violet-950/40 border border-violet-700/30 rounded-lg px-3 py-2.5 mt-3">
      <span className="text-violet-400 flex-shrink-0">💡</span>
      <p className="text-xs text-violet-200/80 leading-relaxed">{children}</p>
    </div>
  )
}

function Warn({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 bg-amber-950/40 border border-amber-700/30 rounded-lg px-3 py-2.5 mt-3">
      <span className="text-amber-400 flex-shrink-0">⚠️</span>
      <p className="text-xs text-amber-200/80 leading-relaxed">{children}</p>
    </div>
  )
}

function Code({ children }: { children: string }) {
  return (
    <code className="bg-slate-800 text-violet-300 px-1.5 py-0.5 rounded text-[11px] font-mono">
      {children}
    </code>
  )
}

function Kbd({ children }: { children: string }) {
  return (
    <kbd className="bg-slate-700 text-slate-200 border border-slate-600 rounded px-1.5 py-0.5 text-[10px] font-mono">
      {children}
    </kbd>
  )
}

// ── Sections ──────────────────────────────────────────────────────────────────
const SECTIONS: Section[] = [
  {
    id: 'intro',
    emoji: '🔨',
    title: 'What is CodeForge?',
    content: (
      <div className="space-y-3">
        <p className="text-sm text-slate-300 leading-relaxed">
          CodeForge is a desktop app that compiles raw source code into distributable
          executables and Android packages — without requiring you to know anything about
          build systems, compilers, or command-line tools.
        </p>
        <div className="grid grid-cols-2 gap-2 mt-3">
          {[
            ['🌐 HTML / CSS / JS', '→ Windows EXE + Android APK'],
            ['🐍 Python', '→ Windows EXE (PyInstaller)'],
            ['⚙️ Node.js / TypeScript', '→ Windows EXE (pkg)'],
            ['📱 React Native', '→ Android APK (Capacitor)']
          ].map(([src, out]) => (
            <div key={src} className="bg-slate-800 rounded-lg p-2.5 text-xs">
              <div className="text-slate-200 font-medium mb-0.5">{src}</div>
              <div className="text-slate-500">{out}</div>
            </div>
          ))}
        </div>
        <Tip>
          The tool status pills in the top-right corner show which build tools are
          installed on your machine. Green = ready, grey = not found.
        </Tip>
      </div>
    )
  },
  {
    id: 'quickstart',
    emoji: '⚡',
    title: 'Quick Start (5 minutes)',
    content: (
      <div className="space-y-3">
        <p className="text-sm text-slate-400 mb-3">Build your first app in under 5 minutes:</p>
        <div className="space-y-2.5">
          <Step n={1} text='Click Templates in the header and choose "Web App" to load a ready-made starter project.' />
          <Step n={2} text='In the Build Config panel (right side), confirm the App Name is what you want.' />
          <Step n={3} text='Click the Preview button in the header to see the app running live in a preview window.' />
          <Step n={4} text='Click Build Now. Watch the Build Log tab fill with real-time progress.' />
          <Step n={5} text='When the build finishes, a Downloads panel appears. Click Save EXE to save your app.' />
        </div>
        <Tip>Your EXE is a fully self-contained Windows executable — double-click to run it on any Windows machine.</Tip>
      </div>
    )
  },
  {
    id: 'editor',
    emoji: '✏️',
    title: 'The Code Editor',
    content: (
      <div className="space-y-4">
        <p className="text-sm text-slate-300 leading-relaxed">
          The editor pane takes up the left side of the app and supports multiple files.
        </p>

        <div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Adding files</h4>
          <div className="space-y-2">
            <Step n={1} text='Click the + button at the right of the file tab bar.' />
            <Step n={2} text='Type the filename (e.g. index.html or main.py) and press Enter to confirm, Escape to cancel.' />
          </div>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Importing a ZIP</h4>
          <div className="space-y-2">
            <Step n={1} text='Drag any .zip file from Explorer and drop it onto the editor.' />
            <Step n={2} text='All text files inside the ZIP are extracted and opened automatically.' />
          </div>
          <Tip>Binary files (images, fonts) inside a ZIP are skipped — only source code files are imported.</Tip>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Keyboard shortcuts</h4>
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            {[
              ['Ctrl + S', 'Save (in editor)'],
              ['Ctrl + Z', 'Undo'],
              ['Ctrl + /', 'Toggle comment'],
              ['Alt + ↑/↓', 'Move line up/down'],
              ['Ctrl + D', 'Select next match'],
              ['F1', 'Command palette'],
            ].map(([key, desc]) => (
              <div key={key} className="flex items-center gap-2">
                <Kbd>{key}</Kbd>
                <span className="text-slate-500">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'templates',
    emoji: '📋',
    title: 'Templates',
    content: (
      <div className="space-y-3">
        <p className="text-sm text-slate-300 leading-relaxed">
          Templates give you a fully-working starter project with all the files already written.
          Click <strong className="text-slate-100">Templates</strong> in the header to open the gallery.
        </p>

        <div className="space-y-2">
          {[
            ['🌐', 'Web App', 'Responsive app with nav, hero, and click counter — HTML/CSS/JS'],
            ['🧮', 'Calculator', 'Fully functional calculator with keyboard support'],
            ['🚀', 'Landing Page', 'Modern product landing page with feature grid and email CTA'],
            ['🐍', 'Python CLI Tool', 'argparse-based command-line tool with colour output and file I/O'],
            ['🖥️', 'Python GUI App', 'Dark-themed tkinter window with buttons, labels, and input fields'],
            ['⚙️', 'Node.js REST API', 'Zero-dependency HTTP server with full CRUD routes and in-memory store'],
          ].map(([e, name, desc]) => (
            <div key={name} className="flex gap-3 bg-slate-800 rounded-lg p-2.5">
              <span className="text-xl leading-none flex-shrink-0">{e}</span>
              <div>
                <div className="text-xs font-semibold text-slate-200">{name}</div>
                <div className="text-xs text-slate-500 leading-relaxed">{desc}</div>
              </div>
            </div>
          ))}
        </div>
        <Tip>If you already have files in the editor, CodeForge will ask for confirmation before replacing them.</Tip>
      </div>
    )
  },
  {
    id: 'buildconfig',
    emoji: '⚙️',
    title: 'Build Configuration',
    content: (
      <div className="space-y-4">
        <p className="text-sm text-slate-300 leading-relaxed">
          The right sidebar contains all the settings that control how your app is compiled.
        </p>

        <div className="space-y-2.5">
          {[
            ['App Name', 'The name shown on the app window title and the output filename.'],
            ['Version', 'Semantic version string (e.g. 1.0.0). Used in the installer.'],
            ['Source Language', 'Auto-detect works for most projects. Override if detection is wrong.'],
            ['Output Target', 'EXE builds a Windows executable. APK builds an Android package. Both runs both pipelines.'],
            ['App Icon', 'Optional PNG or ICO image used as the app icon in the EXE.'],
          ].map(([field, desc]) => (
            <div key={field} className="bg-slate-800 rounded-lg p-2.5">
              <div className="text-xs font-semibold text-slate-200 mb-0.5">{field}</div>
              <div className="text-xs text-slate-500 leading-relaxed">{desc}</div>
            </div>
          ))}
        </div>

        <Warn>
          Building an APK requires Android Studio, JDK 17+, and the{' '}
          <Code>ANDROID_HOME</Code> environment variable pointing to your SDK folder.
          Restart CodeForge after setting it.
        </Warn>
      </div>
    )
  },
  {
    id: 'preview',
    emoji: '👁️',
    title: 'App Preview',
    content: (
      <div className="space-y-3">
        <p className="text-sm text-slate-300 leading-relaxed">
          The Preview button appears in the header whenever your editor contains at least one <Code>.html</Code> file.
          Click it to open your web app instantly in a sandboxed window.
        </p>
        <div className="space-y-2">
          <Step n={1} text='Add HTML files to the editor (or load an HTML template).' />
          <Step n={2} text='The violet Preview button appears in the header — click it.' />
          <Step n={3} text='Your app opens in a clean, isolated browser-like window.' />
          <Step n={4} text='Edit your code, close the preview, and click Preview again to see the changes.' />
        </div>
        <Tip>
          The preview window is sandboxed — it has no access to Node.js or the filesystem.
          This gives you an accurate representation of how the final EXE will behave.
        </Tip>
      </div>
    )
  },
  {
    id: 'ai',
    emoji: '🤖',
    title: 'AI Build Assistant',
    content: (
      <div className="space-y-4">
        <p className="text-sm text-slate-300 leading-relaxed">
          The AI tab is powered by Claude (Anthropic). It can analyze your code, suggest build
          settings, and diagnose failed builds in real time.
        </p>

        <div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Setup</h4>
          <div className="space-y-2">
            <Step n={1} text='Click the AI tab in the left pane.' />
            <Step n={2} text='Click the amber "Add key" button and paste your Anthropic API key (starts with sk-ant-).' />
            <Step n={3} text='Click Save — the key is stored in localStorage only, never sent anywhere except Anthropic.' />
          </div>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Features</h4>
          <div className="space-y-2">
            {[
              ['Analyze Code', 'Streams a full explanation of what your project does, flags potential issues, and suggests the ideal build settings. A "Suggested Config" card lets you apply them with one click.'],
              ['Fix Last Error', 'Appears after a build failure. Sends your code + the error log to Claude for a precise diagnosis with specific code fixes.'],
            ].map(([name, desc]) => (
              <div key={name} className="bg-slate-800 rounded-lg p-2.5">
                <div className="text-xs font-semibold text-slate-200 mb-0.5">{name}</div>
                <div className="text-xs text-slate-500 leading-relaxed">{desc}</div>
              </div>
            ))}
          </div>
        </div>

        <Tip>
          Get your free API key at <strong className="text-violet-300">console.anthropic.com</strong>.
          New accounts include free credits.
        </Tip>
      </div>
    )
  },
  {
    id: 'history',
    emoji: '🕒',
    title: 'Build History',
    content: (
      <div className="space-y-3">
        <p className="text-sm text-slate-300 leading-relaxed">
          Every build is recorded in the History tab — successes and failures alike.
        </p>
        <div className="space-y-2">
          {[
            ['Green entry', 'Build succeeded. Shows app name, target, and duration.'],
            ['Red entry', 'Build failed. Shows the error message. Use Fix Last Error in the AI tab.'],
            ['Save buttons', 'Re-download the EXE or APK from any past successful build.'],
            ['Clear button', 'Removes all history entries from the current session.'],
          ].map(([item, desc]) => (
            <div key={item} className="flex gap-3 text-sm">
              <span className="text-violet-400 font-semibold text-xs flex-shrink-0 mt-0.5 w-24">{item}</span>
              <span className="text-slate-400 text-xs leading-relaxed">{desc}</span>
            </div>
          ))}
        </div>
        <Warn>Build history is session-only — it resets when you close CodeForge. Use the Save button to keep your outputs.</Warn>
      </div>
    )
  },
  {
    id: 'themes',
    emoji: '🎨',
    title: 'Themes',
    content: (
      <div className="space-y-3">
        <p className="text-sm text-slate-300 leading-relaxed">
          The theme switcher in the top-right of the header controls the app's appearance.
          Your choice is saved and restored on next launch.
        </p>
        <div className="space-y-2">
          {[
            ['🌑 Dark', 'Default dark slate theme — easiest on the eyes for long sessions.'],
            ['☀️ Light', 'Clean white theme — good for bright environments.'],
            ['🖼️ Photo', 'Set any image as a background. Panels become semi-transparent with a blur effect.'],
          ].map(([name, desc]) => (
            <div key={name} className="bg-slate-800 rounded-lg p-2.5">
              <div className="text-xs font-semibold text-slate-200 mb-0.5">{name}</div>
              <div className="text-xs text-slate-500">{desc}</div>
            </div>
          ))}
        </div>
        <Tip>
          When Photo is active, a ↺ button appears next to the Photo tab to swap the image.
          The image path is remembered, so it reloads automatically on restart.
        </Tip>
      </div>
    )
  },
  {
    id: 'updates',
    emoji: '🔄',
    title: 'Auto-Updates',
    content: (
      <div className="space-y-3">
        <p className="text-sm text-slate-300 leading-relaxed">
          CodeForge checks for updates automatically every time it launches (packaged builds only).
        </p>
        <div className="space-y-2">
          <Step n={1} text='If a new version is available, a banner appears at the top of the app while it downloads in the background.' />
          <Step n={2} text='When the download is complete, the banner turns green and shows a "Restart & Install" button.' />
          <Step n={3} text='Click it to close CodeForge and apply the update. The app reopens automatically on the new version.' />
        </div>
        <Tip>You can dismiss the banner with ✕ and install the update later — it will be applied the next time you restart.</Tip>
      </div>
    )
  },
  {
    id: 'tips',
    emoji: '✨',
    title: 'Tips & Troubleshooting',
    content: (
      <div className="space-y-4">
        <div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Common Issues</h4>
          <div className="space-y-2.5">
            {[
              [
                'EXE build fails with "pkg not found"',
                <>Install the pkg bundler: <Code>npm install -g @yao-pkg/pkg</Code></>,
              ],
              [
                'Python build fails with "pyinstaller not found"',
                <>Install PyInstaller: <Code>pip install pyinstaller</Code></>,
              ],
              [
                'APK build fails — Android SDK missing',
                'Install Android Studio, accept SDK licenses, and set the ANDROID_HOME environment variable to your SDK path.',
              ],
              [
                'AI tab shows an authentication error',
                'Your Anthropic API key may be wrong or expired. Click "Key set" in the AI tab header to update it.',
              ],
              [
                'Preview shows a blank page',
                'Make sure your entry file is named index.html. The preview looks for index.html first.',
              ],
            ].map(([problem, fix], i) => (
              <div key={i} className="bg-slate-800 rounded-lg p-2.5">
                <div className="text-xs font-semibold text-amber-300 mb-1">⚠ {problem}</div>
                <div className="text-xs text-slate-400 leading-relaxed">{fix}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Pro Tips</h4>
          <ul className="space-y-1.5 text-xs text-slate-400">
            {[
              'Use the AI "Analyze Code" before every first build — it often catches issues before they become errors.',
              'For HTML projects, always click Preview first to verify layout before spending time on a full EXE build.',
              'Save your project (header → Save) before experimenting with template files — you can reload it if needed.',
              'The Build Log tab shows the full compiler output — scroll through it to understand exactly what happened.',
              'Drag a ZIP of an existing project straight onto the editor to import it instantly.',
            ].map((tip, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-violet-500 flex-shrink-0">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    )
  }
]

// ── Main component ────────────────────────────────────────────────────────────
interface Props {
  onStartTour: () => void
}

export default function TutorialPanel({ onStartTour }: Props) {
  const [open, setOpen] = useState<Record<string, boolean>>({ intro: true, quickstart: true })

  const toggle = (id: string) =>
    setOpen((prev) => ({ ...prev, [id]: !prev[id] }))

  return (
    <div className="flex flex-col h-full bg-slate-950 overflow-y-auto">

      {/* Hero header */}
      <div className="px-6 pt-6 pb-5 bg-gradient-to-b from-violet-950/40 to-transparent border-b border-slate-800">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">🔨</span>
          <h1 className="text-lg font-bold text-white">CodeForge Guide</h1>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Everything you need to turn source code into real apps.
        </p>
        <button
          onClick={onStartTour}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          ▶ Take the Tour
        </button>
      </div>

      {/* Accordion sections */}
      <div className="divide-y divide-slate-800/60">
        {SECTIONS.map((section) => {
          const isOpen = !!open[section.id]
          return (
            <div key={section.id}>
              <button
                onClick={() => toggle(section.id)}
                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-900/60 transition-colors text-left"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-lg leading-none">{section.emoji}</span>
                  <span className="text-sm font-semibold text-slate-200">{section.title}</span>
                </div>
                {isOpen
                  ? <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  : <ChevronRight className="w-4 h-4 text-slate-500 flex-shrink-0" />
                }
              </button>

              {isOpen && (
                <div className="px-5 pb-5 pt-1">
                  {section.content}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="px-5 py-6 text-center border-t border-slate-800 mt-auto">
        <p className="text-xs text-slate-600">
          CodeForge · Built with Electron, React & Claude
        </p>
      </div>
    </div>
  )
}
