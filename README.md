# Elko Lemiso’s interactive portfolio

The source for [lemi.so](https://www.lemi.so), an interactive, windowed portfolio that presents Elko’s work as an interface rather than a conventional résumé page.

The site renders the portfolio immediately, with draggable and resizable source and content windows, an editable CSS surface, small JavaScript and HTML editors, and a dock for reopening tools. The original live-coding sequence remains available at [`?intro=1`](https://www.lemi.so/?intro=1) and is skipped when the visitor prefers reduced motion.

## Project archive

The public work history and project collection live in [`src/work.txt`](src/work.txt). Webpack imports that Markdown source into the browser bundle, where it is rendered inside the portfolio window.

To update the archive:

1. Edit `src/work.txt`.
2. Run the development server and check the rendered links and layout.
3. Rebuild the production assets in `dist/` before deploying.

## Run locally

The project declares Node.js 22 in `package.json`.

```bash
npm ci
npm run dev
```

Webpack Dev Server opens the site and serves it on port `4200` by default.

Create a production bundle with:

```bash
npm run build
```

There is currently no automated test suite. Before deploying, run the production build and manually check the portfolio, source editor, dock controls, window drag/resize behavior, mobile layout, external links, and `?intro=1` flow.

## How it is built

- Vanilla JavaScript with small modules for animation and window management
- Webpack 5 and Babel for bundling
- Markdown as the editable source for the portfolio content
- Handwritten CSS for the desktop, mobile, window, and live-coding presentation
- Static deployment through Vercel; legacy Firebase workflows are also present

## Origins and original work

This codebase began as an adaptation of [STRML.net](https://github.com/STRML/strml.net) by Samuel Reed. The live-writing presentation and the project’s core ancestry belong to that work; this repository does not claim authorship of the original concept.

Elko’s version supplies his own writing and project archive and has since developed its own interface: a monochrome visual redesign, immediate content-first rendering, an opt-in introduction, draggable and resizable window management, dock navigation, editable CSS, in-browser JavaScript and HTML scratch editors, responsive behavior, and updated deployment and social metadata.

The package metadata credits Samuel Reed as the original author and declares MIT. The repository does not currently include a standalone license file, so that metadata and the upstream project’s notices should be preserved when this code is redistributed; a complete license file should be added before making any broader licensing claim.
