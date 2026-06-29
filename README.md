 RetroOS webOS v2.0
A retro-styled webOS simulation with CRT monitor effects, Luna Service Bus (LS2) IPC emulation, and 13 working applications including games like Space Shooter.

Quick Links: Live Demo · Report Bug · Request Feature

Table of Contents
Overview
Features
Applications
Space Shooter
Controls
Architecture
Quick Start
Themes Preview
Project Statistics
Contributing
Roadmap
License
Acknowledgments
Overview
RetroOS webOS is a fully functional, single-file operating system simulation that runs entirely in your web browser. Built with vanilla HTML5, CSS3, and JavaScript, it provides a complete desktop experience featuring a retro CRT monitor aesthetic inspired by 1980s computer systems and the LG webOS interface.

Key Highlights:

No build step required
No external dependencies
Single file deployment
Full localStorage persistence
Real Luna Service Bus IPC emulation
Features
System Emulation
BIOS-style boot sequence with realistic kernel messages
Luna Service Bus (LS2) IPC emulation with 14 active services
Virtual filesystem with read, write, and delete operations
Process management and service tracking
Window manager with drag, resize, and maximize capabilities
4 virtual desktops for workspace organization
App Store with installable third-party applications
Visual Effects
CRT monitor simulation including scanlines, glow, and vignette
Chromatic aberration effect for authentic retro displays
Particle cursor trail following mouse movement
3 phosphor color themes: Amber, Green, and Blue
4 animated wallpapers: Synthwave, Matrix Rain, Stars, Rainbow
localStorage persistence for all user settings
Applications
RetroOS includes 13 fully functional applications across multiple categories:

System Applications
Terminal — Real command shell with file operations and Luna Bus IPC
File Manager — Browse the virtual filesystem with directory navigation
Settings — Customize themes, wallpapers, and system preferences
Task Manager — View running processes and terminate misbehaving applications
App Store — Browse and install available applications
Utility Applications
Calculator — Fully functional calculator with all standard operations
Text Editor — Edit text files with tab support and character counting
Browser — Retro-styled browser with internal documentation pages
Pixel Art — Pixel art editor with 5 drawing tools and 16 colors
Games
Minesweeper — Classic mine-finding puzzle game with flood-fill reveals
Snake — Classic snake game with smooth controls
Space Shooter — Featured shoot-em-up with multiple enemy types and power-ups
Space Shooter
The featured game in RetroOS is a complete arcade-style shoot 'em up with the following features:

Gameplay Features
5 enemy types: Grunt, Zigzag, Shooter, Tank, and Boss
3 weapon types: Normal, Laser, and Missile
4 power-up types: Heal, Laser ammo, Missile ammo, and Special attack
Progressive wave system that increases difficulty
Highscore system saved to localStorage
Controls
Left/Right Arrow Keys — Move your ship
Spacebar — Shoot
Enter — Activate special attack
Enemy Roster
Enemy	Description
Grunt	Standard enemy with basic movement
Zigzag	Moves in a side-to-side pattern
Shooter	Fires bullets at the player
Tank	High HP enemy with slow movement
Boss	Massive HP boss that drops multiple power-ups
Controls
Shortcut	Action
Ctrl + Esc	Open Power menu
Alt + Tab	Cycle through open windows
Ctrl + Alt + Left Arrow	Switch to previous workspace
Ctrl + Alt + Right Arrow	Switch to next workspace
Esc	Close open menus
Right-click on desktop	Open context menu
Double-click titlebar	Maximize or restore window
Architecture
RetroOS uses a modular single-file architecture that keeps all code in one place while maintaining clear separation of concerns:

Core Modules:

Storage — Handles localStorage persistence layer
Audio — Manages Web Audio API sound effects
Kernel — Implements Luna Service Bus and process management
FS — Virtual filesystem operations
State — Global application state manager
AppRegistry — Tracks installed and available apps
OS — Main orchestrator handling boot, login, and UI
Apps — Individual application implementations
The modular design allows for easy understanding and modification, while the single-file deployment makes it trivial to host anywhere.

Quick Start
Online Access (Recommended)
Visit the live demo directly in your browser:

https://mateszko090214.github.io/WebOS/

No installation required. The app runs entirely in your browser.

Local Installation
Clone the repository and open the HTML file:

git clone https://github.com/mateszko090214/WebOS.git
cd WebOS
Then open index.html in your web browser. Alternatively:

Windows: Double-click the file or run start index.html
macOS: Run open index.html
Linux: Run xdg-open index.html
System Requirements: Any modern web browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)

Themes Preview
RetroOS ships with three phosphor color themes inspired by classic CRT monitors:

Theme	Description
Amber (Default)	Classic amber phosphor, evokes 1970s-80s computer terminals
Green	Old-school green phosphor, iconic early computer aesthetic
Blue	Cool blue tones, cyberpunk-inspired modern terminal look
Switch between themes in Settings → Display → Theme

Project Statistics
File Count: 1 (single index.html)
File Size: Approximately 30 KB
Applications: 13 working applications
Luna Services: 14 emulated services
Themes: 3 phosphor color schemes
Wallpapers: 4 animated backgrounds
Storage: localStorage-based persistence
Audio: Web Audio API integration
Contributing
Contributions are welcome! This project is intentionally simple, making it accessible for new contributors.

How to contribute:

Fork the repository
Create a feature branch (git checkout -b feature/YourFeature)
Make your changes and commit them (git commit -m "Add YourFeature")
Push to your branch (git push origin feature/YourFeature)
Open a Pull Request
Ideas for contributions:

Additional applications or games
New wallpapers or themes
Luna Bus service implementations
UI/UX improvements
Bug fixes and optimizations
Documentation improvements
Roadmap
Future enhancements being considered:

Multiplayer functionality over WebRTC
Real audio file playback in the media player
Additional Luna Bus services
More retro games (Chess, Pong, Tetris)
Plugin system for community-contributed apps
Expanded theme and wallpaper collection
Mobile touch gesture support
Accessibility improvements
Known Limitations
Single-file architecture is intentional for portability but limits code splitting
Audio playback requires user interaction before the first sound (browser security policy)
localStorage has a quota of approximately 5MB per browser
Some resource-intensive effects may impact performance on older devices
License
This project is distributed under the MIT License. See the LICENSE file for complete details.

MIT License

Copyright (c) 2024 Synthwave Systems

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
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
Acknowledgments
This project was inspired by and incorporates ideas from the following sources:

LG webOS — Interface design patterns and architectural concepts
1980s Synthwave Movement — Visual aesthetic and color palette
CRT Display Research — Scanline, glow, and chromatic aberration techniques
Classic Computer Terminals — Phosphor color themes and typography
BIOS Boot Screens — Boot sequence style and messaging
Special thanks to the open-source community for the Web Audio API, localStorage, and other browser technologies that made this project possible.

Contact
GitHub: @mateszko090214
Project Repository: https://github.com/mateszko090214/WebOS
Live Demo: https://mateszko090214.github.io/WebOS/
Issues: https://github.com/mateszko090214/WebOS/issues
Made with passion and lots of caffeine.

"Bringing the 80s back to your browser, one pixel at a time."
