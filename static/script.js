document.addEventListener('DOMContentLoaded', async () => {
    const terminalOutput = document.getElementById('terminalOutput');
    const inputArea = document.getElementById('domainInput');
    const promptLine = document.querySelector('.input-line');

    const bootSequence = [
        { text: "UPLINK ESTABLISHED.", delay: 300 },
        { text: "SIGNAL STRENGTH: 100%", delay: 100 },
        { text: "IDENTITY: VERIFIED", delay: 100 },
        { text: "ACCESSING DEPLOYMENT MATRIX...", delay: 600 },
        { text: "\n", delay: 200 }
    ];

    const helpMenu = `
DEPLOYMENT COMMANDS
-------------------
  > INSTALL    curl ci5.run/install | sh
  > RECOVER    curl ci5.run/recover | sh
  > SPEED      curl ci5.run/speed | sh

Type command to generate raw script url.
`;

    async function typeWriter(text, speed = 5) {
        for (let i = 0; i < text.length; i++) {
            terminalOutput.textContent += text.charAt(i);
            terminalOutput.scrollTop = terminalOutput.scrollHeight;
            await new Promise(r => setTimeout(r, speed));
        }
    }

    async function runBootSequence() {
        inputArea.style.display = 'none'; 
        promptLine.style.display = 'none';

        for (let line of bootSequence) {
            terminalOutput.textContent += line.text + "\n";
            await new Promise(r => setTimeout(r, line.delay));
        }

        await typeWriter(helpMenu, 2);
        
        promptLine.style.display = 'flex';
        inputArea.style.display = 'block';
        inputArea.focus();
    }

    runBootSequence();

    inputArea.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const cmd = this.value.trim().toLowerCase();
            this.value = '';

            terminalOutput.textContent += `root@ci5:~$ ${cmd}\n`;

            if (['help', 'ls', 'menu'].includes(cmd)) {
                terminalOutput.textContent += helpMenu + "\n";
            } else if (cmd === 'clear') {
                terminalOutput.textContent = '';
            } else if (['install', 'recover', 'speed', 'debug'].includes(cmd)) {
                terminalOutput.textContent += `\nEXECUTE ON TARGET:\n   curl ci5.run/${cmd} | sh\n\n`;
            } else if (cmd !== '') {
                terminalOutput.textContent += `Err: Command not found\n`;
            }
            
            terminalOutput.scrollTop = terminalOutput.scrollHeight;
        }
    });
    
    document.addEventListener('click', () => inputArea.focus());
});