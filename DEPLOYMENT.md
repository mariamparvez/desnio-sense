# Desnio Sense — GitHub → Vercel → desniosense.com

The production storefront is hosted at https://desnio-sense.vercel.app/ through the GitHub integration. Both desniosense.com and www.desniosense.com serve the matching production site over HTTPS; all 32 pages and backend health were verified on each. The owner continues to manage DNS. The owner selected the private repository `mariamparvez/desnio-sense`, and GitHub repository read/write access is verified. The owner handles GoDaddy DNS.

## Account connections

1. Sign up or sign in at https://vercel.com using your GitHub account.
2. Authorize Vercel’s GitHub integration for the intended Desnio Sense repository.
3. Authorize the official Vercel MCP in Codex after it is configured. It uses `https://mcp.vercel.com` and OAuth. Run `codex mcp login vercel`, or use the login control offered by Codex’s MCP settings. No account password or Vercel token needs to be pasted into chat.
4. Provide the GitHub repository URL, Vercel project/team, and selected production branch. A private repository is suitable. If you do not yet have a repo, choose its name before creation.

Official references: [Vercel MCP](https://vercel.com/docs/agent-resources/vercel-mcp), [GitHub integration](https://vercel.com/docs/git/vercel-for-github), [Codex MCP](https://developers.openai.com/codex/mcp/).

## Deploy this folder

Use only the contents of Desnio-Sense-Website as the repository root. The full task workspace contains PDFs, temporary work and other unrelated files.

- Framework preset: **Other**.
- Root Directory: repository root; if you place the frontend inside a larger repository, select that frontend subdirectory.
- Build Command: `npm run build`.
- Output Directory: `dist`.
- Node: **22**.
- Install the locked Node dependencies for the Firebase/Vercel API.
- Keep `.html` routes; vercel.json deliberately does not use a single-page application rewrite.

Local preparation:

```text
node scripts/check.mjs
node --test server/domain.test.mjs
node scripts/build.mjs
```

Vercel’s GitHub integration handles preview deployments for branches/PRs and production updates for the selected production branch. The included GitHub workflow checks syntax, local references and the static build; it does not duplicate deployment or require a deployment token.

## Connect the domain

In the selected Vercel project, add `desniosense.com` and `www.desniosense.com` under Domains. Choose the primary domain/redirect there. Copy Vercel’s exact A/CNAME/verification records into GoDaddy. Keep your existing mail-related MX/TXT records. DNS propagation and certificate issuance may take time; confirm Valid Configuration before treating the domain as finished.

[Official domain setup](https://vercel.com/docs/domains/working-with-domains/add-a-domain)

## Backend deployment

Firebase Authentication and Firestore power customer accounts, verified admin roles, product and phone-model management, carts, draft metadata, unpaid order requests, cancellations, tickets and careers. The Vercel API uses the production project's federated identity; no service-account private key is stored in GitHub or the browser. See BACKEND-HANDOFF.md and firebase-tests/ for the scope and verification evidence. Check the deployed API health and authenticated flows after every backend release; a successful static build alone does not prove backend availability.

The owner selected the free Firebase plan and disabled payments. Standard checkout saves unpaid requests. Phone OTP and Facebook are deferred. Custom-order submission remains blocked until durable original artwork storage is enabled. The studio preserves uploaded originals locally and can export print packages; moving to the deployed origin does not move localhost originals. Download print packages before clearing browser data.

## Verified Firebase release

The production backend source revision `8b4571d69974ac149fb940fd434a6e0750cc71e8` passed GitHub checks, deployed through the existing Vercel Git integration, and passed all 27 live Firebase/browser integration checks. See `firebase-tests/production-receipt.json`. API health reports ready; anonymous mutation attempts return 401. Temporary test identities and their records were removed. Payments, permanent artwork storage, phone OTP and Facebook remain disabled.

## Security release

Security source revision `fb163396a7846c15c9bedd716305b2b4d20b9cb6` passed GitHub CI and deployed through Vercel (deployment `7fJXVAL9uth5TGGqBB2hBB5HEVmk`). It passed 35 local integration/attack checks, 36 live integration/attack checks and 12 server tests. The dependency audit reports zero known vulnerabilities. Production API mutations and Firestore enforce App Check; real attestation works on both custom-domain addresses. Browser injection attempts were blocked, all three production origins serve matching source and security headers, and all temporary test identities and attestation registrations were removed. See SECURITY.md and security-tests/. Firebase billing remains disabled. Owner account MFA and domain transfer lock require owner setup and are not claimed as configured.

## Razorpay sandbox release

The protected Production settings enable Admin Head test checkout only. Live/customer payments remain disabled. The native webhook endpoint is `/api/razorpay-webhook`; configure it in Razorpay Test Mode with the matching private webhook secret. Follow RAZORPAY-SETUP.md. Secrets and temporary test identities are excluded from this repository.
