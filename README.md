# Desnio Sense

The approved responsive storefront now uses Firebase Authentication and shared Firestore records. The existing 31 application pages and page directory are retained. Production target: https://desnio-sense.vercel.app/ through the private `mariamparvez/desnio-sense` repository.

## Accounts and data

Google and Email/Password sign-in are real Firebase sign-ins. Passwords are verified by Firebase, never stored by the store. Email signup sends a verification link; a verified email is required for order requests. Phone OTP and Facebook sign-in remain Phase 2.

Admin Head: `designwithmariam@gmail.com`, using Google sign-in at `admin-login.html`. No generated or demo password applies. Additional accounts are created by Admin Head; they use Google or set a password through Forgot password. Server roles use verified Firebase custom claims. Account removal disables access while retaining historical orders.

Products, phone models, customers, administrators, jobs, applications, tickets, order requests and newsletter consent are shared records. Customer carts and editable draft metadata sync across browsers after sign-in. A local guest cart remains available before sign-in. Private reads are restricted to the owner or a verified administrator; sensitive changes use the authenticated Vercel API.

## Current deliberate limits

- Firebase billing remains disabled. The Standard Firestore database in Mumbai is eligible for the free tier; quotas still apply.
- Payments are disabled. Checkout saves an **unpaid order request** with server-calculated catalogue pricing. It does not mark the order paid or start production. There are no fake payment options or demo coupons.
- Custom order submission is blocked until durable original artwork storage is available. Cloud drafts contain metadata and previews, not original files. Originals remain in IndexedDB on the device that uploaded them. Download and keep the print ZIP; a synced preview cannot replace an original print source.
- Phone models are a starter supplier-maintained catalogue, not a claim of complete or verified phone coverage. Missing models can be requested; admins can add models and compressed display photos/templates. Production dimensions require supplier confirmation.
- WhatsApp links prepare the saved ticket query. The customer presses Send in WhatsApp; the store does not claim an automatic message was sent.
- Policy pages remain merchant drafts. Shipping quotations, tax calculations, live payment/refund processing and marketing messages are not enabled.

## Development and deployment

```text
npm install
npm run check
npm test
npm run build
npm run dev
```

Use HTTP, not a file URL. The local preview reads the Firebase catalogue. Backend mutations require production or an explicitly supplied private local development credential. Credentials must never be added to browser scripts or committed.

Vercel uses the Other preset, `npm run build`, `dist` and the Node API at `api/store.mjs`. GitHub integration deploys main. Google Workload Identity Federation trusts only this team's `desnio-sense` production deployment; no service-account private key is used. Preview deployments cannot impersonate the production identity.

See `FIREBASE-SETUP.md`, `BACKEND-HANDOFF.md` and `PAGE-COVERAGE.md`. Mariam Parvez is Co Founder; Imran Roshan is Senior Partner. No other team member is listed.
