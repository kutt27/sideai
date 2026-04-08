
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
        // Check if already initialized
        if (document.getElementById('sideai-wrapper')) {
            console.log("SideAI: Already initialized");
            return;
        }

        console.log("SideAI: Initializing...");

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
            body.sideai-open * {
                max-width: calc(100vw - 400px) !important;
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

        // Add critical styles immediately to prevent flickering while content.css loads
        const initialStyle = document.createElement('style');
        initialStyle.textContent = `
            #sideai-root {
                transform: translateX(100%);
            }
            #sideai-root.visible {
                transform: translateX(0);
            }
        `;
        shadow.appendChild(initialStyle);
        shadow.appendChild(root);

        // Build UI structure safely using DOM methods
        const header = document.createElement('header');

        // Settings button
        const settingsBtn = document.createElement('button');
        settingsBtn.id = 'sideai-settings-btn';
        settingsBtn.className = 'icon-btn';
        settingsBtn.title = 'Settings';
        settingsBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>';
        header.appendChild(settingsBtn);

        // Model pill
        const modelPill = document.createElement('div');
        modelPill.className = 'model-pill';
        modelPill.textContent = `sideai @ ${this.selectedModel}`;
        header.appendChild(modelPill);

        // History button
        const historyBtn = document.createElement('button');
        historyBtn.id = 'sideai-history-btn';
        historyBtn.className = 'icon-btn';
        historyBtn.title = 'Chat History';
        historyBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';
        header.appendChild(historyBtn);

        // Clear button
        const clearBtn = document.createElement('button');
        clearBtn.id = 'sideai-clear-btn';
        clearBtn.className = 'icon-btn';
        clearBtn.title = 'Clear Chat';
        clearBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>';
        header.appendChild(clearBtn);

        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.id = 'sideai-close-btn';
        closeBtn.className = 'icon-btn';
        closeBtn.title = 'Close';
        closeBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"></path></svg>';
        header.appendChild(closeBtn);

        root.appendChild(header);

        // Chat area
        const chatArea = document.createElement('div');
        chatArea.id = 'chat-area';
        const messagesDiv = document.createElement('div');
        messagesDiv.id = 'sideai-messages';
        chatArea.appendChild(messagesDiv);
        root.appendChild(chatArea);

        // Actions container
        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'actions-container';
        const searchBtn = document.createElement('button');
        searchBtn.className = 'action-pill';
        searchBtn.dataset.action = 'search';
        searchBtn.textContent = 'web search';
        actionsContainer.appendChild(searchBtn);
        const summarizeBtn = document.createElement('button');
        summarizeBtn.className = 'action-pill';
        summarizeBtn.dataset.action = 'summarize';
        summarizeBtn.textContent = 'chat about page';
        actionsContainer.appendChild(summarizeBtn);
        root.appendChild(actionsContainer);

        // Footer
        const footer = document.createElement('footer');
        const inputContainer = document.createElement('div');
        inputContainer.className = 'input-container';
        const inputPill = document.createElement('div');
        inputPill.className = 'input-pill';
        const input = document.createElement('textarea');
        input.id = 'sideai-input';
        input.placeholder = 'Ask SideAI...';
        input.rows = 1;
        inputPill.appendChild(input);
        inputContainer.appendChild(inputPill);
        const sendBtn = document.createElement('button');
        sendBtn.className = 'circle-btn';
        sendBtn.id = 'sideai-send';
        sendBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14m-7-7l7 7-7 7"></path></svg>';
        inputContainer.appendChild(sendBtn);
        footer.appendChild(inputContainer);
        root.appendChild(footer);

        // Modal container
        const modalContainer = document.createElement('div');
        modalContainer.id = 'sideai-modal-container';
        root.appendChild(modalContainer);

        this.root = root;
    }

    attachListeners() {
        console.log("SideAI: Attaching listeners...");
        
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            console.log("SideAI: Received message:", request);
            if (request.action === 'toggle') {
                this.toggle();
                sendResponse({ success: true });
                return true; // Keep message channel open
            }
        });

        const input = this.root.querySelector('#sideai-input');
        const sendBtn = this.root.querySelector('#sideai-send');
        const clearBtn = this.root.querySelector('#sideai-clear-btn');
        const settingsBtn = this.root.querySelector('#sideai-settings-btn');
        const historyBtn = this.root.querySelector('#sideai-history-btn');
        const closeBtn = this.root.querySelector('#sideai-close-btn');
        const actionPills = this.root.querySelectorAll('.action-pill');

        // Prevent keyboard conflicts
        input.addEventListener('keydown', (e) => {
            e.stopPropagation();
            e.stopImmediatePropagation();
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        input.addEventListener('input', () => {
            input.style.height = 'auto';
            input.style.height = input.scrollHeight + 'px';
        });

        input.addEventListener('keyup', (e) => {
            e.stopPropagation();
            e.stopImmediatePropagation();
        });

        input.addEventListener('keypress', (e) => {
            e.stopPropagation();
            e.stopImmediatePropagation();
        });

        this.root.addEventListener('keydown', (e) => {
            e.stopPropagation();
        });

        this.root.addEventListener('keyup', (e) => {
            e.stopPropagation();
        });

        sendBtn.addEventListener('click', () => this.sendMessage());
        clearBtn.addEventListener('click', () => {
            if (confirm('Clear all chat history?')) {
                this.history = [];
                this.root.querySelector('#sideai-messages').textContent = '';
            }
        });

        settingsBtn.addEventListener('click', () => this.showSettings());
        historyBtn.addEventListener('click', () => this.showHistory());
        closeBtn.addEventListener('click', () => {
            // Notify background script that sidebar is closing
            chrome.runtime.sendMessage({ action: 'sidebar_closed' }, () => {
                if (chrome.runtime.lastError) {
                    console.log("Error notifying background:", chrome.runtime.lastError);
                }
            });
            this.toggle();
        });

        actionPills.forEach(pill => {
            pill.addEventListener('click', () => {
                const action = pill.dataset.action;
                if (action === 'summarize') this.summarizePage();
                if (action === 'search') this.sendMessage("Search information about this page.");
            });
        });
    }

    toggle() {
        console.log("SideAI: Toggle called, isOpen:", this.isOpen);
        this.isOpen = !this.isOpen;
        this.root.classList.toggle('visible', this.isOpen);

        if (this.isOpen) {
            // Store original body styles
            this.originalBodyStyle = {
                marginRight: document.body.style.marginRight,
                maxWidth: document.body.style.maxWidth
            };

            // Apply sidebar-open styles
            document.body.classList.add('sideai-open');
            document.body.style.marginRight = '400px';
            document.body.style.transition = 'margin-right 0.3s cubic-bezier(0.4, 0, 0.2, 1)';

            // Focus the input when opening
            setTimeout(() => {
                const input = this.root.querySelector('#sideai-input');
                if (input) input.focus();
            }, 300);
        } else {
            // Restore original styles
            document.body.classList.remove('sideai-open');
            if (this.originalBodyStyle) {
                document.body.style.marginRight = this.originalBodyStyle.marginRight;
                document.body.style.maxWidth = this.originalBodyStyle.maxWidth;
            }

            // Return focus to page when closing
            if (document.activeElement) {
                document.activeElement.blur();
            }
        }
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

        // Create message bubble with proper text formatting
        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';

        // Format text with line breaks and basic markdown-like formatting
        const formattedText = text
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>');

        // Use textContent for safety, then manually add formatting
        bubble.textContent = text;

        // If text contains formatting, use safe innerHTML
        if (text.includes('**') || text.includes('*') || text.includes('`') || text.includes('\n')) {
            // Sanitize and format safely
            const sanitizedText = text
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#x27;')
                .replace(/\n/g, '<br>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/`(.*?)`/g, '<code>$1</code>');
            bubble.innerHTML = sanitizedText;
        }
        msgDiv.appendChild(bubble);
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

        // Clear previous content
        modalContainer.textContent = '';

        // Build modal structure safely
        const modal = document.createElement('div');
        modal.className = 'sideai-modal';

        const modalContent = document.createElement('div');
        modalContent.className = 'sideai-modal-content';

        const title = document.createElement('h3');
        title.style.marginTop = '0';
        title.textContent = `Chat History (${this.history.length} messages)`;
        modalContent.appendChild(title);

        const historyContainer = document.createElement('div');
        historyContainer.style.maxHeight = '400px';
        historyContainer.style.overflowY = 'auto';

        if (this.history.length === 0) {
            const emptyMsg = document.createElement('p');
            emptyMsg.style.textAlign = 'center';
            emptyMsg.style.color = '#666';
            emptyMsg.textContent = 'No chat history yet';
            historyContainer.appendChild(emptyMsg);
        } else {
            this.history.forEach((msg) => {
                const role = msg.role === 'user' ? 'You' : 'AI';
                const content = msg.content.length > 200 ? msg.content.substring(0, 200) + '...' : msg.content;

                const msgDiv = document.createElement('div');
                msgDiv.style.marginBottom = '12px';
                msgDiv.style.padding = '8px';
                msgDiv.style.border = '1px solid #ddd';
                msgDiv.style.borderRadius = '8px';

                const roleLabel = document.createElement('strong');
                roleLabel.textContent = role + ':';
                msgDiv.appendChild(roleLabel);

                msgDiv.appendChild(document.createElement('br'));

                const contentSpan = document.createElement('span');
                contentSpan.style.fontSize = '0.9em';
                contentSpan.textContent = content;
                msgDiv.appendChild(contentSpan);

                historyContainer.appendChild(msgDiv);
            });
        }

        modalContent.appendChild(historyContainer);

        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.gap = '10px';
        buttonContainer.style.marginTop = '20px';

        const closeBtn = document.createElement('button');
        closeBtn.id = 'sideai-close-history';
        closeBtn.className = 'action-pill';
        closeBtn.style.flex = '1';
        closeBtn.textContent = 'Close';
        buttonContainer.appendChild(closeBtn);

        modalContent.appendChild(buttonContainer);
        modal.appendChild(modalContent);
        modalContainer.appendChild(modal);

        closeBtn.onclick = () => {
            modalContainer.textContent = '';
        };
    }

    showSettings() {
        const modalContainer = this.root.querySelector('#sideai-modal-container');

        // Clear previous content
        modalContainer.textContent = '';

        // Build modal structure safely
        const modal = document.createElement('div');
        modal.className = 'sideai-modal';

        const modalContent = document.createElement('div');
        modalContent.className = 'sideai-modal-content';

        const title = document.createElement('h3');
        title.style.marginTop = '0';
        title.textContent = 'Settings';
        modalContent.appendChild(title);

        // API Key form group
        const apiKeyGroup = document.createElement('div');
        apiKeyGroup.className = 'sideai-form-group';

        const apiKeyLabel = document.createElement('label');
        apiKeyLabel.textContent = 'Groq API Key';
        apiKeyGroup.appendChild(apiKeyLabel);

        const apiKeyInput = document.createElement('input');
        apiKeyInput.type = 'password';
        apiKeyInput.id = 'sideai-api-key-input';
        apiKeyInput.value = this.apiKey;
        apiKeyGroup.appendChild(apiKeyInput);

        modalContent.appendChild(apiKeyGroup);

        // Model form group
        const modelGroup = document.createElement('div');
        modelGroup.className = 'sideai-form-group';

        const modelLabel = document.createElement('label');
        modelLabel.textContent = 'Model';
        modelGroup.appendChild(modelLabel);

        const modelSelect = document.createElement('select');
        modelSelect.id = 'sideai-model-select';

        const option1 = document.createElement('option');
        option1.value = 'llama-3.3-70b-versatile';
        option1.textContent = 'Llama 3.3 70B';
        if (this.selectedModel === 'llama-3.3-70b-versatile') {
            option1.selected = true;
        }
        modelSelect.appendChild(option1);

        const option2 = document.createElement('option');
        option2.value = 'llama-3.1-8b-instant';
        option2.textContent = 'Llama 3.1 8B';
        if (this.selectedModel === 'llama-3.1-8b-instant') {
            option2.selected = true;
        }
        modelSelect.appendChild(option2);

        modelGroup.appendChild(modelSelect);
        modalContent.appendChild(modelGroup);

        // Button container
        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.gap = '10px';
        buttonContainer.style.marginTop = '20px';

        const saveBtn = document.createElement('button');
        saveBtn.id = 'sideai-save-settings';
        saveBtn.className = 'action-pill';
        saveBtn.style.flex = '1';
        saveBtn.textContent = 'Save';
        buttonContainer.appendChild(saveBtn);

        const cancelBtn = document.createElement('button');
        cancelBtn.id = 'sideai-cancel-settings';
        cancelBtn.className = 'action-pill';
        cancelBtn.style.flex = '1';
        cancelBtn.textContent = 'Cancel';
        buttonContainer.appendChild(cancelBtn);

        modalContent.appendChild(buttonContainer);
        modal.appendChild(modalContent);
        modalContainer.appendChild(modal);

        saveBtn.onclick = () => {
            const key = apiKeyInput.value;
            const model = modelSelect.value;
            this.apiKey = key;
            this.selectedModel = model;
            chrome.storage.local.set({ apiKey: key, selectedModel: model }, () => {
                this.root.querySelector('.model-pill').textContent = `sideai @ ${model}`;
                modalContainer.textContent = '';
            });
        };

        cancelBtn.onclick = () => {
            modalContainer.textContent = '';
        };
    }
}

// Only create one instance
if (!window.sideAI) {
    window.sideAI = new SideAI();
}
