# Backend state and next phase

Firebase Authentication and Firestore are connected to the storefront and admin portal. The Vercel API verifies Firebase ID tokens, current account state and custom claims. Clients cannot directly change orders, payments, roles, catalogue records, tickets, job applications, model requests or subscriptions.

## Persisted flows

| Area | Collections / service | Behavior |
| --- | --- | --- |
| Accounts | Firebase Auth, users | Google/email signup and login, verification, reset password, profile, disabled-account checks |
| Admin team | admins, Auth custom claims | Head-only changes, owner/last-head protection, revocation and audit |
| Catalogue | products, phoneModels | Validated admin CRUD, designer records, compressed display images and model templates |
| Careers | jobs, applications | Published public roles, private applications, admin view |
| Support / contact | tickets | Authenticated queries, private history, resolution/notes, WhatsApp draft link |
| Cart / studio | carts, designs | Per-user cart and draft metadata sync; originalsStored is always false |
| Order requests | orders, orderLimits | Verified email, server prices/options/stock validation, customer-bound idempotency, pending payment, cancellation |
| Newsletter | subscribers | Authenticated email and explicit subscription consent |
| Phone requests | phoneModelRequests | Android/iPhone metadata and admin conversion to catalogue |
| Server controls | rateLimits, audit, system | Per-user rate limits, administrative audit and serialized account changes |

Collections are created as records are needed, rather than populated with fake customers/orders. Temporary test fixtures are cleaned up. Historical order snapshots are retained when a catalogue entry is removed or an account is disabled.

## Infrastructure

Project `desniosense`; default Standard Firestore in `asia-south1`, free-tier eligible, billing disabled and deletion protection enabled. Google and Email/Password providers enabled. Admin Head uses `designwithmariam@gmail.com`. Phone and Facebook login remain disabled/deferred.

The API service account is `desnio-store-api@desniosense.iam.gserviceaccount.com`. Its access is through Workload Identity Federation: pool `desnio-vercel`, provider `vercel`, issuer `https://oidc.vercel.com/mariamparvezs-projects`, audience `https://vercel.com/mariamparvezs-projects`, exact subject `owner:mariamparvezs-projects:project:desnio-sense:environment:production`. It has datastore user and Firebase Auth admin access. No private key was created. Preview environments do not get production identity access.

## Explicitly deferred by the owner

Payments: obtain Razorpay keys through protected backend configuration. Add server-created payment orders, verified signatures/webhooks, inventory reservations, refunds and idempotent payment events before accepting money. Do not change Pending to Paid from a form or trust browser totals.

Original artwork: the owner selected the free Firebase plan. Custom submission is therefore blocked. Add durable original byte storage, ownership rules, upload type/size validation, source checksums, asset references, original retrieval and source-quality checks before enabling custom orders. Existing local originals do not sync through Firestore. Compressed catalogue images and draft previews are display assets, never production originals.

Phone OTP, Facebook, shipping/tax services, outbound email/WhatsApp notifications, production template verification and merchant-approved policies remain next-phase work. The current phone database is not an exhaustive all-phones service. A dedicated catalogue MCP can later sit over supplier-maintained records; normal store operations use the application API.

## Validation

`npm run check`, `npm test`, `npm run build`; rules cases in `firebase-tests/access-tests.json`; sanitized integration receipt in `firebase-tests/integration-receipt.json`. Private test credentials and owner OAuth files remain outside the repository. Tests cover actual Firebase reads/writes and browser flows using temporary identities; they do not automate the owner's Google consent or process real payments.
