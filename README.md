# VoidOS Retro – Phosphor Edition

<div align="center">

![VoidOS Retro Banner](https://via.placeholder.com/1200x400/0a0b12/e7f1ea?text=VoidOS+Retro+%E2%80%93+Phosphor+Edition)

[![GitHub Release](https://img.shields.io/github/v/release/mateszko090214/webos?style=for-the-badge)](https://github.com/mateszko090214/webos/releases/latest)
[![GitHub License](https://img.shields.io/github/license/mateszko090214/webos?style=for-the-badge)](LICENSE)
[![GitHub Last Commit](https://img.shields.io/github/last-commit/mateszko090214/webos?style=for-the-badge)](https://github.com/mateszko090214/webos/commits/main)
[![Maintenance](https://img.shields.io/badge/Maintained%20Yes-Yes-brightgreen?style=for-the-badge)](https://github.com/mateszko090214/webos/graphs/commit-activity)
[![HitCount](https://hits.dwyl.com/mateszko090214/webos.svg?style=for-the-badge)](https://hits.dwyl.com/mateszko090214/webos)

# VoidOS Retro – Phosphor Edition

**Experience the authentic feel of vintage computing in your modern browser**

> **Version:** 2.5 "Phosphor"  
> **Release Date:** August 27, 2026  
> **Status:** Stable ✅  
> **Works in:** All Modern Browsers

[![Try it Live](https://img.shields.io/badge/Try_It_Live-web-void--os.netlify.app-00ff00?style=for-the-badge&logo=internet-explorer)](https://web-void-os.netlify.app)
[![Download Latest](https://img.shields.io/badge/Download-Latest-60a5fa?style=for-the-badge&logo=github)](https://github.com/mateszko090214/webos/releases/latest)
[![Report Bug](https://img.shields.io/badge/Report_Bug-Issues-red?style=for-the-badge&logo=github)](https://github.com/mateszko090214/webos/issues)

---

## Overview

VoidOS Retro is a nostalgic desktop experience that simulates CRT effects, retro themes, and classic PC aesthetics entirely using HTML/CSS/JavaScript. It brings the authentic feel of vintage computing to your modern browser with painstaking attention to detail.

This Phosphor Edition (v2.5) represents the culmination of months of development, featuring advanced visual effects, authentic terminal experiences, and a rich ecosystem of built-in applications.

---

## Key Features

### 🖥️ Display & Visual Effects
| Feature | Description |
|---------|-------------|
| **Authentic CRT Curvature** | Using CSS transforms and filters (not canvas-based) for true geometric accuracy |
| **Dynamic Scanline Intensity** | Responds to brightness levels like real phosphor decay |
| **CRT Chromatic Aberration** | Adjustable color shift for authentic analog display artifacts |
| **CRT Bloom/Glow** | Configurable bloom effects for that classic CRT look |
| **Phosphor Persistence Simulation** | With tunable decay characteristics |
| **Degauss Command** | Terminal command that temporarily warps display with smooth recovery animation |
| **Rainbow Mode** | Easter egg (click VoidOS brand 10x) |
| **Matrix Rain Effect** | Terminal easter egg triggered by "matrix" command |
| **Confetti Burst** | Konami code easter egg (↑ ↑ ↓ ↓ ← → ← → B A) |
| **Cursor Trail Effect** | Configurable in Settings > Display |
| **Custom Hand-Drawn Cursor** | Sprite for authentic retro feel |
| **Procedural Live Wallpapers** | Starfield, matrix rain, plasma waves - generated in-browser |
| **Video Background Live Wallpapers** | YouTube embeds with automatic fallback to procedural effects |

### 🎨 Retro Themes & Wallpapers
| Feature | Description |
|---------|-------------|
| **6 Built-in Phosphor Themes** | Green (classic terminal), Blue, Pink, Purple, White, and custom colors |
| **4 Authentic Vintage Wallpapers** | IBM green terminal, Apple II monitor, VT100 amber, RGB composite artifact |
| **Advanced ThemeEngine** | Accepts spectral power distributions for accurate phosphor emulation |
| **Dynamic Theme Switching** | With persistence via IndexedDB |
| **Live Wallpaper System** | Procedural generation (starfield/matrix rain/plasma) and video backgrounds |

### 💻 Authentic Terminal Experience
| Feature | Description |
|---------|-------------|
| **True CGA/EGA/VGA Color Palettes** | With customizable intensity |
| **Enhanced Boot Sequence** | Detailed systemd-like boot logs showing service initialization |
| **Persistence Layer Status** | Displayed during boot (browser storage vs session-only) |
| **Authentic System Sounds** | Regenerated using Web Audio API to emulate SN76489 and AY-3-8910 chips |
| **Power-Down Surge** | Shutdown animation with realistic fade-out |
| **"Degauss" Command** | Temporarily warps display (with recovery animation) |
| **Accessibility-Compliant Cursor** | Blink rate respects system accessibility settings |
| **Filtered Terminal Bell** | Audio processed through CRT speaker simulation |
| **Enhanced Command History** | With additional utilities (`neofetch`, `fortune`, `cowsay`, `theme`, `crt`, `matrix`, etc.) |

### 🔍 Retro Inspector DevTool
| Feature | Description |
|---------|-------------|
| **Real-Time CRT Effect Toggling** | Individual control of scanlines, curvature, bloom, phosphor bloom, chromatic shift |
| **Performance Impact Overlay** | Shows frame cost for each effect |
| **Pure CSS Solution** | Maintains effects under 2ms frame cost even on integrated graphics |

### 🖱️ Desktop & Window Management
| Feature | Description |
|---------|-------------|
| **Floating Window Manager** | With compositing and edge-snapping |
| **Window Persistence Option** | Leaves ghost images when dragged (like long-persistence phosphor) |
| **Snap-to-Edges Functionality** | Drag window to screen edge to maximize/split |
| **Window Minimization/Maximization** | With smooth animations |
| **Resize Handles** | On all windows |
| **Desktop Pet** | Cat/dog/rabbit that reacts to system CPU load |
| **Desktop Icons** | For apps and files |
| **Taskbar/Dock** | With running application indicators |
| **Enhanced Titlebar Styling** | With pulsing indicators |
| **Retro Beveled Button Styling** | Throughout windows and menus |

### 📁 Filesystem & Apps
| Feature | Description |
|---------|-------------|
| **Virtual FileSystem** | With persistence via browser storage (falls back to session-only) |
| **Pre-loaded Applications** | Terminal, Files, Text Editor, Calculator, Music Player, Notes, Gallery, Store, Weather, Timer, Kanban, Spotlight, Window Switcher, and more |
| **Persistent Settings** | Stored in IndexedDB with encrypted backup |
| **Drag and Drop File Management** | Between folders and applications |
| **Trash Can** | With restore/permanent delete functionality |
| **IndexedDB-Backed Preferences** | Per-user settings storage |
| **Enhanced Drag-and-Drop** | Between folders in Files app |

### ⚙️ System Utilities
| Feature | Description |
|---------|-------------|
| **System Monitor Widget** | Shows CPU, memory, and uptime |
| **Clock Widget** | With date/time display |
| **Quote/Widget System** | With rotating inspirational messages |
| **Comprehensive Settings App** | Full system customization |
| **Search/Spotlight** | (Cmd+K or Ctrl+K) - search apps and files |
| **About Dialog** | With detailed system information |
| **Doomscroll Feed** | News/social media simulation |
| **Guides/Tutorials System** | Built-in help documentation |
| **Classic Games** | Snake, Sudoku, Calculator |
| **Extensive Terminal Utilities** | `ls`, `cd`, `cat`, `echo`, `whoami`, `date`, `neofetch`, `fortune`, `cowsay`, `theme`, `crt`, `matrix`, `sudo`, `help`, `history`, `clear`, `open`, `apps`, `mkdir`, `touch`, `rm`, `tree`, `pwd`, etc. |
| **Achievements System** | Tracks unlocked easter eggs and challenges |

### 🎵 Entertainment & Productivity
| Feature | Description |
|---------|-------------|
| **Music Player** | With visualization and playlists |
| **Notes App** | With rich text editing capabilities |
| **Gallery** | For image viewing |
| **Scientific Calculator** | With trigonometric and logarithmic functions |
| **Weather App** | Current conditions and forecasts |
| **Timer/Stopwatch** | Precision timing tools |
| **Kanban Board** | For task management |
| **Files App** | For virtual filesystem browsing |
| **Store** | For downloading additional themes and applications |
| **Dotfiles Sync Tool** | For configuration management |
| **Distro Tracker** | For logging operating system trials |

### 🥚 Easter Eggs & Secrets
| Feature | Description |
|---------|-------------|
| **Konami Code** | (↑ ↑ ↓ ↓ ← → ← → B A) for confetti burst |
| **Matrix Rain** | Type "matrix" in terminal |
| **Rainbow Mode** | Click VoidOS brand 10x in top bar |
| **Secret Commands** | Hidden functionality in terminal |
| **Hidden Features** | Throughout the operating system |
| **Achievement Tracking** | For discovering secrets and completing challenges |

---

## Technical Implementation

| Implementation Detail | Description |
|-----------------------|-------------|
| **Pure HTML/CSS/JavaScript** | Zero frameworks or external dependencies |
| **CSS Grid & Flexbox** | For responsive, adaptive layouts |
| **CSS Animations & Transitions** | For smooth UI interactions and effects |
| **Web Audio API** | For authentic chip-based sound synthesis |
| **Browser Storage APIs** | LocalStorage/IndexedDB for persistence |
| **RequestAnimationFrame** | For efficient, battery-friendly animations |
| **Modular JavaScript Architecture** | App registration system for extensibility |
| **Virtual DOM-Like Implementation** | For filesystem representation |
| **Event-Driven Window Management** | Decoupled, scalable UI architecture |
| **Procedural Generation** | For live wallpapers (no external assets required) |
| **YouTube Embed Integration** | For video backgrounds with intelligent fallback system |

---

## Getting Started

### Installation
1. **Download**: Clone or download this repository
   ```bash
   git clone https://github.com/mateszko090214/webos.git
   ```
2. **Open**: Launch `voidos-retro-phosphor5.html` in any modern browser
3. **Explore**: Navigate the desktop, try the terminal, launch applications, customize settings

### Discovering Easter Eggs
- **Konami Code**: Press ↑ ↑ ↓ ↓ ← → ← → B A on your keyboard
- **Matrix Rain**: Type `matrix` in the terminal and press Enter
- **Rainbow Mode**: Click the VoidOS brand logo in the top bar 10 times

### Customizing Your Experience
- **Live Wallpapers**: Visit Settings > Display for options (starfield, matrix rain, plasma, or video backgrounds)
- **CRT Effects**: Access the Retro Inspector DevTool via F12 or Settings > Advanced to fine-tune visual effects
- **Themes**: Personalize your experience via Settings > Appearance with 6 built-in phosphor themes
- **System Sounds**: Adjust audio preferences in Settings > Audio

---

## Try It Live

Experience VoidOS Retro instantly without installation:

**[https://web-void-os.netlify.app](https://web-void-os.netlify.app)**

---

## Development

### Project Structure
```
webos/
├── voidos-retro-phosphor5.html   # Main application file
├── README.md                     # This documentation
├── DEVLOG.md                     # Detailed changelog
├── LICENSE                       # MIT license
└── assets/                       # Static assets (if any)
```

### Customization & Extension
- **Styling**: Modify CSS variables in `:root` to change colors, effects, and animations
- **Functionality**: Extend JavaScript to add new applications or system features
- **Wallpapers**: Add custom images to the Pictures folder in the virtual filesystem
- **Themes**: Extend the ThemeEngine with new phosphor profiles and spectral distributions
- **Live Wallpapers**: Create custom procedural wallpaper modes using the canvas-based system
- **Video Backgrounds**: Add YouTube video IDs to the `bgVideoIds` configuration
- **Terminal Commands**: Implement new commands in the terminal's command registry
- **System Services**: Add new background services to the boot sequence

### Browser Support

| Browser | Support Status | Notes |
|---------|----------------|-------|
| **Chrome/Chromium** | ✅ Recommended | Best performance and feature compatibility |
| **Firefox** | ✅ Fully Supported | Minor variations in CSS filter rendering |
| **Safari** | ✅ Fully Supported | Optimized for energy efficiency on mobile |
| **Edge** | ✅ Fully Supported | Identical to Chrome/Chromium base |

> **Note**: Advanced CSS filters, procedural animations, and YouTube embeds may exhibit varying performance across different hardware configurations. Video backgrounds intelligently fall back to procedural effects when network restrictions or embed failures occur.

---

## Credits

**Created by**: **mate** (mateszko090214)

Inspired by the retro computing community, demoscene artists, and preservationists who keep the spirit of vintage technology alive.

Special thanks to all contributors, testers, and the open-source community for their invaluable feedback and support.

---

## License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for full details.

```
Copyright (c) 2026 mateszko090214

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
DEALINGS IN THE SOFTWARE.
```

*Last updated: August 27, 2026*
