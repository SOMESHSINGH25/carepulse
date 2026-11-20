# CarePulse

CarePulse collects family feedback for home-care visits and provides an
authenticated quality dashboard. Feedback is written through the Express API;
the browser never reads or writes Firestore directly.

## Local setup

1. Install dependencies from `frontend` and `backend`:

   ```powershell
   Set-Location .\frontend
   npm install
   Copy-Item .env.example .env

   Set-Location ..\backend
   npm install
   Copy-Item .env.example .env
   ```

2. Fill in the Firebase Web App values in `frontend/.env`. These `VITE_`
   settings are public client configuration, not Admin credentials.
3. Fill `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and
   `FIREBASE_PRIVATE_KEY` in `backend/.env` from a Firebase Admin service
   account. Keep this file and the service-account key out of source control.
4. Create an administrator with Email/Password enabled in Firebase
   Authentication.
5. Start `npm run dev` in separate terminals from `backend` and `frontend`.
   The frontend uses Vite's `/api` proxy to reach `http://localhost:5000`.

The API health check is `GET http://localhost:5000/api/health`.

## Feedback and admin features

- The public page `/feedback/:token` validates its link with the backend.
- Admin routes require a Firebase ID token in the `Authorization: Bearer`
  header. The Axios client attaches the signed-in user's current token.
- Admins can create seven-day, single-use feedback links. The backend stores
  only a SHA-256 hash of each random link token and consumes a link with a
  Firestore transaction.
- Dashboard averages, nurse ratings, rating trends, NPS, low-score follow-up,
  abuse-flagged comment filtering, and CSV export are computed from Firestore
  records. NPS follows the standard promoters-minus-detractors formula.
- Seed clearly labelled demo records with `npm run seed:demo` from `backend`.
  This replaces only existing records marked `synthetic: true`; it requires
  valid Firebase Admin credentials.
- Firestore client access is denied by `firestore.rules`. Deploy it with
  `firebase deploy --only firestore:rules` after selecting the intended
  Firebase project.

Email delivery and sentiment analysis are not included.

## Checks

Run `npm run build` and `npm run lint` from `frontend`, and `npm test` from
`backend`. The backend tests cover health, unauthenticated admin access,
public form validation, comment filtering, and CSV formula-injection handling.
