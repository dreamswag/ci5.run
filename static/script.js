document.addEventListener('DOMContentLoaded', async () => {
    const out = document.getElementById('terminalOutput');
    const input = document.getElementById('domainInput');

    const boot = [
        "UPLINK ESTABLISHED.",
        "IDENTITY: [CAN'T TELEMETRY]",
        "PROCEED...",
        "\nDEPLOYMENT COMMANDS",
        "-------------------",
        "  > INSTALL    curl ci5.run/install | sh",
        "  > RECOVER    curl ci5.run/recover | sh",
        "  > SPEED      curl ci5.run/speed | sh",
        "\n"
    ];

    async function init() {
        for (let line of boot) {
            out.textContent += line + "\n";
            await new Promise(r => setTimeout(r, 80));
        }
    }

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const val = input.value.trim().toLowerCase();
            input.value = '';
            out.textContent += `root@ci5:~$ ${val}\n`;

            if (['install', 'recover', 'speed'].includes(val)) {
                out.textContent += `\nRUN ON TARGET:\ncurl ci5.run/${val} | sh\n\n`;
            } else if (val === 'clear') {
                out.textContent = '';
            } else {
                out.textContent += `Err: Unknown command\n`;
            }
            out.scrollTop = out.scrollHeight;
        }
    });

    document.addEventListener('click', () => input.focus());
    init();
});