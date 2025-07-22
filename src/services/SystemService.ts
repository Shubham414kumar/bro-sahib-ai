
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
    if (notepadWindow) {
      notepadWindow.document.write(`
        <html>
          <head><title>JARVIS Notepad</title></head>
          <body style="margin:0;padding:20px;font-family:monospace;">
            <h3>JARVIS Notepad</h3>
            <textarea style="width:100%;height:300px;font-size:14px;padding:10px;border:1px solid #ccc;" placeholder="Start typing..."></textarea>
          </body>
        </html>
      `);
    }
  }

  private static openChrome(): void {
    window.open('https://www.google.com', '_blank');
  }

  private static openCalculator(): void {
    const calcWindow = window.open('', '_blank', 'width=300,height=400');
    if (calcWindow) {
      calcWindow.document.write(`
        <html>
          <head><title>JARVIS Calculator</title></head>
          <body style="margin:0;padding:20px;font-family:Arial;">
            <h3>JARVIS Calculator</h3>
            <input type="text" id="calc" style="width:100%;height:50px;font-size:20px;text-align:right;padding:10px;" readonly>
            <div style="margin-top:10px;">
              <button onclick="calc.value+='7'" style="width:23%;height:50px;font-size:18px;margin:1%;">7</button>
              <button onclick="calc.value+='8'" style="width:23%;height:50px;font-size:18px;margin:1%;">8</button>
              <button onclick="calc.value+='9'" style="width:23%;height:50px;font-size:18px;margin:1%;">9</button>
              <button onclick="calc.value+='/'" style="width:23%;height:50px;font-size:18px;margin:1%;">÷</button>
            </div>
            <script>const calc = document.getElementById('calc');</script>
          </body>
        </html>
      `);
    }
  }

  private static openMusic(): void {
    window.open('https://open.spotify.com/search', '_blank');
  }
}
