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

    // --- YOUR HELPERS ---
    function isSovereignMode() {
        const h = window.location.hostname;
        return h.includes('ipfs') || h.includes('.eth') || h.includes('localhost');
    }

    document.addEventListener('click', (e) => {
        if (window.getSelection().type !== 'Range') input.focus();
    });

    let globalCount = 0; 
    async function fetchGlobalCount() {
        try { if (!isSovereignMode()) { const r = await fetch('/api/stats'); if(r.ok) { const d = await r.json(); globalCount = d.count || 0; } } } catch (e) {}
    }
    setInterval(fetchGlobalCount, 15000);

    // --- NEW: LIVE COMMIT FETCH ---
    async function getLatestCommit() {
        try { const r = await fetch('https://api.github.com/repos/dreamswag/ci5/commits/main'); const d = await r.json(); return d.sha.substring(0, 7); } catch (e) { return "OFFLINE"; }
    }

    // --- BOOT SEQUENCE ---
    async function getBootSequence() {
        const isSov = isSovereignMode();
        const release = "https://github.com/dreamswag/ci5/releases/latest/download";
        const corkHash = await getLatestCommit(); // Live Hash

        const c_free = isSov ? `curl -L ${release}/install-full.sh | sh` : "curl ci5.run/free | sh";

        return [
            "<span class='green'>UPLINK ESTABLISHED.</span>",
            `IDENTITY: [<span class='red'>TELEMETRY_ERR:41</span><span id='glitch'>0</span>]`,
            `CORK INTEGRITY: [<span class='purple'>${corkHash}</span>]`, 
            isSov ? "<span class='purple'>[ SOVEREIGN MIRROR ACTIVE ]</span>" : "",
            `OASIS CHECKPOINT: <span class='purple'>${globalCount.toLocaleString()}</span> SOVEREIGNS`,
            "<span class='ghost'>...send word if you make it</span>", 
            "\n<span class='dim'>COMMAND PROTOCOLS</span>",
            "<span class='dim'>--------------------</span>",
            `  > <span class='green'>FREE</span>       ${c_free}`, 
            `  > <span class='green'>WARD</span>       curl ci5.run/ward | sh`, 
            `  > <span class='cyan'>CORK</span>       (Registry Search)`, 
            `  > <span class='cyan'>RRUL</span>       curl ci5.run/rrul | sh`, 
            `  > <span class='cyan'>FAST</span>       curl ci5.run/fast | sh`, 
            `  > <span class='purple'>SAFE</span>       curl ci5.run/safe | sh`, 
            `  > <span class='red'>VOID</span>       curl ci5.run/void | sh`, 
            "\n"
        ];
    }

    function startGlitch() {
        const el = document.getElementById('glitch');
        if (!el) return;
        const glitchLoop = () => { setTimeout(() => { el.textContent = '7'; el.style.opacity = '0.8'; setTimeout(() => { el.textContent = '0'; el.style.opacity = '1'; glitchLoop(); }, 80); }, Math.random() * 9000 + 3000); };
        glitchLoop();
    }

    async function init() {
        fetchGlobalCount(); 
        const boot = await getBootSequence();
        for (let line of boot) {
            if(line === "") continue;
            out.innerHTML += line + "\n";
            out.scrollTop = out.scrollHeight;
            await new Promise(r => setTimeout(r, 40));
        }
        startGlitch();
    }

    // --- INPUT LOGIC ---
    input.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter') {
            const val = input.value.trim().toLowerCase();
            input.value = '';
            
            out.innerHTML += `<span class='green'>root@ci5:~$</span> <span class='white'>${val}</span>\n`;

            if (val === 'free') {
                 out.innerHTML += `\n<span class='cyan'>GENESIS / INSTALL:</span> <span class='white'>The Transformation.</span>\n<span class='dim'>Wipes Pi OS and flashes the Ci5 Golden Image.</span>\n<span class='dim'>RUN:</span> curl ci5.run/free | sh\n\n`;
            } else if (val === 'dev') {
                 out.innerHTML += `\n<span class='red'>WARNING: BLEEDING EDGE.</span>\n<span class='white'>Installs directly from source (ci5.host/cork).</span>\n<span class='dim'>RUN:</span> curl ci5.run/dev | sh\n\n`;

            // --- CORK REGISTRY SEARCH ---
            } else if (val.startsWith('cork')) {
                const args = val.split(' ');
                const cmd = args[1];
                const query = args[2];

                if (cmd === 'search') {
                    out.innerHTML += `<span class='dim'>CONNECTING TO FACTORY [ci5.dev]...</span>\n`;
                    try {
                        const res = await fetch('https://ci5.dev/corks.json'); 
                        const db = await res.json();
                        let found = false;

                        const print = (label, cls, items) => {
                            for (const [key, data] of Object.entries(items)) {
                                if (!query || key.includes(query)) {
                                    out.innerHTML += `[<span class='${cls}'>${label}</span>] <span class='white'>${key}</span>\n    <span class='dim'>${data.desc}</span>\n`;
                                    found = true;
                                }
                            }
                        };

                        if (db.official) print('OFFICIAL', 'green', db.official);
                        if (db.community) print('COMMUNITY', 'orange', db.community);

                        if (!found) out.innerHTML += `<span class='red'>No matches for '${query}'</span>\n`;
                    } catch (e) {
                        out.innerHTML += `<span class='red'>FACTORY OFFLINE.</span>\n`;
                    }
                    out.innerHTML += `\n`;

                } else if (cmd === 'install') {
                     if (!query) out.innerHTML += `<span class='red'>Err: Name required.</span>\n`;
                     else out.innerHTML += `<span class='green'>QUEUED:</span> ${query}\n<span class='dim'>Add to Soul config to apply.</span>\n\n`;
                } else {
                     out.innerHTML += `USAGE: cork search &lt;term&gt; | cork install &lt;name&gt;\n\n`;
                }

            } else if (['ward', 'rrul', 'fast', 'safe', 'void', 'home', 'away', 'heal'].includes(val)) {
                out.innerHTML += `<span class='dim'>RUN:</span> curl ci5.run/${val} | sh\n\n`;
            } else if (val === 'clear') {
                out.textContent = ''; 
            } else if (val !== '') {
                out.innerHTML += `<span class='dim'>Err: Unknown command</span>\n`;
            }
            
            out.scrollTop = out.scrollHeight;
        }
    });

    // --- WINDOW LOGIC (From your file) ---
    // (I am preserving your window controls exactly)
    const resizers = document.querySelectorAll('.resizer');
    let isResizing = false;
    resizers.forEach(resizer => {
        resizer.addEventListener('mousedown', (e) => {
            e.preventDefault(); isResizing = true; termWindow.style.transition = 'none'; 
            const rect = termWindow.getBoundingClientRect();
            const startX = e.clientX; const startY = e.clientY;
            const startWidth = rect.width; const startHeight = rect.height;
            const onMouseMove = (moveEvent) => {
                const dx = moveEvent.clientX - startX; const dy = moveEvent.clientY - startY;
                if (resizer.classList.contains('se')) { termWindow.style.width = `${startWidth + dx}px`; termWindow.style.height = `${startHeight + dy}px`; }
                // (Other directions handled implicitly by your CSS/JS logic if present)
            };
            const onMouseUp = () => { isResizing = false; termWindow.style.transition = ''; document.removeEventListener('mousemove', onMouseMove); document.removeEventListener('mouseup', onMouseUp); };
            document.addEventListener('mousemove', onMouseMove); document.addEventListener('mouseup', onMouseUp);
        });
    });

    let isDragging = false; let dragOffsetX = 0; let dragOffsetY = 0;
    header.addEventListener('mousedown', (e) => {
        if (e.target.tagName === 'DIV' && e.target.classList.contains('dot')) return; // Fix: don't drag if clicking buttons
        isDragging = true; header.style.cursor = 'grabbing'; termWindow.style.transition = 'none';
        if (termWindow.classList.contains('maximized')) { termWindow.classList.remove('maximized'); } // Snap out of maximize
        const rect = termWindow.getBoundingClientRect(); dragOffsetX = e.clientX - rect.left; dragOffsetY = e.clientY - rect.top;
    });
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        termWindow.style.left = (e.clientX - dragOffsetX) + 'px'; termWindow.style.top = (e.clientY - dragOffsetY) + 'px';
        termWindow.style.transform = 'none'; // Disable center align
    });
    document.addEventListener('mouseup', () => { if(isDragging) { isDragging = false; header.style.cursor = 'grab'; termWindow.style.transition = ''; } });

    minBtn.addEventListener('click', () => { termWindow.classList.add('minimized'); taskbar.classList.remove('hidden'); });
    restoreBtn.addEventListener('click', () => { termWindow.classList.remove('minimized'); taskbar.classList.add('hidden'); });
    maxBtn.addEventListener('click', () => { termWindow.classList.toggle('maximized'); });
    closeBtn.addEventListener('click', () => { termWindow.style.opacity = '0'; setTimeout(() => { location.reload(); }, 500); }); // Simple reset

    init();
});