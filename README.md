# VoidOS Retro – Phosphor Edition

This is the new retro web OS, "the void retro", a side project of the Retro OS.

## Overview
VoidOS Retro is a nostalgic desktop experience simulating CRT effects, retro themes, and classic PC aesthetics entirely in HTML/CSS/JS.

## Features
- Authentic CRT curvature simulation (CSS transforms + filters)
- Dynamic scanline intensity responding to brightness (like real phosphor decay)
- 4 vintage wallpapers: IBM green terminal, Apple II monitor, VT100 amber, RGB composite artifact
- Terminal with true CGA/EGA/VGA color palettes
- Boot sequence mimicking POST beeps, memory count, BIOS splash
- Shutdown animation with power-down surge
- System sounds via Web Audio API emulating SN76489 and AY-3-8910 chips
- “Degauss” command to temporarily warp the display
- Retro Inspector DevTool toggling CRT effects in real‑time
- ThemeEngine accepting spectral power distributions for accurate phosphor emulation
- Audio.js noise generators for tape hiss and RF interference
- WindowManager persistence option (ghost images when dragging)
- FS.js stores theme preferences per‑user in IndexedDB with encrypted backup
- And much more…

## Devlog
See `DEVLOG.md` for detailed update history.

## Try it live
[VoidOS Retro on Netlify](https://web-void-os.netlify.app)

## Download the Retro OS (main project)
https://github.com/mateszko090214/WebOS.git

## License
MIT