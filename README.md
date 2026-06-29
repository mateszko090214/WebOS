 RetroOS webOS v2.0
A retro-styled webOS simulation with CRT monitor effects, full Luna Service Bus (LS2) IPC emulation, and 13 working applications including games like Space Shooter.

License: MIT Made with HTML5 Live Demo

 Features
 System Emulation
 BIOS-style boot sequence with kernel messages
 Luna Service Bus (LS2) IPC emulation with 14 services
 Virtual filesystem with read/write operations
 Process management (Kernel, Services, Apps)
 Window manager with drag, resize, and maximize
 4 virtual desktops (Ctrl+Alt+←/→)
 App Store with installable applications
 Visual Effects
 CRT monitor simulation — scanlines, glow, vignette, flicker
 Chromatic aberration effect
 Particle cursor trail effect
 3 phosphor themes — Amber, Green, Blue
 4 wallpapers — Synthwave, Matrix Rain, Stars, Rainbow
 Applications (13)
App	Category	Description
 Terminal	System	Real shell with ls, cd, cat, ls2 (Luna Bus) commands
 File Manager	System	Browse virtual filesystem
 Settings	System	Customize theme, wallpaper, scanlines
 Task Manager	System	View & kill processes
 App Store	System	Install new apps from the store
 About	System	System information
 Calculator	Utility	Fully functional calculator
 Text Editor	Utility	Edit text files with save support
 Browser	Utility	Retro browser with internal pages
 Pixel Art	Utility	Pixel art editor with tools & colors
 Minesweeper	Games	Classic mine-finding game
 Snake	Games	Classic snake game
 Space Shooter	Games	Shoot 'em up arcade with waves & powerups
 Space Shooter (★ Featured Game!)
A complete arcade shoot 'em up with:

5 enemy types — Grunt, Zigzag, Shooter, Tank, Boss
3 weapon types — Normal, Laser, Missile
4 power-up types — Heal, Laser, Missile, Special
Progressive waves — Each wave gets harder
Highscore system — Saved to localStorage
Controls: ← → Move | SPACE Shoot | ENTER Special

Controls
Shortcut	Action
Ctrl+Esc	Open Power menu
Alt+Tab	Cycle through windows
Ctrl+Alt+←	Previous workspace
Ctrl+Alt+→	Next workspace
Esc	Close menus
Right-click (desktop)	Open context menu
Double-click titlebar	Maximize window
 Architecture
Modular vanilla JavaScript single-file architecture:

RetroOS webOS
├── Storage    — localStorage persistence
├── Audio      — Web Audio API sound effects
├── Kernel     — Luna Service Bus + process management
├── FS         — Virtual filesystem
├── State      — Global app state
├── AppRegistry — Installed apps registry
├── OS         — Main orchestrator (boot, windows, UI)
└── Apps       — Individual app implementations
Quick Start
View Online
Visit the live demo: https://mateszko090214.github.io/WebOS/

Run Locally
Clone the repo:
git clone https://github.com/mateszko090214/WebOS.git
Open index.html in any modern browser
Wait for the boot sequence (~5 seconds)
Press Enter to login
Start exploring!
No build step, no dependencies. Just plain HTML/CSS/JS. 
License
This project is licensed under the MIT License.

Acknowledgments
Inspired by LG webOS interface design
Synthwave aesthetic from the 80s retrofuture movement
CRT monitor research from shader-presentation
Phosphor color theme inspired by old terminals
Made with 💜 and lots of ☕

"Bringing the 80s back, one pixel at a time" 
