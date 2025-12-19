document.addEventListener('DOMContentLoaded', async () => {
    const out = document.getElementById('terminalOutput');
    const input = document.getElementById('domainInput');
    const termWindow = document.getElementById('terminalWindow');
    const header = document.getElementById('headerHandle');
    
    // Controls
    const minBtn = document.getElementById('minBtn');
    const maxBtn = document.getElementById('maxBtn');
    const closeBtn = document.getElementById('closeBtn');
    const taskbar = document.getElementById('taskbar');
    const restoreBtn = document.getElementById('restoreBtn');

    // --- 1. SOVEREIGN MODE DETECTION ---
    function isSovereignMode() {
        const h = window.location.hostname;
        return h.includes('ipfs') || h.includes('.eth') || h.includes('localhost') || h.includes('limo');
    }

    // Selection protection
    document.addEventListener('click', (e) => {
        if (window.getSelection().type !== 'Range') {
            input.focus();
        }
    });

    // --- 2. LIVE STATS LOGIC ---
    let globalCount = 0; 
    
    async function fetchGlobalCount() {
        try {
            if (isSovereignMode()) return; 
            const res = await fetch('/api/stats'); 
            if (res.ok) {
                const data = await res.json();
                globalCount = data.count || globalCount;
            }
        } catch (e) {
            // Silently fail
        }
        updateStatusLine();
    }

    function updateStatusLine() {
        const statusEl = document.getElementById('live-status');
        if (statusEl) {
            statusEl.innerHTML = globalCount.toLocaleString();
        }
    }

    setInterval(fetchGlobalCount, 15000);

    // --- 3. RESIZE & DRAG LOGIC ---
    const resizers = document.querySelectorAll('.resizer');
    let isResizing = false;
    
    resizers.forEach(resizer => {
        resizer.addEventListener('mousedown', (e) => {
            e.preventDefault();
            isResizing = true;
            termWindow.style.transition = 'none'; 
            const rect = termWindow.getBoundingClientRect();
            const startX = e.clientX;
            const startY = e.clientY;
            const startWidth = rect.width;
            const startHeight = rect.height;
            const startTop = rect.top;
            const startLeft = rect.left;
            
            const onMouseMove = (moveEvent) => {
                const dx = moveEvent.clientX - startX;
                const dy = moveEvent.clientY - startY;
                
                if (resizer.classList.contains('e') || resizer.classList.contains('ne') || resizer.classList.contains('se')) {
                    termWindow.style.width = `${startWidth + dx}px`;
                }
                if (resizer.classList.contains('s') || resizer.classList.contains('se') || resizer.classList.contains('sw')) {
                    termWindow.style.height = `${startHeight + dy}px`;
                }
                if (resizer.classList.contains('w') || resizer.classList.contains('nw') || resizer.classList.contains('sw')) {
                    termWindow.style.width = `${startWidth - dx}px`;
                    termWindow.style.left = `${startLeft + dx}px`;
                }
                if (resizer.classList.contains('n') || resizer.classList.contains('ne') || resizer.classList.contains('nw')) {
                    termWindow.style.height = `${startHeight - dy}px`;
                    termWindow.style.top = `${startTop + dy}px`;
                }
            };

            const onMouseUp = () => {
                isResizing = false;
                termWindow.style.transition = 'opacity 0.3s, transform 0.1s';
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
    });

    let isDragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    header.addEventListener('mousedown', (e) => {
        if (e.target.tagName === 'BUTTON' || isResizing) return;
        
        isDragging = true;
        header.style.cursor = 'grabbing';
        termWindow.style.transition = 'none';

        if (termWindow.classList.contains('maximized')) {
            termWindow.classList.remove('maximized');
            termWindow.style.top = (e.clientY - 20) + 'px';
            termWindow.style.left = (e.clientX - (termWindow.offsetWidth / 2)) + 'px';
        }

        const rect = termWindow.getBoundingClientRect();
        dragOffsetX = e.clientX - rect.left;
        dragOffsetY = e.clientY - rect.top;
        termWindow.style.width = rect.width + 'px';
        termWindow.style.height = rect.height + 'px';
        termWindow.style.transform = 'none';
        termWindow.style.left = rect.left + 'px';
        termWindow.style.top = rect.top + 'px';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        termWindow.style.left = (e.clientX - dragOffsetX) + 'px';
        termWindow.style.top = (e.clientY - dragOffsetY) + 'px';
    });

    document.addEventListener('mouseup', () => {
        if(isDragging) {
            isDragging = false;
            header.style.cursor = 'default';
            termWindow.style.transition = 'opacity 0.3s, transform 0.1s';
        }
    });

    // --- 4. WINDOW CONTROLS ---
    minBtn.addEventListener('click', () => {
        termWindow.classList.add('minimized');
        taskbar.classList.remove('hidden');
    });
    restoreBtn.addEventListener('click', () => {
        termWindow.classList.remove('minimized');
        taskbar.classList.add('hidden');
    });
    maxBtn.addEventListener('click', () => {
        termWindow.classList.toggle('maximized');
    });
    closeBtn.addEventListener('click', () => {
        termWindow.classList.add('closing-anim');
        setTimeout(() => {
            termWindow.style.display = 'none'; 
            termWindow.classList.remove('closing-anim');
            setTimeout(() => {
                termWindow.style.display = 'flex';
                termWindow.style.opacity = '0'; 
                termWindow.style.top = '50%';
                termWindow.style.left = '50%';
                termWindow.style.transform = 'translate(-50%, -50%)';
                termWindow.style.width = ''; 
                termWindow.style.height = ''; 
                termWindow.classList.remove('maximized', 'minimized');
                out.innerHTML = ''; 
                setTimeout(() => {
                    termWindow.style.transition = 'opacity 0.5s';
                    termWindow.style.opacity = '1';
                    setTimeout(() => {
                        termWindow.style.transition = 'opacity 0.3s, transform 0.1s';
                        init(); 
                    }, 500);
                }, 100);
            }, 4000); 
        }, 250); 
    });

    // --- 5. TERMINAL BOOT & COMMANDS ---
    function getBootSequence() {
        const isSov = isSovereignMode();
        const release = "https://github.com/dreamswag/ci5/releases/latest/download";

        // Logic
        const c_free = isSov ? `curl -L ${release}/install-full.sh | sh` : "curl ci5.run/free | sh";
        const c_base = "curl ci5.run/base | sh";
        const c_auto = "curl ci5.run/auto | sh"; // The Overwatch Script
        const c_fast = "curl ci5.run/fast | sh";
        const c_true = "curl ci5.run/true | sh";
        const c_heal = "curl ci5.run/heal | sh";
        const c_eject = "curl ci5.run/3j3ct | sh";
        const c_home = "curl ci5.run/home | sh";
        const c_away = "curl ci5.run/away | sh";
        const c_4ev3r = "curl ci5.run/4ev3r | sh";

        return [
            "<span class='green'>UPLINK ESTABLISHED.</span>",
            "IDENTITY: [<span class='red'>TELEMETRY_ERR:41</span><span id='glitch'>0</span>]",
            isSov ? "<span class='purple'>[ SOVEREIGN MIRROR ACTIVE ]</span>" : "",
            
            `OASIS CHECKPOINT: <span class='purple' id='live-status'>${globalCount.toLocaleString()}</span> SOVEREIGNS`,
            "<span class='ghost'>...send word if you make it</span>", 
            
            "\n<span class='dim'>COMMAND PROTOCOLS</span>",
            "<span class='dim'>--------------------</span>",
            `  > <span class='green'>FREE</span>       ${c_free}`, // Install
            `  > <span class='purple'>3J3CT</span>      ${c_eject}`, // The Black Box
            `  > <span class='cyan'>BASE</span>       ${c_base}`, // Modular Revert
            `  > <span class='cyan'>AUTO</span>       ${c_auto}`, // Docker Overwatch
            `  > <span class='cyan'>FAST</span>       ${c_fast}`, // Speed
            `  > <span class='purple'>TRUE</span>       ${c_true}`, // Audit
            `  > <span class='purple'>HEAL</span>       ${c_heal}`, // Emergency
            `  > <span class='orange'>HOME</span>       ${c_home}`, // Tailscale
            `  > <span class='orange'>AWAY</span>       ${c_away}`, // VPN Combo
            `  > <span class='red'>4EV3R</span>      ${c_4ev3r}`, // Uninstall
            "\n"
        ];
    }

    function startGlitch() {
        const el = document.getElementById('glitch');
        if (!el) return;
        const glitchLoop = () => {
            setTimeout(() => {
                el.textContent = '7';
                el.style.opacity = '0.8';
                setTimeout(() => {
                    el.textContent = '0';
                    el.style.opacity = '1';
                    glitchLoop(); 
                }, 80);
            }, Math.random() * 9000 + 3000);
        };
        glitchLoop();
    }

    async function init() {
        fetchGlobalCount(); 
        const boot = getBootSequence();
        for (let line of boot) {
            if(line === "") continue;
            out.innerHTML += line + "\n";
            out.scrollTop = out.scrollHeight;
            await new Promise(r => setTimeout(r, 40));
        }
        startGlitch();
    }

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const val = input.value.trim().toLowerCase();
            input.value = '';
            
            out.innerHTML += `<span class='green'>root@ci5:~$</span> <span class='white'>${val}</span>\n`;

            if (['install', 'bootstrap'].includes(val)) out.innerHTML += `<span class='red'>Err: PARADIGM OBSOLETE. USE 'FREE'</span>\n`;
            
            // --- UPDATED COMMAND DESCRIPTIONS ---
            
            else if (val === 'free') out.innerHTML += `\n<span class='cyan'>GENESIS / INSTALL:</span> <span class='white'>The primary transformation.</span>\n<span class='dim'>Nukes Pi OS networking, installs Ci5 core, and creates a local factory-restore point.</span>\n<span class='dim'>RUN:</span> curl ci5.run/free | sh\n\n`;
            
            else if (val === '3j3ct' || val === 'eject') out.innerHTML += `\n<span class='purple'>EXODUS / SALVAGE:</span> <span class='white'>The Black Box Recorder.</span>\n<span class='dim'>Packs your logs, custom configs, and Docker volumes into a portable archive (to USB or Boot partition) so you can wipe the card and reinstall safely.</span>\n<span class='dim'>RUN:</span> curl ci5.run/3j3ct | sh\n\n`;

            else if (val === 'base') out.innerHTML += `\n<span class='cyan'>REVERT / MODULAR:</span> <span class='white'>Targeted Configuration Reset.</span>\n<span class='dim'>Interactive tool to fix specific components (e.g. "Reset AdGuard Only") without nuking the OS. Uses local factory image if offline.</span>\n<span class='dim'>RUN:</span> curl ci5.run/base | sh\n\n`;

            else if (val === 'auto') out.innerHTML += `\n<span class='cyan'>MAINTAIN / OVERWATCH:</span> <span class='white'>Automated Docker Updates.</span>\n<span class='dim'>Configures 'Watchtower' to automatically update Core Ci5 Containers (AdGuard, Unbound). Smart-scoped to ignore user-customized containers to prevent breakage.</span>\n<span class='dim'>RUN:</span> curl ci5.run/auto | sh\n\n`;
            
            else if (val === 'fast') out.innerHTML += `\n<span class='cyan'>ACCELERATE / TUNE:</span> <span class='white'>Bandwidth discipline.</span>\n<span class='dim'>Executes local speed test and auto-tunes CAKE SQM limits.</span>\n<span class='dim'>RUN:</span> curl ci5.run/fast | sh\n\n`;
            
            else if (val === 'true') out.innerHTML += `\n<span class='purple'>AUDIT / VERIFY:</span> <span class='white'>Integrity Check.</span>\n<span class='dim'>ONLINE: Checks for available updates from repo.\nOFFLINE: Validates local files against the install-time Factory Image to detect corruption.</span>\n<span class='dim'>RUN:</span> curl ci5.run/true | sh\n\n`;
            
            else if (val === 'heal') out.innerHTML += `\n<span class='purple'>REVIVE / UNLOCK:</span> <span class='white'>Anti-Lockout Defibrillator.</span>\n<span class='dim'>Resets Firewall/SSH rules to safe-mode defaults to regain access. Does NOT touch Docker data.</span>\n<span class='dim'>RUN:</span> curl ci5.run/heal | sh\n\n`;
            
            else if (val === 'home') out.innerHTML += `\n<span class='orange'>CONNECT / LOCAL:</span> <span class='white'>Tailscale Subnet Router.</span>\n<span class='dim'>Zero-conf setup to access your home LAN from anywhere.</span>\n<span class='dim'>RUN:</span> curl ci5.run/home | sh\n\n`;
            
            else if (val === 'away') out.innerHTML += `\n<span class='orange'>ROAM / HYBRID:</span> <span class='white'>The Ultimate Link.</span>\n<span class='dim'>Combines Wireguard (Privacy) with Tailscale (Access).</span>\n<span class='dim'>RUN:</span> curl ci5.run/away | sh\n\n`;
            
            else if (val === '4ev3r' || val === 'nuke') out.innerHTML += `\n<span class='red'>DEATH / UNINSTALL:</span> <span class='white'>Total Reversal.</span>\n<span class='dim'>Strips all Ci5 modifications. (RECOMMENDED: Run 3J3CT first to save data).</span>\n<span class='dim'>RUN:</span> curl ci5.run/4ev3r | sh\n\n`;

            else if (val === 'clear') out.textContent = ''; 
            else if (val !== '') out.innerHTML += `<span class='dim'>Err: Unknown command</span>\n`;
            
            out.scrollTop = out.scrollHeight;
        }
    });

    init();
});