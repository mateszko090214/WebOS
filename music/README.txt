VoidOS Music Player — how tracks in this folder get found
============================================================

Drop any .mp3 / .m4a / .ogg / .wav file into this folder and it will
show up in the Music Player's playlist automatically. How that
detection happens depends on where VoidOS is hosted:

1. GitHub Pages
   The player reads this folder straight from the public GitHub API
   for the repo the page is served from. No extra step — just add
   files and push.

2. Local dev server / any host with directory listing enabled
   (e.g. `python3 -m http.server` from the project root)
   The player requests this folder and parses the directory listing
   it gets back. Also automatic, no extra step.

3. Any other static host (no directory listing, not GitHub Pages)
   Neither of the above works, so the player falls back to reading
   tracks.txt in this same folder — a plain text file listing one
   filename per line, no code or JSON syntax required. Keep it in
   sync with whatever audio files you actually add here.

tracks.txt is only read as a fallback — if detection methods 1 or 2
already found your files, its contents are ignored.
