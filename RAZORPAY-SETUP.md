# Razorpay setup — Vastrenix

Store owner app me **Pay ₹X** dabata hai → Razorpay checkout khulta hai (UPI, card, netbanking, wallet) → payment hote hi plan **turant** chalu ho jata hai. Sab kuch admin panel se manage hota hai.

```
Store app ──(login token)──▶ /api/razorpay/create-order ──▶ Razorpay order (price server tay karta hai)
   │                                                            
   └── Razorpay Checkout ──▶ /api/razorpay/verify ──▶ signature + Razorpay se payment check ──▶ plan active
                Razorpay ──▶ /api/razorpay/webhook ──▶ (backup) app band ho gaya ho tab bhi plan active
Admin panel ──▶ Settings (prices, methods) · Payments (refund) · Audit log
```

Secret keys **sirf Vercel ke server** par rehti hain — app, website, GitHub kahin nahi.

---

## Step 1 — Razorpay account
1. <https://dashboard.razorpay.com> par sign up karein, business KYC complete karein (live payments ke liye zaroori).
2. **Account & Settings → Website and app details** me apni website (jaise `https://vastrenix-web.vercel.app`) add karein.
3. Pehle **Test Mode** (upar toggle) me sab try karein — paisa asli nahi katta.

## Step 2 — API keys
Dashboard → **Account & Settings → API Keys → Generate Key**. Do cheezein milengi:
- **Key ID** (`rzp_test_…` ya `rzp_live_…`)
- **Key Secret** — sirf ek baar dikhta hai, turant copy karein.

## Step 3 — Firebase server key (payment server ke liye)
Server ko plan activate karne ke liye Firebase admin access chahiye.
1. Firebase Console → ⚙️ **Project settings → Service accounts → Generate new private key**.
2. Download hui `.json` file ka **poora content** copy karein (agle step me Vercel me paste hoga).
3. Paste karne ke baad wo file computer se **delete** kar dein. GitHub par kabhi upload na karein.

## Step 4 — Vercel environment variables
Vercel → project → **Settings → Environment Variables** → har ek ke liye *Production* (aur Preview bhi chahein to) me add karein:

| Name | Value |
|---|---|
| `RAZORPAY_KEY_ID` | Step 2 ka Key ID |
| `RAZORPAY_KEY_SECRET` | Step 2 ka Key Secret |
| `RAZORPAY_WEBHOOK_SECRET` | koi bhi lamba random password (Step 5 me yahi daalna hai) |
| `FIREBASE_SERVICE_ACCOUNT` | Step 3 ki JSON file ka poora content |
| `ALLOWED_ORIGINS` | *(optional)* sirf tab jab app kisi aur domain se API call kare, comma se alag |

Save karke **Deployments → Redeploy** karein (env variables naye deploy me hi lagte hain).

## Step 5 — Webhook
Razorpay Dashboard → **Account & Settings → Webhooks → Add New Webhook**:
- **Webhook URL:** `https://<aapki-site>/api/razorpay/webhook` (admin panel → Settings me exact URL likha hota hai)
- **Secret:** wahi jo `RAZORPAY_WEBHOOK_SECRET` me daala
- **Active events:** `payment.captured`, `payment.failed`, `order.paid`, `refund.processed`
- Save. Test aur Live mode ke webhooks **alag-alag** banane padte hain.

Dashboard → **Account & Settings → Payment capture** me **automatic capture** on rakhein (server khud bhi capture kar leta hai, par auto behtar hai).

## Step 6 — Security rules deploy
Naye rules (prices aur payments ki suraksha) deploy karna zaroori hai:
```bash
npm install
npx firebase-tools login
npx firebase-tools use --add      # vastranix chunein
npm run deploy:rules
```

## Step 7 — Admin panel → Settings
`https://<aapki-site>/admin/` → **Settings**:
1. **Payment server** box me sab "Set" dikhna chahiye (Razorpay keys, webhook secret). "Missing" ho to Step 4 dekhein.
2. **Plans and prices** — naam, price (₹), din, available. Badli hui price sirf naye payments par lagti hai.
3. **How stores pay** — Razorpay on; manual UPI chahein to on/off; UPI ID.
4. **In the Android app** — APK (direct download) ke liye *Open the website to pay*; Google Play build ke liye *Hide payments in the app* (Play ki billing policy ki wajah se). **Website address** bhi bharein.
5. **Save settings**. Landing page aur app dono nayi prices turant dikhayenge.

## Step 8 — Test payment (Test Mode)
1. Website `/app/` par ek test store banayein → More → Subscription → **Pay**.
2. Razorpay test UPI ID `success@razorpay` se pay karein (ya Razorpay docs ke test cards).
3. Plan turant "Active" ho jana chahiye. Admin → **Payments → Razorpay** me "Paid" dikhega, Audit log me `razorpay.paid`.
4. Refund try karein: Payments → **Refund…** → "Also take back the plan time" tick → plan wapas hat jayega.

## Step 9 — Live
Razorpay me Live Mode → live keys generate karein → Vercel me `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` live wale se badlein → **live webhook** banayein → Redeploy. Admin → Settings me "LIVE mode" dikhega.

---

## Zaroori baatein
- **Vercel plan:** Vercel ka free *Hobby* plan sirf non-commercial use ke liye hai. Paise lene wali site ke liye unki terms ke hisaab se **Pro** plan lena padega.
- **Google Play:** Play Store app me digital subscription bechne ke liye Google Play Billing (ya India me alternative billing enrollment) chahiye. Isliye Play build ke liye Settings me *Hide payments in the app* rakhein.
- **Kya server check karta hai:** price hamesha server tay karta hai (app se aayi price kabhi nahi); signature constant-time compare; Razorpay se payment ka order, amount, currency aur status dobara confirm; ek order se plan sirf ek baar badhta hai (verify + webhook + retry sab milke bhi); sirf store owner apne store ke liye order bana sakta hai; 10 minute me max 6 orders per user; refund sirf platform admin.
- **Agar paisa kata par plan nahi badha:** webhook 1–2 minute me plan chalu kar deta hai. Phir bhi na ho to Admin → Payments → Razorpay me order dekhein ("Not paid" + error hover), aur Store → Manage se manually activate kar sakte hain.
