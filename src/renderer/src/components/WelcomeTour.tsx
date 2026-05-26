import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

interface Step {
  emoji: string
  title: string
  body: string
  tip?: string
  visual?: React.ReactNode
}

const STEPS: Step[] = [
  {
    emoji: '🔨',
    title: 'Welcome to CodeForge',
    body: 'CodeForge turns raw source code into real, downloadable desktop apps and Android APKs — no compilers, no config files, no command-line knowledge required.',
    tip: 'Supports HTML/JS, Python, Node.js, and React Native projects.'
  },
  {
    emoji: '✏️',
    title: 'Write or load your code',
    body: 'Type directly in the Monaco editor. Click + to add new files, drag & drop a ZIP archive to import a whole project, or pick a ready-made starter from the Templates menu.',
    tip: 'The editor supports syntax highlighting for every major language.'
  },
  {
    emoji: '📋',
    title: 'Start from a Template',
    body: 'Click Templates in the header to open the gallery. Six fully-written starter projects are included — Web App, Calculator, Landing Page, Python CLI, Python GUI, and a Node.js REST API.',
    tip: 'HTML templates activate the Preview button instantly — test before you build.'
  },
  {
    emoji: '⚙️',
    title: 'Configure your build',
    body: 'In the right panel set your app name, version, and language (or leave it on Auto-detect). Choose your output target: EXE for Windows, APK for Android, or both at once. Optionally pick a custom icon.',
    tip: 'Building an APK requires Android Studio + JDK 17 and the ANDROID_HOME env var.'
  },
  {
    emoji: '🤖',
    title: 'Let AI help you',
    body: 'Open the AI tab and enter your Anthropic API key. Hit Analyze Code to get a full breakdown of your project and auto-fill the build settings. If a build fails, Fix Last Error sends the error log to Claude for a precise diagnosis and fix.',
    tip: 'Your API key is stored locally and never leaves your machine.'
  },
  {
    emoji: '👁️',
    title: 'Preview before you build',
    body: 'When HTML files are in the editor a Preview button appears in the header. Click it to open your web app in a sandboxed window instantly — no build step required. Great for catching layout issues early.',
    tip: 'Preview works on all your HTML/CSS/JS files, including multi-file projects.'
  },
  {
    emoji: '🚀',
    title: 'Build & download',
    body: 'Click Build Now and watch the Build Log tab fill with real-time progress. When the build succeeds a Downloads panel appears — save your EXE or APK anywhere on your machine. Every build is saved in the History tab.',
    tip: 'Click the folder icon next to any output to open it directly in Explorer.'
  },
  {
    emoji: '🎨',
    title: 'Make it yours',
    body: 'The theme switcher in the header lets you toggle Dark mode, Light mode, or set a custom Photo background. Your theme is remembered between sessions.',
    tip: 'The Guide tab has a full reference for every feature whenever you need it.'
  },
  {
    emoji: '🎉',
    title: "You're all set!",
    body: "That's everything you need to build your first app with CodeForge. Open a template, hit Build Now, and see what happens.",
    tip: 'Reopen this tour any time from the Guide tab → "Take the Tour" button.'
  }
]

interface Props {
  onClose: () => void
}

export default function WelcomeTour({ onClose }: Props) {
  const [step, setStep] = useState(0)
  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') next()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [step])

  function next() { isLast ? onClose() : setStep((s) => s + 1) }
  function prev() { if (step > 0) setStep((s) => s - 1) }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
    >
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Dismiss */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-600 hover:text-slate-400 transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Progress bar */}
        <div className="h-1 bg-slate-800">
          <div
            className="h-full bg-violet-500 transition-all duration-300"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="px-8 pt-8 pb-6 text-center">
          {/* Emoji */}
          <div className="text-6xl mb-5 leading-none">{current.emoji}</div>

          {/* Step counter */}
          <div className="text-[11px] text-slate-500 mb-2 font-medium tracking-wider uppercase">
            Step {step + 1} of {STEPS.length}
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-slate-100 mb-3">{current.title}</h2>

          {/* Body */}
          <p className="text-sm text-slate-400 leading-relaxed mb-4">{current.body}</p>

          {/* Tip */}
          {current.tip && (
            <div className="inline-flex items-start gap-2 bg-violet-950/50 border border-violet-700/30 rounded-lg px-3 py-2 text-left mb-2">
              <span className="text-violet-400 text-xs mt-0.5 flex-shrink-0">💡</span>
              <span className="text-xs text-violet-300/80 leading-relaxed">{current.tip}</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between px-6 pb-6">
          <button
            onClick={prev}
            disabled={step === 0}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-500 hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          {/* Dot indicators */}
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  i === step ? 'bg-violet-500 w-4' : 'bg-slate-700 hover:bg-slate-500'
                }`}
              />
            ))}
          </div>

          <button
            onClick={next}
            className="flex items-center gap-1 px-4 py-1.5 text-sm bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors font-medium"
          >
            {isLast ? '🎉 Let\'s go!' : 'Next'}
            {!isLast && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}
