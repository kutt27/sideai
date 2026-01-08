const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

class SideAI {
    constructor() {
        this.isOpen = false;
        this.apiKey = "";
        this.selectedModel = "llama-3.3-70b-versatile";
        this.history = [];
        this.init();
    }

    async init() {
        chrome.storage.local.get(['apiKey', 'selectedModel'], (data) => {
            this.apiKey = data.apiKey || "";
            this.selectedModel = data.selectedModel || "llama-3.3-70b-versatile";

            this.createUI();
            this.attachListeners();
        });
    }

    createUI() {
        // Add style to push body content when sidebar is visible
        const bodyStyle = document.createElement('style');
        bodyStyle.id = 'sideai-body-style';
        bodyStyle.textContent = `
            body.sideai-open {
                margin-right: 400px !important;
                transition: margin-right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }
        `;
        document.head.appendChild(bodyStyle);

        const wrapper = document.createElement('div');
        wrapper.id = 'sideai-wrapper';
        document.body.appendChild(wrapper);

        const shadow = wrapper.attachShadow({ mode: 'open' });
        this.shadow = shadow;

        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.href = chrome.runtime.getURL('content.css');
        shadow.appendChild(styleLink);

        const root = document.createElement('div');
        root.id = 'sideai-root';
        shadow.appendChild(root);

        root.innerHTML = `
            <header>
                <button id="sideai-settings-btn" class="icon-btn" title="Settings">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                </button>
                <div class="model-pill">sideai @ ${this.selectedModel}</div>
                <button id="sideai-history-btn" class="icon-btn" title="Chat History">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </button>
                <button id="sideai-clear-btn" class="icon-btn" title="Clear Chat">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                </button>
                <button id="sideai-close-btn" class="icon-btn" title="Close">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"></path></svg>
                </button>
            </header>

            <div id="chat-area">
                <div id="sideai-messages"></div>
            </div>

            <div class="actions-container">
                <button class="action-pill" data-action="search">web search</button>
                <button class="action-pill" data-action="summarize">chat about page</button>
            </div>

            <footer>
                <div class="input-container">
                    <div class="input-pill">
                        <input type="text" id="sideai-input" placeholder="Ask SideAI...">
                    </div>
                    <button class="circle-btn" id="sideai-send">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14m-7-7l7 7-7 7"></path></svg>
                    </button>
                </div>
            </footer>

            <div id="sideai-modal-container"></div>
        `;

        this.root = root;
    }

    attachListeners() {
        chrome.runtime.onMessage.addListener((request) => {
            if (request.action === 'toggle') {
                this.toggle();
            }
        });

        const input = this.root.querySelector('#sideai-input');
        const sendBtn = this.root.querySelector('#sideai-send');
        const clearBtn = this.root.querySelector('#sideai-clear-btn');
        const settingsBtn = this.root.querySelector('#sideai-settings-btn');
        const historyBtn = this.root.querySelector('#sideai-history-btn');
        const closeBtn = this.root.querySelector('#sideai-close-btn');
        const actionPills = this.root.querySelectorAll('.action-pill');

        sendBtn.addEventListener('click', () => this.sendMessage());
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });

        clearBtn.addEventListener('click', () => {
            if (confirm('Clear all chat history?')) {
                this.history = [];
                this.root.querySelector('#sideai-messages').innerHTML = '';
            }
        });

        settingsBtn.addEventListener('click', () => this.showSettings());
        historyBtn.addEventListener('click', () => this.showHistory());
        closeBtn.addEventListener('click', () => this.toggle());

        actionPills.forEach(pill => {
            pill.addEventListener('click', () => {
                const action = pill.dataset.action;
                if (action === 'summarize') this.summarizePage();
                if (action === 'search') this.sendMessage("Search information about this page.");
            });
        });
    }

    toggle() {
        this.isOpen = !this.isOpen;
        this.root.classList.toggle('visible', this.isOpen);
        document.body.classList.toggle('sideai-open', this.isOpen);
    }

    async sendMessage(textInput) {
        const input = this.root.querySelector('#sideai-input');
        const text = textInput || input.value.trim();
        if (!text) return;
        if (!textInput) input.value = '';

        this.appendMessage(text, 'user');
        this.history.push({ role: 'user', content: text });

        const loadingDiv = this.appendMessage("Thinking...", "ai");

        const response = await this.callGroq(this.history);
        loadingDiv.remove();

        if (response) {
            this.appendMessage(response, 'ai');
            this.history.push({ role: 'assistant', content: response });
        }
    }

    appendMessage(text, role) {
        const container = this.root.querySelector('#sideai-messages');
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${role}`;

        // Add watermark if it's the first message or background
        if (container.children.length === 0) {
            const watermark = document.createElement('div');
            watermark.id = 'sideai-watermark';
            watermark.style.backgroundImage = `url(${chrome.runtime.getURL('icons/icon-96.png')})`;
            container.appendChild(watermark);
        }

        msgDiv.innerHTML = `<div class="message-bubble">${text}</div>`;
        container.appendChild(msgDiv);
        container.parentElement.scrollTop = container.parentElement.scrollHeight;
        return msgDiv;
    }

    async callGroq(messages) {
        if (!this.apiKey) {
            this.appendMessage("API Key missing! Please add it in settings.", "ai");
            return null;
        }

        try {
            const response = await fetch(GROQ_API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.selectedModel,
                    messages: messages,
                    temperature: 0.7
                })
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error.message);
            return data.choices[0].message.content;
        } catch (err) {
            return `Error: ${err.message}`;
        }
    }

    async summarizePage() {
        this.appendMessage("Summarizing page...", "user");
        const bodyContent = document.body.innerText.substring(0, 10000);
        const prompt = `Summarize this page briefly: \nTitle: ${document.title}\nContent: ${bodyContent}`;
        this.sendMessage(prompt);
    }

    showHistory() {
        const modalContainer = this.root.querySelector('#sideai-modal-container');

        let historyHTML = '<div style="max-height: 400px; overflow-y: auto;">';
        if (this.history.length === 0) {
            historyHTML += '<p style="text-align: center; color: #666;">No chat history yet</p>';
        } else {
            this.history.forEach((msg) => {
                const role = msg.role === 'user' ? 'You' : 'AI';
                const content = msg.content.length > 200 ? msg.content.substring(0, 200) + '...' : msg.content;
                historyHTML += `
                    <div style="margin-bottom: 12px; padding: 8px; border: 1px solid #ddd; border-radius: 8px;">
                        <strong>${role}:</strong><br>
                        <span style="font-size: 0.9em;">${content}</span>
                    </div>
                `;
            });
        }
        historyHTML += '</div>';

        modalContainer.innerHTML = `
            <div class="sideai-modal">
                <div class="sideai-modal-content">
                    <h3 style="margin-top:0">Chat History (${this.history.length} messages)</h3>
                    ${historyHTML}
                    <div style="display:flex; gap:10px; margin-top:20px">
                        <button id="sideai-close-history" class="action-pill" style="flex:1">Close</button>
                    </div>
                </div>
            </div>
        `;

        modalContainer.querySelector('#sideai-close-history').onclick = () => {
            modalContainer.innerHTML = '';
        };
    }

    showSettings() {
        const modalContainer = this.root.querySelector('#sideai-modal-container');
        modalContainer.innerHTML = `
            <div class="sideai-modal">
                <div class="sideai-modal-content">
                    <h3 style="margin-top:0">Settings</h3>
                    <div class="sideai-form-group">
                        <label>Groq API Key</label>
                        <input type="password" id="sideai-api-key-input" value="${this.apiKey}">
                    </div>
                    <div class="sideai-form-group">
                        <label>Model</label>
                        <select id="sideai-model-select">
                            <option value="llama-3.3-70b-versatile" ${this.selectedModel === 'llama-3.3-70b-versatile' ? 'selected' : ''}>Llama 3.3 70B</option>
                            <option value="llama-3.1-8b-instant" ${this.selectedModel === 'llama-3.1-8b-instant' ? 'selected' : ''}>Llama 3.1 8B</option>
                        </select>
                    </div>
                    <div style="display:flex; gap:10px; margin-top:20px">
                        <button id="sideai-save-settings" class="action-pill" style="flex:1">Save</button>
                        <button id="sideai-cancel-settings" class="action-pill" style="flex:1">Cancel</button>
                    </div>
                </div>
            </div>
        `;

        modalContainer.querySelector('#sideai-save-settings').onclick = () => {
            const key = modalContainer.querySelector('#sideai-api-key-input').value;
            const model = modalContainer.querySelector('#sideai-model-select').value;
            this.apiKey = key;
            this.selectedModel = model;
            chrome.storage.local.set({ apiKey: key, selectedModel: model }, () => {
                this.root.querySelector('.model-pill').innerText = `sideai @ ${model}`;
                modalContainer.innerHTML = '';
            });
        };

        modalContainer.querySelector('#sideai-cancel-settings').onclick = () => {
            modalContainer.innerHTML = '';
        };
    }
}

// Start
new SideAI();
