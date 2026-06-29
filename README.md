#  RetroOS webOS v2.0

> A retro-styled webOS simulation with CRT monitor effects, full Luna Service Bus (LS2) IPC emulation, and 18 working applications including a Space Shooter game.

[![GitHub Pages](https://img.shields.io/badge/demo-live-brightgreen?style=for-the-badge)](https://mateszko090214.github.io/WebOS/)
[![Netlify Status](https://api.netlify.com/api/v1/badges/YOUR_BADGE_ID/deploy-status)](https://your-site.netlify.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Made with HTML5](https://img.shields.io/badge/Made%20with-HTML5-orange?style=for-the-badge)](https://developer.mozilla.org/)

##  Features

###  System Emulation
-  **BIOS-style boot sequence** with kernel messages
-  **Luna Service Bus (LS2)** IPC emulation with 14 services
-  **Virtual filesystem** with read/write/delete operations
-  **Process management** (Kernel, Services, Apps)
-  **Window manager** with drag, resize, snap zones
-  **4 virtual desktops** (Ctrl+Alt+←/→)
-  **App Store** with installable applications

###  Visual Effects
-  **CRT monitor simulation** (scanlines, glow, vignette, flicker)
-  **Chromatic aberration** effect
-  **Particle cursor** trail effect
-  **3 phosphor themes** (Amber, Green, Blue)
-  **Multiple wallpapers** (Synthwave default, Matrix rain, Stars, Rainbow)

###  Applications (18)

| App | Category | Description |
|-----|----------|-------------|
|  **Terminal** | System | Real shell with `ls`, `cd`, `cat`, `ls2` (Luna Bus) commands |
|  **File Manager** | System | Browse virtual filesystem, edit files |
|  **Settings** | System | Customize theme, wallpaper, scanlines, particles |
|  **Task Manager** | System | View & kill processes with real-time stats |
|  **App Store** | System | Install new apps from the store |
|  **Activities** | System | webOS-style activity manager |
|  **About** | System | System information |
|  **Calculator** | Utility | Fully functional calculator |
|  **Text Editor** | Utility | Edit text files with save support |
|  **Browser** | Utility | Retro browser with 5 internal pages |
|  **Pixel Art** | Utility | 32x32 pixel art editor with 5 tools & 16 colors |
|  **Media Player** | Media | Synthwave visualizer & playlist |
|  **Image Viewer** | Media | 4 generated synthwave artworks |
|  **System Monitor** | System | Real-time CPU graph |
|  **Minesweeper** | Games | Classic mine-finding game |
|  **Retro Paint** | Utility | Drawing app with 7 tools |
|  **Snake** | Games | Classic snake game |
|  **Space Shooter** | Games | Shoot 'em up arcade with bosses & powerups |
|  **Weather** | Utility | Synthwave Weather widget |

###  Persistence
-  Settings saved to localStorage
-  Filesystem persists across sessions
-  Notifications history saved
-  Active workspace remembered
-  Highscores for games (Space Shooter)

##  Space Shooter (NEW!)

A classic arcade shoot 'em up with:
- 5 enemy types (Grunt, Zigzag, Shooter, Tank, Boss)
- 3 weapon types (Normal, Laser, Missile)
- 4 power-up types (Heal, Laser, Missile, Special)
- 5 progressive waves
- Boss fight on wave 5
- Highscore system

**Controls:** ← → Move | SPACE Shoot | ENTER Special (charges)

##  Controls

| Keys | Action |
|------|--------|
| `Ctrl+Esc` | Open Power menu |
| `Alt+Tab` | Cycle through windows |
| `Ctrl+Alt+←` | Previous workspace |
| `Ctrl+Alt+→` | Next workspace |
| `Esc` | Close menus |
| `Right-click` (desktop) | Open context menu |
| Drag windows to screen edges | Snap to side |
| Double-click titlebar | Maximize window |

##  Architecture

### Modular Design (Single-File)

