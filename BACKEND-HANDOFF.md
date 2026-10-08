# Firebase backend handoff

No backend is implemented in this release. The planned stack is Vercel hosting + Firebase Authentication, Firestore, Cloud Storage, and server functions for privileged actions/payments.

## Information to provide

- Public web-app `firebaseConfig` from Project settings → Your apps → Web SDK configuration.
- Firebase project ID and selected Firestore/Storage region.
- Admin Head email, intended live domain, and development/preview domains.
- Later: Razorpay account/test mode setup and Facebook developer-app configuration, through protected account/environment settings.

Do not provide Google passwords or private service-account JSON in chat. Billing activation is the owner’s decision; Firebase Cloud Storage requires Blaze. Add a budget alert and review SMS/upload usage.

## Connect the frontend adapter

| Current module | Backend responsibility |
| --- | --- |
| auth.js, pages.js | Real Google/Facebook/email/phone auth, OTP/reCAPTCHA, linked identities, profiles |
| data.js | Replace browser Store/DS with authenticated reads/writes and stable customer IDs |
| admin.js, admin-catalogue.js | Server-enforced Admin/Admin Head permissions, catalogue/customer/admin/jobs CRUD and order/ticket status |
| phone-catalogue.js | Shared supplier-maintained model catalogue, search, photos, case templates, requests |
| artwork-store.js, studio.js | Original uploads to Cloud Storage; preview derivatives, editable scene documents, asset references |
| design-export.js | Durable source retrieval and server-assisted export for large files |
| commerce.js | Server prices/stock/coupons, order IDs, Razorpay order creation, signature/webhook verification, fulfilment |

Suggested collections: users, products, phoneModels, phoneModelRequests, designs, orders, tickets, jobs. Store original image files in Storage, not Firestore documents; persist references and editable layer metadata. Track requested phone model and supplier template version in each custom order.

Use Firebase Authentication custom claims for Admin and Admin Head. Customers may access their own profiles/designs/orders/tickets; clients must not choose their own role, mark payments paid or change order totals. Validate inventory and prices in server transactions. Use a server webhook to confirm Razorpay payment rather than trusting the frontend success callback.

## Phone catalogue and MCP

The frontend includes a starter catalogue and manual-model requests. It does not claim complete coverage of every phone or verified case dimensions. Import a licensed/supplier-supported catalogue; include platform, brand, model, variant, camera cut-outs, dimensions, photos and production template version. The owner/admin can add missing models.

The official Firebase MCP manages your Firebase project; the official Vercel MCP manages hosting. Neither is an all-phones database. If you still want a dedicated phone-catalogue MCP, build it over your shared database in the backend phase, with tools such as search_phone_models, get_phone_template, submit_model_request and authorized upsert_phone_model. Public store pages call the normal API/database adapter; agents may use the MCP interface. Do not expose unauthenticated admin writes.

References: [Web setup](https://firebase.google.com/docs/web/setup), [Phone authentication](https://firebase.google.com/docs/auth/web/phone-auth), [Security rules](https://firebase.google.com/docs/rules/basics), [Storage](https://firebase.google.com/docs/storage/web/start), [Firebase MCP](https://firebase.google.com/docs/ai-assistance/mcp-server), [Razorpay standard integration](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/).
