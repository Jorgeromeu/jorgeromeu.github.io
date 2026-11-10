# jorgeromeu.github.io

Personal site. No build step: Markdown files are rendered in the browser.

## Editing

Everything you edit is in `site/`. The site's code lives in `site/assets/` and can be ignored.

    site/
      home.md                  Home / about
      projects.md              Projects list
      projects/<name>/         One folder per project:
        index.md                 its page (optional)
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

Then open http://localhost:8000. The page reloads by itself whenever a file in `site/` changes (Markdown, CSS, JS, media).

## Deploy

Push to `master`. GitHub Actions publishes `site/` to GitHub Pages.

GIF to MP4 plus poster:

    ffmpeg -i in.gif -movflags +faststart -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" -c:v libx264 -crf 26 out.mp4
    ffmpeg -i out.mp4 -vframes 1 out.jpg
