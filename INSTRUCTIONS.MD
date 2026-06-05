# Migration Plan: Health Passport (Broken → Working)

## Overview
Migrate all features from `../health-passport(old)` to the working `health-passport` app while maintaining the Cloudflare deployment configuration already in place.

## Current Working App Status
- ❌ Make authentication refresh tokens more persistent with browser cookies when available to reduce postmark api usage
- ❌ Add optional submission start time for forms
- ❌ Strict enforcement of at least one required question is needed so that empty form responses can't be submitted
- ❌ Error message missing to display cause of form creation failure
- ❌ Allow non-admins to see list of active forms
- ❌ Allow searching for forms by name (admins can search all forms, users can search for forms filtered for current time prior to submissions_expiry)
- ❌ Allow question order to be changed on form page with up and down arrows that can be clicked on the right side of the question's div
- ⚠️ Add google sheets connection admins can set so that each form entry is appended to a sheet with an optional tab name to be set
- ⚠️ Allow duplicating forms where the user enters a new name and a new form id is generated on the backend (requires adding new API route)
- ⚠️ Allow enabling eventbrite verification where a user id is checked for existence as a ticket id for an eventbrite event (requires adding column for eventbrite api key and event id to forms table. event brite api key and event id can be updated in each form's admin dashboard, ticket qr codes contain an extended version of the ticket id and may need to be truncated to be checked with the api)
- ✅ TanStack Start Solid configured with @tanstack/solid-start
- ✅ Vite build outputting to `dist/client` and `dist/server`
- ✅ wrangler.jsonc configured for Pages deployment with nodejs_compat
- ✅ scripts/build-worker.js creates Cloudflare worker entry point
- ✅ TanStack Query integration
- ✅ PostHog integration
- ✅ Cloudflare env types configured
- ⚠️ Still contains demo routes (posts, users, etc.) - needs removal
- ⚠️ Styles still Tailwind-based - needs swap to old CSS variables design system
- ⚠️ Missing router context wiring for QueryClient in root layout


## Features to Migrate from Broken App

### 1. Core Types and Utilities

| Type/Util | File | Description | Status |
|-----------|------|-------------|--------|
| DynamicFormSchema | src/types/form.ts | Form schema interface with field types, metadata | ✅ Present in `form.ts` |
| QuestionType | src/types/form.ts | Union type: text, numerical, scale_1_10, boolean, likert | ✅ Present in `form.ts` |
| extractTimestampFromUUIDv7 | src/utils/uuid.ts | Extract time from UUIDv7 IDs | ✅ Present |
| Auth helpers | src/utils/auth.ts | Magic link and auth utilities | ✅ Present |

### 2. API Routes (src/routes/api/)

| Endpoint | Method | Handler | Status |
|----------|--------|---------|--------|
| /api/form-settings | GET | getFormDefinition | ✅ Present |
| /api/admin/get-all-forms | GET | getAllForms | ✅ Present |
| /api/admin/create-form | POST | createForm | ✅ Present |
| /api/admin/remove-form | DELETE | deleteForm | ✅ Present |
| /api/admin/form-submissions | GET | getFormSubmissions | ✅ Present |
| /api/submissions | POST | createSubmission | ✅ Present |
| /api/admin/submissions-by-user | GET | getSubmissionsByUser | ✅ Present |
| /api/admin/email-csv-report | POST | emailCsvReport | ✅ Present |
| /api/admin/toggle-overwrite | PATCH | toggleOverwrite | ✅ Present |
| /api/admin/toggle-expiry | PATCH | toggleExpiry | ✅ Present  |
| /api/global-settings | GET | getGlobalSettings | ✅ Present |
| /api/global-settings | PATCH | updateGlobalSettings | ✅ Present |

### 3. Web Pages (src/routes/)

| Route | File | CSS Module | Status |
|-------|------|------------|--------|
| `/` | index.tsx | None (inline) | ✅ Present - still using Tailwind inline classes |
| `/about` | about.tsx | None (inline) | ❌ Missing |
| `/form` | form.tsx | FormRoute.module.css | ✅ Present |
| `/admin/forms` | admin.forms.tsx | AdminForms.module.css | ✅ Present |
| `/admin/create` | admin.create.tsx | None (inline) | ✅ Present |
| `/admin/login` | admin.login.tsx | None (inline) | ✅ Present |
| `/admin/lookup` | admin.lookup.tsx | None (inline) | ✅ Present |
| `/admin/settings` | admin.settings.tsx | AdminSettings.module.css | ✅ Present |

### 4. UI Components (src/components/)

| Component | File | CSS Module | Status |
|-----------|------|------------|--------|
| Header | Header.tsx | Header.module.css | ✅ Present - not yet integrated in root layout |
| PublicFormView | PublicFormView.tsx | Form.module.css | ✅ Present |
| AdminAnalyticsDashboard | AdminAnalyticsDashboard.tsx | Admin.module.css | ✅ Present |
| ErrorModal | ErrorModal.tsx | None (inline) | ✅ Present |
| QRScannerModal | QRScannerModal.tsx | None (inline) | ✅ Present |
| ConfirmationModal | ConfirmationModal.tsx | None (inline) | ✅ Present - extra shared component |
| DefaultCatchBoundary | DefaultCatchBoundary.tsx | N/A | ⚠️ Demo artifact - should be removed |
| NotFound | NotFound.tsx | N/A | ⚠️ Demo artifact - should be removed |
| UserError | UserError.tsx | N/A | ⚠️ Demo artifact - should be removed |
| PostError | PostError.tsx | N/A | ⚠️ Demo artifact - should be removed |

### 5. Styles (src/styles/app.css)

Current state:
- ✅ CSS modules exist for components/pages
- ❌ `src/styles/app.css` still uses Tailwind CSS (`@import 'tailwindcss'`)
- ❌ Old app's design system (CSS variables, Fraunces/Manrope fonts, sanitize.css, radial gradients) not yet applied

### 6. Static Assets (public/)

| Asset | Status |
|-------|--------|
| android-chrome-512x512.png | ✅ Present |
| android-chrome-192x192.png | ✅ Present |
| favicon.ico | ✅ Present |
| site.webmanifest | ✅ Present |
| robots.txt | ❌ Missing |

### 7. Demo Routes (Still Present - Need Removal)

| Route | File | Status |
|-------|------|--------|
| `/posts` | posts.tsx, posts.index.tsx, posts.$postId.tsx, posts_.$postId.deep.tsx | ❌ Remove |
| `/users` | users.tsx, users.index.tsx, users.$userId.tsx | ❌ Remove |
| `/deferred` | deferred.tsx | ❌ Remove |
| `/route-a` | _pathlessLayout/_nested-layout/route-a.tsx | ❌ Remove |
| `/route-b` | _pathlessLayout/_nested-layout/route-b.tsx | ❌ Remove |
| `/redirect` | redirect.tsx | ❌ Remove |
| `/customScript[.]js` | customScript[.]js.ts | ❌ Remove |

## Migration Steps Remaining

### Phase 1: Clean Foundation (In Progress)
1. Remove demo routes (posts, users, pathlessLayout, deferred, redirect, customScript)
2. Remove demo components (DefaultCatchBoundary, NotFound, UserError, PostError)
3. Remove demo utilities (src/utils/posts.tsx, src/utils/users.tsx, src/utils/loggingMiddleware.tsx)
4. Fix root layout to use Header component instead of inline nav

### Phase 2: Styles System (Pending)
1. Replace `src/styles/app.css` with old app's `src/styles.css` (CSS variables, sanitize.css, custom fonts)
2. Update index.tsx and about.tsx to use old styling patterns

### Phase 3: Pages (Pending)
1. Create missing `src/routes/about.tsx`

### Phase 4: API Routes (Partial - Missing 4 endpoints)
1. Implement `GET /api/form-settings`
2. Implement `GET /api/admin/get-all-forms`
3. Implement `PATCH /api/admin/toggle-expiry`
4. Add PATCH handler to `GET /api/global-settings` (or create separate file)

### Phase 5: Router Context (Pending)
1. Wire QueryClient into router context so `useQueryClient()` works across routes without throwing on `/admin/forms`

### Phase 6: Static Assets (Pending)
1. Add robots.txt
2. Add logo512.png, logo192.png if needed for PWA

### Phase 7: Testing and Validation
1. `pnpm install` to install dependencies
2. `pnpm run build && node scripts/build-worker.js`
3. `pnpx wrangler types` to validate config
4. Test locally with `pnpm dev`

## Styling Architecture
The old app uses CSS modules with a design system approach:
- Design tokens in `:root` CSS variables (colors, gradients)
- Each component has its own CSS module file
- Utility classes: .btn, .input, .card, .modalOverlay, etc.
- Animation keyframes: fadeInScale, shakeIn, modalSlideIn
- Fonts: Manrope (body), Fraunces (headings)

## Known Recurring Errors
Tanstack Start and Solid Start frameworks use autogeneration for routes. Building the project fixes this by generating missing types using commands `pnpm run build` or  `pnpx vite dev`

## Gitmoji Commit Plan
1. `:fire: Remove demo routes and components` - Clean foundation
2. `:recycle: Replace Tailwind CSS with old design system` - Styles migration
3. `:memo: Add about.tsx page` - Missing page
4. `:package: Add missing API endpoints` - form-settings, get-all-forms, toggle-expiry, global-settings PATCH
5. `:wrench: Fix QueryClient router context wiring` - Resolve /admin/forms error
6. `:rocket: Add static assets (robots.txt, logos)` - Finalize deployment
7. `:sparkles: Update documentation`
