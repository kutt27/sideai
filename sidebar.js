const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const GROQ_MODELS = [
    { id: "openai/gpt-oss-120b", label: "OpenAI GPT-OSS 120B" },
    { id: "openai/gpt-oss-20b", label: "OpenAI GPT-OSS 20B" },
    { id: "meta-llama/llama-4-scout-17b-16e-instruct", label: "Llama 4 Scout 17B" },
    { id: "qwen/qwen3-32b", label: "Qwen3 32B" },
    { id: "moonshotai/kimi-k2-instruct", label: "Kimi K2" },
    { id: "groq/compound-mini", label: "Groq Compound Mini" }
];

class SideAI {
    constructor() {
        this.apiKey = "";
        this.selectedModel = "openai/gpt-oss-120b";
        this.history = [];
        this.currentTab = null;
        this.init();
    }

    async init() {
        chrome.storage.local.get(['apiKey', 'selectedModel'], (data) => {
            this.apiKey = data.apiKey || "";
            this.selectedModel = data.selectedModel || "openai/gpt-oss-120b";
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