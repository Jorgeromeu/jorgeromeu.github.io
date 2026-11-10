// Builds site/ into dist/: every Markdown page becomes a finished HTML page (so search engines and
// link previews see the real content), plus sitemap.xml and robots.txt.
//
//   node build.mjs          build once
//   node build.mjs --serve  build, serve on :8000, rebuild + reload on every change in site/
//
// Pages:  site/home.md                -> /
//         site/projects.md            -> /projects/
//         site/projects/<x>/index.md  -> /projects/<x>/
//         site/404.md                 -> /404.html
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { marked } from "marked";
import { layout } from "./layout.mjs";

const SITE = {
  url: "https://jorgerom.eu",
  name: "Jorge Romeu Huidobro",
  description: "Jorge Romeu Huidobro is a Research Engineer at ALLSIDES working on 3D reconstruction and inverse rendering.",
  image: "/me.jpg",
  // Visitor stats (goatcounter.com): your site code, e.g. "jorgerom" for jorgerom.goatcounter.com.
  // Leave empty to disable. Visits from localhost are not counted.
  goatcounter: "jorgeromeu",
  // Structured data for the home page: helps search engines connect the name to this site and profiles.
  person: {
    alternateName: ["Jorge Romeu"],
    jobTitle: "Research Engineer",
    knowsAbout: ["Inverse rendering", "3D reconstruction", "Physically based rendering", "Computer graphics", "Generative models"],
    worksFor: { name: "ALLSIDES", url: "https://www.allsides.tech/" },
    alumniOf: { name: "Delft University of Technology", url: "https://www.tudelft.nl/" },
    sameAs: [
      "https://github.com/jorgeromeu",
      "https://www.linkedin.com/in/jorge-romeu-huidobro-748458164/",
    ],
  },
};

const SRC = "site";
const OUT = "dist";

export function build() {
  rmSync(OUT, { recursive: true, force: true });
  // Copy everything (media, assets, cv.pdf...) except the Markdown sources.
  cpSync(SRC, OUT, { recursive: true, filter: (p) => !p.endsWith(".md") });

  const pages = [
    { md: "home.md", url: "/", nav: "About", home: true },
    { md: "projects.md", url: "/projects/", nav: "Projects", projectList: true,
      description: `Research and projects by ${SITE.name}: inverse rendering, generative models, physically based rendering and graphics tooling.` },
    ...readdirSync(join(SRC, "projects"))
      .filter((d) => existsSync(join(SRC, "projects", d, "index.md")))
      .map((d) => ({ md: `projects/${d}/index.md`, url: `/projects/${d}/`, nav: "Projects" })),
  ];
  for (const page of pages) write(page.url + "index.html", render(page));
  write("/404.html", render({ md: "404.md", url: "/404.html", noindex: true, mainClass: "notfound" }));

  // Old URLs from the previous version of this site keep working.
  write("/projects.html", redirect("/projects/"));
  write("/page.html", `<!doctype html><meta charset="utf-8"><meta name="robots" content="noindex"><script>
const p = new URLSearchParams(location.search).get("p") || "";
location.replace(p.endsWith("/index.md") ? "/" + p.slice(0, -"index.md".length) : "/");
</script>`);

  write("/sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((p) => `  <url><loc>${SITE.url}${p.url}</loc></url>`).join("\n")}
</urlset>
`);
  write("/robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${SITE.url}/sitemap.xml\n`);
  return pages.length;
}

function render(page) {
  const md = readFileSync(join(SRC, page.md), "utf8");
  const dir = "/" + page.md.slice(0, page.md.lastIndexOf("/") + 1); // URL folder of the .md file
  const { text, math } = protectMath(md);
  let html = restoreMath(marked.parse(text), math);
  html = fixLinks(html, dir);
  html = videos(html);
  html = layout(html, { projectList: page.projectList });

  const h1 = strip(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1] || "");
  const title = page.home ? SITE.name : `${h1} · ${SITE.name}`;
  const description = page.description || (page.home ? SITE.description : firstParagraph(md, math)) || SITE.description;
  const image = page.home ? SITE.image : firstImage(html) || SITE.image;
  const canonical = SITE.url + page.url;

  const navLinks = [["/", "About"], ["/projects/", "Projects"]]
    .map(([href, label]) => `<a href="${href}"${page.nav === label ? ' class="current"' : ""}>${label}</a>`).join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="author" content="${SITE.name}">
${page.noindex ? '  <meta name="robots" content="noindex">' : `  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="${page.home ? "profile" : "article"}">
  <meta property="og:site_name" content="${SITE.name}">
${page.home ? `  <meta property="profile:first_name" content="Jorge">
  <meta property="profile:last_name" content="Romeu Huidobro">
` : ""}
  <meta property="og:title" content="${esc(page.home ? SITE.name : h1)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${SITE.url}${image}">
  <meta name="twitter:card" content="summary">`}
${page.home ? `  <script type="application/ld+json">${personJsonLd()}</script>\n` : ""}  <link rel="icon" href="/assets/favicon.png" type="image/png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/assets/style.css">
  <script>
    try { document.documentElement.dataset.theme = localStorage.getItem("theme") || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"); } catch {}
  </script>
</head>
<body${page.projectList ? ' data-project-list' : ""}${math.length ? " data-math" : ""}>
  <nav><a class="brand" href="/" aria-label="${SITE.name}, home">jorgerom<span>.eu</span></a>${navLinks}<a href="/cv.pdf" target="_blank" rel="noopener"><svg class="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 1.5h5l3.5 3.5v9.5H4z"/><path d="M8.5 1.5V5.5h4M6 8.5h4.5M6 11h4.5"/></svg>CV</a></nav>
  <main${page.mainClass ? ` class="${page.mainClass}"` : ""}>
${html}  </main>
  <script src="/assets/render.js"></script>
  <script src="/assets/light.js"></script>
  <script src="/assets/bunny2d.js"></script>
${SITE.goatcounter ? `  <script data-goatcounter="https://${SITE.goatcounter}.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>\n` : ""}</body>
</html>
`;
}

function personJsonLd() {
  const { person: p } = SITE;
  const person = {
    "@type": "Person",
    "@id": SITE.url + "/#person",
    name: SITE.name,
    alternateName: p.alternateName,
    url: SITE.url + "/",
    image: SITE.url + SITE.image,
    description: SITE.description,
    jobTitle: p.jobTitle,
    worksFor: { "@type": "Organization", ...p.worksFor },
    alumniOf: { "@type": "CollegeOrUniversity", ...p.alumniOf },
    knowsAbout: p.knowsAbout,
    sameAs: p.sameAs,
  };
  return JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      // Tells Google the site's name is your name (shown above the result).
      { "@type": "WebSite", "@id": SITE.url + "/#website", name: SITE.name, url: SITE.url + "/" },
      // Marks the home page as your profile page, about you.
      { "@type": "ProfilePage", url: SITE.url + "/", name: SITE.name, mainEntity: person },
    ],
  }).replace(/</g, "\\u003c");
}

// Description = first real paragraph of text (not the authors line, badges or a row of links).
function firstParagraph(md, math) {
  for (const t of marked.lexer(protectMath(md).text)) {
    if (t.type !== "paragraph") continue;
    const inline = t.tokens.filter((x) => !(x.type === "text" && !x.text.replace(/[·|\s]/g, "")));
    if (inline[0]?.type === "strong") continue; // authors
    if (inline.every((x) => ["link", "codespan", "image", "html", "br"].includes(x.type))) continue;
    let s = strip(marked.parseInline(t.text)).replace(/MATHPLACEHOLDER(\d+)X/g, (_, i) => math[i]?.tex ?? "").replace(/\s+/g, " ").trim();
    if (s.length > 160) s = s.slice(0, s.lastIndexOf(" ", 157)).replace(/[,;:.]$/, "") + "…";
    return s;
  }
}

function firstImage(html) {
  const src = html.match(/<video[^>]* poster="([^"]+)"|<img[^>]* src="([^"]+\.(?:jpe?g|png))"/);
  return src && (src[1] || src[2]);
}

// ---- Math: $inline$ and $$display$$ (typeset in the browser by MathJax) ----
// The math is taken out before Markdown parsing (so _ and * inside it aren't turned into
// italics) and put back afterwards. Code spans/blocks are left alone. "$5 and $10" stays text,
// and \$ is a literal dollar sign.
function protectMath(md) {
  const math = [];
  const keep = (tex, display) => `MATHPLACEHOLDER${math.push({ tex, display }) - 1}X`;
  const parts = md.split(/(```[\s\S]*?```|`[^`\n]*`)/); // odd entries are code
  const text = parts.map((part, i) => i % 2 ? part : part
    .replace(/\$\$([\s\S]+?)\$\$/g, (_, tex) => keep(tex, true))
    .replace(/(^|[^\\$])\$(?!\s)([^$\n]+?)(?<![\s\\])\$(?!\d)/g, (_, pre, tex) => pre + keep(tex, false))
  ).join("");
  return { text, math };
}
function restoreMath(html, math) {
  return html
    .replace(/<p>MATHPLACEHOLDER(\d+)X<\/p>/g, (m, i) => (math[i].display ? `<div class="math-display">\\[${esc(math[i].tex)}\\]</div>` : m))
    .replace(/MATHPLACEHOLDER(\d+)X/g, (_, i) => (math[i].display ? `\\[${esc(math[i].tex)}\\]` : `\\(${esc(math[i].tex)}\\)`));
}

// Relative paths in a Markdown file are relative to that file, so projects/foo/index.md can write
// ![](teaser.png). They become absolute, and links to x/index.md become the page URL x/.
function fixLinks(html, dir) {
  return html.replace(/\b(src|href|poster)="([^"]*)"/g, (m, attr, path) => {
    if (!path || /^([a-z]+:|\/|#)/i.test(path)) return m;
    let url = new URL(path, "https://x" + dir).pathname;
    if (url.endsWith("/index.md")) url = url.slice(0, -"index.md".length);
    return `${attr}="${url}"`;
  });
}

// ![](x.mp4) becomes a looping, muted video with x.jpg as the poster.
function videos(html) {
  return html.replace(/<img src="([^"]+)\.mp4"[^>]*>/g, (_, base) =>
    `<video src="${base}.mp4" poster="${base}.jpg" muted loop autoplay playsinline></video>`);
}

function strip(html) {
  return html.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}
function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function redirect(to) {
  return `<!doctype html><meta charset="utf-8"><title>Redirecting…</title><link rel="canonical" href="${SITE.url}${to}"><meta http-equiv="refresh" content="0; url=${to}"><a href="${to}">${to}</a>`;
}
function write(path, content) {
  const file = join(OUT, path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
}

// ---- CLI ----
const n = build();
console.log(`Built ${n} pages into ${OUT}/`);
if (process.argv.includes("--serve")) {
  const bs = (await import("browser-sync")).default.create();
  bs.init({
    server: OUT, port: 8000, notify: false, ui: false, open: false,
    files: [{ match: [`${SRC}/**/*`], fn() {
      try { build(); bs.reload(); } catch (e) { console.error(e); }
    } }],
  });
}
