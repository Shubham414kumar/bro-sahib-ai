
export class SystemService {
  static executeCommand(command: string): string {
    const lowerCommand = command.toLowerCase();
    
    // Note: Browser security prevents direct system access
    // These are simulated responses with instructions for the user
    
    if (lowerCommand.includes('notepad')) {
      // Try to open a simple text editor interface
      this.openNotepad();
      return 'Opening Notepad interface for you...';
    } else if (lowerCommand.includes('chrome') || lowerCommand.includes('browser')) {
      this.openChrome();
      return 'Opening a new browser tab...';
    } else if (lowerCommand.includes('calculator')) {
      this.openCalculator();
      return 'Opening calculator...';
    } else if (lowerCommand.includes('music') || lowerCommand.includes('spotify')) {
      this.openMusic();
      return 'Trying to open music application...';
    } else {
      return `I can help you open: Notepad, Chrome/Browser, Calculator, or Music apps. Due to browser security, I'll open web versions or provide instructions.`;
    }
  }

  private static openNotepad(): void {
    const notepadWindow = window.open('', '_blank', 'width=600,height=400');
    if (notepadWindow && notepadWindow.document) {
      // Secure DOM manipulation instead of document.write
      const doc = notepadWindow.document;
      
      // Create elements securely
      const html = doc.createElement('html');
      const head = doc.createElement('head');
      const title = doc.createElement('title');
      title.textContent = 'JARVIS Notepad';
      
      const body = doc.createElement('body');
      body.style.cssText = 'margin:0;padding:20px;font-family:monospace;';
      
      const heading = doc.createElement('h3');
      heading.textContent = 'JARVIS Notepad';
      
      const textarea = doc.createElement('textarea');
      textarea.style.cssText = 'width:100%;height:300px;font-size:14px;padding:10px;border:1px solid #ccc;';
      textarea.placeholder = 'Start typing...';
      
      // Assemble document
      head.appendChild(title);
      body.appendChild(heading);
      body.appendChild(textarea);
      html.appendChild(head);
      html.appendChild(body);
      
      doc.appendChild(html);
    }
  }

  private static openChrome(): void {
    window.open('https://www.google.com', '_blank');
  }

  private static openCalculator(): void {
    const calcWindow = window.open('', '_blank', 'width=300,height=400');
    if (calcWindow && calcWindow.document) {
      // Secure DOM manipulation instead of document.write
      const doc = calcWindow.document;
      
      const html = doc.createElement('html');
      const head = doc.createElement('head');
      const title = doc.createElement('title');
      title.textContent = 'JARVIS Calculator';
      
      const body = doc.createElement('body');
      body.style.cssText = 'margin:0;padding:20px;font-family:Arial;';
      
      const heading = doc.createElement('h3');
      heading.textContent = 'JARVIS Calculator';
      
      const input = doc.createElement('input');
      input.type = 'text';
      input.id = 'calc';
      input.style.cssText = 'width:100%;height:50px;font-size:20px;text-align:right;padding:10px;';
      input.readOnly = true;
      
      const buttonContainer = doc.createElement('div');
      buttonContainer.style.cssText = 'margin-top:10px;';
      
      // Create calculator buttons securely
      const numbers = ['7', '8', '9', '÷', '4', '5', '6', '×', '1', '2', '3', '-', '0', '.', '=', '+'];
      numbers.forEach(num => {
        const button = doc.createElement('button');
        button.textContent = num;
        button.style.cssText = 'width:23%;height:50px;font-size:18px;margin:1%;';
        button.addEventListener('click', () => {
          if (num === '=') {
            try {
              const result = eval(input.value.replace('÷', '/').replace('×', '*'));
              input.value = result.toString();
            } catch {
              input.value = 'Error';
            }
          } else {
            input.value += num;
          }
        });
        buttonContainer.appendChild(button);
      });
      
      head.appendChild(title);
      body.appendChild(heading);
      body.appendChild(input);
      body.appendChild(buttonContainer);
      html.appendChild(head);
      html.appendChild(body);
      
      doc.appendChild(html);
    }
  }

  private static openMusic(): void {
    window.open('https://open.spotify.com/search', '_blank');
  }
}
