/* Reading log: renders assets/data/reading.json (exported from The Lantern Library)
   into #reading-home on the homepage and #reading-page on reading.html. */
(() => {
    const homeEl = document.getElementById("reading-home");
    const pageEl = document.getElementById("reading-page");
    if (!homeEl && !pageEl) return;

    const GENRES = {
        fantasy: { name: "Fantasy", short: "Fantasy", region: "The Dragonwood", color: "#5f8a55" },
        scifi: { name: "Science Fiction", short: "Sci-Fi", region: "Starlight Observatory", color: "#4b78a6" },
        mystery: { name: "Mystery & Thriller", short: "Mystery", region: "The Fogbound Alleys", color: "#625f8c" },
        horror: { name: "Horror", short: "Horror", region: "The Haunted Marshes", color: "#6b3a4f" },
        romance: { name: "Romance", short: "Romance", region: "Rosewater Gardens", color: "#b4586a" },
        literary: { name: "Literary Fiction", short: "Literary", region: "The Quiet Reading Room", color: "#a3753f" },
        historical: { name: "Historical Fiction", short: "Historical", region: "The Old Archives", color: "#86653a" },
        memoir: { name: "Biography & Memoir", short: "Memoir", region: "The Portrait Gallery", color: "#946a82" },
        science: { name: "Science & Nature", short: "Science", region: "The Glass Greenhouse", color: "#3f8577" },
        selfhelp: { name: "Self-Help & Psychology", short: "Self-Help", region: "The Lantern Path", color: "#b5862f" },
        history: { name: "History & Society", short: "History", region: "The Map Room", color: "#7a5536" },
        philosophy: { name: "Philosophy & Spirituality", short: "Philosophy", region: "The Moonlit Cloister", color: "#6e74a8" },
        business: { name: "Business & Technology", short: "Business", region: "The Clockwork Workshop", color: "#5f6c78" },
        classics: { name: "Classics & Poetry", short: "Classics", region: "The Bell Tower", color: "#97483a" },
    };
    const KEYS = Object.keys(GENRES);
    const FORMATS = { physical: "Physical", kindle: "Kindle", audio: "Audiobook" };
    const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    const isFinished = (b) => (b.finishes || []).length > 0;
    const lastFinish = (b) => (b.finishes || []).slice().sort().pop() || "";
    const fmtDate = (d) => {
        if (!d) return "";
        const [y, m, day] = d.split("-").map(Number);
        return new Date(y, m - 1, day).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
    };
    function hash(str) {
        let h = 2166136261;
        for (const ch of String(str)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
        return h >>> 0;
    }
    function shade(hex, pct) {
        const n = parseInt(hex.slice(1), 16);
        const f = (v) => Math.max(0, Math.min(255, Math.round(v + (v * pct) / 100)));
        return "#" + [f(n >> 16), f((n >> 8) & 255), f(n & 255)].map((x) => x.toString(16).padStart(2, "0")).join("");
    }
    const okHex = (v) => (/^#[0-9a-f]{6}$/i.test(String(v || "")) ? v : "");

    function stats(books) {
        const finished = books.filter(isFinished);
        const reading = books.filter((b) => b.status === "reading");
        const want = books.filter((b) => b.status === "want");
        const counts = {};
        finished.forEach((b) => { if (GENRES[b.genre]) counts[b.genre] = (counts[b.genre] || 0) + 1; });
        const year = new Date().getFullYear();
        const thisYear = finished.reduce((a, b) => a + (b.finishes || []).filter((d) => d.startsWith(year + "-")).length, 0);
        const pages = finished.reduce((a, b) => a + (b.pages || 0) * (b.finishes || []).length, 0);
        return { finished, reading, want, counts, regions: Object.keys(counts).length, year, thisYear, pages };
    }

    /* ---------- Spines ---------- */
    const ROW = 168;
    function spineHtml(b, rowH = ROW) {
        const g = GENRES[b.genre] || { color: "#6b5b4f" };
        const h0 = hash(b.id + "|" + b.title);
        const p = b.pages || 300;
        const scale = rowH / ROW;
        const h = Math.round(Math.min(ROW - 2, 134 + ((h0 >> 9) % 18) + Math.min(1, p / 1000) * 12) * scale);
        let w = Math.round((32 + Math.min(1, p / 900) * 18) * scale);
        const label = `${esc(b.title)} by ${esc(b.author || "unknown author")}`;
        const common = `type="button" data-book="${esc(b.id)}" title="${esc(b.title)}" aria-label="${label}"`;
        const rib = b.status === "reading" ? '<span class="rspine__ribbon" aria-hidden="true"></span>' : "";
        if (b.spineImg && /^(data:image\/|https:\/\/)/.test(b.spineImg)) {
            w = Math.max(Math.round(20 * scale), Math.min(Math.round(66 * scale), Math.round(h * (b.spineAspect || 0.25))));
            return `<button ${common} class="rspine rspine--photo" style="width:${w}px;height:${h}px;margin-top:${rowH - h}px"><img src="${esc(b.spineImg)}" alt="" loading="lazy">${rib}</button>`;
        }
        const d = b.spine;
        if (d && Array.isArray(d.bg) && okHex(d.bg[0])) {
            const font = ["condensed", "sans", "serif", "script", "slab"].includes(d.font) ? d.font : "sans";
            return `<button ${common} class="rspine rspine--designed f-${font}${d.upper ? " upper" : ""}${d.order === "author-first" ? " afirst" : ""}"
                style="--bg1:${d.bg[0]};--bg2:${okHex(d.bg[1]) || d.bg[0]};--tc:${okHex(d.title) || "#fff"};--ac:${okHex(d.author) || okHex(d.title) || "#fff"};--band:${okHex(d.band) || "transparent"};width:${w}px;height:${h}px;margin-top:${rowH - h}px">
                <span class="rspine__pub" aria-hidden="true"></span><span class="rspine__title">${esc(b.title)}</span><span class="rspine__author">${esc(b.author || "")}</span>${rib}</button>`;
        }
        const c = shade(g.color, ((h0 >> 4) % 36) - 18);
        const surname = (b.author || "").trim().split(/\s+/).pop() || "";
        return `<button ${common} class="rspine rspine--s${h0 % 4}" style="--c:${c};--c2:${shade(c, -38)};--c3:${shade(c, 28)};width:${w}px;height:${h}px;margin-top:${rowH - h}px">
            <span class="rspine__title">${esc(b.title)}</span><span class="rspine__author">${esc(surname)}</span><span class="rspine__mark" aria-hidden="true"></span>${rib}</button>`;
    }

    /* ---------- Spider web chart ---------- */
    function radarSvg(counts, compact) {
        const N = KEYS.length, cx = 210, cy = 200, R = 128;
        const vals = KEYS.map((k) => counts[k] || 0);
        const top = Math.max(...vals);
        const max = Math.max(2, Math.ceil(top / 2) * 2);
        const ang = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / N;
        const pt = (i, r) => [cx + r * Math.cos(ang(i)), cy + r * Math.sin(ang(i))];
        const poly = (f) => KEYS.map((_, i) => pt(i, R * f).map((v) => v.toFixed(1)).join(",")).join(" ");
        const rings = [0.25, 0.5, 0.75, 1].map((f) => `<polygon class="rw__ring${f === 1 ? " rw__ring--outer" : ""}" points="${poly(f)}"/>`).join("");
        const spokes = KEYS.map((_, i) => { const [x, y] = pt(i, R); return `<line class="rw__spoke" x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"/>`; }).join("");
        const ringLabels = [0.5, 1].map((f) => `<text class="rw__tick" x="${cx + 4}" y="${(cy - R * f + 12).toFixed(1)}">${max * f}</text>`).join("");
        const shape = KEYS.map((_, i) => pt(i, (R * vals[i]) / max).map((v) => v.toFixed(1)).join(",")).join(" ");
        const labels = KEYS.map((k, i) => {
            const [x, y] = pt(i, R + 22); const c = Math.cos(ang(i));
            const anchor = Math.abs(c) < 0.2 ? "middle" : c > 0 ? "start" : "end";
            return `<text class="rw__label${vals[i] ? " is-on" : ""}" x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="${anchor}">${GENRES[k].short}</text>`;
        }).join("");
        const dots = KEYS.map((k, i) => {
            const [x, y] = pt(i, (R * vals[i]) / max);
            return `<g class="rw__vtx" tabindex="0" data-i="${i}" role="img" aria-label="${esc(GENRES[k].name)}: ${vals[i]} book${vals[i] === 1 ? "" : "s"}">
                <circle class="rw__dot${vals[i] ? "" : " is-zero"}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${vals[i] ? 5 : 3}"/>
                <circle class="rw__hit" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="16"/><title>${esc(GENRES[k].name)}: ${vals[i]}</title></g>`;
        }).join("");
        return `<svg class="rw${compact ? " rw--compact" : ""}" viewBox="0 0 420 400" role="group" aria-label="Spider web chart of books finished in each genre">
            ${rings}${spokes}${ringLabels}<polygon class="rw__shape" points="${shape}"/>${labels}${dots}</svg>`;
    }
    function wireRadar(root, counts) {
        const out = root.querySelector("[data-radar-read]");
        root.querySelectorAll(".rw__vtx").forEach((v) => {
            const show = () => {
                root.querySelectorAll(".rw__vtx").forEach((x) => x.classList.toggle("is-hl", x === v));
                const k = KEYS[+v.dataset.i]; const n = counts[k] || 0;
                if (out) out.innerHTML = `<b>${esc(GENRES[k].name)}</b> · ${n} book${n === 1 ? "" : "s"}`;
            };
            v.addEventListener("pointerenter", show); v.addEventListener("focus", show); v.addEventListener("click", show);
        });
    }

    /* ---------- Shared pieces ---------- */
    function nowReadingHtml(list) {
        if (!list.length) return '<p class="rlog__empty">Between books right now. Something new will be here soon.</p>';
        return `<div class="rnow">${list.map((b) => {
            const g = GENRES[b.genre];
            const pct = Math.max(0, Math.min(100, Math.round(b.progressPct || 0)));
            return `<button type="button" class="rnow__card" data-book="${esc(b.id)}">
                <span class="rnow__spine">${spineHtml(b, 120).replace(/<button /, "<span ").replace(/<\/button>$/, "</span>").replace(/type="button" /, "")}</span>
                <span class="rnow__body">
                    <span class="rnow__meta">${[g && g.name, FORMATS[b.format]].filter(Boolean).map(esc).join(" · ")}</span>
                    <span class="rnow__title">${esc(b.title)}</span>
                    <span class="rnow__author">${esc(b.author || "")}</span>
                    <span class="rnow__bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="${pct}% read"><i style="width:${pct}%"></i></span>
                    <span class="rnow__pct">${pct}% read${b.pages ? " · " + b.pages.toLocaleString() + " pages" : ""}</span>
                </span></button>`;
        }).join("")}</div>`;
    }
    function shelfHtml(books, rowH) {
        if (!books.length) return '<p class="rlog__empty">The shelf is waiting for its first finished book.</p>';
        return `<div class="rshelf" style="--row:${rowH}px">${books.map((b) => spineHtml(b, rowH)).join("")}</div>`;
    }
    const byRecent = (a, b) => lastFinish(b).localeCompare(lastFinish(a));

    /* ---------- Book dialog ---------- */
    let dialog = null;
    function openBook(book) {
        if (!dialog) {
            dialog = document.createElement("dialog");
            dialog.className = "rbook";
            document.body.appendChild(dialog);
            dialog.addEventListener("click", (e) => { if (e.target === dialog || e.target.closest("[data-close]")) dialog.close(); });
        }
        const g = GENRES[book.genre];
        const fin = book.finishes || [];
        const quotes = book.quotes || [];
        dialog.innerHTML = `<div class="rbook__inner">
            <div class="rbook__spine">${spineHtml(book, 190).replace(/<button /, "<span ").replace(/<\/button>$/, "</span>").replace(/type="button" /, "")}</div>
            <div class="rbook__body">
                <p class="eyebrow">${esc(g ? g.name : "Unsorted")}${book.series ? " · " + esc(book.series) + (book.seriesNo ? " #" + book.seriesNo : "") : ""}</p>
                <h3>${esc(book.title)}</h3>
                <p class="rbook__author">${esc(book.author || "")}</p>
                ${book.rating ? `<p class="rbook__stars" aria-label="Rated ${book.rating} out of 5">${"★".repeat(book.rating)}<span>${"★".repeat(5 - book.rating)}</span></p>` : ""}
                ${(book.moods || []).length ? `<p class="rbook__moods">${book.moods.map((m) => `<span>${esc(m)}</span>`).join("")}</p>` : ""}
                ${book.thoughts ? `<blockquote class="rbook__thoughts">${esc(book.thoughts)}</blockquote>` : ""}
                ${quotes.length ? `<div class="rbook__quotes"><p class="eyebrow">Lines I kept</p>${quotes.map((q) => `<figure><blockquote>${esc(q.text)}</blockquote>${q.loc ? `<figcaption>${esc(q.loc)}</figcaption>` : ""}</figure>`).join("")}</div>` : ""}
                <dl class="rbook__facts">
                    ${book.status === "reading" ? `<dt>Status</dt><dd>Reading now, ${Math.round(book.progressPct || 0)}% in</dd>` : ""}
                    ${book.status === "want" ? "<dt>Status</dt><dd>On my to-read pile</dd>" : ""}
                    ${fin.length ? `<dt>Finished</dt><dd>${fin.slice().sort().reverse().map(fmtDate).join(", ")}</dd>` : ""}
                    ${book.format ? `<dt>Format</dt><dd>${FORMATS[book.format] || ""}</dd>` : ""}
                    ${book.pages ? `<dt>Pages</dt><dd>${book.pages.toLocaleString()}</dd>` : ""}
                    ${book.year ? `<dt>Published</dt><dd>${book.year}</dd>` : ""}
                </dl>
                <button type="button" class="line-link" data-close>Close</button>
            </div></div>`;
        dialog.showModal();
    }
    function wireBooks(root, books) {
        root.addEventListener("click", (e) => {
            const el = e.target.closest("[data-book]"); if (!el) return;
            const b = books.find((x) => x.id === el.dataset.book); if (b) openBook(b);
        });
    }

    /* ---------- Homepage teaser ---------- */
    function renderHome(data) {
        const books = data.books || [];
        const s = stats(books);
        const recent = s.finished.slice().sort(byRecent).slice(0, 10);
        homeEl.innerHTML = `
            <div class="rhome">
                <div class="rhome__left">
                    <p class="eyebrow">On my nightstand</p>
                    ${nowReadingHtml(s.reading.slice(0, 3))}
                    <p class="eyebrow rhome__label">Recently finished</p>
                    ${shelfHtml(recent, 132)}
                    <div class="rhome__stats">
                        <span><b>${s.thisYear}</b> books in ${s.year}</span>
                        <span><b>${s.finished.length}</b> all time</span>
                        <span><b>${s.regions}</b> of 14 genres explored</span>
                    </div>
                    <a class="line-link" href="reading.html">Browse my whole library <span aria-hidden="true">↗</span></a>
                </div>
                <figure class="rhome__web">
                    ${radarSvg(s.counts, true)}
                    <figcaption data-radar-read>My reading web: books finished in each genre.</figcaption>
                </figure>
            </div>`;
        wireRadar(homeEl, s.counts);
        wireBooks(homeEl, books);
    }

    /* ---------- Full page ---------- */
    let filter = "";
    function renderPage(data) {
        const books = data.books || [];
        const s = stats(books);
        const per = Array(12).fill(0);
        s.finished.forEach((b) => (b.finishes || []).forEach((d) => { if (d.startsWith(s.year + "-")) per[+d.slice(5, 7) - 1]++; }));
        const maxM = Math.max(1, ...per);
        const shelf = s.finished.filter((b) => !filter || b.genre === filter).sort(byRecent);
        const usedGenres = KEYS.filter((k) => s.counts[k]);
        pageEl.innerHTML = `
            <section class="rlog__stats reveal is-visible" aria-label="Reading totals">
                <div><b>${s.finished.length}</b><span>books finished</span></div>
                <div><b>${s.thisYear}</b><span>in ${s.year}</span></div>
                <div><b>${s.pages.toLocaleString()}</b><span>pages turned</span></div>
                <div><b>${s.regions}<small>/14</small></b><span>genres explored</span></div>
            </section>

            <section class="rlog__block" aria-labelledby="now-title">
                <h2 id="now-title" class="rlog__h">Reading now</h2>
                ${nowReadingHtml(s.reading)}
            </section>

            <section class="rlog__block rlog__genres" aria-labelledby="genre-title">
                <h2 id="genre-title" class="rlog__h">The genre map</h2>
                <div class="rlog__genre-grid">
                    <figure class="rlog__web">
                        ${radarSvg(s.counts, false)}
                        <figcaption data-radar-read>Tap a point to see how many books I have read in that genre.</figcaption>
                    </figure>
                    <div class="rmap">
                        <p class="rmap__note">Each genre I read clears the fog from its region. One book explores it, three settle it, seven master it.</p>
                        <div class="rmap__regions">${KEYS.map((k) => {
                            const g = GENRES[k]; const n = s.counts[k] || 0;
                            const stars = n >= 7 ? 3 : n >= 3 ? 2 : n >= 1 ? 1 : 0;
                            return `<button type="button" class="rmap__region${n ? "" : " is-fogged"}${filter === k ? " is-active" : ""}" data-filter="${n ? k : ""}" ${n ? "" : "disabled"} style="--c:${g.color}" aria-label="${esc(g.region)}, ${esc(g.name)}: ${n ? n + " book" + (n > 1 ? "s" : "") : "not explored yet"}">
                                <span class="rmap__crest" aria-hidden="true">${g.name[0]}</span>
                                <span class="rmap__name">${esc(g.region)}</span>
                                <span class="rmap__genre">${esc(g.name)}</span>
                                ${n ? `<span class="rmap__count">${n} book${n > 1 ? "s" : ""} <i aria-hidden="true">${"★".repeat(stars)}${"☆".repeat(3 - stars)}</i></span>` : '<span class="rmap__fog" aria-hidden="true"></span><span class="rmap__count">Still in the fog</span>'}
                            </button>`;
                        }).join("")}</div>
                    </div>
                </div>
            </section>

            <section class="rlog__block" aria-labelledby="shelf-title">
                <div class="rlog__shelf-head">
                    <h2 id="shelf-title" class="rlog__h">The shelf</h2>
                    ${usedGenres.length > 1 ? `<div class="rchips" role="group" aria-label="Filter by genre">
                        <button type="button" class="rchip" data-filter="" aria-pressed="${!filter}">All</button>
                        ${usedGenres.map((k) => `<button type="button" class="rchip" data-filter="${k}" aria-pressed="${filter === k}" style="--c:${GENRES[k].color}">${esc(GENRES[k].short)}</button>`).join("")}</div>` : ""}
                </div>
                <p class="rlog__hint">Tap a spine to see my rating and what I thought.</p>
                ${shelfHtml(shelf, ROW)}
            </section>

            <section class="rlog__block" aria-labelledby="year-title">
                <h2 id="year-title" class="rlog__h">${s.year}, month by month</h2>
                <div class="rmonths" role="img" aria-label="Books finished each month in ${s.year}">
                    ${per.map((v, i) => `<div class="rmonths__col" title="${MONTHS[i]}: ${v} book${v === 1 ? "" : "s"}"><span class="rmonths__val">${v || ""}</span><i style="height:${Math.round((v / maxM) * 100)}%"></i><span class="rmonths__m">${MONTHS[i][0]}</span></div>`).join("")}
                </div>
            </section>

            ${s.want.length ? `<section class="rlog__block" aria-labelledby="next-title">
                <h2 id="next-title" class="rlog__h">Up next</h2>
                <ul class="rnext">${s.want.map((b) => `<li><button type="button" data-book="${esc(b.id)}"><span>${esc(b.title)}</span><small>${esc(b.author || "")}${GENRES[b.genre] ? " · " + esc(GENRES[b.genre].name) : ""}</small></button></li>`).join("")}</ul>
            </section>` : ""}

            <p class="rlog__updated">Updated ${fmtDate(data.updated)} from my reading tracker, The Lantern Library.</p>`;
        wireRadar(pageEl, s.counts);
        pageEl.querySelectorAll("[data-filter]").forEach((el) => el.addEventListener("click", () => {
            const v = el.dataset.filter;
            filter = filter === v ? "" : v;
            renderPage(data);
            const t = document.getElementById("shelf-title"); if (t && v) t.scrollIntoView({ behavior: "smooth", block: "start" });
        }));
    }

    function fail() {
        const msg = '<p class="rlog__empty">My reading log could not load right now.</p>';
        if (homeEl) homeEl.innerHTML = msg;
        if (pageEl) pageEl.innerHTML = msg;
    }
    // Live data from The Lantern Library (Supabase) when connected; otherwise the JSON file in this repo.
    function loadData() {
        const fileData = () => fetch("assets/data/reading.json", { cache: "no-cache" }).then((r) => (r.ok ? r.json() : Promise.reject(r.status)));
        const C = window.LANTERN_CONFIG || {};
        if (!C.supabaseUrl || !C.supabaseAnonKey) return fileData();
        return fetch(`${C.supabaseUrl}/rest/v1/public_reading?id=eq.public&select=data,updated_at`, {
            headers: { apikey: C.supabaseAnonKey, Authorization: `Bearer ${C.supabaseAnonKey}` },
            cache: "no-cache",
        })
            .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
            .then((rows) => (rows && rows[0] && rows[0].data && Array.isArray(rows[0].data.books) ? rows[0].data : fileData()))
            .catch(fileData);
    }
    loadData()
        .then((data) => {
            if (homeEl) renderHome(data);
            if (pageEl) {
                renderPage(data);
                wireBooks(pageEl, data.books || []);
            }
        })
        .catch(fail);
})();
