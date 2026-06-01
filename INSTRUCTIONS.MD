# Migration Plan: Health Passport (Broken → Working)

## Overview
Migrate all features from `../health-passport(old)` to the working `health-passport` app while maintaining the Cloudflare deployment configuration already in place.

## Current Working App Status
- ✅ TanStack Start Solid configured with @tanstack/solid-start
- ✅ Vite build outputting to `dist/client` and `dist/server`
- ✅ wrangler.jsonc configured for Pages deployment with nodejs_compat
- ✅ scripts/build-worker.js creates Cloudflare worker entry point
- ✅ TanStack Query integration
- ✅ PostHog integration
- ✅ Cloudflare env types configured
- ❌ Contains demo routes (posts, users, etc.) - needs replacement
- ❌ Uses Tailwind CSS - old app uses CSS variables + custom styles

## Features to Migrate from Broken App

### 1. Core Types and Utilities

| Type/Util | File | Description | Status |
|-----------|------|-------------|--------|
| DynamicFormSchema | src/types/schema.ts | Form schema interface with field types, metadata | ❌ Missing |
| QuestionType | src/types/schema.ts | Union type: text, numerical, scale_1_10, boolean, likert | ❌ Missing |
| extractTimestampFromUUIDv7 | src/utils/uuid.ts | Extract time from UUIDv7 IDs | ❌ Missing (exists but may differ) |
| generateId | src/utils/uuid.ts | Generate UUIDv7 identifiers | ❌ Missing (exists but may differ) |
| Auth helpers | src/utils/auth.ts | Magic link and auth utilities | ❌ Missing |

### 2. API Routes (src/routes/api/-[form].ts)

All server functions to migrate (using globalThis.DB for D1):

| Endpoint | Method | Handler | Status |
|----------|--------|---------|--------|
| /api/form-definition | GET | getFormDefinition | ❌ Replace existing |
| /api/admin/get-all-forms | GET | getAllForms | ❌ Replace existing |
| /api/admin/create-form | POST | createForm | ❌ Replace existing |
| /api/admin/remove-form | DELETE | deleteForm | ❌ Replace existing |
| /api/admin/form-submissions | GET | getFormSubmissions | ❌ Replace existing |
| /api/submissions | POST | createSubmission | ❌ Replace existing |
| /api/admin/lookup-by-user | GET | getSubmissionsByUser | ❌ Replace existing |
| /api/admin/email-csv-report | POST | emailCsvReport | ❌ Replace existing |
| /api/admin/toggle-overwrite | PATCH | toggleOverwrite | ❌ Replace existing |
| /api/admin/toggle-expiry | PATCH | toggleExpiry | ❌ Replace existing |
| /api/global-settings | GET | getGlobalSettings | ❌ Replace existing |
| /api/global-settings | PATCH | updateGlobalSettings | ❌ Replace existing |

### 3. Web Pages (src/routes/)

| Route | File | CSS Module | Status |
|-------|------|------------|--------|
| `/` | index.tsx | None (inline) | ❌ Replace - use old app styling |
| `/about` | about.tsx | None (inline) | ❌ Replace with old version |
| `/form` | form.tsx | FormRoute.module.css | ❌ Missing |
| `/admin/forms` | admin.forms.tsx | AdminForms.module.css | ❌ Missing |
| `/admin/create` | admin.create.tsx | None (inline) | ❌ Missing |
| `/admin/login` | admin.login.tsx | None (inline) | ❌ Missing |
| `/admin/lookup` | admin.lookup.tsx | None (inline) | ❌ Missing |
| `/admin/settings` | admin.settings.tsx | AdminSettings.module.css | ❌ Missing |

### 4. UI Components (src/components/)

| Component | File | CSS Module | Status |
|-----------|------|------------|--------|
| Header | Header.tsx | Header.module.css | ❌ Missing - replace root nav |
| PublicFormView | PublicFormView.tsx | Form.module.css | ❌ Missing |
| AdminAnalyticsDashboard | AdminAnalyticsDashboard.tsx | Admin.module.css | ❌ Missing |
| ErrorModal | ErrorModal.tsx | None (inline) | ❌ Missing - confirm modal for overwrite |
| QRScannerModal | QRScannerModal.tsx | None (inline) | ❌ Missing - QR scanning for user ID |

### 5. Styles (src/styles.css → src/styles/app.css)

The old app uses:
- CSS variables for design system (colors, spacing)
- Custom Google Fonts (Fraunces, Manrope)
- sanitize.css import
- Radial gradients for backgrounds
- Custom utility classes (.card, .btn, .input, etc.)

Current working app uses Tailwind CSS. Need to replace with old app's styles.css.

### 6. Static Assets (public/)

| Asset | Status |
|-------|--------|
| logo512.png | ❌ Missing |
| logo192.png | ❌ Missing |
| favicon.ico | ❌ Missing |
| manifest.json | ❌ Missing |
| robots.txt | ❌ Missing |

## Migration Steps

### Phase 1: Clean Foundation
1. Remove demo routes (posts, users, etc.) from src/routes/
2. Keep essential files: __root.tsx, router.tsx, styles/app.css
3. Remove unused components (DefaultCatchBoundary, NotFound, UserError, PostError)

### Phase 2: Types and Utilities
1. Copy `src/types/schema.ts`
2. Merge/update `src/utils/uuid.ts` with old app's version
3. Copy `src/utils/auth.ts`

### Phase 3: Styles System
1. Replace `src/styles/app.css` with old app's `src/styles.css`
2. Update imports in __root.tsx to use new styles path

### Phase 4: UI Components with CSS Modules
1. Create CSS modules:
   - `src/components/Form.module.css`
   - `src/components/Admin.module.css`
   - `src/components/Header.module.css`
2. Copy components:
   - `src/components/ErrorModal.tsx`
   - `src/components/QRScannerModal.tsx`
   - `src/components/PublicFormView.tsx`
   - `src/components/AdminAnalyticsDashboard.tsx`
   - `src/components/Header.tsx`

### Phase 5: Page CSS Modules
1. Create:
   - `src/routes/AdminForms.module.css`
   - `src/routes/AdminSettings.module.css`
   - `src/routes/FormRoute.module.css`

### Phase 6: Pages
1. Copy/update all admin routes
2. Copy form.tsx
3. Update index.tsx and about.tsx with old styling

### Phase 7: API Routes
1. Replace api/-[form].ts with old app's version

### Phase 8: Root Layout
1. Update __root.tsx to use Header component instead of inline nav
2. Update router.tsx if needed

### Phase 9: Static Assets
1. Copy public/ files

### Phase 10: Testing and Validation
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
2. `:file_folder: Add types and schema definitions`
3. `:wrench: Add utility functions (auth, uuid)`
4. `:art: Add CSS modules for styling`
5. `:bento: Add UI components (shared components)`
6. `:computer: Add admin management pages`
7. `:memo: Update styles.css with design system`
8. `:package: Add API routes and static assets`
9. `:rocket: Finalize deployment configuration`
10. `:sparkles: Update documentation`