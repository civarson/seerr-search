const params = new URLSearchParams(location.search);
const query = (params.get("q") || "").trim();
const content = document.getElementById("content");
document.getElementById("queryText").textContent = `"${query}"`;

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
  return res.json();
}

// Seerr media status: 4 = partially available, 5 = available
function statusBadge(mediaInfo) {
  if (!mediaInfo) return null;
  if (mediaInfo.status === 5) return "In library";
  if (mediaInfo.status === 4) return "Partially in library";
  if (mediaInfo.status === 2 || mediaInfo.status === 3) return "Requested";
  return null;
}

async function latestSeason(tmdbId) {
  const tv = await api(`/tv/${tmdbId}`);
  const nums = (tv.seasons || [])
    .map((s) => s.seasonNumber)
    .filter((n) => n > 0);
  return nums.length ? Math.max(...nums) : 1;
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
    const poster = document.createElement("img");
    poster.className = "poster";
    poster.alt = "";
    if (r.posterPath) {
      poster.src = `https://image.tmdb.org/t/p/w154${r.posterPath}`;
    }

    const meta = el("div", "meta");
    const titleRow = el("div", "title", title);
    const typeBadge = el("span", `badge ${r.mediaType}`, isTv ? "TV" : "Movie");
    titleRow.append(typeBadge);
    const have = statusBadge(r.mediaInfo);
    if (have) titleRow.append(el("span", "badge have", have));

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
  const btn = el("button", "btn sm", isTv ? "Request latest season" : "Request movie");
  const note = el("span", "note", isTv ? "Checking seasons…" : "");
  confirm.append(btn, note);
  meta.append(confirm);

  let seasons = null;
  if (isTv) {
    btn.disabled = true;
    try {
      const latest = await latestSeason(r.id);
      seasons = [latest];
      note.textContent = `Season ${latest}`;
      btn.disabled = false;
    } catch {
      note.textContent = "Couldn't load seasons";
      note.className = "result-msg err";
      return;
    }
  }

  btn.addEventListener("click", async () => {
    btn.disabled = true;
    note.className = "note";
    note.textContent = "Requesting…";
    try {
      const body = { mediaType: r.mediaType, mediaId: r.id };
      if (seasons) body.seasons = seasons;
      await apiPost("/request", body);
      note.className = "result-msg ok";
      note.textContent = isTv
        ? `Requested season ${seasons[0]} ✓`
        : "Requested ✓";
      btn.remove();
      setTimeout(() => window.close(), 1600);
    } catch (e) {
      btn.disabled = false;
      note.className = "result-msg err";
      note.textContent =
        e.status === 409 ? "Already requested" : `Failed: ${e.message}`;
    }
  });
}

async function init() {
  if (!query) {
    showState("No text selected.", true);
    return;
  }

  settings = await chrome.storage.sync.get({ baseUrl: "", apiKey: "" });
  if (!settings.baseUrl || !settings.apiKey) {
    showState(
      "Set your Seerr address and API key first.",
      true,
      true
    );
    return;
  }

  const granted = await chrome.permissions.contains({
    origins: [new URL(settings.baseUrl).origin + "/*"],
  });
  if (!granted) {
    showState(
      "The extension doesn't have access to your Seerr address yet. Re-save it in settings to grant access.",
      true,
      true
    );
    return;
  }

  showState("Searching…");
  try {
    const data = await api(`/search?query=${encodeURIComponent(query)}`);
    const titles = (data.results || []).filter(
      (r) => r.mediaType === "movie" || r.mediaType === "tv"
    );
    if (!titles.length) {
      showState(`No movie or TV titles matched "${query}".`, true);
      return;
    }
    renderResults(titles.slice(0, 12));
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

init();
