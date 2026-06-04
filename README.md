# Start Basic Cloudflare

## Getting Started

### Install the dependencies

```bash
pnpm i
```

### Start the development server

```bash
pnpm dev
```

### Build for Production

```bash
pnpm build
```

### Preview the production build

```bash
pnpm preview
```

### Deploy to Cloudflare

```sh
pnpm run deploy
```

## Accessing bindings

You can access Cloudflare bindings in server functions by using importable `env`:

```ts
import { env } from 'cloudflare:workers'
```

See `src/routes/index.tsx` for an example.

## Common Build and Deployment Errors
- Requests dependent on secrets / env vars failing (magic link login request)
    * problem: inconcistent inclusion of environment variables
    * solution: run `pnpx wrangler secret list` to check if required .env vars are available in cloud deployment
- rendering error not showing in browser console or terminal
    * problem: ssr is being used by createFileRoute
    * solution: add option `ssr: false` to createFileRoute initialization options object
- env variable / secret missing
    * problem: api functions dependent on secrets fail in cloud deployment but are successfully used from .env file on local dev server
    * solution: set missing variables as `SECRET` in cloudflare dashboard