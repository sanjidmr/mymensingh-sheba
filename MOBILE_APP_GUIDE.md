# Mymensingh Sheba Android app

## 1. Run the website and app

1. Copy `.env.example` to `.env.local` and set the public Supabase URL and anon key.
2. Website development: `npm run dev`. Website production build: `npm run build`.
3. Static Android build: `npm run build:app`. This exports `out/` and syncs it into Android.
4. Open Android Studio with `npm run android`, wait for Gradle sync, then run on an emulator or a phone with Developer options and USB debugging enabled.
5. To build assets again after replacing the source logo, run `npx capacitor-assets generate --android`.

The Android WebView talks to Supabase directly for supported client operations. Operations that still use Next.js API routes require the deployed `marketplace-api` Edge Function and a reachable `SITE_API_ORIGIN`.

## 2. Environment variables

### Website and app build

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase publishable/anon key. This is intentionally public and is protected by RLS.
- `NEXT_PUBLIC_SITE_URL`: canonical website origin, normally `https://mymensinghsheba.com`.
- Server-only on Vercel: `SUPABASE_SERVICE_ROLE_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, and `ADMIN_TELEGRAM_WORKER_SECRET`. Never add these to `NEXT_PUBLIC_*`.

Set public Supabase values in Vercel for production/preview and in `.env.local` for local builds. `npm run build:app` embeds the public values present at build time into the exported app.

### Supabase Edge Functions

- `marketplace-api` needs `SITE_API_ORIGIN=https://mymensinghsheba.com`.
- `send-push` uses Supabase's function environment (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) plus `FIREBASE_SERVICE_ACCOUNT_JSON`, set as a secret only after Firebase setup.
- `send-push` can also accept `PUSH_TRIGGER_TOKEN` for the optional Vault/`pg_net` database trigger example. Configure it only if you enable that example.
- There is no Brevo Edge Function in this repository; email integrations currently remain in the website/server configuration.

## 3. Deploy functions and database migrations

1. Apply the repository's `supabase/migrations/` in filename/timestamp order to a new project (or use the normal Supabase migration workflow for migrations not yet applied).
2. For an existing installation, ensure the current performance migration `20261112150000_performance_indexes.sql` has been applied.
3. Apply `20261112200000_device_tokens.sql` after the base schema is present. It creates the token table and user-owned RLS policies. Do not execute `supabase/examples/order-status-push.sql`; it is an optional template.
4. Deploy the Edge Functions you use:

   ```powershell
   supabase functions deploy marketplace-api
   supabase secrets set SITE_API_ORIGIN=https://mymensinghsheba.com
   supabase functions deploy send-push
   ```

   `send-push` disables gateway JWT verification so the optional database trigger can authenticate with its own token. The function itself validates user JWTs and requires an active admin for app-initiated sends.

5. Set `FIREBASE_SERVICE_ACCOUNT_JSON` only after following the Firebase section. Supabase provides its project URL and keys to Edge Functions; verify these are available in your project before deploying.
6. Only for the optional database-trigger example, set the same high-entropy `PUSH_TRIGGER_TOKEN` as a Supabase Edge Function secret and as a Supabase Vault secret named `push_trigger_token`.

## 4. Firebase push notifications

1. Create a Firebase project and register an Android app with package/application ID `com.mymensinghsheba.app`.
2. Download `google-services.json` and place it at `android/app/google-services.json`. Do not commit this file.
3. In Firebase project settings, enable the Firebase Cloud Messaging API.
4. Create a service account with permission to send FCM messages, generate its JSON key, and store the complete JSON securely. Do not place that key in the app, `.env.local`, or source control.
5. Set the Edge Function secret from a secure terminal (avoid shell history/logging where possible):

   ```powershell
   supabase secrets set FIREBASE_SERVICE_ACCOUNT_JSON='<entire service account JSON>'
   ```

6. Deploy `send-push`. The app asks for notification permission only from a signed-in profile/dashboard screen; dismissing it is safe. Push sending is admin-only. Notification data may include a safe internal `href`, for example `/profile/requests`.
7. To send pushes automatically on status updates, adapt the optional example using `pg_net` and Supabase Vault. Do not put a service-role key or Firebase key in a database trigger or client code.

Until Firebase and the migration are configured, push registration/storage/delivery are optional and the rest of the app continues to work.

## 5. Auth redirects and deep links

- App callback URI: `com.mymensinghsheba.app://auth/callback`.
- Add that exact URI to Supabase Authentication → URL Configuration → Redirect URLs.
- Keep the website callback allowed as well: `https://mymensinghsheba.com/auth/callback` (and the relevant localhost callback for development).
- Google OAuth is present. In Google Cloud Console, add the Supabase callback URL shown by the Supabase Google provider settings to **Authorized redirect URIs**. It normally has the form `https://<project-ref>.supabase.co/auth/v1/callback`. The app itself uses the custom scheme only as the post-auth redirect; it is not a Google Cloud redirect URI.
- OAuth, signup confirmation, and password recovery links route through the app intent filter and `/auth/callback`. Test with a real release-like install and the production Supabase provider configuration.

## 6. Signing and release AAB

1. From the repository root, create a private release keystore (never commit or send it):

   ```powershell
   cd android
   keytool -genkeypair -v -keystore release-key.jks -alias mymensingh-sheba -keyalg RSA -keysize 2048 -validity 10000
   ```

2. Copy `android/keystore.properties.example` to `android/keystore.properties`; fill in the real alias and passwords. The example uses `release-key.jks` in the `android/` directory.
3. Back up the keystore and its passwords in separate secure locations. Losing them can prevent updates to the published app.
4. Build the signed bundle from `android/`:

   ```powershell
   .\gradlew.bat bundleRelease
   ```

   The AAB appears at `android/app/build/outputs/bundle/release/app-release.aab`.
5. The initial version is `versionCode 1`, `versionName "1.0.0"` in `android/app/build.gradle`. Increase `versionCode` for every Play upload and update `versionName` for the user-facing release.

## 7. Play Store checklist

- Create a Play Console developer account (currently a one-time US$25 fee; check the current terms).
- Add app name, short/full descriptions, support contact, category, and content rating.
- Prepare a 512×512 store icon, a 1024×500 feature graphic, and 2–8 phone screenshots.
- Publish a publicly reachable privacy policy URL: `https://mymensinghsheba.com/privacy`.
- Complete Data safety accurately: account/contact details, user-submitted listings and photos, push device tokens when enabled, and location only if a location feature is later enabled and used.
- Set target audience and content rating, then use internal testing before production.
- New personal developer accounts may have to complete a closed test with testers for a required period before production access. Check the current requirement displayed in Play Console before planning release.

## 8. Common issues

- **White screen:** confirm `npm run build:app` completed, `out/index.html` exists, and `npx cap sync android` ran after the latest build. Check the WebView/Logcat console for a missing public environment value.
- **API unavailable in the app:** deploy `marketplace-api`, set `SITE_API_ORIGIN`, ensure the Vercel site is reachable, and confirm the request is in the Edge Function allow-list.
- **Login returns to the website or fails:** add the custom callback URI to Supabase Redirect URLs, deploy a build with the current `capacitor.config.ts`, sync Android, and confirm the installed app uses the expected application ID.
- **Push does not arrive:** apply the device-token migration, add `google-services.json`, enable FCM, grant notification permission, verify the `FIREBASE_SERVICE_ACCOUNT_JSON` secret, and test with a token from the same Firebase project.
- **Gradle fails:** sync dependencies in Android Studio, use the JDK version required by the installed Android Gradle Plugin, check SDK/platform installation, and inspect the first Gradle error rather than the final summary.

## 9. Release updates

1. Increment `versionCode` (and update `versionName`) in `android/app/build.gradle`.
2. Build and sync with `npm run build:app`.
3. From `android/`, run `.\gradlew.bat bundleRelease`.
4. Upload the new AAB to the intended Play track and complete its release checklist.

## Source app assets

The Android launcher and splash resources were generated from the existing `public/logo.webp`. When final artwork is ready, replace the source images in `assets/` (`icon-only.png`, `icon-foreground.png`, `icon-background.png`, `splash.png`, and `splash-dark.png`) and regenerate the Android resources.
