# VoidOS Retro – Phosphor Edition

This is the new retro web OS, **"the void retro"**, a side project of the Retro OS.

## Overview

VoidOS Retro is a nostalgic desktop experience that simulates CRT effects, retro themes, and classic PC aesthetics entirely using HTML/CSS/JavaScript. It brings the authentic feel of vintage computing to your modern browser with painstaking attention to detail.

## Key Features

### Display & Visual Effects
- **Authentic CRT curvature simulation** using CSS transforms and filters (not canvas-based)
- **Dynamic scanline intensity** that responds to brightness levels like real phosphor decay
- **CRT chromatic aberration** with adjustable color shift
- **CRT bloom/glow** effects for that classic bloom look
- **Phosphor persistence simulation** with configurable decay
- **Degauss command** in terminal that temporarily warps the display with recovery animation
- **Rainbow mode** easter egg (click VoidOS brand 10x)
- **Matrix rain** effect (terminal easter egg)
- **Confetti burst** (Konami code easter egg)
- **Cursor trail** effect (configurable in settings)

### Retro Themes & Wallpapers
- **6 built-in phosphor themes**: Green (classic terminal), Blue, Pink, Purple, White, and custom colors
- **4 authentic vintage wallpapers**:
  - IBM green terminal
  - Apple II monitor 
  - VT100 amber
  - RGB composite artifact
- **ThemeEngine** that accepts spectral power distributions for accurate phosphor emulation
- **Dynamic theme switching** with persistence via IndexedDB

### Authentic Terminal Experience
- **True CGA/EGA/VGA color palettes** with customizable intensity
- **Boot sequence** mimicking POST beeps, memory count, and BIOS splash screen
- **System sounds** regenerated using Web Audio API to emulate SN76489 and AY-3-8910 chips
- **Power-down surge** shutdown animation with fading glow
- **"Degauss" command** that temporarily warps display (with recovery)
- **Cursor blink rate** that respects system accessibility settings
- **Terminal bell** filtered through CRT speaker simulation

### Retro Inspector DevTool
- Real-time toggling of individual CRT effects (scanlines, curvature, bloom, phosphor bloom, chromatic shift)
- Performance impact overlay showing frame cost
- Pure CSS solution keeping effects under 2ms frame cost even on integrated graphics

### Desktop & Window Management
- **Floating window manager** with compositing and edge-snapping
- **Window persistence** option that leaves ghost images when dragging (like long-persistence phosphor)
- **Snap-to-edges** functionality (drag window to screen edge to maximize/split)
- **Window minimization/maximization** with animations
- **Resize handles** on windows
- **Desktop pet** (cat) that reacts to system CPU load
- **Desktop icons** for apps and files
- **Taskbar/dock** with running indicators

### Filesystem & Apps
- **Virtual FileSystem** with persistence via browser storage (falls back to session-only)
- **Pre-loaded apps**: Terminal, Files, Text Editor, Calculator, Music Player, Notes, Gallery, Store, Weather, Timer, Kanban, Spotlight, Window Switcher, and more
- **Persistent settings** stored in IndexedDB with encrypted backup
- **Drag and drop** file management
- **Trash can** with restore/permanent delete
- **IndexedDB-backed preferences** per user

### System Utilities
- **System monitor** widget showing CPU, memory, and uptime
- **Clock widget** with date/time
- **Quote/widget** system with rotating messages
- **Settings app** with comprehensive customization
- **Search/Spotlight** (Cmd+K or Ctrl+K)
- **About dialog** with system information
- **Doomscroll** feed for news/social media simulation
- **Guides/tutorials** system
- **Classic games**: Snake, Sudoku, Calculator
- **Terminal utilities**: ls, cd, cat, echo, whoami, date, neofetch, fortune, cowsay, theme, crt, matrix, sudo, help, history, clear, open, apps, mkdir, touch, rm, tree, pwd, echo, etc.

### Entertainment & Productivity
- **Music player** with visualization and playlists
- **Notes app** with rich text editing
- **Gallery** for image viewing
- **Calculator** with scientific functions
- **Weather app** 
- **Timer/stopwatch**
- **Kanban board** for task management
- **Files app** for virtual filesystem browsing
- **Store** for downloading additional themes/apps
- **Dotfiles sync** tool
- **Distro tracker** for logging OS trials

### Easter Eggs & Secrets
- **Konami code** (↑↑↓↓←→←→BA) for confetti burst
- **Matrix rain** (type "matrix" in terminal)
- **Rainbow mode** (click VoidOS brand 10x in top bar)
- **Secret commands** in terminal
- **Hidden features** throughout the OS

## Technical Implementation

- **Pure HTML/CSS/JavaScript** - no frameworks or external dependencies
- **CSS Grid/Flexbox** for responsive layouts
- **CSS Animations/Transitions** for smooth UI interactions
- **Web Audio API** for authentic chip sound synthesis
- **LocalStorage/IndexedDB** for persistence
- **RequestAnimationFrame** for efficient animations
- **Modular JavaScript** architecture with app registration system
- **Virtual DOM-like** filesystem implementation
- **Event-driven** window management system

## Getting Started

1. **Download**: Clone or download this repository
2. **Open**: Open `retrovoid.html` in any modern browser
3. **Explore**: Click around, try the terminal, open apps, customize settings
4. **Easter eggs**: Try the Konami code, type "matrix" in terminal, or click the brand logo 10x

## Try it Live

Experience VoidOS Retro instantly: [https://web-void-os.netlify.app](https://web-void-os.netlify.app)

## Download the Retro OS (Main Project)

This is a side project of the Retro OS. Get the main project here:
https://github.com/mateszko090214/WebOS.git

## Development

### Project Structure
- `retrovoid.html` - Main application file
- `README.md` - This file
- `LICENSE` - MIT license
- `DEVLOG.md` - Development changelog

### Customization
- Edit CSS variables in `:root` to change colors and effects
- Modify JavaScript to add new apps or features
- Add wallpapers to the Pictures folder in the virtual filesystem
- Extend the ThemeEngine with new phosphor profiles

## Browser Support

Works in all modern browsers:
- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge

Note: Some advanced CSS filters may have varying performance across browsers.

## Credits

Created by **mateszko090214** as a side project of the Retro OS.

Inspired by retro computing enthusiasts and the demoscene community.

## License

MIT License - see [LICENSE](LICENSE) file for details.

Copyright (c) 2026 mateszko090214