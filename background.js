// Background script for SideAI (MV2)
let activeTabId = null;
let isOpen = false;

chrome.browserAction.onClicked.addListener((tab) => {
    console.log("Browser action clicked for tab:", tab.id);

    if (isOpen && activeTabId === tab.id) {
        // Close sidebar on same tab
        chrome.tabs.sendMessage(activeTabId, { action: 'toggle' }, () => {
            if (chrome.runtime.lastError) {
                console.log("Error closing sidebar:", chrome.runtime.lastError);
            }
        });
        activeTabId = null;
        isOpen = false;
    } else if (isOpen && activeTabId !== tab.id) {
        // Close on old tab, open on new tab
        chrome.tabs.sendMessage(activeTabId, { action: 'toggle' }, () => {
            if (chrome.runtime.lastError) {
                console.log("Error closing sidebar on old tab:", chrome.runtime.lastError);
            }
            // Open on new tab after closing old one
            setTimeout(() => {
                chrome.tabs.sendMessage(tab.id, { action: 'toggle' });
                activeTabId = tab.id;
                isOpen = true;
            }, 100);
        });
    } else {
        // Open sidebar on current tab (was closed)
        chrome.tabs.sendMessage(tab.id, { action: 'toggle' });
        activeTabId = tab.id;
        isOpen = true;
    }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'sidebar_closed') {
        activeTabId = null;
        isOpen = false;
        sendResponse({ success: true });
    }
});

// Listen for tab updates/closes
chrome.tabs.onRemoved.addListener((tabId) => {
    if (tabId === activeTabId) {
        activeTabId = null;
        isOpen = false;
    }
});

// Listen for tab updates (refresh/navigation)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'loading' && tabId === activeTabId) {
        console.log("Active tab refreshed, resetting state");
        activeTabId = null;
        isOpen = false;
    }
});

chrome.runtime.onInstalled.addListener(() => {
    console.log("SideAI Extension Installed");
});
