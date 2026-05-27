export interface Template {
  id: string
  name: string
  description: string
  emoji: string
  language: 'html' | 'python' | 'nodejs' | 'react'
  files: Record<string, string>
}

export const TEMPLATES: Template[] = [
  // ── 1. HTML Web App ──────────────────────────────────────────────────────────
  {
    id: 'html-webapp',
    name: 'Web App',
    description: 'Responsive app with nav, hero section, and interactive counter.',
    emoji: '🌐',
    language: 'html',
    files: {
      'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>My Web App</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <header>
    <nav>
      <span class="logo">⚡ MyApp</span>
      <ul>
        <li><a href="#home">Home</a></li>
        <li><a href="#features">Features</a></li>
        <li><a href="#contact">Contact</a></li>
      </ul>
    </nav>
  </header>

  <main>
    <section class="hero" id="home">
      <h1>Welcome to <span class="accent">MyApp</span></h1>
      <p>Build something amazing today.</p>
      <button id="cta-btn" onclick="handleClick()">Get Started</button>
    </section>

    <section class="counter" id="features">
      <h2>Click Counter</h2>
      <div class="count-display" id="count">0</div>
      <div class="btn-row">
        <button onclick="change(-1)">−</button>
        <button onclick="reset()">Reset</button>
        <button onclick="change(1)">+</button>
      </div>
    </section>
  </main>

  <footer>
    <p>Built with CodeForge · <span id="year"></span></p>
  </footer>

  <script src="app.js"></script>
</body>
</html>`,

      'styles.css': `*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: system-ui, sans-serif;
  background: #0f172a;
  color: #e2e8f0;
  min-height: 100vh;
}

/* Nav */
nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  background: #1e293b;
  border-bottom: 1px solid #334155;
}
.logo { font-size: 1.25rem; font-weight: 700; color: #a78bfa; }
nav ul { display: flex; gap: 1.5rem; list-style: none; }
nav a { color: #94a3b8; text-decoration: none; transition: color .2s; }
nav a:hover { color: #fff; }

/* Hero */
.hero {
  text-align: center;
  padding: 5rem 2rem;
}
.hero h1 { font-size: clamp(2rem, 5vw, 3.5rem); font-weight: 800; margin-bottom: 1rem; }
.accent { color: #a78bfa; }
.hero p { font-size: 1.2rem; color: #94a3b8; margin-bottom: 2rem; }

/* Buttons */
button {
  cursor: pointer;
  border: none;
  border-radius: 8px;
  padding: .75rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  background: #7c3aed;
  color: #fff;
  transition: background .2s, transform .1s;
}
button:hover { background: #6d28d9; }
button:active { transform: scale(.97); }

/* Counter */
.counter {
  text-align: center;
  padding: 3rem 2rem;
  background: #1e293b;
}
.counter h2 { margin-bottom: 1.5rem; font-size: 1.5rem; }
.count-display {
  font-size: 5rem;
  font-weight: 900;
  color: #a78bfa;
  margin-bottom: 1.5rem;
  font-variant-numeric: tabular-nums;
}
.btn-row { display: flex; gap: 1rem; justify-content: center; }
.btn-row button { padding: .75rem 1.5rem; font-size: 1.5rem; }

/* Footer */
footer {
  text-align: center;
  padding: 1.5rem;
  color: #475569;
  font-size: .875rem;
}`,

      'app.js': `let count = 0;

function updateDisplay() {
  document.getElementById('count').textContent = count;
}

function change(delta) {
  count += delta;
  updateDisplay();
}

function reset() {
  count = 0;
  updateDisplay();
}

function handleClick() {
  const btn = document.getElementById('cta-btn');
  btn.textContent = '🚀 Launched!';
  btn.style.background = '#059669';
  setTimeout(() => {
    btn.textContent = 'Get Started';
    btn.style.background = '';
  }, 2000);
}

// Set footer year
document.getElementById('year').textContent = new Date().getFullYear();`
    }
  },

  // ── 2. Calculator ────────────────────────────────────────────────────────────
  {
    id: 'calculator',
    name: 'Calculator',
    description: 'Fully functional calculator with keyboard support.',
    emoji: '🧮',
    language: 'html',
    files: {
      'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Calculator</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <div class="calc">
    <div class="display">
      <div class="expr" id="expr"></div>
      <div class="result" id="result">0</div>
    </div>
    <div class="keys">
      <button class="span2 clear" onclick="clearAll()">AC</button>
      <button class="op"         onclick="input('/')">÷</button>
      <button class="op"         onclick="input('*')">×</button>
      <button onclick="input('7')">7</button>
      <button onclick="input('8')">8</button>
      <button onclick="input('9')">9</button>
      <button class="op"         onclick="input('-')">−</button>
      <button onclick="input('4')">4</button>
      <button onclick="input('5')">5</button>
      <button onclick="input('6')">6</button>
      <button class="op"         onclick="input('+')">+</button>
      <button onclick="input('1')">1</button>
      <button onclick="input('2')">2</button>
      <button onclick="input('3')">3</button>
      <button class="eq span1-tall" onclick="calculate()">=</button>
      <button class="span2"  onclick="input('0')">0</button>
      <button onclick="input('.')">.</button>
    </div>
  </div>
  <script src="app.js"></script>
</body>
</html>`,

      'styles.css': `body {
  margin: 0;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0f172a;
  font-family: system-ui, sans-serif;
}
.calc {
  background: #1e293b;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 24px 64px rgba(0,0,0,.5);
  width: 280px;
}
.display {
  padding: 1.25rem 1.5rem .75rem;
  text-align: right;
  background: #0f172a;
  min-height: 90px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}
.expr   { color: #64748b; font-size: .9rem; min-height: 1.2em; }
.result { color: #f1f5f9; font-size: 2.5rem; font-weight: 300; }
.keys {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1px;
  background: #334155;
}
button {
  background: #1e293b;
  border: none;
  color: #e2e8f0;
  font-size: 1.25rem;
  padding: 1.1rem;
  cursor: pointer;
  transition: background .15s;
}
button:hover  { background: #2d3f55; }
button:active { background: #3d5166; }
.op    { color: #a78bfa; }
.clear { color: #f87171; }
.eq    { background: #7c3aed; color: #fff; }
.eq:hover { background: #6d28d9; }
.span2 { grid-column: span 2; }
.span1-tall { grid-row: span 2; }`,

      'app.js': `let expr = '';
let justCalc = false;

function input(val) {
  const ops = ['+', '-', '*', '/'];
  if (justCalc && !ops.includes(val)) { expr = ''; }
  justCalc = false;
  expr += val;
  render();
}

function calculate() {
  try {
    const res = Function('"use strict"; return (' + expr + ')')();
    document.getElementById('expr').textContent = expr + ' =';
    document.getElementById('result').textContent =
      Number.isFinite(res) ? +res.toFixed(10) : 'Error';
    expr = String(Number.isFinite(res) ? +res.toFixed(10) : '');
    justCalc = true;
  } catch { document.getElementById('result').textContent = 'Error'; }
}

function clearAll() { expr = ''; justCalc = false; render(); }

function render() {
  document.getElementById('expr').textContent = '';
  document.getElementById('result').textContent = expr || '0';
}

document.addEventListener('keydown', e => {
  if ('0123456789.+-*/'.includes(e.key)) input(e.key);
  else if (e.key === 'Enter' || e.key === '=') calculate();
  else if (e.key === 'Escape') clearAll();
  else if (e.key === 'Backspace') { expr = expr.slice(0, -1); render(); }
});`
    }
  },

  // ── 3. Landing Page ──────────────────────────────────────────────────────────
  {
    id: 'landing-page',
    name: 'Landing Page',
    description: 'Modern product landing page with features grid and CTA.',
    emoji: '🚀',
    language: 'html',
    files: {
      'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>MyProduct — The Future is Here</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <nav>
    <span class="brand">⚡ MyProduct</span>
    <a href="#features">Features</a>
    <a href="#pricing">Pricing</a>
    <a href="#cta" class="btn-nav">Get Started →</a>
  </nav>

  <section class="hero">
    <div class="badge">Now in Beta</div>
    <h1>Build faster.<br/>Ship <span>smarter.</span></h1>
    <p>The all-in-one platform that supercharges your workflow.<br/>
       No setup. No nonsense. Just results.</p>
    <div class="hero-btns">
      <a href="#cta" class="btn-primary">Start Free Trial</a>
      <a href="#features" class="btn-ghost">See How It Works</a>
    </div>
  </section>

  <section class="features" id="features">
    <h2>Everything you need</h2>
    <div class="grid">
      <div class="card"><div class="icon">⚡</div><h3>Lightning Fast</h3><p>Built for speed from the ground up. Zero lag.</p></div>
      <div class="card"><div class="icon">🔒</div><h3>Secure by Default</h3><p>Enterprise-grade encryption on every request.</p></div>
      <div class="card"><div class="icon">🤖</div><h3>AI Powered</h3><p>Smart suggestions that learn from your workflow.</p></div>
      <div class="card"><div class="icon">📊</div><h3>Real-time Analytics</h3><p>Live dashboards with actionable insights.</p></div>
      <div class="card"><div class="icon">🔗</div><h3>100+ Integrations</h3><p>Connect the tools you already use instantly.</p></div>
      <div class="card"><div class="icon">🌍</div><h3>Global CDN</h3><p>Sub-100ms response times worldwide.</p></div>
    </div>
  </section>

  <section class="cta" id="cta">
    <h2>Ready to get started?</h2>
    <p>Join 10,000+ teams already using MyProduct.</p>
    <form onsubmit="return subscribe(event)">
      <input type="email" id="email" placeholder="Enter your email…" required />
      <button type="submit">Get Early Access</button>
    </form>
    <p class="legal">No credit card required · Free forever plan available</p>
  </section>

  <footer>© <span id="yr"></span> MyProduct Inc. All rights reserved.</footer>
  <script src="app.js"></script>
</body>
</html>`,

      'styles.css': `*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root { --purple: #7c3aed; --purple-light: #a78bfa; }
body { font-family: system-ui, sans-serif; background: #030712; color: #e2e8f0; }
a { text-decoration: none; }

nav {
  display: flex; align-items: center; gap: 2rem;
  padding: .875rem 3rem; background: rgba(15,23,42,.8);
  backdrop-filter: blur(12px);
  position: sticky; top: 0; z-index: 10;
  border-bottom: 1px solid #1e293b;
}
.brand { font-weight: 800; font-size: 1.1rem; color: var(--purple-light); margin-right: auto; }
nav a { color: #94a3b8; font-size: .9rem; transition: color .2s; }
nav a:hover { color: #fff; }
.btn-nav {
  background: var(--purple); color: #fff !important; padding: .45rem 1rem;
  border-radius: 6px; font-weight: 600; font-size: .85rem;
}

.hero {
  text-align: center; padding: 6rem 2rem 5rem;
  background: radial-gradient(ellipse at top, #1a0533 0%, #030712 60%);
}
.badge {
  display: inline-block; padding: .3rem .9rem;
  background: rgba(124,58,237,.2); border: 1px solid rgba(124,58,237,.4);
  color: var(--purple-light); border-radius: 999px; font-size: .8rem; margin-bottom: 1.5rem;
}
.hero h1 { font-size: clamp(2.5rem, 6vw, 4.5rem); font-weight: 900; line-height: 1.1; margin-bottom: 1.25rem; }
.hero h1 span { color: var(--purple-light); }
.hero p { font-size: 1.1rem; color: #94a3b8; margin-bottom: 2.5rem; line-height: 1.7; }
.hero-btns { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
.btn-primary {
  background: var(--purple); color: #fff; padding: .8rem 2rem;
  border-radius: 8px; font-weight: 700; font-size: 1rem; transition: background .2s;
}
.btn-primary:hover { background: #6d28d9; }
.btn-ghost {
  border: 1px solid #334155; color: #e2e8f0; padding: .8rem 2rem;
  border-radius: 8px; font-weight: 600; font-size: 1rem; transition: border-color .2s;
}
.btn-ghost:hover { border-color: #7c3aed; }

.features { padding: 5rem 2rem; text-align: center; }
.features h2 { font-size: 2rem; margin-bottom: 3rem; }
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem; max-width: 900px; margin: 0 auto; }
.card { background: #0f172a; border: 1px solid #1e293b; border-radius: 12px; padding: 1.75rem; text-align: left; transition: border-color .2s; }
.card:hover { border-color: #4c1d95; }
.icon { font-size: 2rem; margin-bottom: .75rem; }
.card h3 { margin-bottom: .5rem; font-size: 1rem; }
.card p { color: #64748b; font-size: .9rem; line-height: 1.6; }

.cta { text-align: center; padding: 5rem 2rem; background: #0a0f1e; }
.cta h2 { font-size: 2rem; margin-bottom: .75rem; }
.cta > p { color: #64748b; margin-bottom: 2rem; }
form { display: flex; gap: .75rem; justify-content: center; flex-wrap: wrap; max-width: 480px; margin: 0 auto 1rem; }
form input {
  flex: 1; min-width: 200px; padding: .8rem 1rem; background: #1e293b;
  border: 1px solid #334155; border-radius: 8px; color: #e2e8f0; font-size: .95rem;
}
form input:focus { outline: none; border-color: var(--purple); }
form button {
  background: var(--purple); color: #fff; border: none; padding: .8rem 1.5rem;
  border-radius: 8px; font-weight: 700; cursor: pointer; font-size: .95rem; transition: background .2s;
}
form button:hover { background: #6d28d9; }
.legal { color: #475569; font-size: .8rem; }

footer { text-align: center; padding: 2rem; color: #334155; font-size: .875rem; }`,

      'app.js': `document.getElementById('yr').textContent = new Date().getFullYear();

function subscribe(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button');
  const email = document.getElementById('email').value;
  btn.textContent = '✓ You\'re on the list!';
  btn.style.background = '#059669';
  btn.disabled = true;
  console.log('Subscribed:', email);
  return false;
}`
    }
  },

  // ── 4. Python CLI Tool ───────────────────────────────────────────────────────
  {
    id: 'python-cli',
    name: 'Python CLI Tool',
    description: 'Command-line app with argument parsing, colors, and file I/O.',
    emoji: '🐍',
    language: 'python',
    files: {
      'main.py': `#!/usr/bin/env python3
"""
MyTool — A command-line utility template.
Usage:
  python main.py greet --name Alice
  python main.py count --file data.txt
  python main.py --help
"""

import argparse
import sys
import os
from datetime import datetime

# ── ANSI colours ──────────────────────────────────────────────────────────────
class C:
    RESET  = "\\033[0m"
    BOLD   = "\\033[1m"
    GREEN  = "\\033[92m"
    YELLOW = "\\033[93m"
    RED    = "\\033[91m"
    CYAN   = "\\033[96m"
    PURPLE = "\\033[95m"

def ok(msg):   print(f"{C.GREEN}✓{C.RESET} {msg}")
def warn(msg): print(f"{C.YELLOW}⚠{C.RESET} {msg}")
def err(msg):  print(f"{C.RED}✗{C.RESET} {msg}", file=sys.stderr)
def info(msg): print(f"{C.CYAN}→{C.RESET} {msg}")

# ── Commands ──────────────────────────────────────────────────────────────────
def cmd_greet(args):
    """Print a personalised greeting."""
    hour = datetime.now().hour
    time_of_day = (
        "Good morning"  if hour < 12 else
        "Good afternoon" if hour < 17 else
        "Good evening"
    )
    print(f"\\n{C.PURPLE}{C.BOLD}{time_of_day}, {args.name}!{C.RESET}")
    if args.shout:
        print(f"{C.YELLOW}HELLO {args.name.upper()}!!{C.RESET}")
    ok("Greeting delivered.")


def cmd_count(args):
    """Count lines, words, and characters in a file."""
    if not os.path.exists(args.file):
        err(f"File not found: {args.file}")
        sys.exit(1)

    with open(args.file, "r", encoding="utf-8") as f:
        text = f.read()

    lines = text.splitlines()
    words = text.split()

    info(f"File: {C.BOLD}{args.file}{C.RESET}")
    print(f"  Lines      : {C.GREEN}{len(lines):>8,}{C.RESET}")
    print(f"  Words      : {C.GREEN}{len(words):>8,}{C.RESET}")
    print(f"  Characters : {C.GREEN}{len(text):>8,}{C.RESET}")
    ok("Done.")


def cmd_info(args):
    """Show system information."""
    import platform
    info("System info:")
    print(f"  OS      : {platform.system()} {platform.release()}")
    print(f"  Python  : {platform.python_version()}")
    print(f"  Machine : {platform.machine()}")
    print(f"  Time    : {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")


# ── Argument parser ───────────────────────────────────────────────────────────
def build_parser():
    parser = argparse.ArgumentParser(
        prog="mytool",
        description=f"{C.PURPLE}{C.BOLD}MyTool{C.RESET} — a handy CLI utility"
    )
    sub = parser.add_subparsers(dest="command", required=True)

    # greet
    p_greet = sub.add_parser("greet", help="Print a greeting")
    p_greet.add_argument("--name", "-n", default="World", help="Name to greet")
    p_greet.add_argument("--shout", "-s", action="store_true", help="SHOUT the greeting")

    # count
    p_count = sub.add_parser("count", help="Count lines/words in a file")
    p_count.add_argument("--file", "-f", required=True, help="Path to file")

    # info
    sub.add_parser("info", help="Show system information")

    return parser


def main():
    parser = build_parser()
    args = parser.parse_args()

    dispatch = {
        "greet": cmd_greet,
        "count": cmd_count,
        "info":  cmd_info,
    }
    dispatch[args.command](args)


if __name__ == "__main__":
    main()`
    }
  },

  // ── 5. Python GUI App ────────────────────────────────────────────────────────
  {
    id: 'python-gui',
    name: 'Python GUI App',
    description: 'Desktop window with tkinter — buttons, labels, and input.',
    emoji: '🖥️',
    language: 'python',
    files: {
      'main.py': `#!/usr/bin/env python3
"""
MyGUI — A Python desktop app built with tkinter.
Run: python main.py
"""

import tkinter as tk
from tkinter import ttk, messagebox
import random
from datetime import datetime

# ── Theme colours ─────────────────────────────────────────────────────────────
BG       = "#0f172a"
SURFACE  = "#1e293b"
BORDER   = "#334155"
ACCENT   = "#7c3aed"
ACCENT_H = "#6d28d9"
FG       = "#e2e8f0"
FG_MUTED = "#64748b"

class App(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("MyGUI App")
        self.geometry("480x520")
        self.resizable(True, True)
        self.configure(bg=BG)
        self._counter = 0
        self._build_ui()

    # ── UI layout ──────────────────────────────────────────────────────────────
    def _build_ui(self):
        # Header
        hdr = tk.Frame(self, bg=SURFACE, pady=14)
        hdr.pack(fill="x")
        tk.Label(hdr, text="⚡ MyGUI App", font=("Helvetica", 16, "bold"),
                 bg=SURFACE, fg=ACCENT).pack()
        tk.Label(hdr, text="A desktop app template",
                 font=("Helvetica", 10), bg=SURFACE, fg=FG_MUTED).pack()

        # Name input section
        sec1 = self._section("Greeting")
        row = tk.Frame(sec1, bg=SURFACE)
        row.pack(fill="x")
        tk.Label(row, text="Your name:", bg=SURFACE, fg=FG,
                 font=("Helvetica", 10)).pack(side="left", padx=(0, 8))
        self._name_var = tk.StringVar(value="World")
        entry = tk.Entry(row, textvariable=self._name_var, width=20,
                         bg=BORDER, fg=FG, insertbackground=FG,
                         relief="flat", font=("Helvetica", 11))
        entry.pack(side="left", ipady=4, padx=(0, 8))
        self._greet_btn = self._btn(row, "Greet", self._greet)
        self._greet_btn.pack(side="left")

        self._greeting_lbl = tk.Label(sec1, text="", bg=SURFACE,
                                       fg="#a78bfa", font=("Helvetica", 13, "bold"))
        self._greeting_lbl.pack(pady=(10, 0))

        # Counter section
        sec2 = self._section("Counter")
        self._count_lbl = tk.Label(sec2, text="0", bg=SURFACE, fg=ACCENT,
                                    font=("Helvetica", 48, "bold"))
        self._count_lbl.pack()
        btn_row = tk.Frame(sec2, bg=SURFACE)
        btn_row.pack(pady=8)
        self._btn(btn_row, "  −  ", lambda: self._step(-1)).pack(side="left", padx=4)
        self._btn(btn_row, "Reset", self._reset_counter).pack(side="left", padx=4)
        self._btn(btn_row, "  +  ", lambda: self._step(1)).pack(side="left", padx=4)

        # Random colour section
        sec3 = self._section("Colour Generator")
        self._colour_box = tk.Label(sec3, text="Click to generate",
                                     bg="#7c3aed", fg="#fff", width=30, height=3,
                                     font=("Helvetica", 11), relief="flat", cursor="hand2")
        self._colour_box.pack(pady=4)
        self._colour_box.bind("<Button-1>", lambda _: self._random_colour())
        self._btn(sec3, "New Colour", self._random_colour).pack(pady=(4, 0))

    # ── Helpers ────────────────────────────────────────────────────────────────
    def _section(self, title):
        frame = tk.LabelFrame(self, text=f" {title} ",
                               bg=SURFACE, fg=FG_MUTED,
                               font=("Helvetica", 9),
                               bd=1, relief="groove",
                               padx=16, pady=12)
        frame.pack(fill="x", padx=16, pady=8)
        return frame

    def _btn(self, parent, text, command):
        return tk.Button(parent, text=text, command=command,
                         bg=ACCENT, fg="#fff", activebackground=ACCENT_H,
                         activeforeground="#fff", relief="flat",
                         font=("Helvetica", 10, "bold"),
                         padx=12, pady=5, cursor="hand2", bd=0)

    # ── Actions ────────────────────────────────────────────────────────────────
    def _greet(self):
        name = self._name_var.get().strip() or "World"
        hour = datetime.now().hour
        prefix = "Good morning" if hour < 12 else "Good afternoon" if hour < 17 else "Good evening"
        self._greeting_lbl.config(text=f"{prefix}, {name}! 👋")

    def _step(self, delta):
        self._counter += delta
        self._count_lbl.config(text=str(self._counter))

    def _reset_counter(self):
        self._counter = 0
        self._count_lbl.config(text="0")

    def _random_colour(self):
        r, g, b = random.randint(60,220), random.randint(60,220), random.randint(60,220)
        hex_col = f"#{r:02x}{g:02x}{b:02x}"
        self._colour_box.config(bg=hex_col, text=hex_col.upper())


if __name__ == "__main__":
    app = App()
    app.mainloop()`
    }
  },

  // ── 6. React CDN App ─────────────────────────────────────────────────────────
  {
    id: 'react-cdn',
    name: 'React App (CDN)',
    description: 'React 18 app using CDN + Babel — no build step. Builds directly to EXE or APK.',
    emoji: '⚛️',
    language: 'react',
    files: {
      'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>React App</title>
  <link rel="stylesheet" href="styles.css" />
  <!-- React 18 + Babel Standalone (CDN — requires internet on first run) -->
  <script crossorigin src="https://cdn.jsdelivr.net/npm/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://cdn.jsdelivr.net/npm/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@babel/standalone/babel.min.js"></script>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" src="App.jsx"></script>
</body>
</html>`,

      'App.jsx': `// ── React App — CDN edition ─────────────────────────────────────────────────
const { useState, useEffect } = React

// ── Counter component ─────────────────────────────────────────────────────────
function Counter() {
  const [count, setCount] = useState(0)
  const [record, setRecord] = useState(0)

  useEffect(() => {
    if (count > record) setRecord(count)
  }, [count])

  return (
    <div className="card">
      <h2>Counter</h2>
      <div className="big-number">{count}</div>
      <p className="muted">Record: {record}</p>
      <div className="btn-row">
        <button onClick={() => setCount(c => c - 1)} className="btn-outline">−</button>
        <button onClick={() => setCount(0)} className="btn-ghost">Reset</button>
        <button onClick={() => setCount(c => c + 1)} className="btn-primary">+</button>
      </div>
    </div>
  )
}

// ── Todo component ────────────────────────────────────────────────────────────
function TodoList() {
  const [todos, setTodos] = useState([
    { id: 1, text: 'Build something awesome', done: true },
    { id: 2, text: 'Ship it with CodeForge', done: false },
  ])
  const [input, setInput] = useState('')

  const add = () => {
    const text = input.trim()
    if (!text) return
    setTodos(t => [...t, { id: Date.now(), text, done: false }])
    setInput('')
  }

  const toggle = (id) => setTodos(t => t.map(x => x.id === id ? { ...x, done: !x.done } : x))
  const remove = (id) => setTodos(t => t.filter(x => x.id !== id))

  return (
    <div className="card">
      <h2>Todo List</h2>
      <div className="input-row">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
          placeholder="Add a task…"
          className="input"
        />
        <button onClick={add} className="btn-primary">Add</button>
      </div>
      <ul className="todo-list">
        {todos.map(t => (
          <li key={t.id} className={"todo-item" + (t.done ? " done" : "")}>
            <input type="checkbox" checked={t.done} onChange={() => toggle(t.id)} />
            <span>{t.text}</span>
            <button onClick={() => remove(t.id)} className="btn-del">✕</button>
          </li>
        ))}
      </ul>
      <p className="muted">{todos.filter(t => t.done).length}/{todos.length} done</p>
    </div>
  )
}

// ── App root ──────────────────────────────────────────────────────────────────
function App() {
  return (
    <div className="app">
      <header className="header">
        <span className="logo">⚛️ React App</span>
        <span className="badge">Built with CodeForge</span>
      </header>
      <main className="main">
        <Counter />
        <TodoList />
      </main>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />)`,

      'styles.css': `*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg:      #0f172a;
  --surface: #1e293b;
  --border:  #334155;
  --accent:  #7c3aed;
  --accent2: #a78bfa;
  --fg:      #e2e8f0;
  --muted:   #64748b;
}

body { font-family: system-ui, sans-serif; background: var(--bg); color: var(--fg); min-height: 100vh; }

.app { display: flex; flex-direction: column; min-height: 100vh; }

.header {
  display: flex; align-items: center; justify-content: space-between;
  padding: .875rem 2rem; background: var(--surface);
  border-bottom: 1px solid var(--border);
}
.logo  { font-size: 1.1rem; font-weight: 800; color: var(--accent2); }
.badge {
  font-size: .75rem; padding: .25rem .75rem;
  background: rgba(124,58,237,.2); border: 1px solid rgba(124,58,237,.4);
  color: var(--accent2); border-radius: 999px;
}

.main {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem; padding: 2rem; max-width: 900px; margin: 0 auto; width: 100%;
}

.card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 12px; padding: 1.5rem;
}
.card h2 { font-size: 1rem; font-weight: 700; margin-bottom: 1rem; color: var(--accent2); }

.big-number { font-size: 4rem; font-weight: 900; color: var(--accent); text-align: center; margin: .5rem 0; }
.muted { font-size: .8rem; color: var(--muted); text-align: center; margin-top: .5rem; }

.btn-row { display: flex; gap: .75rem; justify-content: center; margin-top: 1rem; }

button {
  cursor: pointer; border: none; border-radius: 8px;
  padding: .6rem 1.25rem; font-size: .9rem; font-weight: 600;
  transition: background .15s, opacity .15s;
}
.btn-primary { background: var(--accent); color: #fff; }
.btn-primary:hover { background: #6d28d9; }
.btn-outline { background: transparent; color: var(--fg); border: 1px solid var(--border); }
.btn-outline:hover { border-color: var(--accent); color: var(--accent2); }
.btn-ghost { background: transparent; color: var(--muted); }
.btn-ghost:hover { color: var(--fg); }
.btn-del { background: transparent; color: var(--muted); padding: .25rem .5rem; font-size: .8rem; }
.btn-del:hover { color: #f87171; }

.input-row { display: flex; gap: .5rem; margin-bottom: 1rem; }
.input {
  flex: 1; padding: .6rem .875rem; background: var(--bg);
  border: 1px solid var(--border); border-radius: 8px;
  color: var(--fg); font-size: .9rem;
}
.input:focus { outline: none; border-color: var(--accent); }

.todo-list { list-style: none; display: flex; flex-direction: column; gap: .5rem; }
.todo-item {
  display: flex; align-items: center; gap: .75rem;
  padding: .6rem; background: var(--bg); border-radius: 8px;
  border: 1px solid var(--border);
}
.todo-item input[type=checkbox] { accent-color: var(--accent); width: 1rem; height: 1rem; cursor: pointer; }
.todo-item span { flex: 1; font-size: .9rem; }
.todo-item.done span { text-decoration: line-through; color: var(--muted); }`
    }
  },

  // ── 7. React + Vite Starter ──────────────────────────────────────────────────
  {
    id: 'react-vite',
    name: 'React + Vite (TypeScript)',
    description: 'Full React 18 + Vite + TypeScript starter. CodeForge runs npm build then packages to EXE.',
    emoji: '🔷',
    language: 'react',
    files: {
      'index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My React App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,

      'package.json': `{
  "name": "my-react-app",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.5",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "typescript": "^5.5.3",
    "vite": "^5.4.0"
  }
}`,

      'vite.config.ts': `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',  // Required for Electron file:// loading
  build: {
    outDir: 'dist',
  },
})`,

      'tsconfig.json': `{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true
  },
  "include": ["src"]
}`,

      'src/main.tsx': `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './App.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)`,

      'src/App.tsx': `import { useState } from 'react'
import Counter from './components/Counter'
import TodoList from './components/TodoList'

export default function App() {
  return (
    <div className="app">
      <header className="header">
        <span className="logo">🔷 My React App</span>
        <span className="badge">Vite + TypeScript</span>
      </header>
      <main className="main">
        <Counter />
        <TodoList />
      </main>
    </div>
  )
}`,

      'src/App.css': `*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg:      #0f172a;
  --surface: #1e293b;
  --border:  #334155;
  --accent:  #7c3aed;
  --accent2: #a78bfa;
  --fg:      #e2e8f0;
  --muted:   #64748b;
}

body { font-family: system-ui, sans-serif; background: var(--bg); color: var(--fg); min-height: 100vh; }

.app { display: flex; flex-direction: column; min-height: 100vh; }

.header {
  display: flex; align-items: center; justify-content: space-between;
  padding: .875rem 2rem; background: var(--surface);
  border-bottom: 1px solid var(--border);
}
.logo  { font-size: 1.1rem; font-weight: 800; color: var(--accent2); }
.badge {
  font-size: .75rem; padding: .25rem .75rem;
  background: rgba(124,58,237,.2); border: 1px solid rgba(124,58,237,.4);
  color: var(--accent2); border-radius: 999px;
}
.main {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem; padding: 2rem; max-width: 900px; margin: 0 auto; width: 100%;
}
.card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 12px; padding: 1.5rem;
}
.card h2 { font-size: 1rem; font-weight: 700; margin-bottom: 1rem; color: var(--accent2); }
.big-number { font-size: 4rem; font-weight: 900; color: var(--accent); text-align: center; margin: .5rem 0; }
.muted { font-size: .8rem; color: var(--muted); text-align: center; margin-top: .5rem; }
.btn-row { display: flex; gap: .75rem; justify-content: center; margin-top: 1rem; }
button {
  cursor: pointer; border: none; border-radius: 8px;
  padding: .6rem 1.25rem; font-size: .9rem; font-weight: 600; transition: background .15s;
}
.btn-primary { background: var(--accent); color: #fff; }
.btn-primary:hover { background: #6d28d9; }
.btn-outline { background: transparent; color: var(--fg); border: 1px solid var(--border); }
.btn-outline:hover { border-color: var(--accent); }
.btn-ghost { background: transparent; color: var(--muted); }
.btn-ghost:hover { color: var(--fg); }
.btn-del { background: transparent; color: var(--muted); padding: .25rem .5rem; font-size: .8rem; }
.btn-del:hover { color: #f87171; }
.input-row { display: flex; gap: .5rem; margin-bottom: 1rem; }
.input {
  flex: 1; padding: .6rem .875rem; background: var(--bg);
  border: 1px solid var(--border); border-radius: 8px; color: var(--fg); font-size: .9rem;
}
.input:focus { outline: none; border-color: var(--accent); }
.todo-list { list-style: none; display: flex; flex-direction: column; gap: .5rem; }
.todo-item {
  display: flex; align-items: center; gap: .75rem;
  padding: .6rem; background: var(--bg); border-radius: 8px; border: 1px solid var(--border);
}
.todo-item input[type=checkbox] { accent-color: var(--accent); width: 1rem; height: 1rem; cursor: pointer; }
.todo-item span { flex: 1; font-size: .9rem; }
.todo-item.done span { text-decoration: line-through; color: var(--muted); }`,

      'src/components/Counter.tsx': `import { useState, useEffect } from 'react'

export default function Counter() {
  const [count, setCount] = useState(0)
  const [record, setRecord] = useState(0)

  useEffect(() => {
    if (count > record) setRecord(count)
  }, [count, record])

  return (
    <div className="card">
      <h2>Counter</h2>
      <div className="big-number">{count}</div>
      <p className="muted">Record: {record}</p>
      <div className="btn-row">
        <button className="btn-outline" onClick={() => setCount(c => c - 1)}>−</button>
        <button className="btn-ghost"   onClick={() => setCount(0)}>Reset</button>
        <button className="btn-primary" onClick={() => setCount(c => c + 1)}>+</button>
      </div>
    </div>
  )
}`,

      'src/components/TodoList.tsx': `import { useState } from 'react'

interface Todo { id: number; text: string; done: boolean }

export default function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([
    { id: 1, text: 'Build something awesome', done: true },
    { id: 2, text: 'Ship it with CodeForge', done: false },
  ])
  const [input, setInput] = useState('')

  const add = () => {
    const text = input.trim()
    if (!text) return
    setTodos(t => [...t, { id: Date.now(), text, done: false }])
    setInput('')
  }

  const toggle = (id: number) => setTodos(t => t.map(x => x.id === id ? { ...x, done: !x.done } : x))
  const remove = (id: number) => setTodos(t => t.filter(x => x.id !== id))

  return (
    <div className="card">
      <h2>Todo List</h2>
      <div className="input-row">
        <input
          className="input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
          placeholder="Add a task…"
        />
        <button className="btn-primary" onClick={add}>Add</button>
      </div>
      <ul className="todo-list">
        {todos.map(t => (
          <li key={t.id} className={\`todo-item\${t.done ? ' done' : ''}\`}>
            <input type="checkbox" checked={t.done} onChange={() => toggle(t.id)} />
            <span>{t.text}</span>
            <button className="btn-del" onClick={() => remove(t.id)}>✕</button>
          </li>
        ))}
      </ul>
      <p className="muted">{todos.filter(t => t.done).length}/{todos.length} done</p>
    </div>
  )
}`
    }
  },

  // ── 8. Node.js REST API ──────────────────────────────────────────────────────
  {
    id: 'nodejs-api',
    name: 'Node.js REST API',
    description: 'HTTP server with JSON routes, middleware, and in-memory store.',
    emoji: '⚙️',
    language: 'nodejs',
    files: {
      'index.js': `/**
 * MyAPI — A simple Node.js REST API (no dependencies required).
 * Run: node index.js
 * Test: curl http://localhost:3000/api/items
 */

const http = require('http');
const url  = require('url');

const PORT = process.env.PORT || 3000;

// ── In-memory data store ──────────────────────────────────────────────────────
let items = [
  { id: 1, name: 'Item One',   done: false, createdAt: new Date().toISOString() },
  { id: 2, name: 'Item Two',   done: true,  createdAt: new Date().toISOString() },
  { id: 3, name: 'Item Three', done: false, createdAt: new Date().toISOString() },
];
let nextId = 4;

// ── Helpers ───────────────────────────────────────────────────────────────────
function send(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(data, null, 2));
}

function bodyJSON(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch { reject(new Error('Invalid JSON')); }
    });
  });
}

// ── Router ────────────────────────────────────────────────────────────────────
const routes = {
  // GET /
  'GET /': (req, res) => {
    send(res, 200, {
      name: 'MyAPI',
      version: '1.0.0',
      endpoints: [
        'GET    /api/items',
        'POST   /api/items',
        'GET    /api/items/:id',
        'PUT    /api/items/:id',
        'DELETE /api/items/:id',
      ]
    });
  },

  // GET /api/items
  'GET /api/items': (req, res, query) => {
    let result = [...items];
    if (query.done !== undefined) result = result.filter(i => String(i.done) === query.done);
    send(res, 200, { count: result.length, items: result });
  },

  // POST /api/items
  'POST /api/items': async (req, res) => {
    const body = await bodyJSON(req);
    if (!body.name) return send(res, 400, { error: 'name is required' });
    const item = { id: nextId++, name: body.name, done: false, createdAt: new Date().toISOString() };
    items.push(item);
    send(res, 201, item);
  },

  // GET /api/items/:id
  'GET /api/items/:id': (req, res, _, id) => {
    const item = items.find(i => i.id === Number(id));
    item ? send(res, 200, item) : send(res, 404, { error: 'Not found' });
  },

  // PUT /api/items/:id
  'PUT /api/items/:id': async (req, res, _, id) => {
    const idx = items.findIndex(i => i.id === Number(id));
    if (idx === -1) return send(res, 404, { error: 'Not found' });
    const body = await bodyJSON(req);
    items[idx] = { ...items[idx], ...body, id: items[idx].id };
    send(res, 200, items[idx]);
  },

  // DELETE /api/items/:id
  'DELETE /api/items/:id': (req, res, _, id) => {
    const idx = items.findIndex(i => i.id === Number(id));
    if (idx === -1) return send(res, 404, { error: 'Not found' });
    const [removed] = items.splice(idx, 1);
    send(res, 200, { deleted: removed });
  },
};

// ── Server ────────────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  const path   = parsed.pathname.replace(/\\/$/, '') || '/';
  const method = req.method.toUpperCase();

  // Exact match
  const exactKey = \`\${method} \${path}\`;
  if (routes[exactKey]) return routes[exactKey](req, res, parsed.query);

  // Param match (/api/items/:id)
  for (const [pattern, handler] of Object.entries(routes)) {
    const [pm, pp] = pattern.split(' ');
    if (pm !== method) continue;
    const paramMatch = pp.match(/^(.*)\\/:(\\w+)$/);
    if (!paramMatch) continue;
    const [, base, paramName] = paramMatch;
    if (path.startsWith(base + '/')) {
      const paramVal = path.slice(base.length + 1);
      return handler(req, res, parsed.query, paramVal);
    }
  }

  send(res, 404, { error: 'Route not found' });
});

server.listen(PORT, () => {
  console.log(\`\\n  ⚡ MyAPI running at http://localhost:\${PORT}\`);
  console.log(\`  GET  http://localhost:\${PORT}/api/items\`);
  console.log(\`  POST http://localhost:\${PORT}/api/items\\n\`);
});`,

      'package.json': `{
  "name": "my-api",
  "version": "1.0.0",
  "description": "A simple Node.js REST API",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "engines": {
    "node": ">=16"
  }
}`
    }
  }
]
