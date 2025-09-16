# Web Template Fixes (Registration fee + Email verify) — web-template-fixes

This bundle contains fixed versions of the following files (relative to your repo root):

- server/apiServer.js
- server/apiRouter.js
- server/api/registration.js
- src/containers/EmailVerificationPage.duck.js

## What changed

1) server/apiServer.js
   - Proper Express init order; single app.listen; single CORS.
   - Keeps endpoints: GET /api/health, POST /api/registration-payment-intent
   - Mounts your API router once under /api.

2) server/apiRouter.js
   - Removed overlapping registrationFee mounts so /api routes don't conflict.
   - Keeps /api mount for registration routes.

3) server/api/registration.js
   - Accepts both payload shapes: {paymentIntentId} and nested {payment.intentId}.
   - Responds with { ok: true, intentId } for quick confirmation.

4) src/containers/EmailVerificationPage.duck.js
   - Only calls verify when ?t=token exists.
   - Prevents 400 spam when navigating to /verify-email without a token.

## How to apply

### Option A: Overwrite files (quick)

1. From your repo root:
   Windows (PowerShell):
     Expand-Archive -Force "web-template-fixes.zip" .

   macOS/Linux:
     unzip -o "web-template-fixes.zip" -d .

2. Rebuild/restart your dev backend:
   export REACT_APP_DEV_API_SERVER_PORT=3500
   node server/apiServer.js

3. Smoke tests:
   curl -sS http://127.0.0.1:3500/api/health
   curl -sS -X POST http://127.0.0.1:3500/api/registration-payment-intent -H 'Content-Type: application/json' -d '{"userId":"test","email":"test@example.com"}'

### Option B: Manual copy-paste

Open each file in VS Code and replace its contents with the versions in this bundle.

## Notes

- The frontend still posts to /api/mark-registration-paid — that route is provided by server/api/registration.js mounted by server/apiRouter.js under /api.
- For verify email: use the email link with ?t=<token>. When visiting /verify-email without a token, the app no longer calls the API; add a "Resend verification email" button wired to sdk.currentUser.requestEmailVerification() if desired.

