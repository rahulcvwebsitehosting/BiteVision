# Snap

A local-first photo calorie tracker. Photograph a meal, get a calorie and macro
estimate in a few seconds, correct anything that's off. Everything is stored on
the device — no account, no server, no sync. The only network call is the photo
estimate, sent straight from the phone to the AI provider using **your own API
key**.

Built with Expo, runs in **Expo Go** — no Xcode or Android Studio needed to try it.

---

## Quick start

Requirements: **Node 20+** and the **Expo Go** app on your phone.

```bash
git clone <your-repository-url>
cd snap-calories
npm install
npm start
```

Scan the QR with Expo Go (Android) or the Camera app (iOS).

> **Expo Go version:** this project targets **Expo SDK 54**. Use the current
> Expo Go from the App Store / Play Store. If it says *"requires a newer version
> of Expo Go,"* update the app; if it says *"incompatible,"* your Expo Go is
> older than SDK 54.

---

## Add your API key

Snap needs an API key to estimate photos. It supports **two providers** and
auto-detects which one your key is for:

| Provider | Cost | Get a key |
|---|---|---|
| **Google Gemini** | **Free tier** (no card needed) | <https://aistudio.google.com/apikey> |
| **Anthropic Claude** | Paid — needs API credits | <https://console.anthropic.com/settings/keys> |

> Gemini is the easiest way to try it for free. Anthropic keys need credits added
> under *Plans & Billing* — a Claude.ai chat subscription does **not** include API
> credits.

There are two ways to give Snap the key:

### 1. In the app (recommended)

Paste it during onboarding, or in **Settings → API key**. There's a **Test key**
button to confirm it works. The key is stored in the device keychain
(`expo-secure-store`) — never written to the database, logs, or the JSON export.
You can also **Skip** and use Snap as a manual diary, adding a key later.

### 2. In a local `.env` (for development)

So you don't retype the key on every fresh install:

```bash
cp .env.example .env      # then paste your key into .env
npm start                 # restart so the key is picked up
```

The app copies it into the keychain on launch, so the key step is skipped.

> ⚠️ A key in `.env` is compiled into the JS bundle — fine for local dev, but
> **leave it unset when you publish.** `.env` is gitignored; only `.env.example`
> (empty) is committed. Published builds ship with no key; users add their own
> in-app.

---

## Scripts

```bash
npm start        # Expo dev server (QR code)
npm run android  # open on Android
npm run ios      # open on iOS (macOS only)
npm run web      # browser preview (design only — camera & storage don't run on web)
npm run typecheck
npm run doctor
```

---

## How it works

- **Estimate.** One `fetch` sends a resized/compressed JPEG plus a prompt asking
  for a per-item JSON breakdown. Provider is chosen by key prefix (`sk-ant-…` →
  Anthropic `claude-sonnet-4-6`; otherwise Google `gemini-flash-latest`).
- **Storage.** Local SQLite (`expo-sqlite`) for the profile, meals, and per-day
  targets; photos are JPEGs in the app's document directory. Daily totals are
  aggregated from items, never denormalised.
- **Targets.** Mifflin-St Jeor BMR × activity multiplier + goal adjustment
  (floored at 1200 kcal). Editing your profile applies from that day forward;
  past days keep the target that was active then.

---

## Project layout

```
app/          Screens (expo-router): onboarding/, (tabs)/, capture, review, manual
src/api/      vision.ts (facade), anthropic.ts, gemini.ts, parse.ts, keyStore.ts
src/db/       schema.ts, index.ts, queries.ts   (all SQL lives here)
src/logic/    bmr, macros, scaling, dates, units, export
src/store/    Zustand stores
src/components, src/constants/theme.ts (colours/fonts/spacing), src/media
```

TypeScript strict throughout. All DB access goes through `src/db/queries.ts`; the
API key is confined to `src/api/keyStore.ts`; every colour/font/spacing value
comes from `src/constants/theme.ts`.

---

## Privacy

No backend, nothing collected. Meals, photos, and profile stay in the app's own
storage. The only outbound request is the photo estimate, sent to your chosen
provider under your key. Deleting the app — or *Settings → Delete all data* —
removes everything.

## License

MIT — see [LICENSE](./LICENSE).
