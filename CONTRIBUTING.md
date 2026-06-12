# contributing to floravo

First off — thanks for being here. Floravo is a small project built with a lot of care, and contributions that respect that spirit are genuinely welcome.

---

## before you start

Check the [open issues](../../issues) before opening a new one. If you have an idea that isn't filed yet, open an issue first and describe what you're thinking. This saves everyone from doing duplicate work and lets us align before any code is written.

For small fixes (typos, broken links, minor bugs) — just open a PR directly.

---

## what we're looking for

**good fits**
- Bug fixes with a clear reproduction case
- Performance improvements to the placement engine or canvas export
- Accessibility improvements (keyboard nav, screen reader support)
- New flower assets that match the existing vector style
- Viewer scene polish or additional animation refinement
- Documentation improvements

**not a good fit right now**
- Full redesigns of the UI theme — the Victorian postal aesthetic is intentional
- Swapping out core dependencies (Firebase, Next.js) without prior discussion
- Features that require changes to both the frontend and the backend without a clear plan

---

## setup

```bash
# fork the repo, then:
git clone https://github.com/your-username/floravo
cd floravo/bouquet-app
npm install
cp .env.local.example .env.local   # fill in your Firebase credentials
npm run dev
```

You'll need your own Firebase project (Auth + Firestore enabled) for local development. The backend server (Express + MongoDB) is a separate repo — builder, canvas export, and the viewer work without it. Save/share and admin features require it.

---

## workflow

```
fork → branch → commit → PR → review → merge
```

**branch naming**

```
fix/canvas-export-rotation
feat/flower-chrysanthemum
docs/update-placement-algorithm
chore/bump-firebase-sdk
```

**commit style** — plain imperative, lowercase, no period

```
fix canvas rotation on export
add chrysanthemum to secondary layer
update jitter defaults for tighter dome
```

No enforced commit convention beyond keeping it readable. Don't write `WIP` commits into your PR — squash or clean up before opening.

---

## opening a pull request

- Target the `main` branch
- Fill in the PR description: what changed, why, and how to test it
- Link the related issue if there is one (`closes #42`)
- Keep PRs focused — one thing per PR is easier to review and faster to merge
- Screenshots or screen recordings are appreciated for any visual change

---

## adding flower assets

Flower PNGs live in `public/flowers/`. If you're contributing a new one:

- Match the existing style — flat vector look, transparent background, roughly consistent canvas size
- Name it lowercase with hyphens: `garden-dahlia.png`
- Add it to the relevant layer in the inventory in `app/builder/page.js`
- Include a screenshot in your PR so reviewers can see how it looks in an arrangement

---

## design system

The theme is non-negotiable — parchment, sepia ink, typewriter fonts. Any UI contribution should use the existing CSS variables from `globals.css` rather than hardcoded values.

```css
/* use these */
var(--parchment-light)   /* #f9f0dc */
var(--parchment-mid)     /* #f2e4c0 */
var(--ink-dark)          /* #1a0f07 */
var(--postal-red)        /* #c0392b */
var(--gold)              /* #b8860b */
```

---

## reporting bugs

Open an issue and include:

- What you did
- What you expected
- What actually happened
- Browser + OS
- A screenshot or console output if relevant

---

## code of conduct

Be direct, be kind, assume good intent. Feedback on code is not feedback on the person. If something feels off, bring it up — don't let it fester.

---

*Floravo is built and maintained out of Pollachi, Tamil Nadu. Contributions from anywhere are welcome.*
