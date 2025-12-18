// Initialize chat widget
// Initialization moved to bottom after class definition to avoid
// "Cannot access 'ChatWidget' before initialization" error.

// Find the script element that loaded this widget
const script = document.querySelector('script[src$="chat-widget.js"]');
const botId = script?.getAttribute('data-bot-id') || 'default-bot';

// Ensure marked.js is available; load dynamically if missing
let markedReady = new Promise((resolve) => {
  if (window.marked) {
    window.marked.setOptions({ breaks: true, gfm: true, headerIds: false });
    resolve();
  } else {
    const m = document.createElement('script');
    m.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
    m.onload = () => {
      if (window.marked) {
        window.marked.setOptions({ breaks: true, gfm: true, headerIds: false });
      }
      resolve();
    };
    m.onerror = () => resolve(); // Fail gracefully
    document.head.appendChild(m);
  }
});

// Style markdown elements
function styleMarkdownElements(element) {
  const codeBlocks = element.querySelectorAll('pre code');
  codeBlocks.forEach(code => {
    code.style.backgroundColor = '#f6f8fa';
    code.style.padding = '8px';
    code.style.borderRadius = '6px';
    code.style.fontFamily = 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace';
    code.style.fontSize = '12px';
    code.style.display = 'block';
    code.style.overflowX = 'auto';
  });

  const headings = element.querySelectorAll('h1, h2, h3, h4, h5, h6');
  headings.forEach(heading => {
    heading.style.marginTop = '12px';
    heading.style.marginBottom = '4px';
    heading.style.fontWeight = '600';
    heading.style.fontSize = '14px';
  });

  const links = element.querySelectorAll('a');
  links.forEach(link => {
    link.style.color = '#0084ff';
    link.style.textDecoration = 'none';
  });

  const paragraphs = element.querySelectorAll('p');
  paragraphs.forEach(p => {
    p.style.margin = '4px 0';
  });
}

function escapeHtml(str) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return String(str).replace(/[&<>"']/g, (m) => map[m]);
}

class ChatWidget {
  constructor() {
    this.botId = botId;
    this.messagesContainer = null;
    this.chatWindow = null;
    this.container = document.createElement('div');
    this.container.style.cssText = `
      position: fixed;
      bottom: 0;
      right: 0;
      z-index: 9999;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    `;

    // Create chat window
    this.chatWindow = document.createElement('div');
    this.chatWindow.style.cssText = `
      display: none;
      flex-direction: column;
      position: fixed;
      bottom: 90px;
      right: 20px;
      width: 360px;
      height: 600px;
      max-height: calc(100vh - 110px);
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 12px 28px 0 rgba(0, 0, 0, 0.2), 0 2px 4px 0 rgba(0, 0, 0, 0.1);
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
      opacity: 0;
      transform: translateY(20px);
    `;

    // Create header
    const header = document.createElement('div');
    header.style.cssText = `
      padding: 12px 16px;
      background: #fff;
      border-bottom: 1px solid rgba(0, 0, 0, 0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: default;
    `;
    header.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="width: 32px; height: 32px; background: #0084ff; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: bold; font-size: 14px;">M</div>
        <div>
          <div style="font-weight: 600; color: #050505; font-size: 15px;">MyBot Assistant</div>
          <div style="font-size: 12px; color: #65676b; display: flex; align-items: center; gap: 4px;">
            <span style="width: 8px; height: 8px; background: #31a24c; border-radius: 50%;"></span>
            Active now
          </div>
        </div>
      </div>
      <button style="background: none; border: none; cursor: pointer; padding: 4px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: background 0.2s;" onmouseover="this.style.background='rgba(0,0,0,0.05)'" onmouseout="this.style.background='none'">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#65676b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    `;

    // Create messages container
    this.messagesContainer = document.createElement('div');
    this.messagesContainer.style.cssText = `
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      background: #fff;
    `;

    // Create input container
    const inputArea = document.createElement('div');
    inputArea.style.cssText = `
      padding: 12px 16px;
      background: #fff;
      display: flex;
      align-items: center;
      gap: 8px;
    `;

    this.input = document.createElement('input');
    this.input.type = 'text';
    this.input.placeholder = 'Aa';
    this.input.style.cssText = `
      flex: 1;
      background: #f0f2f5;
      border: none;
      border-radius: 18px;
      padding: 9px 12px;
      font-size: 15px;
      outline: none;
      color: #050505;
    `;

    const sendBtn = document.createElement('button');
    sendBtn.style.cssText = `
      background: none;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4px;
      transition: transform 0.1s;
    `;
    sendBtn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="#0084ff"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path></svg>`;
    sendBtn.onmousedown = () => sendBtn.style.transform = 'scale(0.9)';
    sendBtn.onmouseup = () => sendBtn.style.transform = 'scale(1)';

    inputArea.appendChild(this.input);
    inputArea.appendChild(sendBtn);

    this.chatWindow.appendChild(header);
    this.chatWindow.appendChild(this.messagesContainer);
    this.chatWindow.appendChild(inputArea);

    this.icon = document.createElement('div');
    this.icon.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 60px;
      height: 60px;
      background: #0084ff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
    `;
    this.icon.innerHTML = `<svg width="32" height="32" viewBox="0 0 24 24" fill="#fff"><path d="M12 2c5.523 0 10 3.933 10 8.785 0 2.76-1.442 5.222-3.69 6.848.114.488.47 1.411.96 2.37.103.203.048.441-.122.585-.1.085-.23.123-.356.101-1.3-.223-3.033-.765-4.048-1.259-.884.238-1.804.364-2.746.364-5.523 0-10-3.933-10-8.785S6.477 2 12 2z"></path></svg>`;

    // Event Listeners
    this.icon.addEventListener('click', () => this.toggleChat());
    header.querySelector('button').addEventListener('click', () => this.toggleChat());

    sendBtn.addEventListener('click', () => {
      const msg = this.input.value.trim();
      if (msg) {
        this.input.value = '';
        this.sendMessage(msg);
      }
    });

    this.input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const msg = this.input.value.trim();
        if (msg) {
          this.input.value = '';
          this.sendMessage(msg);
        }
      }
    });

    this.container.appendChild(this.chatWindow);
    document.body.appendChild(this.container);
    document.body.appendChild(this.icon);
  }

  toggleChat() {
    const isHidden = this.chatWindow.style.display === 'none';
    if (isHidden) {
      this.chatWindow.style.display = 'flex';
      setTimeout(() => {
        this.chatWindow.style.opacity = '1';
        this.chatWindow.style.transform = 'translateY(0)';
      }, 10);
      this.icon.style.transform = 'scale(0) rotate(90deg)';
      this.icon.style.opacity = '0';
    } else {
      this.chatWindow.style.opacity = '0';
      this.chatWindow.style.transform = 'translateY(20px)';
      setTimeout(() => {
        this.chatWindow.style.display = 'none';
      }, 300);
      this.icon.style.transform = 'scale(1) rotate(0deg)';
      this.icon.style.opacity = '1';
    }
  }

  async sendMessage(text) {
    this.addMessage(text, 'user');

    try {
      const response = await fetch('http://localhost:8000/chat/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bot_id: this.botId,
          message: text,
        }),
      });

      const data = await response.json();
      this.addMessage(data.response, 'bot');
    } catch (error) {
      console.error('Error:', error);
      this.addMessage('Sorry, something went wrong. Please try again.', 'bot', true);
    }
  }

  async addMessage(text, sender, isError = false) {
    const msgDiv = document.createElement('div');
    msgDiv.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: ${sender === 'user' ? 'flex-end' : 'flex-start'};
      width: 100%;
    `;

    const contentDiv = document.createElement('div');
    contentDiv.style.cssText = `
      max-width: 75%;
      padding: 8px 12px;
      border-radius: 18px;
      font-size: 15px;
      line-height: 1.4;
      position: relative;
      background: ${sender === 'user' ? '#0084ff' : '#f0f2f5'};
      color: ${sender === 'user' ? '#fff' : '#050505'};
      ${sender === 'user' ? 'border-bottom-right-radius: 4px;' : 'border-bottom-left-radius: 4px;'}
      ${isError ? 'background: #ffebe9; color: #cf222e; border: 1px solid rgba(207,34,46,0.15);' : ''}
    `;

    if (sender === 'bot') {
      await markedReady;
      const html = window.marked ? window.marked.parse(text) : escapeHtml(text);
      const inner = document.createElement('div');
      inner.innerHTML = html;
      styleMarkdownElements(inner);
      contentDiv.appendChild(inner);
    } else {
      contentDiv.textContent = text;
    }

    msgDiv.appendChild(contentDiv);
    this.messagesContainer.appendChild(msgDiv);

    // Smooth scroll to bottom
    this.messagesContainer.scrollTo({
      top: this.messagesContainer.scrollHeight,
      behavior: 'smooth'
    });
  }
}

// Initialize chat widget
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new ChatWidget());
} else {
  new ChatWidget();
}