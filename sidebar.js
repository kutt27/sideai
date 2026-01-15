const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

class SideAI {
    constructor() {
        this.apiKey = "";
        this.selectedModel = "llama-3.3-70b-versatile";
        this.history = [];
        this.currentTab = null;
        this.init();
    }

    async init() {
        chrome.storage.local.get(['apiKey', 'selectedModel'], (data) => {
            this.apiKey = data.apiKey || "";
            this.selectedModel = data.selectedModel || "llama-3.3-70b-versatile";
            this.createUI();
            this.attachListeners();
            this.getCurrentTab();
        });
    }

    getCurrentTab() {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs[0]) {
                this.currentTab = tabs[0];
            }
        });
    }

    // ... rest of your SideAI methods (createUI, attachListeners, etc.)
    // Copy from content.js but remove the shadow DOM parts
}

new SideAI();