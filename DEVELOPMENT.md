# Local development guide

## 1. Install Shopify CLI (one-time)

```bash
# Requires Node.js 18+
npm install -g @shopify/cli @shopify/theme
```

## 2. Clone this repo

```bash
git clone https://github.com/ahmedFayyazG/SofabyDaneenLiquid.git
cd SofabyDaneenLiquid
```

## 3. Open in VS Code

```bash
code .
```

VS Code will suggest installing these extensions (accept them):
- **Shopify Liquid** – syntax highlighting for `.liquid` files
- **Shopify Theme Check** – live linter for common mistakes
- **Prettier** – code formatting

## 4. Live-edit against your store

```bash
shopify theme dev --store=sofasbydaneen
```

This starts a local preview server (usually `http://127.0.0.1:9292`) that shows your theme running against real store data. Every save reloads the page instantly.

First time it will ask you to log in — pick "Sofas by Daneen" in the browser.

## 5. Push your theme to Shopify

```bash
# Push as a new unpublished theme so you can preview before going live
shopify theme push --unpublished --json

# Push to an existing draft theme
shopify theme push --theme=<theme-id>

# Pull latest content down from the store (settings, sections)
shopify theme pull --theme=<theme-id>
```

## 6. Check for errors before pushing

```bash
shopify theme check
```

## 7. Publish (when ready)

Do this from **Shopify admin → Online Store → Themes**, not the CLI. The CLI has a `theme publish` command but the admin gives you a preview link to double-check first.

## Common commands

| Command | What it does |
|---|---|
| `shopify theme dev` | Live preview with hot-reload |
| `shopify theme push --unpublished` | Upload as new draft |
| `shopify theme pull` | Download changes from the store |
| `shopify theme check` | Lint for errors |
| `shopify theme list` | List all themes in the store |
| `shopify theme delete --theme=X` | Delete a draft theme |

## Git workflow

```bash
# Make changes locally, test with `shopify theme dev`, then:
git add .
git commit -m "Change hero heading"
git push
```

Optionally set up GitHub Actions to auto-push to Shopify on every commit — see `.github/workflows/deploy.yml`.
