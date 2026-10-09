# Firebase setup status

Firebase project administration completed on 9 October 2026 using the owner's
Google consent. No console steps are required from the owner for this setup.

## Deployed and verified

- Project: `desniosense`; Google account: `designwithmariam@gmail.com`.
- Standard `(default)` Cloud Firestore database in Mumbai (`asia-south1`).
- The database is eligible for the free tier; project billing remains disabled.
- Database deletion protection enabled. No paid backups or point-in-time recovery.
- 13 products imported from the existing website, retaining **Preview** prices.
- 58 starter phone models imported. These are not a complete all-phones database;
  production templates remain unverified until a supplier supplies them.
- Google and Email/Password sign-in enabled.
- Phone sign-in disabled as requested for Phase 2; Facebook remains deferred.
- Login domains authorized: `desnio-sense.vercel.app`, `desniosense.com`,
  `www.desniosense.com`, `localhost`, `127.0.0.1`, and the Firebase project domains.
  Authorizing a domain does not configure DNS or publish the site on that domain.
- Mariam's Firebase Auth account has trusted `admin: true` and `adminHead: true`
  custom claims, and an Admin Head directory record. No password was generated.
  Admin access requires a verified Firebase sign-in; the prepared account's email
  becomes verified through Google sign-in. No client email whitelist grants roles.
- `firestore.rules` deployed; the remote ruleset matches this source byte for byte.
- All 19 remote access-rule tests passed. Anonymous catalogue queries returned
  the expected counts; private admin and order reads were rejected.

See `FIREBASE-SETUP-RECEIPT.json` for the database, verification time, ruleset ID
and source digest. It contains no tokens, passwords or private keys.

## Data access

The rules cover `users`, `admins`, `products`, `phoneModels`, `phoneModelRequests`,
`jobs`, `tickets`, and `orders`. Empty collections appear in the console when the
first genuine record is written. No fake customers, tickets or orders were imported.

Public users can read active products/models and published jobs. Signed-in customers
can manage their own validated profile and submit their own support/model requests.
Customers can read their own orders; administrators can read store operations.
Only trusted authentication claims allow administrative catalogue/job changes.
The Admin Head can manage the admin directory; editing a directory record does not
grant authentication claims. Orders and payments require trusted server processing:
browser code cannot create a paid order or change payment totals/states.

## Website integration still pending

The published website still uses the frontend demo adapter. Creating this database
and granting Firebase claims does **not** convert its demo logins, local records,
checkout or admin pages into a live backend. The public SDK configuration is saved
in `firebase-config.js`; it is not yet connected to the page controllers.

Next implementation work is the real Auth/Firestore adapter, removal of demo login
bypasses, and authenticated page/CRUD integration. Payments need server-created
Razorpay orders and verified webhooks. Durable original artwork storage, Phone OTP,
and Facebook authentication remain separate Phase 2 work. Vercel remains the host;
Firebase Hosting, billing, Cloud Storage and Cloud Functions were not enabled.

## Re-deploy rules

With the official Firebase CLI signed in to the owner account, from this directory:

```text
firebase deploy --only firestore --project desniosense
```

Keep OAuth credentials outside this website directory and the Git repository.
