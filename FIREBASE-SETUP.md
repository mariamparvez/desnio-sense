# Firebase setup and verification

Configured using the owner's Google consent on 9 October 2026. No service-account private key, generated owner password or billing activation was required.

## Infrastructure

- Project `desniosense`, owned through `designwithmariam@gmail.com`.
- Default Standard Cloud Firestore database in Mumbai (`asia-south1`), free-tier eligible. Billing remains disabled; deletion protection is enabled. No paid backups, Cloud Storage or Cloud Functions were enabled.
- 13 catalogue products with preview prices, and 58 starter phone models. Phone coverage and production fit remain supplier-maintained, not exhaustive or verified.
- Google and Email/Password providers enabled. Phone login disabled; phone OTP and Facebook remain Phase 2.
- Authorized domains include `desnio-sense.vercel.app`, `desniosense.com`, `www.desniosense.com`, localhost/127.0.0.1 and Firebase project domains. This does not configure domain DNS.
- Admin Head `designwithmariam@gmail.com` has trusted admin and adminHead claims. Use Google sign-in. The prepared account requires verified sign-in; no demo password grants access.
- Vercel API uses a production-scoped Google workload identity, limited to this team/project/environment. Its service account has datastore user and Firebase Auth admin roles. There are no private service-account keys.

## Connected application

Authentication, profiles, customer/admin management, catalogue/designer merchandise, phone-model management/requests, jobs/applications, support/contact tickets, subscriptions, customer carts, draft metadata and standard unpaid order requests now persist to Firebase.

The API verifies identity, current disabled state and admin claims. Admin Head changes are protected, the owner cannot be removed, and removing an account disables access while preserving historical orders. Private reads require ownership or an active verified admin directory record. Sensitive client writes are denied; authorized server actions enforce validation, pricing, stock checks, rate limits and checkout idempotency.

Cart and editable draft metadata can sync across browsers. Originals remain local; drafts explicitly carry originalsStored=false. Custom submission is blocked until permanent artwork storage is available. Payments are disabled and unpaid requests cannot enter production/shipping or be marked Paid from a form. WhatsApp ticket links prepare a message for the customer to send.

## Evidence

- All 29 remote Firestore access-rule cases passed, including disabled accounts, private carts/designs, client role/payment bypasses and private applications.
- Eight automated server-domain security/validation tests pass with `npm test`.
- Actual Firebase API and Chrome browser integration results are recorded in `firebase-tests/integration-receipt.json`. Tests use temporary identities and explicitly remove fixtures; they do not automate the owner's Google consent or charge money.
- `FIREBASE-SETUP-RECEIPT.json` verifies the deployed rules digest, database region/free tier, disabled billing, seed counts and rejected anonymous private reads.

Re-deploy rules from this directory after an owner Firebase CLI login:

```text
firebase deploy --only firestore --project desniosense
```

Keep OAuth credentials outside the repository. See BACKEND-HANDOFF.md for payments, artwork storage and remaining next-phase integrations.
