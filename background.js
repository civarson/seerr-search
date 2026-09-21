const SEARCH_ID = "seerr-search";
const REQUEST_ID = "seerr-request";

const DEFAULTS = { baseUrl: "", apiKey: "", trigger: "menu", tvSeason: "latest" };

function getSettings() {
  return chrome.storage.sync.get(DEFAULTS);
}

async function rebuildMenus(s) {
  const { trigger } = s ?? await getSettings();
  await chrome.contextMenus.removeAll();

  chrome.contextMenus.create({
    id: SEARCH_ID,
    title: 'Search Seerr for "%s"',
    contexts: ["selection"],
  });

  if (trigger === "menu" || trigger === "both") {
    chrome.contextMenus.create({
      id: REQUEST_ID,
      title: 'Request "%s" on Seerr',
      contexts: ["selection"],
    });
  }
}

const SCRIPT_ID = "seerr-floating-button";

async function updateContentScriptRegistration(s) {
  const { trigger } = s ?? await getSettings();
  const shouldRegister = trigger === "button" || trigger === "both";

  try {
    const existing = await chrome.scripting.getRegisteredContentScripts({ ids: [SCRIPT_ID] });
    const isRegistered = existing.length > 0;

    if (shouldRegister && !isRegistered) {
      const hasPermission = await chrome.permissions.contains({
        origins: ["http://*/*", "https://*/*"],
      });
      if (hasPermission) {
        await chrome.scripting.registerContentScripts([
          {
            id: SCRIPT_ID,
            matches: ["<all_urls>"],
            js: ["content.js"],
            runAt: "document_idle",
            persistAcrossSessions: true,
          },
        ]);
      }
    } else if (!shouldRegister && isRegistered) {
      await chrome.scripting.unregisterContentScripts({ ids: [SCRIPT_ID] });
    }
  } catch (err) {
    console.error("Failed to update content script registration:", err);
  }
}

function openRequestDialog(text = "") {
  const query = text ? `?q=${encodeURIComponent(text.trim().slice(0, 200))}` : "";
  const url = chrome.runtime.getURL(`dialog.html${query}`);
  chrome.windows.create({ url, type: "popup", width: 440, height: 620 });
}

// Omnibox support (type 'seerr' + space in Chrome address bar)
chrome.omnibox.setDefaultSuggestion({
  description: 'Search Seerr for "<match>%s</match>"',
});

chrome.omnibox.onInputEntered.addListener(async (text, disposition) => {
  const { baseUrl } = await getSettings();
  if (!baseUrl) {
    chrome.runtime.openOptionsPage();
    return;
  }
  const query = encodeURIComponent(text.trim());
  const url = `${baseUrl}/search?query=${query}`;
  if (disposition === "currentTab") {
    chrome.tabs.update({ url });
  } else {
    chrome.tabs.create({ url });
  }
});

chrome.runtime.onInstalled.addListener(async () => {
  const s = await getSettings();
  await rebuildMenus(s);
  await updateContentScriptRegistration(s);
  if (!s.baseUrl) chrome.runtime.openOptionsPage();
});

chrome.runtime.onStartup.addListener(async () => {
  const s = await getSettings();
  await rebuildMenus(s);
  await updateContentScriptRegistration(s);
});

chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area === "sync" && changes.trigger) {
    await rebuildMenus();
    await updateContentScriptRegistration();
  }
});

chrome.contextMenus.onClicked.addListener(async (info) => {
  if (!info.selectionText) return;

  if (info.menuItemId === SEARCH_ID) {
    const { baseUrl } = await getSettings();
    if (!baseUrl) {
      chrome.runtime.openOptionsPage();
      return;
    }
    const query = encodeURIComponent(info.selectionText.trim());
    chrome.tabs.create({ url: `${baseUrl}/search?query=${query}` });
  }

  if (info.menuItemId === REQUEST_ID) {
    openRequestDialog(info.selectionText);
  }
});

// Floating button in content script asks us to open the dialog.
chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === "open-request-dialog" && msg.text) {
    openRequestDialog(msg.text);
  }
});
