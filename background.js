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

function openRequestDialog(text) {
  const url = chrome.runtime.getURL(
    `dialog.html?q=${encodeURIComponent(text.trim().slice(0, 200))}`
  );
  chrome.windows.create({ url, type: "popup", width: 440, height: 620 });
}

chrome.runtime.onInstalled.addListener(async () => {
  const s = await getSettings();
  await rebuildMenus(s);
  if (!s.baseUrl) chrome.runtime.openOptionsPage();
});

chrome.runtime.onStartup.addListener(rebuildMenus);

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.trigger) rebuildMenus();
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
