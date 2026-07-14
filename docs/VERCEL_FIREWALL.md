# Vercel Firewall deployment runbook

The application enforces origin, access-cookie, session-concurrency, and upload/output checks in server code. Vercel Firewall adds an IP-level cost-abuse boundary before the function runs.

Rate limiting cannot be declared as a `vercel.json` rate-limit action. Apply these rules in the Vercel Firewall dashboard after the project is linked. Applying them is deployment-side work and is **not** complete merely because this runbook exists.

Vercel currently allows one rate-limit rule per Hobby project and 40 on Pro. Because Second Lab needs separate review and coaching rules, the full two-rule design requires Pro or higher. Confirm the production plan before treating this control as active.

## Required production rules

Both rules use a 600-second window, count by client IP, and return HTTP 429 after the limit.

### 1. Three live review requests per IP per 10 minutes

Match all three conditions:

- Request path equals `/api/review`.
- Request method equals `POST`.
- Request header `Content-Type` starts with `multipart/form-data`.

Rate limit to 3 requests per 10 minutes per IP and return 429. The header condition is essential: both user uploads and access-authorized live LeafLens reviews use multipart, while the ungated cached LeafLens request uses `application/json` and must remain outside this rule.

Vercel's natural-language rule builder prompt:

> Rate limit POST requests to /api/review to 3 per 10 minutes per IP only when the Content-Type request header starts with multipart/form-data, then return 429. Do not match application/json.

### 2. Twenty coaching requests per IP per 10 minutes

Match request path `/api/coach` and method `POST`. Rate limit to 20 requests per 10 minutes per IP and return 429.

Vercel's natural-language rule builder prompt:

> Rate limit POST requests to /api/coach to 20 per 10 minutes per IP, then return 429.

## Apply and verify

1. In the production project, open Firewall, choose Configure, and add each rule. Vercel supports describing a custom rule in natural language, but inspect the generated conditions before publishing.
2. Start each rule with a Log action and observe the live traffic view. Confirm the review rule matches multipart requests and does not match the cached `application/json` request.
3. Change the action to Rate Limit with the exact IP key, limit, 600-second window, and 429 follow-up action, then publish.
4. Re-open the active rules and save a redacted screenshot as build evidence.
5. From a test IP, verify the fourth multipart review and twenty-first coaching request return 429. Separately repeat the cached demo more than three times and confirm it remains usable.

## Deployment evidence

- [ ] Review rule appears active in the production project.
- [ ] Coach rule appears active in the production project.
- [ ] Rule conditions and priority were re-read after application.
- [ ] 429 behavior was tested without interfering with the public cached demo.
- [ ] No Vercel token or unredacted security response was committed.

Official references: [Vercel custom rules](https://vercel.com/docs/vercel-firewall/vercel-waf/custom-rules) and [Vercel rate limiting](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting).
