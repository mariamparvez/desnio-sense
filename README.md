# Desnio Sense — complete frontend

This package contains 31 responsive application pages and a clickable review directory. The approved homepage design, colour palette, fonts and collection photographs are retained. No backend, live authentication, payment processing or live order service is implemented.

## Preview

Open `index.html` directly for a quick visual preview. Use the local HTTP preview for shared demo data across pages:

```powershell
node preview.mjs
```

Then open http://127.0.0.1:4173/index.html. The preview script only serves static files. It has no application API or database.

Alternatively, from this folder:

```powershell
python -m http.server 4173 --bind 127.0.0.1
```

Open `page-directory.html` to review all requested screens, collection sections and product detail pages.

## Demo logins

| View | Email | Password |
| --- | --- | --- |
| Admin Head | head@desniosense.test | Any 6 or more characters |
| Admin | team@desniosense.test | Any 6 or more characters |
| Customer with an order | alex@example.test | Any 6 or more characters |
| New customer | Name and phone on signup.html | Demo OTP 123456 |
| Phone sign-in | Existing customer phone | Demo OTP 123456 |

Google and Facebook buttons open explicit demo-profile choices. Email login accepts existing customer records; signup uses name, phone and OTP. These are labelled frontend previews. Passwords are never saved or verified. Roles, records, tickets, orders, cart items and saved designs are kept in this browser's local storage. They do not sync between browsers, devices or people. Editing an admin email changes the email used for its next demo login. Reset the preview through browser site-data settings, or remove local-storage keys starting with `ds-`.

## Pages

| Area | Pages |
| --- | --- |
| Storefront | index.html, products.html, product.html |
| Design studio | customise.html |
| Shopping | cart.html, checkout.html, payment.html, order-confirmation.html |
| Page review directory | page-directory.html |
| Order support | track-orders.html, cancel-order.html, help.html |
| Company | about.html, contact.html, careers.html, faq.html |
| Policy drafts | returns.html, terms.html, copyright.html |
| Customer account | login.html, signup.html, account.html |
| Admin access | admin-login.html |
| Admin portal | admin-dashboard.html, admin-customers.html, admin-admins.html, admin-orders.html, admin-custom-orders.html, admin-queries.html, admin-careers.html, admin-products.html, admin-phone-models.html |

## Frontend behaviour

- Product categories use icons. Each of the four sections has its own All, New Arrivals and product-category strip.
- Product cards open detail pages with gallery views, variants, quantity, delivery-pincode input, add-to-cart, buy-now, care/shipping/returns panels, paired items and more from the collection.
- The studio supports all 13 products, including sweatshirts. It has realistic front/back blank previews, colour selection, click/tap-to-upload, dropped image placement, text, stickers, drag, resize, layer controls, undo/redo, keyboard movement, saved-design restore and print-package download. PNG, JPG and WEBP artwork is supported, up to 50 MB per upload. Designs are visually clipped to the product outline; print feasibility will be confirmed separately.
- Original uploaded artwork bytes are retained separately in IndexedDB; compressed previews are for the UI and cart. Admin downloads rebuild 6000px transparent PNG artwork with 300 DPI metadata, scalable SVG and product reference previews from editable layers. Complete print ZIPs include both designed sides, original files, fonts and layout data. Old designs without retained originals show a quality warning; enlarging a low-resolution source does not restore detail. The printer must confirm physical dimensions against the supplier template. Browser storage capacity is limited; adding a cart item reports when storage is full.
- Admins can add/edit/delete merchandise, set price, stock, variants, designer and collection, and publish or hide products.
- Phone cases support Android/iPhone, brand/model selection and unlisted model entry. Admins can manage models, upload front/back reference photos and optional transparent case templates, import/export catalogue JSON and review missing-model requests. The starter list is not an exhaustive or supplier-verified phone database.
- The cart supports quantity, removal and a clearly labelled demo coupon, `DSDEMO10`. All prices are preview prices.
- Checkout gathers delivery details and opens the dedicated payment.html Razorpay preview page. “Preview successful order” creates a local demo order; it does not process payment or submit a real order.
- Tracking, cancellation and confirmation update browser demo records. The cancellation logic is an illustrative frontend flow and must be replaced with the final merchant rules.
- Help and Contact prepare a WhatsApp message for **+91 8870100469**. Help generates a browser-local ticket reference and a linked query. The user presses Send in WhatsApp to send it. No automated WhatsApp messages are sent.
- Admin metrics are computed from demo records: customers, revenue, orders, resolved queries, custom orders and admins.
- Admins can create/edit/delete customer profiles, manage order/ticket status and publish careers. Admin account creation/editing/deletion is shown only to the Admin Head. Current-account and last-active-head protection is included in the preview UI.
- Career roles start empty. Draft roles stay off the public careers page; published roles appear immediately in the same browser. Applications use a prepared email link.
- Every page has a responsive floating WhatsApp button. Social links are clickable.

## Team details

- **Mariam Parvez — Co Founder:** the creative mind behind Desnio Sense; tutoring business at https://muxion.in.
- **Imran Roshan — Senior Partner:** execution and operations; heads architecture/interiors at https://arkspaces.in.

The page uses initials in place of invented portraits.

## Backend handoff for the next session

The local adapter lives in `data.js`; page scripts use its `DS` and `Store` methods. Replace persistence and session handling with real service calls. The UI uses plain HTML/CSS/JavaScript. A small dependency-free build copies public files into dist for hosting.

| Frontend module | Service to connect later |
| --- | --- |
| catalogue.js, product.js | Product catalogue, real SKUs/variants, prices, stock, gallery images and delivery availability |
| auth.js, pages.js | Real customer OTP/social authentication, account profiles, contact/support records and public job listings |
| studio.js, artwork-store.js, design-export.js | Durable original artwork storage, front/back layer documents, production validation and print exports |
| phone-catalogue.js, admin-catalogue.js | Shared phone models, supplier case templates, merchandise and designer catalogue CRUD |
| commerce.js | Server-priced cart, coupons, delivery charges, payment handoff, verified confirmation, tracking and merchant cancellation rules |
| admin.js | Authenticated role enforcement, dashboard aggregates, customer/admin CRUD, order/ticket management and careers publishing |

Custom cart entries already contain a `design` object with the product, front/back scenes, colours and layers plus a small preview. Uploaded layer originals use local IndexedDB identifiers alongside lightweight preview data URLs. Replace these with durable storage identifiers/URLs and retain the layer document for production work.

Razorpay must be integrated using its documented server order creation and payment verification flow: https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/. No Razorpay keys or API calls are present here.

The backend must enforce access rules; frontend role controls are demo behaviour. Replace browser-generated ticket/order identifiers with server references. Contact email addresses, live product details and the policy drafts should be finalised before launch. No backend code was added today.

## Validation

All 32 HTML pages (31 application pages and the directory) were checked at 320, 390, 615, 768, 1024 and 1440 pixels. No document overflow, missing images, local failed requests or JavaScript errors were found. Additional checks covered populated shopping states, mobile touch dragging, product filtering, galleries, checkout/confirmation/tracking/cancellation, WhatsApp query preparation, customer/admin CRUD, staff-role restrictions, careers publishing, support resolution, CSV export, all 26 front/back product views, direct-file print ZIP export and the corrected team details. See `VALIDATION.json`.

The complete requested-page checklist is in PAGE-COVERAGE.md. A separate coverage audit checked every requested page, all four collection views, all 13 product detail views, the founder roles and the dedicated payment states.

## Deployment preparation

See DEPLOYMENT.md for GitHub/Vercel build settings and owner-managed GoDaddy DNS, and BACKEND-HANDOFF.md for Firebase setup. The selected repository is https://github.com/mariamparvez/desnio-sense. GitHub access to this private repository is verified. Vercel MCP is registered and needs owner OAuth. The website has not yet been deployed. Private GitHub source can serve a public Vercel website.
