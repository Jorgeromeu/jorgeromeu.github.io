# jorgeromeu.github.io

Personal site. `build.mjs` turns the Markdown in `site/` into plain HTML pages in `dist/`
(so search engines see the content), plus `sitemap.xml` and `robots.txt`.

## Editing

Everything you edit is in `site/`. The site's code lives in `site/assets/` and can be ignored.

    site/
      home.md                  Home / about           -> /
      projects.md              Projects list          -> /projects/
      projects/<name>/         One folder per project:
        index.md                 its page (optional)  -> /projects/<name>/
      404.md                   Not-found page
        *.mp4, *.jpg, *.png      its media
      cv.pdf, me.jpg
      assets/                  code, styles, logos (not content)

Paths in a Markdown file are relative to that file, so `projects/nerf2d/index.md` writes
`![](teaser.png)`, and `projects.md` writes `![](projects/nerf2d/optim.mp4)`.

In `projects.md`, each `### [Title](link)` block is a card:

    ### [My Project](projects/my-project/index.md)   <- opens that page
    ![](projects/my-project/thumb.mp4)              <- thumbnail (.mp4 loops, thumb.jpg is its poster)
    `Course project` `2024`                         <- badges (a plain year shows as grey text)

Link the title to an `https://` URL instead to send the card straight to an external page (shows ↗).

Anywhere: a line of only `badges` becomes badges, and `![](x.mp4)` becomes a looping video.
Math: `$inline$` and `$$display$$` (LaTeX, rendered with MathJax; loaded only on pages that use it).
`\$` is a literal dollar sign, and things like "$5 and $10" stay plain text.

## View locally

    npm install   # once
    npm run dev

Then open http://localhost:8000. The site rebuilds and the page reloads whenever a file in `site/` changes.
`npm run build` builds once into `dist/`.

Page titles, descriptions and preview images come from each page's `# Title`, first paragraph and
first image. Site-wide SEO settings (name, home description, profile links for search engines) are
at the top of `build.mjs`.

## Deploy

Push to `master`. GitHub Actions runs the build and publishes `dist/` to GitHub Pages.

GIF to MP4 plus poster:

    ffmpeg -i in.gif -movflags +faststart -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" -c:v libx264 -crf 26 out.mp4
    ffmpeg -i out.mp4 -vframes 1 out.jpg
