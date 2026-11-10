// Renders a Markdown file into the page. You shouldn't need to touch this:
// edit home.md, projects.md and projects/*/index.md instead.
//
// Which file: <body data-md="home.md">, or page.html?p=projects/foo/index.md
const file = document.body.dataset.md || new URLSearchParams(location.search).get("p");

const nav = document.createElement("nav");
nav.innerHTML = `<a href="./">About</a><a href="projects.html">Projects</a><a href="cv.pdf" target="_blank" rel="noopener"><svg class="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 1.5h5l3.5 3.5v9.5H4z"/><path d="M8.5 1.5V5.5h4M6 8.5h4.5M6 11h4.5"/></svg>CV</a>`;
for (const a of nav.querySelectorAll("a")) {
  const here = location.pathname.split("/").pop() || "./";
  const onProjectPage = file?.startsWith("projects/");
  if (a.getAttribute("href") === here || (onProjectPage && a.textContent === "Projects")) a.className = "current";
}
document.body.prepend(nav);

const main = document.querySelector("main");
fetch(file, { cache: "no-cache" }) // always check for a newer .md (cheap: 304 if unchanged)
  .then((r) => { if (!r.ok) throw new Error(r.status); return r.text(); })
  .then((md) => {
    const { text, math } = protectMath(md);
    main.innerHTML = restoreMath(marked.parse(text), math);
    const h1 = main.querySelector("h1");
    if (h1 && file !== "home.md") document.title = `${h1.textContent} · Jorge Romeu Huidobro`;
    fixLinks(main);
    contactLinks(main);
    orgLinks(main);
    intro(main);
    videos(main);
    badges(main);
    linkRows(main);
    if (file === "projects.md") projectList(main);   // the project-row layout is only for the Projects list
    if (typeof startTracer === "function") startTracer();
    if (math.length) typesetMath(main);
  })
  .catch(() => location.replace("404.html"));

// ---- Math: $inline$ and $$display$$ (rendered with MathJax) ----
// The math is taken out before Markdown parsing (so _ and * inside it aren't turned into
// italics) and put back afterwards. Code spans/blocks are left alone. "$5 and $10" stays text,
// and \$ is a literal dollar sign.
function protectMath(md) {
  const math = [];
  const keep = (tex, display) => `MATHPLACEHOLDER${math.push({ tex, display }) - 1}X`;
  const parts = md.split(/(```[\s\S]*?```|`[^`\n]*`)/);       // odd entries are code
  const text = parts.map((part, i) => i % 2 ? part : part
    .replace(/\$\$([\s\S]+?)\$\$/g, (_, tex) => keep(tex, true))
    .replace(/(^|[^\\$])\$(?!\s)([^$\n]+?)(?<![\s\\])\$(?!\d)/g, (_, pre, tex) => pre + keep(tex, false))
  ).join("");
  return { text, math };
}
function restoreMath(html, math) {
  const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return html
    .replace(/<p>MATHPLACEHOLDER(\d+)X<\/p>/g, (m, i) => (math[i].display ? `<div class="math-display">\\[${esc(math[i].tex)}\\]</div>` : m))
    .replace(/MATHPLACEHOLDER(\d+)X/g, (_, i) => (math[i].display ? `\\[${esc(math[i].tex)}\\]` : `\\(${esc(math[i].tex)}\\)`));
}
function typesetMath(root) {
  window.MathJax = {
    tex: { inlineMath: [["\\(", "\\)"]], displayMath: [["\\[", "\\]"]] },
    startup: { typeset: false },
    chtml: { scale: 1.0 },
  };
  const s = document.createElement("script");
  s.src = "https://cdn.jsdelivr.net/npm/mathjax@3.2.2/es5/tex-chtml.js";
  s.async = true;
  s.onload = () => MathJax.startup.promise.then(() => MathJax.typesetPromise([root]));
  document.head.append(s);
}

// Links to .md files open them as pages; external links get a ↗ in titles.
// Relative paths in a Markdown file are relative to that file, so projects/foo/index.md can
// write ![](teaser.png) for projects/foo/teaser.png. Links to .md files open through page.html.
function fixLinks(root) {
  const dir = file.slice(0, file.lastIndexOf("/") + 1);
  const resolve = (path) => new URL(dir + path, "https://x/").pathname.slice(1);
  const relative = (path) => path && !/^([a-z]+:|\/|#)/i.test(path);
  for (const el of root.querySelectorAll("img[src], video[src], source[src]")) {
    const src = el.getAttribute("src");
    if (relative(src)) el.setAttribute("src", resolve(src));
  }
  for (const a of root.querySelectorAll("a[href]")) {
    const href = a.getAttribute("href");
    if (!relative(href)) continue;
    a.setAttribute("href", href.endsWith(".md") ? `page.html?p=${resolve(href)}` : resolve(href));
  }
}

// Links to known organisations become a coloured chip with their logo.
// Add an entry here to style another one; the colour lives in style.css (.org-<key>).
const ORGS = {
  allsides: { match: "allsides.tech", logo: "assets/logos/allsides.png" },
  tudelft: { match: "tudelft.nl", logo: "assets/logos/tudelft.png" },
};
function orgLinks(root) {
  for (const a of root.querySelectorAll("a[href]")) {
    if (a.pathname.replace(/\/$/, "")) continue; // only links to the homepage, not e.g. a staff page
    const key = Object.keys(ORGS).find((k) => a.hostname.replace(/^www\./, "") === ORGS[k].match);
    if (!key) continue;
    a.classList.add("org", `org-${key}`);
    a.target = "_blank";
    a.rel = "noopener";
    a.insertAdjacentHTML("afterbegin", `<img src="${ORGS[key].logo}" alt="" aria-hidden="true">`);
  }
}

// If the page has an .avatar photo, put it in its own column next to the text
// (instead of the text wrapping around it).
function intro(root) {
  const img = root.querySelector("img.avatar");
  if (!img) return;
  const holder = img.parentElement;
  const wrap = document.createElement("div");
  wrap.className = "intro";
  const text = document.createElement("div");
  text.className = "intro-text";
  const h1 = root.querySelector("h1");
  const rest = [...root.children].filter((el) => el !== h1 && el !== holder && !el.classList.contains("links"));
  rest[0].before(wrap);
  text.append(...rest);
  // Photo + contact links form a card built like a project row (same border, thumbnail size, links).
  const card = document.createElement("aside");
  card.className = "profile";
  const photo = document.createElement("div");
  photo.className = "profile-media";
  photo.append(img);
  card.append(photo);
  const links = root.querySelector(".links");
  if (links) card.append(links);
  wrap.append(text, card);
  if (holder.tagName === "P" && !holder.textContent.trim() && !holder.children.length) holder.remove();
}

// ![](x.mp4) becomes a looping, muted video with x.jpg as the poster.
function videos(root) {
  for (const img of root.querySelectorAll('img[src$=".mp4"]')) {
    const v = document.createElement("video");
    for (const attr of ["muted", "loop", "autoplay", "playsinline"]) v.setAttribute(attr, "");
    v.muted = true;
    v.src = img.getAttribute("src");
    v.poster = v.getAttribute("src").replace(/\.mp4$/, ".jpg");
    img.replaceWith(v);
  }
}

// A paragraph of contact links (email/github/linkedin/scholar) gets icons and is centered.
const ICONS = {
  mail: '<path d="M.05 3.555A2 2 0 0 1 2 2h12a2 2 0 0 1 1.95 1.555L8 8.414zM0 4.697v7.104l5.803-3.558zM6.761 8.83l-6.57 4.027A2 2 0 0 0 2 14h12a2 2 0 0 0 1.808-1.144l-6.57-4.027L8 9.586zm3.436-.586L16 11.801V4.697z"/>',
  github: '<path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8"/>',
  linkedin: '<path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854zm4.943 12.248V6.169H2.542v7.225zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248S2.4 3.226 2.4 3.934c0 .694.521 1.248 1.327 1.248zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016l.016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225z"/>',
  scholar: '<path d="M8 1.783C7.015.936 5.587.81 4.287.94c-1.514.153-3.042.672-3.994 1.105A.5.5 0 0 0 0 2.5v11a.5.5 0 0 0 .707.455c.882-.4 2.303-.881 3.68-1.02 1.409-.142 2.59.087 3.223.877a.5.5 0 0 0 .78 0c.633-.79 1.814-1.019 3.222-.877 1.378.139 2.8.62 3.681 1.02A.5.5 0 0 0 16 13.5v-11a.5.5 0 0 0-.293-.455c-.952-.433-2.48-.952-3.994-1.105C10.413.809 8.985.936 8 1.783"/>',
};
function iconFor(href) {
  if (href.startsWith("mailto:")) return ICONS.mail;
  if (href.includes("github.com")) return ICONS.github;
  if (href.includes("linkedin.com")) return ICONS.linkedin;
  if (href.includes("scholar.google")) return ICONS.scholar;
}
function contactLinks(root) {
  for (const p of root.querySelectorAll("p")) {
    const links = [...p.querySelectorAll(":scope > a")];
    if (links.length < 2 || !links.every((a) => iconFor(a.href))) continue;
    p.className = "links";
    p.replaceChildren(...links);
    for (const a of links) {
      a.insertAdjacentHTML("afterbegin", `<svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">${iconFor(a.href)}</svg>`);
    }
  }
}

// A paragraph made only of `code` spans is a row of badges.
function badges(root) {
  for (const p of root.querySelectorAll("p")) {
    const codes = [...p.querySelectorAll(":scope > code")];
    const rest = [...p.childNodes].filter((n) => n.nodeName !== "CODE" && n.textContent.trim());
    if (!codes.length || rest.length) continue;
    p.className = "badges";
    for (const c of codes) {
      const s = document.createElement("span");
      const label = c.textContent;
      s.textContent = label;
      s.className = /^\d{4}$/.test(label) ? "year" : "badge";
      if (/^m\.?sc/i.test(label)) s.classList.add("badge-msc");
      if (/^b\.?sc/i.test(label)) s.classList.add("badge-bsc");
      c.replaceWith(s);
    }
  }
}

// A paragraph made only of links, like "[Paper](…) · [Code](…)", becomes a row of
// links with icons picked from the label (paper/thesis, code, blog, video, slides).
const LINK_ICONS = {
  paper: '<path d="M4 1.5h5l3.5 3.5v9.5H4z"/><path d="M8.5 1.5V5.5h4M6 8.5h4.5M6 11h4.5"/>',
  code: '<path d="M5.5 4 1.5 8l4 4M10.5 4l4 4-4 4"/>',
  blog: '<path d="M10.5 2.5l3 3-8 8h-3v-3z"/><path d="M9 4l3 3"/>',
  video: '<rect x="1.5" y="3" width="13" height="10" rx="1.5"/><path d="M6.5 6v4l3.5-2z"/>',
  slides: '<rect x="1.5" y="2.5" width="13" height="8.5" rx="1"/><path d="M8 11v3M5.5 14h5"/>',
  link: '<path d="M6.5 9.5l3-3M7 4.5l1-1a2.8 2.8 0 0 1 4 4l-1 1M9 11.5l-1 1a2.8 2.8 0 0 1-4-4l1-1"/>',
};
function linkIcon(a) {
  const label = a.textContent.toLowerCase();
  if (/code|github/.test(label) && a.href.includes("github.com")) return `<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">${ICONS.github}</svg>`;
  const key = /paper|thesis|pdf|arxiv/.test(label) ? "paper" : /code/.test(label) ? "code" : /blog|post/.test(label) ? "blog"
    : /video/.test(label) ? "video" : /slides|talk/.test(label) ? "slides" : "link";
  return `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${LINK_ICONS[key]}</svg>`;
}
function linkRows(root) {
  for (const p of root.querySelectorAll("p:not(.links)")) {
    const links = [...p.querySelectorAll(":scope > a")];
    const other = [...p.childNodes].some((c) => (c.nodeType === 3 && c.textContent.replace(/[·|\s]/g, "")) || (c.nodeType === 1 && c.tagName !== "A"));
    if (!links.length || other || links.some((a) => a.classList.contains("org"))) continue;
    p.className = "link-row";
    p.replaceChildren(...links);
    for (const a of links) {
      a.insertAdjacentHTML("afterbegin", linkIcon(a));
      if (/^https?:/.test(a.getAttribute("href"))) { a.target = "_blank"; a.rel = "noopener"; }
    }
  }
}

// On the Projects page (projects.md) only, each "### Title" block becomes a row: thumbnail on the left,
// title / badges / authors / text / links on the right. Videos play on hover.
function projectList(root) {
  const h3s = root.querySelectorAll("h3");
  if (!h3s.length) return;
  const list = document.createElement("div");
  list.className = "project-list";
  h3s[0].before(list);
  const canHover = matchMedia("(hover: hover)").matches;
  for (const h3 of h3s) {
    const row = document.createElement("article");
    row.className = "project";
    const parts = [h3];
    let n = h3.nextElementSibling;
    while (n && !/^H[1-3]$/.test(n.tagName)) { parts.push(n); n = n.nextElementSibling; }

    const box = document.createElement("div");
    box.className = "project-media";
    const media = parts.map((el) => el.querySelector?.("img, video")).find(Boolean);
    if (media) {
      const holder = media.parentElement;
      box.append(media);
      if (holder.tagName === "P" && !holder.textContent.trim() && !holder.children.length) holder.remove();
      if (media.tagName === "VIDEO") hoverPlay(row, media, canHover);
      if (/\.svg$|light_portals/.test(media.getAttribute("src"))) box.classList.add("contain");
    }
    row.append(box);

    const body = document.createElement("div");
    body.className = "project-body";
    for (const el of parts.filter((el) => el.isConnected)) {
      if (el.tagName === "P" && el.querySelector(":scope > strong") && el.textContent.includes(",")) el.classList.add("authors");
      body.append(el);
    }
    // Compact layout: badges sit on the title line, the description is the remaining paragraph.
    const head = document.createElement("div");
    head.className = "project-head";
    h3.before(head);
    head.append(h3);
    const tags = body.querySelector(":scope > .badges");
    if (tags) head.append(tags);
    for (const p of body.querySelectorAll(":scope > p:not([class])")) p.classList.add("desc");
    for (const a of body.querySelectorAll('a[href^="http"]')) { a.target = "_blank"; a.rel = "noopener"; }
    // A title linking to an in-site page (### [Title](projects/x/index.md)) makes the whole box clickable.
    if (h3.querySelector("a")?.getAttribute("href").startsWith("page.html")) row.classList.add("has-page");
    row.append(body);
    list.append(row);
  }
}

// Shows its poster (x.jpg) until hovered, then plays from the start; on touch screens it just plays.
function hoverPlay(row, v, canHover) {
  if (!canHover) return;
  v.removeAttribute("autoplay");
  v.autoplay = false;
  v.preload = "metadata";
  const rest = () => { v.pause(); v.load(); }; // load() resets it to the poster
  rest();
  row.addEventListener("mouseenter", () => v.play().catch(() => {}));
  row.addEventListener("mouseleave", rest);
}
