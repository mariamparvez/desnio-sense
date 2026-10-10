# Razorpay sandbox checkout

The website creates Razorpay orders from server-calculated catalogue prices in paise. Only a verified, active Admin Head can use sandbox checkout; customer and live payments remain disabled. Successful test payments are stored as `Test paid`, excluded from business metrics and blocked from production or shipment. Custom-order submission remains paused until durable original artwork storage is available.

## Protected settings

Use Production environment variables because the existing Firebase federated identity permits only production deployments. Set `RAZORPAY_KEY_ID`, Sensitive `RAZORPAY_KEY_SECRET`, `RAZORPAY_MODE=test` and Sensitive `RAZORPAY_WEBHOOK_SECRET` (32+ random characters). Never paste secrets into source or chat. The owner initially saved the Sensitive secret under the public `rzp_test_…` ID as its variable name. Vercel cannot rename a Sensitive variable; the server accepts this exact validated test-ID alias when the conventional secret variable is absent. Neither name nor secret is inferred from browser input.

## Owner test

Sign in through Google using the Admin Head account. Add a regular catalogue product, complete delivery details and continue to Payment. Select **Open test checkout** in the Admin Head sandbox section. Razorpay must clearly show test mode. Use its sandbox success/failure controls; do not enter real card details. The amount comes from the saved catalogue rather than the browser. A captured test transaction opens a sandbox confirmation; an authorized/pending transaction offers a status check. Closing checkout keeps the cart.

## Razorpay Dashboard webhook

In **Test Mode → Account & Settings → Webhooks**, add:

- URL: `https://www.desniosense.com/api/razorpay-webhook`
- Secret: the protected secret generated for this project; the owner has a private local copy outside the repository.
- Events: `payment.captured`, `order.paid`, `payment.failed`.

Webhook signatures are checked against original bytes before JSON parsing. Events reconcile against the Razorpay API, validate exact order/amount/currency, and use the signed payload's SHA-256 hash for idempotency. Failed or reordered notifications cannot downgrade a captured payment. Automatic capture must be configured in Razorpay; authorization is not treated as capture. Until the dashboard webhook is added, the browser success verification and explicit status check work, but unattended webhook delivery is not configured.

## Production remains a separate release

Live payments require merchant activation, securely configured live keys, a deliberate code change allowing live mode, inventory reservation and release, approved shipping/tax/coupon totals, reconciliation and refund handling. Adding live keys alone cannot activate this sandbox-only release. No real payment or fulfilment is claimed by a successful sandbox test.

Official references: [Standard Checkout](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/), [webhook verification](https://razorpay.com/docs/webhooks/validate-test/).
