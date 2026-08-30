(function(){
"use strict";

/* ============ PWA / OFFLINE ============
   Best-effort — service workers require https or localhost, so this is a
   silent no-op under file:// (double-clicking index.html) or plain http.
   Never lets a registration failure interrupt boot. */
if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('sw.js').catch(()=>{});
  });
}

/* ============ BOOT ============ */
const logo = ` █░█ █▀█ █ █▀▄ █▀█ █▀
 ▀▄▀ █▄█ █ █▄▀ █▄█ ▄█`;
document.getElementById('boot-logo').textContent = logo;

function buildBootEvents(){
  const persisted = (typeof hasVStore==='function' && hasVStore());
  return [
    {t:'ok', s:'Started Journal Service.'},
    {t:'ok', s:'Started udev Kernel Device Manager.'},
    {t:'ok', s:'Mounted /dev/pts.'},
    {t:'ok', s:'Mounted /sys/kernel/config.'},
    {t:'ok', s:'Mounted /sys/kernel/debug.'},
    {t:'tgt', s:'Local File Systems (Pre)'},
    {t:'ok', s:'Mounted /boot.'},
    {t:'ok', s:'Mounted /home.'},
    {t:'ok', s:'Mounted /home/guest.'},
    {t:'tgt', s:'Local File Systems'},
    {t:'ok', s:'Started Load Kernel Modules.'},
    {t:'ok', s:'Started Apply Kernel Variables.'},
    {t:'ok', s:'Started Remount Root and Kernel File Systems.'},
    {t:'ok', s:'Started Create System Users.'},
    {t:'ok', s:'Started Create Static Device Nodes in /dev.'},
    {t:'tgt', s:'System Initialization'},
    {t:'svc', s:'void-kernel 2.5 compositor', d:170},
    {t:'svc', s:'D-Bus System Message Bus', d:80},
    {t:'svc', s:'Network Manager', d:200},
    {t:'svc', s:'snap-zone engine', d:120},
    {t:'svc', s:'audio subsystem (pipewire-void)', d:140},
    {t:'svc', s:'desktop pet daemon', d:90},
    {t:'svc', s:'crt phosphor compositor', d:120},
    {t:'svc', s: persisted ? 'persistence layer (browser storage found)' : 'persistence layer (session-only, no backend found)', d:190},
    {t:'tgt', s:'Network'},
    {t:'svc', s:'OpenSSH Daemon', d:90},
    {t:'svc', s:'Login Service', d:130},
    {t:'tgt', s:'Multi-User System'},
    {t:'svc', s:'Light Display Manager', d:220},
    {t:'tgt', s:'Graphical Interface'},
  ];
}
const bootLogEl = document.getElementById('boot-log');
const bootRingFg = document.getElementById('bootRingFg'), bootPctEl = document.getElementById('bootPct');
const BOOT_RING_CIRCUMFERENCE = 276.5;
function setBootPct(pct){
  const clamped = Math.max(0, Math.min(100, pct));
  bootRingFg.style.strokeDashoffset = String(BOOT_RING_CIRCUMFERENCE * (1 - clamped/100));
  bootPctEl.textContent = Math.round(clamped)+'%';
}
function bootAddLine(html){
  const d = document.createElement('div'); d.className='bl-line'; d.innerHTML = html;
  bootLogEl.appendChild(d);
  bootLogEl.scrollTop = bootLogEl.scrollHeight;
  return d;
}
/* BIOS-style hardware check, played once before the systemd-style service
   log — purely cosmetic flavor text (this "hardware" is the browser tab). */
const biosLines = [
  '<span class="bl-bios-hdr">VoidOS BIOS v2.7 &quot;Phosphor&quot;</span>',
  '<span class="bl-dim">Copyright (c) 2026 VoidOS Project</span>',
  '',
  'Detecting hardware…',
  '&nbsp;&nbsp;CPU: void-core Neural Engine v4 ........... <span class="bl-ok">OK</span>',
  '&nbsp;&nbsp;GPU: Phosphor Renderer 2.0 ................ <span class="bl-ok">OK</span>',
  '&nbsp;&nbsp;RAM: 8192 MB (simulated) .................. <span class="bl-ok">OK</span>',
  '&nbsp;&nbsp;STORAGE: browser storage ................... <span class="bl-ok">OK</span>',
  '&nbsp;&nbsp;NET: loopback interface .................... <span class="bl-ok">OK</span>',
  '',
  '<span class="bl-ok">All hardware checks passed.</span>',
  '',
];
let bootEvents = null, bi = 0, biosI = 0;
function bootBiosStep(){
  if(biosI >= biosLines.length){
    bootEvents = buildBootEvents();
    setTimeout(bootStep, 120);
    return;
  }
  bootAddLine(biosLines[biosI]);
  biosI++;
  setTimeout(bootBiosStep, 45+Math.random()*35);
}
function bootStep(){
  if(bi >= bootEvents.length){
    setBootPct(100);
    const readyLine = bootAddLine('<span class="bl-ok">System ready.</span> Launching desktop environment<span class="bl-cursor"></span>');
    setTimeout(()=>{
      const b=document.getElementById('boot'); b.style.opacity='0'; setTimeout(()=>b.remove(), 500);
      if(window.startLoginBootLog) startLoginBootLog();
    }, 480);
    return;
  }
  const e = bootEvents[bi];
  setBootPct((bi/bootEvents.length)*100);
  if(e.t==='ok'){
    bootAddLine('<span class="bl-ok">[  OK  ]</span> '+e.s);
    bi++; setTimeout(bootStep, 30+Math.random()*45);
  } else if(e.t==='tgt'){
    bootAddLine('<span class="bl-ok">[  OK  ]</span> Reached target '+e.s+'.');
    bi++; setTimeout(bootStep, 70+Math.random()*70);
  } else if(e.t==='svc'){
    const line = bootAddLine('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Starting '+e.s+'…');
    setTimeout(()=>{
      line.innerHTML = '<span class="bl-ok">[  OK  ]</span> Started '+e.s+'.';
      bootLogEl.scrollTop = bootLogEl.scrollHeight;
      bi++; setTimeout(bootStep, 30+Math.random()*40);
    }, e.d||200);
  }
}
/* ============ POWER ON GATE ============
   Boot no longer starts on page load — it waits for this click/keypress so
   the POST beep below (and any later system sound) has a real user gesture
   to play on, instead of getting silently blocked by autoplay policy. */
/* ============ SYSTEM SOUNDS ============
   Short synthesized retro-chip blips for window open/close, achievements,
   and denied actions. One shared AudioContext (creating a fresh one per
   sound is wasteful and browsers cap how many can exist at once). These
   functions are only ever *called* from user interaction well after the
   script has finished loading, so referencing voidSettings/toast here
   before their own declarations further down the file is safe — nothing
   inside a function body runs until it's invoked. Respects Settings >
   System sounds (on by default; the power-on gate already supplies the
   user gesture these need to avoid being silently autoplay-blocked). */
let sfxCtx = null;
function ensureSfxCtx(){
  if(!sfxCtx){ try{ sfxCtx = new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ return null; } }
  if(sfxCtx.state==='suspended') sfxCtx.resume().catch(()=>{});
  return sfxCtx;
}
function playTone(freq, t0, dur, opts){
  opts = opts||{};
  const ctx = ensureSfxCtx(); if(!ctx) return;
  const osc = ctx.createOscillator(), gain = ctx.createGain();
  osc.type = opts.wave||'square'; osc.frequency.value = freq;
  osc.connect(gain); gain.connect(ctx.destination);
  const start = ctx.currentTime + t0, peak = opts.vol!=null?opts.vol:0.08;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start+0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, start+dur);
  osc.start(start); osc.stop(start+dur+0.02);
}
function sfx(kind){
  if(!voidSettings.sounds) return;
  try{
    if(kind==='open'){ playTone(520,0,0.05); playTone(780,0.05,0.07); }
    else if(kind==='close'){ playTone(700,0,0.05); playTone(420,0.05,0.08); }
    else if(kind==='error'){ playTone(180,0,0.09,{wave:'sawtooth',vol:0.09}); }
    else if(kind==='achievement'){ playTone(660,0,0.08); playTone(880,0.08,0.08); playTone(1100,0.16,0.14); }
  }catch(e){}
}
function playPostBeep(){
  try{
    const ctx = new (window.AudioContext||window.webkitAudioContext)();
    [ [880,0], [1318.5,0.13] ].forEach(([freq,delay])=>{
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type='square'; osc.frequency.value = freq;
      osc.connect(gain); gain.connect(ctx.destination);
      const t0 = ctx.currentTime + delay;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.1, t0+0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0+0.09);
      osc.start(t0); osc.stop(t0+0.11);
    });
  }catch(e){ /* Web Audio unavailable — boot proceeds silently */ }
}
(function(){
  const powerOnEl = document.getElementById('powerOn');
  let started = false;
  function startBoot(){
    if(started) return; started = true;
    powerOnEl.classList.add('hidden');
    setTimeout(()=>powerOnEl.remove(), 450);
    playPostBeep();
    setTimeout(bootBiosStep, 200);
  }
  powerOnEl.addEventListener('click', startBoot, {once:true});
  window.addEventListener('keydown', startBoot, {once:true});
})();

/* ============ LOCK SCREEN ============ */
const lockEl = document.getElementById('lock');
function tickLock(){
  const d=new Date();
  document.getElementById('lockTime').textContent = d.toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'});
  document.getElementById('lockDate').textContent = d.toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'});
}
tickLock(); setInterval(tickLock, 1000*15);
lockEl.style.display='none';
document.getElementById('btnLock').addEventListener('click', ()=>{
  lockEl.style.display='flex'; lockEl.classList.remove('hidden');
  lockEl.classList.toggle('pin-mode', !!(voidSettings.pin && voidSettings.pin.length));
  document.getElementById('lockPinInput').value='';
  tickLock();
});
function doUnlock(){
  lockEl.classList.add('hidden');
  setTimeout(()=>lockEl.style.display='none', 400);
}
function tryLockPin(){
  const input = document.getElementById('lockPinInput');
  if(input.value === voidSettings.pin){ doUnlock(); return; }
  sfx('error');
  lockEl.classList.add('shake'); input.value='';
  setTimeout(()=>lockEl.classList.remove('shake'), 350);
}
lockEl.addEventListener('click', (e)=>{
  if(lockEl.classList.contains('pin-mode')) return; // requires the PIN form instead of a plain click
  doUnlock();
});
document.getElementById('lockPinWrap').addEventListener('click', e=>e.stopPropagation());
document.getElementById('lockPinBtn').addEventListener('click', tryLockPin);
document.getElementById('lockPinInput').addEventListener('keydown', e=>{ if(e.key==='Enter') tryLockPin(); });

/* ============ LOGIN SCREEN (display-manager style, shown once at boot) ============ */
const loginEl = document.getElementById('loginScreen');
function tickLoginClock(){
  const d = new Date();
  document.getElementById('loginTime').textContent = d.toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'});
  document.getElementById('loginDate').textContent = d.toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'});
}
tickLoginClock(); setInterval(tickLoginClock, 1000*15);
(function(){
  const canvas = document.getElementById('loginBgCanvas');
  const ctx = canvas.getContext('2d');
  let stars = [], raf = null;
  function size(){
    const dpr = Math.min(window.devicePixelRatio||1, 2);
    canvas.width = window.innerWidth*dpr; canvas.height = window.innerHeight*dpr;
    canvas.style.width = window.innerWidth+'px'; canvas.style.height = window.innerHeight+'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
    stars = Array.from({length:120}, () => ({ x:(Math.random()-0.5)*window.innerWidth, y:(Math.random()-0.5)*window.innerHeight, z:Math.random()*window.innerWidth }));
  }
  window.addEventListener('resize', size); size();
  function frame(){
    const w=window.innerWidth, h=window.innerHeight, cx=w/2, cy=h/2;
    ctx.fillStyle='#000'; ctx.fillRect(0,0,w,h);
    ctx.fillStyle=cssVar('--accent');
    stars.forEach(s=>{
      s.z -= 2.2;
      if(s.z<=0){ s.x=(Math.random()-0.5)*w; s.y=(Math.random()-0.5)*h; s.z=w; }
      const k = 128/s.z;
      const px = s.x*k+cx, py = s.y*k+cy;
      if(px<0||px>w||py<0||py>h) return;
      ctx.globalAlpha = 1-s.z/w;
      ctx.beginPath(); ctx.arc(px,py,Math.max(0.5,(1-s.z/w)*2),0,Math.PI*2); ctx.fill();
    });
    ctx.globalAlpha=1;
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  window.stopLoginBg = () => cancelAnimationFrame(raf);
})();
/* Boot-style typed status log before the sign-in form reveals — echoes the
   same beat as the systemd-style boot sequence above, so the login screen
   feels like part of the same machine instead of a bolted-on modern form.
   Skippable (click/keypress) so it never gets in the way on repeat visits. */
(function(){
  const logEl = document.getElementById('loginBootLog');
  const authEl = document.getElementById('loginAuth');
  const lines = [
    'establishing local session…',
    'node: voidos-02.local',
    // Deferred to call time (hasVStore is declared further down the file —
    // this IIFE runs immediately, before that declaration is reached).
    () => 'persistence: ' + (hasVStore() ? 'browser storage detected' : 'session-only, no backend found'),
    'awaiting credentials_',
  ];
  let i = 0, revealed = false, timer = null;
  function typeLine(){
    if(i >= lines.length){ reveal(); return; }
    const raw = lines[i];
    const d = document.createElement('div'); d.className = 'lbl-line'; d.textContent = typeof raw==='function' ? raw() : raw;
    logEl.appendChild(d);
    i++;
    timer = setTimeout(typeLine, 170);
  }
  function reveal(){
    if(revealed) return; revealed = true;
    clearTimeout(timer);
    window.removeEventListener('keydown', reveal);
    logEl.classList.add('done');
    authEl.classList.add('show');
    setTimeout(()=>{ const pin = document.getElementById('loginPinInput'); if(pin) pin.focus(); }, 200);
  }
  // Started from the boot sequence's completion (see bootStep()), not at
  // page-load — otherwise the whole typewriter effect plays out behind the
  // boot screen while it's still covering the login screen, and by the time
  // it's actually visible the log has already finished typing unseen.
  window.startLoginBootLog = ()=>{ timer = setTimeout(typeLine, 260); };
  loginEl.addEventListener('click', (e)=>{ if(!e.target.closest('.login-auth') && !e.target.closest('.login-power')) reveal(); });
  window.addEventListener('keydown', reveal);
})();
function doLogin(){
  const input = document.getElementById('loginPinInput');
  const need = voidSettings.pin && voidSettings.pin.length;
  if(need && input.value !== voidSettings.pin){
    sfx('error');
    loginEl.classList.add('shake'); input.value='';
    setTimeout(()=>loginEl.classList.remove('shake'), 350);
    return;
  }
  loginEl.classList.add('hidden');
  setTimeout(()=>{ loginEl.style.display='none'; if(window.stopLoginBg) stopLoginBg(); }, 550);
}
document.getElementById('loginBtn').addEventListener('click', doLogin);
document.getElementById('loginPinInput').addEventListener('keydown', e=>{ if(e.key==='Enter') doLogin(); });
document.getElementById('loginPower').addEventListener('click', ()=>{
  if(!confirm('Shut down VoidOS?')) return;
  location.reload();
});

/* ============ POWER / SHUTDOWN ============ */
const shutdownEl = document.getElementById('shutdownScreen');
document.getElementById('btnPower').addEventListener('click', ()=>{
  if(!confirm('Shut down VoidOS?\n\nAnything saved to browser storage will still be there next boot.')) return;
  document.body.classList.add('powering-off');
  setTimeout(()=>{
    shutdownEl.style.display='flex';
  }, 480);
});
shutdownEl.addEventListener('click', ()=>{ location.reload(); });

/* ============ TOAST ============ */
function toast(msg, kind){
  const t=document.getElementById('toast');
  t.textContent=msg; t.className='toast show'+(kind?' '+kind:'');
  clearTimeout(t._h); t._h=setTimeout(()=>t.classList.remove('show'), 1800);
}
function cssVar(name){ return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#ffb000'; }

/* ============ PERSISTENCE ============
   Uses the browser's localStorage to remember state across reloads —
   theme, wallpaper (including anything you upload), settings, etc. If
   localStorage is unavailable (e.g. private/incognito mode blocking it, or
   storage quota exceeded), everything quietly falls back to session-only
   behavior instead of throwing. */
const hasVStore = () => { try{ return typeof localStorage !== 'undefined'; }catch(e){ return false; } };
async function vLoad(key, fallback){
  try{
    if(!hasVStore()) return fallback;
    const raw = localStorage.getItem(key);
    if(raw==null) return fallback;
    return JSON.parse(raw);
  }catch(e){ return fallback; }
}
function vSave(key, value){
  try{
    if(!hasVStore()) return;
    localStorage.setItem(key, JSON.stringify(value));
  }catch(e){ /* storage full/blocked — ignore, session-only fallback */ }
}
function debouncedSave(key, getValue, delayMs){
  let t=null;
  return function(){ clearTimeout(t); t=setTimeout(()=>vSave(key, getValue()), delayMs||400); };
}
let persistenceActive = false; // flips true once we've confirmed window.storage works

/* ============ CLOCK ============ */
function tickClock(){
  const d=new Date();
  document.getElementById('clock').textContent = d.toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'})+' · '+d.toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'});
}
tickClock(); setInterval(tickClock,1000*15);

/* ============ DESKTOP PET ============
   Reacts to the simulated CPU load in the System widget: past ~78% it gets
   the zoomies (faster, more frequent hops); otherwise it occasionally naps.
   Type (cat/dog/rabbit) is switchable live from Settings. */
let latestCpu = 30;
const petEmojis = { cat: '🐈\u200d⬛', dog: '🐕', rabbit: '🐰' };
let petType = 'cat';
function applyPetType(type){
  if(!petEmojis[type]) return;
  petType = type; voidSettings.petType = type;
  const pet = document.getElementById('pet');
  if(pet) pet.textContent = petEmojis[type];
}
(function(){
  const pet=document.getElementById('pet');
  let napping = false;
  function petBubble(msg){
    const b=document.createElement('div'); b.className='pet-bubble'; b.textContent=msg;
    const r = pet.getBoundingClientRect();
    b.style.left=(r.left+r.width/2-10)+'px'; b.style.top=(r.top-6)+'px';
    document.body.appendChild(b);
    setTimeout(()=>b.remove(), 1700);
  }
  function wander(){
    if(!voidSettings.pet){ setTimeout(wander, 1200); return; }
    const fast = latestCpu > 78;
    pet.classList.toggle('zoomies', fast);
    if(!fast && !napping && Math.random() < 0.16){
      napping = true; pet.textContent='😴'; pet.classList.add('sleeping');
      setTimeout(()=>{ napping=false; pet.textContent=petEmojis[petType]; pet.classList.remove('sleeping'); wander(); }, 4200+Math.random()*3200);
      return;
    }
    const margin = fast?60:100;
    const x = margin + Math.random()*Math.max(80,(window.innerWidth-margin*2-40));
    const y = 90 + Math.random()*Math.max(80,(window.innerHeight-margin*2-40));
    pet.style.left=x+'px'; pet.style.top=y+'px';
    setTimeout(wander, fast ? (380+Math.random()*380) : (3000+Math.random()*3000));
  }
  pet.style.top='300px'; pet.style.left='400px'; pet.textContent=petEmojis[petType];
  setTimeout(wander, 2000);
  pet.addEventListener('click', ()=>{
    if(napping){ napping=false; pet.textContent=petEmojis[petType]; pet.classList.remove('sleeping'); }
    pet.style.transform='scale(1.3) rotate(-8deg)';
    setTimeout(()=>pet.style.transform='', 200);
    petBubble(latestCpu>78 ? '💨' : '💕');
    if(latestCpu>78) unlockAchievement('zoomies');
    toast(latestCpu>78 ? 'zoomies!! (cpu load is high)' : ['mrow.','purr~','(◕ᴥ◕) hi.','not now, napping.'][Math.floor(Math.random()*4)]);
  });
})();

/* ============ WIDGETS ============ */
const widgetCol = document.getElementById('widgetCol');
widgetCol.innerHTML = `
  <div class="widget gadget" id="clockWidget" data-gadget="clock"><h4 class="gadget-handle">Local time</h4><div class="big" id="cwBig">--:--</div><div class="sub" id="cwSub"></div></div>
  <div class="widget gadget" id="sysWidget" data-gadget="sys"><h4 class="gadget-handle">System</h4>
    <div class="row"><span>CPU</span><span id="cpuVal">—</span></div><canvas id="cpuGraph" width="196" height="36"></canvas>
    <div class="row" style="margin-top:8px;"><span>MEM</span><span id="memVal">—</span></div><canvas id="memGraph" width="196" height="36"></canvas>
    <div class="row" style="margin-top:8px;"><span>uptime</span><span id="uptimeVal">0s</span></div>
  </div>
  <div class="widget gadget" id="quoteWidget" data-gadget="signal"><h4 class="gadget-handle">Signal</h4><p id="qwText">loading…</p><div class="by" id="qwBy"></div></div>
  <div class="widget gadget sticky-gadget" id="stickyWidget" data-gadget="sticky"><h4 class="gadget-handle">Sticky Note <span class="gadget-close" id="stickyClose" title="Remove">×</span></h4><textarea id="stickyText" placeholder="Jot something down…" spellcheck="false"></textarea></div>
`;
/* ---- Gadgets: every widget above can be dragged clean off the sidebar and
   dropped anywhere on the desktop (real "gadget" behavior, not a fixed
   panel) — grab the header. Position (and the sticky note's text) persist
   across reloads. */
const gadgetPositions = {};
const saveGadgetPositions = debouncedSave('voidos:gadgets', ()=>gadgetPositions);
function initGadgetDrag(el){
  const id = el.dataset.gadget;
  const handle = el.querySelector('.gadget-handle');
  if(!handle) return;
  let drag = null;
  handle.addEventListener('pointerdown', (e)=>{
    if(e.target.closest('.gadget-close')) return;
    if(el.style.position !== 'fixed'){
      const rect = el.getBoundingClientRect();
      el.style.position='fixed'; el.style.left=rect.left+'px'; el.style.top=rect.top+'px'; el.style.right='auto'; el.style.margin='0';
    }
    el.style.zIndex = 9;
    drag = {sx:e.clientX, sy:e.clientY, ox:el.offsetLeft, oy:el.offsetTop};
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  });
  function onMove(e){
    if(!drag) return;
    const x = Math.max(0, Math.min(window.innerWidth-40, drag.ox + (e.clientX-drag.sx)));
    const y = Math.max(40, Math.min(window.innerHeight-40, drag.oy + (e.clientY-drag.sy)));
    el.style.left = x+'px'; el.style.top = y+'px';
  }
  function onUp(){
    if(!drag) return;
    drag = null;
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    gadgetPositions[id] = {left:el.style.left, top:el.style.top};
    saveGadgetPositions();
  }
}
document.querySelectorAll('.gadget').forEach(initGadgetDrag);
const stickyTextEl = document.getElementById('stickyText');
const persistStickyText = debouncedSave('voidos:stickyText', ()=>stickyTextEl.value);
stickyTextEl.addEventListener('input', persistStickyText);
document.getElementById('stickyClose').addEventListener('click', ()=>{
  document.getElementById('stickyWidget').style.display='none';
  vSave('voidos:stickyHidden', true);
});
(async function restoreGadgets(){
  const savedPos = await vLoad('voidos:gadgets', null);
  if(savedPos){
    Object.assign(gadgetPositions, savedPos);
    Object.entries(savedPos).forEach(([id,pos])=>{
      const el = document.querySelector('.gadget[data-gadget="'+id+'"]');
      if(el && pos && pos.left && pos.top){
        el.style.position='fixed'; el.style.left=pos.left; el.style.top=pos.top; el.style.right='auto'; el.style.margin='0'; el.style.zIndex=9;
      }
    });
  }
  const stickyText = await vLoad('voidos:stickyText', '');
  if(stickyText) stickyTextEl.value = stickyText;
  const stickyHidden = await vLoad('voidos:stickyHidden', false);
  if(stickyHidden) document.getElementById('stickyWidget').style.display='none';
})();
function tickClockWidget(){
  const d=new Date();
  document.getElementById('cwBig').textContent = d.toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit',second:'2-digit'});
  document.getElementById('cwSub').textContent = d.toLocaleDateString(undefined,{weekday:'long',month:'short',day:'numeric'});
}
tickClockWidget(); setInterval(tickClockWidget,1000);

const signals = [
  ["The cleanest way to compress a folder is to stop hoarding files you'll never open again.","void://tips"],
  ["A well-labeled window title saves you from your own Alt+Tab chaos.","void://tips"],
  ["Every OS is just a very elaborate way to avoid organizing your Downloads folder.","void://humor"],
  ["Uptime is not an achievement. Backups are.","void://tips"],
  ["ctrl+k opens search from anywhere. use it.","void://tips"],
];
(function rotateQuote(){
  const s = signals[Math.floor(Math.random()*signals.length)];
  document.getElementById('qwText').textContent = s[0];
  document.getElementById('qwBy').textContent = s[1];
  setTimeout(rotateQuote, 9000);
})();

const cpuHist=[], memHist=[]; const bootTime=Date.now();
function drawGraph(canvas, hist, color){
  const ctx=canvas.getContext('2d'); const w=canvas.width,h=canvas.height;
  ctx.clearRect(0,0,w,h); ctx.beginPath();
  hist.forEach((v,i)=>{ const x=(i/(hist.length-1||1))*w; const y=h-(v/100)*h; i===0?ctx.moveTo(x,y):ctx.lineTo(x,y); });
  ctx.strokeStyle=color; ctx.lineWidth=1.5; ctx.stroke();
  ctx.lineTo(w,h); ctx.lineTo(0,h); ctx.closePath();
  ctx.globalAlpha=0.15; ctx.fillStyle=color; ctx.fill(); ctx.globalAlpha=1;
}
function sysTick(){
  const cpu = Math.max(4,Math.min(96,(cpuHist.length?cpuHist[cpuHist.length-1]:30)+(Math.random()*22-11)));
  const mem = Math.max(10,Math.min(90,(memHist.length?memHist[memHist.length-1]:40)+(Math.random()*8-4)));
  latestCpu = cpu;
  cpuHist.push(cpu); if(cpuHist.length>40) cpuHist.shift();
  memHist.push(mem); if(memHist.length>40) memHist.shift();
  document.getElementById('cpuVal').textContent = cpu.toFixed(0)+'%';
  document.getElementById('memVal').textContent = mem.toFixed(0)+'%';
  drawGraph(document.getElementById('cpuGraph'), cpuHist, cssVar('--accent'));
  drawGraph(document.getElementById('memGraph'), memHist, cssVar('--term-green'));
  const up = Math.floor((Date.now()-bootTime)/1000);
  const m=Math.floor(up/60), s=up%60;
  document.getElementById('uptimeVal').textContent = (m?m+'m ':'')+s+'s';
}
sysTick(); setInterval(sysTick, 1400);

/* ============ LIVE WALLPAPER (procedural, generated in-browser — Settings > Live wallpaper) ============
   No video/image files are downloaded or bundled; every non-video mode here is
   a classic demoscene-style effect rendered live on canvas, and the "video"
   modes just point an iframe at YouTube's own official embed player (muted,
   looped) — nothing is fetched or stored by VoidOS itself. */
const bgVideoIds = { yt1:'R8gGUhfsEo8', yt2:'XebI3THByOY' };
(function(){
  const canvas = document.getElementById('bgAnimCanvas');
  const videoWrap = document.getElementById('bgVideoWrap');
  const videoFrame = document.getElementById('bgVideoFrame');
  const ctx = canvas.getContext('2d');
  let mode = 'off', raf = null, stars = [], mcols = [], drops = [], t = 0;
  const CANVAS_MODES = ['starfield','matrix','plasma','aurora','rain','nebula','gridtunnel'];
  function size(){
    const dpr = Math.min(window.devicePixelRatio||1, 2);
    canvas.width = window.innerWidth*dpr; canvas.height = window.innerHeight*dpr;
    canvas.style.width = window.innerWidth+'px'; canvas.style.height = window.innerHeight+'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  window.addEventListener('resize', size); size();
  function cw(){ return window.innerWidth; } function ch(){ return window.innerHeight; }

  function initStars(){ stars = Array.from({length:180}, () => ({ x:(Math.random()-0.5)*cw(), y:(Math.random()-0.5)*ch(), z:Math.random()*cw() })); }
  function drawStars(){
    ctx.fillStyle='#000'; ctx.fillRect(0,0,cw(),ch());
    const cx=cw()/2, cy=ch()/2;
    ctx.fillStyle=cssVar('--accent');
    stars.forEach(s=>{
      s.z -= 4;
      if(s.z<=0){ s.x=(Math.random()-0.5)*cw(); s.y=(Math.random()-0.5)*ch(); s.z=cw(); }
      const k = 128/s.z;
      const px = s.x*k+cx, py = s.y*k+cy;
      if(px<0||px>cw()||py<0||py>ch()) return;
      const r = (1-s.z/cw())*2.4;
      ctx.globalAlpha = 1-s.z/cw();
      ctx.beginPath(); ctx.arc(px,py,Math.max(0.5,r),0,Math.PI*2); ctx.fill();
    });
    ctx.globalAlpha=1;
  }
  function initMatrix(){ mcols = new Array(Math.floor(cw()/16)).fill(0); }
  function drawMatrix(){
    ctx.fillStyle='rgba(0,0,0,0.10)'; ctx.fillRect(0,0,cw(),ch());
    ctx.fillStyle='#1f7a3d'; ctx.font='14px monospace';
    mcols.forEach((y,i)=>{
      const ch2 = String.fromCharCode(0x30A0+Math.random()*96);
      ctx.fillText(ch2, i*16, y);
      mcols[i] = (y>ch() && Math.random()>0.975) ? 0 : y+16;
    });
  }
  function drawPlasma(){
    t += 0.018;
    const w=cw(), h=ch(), step=10;
    for(let y=0;y<h;y+=step){
      for(let x=0;x<w;x+=step){
        const v = Math.sin(x*0.012+t) + Math.sin(y*0.014+t*1.3) + Math.sin((x+y)*0.009+t*0.8) + Math.sin(Math.sqrt(x*x+y*y)*0.012+t);
        const hue = ((v+4)/8*360 + t*20) % 360;
        ctx.fillStyle = `hsl(${hue},70%,${8+((v+4)/8)*10}%)`;
        ctx.fillRect(x,y,step,step);
      }
    }
  }
  function drawAurora(){
    t += 0.006;
    ctx.fillStyle='#03050a'; ctx.fillRect(0,0,cw(),ch());
    const w=cw(), h=ch();
    for(let band=0; band<4; band++){
      ctx.beginPath();
      const baseY = h*(0.2+band*0.18);
      ctx.moveTo(0, baseY);
      for(let x=0; x<=w; x+=24){
        const y = baseY + Math.sin(x*0.006 + t*1.4 + band*1.7)*40 + Math.sin(x*0.002 - t + band)*30;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath();
      const hue = (140 + band*40 + t*10) % 360;
      const g = ctx.createLinearGradient(0, baseY-60, 0, h);
      g.addColorStop(0, `hsla(${hue},80%,55%,0.16)`); g.addColorStop(1, 'hsla(0,0%,0%,0)');
      ctx.fillStyle = g; ctx.fill();
    }
  }
  function drawRain(){
    if(!drops.length) drops = Array.from({length:140}, ()=>({ x:Math.random()*cw(), y:Math.random()*ch(), len:14+Math.random()*22, spd:9+Math.random()*9 }));
    ctx.fillStyle='rgba(3,5,8,0.28)'; ctx.fillRect(0,0,cw(),ch());
    ctx.strokeStyle = cssVar('--accent'); ctx.lineWidth=1; ctx.globalAlpha=0.4;
    drops.forEach(d=>{
      ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.x, d.y+d.len); ctx.stroke();
      d.y += d.spd; if(d.y>ch()){ d.y=-d.len; d.x=Math.random()*cw(); }
    });
    ctx.globalAlpha=1;
  }
  function drawNebula(){
    t += 0.004;
    ctx.fillStyle='rgba(3,3,8,0.06)'; ctx.fillRect(0,0,cw(),ch());
    for(let i=0;i<3;i++){
      const x = cw()*(0.3+0.4*Math.sin(t*0.5+i*2)), y = ch()*(0.3+0.4*Math.cos(t*0.4+i*1.5));
      const r = Math.min(cw(),ch())*0.35;
      const hue = (i*110 + t*12) % 360;
      const g = ctx.createRadialGradient(x,y,0,x,y,r);
      g.addColorStop(0, `hsla(${hue},70%,45%,0.10)`); g.addColorStop(1, 'hsla(0,0%,0%,0)');
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
    }
  }
  function drawGridTunnel(){
    t += 0.02;
    ctx.fillStyle='#000'; ctx.fillRect(0,0,cw(),ch());
    const cx=cw()/2, cy=ch()/2, lines=14;
    ctx.strokeStyle=cssVar('--accent'); ctx.globalAlpha=0.5;
    for(let i=1;i<=lines;i++){
      const p = ((i/lines) + (t%1)) % 1;
      const s = p*p;
      const w = cw()*s, h = ch()*s;
      ctx.globalAlpha = 0.55*(1-p);
      ctx.strokeRect(cx-w/2, cy-h/2, w, h);
    }
    ctx.globalAlpha=1;
  }
  function frame(){
    if(mode==='starfield') drawStars();
    else if(mode==='matrix') drawMatrix();
    else if(mode==='plasma') drawPlasma();
    else if(mode==='aurora') drawAurora();
    else if(mode==='rain') drawRain();
    else if(mode==='nebula') drawNebula();
    else if(mode==='gridtunnel') drawGridTunnel();
    raf = requestAnimationFrame(frame);
  }
  let videoFallbackTimer = null;
  function setVideo(id, modeTag){
    clearTimeout(videoFallbackTimer);
    let loaded = false;
    videoFrame.onload = () => { loaded = true; };
    if(videoFrame.dataset.id !== id){ videoFrame.src=''; videoFrame.dataset.id = id; }
    videoWrap.classList.add('on');
    // Give the embed a moment to actually load; if it never fires (blocked by
    // a sandboxed preview, no network, etc.) fall back to a working animated
    // wallpaper instead of leaving a blank rectangle.
    videoFallbackTimer = setTimeout(()=>{
      if(!loaded && mode===modeTag){
        toast('Background video unavailable here — using Starfield instead.');
        window.setLiveWallpaper('starfield');
      }
    }, 3500);
    const src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&showinfo=0&modestbranding=1&rel=0&iv_load_policy=3&disablekb=1&playsinline=1`;
    videoFrame.src = src;
  }
  window.setLiveWallpaper = function(newMode){
    mode = newMode || 'off';
    cancelAnimationFrame(raf);
    clearTimeout(videoFallbackTimer);
    drops = [];
    ctx.clearRect(0,0,cw(),ch());
    canvas.style.display = CANVAS_MODES.includes(mode) ? 'block' : 'none';
    videoWrap.classList.remove('on');
    if(mode==='video1') { setVideo(bgVideoIds.yt1, 'video1'); return; }
    if(mode==='video2') { setVideo(bgVideoIds.yt2, 'video2'); return; }
    videoFrame.src=''; delete videoFrame.dataset.id;
    if(mode==='off') return;
    size();
    if(mode==='starfield') initStars();
    if(mode==='matrix') initMatrix();
    raf = requestAnimationFrame(frame);
  };
  canvas.style.display='none';
})();

/* ============ EASTER EGGS & AMBIENT EFFECTS ============ */

/* -- Matrix rain (terminal `matrix` command) -- */
(function(){
  const overlay = document.getElementById('matrixOverlay');
  const canvas = document.getElementById('matrixCanvas');
  const ctx = canvas.getContext('2d');
  let cols=[], raf=null, hideTimer=null;
  function size(){ canvas.width=window.innerWidth; canvas.height=window.innerHeight; cols = new Array(Math.floor(canvas.width/16)).fill(0); }
  function frame(){
    ctx.fillStyle='rgba(0,0,0,0.08)'; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle='#33ff66'; ctx.font='14px monospace';
    cols.forEach((y,i)=>{
      const ch = String.fromCharCode(0x30A0+Math.random()*96);
      ctx.fillText(ch, i*16, y);
      cols[i] = (y>canvas.height && Math.random()>0.975) ? 0 : y+16;
    });
    raf = requestAnimationFrame(frame);
  }
  window.startMatrixRain = function(){
    size(); overlay.style.display='flex'; ctx.fillStyle='#000'; ctx.fillRect(0,0,canvas.width,canvas.height);
    cancelAnimationFrame(raf); raf=requestAnimationFrame(frame);
    clearTimeout(hideTimer); hideTimer=setTimeout(stopMatrixRain, 9000);
  };
  window.stopMatrixRain = function(){ overlay.style.display='none'; cancelAnimationFrame(raf); clearTimeout(hideTimer); };
  overlay.addEventListener('click', stopMatrixRain);
  window.addEventListener('resize', ()=>{ if(overlay.style.display==='flex') size(); });
})();

/* -- Confetti burst (Konami code) -- */
(function(){
  const canvas = document.getElementById('confettiCanvas');
  const ctx = canvas.getContext('2d');
  const colors = ['#ffb000','#33ff66','#33ccff','#ff2e88','#a259ff','#ffe066'];
  let parts=[], raf=null;
  function size(){ canvas.width=window.innerWidth; canvas.height=window.innerHeight; }
  window.addEventListener('resize', size); size();
  function frame(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    parts.forEach(p=>{
      p.x+=p.vx; p.y+=p.vy; p.vy+=0.12; p.rot+=p.vr; p.life-=1;
      ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot);
      ctx.fillStyle=p.color; ctx.globalAlpha=Math.max(0,p.life/90);
      ctx.fillRect(-3,-5,6,10); ctx.restore();
    });
    parts = parts.filter(p=>p.life>0 && p.y<canvas.height+40);
    if(parts.length){ raf=requestAnimationFrame(frame); } else { canvas.style.display='none'; }
  }
  window.burstConfetti = function(){
    canvas.style.display='block';
    for(let i=0;i<140;i++){
      parts.push({x:canvas.width/2+(Math.random()-0.5)*200, y:canvas.height*0.35+(Math.random()-0.5)*80,
        vx:(Math.random()-0.5)*9, vy:-Math.random()*7-2, vr:(Math.random()-0.5)*0.3, rot:Math.random()*6.28,
        life:80+Math.random()*40, color:colors[Math.floor(Math.random()*colors.length)]});
    }
    cancelAnimationFrame(raf); raf=requestAnimationFrame(frame);
  };
})();

/* -- Konami code -- */
(function(){
  const seq = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  let buf = [];
  window.addEventListener('keydown', (e)=>{
    buf.push(e.key.length===1?e.key.toLowerCase():e.key); buf = buf.slice(-seq.length);
    if(buf.length===seq.length && buf.every((k,i)=>k===seq[i])){
      burstConfetti(); toast('achievement unlocked: you remember the 90s'); unlockAchievement('konami');
      buf=[];
    }
    if(e.key==='Escape' && document.getElementById('matrixOverlay').style.display==='flex') stopMatrixRain();
  });
})();

/* -- Rainbow logo (click the VoidOS brand 10x) -- */
(function(){
  const brand = document.querySelector('#topbar .brand');
  if(!brand) return;
  let clicks=0, resetTimer=null;
  brand.style.cursor='default';
  brand.addEventListener('click', ()=>{
    clicks++; clearTimeout(resetTimer); resetTimer=setTimeout(()=>clicks=0, 3500);
    if(clicks>=10){ document.body.classList.toggle('rainbow-mode'); clicks=0; toast(document.body.classList.contains('rainbow-mode')?'rainbow mode!':'back to normal'); if(document.body.classList.contains('rainbow-mode')) unlockAchievement('rainbow'); }
  });
})();

/* -- Cursor trail (Settings > Cursor trail) -- */
(function(){
  const canvas = document.getElementById('trailCanvas'); const ctx = canvas.getContext('2d');
  let pts=[];
  function size(){ canvas.width=window.innerWidth; canvas.height=window.innerHeight; }
  window.addEventListener('resize', size); size();
  window.addEventListener('mousemove', (e)=>{ if(document.body.classList.contains('trail-on')) pts.push({x:e.clientX,y:e.clientY,life:1}); });
  function frame(){
    if(document.body.classList.contains('trail-on')){
      ctx.clearRect(0,0,canvas.width,canvas.height);
      pts.forEach(p=>{ p.life-=0.045; });
      pts = pts.filter(p=>p.life>0).slice(-40);
      pts.forEach((p,i)=>{
        ctx.beginPath(); ctx.arc(p.x,p.y, 5*p.life, 0, Math.PI*2);
        ctx.fillStyle = `hsla(${(174+i*4)%360},80%,70%,${p.life*0.5})`; ctx.fill();
      });
    } else if(pts.length){ ctx.clearRect(0,0,canvas.width,canvas.height); pts=[]; }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();

/* ============ VIRTUAL FILESYSTEM (node-based, nested) ============ */
let fsSeq=0;
function nid(){ return 'n'+(++fsSeq); }
const FS = {}; // id -> node {id,name,type:'folder'|'file'|'image',parentId,content,seed,mime}
function addNode(name,type,parentId,extra={}){
  const id = extra.id || nid();
  FS[id] = Object.assign({id,name,type,parentId,content:'',children: type==='folder'?[]:undefined}, extra);
  if(parentId && FS[parentId]) FS[parentId].children.push(id);
  return id;
}
const ROOT = addNode('root','folder',null,{id:'root'});
const HOME = addNode('Home','folder',ROOT,{id:'home'});
const DOCS = addNode('Documents','folder',HOME,{id:'documents'});
const PROJ = addNode('Projects','folder',DOCS,{id:'projects'});
addNode('idea.txt','file',PROJ,{content:"Idea: build a distro-hopping tracker that logs every distro I try and why I ragequit.\n[done — see Distro Tracker in the Store]\n\nAlso: a dotfiles sync tool.\n[done — see Dotfiles Sync in the Store]\n\nNext: something that actually needs a real backend? we'll see.\n"});
addNode('todo.txt','file',PROJ,{content:"- finish window snapping [done — drag a window to a screen edge]\n- add drag-and-drop between folders [done — drag entries onto folders/sidebar in Files]\n- theme: CRT scanline mode? [done — Settings > CRT scanlines]\n- sessions actually persisting between reloads [done — see Settings > Forget saved data]\n- v3 idea: multi-workspace desktops?\n- v3 idea: real sync between devices, not just this browser\n"});
addNode('resume.txt','file',DOCS,{content:"Name: guest\nRole: tinkerer\nSkills: linux, bash, breaking things then fixing them\n"});
addNode('notes-old.txt','file',DOCS,{content:"(old scratch notes — see the Notes app for the good stuff)\n"});
const PICS = addNode('Pictures','folder',HOME,{id:'pictures'});
const artSeeds = [
  {name:'sunset-drift.png', seed:11, hue:18},
  {name:'neon-alley.png', seed:47, hue:280},
  {name:'cyan-static.png', seed:83, hue:174},
  {name:'ember-field.png', seed:29, hue:12},
  {name:'violet-noise.png', seed:65, hue:260},
  {name:'deep-signal.png', seed:97, hue:200},
];
artSeeds.forEach(a=>addNode(a.name,'image',PICS,{seed:a.seed, hue:a.hue}));
const MUSICF = addNode('Music','folder',HOME,{id:'musicfolder'});
addNode('playlist.txt','file',MUSICF,{content:"Open the Music Player app from the dock for the actual playlist — this is just a mirror listing.\n"});
const DOWN = addNode('Downloads','folder',HOME,{id:'downloads'});
addNode('void-theme-pack.zip','file',DOWN,{content:"(placeholder — pretend this is a theme pack)\n"});
addNode('install_log.txt','file',DOWN,{content:"[ok] extracted 12 files\n[ok] no conflicts found\n"});
const DESK = addNode('Desktop','folder',HOME,{id:'desktopfolder'});
addNode('welcome.txt','file',DESK,{content:"This Desktop folder is just for show — desktop icons on the actual desktop are app shortcuts, managed separately.\n"});
const APPSDIR = addNode('Applications','folder',HOME,{id:'applications'});
const SYS = addNode('System','folder',HOME,{id:'system'});
const SYSBIN = addNode('bin','folder',SYS,{id:'sysbin'});
addNode('ls','file',SYSBIN,{content:"(binary stub — the terminal implements this natively)\n"});
addNode('cat','file',SYSBIN,{content:"(binary stub)\n"});
const SYSVAR = addNode('var','folder',SYS,{id:'sysvar'});
const SYSLOG = addNode('log','folder',SYSVAR,{id:'syslog'});
addNode('kernel.log','file',SYSLOG,{content:"[boot] void-kernel 2.0 online\n[ok] window manager attached\n[ok] snap-zone engine attached\n[ok] fs mounted at /home\n[ok] persistence layer: "+(hasVStore()?'browser storage detected':'session-only, no storage backend found')+"\n[ok] audio subsystem ready\n[ok] crt compositor standing by\n[ok] desktop pet spawned\n"});
const SYSETC = addNode('etc','folder',SYS,{id:'sysetc'});
addNode('hosts','file',SYSETC,{content:"127.0.0.1   localhost\n::1         localhost\n"});
addNode('motd','file',SYSETC,{content:"Message of the day: ctrl+k opens spotlight search from anywhere. Drag a window to a screen edge to snap it.\n"});
addNode('version','file',SYS,{content:"VoidOS 2.7 \"Phosphor\"\nKernel: void-kernel 2.0\nWM: floating, compositing, edge-snap\nPersistence: browser storage (falls back to session-only)\n"});
const TRASH = addNode('Trash','folder',HOME,{id:'trash'});

function fsPath(id){
  const parts=[]; let cur=FS[id];
  while(cur && cur.id!=='root'){ parts.unshift(cur.name); cur = FS[cur.parentId]; }
  return '/'+parts.join('/');
}
function fsChildren(id){ const n=FS[id]; return n && n.children ? n.children.map(cid=>FS[cid]).filter(Boolean) : []; }
function fsFindChildByName(parentId, name){ return fsChildren(parentId).find(c=>c.name===name); }
function fsResolve(cwdId, pathStr){
  if(!pathStr) return cwdId;
  let cur = pathStr.startsWith('/') ? HOME : cwdId;
  if(pathStr==='/'||pathStr==='~') return HOME;
  const segs = pathStr.replace(/^\//,'').split('/').filter(Boolean);
  for(const seg of segs){
    if(seg==='.') continue;
    if(seg==='..'){ cur = FS[cur] ? (FS[cur].parentId||cur) : cur; continue; }
    const child = fsFindChildByName(cur, seg);
    if(!child) return null;
    cur = child.id;
  }
  return cur;
}
function fsRemoveFromParent(id){
  const n=FS[id]; if(!n) return; const p=FS[n.parentId];
  if(p) p.children = p.children.filter(c=>c!==id);
}
function fsMoveToTrash(id){
  if(id===TRASH||id===HOME||id===ROOT) return false;
  const n=FS[id]; const from = n.parentId;
  fsRemoveFromParent(id);
  n.parentId = TRASH; n._trashedFrom = from; FS[TRASH].children.push(id);
  return true;
}
function fsRestoreFromTrash(id){
  const n=FS[id]; if(!n) return false;
  let dest = n._trashedFrom && FS[n._trashedFrom] ? n._trashedFrom : HOME;
  fsRemoveFromParent(id);
  n.parentId = dest; delete n._trashedFrom;
  FS[dest].children.push(id);
  return true;
}
function fsDeletePermanent(id){
  const n=FS[id]; if(!n) return;
  (n.children||[]).slice().forEach(fsDeletePermanent);
  fsRemoveFromParent(id);
  delete FS[id];
}
function fsMoveToFolder(id, destId){
  if(id===destId || id===ROOT || id===HOME) return false;
  const dest = FS[destId]; if(!dest || dest.type!=='folder') return false;
  // guard against moving a folder into its own descendant
  let cur = destId;
  while(cur){ if(cur===id) return false; cur = FS[cur] ? FS[cur].parentId : null; }
  if(FS[id].parentId===destId) return false;
  fsRemoveFromParent(id);
  FS[id].parentId = destId; dest.children.push(id);
  return true;
}
function fsRename(id, newName){
  const n=FS[id]; if(!n || !newName || !newName.trim()) return false;
  n.name = newName.trim();
  return true;
}
function refreshApplicationsFolder(){
  FS[APPSDIR].children = [];
  Object.entries(APPS).filter(([k,d])=>d.desktopIcon!==false || d.installedShortcut).forEach(([id,d])=>{
    addNode(d.title+'.app','file',APPSDIR,{content:'(shortcut — double-click Files entries to launch apps; use the dock instead for a real launch)', appLink:id});
  });
}

/* ---- FS persistence: whole-tree snapshot, debounced ---- */
let fsPersistTimer=null;
function persistFS(){
  clearTimeout(fsPersistTimer);
  fsPersistTimer = setTimeout(()=>{ vSave('voidos:fs', {seq:fsSeq, nodes:FS}); }, 400);
}
function restoreFSFromSnapshot(snap){
  if(!snap || !snap.nodes || !snap.nodes.root) return false;
  Object.keys(FS).forEach(k=>delete FS[k]);
  Object.assign(FS, snap.nodes);
  fsSeq = Math.max(snap.seq||0, ...Object.keys(FS).map(k=>{ const m=/^n(\d+)$/.exec(k); return m?parseInt(m[1],10):0; }), 0);
  return true;
}

/* ============ WINDOW MANAGER ============ */
let zTop = 10;
const openWins = new Map();
const winsRoot = document.getElementById('windows');
const dockRoot = document.getElementById('dock');
const activeLabel = document.getElementById('activeAppLabel');
let winCounter = 0;
const WORKSPACE_COUNT = 5;
let currentWorkspace = 1;

function applyWorkspaceVisibility(direction){
  if(!voidSettings.hyprMode) return;
  const outCls = direction==='left' ? 'ws-out-left' : 'ws-out-right';
  const inCls = direction==='left' ? 'ws-in-right' : 'ws-in-left';
  openWins.forEach((w)=>{
    if(w.minimized) return;
    const belongs = w.el.dataset.workspace===String(currentWorkspace);
    if(belongs){
      if(w.el.style.display==='none'){
        w.el.style.display='';
        if(direction){ w.el.classList.add(inCls); w.el.addEventListener('animationend', ()=>w.el.classList.remove(inCls), {once:true}); setTimeout(()=>w.el.classList.remove(inCls), 260); }
      }
    } else if(w.el.style.display!=='none'){
      if(direction){
        w.el.classList.add(outCls);
        setTimeout(()=>{ w.el.style.display='none'; w.el.classList.remove(outCls); }, 190);
      } else {
        w.el.style.display='none';
      }
    }
  });
  renderHyprBar();
}
function switchWorkspace(n){
  n = Math.max(1, Math.min(WORKSPACE_COUNT, n));
  if(n===currentWorkspace) return;
  const direction = n>currentWorkspace ? 'right' : 'left';
  currentWorkspace = n;
  applyWorkspaceVisibility(direction);
  const onThisWs = [...openWins.values()].filter(w=>!w.minimized && w.el.dataset.workspace===String(currentWorkspace));
  if(onThisWs.length){
    const topId = [...openWins.entries()].filter(([id,w])=>onThisWs.includes(w)).sort((a,b)=>+a[1].el.style.zIndex-+b[1].el.style.zIndex).pop();
    if(topId) focusWin(topId[0]);
  } else {
    activeLabel.textContent = 'Desktop';
  }
}
function renderHyprBar(){
  const bar = document.getElementById('hyprBar');
  if(!bar) return;
  if(!voidSettings.hyprMode){ bar.innerHTML=''; return; }
  const used = new Set([...openWins.values()].filter(w=>!w.minimized).map(w=>w.el.dataset.workspace));
  let html = '';
  for(let i=1;i<=WORKSPACE_COUNT;i++){
    html += `<div class="ws${i===currentWorkspace?' active':''}${used.has(String(i))?' has-win':''}" data-ws="${i}">${i}</div>`;
  }
  html += `<div class="tile-btn" id="hyprTileBtn" title="Tile windows on this workspace (Ctrl+Alt+T)">tile</div>`;
  bar.innerHTML = html;
  bar.querySelectorAll('.ws').forEach(el=>el.addEventListener('click', ()=>switchWorkspace(+el.dataset.ws)));
  const tb = bar.querySelector('#hyprTileBtn');
  if(tb) tb.addEventListener('click', tileWindows);
}
function tileWindows(){
  if(!voidSettings.hyprMode) return;
  const wins = [...openWins.entries()].filter(([id,w])=>!w.minimized && w.el.dataset.workspace===String(currentWorkspace));
  if(!wins.length) return;
  const gap = 10, top = 40, bottom = voidSettings.hyprMode?70:14, left = 8, right = 8;
  const areaW = window.innerWidth-left-right, areaH = window.innerHeight-top-bottom;
  wins.forEach(([id,w])=>w.el.classList.add('no-anim'));
  if(wins.length===1){
    const [id,w] = wins[0];
    Object.assign(w.el.style, {left:left+'px', top:top+'px', width:areaW+'px', height:areaH+'px'});
  } else {
    const [masterId, masterW] = wins[0];
    const masterWidth = Math.floor(areaW*0.58);
    Object.assign(masterW.el.style, {left:left+'px', top:top+'px', width:masterWidth+'px', height:areaH+'px'});
    const stack = wins.slice(1);
    const stackW = areaW-masterWidth-gap;
    const stackH = Math.floor((areaH-gap*(stack.length-1))/stack.length);
    stack.forEach(([id,w],i)=>{
      Object.assign(w.el.style, {
        left:(left+masterWidth+gap)+'px',
        top:(top+i*(stackH+gap))+'px',
        width:stackW+'px', height:stackH+'px',
      });
    });
  }
  setTimeout(()=>{
    wins.forEach(([id,w])=>{
      w.el.classList.remove('no-anim');
      const ctl = w.ctl;
      if(ctl && ctl.onResize) ctl.onResize();
    });
  }, 20);
  toast('Tiled '+wins.length+' window'+(wins.length>1?'s':'')+' on workspace '+currentWorkspace);
}
window.addEventListener('keydown', (e)=>{
  if(e.ctrlKey && e.altKey && e.key>='1' && e.key<=String(WORKSPACE_COUNT)){ e.preventDefault(); switchWorkspace(+e.key); }
  if(e.ctrlKey && e.altKey && (e.key==='t'||e.key==='T')){ e.preventDefault(); tileWindows(); }
});

function focusWin(id){
  const w = openWins.get(id); if(!w) return;
  zTop++; w.el.style.zIndex = zTop;
  document.querySelectorAll('.win').forEach(el=>el.classList.remove('focused'));
  w.el.classList.add('focused');
  activeLabel.textContent = w.title;
  document.querySelectorAll('.dock-item').forEach(d=>d.classList.remove('running'));
  document.querySelectorAll('.dock-item[data-app="'+w.appId+'"]').forEach(d=>d.classList.add('running'));
}
let sessionAppIds = new Set();
const persistSession = debouncedSave('voidos:session', ()=>[...sessionAppIds]);
function closeWin(id){
  const w = openWins.get(id); if(!w) return;
  sfx('close');
  if(w.onClose) try{w.onClose();}catch(e){}
  openWins.delete(id);
  const stillOpen = [...openWins.values()].some(x=>x.appId===w.appId);
  if(!stillOpen){
    document.querySelectorAll('.dock-item[data-app="'+w.appId+'"]').forEach(d=>d.classList.remove('running'));
    sessionAppIds.delete(w.appId); persistSession();
  }
  const rest=[...openWins.values()];
  activeLabel.textContent = rest.length ? rest[rest.length-1].title : 'Desktop';
  renderHyprBar();
  w.el.classList.add('win-closing');
  setTimeout(()=>w.el.remove(), 130);
}
function openWindow(appId, title, glyph, contentBuilder, opts={}){
  sfx('open');
  winCounter++;
  const id = 'w'+winCounter;
  const el = document.createElement('div');
  el.className='win focused win-opening';
  el.addEventListener('animationend', ()=>el.classList.remove('win-opening'), {once:true});
  setTimeout(()=>el.classList.remove('win-opening'), 220); // safety net in case animationend never fires
  el.dataset.workspace = String(currentWorkspace);
  sessionAppIds.add(appId); persistSession();
  const w = opts.w||620, h=opts.h||440;
  const left = opts.x!=null?opts.x: (70+ (winCounter%6)*32);
  const top = opts.y!=null?opts.y: (60+ (winCounter%6)*28);
  el.style.width=w+'px'; el.style.height=h+'px'; el.style.left=left+'px'; el.style.top=top+'px';
  if(opts.origin){
    // Genie-style open: window bursts in from the dock icon/desktop icon
    // that was clicked instead of always popping in at its own center.
    const cx = left + w/2, cy = top + h/2;
    el.style.setProperty('--ox', (opts.origin.x - cx) + 'px');
    el.style.setProperty('--oy', (opts.origin.y - cy) + 'px');
    el.style.setProperty('--os', '.45');
  }
  zTop++; el.style.zIndex=zTop;
  el.innerHTML = `
    <div class="titlebar">
      <button class="dot close" title="Close"></button>
      <button class="dot min" title="Minimize"></button>
      <button class="dot max" title="Maximize"></button>
      <div class="ttitle">${glyph||''} ${title}</div>
    </div>
    <div class="wbody"></div>
    <div class="resize-handle rh-n" data-dir="n"></div>
    <div class="resize-handle rh-s" data-dir="s"></div>
    <div class="resize-handle rh-e" data-dir="e"></div>
    <div class="resize-handle rh-w" data-dir="w"></div>
    <div class="resize-handle rh-ne" data-dir="ne"></div>
    <div class="resize-handle rh-nw" data-dir="nw"></div>
    <div class="resize-handle rh-se" data-dir="se"></div>
    <div class="resize-handle rh-sw" data-dir="sw"></div>
  `;
  winsRoot.appendChild(el);
  const body = el.querySelector('.wbody');
  const ctl = contentBuilder(body, id) || {};

  openWins.set(id, {el, appId, title, onClose: ctl.onClose, ctl, minimized:false});
  focusWin(id); refreshDock(); renderHyprBar(); applyWorkspaceVisibility();

  const titlebar = el.querySelector('.titlebar');
  let drag=null, pendingSnap=null;
  const snapGhost = document.getElementById('snapGhost');
  function snapZoneFor(cx, cy){
    const W=window.innerWidth, H=window.innerHeight, edge=26;
    if(cy<=6) return {left:4, top:36, width:W-8, height:H-50, kind:'max'};
    if(cx<=edge) return {left:4, top:36, width:(W-12)/2, height:H-50, kind:'left'};
    if(cx>=W-edge) return {left:(W-12)/2+8, top:36, width:(W-12)/2, height:H-50, kind:'right'};
    return null;
  }
  // Pointer Events (not mouse-only) so dragging/resizing works with touch and
  // pen input too, not just a mouse — one code path covers all input types.
  titlebar.addEventListener('pointerdown', (e)=>{
    if(e.target.closest('.dot')) return;
    focusWin(id);
    drag = {sx:e.clientX, sy:e.clientY, ox:el.offsetLeft, oy:el.offsetTop};
    document.body.style.userSelect='none';
    el.classList.add('no-anim'); // avoid racing the .22s left/top transition against every pointermove
    window.addEventListener('pointermove', onDragMove);
    window.addEventListener('pointerup', onDragUp);
  });
  let dragRaf=null, dragEvt=null;
  function onDragMove(e){
    if(!drag) return;
    dragEvt = e;
    if(dragRaf) return;
    dragRaf = requestAnimationFrame(applyDrag);
  }
  function applyDrag(){
    dragRaf = null;
    const e = dragEvt;
    if(!drag || !e) return;
    el.style.left = Math.max(0, drag.ox + (e.clientX-drag.sx)) + 'px';
    el.style.top = Math.max(30, drag.oy + (e.clientY-drag.sy)) + 'px';
    if(voidSettings.hyprMode){
      const wsEl = document.elementFromPoint(e.clientX, e.clientY);
      const pill = wsEl && wsEl.closest && wsEl.closest('#hyprBar .ws');
      document.querySelectorAll('#hyprBar .ws').forEach(p=>p.classList.toggle('drop-target', p===pill));
      if(pill){ snapGhost.style.display='none'; return; }
    }
    pendingSnap = snapZoneFor(e.clientX, e.clientY);
    if(pendingSnap){
      snapGhost.style.display='block';
      snapGhost.style.left=pendingSnap.left+'px'; snapGhost.style.top=pendingSnap.top+'px';
      snapGhost.style.width=pendingSnap.width+'px'; snapGhost.style.height=pendingSnap.height+'px';
    } else snapGhost.style.display='none';
  }
  function onDragUp(e){
    if(dragRaf){ cancelAnimationFrame(dragRaf); dragRaf=null; }
    window.removeEventListener('pointermove', onDragMove);
    window.removeEventListener('pointerup', onDragUp);
    el.classList.remove('no-anim');
    if(drag && voidSettings.hyprMode){
      const dropEl = document.elementFromPoint(e.clientX, e.clientY);
      const pill = dropEl && dropEl.closest && dropEl.closest('#hyprBar .ws');
      document.querySelectorAll('#hyprBar .ws').forEach(p=>p.classList.remove('drop-target'));
      if(pill){
        const targetWs = pill.dataset.ws;
        el.dataset.workspace = targetWs;
        toast('Moved to workspace '+targetWs);
        applyWorkspaceVisibility();
        drag=null; pendingSnap=null; snapGhost.style.display='none'; document.body.style.userSelect='';
        return;
      }
    }
    if(drag && pendingSnap){
      if(pendingSnap.kind==='max'){ prevRect={left:el.style.left, top:el.style.top, width:el.style.width, height:el.style.height}; maxed=true; }
      el.style.left=pendingSnap.left+'px'; el.style.top=pendingSnap.top+'px';
      el.style.width=pendingSnap.width+'px'; el.style.height=pendingSnap.height+'px';
      if(ctl.onResize) setTimeout(ctl.onResize, 0);
      unlockAchievement('snap');
    }
    drag=null; pendingSnap=null; snapGhost.style.display='none'; document.body.style.userSelect='';
  }

  // All 8 edges/corners, not just the SE corner — res.dir records which one
  // is active so applyResize() knows whether left/top need to shift too
  // (resizing from the north or west edges moves the window's origin, not
  // just its size).
  let res=null;
  el.querySelectorAll('.resize-handle').forEach(rh=>{
    rh.addEventListener('pointerdown', (e)=>{
      e.stopPropagation(); e.preventDefault(); // preventDefault stops touch from also scrolling the desktop while resizing
      res={dir:rh.dataset.dir, sx:e.clientX, sy:e.clientY, ow:el.offsetWidth, oh:el.offsetHeight, ox:el.offsetLeft, oy:el.offsetTop};
      el.classList.add('no-anim'); // avoid racing the .22s width/height transition against every pointermove
      window.addEventListener('pointermove', onResizeMove);
      window.addEventListener('pointerup', onResizeUp);
    });
  });
  let resizeRaf=null, resizeEvt=null;
  function onResizeMove(e){
    if(!res) return;
    resizeEvt = e;
    if(resizeRaf) return;
    resizeRaf = requestAnimationFrame(applyResize);
  }
  function applyResize(){
    resizeRaf = null;
    const e = resizeEvt;
    if(!res || !e) return;
    const dx = e.clientX-res.sx, dy = e.clientY-res.sy, dir = res.dir;
    let w = res.ow, h = res.oh;
    if(dir.includes('e')) w = Math.max(300, res.ow + dx);
    if(dir.includes('w')) w = Math.max(300, res.ow - dx);
    if(dir.includes('s')) h = Math.max(200, res.oh + dy);
    if(dir.includes('n')) h = Math.max(200, res.oh - dy);
    el.style.width = w+'px'; el.style.height = h+'px';
    if(dir.includes('w')) el.style.left = (res.ox + (res.ow - w))+'px';
    if(dir.includes('n')) el.style.top = Math.max(30, res.oy + (res.oh - h))+'px';
    if(ctl.onResize) ctl.onResize();
  }
  function onResizeUp(){
    if(resizeRaf){ cancelAnimationFrame(resizeRaf); resizeRaf=null; }
    res=null;
    el.classList.remove('no-anim');
    window.removeEventListener('pointermove', onResizeMove);
    window.removeEventListener('pointerup', onResizeUp);
  }

  el.addEventListener('pointerdown', ()=>focusWin(id));
  el.querySelector('.dot.close').addEventListener('click', ()=>closeWin(id));
  el.querySelector('.dot.min').addEventListener('click', ()=>{
    const wEntry = openWins.get(id); if(wEntry) wEntry.minimized = true;
    el.classList.add('win-minimizing');
    setTimeout(()=>{
      el.style.display='none'; el.classList.remove('win-minimizing');
      const remaining = [...openWins.keys()].filter(k=>openWins.get(k).el.style.display!=='none');
      if(remaining.length) focusWin(remaining[remaining.length-1]);
      renderHyprBar();
    }, 210);
  });
  let maxed=false, prevRect=null;
  el.querySelector('.dot.max').addEventListener('click', ()=>{
    if(!maxed){
      prevRect={left:el.style.left, top:el.style.top, width:el.style.width, height:el.style.height};
      el.style.left='4px'; el.style.top='36px';
      el.style.width=(window.innerWidth-8)+'px'; el.style.height=(window.innerHeight-50)+'px';
    } else if(prevRect){ Object.assign(el.style, prevRect); }
    maxed=!maxed;
    if(ctl.onResize) setTimeout(ctl.onResize, 0);
  });
  return id;
}
function restoreOrOpen(appId, launcher){
  const existing = [...openWins.entries()].find(([k,v])=>v.appId===appId);
  if(existing){
    const [id,w]=existing;
    const wasMinimized = w.minimized;
    w.minimized = false;
    if(voidSettings.hyprMode && w.el.dataset.workspace!==String(currentWorkspace)) switchWorkspace(+w.el.dataset.workspace);
    w.el.style.display='';
    if(wasMinimized){
      w.el.classList.add('win-restoring');
      w.el.addEventListener('animationend', ()=>w.el.classList.remove('win-restoring'), {once:true});
      setTimeout(()=>w.el.classList.remove('win-restoring'), 300);
    }
    focusWin(id); renderHyprBar();
    return;
  }
  launcher();
}

/* ============ APP DEFINITIONS ============ */
const APPS = {};
function registerApp(id, def){ APPS[id] = Object.assign({color:'var(--accent)'}, def); }

/* ---- Terminal ---- */
const fortunes = [
  "You will fix the bug you introduced yesterday, tomorrow.",
  "A watched build never finishes.",
  "The cloud is just someone else's computer, and it's also down right now.",
  "Your code compiles. This does not mean it works.",
  "Someday you will name a variable correctly on the first try.",
  "The bug is always in the last place you look, because you stop looking once you find it.",
  "There are only two hard problems in computer science: cache invalidation, naming things, and off-by-one errors.",
];
registerApp('terminal', {title:'Terminal', glyph:'▣', color:'linear-gradient(160deg,#1a2233,#0d121c)', w:660, h:420, build(body){
  body.innerHTML = `<div class="app-terminal" id="termOut"></div>`;
  const out = body.querySelector('#termOut');
  let cwd = HOME;
  const cmdHistory = []; let histIdx = -1;
  function esc(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function printLine(html){ const d=document.createElement('div'); d.className='line'; d.innerHTML=html; out.appendChild(d); out.scrollTop=out.scrollHeight; }
  function shortPath(){ const p=fsPath(cwd); return p.replace(/^\/Home/,'~'); }
  function prompt(){ return `<span class="prompt">guest@voidos</span>:<span style="color:#33ff66">${shortPath()}</span>$ `; }
  function newInputLine(){
    const row=document.createElement('div'); row.className='line term-input-row';
    row.innerHTML = `<span>${prompt()}</span>`;
    const input=document.createElement('input'); input.autocomplete='off'; input.spellcheck=false;
    row.appendChild(input); out.appendChild(row); out.scrollTop=out.scrollHeight; input.focus();
    input.addEventListener('keydown', (e)=>{
      if(e.key==='Enter'){
        const cmd = input.value; row.innerHTML = `<span>${prompt()}${esc(cmd)}</span>`;
        if(cmd.trim()){ cmdHistory.push(cmd); } histIdx = cmdHistory.length;
        runCmd(cmd.trim());
      } else if(e.key==='ArrowUp'){
        e.preventDefault(); if(histIdx>0){ histIdx--; input.value = cmdHistory[histIdx]||''; setTimeout(()=>input.setSelectionRange(input.value.length,input.value.length)); }
      } else if(e.key==='ArrowDown'){
        e.preventDefault(); if(histIdx<cmdHistory.length-1){ histIdx++; input.value = cmdHistory[histIdx]||''; } else { histIdx=cmdHistory.length; input.value=''; }
      }
    });
  }
  function cowsay(text){
    const t = text||'moo?'; const width = Math.min(40, Math.max(t.length,4));
    const top = ' '+'_'.repeat(width+2);
    const bottom = ' '+'-'.repeat(width+2);
    return `<pre style="margin:0">${top}\n&lt; ${esc(t)} &gt;\n${bottom}\n        \\   ^__^\n         \\  (oo)\\_______\n            (__)\\       )\\/\\\n                ||----w |\n                ||     ||</pre>`;
  }
  function runCmd(cmd){
    if(!cmd){ newInputLine(); return; }
    const [c, ...rest] = cmd.split(' ');
    const arg = rest.join(' ');
    switch(c){
      case 'help':
        printLine("Commands: help, ls [dir], cd [dir], cat &lt;file&gt;, pwd, echo, whoami, date, neofetch, clear, open &lt;app&gt;, apps, mkdir &lt;name&gt;, touch &lt;name&gt;, rm &lt;name&gt;, tree, history, fortune, cowsay &lt;text&gt;, theme, crt on|off, matrix, sudo, exit");
        break;
      case 'pwd': printLine(fsPath(cwd)); break;
      case 'whoami': printLine('guest'); break;
      case 'date': printLine(new Date().toString()); break;
      case 'clear': out.innerHTML=''; break;
      case 'echo': printLine(esc(arg)); break;
      case 'apps': printLine(Object.keys(APPS).join('  ')); break;
      case 'history': printLine(cmdHistory.map((h,i)=>(i+1)+'  '+esc(h)).join('<br>')||'(empty)'); break;
      case 'fortune': printLine(esc(fortunes[Math.floor(Math.random()*fortunes.length)])); break;
      case 'cowsay': printLine(cowsay(arg)); break;
      case 'theme': {
        const idx = themePresets.findIndex(t=>t.id===voidSettings.theme);
        const next = themePresets[(idx+1+themePresets.length)%themePresets.length];
        applyTheme(next.id); persistSettings(); printLine('theme set to '+next.label.toLowerCase());
        break;
      }
      case 'crt': {
        if(arg.trim()==='on'){ applyCRT(true); persistSettings(); printLine('CRT mode on'); }
        else if(arg.trim()==='off'){ applyCRT(false); persistSettings(); printLine('CRT mode off'); }
        else printLine('usage: crt on|off');
        break;
      }
      case 'open': { const id=arg.trim(); if(APPS[id]){ launchApp(id); printLine('launching '+id+'…'); } else printLine('no such app: '+esc(id)); break; }
      case 'ls': {
        const target = arg.trim()? fsResolve(cwd, arg.trim()) : cwd;
        if(target==null){ printLine('ls: no such directory: '+esc(arg)); break; }
        const node = FS[target];
        if(node.type!=='folder'){ printLine(node.name); break; }
        const kids = fsChildren(target);
        printLine(kids.length ? kids.map(k=>k.type==='folder'?k.name+'/':k.name).join('  ') : '(empty)');
        break;
      }
      case 'cd': {
        const target = fsResolve(cwd, arg.trim()||'/Home');
        if(target==null || FS[target].type!=='folder'){ printLine('cd: no such directory: '+esc(arg)); break; }
        cwd = target; break;
      }
      case 'cat': {
        const target = fsResolve(cwd, arg.trim());
        if(target==null){ printLine('cat: no such file: '+esc(arg)); break; }
        const node = FS[target];
        if(node.type==='folder'){ printLine('cat: is a directory'); break; }
        printLine(esc(node.content||'').replace(/\n/g,'<br>'));
        break;
      }
      case 'tree': {
        const lines=[];
        (function walk(id,depth){
          const n=FS[id]; if(depth>0) lines.push('&nbsp;'.repeat((depth-1)*2)+(depth>0?'└─ ':'')+n.name+(n.type==='folder'?'/':''));
          if(n.type==='folder') n.children.forEach(c=>walk(c,depth+1));
        })(cwd,0);
        printLine(lines.join('<br>')||'(empty)');
        break;
      }
      case 'mkdir': {
        const name=arg.trim(); if(!name){printLine('mkdir: missing name'); break;}
        addNode(name,'folder',cwd); persistFS(); printLine('created '+name+'/'); break;
      }
      case 'touch': {
        const name=arg.trim(); if(!name){printLine('touch: missing name'); break;}
        if(!fsFindChildByName(cwd,name)) addNode(name,'file',cwd,{content:''});
        persistFS(); printLine('touched '+name); break;
      }
      case 'rm': {
        const name=arg.trim(); const child=fsFindChildByName(cwd,name);
        if(child){ fsMoveToTrash(child.id); persistFS(); printLine('moved '+name+' to Trash'); }
        else printLine('rm: no such file: '+esc(name));
        break;
      }
      case 'neofetch': {
        const themeLbl = (themePresets.find(t=>t.id===voidSettings.theme)||themePresets[0]).label;
        const wmLbl = voidSettings.hyprMode ? 'VoidWM (hyprland-mode)' : 'VoidWM (floating)';
        const cpuTxt = (document.getElementById('cpuVal')||{}).textContent || '—';
        const memTxt = (document.getElementById('memVal')||{}).textContent || '—';
        const palette = ['#1a1a1a','#ff5555','#33ff66','#ffb000','#33ccff','#a259ff','#33ffcc','#e7f1ea'];
        const swatches = palette.map(c=>`<span style="display:inline-block;width:22px;height:14px;background:${c};"></span>`).join('');
        printLine(`<pre style="margin:0;color:#33ff66">
  ▣▣▣▣▣    guest@voidos
  ▣   ▣    ─────────────────────────────
  ▣▣▣▣▣    OS: VoidOS 2.7 "Phosphor" x86_64
  ▣   ▣    Host: browser-tab
  ▣▣▣▣▣    Kernel: void-kernel 2.0
           Uptime: ${document.getElementById('uptimeVal').textContent}
           Shell: voidsh
           Resolution: ${window.innerWidth}x${window.innerHeight}
           WM: ${wmLbl}
           Theme: ${themeLbl} [Phosphor]
           Terminal: voidterm
           CPU: void-core (${cpuTxt} load)
           Memory: ${memTxt} used
           Storage: ${hasVStore()?'persistent':'session-only'}
           Apps: ${Object.keys(APPS).length} installed
</pre><div style="margin-top:6px; display:flex; gap:2px;">${swatches}</div>`);
        break;
      }
      case 'sudo': printLine("guest is not in the sudoers file. This incident will not be reported (probably)."); break;
      case 'matrix': printLine('<span style="color:#33ff66">wake up…</span>'); startMatrixRain(); break;
      case 'exit': printLine('(cannot exit — this terminal is load-bearing)'); break;
      default: printLine(esc(c)+': command not found — try "help"');
    }
    newInputLine();
  }
  printLine('VoidOS terminal — type <b>help</b> to get started. Filesystem mounted at /Home. ↑/↓ recall history.');
  newInputLine();
}});

/* ---- Files (Finder) ---- */
registerApp('files', {title:'Files', glyph:'▤', color:'var(--blue)', w:680, h:460, build(body){
  let cwd = HOME;
  const favorites = [
    ['Home',HOME],['Documents',DOCS],['Pictures',PICS],['Music',MUSICF],
    ['Downloads',DOWN],['Desktop',DESK],['Applications',APPSDIR],['System',SYS],['Trash',TRASH]
  ];
  body.innerHTML = `
    <div class="fm-shell">
      <div class="fm-sidebar">
        <div class="sec">Favorites</div>
        <div id="fmFav"></div>
      </div>
      <div class="fm-main">
        <div class="fm-toolbar">
          <button id="fmUp">↑ Up</button>
          <button id="fmNewFolder">+ Folder</button>
          <button id="fmNewFile">+ File</button>
          <span class="fm-crumbs" id="fmCrumbs" style="margin-left:6px;"></span>
        </div>
        <div class="fm-list" id="fmList"></div>
      </div>
    </div>`;
  const favEl = body.querySelector('#fmFav');
  favorites.forEach(([label,id])=>{
    const d=document.createElement('div'); d.className='sitem'; d.textContent=label;
    d.addEventListener('click', ()=>{ cwd=id; render(); });
    d.addEventListener('dragover', (e)=>{ e.preventDefault(); d.classList.add('dropok'); });
    d.addEventListener('dragleave', ()=>d.classList.remove('dropok'));
    d.addEventListener('drop', (e)=>{
      e.preventDefault(); d.classList.remove('dropok');
      const draggedId = e.dataTransfer.getData('text/void-fs-id'); if(!draggedId) return;
      const ok = id===TRASH ? fsMoveToTrash(draggedId) : fsMoveToFolder(draggedId, id);
      if(ok){ persistFS(); render(); toast(id===TRASH?'Moved to Trash':'Moved to '+label); }
    });
    favEl.appendChild(d);
  });
  const listEl = body.querySelector('#fmList');
  const crumbsEl = body.querySelector('#fmCrumbs');
  function iconFor(node){
    if(node.type==='folder') return '📁';
    if(node.type==='image') return '🖼️';
    if(node.name.endsWith('.zip')) return '🗜️';
    return '📄';
  }
  function startRename(entry, child){
    const nEl = entry.querySelector('.n');
    const old = child.name;
    nEl.innerHTML = `<input value="${old.replace(/"/g,'&quot;')}" />`;
    const input = nEl.querySelector('input'); input.focus(); input.select();
    function commit(){ fsRename(child.id, input.value||old); persistFS(); render(); }
    input.addEventListener('keydown', e=>{ if(e.key==='Enter') commit(); else if(e.key==='Escape') render(); });
    input.addEventListener('blur', commit);
  }
  function render(){
    favEl.querySelectorAll('.sitem').forEach((el,i)=>el.classList.toggle('active', favorites[i][1]===cwd));
    const chain=[]; let cur=FS[cwd];
    while(cur){ chain.unshift(cur); cur = cur.parentId? FS[cur.parentId] : null; if(cur && cur.id==='root') break; }
    crumbsEl.innerHTML = chain.map(n=>`<span data-id="${n.id}">${n.name}</span>`).join(' <span style="color:var(--muted)">/</span> ');
    crumbsEl.querySelectorAll('span[data-id]').forEach(s=>s.addEventListener('click', ()=>{ cwd=s.dataset.id; render(); }));
    const node = FS[cwd];
    listEl.innerHTML='';
    if(!node || node.type!=='folder') return;
    const kids = fsChildren(cwd).slice().sort((a,b)=>{ if(a.type!==b.type) return a.type==='folder'?-1:1; return a.name.localeCompare(b.name); });
    if(!kids.length){ listEl.innerHTML = '<div class="fm-empty"><div class="fm-empty-icon">'+(cwd===TRASH?'🗑️':'📁')+'</div>'+(cwd===TRASH?'Trash is empty.':'This folder is empty. Right-click for New Folder / New File.')+'</div>'; }
    kids.forEach(child=>{
      const entry=document.createElement('div'); entry.className='fm-entry';
      entry.innerHTML = `<div class="g">${iconFor(child)}</div><div class="n">${child.name}</div>`;
      entry.draggable = cwd!==TRASH;
      entry.addEventListener('dragstart', (e)=>{ e.dataTransfer.setData('text/void-fs-id', child.id); entry.classList.add('dragging'); });
      entry.addEventListener('dragend', ()=>entry.classList.remove('dragging'));
      if(child.type==='folder'){
        entry.addEventListener('dragover', (e)=>{ e.preventDefault(); entry.classList.add('dropok'); });
        entry.addEventListener('dragleave', ()=>entry.classList.remove('dropok'));
        entry.addEventListener('drop', (e)=>{
          e.preventDefault(); entry.classList.remove('dropok');
          const draggedId = e.dataTransfer.getData('text/void-fs-id'); if(!draggedId || draggedId===child.id) return;
          if(fsMoveToFolder(draggedId, child.id)){ persistFS(); render(); toast('Moved into '+child.name); }
        });
      }
      entry.addEventListener('dblclick', ()=>{
        if(child.type==='folder'){ cwd=child.id; render(); }
        else if(child.type==='image'){ launchApp('gallery',{focusId:child.id}); }
        else if(child.appLink){ launchApp(child.appLink); }
        else launchApp('editor',{fileId:child.id});
      });
      entry.addEventListener('contextmenu', (e)=>{
        e.preventDefault(); e.stopPropagation();
        const items = [{label:'Open', run:()=>entry.dispatchEvent(new Event('dblclick'))}];
        if(cwd===TRASH){
          items.push({label:'Restore', run:()=>{ fsRestoreFromTrash(child.id); persistFS(); render(); toast('Restored '+child.name); }});
          items.push({label:'Delete permanently', run:()=>{ fsDeletePermanent(child.id); persistFS(); render(); toast('Deleted permanently'); }});
        } else {
          items.push({label:'Rename', run:()=>startRename(entry, child)});
          items.push({label:'Move to Trash', run:()=>{ fsMoveToTrash(child.id); persistFS(); render(); toast('Moved to Trash'); }});
        }
        showCtx(e.clientX, e.clientY, items);
      });
      listEl.appendChild(entry);
    });
  }
  listEl.addEventListener('contextmenu', (e)=>{
    if(e.target.closest('.fm-entry') || cwd===TRASH) return;
    e.preventDefault(); e.stopPropagation();
    showCtx(e.clientX, e.clientY, [
      {label:'+ New Folder', run:()=>{ addNode('New Folder','folder',cwd); persistFS(); render(); }},
      {label:'+ New File', run:()=>{ addNode('new-file.txt','file',cwd,{content:''}); persistFS(); render(); }},
    ]);
  });
  body.querySelector('#fmUp').addEventListener('click', ()=>{ const p=FS[cwd].parentId; if(p && p!=='root') { cwd=p; render(); } });
  body.querySelector('#fmNewFolder').addEventListener('click', ()=>{ addNode('New Folder','folder',cwd); persistFS(); render(); });
  body.querySelector('#fmNewFile').addEventListener('click', ()=>{ addNode('new-file.txt','file',cwd,{content:''}); persistFS(); render(); });
  render();
}});

/* ---- Text Editor ---- */
registerApp('editor', {title:'Text Editor', glyph:'✎', color:'var(--amber)', w:560, h:440, desktopIcon:true, build(body, id, args){
  const fileId = args && args.fileId;
  const node = fileId ? FS[fileId] : null;
  body.innerHTML = `
    <div class="editor-bar"><span id="edPath">${node ? fsPath(fileId) : 'untitled'}</span><button id="edSave">Save</button></div>
    <textarea class="editor" id="edArea" spellcheck="false"></textarea>`;
  const area = body.querySelector('#edArea');
  area.value = node ? node.content : '';
  body.querySelector('#edSave').addEventListener('click', ()=>{
    if(node){ node.content = area.value; persistFS(); toast('Saved '+fsPath(fileId)); }
    else toast('Open a file from Files to save changes to the virtual filesystem.');
  });
}});

/* ---- Calculator ---- */
registerApp('calculator', {title:'Calculator', glyph:'⌘', color:'var(--violet)', w:300, h:420, build(body){
  body.innerHTML = `<div class="calc"><div class="disp" id="calcDisp">0</div><div class="keys">
      ${['C','±','%','÷','7','8','9','×','4','5','6','−','1','2','3','+','0','.','⌫','='].map(k=>{
        const cls = ['÷','×','−','+'].includes(k) ? 'op' : (k==='=' ? 'eq' : '');
        return `<button class="${cls}" data-k="${k}">${k}</button>`;
      }).join('')}</div></div>`;
  const disp = body.querySelector('#calcDisp'); let expr='';
  function render(){ disp.textContent = expr || '0'; }
  body.querySelectorAll('.keys button').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const k = btn.dataset.k;
      if(k==='C'){ expr=''; }
      else if(k==='⌫'){ expr = expr.slice(0,-1); }
      else if(k==='='){ try{ const safe = expr.replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-').replace(/%/g,'/100');
          const val = Function('"use strict";return ('+safe+')')(); expr = String(Math.round(val*1e8)/1e8); }catch(e){ expr='Error'; } }
      else if(k==='±'){ expr = expr.startsWith('-') ? expr.slice(1) : '-'+expr; }
      else{ expr += k; }
      render();
    });
  });
}});

/* ---- Browser ---- */
registerApp('browser', {title:'Browser', glyph:'◎', color:'var(--blue)', w:720, h:480, build(body){
  body.innerHTML = `
    <div class="browser-bar"><button id="brBack">←</button><input id="brUrl" value="https://en.wikipedia.org/wiki/Special:Random" /><button id="brGo">Go</button></div>
    <div class="browser-note">Many sites block embedding in frames — Wikipedia and similar sites work well.</div>
    <iframe class="browser-frame" id="brFrame"></iframe>`;
  const frame = body.querySelector('#brFrame'); const url = body.querySelector('#brUrl');
  function go(u){ let t=u.trim(); if(!/^https?:\/\//.test(t)) t='https://'+t; frame.src=t; }
  body.querySelector('#brGo').addEventListener('click', ()=>go(url.value));
  url.addEventListener('keydown', e=>{ if(e.key==='Enter') go(url.value); });
  body.querySelector('#brBack').addEventListener('click', ()=>{ try{frame.contentWindow.history.back();}catch(e){} });
  go(url.value);
}});

/* ---- Paint ---- */
registerApp('paint', {title:'Paint', glyph:'✦', color:'var(--green)', w:560, h:440, build(body){
  body.innerHTML = `
    <div style="display:flex; gap:8px; padding:8px; border-bottom:1px solid var(--line); align-items:center;">
      <input type="color" id="pColor" value="#ffb000" style="width:34px;height:28px;border:none;background:none;">
      <input type="range" id="pSize" min="1" max="40" value="6">
      <button id="pClear" style="background:rgba(255,255,255,0.08);border:1px solid var(--line);color:#dbe4ee;border-radius:6px;padding:4px 10px;cursor:pointer;">Clear</button>
    </div>
    <canvas id="pCanvas" style="width:100%; height:calc(100% - 46px); background:#0a0d13; display:block; cursor:crosshair;"></canvas>`;
  const canvas = body.querySelector('#pCanvas'); const ctx = canvas.getContext('2d');
  function fit(){ canvas.width = canvas.clientWidth; canvas.height = canvas.clientHeight; }
  requestAnimationFrame(fit); new ResizeObserver(fit).observe(canvas);
  let drawing=false, last=null;
  function pos(e){ const r=canvas.getBoundingClientRect(); return {x:e.clientX-r.left, y:e.clientY-r.top}; }
  canvas.addEventListener('mousedown', e=>{ drawing=true; last=pos(e); });
  window.addEventListener('mouseup', ()=>drawing=false);
  canvas.addEventListener('mousemove', e=>{
    if(!drawing) return; const p=pos(e);
    ctx.strokeStyle = body.querySelector('#pColor').value; ctx.lineWidth = body.querySelector('#pSize').value; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(last.x,last.y); ctx.lineTo(p.x,p.y); ctx.stroke(); last=p;
  });
  body.querySelector('#pClear').addEventListener('click', ()=>ctx.clearRect(0,0,canvas.width,canvas.height));
}});

/* ---- Synth Pads ---- */
registerApp('synth', {title:'Synth Pads', glyph:'♪', color:'var(--accent2)', w:360, h:360, build(body){
  body.innerHTML = `<div class="synth-pad" id="pads"></div>`;
  const notes = [261.6,293.7,329.6,349.2,392.0,440.0,493.9,523.3,587.3,659.3,698.5,784.0];
  const names = ['C','D','E','F','G','A','B','C5','D5','E5','F5','G5'];
  let ctxAudio; const pads = body.querySelector('#pads');
  notes.forEach((freq,i)=>{
    const b=document.createElement('button'); b.textContent=names[i];
    b.addEventListener('click', ()=>{
      if(!ctxAudio) ctxAudio = new (window.AudioContext||window.webkitAudioContext)();
      const osc=ctxAudio.createOscillator(), gain=ctxAudio.createGain();
      osc.frequency.value=freq; osc.type='sine'; gain.gain.value=0.15;
      osc.connect(gain); gain.connect(ctxAudio.destination); osc.start();
      gain.gain.exponentialRampToValueAtTime(0.0001, ctxAudio.currentTime+0.6); osc.stop(ctxAudio.currentTime+0.6);
    });
    pads.appendChild(b);
  });
}});

/* ---- Music Player ---- */
/* Auto-detected bundled tracks — real audio files, not synthesized.
   Any .mp3/.m4a/.ogg/.wav dropped into the music/ folder next to
   index.html is picked up automatically, no code editing and — if
   hosted on GitHub Pages — no manifest file either:
     1) GitHub Pages: reads the music/ folder straight from the public
        GitHub API (the same repo this page is served from), so simply
        adding files to that folder and pushing is enough.
     2) Local dev server with directory listing enabled (e.g. running
        `python3 -m http.server` in the VoidOS folder, or any host with
        autoindex on) — finds every audio file in the folder on its own.
     3) Any other static host without a listing: falls back to reading
        music/tracks.txt, a plain text file listing one filename per
        line — no code/JSON syntax required. */
function niceTrackName(filename){
  return filename.replace(/\.[^.]+$/, '').replace(/[_]+/g,' ').replace(/\s+/g,' ').trim();
}
async function fetchText(url){
  // fetch() can't load anything at all under file:// (double-clicking
  // index.html) — skip the attempt outright instead of letting the browser
  // log a network-level console error for a request that can never work.
  if(location.protocol==='file:') return null;
  try{ const r = await fetch(url, {cache:'no-store'}); if(!r.ok) return null; return await r.text(); }
  catch(e){ return null; }
}
async function fetchJSON(url){
  if(location.protocol==='file:') return null;
  try{ const r = await fetch(url, {cache:'no-store'}); if(!r.ok) return null; return await r.json(); }
  catch(e){ return null; }
}
/* GitHub Pages serves this file from a repo, but doesn't expose folder
   listings itself — the public GitHub REST API does, for the same repo,
   with no auth needed. We don't know the exact owner/repo from JS alone,
   so we infer it from the page's own URL and try the couple of layouts
   GitHub Pages actually uses. Reused for both the music/ and wallpapers/
   folders. */
async function tryGithubApiListing(folder){
  const host = location.hostname;
  if(!host.endsWith('.github.io')) return null;
  const owner = host.split('.')[0];
  const pathParts = location.pathname.split('/').filter(Boolean);
  const repoCandidates = [];
  if(pathParts.length) repoCandidates.push(pathParts[0]); // project page: username.github.io/reponame/
  repoCandidates.push(owner + '.github.io'); // user/org page: username.github.io/
  for(const repo of repoCandidates){
    const data = await fetchJSON(`https://api.github.com/repos/${owner}/${repo}/contents/${folder}`);
    if(Array.isArray(data)) return data;
  }
  return null;
}
/* Generic "find every file matching a pattern in a folder" — tries the
   GitHub API listing first (GitHub Pages), then a plain directory listing
   (local dev server / autoindex host), then a manifest text file as the
   universal fallback. Shared by the music and wallpaper auto-detection. */
async function autoDetectFiles(folder, extRegex){
  let names = [];
  const ghItems = await tryGithubApiListing(folder);
  if(ghItems){
    names = ghItems.filter(it=>it.type==='file' && extRegex.test(it.name)).map(it=>it.name);
  }
  if(!names.length){
    const dirHtml = await fetchText(folder+'/');
    if(dirHtml){
      const re = new RegExp('href="([^"?#]+'+extRegex.source.replace(/^\^|\$$/g,'')+')"', 'gi');
      names = [...dirHtml.matchAll(re)].map(m=>decodeURIComponent(m[1])).filter(n=>!n.includes('/'));
    }
  }
  return [...new Set(names)];
}
/* Last-resort fallback for file:// (double-clicking index.html instead of
   running a local server) — the Fetch API can't load anything at all under
   file://, so neither the directory-listing detection above nor the
   tracks.txt fetch below can ever succeed there, and without this the
   Music Player would only ever show the placeholder chiptune tracks.
   Keep this list in sync with music/tracks.txt when adding new bundled
   tracks; everywhere else (a real server) tracks.txt is what's actually
   read and this array is never consulted. */
const BUNDLED_MUSIC_FALLBACK = [
  'BEAT YOUR GUN - FRENCHORE REMIX.mp3',
  'Bubblegum Bitch (frenchcore remix).mp3',
  'DESH - OSZTRIGA.mp3',
  'Desh-Egy éjszaka.mp3',
  'FRIENDS (HoodTrap).mp3',
  'HULL A SZILVA A FÁRÓL (Mashup).mp3',
  'KISS - I Was Made For Loving You.mp3',
  'Kisses (All Night).mp3',
  'Lemon Tree X Future [CEEZY REMIX].mp3',
  'Let Me Bleed.mp3',
  'Remedy.mp3',
  'Shunrated - Take My Heart.mp3',
  'Vamos A La Playa (Hardstyle Remix).mp3',
  'Vengaboys - Boom Boom Boom Boom!! (yetixz Bootleg).mp3',
  'Vibe Chemistry - Balling (LÄUFF Remix) [Sped Up Edit].mp3',
  'all I wanted x rinoplastika _ mylancore - prodwhite remix.mp3',
  'friends (mylancore&hoodtrap ).mp3',
  'shady x 1nonly - stay high _SOUNDCLOUD EXCLUSIVE_ (1).mp3',
  'shady x 1nonly - stay high _SOUNDCLOUD EXCLUSIVE_.mp3',
];
async function loadBundledTracks(){
  let names = await autoDetectFiles('music', /\.(mp3|m4a|ogg|wav)$/i);
  if(!names.length){
    const manifest = await fetchText('music/tracks.txt');
    if(manifest) names = manifest.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
  }
  if(!names.length) names = BUNDLED_MUSIC_FALLBACK.slice();
  names = [...new Set(names)];
  return names.map(n => ({ title: niceTrackName(n), artist:'My Music', hue: Math.floor(Math.random()*360), url: 'music/'+n }));
}
/* Same auto-detection for the wallpapers/ folder — any image dropped in
   there shows up in Settings > Wallpaper without uploading it through the
   "+" button. Falls back to wallpapers/wallpapers.txt (one filename per
   line) on hosts where neither the GitHub API nor a directory listing is
   available. The two originally-bundled wallpapers stay hardcoded above
   either way, so this only adds to them. */
const BUNDLED_WALLPAPER_FALLBACK = [
  '4740.jpg','4741.jpg','asus-rog-gaming-3840x2160-16725.jpg',
  'lofi-boy-5k-retro-3840x2160-15203.jpg','lorenzo-herrera-p0j-mE6mGo4-unsplash.jpg',
  'samurai-pixel-art-3840x2160-15196.jpg',
];
async function loadBundledWallpapers(){
  let names = await autoDetectFiles('wallpapers', /\.(jpe?g|png|webp|gif|avif)$/i);
  if(!names.length){
    const manifest = await fetchText('wallpapers/wallpapers.txt');
    if(manifest) names = manifest.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
  }
  if(!names.length) names = BUNDLED_WALLPAPER_FALLBACK.slice();
  names = [...new Set(names)];
  const known = new Set(wallpapers.filter(w=>w.photo).map(w=>w.css.match(/wallpapers\/([^')]+)/)?.[1]));
  return names.filter(n=>!known.has(n)).map(n => ({
    id: 'folder-'+n.replace(/[^a-zA-Z0-9]/g,'-'),
    label: niceTrackName(n),
    photo: true,
    css: "linear-gradient(rgba(2,2,4,0.30),rgba(2,2,4,0.50)), url('wallpapers/"+n+"') center/cover no-repeat"
  }));
}
const playlist = [
  {title:'Onyx Skyline', artist:'null/void', hue:190, wave:'triangle', tempo:700, notes:[261.6,329.6,392.0,523.3]},
  {title:'Neon Alley Drift', artist:'kaimu', hue:280, wave:'square', tempo:620, notes:[293.7,349.2,440.0,587.3]},
  {title:'Static Bloom', artist:'8-bit chorus', hue:20, wave:'sawtooth', tempo:540, notes:[220.0,277.2,329.6,440.0]},
  {title:'Late Compile', artist:'ctrl+z', hue:150, wave:'triangle', tempo:760, notes:[196.0,246.9,293.7,392.0]},
  {title:'Ember Loop', artist:'null/void', hue:340, wave:'square', tempo:660, notes:[233.1,293.7,349.2,466.2]},
  {title:'Phosphor Dawn', artist:'kaimu', hue:45, wave:'triangle', tempo:580, notes:[349.2,415.3,466.2,523.3,392.0]},
  {title:'Boot Sector Blues', artist:'ctrl+z', hue:210, wave:'sawtooth', tempo:820, notes:[164.8,196.0,220.0,246.9]},
  {title:'Backrooms Arcade', artist:'8-bit chorus', hue:120, wave:'square', tempo:480, notes:[261.6,293.7,349.2,392.0,440.0,392.0]},
  {title:'Dial-Up Reverie', artist:'null/void', hue:300, wave:'triangle', tempo:900, notes:[207.7,277.2,311.1,415.3]},
];
/* ---- Local music library (IndexedDB) — persists the user's own imported audio
   files in their own browser across reloads. Nothing is ever uploaded anywhere;
   this only touches storage that already lives on the visitor's own device. */
/* Every localStorage key VoidOS writes to — the one list "Forget saved
   data" and the export/import backup both work from, so adding a new
   persisted app only means updating this array once. */
const BACKUP_KEYS = ['voidos:settings','voidos:notes','voidos:kanban','voidos:fs','voidos:session','voidos:installed','voidos:distros','voidos:dotfiles','voidos:mail','voidos:calendar','voidos:achievements','voidos:gadgets','voidos:stickyText','voidos:stickyHidden'];
async function exportBackup(){
  const data = {};
  for(const k of BACKUP_KEYS){ const v = await vLoad(k, null); if(v!==null) data[k]=v; }
  const payload = { app:'VoidOS', version:'2.6', exportedAt:new Date().toISOString(), data };
  const blob = new Blob([JSON.stringify(payload,null,2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download='voidos-backup-'+new Date().toISOString().slice(0,10)+'.json';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url), 1000);
  toast('Backup downloaded', 'success');
}
function importBackupFile(file){
  const reader = new FileReader();
  reader.onload = ()=>{
    try{
      const payload = JSON.parse(reader.result);
      const data = payload && payload.data ? payload.data : payload; // tolerate a raw {key:val} dump too
      let count = 0;
      Object.entries(data).forEach(([k,v])=>{ if(BACKUP_KEYS.includes(k)){ vSave(k, v); count++; } });
      if(!count){ toast('No recognizable VoidOS data in that file', 'error'); return; }
      toast('Backup imported ('+count+' item'+(count>1?'s':'')+') — reload to apply', 'success');
    }catch(e){ toast('Could not read that file — is it a VoidOS backup?', 'error'); }
  };
  reader.readAsText(file);
}
const MUSIC_DB_NAME='voidos-music', MUSIC_STORE='tracks';
function hasIDB(){ try{ return typeof indexedDB !== 'undefined' && !!indexedDB; }catch(e){ return false; } }
function openMusicDB(){
  return new Promise((resolve,reject)=>{
    if(!hasIDB()){ reject(new Error('no indexedDB')); return; }
    let req;
    try{ req = indexedDB.open(MUSIC_DB_NAME, 1); }catch(e){ reject(e); return; }
    req.onupgradeneeded = ()=>{ if(!req.result.objectStoreNames.contains(MUSIC_STORE)) req.result.createObjectStore(MUSIC_STORE, {keyPath:'id'}); };
    req.onsuccess = ()=>resolve(req.result);
    req.onerror = ()=>reject(req.error);
  });
}
async function musicDBSave(rec){
  try{
    const db = await openMusicDB();
    return await new Promise((resolve)=>{
      const tx = db.transaction(MUSIC_STORE,'readwrite');
      tx.objectStore(MUSIC_STORE).put(rec);
      tx.oncomplete = ()=>resolve(true); tx.onerror = ()=>resolve(false);
    });
  }catch(e){ return false; }
}
async function musicDBLoadAll(){
  try{
    const db = await openMusicDB();
    return await new Promise((resolve)=>{
      const tx = db.transaction(MUSIC_STORE,'readonly');
      const req = tx.objectStore(MUSIC_STORE).getAll();
      req.onsuccess = ()=>resolve(req.result||[]); req.onerror = ()=>resolve([]);
    });
  }catch(e){ return []; }
}
async function musicDBDelete(id){
  try{
    const db = await openMusicDB();
    return await new Promise((resolve)=>{
      const tx = db.transaction(MUSIC_STORE,'readwrite');
      tx.objectStore(MUSIC_STORE).delete(id);
      tx.oncomplete = ()=>resolve(true); tx.onerror = ()=>resolve(false);
    });
  }catch(e){ return false; }
}
/* ---- Custom wallpapers (IndexedDB) — same idea as the music library above,
   just a second small database so an uploaded photo persists across reloads
   without bloating localStorage (which has only a few MB of quota total). */
const WALL_DB_NAME='voidos-wallpapers', WALL_STORE='wallpapers';
function openWallDB(){
  return new Promise((resolve,reject)=>{
    if(!hasIDB()){ reject(new Error('no indexedDB')); return; }
    let req;
    try{ req = indexedDB.open(WALL_DB_NAME, 1); }catch(e){ reject(e); return; }
    req.onupgradeneeded = ()=>{ if(!req.result.objectStoreNames.contains(WALL_STORE)) req.result.createObjectStore(WALL_STORE, {keyPath:'id'}); };
    req.onsuccess = ()=>resolve(req.result);
    req.onerror = ()=>reject(req.error);
  });
}
async function wallDBSave(rec){
  try{
    const db = await openWallDB();
    return await new Promise((resolve)=>{
      const tx = db.transaction(WALL_STORE,'readwrite');
      tx.objectStore(WALL_STORE).put(rec);
      tx.oncomplete = ()=>resolve(true); tx.onerror = ()=>resolve(false);
    });
  }catch(e){ return false; }
}
async function wallDBLoadAll(){
  try{
    const db = await openWallDB();
    return await new Promise((resolve)=>{
      const tx = db.transaction(WALL_STORE,'readonly');
      const req = tx.objectStore(WALL_STORE).getAll();
      req.onsuccess = ()=>resolve(req.result||[]); req.onerror = ()=>resolve([]);
    });
  }catch(e){ return []; }
}
let musicSeq = 1;

registerApp('music', {title:'Music Player', glyph:'♫', color:'var(--accent2)', w:420, h:660, build(body){
  let library = playlist.map(t=>({...t, kind:'synth'}));
  let idx=0, playing=false, progress=0, timer=null, audioCtx=null, oscTimeouts=[];
  let audioEl=null, vaTimer=null, vaFrame=0;
  let shuffle=false, repeatOne=false, playHistory=[];
  body.innerHTML = `
    <div class="mp">
      <div class="mp-art"><canvas id="mpCanvas"></canvas></div>
      <div class="mp-meta"><div class="t" id="mpTitle"></div><div class="a" id="mpArtist"></div></div>
      <div class="mp-bar"><div class="mp-progress" id="mpProg"><div class="fill" id="mpFill"></div></div></div>
      <div class="mp-controls">
        <button id="mpShuffle" class="mp-toggle-btn" title="Shuffle">🔀</button>
        <button id="mpPrev">⏮</button><button class="play" id="mpPlay">▶</button><button id="mpNext">⏭</button>
        <button id="mpRepeat" class="mp-toggle-btn" title="Repeat current track">🔁</button>
      </div>
      <div class="mp-import">
        <input type="file" id="mpFileInput" accept="audio/*" multiple style="display:none;">
        <div class="mp-drop" id="mpDrop">
          <div class="mp-drop-icon">♫</div>
          <div class="mp-drop-title">Add your own music</div>
          <div class="mp-drop-sub">Drag &amp; drop audio files here</div>
          <button id="mpImportBtn">Browse files</button>
          <div class="mp-drop-formats">MP3 · M4A · OGG · WAV</div>
        </div>
        <div class="mp-import-hint">${hasIDB() ? 'Saved permanently in this browser — import once, they stay after reload.' : 'Plays local files for this session — persistent storage is not available here.'}</div>
      </div>
      <div class="mp-list" id="mpList"></div>
    </div>`;
  const canvas = body.querySelector('#mpCanvas');
  function fitCanvas(){ canvas.width = canvas.clientWidth; canvas.height = canvas.clientHeight; }
  requestAnimationFrame(fitCanvas); new ResizeObserver(fitCanvas).observe(canvas);
  const ctx = canvas.getContext('2d');
  function drawArt(){
    const w=canvas.width,h=canvas.height; const t=library[idx]; if(!t) return;
    const g = ctx.createLinearGradient(0,0,w,h);
    g.addColorStop(0, `hsl(${t.hue},70%,55%)`); g.addColorStop(1, `hsl(${(t.hue+60)%360},60%,25%)`);
    ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
    if(analyser && playing && (t.kind==='local'||t.kind==='bundled')){
      analyser.getByteFrequencyData(analyserData);
      const bars = analyserData.length;
      const bw = w/bars;
      ctx.fillStyle='rgba(255,255,255,0.55)';
      for(let i=0;i<bars;i++){
        const v = analyserData[i]/255;
        const bh = v*h*0.8;
        ctx.fillRect(i*bw, h-bh, bw*0.8, bh);
      }
    } else {
      ctx.globalAlpha=0.5;
      for(let i=0;i<5;i++){
        ctx.beginPath(); ctx.arc((Math.sin(i*1.3+vaFrame/8)*.3+.5)*w, (Math.cos(i*1.7+vaFrame/8)*.3+.5)*h, 40+i*10, 0, Math.PI*2);
        ctx.strokeStyle=playing?'rgba(255,255,255,0.3)':'rgba(255,255,255,0.12)'; ctx.lineWidth=2; ctx.stroke();
      }
      ctx.globalAlpha=1;
    }
    if(t.kind==='local'){ ctx.fillStyle='rgba(0,0,0,0.35)'; ctx.font='11px '+getComputedStyle(document.body).fontFamily; ctx.textAlign='center'; ctx.fillText(analyser?'LOCAL FILE · LIVE':'LOCAL FILE', w/2, h-10); ctx.textAlign='left'; }
  }
  function startVisualLoop(){ if(vaTimer) return; vaTimer=setInterval(()=>{ vaFrame++; drawArt(); }, 60); }
  function stopVisualLoop(){ clearInterval(vaTimer); vaTimer=null; }
  const listEl = body.querySelector('#mpList');
  function niceName(filename){
    return filename.replace(/\.[^.]+$/, '').replace(/[_]+/g,' ').replace(/\s+/g,' ').trim();
  }
  function renderList(){
    listEl.innerHTML='';
    library.forEach((t,i)=>{
      const row=document.createElement('div'); row.className='track'+(i===idx?' active':'');
      row.innerHTML=`<span>${t.kind==='local'?'📁 ':t.kind==='bundled'?'♪ ':''}${t.title}</span><span>${t.artist}${t.kind==='local'?' <span class="mp-x" data-i="'+i+'">×</span>':''}</span>`;
      row.addEventListener('click', (e)=>{
        if(e.target.classList.contains('mp-x')){
          e.stopPropagation();
          if(t.url) URL.revokeObjectURL(t.url);
          if(t.dbId) musicDBDelete(t.dbId);
          library.splice(i,1);
          if(idx>=library.length) idx=library.length-1;
          if(idx===i && playing) togglePlay();
          loadTrack();
          return;
        }
        idx=i; loadTrack(); if(!playing) togglePlay(); else { stopPlayback(); playCurrent(); }
      });
      listEl.appendChild(row);
    });
  }
  function loadTrack(){
    const t=library[idx]; if(!t){ body.querySelector('#mpTitle').textContent='—'; body.querySelector('#mpArtist').textContent=''; return; }
    body.querySelector('#mpTitle').textContent=t.title;
    body.querySelector('#mpArtist').textContent=t.artist;
    progress=0; body.querySelector('#mpFill').style.width='0%';
    drawArt(); renderList();
  }
  function stopTones(){ oscTimeouts.forEach(clearTimeout); oscTimeouts=[]; }
  function playTones(){
    if(!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)();
    const t=library[idx]; let step=0;
    function loopNote(){
      if(!playing || library[idx]!==t) return;
      const freq = t.notes[step % t.notes.length];
      const osc=audioCtx.createOscillator(), gain=audioCtx.createGain();
      osc.type=t.wave||'triangle'; osc.frequency.value=freq; gain.gain.value=0.06;
      osc.connect(gain); gain.connect(audioCtx.destination); osc.start();
      const dur = (t.tempo||700)/1000*0.9;
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime+dur); osc.stop(audioCtx.currentTime+dur);
      step++;
      oscTimeouts.push(setTimeout(loopNote, t.tempo||700));
    }
    loopNote();
  }
  let analyser=null, analyserData=null, mediaSrcNode=null;
  function ensureAudioEl(){
    if(audioEl) return audioEl;
    audioEl = new Audio();
    // The file: scheme has no concept of CORS at all — Chrome flat out refuses
    // to load *any* media with crossOrigin set from a file:// page (blocks
    // playback entirely, not just the analyser). Only bundled/imported audio
    // ever plays here anyway (never a genuinely cross-origin URL), so this is
    // purely for the frequency-visualizer's createMediaElementSource routing
    // and is safe to skip under file://.
    if(location.protocol !== 'file:') audioEl.crossOrigin = 'anonymous';
    audioEl.addEventListener('ended', ()=>nextTrack(true));
    audioEl.addEventListener('timeupdate', ()=>{
      if(audioEl.duration){ progress=(audioEl.currentTime/audioEl.duration)*200; body.querySelector('#mpFill').style.width=(progress/200*100)+'%'; }
    });
    // Real frequency-analysis visualizer for local files. Best-effort: some
    // sandboxed environments restrict Web Audio routing, so this quietly
    // falls back to the decorative animation if anything here fails.
    // Important: once createMediaElementSource() is called, the <audio>
    // element's output is permanently rerouted into the Web Audio graph —
    // there is no going back to plain direct-to-speakers playback. So if
    // anything past that point throws (analyser setup, connecting it),
    // the source must still be wired straight to the destination itself,
    // or the track plays (currentTime advances, UI updates) completely
    // silently forever with no way to recover.
    //
    // Under file:// specifically, this isn't even a throw-and-catch
    // situation: Chrome treats every local file as CORS-restricted for Web
    // Audio purposes no matter what crossOrigin is set to, so
    // MediaElementAudioSourceNode just silently outputs zeroes forever
    // ("MediaElementAudioSource outputs zeroes due to CORS access
    // restrictions" in the console) — no exception, nothing to catch,
    // audio decodes and the UI updates normally, but total silence. So
    // under file:// we skip Web Audio routing entirely and let the
    // <audio> element play straight to the speakers on its own.
    if(location.protocol !== 'file:'){
      try{
        if(!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)();
        mediaSrcNode = audioCtx.createMediaElementSource(audioEl);
        try{
          analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          analyserData = new Uint8Array(analyser.frequencyBinCount);
          mediaSrcNode.connect(analyser);
          analyser.connect(audioCtx.destination);
        }catch(e){
          analyser = null;
          mediaSrcNode.connect(audioCtx.destination);
        }
      }catch(e){ analyser=null; }
    }
    return audioEl;
  }
  function playCurrent(){
    const t = library[idx]; if(!t) return;
    if(t.kind==='local'){
      const a = ensureAudioEl();
      if(a.src !== t.url) a.src = t.url;
      // Fire resume() and play() together, both directly inside this
      // click-triggered call — deferring play() into resume()'s .then()
      // would run it outside the synchronous click, which some browsers'
      // autoplay policy treats as no longer being a real user gesture and
      // silently blocks.
      if(audioCtx && audioCtx.state==='suspended') audioCtx.resume().catch(()=>{});
      a.play().catch(()=>toast('Could not start playback — try pressing play again.', 'error'));
    } else if(t.kind==='bundled'){
      const a = ensureAudioEl();
      if(!a.src.endsWith(t.url)) a.src = t.url;
      if(audioCtx && audioCtx.state==='suspended') audioCtx.resume().catch(()=>{});
      a.play().catch(()=>toast(`Couldn't load ${t.url} — add that file to the music/ folder.`, 'error'));
    } else {
      playTones();
      if(!timer) timer=setInterval(()=>{
        if(library[idx]!==t) return;
        progress+=1; if(progress>=200){ nextTrack(true); return; }
        body.querySelector('#mpFill').style.width=(progress/200*100)+'%';
      }, 300);
    }
  }
  function stopPlayback(){ stopTones(); clearInterval(timer); timer=null; if(audioEl) audioEl.pause(); }
  function togglePlay(){
    playing=!playing;
    body.querySelector('#mpPlay').textContent = playing?'⏸':'▶';
    if(playing){ startVisualLoop(); playCurrent(); } else { stopVisualLoop(); stopPlayback(); }
  }
  // auto=true means "reached the natural end of the track" (repeat-one only
  // applies there); a manual Next click always advances regardless of repeat.
  function nextTrack(auto){
    if(!library.length) return;
    if(auto && repeatOne){ loadTrack(); if(playing){ stopPlayback(); playCurrent(); } return; }
    playHistory.push(idx); if(playHistory.length>200) playHistory.shift();
    if(shuffle && library.length>1){
      let n; do{ n=Math.floor(Math.random()*library.length); }while(n===idx);
      idx = n;
    } else idx=(idx+1)%library.length;
    loadTrack(); if(playing){ stopPlayback(); playCurrent(); }
  }
  function prevTrack(){
    if(!library.length) return;
    idx = playHistory.length ? playHistory.pop() : (idx-1+library.length)%library.length;
    loadTrack(); if(playing){ stopPlayback(); playCurrent(); }
  }
  body.querySelector('#mpPlay').addEventListener('click', togglePlay);
  body.querySelector('#mpNext').addEventListener('click', ()=>nextTrack(false));
  body.querySelector('#mpPrev').addEventListener('click', prevTrack);
  body.querySelector('#mpShuffle').addEventListener('click', (e)=>{
    shuffle = !shuffle;
    e.currentTarget.classList.toggle('active', shuffle);
    toast(shuffle ? 'Shuffle on' : 'Shuffle off');
  });
  body.querySelector('#mpRepeat').addEventListener('click', (e)=>{
    repeatOne = !repeatOne;
    e.currentTarget.classList.toggle('active', repeatOne);
    toast(repeatOne ? 'Repeat: this track' : 'Repeat off');
  });
  body.querySelector('#mpProg').addEventListener('click', (e)=>{
    const r=e.currentTarget.getBoundingClientRect(); const frac=(e.clientX-r.left)/r.width;
    progress=frac*200; body.querySelector('#mpFill').style.width=(progress/200*100)+'%';
    const t=library[idx];
    if(t && (t.kind==='local'||t.kind==='bundled') && audioEl && audioEl.duration) audioEl.currentTime = frac*audioEl.duration;
  });
  const fileInput = body.querySelector('#mpFileInput');
  const dropZone = body.querySelector('#mpDrop');
  function importFiles(files){
    if(!files.length) return;
    files.forEach(f=>{
      const url = URL.createObjectURL(f);
      const dbId = hasIDB() ? ('m'+(musicSeq++)+'_'+Date.now()) : null;
      const hue = Math.floor(Math.random()*360);
      library.push({ title: niceName(f.name), artist:'Imported', hue, kind:'local', file:f, url, dbId });
      if(dbId) musicDBSave({ id:dbId, name:f.name, type:f.type, hue, blob:f });
    });
    toast(`Imported ${files.length} track${files.length>1?'s':''}${hasIDB()?' — saved for next time':''}`);
    unlockAchievement('byob');
    renderList();
    if(library.length===files.length){ idx=0; loadTrack(); }
  }
  body.querySelector('#mpImportBtn').addEventListener('click', ()=>fileInput.click());
  fileInput.addEventListener('change', (e)=>{
    importFiles([...e.target.files]);
    e.target.value='';
  });
  // Drag & drop straight onto the import panel — dragDepth avoids the
  // dragleave flicker that fires when the pointer crosses a child element.
  let dragDepth = 0;
  dropZone.addEventListener('dragenter', (e)=>{ e.preventDefault(); dragDepth++; dropZone.classList.add('drag-over'); });
  dropZone.addEventListener('dragover', (e)=>e.preventDefault());
  dropZone.addEventListener('dragleave', ()=>{ dragDepth=Math.max(0,dragDepth-1); if(dragDepth===0) dropZone.classList.remove('drag-over'); });
  dropZone.addEventListener('drop', (e)=>{
    e.preventDefault(); dragDepth=0; dropZone.classList.remove('drag-over');
    const files = [...(e.dataTransfer?.files||[])].filter(f=>f.type.startsWith('audio/') || /\.(mp3|m4a|ogg|wav)$/i.test(f.name));
    if(files.length) importFiles(files); else toast('Drop MP3, M4A, OGG or WAV files to import', 'error');
  });
  loadTrack();
  // Auto-detect bundled tracks from the music/ folder (directory listing if
  // the host supports it, otherwise music/tracks.txt). Prepended so real
  // music takes priority over the placeholder chiptunes.
  loadBundledTracks().then(tracks=>{
    if(!tracks.length) return;
    const stillOnFirstSynthTrack = !playing && idx===0;
    library = tracks.map(t=>({...t, kind:'bundled'})).concat(library);
    if(stillOnFirstSynthTrack){ idx=0; loadTrack(); } else { idx += tracks.length; renderList(); }
  });
  // Restore any tracks the user imported in a previous session (same browser, same device).
  if(hasIDB()){
    musicDBLoadAll().then(recs=>{
      if(!recs || !recs.length) return;
      recs.forEach(rec=>{
        try{
          const url = URL.createObjectURL(rec.blob);
          library.push({ title: niceName(rec.name), artist:'Imported', hue: rec.hue||Math.floor(Math.random()*360), kind:'local', file:rec.blob, url, dbId: rec.id });
        }catch(e){ /* skip a corrupt record rather than breaking the whole list */ }
      });
      renderList();
    }).catch(()=>{});
  }
  return { onClose(){
    playing=false; stopTones(); stopVisualLoop(); clearInterval(timer);
    if(audioEl){ audioEl.pause(); audioEl.src=''; }
    library.forEach(t=>{ if(t.url) URL.revokeObjectURL(t.url); });
  } };
}});

/* ---- Notes ---- */
let notesData = [
  {id:1, title:'Distro shortlist', body:'CachyOS for gaming, BlackArch for pentest VM, keep Arch base either way.'},
  {id:2, title:'Serpantium', body:'Shell not released yet — watch the dotfiles repo for updates.'},
  {id:3, title:'Random idea', body:'Desktop pet that reacts to CPU load — high load = zoomies.'},
];
let notesSeq=4;
const persistNotes = debouncedSave('voidos:notes', ()=>notesData);
registerApp('notes', {title:'Notes', glyph:'✐', color:'var(--amber)', w:520, h:440, build(body){
  let active = notesData[0] ? notesData[0].id : null;
  body.innerHTML = `<div class="notes-shell">
      <div class="notes-list-wrap" style="display:flex; flex-direction:column; width:180px; border-right:1px solid var(--line);">
        <div class="notes-new"><button id="nNew">+ New note</button></div>
        <div class="notes-list" id="nList" style="flex:1;"></div>
      </div>
      <div class="notes-edit">
        <input id="nTitle" placeholder="Title" style="background:transparent;border:none;outline:none;color:var(--text);font-weight:700;font-size:15px;padding:14px 16px 4px;">
        <textarea id="nBody" placeholder="Write something…"></textarea>
      </div>
    </div>`;
  const listEl = body.querySelector('#nList'), titleEl = body.querySelector('#nTitle'), bodyEl = body.querySelector('#nBody');
  function renderList(){
    listEl.innerHTML='';
    if(!notesData.length){ listEl.innerHTML='<div class="fm-empty"><div class="fm-empty-icon">✐</div>No notes yet — hit + New note.</div>'; return; }
    notesData.slice().reverse().forEach(n=>{
      const d=document.createElement('div'); d.className='nitem'+(n.id===active?' active':'');
      d.innerHTML = `<div class="nt">${n.title||'Untitled'}</div><div class="np">${(n.body||'').slice(0,40)}</div>`;
      d.addEventListener('click', ()=>{ active=n.id; loadNote(); renderList(); });
      listEl.appendChild(d);
    });
  }
  function loadNote(){
    const n = notesData.find(x=>x.id===active);
    titleEl.value = n ? n.title : ''; bodyEl.value = n ? n.body : '';
  }
  titleEl.addEventListener('input', ()=>{ const n=notesData.find(x=>x.id===active); if(n){ n.title=titleEl.value; renderList(); persistNotes(); } });
  bodyEl.addEventListener('input', ()=>{ const n=notesData.find(x=>x.id===active); if(n){ n.body=bodyEl.value; renderList(); persistNotes(); } });
  body.querySelector('#nNew').addEventListener('click', ()=>{
    const n={id:notesSeq++, title:'New note', body:''}; notesData.push(n); active=n.id; renderList(); loadNote(); persistNotes();
  });
  renderList(); loadNote();
}});

/* ---- Gallery ---- */
function drawArtToCanvas(canvas, seed, hue){
  const w=canvas.width=canvas.clientWidth||160, h=canvas.height=canvas.clientHeight||160;
  const ctx=canvas.getContext('2d');
  let s=seed;
  function rnd(){ s = (s*9301+49297)%233280; return s/233280; }
  const g = ctx.createLinearGradient(0,0,w,h);
  g.addColorStop(0, `hsl(${hue},70%,${30+rnd()*20}%)`);
  g.addColorStop(1, `hsl(${(hue+80)%360},60%,${10+rnd()*15}%)`);
  ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
  for(let i=0;i<14;i++){
    ctx.beginPath();
    const r = 6+rnd()*Math.min(w,h)*0.28;
    ctx.arc(rnd()*w, rnd()*h, r, 0, Math.PI*2);
    ctx.fillStyle = `hsla(${(hue+rnd()*90)%360},70%,60%,${0.06+rnd()*0.12})`;
    ctx.fill();
  }
}
registerApp('gallery', {title:'Gallery', glyph:'▧', color:'var(--accent)', w:640, h:480, build(body, id, args){
  const items = fsChildren(PICS).filter(n=>n.type==='image');
  body.innerHTML = `<div class="gal-grid" id="galGrid"></div>`;
  const grid = body.querySelector('#galGrid');
  let focusTile = null;
  items.forEach(item=>{
    const tile=document.createElement('div'); tile.className='gal-tile';
    tile.innerHTML = `<canvas></canvas><div class="cap">${item.name}</div>`;
    grid.appendChild(tile);
    requestAnimationFrame(()=>drawArtToCanvas(tile.querySelector('canvas'), item.seed, item.hue));
    tile.addEventListener('click', ()=>{
      const light=document.createElement('div'); light.className='gal-light';
      light.innerHTML=`<canvas width="640" height="420"></canvas><button>Close</button>`;
      document.body.appendChild(light);
      drawArtToCanvas(light.querySelector('canvas'), item.seed, item.hue);
      light.querySelector('button').addEventListener('click', ()=>light.remove());
      light.addEventListener('click', (e)=>{ if(e.target===light) light.remove(); });
    });
    if(args && args.focusId===item.id) focusTile = tile;
  });
  // Opening from Files/Spotlight with a specific image (args.focusId) should
  // jump straight to it instead of just showing the generic grid.
  if(focusTile){ focusTile.scrollIntoView({block:'center'}); focusTile.click(); }
}});

/* ---- Doomscroll ---- */
const scrollCards = [
  ["FACT","A group of crows is called a murder.","void/facts"],
  ["QUOTE","Simplicity is the ultimate sophistication.","attr. Leonardo (probably)"],
  ["TIP","Ctrl+K opens search from anywhere in VoidOS.","void/tips"],
  ["FACT","Bananas are berries. Strawberries are not.","void/facts"],
  ["QUOTE","Premature optimization is the root of all evil.","attr. Knuth"],
  ["TIP","Right-click the desktop for quick actions.","void/tips"],
  ["FACT","Octopuses have three hearts.","void/facts"],
  ["QUOTE","Talk is cheap. Show me the code.","attr. Torvalds"],
  ["FACT","Honey never spoils if sealed properly.","void/facts"],
  ["TIP","The Store has a few extra apps worth installing.","void/tips"],
];
registerApp('doomscroll', {title:'Doomscroll', glyph:'▥', color:'var(--danger)', w:380, h:600, build(body){
  body.innerHTML = `<div class="ds-feed" id="dsFeed"></div>`;
  const feed = body.querySelector('#dsFeed');
  let n=0;
  function appendBatch(){
    for(let i=0;i<4;i++){
      const c = scrollCards[Math.floor(Math.random()*scrollCards.length)];
      const card=document.createElement('div'); card.className='ds-card';
      card.innerHTML = `<div class="tag">${c[0]}</div><p>${c[1]}</p><div class="src">${c[2]}</div>`;
      feed.appendChild(card); n++;
    }
  }
  appendBatch();
  feed.addEventListener('scroll', ()=>{ if(feed.scrollTop + feed.clientHeight > feed.scrollHeight - 400) appendBatch(); });
}});

/* ---- Guide ---- */
registerApp('guide', {title:'Guide', glyph:'？', color:'var(--green)', w:480, h:600, desktopIcon:false, build(body){
  body.innerHTML = `<div class="pad guide">
    <h3>Window management</h3>
    <ul>
      <li>Drag the title bar to move a window</li>
      <li>Drag a window to a screen edge to snap it (left half, right half, or top edge to maximize)</li>
      <li>Drag the bottom-right corner to resize</li>
      <li>Colored dots: <span class="kb">red</span> close, <span class="kb">yellow</span> minimize, <span class="kb">green</span> maximize</li>
    </ul>
    <h3>Shortcuts</h3>
    <ul>
      <li><span class="kb">Ctrl</span> + <span class="kb">K</span> — open Spotlight search (apps, files, and notes)</li>
      <li><span class="kb">Alt</span> + <span class="kb">Tab</span> — cycle open windows</li>
      <li><span class="kb">Esc</span> — close Spotlight / dialogs</li>
    </ul>
    <h3>Filesystem</h3>
    <ul>
      <li>Files app has a real nested tree: Home/Documents/Projects, Pictures, Music, Downloads, System, Trash</li>
      <li>Drag files onto folders (or the sidebar) to move them; right-click for Rename / Move to Trash</li>
      <li>Trash items can be Restored back to where they came from</li>
      <li>Terminal shares the same filesystem — try <span class="kb">ls</span>, <span class="kb">cd</span>, <span class="kb">tree</span>, <span class="kb">cat</span>, <span class="kb">mkdir</span>, <span class="kb">history</span>, <span class="kb">theme</span>, <span class="kb">crt on|off</span></li>
    </ul>
    <h3>Retro shell</h3>
    <ul>
      <li>Settings → Phosphor theme switches the whole UI between Amber / Green / Blue / Pink / Purple / Mono</li>
      <li>CRT scanlines are on by default — toggle them off in Settings if they're too much</li>
      <li>Settings → Pet type swaps the desktop companion between cat / dog / rabbit, live</li>
      <li>The power button in the top bar shuts the machine down properly — click the black screen to boot back up</li>
      <li>Settings → Live wallpaper: Starfield / Matrix rain / Plasma waves, or a looping muted background video</li>
      <li>Boot up close and read the log — it's a full (fictional) systemd-style startup, not just a spinner</li>
      <li>Settings → Hyprland mode: thin borders, no desktop icons, 5 workspaces (Ctrl+Alt+1-5) and a tiling shortcut (Ctrl+Alt+T)</li>
      <li>Settings → Login &amp; lock PIN: set one and it's required at the sign-in screen and to unlock — clear it and both go back to a single click</li>
      <li>Settings → Live wallpaper now has 7 generated styles (Starfield, Matrix, Plasma, Aurora, Digital rain, Nebula, Grid tunnel) plus two optional YouTube videos</li>
      <li>Windows slide and fade in/out now, minimizing shrinks toward the dock, and switching workspaces in Hyprland mode slides the whole desktop sideways</li>
    </ul>
    <h3>Music</h3>
    <ul>
      <li>Built-in chiptune tracks are synthesized live in the browser — nothing is streamed or downloaded</li>
      <li>Music Player → "Import music from this device" plays your own local audio files, straight from your computer</li>
      <li>Imported tracks only last for that window's session — reload and just re-select them, it takes a few seconds</li>
    </ul>
    <h3>Persistence</h3>
    <ul>
      <li>${hasVStore() ? 'This session can remember your files, notes, settings and more across a reload.' : 'No storage backend detected right now — everything resets on reload, same as v1.'}</li>
      <li>Settings → Forget saved data clears everything VoidOS remembered</li>
    </ul>
    <h3>Store</h3>
    <ul><li>Open the Store from the dock — ${storeCatalog.length} extra apps to install: ${storeCatalog.map(a=>a.name).join(', ')}</li></ul>
    <h3>Secrets</h3>
    <ul>
      <li>There may or may not be a Konami code somewhere on this desktop</li>
      <li>The VoidOS logo in the top bar might do something if you click it enough</li>
      <li>The pet gets the zoomies when simulated CPU load spikes — try clicking it then</li>
    </ul>
  </div>`;
}});

/* ---- Settings ---- */
const wallpapers = [
  {id:'default', label:'Amber Glow', css:"repeating-linear-gradient(0deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 3px), radial-gradient(1300px 900px at 50% 0%, rgba(255,176,0,0.09), transparent 65%), linear-gradient(160deg,#0a0806 0%, #060504 60%, #020202 100%)"},
  {id:'terminal', label:'Green Terminal', css:"repeating-linear-gradient(0deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 3px), radial-gradient(1200px 800px at 20% 10%, rgba(51,255,102,0.10), transparent 60%), linear-gradient(160deg,#04120a 0%, #020a06 70%, #010301 100%)"},
  {id:'deepspace', label:'Deep Space', css:"radial-gradient(2px 2px at 20% 30%, #fff, transparent), radial-gradient(2px 2px at 70% 60%, #fff, transparent), radial-gradient(1px 1px at 40% 80%, #fff, transparent), radial-gradient(1100px 700px at 80% 10%, rgba(162,89,255,0.14), transparent 60%), linear-gradient(160deg,#0a071a 0%, #050310 70%, #020104 100%)"},
  {id:'sunset', label:'Sunset CRT', css:"repeating-linear-gradient(0deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 3px), radial-gradient(1100px 700px at 80% 90%, rgba(255,46,136,0.14), transparent 60%), radial-gradient(900px 700px at 10% 10%, rgba(255,176,0,0.10), transparent 60%), linear-gradient(160deg,#180a10 0%, #0a0508 70%)"},
  {id:'asus-rog-gaming', label:'ASUS ROG Gaming', photo:true, css:"linear-gradient(rgba(4,2,8,0.35),rgba(4,2,8,0.55)), url('wallpapers/asus-rog-gaming-3840x2160-16725.jpg') center 55%/cover no-repeat"},
  {id:'lofi-retro', label:'Lofi Boy Retro', photo:true, css:"linear-gradient(rgba(2,2,4,0.30),rgba(2,2,4,0.50)), url('wallpapers/lofi-boy-5k-retro-3840x2160-15203.jpg') center/cover no-repeat"},
];
/* User-uploaded wallpapers (Settings > Wallpaper > +). The file is used
   immediately via a local object URL, and the raw image is also persisted
   to IndexedDB (same mechanism as imported music, see below) so it survives
   a reload — localStorage's few-MB quota isn't enough for photos, IndexedDB
   comfortably is. */
let customWallpapers = [];
function allWallpapers(){ return wallpapers.concat(customWallpapers); }
function addCustomWallpaper(objectUrl, label, id){
  const wpId = id || ('custom-'+Date.now());
  customWallpapers.push({ id: wpId, label: label||'My wallpaper', photo:true,
    css: "linear-gradient(rgba(2,2,4,0.30),rgba(2,2,4,0.50)), url('"+objectUrl+"') center/cover no-repeat" });
  return wpId;
}
const themePresets = [
  {id:'default', label:'AMBER'}, {id:'green', label:'GREEN'}, {id:'blue', label:'BLUE'},
  {id:'pink', label:'PINK'}, {id:'purple', label:'PURPLE'}, {id:'white', label:'MONO'},
];
const petTypeOptions = [ {id:'cat', label:'Cat', emoji:petEmojis.cat}, {id:'dog', label:'Dog', emoji:petEmojis.dog}, {id:'rabbit', label:'Rabbit', emoji:petEmojis.rabbit} ];

/* Central settings object — hydrated from storage in hydrateAll(), applied immediately, persisted on every change. */
let voidSettings = { theme:'default', wallpaper: 'lofi-retro', pet: true, petType:'cat', crt: true, trail: false, autoLock: false, liveWallpaper: 'off', screensaver: true, hyprMode: false, pin: '', restoreSession: false, sounds: true };
function applyTheme(id){
  const t = themePresets.find(x=>x.id===id) || themePresets[0];
  if(t.id==='default') delete document.body.dataset.theme; else document.body.dataset.theme = t.id;
  voidSettings.theme = t.id;
}
function applyWallpaper(id){
  const wp = allWallpapers().find(w=>w.id===id) || wallpapers[0];
  const desktopEl = document.getElementById('desktop');
  const photoEl = document.getElementById('wallpaper-photo');
  if(wp.photo){
    // Photo lives on its own layer (see #wallpaper-photo in style.css) so the
    // parallax effect only ever animates a transform, never repaints #desktop.
    photoEl.style.background = wp.css;
    desktopEl.style.background = '#050505';
  } else {
    photoEl.style.background = '';
    desktopEl.style.background = wp.css;
    desktopEl.style.backgroundSize = '';
  }
  document.body.classList.toggle('photo-wallpaper', !!wp.photo);
  voidSettings.wallpaper = wp.id;
  // The live-wallpaper canvas (Starfield/Matrix/etc.) paints an opaque layer
  // every frame, so it would otherwise completely hide a photo wallpaper
  // underneath it. Auto-switch it off when a photo wallpaper is chosen.
  if(wp.photo && voidSettings.liveWallpaper !== 'off'){
    applyLiveWallpaper('off');
    const lwSel = document.getElementById('liveWpSelect');
    if(lwSel) lwSel.value = 'off';
  }
}
/* Subtle parallax drift for photo wallpapers — the wallpaper layer nudges
   opposite the cursor and eases back to center. GPU-only (transform), and
   the animation loop stops itself once the position has settled instead of
   running forever, so it costs ~nothing while the mouse is still. */
(function(){
  const photoEl = document.getElementById('wallpaper-photo');
  let raf = null, targetX = 0, targetY = 0, curX = 0, curY = 0;
  function tick(){
    curX += (targetX - curX) * 0.06;
    curY += (targetY - curY) * 0.06;
    photoEl.style.transform = 'translate3d('+curX.toFixed(2)+'px,'+curY.toFixed(2)+'px,0)';
    if(Math.abs(targetX-curX) > 0.05 || Math.abs(targetY-curY) > 0.05){
      raf = requestAnimationFrame(tick);
    } else {
      raf = null; // settled — don't keep scheduling frames for nothing
    }
  }
  function ensureLoop(){ if(raf===null) raf = requestAnimationFrame(tick); }
  window.addEventListener('mousemove', (e)=>{
    if(!document.body.classList.contains('photo-wallpaper')) return;
    const nx = (e.clientX / window.innerWidth) - 0.5;
    const ny = (e.clientY / window.innerHeight) - 0.5;
    // Small max travel (±18px) so it reads as depth, not a slideshow.
    targetX = -nx * 36;
    targetY = -ny * 36;
    ensureLoop();
  });
  window.addEventListener('mouseleave', ()=>{ targetX = 0; targetY = 0; ensureLoop(); });
})();
function applyPetVisible(on){ voidSettings.pet = on; document.getElementById('pet').style.display = on ? '' : 'none'; }
function applyCRT(on){ voidSettings.crt = on; document.body.classList.toggle('crt-on', on); }
function applyTrail(on){ voidSettings.trail = on; document.body.classList.toggle('trail-on', on); }
function applyAutoLock(on){ voidSettings.autoLock = on; armIdleLock(); }
function applyLiveWallpaper(mode){ voidSettings.liveWallpaper = mode; if(window.setLiveWallpaper) setLiveWallpaper(mode); }
function applyScreensaver(on){ voidSettings.screensaver = on; if(window.armScreensaver) armScreensaver(); }
function applyHyprMode(on){
  voidSettings.hyprMode = on;
  document.body.classList.toggle('hypr-mode', on);
  if(on){ currentWorkspace = 1; document.querySelectorAll('.win').forEach(el=>{ if(!el.dataset.workspace) el.dataset.workspace='1'; }); applyWorkspaceVisibility(); }
  else { document.querySelectorAll('.win').forEach(el=>{ if(el.style.display==='none'){ const w=[...openWins.values()].find(x=>x.el===el); if(w && w.minimized) return; } el.style.display=''; }); }
  renderHyprBar();
}
function persistSettings(){ vSave('voidos:settings', voidSettings); }
// Sync the visible DOM with the in-code defaults immediately (hydrateAll() will
// re-apply these later if a saved session is found, but the CRT overlay etc.
// should already be correct before that async load even starts).
applyCRT(voidSettings.crt);
applyTheme(voidSettings.theme);
applyWallpaper(voidSettings.wallpaper);
setTimeout(()=>applyLiveWallpaper(voidSettings.liveWallpaper), 0);

let idleTimer=null;
function armIdleLock(){
  clearTimeout(idleTimer);
  if(!voidSettings.autoLock) return;
  idleTimer = setTimeout(()=>{
    if(lockEl.style.display!=='flex'){ lockEl.style.display='flex'; lockEl.classList.remove('hidden'); tickLock(); }
  }, 5*60*1000);
}

/* ---- Screensaver: kicks in after a stretch of inactivity, dismissed by any input ---- */
(function(){
  const ssEl = document.getElementById('screensaver');
  const ssCanvas = document.getElementById('ssCanvas');
  const ssClock = document.getElementById('ssClock');
  const sctx = ssCanvas.getContext('2d');
  let ssStars = [], ssRaf = null, ssClockTimer = null, ssTimer = null, ssActive = false;
  function ssSize(){ ssCanvas.width = window.innerWidth; ssCanvas.height = window.innerHeight; }
  function ssInitStars(){ ssStars = Array.from({length:140}, () => ({ x:(Math.random()-0.5)*ssCanvas.width, y:(Math.random()-0.5)*ssCanvas.height, z:Math.random()*ssCanvas.width })); }
  function ssFrame(){
    sctx.fillStyle='#000'; sctx.fillRect(0,0,ssCanvas.width,ssCanvas.height);
    const cx=ssCanvas.width/2, cy=ssCanvas.height/2;
    sctx.fillStyle = cssVar('--accent');
    ssStars.forEach(s=>{
      s.z -= 5;
      if(s.z<=0){ s.x=(Math.random()-0.5)*ssCanvas.width; s.y=(Math.random()-0.5)*ssCanvas.height; s.z=ssCanvas.width; }
      const k = 128/s.z;
      const px = s.x*k+cx, py = s.y*k+cy;
      if(px<0||px>ssCanvas.width||py<0||py>ssCanvas.height) return;
      sctx.globalAlpha = 1-s.z/ssCanvas.width;
      sctx.beginPath(); sctx.arc(px,py,Math.max(0.5,(1-s.z/ssCanvas.width)*2.6),0,Math.PI*2); sctx.fill();
    });
    sctx.globalAlpha=1;
    ssRaf = requestAnimationFrame(ssFrame);
  }
  function ssMoveClock(){
    const pad=80;
    ssClock.style.top = (pad+Math.random()*(window.innerHeight-pad*2))+'px';
    ssClock.style.left = (pad+Math.random()*(window.innerWidth-pad*2-160))+'px';
    ssClock.textContent = new Date().toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'});
  }
  function showScreensaver(){
    if(ssActive) return;
    ssActive = true;
    ssEl.style.display='block'; ssSize(); ssInitStars();
    cancelAnimationFrame(ssRaf); ssRaf = requestAnimationFrame(ssFrame);
    ssMoveClock(); clearInterval(ssClockTimer); ssClockTimer = setInterval(ssMoveClock, 8000);
    unlockAchievement('screensaver');
  }
  function hideScreensaver(){
    if(!ssActive) return;
    ssActive = false;
    ssEl.style.display='none'; cancelAnimationFrame(ssRaf); clearInterval(ssClockTimer);
  }
  function armScreensaver(){
    clearTimeout(ssTimer);
    if(ssActive){ hideScreensaver(); }
    if(!voidSettings.screensaver) return;
    ssTimer = setTimeout(showScreensaver, 90*1000);
  }
  window.addEventListener('resize', ()=>{ if(ssActive) ssSize(); });
  ['mousemove','keydown','mousedown','touchstart','wheel'].forEach(evt=>window.addEventListener(evt, armScreensaver, {passive:true}));
  window.armScreensaver = armScreensaver;
})();
armScreensaver();
['mousemove','keydown','mousedown','touchstart','wheel'].forEach(evt=>window.addEventListener(evt, armIdleLock, {passive:true}));

registerApp('settings', {title:'Settings', glyph:'⚙', color:'var(--muted)', w:460, h:660, desktopIcon:true, build(body){
  body.innerHTML = `<div class="pad">
    <div class="settings-row"><div><div class="lbl">Phosphor theme</div><div class="desc">Recolors the whole CRT interface</div></div><div style="display:flex; gap:6px; flex-wrap:wrap;" id="themeRow"></div></div>
    <div class="settings-row"><div><div class="lbl">Wallpaper</div><div class="desc">Desktop background — click + to add your own photo</div></div><div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;" id="wallRow"></div></div>
    <div class="settings-row"><div><div class="lbl">Desktop pet</div><div class="desc">Show the wandering companion</div></div><div class="toggle" id="petToggle"><div class="knob"></div></div></div>
    <div class="settings-row"><div><div class="lbl">Pet type</div><div class="desc">What the desktop pet looks like</div></div>
      <select id="petTypeSelect" style="background:rgba(255,255,255,0.06); border:1px solid var(--line); color:var(--text); border-radius:var(--radius-sm); padding:6px 10px; font-family:var(--mono); font-size:14px;">
        ${petTypeOptions.map(p=>`<option value="${p.id}">${p.emoji} ${p.label}</option>`).join('')}
      </select></div>
    <div class="settings-row"><div><div class="lbl">CRT scanlines</div><div class="desc">Scanlines, vignette, flicker &amp; noise overlay</div></div><div class="toggle" id="crtToggle"><div class="knob"></div></div></div>
    <div class="settings-row"><div><div class="lbl">System sounds</div><div class="desc">Synthesized retro blips for window open/close and achievements</div></div><div class="toggle" id="soundsToggle"><div class="knob"></div></div></div>
    <div class="settings-row"><div><div class="lbl">Cursor trail</div><div class="desc">A faint phosphor trail follows your pointer</div></div><div class="toggle" id="trailToggle"><div class="knob"></div></div></div>
    <div class="settings-row"><div><div class="lbl">Auto-lock</div><div class="desc">Lock the screen after 5 minutes idle</div></div><div class="toggle" id="lockToggle"><div class="knob"></div></div></div>
    <div class="settings-row"><div><div class="lbl">Screensaver</div><div class="desc">Starfield + drifting clock after 90s idle</div></div><div class="toggle" id="ssToggle"><div class="knob"></div></div></div>
    <div class="settings-row"><div><div class="lbl">Hyprland mode</div><div class="desc">Thin borders, gaps, workspaces (Ctrl+Alt+1-5) &amp; tiling (Ctrl+Alt+T)</div></div><div class="toggle" id="hyprToggle"><div class="knob"></div></div></div>
    <div class="settings-row"><div><div class="lbl">Restore session on reload</div><div class="desc">${hasVStore() ? 'Reopens whichever apps were running last time' : 'Needs browser storage, which is not available this session'}</div></div><div class="toggle" id="restoreToggle"><div class="knob"></div></div></div>
    <div class="settings-row"><div><div class="lbl">Live wallpaper</div><div class="desc">All non-video modes are generated live on canvas — no images downloaded. Video options embed YouTube (muted) and depend on your browser/network allowing it — some sandboxed previews block it.</div></div>
      <select id="liveWpSelect" style="background:rgba(255,255,255,0.06); border:1px solid var(--line); color:var(--text); border-radius:var(--radius-sm); padding:6px 10px; font-family:var(--mono); font-size:14px;">
        <option value="off">Off</option>
        <option value="starfield">Starfield</option>
        <option value="matrix">Matrix rain</option>
        <option value="plasma">Plasma waves</option>
        <option value="aurora">Aurora</option>
        <option value="rain">Digital rain</option>
        <option value="nebula">Nebula</option>
        <option value="gridtunnel">Grid tunnel</option>
        <option value="video1">Video: Background 1 (needs YouTube access)</option>
        <option value="video2">Video: Background 2 (needs YouTube access)</option>
      </select></div>
    <div class="settings-row"><div><div class="lbl">Login &amp; lock PIN</div><div class="desc">${voidSettings.pin?'A PIN is set — required at the login screen and to unlock.':'No PIN set — sign-in and unlock are just a click.'} Not real security, just a personal touch.</div></div>
      <div style="display:flex; gap:6px;">
        <input type="password" id="pinInput" placeholder="new PIN" inputmode="numeric" style="width:90px; background:#0a0d13; border:1px solid var(--line); color:var(--text); border-radius:var(--radius-sm); padding:6px 9px; font-family:var(--mono); font-size:13px;">
        <button id="pinSaveBtn" style="background:var(--accent); color:#04231d; border:none; border-radius:var(--radius-sm); padding:6px 10px; cursor:pointer; font-weight:700; font-family:var(--pixel); font-size:10px;">Set</button>
        <button id="pinClearBtn" ${voidSettings.pin?'':'disabled'} style="background:rgba(255,255,255,0.08); border:1px solid var(--line); color:var(--text); border-radius:var(--radius-sm); padding:6px 10px; cursor:pointer; font-weight:700; font-family:var(--pixel); font-size:10px;">Clear</button>
      </div></div>
    <div class="settings-row"><div><div class="lbl">Reset session</div><div class="desc">Close all windows and empty Trash</div></div>
      <button id="resetBtn" style="background:var(--danger); border:none; color:#2a0a0a; border-radius:var(--radius-sm); padding:6px 12px; cursor:pointer; font-weight:700; font-family:var(--pixel); font-size:10px;">Reset</button></div>
    <div class="settings-row"><div><div class="lbl">Backup your data</div><div class="desc">Download notes, files, kanban, mail and more as one JSON file</div></div>
      <button id="exportBtn" ${hasVStore()?'':'disabled'} style="background:var(--accent); border:none; color:#04231d; border-radius:var(--radius-sm); padding:6px 12px; cursor:pointer; font-weight:700; font-family:var(--pixel); font-size:10px;">Export</button></div>
    <div class="settings-row"><div><div class="lbl">Restore from backup</div><div class="desc">Load a previously exported VoidOS backup file</div></div>
      <input type="file" id="importInput" accept="application/json" style="display:none;">
      <button id="importBtn" ${hasVStore()?'':'disabled'} style="background:rgba(255,255,255,0.08); border:1px solid var(--line); color:var(--text); border-radius:var(--radius-sm); padding:6px 12px; cursor:pointer; font-weight:700; font-family:var(--pixel); font-size:10px;">Import</button></div>
    <div class="settings-row"><div><div class="lbl">Forget saved data</div><div class="desc">${hasVStore() ? 'Wipes everything VoidOS remembered on this device' : 'Persistence is off this session — nothing saved yet'}</div></div>
      <button id="forgetBtn" ${hasVStore()?'':'disabled'} style="background:rgba(255,255,255,0.08); border:1px solid var(--line); color:var(--text); border-radius:var(--radius-sm); padding:6px 12px; cursor:pointer; font-weight:700; font-family:var(--pixel); font-size:10px;">Forget</button></div>
  </div>`;
  const themeRow = body.querySelector('#themeRow');
  const themeColors = {default:'#ffb000', green:'#33ff66', blue:'#33ccff', pink:'#ff2e88', purple:'#a259ff', white:'#f2f6ff'};
  themePresets.forEach(t=>{
    const s=document.createElement('div'); s.className='theme-swatch'+(voidSettings.theme===t.id?' active':'');
    s.style.color = themeColors[t.id]; s.style.background='rgba(255,255,255,0.04)'; s.title=t.label;
    s.textContent = t.label[0];
    s.addEventListener('click', ()=>{ applyTheme(t.id); persistSettings(); themeRow.querySelectorAll('.theme-swatch').forEach(x=>x.classList.remove('active')); s.classList.add('active'); });
    themeRow.appendChild(s);
  });
  const wallRow = body.querySelector('#wallRow');
  function renderWallThumbs(){
    wallRow.innerHTML = '';
    allWallpapers().forEach(wp=>{
      const cell=document.createElement('div'); cell.className='wallcell';
      const t=document.createElement('div'); t.className='wallthumb'+(voidSettings.wallpaper===wp.id?' active':''); t.style.background=wp.css; t.title=wp.label;
      const cap=document.createElement('div'); cap.className='wallcap'; cap.textContent=wp.label;
      function pick(){ applyWallpaper(wp.id); persistSettings(); wallRow.querySelectorAll('.wallthumb').forEach(x=>x.classList.remove('active')); t.classList.add('active'); }
      t.addEventListener('click', pick); cap.addEventListener('click', pick);
      cell.appendChild(t); cell.appendChild(cap);
      wallRow.appendChild(cell);
    });
    const addCell=document.createElement('div'); addCell.className='wallcell';
    const addBtn = document.createElement('label');
    addBtn.className = 'wallthumb wallthumb-add';
    addBtn.title = 'Upload a wallpaper';
    addBtn.textContent = '+';
    const fileInput = document.createElement('input');
    fileInput.type = 'file'; fileInput.accept = 'image/*'; fileInput.style.display = 'none';
    fileInput.addEventListener('change', ()=>{
      const file = fileInput.files && fileInput.files[0];
      if(!file) return;
      if(file.size > 4*1024*1024){ toast('Image too large — pick something under 4MB.'); return; }
      const label = file.name.replace(/\.[a-zA-Z0-9]+$/,'');
      const objUrl = URL.createObjectURL(file);
      const newId = addCustomWallpaper(objUrl, label);
      renderWallThumbs();
      applyWallpaper(newId); persistSettings();
      toast('Wallpaper added.');
      wallDBSave({id:newId, label, blob:file}).catch(()=>{});
    });
    addBtn.appendChild(fileInput);
    const addCap=document.createElement('div'); addCap.className='wallcap'; addCap.textContent='Add new';
    addCell.appendChild(addBtn); addCell.appendChild(addCap);
    wallRow.appendChild(addCell);
  }
  renderWallThumbs();
  body.querySelector('#petTypeSelect').value = petType;
  body.querySelector('#petTypeSelect').addEventListener('change', (e)=>{ applyPetType(e.target.value); persistSettings(); });
  body.querySelector('#liveWpSelect').value = voidSettings.liveWallpaper;
  body.querySelector('#liveWpSelect').addEventListener('change', (e)=>{ applyLiveWallpaper(e.target.value); persistSettings(); });
  function wireToggle(sel, get, set){
    const el = body.querySelector(sel);
    el.setAttribute('role','switch'); el.setAttribute('tabindex','0');
    el.setAttribute('aria-checked', String(get()));
    el.classList.toggle('on', get());
    const flip = ()=>{ const v=!get(); set(v); el.classList.toggle('on', v); el.setAttribute('aria-checked', String(v)); persistSettings(); };
    el.addEventListener('click', flip);
    el.addEventListener('keydown', (e)=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); flip(); } });
  }
  wireToggle('#petToggle', ()=>voidSettings.pet, applyPetVisible);
  wireToggle('#crtToggle', ()=>voidSettings.crt, applyCRT);
  wireToggle('#soundsToggle', ()=>voidSettings.sounds, (on)=>{ voidSettings.sounds=on; if(on) sfx('open'); });
  wireToggle('#trailToggle', ()=>voidSettings.trail, applyTrail);
  wireToggle('#lockToggle', ()=>voidSettings.autoLock, applyAutoLock);
  wireToggle('#ssToggle', ()=>voidSettings.screensaver, applyScreensaver);
  wireToggle('#hyprToggle', ()=>voidSettings.hyprMode, applyHyprMode);
  wireToggle('#restoreToggle', ()=>voidSettings.restoreSession, (on)=>{ voidSettings.restoreSession=on; });
  function refreshPinRow(){
    const desc = body.querySelector('#pinSaveBtn').closest('.settings-row').querySelector('.desc');
    desc.textContent = (voidSettings.pin?'A PIN is set — required at the login screen and to unlock.':'No PIN set — sign-in and unlock are just a click.') + ' Not real security, just a personal touch.';
    const clearBtn = body.querySelector('#pinClearBtn');
    if(clearBtn) clearBtn.disabled = !voidSettings.pin;
    body.querySelector('#pinInput').value='';
  }
  body.querySelector('#pinSaveBtn').addEventListener('click', ()=>{
    const v = body.querySelector('#pinInput').value.trim();
    if(!v){ toast('Type a PIN first'); return; }
    voidSettings.pin = v; persistSettings();
    toast('PIN set'); refreshPinRow();
  });
  const pinClearBtn = body.querySelector('#pinClearBtn');
  if(pinClearBtn) pinClearBtn.addEventListener('click', ()=>{
    voidSettings.pin=''; persistSettings(); toast('PIN cleared'); refreshPinRow();
  });
  body.querySelector('#resetBtn').addEventListener('click', ()=>{
    [...openWins.keys()].forEach(closeWin);
    FS[TRASH].children.slice().forEach(fsDeletePermanent);
    persistFS();
    toast('Session reset');
  });
  const forgetBtn = body.querySelector('#forgetBtn');
  if(forgetBtn) forgetBtn.addEventListener('click', ()=>{
    BACKUP_KEYS.forEach(k=>{ try{ localStorage.removeItem(k); }catch(e){} });
    if(hasIDB()){
      try{ indexedDB.deleteDatabase(MUSIC_DB_NAME); }catch(e){}
      try{ indexedDB.deleteDatabase(WALL_DB_NAME); }catch(e){}
    }
    toast('Forgotten — reload for a clean slate', 'success');
  });
  const exportBtn = body.querySelector('#exportBtn');
  if(exportBtn) exportBtn.addEventListener('click', exportBackup);
  const importBtn = body.querySelector('#importBtn'), importInput = body.querySelector('#importInput');
  if(importBtn) importBtn.addEventListener('click', ()=>importInput.click());
  if(importInput) importInput.addEventListener('change', (e)=>{
    const f = e.target.files[0]; if(f) importBackupFile(f);
    e.target.value='';
  });
}});

/* ---- About ---- */
registerApp('about', {title:'About VoidOS', glyph:'◈', color:'var(--accent)', w:400, h:560, desktopIcon:false, dock:false, build(body){
  body.innerHTML = `<div class="about-hero"><div class="glyph">◈</div><h2>VOIDOS RETRO</h2>
    <p>A window manager with edge-snapping, a nested virtual filesystem with drag-and-drop, a terminal, an app store, ${Object.keys(APPS).length}+ apps, a CRT phosphor shell, and a persistence layer — all running client-side in this browser tab. No server, no accounts.</p></div>
    <div class="kv"><span>Version</span><span>2.7 "Phosphor"</span></div>
    <div class="kv"><span>Engine</span><span>vanilla JS, no framework</span></div>
    <div class="kv"><span>Theme</span><span>${(themePresets.find(t=>t.id===voidSettings.theme)||themePresets[0]).label} phosphor${voidSettings.crt?' + CRT':''}</span></div>
    <div class="kv"><span>Filesystem</span><span>node-based, nested, drag-and-drop</span></div>
    <div class="kv"><span>Window manager</span><span>floating, edge-snap (drag to a screen edge)</span></div>
    <div class="kv"><span>Storage</span><span>${hasVStore()?'persistent (browser storage detected)':'session-only (no storage backend this session)'}</span></div>
    <div class="kv"><span>Apps installed</span><span>${installed.size} / ${storeCatalog.length} from the Store</span></div>
    <div class="kv"><span>Achievements</span><span>${unlockedAchievements.size} / ${achievementDefs.length} found</span></div>
    <div style="padding:10px 18px 16px; font-size:13px; color:var(--muted); line-height:1.6; font-family:var(--mono);">Try: Ctrl+K to search, Alt+Tab to switch windows, dragging a window to a screen edge, the power button up top, and the Konami code. Retro shell inspired by mateszko090214/WebOS.</div>`;
}});

/* ---- Snake (installable) ---- */
registerApp('snake', {title:'Snake', glyph:'▓', color:'var(--green)', w:380, h:460, installedShortcut:true, hiddenUntilInstalled:true, build(body){
  body.innerHTML = `<div class="snake-wrap"><div class="snake-score">Score: <span id="snScore">0</span></div><canvas id="snCanvas" width="300" height="300"></canvas><div style="color:var(--muted);font-size:11px;font-family:var(--mono)">arrow keys to move</div></div>`;
  const canvas = body.querySelector('#snCanvas'); const ctx = canvas.getContext('2d');
  const size=15, cells=20; let snake=[{x:10,y:10}], dir={x:1,y:0}, nextDir=dir, food={x:5,y:5}, score=0, alive=true, tick=null;
  function placeFood(){ food={x:Math.floor(Math.random()*cells), y:Math.floor(Math.random()*cells)}; }
  function draw(){
    ctx.fillStyle='#000'; ctx.fillRect(0,0,300,300);
    ctx.fillStyle=cssVar('--accent'); ctx.fillRect(food.x*size, food.y*size, size-1, size-1);
    ctx.fillStyle='#33ff66';
    snake.forEach((s,i)=>{ ctx.globalAlpha = i===0?1:0.7; ctx.fillRect(s.x*size, s.y*size, size-1, size-1); });
    ctx.globalAlpha=1;
    if(!alive){ ctx.fillStyle='rgba(0,0,0,0.6)'; ctx.fillRect(0,0,300,300); ctx.fillStyle='#fff'; ctx.font='16px monospace'; ctx.textAlign='center'; ctx.fillText('Game over — press R', 150, 150); }
  }
  function step(){
    if(!alive) return;
    dir=nextDir;
    const head={x:snake[0].x+dir.x, y:snake[0].y+dir.y};
    if(head.x<0||head.y<0||head.x>=cells||head.y>=cells||snake.some(s=>s.x===head.x&&s.y===head.y)){ alive=false; draw(); return; }
    snake.unshift(head);
    if(head.x===food.x && head.y===food.y){ score++; body.querySelector('#snScore').textContent=score; placeFood(); }
    else snake.pop();
    draw();
  }
  function keyHandler(e){
    if(e.key==='ArrowUp' && dir.y===0) nextDir={x:0,y:-1};
    else if(e.key==='ArrowDown' && dir.y===0) nextDir={x:0,y:1};
    else if(e.key==='ArrowLeft' && dir.x===0) nextDir={x:-1,y:0};
    else if(e.key==='ArrowRight' && dir.x===0) nextDir={x:1,y:0};
    else if(e.key==='r' || e.key==='R'){ snake=[{x:10,y:10}]; dir={x:1,y:0}; nextDir=dir; score=0; body.querySelector('#snScore').textContent=0; alive=true; placeFood(); }
  }
  window.addEventListener('keydown', keyHandler);
  placeFood(); draw();
  tick = setInterval(step, 140);
  return { onClose(){ clearInterval(tick); window.removeEventListener('keydown', keyHandler); } };
}});

/* ---- Weather (installable) ---- */
const wxData = {
  'Budapest': {temp:19, cond:'Partly cloudy', icon:'⛅'}, 'Tokyo': {temp:27, cond:'Humid, clear', icon:'🌤️'},
  'Reykjavik': {temp:9, cond:'Windy', icon:'🌬️'}, 'Cairo': {temp:36, cond:'Sunny', icon:'☀️'}, 'Vancouver': {temp:17, cond:'Light rain', icon:'🌦️'},
};
registerApp('weather', {title:'Weather', glyph:'☁', color:'var(--blue)', w:340, h:420, installedShortcut:true, hiddenUntilInstalled:true, build(body){
  body.innerHTML = `<div class="wx">
    <select id="wxCity">${Object.keys(wxData).map(c=>`<option value="${c}">${c}</option>`).join('')}</select>
    <div class="wx-icon" id="wxIcon">⛅</div>
    <div class="temp" id="wxTemp">--°</div><div class="cond" id="wxCond">—</div><div class="city" id="wxCityLbl">—</div>
    <div class="wx-meta"><span>H: <b id="wxHigh">--°</b></span><span>L: <b id="wxLow">--°</b></span></div>
  </div>`;
  function render(city){
    const d=wxData[city];
    body.querySelector('#wxIcon').textContent=d.icon;
    body.querySelector('#wxTemp').textContent=d.temp+'°';
    body.querySelector('#wxCond').textContent=d.cond;
    body.querySelector('#wxCityLbl').textContent=city;
    body.querySelector('#wxHigh').textContent=(d.temp+3)+'°';
    body.querySelector('#wxLow').textContent=(d.temp-4)+'°';
  }
  body.querySelector('#wxCity').addEventListener('change', e=>render(e.target.value));
  render('Budapest');
}});

/* ---- Focus Timer (installable) ---- */
registerApp('timer', {title:'Focus Timer', glyph:'◷', color:'var(--amber)', w:320, h:420, installedShortcut:true, hiddenUntilInstalled:true, build(body){
  let total=25*60, remaining=total, running=false, interval=null;
  body.innerHTML = `<div class="timer-shell">
    <div class="timer-ring"><canvas id="tCanvas" width="180" height="180"></canvas><div class="tt" id="tText">25:00</div></div>
    <div class="timer-controls"><button id="tStart" class="primary">Start</button><button id="tReset">Reset</button></div>
  </div>`;
  const canvas = body.querySelector('#tCanvas'); const ctx = canvas.getContext('2d');
  function draw(){
    ctx.clearRect(0,0,180,180);
    ctx.beginPath(); ctx.arc(90,90,78,0,Math.PI*2); ctx.strokeStyle='rgba(255,255,255,0.08)'; ctx.lineWidth=10; ctx.stroke();
    const frac = remaining/total;
    ctx.beginPath(); ctx.arc(90,90,78,-Math.PI/2, -Math.PI/2 + frac*Math.PI*2); ctx.strokeStyle=cssVar('--accent'); ctx.lineWidth=10; ctx.lineCap='round'; ctx.stroke();
    const m=Math.floor(remaining/60), s=remaining%60;
    body.querySelector('#tText').textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }
  body.querySelector('#tStart').addEventListener('click', (e)=>{
    running=!running; e.target.textContent = running?'Pause':'Start';
    if(running){ interval=setInterval(()=>{ remaining=Math.max(0,remaining-1); draw(); if(remaining===0){ clearInterval(interval); running=false; toast('Focus session complete'); } }, 1000); }
    else clearInterval(interval);
  });
  body.querySelector('#tReset').addEventListener('click', ()=>{ clearInterval(interval); running=false; remaining=total; body.querySelector('#tStart').textContent='Start'; draw(); });
  draw();
  return { onClose(){ clearInterval(interval); } };
}});

/* ---- Kanban (installable) ---- */
let kanbanData = { todo:['Try CachyOS in a VM','Ship Mail app'], doing:['Wire up Achievements'], done:['Ship Terminal app','Window snapping','Drag-and-drop between folders'] };
const persistKanban = debouncedSave('voidos:kanban', ()=>kanbanData);
registerApp('kanban', {title:'Kanban Board', glyph:'▦', color:'var(--violet)', w:520, h:420, installedShortcut:true, hiddenUntilInstalled:true, build(body){
  body.innerHTML = `<div class="kanban">
    ${['todo','doing','done'].map(col=>`<div class="kcol" data-col="${col}"><h5>${col}</h5><div class="kcards"></div><button class="kadd">+ add card</button></div>`).join('')}
  </div>`;
  function render(){
    body.querySelectorAll('.kcol').forEach(colEl=>{
      const col = colEl.dataset.col; const wrap = colEl.querySelector('.kcards'); wrap.innerHTML='';
      kanbanData[col].forEach((text,i)=>{
        const c=document.createElement('div'); c.className='kcard'; c.textContent=text; c.draggable=true;
        c.addEventListener('dragstart', e=>{ e.dataTransfer.setData('text/plain', JSON.stringify({col,i})); });
        c.addEventListener('dblclick', ()=>{ kanbanData[col].splice(i,1); render(); persistKanban(); });
        wrap.appendChild(c);
      });
    });
  }
  body.querySelectorAll('.kcol').forEach(colEl=>{
    colEl.addEventListener('dragover', e=>e.preventDefault());
    colEl.addEventListener('drop', e=>{
      e.preventDefault();
      const {col,i} = JSON.parse(e.dataTransfer.getData('text/plain'));
      const [item] = kanbanData[col].splice(i,1);
      kanbanData[colEl.dataset.col].push(item);
      render(); persistKanban();
    });
    colEl.querySelector('.kadd').addEventListener('click', ()=>{ kanbanData[colEl.dataset.col].push('New task'); render(); persistKanban(); });
  });
  render();
}});

/* ---- Color Lab (installable) ---- */
registerApp('colorlab', {title:'Color Lab', glyph:'◐', color:'linear-gradient(135deg,#5eead4,#0d9488)', w:460, h:380, installedShortcut:true, hiddenUntilInstalled:true, build(body){
  body.innerHTML = `<div class="cl-shell">
    <div class="cl-top">
      <input type="color" id="clBase" value="#ffb000"/>
      <select id="clMode">
        <option value="analogous">Analogous</option>
        <option value="complementary">Complementary</option>
        <option value="triadic">Triadic</option>
        <option value="mono">Monochrome</option>
      </select>
      <button id="clRandom">Randomize</button>
    </div>
    <div class="cl-swatches" id="clSw"></div>
    <div style="font-size:11px;color:var(--muted);font-family:var(--mono);">Click a swatch to copy its hex code.</div>
  </div>`;
  function hexToHsl(hex){
    const r=parseInt(hex.slice(1,3),16)/255, g=parseInt(hex.slice(3,5),16)/255, b=parseInt(hex.slice(5,7),16)/255;
    const max=Math.max(r,g,b), min=Math.min(r,g,b); let h=0,s=0,l=(max+min)/2;
    if(max!==min){
      const d=max-min; s = l>0.5 ? d/(2-max-min) : d/(max+min);
      if(max===r) h=(g-b)/d+(g<b?6:0); else if(max===g) h=(b-r)/d+2; else h=(r-g)/d+4;
      h/=6;
    }
    return [h*360, s*100, l*100];
  }
  function hslToHex(h,s,l){
    h=((h%360)+360)%360; s=Math.max(0,Math.min(100,s))/100; l=Math.max(0,Math.min(100,l))/100;
    const c=(1-Math.abs(2*l-1))*s, x=c*(1-Math.abs((h/60)%2-1)), m=l-c/2;
    let r=0,g=0,b=0;
    if(h<60){r=c;g=x;b=0;} else if(h<120){r=x;g=c;b=0;} else if(h<180){r=0;g=c;b=x;}
    else if(h<240){r=0;g=x;b=c;} else if(h<300){r=x;g=0;b=c;} else {r=c;g=0;b=x;}
    const toHex=v=>Math.round((v+m)*255).toString(16).padStart(2,'0');
    return '#'+toHex(r)+toHex(g)+toHex(b);
  }
  function palette(hex, mode){
    const [h,s,l] = hexToHsl(hex);
    if(mode==='complementary') return [hex, hslToHex(h+180,s,l), hslToHex(h,s,Math.min(90,l+20)), hslToHex(h+180,s,Math.min(90,l+20)), hslToHex(h,s,Math.max(10,l-20))];
    if(mode==='triadic') return [hex, hslToHex(h+120,s,l), hslToHex(h+240,s,l), hslToHex(h,s,Math.min(90,l+18)), hslToHex(h,s,Math.max(10,l-18))];
    if(mode==='mono') return [-20,-10,0,10,20].map(dl=>hslToHex(h,s,l+dl));
    return [-30,-15,0,15,30].map(dh=>hslToHex(h+dh,s,l));
  }
  const swEl = body.querySelector('#clSw');
  function render(){
    const hex = body.querySelector('#clBase').value;
    const mode = body.querySelector('#clMode').value;
    swEl.innerHTML='';
    palette(hex, mode).forEach(c=>{
      const d=document.createElement('div'); d.className='cl-sw'; d.style.background=c;
      d.innerHTML = `<span class="hex">${c}</span>`;
      d.addEventListener('click', ()=>{
        try{ navigator.clipboard && navigator.clipboard.writeText(c); }catch(e){}
        toast('Copied '+c);
      });
      swEl.appendChild(d);
    });
  }
  body.querySelector('#clBase').addEventListener('input', render);
  body.querySelector('#clMode').addEventListener('change', render);
  body.querySelector('#clRandom').addEventListener('click', ()=>{
    const rc = '#'+Math.floor(Math.random()*0xffffff).toString(16).padStart(6,'0');
    body.querySelector('#clBase').value = rc; render();
  });
  render();
}});

/* ---- Sudoku (installable) — two hand-picked solved grids, blanked at load time ---- */
function pickBlanks(count, seed){
  let s=seed;
  function rnd(){ s=(s*9301+49297)%233280; return s/233280; }
  const idx=[...Array(81).keys()];
  for(let i=idx.length-1;i>0;i--){ const j=Math.floor(rnd()*(i+1)); [idx[i],idx[j]]=[idx[j],idx[i]]; }
  return new Set(idx.slice(0,count));
}
const sudokuPuzzles = [
  {label:'Easy', blankCount:30, seed:7,
    solution:[5,3,4,6,7,8,9,1,2, 6,7,2,1,9,5,3,4,8, 1,9,8,3,4,2,5,6,7, 8,5,9,7,6,1,4,2,3, 4,2,6,8,5,3,7,9,1, 7,1,3,9,2,4,8,5,6, 9,6,1,5,3,7,2,8,4, 2,8,7,4,1,9,6,3,5, 3,4,5,2,8,6,1,7,9]},
  {label:'Medium', blankCount:46, seed:19,
    solution:[5,7,6,4,3,2,1,9,8, 4,3,8,9,1,5,7,6,2, 9,1,2,7,6,8,5,4,3, 2,5,1,3,4,9,6,8,7, 6,8,4,2,5,7,3,1,9, 3,9,7,1,8,6,2,5,4, 1,4,9,5,7,3,8,2,6, 8,2,3,6,9,1,4,7,5, 7,6,5,8,2,4,9,3,1]},
];
registerApp('sudoku', {title:'Sudoku', glyph:'▥', color:'linear-gradient(135deg,#f472b6,#db2777)', w:400, h:600, installedShortcut:true, hiddenUntilInstalled:true, build(body){
  body.innerHTML = `<div class="sd-shell">
    <div style="display:flex; gap:8px; align-items:center;">
      <select id="sdPick">${sudokuPuzzles.map((p,i)=>`<option value="${i}">${p.label}</option>`).join('')}</select>
      <button id="sdNew" style="background:rgba(255,255,255,0.08); border:1px solid var(--line); color:var(--text); border-radius:6px; padding:6px 10px; cursor:pointer;">New game</button>
    </div>
    <div class="sd-board" id="sdBoard"></div>
    <div class="sd-pad" id="sdPad"></div>
    <div class="sd-msg" id="sdMsg"></div>
  </div>`;
  let puzIdx=0, board=[], given=[], sel=-1, solved=false;
  function load(){
    const p = sudokuPuzzles[puzIdx];
    const blanks = pickBlanks(p.blankCount, p.seed);
    board = p.solution.map((v,i)=>blanks.has(i)?0:v);
    given = p.solution.map((v,i)=>!blanks.has(i));
    sel=-1; solved=false; body.querySelector('#sdMsg').textContent='';
    renderBoard();
  }
  function conflictsAt(i){
    const r=Math.floor(i/9), c=i%9, v=board[i]; if(!v) return false;
    for(let k=0;k<9;k++){ if(k!==c && board[r*9+k]===v) return true; if(k!==r && board[k*9+c]===v) return true; }
    const br=Math.floor(r/3)*3, bc=Math.floor(c/3)*3;
    for(let dr=0;dr<3;dr++) for(let dc=0;dc<3;dc++){ const j=(br+dr)*9+(bc+dc); if(j!==i && board[j]===v) return true; }
    return false;
  }
  function renderBoard(){
    const boardEl = body.querySelector('#sdBoard'); boardEl.innerHTML='';
    for(let i=0;i<81;i++){
      const cell=document.createElement('div');
      cell.className='sd-cell'+(given[i]?' given':'')+(i===sel?' sel':'')+(!given[i]&&board[i]&&conflictsAt(i)?' bad':'');
      cell.textContent = board[i]||'';
      cell.addEventListener('click', ()=>{ if(given[i]) return; sel=i; renderBoard(); });
      boardEl.appendChild(cell);
    }
  }
  const padEl = body.querySelector('#sdPad'); padEl.innerHTML='';
  for(let n=1;n<=9;n++){
    const b=document.createElement('button'); b.textContent=n;
    b.addEventListener('click', ()=>{ if(sel<0||given[sel]) return; board[sel]=n; renderBoard(); checkWin(); });
    padEl.appendChild(b);
  }
  const clearBtn=document.createElement('button'); clearBtn.textContent='clear'; clearBtn.style.gridColumn='span 9';
  clearBtn.addEventListener('click', ()=>{ if(sel>=0 && !given[sel]){ board[sel]=0; renderBoard(); } });
  padEl.appendChild(clearBtn);
  function checkWin(){
    if(solved) return;
    const p = sudokuPuzzles[puzIdx];
    if(board.every((v,i)=>v===p.solution[i])){
      solved=true; body.querySelector('#sdMsg').textContent='Solved! nice.';
      toast('Sudoku solved!'); unlockAchievement('sudoku');
    }
  }
  body.querySelector('#sdPick').addEventListener('change', (e)=>{ puzIdx=+e.target.value; load(); });
  body.querySelector('#sdNew').addEventListener('click', load);
  load();
}});

/* ---- Distro Tracker (installable) ---- */
let distroData = [
  {id:1, name:'Arch Linux', verdict:'Daily driver — minimal, I understand every piece of it.'},
  {id:2, name:'Gentoo', verdict:'Ragequit after a 14-hour kernel compile fixed nothing.'},
  {id:3, name:'CachyOS', verdict:'Great for gaming — keeping it in the VM rotation.'},
];
let distroSeq=4;
const persistDistros = debouncedSave('voidos:distros', ()=>distroData);
registerApp('distros', {title:'Distro Tracker', glyph:'⌬', color:'linear-gradient(135deg,#60a5fa,#2563eb)', w:420, h:480, installedShortcut:true, hiddenUntilInstalled:true, build(body){
  body.innerHTML = `<div class="dt-shell">
    <div class="dt-form">
      <input id="dtName" placeholder="Distro name" />
      <input id="dtReason" placeholder="Verdict / why you ragequit" />
      <button id="dtAdd">+ Log it</button>
    </div>
    <div class="dt-list" id="dtList"></div>
  </div>`;
  const listEl = body.querySelector('#dtList');
  function render(){
    listEl.innerHTML='';
    if(!distroData.length){ listEl.innerHTML='<div class="fm-empty"><div class="fm-empty-icon">⌬</div>No distros logged yet.</div>'; return; }
    distroData.slice().reverse().forEach(d=>{
      const card=document.createElement('div'); card.className='dt-card';
      card.innerHTML = `<div class="row1"><span class="name">${d.name}</span><span class="del">delete</span></div><div class="reason">${d.verdict}</div>`;
      card.querySelector('.del').addEventListener('click', ()=>{ distroData = distroData.filter(x=>x.id!==d.id); render(); persistDistros(); });
      listEl.appendChild(card);
    });
  }
  body.querySelector('#dtAdd').addEventListener('click', ()=>{
    const name = body.querySelector('#dtName').value.trim();
    const reason = body.querySelector('#dtReason').value.trim();
    if(!name) return;
    distroData.push({id:distroSeq++, name, verdict:reason||'(no verdict yet)'});
    body.querySelector('#dtName').value=''; body.querySelector('#dtReason').value='';
    render(); persistDistros();
    unlockAchievement('distro');
  });
  render();
}});

/* ---- Dotfiles Sync (installable) ---- */
let dotfilesData = ['.bashrc','.vimrc','.gitconfig','.tmux.conf','.zshrc','.config/nvim/init.lua'].map(p=>({path:p, synced:true}));
const persistDotfiles = debouncedSave('voidos:dotfiles', ()=>dotfilesData);
registerApp('dotfiles', {title:'Dotfiles Sync', glyph:'⌗', color:'linear-gradient(135deg,#a78bfa,#7c3aed)', w:380, h:440, installedShortcut:true, hiddenUntilInstalled:true, build(body){
  body.innerHTML = `<div class="df-shell">
    <div class="df-head"><div style="font-size:12px;color:var(--muted);font-family:var(--mono)">tracked files</div><button id="dfSync">Sync now</button></div>
    <div class="df-list" id="dfList"></div>
    <div class="df-bar"><div class="fill" id="dfFill"></div></div>
  </div>`;
  const listEl = body.querySelector('#dfList');
  function render(){
    listEl.innerHTML = dotfilesData.map(f=>`<div class="df-row"><span class="path">${f.path}</span><span class="state">${f.synced?'synced':'pending'}</span></div>`).join('');
  }
  body.querySelector('#dfSync').addEventListener('click', (e)=>{
    const btn=e.target; if(btn.disabled) return;
    btn.disabled=true; btn.textContent='Syncing…';
    dotfilesData.forEach(f=>f.synced=false); render();
    const fill=body.querySelector('#dfFill'); let pct=0;
    const t=setInterval(()=>{
      pct+=100/dotfilesData.length;
      const doneCount = Math.min(dotfilesData.length, Math.round(Math.min(100,pct)/100*dotfilesData.length));
      dotfilesData.forEach((f,i)=>f.synced = i<doneCount);
      fill.style.width = Math.min(100,pct)+'%'; render();
      if(pct>=100){ clearInterval(t); btn.disabled=false; btn.textContent='Sync now'; toast('Dotfiles synced'); persistDotfiles(); }
    }, 220);
  });
  render();
}});

/* ---- Mail (installable) — fictional inbox, reuses the Files-app shell classes ---- */
let mailData = {
  inbox: [
    {id:1, from:'sysadmin@void.os', subj:'Welcome to VoidOS 2.7 "Phosphor"', body:"Thanks for updating. Check Settings for CRT scanlines, cursor trail and auto-lock — and drag a window to a screen edge to snap it.", read:false},
    {id:2, from:'noreply@voidstore.os', subj:'New in the Store', body:'Color Lab, Sudoku, Distro Tracker, Dotfiles Sync, Task Manager, Calendar and Achievements are all live now. Nothing left in "coming soon."', read:false},
    {id:3, from:'kernel@void.os', subj:'Persistence layer status', body:hasVStore() ? 'Browser storage detected — your files, notes, and settings will survive a reload.' : 'No storage backend detected this session — everything will reset on reload, same as v1.', read:false},
  ],
  sent: [
    {id:4, from:'guest@voidos', subj:'re: distro-hopping', body:'yeah gentoo compile times finally broke me, back to arch. logged it in the tracker.', read:true},
  ],
  trash: [],
};
const persistMail = debouncedSave('voidos:mail', ()=>mailData);
registerApp('mail', {title:'Mail', glyph:'✉', color:'linear-gradient(135deg,#fbbf24,#f59e0b)', w:660, h:460, installedShortcut:true, hiddenUntilInstalled:true, build(body){
  let folder='inbox', active=null;
  body.innerHTML = `<div class="fm-shell">
    <div class="fm-sidebar"><div class="sec">Folders</div><div id="mlFolders"></div></div>
    <div class="fm-main">
      <div class="fm-toolbar"><span id="mlTitle" style="font-family:var(--mono);text-transform:capitalize;"></span></div>
      <div style="display:flex; height:calc(100% - 37px);">
        <div style="width:230px; border-right:1px solid var(--line); overflow:auto;" id="mlList"></div>
        <div style="flex:1; padding:16px; overflow:auto;" id="mlBody"></div>
      </div>
    </div>
  </div>`;
  const folderNames = ['inbox','sent','trash'];
  const foldersEl = body.querySelector('#mlFolders');
  function renderFolders(){
    foldersEl.innerHTML='';
    folderNames.forEach(f=>{
      const unread = f==='inbox' ? mailData[f].filter(m=>!m.read).length : 0;
      const d=document.createElement('div'); d.className='sitem'+(f===folder?' active':'');
      d.innerHTML = f + (unread? ` <span style="color:var(--accent2);font-family:var(--mono);font-size:10px;">(${unread})</span>` : '');
      d.addEventListener('click', ()=>{ folder=f; active=null; renderFolders(); renderList(); renderBody(); });
      foldersEl.appendChild(d);
    });
  }
  const listEl = body.querySelector('#mlList');
  function renderList(){
    body.querySelector('#mlTitle').textContent = folder;
    listEl.innerHTML='';
    if(!mailData[folder].length){ listEl.innerHTML='<div class="fm-empty"><div class="fm-empty-icon">✉️</div>'+folder+' is empty.</div>'; return; }
    mailData[folder].slice().reverse().forEach(m=>{
      const row=document.createElement('div');
      row.style.cssText='padding:10px 12px;border-bottom:1px solid var(--line);cursor:pointer;font-size:12px;'+(m.id===active?'background:rgba(255,255,255,0.06);':'');
      row.innerHTML = `<div style="font-weight:${m.read?400:700};">${m.from}</div><div style="color:var(--muted);font-size:11px;">${m.subj}</div>`;
      row.addEventListener('click', ()=>{ active=m.id; m.read=true; renderFolders(); renderList(); renderBody(); persistMail(); });
      listEl.appendChild(row);
    });
  }
  const bodyEl = body.querySelector('#mlBody');
  function renderBody(){
    const m = mailData[folder].find(x=>x.id===active);
    if(!m){ bodyEl.innerHTML = '<div style="color:var(--muted);font-size:12px;">Select a message.</div>'; return; }
    bodyEl.innerHTML = `<div style="font-weight:700;font-size:14px;margin-bottom:4px;">${m.subj}</div>
      <div style="color:var(--muted);font-size:11.5px;margin-bottom:14px;font-family:var(--mono);">from ${m.from}</div>
      <div style="font-size:13px;line-height:1.6;">${m.body}</div>
      ${folder!=='trash' ? '<button id="mlDelete" style="margin-top:16px;background:var(--danger);border:none;color:#2a0a0a;border-radius:6px;padding:6px 12px;cursor:pointer;font-weight:700;">Move to Trash</button>' : ''}`;
    const delBtn = bodyEl.querySelector('#mlDelete');
    if(delBtn) delBtn.addEventListener('click', ()=>{
      mailData[folder] = mailData[folder].filter(x=>x.id!==m.id);
      mailData.trash.push(m); active=null;
      renderFolders(); renderList(); renderBody(); persistMail();
    });
  }
  renderFolders(); renderList(); renderBody();
}});

/* ---- Task Manager (installable) ---- */
registerApp('taskmanager', {title:'Task Manager', glyph:'▤', color:'linear-gradient(135deg,#fb7185,#be123c)', w:460, h:480, installedShortcut:true, hiddenUntilInstalled:true, build(body, winId){
  body.innerHTML = `<div class="pad">
    <div style="font-family:var(--mono);font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Running windows</div>
    <div id="tmList" style="display:flex;flex-direction:column;gap:6px;margin-bottom:18px;"></div>
    <div style="font-family:var(--mono);font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">System processes</div>
    <div id="tmSys" style="font-family:var(--mono);font-size:11.5px;color:var(--muted);display:flex;flex-direction:column;gap:4px;"></div>
  </div>`;
  const listEl = body.querySelector('#tmList');
  function render(){
    listEl.innerHTML='';
    const wins = [...openWins.entries()].filter(([id])=>id!==winId);
    if(!wins.length){ listEl.innerHTML = '<div style="color:var(--muted);font-size:12px;">Nothing else is running.</div>'; return; }
    wins.forEach(([id,w])=>{
      const row=document.createElement('div');
      row.style.cssText='display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,0.03);border:1px solid var(--line);border-radius:8px;padding:8px 10px;';
      const cpu=(Math.random()*18).toFixed(1), mem=(4+Math.random()*14).toFixed(1);
      row.innerHTML = `<span style="font-size:12.5px;">${APPS[w.appId]?APPS[w.appId].glyph:'▢'} ${w.title}</span>
        <span style="font-family:var(--mono);font-size:11px;color:var(--muted);">cpu ${cpu}% · mem ${mem}%</span>`;
      const btn=document.createElement('button'); btn.textContent='Force quit';
      btn.style.cssText='background:var(--danger);border:none;color:#2a0a0a;border-radius:6px;padding:4px 10px;font-size:11px;font-weight:700;cursor:pointer;';
      btn.addEventListener('click', ()=>{ closeWin(id); render(); });
      row.appendChild(btn); listEl.appendChild(row);
    });
  }
  const sysProcs = ['void-kernel','wm-compositor','audio-daemon','fs-watchd','snap-zone-engine','pet-ai (low priority)'];
  body.querySelector('#tmSys').innerHTML = sysProcs.map(p=>`<div>${p} — running</div>`).join('');
  render();
  const iv = setInterval(render, 2000);
  return { onClose(){ clearInterval(iv); } };
}});

/* ---- Calendar (installable) ---- */
let calendarEvents = {};
const persistCalendar = debouncedSave('voidos:calendar', ()=>calendarEvents);
registerApp('calendar', {title:'Calendar', glyph:'▦', color:'linear-gradient(135deg,#4ade80,#16a34a)', w:420, h:480, installedShortcut:true, hiddenUntilInstalled:true, build(body){
  let view = new Date(); view.setDate(1); let selDate=null;
  body.innerHTML = `<div class="cal-shell">
    <div class="cal-head">
      <button class="cal-nav-btn" id="calPrev">‹</button>
      <div class="cal-label" id="calLabel"></div>
      <button class="cal-nav-btn" id="calNext">›</button>
    </div>
    <div class="cal-grid" id="calGrid"></div>
    <div class="cal-events" id="calEvents"></div>
  </div>`;
  const gridEl = body.querySelector('#calGrid'), labelEl = body.querySelector('#calLabel'), evEl = body.querySelector('#calEvents');
  function key(d){ return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
  function render(){
    labelEl.textContent = view.toLocaleDateString(undefined,{month:'long',year:'numeric'});
    gridEl.innerHTML='';
    ['S','M','T','W','T','F','S'].forEach(d=>{
      const h=document.createElement('div'); h.className='cal-dow'; h.textContent=d; gridEl.appendChild(h);
    });
    const first = new Date(view.getFullYear(), view.getMonth(), 1);
    const daysInMonth = new Date(view.getFullYear(), view.getMonth()+1, 0).getDate();
    for(let i=0;i<first.getDay();i++) gridEl.appendChild(document.createElement('div'));
    const today = new Date();
    for(let d=1; d<=daysInMonth; d++){
      const cellDate = new Date(view.getFullYear(), view.getMonth(), d);
      const k = key(cellDate);
      const cell=document.createElement('div'); cell.className='cal-cell';
      const isToday = cellDate.toDateString()===today.toDateString();
      const hasEvents = calendarEvents[k] && calendarEvents[k].length;
      cell.textContent=d;
      if(k===selDate) cell.classList.add('selected');
      if(isToday) cell.classList.add('today');
      if(hasEvents) cell.classList.add('has-events');
      cell.addEventListener('click', ()=>{ selDate=k; render(); renderEvents(); });
      gridEl.appendChild(cell);
    }
  }
  function renderEvents(){
    if(!selDate){ evEl.innerHTML='<div class="cal-empty-hint">Pick a day to add an event.</div>'; return; }
    const evs = calendarEvents[selDate]||[];
    evEl.innerHTML = `<div class="cal-ev-date">${selDate}</div>` +
      evs.map((e,i)=>`<div class="cal-ev-row"><span>${e}</span><span class="cal-ev-remove" data-i="${i}">remove</span></div>`).join('') +
      `<div class="cal-add-row"><input id="calNewEv" class="cal-add-input" placeholder="Add event…"/><button id="calAddEv" class="cal-add-btn">Add</button></div>`;
    evEl.querySelectorAll('.cal-ev-remove').forEach(s=>s.addEventListener('click', ()=>{
      calendarEvents[selDate].splice(+s.dataset.i,1); if(!calendarEvents[selDate].length) delete calendarEvents[selDate];
      persistCalendar(); render(); renderEvents();
    }));
    function addEvent(){
      const inp = evEl.querySelector('#calNewEv'); const v=inp.value.trim(); if(!v) return;
      if(!calendarEvents[selDate]) calendarEvents[selDate]=[];
      calendarEvents[selDate].push(v); persistCalendar(); render(); renderEvents();
    }
    evEl.querySelector('#calAddEv').addEventListener('click', addEvent);
    evEl.querySelector('#calNewEv').addEventListener('keydown', e=>{ if(e.key==='Enter') addEvent(); });
  }
  body.querySelector('#calPrev').addEventListener('click', ()=>{ view.setMonth(view.getMonth()-1); render(); });
  body.querySelector('#calNext').addEventListener('click', ()=>{ view.setMonth(view.getMonth()+1); render(); });
  render(); renderEvents();
}});

/* ---- Achievements ---- */
const achievementDefs = [
  {key:'konami', title:'You remember the 90s', desc:'Enter the Konami code anywhere on the desktop.'},
  {key:'rainbow', title:'Taste the rainbow', desc:'Click the VoidOS logo in the top bar 10 times fast.'},
  {key:'zoomies', title:'Zoomies', desc:'Click the pet while its CPU load is spiking.'},
  {key:'sudoku', title:'Number wrangler', desc:'Solve a Sudoku puzzle.'},
  {key:'distro', title:'Distro hopper', desc:'Log your first distro in the tracker.'},
  {key:'snap', title:'Snapped in', desc:'Drag a window to a screen edge to snap it.'},
  {key:'nightowl', title:'Session survivor', desc:'Reload VoidOS and find your data still here.'},
  {key:'byob', title:'Bring your own beat', desc:'Import your own music into the Music Player.'},
  {key:'screensaver', title:'Idle hands', desc:'Leave VoidOS alone long enough for the screensaver to kick in.'},
  {key:'minesweeper', title:'Defused', desc:'Clear a Minesweeper board without hitting a mine.'},
];
let unlockedAchievements = new Set();
const persistAch = debouncedSave('voidos:achievements', ()=>[...unlockedAchievements]);
function unlockAchievement(key){
  if(unlockedAchievements.has(key)) return;
  unlockedAchievements.add(key);
  sfx('achievement');
  const def = achievementDefs.find(a=>a.key===key);
  if(def) toast('🏆 '+def.title, 'achievement');
  persistAch();
}
/* ---- Process Monitor (installable) ---- */
registerApp('procmon', {title:'Process Monitor', glyph:'▤', color:'linear-gradient(135deg,#4ade80,#15803d)', w:520, h:520, installedShortcut:true, hiddenUntilInstalled:true, build(body){
  body.innerHTML = `<div class="pad" style="height:100%; display:flex; flex-direction:column;">
    <div style="display:flex; gap:10px; margin-bottom:10px;">
      <div style="flex:1;"><div style="font-family:var(--mono); font-size:11px; color:var(--muted);">CPU</div><div class="df-bar"><div class="fill" id="pmCpuBar"></div></div></div>
      <div style="flex:1;"><div style="font-family:var(--mono); font-size:11px; color:var(--muted);">MEM</div><div class="df-bar"><div class="fill" id="pmMemBar" style="background:#33ff66;"></div></div></div>
    </div>
    <div style="display:flex; font-family:var(--pixel); font-size:9px; color:var(--muted); padding:4px 6px; border-bottom:1px solid var(--line);">
      <span style="flex:3; cursor:pointer;" data-sort="name">NAME</span><span style="flex:1; cursor:pointer;" data-sort="pid">PID</span>
      <span style="flex:1; cursor:pointer;" data-sort="cpu">CPU%</span><span style="flex:1; cursor:pointer;" data-sort="mem">MEM%</span><span style="width:44px;"></span>
    </div>
    <div id="pmList" style="flex:1; overflow:auto; font-family:var(--mono); font-size:12.5px;"></div>
  </div>`;
  const procNames = ['void-kernel','wm-compositor','audio-daemon','fs-watchd','snap-zone-engine','pet-ai','crt-shader','voidsh','file-indexer','net-listener','clock-tick','store-sync','settings-daemon','gpu-compositor','session-mgr'];
  let procs = procNames.map((n,i)=>({name:n, pid:1000+i*7, cpu:Math.random()*20, mem:Math.random()*12, alive:true}));
  let sortKey='cpu';
  function render(){
    const list = body.querySelector('#pmList');
    const rows = procs.filter(p=>p.alive).sort((a,b)=>b[sortKey]-a[sortKey]);
    list.innerHTML = rows.map(p=>`<div style="display:flex; align-items:center; padding:4px 6px; border-bottom:1px solid rgba(255,255,255,0.04);">
      <span style="flex:3; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${p.name}</span>
      <span style="flex:1; color:var(--muted);">${p.pid}</span>
      <span style="flex:1; color:${p.cpu>15?'var(--danger)':'var(--text)'};">${p.cpu.toFixed(1)}</span>
      <span style="flex:1;">${p.mem.toFixed(1)}</span>
      <span style="width:44px;"><button data-pid="${p.pid}" class="pm-kill" style="background:var(--danger); border:none; color:#2a0a0a; border-radius:4px; padding:2px 6px; font-size:10px; cursor:pointer;">kill</button></span>
    </div>`).join('');
    list.querySelectorAll('.pm-kill').forEach(b=>b.addEventListener('click', ()=>{
      const p = procs.find(x=>x.pid===+b.dataset.pid); if(p){ p.alive=false; toast(p.name+' terminated'); }
      if(!procs.some(x=>x.alive)) setTimeout(()=>{ procs.forEach(x=>x.alive=true); toast('init respawned everything'); render(); }, 900);
      render();
    }));
  }
  body.querySelectorAll('[data-sort]').forEach(h=>h.addEventListener('click', ()=>{ sortKey=h.dataset.sort; render(); }));
  const iv = setInterval(()=>{
    procs.forEach(p=>{ if(!p.alive) return; p.cpu=Math.max(0,Math.min(45,p.cpu+(Math.random()*10-5))); p.mem=Math.max(0,Math.min(30,p.mem+(Math.random()*4-2))); });
    body.querySelector('#pmCpuBar').style.width = Math.round(latestCpu)+'%';
    body.querySelector('#pmMemBar').style.width = Math.round(30+Math.random()*15)+'%';
    render();
  }, 1200);
  render();
  return { onClose(){ clearInterval(iv); } };
}});

/* ---- Game of Life (installable) ---- */
registerApp('gameoflife', {title:'Game of Life', glyph:'▦', color:'linear-gradient(135deg,#33ccff,#1d4ed8)', w:460, h:560, installedShortcut:true, hiddenUntilInstalled:true, build(body){
  body.innerHTML = `<div class="pad" style="height:100%; display:flex; flex-direction:column; align-items:center; gap:10px;">
    <canvas id="golCanvas" style="border:2px solid var(--line); border-radius:var(--radius-sm); cursor:pointer; max-width:100%;"></canvas>
    <div style="display:flex; gap:8px; flex-wrap:wrap; justify-content:center;">
      <button id="golPlay" style="background:var(--accent); color:#04231d; border:none; border-radius:var(--radius-sm); padding:7px 14px; font-family:var(--pixel); font-size:10px; cursor:pointer;">▶ Play</button>
      <button id="golStep" style="background:rgba(255,255,255,0.08); border:1px solid var(--line); color:var(--text); border-radius:var(--radius-sm); padding:7px 14px; font-family:var(--mono); cursor:pointer;">Step</button>
      <button id="golRand" style="background:rgba(255,255,255,0.08); border:1px solid var(--line); color:var(--text); border-radius:var(--radius-sm); padding:7px 14px; font-family:var(--mono); cursor:pointer;">Randomize</button>
      <button id="golClear" style="background:rgba(255,255,255,0.08); border:1px solid var(--line); color:var(--text); border-radius:var(--radius-sm); padding:7px 14px; font-family:var(--mono); cursor:pointer;">Clear</button>
    </div>
    <div style="font-family:var(--mono); font-size:12px; color:var(--muted);">Generation <span id="golGen">0</span> · <span id="golPop">0</span> alive</div>
  </div>`;
  const cols=44, rows=38, cell=8;
  const canvas = body.querySelector('#golCanvas'); canvas.width=cols*cell; canvas.height=rows*cell;
  const ctx = canvas.getContext('2d');
  let grid = new Uint8Array(cols*rows), playing=false, gen=0, timer=null;
  function idx(x,y){ return y*cols+x; }
  function randomize(){ for(let i=0;i<grid.length;i++) grid[i]=Math.random()<0.28?1:0; gen=0; draw(); }
  function clearGrid(){ grid.fill(0); gen=0; draw(); }
  function neighbors(x,y){
    let n=0;
    for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++){
      if(dx===0&&dy===0) continue;
      const nx=(x+dx+cols)%cols, ny=(y+dy+rows)%rows;
      n += grid[idx(nx,ny)];
    }
    return n;
  }
  function step(){
    const next = new Uint8Array(grid.length);
    for(let y=0;y<rows;y++) for(let x=0;x<cols;x++){
      const n = neighbors(x,y), alive = grid[idx(x,y)];
      next[idx(x,y)] = alive ? (n===2||n===3?1:0) : (n===3?1:0);
    }
    grid = next; gen++; draw();
  }
  function draw(){
    ctx.fillStyle='#050403'; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = cssVar('--accent');
    let pop=0;
    for(let y=0;y<rows;y++) for(let x=0;x<cols;x++){ if(grid[idx(x,y)]){ ctx.fillRect(x*cell,y*cell,cell-1,cell-1); pop++; } }
    body.querySelector('#golGen').textContent=gen; body.querySelector('#golPop').textContent=pop;
  }
  canvas.addEventListener('click', (e)=>{
    const r=canvas.getBoundingClientRect();
    const x=Math.floor((e.clientX-r.left)/(r.width/cols)), y=Math.floor((e.clientY-r.top)/(r.height/rows));
    if(x>=0&&x<cols&&y>=0&&y<rows){ grid[idx(x,y)] = grid[idx(x,y)]?0:1; draw(); }
  });
  body.querySelector('#golPlay').addEventListener('click', (e)=>{
    playing=!playing; e.target.textContent = playing?'⏸ Pause':'▶ Play';
    if(playing) timer=setInterval(step, 140); else clearInterval(timer);
  });
  body.querySelector('#golStep').addEventListener('click', step);
  body.querySelector('#golRand').addEventListener('click', randomize);
  body.querySelector('#golClear').addEventListener('click', clearGrid);
  randomize();
  return { onClose(){ clearInterval(timer); } };
}});

/* ---- ASCII Art (installable) ---- */
registerApp('asciiart', {title:'ASCII Art', glyph:'▧', color:'linear-gradient(135deg,#33ff66,#166534)', w:560, h:480, installedShortcut:true, hiddenUntilInstalled:true, build(body){
  body.innerHTML = `<div class="pad" style="height:100%; display:flex; flex-direction:column; gap:10px;">
    <div style="display:flex; gap:8px;">
      <input id="asciiInput" value="VOIDOS" maxlength="14" style="flex:1; background:#0a0d13; border:1px solid var(--line); color:var(--text); border-radius:var(--radius-sm); padding:8px 10px; font-family:var(--mono); font-size:14px;">
      <button id="asciiGen" style="background:var(--accent); color:#04231d; border:none; border-radius:var(--radius-sm); padding:8px 16px; font-family:var(--pixel); font-size:10px; cursor:pointer;">Render</button>
      <button id="asciiCopy" style="background:rgba(255,255,255,0.08); border:1px solid var(--line); color:var(--text); border-radius:var(--radius-sm); padding:8px 14px; font-family:var(--mono); cursor:pointer;">Copy</button>
    </div>
    <pre id="asciiOut" style="flex:1; background:#020403; border:2px solid var(--line); border-radius:var(--radius-sm); padding:14px; overflow:auto; font-family:var(--mono); font-size:9px; line-height:1; color:var(--term-green); text-shadow:0 0 3px rgba(51,255,102,0.5); margin:0; white-space:pre;"></pre>
  </div>`;
  const off = document.createElement('canvas'); const octx = off.getContext('2d');
  const ramp = ' .:-=+*#%@';
  function render(){
    const text = (body.querySelector('#asciiInput').value || 'VOID').toUpperCase().slice(0,14);
    const fontSize = 46;
    octx.font = `bold ${fontSize}px monospace`;
    const w = Math.max(50, Math.ceil(octx.measureText(text).width)+10);
    const h = Math.ceil(fontSize*1.3);
    off.width=w; off.height=h;
    octx.font = `bold ${fontSize}px monospace`;
    octx.fillStyle='#000'; octx.fillRect(0,0,w,h);
    octx.fillStyle='#fff'; octx.textBaseline='top'; octx.fillText(text, 4, 4);
    const data = octx.getImageData(0,0,w,h).data;
    const stepX=2, stepY=4;
    let out='';
    for(let y=0;y<h;y+=stepY){
      let line='';
      for(let x=0;x<w;x+=stepX){
        const i=(y*w+x)*4;
        const bright = data[i]/255;
        line += ramp[Math.min(ramp.length-1, Math.floor(bright*ramp.length))];
      }
      out += line.replace(/\s+$/,'') + '\n';
    }
    body.querySelector('#asciiOut').textContent = out || '(type something)';
  }
  body.querySelector('#asciiGen').addEventListener('click', render);
  body.querySelector('#asciiInput').addEventListener('keydown', e=>{ if(e.key==='Enter') render(); });
  body.querySelector('#asciiCopy').addEventListener('click', ()=>{
    try{ navigator.clipboard && navigator.clipboard.writeText(body.querySelector('#asciiOut').textContent); }catch(e){}
    toast('Copied to clipboard');
  });
  render();
}});

/* ---- Hash & Encode (installable) ---- */
registerApp('hashtool', {title:'Hash & Encode', glyph:'⌗', color:'linear-gradient(135deg,#ff2e88,#9d174d)', w:480, h:520, installedShortcut:true, hiddenUntilInstalled:true, build(body){
  body.innerHTML = `<div class="pad" style="height:100%; display:flex; flex-direction:column; gap:10px;">
    <textarea id="hashInput" placeholder="Type or paste text…" style="height:90px; background:#0a0d13; border:1px solid var(--line); color:var(--text); border-radius:var(--radius-sm); padding:10px; font-family:var(--mono); font-size:13px; resize:vertical;"></textarea>
    <div style="display:flex; gap:6px; flex-wrap:wrap;">
      <button data-op="sha256" class="ht-btn">SHA-256</button><button data-op="sha1" class="ht-btn">SHA-1</button>
      <button data-op="sha384" class="ht-btn">SHA-384</button><button data-op="sha512" class="ht-btn">SHA-512</button>
      <button data-op="b64enc" class="ht-btn">Base64 encode</button><button data-op="b64dec" class="ht-btn">Base64 decode</button>
      <button data-op="urlenc" class="ht-btn">URL encode</button><button data-op="urldec" class="ht-btn">URL decode</button>
    </div>
    <div style="flex:1; display:flex; flex-direction:column; gap:4px;">
      <div style="font-size:11px; color:var(--muted); font-family:var(--mono);">Result</div>
      <textarea id="hashOut" readonly style="flex:1; background:#020403; border:2px solid var(--line); border-radius:var(--radius-sm); padding:10px; font-family:var(--mono); font-size:12.5px; color:var(--accent); resize:none;"></textarea>
    </div>
    <button id="hashCopy" style="background:rgba(255,255,255,0.08); border:1px solid var(--line); color:var(--text); border-radius:var(--radius-sm); padding:7px; font-family:var(--mono); cursor:pointer;">Copy result</button>
  </div>`;
  body.querySelectorAll('.ht-btn').forEach(b=>b.style.cssText='background:rgba(255,255,255,0.06); border:1px solid var(--line); color:var(--text); border-radius:var(--radius-sm); padding:6px 11px; font-family:var(--mono); font-size:12px; cursor:pointer;');
  async function doHash(algo){
    const text = body.querySelector('#hashInput').value;
    try{
      const enc = new TextEncoder().encode(text);
      const buf = await crypto.subtle.digest(algo, enc);
      return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('');
    }catch(e){ return '(hashing unavailable in this browser context)'; }
  }
  body.querySelectorAll('.ht-btn').forEach(btn=>btn.addEventListener('click', async ()=>{
    const op = btn.dataset.op; const input = body.querySelector('#hashInput').value; const out = body.querySelector('#hashOut');
    try{
      if(op==='sha256') out.value = await doHash('SHA-256');
      else if(op==='sha1') out.value = await doHash('SHA-1');
      else if(op==='sha384') out.value = await doHash('SHA-384');
      else if(op==='sha512') out.value = await doHash('SHA-512');
      else if(op==='b64enc') out.value = btoa(unescape(encodeURIComponent(input)));
      else if(op==='b64dec') out.value = decodeURIComponent(escape(atob(input)));
      else if(op==='urlenc') out.value = encodeURIComponent(input);
      else if(op==='urldec') out.value = decodeURIComponent(input);
    }catch(e){ out.value = 'Could not process — check the input.'; }
  }));
  body.querySelector('#hashCopy').addEventListener('click', ()=>{
    try{ navigator.clipboard && navigator.clipboard.writeText(body.querySelector('#hashOut').value); }catch(e){}
    toast('Copied to clipboard');
  });
}});

/* ---- Minesweeper (installable) ---- */
registerApp('minesweeper', {title:'Minesweeper', glyph:'▩', color:'linear-gradient(135deg,#ffb000,#b45309)', w:400, h:520, installedShortcut:true, hiddenUntilInstalled:true, build(body){
  const cols=10, rows=10, mineCount=15;
  body.innerHTML = `<div class="pad" style="display:flex; flex-direction:column; align-items:center; gap:10px; height:100%;">
    <div style="display:flex; justify-content:space-between; width:100%; font-family:var(--mono); font-size:14px;">
      <span>💣 <span id="msMines">${mineCount}</span></span>
      <button id="msReset" style="background:rgba(255,255,255,0.08); border:1px solid var(--line); color:var(--text); border-radius:var(--radius-sm); padding:4px 12px; cursor:pointer; font-family:var(--pixel); font-size:10px;">reset</button>
      <span id="msTimer">⏱ 0</span>
    </div>
    <div id="msGrid" style="display:grid; grid-template-columns:repeat(${cols},1fr); gap:1px; background:var(--line); border:2px solid var(--line);"></div>
    <div id="msMsg" style="font-family:var(--mono); font-size:13px; color:var(--muted); min-height:16px;"></div>
  </div>`;
  let board, revealed, flagged, over, started, secs, tmr;
  function newBoard(){
    board = Array.from({length:rows},()=>Array(cols).fill(0));
    revealed = Array.from({length:rows},()=>Array(cols).fill(false));
    flagged = Array.from({length:rows},()=>Array(cols).fill(false));
    let placed=0;
    while(placed<mineCount){
      const r=Math.floor(Math.random()*rows), c=Math.floor(Math.random()*cols);
      if(board[r][c]!==-1){ board[r][c]=-1; placed++; }
    }
    for(let r=0;r<rows;r++) for(let c=0;c<cols;c++){
      if(board[r][c]===-1) continue;
      let n=0;
      for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++){
        const rr=r+dr, cc=c+dc; if(rr>=0&&rr<rows&&cc>=0&&cc<cols&&board[rr][cc]===-1) n++;
      }
      board[r][c]=n;
    }
    over=false; started=false; secs=0; clearInterval(tmr);
    body.querySelector('#msMsg').textContent=''; body.querySelector('#msTimer').textContent='⏱ 0';
    body.querySelector('#msMines').textContent=mineCount;
    render();
  }
  function reveal(r,c){
    if(r<0||r>=rows||c<0||c>=cols||revealed[r][c]||flagged[r][c]) return;
    revealed[r][c]=true;
    if(board[r][c]===0){ for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++) reveal(r+dr,c+dc); }
  }
  function checkWin(){
    for(let r=0;r<rows;r++) for(let c=0;c<cols;c++){ if(board[r][c]!==-1 && !revealed[r][c]) return false; }
    return true;
  }
  function render(){
    const grid = body.querySelector('#msGrid'); grid.innerHTML='';
    for(let r=0;r<rows;r++) for(let c=0;c<cols;c++){
      const cell=document.createElement('div');
      const isRev = revealed[r][c];
      cell.style.cssText = `width:28px; height:28px; display:flex; align-items:center; justify-content:center; font-family:var(--mono); font-size:13px; font-weight:700; cursor:pointer; user-select:none;
        background:${isRev?'#0a0d13':'rgba(255,255,255,0.06)'}; color:${board[r][c]>0?['','#33ccff','#33ff66','#ff2e88','#a259ff','#ffb000','#ff4d4d','#fff','#888'][board[r][c]]:'var(--text)'};`;
      if(isRev) cell.textContent = board[r][c]===-1?'💣':(board[r][c]||'');
      else if(flagged[r][c]) cell.textContent='🚩';
      cell.addEventListener('click', ()=>{
        if(over||flagged[r][c]) return;
        if(!started){ started=true; tmr=setInterval(()=>{ secs++; body.querySelector('#msTimer').textContent='⏱ '+secs; }, 1000); }
        if(board[r][c]===-1){
          over=true; clearInterval(tmr);
          for(let rr=0;rr<rows;rr++) for(let cc=0;cc<cols;cc++) if(board[rr][cc]===-1) revealed[rr][cc]=true;
          body.querySelector('#msMsg').textContent='💥 Boom — try again.'; render(); return;
        }
        reveal(r,c);
        if(checkWin()){ over=true; clearInterval(tmr); body.querySelector('#msMsg').textContent='🏁 Cleared! Nice.'; unlockAchievement && unlockAchievement('minesweeper'); }
        render();
      });
      cell.addEventListener('contextmenu', (e)=>{
        e.preventDefault(); if(over||isRev) return;
        flagged[r][c]=!flagged[r][c];
        const left = mineCount - flagged.flat().filter(Boolean).length;
        body.querySelector('#msMines').textContent = left;
        render();
      });
      grid.appendChild(cell);
    }
  }
  body.querySelector('#msReset').addEventListener('click', newBoard);
  newBoard();
  return { onClose(){ clearInterval(tmr); } };
}});

/* ---- Password Generator (installable) ---- */
registerApp('pwgen', {title:'Password Generator', glyph:'⚿', color:'linear-gradient(135deg,#a259ff,#6d28d9)', w:420, h:400, installedShortcut:true, hiddenUntilInstalled:true, build(body){
  body.innerHTML = `<div class="pad" style="display:flex; flex-direction:column; gap:14px;">
    <div style="background:#0a0d13; border:2px solid var(--line); border-radius:var(--radius-sm); padding:14px; font-family:var(--mono); font-size:16px; color:var(--accent); text-align:center; word-break:break-all; min-height:26px;" id="pwOut">click generate</div>
    <div class="settings-row"><div><div class="lbl">Length</div></div><input id="pwLen" type="range" min="6" max="48" value="18" style="width:150px;"></div>
    <div style="display:flex; justify-content:space-between; font-family:var(--mono); font-size:11px; color:var(--muted); margin-top:-10px;"><span></span><span id="pwLenVal">18</span></div>
    <div class="settings-row"><div><div class="lbl">Uppercase (A-Z)</div></div><div class="toggle on" id="pwUpper"><div class="knob"></div></div></div>
    <div class="settings-row"><div><div class="lbl">Lowercase (a-z)</div></div><div class="toggle on" id="pwLower"><div class="knob"></div></div></div>
    <div class="settings-row"><div><div class="lbl">Numbers (0-9)</div></div><div class="toggle on" id="pwNums"><div class="knob"></div></div></div>
    <div class="settings-row"><div><div class="lbl">Symbols (!@#$…)</div></div><div class="toggle" id="pwSyms"><div class="knob"></div></div></div>
    <div style="display:flex; gap:8px;">
      <button id="pwGen" style="flex:1; background:var(--accent); color:#04231d; border:none; border-radius:var(--radius-sm); padding:10px; font-family:var(--pixel); font-size:11px; cursor:pointer;">Generate</button>
      <button id="pwCopy" style="flex:1; background:rgba(255,255,255,0.08); border:1px solid var(--line); color:var(--text); border-radius:var(--radius-sm); padding:10px; font-family:var(--mono); cursor:pointer;">Copy</button>
    </div>
    <div id="pwStrength" style="font-family:var(--mono); font-size:12px; color:var(--muted); text-align:center;"></div>
  </div>`;
  const sets = { u:'ABCDEFGHIJKLMNOPQRSTUVWXYZ', l:'abcdefghijklmnopqrstuvwxyz', n:'0123456789', s:'!@#$%^&*()-_=+[]{}' };
  function toggle(id){ const el=body.querySelector(id); return ()=>el.classList.contains('on'); }
  body.querySelectorAll('.toggle').forEach(t=>t.addEventListener('click', ()=>t.classList.toggle('on')));
  body.querySelector('#pwLen').addEventListener('input', e=>body.querySelector('#pwLenVal').textContent=e.target.value);
  function gen(){
    let pool='';
    if(body.querySelector('#pwUpper').classList.contains('on')) pool+=sets.u;
    if(body.querySelector('#pwLower').classList.contains('on')) pool+=sets.l;
    if(body.querySelector('#pwNums').classList.contains('on')) pool+=sets.n;
    if(body.querySelector('#pwSyms').classList.contains('on')) pool+=sets.s;
    if(!pool){ toast('Pick at least one character set'); return; }
    const len = +body.querySelector('#pwLen').value;
    const bytes = new Uint32Array(len); crypto.getRandomValues(bytes);
    let out=''; for(let i=0;i<len;i++) out += pool[bytes[i]%pool.length];
    body.querySelector('#pwOut').textContent = out;
    const variety = [body.querySelector('#pwUpper'),body.querySelector('#pwLower'),body.querySelector('#pwNums'),body.querySelector('#pwSyms')].filter(t=>t.classList.contains('on')).length;
    const score = len*variety;
    const label = score>90?'Strong':score>50?'Decent':'Weak — try more length or variety';
    body.querySelector('#pwStrength').textContent = label;
  }
  body.querySelector('#pwGen').addEventListener('click', gen);
  body.querySelector('#pwCopy').addEventListener('click', ()=>{
    const v = body.querySelector('#pwOut').textContent;
    if(v==='click generate') return;
    try{ navigator.clipboard && navigator.clipboard.writeText(v); }catch(e){}
    toast('Copied to clipboard');
  });
  gen();
}});

registerApp('achievements', {title:'Achievements', glyph:'🏆', color:'linear-gradient(135deg,#fbbf24,#f59e0b)', w:420, h:480, installedShortcut:true, hiddenUntilInstalled:true, build(body){
  body.innerHTML = `<div class="pad" id="achList"></div>`;
  body.querySelector('#achList').innerHTML = achievementDefs.map(a=>{
    const got = unlockedAchievements.has(a.key);
    return `<div class="settings-row"><div><div class="lbl" style="opacity:${got?1:0.45}">${got?'🏆':'🔒'} ${a.title}</div><div class="desc">${a.desc}</div></div></div>`;
  }).join('');
}});

/* ---- Store ---- */
const storeCatalog = [
  {id:'snake', name:'Snake', cat:'games', desc:'Classic snake with arrow-key controls', color:'linear-gradient(135deg,#4ade80,#16a34a)', rating:4.6, size:'0.2 MB'},
  {id:'weather', name:'Weather', cat:'utilities', desc:'Quick city weather lookup', color:'linear-gradient(135deg,#60a5fa,#2563eb)', rating:4.5, size:'0.3 MB'},
  {id:'timer', name:'Focus Timer', cat:'productivity', desc:'Pomodoro-style countdown ring', color:'linear-gradient(135deg,#fbbf24,#f59e0b)', rating:4.7, size:'0.2 MB'},
  {id:'kanban', name:'Kanban Board', cat:'productivity', desc:'Drag-and-drop task columns', color:'linear-gradient(135deg,#a78bfa,#7c3aed)', rating:4.4, size:'0.3 MB'},
  {id:'sudoku', name:'Sudoku', cat:'games', desc:'Two puzzles with conflict highlighting and a number pad', color:'linear-gradient(135deg,#f472b6,#db2777)', rating:4.3, size:'0.3 MB'},
  {id:'colorlab', name:'Color Lab', cat:'creative', desc:'Palette generator — click a swatch to copy its hex', color:'linear-gradient(135deg,#5eead4,#0d9488)', rating:4.6, size:'0.2 MB'},
  {id:'distros', name:'Distro Tracker', cat:'productivity', desc:'Log every distro you try and why you ragequit', color:'linear-gradient(135deg,#60a5fa,#2563eb)', rating:4.8, size:'0.2 MB'},
  {id:'dotfiles', name:'Dotfiles Sync', cat:'utilities', desc:'A satisfying (fake) dotfile sync animation', color:'linear-gradient(135deg,#a78bfa,#7c3aed)', rating:4.2, size:'0.1 MB'},
  {id:'mail', name:'Mail', cat:'productivity', desc:'Inbox, Sent and Trash, with a little in-universe lore', color:'linear-gradient(135deg,#fbbf24,#f59e0b)', rating:4.5, size:'0.4 MB'},
  {id:'taskmanager', name:'Task Manager', cat:'utilities', desc:'See what is running, and force-quit it', color:'linear-gradient(135deg,#fb7185,#be123c)', rating:4.4, size:'0.2 MB'},
  {id:'calendar', name:'Calendar', cat:'productivity', desc:'Month view with per-day events', color:'linear-gradient(135deg,#4ade80,#16a34a)', rating:4.5, size:'0.3 MB'},
  {id:'achievements', name:'Achievements', cat:'utilities', desc:'Track the easter eggs you have found', color:'linear-gradient(135deg,#fbbf24,#f59e0b)', rating:4.9, size:'0.1 MB'},
  {id:'procmon', name:'Process Monitor', cat:'utilities', desc:'A btop-style live process table you can sort and kill', color:'linear-gradient(135deg,#4ade80,#15803d)', rating:4.7, size:'0.3 MB'},
  {id:'gameoflife', name:'Game of Life', cat:'creative', desc:'Conway\'s cellular automaton — draw, randomize, watch it evolve', color:'linear-gradient(135deg,#33ccff,#1d4ed8)', rating:4.6, size:'0.2 MB'},
  {id:'asciiart', name:'ASCII Art', cat:'creative', desc:'Turns any short text into a big terminal-style banner', color:'linear-gradient(135deg,#33ff66,#166534)', rating:4.5, size:'0.2 MB'},
  {id:'hashtool', name:'Hash & Encode', cat:'utilities', desc:'SHA hashing plus Base64/URL encode and decode', color:'linear-gradient(135deg,#ff2e88,#9d174d)', rating:4.6, size:'0.2 MB'},
  {id:'minesweeper', name:'Minesweeper', cat:'games', desc:'The classic — left-click to reveal, right-click to flag', color:'linear-gradient(135deg,#ffb000,#b45309)', rating:4.7, size:'0.2 MB'},
  {id:'pwgen', name:'Password Generator', cat:'utilities', desc:'Configurable length and character sets, copies to clipboard', color:'linear-gradient(135deg,#a259ff,#6d28d9)', rating:4.8, size:'0.1 MB'},
];
const installed = new Set();
registerApp('store', {title:'Void Store', glyph:'⬒', color:'var(--accent2)', w:460, h:540, build(body){
  let cat='all';
  body.innerHTML = `<div class="store-cats" id="stCats"></div><div class="store-list" id="stList"></div>`;
  const cats = [['all','All'],['productivity','Productivity'],['creative','Creative'],['games','Games'],['utilities','Utilities']];
  const catsEl = body.querySelector('#stCats');
  cats.forEach(([id,label])=>{
    const b=document.createElement('button'); b.textContent=label; b.className = id==='all'?'active':'';
    b.addEventListener('click', ()=>{ cat=id; catsEl.querySelectorAll('button').forEach(x=>x.classList.remove('active')); b.classList.add('active'); renderList(); });
    catsEl.appendChild(b);
  });
  const listEl = body.querySelector('#stList');
  function renderList(){
    listEl.classList.remove('store-fade'); void listEl.offsetWidth; // restart the fade-in animation on every re-render
    listEl.innerHTML='';
    storeCatalog.filter(a=>cat==='all'||a.cat===cat).forEach(a=>{
      const card=document.createElement('div'); card.className='store-card';
      const isInstalled = installed.has(a.id);
      card.innerHTML = `<div class="icon" style="background:${a.color}"></div>
        <div class="info"><div class="n">${a.name}</div><div class="d">${a.desc}</div><div class="meta">${a.soon?'unavailable':('★ '+a.rating+' · '+a.size)}</div></div>
        <button class="${a.soon?'soon':(isInstalled?'installed':'')}">${a.soon?'Soon':(isInstalled?'Open':'Install')}</button>`;
      const btn = card.querySelector('button');
      btn.addEventListener('click', ()=>{
        if(a.soon) return;
        if(installed.has(a.id)){ launchApp(a.id); return; }
        btn.textContent='Installing…'; btn.disabled=true;
        setTimeout(()=>{
          installed.add(a.id); btn.textContent='Open'; btn.className='installed'; btn.disabled=false;
          refreshDock(); renderIcons(); refreshApplicationsFolder();
          toast(a.name+' installed', 'success'); launchApp(a.id);
        }, 700);
      });
      listEl.appendChild(card);
    });
    listEl.classList.add('store-fade');
  }
  renderList();
}});

refreshApplicationsFolder();

/* ============ LAUNCHER ============ */
function launchApp(id, args, origin){
  const def = APPS[id]; if(!def) return;
  if(def.hiddenUntilInstalled && !installed.has(id)){ toast('Install '+def.title+' from the Store first'); return; }
  if(id!=='editor'){
    return restoreOrOpen(id, ()=>{ openWindow(id, def.title, def.glyph, (body,winId)=>def.build(body,winId,args), {w:def.w,h:def.h,origin}); });
  }
  const fileNode = args && args.fileId ? FS[args.fileId] : null;
  openWindow(id, fileNode ? fileNode.name : def.title, def.glyph, (body,winId)=>def.build(body,winId,args), {w:def.w,h:def.h,origin});
}

/* ============ DOCK + ICONS RENDER ============ */
/* macOS-style dock magnification — icons scale/lift based on cursor
   proximity along the dock. Batched to one read+write per animation frame
   (via dockRaf) so fast mouse movement doesn't spam layout reads. */
let dockRaf = null, dockMouseX = null;
function applyDockMagnify(){
  dockRaf = null;
  if(dockMouseX==null) return;
  const MAX_DIST=100, MAX_SCALE=0.4, MAX_LIFT=8;
  dockRoot.querySelectorAll('.dock-item').forEach(item=>{
    const r = item.getBoundingClientRect();
    const dist = Math.abs(dockMouseX - (r.left + r.width/2));
    const proximity = Math.max(0, 1 - dist/MAX_DIST);
    item.style.transform = proximity>0 ? `translateY(${-MAX_LIFT*proximity}px) scale(${1+MAX_SCALE*proximity})` : '';
  });
}
dockRoot.addEventListener('mousemove', (e)=>{
  dockMouseX = e.clientX;
  if(!dockRaf) dockRaf = requestAnimationFrame(applyDockMagnify);
});
dockRoot.addEventListener('mouseleave', ()=>{
  dockMouseX = null;
  if(dockRaf){ cancelAnimationFrame(dockRaf); dockRaf=null; }
  dockRoot.querySelectorAll('.dock-item').forEach(item=>{ item.style.transform=''; });
});
function refreshDock(){
  dockRoot.innerHTML='';
  Object.entries(APPS).filter(([id,d])=>d.dock!==false && (!d.hiddenUntilInstalled || installed.has(id))).forEach(([id,d])=>{
    const item=document.createElement('div'); item.className='dock-item'; item.dataset.app=id; item.title=d.title;
    item.style.background=d.color; item.textContent=d.glyph;
    item.setAttribute('role','button'); item.setAttribute('tabindex','0'); item.setAttribute('aria-label', d.title);
    const launch = ()=>{
      const r = item.getBoundingClientRect();
      launchApp(id, undefined, {x:r.left+r.width/2, y:r.top+r.height/2});
    };
    item.addEventListener('click', launch);
    item.addEventListener('keydown', (e)=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); launch(); } });
    dockRoot.appendChild(item);
    if([...openWins.values()].some(w=>w.appId===id)) item.classList.add('running');
  });
}
function renderIcons(){
  const iconsRoot = document.getElementById('icons');
  iconsRoot.innerHTML='';
  Object.entries(APPS).filter(([id,d])=>d.desktopIcon!==false && (!d.hiddenUntilInstalled || installed.has(id))).forEach(([id,d])=>{
    const el=document.createElement('div'); el.className='dicon';
    el.innerHTML = `<div class="glyph" style="background:${d.color}">${d.glyph}</div><div class="label">${d.title}</div>`;
    el.setAttribute('role','button'); el.setAttribute('tabindex','0'); el.setAttribute('aria-label', d.title);
    const select = ()=>{ document.querySelectorAll('.dicon').forEach(x=>x.classList.remove('sel')); el.classList.add('sel'); };
    const launch = ()=>{
      const r = el.querySelector('.glyph').getBoundingClientRect();
      launchApp(id, undefined, {x:r.left+r.width/2, y:r.top+r.height/2});
    };
    el.addEventListener('click', select);
    el.addEventListener('dblclick', launch);
    el.addEventListener('keydown', (e)=>{
      if(e.key==='Enter'){ e.preventDefault(); launch(); }
      else if(e.key===' '){ e.preventDefault(); select(); }
    });
    iconsRoot.appendChild(el);
  });
}
document.getElementById('btnAbout').addEventListener('click', ()=>launchApp('about'));

/* ============ CONTEXT MENU ============ */
const ctxMenu = document.getElementById('ctxmenu');
function showCtx(x,y,items){
  ctxMenu.innerHTML = items.map((it,i)=>it.sep?'<div class="sep"></div>':`<div class="item" data-i="${i}">${it.label}</div>`).join('');
  ctxMenu._items = items;
  ctxMenu.style.left=x+'px'; ctxMenu.style.top=y+'px'; ctxMenu.style.display='block';
}
document.getElementById('desktop').addEventListener('contextmenu', (e)=>{
  if(e.target.closest('.win')||e.target.closest('.fm-entry')) return;
  e.preventDefault();
  showCtx(e.clientX, e.clientY, [
    {label:'Open Terminal', run:()=>launchApp('terminal')},
    {label:'Open Files', run:()=>launchApp('files')},
    {label:'Open Store', run:()=>launchApp('store')},
    {label:'Settings', run:()=>launchApp('settings')},
    {sep:true},
    {label:'Refresh icons', run:()=>{ renderIcons(); toast('Desktop refreshed'); }},
  ]);
});
document.addEventListener('click', (e)=>{
  if(!e.target.closest('#ctxmenu')) ctxMenu.style.display='none';
  else{
    const i = e.target.dataset.i;
    if(i!=null && ctxMenu._items[i]) ctxMenu._items[i].run();
    ctxMenu.style.display='none';
  }
});

/* ============ SPOTLIGHT SEARCH ============ */
const spotlight = document.getElementById('spotlight');
const spotInput = document.getElementById('spotInput');
const spotResults = document.getElementById('spotResults');
let spotSel = 0, spotItems = [];
function allFsFiles(){
  const out=[];
  Object.values(FS).forEach(n=>{ if(n.id!=='root' && n.type!=='folder') out.push(n); });
  return out;
}
function openSpotlight(){
  spotlight.style.display='flex'; spotInput.value=''; spotInput.focus(); renderSpot('');
}
function closeSpotlight(){ spotlight.style.display='none'; }
function renderSpot(q){
  const query=q.toLowerCase();
  const appMatches = Object.entries(APPS).filter(([id,d])=>(!d.hiddenUntilInstalled||installed.has(id)) && d.title.toLowerCase().includes(query))
    .map(([id,d])=>({label:d.title, tag:'App', run:()=>{ launchApp(id); closeSpotlight(); }}));
  const fileMatches = query ? allFsFiles().filter(n=>n.name.toLowerCase().includes(query)).slice(0,8)
    .map(n=>({label:n.name, tag:fsPath(n.id), run:()=>{ if(n.type==='image') launchApp('gallery'); else launchApp('editor',{fileId:n.id}); closeSpotlight(); }})) : [];
  const noteMatches = query ? notesData.filter(n=>(n.title||'').toLowerCase().includes(query)).slice(0,5)
    .map(n=>({label:n.title||'Untitled', tag:'Note', run:()=>{ launchApp('notes'); closeSpotlight(); }})) : [];
  spotItems = [...appMatches, ...fileMatches, ...noteMatches];
  spotSel=0;
  spotResults.innerHTML = spotItems.length ? spotItems.map((it,i)=>`<div class="r${i===0?' sel':''}" data-i="${i}"><span>${it.label}</span><span class="tag">${it.tag}</span></div>`).join('') : '<div class="r" style="color:var(--muted)">No matches</div>';
  spotResults.querySelectorAll('.r[data-i]').forEach(r=>r.addEventListener('click', ()=>spotItems[r.dataset.i].run()));
}
spotInput.addEventListener('input', ()=>renderSpot(spotInput.value));
spotInput.addEventListener('keydown', (e)=>{
  if(e.key==='Escape') closeSpotlight();
  else if(e.key==='ArrowDown'){ e.preventDefault(); spotSel=Math.min(spotItems.length-1, spotSel+1); updateSel(); }
  else if(e.key==='ArrowUp'){ e.preventDefault(); spotSel=Math.max(0, spotSel-1); updateSel(); }
  else if(e.key==='Enter'){ if(spotItems[spotSel]) spotItems[spotSel].run(); }
});
function updateSel(){ spotResults.querySelectorAll('.r').forEach((r,i)=>r.classList.toggle('sel', i===spotSel)); }
document.getElementById('btnSearch').addEventListener('click', openSpotlight);
spotlight.addEventListener('click', (e)=>{ if(e.target===spotlight) closeSpotlight(); });

/* ============ WINDOW SWITCHER (Alt+Tab) ============ */
const switcherEl = document.getElementById('switcher');
const switcherRow = document.getElementById('switcherRow');
let switchIdx = 0, altHeld=false;
function windowList(){ return [...openWins.entries()]; }
function showSwitcher(){
  const list = windowList(); if(!list.length) return;
  switcherEl.style.display='flex';
  switcherRow.innerHTML = list.map(([id,w],i)=>`<div class="item${i===switchIdx?' sel':''}" data-id="${id}"><div class="g">${APPS[w.appId]?APPS[w.appId].glyph:'▢'}</div><div class="n">${w.title}</div></div>`).join('');
}
function hideSwitcherAndFocus(){
  const list = windowList();
  switcherEl.style.display='none';
  if(list[switchIdx]) focusWin(list[switchIdx][0]);
  switchIdx=0;
}
window.addEventListener('keydown', (e)=>{
  if(e.ctrlKey && e.key.toLowerCase()==='k'){ e.preventDefault(); if(spotlight.style.display==='flex') closeSpotlight(); else openSpotlight(); }
  if(e.altKey && e.key==='Tab'){
    e.preventDefault(); altHeld=true;
    const list = windowList(); if(!list.length) return;
    switchIdx = (switchIdx+1) % list.length;
    showSwitcher();
  }
});
window.addEventListener('keyup', (e)=>{
  if(e.key==='Alt' && altHeld){ altHeld=false; hideSwitcherAndFocus(); }
});

/* ============ WELCOME ============ */
setTimeout(()=>{ launchApp('about'); toast('Welcome to VoidOS — try Ctrl+K'); }, 900);

/* ============ HYDRATE PERSISTED STATE ============
   Runs once at boot. Every load is individually guarded, so a problem with
   one saved key can never block the others — worst case, that one piece
   quietly falls back to its default. */
async function hydrateAll(){
  try{
    // Auto-detect any image sitting in wallpapers/ that isn't already one of
    // the two hardcoded entries (GitHub API / directory listing / manifest —
    // see loadBundledWallpapers). Runs before applyWallpaper() below so a
    // previously-selected auto-detected wallpaper resolves correctly.
    try{
      const folderWalls = await loadBundledWallpapers();
      if(folderWalls.length) wallpapers.push(...folderWalls);
    }catch(e){ /* network hiccup or unsupported host — just skip auto-detection */ }
    if(hasIDB()){
      const wallRecs = await wallDBLoadAll();
      if(wallRecs && wallRecs.length){
        customWallpapers = wallRecs.map(rec=>{
          const wp = { id: rec.id, label: rec.label||'My wallpaper', photo:true, css:'' };
          try{ wp.css = "linear-gradient(rgba(2,2,4,0.30),rgba(2,2,4,0.50)), url('"+URL.createObjectURL(rec.blob)+"') center/cover no-repeat"; }catch(e){}
          return wp;
        }).filter(wp=>wp.css);
      }
    }
    const savedSettings = await vLoad('voidos:settings', null);
    if(savedSettings){
      Object.assign(voidSettings, savedSettings);
      applyTheme(voidSettings.theme); applyWallpaper(voidSettings.wallpaper);
      applyPetVisible(voidSettings.pet); applyPetType(voidSettings.petType||'cat'); applyCRT(voidSettings.crt);
      applyLiveWallpaper(voidSettings.liveWallpaper||'off');
      applyTrail(voidSettings.trail); applyAutoLock(voidSettings.autoLock);
      if(typeof voidSettings.screensaver==='boolean') applyScreensaver(voidSettings.screensaver);
      if(typeof voidSettings.hyprMode==='boolean') applyHyprMode(voidSettings.hyprMode);
    }
    const savedFS = await vLoad('voidos:fs', null);
    const restoredFS = savedFS ? restoreFSFromSnapshot(savedFS) : false;

    const savedInstalled = await vLoad('voidos:installed', null);
    if(Array.isArray(savedInstalled)) savedInstalled.forEach(id=>{ if(APPS[id]) installed.add(id); });

    const savedNotes = await vLoad('voidos:notes', null);
    if(Array.isArray(savedNotes) && savedNotes.length){
      notesData.length=0; savedNotes.forEach(n=>notesData.push(n));
      notesSeq = Math.max(notesSeq, ...notesData.map(n=>(n.id||0)+1));
    }

    const savedKanban = await vLoad('voidos:kanban', null);
    if(savedKanban) Object.assign(kanbanData, savedKanban);

    const savedDistros = await vLoad('voidos:distros', null);
    if(Array.isArray(savedDistros) && savedDistros.length){
      distroData.length=0; savedDistros.forEach(d=>distroData.push(d));
      distroSeq = Math.max(distroSeq, ...distroData.map(d=>(d.id||0)+1));
    }

    const savedDotfiles = await vLoad('voidos:dotfiles', null);
    if(Array.isArray(savedDotfiles) && savedDotfiles.length){ dotfilesData.length=0; savedDotfiles.forEach(d=>dotfilesData.push(d)); }

    const savedMail = await vLoad('voidos:mail', null);
    if(savedMail) Object.assign(mailData, savedMail);

    const savedCalendar = await vLoad('voidos:calendar', null);
    if(savedCalendar) Object.assign(calendarEvents, savedCalendar);

    const savedAch = await vLoad('voidos:achievements', null);
    if(Array.isArray(savedAch)) savedAch.forEach(k=>unlockedAchievements.add(k));

    if(restoredFS) unlockAchievement('nightowl');

    if(voidSettings.restoreSession){
      const savedSession = await vLoad('voidos:session', null);
      if(Array.isArray(savedSession) && savedSession.length){
        savedSession.forEach(appId=>{
          if(!APPS[appId]) return;
          try{ launchApp(appId); }catch(e){ /* one broken app shouldn't block the rest */ }
        });
      }
    }
  }catch(e){ /* quietly fall back to session defaults */ }
  finally{
    refreshApplicationsFolder();
    renderIcons(); refreshDock();
  }
}
hydrateAll();

/* Keep the Store's "installed" set saved so re-launching still shows unlocked apps. */
const _origInstalledAdd = installed.add.bind(installed);
installed.add = function(id){ const r=_origInstalledAdd(id); vSave('voidos:installed', [...installed]); return r; };

})();
