# KaruWeed Security Policy

## Golden rule
**Nothing secret ships in the client bundle.** If a key must live on the client, it must be publicly-safe by design (Supabase anon key, AdMob app ID, Stripe publishable key, Maps key restricted by bundle ID).

---

## Key classification

### Client-safe (may live in `.env` as `EXPO_PUBLIC_*`)
These keys are embedded in the APK/IPA bundle and extractable. They are safe **only when** the backend enforces authorization independently.

| Key | Why it is safe | Server-side guard |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Public endpoint | — |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Designed to be public | Row-Level Security on every table |
| `EXPO_PUBLIC_ADMOB_*_APP_ID` | Google requires it in bundle | — |
| `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Designed to be public | Stripe secret key on server |
| `EXPO_PUBLIC_REVENUECAT_*_KEY` | Designed to be public | Purchase validation on server |
| `GOOGLE_MAPS_API_KEY` | Locked to bundle ID + SHA-256 in Google Console | Cloud Console restrictions |

### Server-only (NEVER in client code, NEVER in `.env` committed to git)
These must live in **Supabase Edge Function secrets** (`supabase secrets set NAME=value`) or equivalent server vault.

| Secret | Where it lives | Rotation cadence |
|---|---|---|
| `ANTHROPIC_API_KEY` | Supabase Edge Function secret | Every 90 days or on leak |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-injected in Edge Functions | Rotate in Supabase dashboard if leaked |
| `STRIPE_SECRET_KEY` | Supabase Edge Function secret | Every 90 days or on leak |
| `STRIPE_WEBHOOK_SECRET` | Supabase Edge Function secret | Every 180 days |
| `REVENUECAT_WEBHOOK_SECRET` | Supabase Edge Function secret | Every 180 days |

---

## Policies

### In code
- Never hardcode API keys, URLs with secrets, or tokens — even as "fallbacks".
- If an env var is missing, throw at boot. Do not ship a default.
- Do not log request/response bodies that may contain tokens.
- Review every PR for `console.log` that prints headers, tokens, or user PII.

### In git
- `.env` is in `.gitignore` and must never be committed.
- `.env.example` is the only env file in git. It must contain placeholders only.
- Before committing, run: `git diff --cached | grep -iE "(api[_-]?key|secret|password|token|bearer)"` — must return empty.
- Secrets accidentally committed must be rotated immediately, not just reverted.

### In build pipelines (EAS / CI)
- Client-safe keys: inject via `eas.json` env blocks or `EAS_PUBLIC_*` secrets.
- Server secrets: never put in EAS. They live in Supabase.
- Do not print env vars in build logs.

### In Supabase
- RLS is ON by default on every user-owned table (verified in migrations).
- Service role is only used from Edge Functions, never from client.
- Edge Functions verify `Authorization` header and check `auth.uid()` ownership before mutating data.
- `anon` role has minimum-necessary grants only.

---

## Rotation runbook

### If Supabase anon key leaks (low impact but rotate anyway)
1. Supabase Dashboard → Project Settings → API → **Reset anon key**.
2. Update `.env` locally with new key.
3. Update EAS secrets: `eas secret:push --scope project --env-file .env`.
4. Publish OTA update (or rebuild) so clients pick up the new key.
5. Old clients keep working until JWT expiry (max 1h default).

### If service role key leaks (critical)
1. Supabase Dashboard → Project Settings → API → **Reset service role key**.
2. Immediately update all Edge Functions that use it.
3. Audit `get_logs` for suspicious access in the last 24h.
4. Rotate every downstream secret that touched this key.

### If Anthropic key leaks (medium)
1. Anthropic Console → API Keys → delete the leaked key.
2. `supabase secrets set ANTHROPIC_API_KEY=<new>` — triggers redeploy of Edge Functions.
3. Review Anthropic usage for anomalous spend in the last 24h.

---

## Audit checklist (monthly)

- [ ] `git log -p -- .env` returns empty (file never added).
- [ ] `grep -rE "sk-ant-|eyJhbGciOi" src/ app/ --include="*.ts" --include="*.tsx"` returns empty.
- [ ] RLS enabled on every user-owned table: `SELECT tablename FROM pg_tables WHERE schemaname='public' AND rowsecurity=false;` returns empty for user tables.
- [ ] Edge Functions list reviewed: no function exposes `SUPABASE_SERVICE_ROLE_KEY` to client responses.
- [ ] No `console.log` of tokens, headers, or PII in production bundle.
- [ ] `.gitignore` covers all secret patterns (`.env*`, `*.pem`, `service-account*.json`, etc.).

---

## Incident contacts

- **Supabase leak**: rotate via dashboard → notify team → audit logs.
- **Client key leak**: usually low severity; rotate + OTA update.
- **Server secret leak**: treat as incident; rotate + audit + post-mortem.

---

## TL;DR for contributors

Before you commit:

```bash
git diff --cached | grep -iE "(api[_-]?key|secret|password|bearer|eyJhbGciOi|sk-)"
```

If anything matches → **stop, rotate, recommit clean**.
