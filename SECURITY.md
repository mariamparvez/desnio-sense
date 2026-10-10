# Desnio Sense security

Security reduces risk; this application is not guaranteed immune to attacks. The release must retain the owner's Firebase free-plan requirement and disabled payment processing.

## Implemented controls

- Firebase ID-token verification with revocation checking and current account status. Administrator actions also require verified email, current role claims and an active, undeleted admin-directory entry. Only Admin Head manages administrator accounts; the owner cannot be removed.
- Firestore rules protect private customer records by ownership and deny browser writes to orders, roles, prices, payments, support administration and the catalogue. Server transactions calculate totals from the catalogue and enforce order retry keys and fulfilment transitions.
- Production API mutations require Firebase App Check tokens for the registered Desnio Sense web app. The domain-restricted reCAPTCHA Enterprise key uses a 24-hour App Check token and score threshold 0.5. Firestore enforcement is enabled and verified to reject unattested requests. App Check supplements authorization; it does not replace it or guarantee that every request is legitimate.
- Fixed origin allowlist, cross-site request rejection, JSON-only mutations, bounded payloads, generic internal errors, per-account request limits and verified-email daily limits on public submissions.
- Content Security Policy blocks inline JavaScript, executable object content, external base URLs, framing and unapproved network connections. The policy permits the precise Firebase/reCAPTCHA services used by the store. Styles retain inline support for the existing studio controls. Google popups remain supported.
- No service-account private key in browser code, source control or Vercel configuration. Production uses workload identity restricted to this owner's Vercel production project.
- Dependency patches remove the known vulnerable dependency paths. CI installs the lockfile, audits dependencies, checks syntax/references, runs server tests and builds. Dependabot proposes npm and GitHub Actions updates; these require review and testing.
- CSV export neutralizes spreadsheet formulas, including prefixes hidden behind whitespace.

## Owner and operational responsibilities

Enable two-factor authentication on Google/Firebase, GitHub, Vercel, GoDaddy and Razorpay, and keep recovery codes offline. Review team access and remove unused accounts. Enable GoDaddy domain transfer lock. Account MFA and registrar settings are not changed or verified by this code release.

The production origins https://desniosense.com/, https://www.desniosense.com/ and https://desnio-sense.vercel.app/ serve the matching hardened application over HTTPS. All 32 pages and backend health were checked on each origin. Real browser attestation was verified on both custom-domain addresses. The owner controls GoDaddy DNS; this release does not change email or website DNS records. Vercel project management access is now verified. No custom WAF rules are claimed as configured.

Firebase billing remains disabled. reCAPTCHA Essentials has a free monthly assessment allowance; exhaustion can prevent browser attestation and consequently protected operations. Do not silently weaken enforcement or enable billing. Monitor usage in the console. See [official reCAPTCHA billing](https://docs.cloud.google.com/recaptcha/docs/billing-information) and [Firebase backend verification](https://firebase.google.com/docs/app-check/custom-resource-backend).

Customer and live payments remain disabled. Admin Head sandbox checkout uses protected server-only keys, stored catalogue totals, exact signature and capture verification, replay-safe notifications and explicit test-only records. Sandbox payments cannot contribute to revenue or fulfilment. See RAZORPAY-SETUP.md for the dashboard webhook configuration still required. Durable artwork storage, phone login and Facebook login remain deferred. Any future payment or third-party integration must update the policy, tests and this document.

## Incident response

If an owner account, admin account or backend credential is suspected compromised, revoke its access and sessions, rotate affected credentials, inspect Firebase audit records and GitHub/Vercel changes, and preserve evidence. Restore only reviewed code. Keep dependency updates and access reviews current; a passing audit reports known advisories, not proof that the application has no vulnerabilities.
