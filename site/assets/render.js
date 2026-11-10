// Runs in the browser. The page layout is done at build time (layout.mjs); this only adds
// what has to happen live: project videos playing on hover, and math typesetting.

// ---- Math (rendered with MathJax; build.mjs leaves it as \( \) and \[ \]) ----
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

// Shows its poster (x.jpg) until hovered, then plays from the start; on touch screens it just plays.
function hoverPlay(row, v, canHover) {
  if (!canHover) { v.autoplay = true; v.play().catch(() => {}); return; }
  const rest = () => { v.pause(); v.load(); }; // load() resets it to the poster
  row.addEventListener("mouseenter", () => v.play().catch(() => {}));
  row.addEventListener("mouseleave", rest);
}

// ---- Run ----
if ("projectList" in document.body.dataset) {
  const canHover = matchMedia("(hover: hover)").matches;
  for (const v of document.querySelectorAll(".project video")) hoverPlay(v.closest(".project"), v, canHover);
}
if ("math" in document.body.dataset) typesetMath(document.querySelector("main"));
