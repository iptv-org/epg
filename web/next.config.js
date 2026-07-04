/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // web/ has no ESLint config of its own. Without this, Next.js walks up
    // and inherits the repo root's eslint.config.mjs (CRLF-only, single-quote
    // rules meant for the original grabber scripts), which fails the build
    // wherever web/'s LF-committed files don't match — only visible on Linux
    // build servers, since Windows git silently rewrites LF to CRLF on
    // checkout. TypeScript's own type-check (unaffected by this) and the
    // Jest suite remain the real quality gates for web/.
    ignoreDuringBuilds: true
  },
  outputFileTracingRoot: __dirname
}
module.exports = nextConfig
