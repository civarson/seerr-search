const params = new URLSearchParams(location.search);
const initialQuery = (params.get("q") || "").trim();

const content = document.getElementById("content");
const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const clearBtn = document.getElementById("clearBtn");

let settings = null;

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function showState(message, isError, withOptionsBtn) {
  content.replaceChildren();
  const box = el("div", "state" + (isError ? " err" : ""), message);
  if (withOptionsBtn) {
    const btn = el("button", "btn", "Open settings");
    btn.addEventListener("click", () => chrome.runtime.openOptionsPage());
    box.append(document.createElement("br"), btn);
  }
  content.append(box);
}

function showEmptyState() {
  content.replaceChildren();
  const box = el("div", "empty-state");
  box.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
    <p>Search your Seerr instance for movies or TV shows to request.</p>
  `;
  content.append(box);
}

async function api(path) {
  const res = await fetch(`${settings.baseUrl}/api/v1${path}`, {
    headers: { "X-Api-Key": settings.apiKey },
  });
  if (!res.ok) {
    const err = new Error(`API ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

async function apiPost(path, body) {
  const res = await fetch(`${settings.baseUrl}/api/v1${path}`, {
    method: "POST",
    headers: {
      "X-Api-Key": settings.apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let detail = "";
    try {
      detail = (await res.json()).message || "";
    } catch {}
    const err = new Error(detail || `API ${res.status}`);
    err.status = res.status;
    throw err;
  }
}

// Seerr media status: 4 = partially available, 5 = available, 2/3 = requested
function statusBadge(mediaInfo) {
  if (!mediaInfo) return null;
  if (mediaInfo.status === 5) return "In library";
  if (mediaInfo.status === 4) return "Partially in library";
  if (mediaInfo.status === 2 || mediaInfo.status === 3) return "Requested";
  return null;
}

function createPoster(posterPath, title) {
  if (posterPath) {
    const img = document.createElement("img");
    img.className = "poster";
    img.alt = title || "";
    img.src = `https://image.tmdb.org/t/p/w154${posterPath}`;
    img.onerror = () => {
      const fallback = createPosterPlaceholder();
      img.replaceWith(fallback);
    };
    return img;
  }
  return createPosterPlaceholder();
}

function createPosterPlaceholder() {
  const wrap = document.createElement("div");
  wrap.className = "poster-placeholder";
  wrap.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/>
      <line x1="7" y1="2" x2="7" y2="22"/>
      <line x1="17" y1="2" x2="17" y2="22"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <line x1="2" y1="7" x2="7" y2="7"/>
      <line x1="2" y1="17" x2="7" y2="17"/>
      <line x1="17" y1="17" x2="22" y2="17"/>
      <line x1="17" y1="7" x2="22" y2="7"/>
    </svg>
  `;
  return wrap;
}

function createSeerrLink(mediaType, tmdbId) {
  if (!settings?.baseUrl) return null;
  const a = document.createElement("a");
  a.className = "seerr-link";
  a.title = "View on Seerr";
  a.href = `${settings.baseUrl}/${mediaType}/${tmdbId}`;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.innerHTML = `
    <svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fill-rule="evenodd" d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h4a.75.75 0 010 1.5h-4z" clip-rule="evenodd" />
      <path fill-rule="evenodd" d="M6.194 12.753a.75.75 0 001.06 1.06l7.247-7.247v2.684a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.684l-7.247 7.253z" clip-rule="evenodd" />
    </svg>
  `;
  a.addEventListener("click", (e) => e.stopPropagation());
  return a;
}

async function getSeasonDetails(tmdbId) {
  const tv = await api(`/tv/${tmdbId}`);
  const availableSeasonNums = new Set();
  const mediaSeasons = tv.mediaInfo?.seasons || [];
  mediaSeasons.forEach((ms) => {
    if (ms.status === 5) {
      availableSeasonNums.add(ms.seasonNumber);
    }
  });

  const rawSeasons = tv.seasons || [];
  const seasons = rawSeasons
    .filter((s) => s.seasonNumber > 0)
    .map((s) => ({
      seasonNumber: s.seasonNumber,
      isAvailable: availableSeasonNums.has(s.seasonNumber),
    }));

  return seasons.length ? seasons : [{ seasonNumber: 1, isAvailable: false }];
}

function renderResults(results) {
  content.replaceChildren();
  const list = el("div");
  list.id = "list";

  results.forEach((r) => {
    const isTv = r.mediaType === "tv";
    const title = isTv ? r.name : r.title;
    const date = isTv ? r.firstAirDate : r.releaseDate;
    const year = date ? date.slice(0, 4) : "—";

    const item = el("div", "item");
    const poster = createPoster(r.posterPath, title);

    const meta = el("div", "meta");
    const titleRow = el("div", "title-row");
    const titleText = el("span", "title", title);
    const typeBadge = el("span", `badge ${r.mediaType}`, isTv ? "TV" : "Movie");
    titleRow.append(titleText, typeBadge);

    const have = statusBadge(r.mediaInfo);
    if (have) titleRow.append(el("span", "badge have", have));

    const link = createSeerrLink(r.mediaType, r.id);
    if (link) titleRow.append(link);

    meta.append(titleRow, el("div", "sub", year));
    if (r.overview) meta.append(el("div", "overview", r.overview));

    item.append(poster, meta);
    item.addEventListener("click", () => select(item, meta, r));
    list.append(item);
  });

  content.append(list);
}

async function select(item, meta, r) {
  if (item.classList.contains("selected")) return;
  document.querySelectorAll(".item.selected").forEach((n) => {
    n.classList.remove("selected");
    n.querySelector(".confirm")?.remove();
  });
  item.classList.add("selected");

  const isTv = r.mediaType === "tv";
  const confirm = el("div", "confirm");
  meta.append(confirm);

  if (!isTv) {
    const btn = el("button", "btn sm", "Request movie");
    const note = el("span", "note", "");
    confirm.append(btn, note);
    btn.addEventListener("click", async () => {
      btn.disabled = true;
      note.className = "note";
      note.textContent = "Requesting…";
      try {
        await apiPost("/request", { mediaType: r.mediaType, mediaId: r.id });
        note.className = "result-msg ok";
        note.textContent = "Requested ✓";
        btn.remove();
        setTimeout(() => window.close(), 1600);
      } catch (e) {
        btn.disabled = false;
        note.className = "result-msg err";
        note.textContent = e.status === 409 ? "Already requested" : `Failed: ${e.message}`;
      }
    });
    return;
  }

  // TV: fetch seasons then show checkbox list
  confirm.classList.add("confirm--tv");

  const loadNote = el("span", "note", "Loading seasons…");
  confirm.append(loadNote);

  let seasonsData;
  try {
    seasonsData = await getSeasonDetails(r.id);
  } catch {
    loadNote.textContent = "Couldn't load seasons";
    loadNote.className = "result-msg err";
    return;
  }

  loadNote.remove();

  const seasonList = el("div", "season-list");
  const checkboxes = seasonsData.map((s) => {
    const lbl = document.createElement("label");
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.value = String(s.seasonNumber);
    if (s.isAvailable) {
      cb.disabled = true;
      cb.dataset.originallyDisabled = "true";
    }
    lbl.append(cb, document.createTextNode(` Season ${s.seasonNumber}`));
    if (s.isAvailable) {
      lbl.append(el("span", "season-status", "In library"));
    }
    seasonList.append(lbl);
    return cb;
  });

  const divider = document.createElement("hr");
  divider.className = "season-divider";
  seasonList.append(divider);

  const allLbl = document.createElement("label");
  const allCb = document.createElement("input");
  allCb.type = "checkbox";
  allLbl.append(allCb, document.createTextNode(" All seasons"));
  seasonList.append(allLbl);

  confirm.append(seasonList);

  const tvSeason = settings.tvSeason;
  if (tvSeason === "all") {
    allCb.checked = true;
    checkboxes.forEach((cb) => {
      if (!cb.dataset.originallyDisabled) cb.disabled = true;
    });
  } else if (tvSeason === "latest") {
    const availableCbs = checkboxes.filter((cb) => !cb.dataset.originallyDisabled);
    if (availableCbs.length) {
      availableCbs[availableCbs.length - 1].checked = true;
    } else if (checkboxes.length) {
      checkboxes[checkboxes.length - 1].checked = true;
    }
  } else {
    const availableCbs = checkboxes.filter((cb) => !cb.dataset.originallyDisabled);
    if (availableCbs.length) {
      availableCbs[0].checked = true;
    } else if (checkboxes.length) {
      checkboxes[0].checked = true;
    }
  }

  const actionsRow = el("div", "confirm-actions");
  const btn = el("button", "btn sm", "Request");
  const note = el("span", "note", "");
  actionsRow.append(btn, note);
  confirm.append(actionsRow);

  function syncBtn() {
    btn.disabled = !allCb.checked && !checkboxes.some((cb) => cb.checked);
  }
  syncBtn();

  allCb.addEventListener("change", () => {
    checkboxes.forEach((cb) => {
      if (!cb.dataset.originallyDisabled) {
        cb.disabled = allCb.checked;
        if (allCb.checked) cb.checked = false;
      }
    });
    syncBtn();
  });

  checkboxes.forEach((cb) => {
    cb.addEventListener("change", () => {
      if (cb.checked) allCb.checked = false;
      syncBtn();
    });
  });

  btn.addEventListener("click", async () => {
    btn.disabled = true;
    allCb.disabled = true;
    seasonList.querySelectorAll("input").forEach((cb) => { cb.disabled = true; });
    note.className = "note";
    note.textContent = "Requesting…";
    const isAll = allCb.checked;
    const seasons = isAll
      ? seasonsData.map((s) => s.seasonNumber)
      : checkboxes.filter((cb) => cb.checked).map((cb) => parseInt(cb.value, 10));
    try {
      await apiPost("/request", { mediaType: r.mediaType, mediaId: r.id, seasons });
      note.className = "result-msg ok";
      note.textContent = isAll
        ? "Requested all seasons ✓"
        : seasons.length === 1
          ? `Requested season ${seasons[0]} ✓`
          : `Requested ${seasons.length} seasons ✓`;
      seasonList.remove();
      btn.remove();
      setTimeout(() => window.close(), 1600);
    } catch (e) {
      btn.disabled = false;
      allCb.disabled = false;
      checkboxes.forEach((cb) => {
        if (!cb.dataset.originallyDisabled) cb.disabled = false;
      });
      note.className = "result-msg err";
      note.textContent = e.status === 409 ? "Already requested" : `Failed: ${e.message}`;
    }
  });
}

async function performSearch(query) {
  const trimmed = (query || "").trim();
  if (!trimmed) {
    showEmptyState();
    return;
  }

  showState("Searching…");
  try {
    const data = await api(`/search?query=${encodeURIComponent(trimmed)}`);
    const titles = (data.results || []).filter(
      (r) => r.mediaType === "movie" || r.mediaType === "tv"
    );
    if (!titles.length) {
      showState(`No movie or TV titles matched "${trimmed}".`, true);
      return;
    }
    renderResults(titles.slice(0, 15));
  } catch (e) {
    showState(
      e.status === 403
        ? "Seerr rejected the API key. Check it in settings."
        : `Couldn't reach Seerr: ${e.message}`,
      true,
      e.status === 403
    );
  }
}

// Search input and clear button handlers
searchInput.addEventListener("input", () => {
  clearBtn.style.display = searchInput.value.trim() ? "block" : "none";
});

clearBtn.addEventListener("click", () => {
  searchInput.value = "";
  clearBtn.style.display = "none";
  searchInput.focus();
});

searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const q = searchInput.value.trim();
  if (q) performSearch(q);
});

const openWebBtn = document.getElementById("openWebBtn");
const settingsBtn = document.getElementById("settingsBtn");
const footerHostText = document.getElementById("footerHostText");
const statusDot = document.querySelector(".status-dot");
const brandVersion = document.getElementById("brandVersion");

if (brandVersion && typeof chrome !== "undefined" && chrome.runtime?.getManifest) {
  brandVersion.textContent = chrome.runtime.getManifest().version;
}

openWebBtn?.addEventListener("click", () => {
  if (settings?.baseUrl) {
    chrome.tabs.create({ url: settings.baseUrl });
  } else {
    chrome.runtime.openOptionsPage();
  }
});

settingsBtn?.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

function updateFooterStatus() {
  if (settings?.baseUrl) {
    try {
      const u = new URL(settings.baseUrl);
      if (footerHostText) footerHostText.textContent = u.host;
      statusDot?.classList.add("connected");
    } catch {
      if (footerHostText) footerHostText.textContent = "Configured";
    }
  } else {
    if (footerHostText) footerHostText.textContent = "Click ⚙ to configure";
    statusDot?.classList.remove("connected");
  }
}

async function init() {
  settings = await chrome.storage.sync.get({ baseUrl: "", apiKey: "", tvSeason: "latest" });
  updateFooterStatus();

  if (!settings.baseUrl || !settings.apiKey) {
    showState(
      "Set your Seerr address and API key first.",
      true,
      true
    );
    return;
  }

  let origin;
  try {
    origin = new URL(settings.baseUrl).origin + "/*";
  } catch {
    showState("Invalid Seerr address in settings.", true, true);
    return;
  }

  const granted = await chrome.permissions.contains({
    origins: [origin],
  });
  if (!granted) {
    showState(
      "The extension doesn't have access to your Seerr address yet. Re-save it in settings to grant access.",
      true,
      true
    );
    return;
  }

  if (initialQuery) {
    searchInput.value = initialQuery;
    clearBtn.style.display = "block";
    performSearch(initialQuery);
  } else {
    showEmptyState();
    searchInput.focus();
  }
}

init();

