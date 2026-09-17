# Client Registry App

A phone-OTP-login civic platform: anyone can log in with just their mobile
number and file a complaint about a local issue (road, water, electricity,
etc). To register clients and view complaint/client records, a user has to
pay a one-time membership fee.

Built with Next.js 14 (App Router), react-hook-form, zod, Tailwind CSS, and
lucide-react icons.

## Run it locally

```bash
npm install
npm run dev
```

Open **http://localhost:3000** in Chrome — redirects to `/login`.

## Testing the full flow

1. **Login**: enter any 10-digit mobile number → Send OTP
2. **OTP**: enter **123456** → account is created automatically on first
   login, and you land on the Dashboard
3. As a brand-new user you're **not a member yet** — the sidebar only shows
   "Register Complaint" unlocked; other sections show a lock icon
4. **File a complaint**: pick a category, describe the issue, choose
   State → District → Taluka → City → Ward, submit
5. Click **"Become a Member"** in the sidebar → goes to `/membership` →
   click **Pay ₹499 & Become a Member** (this is a mock payment, nothing is
   actually charged) → you're marked as a member and redirected back
6. Sidebar now unlocks: **New Client Entry**, **All Clients**,
   **All Complaints**
7. **New Client Entry**: fill personal details (note: Age is now entered as
   **Date of Birth** — day/month/year dropdowns, age is calculated
   automatically), verify the **mobile number via OTP** (separate from the
   Aadhar OTP), verify **Aadhar via OTP**, then move to location details and
   submit
8. **All Clients** / **All Complaints**: view everything submitted so far —
   only visible to members

## Where data is stored (temporary, for local testing only)

JSON files in `data/`, created automatically:

- `data/users.json` — phone number + membership status
- `data/clients.json` — submitted client records (masked Aadhar only)
- `data/complaints.json` — submitted complaints

This is a stand-in for a real database — replace `lib/db.ts` with real
queries against Postgres (Supabase/Neon) before going live. `data/` is
already excluded via `.gitignore`.

## Going live: three separate integrations needed

### 1. Login OTP (phone number verification)
Mocked in `app/api/auth/send-otp/route.ts` and
`app/api/auth/verify-otp/route.ts`. Replace with a real SMS/OTP provider.

### 2. Mobile number verification on the client form
Mocked in `app/api/mobile-otp/send/route.ts` and
`app/api/mobile-otp/verify/route.ts`. Same kind of provider as above — can
reuse the same SMS provider/account as login OTP.

### 3. Aadhar verification
Mocked in `app/api/aadhar/send-otp/route.ts` and
`app/api/aadhar/verify-otp/route.ts`. This one is regulated — needs a
licensed KYC provider like Setu, Surepass, Cashfree, or HyperVerge (not a
generic SMS provider), since Aadhar authentication requires UIDAI
AUA/KUA licensing that only these intermediaries hold.

### 4. Payment (Razorpay)
Mocked in `app/api/membership/create-order/route.ts` and
`app/api/membership/verify-payment/route.ts`. Full instructions for wiring
up real Razorpay (order creation, checkout.js, signature verification) are
written as comments directly in those two files. You'll need:

```
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
```

in a `.env.local` file, plus `npm install razorpay`.

## Publishing to the Play Store (once deployed live)

The recommended path is to turn this into a PWA (add a manifest + icons)
and wrap it with Google's Trusted Web Activity (TWA) tooling — this
packages the live website into a real installable Android app without a
rewrite. Requires: the app deployed on a real HTTPS domain (not
localhost), a Google Play Developer account ($25 one-time), a privacy
policy page, and app store assets (icon, screenshots).

## Project structure

```
app/
  page.tsx                          Redirects to /dashboard
  login/page.tsx                    Phone + OTP login (auto-registers new numbers)
  dashboard/page.tsx                Dashboard (protected, membership-aware)
  membership/page.tsx               Membership payment page
  api/auth/                         Phone OTP send/verify, logout
  api/mobile-otp/                   Mobile number verification (on the client form)
  api/aadhar/                       Aadhar OTP send/verify (mock)
  api/membership/                   Order creation + payment verification (mock Razorpay)
  api/clients/                      List (members only) and create (members only) client records
  api/complaints/                   List (members only) and create (any logged-in user) complaints
components/
  Login/                            PhoneLoginForm, LogoutButton
  Membership/                       MembershipCard
  Dashboard/                        DashboardShell, Sidebar, Topbar, SectionHero, ClientsTable
  Complaints/                       ComplaintForm, ComplaintsList
  ClientForm/                       2-step intake form, Aadhar OTP, Mobile OTP
lib/
  db.ts                             Mock JSON-file database (users, clients, complaints)
  schema.ts                         Zod schemas + age calculation helper
  locationData.ts                   Sample State/District/Taluka data
  session.ts                        Reads logged-in phone + membership status from cookie
middleware.ts                       Protects all routes except /login
```
