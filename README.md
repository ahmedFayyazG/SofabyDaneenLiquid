# Sofas by Daneen — Shopify Liquid theme

A Shopify Online Store 2.0 theme with a storefront layout modelled on M&H Living. Product images, names, prices, variants, and collection membership come from Sofas by Daneen in Shopify.

## Pull into an existing local clone

```bash
cd /path/to/SofabyDaneenLiquid
git switch main
git pull --ff-only origin main
```

If you have uncommitted changes, commit or stash them before pulling. If this is your first time downloading the repository:

```bash
git clone https://github.com/ahmedFayyazG/SofabyDaneenLiquid.git
cd SofabyDaneenLiquid
```

## Run a local Shopify preview

Install the current Shopify CLI once:

```bash
npm install -g @shopify/cli
```

From the theme root, run:

```bash
shopify theme check
shopify theme dev --store s0unwg-ke.myshopify.com
```

Sign in with a Shopify account that has access to Sofas by Daneen if prompted. Open the local URL printed by `theme dev` (usually http://127.0.0.1:9292). The command creates a development theme for preview and hot reload; it does not publish the theme. Stop it with Ctrl+C.

## Homepage setup

The homepage is configured with real Sofas by Daneen collections: Corner Sofas, Chaise Sofas, Chesterfield Sofas, Large U Shaped Sofas and Curved Sofas. The product grid displays up to 12 products from All Sofas, falling back to Shopify's all-products collection if needed. The collection page paginates the complete catalog. Products must be Active and published to the Online Store sales channel to appear in Liquid. The nine sofas and their populated collections were published to that channel on 26 September 2026. Add collection images and choose any replacement hero video or image in Shopify's theme editor to make the media your own. The default hero video and editorial fallback photos are hosted by the visual reference site and should be replaced before publishing the theme.

Theme sections live in `sections/`, page order in `templates/*.json`, and shared styling and interactions in `assets/theme.css` and `assets/theme.js`.

The product detail page reads the store-wide `fabric_range` metaobjects and renders every linked fabric swatch on every sofa, grouped and alphabetised by range and colour. The selected fabric is sent as a `Requested fabric` cart line item property; existing Shopify colour variants remain separate. On 26 September 2026 the connected store had 169 linked images across 10 fabric ranges. Adding more images to those ranges in Shopify will add them to the selector automatically.
