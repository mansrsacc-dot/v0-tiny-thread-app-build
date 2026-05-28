# TinyThread — Project Overview for Claude Code

## What This Is
Custom embroidery e-commerce app. Customers upload a photo, customize placement on a hoodie/cap, and order. Embroidery artists in Riga fulfill the order.

## Live URLs
- App: https://app.tinythread.lv
- Store: https://tinythread.lv (Shopify)

## Stack
- Next.js 16 + React 19 + TypeScript
- Tailwind v4 + shadcn/ui
- Vercel (hosting + Blob storage)
- Replicate API (image generation + background removal)
- Shopify (store + orders + webhooks)
- Resend (transactional email to designers)
- Vectorizer.AI (SVG conversion)

## Key Files
- app/page.tsx — main app (large file, all core logic)
- components/tinythread/mockup-editor.tsx — editor UI
- app/api/replicate/route.ts — image generation
- app/api/webhooks/order-paid/route.tsx — order processing + designer email
- app/api/designs/route.ts — saved designs
- app/api/send-placement/route.tsx — manual placement send

## How Orders Work
1. Customer uploads photo → Replicate generates embroidery style
2. Customer positions design on hoodie/cap (front/back)
3. On "Add to Cart" — screenshots of front+back are captured and stored in Vercel Blob
4. Customer checks out via Shopify
5. On payment — webhook fires, sends email to designer with:
   - Composite screenshot (hoodie + design, exactly as customer saw)
   - Clean generated design image
   - SVG vector file
   - Full order specs

## Two Languages
- Latvian (LV) and English (EN) throughout
- All customer-facing text has both versions
- NEVER use the word "AI" in customer-facing text

## Environment Variables (all in Vercel)
- REPLICATE_API_TOKEN
- SHOPIFY_STORE
- SHOPIFY_ACCESS_TOKEN
- SHOPIFY_STOREFRONT_TOKEN
- SHOPIFY_SHOP_GID
- EMAIL_SECRET
- VECTORIZER_API_KEY
- RESEND_API_KEY
- BLOB_READ_WRITE_TOKEN

## Known Issues / In Progress
- Favicon (am-3.png) added to public folder, layout.tsx needs updating
- Saved designs ("Mani dizaini") being migrated to Vercel Blob for permanent storage
- Entry point redesign planned after photoshoot

## Business Rules
- Never use the word "AI" in any customer-facing text
- Dedup webhook uses Vercel Blob marker at processed/order_{orderId}.txt
- Designs saved to Vercel Blob under designs/{customerId}/{designId}.json
