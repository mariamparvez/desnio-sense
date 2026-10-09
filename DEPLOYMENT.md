# Desnio Sense — GitHub → Vercel → desniosense.com

The production storefront is hosted at https://desnio-sense.vercel.app/ through the GitHub integration. The custom domain requires the owner’s DNS configuration. The owner selected the private repository `mariamparvez/desnio-sense`, and GitHub repository read/write access is verified. The owner handles GoDaddy DNS.

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

## What the frontend deployment does

The pages are online and usable as a prototype. Demo OTP is `123456`; Google/Facebook use explicitly labelled demo profiles; email/admin preview passwords are not checked. Every browser/device has its own local records and uploads. No live OTP, payment, durable shared orders, true admin authorization or backend phone-catalogue service is running yet.

The high-resolution print workflow rebuilds 6000px transparent PNG/SVG artwork and preserves uploaded originals locally. Moving to the deployed origin does not automatically move old localhost originals. Download print packages before clearing browser data; Firebase Storage will provide durable originals after backend integration.
