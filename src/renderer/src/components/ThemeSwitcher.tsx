import { Moon, Sun, ImageIcon } from 'lucide-react'

export type Theme = 'dark' | 'light' | 'photo'

interface Props {
  theme: Theme
  hasPhoto: boolean
  onThemeChange: (t: Theme) => void
  onPickPhoto: () => void
}

export default function ThemeSwitcher({ theme, hasPhoto, onThemeChange, onPickPhoto }: Props) {
  return (
    <div className="no-drag flex items-center gap-0.5 bg-slate-800 border border-slate-700 rounded-lg p-0.5">
      <Btn active={theme === 'dark'} onClick={() => onThemeChange('dark')} title="Dark">
        <Moon className="w-3.5 h-3.5" />
        <span>Dark</span>
      </Btn>

      <Btn active={theme === 'light'} onClick={() => onThemeChange('light')} title="Light">
        <Sun className="w-3.5 h-3.5" />
        <span>Light</span>
      </Btn>

      <Btn active={theme === 'photo'} onClick={() => onThemeChange('photo')} title="Photo background">
        <ImageIcon className="w-3.5 h-3.5" />
        <span>Photo</span>
      </Btn>

      {/* Change photo — only when photo theme is active */}
      {theme === 'photo' && (
        <button
          onClick={onPickPhoto}
          title={hasPhoto ? 'Change photo' : 'Pick a photo'}
          className="px-2 py-1 text-[10px] text-slate-400 hover:text-violet-300 transition-colors"
        >
          {hasPhoto ? '↺' : '＋'}
        </button>
      )}
    </div>
  )
}

function Btn({
  active, onClick, title, children
}: {
  active: boolean
  onClick: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`flex items-center gap-1 px-2.5 py-1 text-[11px] rounded-md transition-colors ${
        active
          ? 'bg-violet-600 text-white'
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
      }`}
    >
      {children}
    </button>
  )
}
