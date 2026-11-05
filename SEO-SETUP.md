# Desnio Sense search setup

The canonical site is https://www.desniosense.com/. Public pages have distinct titles, descriptions, canonical URLs and social previews. The homepage describes the actual Desnio Sense brand with WebSite and Organization structured data. Account and admin pages are marked noindex. Products and collections render their approved database content in the initial HTML, including when JavaScript is unavailable.

Only Active, explicitly approved merchandise with a real name and price can appear in the buyer catalogue, product pages or dynamic sitemap. Draft and withdrawn product URLs return 404/noindex. Sample merchandise is retained as private admin drafts. Women’s T-shirts and Couple T-shirts have collection filters. Empty filtered collections are not indexed until approved merchandise is available.

## Owner action: Google Search Console

Add the Domain property desniosense.com in Google Search Console and verify ownership using the exact TXT record Google supplies. Keep existing email DNS records. Submit https://www.desniosense.com/sitemap.xml. The sitemap updates from approved database records; do not submit draft product URLs. After publication, use URL Inspection to request indexing for the homepage and approved product pages.

Search Console ownership, sitemap submission and homepage indexing were confirmed in the October 2026 owner session. The Google verification tag remains in index.html. Current Search Console account reports require the owner’s authenticated session. Google controls indexing and ranking: no implementation can guarantee first place, exclusive search results, competitor removal or ranking for arbitrary misspellings. Do not claim affiliation with other brands or stuff their names into product descriptions. See [Google’s SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide).

## Publishing numbered photo submissions

Numbered submissions become one draft per set of photos. Internal product codes follow producttype_productnumber_DDMMYYYY (the date added to the website), for example cap_12_10102026. These codes are saved separately from short customer-facing display names. Admin can edit either field. Store cards show the display name and price; descriptions appear on product detail pages. Product metadata combines the display name with the actual product category; structured data retains the internal SKU. Descriptions record only visible design details; material, sizes, prices and stock require confirmation. In Admin → Products, edit the draft, enter the product name and price, add actual colours, check approval and select Active. Products with options pending can be displayed; orders require real available sizes/options. Drafts can be edited or deleted. Live payment restrictions remain in effect.

Merch galleries display consistent 4:5 crops without changing the original images. The zoom viewer uses the retained full-resolution source and supports buttons, pinch zoom and dragging. Original source resolution varies; upscaling cannot create missing detail. Current submitted merchandise photos are encoded as lossless WebP with dimensions and decoded pixels verified against the originals, and hosted as static site assets so Firebase billing remains disabled. Replacing photos through the existing free-plan admin upload creates a small display image and retains the original on that browser only; durable general-purpose uploads remain a separate storage upgrade.

Product structured data deliberately omits invented reviews, stock claims and live purchasable offers. Merchant Center/product-rich-result eligibility should be configured with accurate offers after live payments, confirmed shipping, stock and fulfilment are enabled.


## November 2026: Bing and IndexNow

The public IndexNow ownership file is d6000cef599a10daf917e7fd882d5b25.txt. Product saves and deletions notify the fixed api.indexnow.org endpoint from the backend, with a bounded timeout. Notification failure never undoes a successful Firebase edit; the API reports retry-needed. The first release batch is submitted after verifying the live ownership file. This public protocol key is not a payment or admin credential.

Bing Webmaster Tools account ownership is a separate account step. Add https://www.desniosense.com/ in the owner’s Bing account and use its exact HTML verification tag, or explicitly authorize importing the verified Google property. Do not claim Bing account verification or IndexNow acceptance until confirmed. IndexNow informs participating search engines; it does not guarantee indexing, rankings, or Google inclusion.

The owner-approved category prices and full garment sizes are applied atomically to Firebase and its public projection once, recorded under system/owner-catalogue-2026-11-05-v1. Later admin price, photo, stock and offer edits remain authoritative. Garment sizes XS through 3XL are enforced for future saves. Unspecified category prices are left untouched.
