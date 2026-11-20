# CarePulse

## 1. Project Overview

CarePulse is a full-stack home-care visit feedback and quality management
application built for TheCarePal FS-08 internship assignment. It gives
families a login-free way to rate a visit and gives authenticated care-team
administrators a dashboard for reviewing feedback and identifying visits
that may need follow-up.

The project has a React + Vite frontend and an Express API. Firebase
Authentication manages administrator sign-in; the backend uses the Firebase
Admin SDK to access Firestore. The browser does not read or write Firestore
directly.

## 2. Features

- Public family feedback form; families do not need an account.
- Four visit ratings—punctuality, quality of care, hygiene, and behaviour—on a
  1–5 scale, plus an optional comment and a 0–10 recommendation question.
- Random, single-use feedback links that expire after seven days.
- Firebase Email/Password administrator sign-in and an authenticated dashboard.
- Firestore-backed nurse rating averages, daily rating trends, NPS, and a
  low-score follow-up list.
- Basic word-list abusive-comment filtering. Flagged comments are hidden by
  default in dashboard feedback lists.
- Authenticated CSV export of feedback.
- A command to seed 24 clearly labelled synthetic feedback records.

## 3. Tech Stack

**Frontend:** React, Vite, Tailwind CSS, React Router, Axios, Firebase Web SDK,
Recharts, and Lucide React.

**Backend:** Node.js, Express, Firebase Admin SDK, Firestore, and dotenv.
Nodemon is used for backend development.

## 4. Project Setup and Running

### Prerequisites

- Node.js `^20.19.0` or `>=22.12.0` and npm.
- A Firebase project with a Firestore database and a registered Firebase Web
  App.
- Firebase Authentication with the Email/Password provider enabled.
- A Firebase Admin service account for the backend.
- Firebase CLI, if deploying the Firestore rules from this repository.

### Install dependencies

From the repository root, install each application separately:

```powershell
Set-Location .\frontend
npm install
if (!(Test-Path .env)) { Copy-Item .env.example .env }

Set-Location ..\backend
npm install
if (!(Test-Path .env)) { Copy-Item .env.example .env }
```

The copy commands create local environment files only when they do not already
exist, so they will not overwrite configured credentials.

### Configure Firebase

1. In Firebase Console, create or select the project, register a Web App, enable
   Firestore, and enable Email/Password in Authentication.
2. Set the Firebase Web App values in `frontend/.env` using
   `frontend/.env.example`: `VITE_FIREBASE_API_KEY`,
   `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`,
   `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, and
   `VITE_FIREBASE_APP_ID`. These identify the public web app; do not put Admin
   credentials in the frontend. Leave `VITE_API_BASE_URL` empty for the local
   Vite `/api` proxy.
3. Set `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and
   `FIREBASE_PRIVATE_KEY` in `backend/.env` from the Firebase Admin service
   account, using `backend/.env.example` as the template. The backend also
   reads `PORT`, `FRONTEND_URL`, and `PUBLIC_APP_URL`.
4. Create the administrator account in Firebase Authentication. There is no
   public account-registration flow.
5. Firestore client access is denied by `firestore.rules`; the backend Admin
   SDK performs privileged operations. Select the intended Firebase project
   and deploy the rule file to make that restriction active with:

   ```powershell
   firebase deploy --only firestore:rules
   ```

### Start the development servers

Run each command in a separate terminal from the repository root:

```powershell
Set-Location .\backend
npm run dev
```

```powershell
Set-Location .\frontend
npm run dev
```

The frontend is served at `http://localhost:5173` and the API at
`http://localhost:5000`. Vite proxies `/api` requests to the backend. The API
health check is `GET http://localhost:5000/api/health`.

The admin login is at `/login`, the protected dashboard at `/dashboard`, and a
family feedback link opens `/feedback/:token`.

## 5. How It Works

### Public feedback

An administrator creates a link through the dashboard. The family opens the
link without signing in; the frontend first asks the public API to validate
the token, then submits the four ratings, recommendation score, and optional
comment. The backend validates the values and writes feedback to Firestore.

### Feedback link security

The backend generates each token from 32 random bytes and returns it in the
shareable URL. Firestore stores only the token's SHA-256 hash, along with its
seven-day expiry and pending/submitted status. On submission, a Firestore
transaction checks that the link exists, is pending, and has not expired; the
same transaction writes the feedback and marks the link submitted. This
prevents a second submission using the same link.

### Admin authentication and dashboard

Administrators sign in with Firebase Email/Password. The frontend Axios client
attaches the current Firebase ID token to admin API requests. Express verifies
the token with Firebase Admin before allowing access to the dashboard,
feedback-link creation, or CSV export endpoints.

The API routes are:

- `GET` and `POST /api/public/feedback/:token` for validating links and
  submitting feedback.
- `POST /api/admin/feedback-links` for creating links.
- `GET /api/admin/dashboard` for dashboard data.
- `GET /api/admin/feedback/export.csv` for CSV export.

The dashboard derives its figures from Firestore feedback: nurse averages
combine the four visit ratings, trends group rating averages by submission
date, and low-score follow-up includes responses averaging 3 or below or
having any individual rating of 2 or below. NPS is the percentage of promoters
(scores 9–10) minus the percentage of detractors (scores 0–6); scores 7–8 are
passives. The basic word-list filter flags abusive comments and hides their
text by default; it is not contextual moderation.

CSV export is generated by the backend and includes feedback and synthetic
data indicators. Cells are escaped and formula-prefixed values are neutralized
for spreadsheet safety.

### Synthetic demo data

Run `npm run seed:demo` from `backend` to create 24 synthetic feedback
documents. The script replaces only documents already marked
`synthetic: true`; it requires working Firebase Admin credentials. Synthetic
records are labelled in the dashboard and CSV export.

## 6. Future Improvements / What I Would Build Next

These are planned improvements, not current features:

- Context-aware abusive-language moderation.
- Sentiment classification and feedback categorisation.
- Automated weekly email summaries for operations teams.
- More advanced analytics and date-based filtering.
- Additional automated tests and improved monitoring.

## 7. AI Tools Used

GitHub Copilot (Copilot SDK in VS Code) assisted with implementation planning,
code generation, debugging, review, and documentation. The developer
reviewed the final implementation and verified it with the available build,
lint, test, API, and Firebase checks.

## 8. Testing

Run the frontend checks from `frontend`:

```powershell
npm run build
npm run lint
```

Run the backend tests from `backend`:

```powershell
npm test
```

The backend tests cover the health endpoint, rejection of unauthenticated admin
requests, public feedback validation, abusive-comment detection, and CSV
formula-injection handling. The health endpoint can also be checked while the
backend is running:

```powershell
Invoke-RestMethod -Uri http://localhost:5000/api/health
```

## 9. Security Notes

- Never commit real `.env` files, service-account JSON files, private keys, or
  other Firebase Admin credentials. The repository ignore rules exclude local
  environment files and service-account key filenames.
- The committed `.env.example` files contain placeholders only. Populate local
  `.env` files privately and keep Admin credentials exclusively in the backend.
- The repository's Firestore rule file denies all client reads and writes.
  Deploy and keep that rule set active; use the authenticated backend for
  privileged Firestore access.
- Feedback tokens are stored as hashes and consumed once. Admin API routes
  require a verified Firebase ID token.
