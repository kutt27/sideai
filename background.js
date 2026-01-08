// Background script for SideAI (MV2)
chrome.browserAction.onClicked.addListener((tab) => {
    console.log("Browser action clicked for tab:", tab.id);
    chrome.tabs.sendMessage(tab.id, { action: "toggle" }, () => {
        if (chrome.runtime.lastError) {
            console.warn("Could not toggle: ", chrome.runtime.lastError.message);
            // Fallback: try injecting if not present
            chrome.tabs.executeScript(tab.id, { file: "content.js" });
            chrome.tabs.insertCSS(tab.id, { file: "content.css" });
        }
    });
});

chrome.runtime.onInstalled.addListener(() => {
    console.log("SideAI Extension Installed");
});
