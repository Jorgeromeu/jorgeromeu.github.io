# Jorge Romeu Huidobro

Source of my personal website: **[jorgerom.eu](https://jorgerom.eu)**

I'm a Research Engineer at [ALLSIDES](https://www.allsides.tech/) working on 3D reconstruction and
inverse rendering. See [jorgerom.eu](https://jorgerom.eu) for my background, projects and
[CV](https://jorgerom.eu/cv.pdf).

---

## How the site works

Content is written in Markdown in `site/`. `build.mjs` turns it into static HTML in `dist/`,
along with `sitemap.xml` and `robots.txt`. Pushing to `master` deploys it to GitHub Pages.

    npm install     # once
    npm run dev     # http://localhost:8000, rebuilds and reloads on every change
    npm run build   # build once into dist/

## Editing content

Everything you edit is in `site/`:

    site/
      home.md                    About page            ->  /
      projects.md                Projects list         ->  /projects/
      projects/<name>/
        index.md                 Project page (optional)  ->  /projects/<name>/
        *.mp4, *.jpg, *.png      Its media
      404.md                     Not-found page
      cv.pdf, me.jpg

Paths in a Markdown file are relative to that file: `projects/nerf2d/index.md` writes
`![](teaser.png)`, and `projects.md` writes `![](projects/nerf2d/optim.mp4)`.

**Project cards.** In `projects.md`, each `###` block is one card, shown in file order:

    ### [My Project](projects/my-project/index.md)   <- links to its page (or an https:// URL, or no link)
    ![](projects/my-project/thumb.mp4)              <- thumbnail; .mp4 plays on hover, thumb.jpg is its poster
    `M.Sc. Thesis` `2025`                           <- badges (a plain year shows as grey text)

    **Jorge Romeu Huidobro**, Co-author             <- authors
    One or two sentences of description.
    [Paper](…) · [Code](…)                          <- links row; icons come from the labels

**Anywhere:**
- `![](x.mp4)` becomes a looping video, with `x.jpg` as its poster.
- A line made only of `` `code` `` spans becomes a row of badges.
- `$inline$` and `$$display$$` math are rendered with MathJax. `\$` is a literal dollar sign.

## SEO and analytics

Each page's title, description and preview image come from its `# Title`, first paragraph and
first image. Site-wide settings are at the top of `build.mjs`: name, home-page description, the
profile links used in the structured data, and the [GoatCounter](https://www.goatcounter.com)
analytics code.

## Code

- `build.mjs`: Markdown to HTML, head tags, sitemap, dev server
- `layout.mjs`: page layout applied at build time (profile card, project rows, icons)
- `site/assets/`: styles, client-side JS (video hover, math, theme toggle, bunny), logos

## Media tips

GIF to MP4 plus poster:

    ffmpeg -i in.gif -movflags +faststart -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" -c:v libx264 -crf 26 out.mp4
    ffmpeg -i out.mp4 -vframes 1 out.jpg
