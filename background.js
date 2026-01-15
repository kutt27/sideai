// Background script for SideAI (MV2)
let sideAIWindow = null;
let isOpen = false;

chrome.browserAction.onClicked.addListener((tab) => {
    console.log("Browser action clicked for tab:", tab.id);

    if (isOpen && sideAIWindow) {
        // Close existing window
        chrome.windows.remove(sideAIWindow.id);
        sideAIWindow = null;
        isOpen = false;
    } else {
        // Create new popup window
        chrome.windows.create({
            url: chrome.runtime.getURL('sidebar.html'),
            type: 'popup',
            width: 400,
            height: 600,
            left: screen.width - 400,
            top: 0
        }, (window) => {
            sideAIWindow = window;
            isOpen = true;
        });
    }
});

// Handle window closed by user
chrome.windows.onRemoved.addListener((windowId) => {
    if (sideAIWindow && sideAIWindow.id === windowId) {
        sideAIWindow = null;
        isOpen = false;
    }
});

chrome.runtime.onInstalled.addListener(() => {
    console.log("SideAI Extension Installed");
});
