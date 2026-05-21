<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/8d6fcaf7-4776-4327-8ec3-442fa0e11d3b

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Create a `.env.local` file and set:
   - `GEMINI_API_KEY`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_FIRESTORE_DATABASE_ID`
3. In Firebase Console → Authentication → Settings, add these authorized domains:
   - `localhost`
   - `127.0.0.1`
   - your Vercel domain (for example `your-app.vercel.app`)
4. Restart the dev server and run the app:
   `npm run dev`

> If you still see `auth/unauthorized-domain`, the current host is not yet authorized for your Firebase project.
> If Supabase data is missing locally, make sure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are configured in `.env.local`.
