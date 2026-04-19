# CLAUDE.md — Instructions for AI assistants on this repo

This file is read automatically by Claude Code / Claude agents at session start.

## Project
KaruWeed — cannabis cultivation app. Expo SDK 54 + Supabase + Claude Vision via Edge Function.

## HARD SECURITY RULES (non-negotiable)

Before writing or editing code, read `docs/SECURITY.md`.

**Never do any of these:**

1. **Never hardcode secrets** — no API keys, tokens, URLs-with-secrets, or passwords in `.ts`/`.tsx`/`.json` files. Not even as "fallbacks".
2. **Never read `.env` and paste its contents into code.** If a var is missing, throw at boot. Do not ship a default.
3. **Never commit `.env`** — it is in `.gitignore`. Only `.env.example` (placeholders) is tracked.
4. **Never put server secrets in the client.** `ANTHROPIC_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` — all live in Supabase Edge Function secrets. Only `EXPO_PUBLIC_*` vars are OK in the client bundle.
5. **Never log tokens, Authorization headers, or raw PII.**
6. Before committing, mentally run: `git diff --cached | grep -iE "(api[_-]?key|secret|bearer|eyJhbGciOi|sk-)"`. If it would match → don't commit.

If you find a hardcoded secret already in the code, treat it as a bug: remove it, require the env var, and flag it to the user for rotation.

## Env var contract

Client (may live in `.env` as `EXPO_PUBLIC_*`):
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_ADMOB_*_APP_ID` (future)
- `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` (future)
- `EXPO_PUBLIC_REVENUECAT_*_KEY` (future)

Server only (Supabase Edge Function secrets, never in repo):
- `ANTHROPIC_API_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (auto-injected)
- `STRIPE_SECRET_KEY` (future)
- `STRIPE_WEBHOOK_SECRET` (future)

## Project conventions

- **Language**: code in English, UX/copy in Spanish (LATAM).
- **Auth navigation**: handled exclusively by `app/_layout.tsx`. Screens never call `router.replace` on login/logout.
- **Supabase Edge Functions**: require both `Authorization: Bearer <token>` and `apikey: <anon>` headers.
- **OTA updates**: `eas update --branch preview` after every feature. Rebuild APK only when native config changes.
- **Dark theme**: bg `#0A0A0A`, primary `#22C55E`, accent `#C47A2C`.
- **Types**: strict TS, no `any` unless explicitly unavoidable.
- **RLS**: every user-owned table has Row-Level Security enabled with explicit policies.

## Monetization context (when working on billing/paywall)

See `docs/BUSINESS_MODEL.md`, `docs/MONETIZATION_ROADMAP.md`, `docs/MARKETPLACE_DESIGN.md`, `docs/LEGAL_FRAMEWORK.md` **if they exist**. If not, ask the user before designing pricing — do not invent tiers or prices.

## When unsure

Ask. Do not invent env var names, RLS policies, or pricing. Do not add deps without confirming.
