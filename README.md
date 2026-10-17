# Saathi Kosh

**A voice-first digital ledger concept for women-led self-help groups.**

Saathi Kosh is a mobile-friendly prototype exploring how members of a self-help group can record contributions, understand group finances, and participate in loan decisions using familiar Hindi or English. It is built around a fictional group, **Sakhi Self-Help Group**, and designed as a transparent, review-before-save experience.

> **Prototype notice:** All people, balances, transactions, bank records, and loan requests are simulated. Saathi Kosh does not connect to a real bank, transfer money, replace official SHG records, or provide financial or legal advice. The demo member selector is not authentication.

## What it demonstrates

- **Hindi-first, bilingual interface** with an English language option and responsive layouts.
- **Voice-assisted ledger entry** with Hindi/Hinglish text parsing, editable drafts, and explicit confirmation before saving.
- **Deterministic group ledger** with integer-paise amounts and calculated balances.
- **Loan proposals and group voting**, including configurable rules and a simulated, sequential spoken approval-call flow.
- **Weekly summaries, simulated bank reconciliation, and a tamper-evident SHA-256 audit trail.**
- Optional **ElevenLabs** speech services and **LiveKit** browser-to-browser audio calls; credentials stay server-side.

## Built with

Next.js App Router, React, TypeScript, Tailwind CSS, Prisma, SQLite, Zod, Vitest, and the browser Web Speech API.

## Run locally

Use Node.js 20.19+ or 22.12+ and npm.

```powershell
npm ci
Copy-Item .env.example .env
npm run db:push
npm run db:seed
npm run dev
```

Open <http://localhost:3000>. The seed command **resets** the demo tables and creates 12 fictional members, a ₹45,000 opening balance, sample deposits and repayments, simulated bank rows, and a pending ₹15,000 loan proposal. Re-run `npm run db:seed` to restore the sample dataset. For production mode, run `npm run build` followed by `npm start`.

## Demo workflows

### Voice-assisted ledger entry

Go to **Voice entry**, speak or type a sentence such as `Aaj Sunita ne paanch sau rupaye jama kiye`, review the recognized text and parsed transaction, and explicitly choose **Confirm and save to ledger**. Recognition depends on browser support and microphone permission; manual text entry remains available. Recognition does not save an entry automatically.

### Emergency loan request and group vote

In **Loans & voting**, enter or dictate a request, review the parsed member, amount, purpose, and emergency flag, then confirm the proposal. For an eligible emergency request, the app can run a sequential in-app simulation: browser speech reads the request, then listens for a spoken **Yes/No** or **Haan/Nahin** vote. Votes are saved through the group-voting API, and the configured quorum and approval percentage determine the result.

This workflow is a **single-session role-play**, not outbound calling: no phone numbers are dialed, other devices are not rung, and no AI phone agent is connected. The presenter acts as each demo member. A clear on-screen manual vote option is available if speech recognition is unsupported or unavailable.

### Live demo call between two browsers (optional)

The member directory can demonstrate browser-to-browser audio using LiveKit when configured. Both browsers must have the app open and use the same app origin and database. This is not a cellular call and cannot ring a closed or locked device. See the optional setup below.

## Presentation walkthrough

The main navigation highlights overview, voice entry, ledger, loan approvals, and weekly review. Reconciliation, audit history, and settings are supporting features.

### Before presenting

- Use only fictional demo details.
- Grant microphone permission in a supported browser if demonstrating speech recognition or LiveKit calls.
- Live browser speech recognition may use a browser-provided online service; availability, accuracy, and terms depend on the browser. It is separate from the optional ElevenLabs provider.
- A LiveKit call requires valid project credentials and two open browsers. See the optional LiveKit setup below.

### Short story

1. On **Overview**, introduce the problem of keeping a clear shared record of group savings. Point out that the group and balance are simulated.
2. Demonstrate an in-app browser call between two demo identities, if LiveKit is configured. Explain that it is browser-to-browser audio, not a phone-number call.
3. On **Voice entry**, dictate or type `Aaj Sunita ne paanch sau rupaye jama kiye`. Review and correct the draft, then explicitly confirm it.
4. On **Ledger**, show the saved ₹500 entry and calculated balance. On **Weekly review**, show the summary derived from ledger entries.

The app can also demonstrate the emergency-loan voting flow described above. Loan voting, reconciliation, audit history, and configurable rules are prototype features; bank evidence and all financial data remain simulated.

## Voice provider (optional)

Text parsing works without provider credentials. The voice-entry screen can optionally use browser `SpeechRecognition` (`webkitSpeechRecognition` in Chromium-based browsers) for live, interim speech-to-text, then sends only the recognized text to the app parser when the user chooses **Review the draft**. Support is browser-dependent; recognition may use the browser vendor's service and is not guaranteed to run offline or be free under every browser's terms. Typed Hindi/Hinglish remains the fallback. This browser live-recognition path is separate from the optional server-side ElevenLabs provider below, which supports recorded audio transcription and speech playback.

The server-side adapter follows ElevenLabs' documented:

- [Create transcript](https://elevenlabs.io/docs/api-reference/speech-to-text/convert): `POST https://api.elevenlabs.io/v1/speech-to-text`, multipart `file` and `model_id`. It defaults to `scribe_v2`, documented for 90+ transcription languages. Hindi (`hi`) is passed as an ISO language hint; recognition quality for Hindi/Hinglish should be evaluated with the selected account and real devices.
- [Create speech](https://elevenlabs.io/docs/api-reference/text-to-speech/convert): `POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}`. The default is `eleven_flash_v2_5`; the provider currently lists Flash v2.5 as a fast model with 32 supported languages. Check the current supported-language/model availability and voice suitability in your account before enabling spoken Hindi responses.
- [Model overview](https://elevenlabs.io/docs/overview/models) and [API pricing](https://elevenlabs.io/pricing/api).

Set `VOICE_MODE=elevenlabs`, `ELEVENLABS_API_KEY`, and `ELEVENLABS_VOICE_ID` in the server-only `.env`. `ELEVENLABS_STT_MODEL` and `ELEVENLABS_TTS_MODEL` can override the defaults. The key is never returned to the browser or written to logs. Audio is sent to ElevenLabs only after an explicit transcription action; no audio is stored by the application. The UI falls back to text when the provider is not configured or errors. Credit use depends on account plan, model, audio duration, voice, and current provider terms; this application does not claim a fixed per-request credit cost.

## LiveKit browser voice calls (optional)

The member directory supports live browser-to-browser audio calls using LiveKit's official [`livekit-client`](https://docs.livekit.io/intro/basics/connect/) and [`livekit-server-sdk`](https://docs.livekit.io/frontends/reference/tokens-grants/) packages. Call invitations/signaling are stored in the existing SQLite database and polled while the app is open; LiveKit carries the live audio. There is no phone-number calling, AI agent, recording, or paid telephony integration.

<details>
<summary>Configure LiveKit and test a two-browser call</summary>

1. In the LiveKit Cloud project dashboard, copy its **WebSocket URL**, **API key**, and **API secret**.
2. Add these server-side values to the root `.env` file (the names are case-sensitive):

   ```dotenv
   LIVEKIT_URL="wss://your-project.livekit.cloud"
   LIVEKIT_API_KEY="your-livekit-api-key"
   LIVEKIT_API_SECRET="your-livekit-api-secret"
   ```

   Use the exact project URL from LiveKit Cloud, not an HTTP URL. Never add the secret to client code, a `NEXT_PUBLIC_` variable, source control, or a message shared with the person you are calling. `.env` is ignored by Git; `.env.example` contains safe placeholders.
3. Apply the additive call-table schema change (safe for existing ledger data), then start the app:

   ```powershell
   npm run db:push
   npm run dev
   ```

   Restart `npm run dev` any time you change `.env`. The call buttons remain disabled until the server sees all three valid LiveKit settings.
4. To test on another phone over the internet, install Cloudflare `cloudflared`, leave Next.js running on the laptop, and open a second terminal in this folder:

   ```powershell
   cloudflared tunnel --url http://localhost:3000
   ```

   Copy the temporary `https://…trycloudflare.com` URL printed by the command and open it on the phone. Keep the tunnel command running during the test. Do **not** send `localhost` or `127.0.0.1` to the phone; those addresses point to the phone itself. The HTTPS tunnel is needed because browsers require a secure context for microphone access. The media connection then goes from each browser to the LiveKit Cloud URL. The current Next.js dev configuration allows the temporary `trycloudflare.com` origin. Anyone with the tunnel URL can reach the demo; for a quick, email-gated test, use `cloudflared tunnel --url http://localhost:3000 --allowed-mail your-friend@example.com` with your friend's email instead. Quick Tunnels are temporary, change hostnames each run, and are intended for testing—not production.
5. Open the exact same HTTPS tunnel URL on both the laptop and the phone (not `localhost` on one and the tunnel on the other). Choose different demo identities in **Calling as** (for example, Sunita on the laptop and Rekha on the phone). Click **Call** beside Rekha. The phone receives the in-app invitation while Saathi Kosh is open; choose **Accept** and allow microphone access. The laptop automatically starts joining after acceptance and asks for microphone permission. The call shows **Connected** only after both browsers subscribe to and successfully start playback of the other person's microphone audio. If mobile autoplay is blocked, tap **Enable call audio**. Speak in both directions, then use **Hang up**. Use headphones if you hear echo. If permission was denied, allow microphone access for the site in browser settings and try again.

The Call button creates a `CallInvitation` row in the shared SQLite database; the recipient's open browser discovers it through the `/api/calls` poll (every two seconds). Accepting changes the persisted invitation state and causes the caller to join automatically. Each invited member receives a short-lived token for the same unique room, but only after acceptance. A client reports media readiness only after its remote audio track's browser `play()` promise succeeds. The backend does not mark the call **Connected** until both participants have reported that event. This confirms that both browser playback paths started; it does not replace speaking/listening on both devices as the final real-world audio test.

Both devices must use the same app origin, and that origin must route to the same Next.js process and SQLite database. In this laptop-tunnel demo, both devices should open the identical `https://…trycloudflare.com` URL while `npm run dev` and `cloudflared` are running on the laptop. Invitations are stored in SQLite (`DATABASE_URL`, default `file:./prisma/dev.db`), not in browser memory. Two separately started app servers or separate deployments with separate SQLite files will not share invitations even if the UI looks identical. A deployed app needs a shared/persistent database and must run the same code revision on both clients.

The invitation screen appears only while the recipient has the app open and polling. This is an in-app browser call, **not** a cellular call and cannot ring a closed browser or locked phone. Rooms have opaque unique names; the backend issues five-minute tokens restricted to that call's room and only to its two invited demo-member records. Invitations expire after 90 seconds unanswered; accepted calls that never establish both audio paths also fail after 90 seconds. Duplicate active calls are rejected, and the other participant's departure ends the call. A 15-second participant heartbeat lets the server clean up a connected call after 45 seconds without either browser.

**Important identity limitation:** the existing Saathi Kosh app has no login/authentication; its role/member picker is a demo identity selector. Call endpoints verify that the selected name exists in the seeded group and that only the invited participants can accept, control, or obtain a room token. A visitor who can access the shared demo URL can still select another demo member and impersonate them. This is suitable only for a supervised hackathon demo—not a private deployment with real member identities or data. Real deployment requires authenticating members and deriving the caller identity from that authenticated session rather than the demo selector.

**Cost:** no additional telephony, AI-agent, or recording service is used. At the time this integration was implemented, LiveKit's official Build-plan quota page listed 5,000 WebRTC participant-minutes and 50 GB downstream transfer per month, with a 100-participant concurrency limit. WebRTC participant minutes count each connected person (a 10-minute, two-person call uses 20 participant-minutes). The free Build plan's included metered allowance is documented as a hard cap: when exhausted, new requests fail rather than generating overage charges. Limits, prices, and plan terms can change; check your project's Cloud dashboard and [current quotas and pricing](https://docs.livekit.io/deploy/admin/quotas-and-limits/) before presenting. Staying within the currently included Build-plan allowance should cost ₹0; this is not a guarantee if the project is on a paid plan or terms change. Cloudflare documents Quick Tunnels as temporary testing/development tunnels; check its current terms for your use.

### LiveKit call test checklist

- [ ] Without LiveKit settings, the directory clearly explains why calling is unavailable; ledger and loans still work.
- [ ] With valid server settings, select two different members in two browsers/devices and place a call.
- [ ] Confirm the recipient can accept and decline, and the caller can hang up.
- [ ] Confirm the caller automatically joins after acceptance and both sides receive microphone prompts.
- [ ] Confirm neither side shows **Connected** until both receive and start playing the other side's audio; use **Enable call audio** if browser autoplay is blocked.
- [ ] Deny microphone permission and confirm a useful error appears; allow it and retry.
- [ ] Confirm an unrelated member cannot accept, hang up, or obtain a token for that invitation.
- [ ] Confirm a second concurrent call involving either busy member is rejected.
- [ ] Disconnect one browser/network and confirm the other side sees the call end.
- [ ] Confirm a wrong LiveKit URL/key/secret reports a connection failure without exposing the API secret in browser output.

</details>

## Data, privacy, and limitations

- Money is stored as integer paise. The backend computes balances from the opening balance and confirmed ledger events; loan principal is tracked separately from group cash.
- Voice drafts are proposals, and confirmation is explicit. Corrections add a new adjustment linked to its source entry; history is not silently edited.
- Bank matching is deterministic and reports reference/amount/date reasoning. All bank evidence is simulated.
- Loan thresholds, quorum, approval percentage, emergency quorum, and weekly expected contribution are editable. The default rules are demo defaults only. A passing group vote does not transfer funds; no wallet transfer is enabled.
- The audit history uses SHA-256 linked events and can detect many payload/sequence changes. It is tamper-evident, not immutable: a privileged operator able to rewrite the entire SQLite database could also rewrite the chain.
- The demo role selector is only an attribution aid, not identity verification. Do not enter Aadhaar, bank credentials, or other sensitive information. This prototype does not claim regulatory or DPDP Act compliance.
- Remove local demo records by stopping the app and deleting `prisma/dev.db` (and `prisma/dev.db-journal` if present); recreate it with `npm run db:push` and `npm run db:seed`. Browser role selection is stored only in local storage; clear site data to remove it. No raw audio is retained.

## Checks

```powershell
npm run lint
npm run typecheck
npm test
npm run build
```

The tests use an isolated `prisma/test.db` and reseed it before running; that database is ignored by Git.
