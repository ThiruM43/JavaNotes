# ☕ Java Interview Notes — PWA

A Next.js Progressive Web App for studying Java Senior Developer interview topics.

**Live site:** https://ahamed.sahul77.github.io/JavaNotes/ *(update with your GitHub username)*

## Features

- 📱 PWA — installable on mobile & desktop, works offline
- 🌙 Dark mode UI optimised for reading code
- 🧭 Sidebar navigation by topic category
- ⚡ Static export — deploys to GitHub Pages for free
- 📖 27 study notes covering Core Java, DSA, Spring, JPA, Microservices, System Design, and more

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to GitHub Pages

1. Push this repo to GitHub as `JavaNotes`
2. Go to **Settings → Pages → Source** → select **GitHub Actions**
3. Push to `main` — the workflow builds and deploys automatically

The live URL will be: `https://<your-username>.github.io/JavaNotes/`

> If your repo name differs from `JavaNotes`, update `REPO_NAME` in `.github/workflows/deploy.yml` and `next.config.js` default.
