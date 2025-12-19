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
        const c_ward = "curl ci5.run/ward | sh"; 
        const c_rrul = "curl ci5.run/rrul | sh";
        const c_base = "curl ci5.run/base | sh";
        const c_auto = "curl ci5.run/auto | sh"; // The Overwatch Script
        const c_fast = "curl ci5.run/fast | sh";
        const c_true = "curl ci5.run/true | sh";
        const c_heal = "curl ci5.run/heal | sh";
        const c_safe = "curl ci5.run/safe | sh"; 
        const c_home = "curl ci5.run/home | sh";
        const c_away = "curl ci5.run/away | sh";
        const c_hide = "curl ci5.run/hide | sh";
        const c_void = "curl ci5.run/void | sh";

        return [
            "<span class='green'>UPLINK ESTABLISHED.</span>",
            "IDENTITY: [<span class='red'>TELEMETRY_ERR:41</span><span id='glitch'>0</span>]",
            isSov ? "<span class='purple'>[ SOVEREIGN MIRROR ACTIVE ]</span>" : "",
            
            `OASIS CHECKPOINT: <span class='purple' id='live-status'>${globalCount.toLocaleString()}</span> SOVEREIGNS`,
            "<span class='ghost'>...send word if you make it</span>", 
            
            "\n<span class='dim'>COMMAND PROTOCOLS</span>",
            "<span class='dim'>--------------------</span>",
            `  > <span class='green'>FREE</span>       ${c_free}`, // Install
            `  > <span class='green'>WARD</span>       ${c_ward}`, // AdGuard Control
            `  > <span class='cyan'>RRUL</span>       ${c_rrul}`, // Benchmark
            `  > <span class='cyan'>FAST</span>       ${c_fast}`, // Speed/SQM
            `  > <span class='cyan'>AUTO</span>       ${c_auto}`, // Updates
            `  > <span class='cyan'>BASE</span>       ${c_base}`, // Modular Revert
            `  > <span class='purple'>TRUE</span>       ${c_true}`, // Audit
            `  > <span class='purple'>HEAL</span>       ${c_heal}`, // Emergency
            `  > <span class='purple'>SAFE</span>       ${c_safe}`, // Backup/Eject
            `  > <span class='orange'>HOME</span>       ${c_home}`, // Tailscale
            `  > <span class='orange'>AWAY</span>       ${c_away}`, // VPN Combo
            `  > <span class='orange'>HIDE</span>       ${c_hide}`, // Privacy
            `  > <span class='red'>VOID</span>       ${c_void}`, // Uninstall
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
            
            else if (val === 'free') out.innerHTML += `\n<span class='cyan'>GENESIS / INSTALL:</span> <span class='white'>The Transformation.</span>\n<span class='dim'>Wipes Pi OS and flashes the Ci5 Golden Image (OpenWrt).</span>\n<span class='dim'>RUN:</span> curl ci5.run/free | sh\n\n`;
            
            else if (val === 'ward') out.innerHTML += `\n<span class='green'>DEFEND / ADGUARD:</span> <span class='white'>DNS Manager.</span>\n<span class='dim'>Interactive tool to restart AdGuard, view logs, or update blocklists.</span>\n<span class='dim'>RUN:</span> curl ci5.run/ward | sh\n\n`;

            else if (val === 'rrul') out.innerHTML += `\n<span class='cyan'>STRESS / BENCHMARK:</span> <span class='white'>Bufferbloat Test.</span>\n<span class='dim'>Executes the 'RRUL' load test against Ci5 servers to verify network stability under load.</span>\n<span class='dim'>RUN:</span> curl ci5.run/rrul | sh\n\n`;

            else if (val === 'base') out.innerHTML += `\n<span class='cyan'>REVERT / MODULAR:</span> <span class='white'>Targeted Configuration Reset.</span>\n<span class='dim'>Resets specific components (e.g. "Reset AdGuard Only") without nuking the OS.</span>\n<span class='dim'>RUN:</span> curl ci5.run/base | sh\n\n`;

            else if (val === 'auto') out.innerHTML += `\n<span class='cyan'>MAINTAIN / OVERWATCH:</span> <span class='white'>Automated Updates.</span>\n<span class='dim'>Configures Watchtower to automatically update Core Ci5 Containers (AdGuard, Unbound). Smart-scoped to ignore user-customized containers.</span>\n<span class='dim'>RUN:</span> curl ci5.run/auto | sh\n\n`;
            
            else if (val === 'fast') out.innerHTML += `\n<span class='cyan'>ACCELERATE / TUNE:</span> <span class='white'>Bandwidth discipline.</span>\n<span class='dim'>Executes local speed test and auto-tunes CAKE SQM limits.</span>\n<span class='dim'>RUN:</span> curl ci5.run/fast | sh\n\n`;
            
            else if (val === 'true') out.innerHTML += `\n<span class='purple'>AUDIT / VERIFY:</span> <span class='white'>Integrity Check.</span>\n<span class='dim'>Validates local files against the Factory Image to detect corruption.</span>\n<span class='dim'>RUN:</span> curl ci5.run/true | sh\n\n`;
            
            else if (val === 'heal') out.innerHTML += `\n<span class='purple'>REVIVE / UNLOCK:</span> <span class='white'>Anti-Lockout Defibrillator.</span>\n<span class='dim'>Resets Firewall/SSH rules to safe-mode defaults to regain access. Does NOT touch Docker data.</span>\n<span class='dim'>RUN:</span> curl ci5.run/heal | sh\n\n`;
            
            else if (val === 'safe') out.innerHTML += `\n<span class='purple'>BACKUP / EJECT:</span> <span class='white'>The Black Box.</span>\n<span class='dim'>Packs your logs, custom configs, and Docker volumes into a portable archive (to USB) so you can wipe and reinstall safely.</span>\n<span class='dim'>RUN:</span> curl ci5.run/safe | sh\n\n`;
            
            else if (val === 'home') out.innerHTML += `\n<span class='orange'>CONNECT / LOCAL:</span> <span class='white'>Tailscale Subnet Router.</span>\n<span class='dim'>Zero-conf setup to access your home LAN from anywhere.</span>\n<span class='dim'>RUN:</span> curl ci5.run/home | sh\n\n`;
            
            else if (val === 'away') out.innerHTML += `\n<span class='orange'>ROAM / HYBRID:</span> <span class='white'>The Ultimate Link.</span>\n<span class='dim'>Combines Wireguard (Privacy) with Tailscale (Access).</span>\n<span class='dim'>RUN:</span> curl ci5.run/away | sh\n\n`;
            
            else if (val === 'void') out.innerHTML += `\n<span class='red'>DEATH / UNINSTALL:</span> <span class='white'>Total Reversal.</span>\n<span class='dim'>Strips all Ci5 modifications. (RECOMMENDED: Run SAFE first).</span>\n<span class='dim'>RUN:</span> curl ci5.run/void | sh\n\n`;

            else if (val === 'clear') out.textContent = ''; 
            else if (val !== '') out.innerHTML += `<span class='dim'>Err: Unknown command</span>\n`;
            
            out.scrollTop = out.scrollHeight;
        }
    });

    init();
});