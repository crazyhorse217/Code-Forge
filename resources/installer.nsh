; ── CodeForge Custom NSIS Installer ─────────────────────────────────────────
; Adds a branded welcome page and a custom finish page with launch checkbox.

!macro customHeader
  !system "echo Building CodeForge installer..."
!macroend

; ── Custom Welcome page ──────────────────────────────────────────────────────
!macro customWelcomePage
  ; Show default Welcome page (electron-builder handles it)
!macroend

; ── Custom Install page (runs before files are copied) ──────────────────────
!macro customInstallPage
!macroend

; ── Code that runs BEFORE the installer extracts files ───────────────────────
!macro customInstall
  ; Write registry value for uninstall display name with version
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\CodeForge" \
    "DisplayName" "CodeForge"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\CodeForge" \
    "Publisher" "CodeForge"
!macroend

; ── Code that runs after uninstall ───────────────────────────────────────────
!macro customUnInstall
  DeleteRegKey HKCU "Software\CodeForge"
  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\CodeForge"
!macroend
