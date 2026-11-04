# Vastrenix

POS billing, garment stock, GST invoices, customer dues, dealer orders and staff management for Indian clothing stores, with a platform admin console for running the business behind it.

| Part | Folder | What it is |
|---|---|---|
| **Website** | `site/` | Landing page, privacy policy, social share image. Served at `/`. |
| **Store app** | `www/` | The product stores use. Vanilla JS, no build step. Runs as the Android app, as a website, or offline on one device. |
| **Android app** | `android/` | Android Studio project that packages `www/` into a hardened WebView app (APK + Play Store AAB). |
| **Admin console** | `admin/` | For Vastrenix staff: verify plan payments, manage store trials and plans, handle support tickets, audit log. |
| **Payment server** | `api/` | Vercel serverless functions for Razorpay: orders, verification, webhook, admin refunds. See **RAZORPAY-SETUP.md**. |
| **Security rules** | `firestore.rules` | Server-side enforcement of tenancy, roles, plan limits and admin access. |
| **CI** | `.github/workflows/android.yml` | Checks the code, then builds a signed APK + AAB on every push. |

---

## 1. Firebase setup (one time)

1. <https://console.firebase.google.com> → **Add project**.
2. **Build → Authentication → Get started → Email/Password → Enable.**
3. **Build → Firestore Database → Create database** → region **asia-south1 (Mumbai)** → *Production mode*.
4. **Project settings → Your apps → Web (`</>`)** → register a web app → copy the config into
   `www/js/config.js` **and** `admin/js/config.js`. (Use the *web* app's `appId`, not the Android one.)
5. In `www/js/config.js` set `billing.upiId` to the UPI ID that should receive plan payments.
6. Deploy the security rules (required — the app relies on them):
   ```bash
   npm install
   npx firebase-tools login
   npx firebase-tools use --add          # pick your project
   npm run deploy:rules
   ```

> The Firebase **web API key** in `config.js` is public by design; access is controlled by `firestore.rules`.
> Never put a **service-account key** in this repository.

## 2. Make yourself a platform admin

Admin access is a Firebase custom claim, checked by the security rules.

1. Create a normal account for yourself (sign up in the store app or in Firebase Console → Authentication → Add user).
2. Google Cloud Console → IAM → **Service accounts** → firebase-adminsdk → **Keys → Add key (JSON)**. Save it **outside** this folder.
3. Run:
   ```bash
   GOOGLE_APPLICATION_CREDENTIALS=~/secure/vastrenix-sa.json npm run set-admin -- you@yourcompany.com
   ```
4. **Delete that key** in Google Cloud once you're done. You only need it again to add or remove admins.

## 3. Run locally

```bash
npm install
npm run vendor          # copies pinned Firebase / PDF / QR libraries into www/vendor and admin/vendor
npm run serve           # store app  → http://localhost:8080
npm run serve:admin     # admin      → http://localhost:8081  (or npm run serve:web → /admin/)
npm test                # headless smoke tests (first time: npx playwright install chromium)
```

## 4. Android app

### Build on GitHub (no Android Studio needed)
1. Push this folder to a **private** GitHub repository.
2. Create an **upload keystore** once, on a trusted machine, and keep it backed up offline:
   ```bash
   keytool -genkeypair -v -keystore upload.jks -alias upload -keyalg RSA -keysize 4096 -validity 10000
   base64 -w0 upload.jks > upload.jks.b64      # macOS: base64 -i upload.jks -o upload.jks.b64
   ```
3. Repo → **Settings → Secrets and variables → Actions** → add `KEYSTORE_BASE64` (contents of the .b64 file),
   `KEYSTORE_PASSWORD`, `KEY_ALIAS` (`upload`), `KEY_PASSWORD`.
4. Every push to `main` builds a signed `app-release.apk` and `app-release.aab`. Download them from the run's **Artifacts**.
   Without the secrets, CI builds an unsigned debug APK instead.

### Build in Android Studio
Requires Android Studio (Ladybug or newer) and JDK 17. Open the `android/` folder. If Studio asks for a Gradle wrapper,
run `gradle wrapper --gradle-version 8.11.1` inside `android/` once. For release signing, create `android/key.properties`
(git-ignored):
```
storeFile=/absolute/path/to/upload.jks
storePassword=…
keyAlias=upload
keyPassword=…
```
Then **Build → Generate Signed App Bundle / APK**, or `npm run android:release`.

**Before every release:** bump `appVersionCode` (and `appVersionName`) in `android/app/build.gradle`.
For the Play Store, upload the **AAB** and enrol in **Play App Signing**.

The web app is copied into the APK at build time (`syncWebAssets` task), so edit `www/`, never the generated copy.

## 5. Put the website and admin console online

One site serves everything; `npm run build:web` assembles it into `public/`:

| URL | What |
|---|---|
| `https://<domain>/` | Landing page (`site/`) |
| `https://<domain>/app/` | Store app, web version (`www/`) |
| `https://<domain>/admin/` | Platform admin console. Only `platformAdmin` accounts can sign in. |
| `https://<domain>/privacy/` | Privacy policy |

```bash
npx firebase-tools login
npx firebase-tools use --add      # pick your project once
npm run deploy:rules
npm run deploy:web                # builds public/ (www + admin) and uploads it
```
Preview locally with `npm run serve:web`, then open http://localhost:8080, /app/ and /admin/.
**On Vercel instead:** import the repo with **Root Directory left empty** (the repo root, not `www`). `vercel.json` sets the build command (`node scripts/build-web.js`), the output folder (`public`) and the security headers. The admin console is then at `https://<your-domain>/admin/`. Firestore rules still deploy with `npm run deploy:rules`.
The admin console isn't linked from the store app. Access is enforced by the security rules, not by the URL.
Security headers (HSTS, frame-deny, nosniff, referrer and permissions policy, no-store and noindex on `/admin/`) are set in `firebase.json`.
The APK contains only the store app; the admin console is never bundled into it.

---

## How plans and payments work

1. A new store gets a **7-day trial**, created once at onboarding. The rules only allow a trial that starts now and lasts at most 7 days.
2. **Razorpay (default):** the owner picks a plan and pays by UPI, card, netbanking or wallet. The payment server sets the price from `config/billing`, verifies the signature and the payment with Razorpay, and activates the plan instantly. A webhook does the same if the app closes early. Each order extends a plan exactly once.
3. **Manual UPI (optional):** the owner pays your UPI ID and submits the UTR. You approve it in **Admin → Payments → UPI**.
4. When a trial or plan ends, the store can still **read** everything, but the server refuses new bills and stock changes until a plan is active.
5. Everything is managed in the admin console. **Settings** controls plan names, prices, durations, which plans are available, the payment methods, your UPI ID and how the Android app handles payments. **Payments** shows every Razorpay payment, with full refunds that can also take back the plan time. **Stores** lets you extend trials, activate plans manually and suspend stores. Every action is written to the append-only **audit log**.

Setup: **RAZORPAY-SETUP.md**. Payment server tests: `node --test tests/api.test.js`.

## Roles

| Role | Can do |
|---|---|
| Owner / Admin | Everything, including staff approval and settings |
| Branch manager | Sell, stock, purchases, money, dealers, staff view |
| Cashier | Billing, shifts, customers |
| Inventory manager | Items, low stock, transfers |
| Purchase manager | Purchases and stock |
| Accountant | Expenses, cash book, reports |
| Dispatcher | Dealer orders |
| Auditor | Read-only, enforced by the server |

## Data safety

- **Stock-safe billing:** each sale takes a short store lock, re-reads stock, then saves. Two counters can't sell the last piece twice, and invoice numbers never repeat or skip.
- **Posted invoices are locked:** returns go through credit notes.
- **Tenant isolation:** a store's data is readable only by its owner, its approved staff, and platform admins.
- **Offline cache:** screens open instantly and survive short network drops. Billing needs a connection so the stock check is real.

## Project conventions

- Brand colours and tokens: top of `www/css/app.css`. Polish layer (elevation, states, plan cards): end of that file.
- Invoice layouts: `renderInvoice*()` in `www/js/money.js`, shared by preview, thumbnails and PDF.
- Translations: `www/js/i18n.js` (English, Hindi, Gujarati).
- All data shown in HTML goes through `esc()`. Image URLs go through `safeImg()` / `cssUrl()`. Don't bypass them.
- No third-party scripts load at runtime. Libraries are pinned in `package.json` and copied by `npm run vendor`.

See **SECURITY.md** for the security model and the October 2026 incident notes.
