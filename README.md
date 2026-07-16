#  RetroWebOS

> A fully functional web-based operating system with authentic CRT phosphor aesthetics. Built from scratch in vanilla ES6 JavaScript — no frameworks, no build steps, pure retro computing spirit.

![RetroWebOS Screenshot](screenshot.png)

##  Features

### ️ Complete Desktop Environment
- **Window Manager** — Drag, resize, snap, minimize, maximize, tabbed windows, 9 workspaces
- **Taskbar** — Start button, running apps, system tray (WiFi, volume, battery, keyboard), clock
- **Start Menu** — Category tabs, search, recent files, pinned apps, power actions
- **Desktop** — 11 animated wallpapers (Matrix rain, CRT noise, particle fire, VHS glitch, galaxy, more)
- **Desktop Pet** — Animated cat with moods, feed/play/pet interactions
- **Widgets** — Draggable analog/digital/world clocks, monthly calendar

###  Authentic CRT Aesthetics
- **8 Built-in Themes**: Amber, Green, Blue, Pink, Purple, White, Matrix, Solarized
- **Real-time Effects**: Scanlines, chromatic aberration, phosphor noise, vignette
- **Theme Engine**: Algorithmic palette generation, live preview, custom theme builder
- **Boot Sequence**: 32-line animated POST with typewriter effect
- **CRT Power-down Animation**: Realistic shutdown sequence

###  25+ Applications
| Category | Apps |
|----------|------|
| **System** | Terminal (30+ builtins), File Manager, Text Editor (17 languages), Calculator (3 modes), Settings (15 categories), System Monitor, Task Manager |
| **Utilities** | Notes (rich text), Calendar (4 views, ICS), Weather (AQI, astronomy), Clock (world/alarm/stopwatch/timer) |
| **Media** | Browser (tabs), Music Player (visualizer, EQ), Video Player, Image Viewer (edit), Gallery |
| **Creative** | Paint Studio |
| **Communication** | Chat, Mail |
| **Stores/Tools** | App Store, Theme Store, Package Manager |
| **Help/AI** | Guide, AI Assistant |

###  8 Classic Games
| Game | Features |
|------|----------|
| **Tetris** | Ghost piece, hold, next queue, particles, high scores |
| **Snake** | Wrap walls, speed increase, particle bursts |
| **Pong** | AI opponent, particle trails, difficulty levels |
| **Minesweeper** | 3 difficulties, flag/chord, timer |
| **Breakout** | Physics, power-ups (multi-ball, laser, wide paddle) |
| **Space Shooter** | Waves, bosses, power-ups, lives |
| **Typing Racer** | WPM, accuracy, ghost car, multiple texts |
| **Flappy Bird** | Procedural pipes, medals |

###  Developer Tools Suite (Phase 6)
- **Code Editor** — Monaco-based IDE with 50+ languages, LSP mock, debug panel, Git sidebar, terminal, extensions
- **Diff Tool** — Side-by-side/inline diff, 3-way merge conflicts, syntax highlighting, patch export
- **Hex Editor** — Binary editing, structure viewer (BMP/PNG/ZIP/EXE/WAV), search/replace, bookmarks, checksums
- **Database Browser** — SQLite/IndexedDB browser, Monaco SQL editor, schema tree, query builder, import/export
- **DevTools** — DOM inspector, network monitor, console with Monaco REPL, JS profiler, memory snapshots

### ️ Enterprise Infrastructure (Phase 6b - Completed)
- **Logger** — Structured logging with multiple transports, PII redaction, correlation IDs
- **Security** — Capability-based permission system (20+ permissions), CSP management, input sanitization
- **Metrics** — Real-time FPS monitoring, memory profiling, Web Vitals, alerting with Prometheus export
- **Plugin Manager** — Manifest v3 compatibility, sandboxed execution, marketplace API, hot reload
- **TestUtils** — Vitest-compatible test runner, mock factories, component/E2E testing, coverage collection

###  Technical Highlights
- **Zero Dependencies** — Pure vanilla ES6 modules (~45KB gzipped)
- **Event-Driven Architecture** — Central `Bus` with wildcards, priorities, history replay
- **Virtual Filesystem** — IndexedDB-backed with trash bin, watchers, permissions, search
- **Web Audio Synthesis** — All UI sounds generated at runtime (chiptune/FM synthesis)
- **Secure Settings** — Schema validation, encryption, migration, import/export
- **Internationalization** — 5 languages (EN, DE, FR, ES, JA), pluralization, formatters
- **Accessibility** — Reduced motion, high contrast, keyboard navigation, screen reader support

##  Quick Start

```bash
# Clone and serve
git clone https://github.com/mateszko090214/WebOS.git
cd WebOS

# Serve with any static server (required for ES modules)
npx serve .        # or
python3 -m http.server 8000  # or
php -S localhost:8000

# Open http://localhost:8000
```

**No build step required.** Opens directly in any modern browser.

### Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `Win` / `Ctrl+Esc` | Open Start Menu |
| `Win+E` | File Manager |
| `Win+R` | Run Dialog |
| `Win+D` | Show Desktop |
| `Ctrl+Alt+Del` | Task Manager |
| `Win+1-9` | Switch Workspace |
| `Win+Tab` | Task Switcher |
| `F11` | Fullscreen Window |
| `Ctrl+Shift+T` | New Terminal Tab |

##  Project Structure

```
RetroWebOS/
├── index.html              # Desktop shell (boot, login, lock, desktop, windows)
├── src/
│   ├── main.js             # App registry, global shortcuts, session init
│   ├── core/               # OS Kernel & Services
│   │   ├── Bus.js          # Event bus (pub/sub, wildcards, priority, history)
│   │   ├── IDB.js          # IndexedDB wrapper (schema, migrations, cache)
│   │   ├── Crypto.js       # Web Crypto (PBKDF2, AES-GCM, HMAC, hashing)
│   │   ├── FS.js           # Virtual FS (VFS, trash, watchers, search, perms)
│   │   ├── Audio.js        # Web Audio synthesis (oscillators, envelopes, SFX)
│   │   ├── Settings.js     # Settings (schemas, categories, migration, encrypt)
│   │   ├── Kernel.js       # Services, processes, syscalls, daemons, scheduler
│   │   ├── I18n.js         # i18n (5 langs, plurals, formatters, interpolation)
│   │   ├── Logger.js       # Structured logging framework
│   │   ├── Security.js     # Capability-based permissions, CSP, sanitization
│   │   ├── Metrics.js      # Performance monitoring, Web Vitals, alerting
│   │   ├── PluginManager.js# Extension system (Manifest v3 compatible)
│   │   └── TestUtils.js    # Testing infrastructure (Vitest-compatible)
│   │
│   ├── ui/                 # UI Components
│   │   ├── components/     # WindowManager, Desktop, Taskbar, StartMenu,
│   │   │                   # ContextMenu, Notifications, GlobalSearch, TopBar,
│   │   │                   # ModalManager, DesktopPet, DesktopWidgets,
│   │   │                   # VirtualKeyboard, BootSequence
│   │   └── styles/
│   │       └── main.css    # 3,500+ lines CRT phosphor styling
│   │
│   └── apps/               # 25+ Applications & 8 Games
│       ├── Terminal.js
│       ├── FileManager.js
│       ├── TextEditor.js
│       ├── Calculator.js
│       ├── Settings.js
│       ├── Browser.js
│       ├── MusicPlayer.js
│       ├── VideoPlayer.js
│       ├── ImageViewer.js
│       ├── Gallery.js
│       ├── Notes.js
│       ├── Calendar.js
│       ├── Weather.js
│       ├── Clock.js
│       ├── SystemMonitor.js
│       ├── TaskManager.js
│       ├── Chat.js
│       ├── Mail.js
│       ├── PasswordVault.js
│       ├── AppStore.js
│       ├── ThemeStore.js
│       ├── PackageManager.js
│       ├── Guide.js
│       ├── AIAssistant.js
│       ├── CodeEditor.js
│       ├── DiffTool.js
│       ├── HexEditor.js
│       ├── DatabaseBrowser.js
│       ├── DevTools.js
│       ├── Tetris.js
│       ├── Snake.js
│       ├── Pong.js
│       ├── Minesweeper.js
│       ├── Breakout.js
│       ├── SpaceShooter.js
│       ├── TypingRacer.js
│       └── FlappyBird.js
├── devlog.md               # Developer log
├── README.md               # You are here
└── screenshot.png          # Preview image
```

##  Development

### Running Locally
```bash
# Any static server works (ES modules require HTTP server)
python3 -m http.server 8000
# or
npx serve .
# or
php -S localhost:8000
```

### Module Hot Reload
Apps are loaded dynamically via `import()`. Edit any app file and refresh the window — no full page reload needed.

### Debug Console
Press `F12` → Console. All events logged via `bus.emit()` appear with `[Bus]` prefix.

##  Browser Support

| Browser | Version | Notes |
|---------|---------|-------|
| Chrome | 90+ | Full support |
| Firefox | 88+ | Full support |
| Safari | 15+ | Full support |
| Edge | 90+ | Full support |

**Requires:** ES2020, IndexedDB, Web Audio API, CSS Custom Properties, Canvas API

##  License

MIT License — See [LICENSE](LICENSE) for details.

##  Acknowledgments

- **Visual Style:** DEC VT220, IBM 5151, Commodore 64, Macintosh SE
- **Window Management:** Classic Mac OS System 7, Windows 95, X11 twm/fvwm
- **Terminal:** GNU Bash, fish shell, busybox
- **Audio:** NES APU, C64 SID, Sega Genesis YM2612
- **Desktop Pet:** Neko (Mac), Shimeji (Win), ONEKO (X11)
- **Wallpapers:** Demoscene procedural generation techniques

##  Stats

| Metric | Value |
|--------|-------|
| **Total LOC** | ~45,000+ |
| **Core Modules** | 12 |
| **UI Components** | 13 |
| **Applications** | 25+ |
| **Games** | 8 |
| **Themes** | 8 |
| **Wallpapers** | 11 |
| **Languages** | 5 |
| **Dev Time** | ~1,200 hrs |

---

> *"It's not a bug, it's a feature from the 80s."*
>
> **RetroWebOS v1.0 "Phosphor"** — Made with  for retro computing