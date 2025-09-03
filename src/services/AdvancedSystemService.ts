export class AdvancedSystemService {
  private static calcExpression: string = '';
  
  static executeCommand(command: string): string {
    const lowerCommand = command.toLowerCase();
    
    // YouTube Commands
    if (lowerCommand.includes('youtube') || lowerCommand.includes('play video')) {
      const searchMatch = command.match(/youtube\s+(.+)|play\s+video\s+(.+)|video\s+(.+)/i);
      if (searchMatch) {
        const query = searchMatch[1] || searchMatch[2] || searchMatch[3];
        this.playYouTube(query);
        return `YouTube pe "${query}" search kar raha hun...`;
      }
      return 'YouTube khol raha hun...';
    }
    
    // Calculator with calculation
    else if (lowerCommand.includes('calculate') || lowerCommand.includes('calc')) {
      const calcMatch = command.match(/calculate\s+(.+)|calc\s+(.+)/i);
      if (calcMatch) {
        const expression = calcMatch[1] || calcMatch[2];
        const result = this.calculate(expression);
        return `Calculation result: ${expression} = ${result}`;
      }
      this.openCalculator();
      return 'Calculator khol diya hai...';
    }
    
    // WhatsApp
    else if (lowerCommand.includes('whatsapp')) {
      const numberMatch = command.match(/whatsapp\s+(\d+)/i);
      if (numberMatch) {
        this.openWhatsApp(numberMatch[1]);
        return `WhatsApp pe ${numberMatch[1]} ko message bhej sakte ho...`;
      }
      this.openWhatsApp();
      return 'WhatsApp Web khol raha hun...';
    }
    
    // Maps/Navigation
    else if (lowerCommand.includes('map') || lowerCommand.includes('navigate') || lowerCommand.includes('directions')) {
      const locationMatch = command.match(/map\s+(.+)|navigate\s+to\s+(.+)|directions\s+to\s+(.+)/i);
      if (locationMatch) {
        const location = locationMatch[1] || locationMatch[2] || locationMatch[3];
        this.openMaps(location);
        return `${location} ka rasta dikha raha hun...`;
      }
      this.openMaps();
      return 'Maps khol raha hun...';
    }
    
    // Email
    else if (lowerCommand.includes('email') || lowerCommand.includes('gmail')) {
      const emailMatch = command.match(/email\s+to\s+(.+)|gmail\s+to\s+(.+)/i);
      if (emailMatch) {
        const recipient = emailMatch[1] || emailMatch[2];
        this.openEmail(recipient);
        return `${recipient} ko email compose kar raha hun...`;
      }
      this.openEmail();
      return 'Gmail khol raha hun...';
    }
    
    // Social Media
    else if (lowerCommand.includes('facebook')) {
      window.open('https://www.facebook.com', '_blank');
      return 'Facebook khol diya hai...';
    }
    else if (lowerCommand.includes('twitter') || lowerCommand.includes('x.com')) {
      window.open('https://x.com', '_blank');
      return 'Twitter/X khol diya hai...';
    }
    else if (lowerCommand.includes('instagram')) {
      window.open('https://www.instagram.com', '_blank');
      return 'Instagram khol diya hai...';
    }
    else if (lowerCommand.includes('linkedin')) {
      window.open('https://www.linkedin.com', '_blank');
      return 'LinkedIn khol diya hai...';
    }
    
    // Shopping
    else if (lowerCommand.includes('amazon')) {
      const searchMatch = command.match(/amazon\s+(.+)/i);
      if (searchMatch) {
        this.searchAmazon(searchMatch[1]);
        return `Amazon pe "${searchMatch[1]}" search kar raha hun...`;
      }
      window.open('https://www.amazon.in', '_blank');
      return 'Amazon khol diya hai...';
    }
    else if (lowerCommand.includes('flipkart')) {
      window.open('https://www.flipkart.com', '_blank');
      return 'Flipkart khol diya hai...';
    }
    
    // News
    else if (lowerCommand.includes('news')) {
      window.open('https://news.google.com', '_blank');
      return 'Latest news dikha raha hun...';
    }
    
    // Weather
    else if (lowerCommand.includes('weather')) {
      const cityMatch = command.match(/weather\s+in\s+(.+)|weather\s+(.+)/i);
      if (cityMatch) {
        const city = cityMatch[1] || cityMatch[2];
        this.checkWeather(city);
        return `${city} ka weather check kar raha hun...`;
      }
      this.checkWeather();
      return 'Weather check kar raha hun...';
    }
    
    // Zoom/Meet
    else if (lowerCommand.includes('zoom')) {
      window.open('https://zoom.us/join', '_blank');
      return 'Zoom meeting join karne ke liye ready...';
    }
    else if (lowerCommand.includes('meet') || lowerCommand.includes('google meet')) {
      window.open('https://meet.google.com', '_blank');
      return 'Google Meet khol diya hai...';
    }
    
    // System Info
    else if (lowerCommand.includes('battery')) {
      this.checkBattery();
      return 'Battery status check kar raha hun...';
    }
    else if (lowerCommand.includes('network') || lowerCommand.includes('wifi')) {
      this.checkNetwork();
      return 'Network status check kar raha hun...';
    }
    
    // Files & Documents
    else if (lowerCommand.includes('google drive') || lowerCommand.includes('drive')) {
      window.open('https://drive.google.com', '_blank');
      return 'Google Drive khol diya hai...';
    }
    else if (lowerCommand.includes('docs') || lowerCommand.includes('document')) {
      window.open('https://docs.google.com', '_blank');
      return 'Google Docs khol diya hai...';
    }
    else if (lowerCommand.includes('sheets') || lowerCommand.includes('excel')) {
      window.open('https://sheets.google.com', '_blank');
      return 'Google Sheets khol diya hai...';
    }
    
    // Entertainment
    else if (lowerCommand.includes('netflix')) {
      window.open('https://www.netflix.com', '_blank');
      return 'Netflix khol diya hai...';
    }
    else if (lowerCommand.includes('spotify')) {
      window.open('https://open.spotify.com', '_blank');
      return 'Spotify khol diya hai...';
    }
    
    // Screenshot
    else if (lowerCommand.includes('screenshot')) {
      return 'Screenshot lene ke liye: Windows (Win + PrtScn), Mac (Cmd + Shift + 3), Mobile (Power + Volume Down)';
    }
    
    // Timer/Alarm
    else if (lowerCommand.includes('timer') || lowerCommand.includes('alarm')) {
      const timeMatch = command.match(/(\d+)\s+(minute|second|hour)/i);
      if (timeMatch) {
        const duration = parseInt(timeMatch[1]);
        const unit = timeMatch[2].toLowerCase();
        this.setTimer(duration, unit);
        return `${duration} ${unit} ka timer set kar diya hai...`;
      }
      return 'Timer set karne ke liye boliye: "set timer 5 minutes"';
    }
    
    // Translation
    else if (lowerCommand.includes('translate')) {
      const translateMatch = command.match(/translate\s+(.+)/i);
      if (translateMatch) {
        this.openTranslate(translateMatch[1]);
        return `"${translateMatch[1]}" translate kar raha hun...`;
      }
      window.open('https://translate.google.com', '_blank');
      return 'Google Translate khol diya hai...';
    }
    
    // Default system commands
    else {
      return this.handleBasicCommands(command);
    }
  }
  
  private static handleBasicCommands(command: string): string {
    const lowerCommand = command.toLowerCase();
    
    if (lowerCommand.includes('notepad')) {
      this.openNotepad();
      return 'Notepad khol diya hai...';
    } else if (lowerCommand.includes('chrome') || lowerCommand.includes('browser')) {
      window.open('https://www.google.com', '_blank');
      return 'Browser khol diya hai...';
    } else {
      return 'Supported commands: YouTube, Calculator, WhatsApp, Maps, Email, Social Media, Shopping, News, Weather, Timer, Translate, aur bahut saare...';
    }
  }
  
  private static playYouTube(query?: string): void {
    if (query) {
      const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
      window.open(searchUrl, '_blank');
    } else {
      window.open('https://www.youtube.com', '_blank');
    }
  }
  
  private static calculate(expression: string): string {
    try {
      // Safe evaluation using Function constructor
      const sanitized = expression.replace(/[^0-9+\-*/().\s]/g, '');
      const result = Function('"use strict"; return (' + sanitized + ')')();
      return result.toString();
    } catch (error) {
      return 'Invalid calculation';
    }
  }
  
  private static openWhatsApp(number?: string): void {
    if (number) {
      window.open(`https://wa.me/${number}`, '_blank');
    } else {
      window.open('https://web.whatsapp.com', '_blank');
    }
  }
  
  private static openMaps(location?: string): void {
    if (location) {
      window.open(`https://www.google.com/maps/search/${encodeURIComponent(location)}`, '_blank');
    } else {
      window.open('https://maps.google.com', '_blank');
    }
  }
  
  private static openEmail(recipient?: string): void {
    if (recipient) {
      window.open(`mailto:${recipient}`, '_blank');
    } else {
      window.open('https://mail.google.com', '_blank');
    }
  }
  
  private static searchAmazon(query: string): void {
    window.open(`https://www.amazon.in/s?k=${encodeURIComponent(query)}`, '_blank');
  }
  
  private static checkWeather(city?: string): void {
    if (city) {
      // Open weather with detailed forecast
      window.open(`https://www.google.com/search?q=weather+forecast+${encodeURIComponent(city)}`, '_blank');
      
      // Also try to get current weather via API (for future enhancement)
      fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`)
        .then(response => response.json())
        .then(data => {
          if (data && data.current_condition) {
            const temp = data.current_condition[0].temp_C;
            const desc = data.current_condition[0].weatherDesc[0].value;
            console.log(`Current weather in ${city}: ${temp}°C, ${desc}`);
          }
        })
        .catch(error => console.error('Weather API error:', error));
    } else {
      // Get user's location weather
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            window.open(`https://www.google.com/search?q=weather+forecast+near+me`, '_blank');
          },
          () => {
            window.open('https://www.google.com/search?q=weather+forecast', '_blank');
          }
        );
      } else {
        window.open('https://www.google.com/search?q=weather+forecast', '_blank');
      }
    }
  }
  
  private static async checkBattery(): Promise<void> {
    try {
      // @ts-ignore - Battery API is not in TypeScript definitions
      const battery = await navigator.getBattery();
      const level = Math.round(battery.level * 100);
      const charging = battery.charging ? 'Charging' : 'Not charging';
      alert(`Battery: ${level}% - ${charging}`);
    } catch {
      alert('Battery status not available in this browser');
    }
  }
  
  private static checkNetwork(): void {
    const connection = (navigator as any).connection;
    if (connection) {
      alert(`Network: ${connection.effectiveType}, Speed: ${connection.downlink}Mbps`);
    } else {
      alert(`Network: ${navigator.onLine ? 'Online' : 'Offline'}`);
    }
  }
  
  private static setTimer(duration: number, unit: string): void {
    let milliseconds = duration * 1000;
    if (unit === 'minute' || unit === 'minutes') {
      milliseconds *= 60;
    } else if (unit === 'hour' || unit === 'hours') {
      milliseconds *= 3600;
    }
    
    setTimeout(() => {
      alert(`Timer complete! ${duration} ${unit} ho gaye!`);
      // Play a sound if possible
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAAAQAEAEsAAABLAAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiS2Oy9diMFl2+z59yeUREOTKXh8rVeHAg+m93yvnkxBTGH0/PPeycFS1Nm7Lidqh8IG0w4');
      audio.play();
    }, milliseconds);
  }
  
  private static openTranslate(text: string): void {
    window.open(`https://translate.google.com/?text=${encodeURIComponent(text)}`, '_blank');
  }
  
  private static openNotepad(): void {
    const notepadWindow = window.open('', '_blank', 'width=600,height=400');
    if (notepadWindow && notepadWindow.document) {
      const doc = notepadWindow.document;
      const html = doc.createElement('html');
      const head = doc.createElement('head');
      const title = doc.createElement('title');
      title.textContent = 'JARVIS Notepad';
      
      const body = doc.createElement('body');
      body.style.cssText = 'margin:0;padding:20px;font-family:monospace;background:#1a1a1a;color:#0ff;';
      
      const heading = doc.createElement('h3');
      heading.textContent = 'JARVIS Notepad';
      heading.style.cssText = 'color:#0ff;margin-bottom:10px;';
      
      const textarea = doc.createElement('textarea');
      textarea.style.cssText = 'width:100%;height:300px;font-size:14px;padding:10px;background:#000;color:#0ff;border:1px solid #0ff;';
      textarea.placeholder = 'Start typing...';
      
      head.appendChild(title);
      body.appendChild(heading);
      body.appendChild(textarea);
      html.appendChild(head);
      html.appendChild(body);
      
      doc.appendChild(html);
    }
  }
  
  private static openCalculator(): void {
    const calcWindow = window.open('', '_blank', 'width=350,height=500');
    if (calcWindow && calcWindow.document) {
      const doc = calcWindow.document;
      const html = doc.createElement('html');
      const head = doc.createElement('head');
      const title = doc.createElement('title');
      title.textContent = 'JARVIS Calculator';
      
      const style = doc.createElement('style');
      style.textContent = `
        body { margin:0; padding:20px; font-family:Arial; background:#1a1a1a; color:#0ff; }
        h3 { color:#0ff; text-align:center; }
        #calc { width:100%; height:60px; font-size:24px; text-align:right; padding:10px; background:#000; color:#0ff; border:2px solid #0ff; margin-bottom:10px; }
        .btn { width:23%; height:60px; font-size:20px; margin:1%; background:#000; color:#0ff; border:1px solid #0ff; cursor:pointer; transition:0.3s; }
        .btn:hover { background:#0ff; color:#000; }
        .btn-equal { background:#0ff; color:#000; }
      `;
      
      const body = doc.createElement('body');
      const heading = doc.createElement('h3');
      heading.textContent = 'JARVIS Calculator';
      
      const input = doc.createElement('input');
      input.type = 'text';
      input.id = 'calc';
      input.readOnly = true;
      
      const buttonContainer = doc.createElement('div');
      
      const buttons = ['C', '(', ')', '÷', '7', '8', '9', '×', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', '=', '⌫'];
      buttons.forEach(btn => {
        const button = doc.createElement('button');
        button.textContent = btn;
        button.className = btn === '=' ? 'btn btn-equal' : 'btn';
        button.addEventListener('click', () => {
          if (btn === '=') {
            try {
              const result = eval(input.value.replace('÷', '/').replace('×', '*'));
              input.value = result.toString();
            } catch {
              input.value = 'Error';
            }
          } else if (btn === 'C') {
            input.value = '';
          } else if (btn === '⌫') {
            input.value = input.value.slice(0, -1);
          } else {
            input.value += btn;
          }
        });
        buttonContainer.appendChild(button);
      });
      
      head.appendChild(title);
      head.appendChild(style);
      body.appendChild(heading);
      body.appendChild(input);
      body.appendChild(buttonContainer);
      html.appendChild(head);
      html.appendChild(body);
      
      doc.appendChild(html);
    }
  }
}