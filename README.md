# Sofas By Daneen — Shopify Theme

Modern Online Store 2.0 Liquid theme built for **speed, SEO and conversion**.

## Tech stack

- **Online Store 2.0** — JSON templates, section groups, app blocks
- **Vanilla JS + Web Components** — no jQuery, no framework, ~15 KB total JS
- **Native lazy loading** — `loading="lazy"` + Intersection Observer for below-fold sections
- **Responsive images** — Shopify `image_url` filter with `srcset` and `sizes`
- **Critical CSS inline** — above-the-fold styles inline, rest deferred
- **Fabric + Colour picture swatches** — dependent options driven by metaobjects
- **JSON-LD structured data** — Product, Collection, BreadcrumbList, Organization, WebSite, FAQPage
- **Section rendering API** — instant cart/quickview updates without page reload

## SEO features

- Full Open Graph + Twitter Card tags
- Canonical URLs on every page
- Auto `hreflang` for markets
- Breadcrumbs with schema
- Product schema with price, availability, brand, GTIN, reviews
- FAQ schema on product & collection pages
- Sitemap-ready (Shopify auto-generates)
- Preload hints for critical fonts and hero image
- HTTP/2 push for critical assets
- Core Web Vitals optimised (LCP <2.5s, CLS <0.1, INP <200ms)

## Local development

```bash
# One-time: install Shopify CLI
npm install -g @shopify/cli @shopify/theme

# Clone this repo
git clone https://github.com/ahmedFayyazG/SofabyDaneenLiquid.git
cd SofabyDaneenLiquid

# Live-edit against your store (auto-refresh browser on save)
shopify theme dev --store=sofasbydaneen

# Push to store as an unpublished theme
shopify theme push --unpublished --json

# Pull latest from store into local
shopify theme pull

# Check for errors
shopify theme check
```

## Structure

```
assets/         → CSS, JS, images
config/         → settings_schema.json, settings_data.json
layout/         → theme.liquid, checkout.liquid
locales/        → en.default.json + translations
sections/       → All sections (header, footer, product, collection, etc.)
snippets/       → Reusable Liquid fragments
templates/      → JSON templates for each page type
blocks/         → Reusable content blocks
```

## Key files

- `layout/theme.liquid` — global wrapper with meta, schema, preloads
- `sections/main-product.liquid` — product page with fabric/colour swatches
- `sections/main-collection.liquid` — collection with filters
- `snippets/product-card.liquid` — reusable product tile
- `snippets/swatch-picker.liquid` — dependent fabric/colour picker
- `snippets/schema-product.liquid` — JSON-LD product schema
- `assets/theme.css` — design tokens + component styles
- `assets/theme.js` — Web Components (cart, swatches, quick add)
