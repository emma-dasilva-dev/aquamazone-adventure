# AQUAMAZONE Adventure — Website

Mobile-first, bilingual Next.js website for Aquamazone Adventure in Adounko, Cotonou, Benin.

## Design and sections

- Photographic hero, vertical activity discovery, premium experience packages and Restaurant & Bar
- Scroll-driven horizontal gallery with **20 photo slots**; current stock photographs are illustrative, **not pictures of Aquamazone**
- Location/directions, opening hours, visitor guidance and accessible FAQ
- Floating visitor assistant with a secure server-side AI integration and WhatsApp handoff
- All development remains on `design/mobile-first`; `main` is not modified

## Run locally

Requires a current supported Node.js version and npm.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Enable conversational AI

The visitor assistant uses `app/api/assistant/route.ts` and `lib/aquamazone-knowledge.ts`. It defaults to the economical `gpt-6-luna` model through the OpenAI Responses API.

1. Create `.env.local` locally using `.env.example` as the template.
2. Set `OPENAI_API_KEY` to a valid server-side API key. Never place it in `NEXT_PUBLIC_*` variables or commit it to Git.
3. Optionally set `OPENAI_ASSISTANT_MODEL`.
4. Restart your dev server. Add these settings to your production host before deployment.

Without the key, the assistant transparently falls back to WhatsApp. The web app **does not** book visits, collect payment or check inventory. The assistant cannot confirm availability, a reservation, or MTN MoMo payment.

**Security status:** API body validation, bounded history, server-only credentials, provider timeout and a best-effort per-process rate limit are implemented. For a public production deployment, add **distributed** rate limiting / a WAF and abuse monitoring; per-process limits are not sufficient across serverless instances. Perform prompt-injection, bilingual and mobile accessibility testing before going live. Responses from an LLM should still be treated as fallible.

## Gallery assets

The 20 gallery entries are in `app/ImmersiveGallery.tsx` in the `slides` array. Update each entry with authorized Aquamazone media, bilingual alt/caption copy, and meaningful labels. The stock images currently used are examples. The GSAP scroll-pinned experience has a reduced-motion fallback.

## Before launch

- Replace all stock photographs with approved real Aquamazone media, including gallery images.
- Verify precise map pin and all displayed rates, especially packages still awaiting business confirmation.
- Complete accessibility, keyboard, low-end mobile, and responsive testing.
- Add production edge/distributed rate limiting, usage alerts and error monitoring.
- Implement secure reservation, phone OTP, MTN MoMo verification and staff booking management separately.

Do not publish the prototype as if its example imagery were official photos or if online bookings were already operational.
